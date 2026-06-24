/**
 * AdsFEInfraDemo.tsx
 *
 * "Working on the Ads Front End Infrastructure team to build a JavaScript framework"
 *
 * Context: Large-scale Ads platform. The FE Infrastructure team does not build
 * product features — it builds the TOOLS and FRAMEWORKS that product engineers
 * use to build features. Think: the engine, not the car.
 *
 * The JavaScript framework problem in Ads specifically:
 *   - Ads run in thousands of publisher contexts (different browsers, iframes, sandboxes)
 *   - Performance constraints are extreme: ads must not block page render
 *   - Third-party ad scripts must be sandboxed — they cannot touch the host page
 *   - Lifecycle management: initialize → configure → load → render → track → refresh/destroy
 *   - Scale: framework is executed millions of times per day
 *
 * TABS
 *   🏗 Why a Framework  — the problem space: why Ads needs a custom JS framework
 *   ⚙ Framework Design  — architecture: module loader, plugin system, lifecycle
 *   ⚡ Ad Lifecycle      — interactive step-through of the ad rendering pipeline
 *   🔌 Plugin System     — extensibility pattern (viewability, tracking, refresh)
 */

import React, { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────

const WHY_FRAMEWORK_PROBLEMS = [
  {
    icon: "🕸",
    title: "Publisher diversity",
    problem: "Ads run on thousands of different publisher sites — different frameworks, different CSPs, different iframe depths. A generic solution breaks on 10% of them.",
    solution: "The framework abstracts the environment — one consistent API regardless of where the ad runs.",
  },
  {
    icon: "⚡",
    title: "Performance constraints",
    problem: "An ad that delays page render by 200ms costs publishers revenue and degrades user experience. Scripts must load asynchronously, never block.",
    solution: "The framework enforces async-first patterns: async script loading, deferred execution, non-blocking render hooks.",
  },
  {
    icon: "🔒",
    title: "Third-party sandboxing",
    problem: "Third-party ad creatives run arbitrary JavaScript. Without sandboxing, a buggy ad can crash the host page or access user data.",
    solution: "The framework sandboxes creative execution in a controlled iframe with postMessage communication and a restricted API surface.",
  },
  {
    icon: "📊",
    title: "Viewability & tracking",
    problem: "Advertisers pay per impression. An impression is only billable if the ad is actually viewed. Measuring this consistently across publishers is hard.",
    solution: "The framework provides a Viewability API — IntersectionObserver-based, standardised, and pluggable into third-party measurement providers.",
  },
  {
    icon: "🔄",
    title: "Lifecycle management",
    problem: "Ads can refresh (time-based, scroll-based, user-interaction-based). Without lifecycle hooks, teams implement refresh differently — causing memory leaks and duplicate impressions.",
    solution: "Explicit lifecycle: initialize → configure → load → render → track → refresh | destroy. Teams hook in at the right stage.",
  },
  {
    icon: "🧩",
    title: "Extensibility",
    problem: "Different ad formats (display, video, rich media, native) need different behaviour. Baking all of it into the core framework makes it fragile.",
    solution: "Plugin architecture — each format registers its own plugin. Core stays small and stable; plugins handle format-specific logic.",
  },
];

const LIFECYCLE_STEPS = [
  {
    id: "init",
    label: "Initialize",
    icon: "🔧",
    color: "#6366f1",
    detail: "Framework bootstraps: detect environment (iframe depth, CSP, browser capabilities). Register slot with global registry. Set up async queue for commands.",
    code: `// Public API — same on any publisher page
window.adFramework = window.adFramework || [];
window.adFramework.push({
  cmd: "init",
  slotId: "div-gpt-ad-123",
  config: { format: "display", size: [300, 250] }
});
// Commands queue until framework.js loads — no race condition`,
  },
  {
    id: "configure",
    label: "Configure",
    icon: "⚙️",
    color: "#0ea5e9",
    detail: "Slot receives targeting data, format config, and publisher overrides. Plugins register themselves for this slot. Environment capabilities assessed.",
    code: `// Framework processes queued commands on load
class AdSlot {
  configure(config: SlotConfig) {
    this.targeting = { ...this.targeting, ...config.targeting };
    this.size      = config.size ?? this.size;
    this.format    = config.format ?? "display";

    // Activate registered plugins for this slot
    this.plugins = PluginRegistry
      .getFor(this.format)
      .map(p => p.init(this));

    this.emit("configured", { slot: this });
  }
}`,
  },
  {
    id: "load",
    label: "Load Creative",
    icon: "📦",
    color: "#f59e0b",
    detail: "Ad server called asynchronously with targeting. Creative payload (HTML/JS/assets) returned. No blocking — if ad server is slow, page is unaffected.",
    code: `async load(): Promise<Creative> {
  // Never block page render — always async
  const response = await fetch(this.buildAdServerUrl(), {
    signal: AbortSignal.timeout(3000) // hard timeout
  });

  if (!response.ok) {
    this.emit("load:failed", { reason: response.status });
    return this.renderFallback();   // graceful degradation
  }

  const creative = await response.json();
  this.emit("load:success", { creative });
  return creative;
}`,
  },
  {
    id: "render",
    label: "Render",
    icon: "🖼",
    color: "#10b981",
    detail: "Creative HTML injected into an isolated iframe. Third-party script runs in sandboxed context with postMessage bridge for allowed operations. Host page untouched.",
    code: `render(creative: Creative): void {
  // Sandboxed iframe — third-party code cannot touch host page
  const iframe = document.createElement("iframe");
  iframe.sandbox.add("allow-scripts", "allow-same-origin");
  iframe.srcdoc = this.wrapCreative(creative.html);

  // postMessage bridge — restricted API for the creative
  window.addEventListener("message", (e) => {
    if (e.source !== iframe.contentWindow) return;
    this.handleCreativeMessage(e.data);
    // Allowed: track clicks, expand, request data
    // Blocked: DOM access, localStorage, cookie reads
  });

  this.container.appendChild(iframe);
  this.emit("rendered", { slotId: this.id });
}`,
  },
  {
    id: "track",
    label: "Track",
    icon: "📊",
    color: "#ec4899",
    detail: "Viewability measured via IntersectionObserver. Click tracking via delegated events. Impression fired when 50% of ad visible for 1 continuous second (IAB standard).",
    code: `track(): void {
  // IAB viewability standard: 50% visible for 1s continuous
  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.intersectionRatio >= 0.5) {
        this.viewStart = this.viewStart ?? Date.now();
        if (Date.now() - this.viewStart >= 1000) {
          this.emit("viewable");   // billable impression
          observer.disconnect();
        }
      } else {
        this.viewStart = null;   // reset if ad scrolled out
      }
    },
    { threshold: [0, 0.5, 1.0] }
  );

  observer.observe(this.container);
  this.cleanupTasks.push(() => observer.disconnect());
}`,
  },
  {
    id: "refresh",
    label: "Refresh / Destroy",
    icon: "🔄",
    color: "#8b5cf6",
    detail: "Refresh triggers full load cycle without re-initializing the slot. Destroy cleans up all observers, iframes, listeners, and removes slot from global registry — no memory leaks.",
    code: `refresh(): void {
  // Preserve slot identity, reload creative
  this.emit("refresh:start");
  this.destroyCreative();   // remove iframe, clean listeners
  this.load().then(() => this.render());
}

destroy(): void {
  // Run all registered cleanup tasks
  this.cleanupTasks.forEach(fn => fn());
  this.cleanupTasks = [];

  this.container.innerHTML = "";
  this.emit("destroyed");

  // Remove from global registry — slot is garbage-collectible
  SlotRegistry.remove(this.id);
}`,
  },
];

const PLUGINS = [
  {
    name: "ViewabilityPlugin",
    color: "#6366f1",
    hook: "afterRender",
    desc: "Measures IAB-standard viewability. Reports to DV360, IAS, or custom endpoint. Configurable threshold and duration.",
    code: `class ViewabilityPlugin implements AdPlugin {
  name = "viewability";
  hooks = ["afterRender", "onDestroy"];

  afterRender(slot: AdSlot) {
    // Plug into slot's track() method
    slot.on("viewable", () => {
      this.providers.forEach(p =>
        p.recordImpression(slot.targeting)
      );
    });
  }

  onDestroy(slot: AdSlot) {
    this.observer?.disconnect();
  }
}`,
  },
  {
    name: "RefreshPlugin",
    color: "#10b981",
    hook: "afterTrack",
    desc: "Time-based and scroll-based refresh. Respects IAB minimum interval (30s). Handles tab visibility — pauses when tab hidden.",
    code: `class RefreshPlugin implements AdPlugin {
  name = "refresh";
  hooks = ["afterTrack"];

  afterTrack(slot: AdSlot) {
    const minInterval = 30_000; // IAB minimum

    const schedule = () => {
      this.timer = setTimeout(() => {
        if (document.hidden) {
          // Pause refresh when tab not visible
          document.addEventListener("visibilitychange",
            () => { if (!document.hidden) schedule(); },
            { once: true }
          );
          return;
        }
        slot.refresh().then(() => schedule());
      }, minInterval);
    };

    schedule();
    slot.on("destroyed", () => clearTimeout(this.timer));
  }
}`,
  },
  {
    name: "VideoPlugin",
    color: "#f59e0b",
    hook: "beforeRender",
    desc: "Handles VAST/VPAID video ad formats. Manages playback lifecycle, quartile tracking, skip logic, and autoplay policies.",
    code: `class VideoPlugin implements AdPlugin {
  name = "video";
  hooks = ["beforeRender", "afterRender"];

  beforeRender(slot: AdSlot) {
    // Validate video creative metadata
    const { vastUrl, duration } = slot.creative;
    if (!vastUrl) throw new Error("Video requires VAST URL");

    slot.creative.html = this.buildVideoPlayer({
      vastUrl, duration,
      autoplay: this.canAutoplay(),
    });
  }

  afterRender(slot: AdSlot) {
    // Quartile tracking: 25%, 50%, 75%, 100% viewed
    slot.on("progress", ({ pct }) => {
      [25, 50, 75, 100].forEach(q => {
        if (pct >= q && !this.fired.has(q)) {
          this.fired.add(q);
          slot.emit(\`video:quartile:\${q}\`);
        }
      });
    });
  }
}`,
  },
  {
    name: "A11yPlugin",
    color: "#ec4899",
    hook: "afterRender",
    desc: "Injects ARIA labels, keyboard navigation, and focus management into ad containers. Makes ads accessible without requiring creative changes.",
    code: `class A11yPlugin implements AdPlugin {
  name = "a11y";
  hooks = ["afterRender"];

  afterRender(slot: AdSlot) {
    const container = slot.container;

    // Mark ad region for screen readers
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "Advertisement");

    // Ensure skip link for keyboard users
    const skipLink = document.createElement("a");
    skipLink.href = "#main-content";
    skipLink.className = "sr-only skip-ad";
    skipLink.textContent = "Skip advertisement";
    container.prepend(skipLink);

    // Focus management: focus stays in ad on expand
    slot.on("expanded", () => {
      container.querySelector("[data-focus-first]")
        ?.focus();
    });
  }
}`,
  },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 8, overflow: "hidden" }}>
      {label && (
        <div style={{ padding: "6px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color: "#64748b" }}>
          {label}
        </div>
      )}
      <pre style={{ margin: 0, padding: 14, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 380 }}>
        {code}
      </pre>
    </div>
  );
}

// Live "ad slot" simulation
function LiveAdSlot() {
  const [state, setState] = useState<"idle" | "loading" | "rendered" | "viewable" | "refreshing">("idle");
  const [log, setLog] = useState<{ t: string; msg: string; color: string }[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = (msg: string, color = "#94a3b8") => {
    const t = new Date().toLocaleTimeString("en-AU", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLog(prev => [...prev.slice(-6), { t, msg, color }]);
  };

  const runLifecycle = () => {
    setLog([]);
    setState("loading");
    addLog("init → slot registered", "#6366f1");
    timerRef.current = setTimeout(() => {
      addLog("configure → targeting applied, plugins loaded", "#0ea5e9");
      timerRef.current = setTimeout(() => {
        addLog("load → creative fetched from ad server", "#f59e0b");
        timerRef.current = setTimeout(() => {
          setState("rendered");
          addLog("render → iframe injected, sandboxed", "#10b981");
          timerRef.current = setTimeout(() => {
            addLog("track → viewability observer active", "#ec4899");
            timerRef.current = setTimeout(() => {
              setState("viewable");
              addLog("viewable ✅ → impression fired (IAB: 50% for 1s)", "#4ade80");
            }, 1400);
          }, 600);
        }, 900);
      }, 700);
    }, 600);
  };

  const refresh = () => {
    setState("refreshing");
    addLog("refresh:start → destroying creative", "#8b5cf6");
    timerRef.current = setTimeout(() => {
      setState("loading");
      addLog("load → new creative fetched", "#f59e0b");
      timerRef.current = setTimeout(() => {
        setState("rendered");
        addLog("render → new iframe injected", "#10b981");
        timerRef.current = setTimeout(() => {
          setState("viewable");
          addLog("viewable ✅ → new impression fired", "#4ade80");
        }, 1200);
      }, 900);
    }, 600);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const stateColor: Record<typeof state, string> = {
    idle: "#334155", loading: "#f59e0b", rendered: "#10b981", viewable: "#4ade80", refreshing: "#8b5cf6",
  };

  return (
    <div style={{ background: "#1e293b", border: `2px solid ${stateColor[state]}40`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>Live Ad Slot Simulation</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>slot-id: div-gpt-ad-300x250</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: stateColor[state], background: stateColor[state] + "20", border: `1px solid ${stateColor[state]}40`, borderRadius: 20, padding: "3px 10px" }}>
            ● {state}
          </span>
        </div>
      </div>

      {/* Ad slot visual */}
      <div style={{ width: 300, height: 180, margin: "0 auto 14px", background: "#0f172a", borderRadius: 8, border: `1px solid ${stateColor[state]}30`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {state === "idle" && <div style={{ fontSize: 11, color: "#334155" }}>Ad slot · 300×250</div>}
        {state === "loading" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 32, height: 32, border: "3px solid #334155", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
            <div style={{ fontSize: 10, color: "#64748b" }}>Loading creative…</div>
          </div>
        )}
        {(state === "rendered" || state === "viewable" || state === "refreshing") && (
          <>
            <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, #6366f120, #0ea5e920)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>📦 sandboxed iframe</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>Creative Loaded</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>300×250 · display</div>
              {state === "viewable" && (
                <div style={{ background: "#4ade8020", border: "1px solid #4ade8040", borderRadius: 6, padding: "4px 10px", fontSize: 10, color: "#4ade80" }}>✅ Impression fired</div>
              )}
            </div>
            {state === "refreshing" && (
              <div style={{ position: "absolute", inset: 0, background: "#0f172a80", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 10, color: "#8b5cf6" }}>Refreshing…</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <button onClick={runLifecycle} disabled={state === "loading" || state === "refreshing"} style={{ background: "#6366f120", border: "1px solid #6366f140", borderRadius: 6, padding: "6px 14px", color: "#a5b4fc", cursor: "pointer", fontSize: 11, opacity: state === "loading" || state === "refreshing" ? 0.5 : 1 }}>
          ▶ Run lifecycle
        </button>
        <button onClick={refresh} disabled={state === "idle" || state === "loading" || state === "refreshing"} style={{ background: "#8b5cf620", border: "1px solid #8b5cf640", borderRadius: 6, padding: "6px 14px", color: "#c4b5fd", cursor: "pointer", fontSize: 11, opacity: (state === "idle" || state === "loading" || state === "refreshing") ? 0.5 : 1 }}>
          🔄 Refresh
        </button>
        <button onClick={() => { setState("idle"); setLog([]); if (timerRef.current) clearTimeout(timerRef.current); }} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 14px", color: "#64748b", cursor: "pointer", fontSize: 11 }}>
          Reset
        </button>
      </div>

      {/* Event log */}
      <div style={{ background: "#0f172a", borderRadius: 6, padding: 10, minHeight: 80 }}>
        <div style={{ fontSize: 9, color: "#475569", marginBottom: 6, fontWeight: 700 }}>EVENT LOG</div>
        {log.length === 0 && <div style={{ fontSize: 10, color: "#334155" }}>No events yet — click "Run lifecycle"</div>}
        {log.map((entry, i) => (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 10, marginBottom: 2 }}>
            <span style={{ color: "#475569", fontFamily: "monospace", flexShrink: 0 }}>{entry.t}</span>
            <span style={{ color: entry.color }}>{entry.msg}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function AdsFEInfraDemo() {
  const [activeTab, setActiveTab]     = useState<"why" | "design" | "lifecycle" | "plugins">("why");
  const [lifecycleStep, setLifecycleStep] = useState(0);
  const [selectedPlugin, setSelectedPlugin] = useState(0);

  const curStep   = LIFECYCLE_STEPS[lifecycleStep];
  const curPlugin = PLUGINS[selectedPlugin];

  const TABS = [
    { id: "why"       as const, label: "🏗 Why a Framework" },
    { id: "design"    as const, label: "⚙ Framework Design" },
    { id: "lifecycle" as const, label: "⚡ Ad Lifecycle" },
    { id: "plugins"   as const, label: "🔌 Plugin System" },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>📡</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Ads FE Infrastructure</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              JavaScript framework for Ads · Plugin architecture · Lifecycle management · Scale
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Platform Engineering", "JS Framework", "Ads Infrastructure", "Plugin Architecture", "Viewability", "Sandboxing", "Performance at Scale"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4, flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 18px",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── WHY A FRAMEWORK ── */}
      {activeTab === "why" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc", marginBottom: 6 }}>
              FE Infrastructure ≠ building features
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
              The Ads FE Infrastructure team's output is not a product feature that users see directly.
              The output is a <strong style={{ color: "#f1f5f9" }}>JavaScript framework</strong> that other engineers use
              to build ad products. Every product engineer who builds on this framework is a "customer."
              The design constraints are different: backward compatibility matters enormously,
              performance is a hard constraint (not a nice-to-have), and correctness is safety-critical
              (a broken ad framework can take down revenue for the entire platform).
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
            {WHY_FRAMEWORK_PROBLEMS.map(item => (
              <div key={item.title} style={{ background: "#1e293b", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", background: "#0f172a", borderBottom: "1px solid #334155", display: "flex", gap: 6, alignItems: "center" }}>
                  <span>{item.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{item.title}</span>
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#ef4444", marginBottom: 8, lineHeight: 1.6 }}>⚠ {item.problem}</div>
                  <div style={{ fontSize: 10, color: "#4ade80", lineHeight: 1.6 }}>✅ {item.solution}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Framework vs Ad-hoc Code — the difference at scale</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                {
                  label: "❌ Without a framework (ad-hoc)",
                  color: "#ef4444",
                  items: [
                    "Each product team implements their own async loader",
                    "Viewability measured inconsistently — billing disputes",
                    "Third-party scripts can crash publisher pages",
                    "Refresh implemented 6 different ways — memory leaks",
                    "A browser update breaks some teams, not others",
                    "Impossible to A/B test loading strategies at platform level",
                  ],
                },
                {
                  label: "✅ With a shared framework",
                  color: "#4ade80",
                  items: [
                    "One async loader — optimised, cached, battle-tested",
                    "Viewability standardised — consistent billing",
                    "Sandboxing enforced — creative cannot touch host page",
                    "Refresh is a lifecycle event — teams hook in, not reinvent",
                    "Framework absorbs browser updates — products unaffected",
                    "Platform-wide experiments: test loading strategies centrally",
                  ],
                },
              ].map(col => (
                <div key={col.label} style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: col.color, marginBottom: 8 }}>{col.label}</div>
                  {col.items.map(item => (
                    <div key={item} style={{ fontSize: 10, color: "#64748b", marginBottom: 5, display: "flex", gap: 5 }}>
                      <span style={{ color: col.color, flexShrink: 0 }}>›</span>{item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FRAMEWORK DESIGN ── */}
      {activeTab === "design" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <CodeBlock label="Core pattern: command queue (handles async script loading)" code={
`// Publisher adds this ONE snippet to their page:
// <script async src="https://ads.example.com/framework.js"></script>
//
// The key insight: the script loads ASYNCHRONOUSLY,
// but publishers need to call the API synchronously.
// Solution: command queue pattern — borrowed from Google Analytics.

// On publisher page (runs before framework.js loads):
window.adsCmd = window.adsCmd || [];
window.adsCmd.push(["defineSlot", "div-ad-123", [300, 250]]);
window.adsCmd.push(["setTargeting", { category: "finance" }]);
window.adsCmd.push(["display", "div-ad-123"]);
// Commands queued — no errors if framework not loaded yet

// Inside framework.js (runs when loaded):
const queue = window.adsCmd || [];

// Process existing commands
queue.forEach(cmd => framework.execute(cmd));

// Replace array with Proxy that executes immediately
window.adsCmd = new Proxy([], {
  get(target, prop) {
    if (prop === "push") {
      return (...cmds: Command[]) => {
        cmds.forEach(cmd => framework.execute(cmd));
      };
    }
    return target[prop as keyof typeof target];
  }
});`} />
            <CodeBlock label="Module architecture: core + pluggable layers" code={
`// Framework layers — thin core, thick plugins

// ── LAYER 1: Core (always loaded, ~8KB gzipped) ──
// - Command queue processing
// - Slot registry
// - Event emitter (EventBus)
// - Environment detection (iframe depth, CSP)
// - Async script loader

// ── LAYER 2: Slot management (~12KB) ──
// - AdSlot class
// - Lifecycle state machine
// - postMessage sandbox bridge

// ── LAYER 3: Plugins (loaded on demand) ──
// - viewability.plugin.js (~6KB)
// - video.plugin.js       (~18KB)  — only for video slots
// - refresh.plugin.js     (~4KB)
// - a11y.plugin.js        (~5KB)

// Key design principle:
// A text ad slot loads 8 + 12 + 4 + 6 = 30KB
// A video slot loads 8 + 12 + 18 = 38KB
// Neither loads what it does not need.

// Plugin registration (tree-shakeable):
import { AdFramework } from "@ads/framework-core";
import { ViewabilityPlugin } from "@ads/plugin-viewability";
import { RefreshPlugin } from "@ads/plugin-refresh";

AdFramework.register([ViewabilityPlugin, RefreshPlugin]);`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CodeBlock label="EventBus — typed events across the framework" code={
`// Typed event system — framework teams and product teams
// use the same event vocabulary

type AdEvents = {
  "slot:initialized": { slotId: string };
  "slot:configured":  { slotId: string; config: SlotConfig };
  "load:success":     { creative: Creative };
  "load:failed":      { reason: number; slotId: string };
  "rendered":         { slotId: string; creative: Creative };
  "viewable":         { slotId: string; visible: number };
  "clicked":          { slotId: string; target: string };
  "refresh:start":    { slotId: string; count: number };
  "destroyed":        { slotId: string };
};

class AdSlot extends TypedEventEmitter<AdEvents> {
  // Plugins, product engineers, measurement vendors
  // all listen to the same events — no custom instrumentation needed

  // Product engineer:
  slot.on("viewable", ({ slotId }) => {
    analytics.track("ad_viewable", { slotId });
  });

  // Measurement vendor (DV360 plugin):
  slot.on("viewable", (data) => {
    dv360.recordImpression(data);
  });
}`} />
            <CodeBlock label="Performance budget: the framework imposes hard limits" code={
`// Framework enforces performance budgets — not guidelines

const BUDGETS = {
  scriptSize:      32_768,   // 32KB gzipped — hard limit
  loadTimeout:     3_000,    // 3s ad server timeout
  renderTimeout:   1_000,    // 1s to inject iframe
  mainThreadBlock: 10,       // 10ms max sync execution
} as const;

// Load timeout — never hang the publisher page
const controller = new AbortController();
const id = setTimeout(() => {
  controller.abort();
  this.emit("load:failed", { reason: 408 });
  this.renderFallback(); // 1×1 pixel backup
}, BUDGETS.loadTimeout);

try {
  const creative = await fetch(url, {
    signal: controller.signal
  });
  clearTimeout(id);
  return creative.json();
} catch {
  clearTimeout(id);
  // Graceful degradation — NEVER crash the host page
}

// Main thread guard — long tasks split across frames
async function processQueue(items: Command[]) {
  for (const item of items) {
    await scheduler.yield();  // yield to browser between items
    execute(item);
  }
}`} />
          </div>
        </div>
      )}

      {/* ── AD LIFECYCLE ── */}
      {activeTab === "lifecycle" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>Lifecycle steps</div>
              {LIFECYCLE_STEPS.map((step, i) => (
                <button key={step.id} onClick={() => setLifecycleStep(i)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  background: lifecycleStep === i ? step.color + "20" : "#1e293b",
                  border: `1px solid ${lifecycleStep === i ? step.color : "#334155"}`,
                  borderRadius: 8, padding: "10px 12px", marginBottom: 6, cursor: "pointer",
                }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span>{step.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: lifecycleStep === i ? step.color : "#94a3b8" }}>
                      {i + 1}. {step.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div>
              <div style={{ background: "#1e293b", border: `1px solid ${curStep.color}30`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: curStep.color, marginBottom: 6 }}>
                  {curStep.icon} {curStep.label}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{curStep.detail}</div>
              </div>
              <CodeBlock label={`AdSlot.${curStep.id}() — implementation`} code={curStep.code} />
            </div>
          </div>

          <LiveAdSlot />
        </div>
      )}

      {/* ── PLUGIN SYSTEM ── */}
      {activeTab === "plugins" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 6 }}>Plugin Architecture — Extensibility without modifying core</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              Every plugin implements the <code style={{ background: "#0f172a", padding: "1px 5px", borderRadius: 3, fontSize: 11 }}>AdPlugin</code> interface and
              declares which lifecycle hooks it subscribes to. The core framework calls plugins in registration order at each hook.
              New formats (native, video, rich media) add plugins — they do not modify the core.
              This makes the core stable across years of product changes.
            </div>
          </div>

          <CodeBlock label="AdPlugin interface — the contract every plugin implements" code={
`interface AdPlugin {
  name: string;

  // Declare which lifecycle hooks this plugin needs
  hooks: Array<
    | "beforeInit" | "afterInit"
    | "beforeConfigure" | "afterConfigure"
    | "beforeLoad" | "afterLoad"
    | "beforeRender" | "afterRender"
    | "afterTrack"
    | "beforeRefresh" | "afterRefresh"
    | "onDestroy"
  >;

  // Hook implementations (optional — only implement what you need)
  beforeInit?     (slot: AdSlot): void;
  afterInit?      (slot: AdSlot): void;
  beforeConfigure?(slot: AdSlot): void;
  afterConfigure? (slot: AdSlot): void;
  beforeLoad?     (slot: AdSlot): void | Promise<void>;
  afterLoad?      (slot: AdSlot): void;
  beforeRender?   (slot: AdSlot): void;
  afterRender?    (slot: AdSlot): void;
  afterTrack?     (slot: AdSlot): void;
  beforeRefresh?  (slot: AdSlot): void;
  afterRefresh?   (slot: AdSlot): void;
  onDestroy?      (slot: AdSlot): void;
}

// Core calls plugins in order at each hook:
private async runHook(
  hookName: keyof AdPlugin,
  slot: AdSlot
): Promise<void> {
  const active = this.plugins.filter(p => p.hooks.includes(hookName));
  for (const plugin of active) {
    await (plugin[hookName] as Function)?.(slot);
  }
}`} />

          <div style={{ display: "flex", gap: 6, margin: "14px 0 12px", flexWrap: "wrap" }}>
            {PLUGINS.map((p, i) => (
              <button key={p.name} onClick={() => setSelectedPlugin(i)} style={{
                background: selectedPlugin === i ? p.color + "20" : "#1e293b",
                border: `1px solid ${selectedPlugin === i ? p.color : "#334155"}`,
                borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                color: selectedPlugin === i ? p.color : "#64748b", fontSize: 12,
              }}>{p.name}</button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
            <div style={{ background: "#1e293b", border: `1px solid ${curPlugin.color}30`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: curPlugin.color, marginBottom: 8 }}>{curPlugin.name}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>
                Hook: <code style={{ color: curPlugin.color }}>{curPlugin.hook}</code>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>{curPlugin.desc}</div>
            </div>
            <CodeBlock label={`${curPlugin.name} — implementation`} code={curPlugin.code} />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdsFEInfraDemo;
