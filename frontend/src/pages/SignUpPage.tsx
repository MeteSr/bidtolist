import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import type { OpenIdProvider } from "../services/actor";

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
  const [loading, setLoading] = useState<string | null>(null);
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

  async function handleSelect(selected: "homeowner" | "agent", provider?: OpenIdProvider) {
    const key = provider ? `${selected}-${provider}` : selected;
    setError(null);
    setLoading(key);
    try {
      const finalRole = await loginWithRole(selected, provider);
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
            Choose your role. Sign in with Internet Identity, Google, Apple, or Microsoft — no password required.
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

              {/* Social login divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 14px" }}>
                <div style={{ flex: 1, height: 1, background: S.border }} />
                <span style={{ fontFamily: S.sans, fontSize: "0.72rem", color: S.muted, whiteSpace: "nowrap" }}>or continue with</span>
                <div style={{ flex: 1, height: 1, background: S.border }} />
              </div>

              {/* Social buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                {([
                  { provider: "google"    as OpenIdProvider, label: "Google",    icon: <GoogleIcon /> },
                  { provider: "apple"     as OpenIdProvider, label: "Apple",     icon: <AppleIcon /> },
                  { provider: "microsoft" as OpenIdProvider, label: "Microsoft", icon: <MicrosoftIcon /> },
                ] as const).map(({ provider, label, icon }) => {
                  const key = `${card.role}-${provider}`;
                  return (
                    <button
                      key={provider}
                      onClick={() => handleSelect(card.role, provider)}
                      disabled={loading !== null}
                      title={`Sign in with ${label}`}
                      style={{
                        flex:         1,
                        display:      "flex",
                        alignItems:   "center",
                        justifyContent: "center",
                        gap:          6,
                        background:   S.white,
                        border:       `1px solid ${S.border}`,
                        borderRadius: 100,
                        padding:      "9px 0",
                        fontFamily:   S.sans,
                        fontSize:     "0.78rem",
                        fontWeight:   600,
                        color:        S.dark,
                        cursor:       loading !== null ? "not-allowed" : "pointer",
                        opacity:      loading !== null && loading !== key ? 0.45 : 1,
                        transition:   "opacity 0.15s, border-color 0.15s",
                      }}
                    >
                      {loading === key ? "…" : icon}
                      <span>{loading === key ? "Opening…" : label}</span>
                    </button>
                  );
                })}
              </div>
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

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#00A4EF" d="M13 1h10v10H13z"/>
      <path fill="#7FBA00" d="M1 13h10v10H1z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  );
}
