import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { registerAgent, getMyAgentProfile, updateAgentProfile } from "../services/agent";
import { useAuth } from "../contexts/AuthContext";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

type PageState = "loading" | "form" | "pending" | "verified";

const INITIAL_FORM = {
  name: "", brokerage: "", licenseNumber: "", county: "Volusia",
  bio: "", phone: "", email: "",
};

function LabelStyle(): React.CSSProperties {
  return { fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 6 };
}
function InputStyle(): React.CSSProperties {
  return { border: `1px solid ${S.rule}`, padding: "10px 12px", width: "100%", fontFamily: S.sans, background: "white", color: S.ink };
}

export default function AgentRegisterPage() {
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { setPageState("form"); return; }

    getMyAgentProfile().then(p => {
      if (!p) { setPageState("form"); return; }
      setProfile(p);
      setForm({
        name: p.name ?? "",
        brokerage: p.brokerage ?? "",
        licenseNumber: p.licenseNumber ?? "",
        county: p.county ?? "Volusia",
        bio: p.bio ?? "",
        phone: p.phone ?? "",
        email: p.email ?? "",
      });
      setPageState(p.isVerified ? "verified" : "pending");
    }).catch(() => setPageState("form"));
  }, [isAuthenticated, authLoading]);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) { await login(); return; }
    setSaving(true);
    try {
      const args = { ...form, statesLicensed: ["FL"] };
      const result = await registerAgent(args) as any;
      if ("err" in result) {
        if ("AlreadyExists" in result.err) {
          const existing = await getMyAgentProfile();
          setProfile(existing);
          setPageState(existing?.isVerified ? "verified" : "pending");
          return;
        }
        toast.error(JSON.stringify(result.err));
        return;
      }
      setProfile(result.ok);
      setPageState("pending");
      toast.success("Application submitted — you'll be notified once verified.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const args = { ...form, statesLicensed: ["FL"] };
      const result = await updateAgentProfile(args) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
      setProfile(result.ok);
      toast.success("Profile updated.");
    } finally {
      setSaving(false);
    }
  }

  function field(label: string, key: string, type = "text", placeholder = "") {
    return (
      <div style={{ marginBottom: 24 }}>
        <label style={LabelStyle()}>{label}</label>
        <input type={type} value={(form as any)[key]} placeholder={placeholder}
          onChange={e => set(key, e.target.value)} style={InputStyle()} />
      </div>
    );
  }

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: "16px 40px" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 900, color: S.rust, textDecoration: "none" }}>BidtoList</a>
      </nav>

      {pageState === "loading" && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 40px", fontFamily: S.sans, color: S.inkLight }}>
          Loading…
        </div>
      )}

      {pageState === "form" && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 40px" }}>
          <h1 style={{ fontFamily: S.serif, fontSize: "2rem", fontWeight: 900, marginBottom: 8 }}>Agent Sign Up</h1>
          <p style={{ fontFamily: S.sans, color: S.inkLight, marginBottom: 40 }}>Free to join. $295 fee only when your bid is accepted.</p>

          {!isAuthenticated && (
            <div style={{ border: `1px solid ${S.rust}`, padding: 16, marginBottom: 32 }}>
              <p style={{ fontFamily: S.sans, fontSize: "0.9rem", marginBottom: 12, color: S.ink }}>
                You must sign in with Internet Identity before registering.
              </p>
              <button onClick={login}
                style={{ border: `1px solid ${S.ink}`, background: "transparent", color: S.ink, fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 20px", cursor: "pointer" }}>
                Sign In
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {field("Full Name", "name", "text", "Jane Smith")}
            {field("Brokerage", "brokerage", "text", "Keller Williams Realty")}
            {field("FL License Number", "licenseNumber", "text", "SL3XXXXXX")}

            <div style={{ marginBottom: 24 }}>
              <label style={LabelStyle()}>County Focus</label>
              <select value={form.county} onChange={e => set("county", e.target.value)} style={InputStyle()}>
                <option value="Volusia">Volusia County</option>
                <option value="Flagler">Flagler County</option>
                <option value="Both">Both Counties</option>
              </select>
            </div>

            {field("Phone", "phone", "tel", "(386) 555-0100")}
            {field("Email", "email", "email", "jane@brokerage.com")}

            <div style={{ marginBottom: 40 }}>
              <label style={LabelStyle()}>Bio (optional)</label>
              <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={4}
                placeholder="Brief professional background, specialties, years in Volusia/Flagler market..."
                style={{ ...InputStyle(), resize: "vertical" }} />
            </div>

            <button type="submit" disabled={saving || !isAuthenticated}
              style={{ background: S.ink, border: `1px solid ${S.ink}`, color: S.paper, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "14px 32px", cursor: saving ? "not-allowed" : "pointer", width: "100%", opacity: !isAuthenticated ? 0.5 : 1 }}>
              {saving ? "Submitting…" : "Create Agent Profile — Free"}
            </button>
          </form>
        </div>
      )}

      {pageState === "pending" && profile && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 40px" }}>
          <div style={{ border: `1px solid ${S.rule}`, padding: 32, marginBottom: 40 }}>
            <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, marginBottom: 12 }}>Status</p>
            <h2 style={{ fontFamily: S.serif, fontSize: "1.6rem", fontWeight: 900, marginBottom: 8 }}>Under Review</h2>
            <p style={{ fontFamily: S.sans, color: S.inkLight, lineHeight: 1.6 }}>
              Your application is pending BidtoList verification. We review license numbers against the Florida DBPR database — you'll receive an email at <strong>{profile.email}</strong> once approved.
            </p>
          </div>

          <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, marginBottom: 24 }}>Submitted Info</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
            {[
              ["Name", profile.name],
              ["Brokerage", profile.brokerage],
              ["License", profile.licenseNumber],
              ["County", profile.county],
              ["Phone", profile.phone],
              ["Email", profile.email],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, marginBottom: 4 }}>{label}</p>
                <p style={{ fontFamily: S.sans, color: S.ink }}>{value}</p>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, marginBottom: 24 }}>Need to correct something?</p>
          <form onSubmit={handleUpdate}>
            {field("Full Name", "name", "text")}
            {field("Brokerage", "brokerage", "text")}
            {field("Phone", "phone", "tel")}
            {field("Email", "email", "email")}
            <div style={{ marginBottom: 24 }}>
              <label style={LabelStyle()}>Bio</label>
              <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={3}
                style={{ ...InputStyle(), resize: "vertical" }} />
            </div>
            <button type="submit" disabled={saving}
              style={{ border: `1px solid ${S.ink}`, background: "transparent", color: S.ink, fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "12px 24px", cursor: "pointer" }}>
              {saving ? "Saving…" : "Update Profile"}
            </button>
          </form>
        </div>
      )}

      {pageState === "verified" && profile && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 40px" }}>
          <div style={{ border: `1px solid ${S.rule}`, padding: 32, marginBottom: 40 }}>
            <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, marginBottom: 12 }}>Status</p>
            <h2 style={{ fontFamily: S.serif, fontSize: "1.6rem", fontWeight: 900, marginBottom: 8 }}>Verified Agent</h2>
            <p style={{ fontFamily: S.sans, color: S.inkLight, lineHeight: 1.6 }}>
              Your license has been verified. You can now browse FSBO listings and submit bids.
            </p>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <a href="/agents/browse"
              style={{ background: S.ink, border: `1px solid ${S.ink}`, color: S.paper, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "14px 32px", textDecoration: "none", display: "inline-block" }}>
              Browse Listings
            </a>
            <a href="/"
              style={{ border: `1px solid ${S.rule}`, color: S.inkLight, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "14px 32px", textDecoration: "none", display: "inline-block" }}>
              Home
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
