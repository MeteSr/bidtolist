import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProposals } from "../services/listing";
import { getMyFees, FeeRecord } from "../services/fee";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useAuth } from "../contexts/AuthContext";

const C = {
  bg: "#F3F4F6", white: "#FFFFFF", text: "#111827", sub: "#6B7280",
  border: "#E5E7EB", primary: "#2563EB", green: "#16A34A",
  shadow: "0 1px 3px rgba(0,0,0,0.10)",
  sans: "'Inter','IBM Plex Sans',system-ui,sans-serif",
  mono: "'IBM Plex Mono',monospace",
};

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
  if (!status) return C.sub;
  if ("Accepted" in status)  return C.green;
  if ("Rejected" in status)  return C.sub;
  if ("Pending" in status)   return C.primary;
  if ("Withdrawn" in status) return C.sub;
  return C.sub;
}

function statusLabel(status: any): string {
  if (!status) return "Unknown";
  if ("Accepted" in status)  return "Accepted — Fee Due";
  if ("Rejected" in status)  return "Not Selected";
  if ("Pending" in status)   return "Pending";
  if ("Withdrawn" in status) return "Withdrawn";
  return "Unknown";
}

const HOMEGENTIC_URL = (import.meta as any).env?.VITE_HOMEGENTIC_URL || "https://homegentic.com";

function referralLink(principal: string): string {
  const short = principal.split("-")[0] ?? principal.slice(0, 8);
  return `${HOMEGENTIC_URL}/checkout?ref=AGENT_${short}`;
}

export default function AgentDashboardPage() {
  const { isMobile } = useBreakpoint();
  const { principal } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<any[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    getMyProposals().then(setProposals).catch(console.error);
    getMyFees().then(setFees).catch(console.error);
  }, []);

  function handleCopyLink() {
    if (!principal) return;
    navigator.clipboard.writeText(referralLink(principal)).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  }

  function handlePayNow(proposalId: string) {
    navigate(`/agents/listing-award/${proposalId}`);
  }

  const accepted = proposals.filter((p: any) => p.status && "Accepted" in p.status);
  const pending  = proposals.filter((p: any) => p.status && "Pending" in p.status);
  const closed   = proposals.filter((p: any) => p.status && ("Rejected" in p.status || "Withdrawn" in p.status));

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <nav style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
        padding: isMobile ? "14px 20px" : "0 48px",
        height: isMobile ? "auto" : 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <img src="/logo.png" alt="BidToList" style={{ height: 36, display: "block" }} />
        </a>
        <a href="/agents/browse" style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.sub, textDecoration: "none" }}>
          Browse Listings
        </a>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "28px 16px" : "48px 24px" }}>
        <h1 style={{ fontFamily: C.sans, fontSize: "clamp(1.4rem,4vw,1.75rem)", fontWeight: 700, color: C.text, marginBottom: 32 }}>
          My Proposals
        </h1>

        {proposals.length === 0 && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40, textAlign: "center", boxShadow: C.shadow }}>
            <p style={{ fontFamily: C.sans, color: C.sub }}>
              No proposals yet. <a href="/agents/browse" style={{ color: C.primary }}>Browse open listings.</a>
            </p>
          </div>
        )}

        {accepted.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <p style={{ fontFamily: C.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.green, marginBottom: 16 }}>
              Won — Platform Fee Due
            </p>
            {accepted.map((p: any) => {
              const fee = feeForProposal(fees, p.id);
              const feeStatus = feeStatusLabel(fee);
              return (
                <div key={p.id} style={{ background: C.white, border: "1px solid #BBF7D0", borderRadius: 12, padding: isMobile ? 16 : "20px 24px", marginBottom: 12, boxShadow: C.shadow }}>
                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 8, marginBottom: 8 }}>
                    <p style={{ fontFamily: C.sans, fontWeight: 600, color: C.text }}>Request {p.requestId}</p>
                    <span style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.green, letterSpacing: "0.08em", textTransform: "uppercase" }}>Accepted</span>
                  </div>
                  <p style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.sub, letterSpacing: "0.06em", marginBottom: 12 }}>
                    {(p.commissionBps / 100).toFixed(2)}% commission · Est. ${p.estimatedSalePrice?.toLocaleString()}
                  </p>

                  {(feeStatus === "owed" || feeStatus === "invoiced") && (
                    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: 12, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "12px 16px" }}>
                      <p style={{ fontFamily: C.mono, fontSize: "0.7rem", letterSpacing: "0.08em", color: C.text, flex: 1 }}>
                        PLATFORM FEE: $295.00
                        {feeStatus === "invoiced" ? " — Invoice sent" : " — Due now"}
                      </p>
                      <button
                        data-testid={`pay-now-${p.id}`}
                        onClick={() => handlePayNow(p.id)}
                        style={{ background: C.primary, border: "none", color: C.white, fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 600, padding: "10px 20px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        Pay Now — $395
                      </button>
                    </div>
                  )}

                  {feeStatus === "paid" && (
                    <>
                      <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
                        <p style={{ fontFamily: C.mono, fontSize: "0.7rem", letterSpacing: "0.08em", color: C.green }}>
                          PLATFORM FEE: $295.00 — PAID
                        </p>
                      </div>

                      {principal && (
                        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
                          <p style={{ fontFamily: C.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.sub, marginBottom: 6 }}>
                            Share HomeGentic with your clients
                          </p>
                          <p style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.sub, marginBottom: 12, lineHeight: 1.6 }}>
                            Your buyer clients get 1&nbsp;month free on HomeGentic — the property management app they'll need after they close. You get referral credit once they subscribe.
                          </p>
                          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8, alignItems: isMobile ? "stretch" : "center" }}>
                            <code style={{ flex: 1, fontFamily: C.mono, fontSize: "0.7rem", background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", wordBreak: "break-all", color: C.text }}>
                              {referralLink(principal)}
                            </code>
                            <button
                              data-testid="copy-referral-link"
                              onClick={handleCopyLink}
                              style={{ background: copiedLink ? C.green : C.primary, border: "none", color: C.white, fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 600, padding: "10px 20px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                            >
                              {copiedLink ? "Copied!" : "Copy Link"}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {feeStatus === "waived" && (
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px" }}>
                      <p style={{ fontFamily: C.mono, fontSize: "0.7rem", letterSpacing: "0.08em", color: C.sub }}>
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
            <p style={{ fontFamily: C.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.sub, marginBottom: 16 }}>Pending</p>
            {pending.map((p: any) => (
              <div key={p.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: isMobile ? 16 : "20px 24px", marginBottom: 12, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 8, boxShadow: C.shadow }}>
                <div>
                  <p style={{ fontFamily: C.sans, fontWeight: 600, color: C.text, marginBottom: 4 }}>Request {p.requestId}</p>
                  <p style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.sub, letterSpacing: "0.06em" }}>
                    {(p.commissionBps / 100).toFixed(2)}% · ${p.estimatedSalePrice?.toLocaleString()} · {p.estimatedDaysOnMarket}d DOM
                  </p>
                </div>
                <span style={{ fontFamily: C.mono, fontSize: "0.7rem", color: statusColor(p.status), letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {statusLabel(p.status)}
                </span>
              </div>
            ))}
          </section>
        )}

        {closed.length > 0 && (
          <section>
            <p style={{ fontFamily: C.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.sub, marginBottom: 16 }}>Closed</p>
            {closed.map((p: any) => (
              <div key={p.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: isMobile ? "12px 16px" : "16px 24px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.6 }}>
                <p style={{ fontFamily: C.sans, fontSize: "0.9rem", color: C.text }}>Request {p.requestId}</p>
                <span style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.sub, letterSpacing: "0.08em", textTransform: "uppercase" }}>{statusLabel(p.status)}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
