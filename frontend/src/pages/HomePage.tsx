import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";

const C = {
  navy:      "#142B4D",
  orange:    "#C66A2B",
  warmWhite: "#FAF9F7",
  softGray:  "#E7E7E4",
  charcoal:  "#3B3B3B",
  muted:     "#7A7A72",
  white:     "#FFFFFF",
  serif:     "'Playfair Display', Georgia, serif",
  sans:      "Inter, 'IBM Plex Sans', system-ui, sans-serif",
  mono:      "'IBM Plex Mono', monospace",
};

// ── Icons ─────────────────────────────────────────────────────────────────────

function IcHome({ color = C.charcoal, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IcUsers({ color = C.charcoal, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}

function IcTrophy({ color = C.charcoal, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 21 12 17 16 21"/>
      <line x1="12" y1="17" x2="12" y2="11"/>
      <path d="M7 4H4a1 1 0 00-1 1v3a4 4 0 004 4"/>
      <path d="M17 4h3a1 1 0 011 1v3a4 4 0 01-4 4"/>
      <path d="M7 4h10v7a5 5 0 01-10 0V4z"/>
    </svg>
  );
}

function IcCheck({ color = C.orange, size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IcChevronDown({ color = C.navy, size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function IcStar({ size = 16, color = "#C66A2B" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function IcPhone({ size = 18, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.25 13a19.79 19.79 0 01-3.07-8.67A2 2 0 012.18 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
    </svg>
  );
}

function IcCalendar({ size = 18, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function IcSliders({ size = 18, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14"/>
      <line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/>
      <line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/>
      <line x1="9" y1="8" x2="15" y2="8"/>
      <line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  );
}

function IcDollar({ size = 18, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  );
}

function IcClock({ size = 18, color = C.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function IcClipboard({ size = 18, color = C.navy }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  );
}

function IcAward({ size = 18, color = C.navy }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  );
}

function IcCheckCircle({ size = 18, color = C.navy }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function IcArrowRight({ size = 24, color = C.softGray }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "Will I be flooded with calls?", a: "No. Agents submit proposals through our platform. You decide who to contact — not the other way around. Your contact information is never shared until you explicitly accept a proposal." },
  { q: "Am I obligated to hire anyone?", a: "Absolutely not. You can review all proposals and choose not to move forward. There's no pressure and no obligation." },
  { q: "Is there a cost?", a: "BidToList is 100% free for homeowners. Agents pay a small platform fee only when they win a listing." },
  { q: "How are agents vetted?", a: "Every agent must provide a valid Florida real estate license number, which we verify against DBPR records before they can submit proposals." },
  { q: "Can I still choose a traditional listing?", a: "Of course. BidToList helps you compare options — you're in complete control of who you hire and how you proceed." },
];

const COMPARISON_ROWS = [
  { leftIcon: IcPhone,    left: { bold: "You call agents",      sub: "Time-consuming calls and voicemails." },       rightIcon: IcClipboard,   right: { bold: "You submit once",      sub: "Tell us about your home in under 5 minutes." } },
  { leftIcon: IcCalendar, left: { bold: "You interview agents", sub: "Schedule multiple meetings and presentations." }, rightIcon: IcUsers,        right: { bold: "Agents come to you",   sub: "Qualified agents compete for your business." } },
  { leftIcon: IcSliders,  left: { bold: "Hard to compare",      sub: "Different formats and missing information." },   rightIcon: IcCheckCircle, right: { bold: "Easy side-by-side",    sub: "Commission, marketing plans, and experience — apples to apples." } },
  { leftIcon: IcDollar,   left: { bold: "Take what's offered",  sub: "First proposal becomes the standard." },         rightIcon: IcAward,       right: { bold: "Agents compete",       sub: "Better offers. Better service. Better results." } },
  { leftIcon: IcClock,    left: { bold: "You spend hours",      sub: "Researching, calling, and following up." },       rightIcon: IcCheckCircle, right: { bold: "You save time",        sub: "Compare offers and choose with confidence." } },
];

export default function HomePage() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleSignIn() {
    if (isAuthenticated) {
      navigate(role === "agent" ? "/agents/dashboard" : "/my-bids");
    } else {
      navigate("/login");
    }
  }

  const primaryBtn = {
    display:        "inline-flex" as const,
    alignItems:     "center" as const,
    justifyContent: "center" as const,
    gap:            8,
    padding:        "12px 24px",
    borderRadius:   12,
    fontFamily:     C.sans,
    fontSize:       "0.9rem",
    fontWeight:     700,
    cursor:         "pointer",
    textDecoration: "none" as const,
    whiteSpace:     "nowrap" as const,
    background:     C.orange,
    color:          C.white,
    border:         "none" as const,
  };

  const secondaryBtn = {
    ...primaryBtn,
    background: "transparent",
    color:      C.navy,
    border:     `2px solid ${C.navy}`,
  };

  const navLinks = [
    { label: "How It Works",  href: "#how-it-works" },
    { label: "Why BidToList", href: "#why" },
    { label: "For Agents",    href: "/for-agents" },
    { label: "FAQ",           href: "/faq" },
  ];

  return (
    <div style={{ background: C.warmWhite, minHeight: "100vh", overflowX: "hidden" }}>
      <Helmet>
        <title>BidToList — Let Agents Compete For Your Listing</title>
        <meta name="description" content="Post your home once and receive proposals from qualified agents competing to earn your business. Commission offers, marketing plans, local expertise. 100% free for homeowners." />
        <meta name="keywords" content="find listing agent, compare real estate agents, Southwest Florida, Naples, Volusia, sell my home" />
        <link rel="canonical" href="https://bidtolist.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bidtolist.com/" />
        <meta property="og:title" content="BidToList — Let Agents Compete For Your Listing" />
        <meta property="og:description" content="Post your home once and receive proposals from qualified agents competing to earn your business." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BidToList — Let Agents Compete For Your Listing" />
        <meta name="twitter:description" content="Post your home once. Agents compete. You choose." />
      </Helmet>

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav style={{
        background:     C.white,
        borderBottom:   `1px solid ${C.softGray}`,
        padding:        isMobile ? "14px 20px" : "0 48px",
        height:         isMobile ? "auto" : 68,
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
        position:       "sticky",
        top:            0,
        zIndex:         100,
        boxShadow:      "0 2px 12px rgba(0,0,0,0.06)",
      }}>
        <a href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <img src="/logo_transparent_bg.png" alt="BidToList" style={{ height: 36, display: "block" }} />
        </a>

        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
            {navLinks.map(({ label, href }) => (
              <a key={label} href={href} style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 500, color: C.charcoal, textDecoration: "none" }}>
                {label}
              </a>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isAuthenticated ? (
            <button onClick={handleSignIn} style={{ ...primaryBtn, padding: "9px 20px", fontSize: "0.875rem" }}>
              Dashboard →
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              style={{
                background: "none", border: `1.5px solid ${C.navy}`,
                color: C.navy, fontFamily: C.sans, fontSize: "0.875rem",
                fontWeight: 600, padding: "8px 18px", borderRadius: 10, cursor: "pointer",
              }}
            >
              Log In
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative",
        overflow: "hidden",
        background: C.warmWhite,
        minHeight: isMobile ? "auto" : 580,
      }}>
        {/* Full-height photo — right portion of viewport */}
        {!isMobile && (
          <>
            <div style={{
              position:           "absolute",
              right:              0,
              top:                0,
              bottom:             0,
              width:              "58%",
              backgroundImage:    "url('/hero_couple.png')",
              backgroundSize:     "cover",
              backgroundPosition: "center top",
              zIndex:             0,
            }} />
            {/* Left-to-right warm-white fade over the image */}
            <div style={{
              position:   "absolute",
              right:      0,
              top:        0,
              bottom:     0,
              width:      "62%",
              background: `linear-gradient(to right, ${C.warmWhite} 0%, ${C.warmWhite} 6%, rgba(250,249,247,0.82) 22%, rgba(250,249,247,0.4) 40%, transparent 62%)`,
              zIndex:     1,
            }} />
          </>
        )}

        {/* Benefits card — absolute, right edge, vertically centered */}
        {!isMobile && (
          <div style={{
            position:     "absolute",
            right:        36,
            top:          "50%",
            transform:    "translateY(-50%)",
            background:   C.navy,
            borderRadius: 16,
            padding:      "20px 22px",
            width:        228,
            boxShadow:    "0 12px 40px rgba(0,0,0,0.28)",
            zIndex:       3,
          }}>
            <p style={{ fontFamily: C.sans, fontSize: "0.62rem", fontWeight: 700, color: C.orange, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 14 }}>
              Why Homeowners Use BidToList
            </p>
            {[
              { icon: "💰", title: "Save Money",         sub: "Compare commission structures side-by-side." },
              { icon: "⭐", title: "Find Better Agents", sub: "Review track records before choosing." },
              { icon: "🏡", title: "Stay in Control",    sub: "No pressure. No obligation." },
              { icon: "📋", title: "One Listing. Multiple Opportunities.", sub: "Agents compete for your business." },
            ].map(({ icon, title, sub }) => (
              <div key={title} style={{ display: "flex", gap: 9, marginBottom: 10 }}>
                <span style={{ fontSize: "0.9rem", flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <div>
                  <p style={{ fontFamily: C.sans, fontSize: "0.72rem", fontWeight: 600, color: C.white, marginBottom: 1 }}>{title}</p>
                  <p style={{ fontFamily: C.sans, fontSize: "0.62rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Text content — left side, in normal flow */}
        <div style={{
          position:  "relative",
          zIndex:    2,
          maxWidth:  1160,
          margin:    "0 auto",
          padding:   isMobile ? "48px 20px 56px" : "88px 48px",
          display:   "flex",
          alignItems:"center",
          minHeight: isMobile ? "auto" : 580,
        }}>
          <div style={{ maxWidth: isMobile ? "100%" : 520 }}>
            <p style={{
              fontFamily:    C.mono,
              fontSize:      "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
              color:         C.orange,
              marginBottom:  16,
            }}>
              The Smarter Way to Find a Listing Agent
            </p>
            <h1 style={{
              fontFamily:   C.serif,
              fontSize:     "clamp(2.1rem, 4.5vw, 3.2rem)",
              fontWeight:   700,
              lineHeight:   1.15,
              color:        C.navy,
              marginBottom: 20,
            }}>
              Don't Interview Agents.<br />
              <span style={{ color: C.orange }}>Let Them Compete</span><br />
              For Your Listing.
            </h1>
            <p style={{
              fontFamily:   C.sans,
              fontSize:     "1rem",
              color:        C.charcoal,
              lineHeight:   1.75,
              marginBottom: 36,
              maxWidth:     440,
            }}>
              Post your home once and receive proposals from qualified agents competing to earn your business—including commission offers, marketing plans, and local expertise.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 28 }}>
              <a href="/login" style={primaryBtn}>
                Post Your Home Free
              </a>
              <a href="#how-it-works" style={{ ...secondaryBtn, gap: 8 }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill={C.navy}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                See How It Works
              </a>
            </div>

            <div style={{ display: "flex", flexWrap: "nowrap" as const, gap: 20, alignItems: "center" }}>
              {[
                {
                  label: "100% Free for Homeowners",
                  icon: <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
                },
                {
                  label: "No Obligation",
                  icon: <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                },
                {
                  label: "Licensed Agents Only",
                  icon: <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
                },
                {
                  label: "Secure & Private",
                  icon: <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
                },
              ].map(({ label, icon }, i) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: C.sans, fontSize: "0.78rem", color: C.charcoal, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                  {icon} {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: image below text */}
        {isMobile && (
          <img
            src="/hero_couple.png"
            alt="Homeowners reviewing agent proposals"
            style={{ width: "100%", display: "block" }}
          />
        )}
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{
        background:  C.white,
        padding:     isMobile ? "56px 20px 64px" : "72px 48px 80px",
        borderBottom:`2px solid ${C.navy}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: C.serif, fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 700, color: C.navy, textAlign: "center", marginBottom: 52 }}>
            How It Works
          </h2>

          <div style={{
            display:       "flex",
            alignItems:    "flex-start",
            flexDirection: isMobile ? "column" : "row" as const,
            gap:           isMobile ? 40 : 0,
          }}>
            {/* Step 1 */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flex: 1 }}>
              {/* Icon group */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 100, height: 100, borderRadius: "50%",
                  background: "#EDEEF1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {/* Laptop with house icon */}
                  <svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="13" rx="2"/>
                    <path d="M2 17h20M9 21h6M12 17v4"/>
                    <path d="M9.5 12.5V10l2.5-2 2.5 2v2.5h-1.5v-1.5h-2v1.5z" strokeWidth={1.3}/>
                  </svg>
                </div>
                {/* Step number badge */}
                <div style={{
                  position: "absolute", left: -6, bottom: 6,
                  width: 28, height: 28, borderRadius: "50%",
                  background: C.navy, color: C.white,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 700,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                }}>1</div>
              </div>
              {/* Text */}
              <div style={{ paddingTop: 8 }}>
                <p style={{ fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 700, color: C.navy, marginBottom: 6 }}>Post Your Property</p>
                <p style={{ fontFamily: C.sans, fontSize: "0.85rem", fontWeight: 400, color: C.charcoal, lineHeight: 1.65 }}>
                  Tell agents about your home in under 5 minutes.
                </p>
              </div>
            </div>

            {/* Arrow 1→2 */}
            {!isMobile && (
              <div style={{ paddingTop: 38, paddingLeft: 8, paddingRight: 8, flexShrink: 0, color: C.charcoal, fontSize: "1.4rem" }}>→</div>
            )}

            {/* Step 2 */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flex: 1 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 100, height: 100, borderRadius: "50%",
                  background: "#EDEEF1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {/* Speech bubble + people */}
                  <svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    <line x1="9" y1="10" x2="9" y2="10" strokeWidth={2}/>
                    <line x1="12" y1="10" x2="12" y2="10" strokeWidth={2}/>
                    <line x1="15" y1="10" x2="15" y2="10" strokeWidth={2}/>
                  </svg>
                </div>
                <div style={{
                  position: "absolute", left: -6, bottom: 6,
                  width: 28, height: 28, borderRadius: "50%",
                  background: C.navy, color: C.white,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 700,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                }}>2</div>
              </div>
              <div style={{ paddingTop: 8 }}>
                <p style={{ fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 700, color: C.navy, marginBottom: 4 }}>Agents Compete</p>
                <p style={{ fontFamily: C.sans, fontSize: "0.85rem", fontWeight: 400, color: C.charcoal, lineHeight: 1.55, marginBottom: 6 }}>
                  Receive proposals that include:
                </p>
                <ul style={{ margin: 0, paddingLeft: 14, listStyle: "disc" }}>
                  {["Commission rates", "Marketing plans", "Local experience", "Recent sales results"].map(b => (
                    <li key={b} style={{ fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 400, color: C.charcoal, lineHeight: 1.7 }}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Arrow 2→3 */}
            {!isMobile && (
              <div style={{ paddingTop: 38, paddingLeft: 8, paddingRight: 8, flexShrink: 0, color: C.charcoal, fontSize: "1.4rem" }}>→</div>
            )}

            {/* Step 3 */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flex: 1 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 100, height: 100, borderRadius: "50%",
                  background: "#EDEEF1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {/* Award ribbon */}
                  <svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="9" r="6"/>
                    <polygon points="12 5 13.09 8.26 16.18 8.27 13.72 10.14 14.62 13.27 12 11.52 9.38 13.27 10.28 10.14 7.82 8.27 10.91 8.26 12 5" fill={C.navy} stroke="none"/>
                    <path d="M8.56 17.68L7 22l5-3 5 3-1.56-4.32"/>
                  </svg>
                </div>
                <div style={{
                  position: "absolute", left: -6, bottom: 6,
                  width: 28, height: 28, borderRadius: "50%",
                  background: C.navy, color: C.white,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 700,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                }}>3</div>
              </div>
              <div style={{ paddingTop: 8 }}>
                <p style={{ fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 700, color: C.navy, marginBottom: 6 }}>Choose the Best Fit</p>
                <p style={{ fontFamily: C.sans, fontSize: "0.85rem", fontWeight: 400, color: C.charcoal, lineHeight: 1.65 }}>
                  Hire the agent you trust most—or walk away with no obligation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Results Bar ──────────────────────────────────────────────────────── */}
      <section style={{ background: C.navy, padding: isMobile ? "44px 20px" : "56px 48px" }}>
        <div style={{
          maxWidth:            1100,
          margin:              "0 auto",
          display:             "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap:                 isMobile ? 32 : 0,
          textAlign:           "center",
        }}>
          {[
            { stat: "$5,000+", label: "Average potential savings on commission*" },
            { stat: "3–5",     label: "Agent proposals to compare" },
            { stat: "10 min",  label: "Average time to post your property" },
            { stat: "100%",    label: "Free for homeowners" },
          ].map(({ stat, label }, i) => (
            <div key={i} style={{
              padding:     isMobile ? 0 : "0 28px",
              borderRight: !isMobile && i < 3 ? "1px solid rgba(255,255,255,0.12)" : undefined,
            }}>
              <p style={{ fontFamily: C.serif, fontSize: "clamp(2rem,3.5vw,2.5rem)", fontWeight: 700, color: C.orange, marginBottom: 6 }}>{stat}</p>
              <p style={{ fontFamily: C.sans, fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{label}</p>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", fontFamily: C.sans, fontSize: "0.68rem", color: "rgba(255,255,255,0.28)", marginTop: 24 }}>
          *Savings vary by home price and commission structure.
        </p>
      </section>

      {/* ── Find the Best Agent ───────────────────────────────────────────────── */}
      <section id="why" style={{ background: C.warmWhite, padding: isMobile ? "56px 20px" : "88px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.45fr", gap: isMobile ? 48 : 72, alignItems: "start" }}>

          {/* Left */}
          <div>
            <h2 style={{ fontFamily: C.serif, fontSize: "clamp(1.8rem,3.5vw,2.3rem)", fontWeight: 700, color: C.navy, lineHeight: 1.2, marginBottom: 16 }}>
              Find the Best Agent.<br />
              <span style={{ color: C.orange }}>Not Just Any Agent.</span>
            </h2>
            <p style={{ fontFamily: C.sans, fontSize: "0.9rem", color: C.charcoal, lineHeight: 1.8, marginBottom: 28 }}>
              BidToList changes the way homeowners find representation by bringing competitive offers, proven results, and local expertise directly to you—so you can choose with confidence.
            </p>
            <img
              src="/bottom_section_house.png"
              alt="Southwest Florida luxury home"
              style={{ width: "100%", borderRadius: 16, boxShadow: "0 8px 32px rgba(20,43,77,0.12)", display: "block" }}
            />
          </div>

          {/* Right — comparison table */}
          <div>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: "12px 12px 0 0", overflow: "hidden" }}>
              <div style={{ background: C.navy, padding: "14px 18px", textAlign: "center" }}>
                <p style={{ fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 700, color: C.white }}>The Traditional Way</p>
              </div>
              <div style={{ background: C.orange, padding: "14px 18px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", background: C.white,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontFamily: C.sans, fontSize: "0.55rem", fontWeight: 800, color: C.orange, flexShrink: 0,
                }}>VS</span>
                <p style={{ fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 700, color: C.white }}>The BidToList Way</p>
              </div>
            </div>

            {/* Rows */}
            {COMPARISON_ROWS.map(({ leftIcon: LeftIcon, left, rightIcon: RightIcon, right }, i) => (
              <div key={i} style={{
                display:             "grid",
                gridTemplateColumns: "1fr 1fr",
                borderLeft:  `1px solid ${C.softGray}`,
                borderRight: `1px solid ${C.softGray}`,
                borderBottom:`1px solid ${C.softGray}`,
                background:  i % 2 === 0 ? C.white : C.warmWhite,
              }}>
                <div style={{ padding: "14px 16px", borderRight: `1px solid ${C.softGray}`, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, marginTop: 1 }}><LeftIcon /></div>
                  <div>
                    <p style={{ fontFamily: C.sans, fontSize: "0.78rem", fontWeight: 600, color: C.charcoal, marginBottom: 2 }}>{left.bold}</p>
                    <p style={{ fontFamily: C.sans, fontSize: "0.7rem", color: C.muted, lineHeight: 1.4 }}>{left.sub}</p>
                  </div>
                </div>
                <div style={{ padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(198,106,43,0.04)" }}>
                  <div style={{ flexShrink: 0, marginTop: 1 }}><RightIcon color={C.navy} /></div>
                  <div>
                    <p style={{ fontFamily: C.sans, fontSize: "0.78rem", fontWeight: 600, color: C.navy, marginBottom: 2 }}>{right.bold}</p>
                    <p style={{ fontFamily: C.sans, fontSize: "0.7rem", color: C.charcoal, lineHeight: 1.4 }}>{right.sub}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div style={{
              background:   C.navy,
              borderRadius: "0 0 12px 12px",
              padding:      "16px 20px",
              display:      "flex",
              alignItems:   "center",
              gap:          12,
            }}>
              <IcHome color={C.orange} size={22} />
              <div>
                <p style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 700, color: C.white, marginBottom: 2 }}>
                  More Choice. More Control. Better Results.
                </p>
                <p style={{ fontFamily: C.sans, fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                  You're in control every step of the way—choose the agent who's right for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section style={{ background: C.white, padding: isMobile ? "56px 20px" : "80px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontFamily: C.serif, fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: C.navy, textAlign: "center", marginBottom: 48 }}>
            What Homeowners Are Saying
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 24 }}>
            {[
              { name: "Susan M.", location: "Pelican Bay",   quote: "I loved seeing different marketing plans and commission offers before making a decision. It saved me thousands!" },
              { name: "James T.", location: "Naples",        quote: "The process was easy and I felt in control the entire time. I found an amazing agent I never would have found on my own." },
              { name: "Linda R.", location: "Bonita Springs", quote: "Finally, a way for homeowners to level the playing field. Agents actually have to earn your business!" },
            ].map(({ name, location, quote }) => (
              <div key={name} style={{
                background:    C.warmWhite,
                border:        `1px solid ${C.softGray}`,
                borderRadius:  16,
                padding:       "28px 24px",
                boxShadow:     "0 2px 16px rgba(0,0,0,0.05)",
                display:       "flex",
                flexDirection: "column" as const,
              }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(n => <IcStar key={n} size={15} />)}
                </div>
                <p style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.charcoal, lineHeight: 1.75, flex: 1, marginBottom: 20 }}>
                  "{quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", background: C.navy,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: C.serif, fontSize: "1rem", fontWeight: 700, color: C.white, flexShrink: 0,
                  }}>
                    {name[0]}
                  </div>
                  <div>
                    <p style={{ fontFamily: C.sans, fontSize: "0.85rem", fontWeight: 600, color: C.navy }}>{name}</p>
                    <p style={{ fontFamily: C.mono, fontSize: "0.62rem", color: C.muted, letterSpacing: "0.06em" }}>{location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section style={{ background: C.warmWhite, padding: isMobile ? "56px 20px" : "80px 48px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontFamily: C.serif, fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: C.navy, textAlign: "center", marginBottom: 40 }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {FAQS.map(({ q, a }, i) => (
              <div key={i} style={{ background: C.white, border: `1px solid ${C.softGray}`, borderRadius: 12, overflow: "hidden" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "18px 20px", background: "none", border: "none",
                    cursor: "pointer", textAlign: "left" as const, gap: 12,
                  }}
                >
                  <span style={{ fontFamily: C.sans, fontSize: "0.9rem", fontWeight: 600, color: C.navy }}>{q}</span>
                  <span style={{
                    flexShrink: 0,
                    width: 28, height: 28, borderRadius: "50%",
                    background: openFaq === i ? C.orange : C.softGray,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s",
                  }}>
                    <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                      <path
                        d={openFaq === i ? "M2 8L6 4L10 8" : "M2 4L6 8L10 4"}
                        stroke={openFaq === i ? C.white : C.charcoal}
                        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 18px", borderTop: `1px solid ${C.softGray}` }}>
                    <p style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.charcoal, lineHeight: 1.75, marginTop: 14 }}>{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section style={{
        position:           "relative",
        overflow:           "hidden",
        padding:            isMobile ? "72px 20px" : "100px 48px",
        backgroundImage:    "url('/bottom_section_house.png')",
        backgroundSize:     "cover",
        backgroundPosition: "center",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(20,43,77,0.82)" }} />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{
            fontFamily:   C.serif,
            fontSize:     "clamp(1.8rem,4vw,2.6rem)",
            fontWeight:   700,
            color:        C.white,
            lineHeight:   1.2,
            marginBottom: 16,
          }}>
            Ready to see what agents are willing to offer for your home?
          </h2>
          <p style={{ fontFamily: C.sans, fontSize: "1rem", color: "rgba(255,255,255,0.72)", marginBottom: 36, lineHeight: 1.65 }}>
            Post once. Compare offers. Choose confidently.
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <a href="/login" style={{ ...primaryBtn, fontSize: "1rem", padding: "14px 36px", borderRadius: 14, boxShadow: "0 8px 24px rgba(198,106,43,0.4)" }}>
              Post Your Home Free
            </a>
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <span style={{ fontFamily: C.sans, fontSize: "0.8rem", color: "rgba(255,255,255,0.55)" }}>
              Secure. Private. No Obligation.
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#0D1E38", borderTop: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "32px 20px 24px" : "44px 48px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display:       "flex",
            justifyContent:"space-between",
            alignItems:    isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row" as const,
            gap:           24,
            marginBottom:  28,
          }}>
            <img
              src="/logo_transparent_bg.png"
              alt="BidToList"
              style={{ height: 30, display: "block" }}
            />
            <p style={{ fontFamily: C.sans, fontSize: "0.75rem", color: "rgba(255,255,255,0.42)", lineHeight: 1.6, maxWidth: 380 }}>
              We respect your privacy and never sell your information. Proudly serving Southwest Florida homeowners.
            </p>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" as const }}>
              {[{ l: "FAQ", h: "/faq" }, { l: "For Agents", h: "/for-agents" }, { l: "Post Your Home", h: "/post" }].map(({ l, h }) => (
                <a key={l} href={h} style={{ fontFamily: C.sans, fontSize: "0.78rem", color: "rgba(255,255,255,0.42)", textDecoration: "none" }}>{l}</a>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20 }}>
            <p style={{ textAlign: "center", fontFamily: C.sans, fontSize: "0.68rem", color: "rgba(255,255,255,0.2)" }}>
              © 2026 BidToList · Secure & Encrypted · Proudly Local Serving SW Florida
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
