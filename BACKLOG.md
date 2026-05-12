# BidtoList — Product Backlog

> Revenue target: $3k net/month | Market: Volusia + Flagler Counties, FL
> Model: free for homeowners and agents; $295 flat fee charged to winning agent on bid acceptance

---

## Epic 1 — Core Bidding Engine (MVP backend)

### #1 `listing` canister: bid request CRUD
**Canister:** `backend/listing/main.mo`
- `createBidRequest(address, county, targetListDate, desiredSalePrice, notes, bidDeadline)` → BidRequest
- `getMyBidRequests()` → [BidRequest] (homeowner)
- `getBidRequest(id)` → ?BidRequest
- `cancelBidRequest(id)` → Result
- `getOpenBidRequests()` → [BidRequest] (public, agents browse)
- Variant `BidRequestStatus = { #Open; #Awarded; #Cancelled }`
- County field: `county: Text` — "Volusia" | "Flagler"

### #2 `listing` canister: proposal submit + accept
- `submitProposal(requestId, agentName, brokerage, commissionBps, cmaSummary, marketingPlan, estimatedDaysOnMarket, estimatedSalePrice, includedServices, validUntil, coverLetter)` → Proposal
- `getProposalsForRequest(requestId)` → [Proposal] (sealed until deadline; revealed by UI)
- `getMyProposals()` → [Proposal] (agent)
- `acceptProposal(proposalId)` → Result
  - Marks winner Accepted, rejects all others, marks request Awarded
  - Calls fee canister to record fee owed (cross-canister)
- Variant `ProposalStatus = { #Pending; #Accepted; #Rejected; #Withdrawn }`

### #3 `agent` canister: profile lifecycle
**Canister:** `backend/agent/main.mo`
- `register(name, brokerage, licenseNumber, statesLicensed, county, bio, phone, email)` → AgentProfile
- `getMyProfile()` → ?AgentProfile
- `getProfile(agentId)` → ?AgentProfile
- `getAllProfiles()` → [AgentProfile]
- `updateProfile(args)` → Result
- `addReview(agentId, rating, comment, transactionId)` → Review (rate-limited 10/day, dedup by reviewer+transactionId)
- `getReviews(agentId)` → [Review]
- Admin: `verifyAgent(agentId)`, `recordListingClose(agentId, daysOnMarket)`
- `county: Text` field on profile — "Volusia" | "Flagler" | "Both"

### #4 `fee` canister: platform fee tracking
**Canister:** `backend/fee/main.mo`
- `recordFeeOwed(requestId, proposalId, agentId, homeownerId, amountCents)` — called by listing canister on acceptProposal
- `getFeesDue()` → [FeeRecord] (admin)
- `getMyFees()` → [FeeRecord] (agent sees own fees)
- `markFeeInvoiced(feeId)`, `markFeePaid(feeId)`, `waiveFee(feeId)` — admin only
- `FeeStatus = { #Owed; #Invoiced; #Paid; #Waived }`
- Default `amountCents = 29500` ($295), admin-configurable via `setPlatformFee(cents)`
- Wire from listing canister via `setListingCanisterId(id)`

---

## Epic 2 — Frontend MVP

### #5 Landing page (HomePage)
- Value prop: "Let agents compete for your listing — free, fast, no commitment"
- Dual CTA: "Post Your Home" (homeowner) | "Browse Listings" (agent)
- How it works: 3 steps (homeowner posts → agents bid blind → homeowner picks winner)
- "No subscription. Agents pay $295 only when they win."
- Trust: agent count badge, county coverage (Volusia + Flagler)

### #6 PostListingPage (homeowner)
- Form: address, county (Volusia/Flagler), target list date, desired price (optional), notes, bid deadline
- Requires auth (Internet Identity)
- Success → redirect to MyBidsPage

### #7 MyBidsPage (homeowner)
- Lists homeowner's open/awarded/cancelled bid requests
- For each open request: shows countdown to deadline; hides proposals until deadline passes
- After deadline: shows all proposals in comparison table (commissionBps, estimatedSalePrice, DOM estimate, brokerage)
- "Accept" button on each proposal → calls acceptProposal → shows success/fee confirmation

### #8 AgentRegisterPage
- Form: name, brokerage, license number, state(s) licensed, county (Volusia/Flagler/Both), bio, phone, email
- One registration per principal; update via profile edit

### #9 BrowseListingsPage (agent)
- Table of open bid requests filtered by county
- Shows: address (partial — city/zip only until agent submits proposal), target date, deadline, proposal count
- "Submit Proposal" button → opens ProposalFormPage

### #10 ProposalFormPage (agent)
- Pre-fill: requestId from URL
- Fields: commission % (converted to bps), CMA summary, marketing plan, estimated days on market, estimated sale price, included services (checkboxes), valid until, cover letter
- Submit → calls submitProposal → back to AgentDashboard

### #11 AgentDashboardPage
- List of agent's proposals grouped by status (Pending, Accepted, Rejected, Withdrawn)
- For Accepted: show platform fee notice + payment link (Stripe)
- For Pending with passed deadline: show "Waiting for homeowner decision"

---

## Epic 3 — Auth + Role Detection

### #12 Internet Identity integration
- `actor.ts`: II flow (same as HomeGentic)
- `AuthContext.tsx`: `login()`, `logout()`, `isAuthenticated`, `principal`
- `devLogin()` for local dev (fixed-seed Ed25519, bypasses II)

### #13 Role detection
- No explicit role selector — role inferred from on-chain state:
  - Has AgentProfile → agent view
  - No AgentProfile → homeowner view
- `useRole()` hook: checks agent canister on auth, returns `"homeowner" | "agent" | "unknown"`

---

## Epic 4 — Fee Collection

### #14 Stripe one-time payment on bid win
- On `acceptProposal`, backend records fee in `fee` canister
- Frontend: agent dashboard shows "Fee Owed" badge + Stripe Checkout link
- Stripe Price ID: `STRIPE_PRICE_PLATFORM_FEE` = $295 one-time
- On payment success: Stripe webhook → `markFeePaid(feeId)` via admin API

### #15 Admin fee dashboard
- Simple page (protected, admin principal only)
- Lists all fee records with status badges
- Actions: Mark Invoiced, Mark Paid, Waive
- Revenue summary: total owed, total paid MTD

---

## Epic 5 — Agent Trust

### #16 Verified agent badge
- Admin grants `isVerified = true` via `verifyAgent(agentId)`
- Badge shown on proposals and agent profile
- Criteria (manual v1): license number verified, active FL license

### #17 Post-transaction reviews
- Homeowner can review winning agent after bid is accepted
- Rate-limited: 1 review per transactionId (proposal ID as transactionId)
- Stars + comment, shown on agent's public profile

---

## Epic 6 — Email Notifications (Resend)

### #18 Notify homeowner when proposals arrive
- Trigger: agent submits proposal → email to homeowner with deadline reminder
- "You have X proposals waiting — they reveal on [deadline date]"

### #19 Notify agent when bid is won / lost
- Win: "Congratulations! You won the listing at [address]. Platform fee of $295 is due."
- Loss: "The homeowner selected another agent for [address]."

### #20 Fee invoice email
- On `markFeeInvoiced`: email agent with Stripe payment link

---

## Epic 7 — Launch

### #21 CI/CD (GitHub Actions)
- Motoko compile check on every PR
- Frontend unit tests on every PR
- Deploy to IC mainnet on merge to main (manual trigger for first deploy)

### #22 Deploy to IC mainnet
- `bash scripts/deploy.sh ic`
- Register canister IDs in `canister_ids.json`
- Set `setListingCanisterId` cross-canister wiring

### #23 Domain: bidtolist.com
- Custom domain on IC asset canister
- Configure DNS + `_acme-challenge` TXT for certificate

### #24 SEO landing page
- SSG pre-render of HomePage
- Target: "sell your home Volusia County," "find a realtor Daytona Beach"
- Meta tags, sitemap, canonical

### #25 Soft launch: Flagler County REALTORS outreach
- Attend monthly meeting
- Offer: "Free to bid — only $295 if you win. First 10 agents get first 3 wins free."
- Collect email signups for waitlist before launch

---

## Icebox

- Mobile app (React Native shell over same ICP canisters)
- Expand to adjacent FL counties: St. Johns, Putnam, Marion
- Buyer agent matching (same mechanic from buyer side)
- Video intro from agent embedded in proposal
- MLS integration for comp-pulling in CMA
- AI-generated CMA summary from public records
