import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { submitProposal, getBidRequest } from "../services/listing";
import { getMyAgentProfile } from "../services/agent";
import { notifyNewProposal } from "../services/email";
import { useBreakpoint } from "../hooks/useBreakpoint";

const C = {
  bg: "#F3F4F6", white: "#FFFFFF", text: "#111827", sub: "#6B7280",
  border: "#E5E7EB", primary: "#2563EB", green: "#16A34A",
  shadow: "0 1px 3px rgba(0,0,0,0.10)",
  sans: "'Inter','IBM Plex Sans',system-ui,sans-serif",
  mono: "'IBM Plex Mono',monospace",
};

const SERVICES = ["Professional Photography", "Aerial/Drone Photography", "Virtual Tour", "Staging Consultation", "Open Houses", "MLS Listing", "Zillow Enhanced", "Social Media Campaign", "Print Advertising", "Coming Soon Campaign"];

const LBL: React.CSSProperties = {
  fontFamily: C.mono, fontSize: "0.7rem", letterSpacing: "0.08em",
  textTransform: "uppercase", color: C.sub, display: "block", marginBottom: 6,
};
const INP: React.CSSProperties = {
  border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px",
  width: "100%", fontFamily: C.sans, fontSize: "0.95rem",
  background: C.white, color: C.text, boxSizing: "border-box",
};

export default function ProposalFormPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [saving, setSaving] = useState(false);
  const [verifiedState, setVerifiedState] = useState<"loading" | "verified" | "blocked">("loading");
  const [agentEmail, setAgentEmail] = useState("");
  const [_bidRequest, setBidRequest] = useState<any>(null);
  const [form, setForm] = useState({
    agentName: "", agentBrokerage: "", commissionPct: "2.5",
    cmaSummary: "", marketingPlan: "", estimatedDaysOnMarket: "30",
    estimatedSalePrice: "", coverLetter: "", validUntilDays: "30",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    getMyAgentProfile()
      .then(profile => {
        setVerifiedState(profile?.isVerified ? "verified" : "blocked");
        if (profile?.email) setAgentEmail(profile.email);
      })
      .catch(() => setVerifiedState("blocked"));
    if (requestId) {
      getBidRequest(requestId)
        .then((res: any) => { if (res?.ok) setBidRequest(res.ok); })
        .catch(() => {});
    }
  }, [requestId]);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function toggleService(s: string) {
    setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requestId) return;
    setSaving(true);
    try {
      const commissionBps = Math.round(parseFloat(form.commissionPct) * 100);
      const validUntil = Date.now() + parseInt(form.validUntilDays) * 24 * 60 * 60 * 1000;
      const result = await submitProposal({
        requestId, agentName: form.agentName, agentEmail,
        agentBrokerage: form.agentBrokerage, commissionBps,
        cmaSummary: form.cmaSummary, marketingPlan: form.marketingPlan,
        estimatedDaysOnMarket: parseInt(form.estimatedDaysOnMarket),
        estimatedSalePrice: parseInt(form.estimatedSalePrice),
        includedServices: selectedServices, validUntil, coverLetter: form.coverLetter,
      }) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
      notifyNewProposal(requestId);
      toast.success("Proposal submitted! The homeowner will see it after the deadline.");
      navigate("/agents/dashboard");
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, key: string, type = "text", placeholder = "") => (
    <div style={{ marginBottom: 20 }}>
      <label htmlFor={`field-${key}`} style={LBL}>{label}</label>
      <input id={`field-${key}`} type={type} value={(form as any)[key]} placeholder={placeholder}
        onChange={e => set(key, e.target.value)} style={INP} />
    </div>
  );

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
          ← Browse Listings
        </a>
      </nav>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "28px 16px" : "48px 24px" }}>
        <h1 style={{ fontFamily: C.sans, fontSize: "clamp(1.4rem,4vw,1.75rem)", fontWeight: 700, color: C.text, marginBottom: 6 }}>
          Submit Proposal
        </h1>
        <p style={{ fontFamily: C.sans, fontSize: "0.95rem", color: C.sub, marginBottom: 32, lineHeight: 1.6 }}>
          Your proposal is sealed until the homeowner's deadline. $395 fee only if accepted.
        </p>

        {verifiedState === "loading" && (
          <p style={{ fontFamily: C.mono, fontSize: "0.75rem", color: C.sub }}>Checking verification status…</p>
        )}

        {verifiedState === "blocked" && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 24 : 36, textAlign: "center", boxShadow: C.shadow }}>
            <p style={{ fontFamily: C.sans, fontSize: "1.05rem", fontWeight: 600, color: C.text, marginBottom: 10 }}>
              Verification Pending
            </p>
            <p style={{ fontFamily: C.sans, fontSize: "0.9rem", color: C.sub, marginBottom: 24, lineHeight: 1.7 }}>
              Your account is under review. You'll be notified when you can submit proposals.
            </p>
            <a href="/agents/register" style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.primary, textDecoration: "none" }}>
              ← Back to Registration
            </a>
          </div>
        )}

        {verifiedState === "verified" && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 24 : 36, boxShadow: C.shadow }}>
            <form onSubmit={handleSubmit}>
              {field("Your Name", "agentName", "text", "Jane Smith")}
              {field("Brokerage", "agentBrokerage", "text", "Keller Williams")}

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label htmlFor="field-commissionPct" style={LBL}>Commission (%)</label>
                  <input id="field-commissionPct" type="number" step="0.1" min="0.5" max="6"
                    value={form.commissionPct} onChange={e => set("commissionPct", e.target.value)} style={INP} />
                </div>
                <div>
                  <label htmlFor="field-estimatedSalePrice" style={LBL}>Est. Sale Price ($)</label>
                  <input id="field-estimatedSalePrice" type="number" value={form.estimatedSalePrice}
                    onChange={e => set("estimatedSalePrice", e.target.value)} placeholder="350000" style={INP} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label htmlFor="field-estimatedDaysOnMarket" style={LBL}>Estimated Days on Market</label>
                <input id="field-estimatedDaysOnMarket" type="number" value={form.estimatedDaysOnMarket}
                  onChange={e => set("estimatedDaysOnMarket", e.target.value)} style={INP} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label htmlFor="field-cmaSummary" style={LBL}>CMA Summary</label>
                <textarea id="field-cmaSummary" value={form.cmaSummary} rows={3}
                  placeholder="Comparable sales supporting your estimated price..."
                  onChange={e => set("cmaSummary", e.target.value)}
                  style={{ ...INP, resize: "vertical" }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label htmlFor="field-marketingPlan" style={LBL}>Marketing Plan</label>
                <textarea id="field-marketingPlan" value={form.marketingPlan} rows={3}
                  placeholder="How you'll market the property..."
                  onChange={e => set("marketingPlan", e.target.value)}
                  style={{ ...INP, resize: "vertical" }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ ...LBL, marginBottom: 12 }}>Included Services</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SERVICES.map(s => (
                    <button key={s} type="button" onClick={() => toggleService(s)}
                      style={{
                        background: selectedServices.includes(s) ? C.primary : C.white,
                        border: `1px solid ${selectedServices.includes(s) ? C.primary : C.border}`,
                        color: selectedServices.includes(s) ? C.white : C.text,
                        fontFamily: C.sans, fontSize: "0.8rem",
                        padding: "8px 12px", borderRadius: 6, cursor: "pointer",
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <label htmlFor="field-coverLetter" style={LBL}>Cover Letter</label>
                <textarea id="field-coverLetter" value={form.coverLetter} rows={4}
                  placeholder="Why you're the best agent for this property..."
                  onChange={e => set("coverLetter", e.target.value)}
                  style={{ ...INP, resize: "vertical" }} />
              </div>

              <button type="submit" disabled={saving}
                style={{
                  background: saving ? C.sub : C.primary, border: "none", color: C.white,
                  fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 600,
                  padding: "12px 24px", borderRadius: 8,
                  cursor: saving ? "not-allowed" : "pointer", width: "100%",
                }}>
                {saving ? "Submitting…" : "Submit Sealed Proposal"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
