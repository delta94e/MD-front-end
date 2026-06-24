/**
 * BinanceDemo.tsx
 *
 * Binance Pay + KYB — Frontend Engineer
 *
 * 1. BINANCE PAY — Red Packet Campaign (800K MAU), Send Cash Revamp
 *    (conversion 12%→15%, P2P 74.3%→79.8%, TripleA 76.1%→87.3%, DAU +31.6%)
 *    Web, Checkout Widget, Mini Program, Merchant Portal.
 *
 * 2. KYB (Know Your Business) — Client + Admin portals, AI-powered features,
 *    document extraction, risk scoring, workflow automation.
 *
 * 3. TECH ARCHITECTURE — Micro-Frontend, Mini Program constraints,
 *    Zustand state management, React Query order polling.
 *
 * TABS
 *   💸 Binance Pay   — Red Packet simulation + Send Cash conversion funnel
 *   🤝 KYB & AI      — Business verification flow + AI document extraction
 *   ⚙ Architecture   — Micro-FE, Mini Program, Zustand, React Query
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Send Cash metrics
// ─────────────────────────────────────────────────────────────────

const METRICS = [
  { label: "Order Submission Conversion", before: 12, after: 15,  delta: "+25%",   color: "#f59e0b" },
  { label: "P2P Order Success Rate",      before: 74.3, after: 79.8, delta: "+7.4%",  color: "#22c55e" },
  { label: "TripleA Order Success Rate",  before: 76.1, after: 87.3, delta: "+14.7%", color: "#0ea5e9" },
  { label: "Daily Active Users",          before: 2246, after: 2956, delta: "+31.6%", color: "#a855f7", raw: true },
];

const IMPROVEMENTS = [
  { icon: "⚡", title: "Reduced Friction",    desc: "Eliminated redundant form fields. Fewer steps from intent to submitted order." },
  { icon: "🧭", title: "Smart Routing",       desc: "Dynamic routing engine: checks P2P liquidity first, falls back to TripleA. No failed orders due to zero liquidity." },
  { icon: "💬", title: "Error UX Overhaul",  desc: "Actionable error messages instead of generic codes. Users understand what to fix. Retry rate improved significantly." },
  { icon: "⚡", title: "Optimistic UI",       desc: "Order appears confirmed while backend processes. Perceived wait time reduced from 3s to <1s." },
];

// ─────────────────────────────────────────────────────────────────
// KYB data
// ─────────────────────────────────────────────────────────────────

type KYBStep = { id: string; label: string; icon: string; status: "completed" | "active" | "pending" };

const KYB_STEPS: KYBStep[] = [
  { id: "business",   label: "Business Information",   icon: "🏢", status: "completed" },
  { id: "docs",       label: "Document Upload",         icon: "📄", status: "active"    },
  { id: "directors",  label: "Director Verification",   icon: "👥", status: "pending"   },
  { id: "ownership",  label: "Ownership Structure",     icon: "🌳", status: "pending"   },
  { id: "review",     label: "Compliance Review",       icon: "✅", status: "pending"   },
];

const AI_FIELDS = [
  { key: "company",    label: "Company Name",        value: "Acme Technologies Pte. Ltd." },
  { key: "reg",        label: "Registration No.",    value: "BRN-2019-0042187" },
  { key: "country",    label: "Incorporation",       value: "Singapore" },
  { key: "industry",   label: "Industry",            value: "Software / Fintech" },
  { key: "directors",  label: "Directors",           value: "John Doe, Sarah Chen" },
  { key: "capital",    label: "Paid-up Capital",     value: "SGD 500,000" },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 260 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function BinanceDemo() {
  const [activeTab, setActiveTab] = useState<"pay" | "kyb" | "arch">("pay");

  // Red Packet state
  const [packetOpen, setPacketOpen] = useState(false);
  const [claimedAmount] = useState(() => (Math.random() * 9 + 0.5).toFixed(2));
  const [shared, setShared] = useState(false);
  const [shareCount, setShareCount] = useState(3_142_891);

  const openPacket = () => {
    if (!packetOpen) { setPacketOpen(true); setShareCount(c => c + 1); }
  };

  // Funnel state
  const [showAfter, setShowAfter] = useState(false);

  // KYB AI state
  const [aiRunning, setAiRunning] = useState(false);
  const [aiFields, setAiFields] = useState<string[]>([]);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [docUploaded, setDocUploaded] = useState(false);

  const runAI = useCallback(async () => {
    if (!docUploaded || aiRunning) return;
    setAiRunning(true);
    setAiFields([]);
    setRiskScore(null);
    for (let i = 0; i < AI_FIELDS.length; i++) {
      await new Promise(r => setTimeout(r, 300));
      setAiFields(prev => [...prev, AI_FIELDS[i].key]);
    }
    await new Promise(r => setTimeout(r, 400));
    setRiskScore(87);
    setAiRunning(false);
  }, [docUploaded, aiRunning]);

  const TABS = [
    { id: "pay"  as const, label: "💸 Binance Pay"  },
    { id: "kyb"  as const, label: "🤝 KYB & AI"     },
    { id: "arch" as const, label: "⚙ Architecture"  },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #f0b90b, #d4a10a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#000" }}>₿</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Binance Pay + KYB</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              800K MAU Red Packet · Send Cash +31.6% DAU · KYB AI · Micro-Frontend · Mini Program
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Binance Pay", "Red Packet 800K MAU", "Send Cash Revamp", "KYB AI Features", "KYC Bifinity", "Micro-Frontend", "Mini Program", "Zustand", "React Query", "ReactJS", "Next.js", "TypeScript", "VueJS"].map(t => (
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

      {/* ── BINANCE PAY ── */}
      {activeTab === "pay" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Red Packet */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              🧧 SHARE RED PACKET CAMPAIGN — MARCH 2023
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
              {[
                { v: "800K", l: "Monthly Active Users", c: "#f0b90b" },
                { v: "100K+", l: "New Users / Month",   c: "#22c55e" },
                { v: shareCount.toLocaleString(), l: "Red Packets Shared", c: "#a855f7" },
              ].map(m => (
                <div key={m.l} style={{ background: "#1e293b", border: `1px solid ${m.c}20`, borderRadius: 8, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: m.c }}>{m.v}</div>
                  <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>{m.l}</div>
                </div>
              ))}
            </div>

            {/* Red Packet interactive */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <div style={{ position: "relative", cursor: packetOpen ? "default" : "pointer" }} onClick={openPacket}>
                {/* Envelope body */}
                <div style={{
                  width: 140, height: 190, borderRadius: 12,
                  background: packetOpen
                    ? "linear-gradient(135deg,#991b1b,#7f1d1d)"
                    : "linear-gradient(135deg,#ef4444,#b91c1c)",
                  boxShadow: packetOpen ? "0 0 24px #f0b90b40" : "0 8px 32px #ef444440",
                  transition: "all 0.4s",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
                  padding: "0 0 16px 0",
                  position: "relative", overflow: "hidden",
                }}>
                  {/* Gold circle top */}
                  <div style={{
                    position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
                    width: 60, height: 60, borderRadius: "50%",
                    background: "linear-gradient(135deg, #f0b90b, #d4a10a)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, fontWeight: 900, color: "#000",
                    transition: "all 0.4s",
                    opacity: packetOpen ? 0 : 1,
                  }}>₿</div>

                  {/* Opened content */}
                  {packetOpen && (
                    <div style={{ textAlign: "center", padding: "0 12px" }}>
                      <div style={{ fontSize: 10, color: "#fca5a5", marginBottom: 4 }}>You received</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: "#f0b90b" }}>{claimedAmount}</div>
                      <div style={{ fontSize: 11, color: "#fca5a5" }}>USDT</div>
                    </div>
                  )}

                  {/* Flap */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0,
                    height: 80,
                    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                    borderRadius: "12px 12px 40% 40%",
                    borderBottom: "2px solid #f0b90b30",
                    transformOrigin: "top center",
                    transform: packetOpen ? "rotateX(180deg)" : "rotateX(0deg)",
                    transition: "transform 0.5s",
                  }} />

                  {!packetOpen && (
                    <div style={{ fontSize: 9, color: "#fca5a5", marginBottom: 2 }}>点击开红包</div>
                  )}
                  <div style={{ fontSize: 8, color: "#fca5a520" }}>Tap to open</div>
                </div>
              </div>
            </div>

            {packetOpen && !shared && (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setShared(true)} style={{ flex: 1, background: "#f0b90b", border: "none", borderRadius: 8, padding: "10px 16px", color: "#000", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                  📤 Share a Red Packet
                </button>
              </div>
            )}
            {shared && (
              <div style={{ background: "#f0b90b15", border: "1px solid #f0b90b40", borderRadius: 8, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#f0b90b", marginBottom: 3 }}>🔗 Share link generated</div>
                <div style={{ fontSize: 8, fontFamily: "monospace", color: "#64748b" }}>pay.binance.com/redpacket/abc123</div>
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              <CodeBlock label="Red Packet — viral growth mechanic + sharing architecture" color="#f0b90b" code={
`// Red Packet campaign: viral acquisition loop.
// User receives a red packet → opens it → gets crypto → shares one back.
// Each share creates a new acquisition touchpoint.
//
// SHARING FLOW:
// 1. User selects amount (USDT) and number of packets (N random splits).
// 2. Frontend creates red packet: POST /api/pay/red-packet/create
//    { total: 10, count: 5, currency: "USDT", expiresIn: "24h" }
// 3. Server returns: packetId, shareUrl (pay.binance.com/redpacket/{id})
// 4. User shares the URL (copy, social share, QR code).
//
// CLAIMING FLOW:
// 1. Recipient opens the URL (web or deep link into Binance app).
// 2. If not logged in: soft KYC then claim (drives new user acquisition).
// 3. Claim: POST /api/pay/red-packet/{id}/claim
//    Server uses randomized split: remaining_amount / remaining_count.
//    Atomic deduction (Redis + DB transaction).
// 4. Amount credited to wallet. User sees receipt.
//
// WHY THIS DROVE 100K+ NEW USERS/MONTH:
// The share URL is the acquisition hook.
// Non-Binance users who receive the link must register to claim.
// Claimable value ($) overcomes registration friction.
// The campaign ran during Chinese New Year context (red packet culture).`} />
            </div>
          </div>

          {/* Send Cash Revamp */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>
                💸 SEND CASH REVAMP — NOV 2023
              </div>
              <button onClick={() => setShowAfter(v => !v)} style={{ background: showAfter ? "#22c55e20" : "#1e293b", border: `1px solid ${showAfter ? "#22c55e" : "#334155"}`, borderRadius: 6, padding: "4px 12px", color: showAfter ? "#4ade80" : "#64748b", cursor: "pointer", fontSize: 9 }}>
                {showAfter ? "✓ Showing After" : "Show Before/After"}
              </button>
            </div>

            {/* Metric bars */}
            {METRICS.map(m => {
              const maxVal = m.raw ? 4000 : 100;
              const beforePct = (m.before / maxVal) * 100;
              const afterPct  = (m.after  / maxVal) * 100;
              return (
                <div key={m.label} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: m.color }}>{m.delta}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <div style={{ width: 32, fontSize: 8, color: "#475569" }}>Before</div>
                      <div style={{ flex: 1, background: "#0f172a", borderRadius: 3, height: 10, overflow: "hidden" }}>
                        <div style={{ background: "#475569", height: "100%", width: `${beforePct}%`, borderRadius: 3, transition: "width 0.5s" }} />
                      </div>
                      <div style={{ fontSize: 9, color: "#64748b", width: 42 }}>{m.raw ? m.before.toLocaleString() : `${m.before}%`}</div>
                    </div>
                    {showAfter && (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <div style={{ width: 32, fontSize: 8, color: m.color }}>After</div>
                        <div style={{ flex: 1, background: "#0f172a", borderRadius: 3, height: 10, overflow: "hidden" }}>
                          <div style={{ background: m.color, height: "100%", width: `${afterPct}%`, borderRadius: 3, transition: "width 0.8s" }} />
                        </div>
                        <div style={{ fontSize: 9, color: m.color, fontWeight: 700, width: 42 }}>{m.raw ? m.after.toLocaleString() : `${m.after}%`}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* What changed */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 6, letterSpacing: "0.08em" }}>WHY CONVERSION IMPROVED</div>
              {IMPROVEMENTS.map(imp => (
                <div key={imp.title} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{imp.icon}</span>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700 }}>{imp.title}</div>
                    <div style={{ fontSize: 8, color: "#64748b" }}>{imp.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── KYB & AI ── */}
      {activeTab === "kyb" && (
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: 14 }}>
          {/* KYB flow steps */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              KYB FLOW
            </div>
            {KYB_STEPS.map((step, i) => {
              const sc = step.status === "completed" ? "#22c55e" : step.status === "active" ? "#f0b90b" : "#334155";
              return (
                <div key={step.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: sc + "20", border: `2px solid ${sc}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                      {step.status === "completed" ? "✓" : step.icon}
                    </div>
                    {i < KYB_STEPS.length - 1 && <div style={{ width: 2, height: 20, background: i < KYB_STEPS.findIndex(s => s.status === "active") ? "#22c55e" : "#334155", marginTop: 2 }} />}
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ fontSize: 9, fontWeight: step.status === "active" ? 700 : 400, color: sc }}>{step.label}</div>
                    <div style={{ fontSize: 7, color: "#475569" }}>{step.status}</div>
                  </div>
                </div>
              );
            })}
            <CodeBlock label="KYB — cross-portal architecture" color="#f0b90b" code={
`// CLIENT PORTAL (Next.js):
// Business submits KYB application.
// Multi-step form wizard.
// Document upload (OCR pre-fill).
// Director/UBO declaration.
// Status tracking with webhooks.

// ADMIN PORTAL (React + Zustand):
// Compliance officer reviews submissions.
// AI risk score + suggestions.
// Manual override + approval/rejection.
// Audit log for regulatory compliance.

// DATA FLOW:
// Client Portal → KYB API → Review Queue
//   → AI Pipeline (extract, score, screen)
//   → Admin Portal (human review)
//   → Decision → Client Portal webhook`} />
          </div>

          {/* AI Document Extraction */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              AI DOCUMENT EXTRACTION
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              {!docUploaded ? (
                <div>
                  <div style={{ border: "2px dashed #334155", borderRadius: 8, padding: 24, textAlign: "center", cursor: "pointer", marginBottom: 10 }} onClick={() => setDocUploaded(true)}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Click to "upload" Business Registration Certificate</div>
                    <div style={{ fontSize: 8, color: "#475569", marginTop: 3 }}>PDF, JPG, PNG · Max 10MB</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#0f172a", borderRadius: 6, padding: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 600 }}>ACME_BizReg_2024.pdf</div>
                      <div style={{ fontSize: 7, color: "#64748b" }}>2.4 MB · Uploaded</div>
                    </div>
                    <span style={{ fontSize: 14, color: "#22c55e" }}>✓</span>
                  </div>
                  <button onClick={runAI} disabled={aiRunning || aiFields.length > 0} style={{ width: "100%", background: aiRunning ? "#334155" : "#f0b90b20", border: `1px solid ${aiRunning ? "#334155" : "#f0b90b"}`, borderRadius: 8, padding: "8px 12px", color: aiRunning ? "#64748b" : "#f0b90b", cursor: aiRunning || aiFields.length > 0 ? "not-allowed" : "pointer", fontSize: 10, fontWeight: 700 }}>
                    {aiRunning ? "🤖 Analyzing document..." : aiFields.length > 0 ? "✓ Analysis complete" : "🤖 Extract with AI"}
                  </button>
                </div>
              )}
            </div>

            {/* Extracted fields */}
            {aiFields.length > 0 && (
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 8 }}>Extracted fields (auto-populated in form)</div>
                {AI_FIELDS.map(f => (
                  <div key={f.key} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid #0f172a", opacity: aiFields.includes(f.key) ? 1 : 0.2, transition: "opacity 0.3s" }}>
                    <div style={{ width: 90, fontSize: 8, color: "#475569", flexShrink: 0 }}>{f.label}</div>
                    <div style={{ fontSize: 9, color: aiFields.includes(f.key) ? "#f1f5f9" : "#334155", fontWeight: 600 }}>{f.value}</div>
                    {aiFields.includes(f.key) && <span style={{ fontSize: 9, color: "#22c55e", marginLeft: "auto" }}>✓</span>}
                  </div>
                ))}
              </div>
            )}

            {riskScore !== null && (
              <div style={{ background: "#22c55e15", border: "1px solid #22c55e30", borderRadius: 8, padding: 10, display: "flex", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>AI Risk Score</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e" }}>{riskScore}/100</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ background: "#0f172a", borderRadius: 4, height: 10, overflow: "hidden" }}>
                    <div style={{ background: "#22c55e", height: "100%", width: `${riskScore}%`, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 8, color: "#22c55e", marginTop: 3 }}>LOW RISK · Recommendation: AUTO-APPROVE</div>
                </div>
              </div>
            )}
          </div>

          {/* Admin portal + KYC Bifinity */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              ADMIN REVIEW PORTAL
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              {[
                { name: "TechVentures Sdn Bhd", country: "MY", score: 91, action: "AUTO-APPROVE",  color: "#22c55e" },
                { name: "Global Trade Co. LLC",  country: "AE", score: 62, action: "MANUAL REVIEW", color: "#f59e0b" },
                { name: "CryptoExch GmbH",       country: "DE", score: 44, action: "NEEDS DOCS",    color: "#ef4444" },
              ].map(b => (
                <div key={b.name} style={{ background: "#0f172a", borderRadius: 8, padding: 10, marginBottom: 6, display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700 }}>{b.name}</div>
                    <div style={{ fontSize: 7, color: "#475569" }}>{b.country} · KYB submission</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: b.color }}>{b.score}</div>
                    <div style={{ fontSize: 7, color: b.color }}>{b.action}</div>
                  </div>
                </div>
              ))}
            </div>
            <CodeBlock label="AI-powered KYB features — internal workflow + user experience" color="#a855f7" code={
`// AI FEATURES IN KYB:

// 1. OCR DOCUMENT EXTRACTION:
// Upload ACRA/Companies House/SEC registration cert.
// AI pipeline: detect document type → extract fields.
// Fields pre-populate the form. User reviews, not re-types.
// Error reduction in manual data entry.

// 2. RISK SCORING MODEL:
// ML model trained on: industry vertical, country,
// directors' PEP/sanctions status, business age,
// transaction volume vs declared revenue, etc.
// Score: 0-100. < 50: MANUAL REVIEW. > 80: AUTO-APPROVE.
// Compliance team only manually reviews borderline cases.
// Throughput: 3× more applications reviewed per day.

// 3. AML SANCTIONS SCREENING:
// Director names → check against OFAC, EU, UN sanctions lists.
// Real-time API (Dow Jones, ComplyAdvantage).
// Match found → flag for compliance officer.
// AI reduces false positives: fuzzy name matching
// with country/DOB/nationality context.

// 4. DUPLICATE DETECTION:
// Company registration number hashed → check against
// existing approved/rejected applications.
// Prevents same entity applying under different names.

// 5. AUTO-REVIEW SUGGESTIONS:
// Compliance officer opens case → sees AI recommendation:
// "Approve: risk score 91, all docs verified, no sanctions."
// Officer can approve with one click + audit trail.`} />
          </div>
        </div>
      )}

      {/* ── ARCHITECTURE ── */}
      {activeTab === "arch" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              MICRO-FRONTEND ARCHITECTURE
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 10 }}>Binance Pay product surfaces — each a separate MFE</div>
              {[
                { name: "Shell App (Next.js)",       desc: "Routing, auth, global nav",       color: "#f0b90b", level: 0 },
                { name: "Pay Web (React)",            desc: "Core payment flows, Send Cash",    color: "#22c55e", level: 1 },
                { name: "Checkout Widget (React)",    desc: "Embeddable iframe for merchants", color: "#22c55e", level: 1 },
                { name: "Mini Program (custom)",      desc: "Binance app embedded surface",    color: "#0ea5e9", level: 1 },
                { name: "Merchant Portal (Vue)",      desc: "Merchant settings, analytics",    color: "#a855f7", level: 1 },
                { name: "KYB Client (Next.js)",       desc: "Business verification wizard",    color: "#f59e0b", level: 1 },
                { name: "KYB Admin (React+Zustand)", desc: "Compliance review portal",        color: "#ef4444", level: 1 },
              ].map(item => (
                <div key={item.name} style={{ display: "flex", gap: 8, marginBottom: 5, paddingLeft: item.level * 16 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: item.color }}>{item.name}</div>
                    <div style={{ fontSize: 8, color: "#475569" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <CodeBlock label="Mini Program — constraints vs web development" color="#0ea5e9" code={
`// MINI PROGRAM: a lightweight app running inside Binance's native app.
// NOT a standard browser. Custom JavaScript runtime.
// Constraints matter for engineering decisions:

// 1. NO DOM:
//    React cannot render to the DOM (there is none).
//    Mini Program has its own rendering layer.
//    Use the Mini Program's framework-specific component syntax.
//    <view>, <text>, <button> instead of <div>, <p>, <button>.

// 2. LIMITED APIS:
//    No localStorage. Use: wx.setStorageSync() equivalent.
//    No fetch(). Use: tt.request() (platform HTTP).
//    No window, document, history.
//    Location: tt.getLocation() (requires permission).

// 3. PACKAGE SIZE LIMIT:
//    Main package: 2MB max. Sub-packages: 2MB each.
//    Aggressive: no lodash (use native). No moment (use dayjs).
//    Tree-shaking is mandatory, not optional.
//    Every dependency requires justification.

// 4. PERFORMANCE PROFILE:
//    JavaScript thread ≠ render thread (like React Native).
//    Heavy JS computation blocks the JS thread but not rendering.
//    Communication between threads: setData() (like Bridge in RN).
//    Minimize setData() calls. Batch updates. Diff before sending.

// 5. REVIEW PROCESS:
//    Each Mini Program update goes through Binance's internal review.
//    Hot-fix is not "deploy and done." Deploy + submit + review + approved.
//    Extra engineering care: get it right the first time.`} />
          </div>

          <div>
            <CodeBlock label="Zustand — payment state management (vs Redux)" color="#22c55e" code={
`// WHY ZUSTAND OVER REDUX FOR BINANCE PAY:
//
// Redux requires: action creators, reducers, dispatch, selectors.
// Zustand: define state + actions in one place. Use anywhere.
//
// Payment flow state:

import { create } from "zustand";

interface PaymentStore {
  // State
  amount: number;
  currency: "USDT" | "BNB" | "ETH" | "BTC";
  method: "P2P" | "TripleA" | "Card";
  orderId: string | null;
  orderStatus: "idle" | "submitting" | "polling" | "success" | "failed";
  errorCode: string | null;

  // Actions (defined alongside state — no separate action files)
  setAmount: (amount: number) => void;
  setCurrency: (currency: string) => void;
  setMethod: (method: PaymentMethod) => void;
  submitOrder: () => Promise<void>;
  reset: () => void;
}

const usePaymentStore = create<PaymentStore>((set, get) => ({
  amount: 0,
  currency: "USDT",
  method: "P2P",
  orderId: null,
  orderStatus: "idle",
  errorCode: null,

  setAmount: (amount) => set({ amount }),
  setCurrency: (currency) => set({ currency }),
  setMethod: (method) => set({ method }),

  submitOrder: async () => {
    const { amount, currency, method } = get();
    set({ orderStatus: "submitting" });
    try {
      const order = await payAPI.createOrder({ amount, currency, method });
      set({ orderId: order.id, orderStatus: "polling" });
      // React Query picks up from here with order ID
    } catch (err) {
      set({ orderStatus: "failed", errorCode: err.code });
    }
  },

  reset: () => set({ amount: 0, orderId: null, orderStatus: "idle", errorCode: null }),
}));

// Usage in component — NO connect, NO mapStateToProps, NO dispatch
const amount = usePaymentStore(s => s.amount);
const submitOrder = usePaymentStore(s => s.submitOrder);`} />

            <div style={{ marginTop: 10 }}>
              <CodeBlock label="React Query — order status polling for payment flow" color="#f0b90b" code={
`// WHY REACT QUERY FOR ORDER POLLING:
// After submitting an order: the backend processes asynchronously.
// P2P order: wait for a peer to match and accept (seconds to minutes).
// TripleA: external processor, webhook callback.
//
// Polling with React Query:

const useOrderStatus = (orderId: string | null) => {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => payAPI.getOrderStatus(orderId!),

    enabled: !!orderId,  // only run when we have an orderId

    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll every 2 seconds while pending, stop when terminal
      if (status === "PENDING" || status === "PROCESSING") return 2000;
      return false; // stop polling on success/failed/expired
    },

    staleTime: 0,  // payment status must ALWAYS be fresh

    // Deduplicate: if user has two components showing status,
    // React Query makes ONE request and shares the result.
    // Without React Query: two polling intervals, two requests, race condition.
  });
};

// In the component:
const { orderId } = usePaymentStore();
const { data: order } = useOrderStatus(orderId);

useEffect(() => {
  if (order?.status === "SUCCESS") {
    // Stop polling (already handled by refetchInterval returning false)
    // Show success UI
    analytics.track("payment_success", { orderId, method: order.method });
  }
  if (order?.status === "FAILED") {
    // Show error with actionable message
    usePaymentStore.getState().setError(order.failureCode);
  }
}, [order?.status]);

// REACTION: when orderId changes (new order submitted):
// React Query automatically starts a new polling subscription.
// No manual cleanup of setInterval needed.
// Handles: network failures, retries, cache invalidation automatically.`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BinanceDemo;
