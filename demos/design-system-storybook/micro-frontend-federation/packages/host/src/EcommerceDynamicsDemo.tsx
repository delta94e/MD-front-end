/**
 * EcommerceDynamicsDemo.tsx
 *
 * Full-Stack Developer — E-Commerce Platform + Microsoft Dynamics Integration
 * Node.js · React · TypeScript · Dynamics 365 · Performance · Feature Lead
 *
 * TABS
 *   🛒 Platform Overview   — E-commerce + Dynamics 365 integration: catalog, orders, inventory, customers
 *   🔌 API Design          — BFF pattern, UX benchmark improvements, before/after API shapes
 *   ⚡ Performance         — 2× RPS · ½ latency: profiling → caching → parallelisation → clustering
 *   👥 Feature Lead        — Work coordination, ambiguity framework, changing requirements navigation
 */

import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Design tokens — corporate e-commerce (dark navy + teal)
// ─────────────────────────────────────────────────────────────────
const C = {
  bg:        "#070d1a",
  surface:   "#0d1526",
  surface2:  "#111e35",
  surface3:  "#1a2945",
  border:    "#1e3052",
  teal:      "#00b4d8",
  tealDark:  "#0077a8",
  blue:      "#3b82f6",
  purple:    "#8b5cf6",
  green:     "#10b981",
  yellow:    "#f59e0b",
  orange:    "#f97316",
  red:       "#ef4444",
  text:      "#94a3b8",
  textBright:"#e2e8f0",
  textMuted: "#475569",
  mono:      "'JetBrains Mono', 'Fira Code', monospace",
};

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface Product {
  id:        string;
  sku:       string;
  name:      string;
  price:     number;
  inventory: number;
  synced:    boolean;
  category:  string;
}

interface Order {
  id:        string;
  customer:  string;
  items:     number;
  total:     number;
  status:    "pending" | "syncing" | "confirmed" | "error";
  channel:   string;
}

interface PerfMetric {
  label:  string;
  before: number;
  after:  number;
  unit:   string;
  better: "higher" | "lower";
}

interface FeatureTicket {
  id:       string;
  title:    string;
  assignee: string;
  status:   "todo" | "in_progress" | "review" | "done";
  priority: "high" | "medium" | "low";
  blocked:  boolean;
}

// ─────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  { id: "p1", sku: "LAPTOP-PRO-15",   name: "ProBook 15 Laptop",      price: 1299, inventory: 48,  synced: true,  category: "Laptops"  },
  { id: "p2", sku: "MONITOR-4K-27",   name: "ViewMax 4K 27\" Monitor", price: 649,  inventory: 12,  synced: true,  category: "Displays" },
  { id: "p3", sku: "HEADSET-NC-700",  name: "NoiseCancelPro 700",     price: 349,  inventory: 0,   synced: false, category: "Audio"    },
  { id: "p4", sku: "KEYBOARD-MECH-TK",name: "TactileKey TKL",         price: 129,  inventory: 234, synced: true,  category: "Peripherals" },
];

const ORDERS: Order[] = [
  { id: "ORD-4821", customer: "Acme Corp",      items: 5,  total: 4895, status: "confirmed", channel: "Web" },
  { id: "ORD-4822", customer: "Globex Inc",     items: 2,  total: 1948, status: "syncing",   channel: "Web" },
  { id: "ORD-4823", customer: "Initech Ltd",    items: 8,  total: 2104, status: "pending",   channel: "API" },
  { id: "ORD-4824", customer: "Umbrella Corp",  items: 1,  total: 649,  status: "error",     channel: "Web" },
];

const PERF_METRICS: PerfMetric[] = [
  { label: "Requests Per Second",     before: 148,  after: 312,  unit: "RPS", better: "higher" },
  { label: "P95 Latency",            before: 820,  after: 390,  unit: "ms",  better: "lower"  },
  { label: "P99 Latency",            before: 1940, after: 870,  unit: "ms",  better: "lower"  },
  { label: "Cache Hit Rate",          before: 0,    after: 84,   unit: "%",   better: "higher" },
  { label: "Avg DB Queries/Request", before: 14,   after: 3,    unit: "queries", better: "lower" },
  { label: "Memory Usage",           before: 820,  after: 540,  unit: "MB",  better: "lower"  },
];

const TICKETS: FeatureTicket[] = [
  { id: "EC-101", title: "Product catalog sync from Dynamics",    assignee: "Me",      status: "done",        priority: "high",   blocked: false },
  { id: "EC-102", title: "Order creation → Dynamics write-back",  assignee: "Alice",   status: "done",        priority: "high",   blocked: false },
  { id: "EC-103", title: "Inventory real-time polling",           assignee: "Bob",     status: "done",        priority: "high",   blocked: false },
  { id: "EC-104", title: "Customer account → Dynamics CRM sync",  assignee: "Me",      status: "in_progress", priority: "high",   blocked: false },
  { id: "EC-105", title: "Pricing list API endpoint (BFF)",       assignee: "Me",      status: "in_progress", priority: "medium", blocked: false },
  { id: "EC-106", title: "Checkout cart persistence",             assignee: "Alice",   status: "review",      priority: "medium", blocked: false },
  { id: "EC-107", title: "Product search + filtering",            assignee: "Bob",     status: "in_progress", priority: "medium", blocked: true  },
  { id: "EC-108", title: "Payment gateway integration",           assignee: "Alice",   status: "todo",        priority: "high",   blocked: false },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeSnip({ code, label, color = C.teal }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#030810", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      {label && <div style={{ padding: "4px 12px", borderBottom: `1px solid ${C.border}`, fontSize: 9, color, fontFamily: C.mono }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 8.5, fontFamily: C.mono, color: "#7c90ac", lineHeight: 1.7, overflow: "auto", maxHeight: 340, whiteSpace: "pre-wrap" }}>{code}</pre>
    </div>
  );
}

const STATUS_COLOR: Record<Order["status"], string> = {
  pending: C.textMuted, syncing: C.teal, confirmed: C.green, error: C.red,
};
const TICKET_STATUS_COLOR: Record<FeatureTicket["status"], string> = {
  todo: C.textMuted, in_progress: C.teal, review: C.yellow, done: C.green,
};
const PRIORITY_COLOR: Record<FeatureTicket["priority"], string> = {
  high: C.red, medium: C.yellow, low: C.textMuted,
};

// ─────────────────────────────────────────────────────────────────
// Live RPS counter
// ─────────────────────────────────────────────────────────────────

function RPSMeter({ target, label, color }: { target: number; label: string; color: string }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setCurrent(v => {
        const jitter = target * 0.05 * (Math.random() - 0.5);
        return Math.max(0, Math.round(target + jitter));
      });
    }, 800);
    return () => clearInterval(id);
  }, [target]);
  return (
    <div style={{ textAlign: "center", padding: "10px 14px", background: C.surface2, border: `1px solid ${color}30`, borderRadius: 10 }}>
      <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: C.mono, lineHeight: 1 }}>{current}</div>
      <div style={{ fontSize: 8, color: C.textMuted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

export function EcommerceDynamicsDemo() {
  const [tab, setTab] = useState<"platform" | "api" | "perf" | "lead">("platform");

  // Platform state
  const [syncingId, setSyncingId]   = useState<string | null>(null);
  const [orderFocus, setOrderFocus] = useState<string | null>(null);
  const [flowStep, setFlowStep]     = useState(0);

  // API design state
  const [apiView, setApiView]       = useState<"before" | "after">("before");
  const [uxScore, setUxScore]       = useState({ before: 62, after: 81 });

  // Performance state
  const [showAfter, setShowAfter]   = useState(true);
  const [optStep, setOptStep]       = useState(-1);

  // Feature lead state
  const [tickets, setTickets]       = useState<FeatureTicket[]>(TICKETS);
  const [ambigMode, setAmbigMode]   = useState<null | "spike" | "doc" | "build">(null);
  const [reqChangeStep, setReqChangeStep] = useState(-1);

  const syncProduct = (id: string) => {
    setSyncingId(id);
    setTimeout(() => setSyncingId(null), 2000);
  };

  const moveTicket = (id: string) => {
    setTickets(ts => ts.map(t => {
      if (t.id !== id) return t;
      const next: Record<FeatureTicket["status"], FeatureTicket["status"]> = {
        todo: "in_progress", in_progress: "review", review: "done", done: "done",
      };
      return { ...t, status: next[t.status], blocked: false };
    }));
  };

  const FLOW_STEPS = [
    { label: "Customer action",    icon: "🖱️", detail: "Customer browses product, adds to cart, or completes checkout on React frontend."       },
    { label: "Node BFF layer",     icon: "⚙️", detail: "Node.js Backend-for-Frontend receives the request, validates, enriches, and routes."    },
    { label: "E-Commerce DB",      icon: "🗄️", detail: "PostgreSQL stores session data, cart, and user accounts. Fast local reads."              },
    { label: "Dynamics 365 API",   icon: "🏢", detail: "OData v4 REST API call to Dynamics for: orders (write), inventory (read), CRM (sync)."  },
    { label: "Async confirmation", icon: "📬", detail: "Azure Service Bus confirms Dynamics sync. Order status updated asynchronously."          },
    { label: "Frontend update",    icon: "✅", detail: "React UI receives SSE/polling update — order confirmed in ERP. Customer notified."        },
  ];

  const OPT_STEPS = [
    { label: "Profile with clinic.js",      icon: "🔍", gain: "Identified N+1 query: 14 DB queries per product page",  color: C.red    },
    { label: "Add Redis caching layer",     icon: "💾", gain: "84% cache hit rate → catalog served in 4ms vs 220ms",    color: C.teal   },
    { label: "Parallelize async ops",       icon: "⚡", gain: "Promise.all for independent calls → 280ms saved per req", color: C.blue   },
    { label: "DataLoader batch pattern",    icon: "📦", gain: "N+1 queries: 14/req → 3/req. DB load ↓ 78%",            color: C.purple  },
    { label: "PM2 cluster mode",            icon: "🖥️", gain: "8 CPU cores → 8 workers. Throughput ↑ linear",           color: C.green  },
    { label: "HTTP keep-alive + gzip",      icon: "🚀", gain: "Connection reuse + compression → P99 lat halved",        color: C.orange  },
  ];

  const REQ_CHANGE_STEPS = [
    "Requirement change arrives (Dynamics schema updated — OrderLine model changed)",
    "Assess blast radius: which API endpoints and React components are affected?",
    "Communicate to stakeholders: what changed, what is the new timeline, what trade-offs?",
    "Re-plan affected tickets: split into 'Dynamics compatibility layer' + 'UI update' tasks",
    "Assign: Alice → compatibility shim, Bob → UI, Me → API contract update",
    "Ship: incremental delivery — compatibility shim first, UI update in next sprint",
  ];

  const TABS = [
    { id: "platform" as const, label: "🛒 Platform Overview" },
    { id: "api"      as const, label: "🔌 API Design"        },
    { id: "perf"     as const, label: "⚡ Performance"       },
    { id: "lead"     as const, label: "👥 Feature Lead"      },
  ];

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${C.teal}, ${C.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛒</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: C.textBright, letterSpacing: "-0.02em" }}>E-Commerce Platform + Microsoft Dynamics 365 Integration</h1>
            <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>Node.js · React · TypeScript · Dynamics 365 OData · Redis · BFF Pattern · 2× RPS · ½ Latency</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "Dynamics", l: "ERP integration",          c: C.teal,   sub: "OData v4 · orders · catalog · CRM · inventory" },
            { v: "UX ↑31%", l: "UX benchmark improvement",  c: C.green,  sub: "62 → 81 score via BFF API redesign"            },
            { v: "2× RPS",   l: "Node.js throughput",       c: C.orange, sub: "148 → 312 RPS · P95 lat 820 → 390ms"           },
            { v: "3-person", l: "Feature team lead",        c: C.purple, sub: "Coordinated Alice + Bob · ambiguity + changes"  },
          ].map(m => (
            <div key={m.l} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${m.c}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: C.textBright }}>{m.l}</div>
              <div style={{ fontSize: 7, color: C.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${C.border}`, paddingBottom: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? C.surface2 : "transparent", color: tab === t.id ? C.textBright : C.textMuted, border: tab === t.id ? `1px solid ${C.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{t.label}</button>
        ))}
      </div>

      {/* ── PLATFORM OVERVIEW ── */}
      {tab === "platform" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>PRODUCT CATALOG — Synced from Dynamics 365</div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 70px 70px 60px", padding: "6px 12px", borderBottom: `1px solid ${C.border}`, fontSize: 8, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span>SKU</span><span>Product</span><span>Price</span><span>Stock</span><span>Sync</span>
              </div>
              {PRODUCTS.map((p, i) => (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 70px 70px 60px", padding: "8px 12px", borderBottom: `1px solid ${C.border}20`, background: i % 2 === 0 ? "transparent" : `${C.surface2}60`, alignItems: "center" }}>
                  <span style={{ fontSize: 7, fontFamily: C.mono, color: C.textMuted }}>{p.sku.slice(0, 10)}</span>
                  <span style={{ fontSize: 9, color: C.textBright, fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontSize: 9, color: C.teal, fontWeight: 700 }}>${p.price}</span>
                  <span style={{ fontSize: 9, color: p.inventory === 0 ? C.red : p.inventory < 20 ? C.yellow : C.green }}>{p.inventory === 0 ? "OOS" : p.inventory}</span>
                  <button onClick={() => syncProduct(p.id)} style={{ fontSize: 7, background: syncingId === p.id ? `${C.teal}20` : `${p.synced ? C.green : C.yellow}15`, color: syncingId === p.id ? C.teal : p.synced ? C.green : C.yellow, border: "none", borderRadius: 4, padding: "3px 6px", cursor: "pointer" }}>
                    {syncingId === p.id ? "⟳ Sync…" : p.synced ? "✓ Synced" : "↻ Sync"}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>ORDERS — Flowing to Dynamics 365</div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              {ORDERS.map((o, i) => (
                <div key={o.id} onClick={() => setOrderFocus(orderFocus === o.id ? null : o.id)} style={{ padding: "9px 12px", borderBottom: `1px solid ${C.border}20`, background: orderFocus === o.id ? `${C.teal}10` : i % 2 === 0 ? "transparent" : `${C.surface2}60`, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: orderFocus === o.id ? 6 : 0 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 8, fontFamily: C.mono, color: C.textMuted }}>{o.id}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.textBright }}>{o.customer}</span>
                      <span style={{ fontSize: 8, color: C.textMuted }}>{o.items} items</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: C.teal }}>${o.total.toLocaleString()}</span>
                      <span style={{ fontSize: 7, background: `${STATUS_COLOR[o.status]}18`, color: STATUS_COLOR[o.status], borderRadius: 3, padding: "1px 7px", fontWeight: 700, textTransform: "uppercase" }}>{o.status}</span>
                    </div>
                  </div>
                  {orderFocus === o.id && (
                    <div style={{ fontSize: 8, color: C.textMuted, lineHeight: 1.6, padding: "4px 0" }}>
                      {o.status === "confirmed" && "✓ Order written to Dynamics 365 → Fulfillment queue active → Customer notified"}
                      {o.status === "syncing" && "⟳ Node.js BFF is calling Dynamics OData API to create order record… (async)"}
                      {o.status === "pending" && "⏳ Order queued — awaiting Dynamics API availability. Retry logic active."}
                      {o.status === "error" && "✗ Dynamics returned 503. Order held in local DB. Retry scheduled. Operator alerted."}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>INTEGRATION FLOW — click to walk through</div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              {FLOW_STEPS.map((step, i) => (
                <div key={i} onClick={() => setFlowStep(i)} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 7, marginBottom: 4, cursor: "pointer", background: flowStep === i ? `${C.teal}10` : "transparent", border: `1px solid ${flowStep === i ? C.teal + "40" : "transparent"}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: flowStep >= i ? `${C.teal}20` : C.surface2, border: `2px solid ${flowStep >= i ? C.teal : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{step.icon}</div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: flowStep >= i ? C.textBright : C.textMuted }}>{step.label}</div>
                    {flowStep === i && <div style={{ fontSize: 8, color: C.text, lineHeight: 1.5, marginTop: 2 }}>{step.detail}</div>}
                  </div>
                </div>
              ))}
            </div>

            <CodeSnip color={C.teal} label="Dynamics 365 integration — OData v4, error handling, async retry" code={
`// MICROSOFT DYNAMICS 365 INTEGRATION — TECHNICAL DEPTH:
//
// Dynamics 365 uses OData v4 REST API.
// Auth: Azure AD OAuth 2.0 (client credentials flow for server-to-server).
//
// TOKEN MANAGEMENT:
// const token = await msal.acquireTokenByCredentials({
//   scopes: ['https://org.crm.dynamics.com/.default'],
// });
// Tokens expire in 1 hour. We cache + auto-refresh 5 min before expiry.
//
// PRODUCT CATALOG SYNC (read from Dynamics → web):
// GET /api/data/v9.2/products?$select=name,price,sku,stockquantity
//                             &$filter=statecode eq 0
//                             &$orderby=modifiedon desc
//                             &$top=500
//
// Sync strategy: NOT real-time for catalog.
// Products change infrequently. We sync every 15 minutes via cron.
// Differential sync: $filter=modifiedon gt {lastSyncTimestamp}
// Only changed records are fetched. At 10,000 products: practical.
//
// ORDER WRITE-BACK (web → Dynamics — the hard part):
// When customer places order:
// 1. Write to our Postgres DB immediately (transactional — fast).
// 2. Queue the Dynamics write to Azure Service Bus (async).
// 3. Node.js consumer picks up from queue → calls Dynamics API.
// 4. On success: update order status in our DB.
// 5. On failure: retry with exponential backoff (1s, 2s, 4s, 8s, max 5).
//
// WHY ASYNC ORDER WRITE?
// Dynamics OData API can be slow (300-800ms per call).
// Customer should NOT wait 800ms for order confirmation.
// We confirm to the customer from our DB immediately (~50ms).
// Dynamics sync: background process. Customer sees order confirmed.
// If Dynamics sync eventually fails after all retries:
// → Alert to operations team for manual intervention.
// → Order is never lost — it's in our DB.
// → "The customer's experience is decoupled from Dynamics availability."
//
// INVENTORY SYNC (near-real-time, harder):
// Inventory levels: if they go stale, customers buy out-of-stock items.
// Strategy: Dynamics webhook → Azure Event Grid → Node.js handler.
// Dynamics triggers on inventory change → we receive event → update cache.
// If webhook fails: fallback polling every 2 minutes.
// Redis cache: inventory levels with 2-minute TTL.
// "We accept a 2-minute inventory staleness window.
//  Business accepted this trade-off — better than polling Dynamics 
//  on every product page load."
//
// ERROR HANDLING — the important bit:
// interface DynamicsError { code: string; message: string; }
// 401 Unauthorized → refresh token → retry once
// 403 Forbidden    → log + alert (misconfigured permissions)
// 429 Too Many Req → exponential backoff + jitter
// 503 Service Unavail → queue for retry → surface to ops dashboard
// Network timeout → treat as 503`} />
          </div>
        </div>
      )}

      {/* ── API DESIGN ── */}
      {tab === "api" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>API DESIGN — UX BENCHMARK IMPROVEMENT</div>

            {/* UX scores */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>UX RESEARCH BENCHMARK SCORES</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[
                  { label: "Before API redesign", score: uxScore.before, color: C.red    },
                  { label: "After BFF pattern",   score: uxScore.after,  color: C.green  },
                ].map(s => (
                  <div key={s.label} style={{ background: C.surface2, border: `1px solid ${s.color}30`, borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: C.mono }}>{s.score}</div>
                    <div style={{ fontSize: 8, color: C.textMuted, marginTop: 2 }}>{s.label}</div>
                    <div style={{ background: C.surface3, borderRadius: 4, height: 6, marginTop: 6, overflow: "hidden" }}>
                      <div style={{ width: `${s.score}%`, height: "100%", background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 10px", background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: 7, fontSize: 8, color: C.textBright }}>
                +31% improvement · Measured by: task completion rate, time-on-task, user satisfaction (SUS)
              </div>
            </div>

            {/* API before/after toggle */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                <button onClick={() => setApiView("before")} style={{ fontSize: 9, background: apiView === "before" ? `${C.red}20` : "transparent", color: apiView === "before" ? C.red : C.textMuted, border: `1px solid ${apiView === "before" ? C.red : C.border}`, borderRadius: 5, padding: "5px 14px", cursor: "pointer" }}>❌ Before — 5 API calls</button>
                <button onClick={() => setApiView("after")} style={{ fontSize: 9, background: apiView === "after" ? `${C.green}20` : "transparent", color: apiView === "after" ? C.green : C.textMuted, border: `1px solid ${apiView === "after" ? C.green : C.border}`, borderRadius: 5, padding: "5px 14px", cursor: "pointer" }}>✅ After — 1 BFF call</button>
              </div>

              {apiView === "before" && (
                <div>
                  <div style={{ fontSize: 8, color: C.textMuted, marginBottom: 8, lineHeight: 1.5 }}>Frontend made 5 separate calls to render the product page. Sequential dependencies → waterfall loading.</div>
                  {[
                    { call: "GET /dynamics/products/:id",             ms: 280, note: "Product base data"     },
                    { call: "GET /dynamics/pricing/:productId",        ms: 210, note: "Price list data"       },
                    { call: "GET /dynamics/inventory/:sku",            ms: 190, note: "Stock levels"          },
                    { call: "GET /dynamics/related-products/:category",ms: 340, note: "Recommendations"       },
                    { call: "GET /dynamics/reviews/:productId",        ms: 160, note: "Customer reviews"      },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", background: C.surface2, borderRadius: 5, marginBottom: 4, fontSize: 8 }}>
                      <span style={{ fontFamily: C.mono, color: C.text }}>{r.call}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ color: C.textMuted }}>{r.note}</span>
                        <span style={{ color: C.red, fontWeight: 700 }}>{r.ms}ms</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 6, padding: "5px 8px", background: `${C.red}10`, borderRadius: 5, fontSize: 8, color: C.red, fontWeight: 700 }}>Total: 1,180ms (sequential) — user sees empty page for 1.2 seconds</div>
                </div>
              )}

              {apiView === "after" && (
                <div>
                  <div style={{ fontSize: 8, color: C.textMuted, marginBottom: 8, lineHeight: 1.5 }}>Single BFF endpoint: Node.js aggregates all data server-side. Frontend makes 1 call. Gets exactly the data it needs.</div>
                  <div style={{ padding: "8px 10px", background: C.surface2, borderRadius: 6, marginBottom: 6, fontSize: 8, fontFamily: C.mono, color: C.teal }}>GET /api/products/:id/full-page</div>
                  <div style={{ fontSize: 8, color: C.textMuted, marginBottom: 6 }}>Server-side BFF runs all 5 Dynamics calls in parallel with Promise.all + caches frequently-accessed data in Redis:</div>
                  {[
                    { step: "Redis cache check",        ms: 4,   note: "Hit rate: 84%", color: C.green  },
                    { step: "Promise.all (5 Dynamics)", ms: 340, note: "Parallel not sequential", color: C.teal },
                    { step: "Transform + shape data",   ms: 8,   note: "Map to frontend contract", color: C.blue },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", background: C.surface2, borderRadius: 5, marginBottom: 4, fontSize: 8 }}>
                      <span style={{ color: r.color, fontWeight: 600 }}>{r.step}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ color: C.textMuted }}>{r.note}</span>
                        <span style={{ color: r.color, fontWeight: 700 }}>{r.ms}ms</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 6, padding: "5px 8px", background: `${C.green}10`, borderRadius: 5, fontSize: 8, color: C.green, fontWeight: 700 }}>
                    Total: 352ms (cache miss) / 12ms (cache hit) — 3.4× faster P95
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={C.green} label="BFF Pattern + UX benchmark connection — how API design improves UX scores" code={
`// BACKEND FOR FRONTEND (BFF) PATTERN:
//
// WHAT IT IS:
// A dedicated Node.js server layer that sits between the React frontend
// and the backend services (Dynamics 365, internal APIs, databases).
// Responsibility: aggregate, transform, and shape data FOR the frontend.
// Each client type (web, mobile) can have its own BFF.
//
// WHY IT IMPROVED UX BENCHMARK SCORES:
//
// UX benchmark scores measured:
// 1. Task completion rate (did user successfully buy the product?)
// 2. Time-on-task (how long to complete the purchase?)
// 3. Perceived performance (SUS survey — "the system responded quickly")
// 4. Error rate (how often did the UI show an error state?)
//
// THE PROBLEM BEFORE BFF:
// Product page: React component called 5 separate APIs in useEffect.
// Waterfall loading: each awaited the previous (sequential).
// Skeleton screens for 1.2 seconds before content appeared.
// In user testing: participants said "the page feels slow and incomplete".
// Task completion was hindered because users would click away.
// UX benchmark score: 62 / 100.
//
// HOW BFF FIXED IT:
// 1. One API call from React → one response with all page data.
//    No waterfalls. No skeleton states for 5 separate sections.
//    React renders the full page from a single Promise.
//
// 2. Data shape matches the UI component tree EXACTLY.
//    Before: frontend transformed Dynamics entity model → UI model.
//    This transformation: JavaScript on the main thread → blocking.
//    After: BFF transforms server-side. Frontend receives pre-shaped data.
//    Less client-side JS → better Interaction to Next Paint (INP).
//
// 3. Partial content on cache miss:
//    If one Dynamics call is slow: BFF returns partial data immediately
//    + streams the slow part once available.
//    Frontend: renders available data first. Fills in the rest.
//    No "blank page while 5 things load".
//
// BFF IMPLEMENTATION (Express + TypeScript):
//
// interface ProductPageDTO {
//   product:        ProductInfo;
//   pricing:        PricingInfo;
//   inventory:      InventoryStatus;
//   relatedProducts: ProductSummary[];
//   reviews:        ReviewSummary;
// }
//
// router.get('/products/:id/full-page', async (req, res) => {
//   const { id } = req.params;
//
//   // 1. Check Redis cache first:
//   const cached = await redis.get(\`product-page:\${id}\`);
//   if (cached) {
//     res.set('X-Cache', 'HIT');
//     return res.json(JSON.parse(cached));
//   }
//
//   // 2. Fetch all data in parallel (not sequential!):
//   const [product, pricing, inventory, related, reviews] = await Promise.all([
//     dynamicsClient.getProduct(id),
//     dynamicsClient.getPricing(id),
//     dynamicsClient.getInventory(id),
//     dynamicsClient.getRelated(id),
//     reviewsService.get(id),
//   ]);
//   // Parallel vs sequential: max(280,210,190,340,160)=340ms vs sum=1180ms
//
//   // 3. Transform Dynamics entities to frontend DTO:
//   const dto: ProductPageDTO = transformToDTO({ product, pricing, inventory, related, reviews });
//
//   // 4. Cache for 5 minutes:
//   await redis.setex(\`product-page:\${id}\`, 300, JSON.stringify(dto));
//
//   res.set('X-Cache', 'MISS').json(dto);
// });
//
// RESULT: UX score 62 → 81.
// Key drivers: faster perceived load time, no cascading empty states,
// fewer API errors (5 calls failing → 1 call failing = 80% less error surface),
// simpler React code (1 fetch → render, not 5 interdependent fetches).`} />
          </div>
        </div>
      )}

      {/* ── PERFORMANCE ── */}
      {tab === "perf" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>NODE.JS PERFORMANCE — 2× RPS · ½ LATENCY</div>

            {/* Live RPS meters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, color: C.textMuted, marginBottom: 4, textAlign: "center" }}>BEFORE (legacy)</div>
                <RPSMeter target={148} label="Requests/sec" color={C.red} />
              </div>
              <div style={{ display: "flex", alignItems: "center", color: C.teal, fontSize: 18, fontWeight: 900 }}>→</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, color: C.textMuted, marginBottom: 4, textAlign: "center" }}>AFTER (optimised)</div>
                <RPSMeter target={312} label="Requests/sec" color={C.green} />
              </div>
            </div>

            {/* Metrics table */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                <button onClick={() => setShowAfter(false)} style={{ fontSize: 9, background: !showAfter ? `${C.red}20` : "transparent", color: !showAfter ? C.red : C.textMuted, border: `1px solid ${!showAfter ? C.red : C.border}`, borderRadius: 5, padding: "4px 12px", cursor: "pointer" }}>Before</button>
                <button onClick={() => setShowAfter(true)} style={{ fontSize: 9, background: showAfter ? `${C.green}20` : "transparent", color: showAfter ? C.green : C.textMuted, border: `1px solid ${showAfter ? C.green : C.border}`, borderRadius: 5, padding: "4px 12px", cursor: "pointer" }}>After</button>
              </div>
              {PERF_METRICS.map(m => {
                const val  = showAfter ? m.after  : m.before;
                const comp = showAfter ? m.before : m.after;
                const pct  = Math.round(Math.abs(val - comp) / comp * 100);
                const isGood = (m.better === "higher" && val > comp) || (m.better === "lower" && val < comp);
                return (
                  <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}20` }}>
                    <span style={{ fontSize: 9, color: C.text }}>{m.label}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: showAfter && isGood ? C.green : !showAfter ? C.red : C.textMuted, fontFamily: C.mono }}>{val} {m.unit}</span>
                      {showAfter && <span style={{ fontSize: 7, color: isGood ? C.green : C.red, fontWeight: 700 }}>{isGood ? "↓" : "↑"}{pct}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optimisation pipeline */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>OPTIMISATION STEPS — click to walk through</div>
              {OPT_STEPS.map((s, i) => (
                <div key={i} onClick={() => setOptStep(i)} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "7px 8px", borderRadius: 7, marginBottom: 4, cursor: "pointer", background: optStep === i ? `${s.color}10` : "transparent", border: `1px solid ${optStep === i ? s.color + "40" : "transparent"}` }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: optStep >= i ? `${s.color}20` : C.surface2, border: `2px solid ${optStep >= i ? s.color : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: optStep >= i ? C.textBright : C.textMuted }}>{s.label}</div>
                    {optStep === i && <div style={{ fontSize: 8, color: s.color, marginTop: 2, fontWeight: 600 }}>{s.gain}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={C.orange} label="2× RPS · ½ latency — every optimisation technique used" code={
`// NODE.JS PERFORMANCE OPTIMISATION — THE FULL STORY:
//
// STARTING POINT: 148 RPS · P95 820ms · P99 1940ms
//
// STEP 1: PROFILING WITH clinic.js (find the problem, don't guess)
// "Never optimise without profiling first. Gut feeling about bottlenecks
//  is almost always wrong."
//
// clinic doctor -- node server.js
// clinic flame  -- node server.js   ← CPU flame graph
// clinic bubbleprof -- node server.js ← async operations
//
// FINDINGS:
// 1. N+1 query pattern: product listing → 50 products → 50 separate
//    SELECT queries for price data.
//    Each request: 14 DB queries. Should be: 1-3.
// 2. Synchronous JSON.stringify on large objects blocking event loop.
// 3. No connection pooling to Dynamics API (new HTTPS connection per request).
// 4. Single process: 8-core server running at 12.5% CPU utilisation.
//
// STEP 2: DataLoader pattern (N+1 → batch queries)
// import DataLoader from 'dataloader';
// const priceLoader = new DataLoader(async (productIds: readonly string[]) => {
//   // ONE query for ALL products in the batch:
//   const prices = await db.query(
//     'SELECT product_id, price FROM prices WHERE product_id = ANY($1)',
//     [productIds]
//   );
//   // Return prices in same order as productIds (DataLoader requirement):
//   return productIds.map(id => prices.find(p => p.product_id === id));
// });
//
// // In resolver: priceLoader.load(product.id)
// // DataLoader: batches all .load() calls within one tick → single query.
// // 50 products: 50 calls → 1 DB query. N+1 → N queries eliminated.
// // Result: avg queries/request: 14 → 3. DB CPU load ↓ 78%.
//
// STEP 3: Redis caching (product catalog doesn't change often)
// const getProduct = async (id: string) => {
//   const cached = await redis.get(\`product:\${id}\`);
//   if (cached) return JSON.parse(cached);                // ~4ms
//   const product = await db.getProduct(id);             // ~180ms
//   await redis.setex(\`product:\${id}\`, 300, JSON.stringify(product));
//   return product;
// };
// Cache TTL strategy:
//   Product details: 5 min (rarely change)
//   Inventory levels: 2 min (webhook invalidation on change)
//   Pricing lists: 15 min (batch pricing updates from Dynamics)
// Result: 84% cache hit rate. P95 latency on cached endpoints: 220ms → 8ms.
//
// STEP 4: Promise.all parallelisation
// // BEFORE (sequential — common mistake):
// const product   = await getProduct(id);        // 180ms
// const inventory = await getInventory(id);      // 140ms
// const pricing   = await getPricing(id);        // 120ms
// // Total: 440ms
//
// // AFTER (parallel — correct):
// const [product, inventory, pricing] = await Promise.all([
//   getProduct(id),    // \
//   getInventory(id),  //  → all 3 in parallel
//   getPricing(id),    // /
// ]);
// // Total: max(180, 140, 120) = 180ms. Saved 260ms per request.
//
// STEP 5: PM2 cluster mode (use all CPU cores)
// // ecosystem.config.js
// module.exports = {
//   apps: [{
//     name: 'ecommerce-api',
//     instances: 'max',       // spawn worker per CPU core (8 cores → 8 workers)
//     exec_mode: 'cluster',   // PM2 cluster mode — round-robin load balancing
//     max_memory_restart: '512M',
//   }],
// };
// Result: 1 core (148 RPS) → 8 cores (8 × ~150 ≈ 310 RPS)
// (Not quite 8× because of IPC overhead and shared resources)
//
// STEP 6: HTTP keep-alive + response compression
// const agent = new https.Agent({ keepAlive: true, maxSockets: 50 });
// // Reuse HTTPS connections to Dynamics API.
// // Without keep-alive: new TLS handshake per request (~120ms overhead).
// // With keep-alive: reuse existing connection (~2ms overhead).
//
// // Compression middleware:
// app.use(compression({ level: 6 }));
// // gzip/brotli API responses. JSON: ~65% size reduction.
// // Less bytes over the wire → lower latency especially on slow connections.
//
// FINAL RESULT:
// Before: 148 RPS · P95 820ms · P99 1940ms · 14 queries/req
// After:  312 RPS · P95 390ms · P99 870ms  · 3 queries/req
// 2.1× RPS · P95 latency ↓ 52% · P99 latency ↓ 55%`} />
          </div>
        </div>
      )}

      {/* ── FEATURE LEAD ── */}
      {tab === "lead" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>FEATURE BOARD — Led with Alice & Bob</div>

            {/* Kanban */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
              {(["todo", "in_progress", "review", "done"] as const).map(status => (
                <div key={status}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: TICKET_STATUS_COLOR[status], marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{status.replace("_", " ")} ({tickets.filter(t => t.status === status).length})</div>
                  {tickets.filter(t => t.status === status).map(t => (
                    <div key={t.id} style={{ background: C.surface, border: `1px solid ${t.blocked ? C.red + "50" : C.border}`, borderRadius: 7, padding: "7px 8px", marginBottom: 5 }}>
                      <div style={{ fontSize: 7, fontFamily: C.mono, color: C.textMuted, marginBottom: 3 }}>{t.id}</div>
                      <div style={{ fontSize: 8, color: C.textBright, lineHeight: 1.4, marginBottom: 4 }}>{t.title}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 7, color: C.textMuted }}>{t.assignee}</span>
                        <span style={{ fontSize: 6, color: PRIORITY_COLOR[t.priority], fontWeight: 700 }}>{t.priority.toUpperCase()}</span>
                      </div>
                      {t.blocked && <div style={{ fontSize: 7, color: C.red, marginTop: 3 }}>⛔ Blocked</div>}
                      {t.status !== "done" && (
                        <button onClick={() => moveTicket(t.id)} style={{ marginTop: 4, width: "100%", fontSize: 7, background: `${C.teal}15`, color: C.teal, border: "none", borderRadius: 4, padding: "3px 0", cursor: "pointer" }}>→ Move</button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Ambiguity framework */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, marginBottom: 6 }}>NAVIGATING AMBIGUITY — which path?</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                {[
                  { id: "spike" as const,  label: "🔍 Spike",     desc: "Unclear technical path — timeboxed research" },
                  { id: "doc"   as const,  label: "📄 Document",  desc: "Unclear requirements — write it down, get sign-off" },
                  { id: "build" as const,  label: "🏗️ Build thin", desc: "Conflicting stakeholders — build minimal, validate" },
                ].map(o => (
                  <button key={o.id} onClick={() => setAmbigMode(ambigMode === o.id ? null : o.id)} style={{ flex: 1, background: ambigMode === o.id ? `${C.purple}20` : "transparent", color: ambigMode === o.id ? C.purple : C.textMuted, border: `1px solid ${ambigMode === o.id ? C.purple : C.border}`, borderRadius: 6, padding: "6px 8px", cursor: "pointer", fontSize: 8, textAlign: "center" }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{o.label}</div>
                  </button>
                ))}
              </div>
              {ambigMode && (
                <div style={{ padding: "8px 10px", background: `${C.purple}10`, borderRadius: 7, fontSize: 8, color: C.text, lineHeight: 1.6 }}>
                  {ambigMode === "spike" && <>🔍 <strong style={{ color: C.purple }}>Timeboxed spike (1-2 days max):</strong> "We don't know if Dynamics supports real-time webhook delivery at our volume. Let's spend 2 days testing it before committing the sprint to building on it." Output: a written recommendation with data. Then decide.</>}
                  {ambigMode === "doc" && <>📄 <strong style={{ color: C.purple }}>Requirements document + sign-off:</strong> "The Dynamics integration behavior when inventory hits 0 is ambiguous. I wrote a 1-page requirements doc covering 5 edge cases. Got sign-off from product and the Dynamics team before building." Prevents rework.</>}
                  {ambigMode === "build" && <>🏗️ <strong style={{ color: C.purple }}>Build the thinnest viable slice:</strong> "When stakeholders disagreed on order confirmation UX: build both options behind a feature flag. Run for 1 week. Pick the one with better conversion." Data ends the disagreement.</>}
                </div>
              )}
            </div>

            {/* Requirement change response */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, marginBottom: 6 }}>CHANGING REQUIREMENTS — how to respond</div>
              <div style={{ fontSize: 8, color: C.textMuted, marginBottom: 8 }}>Click each step — Dynamics schema changed mid-sprint example:</div>
              {REQ_CHANGE_STEPS.map((step, i) => (
                <div key={i} onClick={() => setReqChangeStep(i)} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 8px", borderRadius: 6, marginBottom: 3, cursor: "pointer", background: reqChangeStep >= i ? `${C.teal}08` : "transparent", borderLeft: `2px solid ${reqChangeStep >= i ? C.teal : C.border}` }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: reqChangeStep >= i ? C.teal : C.textMuted, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 8, color: reqChangeStep >= i ? C.text : C.textMuted }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeSnip color={C.purple} label="Leading 3 people on ambiguous e-commerce work — the actual practices" code={
`// FEATURE LEAD ON A 3-PERSON TEAM (Me + Alice + Bob):
//
// THE ROLE OF "LEAD" ON A SMALL TEAM:
// Not a manager. Not a tech lead with 20 direct reports.
// A lead on a 3-person team:
// 1. Breaks down the feature into independently assignable tasks.
// 2. Owns the API contract between backend and frontend.
// 3. Resolves technical blockers for Alice and Bob.
// 4. Makes architectural decisions within the feature scope.
// 5. Communicates status and trade-offs to stakeholders.
// 6. Does a significant share of the implementation.
//
// HOW WE DIVIDED THE DYNAMICS INTEGRATION WORK:
// Alice: order creation flow (React checkout form + server mutation).
//        She's strongest in React and form state management.
//        I wrote the API contract she should call — she implemented the UI.
//
// Bob:   inventory sync (polling + WebSocket update to UI).
//        He's strongest in backend data pipelines.
//        I gave him the interface spec — he owned the implementation.
//
// Me:    BFF API layer (Node.js) + Dynamics auth + product catalog sync.
//        Owned the integration contract between all three pieces.
//        Also: code reviews for Alice and Bob's PRs.
//
// THE KEY PRACTICE: API CONTRACT FIRST.
// Before anyone writes implementation code:
// Write the API contract in TypeScript.
// interface CreateOrderRequest {
//   cartId:     CartId;
//   customerId: CustomerId;
//   paymentRef: string;
// }
// interface CreateOrderResponse {
//   orderId:     OrderId;
//   status:      "confirmed" | "pending_sync";
//   dynamicsRef: string | null; // null if sync is async
// }
// Alice: implements the React form that calls this shape.
// Me:    implements the Node.js endpoint that returns this shape.
// Both: can work in parallel. No blocking. No "wait for the API to be ready."
// TypeScript: if either deviates from the contract → compile error.
//
// AMBIGUITY — WHAT WE FACED:
// "The Dynamics team changed the Order entity schema 3 times in the first month.
//  OrderLine used to have a productId field.
//  After a Dynamics upgrade: it became product (nested object).
//  This broke our order write-back silently. Orders failed with 400 errors."
//
// HOW WE HANDLED IT:
// 1. Zod schemas for ALL Dynamics API responses:
//    const OrderSchema = z.object({
//      salesorderid: z.string(),
//      orderdetails: z.array(z.object({   // ← was: order_products
//        productid: z.string(),
//        quantity:  z.number(),
//        priceperunit: z.number(),
//      })),
//    });
//    When schema changed: Zod threw a validation error immediately.
//    We knew about the change within minutes of the Dynamics upgrade.
//    Not when a customer reported a broken order.
//
// 2. Compatibility layer (shim) pattern:
//    function normalizeDynamicsOrder(raw: unknown): Order {
//      const validated = OrderSchema.parse(raw);      // throws if schema mismatch
//      return {
//        id:    validated.salesorderid,
//        items: validated.orderdetails.map(d => ({    // new field name
//          productId: d.productid,
//          quantity:  d.quantity,
//          price:     d.priceperunit,
//        })),
//      };
//    }
//    The shim: only place in the codebase that knows about Dynamics' schema.
//    The rest of the codebase: uses our canonical Order type.
//    When Dynamics changes: update the shim. Nothing else changes.
//
// CHANGING REQUIREMENTS — the 6-step response framework:
// "Requirements changed 4 times during this project.
//  Two of the changes came from the Dynamics team (schema updates).
//  Two came from product (business rule changes for pricing).
//  My approach every time:"
//
// 1. ASSESS: what exactly changed? what's the blast radius?
//    grep -r "order_products\|OrderLine" src/ → find all affected files.
//    Draw the dependency graph mentally. "Only 3 files + 1 test suite."
//
// 2. COMMUNICATE: before changing a line of code:
//    Slack the team: "Dynamics changed OrderLine schema. Affects order write-back.
//    New timeline: +2 days. Here's the plan." No surprises.
//
// 3. RE-PLAN: split the requirement change into subtasks.
//    Not "rewrite everything". "EC-201: update Zod schema.
//    EC-202: update compatibility shim. EC-203: update integration test."
//
// 4. ASSIGN: the person who owns the original feature owns the update.
//    Alice owns order write-back → Alice owns the Dynamics shim update.
//    I review her PR.
//
// 5. SHIP INCREMENTALLY: shim update first (backward-compatible if possible).
//    Then UI changes. Never ship both together. Easier to debug.
//
// 6. ADD A REGRESSION TEST: the requirement change reveals a gap in tests.
//    Always add a test that would have caught this change.
//    "If a test existed for the old schema: it would have failed
//     when Dynamics upgraded. We'd have been alerted automatically.
//     After this incident: we added contract tests for all Dynamics endpoints.
//     No silent schema changes again."`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EcommerceDynamicsDemo;
