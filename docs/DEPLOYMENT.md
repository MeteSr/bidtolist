# BidtoList Deployment Guide

## Local Development

```bash
# Start local ICP network, deploy all canisters, and run the frontend
npm run deploy && npm run frontend

# Or step by step:
icp network start -d
bash scripts/deploy.sh
cd frontend && npm run dev
```

## Running Tests

```bash
npm run test              # unit + integration (Vitest)
npm run test:canister     # Motoko backend (requires running local replica)
npm run test:e2e          # Playwright (requires running local replica + frontend)
```

## Frontend Development

```bash
npm run frontend
# or
cd frontend && npm run dev   # Vite at http://localhost:5174
```

---

## Agent Servers (Local)

BidtoList runs two Express servers alongside the ICP canisters. Start each in a
separate terminal:

```bash
# Email notification server (port 3002)
cd agents/email && npm install && npm run dev

# Stripe webhook + checkout server (port 3003)
# Requires @dfinity/agent — run npm install before first use
cd agents/stripe-webhook && npm install && npm run dev
```

> **Issue #43** tracks consolidating these into the HomeGentic shared agent server
> (namespaced routes at `/api/bidtolist/*`, unified rate limiting and logging).

---

## Testnet Deployment

### Automated (GitHub Actions)

Push to `main` or `develop`. The **Deploy Testnet** workflow triggers automatically
after CI passes.

Requires the `testnet` GitHub environment to be configured with the secrets below.

### Manual

```bash
bash scripts/deploy.sh testnet
```

Requires `DFX_IDENTITY_PEM` to be exported in your shell (see *Identity setup* below).

---

## GitHub Secrets — `testnet` Environment

Configure these at **Settings → Environments → testnet** in the GitHub repo:

| Secret | Description |
|---|---|
| `DFX_IDENTITY_PEM` | PEM content of the deploy identity. Export with `dfx identity export <name>` or read `~/.config/dfx/identity/<name>/identity.pem`. The identity must hold cycles (wallet funded to ≥ 5T). |
| `DFX_WALLET_ID` | Cycles wallet canister ID for the deploy identity (e.g. `xxxxx-xxxxx-xxxxx-xxxxx-cai`). Find it with `dfx identity get-wallet --network ic`. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe testnet publishable key (`pk_test_...`). Used only to embed the key in the frontend bundle — never a secret in the cryptographic sense, but kept here so the frontend build picks it up correctly. |
| `BACKUP_CONTROLLER_PRINCIPAL` | A secondary principal (e.g. hardware wallet) added as a controller on all canisters as a recovery mechanism. |

> If `DFX_WALLET_ID` is not set the deploy script skips the wallet pre-flight check
> and attempts the deploy anyway. New canister slots cost ~2.5T cycles each; the
> script will fail if the deploying identity has insufficient cycles.

### Getting your wallet ID

```bash
dfx identity use <your-identity>
dfx identity get-wallet --network ic
```

### Exporting your identity PEM

```bash
# Option A — read the file directly (plaintext storage)
cat ~/.config/dfx/identity/<name>/identity.pem

# Option B — export via dfx (encrypted storage)
dfx identity export <name>
```

Copy the full PEM block including `-----BEGIN PRIVATE KEY-----` and
`-----END PRIVATE KEY-----` into the GitHub secret.

---

## Mainnet Deployment

```bash
bash scripts/deploy.sh ic
```

Requires:
1. A funded cycles wallet (≥ 10T recommended for first deploy)
2. DFX identity with controller permissions on all canisters
3. `DFX_IDENTITY_PEM` in your shell environment
4. `VITE_STRIPE_PUBLISHABLE_KEY` in `.env` set to the live key (`pk_live_...`)

A `deploy-mainnet.yml` workflow with manual trigger and environment protection is
planned (see issue #21).

---

## Canister IDs (`canister_ids.json`)

After each non-local deploy, canister IDs are written to `canister_ids.json` and
committed back to the repo by the CI workflow. This file lets the deploy script
re-use existing canister slots on subsequent deploys instead of creating new ones.

```json
{
  "listing":  { "testnet": "xxxxx-xxxxx-...", "ic": "" },
  "agent":    { "testnet": "xxxxx-xxxxx-...", "ic": "" },
  "fee":      { "testnet": "xxxxx-xxxxx-...", "ic": "" },
  "frontend": { "testnet": "xxxxx-xxxxx-...", "ic": "" }
}
```

Do not delete or reset this file — losing the IDs means the deploy script creates
new canister slots and wastes cycles.

---

## Controller Hardening

Set `BACKUP_CONTROLLER_PRINCIPAL` before any non-local deploy to add a secondary
controller on all canisters. See [the GitHub secret table](#github-secrets--testnet-environment) above.

### Viewing current controllers

```bash
icp canister status listing -e testnet
icp canister status agent -e testnet
icp canister status fee -e testnet
```

### Rotating the primary controller

1. Add the new identity as a controller on all canisters.
2. Verify the new identity can call admin methods (`enableVerification`, `setListingCanister`, etc.).
3. Remove the old identity.
4. Rotate `DFX_IDENTITY_PEM` in GitHub Secrets.

**Never remove a controller before confirming the replacement has access.**

---

## Stripe Setup

### Local development

1. Create a Stripe account and switch to **Test mode**.
2. Create a single product — *BidtoList Platform Fee* — with a one-time price of
   **$295.00** (type `payment`, not recurring).
3. Copy the `price_xxx` ID and key pair into `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_PLATFORM_FEE=price_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from Stripe dashboard → Webhooks → your endpoint

# ICP wiring — needed to unlock the homeowner address after payment
FEE_CANISTER_ID=...               # local canister ID from icp canister id fee
ICP_HOST=http://localhost:4943
WEBHOOK_IDENTITY_SEED=<64-char hex>  # 32-byte Ed25519 secret for an identity that is admin on the fee canister
```

4. Start the Stripe server: `cd agents/stripe-webhook && npm install && npm run dev`
5. Forward webhooks locally: `stripe listen --forward-to localhost:3003/api/stripe/webhook`
6. Test with card `4242 4242 4242 4242`, any future expiry, any CVC.

### Production

1. Switch the Stripe dashboard to **Live mode**.
2. Create the same $295 product and copy the live `price_xxx` ID.
3. Set `STRIPE_SECRET_KEY=sk_live_...` and `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`.
4. Configure a Stripe webhook pointing at `https://your-domain/api/stripe/webhook`
   for the `checkout.session.completed` event.
5. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
6. Set the ICP wiring env vars on the server:
   - `FEE_CANISTER_ID` — mainnet canister ID of the fee canister
   - `ICP_HOST=https://ic0.app`
   - `WEBHOOK_IDENTITY_SEED` — 64-char hex for an Ed25519 identity that is admin on the fee canister

To generate a webhook identity seed:
```bash
node -e "const {randomBytes} = require('crypto'); console.log(randomBytes(32).toString('hex'));"
```
Then add that principal as admin on the fee canister:
```bash
dfx canister call fee addAdmin '(principal "<webhook-principal>")' --network ic
```

> **Note:** The Stripe server uses `stripe.webhooks.constructEvent` with HMAC
> signature verification on every `POST /api/stripe/webhook` request. Requests
> without a valid `stripe-signature` header are rejected with HTTP 400.

### How payment works

1. Frontend calls `POST /api/stripe/create-checkout-session` with `feeId`.
2. Server creates a Stripe Checkout session (one-time payment for `STRIPE_PRICE_PLATFORM_FEE`).
3. Agent is redirected to Stripe's hosted checkout page.
4. On success, Stripe redirects to `/agents/dashboard?fee_paid=1` and fires
   a `checkout.session.completed` webhook.
5. The webhook calls `fee.markFeePaid(feeId)` on the ICP fee canister via `@dfinity/agent`
   using the `WEBHOOK_IDENTITY_SEED` admin identity.
6. The fee canister updates the record to `#Paid` and calls back to
   `listing.markListingFeePaid(requestId)`, which flips `feePaid = true`.
7. The winning agent's next `getBidRequest` call now returns the homeowner's
   street address and email.

> **Address gate**: the homeowner's address is never returned to anyone except the homeowner,
> admins, and the winning agent **after** `feePaid == true`. Do not bypass this gate.

---

## Email Notifications

The email server uses [Resend](https://resend.com) (free tier: 3,000 emails/month).

```env
RESEND_API_KEY=re_...
RESEND_FROM_ADDRESS=noreply@bidtolist.com

# ICP wiring — needed to fetch the homeowner's email for new-proposal notifications.
# The identity must be an admin on the listing canister.
LISTING_CANISTER_ID=...           # local canister ID from icp canister id listing
ICP_HOST=http://localhost:4943    # https://ic0.app for production
EMAIL_IDENTITY_SEED=<64-char hex> # 32-byte Ed25519 secret; same generation as WEBHOOK_IDENTITY_SEED
```

To generate a seed and add the identity as admin:
```bash
node -e "const {randomBytes} = require('crypto'); console.log(randomBytes(32).toString('hex'));"
# then get its principal:
node -e "
const { Ed25519KeyIdentity } = require('@dfinity/identity');
const seed = Buffer.from('<your-64-char-hex>', 'hex');
console.log(Ed25519KeyIdentity.fromSecretKey(seed.buffer).getPrincipal().toText());
"
dfx canister call listing addAdmin '(principal "<email-server-principal>")' --network ic
```

If `LISTING_CANISTER_ID` or `EMAIL_IDENTITY_SEED` is not set, `POST /api/email/new-proposal`
logs a warning and returns `{ ok: true, skipped: true }` — the proposal still succeeds.

Three transactional email routes are available:

| Route | Trigger |
|---|---|
| `POST /api/email/new-proposal` | Agent submits a proposal — notify homeowner (no bid details sent) |
| `POST /api/email/proposal-result` | Homeowner accepts/rejects — notify agent |
| `POST /api/email/agent-verified` | Admin verifies agent account |

---

## Upgrading Canisters

All canisters use `persistent actor` — all variables are implicitly stable. No
migration hooks are required on upgrade.

```bash
bash scripts/deploy.sh          # local (upgrade in place)
bash scripts/deploy.sh testnet  # testnet (--mode auto, preserves state)
```

## Checking Status

```bash
npm run status
# or
bash scripts/status.sh
```

## Cleanup

```bash
icp network stop     # stop local replica
icp network start -d # restart fresh
bash scripts/deploy.sh
```

To fully reset local canister state:

```bash
rm -rf .icp/
icp network start -d
bash scripts/deploy.sh
```
