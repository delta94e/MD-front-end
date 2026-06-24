/**
 * SlackEnterpriseAdminDemo.tsx
 *
 * Front-End Engineer — Slack Enterprise Pillar
 * Security & Compliance | Enterprise Admin Dashboard Re-architecture
 *
 * TABS
 *   🔐 Security & Compliance  — EKM key rotation, Information Barriers, Legal Holds, MDM, SSO
 *   📋 Audit Logs             — Live filterable audit log viewer, SIEM export
 *   🏗️ Re-Architecture        — Strangler-fig migration, TypeScript, Redux/RTK patterns
 *   📊 Enterprise Dashboard   — Policy management, org health metrics, compliance posture
 */

import React, { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Design tokens — Slack Enterprise (dark, professional)
// ─────────────────────────────────────────────────────────────────
const E = {
  bg:          "#0a0e13",
  surface:     "#111827",
  surface2:    "#1a2234",
  surface3:    "#1e293b",
  border:      "#1e2d3d",
  purple:      "#4A154B",
  purpleLight: "#7c3aed",
  blue:        "#1264A3",
  blueLight:   "#3b82f6",
  green:       "#059669",
  greenLight:  "#10b981",
  yellow:      "#d97706",
  yellowLight: "#f59e0b",
  red:         "#dc2626",
  redLight:    "#ef4444",
  text:        "#e2e8f0",
  textMuted:   "#64748b",
  textBright:  "#f8fafc",
  mono:        "'JetBrains Mono', 'Fira Code', monospace",
};

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type KeyStatus = "active" | "rotating" | "revoked" | "pending";

interface EncryptionKey {
  id:          string;
  alias:       string;
  arn:         string;
  status:      KeyStatus;
  createdAt:   string;
  rotatedAt?:  string;
  keyId:       string;
}

interface IBSegment {
  id:     string;
  name:   string;
  color:  string;
  users:  number;
  groups: string[];
}

interface IBPolicy {
  id:          string;
  name:        string;
  segmentA:    string;
  segmentB:    string;
  direction:   "bidirectional" | "one-way";
  status:      "active" | "pending" | "draft";
}

interface LegalHold {
  id:          string;
  name:        string;
  custodians:  number;
  channels:    number;
  status:      "active" | "released" | "pending";
  createdAt:   string;
  preservedGB: number;
}

interface AuditEvent {
  id:        string;
  timestamp: string;
  actor:     string;
  action:    string;
  entity:    string;
  ip:        string;
  category:  "auth" | "data" | "admin" | "security" | "compliance";
  severity:  "info" | "warning" | "critical";
}

// ─────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────

const INIT_KEYS: EncryptionKey[] = [
  { id: "k1", alias: "slack/ekm/prod-primary",   arn: "arn:aws:kms:us-east-1:123456:key/mrk-a1b2", status: "active",  createdAt: "2024-01-15", rotatedAt: "2024-06-01", keyId: "mrk-a1b2c3d4" },
  { id: "k2", alias: "slack/ekm/prod-secondary", arn: "arn:aws:kms:us-west-2:123456:key/mrk-e5f6", status: "active",  createdAt: "2023-11-20", rotatedAt: "2024-05-15", keyId: "mrk-e5f6g7h8" },
  { id: "k3", alias: "slack/ekm/dr-standby",     arn: "arn:aws:kms:eu-west-1:123456:key/mrk-i9j0", status: "pending", createdAt: "2024-06-10",                          keyId: "mrk-i9j0k1l2" },
];

const SEGMENTS: IBSegment[] = [
  { id: "s1", name: "Trading Desk",       color: "#ef4444", users: 148,  groups: ["equities-traders", "fx-traders", "derivatives"] },
  { id: "s2", name: "Research",           color: "#3b82f6", users: 62,   groups: ["equity-research", "macro-research"] },
  { id: "s3", name: "Compliance & Legal", color: "#10b981", users: 34,   groups: ["compliance-officers", "legal-team"] },
  { id: "s4", name: "Investment Banking", color: "#f59e0b", users: 89,   groups: ["ib-coverage", "ib-capital-markets"] },
];

const IB_POLICIES: IBPolicy[] = [
  { id: "p1", name: "Trading ↔ Research wall",    segmentA: "s1", segmentB: "s2", direction: "bidirectional", status: "active"  },
  { id: "p2", name: "Trading → Compliance view",  segmentA: "s1", segmentB: "s3", direction: "one-way",       status: "active"  },
  { id: "p3", name: "IB ↔ Research wall",         segmentA: "s4", segmentB: "s2", direction: "bidirectional", status: "pending" },
];

const HOLDS: LegalHold[] = [
  { id: "h1", name: "SEC Investigation 2024-Q2", custodians: 23, channels: 47, status: "active",   createdAt: "2024-03-10", preservedGB: 284.5 },
  { id: "h2", name: "EEOC Complaint — HR Matter", custodians: 4,  channels: 8,  status: "active",   createdAt: "2024-05-22", preservedGB: 12.1  },
  { id: "h3", name: "M&A Due Diligence 2023",    custodians: 51, channels: 92, status: "released", createdAt: "2023-11-01", preservedGB: 891.0 },
];

const genLog = (i: number): AuditEvent => {
  const events = [
    { action: "user.login",                   entity: "alice@acme.com",    category: "auth" as const,       severity: "info" as const     },
    { action: "ekm.key_rotation_initiated",   entity: "prod-primary",      category: "security" as const,   severity: "warning" as const  },
    { action: "information_barrier.policy_updated", entity: "Trading ↔ Research", category: "compliance" as const, severity: "info" as const },
    { action: "legal_hold.custodian_added",   entity: "SEC-2024-Q2",       category: "compliance" as const, severity: "info" as const     },
    { action: "file_download.blocked",        entity: "Q3-financials.xlsx", category: "security" as const,  severity: "warning" as const  },
    { action: "admin.role_changed",           entity: "bob@acme.com",      category: "admin" as const,      severity: "warning" as const  },
    { action: "sso.saml_assertion_failed",    entity: "Okta",              category: "auth" as const,       severity: "critical" as const },
    { action: "audit_log.exported",           entity: "Splunk-SIEM",       category: "compliance" as const, severity: "info" as const     },
    { action: "mdm.device_compliance_failed", entity: "iPhone-8A3F",       category: "security" as const,   severity: "critical" as const },
    { action: "channel.created",              entity: "#deal-acme-2024",   category: "data" as const,       severity: "info" as const     },
  ];
  const e = events[i % events.length];
  const mins = i * 3;
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return { id: `e${i}`, timestamp: `2024-06-18 ${h}:${m}:00 UTC`, actor: ["alice", "bob", "carol", "dave"][i % 4] + "@acme.com", ip: `10.${(i * 7) % 255}.${(i * 13) % 255}.1`, ...e };
};
const ALL_LOGS: AuditEvent[] = Array.from({ length: 40 }, (_, i) => genLog(i));

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ fontSize: 9, fontWeight: 700, color, background: bg, borderRadius: 4, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>;
}

function Pill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    active:    [E.greenLight, `${E.greenLight}18`],
    pending:   [E.yellowLight, `${E.yellowLight}18`],
    released:  [E.textMuted,   `${E.textMuted}18`],
    rotating:  [E.blueLight,   `${E.blueLight}18`],
    revoked:   [E.redLight,    `${E.redLight}18`],
    draft:     [E.textMuted,   `${E.textMuted}18`],
    info:      [E.blueLight,   `${E.blueLight}18`],
    warning:   [E.yellowLight, `${E.yellowLight}18`],
    critical:  [E.redLight,    `${E.redLight}18`],
  };
  const [c, bg] = map[status] ?? [E.textMuted, `${E.textMuted}18`];
  return <Badge label={status} color={c} bg={bg} />;
}

function CodeSnip({ code, label, color = E.blueLight }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#060a0f", border: `1px solid ${E.border}`, borderRadius: 8, overflow: "hidden" }}>
      {label && <div style={{ padding: "4px 12px", borderBottom: `1px solid ${E.border}`, fontSize: 9, color, fontFamily: E.mono }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 8.5, fontFamily: E.mono, color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 320, whiteSpace: "pre-wrap" }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

export function SlackEnterpriseAdminDemo() {
  const [tab, setTab] = useState<"security" | "audit" | "rearch" | "dashboard">("security");

  // ── Security state ────────────────────────────────────────────
  const [keys, setKeys]               = useState<EncryptionKey[]>(INIT_KEYS);
  const [rotatingId, setRotatingId]   = useState<string | null>(null);
  const [selectedSeg, setSelectedSeg] = useState<string | null>(null);
  const [holdWizard, setHoldWizard]   = useState(false);
  const [newHoldName, setNewHoldName] = useState("");
  const [holdStep, setHoldStep]       = useState(0);
  const [activeSecSection, setActiveSecSection] = useState<"ekm" | "ib" | "holds" | "mdm">("ekm");

  // ── Audit log state ───────────────────────────────────────────
  const [catFilter, setCatFilter]     = useState<string>("all");
  const [sevFilter, setSevFilter]     = useState<string>("all");
  const [searchQ, setSearchQ]         = useState("");
  const [exportModal, setExportModal] = useState(false);
  const [streamLive, setStreamLive]   = useState(false);
  const [liveLog, setLiveLog]         = useState<AuditEvent[]>([]);

  // ── Re-arch state ────────────────────────────────────────────
  const [archView, setArchView]       = useState<"before" | "after" | "migration">("before");
  const [migPct, setMigPct]           = useState(67);

  // Live streaming simulation
  useEffect(() => {
    if (!streamLive) return;
    let i = 100;
    const id = setInterval(() => {
      setLiveLog(l => [genLog(i++), ...l.slice(0, 19)]);
    }, 1200);
    return () => clearInterval(id);
  }, [streamLive]);

  const rotateKey = (id: string) => {
    setRotatingId(id);
    setKeys(ks => ks.map(k => k.id === id ? { ...k, status: "rotating" } : k));
    setTimeout(() => {
      setKeys(ks => ks.map(k => k.id === id ? { ...k, status: "active", rotatedAt: "2024-06-18" } : k));
      setRotatingId(null);
    }, 2800);
  };

  const filteredLogs = (streamLive ? liveLog : ALL_LOGS).filter(l => {
    if (catFilter !== "all" && l.category !== catFilter) return false;
    if (sevFilter !== "all" && l.severity !== sevFilter) return false;
    if (searchQ && !`${l.action}${l.actor}${l.entity}`.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const TABS = [
    { id: "security"  as const, label: "🔐 Security & Compliance" },
    { id: "audit"     as const, label: "📋 Audit Logs"             },
    { id: "rearch"    as const, label: "🏗️ Re-Architecture"         },
    { id: "dashboard" as const, label: "📊 Enterprise Dashboard"    },
  ];

  return (
    <div style={{ background: E.bg, color: E.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #1264A3, #4A154B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏢</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: E.textBright }}>Slack Enterprise Admin — Security & Compliance</h1>
            <p style={{ margin: 0, fontSize: 11, color: E.textMuted }}>EKM · SSO · Information Barriers · Legal Holds · Audit Logs · Blocked File Downloads · MDM · Admin Dashboard Re-architecture</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "Enterprise", l: "Slack's largest customers",     c: E.blueLight,   sub: "Fortune 500 · regulated industries · financial services" },
            { v: "7 Features", l: "Security & compliance",          c: E.greenLight,  sub: "EKM · SSO · IB · Holds · Audit · DLP · MDM"             },
            { v: "FE Lead",    l: "Architecture re-write",          c: E.purpleLight, sub: "Legacy → TypeScript + React + Redux Toolkit"             },
            { v: "Zero-Tol",   l: "Enterprise SLA",                 c: E.yellowLight, sub: "Regressions in compliance tools = legal exposure"        },
          ].map(m => (
            <div key={m.l} style={{ background: E.surface, border: `1px solid ${E.border}`, borderLeft: `3px solid ${m.c}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: E.text }}>{m.l}</div>
              <div style={{ fontSize: 7, color: E.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${E.border}`, paddingBottom: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? E.surface2 : "transparent", color: tab === t.id ? E.textBright : E.textMuted, border: tab === t.id ? `1px solid ${E.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 18px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{t.label}</button>
        ))}
      </div>

      {/* ── SECURITY & COMPLIANCE ── */}
      {tab === "security" && (
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", gap: 14 }}>
          {/* Left nav */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: E.textMuted, marginBottom: 6, letterSpacing: "0.08em" }}>SECURITY FEATURES</div>
            {[
              { id: "ekm",   icon: "🔑", label: "EKM Keys"           },
              { id: "ib",    icon: "🔀", label: "Information Barriers" },
              { id: "holds", icon: "⚖️", label: "Legal Holds"          },
              { id: "mdm",   icon: "📱", label: "MDM & SSO"            },
            ].map(s => (
              <button key={s.id} onClick={() => setActiveSecSection(s.id as any)} style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", textAlign: "left", background: activeSecSection === s.id ? `${E.blueLight}15` : "transparent", border: "none", borderLeft: `3px solid ${activeSecSection === s.id ? E.blueLight : "transparent"}`, padding: "8px 10px", cursor: "pointer", color: activeSecSection === s.id ? E.blueLight : E.textMuted, fontSize: 11, fontWeight: activeSecSection === s.id ? 700 : 400, borderRadius: "0 6px 6px 0", marginBottom: 2 }}>
                <span>{s.icon}</span>{s.label}
              </button>
            ))}

            <div style={{ marginTop: 16, background: E.surface, border: `1px solid ${E.border}`, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: E.textMuted, marginBottom: 6 }}>COMPLIANCE POSTURE</div>
              {[
                { label: "EKM",     ok: true  },
                { label: "SSO",     ok: true  },
                { label: "IB",      ok: true  },
                { label: "Audit",   ok: true  },
                { label: "MDM",     ok: false },
              ].map(c => (
                <div key={c.label} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 9 }}>
                  <span style={{ color: E.textMuted }}>{c.label}</span>
                  <span style={{ color: c.ok ? E.greenLight : E.yellowLight, fontWeight: 700 }}>{c.ok ? "✓" : "⚠"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center panel — feature UI */}
          <div>
            {activeSecSection === "ekm" && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: E.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>🔑 ENTERPRISE KEY MANAGEMENT (EKM)</div>
                <div style={{ background: E.surface, border: `1px solid ${E.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: E.textMuted, marginBottom: 10, lineHeight: 1.6 }}>
                    EKM lets your organisation manage your own encryption keys via AWS KMS. All Slack content is encrypted using your keys. You can rotate, revoke, or monitor key status at any time.
                  </div>
                  {keys.map(k => (
                    <div key={k.id} style={{ background: E.surface2, border: `1px solid ${k.status === "active" ? E.greenLight + "30" : k.status === "rotating" ? E.blueLight + "30" : E.border}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: E.textBright }}>{k.alias}</div>
                          <div style={{ fontSize: 8, fontFamily: E.mono, color: E.textMuted }}>{k.arn}</div>
                        </div>
                        <Pill status={k.status} />
                      </div>
                      <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 8, color: E.textMuted }}>
                        <span>Key ID: <code style={{ fontFamily: E.mono, color: E.text }}>{k.keyId}</code></span>
                        <span>Created: {k.createdAt}</span>
                        {k.rotatedAt && <span>Rotated: {k.rotatedAt}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => rotateKey(k.id)} disabled={k.status !== "active"} style={{ fontSize: 8, background: k.status === "active" ? E.blueLight : E.border, color: "#fff", border: "none", borderRadius: 5, padding: "4px 10px", cursor: k.status === "active" ? "pointer" : "not-allowed", opacity: k.status !== "active" ? 0.5 : 1 }}>
                          {rotatingId === k.id ? "⟳ Rotating…" : "↻ Rotate Key"}
                        </button>
                        <button disabled={k.status === "revoked"} style={{ fontSize: 8, background: "transparent", color: E.redLight, border: `1px solid ${E.redLight}40`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>Revoke</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeSecSection === "ib" && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: E.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>🔀 INFORMATION BARRIERS</div>
                <div style={{ background: E.surface, border: `1px solid ${E.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: E.textMuted, marginBottom: 8, lineHeight: 1.5 }}>Information Barriers prevent communication between defined user segments. Commonly used in financial services to enforce Chinese walls between trading desks and research teams.</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: E.textMuted, marginBottom: 6 }}>SEGMENTS — click to inspect</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {SEGMENTS.map(s => (
                      <div key={s.id} onClick={() => setSelectedSeg(selectedSeg === s.id ? null : s.id)} style={{ background: selectedSeg === s.id ? `${s.color}20` : E.surface2, border: `2px solid ${selectedSeg === s.id ? s.color : s.color + "40"}`, borderRadius: 8, padding: 10, cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: s.color }}>{s.name}</span>
                          <span style={{ fontSize: 9, color: E.textMuted }}>{s.users} users</span>
                        </div>
                        {selectedSeg === s.id && s.groups.map(g => <div key={g} style={{ fontSize: 8, color: E.textMuted, fontFamily: E.mono, lineHeight: 1.7 }}>• {g}</div>)}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: E.surface, border: `1px solid ${E.border}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: E.textMuted, marginBottom: 6 }}>ACTIVE POLICIES</div>
                  {IB_POLICIES.map(p => {
                    const segA = SEGMENTS.find(s => s.id === p.segmentA)!;
                    const segB = SEGMENTS.find(s => s.id === p.segmentB)!;
                    return (
                      <div key={p.id} style={{ background: E.surface2, border: `1px solid ${E.border}`, borderRadius: 7, padding: "8px 10px", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: segA.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 9, color: segA.color, fontWeight: 600 }}>{segA.name}</span>
                        <span style={{ fontSize: 9, color: E.textMuted }}>{p.direction === "bidirectional" ? "↔" : "→"}</span>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: segB.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 9, color: segB.color, fontWeight: 600 }}>{segB.name}</span>
                        <div style={{ marginLeft: "auto" }}><Pill status={p.status} /></div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {activeSecSection === "holds" && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: E.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>⚖️ LEGAL HOLDS</div>
                {HOLDS.map(h => (
                  <div key={h.id} style={{ background: E.surface, border: `1px solid ${h.status === "active" ? E.greenLight + "30" : E.border}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: E.textBright }}>{h.name}</div>
                      <Pill status={h.status} />
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 8, color: E.textMuted, marginBottom: 8 }}>
                      <span>👤 {h.custodians} custodians</span>
                      <span># {h.channels} channels</span>
                      <span>💾 {h.preservedGB} GB preserved</span>
                      <span>📅 Since {h.createdAt}</span>
                    </div>
                    {h.status === "active" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ fontSize: 8, background: E.blueLight, color: "#fff", border: "none", borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>+ Add custodian</button>
                        <button style={{ fontSize: 8, background: "transparent", color: E.textMuted, border: `1px solid ${E.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>Export to eDiscovery</button>
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={() => setHoldWizard(true)} style={{ width: "100%", background: `${E.blueLight}15`, border: `1px dashed ${E.blueLight}50`, borderRadius: 10, padding: "10px", color: E.blueLight, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>+ Create new legal hold</button>
                {holdWizard && (
                  <div style={{ marginTop: 10, background: E.surface, border: `1px solid ${E.blueLight}40`, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: E.blueLight, marginBottom: 8 }}>New Legal Hold — Step {holdStep + 1}/3</div>
                    {holdStep === 0 && <div><input placeholder="Hold name (e.g. SEC Investigation 2024-Q3)" value={newHoldName} onChange={e => setNewHoldName(e.target.value)} style={{ width: "100%", background: E.surface2, border: `1px solid ${E.border}`, borderRadius: 6, padding: "7px 10px", color: E.text, fontSize: 10, boxSizing: "border-box" }} /></div>}
                    {holdStep === 1 && <div style={{ fontSize: 9, color: E.textMuted }}>Select custodians: employees whose Slack data will be preserved and protected from deletion during this hold. (In real app: user picker with search)</div>}
                    {holdStep === 2 && <div style={{ fontSize: 9, color: E.textMuted }}>Review: Hold will preserve all Slack content (messages, files, canvas, DMs) for selected custodians. Users will not be notified. Data deletion is suspended immediately.</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      {holdStep < 2 ? <button onClick={() => setHoldStep(s => s + 1)} style={{ background: E.blueLight, border: "none", borderRadius: 6, padding: "6px 14px", color: "#fff", fontSize: 9, cursor: "pointer" }}>Next →</button>
                      : <button onClick={() => { setHoldWizard(false); setHoldStep(0); }} style={{ background: E.greenLight, border: "none", borderRadius: 6, padding: "6px 14px", color: "#fff", fontSize: 9, cursor: "pointer" }}>Activate Hold</button>}
                      <button onClick={() => { setHoldWizard(false); setHoldStep(0); }} style={{ background: "transparent", border: `1px solid ${E.border}`, borderRadius: 6, padding: "6px 14px", color: E.textMuted, fontSize: 9, cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeSecSection === "mdm" && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: E.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>📱 MDM & SSO</div>
                <div style={{ background: E.surface, border: `1px solid ${E.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: E.textBright, marginBottom: 6 }}>Single Sign-On (SAML 2.0)</div>
                  {[{ label: "Identity Provider",  val: "Okta (Production)" },
                    { label: "SSO URL",            val: "https://acme.okta.com/app/slack/sso/saml" },
                    { label: "Certificate",        val: "Valid · Expires 2025-09-12" },
                    { label: "JIT Provisioning",   val: "Enabled" },
                    { label: "SCIM Sync",          val: "Active · Last sync 3m ago" },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${E.border}`, fontSize: 9 }}>
                      <span style={{ color: E.textMuted }}>{r.label}</span>
                      <span style={{ color: E.text, fontFamily: r.val.includes("http") ? E.mono : "inherit" }}>{r.val}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: E.surface, border: `1px solid ${E.border}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: E.textBright, marginBottom: 6 }}>Mobile Device Management (MDM)</div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 9 }}>
                    <span style={{ color: E.textMuted }}>Enforcement</span>
                    <span style={{ color: E.yellowLight, fontWeight: 700 }}>⚠ Not enforced</span>
                  </div>
                  {[{ label: "Approved providers", val: "Jamf Pro, Microsoft Intune" },
                    { label: "Compliant devices",  val: "1,247 / 1,380" },
                    { label: "Non-compliant",       val: "133 (9.6%)" },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${E.border}`, fontSize: 9 }}>
                      <span style={{ color: E.textMuted }}>{r.label}</span>
                      <span style={{ color: E.text }}>{r.val}</span>
                    </div>
                  ))}
                  <button style={{ marginTop: 8, width: "100%", background: E.blueLight, border: "none", borderRadius: 6, padding: "7px", color: "#fff", fontSize: 9, cursor: "pointer", fontWeight: 700 }}>Enable MDM Enforcement</button>
                </div>
              </>
            )}
          </div>

          {/* Right panel — deep dive */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: E.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            {activeSecSection === "ekm" && (
              <CodeSnip color={E.greenLight} label="EKM — envelope encryption + key rotation without downtime" code={
`// HOW ENTERPRISE KEY MANAGEMENT WORKS TECHNICALLY:
//
// ENVELOPE ENCRYPTION (3-tier key hierarchy):
//
//   Customer Key (CK):  stored in customer's AWS KMS account
//                       Slack NEVER has direct access
//   ↓ wraps
//   Data Encryption Key (DEK): generated per workspace/channel
//                              stored encrypted in Slack's infra
//   ↓ wraps
//   Content:            messages, files, canvas blocks
//
// ENCRYPT FLOW (message send):
// 1. Slack generates a random DEK for the channel.
// 2. Slack calls customer's KMS: kms.encrypt(DEK, CustomerKey)
//    → Returns encrypted DEK (ciphertext blob).
// 3. Slack stores: ciphertext_dek + encrypt(message, DEK).
// 4. Customer's key never leaves their AWS account.
//
// DECRYPT FLOW (message read):
// 1. Slack fetches ciphertext_dek from storage.
// 2. Slack calls customer's KMS: kms.decrypt(ciphertext_dek)
//    → Returns plain DEK.
// 3. Slack decrypts content with plain DEK.
// 4. Plain DEK is held in memory only — never persisted.
//
// KEY ROTATION (the hard frontend problem):
// Goal: replace the customer key without service interruption.
//
// Naive approach: revoke old key → all existing DEKs can't decrypt.
// Correct approach: re-encryption migration:
//   1. Generate new Customer Key in KMS.
//   2. For each channel's ciphertext_DEK:
//      decrypt(ciphertext_DEK, OldKey) → plainDEK
//      re-encrypt: encrypt(plainDEK, NewKey) → new ciphertext_DEK
//      Store new ciphertext_DEK.
//   3. Mark old key as "deprecated" (kept for audit trail).
//   4. Only revoke old key AFTER all DEKs are migrated.
//
// FRONTEND RESPONSIBILITIES:
// - Key status dashboard: active / rotating / revoked / pending
// - Rotation progress: % of DEKs re-encrypted (websocket updates)
// - Error states: what happens when KMS is unreachable?
//   → Messages become inaccessible (by design — data security > availability)
//   → Show clear admin UI: "KMS endpoint unreachable — X messages pending"
// - Revocation confirmation: two-step with typed confirmation string
//   (irreversible action — permanently locks out content)

// FRONTEND STATE MODEL:
interface EKMKeyState {
  keyId:          string;
  alias:          string;
  status:         "active" | "rotating" | "revoked" | "pending";
  rotationProgress?: number;   // 0-100 during rotation
  affectedDEKs?:  number;      // total DEKs being re-encrypted
  lastRotatedAt?: string;      // ISO date
  kmsEndpointHealthy: boolean; // real-time health check
}

// WHY THIS MATTERS FOR ENTERPRISE CUSTOMERS:
// "A financial services customer told us: the ability to immediately
//  revoke our encryption key is our emergency stop button.
//  If we have a breach: we revoke the key, Slack content becomes
//  inaccessible in seconds. This is a regulatory requirement for
//  some of our largest customers. The UI must make this action
//  both accessible (not buried in settings) and protected
//  (not accidentally triggerable). That tension in the UI
//  is what makes EKM frontend challenging."`} />
            )}
            {activeSecSection === "ib" && (
              <CodeSnip color={E.redLight} label="Information Barriers — Chinese wall enforcement at the UI layer" code={
`// INFORMATION BARRIERS — what they prevent:
//
// Use case: investment bank.
// Trading Desk: knows what trades are being placed (material non-public info).
// Research Team: publishes research on companies.
// If Traders and Researchers communicate: insider trading risk.
// Regulation (SEC Rule 17j-1, FINRA 3110): requires information barriers.
//
// WHAT IB ENFORCES IN SLACK:
// 1. Cannot send DMs between barrier-separated users.
// 2. Cannot be in the same channel.
// 3. Cannot @mention each other.
// 4. Cannot search and find each other in people search.
// 5. Cannot see each other's profiles.
// 6. Cannot participate in the same video huddle.
//
// SEGMENT MODEL:
interface IBSegment {
  id:     string;           // stable identifier
  name:   string;           // display name
  users:  string[];         // user IDs in this segment
  groups: string[];         // user group IDs (auto-synced from SCIM)
}
//
// POLICY MODEL:
interface IBPolicy {
  id:         string;
  segmentA:   string;       // segment ID
  segmentB:   string;       // segment ID
  direction:  "bidirectional" | "one-way";
  // bidirectional: A cannot contact B AND B cannot contact A
  // one-way: A cannot contact B, but B can contact A
  //   Use case: compliance can monitor traders but traders can't contact compliance
  enforcement: "block" | "warn";
  // block: prevents the action entirely
  // warn: allows but logs and warns the user ("this may cross an IB")
}
//
// FRONTEND CHALLENGES:
//
// 1. CONFLICT DETECTION:
//    A user can only be in ONE segment.
//    SCIM sync may add a user to a group that spans two segments.
//    Frontend must detect and surface conflicts immediately:
//    "User alice@acme.com is in both Trading Desk and Research segments.
//     Please remove them from one segment to resolve the conflict."
//
// 2. POLICY SIMULATION:
//    Before activating a policy: preview impact.
//    "This policy will affect 148 users.
//     It will close 23 channels that currently have members from both segments.
//     It will block 412 active DMs."
//    Activating a policy without simulation: compliance incident.
//
// 3. AUDIT REQUIREMENT:
//    Every policy change: immutable audit record.
//    Who created, when, which users were moved, which channels were closed.
//    Cannot be modified or deleted.
//
// "The hardest frontend problem in IB:
//  The policy simulation. You need to show the admin EXACTLY what
//  will break before they confirm. We had to build a diff engine
//  that computed: {channels to be closed, DMs to be blocked, @mentions to be restricted}
//  in real-time as the admin built the policy.
//  At enterprise scale: 10,000+ users, 50,000+ channels.
//  The computation is async. The UI must show progress and handle errors.
//  We used a streaming API: server sends diff chunks, frontend renders incrementally."`} />
            )}
            {activeSecSection === "holds" && (
              <CodeSnip color={E.yellowLight} label="Legal Holds — immutable preservation with eDiscovery integration" code={
`// LEGAL HOLDS — the frontend requirements:
//
// WHAT A LEGAL HOLD DOES:
// When you place a custodian on legal hold:
// 1. ALL Slack data for that user is preserved — forever — until released.
// 2. Data deletion is SUSPENDED: retention policies don't apply.
// 3. The user doesn't know they're on hold (stealth requirement).
// 4. If the user deletes a message: it's hidden from them but preserved.
// 5. Data is accessible only to authorized admins via eDiscovery export.
//
// KEY LEGAL REQUIREMENTS THAT SHAPE THE FRONTEND:
//
// a. STEALTH: the hold UI is only visible to org admins.
//    The held user's Slack experience must be unchanged.
//    "Delete message" appears to work — but the message is preserved.
//    This is a legal requirement: don't tip off a custodian.
//
// b. IMMUTABILITY: hold records themselves cannot be modified or deleted
//    without an audit trail. Even releasing a hold: logged.
//    UI constraint: no "edit" button on active holds.
//    Release requires two-step confirmation + reason field.
//
// c. EXPORT: held data must be exportable to eDiscovery platforms
//    (Relativity, Nuix, Logikcull, Everlaw).
//    Export format: EDRM XML or PST-like format.
//    Frontend: export wizard with date range, data types, custodian selection.
//
// LEGAL HOLD STATE MODEL:
interface LegalHold {
  id:          string;
  name:        string;            // case name, human-readable
  caseId?:     string;           // external case reference
  status:      "pending" | "active" | "releasing" | "released";
  custodians:  string[];          // user IDs on hold
  channels?:   string[];          // optional: specific channels to hold
  createdBy:   string;            // admin user ID
  createdAt:   Date;
  preservedBytes: number;         // running total
  releasedAt?: Date;
  releaseReason?: string;         // required on release
}
//
// FRONTEND ERROR STATES (critical to get right):
// 1. Custodian leaves the org after being added to hold:
//    → data must still be preserved (deactivated accounts included)
//    → UI must show: "3 custodians have left the org. Data is still preserved."
//
// 2. Hold released while export is in progress:
//    → export must complete before preservation is lifted
//    → UI must prevent release during active exports
//
// 3. Storage quota exceeded:
//    → admin must be alerted: "Hold storage at 95% of quota"
//    → this is a compliance risk: holds cannot silently fail
//
// "A failed legal hold can result in spoliation sanctions.
//  The frontend must be bulletproof in error states.
//  Every failure mode must surface clearly to the admin.
//  Silence is not an acceptable failure mode for compliance tooling."`} />
            )}
            {activeSecSection === "mdm" && (
              <CodeSnip color={E.blueLight} label="MDM & SSO — device-level and identity-level security" code={
`// SSO (SAML 2.0) — FRONTEND INTEGRATION:
//
// SAML flow (SP-initiated):
// 1. User visits Slack → no session → redirected to Slack SSO endpoint.
// 2. Slack (Service Provider) sends SAML AuthnRequest to IdP.
// 3. IdP (Okta/Azure AD) authenticates user → sends SAML Response.
// 4. Slack validates Response (X.509 signature) → creates session.
//
// ADMIN FRONTEND RESPONSIBILITIES:
// - IdP metadata upload: parse XML, extract entityID, SSO URL, X.509 cert.
// - Test SSO flow: admin can test without enabling for all users.
//   "Test" button: opens SSO flow in a sandboxed popup. If it succeeds:
//   shows the mapped user attributes. If it fails: shows SAML error code.
// - Certificate expiry monitoring: alert 60/30/7 days before expiry.
//   Expired cert = all users locked out. This is a P0 incident.
//
// SCIM PROVISIONING:
// SCIM: System for Cross-domain Identity Management.
// IdP pushes user/group changes to Slack in real-time.
// Admin frontend: show sync status, last sync time, error counts.
// Error surfacing: "23 users failed to provision — view errors"
//   Common errors: username conflicts, licence limits exceeded.
//
// MDM (Mobile Device Management) — FRONTEND:
//
// WHY MDM MATTERS:
// Enterprise requires: only managed devices can access Slack.
// Prevent: employee using unmanaged personal phone to access corporate data.
// How MDM works with Slack:
// 1. MDM provider (Jamf/Intune) pushes Slack app config to managed devices.
// 2. MDM embeds a device certificate or managed app token.
// 3. Slack validates the certificate on each request.
// 4. Non-managed devices: blocked from logging in.
//
// ADMIN FRONTEND:
// - MDM enforcement toggle: CRITICAL action.
//   Before enabling: warn admin how many non-compliant devices will be locked out.
//   "Enabling MDM enforcement will block 133 devices (9.6% of your workforce).
//    Ensure your MDM provider is fully enrolled before proceeding."
// - Device inventory: filter by compliance status, device type, OS version.
// - Grace period setting: allow non-compliant devices for N days while migration is in progress.
//
// BLOCKED FILE DOWNLOADS (DLP):
// Policy: certain file types cannot be downloaded to unmanaged devices.
// Examples: block .xlsx, .pdf downloads outside corporate network.
// Frontend admin UI:
// - Policy builder: file types, user groups, network conditions, device compliance.
// - Reporting: blocked download attempts per user/day.
// - Allowlist: specific users or channels can bypass policy.
// "The trick: the file is visible and previewable in Slack.
//  Only the download to the local filesystem is blocked.
//  UX must make it clear: 'Your organisation has restricted downloading this file.
//  Contact your admin if you need access.' — not a confusing error."`} />
            )}
          </div>
        </div>
      )}

      {/* ── AUDIT LOGS ── */}
      {tab === "audit" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: E.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>AUDIT LOG VIEWER</div>

            {/* Filters */}
            <div style={{ background: E.surface, border: `1px solid ${E.border}`, borderRadius: 10, padding: 10, marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input placeholder="Search actions, actors, entities…" value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ flex: 1, minWidth: 140, background: E.surface2, border: `1px solid ${E.border}`, borderRadius: 6, padding: "6px 10px", color: E.text, fontSize: 10 }} />
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ background: E.surface2, border: `1px solid ${E.border}`, borderRadius: 6, padding: "6px 8px", color: E.text, fontSize: 9 }}>
                <option value="all">All categories</option>
                {["auth","data","admin","security","compliance"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={sevFilter} onChange={e => setSevFilter(e.target.value)} style={{ background: E.surface2, border: `1px solid ${E.border}`, borderRadius: 6, padding: "6px 8px", color: E.text, fontSize: 9 }}>
                <option value="all">All severity</option>
                {["info","warning","critical"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => setStreamLive(l => !l)} style={{ background: streamLive ? E.greenLight : "#0a0e13", border: `1px solid ${streamLive ? E.greenLight : E.border}`, borderRadius: 6, padding: "6px 12px", color: streamLive ? "#fff" : E.textMuted, fontSize: 9, cursor: "pointer", fontWeight: 700 }}>
                {streamLive ? "⬤ LIVE" : "○ Live"}
              </button>
              <button onClick={() => setExportModal(true)} style={{ background: E.blueLight, border: "none", borderRadius: 6, padding: "6px 12px", color: "#fff", fontSize: 9, cursor: "pointer" }}>↓ Export</button>
            </div>

            {/* Log table */}
            <div style={{ background: E.surface, border: `1px solid ${E.border}`, borderRadius: 10, overflow: "hidden", maxHeight: 480 }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 100px 1fr 1fr 60px", gap: 0, borderBottom: `1px solid ${E.border}`, padding: "6px 10px", fontSize: 8, fontWeight: 700, color: E.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span>Timestamp</span><span>Actor</span><span>Action</span><span>Entity</span><span>Severity</span>
              </div>
              <div style={{ overflowY: "auto", maxHeight: 430 }}>
                {filteredLogs.slice(0, 25).map((log, i) => (
                  <div key={log.id} style={{ display: "grid", gridTemplateColumns: "120px 100px 1fr 1fr 60px", gap: 0, padding: "6px 10px", borderBottom: `1px solid ${E.border}20`, background: i % 2 === 0 ? "transparent" : `${E.surface2}50`, alignItems: "center" }}>
                    <span style={{ fontSize: 7, color: E.textMuted, fontFamily: E.mono }}>{log.timestamp.slice(11, 19)}</span>
                    <span style={{ fontSize: 8, color: E.blueLight }}>{log.actor.split("@")[0]}</span>
                    <span style={{ fontSize: 8, color: E.text, fontFamily: E.mono }}>{log.action}</span>
                    <span style={{ fontSize: 8, color: E.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.entity}</span>
                    <Pill status={log.severity} />
                  </div>
                ))}
                {filteredLogs.length === 0 && <div style={{ padding: 20, textAlign: "center", color: E.textMuted, fontSize: 10 }}>No logs match filters</div>}
              </div>
            </div>

            {exportModal && (
              <div style={{ marginTop: 10, background: E.surface, border: `1px solid ${E.blueLight}40`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: E.blueLight, marginBottom: 8 }}>Export Audit Logs</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {["Splunk (JSON)", "Sumo Logic (JSON)", "CSV (Excel)", "SIEM CEF Format"].map(opt => (
                    <div key={opt} style={{ background: E.surface2, border: `1px solid ${E.border}`, borderRadius: 6, padding: "8px 10px", cursor: "pointer", fontSize: 9, color: E.text }}>⬇ {opt}</div>
                  ))}
                </div>
                <button onClick={() => setExportModal(false)} style={{ fontSize: 9, background: "transparent", border: `1px solid ${E.border}`, borderRadius: 6, padding: "5px 12px", color: E.textMuted, cursor: "pointer" }}>Close</button>
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: E.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={E.yellowLight} label="Audit Logs — compliance requirements, real-time streaming, SIEM export" code={
`// AUDIT LOGS — WHAT MUST BE LOGGED (regulatory requirement):
//
// For compliance (SOC 2, ISO 27001, FedRAMP, HIPAA, FINRA):
// Every significant action in Slack must produce an immutable audit log event.
//
// CATEGORIES:
// auth:       logins, logouts, failed auth, SSO assertion failures
// data:       message send/edit/delete, file upload/download/share
// admin:      user invite/deactivate, role changes, channel archive
// security:   key rotation, IB policy changes, hold creation/release
// compliance: audit log export, data retention changes
//
// AUDIT LOG EVENT SCHEMA:
interface AuditLogEvent {
  id:          string;       // globally unique, immutable
  timestamp:   string;       // ISO 8601 UTC — cannot be modified
  workspaceId: string;
  actor: {
    type:  "user" | "bot" | "app" | "slack_operator";
    id:    string;
    email: string;
    ip:    string;           // source IP — required for security events
  };
  action:      string;       // e.g. "ekm.key_rotation_initiated"
  entity: {
    type:  string;           // e.g. "key", "policy", "user"
    id:    string;
    name:  string;
  };
  details:     Record<string, unknown>;  // action-specific metadata
  context: {
    userAgent?:   string;
    sessionId?:   string;
    requestId:    string;    // for correlation with backend traces
  };
}
//
// IMMUTABILITY REQUIREMENT:
// Audit logs cannot be modified or deleted — ever.
// This is a regulatory requirement (FINRA, SOC 2).
// Implementation: append-only storage. No UPDATE or DELETE permissions.
// Frontend: no "delete" action exposed. No "edit" action. Read-only.
//
// REAL-TIME STREAMING (the interesting frontend problem):
// Enterprise customers need audit logs in their SIEM within seconds.
// Options:
//   (a) Polling: GET /audit-logs every 30s → 30s latency, high load
//   (b) Webhook push: Slack sends events to customer endpoint → simple, but
//       requires customer to run an endpoint, reliability concerns
//   (c) SSE (Server-Sent Events): stream events to the admin UI → real-time, no WebSocket overhead
//   (d) Kafka consumer: for SIEM integration → enterprise-grade
//
// We use SSE for the admin UI (live view) + Kafka for SIEM export.
//
// SSE implementation in the audit log frontend:
// const evtSource = new EventSource('/api/audit-logs/stream');
// evtSource.onmessage = (event) => {
//   const log = JSON.parse(event.data);
//   dispatch(auditLogActions.prepend(log));
// };
// Key: SSE reconnects automatically. Unlike WebSocket: fire-and-forget setup.
//
// SIEM EXPORT PIPELINE:
// Splunk/Sumo Logic: pull via API (customer configures a token).
// CEF (Common Event Format): used by ArcSight, QRadar.
// JSON: most SIEM tools accept raw JSON.
// "Customers ask: can we get logs in real-time?
//  Yes: Slack sends to a customer HTTPS endpoint (webhook) within 15 seconds.
//  Or: customer polls our API. Or: Kafka via private network (enterprise+).
//  The admin UI shows the last delivery timestamp to each configured SIEM.
//  If the last delivery was >5 minutes ago: alert the admin.
//  Compliance requirement: logs must not be delayed more than 15 minutes."
//
// PERFORMANCE AT ENTERPRISE SCALE:
// A large Slack workspace: 100,000+ audit events per day.
// The log viewer must handle: infinite scroll, not a flat list.
// Frontend: cursor-based pagination (not offset — offsets drift as new events arrive).
// "Offset pagination on a live feed: page 2 shows different results
//  each time you fetch it as new events are prepended.
//  Cursor pagination: stable reference point regardless of new events.
//  This is the correct primitive for any live data feed."
`} />
          </div>
        </div>
      )}

      {/* ── RE-ARCHITECTURE ── */}
      {tab === "rearch" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: E.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>ENTERPRISE ADMIN DASHBOARD RE-ARCHITECTURE</div>

            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {(["before", "after", "migration"] as const).map(v => (
                <button key={v} onClick={() => setArchView(v)} style={{ background: archView === v ? E.surface2 : "transparent", color: archView === v ? E.textBright : E.textMuted, border: archView === v ? `1px solid ${E.border}` : "1px solid transparent", borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                  {v === "before" ? "❌ Before" : v === "after" ? "✅ After" : "🔄 Migration"}
                </button>
              ))}
            </div>

            {archView === "before" && (
              <div style={{ background: E.surface, border: `1px solid ${E.redLight}30`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: E.redLight, marginBottom: 8 }}>BEFORE: Legacy Architecture</div>
                {[
                  { prob: "No TypeScript",          detail: "Plain JavaScript throughout. Type errors caught only at runtime. Enterprise features: complex state with no type safety." },
                  { prob: "No React",               detail: "Server-rendered Handlebars templates + jQuery DOM manipulation. Every page reload: full server round-trip. Poor UX for complex admin workflows." },
                  { prob: "No global state",        detail: "Each page managed its own XHR calls. No caching. Switching between Admin tabs: re-fetched all data." },
                  { prob: "No component reuse",     detail: "Copy-pasted DOM manipulation code across 40+ admin pages. IB policy UI had different code from Legal Hold UI for identical patterns." },
                  { prob: "No testing",             detail: "Zero frontend unit tests. Regressions discovered by enterprise customers. At this customer tier: regressions = legal exposure." },
                ].map(p => (
                  <div key={p.prob} style={{ padding: "7px 10px", borderLeft: `3px solid ${E.redLight}`, background: `${E.redLight}08`, borderRadius: "0 6px 6px 0", marginBottom: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: E.redLight }}>{p.prob}</div>
                    <div style={{ fontSize: 8, color: E.textMuted, lineHeight: 1.5 }}>{p.detail}</div>
                  </div>
                ))}
              </div>
            )}

            {archView === "after" && (
              <div style={{ background: E.surface, border: `1px solid ${E.greenLight}30`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: E.greenLight, marginBottom: 8 }}>AFTER: Modern TypeScript + React + Redux Toolkit</div>
                {[
                  { gain: "TypeScript strict mode",   detail: "All state, API responses, and component props fully typed. Branded types for entity IDs — UserId ≠ GroupId ≠ PolicyId at compile time." },
                  { gain: "React + Redux Toolkit",    detail: "Normalized entity state with createEntityAdapter. RTK Query for API data fetching, caching, and invalidation. Optimistic updates for better UX." },
                  { gain: "Shared component library", detail: "50+ admin UI components. PolicyCard, CustodianPicker, SegmentDiagram. Used across EKM, IB, Legal Holds, MDM, Audit Logs." },
                  { gain: "100% test coverage",       detail: "Unit tests for all state logic. Integration tests for each feature's happy path + critical error paths. Playwright E2E for admin workflows." },
                  { gain: "Performance",              detail: "Virtual scrolling for user/device lists (50K+ entries). Lazy-loaded route chunks. 82% reduction in initial bundle size." },
                ].map(p => (
                  <div key={p.gain} style={{ padding: "7px 10px", borderLeft: `3px solid ${E.greenLight}`, background: `${E.greenLight}08`, borderRadius: "0 6px 6px 0", marginBottom: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: E.greenLight }}>{p.gain}</div>
                    <div style={{ fontSize: 8, color: E.textMuted, lineHeight: 1.5 }}>{p.detail}</div>
                  </div>
                ))}
              </div>
            )}

            {archView === "migration" && (
              <div style={{ background: E.surface, border: `1px solid ${E.border}`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: E.blueLight, marginBottom: 8 }}>MIGRATION STRATEGY: Strangler Fig Pattern</div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: E.textMuted, marginBottom: 4 }}>Overall progress: {migPct}% complete</div>
                  <div style={{ background: E.surface2, borderRadius: 6, overflow: "hidden", height: 8 }}>
                    <div style={{ width: `${migPct}%`, height: "100%", background: `linear-gradient(90deg, ${E.blueLight}, ${E.greenLight})`, transition: "width 0.3s" }} />
                  </div>
                </div>
                {[
                  { feature: "User Management",    pct: 100, status: "done"    },
                  { feature: "EKM Dashboard",      pct: 100, status: "done"    },
                  { feature: "Legal Holds",        pct: 100, status: "done"    },
                  { feature: "Audit Logs",         pct: 100, status: "done"    },
                  { feature: "Information Barriers",pct: 80, status: "active"  },
                  { feature: "MDM & SSO",          pct: 60, status: "active"   },
                  { feature: "Billing & Limits",   pct: 20, status: "planned"  },
                ].map(f => (
                  <div key={f.feature} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 8, color: E.textMuted, width: 120, flexShrink: 0 }}>{f.feature}</span>
                    <div style={{ flex: 1, background: E.surface2, borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{ width: `${f.pct}%`, height: "100%", background: f.status === "done" ? E.greenLight : f.status === "active" ? E.blueLight : E.border }} />
                    </div>
                    <span style={{ fontSize: 8, color: E.textMuted, width: 30, textAlign: "right" }}>{f.pct}%</span>
                  </div>
                ))}
                <button onClick={() => setMigPct(p => Math.min(p + 5, 100))} style={{ marginTop: 10, fontSize: 9, background: E.blueLight, border: "none", borderRadius: 6, padding: "5px 12px", color: "#fff", cursor: "pointer" }}>Simulate sprint delivery +5%</button>
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: E.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={E.purpleLight} label="Re-architecture — TypeScript patterns + Redux state design for enterprise admin" code={
`// TYPESCRIPT PATTERNS FOR ENTERPRISE ADMIN:
//
// 1. BRANDED TYPES — prevent ID mix-ups at compile time:
//    The admin dashboard has: UserId, GroupId, PolicyId, HoldId, KeyId…
//    All are strings. Without branding: easy to pass wrong ID to wrong function.
//
//    Before (unsafe):
//    function addCustodian(holdId: string, userId: string) { … }
//    addCustodian(userId, holdId); // compiles! wrong order. silent bug.
//
//    After (branded types):
//    type HoldId  = string & { readonly _brand: "HoldId"  };
//    type UserId  = string & { readonly _brand: "UserId"  };
//    function addCustodian(holdId: HoldId, userId: UserId) { … }
//    addCustodian(userId, holdId); // TS error: Argument of type UserId
//                                  // is not assignable to type HoldId.
//
// 2. DISCRIMINATED UNIONS for policy types:
//    Each IB policy type has different configuration options.
//    Discriminated union: TypeScript narrows type based on "type" field.
//
//    type IBPolicyConfig =
//      | { type: "block";   logAttempts: boolean }
//      | { type: "warn";    message: string; logAttempts: boolean }
//      | { type: "monitor"; alertRecipients: string[] };
//
//    function renderPolicyConfig(config: IBPolicyConfig) {
//      switch (config.type) {
//        case "block":   return <BlockConfig log={config.logAttempts} />;
//        case "warn":    return <WarnConfig msg={config.message} />;
//        case "monitor": return <MonitorConfig recipients={config.alertRecipients} />;
//        // TypeScript: exhaustiveness check — if new type added: compile error here.
//      }
//    }
//
// REDUX TOOLKIT ARCHITECTURE:
//
// Normalized state: entities stored by ID, not nested.
// WHY: if Legal Hold has 23 custodians and each custodian is a User,
//      you don't store 23 copies of User data inside the Hold.
//      You store 23 user IDs in the Hold. User data: in usersSlice.
//
// const usersSlice = createSlice({
//   name: "users",
//   initialState: usersAdapter.getInitialState(),
//   reducers: {
//     usersReceived: usersAdapter.setAll,
//     userUpdated:   usersAdapter.updateOne,
//   },
// });
//
// const legalHoldsSlice = createSlice({
//   name: "legalHolds",
//   initialState: holdsAdapter.getInitialState<{ status: "idle"|"loading"|"error" }>({ status: "idle" }),
//   reducers: { … },
//   extraReducers: (builder) => {
//     builder
//       .addCase(addCustodian.pending,   (state) => { state.status = "loading"; })
//       .addCase(addCustodian.fulfilled, (state, action) => {
//         holdsAdapter.updateOne(state, { id: action.payload.holdId,
//                                         changes: { custodians: action.payload.custodians } });
//         state.status = "idle";
//       })
//       .addCase(addCustodian.rejected,  (state, action) => {
//         state.status = "error";
//         // IMPORTANT: for compliance tooling:
//         // never silently swallow errors. Must surface every failure.
//         state.lastError = action.error.message;
//       });
//   },
// });
//
// RTK QUERY for API caching:
// const adminApi = createApi({
//   reducerPath: "adminApi",
//   baseQuery: fetchBaseQuery({ baseUrl: "/api/v2/admin/" }),
//   tagTypes: ["LegalHold", "IBPolicy", "EKMKey", "AuditLog"],
//   endpoints: (builder) => ({
//     getLegalHolds: builder.query<LegalHold[], void>({
//       query: () => "legal-holds",
//       providesTags: ["LegalHold"],
//     }),
//     addCustodian: builder.mutation<void, { holdId: HoldId; userId: UserId }>({
//       query: ({ holdId, userId }) => ({
//         url: \`legal-holds/\${holdId}/custodians\`,
//         method: "POST",
//         body: { userId },
//       }),
//       invalidatesTags: ["LegalHold"], // auto-refetches getLegalHolds
//     }),
//   }),
// });
//
// STRANGLER FIG MIGRATION PATTERN:
// "We can't big-bang rewrite 40 admin pages.
//  Enterprise customers: zero tolerance for regressions during migration.
//  Our approach:
//  1. New React app runs at /admin-v2/* (new URL prefix).
//  2. Each admin feature gets a redirect: /admin/legal-holds → /admin-v2/legal-holds
//     once the new version ships to 100%.
//  3. Feature flag: admin_legal_holds_v2 = true → serve new React.
//                   admin_legal_holds_v2 = false → serve old Handlebars.
//  4. We never run both versions simultaneously for the same user.
//  5. Migration sprint: implement feature in React → dogfood → 5% → 100% → delete old code.
//  6. Result: 18-month migration, zero customer-visible regressions.
//     Measured by: support ticket volume per feature per sprint."`} />
          </div>
        </div>
      )}

      {/* ── DASHBOARD ── */}
      {tab === "dashboard" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Total Users",     val: "38,492",   sub: "+234 this week",  c: E.blueLight   },
              { label: "Managed Devices", val: "1,247",    sub: "133 non-compliant", c: E.yellowLight },
              { label: "Active IB Policies", val: "2",    sub: "1 pending review", c: E.greenLight  },
              { label: "Data on Legal Hold", val: "296 GB", sub: "2 active holds", c: E.purpleLight  },
            ].map(m => (
              <div key={m.label} style={{ background: E.surface, border: `1px solid ${E.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: E.textMuted, marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: m.c }}>{m.val}</div>
                <div style={{ fontSize: 8, color: E.textMuted, marginTop: 2 }}>{m.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <CodeSnip color={E.purpleLight} label="Enterprise Admin Dashboard — what 'led the re-architecture' means to an interviewer" code={
`// "LED THE RE-ARCHITECTURE" — what the interviewer is really asking:
//
// They want to know:
// 1. How did you decide WHAT to rewrite? (not a full rewrite)
// 2. How did you do it WITHOUT breaking production for enterprise customers?
// 3. How did you get organizational buy-in?
// 4. How did you measure success?
//
// YOUR ANSWER FRAMEWORK:
//
// WHY NOW:
// "The legacy dashboard was blocking our ability to ship new enterprise features.
//  New compliance requirements (EKM, Legal Holds) needed complex interactive UIs.
//  jQuery/Handlebars made these 3x slower to build and 5x harder to test.
//  One regression: potential legal exposure for enterprise customers.
//  The cost of maintaining the old codebase was accelerating.
//  We did a formal ADR (Architecture Decision Record):
//  estimated engineering velocity gain from migration: 35%.
//  That's the number that got leadership buy-in."
//
// HOW WE CHOSE THE MIGRATION PATTERN:
// "Big-bang rewrite: rejected. 40 pages, enterprise-grade SLA, zero risk tolerance.
//  Feature-branch approach: rejected. Long-running branch = merge conflicts, drift.
//  We chose Strangler Fig (Martin Fowler, 2004):
//  Build the new version alongside the old. Route users incrementally.
//  Each feature: independent feature flag. Each migration: its own sprint.
//  Old code: deleted immediately after each migration (not archived).
//  'Definition of done': zero references to old code. Not 'mostly migrated'."
//
// HOW WE MAINTAINED QUALITY:
// "TypeScript strict mode from day 1.
//  No 'any' types — lint rule enforced at CI.
//  Every new component: unit tests required to merge.
//  Integration tests for each admin workflow.
//  Playwright E2E for the three most critical flows:
//  (1) EKM key rotation, (2) Legal hold creation, (3) IB policy activation.
//  These three: if they regress, we have a P0 incident and potential legal exposure.
//  They ran on every PR."
//
// WHAT I OWNED SPECIFICALLY:
// "I defined the Redux state architecture:
//  normalized entity model, RTK Query for API layer, optimistic updates.
//  I also built the shared component library that all admin features use.
//  And I conducted weekly architecture reviews during the migration —
//  every engineer who built a new feature came through my review before merge.
//  This is how we maintained consistency across 18 months and 6 engineers."`} />
            <CodeSnip color={E.blueLight} label="Why enterprise frontend is different from consumer frontend" code={
`// ENTERPRISE FRONTEND vs CONSUMER FRONTEND:
//
// CONSUMER (e.g. Slack messaging):
// Scale: maximize engagement, optimize for median user experience.
// Errors: recoverable. User retries or ignores.
// Regressions: annoying but manageable. Ship a fix.
// Performance: critical for engagement.
// UX: delight, reduce friction, encourage exploration.
//
// ENTERPRISE ADMIN (Slack Enterprise Dashboard):
// Scale: optimize for correctness, not engagement. Admins MUST succeed.
// Errors: potentially catastrophic:
//   - Failed legal hold creation → legal exposure
//   - EKM key rotation shown as "complete" when it's not → security incident
//   - IB policy shown as "active" when it's "pending" → compliance violation
// Regressions: enterprise customers have SLAs. Regression = support escalation
//              = executive escalation = potential contract risk.
// Performance: secondary. Admins run these workflows rarely but critically.
// UX: clarity over delight. Every state must be unambiguous.
//     Error messages: must tell the admin EXACTLY what to do.
//     "Something went wrong" is unacceptable in enterprise admin.
//
// WHAT THIS CHANGES ABOUT FRONTEND ENGINEERING:
//
// 1. OPTIMISTIC UPDATES: used carefully.
//    Consumer: optimistic update for likes, reactions. Low stakes.
//    Enterprise: optimistic update for "hold created" — dangerous.
//    If optimistic UI shows "hold active" but server fails: admin believes data is preserved.
//    It isn't. Legal exposure.
//    Pattern: show "hold activation in progress" (loading state) until server confirms.
//    Never show final state until server confirms.
//
// 2. ERROR STATES: first-class citizens, not afterthoughts.
//    Every API call has 3 states: loading, success, error.
//    Error state: must tell the admin what SPECIFICALLY failed and what to DO.
//    "Key rotation failed: AWS KMS returned 403 (AccessDenied).
//     Please verify that Slack has kms:Decrypt permission on key mrk-a1b2c3d4."
//    Not: "An error occurred. Please try again."
//
// 3. TESTING: enterprise compliance features require deterministic tests.
//    "If the Legal Hold UI test passes: the hold WILL be created correctly."
//    Not: "Tests probably cover the happy path."
//    We wrote property-based tests for the IB conflict detection algorithm.
//    100+ generated test cases: random segment configurations.
//    Verified: no false positives (blocking valid communication) and
//              no false negatives (allowing blocked communication).
//
// 4. ACCESSIBILITY: enterprise customers have accessibility requirements
//    in their procurement contracts. WCAG 2.1 AA is often contractual.
//    Every admin UI component: keyboard navigable, screen reader tested.
//    EKM key rotation: worked correctly with VoiceOver + keyboard only.
//
// "The difference between consumer and enterprise frontend:
//  consumer frontend: optimize for the happy path.
//  enterprise frontend: optimize for the failure path.
//  Because when enterprise fails: it fails loudly and expensively."`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SlackEnterpriseAdminDemo;
