import {
  bigint,
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── WALLETS ──────────────────────────────────────────────────────────────────
// Monedas = para jugar. Puntos = para canjear. NUNCA mezclar.
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  coins: bigint("coins", { mode: "number" }).default(0).notNull(),
  points: bigint("points", { mode: "number" }).default(0).notNull(),
  totalCoinsSpent: bigint("totalCoinsSpent", { mode: "number" }).default(0).notNull(),
  totalPointsEarned: bigint("totalPointsEarned", { mode: "number" }).default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── CREDIT PACKAGES ──────────────────────────────────────────────────────────
export const creditPackages = mysqlTable("credit_packages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  coins: int("coins").notNull(),
  priceUsd: decimal("priceUsd", { precision: 10, scale: 2 }).notNull(),
  bonusCoins: int("bonusCoins").default(0).notNull(),
  isPopular: boolean("isPopular").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

// ─── PAYMENT ORDERS ───────────────────────────────────────────────────────────
export const paymentOrders = mysqlTable("payment_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  packageId: int("packageId").notNull(),
  paypalOrderId: varchar("paypalOrderId", { length: 128 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  amountUsd: decimal("amountUsd", { precision: 10, scale: 2 }).notNull(),
  coinsToCredit: int("coinsToCredit").notNull(),
  creditedAt: timestamp("creditedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── COIN TRANSACTIONS ────────────────────────────────────────────────────────
export const coinTransactions = mysqlTable("coin_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["purchase", "spin_debit", "spin_win", "bonus", "admin_credit"]).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  balanceAfter: bigint("balanceAfter", { mode: "number" }).notNull(),
  referenceId: varchar("referenceId", { length: 128 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── SPIN HISTORY ─────────────────────────────────────────────────────────────
export const spinHistory = mysqlTable("spin_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  betCoins: int("betCoins").notNull(),
  winCoins: int("winCoins").default(0).notNull(),
  pointsEarned: int("pointsEarned").default(0).notNull(),
  reels: text("reels").notNull(),
  isJackpot: boolean("isJackpot").default(false).notNull(),
  isFreeSpins: boolean("isFreeSpins").default(false).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  pointsCost: int("pointsCost").notNull(),
  stock: int("stock").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  category: varchar("category", { length: 64 }).default("merch").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── REDEMPTIONS ──────────────────────────────────────────────────────────────
export const redemptions = mysqlTable("redemptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  pointsSpent: int("pointsSpent").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  shippingName: text("shippingName"),
  shippingAddress: text("shippingAddress"),
  shippingCity: text("shippingCity"),
  shippingCountry: varchar("shippingCountry", { length: 64 }),
  trackingNumber: varchar("trackingNumber", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── JACKPOT ──────────────────────────────────────────────────────────────────
export const jackpot = mysqlTable("jackpot", {
  id: int("id").autoincrement().primaryKey(),
  currentAmount: bigint("currentAmount", { mode: "number" }).default(125000).notNull(),
  lastWonAt: timestamp("lastWonAt"),
  lastWonBy: int("lastWonBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type CreditPackage = typeof creditPackages.$inferSelect;
export type PaymentOrder = typeof paymentOrders.$inferSelect;
export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type SpinRecord = typeof spinHistory.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Redemption = typeof redemptions.$inferSelect;