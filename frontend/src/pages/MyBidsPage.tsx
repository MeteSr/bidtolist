import { useEffect, useState } from "react";
import { getMyBidRequests, getProposalsForRequest, acceptProposal, cancelBidRequest, markRevealNotified } from "../services/listing";
import { addReview } from "../services/agent";
import { notifyProposalResult, notifyRevealOpened, notifyListingCancelled } from "../services/email";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  DC, W_SIDEBAR, DashboardSidebar, DashboardTopBar,
  HousePlaceholder, timeAgo, formatCountdown,
  IcGrid, IcHome, IcList, IcMsg, IcDoc, IcActivity, IcSettings,
  IcShield, IcClock, IcPhone,
  type SidebarItem,
} from "../components/DashboardSidebar";

// ─── Brand palette ────────────────────────────────────────────────────────────

const P = {
  navy:        "#142B4D",
  orange:      "#C66A2B",
  orangeLight: "#FBF0E9",
  orangeBdr:   "#E8C3A8",
  warmWhite:   "#FAF9F7",
  softGray:    "#E7E7E4",
  charcoal:    "#3B3B3B",
  white:       "#FFFFFF",
  border:      "#D9D6CF",
  sub:         "#6E6A63",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  greenBdr:    "#BBF7D0",
  greenText:   "#166534",
  shadow:      "0 2px 8px rgba(20,43,77,0.07)",
  shadowHov:   "0 8px 24px rgba(20,43,77,0.13)",
  serif:       "'Playfair Display', Georgia, serif",
  sans:        "'Inter', 'IBM Plex Sans', system-ui, sans-serif",
  mono:        "'IBM Plex Mono', monospace",
};

// ─── Local icons ──────────────────────────────────────────────────────────────

function IcLightbulb() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={P.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="3"/><circle cx="12" cy="12" r="7"/><path d="M9 21h6m-3-3v3"/>
    </svg>
  );
}

function IcCheck() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IcArrowRight() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

// ─── StarPicker ───────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 4 }} aria-label="Star rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" data-testid={`star-${n}`} onClick={() => onChange(n)}
          style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.4rem", color: n <= value ? "#F59E0B" : "#D1D5DB", padding: "0 2px", lineHeight: 1 }}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}>★</button>
      ))}
    </div>
  );
}

// ─── ReviewForm ───────────────────────────────────────────────────────────────

function ReviewForm({ proposal, onDone }: { proposal: any; onDone: () => void }) {
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);

  function agentIdText(id: any) {
    return typeof id === "string" ? id : (id?.toText?.() ?? String(id));
  }

  if (done) return (
    <p data-testid="review-done" style={{ fontFamily: P.sans, fontSize: "0.85rem", color: P.green, marginTop: 12 }}>
      Review submitted — thank you.
    </p>
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    setSubmitting(true);
    try {
      const result = await addReview({ agentId: agentIdText(proposal.agentId), rating, comment, transactionId: proposal.id }) as any;
      if ("err" in result) {
        if ("DuplicateReview" in result.err)       toast.error("You've already reviewed this agent.");
        else if ("RateLimitExceeded" in result.err) toast.error("Review limit reached. Try again tomorrow.");
        else toast.error(JSON.stringify(result.err));
        return;
      }
      setDone(true); onDone();
    } finally { setSubmitting(false); }
  }

  return (
    <form data-testid="review-form" onSubmit={handleSubmit}
      style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${P.border}` }}>
      <p style={{ fontFamily: P.sans, fontSize: "0.8rem", fontWeight: 600, color: P.navy, marginBottom: 8 }}>
        Rate {proposal.agentName}
      </p>
      <div style={{ marginBottom: 12 }}><StarPicker value={rating} onChange={setRating} /></div>
      <textarea data-testid="review-comment" value={comment} onChange={e => setComment(e.target.value)} rows={3}
        placeholder="Share your experience (optional)…"
        style={{ border: `1px solid ${P.border}`, padding: "10px 12px", width: "100%", fontFamily: P.sans, fontSize: "0.875rem", resize: "vertical", boxSizing: "border-box", borderRadius: 6 }} />
      <button type="submit" data-testid="review-submit" disabled={submitting}
        style={{ marginTop: 8, background: P.orange, border: "none", color: P.white, fontFamily: P.sans, fontSize: "0.875rem", fontWeight: 600, padding: "10px 20px", cursor: "pointer", borderRadius: 6, minHeight: 40 }}>
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function commissionPct(bps: any) {
  return (Number(bps) / 100).toFixed(2) + "%";
}

function commissionEst(bps: any, salePrice: any) {
  if (!salePrice) return null;
  const est = Math.round((Number(bps) / 10000) * Number(salePrice));
  return `$${est.toLocaleString()} est.`;
}

function marketingLabel(p: any) {
  const cl = p.coverLetter?.trim();
  if (!cl) return "—";
  return cl.length > 48 ? cl.slice(0, 48) + "…" : cl;
}

function trackRecordLabel(p: any) {
  if (p.estimatedDaysOnMarket) return `~${p.estimatedDaysOnMarket} days est. DOM`;
  if (p.estimatedSalePrice)    return `$${Number(p.estimatedSalePrice).toLocaleString()} est. price`;
  return "See proposal";
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MyBidsPage() {
  const { logout } = useAuth();
  const [requests, setRequests]               = useState<any[]>([]);
  const [proposals, setProposals]             = useState<Record<string, any[]>>({});
  const [accepting, setAccepting]             = useState<string | null>(null);
  const [reviewedIds, setReviewedIds]         = useState<Set<string>>(new Set());
  const [viewingProposal, setViewingProposal] = useState<any | null>(null);
  const [hoveredRow, setHoveredRow]           = useState<string | null>(null);

  useEffect(() => {
    getMyBidRequests().then(list => {
      setRequests(list);
      const active = list.find((r: any) => r.status && "Open" in r.status);
      if (active) {
        const deadlineMs = Number(active.bidDeadline) / 1_000_000;
        getProposalsForRequest(active.id)
          .then(props => {
            setProposals(p => ({ ...p, [active.id]: props }));
            if (Date.now() >= deadlineMs) {
              markRevealNotified(active.id).then(wasFirst => {
                if (wasFirst) notifyRevealOpened(active.id);
              }).catch(() => {});
            }
          })
          .catch(console.error);
      }
    }).catch(console.error);
  }, []);

  const activeReq      = requests.find((r: any) => r.status && "Open" in r.status) || requests[0];
  const activeProps    = activeReq ? (proposals[activeReq.id] || []) : [];
  const byCommission   = [...activeProps].sort((a, b) => Number(a.commissionBps) - Number(b.commissionBps));
  const deadline       = activeReq ? Number(activeReq.bidDeadline) / 1_000_000 : 0;
  const biddingOpen    = activeReq?.status && "Open" in activeReq.status;
  const deadlinePassed = Date.now() >= deadline && deadline > 0;
  const acceptedProp   = activeProps.find((p: any) => p.status && "Accepted" in p.status);
  const pendingProps   = activeProps.filter((p: any) => p.status && "Pending" in p.status);
  const showProposals  = deadlinePassed || !!acceptedProp;
  const estValue       = (activeReq as any)?.estimatedSalePrice || (activeReq as any)?.estimatedValue || null;

  // Activity feed derived from available data
  const activityItems: Array<{ icon: string; color: string; bg: string; text: string; time: string }> = [
    ...(acceptedProp ? [{ icon: "✓", color: P.green, bg: P.greenBg, text: "Agent selected — congratulations!", time: "Recently" }] : []),
    ...activeProps.slice(0, 3).map((p: any) => ({
      icon: "✉", color: P.orange, bg: P.orangeLight,
      text: "New proposal received",
      time: timeAgo(p.createdAt),
    })),
    ...(activeReq?.createdAt ? [{ icon: "⌂", color: P.navy, bg: "#EBF0F7", text: "Listing published", time: timeAgo(activeReq.createdAt) }] : []),
  ];

  async function handleAccept(proposalId: string, requestId: string) {
    setAccepting(proposalId);
    try {
      const result = await acceptProposal(proposalId) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
      const req      = requests.find((r: any) => r.id === requestId);
      const allProps = proposals[requestId] || [];
      for (const p of allProps) {
        if (p.agentEmail) notifyProposalResult({ agentEmail: p.agentEmail, agentName: p.agentName, city: req?.city || "", won: p.id === proposalId });
      }
      toast.success("Agent selected! They'll receive your contact details to move forward.");
      setRequests(await getMyBidRequests());
    } finally { setAccepting(null); }
  }

  async function handleCancel(requestId: string) {
    if (!window.confirm("Cancel this listing? All agents who submitted proposals will be notified.")) return;
    const result = await cancelBidRequest(requestId) as any;
    if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
    const req      = requests.find((r: any) => r.id === requestId);
    const allProps = proposals[requestId] || [];
    for (const p of allProps) {
      if (p.agentEmail) notifyListingCancelled({ agentEmail: p.agentEmail, agentName: p.agentName, city: req?.city || "" });
    }
    toast.success("Listing cancelled.");
    setRequests(await getMyBidRequests());
  }

  const sidebarItems: SidebarItem[] = [
    { label: "Dashboard",         icon: <IcGrid />,     href: "/my-bids" },
    { label: "My Property",       icon: <IcHome />,     href: "/my-bids" },
    { label: "Agent Proposals",   icon: <IcList />,     href: "/my-bids", badge: activeProps.length > 0 ? activeProps.length : undefined },
    { label: "Messages",          icon: <IcMsg />,      href: "#" },
    { label: "Compare Agents",    icon: <IcDoc />,      href: "#" },
    { label: "My Favorites",      icon: <IcActivity />, href: "#" },
    { label: "Activity Timeline", icon: <IcClock />,    href: "#" },
    { label: "Resources",         icon: <IcShield />,   href: "/faq" },
    { label: "Account Settings",  icon: <IcSettings />, href: "#" },
  ];

  // ─── Proposal modal ─────────────────────────────────────────────────────────

  function ProposalModal({ p, idx, onClose }: { p: any; idx: number; onClose: () => void }) {
    const revealed = !!acceptedProp && p.status && "Accepted" in p.status;
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(20,43,77,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={onClose}>
        <div style={{ background: P.white, borderRadius: 12, padding: 32, maxWidth: 500, width: "90%", boxShadow: "0 24px 64px rgba(20,43,77,0.22)" }}
          onClick={e => e.stopPropagation()}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <h2 style={{ fontFamily: P.serif, fontSize: "1.1rem", fontWeight: 700, color: P.navy, margin: 0 }}>
              {revealed ? p.agentName : `Proposal #${idx + 1}`}
            </h2>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: P.sub, lineHeight: 1 }}>✕</button>
          </div>

          {revealed && <p style={{ fontFamily: P.sans, fontSize: "0.82rem", color: P.sub, margin: "0 0 18px" }}>{p.agentBrokerage}</p>}

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            <div style={{ background: P.orangeLight, border: `1px solid ${P.orangeBdr}`, borderRadius: 8, padding: "14px 18px" }}>
              <p style={{ fontFamily: P.sans, fontSize: "0.7rem", color: P.orange, margin: "0 0 3px", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: 700 }}>Proposed Commission</p>
              <p style={{ fontFamily: P.mono, fontSize: "1.6rem", fontWeight: 700, color: P.navy, margin: 0 }}>{commissionPct(p.commissionBps)}</p>
              {commissionEst(p.commissionBps, p.estimatedSalePrice) && (
                <p style={{ fontFamily: P.sans, fontSize: "0.75rem", color: P.sub, margin: "3px 0 0" }}>{commissionEst(p.commissionBps, p.estimatedSalePrice)}</p>
              )}
            </div>

            {p.coverLetter && (
              <div>
                <p style={{ fontFamily: P.sans, fontSize: "0.7rem", fontWeight: 700, color: P.sub, margin: "0 0 6px", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>Marketing Plan</p>
                <p style={{ fontFamily: P.sans, fontSize: "0.875rem", color: P.charcoal, margin: 0, lineHeight: 1.65 }}>{p.coverLetter}</p>
              </div>
            )}

            {p.cmaSummary && (
              <div>
                <p style={{ fontFamily: P.sans, fontSize: "0.7rem", fontWeight: 700, color: P.sub, margin: "0 0 6px", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>Market Analysis</p>
                <p style={{ fontFamily: P.sans, fontSize: "0.875rem", color: P.charcoal, margin: 0, lineHeight: 1.65 }}>{p.cmaSummary}</p>
              </div>
            )}

            {(p.estimatedSalePrice || p.estimatedDaysOnMarket) && (
              <div style={{ display: "flex", gap: 12 }}>
                {p.estimatedSalePrice && (
                  <div style={{ flex: 1, background: P.warmWhite, border: `1px solid ${P.border}`, borderRadius: 8, padding: "10px 14px" }}>
                    <p style={{ fontFamily: P.sans, fontSize: "0.7rem", color: P.sub, margin: "0 0 3px" }}>Est. Sale Price</p>
                    <p style={{ fontFamily: P.mono, fontSize: "0.95rem", fontWeight: 700, color: P.navy, margin: 0 }}>${Number(p.estimatedSalePrice).toLocaleString()}</p>
                  </div>
                )}
                {p.estimatedDaysOnMarket && (
                  <div style={{ flex: 1, background: P.warmWhite, border: `1px solid ${P.border}`, borderRadius: 8, padding: "10px 14px" }}>
                    <p style={{ fontFamily: P.sans, fontSize: "0.7rem", color: P.sub, margin: "0 0 3px" }}>Est. Days on Market</p>
                    <p style={{ fontFamily: P.mono, fontSize: "0.95rem", fontWeight: 700, color: P.navy, margin: 0 }}>{p.estimatedDaysOnMarket}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {deadlinePassed && !acceptedProp && p.status && "Pending" in p.status && (
            <button onClick={() => { handleAccept(p.id, activeReq.id); onClose(); }} disabled={accepting === p.id}
              style={{ marginTop: 22, width: "100%", background: P.orange, border: "none", color: P.white, fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 600, padding: "13px 0", cursor: "pointer", borderRadius: 8 }}>
              {accepting === p.id ? "Selecting…" : "Select This Agent"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: P.warmWhite, fontFamily: P.sans }}>
      <DashboardSidebar items={sidebarItems} activeLabel="Dashboard" onLogout={logout} />

      {viewingProposal && (
        <ProposalModal
          p={viewingProposal.p}
          idx={viewingProposal.idx}
          onClose={() => setViewingProposal(null)}
        />
      )}

      <div style={{ marginLeft: W_SIDEBAR, flex: 1, minWidth: 0 }}>
        <DashboardTopBar notifCount={activeProps.length} />

        <div style={{ padding: "32px 32px 72px" }}>

          {/* Welcome */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: P.serif, fontSize: "2rem", fontWeight: 700, color: P.navy, margin: "0 0 6px" }}>
              Welcome back!
            </h1>
            <p style={{ fontFamily: P.sans, fontSize: "0.9rem", color: P.sub, margin: 0 }}>
              {acceptedProp
                ? "You've selected your agent. They'll be in touch shortly."
                : deadlinePassed
                ? "Bidding has closed — review your proposals and choose your agent."
                : `You have ${activeProps.length} proposal${activeProps.length !== 1 ? "s" : ""} so far. Bidding closes ${deadline ? formatCountdown(deadline) : "soon"}.`}
            </p>
          </div>

          {/* Empty state */}
          {requests.length === 0 && (
            <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, padding: 56, textAlign: "center", boxShadow: P.shadow }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: P.orangeLight, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={P.orange} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <p style={{ fontFamily: P.sans, fontWeight: 700, fontSize: "1rem", color: P.navy, marginBottom: 6 }}>No active listings yet</p>
              <p style={{ fontFamily: P.sans, color: P.sub, marginBottom: 24, fontSize: "0.875rem" }}>Post your property and let agents compete for your listing.</p>
              <a href="/post" style={{ display: "inline-block", background: P.orange, color: P.white, padding: "13px 28px", borderRadius: 8, fontFamily: P.sans, fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}>
                Post Your Listing
              </a>
            </div>
          )}

          {requests.length > 0 && (
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

              {/* ── Left column ──────────────────────────────────────── */}
              <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Property card */}
                <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, overflow: "hidden", boxShadow: P.shadow }}>
                  <div style={{ display: "flex" }}>
                    {/* Photo */}
                    <div style={{ flex: "0 0 220px", position: "relative" }}>
                      <HousePlaceholder label={`${activeReq?.city}, ${activeReq?.county}`} />
                      {estValue && (
                        <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(20,43,77,0.88)", color: P.white, borderRadius: 6, padding: "5px 10px", fontFamily: P.mono, fontSize: "0.82rem", fontWeight: 700 }}>
                          ${Number(estValue).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, padding: "22px 26px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <h2 style={{ fontFamily: P.serif, fontSize: "1.15rem", fontWeight: 700, color: P.navy, margin: "0 0 2px" }}>
                            {activeReq?.city}, {activeReq?.county}
                          </h2>
                          <p style={{ fontFamily: P.sans, fontSize: "0.82rem", color: P.sub, margin: 0 }}>FL · Single Family Home</p>
                        </div>
                        {biddingOpen && (
                          <button onClick={() => handleCancel(activeReq.id)}
                            style={{ fontFamily: P.sans, fontSize: "0.72rem", color: "#DC2626", background: "transparent", border: "1px solid #FCA5A5", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                            Cancel listing
                          </button>
                        )}
                      </div>

                      {/* Status badge */}
                      <div style={{ marginBottom: 18 }}>
                        {biddingOpen ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: P.greenBg, color: P.greenText, border: `1px solid ${P.greenBdr}`, borderRadius: 9999, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: P.green, display: "inline-block" }} />
                            Active — Proposals Incoming
                          </span>
                        ) : deadlinePassed && !acceptedProp ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A", borderRadius: 9999, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>
                            Bidding Closed — Ready to Review
                          </span>
                        ) : acceptedProp ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: P.greenBg, color: P.greenText, border: `1px solid ${P.greenBdr}`, borderRadius: 9999, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>
                            <IcCheck /> Agent Selected
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: P.softGray, color: P.sub, borderRadius: 9999, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600 }}>
                            Closed
                          </span>
                        )}
                      </div>

                      {/* Meta row */}
                      <div style={{ display: "flex", gap: 28, marginBottom: 20 }}>
                        {[
                          ["Date Posted", activeReq?.createdAt ? new Date(Number(activeReq.createdAt) / 1_000_000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"],
                          ["Bidding Closes", deadline ? formatCountdown(deadline) : "—"],
                          ["Est. Value", estValue ? `$${Number(estValue).toLocaleString()}` : "—"],
                        ].map(([label, val]) => (
                          <div key={label}>
                            <p style={{ fontFamily: P.sans, fontSize: "0.67rem", color: P.sub, margin: "0 0 2px", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontWeight: 600 }}>{label}</p>
                            <p style={{ fontFamily: P.mono, fontSize: "0.88rem", fontWeight: 700, color: P.navy, margin: 0 }}>{val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 10 }}>
                        <a href="/post"
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: P.orange, color: P.white, fontFamily: P.sans, fontSize: "0.82rem", fontWeight: 600, padding: "9px 18px", borderRadius: 6, textDecoration: "none" }}>
                          View My Property
                        </a>
                        <button onClick={() => toast("Share link copied!")}
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${P.border}`, color: P.charcoal, fontFamily: P.sans, fontSize: "0.82rem", fontWeight: 500, padding: "9px 18px", borderRadius: 6, cursor: "pointer" }}>
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                          Share My Listing
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agent Proposals */}
                <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, overflow: "hidden", boxShadow: P.shadow }}>
                  <div style={{ padding: "18px 24px", borderBottom: `1px solid ${P.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <h2 style={{ fontFamily: P.sans, fontSize: "1rem", fontWeight: 700, color: P.navy, margin: 0 }}>Agent Proposals</h2>
                        {activeProps.length > 0 && (
                          <span style={{ background: P.orange, color: P.white, borderRadius: 9999, fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px" }}>{activeProps.length}</span>
                        )}
                      </div>
                      <p style={{ fontFamily: P.sans, fontSize: "0.78rem", color: P.sub, margin: "3px 0 0" }}>
                        {acceptedProp
                          ? "You've selected your agent. Their contact details are below."
                          : deadlinePassed
                          ? "Bidding has closed. Review proposals and select your agent."
                          : "Agent identities are kept private until you select a winner. Ranked by commission."}
                      </p>
                    </div>
                    {deadlinePassed && !acceptedProp && pendingProps.length > 1 && (
                      <button onClick={() => toast("Compare view coming soon.")}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${P.border}`, background: "none", borderRadius: 6, padding: "8px 14px", fontFamily: P.sans, fontSize: "0.78rem", fontWeight: 500, color: P.charcoal, cursor: "pointer" }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        Compare Agents
                      </button>
                    )}
                  </div>

                  {/* Sealed state */}
                  {!showProposals && (
                    <div style={{ padding: "44px 24px", textAlign: "center" }}>
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: P.orangeLight, margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={P.orange} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                      </div>
                      <p style={{ fontFamily: P.sans, fontSize: "1rem", fontWeight: 700, color: P.navy, marginBottom: 8 }}>
                        {activeProps.length > 0 ? `${activeProps.length} Proposal${activeProps.length !== 1 ? "s" : ""} Received` : "Waiting for Proposals"}
                      </p>
                      <p style={{ fontFamily: P.sans, fontSize: "0.85rem", color: P.sub, maxWidth: 400, margin: "0 auto 12px", lineHeight: 1.65 }}>
                        Proposals are sealed until bidding closes. You'll review all submissions at once — no pressure during the process.
                      </p>
                      <p style={{ fontFamily: P.mono, fontSize: "0.85rem", color: P.orange, fontWeight: 600, margin: 0 }}>
                        Closes in {deadline ? formatCountdown(deadline) : "—"}
                      </p>
                    </div>
                  )}

                  {/* Proposals table */}
                  {showProposals && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 1.5fr auto", background: P.softGray, borderBottom: `1px solid ${P.border}`, padding: "10px 24px" }}>
                        {["Agent", "Commission", "Marketing Plan", "Track Record", ""].map(h => (
                          <p key={h} style={{ fontFamily: P.sans, fontSize: "0.68rem", fontWeight: 700, color: P.navy, margin: 0, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{h}</p>
                        ))}
                      </div>

                      {/* Winner row */}
                      {acceptedProp && (
                        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${P.border}`, background: P.greenBg }}>
                          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 1.5fr auto", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 42, height: 42, borderRadius: "50%", background: P.green, color: P.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, flexShrink: 0 }}>
                                {(acceptedProp.agentName?.[0] || "A").toUpperCase()}
                              </div>
                              <div>
                                <p style={{ fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 700, color: P.navy, margin: 0 }}>{acceptedProp.agentName}</p>
                                <p style={{ fontFamily: P.sans, fontSize: "0.75rem", color: P.sub, margin: 0 }}>{acceptedProp.agentBrokerage}</p>
                                <span style={{ display: "inline-block", background: P.greenBg, color: P.greenText, border: `1px solid ${P.greenBdr}`, fontSize: "0.68rem", fontWeight: 700, padding: "1px 8px", borderRadius: 9999, marginTop: 3 }}>✓ Selected</span>
                              </div>
                            </div>
                            <div>
                              <p style={{ fontFamily: P.mono, fontSize: "1.05rem", fontWeight: 700, color: P.green, margin: 0 }}>{commissionPct(acceptedProp.commissionBps)}</p>
                              {commissionEst(acceptedProp.commissionBps, acceptedProp.estimatedSalePrice) && (
                                <p style={{ fontFamily: P.sans, fontSize: "0.7rem", color: P.sub, margin: 0 }}>{commissionEst(acceptedProp.commissionBps, acceptedProp.estimatedSalePrice)}</p>
                              )}
                            </div>
                            <p style={{ fontFamily: P.sans, fontSize: "0.8rem", color: P.sub, margin: 0 }}>{marketingLabel(acceptedProp)}</p>
                            <p style={{ fontFamily: P.sans, fontSize: "0.8rem", color: P.sub, margin: 0 }}>{trackRecordLabel(acceptedProp)}</p>
                            <a href={`/agents/profile/${typeof acceptedProp.agentId === "string" ? acceptedProp.agentId : acceptedProp.agentId?.toText?.()}`}
                              style={{ fontFamily: P.sans, fontSize: "0.78rem", color: P.orange, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" as const }}>
                              View Profile →
                            </a>
                          </div>
                          {!reviewedIds.has(acceptedProp.id) ? (
                            <div style={{ marginTop: 6, paddingLeft: 54 }}>
                              <ReviewForm proposal={acceptedProp} onDone={() => setReviewedIds(prev => new Set([...prev, acceptedProp.id]))} />
                            </div>
                          ) : (
                            <p data-testid="review-done" style={{ fontFamily: P.sans, fontSize: "0.85rem", color: P.green, marginTop: 8, paddingLeft: 54 }}>Review submitted — thank you.</p>
                          )}
                        </div>
                      )}

                      {/* Anonymous proposals */}
                      {pendingProps.map((p: any, i: number) => {
                        const hov = hoveredRow === p.id;
                        return (
                          <div key={p.id}
                            onMouseEnter={() => setHoveredRow(p.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 1.5fr auto", alignItems: "center", padding: "16px 24px", borderBottom: `1px solid ${P.border}`, background: hov ? P.warmWhite : P.white, transition: "background 0.15s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 42, height: 42, borderRadius: "50%", background: P.softGray, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={P.sub} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                </svg>
                              </div>
                              <div>
                                <p style={{ fontFamily: P.sans, fontSize: "0.875rem", fontWeight: 700, color: P.navy, margin: 0 }}>Agent #{i + (acceptedProp ? 2 : 1)}</p>
                                <p style={{ fontFamily: P.sans, fontSize: "0.72rem", color: P.sub, margin: 0 }}>Revealed after selection</p>
                                <p style={{ fontFamily: P.sans, fontSize: "0.68rem", color: P.sub, margin: 0 }}>{timeAgo(p.createdAt)}</p>
                              </div>
                            </div>
                            <div>
                              <p style={{ fontFamily: P.mono, fontSize: "1.05rem", fontWeight: 700, color: P.orange, margin: 0 }}>{commissionPct(p.commissionBps)}</p>
                              {commissionEst(p.commissionBps, p.estimatedSalePrice) && (
                                <p style={{ fontFamily: P.sans, fontSize: "0.7rem", color: P.sub, margin: 0 }}>{commissionEst(p.commissionBps, p.estimatedSalePrice)}</p>
                              )}
                            </div>
                            <p style={{ fontFamily: P.sans, fontSize: "0.8rem", color: P.sub, margin: 0, paddingRight: 8 }}>{marketingLabel(p)}</p>
                            <p style={{ fontFamily: P.sans, fontSize: "0.8rem", color: P.sub, margin: 0 }}>{trackRecordLabel(p)}</p>
                            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                              <button onClick={() => setViewingProposal({ p, idx: i })}
                                style={{ fontFamily: P.sans, fontSize: "0.78rem", fontWeight: 600, background: "none", border: `1.5px solid ${P.navy}`, color: P.navy, borderRadius: 6, padding: "7px 14px", cursor: "pointer", whiteSpace: "nowrap" as const }}>
                                View Proposal
                              </button>
                              {!acceptedProp && (
                                <button onClick={() => handleAccept(p.id, activeReq.id)} disabled={accepting === p.id}
                                  style={{ fontFamily: P.sans, fontSize: "0.78rem", fontWeight: 600, background: P.orange, border: "none", color: P.white, borderRadius: 6, padding: "7px 14px", cursor: "pointer", whiteSpace: "nowrap" as const }}>
                                  {accepting === p.id ? "Selecting…" : "Select"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {activeProps.length === 0 && (
                        <p style={{ fontFamily: P.sans, fontSize: "0.875rem", color: P.sub, padding: "24px" }}>No proposals received.</p>
                      )}
                    </>
                  )}
                </div>

                {/* Decision Support */}
                {deadlinePassed && !acceptedProp && pendingProps.length > 0 && (
                  <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, padding: 24, boxShadow: P.shadow }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: P.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <IcLightbulb />
                      </div>
                      <div>
                        <h2 style={{ fontFamily: P.sans, fontSize: "0.95rem", fontWeight: 700, color: P.navy, margin: 0 }}>Not Sure Who to Choose?</h2>
                        <p style={{ fontFamily: P.sans, fontSize: "0.78rem", color: P.sub, margin: 0 }}>Consider these factors when evaluating proposals.</p>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        { title: "Commission isn't everything", desc: "A lower rate is great, but consider the agent's marketing plan and strategy." },
                        { title: "Days on market matter", desc: "Strategic pricing can sell faster and net you more overall." },
                        { title: "Marketing reach", desc: "Ask about online exposure, open houses, and professional photography." },
                        { title: "Local expertise", desc: "An agent familiar with your neighborhood knows buyer demand and comps." },
                      ].map(({ title, desc }) => (
                        <div key={title} style={{ background: P.warmWhite, border: `1px solid ${P.border}`, borderRadius: 8, padding: "14px 16px" }}>
                          <p style={{ fontFamily: P.sans, fontSize: "0.82rem", fontWeight: 700, color: P.navy, margin: "0 0 5px" }}>{title}</p>
                          <p style={{ fontFamily: P.sans, fontSize: "0.78rem", color: P.sub, margin: 0, lineHeight: 1.55 }}>{desc}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => toast("Full proposal comparison coming soon.")}
                      style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${P.border}`, background: "none", borderRadius: 6, padding: "9px 16px", fontFamily: P.sans, fontSize: "0.82rem", fontWeight: 500, color: P.navy, cursor: "pointer" }}>
                      <IcArrowRight /> Compare proposals side-by-side
                    </button>
                  </div>
                )}

                {/* What Happens Next */}
                {!acceptedProp && (
                  <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, padding: 24, boxShadow: P.shadow }}>
                    <h2 style={{ fontFamily: P.sans, fontSize: "0.95rem", fontWeight: 700, color: P.navy, margin: "0 0 24px" }}>What Happens Next</h2>
                    <div style={{ display: "flex", position: "relative" }}>
                      <div style={{ position: "absolute", top: 20, left: "10%", right: "10%", height: 2, background: P.softGray, zIndex: 0 }} />
                      {[
                        { n: 1, title: "Bidding Closes",     desc: deadline ? new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—", done: deadlinePassed },
                        { n: 2, title: "Review Proposals",   desc: "Compare commissions, plans & track records.",      done: false },
                        { n: 3, title: "Select Your Agent",  desc: "Choose the best fit for your goals.",              done: false },
                        { n: 4, title: "Agent Gets Details", desc: "Only the winner receives your address & contact.", done: false },
                      ].map(({ n, title, desc, done }) => (
                        <div key={n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1, padding: "0 4px" }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: done ? P.green : P.orange, color: P.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, marginBottom: 10, border: `3px solid ${P.warmWhite}` }}>
                            {done ? "✓" : n}
                          </div>
                          <p style={{ fontFamily: P.sans, fontSize: "0.78rem", fontWeight: 700, color: P.navy, margin: "0 0 4px" }}>{title}</p>
                          <p style={{ fontFamily: P.sans, fontSize: "0.7rem", color: P.sub, margin: 0, lineHeight: 1.45 }}>{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trust bar */}
                <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, padding: "18px 24px", boxShadow: P.shadow }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" as const }}>
                    {[
                      { svg: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={P.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: "You're in Control", desc: "Choose the agent who is the best fit for you." },
                      { svg: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={P.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>, title: "100% Free", desc: "Our service is 100% free for homeowners." },
                      { svg: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={P.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>, title: "No Obligation", desc: "You decide if, when, and who to hire." },
                      { svg: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={P.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, title: "Secure & Private", desc: "Your information is safe with us." },
                    ].map(({ svg, title, desc }) => (
                      <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: "1 1 180px", padding: "0 12px" }}>
                        <div style={{ flexShrink: 0, marginTop: 2 }}>{svg}</div>
                        <div>
                          <p style={{ fontFamily: P.sans, fontSize: "0.82rem", fontWeight: 700, color: P.navy, margin: "0 0 2px" }}>{title}</p>
                          <p style={{ fontFamily: P.sans, fontSize: "0.75rem", color: P.sub, margin: 0, lineHeight: 1.4 }}>{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>{/* end left column */}

              {/* ── Right rail ───────────────────────────────────────── */}
              <div style={{ flex: "0 0 284px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Listing at a Glance */}
                <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, overflow: "hidden", boxShadow: P.shadow }}>
                  <div style={{ padding: "14px 20px", borderBottom: `1px solid ${P.border}` }}>
                    <h2 style={{ fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 700, color: P.navy, margin: 0 }}>Your Listing at a Glance</h2>
                  </div>
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                      {[
                        { val: activeProps.length,      label: "Proposals" },
                        { val: byCommission.length,     label: "Agents" },
                        { val: activeReq?.viewCount != null ? Number(activeReq.viewCount) : "—", label: "Agent Views" },
                        { val: deadline ? formatCountdown(deadline) : "—", label: biddingOpen ? "Time Left" : "Closed" },
                      ].map(({ val, label }) => (
                        <div key={label} style={{ background: P.warmWhite, border: `1px solid ${P.border}`, borderRadius: 8, padding: "12px", textAlign: "center" }}>
                          <p style={{ fontFamily: P.mono, fontSize: "1.4rem", fontWeight: 700, color: P.orange, margin: "0 0 2px" }}>{val}</p>
                          <p style={{ fontFamily: P.sans, fontSize: "0.68rem", color: P.sub, margin: 0 }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => toast("Activity timeline coming soon.")}
                      style={{ width: "100%", background: "none", border: "none", padding: 0, fontFamily: P.sans, fontSize: "0.78rem", color: P.orange, fontWeight: 600, cursor: "pointer", textAlign: "center" as const }}>
                      View Full Timeline →
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                {activityItems.length > 0 && (
                  <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, overflow: "hidden", boxShadow: P.shadow }}>
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${P.border}` }}>
                      <h2 style={{ fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 700, color: P.navy, margin: 0 }}>Recent Activity</h2>
                    </div>
                    <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                      {activityItems.map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: item.bg, color: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", flexShrink: 0 }}>
                            {item.icon}
                          </div>
                          <div>
                            <p style={{ fontFamily: P.sans, fontSize: "0.8rem", color: P.charcoal, margin: "0 0 1px", lineHeight: 1.4 }}>{item.text}</p>
                            <p style={{ fontFamily: P.sans, fontSize: "0.7rem", color: P.sub, margin: 0 }}>{item.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, overflow: "hidden", boxShadow: P.shadow }}>
                  <div style={{ padding: "14px 20px", borderBottom: `1px solid ${P.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 700, color: P.navy, margin: 0 }}>Messages</h2>
                    {!acceptedProp && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: P.sans, fontSize: "0.68rem", color: P.sub }}>
                        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        Locked
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "20px", textAlign: "center" }}>
                    {acceptedProp ? (
                      <>
                        <p style={{ fontFamily: P.sans, fontSize: "0.85rem", color: P.navy, fontWeight: 700, marginBottom: 5 }}>
                          {acceptedProp.agentName} can now contact you.
                        </p>
                        <p style={{ fontFamily: P.sans, fontSize: "0.78rem", color: P.sub, margin: 0 }}>
                          Your selected agent has received your contact details and will be in touch shortly.
                        </p>
                      </>
                    ) : (
                      <>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: P.softGray, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={P.sub} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        </div>
                        <p style={{ fontFamily: P.sans, fontSize: "0.85rem", fontWeight: 700, color: P.navy, margin: "0 0 4px" }}>Messaging Locked</p>
                        <p style={{ fontFamily: P.sans, fontSize: "0.78rem", color: P.sub, margin: 0, lineHeight: 1.55 }}>
                          Only the agent you select can contact you.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Tips & Resources */}
                <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, overflow: "hidden", boxShadow: P.shadow }}>
                  <div style={{ padding: "14px 20px", borderBottom: `1px solid ${P.border}` }}>
                    <h2 style={{ fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 700, color: P.navy, margin: 0 }}>Tips & Resources</h2>
                  </div>
                  <div style={{ padding: "4px 20px 16px" }}>
                    {[
                      "How to evaluate commission rates",
                      "Questions to ask your agent",
                      "Understanding the selling timeline",
                      "What to expect after you pick",
                    ].map(text => (
                      <a key={text} href="/faq"
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${P.softGray}`, fontFamily: P.sans, fontSize: "0.8rem", color: P.charcoal, textDecoration: "none" }}>
                        <span>{text}</span>
                        <IcArrowRight />
                      </a>
                    ))}
                    <a href="/faq" style={{ display: "block", textAlign: "center", fontFamily: P.sans, fontSize: "0.78rem", fontWeight: 700, color: P.orange, textDecoration: "none", marginTop: 14 }}>
                      Visit Help Center →
                    </a>
                  </div>
                </div>

                {/* Need Help */}
                <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, padding: 20, boxShadow: P.shadow }}>
                  <h2 style={{ fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 700, color: P.navy, margin: "0 0 6px" }}>Need Help?</h2>
                  <p style={{ fontFamily: P.sans, fontSize: "0.78rem", color: P.sub, margin: "0 0 14px" }}>Our support team is here for you.</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: P.sub, marginBottom: 4 }}>
                    <IcPhone />
                    <span style={{ fontFamily: P.sans, fontSize: "0.72rem" }}>Call or Text</span>
                  </div>
                  <p style={{ fontFamily: P.mono, fontSize: "0.95rem", fontWeight: 700, color: P.navy, margin: 0 }}>(512) 555-0198</p>
                </div>

              </div>{/* end right rail */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
