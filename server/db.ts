import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  coinTransactions,
  creditPackages,
  jackpot,
  paymentOrders,
  products,
  redemptions,
  spinHistory,
  users,
  wallets,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

// ─── USERS ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });

  const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
  if (existing[0]) {
    await db.insert(wallets).values({ userId: existing[0].id, coins: 0, points: 0 })
      .onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── WALLET ───────────────────────────────────────────────────────────────────
export async function getWallet(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  if (!result[0]) {
    await db.insert(wallets).values({ userId, coins: 0, points: 0 }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
    return { userId, coins: 0, points: 0, totalCoinsSpent: 0, totalPointsEarned: 0 };
  }
  return result[0];
}

export async function creditCoins(userId: number, amount: number, type: "purchase" | "spin_debit" | "spin_win" | "bonus" | "admin_credit", referenceId?: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(wallets).set({ coins: sql`coins + ${amount}` }).where(eq(wallets.userId, userId));
  const wallet = await getWallet(userId);
  await db.insert(coinTransactions).values({ userId, type, amount, balanceAfter: wallet?.coins ?? 0, referenceId: referenceId ?? null, description: description ?? null });
}

export async function debitCoins(userId: number, amount: number): Promise<{ success: boolean; newBalance: number }> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const wallet = await getWallet(userId);
  if (!wallet || wallet.coins < amount) return { success: false, newBalance: wallet?.coins ?? 0 };
  await db.update(wallets).set({ coins: sql`coins - ${amount}`, totalCoinsSpent: sql`totalCoinsSpent + ${amount}` }).where(eq(wallets.userId, userId));
  const updated = await getWallet(userId);
  return { success: true, newBalance: updated?.coins ?? 0 };
}

export async function creditPoints(userId: number, points: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(wallets).set({ points: sql`points + ${points}`, totalPointsEarned: sql`totalPointsEarned + ${points}` }).where(eq(wallets.userId, userId));
}

export async function debitPoints(userId: number, points: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const wallet = await getWallet(userId);
  if (!wallet || wallet.points < points) return false;
  await db.update(wallets).set({ points: sql`points - ${points}` }).where(eq(wallets.userId, userId));
  return true;
}

// ─── CREDIT PACKAGES ──────────────────────────────────────────────────────────
export async function getCreditPackages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditPackages).where(eq(creditPackages.isActive, true)).orderBy(creditPackages.sortOrder);
}

export async function seedCreditPackages() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(creditPackages).limit(1);
  if (existing.length > 0) return;
  await db.insert(creditPackages).values([
    { name: "Paquete Aprendiz", coins: 500, priceUsd: "20.00", bonusCoins: 0, isPopular: false, sortOrder: 1 },
    { name: "Paquete Mago", coins: 1500, priceUsd: "50.00", bonusCoins: 150, isPopular: true, sortOrder: 2 },
    { name: "Paquete Rango S", coins: 4000, priceUsd: "100.00", bonusCoins: 600, isPopular: false, sortOrder: 3 },
  ]);
}

// ─── PAYMENT ORDERS ───────────────────────────────────────────────────────────
export async function createPaymentOrder(userId: number, packageId: number, amountUsd: string, coinsToCredit: number, paypalOrderId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(paymentOrders).values({ userId, packageId, paypalOrderId, amountUsd, coinsToCredit, status: "pending" });
}

export async function completePaymentOrder(paypalOrderId: string): Promise<{ userId: number; coinsToCredit: number } | null> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const orders = await db.select().from(paymentOrders)
    .where(and(eq(paymentOrders.paypalOrderId, paypalOrderId), eq(paymentOrders.status, "pending"))).limit(1);
  if (!orders[0]) return null;
  const order = orders[0];
  await db.update(paymentOrders).set({ status: "completed", creditedAt: new Date() }).where(eq(paymentOrders.paypalOrderId, paypalOrderId));
  await creditCoins(order.userId, order.coinsToCredit, "purchase", paypalOrderId, `Compra de créditos — PayPal ${paypalOrderId}`);
  return { userId: order.userId, coinsToCredit: order.coinsToCredit };
}

// ─── SPIN HISTORY ─────────────────────────────────────────────────────────────
export async function recordSpin(data: { userId: number; betCoins: number; winCoins: number; pointsEarned: number; reels: string; isJackpot: boolean; isFreeSpins: boolean; ipAddress?: string; }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(spinHistory).values(data);
}

export async function getSpinHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(spinHistory).where(eq(spinHistory.userId, userId)).orderBy(desc(spinHistory.createdAt)).limit(limit);
}

// ─── JACKPOT ──────────────────────────────────────────────────────────────────
export async function getJackpot() {
  const db = await getDb();
  if (!db) return { currentAmount: 125000 };
  const rows = await db.select().from(jackpot).limit(1);
  if (!rows[0]) { await db.insert(jackpot).values({ currentAmount: 125000 }); return { currentAmount: 125000 }; }
  return rows[0];
}

export async function incrementJackpot(amount: number) {
  const db = await getDb();
  if (!db) return;
  const rows = await db.select().from(jackpot).limit(1);
  if (!rows[0]) { await db.insert(jackpot).values({ currentAmount: 125000 + amount }); }
  else { await db.update(jackpot).set({ currentAmount: sql`currentAmount + ${amount}` }); }
}

export async function resetJackpot(wonByUserId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(jackpot).set({ currentAmount: 50000, lastWonAt: new Date(), lastWonBy: wonByUserId });
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export async function getProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.isActive, true)).orderBy(products.sortOrder);
}

export async function seedProducts() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(products).limit(1);
  if (existing.length > 0) return;
  await db.insert(products).values([
    { name: "Camiseta Roxy Migurdia", description: "Camiseta premium con arte exclusivo de Roxy. Envío gratis.", imageUrl: null, pointsCost: 5000, stock: 50, category: "merch", sortOrder: 1 },
    { name: "Camiseta Eris Boreas", description: "Camiseta premium con arte exclusivo de Eris. Envío gratis.", imageUrl: null, pointsCost: 5000, stock: 50, category: "merch", sortOrder: 2 },
    { name: "Poster Mushoku Tensei A2", description: "Poster de alta calidad con las 3 heroínas. Envío gratis.", imageUrl: null, pointsCost: 3000, stock: 100, category: "merch", sortOrder: 3 },
    { name: "Pack Coleccionista", description: "Camiseta + Poster + Stickers exclusivos. Envío gratis.", imageUrl: null, pointsCost: 12000, stock: 20, category: "bundle", sortOrder: 4 },
  ]);
}

// ─── REDEMPTIONS ──────────────────────────────────────────────────────────────
export async function createRedemption(data: { userId: number; productId: number; pointsSpent: number; shippingName: string; shippingAddress: string; shippingCity: string; shippingCountry: string; }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(redemptions).values({ ...data, status: "pending" });
}

export async function getUserRedemptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(redemptions).where(eq(redemptions.userId, userId)).orderBy(desc(redemptions.createdAt));
}
