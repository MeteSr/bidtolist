import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getAllAgentProfiles, verifyAgent } from "../services/agent";
import { getPendingVerificationRequests, verifyHomeowner } from "../services/listing";
import { notifyAgentVerified } from "../services/email";
import { useBreakpoint } from "../hooks/useBreakpoint";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

export default function AdminPage() {
  const { isMobile } = useBreakpoint();
  const [agents, setAgents] = useState<any[]>([]);
  const [pendingHomeowners, setPendingHomeowners] = useState<any[]>([]);
  const [verifyingAgent, setVerifyingAgent] = useState<string | null>(null);
  const [verifyingHomeowner, setVerifyingHomeowner] = useState<string | null>(null);

  async function loadData() {
    const [allAgents, pending] = await Promise.all([
      getAllAgentProfiles().catch(() => []),
      getPendingVerificationRequests().catch(() => []),
    ]);
    setAgents((allAgents as any[]).filter(a => !a.isVerified));
    setPendingHomeowners(pending as any[]);
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

  const navPad = isMobile ? "12px 16px" : "16px 40px";
  const secPad = isMobile ? "32px 16px" : "60px 40px";
  const cardPad = isMobile ? "16px" : "20px 24px";

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: navPad, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 900, color: S.rust, textDecoration: "none" }}>BidtoList</a>
        <span style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.inkLight }}>Admin</span>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: secPad }}>
        <h1 style={{ fontFamily: S.serif, fontSize: "clamp(1.6rem, 5vw, 2rem)", fontWeight: 900, marginBottom: 48 }}>
          Admin Dashboard
        </h1>

        {/* Agent Verifications */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: S.inkLight }}>
              Pending Agent Verifications
            </p>
            <a
              href="https://www.myfloridalicense.com/wl11.asp"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.rust, textDecoration: "none" }}
            >
              DBPR Lookup ↗
            </a>
          </div>

          {agents.length === 0 ? (
            <div style={{ border: `1px solid ${S.rule}`, padding: 24, textAlign: "center" }}>
              <p style={{ fontFamily: S.sans, color: S.inkLight, fontSize: "0.9rem" }}>No pending agent applications.</p>
            </div>
          ) : (
            agents.map(agent => (
              <div key={agent.id} style={{ border: `1px solid ${S.rule}`, padding: cardPad, marginBottom: 12 }}>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: S.sans, fontWeight: 500, marginBottom: 4 }}>{agent.name}</p>
                    <p style={{ fontFamily: S.mono, fontSize: "0.7rem", color: S.inkLight, letterSpacing: "0.06em", marginBottom: 2 }}>
                      {agent.brokerage} · License: {agent.licenseNumber}
                    </p>
                    <p style={{ fontFamily: S.mono, fontSize: "0.7rem", color: S.inkLight, letterSpacing: "0.06em" }}>
                      {agent.county} County · {agent.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleVerifyAgent(String(agent.id), agent.email, agent.name)}
                    disabled={verifyingAgent === String(agent.id)}
                    style={{ background: S.ink, border: `1px solid ${S.ink}`, color: S.paper, fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "12px 20px", cursor: "pointer", minHeight: 44, whiteSpace: "nowrap", width: isMobile ? "100%" : "auto" }}
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
          <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: S.inkLight, marginBottom: 16 }}>
            Pending Homeowner Verifications
          </p>

          {pendingHomeowners.length === 0 ? (
            <div style={{ border: `1px solid ${S.rule}`, padding: 24, textAlign: "center" }}>
              <p style={{ fontFamily: S.sans, color: S.inkLight, fontSize: "0.9rem" }}>No pending homeowner verification requests.</p>
            </div>
          ) : (
            pendingHomeowners.map(req => (
              <div key={req.id} style={{ border: `1px solid ${S.rule}`, padding: cardPad, marginBottom: 12 }}>
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: S.sans, fontWeight: 500, marginBottom: 4 }}>{req.address}</p>
                    <p style={{ fontFamily: S.mono, fontSize: "0.7rem", color: S.inkLight, letterSpacing: "0.06em", marginBottom: 2 }}>
                      Parcel: {req.parcelNumber}
                    </p>
                    <p style={{ fontFamily: S.mono, fontSize: "0.7rem", color: S.inkLight, letterSpacing: "0.06em" }}>
                      {req.contactEmail}
                    </p>
                    <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
                      <a href="https://vcpa.vcgov.org" target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.06em", textTransform: "uppercase", color: S.rust, textDecoration: "none" }}>
                        Volusia VCPA ↗
                      </a>
                      <a href="https://flaglerpa.com" target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.06em", textTransform: "uppercase", color: S.rust, textDecoration: "none" }}>
                        Flagler PA ↗
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleVerifyHomeowner(String(req.principal))}
                    disabled={verifyingHomeowner === String(req.principal)}
                    style={{ background: S.ink, border: `1px solid ${S.ink}`, color: S.paper, fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "12px 20px", cursor: "pointer", minHeight: 44, whiteSpace: "nowrap", width: isMobile ? "100%" : "auto" }}
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
