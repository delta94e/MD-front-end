/**
 * AmazonRiskPlatformDemo.tsx
 *
 * Frontend Group Lead / Tech Lead — Amazon Risk Platform
 * Focus: Micro-frontend Platform, Regulatory Case Management, Theming Interop Library, Engineering Process Streamlining & Leadership
 */

import React, { useState, useEffect } from "react";

// Amazon-inspired Theme Palette
const AM = {
  bg: "#0B0E14",
  surface: "#121624",
  surface2: "#1C2136",
  border: "#29324F",
  text: "#A2B6ED",
  textBright: "#FFFFFF",
  textMuted: "#596894",
  amazonOrange: "#FF9900",
  amazonGold: "#F5B041",
  green: "#2EB67D",
  red: "#E01E5A",
  blue: "#29B6F6",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

interface Case {
  id: string;
  type: string;
  source: string;
  severity: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved";
  timestamp: string;
}

const INITIAL_CASES: Case[] = [
  { id: "CASE-4091", type: "FATCA Audit Discrepancy", source: "Merchant Risk Team", severity: "High", status: "Open", timestamp: "2026-06-19 09:12:00" },
  { id: "CASE-3892", type: "AML Suspicious Transaction Alert", source: "Transaction Risk Team", severity: "High", status: "In Progress", timestamp: "2026-06-19 08:34:12" },
  { id: "CASE-1102", type: "GDPR Right to Be Forgotten Request", source: "Identity MFE", severity: "Medium", status: "Open", timestamp: "2026-06-19 06:15:30" },
  { id: "CASE-0941", type: "Merchant Compliance Verification", source: "Compliance Audits", severity: "Low", status: "Resolved", timestamp: "2026-06-18 14:22:18" },
];

export function AmazonRiskPlatformDemo() {
  const [activeTab, setActiveTab] = useState<"mfe" | "cases" | "theming" | "process">("mfe");

  // ── Tab 1: Risk MFE Platform States ──
  const [selectedMfe, setSelectedMfe] = useState<"merchant" | "transaction" | "identity" | "compliance">("merchant");
  const [mfeStatus, setMfeStatus] = useState<Record<string, "healthy" | "loading" | "error">>({
    merchant: "healthy",
    transaction: "healthy",
    identity: "healthy",
    compliance: "healthy",
  });
  const [mfeLogs, setMfeLogs] = useState<string[]>([
    "[System] Risk MFE Shell Host Bootstrapped on Port 3000",
    "[System] Resolved shared singleton dependencies: react (v18.2.0), react-dom (v18.2.0)",
  ]);

  const toggleMfeStatus = (key: string, nextStatus: "healthy" | "loading" | "error") => {
    setMfeStatus(prev => ({ ...prev, [key]: nextStatus }));
    const timestamp = new Date().toLocaleTimeString();
    setMfeLogs(prev => [
      `[${timestamp}] Remote MFE [${key}] status changed to: ${nextStatus.toUpperCase()}`,
      ...prev
    ]);
  };

  // ── Tab 2: Case Management States ──
  const [cases, setCases] = useState<Case[]>(INITIAL_CASES);
  const [newCaseType, setNewCaseType] = useState("");
  const [newCaseSeverity, setNewCaseSeverity] = useState<"High" | "Medium" | "Low">("Medium");
  const [newCaseSource, setNewCaseSource] = useState("Manual Review");
  const [pipelineState, setPipelineState] = useState<"idle" | "running" | "success" | "failed">("idle");
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [integrationTestOutput, setIntegrationTestOutput] = useState<string>("Ready to execute Cypress & Jest integration suites...");
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [alarmTriggered, setAlarmTriggered] = useState(false);

  const addCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseType.trim()) return;
    const newCase: Case = {
      id: `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
      type: newCaseType,
      source: newCaseSource,
      severity: newCaseSeverity,
      status: "Open",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    };
    setCases([newCase, ...cases]);
    setNewCaseType("");
    
    // Simulate CloudWatch trigger if severity is High
    if (newCaseSeverity === "High") {
      setAlarmTriggered(true);
    }
  };

  const updateCaseStatus = (id: string, nextStatus: "Open" | "In Progress" | "Resolved") => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
  };

  const triggerPipeline = () => {
    setPipelineState("running");
    setPipelineLogs(["[CI/CD] Triggered by commit #risk-95a2f8", "[CI/CD] Linting codebase...", "[CI/CD] Running Webpack Module Federation dependency checks..."]);
    
    setTimeout(() => {
      setPipelineLogs(prev => [...prev, "[CI/CD] Compiling production chunks...", "[CI/CD] Running security vulnerability scanning (Snyk)...", "[CI/CD] 0 vulnerabilities found, compliance certificate signed!"]);
      setTimeout(() => {
        setPipelineState("success");
        setPipelineLogs(prev => [...prev, "[CI/CD] Deploying assets to S3 and CloudFront Canary routes (10% traffic)...", "[CI/CD] Deployment SUCCESSful!"]);
      }, 1000);
    }, 1000);
  };

  const runIntegrationTests = () => {
    setIsTestRunning(true);
    setIntegrationTestOutput("Initializing test environment...\nLoading remote MFE configurations...");
    setTimeout(() => {
      setIntegrationTestOutput(prev => prev + "\n[TEST] Verifying Host <-> Merchant Risk MFE message bridge... OK");
      setIntegrationTestOutput(prev => prev + "\n[TEST] Simulating JWT expiry token refresh lifecycle... OK");
      setIntegrationTestOutput(prev => prev + "\n[TEST] Running accessibility audits on Case Form fields... 100% compliant (0 violations)");
      setIntegrationTestOutput(prev => prev + "\n[TEST] Performing drag-and-drop MFE order telemetry check... OK");
      setTimeout(() => {
        setIntegrationTestOutput(prev => prev + "\n\n🎉 ALL 18 INTEGRATION TESTS PASSED (12.4s)");
        setIsTestRunning(false);
      }, 1000);
    }, 1000);
  };

  // ── Tab 3: Theming Interop Library States ──
  const [awsuiColor, setAwsuiColor] = useState("#FF9900");
  const [awsuiBorderRadius, setAwsuiBorderRadius] = useState("8px");
  const [awsuiPadding, setAwsuiPadding] = useState("16px");

  // ── Tab 4: Process & Leadership States ──
  const [isLocalMockEnabled, setIsLocalMockEnabled] = useState(false);
  const [mockApiLatency, setMockApiLatency] = useState(15);
  const [selectedDocTemplate, setSelectedDocTemplate] = useState("system-design");

  return (
    <div style={{ background: AM.bg, color: AM.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${AM.amazonOrange}, ${AM.amazonGold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛡️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: AM.textBright, letterSpacing: "-0.02em" }}>Amazon Risk & Compliance — Group Lead Platform</h1>
            <p style={{ margin: 0, fontSize: 11, color: AM.textMuted }}>Micro-frontend App Platform · Regulatory Case Management · Theming Interop Library · Frontend Process Streamlining</p>
          </div>
        </div>

        {/* Global Statistics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "1 App Shell", l: "Unified Risk Platform", c: AM.amazonOrange, sub: "Merchant, Transaction, Auditing MFE" },
            { v: "100+ Teams", l: "Theming Interoperability", c: AM.amazonGold, sub: "Adopted as standard across Amazon" },
            { v: "99.99% Uptime", l: "Continuous Monitoring & Alarms", c: AM.green, sub: "CloudWatch telemetry & integration tests" },
            { v: "feature-test: -80%", l: "Local Server-Side Mocks", c: AM.blue, sub: "Local testing time reduced from days to mins" },
          ].map(m => (
            <div key={m.l} style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderLeft: `3px solid ${m.c}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: AM.textBright }}>{m.l}</div>
              <div style={{ fontSize: 7, color: AM.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${AM.border}`, paddingBottom: 4 }}>
        {[
          { id: "mfe" as const, label: "🧩 Micro-Frontend Platform" },
          { id: "cases" as const, label: "🗂️ Regulatory Cases & CI/CD" },
          { id: "theming" as const, label: "🎨 Theming Interop Bridge" },
          { id: "process" as const, label: "⚙️ DevProcess & Leadership" },
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => setActiveTab(tb.id)}
            style={{
              background: activeTab === tb.id ? AM.surface2 : "transparent",
              color: activeTab === tb.id ? AM.textBright : AM.textMuted,
              border: activeTab === tb.id ? `1px solid ${AM.border}` : "1px solid transparent",
              borderRadius: "8px 8px 0 0",
              padding: "8px 20px",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              outline: "none"
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: RISK MFE APPLICATION PLATFORM ── */}
      {activeTab === "mfe" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>
          {/* MFE Interactive Simulator */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>RISK MFE RUNTIME ORCHESTRATOR</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 480, display: "flex", flexDirection: "column" }}>
              
              {/* Shell Header Mock */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#06080C", padding: "8px 12px", borderRadius: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 10, color: AM.textBright, fontWeight: 800 }}>🛡️ Risk App Shell (Host:3000)</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {["merchant", "transaction", "identity", "compliance"].map(key => (
                    <span
                      key={key}
                      onClick={() => setSelectedMfe(key as any)}
                      style={{
                        fontSize: 8,
                        padding: "3px 6px",
                        borderRadius: 4,
                        cursor: "pointer",
                        background: selectedMfe === key ? AM.amazonOrange : AM.surface,
                        color: selectedMfe === key ? "#000" : AM.text,
                        fontWeight: 700
                      }}
                    >
                      {key.toUpperCase()} MFE
                    </span>
                  ))}
                </div>
              </div>

              {/* Dynamic Loader Window */}
              <div style={{ flex: 1, background: "#06080C", border: `1px solid ${AM.border}`, borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${AM.border}`, paddingBottom: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: AM.textBright }}>
                    Loading Remote Module: <code style={{ color: AM.amazonGold }}>{selectedMfe}Risk MFE</code>
                  </span>
                  <span style={{
                    fontSize: 8,
                    color: mfeStatus[selectedMfe] === "healthy" ? AM.green : mfeStatus[selectedMfe] === "loading" ? AM.amazonGold : AM.red,
                    fontWeight: 700
                  }}>
                    ● {mfeStatus[selectedMfe]?.toUpperCase()}
                  </span>
                </div>

                {mfeStatus[selectedMfe] === "healthy" && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      {selectedMfe === "merchant" && (
                        <div>
                          <h4 style={{ margin: "0 0 6px", fontSize: 12, color: AM.textBright }}>Merchant Risk Assessment</h4>
                          <p style={{ margin: 0, fontSize: 10, color: AM.text, lineHeight: 1.5 }}>
                            Provides risk profiles and background auditing reports for registered third-party Sellers. Incorporates automated KYC validation status and tax reporting verifications.
                          </p>
                          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div style={{ background: AM.surface2, padding: 8, borderRadius: 6 }}>
                              <div style={{ fontSize: 7, color: AM.textMuted }}>Kyc Pass Rate</div>
                              <div style={{ fontSize: 14, fontWeight: 900, color: AM.green }}>98.4%</div>
                            </div>
                            <div style={{ background: AM.surface2, padding: 8, borderRadius: 6 }}>
                              <div style={{ fontSize: 7, color: AM.textMuted }}>Pending Audits</div>
                              <div style={{ fontSize: 14, fontWeight: 900, color: AM.amazonGold }}>14 Merchants</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedMfe === "transaction" && (
                        <div>
                          <h4 style={{ margin: "0 0 6px", fontSize: 12, color: AM.textBright }}>Transaction Risk Monitoring</h4>
                          <p style={{ margin: 0, fontSize: 10, color: AM.text, lineHeight: 1.5 }}>
                            Real-time pipeline monitoring incoming transactions for fraud patterns. Interfaces with predictive model endpoints to score transaction risk values in under 45ms.
                          </p>
                          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div style={{ background: AM.surface2, padding: 8, borderRadius: 6 }}>
                              <div style={{ fontSize: 7, color: AM.textMuted }}>Scored/Sec</div>
                              <div style={{ fontSize: 14, fontWeight: 900, color: AM.green }}>4,210 txs</div>
                            </div>
                            <div style={{ background: AM.surface2, padding: 8, borderRadius: 6 }}>
                              <div style={{ fontSize: 7, color: AM.textMuted }}>Fraud Flags (Hour)</div>
                              <div style={{ fontSize: 14, fontWeight: 900, color: AM.red }}>3 incidents</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedMfe === "identity" && (
                        <div>
                          <h4 style={{ margin: "0 0 6px", fontSize: 12, color: AM.textBright }}>Identity Verification & Biometrics</h4>
                          <p style={{ margin: 0, fontSize: 10, color: AM.text, lineHeight: 1.5 }}>
                            Verifies national ID uploads, tax information documents, and selfie checks. Employs client-side face detection templates to confirm photo consistency before upload.
                          </p>
                        </div>
                      )}

                      {selectedMfe === "compliance" && (
                        <div>
                          <h4 style={{ margin: "0 0 6px", fontSize: 12, color: AM.textBright }}>Compliance Audits & Reports</h4>
                          <p style={{ margin: 0, fontSize: 10, color: AM.text, lineHeight: 1.5 }}>
                            Aggregates regulatory data structures for annual audit compliance (such as FATCA, GDPR, and ISO standards). Outputs structured PDF datasets directly into AWS S3 storage vaults.
                          </p>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${AM.border}`, paddingTop: 8, fontSize: 8 }}>
                      <span style={{ color: AM.textMuted }}>MFE loaded via Webpack Module Federation</span>
                      <span style={{ color: AM.green }}>Shared Scope Singletons: OK</span>
                    </div>
                  </div>
                )}

                {mfeStatus[selectedMfe] === "loading" && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${AM.border}`, borderTopColor: AM.amazonOrange, animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: 10, color: AM.textMuted, marginTop: 10 }}>Fetching `remoteEntry.js` from child container...</span>
                  </div>
                )}

                {mfeStatus[selectedMfe] === "error" && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#1b0d12", borderRadius: 8, border: `1px solid ${AM.red}`, padding: 16 }}>
                    <span style={{ fontSize: 24 }}>🚨</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: AM.textBright, marginTop: 8 }}>MFE Connection Refused</span>
                    <p style={{ fontSize: 9, color: AM.text, textAlign: "center", margin: "4px 0 10px 0", lineHeight: 1.4 }}>
                      Remote container chunk loading failed. React Error Boundary caught script load failure.
                    </p>
                    <button
                      onClick={() => toggleMfeStatus(selectedMfe, "healthy")}
                      style={{ background: AM.red, border: "none", color: "#fff", borderRadius: 4, padding: "5px 12px", fontSize: 8.5, fontWeight: 700, cursor: "pointer" }}
                    >
                      Recover & Render Skeleton Mock
                    </button>
                  </div>
                )}
              </div>

              {/* Status Simulation Controls */}
              <div style={{ marginTop: 10, borderTop: `1px solid ${AM.border}`, paddingTop: 10 }}>
                <span style={{ fontSize: 8, color: AM.textMuted, display: "block", marginBottom: 6 }}>SIMULATE WORKSPACE PLATFORM SCENARIOS:</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => toggleMfeStatus(selectedMfe, "healthy")} style={{ flex: 1, background: AM.surface2, border: `1px solid ${AM.border}`, color: AM.green, borderRadius: 5, padding: "5px 0", cursor: "pointer", fontSize: 8.5 }}>✔ Sim Health</button>
                  <button onClick={() => toggleMfeStatus(selectedMfe, "loading")} style={{ flex: 1, background: AM.surface2, border: `1px solid ${AM.border}`, color: AM.amazonGold, borderRadius: 5, padding: "5px 0", cursor: "pointer", fontSize: 8.5 }}>⏳ Sim Network Lag</button>
                  <button onClick={() => toggleMfeStatus(selectedMfe, "error")} style={{ flex: 1, background: AM.surface2, border: `1px solid ${AM.border}`, color: AM.red, borderRadius: 5, padding: "5px 0", cursor: "pointer", fontSize: 8.5 }}>🚨 Sim Server Crash</button>
                </div>
              </div>

            </div>
          </div>

          {/* MFE Platform Metrics Logs */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>MFE SHELL INTERACTION LOGS</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 14, height: 480, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, overflowY: "auto", fontFamily: AM.mono, fontSize: 8.5, background: "#06080C", padding: 10, borderRadius: 6, border: `1px solid ${AM.border}` }}>
                {mfeLogs.map((log, i) => (
                  <div key={i} style={{ color: log.includes("healthy") || log.includes("System") ? AM.text : log.includes("changed to: ERROR") ? AM.red : AM.amazonGold, borderBottom: "1px solid #141829", padding: "4px 0" }}>
                    {log}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 10, background: AM.surface2, padding: 10, borderRadius: 6 }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: AM.textBright, display: "block", marginBottom: 4 }}>Platform Architecture Takeaway:</span>
                <p style={{ margin: 0, fontSize: 8, color: AM.text, lineHeight: 1.5 }}>
                  The Micro-frontend shell intercepts network and compilation errors on federated targets, keeping the rest of the Risk App active. This streamlines the work of separate dev teams into a single application experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LIGHTWEIGHT CASE MANAGEMENT & CI/CD ── */}
      {activeTab === "cases" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Cases List */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>REGULATORY CASES WORKSPACE</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 490, display: "flex", flexDirection: "column" }}>
              
              {/* Add Case Form */}
              <form onSubmit={addCase} style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="New regulatory issue type (e.g. GDPR Audit)..."
                  value={newCaseType}
                  onChange={e => setNewCaseType(e.target.value)}
                  style={{ flex: 1, background: "#06080C", border: `1px solid ${AM.border}`, borderRadius: 5, padding: "5px 8px", fontSize: 9.5, color: AM.textBright, outline: "none" }}
                />
                <select
                  value={newCaseSeverity}
                  onChange={e => setNewCaseSeverity(e.target.value as any)}
                  style={{ background: "#06080C", border: `1px solid ${AM.border}`, color: AM.textBright, fontSize: 9, padding: "0 6px", borderRadius: 5, outline: "none" }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <button type="submit" style={{ background: AM.amazonOrange, border: "none", color: "#000", fontWeight: 700, fontSize: 9, borderRadius: 5, padding: "0 12px", cursor: "pointer" }}>+ Case</button>
              </form>

              {/* Cases Table */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${AM.border}`, color: AM.textBright }}>
                      <th style={{ textAlign: "left", paddingBottom: 6 }}>ID</th>
                      <th style={{ textAlign: "left", paddingBottom: 6 }}>Type</th>
                      <th style={{ textAlign: "left", paddingBottom: 6 }}>Severity</th>
                      <th style={{ textAlign: "left", paddingBottom: 6 }}>Status</th>
                      <th style={{ textAlign: "right", paddingBottom: 6 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map(c => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${AM.border}` }}>
                        <td style={{ padding: "8px 0", fontFamily: AM.mono, color: AM.textBright }}>{c.id}</td>
                        <td style={{ padding: "8px 0" }}>
                          <div>{c.type}</div>
                          <div style={{ fontSize: 7.5, color: AM.textMuted }}>{c.source} • {c.timestamp}</div>
                        </td>
                        <td style={{ padding: "8px 0" }}>
                          <span style={{
                            fontSize: 7.5,
                            padding: "1px 5px",
                            borderRadius: 3,
                            background: c.severity === "High" ? `${AM.red}20` : c.severity === "Medium" ? `${AM.amazonGold}20` : `${AM.blue}20`,
                            color: c.severity === "High" ? AM.red : c.severity === "Medium" ? AM.amazonGold : AM.blue,
                            fontWeight: 700
                          }}>{c.severity}</span>
                        </td>
                        <td style={{ padding: "8px 0" }}>{c.status}</td>
                        <td style={{ padding: "8px 0", textAlign: "right" }}>
                          <select
                            value={c.status}
                            onChange={e => updateCaseStatus(c.id, e.target.value as any)}
                            style={{ background: "#06080C", border: `1px solid ${AM.border}`, color: AM.textBright, fontSize: 8, padding: 2, borderRadius: 3, outline: "none" }}
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* CloudWatch Alarm Panel */}
              {alarmTriggered && (
                <div style={{ marginTop: 10, background: "#2e0f15", border: `1px solid ${AM.red}`, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: AM.red, display: "block" }}>🚨 CLOUDWATCH ALARM TRIGGERED</span>
                    <span style={{ fontSize: 8, color: AM.text }}>High Severity case logged. Automatic SNS pager alerts routed to on-call Slack channel.</span>
                  </div>
                  <button
                    onClick={() => setAlarmTriggered(false)}
                    style={{ background: AM.red, border: "none", color: "#fff", borderRadius: 4, padding: "4px 8px", fontSize: 8, fontWeight: 700, cursor: "pointer" }}
                  >
                    Acknowledge
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* CI/CD & Compliance Panel */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>CI/CD, TESTS & COMPLIANCE PIPELINES</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 490, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              {/* CI/CD Pipeline Simulator */}
              <div style={{ background: AM.surface2, border: `1px solid ${AM.border}`, padding: 10, borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: AM.textBright }}>🚀 Full CI/CD Deployment pipeline</span>
                  <button
                    onClick={triggerPipeline}
                    disabled={pipelineState === "running"}
                    style={{ background: AM.amazonOrange, border: "none", color: "#000", fontWeight: 700, fontSize: 8.5, borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}
                  >
                    {pipelineState === "running" ? "Running..." : "Trigger Deploy"}
                  </button>
                </div>
                
                {pipelineState !== "idle" && (
                  <div style={{ fontFamily: AM.mono, fontSize: 8, background: "#06080C", padding: 8, borderRadius: 5, maxHeight: 80, overflowY: "auto", color: AM.green }}>
                    {pipelineLogs.map((log, idx) => <div key={idx}>{log}</div>)}
                  </div>
                )}
              </div>

              {/* Integration Tests console */}
              <div style={{ background: AM.surface2, border: `1px solid ${AM.border}`, padding: 10, borderRadius: 8, marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: AM.textBright }}>🧪 E2E Integration tests suite</span>
                  <button
                    onClick={runIntegrationTests}
                    disabled={isTestRunning}
                    style={{ background: AM.blue, border: "none", color: "#fff", fontWeight: 700, fontSize: 8.5, borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}
                  >
                    {isTestRunning ? "Testing..." : "Run Tests"}
                  </button>
                </div>
                <pre style={{
                  margin: 0,
                  fontFamily: AM.mono,
                  fontSize: 7.5,
                  background: "#06080C",
                  color: AM.text,
                  padding: 8,
                  borderRadius: 5,
                  height: 100,
                  overflowY: "auto",
                  whiteSpace: "pre-wrap"
                }}>
                  {integrationTestOutput}
                </pre>
              </div>

              {/* Security Certifications */}
              <div style={{ background: "#06080C", padding: 10, borderRadius: 8, border: `1px solid ${AM.border}`, marginTop: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: AM.textMuted, display: "block", marginBottom: 6 }}>APP SECURITY COMPLIANCE REGISTRY</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {[
                    { name: "SOC-2 Type II", status: "Certified", color: AM.green },
                    { name: "ISO-27001", status: "Verified", color: AM.green },
                    { name: "SSL/TLS v1.3", status: "Secure", color: AM.green },
                  ].map(c => (
                    <div key={c.name} style={{ background: AM.surface2, padding: 6, borderRadius: 5, textAlign: "center" }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: AM.textBright }}>{c.name}</div>
                      <div style={{ fontSize: 7, color: c.color, fontWeight: 700, marginTop: 2 }}>{c.status}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: THEMING INTEROPERABILITY BRIDGE ── */}
      {activeTab === "theming" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 14 }}>
          {/* Bridge configuration controls */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>THEMING BRIDGE BRIDGE SCHEMA BUILDER</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 470, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: AM.textBright, display: "block", marginBottom: 6 }}>Bridging Amazon Design Systems to External Builders</span>
                <p style={{ margin: "0 0 14px 0", fontSize: 9.5, color: AM.text, lineHeight: 1.5 }}>
                  This theme bridge translates Amazon core token definitions into a standardized CSS variables structure consumed by an external form builder library, allowing seamless styling compatibility across nearly 100 teams.
                </p>

                {/* Simulated CSS inputs */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 8.5, color: AM.textBright, display: "block", marginBottom: 3 }}>Amazon Theme Color (`--awsui-color-background-primary`)</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="color"
                        value={awsuiColor}
                        onChange={e => setAwsuiColor(e.target.value)}
                        style={{ background: "none", border: "none", cursor: "pointer", width: 28, height: 24 }}
                      />
                      <input
                        type="text"
                        value={awsuiColor}
                        onChange={e => setAwsuiColor(e.target.value)}
                        style={{ flex: 1, background: "#06080C", border: `1px solid ${AM.border}`, borderRadius: 4, color: AM.textBright, fontSize: 9.5, padding: "3px 6px" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 8.5, color: AM.textBright, display: "block", marginBottom: 3 }}>Amazon Border Radius (`--awsui-border-radius-card`)</label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={parseInt(awsuiBorderRadius)}
                      onChange={e => setAwsuiBorderRadius(`${e.target.value}px`)}
                      style={{ width: "100%", accentColor: AM.amazonOrange }}
                    />
                    <div style={{ fontSize: 7.5, fontFamily: AM.mono, color: AM.amazonGold, textAlign: "right" }}>{awsuiBorderRadius}</div>
                  </div>

                  <div>
                    <label style={{ fontSize: 8.5, color: AM.textBright, display: "block", marginBottom: 3 }}>Amazon Padding Token (`--awsui-spacing-container`)</label>
                    <input
                      type="range"
                      min="8"
                      max="32"
                      value={parseInt(awsuiPadding)}
                      onChange={e => setAwsuiPadding(`${e.target.value}px`)}
                      style={{ width: "100%", accentColor: AM.amazonOrange }}
                    />
                    <div style={{ fontSize: 7.5, fontFamily: AM.mono, color: AM.amazonGold, textAlign: "right" }}>{awsuiPadding}</div>
                  </div>
                </div>
              </div>

              {/* Code output preview */}
              <div style={{ background: "#06080C", borderRadius: 8, padding: 8, border: `1px solid ${AM.border}` }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: AM.textMuted, display: "block", marginBottom: 4 }}>THEMING TOKEN MAP TRANSLATION</span>
                <pre style={{ margin: 0, fontFamily: AM.mono, fontSize: 8, color: AM.green }}>
{`:root {
  --theme-brand-color: ${awsuiColor};
  --theme-border-radius: ${awsuiBorderRadius};
  --theme-card-padding: ${awsuiPadding};
}`}
                </pre>
              </div>

            </div>
          </div>

          {/* Form preview */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>INTEROPERABLE COMPONENT PREVIEW</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 470, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              <div>
                <span style={{ fontSize: 9.5, color: AM.textMuted, display: "block", marginBottom: 10 }}>EXTERNAL FORM BUILDER LIBRARY CARD (INJECTED THEME)</span>
                
                {/* Simulated Form component rendered with variables */}
                <div style={{
                  background: AM.surface2,
                  border: `1px solid ${AM.border}`,
                  borderRadius: awsuiBorderRadius,
                  padding: awsuiPadding,
                  transition: "all 0.1s ease"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 6, height: 16, background: awsuiColor, borderRadius: 2 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: AM.textBright }}>Form Builder Template Preview</span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 7.5, color: AM.textMuted, display: "block", marginBottom: 2 }}>Merchant Full Name</span>
                      <div style={{ background: "#06080C", border: `1px solid ${AM.border}`, borderRadius: 4, height: 24, display: "flex", alignItems: "center", padding: "0 8px", fontSize: 9, color: AM.text }}>Truong Nguyen</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 7.5, color: AM.textMuted, display: "block", marginBottom: 2 }}>Registered Tax Identifer</span>
                      <div style={{ background: "#06080C", border: `1px solid ${AM.border}`, borderRadius: 4, height: 24, display: "flex", alignItems: "center", padding: "0 8px", fontSize: 9, color: AM.text }}>DE-952834190</div>
                    </div>

                    <button style={{
                      background: awsuiColor,
                      border: "none",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      borderRadius: 4,
                      height: 26,
                      marginTop: 6,
                      cursor: "pointer"
                    }}>
                      Submit Compliance Assessment
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ background: "#06080C", padding: 8, borderRadius: 6, fontSize: 8 }}>
                <span style={{ color: AM.textBright, fontWeight: 700, display: "block", marginBottom: 4 }}>How Interoperability Works:</span>
                We built this bridge library to export Amazon UI variables dynamically. The form builder consumes standard CSS properties, maintaining exact branding consistency across 100 teams without packaging forks.
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: FRONTEND PROCESSES & LEADERSHIP ── */}
      {activeTab === "process" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 14 }}>
          {/* Left panel: leadership planning metrics */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>DEVELOPMENT LEADERSHIP & SYSTEM DESIGN</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 490, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              {/* Tech stack & doc templates selector */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: AM.textBright }}>System Design Templates & Standardization</span>
                  <select
                    value={selectedDocTemplate}
                    onChange={e => setSelectedDocTemplate(e.target.value)}
                    style={{ background: "#06080C", border: `1px solid ${AM.border}`, color: AM.textBright, fontSize: 8.5, padding: "3px 6px", borderRadius: 4, outline: "none" }}
                  >
                    <option value="system-design">Standard System Design Document</option>
                    <option value="estimation">Effort Estimation & Breakdown Checklist</option>
                    <option value="standards">Code Standards & Reviews Guidelines</option>
                  </select>
                </div>

                {/* Templates preview container */}
                <div style={{ background: "#06080C", border: `1px solid ${AM.border}`, borderRadius: 8, padding: 10, height: 180, overflowY: "auto" }}>
                  {selectedDocTemplate === "system-design" && (
                    <div style={{ fontSize: 8.5, lineHeight: 1.5 }}>
                      <span style={{ color: AM.amazonOrange, fontWeight: 700, display: "block" }}>📄 System Design Document Template v2.4</span>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: 12, color: AM.text }}>
                        <li><strong>1. Tech Stack Alignment:</strong> Force checklist verification matching standard dependencies.</li>
                        <li><strong>2. State Management Architecture:</strong> Details React store slices, hooks, and local triggers.</li>
                        <li><strong>3. Web Performance Metrics:</strong> Enforce CLS targets &lt; 0.1, p95 Page Load &lt; 500ms.</li>
                        <li><strong>4. Telemetry Framework:</strong> Required CloudWatch alarms schema structure.</li>
                      </ul>
                    </div>
                  )}

                  {selectedDocTemplate === "estimation" && (
                    <div style={{ fontSize: 8.5, lineHeight: 1.5 }}>
                      <span style={{ color: AM.amazonOrange, fontWeight: 700, display: "block" }}>⏳ Effort Estimation & WBS Formula</span>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: 12, color: AM.text }}>
                        <li><strong>base_app_setup:</strong> 1.5 developer days.</li>
                        <li><strong>ux_mockups_fidelity_match:</strong> 2.0 developer days.</li>
                        <li><strong>integration_test_specs:</strong> 1.5 developer days.</li>
                        <li><strong>monitoring_alarms_integration:</strong> 1.0 developer days.</li>
                        <li><strong>buffer_security_cert:</strong> 2.0 developer days.</li>
                      </ul>
                    </div>
                  )}

                  {selectedDocTemplate === "standards" && (
                    <div style={{ fontSize: 8.5, lineHeight: 1.5 }}>
                      <span style={{ color: AM.amazonOrange, fontWeight: 700, display: "block" }}>⚙️ PR Review Standards Checklists</span>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: 12, color: AM.text }}>
                        <li><strong>Bundle check:</strong> Verify Webpack federation shared singletons aren't duplicated.</li>
                        <li><strong>A11y targets:</strong> Axe-core clean scan reports required for merge.</li>
                        <li><strong>Testing:</strong> Test coverage checklist must be &gt; 90% lines matched.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance training results */}
              <div style={{ background: AM.surface2, border: `1px solid ${AM.border}`, padding: 10, borderRadius: 8 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: AM.textBright, display: "block", marginBottom: 6 }}>React & Performance Literacy Outcomes</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: AM.surface, padding: 8, borderRadius: 6, textAlign: "center" }}>
                    <span style={{ fontSize: 7, color: AM.textMuted }}>Avg render cost (Before)</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: AM.red, display: "block", marginTop: 2 }}>120ms</span>
                  </div>
                  <div style={{ background: AM.surface, padding: 8, borderRadius: 6, textAlign: "center" }}>
                    <span style={{ fontSize: 7, color: AM.textMuted }}>Avg render cost (After Guild)</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: AM.green, display: "block", marginTop: 2 }}>12ms</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right panel: Server-side local testing mocks */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>LOCAL TESTING MSW CONTROLLER MOCKS</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 490, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: AM.textBright, display: "block", marginBottom: 6 }}>Offline server-side testing engine</span>
                <p style={{ margin: "0 0 14px 0", fontSize: 9.5, color: AM.text, lineHeight: 1.5 }}>
                  Instead of spinning up full docker environments, we introduced Mock Service Worker (MSW) scripts to intercept server-side templates and endpoints, reducing developer feature testing time by **80%**.
                </p>

                {/* MSW Control Switches */}
                <div style={{ background: AM.surface2, padding: 10, borderRadius: 8, border: `1px solid ${AM.border}`, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: AM.textBright }}>MSW Interception Status</span>
                    <button
                      onClick={() => setIsLocalMockEnabled(!isLocalMockEnabled)}
                      style={{
                        background: isLocalMockEnabled ? AM.green : AM.red,
                        border: "none",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 8.5,
                        borderRadius: 4,
                        padding: "4px 10px",
                        cursor: "pointer"
                      }}
                    >
                      {isLocalMockEnabled ? "MOCK RUNNING" : "MOCK DISABLED"}
                    </button>
                  </div>

                  <div>
                    <label style={{ fontSize: 8, color: AM.textMuted, display: "block", marginBottom: 3 }}>Mock Endpoint Latency (ms)</label>
                    <input
                      type="range"
                      min="5"
                      max="300"
                      value={mockApiLatency}
                      onChange={e => setMockApiLatency(parseInt(e.target.value))}
                      style={{ width: "100%", accentColor: AM.amazonOrange }}
                    />
                    <div style={{ fontSize: 7.5, fontFamily: AM.mono, color: AM.amazonGold, textAlign: "right" }}>{mockApiLatency}ms</div>
                  </div>
                </div>
              </div>

              {/* Code representation of MSW config */}
              <div style={{ background: "#06080C", borderRadius: 8, padding: 8, border: `1px solid ${AM.border}` }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: AM.textMuted, display: "block", marginBottom: 4 }}>MSW LOCAL CONTROLLER DEFINITION</span>
                <pre style={{ margin: 0, fontFamily: AM.mono, fontSize: 8, color: AM.green }}>
{`// src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/risk/profile', (req, res, ctx) => {
    return res(
      ctx.delay(${mockApiLatency}),
      ctx.status(200),
      ctx.json({
        merchantId: 'M-9102',
        riskScore: 'Low',
        auditPass: true
      })
    );
  })
];`}
                </pre>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Global CSS spinner keyframe */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
