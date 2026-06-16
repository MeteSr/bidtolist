import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getAllAgentProfiles, verifyAgent } from "../services/agent";
import { getPendingVerificationRequests, verifyHomeowner } from "../services/listing";
import { getAllFees, markFeeInvoiced, markFeePaid, waiveFee, FeeRecord } from "../services/fee";
import { notifyAgentVerified } from "../services/email";
import { useBreakpoint } from "../hooks/useBreakpoint";

const C = {
  bg: "#F3F4F6", white: "#FFFFFF", text: "#111827", sub: "#6B7280",
  border: "#E5E7EB", primary: "#2563EB", green: "#16A34A",
  shadow: "0 1px 3px rgba(0,0,0,0.10)",
  sans: "'Inter','IBM Plex Sans',system-ui,sans-serif",
  mono: "'IBM Plex Mono',monospace",
};

const SEC_LBL = {
  fontFamily: C.mono, fontSize: "0.65rem", letterSpacing: "0.1em",
  textTransform: "uppercase" as const, color: C.sub,
};

function feeStatusBadge(status: FeeRecord["status"]): { label: string; color: string } {
  if ("Paid" in status)     return { label: "Paid",     color: C.green };
  if ("Waived" in status)   return { label: "Waived",   color: C.sub };
  if ("Invoiced" in status) return { label: "Invoiced", color: C.primary };
  return                           { label: "Owed",     color: "#DC2626" };
}

export default function AdminPage() {
  const { isMobile } = useBreakpoint();
  const [agents, setAgents] = useState<any[]>([]);
  const [pendingHomeowners, setPendingHomeowners] = useState<any[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [verifyingAgent, setVerifyingAgent] = useState<string | null>(null);
  const [verifyingHomeowner, setVerifyingHomeowner] = useState<string | null>(null);
  const [updatingFee, setUpdatingFee] = useState<string | null>(null);

  async function loadData() {
    const [allAgents, pending, allFees] = await Promise.all([
      getAllAgentProfiles().catch(() => []),
      getPendingVerificationRequests().catch(() => []),
      getAllFees().catch(() => []),
    ]);
    setAgents((allAgents as any[]).filter(a => !a.isVerified));
    setPendingHomeowners(pending as any[]);
    setFees(allFees as FeeRecord[]);
  }

  useEffect(() => { loadData(); }, []);

  async function handleVerifyAgent(agentId: string, agentEmail: string, agentName: string) {
    setVerifyingAgent(agentId);
    try {
      const result = await verifyAgent(agentId) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
      notifyAgentVerified({ agentEmail, agentName });
      toast.success("Agent verified.");
      await loadData();
    } finally {
      setVerifyingAgent(null);
    }
  }

  async function handleVerifyHomeowner(principal: string) {
    setVerifyingHomeowner(principal);
    try {
      const result = await verifyHomeowner(principal) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
      toast.success("Homeowner verified.");
      await loadData();
    } finally {
      setVerifyingHomeowner(null);
    }
  }

  async function handleFeeAction(feeId: string, action: "invoiced" | "paid" | "waived") {
    setUpdatingFee(feeId);
    try {
      const fn = action === "invoiced" ? markFeeInvoiced
               : action === "paid"     ? markFeePaid
               :                        waiveFee;
      const result = await fn(feeId) as any;
      if (result && "err" in result) { toast.error(JSON.stringify(result.err)); return; }
      toast.success(`Fee marked ${action}.`);
      await loadData();
    } finally {
      setUpdatingFee(null);
    }
  }

  const totalOwedCents   = fees.filter(f => "Owed" in f.status || "Invoiced" in f.status).reduce((s, f) => s + Number(f.amountCents), 0);
  const totalPaidCents   = fees.filter(f => "Paid" in f.status).reduce((s, f) => s + Number(f.amountCents), 0);
  const totalWaivedCents = fees.filter(f => "Waived" in f.status).reduce((s, f) => s + Number(f.amountCents), 0);

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
        <span style={{ fontFamily: C.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.sub }}>Admin</span>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "28px 16px" : "48px 24px" }}>
        <h1 style={{ fontFamily: C.sans, fontSize: "clamp(1.4rem,4vw,1.75rem)", fontWeight: 700, color: C.text, marginBottom: 40 }}>
          Admin Dashboard
        </h1>

        {/* Fee Revenue */}
        <section style={{ marginBottom: 48 }}>
          <p style={{ ...SEC_LBL, display: "block", marginBottom: 16 }}>Platform Fee Revenue</p>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Outstanding", cents: totalOwedCents, testId: "fee-stat-owed" },
              { label: "Collected MTD", cents: totalPaidCents, testId: "fee-stat-paid" },
              { label: "Waived", cents: totalWaivedCents, testId: "fee-stat-waived" },
            ].map(({ label, cents, testId }) => (
              <div key={label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px", boxShadow: C.shadow }}>
                <p style={{ ...SEC_LBL, display: "block", marginBottom: 8 }}>{label}</p>
                <p data-testid={testId} style={{ fontFamily: C.sans, fontSize: "1.4rem", fontWeight: 700, color: C.text }}>
                  ${(cents / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {fees.length === 0 ? (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: "center", boxShadow: C.shadow }}>
              <p style={{ fontFamily: C.sans, color: C.sub, fontSize: "0.9rem" }}>No fee records yet.</p>
            </div>
          ) : (
            fees.map(fee => {
              const { label, color } = feeStatusBadge(fee.status);
              const isOwed     = "Owed" in fee.status;
              const isInvoiced = "Invoiced" in fee.status;
              const isUpdating = updatingFee === fee.id;

              return (
                <div key={fee.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: isMobile ? 16 : "16px 20px", marginBottom: 8, boxShadow: C.shadow }}>
                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 12 }}>
                    <div>
                      <p style={{ fontFamily: C.sans, fontSize: "0.9rem", fontWeight: 500, color: C.text, marginBottom: 2 }}>
                        ${(Number(fee.amountCents) / 100).toFixed(2)} — {fee.requestId} / {fee.proposalId}
                      </p>
                      <p style={{ fontFamily: C.mono, fontSize: "0.65rem", color: C.sub, letterSpacing: "0.06em" }}>
                        {new Date(Number(fee.createdAt) / 1_000_000).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span data-testid={`fee-status-${fee.id}`} style={{ fontFamily: C.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color, border: `1px solid ${color}`, borderRadius: 4, padding: "3px 8px" }}>
                        {label}
                      </span>
                      {isOwed && (
                        <button
                          data-testid={`fee-invoice-${fee.id}`}
                          onClick={() => handleFeeAction(fee.id, "invoiced")}
                          disabled={isUpdating}
                          style={{ background: C.white, border: `1px solid ${C.border}`, color: C.text, fontFamily: C.sans, fontSize: "0.8rem", padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}
                        >
                          Mark Invoiced
                        </button>
                      )}
                      {(isOwed || isInvoiced) && (
                        <button
                          data-testid={`fee-paid-${fee.id}`}
                          onClick={() => handleFeeAction(fee.id, "paid")}
                          disabled={isUpdating}
                          style={{ background: C.green, border: "none", color: C.white, fontFamily: C.sans, fontSize: "0.8rem", fontWeight: 600, padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}
                        >
                          Mark Paid
                        </button>
                      )}
                      {(isOwed || isInvoiced) && (
                        <button
                          data-testid={`fee-waive-${fee.id}`}
                          onClick={() => handleFeeAction(fee.id, "waived")}
                          disabled={isUpdating}
                          style={{ background: C.white, border: `1px solid ${C.border}`, color: C.sub, fontFamily: C.sans, fontSize: "0.8rem", padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}
                        >
                          Waive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Agent Verifications */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <p style={SEC_LBL}>Pending Agent Verifications</p>
            <a
              href="https://www.myfloridalicense.com/wl11.asp"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: C.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: C.primary, textDecoration: "none" }}
            >
              DBPR Lookup ↗
            </a>
          </div>

          {agents.length === 0 ? (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: "center", boxShadow: C.shadow }}>
              <p style={{ fontFamily: C.sans, color: C.sub, fontSize: "0.9rem" }}>No pending agent applications.</p>
            </div>
          ) : (
            agents.map(agent => (
              <div key={agent.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: isMobile ? 16 : "16px 20px", marginBottom: 12, boxShadow: C.shadow }}>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: C.sans, fontWeight: 600, color: C.text, marginBottom: 4 }}>{agent.name}</p>
                    <p style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.sub, letterSpacing: "0.06em", marginBottom: 2 }}>
                      {agent.brokerage} · License: {agent.licenseNumber}
                    </p>
                    <p style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.sub, letterSpacing: "0.06em" }}>
                      {agent.county} County · {agent.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleVerifyAgent(String(agent.id), agent.email, agent.name)}
                    disabled={verifyingAgent === String(agent.id)}
                    style={{ background: C.primary, border: "none", color: C.white, fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 600, padding: "10px 20px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap", width: isMobile ? "100%" : "auto" }}
                  >
                    {verifyingAgent === String(agent.id) ? "Verifying…" : "Verify Agent"}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Homeowner Verifications */}
        <section>
          <p style={{ ...SEC_LBL, display: "block", marginBottom: 16 }}>Pending Homeowner Verifications</p>

          {pendingHomeowners.length === 0 ? (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: "center", boxShadow: C.shadow }}>
              <p style={{ fontFamily: C.sans, color: C.sub, fontSize: "0.9rem" }}>No pending homeowner verification requests.</p>
            </div>
          ) : (
            pendingHomeowners.map(req => (
              <div key={req.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: isMobile ? 16 : "16px 20px", marginBottom: 12, boxShadow: C.shadow }}>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: C.sans, fontWeight: 600, color: C.text, marginBottom: 4 }}>{req.address}</p>
                    <p style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.sub, letterSpacing: "0.06em", marginBottom: 2 }}>
                      Parcel: {req.parcelNumber}
                    </p>
                    <p style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.sub, letterSpacing: "0.06em" }}>
                      {req.contactEmail}
                    </p>
                    <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                      <a href="https://vcpa.vcgov.org" target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: C.mono, fontSize: "0.65rem", letterSpacing: "0.06em", textTransform: "uppercase", color: C.primary, textDecoration: "none" }}>
                        Volusia VCPA ↗
                      </a>
                      <a href="https://flaglerpa.com" target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: C.mono, fontSize: "0.65rem", letterSpacing: "0.06em", textTransform: "uppercase", color: C.primary, textDecoration: "none" }}>
                        Flagler PA ↗
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleVerifyHomeowner(String(req.principal))}
                    disabled={verifyingHomeowner === String(req.principal)}
                    style={{ background: C.primary, border: "none", color: C.white, fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 600, padding: "10px 20px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap", width: isMobile ? "100%" : "auto" }}
                  >
                    {verifyingHomeowner === String(req.principal) ? "Verifying…" : "Verify Homeowner"}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
