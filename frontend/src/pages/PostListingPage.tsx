import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createBidRequest, isHomeownerVerified } from "../services/listing";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

export default function PostListingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isMobile } = useBreakpoint();
  const [saving, setSaving] = useState(false);
  const [verifiedState, setVerifiedState] = useState<"loading" | "verified" | "unverified">("loading");
  const [form, setForm] = useState({
    address: "", city: "", county: "Volusia", zipCode: "",
    targetListDate: "", desiredSalePrice: "", notes: "", bidDeadlineHours: "168",
  });

  useEffect(() => {
    if (!isAuthenticated) { setVerifiedState("unverified"); return; }
    isHomeownerVerified()
      .then(ok => setVerifiedState(ok ? "verified" : "unverified"))
      .catch(() => setVerifiedState("unverified"));
  }, [isAuthenticated]);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const deadline = Date.now() + parseInt(form.bidDeadlineHours) * 60 * 60 * 1000;
      const result = await createBidRequest({
        address: form.address, city: form.city, county: form.county, zipCode: form.zipCode,
        targetListDate: new Date(form.targetListDate).getTime(),
        desiredSalePrice: form.desiredSalePrice ? parseInt(form.desiredSalePrice) * 100 : undefined,
        notes: form.notes, bidDeadline: deadline,
      }) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
      toast.success("Listing posted! Agents can now submit proposals.");
      navigate("/my-bids");
    } finally {
      setSaving(false);
    }
  }

  const LBL: React.CSSProperties = { fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 6 };
  const INP: React.CSSProperties = { border: `1px solid ${S.rule}`, padding: "12px", width: "100%", fontFamily: S.sans, fontSize: "1rem", background: "white", boxSizing: "border-box" };

  const field = (label: string, key: string, type = "text", placeholder = "") => (
    <div style={{ marginBottom: 24 }}>
      <label htmlFor={`field-${key}`} style={LBL}>{label}</label>
      <input id={`field-${key}`} type={type} value={(form as any)[key]} placeholder={placeholder}
        onChange={e => set(key, e.target.value)} style={INP} />
    </div>
  );

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: isMobile ? "12px 16px" : "16px 40px" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 900, color: S.rust, textDecoration: "none" }}>BidtoList</a>
      </nav>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: isMobile ? "32px 16px" : "60px 40px" }}>
        <h1 style={{ fontFamily: S.serif, fontSize: "clamp(1.6rem, 5vw, 2rem)", fontWeight: 900, marginBottom: 8 }}>Post Your Listing</h1>
        <p style={{ fontFamily: S.sans, color: S.inkLight, marginBottom: 40 }}>Agents will submit blind proposals until your deadline.</p>

        {verifiedState === "loading" && (
          <p style={{ fontFamily: S.mono, fontSize: "0.75rem", color: S.inkLight }}>Checking verification status…</p>
        )}

        {verifiedState === "unverified" && !isAuthenticated && (
          <div data-testid="sign-in-gate" style={{ border: `1px solid ${S.rule}`, padding: isMobile ? 20 : 32, textAlign: "center" }}>
            <p style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>Sign in to post a listing</p>
            <p style={{ fontFamily: S.sans, color: S.inkLight, marginBottom: 24, fontSize: "0.9rem" }}>
              You need to sign in and verify property ownership before posting.
            </p>
            <a href="/" style={{ fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.rust, textDecoration: "none" }}>
              ← Sign in on the home page
            </a>
          </div>
        )}

        {verifiedState === "unverified" && isAuthenticated && (
          <div style={{ border: `1px solid ${S.rule}`, padding: isMobile ? 20 : 32 }}>
            <p style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>Verify your ownership first</p>
            <p style={{ fontFamily: S.sans, color: S.inkLight, marginBottom: 24, lineHeight: 1.7, fontSize: "0.9rem" }}>
              Before you can post a listing, we need to confirm you own the property. Submit your parcel number and we'll verify it — usually within 24 hours.
            </p>
            <a href="/verify" style={{ display: "inline-block", background: S.rust, border: `1px solid ${S.rust}`, color: S.paper, fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "14px 24px", textDecoration: "none" }}>
              Start Verification
            </a>
          </div>
        )}

        {verifiedState === "verified" && <form onSubmit={handleSubmit}>
          {field("Street Address", "address", "text", "123 Main St")}

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <label htmlFor="field-city" style={LBL}>City</label>
              <input id="field-city" value={form.city} onChange={e => set("city", e.target.value)} placeholder="Daytona Beach" style={INP} />
            </div>
            <div>
              <label htmlFor="field-zipCode" style={LBL}>Zip Code</label>
              <input id="field-zipCode" value={form.zipCode} onChange={e => set("zipCode", e.target.value)} placeholder="32118" style={INP} />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="field-county" style={LBL}>County</label>
            <select id="field-county" value={form.county} onChange={e => set("county", e.target.value)} style={{ ...INP }}>
              <option value="Volusia">Volusia County</option>
              <option value="Flagler">Flagler County</option>
            </select>
          </div>

          {field("Target List Date", "targetListDate", "date")}
          {field("Desired Sale Price (optional)", "desiredSalePrice", "number", "350000")}

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="field-notes" style={LBL}>Notes for Agents</label>
            <textarea id="field-notes" value={form.notes} onChange={e => set("notes", e.target.value)} rows={4}
              placeholder="Any details about the property, preferred services, timeline, etc."
              style={{ ...INP, resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: 40 }}>
            <label htmlFor="field-deadline" style={LBL}>Bid Deadline (minimum 48 hours)</label>
            <select id="field-deadline" value={form.bidDeadlineHours} onChange={e => set("bidDeadlineHours", e.target.value)} style={{ ...INP }}>
              <option value="48">48 hours (2 days)</option>
              <option value="72">72 hours (3 days)</option>
              <option value="120">120 hours (5 days)</option>
              <option value="168">168 hours (7 days — recommended)</option>
              <option value="240">240 hours (10 days)</option>
              <option value="336">336 hours (14 days)</option>
            </select>
          </div>

          <button type="submit" disabled={saving}
            style={{ background: S.rust, border: `1px solid ${S.rust}`, color: S.paper, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "16px 32px", cursor: "pointer", width: "100%" }}>
            {saving ? "Posting..." : "Post Listing — Free"}
          </button>
        </form>}
      </div>
    </div>
  );
}
