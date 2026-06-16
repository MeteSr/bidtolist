import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOpenBidRequests, getOpenBidRequestsForCities, type BidRequestSummary } from "../services/listing";
import { getMyAgentProfile } from "../services/agent";
import { useAuth } from "../contexts/AuthContext";
import { useBreakpoint } from "../hooks/useBreakpoint";

const C = {
  bg: "#F3F4F6", white: "#FFFFFF", text: "#111827", sub: "#6B7280",
  border: "#E5E7EB", primary: "#2563EB", green: "#16A34A",
  shadow: "0 1px 3px rgba(0,0,0,0.10)",
  sans: "'Inter','IBM Plex Sans',system-ui,sans-serif",
  mono: "'IBM Plex Mono',monospace",
};

const MAX_PROPOSALS = 10;

function formatCountdown(deadlineNs: bigint): string {
  const ms = Number(deadlineNs) / 1_000_000 - Date.now();
  if (ms <= 0) return "Bidding closed";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 48) return `Closes in ${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return rem > 0 ? `Closes in ${days}d ${rem}h` : `Closes in ${days}d`;
}

export default function BrowseListingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isMobile } = useBreakpoint();
  const [requests, setRequests] = useState<BidRequestSummary[]>([]);
  const [county, setCounty] = useState<"All" | "Volusia" | "Flagler">("All");
  const [isVerified, setIsVerified] = useState(false);
  const [serviceCities, setServiceCities] = useState<string[] | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      getOpenBidRequests().then(setRequests).catch(console.error);
      setServiceCities([]);
      return;
    }
    getMyAgentProfile()
      .then((profile: any) => {
        setIsVerified(profile?.isVerified === true);
        const cities: string[] = profile?.serviceCities ?? [];
        setServiceCities(cities);
        if (cities.length > 0) {
          getOpenBidRequestsForCities(cities).then(setRequests).catch(console.error);
        } else {
          setRequests([]);
        }
      })
      .catch(() => {
        setIsVerified(false);
        setServiceCities([]);
        setRequests([]);
      });
  }, [isAuthenticated]);

  const filtered = county === "All" ? requests : requests.filter(r => r.county === county);
  const noCitiesSet = isAuthenticated && serviceCities !== null && serviceCities.length === 0;

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <nav style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
        padding: isMobile ? "14px 20px" : "0 48px",
        height: isMobile ? "auto" : 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <img src="/bid_to_list_logo.png" alt="BidToList" style={{ height: 36, display: "block" }} />
        </a>
        <a href="/agents/dashboard" style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.sub, textDecoration: "none" }}>
          My Proposals
        </a>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "28px 16px" : "48px 24px" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", gap: 16, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: C.sans, fontSize: "clamp(1.4rem,4vw,1.75rem)", fontWeight: 700, color: C.text, marginBottom: 6 }}>
              Open Listings
            </h1>
            <p style={{ fontFamily: C.sans, fontSize: "0.9rem", color: C.sub }}>
              {serviceCities && serviceCities.length > 0
                ? `Showing listings in your service area: ${serviceCities.join(", ")}`
                : "Submit a blind proposal — homeowners see all bids at once after the deadline."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {(["All", "Volusia", "Flagler"] as const).map(c => (
              <button key={c} onClick={() => setCounty(c)}
                style={{
                  background: county === c ? C.primary : C.white,
                  border: `1px solid ${county === c ? C.primary : C.border}`,
                  color: county === c ? C.white : C.text,
                  fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 500,
                  padding: "8px 16px", borderRadius: 6, cursor: "pointer",
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {!isVerified && isAuthenticated && (
          <div style={{
            background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8,
            padding: "12px 16px", marginBottom: 24,
            display: "flex", flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center", gap: 8,
          }}>
            <span style={{ fontFamily: C.mono, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#92400E" }}>
              Verification pending
            </span>
            <span style={{ fontFamily: C.sans, fontSize: "0.875rem", color: "#92400E" }}>
              — your account is under review. You can browse but cannot submit proposals until verified.
            </span>
          </div>
        )}

        {noCitiesSet && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40, textAlign: "center", boxShadow: C.shadow }}>
            <p style={{ fontFamily: C.sans, fontSize: "1.05rem", fontWeight: 600, color: C.text, marginBottom: 10 }}>
              No service cities on your profile
            </p>
            <p style={{ fontFamily: C.sans, color: C.sub, marginBottom: 24, fontSize: "0.9rem", lineHeight: 1.7 }}>
              Add the cities you serve to your agent profile so we can show you relevant listings and broadcast new ones to you.
            </p>
            <a href="/agents/register"
              style={{ display: "inline-block", background: C.primary, color: C.white, fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 600, padding: "10px 22px", borderRadius: 8, textDecoration: "none" }}>
              Update Profile
            </a>
          </div>
        )}

        {!noCitiesSet && filtered.length === 0 && serviceCities !== null && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40, textAlign: "center", boxShadow: C.shadow }}>
            <p style={{ fontFamily: C.sans, color: C.sub }}>No open listings in your service area right now. Check back soon.</p>
          </div>
        )}

        {filtered.map(req => {
          const count = Number(req.proposalCount);
          return (
            <div key={req.id} style={{
              background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: isMobile ? 16 : "20px 24px", marginBottom: 12,
              display: "flex", flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center",
              gap: 16, boxShadow: C.shadow,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: C.sans, fontSize: "1rem", fontWeight: 600, color: C.text, marginBottom: 4 }}>
                  {req.city}, {req.county} County · {req.zipCode}
                </p>
                <p style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.sub, letterSpacing: "0.06em" }}>
                  {req.desiredSalePrice?.length > 0 ? `$${(Number(req.desiredSalePrice[0]) / 100).toLocaleString()} · ` : ""}
                  {[
                    req.beds?.length  > 0 ? `${Number(req.beds[0])} bd`  : null,
                    req.baths?.length > 0 ? `${Number(req.baths[0])} ba` : null,
                    req.sqft?.length  > 0 ? `${Number(req.sqft[0]).toLocaleString()} sqft` : null,
                  ].filter(Boolean).join(" · ")}
                  {(req.beds?.length > 0 || req.baths?.length > 0 || req.sqft?.length > 0) ? " · " : ""}
                  {formatCountdown(req.bidDeadline)} · {count} / {MAX_PROPOSALS} bids
                </p>
                {req.notes && (
                  <p style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.sub, marginTop: 8 }}>
                    {req.notes.slice(0, 120)}{req.notes.length > 120 ? "…" : ""}
                  </p>
                )}
              </div>
              <button
                onClick={() => isVerified && navigate(`/agents/propose/${req.id}`)}
                disabled={!isVerified}
                style={{
                  background: isVerified ? C.primary : C.border,
                  border: "none",
                  color: isVerified ? C.white : C.sub,
                  fontFamily: C.sans, fontSize: "0.875rem", fontWeight: 600,
                  padding: "10px 20px", borderRadius: 8,
                  cursor: isVerified ? "pointer" : "not-allowed",
                  width: isMobile ? "100%" : "auto", flexShrink: 0,
                }}>
                Submit Proposal
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
