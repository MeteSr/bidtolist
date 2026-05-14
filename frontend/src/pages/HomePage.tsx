import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../contexts/AuthContext";
import { getListingMetrics } from "../services/listing";
import { getAllAgentProfiles } from "../services/agent";
import { useBreakpoint } from "../hooks/useBreakpoint";

const S = {
  white: "#FFFFFF",
  peach: "#F28B68",
  peachDark: "#D4724F",
  peachLight: "#FFF3EF",
  blue: "#1B3F8A",
  blueLight: "#EBF2FF",
  blueMid: "#3B5FCC",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace",
  sans: "'IBM Plex Sans', sans-serif",
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

  async function handleSignIn() {
    if (!isAuthenticated) await login();
    if (role === "agent") navigate("/agents/dashboard");
    else navigate("/my-bids");
  }

  const navPad = isMobile ? "14px 20px" : "18px 48px";
  const secPad = isMobile ? "56px 20px 40px" : "96px 48px 72px";

  return (
    <div style={{ background: S.white, minHeight: "100vh" }}>
      <Helmet>
        <title>BidtoList — Let Agents Compete for Your Listing | Volusia &amp; Flagler Counties, FL</title>
        <meta name="description" content="Sell your home in Volusia or Flagler County, FL. Post once — licensed realtors submit blind proposals with commission rate, marketing plan, and CMA. Free for homeowners." />
        <meta name="keywords" content="sell your home Volusia County, find a realtor Daytona Beach, Flagler County real estate agent, Palm Coast listing agent" />
        <link rel="canonical" href="https://bidtolist.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bidtolist.com/" />
        <meta property="og:title" content="BidtoList — Let Agents Compete for Your Listing" />
        <meta property="og:description" content="Post your home once. Licensed agents submit blind proposals. You pick the winner. Serving Volusia &amp; Flagler Counties, FL." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BidtoList — Let Agents Compete for Your Listing" />
        <meta name="twitter:description" content="Post your home once. Licensed agents submit blind proposals. You pick the winner." />
      </Helmet>

      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${S.border}`,
        padding: navPad,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: S.white,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <span style={{ fontFamily: S.serif, fontSize: "1.3rem", fontWeight: 900, color: S.blue }}>
          BidtoList
        </span>
        <div style={{ display: "flex", gap: isMobile ? 16 : 28, alignItems: "center" }}>
          {!isMobile && (
            <>
              <a href="#homeowners" style={{ fontFamily: S.mono, fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.textMuted, textDecoration: "none" }}>
                Homeowners
              </a>
              <a href="#agents" style={{ fontFamily: S.mono, fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.textMuted, textDecoration: "none" }}>
                Agents
              </a>
            </>
          )}
          {isAuthenticated ? (
            <button
              onClick={handleSignIn}
              style={{ background: S.blue, border: `1px solid ${S.blue}`, color: S.white, fontFamily: S.mono, fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "9px 20px", cursor: "pointer" }}
            >
              Dashboard
            </button>
          ) : (
            <a
              href="/signup"
              style={{ display: "inline-block", border: `1px solid ${S.blue}`, color: S.blue, fontFamily: S.mono, fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "9px 20px", textDecoration: "none" }}
            >
              Sign Up
            </a>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: secPad, textAlign: "center" }}>
        <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: S.peach, marginBottom: 20 }}>
          Volusia &amp; Flagler Counties, FL
        </p>
        <h1 style={{ fontFamily: S.serif, fontSize: "clamp(2.2rem, 5.5vw, 4rem)", fontWeight: 900, lineHeight: 1.1, color: S.blue, marginBottom: 28 }}>
          The smarter way<br />to sell your home.
        </h1>
        <p style={{ fontFamily: S.sans, fontSize: isMobile ? "1rem" : "1.15rem", fontWeight: 300, color: S.textMuted, maxWidth: 540, margin: "0 auto 44px", lineHeight: 1.75 }}>
          Post your home once. Licensed agents submit blind proposals — commission rate, marketing plan, and more. You compare and pick the winner.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="#homeowners"
            style={{ display: "inline-flex", alignItems: "center", padding: "15px 36px", background: S.peach, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.white, textDecoration: "none", flex: isMobile ? "1 1 100%" : "0 0 auto" }}
          >
            I'm a Homeowner →
          </a>
          <a
            href="#agents"
            style={{ display: "inline-flex", alignItems: "center", padding: "15px 36px", border: `1px solid ${S.blue}`, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.blue, textDecoration: "none", flex: isMobile ? "1 1 100%" : "0 0 auto" }}
          >
            I'm a Real Estate Agent →
          </a>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{ borderTop: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}`, padding: isMobile ? "24px 20px" : "28px 48px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", gap: isMobile ? 28 : 56, flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "center" }}>
          <div data-testid="stat-open-listings" style={{ textAlign: "center" }}>
            <p style={{ fontFamily: S.serif, fontSize: "1.8rem", fontWeight: 900, color: S.blue, marginBottom: 2 }}>
              {openListings !== null ? openListings : "—"}
            </p>
            <p style={{ fontFamily: S.mono, fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.textMuted }}>
              {openListings === 1 ? "open listing" : "open listings"}
            </p>
          </div>
          <div data-testid="stat-verified-agents" style={{ textAlign: "center" }}>
            <p style={{ fontFamily: S.serif, fontSize: "1.8rem", fontWeight: 900, color: S.blue, marginBottom: 2 }}>
              {verifiedAgents !== null ? verifiedAgents : "—"}
            </p>
            <p style={{ fontFamily: S.mono, fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.textMuted }}>
              {verifiedAgents === 1 ? "verified agent" : "verified agents"}
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: S.serif, fontSize: "1.8rem", fontWeight: 900, color: S.blue, marginBottom: 2 }}>$0</p>
            <p style={{ fontFamily: S.mono, fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.textMuted }}>
              cost for homeowners
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: S.serif, fontSize: "1.8rem", fontWeight: 900, color: S.blue, marginBottom: 2 }}>$295</p>
            <p style={{ fontFamily: S.mono, fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.textMuted }}>
              flat fee — paid only on win
            </p>
          </div>
        </div>
      </div>

      {/* For Homeowners */}
      <section id="homeowners" style={{ background: S.peachLight, padding: isMobile ? "56px 20px" : "88px 48px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: S.peach, marginBottom: 20 }}>
            For Homeowners
          </p>
          <h2 style={{ fontFamily: S.serif, fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)", fontWeight: 900, color: S.blue, marginBottom: 20, lineHeight: 1.2 }}>
            Let agents compete<br />for your listing.
          </h2>
          <p style={{ fontFamily: S.sans, fontSize: "1rem", fontWeight: 300, color: S.textMuted, maxWidth: 520, marginBottom: 56, lineHeight: 1.75 }}>
            No cold calls. No pressure. Post your home once and let licensed agents bring their best offer to you. After the deadline, compare every proposal side by side.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 36, marginBottom: 56 }}>
            {[
              { n: "01", t: "Post Your Home", d: "Enter your address, target list date, and any notes. Set a bid deadline — typically 5–7 days." },
              { n: "02", t: "Agents Bid Blind", d: "Licensed Volusia and Flagler agents submit sealed proposals. They can't see each other's bids." },
              { n: "03", t: "You Pick the Winner", d: "After the deadline, compare proposals side by side — commission, marketing plan, track record." },
            ].map(({ n, t, d }) => (
              <div key={n} style={{ borderLeft: `3px solid ${S.peach}`, paddingLeft: 20 }}>
                <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.12em", color: S.peach, marginBottom: 10 }}>{n}</p>
                <p style={{ fontFamily: S.serif, fontSize: "1.05rem", fontWeight: 700, color: S.blue, marginBottom: 8 }}>{t}</p>
                <p style={{ fontFamily: S.sans, fontSize: "0.9rem", color: S.textMuted, lineHeight: 1.65 }}>{d}</p>
              </div>
            ))}
          </div>
          <a
            href="/signup?role=homeowner"
            style={{ display: "inline-flex", alignItems: "center", padding: "15px 40px", background: S.peach, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.white, textDecoration: "none" }}
          >
            Post Your Home — Free
          </a>
        </div>
      </section>

      {/* For Real Estate Agents */}
      <section id="agents" style={{ background: S.blueLight, padding: isMobile ? "56px 20px" : "88px 48px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: S.blueMid, marginBottom: 20 }}>
            For Real Estate Agents
          </p>
          <h2 style={{ fontFamily: S.serif, fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)", fontWeight: 900, color: S.blue, marginBottom: 20, lineHeight: 1.2 }}>
            Win listings on merit,<br />not referrals.
          </h2>
          <p style={{ fontFamily: S.sans, fontSize: "1rem", fontWeight: 300, color: S.textMuted, maxWidth: 520, marginBottom: 56, lineHeight: 1.75 }}>
            Browse open bid requests from verified homeowners in Volusia and Flagler Counties. Submit your proposal, and if selected, pay a flat $295 — no recurring fees, ever.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 36, marginBottom: 56 }}>
            {[
              { t: "No monthly fees", d: "Register free. You only pay $295 when your proposal is accepted by a homeowner." },
              { t: "Level playing field", d: "Blind bidding means your proposal wins on quality — not who you know." },
              { t: "Verified homeowners", d: "Every listing comes from a verified property owner. No wasted proposals." },
            ].map(({ t, d }) => (
              <div key={t} style={{ borderLeft: `3px solid ${S.blue}`, paddingLeft: 20 }}>
                <p style={{ fontFamily: S.serif, fontSize: "1.05rem", fontWeight: 700, color: S.blue, marginBottom: 8 }}>{t}</p>
                <p style={{ fontFamily: S.sans, fontSize: "0.9rem", color: S.textMuted, lineHeight: 1.65 }}>{d}</p>
              </div>
            ))}
          </div>
          <a
            href="/signup?role=agent"
            style={{ display: "inline-flex", alignItems: "center", padding: "15px 40px", background: S.blue, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.white, textDecoration: "none" }}
          >
            Join as an Agent
          </a>
        </div>
      </section>

      {/* No subscription callout */}
      <section style={{ background: S.white, padding: isMobile ? "48px 20px" : "72px 48px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <p style={{ fontFamily: S.serif, fontSize: "1.5rem", fontWeight: 700, color: S.blue, marginBottom: 16 }}>
            No subscription. No catch.
          </p>
          <p style={{ fontFamily: S.sans, fontSize: "0.95rem", color: S.textMuted, lineHeight: 1.75 }}>
            BidtoList is free for homeowners. Agents pay a flat <strong style={{ color: S.blue }}>$295 platform fee</strong> only when their bid is accepted — no monthly fees, no per-bid charges.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${S.border}`, padding: isMobile ? "20px 20px" : "24px 48px", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 8 }}>
        <span style={{ fontFamily: S.mono, fontSize: "0.62rem", color: S.textMuted, letterSpacing: "0.08em" }}>© 2026 BIDTOLIST</span>
        <span style={{ fontFamily: S.mono, fontSize: "0.62rem", color: S.textMuted, letterSpacing: "0.08em" }}>VOLUSIA + FLAGLER COUNTIES, FL</span>
      </footer>
    </div>
  );
}
