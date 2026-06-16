import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { registerAgent, getMyAgentProfile, updateAgentProfile } from "../services/agent";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { FLORIDA_CITIES } from "../data/floridaCities";

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

type PageState = "loading" | "form" | "pending" | "verified";

const INITIAL_FORM = {
  name: "", brokerage: "", licenseNumber: "", county: "Volusia",
  bio: "", phone: "", email: "",
};

const MAX_DOC_BYTES = 800 * 1024;
const MAX_CITIES = 10;

function CitiesInput({
  cities, onChange, isMobile,
}: {
  cities: string[];
  onChange: (c: string[]) => void;
  isMobile: boolean;
}) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = input.trim().length > 0
    ? FLORIDA_CITIES.filter(c =>
        c.toLowerCase().includes(input.toLowerCase()) &&
        !cities.map(x => x.toLowerCase()).includes(c.toLowerCase())
      ).slice(0, 8)
    : [];

  function addCity(city: string) {
    const trimmed = city.trim();
    if (!trimmed || cities.length >= MAX_CITIES) return;
    if (cities.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) return;
    onChange([...cities, trimmed]);
    setInput("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeCity(idx: number) {
    onChange(cities.filter((_, i) => i !== idx));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (suggestions.length > 0) addCity(suggestions[0]);
      else if (input.trim()) addCity(input.trim());
    }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Backspace" && input === "" && cities.length > 0) {
      onChange(cities.slice(0, -1));
    }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={LBL}>
        Cities I Serve
        <span style={{ color: C.sub, fontWeight: 400, marginLeft: 8 }}>
          {cities.length}/{MAX_CITIES} added
        </span>
      </label>

      {cities.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {cities.map((c, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: C.primary, color: C.white, fontFamily: C.sans,
              fontSize: "0.8rem", padding: "4px 10px", borderRadius: 6,
            }}>
              {c}
              <button type="button" onClick={() => removeCity(i)}
                style={{ background: "none", border: "none", color: C.white, cursor: "pointer", padding: 0, lineHeight: 1, fontSize: "0.9rem" }}
                aria-label={`Remove ${c}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          disabled={cities.length >= MAX_CITIES}
          placeholder={cities.length >= MAX_CITIES ? "Maximum reached" : "Type a city and press Enter…"}
          onChange={e => { setInput(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          style={{ ...INP, opacity: cities.length >= MAX_CITIES ? 0.5 : 1 }}
          autoComplete="off"
        />
        {open && suggestions.length > 0 && (
          <ul style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
            background: C.white, border: `1px solid ${C.border}`, borderTop: "none",
            borderRadius: "0 0 8px 8px",
            margin: 0, padding: 0, listStyle: "none", maxHeight: 220, overflowY: "auto",
            boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
          }}>
            {suggestions.map(s => (
              <li key={s}
                onMouseDown={() => addCity(s)}
                style={{
                  padding: "10px 12px", fontFamily: C.sans, fontSize: "0.9rem",
                  cursor: "pointer", borderBottom: `1px solid ${C.border}`, color: C.text,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
                onMouseLeave={e => (e.currentTarget.style.background = C.white)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p style={{ fontFamily: C.sans, fontSize: "0.8rem", color: C.sub, marginTop: 6 }}>
        Enter/comma to add · backspace to remove last · max {MAX_CITIES}
      </p>
    </div>
  );
}

export default function AgentRegisterPage() {
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();
  const { isMobile } = useBreakpoint();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [serviceCities, setServiceCities] = useState<string[]>([]);
  const [photoIdFile, setPhotoIdFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { setPageState("form"); return; }
    getMyAgentProfile().then(p => {
      if (!p) { setPageState("form"); return; }
      setProfile(p);
      setForm({ name: p.name ?? "", brokerage: p.brokerage ?? "", licenseNumber: p.licenseNumber ?? "", county: p.county ?? "Volusia", bio: p.bio ?? "", phone: p.phone ?? "", email: p.email ?? "" });
      setServiceCities(p.serviceCities ?? []);
      setPageState(p.isVerified ? "verified" : "pending");
    }).catch(() => setPageState("form"));
  }, [isAuthenticated, authLoading]);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function handlePhotoIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_DOC_BYTES) { toast.error("Photo ID must be under 800 KB"); e.target.value = ""; setPhotoIdFile(null); return; }
    setPhotoIdFile(file);
  }

  function handleLicenseDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_DOC_BYTES) { toast.error("License document must be under 800 KB"); e.target.value = ""; setLicenseFile(null); return; }
    setLicenseFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) { await login(); return; }
    if (!photoIdFile || !licenseFile) return;
    if (serviceCities.length === 0) { toast.error("Add at least one service city."); return; }
    setSaving(true);
    try {
      const photoIdDoc = new Uint8Array(await photoIdFile.arrayBuffer());
      const licenseDoc  = new Uint8Array(await licenseFile.arrayBuffer());
      const result = await registerAgent({
        ...form, licenseState: "FL", statesLicensed: ["FL"],
        serviceCities, photoIdDoc, licenseDoc,
      }) as any;
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
    if (serviceCities.length === 0) { toast.error("Add at least one service city."); return; }
    setSaving(true);
    try {
      const result = await updateAgentProfile({
        ...form, licenseState: "FL", statesLicensed: ["FL"], serviceCities,
      }) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
      setProfile(result.ok);
      toast.success("Profile updated.");
    } finally {
      setSaving(false);
    }
  }

  function field(label: string, key: string, type = "text", placeholder = "") {
    return (
      <div style={{ marginBottom: 20 }}>
        <label style={LBL}>{label}</label>
        <input type={type} value={(form as any)[key]} placeholder={placeholder}
          onChange={e => set(key, e.target.value)} style={INP} />
      </div>
    );
  }

  const contentPad = isMobile ? "28px 16px" : "48px 24px";

  const navEl = (
    <nav style={{
      background: C.white, borderBottom: `1px solid ${C.border}`,
      padding: isMobile ? "14px 20px" : "0 48px",
      height: isMobile ? "auto" : 64,
      display: "flex", alignItems: "center",
      position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
    }}>
      <a href="/" style={{ textDecoration: "none" }}>
        <img src="/bid_to_list_logo.png" alt="BidToList" style={{ height: 36, display: "block" }} />
      </a>
    </nav>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {navEl}

      {pageState === "loading" && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: contentPad }}>
          <p style={{ fontFamily: C.mono, fontSize: "0.75rem", color: C.sub }}>Loading…</p>
        </div>
      )}

      {pageState === "form" && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: contentPad }}>
          <h1 style={{ fontFamily: C.sans, fontSize: "clamp(1.4rem,4vw,1.75rem)", fontWeight: 700, color: C.text, marginBottom: 6 }}>
            Agent Sign Up
          </h1>
          <p style={{ fontFamily: C.sans, fontSize: "0.95rem", color: C.sub, marginBottom: 32, lineHeight: 1.6 }}>
            Free to join. $295 fee only when your bid is accepted.
          </p>

          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 24 : 36, boxShadow: C.shadow }}>
            {!isAuthenticated && (
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: 16, marginBottom: 28 }}>
                <p style={{ fontFamily: C.sans, fontSize: "0.9rem", marginBottom: 12, color: C.text }}>
                  You must sign in with Internet Identity before registering.
                </p>
                <button onClick={login}
                  style={{ background: C.primary, border: "none", color: C.white, fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 600, padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>
                  Sign In
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {field("Full Name", "name", "text", "Jane Smith")}
              {field("Brokerage", "brokerage", "text", "Keller Williams Realty")}
              {field("FL License Number", "licenseNumber", "text", "SL3XXXXXX")}

              <div style={{ marginBottom: 20 }}>
                <label style={LBL}>License State</label>
                <input value="FL" disabled style={{ ...INP, background: C.bg, color: C.sub, cursor: "not-allowed" }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={LBL}>County Focus</label>
                <select value={form.county} onChange={e => set("county", e.target.value)} style={INP}>
                  <option value="Volusia">Volusia County</option>
                  <option value="Flagler">Flagler County</option>
                  <option value="Both">Both Counties</option>
                </select>
              </div>

              <CitiesInput cities={serviceCities} onChange={setServiceCities} isMobile={isMobile} />

              {field("Phone", "phone", "tel", "(386) 555-0100")}
              {field("Email", "email", "email", "jane@brokerage.com")}

              <div style={{ marginBottom: 28 }}>
                <label style={LBL}>Bio (optional)</label>
                <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={4}
                  placeholder="Brief professional background, specialties, years in Volusia/Flagler market..."
                  style={{ ...INP, resize: "vertical" }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label htmlFor="photoIdInput" style={LBL}>
                  State-Issued Photo ID <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <p style={{ fontFamily: C.sans, fontSize: "0.85rem", color: C.sub, marginBottom: 8 }}>
                  Driver's license or passport — JPG, PNG, or PDF, max 800 KB
                </p>
                <input id="photoIdInput" type="file" accept="image/jpeg,image/png,image/heic,application/pdf"
                  onChange={handlePhotoIdChange} style={{ fontFamily: C.sans, fontSize: "0.9rem" }} />
              </div>

              <div style={{ marginBottom: 32 }}>
                <label htmlFor="licenseDocInput" style={LBL}>
                  State-Issued Agent License <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <p style={{ fontFamily: C.sans, fontSize: "0.85rem", color: C.sub, marginBottom: 8 }}>
                  Florida DBPR license document — JPG, PNG, or PDF, max 800 KB
                </p>
                <input id="licenseDocInput" type="file" accept="image/jpeg,image/png,application/pdf"
                  onChange={handleLicenseDocChange} style={{ fontFamily: C.sans, fontSize: "0.9rem" }} />
              </div>

              <button type="submit" disabled={saving || !isAuthenticated || !photoIdFile || !licenseFile}
                style={{
                  background: (saving || !isAuthenticated || !photoIdFile || !licenseFile) ? C.sub : C.primary,
                  border: "none", color: C.white, fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 600,
                  padding: "12px 24px", borderRadius: 8,
                  cursor: (saving || !isAuthenticated || !photoIdFile || !licenseFile) ? "not-allowed" : "pointer",
                  width: "100%",
                }}>
                {saving ? "Submitting…" : "Create Agent Profile — Free"}
              </button>
            </form>
          </div>
        </div>
      )}

      {pageState === "pending" && profile && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: contentPad }}>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 24 : 36, boxShadow: C.shadow, marginBottom: 32 }}>
            <p style={LBL}>Status</p>
            <h2 style={{ fontFamily: C.sans, fontSize: "1.25rem", fontWeight: 700, color: C.text, marginBottom: 10 }}>Under Review</h2>
            <p style={{ fontFamily: C.sans, color: C.sub, lineHeight: 1.7 }}>
              Your application is pending BidToList verification. We review license numbers against the Florida DBPR database — you'll receive an email at <strong style={{ color: C.text }}>{profile.email}</strong> once approved.
            </p>
          </div>

          <p style={{ ...LBL, marginBottom: 20 }}>Submitted Info</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[
              ["Name", profile.name], ["Brokerage", profile.brokerage],
              ["License", profile.licenseNumber], ["County", profile.county],
              ["Phone", profile.phone], ["Email", profile.email],
            ].map(([label, value]) => (
              <div key={label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px" }}>
                <p style={{ ...LBL, marginBottom: 4 }}>{label}</p>
                <p style={{ fontFamily: C.sans, color: C.text, wordBreak: "break-word" }}>{value}</p>
              </div>
            ))}
          </div>
          {profile.serviceCities?.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <p style={{ ...LBL, marginBottom: 8 }}>Service Cities</p>
              <p style={{ fontFamily: C.sans, color: C.text }}>{profile.serviceCities.join(", ")}</p>
            </div>
          )}

          <p style={{ ...LBL, marginBottom: 20 }}>Need to correct something?</p>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 24 : 36, boxShadow: C.shadow }}>
            <form onSubmit={handleUpdate}>
              {field("Full Name", "name")}
              {field("Brokerage", "brokerage")}
              {field("Phone", "phone", "tel")}
              {field("Email", "email", "email")}
              <CitiesInput cities={serviceCities} onChange={setServiceCities} isMobile={isMobile} />
              <div style={{ marginBottom: 24 }}>
                <label style={LBL}>Bio</label>
                <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={3}
                  style={{ ...INP, resize: "vertical" }} />
              </div>
              <button type="submit" disabled={saving}
                style={{
                  background: saving ? C.sub : C.primary, border: "none", color: C.white,
                  fontFamily: C.sans, fontSize: "0.95rem", fontWeight: 600,
                  padding: "12px 24px", borderRadius: 8,
                  cursor: saving ? "not-allowed" : "pointer",
                  width: isMobile ? "100%" : "auto",
                }}>
                {saving ? "Saving…" : "Update Profile"}
              </button>
            </form>
          </div>
        </div>
      )}

      {pageState === "verified" && profile && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: contentPad }}>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? 24 : 36, boxShadow: C.shadow }}>
            <p style={LBL}>Status</p>
            <h2 style={{ fontFamily: C.sans, fontSize: "1.25rem", fontWeight: 700, color: C.text, marginBottom: 10 }}>Verified Agent</h2>
            <p style={{ fontFamily: C.sans, color: C.sub, lineHeight: 1.7, marginBottom: 24 }}>
              Your license has been verified. You can now browse FSBO listings and submit bids.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/agents/browse"
                style={{ background: C.primary, border: "none", color: C.white, fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 600, padding: "10px 22px", borderRadius: 8, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
                Browse Listings
              </a>
              <a href="/"
                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.sub, fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 500, padding: "10px 22px", borderRadius: 8, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
                Home
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
