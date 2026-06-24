/**
 * AlphaTradingDemo.tsx
 *
 * Alpha Trading Web Platform — Trading Features + Performance Optimisation
 *
 * Achievements:
 *   1. Trading Features — order book, OTOCO orders, tokenised securities
 *   2. Performance     — Lighthouse 65 → 82, LCP −60% via render-blocking elimination
 *
 * TABS
 *   📊 Order Book        — real-time bid/ask depth, spread, animated price updates
 *   🔄 OTOCO Orders      — 3-leg order form, trigger + TP/SL cancel logic, visual flow
 *   🪙 Tokenised Assets  — tokenised securities vs traditional stocks, order entry
 *   ⚡ Performance       — Lighthouse gauge, LCP waterfall, render-blocking before/after
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Order Book types
// ─────────────────────────────────────────────────────────────────

interface Level { price: number; qty: number; total: number }
interface OrderBook { asks: Level[]; bids: Level[]; lastPrice: number; change: number }

const seedBook = (): OrderBook => {
  const mid = 45_000;
  const asks: Level[] = Array.from({ length: 10 }, (_, i) => {
    const price = mid + (i + 1) * 8 + Math.random() * 5;
    const qty   = parseFloat((Math.random() * 2 + 0.05).toFixed(4));
    return { price, qty, total: 0 };
  });
  const bids: Level[] = Array.from({ length: 10 }, (_, i) => {
    const price = mid - (i + 1) * 8 - Math.random() * 5;
    const qty   = parseFloat((Math.random() * 2 + 0.05).toFixed(4));
    return { price, qty, total: 0 };
  });
  let cumA = 0; asks.forEach(a => { cumA += a.qty; a.total = parseFloat(cumA.toFixed(4)); });
  let cumB = 0; bids.forEach(b => { cumB += b.qty; b.total = parseFloat(cumB.toFixed(4)); });
  return { asks, bids, lastPrice: mid, change: 1.24 };
};

const nudgeBook = (book: OrderBook): OrderBook => {
  const delta = (Math.random() - 0.5) * 20;
  const asks = book.asks.map(a => ({ ...a, price: parseFloat((a.price + delta * 0.6).toFixed(2)), qty: parseFloat((Math.max(0.01, a.qty + (Math.random() - 0.5) * 0.2)).toFixed(4)), total: 0 }));
  const bids = book.bids.map(b => ({ ...b, price: parseFloat((b.price + delta * 0.6).toFixed(2)), qty: parseFloat((Math.max(0.01, b.qty + (Math.random() - 0.5) * 0.2)).toFixed(4)), total: 0 }));
  let cumA = 0; asks.forEach(a => { cumA += a.qty; a.total = parseFloat(cumA.toFixed(4)); });
  let cumB = 0; bids.forEach(b => { cumB += b.qty; b.total = parseFloat(cumB.toFixed(4)); });
  return { asks, bids, lastPrice: parseFloat((book.lastPrice + delta).toFixed(2)), change: parseFloat((book.change + (Math.random() - 0.5) * 0.1).toFixed(2)) };
};

// ─────────────────────────────────────────────────────────────────
// OTOCO types
// ─────────────────────────────────────────────────────────────────

type OrderType = "market" | "limit" | "otoco";
type OrderSide = "buy" | "sell";
type OtocoState = "pending" | "triggered" | "tp_filled" | "sl_filled" | "cancelled";

interface OtocoOrder {
  primarySide: OrderSide;
  primaryType: "market" | "limit";
  primaryPrice: number;
  primaryQty: number;
  tpPrice: number;
  slPrice: number;
  state: OtocoState;
}

// ─────────────────────────────────────────────────────────────────
// Tokenised securities types
// ─────────────────────────────────────────────────────────────────

interface TokenAsset {
  symbol: string; name: string; underlyingExchange: string;
  tokenPrice: number; underlyingPrice: number; premium: number;
  change24h: number; volume: string; settlementCycle: string;
  blockchain: string; custodian: string;
}

const TOKEN_ASSETS: TokenAsset[] = [
  { symbol: "TSLA.T", name: "Tokenised Tesla",   underlyingExchange: "NASDAQ", tokenPrice: 247.12, underlyingPrice: 247.08, premium: 0.02, change24h: 2.34,  volume: "$4.2M", settlementCycle: "T+0", blockchain: "Ethereum", custodian: "Prime Trust"      },
  { symbol: "AAPL.T", name: "Tokenised Apple",   underlyingExchange: "NASDAQ", tokenPrice: 191.45, underlyingPrice: 191.40, premium: 0.03, change24h: 0.87,  volume: "$8.1M", settlementCycle: "T+0", blockchain: "Ethereum", custodian: "Prime Trust"      },
  { symbol: "GOLD.T", name: "Tokenised Gold",    underlyingExchange: "COMEX",  tokenPrice: 1924.80,underlyingPrice: 1924.30,premium: 0.03, change24h: -0.42, volume: "$2.7M", settlementCycle: "T+0", blockchain: "Ethereum", custodian: "Paxos"            },
  { symbol: "NVDA.T", name: "Tokenised Nvidia",  underlyingExchange: "NASDAQ", tokenPrice: 874.20, underlyingPrice: 873.95, premium: 0.03, change24h: 4.18,  volume: "$6.3M", settlementCycle: "T+0", blockchain: "Ethereum", custodian: "Prime Trust"      },
];

// ─────────────────────────────────────────────────────────────────
// Performance types
// ─────────────────────────────────────────────────────────────────

interface LighthouseCategory { label: string; before: number; after: number; icon: string; color: string }
const LH_CATS: LighthouseCategory[] = [
  { label: "Performance",     before: 65, after: 82, icon: "⚡", color: "#0ea5e9" },
  { label: "Accessibility",   before: 78, after: 91, icon: "♿", color: "#22c55e" },
  { label: "Best Practices",  before: 83, after: 92, icon: "✅", color: "#a855f7" },
  { label: "SEO",             before: 88, after: 95, icon: "🔍", color: "#f59e0b" },
];

interface BlockingResource { name: string; type: string; size: string; blockingMs: number; fixApplied: string; fixColor: string }
const BLOCKING_RESOURCES: BlockingResource[] = [
  { name: "analytics-suite.js",    type: "script", size: "180KB", blockingMs: 820, fixApplied: "Removed (unused)", fixColor: "#ef4444"   },
  { name: "intercom-widget.js",    type: "script", size: "98KB",  blockingMs: 540, fixApplied: "Deferred async",   fixColor: "#f59e0b"   },
  { name: "styles-full.css",       type: "style",  size: "340KB", blockingMs: 680, fixApplied: "Critical CSS inline + async rest", fixColor: "#22c55e" },
  { name: "google-fonts-embed.css",type: "style",  size: "28KB",  blockingMs: 420, fixApplied: "preconnect + font-display: swap", fixColor: "#0ea5e9" },
  { name: "trading-chart-lib.js",  type: "script", size: "240KB", blockingMs: 960, fixApplied: "Code split + lazy load", fixColor: "#a855f7" },
  { name: "i18n-all-locales.js",   type: "script", size: "120KB", blockingMs: 380, fixApplied: "Lazy load active locale only", fixColor: "#f97316" },
];

interface PerfTechnique { icon: string; label: string; impact: string; lcpDelta: string; color: string; detail: string }
const TECHNIQUES: PerfTechnique[] = [
  { icon: "🎨", label: "Critical CSS Inline",       impact: "Render-blocking CSS eliminated", lcpDelta: "−0.68s", color: "#22c55e", detail: "Extracted 8KB of above-fold CSS. Inlined in <head>. Async-loaded remaining 332KB." },
  { icon: "✂",  label: "Code Splitting",            impact: "Initial JS: 680KB → 120KB",      lcpDelta: "−0.94s", color: "#f59e0b", detail: "Lazy-loaded chart library (240KB). Triggered only when chart component enters viewport." },
  { icon: "🗑",  label: "Remove Unused Scripts",    impact: "180KB analytics eliminated",     lcpDelta: "−0.82s", color: "#ef4444", detail: "3 analytics scripts not in use. Each was synchronous (blocking). Removed entirely." },
  { icon: "⏩",  label: "Preload + Preconnect",     impact: "Font/LCP image discovered early", lcpDelta: "−0.31s", color: "#0ea5e9", detail: "<link rel=preload> for LCP hero. <link rel=preconnect> for Stripe and CDN domains." },
  { icon: "🔤",  label: "Font Optimisation",        impact: "No FOUT/FOIT on load",           lcpDelta: "−0.24s", color: "#a855f7", detail: "font-display: swap + WOFF2 subset. Font no longer render-blocks initial paint." },
  { icon: "💤",  label: "Lazy Load Below-fold",     impact: "Order book deferred 200ms",      lcpDelta: "−0.11s", color: "#f97316", detail: "IntersectionObserver defers order history table. Not needed for initial render." },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

const fmt = (n: number, dec = 2) => n.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 260 }}>{code}</pre>
    </div>
  );
}

function LighthouseGauge({ score, label, animate }: { score: number; label: string; animate: boolean }) {
  const color = score >= 90 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = 36; const circ = 2 * Math.PI * r;
  const dash = circ * (1 - score / 100);
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={90} height={90} viewBox="0 0 90 90" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="#1e293b" strokeWidth={8} />
        <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={circ} strokeDashoffset={animate ? dash : circ} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ marginTop: -68, fontSize: 20, fontWeight: 900, color }}>{score}</div>
      <div style={{ marginTop: 34, fontSize: 8, color: "#64748b" }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function AlphaTradingDemo() {
  const [activeTab, setActiveTab] = useState<"book" | "otoco" | "tokens" | "perf">("book");

  // ── Order Book state
  const [book, setBook]           = useState<OrderBook>(seedBook());
  const [flash, setFlash]         = useState<Record<number, "up" | "down">>({});
  const prevBookRef               = useRef(book);

  useEffect(() => {
    const id = setInterval(() => {
      setBook(prev => {
        const next = nudgeBook(prev);
        const newFlash: Record<number, "up" | "down"> = {};
        next.asks.forEach((a, i) => { if (Math.abs(a.price - prev.asks[i].price) > 5) newFlash[a.price] = a.price > prev.asks[i].price ? "up" : "down"; });
        next.bids.forEach((b, i) => { if (Math.abs(b.price - prev.bids[i].price) > 5) newFlash[b.price] = b.price > prev.bids[i].price ? "up" : "down"; });
        setTimeout(() => setFlash({}), 400);
        setFlash(newFlash);
        prevBookRef.current = next;
        return next;
      });
    }, 800);
    return () => clearInterval(id);
  }, []);

  const maxTotal = Math.max(...book.asks.map(a => a.total), ...book.bids.map(b => b.total));
  const spread   = book.asks.length > 0 && book.bids.length > 0 ? (book.asks[0].price - book.bids[0].price) : 0;

  // ── OTOCO state
  const [otoco, setOtoco] = useState<OtocoOrder>({
    primarySide: "buy", primaryType: "limit", primaryPrice: 45000, primaryQty: 0.1,
    tpPrice: 47500, slPrice: 43500, state: "pending",
  });
  const [simStep, setSimStep]   = useState<"idle" | "triggered" | "tp" | "sl">("idle");
  const [simLog, setSimLog]     = useState<string[]>([]);

  const simulateOtoco = async (outcome: "tp" | "sl") => {
    setSimStep("triggered");
    setSimLog(["→ Primary order placed (Buy 0.1 BTC @ $45,000)"]);
    await new Promise(r => setTimeout(r, 800));
    setSimLog(p => [...p, "✓ Primary order filled at $44,987 — TP and SL orders ACTIVATED"]);
    await new Promise(r => setTimeout(r, 1000));
    if (outcome === "tp") {
      setSimStep("tp");
      setSimLog(p => [...p, "✓ Take-Profit filled at $47,500 — SL order AUTOMATICALLY CANCELLED"]);
      setSimLog(p => [...p, "💰 Position closed with +$250.00 profit"]);
    } else {
      setSimStep("sl");
      setSimLog(p => [...p, "✓ Stop-Loss triggered at $43,500 — TP order AUTOMATICALLY CANCELLED"]);
      setSimLog(p => [...p, "🛡 Position closed with −$150.00 (loss capped)"]);
    }
  };

  const resetSim = () => { setSimStep("idle"); setSimLog([]); };

  // ── Tokenised assets state
  const [selectedToken, setSelectedToken]   = useState<TokenAsset>(TOKEN_ASSETS[0]);
  const [tokenQty, setTokenQty]             = useState("1");
  const [tokenOrderType, setTokenOrderType] = useState<"market" | "limit">("limit");

  // ── Performance state
  const [perfMode, setPerfMode] = useState<"before" | "after">("before");
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (activeTab === "perf") { setAnimated(false); setTimeout(() => setAnimated(true), 100); }
  }, [activeTab, perfMode]);

  const lcpBefore = 4.8; const lcpAfter = 1.9;
  const totalBlockingBefore = BLOCKING_RESOURCES.reduce((s, r) => s + r.blockingMs, 0);

  const TABS = [
    { id: "book"   as const, label: "📊 Order Book"       },
    { id: "otoco"  as const, label: "🔄 OTOCO Orders"      },
    { id: "tokens" as const, label: "🪙 Tokenised Assets"  },
    { id: "perf"   as const, label: "⚡ Performance"       },
  ];

  const simColors = { idle: "#64748b", triggered: "#f59e0b", tp: "#22c55e", sl: "#ef4444" };

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#22c55e,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📈</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Alpha Trading Web Platform</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Order Book · OTOCO Orders · Tokenised Securities · Lighthouse 65→82 · LCP −60%</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "65→82",  l: "Lighthouse Score",      c: "#22c55e", sub: "+17 points overall"                    },
            { v: "−60%",   l: "LCP Reduction",         c: "#0ea5e9", sub: "4.8s → 1.9s · render-blocking fix"    },
            { v: "OTOCO",  l: "Order Type",            c: "#f59e0b", sub: "3-leg order: trigger + TP + SL"        },
            { v: "T+0",    l: "Tokenised Settlement",  c: "#a855f7", sub: "vs T+2 for traditional stocks"         },
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

      {/* ── ORDER BOOK ── */}
      {activeTab === "book" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Order book visualization */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>ORDER BOOK — BTC/USDT</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: book.change >= 0 ? "#22c55e" : "#ef4444" }}>${fmt(book.lastPrice)}</span>
                <span style={{ fontSize: 9, color: book.change >= 0 ? "#22c55e" : "#ef4444" }}>{book.change >= 0 ? "▲" : "▼"} {Math.abs(book.change).toFixed(2)}%</span>
              </div>
            </div>

            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, padding: "4px 8px", marginBottom: 2 }}>
              {["Price (USDT)", "Qty (BTC)", "Total"].map(h => <div key={h} style={{ fontSize: 7, color: "#475569", textAlign: "right" }}>{h}</div>)}
            </div>

            {/* Asks (sells) — reversed so lowest ask is closest to mid */}
            {[...book.asks].reverse().map((ask, i) => {
              const barPct = (ask.total / maxTotal) * 100;
              const isFlash = flash[ask.price];
              return (
                <div key={i} style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, padding: "3px 8px", marginBottom: 1 }}>
                  <div style={{ position: "absolute", right: 0, top: 0, height: "100%", width: `${barPct}%`, background: "#ef444410", borderRadius: 2 }} />
                  <div style={{ fontSize: 8, fontFamily: "monospace", color: "#f87171", transition: "background 0.3s", background: isFlash === "up" ? "#22c55e30" : isFlash === "down" ? "#ef444430" : "transparent", borderRadius: 2, padding: "1px 3px" }}>{fmt(ask.price)}</div>
                  <div style={{ fontSize: 8, fontFamily: "monospace", textAlign: "right", color: "#94a3b8" }}>{ask.qty.toFixed(4)}</div>
                  <div style={{ fontSize: 8, fontFamily: "monospace", textAlign: "right", color: "#64748b" }}>{ask.total.toFixed(4)}</div>
                </div>
              );
            })}

            {/* Spread */}
            <div style={{ background: "#1e293b", padding: "5px 8px", margin: "3px 0", borderRadius: 5, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 8, color: "#64748b" }}>Spread</span>
              <span style={{ fontSize: 8, fontFamily: "monospace", color: "#f59e0b", fontWeight: 700 }}>${fmt(spread)} ({(spread / book.lastPrice * 100).toFixed(3)}%)</span>
            </div>

            {/* Bids (buys) */}
            {book.bids.map((bid, i) => {
              const barPct = (bid.total / maxTotal) * 100;
              const isFlash = flash[bid.price];
              return (
                <div key={i} style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, padding: "3px 8px", marginBottom: 1 }}>
                  <div style={{ position: "absolute", right: 0, top: 0, height: "100%", width: `${barPct}%`, background: "#22c55e10", borderRadius: 2 }} />
                  <div style={{ fontSize: 8, fontFamily: "monospace", color: "#4ade80", transition: "background 0.3s", background: isFlash === "up" ? "#22c55e30" : isFlash === "down" ? "#ef444430" : "transparent", borderRadius: 2, padding: "1px 3px" }}>{fmt(bid.price)}</div>
                  <div style={{ fontSize: 8, fontFamily: "monospace", textAlign: "right", color: "#94a3b8" }}>{bid.qty.toFixed(4)}</div>
                  <div style={{ fontSize: 8, fontFamily: "monospace", textAlign: "right", color: "#64748b" }}>{bid.total.toFixed(4)}</div>
                </div>
              );
            })}
          </div>

          {/* Code + explanation */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBlock label="Order book — WebSocket, depth rendering, flash animation" color="#22c55e" code={
`// ORDER BOOK: WHAT IT IS AND WHY IT'S HARD TO BUILD
//
// An order book: a real-time list of all open buy and sell orders
// at every price level for a trading pair.
//
// ASKS (red):  sell orders. Lowest ask at the top (closest to mid price).
//   "Someone is willing to sell 0.5 BTC at $45,008."
// BIDS (green): buy orders. Highest bid at the top (closest to mid price).
//   "Someone is willing to buy 1.2 BTC at $44,992."
// SPREAD: the gap between lowest ask and highest bid.
//   Tighter spread = more liquid market. Wider = less liquid.
//
// WHY IT'S HARD:
// 1. DATA FREQUENCY: in a liquid market, the order book updates 10-50x/second.
//    50 renders/second × React reconciliation = performance disaster without optimisation.
//
// 2. FLICKER: naive re-render — every level flickers on every update.
//    Traders: cannot read the book if it flickers constantly.
//    Fix: only re-render rows that ACTUALLY changed. React.memo + key stability.
//
// 3. DEPTH BARS: the background bar (showing cumulative volume at each level)
//    must update smoothly. CSS transition: 0.15s on width.
//    Without transition: bars jump. With: they flow.
//
// WEBSOCKET DESIGN:
// connect to the exchange WebSocket:
//   ws.send(JSON.stringify({ type: "subscribe", channel: "orderbook", symbol: "BTC/USDT" }))
//
// SNAPSHOT + DIFF protocol:
//   1. Initial message: SNAPSHOT of the entire book (all 20 levels).
//   2. Subsequent messages: DIFFS (only changed levels).
//      { bids: [[45000, 1.5]], asks: [[45012, 0]] }
//      A qty of 0: remove that price level from the book.
//   This design: minimal data over the wire. Only changes sent.
//
// LOCAL STATE: maintained in a Map<price, qty> for O(1) updates.
//   On each diff: update the Map entries. Reconstruct the sorted level list.
//   Map: much faster than re-sorting the entire array on every message.
//
// FLASH ANIMATION (price change indicator):
//   When a price level changes: apply a background flash (green if price up, red if down).
//   CSS: .flash-up { background: rgba(34, 197, 94, 0.2); transition: background 0.3s; }
//   After 300ms: remove the class. The background fades out via the transition.
//   Gives traders immediate visual feedback on market movement direction.
//
// PERFORMANCE BUDGET:
//   React.memo on each row: prevents re-rendering rows that didn't change.
//   useRef for the book Map: mutation without triggering React re-render.
//   requestAnimationFrame: batches DOM updates to the next paint cycle.
//   Result: order book renders at 60fps even during high-frequency updates.`} />
          </div>
        </div>
      )}

      {/* ── OTOCO ── */}
      {activeTab === "otoco" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* OTOCO form + simulator */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>OTOCO — ONE-TRIGGERS-ONE-CANCELS-OTHER</div>

            {/* What is OTOCO */}
            <div style={{ background: "#1e3a5f", border: "1px solid #3b82f680", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#60a5fa", marginBottom: 4 }}>What is OTOCO?</div>
              <div style={{ fontSize: 8, color: "#94a3b8", lineHeight: 1.7 }}>
                Place <strong style={{ color: "#f1f5f9" }}>3 orders simultaneously</strong>: a primary order + a take-profit + a stop-loss.
                When the primary fills → both TP and SL activate.
                When either TP or SL fills → the other is <strong style={{ color: "#f59e0b" }}>automatically cancelled</strong>.
              </div>
            </div>

            {/* 3-leg order form */}
            {/* Leg 1: Primary */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 6, position: "relative" }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900 }}>1</div>
                <div style={{ fontSize: 9, fontWeight: 700 }}>Primary Order (Trigger)</div>
                <span style={{ fontSize: 7, background: "#0ea5e920", color: "#38bdf8", borderRadius: 3, padding: "0 6px" }}>Fills first</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <div>
                  <div style={{ fontSize: 7, color: "#64748b", marginBottom: 3 }}>Side</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["buy", "sell"] as OrderSide[]).map(s => <button key={s} onClick={() => setOtoco(o => ({ ...o, primarySide: s }))} style={{ flex: 1, background: otoco.primarySide === s ? (s === "buy" ? "#22c55e20" : "#ef444420") : "#0f172a", border: `1px solid ${otoco.primarySide === s ? (s === "buy" ? "#22c55e" : "#ef4444") : "#334155"}`, borderRadius: 5, padding: "5px", cursor: "pointer", color: otoco.primarySide === s ? (s === "buy" ? "#4ade80" : "#f87171") : "#64748b", fontSize: 8, fontWeight: 700 }}>{s.toUpperCase()}</button>)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 7, color: "#64748b", marginBottom: 3 }}>Limit Price (USDT)</div>
                  <input type="number" value={otoco.primaryPrice} onChange={e => setOtoco(o => ({ ...o, primaryPrice: Number(e.target.value) }))} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 5, padding: "5px 8px", color: "#f1f5f9", fontSize: 9, boxSizing: "border-box", outline: "none" }} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <div style={{ fontSize: 7, color: "#64748b", marginBottom: 3 }}>Quantity (BTC)</div>
                  <input type="number" value={otoco.primaryQty} step="0.01" onChange={e => setOtoco(o => ({ ...o, primaryQty: Number(e.target.value) }))} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 5, padding: "5px 8px", color: "#f1f5f9", fontSize: 9, boxSizing: "border-box", outline: "none" }} />
                </div>
              </div>
            </div>

            {/* Connector */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 24, color: "#334155", fontSize: 12 }}>↓ on fill, activates both:</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
              {/* Leg 2: Take Profit */}
              <div style={{ background: "#1e293b", border: "1px solid #22c55e40", borderRadius: 10, padding: 10 }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 6 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900 }}>TP</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: "#4ade80" }}>Take Profit</div>
                </div>
                <div style={{ fontSize: 7, color: "#64748b", marginBottom: 3 }}>Price (USDT)</div>
                <input type="number" value={otoco.tpPrice} onChange={e => setOtoco(o => ({ ...o, tpPrice: Number(e.target.value) }))} style={{ width: "100%", background: "#0f172a", border: "1px solid #22c55e30", borderRadius: 5, padding: "5px 8px", color: "#4ade80", fontSize: 9, boxSizing: "border-box", outline: "none" }} />
                <div style={{ fontSize: 7, color: "#22c55e80", marginTop: 4 }}>+{(((otoco.tpPrice - otoco.primaryPrice) / otoco.primaryPrice) * 100).toFixed(1)}% from entry</div>
              </div>

              {/* Leg 3: Stop Loss */}
              <div style={{ background: "#1e293b", border: "1px solid #ef444440", borderRadius: 10, padding: 10 }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 6 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900 }}>SL</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: "#f87171" }}>Stop Loss</div>
                </div>
                <div style={{ fontSize: 7, color: "#64748b", marginBottom: 3 }}>Price (USDT)</div>
                <input type="number" value={otoco.slPrice} onChange={e => setOtoco(o => ({ ...o, slPrice: Number(e.target.value) }))} style={{ width: "100%", background: "#0f172a", border: "1px solid #ef444430", borderRadius: 5, padding: "5px 8px", color: "#f87171", fontSize: 9, boxSizing: "border-box", outline: "none" }} />
                <div style={{ fontSize: 7, color: "#ef444480", marginTop: 4 }}>{(((otoco.slPrice - otoco.primaryPrice) / otoco.primaryPrice) * 100).toFixed(1)}% from entry</div>
              </div>
            </div>

            <div style={{ fontSize: 7, color: "#475569", textAlign: "center", marginBottom: 10 }}>↑ Whichever fills first cancels the other ↑</div>

            {/* Simulation */}
            <div style={{ background: "#1e293b", border: `1px solid ${simColors[simStep]}30`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>🧪 Simulate OTOCO Execution</div>
              {simStep === "idle" ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => simulateOtoco("tp")} style={{ flex: 1, background: "#22c55e20", border: "1px solid #22c55e", borderRadius: 7, padding: "8px", cursor: "pointer", color: "#4ade80", fontSize: 9, fontWeight: 700 }}>▶ Simulate: Price hits TP</button>
                  <button onClick={() => simulateOtoco("sl")} style={{ flex: 1, background: "#ef444420", border: "1px solid #ef4444", borderRadius: 7, padding: "8px", cursor: "pointer", color: "#f87171", fontSize: 9, fontWeight: 700 }}>▶ Simulate: Price hits SL</button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
                    {simLog.map((log, i) => (
                      <div key={i} style={{ fontSize: 8, color: log.startsWith("✓") ? "#4ade80" : log.startsWith("💰") ? "#22c55e" : log.startsWith("🛡") ? "#ef4444" : "#94a3b8", fontFamily: "monospace" }}>{log}</div>
                    ))}
                  </div>
                  <button onClick={resetSim} style={{ background: "#334155", border: "1px solid #475569", borderRadius: 6, padding: "6px 14px", cursor: "pointer", color: "#94a3b8", fontSize: 8 }}>Reset</button>
                </>
              )}
            </div>
          </div>

          {/* Right: code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBlock label="OTOCO — 3-leg order logic, validation, state machine" color="#f59e0b" code={
`// OTOCO: ONE-TRIGGERS-ONE-CANCELS-OTHER
//
// WHY TRADERS WANT OTOCO:
// A trader buys BTC at $45,000. They want to:
//   a. Take profit when it hits $47,500 (+5.5%)
//   b. Cut losses if it drops to $43,500 (−3.3%)
//
// Without OTOCO:
//   After the primary order fills: manually place TP and SL.
//   Problem: if they're asleep, travelling, or in a meeting —
//   they can't react. Market moves: position unprotected.
//
// With OTOCO:
//   3 orders submitted simultaneously.
//   Primary fills: TP and SL activate AUTOMATICALLY (no human needed).
//   Either TP or SL fills first: the other AUTOMATICALLY cancels.
//   Result: position is always protected, 24/7.
//
// THE VALIDATION CHALLENGE:
// OTOCO has business rules that must be enforced:
//
// For a BUY OTOCO:
//   TP price MUST be ABOVE the primary price (take profit above entry)
//   SL price MUST be BELOW the primary price (stop loss below entry)
//   If reversed: the order would immediately trigger the wrong leg.
//
// For a SELL OTOCO (shorting):
//   TP price MUST be BELOW the primary price
//   SL price MUST be ABOVE the primary price
//
// Frontend validation:
const validateOtoco = (order: OtocoOrder): string | null => {
  if (order.primarySide === "buy") {
    if (order.tpPrice <= order.primaryPrice)
      return "Take profit must be above entry price for a buy order";
    if (order.slPrice >= order.primaryPrice)
      return "Stop loss must be below entry price for a buy order";
  } else {
    if (order.tpPrice >= order.primaryPrice)
      return "Take profit must be below entry price for a sell order";
    if (order.slPrice <= order.primaryPrice)
      return "Stop loss must be above entry price for a sell order";
  }
  if (order.primaryQty <= 0) return "Quantity must be positive";
  return null; // valid
};
//
// STATE MACHINE: the OTOCO order has 5 states:
// PENDING:    primary order submitted to exchange. Waiting to fill.
// TRIGGERED:  primary order filled. TP and SL orders now ACTIVE.
// TP_FILLED:  take-profit filled. SL automatically CANCELLED. Position closed with profit.
// SL_FILLED:  stop-loss filled. TP automatically CANCELLED. Position closed (loss capped).
// CANCELLED:  primary order cancelled before it filled. TP and SL never activated.
//
// Frontend displays different UI for each state:
//   PENDING:    show the 3-leg form. "Waiting for primary to fill."
//   TRIGGERED:  highlight the active TP and SL legs. Show live market price.
//   TP_FILLED:  green P&L display. "Profit: +$250".
//   SL_FILLED:  red P&L display. "Loss capped at −$150".
//
// THE API CONTRACT:
// POST /orders/otoco
// {
//   primary: { side: "buy", type: "limit", price: 45000, qty: 0.1 },
//   tpOrder: { side: "sell", type: "limit", price: 47500 },
//   slOrder: { side: "sell", type: "stop",  price: 43500 }
// }
//
// The exchange: atomically creates all 3 orders linked by orderId.
// Frontend: polls order status or listens on WebSocket for state transitions.
// On transition: update the local state machine. Update the UI.
//
// FRONTEND COMPLEXITY:
// The order form: conditionally shows TP/SL inputs only in OTOCO mode.
// Real-time P&L preview as user changes TP/SL prices:
//   estimatedProfit = (tpPrice - primaryPrice) × qty
//   estimatedLoss   = (primaryPrice - slPrice) × qty
// These: update live as inputs change. Helps traders visualise the trade.`} />
          </div>
        </div>
      )}

      {/* ── TOKENISED ASSETS ── */}
      {activeTab === "tokens" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Asset list + order entry */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>TOKENISED SECURITIES — REAL-TIME MARKET</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
              {TOKEN_ASSETS.map(asset => (
                <div key={asset.symbol} onClick={() => setSelectedToken(asset)} style={{ background: selectedToken.symbol === asset.symbol ? "#1e3a5f" : "#1e293b", border: `1px solid ${selectedToken.symbol === asset.symbol ? "#3b82f6" : "#334155"}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontSize: 10, fontWeight: 900, fontFamily: "monospace" }}>{asset.symbol}</span>
                        <span style={{ fontSize: 7, background: "#a855f720", color: "#c084fc", borderRadius: 3, padding: "0 6px", border: "1px solid #a855f730" }}>🔗 Tokenised</span>
                        <span style={{ fontSize: 7, color: "#64748b" }}>{asset.underlyingExchange}</span>
                      </div>
                      <div style={{ fontSize: 8, color: "#64748b" }}>{asset.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "monospace" }}>${fmt(asset.tokenPrice)}</div>
                      <div style={{ fontSize: 8, color: asset.change24h >= 0 ? "#22c55e" : "#ef4444" }}>{asset.change24h >= 0 ? "▲" : "▼"} {Math.abs(asset.change24h).toFixed(2)}%</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 5 }}>
                    {[["Settlement", asset.settlementCycle], ["24h Vol", asset.volume], ["Chain", asset.blockchain], ["Custodian", asset.custodian]].map(([k, v]) => (
                      <div key={k as string} style={{ fontSize: 6, color: "#475569" }}><span style={{ color: "#334155" }}>{k}: </span><span style={{ color: "#64748b" }}>{v}</span></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Order entry for selected token */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>Trade {selectedToken.symbol}</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                {(["limit", "market"] as const).map(t => <button key={t} onClick={() => setTokenOrderType(t)} style={{ flex: 1, background: tokenOrderType === t ? "#a855f720" : "#0f172a", border: `1px solid ${tokenOrderType === t ? "#a855f7" : "#334155"}`, borderRadius: 5, padding: "5px", cursor: "pointer", color: tokenOrderType === t ? "#c084fc" : "#64748b", fontSize: 8, fontWeight: 700 }}>{t.toUpperCase()}</button>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                {tokenOrderType === "limit" && (
                  <div>
                    <div style={{ fontSize: 7, color: "#64748b", marginBottom: 3 }}>Price (USDT)</div>
                    <input defaultValue={fmt(selectedToken.tokenPrice)} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 5, padding: "5px 8px", color: "#f1f5f9", fontSize: 9, boxSizing: "border-box", outline: "none" }} />
                  </div>
                )}
                <div style={{ gridColumn: tokenOrderType === "market" ? "span 2" : undefined }}>
                  <div style={{ fontSize: 7, color: "#64748b", marginBottom: 3 }}>Quantity (tokens)</div>
                  <input value={tokenQty} onChange={e => setTokenQty(e.target.value)} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 5, padding: "5px 8px", color: "#f1f5f9", fontSize: 9, boxSizing: "border-box", outline: "none" }} />
                </div>
              </div>
              <div style={{ background: "#0f172a", borderRadius: 6, padding: "6px 10px", marginBottom: 8, fontSize: 7, color: "#64748b" }}>
                Est. value: <span style={{ color: "#f1f5f9", fontWeight: 700 }}>${fmt(selectedToken.tokenPrice * Number(tokenQty || 0))}</span>
                <span style={{ marginLeft: 8 }}>Premium vs underlying: <span style={{ color: "#f59e0b" }}>{selectedToken.premium.toFixed(2)}%</span></span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ flex: 1, background: "#22c55e20", border: "1px solid #22c55e", borderRadius: 7, padding: "8px", cursor: "pointer", color: "#4ade80", fontSize: 9, fontWeight: 700 }}>Buy {selectedToken.symbol}</button>
                <button style={{ flex: 1, background: "#ef444420", border: "1px solid #ef4444", borderRadius: 7, padding: "8px", cursor: "pointer", color: "#f87171", fontSize: 9, fontWeight: 700 }}>Sell {selectedToken.symbol}</button>
              </div>
            </div>
          </div>

          {/* Right: code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBlock label="Tokenised securities — what they are and the frontend complexity" color="#a855f7" code={
`// TOKENISED SECURITIES: WHAT THEY ARE
//
// Traditional stock (TSLA on NASDAQ):
//   - Listed on a regulated exchange (NASDAQ)
//   - Traded during market hours (9:30 AM - 4:00 PM ET)
//   - Settlement: T+2 (you own it 2 business days after purchase)
//   - Minimum purchase: 1 share (~$247)
//   - Price feed: exchange data (NASDAQ feed)
//
// Tokenised stock (TSLA.T on Alpha Trading):
//   - A token on a blockchain (Ethereum) representing 1 TSLA share
//   - The underlying asset: held by a licensed custodian (Prime Trust)
//   - Tradeable 24/7, 365 days a year (crypto market hours)
//   - Settlement: T+0 (instant settlement on blockchain)
//   - Fractional: can buy 0.001 TSLA tokens
//   - Price feed: oracle-based (not NASDAQ feed directly)
//
// WHY THIS MATTERS FOR FRONTEND COMPLEXITY:
//
// PRICE FEEDS: two different sources
//   Traditional stocks: real-time exchange data (low latency, regulated)
//   Tokenised stocks: oracle price feeds (Chainlink, Band Protocol)
//     Oracle: aggregates prices from multiple sources, publishes on-chain.
//     Update frequency: ~30 seconds (much slower than real exchange).
//     The UI: must show BOTH prices. "Token: $247.12 | Underlying: $247.08"
//     Premium/discount: (tokenPrice - underlyingPrice) / underlyingPrice
//     Shows investors how much they pay above/below the "real" price.
//
// SETTLEMENT DISPLAY:
//   T+0 vs T+2: must be clearly communicated.
//   A trader who doesn't know expects T+2 (traditional brokerage norm).
//   If they need liquidity tomorrow: T+2 is too slow. T+0 is the advantage.
//   The frontend: prominently shows the settlement cycle per instrument.
//
// REGULATORY DISCLAIMER:
//   Tokenised securities: different regulatory framework than traditional stocks.
//   Not available in all jurisdictions.
//   Frontend: jurisdiction check on load. Users in restricted regions: see
//   "Not available in your region" instead of the order entry form.
//   Implemented via: IP geolocation + user KYC jurisdiction in JWT.
//
// ORDER ROUTING:
//   When a user buys TSLA.T: the order does NOT go to NASDAQ.
//   It goes to a liquidity pool on the Alpha Trading platform.
//   The custodian: may need to purchase the underlying TSLA share to back the token.
//   This backend complexity: completely invisible to the frontend.
//   The frontend: shows buy/sell like any other order. The routing: backend concern.
//
// CUSTODY MODEL (explained to users who ask):
//   1. User buys 1 TSLA.T token.
//   2. Alpha Trading's custodian (Prime Trust): purchases 1 TSLA share.
//   3. Prime Trust: issues 1 TSLA.T token to the user's wallet.
//   4. User: holds the token. Prime Trust: holds the underlying share in custody.
//   5. User redeems: Prime Trust sells the TSLA share, returns proceeds to user.
//   The frontend: surfaces this model in a "How does this work?" modal.
//   Trust: built by transparency. Users who understand custody: more confident.`} />
          </div>
        </div>
      )}

      {/* ── PERFORMANCE ── */}
      {activeTab === "perf" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Left: metrics */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>LIGHTHOUSE 65 → 82 · LCP −60%</div>

            <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
              {(["before", "after"] as const).map(m => (
                <button key={m} onClick={() => { setPerfMode(m); setAnimated(false); setTimeout(() => setAnimated(true), 50); }} style={{ flex: 1, background: perfMode === m ? (m === "before" ? "#ef444420" : "#22c55e20") : "#1e293b", border: `1px solid ${perfMode === m ? (m === "before" ? "#ef4444" : "#22c55e") : "#334155"}`, borderRadius: 7, padding: "7px", cursor: "pointer", color: perfMode === m ? (m === "before" ? "#f87171" : "#4ade80") : "#64748b", fontSize: 9, fontWeight: 700 }}>
                  {m === "before" ? "🔴 Before (Score: 65)" : "🟢 After (Score: 82)"}
                </button>
              ))}
            </div>

            {/* Lighthouse gauges */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                {LH_CATS.map(cat => (
                  <LighthouseGauge key={cat.label} score={perfMode === "before" ? cat.before : cat.after} label={cat.label} animate={animated} />
                ))}
              </div>
            </div>

            {/* LCP bar */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 8, fontWeight: 700 }}>LCP (Largest Contentful Paint)</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: perfMode === "after" ? "#22c55e" : "#ef4444" }}>
                  {perfMode === "before" ? lcpBefore : lcpAfter}s
                </span>
              </div>
              <div style={{ background: "#0f172a", borderRadius: 4, height: 12, overflow: "hidden", marginBottom: 4 }}>
                <div style={{ height: "100%", background: perfMode === "after" ? "#22c55e" : "#ef4444", width: animated ? `${((perfMode === "before" ? lcpBefore : lcpAfter) / lcpBefore) * 100}%` : "0%", borderRadius: 4, transition: "width 1s ease" }} />
              </div>
              {perfMode === "after" && <div style={{ fontSize: 7, color: "#4ade80" }}>↓ −{(((lcpBefore - lcpAfter) / lcpBefore) * 100).toFixed(0)}% reduction from {lcpBefore}s baseline</div>}
              <div style={{ fontSize: 7, color: "#475569", marginTop: 2 }}>Good: &lt;2.5s · Needs improvement: 2.5–4s · Poor: &gt;4s</div>
            </div>

            {/* Render-blocking resources */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6 }}>
                Render-Blocking Resources — {perfMode === "before" ? `${totalBlockingBefore}ms total blocking` : "Eliminated"}
              </div>
              {BLOCKING_RESOURCES.map(r => (
                <div key={r.name} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 7, fontFamily: "monospace", color: perfMode === "after" ? "#475569" : "#94a3b8", textDecoration: perfMode === "after" ? "line-through" : "none" }}>{r.name}</span>
                    <div style={{ display: "flex", gap: 5 }}>
                      {perfMode === "before" ? <span style={{ fontSize: 7, color: "#ef4444" }}>−{r.blockingMs}ms</span> : <span style={{ fontSize: 7, color: r.fixColor, fontWeight: 700 }}>{r.fixApplied}</span>}
                      <span style={{ fontSize: 7, color: "#475569" }}>{r.size}</span>
                    </div>
                  </div>
                  {perfMode === "before" && (
                    <div style={{ background: "#0f172a", borderRadius: 2, height: 5 }}>
                      <div style={{ height: "100%", background: "#ef4444", width: `${(r.blockingMs / 960) * 100}%`, borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: techniques + code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>OPTIMISATION TECHNIQUES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
              {TECHNIQUES.map(t => (
                <div key={t.label} style={{ background: "#1e293b", border: `1px solid ${t.color}20`, borderRadius: 7, padding: "8px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 14 }}>{t.icon}</span>
                      <span style={{ fontSize: 8, fontWeight: 700 }}>{t.label}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 7, color: "#22c55e" }}>{t.lcpDelta} LCP</div>
                      <div style={{ fontSize: 6, color: "#475569" }}>{t.impact}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 7, color: "#475569" }}>{t.detail}</div>
                </div>
              ))}
            </div>

            <CodeBlock label="Render-blocking elimination — specific techniques applied" color="#0ea5e9" code={
`// LIGHTHOUSE 65 → 82: HOW WE GOT THERE
//
// WHAT LIGHTHOUSE MEASURES (Performance score is composite):
//   FCP (First Contentful Paint):  10% weight
//   LCP (Largest Contentful Paint): 25% weight  ← biggest lever
//   TBT (Total Blocking Time):      30% weight  ← biggest lever
//   CLS (Cumulative Layout Shift):  15% weight
//   Speed Index:                    10% weight
//   TTI (Time to Interactive):      10% weight
//
// STARTING POINT — WHY SCORE WAS 65:
// Lighthouse: "Eliminate render-blocking resources"
//   analytics-suite.js: 180KB. Synchronous. 820ms blocking. NOT USED.
//   styles-full.css:    340KB. Render-blocking. Only 8KB needed above-fold.
//   trading-chart-lib:  240KB. Loaded upfront. Not visible until scroll.
//   i18n-all-locales:   120KB. ALL 12 language files, loaded for every user.
//
// STEP 1: REMOVE UNUSED SCRIPTS (biggest single win)
// Found: 3 analytics/tracking scripts from a previous vendor contract.
// Contract: ended. Scripts: still in the HTML. Nobody noticed.
// Each: synchronous (no defer, no async). Browser: stopped rendering to execute.
// Removed: 180KB + 2 smaller scripts (98KB combined). Total: 280KB eliminated.
// LCP impact: −820ms (the largest blocking script was on the critical path).
//
// STEP 2: CRITICAL CSS INLINING
// Full stylesheet: 340KB. Render-blocking.
// Above-fold CSS audit: only 8KB of the 340KB was needed for initial render.
// Fix:
//   <style>/* 8KB critical */ .header, .hero, .price-display... */</style>
//   <link rel="stylesheet" href="styles.css" media="print"
//         onload="this.media='all'">
//
// The onload trick: "media=print" → browser fetches but doesn't block render.
// After load → media changes to "all" → styles applied. Non-blocking.
//
// STEP 3: CODE SPLITTING — CHART LIBRARY
// trading-chart-lib.js: 240KB. Used only for the TradingView chart.
// The chart: rendered 400px below the fold. Not needed for initial paint.
// Fix:
//   const TradingChart = React.lazy(() => import("./TradingChart"));
//   // Inside TradingChart.tsx:
//   import("trading-chart-lib").then(lib => { /* initialise chart */ });
//
// IntersectionObserver: import triggered when chart container is 100px from viewport.
// Initial bundle: −240KB. LCP: −940ms (JS parsing no longer blocks paint).
//
// STEP 4: PRELOAD + PRECONNECT
// The hero element (Largest Contentful Paint): the live price ticker component.
// It needed: Inter font (loaded via Google Fonts) + a CSS file.
// Before: browser discovered the font AFTER parsing CSS (3 steps: HTML → CSS → @font-face).
// Fix:
//   <link rel="preconnect" href="https://fonts.googleapis.com">
//   <link rel="preload" href="/fonts/inter-var.woff2" as="font" crossorigin>
//
// "preconnect": establishes the TCP/TLS connection early. No time wasted when the request fires.
// "preload": browser fetches the font during HTML parse. No waiting for CSS parsing.
// LCP impact: −310ms.
//
// WHY 82 AND NOT 90+:
// The trading chart library (even with lazy loading): still affects TBT.
// The WebSocket connection for the order book: JavaScript execution on load.
// These: inherent to the product. Cannot remove them.
// 82: the practical ceiling given the product's requirements.
// "A performance score is a trade-off. 82 on a trading platform that has
//  a real-time order book and live WebSocket feeds: actually very good."`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default AlphaTradingDemo;
