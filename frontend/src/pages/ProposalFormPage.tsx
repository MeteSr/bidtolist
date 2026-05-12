import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { submitProposal } from "../services/listing";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

const SERVICES = ["Professional Photography", "Aerial/Drone Photography", "Virtual Tour", "Staging Consultation", "Open Houses", "MLS Listing", "Zillow Enhanced", "Social Media Campaign", "Print Advertising", "Coming Soon Campaign"];

export default function ProposalFormPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    agentName: "", agentBrokerage: "", commissionPct: "2.5",
    cmaSummary: "", marketingPlan: "", estimatedDaysOnMarket: "30",
    estimatedSalePrice: "", coverLetter: "", validUntilDays: "30",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

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
        requestId, agentName: form.agentName, agentBrokerage: form.agentBrokerage,
        commissionBps, cmaSummary: form.cmaSummary, marketingPlan: form.marketingPlan,
        estimatedDaysOnMarket: parseInt(form.estimatedDaysOnMarket),
        estimatedSalePrice: parseInt(form.estimatedSalePrice),
        includedServices: selectedServices, validUntil, coverLetter: form.coverLetter,
      }) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
      toast.success("Proposal submitted! The homeowner will see it after the deadline.");
      navigate("/agents/dashboard");
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, key: string, type = "text", placeholder = "") => (
    <div style={{ marginBottom: 24 }}>
      <label style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 6 }}>{label}</label>
      <input type={type} value={(form as any)[key]} placeholder={placeholder} onChange={e => set(key, e.target.value)}
        style={{ border: `1px solid ${S.rule}`, padding: "10px 12px", width: "100%", fontFamily: S.sans }} />
    </div>
  );

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: "16px 40px" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 900, color: S.rust, textDecoration: "none" }}>BidtoList</a>
      </nav>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 40px" }}>
        <h1 style={{ fontFamily: S.serif, fontSize: "2rem", fontWeight: 900, marginBottom: 8 }}>Submit Proposal</h1>
        <p style={{ fontFamily: S.sans, color: S.inkLight, marginBottom: 40 }}>Your proposal is sealed until the homeowner's deadline. $295 fee only if accepted.</p>

        <form onSubmit={handleSubmit}>
          {field("Your Name", "agentName", "text", "Jane Smith")}
          {field("Brokerage", "agentBrokerage", "text", "Keller Williams")}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 6 }}>Commission (%)</label>
              <input type="number" step="0.1" min="0.5" max="6" value={form.commissionPct} onChange={e => set("commissionPct", e.target.value)}
                style={{ border: `1px solid ${S.rule}`, padding: "10px 12px", width: "100%", fontFamily: S.sans }} />
            </div>
            <div>
              <label style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 6 }}>Est. Sale Price ($)</label>
              <input type="number" value={form.estimatedSalePrice} onChange={e => set("estimatedSalePrice", e.target.value)} placeholder="350000"
                style={{ border: `1px solid ${S.rule}`, padding: "10px 12px", width: "100%", fontFamily: S.sans }} />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 6 }}>Estimated Days on Market</label>
            <input type="number" value={form.estimatedDaysOnMarket} onChange={e => set("estimatedDaysOnMarket", e.target.value)}
              style={{ border: `1px solid ${S.rule}`, padding: "10px 12px", width: "100%", fontFamily: S.sans }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 6 }}>CMA Summary</label>
            <textarea value={form.cmaSummary} onChange={e => set("cmaSummary", e.target.value)} rows={3}
              placeholder="Comparable sales supporting your estimated price..."
              style={{ border: `1px solid ${S.rule}`, padding: "10px 12px", width: "100%", fontFamily: S.sans, resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 6 }}>Marketing Plan</label>
            <textarea value={form.marketingPlan} onChange={e => set("marketingPlan", e.target.value)} rows={3}
              placeholder="How you'll market the property..."
              style={{ border: `1px solid ${S.rule}`, padding: "10px 12px", width: "100%", fontFamily: S.sans, resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 12 }}>Included Services</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SERVICES.map(s => (
                <button key={s} type="button" onClick={() => toggleService(s)}
                  style={{ background: selectedServices.includes(s) ? S.ink : "transparent", border: `1px solid ${S.rule}`, color: selectedServices.includes(s) ? S.paper : S.ink, fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 12px", cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <label style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 6 }}>Cover Letter</label>
            <textarea value={form.coverLetter} onChange={e => set("coverLetter", e.target.value)} rows={4}
              placeholder="Why you're the best agent for this property..."
              style={{ border: `1px solid ${S.rule}`, padding: "10px 12px", width: "100%", fontFamily: S.sans, resize: "vertical" }} />
          </div>

          <button type="submit" disabled={saving}
            style={{ background: S.rust, border: `1px solid ${S.rust}`, color: S.paper, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "14px 32px", cursor: "pointer", width: "100%" }}>
            {saving ? "Submitting..." : "Submit Sealed Proposal"}
          </button>
        </form>
      </div>
    </div>
  );
}
