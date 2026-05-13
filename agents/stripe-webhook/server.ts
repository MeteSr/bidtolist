/**
 * BidtoList Stripe Webhook Server
 *
 * Exposes two endpoints:
 *   POST /api/stripe/create-checkout-session  — creates a Stripe Checkout session
 *   POST /api/stripe/webhook                  — receives Stripe events
 *
 * When STRIPE_SECRET_KEY is not set the server runs in mock mode:
 * create-checkout-session returns { url: null, mock: true } and the
 * webhook endpoint acknowledges all requests without processing them.
 */

import express from "express";
import cors from "cors";
import Stripe from "stripe";

const PORT             = process.env.STRIPE_SERVER_PORT || 3003;
const STRIPE_SECRET    = process.env.STRIPE_SECRET_KEY || "";
const WEBHOOK_SECRET   = process.env.STRIPE_WEBHOOK_SECRET || "";
const PRICE_ID         = process.env.STRIPE_PRICE_PLATFORM_FEE || "";
const FRONTEND_ORIGIN  = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET, { apiVersion: "2024-11-20.acacia" }) : null;

const app = express();

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

// Webhook must receive the raw body for signature verification — skip json()
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
    // Mock mode — no Stripe keys configured
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
    // Mock mode
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
      console.log(`Payment confirmed for fee ${feeId} — marking paid`);
      // TODO: call fee canister markFeePaid(feeId) via ICP admin agent
      // Requires wiring an admin Ed25519 identity from WEBHOOK_IDENTITY_SEED
    }
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  const mode = stripe ? "live" : "mock";
  console.log(`Stripe webhook server [${mode}] on :${PORT}`);
});
