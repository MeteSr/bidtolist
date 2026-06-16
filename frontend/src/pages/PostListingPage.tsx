import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createBidRequest, isHomeownerVerified } from "../services/listing";
import { notifyNewListing } from "../services/email";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { FLORIDA_CITIES } from "../data/floridaCities";

const C = {
  bg:      "#F3F4F6",
  white:   "#FFFFFF",
  text:    "#111827",
  sub:     "#6B7280",
  border:  "#E5E7EB",
  primary: "#2563EB",
  green:   "#16A34A",
  shadow:  "0 1px 3px rgba(0,0,0,0.10)",
  sans:    "'Inter','IBM Plex Sans',system-ui,sans-serif",
  mono:    "'IBM Plex Mono',monospace",
};

const LBL: React.CSSProperties = {
  fontFamily: C.mono, fontSize: "0.7rem", letterSpacing: "0.08em",
  textTransform: "uppercase", color: C.sub, display: "block", marginBottom: 6,
};
const INP: React.CSSProperties = {
  border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px",
  width: "100%", fontFamily: C.sans, fontSize: "0.95rem",
  background: C.white, color: C.text, boxSizing: "border-box",
  outline: "none",
};

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label htmlFor={id} style={LBL}>{label}</label>
      {children}
    </div>
  );
}

export default function PostListingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isMobile } = useBreakpoint();
  const [saving, setSaving] = useState(false);
  const [verifiedState, setVerifiedState] = useState<"loading" | "verified" | "unverified">("loading");
  const [form, setForm] = useState({
    address: "", city: "", county: "Volusia", zipCode: "",
    targetListDate: "", desiredSalePrice: "", beds: "", baths: "", sqft: "",
    notes: "", bidDeadlineHours: "168", contactEmail: "",
  });

  useEffect(() => {
    if (!isAuthenticated) { setVerifiedState("unverified"); return; }
    isHomeownerVerified()
      .then(ok => setVerifiedState(ok ? "verified" : "unverified"))
      .catch(() => setVerifiedState("unverified"));
  }, [isAuthenticated]);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const deadline = Date.now() + parseInt(form.bidDeadlineHours) * 60 * 60 * 1000;
      const result = await createBidRequest({
        address: form.address, city: form.city, county: form.county, zipCode: form.zipCode,
        targetListDate: new Date(form.targetListDate).getTime(),
        desiredSalePrice: form.desiredSalePrice ? parseInt(form.desiredSalePrice) * 100 : undefined,
        beds:  form.beds  ? parseInt(form.beds)  : undefined,
        baths: form.baths ? parseInt(form.baths) : undefined,
        sqft:  form.sqft  ? parseInt(form.sqft)  : undefined,
        notes: form.notes, bidDeadline: deadline,
        homeownerEmail: form.contactEmail,
      }) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
      notifyNewListing((result as any).ok.id);
      toast.success("Listing posted! Agents can now submit proposals.");
      navigate("/my-bids");
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
        <a href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          <img src="/bid_to_list_logo.png" alt="BidToList" style={{ height: 36, width: "auto", display: "block" }} />
        </a>
        <a href="/my-bids" style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.sub, textDecoration: "none" }}>
          ← My Listings
        </a>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "28px 16px" : "48px 24px" }}>

        <h1 style={{ fontFamily: C.sans, fontSize: "clamp(1.5rem,4vw,1.875rem)", fontWeight: 700, color: C.text, marginBottom: 6 }}>
          Post Your Listing
        </h1>
        <p style={{ fontFamily: C.sans, fontSize: "0.95rem", color: C.sub, marginBottom: 32 }}>
          Agents will submit blind proposals until your deadline.
        </p>

        {verifiedState === "loading" && (
          <p style={{ fontFamily: C.mono, fontSize: "0.75rem", color: C.sub }}>Checking verification status…</p>
        )}

        {verifiedState === "unverified" && !isAuthenticated && (
          <div data-testid="sign-in-gate" style={{
            background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: isMobile ? 24 : 36, textAlign: "center", boxShadow: C.shadow,
          }}>
            <p style={{ fontFamily: C.sans, fontSize: "1.05rem", fontWeight: 600, color: C.text, marginBottom: 10 }}>
              Sign in to post a listing
            </p>
            <p style={{ fontFamily: C.sans, fontSize: "0.9rem", color: C.sub, marginBottom: 24 }}>
              You need to sign in and verify property ownership before posting.
            </p>
            <a href="/" style={{
              fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 500,
              color: C.primary, textDecoration: "none",
            }}>
              ← Sign in on the home page
            </a>
          </div>
        )}

        {verifiedState === "unverified" && isAuthenticated && (
          <div style={{
            background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: isMobile ? 24 : 36, boxShadow: C.shadow,
          }}>
            <p style={{ fontFamily: C.sans, fontSize: "1.05rem", fontWeight: 600, color: C.text, marginBottom: 10 }}>
              Verify your ownership first
            </p>
            <p style={{ fontFamily: C.sans, fontSize: "0.9rem", color: C.sub, lineHeight: 1.7, marginBottom: 24 }}>
              Before you can post a listing, we need to confirm you own the property.
              Submit your parcel number and we'll verify it — usually within 24 hours.
            </p>
            <a href="/verify" style={{
              display: "inline-block", background: C.green, color: C.white,
              fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 600,
              padding: "10px 22px", borderRadius: 8, textDecoration: "none",
            }}>
              Start Verification →
            </a>
          </div>
        )}

        {verifiedState === "verified" && (
          <div style={{
            background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: isMobile ? 24 : 36, boxShadow: C.shadow,
          }}>
            <form onSubmit={handleSubmit}>

              <Field label="Street Address" id="field-address">
                <input id="field-address" type="text" value={form.address}
                  placeholder="123 Main St" onChange={e => set("address", e.target.value)} style={INP} />
              </Field>

              <datalist id="fl-cities-post">
                {FLORIDA_CITIES.map(c => <option key={c} value={c} />)}
              </datalist>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <Field label="City" id="field-city">
                  <input id="field-city" value={form.city} onChange={e => set("city", e.target.value)}
                    placeholder="Daytona Beach" style={INP} list="fl-cities-post" autoComplete="off" />
                </Field>
                <Field label="Zip Code" id="field-zipCode">
                  <input id="field-zipCode" value={form.zipCode} onChange={e => set("zipCode", e.target.value)}
                    placeholder="32118" style={INP} />
                </Field>
              </div>

              <Field label="County" id="field-county">
                <select id="field-county" value={form.county} onChange={e => set("county", e.target.value)} style={INP}>
                  <option value="Volusia">Volusia County</option>
                  <option value="Flagler">Flagler County</option>
                </select>
              </Field>

              <Field label="Target List Date" id="field-targetListDate">
                <input id="field-targetListDate" type="date" value={form.targetListDate}
                  onChange={e => set("targetListDate", e.target.value)} style={INP} />
              </Field>

              <Field label="Desired Sale Price (optional)" id="field-desiredSalePrice">
                <input id="field-desiredSalePrice" type="number" value={form.desiredSalePrice}
                  placeholder="350000" onChange={e => set("desiredSalePrice", e.target.value)} style={INP} />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                <Field label="Bedrooms" id="field-beds">
                  <input id="field-beds" type="number" min="0" value={form.beds}
                    placeholder="3" onChange={e => set("beds", e.target.value)} style={INP} />
                </Field>
                <Field label="Bathrooms" id="field-baths">
                  <input id="field-baths" type="number" min="0" value={form.baths}
                    placeholder="2" onChange={e => set("baths", e.target.value)} style={INP} />
                </Field>
                <div style={isMobile ? { gridColumn: "1 / -1" } : {}}>
                  <Field label="Sq Ft" id="field-sqft">
                    <input id="field-sqft" type="number" min="0" value={form.sqft}
                      placeholder="1800" onChange={e => set("sqft", e.target.value)} style={INP} />
                  </Field>
                </div>
              </div>

              <Field label="Notes for Agents" id="field-notes">
                <textarea id="field-notes" value={form.notes} rows={4}
                  placeholder="Any details about the property, preferred services, timeline, etc."
                  onChange={e => set("notes", e.target.value)}
                  style={{ ...INP, resize: "vertical" }} />
              </Field>

              <Field label="Contact Email" id="field-contactEmail">
                <input id="field-contactEmail" type="email" value={form.contactEmail}
                  placeholder="you@example.com" onChange={e => set("contactEmail", e.target.value)} style={INP} />
              </Field>

              <Field label="Bid Deadline (minimum 48 hours)" id="field-deadline">
                <select id="field-deadline" value={form.bidDeadlineHours}
                  onChange={e => set("bidDeadlineHours", e.target.value)} style={INP}>
                  <option value="48">48 hours (2 days)</option>
                  <option value="72">72 hours (3 days)</option>
                  <option value="120">120 hours (5 days)</option>
                  <option value="168">168 hours (7 days — recommended)</option>
                  <option value="240">240 hours (10 days)</option>
                  <option value="336">336 hours (14 days)</option>
                </select>
              </Field>

              <button type="submit" disabled={saving} style={{
                background: saving ? C.sub : C.primary, border: "none", color: C.white,
                fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 600,
                padding: "12px 24px", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer",
                width: "100%", marginTop: 8,
              }}>
                {saving ? "Posting…" : "Post Listing — Free"}
              </button>

            </form>
          </div>
        )}
      </div>
    </div>
  );
}
