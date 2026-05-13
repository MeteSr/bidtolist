import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOpenBidRequests, type BidRequestSummary } from "../services/listing";
import { getMyAgentProfile } from "../services/agent";
import { useAuth } from "../contexts/AuthContext";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

const MAX_PROPOSALS = 10;

export default function BrowseListingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<BidRequestSummary[]>([]);
  const [county, setCounty] = useState<"All" | "Volusia" | "Flagler">("All");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    getOpenBidRequests().then(setRequests).catch(console.error);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { setIsVerified(false); return; }
    getMyAgentProfile()
      .then((profile: any) => setIsVerified(profile?.isVerified === true))
      .catch(() => setIsVerified(false));
  }, [isAuthenticated]);

  const filtered = county === "All" ? requests : requests.filter(r => r.county === county);

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 900, color: S.rust, textDecoration: "none" }}>BidtoList</a>
        <a href="/agents/dashboard" style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.inkLight, textDecoration: "none" }}>My Proposals</a>
      </nav>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
          <div>
            <h1 style={{ fontFamily: S.serif, fontSize: "2rem", fontWeight: 900, marginBottom: 4 }}>Open Listings</h1>
            <p style={{ fontFamily: S.sans, color: S.inkLight }}>Submit a blind proposal — homeowners see all bids at once after the deadline.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["All", "Volusia", "Flagler"] as const).map(c => (
              <button key={c} onClick={() => setCounty(c)}
                style={{ background: county === c ? S.ink : "transparent", border: `1px solid ${S.ink}`, color: county === c ? S.paper : S.ink, fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 14px", cursor: "pointer" }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {!isVerified && isAuthenticated && (
          <div style={{ border: `1px solid ${S.rule}`, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.inkLight }}>
              Verification pending
            </span>
            <span style={{ fontFamily: S.sans, fontSize: "0.85rem", color: S.inkLight }}>
              — your account is under review. You can browse but cannot submit proposals until verified.
            </span>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ border: `1px solid ${S.rule}`, padding: 40, textAlign: "center" }}>
            <p style={{ fontFamily: S.sans, color: S.inkLight }}>No open listings right now. Check back soon.</p>
          </div>
        )}

        {filtered.map(req => {
          const deadline = Number(req.bidDeadline) / 1_000_000;
          const daysLeft = Math.max(0, Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24)));
          const count = Number(req.proposalCount);
          return (
            <div key={req.id} style={{ border: `1px solid ${S.rule}`, padding: "24px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontFamily: S.serif, fontSize: "1.05rem", fontWeight: 700, marginBottom: 4 }}>
                  {req.city}, {req.county} County · {req.zipCode}
                </p>
                <p style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight, letterSpacing: "0.06em" }}>
                  {req.desiredSalePrice?.length > 0 ? `Target: $${(Number(req.desiredSalePrice[0]) / 100).toLocaleString()} · ` : ""}
                  Deadline: {new Date(deadline).toLocaleDateString()} ({daysLeft}d left) · {count} / {MAX_PROPOSALS} bids
                </p>
                {req.notes && (
                  <p style={{ fontFamily: S.sans, fontSize: "0.85rem", color: S.inkLight, marginTop: 8, maxWidth: 480 }}>
                    {req.notes.slice(0, 120)}{req.notes.length > 120 ? "…" : ""}
                  </p>
                )}
              </div>
              <button
                onClick={() => isVerified && navigate(`/agents/propose/${req.id}`)}
                disabled={!isVerified}
                style={{
                  background: isVerified ? S.rust : S.rule,
                  border: `1px solid ${isVerified ? S.rust : S.rule}`,
                  color: isVerified ? S.paper : S.inkLight,
                  fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em",
                  textTransform: "uppercase", padding: "10px 20px",
                  cursor: isVerified ? "pointer" : "not-allowed", whiteSpace: "nowrap",
                }}>
                Submit Proposal
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
