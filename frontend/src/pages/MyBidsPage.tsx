import { useEffect, useState } from "react";
import { getMyBidRequests, getProposalsForRequest, acceptProposal } from "../services/listing";
import toast from "react-hot-toast";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

function statusLabel(status: any): string {
  if (status?.Open)      return "Open";
  if (status?.Awarded)   return "Awarded";
  if (status?.Cancelled) return "Cancelled";
  return "Unknown";
}

function proposalStatusLabel(status: any): string {
  if (status?.Accepted) return "Accepted";
  if (status?.Rejected) return "Rejected";
  if (status?.Pending)  return "Pending";
  if (status?.Withdrawn) return "Withdrawn";
  return "Unknown";
}

export default function MyBidsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [proposals, setProposals] = useState<Record<string, any[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    getMyBidRequests().then(setRequests).catch(console.error);
  }, []);

  async function loadProposals(requestId: string) {
    if (proposals[requestId]) { setExpanded(requestId); return; }
    const list = await getProposalsForRequest(requestId);
    setProposals(p => ({ ...p, [requestId]: list }));
    setExpanded(requestId);
  }

  async function handleAccept(proposalId: string) {
    setAccepting(proposalId);
    try {
      const result = await acceptProposal(proposalId) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
      toast.success("Proposal accepted! The agent will receive a platform fee invoice.");
      setRequests(await getMyBidRequests());
    } finally {
      setAccepting(null);
    }
  }

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: "16px 40px" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 900, color: S.rust, textDecoration: "none" }}>BidtoList</a>
      </nav>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 40px" }}>
        <h1 style={{ fontFamily: S.serif, fontSize: "2rem", fontWeight: 900, marginBottom: 8 }}>My Listing Requests</h1>
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
              <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontFamily: S.serif, fontSize: "1.05rem", fontWeight: 700, marginBottom: 4 }}>{req.address}</p>
                  <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em", color: S.inkLight }}>
                    {req.county} · Deadline: {new Date(deadline).toLocaleDateString()} · {statusLabel(req.status)}
                  </p>
                </div>
                {req.status?.Open && (
                  <button onClick={() => isOpen ? setExpanded(null) : loadProposals(req.id)}
                    style={{ background: "transparent", border: `1px solid ${S.ink}`, color: S.ink, fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 16px", cursor: "pointer" }}>
                    {revealed ? (isOpen ? "Hide" : `View ${props.length || ""} Proposals`) : "Sealed"}
                  </button>
                )}
              </div>

              {isOpen && revealed && (
                <div style={{ borderTop: `1px solid ${S.rule}` }}>
                  {props.length === 0 && (
                    <p style={{ padding: "20px 24px", fontFamily: S.sans, color: S.inkLight, fontSize: "0.9rem" }}>No proposals received.</p>
                  )}
                  {props.map((p: any) => (
                    <div key={p.id} style={{ padding: "20px 24px", borderBottom: `1px solid ${S.rule}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <p style={{ fontFamily: S.sans, fontWeight: 500, marginBottom: 2 }}>{p.agentName} · {p.agentBrokerage}</p>
                          <p style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight, letterSpacing: "0.06em" }}>
                            {(p.commissionBps / 100).toFixed(2)}% commission · Est. ${p.estimatedSalePrice?.toLocaleString()} · ~{p.estimatedDaysOnMarket} days
                          </p>
                        </div>
                        <span style={{ fontFamily: S.mono, fontSize: "0.6rem", color: proposalStatusLabel(p.status) === "Accepted" ? S.rust : S.inkLight, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          {proposalStatusLabel(p.status)}
                        </span>
                      </div>
                      <p style={{ fontFamily: S.sans, fontSize: "0.85rem", color: S.inkLight, marginBottom: 12 }}>{p.cmaSummary}</p>
                      {p.status?.Pending && (
                        <button onClick={() => handleAccept(p.id)} disabled={accepting === p.id}
                          style={{ background: S.rust, border: `1px solid ${S.rust}`, color: S.paper, fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 20px", cursor: "pointer" }}>
                          {accepting === p.id ? "Accepting..." : "Accept This Agent"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isOpen && !revealed && (
                <div style={{ borderTop: `1px solid ${S.rule}`, padding: "20px 24px" }}>
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
