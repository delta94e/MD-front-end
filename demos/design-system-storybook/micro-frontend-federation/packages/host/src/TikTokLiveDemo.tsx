/**
 * TikTokLiveDemo.tsx
 *
 * TikTok Live — Data Platform & Live Operations
 *
 * Achievements:
 *   1. Data inventory, management & visualisation tools (Live Data Platform)
 *   2. Component library across 15+ pages (user segmentation, millions of users)
 *   3. Developer efficiency — CI/CD, codebase quality, DX improvements
 *
 * TABS
 *   📊 Data Platform     — dataset catalog, schema browser, pipeline health dashboard
 *   👥 Segment Builder   — rule-based audience segmentation, real-time size estimation
 *   ⚡ Dev Efficiency    — CI/CD pipeline simulation, before/after metrics, DX tooling
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Data Platform types
// ─────────────────────────────────────────────────────────────────

type DatasetStatus = "healthy" | "stale" | "deprecated" | "loading";
type ColumnType = "string" | "int64" | "float64" | "boolean" | "timestamp" | "array" | "struct";

interface DataColumn { name: string; type: ColumnType; nullable: boolean; description: string; sampleValues: string[] }
interface Dataset {
  id: string; name: string; domain: string; owner: string; description: string;
  status: DatasetStatus; lastUpdated: string; rowCount: string; sizeGB: number;
  freshnessSLA: string; columns: DataColumn[];
}

const DATASETS: Dataset[] = [
  {
    id: "ds1", name: "live_stream_events", domain: "Live Core", owner: "data-eng@tiktok",
    description: "Raw events from all TikTok Live streams — start, end, viewer joins/leaves",
    status: "healthy", lastUpdated: "2 min ago", rowCount: "4.2B", sizeGB: 820,
    freshnessSLA: "5 min", columns: [
      { name: "stream_id", type: "string", nullable: false, description: "Unique stream identifier", sampleValues: ["s_7890abc", "s_2345def"] },
      { name: "event_type", type: "string", nullable: false, description: "Event type (join/leave/gift/comment)", sampleValues: ["join", "gift", "comment"] },
      { name: "viewer_uid", type: "int64", nullable: false, description: "TikTok user ID of the viewer", sampleValues: ["71234567890", "81234567891"] },
      { name: "ts", type: "timestamp", nullable: false, description: "Event timestamp (UTC)", sampleValues: ["2024-05-01 09:15:03.123 UTC"] },
      { name: "country_code", type: "string", nullable: true, description: "ISO 3166-1 alpha-2 country", sampleValues: ["US", "ID", "BR"] },
      { name: "metadata", type: "struct", nullable: true, description: "Event-specific metadata (gift amount, comment text, etc.)", sampleValues: ["{gift_amount: 100}", "{}"] },
    ],
  },
  {
    id: "ds2", name: "user_engagement_daily", domain: "User Analytics", owner: "analytics@tiktok",
    description: "Daily pre-aggregated user engagement metrics across TikTok Live",
    status: "healthy", lastUpdated: "1h ago", rowCount: "680M", sizeGB: 42,
    freshnessSLA: "3h", columns: [
      { name: "uid", type: "int64", nullable: false, description: "User ID", sampleValues: ["71234567890"] },
      { name: "date", type: "timestamp", nullable: false, description: "UTC date (day granularity)", sampleValues: ["2024-05-01"] },
      { name: "watch_time_mins", type: "float64", nullable: false, description: "Total watch time in minutes", sampleValues: ["42.5", "0.0"] },
      { name: "streams_watched", type: "int64", nullable: false, description: "Number of distinct streams", sampleValues: ["3", "12"] },
      { name: "gifts_sent_usd", type: "float64", nullable: true, description: "Total value of gifts sent (USD equiv.)", sampleValues: ["0.0", "5.99"] },
      { name: "is_streamer", type: "boolean", nullable: false, description: "User also streamed on this date", sampleValues: ["false", "true"] },
    ],
  },
  {
    id: "ds3", name: "streamer_performance_v2", domain: "Creator", owner: "creator-eng@tiktok",
    description: "Creator performance metrics: peak concurrent viewers, average gifts, stream quality",
    status: "healthy", lastUpdated: "30 min ago", rowCount: "2.1M", sizeGB: 0.8,
    freshnessSLA: "1h", columns: [
      { name: "streamer_uid", type: "int64", nullable: false, description: "Creator user ID", sampleValues: ["71234567890"] },
      { name: "week", type: "timestamp", nullable: false, description: "Week start date", sampleValues: ["2024-04-29"] },
      { name: "peak_concurrent", type: "int64", nullable: false, description: "Max simultaneous viewers in any stream", sampleValues: ["12400", "89"] },
      { name: "avg_watch_time", type: "float64", nullable: false, description: "Avg viewer watch time per stream (mins)", sampleValues: ["8.3", "22.1"] },
      { name: "stream_quality_p50", type: "float64", nullable: true, description: "Median stream bitrate (kbps)", sampleValues: ["2400.0", "800.0"] },
    ],
  },
  {
    id: "ds4", name: "pipeline_audit_log", domain: "Platform Infra", owner: "infra@tiktok",
    description: "Audit log for all data pipeline runs — latency, status, errors",
    status: "stale", lastUpdated: "4h ago", rowCount: "180M", sizeGB: 6,
    freshnessSLA: "1h", columns: [
      { name: "job_id", type: "string", nullable: false, description: "Pipeline job identifier", sampleValues: ["job_abc123"] },
      { name: "status", type: "string", nullable: false, description: "success | failed | running | skipped", sampleValues: ["success", "failed"] },
      { name: "duration_ms", type: "int64", nullable: false, description: "Job duration in milliseconds", sampleValues: ["12400", "89000"] },
      { name: "error_msg", type: "string", nullable: true, description: "Error message if failed", sampleValues: ["OOMKilled", "null"] },
    ],
  },
  {
    id: "ds5", name: "live_stream_events_v1", domain: "Live Core", owner: "data-eng@tiktok",
    description: "[DEPRECATED] Superseded by live_stream_events v2. Scheduled for deletion 2024-06-01.",
    status: "deprecated", lastUpdated: "30 days ago", rowCount: "2.1B", sizeGB: 380,
    freshnessSLA: "N/A", columns: [],
  },
];

interface PipelineJob { name: string; status: "ok" | "warn" | "error" | "running"; latency: string; lastRun: string; sla: string }
const PIPELINE_JOBS: PipelineJob[] = [
  { name: "stream_events_ingestion",      status: "ok",      latency: "2m 18s", lastRun: "3 min ago",  sla: "5 min"  },
  { name: "user_engagement_daily_agg",    status: "ok",      latency: "47m",    lastRun: "1h ago",    sla: "3h"     },
  { name: "streamer_performance_weekly",  status: "running", latency: "—",      lastRun: "Running…",  sla: "1h"     },
  { name: "pipeline_audit_roll_up",       status: "warn",    latency: "3h 52m", lastRun: "4h ago",    sla: "1h"     },
  { name: "content_safety_ml_export",     status: "error",   latency: "—",      lastRun: "6h ago",    sla: "2h"     },
];

// ─────────────────────────────────────────────────────────────────
// Segment Builder types
// ─────────────────────────────────────────────────────────────────

type Operator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "contains" | "in" | "not_in";
type AttributeType = "string" | "number" | "boolean" | "enum";

interface Attribute { id: string; label: string; type: AttributeType; options?: string[] }
interface SegmentRule { id: string; attribute: string; operator: Operator; value: string }
interface SegmentGroup { id: string; logic: "AND" | "OR"; rules: SegmentRule[] }

const ATTRIBUTES: Attribute[] = [
  { id: "country_code",       label: "Country",               type: "enum",    options: ["US","ID","BR","PH","VN","TH","IN","MY"] },
  { id: "watch_time_mins",    label: "Watch Time (mins/day)", type: "number"  },
  { id: "is_streamer",        label: "Is Streamer",           type: "boolean", options: ["true","false"] },
  { id: "follower_count",     label: "Follower Count",        type: "number"  },
  { id: "gifts_sent_usd",     label: "Gifts Sent (USD)",      type: "number"  },
  { id: "last_active_days",   label: "Days Since Last Active",type: "number"  },
  { id: "streams_watched",    label: "Streams Watched Today", type: "number"  },
  { id: "platform",           label: "Platform",              type: "enum",    options: ["iOS","Android","Web"] },
];

const getOperators = (type: AttributeType): Operator[] =>
  type === "boolean" ? ["="] :
  type === "enum"    ? ["=", "!=", "in", "not_in"] :
                       ["=", "!=", ">", "<", ">=", "<="];

const SAVED_SEGMENTS = [
  { name: "High-Value Viewers",       size: "4.2M", color: "#0ea5e9" },
  { name: "At-Risk Churn",            size: "1.8M", color: "#ef4444" },
  { name: "Active Streamers (SEA)",   size: "320K", color: "#22c55e" },
  { name: "Gift Senders (Whale Tier)",size: "89K",  color: "#f59e0b" },
];

// ─────────────────────────────────────────────────────────────────
// CI/CD data
// ─────────────────────────────────────────────────────────────────

interface CIStage { name: string; durationBefore: number; durationAfter: number; icon: string }
const CI_STAGES: CIStage[] = [
  { name: "Install deps",    durationBefore: 142, durationAfter: 8,  icon: "📦" },
  { name: "TypeScript",      durationBefore: 38,  durationAfter: 12, icon: "🔷" },
  { name: "ESLint",          durationBefore: 45,  durationAfter: 9,  icon: "🔍" },
  { name: "Unit tests",      durationBefore: 210, durationAfter: 55, icon: "✅" },
  { name: "Bundle analysis", durationBefore: 35,  durationAfter: 18, icon: "📊" },
  { name: "Build",           durationBefore: 178, durationAfter: 62, icon: "🔨" },
  { name: "Deploy preview",  durationBefore: 90,  durationAfter: 40, icon: "🚀" },
];

const DX_IMPROVEMENTS = [
  { label: "CI runtime",         before: "12m 18s", after: "3m 24s",  change: "−72%",  c: "#22c55e" },
  { label: "Bundle size",        before: "4.8 MB",  after: "1.9 MB",  change: "−60%",  c: "#22c55e" },
  { label: "TS errors at merge", before: "~40/wk",  after: "0",       change: "−100%", c: "#22c55e" },
  { label: "Test coverage",      before: "34%",     after: "78%",     change: "+129%", c: "#22c55e" },
  { label: "PR cycle time",      before: "3.1 days", after: "0.9 days", change: "−71%", c: "#22c55e" },
  { label: "Pages on library",   before: "0",       after: "15+",     change: "+∞",    c: "#f59e0b" },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 260 }}>{code}</pre>
    </div>
  );
}

const dsColor = (s: DatasetStatus) =>
  s === "healthy" ? "#22c55e" : s === "stale" ? "#f59e0b" : s === "deprecated" ? "#ef4444" : "#0ea5e9";
const pjColor = (s: PipelineJob["status"]) =>
  s === "ok" ? "#22c55e" : s === "warn" ? "#f59e0b" : s === "error" ? "#ef4444" : "#0ea5e9";

const colTypeColor = (t: ColumnType) =>
  t === "string" ? "#a78bfa" : t === "int64" ? "#34d399" : t === "float64" ? "#60a5fa" :
  t === "boolean" ? "#f59e0b" : t === "timestamp" ? "#f87171" : "#94a3b8";

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function TikTokLiveDemo() {
  const [activeTab, setActiveTab] = useState<"data" | "segment" | "devex">("data");

  // ── Data Platform
  const [selectedDs, setSelectedDs]     = useState<Dataset | null>(null);
  const [selectedTab, setSelectedTab]   = useState<"schema" | "health">("schema");
  const [dsSearch, setDsSearch]         = useState("");
  const [liveMetrics, setLiveMetrics]   = useState({ streams: 1240000, viewers: 48200000, eventsPerSec: 220000 });
  const metricsRef = useRef(false);

  useEffect(() => {
    if (metricsRef.current) return; metricsRef.current = true;
    const int = setInterval(() => {
      setLiveMetrics(prev => ({
        streams: Math.max(0, prev.streams + Math.floor((Math.random() - 0.48) * 2000)),
        viewers: Math.max(0, prev.viewers + Math.floor((Math.random() - 0.48) * 50000)),
        eventsPerSec: Math.max(0, prev.eventsPerSec + Math.floor((Math.random() - 0.48) * 3000)),
      }));
    }, 1500);
    return () => clearInterval(int);
  }, []);

  const filteredDs = DATASETS.filter(d =>
    d.name.includes(dsSearch.toLowerCase()) ||
    d.domain.toLowerCase().includes(dsSearch.toLowerCase()) ||
    d.description.toLowerCase().includes(dsSearch.toLowerCase())
  );

  // ── Segment Builder
  const [groups, setGroups] = useState<SegmentGroup[]>([
    { id: "g1", logic: "AND", rules: [
      { id: "r1", attribute: "watch_time_mins", operator: ">", value: "30" },
      { id: "r2", attribute: "last_active_days", operator: "<", value: "7" },
    ]},
  ]);
  const [groupLogic, setGroupLogic] = useState<"AND" | "OR">("AND");
  const [estimatedSize, setEstimatedSize] = useState(4200000);
  const [estimating, setEstimating] = useState(false);
  const estimateRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reEstimate = useCallback(() => {
    if (estimateRef.current) clearTimeout(estimateRef.current);
    setEstimating(true);
    estimateRef.current = setTimeout(() => {
      // Fake estimate based on rule count
      const totalRules = groups.reduce((s, g) => s + g.rules.length, 0);
      const base = 680_000_000;
      const factor = Math.max(0.001, 1 / Math.pow(4.2, totalRules));
      setEstimatedSize(Math.round(base * factor));
      setEstimating(false);
    }, 600);
  }, [groups]);

  useEffect(() => { reEstimate(); }, [groups, reEstimate]);

  const addRule = (groupId: string) => {
    setGroups(prev => prev.map(g => g.id !== groupId ? g : {
      ...g,
      rules: [...g.rules, { id: `r${Date.now()}`, attribute: "watch_time_mins", operator: ">", value: "0" }],
    }));
  };

  const removeRule = (groupId: string, ruleId: string) => {
    setGroups(prev => prev.map(g => g.id !== groupId ? g : {
      ...g, rules: g.rules.filter(r => r.id !== ruleId),
    }).filter(g => g.rules.length > 0));
  };

  const updateRule = (groupId: string, ruleId: string, patch: Partial<SegmentRule>) => {
    setGroups(prev => prev.map(g => g.id !== groupId ? g : {
      ...g, rules: g.rules.map(r => r.id !== ruleId ? r : { ...r, ...patch }),
    }));
  };

  const addGroup = () => {
    setGroups(prev => [...prev, { id: `g${Date.now()}`, logic: "AND", rules: [
      { id: `r${Date.now()}`, attribute: "country_code", operator: "=", value: "ID" }
    ]}]);
  };

  const getAttr = (id: string) => ATTRIBUTES.find(a => a.id === id)!;

  // ── Dev Efficiency
  const [ciMode, setCiMode]         = useState<"before" | "after">("before");
  const [ciRunning, setCiRunning]   = useState(false);
  const [ciProgress, setCiProgress] = useState<number[]>([]);
  const [ciTotal, setCiTotal]       = useState(0);
  const ciRef = useRef(false);

  const runCI = useCallback(async (mode: "before" | "after") => {
    if (ciRef.current) return; ciRef.current = true;
    setCiRunning(true); setCiProgress([]); setCiTotal(0);
    const maxTime = CI_STAGES.reduce((s, st) => s + (mode === "before" ? st.durationBefore : st.durationAfter), 0);
    let elapsed = 0;
    for (let i = 0; i < CI_STAGES.length; i++) {
      const dur = mode === "before" ? CI_STAGES[i].durationBefore : CI_STAGES[i].durationAfter;
      const steps = Math.max(2, Math.round(dur / 20));
      for (let s = 0; s < steps; s++) {
        await new Promise(r => setTimeout(r, 30));
        elapsed += dur / steps;
        setCiTotal(elapsed);
        setCiProgress(prev => {
          const next = [...prev];
          next[i] = (s + 1) / steps;
          return next;
        });
      }
    }
    setCiRunning(false); ciRef.current = false;
  }, []);

  const TABS = [
    { id: "data"    as const, label: "📊 Data Platform"    },
    { id: "segment" as const, label: "👥 Segment Builder"  },
    { id: "devex"   as const, label: "⚡ Dev Efficiency"   },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#fe2c55,#ff6550)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>♪</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>TikTok Live — Data Platform & Operations</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Data Inventory · User Segmentation · Component Library (15+ pages) · CI/CD Efficiency</p>
          </div>
        </div>
        {/* Live metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: liveMetrics.streams.toLocaleString(), l: "Active Streams",      c: "#fe2c55", sub: "Live right now"                  },
            { v: (liveMetrics.viewers / 1e6).toFixed(1) + "M", l: "Concurrent Viewers", c: "#f59e0b", sub: "Events processed in real time" },
            { v: (liveMetrics.eventsPerSec / 1000).toFixed(0) + "K/s", l: "Events / Second", c: "#0ea5e9", sub: "live_stream_events pipeline"  },
            { v: "15+",         l: "Pages on Library",  c: "#22c55e", sub: "Shared component library"          },
          ].map(m => (
            <div key={m.l} style={{ background: "#1e293b", border: `1px solid ${m.c}20`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: m.c, transition: "all 0.5s" }}>{m.v}</div>
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

      {/* ── DATA PLATFORM ── */}
      {activeTab === "data" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 14 }}>
          {/* Dataset catalog */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>DATA CATALOG ({DATASETS.length} datasets)</div>
            <input value={dsSearch} onChange={e => setDsSearch(e.target.value)} placeholder="Search datasets…" style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 7, padding: "6px 10px", color: "#f1f5f9", fontSize: 10, boxSizing: "border-box", outline: "none", marginBottom: 8 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {filteredDs.map(ds => (
                <div key={ds.id} onClick={() => { setSelectedDs(ds); setSelectedTab("schema"); }} style={{ background: selectedDs?.id === ds.id ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedDs?.id === ds.id ? "#3b82f6" : dsColor(ds.status) + "30"}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 8, fontFamily: "monospace", fontWeight: 700 }}>{ds.name}</div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: dsColor(ds.status) }} />
                      <span style={{ fontSize: 6, color: dsColor(ds.status) }}>{ds.status}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 7, color: "#475569" }}>{ds.domain} · {ds.rowCount} rows · {ds.sizeGB}GB</div>
                  <div style={{ fontSize: 7, color: "#334155", marginTop: 2 }}>Updated {ds.lastUpdated} · SLA {ds.freshnessSLA}</div>
                </div>
              ))}
            </div>

            {/* Pipeline health */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>PIPELINE HEALTH</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {PIPELINE_JOBS.map(job => (
                  <div key={job.name} style={{ background: "#1e293b", border: `1px solid ${pjColor(job.status)}20`, borderRadius: 6, padding: "5px 8px", display: "flex", gap: 7, alignItems: "center" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: pjColor(job.status), flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 7, fontFamily: "monospace" }}>{job.name}</div>
                      <div style={{ fontSize: 6, color: "#475569" }}>SLA {job.sla} · last: {job.lastRun} · {job.latency}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dataset detail + code */}
          <div>
            {selectedDs ? (
              <>
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace" }}>{selectedDs.name}</div>
                      <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{selectedDs.description}</div>
                    </div>
                    <span style={{ fontSize: 7, background: dsColor(selectedDs.status) + "20", color: dsColor(selectedDs.status), borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>{selectedDs.status.toUpperCase()}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {[{ l: "Domain", v: selectedDs.domain }, { l: "Owner", v: selectedDs.owner }, { l: "Rows", v: selectedDs.rowCount }, { l: "Size", v: selectedDs.sizeGB + " GB" }, { l: "SLA", v: selectedDs.freshnessSLA }, { l: "Updated", v: selectedDs.lastUpdated }].map(m => (
                      <div key={m.l}><div style={{ fontSize: 7, color: "#475569" }}>{m.l}</div><div style={{ fontSize: 9, fontWeight: 700 }}>{m.v}</div></div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                    {(["schema", "health"] as const).map(t => (
                      <button key={t} onClick={() => setSelectedTab(t)} style={{ background: selectedTab === t ? "#0f172a" : "transparent", border: `1px solid ${selectedTab === t ? "#334155" : "transparent"}`, borderRadius: 5, padding: "3px 10px", cursor: "pointer", color: selectedTab === t ? "#f1f5f9" : "#64748b", fontSize: 8 }}>{t}</button>
                    ))}
                  </div>
                </div>

                {selectedTab === "schema" && selectedDs.columns.length > 0 && (
                  <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "180px 90px 50px 1fr", gap: 0, borderBottom: "1px solid #334155", padding: "5px 12px", background: "#0f172a" }}>
                      {["Column", "Type", "Null", "Description"].map(h => <div key={h} style={{ fontSize: 7, fontWeight: 700, color: "#475569" }}>{h}</div>)}
                    </div>
                    {selectedDs.columns.map(col => (
                      <div key={col.name} style={{ display: "grid", gridTemplateColumns: "180px 90px 50px 1fr", gap: 0, borderBottom: "1px solid #1e293b", padding: "6px 12px", alignItems: "start" }}>
                        <div style={{ fontSize: 8, fontFamily: "monospace", fontWeight: 700 }}>{col.name}</div>
                        <div style={{ fontSize: 7, fontFamily: "monospace", color: colTypeColor(col.type), background: colTypeColor(col.type) + "15", borderRadius: 3, padding: "1px 5px", display: "inline-block" }}>{col.type}</div>
                        <div style={{ fontSize: 7, color: col.nullable ? "#64748b" : "#ef4444" }}>{col.nullable ? "YES" : "NO"}</div>
                        <div>
                          <div style={{ fontSize: 7, color: "#94a3b8" }}>{col.description}</div>
                          <div style={{ fontSize: 6, color: "#334155", fontFamily: "monospace", marginTop: 1 }}>e.g. {col.sampleValues.join(", ")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTab === "schema" && selectedDs.columns.length === 0 && (
                  <div style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 8, padding: 10, fontSize: 8, color: "#f87171" }}>
                    ⚠ This dataset is deprecated. Schema no longer maintained. Migration guide: see live_stream_events.
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#334155", fontSize: 12 }}>
                ← Select a dataset to view schema and details
              </div>
            )}

            <CodeBlock label="Data inventory tools — what 'data catalog' means and why it matters" color="#fe2c55" code={
`// TIKTOK LIVE DATA PLATFORM: SCALE AND CONTEXT
// TikTok Live: millions of concurrent streams, hundreds of millions of viewers daily.
// The data this generates: billions of events per day across dozens of datasets.
// 
// THE DATA CATALOG PROBLEM (before the tool):
// A data engineer wants to answer: "What's the freshest dataset for viewer engagement?"
// Without a catalog: they ask in Slack. Wait for answers. Get outdated info.
// 20+ engineers × daily questions = massive time waste and incorrect assumptions.
//
// THE DATA INVENTORY TOOL:
// A web interface where data engineers can:
// 1. DISCOVER: search by domain, keyword, owner, or schema column name.
//    "I need a dataset with 'gifts' data" → search "gifts" → results ranked by usage.
// 2. UNDERSTAND: every dataset has:
//    - Schema: column names, types, nullability, sample values.
//    - Ownership: which team maintains it, Slack channel for questions.
//    - SLA: when is this data guaranteed to be ready? (e.g., "3h after midnight UTC")
//    - Lineage: which upstream datasets does this depend on?
// 3. MONITOR: pipeline health in real time.
//    SLA breach: the catalog shows "STALE — last updated 4h ago, SLA is 1h."
//    Data engineers: know immediately without checking Airflow directly.
//    On-call engineers: get alerts linked directly to the catalog entry.
// 4. MANAGE: deprecate old datasets with migration notices.
//    live_stream_events_v1: marked DEPRECATED with a pointer to v2.
//    Engineers who navigate to v1 see the deprecation notice before using it.
//    Prevents: engineers building new pipelines on deprecated data.
//
// THE VISUALIZATION LAYER:
// Real-time metrics dashboard (built on WebSocket to the pipeline layer):
// - Active streams count: live, updates every few seconds.
// - Concurrent viewers: the number data teams use to understand load.
// - Events/second: proxy for pipeline health (drops signal issues).
// 
// Why WebSocket and not polling?
// These metrics update every second. Polling at 1-second interval:
// 86,400 HTTP requests/day per client just for metrics.
// WebSocket: one persistent connection. Server pushes updates.
// Browser: receives and renders updates with zero polling overhead.
// At TikTok scale: this distinction matters across hundreds of internal users.`} />
          </div>
        </div>
      )}

      {/* ── SEGMENT BUILDER ── */}
      {activeTab === "segment" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14 }}>
          {/* Builder UI */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>SEGMENT BUILDER — LIVE OPERATION PLATFORM</div>

            {/* Group logic */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "#64748b" }}>Match users who satisfy</div>
                <div style={{ display: "flex", gap: 3 }}>
                  {(["AND", "OR"] as const).map(l => (
                    <button key={l} onClick={() => setGroupLogic(l)} style={{ background: groupLogic === l ? "#0ea5e920" : "#0f172a", border: `1px solid ${groupLogic === l ? "#0ea5e9" : "#334155"}`, borderRadius: 5, padding: "3px 10px", cursor: "pointer", color: groupLogic === l ? "#38bdf8" : "#64748b", fontSize: 9, fontWeight: 700 }}>{l}</button>
                  ))}
                  <span style={{ fontSize: 9, color: "#64748b", alignSelf: "center" }}>of these groups:</span>
                </div>
              </div>

              {/* Groups */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {groups.map((group, gi) => (
                  <div key={group.id} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <span style={{ fontSize: 8, color: "#64748b" }}>Group {gi + 1} — match</span>
                        {(["AND", "OR"] as const).map(l => (
                          <button key={l} onClick={() => setGroups(prev => prev.map(g => g.id === group.id ? { ...g, logic: l } : g))} style={{ background: group.logic === l ? "#a855f720" : "transparent", border: `1px solid ${group.logic === l ? "#a855f7" : "#334155"}`, borderRadius: 4, padding: "1px 6px", cursor: "pointer", color: group.logic === l ? "#c084fc" : "#64748b", fontSize: 7, fontWeight: 700 }}>{l}</button>
                        ))}
                        <span style={{ fontSize: 8, color: "#64748b" }}>rules:</span>
                      </div>
                      {groups.length > 1 && (
                        <button onClick={() => setGroups(prev => prev.filter(g => g.id !== group.id))} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#475569", fontSize: 10 }}>✕</button>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {group.rules.map(rule => {
                        const attr = getAttr(rule.attribute);
                        const ops = getOperators(attr.type);
                        return (
                          <div key={rule.id} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            {/* Attribute */}
                            <select value={rule.attribute} onChange={e => updateRule(group.id, rule.id, { attribute: e.target.value, operator: getOperators(getAttr(e.target.value).type)[0], value: "" })} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 5, padding: "4px 7px", color: "#f1f5f9", fontSize: 8, outline: "none" }}>
                              {ATTRIBUTES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                            </select>
                            {/* Operator */}
                            <select value={rule.operator} onChange={e => updateRule(group.id, rule.id, { operator: e.target.value as Operator })} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 5, padding: "4px 7px", color: "#a78bfa", fontSize: 8, outline: "none" }}>
                              {ops.map(op => <option key={op} value={op}>{op}</option>)}
                            </select>
                            {/* Value */}
                            {attr.options ? (
                              <select value={rule.value} onChange={e => updateRule(group.id, rule.id, { value: e.target.value })} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 5, padding: "4px 7px", color: "#34d399", fontSize: 8, outline: "none", flex: 1 }}>
                                {attr.options.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : (
                              <input value={rule.value} onChange={e => updateRule(group.id, rule.id, { value: e.target.value })} style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 5, padding: "4px 7px", color: "#34d399", fontSize: 8, outline: "none" }} />
                            )}
                            <button onClick={() => removeRule(group.id, rule.id)} disabled={group.rules.length === 1} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#475569", fontSize: 11 }}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => addRule(group.id)} style={{ marginTop: 6, background: "transparent", border: "1px dashed #334155", borderRadius: 5, padding: "4px 12px", cursor: "pointer", color: "#64748b", fontSize: 8, width: "100%" }}>+ Add Rule</button>
                  </div>
                ))}
              </div>

              <button onClick={addGroup} style={{ marginTop: 8, background: "transparent", border: "1px dashed #334155", borderRadius: 7, padding: "6px 16px", cursor: "pointer", color: "#64748b", fontSize: 8, width: "100%" }}>+ Add Group</button>
            </div>

            {/* Audience size */}
            <div style={{ background: "#1e293b", border: `1px solid ${estimating ? "#334155" : "#0ea5e940"}`, borderRadius: 10, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 8, color: "#64748b" }}>Estimated audience size</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: estimating ? "#334155" : "#38bdf8", transition: "color 0.3s" }}>
                  {estimating ? "Calculating…" : estimatedSize >= 1e6 ? (estimatedSize / 1e6).toFixed(1) + "M" : estimatedSize >= 1e3 ? (estimatedSize / 1e3).toFixed(0) + "K" : estimatedSize.toLocaleString()}
                </div>
                <div style={{ fontSize: 7, color: "#475569" }}>out of 680M total TikTok Live users</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 7, color: "#64748b" }}>Coverage</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>
                  {estimating ? "—" : ((estimatedSize / 680_000_000) * 100).toFixed(2) + "%"}
                </div>
                <div style={{ fontSize: 7, color: "#475569" }}>of all users</div>
              </div>
            </div>

            {/* Saved segments */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 8, color: "#64748b", marginBottom: 5 }}>Saved Segments (used across 15+ pages)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {SAVED_SEGMENTS.map(s => (
                  <div key={s.name} style={{ background: "#1e293b", border: `1px solid ${s.color}20`, borderRadius: 7, padding: "7px 10px" }}>
                    <div style={{ fontSize: 8, fontWeight: 700 }}>{s.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: s.color }}>{s.size}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBlock label="Segment builder — component library design for 15+ pages" color="#fe2c55" code={
`// WHY A COMPONENT LIBRARY FOR SEGMENTATION MATTERS:
//
// TikTok Live Operations teams work with user segments constantly:
// - Campaign managers: "send notification to users who watched >1h yesterday"
// - Content safety: "review accounts with >100K followers and recent violations"
// - Monetisation: "identify users with gifts_sent_usd > 50 in the last 30 days"
// - Anti-spam: "flag accounts with follower_count > 10K and last_active_days > 30"
//
// Each team built their OWN segment builder. Four different implementations.
// Same business logic. Four maintenance surfaces. Four sources of inconsistency.
//
// THE SHARED COMPONENT LIBRARY:
// One SegmentBuilder component. Used on 15+ pages across all operations teams.
//
// COMPONENT API DESIGN:
interface SegmentBuilderProps {
  // Data model: what the builder manages
  value: SegmentDefinition;
  onChange: (def: SegmentDefinition) => void;
  
  // Feature flags: different pages need different capabilities
  allowMultipleGroups?: boolean;  // some pages: only one group allowed
  readOnly?: boolean;             // audit pages: view-only
  
  // Data: which attributes are available
  attributes: Attribute[];
  
  // Estimate: consumer provides their own estimate function
  // (different pages have different data sources for estimation)
  onEstimateRequest: (def: SegmentDefinition) => Promise<EstimateResult>;
}
//
// WHY onEstimateRequest AS A PROP:
// Each page estimates from a different backend service.
// The segment builder: doesn't know which service to call.
// The consuming page: provides the function.
// The component: calls it on every definition change (debounced 300ms).
// This is "inversion of control": the component owns the UI, not the data fetching.
//
// THE SEGMENT DEFINITION (shared data model):
interface SegmentDefinition {
  groupLogic: "AND" | "OR";
  groups: SegmentGroup[];
}
interface SegmentGroup {
  id: string;
  logic: "AND" | "OR";
  rules: SegmentRule[];
}
interface SegmentRule {
  id: string;
  attribute: string;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "contains" | "in" | "not_in";
  value: string | string[];
}
// This is a SERIALIZABLE definition.
// Stored in the database as JSON. Sent to the backend for query generation.
// The backend: translates this definition to a SQL WHERE clause or Spark filter.
//
// THE BACKEND TRANSLATION (critical for interviews):
// The SegmentDefinition maps to a SQL expression:
// Group 1 (AND): watch_time_mins > 30 AND last_active_days < 7
// Group 2 (AND): country_code IN ('ID', 'PH')
// Group logic (AND): (group1_expr) AND (group2_expr)
//
// ESTIMATING AUDIENCE SIZE:
// Run a COUNT query on user_engagement_daily with the generated WHERE clause.
// On a 680M-row table: COUNT with filter still takes seconds (columnar storage helps).
// We add: a 1% random sample for fast estimates (COUNT on 6.8M rows instead of 680M).
// 1% sample × 100 = estimate. Accurate to ±3% for large segments.
// For segments <10K: full scan. For >10K: sampled.
// This makes estimates feel instant (<600ms) even on massive datasets.`} />
          </div>
        </div>
      )}

      {/* ── DEV EFFICIENCY ── */}
      {activeTab === "devex" && (
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 14 }}>
          {/* CI/CD simulator */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>CI/CD PIPELINE — BEFORE vs AFTER</div>

            <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
              {(["before", "after"] as const).map(m => (
                <button key={m} onClick={() => { setCiMode(m); runCI(m); }} disabled={ciRunning} style={{ flex: 1, background: ciMode === m ? (m === "before" ? "#ef444420" : "#22c55e20") : "#1e293b", border: `1px solid ${ciMode === m ? (m === "before" ? "#ef4444" : "#22c55e") : "#334155"}`, borderRadius: 6, padding: "6px", cursor: ciRunning ? "not-allowed" : "pointer", color: ciMode === m ? (m === "before" ? "#f87171" : "#4ade80") : "#64748b", fontSize: 9, fontWeight: 700 }}>
                  {m === "before" ? "🔴 Before (12m 18s)" : "🟢 After (3m 24s)"}
                </button>
              ))}
            </div>

            {/* Stages */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
              {CI_STAGES.map((stage, i) => {
                const dur = ciMode === "before" ? stage.durationBefore : stage.durationAfter;
                const progress = ciProgress[i] || 0;
                const done = progress >= 1;
                const active = progress > 0 && !done;
                return (
                  <div key={stage.name} style={{ background: "#1e293b", border: `1px solid ${done ? "#22c55e30" : active ? "#0ea5e930" : "#334155"}`, borderRadius: 7, padding: "7px 10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <span style={{ fontSize: 10 }}>{stage.icon}</span>
                        <span style={{ fontSize: 8, fontWeight: 600 }}>{stage.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 7, color: "#475569" }}>{dur}s</span>
                        {done && <span style={{ fontSize: 8, color: "#22c55e" }}>✓</span>}
                        {active && <span style={{ fontSize: 8, color: "#0ea5e9" }}>⟳</span>}
                      </div>
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: 3, height: 4 }}>
                      <div style={{ height: "100%", background: done ? "#22c55e" : active ? "#0ea5e9" : "#334155", width: `${progress * 100}%`, borderRadius: 3, transition: "width 0.1s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total time */}
            {ciProgress.length > 0 && (
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 10, display: "flex", justifyContent: "space-between" }}>
                <div><div style={{ fontSize: 7, color: "#64748b" }}>Elapsed</div><div style={{ fontSize: 14, fontWeight: 800, color: ciMode === "before" ? "#ef4444" : "#22c55e" }}>{Math.round(ciTotal)}s</div></div>
                {!ciRunning && <div style={{ textAlign: "right" }}><div style={{ fontSize: 7, color: "#64748b" }}>vs before</div><div style={{ fontSize: 14, fontWeight: 800, color: "#22c55e" }}>{ciMode === "after" ? "−72%" : "baseline"}</div></div>}
              </div>
            )}

            {/* Metrics table */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>IMPROVEMENT METRICS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {DX_IMPROVEMENTS.map(m => (
                  <div key={m.label} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 8, fontWeight: 600 }}>{m.label}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 7, color: "#ef4444", textDecoration: "line-through" }}>{m.before}</span>
                      <span style={{ fontSize: 8, color: "#f1f5f9", fontWeight: 700 }}>{m.after}</span>
                      <span style={{ fontSize: 7, background: m.c + "20", color: m.c, borderRadius: 3, padding: "0 5px" }}>{m.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="CI/CD improvements — pnpm cache, parallel jobs, Turbo repo" color="#0ea5e9" code={
`// CI/CD RUNTIME: 12m 18s → 3m 24s (−72%)
//
// THE MAIN CULPRITS IN THE ORIGINAL PIPELINE:
//
// 1. npm install (142s → 8s):
// BEFORE: npm install from scratch on every CI run. No cache.
//   node_modules: 380MB. Downloading and extracting: 142 seconds.
// AFTER: switched to pnpm + pnpm store cache.
//   pnpm: stores packages in a content-addressable store (~/.pnpm-store).
//   CI cache key: hash of pnpm-lock.yaml.
//   Cache hit (lockfile unchanged): restore store → pnpm links packages → 8 seconds.
//   The 8 seconds: just creating symlinks, not downloading anything.
//
// 2. TypeScript + ESLint running sequentially (38s + 45s = 83s → 12s + 9s in parallel):
// BEFORE: tsc --noEmit → wait for it to finish → eslint → wait.
// AFTER: run TypeScript and ESLint in parallel (GitHub Actions parallel steps).
//   They share the same files but don't depend on each other's output.
//   Both: complete in their respective times but overlap in wall time.
//   Wall time for both: max(12s, 9s) = 12s instead of 83s.
//
// 3. Unit tests (210s → 55s):
// BEFORE: Jest run all tests sequentially in one process.
// AFTER: Jest --shard flags for parallel test execution.
//   GitHub Actions: 4 parallel jobs, each running 1/4 of the test suite.
//   Wall time: roughly 210s / 4 = ~55s.
//   Requires: tests to be independent (no shared state between test files).
//   We spent 2 sprints cleaning up test isolation issues before this worked.
//   Worth it: 4× speedup on tests alone.
//
// 4. Turbo (for monorepo):
// Turborepo: task orchestrator for monorepos.
// It tracks which packages have changed since the last build.
// If package A didn't change: don't rebuild it. Use the cached output.
// For a monorepo with 8 packages: average CI only rebuilds 2-3 per PR.
// turbo build: knows that changing the component library triggers rebuilds
//   of all pages that import from it (dependency graph).
//   But changing page-A doesn't rebuild page-B.
//
// BUNDLE SIZE: 4.8MB → 1.9MB (−60%):
// Main offenders (found via bundle-analyzer):
//   moment.js: 280KB. Replaced with date-fns (tree-shakeable): 12KB imported.
//   lodash: entire library imported. Replaced with lodash-es + named imports:
//     import { debounce } from "lodash-es" → only imports debounce.
//   Antd: entire component library imported. Added babel-plugin-import:
//     import { Button } from "antd" → transformed to import from antd/es/button.
//   Chart library: multiple chart types imported. Used dynamic import per chart type.
//   Code splitting: route-level dynamic imports. Pages load only what they need.`} />

              <CodeBlock label="Code quality improvements — TypeScript strict, ESLint rules, pre-commit" color="#22c55e" code={
`// CODEBASE QUALITY: ELIMINATING TS ERRORS AT MERGE TIME (40/week → 0)
//
// HOW TYPESCRIPT ERRORS WERE REACHING main BEFORE:
// tsconfig.json had "strict": false.
// Many implicit "any" types throughout the codebase.
// No pre-commit hooks. Engineers committed without type checking.
// CI ran TypeScript, but the errors were non-blocking (just warnings).
// Result: 40+ TypeScript errors per week introduced to main.
//
// WHAT I DID:
//
// STEP 1: Count the existing errors.
// npx tsc --noEmit | grep "error TS" | wc -l → 834 errors.
// This is too many to fix in one sprint. Need an incremental approach.
//
// STEP 2: Incremental strictness via tsconfig paths.
// Not: enable strict globally (834 errors, blocks everything).
// Not: ignore all existing errors (no improvement).
// Yes: use "incremental strictness":
// Created tsconfig.strict.json extending the base config with strict: true.
// New files: must pass strict tsconfig. Old files: still use base.
// Build script: validates new files against strict config.
// Each sprint: migrated 2-3 existing files to strict. Tracked in a spreadsheet.
// 6 months: all files migrated. strict: true moved to tsconfig.json.
// Zero TypeScript errors at merge for 4 months after full migration.
//
// STEP 3: Pre-commit hooks (Husky + lint-staged).
// husky install → creates .husky/pre-commit hook.
// lint-staged: runs linting ONLY on staged files (not the whole codebase).
// Time to run pre-commit: 3-8 seconds (not 45 seconds for all files).
// Engineers: get instant feedback before committing.
// "Cannot commit with TypeScript errors" → they fix locally, not after CI fails.
//
// STEP 4: ESLint custom rules for team-specific patterns.
// Added rules:
//   no-restricted-imports: ban moment.js (replaced with date-fns).
//   react-hooks/rules-of-hooks: catches hooks in conditional branches.
//   react-hooks/exhaustive-deps: catches missing useEffect dependencies.
//   @typescript-eslint/no-explicit-any: errors on "any" type.
// These rules: encoded the team's decisions as machine-enforced constraints.
// Not: "please don't use moment.js" in a doc nobody reads.
// Yes: import of moment → ESLint error → commit rejected.
//
// TEST COVERAGE: 34% → 78% (+129%):
// Not by mandate. By making testing easier and faster.
// Added: component testing utilities that wrap React Testing Library.
// The wrapper: provides a preconfigured test environment (router, store, i18n).
// Before: each test file: 20 lines of setup before the actual test.
// After: 2 lines of setup. Engineers write more tests because the barrier is lower.
// Added: Visual snapshot testing for all Storybook stories (Chromatic on CI).
// "New test coverage" contribution: mostly integration tests for the segment builder.
// The segment builder: serialises to JSON + translates to SQL.
// Tests: 40+ combinations of segment definitions → expected SQL output.`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TikTokLiveDemo;
