import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";

const S = {
  bg:        "#F4F6F8",
  white:     "#FFFFFF",
  dark:      "#111827",
  muted:     "#6B7280",
  border:    "#E5E7EB",
  green:     "#2A8B57",
  greenLight:"#E6F4ED",
  yellow:    "#F5C842",
  blue:      "#1B3266",
  blueLight: "#EBF0FF",
  peach:     "#F07858",
  peachLight:"#FEF0EB",
  sans:  "'IBM Plex Sans', sans-serif",
};

export default function SignUpPage() {
  const { isAuthenticated, role, loginWithRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isMobile } = useBreakpoint();
  const [loading, setLoading] = useState<"homeowner" | "agent" | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const autoTriggered = useRef(false);

  const preselectedRole = searchParams.get("role") === "agent"     ? "agent"
                        : searchParams.get("role") === "homeowner" ? "homeowner"
                        : null;

  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(role === "agent" ? "/agents/dashboard" : "/post", { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  useEffect(() => {
    if (preselectedRole && !isAuthenticated && !autoTriggered.current) {
      autoTriggered.current = true;
      handleSelect(preselectedRole);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedRole]);

  async function handleSelect(selected: "homeowner" | "agent") {
    setError(null);
    setLoading(selected);
    try {
      const finalRole = await loginWithRole(selected);
      navigate(finalRole === "agent" ? "/agents/dashboard" : "/post", { replace: true });
    } catch {
      setError("Sign-in was cancelled or failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  const cards = [
    {
      role:   "homeowner" as const,
      icon:   "🏠",
      label:  "For Homeowners",
      title:  "Sell your home smarter.",
      body:   "Post your home once and let licensed agents compete for your listing with blind proposals. Free for homeowners — always.",
      cta:    "Get Started — Free",
      accent: S.green,
      pale:   S.greenLight,
      shadow: "rgba(42,139,87,0.18)",
    },
    {
      role:   "agent" as const,
      icon:   "🏆",
      label:  "For Real Estate Agents",
      title:  "Win listings on merit.",
      body:   "Browse verified homeowner requests and submit proposals. Pay only $295 when your bid is accepted — no monthly fees, ever.",
      cta:    "Join as an Agent",
      accent: S.blue,
      pale:   S.blueLight,
      shadow: "rgba(27,50,102,0.18)",
    },
  ];

  return (
    <div style={{ background: S.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Helmet>
        <title>Sign Up — BidtoList</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Nav */}
      <nav style={{
        background:   S.white,
        borderBottom: `1px solid ${S.border}`,
        padding:      isMobile ? "14px 20px" : "16px 48px",
        display:      "flex",
        justifyContent: "space-between",
        alignItems:   "center",
        boxShadow:    "0 1px 12px rgba(0,0,0,0.06)",
      }}>
        <a href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          <img src="/logo.png" alt="BidtoList" style={{ height: 40, width: "auto", display: "block" }} />
        </a>
        <a href="/" style={{ fontFamily: S.sans, fontSize: "0.85rem", fontWeight: 500, color: S.muted, textDecoration: "none" }}>
          ← Back
        </a>
      </nav>

      {/* Content */}
      <main style={{ flex: 1, maxWidth: 900, margin: "0 auto", padding: isMobile ? "48px 20px 64px" : "80px 48px 96px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: S.greenLight, borderRadius: 100, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: S.green }} />
            <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 600, color: S.green }}>
              Get Started
            </span>
          </div>
          <h1 style={{
            fontFamily:    S.sans,
            fontSize:      "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight:    800,
            color:         S.dark,
            letterSpacing: "-0.02em",
            lineHeight:    1.1,
            marginBottom:  14,
          }}>
            How would you like to use BidtoList?
          </h1>
          <p style={{ fontFamily: S.sans, fontSize: "1rem", color: S.muted, lineHeight: 1.75, maxWidth: 460, margin: "0 auto" }}>
            Choose your role. You'll be signed in with Internet Identity — no password required.
          </p>
        </div>

        {/* Role cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
          {cards.map(card => (
            <div
              key={card.role}
              style={{
                background:   S.white,
                borderRadius: 20,
                border:       `1px solid ${S.border}`,
                padding:      isMobile ? "32px 24px" : "40px 36px",
                display:      "flex",
                flexDirection:"column",
                boxShadow:    "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              {/* Icon badge */}
              <div style={{
                width:          52,
                height:         52,
                borderRadius:   14,
                background:     card.pale,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       "1.5rem",
                marginBottom:   20,
                boxShadow:      `0 4px 16px ${card.shadow}`,
              }}>
                {card.icon}
              </div>

              <span style={{
                display:        "inline-block",
                background:     card.pale,
                color:          card.accent,
                fontFamily:     S.sans,
                fontSize:       "0.72rem",
                fontWeight:     700,
                textTransform:  "uppercase",
                letterSpacing:  "0.08em",
                padding:        "4px 12px",
                borderRadius:   100,
                marginBottom:   16,
                alignSelf:      "flex-start",
              }}>
                {card.label}
              </span>

              <h2 style={{
                fontFamily:    S.sans,
                fontSize:      "1.35rem",
                fontWeight:    800,
                color:         S.dark,
                marginBottom:  12,
                lineHeight:    1.25,
                letterSpacing: "-0.01em",
              }}>
                {card.title}
              </h2>
              <p style={{
                fontFamily: S.sans,
                fontSize:   "0.93rem",
                color:      S.muted,
                lineHeight: 1.75,
                marginBottom: 32,
                flexGrow:   1,
              }}>
                {card.body}
              </p>

              <button
                onClick={() => handleSelect(card.role)}
                disabled={loading !== null}
                style={{
                  background:   card.accent,
                  border:       "none",
                  color:        S.white,
                  fontFamily:   S.sans,
                  fontSize:     "0.9rem",
                  fontWeight:   700,
                  padding:      "14px 28px",
                  borderRadius: 100,
                  cursor:       loading !== null ? "not-allowed" : "pointer",
                  opacity:      loading !== null && loading !== card.role ? 0.45 : 1,
                  alignSelf:    "flex-start",
                  transition:   "opacity 0.15s",
                }}
              >
                {loading === card.role ? "Opening sign-in…" : card.cta}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <p style={{ fontFamily: S.sans, fontSize: "0.9rem", color: "#B91C1C", textAlign: "center", marginTop: 28 }}>
            {error}
          </p>
        )}

        <p style={{ fontFamily: S.sans, fontSize: "0.85rem", color: S.muted, textAlign: "center", marginTop: 40, lineHeight: 1.65 }}>
          Already have an account?{" "}
          <a href="/" style={{ color: S.green, fontWeight: 600, textDecoration: "none" }}>
            Go back and sign in
          </a>
        </p>
      </main>

      {/* Footer */}
      <footer style={{
        background:     S.dark,
        padding:        isMobile ? "20px 20px" : "24px 48px",
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 3 }}>
            <span style={{ display: "inline-block", width: 3, height: 14, background: S.green, borderRadius: 2 }} />
            <span style={{ display: "inline-block", width: 3, height: 14, background: S.yellow, borderRadius: 2 }} />
          </div>
          <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>BidtoList</span>
          <span style={{ fontFamily: S.sans, fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>© 2026</span>
        </div>
        <a href="/faq" style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 500, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>
          FAQ
        </a>
      </footer>
    </div>
  );
}
