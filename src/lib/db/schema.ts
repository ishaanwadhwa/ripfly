import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
  integer,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";

// ─── NextAuth.js required tables ────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// ─── RipFly domain tables ───────────────────────────────────────────

export const flights = pgTable(
  "flights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    airline: varchar("airline", { length: 50 }).notNull(),
    airlineName: varchar("airline_name", { length: 100 }).notNull(),
    pnr: varchar("pnr", { length: 10 }).notNull(),
    flightNumber: varchar("flight_number", { length: 10 }),
    passengerName: varchar("passenger_name", { length: 255 }),
    origin: varchar("origin", { length: 10 }),
    destination: varchar("destination", { length: 10 }),
    flightDate: date("flight_date"),
    claimWindowDays: integer("claim_window_days").default(90).notNull(),
    status: varchar("status", { length: 20 }).default("detected").notNull(),
    emailMessageId: varchar("email_message_id", { length: 255 }),
    sourceEmail: varchar("source_email", { length: 255 }),
    rawExtracted: jsonb("raw_extracted"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("flights_user_pnr_idx").on(table.userId, table.pnr),
  ]
);

export const claims = pgTable("claims", {
  id: uuid("id").defaultRandom().primaryKey(),
  flightId: uuid("flight_id")
    .references(() => flights.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  method: varchar("method", { length: 20 }).default("guided").notNull(),
  status: varchar("status", { length: 20 }).default("initiated").notNull(),
  rejectionReason: varchar("rejection_reason", { length: 50 }),
  airlineClaimRef: varchar("airline_claim_ref", { length: 100 }),
  notes: text("notes"),
  initiatedAt: timestamp("initiated_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const linkedAccounts = pgTable(
  "linked_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    googleAccountId: varchar("google_account_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: integer("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("linked_accounts_user_google_idx").on(
      table.userId,
      table.googleAccountId
    ),
  ]
);

export const reminders = pgTable("reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  flightId: uuid("flight_id")
    .references(() => flights.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  daysBeforeDeadline: integer("days_before_deadline").notNull(),
  sent: boolean("sent").default(false).notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
