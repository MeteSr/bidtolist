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
  red:       "#C0392B",
  green:     "#1A7A4A",
  serif:     "'Playfair Display', Georgia, serif",
  sans:      "Inter, 'IBM Plex Sans', system-ui, sans-serif",
  mono:      "'IBM Plex Mono', monospace",
};

// ── Icons ─────────────────────────────────────────────────────────────────────

function IcCheck({ size = 16, color = C.green }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IcX({ size = 16, color = C.red }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IcStar({ size = 16, color = C.orange }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function IcUser({ size = 32, color = C.navy }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IcSearch({ size = 32, color = C.navy }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function IcClipboard({ size = 32, color = C.navy }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  );
}

function IcHandshake({ size = 32, color = C.navy }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 010 8h-1"/>
      <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  );
}

function IcLock({ size = 14, color = "rgba(255,255,255,0.55)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

function IcZillow({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IcGoogle({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function IcNetwork({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}

function IcTrophy({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 21 12 17 16 21"/>
      <line x1="12" y1="17" x2="12" y2="11"/>
      <path d="M7 4H4a1 1 0 00-1 1v3a4 4 0 004 4"/>
      <path d="M17 4h3a1 1 0 011 1v3a4 4 0 01-4 4"/>
      <path d="M7 4h10v7a5 5 0 01-10 0V4z"/>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "Is there a monthly fee?",              a: "No. You only pay if you secure the listing. There are no subscriptions, no monthly fees, and no upfront costs of any kind." },
  { q: "When is the $395 due?",                a: "After a homeowner signs a listing agreement with you. You pay nothing until you have a signed contract in hand." },
  { q: "Can I choose which opportunities to pursue?", a: "Yes. You decide which homeowners fit your business, your market, and your schedule. There's no obligation to bid on anything." },
  { q: "Are homeowners verified?",             a: "Yes. All homeowner submissions are reviewed for legitimacy and activity is monitored to ensure serious intent." },
  { q: "Is there a contract?",                 a: "No long-term commitment. Participate whenever it makes sense for your business and step away at any time." },
];

export default function AgentLandingPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleSignIn() {
    if (!isAuthenticated) await login();
    navigate("/agents/dashboard");
  }

  const primaryBtn = {
    display:        "inline-flex" as const,
    alignItems:     "center" as const,
    justifyContent: "center" as const,
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

  const navLinks = [
    { label: "How It Works",  href: "#how-it-works" },
    { label: "Success Fee",   href: "#pricing" },
    { label: "Opportunities", href: "/agents/browse" },
    { label: "Resources",     href: "/faq" },
    { label: "About",         href: "/" },
  ];

  return (
    <div style={{ background: C.warmWhite, minHeight: "100vh", overflowX: "hidden" }}>
      <Helmet>
        <title>BidToList for Agents — Win More Listings. Only Pay When You Win.</title>
        <meta name="description" content="BidToList connects agents with homeowners actively seeking representation. No monthly fees. No upfront costs. Just a $395 success fee when you secure the listing." />
        <link rel="canonical" href="https://bidtolist.com/for-agents" />
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
          <img src="/logo.png" alt="BidToList" style={{ height: 36, display: "block" }} />
        </a>
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
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
            <>
              <button
                onClick={handleSignIn}
                style={{ background: "none", border: `1.5px solid ${C.navy}`, color: C.navy, fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 600, padding: "8px 18px", borderRadius: 10, cursor: "pointer" }}
              >
                Log In
              </button>
              <a href="/agents/register" style={{ ...primaryBtn, padding: "9px 18px", fontSize: "0.875rem" }}>
                Become a BidToList Agent
              </a>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", background: C.warmWhite, minHeight: isMobile ? "auto" : 580 }}>
        {!isMobile && (
          <>
            <div style={{
              position: "absolute", right: 0, top: 0, bottom: 0, width: "58%",
              backgroundImage: "url('/hero_agents.png')", backgroundSize: "cover", backgroundPosition: "center top",
              zIndex: 0,
            }} />
            <div style={{
              position: "absolute", right: 0, top: 0, bottom: 0, width: "62%",
              background: `linear-gradient(to right, ${C.warmWhite} 0%, ${C.warmWhite} 6%, rgba(250,249,247,0.82) 22%, rgba(250,249,247,0.4) 40%, transparent 62%)`,
              zIndex: 1,
            }} />
          </>
        )}

        {/* Floating benefits card */}
        {!isMobile && (
          <div style={{
            position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)",
            background: C.navy, borderRadius: 16, padding: "22px 24px", width: 236,
            boxShadow: "0 12px 40px rgba(0,0,0,0.28)", zIndex: 3,
          }}>
            <p style={{ fontFamily: C.sans, fontSize: "0.62rem", fontWeight: 700, color: C.orange, textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 16 }}>
              Why Agents Love BidToList
            </p>
            {[
              { top: "$0",   topSub: "Monthly Fees",       sub: "No subscriptions. Ever." },
              { top: "$395", topSub: "Only When You Win",  sub: "Pay after securing the listing." },
              { top: "Exclusive",   topSub: "Opportunities",       sub: "Homeowners actively seeking representation." },
              { top: "100%", topSub: "Performance-Based",  sub: "Your success is our success." },
            ].map(({ top, topSub, sub }) => (
              <div key={top + topSub} style={{ display: "flex", gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <p style={{ fontFamily: C.sans, fontSize: "0.9rem", fontWeight: 800, color: C.orange, lineHeight: 1 }}>{top}</p>
                  <p style={{ fontFamily: C.sans, fontSize: "0.72rem", fontWeight: 700, color: C.white, marginBottom: 2 }}>{topSub}</p>
                  <p style={{ fontFamily: C.sans, fontSize: "0.62rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Text content */}
        <div style={{
          position: "relative", zIndex: 2,
          maxWidth: 1160, margin: "0 auto",
          padding: isMobile ? "48px 20px 56px" : "88px 48px",
          display: "flex", alignItems: "center",
          minHeight: isMobile ? "auto" : 580,
        }}>
          <div style={{ maxWidth: isMobile ? "100%" : 520 }}>
            <h1 style={{ fontFamily: C.serif, fontSize: "clamp(2.1rem,4.5vw,3.2rem)", fontWeight: 700, lineHeight: 1.15, color: C.navy, marginBottom: 20 }}>
              Win More Listings.<br />
              <span style={{ color: C.orange }}>Only Pay When You Win.</span>
            </h1>
            <p style={{ fontFamily: C.sans, fontSize: "1rem", fontWeight: 400, color: C.charcoal, lineHeight: 1.75, marginBottom: 36, maxWidth: 440 }}>
              BidToList connects you with homeowners actively seeking representation. No monthly fees. No upfront costs. Just a simple $395 success fee when you secure the listing.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 28 }}>
              <a href="/agents/register" style={primaryBtn}>
                Become a BidToList Agent
              </a>
              <a href="#how-it-works" style={{
                ...primaryBtn, background: "transparent", color: C.navy,
                border: `2px solid ${C.navy}`, gap: 8,
              }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill={C.navy}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                See How It Works
              </a>
            </div>
            <div style={{ display: "flex", flexWrap: "nowrap" as const, gap: 20, alignItems: "center" }}>
              {[
                { label: "No Monthly Fees",   icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
                { label: "No Upfront Costs",  icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
                { label: "Only $395 When You Win", icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
                { label: "Licensed Agents Only", icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg> },
              ].map(({ label, icon }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: C.sans, fontSize: "0.78rem", fontWeight: 400, color: C.charcoal, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                  {icon} {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {isMobile && (
          <img src="/hero_agents.png" alt="Agent reviewing opportunities" style={{ width: "100%", display: "block" }} />
        )}
      </section>

      {/* ── Traditional Lead Gen Is Broken ───────────────────────────────────── */}
      <section style={{ background: C.white, padding: isMobile ? "56px 20px" : "80px 48px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontFamily: C.serif, fontSize: "clamp(1.7rem,3vw,2.2rem)", fontWeight: 700, color: C.navy, textAlign: "center", marginBottom: 48 }}>
            Traditional Lead Generation Is Broken
          </h2>
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 16 : 24 }}>
            {/* Left: Traditional */}
            <div style={{
              background: C.warmWhite, border: `1px solid ${C.softGray}`,
              borderRadius: 16,
              padding: "28px 32px",
            }}>
              <p style={{ fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 700, color: C.navy, marginBottom: 20 }}>Traditional Lead Platforms</p>
              {[
                "Pay thousands upfront",
                "Compete against dozens of agents",
                "Cold leads",
                "No guarantee of ROI",
                "Long-term contracts",
              ].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <IcX size={16} color={C.red} />
                  <span style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 400, color: C.charcoal }}>{item}</span>
                </div>
              ))}
            </div>

            {/* VS badge */}
            {!isMobile && (
              <div style={{
                position: "absolute", left: "50%", top: "50%",
                transform: "translate(-50%, -50%)",
                width: 40, height: 40, borderRadius: "50%",
                background: C.orange, color: C.white,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: C.sans, fontSize: "0.65rem", fontWeight: 800,
                zIndex: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}>VS</div>
            )}

            {/* Right: BidToList */}
            <div style={{
              background: C.navy, border: `1px solid ${C.navy}`,
              borderRadius: 16,
              padding: "28px 32px",
            }}>
              <p style={{ fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 700, color: C.white, marginBottom: 20 }}>BidToList</p>
              {[
                "No subscription",
                "Only pay when you win",
                "Homeowners actively searching",
                "Predictable acquisition cost",
                "Cancel anytime",
              ].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <IcCheck size={16} color={C.orange} />
                  <span style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 400, color: "rgba(255,255,255,0.9)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── What Does One Listing Cost You? ──────────────────────────────────── */}
      <section id="pricing" style={{ background: C.warmWhite, padding: isMobile ? "56px 20px" : "80px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: C.serif, fontSize: "clamp(1.7rem,3vw,2.2rem)", fontWeight: 700, color: C.navy, textAlign: "center", marginBottom: 48 }}>
            What Does One Listing Cost You Today?
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 16 }}>
            {[
              { Icon: IcZillow,  label: "Zillow Premier Agent", price: "$500–$5,000+", unit: "/month",  sub: "Pay regardless of results.", featured: false },
              { Icon: IcGoogle,  label: "Google Ads",           price: "$1,000–$3,000+", unit: "/month", sub: "Requires ongoing optimization.", featured: false },
              { Icon: IcNetwork, label: "Referral Networks",    price: "25–35%",       unit: "",        sub: "Of your commission income.", featured: false },
              { Icon: IcTrophy,  label: "BidToList",            price: "$395",         unit: "",        sub: "Only if you actually secure the listing.", featured: true, badge: "You keep the rest." },
            ].map(({ Icon, label, price, unit, sub, featured, badge }) => (
              <div key={label} style={{
                background:   featured ? C.white : C.white,
                border:       featured ? `2px solid ${C.orange}` : `1px solid ${C.softGray}`,
                borderRadius: 16,
                padding:      "24px 20px",
                textAlign:    "center",
                boxShadow:    featured ? `0 4px 24px rgba(198,106,43,0.18)` : "0 2px 8px rgba(0,0,0,0.04)",
                display:      "flex",
                flexDirection:"column" as const,
                alignItems:   "center",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: featured ? "#FEF0E6" : "#EDEEF1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 12,
                }}>
                  <Icon size={24} />
                </div>
                <p style={{ fontFamily: C.sans, fontSize: "0.78rem", fontWeight: 600, color: featured ? C.navy : C.muted, marginBottom: 12 }}>{label}</p>
                <p style={{ fontFamily: C.serif, fontSize: featured ? "2rem" : "1.5rem", fontWeight: 700, color: featured ? C.orange : C.navy, lineHeight: 1, marginBottom: 2 }}>
                  {price}
                </p>
                {unit && <p style={{ fontFamily: C.sans, fontSize: "0.72rem", color: C.muted, marginBottom: 8 }}>{unit}</p>}
                <p style={{ fontFamily: C.sans, fontSize: "0.75rem", fontWeight: 400, color: C.muted, lineHeight: 1.5, marginTop: 8, flex: 1 }}>{sub}</p>
                {badge && (
                  <div style={{ marginTop: 14, background: C.orange, borderRadius: 8, padding: "5px 12px" }}>
                    <span style={{ fontFamily: C.sans, fontSize: "0.72rem", fontWeight: 700, color: C.white }}>{badge}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: C.white, padding: isMobile ? "56px 20px 64px" : "72px 48px 80px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: C.serif, fontSize: "clamp(1.7rem,3vw,2.2rem)", fontWeight: 700, color: C.navy, textAlign: "center", marginBottom: 56 }}>
            How It Works
          </h2>

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row" as const, gap: isMobile ? 40 : 0, alignItems: isMobile ? "flex-start" : "flex-start" }}>
            {[
              { Icon: IcUser,      n: "1", title: "Create Your Profile",     desc: "Highlight your experience and expertise." },
              { Icon: IcSearch,    n: "2", title: "Review Opportunities",     desc: "Browse homeowners actively looking for agents." },
              { Icon: IcClipboard, n: "3", title: "Submit Your Proposal",     desc: "Present your commission, marketing plan, local expertise, and track record." },
              { Icon: IcHandshake, n: "4", title: "Win the Listing",          desc: "Pay the $395 success fee only after securing the signed listing agreement." },
            ].map(({ Icon, n, title, desc }, i) => (
              <div key={n} style={{ display: "flex", flex: 1, alignItems: "flex-start" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center", paddingTop: 0 }}>
                  {/* Number circle */}
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: C.orange, color: C.white,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: C.sans, fontSize: "0.9rem", fontWeight: 700,
                    marginBottom: 16, flexShrink: 0,
                  }}>{n}</div>
                  {/* Icon in box */}
                  <div style={{
                    width: 68, height: 68, borderRadius: 14,
                    border: `1px solid ${C.softGray}`,
                    background: C.warmWhite,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 14,
                  }}>
                    <Icon size={30} color={C.navy} />
                  </div>
                  <p style={{ fontFamily: C.sans, fontSize: "0.9rem", fontWeight: 700, color: C.navy, marginBottom: 6 }}>{title}</p>
                  <p style={{ fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 400, color: C.charcoal, lineHeight: 1.6, maxWidth: 160 }}>{desc}</p>
                </div>
                {/* Arrow */}
                {i < 3 && !isMobile && (
                  <div style={{ paddingTop: 18, flexShrink: 0, display: "flex", alignItems: "center" }}>
                    <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Transparent Pricing ──────────────────────────────────────────────── */}
      <section style={{ background: C.warmWhite, padding: isMobile ? "56px 20px" : "80px 48px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* Header */}
          <p style={{ fontFamily: C.mono, fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase" as const, color: C.orange, textAlign: "center", marginBottom: 12 }}>
            Transparent Pricing
          </p>
          <h2 style={{ fontFamily: C.serif, fontSize: "clamp(2rem,4.5vw,3rem)", fontWeight: 700, color: C.navy, textAlign: "center", lineHeight: 1.1, marginBottom: 16 }}>
            You Only Pay When You Win<span style={{ color: C.orange }}>.</span>
          </h2>
          <p style={{ fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 400, color: C.charcoal, textAlign: "center", lineHeight: 1.65, maxWidth: 560, margin: "0 auto 48px" }}>
            You secure the signed listing agreement. You pay the $395 success fee. Until then, you owe nothing.
          </p>

          {/* Two-column layout */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.45fr", gap: 20, marginBottom: 20 }}>

            {/* Left: $395 card */}
            <div style={{ background: C.white, border: `1px solid ${C.softGray}`, borderRadius: 16, padding: "36px 28px", display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEF0E6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <IcTrophy size={28} />
              </div>
              <p style={{ fontFamily: C.serif, fontSize: "clamp(3rem,6vw,4.5rem)", fontWeight: 700, color: C.orange, lineHeight: 1, marginBottom: 6 }}>$395</p>
              <p style={{ fontFamily: C.sans, fontSize: "1rem", fontWeight: 700, color: C.navy, marginBottom: 28 }}>Success Fee Per Signed Listing</p>
              <div style={{ width: "100%", textAlign: "left" as const }}>
                {[
                  "No monthly fees",
                  "No contracts",
                  "No upfront costs",
                  "No charge for losing bids",
                  "Only pay after securing the listing agreement",
                ].map((item, i, arr) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.softGray}` : "none" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 400, color: C.charcoal }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Comparison table */}
            <div style={{ background: C.white, border: `1px solid ${C.softGray}`, borderRadius: 16, overflow: "hidden" }}>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ background: C.navy, padding: "16px 20px" }}>
                  <p style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 700, color: C.white }}>Traditional Lead Sources</p>
                </div>
                <div style={{ background: C.orange, padding: "16px 20px" }}>
                  <p style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 700, color: C.white }}>BidToList</p>
                </div>
              </div>
              {/* Rows */}
              {[
                {
                  li: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
                  lt: "Pay before results",
                  ri: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
                  rt: "Pay after results",
                },
                {
                  li: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                  lt: "Monthly commitments",
                  ri: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="5" y1="5" x2="19" y2="19"/></svg>,
                  rt: "No subscriptions",
                },
                {
                  li: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
                  lt: "Unpredictable ROI",
                  ri: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
                  rt: "Fixed $395 success fee",
                },
                {
                  li: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
                  lt: "Risk is on the agent",
                  ri: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
                  rt: "Risk is shared",
                },
              ].map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: `1px solid ${C.softGray}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 20px", borderRight: `1px solid ${C.softGray}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EDEEF1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{row.li}</div>
                    <span style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 400, color: C.charcoal }}>{row.lt}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 20px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#FEF0E6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{row.ri}</div>
                    <span style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 400, color: C.charcoal }}>{row.rt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom trust bar */}
          <div style={{
            background: "#EEF2F8", borderRadius: 12, padding: "20px 28px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: 24, flexDirection: isMobile ? "column" : "row" as const,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
              </div>
              <div>
                <p style={{ fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 700, color: C.navy }}>We succeed when you do.</p>
                <p style={{ fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 400, color: C.muted }}>Our model is built around your success—not our fees.</p>
              </div>
            </div>
            <a href="/agents/register" style={{ ...primaryBtn, whiteSpace: "nowrap" as const }}>
              Become a BidToList Agent →
            </a>
          </div>

        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section style={{ background: C.white, padding: isMobile ? "56px 20px" : "80px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: C.serif, fontSize: "clamp(1.7rem,3vw,2.2rem)", fontWeight: 700, color: C.navy, textAlign: "center", marginBottom: 48 }}>
            Why Agents Are Joining Early
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 24 }}>
            {[
              { name: "Michael T.", location: "Naples, FL",        quote: "I'd rather pay after I get paid than gamble on monthly lead fees." },
              { name: "Sarah L.",   location: "Bonita Springs, FL", quote: "This is how agent acquisition should work. Fair, transparent, and performance-based." },
              { name: "Jason R.",   location: "Marco Island, FL",  quote: "The homeowner is already motivated—you're not chasing internet leads." },
            ].map(({ name, location, quote }) => (
              <div key={name} style={{
                background: C.warmWhite, border: `1px solid ${C.softGray}`,
                borderRadius: 16, padding: "28px 24px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                display: "flex", flexDirection: "column" as const,
              }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(n => <IcStar key={n} size={15} />)}
                </div>
                <p style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 400, color: C.charcoal, lineHeight: 1.75, flex: 1, marginBottom: 20 }}>
                  "{quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", background: C.navy, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: C.serif, fontSize: "1rem", fontWeight: 700, color: C.white,
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
                    width: "100%", display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "18px 20px",
                    background: "none", border: "none", cursor: "pointer",
                    textAlign: "left" as const, gap: 12,
                  }}
                >
                  <span style={{ fontFamily: C.sans, fontSize: "0.9rem", fontWeight: 600, color: C.navy }}>{q}</span>
                  <span style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
                    background: openFaq === i ? C.orange : C.softGray,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s",
                  }}>
                    <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                      <path d={openFaq === i ? "M2 8L6 4L10 8" : "M2 4L6 8L10 4"} stroke={openFaq === i ? C.white : C.charcoal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 18px", borderTop: `1px solid ${C.softGray}` }}>
                    <p style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 400, color: C.charcoal, lineHeight: 1.75, marginTop: 14 }}>{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative", overflow: "hidden",
        padding: isMobile ? "72px 20px" : "100px 48px",
        backgroundImage: "url('/bottom_section_house.png')",
        backgroundSize: "cover", backgroundPosition: "center",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(20,43,77,0.84)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", display: isMobile ? "block" : "flex", alignItems: "center", justifyContent: "space-between", gap: 48 }}>
          <div style={{ marginBottom: isMobile ? 28 : 0 }}>
            <h2 style={{ fontFamily: C.serif, fontSize: "clamp(1.8rem,3.5vw,2.4rem)", fontWeight: 700, color: C.white, lineHeight: 1.2, marginBottom: 12 }}>
              Stop Paying for Leads<br />That Don't Convert.
            </h2>
            <p style={{ fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 400, color: "rgba(255,255,255,0.72)", lineHeight: 1.65 }}>
              Join BidToList and only pay when you win listings.
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <a href="/agents/register" style={{ ...primaryBtn, fontSize: "1rem", padding: "14px 32px", borderRadius: 14, boxShadow: "0 8px 24px rgba(198,106,43,0.4)", display: "inline-flex", marginBottom: 16 }}>
              Become a BidToList Agent
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <IcLock size={13} color="rgba(255,255,255,0.45)" />
              <span style={{ fontFamily: C.sans, fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
                No Subscriptions. No Contracts. $395 Success Fee.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#0D1E38", borderTop: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "32px 20px 24px" : "44px 48px 28px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row" as const, gap: 24, marginBottom: 24,
          }}>
            <img src="/logo.png" alt="BidToList" style={{ height: 30, display: "block" }} />
            <p style={{ fontFamily: C.sans, fontSize: "0.75rem", fontWeight: 400, color: "rgba(255,255,255,0.42)", lineHeight: 1.6, maxWidth: 360 }}>
              We respect your privacy and never sell your information. Proudly serving Southwest Florida agents.
            </p>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" as const }}>
              {[{ l: "FAQ", h: "/faq" }, { l: "For Homeowners", h: "/" }, { l: "Join as Agent", h: "/agents/register" }].map(({ l, h }) => (
                <a key={l} href={h} style={{ fontFamily: C.sans, fontSize: "0.78rem", color: "rgba(255,255,255,0.42)", textDecoration: "none" }}>{l}</a>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 18 }}>
            <p style={{ fontFamily: C.mono, fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.25)", textAlign: "center", marginBottom: 12 }}>
              As Featured In
            </p>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: isMobile ? 20 : 40, flexWrap: "wrap" as const, marginBottom: 16 }}>
              {["Naples News", "Pelican Bay Foundation", "Naples Illustrated"].map(n => (
                <span key={n} style={{ fontFamily: C.sans, fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.25)", letterSpacing: "0.02em" }}>{n}</span>
              ))}
            </div>
            <p style={{ textAlign: "center", fontFamily: C.sans, fontSize: "0.68rem", color: "rgba(255,255,255,0.2)" }}>
              © 2026 BidToList · Proudly Local Serving SW Florida Agents
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
