/**
 * SlackDxDemo.tsx
 *
 * Tech Lead — Frontend Developer Experience, Slack
 * Focus: Local Developer Tooling, Fast Typechecking, Bundler Modernization
 *
 * Achievements covered:
 *   1. Migrated typechecking from tsc to tsgo, reducing checkout time by 5x (parallelized, Go-based wrapper/type-graph partitioner)
 *   2. Replacing Webpack with a Rust-based, high-performance alternative (like Rspack)
 *   3. Implementing developer experience metrics dashboard (Telemetry on compilation, HMR, testing)
 *   4. Technical rollout strategy (shadow validation, phased deployment, Slack guild collaboration)
 *
 * TABS:
 *   🚀 tsc → tsgo        — Side-by-side visual simulator showing single-threaded vs parallel/cached compilation
 *   ⚡ Webpack → Rust    — Interactive HMR latency simulator comparing bundlers with virtual UI hot-reload
 *   📊 DX Telemetry      — Real-time dashboard of build metrics, CI loop times, and dev satisfaction indexes
 *   🤝 Rollout Playbook  — Rollout cohort status, AST validation pipeline details, and stakeholder risk mitigation
 */

import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Style constants (Dark themed, Slack DX branding)
// ─────────────────────────────────────────────────────────────────
const SL = {
  bg: "#0B0E14",
  surface: "#141722",
  surface2: "#1E2230",
  border: "#2A3045",
  text: "#9EACF0",
  textBright: "#FFFFFF",
  textMuted: "#6B7799",
  slackPurple: "#4A154B",
  slackPink: "#E01E5A",
  goBlue: "#00ADD8",
  rustOrange: "#CE412B",
  green: "#2BAC76",
  yellow: "#ECB22E",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

interface CompilerLog {
  id: string;
  worker?: number;
  file: string;
  time: string;
  status: "idle" | "checking" | "cached" | "ok" | "error";
}

const FILES_TO_CHECK = [
  "packages/client/src/components/MessageComposer.tsx",
  "packages/client/src/hooks/useSlackPresence.ts",
  "packages/client/src/utils/dateFormatter.ts",
  "packages/shared/src/types/message.ts",
  "packages/client/src/components/ThreadView.tsx",
  "packages/client/src/store/workspaceStore.ts",
  "packages/canvas/src/components/CanvasCanvas.tsx",
  "packages/huddles/src/hooks/useMediaConnection.ts",
  "packages/shared/src/utils/featureFlags.ts",
  "packages/client/src/a11y/announceRegion.ts",
  "packages/client/src/components/ActivityLog.tsx",
  "packages/shared/src/types/user.ts",
];

// Helper components
function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: SL.surface, border: `1px solid ${SL.border}`, borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: SL.textBright, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 8, color: SL.textMuted, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function CodeBox({ code, label, color = SL.goBlue }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#06080C", borderRadius: 8, overflow: "hidden", border: `1px solid ${SL.border}` }}>
      {label && <div style={{ padding: "6px 12px", borderBottom: `1px solid ${SL.border}`, fontSize: 9, color, fontWeight: 700, background: SL.surface }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 8.5, fontFamily: SL.mono, color: "#98A4C9", lineHeight: 1.6, overflow: "auto", maxHeight: 320 }}>{code}</pre>
    </div>
  );
}

export function SlackDxDemo() {
  const [tab, setTab] = useState<"tsgo" | "rust" | "telemetry" | "rollout">("tsgo");

  // ── tsc → tsgo simulation state ──
  const [compMode, setCompMode] = useState<"none" | "tsc" | "tsgo">("none");
  const [tscProgress, setTscProgress] = useState(0);
  const [tscActiveFile, setTscActiveFile] = useState("");
  const [tscLogs, setTscLogs] = useState<CompilerLog[]>([]);
  const [tsgoProgress, setTsgoProgress] = useState(0);
  const [tsgoLogs, setTsgoLogs] = useState<CompilerLog[]>([]);
  const [tsgoWorkers, setTsgoWorkers] = useState<Array<{ id: number; file: string; status: string }>>([
    { id: 1, file: "", status: "idle" },
    { id: 2, file: "", status: "idle" },
    { id: 3, file: "", status: "idle" },
    { id: 4, file: "", status: "idle" },
  ]);

  const simInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTscSimulation = () => {
    if (simInterval.current) clearInterval(simInterval.current);
    setCompMode("tsc");
    setTscProgress(0);
    setTscLogs([]);
    
    let index = 0;
    simInterval.current = setInterval(() => {
      if (index >= FILES_TO_CHECK.length) {
        setTscProgress(100);
        setTscActiveFile("Complete!");
        clearInterval(simInterval.current!);
        return;
      }
      const file = FILES_TO_CHECK[index] || "";
      setTscActiveFile(file);
      setTscProgress(Math.round(((index + 1) / FILES_TO_CHECK.length) * 100));
      
      const newLog: CompilerLog = {
        id: Math.random().toString(),
        file,
        time: new Date().toLocaleTimeString([], { hour12: false, second: "2-digit", minute: "2-digit" }),
        status: "ok",
      };
      setTscLogs(prev => [newLog, ...prev.slice(0, 15)]);
      index += 1;
    }, 450);
  };

  const startTsgoSimulation = () => {
    if (simInterval.current) clearInterval(simInterval.current);
    setCompMode("tsgo");
    setTsgoProgress(0);
    setTsgoLogs([]);
    
    let fileQueue = [...FILES_TO_CHECK];
    let completedCount = 0;
    const totalFiles = FILES_TO_CHECK.length;
    
    // Initialise Workers
    const workers = [
      { id: 1, file: "", status: "idle" },
      { id: 2, file: "", status: "idle" },
      { id: 3, file: "", status: "idle" },
      { id: 4, file: "", status: "idle" },
    ];
    setTsgoWorkers(workers);

    simInterval.current = setInterval(() => {
      let activeWork = false;

      // Update progress
      setTsgoProgress(Math.round((completedCount / totalFiles) * 100));

      if (completedCount >= totalFiles) {
        setTsgoProgress(100);
        setTsgoWorkers(prev => prev.map(w => ({ ...w, file: "Complete!", status: "idle" })));
        clearInterval(simInterval.current!);
        return;
      }

      // Check each worker
      workers.forEach((worker, wIndex) => {
        if (worker.status === "idle" && fileQueue.length > 0) {
          const file = fileQueue.shift()!;
          worker.file = file;
          worker.status = "checking";
          activeWork = true;
          
          // Randomly simulate cached files (DX cache hit)
          const isCached = Math.random() > 0.4;
          const checkDuration = isCached ? 80 : 250;

          // Dispatch worker task
          setTimeout(() => {
            worker.status = "idle";
            completedCount += 1;
            
            const newLog: CompilerLog = {
              id: Math.random().toString(),
              worker: worker.id,
              file,
              time: new Date().toLocaleTimeString([], { hour12: false, second: "2-digit", minute: "2-digit" }),
              status: isCached ? "cached" : "ok",
            };
            setTsgoLogs(prev => [newLog, ...prev.slice(0, 15)]);
            setTsgoWorkers([...workers]);
          }, checkDuration);
        } else if (worker.status === "checking") {
          activeWork = true;
        }
      });

      setTsgoWorkers([...workers]);
    }, 100);
  };

  // ── Webpack → Rust HMR simulation state ──
  const [bundlerMode, setBundlerMode] = useState<"webpack" | "rust">("webpack");
  const [hmrActive, setHmrActive] = useState(false);
  const [hmrTimer, setHmrTimer] = useState<number | null>(null);
  const [simulatedButtonColor, setSimulatedButtonColor] = useState(SL.slackPurple);
  const [mockTerminalLogs, setMockTerminalLogs] = useState<string[]>([]);
  const [hmrSpeedMs, setHmrSpeedMs] = useState<number | null>(null);

  const triggerHmr = (nextColor: string) => {
    if (hmrActive) return;
    setHmrActive(true);
    setHmrSpeedMs(null);

    const isWebpack = bundlerMode === "webpack";
    const delay = isWebpack ? 1800 : 120; // 1.8s vs 120ms
    const terminalLogs = isWebpack 
      ? [
          "ℹ [webpack-dev-server] File change detected: MessageComposer.tsx",
          "ℹ [webpack-dev-server] Compiling...",
          "⚡ [webpack] hash: 7e738afcd83bc2, time: 1823ms",
          "⚡ [webpack] Built packages/client/src/components/MessageComposer.tsx",
          "✔ [webpack-dev-server] HMR applied. Reloading component..."
        ]
      : [
          "⚡ [rust-compiler] File change detected: MessageComposer.tsx",
          "⚡ [rust-compiler] Incremental compile done in 118ms",
          "✔ [rust-dev] HMR applied instantly (React Fast Refresh)"
        ];

    setMockTerminalLogs([`[HMR Initialized] Change primary color to ${nextColor}...`]);

    let step = 0;
    const interval = setInterval(() => {
      if (step < terminalLogs.length) {
        setMockTerminalLogs(prev => [...prev, terminalLogs[step] || ""]);
        step += 1;
      } else {
        clearInterval(interval);
      }
    }, delay / 4);

    setTimeout(() => {
      setSimulatedButtonColor(nextColor);
      setHmrActive(false);
      setHmrSpeedMs(delay);
      clearInterval(interval);
      setMockTerminalLogs(terminalLogs);
    }, delay);
  };

  // ── Telemetry View options ──
  const [telemetryPeriod, setTelemetryPeriod] = useState<"before" | "after">("after");

  // ── Rollout Playbook risk items ──
  const [selectedRisk, setSelectedRisk] = useState<number | null>(null);

  const RISKS = [
    {
      title: "Typecheck correctness mismatch (tsc vs tsgo)",
      desc: "Because tsgo compiles or parses dependencies differently to parallelize, it could miss subtle type errors caught by tsc.",
      mitigation: "Shadow verification mode: ran tsc in the CI post-merge phase for 60 days. Analyzed 24,000 commits. Identified 4 edge cases (mostly namespace merges and deep interface inheritance) where tsgo's quick-path tree resolver missed an error. Refined tsgo's dependency solver until alignment reached 100% before starting developer opt-in.",
      severity: "High",
    },
    {
      title: "Webpack loader/plugin disparity in Rust bundler",
      desc: "Slack has over 180 custom Webpack configurations, plugins, and loaders built over 8 years. A direct drop-in replacement would break the bundle.",
      mitigation: "Loader bridge layer + fallback compilation. We wrote a custom JS loader parser in Rust that acts as a compatibility wrapper. Also created an automated visual regression testing pipeline (Percy) comparing webpack-produced and Rust-produced pages side-by-side. 99.8% identical binary structure.",
      severity: "Critical",
    },
    {
      title: "Developer inertia / opt-in resistance",
      desc: "Engineers are wary of DX tools breaking their local setups, stopping them from shipping features.",
      mitigation: "Zero-risk command wrapper. We delivered `slack-dx` CLI. Running it automatically auto-detects system state. It includes a fallback switch: `slack-dx --fallback`. If anything breaks, a single flag reverts local environments back to standard `tsc + Webpack` instantly, sending telemetry back to the DX team for debug.",
      severity: "Medium",
    },
  ];

  return (
    <div style={{ background: SL.bg, color: SL.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${SL.slackPurple}, ${SL.goBlue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💬</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: SL.textBright, letterSpacing: "-0.02em" }}>Slack — Tech Lead, Frontend Developer Experience</h1>
            <p style={{ margin: 0, fontSize: 11, color: SL.textMuted }}>Fast TypeScript Compiler (tsgo) · Rust Bundling Migration · Dev Telemetry · DX Rollouts</p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          <StatCard label="Typecheck Time" value="5x Faster" sub="tsc (45s) → tsgo (9s)" color={SL.goBlue} />
          <StatCard label="Local HMR Latency" value="0.12s" sub="Webpack (1.8s) → Rust (120ms)" color={SL.rustOrange} />
          <StatCard label="Devs Empowered" value="1,200+" sub="Frontend & product engineers" color={SL.slackPink} />
          <StatCard label="CI Run Runtimes" value="-30%" sub="Saved 14,000 CPU hours/week" color={SL.green} />
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${SL.border}`, paddingBottom: 4 }}>
        {[
          { id: "tsgo" as const, label: "🚀 tsc → tsgo compiler" },
          { id: "rust" as const, label: "⚡ Webpack → Rust HMR" },
          { id: "telemetry" as const, label: "📊 DX Telemetry" },
          { id: "rollout" as const, label: "🤝 Rollout Playbook" },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ background: tab === tb.id ? SL.surface2 : "transparent", color: tab === tb.id ? SL.textBright : SL.textMuted, border: tab === tb.id ? `1px solid ${SL.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{tb.label}</button>
        ))}
      </div>

      {/* ── TSC → TSGO COMPILER ── */}
      {tab === "tsgo" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SL.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>TS TYPECHECK SIMULATOR</div>

            <div style={{ background: SL.surface, border: `1px solid ${SL.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: SL.textBright }}>Compilation Speed & Flow Simulator</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={startTscSimulation} style={{ background: compMode === "tsc" ? "#3b82f640" : "transparent", border: "1px solid #3b82f6", borderRadius: 6, padding: "5px 12px", cursor: "pointer", color: "#60a5fa", fontSize: 9, fontWeight: 700 }}>Run Standard `tsc`</button>
                  <button onClick={startTsgoSimulation} style={{ background: compMode === "tsgo" ? `${SL.goBlue}40` : "transparent", border: `1px solid ${SL.goBlue}`, borderRadius: 6, padding: "5px 12px", cursor: "pointer", color: SL.goBlue, fontSize: 9, fontWeight: 700 }}>Run Parallel `tsgo`</button>
                </div>
              </div>

              {/* Simulation Visual Area */}
              {compMode === "tsc" && (
                <div style={{ border: `1px solid ${SL.border}`, background: "#06080C", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: SL.textBright, marginBottom: 4 }}>
                    <span>Standard `tsc` (Single-threaded)</span>
                    <span>{tscProgress}%</span>
                  </div>
                  <div style={{ height: 6, background: "#151F32", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ width: `${tscProgress}%`, height: "100%", background: "#3b82f6", transition: "width 0.2s" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 8, color: SL.textMuted }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", animation: "pulse 1.5s infinite" }} />
                    <span>Active: <code>{tscActiveFile}</code></span>
                  </div>
                </div>
              )}

              {compMode === "tsgo" && (
                <div style={{ border: `1px solid ${SL.border}`, background: "#06080C", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: SL.goBlue, marginBottom: 4, fontWeight: 700 }}>
                    <span>Go-based Parallel Typechecker `tsgo`</span>
                    <span>{tsgoProgress}%</span>
                  </div>
                  <div style={{ height: 6, background: "#151F32", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ width: `${tsgoProgress}%`, height: "100%", background: SL.goBlue, transition: "width 0.1s" }} />
                  </div>

                  {/* Worker Threads Display */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {tsgoWorkers.map(w => (
                      <div key={w.id} style={{ background: SL.surface, border: `1px solid ${SL.border}`, padding: "6px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 7, fontFamily: SL.mono, background: `${SL.goBlue}20`, color: SL.goBlue, padding: "2px 4px", borderRadius: 3 }}>GoRoutine #{w.id}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 7, color: SL.textBright, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {w.file ? w.file.replace("packages/", "") : "Idle"}
                          </div>
                        </div>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: w.status === "checking" ? SL.green : SL.textMuted }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logs box */}
              <div style={{ background: "#06080C", borderRadius: 8, padding: 8, height: 160, overflowY: "auto", border: `1px solid ${SL.border}` }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: SL.textMuted, borderBottom: `1px solid ${SL.border}`, paddingBottom: 4, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                  <span>COMPILER LOGS</span>
                  <span>{compMode === "tsgo" ? "tsgo pipeline active" : compMode === "tsc" ? "tsc pipeline active" : "pipeline idle"}</span>
                </div>
                {compMode === "none" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 9, color: SL.textMuted }}>
                    Select a compilation engine above to start simulation.
                  </div>
                )}
                {compMode === "tsc" && tscLogs.map(l => (
                  <div key={l.id} style={{ fontSize: 8, fontFamily: SL.mono, color: "#a5b4fc", display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span>[{l.time}] Checking: {l.file}</span>
                    <span style={{ color: SL.green }}>[OK]</span>
                  </div>
                ))}
                {compMode === "tsgo" && tsgoLogs.map(l => (
                  <div key={l.id} style={{ fontSize: 8, fontFamily: SL.mono, color: "#93c5fd", display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span>[{l.time}] [Worker {l.worker}] Checking: {l.file.replace("packages/", "")}</span>
                    {l.status === "cached" ? (
                      <span style={{ color: SL.yellow }}>[CACHED]</span>
                    ) : (
                      <span style={{ color: SL.green }}>[OK]</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Design Decision Detail */}
            <div style={{ background: SL.surface, border: `1px solid ${SL.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SL.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Key Optimisation Mechanics in tsgo</div>
              {[
                { title: "Parallel Dependency Resolution", detail: "tsgo parses imports and constructs Slack's dependency tree in Go, spawning concurrent routines (Go channels) to typecheck isolated sub-graphs parallelly instead of tsc's single-thread traversal." },
                { title: "AST & Build Cache Serialization", detail: "Locally caches TypeScript definitions (.d.ts) using incremental file hashes. If a package's internal exports don't change, dependent modules skip re-checking completely (average 60% cache hits)." },
                { title: "Omit Emit Pipeline", detail: "Local typechecking does not generate JS files (transpilation is offloaded to esbuild/SWC). Running tsgo strictly performs static diagnostics, speeding up the process massively." },
              ].map((item, idx) => (
                <div key={idx} style={{ padding: "6px 8px", borderRadius: 6, background: SL.surface2, marginBottom: 4, fontSize: 8.5 }}>
                  <strong style={{ color: SL.goBlue }}>{item.title}: </strong>
                  <span style={{ color: SL.text }}>{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SL.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={SL.goBlue} label="tsgo architecture — Go-based parallel runner snippet" code={
`// How tsgo parallelizes and caches typechecking
// Abstracted concept from the internal Go compiler wrapper

package typechecker

import (
	"crypto/sha256"
	"fmt"
	"os"
	"sync"
)

type Module struct {
	Path         string
	Dependencies []string
	Hash         string
}

type TypecheckResult struct {
	ModulePath string
	Cached     bool
	Errors     []string
	Success    bool
}

// ParallelRunner orchestrates multiple Go routines checking isolated packages.
func ParallelRunner(modules map[string]*Module, workers int) map[string]*TypecheckResult {
	queue := make(chan *Module, len(modules))
	results := make(chan *TypecheckResult, len(modules))
	var wg sync.WaitGroup

	// Feed modules into channels
	for _, mod := range modules {
		queue <- mod
	}
	close(queue)

	// Spawn Go routines as checking workers
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for mod := range queue {
				// 1. Check local hash store
				if checkCacheHit(mod) {
					results <- &TypecheckResult{
						ModulePath: mod.Path,
						Cached:     true,
						Success:    true,
					}
					continue
				}

				// 2. Perform validation (calling underlying esbuild/swc parser parser)
				errs := runDiagnostic(mod)
				success := len(errs) == 0

				// 3. Write cache if success
				if success {
					writeCacheEntry(mod)
				}

				results <- &TypecheckResult{
					ModulePath: mod.Path,
					Cached:     false,
					Errors:     errs,
					Success:    success,
				}
			}
		}(i)
	}

	wg.Wait()
	close(results)

	// Process output
	finalResults := make(map[string]*TypecheckResult)
	for res := range results {
		finalResults[res.ModulePath] = res
	}
	return finalResults
}

func checkCacheHit(m *Module) bool {
	cachePath := fmt.Sprintf(".tsgo-cache/%x", sha256.Sum256([]byte(m.Path+m.Hash)))
	_, err := os.Stat(cachePath)
	return err == nil
}

// Result: Multi-threaded parallel processing + incremental hashing
// drops checkout runtime from 45 seconds (standard tsc) to 9 seconds.`} />
          </div>
        </div>
      )}

      {/* ── WEBPACK → RUST HMR ── */}
      {tab === "rust" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SL.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>HMR SPEED SIMULATOR</div>

            <div style={{ background: SL.surface, border: `1px solid ${SL.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: SL.textBright }}>HMR Mode Switcher</span>
                <div style={{ display: "flex", gap: 4, background: "#06080C", padding: 2, borderRadius: 6, border: `1px solid ${SL.border}` }}>
                  <button onClick={() => setBundlerMode("webpack")} style={{ background: bundlerMode === "webpack" ? SL.surface : "transparent", border: "none", cursor: "pointer", color: bundlerMode === "webpack" ? SL.textBright : SL.textMuted, fontSize: 8, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>Webpack</button>
                  <button onClick={() => setBundlerMode("rust")} style={{ background: bundlerMode === "rust" ? SL.surface : "transparent", border: "none", cursor: "pointer", color: bundlerMode === "rust" ? SL.rustOrange : SL.textMuted, fontSize: 8, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>Rust Bundler</button>
                </div>
              </div>

              {/* Simulated UI Window */}
              <div style={{ background: "#06080C", borderRadius: 8, border: `1px solid ${SL.border}`, padding: 16, textAlign: "center", position: "relative", marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: SL.textMuted, position: "absolute", top: 8, left: 10 }}>Slack Composer component (Simulated UI)</div>
                {hmrActive && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(11, 14, 20, 0.8)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, zIndex: 10 }}>
                    <div style={{ fontSize: 9, color: bundlerMode === "rust" ? SL.rustOrange : "#3b82f6", fontWeight: 700 }}>
                      {bundlerMode === "rust" ? "Rust compile: 120ms..." : "Webpack compile: 1.8s..."}
                    </div>
                  </div>
                )}
                
                {/* Simulated Composer Button */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 100 }}>
                  <button style={{
                    background: simulatedButtonColor,
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 24px",
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    transition: "background 0.3s",
                  }}>
                    Send Message
                  </button>
                </div>

                <div style={{ borderTop: `1px solid ${SL.border}`, paddingTop: 10 }}>
                  <span style={{ fontSize: 8, color: SL.textMuted, display: "block", marginBottom: 6 }}>Click color token to trigger code edit (HMR):</span>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    {[[SL.slackPurple, "Slack Purple"], [SL.slackPink, "Slack Pink"], [SL.goBlue, "Go Blue"], [SL.green, "Slack Green"]].map(([col, label]) => (
                      <button key={col} onClick={() => triggerHmr(col)} disabled={hmrActive} style={{ background: col, border: "none", width: 14, height: 14, borderRadius: "50%", cursor: hmrActive ? "not-allowed" : "pointer", outline: simulatedButtonColor === col ? `2px solid ${SL.textBright}` : "none" }} title={label} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Terminal outputs */}
              <div style={{ background: "#000", borderRadius: 8, padding: 8, height: 110, overflowY: "auto", border: `1px solid ${SL.border}`, fontFamily: SL.mono, fontSize: 8 }}>
                <div style={{ color: SL.textMuted, borderBottom: `1px solid ${SL.border}`, paddingBottom: 4, marginBottom: 4 }}>Dev Server Terminal</div>
                {mockTerminalLogs.length === 0 ? (
                  <span style={{ color: SL.textMuted }}>No code edits performed yet. Click a circle above to change styles.</span>
                ) : (
                  mockTerminalLogs.map((l, i) => (
                    <div key={i} style={{ color: l.includes("✔") ? SL.green : l.includes("⚡") ? SL.rustOrange : l.includes("ℹ") ? "#3b82f6" : "#fff", marginBottom: 2 }}>{l}</div>
                  ))
                )}
                {hmrSpeedMs && (
                  <div style={{ color: SL.yellow, marginTop: 4, fontWeight: "bold" }}>[METRIC] HMR updated page in {hmrSpeedMs}ms!</div>
                )}
              </div>
            </div>

            {/* Performance analysis */}
            <div style={{ background: SL.surface, border: `1px solid ${SL.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SL.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Why Webpack struggles vs Rust bundlers</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: SL.surface2, padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 8.5, color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>❌ Webpack (Legacy)</div>
                  <ul style={{ margin: 0, paddingLeft: 10, fontSize: 7.5, color: SL.text, lineHeight: 1.4 }}>
                    <li>Single-thread tree-shaking</li>
                    <li>Slow JS-based plugin execution</li>
                    <li>Heavy memory usage</li>
                  </ul>
                </div>
                <div style={{ background: SL.surface2, padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 8.5, color: SL.green, fontWeight: 700, marginBottom: 4 }}>✔ Rust Bundler (Modern)</div>
                  <ul style={{ margin: 0, paddingLeft: 10, fontSize: 7.5, color: SL.text, lineHeight: 1.4 }}>
                    <li>Multi-core compilation</li>
                    <li>Incremental compilation graph</li>
                    <li>Instant HMR (React Fast Refresh)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SL.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={SL.rustOrange} label="Rust Bundler (Rspack/SWC) config migration comparison" code={
`// BEFORE (Webpack loader configs):
module.exports = {
  module: {
    rules: [
      {
        test: /\\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: { presets: ['@babel/preset-react', '@babel/preset-typescript'] }
          }
        ]
      }
    ]
  }
};
// ❌ Compilation latency: Webpack spins up Node VM, executes JS loaders
//    for each module sequentially. Slow parser thread-blocking.

// ──────────────────────────────────────────────────────────

// AFTER (Rust-based Rspack Configuration):
import { defineConfig } from '@rspack/cli';

export default defineConfig({
  builtins: {
    react: {
      development: true,
      refresh: true // Enforce React Fast Refresh in Rust
    }
  },
  module: {
    rules: [
      {
        test: /\\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader', // SWC: Compiles in Rust natively
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
              transform: { react: { runtime: 'automatic' } }
            }
          }
        }
      }
    ]
  }
});
// ✅ compilation: native Rust code runs on all available cores (Rayon).
// ✅ HMR: Only re-builds the specific edited branch of the compilation tree,
//    sending minimal patches to the dev socket.
//    Avg local recompilation: 1.8 seconds → 120ms (15x reduction).`} />
          </div>
        </div>
      )}

      {/* ── DX TELEMETRY ── */}
      {tab === "telemetry" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SL.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>SLACK DX PLATFORM TELEMETRY</div>

            <div style={{ background: SL.surface, border: `1px solid ${SL.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: SL.textBright }}>Telemetry Overview (Across 1,200 devs)</span>
                <div style={{ display: "flex", gap: 4, background: "#06080C", padding: 2, borderRadius: 6, border: `1px solid ${SL.border}` }}>
                  <button onClick={() => setTelemetryPeriod("before")} style={{ background: telemetryPeriod === "before" ? SL.surface : "transparent", border: "none", cursor: "pointer", color: telemetryPeriod === "before" ? SL.textBright : SL.textMuted, fontSize: 8, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>Before DX Migration</button>
                  <button onClick={() => setTelemetryPeriod("after")} style={{ background: telemetryPeriod === "after" ? SL.surface : "transparent", border: "none", cursor: "pointer", color: telemetryPeriod === "after" ? SL.green : SL.textMuted, fontSize: 8, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>After (tsgo + Rust)</button>
                </div>
              </div>

              {/* Developer stats progress comparison */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Local Typechecking (p95)", before: "45.0s", after: "9.0s", ratio: 0.2, c: SL.goBlue },
                  { label: "HMR Code-to-Screen loop (p95)", before: "1.80s", after: "0.12s", ratio: 0.07, c: SL.rustOrange },
                  { label: "CI Pre-Merge check block time", before: "14.5m", after: "4.8m", ratio: 0.33, c: SL.green },
                  { label: "Developer Satisfaction (CSAT)", before: "68%", after: "91%", ratio: 0.91, c: SL.slackPink },
                ].map(item => (
                  <div key={item.label} style={{ background: SL.surface2, padding: "8px 12px", borderRadius: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 4 }}>
                      <span style={{ color: SL.textBright, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ color: item.c, fontWeight: 800 }}>
                        {telemetryPeriod === "after" ? item.after : item.before}
                      </span>
                    </div>
                    {/* Visual bar */}
                    <div style={{ height: 6, background: "#0F121C", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        width: telemetryPeriod === "after" ? `${item.ratio * 100}%` : "100%",
                        height: "100%",
                        background: item.c,
                        transition: "width 0.4s ease-in-out"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Satisfaction survey metrics */}
            <div style={{ background: SL.surface, border: `1px solid ${SL.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SL.textMuted, marginBottom: 8, textTransform: "uppercase" }}>Slack Developer Feedback quotes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  { author: "Lead Product Eng", quote: "No longer having to wait 45 seconds for type errors during coding completely changed my focus. Best workflow upgrade in years." },
                  { author: "Staff Frontend Engineer", quote: "HMR feels almost instantaneous now. It keeps me in flow state, especially when designing responsive details on the app UI." },
                ].map((item, idx) => (
                  <div key={idx} style={{ background: SL.surface2, padding: 8, borderRadius: 6, borderLeft: `2px solid ${SL.slackPurple}` }}>
                    <div style={{ fontSize: 8, color: SL.textBright, fontStyle: "italic" }}>"{item.quote}"</div>
                    <div style={{ fontSize: 7, color: SL.textMuted, marginTop: 4, textAlign: "right" }}>— {item.author}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SL.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={SL.slackPink} label="Telemetry pipeline — monitoring compiler speeds in CI" code={
`// telemetry/compiler-observer.ts
// Hooked directly into slack-dx compiler lifecycle to report speed stats

import { client as StatsD } from 'statsd-client';
const metrics = new StatsD({ host: 'statsd.slack.com', prefix: 'dx.compiler' });

interface CompilerStats {
  moduleCount: number;
  durationMs: number;
  cacheHitRatio: number;
  workerCount: number;
  env: 'local' | 'ci';
  os: string;
}

export async function logCompileEvent(stats: CompilerStats) {
  const { durationMs, moduleCount, cacheHitRatio, env, os } = stats;

  // 1. Send duration stat
  metrics.timing('duration', durationMs);
  metrics.timing(\`duration.\${env}\`, durationMs);

  // 2. Track incremental cache impact
  metrics.gauge('cache_hit_ratio', cacheHitRatio);

  // 3. Count total active files compiled
  metrics.increment('modules_processed', moduleCount);

  // 4. Alert if threshold exceeded (Local dev check longer than 30s)
  if (env === 'local' && durationMs > 30_000) {
    console.warn(\`⚠️ High compilation latency detected on local machine: \${durationMs}ms\`);
    metrics.increment('local_slow_compilations');
    
    // Send anonymous local configs to diagnose (CPU count, RAM, Node version)
    await reportSystemSpecs(os);
  }
}

// telemetry/developer-sentinel
// Listens to local dev environments to check if typechecks hang or loop.
// If compilation fails 3 times sequentially in less than 60 seconds:
// Auto-suggests the engineer running "slack-dx --debug-cache" to reset.
// This reduced tooling ticket queue size by 35% across the organization.`} />
          </div>
        </div>
      )}

      {/* ── ROLLOUT PLAYBOOK ── */}
      {tab === "rollout" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SL.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>ROLLOUT WORKFLOW & RISK LOG</div>

            {/* Rollout Timeline */}
            <div style={{ background: SL.surface, border: `1px solid ${SL.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SL.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Phased Migration Cohorts (Adoption Tracker)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { phase: "Phase 1: DX Internal Alpha", status: "100% complete", count: "30 engineers", w: "100%", color: SL.green },
                  { phase: "Phase 2: Product Teams Beta", status: "100% complete", count: "250 engineers", w: "100%", color: SL.green },
                  { phase: "Phase 3: Core Client GA", status: "85% complete", count: "900 engineers", w: "85%", color: SL.goBlue },
                  { phase: "Phase 4: Full Slack Org", status: "Scheduled", count: "1,200+ engineers", w: "0%", color: SL.textMuted },
                ].map((item, idx) => (
                  <div key={idx} style={{ background: SL.surface2, padding: "6px 10px", borderRadius: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginBottom: 3 }}>
                      <span style={{ color: SL.textBright, fontWeight: 700 }}>{item.phase}</span>
                      <span style={{ color: item.color, fontWeight: 700 }}>{item.status} ({item.count})</span>
                    </div>
                    <div style={{ height: 4, background: "#0F121C", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: item.w, height: "100%", background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Log Interactive */}
            <div style={{ background: SL.surface, border: `1px solid ${SL.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: SL.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Risk Mitigation Registry (Click to expand)</div>
              {RISKS.map((r, i) => (
                <div key={i} onClick={() => setSelectedRisk(selectedRisk === i ? null : i)} style={{ padding: "6px 8px", borderRadius: 6, marginBottom: 4, cursor: "pointer", background: selectedRisk === i ? `${SL.slackPurple}20` : SL.surface2, border: `1px solid ${selectedRisk === i ? SL.slackPurple : SL.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 8.5, fontWeight: 700, color: SL.textBright }}>{r.title}</span>
                    <span style={{ fontSize: 7, padding: "1px 4px", borderRadius: 3, background: r.severity === "Critical" ? `${SL.rustOrange}30` : r.severity === "High" ? `${SL.yellow}30` : `${SL.goBlue}30`, color: r.severity === "Critical" ? SL.rustOrange : r.severity === "High" ? SL.yellow : SL.goBlue, fontWeight: 700 }}>{r.severity}</span>
                  </div>
                  {selectedRisk === i && (
                    <div style={{ marginTop: 6, borderTop: `1px solid ${SL.border}`, paddingTop: 6 }}>
                      <div style={{ fontSize: 7.5, color: SL.textMuted, marginBottom: 4 }}><strong style={{ color: SL.textBright }}>Concern:</strong> {r.desc}</div>
                      <div style={{ fontSize: 7.5, color: SL.green }}><strong style={{ color: SL.textBright }}>Mitigation:</strong> {r.mitigation}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: SL.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={SL.green} label="Pre-Merge validation AST checks — tsc/tsgo verification" code={
`// scripts/validate-compiler-parity.ts
// Runs in post-merge validation pipelines to ensure parity between compilers

import { execSync } from 'child_process';
import * as fs from 'fs';

interface DiagnosticError {
  file: string;
  line: number;
  code: string;
  message: string;
}

export function runParityValidation() {
  console.log("Starting compiler AST parity checks...");

  // 1. Run tsc (Standard TypeScript compiler output)
  let tscRaw: string;
  try {
    tscRaw = execSync('npx tsc --noEmit --pretty false').toString();
  } catch (error: any) {
    tscRaw = error.stdout.toString();
  }
  const tscErrors = parseTscOutput(tscRaw);

  // 2. Run tsgo (Go-based parallel compiler output)
  let tsgoRaw: string;
  try {
    tsgoRaw = execSync('./bin/tsgo --noEmit').toString();
  } catch (error: any) {
    tsgoRaw = error.stdout.toString();
  }
  const tsgoErrors = parseTsgoOutput(tsgoRaw);

  // 3. Diff diagnostics
  const mismatches = checkMismatches(tscErrors, tsgoErrors);

  if (mismatches.length > 0) {
    console.error("❌ Discrepancies detected between tsc and tsgo!");
    mismatches.forEach(m => {
      console.error(\`[\${m.file}:L\${m.line}] Code \${m.code}: \${m.message}\`);
    });
    // Report telemetry
    reportMismatches(mismatches);
    process.exit(1); // Fail build
  }

  console.log("✔ Parity validation complete. 100% compiler error alignment.");
}

function checkMismatches(tsc: DiagnosticError[], tsgo: DiagnosticError[]) {
  const diffs: DiagnosticError[] = [];
  const tscMap = new Map(tsc.map(e => [\`\${e.file}-\${e.line}-\${e.code}\`, e]));
  
  // Find any error caught by tsc but missing in tsgo
  for (const [key, err] of tscMap) {
    const hasMatch = tsgo.some(e => e.file === err.file && e.line === err.line && e.code === err.code);
    if (!hasMatch) {
      diffs.push(err);
    }
  }
  return diffs;
}`} />
          </div>
        </div>
      )}
    </div>
  );
}
