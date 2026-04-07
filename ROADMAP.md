# RipFly — Roadmap

## Phase 0: Validation ✅ COMPLETE

**Goal**: Confirm that retro-claiming miles is actually doable.

**Findings** (April 2026):
- [x] IndiGo: 90-day retro-claim window, dual OTP (email + phone), form needs PNR + last name only
- [ ] Air India: Not yet tested
- [ ] Other airlines: Not yet tested
- [x] Automation verdict: Not feasible due to OTP — guided claim is the right approach
- [x] Documented in [CLAIM-FLOWS.md](CLAIM-FLOWS.md)

**Key insight**: Product is a **proactive monitoring + reminder tool**, not a retroactive recovery tool. The 90-day countdown is the core feature.

---

## Phase 1: Flight Detection + Dashboard

**Goal**: Users connect Gmail and see their detected flights with claim deadlines.

**Scope**:
- [ ] Project setup (Next.js, Vercel Postgres, Tailwind, shadcn/ui)
- [ ] Google OAuth — sign up / sign in
- [ ] Gmail OAuth — request read-only email access
- [ ] Email scanner — query Gmail API for airline booking emails
- [ ] Email parser — extract PNR, airline, dates, route from IndiGo emails
- [ ] Email parser — extract same from Air India emails
- [ ] Store detected flights in database
- [ ] Dashboard page — list of detected flights
- [ ] **Countdown timer** per flight — "X days left to claim"
- [ ] Color-coded urgency (green > 60 days, yellow 30-60, red < 30, expired)
- [ ] Basic user settings page (connected accounts)

**Not in scope**: Claiming, reminders, notifications.

---

## Phase 2: Guided Claiming + Reminders

**Goal**: Users can claim miles with RipFly's guidance and get reminded before deadlines.

**Scope**:
- [ ] "Claim Now" button per flight
- [ ] Per-airline claim guide (step-by-step instructions)
- [ ] Deep-link to IndiGo retro-claim page
- [ ] Copy-to-clipboard for PNR and last name
- [ ] User updates claim status manually (Submitted / Credited / Failed)
- [ ] Claim history view
- [ ] **Email reminders** — at 60 days, 30 days, 7 days before window closes
- [ ] Reminder preferences in settings

**Not in scope**: Automation, push notifications, SMS/WhatsApp.

---

## Phase 3: Background Sync + Polish

**Goal**: Ongoing flight detection without manual triggers. Production-ready UX.

**Scope**:
- [ ] Vercel Cron job — scan emails periodically
- [ ] Incremental sync (only fetch new emails since last scan)
- [ ] Notification for newly detected flights
- [ ] Onboarding flow improvements (explain value prop, show countdown immediately)
- [ ] Error handling and edge cases in email parsing
- [ ] Add SpiceJet email parser (if retro-claim is validated)
- [ ] Landing page and marketing site
- [ ] Google OAuth consent screen — submit for verification

**Not in scope**: Automation, paid features.

---

## Phase 4: Growth + Monetization (Future)

**Scope**:
- [ ] More airlines (Emirates, Etihad, international carriers)
- [ ] WhatsApp / SMS reminders (premium feature)
- [ ] Credit card miles optimization suggestions
- [ ] Corporate travel integration
- [ ] Mobile app (React Native)
- [ ] Referral system
- [ ] Freemium model — free detection, paid multi-airline + priority reminders

---

## Phase 5: OTP Relay Automation (Future — If Needed)

**Prerequisites**:
- Guided claiming shows high initiation but low completion (users drop off at airline site)
- Infra budget for persistent Playwright server

**Scope**:
- [ ] Persistent server for headless browser (Browserbase or dedicated VM)
- [ ] IndiGo claim connector — automate form fill, pause for OTP
- [ ] OTP input UI — prompt user to enter OTP received on phone
- [ ] Complete claim submission in background after OTP
- [ ] Error handling and retry for timeout / OTP expiry
- [ ] Manual fallback when automation fails

**Note**: Only build this if guided claiming conversion data shows users want to claim but are dropping off at the airline's site. If guided works well enough, skip this entirely.

---

## Phase 6: Airline Partnerships (The Real Play)

**Prerequisites**:
- 5,000+ connected users
- Data showing claim volume driven per airline
- Proven reminder-to-claim conversion rates

**Scope**:
- [ ] Build a data deck: flights detected, claims initiated, claims completed per airline
- [ ] Approach IndiGo loyalty team with partnership proposal
- [ ] Negotiate API access for retro-claim submission
- [ ] Build API-based claim connector (replaces guided + OTP relay)
- [ ] Expand to Air India, SpiceJet partnerships
- [ ] Explore revenue share or referral fee model

**The pitch**: "We drive thousands of loyalty signups and retro-claims to your platform. Active loyalty members fly more. Give us an API and we'll scale this further."

**Long-term vision**: RipFly becomes the loyalty middleware — airlines integrate with us because we drive engagement across all their programs.

---

## Timeline Estimates

| Phase | Duration | Dependencies |
|-------|----------|-------------- |
| Phase 0 | ✅ Done | — |
| Phase 1 | 5-7 days | — |
| Phase 2 | 3-5 days | Phase 1 complete |
| Phase 3 | 3-5 days | Phase 2 complete, Google OAuth approval |
| Phase 4 | Ongoing | Product-market fit signal |
| Phase 5 | TBD | Only if guided claiming completion rates are low |
| Phase 6 | TBD | 5,000+ users, claim volume data to pitch airlines |
