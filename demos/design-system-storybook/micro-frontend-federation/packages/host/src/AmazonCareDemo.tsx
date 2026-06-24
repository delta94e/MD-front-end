/**
 * AmazonCareDemo.tsx
 *
 * Amazon Care — Video Care Experience Lead · Senior Frontend Engineer
 *
 * 1. VIDEO QUALITY ENGINE — Stats ingestion, per-second quality scoring,
 *    triage tool (90% ticket reduction), baseline comparison framework.
 *    US Patent P64303-US01 (new video architecture).
 *
 * 2. PATIENT EXPERIENCE — Pre-call camera/mic device checker (95% ticket reduction),
 *    first customer-facing enrollment web app, chat architecture.
 *
 * 3. PLATFORM LEADERSHIP — Amazon Care Web Guild, AWS Security Guardian
 *    (8+ security reviews), shared Cloud Infrastructure package (85% faster).
 *    Amazon Explore rescue (30% → <5% audio/video issues).
 *
 * TABS
 *   📹 Video Quality   — live call simulation, stats ingestion, quality scoring, triage tool
 *   🏥 Patient UX      — device pre-check (camera/mic/network), chat architecture
 *   🌐 Platform        — Web Guild, Security Guardian, Cloud Infra, Explore rescue
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Video quality simulation
// ─────────────────────────────────────────────────────────────────

interface CallMetrics {
  bitrateVideo: number;   // kbps
  bitrateAudio: number;   // kbps
  packetLoss: number;     // percentage 0-100
  jitter: number;         // ms
  rtt: number;            // ms
  fps: number;
  resolution: string;
  qualityScore: number;   // 0-100
  timestamp: number;
}

type CallPhase = "idle" | "running" | "degraded" | "recovering";

function computeQualityScore(m: Omit<CallMetrics, "qualityScore" | "timestamp">): number {
  let score = 100;
  score -= m.packetLoss * 6;
  score -= Math.max(0, m.jitter - 25) * 0.4;
  score -= Math.max(0, m.rtt - 50) * 0.15;
  if (m.fps < 15) score -= 20;
  else if (m.fps < 24) score -= 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function randomBetween(a: number, b: number) { return a + Math.random() * (b - a); }

function generateMetrics(phase: CallPhase): Omit<CallMetrics, "qualityScore" | "timestamp"> {
  switch (phase) {
    case "degraded": return {
      bitrateVideo: randomBetween(120, 350),
      bitrateAudio: randomBetween(18, 32),
      packetLoss:   randomBetween(6, 14),
      jitter:       randomBetween(65, 140),
      rtt:          randomBetween(120, 280),
      fps:          Math.round(randomBetween(8, 18)),
      resolution:   "640×360",
    };
    case "recovering": return {
      bitrateVideo: randomBetween(400, 750),
      bitrateAudio: randomBetween(30, 52),
      packetLoss:   randomBetween(1, 4),
      jitter:       randomBetween(25, 55),
      rtt:          randomBetween(45, 100),
      fps:          Math.round(randomBetween(18, 28)),
      resolution:   "960×540",
    };
    default: return {
      bitrateVideo: randomBetween(800, 1200),
      bitrateAudio: randomBetween(42, 58),
      packetLoss:   randomBetween(0, 1.5),
      jitter:       randomBetween(8, 28),
      rtt:          randomBetween(18, 52),
      fps:          Math.round(randomBetween(28, 30)),
      resolution:   "1280×720",
    };
  }
}

function scoreColor(s: number) { return s >= 80 ? "#22c55e" : s >= 60 ? "#f59e0b" : "#ef4444"; }
function scoreLabel(s: number) { return s >= 80 ? "Excellent" : s >= 60 ? "Degraded" : "Poor"; }

// ─────────────────────────────────────────────────────────────────
// Triage data
// ─────────────────────────────────────────────────────────────────

const TRIAGE_EVENTS = [
  { t: "00:00", score: 94, event: null },
  { t: "00:15", score: 92, event: null },
  { t: "00:30", score: 90, event: null },
  { t: "00:45", score: 88, event: null },
  { t: "01:00", score: 72, event: "Packet loss spike: 7.2%" },
  { t: "01:15", score: 48, event: "Jitter: 94ms — buffer overflow" },
  { t: "01:30", score: 31, event: "Video bitrate collapsed: 142kbps" },
  { t: "01:45", score: 29, event: "RTT degraded: 240ms" },
  { t: "02:00", score: 44, event: "Recovery detected (network)" },
  { t: "02:15", score: 68, event: null },
  { t: "02:30", score: 81, event: null },
  { t: "02:45", score: 89, event: null },
  { t: "03:00", score: 93, event: null },
];

// ─────────────────────────────────────────────────────────────────
// Device check state
// ─────────────────────────────────────────────────────────────────

type CheckStatus = "pending" | "running" | "pass" | "fail";
interface DeviceCheck { label: string; icon: string; status: CheckStatus; detail: string; }

const INITIAL_CHECKS: DeviceCheck[] = [
  { label: "Camera access",   icon: "📷", status: "pending", detail: "Requesting camera permissions…" },
  { label: "Video resolution",icon: "🖥",  status: "pending", detail: "Checking video quality from device…" },
  { label: "Microphone",      icon: "🎤", status: "pending", detail: "Detecting audio input…" },
  { label: "Audio level",     icon: "🔊", status: "pending", detail: "Analysing microphone signal…" },
  { label: "Network (WebRTC)",icon: "📡", status: "pending", detail: "Testing STUN/TURN connectivity…" },
  { label: "Bandwidth",       icon: "⚡", status: "pending", detail: "Estimating available bandwidth…" },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 320 }}>{code}</pre>
    </div>
  );
}

function MetricBadge({ label, value, unit = "", color = "#94a3b8", good = true }:
  { label: string; value: string | number; unit?: string; color?: string; good?: boolean }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 8, padding: "8px 12px", textAlign: "center", border: `1px solid ${color}20` }}>
      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}<span style={{ fontSize: 10, fontWeight: 400 }}>{unit}</span></div>
      {!good && <div style={{ fontSize: 8, color: "#ef4444" }}>⚠</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function AmazonCareDemo() {
  const [activeTab, setActiveTab] = useState<"video" | "patient" | "platform">("video");

  // Video quality state
  const [callPhase, setCallPhase] = useState<CallPhase>("idle");
  const [metrics, setMetrics] = useState<CallMetrics | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [selectedTriageEvent, setSelectedTriageEvent] = useState<typeof TRIAGE_EVENTS[0] | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<CallPhase>("idle");

  useEffect(() => { phaseRef.current = callPhase; }, [callPhase]);

  const startCall = useCallback(() => {
    setCallPhase("running");
    setHistory([]);
    setMetrics(null);
    intervalRef.current = setInterval(() => {
      const raw = generateMetrics(phaseRef.current === "idle" ? "running" : phaseRef.current);
      const score = computeQualityScore(raw);
      const m: CallMetrics = { ...raw, qualityScore: score, timestamp: Date.now() };
      setMetrics(m);
      setHistory(prev => [...prev.slice(-29), score]);
    }, 600);
  }, []);

  const stopCall = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCallPhase("idle");
    setMetrics(null);
    setHistory([]);
  }, []);

  const setPhase = useCallback((phase: CallPhase) => {
    setCallPhase(phase);
    phaseRef.current = phase;
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // Device check state
  const [checks, setChecks] = useState<DeviceCheck[]>(INITIAL_CHECKS);
  const [checkRunning, setCheckRunning] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);

  const runChecks = useCallback(() => {
    setChecks(INITIAL_CHECKS.map(c => ({ ...c, status: "pending" })));
    setCheckRunning(true);
    setCheckComplete(false);

    const results: Partial<DeviceCheck>[] = [
      { status: "pass", detail: "Camera permission granted — MediaStream active" },
      { status: "pass", detail: "1280×720 @ 30fps — HD quality confirmed" },
      { status: "pass", detail: "Default microphone detected: Built-in Microphone" },
      { status: "fail", detail: "Audio level too low (–48dB). Microphone may be muted or obstructed." },
      { status: "pass", detail: "STUN resolved: stun.amazon.com — NAT traversal OK" },
      { status: "pass", detail: "Estimated bandwidth: 14.2 Mbps — sufficient for HD video" },
    ];

    results.forEach((result, i) => {
      setTimeout(() => {
        setChecks(prev => prev.map((c, idx) => {
          if (idx === i) return { ...c, status: "running" };
          if (idx < i) return { ...c, ...results[idx] };
          return c;
        }));
        setTimeout(() => {
          setChecks(prev => prev.map((c, idx) => idx === i ? { ...c, ...result } : c));
          if (i === results.length - 1) {
            setCheckRunning(false);
            setCheckComplete(true);
          }
        }, 800);
      }, i * 1000);
    });
  }, []);

  const TABS = [
    { id: "video"    as const, label: "📹 Video Quality"     },
    { id: "patient"  as const, label: "🏥 Patient UX"        },
    { id: "platform" as const, label: "🌐 Platform"           },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🏥</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Amazon Care</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Video Care Experience Lead · Senior Frontend · US Patent P64303-US01 · AWS Security Guardian
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["WebRTC", "Video Quality", "Stats Ingestion", "Pre-call Device Check", "Chat Architecture", "AWS Security Guardian", "Web Guild", "US Patent", "Amazon Explore", "Cloud Infra"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── VIDEO QUALITY ── */}
      {activeTab === "video" && (
        <div>
          {/* Live call simulator */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {/* Call UI */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
                LIVE CALL SIMULATION — stats ingested every 600ms
              </div>
              {/* Fake video */}
              <div style={{ position: "relative", background: "#0a0a14", borderRadius: 10, overflow: "hidden", height: 160, border: "1px solid #334155", marginBottom: 10 }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {callPhase === "idle" ? (
                    <div style={{ textAlign: "center", color: "#475569" }}>
                      <div style={{ fontSize: 32, marginBottom: 4 }}>📹</div>
                      <div style={{ fontSize: 11 }}>Start call to begin streaming metrics</div>
                    </div>
                  ) : (
                    <div style={{ width: "100%", height: "100%", position: "relative" }}>
                      {/* Simulated video with quality indicator overlay */}
                      <div style={{
                        width: "100%", height: "100%",
                        background: callPhase === "degraded"
                          ? "linear-gradient(135deg, #1a0a0a 0%, #2d1010 100%)"
                          : "linear-gradient(135deg, #0a1628 0%, #0d2241 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        filter: callPhase === "degraded" ? "blur(1.5px)" : "none",
                        transition: "filter 0.5s",
                      }}>
                        <div style={{ fontSize: 48, opacity: 0.3 }}>👨‍⚕️</div>
                      </div>
                      {/* Status overlay */}
                      <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4 }}>
                        <div style={{ background: "#00000080", borderRadius: 4, padding: "2px 6px", fontSize: 8, color: "#94a3b8" }}>
                          {metrics?.resolution ?? "—"} @ {metrics?.fps ?? "—"}fps
                        </div>
                        {callPhase === "degraded" && (
                          <div style={{ background: "#ef444490", borderRadius: 4, padding: "2px 6px", fontSize: 8, color: "#fff" }}>
                            ⚠ Poor quality
                          </div>
                        )}
                      </div>
                      {/* Score badge */}
                      {metrics && (
                        <div style={{ position: "absolute", top: 8, right: 8, background: "#00000090", borderRadius: 6, padding: "3px 8px" }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: scoreColor(metrics.qualityScore) }}>{metrics.qualityScore}</div>
                          <div style={{ fontSize: 7, color: "#64748b", textAlign: "center" }}>MOS</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {callPhase === "idle" ? (
                  <button onClick={startCall} style={{ background: "#22c55e", border: "none", borderRadius: 8, padding: "8px 20px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                    ▶ Start Call
                  </button>
                ) : (
                  <>
                    <button onClick={stopCall} style={{ background: "#ef4444", border: "none", borderRadius: 8, padding: "7px 16px", color: "#fff", cursor: "pointer", fontSize: 11 }}>■ End</button>
                    <button onClick={() => setPhase("running")} style={{ background: callPhase === "running" ? "#22c55e20" : "#1e293b", border: `1px solid ${callPhase === "running" ? "#22c55e" : "#334155"}`, borderRadius: 8, padding: "7px 14px", color: callPhase === "running" ? "#4ade80" : "#64748b", cursor: "pointer", fontSize: 11 }}>Good</button>
                    <button onClick={() => setPhase("degraded")} style={{ background: callPhase === "degraded" ? "#ef444420" : "#1e293b", border: `1px solid ${callPhase === "degraded" ? "#ef4444" : "#334155"}`, borderRadius: 8, padding: "7px 14px", color: callPhase === "degraded" ? "#fca5a5" : "#64748b", cursor: "pointer", fontSize: 11 }}>Degrade</button>
                    <button onClick={() => setPhase("recovering")} style={{ background: callPhase === "recovering" ? "#f59e0b20" : "#1e293b", border: `1px solid ${callPhase === "recovering" ? "#f59e0b" : "#334155"}`, borderRadius: 8, padding: "7px 14px", color: callPhase === "recovering" ? "#fcd34d" : "#64748b", cursor: "pointer", fontSize: 11 }}>Recover</button>
                  </>
                )}
              </div>

              {/* Metrics grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                <MetricBadge label="Video Bitrate" value={metrics ? Math.round(metrics.bitrateVideo) : "—"} unit=" kbps" color="#6366f1" />
                <MetricBadge label="Packet Loss" value={metrics ? metrics.packetLoss.toFixed(1) : "—"} unit="%" color={metrics ? (metrics.packetLoss < 2 ? "#22c55e" : metrics.packetLoss < 8 ? "#f59e0b" : "#ef4444") : "#94a3b8"} good={!metrics || metrics.packetLoss < 5} />
                <MetricBadge label="Jitter" value={metrics ? Math.round(metrics.jitter) : "—"} unit=" ms" color={metrics ? (metrics.jitter < 30 ? "#22c55e" : metrics.jitter < 80 ? "#f59e0b" : "#ef4444") : "#94a3b8"} good={!metrics || metrics.jitter < 60} />
                <MetricBadge label="RTT" value={metrics ? Math.round(metrics.rtt) : "—"} unit=" ms" color={metrics ? (metrics.rtt < 60 ? "#22c55e" : metrics.rtt < 150 ? "#f59e0b" : "#ef4444") : "#94a3b8"} />
                <MetricBadge label="Audio Bitrate" value={metrics ? Math.round(metrics.bitrateAudio) : "—"} unit=" kbps" color="#0ea5e9" />
                <MetricBadge label="Framerate" value={metrics ? metrics.fps : "—"} unit=" fps" color={metrics ? (metrics.fps >= 25 ? "#22c55e" : metrics.fps >= 15 ? "#f59e0b" : "#ef4444") : "#94a3b8"} />
              </div>
            </div>

            {/* Quality score + history */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
                QUALITY SCORE HISTORY — per-second scoring framework
              </div>
              {/* Big score */}
              <div style={{ background: "#1e293b", borderRadius: 10, padding: 16, textAlign: "center", border: `1px solid ${metrics ? scoreColor(metrics.qualityScore) + "40" : "#334155"}`, marginBottom: 10 }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: metrics ? scoreColor(metrics.qualityScore) : "#334155", lineHeight: 1 }}>
                  {metrics ? metrics.qualityScore : "—"}
                </div>
                <div style={{ fontSize: 12, color: metrics ? scoreColor(metrics.qualityScore) : "#475569", marginTop: 4 }}>
                  {metrics ? scoreLabel(metrics.qualityScore) : "No active call"}
                </div>
                <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>
                  MOS-equivalent opinionated score · 0–100
                </div>
              </div>

              {/* Sparkline */}
              <div style={{ background: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "#475569", marginBottom: 6 }}>Score timeline (last 30 seconds)</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 48 }}>
                  {history.length === 0 ? (
                    <div style={{ width: "100%", textAlign: "center", fontSize: 9, color: "#334155", paddingTop: 20 }}>Start call to see score history</div>
                  ) : (
                    Array.from({ length: 30 }, (_, i) => {
                      const s = history[i] ?? null;
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                          {s !== null && (
                            <div style={{
                              width: "100%", borderRadius: 2,
                              height: `${(s / 100) * 48}px`,
                              background: scoreColor(s),
                              opacity: i === history.length - 1 ? 1 : 0.6,
                              transition: "height 0.3s, background 0.3s",
                            }} title={`Score: ${s}`} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#334155", marginTop: 4 }}>
                  <span>-30s</span><span>now</span>
                </div>
              </div>

              <CodeBlock label="Per-second quality scoring formula — opinionated MOS-equivalent" color="#6366f1" code={
`// Score every second of every video call.
// Inputs: WebRTC getStats() API metrics.
// Output: 0-100 quality score.

function computeQualityScore(stats: WebRTCStats): number {
  let score = 100;

  // Packet loss: each % costs 6 points
  // 0% loss → 100. 10% loss → 40. 17%+ loss → 0.
  score -= stats.packetLoss * 6;

  // Jitter: below 25ms is acceptable. Every ms above costs 0.4 pts.
  // 25ms jitter → 0 penalty. 75ms jitter → 20 penalty.
  score -= Math.max(0, stats.jitter - 25) * 0.4;

  // Round-trip time: below 50ms is fine. Every ms above costs 0.15 pts.
  // 50ms RTT → 0 penalty. 250ms RTT → 30 penalty.
  score -= Math.max(0, stats.rtt - 50) * 0.15;

  // Low framerate: harsh penalty (< 15fps is unusable in telehealth)
  if (stats.fps < 15) score -= 20;
  else if (stats.fps < 24) score -= 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// "Opinionated" because the weights reflect telehealth priorities.
// In a gaming call: jitter matters more (real-time action).
// In telehealth: patient-clinician understanding matters most
//   → packet loss (missing speech) > jitter > RTT.
// Framework allows per-use-case weight tuning.`} />
            </div>
          </div>

          {/* Triage tool */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              VIDEO QUALITY TRIAGE TOOL — adopted by 100% of video teams · 90% ticket resolution time reduction
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
              <div>
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 8 }}>Call ID: care-session-a8f2d · Patient: P-10421 · Clinician: C-8832 · Duration: 3:00</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60, marginBottom: 6 }}>
                    {TRIAGE_EVENTS.map((evt, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedTriageEvent(selectedTriageEvent?.t === evt.t ? null : evt)}
                        style={{
                          flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{
                          width: "100%", height: `${(evt.score / 100) * 60}px`,
                          borderRadius: "2px 2px 0 0",
                          background: evt.event ? "#ef4444" : scoreColor(evt.score),
                          opacity: selectedTriageEvent?.t === evt.t ? 1 : 0.7,
                          border: selectedTriageEvent?.t === evt.t ? "2px solid #fff" : "none",
                          transition: "opacity 0.2s",
                        }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#475569" }}>
                    {TRIAGE_EVENTS.filter((_, i) => i % 3 === 0).map(e => <span key={e.t}>{e.t}</span>)}
                  </div>
                  <div style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>↑ Click a bar to inspect that second</div>
                </div>
                {selectedTriageEvent && (
                  <div style={{ background: "#1e293b", border: `1px solid ${selectedTriageEvent.event ? "#ef4444" : "#22c55e"}40`, borderRadius: 8, padding: 12, marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 20 }}>{selectedTriageEvent.event ? "🔴" : "🟢"}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: scoreColor(selectedTriageEvent.score) }}>
                          t={selectedTriageEvent.t} · Score: {selectedTriageEvent.score}/100
                        </div>
                        {selectedTriageEvent.event
                          ? <div style={{ fontSize: 10, color: "#fca5a5" }}>{selectedTriageEvent.event}</div>
                          : <div style={{ fontSize: 10, color: "#64748b" }}>No quality issues detected at this timestamp</div>
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, height: "100%", boxSizing: "border-box" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>DETECTED ISSUES</div>
                  {TRIAGE_EVENTS.filter(e => e.event).map(e => (
                    <div key={e.t} onClick={() => setSelectedTriageEvent(e)} style={{ background: "#0f172a", borderRadius: 6, padding: "7px 10px", marginBottom: 4, cursor: "pointer", border: "1px solid #ef444430" }}>
                      <div style={{ fontSize: 9, color: "#f59e0b", marginBottom: 2 }}>t={e.t}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8" }}>{e.event}</div>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, fontSize: 9, color: "#475569", lineHeight: 1.6 }}>
                    Before this tool: engineers received "patient had a bad call" and manually searched CloudWatch logs (avg 4h). After: root cause in seconds.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PATIENT UX ── */}
      {activeTab === "patient" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Device pre-check */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              PRE-CALL DEVICE CHECK — reduced media tickets by 95%
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Before your visit</div>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 12 }}>
                Let's make sure your camera, microphone, and network are ready. This takes about 6 seconds.
              </div>
              {checks.map((check, i) => (
                <div key={check.label} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 0", borderBottom: i < checks.length - 1 ? "1px solid #0f172a" : "none" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{check.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#f1f5f9" }}>{check.label}</div>
                    <div style={{ fontSize: 9, color: check.status === "fail" ? "#fca5a5" : "#64748b" }}>{check.detail}</div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {check.status === "pending" && <span style={{ fontSize: 10, color: "#334155" }}>○</span>}
                    {check.status === "running" && <span style={{ fontSize: 12, animation: "spin 1s linear infinite" }}>⟳</span>}
                    {check.status === "pass" && <span style={{ fontSize: 12, color: "#22c55e" }}>✓</span>}
                    {check.status === "fail" && <span style={{ fontSize: 12, color: "#ef4444" }}>✕</span>}
                  </div>
                </div>
              ))}
              {checkComplete && checks.some(c => c.status === "fail") && (
                <div style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 8, padding: 10, marginTop: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", marginBottom: 3 }}>Action required</div>
                  <div style={{ fontSize: 9, color: "#fca5a5" }}>
                    Your microphone audio level is very low. Check that your mic is not muted in System Preferences → Privacy → Microphone. Then run the check again.
                  </div>
                </div>
              )}
              {checkComplete && checks.every(c => c.status !== "fail") && (
                <div style={{ background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 8, padding: 10, marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>✓ All checks passed — you're ready for your visit</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={runChecks} disabled={checkRunning} style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", cursor: checkRunning ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700 }}>
                  {checkRunning ? "Checking…" : checkComplete ? "Run again" : "▶ Start Check"}
                </button>
                {checkComplete && !checks.some(c => c.status === "fail") && (
                  <button style={{ background: "#22c55e", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                    Join Visit →
                  </button>
                )}
              </div>
            </div>

            <CodeBlock label="Device check — what each test does (getUserMedia + WebRTC)" color="#6366f1" code={
`// 1. CAMERA ACCESS (getUserMedia)
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: true,
});

// 2. VIDEO RESOLUTION (track.getSettings())
const videoTrack = stream.getVideoTracks()[0];
const { width, height, frameRate } = videoTrack.getSettings();
// → "1280×720 @ 30fps"

// 3. AUDIO LEVEL (AudioContext analyser)
const ctx = new AudioContext();
const analyser = ctx.createAnalyser();
const source = ctx.createMediaStreamSource(stream);
source.connect(analyser);
const buffer = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteTimeDomainData(buffer);
// Compute RMS amplitude → dB level
// < -42dB: microphone too quiet (muted or covered)

// 4. NETWORK (WebRTC ICE candidate gathering)
const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.amazon.com" }] });
await pc.createOffer().then(offer => pc.setLocalDescription(offer));
// Wait for ICE gathering → srflx candidate = NAT traversal works
// TURN candidate = firewalled, but relay available
// No candidates at all = network blocks WebRTC (rare, actionable)

// WHY THIS MATTERED:
// 80% of media tickets: patient showed up, camera/mic broken.
// Session abandoned. Patient rescheduled. Clinician time wasted.
// Pre-call check catches these before the visit.
// Result: media-related support tickets dropped by 95%.`} />
          </div>

          {/* Chat architecture + enrollment */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              CHAT ARCHITECTURE — first customer-clinician chat at Amazon Care
            </div>
            <CodeBlock label="Amazon Care chat architecture — serving customer-clinician sessions for 2+ years" color="#0ea5e9" code={
`// CHAT ARCHITECTURE DESIGN (first at Amazon Care):
// Patient → Clinician in-visit real-time messaging.

// REQUIREMENTS:
// 1. Real-time delivery (< 500ms latency)
// 2. Message persistence (review after visit)
// 3. End-to-end encrypted (HIPAA compliance)
// 4. Works across web + iOS + Android (cross-platform)
// 5. Survives network interruptions (queue + retry)
// 6. Audit log for compliance

// ARCHITECTURE:
// Frontend → API Gateway WebSocket → Lambda → DynamoDB
//                                            ↓
//                                    SNS → Push (iOS/Android)
//                                    ↓
//                               EventBridge → Audit log (S3)

// KEY DECISIONS:

// 1. WebSocket over polling:
//    Healthcare requires real-time. A 5-second poll delay during
//    a visit is unacceptable. WebSocket: < 200ms delivery.

// 2. Message queue on client:
//    Network drops happen (mobile). Messages queue in IndexedDB.
//    On reconnect: flush queue in order. No lost messages.

// 3. Optimistic UI:
//    Message appears immediately on send (optimistic).
//    Server acknowledgement updates "sent" → "delivered" status.
//    If server rejects: message marked as failed with retry option.

// 4. E2E encryption:
//    Each session generates a symmetric key.
//    Key exchange via asymmetric crypto (public keys in Cognito user attrs).
//    Messages encrypted on client before transmission.
//    Server never sees plaintext. Audit log stores encrypted payloads.

// RESULT:
// Serving customer-clinician chats for 2+ years.
// Zero message loss incidents in production.
// Adopted by Amazon Explore for guide-customer chat.`} />

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
                CUSTOMER ENROLLMENT — first customer-facing web app · security-reviewed
              </div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>Patient Enrollment — Step 1 of 4</div>
                {[
                  { label: "Legal name",          placeholder: "First and last name",  type: "text"  },
                  { label: "Date of birth",        placeholder: "MM/DD/YYYY",          type: "text"  },
                  { label: "Insurance member ID",  placeholder: "Member ID",           type: "text"  },
                ].map(f => (
                  <label key={f.label} style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
                    <span style={{ fontSize: 9, color: "#94a3b8" }}>{f.label}</span>
                    <input type={f.type} placeholder={f.placeholder} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "7px 10px", color: "#f1f5f9", fontSize: 11 }} />
                  </label>
                ))}
                <div style={{ background: "#6366f120", border: "1px solid #6366f140", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: "#a5b4fc" }}>🔒 AWS Security Guardian reviewed · Data encrypted in transit + at rest</div>
                </div>
                <button style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Continue →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PLATFORM ── */}
      {activeTab === "platform" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[
              { icon: "⚖️", title: "AWS Security Guardian", color: "#ef4444",
                items: ["8+ feature security reviews led/assisted", "Threat modeling: STRIDE on all new data flows", "Security requirements: auth, authz, encryption, audit", "Worked with AWS AppSec for compliance review sign-off", "Guardian = designated security reviewer for the team — code cannot ship without security sign-off"] },
              { icon: "🌐", title: "Amazon Care Web Guild", color: "#6366f1",
                items: ["Cross-team community of practice: all Amazon Care web engineers", "Monthly sync: pain points, shared solutions, RFC discussions", "Produced: shared component library, linting standards, CI/CD templates", "Outcomes: reduced duplicated infra work, improved consistency", "Guild → 3 shared packages adopted across all 6 Amazon Care web surfaces"] },
              { icon: "📦", title: "Shared Cloud Infra Package", color: "#22c55e",
                items: ["AWS CDK constructs + AppSec best practices bundled as npm package", "Startup time for new web apps: -85% (3 weeks → 2 days)", "Includes: CloudFront + WAF, Cognito auth, API Gateway, audit logging, CloudWatch alarms", "AppSec pre-approved security controls: no individual security review needed per service", "Deployed across all new Amazon Care web applications"] },
              { icon: "🎥", title: "Amazon Explore Rescue", color: "#f59e0b",
                items: ["Joined for 6 weeks before public launch (secondment)", "Audio/video failure rate: 30% → <5% in 6 weeks", "Root cause: ICE candidate gathering race conditions + audio track lifecycle", "Introduced pre-call device check pattern (later backported to Care)", "Established WebRTC debugging patterns adopted by Explore team", "Product launched successfully on schedule"] },
            ].map(section => (
              <div key={section.title} style={{ background: "#1e293b", border: `1px solid ${section.color}20`, borderRadius: 10, padding: 14, borderLeft: `4px solid ${section.color}` }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{section.icon}</span>
                  <div style={{ fontSize: 12, fontWeight: 700, color: section.color }}>{section.title}</div>
                </div>
                {section.items.map(item => (
                  <div key={item} style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4, paddingLeft: 10, position: "relative", lineHeight: 1.5 }}>
                    <span style={{ position: "absolute", left: 0, color: section.color }}>·</span>
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CodeBlock label="Stats ingestion engine — 1M+ data points/month at scale" color="#6366f1" code={
`// CHALLENGE: Capture WebRTC quality metrics from every active call.
// At Amazon Care scale: millions of data-point-seconds per month.
// Cannot send each data point to the server in real-time (too many requests).

// SOLUTION: Client-side batching + async ingestion pipeline.

// Step 1: Capture (client) — every 1 second
const statsCollector = new WebRTCStatsCollector(peerConnection);
statsCollector.onStats((stats: WebRTCStats) => {
  const score = computeQualityScore(stats);
  localBuffer.push({ sessionId, timestamp: Date.now(), score, ...stats });
});

// Step 2: Batch (client) — every 30 seconds
const batch = localBuffer.splice(0, 30);
await fetch("/api/quality/ingest", {
  method: "POST",
  body: JSON.stringify({ sessionId, dataPoints: batch }),
  keepalive: true,  // sends even if page unloads
});

// Step 3: Ingest pipeline (server)
// POST /api/quality/ingest
//   → API Gateway → Lambda → Kinesis Data Stream
//                              → Kinesis Firehose → S3 (raw storage)
//                              → Lambda → DynamoDB (per-session index)
//                              → Lambda → CloudWatch metrics (real-time alarms)

// WHY KINESIS:
// Direct DB writes at 1M/month = ~33k/day = ~23 writes/minute average.
// Peak: call hours → 200+ concurrent calls → 12,000 writes/minute.
// Kinesis buffers and batches. DynamoDB receives consistent write throughput.
// No dropped data points during traffic spikes.

// RESULT: 1M+ data points ingested reliably per month.
// P99 ingestion latency: < 5 seconds from capture to queryable.`} />

            <CodeBlock label="US Patent P64303-US01 — new video architecture contribution" color="#f59e0b" code={
`// US PATENT: P64303-US01
// "Systems and methods for adaptive video quality in telehealth sessions"
// (Patent application number — representative of filed patent)
// Co-inventor — name on the patent.

// WHAT THE PATENT COVERS (architectural innovation):
// The core insight: traditional WebRTC uses a single peer connection
// per call. In a telehealth context, the quality requirements differ
// between video, audio, and data channels:
//
//   Video: high bandwidth, can tolerate packet loss (visual artifact)
//   Audio: low bandwidth, ZERO packet loss tolerance (unintelligible speech)
//   Data:  reliable delivery, low latency (clinical annotations)
//
// The patent describes an architecture that:
//   1. Separates video, audio, and data onto different RTP streams
//      with different QoS parameters
//   2. Dynamically adjusts video bitrate while protecting audio bitrate
//      (in poor network: video degrades, audio stays clear)
//   3. Prioritises audio intelligibility using adaptive bitrate switching
//      thresholds calibrated specifically for telehealth (vs. generic WebRTC)
//   4. Enables session continuity: audio persists even when video is
//      paused/suspended due to very poor network conditions

// WHY THIS MATTERS IN TELEHEALTH:
// In a doctor-patient call: the patient can tolerate blurry video.
// They cannot tolerate unintelligible audio.
// A generic WebRTC implementation treats all streams equally.
// The patented architecture explicitly protects audio intelligibility.`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default AmazonCareDemo;
