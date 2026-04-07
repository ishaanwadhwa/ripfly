# RipFly — Never Miss Your Flight Miles

## What is RipFly?

RipFly monitors your email for flight bookings and reminds you to claim loyalty miles before the retro-claim window closes. Airlines give you a limited window (e.g., 90 days on IndiGo) to retro-claim miles — miss it and they're gone forever. RipFly makes sure you never miss it.

## Problem

Frequent travelers lose thousands of loyalty miles because:

- They don't know retro-claiming miles is possible
- Even if they do, they forget to do it within the airline's deadline
- Airlines have a **limited retro-claim window** (e.g., IndiGo: 90 days) — after that, miles are lost
- The process is manual, fragmented, and different per airline
- Booking confirmations get buried in email

The window is ticking on every flight you take.

## Solution

1. User connects Gmail
2. RipFly scans for airline booking emails
3. Detected flights appear on a dashboard **with a countdown timer**
4. RipFly sends reminders at 60 days, 30 days, and 7 days before the window closes
5. User clicks "Claim" — gets guided through the airline's retro-claim process with pre-filled details
6. User tracks claim status

## Target User

- Frequent domestic flyers in India (IndiGo, Air India, SpiceJet)
- Business travelers who expense flights but don't track miles
- Anyone who flies and doesn't have airline loyalty memberships set up

## User Flow

```
Sign up
  → Connect Gmail (Google OAuth)
  → Backend scans inbox for airline emails
  → Extracts PNR, flight details, dates
  → Dashboard shows flights with countdown: "X days left to claim"
  → Sends reminders at 60 / 30 / 7 days before window closes
  → User clicks "Claim Now"
  → Deep-links to airline retro-claim page with PNR + details ready to paste
  → User marks claim as Submitted → Credited
  → Ongoing: detects new flights automatically
```

## Core Features (MVP)

| Feature | Description |
|---------|-------------|
| Gmail Connect | OAuth with read-only email access |
| Flight Detection | Parse IndiGo and Air India booking emails |
| Flight Dashboard | List of detected flights with claim status and **countdown timer** |
| Claim Window Alerts | Reminders before the retro-claim window expires |
| Guided Claim | Deep-link to airline retro-claim page + copy-paste PNR/name |
| Claim Tracking | User updates claim status (Submitted / Credited) |

## What RipFly Is NOT (MVP)

- Not a travel booking app
- Not a price tracker
- Not automating the claim submission — guided only (airline OTP/login makes automation impractical)
- Not storing full email bodies — extract and discard

## Differentiators

| Existing Tools | RipFly |
|---------------|--------|
| Manual loyalty enrollment | Detects flights automatically from email |
| User must know retro-claim exists | Surfaces unclaimed miles proactively |
| No deadline awareness | **Countdown timer** — "X days left to claim" |
| No reminders | Multi-stage reminders before window closes |
| One airline at a time | Multi-airline detection from day 1 |
| No guidance on claim process | Step-by-step per-airline claim guide with deep-links |

## Success Metrics

| Metric | What It Tells Us |
|--------|-----------------|
| Gmail connect rate | Is the onboarding friction acceptable? |
| Flights detected per user | Is the parser working across email formats? |
| Claim initiation rate | Are users clicking "Claim"? |
| Claim success rate | Are guided claims actually resulting in credited miles? |
| Claims before deadline | Are reminders driving action before the window closes? |
| 30-day retention | Do users keep Gmail connected for ongoing monitoring? |

## Revenue Model (Future)

- **Freemium**: Free detection + 1 airline, paid for multi-airline + priority reminders
- **Premium**: SMS reminders, WhatsApp alerts, credit card miles optimization
- Revenue model is NOT part of MVP — focus on proving value first

## Validated Constraints (Phase 0 Research)

| Finding | Impact |
|---------|--------|
| IndiGo retro-claim window is **90 days** | Product must detect flights early and remind users before deadline |
| IndiGo requires **dual OTP** (email + phone) for login | Full automation is not feasible — guided claim is the right approach |
| Dedicated retro-claim URL exists for IndiGo | Can deep-link users directly to the claim page |
| Retro-claim form needs **PNR + Last Name** only | Simple — app can pre-fill both from email parsing |

See [CLAIM-FLOWS.md](CLAIM-FLOWS.md) for full research.

## Future Automation Strategy

Automation is not in MVP, but there's a clear escalation path as the product grows:

### Level 1: OTP Relay (User-Assisted Automation)

User clicks "Claim" in RipFly. RipFly drives the airline's retro-claim form in the background via headless browser. When the airline sends an OTP, RipFly prompts the user to enter it. One input from the user instead of navigating the entire airline site.

```
User clicks "Claim" in RipFly
  → RipFly opens IndiGo retro-claim in background (Playwright)
  → IndiGo sends OTP to user's phone
  → RipFly prompts: "Enter the OTP you just received"
  → User enters OTP in RipFly
  → RipFly completes claim submission in background
  → User sees: "Claim submitted!"
```

**Trade-offs**: Saves the user from navigating IndiGo's site, but still requires one user input. Needs a persistent server for Playwright (can't run on serverless). OTP is timing-sensitive — adds complexity. UX feels slightly clunky ("why is this app asking me for an OTP?").

**When to build**: Only if guided claiming has high initiation but low completion (users want to claim but drop off at the airline's site).

### Level 2: Airline Partnerships (The Real Play)

Once RipFly has meaningful user data — thousands of detected flights, proven claim conversion — approach airlines directly for API access.

**The pitch to airlines**: "We're driving thousands of loyalty signups and retro-claims to your platform. Active loyalty members fly more and are stickier. Give us an API and we'll drive even more engagement."

Airlines want loyalty program engagement. RipFly becomes a distribution channel for their loyalty programs.

**When to pursue**: 5,000+ connected users, data showing claim volume per airline, proven reminder-to-claim conversion rates.

### Level 3: Become the Loyalty Layer

RipFly becomes the middleware between travelers and all airline loyalty programs. Airlines integrate with RipFly because it drives engagement. RipFly handles detection, enrollment, claiming, and optimization across all programs.

This is the long-term vision, not an MVP feature.

### Why Guided First is the Right Strategy

- **Guided claiming collects the data** needed to make the Level 2 pitch to airlines
- **No infra cost** for Playwright servers, no anti-bot arms race
- **No TOS risk** — the user performs the claim themselves
- **Faster to ship** — can launch in days instead of weeks
- If guided claiming success rates are high enough, Level 1 may never be needed

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Airline changes retro-claim flow/URL | High | Modular per-airline configs, monitoring, manual fallback |
| Google OAuth review takes weeks | Medium | Apply early, budget 4-8 weeks for production approval |
| Email format variations across airlines | Medium | Regex + fallback patterns, test across real booking emails |
| Users don't act on reminders | Medium | Multi-channel reminders (email, push), urgency in countdown UI |
| Unknown retro-claim windows for other airlines | Medium | Research per airline before adding support |
| Low perceived value if user has few flights | Low | Target frequent flyers, show cumulative miles value |
