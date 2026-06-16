import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { registerAgent, getMyAgentProfile, updateAgentProfile } from "../services/agent";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { FLORIDA_CITIES } from "../data/floridaCities";

const P = {
  navy:       "#142B4D",
  orange:     "#C66A2B",
  orangeLight:"#FBF0E9",
  orangeBdr:  "#E8C3A8",
  warmWhite:  "#FAF9F7",
  softGray:   "#E7E7E4",
  charcoal:   "#3B3B3B",
  white:      "#FFFFFF",
  border:     "#D9D6CF",
  sub:        "#6E6A63",
  green:      "#16A34A",
  greenBg:    "#F0FDF4",
  greenBdr:   "#BBF7D0",
  greenText:  "#166534",
  shadow:     "0 2px 8px rgba(20,43,77,0.07)",
  shadowMd:   "0 4px 16px rgba(20,43,77,0.10)",
  serif:      "'Playfair Display', Georgia, serif",
  sans:       "'Inter', 'IBM Plex Sans', system-ui, sans-serif",
  mono:       "'IBM Plex Mono', monospace",
};

const W_SIDEBAR = 240;
const W_RIGHT   = 264;
const FOOTER_H  = 72;

const MONO_BASE: React.CSSProperties = {
  fontFamily: P.mono, fontSize: "0.7rem", letterSpacing: "0.08em",
  textTransform: "uppercase", color: P.sub, display: "block", marginBottom: 6,
};

function monoStyle(overrides?: React.CSSProperties): React.CSSProperties {
  return { ...MONO_BASE, ...overrides };
}

const INP: React.CSSProperties = {
  border: `1px solid ${P.border}`,
  padding: "10px 14px",
  width: "100%",
  fontFamily: P.sans,
  fontSize: "0.95rem",
  background: P.white,
  color: P.charcoal,
  boxSizing: "border-box",
  outline: "none",
};

type PageState = "loading" | "form" | "pending" | "verified";

const INITIAL_FORM = {
  name: "", brokerage: "", licenseNumber: "", county: "Volusia",
  bio: "", phone: "", email: "",
};

const MAX_DOC_BYTES = 800 * 1024;
const MAX_CITIES    = 10;

// ─── CitiesInput ──────────────────────────────────────────────────────────────

function CitiesInput({
  cities, onChange, isMobile,
}: {
  cities: string[];
  onChange: (c: string[]) => void;
  isMobile: boolean;
}) {
  const [input, setInput] = useState("");
  const [open,  setOpen]  = useState(false);
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
      <label style={monoStyle()}>
        Cities I Serve
        <span style={{ color: P.sub, fontWeight: 400, marginLeft: 8 }}>
          {cities.length}/{MAX_CITIES} added
        </span>
      </label>

      {cities.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {cities.map((c, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: P.navy, color: P.white, fontFamily: P.sans,
              fontSize: "0.8rem", padding: "4px 10px",
            }}>
              {c}
              <button type="button" onClick={() => removeCity(i)}
                style={{ background: "none", border: "none", color: P.white, cursor: "pointer", padding: 0, lineHeight: 1, fontSize: "0.9rem" }}
                aria-label={`Remove ${c}`}>×</button>
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
            background: P.white, border: `1px solid ${P.border}`, borderTop: "none",
            margin: 0, padding: 0, listStyle: "none", maxHeight: 220, overflowY: "auto",
            boxShadow: P.shadowMd,
          }}>
            {suggestions.map(s => (
              <li key={s}
                onMouseDown={() => addCity(s)}
                style={{ padding: "10px 14px", fontFamily: P.sans, fontSize: "0.9rem", cursor: "pointer", borderBottom: `1px solid ${P.border}`, color: P.charcoal }}
                onMouseEnter={e => (e.currentTarget.style.background = P.warmWhite)}
                onMouseLeave={e => (e.currentTarget.style.background = P.white)}
              >{s}</li>
            ))}
          </ul>
        )}
      </div>
      <p style={{ fontFamily: P.sans, fontSize: "0.8rem", color: P.sub, marginTop: 6 }}>
        Enter/comma to add · backspace to remove last · max {MAX_CITIES}
      </p>
    </div>
  );
}

// ─── AgentUploadZone ──────────────────────────────────────────────────────────

function AgentUploadZone({
  id, accept, file, onChange, helpText,
}: {
  id: string;
  accept: string;
  file: File | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helpText: string;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); }}
      style={{
        position: "relative",
        border: `2px dashed ${dragging ? P.orange : file ? P.green : P.border}`,
        background: dragging ? P.orangeLight : file ? P.greenBg : P.warmWhite,
        padding: "20px 24px",
        textAlign: "center",
        transition: "border-color 0.15s, background 0.15s",
        cursor: "pointer",
      }}
    >
      {file ? (
        <div>
          <p style={{ fontFamily: P.sans, fontSize: "0.9rem", color: P.greenText, fontWeight: 600, marginBottom: 2 }}>
            ✓ {file.name}
          </p>
          <p style={{ fontFamily: P.mono, fontSize: "0.7rem", color: P.sub }}>
            {(file.size / 1024).toFixed(0)} KB · Click to replace
          </p>
        </div>
      ) : (
        <div>
          <p style={{ fontFamily: P.sans, fontSize: "0.9rem", color: P.charcoal, fontWeight: 500, marginBottom: 4 }}>
            Drop here or click to select
          </p>
          <p style={{ fontFamily: P.mono, fontSize: "0.68rem", color: P.sub, letterSpacing: "0.04em" }}>
            {helpText}
          </p>
        </div>
      )}
      {/* Transparent overlay — always in DOM so userEvent.upload reaches the input */}
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={onChange}
        style={{
          position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
          opacity: 0, cursor: "pointer", width: "100%", height: "100%",
        }}
      />
    </div>
  );
}

// ─── Sidebar nav step ─────────────────────────────────────────────────────────

function NavStep({ label, status }: { label: string; status: "done" | "active" | "future" }) {
  const color = status === "done" ? P.green : status === "active" ? P.white : "rgba(255,255,255,0.4)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 20px" }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
        background: status === "done" ? P.green : status === "active" ? P.orange : "rgba(255,255,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.65rem", color: P.white, fontWeight: 700,
      }}>
        {status === "done" ? "✓" : status === "active" ? "2" : "·"}
      </div>
      <span style={{ fontFamily: P.sans, fontSize: "0.85rem", color, fontWeight: status === "active" ? 600 : 400 }}>
        {label}
      </span>
    </div>
  );
}

// ─── Progress header step ─────────────────────────────────────────────────────

function ProgressStep({ label, num, status }: { label: string; num: number; status: "done" | "active" | "future" }) {
  const accent = status === "done" ? P.green : status === "active" ? P.orange : P.sub;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        background: status === "done" ? P.greenBg : status === "active" ? P.orangeLight : P.softGray,
        border: `2px solid ${accent}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: P.mono, fontSize: "0.75rem", color: accent, fontWeight: 700,
      }}>
        {status === "done" ? "✓" : num}
      </div>
      <span style={{ fontFamily: P.mono, fontSize: "0.63rem", letterSpacing: "0.06em", color: accent, textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );
}

// ─── Circular progress ring ───────────────────────────────────────────────────

function CircularProgress({ value, total }: { value: number; total: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = total > 0 ? (value / total) * circ : 0;
  return (
    <svg width={84} height={84} viewBox="0 0 84 84">
      <circle cx={42} cy={42} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={5} />
      <circle cx={42} cy={42} r={r} fill="none" stroke={P.orange} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ transition: "stroke-dasharray 0.4s" }} />
      <text x={42} y={46} textAnchor="middle" fontFamily={P.mono} fontSize={16} fontWeight={700} fill={P.white}>
        {value}/{total}
      </text>
    </svg>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AgentRegisterPage() {
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();
  const { isMobile } = useBreakpoint();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [profile, setProfile]     = useState<any>(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState(INITIAL_FORM);
  const [serviceCities, setServiceCities] = useState<string[]>([]);
  const [photoIdFile, setPhotoIdFile]     = useState<File | null>(null);
  const [licenseFile, setLicenseFile]     = useState<File | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { setPageState("form"); return; }
    getMyAgentProfile().then(p => {
      if (!p) { setPageState("form"); return; }
      setProfile(p);
      setForm({
        name: p.name ?? "", brokerage: p.brokerage ?? "",
        licenseNumber: p.licenseNumber ?? "", county: p.county ?? "Volusia",
        bio: p.bio ?? "", phone: p.phone ?? "", email: p.email ?? "",
      });
      setServiceCities(p.serviceCities ?? []);
      setPageState(p.isVerified ? "verified" : "pending");
    }).catch(() => setPageState("form"));
  }, [isAuthenticated, authLoading]);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function handlePhotoIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_DOC_BYTES) {
      toast.error("Photo ID must be under 800 KB");
      e.target.value = "";
      setPhotoIdFile(null);
      return;
    }
    setPhotoIdFile(file);
  }

  function handleLicenseDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_DOC_BYTES) {
      toast.error("License document must be under 800 KB");
      e.target.value = "";
      setLicenseFile(null);
      return;
    }
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
        <label style={monoStyle()}>{label}</label>
        <input type={type} value={(form as any)[key]} placeholder={placeholder}
          onChange={e => set(key, e.target.value)} style={INP} />
      </div>
    );
  }

  const docsDone      = (photoIdFile ? 1 : 0) + (licenseFile ? 1 : 0);
  const submitDisabled = saving || !isAuthenticated || !photoIdFile || !licenseFile;

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (pageState === "loading") {
    return (
      <div style={{ background: P.warmWhite, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: P.mono, fontSize: "0.75rem", color: P.sub, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Loading…
        </p>
      </div>
    );
  }

  // ── Verified ─────────────────────────────────────────────────────────────────

  if (pageState === "verified" && profile) {
    return (
      <div style={{ background: P.warmWhite, minHeight: "100vh" }}>
        <nav style={{ background: P.navy, height: 60, display: "flex", alignItems: "center", padding: "0 32px" }}>
          <img src="/logo.png" alt="BidToList" style={{ height: 28 }} />
        </nav>
        <div style={{ maxWidth: 600, margin: "60px auto", padding: isMobile ? "0 20px" : "0 24px" }}>
          <div style={{ background: P.white, border: `1px solid ${P.border}`, padding: isMobile ? 28 : 48, boxShadow: P.shadow }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: P.greenBg, border: `2px solid ${P.greenBdr}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.3rem", marginBottom: 20,
            }}>✓</div>
            <p style={monoStyle({ color: P.green, marginBottom: 8 })}>Status</p>
            <h2 style={{ fontFamily: P.serif, fontSize: "1.75rem", fontWeight: 700, color: P.navy, marginBottom: 12 }}>
              Verified Agent
            </h2>
            <p style={{ fontFamily: P.sans, color: P.sub, lineHeight: 1.7, marginBottom: 28 }}>
              Your license has been verified. You can now browse FSBO listings and submit bids.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/agents/browse"
                style={{
                  background: P.orange, color: P.white, fontFamily: P.sans, fontSize: "0.9rem",
                  fontWeight: 600, padding: "12px 28px", textDecoration: "none",
                  display: "inline-flex", alignItems: "center",
                  flex: isMobile ? "1 1 100%" : "0 0 auto",
                }}>
                Browse Listings
              </a>
              <a href="/"
                style={{
                  background: P.warmWhite, border: `1px solid ${P.border}`, color: P.sub,
                  fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 500, padding: "12px 28px",
                  textDecoration: "none", display: "inline-flex", alignItems: "center",
                  flex: isMobile ? "1 1 100%" : "0 0 auto",
                }}>
                Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Pending ──────────────────────────────────────────────────────────────────

  if (pageState === "pending" && profile) {
    return (
      <div style={{ background: P.warmWhite, minHeight: "100vh" }}>
        <nav style={{ background: P.navy, height: 60, display: "flex", alignItems: "center", padding: "0 32px" }}>
          <img src="/logo.png" alt="BidToList" style={{ height: 28 }} />
        </nav>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: isMobile ? "32px 20px 60px" : "48px 24px 80px" }}>

          <div style={{ background: P.white, border: `1px solid ${P.border}`, padding: isMobile ? 24 : 36, boxShadow: P.shadow, marginBottom: 24 }}>
            <p style={monoStyle({ marginBottom: 8 })}>Status</p>
            <h2 style={{ fontFamily: P.serif, fontSize: "1.5rem", fontWeight: 700, color: P.navy, marginBottom: 10 }}>
              Under Review
            </h2>
            <p style={{ fontFamily: P.sans, color: P.sub, lineHeight: 1.7 }}>
              Your application is pending BidToList verification. We review license numbers against the Florida DBPR database — you'll receive an email at{" "}
              <strong style={{ color: P.charcoal }}>{profile.email}</strong> once approved.
            </p>
          </div>

          <p style={monoStyle({ marginBottom: 16 })}>Submitted Info</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[
              ["Name",     profile.name],
              ["Brokerage",profile.brokerage],
              ["License",  profile.licenseNumber],
              ["County",   profile.county],
              ["Phone",    profile.phone],
              ["Email",    profile.email],
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ background: P.white, border: `1px solid ${P.border}`, padding: "12px 16px" }}>
                <p style={monoStyle({ marginBottom: 4 })}>{lbl}</p>
                <p style={{ fontFamily: P.sans, color: P.charcoal, wordBreak: "break-word" }}>{val}</p>
              </div>
            ))}
          </div>

          {profile.serviceCities?.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <p style={monoStyle({ marginBottom: 8 })}>Service Cities</p>
              <p style={{ fontFamily: P.sans, color: P.charcoal }}>{profile.serviceCities.join(", ")}</p>
            </div>
          )}

          <p style={monoStyle({ marginBottom: 16 })}>Need to correct something?</p>
          <div style={{ background: P.white, border: `1px solid ${P.border}`, padding: isMobile ? 24 : 36, boxShadow: P.shadow }}>
            <form onSubmit={handleUpdate}>
              {field("Full Name",  "name")}
              {field("Brokerage",  "brokerage")}
              {field("Phone",      "phone", "tel")}
              {field("Email",      "email", "email")}
              <CitiesInput cities={serviceCities} onChange={setServiceCities} isMobile={isMobile} />
              <div style={{ marginBottom: 24 }}>
                <label style={monoStyle()}>Bio</label>
                <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={3}
                  style={{ ...INP, resize: "vertical" }} />
              </div>
              <button type="submit" disabled={saving}
                style={{
                  background: saving ? P.sub : P.navy, border: "none", color: P.white,
                  fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 600,
                  padding: "12px 28px", cursor: saving ? "not-allowed" : "pointer",
                }}>
                {saving ? "Saving…" : "Update Profile"}
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: P.warmWhite, minHeight: "100vh" }}>

      {/* Left sidebar (desktop) */}
      {!isMobile && (
        <aside style={{
          width: W_SIDEBAR, background: P.navy,
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
          display: "flex", flexDirection: "column", overflowY: "auto",
        }}>
          <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <img src="/logo.png" alt="BidToList" style={{ height: 28 }} />
            <p style={{ fontFamily: P.sans, fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginTop: 10, lineHeight: 1.55 }}>
              Agents Compete.<br />Homeowners Win.
            </p>
          </div>

          <div style={{ padding: "20px 0", flex: 1 }}>
            <p style={{ fontFamily: P.mono, fontSize: "0.63rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", padding: "0 20px", marginBottom: 8 }}>
              Registration Steps
            </p>
            <NavStep label="Account Setup"      status="done"   />
            <NavStep label="Verify Credentials" status="active" />
            <NavStep label="Background Check"   status="future" />
            <NavStep label="Complete Profile"   status="future" />
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "16px 20px" }}>
            <div style={{ background: "rgba(255,255,255,0.06)", padding: "12px 14px", marginBottom: 12 }}>
              <p style={{ fontFamily: P.mono, fontSize: "0.63rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                Need Help?
              </p>
              <p style={{ fontFamily: P.sans, fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                support@bidtolist.com<br />
                (386) 555-0100
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.75rem" }}>🔒</span>
              <span style={{ fontFamily: P.mono, fontSize: "0.63rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
                256-bit encrypted
              </span>
            </div>
          </div>
        </aside>
      )}

      {/* Right panel (desktop) */}
      {!isMobile && (
        <aside style={{
          width: W_RIGHT, background: P.navy,
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 50,
          display: "flex", flexDirection: "column", overflowY: "auto",
          padding: "32px 20px", gap: 28,
        }}>
          <div style={{ textAlign: "center" }}>
            <CircularProgress value={docsDone} total={3} />
            <p style={{ fontFamily: P.mono, fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginTop: 10 }}>
              Verification Progress
            </p>
          </div>

          <div>
            <p style={{ fontFamily: P.mono, fontSize: "0.63rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>
              Why We Verify
            </p>
            {[
              { icon: "🏠", title: "Homeowner Trust",    body: "Sellers deserve to know their agent is licensed and reputable." },
              { icon: "⚖️", title: "FREC Compliance",   body: "All agents must hold a valid Florida real estate license." },
              { icon: "📋", title: "Transaction Safety", body: "Verified agents unlock bid submission and secure messaging." },
            ].map(({ icon, title, body }) => (
              <div key={title} style={{ marginBottom: 12, padding: "12px 14px", background: "rgba(255,255,255,0.05)", borderLeft: `3px solid ${P.orange}` }}>
                <p style={{ fontFamily: P.sans, fontSize: "0.84rem", fontWeight: 600, color: P.white, marginBottom: 4 }}>
                  {icon} {title}
                </p>
                <p style={{ fontFamily: P.sans, fontSize: "0.79rem", color: "rgba(255,255,255,0.58)", lineHeight: 1.5 }}>
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div style={{ padding: 14, background: "rgba(255,255,255,0.05)" }}>
            <p style={{ fontFamily: P.mono, fontSize: "0.63rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>
              Privacy
            </p>
            <p style={{ fontFamily: P.sans, fontSize: "0.79rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
              Your documents are encrypted at rest. Photo ID and license documents are reviewed only by BidToList staff and deleted after verification.
            </p>
          </div>
        </aside>
      )}

      {/* Center content */}
      <div style={{
        marginLeft:  isMobile ? 0 : W_SIDEBAR,
        marginRight: isMobile ? 0 : W_RIGHT,
        paddingBottom: FOOTER_H + 24,
      }}>
        {/* Progress header */}
        {!isMobile && (
          <div style={{
            background: P.white, borderBottom: `1px solid ${P.border}`,
            padding: "14px 40px", display: "flex", alignItems: "center",
            position: "sticky", top: 0, zIndex: 40,
          }}>
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
              <ProgressStep label="Account Setup"      num={1} status="done"   />
              <div style={{ width: 40, borderTop: `2px solid ${P.softGray}`, marginBottom: 22 }} />
              <ProgressStep label="Verify Credentials" num={2} status="active" />
              <div style={{ width: 40, borderTop: `2px solid ${P.softGray}`, marginBottom: 22 }} />
              <ProgressStep label="Background Check"   num={3} status="future" />
              <div style={{ width: 40, borderTop: `2px solid ${P.softGray}`, marginBottom: 22 }} />
              <ProgressStep label="Complete Profile"   num={4} status="future" />
            </div>
          </div>
        )}

        {/* Page heading */}
        <div style={{ padding: isMobile ? "28px 20px 0" : "40px 40px 0" }}>
          <p style={{ fontFamily: P.mono, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: P.orange, marginBottom: 6 }}>
            Agent Sign Up
          </p>
          <h1 style={{ fontFamily: P.serif, fontSize: isMobile ? "1.5rem" : "2rem", fontWeight: 700, color: P.navy, marginBottom: 6 }}>
            Verify Your Credentials
          </h1>
          <p style={{ fontFamily: P.sans, fontSize: "0.95rem", color: P.sub, marginBottom: 32, lineHeight: 1.6 }}>
            Free to join. $295 fee only when your bid is accepted.
          </p>

          {/* Unauthenticated banner */}
          {!isAuthenticated && (
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", padding: 20, marginBottom: 28 }}>
              <p style={{ fontFamily: P.sans, fontSize: "0.9rem", marginBottom: 12, color: P.charcoal }}>
                You must sign in with Internet Identity before registering.
              </p>
              <button onClick={login}
                style={{ background: P.navy, border: "none", color: P.white, fontFamily: P.sans, fontSize: "0.875rem", fontWeight: 600, padding: "10px 20px", cursor: "pointer" }}>
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Form */}
        <form id="agent-register-form" onSubmit={handleSubmit} style={{ padding: isMobile ? "0 20px" : "0 40px" }}>

          {/* Account info */}
          <div style={{ background: P.white, border: `1px solid ${P.border}`, padding: isMobile ? 24 : 32, boxShadow: P.shadow, marginBottom: 24 }}>
            <p style={{ fontFamily: P.mono, fontSize: "0.63rem", letterSpacing: "0.1em", textTransform: "uppercase", color: P.orange, marginBottom: 16, borderBottom: `1px solid ${P.border}`, paddingBottom: 10 }}>
              Account Information
            </p>
            {field("Full Name",       "name",          "text",  "Jane Smith")}
            {field("Brokerage",       "brokerage",     "text",  "Keller Williams Realty")}
            {field("FL License Number","licenseNumber", "text",  "SL3XXXXXX")}

            <div style={{ marginBottom: 20 }}>
              <label style={monoStyle()}>License State</label>
              <input value="FL" disabled style={{ ...INP, background: P.softGray, color: P.sub, cursor: "not-allowed" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={monoStyle()}>County Focus</label>
              <select value={form.county} onChange={e => set("county", e.target.value)} style={INP}>
                <option value="Volusia">Volusia County</option>
                <option value="Flagler">Flagler County</option>
                <option value="Both">Both Counties</option>
              </select>
            </div>

            <CitiesInput cities={serviceCities} onChange={setServiceCities} isMobile={isMobile} />
            {field("Phone", "phone", "tel",   "(386) 555-0100")}
            {field("Email", "email", "email", "jane@brokerage.com")}

            <div style={{ marginBottom: 0 }}>
              <label style={monoStyle()}>Bio (optional)</label>
              <textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={4}
                placeholder="Brief professional background, specialties, years in Volusia/Flagler market..."
                style={{ ...INP, resize: "vertical" }} />
            </div>
          </div>

          {/* Credential documents */}
          <div style={{ background: P.white, border: `1px solid ${P.border}`, padding: isMobile ? 24 : 32, boxShadow: P.shadow, marginBottom: 24 }}>
            <p style={{ fontFamily: P.mono, fontSize: "0.63rem", letterSpacing: "0.1em", textTransform: "uppercase", color: P.orange, marginBottom: 16, borderBottom: `1px solid ${P.border}`, paddingBottom: 10 }}>
              Credential Documents
            </p>

            <div style={{ marginBottom: 28 }}>
              <label htmlFor="licenseDocInput" style={monoStyle({ marginBottom: 8 })}>
                State-Issued Agent License <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <p style={{ fontFamily: P.sans, fontSize: "0.85rem", color: P.sub, marginBottom: 10 }}>
                Florida DBPR license document — JPG, PNG, or PDF, max 800 KB
              </p>
              <AgentUploadZone
                id="licenseDocInput"
                accept="image/jpeg,image/png,application/pdf"
                file={licenseFile}
                onChange={handleLicenseDocChange}
                helpText="JPG · PNG · PDF · max 800 KB"
              />
            </div>

            <div>
              <label htmlFor="photoIdInput" style={monoStyle({ marginBottom: 8 })}>
                State-Issued Photo ID <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <p style={{ fontFamily: P.sans, fontSize: "0.85rem", color: P.sub, marginBottom: 10 }}>
                Driver's license or passport — JPG, PNG, or PDF, max 800 KB
              </p>
              <AgentUploadZone
                id="photoIdInput"
                accept="image/jpeg,image/png,image/heic,application/pdf"
                file={photoIdFile}
                onChange={handlePhotoIdChange}
                helpText="JPG · PNG · HEIC · PDF · max 800 KB"
              />
            </div>
          </div>

        </form>
      </div>

      {/* Sticky footer */}
      <div style={{
        position: "fixed", bottom: 0,
        left:  isMobile ? 0 : W_SIDEBAR,
        right: isMobile ? 0 : W_RIGHT,
        height: FOOTER_H,
        background: P.white, borderTop: `1px solid ${P.border}`,
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        padding: "0 32px", gap: 12, zIndex: 30,
        boxShadow: "0 -2px 8px rgba(20,43,77,0.06)",
      }}>
        <button type="button"
          style={{ background: "none", border: `1px solid ${P.border}`, color: P.sub, fontFamily: P.sans, fontSize: "0.875rem", fontWeight: 500, padding: "10px 20px", cursor: "pointer" }}>
          Save and Finish Later
        </button>
        <button
          type="submit"
          form="agent-register-form"
          disabled={submitDisabled}
          style={{
            background: submitDisabled ? P.sub : P.orange,
            border: "none", color: P.white,
            fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 600,
            padding: "12px 28px", cursor: submitDisabled ? "not-allowed" : "pointer",
            opacity: submitDisabled ? 0.7 : 1,
          }}
        >
          {saving ? "Submitting…" : "Create Agent Profile — Free"}
        </button>
      </div>

    </div>
  );
}
