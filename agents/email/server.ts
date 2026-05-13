import express from "express";
import { Resend } from "resend";

const app  = express();
const PORT = process.env.EMAIL_SERVER_PORT || 3002;
const FROM = process.env.RESEND_FROM_ADDRESS || "noreply@bidtolist.com";

const resend = new Resend(process.env.RESEND_API_KEY || "");

app.use(express.json());

app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN || "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  next();
});

app.options("*", (_req, res) => res.sendStatus(204));

// POST /api/email/new-proposal
// Notify homeowner that a new proposal has been submitted for their listing.
app.post("/api/email/new-proposal", async (req, res) => {
  const { homeownerEmail, city, county, proposalCount, deadlineDate } = req.body as {
    homeownerEmail: string;
    city: string;
    county: string;
    proposalCount: number;
    deadlineDate: string;
  };

  if (!homeownerEmail) return res.status(400).json({ error: "homeownerEmail required" });

  try {
    await resend.emails.send({
      from: FROM,
      to: homeownerEmail,
      subject: `You have ${proposalCount} proposal${proposalCount !== 1 ? "s" : ""} — BidtoList`,
      html: `
        <p>Good news — ${proposalCount} agent${proposalCount !== 1 ? "s have" : " has"} submitted a proposal for your ${city}, ${county} listing.</p>
        <p>Proposals are sealed until <strong>${deadlineDate}</strong>. You'll be able to compare and accept the best offer once the deadline passes.</p>
        <p><a href="https://bidtolist.com/my-bids">View your listing requests →</a></p>
      `,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Resend error (new-proposal):", err);
    res.status(500).json({ error: "email send failed" });
  }
});

// POST /api/email/proposal-result
// Notify an agent that their proposal was accepted or rejected.
app.post("/api/email/proposal-result", async (req, res) => {
  const { agentEmail, agentName, city, county, won } = req.body as {
    agentEmail: string;
    agentName: string;
    city: string;
    county: string;
    won: boolean;
  };

  if (!agentEmail) return res.status(400).json({ error: "agentEmail required" });

  const subject = won
    ? `Congratulations — you won the listing in ${city} — BidtoList`
    : `Listing result for ${city}, ${county} — BidtoList`;

  const html = won
    ? `
      <p>Hi ${agentName},</p>
      <p>Congratulations! The homeowner has selected you as their agent for the <strong>${city}, ${county}</strong> listing.</p>
      <p>A platform fee of <strong>$295.00</strong> is due. You'll receive an invoice shortly.</p>
      <p><a href="https://bidtolist.com/agents/dashboard">View your dashboard →</a></p>
    `
    : `
      <p>Hi ${agentName},</p>
      <p>The homeowner for the <strong>${city}, ${county}</strong> listing has selected another agent.</p>
      <p>Keep an eye on new listings — there are always more opportunities.</p>
      <p><a href="https://bidtolist.com/agents/browse">Browse open listings →</a></p>
    `;

  try {
    await resend.emails.send({ from: FROM, to: agentEmail, subject, html });
    res.json({ ok: true });
  } catch (err) {
    console.error("Resend error (proposal-result):", err);
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
    console.error("Resend error (agent-verified):", err);
    res.status(500).json({ error: "email send failed" });
  }
});

app.listen(PORT, () => {
  console.log(`BidtoList email server running on port ${PORT}`);
});
