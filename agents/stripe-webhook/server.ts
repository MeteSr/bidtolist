/**
 * BidtoList Stripe Webhook Server
 *
 * Exposes two endpoints:
 *   POST /api/stripe/create-checkout-session  — creates a Stripe Checkout session
 *   POST /api/stripe/webhook                  — receives Stripe events
 *
 * On checkout.session.completed the webhook calls the fee canister's
 * markFeePaid, which in turn calls the listing canister's markListingFeePaid
 * to unlock the homeowner's address for the winning agent.
 *
 * Required env vars for ICP wiring:
 *   WEBHOOK_IDENTITY_SEED  — 64-char hex (32-byte Ed25519 secret key) for an
 *                            identity that is admin on the fee canister
 *   FEE_CANISTER_ID        — canister ID of the fee canister
 *   ICP_HOST               — e.g. https://ic0.app or http://localhost:4943
 *
 * When STRIPE_SECRET_KEY is not set the server runs in mock mode.
 */

import express from "express";
import cors from "cors";
import Stripe from "stripe";
import { Actor, HttpAgent } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { IDL } from "@dfinity/candid";

const PORT            = process.env.STRIPE_SERVER_PORT || 3003;
const STRIPE_SECRET   = process.env.STRIPE_SECRET_KEY  || "";
const WEBHOOK_SECRET  = process.env.STRIPE_WEBHOOK_SECRET || "";
const PRICE_ID        = process.env.STRIPE_PRICE_PLATFORM_FEE || "";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

const FEE_CANISTER_ID       = process.env.FEE_CANISTER_ID       || "";
const ICP_HOST              = process.env.ICP_HOST              || "https://ic0.app";
const WEBHOOK_IDENTITY_SEED = process.env.WEBHOOK_IDENTITY_SEED || "";

const stripe = STRIPE_SECRET
  ? new Stripe(STRIPE_SECRET, { apiVersion: "2024-11-20.acacia" })
  : null;

// ── ICP fee actor ──────────────────────────────────────────────────────────────

const feeIdlFactory = ({ IDL: I }: { IDL: typeof IDL }) => {
  const FeeStatus = I.Variant({ Owed: I.Null, Invoiced: I.Null, Paid: I.Null, Waived: I.Null });
  const FeeRecord = I.Record({
    id: I.Text, requestId: I.Text, proposalId: I.Text,
    agentId: I.Principal, homeownerId: I.Principal, amountCents: I.Nat,
    status: FeeStatus, createdAt: I.Int, updatedAt: I.Int,
  });
  const Error = I.Variant({ NotFound: I.Null, NotAuthorized: I.Null, InvalidInput: I.Text });
  const Result = I.Variant({ ok: FeeRecord, err: Error });
  return I.Service({ markFeePaid: I.Func([I.Text], [Result], []) });
};

function createFeeActor() {
  if (!FEE_CANISTER_ID || !WEBHOOK_IDENTITY_SEED) return null;
  const seed    = Buffer.from(WEBHOOK_IDENTITY_SEED, "hex");
  const identity = Ed25519KeyIdentity.fromSecretKey(seed.buffer as ArrayBuffer);
  const agent   = new HttpAgent({ identity, host: ICP_HOST });
  if (ICP_HOST.includes("localhost")) {
    agent.fetchRootKey().catch(() => {});
  }
  return Actor.createActor(feeIdlFactory, { agent, canisterId: FEE_CANISTER_ID });
}

async function markFeePaidOnChain(feeId: string): Promise<void> {
  const actor = createFeeActor();
  if (!actor) {
    console.warn("ICP not configured — skipping on-chain markFeePaid");
    return;
  }
  const result = await (actor as any).markFeePaid(feeId) as { ok?: unknown; err?: unknown };
  if (result.err) {
    throw new Error(`fee canister returned error: ${JSON.stringify(result.err)}`);
  }
}

// ── Express app ───────────────────────────────────────────────────────────────

const app = express();
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

// Webhook must receive the raw body for signature verification
app.use((req, _res, next) => {
  if (req.path === "/api/stripe/webhook") return next();
  express.json()(req, _res, next);
});

// ── Create Checkout Session ────────────────────────────────────────────────────

app.post("/api/stripe/create-checkout-session", async (req, res) => {
  const { feeId, proposalId } = req.body as { feeId?: string; proposalId?: string };

  if (!feeId) {
    res.status(400).json({ error: "feeId required" });
    return;
  }

  if (!stripe || !PRICE_ID) {
    res.json({ url: null, mock: true });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      metadata: { feeId, proposalId: proposalId ?? "" },
      success_url: `${FRONTEND_ORIGIN}/agents/dashboard?fee_paid=1`,
      cancel_url:  `${FRONTEND_ORIGIN}/agents/dashboard?fee_cancelled=1`,
    });
    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe create-session error:", err.message);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// ── Webhook ───────────────────────────────────────────────────────────────────

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe || !WEBHOOK_SECRET) {
    res.json({ received: true });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const feeId = session.metadata?.feeId;

    if (feeId) {
      try {
        await markFeePaidOnChain(feeId);
        console.log(`Fee ${feeId} marked paid — homeowner address unlocked`);
      } catch (err: any) {
        // Log but don't fail the webhook — Stripe will retry if we return non-2xx
        console.error(`markFeePaid failed for ${feeId}:`, err.message);
      }
    }
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  const stripeMode = stripe ? "live" : "mock";
  const icpMode    = FEE_CANISTER_ID && WEBHOOK_IDENTITY_SEED ? "wired" : "no-op";
  console.log(`Stripe webhook server [stripe=${stripeMode}, icp=${icpMode}] on :${PORT}`);
});
