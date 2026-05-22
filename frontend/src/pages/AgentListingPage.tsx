import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { getOpenBidRequests, getMyProposals, submitProposal, getProposalsForRequest, type BidRequestSummary } from "../services/listing";
import { getMyAgentProfile } from "../services/agent";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  DC, W_SIDEBAR, DashboardSidebar, DashboardTopBar,
  HousePlaceholder, timeAgo, formatCountdown,
  IcGrid, IcList, IcMsg, IcNotif, IcHistory, IcSaved, IcProfile, IcSettings,
  type SidebarItem,
} from "../components/DashboardSidebar";

const QUICK_CHIPS = [
  { label: "2.75%", bps: 275 },
  { label: "2.50%", bps: 250 },
  { label: "2.25%", bps: 225 },
  { label: "2.00%", bps: 200 },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgentListingPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const { logout, principal } = useAuth();

  const [listing,      setListing]      = useState<BidRequestSummary | null>(null);
  const [myProposal,   setMyProposal]   = useState<any | null>(null);
  const [allProposals, setAllProposals] = useState<any[]>([]);
  const [agentProfile, setAgentProfile] = useState<any | null>(null);

  // Commission form state
  const [commissionInput, setCommissionInput] = useState<string>("");
  const [cmaSummary,      setCmaSummary]      = useState("");
  const [submitting,      setSubmitting]       = useState(false);
  const [customMode,      setCustomMode]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!requestId) return;

    Promise.all([
      getOpenBidRequests(),
      getMyProposals(),
      getMyAgentProfile(),
    ]).then(([listings, myProps, profile]) => {
      const found = (listings as BidRequestSummary[]).find(l => l.id === requestId);
      setListing(found ?? null);

      const mine = (myProps as any[]).find(p => p.requestId === requestId);
      if (mine) {
        setMyProposal(mine);
        setCommissionInput((Number(mine.commissionBps) / 100).toFixed(2));
        setCmaSummary(mine.cmaSummary || "");
      }

      const p = Array.isArray(profile) ? profile[0] : profile;
      setAgentProfile(p ?? null);
    }).catch(console.error);

    // Load all proposals for bid activity (anonymised)
    getProposalsForRequest(requestId)
      .then(setAllProposals)
      .catch(console.error);
  }, [requestId]);

  // Sort proposals by commission ascending to find competitive landscape
  const sortedProps = [...allProposals].sort((a, b) => Number(a.commissionBps) - Number(b.commissionBps));
  const bestOffer   = sortedProps[0];
  const myBps       = myProposal ? Number(myProposal.commissionBps) : null;
  const isTopOffer  = myBps !== null && bestOffer && Number(bestOffer.commissionBps) >= myBps;
  const deadline    = listing ? Number(listing.bidDeadline) / 1_000_000 : 0;
  const biddingOpen = listing?.status && "Open" in listing.status;

  async function handleSubmitOffer() {
    if (!requestId || !listing) return;
    const bpsVal = Math.round(parseFloat(commissionInput) * 100);
    if (isNaN(bpsVal) || bpsVal <= 0 || bpsVal > 1000) {
      toast.error("Please enter a valid commission (0.01% – 10.00%).");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitProposal({
        requestId,
        agentName:             agentProfile?.name     || "Agent",
        agentEmail:            agentProfile?.email    || "",
        agentBrokerage:        agentProfile?.brokerage || "",
        commissionBps:         bpsVal,
        cmaSummary,
        marketingPlan:         agentProfile?.bio || "",
        estimatedDaysOnMarket: Number(agentProfile?.avgDaysOnMarket ?? 30),
        estimatedSalePrice:    listing.desiredSalePrice?.[0] ? Number(listing.desiredSalePrice[0]) : 0,
        includedServices:      [],
        validUntil:            deadline || Date.now() + 30 * 24 * 60 * 60 * 1000,
        coverLetter:           "",
      }) as any;

      if ("err" in result) {
        toast.error(JSON.stringify(result.err));
        return;
      }
      setMyProposal(result.ok);
      toast.success(myProposal ? "Offer updated!" : "Offer submitted!");

      // Refresh all proposals
      getProposalsForRequest(requestId).then(setAllProposals).catch(console.error);
    } finally {
      setSubmitting(false);
    }
  }

  function setChip(bps: number) {
    setCustomMode(false);
    setCommissionInput((bps / 100).toFixed(2));
  }

  const sidebarItems: SidebarItem[] = [
    { label: "Dashboard",      icon: <IcGrid />,     href: "/agents/dashboard" },
    { label: "Listings",       icon: <IcList />,     href: "/agents/browse" },
    { label: "My Bids",        icon: <IcList />,     href: "/agents/dashboard" },
    { label: "Messages",       icon: <IcMsg />,      href: "#" },
    { label: "Notifications",  icon: <IcNotif />,    href: "#" },
    { label: "Bid History",    icon: <IcHistory />,  href: "#" },
    { label: "Saved Listings", icon: <IcSaved />,    href: "#" },
    { label: "Profile",        icon: <IcProfile />,  href: principal ? `/agents/profile/${principal}` : "#" },
    { label: "Settings",       icon: <IcSettings />, href: "#" },
  ];

  if (!listing) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: DC.bg, fontFamily: DC.sans }}>
        <DashboardSidebar items={sidebarItems} activeLabel="Listings" onLogout={logout} />
        <div style={{ marginLeft: W_SIDEBAR, flex: 1 }}>
          <DashboardTopBar />
          <div style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontFamily: DC.sans, color: DC.textSub }}>
              {requestId ? "Loading listing…" : "Listing not found."}
            </p>
            <a href="/agents/browse" style={{ color: DC.primary, fontFamily: DC.sans, fontSize: "0.875rem" }}>← Back to Listings</a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: DC.bg, fontFamily: DC.sans }}>
      <DashboardSidebar items={sidebarItems} activeLabel="Listings" onLogout={logout} />

      <div style={{ marginLeft: W_SIDEBAR, flex: 1, minWidth: 0 }}>
        <DashboardTopBar />

        <div style={{ padding: "28px 32px 64px" }}>
          {/* Back link */}
          <a href="/agents/browse"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: DC.sans, fontSize: "0.875rem", color: DC.textSub, textDecoration: "none", marginBottom: 20 }}>
            ← Back to Listings
          </a>

          {/* Header: address + status + countdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: DC.sans, fontSize: "1.4rem", fontWeight: 700, color: DC.text, margin: 0 }}>
              {listing.city}, {listing.county} · {listing.zipCode}
            </h1>
            {biddingOpen ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: DC.greenBg, color: DC.greenText, border: `1px solid ${DC.greenBdr}`, borderRadius: 9999, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: DC.green }} />
                Bidding Open
              </span>
            ) : (
              <span style={{ background: "#F3F4F6", color: DC.textSub, borderRadius: 9999, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>Closed</span>
            )}
            <span style={{ fontFamily: DC.mono, fontSize: "0.85rem", color: DC.textSub }}>
              Closes in {deadline ? formatCountdown(deadline) : "—"}
            </span>
          </div>

          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

            {/* ── Left / main column ───────────────────────────────────────── */}
            <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Property photo + details */}
              <div style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, overflow: "hidden", boxShadow: DC.shadow }}>
                <HousePlaceholder label={`${listing.city}, ${listing.county} ${listing.zipCode}`} />

                {/* Listing Details */}
                <div style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: DC.sans, fontSize: "0.75rem", fontWeight: 600, color: DC.textSub, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
                    Listing Details
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                    {[
                      ["Property Type",  "Single Family"],
                      ["Bedrooms",        listing.beds?.[0]  != null ? String(Number(listing.beds[0]))  : "—"],
                      ["Bathrooms",       listing.baths?.[0] != null ? String(Number(listing.baths[0])) : "—"],
                      ["Square Feet",     listing.sqft?.[0]  != null ? Number(listing.sqft[0]).toLocaleString() : "—"],
                      ["Desired Price",   listing.desiredSalePrice?.[0] != null ? `$${Number(listing.desiredSalePrice[0]).toLocaleString()}` : "—"],
                      ["Total Bids",      String(Number(listing.proposalCount || 0))],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <span style={{ fontFamily: DC.sans, fontSize: "0.75rem", color: DC.textSub }}>{label}</span>
                        <span style={{ fontFamily: DC.sans, fontSize: "0.85rem", color: DC.text, fontWeight: 500, marginLeft: 8 }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats row: Starting Commission / Current Best / Last Submitted */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[
                  { label: "Starting Commission", sub: "(Seller's Target)", value: "3.00%", valueColor: DC.primary },
                  { label: "Current Best Offer",  sub: isTopOffer ? "You're the top offer!" : bestOffer ? `${(Number(bestOffer.commissionBps) / 100).toFixed(2)}%` : "No bids yet", value: bestOffer ? `${(Number(bestOffer.commissionBps) / 100).toFixed(2)}%` : "—", valueColor: isTopOffer ? DC.green : DC.text },
                  { label: "Your Last Submitted", sub: myProposal ? timeAgo(myProposal.createdAt) : "", value: myProposal ? `${(Number(myProposal.commissionBps) / 100).toFixed(2)}%` : "—", valueColor: DC.text },
                ].map(({ label, sub, value, valueColor }) => (
                  <div key={label} style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, padding: "18px 20px", boxShadow: DC.shadow, textAlign: "center" }}>
                    <p style={{ fontFamily: DC.sans, fontSize: "0.78rem", color: DC.textSub, margin: "0 0 2px" }}>{label}</p>
                    <p style={{ fontFamily: DC.sans, fontSize: "0.72rem", color: valueColor === DC.green && isTopOffer ? DC.green : DC.textSub, margin: "0 0 8px" }}>{sub}</p>
                    <p style={{ fontFamily: DC.mono, fontSize: "1.5rem", fontWeight: 700, color: valueColor, margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Commission Offer Form */}
              <div style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, padding: 24, boxShadow: DC.shadow }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <h2 style={{ fontFamily: DC.sans, fontSize: "1rem", fontWeight: 600, color: DC.text, margin: 0 }}>Your Commission Offer</h2>
                  <a href="/faq" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: DC.sans, fontSize: "0.8rem", color: DC.primary, textDecoration: "none" }}>
                    How It Works
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </a>
                </div>
                <p style={{ fontFamily: DC.sans, fontSize: "0.82rem", color: DC.textSub, margin: "0 0 20px" }}>
                  Agents compete by offering the lowest listing commission.
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: DC.sans, fontSize: "0.8rem", fontWeight: 500, color: DC.text, display: "block", marginBottom: 6 }}>
                    Your Commission Offer (%)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${DC.border}`, borderRadius: 6, overflow: "hidden", maxWidth: 200 }}>
                    <input
                      ref={inputRef}
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="10"
                      value={commissionInput}
                      onChange={e => { setCommissionInput(e.target.value); setCustomMode(true); }}
                      style={{ flex: 1, border: "none", padding: "10px 12px", fontFamily: DC.mono, fontSize: "1rem", fontWeight: 600, color: DC.text, outline: "none", background: DC.white }}
                    />
                    <span style={{ padding: "10px 14px 10px 0", fontFamily: DC.mono, fontSize: "1rem", fontWeight: 600, color: DC.textSub }}>%</span>
                  </div>
                </div>

                {/* Quick-select chips */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                  {QUICK_CHIPS.map(({ label, bps }) => {
                    const selected = !customMode && commissionInput === (bps / 100).toFixed(2);
                    return (
                      <button key={bps} onClick={() => setChip(bps)}
                        style={{ padding: "6px 14px", borderRadius: 6, fontFamily: DC.sans, fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", border: `1.5px solid ${selected ? DC.primary : DC.border}`, background: selected ? "#EFF6FF" : DC.white, color: selected ? DC.primary : DC.text }}>
                        {label}
                      </button>
                    );
                  })}
                  <button onClick={() => { setCustomMode(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                    style={{ padding: "6px 14px", borderRadius: 6, fontFamily: DC.sans, fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", border: `1.5px solid ${customMode ? DC.primary : DC.border}`, background: customMode ? "#EFF6FF" : DC.white, color: customMode ? DC.primary : DC.text }}>
                    Custom
                  </button>
                </div>

                {/* Top-offer indicator */}
                {isTopOffer && (
                  <div style={{ background: DC.greenBg, border: `1px solid ${DC.greenBdr}`, borderRadius: 6, padding: "12px 16px", marginBottom: 16 }}>
                    <p style={{ fontFamily: DC.sans, fontSize: "0.875rem", fontWeight: 600, color: DC.greenText, margin: "0 0 2px" }}>You're the top offer!</p>
                    <p style={{ fontFamily: DC.sans, fontSize: "0.78rem", color: DC.greenText, margin: 0 }}>Lowest commission typically wins.</p>
                  </div>
                )}

                <button
                  onClick={handleSubmitOffer}
                  disabled={submitting || !biddingOpen}
                  style={{ width: "100%", background: biddingOpen ? "#15803D" : DC.border, border: "none", color: biddingOpen ? "#fff" : DC.textSub, borderRadius: 6, padding: "13px 0", fontFamily: DC.sans, fontSize: "0.9rem", fontWeight: 600, cursor: biddingOpen ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {submitting ? "Submitting…" : (
                    <>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                      {myProposal ? "Update Commission Offer" : "Submit Commission Offer"}
                    </>
                  )}
                </button>
                <p style={{ fontFamily: DC.sans, fontSize: "0.7rem", color: DC.textSub, margin: "8px 0 0", textAlign: "center" }}>
                  By submitting, you agree to the{" "}
                  <a href="/faq" style={{ color: DC.primary }}>Terms of Service</a>{" "}
                  and{" "}
                  <a href="/faq" style={{ color: DC.primary }}>BidToList Rules</a>.
                </p>
              </div>

              {/* Bid Activity + Competitive Summary */}
              <div style={{ display: "flex", gap: 16 }}>
                {/* Bid Activity */}
                <div style={{ flex: 1, background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, overflow: "hidden", boxShadow: DC.shadow }}>
                  <div style={{ padding: "14px 20px", borderBottom: `1px solid ${DC.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontFamily: DC.sans, fontSize: "0.9rem", fontWeight: 600, color: DC.text, margin: 0 }}>Bid Activity</h2>
                  </div>
                  <div>
                    {sortedProps.length === 0 && (
                      <p style={{ fontFamily: DC.sans, fontSize: "0.85rem", color: DC.textSub, padding: "16px 20px" }}>No bids yet.</p>
                    )}
                    {sortedProps.slice(0, 5).map((p: any, i: number) => {
                      const isMe = myProposal && p.id === myProposal.id;
                      return (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", borderBottom: i < Math.min(sortedProps.length, 5) - 1 ? `1px solid ${DC.border}` : "none" }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: isMe ? DC.green : "#9CA3AF", flexShrink: 0 }} />
                          <p style={{ flex: 1, fontFamily: DC.sans, fontSize: "0.82rem", color: DC.text, margin: 0 }}>
                            {isMe ? "You submitted an offer" : "An agent submitted an offer"}
                          </p>
                          <p style={{ fontFamily: DC.mono, fontSize: "0.82rem", fontWeight: 600, color: isMe ? DC.green : DC.text, margin: 0 }}>
                            {(Number(p.commissionBps) / 100).toFixed(2)}%
                          </p>
                          <p style={{ fontFamily: DC.sans, fontSize: "0.7rem", color: DC.textSub, margin: 0, flexShrink: 0 }}>
                            {timeAgo(p.createdAt)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {sortedProps.length > 5 && (
                    <div style={{ padding: "10px 20px", borderTop: `1px solid ${DC.border}` }}>
                      <a href="#" style={{ fontFamily: DC.sans, fontSize: "0.78rem", color: DC.primary, textDecoration: "none" }}>View All Activity</a>
                    </div>
                  )}
                </div>

                {/* Competitive summary */}
                <div style={{ flex: 1, background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, overflow: "hidden", boxShadow: DC.shadow }}>
                  <div style={{ padding: "14px 20px", borderBottom: `1px solid ${DC.border}` }}>
                    <h2 style={{ fontFamily: DC.sans, fontSize: "0.9rem", fontWeight: 600, color: DC.text, margin: 0 }}>Competitive Landscape</h2>
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontFamily: DC.sans, fontSize: "0.75rem", color: DC.textSub, margin: "0 0 4px" }}>Total Bids Submitted</p>
                      <p style={{ fontFamily: DC.mono, fontSize: "1.5rem", fontWeight: 700, color: DC.text, margin: 0 }}>
                        {sortedProps.length}
                      </p>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontFamily: DC.sans, fontSize: "0.75rem", color: DC.textSub, margin: "0 0 4px" }}>Lowest Offer</p>
                      <p style={{ fontFamily: DC.mono, fontSize: "1.5rem", fontWeight: 700, color: DC.green, margin: 0 }}>
                        {bestOffer ? `${(Number(bestOffer.commissionBps) / 100).toFixed(2)}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontFamily: DC.sans, fontSize: "0.75rem", color: DC.textSub, margin: "0 0 4px" }}>Bid Deadline</p>
                      <p style={{ fontFamily: DC.sans, fontSize: "0.82rem", fontWeight: 600, color: DC.text, margin: 0 }}>
                        {deadline ? new Date(deadline).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right panel ──────────────────────────────────────────────── */}
            <div style={{ flex: "0 0 300px", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Submit CMA Proposal */}
              <div style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, overflow: "hidden", boxShadow: DC.shadow }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${DC.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ fontFamily: DC.sans, fontSize: "0.9rem", fontWeight: 600, color: DC.text, margin: 0 }}>Submit Your CMA Proposal</h2>
                  <button
                    onClick={() => toast("CMA file upload coming soon. Use the summary below for now.")}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${DC.border}`, background: "none", borderRadius: 6, padding: "6px 12px", fontFamily: DC.sans, fontSize: "0.75rem", fontWeight: 500, color: DC.text, cursor: "pointer" }}>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload CMA
                  </button>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <label style={{ fontFamily: DC.sans, fontSize: "0.82rem", fontWeight: 500, color: DC.text }}>
                        Your CMA Summary <span style={{ color: DC.textSub, fontWeight: 400 }}>(Optional)</span>
                      </label>
                      {cmaSummary && (
                        <button onClick={() => setCmaSummary("")}
                          style={{ fontFamily: DC.sans, fontSize: "0.72rem", color: DC.primary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                          Clear
                        </button>
                      )}
                    </div>
                    <textarea
                      value={cmaSummary}
                      onChange={e => setCmaSummary(e.target.value.slice(0, 500))}
                      rows={6}
                      placeholder="Summarize your CMA analysis, marketing strategy, and pricing approach…"
                      style={{ width: "100%", border: `1px solid ${DC.border}`, borderRadius: 6, padding: "10px 12px", fontFamily: DC.sans, fontSize: "0.82rem", resize: "vertical", boxSizing: "border-box", color: DC.text, lineHeight: 1.5 }}
                    />
                    <p style={{ fontFamily: DC.sans, fontSize: "0.7rem", color: DC.textSub, textAlign: "right", margin: "4px 0 0" }}>
                      {cmaSummary.length}/500
                    </p>
                  </div>
                  <button
                    onClick={handleSubmitOffer}
                    disabled={submitting || !biddingOpen}
                    style={{ width: "100%", background: biddingOpen ? DC.primary : DC.border, border: "none", color: biddingOpen ? "#fff" : DC.textSub, borderRadius: 6, padding: "11px 0", fontFamily: DC.sans, fontSize: "0.82rem", fontWeight: 600, cursor: biddingOpen ? "pointer" : "default" }}>
                    {submitting ? "Saving…" : "Save CMA Summary"}
                  </button>
                </div>
              </div>

              {/* Listing notes */}
              {listing.notes && (
                <div style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, padding: 20, boxShadow: DC.shadow }}>
                  <h2 style={{ fontFamily: DC.sans, fontSize: "0.9rem", fontWeight: 600, color: DC.text, margin: "0 0 10px" }}>Seller Notes</h2>
                  <p style={{ fontFamily: DC.sans, fontSize: "0.82rem", color: DC.textSub, margin: 0, lineHeight: 1.6 }}>{listing.notes}</p>
                </div>
              )}

              {/* Privacy reminder */}
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: 16 }}>
                <p style={{ fontFamily: DC.sans, fontSize: "0.8rem", fontWeight: 600, color: "#92400E", margin: "0 0 4px" }}>Address Revealed Upon Win</p>
                <p style={{ fontFamily: DC.sans, fontSize: "0.75rem", color: "#B45309", margin: 0, lineHeight: 1.5 }}>
                  The seller's full address is only shared with the winning agent after they are selected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
