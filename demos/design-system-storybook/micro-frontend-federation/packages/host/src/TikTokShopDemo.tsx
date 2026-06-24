/**
 * TikTokShopDemo.tsx
 *
 * TikTok Shop — Campaign Workbench · Feature Management · i18n Library · 4 Platforms
 *
 * Achievements:
 *   1. Campaign Workbench       — real-time GMV/orders/conversion insights during campaigns
 *   2. Feature Management       — A/B testing, regional targeting, tiered access, flag rollout
 *   3. i18n Formatting Library  — date + currency for 10+ locales (Indian lakhs, Thai BE, etc.)
 *   4. Four Data Platforms       — Seller Compass / Partner Compass / Live Console / Campaign Console
 *
 * TABS
 *   📊 Campaign Workbench — live metrics, top products, alert system, time-series chart
 *   🎛 Feature Flags      — flag manager, rollout %, A/B variants, regional + tier targeting
 *   🌏 i18n + Platforms   — formatting playground, four-platform mini-dashboard
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Campaign Workbench types
// ─────────────────────────────────────────────────────────────────

interface CampaignMetric { label: string; value: number; target?: number; prev?: number; unit: "currency" | "count" | "percent"; icon: string; color: string }
interface Product { rank: number; name: string; gmv: number; orders: number; conv: number; trend: "up" | "down" | "flat" }
interface CampaignAlert { id: string; type: "warn" | "error" | "info"; message: string; time: string }

const PRODUCTS: Product[] = [
  { rank: 1, name: "SKII Facial Treatment Essence 230ml", gmv: 184200, orders: 620,  conv: 8.4,  trend: "up"   },
  { rank: 2, name: "Dyson Airwrap Multi-Styler",          gmv: 98400,  orders: 240,  conv: 3.2,  trend: "flat" },
  { rank: 3, name: "Laneige Lip Sleeping Mask 20g",       gmv: 42100,  orders: 1840, conv: 12.1, trend: "up"   },
  { rank: 4, name: "Samsung 65\" QLED TV",                gmv: 38900,  orders: 18,   conv: 1.1,  trend: "down" },
  { rank: 5, name: "Xiaomi Mijia Smart Speaker",          gmv: 21600,  orders: 480,  conv: 6.3,  trend: "down" },
];

// ─────────────────────────────────────────────────────────────────
// Feature Management types
// ─────────────────────────────────────────────────────────────────

type FeatureStatus = "enabled" | "disabled" | "rollout" | "ab-test";
type UserGroup = "sellers" | "creators" | "agencies" | "admins";
type Region = "US" | "UK" | "ID" | "TH" | "VN" | "MY" | "SG" | "PH";
type SellerTier = "free" | "pro" | "enterprise";

interface ABVariant { id: string; name: string; allocation: number; description: string }
interface FeatureFlag {
  id: string; key: string; name: string; description: string;
  status: FeatureStatus; rolloutPct: number;
  userGroups: UserGroup[]; regions: Region[]; tiers: SellerTier[];
  variants?: ABVariant[];
}

const FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: "f1", key: "campaign_workbench_v2", name: "Campaign Workbench V2",
    description: "New real-time campaign dashboard with streaming metrics and predictive alerts",
    status: "rollout", rolloutPct: 35,
    userGroups: ["sellers"], regions: ["US", "UK", "SG"],
    tiers: ["pro", "enterprise"], variants: undefined,
  },
  {
    id: "f2", key: "ai_product_recommendations", name: "AI Product Recommendations",
    description: "ML-powered product suggestions in campaign builder based on historical GMV",
    status: "ab-test", rolloutPct: 50,
    userGroups: ["sellers"], regions: ["US", "UK", "ID", "TH"],
    tiers: ["pro", "enterprise"],
    variants: [
      { id: "v1", name: "Control",    allocation: 50, description: "Existing manual product selection" },
      { id: "v2", name: "AI Assisted",allocation: 50, description: "AI-ranked product carousel at top" },
    ],
  },
  {
    id: "f3", key: "live_console_v3_charts", name: "Live Console Enhanced Charts",
    description: "Recharts-based real-time charts replacing static SVG snapshots",
    status: "enabled", rolloutPct: 100,
    userGroups: ["creators", "sellers"], regions: ["US", "UK", "ID", "TH", "VN", "MY", "SG", "PH"],
    tiers: ["free", "pro", "enterprise"],
  },
  {
    id: "f4", key: "partner_commission_v2", name: "Partner Commission Dashboard V2",
    description: "Granular commission breakdown by product category and time range",
    status: "disabled", rolloutPct: 0,
    userGroups: ["agencies"], regions: ["US", "UK"],
    tiers: ["enterprise"],
  },
  {
    id: "f5", key: "regional_tax_display", name: "Regional Tax Display",
    description: "Show VAT/GST/SST breakdown based on seller's registered country",
    status: "rollout", rolloutPct: 80,
    userGroups: ["sellers"], regions: ["ID", "TH", "MY", "SG"],
    tiers: ["free", "pro", "enterprise"],
  },
];

// ─────────────────────────────────────────────────────────────────
// i18n / Formatting Library data
// ─────────────────────────────────────────────────────────────────

interface LocaleConfig { locale: string; currency: string; label: string; flag: string; dateFormat: string; note?: string }
const LOCALES: LocaleConfig[] = [
  { locale: "en-US", currency: "USD", label: "United States",  flag: "🇺🇸", dateFormat: "MM/DD/YYYY" },
  { locale: "en-GB", currency: "GBP", label: "United Kingdom", flag: "🇬🇧", dateFormat: "DD/MM/YYYY" },
  { locale: "id-ID", currency: "IDR", label: "Indonesia",      flag: "🇮🇩", dateFormat: "DD/MM/YYYY", note: "No decimal for IDR" },
  { locale: "th-TH", currency: "THB", label: "Thailand",       flag: "🇹🇭", dateFormat: "DD/MM/YYYY (Buddhist Era +543)", note: "Buddhist Era year" },
  { locale: "vi-VN", currency: "VND", label: "Vietnam",        flag: "🇻🇳", dateFormat: "DD/MM/YYYY", note: "No decimal for VND" },
  { locale: "ms-MY", currency: "MYR", label: "Malaysia",       flag: "🇲🇾", dateFormat: "DD/MM/YYYY" },
  { locale: "en-SG", currency: "SGD", label: "Singapore",      flag: "🇸🇬", dateFormat: "DD/MM/YYYY" },
  { locale: "en-PH", currency: "PHP", label: "Philippines",    flag: "🇵🇭", dateFormat: "MM/DD/YYYY" },
  { locale: "de-DE", currency: "EUR", label: "Germany",        flag: "🇩🇪", dateFormat: "DD.MM.YYYY", note: "Dot decimal separator" },
  { locale: "ja-JP", currency: "JPY", label: "Japan",          flag: "🇯🇵", dateFormat: "YYYY年M月D日", note: "No decimal for JPY" },
  { locale: "hi-IN", currency: "INR", label: "India",          flag: "🇮🇳", dateFormat: "DD/MM/YYYY", note: "Lakh/Crore numbering" },
];

const formatCurrency = (value: number, locale: string, currency: string): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency", currency,
      minimumFractionDigits: ["JPY","IDR","VND","KRW"].includes(currency) ? 0 : 2,
      maximumFractionDigits: ["JPY","IDR","VND","KRW"].includes(currency) ? 0 : 2,
    }).format(value);
  } catch { return `${currency} ${value}`; }
};

const formatDate = (date: Date, locale: string, calendar?: string): string => {
  try {
    const opts: Intl.DateTimeFormatOptions = {
      year: "numeric", month: "long", day: "numeric",
      ...(calendar ? { calendar } : {}),
    };
    return new Intl.DateTimeFormat(locale, opts).format(date);
  } catch { return date.toDateString(); }
};

const formatCompact = (value: number, locale: string): string => {
  try {
    return new Intl.NumberFormat(locale, { notation: "compact", compactDisplay: "short" }).format(value);
  } catch { return String(value); }
};

// ─────────────────────────────────────────────────────────────────
// Four Platforms data
// ─────────────────────────────────────────────────────────────────

type PlatformKey = "seller" | "partner" | "live" | "campaign";
interface PlatformConfig { key: PlatformKey; name: string; icon: string; user: string; color: string; metrics: { label: string; value: string; change: string }[] }

const PLATFORMS: PlatformConfig[] = [
  {
    key: "seller", name: "Seller Compass", icon: "🏪", user: "TikTok Shop Sellers", color: "#fe2c55",
    metrics: [
      { label: "Total GMV",      value: "USD 184,200", change: "+24.3%" },
      { label: "Orders",         value: "3,198",       change: "+18.1%" },
      { label: "Conversion",     value: "6.8%",        change: "+1.2pp" },
      { label: "Avg Order Val.", value: "USD 57.60",   change: "+5.2%"  },
      { label: "Return Rate",    value: "2.4%",        change: "-0.3pp" },
      { label: "Seller Rating",  value: "4.87 ★",      change: "+0.02"  },
    ],
  },
  {
    key: "partner", name: "Partner Compass", icon: "🤝", user: "Agency Partners", color: "#0ea5e9",
    metrics: [
      { label: "Managed GMV",    value: "USD 2.4M",   change: "+31.2%"  },
      { label: "Active Clients", value: "47",          change: "+5"      },
      { label: "Commission",     value: "USD 48,000",  change: "+28.4%"  },
      { label: "Best Performer", value: "BeautyBrand", change: "+140%"   },
      { label: "Avg ROAS",       value: "4.2×",        change: "+0.8×"   },
      { label: "Campaigns Live", value: "12",          change: "+3"      },
    ],
  },
  {
    key: "live", name: "Live Console", icon: "📡", user: "Creators & Streamers", color: "#22c55e",
    metrics: [
      { label: "Peak Viewers",   value: "12,400",      change: "+34.2%" },
      { label: "Avg Watch Time", value: "8m 42s",      change: "+1m12s" },
      { label: "Gifts Revenue",  value: "USD 2,840",   change: "+62.1%" },
      { label: "New Followers",  value: "1,840",       change: "+210"   },
      { label: "Live GMV",       value: "USD 48,200",  change: "+88.4%" },
      { label: "Engagement",     value: "18.4%",       change: "+3.2pp" },
    ],
  },
  {
    key: "campaign", name: "Campaign Console", icon: "🎯", user: "Campaign Managers", color: "#a855f7",
    metrics: [
      { label: "Active Campaigns",value: "8",          change: "+3"      },
      { label: "Total Budget",    value: "USD 120K",    change: "Budget"  },
      { label: "Spend Rate",      value: "68.4%",       change: "On track"},
      { label: "Total Reach",     value: "4.2M",        change: "+840K"   },
      { label: "Avg CTR",         value: "4.8%",        change: "+0.6pp"  },
      { label: "Campaign GMV",    value: "USD 385K",    change: "+41.2%"  },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 260 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function TikTokShopDemo() {
  const [activeTab, setActiveTab] = useState<"campaign" | "flags" | "i18n">("campaign");

  // ── Campaign Workbench
  const [metrics, setMetrics] = useState<CampaignMetric[]>([
    { label: "Campaign GMV",    value: 184200,  target: 250000, prev: 148400, unit: "currency", icon: "💰", color: "#fe2c55" },
    { label: "Orders",          value: 3198,    target: 5000,   prev: 2710,   unit: "count",    icon: "📦", color: "#f59e0b" },
    { label: "Conversion Rate", value: 6.8,     target: 8.0,    prev: 6.1,    unit: "percent",  icon: "⚡", color: "#0ea5e9" },
    { label: "Avg Order Value", value: 57.60,   target: 60,     prev: 54.76,  unit: "currency", icon: "🧾", color: "#22c55e" },
  ]);
  const [alerts, setAlerts] = useState<CampaignAlert[]>([]);
  const [campaignSeconds, setCampaignSeconds] = useState(3 * 3600 + 42 * 60 + 18);
  const [chartPoints, setChartPoints] = useState<number[]>([120000, 134000, 148000, 156000, 165000, 172000, 180000, 184200]);
  const alertRef = useRef(false);

  useEffect(() => {
    const int = setInterval(() => {
      setCampaignSeconds(s => Math.max(0, s - 1));
      setMetrics(prev => prev.map(m => {
        if (m.label === "Campaign GMV") return { ...m, value: Math.min(m.target!, m.value + Math.random() * 400) };
        if (m.label === "Orders")       return { ...m, value: m.value + Math.floor(Math.random() * 3) };
        if (m.label === "Conversion Rate") {
          const delta = (Math.random() - 0.5) * 0.08;
          const newVal = Math.max(3, Math.min(15, m.value + delta));
          if (newVal < 5 && !alertRef.current) {
            alertRef.current = true;
            setAlerts(prev => ([{ id: `a${Date.now()}`, type: "warn" as const, message: `Conversion rate dropped to ${newVal.toFixed(1)}% — below 5% threshold. Check product inventory.`, time: new Date().toLocaleTimeString() }, ...prev] as CampaignAlert[]).slice(0, 3));
            setTimeout(() => { alertRef.current = false; }, 8000);
          }
          return { ...m, value: newVal };
        }
        return m;
      }));
      setChartPoints(prev => {
        const last = prev[prev.length - 1];
        const next = last + Math.random() * 500 - 50;
        return [...prev.slice(-11), Math.max(0, next)];
      });
    }, 1600);
    return () => clearInterval(int);
  }, []);

  const fmtTime = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Feature Flags
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(FEATURE_FLAGS[0]);
  const [previewUser, setPreviewUser] = useState<{ group: UserGroup; region: Region; tier: SellerTier }>({ group: "sellers", region: "US", tier: "pro" });
  const [localFlags, setLocalFlags] = useState<FeatureFlag[]>(FEATURE_FLAGS);

  const evaluateFlag = (flag: FeatureFlag, user: typeof previewUser): "enabled" | "disabled" | "variant-a" | "variant-b" => {
    if (flag.status === "disabled") return "disabled";
    if (!flag.userGroups.includes(user.group)) return "disabled";
    if (!flag.regions.includes(user.region)) return "disabled";
    if (!flag.tiers.includes(user.tier)) return "disabled";
    if (flag.status === "ab-test") return Math.random() > 0.5 ? "variant-a" : "variant-b";
    if (flag.status === "rollout" && flag.rolloutPct < 100) return "enabled"; // simplified: show as enabled if criteria match
    return "enabled";
  };

  const flagStatusColor = (s: FeatureStatus) =>
    s === "enabled" ? "#22c55e" : s === "disabled" ? "#ef4444" : s === "rollout" ? "#f59e0b" : "#a855f7";

  // ── i18n
  const [currencyInput, setCurrencyInput] = useState("1234567.89");
  const [dateInput, setDateInput]         = useState(new Date().toISOString().slice(0, 10));
  const [selectedLocale, setSelectedLocale] = useState<LocaleConfig>(LOCALES[0]);
  const [activePlatform, setActivePlatform] = useState<PlatformKey>("seller");

  const numVal   = parseFloat(currencyInput) || 0;
  const dateVal  = new Date(dateInput + "T12:00:00Z");
  const currPlatform = PLATFORMS.find(p => p.key === activePlatform)!;

  const TABS = [
    { id: "campaign" as const, label: "📊 Campaign Workbench" },
    { id: "flags"    as const, label: "🎛 Feature Flags"      },
    { id: "i18n"     as const, label: "🌏 i18n + Platforms"   },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#fe2c55,#ff6550)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛍</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>TikTok Shop — Data & Operations Platform</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Campaign Workbench · Feature Management · i18n Library · 4 Insight Platforms</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "Real-time", l: "Campaign Workbench", c: "#fe2c55", sub: "GMV · Orders · CVR live"      },
            { v: "A/B + Geo", l: "Feature Management", c: "#a855f7", sub: "Flags · Rollout · Targeting"  },
            { v: "11 Locales", l: "i18n Library",       c: "#f59e0b", sub: "Currency · Date · Compact"   },
            { v: "4",          l: "Insight Platforms",  c: "#22c55e", sub: "Seller · Partner · Live · CG" },
          ].map(m => (
            <div key={m.l} style={{ background: "#1e293b", border: `1px solid ${m.c}20`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 9, fontWeight: 700 }}>{m.l}</div>
              <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#1e293b" : "transparent", color: activeTab === tab.id ? "#f1f5f9" : "#64748b", border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 24px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── CAMPAIGN WORKBENCH ── */}
      {activeTab === "campaign" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14 }}>
          {/* Left: campaign UI */}
          <div>
            {/* Campaign header */}
            <div style={{ background: "linear-gradient(135deg, #fe2c5510, #ff655008)", border: "1px solid #fe2c5530", borderRadius: 12, padding: "12px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800 }}>🔴 LIVE — TikTok Shop Super Sale</div>
                <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>Beauty & Personal Care · Launched 2024-06-18 09:00 UTC</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 8, color: "#64748b" }}>Time Remaining</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fe2c55", fontFamily: "monospace" }}>{fmtTime(campaignSeconds)}</div>
              </div>
            </div>

            {/* Metrics grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
              {metrics.map(m => {
                const changeVsPrev = m.prev ? ((m.value - m.prev) / m.prev * 100) : 0;
                const pct = m.target ? Math.min(100, (m.value / m.target) * 100) : null;
                return (
                  <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${m.color}20`, borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 8, color: "#64748b" }}>{m.label}</span>
                      <span style={{ fontSize: 10 }}>{m.icon}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: m.color, transition: "all 0.5s" }}>
                      {m.unit === "currency" ? `$${m.value >= 1000 ? (m.value / 1000).toFixed(1) + "K" : m.value.toFixed(2)}` :
                       m.unit === "percent"  ? `${m.value.toFixed(1)}%` : m.value.toLocaleString()}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
                      <span style={{ fontSize: 7, color: changeVsPrev >= 0 ? "#22c55e" : "#ef4444" }}>
                        {changeVsPrev >= 0 ? "▲" : "▼"} {Math.abs(changeVsPrev).toFixed(1)}% vs prev
                      </span>
                    </div>
                    {pct !== null && (
                      <div style={{ marginTop: 5 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#475569", marginBottom: 2 }}>
                          <span>vs target</span><span>{pct.toFixed(0)}%</span>
                        </div>
                        <div style={{ background: "#0f172a", borderRadius: 2, height: 4 }}>
                          <div style={{ height: "100%", background: pct >= 80 ? m.color : "#f59e0b", width: `${pct}%`, borderRadius: 2, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mini time-series chart */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, color: "#64748b", marginBottom: 6 }}>Campaign GMV — Real-time (last 12 data points)</div>
              <svg width="100%" height="60" viewBox={`0 0 ${chartPoints.length * 40} 60`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fe2c55" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#fe2c55" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const min = Math.min(...chartPoints) * 0.98;
                  const max = Math.max(...chartPoints) * 1.02;
                  const pts = chartPoints.map((v, i) => `${i * 40},${60 - ((v - min) / (max - min)) * 55}`);
                  const polyline = pts.join(" ");
                  const area = `0,60 ${polyline} ${(chartPoints.length - 1) * 40},60`;
                  return (
                    <>
                      <polygon points={area} fill="url(#gmvGrad)" />
                      <polyline points={polyline} fill="none" stroke="#fe2c55" strokeWidth="2" strokeLinecap="round" />
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Top products */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 90px 70px 60px 30px", borderBottom: "1px solid #334155", padding: "6px 12px", background: "#0f172a" }}>
                {["#", "Product", "GMV", "Orders", "CVR", ""].map(h => <div key={h} style={{ fontSize: 7, fontWeight: 700, color: "#475569" }}>{h}</div>)}
              </div>
              {PRODUCTS.map(p => (
                <div key={p.rank} style={{ display: "grid", gridTemplateColumns: "24px 1fr 90px 70px 60px 30px", borderBottom: "1px solid #1e293b", padding: "7px 12px", alignItems: "center" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: "#475569" }}>{p.rank}</div>
                  <div style={{ fontSize: 8, fontWeight: 600, paddingRight: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 8, fontFamily: "monospace" }}>${(p.gmv / 1000).toFixed(1)}K</div>
                  <div style={{ fontSize: 8 }}>{p.orders.toLocaleString()}</div>
                  <div style={{ fontSize: 8, color: p.conv > 8 ? "#22c55e" : p.conv > 5 ? "#f59e0b" : "#ef4444" }}>{p.conv}%</div>
                  <div style={{ fontSize: 9, color: p.trend === "up" ? "#22c55e" : p.trend === "down" ? "#ef4444" : "#64748b" }}>
                    {p.trend === "up" ? "▲" : p.trend === "down" ? "▼" : "—"}
                  </div>
                </div>
              ))}
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {alerts.map(a => (
                  <div key={a.id} style={{ background: a.type === "warn" ? "#f59e0b15" : "#ef444415", border: `1px solid ${a.type === "warn" ? "#f59e0b" : "#ef4444"}30`, borderRadius: 7, padding: "7px 10px", marginBottom: 4, display: "flex", gap: 7 }}>
                    <span style={{ fontSize: 10 }}>{a.type === "warn" ? "⚠" : "🚨"}</span>
                    <div>
                      <div style={{ fontSize: 8 }}>{a.message}</div>
                      <div style={{ fontSize: 6, color: "#475569", marginTop: 2 }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBlock label="Campaign Workbench — real-time architecture, alert engine, data flow" color="#fe2c55" code={
`// CAMPAIGN WORKBENCH: WHY "REAL-TIME" MATTERS
//
// CONTEXT: TIKTOK SHOP CAMPAIGN (e.g., "Super Sale" flash event)
// A seller has allocated USD 120K budget for a 6-hour campaign.
// Inventory: pre-staged. Ads: paid for. The window: narrow.
//
// WITHOUT real-time insights (the old state):
// Seller checks the dashboard → data is 30 minutes delayed.
// At hour 2: conversion rate dropped (product out of stock).
// Seller doesn't know. The campaign burns budget at 0% conversion.
// By the time the daily report arrives: USD 40K wasted.
//
// WITH Campaign Workbench (real-time):
// Data: refreshed every 60 seconds (WebSocket push from campaign service).
// Conversion rate drop → alert fires → seller restocks or pivots to another product.
// Decision window: MINUTES, not hours.
//
// DATA ARCHITECTURE:
// Campaign Workbench uses a two-tier refresh strategy:
//
// TIER 1: WebSocket (real-time streaming, sub-30s)
// Campaign service: publishes events as they occur.
// Events: order_completed, ad_impression, product_click.
// Frontend: accumulates these events, updates running totals in memory.
// GMV: incremented by order_completed.amount on each event.
// Conversion: recalculated: orders / clicks (rolling 5-minute window).
//
// TIER 2: REST polling (60s interval, reconciliation)
// Every 60 seconds: fetch the authoritative aggregate from the API.
// Why: WebSocket events can be lost (network disconnect, reconnect).
// The poll: reconciles the in-memory total with the backend's computed aggregate.
// If delta > 5%: the in-memory counter was ahead/behind → correct it.
//
// This two-tier approach: real-time feel + eventual consistency guarantee.
//
// ALERT ENGINE:
// Each metric has a threshold configuration:
const thresholds = {
  conversion_rate: { warn: 5.0, critical: 3.0 },  // %, below = alert
  gmv_burn_rate:   { warn: 0.4, critical: 0.2 },  // GMV/hour vs target
  product_stock:   { warn: 50,  critical: 10  },   // units remaining
};
// Threshold check: runs on every data update (not on a separate timer).
// Debounced: 5 seconds (prevents alert spam on transient dips).
// Alert deduplication: same metric + same threshold = one alert per 5 minutes.
//
// CHART (time-series): SVG polyline, not a chart library.
// Why not Recharts/Chart.js:
// A campaign chart updates every 60 seconds for 6-8 hours.
// Recharts: re-renders the full component tree on every data point.
// Raw SVG: append one point, shift the window, update the polyline.
// Performance: O(1) DOM update per data point vs full re-render.
// For a 6-hour campaign at 60s intervals: 360 data points.
// SVG approach: smooth at 360 points. Recharts: visible lag at 100+.`} />
          </div>
        </div>
      )}

      {/* ── FEATURE FLAGS ── */}
      {activeTab === "flags" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Left: flag manager */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>FEATURE FLAG MANAGER</div>

            {/* Flag list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
              {localFlags.map(flag => (
                <div key={flag.id} onClick={() => setSelectedFlag(flag)} style={{ background: selectedFlag?.id === flag.id ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedFlag?.id === flag.id ? "#3b82f6" : flagStatusColor(flag.status) + "30"}`, borderRadius: 9, padding: "10px 12px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700 }}>{flag.name}</div>
                      <div style={{ fontSize: 7, fontFamily: "monospace", color: "#64748b" }}>{flag.key}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {flag.status === "rollout" && (
                        <span style={{ fontSize: 7, color: "#f59e0b" }}>{flag.rolloutPct}%</span>
                      )}
                      <span style={{ fontSize: 7, background: flagStatusColor(flag.status) + "20", color: flagStatusColor(flag.status), borderRadius: 4, padding: "1px 7px", fontWeight: 700 }}>{flag.status}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 7, color: "#475569" }}>{flag.description}</div>

                  {selectedFlag?.id === flag.id && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                      {/* Rollout slider */}
                      {(flag.status === "rollout" || flag.status === "ab-test") && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, marginBottom: 3 }}>
                            <span style={{ color: "#64748b" }}>Rollout percentage</span>
                            <span style={{ color: "#f59e0b", fontWeight: 700 }}>{flag.rolloutPct}%</span>
                          </div>
                          <input type="range" min="0" max="100" value={flag.rolloutPct} onChange={e => setLocalFlags(prev => prev.map(f => f.id === flag.id ? { ...f, rolloutPct: parseInt(e.target.value) } : f))} style={{ width: "100%", accentColor: "#f59e0b" }} />
                        </div>
                      )}

                      {/* A/B variants */}
                      {flag.variants && (
                        <div>
                          <div style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>A/B Variants</div>
                          <div style={{ display: "flex", gap: 5 }}>
                            {flag.variants.map((v, vi) => (
                              <div key={v.id} style={{ flex: 1, background: "#0f172a", border: `1px solid ${vi === 0 ? "#0ea5e9" : "#a855f7"}30`, borderRadius: 6, padding: "6px 8px" }}>
                                <div style={{ fontSize: 7, fontWeight: 700, color: vi === 0 ? "#38bdf8" : "#c084fc" }}>{v.name}</div>
                                <div style={{ fontSize: 9, fontWeight: 900 }}>{v.allocation}%</div>
                                <div style={{ fontSize: 6, color: "#475569", marginTop: 2 }}>{v.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Regions */}
                      <div>
                        <div style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>Target Regions</div>
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          {(["US","UK","ID","TH","VN","MY","SG","PH"] as Region[]).map(r => (
                            <span key={r} style={{ fontSize: 7, background: flag.regions.includes(r) ? "#0ea5e920" : "#334155", color: flag.regions.includes(r) ? "#38bdf8" : "#475569", borderRadius: 3, padding: "1px 6px", cursor: "pointer" }}>{r}</span>
                          ))}
                        </div>
                      </div>

                      {/* Tiers */}
                      <div>
                        <div style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>Seller Tiers</div>
                        <div style={{ display: "flex", gap: 3 }}>
                          {(["free","pro","enterprise"] as SellerTier[]).map(t => (
                            <span key={t} style={{ fontSize: 7, background: flag.tiers.includes(t) ? "#22c55e20" : "#334155", color: flag.tiers.includes(t) ? "#4ade80" : "#475569", borderRadius: 3, padding: "1px 8px" }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: preview + code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>FLAG EVALUATION PREVIEW</div>

            {/* User simulator */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, color: "#64748b", marginBottom: 8 }}>Simulate flag evaluation for a user with:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 7, color: "#475569", marginBottom: 3 }}>User Group</div>
                  <select value={previewUser.group} onChange={e => setPreviewUser(prev => ({ ...prev, group: e.target.value as UserGroup }))} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 5, padding: "4px 7px", color: "#f1f5f9", fontSize: 8, outline: "none" }}>
                    {(["sellers","creators","agencies","admins"] as UserGroup[]).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 7, color: "#475569", marginBottom: 3 }}>Region</div>
                  <select value={previewUser.region} onChange={e => setPreviewUser(prev => ({ ...prev, region: e.target.value as Region }))} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 5, padding: "4px 7px", color: "#f1f5f9", fontSize: 8, outline: "none" }}>
                    {(["US","UK","ID","TH","VN","MY","SG","PH"] as Region[]).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 7, color: "#475569", marginBottom: 3 }}>Seller Tier</div>
                  <select value={previewUser.tier} onChange={e => setPreviewUser(prev => ({ ...prev, tier: e.target.value as SellerTier }))} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 5, padding: "4px 7px", color: "#f1f5f9", fontSize: 8, outline: "none" }}>
                    {(["free","pro","enterprise"] as SellerTier[]).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {localFlags.map(flag => {
                  const result = evaluateFlag(flag, previewUser);
                  const color = result === "enabled" || result === "variant-a" || result === "variant-b" ? "#22c55e" : "#ef4444";
                  return (
                    <div key={flag.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", borderRadius: 5, padding: "5px 9px" }}>
                      <div style={{ fontSize: 7, fontFamily: "monospace" }}>{flag.key}</div>
                      <span style={{ fontSize: 7, background: color + "20", color, borderRadius: 3, padding: "1px 7px", fontWeight: 700 }}>
                        {result === "variant-a" ? "Variant A" : result === "variant-b" ? "Variant B" : result}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <CodeBlock label="Feature flag platform — evaluation logic, A/B testing, SDK" color="#a855f7" code={
`// FEATURE MANAGEMENT PLATFORM: WHY NOT JUST ENV VARIABLES
//
// PROBLEM WITH ENV VARIABLES (what we had before):
// NEXT_PUBLIC_ENABLE_CAMPAIGN_V2=true
// This is a BUILD-TIME flag. To change it: rebuild and redeploy.
// Redeploy: 20+ minutes. For a flag that should be "toggleable" in seconds.
//
// THE FEATURE MANAGEMENT PLATFORM:
// Flags: stored in a database. Read by the frontend at runtime.
// Change a flag: instant. No rebuild. No redeploy.
// Works for: A/B testing, emergency kill switches, gradual rollouts.
//
// FLAG EVALUATION (THREE DIMENSIONS):
function evaluateFlag(flag: FeatureFlag, user: UserContext): EvalResult {
  // Dimension 1: Is the flag even targeting this user's group?
  if (!flag.userGroups.includes(user.group)) return { enabled: false, reason: "group" };
  
  // Dimension 2: Is the user in a targeted region?
  if (!flag.regions.includes(user.region)) return { enabled: false, reason: "region" };
  
  // Dimension 3: Is the user on a targeted tier?
  if (!flag.tiers.includes(user.tier)) return { enabled: false, reason: "tier" };
  
  // Dimension 4: Rollout percentage (hash-based, DETERMINISTIC):
  if (flag.status === "rollout") {
    // Hash the user ID to a 0-100 number.
    // The SAME user always hashes to the SAME number.
    // This prevents: user sees feature on Monday, doesn't see it Tuesday.
    const userBucket = hashUserToBucket(user.uid, flag.key); // 0-99
    if (userBucket >= flag.rolloutPct) return { enabled: false, reason: "rollout" };
    return { enabled: true, variant: null };
  }
  
  // Dimension 5: A/B variant assignment (also hash-based, deterministic):
  if (flag.status === "ab-test" && flag.variants) {
    const variantBucket = hashUserToBucket(user.uid, flag.key + "_variant"); // 0-99
    let cumulative = 0;
    for (const variant of flag.variants) {
      cumulative += variant.allocation;
      if (variantBucket < cumulative) return { enabled: true, variant: variant.id };
    }
  }
  
  return { enabled: flag.status === "enabled", variant: null };
}
//
// WHY HASH-BASED BUCKETING (not random):
// If we used Math.random(): the user would be assigned a different variant
// on every page load. Inconsistent experience. A/B results: contaminated.
// Hash(userId + flagKey): always produces the same bucket for the same user.
// The user: always sees the same variant. A/B test results: valid.
//
// FRONTEND SDK:
const useFeatureFlag = (flagKey: string) => {
  const user = useUserContext();
  const flags = useFeatureFlags();           // pre-loaded from API on app init
  const flag = flags[flagKey];
  if (!flag) return { enabled: false, variant: null };
  return evaluateFlag(flag, user);
};
//
// USAGE IN COMPONENTS:
function CampaignDashboard() {
  const { enabled, variant } = useFeatureFlag("campaign_workbench_v2");
  if (!enabled) return <CampaignDashboardLegacy />;
  if (variant === "variant-b") return <CampaignWorkbenchV2Enhanced />;
  return <CampaignWorkbenchV2 />;
}
// This component: renders the right experience per user.
// The flag evaluation: happens on the client. No network request per render.
// The flags: loaded once at app init (cached in memory + localStorage).`} />
          </div>
        </div>
      )}

      {/* ── i18n + PLATFORMS ── */}
      {activeTab === "i18n" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* i18n playground */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>DATE & CURRENCY FORMATTING LIBRARY</div>

            {/* Inputs */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 8, color: "#64748b", marginBottom: 3 }}>Amount</div>
                  <input value={currencyInput} onChange={e => setCurrencyInput(e.target.value)} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 9px", color: "#f1f5f9", fontSize: 11, boxSizing: "border-box", outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: 8, color: "#64748b", marginBottom: 3 }}>Date</div>
                  <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 9px", color: "#f1f5f9", fontSize: 11, boxSizing: "border-box", outline: "none" }} />
                </div>
              </div>

              {/* All locales */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {LOCALES.map(loc => {
                  const formattedCurrency = formatCurrency(numVal, loc.locale, loc.currency);
                  const formattedDate = formatDate(dateVal, loc.locale);
                  const compact = formatCompact(numVal, loc.locale);
                  const isSelected = selectedLocale.locale === loc.locale;
                  return (
                    <div key={loc.locale} onClick={() => setSelectedLocale(loc)} style={{ background: isSelected ? "#1e3a5f" : "#0f172a", border: `1px solid ${isSelected ? "#3b82f6" : "#1e293b"}`, borderRadius: 7, padding: "7px 10px", cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 12 }}>{loc.flag}</span>
                          <div>
                            <div style={{ fontSize: 8, fontWeight: 700 }}>{loc.label}</div>
                            {loc.note && <div style={{ fontSize: 6, color: "#f59e0b" }}>★ {loc.note}</div>}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 9, fontFamily: "monospace", fontWeight: 700 }}>{formattedCurrency}</div>
                          <div style={{ fontSize: 7, color: "#64748b" }}>{formattedDate}</div>
                          <div style={{ fontSize: 6, color: "#475569" }}>compact: {compact}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <CodeBlock label="i18n library — Intl wrapper, edge cases, Indian lakhs, Thai BE" color="#f59e0b" code={
`// DATE & CURRENCY FORMATTING LIBRARY: WHY WE BUILT IT
//
// THE PROBLEM: REGION-SPECIFIC FORMATTING RULES
//
// CURRENCY EXAMPLES for 1234567.89:
// en-US (USD): $1,234,567.89   — comma thousands, dot decimal, symbol before
// de-DE (EUR): 1.234.567,89 € — dot thousands, comma decimal, symbol after
// hi-IN (INR): ₹12,34,567.89  — LAKH system: 12 lakh 34 thousand 567
// ja-JP (JPY): ¥1,234,568      — NO decimal (JPY has no sub-unit in practice)
// id-ID (IDR): Rp1.234.568     — NO decimal (IDR sub-unit deprecated)
// vi-VN (VND): 1.234.568 ₫    — NO decimal, symbol after, dot thousands
//
// DATE EXAMPLES for 2024-06-18:
// en-US: June 18, 2024         — Month Day, Year
// en-GB: 18 June 2024          — Day Month Year (written)
// de-DE: 18. Juni 2024         — German: dot after day
// ja-JP: 2024年6月18日          — Year Month Day with CJK characters
// th-TH: 18 มิถุนายน 2567     — BUDDHIST ERA: 2024 + 543 = 2567
// vi-VN: 18 tháng 6, 2024     — Vietnamese month format
//
// WHY NOT JUST USE Intl DIRECTLY EVERYWHERE:
// Intl.NumberFormat and Intl.DateTimeFormat are the correct API.
// Problem: 7 different usages across 4 platforms. Each with different options.
// Inconsistency: one platform showed "US$1,234" another "$1,234" for USD.
// Missing TikTok-specific rules:
//   1. Compact notation: "1.2M" not "1,200,000" for large numbers.
//      Intl supports this. But our threshold was 10K, not 1M. Custom.
//   2. Zero handling: 0 should show "—" not "$0.00" in most dashboards.
//   3. Null handling: null → "—" (vs runtime crash).
//   4. Campaign GMV: always show currency code (USD) not symbol ($).
//      For multi-currency dashboards: "USD 1,234" clearer than "$1,234".
//
// OUR LIBRARY (thin wrapper over Intl):
//
// formatCurrency(value, options):
//   Handles: null → "—"
//   Handles: 0 + options.showZeroAsDash → "—"
//   Applies: no-decimal currencies (JPY, IDR, VND, KRW)
//   Applies: compact notation threshold (default: 10,000)
//   Supports: symbol mode ("$") vs code mode ("USD")
//   Returns: a consistently formatted string.
//
// formatDate(value, options):
//   Handles: null → "—"
//   Handles: Thai Buddhist Era (th-TH calendar: "buddhist")
//   Handles: relative mode ("2 hours ago", "yesterday")
//   Returns: a consistently formatted string per locale.
//
// THAI BUDDHIST ERA — the trickiest edge case:
// Thailand uses the Buddhist Era calendar (BE = CE + 543).
// 2024 CE = 2567 BE.
// Intl.DateTimeFormat with calendar: "buddhist" handles this.
// BUT: the locale must be "th-TH" for the correct Buddhist Era display.
// Using "en-US" with calendar: "buddhist" outputs in English with BE year.
// Wrong: "June 18, 2567". Right (Thai): "18 มิถุนายน 2567".
// We enforce: Buddhist Era only with th-TH locale.
// The library: prevents misuse at the function signature level.
//
// INDIAN LAKH SYSTEM — the second tricky case:
// India: 1,00,000 = 1 lakh (100K). 1,00,00,000 = 1 crore (10M).
// The grouping: every 2 digits after the first 3. Not every 3 digits.
// Intl.NumberFormat with locale "hi-IN": handles this natively.
// Our library: just passes "hi-IN". Intl does the rest.
// The value: 1234567 → "₹12,34,567" (not "₹1,234,567").`} />
          </div>

          {/* Four platforms */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>FOUR INSIGHT PLATFORMS</div>

            {/* Platform switcher */}
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              {PLATFORMS.map(p => (
                <button key={p.key} onClick={() => setActivePlatform(p.key)} style={{ flex: 1, background: activePlatform === p.key ? p.color + "20" : "#1e293b", border: `1px solid ${activePlatform === p.key ? p.color : "#334155"}`, borderRadius: 7, padding: "7px 4px", cursor: "pointer", color: activePlatform === p.key ? p.color : "#64748b", fontSize: 8, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontSize: 14 }}>{p.icon}</span>
                  <span style={{ fontSize: 7 }}>{p.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            {/* Platform dashboard */}
            <div style={{ background: "#1e293b", border: `1px solid ${currPlatform.color}20`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{currPlatform.icon} {currPlatform.name}</div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>For: {currPlatform.user}</div>
                </div>
                <span style={{ fontSize: 7, background: currPlatform.color + "20", color: currPlatform.color, borderRadius: 4, padding: "2px 8px" }}>LIVE</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {currPlatform.metrics.map(m => (
                  <div key={m.label} style={{ background: "#0f172a", borderRadius: 7, padding: "8px 10px" }}>
                    <div style={{ fontSize: 7, color: "#64748b", marginBottom: 2 }}>{m.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#f1f5f9" }}>{m.value}</div>
                    <div style={{ fontSize: 7, color: m.change.startsWith("+") ? "#22c55e" : m.change.startsWith("-") ? "#ef4444" : "#64748b" }}>{m.change}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform differences */}
            <CodeBlock label="Four platforms — shared infrastructure, platform-specific concerns" color="#22c55e" code={
`// FOUR PLATFORMS: SHARED INFRASTRUCTURE, DIFFERENT PURPOSES
//
// THE FOUR PLATFORMS:
//
// 1. SELLER COMPASS (for TikTok Shop sellers)
//    Key metrics: GMV, orders, conversion rate, average order value, return rate.
//    Key insight: "How is my shop performing vs last period vs competitors?"
//    Challenge: per-seller data isolation. Seller A cannot see Seller B's data.
//    Solution: all API calls include seller_id from JWT. Backend enforces at row level.
//    Special: the formatting library is critical here. Sellers in Indonesia see IDR (no decimal).
//             Sellers in Germany see EUR (comma decimal, dot thousands).
//
// 2. PARTNER COMPASS (for agency partners)
//    Key metrics: managed GMV across all clients, commission earnings, client performance.
//    Key insight: "Which of my clients needs attention? Who's growing? Who's declining?"
//    Challenge: an agency manages 10-50 client seller accounts.
//               Dashboard: portfolio view (aggregate) + drill-down (per client).
//    Solution: two-level data model. Partner-level API returns aggregates.
//              Click a client: seller-level API (same as Seller Compass) for that client.
//    Special: commission calculation. Partners receive a % of GMV for their clients.
//             Commission rate: varies per tier and per contract. Displayed separately.
//
// 3. LIVE CONSOLE (for creators and streamers)
//    Key metrics: peak concurrent viewers, average watch time, gift revenue, new followers.
//    Key insight: "How is my live stream performing RIGHT NOW?"
//    Challenge: this IS real-time. Live Console needs WebSocket for CURRENT viewer count.
//               A creator can't wait 30 minutes to know if their stream is working.
//    Solution: WebSocket for live metrics (peak viewers, current viewers, gift events).
//              REST for historical (previous streams comparison).
//    Special: gift revenue. Creators receive a share of the "coins" spent on gifts.
//             The conversion: TikTok coins → USD. Displayed in the creator's local currency.
//             The i18n library: used heavily here.
//
// 4. CAMPAIGN CONSOLE (for campaign managers)
//    Key metrics: active campaigns, budget spend rate, reach, CTR, campaign GMV.
//    Key insight: "Are my campaigns on track? Where should I reallocate budget?"
//    Challenge: a campaign manager runs 5-20 campaigns simultaneously.
//               They need an overview first, drill-down second.
//    Solution: campaign list view (all campaigns, status, spend rate at a glance).
//              Click: Campaign Workbench (the real-time detailed view).
//
// SHARED INFRASTRUCTURE ACROSS ALL FOUR:
// 1. Component library: DataCard, MetricGrid, TimeRangeSelector, DataTable, ExportButton.
//    Built once. Used by all four platforms.
// 2. Auth layer: same JWT. Role determines which platform the user sees.
//    A seller: Seller Compass. An agency: Partner Compass. A creator: Live Console.
// 3. i18n library: same library for all four. Locale from user profile settings.
// 4. Feature flags: same flag system. A flag can target "sellers" on Seller Compass
//    and "creators" on Live Console simultaneously (or independently).`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default TikTokShopDemo;
