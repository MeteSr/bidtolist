import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../contexts/AuthContext";
import { getListingMetrics } from "../services/listing";
import { getAllAgentProfiles } from "../services/agent";
import { useBreakpoint } from "../hooks/useBreakpoint";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

export default function HomePage() {
  const { isAuthenticated, role, login } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
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
    if (role === "agent") navigate("/agents/dashboard");
    else navigate("/post");
  }

  async function handleAgentEntry() {
    if (!isAuthenticated) await login();
    if (role === "agent") navigate("/agents/dashboard");
    else navigate("/agents/register");
  }

  const navPad = isMobile ? "12px 16px" : "16px 40px";
  const secPad = isMobile ? "48px 16px 32px" : "80px 40px 60px";
  const innerPad = isMobile ? "0 16px 32px" : "0 40px 48px";

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      <Helmet>
        <title>BidtoList — Let Agents Compete for Your Listing | Volusia &amp; Flagler Counties, FL</title>
        <meta name="description" content="Sell your home in Volusia or Flagler County, FL. Post once — licensed realtors submit blind proposals with commission rate, marketing plan, and CMA. Free for homeowners. Pick your agent after the deadline." />
        <meta name="keywords" content="sell your home Volusia County, find a realtor Daytona Beach, Flagler County real estate agent, Palm Coast listing agent, Daytona Beach realtor, FSBO alternative Florida" />
        <link rel="canonical" href="https://bidtolist.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bidtolist.com/" />
        <meta property="og:title" content="BidtoList — Let Agents Compete for Your Listing" />
        <meta property="og:description" content="Post your home once. Licensed agents submit blind proposals. You pick the winner. Serving Volusia &amp; Flagler Counties, FL." />
        <meta property="og:image" content="https://bidtolist.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BidtoList — Let Agents Compete for Your Listing" />
        <meta name="twitter:description" content="Post your home once. Licensed agents submit blind proposals. You pick the winner. Serving Volusia &amp; Flagler Counties, FL." />
      </Helmet>
      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: navPad, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: S.serif, fontSize: "1.25rem", fontWeight: 900, color: S.rust }}>BidtoList</span>
        <div style={{ display: "flex", gap: isMobile ? 12 : 24, alignItems: "center" }}>
          <a href="/agents/browse" style={{ fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.inkLight, textDecoration: "none" }}>Browse</a>
          <button onClick={handleAgentEntry} style={{ background: "none", border: "none", padding: 0, fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink, cursor: "pointer" }}>
            {isAuthenticated && role === "agent" ? "Dashboard" : "Agent Sign Up"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: secPad }}>
        <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: S.rust, marginBottom: 16 }}>
          Volusia &amp; Flagler Counties, FL
        </p>
        <h1 style={{ fontFamily: S.serif, fontSize: "clamp(2rem, 5vw, 3.6rem)", fontWeight: 900, lineHeight: 1.15, color: S.ink, marginBottom: 24 }}>
          Let agents compete<br />for your listing.
        </h1>
        <p style={{ fontFamily: S.sans, fontSize: isMobile ? "1rem" : "1.1rem", fontWeight: 300, color: S.inkLight, maxWidth: 520, marginBottom: 40, lineHeight: 1.7 }}>
          Post your home once. Licensed agents submit blind proposals — commission rate, marketing plan, and more. After the deadline, you see all proposals side by side and pick the winner.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={handlePostListing} style={{ background: S.rust, border: `1px solid ${S.rust}`, color: S.paper, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "14px 32px", cursor: "pointer", flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
            {isAuthenticated && role === "agent" ? "Go to Dashboard" : "Post Your Home — Free"}
          </button>
          <a href="/agents/browse" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "14px 32px", border: `1px solid ${S.ink}`, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink, textDecoration: "none", flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
            Browse Listings
          </a>
        </div>
      </section>

      {/* Trust signals */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: innerPad, display: "flex", gap: isMobile ? 24 : 40, flexWrap: "wrap" }}>
        <div data-testid="stat-open-listings">
          <p style={{ fontFamily: S.serif, fontSize: "1.6rem", fontWeight: 900, color: S.ink, marginBottom: 2 }}>
            {openListings !== null ? openListings : "—"}
          </p>
          <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight }}>
            {openListings === 1 ? "open listing" : "open listings"}
          </p>
        </div>
        <div data-testid="stat-verified-agents">
          <p style={{ fontFamily: S.serif, fontSize: "1.6rem", fontWeight: 900, color: S.ink, marginBottom: 2 }}>
            {verifiedAgents !== null ? verifiedAgents : "—"}
          </p>
          <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight }}>
            {verifiedAgents === 1 ? "verified agent" : "verified agents"}
          </p>
        </div>
        <div>
          <p style={{ fontFamily: S.serif, fontSize: "1.6rem", fontWeight: 900, color: S.ink, marginBottom: 2 }}>$295</p>
          <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight }}>
            flat fee — paid only on win
          </p>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${S.rule}`, margin: isMobile ? "0 16px" : "0 40px" }} />

      {/* How it works */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "40px 16px" : "60px 40px" }}>
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

      <div style={{ borderTop: `1px solid ${S.rule}`, margin: isMobile ? "0 16px" : "0 40px" }} />

      {/* Pricing clarity */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "40px 16px" : "60px 40px" }}>
        <p style={{ fontFamily: S.serif, fontSize: "1.4rem", fontWeight: 700, marginBottom: 16 }}>No subscription. No catch.</p>
        <p style={{ fontFamily: S.sans, fontSize: "0.95rem", color: S.inkLight, lineHeight: 1.7, maxWidth: 480 }}>
          BidtoList is free for homeowners. Agents pay a flat <strong style={{ color: S.ink }}>$295 platform fee</strong> only when their bid is accepted. No monthly fees, no per-bid charges.
        </p>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${S.rule}`, padding: isMobile ? "20px 16px" : "24px 40px", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 8 }}>
        <span style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight, letterSpacing: "0.08em" }}>© 2026 BIDTOLIST</span>
        <span style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight, letterSpacing: "0.08em" }}>VOLUSIA + FLAGLER COUNTIES, FL</span>
      </footer>
    </div>
  );
}
