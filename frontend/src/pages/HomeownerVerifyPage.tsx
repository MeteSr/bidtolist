import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { requestHomeownerVerification } from "../services/listing";
import { useBreakpoint } from "../hooks/useBreakpoint";

const C = {
  bg: "#F3F4F6", white: "#FFFFFF", text: "#111827", sub: "#6B7280",
  border: "#E5E7EB", primary: "#2563EB", green: "#16A34A",
  shadow: "0 1px 3px rgba(0,0,0,0.10)",
  sans: "'Inter','IBM Plex Sans',system-ui,sans-serif",
  mono: "'IBM Plex Mono',monospace",
};

const LBL: React.CSSProperties = {
  fontFamily: C.mono, fontSize: "0.7rem", letterSpacing: "0.08em",
  textTransform: "uppercase", color: C.sub, display: "block", marginBottom: 6,
};
const INP: React.CSSProperties = {
  border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px",
  width: "100%", fontFamily: C.sans, fontSize: "0.95rem",
  background: C.white, color: C.text, boxSizing: "border-box",
};

export default function HomeownerVerifyPage() {
  const { isMobile } = useBreakpoint();
  const [form, setForm] = useState({ address: "", parcelNumber: "", contactEmail: "" });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await requestHomeownerVerification(form.address, form.parcelNumber, form.contactEmail) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
      setSubmitted(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>

      {/* Nav */}
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
        <a href="/post" style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.sub, textDecoration: "none" }}>
          ← Post a Listing
        </a>
      </nav>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: isMobile ? "28px 16px" : "48px 24px" }}>
        <h1 style={{ fontFamily: C.sans, fontSize: "clamp(1.4rem,4vw,1.75rem)", fontWeight: 700, color: C.text, marginBottom: 6 }}>
          Verify Ownership
        </h1>
        <p style={{ fontFamily: C.sans, fontSize: "0.95rem", color: C.sub, marginBottom: 32, lineHeight: 1.6 }}>
          We cross-reference your parcel number with county property records to confirm ownership before you post a listing. Usually takes less than 24 hours.
        </p>

        {submitted ? (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 24 : 36, boxShadow: C.shadow }}>
            <p style={LBL}>Status</p>
            <h2 style={{ fontFamily: C.sans, fontSize: "1.25rem", fontWeight: 600, color: C.text, marginBottom: 10 }}>Request Submitted</h2>
            <p style={{ fontFamily: C.sans, fontSize: "0.9rem", color: C.sub, lineHeight: 1.7, marginBottom: 24 }}>
              We'll review your parcel number against county records and email you at <strong style={{ color: C.text }}>{form.contactEmail}</strong> within 24 hours.
            </p>
            <a href="/" style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.primary, textDecoration: "none" }}>
              ← Back to Home
            </a>
          </div>
        ) : (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 24 : 36, boxShadow: C.shadow }}>

            {/* Parcel lookup helper */}
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "14px 16px", marginBottom: 28 }}>
              <p style={{ ...LBL, color: "#1D4ED8", marginBottom: 6 }}>Find Your Parcel Number</p>
              <p style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.text, lineHeight: 1.6 }}>
                <strong>Volusia County:</strong>{" "}
                <a href="https://vcpa.vcgov.org" target="_blank" rel="noopener noreferrer" style={{ color: C.primary }}>vcpa.vcgov.org</a>
                {" · "}
                <strong>Flagler County:</strong>{" "}
                <a href="https://flaglerpa.com" target="_blank" rel="noopener noreferrer" style={{ color: C.primary }}>flaglerpa.com</a>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="field-address" style={LBL}>Street Address</label>
                <input id="field-address" type="text" value={form.address}
                  onChange={e => set("address", e.target.value)}
                  placeholder="123 Main St, Daytona Beach, FL 32118"
                  style={INP} required />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label htmlFor="field-parcelNumber" style={LBL}>Parcel Number</label>
                <input id="field-parcelNumber" type="text" value={form.parcelNumber}
                  onChange={e => set("parcelNumber", e.target.value)}
                  placeholder="7001-00-00-0010"
                  style={INP} required />
              </div>

              <div style={{ marginBottom: 32 }}>
                <label htmlFor="field-contactEmail" style={LBL}>Contact Email</label>
                <input id="field-contactEmail" type="email" value={form.contactEmail}
                  onChange={e => set("contactEmail", e.target.value)}
                  placeholder="you@example.com"
                  style={INP} required />
              </div>

              <button type="submit" disabled={saving} style={{
                background: saving ? C.sub : C.green, border: "none", color: C.white,
                fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 600,
                padding: "12px 24px", borderRadius: 8,
                cursor: saving ? "not-allowed" : "pointer", width: "100%",
              }}>
                {saving ? "Submitting…" : "Submit Verification Request"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
