import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAgentProfile, getReviews, type AgentReview } from "../services/agent";
import { useBreakpoint } from "../hooks/useBreakpoint";

const C = {
  bg: "#F3F4F6", white: "#FFFFFF", text: "#111827", sub: "#6B7280",
  border: "#E5E7EB", primary: "#2563EB", green: "#16A34A",
  shadow: "0 1px 3px rgba(0,0,0,0.10)",
  sans: "'Inter','IBM Plex Sans',system-ui,sans-serif",
  mono: "'IBM Plex Mono',monospace",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} style={{ color: "#F59E0B", fontSize: "1rem", letterSpacing: 2 }}>
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

function avgRating(reviews: AgentReview[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((s, r) => s + Number(r.rating), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export default function AgentProfilePage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { isMobile } = useBreakpoint();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<AgentReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId) return;
    Promise.all([
      getAgentProfile(agentId).catch(() => null),
      getReviews(agentId).catch(() => []),
    ]).then(([prof, revs]) => {
      setProfile(prof);
      setReviews(revs as AgentReview[]);
    }).finally(() => setLoading(false));
  }, [agentId]);

  const avg = avgRating(reviews);

  const LBL = { fontFamily: C.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.sub };

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
        <a href="/agents/browse" style={{ fontFamily: C.sans, fontSize: "0.875rem", color: C.sub, textDecoration: "none" }}>
          Browse Listings
        </a>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "28px 16px" : "48px 24px" }}>

        {loading && (
          <p style={{ fontFamily: C.mono, fontSize: "0.75rem", color: C.sub }}>Loading…</p>
        )}

        {!loading && !profile && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40, textAlign: "center", boxShadow: C.shadow }}>
            <p style={{ fontFamily: C.sans, color: C.sub }}>Agent profile not found.</p>
          </div>
        )}

        {!loading && profile && (
          <>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: isMobile ? "24px 16px" : "32px 40px", marginBottom: 24, boxShadow: C.shadow }}>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
                <div>
                  <h1 style={{ fontFamily: C.sans, fontSize: "clamp(1.3rem,4vw,1.6rem)", fontWeight: 700, color: C.text, marginBottom: 4 }}>
                    {profile.name}
                  </h1>
                  <p style={{ fontFamily: C.sans, color: C.sub, marginBottom: 4 }}>{profile.brokerage}</p>
                  <p style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.sub, letterSpacing: "0.06em" }}>
                    License: {profile.licenseNumber} · {profile.county} County
                  </p>
                </div>
                <div style={{ textAlign: isMobile ? "left" : "right", flexShrink: 0 }}>
                  {profile.isVerified && (
                    <span style={{ ...LBL, color: C.green, border: `1px solid ${C.green}`, padding: "4px 8px", borderRadius: 4, display: "inline-block", marginBottom: 8 }}>
                      Verified
                    </span>
                  )}
                  {reviews.length > 0 && (
                    <div style={{ marginTop: profile.isVerified ? 8 : 0 }}>
                      <Stars rating={Math.round(avg)} />
                      <p style={{ fontFamily: C.mono, fontSize: "0.65rem", color: C.sub, letterSpacing: "0.06em", marginTop: 2 }}>
                        {avg.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {profile.bio && (
                <p style={{ fontFamily: C.sans, fontSize: "0.9rem", lineHeight: 1.7, color: C.text, marginBottom: 20 }}>{profile.bio}</p>
              )}

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { label: "Avg Days on Market", value: profile.avgDaysOnMarket ?? "—" },
                  { label: "Listings (12 mo)", value: profile.listingsLast12Months ?? "—" },
                  { label: "Counties", value: profile.county },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px" }}>
                    <p style={{ ...LBL, display: "block", marginBottom: 4 }}>{label}</p>
                    <p style={{ fontFamily: C.sans, fontSize: "1.1rem", fontWeight: 700, color: C.text }}>{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>

            <section>
              <p style={{ ...LBL, display: "block", marginBottom: 16 }}>
                Homeowner Reviews ({reviews.length})
              </p>

              {reviews.length === 0 && (
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: "center", boxShadow: C.shadow }}>
                  <p style={{ fontFamily: C.sans, color: C.sub, fontSize: "0.9rem" }}>No reviews yet.</p>
                </div>
              )}

              {reviews.map((r, i) => (
                <div key={r.id ?? i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: isMobile ? 16 : "20px 24px", marginBottom: 8, boxShadow: C.shadow }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Stars rating={Number(r.rating)} />
                    <span style={{ fontFamily: C.mono, fontSize: "0.65rem", color: C.sub, letterSpacing: "0.06em" }}>
                      {new Date(Number(r.createdAt) / 1_000_000).toLocaleDateString()}
                    </span>
                  </div>
                  {r.comment && (
                    <p style={{ fontFamily: C.sans, fontSize: "0.9rem", color: C.text, lineHeight: 1.6 }}>{r.comment}</p>
                  )}
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
