import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { registerAgent } from "../services/agent";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

export default function AgentRegisterPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", brokerage: "", licenseNumber: "", county: "Volusia",
    bio: "", phone: "", email: "",
  });

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await registerAgent({ ...form, statesLicensed: ["FL"] }) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
      toast.success("Profile created! You can now browse and bid on listings.");
      navigate("/agents/browse");
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
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 40px" }}>
        <h1 style={{ fontFamily: S.serif, fontSize: "2rem", fontWeight: 900, marginBottom: 8 }}>Agent Sign Up</h1>
        <p style={{ fontFamily: S.sans, color: S.inkLight, marginBottom: 40 }}>Free to join. $295 fee only when your bid is accepted.</p>

        <form onSubmit={handleSubmit}>
          {field("Full Name", "name", "text", "Jane Smith")}
          {field("Brokerage", "brokerage", "text", "Keller Williams Realty")}
          {field("FL License Number", "licenseNumber", "text", "SL3XXXXXX")}

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 6 }}>County Focus</label>
            <select value={form.county} onChange={e => set("county", e.target.value)}
              style={{ border: `1px solid ${S.rule}`, padding: "10px 12px", width: "100%", fontFamily: S.sans }}>
              <option value="Volusia">Volusia County</option>
              <option value="Flagler">Flagler County</option>
              <option value="Both">Both Counties</option>
            </select>
          </div>

          {field("Phone", "phone", "tel", "(386) 555-0100")}
          {field("Email", "email", "email", "jane@brokerage.com")}

          <div style={{ marginBottom: 40 }}>
            <label style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 6 }}>Bio (optional)</label>
            <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={4}
              placeholder="Brief professional background, specialties, years in Volusia/Flagler market..."
              style={{ border: `1px solid ${S.rule}`, padding: "10px 12px", width: "100%", fontFamily: S.sans, resize: "vertical" }} />
          </div>

          <button type="submit" disabled={saving}
            style={{ background: S.ink, border: `1px solid ${S.ink}`, color: S.paper, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "14px 32px", cursor: "pointer", width: "100%" }}>
            {saving ? "Creating Profile..." : "Create Agent Profile — Free"}
          </button>
        </form>
      </div>
    </div>
  );
}
