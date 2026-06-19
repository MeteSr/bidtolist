import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOpenBidRequests, getMyProposals, type BidRequestSummary } from "../services/listing";
import { getMyAgentProfile } from "../services/agent";
import { useBreakpoint } from "../hooks/useBreakpoint";

const C = {
  bg:       "#F8FAFC",
  white:    "#FFFFFF",
  ink:      "#0F172A",
  sub:      "#64748B",
  muted:    "#94A3B8",
  border:   "#E2E8F0",
  orange:   "#EA580C",
  orangeBg: "#FFF7ED",
  orangeBdr:"#FED7AA",
  green:    "#059669",
  greenBg:  "#ECFDF5",
  greenBdr: "#A7F3D0",
  red:      "#DC2626",
  shadow:   "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
  sans:     "'Inter','IBM Plex Sans',system-ui,sans-serif",
  mono:     "'IBM Plex Mono',monospace",
};

function opportunityNum(id: string): string {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  return String(((h >>> 0) % 9000) + 1000);
}

function priceRange(cents?: bigint | null): string {
  if (!cents) return "Price on request";
  const d = Number(cents) / 100;
  if (d < 500_000)   return "Under $500K";
  if (d < 750_000)   return "$500K – $750K";
  if (d < 1_000_000) return "$750K – $1M";
  if (d < 1_500_000) return "$1M – $1.5M";
  if (d < 2_000_000) return "$1.5M – $2M";
  if (d < 2_500_000) return "$2M – $2.5M";
  return "$2.5M+";
}

function deadlineFormatted(ns: bigint): { date: string; time: string } {
  const d = new Date(Number(ns) / 1_000_000);
  return {
    date: d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" }),
  };
}

// Photo gallery placeholder — 5 gradient slides
const GRADIENTS = [
  "linear-gradient(135deg,#334155,#475569)",
  "linear-gradient(135deg,#1e3a5f,#2d6a9f)",
  "linear-gradient(135deg,#3d2c5e,#6d4c9e)",
  "linear-gradient(135deg,#1a3c2e,#2d7a55)",
  "linear-gradient(135deg,#3c2a1a,#7a5530)",
];

function PhotoSlide({ index }: { index: number }) {
  return (
    <div style={{ width: "100%", height: "100%", background: GRADIENTS[index % GRADIENTS.length], position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* House silhouette */}
      <svg viewBox="0 0 200 140" width="60%" height="60%" style={{ opacity: 0.25 }}>
        <path d="M30 100 L30 58 L100 18 L170 58 L170 100 Z" fill="white" />
        <rect x="70" y="62" width="60" height="38" fill="white" />
        <rect x="82" y="62" width="17" height="17" fill="rgba(0,0,0,0.4)" />
        <rect x="101" y="62" width="17" height="17" fill="rgba(0,0,0,0.4)" />
        <rect x="87" y="79" width="26" height="21" fill="rgba(0,0,0,0.5)" />
      </svg>
      {/* Watermark overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "repeating-linear-gradient(45deg,transparent,transparent 80px,rgba(255,255,255,0.03) 80px,rgba(255,255,255,0.03) 160px)",
      }} />
      <div style={{
        position: "absolute", bottom: 12, left: 12,
        background: "rgba(0,0,0,0.55)", color: "#fff",
        fontSize: "0.68rem", fontWeight: 500, padding: "3px 8px", borderRadius: 4,
        fontFamily: C.sans, letterSpacing: "0.04em",
      }}>
        BidToList — Confidential Preview
      </div>
    </div>
  );
}

function Check({ color = C.green }: { color?: string }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" stroke={color} />
    </svg>
  );
}

function Lock() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

// Default seller goals shown when none are in the data model yet
const DEFAULT_GOALS = [
  "Highest Sale Price",
  "Experienced Local Agent",
  "Smooth Transaction",
  "Professional Marketing",
];

// Default features shown when none are structured in the data model yet
const DEFAULT_FEATURES = [
  "Single Family Home",
  "Active Listing",
  "Verified Property",
];

const LOCKED_ITEMS = [
  "Full Street Address",
  "Homeowner Name",
  "Phone Number",
  "Email Address",
  "Full-Resolution Photos",
  "Seller Contact Notes",
  "Messaging Access",
  "Property Documents",
];

export default function AgentListingPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [listing,    setListing]    = useState<BidRequestSummary | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [myProposal, setMyProposal] = useState<any | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [photoIdx,   setPhotoIdx]   = useState(0);
  const PHOTO_COUNT = 5;

  useEffect(() => {
    if (!requestId) return;
    Promise.all([
      getOpenBidRequests(),
      getMyProposals(),
      getMyAgentProfile(),
    ]).then(([listings, myProps, profile]) => {
      const found = (listings as BidRequestSummary[]).find(l => l.id === requestId);
      setListing(found ?? null);
      setMyProposal((myProps as any[]).find(p => p.requestId === requestId) ?? null);
      const p = Array.isArray(profile) ? profile[0] : profile;
      setIsVerified(p?.isVerified === true);
    }).catch(console.error).finally(() => setLoading(false));
  }, [requestId]);

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: C.sans, color: C.sub, fontSize: "0.9rem" }}>Loading opportunity…</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
        <p style={{ fontFamily: C.sans, fontSize: "1.1rem", fontWeight: 600, color: C.ink, margin: 0 }}>Opportunity not found</p>
        <a href="/agents/browse" style={{ fontFamily: C.sans, fontSize: "0.875rem", color: "#2563EB" }}>← Back to Opportunities</a>
      </div>
    );
  }

  const oppNum      = opportunityNum(listing.id);
  const isNewLst    = Date.now() - Number(listing.createdAt) / 1_000_000 < 72 * 3_600_000;
  const biddingOpen = listing.status && "Open" in listing.status;
  const beds        = listing.beds?.[0]  != null ? Number(listing.beds[0])  : null;
  const baths       = listing.baths?.[0] != null ? Number(listing.baths[0]) : null;
  const sqft        = listing.sqft?.[0]  != null ? Number(listing.sqft[0])  : null;
  const range       = priceRange(listing.desiredSalePrice?.[0]);
  const dl          = deadlineFormatted(listing.bidDeadline);
  const propCount   = Number(listing.proposalCount);
  const canSubmit   = biddingOpen && isVerified;

  // Build property snapshot items from real data
  const snapItems = [
    { icon: "🏠", label: "Single Family Home" },
    beds  != null && { icon: "🛏", label: `${beds} Bedroom${beds !== 1 ? "s" : ""}` },
    baths != null && { icon: "🛁", label: `${baths} Bathroom${baths !== 1 ? "s" : ""}` },
    sqft  != null && { icon: "📐", label: `${sqft.toLocaleString()} Sq Ft` },
    { icon: "💲", label: range, highlight: true },
  ].filter(Boolean) as { icon: string; label: string; highlight?: boolean }[];

  // Notes from homeowner as seller questionnaire answer
  const hasNotes = listing.notes && listing.notes.trim().length > 0;

  // Additional features parsed from notes (comma-separated items short enough to be tags)
  const noteFeatures = hasNotes
    ? listing.notes.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 2 && s.length <= 36)
    : [];

  const features = [...DEFAULT_FEATURES, ...noteFeatures.slice(0, 4)];

  const SubmitButton = ({ label }: { label: string }) => (
    <button
      onClick={() => navigate(`/agents/propose/${listing.id}`)}
      disabled={!canSubmit}
      style={{
        width: "100%",
        background: canSubmit ? C.ink : C.muted,
        border: "none", color: "#fff",
        borderRadius: 10, padding: "14px 24px",
        fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 600,
        cursor: canSubmit ? "pointer" : "not-allowed",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
      {label}
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    </button>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: C.sans }}>
      {/* Nav */}
      <nav style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}>
        <a href="/agents/browse" style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: C.sans, fontSize: "0.875rem", color: C.sub, textDecoration: "none" }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Opportunities
        </a>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {(["Save", "Share"] as const).map(label => (
            <button key={label} style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "7px 14px",
              cursor: "pointer", fontFamily: C.sans, fontSize: "0.8rem", color: C.sub,
            }}>
              {label === "Save" ? (
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              ) : (
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              )}
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: isMobile ? "20px 16px 56px" : "28px 24px 72px" }}>

        {/* Opportunity header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "clamp(1.25rem,2.5vw,1.625rem)", fontWeight: 700, color: C.ink, margin: 0 }}>
              Opportunity #{oppNum}
            </h1>
            {isNewLst && (
              <span style={{
                background: C.orange, color: "#fff",
                borderRadius: 4, padding: "3px 10px",
                fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em",
              }}>NEW</span>
            )}
            {!biddingOpen && (
              <span style={{
                background: "#F1F5F9", color: C.sub,
                borderRadius: 4, padding: "3px 10px",
                fontSize: "0.7rem", fontWeight: 600,
              }}>CLOSED</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontFamily: C.sans, fontSize: "1rem", color: C.sub }}>
              {listing.city}, {listing.county}, FL
            </span>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexDirection: isMobile ? "column" : "row" }}>

          {/* ── Main content ──────────────────────────────────────────── */}
          <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Photo gallery */}
            <div style={{ borderRadius: 12, overflow: "hidden", background: "#1E293B", boxShadow: C.shadow }}>
              <div style={{ height: isMobile ? 220 : 360, position: "relative", overflow: "hidden" }}>
                <PhotoSlide index={photoIdx} />
              </div>
              {/* Gallery controls */}
              <div style={{
                background: C.white, padding: "12px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderTop: `1px solid ${C.border}`,
              }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {Array.from({ length: PHOTO_COUNT }, (_, i) => (
                    <button key={i} onClick={() => setPhotoIdx(i)}
                      style={{
                        width: i === photoIdx ? 24 : 8, height: 8, borderRadius: 4,
                        background: i === photoIdx ? C.ink : C.border,
                        border: "none", cursor: "pointer", padding: 0,
                        transition: "width 0.18s ease",
                      }} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {([[-1, "‹"], [1, "›"]] as const).map(([dir, icon]) => (
                    <button key={dir} onClick={() => setPhotoIdx(i => (i + dir + PHOTO_COUNT) % PHOTO_COUNT)}
                      style={{
                        width: 30, height: 30, borderRadius: 6,
                        background: C.white, border: `1px solid ${C.border}`,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: C.sans, fontSize: "1rem", color: C.ink, lineHeight: 1,
                      }}>{icon}</button>
                  ))}
                  <span style={{ fontFamily: C.mono, fontSize: "0.72rem", color: C.sub, minWidth: 34, textAlign: "center" }}>
                    {photoIdx + 1} / {PHOTO_COUNT}
                  </span>
                </div>
              </div>
            </div>

            {/* Property Features + Seller Goals */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>

              {/* Property Features */}
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: C.shadow }}>
                <h2 style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 700, color: C.ink, margin: "0 0 14px" }}>
                  Property Features
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Check />
                      <span style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.ink }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seller Goals */}
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: C.shadow }}>
                <h2 style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 700, color: C.ink, margin: "0 0 14px" }}>
                  Seller Goals
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {DEFAULT_GOALS.map(g => (
                    <div key={g} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Check color={C.orange} />
                      <span style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.ink }}>{g}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Seller Questionnaire */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: C.shadow }}>
              <h2 style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 700, color: C.ink, margin: "0 0 16px" }}>
                Seller Questionnaire
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  { q: "Why are you selling?",                     a: hasNotes ? listing.notes : "Information provided upon proposal acceptance." },
                  { q: "What timeline are you hoping for?",        a: `Target list date: ${new Date(Number(listing.targetListDate) / 1_000_000).toLocaleDateString("en-US", { month: "long", year: "numeric" })}` },
                  { q: "What matters most in an agent for you?",   a: "Professional marketing, responsiveness, and local market expertise." },
                ].map(({ q, a }) => (
                  <div key={q}>
                    <p style={{ fontFamily: C.sans, fontSize: "0.75rem", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 5px" }}>
                      {q}
                    </p>
                    <p style={{ fontFamily: C.sans, fontSize: "0.9rem", color: C.ink, margin: 0, lineHeight: 1.65 }}>{a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Homeowner badge */}
            <div style={{
              background: C.greenBg, border: `1px solid ${C.greenBdr}`,
              borderRadius: 12, padding: "16px 20px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10" stroke={C.green} strokeWidth={2.5}/>
              </svg>
              <div>
                <span style={{ fontFamily: C.sans, fontSize: "0.9rem", fontWeight: 700, color: "#065F46" }}>Verified Homeowner</span>
                <span style={{ fontFamily: C.sans, fontSize: "0.8rem", color: "#047857", marginLeft: 10 }}>
                  Identity and ownership have been verified by BidToList.
                </span>
              </div>
            </div>

            {/* Submit button (mobile only) */}
            {isMobile && (
              <div>
                {myProposal && (
                  <div style={{ background: C.greenBg, border: `1px solid ${C.greenBdr}`, borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                    <p style={{ fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 600, color: "#065F46", margin: "0 0 2px" }}>
                      ✓ Proposal already submitted
                    </p>
                    <p style={{ fontFamily: C.sans, fontSize: "0.75rem", color: "#047857", margin: 0 }}>
                      Commission: {(Number(myProposal.commissionBps) / 100).toFixed(2)}%
                    </p>
                  </div>
                )}
                <SubmitButton label={myProposal ? "Update Your Proposal →" : "Submit Your Proposal"} />
                {!isVerified && (
                  <p style={{ fontFamily: C.sans, fontSize: "0.75rem", color: C.red, textAlign: "center", margin: "8px 0 0" }}>
                    Account verification required to submit proposals
                  </p>
                )}
              </div>
            )}

            {/* Privacy protection notice */}
            <div style={{ background: C.orangeBg, border: `1px solid ${C.orangeBdr}`, borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <div>
                  <p style={{ fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 700, color: "#9A3412", margin: "0 0 3px" }}>
                    Homeowner Privacy Protected
                  </p>
                  <p style={{ fontFamily: C.sans, fontSize: "0.78rem", color: "#B45309", margin: 0, lineHeight: 1.55 }}>
                    Full address, homeowner name, phone, and email are only unlocked after you are selected as the winning agent and your $395 success fee is paid.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sidebar ────────────────────────────────────────────────── */}
          <div style={{ flex: "0 0 290px", width: isMobile ? "100%" : 290, display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Property Snapshot */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: C.shadow }}>
              <h2 style={{ fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 700, color: C.ink, margin: "0 0 16px" }}>
                Property Snapshot
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {snapItems.map(({ icon, label, highlight }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "1rem", width: 22, textAlign: "center", flexShrink: 0 }}>{icon}</span>
                    <span style={{
                      fontFamily: C.sans, fontSize: "0.875rem",
                      color: highlight ? C.orange : C.ink,
                      fontWeight: highlight ? 700 : 400,
                    }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Deadline */}
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span style={{ fontFamily: C.sans, fontSize: "0.72rem", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.06em" }}>Proposal Deadline</span>
                </div>
                <p style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.ink, fontWeight: 600, margin: "0 0 2px" }}>{dl.date}</p>
                <p style={{ fontFamily: C.sans, fontSize: "0.8rem", color: C.sub, margin: 0 }}>{dl.time}</p>
              </div>

              {/* Proposal count */}
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12 }}>
                <p style={{ fontFamily: C.sans, fontSize: "0.72rem", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 5px" }}>
                  Proposals Received
                </p>
                <p style={{ fontFamily: C.mono, fontSize: "1.125rem", fontWeight: 700, color: propCount >= 8 ? C.red : C.ink, margin: 0 }}>
                  {propCount} <span style={{ fontFamily: C.sans, fontSize: "0.8rem", fontWeight: 400, color: C.sub }}>of 10</span>
                </p>
                {propCount >= 8 && (
                  <p style={{ fontFamily: C.sans, fontSize: "0.72rem", color: C.red, margin: "3px 0 0" }}>Filling fast — limited spots remain</p>
                )}
              </div>
            </div>

            {/* Submit CTA (desktop only) */}
            {!isMobile && (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", boxShadow: C.shadow }}>
                {myProposal && (
                  <div style={{ background: C.greenBg, border: `1px solid ${C.greenBdr}`, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                    <p style={{ fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 600, color: "#065F46", margin: "0 0 2px" }}>
                      ✓ Proposal Submitted
                    </p>
                    <p style={{ fontFamily: C.sans, fontSize: "0.75rem", color: "#047857", margin: 0 }}>
                      Commission: {(Number(myProposal.commissionBps) / 100).toFixed(2)}%
                    </p>
                  </div>
                )}
                <SubmitButton label={myProposal ? "Update Your Proposal" : "Submit Your Proposal"} />
                <p style={{ fontFamily: C.sans, fontSize: "0.73rem", color: C.sub, textAlign: "center", margin: "10px 0 0", lineHeight: 1.55 }}>
                  Stand out with a personalized proposal. Homeowners compare all proposals side by side.
                </p>
                {!isVerified && (
                  <p style={{ fontFamily: C.sans, fontSize: "0.73rem", color: C.red, textAlign: "center", margin: "8px 0 0" }}>
                    Account verification required to submit proposals
                  </p>
                )}
                {!biddingOpen && (
                  <p style={{ fontFamily: C.sans, fontSize: "0.73rem", color: C.sub, textAlign: "center", margin: "8px 0 0" }}>
                    Bidding is closed for this listing
                  </p>
                )}
              </div>
            )}

            {/* Locked info panel */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 22px", boxShadow: C.shadow }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <Lock />
                <h3 style={{ fontFamily: C.sans, fontSize: "0.78rem", fontWeight: 700, color: C.ink, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Unlocked After Winning
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {LOCKED_ITEMS.map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Lock />
                    <span style={{ fontFamily: C.sans, fontSize: "0.8rem", color: C.sub }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <p style={{ fontFamily: C.sans, fontSize: "0.72rem", color: C.muted, margin: 0, lineHeight: 1.55, textAlign: "center" }}>
                  Win the opportunity, pay the $395 success fee, and all homeowner details are yours instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
