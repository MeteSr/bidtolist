import { useEffect, useState } from "react";
import { getMyBidRequests, getProposalsForRequest, acceptProposal } from "../services/listing";
import { addReview } from "../services/agent";
import { notifyProposalResult } from "../services/email";
import toast from "react-hot-toast";
import { useBreakpoint } from "../hooks/useBreakpoint";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

function formatCountdown(deadlineMs: number): string {
  const ms = deadlineMs - Date.now();
  if (ms <= 0) return "Bidding closed";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 48) return `Closes in ${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return rem > 0 ? `Closes in ${days}d ${rem}h` : `Closes in ${days}d`;
}

function statusLabel(status: any): string {
  if (!status) return "Unknown";
  if ("Open" in status)      return "Open";
  if ("Awarded" in status)   return "Awarded";
  if ("Cancelled" in status) return "Cancelled";
  return "Unknown";
}

function proposalStatusLabel(status: any): string {
  if (!status) return "Unknown";
  if ("Accepted" in status) return "Accepted";
  if ("Rejected" in status) return "Rejected";
  if ("Pending" in status)  return "Pending";
  if ("Withdrawn" in status) return "Withdrawn";
  return "Unknown";
}

function agentIdText(agentId: any): string {
  if (typeof agentId === "string") return agentId;
  return agentId?.toText?.() ?? String(agentId);
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 4 }} aria-label="Star rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          data-testid={`star-${n}`}
          onClick={() => onChange(n)}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            fontSize: "1.4rem", color: n <= value ? "#C94C2E" : "#C8C3B8",
            padding: "0 2px", lineHeight: 1,
          }}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ proposal, onDone }: { proposal: any; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const INP: React.CSSProperties = {
    border: `1px solid ${S.rule}`, padding: "10px 12px", width: "100%",
    fontFamily: S.sans, fontSize: "0.9rem", resize: "vertical" as const,
    boxSizing: "border-box" as const, background: "white",
  };

  if (done) {
    return (
      <p data-testid="review-done" style={{ fontFamily: S.sans, fontSize: "0.85rem", color: "#2E7D32", marginTop: 12 }}>
        Review submitted — thank you.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    setSubmitting(true);
    try {
      const result = await addReview({
        agentId: agentIdText(proposal.agentId),
        rating,
        comment,
        transactionId: proposal.id,
      }) as any;
      if ("err" in result) {
        if ("DuplicateReview" in result.err) {
          toast.error("You've already reviewed this agent for this transaction.");
        } else if ("RateLimitExceeded" in result.err) {
          toast.error("Review limit reached for today. Try again tomorrow.");
        } else {
          toast.error(JSON.stringify(result.err));
        }
        return;
      }
      setDone(true);
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form data-testid="review-form" onSubmit={handleSubmit} style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${S.rule}` }}>
      <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, marginBottom: 8 }}>
        Rate {proposal.agentName}
      </p>
      <div style={{ marginBottom: 12 }}>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <textarea
          data-testid="review-comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience with this agent (optional)…"
          style={INP}
        />
      </div>
      <button
        type="submit"
        data-testid="review-submit"
        disabled={submitting}
        style={{ background: S.ink, border: `1px solid ${S.ink}`, color: S.paper, fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 20px", cursor: "pointer", minHeight: 40 }}
      >
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}

export default function MyBidsPage() {
  const { isMobile } = useBreakpoint();
  const [requests, setRequests] = useState<any[]>([]);
  const [proposals, setProposals] = useState<Record<string, any[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getMyBidRequests().then(setRequests).catch(console.error);
  }, []);

  async function loadProposals(requestId: string) {
    if (proposals[requestId]) { setExpanded(requestId); return; }
    const list = await getProposalsForRequest(requestId);
    setProposals(p => ({ ...p, [requestId]: list }));
    setExpanded(requestId);
  }

  async function handleAccept(proposalId: string, requestId: string) {
    setAccepting(proposalId);
    try {
      const result = await acceptProposal(proposalId) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }

      const req = requests.find((r: any) => r.id === requestId);
      const allProps = proposals[requestId] || [];
      for (const p of allProps) {
        if (p.agentEmail) {
          notifyProposalResult({
            agentEmail: p.agentEmail,
            agentName: p.agentName,
            city: req?.city || "",
            county: req?.county || "",
            won: p.id === proposalId,
          });
        }
      }

      toast.success("Proposal accepted! The agent will receive a platform fee invoice.");
      setRequests(await getMyBidRequests());
    } finally {
      setAccepting(null);
    }
  }

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: isMobile ? "12px 16px" : "16px 40px" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 900, color: S.rust, textDecoration: "none" }}>BidtoList</a>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "32px 16px" : "60px 40px" }}>
        <h1 style={{ fontFamily: S.serif, fontSize: "clamp(1.6rem, 5vw, 2rem)", fontWeight: 900, marginBottom: 8 }}>My Listing Requests</h1>
        <p style={{ fontFamily: S.sans, color: S.inkLight, marginBottom: 40 }}>Proposals are revealed after the bid deadline.</p>

        {requests.length === 0 && (
          <div style={{ border: `1px solid ${S.rule}`, padding: 32, textAlign: "center" }}>
            <p style={{ fontFamily: S.sans, color: S.inkLight }}>No listing requests yet. <a href="/post">Post your first listing.</a></p>
          </div>
        )}

        {requests.map((req: any) => {
          const deadline = Number(req.bidDeadline) / 1_000_000;
          const revealed = Date.now() >= deadline;
          const props = proposals[req.id] || [];
          const isOpen = expanded === req.id;

          return (
            <div key={req.id} style={{ border: `1px solid ${S.rule}`, marginBottom: 16 }}>
              <div style={{ padding: isMobile ? "16px" : "20px 24px", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: S.serif, fontSize: "1.05rem", fontWeight: 700, marginBottom: 4 }}>{req.address}</p>
                  <p style={{ fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", color: S.inkLight }}>
                    {req.county} · {formatCountdown(deadline)} · {statusLabel(req.status)}
                  </p>
                </div>
                {req.status && "Open" in req.status && (
                  <button onClick={() => isOpen ? setExpanded(null) : loadProposals(req.id)}
                    style={{ background: "transparent", border: `1px solid ${S.ink}`, color: S.ink, fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "12px 16px", cursor: "pointer", minHeight: 44, width: isMobile ? "100%" : "auto" }}>
                    {revealed ? (isOpen ? "Hide" : `View ${props.length || ""} Proposals`) : "Sealed"}
                  </button>
                )}
              </div>

              {isOpen && revealed && (
                <div style={{ borderTop: `1px solid ${S.rule}` }}>
                  {props.length === 0 && (
                    <p style={{ padding: isMobile ? "16px" : "20px 24px", fontFamily: S.sans, color: S.inkLight, fontSize: "0.9rem" }}>No proposals received.</p>
                  )}
                  {props.map((p: any) => (
                    <div key={p.id} style={{ padding: isMobile ? "16px" : "20px 24px", borderBottom: `1px solid ${S.rule}` }}>
                      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-start", gap: 8, marginBottom: 12 }}>
                        <div>
                          <p style={{ fontFamily: S.sans, fontWeight: 500, marginBottom: 2 }}>
                            {p.agentName} · {p.agentBrokerage}
                          </p>
                          <p style={{ fontFamily: S.mono, fontSize: "0.7rem", color: S.inkLight, letterSpacing: "0.06em" }}>
                            {(p.commissionBps / 100).toFixed(2)}% commission · Est. ${p.estimatedSalePrice?.toLocaleString()} · ~{p.estimatedDaysOnMarket} days
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          {p.status && "Accepted" in p.status && (
                            <a
                              href={`/agents/profile/${agentIdText(p.agentId)}`}
                              style={{ fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase", color: S.rust, textDecoration: "none" }}
                            >
                              View Profile
                            </a>
                          )}
                          <span style={{ fontFamily: S.mono, fontSize: "0.65rem", color: proposalStatusLabel(p.status) === "Accepted" ? S.rust : S.inkLight, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                            {proposalStatusLabel(p.status)}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontFamily: S.sans, fontSize: "0.85rem", color: S.inkLight, marginBottom: 12 }}>{p.cmaSummary}</p>
                      {p.status && "Pending" in p.status && (
                        <button onClick={() => handleAccept(p.id, req.id)} disabled={accepting === p.id}
                          style={{ background: S.rust, border: `1px solid ${S.rust}`, color: S.paper, fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "12px 20px", cursor: "pointer", minHeight: 44, width: isMobile ? "100%" : "auto" }}>
                          {accepting === p.id ? "Accepting..." : "Accept This Agent"}
                        </button>
                      )}
                      {p.status && "Accepted" in p.status && !reviewedIds.has(p.id) && (
                        <ReviewForm
                          proposal={p}
                          onDone={() => setReviewedIds(prev => new Set([...prev, p.id]))}
                        />
                      )}
                      {p.status && "Accepted" in p.status && reviewedIds.has(p.id) && (
                        <p data-testid="review-done" style={{ fontFamily: S.sans, fontSize: "0.85rem", color: "#2E7D32", marginTop: 12 }}>
                          Review submitted — thank you.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isOpen && !revealed && (
                <div style={{ borderTop: `1px solid ${S.rule}`, padding: isMobile ? "16px" : "20px 24px" }}>
                  <p style={{ fontFamily: S.sans, color: S.inkLight, fontSize: "0.9rem" }}>
                    Proposals are sealed until {new Date(deadline).toLocaleString()}. Check back then to compare agents.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
