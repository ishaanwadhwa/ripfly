# RipFly — Database Schema

## Overview

Postgres database managed via Drizzle ORM. Four core tables for MVP.

## Entity Relationship

```
users 1──* email_connections
users 1──* flights
flights 1──? claims
```

---

## Tables

### users

Core user record. Created on first Google sign-in.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen | |
| email | varchar(255) | unique, not null | Google account email |
| name | varchar(255) | | Display name from Google |
| image | text | | Profile picture URL |
| created_at | timestamp | default now() | |
| updated_at | timestamp | default now() | |

---

### email_connections

OAuth credentials for Gmail access. One per user for MVP (multi-provider later).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen | |
| user_id | uuid | FK → users.id, not null | |
| provider | varchar(50) | not null, default 'gmail' | Email provider |
| access_token | text | not null | Encrypted OAuth access token |
| refresh_token | text | not null | Encrypted OAuth refresh token |
| token_expires_at | timestamp | | When access token expires |
| last_synced_at | timestamp | | Last successful email scan |
| created_at | timestamp | default now() | |
| updated_at | timestamp | default now() | |

**Indexes**: `user_id`

**Notes**:
- Tokens are AES-256 encrypted before storage
- `last_synced_at` is used for incremental email fetching

---

### flights

Detected flights extracted from email parsing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen | |
| user_id | uuid | FK → users.id, not null | |
| airline | varchar(50) | not null | Airline code (e.g., '6E', 'AI') |
| airline_name | varchar(100) | not null | Full name (e.g., 'IndiGo') |
| pnr | varchar(10) | not null | Booking reference |
| flight_number | varchar(10) | | e.g., '6E 2341' |
| passenger_name | varchar(255) | | Name on booking |
| origin | varchar(10) | | Airport code (e.g., 'DEL') |
| destination | varchar(10) | | Airport code (e.g., 'BOM') |
| flight_date | date | | Date of travel |
| status | varchar(20) | not null, default 'detected' | See status enum below |
| email_message_id | varchar(255) | | Gmail message ID (for dedup) |
| raw_extracted | jsonb | | Full parsed data for debugging |
| created_at | timestamp | default now() | |
| updated_at | timestamp | default now() | |

**Indexes**: `user_id`, `(user_id, pnr)` unique, `email_message_id`

**Status values**:
- `detected` — Flight found in email, not yet claimed
- `claim_started` — User initiated guided claim
- `claimed` — User reported claim submitted to airline
- `credited` — Miles confirmed credited
- `failed` — Claim rejected or expired
- `ignored` — User dismissed this flight

---

### claims

Tracks claim attempts per flight.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen | |
| flight_id | uuid | FK → flights.id, not null | |
| user_id | uuid | FK → users.id, not null | |
| method | varchar(20) | not null, default 'guided' | 'guided' or 'automated' |
| status | varchar(20) | not null, default 'initiated' | See status enum below |
| airline_claim_ref | varchar(100) | | Reference number from airline |
| notes | text | | User notes or error details |
| initiated_at | timestamp | default now() | |
| submitted_at | timestamp | | When user submitted to airline |
| resolved_at | timestamp | | When claim was credited/rejected |
| created_at | timestamp | default now() | |
| updated_at | timestamp | default now() | |

**Indexes**: `flight_id`, `user_id`

**Status values**:
- `initiated` — User clicked "Claim Miles"
- `submitted` — User confirmed they submitted to airline
- `pending` — Waiting for airline response
- `credited` — Miles credited successfully
- `rejected` — Airline rejected the claim
- `expired` — Claim window expired

---

## Drizzle Schema Preview

```typescript
// src/lib/db/schema.ts

import { pgTable, uuid, varchar, text, timestamp, date, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const emailConnections = pgTable('email_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  provider: varchar('provider', { length: 50 }).default('gmail').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: timestamp('token_expires_at'),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const flights = pgTable('flights', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  airline: varchar('airline', { length: 50 }).notNull(),
  airlineName: varchar('airline_name', { length: 100 }).notNull(),
  pnr: varchar('pnr', { length: 10 }).notNull(),
  flightNumber: varchar('flight_number', { length: 10 }),
  passengerName: varchar('passenger_name', { length: 255 }),
  origin: varchar('origin', { length: 10 }),
  destination: varchar('destination', { length: 10 }),
  flightDate: date('flight_date'),
  status: varchar('status', { length: 20 }).default('detected').notNull(),
  emailMessageId: varchar('email_message_id', { length: 255 }),
  rawExtracted: jsonb('raw_extracted'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('flights_user_pnr_idx').on(table.userId, table.pnr),
]);

export const claims = pgTable('claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  flightId: uuid('flight_id').references(() => flights.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  method: varchar('method', { length: 20 }).default('guided').notNull(),
  status: varchar('status', { length: 20 }).default('initiated').notNull(),
  airlineClaimRef: varchar('airline_claim_ref', { length: 100 }),
  notes: text('notes'),
  initiatedAt: timestamp('initiated_at').defaultNow().notNull(),
  submittedAt: timestamp('submitted_at'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

## Notes

- **NextAuth tables**: NextAuth.js requires its own tables (`accounts`, `sessions`, `verification_tokens`). These are handled by the Drizzle adapter and not listed here. They will be auto-created.
- **Deduplication**: The `(user_id, pnr)` unique index prevents the same flight from being stored twice per user.
- **Soft state**: Flight and claim statuses are updated in place. No audit log for MVP — add event sourcing later if needed.
- **Token encryption**: Handled at the application layer, not database layer. The `access_token` and `refresh_token` columns store ciphertext.
