# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

> **HomeGentic is the source of truth for all infrastructure patterns.**
> Before solving any tooling, CI, or deployment problem, check how HomeGentic does it first.

## Commands

### Development
```bash
make dev          # Start local ICP network, deploy all canisters, run frontend (all-in-one)
make start        # icp network start -d (network only)
make deploy       # bash scripts/deploy.sh (all 3 canisters)
make frontend     # cd frontend && npm run dev (Vite dev server at :3000)
```

### Testing
```bash
cd frontend && npm run test:unit
cd frontend && npm run test:unit:watch
```

### Canister operations
```bash
make status       # Show canister health
make check-motoko # Compile-check all .mo files without a network
```

### Frontend build
```bash
cd frontend && npm run build
```

## Architecture

### Monorepo Layout

```
backend/          3 Motoko canisters
  listing/        Bid requests + proposals (core bidding engine)
  agent/          Realtor profiles + reviews
  fee/            Platform fee tracking (owed on bid win)
frontend/         React + TypeScript SPA (Vite)
scripts/          Bash deploy scripts
.github/          CI workflow
```

### Canister Map

All canisters use `persistent actor` (Motoko mo:core). All variables are implicitly stable.

| Canister | Responsibility |
|---|---|
| **listing** | Homeowner bid requests, agent proposals, sealed-bid reveal, acceptProposal |
| **agent** | Realtor profiles (license, brokerage, county), verified badge, reviews |
| **fee** | Platform fee records created on bid win; tracks Owed → Invoiced → Paid |

### Revenue Model

- **Free for homeowners** — post a listing bid request at no cost
- **Free for agents to bid** — no subscription, no per-bid fee
- **$295 win fee** — when a homeowner accepts a proposal, the winning agent owes $295
- Fee recorded in `fee` canister; collected via Stripe Checkout (one-time payment)
- **Address gate** — the homeowner's street address and email are hidden from the winning agent until
  the $295 fee is confirmed paid. Full chain: Stripe webhook → `fee.markFeePaid` → `listing.markListingFeePaid` → `feePaid = true` on the request record → `getBidRequest` returns address

### Sealed-Bid Mechanic

The `listing` canister stores proposals but does not reveal them until the `bidDeadline` passes.
The frontend enforces this: `getProposalsForRequest` returns all proposals, but the UI hides them
until `Date.now() > bidDeadline`. This is intentional — the canister is the source of truth for
data; the deadline reveal logic lives in the service layer.

### Address Privacy

`getBidRequest` redacts `address` and `homeownerEmail` for all callers except:
- The homeowner themselves
- Admins
- The winning agent **and** `feePaid == true` on the request record

The `feePaid` flag is set only by `markListingFeePaid`, callable by the fee canister or admin.
Never short-circuit this gate — it is the payment enforcement boundary.

### Frontend Service Layer

`frontend/src/services/actor.ts` creates the ICP `HttpAgent`.
- Local dev: fixed-seed Ed25519 identity (survives hot-reloads)
- Production: Internet Identity via `@icp-sdk/auth`

Each service file (listing.ts, agent.ts, fee.ts) contains the Candid IDL factory inline + mock fallback:
```typescript
if (!CANISTER_ID) return mockData;
```

### Design System

Agency-style rounded-card aesthetic — no CSS framework, all inline React styles.
Public pages (HomePage, SignUpPage, FaqPage) share these tokens:

```typescript
const S = {
  bg:        "#F4F6F8",   // light gray page background
  white:     "#FFFFFF",
  dark:      "#111827",
  muted:     "#6B7280",
  border:    "#E5E7EB",
  green:     "#2A8B57",   // primary CTA
  greenLight:"#E6F4ED",
  yellow:    "#F5C842",   // stats band, accents
  blue:      "#1B3266",   // featured card background
  blueLight: "#EBF0FF",
  peach:     "#F07858",   // decorative, step 3 accent
  peachLight:"#FEF0EB",
  sans:  "'IBM Plex Sans', sans-serif",
};
```

Rules: **rounded corners** (12–20px), `boxShadow` on cards, pill buttons (`borderRadius: 100`),
bold IBM Plex Sans headings (weight 800), no Playfair Display or IBM Plex Mono on public pages.
Nav: white background, logo mark = two colored bars (green + yellow), "Get Started →" as outlined pill.

### IDL Maintenance Rule

Whenever you add or rename a field or variant in a `.mo` file, update the matching IDL in:
1. `frontend/src/services/<canister>.ts` — inline `idlFactory` function
2. Integration test mock objects in `frontend/src/__tests__/integration/` — add any new required fields

### E2E Test Pattern (inherited from HomeGentic)

Tests use `window.__e2e_*` globals injected via `addInitScript` — no canister needed for E2E.

### Environment Variables

Copy `.env.example` to `.env`. Canister IDs are auto-populated by `scripts/deploy.sh`.

## Key Rules

- **Feature branches only** for `.mo` changes — never commit Motoko directly to main
- **Bump DEPLOY_SCRIPT_VERSION** in `scripts/deploy.sh` on every change (patch for fixes, minor for new behaviour)
- **Update tests alongside code changes** — never as a follow-up
- **No Free tier** — homeowners and agents are both free users; revenue only from winning agent fee
