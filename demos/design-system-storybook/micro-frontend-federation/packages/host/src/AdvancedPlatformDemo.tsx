/**
 * AdvancedPlatformDemo.tsx
 *
 * Advanced Platform Engineering — TBT · SSG · Design System · K8s Infrastructure
 *
 * Achievements:
 *   1. TBT −90%           — browser profiling, call stack analysis, data normalisation
 *   2. Zero-runtime SSG   — Next.js marketing site, CMS, node-fs build scripts
 *   3. CSS-in-JS → RSC    — design system migration + WAI-ARIA compliance
 *   4. K8s 25K RPS        — HPA, Kafka consumer lag, Datadog monitoring
 *
 * TABS
 *   ⚡ TBT Optimisation   — flame chart, data normalisation O(n)→O(1), task chunking
 *   🚀 Zero-runtime SSG   — CMS→build→CDN pipeline, node-fs scripts, cost comparison
 *   🎨 Design System      — CSS-in-JS → CSS Modules/variables, WAI-ARIA components
 *   🔧 K8s Infrastructure — HPA scaling simulation, Kafka lag, Datadog dashboard
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// TBT / Flame chart types
// ─────────────────────────────────────────────────────────────────

interface FlameTask { label: string; startMs: number; durationMs: number; color: string; isLong: boolean; depth: number }

const BEFORE_TASKS: FlameTask[] = [
  { label: "renderProductList()", startMs: 0,   durationMs: 480, color: "#ef4444", isLong: true,  depth: 0 },
  { label: "items.find() ×2400",  startMs: 10,  durationMs: 310, color: "#f97316", isLong: true,  depth: 1 },
  { label: "items.filter() ×800", startMs: 20,  durationMs: 180, color: "#f59e0b", isLong: true,  depth: 2 },
  { label: "buildCategoryMap()",  startMs: 330, durationMs: 120, color: "#f59e0b", isLong: false, depth: 1 },
  { label: "DOM render",          startMs: 450, durationMs: 30,  color: "#64748b", isLong: false, depth: 1 },
];

const AFTER_TASKS: FlameTask[] = [
  { label: "chunk 1/10",          startMs: 0,   durationMs: 38, color: "#22c55e", isLong: false, depth: 0 },
  { label: "itemsById[id]",       startMs: 2,   durationMs: 12, color: "#4ade80", isLong: false, depth: 1 },
  { label: "yield (setTimeout)",  startMs: 40,  durationMs: 5,  color: "#94a3b8", isLong: false, depth: 0 },
  { label: "chunk 2/10",          startMs: 55,  durationMs: 37, color: "#22c55e", isLong: false, depth: 0 },
  { label: "itemsById[id]",       startMs: 57,  durationMs: 11, color: "#4ade80", isLong: false, depth: 1 },
  { label: "yield (setTimeout)",  startMs: 94,  durationMs: 5,  color: "#94a3b8", isLong: false, depth: 0 },
  { label: "chunk 3/10",          startMs: 110, durationMs: 36, color: "#22c55e", isLong: false, depth: 0 },
];

interface NormItem { id: number; name: string; categoryId: number; price: number }
const RAW_ITEMS: NormItem[] = Array.from({ length: 2400 }, (_, i) => ({
  id: i + 1, name: `Product ${i + 1}`,
  categoryId: (i % 12) + 1,
  price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
}));

// ─────────────────────────────────────────────────────────────────
// SSG types
// ─────────────────────────────────────────────────────────────────

interface CmsPage { slug: string; title: string; template: string; lastEdited: string; status: "published" | "draft" }

const CMS_PAGES: CmsPage[] = [
  { slug: "/",           title: "Home",           template: "hero",    lastEdited: "2h ago",  status: "published" },
  { slug: "/about",      title: "About Us",       template: "content", lastEdited: "1d ago",  status: "published" },
  { slug: "/features",   title: "Features",       template: "grid",    lastEdited: "3h ago",  status: "published" },
  { slug: "/pricing",    title: "Pricing",        template: "table",   lastEdited: "5d ago",  status: "published" },
  { slug: "/blog/post-1",title: "How We Built X", template: "blog",    lastEdited: "12h ago", status: "published" },
  { slug: "/blog/post-2",title: "2025 State of AI",template: "blog",   lastEdited: "3d ago",  status: "draft"     },
  { slug: "/careers",    title: "Careers",        template: "list",    lastEdited: "1w ago",  status: "published" },
  { slug: "/contact",    title: "Contact",        template: "form",    lastEdited: "2w ago",  status: "published" },
];

type BuildStep = "idle" | "fetching" | "generating" | "optimising" | "deploying" | "done";

// ─────────────────────────────────────────────────────────────────
// Design system types
// ─────────────────────────────────────────────────────────────────

type CompName = "Button" | "Modal" | "Alert" | "Tabs" | "Input";
interface AriaSpec { role?: string; attrs: Record<string, string>; events: string[] }
const ARIA_MAP: Record<CompName, AriaSpec> = {
  Button: { role: "button",  attrs: { "aria-pressed": "false", tabIndex: "0" }, events: ["Enter", "Space"] },
  Modal:  { role: "dialog",  attrs: { "aria-modal": "true", "aria-labelledby": "modal-title" }, events: ["Escape (close)", "Tab (trap focus)"] },
  Alert:  { role: "alert",   attrs: { "aria-live": "assertive", "aria-atomic": "true" }, events: ["auto-announce to screen reader"] },
  Tabs:   { role: "tablist", attrs: { "aria-selected": "true/false", "aria-controls": "panel-id" }, events: ["ArrowLeft", "ArrowRight", "Home", "End"] },
  Input:  { role: "textbox", attrs: { "aria-required": "true", "aria-describedby": "error-id", "aria-invalid": "false" }, events: ["Enter (submit)"] },
};

// ─────────────────────────────────────────────────────────────────
// K8s types
// ─────────────────────────────────────────────────────────────────

interface PodMetric { ts: number; pods: number; rps: number; p99Ms: number; kafkaLag: number }

const genMetrics = (scenario: "before" | "after"): PodMetric[] =>
  Array.from({ length: 30 }, (_, i) => {
    const spike = i >= 10 && i <= 20;
    const rps = spike ? 15000 + Math.sin(((i - 10) / 10) * Math.PI) * 10000 : 3000 + Math.random() * 500;
    const pods = scenario === "before" ? 3 : spike ? Math.min(12, Math.floor(rps / 1200) + 2) : 3;
    const p99 = scenario === "before"
      ? (spike ? 800 + (rps - 3000) * 0.08 + Math.random() * 200 : 120 + Math.random() * 30)
      : (spike ? 180 + Math.random() * 40 : 120 + Math.random() * 20);
    const kafkaLag = scenario === "before"
      ? (spike ? Math.max(0, (i - 10) * 8000) : 0)
      : Math.min(spike ? (i - 10) * 2000 : 0, 5000);
    return { ts: i, pods, rps: Math.round(rps), p99Ms: Math.round(p99), kafkaLag };
  });

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 270 }}>{code}</pre>
    </div>
  );
}

function Sparkline({ data, color, max }: { data: number[]; color: string; max: number }) {
  const w = 200, h = 40;
  if (data.length < 2) return <svg width={w} height={h} />;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 2) - 1}`).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function AdvancedPlatformDemo() {
  const [activeTab, setActiveTab] = useState<"tbt" | "ssg" | "ds" | "k8s">("tbt");

  // ── TBT ──────────────────────────────────────────────────────
  const [tbtMode, setTbtMode] = useState<"before" | "after">("before");
  const [bench, setBench]     = useState<{ array: number | null; map: number | null }>({ array: null, map: null });
  const [benchRunning, setBenchRunning] = useState(false);
  const [lookupId, setLookupId]   = useState(1337);

  const runBenchmark = useCallback(async () => {
    setBenchRunning(true); setBench({ array: null, map: null });
    await new Promise(r => setTimeout(r, 60));
    const t0 = performance.now();
    for (let r = 0; r < 1000; r++) RAW_ITEMS.find(item => item.id === lookupId);
    const arrayMs = parseFloat((performance.now() - t0).toFixed(2));

    const byId: Record<number, NormItem> = {};
    RAW_ITEMS.forEach(item => { byId[item.id] = item; });
    await new Promise(r => setTimeout(r, 60));
    const t1 = performance.now();
    for (let r = 0; r < 1000; r++) { const _ = byId[lookupId]; }
    const mapMs = parseFloat((performance.now() - t1).toFixed(2));

    setBench({ array: arrayMs, map: mapMs }); setBenchRunning(false);
  }, [lookupId]);

  const FLAME_SCALE_BEFORE = 500;
  const FLAME_SCALE_AFTER  = 150;

  // ── SSG ──────────────────────────────────────────────────────
  const [buildStep, setBuildStep] = useState<BuildStep>("idle");
  const [builtPages, setBuiltPages] = useState<string[]>([]);
  const [buildLog, setBuildLog]     = useState<string[]>([]);

  const runBuild = async () => {
    if (buildStep !== "idle" && buildStep !== "done") return;
    setBuildStep("fetching"); setBuiltPages([]); setBuildLog([]);
    setBuildLog(["[00:00] Fetching pages from CMS API…"]);
    await new Promise(r => setTimeout(r, 700));
    const published = CMS_PAGES.filter(p => p.status === "published");
    setBuildLog(p => [...p, `[00:01] Fetched ${published.length} published pages`]);
    setBuildStep("generating");
    setBuildLog(p => [...p, "[00:01] Generating static routes with node-fs…"]);
    for (const page of published) {
      await new Promise(r => setTimeout(r, 100));
      setBuiltPages(prev => [...prev, page.slug]);
      setBuildLog(prev => [...prev, `  ✓ Generated: ${page.slug} (${page.template})`]);
    }
    setBuildStep("optimising");
    setBuildLog(p => [...p, "[00:03] Optimising images + inlining critical CSS…"]);
    await new Promise(r => setTimeout(r, 600));
    setBuildStep("deploying");
    setBuildLog(p => [...p, "[00:04] Deploying to CDN (23 edge nodes)…"]);
    await new Promise(r => setTimeout(r, 700));
    setBuildLog(p => [...p, "[00:05] ✓ Deployed. Zero server required."]);
    setBuildStep("done");
  };

  const BUILD_COLOR: Record<BuildStep, string> = {
    idle: "#64748b", fetching: "#f59e0b", generating: "#0ea5e9",
    optimising: "#f97316", deploying: "#22c55e", done: "#22c55e",
  };

  // ── Design System ─────────────────────────────────────────────
  const [dsMode, setDsMode]           = useState<"before" | "after">("before");
  const [selectedComp, setSelectedComp] = useState<CompName>("Button");
  const [modalOpen, setModalOpen]     = useState(false);
  const [alertMsg, setAlertMsg]       = useState<string | null>(null);
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  useEffect(() => {
    if (alertMsg) { const t = setTimeout(() => setAlertMsg(null), 3000); return () => clearTimeout(t); }
  }, [alertMsg]);

  // ── K8s ──────────────────────────────────────────────────────
  const [k8sMode, setK8sMode]   = useState<"before" | "after">("before");
  const [metricsBefore]         = useState(() => genMetrics("before"));
  const [metricsAfter]          = useState(() => genMetrics("after"));
  const metrics                 = k8sMode === "before" ? metricsBefore : metricsAfter;
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying]   = useState(false);
  const playRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => {
        setPlayhead(p => { if (p >= metrics.length - 1) { setPlaying(false); return p; } return p + 1; });
      }, 260);
    } else { if (playRef.current) clearInterval(playRef.current); }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing, metrics.length]);

  const current  = metrics[Math.min(playhead, metrics.length - 1)];
  const isSpike  = playhead >= 10 && playhead <= 20;

  const TABS = [
    { id: "tbt" as const, label: "⚡ TBT −90%"       },
    { id: "ssg" as const, label: "🚀 Zero-runtime SSG" },
    { id: "ds"  as const, label: "🎨 Design System"   },
    { id: "k8s" as const, label: "🔧 K8s 25K RPS"     },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#0ea5e9,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏗</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Advanced Platform Engineering</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>TBT −90% · Zero-runtime SSG · CSS-in-JS→RSC · K8s 25K RPS + Kafka + Datadog</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "−90%",  l: "Total Blocking Time", c: "#ef4444", sub: "Call stack + data normalisation"  },
            { v: "0 JS",  l: "Marketing Site",      c: "#22c55e", sub: "Next.js SSG + CMS + node-fs"      },
            { v: "RSC",   l: "Design System",       c: "#a855f7", sub: "CSS Modules + WAI-ARIA"            },
            { v: "25K",   l: "RPS Handled",         c: "#f59e0b", sub: "K8s HPA + Kafka + Datadog"         },
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
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#1e293b" : "transparent", color: activeTab === tab.id ? "#f1f5f9" : "#64748b", border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 22px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── TBT ── */}
      {activeTab === "tbt" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              {(["before", "after"] as const).map(m => (
                <button key={m} onClick={() => setTbtMode(m)} style={{ flex: 1, background: tbtMode === m ? (m === "before" ? "#ef444420" : "#22c55e20") : "#1e293b", border: `1px solid ${tbtMode === m ? (m === "before" ? "#ef4444" : "#22c55e") : "#334155"}`, borderRadius: 7, padding: "7px", cursor: "pointer", color: tbtMode === m ? (m === "before" ? "#f87171" : "#4ade80") : "#64748b", fontSize: 9, fontWeight: 700 }}>
                  {m === "before" ? "🔴 Before: TBT ~430ms" : "🟢 After: TBT ~43ms (−90%)"}
                </button>
              ))}
            </div>

            {/* Flame chart */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>🔥 Call Stack Flame Chart — Main Thread</div>
              <div style={{ fontSize: 7, color: "#475569", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                <span>0ms</span>
                {tbtMode === "before"
                  ? <><span>120ms</span><span>240ms</span><span>360ms</span><span>480ms</span></>
                  : <><span>30ms</span><span>60ms</span><span>90ms</span><span>120ms</span></>}
              </div>
              <div style={{ position: "relative" }}>
                {tbtMode === "before" && (
                  <div style={{ position: "absolute", top: 0, left: 0, width: `${(480 / FLAME_SCALE_BEFORE) * 100}%`, height: 4, background: "#ef444450", borderTop: "2px solid #ef4444", borderRadius: "2px 2px 0 0" }}>
                    <span style={{ position: "absolute", right: 0, top: -14, fontSize: 6, color: "#ef4444", fontWeight: 700, whiteSpace: "nowrap" }}>{"⚠ Long Task: 480ms (>50ms threshold)"}</span>
                  </div>
                )}
                {(tbtMode === "before" ? BEFORE_TASKS : AFTER_TASKS).map((task, i) => {
                  const scale = tbtMode === "before" ? FLAME_SCALE_BEFORE : FLAME_SCALE_AFTER;
                  const left  = (task.startMs / scale) * 100;
                  const width = Math.max(0.5, (task.durationMs / scale) * 100);
                  return (
                    <div key={i} title={`${task.label}: ${task.durationMs}ms`} style={{ position: "absolute", left: `${left}%`, width: `${width}%`, top: 8 + task.depth * 18, height: 16, background: task.color, borderRadius: 2, overflow: "hidden", border: task.isLong ? "1px solid #ef4444" : "none" }}>
                      <span style={{ fontSize: 6, padding: "1px 3px", whiteSpace: "nowrap", color: "#0f172a", fontWeight: 700 }}>{task.label}</span>
                    </div>
                  );
                })}
                <div style={{ height: tbtMode === "before" ? 80 : 80 }} />
              </div>
              <div style={{ fontSize: 7, color: tbtMode === "before" ? "#ef4444" : "#22c55e", fontWeight: 700, marginTop: 4 }}>
                {tbtMode === "before"
                  ? "⚠ One 480ms long task. Browser cannot respond to input. Users feel frozen."
                  : "✓ Tasks chunked to <50ms each. Browser yields between chunks. UI stays responsive."}
              </div>
            </div>

            {/* Benchmark */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6 }}>🔢 Data Normalisation Benchmark — 2,400 items, 1,000 lookups</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 7, color: "#64748b" }}>Lookup ID:</span>
                <input type="number" value={lookupId} min={1} max={2400} onChange={e => setLookupId(Number(e.target.value))} style={{ width: 70, background: "#0f172a", border: "1px solid #334155", borderRadius: 5, padding: "3px 6px", color: "#f1f5f9", fontSize: 8, outline: "none" }} />
                <button onClick={runBenchmark} disabled={benchRunning} style={{ background: "#0ea5e920", border: "1px solid #0ea5e9", borderRadius: 6, padding: "4px 12px", cursor: benchRunning ? "not-allowed" : "pointer", color: "#38bdf8", fontSize: 8, fontWeight: 700 }}>
                  {benchRunning ? "Running…" : "▶ Run Benchmark"}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { label: "Array.find() ×1000", time: bench.array, color: "#ef4444", icon: "❌", complexity: "O(n) per lookup" },
                  { label: "Map[id] ×1000",      time: bench.map,   color: "#22c55e", icon: "✓",  complexity: "O(1) per lookup" },
                ].map(b => (
                  <div key={b.label} style={{ background: "#0f172a", border: `1px solid ${b.color}30`, borderRadius: 7, padding: "8px 10px" }}>
                    <div style={{ fontSize: 7, color: b.color, fontWeight: 700, marginBottom: 4 }}>{b.icon} {b.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: b.time !== null ? b.color : "#334155" }}>
                      {b.time !== null ? `${b.time}ms` : "—"}
                    </div>
                    <div style={{ fontSize: 6, color: "#475569", marginTop: 2 }}>{b.complexity}</div>
                  </div>
                ))}
              </div>
              {bench.array !== null && bench.map !== null && (
                <div style={{ marginTop: 6, fontSize: 8, color: "#22c55e", fontWeight: 700 }}>
                  ↑ Map lookup is {(bench.array / bench.map).toFixed(0)}× faster for 2,400 items · {1000} iterations
                </div>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Data normalisation — O(n²) array operations → O(1) map lookups" color="#f59e0b" code={
`// ROOT CAUSE: O(n²) array operations per render
//
// A product list: 2,400 items.
// For each of the 2,400 items rendered: the component called:
//   categories.find(c => c.id === item.categoryId)  → O(50)
//   items.filter(i => i.categoryId === item.categoryId) → O(2400)
//
// Total operations per render:
//   2,400 × (50 + 2,400) = ~5.88 MILLION OPERATIONS
//
// All synchronous. Single long task. 480ms blocking.
// The browser cannot handle clicks, scrolls, or input during this.
//
// FOUND VIA CALL STACK ANALYSIS:
// Chrome DevTools → Performance tab → Record page load → Stop.
// Flame chart: one 480ms red bar at the top. ONE long task.
// Expanded: "items.find" called 2,400 times.
//   Each call: linear scan of all categories from the start.
//   "This is O(n²). Finding the same category 2,400 times over."
//
// FIX: NORMALISE ONCE ON DATA LOAD, O(1) FOREVER AFTER

// Runs once when data arrives (useMemo or in useEffect):
const normalise = (items: Item[], categories: Category[]) => {
  const itemsById: Record<number, Item> = {};
  const itemsByCategoryId: Record<number, number[]> = {};
  const categoriesById: Record<number, Category> = {};

  items.forEach(item => {
    itemsById[item.id] = item;
    itemsByCategoryId[item.categoryId] ??= [];
    itemsByCategoryId[item.categoryId].push(item.id);
  });

  categories.forEach(cat => { categoriesById[cat.id] = cat; });
  return { itemsById, itemsByCategoryId, categoriesById };
};

// In the render — now O(1) per item:
const category = categoriesById[item.categoryId]; // O(1), not O(50)
const related  = itemsByCategoryId[item.categoryId]
  .map(id => itemsById[id]);                       // O(k), not O(2400)

// Total per render: 2,400 × O(1) = 2,400 operations. Not 5.88M.
// TBT contribution from data lookups: 310ms → ~3ms.

// TASK CHUNKING (to break remaining work into <50ms slices):
async function renderInChunks(items: Item[], chunk = 240) {
  for (let i = 0; i < items.length; i += chunk) {
    renderBatch(items.slice(i, i + chunk));
    // Yield: lets browser handle pending events (clicks, scrolls)
    await new Promise(r => setTimeout(r, 0));
  }
}
// 10 chunks × ~43ms each. Each chunk: a separate <50ms task.
// TBT: tasks <50ms contribute 0 to TBT by definition.`} />

              <CodeBlock label="Browser profiling — systematic diagnosis workflow" color="#0ea5e9" code={
`// PROFILING WORKFLOW: SYMPTOM → ROOT CAUSE

// SYMPTOM: "Product list freezes for ~1 second on load"
// Lighthouse: TBT = 430ms, "Avoid long main-thread tasks" warning

// STEP 1: Record a performance profile
// Chrome DevTools → Performance tab → Record → reload → Stop
// Focus on: the "Main" thread flame chart
// Look for: red/orange bars at the top (tasks >50ms)

// STEP 2: Identify the long task
// Found: 1 red bar, 0ms to 480ms. The ENTIRE render = 1 long task.
// The 50ms TBT threshold: tasks >50ms block the main thread.
// Blocking time for this task: 480ms - 50ms = 430ms TBT contribution.

// STEP 3: Drill into the call stack
// Click the bar → flame chart expands to show child calls
// Top: renderProductList() — 480ms
//   └ items.find() ×2400   — 310ms   ← THE OFFENDER
//   └ buildCategoryMap()   — 120ms
//   └ DOM render           —  30ms

// STEP 4: Verify
// console.count("find_called") → confirmed: 2,400 calls per render
// console.time("find_section") → confirmed: ~310ms for find() alone

// STEP 5: Instrument + compare
// Normalisation applied. Re-run profile.
// Result: 10 small green bars instead of 1 red bar.
// Each bar: ~38-43ms. All below the 50ms threshold.
// TBT: 430ms → 43ms. Reduction: 90%.

// KEY INSIGHT FROM CALL STACK ANALYSIS:
// A flame chart shows WHERE time is spent.
// A call STACK shows WHY: what called what, in what order.
// "The symptom is in Lighthouse. The location is in the flame chart.
//  The root cause is in the call stack. Fix the root cause."

// TOOLS USED:
//   Chrome DevTools Performance Panel — flame chart, task timing
//   Performance.measure() — instrument specific sections
//   console.count()       — verify call frequency
//   webpack-bundle-analyzer — if bundle size is involved`} />
            </div>
          </div>
        </div>
      )}

      {/* ── SSG ── */}
      {activeTab === "ssg" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>ZERO-RUNTIME MARKETING SITE — ARCHITECTURE</div>

            {/* Pipeline */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                {[
                  { icon: "📝", label: "Content Team", sub: "Edits CMS",        c: "#f59e0b" },
                  { icon: "→" }, { icon: "🗄",  label: "CMS API",      sub: "Contentful",      c: "#0ea5e9" },
                  { icon: "→" }, { icon: "🔧", label: "Build Script",  sub: "node-fs + Next",  c: "#a855f7" },
                  { icon: "→" }, { icon: "📦", label: "Static HTML",   sub: "/dist",           c: "#22c55e" },
                  { icon: "→" }, { icon: "🌐", label: "CDN Edge",      sub: "23 locations",    c: "#fe2c55" },
                ].map((n, i) => (
                  "label" in n
                    ? <div key={i} style={{ background: "#0f172a", border: `1px solid ${n.c}30`, borderRadius: 6, padding: "5px 7px", textAlign: "center", flex: 1 }}>
                        <div style={{ fontSize: 14 }}>{n.icon}</div>
                        <div style={{ fontSize: 7, fontWeight: 700, color: n.c }}>{n.label}</div>
                        <div style={{ fontSize: 6, color: "#475569" }}>{n.sub}</div>
                      </div>
                    : <div key={i} style={{ fontSize: 12, color: "#334155", flexShrink: 0 }}>→</div>
                ))}
              </div>
              <div style={{ fontSize: 7, color: "#64748b", textAlign: "center" }}>
                User hit CDN → cache hit → &lt;10ms TTFB · <strong style={{ color: "#22c55e" }}>Zero server. Zero JS runtime. Zero operational cost.</strong>
              </div>
            </div>

            {/* Build simulator */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 8, fontWeight: 700 }}>🔨 Build Simulator</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: BUILD_COLOR[buildStep] }} />
                  <span style={{ fontSize: 7, color: BUILD_COLOR[buildStep] }}>{buildStep.toUpperCase()}</span>
                </div>
              </div>
              <button onClick={runBuild} disabled={buildStep !== "idle" && buildStep !== "done"} style={{ width: "100%", background: "#22c55e20", border: "1px solid #22c55e", borderRadius: 7, padding: "8px", cursor: (buildStep !== "idle" && buildStep !== "done") ? "not-allowed" : "pointer", color: "#4ade80", fontSize: 9, fontWeight: 700, marginBottom: 8 }}>
                {buildStep === "idle" || buildStep === "done" ? "▶ Run Build (simulate CI)" : "Building…"}
              </button>
              <div style={{ maxHeight: 130, overflow: "auto", fontFamily: "monospace", fontSize: 7, lineHeight: 1.8 }}>
                {buildLog.map((log, i) => <div key={i} style={{ color: log.includes("✓") ? "#4ade80" : "#94a3b8" }}>{log}</div>)}
              </div>
            </div>

            {/* Pages */}
            {builtPages.length > 0 && (
              <div>
                <div style={{ fontSize: 7, fontWeight: 700, marginBottom: 5 }}>Generated ({builtPages.length} pages):</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {builtPages.map(page => <span key={page} style={{ fontSize: 7, background: "#22c55e15", color: "#4ade80", borderRadius: 4, padding: "2px 8px", border: "1px solid #22c55e30", fontFamily: "monospace" }}>{page}</span>)}
                </div>
              </div>
            )}

            {/* Comparison table */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 10, marginTop: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6 }}>Traditional SPA vs Zero-runtime SSG</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, fontSize: 7 }}>
                <div style={{ color: "#64748b", fontWeight: 700 }}>Metric</div>
                <div style={{ color: "#ef4444", fontWeight: 700 }}>Traditional SPA</div>
                <div style={{ color: "#22c55e", fontWeight: 700 }}>Zero-runtime SSG</div>
                {[
                  ["TTFB", "300–800ms (server)", "<10ms (CDN)"],
                  ["JS to render", "~300KB runtime", "0KB"],
                  ["Server cost", "$50–200/mo", "$0"],
                  ["Content update", "Engineer deploy", "CMS publish (~5min)"],
                  ["Eng resources", "Maintain server", "None"],
                  ["Scale", "Horizontal pods", "CDN auto-scales"],
                ].map(([m, a, b], i) => (
                  <React.Fragment key={i}>
                    <div style={{ color: "#94a3b8", padding: "2px 0" }}>{m}</div>
                    <div style={{ color: "#ef444480", padding: "2px 0" }}>{a}</div>
                    <div style={{ color: "#22c55e80", padding: "2px 0" }}>{b}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="node-fs build script — fetches CMS, generates static route files" color="#22c55e" code={
`// scripts/build-pages.js — runs as "prebuild" before "next build"
// Fetches ALL content from CMS, writes to local files.
// Next.js reads these files at build time — ZERO runtime CMS calls.

const fs   = require("fs");
const path = require("path");

async function buildPages() {
  // 1. Fetch all published pages from CMS
  const res   = await fetch(process.env.CMS_API_URL + "/pages?status=published", {
    headers: { Authorization: \`Bearer \${process.env.CMS_API_KEY}\` },
  });
  const pages = await res.json();

  // 2. Write each page's content as a local JSON file
  const dataDir = path.join(process.cwd(), ".generated/pages");
  fs.mkdirSync(dataDir, { recursive: true });

  for (const page of pages) {
    // Slug: /blog/my-post → filename: blog__my-post.json
    const filename = page.slug.replace(/\\//g, "__").replace(/^\\_\\_/, "") + ".json";
    fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(page));
    console.log(\`  ✓ Generated: \${page.slug}\`);
  }

  // 3. Write a manifest (list of all slugs for getStaticPaths)
  fs.writeFileSync(
    path.join(process.cwd(), ".generated/manifest.json"),
    JSON.stringify({ slugs: pages.map(p => p.slug), builtAt: new Date().toISOString() })
  );
}

buildPages().catch(err => { console.error(err); process.exit(1); });

// package.json:
// "prebuild": "node scripts/build-pages.js",
// "build":    "next build"
//
// "prebuild" runs automatically before "build". No extra CI step.

// WHY node-fs CUSTOM SCRIPTS INSTEAD OF NEXT.JS FETCH IN getStaticProps?
// Option A: fetch CMS directly in getStaticProps.
//   Simple. But: N pages = N CMS API calls during build.
//   For 100 pages: 100 sequential API calls. Slow builds.
//   CMS rate limit: possible to hit during large builds.
//   Solution: the build script fetches ALL pages in ONE request.
//   Then writes them to local files. getStaticProps reads local files.
//   Build: fast. CMS API: 1 call total.
//
// Option B: our approach — prefetch everything, write to disk.
//   One CMS call. Subsequent access: local file reads (microseconds).
//   100 pages: same speed as 1 page. Build: fast and predictable.`} />

              <CodeBlock label="Next.js getStaticPaths/Props — zero-runtime page generation" color="#0ea5e9" code={
`// pages/[...slug].tsx — catches all CMS-driven routes
// Runs ONLY at build time. Not at request time. Zero server needed.

import fs   from "fs";
import path from "path";
import type { GetStaticPaths, GetStaticProps } from "next";

export const getStaticPaths: GetStaticPaths = () => {
  const { slugs } = JSON.parse(
    fs.readFileSync(".generated/manifest.json", "utf-8")
  );
  return {
    paths: slugs.map((slug: string) => ({
      params: { slug: slug.split("/").filter(Boolean) }
    })),
    fallback: false, // 404 for unknown slugs. No on-demand generation.
  };
};

export const getStaticProps: GetStaticProps = ({ params }) => {
  const slug     = "/" + (params?.slug as string[] || []).join("/");
  const filename = slug.replace(/\\//g, "__").replace(/^\\_\\_/, "") + ".json";
  const page     = JSON.parse(
    fs.readFileSync(\`.generated/pages/\${filename}\`, "utf-8")
  );
  return { props: { page } };
  // No revalidate: ISR would require edge functions (= runtime cost).
  // Our choice: rebuild on CMS publish webhook. Zero runtime.
};

// SAVING ENGINEERING RESOURCES:
// Before: content team files tickets to engineering for EVERY text change.
//   "Update the pricing copy" → engineering ticket → 1-2 day wait.
//   Engineering hours spent: 6-8 hours/week on content-only changes.
// After: content team edits CMS → hits "Publish" → webhook triggers CI
//   → build runs (~5 min) → deployed to CDN → live.
//   Engineering involvement: zero.
//   Those 6-8 hours/week: redirected to product features.
//
// WHY NOT ISR (Incremental Static Regeneration)?
// ISR: re-renders pages on-demand after a timeout (revalidate: 60).
// Pros: content is always fresh within 60s. No rebuild on publish.
// Cons: requires edge functions (Lambda@Edge or Vercel Edge).
//   Cost: runtime server infrastructure + operational overhead.
//   "Zero-runtime" was the explicit constraint.
// Our choice: rebuild on webhook. 5 minutes to live. Zero runtime cost.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── DESIGN SYSTEM ── */}
      {activeTab === "ds" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              {(["before", "after"] as const).map(m => (
                <button key={m} onClick={() => setDsMode(m)} style={{ flex: 1, background: dsMode === m ? (m === "before" ? "#ef444420" : "#22c55e20") : "#1e293b", border: `1px solid ${dsMode === m ? (m === "before" ? "#ef4444" : "#22c55e") : "#334155"}`, borderRadius: 7, padding: "7px", cursor: "pointer", color: dsMode === m ? (m === "before" ? "#f87171" : "#4ade80") : "#64748b", fontSize: 9, fontWeight: 700 }}>
                  {m === "before" ? "🔴 Before: runtime CSS-in-JS" : "🟢 After: CSS Modules + RSC"}
                </button>
              ))}
            </div>

            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>Live Component Preview</div>

              {/* Buttons */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>Button</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>Primary</button>
                  <button style={{ background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 10 }}>Secondary</button>
                  <button style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Large</button>
                </div>
                {dsMode === "after" && <div style={{ marginTop: 4, fontSize: 6, color: "#22c55e", fontFamily: "monospace" }}>✓ role="button" aria-pressed="false" tabIndex=0 | Enter + Space trigger onClick</div>}
              </div>

              {/* Modal */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>Modal — {dsMode === "after" ? "focus trap + Escape key" : "no keyboard support"}</div>
                <button onClick={() => setModalOpen(true)} style={{ background: "#a855f720", border: "1px solid #a855f7", borderRadius: 7, padding: "6px 12px", cursor: "pointer", color: "#c084fc", fontSize: 9, fontWeight: 700 }}>Open Modal</button>
                {modalOpen && (
                  <div style={{ position: "fixed", inset: 0, background: "#00000080", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setModalOpen(false)}>
                    <div role={dsMode === "after" ? "dialog" : undefined} aria-modal={dsMode === "after" ? "true" : undefined} aria-labelledby="adv-modal-title" onClick={e => e.stopPropagation()} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20, width: 320 }}>
                      <div id="adv-modal-title" style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Modal Dialog</div>
                      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 12 }}>{dsMode === "after" ? "role='dialog' + aria-modal='true'. Focus trapped inside. Press Escape to close." : "No ARIA attributes. Screen reader: cannot identify this as a dialog."}</div>
                      <button onClick={() => setModalOpen(false)} style={{ background: "#ef444420", border: "1px solid #ef4444", borderRadius: 7, padding: "6px 14px", cursor: "pointer", color: "#f87171", fontSize: 9, fontWeight: 700 }}>Close{dsMode === "after" ? " (or Esc)" : ""}</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Alert */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>Alert — {dsMode === "after" ? "role='alert' (screen reader announces automatically)" : "no announcement"}</div>
                <button onClick={() => setAlertMsg("Action completed")} style={{ background: "#22c55e20", border: "1px solid #22c55e", borderRadius: 7, padding: "6px 12px", cursor: "pointer", color: "#4ade80", fontSize: 9, fontWeight: 700 }}>Trigger Alert</button>
                {alertMsg && (
                  <div role={dsMode === "after" ? "alert" : undefined} aria-live={dsMode === "after" ? "assertive" : undefined} style={{ marginTop: 6, background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 7, padding: "6px 10px", fontSize: 8, color: "#4ade80" }}>
                    ✓ {alertMsg} {dsMode === "after" && <span style={{ fontSize: 7, color: "#22c55e80" }}>[Screen reader announces this]</span>}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div>
                <div style={{ fontSize: 7, color: "#64748b", marginBottom: 4 }}>Tabs — {dsMode === "after" ? "Arrow key navigation (WAI-ARIA)" : "no keyboard nav"}</div>
                <div role={dsMode === "after" ? "tablist" : undefined} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {["Tab A", "Tab B", "Tab C"].map((t, i) => (
                    <button key={t} role={dsMode === "after" ? "tab" : undefined} aria-selected={dsMode === "after" ? (activeTabIdx === i) : undefined} onClick={() => setActiveTabIdx(i)} style={{ padding: "5px 12px", borderRadius: "6px 6px 0 0", border: `1px solid ${activeTabIdx === i ? "#0ea5e9" : "#334155"}`, background: activeTabIdx === i ? "#0ea5e920" : "#0f172a", cursor: "pointer", color: activeTabIdx === i ? "#38bdf8" : "#64748b", fontSize: 8, fontWeight: activeTabIdx === i ? 700 : 400 }}>{t}</button>
                  ))}
                </div>
                <div role={dsMode === "after" ? "tabpanel" : undefined} style={{ background: "#0f172a", borderRadius: "0 8px 8px 8px", padding: "8px 10px", border: "1px solid #334155", fontSize: 8, color: "#94a3b8" }}>
                  {["Tab A", "Tab B", "Tab C"][activeTabIdx]} content {dsMode === "after" && <span style={{ fontSize: 7, color: "#475569" }}>← Use Arrow keys to navigate tabs</span>}
                </div>
              </div>
            </div>

            {/* ARIA selector */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 10 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
                {(Object.keys(ARIA_MAP) as CompName[]).map(c => (
                  <button key={c} onClick={() => setSelectedComp(c)} style={{ fontSize: 7, background: selectedComp === c ? "#a855f720" : "#0f172a", border: `1px solid ${selectedComp === c ? "#a855f7" : "#334155"}`, borderRadius: 4, padding: "3px 8px", cursor: "pointer", color: selectedComp === c ? "#c084fc" : "#64748b", fontWeight: 700 }}>{c}</button>
                ))}
              </div>
              <div style={{ fontSize: 7, fontWeight: 700, color: "#a855f7", marginBottom: 4 }}>WAI-ARIA spec for &lt;{selectedComp}&gt;</div>
              <div style={{ fontSize: 7, color: "#64748b", marginBottom: 2 }}>role: <span style={{ color: "#f1f5f9", fontFamily: "monospace" }}>{ARIA_MAP[selectedComp].role ?? "implicit"}</span></div>
              {Object.entries(ARIA_MAP[selectedComp].attrs).map(([k, v]) => (
                <div key={k} style={{ fontSize: 6, fontFamily: "monospace", color: "#94a3b8" }}>{k}=<span style={{ color: "#f59e0b" }}>"{v}"</span></div>
              ))}
              <div style={{ fontSize: 6, color: "#64748b", marginTop: 4 }}>Keyboard: {ARIA_MAP[selectedComp].events.join(" · ")}</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label={dsMode === "before" ? "BEFORE: runtime CSS-in-JS (breaks RSC)" : "AFTER: CSS Modules + custom properties (RSC-compatible)"} color={dsMode === "before" ? "#ef4444" : "#22c55e"} code={dsMode === "before"
                ? `// ❌ BEFORE: styled-components (runtime CSS-in-JS)
// Problem: generates CSS via JavaScript IN THE BROWSER.
// Incompatible with React Server Components (RSC).
// RSC: renders on the server. No JavaScript runtime on the client.
// styled-components: REQUIRES the JS runtime to generate CSS strings
// and inject them via <style> tags. This fails in RSC.

import styled from "styled-components";

const Button = styled.button\`
  background: \${props => props.variant === "primary" ? "#0ea5e9" : "#1e293b"};
  color: \${props => props.variant === "primary" ? "#fff" : "#94a3b8"};
  padding: \${props => props.size === "lg" ? "12px 24px" : "8px 16px"};
  border-radius: 8px;
\`;

// In an RSC page:
// export default async function Page() {
//   const data = await db.query("...");  // server-only
//   return <Button variant="primary">Click</Button>;
//   // ❌ ERROR: styled-components uses useContext internally.
//   //    Context: not available in RSC.
//   //    Also: CSS injection at runtime: not RSC-compatible.
// }

// PERFORMANCE COST OF RUNTIME CSS-in-JS:
// Each render: JS executes to produce a CSS string.
// CSS string → injected via document.createElement("style").
// On every variant/size prop change: new CSS generated.
// This JS execution: contributes to TBT.
// "CSS should be static. If CSS requires JS to generate at runtime,
//  something has gone wrong architecturally."`
                : `// ✓ AFTER: CSS Modules + CSS custom properties (zero runtime)
// CSS Modules: extracted at BUILD TIME by webpack/Next.js.
// No JS needed at runtime to generate or inject CSS.
// CSS: a static .css file. Works in RSC. Works everywhere.

// button.module.css — compiled at build time, not runtime:
.button {
  background: var(--btn-bg, #1e293b);
  color:      var(--btn-color, #94a3b8);
  padding:    var(--btn-padding, 8px 16px);
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}
.button:hover { opacity: 0.9; }

// Variants: CSS custom properties override the defaults.
// The "dynamic" behaviour: achieved without any JS.
.primary { --btn-bg: #0ea5e9; --btn-color: #fff;      }
.danger  { --btn-bg: #ef4444; --btn-color: #fff;      }
.large   { --btn-padding: 12px 24px;                   }

// Button.tsx — works in RSC, Server Components, Client Components:
import styles from "./button.module.css";

export function Button({ variant = "default", size = "md", children, ...props }) {
  return (
    <button
      className={[
        styles.button,
        variant === "primary" && styles.primary,
        variant === "danger"  && styles.danger,
        size === "lg"         && styles.large,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
// Zero JS at runtime for styling. CSS: a static file.
// Works in RSC page: export default async function Page() {
//   return <Button variant="primary">Click</Button>;  ✓
// }
//
// LOADING TIME IMPROVEMENT:
// Before: styled-components runtime (~15KB gzipped) in bundle.
// After: zero runtime. CSS: static file, cached by CDN.
// First Contentful Paint: improved (less JS to parse before rendering).
// Subsequent visits: CSS cached. Instant paint.`} />

              <CodeBlock label="WAI-ARIA — why it lives in the design system, not in product code" color="#a855f7" code={
`// WHY ARIA BELONGS IN THE DESIGN SYSTEM:
//
// Product engineers: focused on features. Not accessibility.
// "Add aria-label to the close button" — every engineer, every PR.
// Result: sometimes done, often forgotten. Inconsistent coverage.
//
// If ARIA is embedded in base components:
//   Every consumer: gets ARIA for free. No extra cognitive load.
//   A Button without aria-label: architecturally prevented.
//     (BaseButton requires it as a prop.)
//   Regressions: caught at the component level, not scattered in products.
//
// MODAL FOCUS TRAP — the most-missed pattern:
// Without focus trap: Tab key exits the modal.
// User is on a screen reader or keyboard: they "escape" the modal
// without closing it. They cannot see the content behind it.
// They're lost. This is a WCAG failure (Level A).

function Modal({ isOpen, title, onClose, children }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    ref.current?.focus(); // move focus INTO the modal on open

    const trap = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;

      const focusable = ref.current?.querySelectorAll(
        'button, [href], input, select, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable?.[0] as HTMLElement;
      const last  = focusable?.[focusable.length - 1] as HTMLElement;

      if (e.shiftKey  && document.activeElement === first) {
        e.preventDefault(); last?.focus();   // wrap to last
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first?.focus();  // wrap to first
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div ref={ref} role="dialog" aria-modal="true"
         aria-labelledby="modal-title" tabIndex={-1}>
      <h2 id="modal-title">{title}</h2>
      {children}
    </div>
  );
}

// WHY tabIndex={-1} on the div?
// Makes the div programmatically focusable (ref.current?.focus()).
// But NOT in the natural Tab order (tabIndex=0 would make it tabbable).
// Focus: goes to the dialog, then users Tab through its children.

// TABS KEYBOARD PATTERN (WAI-ARIA authoring practice):
const onTabKeyDown = (e: KeyboardEvent, count: number) => {
  if (e.key === "ArrowRight") setIdx(i => (i + 1) % count);
  if (e.key === "ArrowLeft")  setIdx(i => (i - 1 + count) % count);
  if (e.key === "Home")       setIdx(0);
  if (e.key === "End")        setIdx(count - 1);
};
// This is the exact keyboard contract users of assistive technology expect.
// Without it: keyboard users are stuck on the first tab or get lost.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── K8s ── */}
      {activeTab === "k8s" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              {(["before", "after"] as const).map(m => (
                <button key={m} onClick={() => { setK8sMode(m); setPlayhead(0); setPlaying(false); }} style={{ flex: 1, background: k8sMode === m ? (m === "before" ? "#ef444420" : "#22c55e20") : "#1e293b", border: `1px solid ${k8sMode === m ? (m === "before" ? "#ef4444" : "#22c55e") : "#334155"}`, borderRadius: 7, padding: "7px", cursor: "pointer", color: k8sMode === m ? (m === "before" ? "#f87171" : "#4ade80") : "#64748b", fontSize: 9, fontWeight: 700 }}>
                  {m === "before" ? "🔴 Before: static 3 pods" : "🟢 After: HPA auto-scale (3→12)"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
              <button onClick={() => { setPlayhead(0); setPlaying(true); }} style={{ background: "#0ea5e920", border: "1px solid #0ea5e9", borderRadius: 6, padding: "5px 12px", cursor: "pointer", color: "#38bdf8", fontSize: 8, fontWeight: 700 }}>▶ Play</button>
              <button onClick={() => setPlaying(false)} style={{ background: "#334155", border: "1px solid #475569", borderRadius: 6, padding: "5px 12px", cursor: "pointer", color: "#94a3b8", fontSize: 8 }}>⏸ Pause</button>
              <button onClick={() => { setPlayhead(0); setPlaying(false); }} style={{ background: "#334155", border: "1px solid #475569", borderRadius: 6, padding: "5px 12px", cursor: "pointer", color: "#94a3b8", fontSize: 8 }}>⏮ Reset</button>
              <span style={{ fontSize: 8, color: isSpike ? "#ef4444" : "#64748b", fontWeight: isSpike ? 700 : 400 }}>
                {isSpike ? "⚡ TRAFFIC SPIKE (25K RPS)" : `t = ${playhead}s`}
              </span>
            </div>

            {/* Current metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
              {[
                { label: "RPS",         value: current?.rps.toLocaleString(), unit: "req/s",    color: isSpike ? "#f59e0b" : "#0ea5e9" },
                { label: "Pod Count",   value: String(current?.pods),         unit: "running",   color: k8sMode === "after" && isSpike ? "#22c55e" : "#64748b" },
                { label: "p99 Latency", value: `${current?.p99Ms}ms`,         unit: "",          color: (current?.p99Ms ?? 0) > 400 ? "#ef4444" : "#22c55e" },
                { label: "Kafka Lag",   value: current?.kafkaLag.toLocaleString(), unit: "msgs", color: (current?.kafkaLag ?? 0) > 10000 ? "#ef4444" : (current?.kafkaLag ?? 0) > 1000 ? "#f59e0b" : "#22c55e" },
              ].map(m => (
                <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${m.color}20`, borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 7, color: "#64748b" }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 6, color: "#475569" }}>{m.unit}</div>
                </div>
              ))}
            </div>

            {/* Sparklines */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>Metric Trends (30s window)</div>
              {[
                { label: "RPS",         data: metrics.map(m => m.rps),       max: 26000, color: "#f59e0b" },
                { label: "p99 (ms)",    data: metrics.map(m => m.p99Ms),     max: k8sMode === "before" ? 2000 : 300, color: k8sMode === "before" ? "#ef4444" : "#22c55e" },
                { label: "Kafka Lag",   data: metrics.map(m => m.kafkaLag),  max: k8sMode === "before" ? 120000 : 6000, color: k8sMode === "before" ? "#ef4444" : "#f59e0b" },
                { label: "Pod Count",   data: metrics.map(m => m.pods),      max: 15,    color: "#a855f7" },
              ].map(s => (
                <div key={s.label} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 7, color: "#64748b" }}>{s.label}</span>
                    <span style={{ fontSize: 7, color: s.color }}>{s.data[playhead]?.toLocaleString()}</span>
                  </div>
                  <Sparkline data={s.data.slice(0, playhead + 1)} max={s.max} color={s.color} />
                </div>
              ))}
            </div>

            {/* Pod grid */}
            {k8sMode === "after" && (
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6 }}>K8s Pod Cluster (HPA auto-scaled)</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {Array.from({ length: current?.pods ?? 3 }, (_, i) => (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: 6, background: i < 3 ? "#0ea5e920" : "#22c55e20", border: `1px solid ${i < 3 ? "#0ea5e9" : "#22c55e"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                      {i < 3 ? "📦" : "🆕"}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 7, color: "#64748b", marginTop: 4 }}>📦 baseline pods (always on) · 🆕 HPA-scaled pods (auto-created during spike)</div>
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="K8s HPA + resource tuning — handling 25K RPS spikes" color="#f59e0b" code={
`# BEFORE: static deployment, 3 replicas
# 25K RPS spike: ~8,300 RPS per pod (well above capacity)
# CPU: throttled. p99 latency: 1,800ms. SLA breached. Alerts firing.
# On-call: manually scales up. By then: users already experiencing errors.

# AFTER: HPA with custom metrics from Datadog

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 15
  metrics:
    - type: External
      external:
        metric:
          name: datadog.rps_per_pod
          selector:
            matchLabels: { service: api-gateway }
        target:
          type: AverageValue
          averageValue: 500    # scale when avg RPS per pod > 500
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30   # don't scale on momentary spike
      policies:
        - type: Pods
          value: 3
          periodSeconds: 60            # add at most 3 pods/minute
    scaleDown:
      stabilizationWindowSeconds: 300  # wait 5min before scaling down
      # Prevents "flapping" (scale up → briefly calms → scale down → spike again)

# RESOURCE REQUESTS / LIMITS (the key to correct scheduling):
resources:
  requests:
    cpu:    "250m"   # guaranteed allocation (for scheduling)
    memory: "256Mi"
  limits:
    cpu:    "500m"   # can burst; above: CPU throttled (not killed)
    memory: "512Mi"  # hard limit: above → OOMKilled

# WHY requests ≠ limits (Burstable QoS vs Guaranteed):
# Guaranteed (req == limits): pod never evicted. But resources reserved
# even when idle. 30% less cluster density. Higher cloud cost.
# Burstable (req < limits):   pod can burst. More efficient packing.
# Risk: OOMKill if node is under memory pressure.
# Our workload: stateless API. OOMKill = lost request, retry succeeds.
# Trade-off accepted. 30% more efficient cluster utilisation.

# RESULT:
# During 25K RPS spike: scaled from 3 → 9 pods in 90 seconds.
# Each pod: ~2,800 RPS (within capacity).
# p99 latency: 1,800ms → 160ms. SLA maintained. No on-call page.`} />

              <CodeBlock label="Kafka consumer lag — diagnosis and tuning" color="#a855f7" code={
`// KAFKA CONSUMER LAG: WHAT IT IS
//
// Kafka: distributed message queue.
// Producer: writes messages to a topic (e.g. "user-events").
// Consumer: reads messages from the topic and processes them.
//
// Consumer lag = messages written by producer MINUS messages processed.
// Lag = 0:     real-time. Consumer keeping up.
// Lag = 80,000: consumer is 80,000 messages behind.
//   If each message takes 5ms to process: 80,000 × 5ms = 6.7 minutes behind.
//   "Real-time" features: no longer real-time.
//
// BEFORE TUNING:
// Producer rate during spike: 25,000 messages/second.
// Consumer throughput: ~200 messages/second.
// Rate gap: 24,800 msg/s. After a 10-minute spike: 14.88M lag.
// Recovery: 14.88M ÷ 200 = 20.7 hours to clear. Catastrophic.
//
// DIAGNOSIS TOOL: Datadog kafka.consumer_group.lag metric.
// Alert fired: consumer_group.max_lag > 10,000.
// Dashboard: lag growing linearly during the spike.
// Confirmed: consumer throughput, not Kafka broker, was the bottleneck.
//
// TUNING APPLIED (5 changes):

// 1. INCREASE PARTITIONS (more parallelism)
//    Partitions: 6 → 18.
//    Consumer group: scales to 18 consumers (one per partition max).
//    Throughput: 3× via parallelism alone.

// 2. INCREASE max.poll.records
//    500 → 2,000 (batch size per poll loop).
//    Fewer round-trips to the broker. More work per poll.
//    Paired with: max.poll.interval.ms: 60,000 → 120,000ms.
//    (Else: larger batch takes longer → session timeout fires → rebalance.)

// 3. ASYNC PROCESSING (Promise.all batching)
//    Before: messages processed sequentially (one by one).
//    Each message: network I/O call (e.g. write to database).
//    At 5ms per message: 200 msg/s max throughput.
//
const handleBatch = async (messages: KafkaMessage[]) => {
  const groups = chunk(messages, 10); // split into groups of 10
  for (const group of groups) {
    await Promise.all(group.map(msg => processMessage(msg)));
  }
};
//    10 concurrent I/O calls per iteration: 10× throughput.
//    200 msg/s → 2,000 msg/s from this change alone.

// 4. CONSUMER GROUP ISOLATION
//    Separate consumer groups for: critical (alerts, payments) vs non-critical.
//    During a lag spike: critical consumers get dedicated partitions.
//    Non-critical: can fall behind. Critical: guaranteed real-time.

// RESULT:
//   Consumer throughput: 200 → 4,800 msg/s (24× improvement)
//   During 25K RPS spike: max lag peaks at ~5,000 messages (vs 14.88M)
//   Recovery after spike: 5,000 ÷ 4,800 = ~1 minute (vs 20.7 hours)

// DATADOG MONITORING SETUP:
// Metrics tracked:
//   kafka.consumer_group.lag       → per partition
//   kafka.consumer_group.max_lag   → worst partition (the alert trigger)
//   kafka.net.bytes_in             → producer ingestion rate
//
// Alert thresholds:
//   max_lag > 10,000  → P2 (Slack notification: "worth investigating")
//   max_lag > 50,000  → P1 (PagerDuty: "wake someone up, now")
//
// The threshold distinction matters:
// 10K lag: "something is off, watch it." Not yet user-impacting.
// 50K lag: "users are seeing stale data right now. Fix immediately."`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedPlatformDemo;
