/**
 * SeaMoneyDemo.tsx
 *
 * Shopee | SeaMoney — Digital Bank
 * Four engineering achievements:
 *   1. Homepage state calls: 600 → 60   (Zustand + native storage, 100K users)
 *   2. CV asset pipeline                (30+ engineers, −7% app size, zero collisions)
 *   3. CLS 0.1 → 0                     (layout shift elimination, mis-tap prevention)
 *   4. Credit card vertical             (cross-functional coordination)
 *
 * TABS
 *   🏠 State Architecture  — call counter animation, persistent store demo, OxygenOS sim
 *   🖼 Asset Pipeline      — upload → hash → collision detect → size reduction
 *   📐 CLS & Credit Card   — before/after layout shift, cross-team delivery board
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// State Architecture data
// ─────────────────────────────────────────────────────────────────

interface HomepageSection {
  id: string; name: string; icon: string;
  callsBefore: number; callsAfter: number;
  source: "api" | "cache"; loaded: boolean; color: string;
}

const SECTIONS: HomepageSection[] = [
  { id: "s1", name: "Wallet Balance",       icon: "💰", callsBefore: 120, callsAfter: 1,  source: "cache", loaded: false, color: "#0ea5e9" },
  { id: "s2", name: "Promotions Carousel",  icon: "🎁", callsBefore: 80,  callsAfter: 10, source: "api",   loaded: false, color: "#a855f7" },
  { id: "s3", name: "Credit Card Section",  icon: "💳", callsBefore: 90,  callsAfter: 5,  source: "cache", loaded: false, color: "#22c55e" },
  { id: "s4", name: "Transaction History",  icon: "📋", callsBefore: 100, callsAfter: 20, source: "api",   loaded: false, color: "#f59e0b" },
  { id: "s5", name: "Quick Actions Grid",   icon: "⚡", callsBefore: 60,  callsAfter: 1,  source: "cache", loaded: false, color: "#ef4444" },
  { id: "s6", name: "Offers & Rewards",     icon: "🏆", callsBefore: 80,  callsAfter: 15, source: "api",   loaded: false, color: "#10b981" },
  { id: "s7", name: "Nearby Merchants",     icon: "📍", callsBefore: 70,  callsAfter: 8,  source: "api",   loaded: false, color: "#6366f1" },
];

const TOTAL_BEFORE = SECTIONS.reduce((s, x) => s + x.callsBefore, 0);
const TOTAL_AFTER  = SECTIONS.reduce((s, x) => s + x.callsAfter, 0);

// ─────────────────────────────────────────────────────────────────
// Asset pipeline data
// ─────────────────────────────────────────────────────────────────

interface AssetEntry { name: string; size: number; hash: string; used: number }
const ASSET_CATALOG: AssetEntry[] = [
  { name: "ic_share.png",        size: 8420,  hash: "a3f9e2",  used: 12 },
  { name: "ic_transfer.png",     size: 12300, hash: "b7c4d1",  used: 34 },
  { name: "ic_card.png",         size: 6800,  hash: "c2a8f5",  used: 18 },
  { name: "ic_wallet.png",       size: 9100,  hash: "d5e3b9",  used: 47 },
  { name: "ic_notification.png", size: 7600,  hash: "e1f7a2",  used: 8  },
  { name: "banner_promo.png",    size: 48200, hash: "f3c9d4",  used: 3  },
  { name: "ic_home.png",         size: 5400,  hash: "a7b2e6",  used: 22 },
];

type PipelineStep = "idle" | "uploading" | "hashing" | "collision-check" | "collision-found" | "compress" | "register" | "done";

// ─────────────────────────────────────────────────────────────────
// CLS data
// ─────────────────────────────────────────────────────────────────

interface CrossFuncTeam { name: string; role: string; status: "done" | "in-progress" | "blocked" | "todo"; deliverable: string }
const CREDIT_CARD_TEAMS: CrossFuncTeam[] = [
  { name: "Product",   role: "PRD & Requirements",    status: "done",        deliverable: "Feature spec, KPIs, acceptance criteria" },
  { name: "Design",    role: "UI/UX Mockups",         status: "done",        deliverable: "Figma flows: card display, flip animation, limit widget" },
  { name: "Backend",   role: "API design",            status: "done",        deliverable: "REST contracts: /card/info, /card/transactions, /card/pay" },
  { name: "Frontend",  role: "RN Implementation",     status: "in-progress", deliverable: "Card screen, flip anim, MSW mocks (unblocked from backend)" },
  { name: "QA",        role: "Test plan",             status: "in-progress", deliverable: "E2E: Detox scripts for card tap-to-pay, limit display" },
  { name: "Leadership",role: "Sign-off",              status: "todo",        deliverable: "Stakeholder demo: Android + iOS side-by-side" },
];

// ─────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 280 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function SeaMoneyDemo() {
  const [activeTab, setActiveTab] = useState<"state" | "pipeline" | "cls">("state");

  // ── State Architecture
  const [simMode, setSimMode]           = useState<"before" | "after">("before");
  const [sections, setSections]         = useState<HomepageSection[]>(SECTIONS.map(s => ({ ...s, loaded: false })));
  const [simRunning, setSimRunning]     = useState(false);
  const [totalCalls, setTotalCalls]     = useState(0);
  const [oxygenKill, setOxygenKill]     = useState(false);
  const simRef = useRef(false);

  const runSim = useCallback(async (mode: "before" | "after") => {
    if (simRef.current) return;
    simRef.current = true;
    setSimRunning(true); setOxygenKill(false);
    setSections(SECTIONS.map(s => ({ ...s, loaded: false })));
    setTotalCalls(0);

    let calls = 0;
    for (let i = 0; i < SECTIONS.length; i++) {
      const sec = SECTIONS[i];
      const c = mode === "before" ? sec.callsBefore : sec.callsAfter;
      calls += c;
      setTotalCalls(calls);

      // Simulate OxygenOS kill in "before" mode at high call count
      if (mode === "before" && calls >= 450 && !oxygenKill) {
        setOxygenKill(true);
        setSections(prev => prev.map((s, idx) => ({ ...s, loaded: idx < 4 })));
        await new Promise(r => setTimeout(r, 1200));
        setSimRunning(false); simRef.current = false; return;
      }

      await new Promise(r => setTimeout(r, mode === "before" ? 160 : 80));
      setSections(prev => prev.map((s, idx) => idx === i ? { ...s, loaded: true, source: mode === "after" ? s.source : "api" } : s));
    }
    setSimRunning(false); simRef.current = false;
  }, []);

  const handleSim = (mode: "before" | "after") => { setSimMode(mode); runSim(mode); };

  // ── Asset Pipeline
  const [fileName, setFileName]           = useState("ic_share_new.png");
  const [pipelineStep, setPipelineStep]   = useState<PipelineStep>("idle");
  const [pipelineLog, setPipelineLog]     = useState<string[]>([]);
  const [collisionWith, setCollisionWith] = useState<AssetEntry | null>(null);
  const [isUnique, setIsUnique]           = useState(true);
  const [appSizeBefore, setAppSizeBefore] = useState(100);
  const [appSizeAfter, setAppSizeAfter]   = useState<number | null>(null);
  const pipeRef = useRef(false);

  const log = (msg: string) => setPipelineLog(prev => [...prev, msg]);

  const runPipeline = useCallback(async (name: string) => {
    if (pipeRef.current) return;
    pipeRef.current = true;
    setPipelineStep("idle"); setPipelineLog([]); setCollisionWith(null); setAppSizeAfter(null);

    // Check if it's a collision scenario
    const isCollision = name.toLowerCase().includes("share") || name.toLowerCase().includes("transfer");
    const collidingAsset = isCollision ? ASSET_CATALOG.find(a => name.toLowerCase().includes(a.name.replace("ic_","").replace(".png",""))) || null : null;
    setIsUnique(!isCollision);

    await new Promise(r => setTimeout(r, 300)); setPipelineStep("uploading");
    log(`📤 Receiving asset: ${name}`);

    await new Promise(r => setTimeout(r, 600)); setPipelineStep("hashing");
    const hash = isCollision && collidingAsset ? collidingAsset.hash : `x${Math.random().toString(36).slice(2,8)}`;
    log(`🔑 Perceptual hash (pHash): ${hash}`);
    log(`   Algorithm: dHash 64-bit fingerprint from 9×8 gradient matrix`);

    await new Promise(r => setTimeout(r, 700)); setPipelineStep("collision-check");
    log(`🔍 Checking ${ASSET_CATALOG.length} catalog entries for collision...`);

    await new Promise(r => setTimeout(r, 800));
    if (isCollision && collidingAsset) {
      setPipelineStep("collision-found");
      setCollisionWith(collidingAsset);
      log(`🚨 COLLISION DETECTED: ${collidingAsset.name} (similarity 96%)`);
      log(`   Used in ${collidingAsset.used} screens. Rejecting new asset.`);
      pipeRef.current = false; return;
    }

    setPipelineStep("compress");
    log(`✅ No collision found. Proceeding.`);
    log(`🗜 Compressing: lossless PNG optimization + WebP generation`);
    await new Promise(r => setTimeout(r, 700));
    log(`   Original: 18.4KB → Compressed: 8.2KB (−55%)`);

    setPipelineStep("register");
    await new Promise(r => setTimeout(r, 500));
    log(`📝 Registering in asset catalog...`);
    log(`   Hash: ${hash} · Name: ${name} · Screens: 0`);

    setPipelineStep("done");
    setAppSizeAfter(appSizeBefore - 0.3);
    log(`✅ Done! Asset registered. Bundle delta: −0.3 MB`);
    pipeRef.current = false;
  }, [appSizeBefore]);

  // ── CLS Demo
  const [clsMode, setClsMode]       = useState<"before" | "after">("before");
  const [clsShifting, setClsShifting] = useState(false);
  const [misTap, setMisTap]         = useState(false);
  const [clsRunning, setClsRunning] = useState(false);
  const [skeletonVisible, setSkeletonVisible] = useState(false);
  const clsRef = useRef(false);

  const runCLS = useCallback(async (mode: "before" | "after") => {
    if (clsRef.current) return;
    clsRef.current = true;
    setClsRunning(true); setClsShifting(false); setMisTap(false); setSkeletonVisible(false);
    if (mode === "before") {
      setClsShifting(true);
      await new Promise(r => setTimeout(r, 1200));
      setMisTap(true);
    } else {
      setSkeletonVisible(true);
      await new Promise(r => setTimeout(r, 800));
      setSkeletonVisible(false);
    }
    setClsRunning(false); clsRef.current = false;
  }, []);

  const TABS = [
    { id: "state"    as const, label: "🏠 State Architecture"  },
    { id: "pipeline" as const, label: "🖼 Asset Pipeline"       },
    { id: "cls"      as const, label: "📐 CLS & Credit Card"    },
  ];

  const statusColor = (s: CrossFuncTeam["status"]) =>
    s === "done" ? "#22c55e" : s === "in-progress" ? "#0ea5e9" : s === "blocked" ? "#ef4444" : "#475569";

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#ee4d2d,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🦅</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Shopee | SeaMoney — Digital Bank</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>React Native · TypeScript · Android/iOS · Node.js · FinTech · Digital Banking</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "600→60",  l: "Homepage State Calls", c: "#ee4d2d", sub: "−90% · ~100K users impacted"       },
            { v: "30+",     l: "Engineers Using Pipeline", c: "#f59e0b", sub: "CV asset pipeline, daily use" },
            { v: "−7%",     l: "App Size Reduction",    c: "#22c55e", sub: "Zero collision incidents"          },
            { v: "CLS 0",   l: "Layout Shift Eliminated",c: "#0ea5e9", sub: "0.1 → 0, zero mis-taps"           },
          ].map(m => (
            <div key={m.l} style={{ background: "#1e293b", border: `1px solid ${m.c}20`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 9, fontWeight: 700 }}>{m.l}</div>
              <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#1e293b" : "transparent", color: activeTab === tab.id ? "#f1f5f9" : "#64748b", border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── STATE ARCHITECTURE ── */}
      {activeTab === "state" && (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14 }}>
          {/* Phone simulator */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>HOMEPAGE LOAD SIMULATION</div>

            {/* Mode selector */}
            <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
              {(["before", "after"] as const).map(m => (
                <button key={m} onClick={() => handleSim(m)} disabled={simRunning} style={{ flex: 1, background: simMode === m && !simRunning ? (m === "before" ? "#ef444420" : "#22c55e20") : "#1e293b", border: `1px solid ${simMode === m ? (m === "before" ? "#ef4444" : "#22c55e") : "#334155"}`, borderRadius: 6, padding: "6px", cursor: simRunning ? "not-allowed" : "pointer", color: simMode === m ? (m === "before" ? "#f87171" : "#4ade80") : "#64748b", fontSize: 9, fontWeight: 700 }}>
                  {m === "before" ? "🔴 Before (600 calls)" : "🟢 After (60 calls)"}
                </button>
              ))}
            </div>

            {/* Call counter */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 8, color: "#64748b" }}>API calls fired</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: totalCalls > 300 ? "#ef4444" : "#22c55e" }}>{totalCalls}</div>
              </div>
              <div style={{ background: "#0f172a", borderRadius: 4, height: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", background: totalCalls > 300 ? "#ef4444" : "#22c55e", width: `${Math.min((totalCalls / TOTAL_BEFORE) * 100, 100)}%`, transition: "width 0.15s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: "#475569", marginTop: 3 }}>
                <span>0</span><span style={{ color: "#ef4444" }}>600 (before)</span>
              </div>
            </div>

            {/* OxygenOS kill warning */}
            {oxygenKill && (
              <div style={{ background: "#ef444420", border: "1px solid #ef4444", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#f87171" }}>⚠ OxygenOS Memory Manager</div>
                <div style={{ fontSize: 8, color: "#fca5a5", marginTop: 3 }}>Background process killed at 450+ concurrent calls. Homepage loading incomplete — 3 of 7 sections failed to load.</div>
                <div style={{ fontSize: 7, color: "#475569", marginTop: 3 }}>~100,000 users on OnePlus/OxygenOS devices experienced this daily.</div>
              </div>
            )}

            {/* Section pills */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {sections.map(s => {
                const loadFailed = oxygenKill && !s.loaded;
                return (
                  <div key={s.id} style={{ background: s.loaded ? s.color + "15" : "#1e293b", border: `1px solid ${s.loaded ? s.color + "40" : "#334155"}`, borderRadius: 7, padding: "6px 9px", display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s", opacity: loadFailed ? 0.4 : 1 }}>
                    <span style={{ fontSize: 12 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 8, fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: 7, color: "#475569" }}>
                        {simMode === "before" ? `${s.callsBefore} calls · API` : `${s.callsAfter} calls · ${s.source === "cache" ? "💾 Cache hit" : "📡 API (stale)"}`}
                      </div>
                    </div>
                    <div style={{ fontSize: 8, color: s.loaded ? s.color : loadFailed ? "#ef4444" : "#475569" }}>
                      {s.loaded ? "✓" : loadFailed ? "✗" : simRunning ? "…" : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Architecture + code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              PERSISTENT ZUSTAND + NATIVE STORAGE ARCHITECTURE
            </div>

            {/* Architecture diagram */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 8 }}>Data flow — before vs. after</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "BEFORE", color: "#ef4444", items: ["App launch", "Each component mounts", "Each component calls API independently", "7 sections × ~85 calls each = 600 calls", "Memory-constrained device (OxygenOS)", "Background process killed mid-load", "Incomplete homepage for ~100K users"] },
                  { label: "AFTER", color: "#22c55e", items: ["App launch", "Zustand hydrates from MMKV (sync, instant)", "Homepage renders with cached data immediately", "Background: staleness check (TTL per section)", "Only STALE sections make API calls (≤60 total)", "OxygenOS: can't kill completed render", "100% complete homepage"] },
                ].map(col => (
                  <div key={col.label}>
                    <div style={{ fontSize: 8, fontWeight: 800, color: col.color, marginBottom: 5 }}>{col.label}</div>
                    {col.items.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                        <span style={{ color: col.color, fontSize: 7 }}>{i + 1}.</span>
                        <span style={{ fontSize: 7, color: i >= 4 ? col.color : "#94a3b8", fontWeight: i >= 5 ? 700 : 400 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <CodeBlock label="Zustand + MMKV persistent store — architecture" color="#0ea5e9" code={
`// WHY THE PROBLEM EXISTED:
// Each homepage section: a separate React component.
// Each component: called its own API on mount.
// 7 sections × ~85 calls each = 600 API calls on every homepage load.
// 
// ON MEMORY-CONSTRAINED ANDROID (OxygenOS / ColorOS / MIUI):
// These Android skins have aggressive memory managers.
// OxygenOS: kills background processes when RAM < threshold.
// 600 concurrent API calls → high memory pressure → process killed.
// Result: 3-4 sections load, 3-4 fail silently. Incomplete homepage.
// Users see: blank cards, missing balances, absent quick actions.
// ~100,000 users on mid-range OnePlus/Oppo devices hit this daily.
//
// THE SOLUTION: PERSISTENT ZUSTAND STORE + MMKV
//
// MMKV (vs AsyncStorage):
// AsyncStorage: JavaScript thread, async, slow (~10ms per read).
// MMKV: native C++ key-value store, synchronous reads, ~0.1ms per read.
// On app launch: MMKV provides data SYNCHRONOUSLY.
// Zustand hydrates BEFORE the first React render.
// Homepage renders with data immediately. No blank state. No API calls needed.
//
// STALENESS STRATEGY (TTL per section):
// walletStore:    TTL 30s  (balance changes frequently)
// promoStore:     TTL 300s (promotions change every 5 minutes)
// cardStore:      TTL 60s  (card limit/usage updated per transaction)
// transactionStore: TTL 15s (user wants fresh data)
// quickActionsStore: TTL 3600s (static configuration)
//
// On app launch:
// const isStale = (lastFetched: number, ttl: number) =>
//   Date.now() - lastFetched > ttl * 1000;
//
// Each store: checks staleness in background AFTER render.
// If stale: one API call for that section. Update store. Re-render (cached diff).
// If fresh: NO API call.
//
// Result: 600 calls (all fresh, every mount) → 60 calls (only stale sections).
// OxygenOS: render completes before background staleness checks even start.
// Process kill risk: eliminated.`} />

              <CodeBlock label="MMKV integration + Zustand persist middleware" color="#22c55e" code={
`// MMKV SETUP (react-native-mmkv):
import { MMKV } from "react-native-mmkv";
const storage = new MMKV({ id: "seamoney-store" });

// MMKV adapter for Zustand persist middleware:
const mmkvStorage = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
};
// Note: getItem is SYNCHRONOUS (vs AsyncStorage which is async).
// This is the key: Zustand can hydrate BEFORE first render.

// WALLET STORE (with TTL staleness detection):
interface WalletState {
  balance: number;
  currency: string;
  lastFetched: number;
  isLoading: boolean;
  fetchIfStale: () => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      currency: "SGD",
      lastFetched: 0,
      isLoading: false,
      fetchIfStale: async () => {
        const { lastFetched } = get();
        const WALLET_TTL_MS = 30_000;
        if (Date.now() - lastFetched < WALLET_TTL_MS) return; // still fresh
        set({ isLoading: true });
        const data = await walletAPI.getBalance();
        set({ balance: data.balance, lastFetched: Date.now(), isLoading: false });
      },
    }),
    {
      name: "wallet-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// HOMEPAGE COMPONENT: render cached data instantly, refresh in background:
function WalletCard() {
  const { balance, isLoading, fetchIfStale } = useWalletStore();
  useEffect(() => {
    // NON-BLOCKING: runs after render, doesn't delay paint
    fetchIfStale();
  }, []);
  // Renders immediately with cached balance (no loading state on first render).
  // If stale: balance updates in background. User sees instant content.
  return <Text>{isLoading ? balance : balance} SGD</Text>;
}`} />
            </div>
          </div>
        </div>
      )}

      {/* ── ASSET PIPELINE ── */}
      {activeTab === "pipeline" && (
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 14 }}>
          {/* Pipeline simulator */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              CV ASSET PIPELINE — LIVE SIMULATOR
            </div>

            {/* Scenario buttons */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>Test scenarios:</div>
              <div style={{ display: "flex", gap: 5 }}>
                {[
                  { label: "🚨 Duplicate (collision)", file: "ic_share_v2.png" },
                  { label: "✅ New unique asset",       file: "ic_payment_qr.png" },
                ].map(s => (
                  <button key={s.file} onClick={() => { setFileName(s.file); setPipelineStep("idle"); setPipelineLog([]); setCollisionWith(null); setAppSizeAfter(null); }} style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "#94a3b8", fontSize: 8 }}>{s.label}</button>
                ))}
              </div>
            </div>

            {/* File input */}
            <div style={{ background: "#1e293b", border: "2px dashed #334155", borderRadius: 10, padding: 12, marginBottom: 8, textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>📄</div>
              <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 2 }}>{fileName}</div>
              <div style={{ fontSize: 7, color: "#64748b", marginBottom: 8 }}>PNG asset being committed by a frontend engineer</div>
              <button onClick={() => runPipeline(fileName)} disabled={pipelineStep !== "idle" && pipelineStep !== "done" && pipelineStep !== "collision-found"} style={{ background: "#0066ff20", border: "1px solid #3b82f6", borderRadius: 6, padding: "6px 16px", color: "#60a5fa", cursor: "pointer", fontSize: 9, fontWeight: 700 }}>
                ▶ Run Pipeline
              </button>
            </div>

            {/* Steps */}
            {[
              { step: "uploading",        label: "Receive asset",        icon: "📤" },
              { step: "hashing",          label: "Compute pHash",        icon: "🔑" },
              { step: "collision-check",  label: "Collision detection",  icon: "🔍" },
              { step: "compress",         label: "Compress & optimise",  icon: "🗜" },
              { step: "register",         label: "Register in catalog",  icon: "📝" },
              { step: "done",             label: "Complete",             icon: "✅" },
            ].map(s => {
              const steps = ["uploading","hashing","collision-check","compress","register","done"];
              const collisionSteps = ["uploading","hashing","collision-check","collision-found"];
              const currentIdx = pipelineStep === "collision-found" ? collisionSteps.indexOf("collision-found") : steps.indexOf(pipelineStep);
              const thisIdx = steps.indexOf(s.step);
              const done = currentIdx > thisIdx || (pipelineStep === "done" && s.step !== "done") || pipelineStep === "done";
              const active = s.step === pipelineStep || (s.step === "collision-check" && pipelineStep === "collision-found");
              return (
                <div key={s.step} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5, opacity: thisIdx > currentIdx + 1 ? 0.3 : 1 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: pipelineStep === "collision-found" && s.step === "collision-check" ? "#ef444420" : done ? "#22c55e20" : active ? "#0066ff20" : "#1e293b", border: `1px solid ${pipelineStep === "collision-found" && s.step === "collision-check" ? "#ef4444" : done ? "#22c55e" : active ? "#0066ff" : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>
                    {done ? "✓" : active ? s.icon : s.icon}
                  </div>
                  <div style={{ fontSize: 9, color: done ? "#22c55e" : active ? "#60a5fa" : "#475569" }}>{s.label}</div>
                  {s.step === "collision-check" && pipelineStep === "collision-found" && <span style={{ fontSize: 7, background: "#ef444420", color: "#f87171", borderRadius: 3, padding: "0 5px" }}>🚨 BLOCKED</span>}
                </div>
              );
            })}

            {/* Collision result */}
            {pipelineStep === "collision-found" && collisionWith && (
              <div style={{ marginTop: 8, background: "#ef444415", border: "1px solid #ef4444", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#f87171" }}>🚨 Collision Detected</div>
                <div style={{ fontSize: 8, color: "#fca5a5", marginTop: 3 }}>Asset <strong>{fileName}</strong> is 96% similar to:</div>
                <div style={{ background: "#0f172a", borderRadius: 5, padding: "5px 8px", marginTop: 5 }}>
                  <div style={{ fontSize: 8, fontWeight: 700 }}>{collisionWith.name}</div>
                  <div style={{ fontSize: 7, color: "#64748b" }}>Used in {collisionWith.used} screens · pHash: {collisionWith.hash}</div>
                </div>
                <div style={{ fontSize: 7, color: "#475569", marginTop: 5 }}>✓ Prevented: wrong icon in production · Prevented: app size bloat</div>
              </div>
            )}

            {/* Size */}
            {appSizeAfter !== null && (
              <div style={{ marginTop: 8, background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 8, padding: 8, display: "flex", justifyContent: "space-between" }}>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 7, color: "#64748b" }}>App bundle</div><div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444" }}>{appSizeBefore}MB</div></div>
                <div style={{ color: "#22c55e", alignSelf: "center" }}>→</div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 7, color: "#64748b" }}>After pipeline</div><div style={{ fontSize: 11, fontWeight: 800, color: "#22c55e" }}>{appSizeAfter.toFixed(1)}MB</div></div>
              </div>
            )}
          </div>

          {/* Log + code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>PIPELINE LOG + ARCHITECTURE</div>

            {/* Log output */}
            <div style={{ background: "#0a0a14", border: "1px solid #1e293b", borderRadius: 8, padding: 12, marginBottom: 10, minHeight: 80, fontFamily: "monospace", fontSize: 8, color: "#94a3b8", lineHeight: 1.8 }}>
              {pipelineLog.length === 0 ? <div style={{ color: "#334155" }}>Run the pipeline to see logs...</div> : pipelineLog.map((l, i) => (
                <div key={i} style={{ color: l.includes("🚨") ? "#f87171" : l.includes("✅") ? "#4ade80" : l.startsWith("   ") ? "#64748b" : "#94a3b8" }}>{l}</div>
              ))}
            </div>

            {/* Catalog */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 6 }}>📦 Asset Catalog ({ASSET_CATALOG.length} registered)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {ASSET_CATALOG.map(a => (
                  <div key={a.name} style={{ background: "#0f172a", borderRadius: 6, padding: "5px 8px", display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 7, fontFamily: "monospace", color: "#94a3b8" }}>{a.name}</div>
                    <div style={{ fontSize: 7, color: "#475569" }}>{a.used} screens</div>
                  </div>
                ))}
              </div>
            </div>

            <CodeBlock label="CV asset pipeline — perceptual hashing + collision detection" color="#f59e0b" code={
`// THE PROBLEM: 30+ frontend engineers adding image assets to a shared RN app.
//
// IMAGE COLLISION SCENARIO:
// Engineer A adds "ic_share.png" (32×32, orange Shopee share icon) to the project.
// 2 weeks later, Engineer B adds "ic_share.png" (24×24, blue generic share icon).
// Result: Engineer B's file silently overwrites Engineer A's.
// 12 screens that used "ic_share" now show the wrong icon in production.
// Detected only AFTER release. Requires a hotfix deploy.
//
// DUPLICATE STORAGE SCENARIO:
// Engineer C adds "share_button.png" — identical content to "ic_share.png" but different name.
// Both files exist. Same pixels stored twice. App bundle grows unnecessarily.
// After 2 years: 300+ duplicate/near-duplicate images accumulated.
// Pre-pipeline app size: inflated by ~7%.
//
// THE SOLUTION: COMPUTER VISION ASSET PIPELINE
// Runs as a Git pre-commit hook. Engineers cannot bypass it.
//
// STEP 1: PERCEPTUAL HASH (pHash):
// NOT a cryptographic hash (SHA256): detects byte-level changes.
// A 1-pixel crop or recompression → completely different SHA256.
// pHash: a 64-bit fingerprint of the IMAGE'S VISUAL CONTENT.
// Algorithm: dHash (difference hash)
//   1. Resize image to 9×8 pixels (regardless of original size)
//   2. Convert to grayscale
//   3. For each row: compare adjacent pixels (left vs right)
//   4. If left is brighter than right: bit = 1. Else: bit = 0.
//   5. Result: 64-bit binary string = pHash
//
// Same visual image (different file size, different compression): SAME pHash.
// Different visual image: different pHash.
// Hamming distance between two pHashes: visual similarity metric.
// Hamming distance 0: identical. < 5: very similar. > 10: distinct.
//
// STEP 2: COLLISION DETECTION:
// Compare incoming pHash against all 300+ catalog entries.
// Hamming(incomingHash, existingHash) <= 3: COLLISION. Reject.
// Hamming(incomingHash, existingHash) <= 8: WARN. Engineer reviews.
// Hamming > 8: proceed.
//
// STEP 3: LOSSLESS COMPRESSION:
// PNG: pngcrush + optipng → lossless size reduction (typically 15-40%).
// WebP generation: for React Native's Image component (smaller than PNG).
// Explicit width/height metadata: prevents CLS on first render.
//
// STEP 4: CATALOG REGISTRATION:
// JSON registry: { hash, filename, dimensions, usedInScreens[], addedBy, timestamp }
// Committed to the repository.
// Enables: "which screens use ic_share?" → instant answer.
// Enables: unused asset detection (usedInScreens.length === 0 → candidate for removal).
//
// RESULT:
// Zero collision incidents in 12 months after pipeline launch.
// 300+ duplicate images removed: −7% app bundle size.
// 30+ engineers using it daily with zero friction (pre-commit hook, transparent).`} />
          </div>
        </div>
      )}

      {/* ── CLS & CREDIT CARD ── */}
      {activeTab === "cls" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* CLS demo */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>LAYOUT SHIFT DEMO — CLS 0.1 → 0</div>

            <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
              {(["before", "after"] as const).map(m => (
                <button key={m} onClick={() => { setClsMode(m); runCLS(m); }} disabled={clsRunning} style={{ flex: 1, background: clsMode === m ? (m === "before" ? "#ef444420" : "#22c55e20") : "#1e293b", border: `1px solid ${clsMode === m ? (m === "before" ? "#ef4444" : "#22c55e") : "#334155"}`, borderRadius: 6, padding: "5px", cursor: clsRunning ? "not-allowed" : "pointer", color: clsMode === m ? (m === "before" ? "#f87171" : "#4ade80") : "#64748b", fontSize: 9, fontWeight: 700 }}>
                  {m === "before" ? "🔴 Before (CLS 0.1)" : "🟢 After (CLS 0)"}
                </button>
              ))}
            </div>

            {/* Phone mock */}
            <div style={{ background: "#1e293b", border: "2px solid #334155", borderRadius: 18, padding: "14px 10px", marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 800, marginBottom: 8, textAlign: "center", color: "#ee4d2d" }}>SeaMoney</div>

              {/* Balance card — always visible */}
              <div style={{ background: "linear-gradient(135deg, #ee4d2d, #f59e0b)", borderRadius: 12, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ fontSize: 7, color: "rgba(255,255,255,0.7)" }}>Available Balance</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>SGD 2,840.50</div>
              </div>

              {/* Async loading banner (causes shift in "before") */}
              {clsMode === "before" && clsShifting && (
                <div style={{ background: "#a855f720", border: "1px solid #a855f740", borderRadius: 8, padding: "8px 10px", marginBottom: 6, transition: "all 0.3s" }}>
                  <div style={{ fontSize: 7, color: "#c084fc" }}>🎁 Limited Offer: 5% cashback on dining</div>
                </div>
              )}
              {clsMode === "after" && skeletonVisible && (
                <div style={{ background: "#1e293b", borderRadius: 8, height: 36, marginBottom: 6, animation: "pulse 1s ease-in-out infinite" }}>
                  <div style={{ background: "linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%)", height: "100%", borderRadius: 8 }} />
                </div>
              )}
              {clsMode === "after" && !skeletonVisible && (
                <div style={{ background: "#a855f720", border: "1px solid #a855f740", borderRadius: 8, padding: "8px 10px", marginBottom: 6 }}>
                  <div style={{ fontSize: 7, color: "#c084fc" }}>🎁 Limited Offer: 5% cashback on dining</div>
                </div>
              )}

              {/* Buttons that shift */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, transition: "all 0.3s" }}>
                {[{ l: "💸 Transfer", c: "#0ea5e9" }, { l: "📱 Pay Bills", c: "#22c55e" }, { l: "💳 Card", c: "#a855f7" }, { l: "📊 History", c: "#f59e0b" }].map(btn => (
                  <div key={btn.l} style={{ background: btn.c + "20", border: `1px solid ${btn.c}30`, borderRadius: 8, padding: "8px", textAlign: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 9 }}>{btn.l}</div>
                  </div>
                ))}
              </div>

              {misTap && (
                <div style={{ marginTop: 8, background: "#ef444415", border: "1px solid #ef4444", borderRadius: 7, padding: "6px 8px" }}>
                  <div style={{ fontSize: 8, color: "#f87171", fontWeight: 700 }}>⚠ Mis-tap detected!</div>
                  <div style={{ fontSize: 7, color: "#fca5a5" }}>User intended "Transfer" but banner loaded above it → tap hit "Pay Bills" instead.</div>
                </div>
              )}

              {clsMode === "after" && !clsRunning && !skeletonVisible && (
                <div style={{ marginTop: 6, background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 7, padding: "5px 8px" }}>
                  <div style={{ fontSize: 7, color: "#4ade80" }}>✓ Skeleton reserves space · Zero layout shift · No mis-taps</div>
                </div>
              )}
            </div>

            <CodeBlock label="CLS fix — skeleton screens + synchronous component ordering" color="#0ea5e9" code={
`// THE PROBLEM:
// Homepage loads async components (promotions banner, recommendations).
// These are loaded with React.lazy() → arrive AFTER the initial render.
// When they arrive: they push content DOWN (layout shift).
//
// User journey:
// 1. User sees: Balance card → [empty space] → Transfer / Pay Bills / Card / History
// 2. User's thumb moves toward "Transfer" button (top-left of the 2×2 grid).
// 3. Async component (Promotions Banner) finishes loading → inserts above the grid.
// 4. The grid shifts DOWN by 44px.
// 5. User's tap registers on "Pay Bills" (now in the position "Transfer" was).
// 6. User initiates a bill payment they didn't intend.
//
// MEASUREMENT:
// React Native doesn't have web's CLS metric (web: layout-shift PerformanceEntry).
// We measured manually: recorded screen with slow-motion camera (240fps).
// Counted: frame where button appears in position A vs frame where tap occurs.
// If tap occurs after button moved from position A to B: mis-tap.
// Approximated CLS score: 0.1 (above Google's "good" threshold of 0.1 for web).
//
// FIX 1: SKELETON SCREENS WITH FIXED HEIGHT (primary fix):
// The async component renders a Skeleton placeholder WITH THE SAME HEIGHT.
// Space is reserved. When real content arrives: it fills the reserved space.
// No shift. The height was always occupied.
//
// <Suspense fallback={<PromoBannerSkeleton height={44} />}>
//   <PromoBanner />
// </Suspense>
//
// PromoBannerSkeleton: exactly 44px tall (same as real banner).
// The grid below: never moves. Skeleton → real content = zero shift.
//
// FIX 2: SYNCHRONOUS LOADING FOR CRITICAL COMPONENTS:
// Components that appear ABOVE quick actions: NOT lazy-loaded.
// Balance card: always synchronous (critical, always needed).
// Quick actions grid: always synchronous (critical, always needed).
// Promotions banner: lazy (can arrive async without shifting quick actions,
//                    because its height is reserved by the skeleton).
//
// FIX 3: COMPONENT ORDERING IN THE RENDER TREE:
// Before: promotions banner was positioned with absolute layout that
//         caused reflow of surrounding elements.
// After:  changed to flex layout. Flex items: don't cause reflow of siblings
//         when they change size (only push siblings in the flex direction).
//         Skeleton height = real content height: no flex reflow either.
//
// RESULT: CLS 0.1 → 0. Zero mis-taps recorded in the following 30 days.`} />
          </div>

          {/* Credit card vertical */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>CREDIT CARD VERTICAL — CROSS-FUNCTIONAL DELIVERY</div>

            {/* Team board */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {CREDIT_CARD_TEAMS.map(team => (
                <div key={team.name} style={{ background: "#1e293b", border: `1px solid ${statusColor(team.status)}20`, borderRadius: 8, padding: "8px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor(team.status), marginTop: 3, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 9, fontWeight: 700 }}>{team.name}</div>
                      <span style={{ fontSize: 7, background: statusColor(team.status) + "20", color: statusColor(team.status), borderRadius: 4, padding: "1px 6px" }}>{team.status}</span>
                    </div>
                    <div style={{ fontSize: 7, color: "#64748b" }}>{team.role}</div>
                    <div style={{ fontSize: 7, color: "#475569", marginTop: 2 }}>{team.deliverable}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Credit card mock */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>💳 Credit card UI (SeaMoney Card)</div>
              <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid #334155", borderRadius: 16, padding: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "#ee4d2d10" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#ee4d2d" }}>SeaMoney</div>
                  <div style={{ fontSize: 8, color: "#475569" }}>VISA</div>
                </div>
                <div style={{ fontSize: 12, fontFamily: "monospace", letterSpacing: "0.15em", marginBottom: 12 }}>•••• •••• •••• 4892</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 6, color: "#64748b" }}>CREDIT LIMIT</div>
                    <div style={{ fontSize: 10, fontWeight: 700 }}>SGD 5,000</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 6, color: "#64748b" }}>AVAILABLE</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e" }}>SGD 3,240</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 6, color: "#64748b" }}>USED</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b" }}>64.8%</div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ background: "#334155", borderRadius: 3, height: 6, overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(90deg, #22c55e, #f59e0b)", height: "100%", width: "64.8%" }} />
                  </div>
                </div>
              </div>
            </div>

            <CodeBlock label="Cross-functional coordination — what 'coordinated delivery' actually means" color="#a855f7" code={
`// "COORDINATED DELIVERY" IS NOT JUST ATTENDING MEETINGS.
// It means: being the technical person who keeps all teams unblocked and aligned.
//
// THE CREDIT CARD VERTICAL CHALLENGE:
// 5 teams: Product, Design, Backend, QA, Leadership.
// 4 different timelines. 2 platforms (Android + iOS). 1 deadline.
// Common failure mode: Frontend blocks on backend. Backend blocks on design.
// Design blocks on product specification. Everything waits for everything.
//
// HOW FRONTEND UNBLOCKED ITSELF (AND THE WHOLE TEAM):
//
// 1. EARLY API CONTRACT DEFINITION:
// Week 1: I scheduled a 1-hour session with backend engineer.
// Output: agreed API contracts before a single line of backend code was written.
// GET /api/v1/card/info → { cardNumber (masked), limit, used, available, dueDate }
// GET /api/v1/card/transactions?cursor=... → paginated transaction list
// POST /api/v1/card/payment → { amount, fromWalletId }
//
// Frontend: immediately started building against MOCK API (MSW — Mock Service Worker).
// Backend: implemented the real API in parallel.
// Week 4: backend ready → replace MSW with real URL → integration in half a day.
// 0 days of frontend blocked on backend.
//
// 2. DESIGN HANDOFF: PRECISE MEASUREMENTS, NO ASSUMPTIONS.
// Before: frontend interprets design mockups. Gets measurements wrong.
// After: I wrote a "frontend spec checklist" that went to design:
//   □ All measurements in pt (not px, for cross-platform consistency)
//   □ All colors as hex tokens from the design system
//   □ Animation easing curves specified (not just "smooth")
//   □ All states mocked (loading, empty, error, limit exceeded)
//   □ Android vs iOS differences explicitly called out
//   Design delivers a spec that meets this checklist. Zero back-and-forth.
//
// 3. LEADERSHIP ALIGNMENT: DEMO-DRIVEN COMMUNICATION.
// Leadership: doesn't read PRDs. They see demos.
// Week 2: I built a functional prototype (MSW mocks, not real data).
//   Showed: card flip animation, limit widget, transaction list, tap-to-pay flow.
//   Leadership: "we want the card flip to be faster."
//   Product: "we need a 'minimum payment' indicator."
//   Design: "the used% color should be amber at 70%, red at 90%."
// Week 2 feedback → incorporated in Week 3 → no surprises at the final review.
//
// The result: shipped on Android AND iOS on the planned date.
// No rollback. No emergency hotfix in the first 30 days.`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SeaMoneyDemo;
