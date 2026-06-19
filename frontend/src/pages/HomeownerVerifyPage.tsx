import { useRef, useState, type DragEvent } from "react";
import toast from "react-hot-toast";
import { requestHomeownerVerification, uploadVerificationDoc, type DocType } from "../services/listing";
import { useBreakpoint } from "../hooks/useBreakpoint";

const MAX_DOC_BYTES = 819_200; // 800 KB — matches canister limit

// ── Palette ───────────────────────────────────────────────────────────────────

const P = {
  navy:        "#142B4D",
  orange:      "#C66A2B",
  orangeLight: "#FBF0E9",
  orangeBdr:   "#E8C3A8",
  warmWhite:   "#FAF9F7",
  softGray:    "#E7E7E4",
  charcoal:    "#3B3B3B",
  white:       "#FFFFFF",
  border:      "#D9D6CF",
  sub:         "#6E6A63",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  greenBdr:    "#BBF7D0",
  greenText:   "#166534",
  shadow:      "0 2px 8px rgba(20,43,77,0.07)",
  shadowMd:    "0 6px 20px rgba(20,43,77,0.10)",
  serif:       "'Playfair Display', Georgia, serif",
  sans:        "'Inter', 'IBM Plex Sans', system-ui, sans-serif",
  mono:        "'IBM Plex Mono', monospace",
};

// ── Shared label style ────────────────────────────────────────────────────────

const LBL: React.CSSProperties = {
  fontFamily: P.mono, fontSize: "0.68rem", letterSpacing: "0.08em",
  textTransform: "uppercase", color: P.sub, display: "block", marginBottom: 6,
};

const INP: React.CSSProperties = {
  border: `1px solid ${P.border}`, borderRadius: 8, padding: "10px 12px",
  width: "100%", fontFamily: P.sans, fontSize: "0.9rem",
  background: P.white, color: P.charcoal, boxSizing: "border-box",
};

// ── Upload zone ───────────────────────────────────────────────────────────────

function UploadZone({
  id, accept = ".pdf,.jpg,.jpeg,.png", preview, fileName, onFile, onRemove, helpText,
}: {
  id: string; accept?: string; preview: string | null; fileName: string;
  onFile: (f: File) => void | Promise<void>; onRemove: () => void; helpText?: string;
}) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  function pick(f: File) { onFile(f); }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0]; if (f) pick(f);
  }

  if (preview) {
    const isImg = preview.startsWith("data:image");
    return (
      <div style={{ border: `1px solid ${P.greenBdr}`, borderRadius: 12, padding: "14px 16px", background: P.greenBg, display: "flex", alignItems: "center", gap: 14 }}>
        {isImg
          ? <img src={preview} alt="preview" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: `1px solid ${P.border}`, flexShrink: 0 }} />
          : <div style={{ width: 60, height: 60, background: P.warmWhite, border: `1px solid ${P.border}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={P.navy} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={P.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontFamily: P.sans, fontSize: "0.82rem", fontWeight: 700, color: P.greenText }}>Uploaded</span>
          </div>
          <p style={{ fontFamily: P.sans, fontSize: "0.73rem", color: P.sub, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{fileName}</p>
        </div>
        <button type="button" onClick={onRemove}
          style={{ fontFamily: P.sans, fontSize: "0.73rem", color: P.sub, background: "none", border: `1px solid ${P.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", flexShrink: 0 }}>
          Replace
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => ref.current?.click()}
        style={{ border: `2px dashed ${drag ? P.orange : P.border}`, borderRadius: 12, padding: "28px 20px", textAlign: "center", background: drag ? P.orangeLight : P.warmWhite, cursor: "pointer", transition: "all 0.15s" }}
      >
        <input ref={ref} id={id} type="file" accept={accept} style={{ display: "none" }} onChange={e => e.target.files?.[0] && pick(e.target.files[0])} />
        <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={drag ? P.orange : P.sub} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 10px", display: "block" }}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p style={{ fontFamily: P.sans, fontSize: "0.875rem", color: P.charcoal, fontWeight: 500, margin: "0 0 4px" }}>Drag & drop here</p>
        <p style={{ fontFamily: P.sans, fontSize: "0.78rem", color: P.sub, margin: "0 0 12px" }}>or</p>
        <span style={{ display: "inline-block", border: `1px solid ${P.border}`, borderRadius: 6, padding: "7px 18px", fontFamily: P.sans, fontSize: "0.82rem", fontWeight: 500, color: P.charcoal, background: P.white }}>
          Choose File
        </span>
        <p style={{ fontFamily: P.sans, fontSize: "0.72rem", color: P.sub, margin: "10px 0 0" }}>PDF, JPG, PNG up to 10MB</p>
      </div>
      {helpText && <p style={{ fontFamily: P.sans, fontSize: "0.75rem", color: P.sub, margin: "8px 0 0", lineHeight: 1.5 }}>{helpText}</p>}
    </div>
  );
}

// ── Circular progress ring ────────────────────────────────────────────────────

function CircularProgress({ value, total }: { value: number; total: number }) {
  const r = 38, circ = 2 * Math.PI * r;
  const dash = (value / total) * circ;
  const full = value === total;
  return (
    <svg width={96} height={96} viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke={P.softGray} strokeWidth={8} />
      <circle cx="48" cy="48" r={r} fill="none" stroke={full ? P.green : P.navy} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dasharray 0.35s ease" }} />
      <text x="48" y="45" textAnchor="middle" style={{ fontFamily: P.mono, fontSize: "16px", fontWeight: 700, fill: P.navy }}>{value}/{total}</text>
      <text x="48" y="60" textAnchor="middle" style={{ fontFamily: P.sans, fontSize: "10px", fill: P.sub }}>Complete</text>
    </svg>
  );
}

// ── Step number chip ──────────────────────────────────────────────────────────

function StepNum({ n, done }: { n: number; done: boolean }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: done ? P.green : P.navy, color: P.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.88rem", fontWeight: 700, flexShrink: 0 }}>
      {done
        ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={P.white} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        : n}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HomeownerVerifyPage() {
  const { isMobile } = useBreakpoint();

  // Core form fields (passed to backend)
  const [form, setForm]   = useState({ address: "", parcelNumber: "", contactEmail: "" });
  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  // File uploads (frontend-only previews)
  const [photoId,    setPhotoId]    = useState<{ file: File; preview: string; name: string } | null>(null);
  const [ownership,  setOwnership]  = useState<{ file: File; preview: string; name: string } | null>(null);
  const [selfie,     setSelfie]     = useState<{ file: File; preview: string; name: string } | null>(null);
  const [authDoc,    setAuthDoc]    = useState<{ file: File; preview: string; name: string } | null>(null);
  const [ownerType,  setOwnerType]  = useState<"owner" | "rep" | "poa">("owner");

  const [saving,    setSaving]    = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  type DocStatus = "uploading" | "done" | "error";
  const [docUploads, setDocUploads] = useState<Record<string, DocStatus>>({});

  const cameraRef = useRef<HTMLInputElement>(null);

  function readFile(file: File, cb: (res: { file: File; preview: string; name: string }) => void) {
    const reader = new FileReader();
    reader.onload = e => cb({ file, preview: e.target?.result as string, name: file.name });
    reader.readAsDataURL(file);
  }

  // Compress a JPEG/PNG image to fit within maxBytes using Canvas.
  // Scales dimensions down to 1920px on the long edge first, then iteratively
  // reduces JPEG quality (0.85 → 0.30) and halves dimensions until it fits.
  // Returns null if compression cannot get the file small enough.
  function compressImage(file: File, maxBytes: number): Promise<File | null> {
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX_DIM = 1920;
        let baseW = img.naturalWidth;
        let baseH = img.naturalHeight;
        if (baseW > MAX_DIM || baseH > MAX_DIM) {
          const r = Math.min(MAX_DIM / baseW, MAX_DIM / baseH);
          baseW = Math.round(baseW * r);
          baseH = Math.round(baseH * r);
        }
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const attempt = (quality: number, dimScale: number) => {
          const w = Math.round(baseW * dimScale);
          const h = Math.round(baseH * dimScale);
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(blob => {
            if (!blob) { resolve(null); return; }
            if (blob.size <= maxBytes) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
            } else if (quality > 0.3) {
              attempt(quality - 0.15, dimScale);
            } else if (dimScale > 0.25) {
              attempt(0.7, dimScale * 0.5);
            } else {
              resolve(null);
            }
          }, "image/jpeg", quality);
        };
        attempt(0.85, 1);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  // Validate and optionally compress a file before setting it into state.
  // Images (JPEG/PNG) are silently compressed; PDFs and HEIC reject with a toast if over limit.
  async function processFile(
    file: File,
    setter: (r: { file: File; preview: string; name: string }) => void
  ) {
    const isCompressible = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
    if (file.size <= MAX_DOC_BYTES) { readFile(file, setter); return; }
    if (isCompressible) {
      const compressed = await compressImage(file, MAX_DOC_BYTES);
      if (compressed) { readFile(compressed, setter); return; }
      toast.error("Could not compress this image enough. Please use a clearer, smaller photo.");
    } else {
      const mb = (file.size / 1_048_576).toFixed(1);
      toast.error(`File is ${mb} MB — must be under 800 KB. Please compress or scan at lower resolution.`);
    }
  }

  const checklist = [
    { label: "Photo ID",             done: !!photoId },
    { label: "Proof of Ownership",   done: !!ownership },
    { label: "Selfie Verification",  done: !!selfie },
    { label: "Email Verification",   done: !!form.contactEmail },
    { label: "Ownership Declaration", done: true },
  ];
  const doneCount = checklist.filter(c => c.done).length;
  const allDone   = doneCount === checklist.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await requestHomeownerVerification(form.address, form.parcelNumber, form.contactEmail) as any;
      if ("err" in result) { toast.error(JSON.stringify(result.err)); return; }
      const rid: string = result.ok.id;
      setRequestId(rid);
      setSubmitted(true);      // show success screen immediately
      uploadDocsAsync(rid);    // fire-and-forget; errors shown on success screen
    } finally { setSaving(false); }
  }

  function buildDocList() {
    const docs: Array<{ key: DocType; label: string; file: File }> = [];
    if (photoId?.file)   docs.push({ key: "photoId",          label: "Photo ID",            file: photoId.file });
    if (ownership?.file) docs.push({ key: "ownershipProof",   label: "Proof of Ownership",  file: ownership.file });
    if (selfie?.file)    docs.push({ key: "selfie",           label: "Selfie",              file: selfie.file });
    if (authDoc?.file)   docs.push({ key: "authorizationDoc", label: "Authorization Doc",   file: authDoc.file });
    return docs;
  }

  async function uploadDocsAsync(rid: string) {
    const docs = buildDocList();
    if (docs.length === 0) return;
    const initial: Record<string, DocStatus> = {};
    for (const d of docs) initial[d.key] = "uploading";
    setDocUploads(initial);
    for (const { key, file } of docs) {
      try {
        const res = await uploadVerificationDoc(rid, key, file) as any;
        setDocUploads(u => ({ ...u, [key]: ("err" in res) ? "error" : "done" }));
      } catch {
        setDocUploads(u => ({ ...u, [key]: "error" }));
      }
    }
  }

  async function retryDocUpload(key: DocType, file: File) {
    if (!requestId) return;
    setDocUploads(u => ({ ...u, [key]: "uploading" }));
    try {
      const res = await uploadVerificationDoc(requestId, key, file) as any;
      setDocUploads(u => ({ ...u, [key]: ("err" in res) ? "error" : "done" }));
    } catch {
      setDocUploads(u => ({ ...u, [key]: "error" }));
    }
  }

  // ── Success ────────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: P.warmWhite }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <nav style={{ background: P.white, borderBottom: `1px solid ${P.border}`, padding: "0 32px", height: 64, display: "flex", alignItems: "center", boxShadow: P.shadow }}>
          <a href="/"><img src="/logo.png" alt="BidToList" style={{ height: 32, display: "block" }} /></a>
        </nav>
        <div style={{ maxWidth: 560, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: P.greenBg, border: `2px solid ${P.greenBdr}`, margin: "0 auto 28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={P.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 style={{ fontFamily: P.serif, fontSize: "2rem", fontWeight: 700, color: P.navy, marginBottom: 10 }}>Request Submitted</h1>
          <p style={{ fontFamily: P.sans, fontSize: "0.95rem", color: P.sub, lineHeight: 1.7, marginBottom: 32 }}>
            We'll review your information and notify you at <strong style={{ color: P.charcoal }}>{form.contactEmail}</strong> within 24 hours.
          </p>
          {/* Document upload status — only rendered when files were selected */}
          {Object.keys(docUploads).length > 0 && (() => {
            const allDocs = buildDocList();
            const anyError = allDocs.some(d => docUploads[d.key] === "error");
            return (
              <div style={{ background: P.white, border: `1px solid ${anyError ? P.orangeBdr : P.greenBdr}`, borderRadius: 16, padding: "20px 24px", marginBottom: 20, textAlign: "left", boxShadow: P.shadow }}>
                <p style={{ fontFamily: P.mono, fontSize: "0.68rem", fontWeight: 700, color: P.navy, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Document Uploads</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {allDocs.map(({ key, label, file }) => {
                    const status = docUploads[key] ?? "uploading";
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {status === "done" && (
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={P.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                        {status === "uploading" && (
                          <div style={{ width: 14, height: 14, border: `2px solid ${P.navy}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        )}
                        {status === "error" && (
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        )}
                        <span style={{ fontFamily: P.sans, fontSize: "0.82rem", color: status === "error" ? "#EF4444" : status === "done" ? P.greenText : P.charcoal, flex: 1 }}>
                          {label}
                        </span>
                        {status === "error" && (
                          <button type="button" onClick={() => retryDocUpload(key, file)}
                            style={{ fontFamily: P.sans, fontSize: "0.72rem", color: P.orange, background: "none", border: `1px solid ${P.orangeBdr}`, borderRadius: 4, padding: "3px 8px", cursor: "pointer" }}>
                            Retry
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {anyError && (
                  <p style={{ fontFamily: P.sans, fontSize: "0.78rem", color: P.sub, margin: "12px 0 0", lineHeight: 1.5 }}>
                    Documents marked above failed to upload. Retry them here — your verification request has already been received.
                  </p>
                )}
              </div>
            );
          })()}

          <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 16, padding: "24px 28px", marginBottom: 28, textAlign: "left", boxShadow: P.shadow }}>
            <p style={{ fontFamily: P.mono, fontSize: "0.7rem", fontWeight: 700, color: P.navy, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>What happens next</p>
            {["Agents begin reviewing your listing.", "You'll receive notifications as proposals arrive.", "Compare proposals side-by-side.", "Choose the agent that's right for you."].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 3 ? 12 : 0 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: P.navy, color: P.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <p style={{ fontFamily: P.sans, fontSize: "0.875rem", color: P.charcoal, margin: 0, lineHeight: 1.5 }}>{t}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <a href="/my-bids" style={{ background: P.orange, color: P.white, padding: "13px 28px", borderRadius: 8, fontFamily: P.sans, fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}>View My Dashboard</a>
            <a href="/post"    style={{ background: P.white, color: P.charcoal, padding: "13px 28px", borderRadius: 8, fontFamily: P.sans, fontWeight: 500, textDecoration: "none", fontSize: "0.9rem", border: `1px solid ${P.border}` }}>View My Listing</a>
          </div>
        </div>
      </div>
    );
  }

  // ── Main layout ────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: P.warmWhite, fontFamily: P.sans, paddingBottom: 96 }}>

      {/* Nav */}
      <nav style={{ background: P.white, borderBottom: `1px solid ${P.border}`, padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: P.shadow }}>
        <a href="/"><img src="/logo.png" alt="BidToList" style={{ height: 32, display: "block" }} /></a>
        <a href="/post" style={{ fontFamily: P.sans, fontSize: "0.875rem", color: P.sub, textDecoration: "none" }}>← Post a Listing</a>
      </nav>

      {/* Progress bar */}
      <div style={{ background: P.white, borderBottom: `1px solid ${P.border}`, padding: "16px 32px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center" }}>
          {/* Step 1 — done */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: P.green, color: P.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={P.white} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span style={{ fontFamily: P.sans, fontSize: "0.85rem", color: P.sub }}>Create Listing</span>
          </div>
          <div style={{ flex: 1, height: 2, background: P.navy, margin: "0 10px" }} />
          {/* Step 2 — current */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: P.orange, color: P.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.82rem", fontWeight: 700 }}>2</div>
            <span style={{ fontFamily: P.sans, fontSize: "0.85rem", color: P.navy, fontWeight: 700, borderBottom: `2px solid ${P.orange}`, paddingBottom: 1 }}>Verify Ownership</span>
          </div>
          <div style={{ flex: 1, height: 2, background: P.softGray, margin: "0 10px" }} />
          {/* Step 3 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: P.softGray, color: P.sub, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.82rem", fontWeight: 700 }}>3</div>
            <span style={{ fontFamily: P.sans, fontSize: "0.85rem", color: P.sub }}>Receive Proposals</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: isMobile ? "24px 16px" : "36px 32px", display: isMobile ? "block" : "flex", gap: 28, alignItems: "flex-start" }}>

        {/* LEFT — trust column */}
        {!isMobile && (
          <div style={{ flex: "0 0 210px", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { title: "Protect Homeowners", desc: "Prevent unauthorized listings.",
                icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={P.orange} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
              { title: "Protect Agents", desc: "Ensure agents invest time on legitimate opportunities.",
                icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={P.orange} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
              { title: "Build Trust", desc: "Create a safer marketplace for everyone.",
                icon: <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={P.orange} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> },
            ].map(({ title, desc, icon }) => (
              <div key={title} style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, padding: "14px 16px", boxShadow: P.shadow }}>
                <div style={{ marginBottom: 8 }}>{icon}</div>
                <p style={{ fontFamily: P.sans, fontSize: "0.82rem", fontWeight: 700, color: P.navy, margin: "0 0 4px" }}>{title}</p>
                <p style={{ fontFamily: P.sans, fontSize: "0.75rem", color: P.sub, margin: 0, lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}

            {/* Luxury home image placeholder */}
            <div style={{ borderRadius: 16, overflow: "hidden", height: 190, background: "linear-gradient(155deg,#0A1628 0%,#142B4D 55%,#1E3A6E 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: P.shadowMd, position: "relative" }}>
              <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <p style={{ fontFamily: P.serif, fontSize: "0.88rem", color: "rgba(255,255,255,0.6)", fontStyle: "italic", margin: 0, textAlign: "center", padding: "0 16px" }}>Protecting your listing.</p>
            </div>

            {/* Help */}
            <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 12, padding: "14px 16px", boxShadow: P.shadow }}>
              <p style={{ fontFamily: P.sans, fontSize: "0.82rem", fontWeight: 700, color: P.navy, margin: "0 0 4px" }}>Need help?</p>
              <p style={{ fontFamily: P.sans, fontSize: "0.75rem", color: P.sub, margin: "0 0 6px" }}>Our team is here to assist you.</p>
              <a href="mailto:support@bidtolist.com" style={{ fontFamily: P.sans, fontSize: "0.75rem", color: P.orange, textDecoration: "none" }}>support@bidtolist.com</a>
              <p style={{ fontFamily: P.sans, fontSize: "0.72rem", color: P.sub, margin: "4px 0 0" }}>We typically reply within a few hours.</p>
            </div>
          </div>
        )}

        {/* CENTER — form */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Page header */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: P.serif, fontSize: isMobile ? "1.6rem" : "2rem", fontWeight: 700, color: P.navy, margin: "0 0 8px" }}>
              Verify Your Homeownership
            </h1>
            <p style={{ fontFamily: P.sans, fontSize: "0.9rem", color: P.sub, margin: "0 0 16px", lineHeight: 1.65 }}>
              A few quick steps confirm ownership and help us protect everyone on BidToList.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                [<svg key="s" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={P.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, "Secure"],
                [<svg key="p" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={P.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>, "Private"],
                [<svg key="e" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={P.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, "Encrypted"],
                [<svg key="t" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={P.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, "Typically under 5 minutes"],
              ].map(([icon, label]) => (
                <span key={String(label)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: P.white, border: `1px solid ${P.border}`, borderRadius: 9999, padding: "5px 12px", fontFamily: P.sans, fontSize: "0.75rem", color: P.charcoal, boxShadow: P.shadow }}>
                  {icon} {label}
                </span>
              ))}
            </div>
          </div>

          <form id="verify-form" onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* STEP 1 — Photo ID */}
              <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 16, padding: isMobile ? 20 : 28, boxShadow: P.shadow }}>
                <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                  <StepNum n={1} done={!!photoId} />
                  <div>
                    <h2 style={{ fontFamily: P.sans, fontSize: "1rem", fontWeight: 700, color: P.navy, margin: "0 0 3px" }}>Government-Issued Photo ID</h2>
                    <p style={{ fontFamily: P.sans, fontSize: "0.8rem", color: P.sub, margin: 0 }}>Driver's license, passport, or state ID</p>
                  </div>
                </div>
                <UploadZone
                  id="upload-photo-id" preview={photoId?.preview ?? null} fileName={photoId?.name ?? ""}
                  onFile={f => processFile(f, setPhotoId)}
                  onRemove={() => setPhotoId(null)}
                  helpText="Your ID is encrypted and only used for verification purposes."
                />
              </div>

              {/* STEP 2 — Proof of Ownership */}
              <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 16, padding: isMobile ? 20 : 28, boxShadow: P.shadow }}>
                <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                  <StepNum n={2} done={!!ownership && !!form.address && !!form.parcelNumber} />
                  <div>
                    <h2 style={{ fontFamily: P.sans, fontSize: "1rem", fontWeight: 700, color: P.navy, margin: "0 0 3px" }}>Proof of Property Ownership</h2>
                    <p style={{ fontFamily: P.sans, fontSize: "0.8rem", color: P.sub, margin: 0 }}>Utility bill, tax statement, mortgage statement, insurance, or HOA statement</p>
                  </div>
                </div>

                {/* Address + Parcel fields */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div>
                    <label htmlFor="field-address" style={LBL}>Street Address</label>
                    <input id="field-address" type="text" value={form.address} onChange={e => setF("address", e.target.value)}
                      placeholder="123 Main St, Daytona Beach, FL 32118" style={INP} required />
                  </div>
                  <div>
                    <label htmlFor="field-parcelNumber" style={LBL}>Parcel Number</label>
                    <input id="field-parcelNumber" type="text" value={form.parcelNumber} onChange={e => setF("parcelNumber", e.target.value)}
                      placeholder="7001-00-00-0010" style={INP} required />
                  </div>
                </div>

                {/* County lookup */}
                <div style={{ background: "#EBF0F7", border: "1px solid #BFD0E8", borderRadius: 8, padding: "10px 14px", marginBottom: 18 }}>
                  <p style={{ fontFamily: P.sans, fontSize: "0.78rem", color: P.navy, margin: 0 }}>
                    Find your parcel — <strong>Volusia County:</strong>{" "}
                    <a href="https://vcpa.vcgov.org" target="_blank" rel="noopener noreferrer" style={{ color: P.orange }}>vcpa.vcgov.org</a>
                    {" · "}
                    <strong>Flagler County:</strong>{" "}
                    <a href="https://flaglerpa.com" target="_blank" rel="noopener noreferrer" style={{ color: P.orange }}>flaglerpa.com</a>
                  </p>
                </div>

                <UploadZone
                  id="upload-ownership" preview={ownership?.preview ?? null} fileName={ownership?.name ?? ""}
                  onFile={f => processFile(f, setOwnership)}
                  onRemove={() => setOwnership(null)}
                  helpText="Name and property address should match your listing information."
                />
              </div>

              {/* STEP 3 — Selfie */}
              <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 16, padding: isMobile ? 20 : 28, boxShadow: P.shadow }}>
                <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                  <StepNum n={3} done={!!selfie} />
                  <div>
                    <h2 style={{ fontFamily: P.sans, fontSize: "1rem", fontWeight: 700, color: P.navy, margin: "0 0 3px" }}>Selfie Verification</h2>
                    <p style={{ fontFamily: P.sans, fontSize: "0.8rem", color: P.sub, margin: 0 }}>Take a selfie to match your photo ID for added security</p>
                  </div>
                </div>

                {selfie ? (
                  <div style={{ border: `1px solid ${P.greenBdr}`, borderRadius: 12, padding: "14px 16px", background: P.greenBg, display: "flex", alignItems: "center", gap: 14 }}>
                    <img src={selfie.preview} alt="Selfie preview" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: "50%", border: `2px solid ${P.greenBdr}`, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={P.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ fontFamily: P.sans, fontSize: "0.82rem", fontWeight: 700, color: P.greenText }}>Selfie Uploaded</span>
                      </div>
                      <p style={{ fontFamily: P.sans, fontSize: "0.73rem", color: P.sub, margin: 0 }}>This image is used solely for verification.</p>
                    </div>
                    <button type="button" onClick={() => setSelfie(null)}
                      style={{ fontFamily: P.sans, fontSize: "0.73rem", color: P.sub, background: "none", border: `1px solid ${P.border}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}>
                      Replace
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
                      {["We'll match your selfie to your ID", "Helps prevent unauthorized listings", "Never shared with agents"].map(t => (
                        <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={P.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          <span style={{ fontFamily: P.sans, fontSize: "0.8rem", color: P.charcoal }}>{t}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <input ref={cameraRef} type="file" accept="image/*" capture={"user" as any} style={{ display: "none" }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f, setSelfie); }} />
                      <button type="button" onClick={() => cameraRef.current?.click()}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flex: 1, background: P.navy, border: "none", color: P.white, fontFamily: P.sans, fontSize: "0.875rem", fontWeight: 600, padding: "12px 0", borderRadius: 8, cursor: "pointer" }}>
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        Take Photo
                      </button>
                      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flex: 1, background: "none", border: `1.5px solid ${P.border}`, color: P.charcoal, fontFamily: P.sans, fontSize: "0.875rem", fontWeight: 500, padding: "12px 0", borderRadius: 8, cursor: "pointer" }}>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f, setSelfie); }} />
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Upload Photo
                      </label>
                    </div>
                    <p style={{ fontFamily: P.sans, fontSize: "0.73rem", color: P.sub, margin: "10px 0 0", textAlign: "center" }}>This image is used solely for verification.</p>
                  </div>
                )}
              </div>

              {/* STEP 4 — Email */}
              <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 16, padding: isMobile ? 20 : 28, boxShadow: P.shadow }}>
                <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                  <StepNum n={4} done={!!form.contactEmail} />
                  <div>
                    <h2 style={{ fontFamily: P.sans, fontSize: "1rem", fontWeight: 700, color: P.navy, margin: "0 0 3px" }}>Verify Contact Information</h2>
                    <p style={{ fontFamily: P.sans, fontSize: "0.8rem", color: P.sub, margin: 0 }}>Confirm your email address</p>
                  </div>
                </div>
                <label htmlFor="field-contactEmail" style={LBL}>Contact Email</label>
                <input id="field-contactEmail" type="email" value={form.contactEmail} onChange={e => setF("contactEmail", e.target.value)}
                  placeholder="you@example.com" style={INP} required />
                <p style={{ fontFamily: P.sans, fontSize: "0.75rem", color: P.sub, margin: "8px 0 0" }}>
                  We'll use this email to notify you when agents submit proposals.
                </p>
              </div>

              {/* STEP 5 — Declaration */}
              <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 16, padding: isMobile ? 20 : 28, boxShadow: P.shadow }}>
                <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                  <StepNum n={5} done={true} />
                  <div>
                    <h2 style={{ fontFamily: P.sans, fontSize: "1rem", fontWeight: 700, color: P.navy, margin: "0 0 3px" }}>Ownership Declaration</h2>
                    <p style={{ fontFamily: P.sans, fontSize: "0.8rem", color: P.sub, margin: 0 }}>Confirm your relationship to the property</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {([["owner", "I am the owner of this property"], ["rep", "I am an authorized representative"], ["poa", "I am acting under power of attorney"]] as const).map(([val, label]) => (
                    <label key={val} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px 16px", border: `1.5px solid ${ownerType === val ? P.navy : P.border}`, borderRadius: 10, background: ownerType === val ? "#EBF0F7" : P.warmWhite, transition: "all 0.15s" }}>
                      <input type="radio" name="ownerType" value={val} checked={ownerType === val} onChange={() => setOwnerType(val)}
                        style={{ accentColor: P.navy, width: 16, height: 16 }} />
                      <span style={{ fontFamily: P.sans, fontSize: "0.875rem", color: P.charcoal }}>{label}</span>
                    </label>
                  ))}
                </div>

                {(ownerType === "rep" || ownerType === "poa") && (
                  <div style={{ marginTop: 20, padding: "20px", background: P.warmWhite, border: `1px solid ${P.border}`, borderRadius: 12 }}>
                    <p style={{ fontFamily: P.sans, fontSize: "0.85rem", fontWeight: 700, color: P.navy, margin: "0 0 4px" }}>Upload Authorization Documentation</p>
                    <p style={{ fontFamily: P.sans, fontSize: "0.78rem", color: P.sub, margin: "0 0 14px" }}>Power of attorney, estate, or trustee documentation</p>
                    <UploadZone
                      id="upload-auth" preview={authDoc?.preview ?? null} fileName={authDoc?.name ?? ""}
                      onFile={f => processFile(f, setAuthDoc)}
                      onRemove={() => setAuthDoc(null)}
                    />
                  </div>
                )}
              </div>

            </div>
          </form>
        </div>

        {/* RIGHT — sidebar */}
        {!isMobile && (
          <div style={{ flex: "0 0 256px", display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 88 }}>

            {/* Checklist */}
            <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 16, padding: 22, boxShadow: P.shadow }}>
              <h2 style={{ fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 700, color: P.navy, margin: "0 0 16px" }}>Verification Checklist</h2>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <CircularProgress value={doneCount} total={checklist.length} />
              </div>
              {allDone && (
                <div style={{ background: P.greenBg, border: `1px solid ${P.greenBdr}`, borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                  <p style={{ fontFamily: P.sans, fontSize: "0.8rem", fontWeight: 600, color: P.greenText, margin: "0 0 2px" }}>All required items completed</p>
                  <p style={{ fontFamily: P.sans, fontSize: "0.73rem", color: P.greenText, margin: 0 }}>You're almost done!</p>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {checklist.map(({ label, done }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? P.green : P.softGray, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
                      {done && <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={P.white} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span style={{ fontFamily: P.sans, fontSize: "0.78rem", color: done ? P.charcoal : P.sub }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accepted documents */}
            <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 16, padding: "18px 20px", boxShadow: P.shadow }}>
              <h2 style={{ fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 700, color: P.navy, margin: "0 0 14px" }}>Accepted Documents</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {["Utility bill (within 90 days)", "Property tax statement", "Mortgage statement", "Homeowners insurance declaration", "HOA statement (with address)"].map(doc => (
                  <div key={doc} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={P.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ fontFamily: P.sans, fontSize: "0.77rem", color: P.charcoal, lineHeight: 1.4 }}>{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div style={{ background: P.white, border: `1px solid ${P.border}`, borderRadius: 16, padding: "18px 20px", boxShadow: P.shadow }}>
              <h2 style={{ fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 700, color: P.navy, margin: "0 0 16px" }}>Your Information Is Protected</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={P.navy} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, title: "Bank-Level Encryption", desc: "Documents are encrypted in transit and at rest." },
                  { icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={P.navy} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>, title: "Private by Design", desc: "Agents never see your verification documents." },
                  { icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={P.navy} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, title: "Limited Access", desc: "Only authorized personnel review submissions." },
                  { icon: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={P.navy} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: "Never Sold", desc: "Your information is never sold or shared." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} style={{ display: "flex", gap: 10 }}>
                    <div style={{ flexShrink: 0, marginTop: 1 }}>{icon}</div>
                    <div>
                      <p style={{ fontFamily: P.sans, fontSize: "0.8rem", fontWeight: 700, color: P.navy, margin: "0 0 2px" }}>{title}</p>
                      <p style={{ fontFamily: P.sans, fontSize: "0.73rem", color: P.sub, margin: 0, lineHeight: 1.45 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* STICKY FOOTER */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: P.white, borderTop: `1px solid ${P.border}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 90, boxShadow: "0 -4px 16px rgba(20,43,77,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {allDone ? (
            <>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: P.greenBg, border: `1px solid ${P.greenBdr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={P.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <p style={{ fontFamily: P.sans, fontSize: "0.85rem", fontWeight: 700, color: P.navy, margin: 0 }}>All requirements complete!</p>
                <p style={{ fontFamily: P.sans, fontSize: "0.73rem", color: P.sub, margin: 0 }}>You're ready to complete verification.</p>
              </div>
            </>
          ) : (
            <div>
              <p style={{ fontFamily: P.sans, fontSize: "0.85rem", fontWeight: 600, color: P.navy, margin: 0 }}>{doneCount} of {checklist.length} steps complete</p>
              <p style={{ fontFamily: P.sans, fontSize: "0.73rem", color: P.sub, margin: 0 }}>Fill in all steps to submit.</p>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button type="button" onClick={() => toast.success("Progress saved!")}
            style={{ fontFamily: P.sans, fontSize: "0.875rem", color: P.orange, background: "none", border: "none", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" as const }}>
            Save and Finish Later
          </button>
          <button type="submit" form="verify-form" disabled={saving}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: saving ? P.sub : P.orange, border: "none", color: P.white, fontFamily: P.sans, fontSize: "0.9rem", fontWeight: 700, padding: "12px 22px", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", whiteSpace: "nowrap" as const }}>
            {saving ? "Submitting…" : "Complete Verification"}
            {!saving && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
          </button>
        </div>
        <p style={{ position: "absolute", bottom: 3, right: 32, fontFamily: P.sans, fontSize: "0.68rem", color: P.sub, margin: 0 }}>
          Takes less than 2 minutes
        </p>
      </div>

    </div>
  );
}
