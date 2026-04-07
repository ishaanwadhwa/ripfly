# RipFly — Architecture & Technical Decisions

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js (App Router) | Single codebase for frontend + API routes. Deploys to Vercel with zero config. |
| UI | Tailwind CSS + shadcn/ui | Fast to build, consistent design, no custom design system needed for MVP. |
| Database | Vercel Postgres (Neon) | Managed Postgres, no infra to set up. Free tier sufficient for MVP. |
| ORM | Drizzle ORM | Type-safe, lightweight, good Postgres support. Simpler than Prisma for this scale. |
| Auth | NextAuth.js (Auth.js v5) | Handles Google OAuth out of the box. Session management included. |
| Email API | Gmail API (REST) | Direct API access via OAuth tokens. More reliable than IMAP. |
| Background Jobs | Vercel Cron | Free tier supports up to 2 cron jobs/day (hobby) or more on Pro. Sufficient for MVP email scanning. |
| Hosting | Vercel | Frontend + API + cron in one platform. Free tier to start. |

## Key Architectural Decisions

### Decision 1: Monolith over microservices

**Choice**: Single Next.js app with API routes — no separate backend.

**Why**: For an MVP with 1-2 developers, a monolith is faster to build, deploy, and debug. Splitting into services adds deployment complexity, networking overhead, and operational burden with zero benefit at this scale.

**Revisit when**: We need long-running processes (Playwright automation) that don't fit in serverless functions.

---

### Decision 2: Guided claims only (no automation)

**Choice**: Deep-links + copy-paste instructions. No headless browsers. No automation.

**Why** (validated in Phase 0):
- IndiGo requires dual OTP (email + phone) for every login — automation is not feasible
- Guided claims prove the core value (flight detection + reminders) without the hardest engineering
- No need for a persistent server (Playwright can't run on serverless)
- Users perform the claim themselves — no TOS risk, no anti-bot concerns

**Revisit when**: An airline offers a retro-claim API or removes OTP requirements.

---

### Decision 3: Vercel Postgres over external DB

**Choice**: Use Vercel's managed Postgres (powered by Neon) instead of self-hosted or Railway.

**Why**: Zero setup, integrated with Vercel, connection pooling handled, free tier available. One less service to manage.

**Revisit when**: We hit Neon's free-tier limits or need features like pg_cron, full-text search, or large blob storage.

---

### Decision 4: Drizzle over Prisma

**Choice**: Drizzle ORM for database access.

**Why**: Lighter weight, SQL-like API, better for serverless (smaller bundle size, faster cold starts). Prisma's engine binary adds ~15MB to deployments.

**Revisit when**: We need Prisma's more mature migration tooling or relation handling.

---

### Decision 5: Store tokens encrypted, not email content

**Choice**: Store Gmail OAuth tokens (encrypted). Never persist raw email bodies.

**Why**: Security and privacy. We extract structured data (PNR, airline, dates) and discard the email content. This reduces data breach impact and simplifies GDPR compliance.

**Implementation**: Encrypt tokens at rest using AES-256. Decrypt only when making Gmail API calls.

---

### Decision 6: Vercel Cron over BullMQ/Redis

**Choice**: Use Vercel Cron for background email scanning instead of a Redis-backed job queue.

**Why**: No additional infrastructure. Cron triggers a serverless function on schedule. For MVP, scanning emails every 30 minutes per user is sufficient. We don't need real-time processing or complex job orchestration yet.

**Revisit when**: We need sub-minute polling, complex retry logic, or job prioritization.

---

## System Components

```
┌─────────────────────────────────────────────────┐
│                   Next.js App                    │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Pages    │  │  API      │  │  Cron Handler │  │
│  │          │  │  Routes   │  │               │  │
│  │ - Auth   │  │ - /auth   │  │ - Email sync  │  │
│  │ - Dash   │  │ - /flights│  │ - Parse       │  │
│  │ - Claim  │  │ - /claims │  │ - Store       │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│                      │                           │
│                      ▼                           │
│            ┌──────────────────┐                  │
│            │  Service Layer   │                  │
│            │                  │                  │
│            │ - Gmail Service  │                  │
│            │ - Parser Service │                  │
│            │ - Flight Service │                  │
│            │ - Claim Service  │                  │
│            │ - Reminder Svc   │                  │
│            └──────────────────┘                  │
│                      │                           │
└──────────────────────┼───────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌───────────┐ ┌──────────┐ ┌──────────┐
   │  Vercel   │ │  Gmail   │ │  Airline │
   │  Postgres │ │  API     │ │  Websites│
   └───────────┘ └──────────┘ └──────────┘
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/[...nextauth]` | NextAuth.js handler (Google OAuth) |
| GET | `/api/flights` | List user's detected flights |
| GET | `/api/flights/[id]` | Single flight details |
| POST | `/api/flights/scan` | Trigger manual email scan |
| POST | `/api/claims/[flightId]` | Initiate guided claim for a flight |
| PATCH | `/api/claims/[id]` | Update claim status |
| GET | `/api/claims` | List user's claims |
| POST | `/api/cron/email-sync` | Cron endpoint — scan all users' emails |
| POST | `/api/cron/send-reminders` | Cron endpoint — send claim deadline reminders |

## Email Processing Pipeline

```
Cron trigger (every 30 min)
  → Fetch users with connected Gmail
  → For each user:
      → Get last sync timestamp
      → Query Gmail API: emails after timestamp, from airline senders
      → For each email:
          → Identify airline (from address / subject)
          → Run airline-specific parser
          → Extract: PNR, flight number, date, origin, destination
          → Deduplicate against existing flights
          → Store new flights with status "detected"
      → Update last sync timestamp
```

## Reminder System

Reminders are the core engagement mechanism. Cron job runs daily, checks all flights with status `detected` or `claim_started`:

```
Daily cron
  → For each flight where status != credited/expired/ignored:
      → Calculate days remaining = flight_date + 90 - today
      → If days_remaining hits a threshold (60, 30, 7, 1):
          → Check if reminder already sent for this threshold
          → Send email reminder with claim link
      → If days_remaining <= 0:
          → Mark flight status as "expired"
```

Reminder thresholds are per-airline (IndiGo = 90 days, others TBD).

## Airline Parser Architecture

Each airline has its own parser module. Parsers are pure functions:

```
Input:  email subject + email body (text/html)
Output: { airline, pnr, flightNumber, date, origin, destination, passengerName } | null
```

Parsers live in `/src/lib/parsers/`:
- `indigo.ts` — IndiGo (6E) booking confirmations
- `airindia.ts` — Air India booking confirmations
- `index.ts` — router that picks the right parser based on sender

This is modular — adding a new airline means adding one parser file.

## Security Considerations

| Concern | Approach |
|---------|----------|
| Email access | Read-only OAuth scope (`gmail.readonly`) |
| Token storage | AES-256 encryption at rest |
| Email content | Never stored — parse and discard |
| User data | Minimal collection — email, name, flights only |
| API auth | Session-based via NextAuth.js, CSRF protection built-in |
| Cron endpoint | Protected by Vercel's `CRON_SECRET` header verification |

## Folder Structure

```
/src
  /app
    /page.tsx                  — Landing page
    /dashboard/page.tsx        — Flight dashboard
    /flights/[id]/page.tsx     — Flight detail + claim guide
    /settings/page.tsx         — Connected accounts
    /api
      /auth/[...nextauth]/route.ts
      /flights/route.ts
      /claims/route.ts
      /cron/email-sync/route.ts
  /components
    /ui/                       — shadcn/ui components
    /flight-card.tsx
    /claim-guide.tsx
    /email-connect.tsx
  /lib
    /db/
      /schema.ts               — Drizzle schema
      /index.ts                — DB client
    /gmail/
      /client.ts               — Gmail API wrapper
      /queries.ts              — Email search queries
    /parsers/
      /indigo.ts
      /airindia.ts
      /index.ts
    /auth/
      /config.ts               — NextAuth config
    /utils.ts
  /types/
    /index.ts                  — Shared types
```

## Environment Variables

```
# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Database
DATABASE_URL=               # Vercel Postgres connection string

# Security
ENCRYPTION_KEY=             # For token encryption
CRON_SECRET=                # Vercel cron endpoint protection
```
