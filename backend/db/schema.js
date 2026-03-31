import {
  pgTable,
  serial,
  text,
  varchar,
  decimal,
  integer,
  timestamp,
  boolean,
  json,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  country: varchar("country", { length: 2 }), // ISO 3166-1 alpha-2 country code
  role: varchar("role", { length: 50 }).default("user"),
  isVerified: boolean("is_verified").default(false),
  verificationToken: text("verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  shoeFor: varchar("shoe_for", { length: 50 }), // men, women, kids
  sizes: jsonb("sizes"), // [7, 8, 9, 10]
  colors: jsonb("colors"), // ['red', 'blue']
  images: jsonb("images"), // S3 URLs
  stock: integer("stock").default(0),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  numReviews: integer("num_reviews").default(0),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cart table
export const carts = pgTable(
  "carts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    quantity: integer("quantity").default(1),
    size: varchar("size", { length: 10 }),
    color: varchar("color", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("carts_user_id_idx").on(table.userId),
    productIdIdx: index("carts_product_id_idx").on(table.productId),
    userProductIdx: index("carts_user_product_idx").on(
      table.userId,
      table.productId,
    ),
  }),
);

// Wishlist table
export const wishlists = pgTable(
  "wishlists",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("wishlists_user_id_idx").on(table.userId),
    productIdIdx: index("wishlists_product_id_idx").on(table.productId),
    userProductIdx: index("wishlists_user_product_idx").on(
      table.userId,
      table.productId,
    ),
  }),
);

// Orders table
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    orderNumber: varchar("order_number", { length: 100 }).unique(),
    items: jsonb("items"),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
    status: varchar("status", { length: 50 }).default("pending"),
    paymentIntentId: text("payment_intent_id"),
    shippingAddress: jsonb("shipping_address"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("orders_user_id_idx").on(table.userId),
    userCreatedAtIdx: index("orders_user_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
    statusIdx: index("orders_status_idx").on(table.status),
  }),
);

// Reviews table
export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    userId: integer("user_id").references(() => users.id),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    productIdIdx: index("reviews_product_id_idx").on(table.productId),
    productCreatedAtIdx: index("reviews_product_created_at_idx").on(
      table.productId,
      table.createdAt,
    ),
    productUserIdx: index("reviews_product_user_idx").on(
      table.productId,
      table.userId,
    ),
  }),
);

// Session table (used by connect-pg-simple)
export const userSessions = pgTable(
  "user_sessions",
  {
    sid: varchar("sid").notNull().primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire", { precision: 6 }).notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_user_sessions_expire").on(table.expire),
  }),
);
