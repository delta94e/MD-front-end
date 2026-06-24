/**
 * BuildSystemDemo.tsx
 *
 * JavaScript build and deploy system to break up the FE monolith.
 * Built on the front-end infrastructure team in Scala + JavaScript.
 *
 * KEY ACHIEVEMENTS
 *   - Broke a front-end monolith into independently deployable SPAs
 *   - Designed a modular build pipeline: transpile → bundle → test → deploy
 *   - Worked in Scala (build orchestration, asset server) + JavaScript (tooling)
 *
 * HISTORICAL CONTEXT (~2014-2016)
 *   Before Webpack dominated:
 *   - Browserify for bundling, Babel for transpiling (ES6→ES5)
 *   - Grunt/Gulp task runners
 *   - RequireJS / CommonJS modules
 *   - Custom build systems for non-standard requirements
 *   - Scala/Play Framework back-ends — asset pipeline tied to the server stack
 *
 * TABS
 *   🔍 The Problem     — monolith build: one bundle, coupled deploys, slow feedback
 *   ⚙ Pipeline Design  — modular pipeline: per-app stages, live simulation
 *   📦 Architecture    — app registry, asset manifest, versioning, cache busting
 *   ☕ Scala + JS      — what Scala does on the FE infra team, the cross-language stack
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────

type AppName = "checkout" | "dashboard" | "admin" | "marketing";
type StageId = "transpile" | "lint" | "bundle" | "test" | "hash" | "deploy";
type StageStatus = "idle" | "running" | "pass" | "fail";

interface BuildStage {
  id: StageId;
  label: string;
  icon: string;
  duration: number;
  detail: string;
  color: string;
  tool: string;
}

interface SpaApp {
  id: AppName;
  label: string;
  color: string;
  route: string;
  team: string;
  bundleKb: number;
  entryPoint: string;
  deployFreq: string;
}

const APPS: SpaApp[] = [
  { id: "checkout",   label: "Checkout SPA",   color: "#6366f1", route: "/checkout/*",  team: "Commerce",  bundleKb: 240, entryPoint: "src/checkout/index.js",   deployFreq: "8×/day" },
  { id: "dashboard",  label: "Dashboard SPA",  color: "#10b981", route: "/app/*",       team: "Product",   bundleKb: 380, entryPoint: "src/dashboard/index.js",  deployFreq: "5×/day" },
  { id: "admin",      label: "Admin SPA",      color: "#f59e0b", route: "/admin/*",     team: "Internal",  bundleKb: 190, entryPoint: "src/admin/index.js",      deployFreq: "2×/day" },
  { id: "marketing",  label: "Marketing SPA",  color: "#ec4899", route: "/landing/*",   team: "Growth",    bundleKb: 120, entryPoint: "src/marketing/index.js",  deployFreq: "10×/day"},
];

const PIPELINE_STAGES: BuildStage[] = [
  { id: "transpile", label: "Transpile",   icon: "⚗", color: "#6366f1", duration: 1400, tool: "Babel",        detail: "ES6+ → ES5 via Babel. JSX transformed. Source maps generated. Dead code stripped." },
  { id: "lint",      label: "Lint",        icon: "✔", color: "#0ea5e9", duration: 900,  tool: "ESLint",       detail: "ESLint runs against transpiled source. Code style, unused vars, unsafe patterns flagged. Build fails on error." },
  { id: "bundle",    label: "Bundle",      icon: "📦", color: "#f59e0b", duration: 2000, tool: "Browserify",   detail: "CommonJS modules resolved. Dependency graph traversed. Output: single concatenated bundle.js." },
  { id: "test",      label: "Unit Tests",  icon: "🧪", color: "#10b981", duration: 1800, tool: "Mocha/Karma",  detail: "Mocha unit tests + Karma browser runner. Coverage threshold enforced. Build fails below 80%." },
  { id: "hash",      label: "Hash",        icon: "🔑", color: "#8b5cf6", duration: 400,  tool: "MD5/SHA",      detail: "Content hash appended to filename: bundle.js → bundle.a4f2c3d1.js. Cache busting without server config changes." },
  { id: "deploy",    label: "Deploy",      icon: "🚀", color: "#4ade80", duration: 1200, tool: "S3 + CDN",     detail: "Hashed bundle uploaded to S3. Manifest updated: { checkout: 'bundle.a4f2c3d1.js' }. CDN invalidation triggered." },
];

const MONOLITH_PROBLEMS = [
  { icon: "⏱", title: "Build time for all teams",  before: "18 min (one build for everything)", after: "3-5 min per SPA (parallel, independent)" },
  { icon: "🔗", title: "Deploy coupling",           before: "All teams coordinate release",       after: "Each team deploys independently" },
  { icon: "🧨", title: "Blast radius of a rollback",before: "Entire product rolls back",          after: "Only the affected SPA rolls back" },
  { icon: "📦", title: "Bundle size",               before: "2.4MB (everything, always loaded)",  after: "120–380KB per SPA (only what's needed)" },
  { icon: "🧪", title: "Test run",                  before: "Run all tests on every change",       after: "Run only the changed SPA's tests" },
  { icon: "😰", title: "Deploy confidence",         before: "Low — changes affect everyone",       after: "High — change is scoped to one SPA" },
];

const SCALA_ROLES = [
  {
    title: "Asset Manifest Server",
    icon: "🗂",
    color: "#f97316",
    detail: "A lightweight Play Framework HTTP service that reads the asset manifest (JSON mapping app → hashed bundle URL) and serves the correct script tag for each SPA route. When a new bundle is deployed, only the manifest updates.",
    code: `// Play Framework controller (Scala)
// Reads manifest, returns script tag for the requested app

class AssetController @Inject()(
  manifestService: ManifestService,
  cc: ControllerComponents,
) extends AbstractController(cc) {

  def scriptTag(appName: String): Action[AnyContent] =
    Action { implicit request =>
      manifestService.getBundle(appName) match {
        case Some(bundle) =>
          Ok(views.html.scriptTag(bundle.url))
            .withHeaders(
              "Cache-Control" -> "max-age=60",
              "X-App-Version" -> bundle.version,
            )
        case None =>
          NotFound(s"No bundle found for: \$appName")
      }
    }
}

// ManifestService reads: { "checkout": "bundle.a4f2c3d1.js", ... }
// and constructs the CDN URL for the requested bundle`,
  },
  {
    title: "Build Orchestrator",
    icon: "🎛",
    color: "#8b5cf6",
    detail: "An Akka-based service that receives build triggers (via webhook or API), schedules builds per SPA, manages build worker capacity, and streams build logs back to the calling engineer's terminal or CI dashboard.",
    code: `// Akka actor — manages build queue per SPA (Scala)

class BuildOrchestrator extends Actor {
  val buildQueue: Map[AppName, Queue[BuildJob]] = Map(
    Checkout  -> Queue.empty,
    Dashboard -> Queue.empty,
    Admin     -> Queue.empty,
    Marketing -> Queue.empty,
  )

  def receive: Receive = {
    case TriggerBuild(appName, commit, requester) =>
      val job = BuildJob(appName, commit, requester, Instant.now())
      buildQueue(appName).enqueue(job)

      // Delegate to a build worker actor per app
      // Workers are isolated — one app's build never blocks another
      context.actorOf(BuildWorker.props(job)) ! StartBuild

    case BuildComplete(job, result) =>
      notifyRequester(job.requester, result)
      if (result.success) updateManifest(job.appName, result.bundle)
      // Only updates manifest for the specific app — others unaffected
  }
}`,
  },
  {
    title: "sbt Plugin (Build Config)",
    icon: "🔧",
    color: "#0ea5e9",
    detail: "An sbt (Scala Build Tool) plugin that integrates the JavaScript build pipeline into the existing Scala build system. Allows the Scala back-end and JavaScript front-end to share a single build command: `sbt deploy`.",
    code: `// sbt plugin — integrates JS build into Scala build lifecycle (Scala)

object JsBuildPlugin extends AutoPlugin {
  object autoImport {
    val jsBuild    = taskKey[File]("Build the JavaScript SPA")
    val jsDeploy   = taskKey[Unit]("Deploy the JavaScript bundle to CDN")
    val jsAppName  = settingKey[String]("Name of the SPA to build")
  }

  import autoImport._

  override def projectSettings: Seq[Setting[_]] = Seq(
    jsBuild := {
      val app = jsAppName.value
      val log = streams.value.log

      log.info(s"Running JS build pipeline for: \$app")
      // Delegates to the Node.js build script
      val exitCode = Process(Seq(
        "node", "scripts/build.js", "--app", app
      )).!

      if (exitCode != 0) sys.error(s"JS build failed for \$app")
      (baseDirectory.value / "dist" / s"\$app.bundle.js")
    },

    // Hook JS build into the standard Scala compile phase
    Compile / compile := (Compile / compile)
      .dependsOn(jsBuild)
      .value,
  )
}`,
  },
];

// ─────────────────────────────────────────────────────────────────
// Live build simulation
// ─────────────────────────────────────────────────────────────────

type AppBuildState = { stageIdx: number; statuses: Record<StageId, StageStatus> };

const INIT_BUILD: AppBuildState = {
  stageIdx: -1,
  statuses: { transpile: "idle", lint: "idle", bundle: "idle", test: "idle", hash: "idle", deploy: "idle" },
};

function useBuildSim() {
  const [builds, setBuilds] = useState<Record<AppName, AppBuildState>>({
    checkout: { ...INIT_BUILD, statuses: { ...INIT_BUILD.statuses } },
    dashboard: { ...INIT_BUILD, statuses: { ...INIT_BUILD.statuses } },
    admin: { ...INIT_BUILD, statuses: { ...INIT_BUILD.statuses } },
    marketing: { ...INIT_BUILD, statuses: { ...INIT_BUILD.statuses } },
  });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const triggerBuild = useCallback((appId: AppName, failAt?: StageId) => {
    clearTimers();
    // Reset this app only — others unaffected
    setBuilds(prev => ({
      ...prev,
      [appId]: { stageIdx: 0, statuses: { transpile: "running", lint: "idle", bundle: "idle", test: "idle", hash: "idle", deploy: "idle" } },
    }));

    let elapsed = 0;
    PIPELINE_STAGES.forEach((stage, idx) => {
      const start = elapsed;
      elapsed += stage.duration;
      const end = elapsed;

      timers.current.push(setTimeout(() => {
        if (stage.id === failAt) {
          setBuilds(prev => ({
            ...prev,
            [appId]: {
              stageIdx: idx,
              statuses: { ...prev[appId].statuses, [stage.id]: "fail" },
            },
          }));
        } else {
          setBuilds(prev => ({
            ...prev,
            [appId]: {
              stageIdx: idx + 1,
              statuses: {
                ...prev[appId].statuses,
                [stage.id]: "pass",
                ...(PIPELINE_STAGES[idx + 1] ? { [PIPELINE_STAGES[idx + 1].id]: "running" } : {}),
              },
            },
          }));
        }
      }, end));
    });
  }, []);

  const reset = useCallback((appId: AppName) => {
    setBuilds(prev => ({
      ...prev,
      [appId]: { stageIdx: -1, statuses: { transpile: "idle", lint: "idle", bundle: "idle", test: "idle", hash: "idle", deploy: "idle" } },
    }));
  }, []);

  useEffect(() => () => clearTimers(), []);
  return { builds, triggerBuild, reset };
}

// ─────────────────────────────────────────────────────────────────
// Helper components
// ─────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<StageStatus, { bg: string; color: string; border: string }> = {
  idle:    { bg: "#0f172a",   color: "#334155", border: "#334155" },
  running: { bg: "#0ea5e920", color: "#60a5fa", border: "#0ea5e9" },
  pass:    { bg: "#4ade8015", color: "#4ade80", border: "#4ade8040" },
  fail:    { bg: "#ef444415", color: "#ef4444", border: "#ef444440" },
};

function StageChip({ stage, status }: { stage: BuildStage; status: StageStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: "6px 10px", textAlign: "center", minWidth: 70 }}>
      <div style={{ fontSize: 14 }}>{stage.icon}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: s.color, marginTop: 2 }}>{stage.label}</div>
      <div style={{ fontSize: 8, color: "#475569", marginTop: 1 }}>{stage.tool}</div>
      {status === "running" && <div style={{ fontSize: 8, color: "#60a5fa", marginTop: 1, animation: "pulse 1s infinite" }}>●</div>}
    </div>
  );
}

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 8, overflow: "hidden" }}>
      {label && <div style={{ padding: "6px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 14, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 360 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function BuildSystemDemo() {
  const [activeTab, setActiveTab] = useState<"problem" | "pipeline" | "arch" | "scala">("problem");
  const { builds, triggerBuild, reset } = useBuildSim();
  const [selectedStage, setSelectedStage] = useState(0);
  const [scalaRole, setScalaRole] = useState(0);
  const [simApp, setSimApp] = useState<AppName>("checkout");

  const TABS = [
    { id: "problem"  as const, label: "🔍 The Problem" },
    { id: "pipeline" as const, label: "⚙ Pipeline Design" },
    { id: "arch"     as const, label: "📦 Architecture" },
    { id: "scala"    as const, label: "☕ Scala + JS" },
  ];

  const curStage  = PIPELINE_STAGES[selectedStage];
  const curScala  = SCALA_ROLES[scalaRole];
  const curBuild  = builds[simApp];
  const buildDone = Object.values(curBuild.statuses).every(s => s === "pass") || Object.values(curBuild.statuses).some(s => s === "fail");
  const buildRunning = Object.values(curBuild.statuses).some(s => s === "running");

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>⚙️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>JS Build & Deploy System</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Monolith → independent SPAs · Modular build pipeline · Scala + JavaScript FE infrastructure
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Platform Engineering", "Build Systems", "Scala", "JavaScript", "Babel", "Browserify", "Independent Deploys", "Asset Pipeline", "CDN", "Modular Architecture"].map(t => (
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
            borderRadius: "8px 8px 0 0", padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── THE PROBLEM ── */}
      {activeTab === "problem" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #ef444430", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fca5a5", marginBottom: 8 }}>The Front-End Monolith: One Build to Rule Them All</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.8, marginBottom: 12 }}>
                  In the monolith era, all JavaScript — every page, every feature,
                  every team's code — lived in a single repository, compiled into
                  a single bundle, and deployed as a single atomic unit.
                </div>
                <div style={{ background: "#ef444410", border: "1px solid #ef444430", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>THE ONE BIG BUNDLE</div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                    {[
                      { label: "Checkout", pct: 30, color: "#6366f1" },
                      { label: "Dashboard", pct: 40, color: "#10b981" },
                      { label: "Admin", pct: 18, color: "#f59e0b" },
                      { label: "Marketing", pct: 12, color: "#ec4899" },
                    ].map(seg => (
                      <div key={seg.label} style={{ width: `${seg.pct}%`, background: seg.color + "40", border: `1px solid ${seg.color}60`, borderRadius: 4, padding: "6px 4px", textAlign: "center" }}>
                        <div style={{ fontSize: 8, color: seg.color, fontWeight: 700 }}>{seg.label}</div>
                        <div style={{ fontSize: 8, color: "#64748b" }}>{seg.pct}%</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>bundle.js — 2.4MB — ALL OR NOTHING</div>
                  <div style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>User visits /checkout — downloads all 2.4MB including Admin and Marketing code they will never use.</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {MONOLITH_PROBLEMS.map(p => (
                  <div key={p.title} style={{ background: "#0f172a", borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{p.icon} {p.title}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <div style={{ fontSize: 9, color: "#ef4444" }}>Before: {p.before}</div>
                      <div style={{ fontSize: 9, color: "#4ade80" }}>After: {p.after}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: "#1e293b", border: "1px solid #4ade8030", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", marginBottom: 10 }}>After: 4 Independent SPAs — each with its own build</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {APPS.map(app => (
                <div key={app.id} style={{ background: "#0f172a", border: `1px solid ${app.color}30`, borderRadius: 8, padding: 12, borderTop: `3px solid ${app.color}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: app.color, marginBottom: 4 }}>{app.label}</div>
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>{app.team} team · {app.route}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{app.bundleKb}KB · {app.deployFreq}</div>
                  <div style={{ marginTop: 6, height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${(app.bundleKb / 380) * 100}%`, height: "100%", background: app.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 10, color: "#64748b" }}>
              Total bundle delivered to a user visiting /checkout: <strong style={{ color: "#4ade80" }}>240KB</strong> (vs 2.4MB monolith — 10× reduction)
            </div>
          </div>
        </div>
      )}

      {/* ── PIPELINE DESIGN ── */}
      {activeTab === "pipeline" && (
        <div>
          {/* Stage explorer */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>Build pipeline stages (click to explore)</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {PIPELINE_STAGES.map((stage, i) => (
                <React.Fragment key={stage.id}>
                  <button onClick={() => setSelectedStage(i)} style={{
                    background: selectedStage === i ? stage.color + "20" : "#0f172a",
                    border: `2px solid ${selectedStage === i ? stage.color : "#334155"}`,
                    borderRadius: 8, padding: "10px 14px", cursor: "pointer", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 18 }}>{stage.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: selectedStage === i ? stage.color : "#64748b", marginTop: 4 }}>{stage.label}</div>
                    <div style={{ fontSize: 9, color: "#475569" }}>{stage.tool}</div>
                  </button>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <div style={{ display: "flex", alignItems: "center", color: "#334155", fontSize: 16 }}>→</div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div style={{ background: "#0f172a", borderRadius: 8, padding: 14, border: `1px solid ${curStage.color}30` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: curStage.color, marginBottom: 4 }}>
                {curStage.icon} {curStage.label} — via {curStage.tool}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{curStage.detail}</div>
            </div>
          </div>

          {/* Live simulation */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>Live simulation — builds run independently, in parallel</div>

            {/* App selector */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {APPS.map(app => (
                <button key={app.id} onClick={() => setSimApp(app.id)} style={{
                  background: simApp === app.id ? app.color + "20" : "#0f172a",
                  border: `1px solid ${simApp === app.id ? app.color : "#334155"}`,
                  borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                  color: simApp === app.id ? app.color : "#64748b", fontSize: 11,
                }}>{app.label}</button>
              ))}
            </div>

            {/* All app build states */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              {APPS.map(app => {
                const b = builds[app.id];
                const done = Object.values(b.statuses).every(s => s === "pass");
                const failed = Object.values(b.statuses).some(s => s === "fail");
                const running = Object.values(b.statuses).some(s => s === "running");
                return (
                  <div key={app.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 120, flexShrink: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: app.color }}>{app.label}</div>
                      <div style={{ fontSize: 9, color: "#475569" }}>
                        {done ? "✅ deployed" : failed ? "❌ failed" : running ? "⏳ building…" : "idle"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 3, flex: 1 }}>
                      {PIPELINE_STAGES.map(stage => {
                        const s = STATUS_STYLE[b.statuses[stage.id]];
                        return (
                          <div key={stage.id} title={stage.label} style={{
                            flex: 1, height: 24, background: s.bg,
                            border: `1px solid ${s.border}`,
                            borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10,
                          }}>
                            {b.statuses[stage.id] === "pass" && <span style={{ color: "#4ade80" }}>✓</span>}
                            {b.statuses[stage.id] === "fail" && <span style={{ color: "#ef4444" }}>✗</span>}
                            {b.statuses[stage.id] === "running" && <span style={{ color: "#60a5fa", animation: "pulse 1s infinite" }}>●</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 12, marginBottom: 14, fontSize: 9, color: "#64748b" }}>
              {PIPELINE_STAGES.map(s => <span key={s.id}>{s.icon} {s.label}</span>)}
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => triggerBuild(simApp)} disabled={buildRunning} style={{ background: "#4f46e5", border: "none", borderRadius: 8, padding: "8px 18px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: buildRunning ? 0.5 : 1 }}>
                ▶ Build {APPS.find(a => a.id === simApp)?.label}
              </button>
              <button onClick={() => triggerBuild(simApp, "test")} disabled={buildRunning} style={{ background: "#ef444420", border: "1px solid #ef444440", borderRadius: 8, padding: "8px 16px", color: "#ef4444", cursor: "pointer", fontSize: 12, opacity: buildRunning ? 0.5 : 1 }}>
                Simulate test failure
              </button>
              <button onClick={() => { APPS.forEach(a => triggerBuild(a.id)); }} disabled={buildRunning} style={{ background: "#10b98120", border: "1px solid #10b98140", borderRadius: 8, padding: "8px 16px", color: "#10b981", cursor: "pointer", fontSize: 12, opacity: buildRunning ? 0.5 : 1 }}>
                Build all (parallel)
              </button>
              <button onClick={() => APPS.forEach(a => reset(a.id))} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 14px", color: "#64748b", cursor: "pointer", fontSize: 11 }}>
                Reset
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 10, color: "#64748b" }}>
              💡 Click "Build all (parallel)" — notice all 4 SPAs build simultaneously. In the monolith, they all had to wait for one sequential build.
            </div>
          </div>

          <CodeBlock label="build.js — the JS build pipeline script (Node.js)" color="#f59e0b" code={
`#!/usr/bin/env node
// Modular build script — called per SPA, not once globally

const { argv } = require("yargs");
const { appName } = argv;  // e.g. --app checkout

const pipeline = [
  // 1. TRANSPILE — Babel converts ES6+ to ES5
  () => babel({
    src:     \`src/\${appName}/\`,
    out:     \`build/\${appName}/transpiled/\`,
    presets: ["@babel/preset-env", "@babel/preset-react"],
  }),

  // 2. LINT — fail fast on code quality issues
  () => eslint({ src: \`src/\${appName}/\`, failOnError: true }),

  // 3. BUNDLE — Browserify resolves CommonJS require() calls
  () => browserify({
    entry:  \`build/\${appName}/transpiled/index.js\`,
    output: \`build/\${appName}/bundle.js\`,
    // Shared deps (React, lodash) excluded — served separately
    external: ["react", "react-dom", "lodash"],
  }),

  // 4. TEST — Mocha unit tests for this SPA only
  () => mocha({ spec: \`test/\${appName}/**/*.test.js\`, reporter: "spec" }),

  // 5. HASH — content-addressable filenames for CDN caching
  () => contentHash({
    src:  \`build/\${appName}/bundle.js\`,
    out:  \`dist/\${appName}/\`,  // → bundle.a4f2c3d1.js
    manifest: "dist/manifest.json",
  }),

  // 6. DEPLOY — upload to S3, update manifest
  () => s3Upload({
    src:    \`dist/\${appName}/\`,
    bucket: "cdn.company.com",
    prefix: \`/assets/\${appName}/\`,
  }),
];

// Run stages sequentially, fail fast on any error
pipeline.reduce(
  (acc, stage) => acc.then(stage),
  Promise.resolve()
).catch(err => { console.error(err); process.exit(1); });`} />
        </div>
      )}

      {/* ── ARCHITECTURE ── */}
      {activeTab === "arch" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <CodeBlock label="App registry — declares all SPAs and their build config" color="#6366f1" code={
`// apps.config.js — single source of truth for all SPAs
module.exports = {
  apps: {
    checkout: {
      entry:    "src/checkout/index.js",
      route:    "/checkout/*",
      external: ["react", "react-dom"],
      env: {
        production:  "https://api.company.com",
        staging:     "https://api-staging.company.com",
      },
    },
    dashboard: {
      entry:    "src/dashboard/index.js",
      route:    "/app/*",
      external: ["react", "react-dom", "lodash"],
      // Dashboard has a feature flag for A/B test
      featureFlags: ["new-nav-2015"],
    },
    admin: {
      entry:    "src/admin/index.js",
      route:    "/admin/*",
      external: ["react", "react-dom"],
      // Admin only deployed to internal users
      restricted: true,
    },
    marketing: {
      entry:    "src/marketing/index.js",
      route:    "/landing/*",
      external: ["react"],
      // Marketing deploys most frequently — 10×/day
    },
  },
};`} />
            <CodeBlock label="Asset manifest — maps app → hashed bundle URL" color="#10b981" code={
`// dist/manifest.json — updated on every successful deploy
// The Scala asset server reads this file to resolve script URLs

{
  "checkout": {
    "bundle": "https://cdn.company.com/assets/checkout/bundle.a4f2c3d1.js",
    "version": "1.4.2",
    "deployedAt": "2015-08-12T14:23:01Z",
    "sha": "a4f2c3d1e5b6a7f8"
  },
  "dashboard": {
    "bundle": "https://cdn.company.com/assets/dashboard/bundle.9c2e1a4f.js",
    "version": "2.1.0",
    "deployedAt": "2015-08-12T11:05:22Z",
    "sha": "9c2e1a4fb3d6e8c2"
  },
  "admin": {
    "bundle": "https://cdn.company.com/assets/admin/bundle.7b3f2e1c.js",
    "version": "0.9.3",
    "deployedAt": "2015-08-11T16:44:17Z",
    "sha": "7b3f2e1c4a5d9f2b"
  },
  "marketing": {
    "bundle": "https://cdn.company.com/assets/marketing/bundle.2d8e5f3a.js",
    "version": "3.0.1",
    "deployedAt": "2015-08-12T15:01:55Z",
    "sha": "2d8e5f3a1c7b4e6d"
  }
}
// When Marketing deploys a new version, only the marketing key updates.
// Checkout, Dashboard, Admin are unaffected.`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CodeBlock label="Shared vendors bundle — React loaded once, not per SPA" color="#f59e0b" code={
`// vendors.config.js — shared deps built once, cached long-term
// SPAs declare these as "external" — they do not include React in their bundle

module.exports = {
  vendors: {
    entry: {
      react:     "require('react')",
      reactDom:  "require('react-dom')",
      lodash:    "require('lodash')",
    },
    output: "dist/vendors/vendors.[hash].js",
    // Cache: 1 year (content hash means URL only changes when deps change)
    cacheControl: "max-age=31536000, immutable",
  },
};

// HTML template — vendors loaded first, SPA second
// <script src="https://cdn.company.com/assets/vendors/vendors.abc123.js"></script>
// <script src="https://cdn.company.com/assets/checkout/bundle.a4f2c3d1.js"></script>

// If React 0.13 → 0.14 upgrade: vendors bundle gets a new hash.
// SPA bundles are unchanged (they still reference the global React).
// Only the script tag in the HTML template needs updating.`} />
            <CodeBlock label="Nginx routing — serves correct HTML shell per SPA" color="#8b5cf6" code={
`# nginx.conf — routes each path prefix to the right HTML shell
# Each shell loads its own bundle via the asset manifest

server {
  listen 443 ssl;
  server_name company.com;

  # Checkout SPA — serves checkout/index.html
  location /checkout/ {
    try_files $uri /checkout/index.html;
  }

  # Dashboard SPA
  location /app/ {
    try_files $uri /app/index.html;
  }

  # Admin SPA — internal IP only
  location /admin/ {
    allow 10.0.0.0/8;
    deny  all;
    try_files $uri /admin/index.html;
  }

  # Marketing SPA
  location /landing/ {
    try_files $uri /landing/index.html;
  }

  # Static assets — long cache, CDN-backed
  location /assets/ {
    proxy_pass       https://cdn.company.com;
    proxy_cache_valid 200 365d;
  }
}`} />
          </div>
        </div>
      )}

      {/* ── SCALA + JS ── */}
      {activeTab === "scala" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #f97316" + "30", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fdba74", marginBottom: 6 }}>Why Scala on a FE Infrastructure team?</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
              The company's backend was built on the <strong style={{ color: "#f1f5f9" }}>Play Framework</strong> (Scala's primary web framework)
              with <strong style={{ color: "#f1f5f9" }}>sbt</strong> as the build tool. The asset pipeline, deployment infrastructure, and CI system
              were all Scala-based. The FE infra team owned the <em>full stack</em> of asset delivery — from JavaScript build tooling to
              the Scala services that served assets and orchestrated builds. Working in both languages was required, not optional.
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {SCALA_ROLES.map((role, i) => (
              <button key={i} onClick={() => setScalaRole(i)} style={{
                background: scalaRole === i ? role.color + "20" : "#1e293b",
                border: `1px solid ${scalaRole === i ? role.color : "#334155"}`,
                borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                color: scalaRole === i ? role.color : "#64748b", fontSize: 12,
              }}>{role.icon} {role.title}</button>
            ))}
          </div>

          <div style={{ background: "#1e293b", border: `1px solid ${curScala.color}30`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: curScala.color, marginBottom: 6 }}>{curScala.icon} {curScala.title}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{curScala.detail}</div>
          </div>
          <CodeBlock label={`${curScala.title} — implementation`} color={curScala.color} code={curScala.code} />

          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>The cross-language skill matrix</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { lang: "JavaScript (Node.js)", color: "#f59e0b", skills: ["Babel transpilation config", "Browserify bundle resolution", "Mocha/Karma test setup", "Content-hash file naming", "npm scripts orchestration", "S3 upload via AWS SDK"] },
                { lang: "Scala (Play + sbt)",   color: "#f97316", skills: ["Play Framework HTTP routes", "sbt plugin authoring", "Akka actor model", "Futures / async Scala", "JSON parsing (Play JSON)", "Service configuration (Typesafe Config)"] },
              ].map(col => (
                <div key={col.lang} style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: col.color, marginBottom: 8 }}>{col.lang}</div>
                  {col.skills.map(s => (
                    <div key={s} style={{ fontSize: 10, color: "#64748b", marginBottom: 4, display: "flex", gap: 4 }}>
                      <span style={{ color: col.color, flexShrink: 0 }}>›</span>{s}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>
    </div>
  );
}

export default BuildSystemDemo;
