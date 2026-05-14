import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";

const S = {
  white: "#FFFFFF",
  peach: "#F28B68",
  peachLight: "#FFF3EF",
  blue: "#1B3F8A",
  blueLight: "#EBF2FF",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace",
  sans: "'IBM Plex Sans', sans-serif",
};

export default function SignUpPage() {
  const { isAuthenticated, role, loginWithRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isMobile } = useBreakpoint();
  const [loading, setLoading] = useState<"homeowner" | "agent" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  const preselectedRole = searchParams.get("role") === "agent" ? "agent"
    : searchParams.get("role") === "homeowner" ? "homeowner"
    : null;

  // Redirect already-authenticated users to their destination.
  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(role === "agent" ? "/agents/dashboard" : "/post", { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  // Auto-trigger login when a role is pre-selected via query param.
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
      role: "homeowner" as const,
      label: "I'm a Homeowner",
      title: "Sell your home smarter.",
      body: "Post your home once and let licensed agents compete for your listing with blind proposals. Free for homeowners — always.",
      cta: "Get Started — Free",
      accent: S.peach,
      bg: S.peachLight,
    },
    {
      role: "agent" as const,
      label: "I'm a Real Estate Agent",
      title: "Win listings on merit.",
      body: "Browse verified homeowner requests and submit proposals. Pay only $295 when your bid is accepted — no monthly fees.",
      cta: "Join as an Agent",
      accent: S.blue,
      bg: S.blueLight,
    },
  ];

  return (
    <div style={{ background: S.white, minHeight: "100vh" }}>
      <Helmet>
        <title>Sign Up — BidtoList</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${S.border}`, padding: isMobile ? "14px 20px" : "18px 48px", display: "flex", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: "1.3rem", fontWeight: 900, color: S.blue, textDecoration: "none" }}>
          BidtoList
        </a>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 880, margin: "0 auto", padding: isMobile ? "48px 20px" : "80px 48px" }}>
        <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: S.textMuted, marginBottom: 16, textAlign: "center" }}>
          Get Started
        </p>
        <h1 style={{ fontFamily: S.serif, fontSize: "clamp(1.7rem, 4vw, 2.6rem)", fontWeight: 900, color: S.blue, textAlign: "center", marginBottom: 12 }}>
          How would you like to use BidtoList?
        </h1>
        <p style={{ fontFamily: S.sans, fontSize: "1rem", color: S.textMuted, textAlign: "center", marginBottom: 56, lineHeight: 1.7 }}>
          Choose your role. You'll be signed in with Internet Identity — no password required.
        </p>

        {/* Role cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
          {cards.map(card => (
            <div
              key={card.role}
              style={{ background: card.bg, border: `1px solid ${S.border}`, padding: isMobile ? "32px 24px" : "40px 36px", display: "flex", flexDirection: "column" }}
            >
              <p style={{ fontFamily: S.mono, fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase", color: card.accent, marginBottom: 20 }}>
                {card.label}
              </p>
              <h2 style={{ fontFamily: S.serif, fontSize: "1.5rem", fontWeight: 900, color: S.blue, marginBottom: 16, lineHeight: 1.25 }}>
                {card.title}
              </h2>
              <p style={{ fontFamily: S.sans, fontSize: "0.95rem", color: S.textMuted, lineHeight: 1.7, marginBottom: 36, flexGrow: 1 }}>
                {card.body}
              </p>
              <button
                onClick={() => handleSelect(card.role)}
                disabled={loading !== null}
                style={{
                  background: card.accent,
                  border: `1px solid ${card.accent}`,
                  color: S.white,
                  fontFamily: S.mono,
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "14px 28px",
                  cursor: loading !== null ? "not-allowed" : "pointer",
                  opacity: loading !== null && loading !== card.role ? 0.5 : 1,
                  alignSelf: "flex-start",
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

        <p style={{ fontFamily: S.sans, fontSize: "0.85rem", color: S.textMuted, textAlign: "center", marginTop: 40, lineHeight: 1.65 }}>
          Already have an account?{" "}
          <a href="/" style={{ color: S.blue, fontWeight: 500 }}>
            Go back and sign in
          </a>
        </p>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${S.border}`, padding: isMobile ? "20px" : "24px 48px", textAlign: "center" }}>
        <span style={{ fontFamily: S.mono, fontSize: "0.62rem", color: S.textMuted, letterSpacing: "0.08em" }}>© 2026 BIDTOLIST — VOLUSIA + FLAGLER COUNTIES, FL</span>
      </footer>
    </div>
  );
}
