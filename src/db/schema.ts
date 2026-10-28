import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------
export const userRoleEnum = pgEnum("user_role", [
  "platform_admin",
  "owner",
  "manager",
  "cashier",
]);

export const userStatusEnum = pgEnum("user_status", ["active", "disabled"]);

export const businessStatusEnum = pgEnum("business_status", [
  "trial",
  "active",
  "suspended",
  "cancelled",
]);

export const planEnum = pgEnum("plan", ["starter", "growth", "pro", "enterprise"]);

export const billingCycleEnum = pgEnum("billing_cycle", ["monthly", "annual"]);

export const tillStatusEnum = pgEnum("till_status", ["closed", "open"]);

export const orderStatusEnum = pgEnum("order_status", ["completed", "voided", "refunded"]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "mobile_money",
  "other",
]);

// ---------- Businesses (Tenants) ----------
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull(),
  businessType: varchar("business_type", { length: 60 }).default("restaurant").notNull(),
  email: varchar("email", { length: 190 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  address: text("address"),
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  taxRate: numeric("tax_rate", { precision: 6, scale: 3 }).default("0").notNull(),
  status: businessStatusEnum("status").default("trial").notNull(),
  plan: planEnum("plan").default("starter").notNull(),
  billingCycle: billingCycleEnum("billing_cycle").default("monthly").notNull(),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  nextBillingDate: timestamp("next_billing_date", { withTimezone: true }),
  suspendedReason: text("suspended_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("businesses_slug_idx").on(table.slug),
}));

// ---------- Users ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 190 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  pin: varchar("pin", { length: 10 }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
}));

// ---------- Categories ----------
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Inventory items ----------
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  name: varchar("name", { length: 150 }).notNull(),
  sku: varchar("sku", { length: 60 }),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  cost: numeric("cost", { precision: 10, scale: 2 }).default("0").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default("0").notNull(),
  lowStockThreshold: numeric("low_stock_threshold", { precision: 10, scale: 2 }).default("5").notNull(),
  trackInventory: boolean("track_inventory").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Tills (registers) ----------
export const tills = pgTable("tills", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  status: tillStatusEnum("status").default("closed").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Till Sessions ----------
export const tillSessions = pgTable("till_sessions", {
  id: serial("id").primaryKey(),
  tillId: integer("till_id").notNull().references(() => tills.id, { onDelete: "cascade" }),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  openingCash: numeric("opening_cash", { precision: 10, scale: 2 }).default("0").notNull(),
  closingCash: numeric("closing_cash", { precision: 10, scale: 2 }),
  expectedCash: numeric("expected_cash", { precision: 10, scale: 2 }),
  cashDifference: numeric("cash_difference", { precision: 10, scale: 2 }),
  status: tillStatusEnum("status").default("open").notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  note: text("note"),
});

// ---------- Orders ----------
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  tillId: integer("till_id").notNull().references(() => tills.id),
  tillSessionId: integer("till_session_id").notNull().references(() => tillSessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  orderNumber: varchar("order_number", { length: 40 }).notNull(),
  customerName: varchar("customer_name", { length: 120 }),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxTotal: numeric("tax_total", { precision: 10, scale: 2 }).default("0").notNull(),
  discountTotal: numeric("discount_total", { precision: 10, scale: 2 }).default("0").notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("cash").notNull(),
  status: orderStatusEnum("status").default("completed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- Order items ----------
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItems.id, { onDelete: "set null" }),
  name: varchar("name", { length: 150 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
});

// ---------- Subscription payment log ----------
export const subscriptionPayments = pgTable("subscription_payments", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  plan: planEnum("plan").notNull(),
  billingCycle: billingCycleEnum("billing_cycle").notNull(),
  note: text("note"),
  recordedByUserId: integer("recorded_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
