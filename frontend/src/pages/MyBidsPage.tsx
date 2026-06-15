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
  IcShield, IcPercent, IcTrend, IcClock, IcPhone,
  type SidebarItem,
} from "../components/DashboardSidebar";

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
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function agentIdText(id: any) {
    return typeof id === "string" ? id : (id?.toText?.() ?? String(id));
  }

  if (done) return (
    <p data-testid="review-done" style={{ fontFamily: DC.sans, fontSize: "0.85rem", color: DC.green, marginTop: 12 }}>
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
        if ("DuplicateReview" in result.err)    toast.error("You've already reviewed this agent.");
        else if ("RateLimitExceeded" in result.err) toast.error("Review limit reached. Try again tomorrow.");
        else toast.error(JSON.stringify(result.err));
        return;
      }
      setDone(true); onDone();
    } finally { setSubmitting(false); }
  }

  return (
    <form data-testid="review-form" onSubmit={handleSubmit}
      style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${DC.border}` }}>
      <p style={{ fontFamily: DC.sans, fontSize: "0.8rem", fontWeight: 600, color: DC.text, marginBottom: 8 }}>
        Rate {proposal.agentName}
      </p>
      <div style={{ marginBottom: 12 }}><StarPicker value={rating} onChange={setRating} /></div>
      <textarea data-testid="review-comment" value={comment}
        onChange={e => setComment(e.target.value)} rows={3}
        placeholder="Share your experience (optional)…"
        style={{ border: `1px solid ${DC.border}`, padding: "10px 12px", width: "100%", fontFamily: DC.sans, fontSize: "0.875rem", resize: "vertical", boxSizing: "border-box", borderRadius: 6 }} />
      <button type="submit" data-testid="review-submit" disabled={submitting}
        style={{ marginTop: 8, background: DC.primary, border: "none", color: "#fff", fontFamily: DC.sans, fontSize: "0.875rem", fontWeight: 600, padding: "10px 20px", cursor: "pointer", borderRadius: 6, minHeight: 40 }}>
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MyBidsPage() {
  const { logout } = useAuth();
  const [requests, setRequests]       = useState<any[]>([]);
  const [proposals, setProposals]     = useState<Record<string, any[]>>({});
  const [accepting, setAccepting]     = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [showAllBids, setShowAllBids]           = useState(false);
  const [showAllProposals, setShowAllProposals] = useState(false);

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

  const activeReq       = requests.find((r: any) => r.status && "Open" in r.status) || requests[0];
  const activeProps     = activeReq ? (proposals[activeReq.id] || []) : [];
  const byCommission    = [...activeProps].sort((a, b) => Number(a.commissionBps) - Number(b.commissionBps));
  const bestOffer       = byCommission[0];
  const deadline        = activeReq ? Number(activeReq.bidDeadline) / 1_000_000 : 0;
  const biddingOpen     = activeReq?.status && "Open" in activeReq.status;
  const proposalsWithCMA = byCommission.filter(p => p.cmaSummary?.trim());

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
      toast.success("Proposal accepted! The agent will receive a platform fee invoice.");
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
    { label: "Dashboard",        icon: <IcGrid />,     href: "/my-bids" },
    { label: "My Listing",       icon: <IcHome />,     href: "/my-bids" },
    { label: "Bids Received",    icon: <IcList />,     href: "/my-bids" },
    { label: "Messages",         icon: <IcMsg />,      href: "#", badge: byCommission.length > 0 ? byCommission.length : undefined },
    { label: "Documents",        icon: <IcDoc />,      href: "#" },
    { label: "Activity",         icon: <IcActivity />, href: "#" },
    { label: "Account Settings", icon: <IcSettings />, href: "#" },
  ];

  const topBids     = showAllBids       ? byCommission       : byCommission.slice(0, 3);
  const topCMAs     = showAllProposals  ? proposalsWithCMA   : proposalsWithCMA.slice(0, 3);
  const msgCount    = byCommission.length;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: DC.bg, fontFamily: DC.sans }}>
      <DashboardSidebar items={sidebarItems} activeLabel="Dashboard" onLogout={logout} />

      <div style={{ marginLeft: W_SIDEBAR, flex: 1, minWidth: 0 }}>
        <DashboardTopBar notifCount={msgCount} />

        <div style={{ padding: "32px 32px 64px" }}>
          {/* Welcome */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: DC.sans, fontSize: "1.75rem", fontWeight: 700, color: DC.text, margin: "0 0 4px" }}>
              Welcome back!
            </h1>
            <p style={{ fontFamily: DC.sans, fontSize: "0.9rem", color: DC.textSub, margin: 0 }}>
              Here's an overview of your listing and bidding activity.
            </p>
          </div>

          {/* Empty state */}
          {requests.length === 0 && (
            <div style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, padding: 48, textAlign: "center" }}>
              <p style={{ fontFamily: DC.sans, color: DC.textSub, marginBottom: 16 }}>No active listings yet.</p>
              <a href="/post" style={{ display: "inline-block", background: DC.primary, color: "#fff", padding: "12px 24px", borderRadius: 6, fontFamily: DC.sans, fontWeight: 600, textDecoration: "none", fontSize: "0.875rem" }}>
                Post Your Listing
              </a>
            </div>
          )}

          {requests.length > 0 && (
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

              {/* ── Left column ──────────────────────────────────────────────── */}
              <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Your Active Listing */}
                <div style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, overflow: "hidden", boxShadow: DC.shadow }}>
                  <div style={{ padding: "18px 24px", borderBottom: `1px solid ${DC.border}` }}>
                    <h2 style={{ fontFamily: DC.sans, fontSize: "1rem", fontWeight: 600, color: DC.text, margin: 0 }}>
                      Your Active Listing
                    </h2>
                  </div>
                  <div style={{ padding: 24 }}>
                    <div style={{ display: "flex", gap: 20 }}>
                      {/* Photo + status */}
                      <div style={{ flex: "0 0 200px", minWidth: 0 }}>
                        <p style={{ fontFamily: DC.sans, fontSize: "0.9rem", fontWeight: 600, color: DC.text, marginBottom: 8, filter: "blur(4px)", userSelect: "none" }}>
                          {activeReq?.address || `${activeReq?.city}, ${activeReq?.county}`}
                        </p>
                        <div style={{ marginBottom: 10 }}>
                          {biddingOpen ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: DC.greenBg, color: DC.greenText, border: `1px solid ${DC.greenBdr}`, borderRadius: 9999, padding: "3px 10px", fontSize: "0.75rem", fontWeight: 600 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: DC.green }} />
                              Bidding Open
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F3F4F6", color: DC.textSub, borderRadius: 9999, padding: "3px 10px", fontSize: "0.75rem", fontWeight: 600 }}>
                              Closed
                            </span>
                          )}
                        </div>
                        <p style={{ fontFamily: DC.mono, fontSize: "0.75rem", color: DC.textSub, marginBottom: 16 }}>
                          Closes in {deadline ? formatCountdown(deadline) : "—"}
                        </p>
                        {biddingOpen && (
                          <button
                            onClick={() => handleCancel(activeReq.id)}
                            style={{ fontFamily: DC.sans, fontSize: "0.75rem", color: "#DC2626", background: "transparent", border: "1px solid #FCA5A5", borderRadius: 6, padding: "4px 10px", cursor: "pointer", marginBottom: 12 }}
                          >
                            Cancel listing
                          </button>
                        )}
                        <HousePlaceholder label={`${activeReq?.city}, ${activeReq?.county}`} />
                      </div>

                      {/* Listing details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontFamily: DC.sans, fontSize: "0.75rem", fontWeight: 600, color: DC.textSub, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Listing Details
                        </h3>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            {[
                              ["Property Type",  "Single Family"],
                              ["Bedrooms",        activeReq?.beds?.[0]  != null ? String(Number(activeReq.beds[0]))  : "—"],
                              ["Bathrooms",       activeReq?.baths?.[0] != null ? String(Number(activeReq.baths[0])) : "—"],
                              ["Square Feet",     activeReq?.sqft?.[0]  != null ? Number(activeReq.sqft[0]).toLocaleString() : "—"],
                              ["Desired Price",   activeReq?.desiredSalePrice?.[0] != null ? `$${Number(activeReq.desiredSalePrice[0]).toLocaleString()}` : "—"],
                            ].map(([label, val]) => (
                              <tr key={label}>
                                <td style={{ fontFamily: DC.sans, fontSize: "0.8rem", color: DC.textSub, padding: "6px 0" }}>{label}</td>
                                <td style={{ fontFamily: DC.sans, fontSize: "0.8rem", color: DC.text, fontWeight: 500, padding: "6px 0", textAlign: "right" }}>{val}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <a href="/post" style={{ display: "block", marginTop: 16, padding: "10px 0", border: `1px solid ${DC.border}`, borderRadius: 6, textAlign: "center", fontFamily: DC.sans, fontSize: "0.875rem", color: DC.text, fontWeight: 500, textDecoration: "none" }}>
                          View Listing Details
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bid Overview + CMA Proposals */}
                <div style={{ display: "flex", gap: 20 }}>

                  {/* Bid Overview */}
                  <div style={{ flex: 1, background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, overflow: "hidden", boxShadow: DC.shadow }}>
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${DC.border}` }}>
                      <h2 style={{ fontFamily: DC.sans, fontSize: "0.9rem", fontWeight: 600, color: DC.text, margin: 0 }}>Bid Overview</h2>
                      <p style={{ fontFamily: DC.sans, fontSize: "0.72rem", color: DC.textSub, margin: "2px 0 0" }}>
                        Top {Math.min(byCommission.length, 3)} commission offers (lowest first)
                      </p>
                    </div>
                    <div>
                      {byCommission.length === 0 ? (
                        <p style={{ fontFamily: DC.sans, fontSize: "0.85rem", color: DC.textSub, padding: "16px 20px" }}>
                          {Date.now() < deadline ? "Bids are sealed until the deadline." : "No proposals received."}
                        </p>
                      ) : topBids.map((p: any, i: number) => (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", borderBottom: `1px solid ${DC.border}` }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "#DBEAFE" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, color: i === 0 ? DC.primary : DC.textSub, flexShrink: 0 }}>
                            {i + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: DC.sans, fontSize: "0.85rem", fontWeight: 500, color: DC.text, margin: 0 }}>{p.agentName}</p>
                            <p style={{ fontFamily: DC.sans, fontSize: "0.72rem", color: DC.textSub, margin: 0 }}>{p.agentBrokerage}</p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ fontFamily: DC.mono, fontSize: "0.95rem", fontWeight: 700, color: i === 0 ? DC.green : DC.text, margin: 0 }}>
                              {(Number(p.commissionBps) / 100).toFixed(2)}%
                            </p>
                            {i === 0 && <p style={{ fontFamily: DC.sans, fontSize: "0.68rem", fontWeight: 600, color: DC.green, margin: 0 }}>Top Offer</p>}
                            <p style={{ fontFamily: DC.sans, fontSize: "0.68rem", color: DC.textSub, margin: 0 }}>{timeAgo(p.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {byCommission.length > 0 && (
                      <div style={{ padding: "10px 20px" }}>
                        <button onClick={() => setShowAllBids(!showAllBids)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", border: `1px solid ${DC.border}`, background: "none", borderRadius: 6, padding: "9px 0", fontFamily: DC.sans, fontSize: "0.78rem", color: DC.text, cursor: "pointer", fontWeight: 500 }}>
                          🔒 {showAllBids ? "Show Less" : "View All Bids (Private)"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CMA Proposals */}
                  <div style={{ flex: 1, background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, overflow: "hidden", boxShadow: DC.shadow }}>
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${DC.border}` }}>
                      <h2 style={{ fontFamily: DC.sans, fontSize: "0.9rem", fontWeight: 600, color: DC.text, margin: 0 }}>CMA Proposals</h2>
                      <p style={{ fontFamily: DC.sans, fontSize: "0.72rem", color: DC.textSub, margin: "2px 0 0" }}>
                        {proposalsWithCMA.length} proposal{proposalsWithCMA.length !== 1 ? "s" : ""} submitted
                      </p>
                    </div>
                    <div>
                      {proposalsWithCMA.length === 0 ? (
                        <p style={{ fontFamily: DC.sans, fontSize: "0.85rem", color: DC.textSub, padding: "16px 20px" }}>
                          {Date.now() < deadline ? "Proposals are sealed until the deadline." : "No CMA proposals yet."}
                        </p>
                      ) : topCMAs.map((p: any, i: number) => (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", borderBottom: `1px solid ${DC.border}` }}>
                          <div style={{ width: 28, height: 28, borderRadius: 4, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                            </svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: DC.sans, fontSize: "0.82rem", fontWeight: 500, color: DC.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.agentName} CMA
                            </p>
                            <p style={{ fontFamily: DC.sans, fontSize: "0.7rem", color: DC.textSub, margin: 0 }}>
                              {timeAgo(p.createdAt)}
                            </p>
                          </div>
                          <button
                            onClick={() => toast(p.cmaSummary?.slice(0, 200) || "No summary provided.", { duration: 6000 })}
                            style={{ fontFamily: DC.sans, fontSize: "0.72rem", border: `1px solid ${DC.border}`, background: "none", borderRadius: 4, padding: "5px 10px", cursor: "pointer", color: DC.text, flexShrink: 0 }}>
                            Preview
                          </button>
                        </div>
                      ))}
                    </div>
                    {proposalsWithCMA.length > 0 && (
                      <div style={{ padding: "10px 20px" }}>
                        <button onClick={() => setShowAllProposals(!showAllProposals)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", border: `1px solid ${DC.border}`, background: "none", borderRadius: 6, padding: "9px 0", fontFamily: DC.sans, fontSize: "0.78rem", color: DC.text, cursor: "pointer", fontWeight: 500 }}>
                          🔒 {showAllProposals ? "Show Less" : "View All Proposals (Private)"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* What Happens Next */}
                <div style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, padding: 24, boxShadow: DC.shadow }}>
                  <h2 style={{ fontFamily: DC.sans, fontSize: "0.95rem", fontWeight: 600, color: DC.text, margin: "0 0 24px" }}>What Happens Next?</h2>
                  <div style={{ display: "flex", gap: 0, position: "relative" }}>
                    <div style={{ position: "absolute", top: 20, left: "10%", right: "10%", height: 2, background: "#D1FAE5", zIndex: 0 }} />
                    {[
                      { n: 1, icon: "🏷️", title: "Bidding Ends",          desc: `Bidding closes on ${deadline ? new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}.` },
                      { n: 2, icon: "✉️", title: "You Review Proposals",   desc: "Compare commission offers and CMA proposals." },
                      { n: 3, icon: "🏆", title: "Select Your Agent",      desc: "Choose the agent that's the best fit for you." },
                      { n: 4, icon: "🏠", title: "Get Your Address",        desc: "The winning agent receives your address to move forward." },
                    ].map(({ n, title, desc }) => (
                      <div key={n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1, padding: "0 4px" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: DC.green, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, marginBottom: 10, border: `3px solid ${DC.bg}` }}>
                          {n}
                        </div>
                        <p style={{ fontFamily: DC.sans, fontSize: "0.78rem", fontWeight: 600, color: DC.text, margin: "0 0 4px" }}>{title}</p>
                        <p style={{ fontFamily: DC.sans, fontSize: "0.7rem", color: DC.textSub, margin: 0, lineHeight: 1.45 }}>{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accepted proposal + review */}
                {activeProps.some((p: any) => p.status && "Accepted" in p.status) && (
                  <div style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, padding: 24, boxShadow: DC.shadow }}>
                    <h2 style={{ fontFamily: DC.sans, fontSize: "0.95rem", fontWeight: 600, color: DC.text, margin: "0 0 16px" }}>Accepted Proposal</h2>
                    {activeProps.filter((p: any) => p.status && "Accepted" in p.status).map((p: any) => (
                      <div key={p.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div>
                            <p style={{ fontFamily: DC.sans, fontWeight: 600, color: DC.text, margin: "0 0 2px" }}>{p.agentName}</p>
                            <p style={{ fontFamily: DC.sans, fontSize: "0.8rem", color: DC.textSub, margin: 0 }}>{p.agentBrokerage}</p>
                          </div>
                          <span style={{ fontFamily: DC.mono, fontSize: "1rem", fontWeight: 700, color: DC.green }}>
                            {(Number(p.commissionBps) / 100).toFixed(2)}%
                          </span>
                        </div>
                        {p.cmaSummary && <p style={{ fontFamily: DC.sans, fontSize: "0.85rem", color: DC.textSub, marginBottom: 0 }}>{p.cmaSummary}</p>}
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <a href={`/agents/profile/${typeof p.agentId === "string" ? p.agentId : p.agentId?.toText?.()}`}
                            style={{ fontFamily: DC.sans, fontSize: "0.8rem", color: DC.primary, fontWeight: 500 }}>
                            View Profile →
                          </a>
                        </div>
                        {!reviewedIds.has(p.id) && (
                          <ReviewForm proposal={p} onDone={() => setReviewedIds(prev => new Set([...prev, p.id]))} />
                        )}
                        {reviewedIds.has(p.id) && (
                          <p data-testid="review-done" style={{ fontFamily: DC.sans, fontSize: "0.85rem", color: DC.green, marginTop: 12 }}>Review submitted — thank you.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pending proposals (post-deadline) */}
                {activeProps.some((p: any) => p.status && "Pending" in p.status) && Date.now() >= deadline && (
                  <div style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, overflow: "hidden", boxShadow: DC.shadow }}>
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${DC.border}` }}>
                      <h2 style={{ fontFamily: DC.sans, fontSize: "0.9rem", fontWeight: 600, color: DC.text, margin: 0 }}>All Proposals</h2>
                    </div>
                    {activeProps.filter((p: any) => p.status && "Pending" in p.status).map((p: any) => (
                      <div key={p.id} style={{ padding: "16px 20px", borderBottom: `1px solid ${DC.border}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                          <div>
                            <p style={{ fontFamily: DC.sans, fontWeight: 500, color: DC.text, margin: "0 0 2px" }}>{p.agentName} · {p.agentBrokerage}</p>
                            <p style={{ fontFamily: DC.mono, fontSize: "0.72rem", color: DC.textSub, margin: 0 }}>
                              {(Number(p.commissionBps) / 100).toFixed(2)}% commission
                              {p.estimatedSalePrice ? ` · Est. $${Number(p.estimatedSalePrice).toLocaleString()}` : ""}
                              {p.estimatedDaysOnMarket ? ` · ~${p.estimatedDaysOnMarket} days` : ""}
                            </p>
                          </div>
                          <button onClick={() => handleAccept(p.id, activeReq.id)} disabled={accepting === p.id}
                            style={{ background: DC.primary, border: "none", color: "#fff", fontFamily: DC.sans, fontSize: "0.78rem", fontWeight: 600, padding: "8px 14px", cursor: "pointer", borderRadius: 6, whiteSpace: "nowrap", minHeight: 36 }}>
                            {accepting === p.id ? "Accepting…" : "Select Agent"}
                          </button>
                        </div>
                        {p.cmaSummary && <p style={{ fontFamily: DC.sans, fontSize: "0.82rem", color: DC.textSub, margin: 0 }}>{p.cmaSummary}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Right rail ───────────────────────────────────────────────── */}
              <div style={{ flex: "0 0 288px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Info Secure */}
                <div style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, padding: 20, boxShadow: DC.shadow }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flexShrink: 0, marginTop: 2 }}><IcShield /></div>
                    <div>
                      <p style={{ fontFamily: DC.sans, fontSize: "0.875rem", fontWeight: 600, color: DC.text, margin: "0 0 5px" }}>Your Information is Secure</p>
                      <p style={{ fontFamily: DC.sans, fontSize: "0.78rem", color: DC.textSub, margin: "0 0 8px", lineHeight: 1.5 }}>
                        We protect your privacy and only share your address with the winning agent.
                      </p>
                      <a href="/faq" style={{ fontFamily: DC.sans, fontSize: "0.78rem", color: DC.primary, textDecoration: "none", fontWeight: 500 }}>Learn More</a>
                    </div>
                  </div>
                </div>

                {/* Bidding Summary */}
                <div style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, overflow: "hidden", boxShadow: DC.shadow }}>
                  <div style={{ padding: "14px 20px", borderBottom: `1px solid ${DC.border}` }}>
                    <h2 style={{ fontFamily: DC.sans, fontSize: "0.9rem", fontWeight: 600, color: DC.text, margin: 0 }}>Bidding Summary</h2>
                  </div>
                  <div style={{ padding: "16px 20px" }}>
                    {([
                      { icon: <IcPercent />, label: "Starting Commission", sub: "(Your Target)", value: "3.00%", color: DC.primary },
                      { icon: <IcTrend />,   label: "Current Best Offer",  sub: bestOffer ? "You're the top offer!" : undefined, value: bestOffer ? `${(Number(bestOffer.commissionBps) / 100).toFixed(2)}%` : "—", color: bestOffer ? DC.green : DC.text },
                      { icon: <IcClock />,   label: "Bidding Closes In",   sub: deadline ? new Date(deadline).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "", value: deadline ? formatCountdown(deadline) : "—", color: DC.text },
                    ] as { icon: React.ReactNode; label: string; sub?: string; value: string; color: string }[]).map(({ icon, label, sub, value, color }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: DC.sans, fontSize: "0.75rem", color: DC.textSub, margin: 0 }}>{label}</p>
                          {sub && <p style={{ fontFamily: DC.sans, fontSize: "0.7rem", color: sub.includes("top") ? DC.green : DC.textSub, margin: 0 }}>{sub}</p>}
                        </div>
                        <p style={{ fontFamily: DC.mono, fontSize: "1rem", fontWeight: 700, color, margin: 0, flexShrink: 0 }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "0 20px 20px" }}>
                    <button onClick={() => setShowAllBids(true)}
                      style={{ width: "100%", background: DC.primary, border: "none", color: "#fff", borderRadius: 6, padding: "12px 0", fontFamily: DC.sans, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
                      View Bids
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, overflow: "hidden", boxShadow: DC.shadow }}>
                  <div style={{ padding: "12px 20px", borderBottom: `1px solid ${DC.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h2 style={{ fontFamily: DC.sans, fontSize: "0.9rem", fontWeight: 600, color: DC.text, margin: 0 }}>Messages</h2>
                      {msgCount > 0 && (
                        <span style={{ background: "#DBEAFE", color: DC.primary, borderRadius: 9999, fontSize: "0.68rem", fontWeight: 700, padding: "1px 7px" }}>{msgCount}</span>
                      )}
                    </div>
                    <a href="#" style={{ fontFamily: DC.sans, fontSize: "0.72rem", color: DC.primary, textDecoration: "none", fontWeight: 500 }}>View All</a>
                  </div>
                  <div>
                    {byCommission.slice(0, 3).map((p: any, i: number) => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", borderBottom: i < 2 ? `1px solid ${DC.border}` : "none" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E0E7FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#4338CA", flexShrink: 0 }}>
                          {(p.agentName?.[0] || "A").toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: DC.sans, fontSize: "0.82rem", fontWeight: 500, color: DC.text, margin: "0 0 1px" }}>{p.agentName}</p>
                          <p style={{ fontFamily: DC.sans, fontSize: "0.7rem", color: DC.textSub, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.coverLetter ? `${p.coverLetter.slice(0, 55)}…` : "Submitted a proposal"}
                          </p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontFamily: DC.sans, fontSize: "0.68rem", color: DC.textSub, margin: "0 0 4px" }}>{timeAgo(p.createdAt)}</p>
                          {i < 2 && <span style={{ width: 8, height: 8, borderRadius: "50%", background: DC.primary, display: "inline-block" }} />}
                        </div>
                      </div>
                    ))}
                    {byCommission.length === 0 && (
                      <p style={{ fontFamily: DC.sans, fontSize: "0.85rem", color: DC.textSub, padding: "16px 20px" }}>No messages yet.</p>
                    )}
                  </div>
                  <div style={{ padding: "10px 20px" }}>
                    <button onClick={() => toast("Messaging coming soon.")}
                      style={{ width: "100%", border: `1px solid ${DC.border}`, background: "none", borderRadius: 6, padding: "10px 0", fontFamily: DC.sans, fontSize: "0.78rem", fontWeight: 500, color: DC.text, cursor: "pointer" }}>
                      Go to Messages
                    </button>
                  </div>
                </div>

                {/* Need Help */}
                <div style={{ background: DC.white, border: `1px solid ${DC.border}`, borderRadius: 8, padding: 20, boxShadow: DC.shadow }}>
                  <h2 style={{ fontFamily: DC.sans, fontSize: "0.9rem", fontWeight: 600, color: DC.text, margin: "0 0 4px" }}>Need Help?</h2>
                  <p style={{ fontFamily: DC.sans, fontSize: "0.78rem", color: DC.textSub, margin: "0 0 14px" }}>Our support team is here for you.</p>
                  <a href="/faq"
                    style={{ display: "block", border: `1px solid ${DC.border}`, background: "none", borderRadius: 6, padding: "10px 0", fontFamily: DC.sans, fontSize: "0.78rem", fontWeight: 500, color: DC.text, textDecoration: "none", textAlign: "center", marginBottom: 12 }}>
                    Visit Help Center
                  </a>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, color: DC.textSub }}>
                    <IcPhone /> <span style={{ fontFamily: DC.sans, fontSize: "0.72rem" }}>Call or Text</span>
                  </div>
                  <p style={{ fontFamily: DC.mono, fontSize: "0.9rem", fontWeight: 600, color: DC.text, margin: 0 }}>(512) 555-0198</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
