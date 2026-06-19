import { useEffect, useState, type ReactElement } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import type { OpenIdProvider } from "../services/actor";

const C = {
  navy:      "#142B4D",
  orange:    "#C66A2B",
  warmWhite: "#FAF9F7",
  softGray:  "#E7E7E4",
  charcoal:  "#3B3B3B",
  muted:     "#7A7A72",
  white:     "#FFFFFF",
  red:       "#B91C1C",
  serif:     "'Playfair Display', Georgia, serif",
  sans:      "Inter, 'IBM Plex Sans', system-ui, sans-serif",
  mono:      "'IBM Plex Mono', monospace",
};

type AuthTab    = "login" | "signup";
type SignUpStep = "role"  | "auth";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IcpShieldWhite() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
        fill="rgba(255,255,255,0.15)" stroke={C.white} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke={C.white} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IcpShieldNavy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
        fill="rgba(20,43,77,0.1)" stroke={C.navy} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={C.charcoal} aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#00A4EF" d="M13 1h10v10H13z"/>
      <path fill="#7FBA00" d="M1 13h10v10H1z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={C.orange} aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <polyline points="16 11 18 13 22 9"/>
    </svg>
  );
}

// ── Auth Buttons ──────────────────────────────────────────────────────────────

const PROVIDERS: { id: OpenIdProvider; label: string; Icon: () => ReactElement }[] = [
  { id: "google",    label: "Google",    Icon: GoogleIcon },
  { id: "apple",     label: "Apple",     Icon: AppleIcon },
  { id: "microsoft", label: "Microsoft", Icon: MicrosoftIcon },
];

function AuthButtons({
  onSelect,
  loading,
  keyPrefix = "",
  iiLabel   = "Continue with Internet Identity",
  verb      = "Continue with",
}: {
  onSelect:  (provider?: OpenIdProvider) => void;
  loading:   string | null;
  keyPrefix?: string;
  iiLabel?:  string;
  verb?:     string;
}) {
  const iiKey = `${keyPrefix}ii`;
  const busy  = loading !== null;

  return (
    <div>
      {/* Internet Identity — primary */}
      <button
        onClick={() => onSelect()}
        disabled={busy}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "13px 18px", background: C.navy, border: "none",
          borderRadius: 12, cursor: busy ? "not-allowed" : "pointer",
          opacity: busy && loading !== iiKey ? 0.5 : 1,
          marginBottom: 8, transition: "opacity 0.15s",
        }}
      >
        <IcpShieldWhite />
        <span style={{
          flex: 1, fontFamily: C.sans, fontSize: "0.875rem",
          fontWeight: 600, color: C.white, textAlign: "left" as const,
        }}>
          {loading === iiKey ? "Opening sign-in…" : iiLabel}
        </span>
        <span style={{
          background: C.orange, color: C.white, fontFamily: C.mono,
          fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px",
          borderRadius: 5, letterSpacing: "0.06em", flexShrink: 0,
        }}>
          ICP
        </span>
      </button>

      <p style={{
        fontFamily: C.sans, fontSize: "0.7rem", color: C.muted,
        textAlign: "center", marginBottom: 18,
      }}>
        Secure, passwordless authentication powered by the Internet Computer.
      </p>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 1, background: C.softGray }} />
        <span style={{ fontFamily: C.sans, fontSize: "0.72rem", color: C.muted, whiteSpace: "nowrap" as const }}>
          or
        </span>
        <div style={{ flex: 1, height: 1, background: C.softGray }} />
      </div>

      {/* Social providers */}
      {PROVIDERS.map(({ id, label, Icon }) => {
        const key = `${keyPrefix}${id}`;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            disabled={busy}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "11px 18px", background: C.white,
              border: `1.5px solid ${C.softGray}`, borderRadius: 12,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy && loading !== key ? 0.5 : 1,
              marginBottom: 10, transition: "opacity 0.15s, border-color 0.15s",
              fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 500, color: C.charcoal,
            }}
            onMouseEnter={(e) => {
              if (!busy) (e.currentTarget as HTMLButtonElement).style.borderColor = C.navy;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = C.softGray;
            }}
          >
            <Icon />
            <span>{loading === key ? "Opening…" : `${verb} ${label}`}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Role Selector ─────────────────────────────────────────────────────────────

const ROLES = [
  {
    id:    "homeowner" as const,
    emoji: "🏠",
    label: "Homeowner",
    sub:   "Post your home and compare proposals from competing agents.",
    pale:  "#E9F5F0",
  },
  {
    id:    "agent" as const,
    emoji: "🏆",
    label: "Real Estate Agent",
    sub:   "Browse opportunities and compete for listings.",
    pale:  "#EBF0FF",
  },
];

function RoleSelector({ onSelect }: { onSelect: (role: "homeowner" | "agent") => void }) {
  return (
    <div>
      <p style={{
        fontFamily: C.sans, fontSize: "0.875rem", color: C.charcoal,
        textAlign: "center", marginBottom: 20, lineHeight: 1.6,
      }}>
        I am joining as a…
      </p>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
        {ROLES.map(({ id, emoji, label, sub, pale }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "16px 18px", background: C.warmWhite,
              border: `1.5px solid ${C.softGray}`, borderRadius: 14,
              cursor: "pointer", textAlign: "left" as const,
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = C.orange;
              el.style.background  = C.white;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = C.softGray;
              el.style.background  = C.warmWhite;
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: pale,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.4rem", flexShrink: 0,
            }}>
              {emoji}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: C.sans, fontSize: "0.9rem", fontWeight: 700, color: C.navy, marginBottom: 3 }}>
                {label}
              </p>
              <p style={{ fontFamily: C.sans, fontSize: "0.775rem", color: C.muted, lineHeight: 1.4 }}>
                {sub}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { isAuthenticated, role, isLoading, login, loginWithRole } = useAuth();
  const navigate                   = useNavigate();
  const [searchParams]             = useSearchParams();
  const { isMobile }               = useBreakpoint();

  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const [tab,          setTab]          = useState<AuthTab>(initialTab);
  const [signUpStep,   setSignUpStep]   = useState<SignUpStep>("role");
  const [selectedRole, setSelectedRole] = useState<"homeowner" | "agent" | null>(null);
  const [loading,      setLoading]      = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      navigate(role === "agent" ? "/agents/dashboard" : "/my-bids", { replace: true });
    }
  }, [isLoading, isAuthenticated, role, navigate]);

  function switchTab(t: AuthTab) {
    setTab(t);
    setSignUpStep("role");
    setSelectedRole(null);
    setError(null);
    setLoading(null);
  }

  async function handleLogin(provider?: OpenIdProvider) {
    const key = provider ?? "ii";
    setError(null);
    setLoading(key);
    try {
      await login(provider);
      // AuthContext sets role after login; useEffect handles navigation
    } catch {
      setError("Sign-in was cancelled or failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleSignUp(provider?: OpenIdProvider) {
    if (!selectedRole) return;
    const key = provider ? `${selectedRole}-${provider}` : `${selectedRole}-ii`;
    setError(null);
    setLoading(key);
    try {
      const finalRole = await loginWithRole(selectedRole, provider);
      navigate(finalRole === "agent" ? "/agents/dashboard" : "/my-bids", { replace: true });
    } catch {
      setError("Sign-in was cancelled or failed. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  // Show blank while checking auth so we don't flash the form before redirecting
  if (isLoading) {
    return <div style={{ minHeight: "100vh", background: C.warmWhite }} />;
  }

  const signupKeyPrefix = selectedRole ? `${selectedRole}-` : "";

  return (
    <div style={{
      display:       "flex",
      flexDirection: isMobile ? "column" : "row",
      minHeight:     "100vh",
    }}>
      <Helmet>
        <title>Sign In — BidToList</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* ── LEFT PANEL — brand story + luxury image ─────────────────────────── */}
      <div style={{
        position: "relative",
        overflow: "hidden",
        ...(isMobile
          ? { height: 220, flexShrink: 0 }
          : { flex: "0 0 50%", display: "flex", flexDirection: "column" as const, minHeight: "100vh" }
        ),
      }}>
        {/* Background image */}
        <div style={{
          position:           "absolute",
          inset:              0,
          backgroundImage:    "url('/bottom_section_house.png')",
          backgroundSize:     "cover",
          backgroundPosition: "center",
          zIndex:             0,
        }} />
        {/* Overlay */}
        <div style={{
          position:   "absolute",
          inset:      0,
          background: "rgba(20,43,77,0.72)",
          zIndex:     1,
        }} />

        {/* Logo — always visible */}
        <div style={{ position: "relative", zIndex: 2, padding: isMobile ? "20px 24px" : "36px 44px" }}>
          <a href="/" style={{ display: "inline-block" }}>
            <img
              src="/logo_transparent_bg.png"
              alt="BidToList"
              style={{ height: isMobile ? 28 : 34, display: "block", filter: "brightness(0) invert(1)" }}
            />
          </a>
        </div>

        {/* Desktop-only content */}
        {!isMobile && (
          <div style={{
            position:      "relative",
            zIndex:        2,
            flex:          1,
            display:       "flex",
            flexDirection: "column",
            padding:       "0 44px 40px",
          }}>
            {/* Hero text */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, justifyContent: "center" }}>
              <p style={{
                fontFamily: C.mono, fontSize: "0.63rem",
                letterSpacing: "0.15em", textTransform: "uppercase" as const,
                color: C.orange, marginBottom: 16,
              }}>
                Agents Compete. Homeowners Win.
              </p>
              <h1 style={{
                fontFamily: C.serif, fontSize: "clamp(1.8rem, 2.8vw, 2.5rem)",
                fontWeight: 700, color: C.white, lineHeight: 1.2, marginBottom: 18,
              }}>
                The Smarter Way<br />
                to Choose a<br />
                <span style={{ color: C.orange }}>Listing Agent.</span>
              </h1>
              <p style={{
                fontFamily: C.sans, fontSize: "0.9rem",
                color: "rgba(255,255,255,0.70)", lineHeight: 1.7,
                marginBottom: 44, maxWidth: 340,
              }}>
                Post your home once and receive proposals from licensed agents competing to earn your business.
              </p>

              {/* Trust badges */}
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 14, marginBottom: 48 }}>
                {[
                  { emoji: "🏠", label: "Verified Homeowners", sub: "Identity and ownership verified." },
                  { emoji: "✅", label: "Verified Agents",      sub: "License and identity verified." },
                  { emoji: "🔒", label: "Secure & Private",     sub: "Your information is protected." },
                ].map(({ emoji, label, sub }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: "rgba(255,255,255,0.12)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1rem", flexShrink: 0,
                    }}>
                      {emoji}
                    </div>
                    <div>
                      <p style={{ fontFamily: C.sans, fontSize: "0.8rem", fontWeight: 700, color: C.white, marginBottom: 1 }}>
                        {label}
                      </p>
                      <p style={{ fontFamily: C.sans, fontSize: "0.7rem", color: "rgba(255,255,255,0.55)" }}>
                        {sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonial — glassmorphism card */}
            <div style={{
              background:           "rgba(255,255,255,0.10)",
              backdropFilter:       "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border:               "1px solid rgba(255,255,255,0.18)",
              borderRadius:         16,
              padding:              "20px 22px",
            }}>
              <div style={{ display: "flex", gap: 3, marginBottom: 10 }}>
                {[1,2,3,4,5].map(n => <StarIcon key={n} />)}
              </div>
              <p style={{
                fontFamily: C.sans, fontSize: "0.85rem",
                color: "rgba(255,255,255,0.9)", lineHeight: 1.65,
                marginBottom: 14, fontStyle: "italic",
              }}>
                "BidToList gave me more options, better proposals, and total confidence in my decision."
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: C.orange,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: C.serif, fontSize: "0.9rem", fontWeight: 700, color: C.white, flexShrink: 0,
                }}>
                  S
                </div>
                <div>
                  <p style={{ fontFamily: C.sans, fontSize: "0.8rem", fontWeight: 600, color: C.white }}>
                    Sarah M.
                  </p>
                  <p style={{ fontFamily: C.mono, fontSize: "0.62rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>
                    Naples Homeowner
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL — auth card ──────────────────────────────────────────── */}
      <div style={{
        flex:          1,
        display:       "flex",
        flexDirection: "column",
        background:    C.warmWhite,
        overflowY:     "auto",
        minHeight:     isMobile ? "auto" : "100vh",
      }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px 28px" }}>
          <p style={{ fontFamily: C.sans, fontSize: "0.78rem", color: C.muted }}>
            Need help?{" "}
            <a href="/faq" style={{ color: C.orange, fontWeight: 600, textDecoration: "none" }}>
              Contact Support
            </a>
          </p>
        </div>

        {/* Centered card area */}
        <div style={{
          flex:           1,
          display:        "flex",
          alignItems:     isMobile ? "flex-start" : "center",
          justifyContent: "center",
          padding:        isMobile ? "16px 20px 48px" : "8px 32px 48px",
        }}>
          <div style={{ width: "100%", maxWidth: 480 }}>

            {/* Card */}
            <div style={{
              background:   C.white,
              borderRadius: 24,
              padding:      isMobile ? "28px 22px" : "40px 36px",
              boxShadow:    "0 4px 32px rgba(0,0,0,0.08)",
            }}>
              <h2 style={{
                fontFamily: C.serif, fontSize: "1.7rem", fontWeight: 700,
                color: C.navy, textAlign: "center", marginBottom: 8,
              }}>
                Welcome to BidToList
              </h2>
              <p style={{
                fontFamily: C.sans, fontSize: "0.875rem", color: C.muted,
                textAlign: "center", marginBottom: 28, lineHeight: 1.6,
              }}>
                Sign in to your account or create a new one to get started.
              </p>

              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: `2px solid ${C.softGray}`, marginBottom: 28 }}>
                {(["login", "signup"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => switchTab(t)}
                    style={{
                      flex: 1, background: "none", border: "none",
                      borderBottom: `2px solid ${tab === t ? C.orange : "transparent"}`,
                      marginBottom: -2, padding: "10px 0",
                      fontFamily: C.sans, fontSize: "0.9rem",
                      fontWeight: tab === t ? 700 : 500,
                      color: tab === t ? C.navy : C.muted,
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {t === "login" ? "Log In" : "Sign Up"}
                  </button>
                ))}
              </div>

              {/* ── Log In tab ──────────────────────────────────────────────── */}
              {tab === "login" && (
                <AuthButtons
                  onSelect={handleLogin}
                  loading={loading}
                  keyPrefix=""
                  iiLabel="Continue with Internet Identity"
                  verb="Continue with"
                />
              )}

              {/* ── Sign Up — step 1: role ───────────────────────────────────── */}
              {tab === "signup" && signUpStep === "role" && (
                <RoleSelector onSelect={(r) => { setSelectedRole(r); setSignUpStep("auth"); }} />
              )}

              {/* ── Sign Up — step 2: auth ───────────────────────────────────── */}
              {tab === "signup" && signUpStep === "auth" && selectedRole && (
                <div>
                  <button
                    onClick={() => { setSignUpStep("role"); setSelectedRole(null); setError(null); }}
                    style={{
                      background: "none", border: "none", color: C.muted,
                      fontFamily: C.sans, fontSize: "0.8rem", cursor: "pointer",
                      marginBottom: 16, display: "flex", alignItems: "center", gap: 4, padding: 0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    Change role
                  </button>

                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px",
                    background: selectedRole === "homeowner" ? "#E9F5F0" : "#EBF0FF",
                    borderRadius: 10, marginBottom: 22,
                  }}>
                    <span style={{ fontSize: "1.1rem" }}>
                      {selectedRole === "homeowner" ? "🏠" : "🏆"}
                    </span>
                    <span style={{ fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 600, color: C.navy }}>
                      Joining as:{" "}
                      {selectedRole === "homeowner" ? "Homeowner" : "Real Estate Agent"}
                    </span>
                  </div>

                  <AuthButtons
                    onSelect={handleSignUp}
                    loading={loading}
                    keyPrefix={signupKeyPrefix}
                    iiLabel="Create Account with Internet Identity"
                    verb="Sign up with"
                  />
                </div>
              )}

              {error && (
                <p style={{
                  fontFamily: C.sans, fontSize: "0.85rem", color: C.red,
                  textAlign: "center", marginTop: 16,
                }}>
                  {error}
                </p>
              )}
            </div>

            {/* Trust strip */}
            <div style={{
              display: "flex", justifyContent: "center",
              gap: 20, marginTop: 20, flexWrap: "wrap" as const,
            }}>
              {[
                { Icon: IcpShieldNavy, label: "ICP Secured" },
                { Icon: LockIcon,      label: "Encrypted" },
                { Icon: VerifiedIcon,  label: "Verified Marketplace" },
              ].map(({ Icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon />
                  <span style={{ fontFamily: C.sans, fontSize: "0.72rem", color: C.muted }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer style={{
          padding: "16px 28px", display: "flex", justifyContent: "center",
          gap: 20, borderTop: `1px solid ${C.softGray}`, flexWrap: "wrap" as const,
        }}>
          {[
            { l: "Terms",      h: "/terms" },
            { l: "Privacy",    h: "/privacy" },
            { l: "FAQ",        h: "/faq" },
            { l: "For Agents", h: "/for-agents" },
            { l: "Contact",    h: "/faq" },
          ].map(({ l, h }) => (
            <a key={l} href={h} style={{
              fontFamily: C.sans, fontSize: "0.72rem",
              color: C.muted, textDecoration: "none",
            }}>
              {l}
            </a>
          ))}
        </footer>
      </div>
    </div>
  );
}
