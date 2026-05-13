import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAgentProfile, getReviews, type AgentReview } from "../services/agent";
import { useBreakpoint } from "../hooks/useBreakpoint";

const S = {
  ink: "#0E0E0C", paper: "#F4F1EB", rule: "#C8C3B8", rust: "#C94C2E",
  inkLight: "#7A7268", serif: "'Playfair Display', Georgia, serif",
  mono: "'IBM Plex Mono', monospace", sans: "'IBM Plex Sans', sans-serif",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} style={{ color: S.rust, fontSize: "1rem", letterSpacing: 2 }}>
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

  return (
    <div style={{ background: S.paper, minHeight: "100vh" }}>
      <nav style={{ borderBottom: `1px solid ${S.rule}`, padding: isMobile ? "12px 16px" : "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 900, color: S.rust, textDecoration: "none" }}>BidtoList</a>
        <a href="/agents/browse" style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: S.inkLight, textDecoration: "none" }}>Browse Listings</a>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "32px 16px" : "60px 40px" }}>

        {loading && (
          <p style={{ fontFamily: S.mono, fontSize: "0.75rem", color: S.inkLight }}>Loading…</p>
        )}

        {!loading && !profile && (
          <div style={{ border: `1px solid ${S.rule}`, padding: 40, textAlign: "center" }}>
            <p style={{ fontFamily: S.sans, color: S.inkLight }}>Agent profile not found.</p>
          </div>
        )}

        {!loading && profile && (
          <>
            {/* Profile card */}
            <div style={{ border: `1px solid ${S.rule}`, padding: isMobile ? "24px 16px" : "32px 40px", marginBottom: 40 }}>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
                <div>
                  <h1 style={{ fontFamily: S.serif, fontSize: "clamp(1.4rem, 5vw, 1.8rem)", fontWeight: 900, marginBottom: 4 }}>
                    {profile.name}
                  </h1>
                  <p style={{ fontFamily: S.sans, color: S.inkLight, marginBottom: 4 }}>{profile.brokerage}</p>
                  <p style={{ fontFamily: S.mono, fontSize: "0.7rem", color: S.inkLight, letterSpacing: "0.06em" }}>
                    License: {profile.licenseNumber} · {profile.county} County
                  </p>
                </div>
                <div style={{ textAlign: isMobile ? "left" : "right", flexShrink: 0 }}>
                  {profile.isVerified && (
                    <span style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#2E7D32", border: "1px solid #2E7D32", padding: "4px 8px", display: "inline-block", marginBottom: 8 }}>
                      Verified
                    </span>
                  )}
                  {reviews.length > 0 && (
                    <div style={{ marginTop: profile.isVerified ? 8 : 0 }}>
                      <Stars rating={Math.round(avg)} />
                      <p style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight, letterSpacing: "0.06em", marginTop: 2 }}>
                        {avg.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {profile.bio && (
                <p style={{ fontFamily: S.sans, fontSize: "0.9rem", lineHeight: 1.7, color: S.ink, marginBottom: 20 }}>{profile.bio}</p>
              )}

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { label: "Avg Days on Market", value: profile.avgDaysOnMarket ?? "—" },
                  { label: "Listings (12 mo)", value: profile.listingsLast12Months ?? "—" },
                  { label: "Counties", value: profile.county },
                ].map(({ label, value }) => (
                  <div key={label} style={{ border: `1px solid ${S.rule}`, padding: "12px 16px" }}>
                    <p style={{ fontFamily: S.mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: S.inkLight, marginBottom: 4 }}>{label}</p>
                    <p style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 700 }}>{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <section>
              <p style={{ fontFamily: S.mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: S.inkLight, marginBottom: 16 }}>
                Homeowner Reviews ({reviews.length})
              </p>

              {reviews.length === 0 && (
                <div style={{ border: `1px solid ${S.rule}`, padding: 24, textAlign: "center" }}>
                  <p style={{ fontFamily: S.sans, color: S.inkLight, fontSize: "0.9rem" }}>No reviews yet.</p>
                </div>
              )}

              {reviews.map((r, i) => (
                <div key={r.id ?? i} style={{ border: `1px solid ${S.rule}`, padding: isMobile ? "16px" : "20px 24px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Stars rating={Number(r.rating)} />
                    <span style={{ fontFamily: S.mono, fontSize: "0.65rem", color: S.inkLight, letterSpacing: "0.06em" }}>
                      {new Date(Number(r.createdAt) / 1_000_000).toLocaleDateString()}
                    </span>
                  </div>
                  {r.comment && (
                    <p style={{ fontFamily: S.sans, fontSize: "0.9rem", color: S.ink, lineHeight: 1.6 }}>{r.comment}</p>
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
