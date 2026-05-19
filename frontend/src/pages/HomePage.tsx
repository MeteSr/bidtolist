import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";

const S = {
  white:     "#FFFFFF",
  dark:      "#111827",
  muted:     "#6B7280",
  border:    "#E5E7EB",
  heroBg:    "#F0F7FF",
  green:     "#2A8B57",
  greenMid:  "#35A86A",
  greenLight:"#E6F4ED",
  yellow:    "#F5C842",
  blue:      "#1B3266",
  blueMid:   "#2E4FA3",
  sans:      "'IBM Plex Sans', sans-serif",
};

// ── Icons ──────────────────────────────────────────────────────────────────────

function IcHouse() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={S.green} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IcTrophy() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={S.yellow} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 21 12 17 16 21"/>
      <line x1="12" y1="17" x2="12" y2="11"/>
      <path d="M7 4H4a1 1 0 00-1 1v3a4 4 0 004 4"/>
      <path d="M17 4h3a1 1 0 011 1v3a4 4 0 01-4 4"/>
      <path d="M7 4h10v7a5 5 0 01-10 0V4z"/>
    </svg>
  );
}

function IcTrend() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={S.blueMid} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  );
}

function IcShield() {
  return (
    <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

// ── House silhouette SVG (hero background) ─────────────────────────────────────

function HouseOutline() {
  return (
    <svg
      width={440}
      height={380}
      viewBox="0 0 440 380"
      fill="none"
      stroke={S.blue}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.07 }}
    >
      {/* Main walls */}
      <rect x="40" y="190" width="360" height="170" />
      {/* Roof */}
      <polyline points="20,190 220,40 420,190" />
      {/* Chimney */}
      <rect x="300" y="70" width="36" height="60" />
      {/* Front door */}
      <rect x="178" y="280" width="84" height="80" />
      <circle cx="254" cy="322" r="5" fill={S.blue} stroke="none" />
      {/* Left window */}
      <rect x="68" y="230" width="80" height="64" />
      <line x1="68" y1="262" x2="148" y2="262" />
      <line x1="108" y1="230" x2="108" y2="294" />
      {/* Right window */}
      <rect x="292" y="230" width="80" height="64" />
      <line x1="292" y1="262" x2="372" y2="262" />
      <line x1="332" y1="230" x2="332" y2="294" />
      {/* Garage */}
      <rect x="68" y="310" width="88" height="50" />
      <line x1="68" y1="335" x2="156" y2="335" />
      {/* Pathway */}
      <polyline points="178,360 160,380 280,380 262,360" />
      {/* Bushes (circles) */}
      <circle cx="56" cy="360" r="20" />
      <circle cx="384" cy="360" r="20" />
      <circle cx="36" cy="360" r="14" />
      <circle cx="404" cy="360" r="14" />
    </svg>
  );
}

// ── Curved wave separator ──────────────────────────────────────────────────────

function HeroWave() {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 80, display: "block" }}
    >
      <path d="M0,0 C360,80 1080,80 1440,0 L1440,80 L0,80 Z" fill={S.white} />
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { isAuthenticated, role, login } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  async function handleSignIn() {
    if (!isAuthenticated) await login();
    if (role === "agent") navigate("/agents/dashboard");
    else navigate("/my-bids");
  }

  const navLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features",     href: "#features" },
    { label: "For Realtors", href: "#realtors" },
    { label: "Pricing",      href: "#pricing" },
    { label: "FAQ",          href: "/faq" },
  ];

  return (
    <div style={{ background: S.white, minHeight: "100vh", overflowX: "hidden" }}>
      <Helmet>
        <title>BidToList — Listings. Competition. Better Results.</title>
        <meta name="description" content="BidToList is the modern way for real estate agents to win more listings through competitive bidding. Secure. Transparent. Professional." />
        <meta name="keywords" content="real estate agent bidding, win listings, competitive bidding, realtor platform" />
        <link rel="canonical" href="https://bidtolist.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bidtolist.com/" />
        <meta property="og:title" content="BidToList — Listings. Competition. Better Results." />
        <meta property="og:description" content="The modern way for real estate agents to win more listings through competitive bidding." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BidToList — Listings. Competition. Better Results." />
        <meta name="twitter:description" content="The modern way for real estate agents to win more listings through competitive bidding." />
      </Helmet>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav style={{
        background:     S.white,
        borderBottom:   `1px solid ${S.border}`,
        padding:        isMobile ? "14px 20px" : "0 48px",
        height:         isMobile ? "auto" : 64,
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
        position:       "sticky",
        top:            0,
        zIndex:         100,
        boxShadow:      "0 1px 8px rgba(0,0,0,0.06)",
      }}>
        <a href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
          <img src="/bid_to_list_logo.png" alt="BidToList" style={{ height: 36, width: "auto", display: "block" }} />
        </a>

        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                style={{ fontFamily: S.sans, fontSize: "0.875rem", fontWeight: 500, color: S.muted, textDecoration: "none" }}
              >
                {label}
              </a>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isAuthenticated ? (
            <button
              onClick={handleSignIn}
              style={{ background: S.blue, border: "none", color: S.white, fontFamily: S.sans, fontSize: "0.875rem", fontWeight: 600, padding: "9px 22px", borderRadius: 8, cursor: "pointer" }}
            >
              Dashboard →
            </button>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                style={{ background: "none", border: "none", fontFamily: S.sans, fontSize: "0.875rem", fontWeight: 500, color: S.dark, cursor: "pointer", padding: "9px 12px" }}
              >
                Log In
              </button>
              <a
                href="/signup"
                style={{ display: "inline-block", background: S.blue, color: S.white, fontFamily: S.sans, fontSize: "0.875rem", fontWeight: 600, padding: "9px 22px", borderRadius: 8, textDecoration: "none" }}
              >
                Sign Up
              </a>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{
        background: S.heroBg,
        padding:    isMobile ? "56px 20px 100px" : "72px 48px 120px",
        position:   "relative",
        overflow:   "hidden",
      }}>
        {/* House outline watermark */}
        {!isMobile && (
          <div style={{ position: "absolute", right: "8%", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 0 }}>
            <HouseOutline />
          </div>
        )}

        <div style={{
          maxWidth:            1200,
          margin:              "0 auto",
          display:             "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap:                 isMobile ? 48 : 64,
          alignItems:          "center",
          position:            "relative",
          zIndex:              1,
        }}>
          {/* Left — copy */}
          <div>
            <h1 style={{
              fontFamily:    S.sans,
              fontSize:      "clamp(2.4rem, 5vw, 3.8rem)",
              fontWeight:    800,
              lineHeight:    1.1,
              color:         S.dark,
              marginBottom:  8,
              letterSpacing: "-0.02em",
            }}>
              Listings. Competition.
            </h1>
            <h1 style={{
              fontFamily:    S.sans,
              fontSize:      "clamp(2.4rem, 5vw, 3.8rem)",
              fontWeight:    800,
              lineHeight:    1.1,
              color:         S.green,
              marginBottom:  24,
              letterSpacing: "-0.02em",
            }}>
              Better Results.
            </h1>

            <p style={{
              fontFamily:   S.sans,
              fontSize:     "1rem",
              color:        S.muted,
              lineHeight:   1.75,
              marginBottom: 40,
              maxWidth:     420,
            }}>
              BidToList is the modern way for real estate agents to win more listings through competitive bidding.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href="/signup"
                style={{
                  display:        "inline-flex",
                  alignItems:     "center",
                  padding:        "13px 28px",
                  background:     S.green,
                  color:          S.white,
                  fontFamily:     S.sans,
                  fontSize:       "0.9rem",
                  fontWeight:     700,
                  borderRadius:   8,
                  textDecoration: "none",
                }}
              >
                Get Started
              </a>
              <a
                href="#how-it-works"
                style={{
                  display:        "inline-flex",
                  alignItems:     "center",
                  gap:            8,
                  padding:        "13px 28px",
                  border:         `1.5px solid ${S.border}`,
                  background:     S.white,
                  color:          S.dark,
                  fontFamily:     S.sans,
                  fontSize:       "0.9rem",
                  fontWeight:     600,
                  borderRadius:   8,
                  textDecoration: "none",
                }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill={S.dark}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                How It Works
              </a>
            </div>
          </div>

          {/* Right — BID paddle */}
          {!isMobile && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <img
                src="/logo_with_hand.png"
                alt="Agent raising a bid paddle"
                style={{ width: "100%", maxWidth: 400, height: "auto", display: "block", position: "relative", zIndex: 1 }}
              />
            </div>
          )}
        </div>

        {/* Curved bottom */}
        <HeroWave />
      </section>

      {/* ── How BidToList Works ──────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: S.white, padding: isMobile ? "56px 20px 64px" : "80px 48px 88px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: S.sans, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 800, color: S.dark, marginBottom: 12, letterSpacing: "-0.02em" }}>
              How BidToList Works
            </h2>
            <p style={{ fontFamily: S.sans, fontSize: "1rem", color: S.muted, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              A simple, transparent process that puts agents and sellers first.
            </p>
          </div>

          {/* Feature cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 24 }}>
            {[
              {
                icon:  <IcHouse />,
                iconBg: "#E6F4ED",
                title: "More Opportunities",
                desc:  "Access exclusive listings from motivated sellers.",
              },
              {
                icon:  <IcTrophy />,
                iconBg: "#FFFBEA",
                title: "Fair & Transparent",
                desc:  "Competitive bidding ensures sellers get the best value.",
              },
              {
                icon:  <IcTrend />,
                iconBg: "#EBF0FF",
                title: "Grow Your Business",
                desc:  "Win more listings and close more deals.",
              },
            ].map(({ icon, iconBg, title, desc }) => (
              <div
                key={title}
                style={{
                  background:   "#FAFBFC",
                  border:       `1px solid ${S.border}`,
                  borderRadius: 16,
                  padding:      "36px 28px",
                  textAlign:    "center",
                }}
              >
                <div style={{
                  width:          56,
                  height:         56,
                  borderRadius:   14,
                  background:     iconBg,
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  margin:         "0 auto 20px",
                }}>
                  {icon}
                </div>
                <p style={{ fontFamily: S.sans, fontSize: "1.05rem", fontWeight: 700, color: S.dark, marginBottom: 10 }}>{title}</p>
                <p style={{ fontFamily: S.sans, fontSize: "0.875rem", color: S.muted, lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4-Step Process ───────────────────────────────────────────────────── */}
      <section id="features" style={{ background: "#F8FAFB", padding: isMobile ? "56px 20px 64px" : "72px 48px 88px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display:             "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap:                 isMobile ? 32 : 0,
            position:            "relative",
          }}>
            {/* Connecting line (desktop only) */}
            {!isMobile && (
              <div style={{
                position:   "absolute",
                top:        28,
                left:       "12.5%",
                right:      "12.5%",
                height:     2,
                background: `linear-gradient(to right, ${S.green}, ${S.green})`,
                opacity:    0.2,
                zIndex:     0,
              }} />
            )}

            {[
              { n: "1", title: "New Listing Added",  desc: "Sellers post their property and set reserve terms." },
              { n: "2", title: "Agents Bid",         desc: "Licensed agents place competitive bids to win the listing." },
              { n: "3", title: "Best Bid Wins",      desc: "Sellers choose the best offer with confidence." },
              { n: "4", title: "Close More Deals",   desc: "Winning agents get the listing and grow their business." },
            ].map(({ n, title, desc }) => (
              <div key={n} style={{ textAlign: "center", padding: isMobile ? 0 : "0 24px", position: "relative", zIndex: 1 }}>
                <div style={{
                  width:          56,
                  height:         56,
                  borderRadius:   "50%",
                  background:     S.green,
                  color:          S.white,
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  fontFamily:     S.sans,
                  fontSize:       "1.2rem",
                  fontWeight:     800,
                  margin:         "0 auto 20px",
                  boxShadow:      "0 4px 16px rgba(42,139,87,0.3)",
                }}>
                  {n}
                </div>
                <p style={{ fontFamily: S.sans, fontSize: "0.95rem", fontWeight: 700, color: S.dark, marginBottom: 8 }}>{title}</p>
                <p style={{ fontFamily: S.sans, fontSize: "0.825rem", color: S.muted, lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────────────── */}
      <section id="realtors" style={{ background: S.blue, padding: isMobile ? "40px 20px" : "48px 64px" }}>
        <div style={{
          maxWidth:      1100,
          margin:        "0 auto",
          display:       "flex",
          alignItems:    "center",
          justifyContent:"space-between",
          gap:           24,
          flexWrap:      "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              <IcShield />
            </div>
            <div>
              <p style={{ fontFamily: S.sans, fontSize: "1.1rem", fontWeight: 700, color: S.white, marginBottom: 6 }}>
                Built for Realtors. Backed by Trust.
              </p>
              <p style={{ fontFamily: S.sans, fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.65, maxWidth: 480 }}>
                Secure. Transparent. Professional. We protect your data and ensure a fair process for everyone.
              </p>
            </div>
          </div>
          <a
            href="/signup?role=agent"
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              padding:        "11px 28px",
              background:     S.white,
              color:          S.blue,
              fontFamily:     S.sans,
              fontSize:       "0.875rem",
              fontWeight:     700,
              borderRadius:   8,
              textDecoration: "none",
              flexShrink:     0,
            }}
          >
            Learn More
          </a>
        </div>
      </section>

      {/* ── Trusted by Agents ────────────────────────────────────────────────── */}
      <section style={{ background: S.white, padding: isMobile ? "48px 20px" : "64px 48px", borderTop: `1px solid ${S.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 600, color: S.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 36 }}>
            Trusted by Agents
          </p>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: isMobile ? 24 : 56, flexWrap: "wrap" }}>
            {[
              { name: "Coldwell Banker", color: "#003087" },
              { name: "RE/MAX",          color: "#DC1C2E" },
              { name: "Keller Williams", color: "#B40101" },
              { name: "EXP Realty",      color: "#0C2340" },
              { name: "Century 21",      color: "#B08A2E" },
              { name: "Compass",         color: "#000000" },
            ].map(({ name, color }) => (
              <span
                key={name}
                style={{ fontFamily: S.sans, fontSize: "0.9rem", fontWeight: 700, color, opacity: 0.7, letterSpacing: "0.01em" }}
              >
                {name}
              </span>
            ))}
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
          <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>BidToList</span>
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
