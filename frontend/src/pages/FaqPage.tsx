import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const S = {
  bg:        "#F4F6F8",
  white:     "#FFFFFF",
  dark:      "#111827",
  muted:     "#6B7280",
  border:    "#E5E7EB",
  green:     "#2A8B57",
  greenLight:"#E6F4ED",
  yellow:    "#F5C842",
  blue:      "#1B3266",
  peach:     "#F07858",
  peachLight:"#FEF0EB",
  sans:  "'IBM Plex Sans', sans-serif",
};

const FAQS: { section: string; accent: string; pale: string; items: { q: string; a: string }[] }[] = [
  {
    section: "For Homeowners",
    accent:  S.green,
    pale:    S.greenLight,
    items: [
      {
        q: "Is BidtoList really free for homeowners?",
        a: "Yes — completely free. You post your home, receive proposals from licensed agents, and pick a winner at no cost. BidtoList earns only when an agent's proposal is accepted, so our incentives are fully aligned with yours.",
      },
      {
        q: "How does blind bidding work?",
        a: "When you post your home, agents submit sealed proposals within your deadline. No agent can see any other agent's bid — ever. This prevents lowballing and ensures every agent puts their best offer forward.",
      },
      {
        q: "What's included in an agent's proposal?",
        a: "Each proposal includes the agent's proposed commission rate, a marketing plan, a comparative market analysis (CMA), and their professional background. You get everything you need to make an informed comparison in one place.",
      },
      {
        q: "Am I obligated to pick a winner?",
        a: "No. You can review all proposals and decide not to move forward. There's no contract until you explicitly accept a proposal and sign a listing agreement directly with the agent you choose.",
      },
      {
        q: "How long is my listing open for bids?",
        a: "You set the deadline when you post — typically 5 to 7 days. After the deadline passes, bidding closes and you can review all submitted proposals.",
      },
    ],
  },
  {
    section: "For Agents",
    accent:  S.blue,
    pale:    "#EBF0FF",
    items: [
      {
        q: "How much does it cost to register as an agent?",
        a: "Registration is free. You only pay a flat $295 win fee when a homeowner accepts your proposal. There are no monthly subscriptions, no per-bid charges, and no hidden fees.",
      },
      {
        q: "When exactly is the $295 win fee charged?",
        a: "The fee is charged when a homeowner selects your proposal. You'll be prompted to complete payment through our secure checkout before the homeowner's contact details are released to you.",
      },
      {
        q: "Can I see what other agents bid?",
        a: "No — and neither can they see yours. Bidding is fully sealed. Results are revealed only to the homeowner after the deadline, and only in aggregate so they can make their choice.",
      },
      {
        q: "How do I submit a proposal?",
        a: "Browse open listings from your agent dashboard, click into any listing, and fill out the proposal form. You'll enter your commission rate, upload your marketing plan, attach a CMA, and submit before the deadline.",
      },
      {
        q: "Do I need to be a licensed realtor to join?",
        a: "Yes. BidtoList is open to licensed real estate agents and brokers only. You'll be asked to provide your license number during registration, which our team verifies before your account is activated.",
      },
    ],
  },
  {
    section: "General",
    accent:  S.peach,
    pale:    S.peachLight,
    items: [
      {
        q: "How is BidtoList different from Zillow or Redfin?",
        a: "Zillow and Redfin connect you with a single agent or a small set of pre-selected agents. BidtoList creates a competitive market: multiple licensed agents compete for your listing simultaneously, giving you real choice and driving better terms.",
      },
      {
        q: "Is my personal information secure?",
        a: "Your contact information is never shared with agents until you accept a proposal. Listing details are visible to registered agents, but your identity remains private throughout the bidding process.",
      },
      {
        q: "What happens after I pick a winning agent?",
        a: "BidtoList introduces you to the agent you selected. From that point, you work directly with them to sign a listing agreement, prepare your home, and proceed with the sale. BidtoList steps back once the match is made.",
      },
    ],
  },
];

function AccordionItem({ q, a, accent }: { q: string; a: string; accent: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background:   S.white,
        border:       `1px solid ${S.border}`,
        borderRadius: 14,
        overflow:     "hidden",
        transition:   "box-shadow 0.15s",
        boxShadow:    open ? "0 4px 24px rgba(0,0,0,0.07)" : "none",
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:       "100%",
          display:     "flex",
          justifyContent: "space-between",
          alignItems:  "center",
          gap:         16,
          padding:     "20px 24px",
          background:  "transparent",
          border:      "none",
          cursor:      "pointer",
          textAlign:   "left",
        }}
      >
        <span style={{ fontFamily: S.sans, fontSize: "0.97rem", fontWeight: 700, color: S.dark, lineHeight: 1.4 }}>
          {q}
        </span>
        <span style={{
          flexShrink:  0,
          width:       28,
          height:      28,
          borderRadius: "50%",
          background:  open ? accent : S.bg,
          display:     "flex",
          alignItems:  "center",
          justifyContent: "center",
          transition:  "background 0.15s",
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d={open ? "M2 8L6 4L10 8" : "M2 4L6 8L10 4"}
              stroke={open ? S.white : S.muted}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 24px 20px", borderTop: `1px solid ${S.border}` }}>
          <p style={{ fontFamily: S.sans, fontSize: "0.92rem", color: S.muted, lineHeight: 1.8, marginTop: 16 }}>
            {a}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div style={{ background: S.bg, minHeight: "100vh" }}>
      <Helmet>
        <title>FAQs — BidtoList</title>
        <meta name="description" content="Answers to common questions about how BidtoList works for homeowners and agents." />
      </Helmet>

      {/* Nav */}
      <nav style={{
        background:   S.white,
        borderBottom: `1px solid ${S.border}`,
        padding:      "16px 48px",
        display:      "flex",
        justifyContent: "space-between",
        alignItems:   "center",
        position:     "sticky",
        top:          0,
        zIndex:       100,
        boxShadow:    "0 1px 12px rgba(0,0,0,0.06)",
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <div style={{ display: "flex", gap: 3 }}>
            <span style={{ display: "inline-block", width: 4, height: 18, background: S.green, borderRadius: 2 }} />
            <span style={{ display: "inline-block", width: 4, height: 18, background: S.yellow, borderRadius: 2 }} />
          </div>
          <span style={{ fontFamily: S.sans, fontSize: "1.2rem", fontWeight: 800, color: S.dark, letterSpacing: "-0.02em" }}>
            BidtoList
          </span>
        </Link>
        <Link
          to="/"
          style={{ fontFamily: S.sans, fontSize: "0.88rem", fontWeight: 500, color: S.muted, textDecoration: "none" }}
        >
          ← Back to Home
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: "64px 48px 56px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{
            fontFamily:    S.sans,
            fontSize:      "clamp(2rem, 4vw, 3rem)",
            fontWeight:    800,
            color:         S.dark,
            letterSpacing: "-0.02em",
            lineHeight:    1.1,
            marginBottom:  16,
          }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontFamily: S.sans, fontSize: "1rem", color: S.muted, lineHeight: 1.75 }}>
            Everything you need to know about how BidtoList works.
          </p>
        </div>
      </div>

      {/* FAQ sections */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "64px 24px 96px" }}>
        {FAQS.map(({ section, accent, pale, items }) => (
          <div key={section} style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <span style={{
                display:      "inline-block",
                background:   pale,
                color:        accent,
                fontFamily:   S.sans,
                fontSize:     "0.78rem",
                fontWeight:   700,
                textTransform:"uppercase",
                letterSpacing:"0.08em",
                padding:      "6px 14px",
                borderRadius: 100,
              }}>
                {section}
              </span>
              <div style={{ flex: 1, height: 1, background: S.border }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map(({ q, a }) => (
                <AccordionItem key={q} q={q} a={a} accent={accent} />
              ))}
            </div>
          </div>
        ))}

        {/* Still have questions CTA */}
        <div style={{
          background:   S.green,
          borderRadius: 20,
          padding:      "40px 40px",
          textAlign:    "center",
        }}>
          <p style={{ fontFamily: S.sans, fontSize: "1.1rem", fontWeight: 700, color: S.white, marginBottom: 8 }}>
            Still have questions?
          </p>
          <p style={{ fontFamily: S.sans, fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", marginBottom: 24 }}>
            We're happy to help. Reach out and we'll get back to you quickly.
          </p>
          <a
            href="mailto:hello@bidtolist.com"
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              padding:        "12px 28px",
              background:     S.yellow,
              color:          S.dark,
              fontFamily:     S.sans,
              fontSize:       "0.9rem",
              fontWeight:     700,
              borderRadius:   100,
              textDecoration: "none",
            }}
          >
            Contact Us →
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        background:     S.dark,
        padding:        "24px 48px",
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 3 }}>
            <span style={{ display: "inline-block", width: 3, height: 14, background: S.green, borderRadius: 2 }} />
            <span style={{ display: "inline-block", width: 3, height: 14, background: S.yellow, borderRadius: 2 }} />
          </div>
          <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>BidtoList</span>
          <span style={{ fontFamily: S.sans, fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>© 2026</span>
        </div>
        <span style={{ fontFamily: S.sans, fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
          Nationwide · USA
        </span>
      </footer>
    </div>
  );
}
