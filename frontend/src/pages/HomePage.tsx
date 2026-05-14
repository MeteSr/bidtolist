import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";

const S = {
  // Base
  bg:        "#F4F6F8",
  white:     "#FFFFFF",
  dark:      "#111827",
  muted:     "#6B7280",
  border:    "#E5E7EB",

  // Green (primary)
  green:     "#2A8B57",
  greenMid:  "#35A86A",
  greenLight:"#E6F4ED",

  // Yellow
  yellow:    "#F5C842",
  yellowDeep:"#D4A800",
  yellowPale:"#FFFBEA",

  // Blue (dark featured)
  blue:      "#1B3266",
  blueMid:   "#2E4FA3",
  blueLight: "#EBF0FF",

  // Peach
  peach:     "#F07858",
  peachMid:  "#F5967A",
  peachLight:"#FEF0EB",

  // Typography
  sans:   "'IBM Plex Sans', sans-serif",
  serif:  "'Playfair Display', Georgia, serif",
  mono:   "'IBM Plex Mono', monospace",
};

function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 20 20" fill={S.yellow}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, role, login } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  async function handleSignIn() {
    if (!isAuthenticated) await login();
    if (role === "agent") navigate("/agents/dashboard");
    else navigate("/my-bids");
  }

  return (
    <div style={{ background: S.bg, minHeight: "100vh", overflowX: "hidden" }}>
      <Helmet>
        <title>BidtoList — Let Agents Compete for Your Listing</title>
        <meta name="description" content="Sell your home anywhere in the USA. Post once — licensed realtors submit blind proposals with commission rate, marketing plan, and CMA. Free for homeowners." />
        <meta name="keywords" content="sell your home, find a realtor, real estate agent, listing agent, FSBO, home sale" />
        <link rel="canonical" href="https://bidtolist.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bidtolist.com/" />
        <meta property="og:title" content="BidtoList — Let Agents Compete for Your Listing" />
        <meta property="og:description" content="Post your home once. Licensed agents submit blind proposals. You pick the winner. Free for homeowners across the USA." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BidtoList — Let Agents Compete for Your Listing" />
        <meta name="twitter:description" content="Post your home once. Licensed agents submit blind proposals. You pick the winner." />
      </Helmet>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav style={{
        background:     S.white,
        borderBottom:   `1px solid ${S.border}`,
        padding:        isMobile ? "14px 20px" : "16px 48px",
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
        position:       "sticky",
        top:            0,
        zIndex:         100,
        boxShadow:      "0 1px 12px rgba(0,0,0,0.06)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", gap: 3 }}>
            <span style={{ display: "inline-block", width: 4, height: 18, background: S.green, borderRadius: 2 }} />
            <span style={{ display: "inline-block", width: 4, height: 18, background: S.yellow, borderRadius: 2 }} />
          </div>
          <span style={{ fontFamily: S.sans, fontSize: "1.2rem", fontWeight: 800, color: S.dark, letterSpacing: "-0.02em" }}>
            BidtoList
          </span>
        </div>

        <div style={{ display: "flex", gap: isMobile ? 12 : 32, alignItems: "center" }}>
          {!isMobile && (
            <>
              <a href="#homeowners" style={{ fontFamily: S.sans, fontSize: "0.88rem", fontWeight: 500, color: S.muted, textDecoration: "none" }}>
                Homeowners
              </a>
              <a href="#agents" style={{ fontFamily: S.sans, fontSize: "0.88rem", fontWeight: 500, color: S.muted, textDecoration: "none" }}>
                Agents
              </a>
              <a href="#how-it-works" style={{ fontFamily: S.sans, fontSize: "0.88rem", fontWeight: 500, color: S.muted, textDecoration: "none" }}>
                How It Works
              </a>
            </>
          )}
          {isAuthenticated ? (
            <button
              onClick={handleSignIn}
              style={{ background: S.green, border: "none", color: S.white, fontFamily: S.sans, fontSize: "0.88rem", fontWeight: 700, padding: "10px 22px", borderRadius: 100, cursor: "pointer" }}
            >
              Dashboard →
            </button>
          ) : (
            <a
              href="/signup"
              style={{ display: "inline-block", background: "transparent", border: `2px solid ${S.green}`, color: S.green, fontFamily: S.sans, fontSize: "0.88rem", fontWeight: 700, padding: "10px 22px", borderRadius: 100, textDecoration: "none" }}
            >
              Get Started →
            </a>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{
        background: S.bg,
        padding:    isMobile ? "56px 20px 48px" : "80px 48px 68px",
        position:   "relative",
        overflow:   "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: -60, left: -60,
          width: 280, height: 280,
          borderRadius: "50%",
          background: S.peach,
          opacity: 0.18,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: 40, left: 80,
          width: 140, height: 140,
          borderRadius: "50%",
          background: S.yellow,
          opacity: 0.3,
          pointerEvents: "none",
        }} />
        {!isMobile && (
          <div style={{
            position: "absolute", bottom: -80, right: -40,
            width: 300, height: 300,
            borderRadius: "50%",
            background: S.green,
            opacity: 0.08,
            pointerEvents: "none",
          }} />
        )}

        <div style={{
          maxWidth:            1200,
          margin:              "0 auto",
          display:             "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap:                 isMobile ? 48 : 80,
          alignItems:          "center",
          position:            "relative",
          zIndex:              1,
        }}>
          {/* Left — copy */}
          <div>
            <h1 style={{
              fontFamily:   S.sans,
              fontSize:     "clamp(2.2rem, 5vw, 3.6rem)",
              fontWeight:   800,
              lineHeight:   1.1,
              color:        S.dark,
              marginBottom: 20,
              letterSpacing: "-0.02em",
            }}>
              Let agents<br />
              <span style={{ color: S.green }}>compete</span> for<br />
              your listing.
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <StarRow />
              <span style={{ fontFamily: S.sans, fontSize: "0.85rem", fontWeight: 600, color: S.dark }}>5.0</span>
            </div>

            <p style={{
              fontFamily:   S.sans,
              fontSize:     "1rem",
              color:        S.muted,
              lineHeight:   1.75,
              marginBottom: 40,
              maxWidth:     440,
            }}>
              Post your home once. Licensed agents submit blind proposals — commission rate, marketing plan, and CMA. You compare and pick the winner. Free for homeowners, always.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href="#homeowners"
                style={{
                  display:        "inline-flex",
                  alignItems:     "center",
                  gap:            6,
                  padding:        "14px 28px",
                  background:     S.green,
                  color:          S.white,
                  fontFamily:     S.sans,
                  fontSize:       "0.9rem",
                  fontWeight:     700,
                  borderRadius:   100,
                  textDecoration: "none",
                  flex:           isMobile ? "1 1 100%" : "0 0 auto",
                }}
              >
                Post Your Home
              </a>
              <a
                href="#agents"
                style={{
                  display:        "inline-flex",
                  alignItems:     "center",
                  padding:        "14px 28px",
                  border:         `2px solid ${S.border}`,
                  background:     S.white,
                  color:          S.dark,
                  fontFamily:     S.sans,
                  fontSize:       "0.9rem",
                  fontWeight:     600,
                  borderRadius:   100,
                  textDecoration: "none",
                  flex:           isMobile ? "1 1 100%" : "0 0 auto",
                }}
              >
                Join as an Agent
              </a>
            </div>
          </div>

          {/* Right — listing UI mockup */}
          {!isMobile && (
            <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
              {/* Main card */}
              <div style={{
                background:   S.white,
                borderRadius: 20,
                boxShadow:    "0 20px 60px rgba(0,0,0,0.12)",
                padding:      "28px 28px 24px",
                width:        "100%",
                maxWidth:     360,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <span style={{ fontFamily: S.sans, fontSize: "0.75rem", fontWeight: 700, color: S.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Open Listing
                  </span>
                  <span style={{
                    background:   S.greenLight,
                    color:        S.green,
                    fontFamily:   S.sans,
                    fontSize:     "0.72rem",
                    fontWeight:   700,
                    padding:      "4px 12px",
                    borderRadius: 100,
                  }}>
                    ● Active
                  </span>
                </div>

                <p style={{ fontFamily: S.sans, fontSize: "1.15rem", fontWeight: 800, color: S.dark, marginBottom: 4, letterSpacing: "-0.01em" }}>
                  147 Ocean Shore Blvd
                </p>
                <p style={{ fontFamily: S.sans, fontSize: "0.85rem", color: S.muted, marginBottom: 20 }}>
                  Austin, TX · 78701
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Proposals", val: "4 / 10", color: S.blue },
                    { label: "Closes in", val: "3 days",  color: S.peach },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ background: S.bg, borderRadius: 12, padding: "14px 16px" }}>
                      <p style={{ fontFamily: S.sans, fontSize: "0.7rem", fontWeight: 600, color: S.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                      <p style={{ fontFamily: S.sans, fontSize: "1.25rem", fontWeight: 800, color }}>{val}</p>
                    </div>
                  ))}
                </div>

                <div style={{ background: S.blue, borderRadius: 12, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontFamily: S.sans, fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>Best proposal so far</p>
                    <p style={{ fontFamily: S.sans, fontSize: "1.1rem", fontWeight: 800, color: S.white }}>2.4% commission</p>
                  </div>
                  <span style={{ fontSize: "1.5rem" }}>🏆</span>
                </div>
              </div>

              {/* Floating chip — top right */}
              <div style={{
                position:     "absolute",
                top:          -18,
                right:        -18,
                background:   S.yellow,
                borderRadius: 12,
                padding:      "10px 16px",
                boxShadow:    "0 8px 24px rgba(245,200,66,0.35)",
                display:      "flex",
                alignItems:   "center",
                gap:          8,
              }}>
                <span style={{ fontSize: "1.1rem" }}>$0</span>
                <span style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 700, color: S.dark }}>Free for homeowners</span>
              </div>

              {/* Floating chip — bottom left */}
              <div style={{
                position:     "absolute",
                bottom:       -18,
                left:         -18,
                background:   S.white,
                borderRadius: 12,
                padding:      "10px 16px",
                boxShadow:    "0 8px 24px rgba(0,0,0,0.1)",
                display:      "flex",
                alignItems:   "center",
                gap:          8,
              }}>
                <span style={{ fontSize: "1.1rem" }}>🔒</span>
                <span style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 700, color: S.dark }}>Blind bidding</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Trusted-by band (floating card) ─────────────────────────────────── */}
      <div style={{
        background:   S.white,
        borderRadius: isMobile ? 16 : 20,
        boxShadow:    "0 8px 40px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
        padding:      isMobile ? "20px 20px" : "22px 40px",
        maxWidth:     1100,
        marginTop:    isMobile ? -16 : -20,
        marginBottom: isMobile ? -44 : -56,
        marginLeft:   isMobile ? 20 : "auto",
        marginRight:  isMobile ? 20 : "auto",
        position:     "relative",
        zIndex:       10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 20 : 48, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 600, color: S.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Serving agents from
          </span>
          {[
            { name: "Coldwell Banker", color: "#003087" },
            { name: "RE/MAX",          color: "#DC1C2E" },
            { name: "Keller Williams", color: "#B40101" },
            { name: "EXP Realty",      color: "#0C2340" },
            { name: "Century 21",      color: "#B08A2E" },
          ].map(({ name, color }) => (
            <span key={name} style={{ fontFamily: S.sans, fontSize: "0.88rem", fontWeight: 700, color }}>
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: "#FAFBFC", padding: isMobile ? "116px 20px 72px" : "148px 48px 104px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr", gap: isMobile ? 40 : 80, alignItems: "start" }}>
            {/* Left */}
            <div>
              <div style={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          8,
                background:   S.peachLight,
                borderRadius: 100,
                padding:      "6px 16px",
                marginBottom: 20,
              }}>
                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: S.peach }} />
                <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 600, color: S.peach }}>
                  For Homeowners
                </span>
              </div>

              <h2 style={{ fontFamily: S.sans, fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, color: S.dark, lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.02em" }}>
                Simple and<br />Easy Process
              </h2>
              <p style={{ fontFamily: S.sans, fontSize: "0.95rem", color: S.muted, lineHeight: 1.75, marginBottom: 32, maxWidth: 320 }}>
                No cold calls. No pressure. Post once and let licensed agents bring their best offer to you.
              </p>
              <a
                href="/signup?role=homeowner"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: S.sans, fontSize: "0.88rem", fontWeight: 700, color: S.green, textDecoration: "none", border: `2px solid ${S.green}`, borderRadius: 100, padding: "10px 22px" }}
              >
                Get Started →
              </a>
            </div>

            {/* Right — 3 step cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                {
                  n: "1",
                  t: "Post Your Home",
                  d: "Enter your address, target list date, and notes. Set a bid deadline — typically 5–7 days.",
                  featured: false,
                  bg: S.white,
                  numBg: S.greenLight,
                  numColor: S.green,
                },
                {
                  n: "2",
                  t: "Agents Bid Blind",
                  d: "Licensed local agents submit sealed proposals. They can't see each other's bids — ever.",
                  featured: true,
                  bg: S.blue,
                  numBg: S.yellow,
                  numColor: S.dark,
                },
                {
                  n: "3",
                  t: "You Pick the Winner",
                  d: "Compare proposals side by side — commission, marketing plan, track record. You decide.",
                  featured: false,
                  bg: S.white,
                  numBg: S.peachLight,
                  numColor: S.peach,
                },
              ].map(({ n, t, d, featured, bg, numBg, numColor }) => (
                <div key={n} style={{
                  background:   bg,
                  borderRadius: 20,
                  padding:      "28px 24px",
                  boxShadow:    featured ? "0 16px 48px rgba(27,50,102,0.25)" : "0 4px 24px rgba(0,0,0,0.06)",
                  border:       featured ? "none" : `1px solid ${S.border}`,
                  transform:    featured ? "translateY(-12px)" : "none",
                  transition:   "transform 0.2s",
                }}>
                  <div style={{
                    width:        36,
                    height:       36,
                    borderRadius: 10,
                    background:   numBg,
                    display:      "flex",
                    alignItems:   "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}>
                    <span style={{ fontFamily: S.sans, fontSize: "1rem", fontWeight: 800, color: numColor }}>{n}</span>
                  </div>
                  <p style={{ fontFamily: S.sans, fontSize: "1rem", fontWeight: 700, color: featured ? S.white : S.dark, marginBottom: 10, lineHeight: 1.3 }}>{t}</p>
                  <p style={{ fontFamily: S.sans, fontSize: "0.85rem", color: featured ? "rgba(255,255,255,0.65)" : S.muted, lineHeight: 1.7 }}>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats band ──────────────────────────────────────────────────────── */}
      <div style={{ background: S.yellow, padding: isMobile ? "28px 20px" : "32px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: isMobile ? 28 : 0, flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "space-around", alignItems: "center" }}>
          {[
            { val: "$0",   label: "Cost for Homeowners" },
            { val: "$295", label: "Cost For Winning Agent" },
          ].map(({ val, label, testId }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p
                data-testid={testId}
                style={{ fontFamily: S.sans, fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, color: S.dark, marginBottom: 4, letterSpacing: "-0.02em" }}
              >
                {val}
              </p>
              <p style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 600, color: "rgba(17,24,39,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── For Agents ──────────────────────────────────────────────────────── */}
      <section id="agents" style={{ background: S.white, padding: isMobile ? "72px 20px" : "104px 48px", position: "relative", overflow: "hidden" }}>
        {/* Decorative */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: S.greenLight, opacity: 0.6, pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: S.greenLight, borderRadius: 100, padding: "6px 16px", marginBottom: 20 }}>
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: S.green }} />
              <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 600, color: S.green }}>For Real Estate Agents</span>
            </div>
            <h2 style={{ fontFamily: S.sans, fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: S.dark, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 }}>
              Win listings on merit,<br />not referrals.
            </h2>
            <p style={{ fontFamily: S.sans, fontSize: "1rem", color: S.muted, lineHeight: 1.75, maxWidth: 480, margin: "0 auto" }}>
              Browse open bid requests from verified homeowners. If selected, pay a flat $295 — no monthly fees, no per-bid charges, ever.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 20, marginBottom: 48 }}>
            {[
              { icon: "💸", t: "No Monthly Fees",     d: "Register free. You only pay $295 when your proposal is accepted — no subscriptions, no per-bid charges.", color: S.yellow,    pale: S.yellowPale },
              { icon: "🔒", t: "Level Playing Field", d: "Blind bidding means your proposal wins on quality — not on who you know.", color: S.green,     pale: S.greenLight },
              { icon: "✅", t: "Verified Homeowners", d: "Every listing comes from a verified property owner. No wasted proposals.",       color: S.peach,     pale: S.peachLight },
            ].map(({ icon, t, d, color, pale }) => (
              <div key={t} style={{ background: pale, borderRadius: 20, padding: "32px 28px", border: `1px solid ${color}22` }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: S.white, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: "1.4rem", boxShadow: `0 4px 16px ${color}22` }}>
                  {icon}
                </div>
                <p style={{ fontFamily: S.sans, fontSize: "1.05rem", fontWeight: 700, color: S.dark, marginBottom: 10 }}>{t}</p>
                <p style={{ fontFamily: S.sans, fontSize: "0.88rem", color: S.muted, lineHeight: 1.7 }}>{d}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <a
              href="/signup?role=agent"
              style={{ display: "inline-flex", alignItems: "center", padding: "14px 36px", background: S.blue, color: S.white, fontFamily: S.sans, fontSize: "0.9rem", fontWeight: 700, borderRadius: 100, textDecoration: "none" }}
            >
              Join as an Agent →
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────────── */}
      <section style={{ background: S.green, padding: isMobile ? "64px 20px" : "88px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -40, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -40, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <p style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)", marginBottom: 18 }}>
            No subscription. No catch.
          </p>
          <h2 style={{ fontFamily: S.sans, fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: S.white, lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.02em" }}>
            Free for homeowners.<br />
            <span style={{ color: S.yellow }}>$295 win fee</span> for agents.
          </h2>
          <p style={{ fontFamily: S.sans, fontSize: "0.95rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.75, marginBottom: 44 }}>
            BidtoList earns only when an agent wins a listing — so our incentives are perfectly aligned with yours.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/signup?role=homeowner"
              style={{ display: "inline-flex", alignItems: "center", padding: "14px 32px", background: S.yellow, color: S.dark, fontFamily: S.sans, fontSize: "0.9rem", fontWeight: 700, borderRadius: 100, textDecoration: "none" }}
            >
              Post your home free →
            </a>
            <a
              href="/signup?role=agent"
              style={{ display: "inline-flex", alignItems: "center", padding: "14px 32px", border: "2px solid rgba(255,255,255,0.4)", color: S.white, fontFamily: S.sans, fontSize: "0.9rem", fontWeight: 600, borderRadius: 100, textDecoration: "none" }}
            >
              Join as an agent
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{
        background:     S.dark,
        padding:        isMobile ? "20px 20px" : "24px 48px",
        display:        "flex",
        flexDirection:  isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems:     isMobile ? "flex-start" : "center",
        gap:            8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 3 }}>
            <span style={{ display: "inline-block", width: 3, height: 14, background: S.green, borderRadius: 2 }} />
            <span style={{ display: "inline-block", width: 3, height: 14, background: S.yellow, borderRadius: 2 }} />
          </div>
          <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>BidtoList</span>
          <span style={{ fontFamily: S.sans, fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>© 2026</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/faq" style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 500, color: "rgba(255,255,255,0.45)", textDecoration: "none", letterSpacing: "0.04em" }}>
            FAQ
          </a>
        </div>
      </footer>
    </div>
  );
}
