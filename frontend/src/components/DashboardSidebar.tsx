import React from "react";

// ─── Shared dashboard design tokens ──────────────────────────────────────────

export const DC = {
  bg:          "#F3F4F6",
  white:       "#FFFFFF",
  sidebar:     "#1E3A8A",
  activeNav:   "rgba(255,255,255,0.15)",
  activeBdr:   "#60A5FA",
  text:        "#111827",
  textSub:     "#6B7280",
  border:      "#E5E7EB",
  primary:     "#2563EB",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  greenBdr:    "#BBF7D0",
  greenText:   "#166534",
  shadow:      "0 1px 3px rgba(0,0,0,0.1)",
  sans:        "'Inter', 'IBM Plex Sans', system-ui, sans-serif",
  mono:        "'IBM Plex Mono', monospace",
};

export const W_SIDEBAR = 240;

// ─── Icon set ────────────────────────────────────────────────────────────────

const iconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function IcGrid()     { return <svg {...iconProps}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
export function IcHome()     { return <svg {...iconProps}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
export function IcList()     { return <svg {...iconProps}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
export function IcMsg()      { return <svg {...iconProps}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>; }
export function IcDoc()      { return <svg {...iconProps}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; }
export function IcActivity() { return <svg {...iconProps}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
export function IcSettings() { return <svg {...iconProps}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>; }
export function IcHelp()     { return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
export function IcLogout()   { return <svg {...iconProps}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
export function IcBell()     { return <svg {...iconProps} width={20} height={20}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
export function IcNotif()    { return <svg {...iconProps}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
export function IcHistory()  { return <svg {...iconProps}><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 108.91-9"/><polyline points="3 3 3 11 11 11"/></svg>; }
export function IcSaved()    { return <svg {...iconProps}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>; }
export function IcProfile()  { return <svg {...iconProps}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
export function IcPhone()    { return <svg {...iconProps} width={14} height={14}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 8.73a16 16 0 006.29 6.29l1.24-1.25a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>; }

export function IcShield()   {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

export function IcPercent()  {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  );
}

export function IcTrend()    {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  );
}

export function IcClock()    {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SidebarItem = {
  label: string;
  icon:  React.ReactNode;
  href:  string;
  badge?: number;
  onClick?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardSidebar({ items, activeLabel, onLogout }: {
  items:       SidebarItem[];
  activeLabel: string;
  onLogout:    () => void;
}) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, width: W_SIDEBAR, height: "100vh",
      background: DC.sidebar, display: "flex", flexDirection: "column",
      zIndex: 50, overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
        <a href="/" style={{ display: "block" }}>
          <img src="/bid_to_list_logo.png" alt="BidToList" style={{ height: 32, width: "auto" }} />
        </a>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: "12px 0" }}>
        {items.map(({ label, icon, href, badge, onClick }) => {
          const active = label === activeLabel;
          return (
            <a
              key={label}
              href={onClick ? "#" : href}
              onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px",
                color:      active ? "#FFFFFF" : "rgba(255,255,255,0.65)",
                background: active ? DC.activeNav : "none",
                borderLeft: active ? `3px solid ${DC.activeBdr}` : "3px solid transparent",
                textDecoration: "none", fontSize: "0.875rem",
                fontFamily: DC.sans, fontWeight: active ? 600 : 400,
                transition: "color 0.15s, background 0.15s",
              }}
            >
              {icon}
              <span style={{ flex: 1 }}>{label}</span>
              {badge !== undefined && badge > 0 && (
                <span style={{ background: "#EF4444", color: "#fff", borderRadius: 9999, fontSize: "0.68rem", fontWeight: 700, padding: "1px 6px" }}>
                  {badge}
                </span>
              )}
            </a>
          );
        })}
      </div>

      {/* Help + Logout */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "12px 0", flexShrink: 0 }}>
        <a href="/faq" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: "0.875rem", fontFamily: DC.sans }}>
          <IcHelp /> Help Center
        </a>
        <button
          onClick={onLogout}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", width: "100%", color: "rgba(255,255,255,0.65)", background: "none", border: "none", fontSize: "0.875rem", fontFamily: DC.sans, cursor: "pointer" }}
        >
          <IcLogout /> Log Out
        </button>
      </div>
    </nav>
  );
}

// ─── Top bar ─────────────────────────────────────────────────────────────────

export function DashboardTopBar({ notifCount, userName }: { notifCount?: number; userName?: string }) {
  const initials = userName ? userName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div style={{
      background: DC.white, borderBottom: `1px solid ${DC.border}`,
      padding: "0 32px", height: 64, display: "flex", alignItems: "center",
      justifyContent: "flex-end", gap: 16, position: "sticky", top: 0, zIndex: 40,
    }}>
      <div style={{ position: "relative", color: DC.textSub, cursor: "pointer" }}>
        <IcBell />
        {notifCount !== undefined && notifCount > 0 && (
          <span style={{ position: "absolute", top: -6, right: -6, background: "#EF4444", color: "#fff", borderRadius: 9999, fontSize: "0.65rem", fontWeight: 700, padding: "1px 5px" }}>
            {notifCount}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", color: DC.primary, fontWeight: 700, fontSize: "0.825rem" }}>
          {initials}
        </div>
        <span style={{ fontSize: "0.875rem", fontWeight: 500, color: DC.text, fontFamily: DC.sans }}>
          {userName || "My Account"}
        </span>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function timeAgo(nsOrMs: bigint | number): string {
  const ms = typeof nsOrMs === "bigint" ? Number(nsOrMs) / 1_000_000 : nsOrMs;
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatCountdown(deadlineMs: number): string {
  const ms = deadlineMs - Date.now();
  if (ms <= 0) return "Closed";
  const totalMins = Math.floor(ms / 60_000);
  const d = Math.floor(totalMins / (60 * 24));
  const h = Math.floor((totalMins % (60 * 24)) / 60);
  const m = totalMins % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function HousePlaceholder({ label }: { label: string }) {
  return (
    <div style={{ width: "100%", height: 200, background: "#E5E7EB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <span style={{ fontFamily: DC.sans, fontSize: "0.75rem", color: "#9CA3AF" }}>{label}</span>
    </div>
  );
}
