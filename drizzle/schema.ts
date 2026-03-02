import {
  bigint,
  boolean,
  decimal,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ─── ENUMS ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const txTypeEnum = pgEnum("tx_type", ["purchase", "spin_debit", "spin_win", "bonus", "admin_credit"]);
export const redemptionStatusEnum = pgEnum("redemption_status", ["pending", "processing", "shipped", "delivered", "cancelled"]);

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── WALLETS ──────────────────────────────────────────────────────────────────
// Monedas = para jugar. Puntos = para canjear. NUNCA mezclar.
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  coins: bigint("coins", { mode: "number" }).default(0).notNull(),
  points: bigint("points", { mode: "number" }).default(0).notNull(),
  totalCoinsSpent: bigint("totalCoinsSpent", { mode: "number" }).default(0).notNull(),
  totalPointsEarned: bigint("totalPointsEarned", { mode: "number" }).default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── CREDIT PACKAGES ──────────────────────────────────────────────────────────
export const creditPackages = pgTable("credit_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  coins: integer("coins").notNull(),
  priceUsd: decimal("priceUsd", { precision: 10, scale: 2 }).notNull(),
  bonusCoins: integer("bonusCoins").default(0).notNull(),
  isPopular: boolean("isPopular").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
});

// ─── PAYMENT ORDERS ───────────────────────────────────────────────────────────
export const paymentOrders = pgTable("payment_orders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  packageId: integer("packageId").notNull(),
  paypalOrderId: varchar("paypalOrderId", { length: 128 }),
  status: paymentStatusEnum("status").default("pending").notNull(),
  amountUsd: decimal("amountUsd", { precision: 10, scale: 2 }).notNull(),
  coinsToCredit: integer("coinsToCredit").notNull(),
  creditedAt: timestamp("creditedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── COIN TRANSACTIONS ────────────────────────────────────────────────────────
export const coinTransactions = pgTable("coin_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: txTypeEnum("type").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  balanceAfter: bigint("balanceAfter", { mode: "number" }).notNull(),
  referenceId: varchar("referenceId", { length: 128 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── SPIN HISTORY ─────────────────────────────────────────────────────────────
export const spinHistory = pgTable("spin_history", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  betCoins: integer("betCoins").notNull(),
  winCoins: integer("winCoins").default(0).notNull(),
  pointsEarned: integer("pointsEarned").default(0).notNull(),
  reels: text("reels").notNull(),
  isJackpot: boolean("isJackpot").default(false).notNull(),
  isFreeSpins: boolean("isFreeSpins").default(false).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  pointsCost: integer("pointsCost").notNull(),
  stock: integer("stock").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  category: varchar("category", { length: 64 }).default("merch").notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── REDEMPTIONS ──────────────────────────────────────────────────────────────
export const redemptions = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  productId: integer("productId").notNull(),
  pointsSpent: integer("pointsSpent").notNull(),
  status: redemptionStatusEnum("status").default("pending").notNull(),
  shippingName: text("shippingName"),
  shippingAddress: text("shippingAddress"),
  shippingCity: text("shippingCity"),
  shippingCountry: varchar("shippingCountry", { length: 64 }),
  trackingNumber: varchar("trackingNumber", { length: 128 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ─── JACKPOT ──────────────────────────────────────────────────────────────────
export const jackpot = pgTable("jackpot", {
  id: serial("id").primaryKey(),
  currentAmount: bigint("currentAmount", { mode: "number" }).default(125000).notNull(),
  lastWonAt: timestamp("lastWonAt"),
  lastWonBy: integer("lastWonBy"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
