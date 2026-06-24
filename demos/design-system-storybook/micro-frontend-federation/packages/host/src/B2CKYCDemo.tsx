/**
 * B2CKYCDemo.tsx
 *
 * B2C Web + Desktop Applications
 *
 * 1. KYC FLOW — configurable architecture: 7-day conversion 12.19% → 20.03% (+64%).
 *    5-country centralized config, compliance migration flow.
 *
 * 2. A/B TESTING — data-informed UX decisions, variant simulation, winner declaration.
 *
 * 3. DESKTOP (ELECTRON) — Webview Pool pre-loading (+30% speed), RTL layout (Arabic),
 *    CVD color schemes (accessibility for visually impaired users).
 *
 * TABS
 *   🔐 KYC Flow         — configurable country-aware verification steps + funnel
 *   🧪 A/B Testing      — UX variant runner with conversion metrics
 *   🖥 Desktop           — Webview Pool, RTL toggle, CVD color schemes
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Country configs
// ─────────────────────────────────────────────────────────────────

type DocumentType = "national_id" | "passport" | "driving_license" | "tax_id";
type KYCStep = {
  id: string; label: string; icon: string;
  required: boolean; description: string;
};

interface CountryKYCConfig {
  name: string; flag: string;
  steps: KYCStep[];
  docTypes: DocumentType[];
  maxRetries: number;
  livenessThreshold: number;
  passRate7d: string;
  passRateLifetime: string;
}

const DOC_LABELS: Record<DocumentType, string> = {
  national_id: "National ID Card", passport: "Passport",
  driving_license: "Driving License", tax_id: "Tax ID (NPWP/TIN)",
};

const COUNTRY_CONFIGS: Record<string, CountryKYCConfig> = {
  SG: {
    name: "Singapore", flag: "🇸🇬",
    steps: [
      { id: "doc",      label: "Identity Document", icon: "🪪", required: true,  description: "Upload NRIC, Passport, or FIN card" },
      { id: "liveness", label: "Liveness Check",    icon: "👤", required: true,  description: "Real-time facial scan (threshold: 0.87)" },
      { id: "address",  label: "Proof of Address",  icon: "🏠", required: true,  description: "Utility bill or bank statement < 3 months" },
    ],
    docTypes: ["national_id", "passport", "driving_license"],
    maxRetries: 3, livenessThreshold: 0.87,
    passRate7d: "24.1%", passRateLifetime: "14.5%",
  },
  TH: {
    name: "Thailand", flag: "🇹🇭",
    steps: [
      { id: "doc",      label: "Identity Document", icon: "🪪", required: true,  description: "Thai National ID or Passport" },
      { id: "liveness", label: "Liveness Check",    icon: "👤", required: true,  description: "Real-time facial scan (threshold: 0.82)" },
    ],
    docTypes: ["national_id", "passport"],
    maxRetries: 2, livenessThreshold: 0.82,
    passRate7d: "18.7%", passRateLifetime: "14.5%",
  },
  PH: {
    name: "Philippines", flag: "🇵🇭",
    steps: [
      { id: "doc",      label: "Identity Document", icon: "🪪", required: true,  description: "National ID, Passport, or Driver's License" },
      { id: "liveness", label: "Liveness Check",    icon: "👤", required: true,  description: "Real-time facial scan (threshold: 0.80)" },
      { id: "selfie",   label: "Selfie with ID",    icon: "🤳", required: true,  description: "Hold document next to face for comparison" },
    ],
    docTypes: ["national_id", "passport", "driving_license"],
    maxRetries: 3, livenessThreshold: 0.80,
    passRate7d: "19.3%", passRateLifetime: "14.5%",
  },
  MY: {
    name: "Malaysia", flag: "🇲🇾",
    steps: [
      { id: "doc",      label: "Identity Document", icon: "🪪", required: true,  description: "MyKad or Passport" },
      { id: "liveness", label: "Liveness Check",    icon: "👤", required: true,  description: "Real-time facial scan (threshold: 0.84)" },
    ],
    docTypes: ["national_id", "passport"],
    maxRetries: 2, livenessThreshold: 0.84,
    passRate7d: "21.5%", passRateLifetime: "14.5%",
  },
  ID: {
    name: "Indonesia", flag: "🇮🇩",
    steps: [
      { id: "doc",      label: "Identity Document", icon: "🪪", required: true,  description: "KTP (National ID) or Passport" },
      { id: "liveness", label: "Liveness Check",    icon: "👤", required: true,  description: "Real-time facial scan (threshold: 0.81)" },
      { id: "tax",      label: "Tax ID (NPWP)",     icon: "📄", required: false, description: "Optional but improves verification speed" },
    ],
    docTypes: ["national_id", "passport", "tax_id"],
    maxRetries: 3, livenessThreshold: 0.81,
    passRate7d: "17.2%", passRateLifetime: "14.5%",
  },
};

// ─────────────────────────────────────────────────────────────────
// A/B test data
// ─────────────────────────────────────────────────────────────────

const AB_VARIANTS = {
  A: { label: "Multi-step form", description: "All fields on one screen", conversionRate: 12.4, color: "#6366f1" },
  B: { label: "Progressive disclosure", description: "One field at a time (reduces cognitive load)", conversionRate: 19.8, color: "#22c55e" },
};

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 280 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function B2CKYCDemo() {
  const [activeTab, setActiveTab] = useState<"kyc" | "ab" | "desktop">("kyc");

  // KYC state
  const [selectedCountry, setSelectedCountry] = useState<string>("SG");
  const [kycStep, setKycStep] = useState(0);
  const [kycComplete, setKycComplete] = useState(false);
  const config = COUNTRY_CONFIGS[selectedCountry];

  const resetKYC = useCallback(() => { setKycStep(0); setKycComplete(false); }, []);
  useEffect(() => { resetKYC(); }, [selectedCountry, resetKYC]);

  const advanceStep = () => {
    if (kycStep < config.steps.length - 1) {
      setKycStep(s => s + 1);
    } else {
      setKycComplete(true);
    }
  };

  // A/B state
  const [abRunning, setAbRunning] = useState(false);
  const [abProgress, setAbProgress] = useState(0);
  const [abComplete, setAbComplete] = useState(false);
  const abRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runABTest = () => {
    if (abRunning) return;
    setAbRunning(true); setAbProgress(0); setAbComplete(false);
    let p = 0;
    abRef.current = setInterval(() => {
      p += 2;
      setAbProgress(p);
      if (p >= 100) {
        clearInterval(abRef.current!);
        setAbRunning(false); setAbComplete(true);
      }
    }, 40);
  };
  useEffect(() => () => { if (abRef.current) clearInterval(abRef.current); }, []);

  // Desktop state
  const [poolLoading, setPoolLoading] = useState<"idle" | "cold" | "pool">("idle");
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [rtl, setRtl] = useState(false);
  const [cvdMode, setCvdMode] = useState<"normal" | "deuteranopia" | "protanopia" | "monochrome">("normal");
  const [poolItems] = useState(["Home", "Wallet", "History"]);

  const simulateLoad = (type: "cold" | "pool") => {
    setPoolLoading(type); setLoadTime(null);
    const t = type === "cold" ? 2300 : 1600;
    setTimeout(() => {
      setLoadTime(t); setPoolLoading("idle");
    }, type === "cold" ? 800 : 350);
  };

  const cvdFilter: Record<string, string> = {
    normal: "none",
    deuteranopia: "saturate(0.5) hue-rotate(140deg) saturate(2)",
    protanopia: "saturate(0.4) hue-rotate(30deg) saturate(1.8)",
    monochrome: "grayscale(1)",
  };

  const TABS = [
    { id: "kyc"     as const, label: "🔐 KYC Flow"    },
    { id: "ab"      as const, label: "🧪 A/B Testing"  },
    { id: "desktop" as const, label: "🖥 Desktop"       },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🏦</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>B2C Web + Desktop Applications</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              KYC 12.19%→20.03% conversion · 5-country config · Electron Webview Pool · RTL · CVD
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["KYC Configurable Architecture", "A/B Testing", "Monorepo", "React + TypeScript", "Electron", "Webview Pool", "RTL (Arabic)", "CVD Accessibility", "P0 On-call", "AI-assisted Dev"].map(t => (
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

      {/* ── KYC FLOW ── */}
      {activeTab === "kyc" && (
        <div>
          {/* Conversion headline */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
            {[
              { label: "7-day Conversion (Before)", value: "12.19%", color: "#ef4444", icon: "📉" },
              { label: "7-day Conversion (After)",  value: "20.03%", color: "#22c55e", icon: "📈" },
              { label: "Relative Improvement",      value: "+64%",   color: "#f59e0b", icon: "⚡" },
              { label: "Lifetime Pass Rate",         value: "14.5%",  color: "#6366f1", icon: "🌏" },
            ].map(m => (
              <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${m.color}20`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 9, color: "#64748b", marginTop: 3 }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 14 }}>
            {/* Country config selector */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
                5-COUNTRY CONFIG
              </div>
              {Object.entries(COUNTRY_CONFIGS).map(([code, cfg]) => (
                <button key={code} onClick={() => setSelectedCountry(code)} style={{
                  width: "100%", display: "flex", gap: 10, alignItems: "center", textAlign: "left",
                  background: selectedCountry === code ? "#1e3a5f" : "#1e293b",
                  border: `1px solid ${selectedCountry === code ? "#3b82f6" : "#334155"}`,
                  borderRadius: 8, padding: "9px 12px", cursor: "pointer", color: "#f1f5f9", marginBottom: 5,
                }}>
                  <span style={{ fontSize: 18 }}>{cfg.flag}</span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: selectedCountry === code ? "#60a5fa" : "#94a3b8" }}>{cfg.name}</div>
                    <div style={{ fontSize: 8, color: "#475569" }}>{cfg.steps.length} steps · {cfg.docTypes.length} doc types</div>
                  </div>
                </button>
              ))}
              <div style={{ marginTop: 10 }}>
                <CodeBlock label="Centralized country config — frontend-maintained" color="#6366f1" code={
`// All 5-country configs in one place.
// Adding a new market = add one config block.
// No backend changes. No deploy dependency.
// Product/compliance team can review as a PR.

const KYC_CONFIGS = {
  ${selectedCountry}: {
    steps: [${config.steps.map(s => `"${s.id}"`).join(", ")}],
    docTypes: [${config.docTypes.map(d => `"${d}"`).join(", ")}],
    maxRetries: ${config.maxRetries},
    livenessThreshold: ${config.livenessThreshold},
  },
  // ...other countries
};

// The KYC flow is driven entirely by this config.
// Same React components render for all countries.
// Only the config changes what steps appear,
// what documents are accepted, what retries are allowed.`} />
              </div>
            </div>

            {/* KYC simulator */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>
                  {config.flag} {config.name.toUpperCase()} — INTERACTIVE KYC FLOW
                </div>
                <button onClick={resetKYC} style={{ background: "transparent", border: "1px solid #334155", borderRadius: 6, padding: "4px 10px", color: "#64748b", cursor: "pointer", fontSize: 10 }}>↺ Reset</button>
              </div>

              {/* Step progress */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
                {config.steps.map((step, i) => (
                  <React.Fragment key={step.id}>
                    <div style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", border: `2px solid ${kycComplete || i < kycStep ? "#22c55e" : i === kycStep ? "#3b82f6" : "#334155"}`,
                        background: kycComplete || i < kycStep ? "#22c55e20" : i === kycStep ? "#3b82f620" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                        transition: "all 0.3s",
                      }}>
                        {kycComplete || i < kycStep ? "✓" : step.icon}
                      </div>
                      <div style={{ fontSize: 8, color: i === kycStep ? "#60a5fa" : "#475569", textAlign: "center" }}>{step.label}</div>
                      {!step.required && <div style={{ fontSize: 7, color: "#f59e0b" }}>optional</div>}
                    </div>
                    {i < config.steps.length - 1 && (
                      <div style={{ height: 2, flex: 0.3, background: kycComplete || i < kycStep ? "#22c55e" : "#334155", transition: "background 0.3s" }} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Current step UI */}
              {!kycComplete ? (
                <div style={{ background: "#1e293b", border: "1px solid #3b82f640", borderRadius: 10, padding: 16 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{config.steps[kycStep]?.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{config.steps[kycStep]?.label}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{config.steps[kycStep]?.description}</div>
                    </div>
                  </div>

                  {/* Doc type selector for step 0 */}
                  {config.steps[kycStep]?.id === "doc" && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {config.docTypes.map(dt => (
                        <div key={dt} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", fontSize: 9, color: "#94a3b8", cursor: "pointer" }}>
                          {DOC_LABELS[dt]}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Liveness for step 1 */}
                  {config.steps[kycStep]?.id === "liveness" && (
                    <div style={{ background: "#0f172a", borderRadius: 8, padding: 10, marginBottom: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                      <div style={{ fontSize: 9, color: "#64748b" }}>
                        Threshold: {config.livenessThreshold * 100}% confidence · Max retries: {config.maxRetries}
                      </div>
                    </div>
                  )}

                  <button onClick={advanceStep} style={{ background: "#3b82f6", border: "none", borderRadius: 8, padding: "9px 20px", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                    {kycStep < config.steps.length - 1 ? "Continue →" : "Submit ✓"}
                  </button>
                </div>
              ) : (
                <div style={{ background: "#22c55e15", border: "1px solid #22c55e40", borderRadius: 10, padding: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>KYC Verification Complete</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>{config.name} flow · {config.steps.length} steps verified</div>
                </div>
              )}

              {/* Funnel visualization */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
                  CONVERSION FUNNEL — BEFORE vs AFTER REFACTOR
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Before (hardcoded)", pct: 12.19, color: "#ef4444" },
                    { label: "After (configurable)", pct: 20.03, color: "#22c55e" },
                  ].map(f => (
                    <div key={f.label} style={{ background: "#1e293b", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>{f.label}</div>
                      {["Started KYC", "Submitted Docs", "Passed Liveness", "Verified (7d)"].map((stage, i, arr) => {
                        const pcts = [100, 65, 40, f.pct];
                        return (
                          <div key={stage} style={{ marginBottom: 4 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                              <span style={{ fontSize: 8, color: "#475569" }}>{stage}</span>
                              <span style={{ fontSize: 8, color: f.color }}>{pcts[i]}%</span>
                            </div>
                            <div style={{ background: "#0f172a", borderRadius: 3, height: 10, overflow: "hidden" }}>
                              <div style={{ background: f.color, height: "100%", width: `${pcts[i]}%`, borderRadius: 3, opacity: 0.8, transition: "width 0.5s" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── A/B TESTING ── */}
      {activeTab === "ab" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 12, letterSpacing: "0.08em" }}>
            A/B TEST — KYC UX IMPROVEMENT · DATA-INFORMED PRODUCT DECISION
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {Object.entries(AB_VARIANTS).map(([key, variant]) => (
              <div key={key} style={{ background: "#1e293b", border: `1px solid ${variant.color}30`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: variant.color + "15", padding: "10px 14px", borderBottom: "1px solid " + variant.color + "20" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: variant.color }}>Variant {key}: {variant.label}</div>
                  <div style={{ fontSize: 9, color: "#64748b" }}>{variant.description}</div>
                </div>
                <div style={{ padding: 14 }}>
                  {key === "A" ? (
                    /* Multi-step form variant */
                    <div style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>KYC Verification Form</div>
                      {["Full name", "Date of birth", "ID number", "Nationality", "Address", "Phone"].map(field => (
                        <div key={field} style={{ marginBottom: 5 }}>
                          <div style={{ fontSize: 8, color: "#475569", marginBottom: 2 }}>{field}</div>
                          <div style={{ background: "#1e293b", borderRadius: 4, height: 20, border: "1px solid #334155" }} />
                        </div>
                      ))}
                      <div style={{ background: "#3b82f6", borderRadius: 6, padding: "6px 10px", textAlign: "center", marginTop: 8 }}>
                        <div style={{ fontSize: 9, color: "#fff" }}>Submit All →</div>
                      </div>
                    </div>
                  ) : (
                    /* Progressive disclosure variant */
                    <div style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>Step 1 of 6</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>What's your full name?</div>
                      <div style={{ background: "#1e293b", borderRadius: 6, height: 32, border: "1px solid #3b82f6", marginBottom: 8, display: "flex", alignItems: "center", padding: "0 8px" }}>
                        <div style={{ fontSize: 9, color: "#3b82f6" }}>|</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <div style={{ background: "#334155", borderRadius: 6, padding: "6px 10px", fontSize: 9, color: "#94a3b8" }}>← Back</div>
                        <div style={{ background: "#3b82f6", borderRadius: 6, padding: "6px 10px", fontSize: 9, color: "#fff", flex: 1, textAlign: "center" }}>Continue →</div>
                      </div>
                    </div>
                  )}

                  {abComplete && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>7-day conversion rate</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, background: "#0f172a", borderRadius: 4, height: 18, overflow: "hidden" }}>
                          <div style={{ background: variant.color, height: "100%", width: `${variant.conversionRate * 5}px`, maxWidth: "100%", transition: "width 1s" }} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: variant.color }}>{variant.conversionRate}%</div>
                      </div>
                      {key === "B" && (
                        <div style={{ marginTop: 6, background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 6, padding: "5px 8px", fontSize: 8, color: "#22c55e" }}>
                          🏆 Winner — +59.7% relative improvement
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Test runner */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>TEST RUNNER</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ flex: 1, background: "#0f172a", borderRadius: 4, height: 12, overflow: "hidden" }}>
                <div style={{ background: "#6366f1", height: "100%", width: `${abProgress}%`, borderRadius: 4, transition: "width 0.1s" }} />
              </div>
              <div style={{ fontSize: 10, color: "#6366f1", width: 40, textAlign: "right" }}>{abProgress}%</div>
            </div>
            {abRunning && (
              <div style={{ fontSize: 9, color: "#64748b" }}>
                Running on {Math.round(abProgress * 10_000).toLocaleString()} users...
              </div>
            )}
            {abComplete && (
              <div style={{ fontSize: 9, color: "#22c55e", marginBottom: 6 }}>
                ✓ 1,000,000 users sampled · Statistical significance: p &lt; 0.001 · Confidence: 99.9%
              </div>
            )}
            <button onClick={runABTest} disabled={abRunning} style={{ background: abRunning ? "#334155" : "#6366f1", border: "none", borderRadius: 8, padding: "8px 20px", color: "#fff", cursor: abRunning ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 700 }}>
              {abRunning ? "Running test…" : abComplete ? "Re-run Test" : "▶ Run A/B Test"}
            </button>
          </div>

          <CodeBlock label="A/B testing integration — data-informed UX decisions" color="#6366f1" code={
`// A/B test setup: Variant A (multi-step) vs Variant B (progressive disclosure)
// Goal metric: 7-day KYC completion rate
// Hypothesis: reducing cognitive load per screen increases completion rate

// 1. ASSIGNMENT (deterministic — same user always sees same variant):
const variant = getABVariant("kyc-progressive-v2", userId);
// hash(userId + "kyc-progressive-v2") % 2 === 0 → "A" else "B"

// 2. RENDERING (same flow component, different config):
<KYCFlow
  config={KYC_CONFIGS[country]}
  variant={variant}
  layout={variant === "B" ? "progressive" : "multi-field"}
/>

// 3. TRACKING (fire events at each step):
analytics.track("kyc_step_complete", {
  variant, step: "identity_doc", country,
  timeOnStep: Date.now() - stepStart,
});

// 4. ANALYSIS (in ClickhouseDB / analytics backend):
// SELECT
//   variant,
//   COUNT(DISTINCT user_id) as started,
//   COUNT(DISTINCT IF(event = 'kyc_verified', user_id, null)) as verified,
//   verified / started * 100 AS conversion_rate
// FROM kyc_events
// WHERE experiment = 'kyc-progressive-v2'
// AND timestamp >= now() - INTERVAL 7 DAY
// GROUP BY variant

// RESULT:
// variant A: 12.4% conversion (baseline)
// variant B: 19.8% conversion (+59.7% relative)
// p < 0.001 — statistically significant
// Decision: roll out variant B to 100% of users`} />
        </div>
      )}

      {/* ── DESKTOP ── */}
      {activeTab === "desktop" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Webview Pool */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              ELECTRON WEBVIEW POOL — 30% loading speed improvement
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10 }}>Pre-loaded pool (ready to use immediately):</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {poolItems.map(item => (
                  <div key={item} style={{ flex: 1, background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 8, padding: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 14, marginBottom: 3 }}>{item === "Home" ? "🏠" : item === "Wallet" ? "💳" : "📋"}</div>
                    <div style={{ fontSize: 8, color: "#22c55e" }}>{item}</div>
                    <div style={{ fontSize: 7, color: "#475569" }}>pre-loaded</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => simulateLoad("cold")} disabled={poolLoading !== "idle"} style={{ flex: 1, background: poolLoading === "cold" ? "#334155" : "#ef444420", border: "1px solid #ef4444", borderRadius: 8, padding: "8px 10px", color: "#fca5a5", cursor: "pointer", fontSize: 10 }}>
                  ❄ Cold Load
                </button>
                <button onClick={() => simulateLoad("pool")} disabled={poolLoading !== "idle"} style={{ flex: 1, background: poolLoading === "pool" ? "#334155" : "#22c55e20", border: "1px solid #22c55e", borderRadius: 8, padding: "8px 10px", color: "#4ade80", cursor: "pointer", fontSize: 10 }}>
                  ♻ Pool Load
                </button>
              </div>
              {(poolLoading !== "idle" || loadTime !== null) && (
                <div style={{ marginTop: 8, background: "#0f172a", borderRadius: 8, padding: 10, textAlign: "center" }}>
                  {poolLoading !== "idle" ? (
                    <div style={{ fontSize: 10, color: "#64748b" }}>Loading webview…</div>
                  ) : loadTime !== null ? (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 900, color: loadTime > 2000 ? "#ef4444" : "#22c55e" }}>{loadTime}ms</div>
                      <div style={{ fontSize: 9, color: "#64748b" }}>{loadTime > 2000 ? "Cold start — no pool" : "Pool hit — 30% faster"}</div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
            <CodeBlock label="Webview Pool — Electron pre-loading architecture" color="#f59e0b" code={
`// PROBLEM:
// Electron BrowserWindow with webview: cold start = 2-3 seconds.
// User opens Wallet tab → 2.3s wait. Bad UX.
//
// SOLUTION: Webview Pool
// Pre-load the N most-accessed webviews in the background.
// When user navigates to one: swap from hidden → visible (instant).

class WebviewPool {
  private pool: Map<string, Electron.WebContentsView> = new Map();
  private readonly preloadUrls = ["home", "wallet", "history"];

  async initialize() {
    // Pre-load top N micro-apps at app startup
    await Promise.all(
      this.preloadUrls.map(id => this.preload(id))
    );
  }

  private async preload(appId: string) {
    const view = new WebContentsView();
    view.webContents.loadURL(\`app://\${appId}\`);
    view.setBounds({ x: -9999, y: -9999, width: 1, height: 1 }); // hidden
    await view.webContents.once("did-finish-load");
    this.pool.set(appId, view);
  }

  getView(appId: string): WebContentsView {
    if (this.pool.has(appId)) {
      const view = this.pool.get(appId)!;
      this.pool.delete(appId);
      // Refill pool asynchronously
      this.preload(appId);
      return view; // ready immediately
    }
    // Fallback: cold load
    const view = new WebContentsView();
    view.webContents.loadURL(\`app://\${appId}\`);
    return view; // user waits for load
  }
}

// Result: pool hit → ~1.6s. Cold start → ~2.3s. (-30%)`} />
          </div>

          {/* RTL + CVD */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              RTL LAYOUT (ARABIC) + CVD ACCESSIBILITY
            </div>

            {/* RTL toggle */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700 }}>RTL Layout — Arabic Support</div>
                <button onClick={() => setRtl(r => !r)} style={{ background: rtl ? "#6366f1" : "#334155", border: "none", borderRadius: 20, padding: "4px 14px", color: "#fff", cursor: "pointer", fontSize: 10 }}>
                  {rtl ? "🇸🇦 RTL" : "🇺🇸 LTR"}
                </button>
              </div>
              {/* Mock app UI that flips */}
              <div dir={rtl ? "rtl" : "ltr"} style={{ background: "#0f172a", borderRadius: 8, padding: 10, transition: "all 0.3s" }}>
                {/* Nav */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>🏦</div>
                    <div style={{ fontSize: 10, fontWeight: 700 }}>{rtl ? "محفظتي" : "My Wallet"}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>👤 {rtl ? "حساب" : "Account"}</div>
                </div>
                {/* Balance card */}
                <div style={{ background: "#1e293b", borderRadius: 8, padding: 10, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 8, color: "#64748b" }}>{rtl ? "الرصيد الإجمالي" : "Total Balance"}</div>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>$2,840.00</div>
                  </div>
                  <div style={{ fontSize: 18 }}>💰</div>
                </div>
                {/* Action buttons */}
                <div style={{ display: "flex", gap: 6 }}>
                  {[rtl ? "إرسال" : "Send", rtl ? "استقبال" : "Receive", rtl ? "تبادل" : "Swap"].map(a => (
                    <div key={a} style={{ flex: 1, background: "#334155", borderRadius: 6, padding: "6px 4px", textAlign: "center", fontSize: 8, color: "#94a3b8" }}>{a}</div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 8, color: "#475569", marginTop: 6 }}>
                {rtl ? "✓ dir=rtl applied · CSS logical properties · icons mirrored" : "LTR (default) — toggle to see Arabic layout"}
              </div>
            </div>

            {/* CVD modes */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 8 }}>CVD Color Schemes — Accessibility</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                {(["normal", "deuteranopia", "protanopia", "monochrome"] as const).map(mode => (
                  <button key={mode} onClick={() => setCvdMode(mode)} style={{ background: cvdMode === mode ? "#1e3a5f" : "#0f172a", border: `1px solid ${cvdMode === mode ? "#3b82f6" : "#334155"}`, borderRadius: 6, padding: "4px 10px", color: cvdMode === mode ? "#60a5fa" : "#64748b", cursor: "pointer", fontSize: 9 }}>
                    {mode === "normal" ? "🟢 Normal" : mode === "deuteranopia" ? "🟡 Deuteranopia" : mode === "protanopia" ? "🔵 Protanopia" : "⚪ Monochrome"}
                  </button>
                ))}
              </div>
              {/* Color preview */}
              <div style={{ filter: cvdFilter[cvdMode], transition: "filter 0.3s", background: "#0f172a", borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 8, color: "#64748b", marginBottom: 6 }}>Status indicators preview:</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {[{ c: "#22c55e", l: "Verified" }, { c: "#f59e0b", l: "Pending" }, { c: "#ef4444", l: "Rejected" }, { c: "#3b82f6", l: "In Progress" }].map(s => (
                    <div key={s.l} style={{ flex: 1, background: s.c + "20", border: `1px solid ${s.c}40`, borderRadius: 6, padding: "5px 4px", textAlign: "center" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.c, margin: "0 auto 3px" }} />
                      <div style={{ fontSize: 7, color: s.c }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 8, color: "#475569", fontStyle: "italic" }}>
                  {cvdMode !== "normal" ? `${cvdMode} simulation — colors adjusted for accessibility` : "Normal color vision"}
                </div>
              </div>
              <CodeBlock label="CVD implementation — CSS custom properties + color theme switching" color="#a855f7" code={
`// CVD (Color Vision Deficiency) color schemes.
// Users select their vision type in settings.
// All UI colors come from CSS custom properties.
// Switching theme = swapping the property values.

:root[data-cvd="normal"] {
  --color-success: #22c55e;  /* green */
  --color-warning: #f59e0b;  /* amber */
  --color-error:   #ef4444;  /* red   */
}

:root[data-cvd="deuteranopia"] {
  /* Deuteranopia: can't distinguish red/green.
     Replace with blue/orange contrast pair.   */
  --color-success: #0ea5e9;  /* blue   */
  --color-warning: #f97316;  /* orange */
  --color-error:   #7c3aed;  /* violet */
}

:root[data-cvd="protanopia"] {
  /* Protanopia: weak red sensitivity.
     Use cyan/gold contrast pair.              */
  --color-success: #06b6d4;  /* cyan */
  --color-warning: #eab308;  /* gold */
  --color-error:   #8b5cf6;  /* purple */
}

// React: persist user preference + apply on load
const useCVDTheme = () => {
  const [cvd, setCVD] = useState(() =>
    localStorage.getItem("cvd-mode") ?? "normal"
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-cvd", cvd);
    localStorage.setItem("cvd-mode", cvd);
  }, [cvd]);
  return { cvd, setCVD };
};`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default B2CKYCDemo;
