# RipFly — Airline Claim Flows (Phase 0 Research)

## IndiGo (6E) — BluChip Loyalty Program

**Tested**: April 2026

### Account Creation
- Requires signup at goindigo.in
- OTP sent to **both email and phone** — dual verification
- Cannot be automated without user involvement

### Retro-Claim Process
- **URL**: https://www.goindigo.in/loyalty/dashboard/retro-claim.html
- User must be logged into their IndiGo/BluChip account
- Form requires: **PNR** and **Last Name**
- Submits claim for review

### Constraints
- **90-day window**: Retro-claim must be done within 90 days of the flight date
- Flights older than 90 days are rejected with: "PNR not eligible for Retro Claim"
- This is a hard constraint — no workaround

### Automation Feasibility
- **Account creation**: Not automatable (dual OTP)
- **Login**: Not automatable (OTP on each login)
- **Claim submission**: Could technically be automated IF already logged in, but login barrier makes it impractical
- **Verdict**: Guided claim only. Deep-link user to retro-claim page with PNR + last name ready to paste.

### Guided Claim UX
1. Show user their detected IndiGo flight
2. Show countdown: "X days left to claim"
3. "Claim Now" button:
   - If user has BluChip account → deep-link to retro-claim page + copy PNR/last name
   - If user doesn't have BluChip account → guide them to sign up first, then claim
4. User returns and marks claim as submitted

---

## Air India (Flying Returns)

**Status**: Not yet tested

### TODO
- [ ] Test retro-claim process
- [ ] Document retro-claim URL
- [ ] Document required fields
- [ ] Document time window (if any)
- [ ] Document OTP/CAPTCHA requirements
- [ ] Assess automation feasibility

---

## SpiceJet (SpiceClub)

**Status**: Not yet tested

---

## Vistara (Club Vistara)

**Status**: Not yet tested

**Note**: Vistara merged with Air India (November 2024). Club Vistara members were migrated to Air India's Flying Returns. New Vistara flights are booked under Air India. Parser may still need to handle legacy Vistara booking emails for flights within the 90-day window.

---

## Summary

| Airline | Retro-Claim Window | OTP Required | Automation Feasible | Status |
|---------|-------------------|--------------|--------------------|---------| 
| IndiGo | 90 days | Yes (email + phone) | No — guided only | Tested |
| Air India | Unknown | Unknown | Unknown | Not tested |
| SpiceJet | Unknown | Unknown | Unknown | Not tested |
| Vistara | N/A (merged into Air India) | N/A | N/A | N/A |

## Key Takeaway

The 90-day window makes RipFly a **proactive monitoring tool**, not a retroactive recovery tool. The product must detect flights early and remind users before the window closes. Speed of detection and reminder cadence are the core value drivers.
