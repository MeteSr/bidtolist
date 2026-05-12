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
- **$295 flat fee on bid win** — when a homeowner accepts a proposal, the winning agent owes the platform $295
- Fee is recorded in the `fee` canister; collected via Stripe one-time payment link (emailed to agent)

### Sealed-Bid Mechanic

The `listing` canister stores proposals but does not reveal them until the `bidDeadline` passes.
The frontend enforces this: `getProposalsForRequest` returns all proposals, but the UI hides them
until `Date.now() > bidDeadline`. This is intentional — the canister is the source of truth for
data; the deadline reveal logic lives in the service layer.

### Frontend Service Layer

`frontend/src/services/actor.ts` creates the ICP `HttpAgent`.
- Local dev: fixed-seed Ed25519 identity (survives hot-reloads)
- Production: Internet Identity via `@icp-sdk/auth`

Each service file (listing.ts, agent.ts, fee.ts) contains the Candid IDL factory inline + mock fallback:
```typescript
if (!CANISTER_ID) return mockData;
```

### Design System (inherited from HomeGentic)

Same editorial "blueprint" aesthetic — no CSS framework, all inline React styles.

```typescript
const ink    = "#0E0E0C";   // near-black
const paper  = "#F4F1EB";   // warm off-white
const rule   = "#C8C3B8";   // warm gray border
const rust   = "#C94C2E";   // primary accent
const serif  = "'Playfair Display', Georgia, serif";
const mono   = "'IBM Plex Mono', monospace";
const sans   = "'IBM Plex Sans', sans-serif";
```

Rules: no border-radius, 1px solid borders, mono uppercase section labels.

### IDL Maintenance Rule

Whenever you add or rename a variant in a `.mo` file, update the matching IDL in:
1. `frontend/src/services/<canister>.ts` — inline `idlFactory` function

### E2E Test Pattern (inherited from HomeGentic)

Tests use `window.__e2e_*` globals injected via `addInitScript` — no canister needed for E2E.

### Environment Variables

Copy `.env.example` to `.env`. Canister IDs are auto-populated by `scripts/deploy.sh`.

## Key Rules

- **Feature branches only** for `.mo` changes — never commit Motoko directly to main
- **Bump DEPLOY_SCRIPT_VERSION** in `scripts/deploy.sh` on every change (patch for fixes, minor for new behaviour)
- **Update tests alongside code changes** — never as a follow-up
- **No Free tier** — homeowners and agents are both free users; revenue only from winning agent fee
