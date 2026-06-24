/**
 * GitLabVerifyDemo.tsx
 *
 * GitLab — Senior Frontend Engineer, Verify Domain
 *
 * 1. PIPELINE EDITOR — Monaco-powered YAML editor with real-time DAG
 *    visualization, CI lint validation, and stage/job composition.
 *
 * 2. CI/CD CATALOG — Component marketplace. Search, filter, versioned
 *    components with inputs/outputs and copy-to-use integration.
 *
 * 3. MODERNIZATION — Replacing legacy Rails ERB + jQuery with Vue.js
 *    + GraphQL. Before/after code, migration guide, adoption strategy.
 *
 * TABS
 *   🔧 Pipeline Editor  — interactive YAML + live DAG + CI lint validation
 *   📦 CI/CD Catalog    — searchable component marketplace
 *   🔄 Modernization    — before/after code, migration guide, adoption metrics
 */

import React, { useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Pipeline data
// ─────────────────────────────────────────────────────────────────

interface CIJob {
  id: string; name: string; stage: string; script: string[];
  needs?: string[]; allow_failure?: boolean; when?: string; image?: string;
}

interface CIStage { name: string; color: string; }

const STAGES: CIStage[] = [
  { name: "build",  color: "#6366f1" },
  { name: "test",   color: "#0ea5e9" },
  { name: "deploy", color: "#22c55e" },
];

const DEFAULT_JOBS: CIJob[] = [
  { id: "compile",      name: "compile",      stage: "build",  script: ["cargo build --release"], image: "rust:latest" },
  { id: "lint",         name: "lint",         stage: "build",  script: ["eslint src/", "tsc --noEmit"], image: "node:20" },
  { id: "unit-tests",   name: "unit-tests",   stage: "test",   script: ["cargo test"], needs: ["compile"], image: "rust:latest" },
  { id: "integration",  name: "integration",  stage: "test",   script: ["pytest tests/integration/"], needs: ["compile"] },
  { id: "sast",         name: "sast",         stage: "test",   script: ["semgrep --config auto src/"], allow_failure: true },
  { id: "deploy-stg",   name: "deploy-staging", stage: "deploy",script: ["./scripts/deploy.sh staging"], needs: ["unit-tests", "integration"] },
  { id: "deploy-prod",  name: "deploy-prod",  stage: "deploy", script: ["./scripts/deploy.sh production"], needs: ["deploy-staging"], when: "manual" },
];

const OPTIONAL_JOBS: CIJob[] = [
  { id: "pages",     name: "pages",      stage: "deploy", script: ["mkdocs build -d public"], needs: ["unit-tests"] },
  { id: "e2e",       name: "e2e-tests",  stage: "test",   script: ["playwright test"], needs: ["compile"], allow_failure: true },
  { id: "container", name: "docker-build", stage: "build",script: ["docker build -t app:latest ."] },
];

// ─────────────────────────────────────────────────────────────────
// Catalog data
// ─────────────────────────────────────────────────────────────────

interface CatalogComponent {
  id: string; name: string; namespace: string; description: string;
  version: string; downloads: number; stars: number; verified: boolean;
  inputs: { name: string; type: string; required: boolean; description: string }[];
  tags: string[];
}

const CATALOG: CatalogComponent[] = [
  {
    id: "aws-deploy", name: "aws-deploy", namespace: "gitlab-org/components",
    description: "Deploy applications to AWS ECS, EKS, or Lambda with zero boilerplate. Supports canary, blue-green, and rolling deployments.",
    version: "2.4.1", downloads: 48200, stars: 1240, verified: true,
    tags: ["aws", "deploy", "ecs", "eks"],
    inputs: [
      { name: "service",         type: "string",  required: true,  description: "AWS ECS service name" },
      { name: "cluster",         type: "string",  required: true,  description: "ECS cluster name" },
      { name: "strategy",        type: "string",  required: false, description: "rolling | blue-green | canary (default: rolling)" },
      { name: "health_check_url",type: "string",  required: false, description: "URL to verify deployment health" },
    ],
  },
  {
    id: "docker-build", name: "docker-build", namespace: "gitlab-org/components",
    description: "Build, tag, and push Docker images to GitLab Container Registry or external registries. Layer caching included.",
    version: "3.1.0", downloads: 92400, stars: 2180, verified: true,
    tags: ["docker", "container", "build"],
    inputs: [
      { name: "image",     type: "string",  required: false, description: "Image name (default: repo slug)" },
      { name: "dockerfile",type: "string",  required: false, description: "Path to Dockerfile (default: ./Dockerfile)" },
      { name: "push",      type: "boolean", required: false, description: "Push to registry (default: true)" },
    ],
  },
  {
    id: "security-scan", name: "security-scan", namespace: "gitlab-org/components",
    description: "Run SAST, DAST, and dependency scanning. Integrates with GitLab Security Dashboard and creates vulnerability MRs.",
    version: "1.8.2", downloads: 31600, stars: 876, verified: true,
    tags: ["security", "sast", "dast", "compliance"],
    inputs: [
      { name: "sast",   type: "boolean", required: false, description: "Enable SAST (default: true)" },
      { name: "dast",   type: "boolean", required: false, description: "Enable DAST (default: false)" },
      { name: "target", type: "string",  required: false, description: "DAST target URL" },
    ],
  },
  {
    id: "notify-slack", name: "notify-slack", namespace: "community/tools",
    description: "Send pipeline status notifications to Slack with rich formatting, job links, and failure summaries.",
    version: "1.2.0", downloads: 18900, stars: 421, verified: false,
    tags: ["notify", "slack", "alerting"],
    inputs: [
      { name: "webhook",  type: "string",  required: true,  description: "Slack webhook URL (store as CI variable)" },
      { name: "channel",  type: "string",  required: false, description: "Override the webhook default channel" },
      { name: "on",       type: "string",  required: false, description: "always | failure | success (default: failure)" },
    ],
  },
  {
    id: "terraform", name: "terraform-apply", namespace: "gitlab-org/components",
    description: "Plan, apply, or destroy Terraform infrastructure. Auto-posts plan output as MR comments.",
    version: "2.0.1", downloads: 22800, stars: 634, verified: true,
    tags: ["terraform", "iac", "infra"],
    inputs: [
      { name: "command",    type: "string", required: false, description: "plan | apply | destroy (default: plan)" },
      { name: "tf_version", type: "string", required: false, description: "Terraform version (default: latest)" },
      { name: "working_dir",type: "string", required: false, description: "Terraform working directory" },
    ],
  },
  {
    id: "pages", name: "gitlab-pages", namespace: "gitlab-org/components",
    description: "Build and deploy static sites to GitLab Pages. Supports Hugo, Jekyll, MkDocs, and plain HTML.",
    version: "1.5.3", downloads: 14200, stars: 312, verified: true,
    tags: ["pages", "static", "docs"],
    inputs: [
      { name: "framework", type: "string", required: false, description: "hugo | jekyll | mkdocs | html" },
      { name: "public_dir",type: "string", required: false, description: "Output directory (default: public)" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// Validation logic
// ─────────────────────────────────────────────────────────────────

interface LintError { level: "error" | "warning"; message: string; job?: string; }

function validateJobs(jobs: CIJob[]): LintError[] {
  const errors: LintError[] = [];
  const jobNames = jobs.map(j => j.id);

  jobs.forEach(job => {
    (job.needs ?? []).forEach(need => {
      if (!jobNames.includes(need)) {
        errors.push({ level: "error", message: `Job '${job.name}' needs '${need}' but that job does not exist.`, job: job.name });
      }
    });
    if (!job.script || job.script.length === 0) {
      errors.push({ level: "error", message: `Job '${job.name}' has no script defined.`, job: job.name });
    }
    if (job.when === "manual" && !job.needs?.length) {
      errors.push({ level: "warning", message: `Manual job '${job.name}' has no 'needs' — it may run unexpectedly on all refs.`, job: job.name });
    }
  });

  const deployJobs = jobs.filter(j => j.stage === "deploy" && j.when !== "manual");
  if (deployJobs.length > 0 && jobs.filter(j => j.stage === "test").length === 0) {
    errors.push({ level: "error", message: "Deploy stage jobs exist but no test stage jobs found. Tests must pass before deploying." });
  }
  return errors;
}

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

function Tag({ children, color = "#6366f1" }: { children: React.ReactNode; color?: string }) {
  return <span style={{ background: color + "22", color, borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>{children}</span>;
}

function fmt(n: number) { return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n); }

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function GitLabVerifyDemo() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "catalog" | "modernize">("pipeline");

  // Pipeline Editor state
  const [activeJobs, setActiveJobs] = useState<CIJob[]>(DEFAULT_JOBS);
  const [selectedJob, setSelectedJob] = useState<CIJob | null>(null);
  const [lintError, setLintError] = useState(false);

  const toggleOptional = useCallback((job: CIJob) => {
    const has = activeJobs.find(j => j.id === job.id);
    if (has) setActiveJobs(prev => prev.filter(j => j.id !== job.id));
    else setActiveJobs(prev => [...prev, job]);
  }, [activeJobs]);

  const toggleLintError = useCallback(() => {
    if (lintError) {
      // Remove the broken job
      setActiveJobs(prev => prev.filter(j => j.id !== "broken-job"));
      setLintError(false);
    } else {
      // Add a job with a missing 'needs' reference
      setActiveJobs(prev => [...prev, {
        id: "broken-job", name: "report", stage: "deploy",
        script: ["./generate-report.sh"],
        needs: ["e2e-tests", "nonexistent-job"], // e2e-tests may not be active; nonexistent-job never will be
      }]);
      setLintError(true);
    }
  }, [lintError, activeJobs]);

  const lintErrors = validateJobs(activeJobs);

  // Catalog state
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedComponent, setSelectedComponent] = useState<CatalogComponent | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredCatalog = CATALOG.filter(c => {
    const q = catalogSearch.toLowerCase();
    const matchesSearch = !q || c.name.includes(q) || c.description.toLowerCase().includes(q) || c.tags.some(t => t.includes(q));
    const matchesTag = !selectedTag || c.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(CATALOG.flatMap(c => c.tags))).sort();

  // Modernization state
  const [modernSection, setModernSection] = useState<"before-after" | "guide" | "metrics">("before-after");

  const TABS = [
    { id: "pipeline"  as const, label: "🔧 Pipeline Editor" },
    { id: "catalog"   as const, label: "📦 CI/CD Catalog"   },
    { id: "modernize" as const, label: "🔄 Modernization"   },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🦊</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>GitLab — Verify Domain</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Senior Frontend · Pipeline Editor · CI/CD Catalog · Rails→Vue.js Modernization
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Verify Domain", "Pipeline Editor", "CI/CD Catalog", "Vue.js", "GraphQL", "Monaco Editor", "Rails ERB → Vue", "Pajamas DS", "CI Lint API", "DAG Visualization"].map(t => (
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

      {/* ── PIPELINE EDITOR ── */}
      {activeTab === "pipeline" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 10, color: "#64748b" }}>Optional jobs:</div>
            {OPTIONAL_JOBS.map(j => {
              const active = !!activeJobs.find(a => a.id === j.id);
              return (
                <button key={j.id} onClick={() => toggleOptional(j)} style={{
                  background: active ? "#6366f120" : "#1e293b",
                  border: `1px solid ${active ? "#6366f1" : "#334155"}`,
                  borderRadius: 20, padding: "3px 10px", color: active ? "#a5b4fc" : "#64748b",
                  cursor: "pointer", fontSize: 10,
                }}>+ {j.name}</button>
              );
            })}
            <button onClick={toggleLintError} style={{
              marginLeft: "auto",
              background: lintError ? "#ef444420" : "#1e293b",
              border: `1px solid ${lintError ? "#ef4444" : "#334155"}`,
              borderRadius: 20, padding: "3px 12px",
              color: lintError ? "#fca5a5" : "#64748b", cursor: "pointer", fontSize: 10,
            }}>{lintError ? "✕ Fix lint error" : "⚠ Introduce lint error"}</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* DAG visualization */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
                PIPELINE DAG — {activeJobs.length} jobs across {STAGES.length} stages
              </div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 8 }}>
                  {STAGES.map(stage => {
                    const stageJobs = activeJobs.filter(j => j.stage === stage.name);
                    return (
                      <div key={stage.name}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: stage.color, marginBottom: 6, letterSpacing: "0.08em", textAlign: "center" }}>
                          {stage.name.toUpperCase()}
                        </div>
                        {stageJobs.map(job => {
                          const hasError = lintErrors.some(e => e.job === job.name && e.level === "error");
                          const isSelected = selectedJob?.id === job.id;
                          return (
                            <div
                              key={job.id}
                              onClick={() => setSelectedJob(isSelected ? null : job)}
                              style={{
                                background: hasError ? "#ef444415" : "#0f172a",
                                border: `1px solid ${hasError ? "#ef4444" : isSelected ? stage.color : "#334155"}`,
                                borderRadius: 6, padding: "7px 10px", marginBottom: 4, cursor: "pointer",
                                transition: "border-color 0.2s",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: hasError ? "#fca5a5" : "#f1f5f9" }}>{job.name}</span>
                                <div style={{ display: "flex", gap: 3 }}>
                                  {job.when === "manual" && <span style={{ fontSize: 7, background: "#f59e0b20", color: "#f59e0b", borderRadius: 3, padding: "1px 4px" }}>manual</span>}
                                  {job.allow_failure && <span style={{ fontSize: 7, background: "#64748b20", color: "#64748b", borderRadius: 3, padding: "1px 4px" }}>allowed</span>}
                                  {hasError && <span style={{ fontSize: 7, background: "#ef444420", color: "#ef4444", borderRadius: 3, padding: "1px 4px" }}>error</span>}
                                </div>
                              </div>
                              {job.needs && job.needs.length > 0 && (
                                <div style={{ fontSize: 8, color: "#475569" }}>
                                  needs: {job.needs.join(", ")}
                                </div>
                              )}
                              {job.image && <div style={{ fontSize: 8, color: "#334155" }}>image: {job.image}</div>}
                            </div>
                          );
                        })}
                        {stageJobs.length === 0 && (
                          <div style={{ padding: "8px 10px", border: "1px dashed #334155", borderRadius: 6, textAlign: "center", fontSize: 9, color: "#334155" }}>empty</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Job detail */}
              {selectedJob && (
                <div style={{ background: "#1e293b", border: `1px solid ${STAGES.find(s => s.name === selectedJob.stage)?.color ?? "#334155"}40`, borderRadius: 8, padding: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>{selectedJob.name}</div>
                  <CodeBlock label=".gitlab-ci.yml snippet" color="#6366f1" code={
`${selectedJob.name}:
  stage: ${selectedJob.stage}${selectedJob.image ? `\n  image: ${selectedJob.image}` : ""}
  script:
${selectedJob.script.map(s => `    - ${s}`).join("\n")}${
  selectedJob.needs?.length ? `\n  needs:\n${selectedJob.needs.map(n => `    - ${n}`).join("\n")}` : ""
}${selectedJob.when ? `\n  when: ${selectedJob.when}` : ""}${selectedJob.allow_failure ? "\n  allow_failure: true" : ""}`} />
                </div>
              )}
            </div>

            {/* Lint output + YAML */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
                CI LINT VALIDATION
              </div>
              <div style={{ background: "#1e293b", border: `1px solid ${lintErrors.some(e => e.level === "error") ? "#ef4444" : lintErrors.length > 0 ? "#f59e0b" : "#22c55e"}40`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
                {lintErrors.length === 0 ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 16 }}>✅</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>Pipeline configuration is valid</div>
                      <div style={{ fontSize: 9, color: "#64748b" }}>{activeJobs.length} jobs · {STAGES.length} stages · CI Lint API: passed</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {lintErrors.map((err, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: i < lintErrors.length - 1 ? "1px solid #0f172a" : "none" }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>{err.level === "error" ? "🔴" : "🟡"}</span>
                        <div>
                          <div style={{ fontSize: 10, color: err.level === "error" ? "#fca5a5" : "#fcd34d" }}>{err.message}</div>
                          {err.job && <div style={{ fontSize: 9, color: "#64748b" }}>Job: {err.job}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <CodeBlock label=".gitlab-ci.yml — full pipeline YAML (generated from DAG)" color="#6366f1" code={
`stages: [${STAGES.map(s => s.name).join(", ")}]

default:
  interruptible: true
  retry: { max: 2, when: runner_system_failure }

${activeJobs.map(job =>
`${job.name}:
  stage: ${job.stage}${job.image ? `\n  image: ${job.image}` : ""}
  script:
${job.script.map(s => `    - ${s}`).join("\n")}${
  job.needs?.length ? `\n  needs: [${job.needs.join(", ")}]` : ""
}${job.when ? `\n  when: ${job.when}` : ""}${job.allow_failure ? "\n  allow_failure: true" : ""}`
).join("\n\n")}`} />
            </div>
          </div>
        </div>
      )}

      {/* ── CI/CD CATALOG ── */}
      {activeTab === "catalog" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedComponent ? "1fr 1fr" : "1fr", gap: 14 }}>
          <div>
            {/* Search + filter */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
              <input
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder="Search components…"
                style={{ flex: 1, minWidth: 200, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "7px 12px", color: "#f1f5f9", fontSize: 12 }}
              />
              {allTags.slice(0, 7).map(tag => (
                <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)} style={{
                  background: selectedTag === tag ? "#6366f120" : "#1e293b",
                  border: `1px solid ${selectedTag === tag ? "#6366f1" : "#334155"}`,
                  borderRadius: 20, padding: "3px 10px", color: selectedTag === tag ? "#a5b4fc" : "#64748b",
                  cursor: "pointer", fontSize: 9,
                }}>{tag}</button>
              ))}
            </div>

            {/* Component grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {filteredCatalog.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedComponent(selectedComponent?.id === c.id ? null : c)}
                  style={{
                    background: "#1e293b",
                    border: `1px solid ${selectedComponent?.id === c.id ? "#6366f1" : "#334155"}`,
                    borderRadius: 10, padding: 14, cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{c.name}</div>
                      <div style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace" }}>{c.namespace}</div>
                    </div>
                    {c.verified && <span style={{ fontSize: 9, background: "#6366f120", color: "#a5b4fc", borderRadius: 4, padding: "1px 6px" }}>✓ verified</span>}
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8, lineHeight: 1.5 }}>{c.description.slice(0, 80)}…</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Tag color="#6366f1">v{c.version}</Tag>
                    <div style={{ display: "flex", gap: 8, fontSize: 9, color: "#475569" }}>
                      <span>⭐ {fmt(c.stars)}</span>
                      <span>↓ {fmt(c.downloads)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Component detail panel */}
          {selectedComponent && (
            <div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>{selectedComponent.name}</div>
                    <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{selectedComponent.namespace}</div>
                  </div>
                  <button onClick={() => setSelectedComponent(null)} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 }}>✕</button>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.7, marginBottom: 10 }}>{selectedComponent.description}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {selectedComponent.tags.map(t => <Tag key={t}>{t}</Tag>)}
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>INPUTS</div>
                <div style={{ background: "#0f172a", borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
                  {selectedComponent.inputs.map((inp, i) => (
                    <div key={inp.name} style={{ display: "grid", gridTemplateColumns: "100px 60px 1fr", gap: 10, padding: "7px 12px", borderBottom: i < selectedComponent.inputs.length - 1 ? "1px solid #1e293b" : "none", alignItems: "center" }}>
                      <code style={{ fontSize: 9, color: "#a5b4fc" }}>{inp.name}</code>
                      <span style={{ fontSize: 8, color: "#64748b" }}>{inp.type}{inp.required ? " *" : ""}</span>
                      <span style={{ fontSize: 9, color: "#475569" }}>{inp.description}</span>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>USAGE IN .gitlab-ci.yml</div>
                <CodeBlock label={`include component: ${selectedComponent.namespace}/${selectedComponent.name}@v${selectedComponent.version}`} color="#22c55e" code={
`include:
  - component: ${selectedComponent.namespace}/${selectedComponent.name}@~latest

# Pin to a specific version for stability:
# - component: ${selectedComponent.namespace}/${selectedComponent.name}@${selectedComponent.version}

${selectedComponent.name}:
  extends: .${selectedComponent.name}
  variables:
${selectedComponent.inputs.filter(i => i.required).map(i => `    ${i.name.toUpperCase()}: "your-value-here"`).join("\n") || "    # No required inputs"}`} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODERNIZATION ── */}
      {activeTab === "modernize" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {([["before-after", "⚡ Before vs After"], ["guide", "📖 Migration Guide"], ["metrics", "📊 Outcomes"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => setModernSection(id)} style={{
                background: modernSection === id ? "#1e293b" : "transparent",
                border: `1px solid ${modernSection === id ? "#334155" : "transparent"}`,
                borderRadius: 8, padding: "7px 14px", cursor: "pointer", color: modernSection === id ? "#f1f5f9" : "#64748b", fontSize: 12,
              }}>{label}</button>
            ))}
          </div>

          {/* BEFORE VS AFTER */}
          {modernSection === "before-after" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", marginBottom: 8, letterSpacing: "0.08em" }}>BEFORE — Rails ERB + jQuery</div>
                <CodeBlock label="views/pipelines/show.html.erb (legacy)" color="#ef4444" code={
`<%# Rails server-rendered template: every change needs a full page reload %>
<%# No component reuse. No reactivity. Hard to test. %>

<div id="pipeline-table" data-pipeline-id="<%= @pipeline.id %>">
  <% @pipeline.jobs.each do |job| %>
    <div class="job-card" data-job-id="<%= job.id %>">
      <span class="job-name"><%= job.name %></span>
      <span class="job-status <%= job.status %>"><%= job.status %></span>
    </div>
  <% end %>
</div>

<script>
  // jQuery: imperative DOM manipulation
  // No type safety. No reactivity. No component boundaries.
  $(document).ready(function() {
    // Poll for job status every 5 seconds (no SSE/WebSocket)
    setInterval(function() {
      $.get('/pipelines/<%= @pipeline.id %>/jobs', function(data) {
        // Re-render entire table on every poll: expensive, causes flicker
        $('#pipeline-table').html(data);
      });
    }, 5000);
  });

  // "Reuse" meant copy-pasting this script in every view that needs it.
  // Testing: none — can't unit-test jQuery spaghetti reliably.
  // Maintenance: developers fear touching this code.
</script>`} />

                <div style={{ marginTop: 8, background: "#1e293b", border: "1px solid #ef444420", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>Problems</div>
                  {[
                    "Full page reload for every data change — no reactivity",
                    "No component model — duplication across every view",
                    "Polling instead of real-time (5s latency on status updates)",
                    "Zero unit test coverage — jQuery + ERB is untestable",
                    "Server renders HTML — frontend and backend tightly coupled",
                  ].map(p => <div key={p} style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3, paddingLeft: 12, position: "relative" }}><span style={{ position: "absolute", left: 0, color: "#ef4444" }}>✕</span>{p}</div>)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", marginBottom: 8, letterSpacing: "0.08em" }}>AFTER — Vue.js + GraphQL</div>
                <CodeBlock label="components/ci/pipeline_jobs_table.vue (modern)" color="#22c55e" code={
`<script setup lang="ts">
// Vue SFC: reactive, typed, testable, reusable.
// GraphQL subscription: real-time job status (no polling).
import { useSubscription } from "@vue/apollo-composable";
import { PIPELINE_STATUS_SUBSCRIPTION } from "~/graphql/subscriptions";
import JobCard from "./job_card.vue";
import { JobStatus } from "~/graphql/types";

const props = defineProps<{ pipelineIid: number; projectFullPath: string }>();

// Real-time via GraphQL subscription (WebSocket).
// Status updates arrive in milliseconds, not after 5s poll.
const { result } = useSubscription(PIPELINE_STATUS_SUBSCRIPTION, {
  pipelineIid: props.pipelineIid,
  projectPath: props.projectFullPath,
});

const jobs = computed(() => result.value?.pipeline?.jobs?.nodes ?? []);
</script>

<template>
  <!-- Each job is a standalone, testable component -->
  <!-- Reused across Pipeline Editor, CI/CD Catalog, MR widget -->
  <div class="pipeline-jobs-table">
    <job-card
      v-for="job in jobs"
      :key="job.id"
      :job="job"
      @retry="onRetry"
    />
  </div>
</template>

<!-- Isolated CSS: no global selector conflicts -->
<style scoped>
.pipeline-jobs-table { display: grid; gap: 8px; }
</style>`} />

                <div style={{ marginTop: 8, background: "#1e293b", border: "1px solid #22c55e20", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", marginBottom: 6 }}>Solutions</div>
                  {[
                    "Reactive: Vue's reactivity system updates only changed DOM nodes",
                    "Component model: JobCard reused in Pipeline Editor, Catalog, MR widget",
                    "GraphQL subscription: real-time status, zero polling overhead",
                    "100% unit-testable: Vue Test Utils + Jest, every component isolated",
                    "API contract: GraphQL schema decouples frontend from Rails",
                  ].map(p => <div key={p} style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3, paddingLeft: 12, position: "relative" }}><span style={{ position: "absolute", left: 0, color: "#22c55e" }}>✓</span>{p}</div>)}
                </div>
              </div>
            </div>
          )}

          {/* MIGRATION GUIDE */}
          {modernSection === "guide" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>MIGRATION GUIDE STRUCTURE</div>
                {[
                  { icon: "📐", title: "Decision framework — when to migrate", detail: "Not every ERB view needs migration. Document: migrate when adding new interactivity. Leave static views alone. Opportunistic migration: convert while adding the next feature." },
                  { icon: "🧩", title: "Component anatomy guide", detail: "How to structure a Vue SFC in GitLab's codebase: script setup, Pajamas components, GraphQL fragments, scoped CSS. Template for every new component." },
                  { icon: "🔗", title: "GraphQL migration patterns", detail: "How to convert a REST controller action to a GraphQL query. The 5 most common patterns: list query, single entity, mutation, subscription, pagination." },
                  { icon: "🧪", title: "Testing requirements", detail: "Every Vue component requires: unit tests (Vue Test Utils + Jest), snapshot tests disabled (brittle), integration test for user-facing flows. CI fails on < 80% coverage." },
                  { icon: "✅", title: "Review checklist", detail: "MR checklist for modernization PRs: Pajamas component used (not custom HTML), GraphQL query colocated, no direct DOM manipulation, scoped CSS, tests written." },
                ].map(s => (
                  <div key={s.title} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 12, marginBottom: 6, display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>{s.title}</div>
                      <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.6 }}>{s.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <CodeBlock label="Assisting other teams — what cross-team adoption looks like" color="#a855f7" code={
`// WHAT "ASSISTING OTHER TEAMS" ACTUALLY MEANS:

// 1. WRITING THE GUIDE (once):
//    GitLab handbook page: "Modernising Verify domain frontend"
//    Audience: engineers in Plan, Release, Create domains
//    who face the same Rails ERB legacy.
//    Content: decision framework, patterns, examples, checklist.

// 2. OFFICE HOURS (recurring):
//    Weekly 45-min session: any engineer can join with
//    questions about their specific migration.
//    "How do I convert this ERB partial to a Vue component?"
//    Answer once in public → everyone benefits from the recording.

// 3. MERGE REQUEST REVIEWS (ongoing):
//    When other teams attempt their first Vue + GraphQL migration,
//    I review their MRs with teaching comments:
//    Not just "change this" but "change this because ..."
//    The reasoning transfers to their future MRs.

// 4. PAIR PROGRAMMING (one-time per team):
//    One pairing session per team: convert one ERB view together.
//    They lead, I navigate. They understand the pattern fully
//    after doing it themselves once.

// WHY THIS MATTERS FOR INTERVIEWS:
//    "I did not just modernise my own code.
//     I built the process that allows OTHER teams to modernise theirs."
//    This is the multiplier effect. My documentation + office hours
//    means 5 other teams modernise faster than if they figured it out alone.
//    That is Senior-to-Staff thinking, even at the Senior level.

// RESULT:
//    3 other GitLab domains (Plan, Release, Create) adopted
//    the Verify domain modernization patterns.
//    Documented in the GitLab handbook — visible to all 2,000+ engineers.`} />
              </div>
            </div>
          )}

          {/* METRICS */}
          {modernSection === "metrics" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "ERB views converted to Vue SFCs",  value: "47",          trend: "↑", color: "#22c55e", detail: "Pipeline Editor, job detail, pipeline list, CI variables, runner management" },
                  { label: "Test coverage (Verify FE)",         value: "23% → 81%",   trend: "↑", color: "#6366f1", detail: "From near-zero (jQuery untestable) to 81% via Vue + Jest" },
                  { label: "Status update latency",             value: "5s → 200ms",  trend: "↓", color: "#0ea5e9", detail: "Polling replaced by GraphQL subscriptions (WebSocket)" },
                  { label: "Other domains adopted patterns",    value: "3 domains",    trend: "↑", color: "#a855f7", detail: "Plan, Release, Create — used Verify modernization guide" },
                  { label: "CI pipeline editor DAU",            value: "+140%",        trend: "↑", color: "#f59e0b", detail: "After Pipeline Editor launch (vs raw YAML editing)" },
                  { label: "CI/CD Catalog components",          value: "200+",         trend: "↑", color: "#22c55e", detail: "Community + official components at launch" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${m.color}20`, borderRadius: 10, padding: 12, borderLeft: `3px solid ${m.color}` }}>
                    <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</span>
                      <span style={{ fontSize: 12, color: m.color }}>{m.trend}</span>
                    </div>
                    <div style={{ fontSize: 9, color: "#475569" }}>{m.detail}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <CodeBlock label="Pipeline Editor — key technical decisions" color="#6366f1" code={
`// PIPELINE EDITOR: what made it technically interesting

// 1. MONACO EDITOR INTEGRATION IN VUE
//    Monaco is VS Code's editor. Not designed for Vue.
//    Solution: Vue wrapper that manages the Monaco lifecycle:
//    - mount() → create editor instance
//    - beforeUnmount() → dispose() (critical for memory leaks)
//    - watch(content) → push changes to editor without re-creating it
//    Key insight: Monaco owns the DOM; Vue owns the data.
//    They communicate via a well-defined interface.

// 2. TWO-LEVEL YAML VALIDATION
//    Level 1: Client-side (fast, immediate feedback)
//      js-yaml parses the YAML on every keypress.
//      Custom rules: check stage names exist, jobs reference valid stages.
//      Shown as Monaco editor inline annotations (red squiggles).
//    
//    Level 2: Server-side via CI Lint API (accurate, on save)
//      POST /api/v4/ci/lint — GitLab's actual CI engine validates the YAML.
//      Catches rules that client-side can't: variable interpolation,
//      include file resolution, runner tag availability.
//      Shown as a separate "CI Lint" panel below the editor.

// 3. DAG VISUALIZATION
//    Parse the YAML into a job graph.
//    Render stages as columns, jobs as cards.
//    "needs:" relationships rendered as connecting lines (SVG).
//    Cycles in the needs graph: detected and shown as errors.
//    This visual was the #1 requested Pipeline Editor feature.`} />

                <CodeBlock label="CI/CD Catalog — GraphQL design" color="#f59e0b" code={
`# CI/CD Catalog GraphQL schema — component search
query CiCatalogSearch(
  $search: String
  $tags: [String!]
  $sortBy: CiCatalogResourcesSort
  $first: Int
  $after: String
) {
  ciCatalogResources(
    search: $search
    tags: $tags
    sortBy: $sortBy
    first: $first
    after: $after
  ) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      name
      description
      webPath
      versions(first: 1) {
        nodes {
          name        # semantic version: "2.4.1"
          createdAt
          components {
            nodes {
              name
              inputs { nodes { name type required description } }
            }
          }
        }
      }
      statistics {
        downloadCount  # for popularity sorting
      }
      verificationLevel  # VERIFIED | UNVERIFIED
    }
  }
}

# DESIGN DECISION: pagination via cursor (not offset)
# Cursor pagination is stable: new components added between
# pages don't cause items to repeat or be skipped.
# Offset pagination (page 1, 2, 3) is broken for live data.`} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GitLabVerifyDemo;
