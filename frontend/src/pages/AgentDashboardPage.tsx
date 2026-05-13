import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getMyProposals } from "../services/listing";
import { getMyFees, FeeRecord } from "../services/fee";
import { useBreakpoint } from "../hooks/useBreakpoint";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

const STRIPE_SERVER = (import.meta as any).env?.VITE_STRIPE_SERVER_URL || "http://localhost:3003";

function feeForProposal(fees: FeeRecord[], proposalId: string): FeeRecord | undefined {
  return fees.find(f => f.proposalId === proposalId);
}

function feeStatusLabel(fee: FeeRecord | undefined): string {
  if (!fee) return "owed";
  if ("Paid" in fee.status)     return "paid";
  if ("Waived" in fee.status)   return "waived";
  if ("Invoiced" in fee.status) return "invoiced";
  return "owed";
}

function statusColor(status: any): string {
  if (!status) return S.inkLight;
  if ("Accepted" in status)  return "#2E7D32";
  if ("Rejected" in status)  return S.inkLight;
  if ("Pending" in status)   return S.rust;
  if ("Withdrawn" in status) return S.inkLight;
  return S.inkLight;
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
  const { isMobile } = useBreakpoint();
  const [proposals, setProposals] = useState<any[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [payingFee, setPayingFee] = useState<string | null>(null);

  useEffect(() => {
    getMyProposals().then(setProposals).catch(console.error);
    getMyFees().then(setFees).catch(console.error);
  }, []);

  async function handlePayNow(proposalId: string, feeId?: string) {
    const key = feeId ?? proposalId;
    setPayingFee(key);
    try {
      const res = await fetch(`${STRIPE_SERVER}/api/stripe/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeId: feeId ?? proposalId, proposalId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Stripe is not configured. Contact billing@bidtolist.com to pay your fee.");
      }
    } catch {
      toast.error("Could not reach payment server. Try again or contact support.");
    } finally {
      setPayingFee(null);
    }
  }

  const accepted  = proposals.filter((p: any) => p.status && "Accepted" in p.status);
  const pending   = proposals.filter((p: any) => p.status && "Pending" in p.status);
  const closed    = proposals.filter((p: any) => p.status && ("Rejected" in p.status || "Withdrawn" in p.status));

  const cardPad = isMobile ? "16px" : "20px 24px";

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: isMobile ? "12px 16px" : "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 900, color: S.rust, textDecoration: "none" }}>BidtoList</a>
        <a href="/agents/browse" style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink, textDecoration: "none" }}>Browse Listings</a>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "32px 16px" : "60px 40px" }}>
        <h1 style={{ fontFamily: S.serif, fontSize: "clamp(1.6rem, 5vw, 2rem)", fontWeight: 900, marginBottom: 40 }}>My Proposals</h1>

        {proposals.length === 0 && (
          <div style={{ border: `1px solid ${S.rule}`, padding: 40, textAlign: "center" }}>
            <p style={{ fontFamily: S.sans, color: S.inkLight }}>No proposals yet. <a href="/agents/browse">Browse open listings.</a></p>
          </div>
        )}

        {accepted.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#2E7D32", marginBottom: 16 }}>Won — Platform Fee Due</p>
            {accepted.map((p: any) => {
              const fee = feeForProposal(fees, p.id);
              const feeStatus = feeStatusLabel(fee);
              return (
                <div key={p.id} style={{ border: "1px solid #2E7D32", padding: cardPad, marginBottom: 12 }}>
                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 8, marginBottom: 8 }}>
                    <p style={{ fontFamily: S.sans, fontWeight: 500 }}>Request {p.requestId}</p>
                    <span style={{ fontFamily: S.mono, fontSize: "0.65rem", color: "#2E7D32", letterSpacing: "0.08em", textTransform: "uppercase" }}>Accepted</span>
                  </div>
                  <p style={{ fontFamily: S.mono, fontSize: "0.7rem", color: S.inkLight, letterSpacing: "0.06em", marginBottom: 12 }}>
                    {(p.commissionBps / 100).toFixed(2)}% commission · Est. ${p.estimatedSalePrice?.toLocaleString()}
                  </p>

                  {(feeStatus === "owed" || feeStatus === "invoiced") && (
                    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: 12, background: "#FFF8E1", border: "1px solid #FFE082", padding: "12px 16px" }}>
                      <p style={{ fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", color: S.ink, flex: 1 }}>
                        PLATFORM FEE: $295.00
                        {feeStatus === "invoiced" ? " — Invoice sent" : " — Due now"}
                      </p>
                      <button
                        data-testid={`pay-now-${p.id}`}
                        onClick={() => handlePayNow(p.id, fee?.id)}
                        disabled={payingFee === (fee?.id ?? p.id)}
                        style={{ background: S.rust, border: `1px solid ${S.rust}`, color: S.paper, fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 20px", cursor: "pointer", minHeight: 40, whiteSpace: "nowrap" }}
                      >
                        {payingFee === (fee?.id ?? p.id) ? "Redirecting…" : "Pay Now — $295"}
                      </button>
                    </div>
                  )}

                  {feeStatus === "paid" && (
                    <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", padding: "12px 16px" }}>
                      <p style={{ fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", color: "#2E7D32" }}>
                        PLATFORM FEE: $295.00 — PAID
                      </p>
                    </div>
                  )}

                  {feeStatus === "waived" && (
                    <div style={{ background: S.paper, border: `1px solid ${S.rule}`, padding: "12px 16px" }}>
                      <p style={{ fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", color: S.inkLight }}>
                        PLATFORM FEE: WAIVED
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {pending.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: S.inkLight, marginBottom: 16 }}>Pending</p>
            {pending.map((p: any) => (
              <div key={p.id} style={{ border: `1px solid ${S.rule}`, padding: cardPad, marginBottom: 12, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 8 }}>
                <div>
                  <p style={{ fontFamily: S.sans, fontWeight: 500, marginBottom: 4 }}>Request {p.requestId}</p>
                  <p style={{ fontFamily: S.mono, fontSize: "0.7rem", color: S.inkLight, letterSpacing: "0.06em" }}>
                    {(p.commissionBps / 100).toFixed(2)}% · ${p.estimatedSalePrice?.toLocaleString()} · {p.estimatedDaysOnMarket}d DOM
                  </p>
                </div>
                <span style={{ fontFamily: S.mono, fontSize: "0.65rem", color: statusColor(p.status), letterSpacing: "0.08em", textTransform: "uppercase" }}>
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
              <div key={p.id} style={{ border: `1px solid ${S.rule}`, padding: isMobile ? "12px 16px" : "16px 24px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.6 }}>
                <p style={{ fontFamily: S.sans, fontSize: "0.9rem" }}>Request {p.requestId}</p>
                <span style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight, letterSpacing: "0.08em", textTransform: "uppercase" }}>{statusLabel(p.status)}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
