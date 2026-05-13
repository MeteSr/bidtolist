import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { submitProposal, getBidRequest } from "../services/listing";
import { getMyAgentProfile } from "../services/agent";
import { notifyNewProposal } from "../services/email";
import { useBreakpoint } from "../hooks/useBreakpoint";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

const SERVICES = ["Professional Photography", "Aerial/Drone Photography", "Virtual Tour", "Staging Consultation", "Open Houses", "MLS Listing", "Zillow Enhanced", "Social Media Campaign", "Print Advertising", "Coming Soon Campaign"];

export default function ProposalFormPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [saving, setSaving] = useState(false);
  const [verifiedState, setVerifiedState] = useState<"loading" | "verified" | "blocked">("loading");
  const [agentEmail, setAgentEmail] = useState("");
  const [bidRequest, setBidRequest] = useState<any>(null);
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

      if (bidRequest?.homeownerEmail) {
        const deadline = new Date(Number(bidRequest.bidDeadline) / 1_000_000).toLocaleDateString();
        notifyNewProposal({
          homeownerEmail: bidRequest.homeownerEmail,
          city: bidRequest.city,
          county: bidRequest.county,
          proposalCount: 1,
          deadlineDate: deadline,
        });
      }

      toast.success("Proposal submitted! The homeowner will see it after the deadline.");
      navigate("/agents/dashboard");
    } finally {
      setSaving(false);
    }
  }

  const LBL: React.CSSProperties = { fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 6 };
  const INP: React.CSSProperties = { border: `1px solid ${S.rule}`, padding: "12px", width: "100%", fontFamily: S.sans, fontSize: "1rem", boxSizing: "border-box" };

  const field = (label: string, key: string, type = "text", placeholder = "") => (
    <div style={{ marginBottom: 24 }}>
      <label htmlFor={`field-${key}`} style={LBL}>{label}</label>
      <input id={`field-${key}`} type={type} value={(form as any)[key]} placeholder={placeholder} onChange={e => set(key, e.target.value)} style={INP} />
    </div>
  );

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: isMobile ? "12px 16px" : "16px 40px" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 900, color: S.rust, textDecoration: "none" }}>BidtoList</a>
      </nav>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "32px 16px" : "60px 40px" }}>
        <h1 style={{ fontFamily: S.serif, fontSize: "clamp(1.6rem, 5vw, 2rem)", fontWeight: 900, marginBottom: 8 }}>Submit Proposal</h1>
        <p style={{ fontFamily: S.sans, color: S.inkLight, marginBottom: 40 }}>Your proposal is sealed until the homeowner's deadline. $295 fee only if accepted.</p>

        {verifiedState === "loading" && (
          <p style={{ fontFamily: S.mono, fontSize: "0.75rem", color: S.inkLight }}>Checking verification status…</p>
        )}

        {verifiedState === "blocked" && (
          <div style={{ border: `1px solid ${S.rule}`, padding: isMobile ? 20 : 32, textAlign: "center" }}>
            <p style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>Verification Pending</p>
            <p style={{ fontFamily: S.sans, color: S.inkLight, marginBottom: 24, fontSize: "0.9rem" }}>
              Your account is under review. You'll be notified when you can submit proposals.
            </p>
            <a href="/agents/register" style={{ fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.rust, textDecoration: "none" }}>
              ← Back to Registration
            </a>
          </div>
        )}

        {verifiedState === "verified" && <form onSubmit={handleSubmit}>
          {field("Your Name", "agentName", "text", "Jane Smith")}
          {field("Brokerage", "agentBrokerage", "text", "Keller Williams")}

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <label htmlFor="field-commissionPct" style={LBL}>Commission (%)</label>
              <input id="field-commissionPct" type="number" step="0.1" min="0.5" max="6" value={form.commissionPct} onChange={e => set("commissionPct", e.target.value)} style={INP} />
            </div>
            <div>
              <label htmlFor="field-estimatedSalePrice" style={LBL}>Est. Sale Price ($)</label>
              <input id="field-estimatedSalePrice" type="number" value={form.estimatedSalePrice} onChange={e => set("estimatedSalePrice", e.target.value)} placeholder="350000" style={INP} />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="field-estimatedDaysOnMarket" style={LBL}>Estimated Days on Market</label>
            <input id="field-estimatedDaysOnMarket" type="number" value={form.estimatedDaysOnMarket} onChange={e => set("estimatedDaysOnMarket", e.target.value)} style={INP} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="field-cmaSummary" style={LBL}>CMA Summary</label>
            <textarea id="field-cmaSummary" value={form.cmaSummary} onChange={e => set("cmaSummary", e.target.value)} rows={3}
              placeholder="Comparable sales supporting your estimated price..."
              style={{ ...INP, resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="field-marketingPlan" style={LBL}>Marketing Plan</label>
            <textarea id="field-marketingPlan" value={form.marketingPlan} onChange={e => set("marketingPlan", e.target.value)} rows={3}
              placeholder="How you'll market the property..."
              style={{ ...INP, resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ ...LBL, marginBottom: 12 }}>Included Services</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SERVICES.map(s => (
                <button key={s} type="button" onClick={() => toggleService(s)}
                  style={{ background: selectedServices.includes(s) ? S.ink : "transparent", border: `1px solid ${S.rule}`, color: selectedServices.includes(s) ? S.paper : S.ink, fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.06em", textTransform: "uppercase", padding: "10px 14px", cursor: "pointer", minHeight: 44 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <label htmlFor="field-coverLetter" style={LBL}>Cover Letter</label>
            <textarea id="field-coverLetter" value={form.coverLetter} onChange={e => set("coverLetter", e.target.value)} rows={4}
              placeholder="Why you're the best agent for this property..."
              style={{ ...INP, resize: "vertical" }} />
          </div>

          <button type="submit" disabled={saving}
            style={{ background: S.rust, border: `1px solid ${S.rust}`, color: S.paper, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "16px 32px", cursor: "pointer", width: "100%", minHeight: 44 }}>
            {saving ? "Submitting..." : "Submit Sealed Proposal"}
          </button>
        </form>}
      </div>
    </div>
  );
}
