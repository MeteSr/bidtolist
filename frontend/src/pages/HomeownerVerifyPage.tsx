import { useState } from "react";
import toast from "react-hot-toast";
import { requestHomeownerVerification } from "../services/listing";
import { useBreakpoint } from "../hooks/useBreakpoint";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

const LBL = (): React.CSSProperties => ({
  fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.1em",
  textTransform: "uppercase", color: S.inkLight, display: "block", marginBottom: 6,
});
const INP = (): React.CSSProperties => ({
  border: `1px solid ${S.rule}`, padding: "12px", width: "100%",
  fontFamily: S.sans, fontSize: "1rem", background: "white",
  color: S.ink, boxSizing: "border-box",
});

export default function HomeownerVerifyPage() {
  const { isMobile } = useBreakpoint();
  const [form, setForm] = useState({ address: "", parcelNumber: "", contactEmail: "" });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
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

  const navPad = isMobile ? "12px 16px" : "16px 40px";
  const secPad = isMobile ? "32px 16px" : "60px 40px";

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: navPad }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 900, color: S.rust, textDecoration: "none" }}>BidtoList</a>
      </nav>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: secPad }}>
        <h1 style={{ fontFamily: S.serif, fontSize: "clamp(1.6rem, 5vw, 2rem)", fontWeight: 900, marginBottom: 8 }}>
          Verify Ownership
        </h1>
        <p style={{ fontFamily: S.sans, color: S.inkLight, marginBottom: 40, lineHeight: 1.7 }}>
          We cross-reference your parcel number with county property records to confirm ownership before you post a listing. Usually takes less than 24 hours.
        </p>

        {submitted ? (
          <div style={{ border: `1px solid ${S.rule}`, padding: isMobile ? 20 : 32 }}>
            <p style={{ fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, marginBottom: 12 }}>Status</p>
            <h2 style={{ fontFamily: S.serif, fontSize: "1.4rem", fontWeight: 900, marginBottom: 12 }}>Request Submitted</h2>
            <p style={{ fontFamily: S.sans, color: S.inkLight, lineHeight: 1.7, marginBottom: 24 }}>
              We'll review your parcel number against county records and email you at <strong>{form.contactEmail}</strong> within 24 hours.
            </p>
            <a href="/" style={{ fontFamily: S.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.inkLight, textDecoration: "none" }}>
              ← Back to Home
            </a>
          </div>
        ) : (
          <>
            <div style={{ border: `1px solid ${S.rule}`, padding: isMobile ? 16 : 24, marginBottom: 32 }}>
              <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, marginBottom: 8 }}>
                Find Your Parcel Number
              </p>
              <p style={{ fontFamily: S.sans, fontSize: "0.85rem", color: S.ink, lineHeight: 1.6 }}>
                <strong>Volusia County:</strong>{" "}
                <a href="https://vcpa.vcgov.org" target="_blank" rel="noopener noreferrer" style={{ color: S.rust }}>vcpa.vcgov.org</a>
                {" · "}
                <strong>Flagler County:</strong>{" "}
                <a href="https://flaglerpa.com" target="_blank" rel="noopener noreferrer" style={{ color: S.rust }}>flaglerpa.com</a>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="field-address" style={LBL()}>Street Address</label>
                <input id="field-address" type="text" value={form.address}
                  onChange={e => set("address", e.target.value)}
                  placeholder="123 Main St, Daytona Beach, FL 32118"
                  style={INP()} required />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label htmlFor="field-parcelNumber" style={LBL()}>Parcel Number</label>
                <input id="field-parcelNumber" type="text" value={form.parcelNumber}
                  onChange={e => set("parcelNumber", e.target.value)}
                  placeholder="7001-00-00-0010"
                  style={INP()} required />
              </div>

              <div style={{ marginBottom: 40 }}>
                <label htmlFor="field-contactEmail" style={LBL()}>Contact Email</label>
                <input id="field-contactEmail" type="email" value={form.contactEmail}
                  onChange={e => set("contactEmail", e.target.value)}
                  placeholder="you@example.com"
                  style={INP()} required />
              </div>

              <button type="submit" disabled={saving}
                style={{ background: S.rust, border: `1px solid ${S.rust}`, color: S.paper, fontFamily: S.mono, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "16px 32px", cursor: saving ? "not-allowed" : "pointer", width: "100%", minHeight: 44 }}>
                {saving ? "Submitting…" : "Submit Verification Request"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
