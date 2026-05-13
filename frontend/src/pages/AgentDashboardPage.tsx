import { useEffect, useState } from "react";
import { getMyProposals } from "../services/listing";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

function statusColor(status: any): string {
  if (!status) return "#7A7268";
  if ("Accepted" in status)  return "#2E7D32";
  if ("Rejected" in status)  return "#7A7268";
  if ("Pending" in status)   return "#C94C2E";
  if ("Withdrawn" in status) return "#7A7268";
  return "#7A7268";
}

function statusLabel(status: any): string {
  if (!status) return "Unknown";
  if ("Accepted" in status)  return "Accepted — Fee Due";
  if ("Rejected" in status)  return "Not Selected";
  if ("Pending" in status)   return "Pending";
  if ("Withdrawn" in status) return "Withdrawn";
  return "Unknown";
}

export default function AgentDashboardPage() {
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    getMyProposals().then(setProposals).catch(console.error);
  }, []);

  const accepted  = proposals.filter((p: any) => p.status && "Accepted" in p.status);
  const pending   = proposals.filter((p: any) => p.status && "Pending" in p.status);
  const closed    = proposals.filter((p: any) => p.status && ("Rejected" in p.status || "Withdrawn" in p.status));

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 900, color: S.rust, textDecoration: "none" }}>BidtoList</a>
        <a href="/agents/browse" style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink, textDecoration: "none" }}>Browse Listings</a>
      </nav>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 40px" }}>
        <h1 style={{ fontFamily: S.serif, fontSize: "2rem", fontWeight: 900, marginBottom: 40 }}>My Proposals</h1>

        {proposals.length === 0 && (
          <div style={{ border: `1px solid ${S.rule}`, padding: 40, textAlign: "center" }}>
            <p style={{ fontFamily: S.sans, color: S.inkLight }}>No proposals yet. <a href="/agents/browse">Browse open listings.</a></p>
          </div>
        )}

        {accepted.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#2E7D32", marginBottom: 16 }}>Won — Platform Fee Due</p>
            {accepted.map((p: any) => (
              <div key={p.id} style={{ border: `1px solid #2E7D32`, padding: "20px 24px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <p style={{ fontFamily: S.sans, fontWeight: 500 }}>Request {p.requestId}</p>
                  <span style={{ fontFamily: S.mono, fontSize: "0.6rem", color: "#2E7D32", letterSpacing: "0.08em", textTransform: "uppercase" }}>Accepted</span>
                </div>
                <p style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight, letterSpacing: "0.06em", marginBottom: 12 }}>
                  {(p.commissionBps / 100).toFixed(2)}% commission · Est. ${p.estimatedSalePrice?.toLocaleString()}
                </p>
                <div style={{ background: "#FFF8E1", border: "1px solid #FFE082", padding: "12px 16px" }}>
                  <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em", color: S.ink }}>
                    PLATFORM FEE: $295.00 — A payment link will be emailed to you shortly.
                  </p>
                </div>
              </div>
            ))}
          </section>
        )}

        {pending.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: S.inkLight, marginBottom: 16 }}>Pending</p>
            {pending.map((p: any) => (
              <div key={p.id} style={{ border: `1px solid ${S.rule}`, padding: "20px 24px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontFamily: S.sans, fontWeight: 500, marginBottom: 4 }}>Request {p.requestId}</p>
                  <p style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight, letterSpacing: "0.06em" }}>
                    {(p.commissionBps / 100).toFixed(2)}% · ${p.estimatedSalePrice?.toLocaleString()} · {p.estimatedDaysOnMarket}d DOM
                  </p>
                </div>
                <span style={{ fontFamily: S.mono, fontSize: "0.6rem", color: statusColor(p.status), letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {statusLabel(p.status)}
                </span>
              </div>
            ))}
          </section>
        )}

        {closed.length > 0 && (
          <section>
            <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: S.inkLight, marginBottom: 16 }}>Closed</p>
            {closed.map((p: any) => (
              <div key={p.id} style={{ border: `1px solid ${S.rule}`, padding: "16px 24px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.6 }}>
                <p style={{ fontFamily: S.sans, fontSize: "0.9rem" }}>Request {p.requestId}</p>
                <span style={{ fontFamily: S.mono, fontSize: "0.6rem", color: S.inkLight, letterSpacing: "0.08em", textTransform: "uppercase" }}>{statusLabel(p.status)}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
