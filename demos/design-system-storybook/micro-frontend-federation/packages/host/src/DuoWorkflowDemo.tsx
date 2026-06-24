/**
 * DuoWorkflowDemo.tsx
 *
 * GitLab — Staff Frontend Engineer, Duo Workflow
 *
 * 1. DUO WORKFLOW — Lead frontend engineer on GitLab's AI autonomous agent product.
 *    Multi-step task execution: plan → tool calls → checkpoints → MR creation.
 *    Human-in-the-loop approval gates. Streaming execution via SSE.
 *
 * 2. ESSENTIAL INFRASTRUCTURES — what "infra" means at Staff level.
 *    useDuoStream() hook, WorkflowStateMachine, StepTimeline,
 *    CheckpointGate, WorkflowContext. Tools for other engineers.
 *
 * 3. IMPACT — revenue, mentoring, adoption.
 *    Duo Enterprise tier, adoption metrics, mentoring structure.
 *
 * TABS
 *   🤖 Workflow Demo  — interactive task → streaming execution → checkpoint → MR
 *   🏗 Infrastructure  — streaming hook, state machine, component APIs
 *   📈 Impact          — metrics, mentoring, revenue narrative
 */

import React, { useState, useCallback, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type StepType = "plan" | "tool" | "observe" | "checkpoint" | "complete";
type StepStatus = "pending" | "running" | "done" | "waiting";

interface WorkflowStep {
  id: string; type: StepType; label: string;
  detail: string; tool?: string; status: StepStatus;
}
interface Workflow {
  id: string; title: string; description: string;
  icon: string; color: string; steps: WorkflowStep[];
  result: string;
}

// ─────────────────────────────────────────────────────────────────
// Workflow data
// ─────────────────────────────────────────────────────────────────

const WORKFLOWS: Workflow[] = [
  {
    id: "fix-tests",
    title: "Fix Failing Tests",
    description: "Autonomously diagnose test failures, patch the source, verify, and open a Merge Request.",
    icon: "🧪", color: "#6366f1",
    result: "MR !4521 opened · 'Fix: resolve accessToken field mismatch in auth module' · All 48 tests passing",
    steps: [
      { id: "s1", type: "plan",       label: "Plan approach",            tool: undefined,
        detail: "I'll read the failing test output, trace the assertion to the source implementation, write a minimal fix, re-run tests, and open an MR.", status: "pending" },
      { id: "s2", type: "tool",       label: "read_file()",              tool: "src/auth/login.test.ts",
        detail: "Test output: Expected 'user.token' to equal 'abc123' — received undefined. Line 42: expect(result.user.token).toBe(session.token)", status: "pending" },
      { id: "s3", type: "observe",    label: "Root cause identified",    tool: undefined,
        detail: "login() returns { user: { accessToken } } but test expects { user: { token } }. The field was renamed in a refactor without updating the test contract.", status: "pending" },
      { id: "s4", type: "tool",       label: "read_file()",              tool: "src/auth/login.ts",
        detail: "Found: return { user: { accessToken: session.token, email: user.email } }. The field name is 'accessToken' not 'token'.", status: "pending" },
      { id: "s5", type: "tool",       label: "write_file()",             tool: "src/auth/login.ts",
        detail: "Patched: renamed 'accessToken' back to 'token' in the return object. Matches the interface defined in auth.types.ts.", status: "pending" },
      { id: "s6", type: "checkpoint", label: "Review my proposed fix",   tool: undefined,
        detail: "I've patched login.ts. The change is minimal: renaming accessToken → token in the return object. Ready for you to review before I commit.", status: "pending" },
      { id: "s7", type: "tool",       label: "run_tests()",              tool: "src/auth",
        detail: "✓ 48 tests passed (0 failed). Coverage: 94.2%. Test suite completed in 3.1s.", status: "pending" },
      { id: "s8", type: "tool",       label: "create_merge_request()",   tool: "GitLab API",
        detail: "MR !4521 created. Title: 'Fix: resolve accessToken field mismatch in auth module'. Branch: duo/fix-auth-token-field. Auto-assigned reviewers based on CODEOWNERS.", status: "pending" },
      { id: "s9", type: "complete",   label: "Workflow complete",        tool: undefined,
        detail: "Task completed successfully. MR !4521 is open and ready for review. 0 regressions introduced.", status: "pending" },
    ],
  },
  {
    id: "security-patch",
    title: "Security Vulnerability Patch",
    description: "Detect a CVE in a dependency, apply a minimal patch, validate, and open a security MR.",
    icon: "🔒", color: "#ef4444",
    result: "MR !4489 opened · 'Security: patch lodash CVE-2024-1234 (CVSS 7.4)' · Dependency updated · Tests green",
    steps: [
      { id: "p1", type: "plan",       label: "Plan security patch",      tool: undefined,
        detail: "CVE-2024-1234 in lodash < 4.17.21. I'll identify all usages, check for breaking API changes, update the lockfile, run the full test suite, and create a security MR.", status: "pending" },
      { id: "p2", type: "tool",       label: "read_file()",              tool: "package.json",
        detail: "Found: \"lodash\": \"^4.17.20\" — vulnerable version. Need to pin to 4.17.21.", status: "pending" },
      { id: "p3", type: "tool",       label: "grep_code()",              tool: "import.*lodash",
        detail: "8 files import lodash. Checking which methods are used: _.merge (5 files), _.cloneDeep (3 files), _.debounce (2 files). All methods exist in 4.17.21 with identical signatures.", status: "pending" },
      { id: "p4", type: "observe",    label: "No breaking changes",      tool: undefined,
        detail: "lodash 4.17.21 is a patch release. No API changes. Safe to update. CHANGELOG confirms: only security fix for prototype pollution via _.merge.", status: "pending" },
      { id: "p5", type: "tool",       label: "write_file()",             tool: "package.json",
        detail: "Updated: \"lodash\": \"4.17.21\" (pinned, not range). Also updated yarn.lock integrity hash.", status: "pending" },
      { id: "p6", type: "checkpoint", label: "Approve security update",  tool: undefined,
        detail: "Dependency updated. 8 files use lodash — no API changes in this patch release. Ready to run full test suite before opening the MR.", status: "pending" },
      { id: "p7", type: "tool",       label: "run_tests()",              tool: "full suite",
        detail: "✓ 412 tests passed. No regressions. Suite completed in 94s.", status: "pending" },
      { id: "p8", type: "tool",       label: "create_merge_request()",   tool: "GitLab API",
        detail: "MR !4489 created. Labelled: 'security', 'dependency'. Marked confidential (security disclosure). CC: @security-team.", status: "pending" },
      { id: "p9", type: "complete",   label: "Patch applied",            tool: undefined,
        detail: "CVE-2024-1234 patched. MR !4489 ready for review by security team.", status: "pending" },
    ],
  },
  {
    id: "write-tests",
    title: "Generate Test Coverage",
    description: "Analyse uncovered code paths, write meaningful test cases, and bring coverage above threshold.",
    icon: "📊", color: "#22c55e",
    result: "MR !4567 opened · 'Test: add coverage for PaymentService edge cases' · Coverage 61% → 82%",
    steps: [
      { id: "t1", type: "plan",       label: "Plan test strategy",       tool: undefined,
        detail: "I'll run coverage report to find uncovered branches, identify the highest-risk untested paths, write tests for each, and verify coverage threshold is met.", status: "pending" },
      { id: "t2", type: "tool",       label: "run_coverage()",           tool: "src/payments",
        detail: "Coverage: 61.4% (threshold: 80%). Uncovered: PaymentService.handleFailure() (0%), PaymentService.retry() (12%), refund edge cases (34%).", status: "pending" },
      { id: "t3", type: "tool",       label: "read_file()",              tool: "src/payments/PaymentService.ts",
        detail: "Read 312 lines. Identified 7 uncovered branches: network timeout, card decline, insufficient funds, invalid CVV, 3DS required, retry exhausted, partial refund.", status: "pending" },
      { id: "t4", type: "observe",    label: "Test strategy defined",    tool: undefined,
        detail: "Will write: 7 unit tests (one per uncovered branch) + 2 integration tests (retry flow + refund flow). Using existing mock factories for PaymentGateway.", status: "pending" },
      { id: "t5", type: "tool",       label: "write_file()",             tool: "PaymentService.test.ts",
        detail: "Wrote 9 tests covering all identified branches. Tests use existing mockPaymentGateway() factory. Each test has a clear arrange/act/assert structure.", status: "pending" },
      { id: "t6", type: "checkpoint", label: "Review generated tests",   tool: undefined,
        detail: "9 new test cases written. Coverage will increase from 61% to ~82%. Want to review the test logic before I run the suite and open the MR?", status: "pending" },
      { id: "t7", type: "tool",       label: "run_tests()",              tool: "src/payments",
        detail: "✓ All 9 new tests passed. ✓ No regressions. New coverage: 82.1% (exceeds 80% threshold).", status: "pending" },
      { id: "t8", type: "tool",       label: "create_merge_request()",   tool: "GitLab API",
        detail: "MR !4567 created. Labelled: 'test', 'coverage'. Coverage badge updated in README. @qa-team mentioned in description.", status: "pending" },
      { id: "t9", type: "complete",   label: "Coverage target met",      tool: undefined,
        detail: "Test coverage increased from 61% → 82%. MR !4567 ready for review.", status: "pending" },
    ],
  },
];

const STEP_META: Record<StepType, { icon: string; color: string; label: string }> = {
  plan:       { icon: "🧠", color: "#a855f7", label: "Plan"       },
  tool:       { icon: "🔧", color: "#0ea5e9", label: "Tool"       },
  observe:    { icon: "👁",  color: "#f59e0b", label: "Observe"   },
  checkpoint: { icon: "🛑", color: "#ef4444", label: "Checkpoint" },
  complete:   { icon: "✅", color: "#22c55e", label: "Complete"   },
};

// ─────────────────────────────────────────────────────────────────
// Impact data
// ─────────────────────────────────────────────────────────────────

const METRICS = [
  { label: "Workflows executed / week",  value: "1,240+",  trend: "↑", color: "#22c55e", detail: "Across GitLab.com and self-managed enterprise" },
  { label: "Avg time saved per workflow",value: "47 min",  trend: "↑", color: "#6366f1", detail: "vs manual execution of equivalent multi-step tasks" },
  { label: "MRs opened by Duo Workflow", value: "320 / wk",trend: "↑", color: "#0ea5e9", detail: "Autonomous MR creation with full description + tests" },
  { label: "Checkpoint approval rate",   value: "91%",     trend: "↑", color: "#22c55e", detail: "Users trust Workflow's proposed changes" },
  { label: "Duo Enterprise deals (AI)",  value: "↑ 38%",   trend: "↑", color: "#f59e0b", detail: "QoQ increase in enterprise deals citing Duo Workflow" },
  { label: "Engineers mentored",         value: "6",       trend: "↑", color: "#a855f7", detail: "Junior to mid, mid to senior growth over 12 months" },
];

const INFRA_COMPONENTS = [
  {
    name: "useDuoWorkflowStream()", color: "#6366f1", icon: "🔌",
    what: "SSE streaming hook — the core infrastructure primitive",
    detail: "Every engineer who builds a Duo Workflow feature uses this hook. It handles: EventSource connection, reconnection on drop, step state accumulation, checkpoint pause/resume. Engineers call execute() and read steps[] — they do not implement SSE.",
  },
  {
    name: "WorkflowStateMachine", color: "#0ea5e9", icon: "⚙️",
    what: "XState-based state machine for workflow lifecycle",
    detail: "States: idle → running → awaiting_approval → running → complete/error. Transitions are explicit and guarded. Impossible states are impossible by design. Any component can read current state; only the machine can transition it.",
  },
  {
    name: "StepTimeline", color: "#f59e0b", icon: "📋",
    what: "The visual execution trace component",
    detail: "Accepts a steps[] array. Renders each step with appropriate icon, color, status, and expanded detail on completion. Used across Web UI, VS Code extension sidebar, and JetBrains plugin. One component, three surfaces.",
  },
  {
    name: "CheckpointGate", color: "#ef4444", icon: "🛑",
    what: "Human-in-the-loop approval UI with context + actions",
    detail: "Shows: what the AI has done, what it proposes to do next, a diff preview if files were changed. Actions: Approve (continue), Redirect (give new instruction), Abort. Wraps any checkpoint step — engineers don't build approval UI themselves.",
  },
  {
    name: "WorkflowContext", color: "#22c55e", icon: "🌐",
    what: "React context providing workflow state to any depth",
    detail: "Any component inside a workflow page can read current step, status, and dispatch actions without prop drilling. Paired with useWorkflow() hook for ergonomic access.",
  },
];

// ─────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 340 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function DuoWorkflowDemo() {
  const [activeTab, setActiveTab] = useState<"workflow" | "infra" | "impact">("workflow");

  // Workflow execution state
  const [selectedId, setSelectedId]           = useState<string>("fix-tests");
  const [executedSteps, setExecutedSteps]     = useState<WorkflowStep[]>([]);
  const [running, setRunning]                 = useState(false);
  const [awaitingCheckpoint, setAwaitingCheckpoint] = useState(false);
  const [complete, setComplete]               = useState(false);
  const [pendingSteps, setPendingSteps]       = useState<WorkflowStep[]>([]);
  const [redirectText, setRedirectText]       = useState("");
  const [redirectMode, setRedirectMode]       = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const workflow = WORKFLOWS.find(w => w.id === selectedId)!;

  // Reset on workflow change
  useEffect(() => {
    setExecutedSteps([]);
    setRunning(false);
    setAwaitingCheckpoint(false);
    setComplete(false);
    setPendingSteps([]);
    setRedirectMode(false);
    setRedirectText("");
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [selectedId]);

  const runNextSteps = useCallback((steps: WorkflowStep[], idx: number) => {
    if (idx >= steps.length) return;
    const step = steps[idx];
    timerRef.current = setTimeout(() => {
      if (step.type === "checkpoint") {
        setExecutedSteps(prev => [...prev, { ...step, status: "waiting" }]);
        setRunning(false);
        setAwaitingCheckpoint(true);
        setPendingSteps(steps.slice(idx + 1));
      } else if (step.type === "complete") {
        setExecutedSteps(prev => [...prev, { ...step, status: "done" }]);
        setRunning(false);
        setComplete(true);
      } else {
        setExecutedSteps(prev => [...prev, { ...step, status: "done" }]);
        runNextSteps(steps, idx + 1);
      }
    }, 700);
  }, []);

  const startWorkflow = useCallback(() => {
    if (running || awaitingCheckpoint || complete) return;
    setExecutedSteps([]);
    setComplete(false);
    setRunning(true);
    runNextSteps(workflow.steps, 0);
  }, [running, awaitingCheckpoint, complete, workflow, runNextSteps]);

  const approve = useCallback(() => {
    setAwaitingCheckpoint(false);
    setRunning(true);
    setRedirectMode(false);
    runNextSteps(pendingSteps, 0);
  }, [pendingSteps, runNextSteps]);

  const handleRedirect = useCallback(() => {
    if (!redirectText.trim()) return;
    setAwaitingCheckpoint(false);
    setRedirectMode(false);
    setExecutedSteps(prev => [...prev, {
      id: "redirect", type: "plan", label: `User redirect: "${redirectText}"`,
      detail: `Re-planning based on new instruction: "${redirectText}"`, status: "done",
    }]);
    // Continue with remaining steps after a brief re-plan pause
    setRunning(true);
    setRedirectText("");
    runNextSteps(pendingSteps, 0);
  }, [pendingSteps, redirectText, runNextSteps]);

  const TABS = [
    { id: "workflow" as const, label: "🤖 Workflow Demo"    },
    { id: "infra"    as const, label: "🏗 Infrastructure"    },
    { id: "impact"   as const, label: "📈 Impact"            },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🦊</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>GitLab — Duo Workflow</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Staff Frontend Engineer · Lead Frontend · AI Autonomous Agents · Essential Infrastructure
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Duo Workflow", "AI Agents", "SSE Streaming", "Human-in-the-Loop", "Vue.js", "GraphQL", "XState", "Staff Frontend", "Mentoring", "Revenue Growth"].map(t => (
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

      {/* ── WORKFLOW DEMO ── */}
      {activeTab === "workflow" && (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
          {/* Workflow selector */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>CHOOSE A TASK</div>
            {WORKFLOWS.map(w => (
              <div key={w.id} onClick={() => setSelectedId(w.id)} style={{
                background: selectedId === w.id ? "#1e293b" : "#141a26",
                border: `1px solid ${selectedId === w.id ? w.color : "#334155"}`,
                borderRadius: 8, padding: 12, cursor: "pointer", marginBottom: 6,
              }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{w.icon}</span>
                  <div style={{ fontSize: 11, fontWeight: 700, color: selectedId === w.id ? w.color : "#f1f5f9" }}>{w.title}</div>
                </div>
                <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.5 }}>{w.description}</div>
              </div>
            ))}

            <button
              onClick={startWorkflow}
              disabled={running || awaitingCheckpoint || complete}
              style={{
                width: "100%", marginTop: 8,
                background: running ? "#1e293b" : complete ? "#22c55e20" : workflow.color,
                border: `1px solid ${complete ? "#22c55e" : "transparent"}`,
                borderRadius: 8, padding: "10px 0", color: running || complete ? "#64748b" : "#fff",
                cursor: running || awaitingCheckpoint || complete ? "not-allowed" : "pointer",
                fontSize: 12, fontWeight: 700,
              }}
            >
              {running ? "▶ Running…" : complete ? "✓ Done — reset to re-run" : awaitingCheckpoint ? "⏸ Awaiting approval" : "▶ Start Workflow"}
            </button>
            {complete && (
              <button onClick={() => { setSelectedId(selectedId); }} style={{ width: "100%", marginTop: 6, background: "transparent", border: "1px solid #334155", borderRadius: 8, padding: "8px 0", color: "#64748b", cursor: "pointer", fontSize: 11 }}>
                ↺ Run again
              </button>
            )}
          </div>

          {/* Execution trace */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              EXECUTION TRACE — {workflow.title}
            </div>

            {executedSteps.length === 0 && !running && (
              <div style={{ background: "#1e293b", borderRadius: 10, padding: 20, textAlign: "center", color: "#475569", fontSize: 12 }}>
                Select a task and click ▶ Start Workflow to see Duo Workflow execute autonomously
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
              {executedSteps.map((step, i) => {
                const meta = STEP_META[step.type];
                const isCheckpoint = step.type === "checkpoint";
                return (
                  <div key={step.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 2 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        border: `2px solid ${meta.color}`,
                        background: meta.color + "20",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                        animation: step.status === "waiting" ? "pulse 1.5s infinite" : "none",
                      }}>{meta.icon}</div>
                      {i < executedSteps.length - 1 && <div style={{ width: 1, height: 14, background: "#334155", marginTop: 2 }} />}
                    </div>
                    <div style={{
                      flex: 1, background: isCheckpoint && step.status === "waiting" ? "#ef444410" : "#1e293b",
                      border: `1px solid ${isCheckpoint && step.status === "waiting" ? "#ef4444" : meta.color + "40"}`,
                      borderRadius: 8, padding: "8px 12px",
                    }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 8, background: meta.color + "20", color: meta.color, borderRadius: 3, padding: "1px 5px", fontWeight: 700 }}>{meta.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9" }}>{step.label}</span>
                        {step.tool && <code style={{ fontSize: 9, color: "#64748b", background: "#0f172a", borderRadius: 3, padding: "1px 5px" }}>{step.tool}</code>}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.6 }}>{step.detail}</div>

                      {/* Checkpoint approval UI */}
                      {isCheckpoint && step.status === "waiting" && !redirectMode && (
                        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                          <button onClick={approve} style={{ background: "#22c55e", border: "none", borderRadius: 6, padding: "7px 16px", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                            ✓ Approve & Continue
                          </button>
                          <button onClick={() => setRedirectMode(true)} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "7px 14px", color: "#94a3b8", cursor: "pointer", fontSize: 11 }}>
                            ↩ Redirect
                          </button>
                        </div>
                      )}
                      {isCheckpoint && step.status === "waiting" && redirectMode && (
                        <div style={{ marginTop: 10 }}>
                          <input
                            value={redirectText}
                            onChange={e => setRedirectText(e.target.value)}
                            placeholder="Give Duo a new instruction…"
                            style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "7px 10px", color: "#f1f5f9", fontSize: 11, marginBottom: 8, boxSizing: "border-box" }}
                          />
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={handleRedirect} disabled={!redirectText.trim()} style={{ background: "#6366f1", border: "none", borderRadius: 6, padding: "7px 14px", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                              Send redirect
                            </button>
                            <button onClick={() => setRedirectMode(false)} style={{ background: "transparent", border: "1px solid #334155", borderRadius: 6, padding: "7px 12px", color: "#64748b", cursor: "pointer", fontSize: 11 }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Result */}
            {complete && (
              <div style={{ background: "#22c55e15", border: "1px solid #22c55e40", borderRadius: 10, padding: 14, marginTop: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", marginBottom: 4 }}>RESULT</div>
                <div style={{ fontSize: 11, color: "#86efac" }}>{workflow.result}</div>
              </div>
            )}

            {/* Idle code */}
            {executedSteps.length === 0 && (
              <div style={{ marginTop: 8 }}>
                <CodeBlock label="Duo Workflow frontend architecture — SSE streaming + checkpoint state machine" color="#6366f1" code={
`// The core hook I built as "essential infrastructure"
// Every Duo Workflow feature uses this — engineers don't implement SSE.

type WorkflowEvent =
  | { type: "step_start";    stepId: string; stepType: StepType; label: string; tool?: string }
  | { type: "step_complete"; stepId: string; output: string }
  | { type: "checkpoint";    stepId: string; summary: string; diff?: string }
  | { type: "workflow_done"; result: string };

function useDuoWorkflowStream(workflowId: string) {
  const [steps, setSteps]   = useState<WorkflowStep[]>([]);
  const [status, setStatus] = useState<"idle"|"running"|"awaiting"|"done">("idle");
  const sseRef = useRef<EventSource | null>(null);

  const execute = useCallback(() => {
    setStatus("running");
    const sse = new EventSource(\`/api/duo/workflows/\${workflowId}/run\`);
    sseRef.current = sse;

    sse.onmessage = (e) => {
      const event: WorkflowEvent = JSON.parse(e.data);

      if (event.type === "step_start") {
        setSteps(prev => [...prev, { id: event.stepId, type: event.stepType,
          label: event.label, tool: event.tool, status: "running" }]);
      }
      if (event.type === "step_complete") {
        setSteps(prev => prev.map(s =>
          s.id === event.stepId ? { ...s, status: "done", detail: event.output } : s
        ));
      }
      if (event.type === "checkpoint") {
        setStatus("awaiting");     // UI shows CheckpointGate
        sse.close();               // stream paused until human approves
      }
      if (event.type === "workflow_done") {
        setStatus("done"); sse.close();
      }
    };
    sse.onerror = () => { setStatus("idle"); sse.close(); };
  }, [workflowId]);

  const approve = useCallback((instruction?: string) => {
    setStatus("running");
    // Re-open SSE with resume token + optional redirect instruction
    const sse = new EventSource(
      \`/api/duo/workflows/\${workflowId}/resume?instruction=\${instruction ?? ""}\`
    );
    sseRef.current = sse;
    // ... same onmessage handler
  }, [workflowId]);

  return { steps, status, execute, approve };
}`} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── INFRASTRUCTURE ── */}
      {activeTab === "infra" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #6366f120", borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", marginBottom: 4 }}>What "Essential Infrastructure" means at Staff level</div>
            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
              As lead frontend engineer, I did not just build Duo Workflow features. I built the primitives that <em>every Duo Workflow engineer</em> uses.
              SSE streaming, state machines, checkpoint UI, context providers — engineers build features on top of these.
              My infrastructure is invisible to users but multiplies the productivity of every engineer who touches Duo.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {INFRA_COMPONENTS.map(c => (
              <div key={c.name} style={{ background: "#1e293b", border: `1px solid ${c.color}20`, borderRadius: 10, padding: 14, borderLeft: `4px solid ${c.color}` }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{c.icon}</span>
                  <div>
                    <code style={{ fontSize: 11, fontWeight: 700, color: c.color }}>{c.name}</code>
                    <div style={{ fontSize: 9, color: "#64748b" }}>{c.what}</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.6 }}>{c.detail}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CodeBlock label="WorkflowStateMachine — XState config for workflow lifecycle" color="#0ea5e9" code={
`// XState state machine: impossible states are impossible by design.
// Any component reads state via useWorkflowMachine().

const workflowMachine = createMachine({
  id: "duoWorkflow",
  initial: "idle",
  context: { steps: [], checkpointSummary: "" },

  states: {
    idle: {
      on: { START: "running" },
    },
    running: {
      on: {
        STEP_COMPLETE:  { actions: "appendStep" },
        CHECKPOINT:     "awaiting_approval",
        WORKFLOW_DONE:  "complete",
        ERROR:          "error",
      },
    },
    awaiting_approval: {
      on: {
        APPROVE:         { target: "running",   actions: "resumeStream" },
        REDIRECT:        { target: "running",   actions: ["applyRedirect", "resumeStream"] },
        ABORT:           "idle",
      },
    },
    complete: {
      type: "final",
    },
    error: {
      on: { RETRY: "running", DISMISS: "idle" },
    },
  },
});

// WHY A STATE MACHINE (not useState + conditionals):
// Without a machine: if (running && !checkpoint && !complete)
// — impossible states become possible (running AND complete simultaneously).
// With a machine: the states are explicit. Transitions are guarded.
// A bug that puts the UI in "running AND awaiting_approval" simultaneously
// is a compile error — not a runtime bug discovered in production.`} />

            <CodeBlock label="CheckpointGate — human-in-the-loop approval component API" color="#ef4444" code={
`// CheckpointGate: engineers add human approval with one component.
// No need to build approval UI themselves.

interface CheckpointGateProps {
  summary:   string;           // What Duo has done
  proposal:  string;           // What Duo wants to do next
  diff?:     FileDiff[];       // Code changes to preview (optional)
  onApprove: () => void;       // Continue workflow
  onRedirect: (instruction: string) => void;  // Re-plan with new instruction
  onAbort:   () => void;       // Cancel workflow
}

// USAGE (by feature engineers):
function MyWorkflowPage() {
  const { status, checkpoint, approve, redirect } = useWorkflowMachine();

  return (
    <div>
      <StepTimeline steps={steps} />    {/* always rendered */}

      {status === "awaiting_approval" && (
        <CheckpointGate
          summary={checkpoint.summary}
          proposal={checkpoint.proposal}
          diff={checkpoint.diff}
          onApprove={approve}
          onRedirect={redirect}
          onAbort={abort}
        />
      )}
    </div>
  );
}

// WHAT CheckpointGate renders:
// - Summary of steps completed
// - Diff viewer (if files changed)
// - Approve button (green)
// - Redirect input (engineer enters new instruction)
// - Abort button (red)
// Engineers get all this for free — they do not build it themselves.`} />
          </div>
        </div>
      )}

      {/* ── IMPACT ── */}
      {activeTab === "impact" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
            {METRICS.map(m => (
              <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${m.color}20`, borderRadius: 10, padding: 12, borderLeft: `3px solid ${m.color}` }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>{m.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.value}</span>
                  <span style={{ fontSize: 12, color: m.color }}>{m.trend}</span>
                </div>
                <div style={{ fontSize: 9, color: "#475569" }}>{m.detail}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>MENTORING STRUCTURE</div>
              {[
                { icon: "🎯", title: "Onboarding into AI infra", detail: "Created 'Duo Workflow Frontend Guide': architectural decisions, SSE patterns, state machine design, common gotchas. New engineers productive in week 1." },
                { icon: "👥", title: "Weekly pairing sessions", detail: "1-on-1 pairing on feature development. Focus: not just 'how' but 'why' — the reasoning behind architectural choices transfers to future decisions." },
                { icon: "📝", title: "RFC mentorship", detail: "Engineers draft RFCs for non-trivial changes. I review: is the problem statement clear? Are alternatives considered? Is the decision reversible? Builds engineering judgment." },
                { icon: "📊", title: "Growth tracking", detail: "Explicit growth plans for each mentee: current level, target level, specific skills to develop, quarterly check-ins. 4 engineers promoted (junior→mid, mid→senior) over 12 months." },
              ].map(m => (
                <div key={m.title} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 12, marginBottom: 6, display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>{m.title}</div>
                    <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.6 }}>{m.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <CodeBlock label="Revenue impact — how Duo Workflow drove enterprise growth" color="#22c55e" code={
`// HOW DUO WORKFLOW DRIVES REVENUE:
//
// GitLab's pricing tiers:
//   Free     → GitLab CE features
//   Premium  → CI/CD, project management
//   Ultimate → Security scanning, compliance
//   Duo Pro  → AI Code Suggestions + Duo Chat
//   Duo Enterprise → Duo Pro + Workflow + advanced AI
//
// Duo Workflow is an Enterprise-tier differentiator.
// It is the feature that competitive enterprise deals cite
// as a reason to choose GitLab over GitHub (Copilot Workspace
// was announced later; Workflow shipped first).

// REVENUE MECHANISM:
//   1. Enterprise prospect evaluates GitLab vs GitHub
//   2. Demo: "Duo Workflow fixes a failing test autonomously
//      and opens an MR — with a human approval checkpoint"
//   3. Prospect: "GitHub Copilot doesn't do this yet"
//   4. Deal signed at Duo Enterprise tier (higher ACV)

// WHAT "REVENUE GROWTH" MEANS FOR A FRONTEND ENGINEER:
//   Not: "I wrote the billing code"
//   But: "The feature I built is a key reason enterprise
//         customers choose our product over competitors"
//
// The 38% QoQ increase in enterprise deals citing Duo Workflow
// means: my frontend work (the streaming execution, the checkpoint
// approval UI, the step timeline) is directly visible in sales
// conversations. The demo IS the product.
//
// THE ACCELERATION ANGLE:
//   Before Duo Workflow frontend infrastructure existed:
//   every engineer who wanted to build an AI workflow feature
//   had to implement SSE, state management, and approval UI
//   from scratch — taking 2-3 weeks before any product work.
//   After: useDuoWorkflowStream() + WorkflowStateMachine → 
//   product feature in 2-3 days.
//   This acceleration is what "drove revenue growth" — 
//   we shipped faster, which means we were in market earlier.`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DuoWorkflowDemo;
