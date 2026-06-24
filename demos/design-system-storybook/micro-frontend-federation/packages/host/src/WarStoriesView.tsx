// =============================================================
// WAR STORIES: Interactive Before/After Demos
// =============================================================
// Demo 4 issues thực tế khi triển khai Micro-Frontend:
//   1. CSS Leak — global styles từ 1 MFE phá vỡ MFE khác
//   2. Memory Leak — event listeners tích lũy
//   3. Race Condition — event fire trước listener mount
//   4. Circular Events — infinite emit loop
//
// Mỗi demo có toggle BEFORE/AFTER để thấy trực quan bug + fix
// =============================================================

import React, { useState, useEffect, useRef } from "react";
import { tokens, Button, Card } from "@mfe-demo/shared-ui";

// ============================================================
// DEMO 1: CSS Leak — Global styles phá vỡ MFE khác
// ============================================================
function CSSLeakDemo() {
  const [mode, setMode] = useState<"before" | "after">("before");
  const [showLeakingMFE, setShowLeakingMFE] = useState(false);

  return (
    <div>
      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <Button
          size="sm"
          variant={mode === "before" ? "danger" : "ghost"}
          onClick={() => { setMode("before"); setShowLeakingMFE(false); }}
        >
          ❌ Before (Bug)
        </Button>
        <Button
          size="sm"
          variant={mode === "after" ? "primary" : "ghost"}
          onClick={() => { setMode("after"); setShowLeakingMFE(false); }}
        >
          ✅ After (Fix)
        </Button>
      </div>

      <p style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
        {mode === "before"
          ? "📋 Scenario: Team Products dùng global CSS class .title { color: red }. Khi Products MFE mount → tất cả .title trong Cart MFE cũng bị đỏ!"
          : "📋 Fix: Dùng CSS Modules (scoped class) hoặc BEM naming convention (products__title). Styles chỉ ảnh hưởng MFE của mình."}
      </p>

      {/* MFE Simulation */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Cart MFE */}
        <div style={{ border: `2px solid #8b5cf6`, borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ background: "#8b5cf620", padding: "8px 12px", fontSize: tokens.fontSize.xs, fontWeight: 700, color: "#8b5cf6" }}>
            🛒 Cart MFE (Port 3002)
          </div>
          <div style={{ padding: "16px" }}>
            {mode === "before" ? (
              <>
                {/* Before: Global .title gets overridden */}
                <style>{showLeakingMFE ? `.war-demo-title { color: red !important; font-size: 32px !important; font-family: "Comic Sans MS", cursive !important; }` : ""}</style>
                <h4 className="war-demo-title" style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Shopping Cart
                </h4>
                <p className="war-demo-title" style={{ margin: "0 0 12px", fontSize: "13px", color: tokens.colors.textMuted }}>
                  Your items
                </p>
                <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", marginBottom: "8px" }}>
                  <span className="war-demo-title" style={{ fontSize: "14px", fontWeight: 600 }}>
                    Wireless Earbuds — 2,499,000 đ
                  </span>
                </div>
                <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
                  <span className="war-demo-title" style={{ fontSize: "14px", fontWeight: 600 }}>
                    Smart Watch — 8,990,000 đ
                  </span>
                </div>
                {showLeakingMFE && (
                  <div style={{ marginTop: "12px", padding: "8px", background: "#fef2f2", borderRadius: "6px", fontSize: "11px", color: "#dc2626" }}>
                    ⚠️ Tất cả text đều bị CSS từ Products MFE override!
                    <br />Cart MFE không hề thay đổi code — chỉ vì Products MFE mount.
                  </div>
                )}
              </>
            ) : (
              <>
                {/* After: Scoped styles, no leak */}
                <h4 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 700, color: tokens.colors.text }}>
                  Shopping Cart
                </h4>
                <p style={{ margin: "0 0 12px", fontSize: "13px", color: tokens.colors.textMuted }}>
                  Your items (styles protected by CSS Modules)
                </p>
                <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>
                    Wireless Earbuds — 2,499,000 đ
                  </span>
                </div>
                <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>
                    Smart Watch — 8,990,000 đ
                  </span>
                </div>
                <div style={{ marginTop: "12px", padding: "8px", background: "#ecfdf5", borderRadius: "6px", fontSize: "11px", color: "#059669" }}>
                  ✅ Styles scoped — Products MFE CSS không ảnh hưởng Cart MFE.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Products MFE */}
        <div style={{ border: `2px solid #10b981`, borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ background: "#10b98120", padding: "8px 12px", fontSize: tokens.fontSize.xs, fontWeight: 700, color: "#10b981" }}>
            📦 Products MFE (Port 3001)
          </div>
          <div style={{ padding: "16px" }}>
            {!showLeakingMFE ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Button size="sm" variant={mode === "before" ? "danger" : "primary"} onClick={() => setShowLeakingMFE(true)}>
                  {mode === "before" ? "🚀 Mount Products MFE (will leak CSS!)" : "🚀 Mount Products MFE (CSS isolated)"}
                </Button>
                <p style={{ fontSize: "11px", color: tokens.colors.textMuted, marginTop: "8px" }}>
                  Click để giả lập Products MFE mount vào DOM
                </p>
              </div>
            ) : mode === "before" ? (
              <>
                {/* Before: Global CSS injected */}
                <div style={{ padding: "8px", background: "#fef2f2", borderRadius: "6px", fontSize: "11px", color: "#dc2626", marginBottom: "12px", fontFamily: "monospace" }}>
                  💉 Injected global CSS:<br />
                  <code>{`.war-demo-title { color: red !important; font-size: 32px !important; font-family: "Comic Sans MS" !important; }`}</code>
                </div>
                <h4 style={{ color: "red", fontSize: "32px", fontFamily: '"Comic Sans MS", cursive', margin: "0 0 8px" }}>
                  Featured Products
                </h4>
                <p style={{ color: "red", fontSize: "32px", fontFamily: '"Comic Sans MS", cursive', margin: 0 }}>
                  Our best sellers
                </p>
              </>
            ) : (
              <>
                {/* After: Scoped CSS */}
                <div style={{ padding: "8px", background: "#ecfdf5", borderRadius: "6px", fontSize: "11px", color: "#059669", marginBottom: "12px", fontFamily: "monospace" }}>
                  🔒 Scoped CSS (CSS Modules):<br />
                  <code>{`.products_title_x7k2f { color: red; font-size: 32px; }`}</code>
                  <br />
                  <span style={{ color: "#065f46" }}>→ Class hash = unique, không conflict</span>
                </div>
                <h4 style={{ color: "red", fontSize: "24px", fontWeight: 700, margin: "0 0 8px" }}>
                  Featured Products
                </h4>
                <p style={{ fontSize: "13px", color: tokens.colors.textMuted, margin: 0 }}>
                  Our best sellers (scoped, safe)
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Code Comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
        <div style={{ background: "#1e293b", borderRadius: "8px", padding: "12px", overflow: "auto" }}>
          <div style={{ color: "#ef4444", fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>
            ❌ BEFORE: Global CSS (leaks!)
          </div>
          <pre style={{ color: "#e2e8f0", fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
{`/* products.css — GLOBAL */
.title {
  color: red;
  font-size: 32px;
  font-family: "Comic Sans MS";
}

/* Problem: ALL .title elements across
   ALL MFEs get this style!
   Cart MFE's .title also turns red */`}
          </pre>
        </div>
        <div style={{ background: "#1e293b", borderRadius: "8px", padding: "12px", overflow: "auto" }}>
          <div style={{ color: "#10b981", fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>
            ✅ AFTER: CSS Modules (scoped)
          </div>
          <pre style={{ color: "#e2e8f0", fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
{`/* products.module.css — SCOPED */
.title {
  color: red;
  font-size: 32px;
}

/* Compiled to: .products_title_x7k2f */
/* Unique hash = no collision */

/* Alternative: BEM convention */
.products__title { ... }
.cart__title { ... } /* Different! */`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DEMO 2: Memory Leak — Event listeners tích lũy
// ============================================================
function MemoryLeakDemo() {
  const [mode, setMode] = useState<"before" | "after">("before");
  const [mountCount, setMountCount] = useState(0);
  const [listenerCount, setListenerCount] = useState(0);
  const [eventsFired, setEventsFired] = useState(0);
  const [handlerCalls, setHandlerCalls] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const listenersRef = useRef<Array<() => void>>([]);
  const handlerCallsRef = useRef(0);

  const simulateMount = () => {
    setMountCount((prev) => prev + 1);

    if (mode === "before") {
      // ❌ BEFORE: Add listener WITHOUT cleanup
      const handler = () => {
        handlerCallsRef.current++;
        setHandlerCalls(handlerCallsRef.current);
      };
      window.addEventListener("war-demo:event", handler);
      // "Forget" to remove — listener accumulates!
      setListenerCount((prev) => prev + 1);
    } else {
      // ✅ AFTER: Add listener WITH cleanup
      // Remove previous listener first
      listenersRef.current.forEach((unsub) => unsub());
      listenersRef.current = [];

      const handler = () => {
        handlerCallsRef.current++;
        setHandlerCalls(handlerCallsRef.current);
      };
      window.addEventListener("war-demo:event", handler);
      const unsub = () => window.removeEventListener("war-demo:event", handler);
      listenersRef.current.push(unsub);
      setListenerCount(1); // Always 1
    }
    setIsMounted(true);
  };

  const simulateUnmount = () => {
    if (mode === "after") {
      listenersRef.current.forEach((unsub) => unsub());
      listenersRef.current = [];
      setListenerCount(0);
    }
    // Before mode: listeners stay!
    setIsMounted(false);
  };

  const fireEvent = () => {
    handlerCallsRef.current = 0;
    setHandlerCalls(0);
    window.dispatchEvent(new CustomEvent("war-demo:event"));
    setEventsFired((prev) => prev + 1);
    // After dispatch, re-read from ref
    setTimeout(() => setHandlerCalls(handlerCallsRef.current), 50);
  };

  const reset = () => {
    // Cleanup all
    listenersRef.current.forEach((unsub) => unsub());
    listenersRef.current = [];
    // For "before" mode, we can't clean up leaked listeners easily
    // but for demo purposes, reload will fix it
    setMountCount(0);
    setListenerCount(0);
    setEventsFired(0);
    setHandlerCalls(0);
    setIsMounted(false);
    handlerCallsRef.current = 0;
  };

  return (
    <div>
      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <Button
          size="sm"
          variant={mode === "before" ? "danger" : "ghost"}
          onClick={() => { setMode("before"); reset(); }}
        >
          ❌ Before (Bug)
        </Button>
        <Button
          size="sm"
          variant={mode === "after" ? "primary" : "ghost"}
          onClick={() => { setMode("after"); reset(); }}
        >
          ✅ After (Fix)
        </Button>
      </div>

      <p style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
        {mode === "before"
          ? "📋 Mỗi lần MFE mount, useEffect thêm 1 listener. Unmount KHÔNG cleanup → listeners tích lũy. Fire 1 event = N handler calls!"
          : "📋 Fix: useEffect return cleanup function. Mount/unmount bao nhiêu lần cũng chỉ có 1 active listener."}
      </p>

      {/* Controls */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <Button size="sm" variant="secondary" onClick={simulateMount}>
          🔄 Simulate Mount ({mountCount})
        </Button>
        <Button size="sm" variant="secondary" onClick={simulateUnmount} disabled={!isMounted}>
          🔄 Simulate Unmount
        </Button>
        <Button size="sm" variant="primary" onClick={fireEvent}>
          ⚡ Fire Event
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          🧹 Reset
        </Button>
      </div>

      {/* Metrics Dashboard */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
        {[
          { label: "Mount Count", value: mountCount, color: "#6366f1" },
          {
            label: "Active Listeners",
            value: mode === "before" ? mountCount : (isMounted ? 1 : 0),
            color: mode === "before" && mountCount > 1 ? "#dc2626" : "#10b981",
          },
          { label: "Events Fired", value: eventsFired, color: "#f59e0b" },
          {
            label: "Handler Calls (last)",
            value: handlerCalls,
            color: handlerCalls > 1 ? "#dc2626" : "#10b981",
          },
        ].map((metric, i) => (
          <div key={i} style={{
            padding: "12px", textAlign: "center",
            background: `${metric.color}08`, border: `1px solid ${metric.color}25`,
            borderRadius: "8px",
          }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color: metric.color }}>
              {metric.value}
            </div>
            <div style={{ fontSize: "11px", color: tokens.colors.textMuted, marginTop: "4px" }}>
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      {/* Visual explanation */}
      {mode === "before" && mountCount > 1 && (
        <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "12px", color: "#991b1b", lineHeight: 1.6 }}>
          🐛 <strong>Bug visible!</strong> Mounted {mountCount} lần → {mountCount} listeners đang active.
          Fire 1 event → handler chạy {mountCount} lần!
          <br />
          Trong production: User navigate 50 lần → 50 handlers → performance crash.
          <br />
          <strong>Tip:</strong> Bấm &quot;Fire Event&quot; và xem &quot;Handler Calls&quot; tăng = số lần mount.
        </div>
      )}

      {mode === "after" && mountCount > 1 && (
        <div style={{ padding: "12px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", fontSize: "12px", color: "#065f46", lineHeight: 1.6 }}>
          ✅ <strong>Fixed!</strong> Mounted {mountCount} lần nhưng chỉ 1 active listener.
          Fire event → handler chỉ chạy 1 lần. Đây là nhờ cleanup function.
        </div>
      )}

      {/* Code Comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
        <div style={{ background: "#1e293b", borderRadius: "8px", padding: "12px", overflow: "auto" }}>
          <div style={{ color: "#ef4444", fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>
            ❌ BEFORE: No cleanup
          </div>
          <pre style={{ color: "#e2e8f0", fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
{`useEffect(() => {
  const handler = (e) => {
    updateCart(e.detail);
  };
  window.addEventListener(
    "mfe:cart:add", handler
  );
  // ❌ Missing: return () => ...
  // Listener stays forever!
}, []);

// Mount 10x → 10 handlers → 
// fire 1 event = 10 calls!`}
          </pre>
        </div>
        <div style={{ background: "#1e293b", borderRadius: "8px", padding: "12px", overflow: "auto" }}>
          <div style={{ color: "#10b981", fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>
            ✅ AFTER: Proper cleanup
          </div>
          <pre style={{ color: "#e2e8f0", fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
{`useEffect(() => {
  const handler = (e) => {
    updateCart(e.detail);
  };
  window.addEventListener(
    "mfe:cart:add", handler
  );
  // ✅ Cleanup on unmount
  return () => {
    window.removeEventListener(
      "mfe:cart:add", handler
    );
  };
}, []);

// Mount/unmount 100x → always 1`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DEMO 3: Race Condition — Event fire trước listener mount
// ============================================================
function RaceConditionDemo() {
  const [mode, setMode] = useState<"before" | "after">("before");
  const [timeline, setTimeline] = useState<Array<{ time: number; source: string; action: string; status: "success" | "fail" | "info" }>>([]);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const timelineRef = useRef<typeof timeline>([]);
  const startTimeRef = useRef(0);

  const addTimeline = (source: string, action: string, status: "success" | "fail" | "info") => {
    const entry = { time: Date.now() - startTimeRef.current, source, action, status };
    timelineRef.current = [...timelineRef.current, entry];
    setTimeline([...timelineRef.current]);
  };

  const runSimulation = () => {
    setTimeline([]);
    setCartItems([]);
    timelineRef.current = [];
    startTimeRef.current = Date.now();

    if (mode === "before") {
      // ❌ BEFORE: Event fires BEFORE Cart MFE mounts
      addTimeline("Host", "Page load started", "info");

      // Products loads fast (200ms)
      setTimeout(() => {
        addTimeline("Products MFE", "Mounted (200ms)", "info");
        addTimeline("Products MFE", "Auto-add 'Keyboard' to cart", "info");

        // Fire event — but Cart MFE hasn't mounted yet!
        window.dispatchEvent(new CustomEvent("war-race:add", { detail: "Keyboard" }));
        addTimeline("Products MFE", "dispatchEvent('mfe:cart:add')", "info");
        addTimeline("Products MFE", "Event FIRED — but who's listening?", "fail");
      }, 200);

      // Cart MFE loads slow (800ms)
      setTimeout(() => {
        addTimeline("Cart MFE", "Mounted (800ms) — NOW listening", "info");

        // Start listening — but the event already fired 600ms ago!
        const handler = (e: Event) => {
          const item = (e as CustomEvent).detail;
          setCartItems((prev) => [...prev, item]);
          addTimeline("Cart MFE", `Received: ${item}`, "success");
        };
        window.addEventListener("war-race:add", handler);

        addTimeline("Cart MFE", "addEventListener — but event already gone!", "fail");
        addTimeline("Cart MFE", "Cart is EMPTY — Keyboard was LOST", "fail");

        // Cleanup after demo
        setTimeout(() => window.removeEventListener("war-race:add", handler), 5000);
      }, 800);
    } else {
      // ✅ AFTER: Shared Store pattern — no race condition
      const storeItems: string[] = [];

      addTimeline("Host", "Page load started", "info");

      // Products loads fast (200ms)
      setTimeout(() => {
        addTimeline("Products MFE", "Mounted (200ms)", "info");
        addTimeline("Products MFE", "Auto-add 'Keyboard' to cart", "info");

        // Direct store mutation — doesn't care about listeners
        storeItems.push("Keyboard");
        addTimeline("Products MFE", "cartStore.addItem('Keyboard')", "success");
        addTimeline("Products MFE", "Store updated — state persists!", "success");
      }, 200);

      // Cart MFE loads slow (800ms)
      setTimeout(() => {
        addTimeline("Cart MFE", "Mounted (800ms)", "info");

        // Read current state — gets Keyboard immediately!
        setCartItems([...storeItems]);
        addTimeline("Cart MFE", `useCart() → items: [${storeItems.join(", ")}]`, "success");
        addTimeline("Cart MFE", "Cart shows Keyboard — NO data loss!", "success");
      }, 800);
    }
  };

  return (
    <div>
      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <Button size="sm" variant={mode === "before" ? "danger" : "ghost"} onClick={() => { setMode("before"); setTimeline([]); setCartItems([]); }}>
          ❌ Before (Bug)
        </Button>
        <Button size="sm" variant={mode === "after" ? "primary" : "ghost"} onClick={() => { setMode("after"); setTimeline([]); setCartItems([]); }}>
          ✅ After (Fix)
        </Button>
      </div>

      <p style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
        {mode === "before"
          ? "📋 Products MFE mount nhanh (200ms), fire event. Cart MFE mount chậm (800ms), bắt đầu listen. Event đã fire trước → Cart miss event → giỏ hàng trống!"
          : "📋 Fix: Dùng Shared Store thay CustomEvent. Products ghi state vào store. Cart mount bất cứ lúc nào cũng đọc được current state."}
      </p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <Button size="sm" variant="primary" onClick={runSimulation}>
          ▶️ Run Simulation
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setTimeline([]); setCartItems([]); }}>
          🧹 Clear
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
        {/* Timeline */}
        <div style={{ background: "#1e293b", borderRadius: "8px", padding: "12px", minHeight: "200px", maxHeight: "350px", overflow: "auto" }}>
          <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "8px", fontWeight: 600 }}>
            📊 Event Timeline:
          </div>
          {timeline.length === 0 ? (
            <div style={{ color: "#64748b", textAlign: "center", padding: "40px", fontSize: "12px" }}>
              Click &quot;Run Simulation&quot; to see the race condition
            </div>
          ) : (
            timeline.map((entry, i) => (
              <div key={i} style={{
                display: "flex", gap: "8px", padding: "4px 0",
                borderBottom: "1px solid #334155", fontSize: "12px", fontFamily: "monospace",
              }}>
                <span style={{ color: "#64748b", minWidth: "48px", flexShrink: 0 }}>
                  {entry.time}ms
                </span>
                <span style={{
                  color: entry.source.includes("Products") ? "#86efac" : entry.source.includes("Cart") ? "#c4b5fd" : "#93c5fd",
                  minWidth: "100px", flexShrink: 0, fontWeight: 600,
                }}>
                  {entry.source}
                </span>
                <span style={{
                  color: entry.status === "success" ? "#86efac" : entry.status === "fail" ? "#fca5a5" : "#e2e8f0",
                }}>
                  {entry.status === "success" ? "✅" : entry.status === "fail" ? "❌" : "ℹ️"} {entry.action}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Cart State */}
        <div style={{ background: tokens.colors.surface, border: `1px solid ${tokens.colors.border}`, borderRadius: "8px", padding: "16px" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>🛒 Cart State</h4>
          {cartItems.length === 0 ? (
            <div style={{
              padding: "20px", textAlign: "center",
              color: mode === "before" && timeline.length > 0 ? "#dc2626" : tokens.colors.textMuted,
              fontSize: "13px", fontWeight: mode === "before" && timeline.length > 0 ? 700 : 400,
            }}>
              {mode === "before" && timeline.length > 0 ? "❌ EMPTY — Data lost!" : "Empty"}
            </div>
          ) : (
            cartItems.map((item, i) => (
              <div key={i} style={{ padding: "8px", background: "#ecfdf5", borderRadius: "6px", marginBottom: "4px", fontSize: "13px", color: "#065f46", fontWeight: 600 }}>
                ✅ {item}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DEMO 4: Circular Events — Infinite emit loop
// ============================================================
function CircularEventDemo() {
  const [mode, setMode] = useState<"before" | "after">("before");
  const [log, setLog] = useState<Array<{ depth: number; event: string; status: "ok" | "danger" | "blocked" }>>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSimulation = () => {
    setLog([]);
    setIsRunning(true);

    const entries: typeof log = [];
    let depth = 0;

    if (mode === "before") {
      // ❌ BEFORE: No depth guard — simulate infinite loop (capped at 15 for demo)
      const maxSimulated = 15;

      const addEntry = (event: string) => {
        depth++;
        const status = depth > 10 ? "danger" : "ok";
        entries.push({ depth, event, status });
        setLog([...entries]);

        if (depth < maxSimulated) {
          setTimeout(() => {
            if (event === "cart:item-added") {
              addEntry("analytics:tracked");
            } else {
              addEntry("cart:item-added");
            }
          }, 200);
        } else {
          entries.push({ depth: depth + 1, event: "💥 STACK OVERFLOW!", status: "danger" });
          setLog([...entries]);
          setIsRunning(false);
        }
      };

      addEntry("cart:item-added");
    } else {
      // ✅ AFTER: emitDepth guard breaks the loop
      const MAX_DEPTH = 10;

      const addEntry = (event: string) => {
        depth++;
        if (depth > MAX_DEPTH) {
          entries.push({ depth, event: `🛑 BLOCKED by emitDepth guard (depth=${depth} > MAX=${MAX_DEPTH})`, status: "blocked" });
          setLog([...entries]);
          setIsRunning(false);
          return;
        }

        entries.push({ depth, event, status: depth > 7 ? "danger" : "ok" });
        setLog([...entries]);

        setTimeout(() => {
          if (event === "cart:item-added") {
            addEntry("analytics:tracked");
          } else {
            addEntry("cart:item-added");
          }
        }, 200);
      };

      addEntry("cart:item-added");
    }
  };

  return (
    <div>
      {/* Mode Toggle */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <Button size="sm" variant={mode === "before" ? "danger" : "ghost"} onClick={() => { setMode("before"); setLog([]); setIsRunning(false); }}>
          ❌ Before (Bug)
        </Button>
        <Button size="sm" variant={mode === "after" ? "primary" : "ghost"} onClick={() => { setMode("after"); setLog([]); setIsRunning(false); }}>
          ✅ After (Fix)
        </Button>
      </div>

      <p style={{ fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
        {mode === "before"
          ? "📋 Handler A nhận 'cart:item-added' → emit 'analytics:tracked'. Handler B nhận 'analytics:tracked' → emit 'cart:item-added'. Loop vĩnh viễn → Stack Overflow!"
          : "📋 Fix: Event Bus có emitDepth counter. Khi depth vượt MAX_DEPTH=10 → auto-break + console.error. App không crash."}
      </p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <Button size="sm" variant={mode === "before" ? "danger" : "primary"} onClick={runSimulation} disabled={isRunning}>
          {isRunning ? "⏳ Running..." : "▶️ Trigger cart:item-added"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setLog([]); setIsRunning(false); }}>
          🧹 Clear
        </Button>
      </div>

      {/* Visual Call Stack */}
      <div style={{ background: "#1e293b", borderRadius: "8px", padding: "12px", minHeight: "200px", maxHeight: "400px", overflow: "auto" }}>
        <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "8px", fontWeight: 600 }}>
          📊 Call Stack (emit depth):
        </div>
        {log.length === 0 ? (
          <div style={{ color: "#64748b", textAlign: "center", padding: "40px", fontSize: "12px" }}>
            Click &quot;Trigger&quot; to start the circular event chain
          </div>
        ) : (
          log.map((entry, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "4px 0", borderBottom: "1px solid #334155",
              fontSize: "12px", fontFamily: "monospace",
              paddingLeft: `${Math.min(entry.depth * 12, 180)}px`,
            }}>
              <span style={{
                color: entry.status === "ok" ? "#86efac" : entry.status === "blocked" ? "#fbbf24" : "#fca5a5",
                fontWeight: 600,
              }}>
                [{entry.depth}]
              </span>
              <span style={{
                color: entry.status === "ok" ? "#e2e8f0" : entry.status === "blocked" ? "#fbbf24" : "#fca5a5",
              }}>
                {entry.status === "blocked" ? "🛑" : entry.status === "danger" ? "⚠️" : "→"} {entry.event}
              </span>
              {/* Depth indicator bar */}
              <span style={{
                display: "inline-block",
                width: `${Math.min(entry.depth * 8, 120)}px`,
                height: "6px",
                borderRadius: "3px",
                background: entry.depth > 10 ? "#ef4444" : entry.depth > 7 ? "#f59e0b" : "#10b981",
                flexShrink: 0,
              }} />
            </div>
          ))
        )}
      </div>

      {/* Code Comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
        <div style={{ background: "#1e293b", borderRadius: "8px", padding: "12px", overflow: "auto" }}>
          <div style={{ color: "#ef4444", fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>
            ❌ BEFORE: No depth guard
          </div>
          <pre style={{ color: "#e2e8f0", fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
{`// Handler A
eventBus.on("cart:item-added", () => {
  track("add-to-cart");
  eventBus.emit("analytics:tracked");
});

// Handler B
eventBus.on("analytics:tracked", () => {
  sync("cart-event");
  eventBus.emit("cart:item-added"); // LOOP!
});

// A → B → A → B → ... → 💥 Crash`}
          </pre>
        </div>
        <div style={{ background: "#1e293b", borderRadius: "8px", padding: "12px", overflow: "auto" }}>
          <div style={{ color: "#10b981", fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>
            ✅ AFTER: emitDepth guard
          </div>
          <pre style={{ color: "#e2e8f0", fontSize: "11px", lineHeight: 1.5, margin: 0 }}>
{`function emit(event, data) {
  emitDepth++;
  
  if (emitDepth > MAX_DEPTH) {
    console.error(
      "Circular event detected!"
    );
    emitDepth--;
    return; // 🛑 Break the loop
  }

  deliverToHandlers(event, data);
  emitDepth--;
}

// A → B → A → ... → depth=10 → 🛑 STOP`}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN WAR STORIES VIEW
// ============================================================
export default function WarStoriesView() {
  const [activeDemo, setActiveDemo] = useState(0);

  const demos = [
    {
      id: 0,
      icon: "🎨",
      title: "CSS Leak",
      subtitle: "Global styles phá vỡ MFE khác",
      severity: "HIGH",
      color: "#dc2626",
      component: <CSSLeakDemo />,
    },
    {
      id: 1,
      icon: "💾",
      title: "Memory Leak",
      subtitle: "Event listeners tích lũy",
      severity: "CRITICAL",
      color: "#dc2626",
      component: <MemoryLeakDemo />,
    },
    {
      id: 2,
      icon: "⏱️",
      title: "Race Condition",
      subtitle: "Event fire trước listener mount",
      severity: "HIGH",
      color: "#f59e0b",
      component: <RaceConditionDemo />,
    },
    {
      id: 3,
      icon: "🔄",
      title: "Circular Events",
      subtitle: "Infinite emit loop → crash",
      severity: "CRITICAL",
      color: "#dc2626",
      component: <CircularEventDemo />,
    },
  ];

  return (
    <div>
      <h2 style={{ fontSize: tokens.fontSize.xl, fontWeight: 700, marginBottom: "8px" }}>
        🐛 War Stories — Interactive Demos
      </h2>
      <p style={{ color: tokens.colors.textMuted, marginBottom: "24px", fontSize: tokens.fontSize.sm, lineHeight: 1.6 }}>
        Trải nghiệm trực tiếp các <strong>bug thực tế</strong> khi triển khai Micro-Frontend.
        Mỗi demo có toggle <span style={{ color: "#dc2626", fontWeight: 700 }}>BEFORE</span> (bug) và <span style={{ color: "#10b981", fontWeight: 700 }}>AFTER</span> (fix).
      </p>

      {/* Demo Selector */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {demos.map((demo) => (
          <button
            key={demo.id}
            onClick={() => setActiveDemo(demo.id)}
            style={{
              padding: "10px 16px",
              background: activeDemo === demo.id ? `${demo.color}10` : tokens.colors.surface,
              border: activeDemo === demo.id ? `2px solid ${demo.color}` : `1px solid ${tokens.colors.border}`,
              borderRadius: tokens.borderRadius.md,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 150ms ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "18px" }}>{demo.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: tokens.fontSize.sm, fontWeight: 700, color: activeDemo === demo.id ? demo.color : tokens.colors.text }}>
                  {demo.title}
                </div>
                <div style={{ fontSize: "10px", color: tokens.colors.textMuted }}>
                  {demo.subtitle}
                </div>
              </div>
            </div>
            <div style={{
              marginTop: "4px",
              fontSize: "9px",
              fontWeight: 700,
              color: demo.severity === "CRITICAL" ? "#dc2626" : "#f59e0b",
              textTransform: "uppercase" as const,
            }}>
              {demo.severity}
            </div>
          </button>
        ))}
      </div>

      {/* Active Demo */}
      <div style={{
        background: tokens.colors.surface,
        border: `1px solid ${tokens.colors.border}`,
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.lg,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <span style={{ fontSize: "28px" }}>{demos[activeDemo].icon}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: tokens.fontSize.lg, fontWeight: 700, color: demos[activeDemo].color }}>
              War Story #{activeDemo + 1}: {demos[activeDemo].title}
            </h3>
            <p style={{ margin: 0, fontSize: tokens.fontSize.xs, color: tokens.colors.textMuted }}>
              {demos[activeDemo].subtitle} — Click BEFORE/AFTER để so sánh
            </p>
          </div>
        </div>

        {demos[activeDemo].component}
      </div>
    </div>
  );
}
