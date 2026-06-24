/**
 * DailymotionDemo.tsx
 *
 * Dailymotion — Engineering Lead · Senior Frontend Engineer
 *
 * 1. GATEKEEPER — Feature flag system called hundreds of millions of times/day.
 *    Configurable wall in front of functionalities: user segment, geography, % rollout.
 *
 * 2. PLATFORM MODERNISATION — React introduction (universal SSR POC), TWIG switch
 *    (2× page speed), Dailymotion Toolkit, release system (multiple deploys/day).
 *
 * 3. VIDEO EVOLUTION — Flash player (ActionScript 3) → HTML5 video → adaptive
 *    bitrate streaming. SDK (ES6 + relay). Google TV / Stream interface.
 *
 * 4. TEAM LEADERSHIP — Management of 13 developers. Recruitment. Training.
 *
 * TABS
 *   🚦 GateKeeper       — interactive feature gate config + live page preview
 *   ⚡ Platform          — TWIG speed, React SSR, Toolkit, release pipeline
 *   📹 Video             — Flash → HTML5, adaptive bitrate, SDK, multi-platform
 */

import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// GateKeeper data
// ─────────────────────────────────────────────────────────────────

interface Gate {
  id: string; name: string; description: string;
  enabled: boolean; rollout: number;
  segment: "all" | "logged-in" | "premium" | "beta";
  geo: "global" | "eu" | "us" | "fr";
  color: string;
}

const INITIAL_GATES: Gate[] = [
  { id: "recommendations", name: "Recommendations Panel",    description: "Right-rail video recommendations using ML ranking",      enabled: true,  rollout: 100, segment: "all",      geo: "global", color: "#6366f1" },
  { id: "chapters",        name: "Chapter Markers",          description: "Clickable chapter markers on the video timeline",          enabled: true,  rollout: 70,  segment: "logged-in", geo: "global", color: "#0ea5e9" },
  { id: "hd-quality",      name: "HD Quality Selector",      description: "720p / 1080p quality options in the player",              enabled: true,  rollout: 100, segment: "all",      geo: "global", color: "#22c55e" },
  { id: "autoplay",        name: "Autoplay Countdown",       description: "Auto-advance to next video after countdown",              enabled: false, rollout: 50,  segment: "all",      geo: "global", color: "#f59e0b" },
  { id: "live-badge",      name: "Live Stream Badge",        description: "LIVE indicator for real-time streams",                   enabled: true,  rollout: 100, segment: "all",      geo: "eu",     color: "#ef4444" },
  { id: "dark-mode",       name: "Dark Mode UI",             description: "Dark theme across the entire site",                      enabled: false, rollout: 20,  segment: "beta",     geo: "global", color: "#a855f7" },
];

// ─────────────────────────────────────────────────────────────────
// Release pipeline data
// ─────────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { name: "Commit",    icon: "💻", color: "#6366f1", detail: "Developer pushes to feature branch" },
  { name: "CI Tests",  icon: "🧪", color: "#0ea5e9", detail: "Unit + integration tests, lint, type check" },
  { name: "Build",     icon: "📦", color: "#22c55e", detail: "Webpack bundle + asset optimization" },
  { name: "Staging",   icon: "🔧", color: "#f59e0b", detail: "Deploy to staging, smoke tests" },
  { name: "Canary 5%", icon: "🐤", color: "#f59e0b", detail: "5% of production traffic, monitor metrics" },
  { name: "Production",icon: "🚀", color: "#22c55e", detail: "Full production rollout" },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 300 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mock video page
// ─────────────────────────────────────────────────────────────────

function MockVideoPage({ gates }: { gates: Gate[] }) {
  const isEnabled = (id: string) => gates.find(g => g.id === id)?.enabled ?? false;
  return (
    <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, overflow: "hidden", fontSize: 11 }}>
      {/* Nav */}
      <div style={{ background: "#1e293b", padding: "7px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontWeight: 900, color: "#3b82f6", fontSize: 14 }}>dailymotion</span>
        <div style={{ flex: 1, height: 20, background: "#334155", borderRadius: 4 }} />
        {isEnabled("dark-mode") && <span style={{ fontSize: 9, background: "#a855f720", color: "#c084fc", borderRadius: 4, padding: "1px 6px" }}>🌙 dark</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10, padding: 10 }}>
        {/* Player area */}
        <div>
          <div style={{ background: "#000", borderRadius: 8, aspectRatio: "16/9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", marginBottom: 6 }}>
            <span style={{ fontSize: 28, opacity: 0.4 }}>▶</span>
            {isEnabled("live-badge") && (
              <div style={{ position: "absolute", top: 6, left: 6, background: "#ef4444", borderRadius: 3, padding: "1px 6px", fontSize: 8, color: "#fff", fontWeight: 700 }}>● LIVE</div>
            )}
            {isEnabled("hd-quality") && (
              <div style={{ position: "absolute", top: 6, right: 6, background: "#22c55e", borderRadius: 3, padding: "1px 6px", fontSize: 8, color: "#fff" }}>HD</div>
            )}
            {/* Timeline */}
            <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
              <div style={{ background: "#ffffff30", height: 3, borderRadius: 2, position: "relative" }}>
                <div style={{ background: "#3b82f6", height: "100%", width: "38%", borderRadius: 2 }} />
                {isEnabled("chapters") && (
                  <>
                    {[22, 45, 68].map(pct => (
                      <div key={pct} style={{ position: "absolute", top: -3, left: `${pct}%`, width: 3, height: 9, background: "#f59e0b", borderRadius: 1 }} />
                    ))}
                  </>
                )}
              </div>
              {isEnabled("chapters") && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                  {["Intro", "Part 2", "Part 3", "End"].map(c => (
                    <span key={c} style={{ fontSize: 6, color: "#64748b" }}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>Sample video title — Dailymotion</div>
          <div style={{ fontSize: 9, color: "#64748b" }}>42K views · 3 days ago</div>
          {isEnabled("autoplay") && (
            <div style={{ background: "#f59e0b20", border: "1px solid #f59e0b30", borderRadius: 6, padding: "6px 10px", marginTop: 8 }}>
              <div style={{ fontSize: 9, color: "#fcd34d" }}>⏱ Up next in 8 seconds · <span style={{ color: "#f59e0b", cursor: "pointer" }}>Cancel</span></div>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div>
          {isEnabled("recommendations") ? (
            <div>
              <div style={{ fontSize: 9, color: "#475569", marginBottom: 6 }}>Up Next</div>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ marginBottom: 6, display: "flex", gap: 5 }}>
                  <div style={{ width: 60, height: 36, background: "#1e293b", borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, opacity: 0.5 }}>▶</div>
                  <div>
                    <div style={{ fontSize: 8, color: "#94a3b8", lineHeight: 1.4 }}>Recommended video {i}</div>
                    <div style={{ fontSize: 7, color: "#475569" }}>{4 + i}K views</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 9, color: "#334155", textAlign: "center" }}>Recommendations<br/>disabled</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function DailymotionDemo() {
  const [activeTab, setActiveTab] = useState<"gatekeeper" | "platform" | "video">("gatekeeper");

  // GateKeeper state
  const [gates, setGates] = useState<Gate[]>(INITIAL_GATES);
  const [callCount, setCallCount] = useState(0);
  const callCountRef = useRef(0);

  // Counter simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const increment = Math.floor(Math.random() * 8000) + 4000;
      callCountRef.current += increment;
      setCallCount(callCountRef.current);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const toggleGate = (id: string) => {
    setGates(prev => prev.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g));
  };

  // Pipeline state
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const pipelineRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPipeline = () => {
    if (pipelineRunning) return;
    setPipelineRunning(true);
    setPipelineStep(0);
    PIPELINE_STAGES.forEach((_, i) => {
      pipelineRef.current = setTimeout(() => {
        setPipelineStep(i);
        if (i === PIPELINE_STAGES.length - 1) {
          setTimeout(() => {
            setPipelineRunning(false);
            setPipelineStep(-1);
          }, 1500);
        }
      }, i * 700);
    });
  };

  const TABS = [
    { id: "gatekeeper" as const, label: "🚦 GateKeeper"     },
    { id: "platform"   as const, label: "⚡ Platform"        },
    { id: "video"      as const, label: "📹 Video Evolution" },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#3b82f6" }}>dm</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Dailymotion</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Engineering Lead · 13-person team · React introduction · GateKeeper · Flash→HTML5 · Universal SSR POC
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["GateKeeper", "Feature Flags", "React (Universal SSR)", "TWIG", "Flash Player", "HTML5 Video", "ES6 SDK", "Google TV", "13 Devs", "100M+ calls/day", "Continuous Delivery"].map(t => (
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

      {/* ── GATEKEEPER ── */}
      {activeTab === "gatekeeper" && (
        <div>
          {/* Counter */}
          <div style={{ background: "linear-gradient(135deg, #6366f120, #0ea5e920)", border: "1px solid #6366f130", borderRadius: 10, padding: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 16 }}>
            <div>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>GATEKEEPER CALLS (simulated)</div>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "monospace", color: "#a5b4fc" }}>
                {callCount.toLocaleString()}
              </div>
            </div>
            <div style={{ flex: 1, fontSize: 10, color: "#94a3b8", lineHeight: 1.7 }}>
              In production: called <strong style={{ color: "#f1f5f9" }}>hundreds of millions of times per day</strong>.
              Every page view at Dailymotion calls the GateKeeper N times — once per feature on that page.
              Dailymotion serves 100M+ video views/day. At ~5 gates per page view: 500M+ gate evaluations/day.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 14 }}>
            {/* Gate config */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
                GATE CONFIGURATION
              </div>
              {gates.map(gate => (
                <div key={gate.id} style={{ background: "#1e293b", border: `1px solid ${gate.enabled ? gate.color + "40" : "#334155"}`, borderRadius: 8, padding: 10, marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: gate.enabled ? gate.color : "#64748b" }}>{gate.name}</span>
                    <button
                      onClick={() => toggleGate(gate.id)}
                      style={{
                        background: gate.enabled ? gate.color : "#334155",
                        border: "none", borderRadius: 20, padding: "2px 10px",
                        color: "#fff", cursor: "pointer", fontSize: 9, fontWeight: 700,
                        transition: "background 0.2s",
                      }}
                    >{gate.enabled ? "ON" : "OFF"}</button>
                  </div>
                  <div style={{ fontSize: 8, color: "#475569", marginBottom: 4 }}>{gate.description}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 7, background: "#0f172a", color: "#64748b", borderRadius: 3, padding: "1px 5px" }}>
                      {gate.rollout}% rollout
                    </span>
                    <span style={{ fontSize: 7, background: "#0f172a", color: "#64748b", borderRadius: 3, padding: "1px 5px" }}>
                      {gate.segment}
                    </span>
                    <span style={{ fontSize: 7, background: "#0f172a", color: "#64748b", borderRadius: 3, padding: "1px 5px" }}>
                      {gate.geo}
                    </span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 8 }}>
                <CodeBlock label="GateKeeper evaluation — core interface" color="#6366f1" code={
`// Every feature call goes through GateKeeper.
// Engineers never hard-code feature toggles.

const gk = new GateKeeper(config);

// Usage at call site:
if (gk.isEnabled("dark-mode", { userId, country, segment })) {
  renderDarkTheme();
}

// The GateKeeper evaluates:
// 1. Is this gate defined? (default: disabled)
// 2. Is the user in the allowed segment?
// 3. Is the user's country in the allowed geo?
// 4. Is the user in the rollout %?
//    → hash(userId + gateName) % 100 < rollout
//    Consistent: same user always sees same result.

// Gate config lives in a central config store.
// Ops can change a gate without a code deployment.
// Changes take effect in seconds.
// This enables: kill switches, instant feature rollbacks,
// A/B tests, geo-restricted launches, premium features.`} />
              </div>
            </div>

            {/* Live preview + code */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
                LIVE PAGE PREVIEW — toggle gates to see features appear/disappear
              </div>
              <MockVideoPage gates={gates} />

              <div style={{ marginTop: 10 }}>
                <CodeBlock label="GateKeeper architecture — why called 100M+ times/day" color="#6366f1" code={
`// WHY THE GATEKEEPER IS CALLED SO MANY TIMES:
//
// Dailymotion homepage:
//   - Header: check "new-nav-design" gate
//   - Video grid: check "recommendations-v2" gate
//   - Each video thumbnail: check "chapters-preview" gate
//   - Player: check "hd-quality" gate, "live-badge" gate
//   - Sidebar: check "dark-mode" gate
//   → ~5-10 gate calls per page view
//
// At 100M video views/day + homepage visits:
//   → 500M+ gate evaluations per day
//
// PERFORMANCE REQUIREMENTS:
//   GateKeeper must be: synchronous, < 1ms per call, no network request.
//   Implementation: config is loaded ONCE at startup (CDN-cached JSON).
//   Each call: O(1) hashmap lookup + integer comparison.
//   No I/O. No async. Sub-millisecond.
//
// CONSISTENCY:
//   hash(userId + gateName) % 100 < rollout
//   Same userId + same gateName → always same result.
//   A user in the 30% rollout sees the feature EVERY time.
//   They don't see it, then not, then yes. Consistent experience.
//
// GRADUAL ROLLOUT:
//   Week 1: rollout=5%   → 5% of users see the feature
//   Week 2: rollout=20%  → monitor metrics, no regressions
//   Week 3: rollout=50%  → A/B test complete
//   Week 4: rollout=100% → everyone sees it
//   At any point: rollout=0% to instant kill-switch if issues arise.`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PLATFORM ── */}
      {activeTab === "platform" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* React Universal SSR */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", marginBottom: 8, letterSpacing: "0.08em" }}>
                INTRODUCED REACT — Universal SSR POC (before Next.js existed)
              </div>
              <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { icon: "🖥", label: "Server (Node.js)", detail: "ReactDOMServer.renderToString(<App />) → HTML string", color: "#6366f1" },
                    { icon: "🌐", label: "HTTP Response",    detail: "HTML with data-react-checksum + inline JSON state", color: "#0ea5e9" },
                    { icon: "💻", label: "Client (Browser)", detail: "ReactDOM.hydrate() — attach event handlers without re-render", color: "#22c55e" },
                    { icon: "⚡", label: "Result",           detail: "SEO-friendly HTML. Instant First Contentful Paint. SPA after load.", color: "#f59e0b" },
                  ].map(s => (
                    <div key={s.label} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: s.color }}>{s.label}</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>{s.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <CodeBlock label="Universal React POC — why this was pioneering in 2014-2015" color="#6366f1" code={
`// React was announced by Facebook at JSConf 2013.
// By 2014: most people were using React for SPAs only.
// "Universal" (isomorphic) React: run the SAME code on server and client.
//
// WHY DAILYMOTION NEEDED UNIVERSAL:
// 1. SEO: Google couldn't index client-rendered JavaScript pages reliably.
//    A video platform that Google can't index = invisible.
// 2. Performance: server-rendered HTML arrives ready.
//    Client-only React: blank page → JS loads → render (FCP: 3-5 seconds).
// 3. Progressive enhancement: page works even with JS disabled.
//
// THE PROOF OF CONCEPT (before Next.js, before "isomorphic" was a term):
//
// // server.js (Express)
// app.get("/video/:id", async (req, res) => {
//   const video = await fetchVideo(req.params.id);
//   const html = ReactDOMServer.renderToString(
//     <VideoPage video={video} />
//   );
//   res.send(
//     \`<!DOCTYPE html>
//     <html>
//       <body>
//         <div id="app">\${html}</div>
//         <script>
//           window.__INITIAL_STATE__ = \${JSON.stringify({ video })};
//         </script>
//       </body>
//     </html>\`
//   );
// });
//
// // client.js
// const state = window.__INITIAL_STATE__;
// ReactDOM.hydrate(<VideoPage video={state.video} />, document.getElementById("app"));
// // hydrate: attaches event handlers. Does NOT re-render.
// // The HTML from server IS the first render. Zero flash.
//
// WHY THIS CONVINCED DAILYMOTION:
// The POC showed: React on the server. React on the client.
// Same component. SEO-friendly. Fast first paint.
// "If we switch to React, we don't lose SEO."
// That removed the #1 objection to switching.`} />
            </div>

            <div>
              {/* TWIG speed */}
              <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", marginBottom: 8, letterSpacing: "0.08em" }}>
                TWIG SWITCH — doubled page rendering speed
              </div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ marginBottom: 10 }}>
                  {[
                    { label: "Smarty (before)", width: "100%", time: "420ms", color: "#ef4444" },
                    { label: "TWIG (after)",    width: "50%",  time: "210ms", color: "#22c55e" },
                  ].map(r => (
                    <div key={r.label} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 9, color: "#94a3b8" }}>{r.label}</span>
                        <span style={{ fontSize: 9, color: r.color, fontWeight: 700 }}>{r.time}</span>
                      </div>
                      <div style={{ background: "#0f172a", borderRadius: 4, height: 16, overflow: "hidden" }}>
                        <div style={{ background: r.color, height: "100%", width: r.width, borderRadius: 4, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.6 }}>
                  <strong style={{ color: "#22c55e" }}>Why TWIG was 2× faster:</strong> Smarty interpreted templates at runtime on every request.
                  TWIG compiled templates to PHP bytecode and cached them.
                  Subsequent requests executed native PHP — no parsing overhead.
                  Also: TWIG enforced cleaner separation of logic and presentation,
                  preventing engineers from embedding heavy business logic in templates.
                </div>
              </div>

              {/* Dailymotion Toolkit */}
              <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", marginBottom: 8, letterSpacing: "0.08em" }}>
                DAILYMOTION TOOLKIT — internal component library + dev tooling
              </div>
              <div style={{ background: "#1e293b", border: "1px solid #f59e0b20", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                {[
                  { icon: "🧩", name: "UI Component Library", detail: "Buttons, modals, dropdowns, video cards, pagination — consistent across all pages" },
                  { icon: "🎨", name: "Design Tokens",         detail: "Colours, spacing, typography — single source of truth, applied site-wide" },
                  { icon: "⚡", name: "Dev Generators",        detail: "CLI to scaffold new pages/components following Dailymotion conventions instantly" },
                  { icon: "📐", name: "Layout System",         detail: "Grid + responsive breakpoints: once defined, every page uses the same layout rules" },
                ].map(t => (
                  <div key={t.name} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#fcd34d" }}>{t.name}</div>
                      <div style={{ fontSize: 9, color: "#64748b" }}>{t.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Release pipeline */}
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0ea5e9", marginBottom: 8, letterSpacing: "0.08em" }}>
                RELEASE SYSTEM — multiple deploys to production per day
              </div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 8, alignItems: "center" }}>
                  {PIPELINE_STAGES.map((stage, i) => (
                    <React.Fragment key={stage.name}>
                      <div style={{
                        background: pipelineStep >= i ? stage.color + "20" : "#0f172a",
                        border: `1px solid ${pipelineStep >= i ? stage.color : "#334155"}`,
                        borderRadius: 6, padding: "5px 8px", textAlign: "center", flex: 1,
                        transition: "all 0.3s",
                      }}>
                        <div style={{ fontSize: 12 }}>{stage.icon}</div>
                        <div style={{ fontSize: 7, color: pipelineStep >= i ? stage.color : "#64748b", fontWeight: 600 }}>{stage.name}</div>
                      </div>
                      {i < PIPELINE_STAGES.length - 1 && (
                        <div style={{ color: pipelineStep > i ? "#22c55e" : "#334155", fontSize: 10, flexShrink: 0, transition: "color 0.3s" }}>→</div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                {pipelineStep >= 0 && (
                  <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 6 }}>
                    {PIPELINE_STAGES[pipelineStep]?.detail}
                  </div>
                )}
                <button onClick={runPipeline} disabled={pipelineRunning} style={{ background: pipelineRunning ? "#334155" : "#0ea5e9", border: "none", borderRadius: 8, padding: "7px 16px", color: "#fff", cursor: pipelineRunning ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 700 }}>
                  {pipelineRunning ? "Deploying…" : "▶ Simulate Deploy"}
                </button>
                <div style={{ fontSize: 8, color: "#475569", marginTop: 6 }}>
                  GateKeeper enables multiple deploys/day: ship code with the gate OFF → turn it ON separately → instant rollback by flipping the gate.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIDEO EVOLUTION ── */}
      {activeTab === "video" && (
        <div>
          {/* Timeline */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 10, letterSpacing: "0.08em" }}>DAILYMOTION VIDEO PLATFORM EVOLUTION</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
              {[
                { era: "2008–2010", title: "Flash Player",    icon: "⚡", color: "#f59e0b", detail: "New architecture + ActionScript 3. Performance + maintainability." },
                { era: "2011–2013", title: "HTML5 Video",     icon: "🌐", color: "#6366f1", detail: "First HTML5 video player. Cross-browser. SEO-friendly. No plugin." },
                { era: "2012–2013", title: "Google TV / Stream", icon: "📺", color: "#0ea5e9", detail: "HTML5 interface for set-top boxes. 10-foot UI. Chrome Web Store." },
                { era: "2014–2016", title: "React + ES6 SDK", icon: "⚛",  color: "#22c55e", detail: "Universal SSR POC. React company-wide adoption. Modern JS SDK." },
              ].map((era, i) => (
                <div key={era.era} style={{ borderLeft: i > 0 ? "1px solid #334155" : "none", paddingLeft: i > 0 ? 14 : 0, paddingRight: 14 }}>
                  <div style={{ fontSize: 8, color: "#475569", marginBottom: 4 }}>{era.era}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{era.icon}</span>
                    <div style={{ fontSize: 10, fontWeight: 700, color: era.color }}>{era.title}</div>
                  </div>
                  <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.6 }}>{era.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <CodeBlock label="Flash → HTML5 migration — the technical transition" color="#6366f1" code={
`// FLASH PLAYER (ActionScript 3) — what I built:
// ActionScript 3 was a significant rewrite from AS2.
// It introduced proper OOP (classes, interfaces, generics).
//
// New architecture:
//   PlayerCore      → video state machine, playback control
//   PlayerUI        → AS3 display objects, skins
//   PlayerComm      → JavaScript <-> Flash ExternalInterface bridge
//   PlayerAnalytics → event tracking, quality metrics
//
// Separation of concerns: previously one monolithic .swf.
// Now: testable layers with clear interfaces.
//
// ─────────────────────────────────────────────
//
// HTML5 VIDEO PLAYER — why this was hard in 2011:
//
// Browser fragmentation:
//   Chrome: WebM (VP8) + H.264
//   Firefox: Ogg Theora (no H.264 due to patent licensing)
//   Safari: H.264 only (no WebM)
//   IE: Flash fallback (no HTML5 video support until IE9)
//
// Solution: multiple source formats + feature detection
// <video>
//   <source src="video.mp4"  type="video/mp4">    <!-- H.264 -->
//   <source src="video.webm" type="video/webm">   <!-- VP8   -->
//   <source src="video.ogv"  type="video/ogg">    <!-- Theora -->
//   <object data="player.swf">                    <!-- Flash fallback -->
//   </object>
// </video>
//
// The player had to:
// 1. Detect which format the browser supports
// 2. Choose the right source URL
// 3. Implement custom controls (native controls look different per browser)
// 4. Handle buffering events, quality switching, fullscreen API differences
// 5. Graceful degradation to Flash for IE8 users (major user segment in 2011)`} />

              <div style={{ marginTop: 10 }}>
                <CodeBlock label="ES6 SDK + relay pattern — the internal JavaScript SDK" color="#0ea5e9" code={
`// DAILYMOTION SDK (ES6, internal):
// A unified JavaScript library for all Dailymotion clients.
// Player embedding, API access, event communication.
//
// ES6 = writing modern JavaScript before browsers supported it.
// Required: Babel transpilation → ES5 for browser compatibility.
//
// SDK MODULES:
// import { Player } from "@dailymotion/sdk/player";
// import { API }    from "@dailymotion/sdk/api";
// import { Events } from "@dailymotion/sdk/events";
//
// THE RELAY PATTERN:
// The player runs in an iframe (sandboxed).
// The embedding page and the player cannot directly call each other.
// Communication: postMessage() — asynchronous, cross-origin.
//
// The relay bridges the two worlds:
//
// class PlayerRelay {
//   constructor(iframe) {
//     this.iframe = iframe;
//     this.handlers = new Map();
//     window.addEventListener("message", this.onMessage.bind(this));
//   }
//
//   send(event, data) {
//     // Embedding page → player
//     this.iframe.contentWindow.postMessage({ event, data }, "https://dailymotion.com");
//   }
//
//   on(event, handler) {
//     this.handlers.set(event, handler);
//   }
//
//   onMessage({ data, origin }) {
//     // Player → embedding page
//     if (origin !== "https://dailymotion.com") return; // security check
//     const handler = this.handlers.get(data.event);
//     if (handler) handler(data.payload);
//   }
// }
//
// Usage by external developers:
// const relay = new PlayerRelay(iframe);
// relay.on("play",  () => console.log("video started"));
// relay.on("pause", () => console.log("video paused"));
// relay.send("seek", { position: 120 }); // seek to 2:00`} />
              </div>
            </div>

            <div>
              {/* Google TV / Stream */}
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0ea5e9", marginBottom: 8, letterSpacing: "0.08em" }}>
                GOOGLE TV / CHROME WEB STORE — "Stream" interface
              </div>
              <div style={{ background: "#1e293b", border: "1px solid #0ea5e920", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
                {/* Simulated TV UI */}
                <div style={{ background: "linear-gradient(180deg, #0a0a14 0%, #1a1a2e 100%)", padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "#3b82f6", marginBottom: 12, letterSpacing: "0.1em" }}>STREAM</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
                    {["Trending", "Sport", "Music", "Gaming"].map((cat, i) => (
                      <div key={cat} style={{
                        background: i === 0 ? "#3b82f6" : "#1e293b",
                        borderRadius: 6, padding: "6px 10px", textAlign: "center", cursor: "pointer",
                      }}>
                        <div style={{ fontSize: 9, color: i === 0 ? "#fff" : "#64748b" }}>{cat}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} style={{ background: "#1e293b", borderRadius: 5, overflow: "hidden", cursor: "pointer" }}>
                        <div style={{ aspectRatio: "16/9", background: `hsl(${i * 40}, 30%, 15%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, opacity: 0.5 }}>▶</div>
                        <div style={{ padding: "4px 6px", fontSize: 7, color: "#64748b" }}>Video {i}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <CodeBlock label="10-foot UI design — why TV interfaces require different thinking" color="#0ea5e9" code={
`// GOOGLE TV / CHROME WEB STORE — "Stream"
//
// "10-foot UI" = the user is sitting 10 feet from the screen.
// Interaction: TV remote. No mouse. No touch.
// Navigation: D-pad (up/down/left/right) + select + back.
//
// WHAT THIS CHANGES:
//
// 1. Focus management: every interactive element needs focusable states.
//    The remote moves focus. You cannot hover.
//    CSS: :focus { border: 3px solid #3b82f6; transform: scale(1.05); }
//
// 2. Font sizes: minimum 24px for readability at 10 feet.
//    Cards: much larger than desktop. Less content per screen.
//
// 3. Navigation model: spatial navigation.
//    Left/right moves between cards. Up/down moves between rows.
//    Implemented a custom focus manager:
//    findNextFocusable(direction, currentElement) → nextElement
//
// 4. No hover states: hover doesn't exist on TV.
//    All affordances must be visible without hover.
//
// 5. Performance: Google TV (2010) had limited CPU.
//    Animations must be GPU-accelerated (transform, opacity only).
//    CSS transitions: yes. JavaScript-driven animations: no.
//
// 6. Input model: long-press on remote = different action.
//    Short press: select. Long press: context menu.
//    Implemented with keydown + setTimeout.
//
// WHY HTML5 (not a native Android TV app):
// HTML5 runs in the Chrome browser built into Google TV.
// One codebase → web + Chrome Web Store + TV.
// Write once, render everywhere: different CSS breakpoints for each.`} />

              {/* Team leadership */}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#a855f7", marginBottom: 8, letterSpacing: "0.08em" }}>
                  TEAM LEADERSHIP — 13 developers
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[
                    { icon: "👥", title: "Team of 13",    detail: "Frontend engineers + fullstack. Largest team at Dailymotion web engineering." },
                    { icon: "🎯", title: "Recruitment",   detail: "Technical interviews, hiring bar, diverse sourcing across France and internationally." },
                    { icon: "📚", title: "Training",      detail: "Internal JS/React workshops. Code review culture. Mentorship programme." },
                    { icon: "🚀", title: "Delivery",      detail: "Shipped: GateKeeper, Toolkit, React adoption, HTML5 player, SDK, Google TV." },
                  ].map(t => (
                    <div key={t.title} style={{ background: "#1e293b", border: "1px solid #a855f720", borderRadius: 8, padding: 10 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 14 }}>{t.icon}</span>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#c084fc" }}>{t.title}</div>
                      </div>
                      <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.5 }}>{t.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailymotionDemo;
