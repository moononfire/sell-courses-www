import { pgTable, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const purchaseTypeEnum = pgEnum("purchase_type", ["library", "series", "bundle"]);

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  password: text("password"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const series = pgTable("series", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  priceCents: integer("price_cents").notNull(),
  position: integer("position").notNull().default(0),
  publishedAt: timestamp("published_at"),
});

export const episodes = pgTable("episodes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  seriesId: text("series_id").notNull().references(() => series.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  durationSec: integer("duration_sec"),
  videoR2Key: text("video_r2_key"),
  position: integer("position").notNull().default(0),
  isPreview: boolean("is_preview").notNull().default(false),
  publishedAt: timestamp("published_at"),
});

export const bundles = pgTable("bundles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  seriesCount: integer("series_count").notNull(),
});

export const bundleSeries = pgTable("bundle_series", {
  bundleId: text("bundle_id").notNull().references(() => bundles.id, { onDelete: "cascade" }),
  seriesId: text("series_id").notNull().references(() => series.id, { onDelete: "cascade" }),
});

export const purchases = pgTable("purchases", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  type: purchaseTypeEnum("type").notNull(),
  seriesId: text("series_id").references(() => series.id),
  bundleId: text("bundle_id").references(() => bundles.id),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amountCents: integer("amount_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseSeriesAccess = pgTable("purchase_series_access", {
  purchaseId: text("purchase_id").notNull().references(() => purchases.id, { onDelete: "cascade" }),
  seriesId: text("series_id").notNull().references(() => series.id),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

export const redeemCodes = pgTable("redeem_codes", {
  code: text("code").primaryKey(),
  email: text("email").notNull(),
  type: purchaseTypeEnum("type").notNull(),
  seriesId: text("series_id").references(() => series.id),
  bundleId: text("bundle_id").references(() => bundles.id),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amountCents: integer("amount_cents").notNull(),
  redeemedByUserId: text("redeemed_by_user_id").references(() => users.id),
  redeemedAt: timestamp("redeemed_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
