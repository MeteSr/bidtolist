import express from "express";
import { Resend } from "resend";

const app  = express();
const PORT = process.env.EMAIL_SERVER_PORT || 3002;
const FROM = process.env.RESEND_FROM_ADDRESS || "noreply@bidtolist.com";

const LISTING_CANISTER_ID = process.env.LISTING_CANISTER_ID || "";
const ICP_HOST            = process.env.ICP_HOST || "http://localhost:4943";
const EMAIL_IDENTITY_SEED = process.env.EMAIL_IDENTITY_SEED || "";

const resend = new Resend(process.env.RESEND_API_KEY || "");

app.use(express.json());

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN || "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  next();
});

app.options("*", (_req, res) => res.sendStatus(204));

// ── ICP listing actor ─────────────────────────────────────────────────────────

const listingIdlFactory = ({ IDL }: any) => {
  const Error = IDL.Variant({
    NotFound: IDL.Null, NotAuthorized: IDL.Null,
    InvalidInput: IDL.Text, AlreadyCancelled: IDL.Null, DeadlinePassed: IDL.Null,
  });
  const BidRequestStatus = IDL.Variant({ Open: IDL.Null, Awarded: IDL.Null, Cancelled: IDL.Null });
  const ListingBidRequest = IDL.Record({
    id: IDL.Text, address: IDL.Text, city: IDL.Text, county: IDL.Text, zipCode: IDL.Text,
    homeowner: IDL.Principal, homeownerEmail: IDL.Text, targetListDate: IDL.Int,
    desiredSalePrice: IDL.Opt(IDL.Nat), notes: IDL.Text, bidDeadline: IDL.Int,
    status: BidRequestStatus, createdAt: IDL.Int, feePaid: IDL.Bool,
  });
  return IDL.Service({
    getBidRequest: IDL.Func([IDL.Text], [IDL.Variant({ ok: ListingBidRequest, err: Error })], ["query"]),
  });
};

async function createListingActor() {
  if (!LISTING_CANISTER_ID || !EMAIL_IDENTITY_SEED) return null;
  const { HttpAgent, Actor } = await import("@dfinity/agent");
  const { Ed25519KeyIdentity } = await import("@dfinity/identity");
  const seed = Buffer.from(EMAIL_IDENTITY_SEED, "hex");
  const identity = Ed25519KeyIdentity.fromSecretKey(seed.buffer as ArrayBuffer);
  const agent = await HttpAgent.create({ identity, host: ICP_HOST });
  if (ICP_HOST.includes("localhost")) {
    await agent.fetchRootKey().catch(() => {});
  }
  return Actor.createActor(listingIdlFactory, { agent, canisterId: LISTING_CANISTER_ID });
}

// POST /api/email/new-proposal
// Notify homeowner that a new proposal has been submitted.
// Accepts { requestId } — the server fetches the homeowner email via admin identity.
// No bid details are included in the notification.
app.post("/api/email/new-proposal", async (req, res) => {
  const { requestId } = req.body as { requestId: string };
  if (!requestId) return res.status(400).json({ error: "requestId required" });

  const actor = await createListingActor();
  if (!actor) {
    console.warn("[email] ICP not wired (LISTING_CANISTER_ID / EMAIL_IDENTITY_SEED missing) — skipping notification");
    return res.json({ ok: true, skipped: true });
  }

  let homeownerEmail: string;
  let city: string;
  let deadlineDate: string;
  try {
    const result = await actor.getBidRequest(requestId) as any;
    if ("err" in result) {
      console.warn("[email] getBidRequest error:", result.err);
      return res.status(404).json({ error: "request not found" });
    }
    homeownerEmail = result.ok.homeownerEmail;
    city           = result.ok.city;
    deadlineDate   = new Date(Number(result.ok.bidDeadline) / 1_000_000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch (err) {
    console.error("[email] ICP call failed:", err);
    return res.status(502).json({ error: "canister call failed" });
  }

  if (!homeownerEmail) {
    return res.status(422).json({ error: "homeownerEmail empty on record" });
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: homeownerEmail,
      subject: `New proposal on your ${city} listing — BidtoList`,
      html: `
        <p>Good news — a licensed agent has submitted a proposal for your <strong>${city}</strong> listing.</p>
        <p>Proposals are sealed until <strong>${deadlineDate}</strong>. You'll be able to review and compare all offers once the deadline passes.</p>
        <p><a href="https://bidtolist.com/my-bids">View your listing →</a></p>
        <p style="color:#6B7280;font-size:0.85em">You're receiving this because you posted a listing on BidtoList.</p>
      `,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[email] Resend error (new-proposal):", err);
    res.status(500).json({ error: "email send failed" });
  }
});

// POST /api/email/proposal-result
// Notify an agent that their proposal was accepted or rejected.
app.post("/api/email/proposal-result", async (req, res) => {
  const { agentEmail, agentName, city, won } = req.body as {
    agentEmail: string;
    agentName: string;
    city: string;
    won: boolean;
  };

  if (!agentEmail) return res.status(400).json({ error: "agentEmail required" });

  const subject = won
    ? `Congratulations — you won the listing in ${city} — BidtoList`
    : `Listing result for ${city} — BidtoList`;

  const html = won
    ? `
      <p>Hi ${agentName},</p>
      <p>Congratulations! The homeowner has selected you as their agent for the <strong>${city}</strong> listing.</p>
      <p>A platform fee of <strong>$295.00</strong> is due. You'll receive an invoice shortly.</p>
      <p><a href="https://bidtolist.com/agents/dashboard">View your dashboard →</a></p>
    `
    : `
      <p>Hi ${agentName},</p>
      <p>The homeowner for the <strong>${city}</strong> listing has selected another agent.</p>
      <p>Keep an eye on new listings — there are always more opportunities.</p>
      <p><a href="https://bidtolist.com/agents/browse">Browse open listings →</a></p>
    `;

  try {
    await resend.emails.send({ from: FROM, to: agentEmail, subject, html });
    res.json({ ok: true });
  } catch (err) {
    console.error("[email] Resend error (proposal-result):", err);
    res.status(500).json({ error: "email send failed" });
  }
});

// POST /api/email/homeowner-code
// After an agent pays the platform fee, send the homeowner a HomeGentic promo code.
// Accepts { requestId, homegentic_code }.
app.post("/api/email/homeowner-code", async (req, res) => {
  const { requestId, homegentic_code } = req.body as { requestId: string; homegentic_code: string };
  if (!requestId)       return res.status(400).json({ error: "requestId required" });
  if (!homegentic_code) return res.status(400).json({ error: "homegentic_code required" });

  const actor = await createListingActor();
  if (!actor) {
    console.warn("[email] ICP not wired — skipping homeowner-code notification");
    return res.json({ ok: true, skipped: true });
  }

  let homeownerEmail: string;
  let city: string;
  try {
    const result = await actor.getBidRequest(requestId) as any;
    if ("err" in result) {
      console.warn("[email] getBidRequest error:", result.err);
      return res.status(404).json({ error: "request not found" });
    }
    homeownerEmail = result.ok.homeownerEmail;
    city           = result.ok.city;
  } catch (err) {
    console.error("[email] ICP call failed:", err);
    return res.status(502).json({ error: "canister call failed" });
  }

  if (!homeownerEmail) return res.status(422).json({ error: "homeownerEmail empty on record" });

  const checkoutUrl = `https://homegentic.com/checkout?bidtolist_code=${encodeURIComponent(homegentic_code)}`;

  try {
    await resend.emails.send({
      from: FROM,
      to: homeownerEmail,
      subject: "Your HomeGentic discount — compliments of BidtoList",
      html: `
        <p>Congratulations on finding your agent for the <strong>${city}</strong> listing!</p>
        <p>As a BidtoList homeowner, you're entitled to a discount on your first month of HomeGentic — the property management platform that helps you stay on top of maintenance, records, and repairs at your next home.</p>
        <p style="margin:24px 0">
          <a href="${checkoutUrl}" style="background:#1B4332;color:#fff;padding:14px 28px;text-decoration:none;font-weight:600;display:inline-block">
            Claim your discount →
          </a>
        </p>
        <p style="font-size:0.85em;color:#6B7280">
          Or enter code <strong>${homegentic_code}</strong> at homegentic.com/checkout.
          Code is valid for 90 days and can only be used once.
        </p>
        <p style="color:#6B7280;font-size:0.85em">You're receiving this because you recently completed a listing on BidtoList.</p>
      `,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[email] Resend error (homeowner-code):", err);
    res.status(500).json({ error: "email send failed" });
  }
});

// POST /api/email/agent-verified
// Notify agent that their account has been verified by admin.
app.post("/api/email/agent-verified", async (req, res) => {
  const { agentEmail, agentName } = req.body as {
    agentEmail: string;
    agentName: string;
  };

  if (!agentEmail) return res.status(400).json({ error: "agentEmail required" });

  try {
    await resend.emails.send({
      from: FROM,
      to: agentEmail,
      subject: "Your BidtoList account is verified",
      html: `
        <p>Hi ${agentName},</p>
        <p>Your BidtoList agent account has been verified. You can now browse open listing requests and submit sealed proposals.</p>
        <p><a href="https://bidtolist.com/agents/browse">Browse listings →</a></p>
      `,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[email] Resend error (agent-verified):", err);
    res.status(500).json({ error: "email send failed" });
  }
});

const icpStatus = LISTING_CANISTER_ID && EMAIL_IDENTITY_SEED ? "wired" : "no-op (LISTING_CANISTER_ID / EMAIL_IDENTITY_SEED not set)";
app.listen(PORT, () => {
  console.log(`BidtoList email server running on port ${PORT} | icp=${icpStatus}`);
});
