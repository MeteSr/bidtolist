import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getListingMetrics } from "../services/listing";
import { getAllAgentProfiles } from "../services/agent";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

export default function HomePage() {
  const { isAuthenticated, role, login } = useAuth();
  const navigate = useNavigate();
  const [openListings, setOpenListings] = useState<number | null>(null);
  const [verifiedAgents, setVerifiedAgents] = useState<number | null>(null);

  useEffect(() => {
    getListingMetrics()
      .then(m => setOpenListings(m.openRequests))
      .catch(() => setOpenListings(0));
    getAllAgentProfiles()
      .then(profiles => setVerifiedAgents(profiles.filter((p: any) => p.isVerified).length))
      .catch(() => setVerifiedAgents(0));
  }, []);

  async function handlePostListing() {
    if (!isAuthenticated) await login();
    // After login, role is resolved — route to the right dashboard
    if (role === "agent") {
      navigate("/agents/dashboard");
    } else {
      navigate("/post");
    }
  }

  async function handleAgentEntry() {
    if (!isAuthenticated) await login();
    if (role === "agent") {
      navigate("/agents/dashboard");
    } else {
      navigate("/agents/register");
    }
  }

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: S.serif, fontSize: "1.25rem", fontWeight: 900, color: S.rust }}>BidtoList</span>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="/agents/browse" style={{ fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.inkLight, textDecoration: "none" }}>Browse Listings</a>
          <button onClick={handleAgentEntry} style={{ background: "none", border: "none", padding: 0, fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink, cursor: "pointer" }}>
            {isAuthenticated && role === "agent" ? "My Dashboard" : "Agent Sign Up"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "80px 40px 60px" }}>
        <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: S.rust, marginBottom: 16 }}>
          Volusia &amp; Flagler Counties, FL
        </p>
        <h1 style={{ fontFamily: S.serif, fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 900, lineHeight: 1.15, color: S.ink, marginBottom: 24 }}>
          Let agents compete<br />for your listing.
        </h1>
        <p style={{ fontFamily: S.sans, fontSize: "1.1rem", fontWeight: 300, color: S.inkLight, maxWidth: 520, marginBottom: 40, lineHeight: 1.7 }}>
          Post your home once. Licensed agents submit blind proposals — commission rate, marketing plan, and more. After the deadline, you see all proposals side by side and pick the winner.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <button onClick={handlePostListing} style={{ background: S.rust, border: `1px solid ${S.rust}`, color: S.paper, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "14px 32px", cursor: "pointer" }}>
            {isAuthenticated && role === "agent" ? "Go to Dashboard" : "Post Your Home — Free"}
          </button>
          <a href="/agents/browse" style={{ display: "inline-flex", alignItems: "center", padding: "14px 32px", border: `1px solid ${S.ink}`, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink, textDecoration: "none" }}>
            Browse Listings
          </a>
        </div>
      </section>

      {/* Trust signals */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 40px 48px", display: "flex", gap: 40, flexWrap: "wrap" }}>
        <div data-testid="stat-open-listings">
          <p style={{ fontFamily: S.serif, fontSize: "1.6rem", fontWeight: 900, color: S.ink, marginBottom: 2 }}>
            {openListings !== null ? openListings : "—"}
          </p>
          <p style={{ fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight }}>
            {openListings === 1 ? "open listing" : "open listings"}
          </p>
        </div>
        <div data-testid="stat-verified-agents">
          <p style={{ fontFamily: S.serif, fontSize: "1.6rem", fontWeight: 900, color: S.ink, marginBottom: 2 }}>
            {verifiedAgents !== null ? verifiedAgents : "—"}
          </p>
          <p style={{ fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight }}>
            {verifiedAgents === 1 ? "verified agent" : "verified agents"}
          </p>
        </div>
        <div>
          <p style={{ fontFamily: S.serif, fontSize: "1.6rem", fontWeight: 900, color: S.ink, marginBottom: 2 }}>$295</p>
          <p style={{ fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight }}>
            flat fee — paid only on win
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${S.rule}`, margin: "0 40px" }} />

      {/* How it works */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "60px 40px" }}>
        <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: S.inkLight, marginBottom: 32 }}>How It Works</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32 }}>
          {[
            { n: "01", t: "Post Your Home", d: "Enter your address, target list date, and any notes. Set a bid deadline — typically 5–7 days." },
            { n: "02", t: "Agents Bid Blind", d: "Licensed Volusia and Flagler agents submit sealed proposals. They can't see each other's bids." },
            { n: "03", t: "You Pick the Winner", d: "After the deadline, compare proposals side by side. Commission, marketing plan, track record." },
          ].map(({ n, t, d }) => (
            <div key={n}>
              <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.12em", color: S.rust, marginBottom: 12 }}>{n}</p>
              <p style={{ fontFamily: S.serif, fontSize: "1.05rem", fontWeight: 700, marginBottom: 10 }}>{t}</p>
              <p style={{ fontFamily: S.sans, fontSize: "0.9rem", color: S.inkLight, lineHeight: 1.6 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${S.rule}`, margin: "0 40px" }} />

      {/* Pricing clarity */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "60px 40px" }}>
        <p style={{ fontFamily: S.serif, fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>No subscription. No catch.</p>
        <p style={{ fontFamily: S.sans, fontSize: "0.95rem", color: S.inkLight, lineHeight: 1.7, maxWidth: 480 }}>
          BidtoList is free for homeowners. Agents pay a flat <strong style={{ color: S.ink }}>$295 platform fee</strong> only when their bid is accepted. No monthly fees, no per-bid charges.
        </p>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${S.rule}`, padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight, letterSpacing: "0.08em" }}>© 2026 BIDTOLIST</span>
        <span style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight, letterSpacing: "0.08em" }}>VOLUSIA + FLAGLER COUNTIES, FL</span>
      </footer>
    </div>
  );
}
