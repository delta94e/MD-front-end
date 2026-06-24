/**
 * ArchitectureReviewDemo.tsx
 *
 * Demonstrates: "Analyzed and documented the legacy message sending flow
 * (product and technical perspectives), and proposed a new architectural design"
 *
 * This component is itself a documentation artifact — it IS the architecture review.
 * It shows:
 *   1. LEGACY flow — documented from product + technical perspectives
 *   2. PROBLEM ANALYSIS — what breaks, where, and why
 *   3. NEW ARCHITECTURE — proposed design with clear rationale
 *   4. MIGRATION STRATEGY — incremental path from old to new
 *   5. LIVE SIMULATION — click-through both flows to feel the difference
 */

import React, { useState, useCallback, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────
// Types — Modelling the Architecture
// ─────────────────────────────────────────────────────────────────

type FlowStep = {
  id: string;
  layer: "ui" | "service" | "network" | "db" | "mq" | "external";
  actor: string;
  action: string;
  latency?: number;         // simulated ms
  problem?: string;         // what goes wrong in legacy
  improvement?: string;     // what's better in new design
  isBlocking?: boolean;     // blocks UI in legacy?
};

type ArchView = "product" | "technical";
type FlowMode = "legacy" | "new";
type Tab = "compare" | "legacy-flow" | "new-arch" | "migration" | "simulate";

// ─────────────────────────────────────────────────────────────────
// Architecture Data — The Actual Documentation
// ─────────────────────────────────────────────────────────────────

/** LEGACY message sending flow — documented from both perspectives */
const LEGACY_STEPS: FlowStep[] = [
  {
    id: "L1",
    layer: "ui",
    actor: "User",
    action: "Clicks 'Send' button",
    latency: 0,
    problem: "Button disabled immediately — no feedback until response",
    isBlocking: true,
  },
  {
    id: "L2",
    layer: "ui",
    actor: "SendButton.onClick()",
    action: "Validates form data synchronously",
    latency: 10,
    problem: "Validation logic mixed into UI component — untestable",
    isBlocking: true,
  },
  {
    id: "L3",
    layer: "ui",
    actor: "SendButton.onClick()",
    action: "Calls messageService.send() directly",
    latency: 5,
    problem: "UI component directly imports and calls service — tight coupling",
    isBlocking: true,
  },
  {
    id: "L4",
    layer: "service",
    actor: "messageService.send()",
    action: "Formats payload: {content, userId, threadId, timestamp}",
    latency: 5,
    problem: "Payload formatting in service layer — no type safety",
    isBlocking: true,
  },
  {
    id: "L5",
    layer: "network",
    actor: "fetch('/api/messages')",
    action: "POST request to REST API (synchronous await)",
    latency: 800,
    problem: "User sees frozen UI for 800ms+ on slow connections. No timeout!",
    isBlocking: true,
  },
  {
    id: "L6",
    layer: "db",
    actor: "API Server",
    action: "Inserts message into PostgreSQL",
    latency: 50,
    problem: "No queue — DB write is synchronous, API blocks until done",
    isBlocking: true,
  },
  {
    id: "L7",
    layer: "external",
    actor: "API Server",
    action: "Sends push notification via FCM (synchronous)",
    latency: 400,
    problem: "FCM call in same request lifecycle — FCM down = message send fails!",
    isBlocking: true,
  },
  {
    id: "L8",
    layer: "service",
    actor: "messageService.send()",
    action: "Updates local state with response",
    latency: 20,
    problem: "State update happens AFTER all the above — 1.3s total wait",
    isBlocking: true,
  },
  {
    id: "L9",
    layer: "ui",
    actor: "MessageList",
    action: "Re-renders full message list",
    latency: 50,
    problem: "Full re-render — no virtualization. 1000 messages = jank",
    isBlocking: false,
  },
  {
    id: "L10",
    layer: "external",
    actor: "Analytics (Segment)",
    action: "track('message_sent') — synchronous in same thread",
    latency: 200,
    problem: "Analytics call blocks the flow — if Segment is slow, UX suffers",
    isBlocking: false,
  },
];

/** NEW architecture — the proposed redesign */
const NEW_STEPS: FlowStep[] = [
  {
    id: "N1",
    layer: "ui",
    actor: "User",
    action: "Clicks 'Send' button",
    latency: 0,
    improvement: "Button stays interactive — no blocking",
  },
  {
    id: "N2",
    layer: "ui",
    actor: "useSendMessage() hook",
    action: "Validates input via pure validate() function",
    latency: 2,
    improvement: "Validation extracted to pure function — testable in isolation",
  },
  {
    id: "N3",
    layer: "ui",
    actor: "MessageStore (Zustand)",
    action: "Optimistic update: adds message to local state immediately",
    latency: 5,
    improvement: "User sees message instantly! No waiting for network",
  },
  {
    id: "N4",
    layer: "ui",
    actor: "EventBus",
    action: "Dispatches SendMessageCommand → decoupled from UI",
    latency: 2,
    improvement: "UI fires command and done — doesn't wait for result",
  },
  {
    id: "N5",
    layer: "service",
    actor: "MessageCommandHandler",
    action: "Picks up command from queue, applies retry policy",
    latency: 5,
    improvement: "Retry logic centralized here — UI never knows about failures",
  },
  {
    id: "N6",
    layer: "network",
    actor: "fetch('/api/messages') + AbortController",
    action: "POST with 5s timeout + automatic retry (exponential backoff)",
    latency: 300,
    improvement: "5s timeout enforced. Retry on network failure. User not stuck!",
  },
  {
    id: "N7",
    layer: "db",
    actor: "API Server",
    action: "Inserts message + publishes to Kafka topic",
    latency: 30,
    improvement: "Fast insert (no waiting for Kafka ack). Fire-and-forget pattern",
  },
  {
    id: "N8",
    layer: "mq",
    actor: "Kafka Consumer (Notification Worker)",
    action: "Async: sends push notification independently",
    latency: 0,
    improvement: "Decoupled! FCM failure doesn't affect message send success",
  },
  {
    id: "N9",
    layer: "service",
    actor: "MessageCommandHandler",
    action: "On success: confirms optimistic message (update tempId → realId)",
    latency: 10,
    improvement: "Optimistic → confirmed: message was already visible to user!",
  },
  {
    id: "N10",
    layer: "external",
    actor: "Analytics Worker (Web Worker)",
    action: "track('message_sent') — off main thread, non-blocking",
    latency: 0,
    improvement: "Analytics in Web Worker — zero UI impact even if slow",
  },
];

// ─────────────────────────────────────────────────────────────────
// Problem Catalog — from the Architecture Analysis
// ─────────────────────────────────────────────────────────────────

const PROBLEMS = [
  {
    id: "P1",
    severity: "critical",
    category: "UX",
    title: "1.3s UI Freeze on Send",
    legacy: "fetch() awaited synchronously — user sees frozen button for entire API round-trip",
    impact: "25% message send abandonment on 3G connections (product metric)",
    fix: "Optimistic update: show message instantly, sync in background",
  },
  {
    id: "P2",
    severity: "critical",
    category: "Reliability",
    title: "FCM Failure = Message Send Failure",
    legacy: "Push notification called in same API request lifecycle",
    impact: "FCM outage (happens ~2x/year) causes 100% of messages to fail for hours",
    fix: "Kafka queue: Decouple notification from message persistence",
  },
  {
    id: "P3",
    severity: "high",
    category: "Architecture",
    title: "No Retry Logic",
    legacy: "Network failure = message lost, user must manually try again",
    impact: "~3% message drop rate on mobile due to connection switching",
    fix: "Command Queue with exponential backoff (3 retries, 1s/2s/4s)",
  },
  {
    id: "P4",
    severity: "high",
    category: "Maintainability",
    title: "Business Logic in UI Components",
    legacy: "Validation, formatting, service calls all in SendButton.onClick()",
    impact: "Cannot unit test without rendering component. 0% business logic coverage",
    fix: "Extract to pure functions + command handler (90%+ testable)",
  },
  {
    id: "P5",
    severity: "medium",
    category: "Performance",
    title: "Full List Re-render on Every Message",
    legacy: "No virtualization — React renders all messages in DOM",
    impact: "With 1000 messages: 300ms+ render time, jank on scroll",
    fix: "react-virtual + append-only render (only new messages re-render)",
  },
  {
    id: "P6",
    severity: "medium",
    category: "UX",
    title: "Analytics Blocking Main Thread",
    legacy: "Segment.track() called synchronously in send flow",
    impact: "Segment slowness (rare) makes the whole send feel slow",
    fix: "Analytics in Web Worker — main thread never touched",
  },
];

// ─────────────────────────────────────────────────────────────────
// UI Helpers
// ─────────────────────────────────────────────────────────────────

const LAYER_COLORS: Record<FlowStep["layer"], string> = {
  ui:       "#6366f1",
  service:  "#0891b2",
  network:  "#f59e0b",
  db:       "#10b981",
  mq:       "#ec4899",
  external: "#94a3b8",
};

const LAYER_LABELS: Record<FlowStep["layer"], string> = {
  ui:       "UI Layer",
  service:  "Service Layer",
  network:  "Network",
  db:       "Database",
  mq:       "Message Queue",
  external: "External Service",
};

const SEVERITY_COLORS = {
  critical: { bg: "#450a0a", border: "#7f1d1d", text: "#fca5a5", dot: "#ef4444" },
  high:     { bg: "#422006", border: "#78350f", text: "#fde68a", dot: "#f59e0b" },
  medium:   { bg: "#0c1a2e", border: "#1e3a5f", text: "#bae6fd", dot: "#7dd3fc" },
};

function LayerBadge({ layer }: { layer: FlowStep["layer"] }) {
  const color = LAYER_COLORS[layer];
  return (
    <span style={{
      background: `${color}18`, color, border: `1px solid ${color}40`,
      borderRadius: 4, padding: "1px 7px", fontSize: 10, fontWeight: 700,
      fontFamily: "monospace", whiteSpace: "nowrap",
    }}>
      {LAYER_LABELS[layer]}
    </span>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>{title}</h2>
      </div>
      {subtitle && <p style={{ margin: 0, color: "#64748b", fontSize: 13, marginLeft: 32 }}>{subtitle}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Flow Diagram Component
// ─────────────────────────────────────────────────────────────────

function FlowDiagram({ steps, mode, perspective }: {
  steps: FlowStep[];
  mode: FlowMode;
  perspective: ArchView;
}) {
  const [activeStep, setActiveStep] = useState<string | null>(null);

  // Group steps by layer for the technical view
  const totalLatency = steps.reduce((s, st) => s + (st.latency ?? 0), 0);

  return (
    <div>
      {perspective === "product" ? (
        // ── Product perspective: User journey ─────────────────────
        <div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
            👤 What the user experiences — {totalLatency}ms total end-to-end
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {steps.map((step, i) => (
              <div key={step.id}
                onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                style={{
                  background: activeStep === step.id ? "#1e3a5f" : "#1e293b",
                  border: `1px solid ${activeStep === step.id ? "#3b82f6" : "#334155"}`,
                  borderRadius: 8, padding: "10px 14px", cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: mode === "legacy" ? "#7f1d1d" : "#052e16",
                    color: mode === "legacy" ? "#fca5a5" : "#4ade80",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>
                      {step.action}
                    </div>
                    {step.latency != null && step.latency > 0 && (
                      <div style={{ color: step.latency > 200 ? "#ef4444" : "#64748b", fontSize: 11, marginTop: 2 }}>
                        {step.isBlocking ? "⏳ " : ""}{step.latency}ms{step.isBlocking ? " (user waits)" : ""}
                      </div>
                    )}
                  </div>
                  <LayerBadge layer={step.layer} />
                </div>
                {/* Expanded: show problem or improvement */}
                {activeStep === step.id && (step.problem || step.improvement) && (
                  <div style={{
                    marginTop: 10, padding: "8px 12px",
                    background: mode === "legacy" ? "#450a0a" : "#052e16",
                    border: `1px solid ${mode === "legacy" ? "#7f1d1d" : "#166534"}`,
                    borderRadius: 6, fontSize: 12,
                    color: mode === "legacy" ? "#fca5a5" : "#86efac",
                  }}>
                    {mode === "legacy" ? "⚠️ " : "✅ "}
                    {step.problem ?? step.improvement}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // ── Technical perspective: Layer diagram ──────────────────
        <div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
            ⚙️ Technical layers — click any step to see details
          </div>
          {(["ui", "service", "network", "db", "mq", "external"] as FlowStep["layer"][]).map(layer => {
            const layerSteps = steps.filter(s => s.layer === layer);
            if (layerSteps.length === 0) return null;
            const color = LAYER_COLORS[layer];
            return (
              <div key={layer} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 3, height: 16, background: color, borderRadius: 2 }} />
                  <span style={{ color, fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
                    {LAYER_LABELS[layer]}
                  </span>
                </div>
                {layerSteps.map((step) => (
                  <div key={step.id}
                    onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                    style={{
                      marginLeft: 16,
                      background: activeStep === step.id ? `${color}18` : "#1e293b",
                      border: `1px solid ${activeStep === step.id ? color : "#334155"}`,
                      borderRadius: 6, padding: "8px 12px", cursor: "pointer",
                      marginBottom: 4, transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <code style={{ color, fontSize: 11, fontFamily: "monospace", flexShrink: 0 }}>
                        [{step.id}]
                      </code>
                      <span style={{ color: "#e2e8f0", fontSize: 12, flex: 1 }}>
                        {step.actor}
                      </span>
                      {step.latency != null && step.latency > 0 && (
                        <span style={{
                          color: step.latency > 500 ? "#ef4444" : step.latency > 100 ? "#f59e0b" : "#4ade80",
                          fontSize: 11, fontFamily: "monospace",
                        }}>
                          {step.latency}ms
                        </span>
                      )}
                      {step.isBlocking && (
                        <span style={{
                          background: "#7f1d1d", color: "#fca5a5",
                          fontSize: 9, borderRadius: 4, padding: "1px 5px", fontWeight: 700,
                        }}>BLOCKS</span>
                      )}
                    </div>
                    <div style={{ marginLeft: 36, color: "#64748b", fontSize: 11, marginTop: 2 }}>
                      {step.action}
                    </div>
                    {activeStep === step.id && (step.problem || step.improvement) && (
                      <div style={{
                        marginTop: 8, marginLeft: 36,
                        padding: "6px 10px",
                        background: mode === "legacy" ? "#450a0a" : "#052e16",
                        border: `1px solid ${mode === "legacy" ? "#7f1d1d" : "#166534"}`,
                        borderRadius: 4, fontSize: 11,
                        color: mode === "legacy" ? "#fca5a5" : "#86efac",
                      }}>
                        {mode === "legacy" ? "⚠️  PROBLEM: " : "✅ IMPROVEMENT: "}
                        {step.problem ?? step.improvement}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Flow Simulator
// ─────────────────────────────────────────────────────────────────

function FlowSimulator() {
  const [mode, setMode] = useState<FlowMode>("legacy");
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState("Hey, are you free for a call?");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [uiBlockedUntil, setUiBlockedUntil] = useState(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = mode === "legacy" ? LEGACY_STEPS : NEW_STEPS;

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const simulate = useCallback(async () => {
    setRunning(true);
    setCurrentStep(-1);
    setElapsed(0);
    setStatus("sending");
    startTimeRef.current = Date.now();

    // Calculate total blocking time (for UI freeze simulation)
    const blockingLatency = steps
      .filter(s => s.isBlocking)
      .reduce((sum, s) => sum + (s.latency ?? 0), 0);
    setUiBlockedUntil(blockingLatency);

    let totalDelay = 0;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      totalDelay += step.latency ?? 0;

      await new Promise<void>(resolve => {
        timerRef.current = setTimeout(() => {
          setCurrentStep(i);
          setElapsed(Math.round(Date.now() - startTimeRef.current));
          resolve();
        }, step.latency ?? 0);
      });
    }

    setStatus("sent");
    setRunning(false);
    setCurrentStep(-1);
  }, [mode, steps]);

  const reset = useCallback(() => {
    clearTimer();
    setRunning(false);
    setCurrentStep(-1);
    setElapsed(0);
    setStatus("idle");
    setUiBlockedUntil(0);
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const totalLatency = steps.reduce((s, st) => s + (st.latency ?? 0), 0);
  const blockingLatency = steps.filter(s => s.isBlocking).reduce((s, st) => s + (st.latency ?? 0), 0);

  const isUiBlocked = running && elapsed < uiBlockedUntil;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 900 }}>
      {/* Left: Chat simulation */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(["legacy", "new"] as FlowMode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); reset(); }} style={{
              background: mode === m ? (m === "legacy" ? "#7f1d1d" : "#052e16") : "#1e293b",
              color: mode === m ? (m === "legacy" ? "#fca5a5" : "#4ade80") : "#64748b",
              border: `1px solid ${mode === m ? (m === "legacy" ? "#991b1b" : "#166534") : "#334155"}`,
              borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700,
            }}>
              {m === "legacy" ? "❌ Legacy Flow" : "✅ New Architecture"}
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div style={{
          background: "#1e293b", border: "1px solid #334155", borderRadius: 12,
          overflow: "hidden", minHeight: 320,
        }}>
          {/* Chat header */}
          <div style={{
            background: "#334155", padding: "10px 14px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>B</div>
              <div>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13 }}>Bob Smith</div>
                <div style={{ color: "#4ade80", fontSize: 11 }}>● Online</div>
              </div>
            </div>
            <div style={{
              color: "#94a3b8", fontSize: 11,
              background: "#1e293b", borderRadius: 6, padding: "4px 10px",
            }}>
              {mode === "legacy" ? "Legacy v1.0" : "New Architecture v2.0"}
            </div>
          </div>

          {/* Messages */}
          <div style={{ padding: "16px 14px", minHeight: 180 }}>
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
              <div style={{
                background: "#334155", borderRadius: "0 10px 10px 10px",
                padding: "8px 12px", fontSize: 13, color: "#e2e8f0", maxWidth: "70%",
              }}>
                Hey! Got your message 👋
              </div>
            </div>

            {(status === "sending" || status === "sent") && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                <div style={{
                  background: mode === "legacy" ? "#1e3a5f" : "#052e16",
                  border: `1px solid ${mode === "legacy" ? "#3b82f6" : "#166534"}`,
                  borderRadius: "10px 0 10px 10px",
                  padding: "8px 12px", fontSize: 13, color: "#e2e8f0", maxWidth: "70%",
                }}>
                  {message}
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 4, textAlign: "right" }}>
                    {status === "sending" && mode === "new" && (
                      <span style={{ color: "#64748b" }}>✓ (optimistic)</span>
                    )}
                    {status === "sent" && <span style={{ color: "#4ade80" }}>✓✓ Delivered</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div style={{
            padding: "10px 14px", borderTop: "1px solid #334155",
            display: "flex", gap: 8, alignItems: "center",
          }}>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={running}
              style={{
                flex: 1, background: "#0f172a", color: "#f1f5f9",
                border: "1px solid #334155", borderRadius: 20,
                padding: "8px 14px", fontSize: 13, fontFamily: "inherit",
                opacity: isUiBlocked ? 0.4 : 1,
              }}
              placeholder="Type a message..."
            />
            <button
              onClick={simulate}
              disabled={running || !message.trim()}
              style={{
                background: running && isUiBlocked ? "#334155" : "#3b82f6",
                color: "#fff", border: "none", borderRadius: 20,
                width: 40, height: 40, cursor: running ? "not-allowed" : "pointer",
                fontSize: 18, opacity: running && isUiBlocked ? 0.4 : 1,
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title={isUiBlocked ? "UI is frozen in legacy mode" : "Send"}
            >
              {running && isUiBlocked ? "🚫" : "➤"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Total latency", value: totalLatency + "ms", color: totalLatency > 1000 ? "#ef4444" : "#4ade80" },
            { label: "UI frozen for", value: blockingLatency + "ms", color: blockingLatency > 500 ? "#ef4444" : "#4ade80" },
            { label: "Elapsed", value: running || status === "sent" ? elapsed + "ms" : "-", color: "#7dd3fc" },
          ].map(stat => (
            <div key={stat.label} style={{
              background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
              padding: "10px 12px", textAlign: "center",
            }}>
              <div style={{ color: stat.color, fontWeight: 800, fontSize: 18, fontFamily: "monospace" }}>
                {stat.value}
              </div>
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {isUiBlocked && (
          <div style={{
            background: "#450a0a", border: "1px solid #7f1d1d",
            borderRadius: 8, padding: "10px 14px",
            color: "#fca5a5", fontSize: 12, fontWeight: 600,
          }}>
            🚫 UI FROZEN — User cannot type, scroll, or interact!
            <span style={{ color: "#f87171", fontFamily: "monospace", marginLeft: 8 }}>
              {elapsed}ms / {uiBlockedUntil}ms
            </span>
          </div>
        )}

        {status === "sent" && (
          <div style={{
            background: "#052e16", border: "1px solid #166534",
            borderRadius: 8, padding: "10px 14px",
            color: "#4ade80", fontSize: 12,
          }}>
            ✅ Message delivered in {elapsed}ms
            {mode === "new" && " — User saw it in ~9ms (optimistic update)!"}
            <button onClick={reset} style={{
              marginLeft: 12, background: "#1e293b", color: "#94a3b8",
              border: "1px solid #334155", borderRadius: 4,
              padding: "2px 8px", cursor: "pointer", fontSize: 11,
            }}>Reset</button>
          </div>
        )}
      </div>

      {/* Right: Step tracker */}
      <div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8, fontWeight: 700 }}>
          {mode === "legacy" ? "❌ Legacy" : "✅ New"} — Step by Step
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 460, overflow: "auto" }}>
          {steps.map((step, i) => {
            const isActive = currentStep === i && running;
            const isDone = currentStep > i || status === "sent";

            return (
              <div key={step.id} style={{
                background: isActive ? "#1e3a5f" : isDone ? "#0a1628" : "#1e293b",
                border: `1px solid ${isActive ? "#3b82f6" : isDone ? "#1e3a5f" : "#334155"}`,
                borderRadius: 6, padding: "7px 10px",
                transition: "all 0.2s", opacity: isDone ? 0.7 : 1,
              }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{
                    fontSize: 13, flexShrink: 0,
                    color: isActive ? "#7dd3fc" : isDone ? "#4ade80" : "#334155",
                  }}>
                    {isActive ? "▶" : isDone ? "✓" : "○"}
                  </span>
                  <span style={{
                    color: isActive ? "#e2e8f0" : isDone ? "#64748b" : "#94a3b8",
                    fontSize: 12, flex: 1,
                  }}>
                    {step.action}
                  </span>
                  {step.latency != null && step.latency > 0 && (
                    <span style={{
                      color: isActive ? "#7dd3fc" : "#475569",
                      fontSize: 10, fontFamily: "monospace",
                    }}>{step.latency}ms</span>
                  )}
                </div>
                {isActive && (step.problem || step.improvement) && (
                  <div style={{
                    marginTop: 5, marginLeft: 22,
                    color: mode === "legacy" ? "#fca5a5" : "#86efac",
                    fontSize: 11,
                  }}>
                    {mode === "legacy" ? `⚠️ ${step.problem}` : `✅ ${step.improvement}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────

export function ArchitectureReviewDemo() {
  const [activeTab, setActiveTab] = useState<Tab>("compare");
  const [perspective, setPerspective] = useState<ArchView>("product");

  const tabs: { id: Tab; label: string }[] = [
    { id: "compare", label: "⚡ Before vs After" },
    { id: "legacy-flow", label: "📋 Legacy Analysis" },
    { id: "new-arch", label: "🏗 New Architecture" },
    { id: "simulate", label: "▶ Live Simulation" },
    { id: "migration", label: "🛤 Migration Plan" },
  ];

  return (
    <div style={{
      background: "#0f172a", color: "#f1f5f9",
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: "100vh", padding: 24,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🏛</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>
              Architecture Review: Message Sending Flow
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Legacy analysis (product + technical) → Proposed new architecture → Migration path
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Legacy Analysis", "Problem Catalog", "New Architecture", "Migration Strategy", "Live Simulation"].map(tag => (
            <span key={tag} style={{
              background: "#1e293b", color: "#94a3b8", border: "1px solid #334155",
              borderRadius: 20, padding: "3px 10px", fontSize: 11,
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4, flexWrap: "wrap" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 14px",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Before vs After ── */}
      {activeTab === "compare" && (
        <div style={{ maxWidth: 900 }}>
          <SectionTitle icon="⚡" title="Before vs After" subtitle="Key improvements at a glance" />

          {/* Latency comparison */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {[
              {
                mode: "Legacy",
                color: "#ef4444",
                metrics: [
                  { label: "User sees message", value: "~1,300ms", highlight: true },
                  { label: "UI frozen", value: "~1,290ms", highlight: true },
                  { label: "FCM failure impact", value: "100% fail", highlight: true },
                  { label: "On network error", value: "Message lost", highlight: true },
                  { label: "Business logic coverage", value: "0%", highlight: true },
                  { label: "Architecture", value: "Monolithic" },
                ],
              },
              {
                mode: "New Architecture",
                color: "#4ade80",
                metrics: [
                  { label: "User sees message", value: "~9ms (optimistic)", highlight: false },
                  { label: "UI frozen", value: "0ms", highlight: false },
                  { label: "FCM failure impact", value: "0% (decoupled)", highlight: false },
                  { label: "On network error", value: "Auto-retry 3x", highlight: false },
                  { label: "Business logic coverage", value: ">90%", highlight: false },
                  { label: "Architecture", value: "Layered + Event-driven" },
                ],
              },
            ].map(col => (
              <div key={col.mode} style={{
                background: "#1e293b", border: `1px solid ${col.color}30`,
                borderTop: `3px solid ${col.color}`, borderRadius: 10, padding: 16,
              }}>
                <div style={{ color: col.color, fontWeight: 800, fontSize: 16, marginBottom: 14 }}>
                  {col.mode === "Legacy" ? "❌ " : "✅ "}{col.mode}
                </div>
                {col.metrics.map(m => (
                  <div key={m.label} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "7px 0", borderBottom: "1px solid #334155",
                    alignItems: "center",
                  }}>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>{m.label}</span>
                    <span style={{
                      color: m.highlight ? "#ef4444" : col.color,
                      fontWeight: 700, fontSize: 13, fontFamily: "monospace",
                    }}>{m.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Problem catalog */}
          <SectionTitle icon="⚠️" title="Problem Catalog" subtitle="Issues identified in legacy flow analysis" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PROBLEMS.map(p => {
              const colors = SEVERITY_COLORS[p.severity as keyof typeof SEVERITY_COLORS];
              return (
                <div key={p.id} style={{
                  background: colors.bg, border: `1px solid ${colors.border}`,
                  borderRadius: 10, padding: "12px 16px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors.dot, flexShrink: 0 }} />
                    <span style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>
                      {p.severity.toUpperCase()}
                    </span>
                    <span style={{ color: "#475569", fontSize: 10, background: "#1e293b", borderRadius: 4, padding: "1px 6px" }}>
                      {p.category}
                    </span>
                    <span style={{ color: colors.text, fontWeight: 700, fontSize: 13 }}>{p.title}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 12 }}>
                    <div>
                      <div style={{ color: "#64748b", marginBottom: 3 }}>Legacy behavior:</div>
                      <div style={{ color: colors.text }}>{p.legacy}</div>
                    </div>
                    <div>
                      <div style={{ color: "#64748b", marginBottom: 3 }}>Business impact:</div>
                      <div style={{ color: "#fbbf24" }}>{p.impact}</div>
                    </div>
                    <div>
                      <div style={{ color: "#64748b", marginBottom: 3 }}>Proposed fix:</div>
                      <div style={{ color: "#4ade80" }}>{p.fix}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Legacy Flow ── */}
      {activeTab === "legacy-flow" && (
        <div style={{ maxWidth: 860, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <SectionTitle
              icon="📋"
              title="Legacy Flow Documentation"
              subtitle="Analyzed from both perspectives — click any step for details"
            />
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {(["product", "technical"] as ArchView[]).map(v => (
                <button key={v} onClick={() => setPerspective(v)} style={{
                  background: perspective === v ? "#1e3a5f" : "#1e293b",
                  color: perspective === v ? "#7dd3fc" : "#64748b",
                  border: `1px solid ${perspective === v ? "#3b82f6" : "#334155"}`,
                  borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
                }}>
                  {v === "product" ? "👤 Product View" : "⚙️ Technical View"}
                </button>
              ))}
            </div>
            <FlowDiagram steps={LEGACY_STEPS} mode="legacy" perspective={perspective} />
          </div>

          <div>
            <SectionTitle icon="📊" title="Metrics Collected" subtitle="Data gathered during analysis phase" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { metric: "Average send latency (P50)", value: "890ms", source: "Network tab profiling" },
                { metric: "Average send latency (P95)", value: "2,400ms", source: "Network tab profiling" },
                { metric: "UI freeze duration", value: "1,290ms", source: "Performance timeline" },
                { metric: "Message drop rate (mobile)", value: "~3%", source: "Error tracking (Sentry)" },
                { metric: "FCM timeout failures", value: "~2x/year", source: "Incident postmortems" },
                { metric: "Test coverage (business logic)", value: "0%", source: "Jest coverage report" },
                { metric: "Send abandon rate (3G)", value: "25%", source: "Analytics funnel" },
                { metric: "Files with mixed concerns", value: "12/15", source: "Manual code audit" },
              ].map(m => (
                <div key={m.metric} style={{
                  background: "#1e293b", border: "1px solid #334155",
                  borderRadius: 8, padding: "10px 14px",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{m.metric}</div>
                    <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>Source: {m.source}</div>
                  </div>
                  <div style={{
                    color: "#ef4444", fontWeight: 800, fontSize: 16, fontFamily: "monospace",
                    flexShrink: 0,
                  }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── New Architecture ── */}
      {activeTab === "new-arch" && (
        <div style={{ maxWidth: 900 }}>
          <SectionTitle
            icon="🏗"
            title="Proposed New Architecture"
            subtitle="Layered, event-driven, testable — click any step for improvements"
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {(["product", "technical"] as ArchView[]).map(v => (
                  <button key={v} onClick={() => setPerspective(v)} style={{
                    background: perspective === v ? "#052e16" : "#1e293b",
                    color: perspective === v ? "#4ade80" : "#64748b",
                    border: `1px solid ${perspective === v ? "#166534" : "#334155"}`,
                    borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  }}>
                    {v === "product" ? "👤 Product View" : "⚙️ Technical View"}
                  </button>
                ))}
              </div>
              <FlowDiagram steps={NEW_STEPS} mode="new" perspective={perspective} />
            </div>

            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
                Architectural Principles Applied
              </div>
              {[
                {
                  principle: "Optimistic UI",
                  detail: "Show result before server confirms. Rollback on failure.",
                  icon: "⚡",
                  color: "#a78bfa",
                },
                {
                  principle: "Command Pattern",
                  detail: "SendMessageCommand dispatched via EventBus — UI decoupled from service.",
                  icon: "📨",
                  color: "#7dd3fc",
                },
                {
                  principle: "Retry + Circuit Breaker",
                  detail: "Exponential backoff: 1s, 2s, 4s. Circuit breaks after 5 consecutive failures.",
                  icon: "🔄",
                  color: "#4ade80",
                },
                {
                  principle: "Message Queue (Kafka)",
                  detail: "Persistence and notification decoupled. FCM failure never affects send.",
                  icon: "📬",
                  color: "#fbbf24",
                },
                {
                  principle: "Separation of Concerns",
                  detail: "Validation / Network / State / Analytics — each in their own layer.",
                  icon: "🎯",
                  color: "#f472b6",
                },
                {
                  principle: "Off-Main-Thread Analytics",
                  detail: "Web Worker for Segment — analytics never block the UI thread.",
                  icon: "🧵",
                  color: "#94a3b8",
                },
              ].map(item => (
                <div key={item.principle} style={{
                  background: "#1e293b", border: `1px solid ${item.color}30`,
                  borderLeft: `3px solid ${item.color}`,
                  borderRadius: 8, padding: "10px 14px", marginBottom: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span>{item.icon}</span>
                    <span style={{ color: item.color, fontWeight: 700, fontSize: 13 }}>{item.principle}</span>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Live Simulation ── */}
      {activeTab === "simulate" && (
        <div>
          <SectionTitle
            icon="▶"
            title="Live Simulation"
            subtitle="Run both flows and feel the difference — watch the step tracker in real-time"
          />
          <FlowSimulator />
        </div>
      )}

      {/* ── Migration Plan ── */}
      {activeTab === "migration" && (
        <div style={{ maxWidth: 800 }}>
          <SectionTitle
            icon="🛤"
            title="Migration Strategy"
            subtitle="Incremental path from legacy to new architecture — zero big-bang rewrites"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                phase: "Phase 1",
                title: "Extract & Test Business Logic",
                duration: "Sprint 1 (2 weeks)",
                color: "#6366f1",
                tasks: [
                  "Extract validation logic from SendButton.onClick() → pure validate() function",
                  "Extract payload formatting → pure formatPayload() function",
                  "Write unit tests for each extracted function (target: 90% coverage)",
                  "No behavior change — only extraction. All tests green.",
                ],
                risk: "Low — no behavior change, only extraction",
                deliverable: "90% test coverage on business logic",
              },
              {
                phase: "Phase 2",
                title: "Optimistic Updates",
                duration: "Sprint 2 (2 weeks)",
                color: "#0891b2",
                tasks: [
                  "Add optimistic message update in local MessageStore",
                  "Assign tempId to optimistic messages (pending state)",
                  "On API success: replace tempId with real server id",
                  "On API failure: remove optimistic message + show error toast",
                  "Feature flag: ENABLE_OPTIMISTIC_SEND (rollback if issues)",
                ],
                risk: "Medium — visible UX change. A/B test with 10% traffic first",
                deliverable: "User sees message in <10ms instead of 1.3s",
              },
              {
                phase: "Phase 3",
                title: "Command Queue + Retry Logic",
                duration: "Sprint 3 (2 weeks)",
                color: "#10b981",
                tasks: [
                  "Implement MessageCommandHandler with retry (3x, exponential backoff)",
                  "Replace direct fetch() call with command dispatch",
                  "Add AbortController for 5s timeout enforcement",
                  "Persist pending commands to IndexedDB (survive page refresh!)",
                  "Integration tests: verify retry behavior on network failure",
                ],
                risk: "Medium — core flow change. Shadow mode first (send both ways, compare)",
                deliverable: "3% message drop rate → ~0%",
              },
              {
                phase: "Phase 4",
                title: "Decouple Notifications (Kafka)",
                duration: "Sprint 4-5 (Backend + Frontend)",
                color: "#ec4899",
                tasks: [
                  "[Backend] Move FCM call from API handler to Kafka consumer",
                  "[Backend] API returns 202 Accepted immediately (not waiting for FCM)",
                  "[Frontend] Update success handler to expect 202 instead of 200",
                  "[Backend] Add dead letter queue for failed FCM messages",
                  "Load test: FCM failure should not impact message success rate",
                ],
                risk: "High — requires backend changes. Needs cross-team coordination",
                deliverable: "FCM failure impact: 100% → 0%",
              },
              {
                phase: "Phase 5",
                title: "Analytics to Web Worker",
                duration: "Sprint 6 (1 week)",
                color: "#f59e0b",
                tasks: [
                  "Create analytics.worker.ts (receives track events via postMessage)",
                  "Move Segment initialization + track() calls to worker",
                  "Main thread: postMessage({ type: 'track', event: 'message_sent' })",
                  "Verify: Segment slowness no longer affects UI performance",
                ],
                risk: "Low — analytics failure is non-critical by definition",
                deliverable: "Main thread completely free of analytics overhead",
              },
            ].map((phase, i) => (
              <div key={phase.phase} style={{
                background: "#1e293b",
                border: `1px solid ${phase.color}30`,
                borderLeft: `4px solid ${phase.color}`,
                borderRadius: 10, padding: "14px 18px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      background: `${phase.color}20`, color: phase.color,
                      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                    }}>{phase.phase}</span>
                    <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>{phase.title}</span>
                  </div>
                  <span style={{ color: "#64748b", fontSize: 12 }}>{phase.duration}</span>
                </div>
                <ul style={{ margin: "0 0 10px 0", padding: "0 0 0 18px" }}>
                  {phase.tasks.map((t, j) => (
                    <li key={j} style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>{t}</li>
                  ))}
                </ul>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ background: "#0f172a", borderRadius: 6, padding: "6px 10px", fontSize: 11 }}>
                    <span style={{ color: "#64748b" }}>Risk: </span>
                    <span style={{ color: "#fbbf24" }}>{phase.risk}</span>
                  </div>
                  <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 6, padding: "6px 10px", fontSize: 11 }}>
                    <span style={{ color: "#64748b" }}>✅ Deliverable: </span>
                    <span style={{ color: "#4ade80" }}>{phase.deliverable}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ArchitectureReviewDemo;
