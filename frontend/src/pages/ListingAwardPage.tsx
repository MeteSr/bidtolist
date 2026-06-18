import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getBidRequest, getMyProposals } from "../services/listing";
import { getMyFees, FeeRecord } from "../services/fee";
import { useBreakpoint } from "../hooks/useBreakpoint";

// ── Design tokens ──────────────────────────────────────────────────────────────
const NAVY    = "#142B4D";
const ORANGE  = "#C66A2B";
const WARM    = "#FAF9F7";
const GRAY    = "#E7E7E4";
const CHAR    = "#3B3B3B";
const WHITE   = "#FFFFFF";
const GREEN   = "#16A34A";
const GREEN_B = "#F0FDF4";
const GREEN_R = "#BBF7D0";
const RED     = "#DC2626";
const MUTED   = "#6B7280";
const SANS    = "'Inter','IBM Plex Sans',system-ui,sans-serif";
const SERIF   = "'Playfair Display',Georgia,serif";
const MONO    = "'IBM Plex Mono',monospace";
const SHD     = "0 4px 24px rgba(20,43,77,0.10)";
const SHD_SM  = "0 2px 12px rgba(20,43,77,0.08)";

const AGENT_SERVER =
  (import.meta as any).env?.VITE_AGENT_SERVER_URL || "http://localhost:3001";

// ── Static confetti decoration ─────────────────────────────────────────────────
const CONFETTI = [
  { x: 7,  y: 20, color: ORANGE,    size: 12, rot: 45 },
  { x: 14, y: 65, color: NAVY,      size: 8,  rot: 20 },
  { x: 24, y: 12, color: "#F59E0B", size: 10, rot: 60 },
  { x: 38, y: 72, color: ORANGE,    size: 6,  rot: 15 },
  { x: 52, y: 8,  color: NAVY,      size: 14, rot: 30 },
  { x: 64, y: 58, color: "#F59E0B", size: 8,  rot: 45 },
  { x: 76, y: 18, color: ORANGE,    size: 10, rot: 70 },
  { x: 87, y: 68, color: NAVY,      size: 6,  rot: 25 },
  { x: 93, y: 22, color: "#F59E0B", size: 12, rot: 50 },
  { x: 4,  y: 48, color: ORANGE,    size: 7,  rot: 35 },
  { x: 48, y: 85, color: "#F59E0B", size: 9,  rot: 55 },
  { x: 82, y: 78, color: NAVY,      size: 8,  rot: 40 },
  { x: 96, y: 42, color: ORANGE,    size: 11, rot: 20 },
  { x: 31, y: 42, color: NAVY,      size: 7,  rot: 65 },
];

// ── Countdown hook ─────────────────────────────────────────────────────────────
function useCountdown(deadlineMs: number | null) {
  const calc = (dl: number) => {
    const diff = Math.max(0, dl - Date.now());
    return {
      h: Math.floor(diff / 3_600_000),
      m: Math.floor((diff % 3_600_000) / 60_000),
      s: Math.floor((diff % 60_000) / 1_000),
      expired: diff === 0,
    };
  };
  const [t, set] = useState({ h: 23, m: 59, s: 59, expired: false });
  useEffect(() => {
    if (!deadlineMs) return;
    set(calc(deadlineMs));
    const id = setInterval(() => set(calc(deadlineMs)), 1_000);
    return () => clearInterval(id);
  }, [deadlineMs]);
  return t;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function fmtUSD(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtShort(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function calcCommission(bps: number, priceUsd: number) {
  return Math.round((bps / 10_000) * priceUsd);
}

// ── Loading placeholder ────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ background: WARM, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${GRAY}`, borderTopColor: ORANGE, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ fontFamily: SANS, color: MUTED }}>Loading your listing award…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Success screen ─────────────────────────────────────────────────────────────
function SuccessScreen({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ background: WARM, minHeight: "100vh", fontFamily: SANS }}>
      <nav style={{ background: WHITE, borderBottom: `1px solid ${GRAY}`, padding: isMobile ? "14px 20px" : "0 48px", height: isMobile ? "auto" : 64, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 8px rgba(20,43,77,0.06)" }}>
        <a href="/"><img src="/logo_transparent_bg.png" alt="BidToList" style={{ height: 36 }} /></a>
        <a href="mailto:support@bidtolist.com" style={{ fontFamily: SANS, fontSize: "0.875rem", color: CHAR, textDecoration: "none" }}>
          Need Help? <span style={{ color: ORANGE, fontWeight: 600 }}>Contact Support</span>
        </a>
      </nav>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: isMobile ? "40px 20px" : "80px 32px", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: 16 }}>🎉</div>
        <h1 data-testid="success-heading" style={{ fontFamily: SERIF, fontSize: isMobile ? "2rem" : "3rem", fontWeight: 900, color: NAVY, marginBottom: 12 }}>
          Listing Activated!
        </h1>
        <p style={{ fontFamily: SANS, fontSize: "1.1rem", color: CHAR, marginBottom: 8 }}>
          Your payment has been received and your listing opportunity is now active.
        </p>
        <p style={{ fontFamily: SANS, fontSize: "0.95rem", color: MUTED, maxWidth: 480, margin: "0 auto 40px" }}>
          The homeowner's contact information has been sent to your email. You're cleared to begin working together.
        </p>
        <div style={{ background: WHITE, borderRadius: 20, padding: "28px 32px", boxShadow: SHD, marginBottom: 32, textAlign: "left" }}>
          <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: "0.9rem", color: CHAR, marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            What Happens Next
          </h2>
          {[
            { e: "📩", t: "Check your email for homeowner contact details" },
            { e: "📞", t: "Agents begin reviewing — reach out to introduce yourself" },
            { e: "📋", t: "Schedule your listing appointment" },
            { e: "🏡", t: "List and sell!" },
          ].map(({ e, t }) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <span style={{ fontSize: "1.25rem" }}>{e}</span>
              <span style={{ fontFamily: SANS, fontSize: "0.95rem", color: CHAR }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 14, justifyContent: "center" }}>
          <a href="/agents/dashboard" data-testid="view-dashboard-link" style={{ background: NAVY, color: WHITE, fontFamily: SANS, fontWeight: 600, fontSize: "1rem", padding: "14px 28px", borderRadius: 10, textDecoration: "none" }}>
            View My Dashboard
          </a>
          <a href="/agents/browse" style={{ background: WHITE, color: NAVY, fontFamily: SANS, fontWeight: 600, fontSize: "1rem", padding: "14px 28px", borderRadius: 10, textDecoration: "none", border: `2px solid ${NAVY}` }}>
            Browse More Listings
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ListingAwardPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  const [proposal, setProposal] = useState<any>(null);
  const [fee, setFee]           = useState<FeeRecord | null>(null);
  const [listing, setListing]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const feeCents  = fee ? Number(fee.amountCents) : 39_500;
  const isPaid    = fee ? ("Paid" in fee.status || "Waived" in fee.status) : false;
  const showSuccess = isPaid || searchParams.get("paid") === "1";

  const deadlineMs = fee
    ? Number(fee.createdAt / 1_000_000n) + 24 * 60 * 60 * 1_000
    : null;
  const countdown = useCountdown(deadlineMs);

  useEffect(() => {
    if (!proposalId) { navigate("/agents/dashboard"); return; }
    async function load() {
      try {
        const [proposals, fees] = await Promise.all([getMyProposals(), getMyFees()]);
        const p = proposals.find((pr: any) => pr.id === proposalId);
        if (!p) { navigate("/agents/dashboard"); return; }
        setProposal(p);
        setFee(fees.find((f) => f.proposalId === proposalId) ?? null);
        const res = await getBidRequest(p.requestId) as any;
        if (res && "ok" in res) setListing(res.ok);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [proposalId, navigate]);

  async function handlePay() {
    if (!proposal) return;
    setPaying(true);
    setPayError(null);
    try {
      const successUrl = `${window.location.origin}/agents/listing-award/${proposal.id}?paid=1`;
      const res = await fetch(
        `${AGENT_SERVER}/api/bidtolist/stripe/create-checkout-session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feeId: fee?.id, proposalId: proposal.id, successUrl }),
        }
      );
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPayError("Payment system unavailable. Contact billing@bidtolist.com.");
      }
    } catch {
      setPayError("Could not reach payment server. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!proposal) return null;
  if (showSuccess) return <SuccessScreen isMobile={isMobile} />;

  // ── Derived display values ─────────────────────────────────────────────────
  const commBps  = Number(proposal.commissionBps ?? 0);
  const priceUsd = Number(proposal.estimatedSalePrice ?? 0);
  const gross    = calcCommission(commBps, priceUsd);
  const net      = gross - feeCents / 100;

  const city    = listing?.city ?? "";
  const county  = listing?.county ?? "";
  const zip     = listing?.zipCode ?? "";
  const beds    = listing?.beds?.[0]  != null ? `${Number(listing.beds[0])} bed`  : null;
  const baths   = listing?.baths?.[0] != null ? `${Number(listing.baths[0])} bath` : null;
  const sqft    = listing?.sqft?.[0]  != null ? `${Number(listing.sqft[0]).toLocaleString()} sqft` : null;
  const locLine = [city, county ? `${county} County` : "", zip].filter(Boolean).join(", ");

  const awardedAt = fee
    ? new Date(Number(fee.createdAt / 1_000_000n)).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      })
    : "Today";

  return (
    <div style={{ background: WARM, minHeight: "100vh", fontFamily: SANS }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={{
        background: WHITE, borderBottom: `1px solid ${GRAY}`,
        padding: isMobile ? "14px 20px" : "0 48px",
        height: isMobile ? "auto" : 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 8px rgba(20,43,77,0.06)",
      }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <img src="/logo_transparent_bg.png" alt="BidToList" style={{ height: 36 }} />
        </a>
        <a href="mailto:support@bidtolist.com" style={{ fontFamily: SANS, fontSize: "0.875rem", color: CHAR, textDecoration: "none" }}>
          Need Help?{" "}<span style={{ color: ORANGE, fontWeight: 600 }}>Contact Support</span>
        </a>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "24px 16px 100px" : "48px 32px 48px" }}>

        {/* ── Celebration banner ─────────────────────────────────────────── */}
        <div style={{
          position: "relative", overflow: "hidden",
          background: WHITE, borderRadius: 20,
          padding: isMobile ? "36px 24px" : "52px 40px",
          textAlign: "center", marginBottom: 28, boxShadow: SHD,
        }}>
          {CONFETTI.map((c, i) => (
            <div key={i} style={{
              position: "absolute", left: `${c.x}%`, top: `${c.y}%`,
              width: c.size, height: c.size, background: c.color,
              transform: `rotate(${c.rot}deg)`, opacity: 0.65,
              borderRadius: 2, pointerEvents: "none",
            }} />
          ))}
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: ORANGE, color: WHITE,
              fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.12em",
              padding: "6px 16px", borderRadius: 100, marginBottom: 16,
            }}>✓ LISTING AWARDED</span>
            <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? "1.9rem" : "2.75rem", fontWeight: 900, color: NAVY, marginBottom: 12 }}>
              🎉 Congratulations!
            </h1>
            <p style={{ fontFamily: SANS, fontSize: isMobile ? "1rem" : "1.2rem", fontWeight: 600, color: CHAR, marginBottom: 8 }}>
              You've been selected to represent this property.
            </p>
            <p style={{ fontFamily: SANS, fontSize: "0.95rem", color: MUTED, maxWidth: 500, margin: "0 auto" }}>
              The homeowner has selected your proposal. Complete your{" "}
              <strong>{fmtUSD(feeCents)}</strong> success fee within 24 hours to activate the listing.
            </p>
          </div>
        </div>

        {/* ── Property + countdown row ───────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 24, marginBottom: 28 }}>

          {/* Property card */}
          <div style={{ background: WHITE, borderRadius: 20, overflow: "hidden", boxShadow: SHD_SM }}>
            <div style={{
              height: 200,
              background: `linear-gradient(135deg, ${NAVY} 0%, #1E3D6E 100%)`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              <span style={{ fontSize: "2.5rem" }}>🏠</span>
              <p style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
                Address revealed after payment
              </p>
            </div>
            <div style={{ padding: "24px" }}>
              <h2 style={{ fontFamily: SERIF, fontSize: "1.4rem", fontWeight: 700, color: NAVY, marginBottom: 4 }}>
                Listing #{(proposal.requestId ?? "").slice(0, 8).toUpperCase()}
              </h2>
              {locLine && (
                <p style={{ fontFamily: SANS, fontSize: "0.875rem", color: MUTED, marginBottom: 14 }}>{locLine}</p>
              )}
              {(beds || baths || sqft) && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  {[beds, baths, sqft].filter(Boolean).map((t) => (
                    <span key={t} style={{ background: GRAY, fontFamily: MONO, fontSize: "0.65rem", padding: "3px 10px", borderRadius: 100, color: CHAR }}>{t}</span>
                  ))}
                </div>
              )}
              <span style={{ background: GRAY, fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.06em", padding: "4px 10px", borderRadius: 100, color: CHAR }}>
                Single Family Home
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
                {[
                  { icon: "🏷", label: "Est. Sale Price", value: `$${priceUsd.toLocaleString()}`, muted: false },
                  { icon: "📅", label: "Awarded",         value: awardedAt,                       muted: false },
                  { icon: "👤", label: "Homeowner",       value: "Revealed after payment",         muted: true  },
                  { icon: "📍", label: "Address",         value: "Revealed after payment",         muted: true  },
                ].map(({ icon, label, value, muted }) => (
                  <div key={label} style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: 2 }}>{icon}</span>
                    <div>
                      <p style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 2 }}>{label}</p>
                      <p style={{ fontFamily: SANS, fontSize: "0.875rem", fontWeight: muted ? 400 : 500, color: muted ? "#9CA3AF" : CHAR, fontStyle: muted ? "italic" : "normal" }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div style={{ background: NAVY, borderRadius: 20, padding: "36px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: SHD }}>
            <p style={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>
              PAYMENT DUE IN
            </p>
            <div data-testid="countdown" style={{ display: "flex", alignItems: "flex-start", gap: 4, marginBottom: 20 }}>
              {([
                { v: pad(countdown.h), l: "HRS" },
                { v: ":",              l: null  },
                { v: pad(countdown.m), l: "MIN" },
                { v: ":",              l: null  },
                { v: pad(countdown.s), l: "SEC" },
              ] as const).map((item, i) =>
                item.l === null ? (
                  <span key={i} style={{ fontFamily: MONO, fontSize: "2.75rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", lineHeight: 1, marginTop: 2 }}>:</span>
                ) : (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: MONO, fontSize: "2.75rem", fontWeight: 700, color: WHITE, lineHeight: 1, minWidth: "3ch" }}>{item.v}</div>
                    <div style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{item.l}</div>
                  </div>
                )
              )}
            </div>
            {countdown.expired && (
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 8, padding: "8px 14px", marginBottom: 16 }}>
                <p style={{ fontFamily: MONO, fontSize: "0.65rem", color: "#FCA5A5", letterSpacing: "0.08em", textTransform: "uppercase" }}>Award window expired</p>
              </div>
            )}
            <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 18px", textAlign: "center", maxWidth: 220 }}>
              <p style={{ fontFamily: SANS, fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                ⏰ Your listing award will remain reserved for{" "}
                <span style={{ color: ORANGE, fontWeight: 600 }}>24 hours</span>.
              </p>
            </div>
          </div>
        </div>

        {/* ── Three info cards ───────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 24, marginBottom: 28 }}>

          {/* Success fee */}
          <div style={{ background: WHITE, borderRadius: 20, padding: "28px 24px", boxShadow: SHD_SM }}>
            <p style={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 14 }}>Your Success Fee</p>
            <div style={{ fontFamily: SERIF, fontSize: "3rem", fontWeight: 900, color: NAVY, marginBottom: 4 }}>{fmtShort(feeCents)}</div>
            <p style={{ fontFamily: SANS, fontSize: "0.875rem", color: MUTED, marginBottom: 20 }}>One-time payment</p>
            <div style={{ width: 40, height: 3, background: ORANGE, borderRadius: 2, marginBottom: 20 }} />
            {["No subscriptions", "No recurring charges", "No hidden fees"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: GREEN_B, border: `1px solid ${GREEN_R}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.6rem", color: GREEN }}>✓</span>
                </div>
                <span style={{ fontFamily: SANS, fontSize: "0.875rem", color: CHAR }}>{item}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 20, marginTop: 16, borderTop: `1px solid ${GRAY}` }}>
              {[{ e: "🔒", l: "Secure" }, { e: "⚡", l: "Instant" }, { e: "🧾", l: "Receipt" }].map(({ e, l }) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.25rem", marginBottom: 4 }}>{e}</div>
                  <p style={{ fontFamily: MONO, fontSize: "0.6rem", color: "#9CA3AF", letterSpacing: "0.08em" }}>{l.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What happens next */}
          <div style={{ background: WHITE, borderRadius: 20, padding: "28px 24px", boxShadow: SHD_SM }}>
            <p style={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 24 }}>What Happens Next?</p>
            {[
              { e: "💳", t: "Pay Success Fee",              s: "Complete your payment within 24 hours." },
              { e: "🏡", t: "Listing Activated",            s: "Your listing opportunity is activated." },
              { e: "👤", t: "Homeowner Contact Unlocked",   s: "Contact information shared so you can connect." },
              { e: "🤝", t: "Begin Working Together",       s: "Start your successful partnership." },
            ].map(({ e, t, s }, i, arr) => (
              <div key={t} style={{ display: "flex", gap: 14, marginBottom: i < arr.length - 1 ? 16 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, background: WARM, border: `2px solid ${GRAY}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>
                    {e}
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 12, background: `linear-gradient(to bottom, ${ORANGE}, ${GRAY})`, marginTop: 4, borderRadius: 2 }} />
                  )}
                </div>
                <div style={{ paddingTop: 6 }}>
                  <p style={{ fontFamily: SANS, fontSize: "0.875rem", fontWeight: 600, color: CHAR, marginBottom: 2 }}>{t}</p>
                  <p style={{ fontFamily: SANS, fontSize: "0.8rem", color: MUTED, lineHeight: 1.5 }}>{s}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Commission */}
          <div style={{ background: WHITE, borderRadius: 20, padding: "28px 24px", boxShadow: SHD_SM }}>
            <p style={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 14 }}>Estimated Commission</p>
            <div style={{ fontFamily: SERIF, fontSize: "2.5rem", fontWeight: 900, color: NAVY, marginBottom: 20 }}>
              ${gross.toLocaleString("en-US")}
            </div>
            <div style={{ borderTop: `1px solid ${GRAY}`, paddingTop: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: SANS, fontSize: "0.875rem", color: CHAR }}>BidToList Success Fee</span>
                <span style={{ fontFamily: MONO, fontSize: "0.875rem", color: RED, fontWeight: 600 }}>-{fmtUSD(feeCents)}</span>
              </div>
            </div>
            <div style={{ borderTop: `2px solid ${NAVY}`, paddingTop: 14, marginBottom: 12 }}>
              <p style={{ fontFamily: SANS, fontSize: "0.75rem", color: MUTED, marginBottom: 4 }}>You Keep</p>
              <div style={{ fontFamily: SERIF, fontSize: "2rem", fontWeight: 900, color: GREEN }}>
                ${Math.round(net).toLocaleString("en-US")}
              </div>
            </div>
            <p style={{ fontFamily: SANS, fontSize: "0.8rem", color: MUTED, lineHeight: 1.5 }}>A small fee for a big opportunity.</p>
            <p style={{ fontFamily: SANS, fontSize: "0.8rem", color: ORANGE, fontWeight: 600, marginTop: 4 }}>Congratulations on your win!</p>
          </div>
        </div>

        {/* ── Checkout section ───────────────────────────────────────────── */}
        <div style={{ background: WHITE, borderRadius: 20, padding: isMobile ? "28px 20px" : "40px", boxShadow: SHD, marginBottom: 28 }}>
          <h2 style={{ fontFamily: SANS, fontWeight: 700, fontSize: "1.25rem", color: NAVY, marginBottom: 28 }}>Complete Checkout</h2>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 36, marginBottom: 28 }}>

            {/* Payment method selector */}
            <div>
              <p style={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 14 }}>Choose Payment Method</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Credit card – selected */}
                <div style={{ border: `2px solid ${ORANGE}`, borderRadius: 12, padding: "16px 20px", background: "#FFF8F4" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${ORANGE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: ORANGE }} />
                      </div>
                      <span style={{ fontFamily: SANS, fontWeight: 600, color: CHAR }}>Credit Card</span>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {["VISA", "MC", "AMEX", "DISC"].map((b) => (
                        <span key={b} style={{ fontFamily: MONO, fontSize: "0.55rem", background: WHITE, border: `1px solid ${GRAY}`, borderRadius: 4, padding: "2px 5px", color: CHAR }}>{b}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* ACH */}
                <div style={{ border: `1px solid ${GRAY}`, borderRadius: 12, padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${GRAY}`, flexShrink: 0 }} />
                    <span style={{ fontFamily: SANS, fontWeight: 600, color: CHAR }}>ACH Bank Transfer</span>
                    <span style={{ fontFamily: MONO, fontSize: "0.6rem", background: "#EFF6FF", color: "#3B82F6", padding: "2px 8px", borderRadius: 4 }}>Recommended for brokerages</span>
                  </div>
                </div>
                {/* ICP – disabled */}
                <div style={{ border: `1px solid ${GRAY}`, borderRadius: 12, padding: "16px 20px", opacity: 0.45, cursor: "not-allowed" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${GRAY}`, flexShrink: 0 }} />
                    <span style={{ fontFamily: SANS, fontWeight: 600, color: CHAR }}>ICP Payments</span>
                    <span style={{ fontFamily: MONO, fontSize: "0.6rem", background: GRAY, color: "#9CA3AF", padding: "2px 8px", borderRadius: 4 }}>Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing summary */}
            <div>
              <p style={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#9CA3AF", marginBottom: 14 }}>Billing Summary</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { l: "Success Fee",    v: fmtUSD(feeCents) },
                  { l: "Processing Fee", v: "$0.00" },
                  { l: "Tax",            v: "$0.00" },
                ].map(({ l, v }) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: SANS, fontSize: "0.875rem", color: CHAR }}>{l}</span>
                    <span style={{ fontFamily: MONO, fontSize: "0.875rem", color: CHAR }}>{v}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: GRAY, margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: SANS, fontWeight: 700, color: NAVY }}>Total Due</span>
                  <span style={{ fontFamily: SERIF, fontSize: "1.3rem", fontWeight: 700, color: NAVY }}>{fmtUSD(feeCents)}</span>
                </div>
              </div>
            </div>
          </div>

          {payError && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
              <p style={{ fontFamily: SANS, fontSize: "0.875rem", color: RED }}>{payError}</p>
            </div>
          )}

          <button
            data-testid="pay-cta"
            onClick={handlePay}
            disabled={paying || countdown.expired}
            style={{
              width: "100%",
              background: paying || countdown.expired ? "#9CA3AF" : ORANGE,
              border: "none", color: WHITE,
              fontFamily: SANS, fontSize: "1.1rem", fontWeight: 700,
              padding: "18px 24px", borderRadius: 12,
              cursor: paying || countdown.expired ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: paying || countdown.expired ? "none" : `0 4px 20px rgba(198,106,43,0.4)`,
              transition: "opacity 0.15s",
            }}
          >
            {paying ? (
              <>
                <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: WHITE, borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block", flexShrink: 0 }} />
                Processing…
              </>
            ) : (
              `🔒 Pay ${fmtShort(feeCents)} & Activate Listing`
            )}
          </button>

          <p style={{ textAlign: "center", fontFamily: SANS, fontSize: "0.8rem", color: MUTED, marginTop: 12 }}>
            🔒 Secure checkout powered by industry-leading encryption.
          </p>

          {/* No-surprises strip */}
          <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center",
            gap: isMobile ? 12 : 28, marginTop: 20, paddingTop: 20,
            borderTop: `1px solid ${GRAY}`,
          }}>
            {["One-time fee", "No recurring billing", "No subscriptions", "No contracts", "Instant receipt"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: GREEN }}>✓</span>
                <span style={{ fontFamily: SANS, fontSize: "0.8rem", color: CHAR }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trust section ──────────────────────────────────────────────── */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: SERIF, fontSize: "1.25rem", fontWeight: 700, color: NAVY, marginBottom: 20 }}>
            Built on Trust. Backed by Security.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 20 }}>
            {[
              { e: "👥", t: "Verified Agents",      s: "License and identity verified" },
              { e: "🔐", t: "Secure Platform",       s: "Your data is encrypted and protected" },
              { e: "🏆", t: "Trusted by Thousands",  s: "Successful transactions platform-wide" },
            ].map(({ e, t, s }) => (
              <div key={t} style={{ background: WHITE, borderRadius: 16, padding: "24px 20px", boxShadow: SHD_SM }}>
                <div style={{ fontSize: "1.75rem", marginBottom: 10 }}>{e}</div>
                <p style={{ fontFamily: SANS, fontWeight: 600, color: CHAR, marginBottom: 6 }}>{t}</p>
                <p style={{ fontFamily: SANS, fontSize: "0.8rem", color: MUTED }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      {isMobile && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: WHITE, padding: "14px 20px",
          borderTop: `1px solid ${GRAY}`,
          boxShadow: "0 -4px 16px rgba(20,43,77,0.10)", zIndex: 200,
        }}>
          <button
            onClick={handlePay}
            disabled={paying || countdown.expired}
            style={{
              width: "100%",
              background: paying || countdown.expired ? "#9CA3AF" : ORANGE,
              border: "none", color: WHITE,
              fontFamily: SANS, fontSize: "1rem", fontWeight: 700,
              padding: "16px", borderRadius: 12,
              cursor: paying || countdown.expired ? "not-allowed" : "pointer",
            }}
          >
            {paying ? "Processing…" : `Pay ${fmtShort(feeCents)} & Activate`}
          </button>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        background: NAVY, padding: isMobile ? "20px" : "24px 48px",
        display: "flex", flexWrap: "wrap", justifyContent: "space-between",
        alignItems: "center", gap: 14,
      }}>
        <a href="/agents/dashboard" style={{ fontFamily: SANS, fontSize: "0.875rem", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
          ← Back to Dashboard
        </a>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { l: "Support", h: "mailto:support@bidtolist.com" },
            { l: "Terms",   h: "#" },
            { l: "Privacy", h: "#" },
          ].map(({ l, h }) => (
            <a key={l} href={h} style={{ fontFamily: SANS, fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
