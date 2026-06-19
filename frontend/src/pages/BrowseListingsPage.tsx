import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOpenBidRequests, getOpenBidRequestsForCities, type BidRequestSummary } from "../services/listing";
import { getMyAgentProfile } from "../services/agent";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";

const C = {
  bg:       "#F8FAFC",
  white:    "#FFFFFF",
  ink:      "#0F172A",
  sub:      "#64748B",
  muted:    "#94A3B8",
  border:   "#E2E8F0",
  orange:   "#EA580C",
  orangeBg: "#FFF7ED",
  orangeBdr:"#FED7AA",
  red:      "#DC2626",
  greenBg:  "#ECFDF5",
  shadow:   "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
  sans:     "'Inter','IBM Plex Sans',system-ui,sans-serif",
  mono:     "'IBM Plex Mono',monospace",
};

function opportunityNum(id: string): string {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  return String(((h >>> 0) % 9000) + 1000);
}

function priceRange(cents?: bigint | null): string {
  if (!cents) return "Price on request";
  const d = Number(cents) / 100;
  if (d < 500_000)   return "Under $500K";
  if (d < 750_000)   return "$500K – $750K";
  if (d < 1_000_000) return "$750K – $1M";
  if (d < 1_500_000) return "$1M – $1.5M";
  if (d < 2_000_000) return "$1.5M – $2M";
  if (d < 2_500_000) return "$2M – $2.5M";
  return "$2.5M+";
}

function countdown(deadlineNs: bigint): string {
  const ms = Number(deadlineNs) / 1_000_000 - Date.now();
  if (ms <= 0) return "Bidding closed";
  const h = Math.floor(ms / 3_600_000);
  if (h < 48) return `Closes in ${h}h`;
  return `Closes in ${Math.floor(h / 24)}d`;
}

function deadlineLabel(deadlineNs: bigint): string {
  const d = new Date(Number(deadlineNs) / 1_000_000);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function isNew(createdAt: bigint): boolean {
  return Date.now() - Number(createdAt) / 1_000_000 < 72 * 3_600_000;
}

function isEndingSoon(deadlineNs: bigint): boolean {
  const ms = Number(deadlineNs) / 1_000_000 - Date.now();
  return ms > 0 && ms < 48 * 3_600_000;
}

function HouseSVG() {
  return (
    <svg viewBox="0 0 160 110" width="100%" height="100%" style={{ display: "block" }}>
      <rect width="160" height="110" fill="#E2E8F0" />
      <path d="M40 72 L40 46 L80 22 L120 46 L120 72 Z" fill="#94A3B8" />
      <rect x="60" y="50" width="40" height="22" fill="#CBD5E1" />
      <rect x="66" y="50" width="11" height="10" fill="#64748B" />
      <rect x="83" y="50" width="11" height="10" fill="#64748B" />
      <rect x="71" y="60" width="18" height="12" fill="#475569" />
    </svg>
  );
}

type ViewFilter = "All" | "New" | "EndingSoon";

export default function BrowseListingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isMobile } = useBreakpoint();
  const [requests, setRequests]         = useState<BidRequestSummary[]>([]);
  const [county, setCounty]             = useState<"All" | "Volusia" | "Flagler">("All");
  const [viewFilter, setViewFilter]     = useState<ViewFilter>("All");
  const [isVerified, setIsVerified]     = useState(false);
  const [serviceCities, setServiceCities] = useState<string[] | null>(null);
  const [agentName, setAgentName]       = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      getOpenBidRequests().then(setRequests).catch(console.error);
      setServiceCities([]);
      return;
    }
    getMyAgentProfile()
      .then((profile: any) => {
        setIsVerified(profile?.isVerified === true);
        setAgentName(profile?.name || "");
        const cities: string[] = profile?.serviceCities ?? [];
        setServiceCities(cities);
        const loader = cities.length > 0
          ? getOpenBidRequestsForCities(cities)
          : getOpenBidRequests();
        loader.then(setRequests).catch(console.error);
      })
      .catch(() => {
        setIsVerified(false);
        setServiceCities([]);
        getOpenBidRequests().then(setRequests).catch(console.error);
      });
  }, [isAuthenticated]);

  let filtered = county === "All" ? requests : requests.filter(r => r.county === county);
  if (viewFilter === "New")        filtered = filtered.filter(r => isNew(r.createdAt));
  if (viewFilter === "EndingSoon") filtered = filtered.filter(r => isEndingSoon(r.bidDeadline));

  const newCount    = requests.filter(r => isNew(r.createdAt)).length;
  const endingCount = requests.filter(r => isEndingSoon(r.bidDeadline)).length;

  const viewTabs: { key: ViewFilter; label: string; count?: number }[] = [
    { key: "All",        label: "All Opportunities", count: requests.length },
    { key: "New",        label: "New Today",          count: newCount },
    { key: "EndingSoon", label: "Ending Soon",        count: endingCount },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: C.sans }}>
      {/* Nav */}
      <nav style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
        padding: "0 24px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <img src="/logo.png" alt="BidToList" style={{ height: 34, display: "block" }} />
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="/faq" style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.sub, textDecoration: "none" }}>
            How It Works
          </a>
          <a href="/agents/dashboard" style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.sub, textDecoration: "none" }}>
            Dashboard
          </a>
          {agentName && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: C.ink, color: "#fff",
              borderRadius: 9999, padding: "6px 14px 6px 10px",
              fontSize: "0.82rem", fontWeight: 500,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", background: C.orange,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.72rem", fontWeight: 700, color: "#fff",
              }}>
                {agentName.charAt(0).toUpperCase()}
              </div>
              {agentName}
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "24px 16px 48px" : "36px 24px 64px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: "clamp(1.4rem,3vw,1.875rem)", fontWeight: 700, color: C.ink, margin: "0 0 6px" }}>
            Find Your Next Winning Listing
          </h1>
          <p style={{ fontSize: "0.925rem", color: C.sub, margin: 0, lineHeight: 1.6 }}>
            Review property opportunities and submit your best proposal.
          </p>
        </div>

        {/* Filters row */}
        <div style={{
          display: "flex", flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center",
          gap: 12, marginBottom: 20,
        }}>
          {/* View filter tabs */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "2px 0" }}>
            {viewTabs.map(({ key, label, count }) => (
              <button key={key} onClick={() => setViewFilter(key)}
                style={{
                  background: viewFilter === key ? C.ink : C.white,
                  border: `1px solid ${viewFilter === key ? C.ink : C.border}`,
                  color: viewFilter === key ? "#fff" : C.sub,
                  borderRadius: 9999, padding: "8px 16px",
                  fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 500,
                  cursor: "pointer", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                {label}
                {count != null && count > 0 && (
                  <span style={{
                    background: viewFilter === key ? "rgba(255,255,255,0.25)" : C.orange,
                    color: "#fff", borderRadius: 9999,
                    padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700,
                  }}>{count}</span>
                )}
              </button>
            ))}
          </div>

          {/* County filter */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {(["All", "Volusia", "Flagler"] as const).map(c => (
              <button key={c} onClick={() => setCounty(c)}
                style={{
                  background: county === c ? "#EFF6FF" : C.white,
                  border: `1px solid ${county === c ? "#2563EB" : C.border}`,
                  color: county === c ? "#2563EB" : C.sub,
                  borderRadius: 6, padding: "7px 14px",
                  fontFamily: C.sans, fontSize: "0.8rem", fontWeight: 500,
                  cursor: "pointer",
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Verification banner */}
        {isAuthenticated && !isVerified && (
          <div style={{
            background: "#FFF7ED", border: "1px solid #FED7AA",
            borderRadius: 8, padding: "12px 16px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontFamily: C.sans, fontSize: "0.875rem", color: "#9A3412" }}>
              <strong>Verification pending</strong> — you can browse but cannot submit proposals until your account is verified.
            </span>
          </div>
        )}

        {/* Service cities notice */}
        {isAuthenticated && serviceCities !== null && serviceCities.length === 0 && (
          <div style={{
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "28px 32px", textAlign: "center",
            boxShadow: C.shadow, marginBottom: 24,
          }}>
            <p style={{ fontFamily: C.sans, fontSize: "1rem", fontWeight: 600, color: C.ink, margin: "0 0 8px" }}>
              No service cities on your profile
            </p>
            <p style={{ fontFamily: C.sans, color: C.sub, marginBottom: 20, fontSize: "0.875rem", lineHeight: 1.7 }}>
              Add the cities you serve to receive relevant listing alerts.
            </p>
            <a href="/agents/register" style={{
              display: "inline-block", background: C.ink, color: "#fff",
              fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 600,
              padding: "10px 22px", borderRadius: 8, textDecoration: "none",
            }}>Update Profile</a>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 48, textAlign: "center", boxShadow: C.shadow,
          }}>
            <div style={{
              width: 48, height: 48, background: "#F1F5F9", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <p style={{ fontFamily: C.sans, fontSize: "1rem", fontWeight: 600, color: C.ink, margin: "0 0 6px" }}>
              No opportunities right now
            </p>
            <p style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.sub, margin: 0 }}>
              New listings are added regularly — check back soon.
            </p>
          </div>
        )}

        {/* Opportunity cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(req => {
            const oppNum      = opportunityNum(req.id);
            const newListing  = isNew(req.createdAt);
            const endingSoon  = isEndingSoon(req.bidDeadline);
            const count       = Number(req.proposalCount);
            const beds        = req.beds?.[0]  != null ? Number(req.beds[0])  : null;
            const baths       = req.baths?.[0] != null ? Number(req.baths[0]) : null;
            const sqft        = req.sqft?.[0]  != null ? Number(req.sqft[0])  : null;
            const range       = priceRange(req.desiredSalePrice?.[0]);
            const cd          = countdown(req.bidDeadline);
            const dl          = deadlineLabel(req.bidDeadline);

            return (
              <div key={req.id} style={{
                background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 12, overflow: "hidden", boxShadow: C.shadow,
                display: "flex", flexDirection: isMobile ? "column" : "row",
              }}>
                {/* Thumbnail */}
                <div style={{
                  width: isMobile ? "100%" : 190,
                  height: isMobile ? 160 : "auto",
                  minHeight: isMobile ? undefined : 150,
                  flexShrink: 0, position: "relative", background: "#E2E8F0",
                }}>
                  <HouseSVG />
                  {newListing && (
                    <span style={{
                      position: "absolute", top: 10, left: 10,
                      background: C.orange, color: "#fff",
                      borderRadius: 4, padding: "3px 9px",
                      fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em",
                    }}>NEW</span>
                  )}
                  {endingSoon && !newListing && (
                    <span style={{
                      position: "absolute", top: 10, left: 10,
                      background: C.red, color: "#fff",
                      borderRadius: 4, padding: "3px 9px",
                      fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em",
                    }}>ENDING SOON</span>
                  )}
                </div>

                {/* Card body */}
                <div style={{
                  flex: 1, padding: isMobile ? 16 : "18px 24px",
                  display: "flex", flexDirection: isMobile ? "column" : "row",
                  gap: 16, alignItems: isMobile ? "stretch" : "center",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title + badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: C.sans, fontSize: "1rem", fontWeight: 700, color: C.ink }}>
                        Opportunity #{oppNum}
                      </span>
                      {newListing && (
                        <span style={{
                          background: C.orangeBg, border: `1px solid ${C.orangeBdr}`,
                          color: C.orange, borderRadius: 4,
                          padding: "1px 8px", fontSize: "0.7rem", fontWeight: 600,
                        }}>New</span>
                      )}
                    </div>

                    {/* Location */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.sub }}>
                        {req.city}, {req.county} County
                      </span>
                    </div>

                    {/* Property stats */}
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
                      <span style={{ fontFamily: C.sans, fontSize: "0.82rem", color: C.ink }}>Single Family Home</span>
                      {beds  != null && <span style={{ fontFamily: C.sans, fontSize: "0.82rem", color: C.ink }}>{beds} Beds</span>}
                      {baths != null && <span style={{ fontFamily: C.sans, fontSize: "0.82rem", color: C.ink }}>{baths} Baths</span>}
                      {sqft  != null && <span style={{ fontFamily: C.sans, fontSize: "0.82rem", color: C.ink }}>{sqft.toLocaleString()} Sq Ft</span>}
                      <span style={{ fontFamily: C.sans, fontSize: "0.82rem", fontWeight: 600, color: C.orange }}>
                        {range}
                      </span>
                    </div>

                    {/* Deadline + proposal count */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: C.sans, fontSize: "0.78rem", color: C.muted }}>
                        Proposal deadline: <span style={{ color: endingSoon ? C.red : C.sub, fontWeight: 500 }}>{dl}</span>
                      </span>
                      <span style={{ fontFamily: C.mono, fontSize: "0.7rem", color: endingSoon ? C.red : C.muted, letterSpacing: "0.03em" }}>
                        {cd} · {count} proposal{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* CTA button */}
                  <button
                    onClick={() => navigate(`/agents/listings/${req.id}`)}
                    style={{
                      background: C.ink, border: "none", color: "#fff",
                      fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 600,
                      padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                      whiteSpace: "nowrap", flexShrink: 0,
                      width: isMobile ? "100%" : "auto",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                    View Details
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length > 0 && (
          <p style={{ fontFamily: C.sans, fontSize: "0.8rem", color: C.muted, textAlign: "center", marginTop: 24 }}>
            Showing {filtered.length} opportunit{filtered.length === 1 ? "y" : "ies"}
          </p>
        )}
      </div>
    </div>
  );
}
