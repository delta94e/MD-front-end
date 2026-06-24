/**
 * CaseManagementDemo.tsx
 *
 * Financial Investigation Case Management Platform — greenfield build.
 *
 * LEADERSHIP CONTEXT
 *   Led frontend development from day 0 — blank repo to production in 6 months.
 *   Owned: architecture decisions, frontend standards, cross-team RFC process,
 *   component library, state management design, API contract negotiation with BE.
 *
 * PLATFORM DOMAIN (Financial Crime / Compliance)
 *   Cases: AML alerts, SARs, Fraud investigations, OFAC screening, KYC reviews
 *   Workflow: New → Assigned → Under Investigation → Escalated → Pending Review → Closed
 *   Roles: Investigator · Supervisor · Compliance Officer · Read-only Auditor
 *   Entities: Persons · Accounts · Transactions linked to cases
 *   Evidence: Documents, screenshots, transaction exports attached to cases
 *   Timeline: Immutable audit log of every case action (regulatory requirement)
 *
 * ARCHITECTURE DECISIONS DEMONSTRATED
 *   A. Module federation: each domain (cases, entities, reporting) is an MFE
 *   B. RTK Query: case API with optimistic updates + manual cache invalidation
 *   C. State machine: XState for case workflow to prevent invalid state transitions
 *   D. RBAC: permission hooks (canEditCase, canEscalate) wired to JWT claims
 *   E. Virtualized case list: TanStack Virtual for 50k+ cases
 *   F. Optimistic status update: UI updates instantly, rolls back on API error
 *   G. ADR process: Architecture Decision Records tracked in /docs/adr
 */

import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  KeyboardEvent,
} from "react";

// ─────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────

type CaseStatus =
  | "new"
  | "assigned"
  | "under-review"
  | "escalated"
  | "pending-review"
  | "closed-substantiated"
  | "closed-clear";

type CaseType = "AML" | "SAR" | "FRAUD" | "KYC" | "OFAC";
type RiskLevel = "critical" | "high" | "medium" | "low";
type EvidenceType = "document" | "screenshot" | "transaction" | "communication" | "external";

interface InvestigationCase {
  id: string;
  title: string;
  type: CaseType;
  risk: RiskLevel;
  status: CaseStatus;
  assignee: string | null;
  createdAt: string;
  dueDate: string;
  description: string;
  amount?: number;
  currency?: string;
  entities: CaseEntity[];
  evidence: Evidence[];
  timeline: TimelineEntry[];
}

interface CaseEntity {
  id: string;
  name: string;
  kind: "person" | "account" | "transaction";
  detail: string;
  flagged: boolean;
}

interface Evidence {
  id: string;
  name: string;
  type: EvidenceType;
  addedBy: string;
  addedAt: string;
  size?: string;
}

interface TimelineEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  note?: string;
}

// ─────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────

const INVESTIGATORS = ["Nguyen T. Anh", "Le Minh Duc", "Tran Thi Bich", "Pham Quoc Hung", "Unassigned"];

const CASES: InvestigationCase[] = [
  {
    id: "CASE-2024-08391",
    title: "Structuring Pattern — Account #VN-449821",
    type: "AML", risk: "critical", status: "escalated",
    assignee: "Nguyen T. Anh", createdAt: "2024-11-08", dueDate: "2024-11-15",
    description: "Series of 47 cash deposits totalling $485,000 over 14 days, each structured below the $10,000 CTR threshold. Depositor has no declared income source consistent with volume. Pattern matches FATF Typology 7 (structuring / smurfing).",
    amount: 485000, currency: "USD",
    entities: [
      { id: "e1", name: "Lê Văn Tài", kind: "person", detail: "Account holder — KYC risk: High", flagged: true },
      { id: "e2", name: "VN-449821", kind: "account", detail: "Checking — opened 3 months ago", flagged: true },
      { id: "e3", name: "TXN-88231", kind: "transaction", detail: "$9,800 cash deposit — 2024-11-01", flagged: true },
    ],
    evidence: [
      { id: "ev1", name: "CTR_analysis_nov2024.xlsx", type: "document", addedBy: "Nguyen T. Anh", addedAt: "2024-11-09", size: "420 KB" },
      { id: "ev2", name: "account_statement_oct_nov.pdf", type: "document", addedBy: "Nguyen T. Anh", addedAt: "2024-11-09", size: "1.2 MB" },
      { id: "ev3", name: "branch_cctv_2024-11-01.mp4", type: "screenshot", addedBy: "Le Minh Duc", addedAt: "2024-11-10", size: "88 MB" },
    ],
    timeline: [
      { id: "t1", action: "Case created", actor: "System (AML Engine)", timestamp: "2024-11-08 09:14" },
      { id: "t2", action: "Assigned to investigator", actor: "Pham Quoc Hung (Supervisor)", timestamp: "2024-11-08 09:45", note: "Priority escalation — structuring flag" },
      { id: "t3", action: "Evidence uploaded (CTR analysis)", actor: "Nguyen T. Anh", timestamp: "2024-11-09 14:22" },
      { id: "t4", action: "Status → Escalated", actor: "Nguyen T. Anh", timestamp: "2024-11-10 11:05", note: "Escalated to Compliance Officer per procedure §4.2" },
    ],
  },
  {
    id: "CASE-2024-08204",
    title: "Suspicious Wire Transfers — Corporate Entity",
    type: "SAR", risk: "high", status: "under-review",
    assignee: "Le Minh Duc", createdAt: "2024-11-05", dueDate: "2024-11-19",
    description: "Three international wire transfers totalling $2.1M to shell companies in sanctioned jurisdictions. Corporate entity registered 6 weeks prior to transfers with no apparent business activity.",
    amount: 2100000, currency: "USD",
    entities: [
      { id: "e1", name: "Sunrise Trading LLC", kind: "person", detail: "Corporate — registered Delaware, 6 weeks old", flagged: true },
      { id: "e2", name: "CORP-774192", kind: "account", detail: "Business checking — $2.1M outflows", flagged: true },
    ],
    evidence: [
      { id: "ev1", name: "wire_transfer_records.pdf", type: "transaction", addedBy: "Le Minh Duc", addedAt: "2024-11-06", size: "340 KB" },
      { id: "ev2", name: "sanctions_screening_report.pdf", type: "external", addedBy: "Le Minh Duc", addedAt: "2024-11-07", size: "180 KB" },
    ],
    timeline: [
      { id: "t1", action: "Case created", actor: "System (Transaction Monitoring)", timestamp: "2024-11-05 15:32" },
      { id: "t2", action: "Assigned to investigator", actor: "Tran Thi Bich (Supervisor)", timestamp: "2024-11-05 16:00" },
      { id: "t3", action: "Status → Under Review", actor: "Le Minh Duc", timestamp: "2024-11-06 10:15" },
    ],
  },
  {
    id: "CASE-2024-07981",
    title: "Account Takeover — Digital Banking",
    type: "FRAUD", risk: "high", status: "pending-review",
    assignee: "Tran Thi Bich", createdAt: "2024-10-29", dueDate: "2024-11-12",
    description: "Customer reported unauthorised transactions totalling $34,500. Device fingerprint mismatch and login from new IP in foreign jurisdiction within 2 hours of password change.",
    amount: 34500, currency: "USD",
    entities: [
      { id: "e1", name: "Hoàng Phương Linh", kind: "person", detail: "Customer since 2019 — no prior fraud", flagged: false },
      { id: "e2", name: "ACCT-221894", kind: "account", detail: "Savings — $34,500 withdrawn", flagged: true },
    ],
    evidence: [
      { id: "ev1", name: "device_fingerprint_log.json", type: "document", addedBy: "Tran Thi Bich", addedAt: "2024-10-30", size: "24 KB" },
      { id: "ev2", name: "ip_geolocation_report.pdf", type: "external", addedBy: "Tran Thi Bich", addedAt: "2024-10-30", size: "56 KB" },
      { id: "ev3", name: "customer_statement.pdf", type: "communication", addedBy: "Tran Thi Bich", addedAt: "2024-10-31", size: "120 KB" },
    ],
    timeline: [
      { id: "t1", action: "Case created", actor: "Fraud Operations", timestamp: "2024-10-29 08:50" },
      { id: "t2", action: "Status → Under Review", actor: "Tran Thi Bich", timestamp: "2024-10-29 10:00" },
      { id: "t3", action: "Status → Pending Review", actor: "Tran Thi Bich", timestamp: "2024-11-02 15:40", note: "Investigation complete — awaiting supervisor sign-off" },
    ],
  },
  {
    id: "CASE-2024-07740",
    title: "OFAC Match — Incoming Wire",
    type: "OFAC", risk: "critical", status: "new",
    assignee: null, createdAt: "2024-11-11", dueDate: "2024-11-12",
    description: "Automated OFAC screening flagged an exact name match on incoming wire of $180,000. Sender name matches SDN List entry. Wire has been held pending investigation. 24-hour regulatory response window.",
    amount: 180000, currency: "USD",
    entities: [
      { id: "e1", name: "Omar Al-Rashid", kind: "person", detail: "SDN List match — 95% confidence", flagged: true },
    ],
    evidence: [],
    timeline: [
      { id: "t1", action: "Case auto-created — OFAC match", actor: "System (OFAC Screening Engine)", timestamp: "2024-11-11 14:03" },
      { id: "t2", action: "Wire placed on hold", actor: "System (Auto-hold rule)", timestamp: "2024-11-11 14:03" },
    ],
  },
  {
    id: "CASE-2024-07501",
    title: "Enhanced Due Diligence — PEP Onboarding",
    type: "KYC", risk: "medium", status: "assigned",
    assignee: "Pham Quoc Hung", createdAt: "2024-11-01", dueDate: "2024-11-20",
    description: "New high-net-worth customer identified as Politically Exposed Person. Standard KYC insufficient — EDD required per AML policy §3.1. Requires source-of-wealth documentation and senior management approval.",
    amount: undefined,
    entities: [
      { id: "e1", name: "Nguyễn Thanh Long", kind: "person", detail: "PEP — Former government minister", flagged: false },
    ],
    evidence: [
      { id: "ev1", name: "edd_checklist.pdf", type: "document", addedBy: "Pham Quoc Hung", addedAt: "2024-11-02", size: "88 KB" },
    ],
    timeline: [
      { id: "t1", action: "Case created — EDD required", actor: "KYC Onboarding System", timestamp: "2024-11-01 09:00" },
      { id: "t2", action: "Assigned to senior investigator", actor: "Le Thi My (Supervisor)", timestamp: "2024-11-01 09:30" },
    ],
  },
  {
    id: "CASE-2024-06882",
    title: "Layering via Real Estate — Multiple Accounts",
    type: "AML", risk: "high", status: "closed-substantiated",
    assignee: "Nguyen T. Anh", createdAt: "2024-09-15", dueDate: "2024-10-15",
    description: "Closed — SAR filed. Complex layering scheme using 8 accounts and 3 real estate transactions. STR filed with FinCEN. Case referred to law enforcement.",
    amount: 1200000, currency: "USD",
    entities: [],
    evidence: [
      { id: "ev1", name: "SAR_filing_202410.pdf", type: "document", addedBy: "Nguyen T. Anh", addedAt: "2024-10-14", size: "2.1 MB" },
    ],
    timeline: [
      { id: "t1", action: "Case created", actor: "System", timestamp: "2024-09-15 10:00" },
      { id: "t2", action: "SAR filed with FinCEN", actor: "Nguyen T. Anh", timestamp: "2024-10-14 16:00" },
      { id: "t3", action: "Case closed — Substantiated", actor: "Compliance Officer", timestamp: "2024-10-15 09:00", note: "Referred to law enforcement" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<CaseStatus, { label: string; color: string; bg: string }> = {
  "new":                   { label: "New",             color: "#60a5fa", bg: "#1e3a5f" },
  "assigned":              { label: "Assigned",         color: "#a78bfa", bg: "#2e1065" },
  "under-review":          { label: "Under Review",     color: "#fbbf24", bg: "#451a03" },
  "escalated":             { label: "Escalated",         color: "#f97316", bg: "#431407" },
  "pending-review":        { label: "Pending Review",   color: "#22d3ee", bg: "#164e63" },
  "closed-substantiated":  { label: "Closed — Filed",   color: "#ef4444", bg: "#450a0a" },
  "closed-clear":          { label: "Closed — Clear",   color: "#4ade80", bg: "#052e16" },
};

const RISK_CFG: Record<RiskLevel, { color: string; bg: string }> = {
  critical: { color: "#ef4444", bg: "#450a0a" },
  high:     { color: "#f97316", bg: "#431407" },
  medium:   { color: "#fbbf24", bg: "#451a03" },
  low:      { color: "#4ade80", bg: "#052e16" },
};

const TYPE_ICON: Record<CaseType, string> = {
  AML: "💸", SAR: "📋", FRAUD: "🔓", KYC: "👤", OFAC: "🚫",
};

const EVT_ICON: Record<EvidenceType, string> = {
  document: "📄", screenshot: "🖼", transaction: "💳", communication: "📧", external: "🔗",
};

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{
      background: bg, color, border: `1px solid ${color}40`,
      borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

// ─────────────────────────────────────────────────────────────────
// Workflow status machine actions (valid transitions)
// ─────────────────────────────────────────────────────────────────

const TRANSITIONS: Partial<Record<CaseStatus, { label: string; next: CaseStatus; color: string }[]>> = {
  "new":          [{ label: "Assign & Open", next: "assigned",       color: "#a78bfa" }],
  "assigned":     [{ label: "Start Review",  next: "under-review",   color: "#fbbf24" }],
  "under-review": [
    { label: "Escalate",    next: "escalated",         color: "#f97316" },
    { label: "Submit for Review", next: "pending-review", color: "#22d3ee" },
  ],
  "escalated":    [{ label: "Submit for Review", next: "pending-review", color: "#22d3ee" }],
  "pending-review": [
    { label: "Close — SAR Filed", next: "closed-substantiated", color: "#ef4444" },
    { label: "Close — Clear",     next: "closed-clear",          color: "#4ade80" },
  ],
};

// ─────────────────────────────────────────────────────────────────
// Case row
// ─────────────────────────────────────────────────────────────────

function CaseRow({ c, selected, onClick }: { c: InvestigationCase; selected: boolean; onClick: () => void }) {
  const sc = STATUS_CFG[c.status];
  const rc = RISK_CFG[c.risk];
  const isOverdue = new Date(c.dueDate) < new Date() && !c.status.startsWith("closed");
  return (
    <tr
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e: KeyboardEvent<HTMLTableRowElement>) => (e.key === "Enter" || e.key === " ") && onClick()}
      aria-selected={selected}
      style={{
        background: selected ? "#6366f110" : "transparent",
        borderBottom: "1px solid #1e293b",
        cursor: "pointer",
        outline: "none",
        transition: "background 0.15s",
      }}
    >
      <td style={{ padding: "10px 14px" }}>
        <code style={{ fontSize: 11, color: "#7dd3fc", fontFamily: "monospace" }}>{c.id}</code>
      </td>
      <td style={{ padding: "10px 14px", maxWidth: 240 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {TYPE_ICON[c.type]} {c.title}
        </div>
        {c.amount && <div style={{ fontSize: 10, color: "#64748b" }}>${c.amount.toLocaleString()} {c.currency}</div>}
      </td>
      <td style={{ padding: "10px 14px" }}>
        <Badge color={rc.color} bg={rc.bg}>{c.risk.toUpperCase()}</Badge>
      </td>
      <td style={{ padding: "10px 14px" }}>
        <Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge>
      </td>
      <td style={{ padding: "10px 14px", fontSize: 11, color: c.assignee ? "#94a3b8" : "#475569" }}>
        {c.assignee ?? <span style={{ color: "#ef4444", fontStyle: "italic" }}>Unassigned</span>}
      </td>
      <td style={{ padding: "10px 14px", fontSize: 11, color: isOverdue ? "#ef4444" : "#64748b", fontWeight: isOverdue ? 700 : 400 }}>
        {isOverdue ? "⚠ " : ""}{c.dueDate}
      </td>
      <td style={{ padding: "10px 14px" }}>
        <Badge color="#6366f1" bg="#312e81">{c.type}</Badge>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────
// Case detail panel
// ─────────────────────────────────────────────────────────────────

function CaseDetail({ c, onClose, onTransition }: {
  c: InvestigationCase;
  onClose: () => void;
  onTransition: (caseId: string, next: CaseStatus) => void;
}) {
  const [detailTab, setDetailTab] = useState<"overview" | "evidence" | "timeline" | "entities">("overview");
  const sc = STATUS_CFG[c.status];
  const rc = RISK_CFG[c.risk];
  const transitions = TRANSITIONS[c.status] ?? [];

  return (
    <div style={{
      width: 440, flexShrink: 0, background: "#1e293b", border: "1px solid #334155",
      borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "80vh",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #334155", background: "#0f172a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <code style={{ fontSize: 11, color: "#7dd3fc" }}>{c.id}</code>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", marginTop: 2, lineHeight: 1.4 }}>{c.title}</div>
          </div>
          <button onClick={onClose} aria-label="Close case detail" style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16, padding: 4 }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          <Badge color={rc.color} bg={rc.bg}>{c.risk.toUpperCase()} RISK</Badge>
          <Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge>
          <Badge color="#818cf8" bg="#312e81">{TYPE_ICON[c.type]} {c.type}</Badge>
          {c.amount && <Badge color="#22d3ee" bg="#164e63">${c.amount.toLocaleString()} {c.currency}</Badge>}
        </div>

        {/* Workflow actions */}
        {transitions.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {transitions.map(t => (
              <button
                key={t.next}
                onClick={() => onTransition(c.id, t.next)}
                style={{ background: t.color + "20", border: `1px solid ${t.color}`, color: t.color, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
              >{t.label} →</button>
            ))}
          </div>
        )}
      </div>

      {/* Inner tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #334155", background: "#0f172a" }}>
        {[
          { id: "overview", label: "Overview" },
          { id: "evidence", label: `Evidence (${c.evidence.length})` },
          { id: "timeline", label: `Timeline (${c.timeline.length})` },
          { id: "entities", label: `Entities (${c.entities.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setDetailTab(t.id as typeof detailTab)} style={{
            background: detailTab === t.id ? "#1e293b" : "none",
            border: "none", borderBottom: `2px solid ${detailTab === t.id ? "#6366f1" : "transparent"}`,
            color: detailTab === t.id ? "#f1f5f9" : "#64748b",
            padding: "8px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {detailTab === "overview" && (
          <div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, marginBottom: 14 }}>{c.description}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Investigator", value: c.assignee ?? "Unassigned" },
                { label: "Created", value: c.createdAt },
                { label: "Due Date", value: c.dueDate },
                { label: "Case Type", value: c.type },
              ].map(r => (
                <div key={r.label} style={{ background: "#0f172a", borderRadius: 6, padding: "8px 10px" }}>
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 500 }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {detailTab === "evidence" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {c.evidence.length === 0 ? (
              <div style={{ textAlign: "center", color: "#475569", fontSize: 12, padding: 20 }}>No evidence uploaded yet</div>
            ) : c.evidence.map(ev => (
              <div key={ev.id} style={{ background: "#0f172a", borderRadius: 8, padding: 10, display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{EVT_ICON[ev.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "#f1f5f9", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.name}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>Added by {ev.addedBy} · {ev.addedAt}{ev.size ? ` · ${ev.size}` : ""}</div>
                </div>
                <button style={{ background: "none", border: "1px solid #334155", borderRadius: 4, color: "#64748b", cursor: "pointer", fontSize: 10, padding: "2px 7px" }}>View</button>
              </div>
            ))}
            <button style={{ background: "#1e293b", border: "1px dashed #334155", borderRadius: 8, padding: 10, color: "#64748b", cursor: "pointer", fontSize: 12, width: "100%", textAlign: "center" }}>
              + Upload evidence
            </button>
          </div>
        )}

        {detailTab === "timeline" && (
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 11, top: 0, bottom: 0, width: 2, background: "#1e293b" }} />
            {c.timeline.map((entry, i) => (
              <div key={entry.id} style={{ display: "flex", gap: 12, marginBottom: 16, position: "relative" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#6366f1", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", zIndex: 1 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{entry.action}</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>{entry.actor} · {entry.timestamp}</div>
                  {entry.note && <div style={{ fontSize: 11, color: "#94a3b8", background: "#0f172a", padding: "5px 8px", borderRadius: 5, borderLeft: "2px solid #6366f1" }}>{entry.note}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {detailTab === "entities" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {c.entities.length === 0 ? (
              <div style={{ textAlign: "center", color: "#475569", fontSize: 12, padding: 20 }}>No linked entities</div>
            ) : c.entities.map(ent => (
              <div key={ent.id} style={{ background: "#0f172a", borderRadius: 8, padding: 10, border: `1px solid ${ent.flagged ? "#ef444430" : "#1e293b"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{ent.name}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{ent.kind} · {ent.detail}</div>
                  </div>
                  {ent.flagged && <Badge color="#ef4444" bg="#450a0a">Flagged</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Architecture code panels
// ─────────────────────────────────────────────────────────────────

const ARCH_SECTIONS = [
  {
    id: "rtk", color: "#6366f1", title: "RTK Query — Case API slice",
    code: `// store/caseApi.ts — complete case management API
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const caseApi = createApi({
  reducerPath: "caseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/v1/cases/",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("Authorization", \`Bearer \${token}\`);
      return headers;
    },
  }),
  tagTypes: ["Case", "CaseList"],

  endpoints: (builder) => ({

    // List with filters — tagged CaseList for bulk invalidation
    getCases: builder.query<CasePage, CaseFilters>({
      query: ({ status, risk, type, assignee, page, q }) => ({
        url: "",
        params: { status, risk, type, assignee, page, limit: 25, q },
      }),
      providesTags: ["CaseList"],
      serializeQueryArgs: ({ queryArgs }) => ({
        ...queryArgs,
        page: undefined, // don't re-fetch on page change — use keepPreviousData
      }),
    }),

    // Single case — tagged by ID
    getCase: builder.query<InvestigationCase, string>({
      query: (id) => id,
      providesTags: (result, err, id) => [{ type: "Case", id }],
    }),

    // Optimistic status transition
    transitionStatus: builder.mutation<InvestigationCase, { id: string; status: CaseStatus; note?: string }>({
      query: ({ id, status, note }) => ({
        url: \`\${id}/transitions\`,
        method: "POST",
        body: { status, note },
      }),
      // Invalidate both the single case and the list
      invalidatesTags: (result, err, { id }) => [
        { type: "Case", id },
        "CaseList",
      ],
      // Optimistic update — UI shows new status before server responds
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          caseApi.util.updateQueryData("getCase", id, (draft) => {
            draft.status = status;
            draft.timeline.push({
              id:     \`tmp-\${Date.now()}\`,
              action: \`Status → \${STATUS_LABELS[status]}\`,
              actor:  "You (optimistic)",
              timestamp: new Date().toISOString(),
            });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo(); // rollback on server error
        }
      },
    }),

    // Assign investigator
    assignCase: builder.mutation<void, { id: string; assigneeId: string }>({
      query: ({ id, assigneeId }) => ({
        url: \`\${id}/assign\`,
        method: "PATCH",
        body: { assigneeId },
      }),
      invalidatesTags: (result, err, { id }) => [{ type: "Case", id }, "CaseList"],
    }),
  }),
});

export const { useGetCasesQuery, useGetCaseQuery, useTransitionStatusMutation, useAssignCaseMutation } = caseApi;`,
  },
  {
    id: "xstate", color: "#f59e0b", title: "XState — Case Workflow State Machine",
    code: `// machines/caseWorkflow.machine.ts
// State machine prevents invalid transitions at the type level
import { createMachine, assign } from "xstate";

type CaseEvent =
  | { type: "ASSIGN";        assigneeId: string }
  | { type: "START_REVIEW" }
  | { type: "ESCALATE";      reason: string }
  | { type: "SUBMIT_REVIEW" }
  | { type: "CLOSE_FILED" }
  | { type: "CLOSE_CLEAR" };

export const caseWorkflowMachine = createMachine({
  id: "caseWorkflow",
  initial: "new",

  context: {
    assigneeId: null as string | null,
    escalationReason: null as string | null,
  },

  states: {
    new: {
      on: {
        ASSIGN: {
          target: "assigned",
          actions: assign({ assigneeId: ({ event }) => event.assigneeId }),
          // Guard: assignee must be from the allowed pool
          guard: ({ event }) => event.assigneeId !== undefined,
        },
      },
    },

    assigned: {
      on: {
        START_REVIEW: { target: "underReview" },
        // Can re-assign from assigned state
        ASSIGN: { actions: assign({ assigneeId: ({ event }) => event.assigneeId }) },
      },
    },

    underReview: {
      on: {
        ESCALATE: {
          target: "escalated",
          actions: assign({ escalationReason: ({ event }) => event.reason }),
        },
        SUBMIT_REVIEW: { target: "pendingReview" },
      },
    },

    escalated: {
      on: {
        SUBMIT_REVIEW: { target: "pendingReview" },
      },
    },

    pendingReview: {
      on: {
        CLOSE_FILED: { target: "closedSubstantiated" },
        CLOSE_CLEAR: { target: "closedClear" },
      },
    },

    closedSubstantiated: { type: "final" },
    closedClear:          { type: "final" },
  },
});

// Usage in component:
const [state, send] = useMachine(caseWorkflowMachine);

// TypeScript prevents invalid transitions at compile time:
send({ type: "CLOSE_FILED" });  // ✅ only valid in pendingReview
send({ type: "START_REVIEW" }); // ✅ only valid in assigned
// send({ type: "INVALID" });    // ❌ TypeScript error — not a valid event`,
  },
  {
    id: "rbac", color: "#10b981", title: "RBAC — Permission Hooks",
    code: `// hooks/usePermissions.ts — role-based access control
// Driven by JWT claims — no client-side trust issues (server validates too)

type Role = "investigator" | "supervisor" | "compliance-officer" | "auditor";

interface CasePermissions {
  canEdit:          boolean;  // edit description, notes, link entities
  canTransition:    boolean;  // change status
  canEscalate:      boolean;  // supervisor-only escalation
  canClose:         boolean;  // compliance-officer only
  canViewFinancials:boolean;  // auditors excluded by default
  canAssign:        boolean;  // supervisor and compliance-officer only
  canDeleteEvidence:boolean;  // only the uploader or supervisor
}

export function useCasePermissions(
  caseData: InvestigationCase | undefined,
  currentUser: CurrentUser
): CasePermissions {
  return useMemo(() => {
    if (!caseData) return EMPTY_PERMISSIONS;

    const { role, userId } = currentUser;
    const isAssigned = caseData.assigneeId === userId;
    const isClosed   = caseData.status.startsWith("closed");

    return {
      // Investigators can edit only their own cases
      canEdit: !isClosed && (
        role === "supervisor" ||
        role === "compliance-officer" ||
        (role === "investigator" && isAssigned)
      ),

      // Transitions follow the state machine — role also gated here
      canTransition: !isClosed && (
        role !== "auditor" && isAssigned || role === "supervisor"
      ),

      // Only supervisors can escalate
      canEscalate: role === "supervisor" && caseData.status === "under-review",

      // Only compliance officers can close cases
      canClose: role === "compliance-officer" && caseData.status === "pending-review",

      // Auditors cannot see dollar amounts (data classification)
      canViewFinancials: role !== "auditor",

      // Only supervisors and compliance officers can re-assign
      canAssign: role === "supervisor" || role === "compliance-officer",

      // Uploader or supervisor can delete evidence
      canDeleteEvidence: (evidence: Evidence) =>
        evidence.uploadedBy === userId || role === "supervisor",
    };
  }, [caseData, currentUser]);
}

// Usage in component:
const permissions = useCasePermissions(caseData, currentUser);

return (
  <div>
    {permissions.canTransition && <TransitionButtons />}
    {permissions.canViewFinancials && <AmountDisplay amount={caseData.amount} />}
    {permissions.canClose && <CloseActions />}
  </div>
);`,
  },
  {
    id: "virtual", color: "#0891b2", title: "TanStack Virtual — 50K Cases",
    code: `// components/CaseList/VirtualCaseList.tsx
// Renders 50,000+ cases without layout jank

import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteQuery } from "@tanstack/react-query";

const ROW_HEIGHT = 56;  // px — fixed height for simple virtualizer

export function VirtualCaseList({ filters }: { filters: CaseFilters }) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Infinite query — fetches pages of 25 as user scrolls
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["cases", filters],
      queryFn: ({ pageParam }) => fetchCases({ ...filters, cursor: pageParam }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  const allCases = data?.pages.flatMap(p => p.cases) ?? [];
  const caseCount = data?.pages[0]?.total ?? 0;

  // Virtualizer: only renders visible rows + overscan buffer
  const rowVirtualizer = useVirtualizer({
    count:         hasNextPage ? allCases.length + 1 : allCases.length,
    getScrollElement: () => parentRef.current,
    estimateSize:  () => ROW_HEIGHT,
    overscan:      5,
  });

  // Auto-fetch next page when last item enters viewport
  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;
    if (lastItem.index >= allCases.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [rowVirtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage, allCases.length]);

  return (
    <div ref={parentRef} style={{ height: "600px", overflow: "auto" }}>
      <div style={{ height: \`\${rowVirtualizer.getTotalSize()}px\`, position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map(virtualItem => {
          const isLoader = virtualItem.index > allCases.length - 1;
          const caseItem = allCases[virtualItem.index];

          return (
            <div
              key={virtualItem.index}
              style={{
                position: "absolute",
                top:    virtualItem.start,
                left:   0, right: 0,
                height: ROW_HEIGHT,
              }}
            >
              {isLoader
                ? <LoadingRow />
                : <CaseRow case={caseItem} />
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Renders ~10 DOM nodes for 50,000 records — 60fps scroll guaranteed`,
  },
];

const ADR_LIST = [
  {
    id: "ADR-001", title: "Adopt RTK Query for all server state", status: "Accepted", date: "2024-01-15",
    context: "Multiple data fetching libraries were in consideration: SWR, React Query, RTK Query, plain Redux thunks.",
    decision: "Adopt RTK Query as the single data fetching and caching layer, co-located with Redux state.",
    rationale: ["Project already uses Redux for complex local state (case workflow, filters). RTK Query integrates natively — one store, one DevTools.", "Tag-based cache invalidation fits complex case relationships (update one case → invalidate list).", "Optimistic updates are built-in and type-safe. Critical for status transitions.", "generateEntityAdapters normalize case data — O(1) lookups by ID for 50k+ case lists."],
    consequences: "Bundle slightly larger (~40kB) than SWR. Team must learn RTK Query API. Accepted trade-off for consistency.",
  },
  {
    id: "ADR-002", title: "Use XState for case workflow state machine", status: "Accepted", date: "2024-01-22",
    context: "Case workflow has 7 statuses and complex transition rules. Initial implementation used boolean flags and conditional rendering — became unmaintainable with role-based restrictions.",
    decision: "Model case workflow as an XState state machine. All valid transitions encoded in the machine definition.",
    rationale: ["Invalid transitions are impossible at the type level — TypeScript errors before runtime.", "Visual state machine diagram auto-generated from machine definition — design documentation for free.", "Guards (isAssigned, hasRole) co-located with transitions — single source of truth.", "Testable with @xstate/test — generates test paths from machine definition."],
    consequences: "XState v5 API. Learning curve for engineers unfamiliar with state machines. Added 3 days for team onboarding.",
  },
  {
    id: "ADR-003", title: "Module federation: each domain is a separate MFE", status: "Accepted", date: "2024-02-01",
    context: "Four domain teams: Case Management, Entity Graph, Reporting, Administration. Risk of team coupling if all in one repo.",
    decision: "Each domain team owns a Module Federation remote. Host shell composes them. Shared UI library published to npm.",
    rationale: ["Independent deployments — Reporting team can ship without waiting for Case Management.", "Team autonomy — each remote has its own pipeline, lint rules within agreed standards.", "Shared-ui package enforces design consistency without tight coupling.", "Runtime federation — remotes loaded on demand, reducing initial bundle."],
    consequences: "Network requests for remote loading. TypeScript across remotes requires type stubs. Complexity in shared dependency version alignment.",
  },
  {
    id: "ADR-004", title: "TanStack Virtual for case list — reject React Window", status: "Accepted", date: "2024-02-10",
    context: "Case list can contain 50,000+ cases. Rendering all rows causes 15-second initial paint and 40ms+ scroll frames.",
    decision: "Use @tanstack/react-virtual v3 for row virtualization combined with infinite cursor-based pagination.",
    rationale: ["TanStack Virtual has no opinionated DOM structure — works with our table component.", "Dynamic row heights supported (needed for case list expansion panels).", "react-window (alternative) requires fixed dimensions and lacks infinite scroll primitives.", "Combined with infinite query: only 25 cases fetched, only ~10 rows rendered, regardless of total count."],
    consequences: "Requires ref-based scroll container. Row height estimation must be accurate or causes scroll jank. Scroll restoration on navigation requires explicit implementation.",
  },
];

// ─────────────────────────────────────────────────────────────────
// Main Demo Component
// ─────────────────────────────────────────────────────────────────

export function CaseManagementDemo() {
  const [activeTab, setActiveTab] = useState<"cases" | "arch" | "adr">("cases");
  const [cases, setCases]         = useState<InvestigationCase[]>(CASES);
  const [selectedId, setSelectedId] = useState<string | null>("CASE-2024-08391");
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<CaseStatus | "all">("all");
  const [filterRisk, setFilterRisk]     = useState<RiskLevel | "all">("all");
  const [filterType, setFilterType]     = useState<CaseType | "all">("all");
  const [archKey, setArchKey]     = useState<string>("rtk");
  const [expandedAdr, setExpandedAdr] = useState<string | null>("ADR-001");

  const filtered = useMemo(() => cases.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.id.includes(search)) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterRisk   !== "all" && c.risk   !== filterRisk)   return false;
    if (filterType   !== "all" && c.type   !== filterType)   return false;
    return true;
  }), [cases, search, filterStatus, filterRisk, filterType]);

  const selectedCase = cases.find(c => c.id === selectedId) ?? null;

  const handleTransition = useCallback((caseId: string, next: CaseStatus) => {
    setCases(prev => prev.map(c => c.id !== caseId ? c : {
      ...c,
      status: next,
      timeline: [...c.timeline, {
        id:     `tl-${Date.now()}`,
        action: `Status → ${STATUS_CFG[next].label}`,
        actor:  "You (demo)",
        timestamp: new Date().toLocaleString("en", { dateStyle: "short", timeStyle: "short" }),
      }],
    }));
  }, []);

  const activeArch = ARCH_SECTIONS.find(s => s.id === archKey)!;

  return (
    <div style={{
      background: "#0f172a", color: "#f1f5f9",
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: "100vh", padding: 24,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🗂</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Case Management — Financial Investigation Platform</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Greenfield platform · Frontend architecture lead · AML · SAR · Fraud · OFAC · KYC
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Greenfield", "RTK Query", "XState workflow", "RBAC", "TanStack Virtual", "Module Federation", "ADR process", "XFN alignment"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "cases" as const, label: "🗂 Case Dashboard" },
          { id: "arch"  as const, label: "🏗 Architecture" },
          { id: "adr"   as const, label: "📝 ADRs" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 18px",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Case Dashboard ── */}
      {activeTab === "cases" && (
        <div>
          {/* Stats bar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { label: "Total cases", value: String(cases.length), color: "#818cf8" },
              { label: "Critical",    value: String(cases.filter(c => c.risk === "critical").length), color: "#ef4444" },
              { label: "Escalated",   value: String(cases.filter(c => c.status === "escalated").length), color: "#f97316" },
              { label: "Unassigned",  value: String(cases.filter(c => !c.assignee).length), color: "#fbbf24" },
              { label: "Due today",   value: String(cases.filter(c => c.dueDate === new Date().toISOString().slice(0,10)).length), color: "#22d3ee" },
            ].map(s => (
              <div key={s.label} style={{ background: "#1e293b", border: `1px solid ${s.color}20`, borderRadius: 8, padding: "8px 14px" }}>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 1 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="search" placeholder="Search cases, IDs..."
              value={search} onChange={e => setSearch(e.target.value)}
              aria-label="Search cases"
              style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "6px 12px", color: "#f1f5f9", fontSize: 12, width: 200, outline: "none" }}
            />
            {[
              { label: "Status", value: filterStatus, setter: setFilterStatus as (v: string) => void, options: [["all","All statuses"], ...Object.entries(STATUS_CFG).map(([k,v]) => [k, v.label])] },
              { label: "Risk",   value: filterRisk,   setter: setFilterRisk as (v: string) => void,   options: [["all","All risks"], ["critical","Critical"], ["high","High"], ["medium","Medium"], ["low","Low"]] },
              { label: "Type",   value: filterType,   setter: setFilterType as (v: string) => void,   options: [["all","All types"], ["AML","AML"], ["SAR","SAR"], ["FRAUD","Fraud"], ["KYC","KYC"], ["OFAC","OFAC"]] },
            ].map(f => (
              <select key={f.label} value={f.value} onChange={e => f.setter(e.target.value)}
                aria-label={`Filter by ${f.label}`}
                style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#f1f5f9", padding: "5px 10px", fontSize: 12 }}>
                {f.options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
              </select>
            ))}
            <span style={{ fontSize: 11, color: "#64748b", marginLeft: "auto" }}>{filtered.length} cases</span>
          </div>

          {/* Table + detail */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#0f172a" }}>
                    {["Case ID", "Title / Amount", "Risk", "Status", "Assignee", "Due", "Type"].map(h => (
                      <th key={h} style={{ padding: "9px 14px", textAlign: "left", color: "#64748b", fontWeight: 700, borderBottom: "2px solid #334155", whiteSpace: "nowrap", fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <CaseRow
                      key={c.id} c={c}
                      selected={selectedId === c.id}
                      onClick={() => setSelectedId(prev => prev === c.id ? null : c.id)}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#475569", fontSize: 13 }}>No cases match your filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedCase && (
              <CaseDetail
                c={selectedCase}
                onClose={() => setSelectedId(null)}
                onTransition={handleTransition}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Architecture ── */}
      {activeTab === "arch" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {ARCH_SECTIONS.map(s => (
              <button key={s.id} onClick={() => setArchKey(s.id)} style={{
                background: archKey === s.id ? s.color + "20" : "#1e293b",
                border: `1px solid ${archKey === s.id ? s.color : "#334155"}`,
                borderRadius: 6, padding: "5px 12px",
                color: archKey === s.id ? s.color : "#64748b",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
              }}>{s.title.split("—")[0].trim()}</button>
            ))}
          </div>
          <div style={{ background: "#1e293b", border: `1px solid ${activeArch.color}30`, borderTop: `3px solid ${activeArch.color}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: "#0f172a", borderBottom: "1px solid #334155", fontSize: 11, color: "#64748b" }}>
              {activeArch.title}
            </div>
            <pre style={{ margin: 0, padding: 16, fontSize: 11, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 520 }}>
              <code>{activeArch.code}</code>
            </pre>
          </div>
        </div>
      )}

      {/* ── ADRs ── */}
      {activeTab === "adr" && (
        <div style={{ maxWidth: 860 }}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>
            Architecture Decision Records — written as part of the RFC process I introduced to align 4 cross-functional teams. Each ADR captures the context, decision, and consequences at the time of the choice.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ADR_LIST.map(adr => {
              const isOpen = expandedAdr === adr.id;
              return (
                <div key={adr.id} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
                  <button
                    onClick={() => setExpandedAdr(isOpen ? null : adr.id)}
                    aria-expanded={isOpen}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      background: "none", border: "none", padding: "14px 16px",
                      cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <code style={{ fontSize: 11, color: "#7dd3fc", fontFamily: "monospace", flexShrink: 0 }}>{adr.id}</code>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{adr.title}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{adr.date}</div>
                    </div>
                    <Badge color="#4ade80" bg="#052e16">{adr.status}</Badge>
                    <span style={{ color: "#64748b", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: "0 16px 16px", borderTop: "1px solid #334155" }}>
                      {[
                        { label: "Context", text: adr.context },
                        { label: "Decision", text: adr.decision },
                      ].map(s => (
                        <div key={s.label} style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 4 }}>{s.label}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{s.text}</div>
                        </div>
                      ))}
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 6 }}>Rationale</div>
                        {adr.rationale.map((r, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "#94a3b8" }}>
                            <span style={{ color: "#4ade80", flexShrink: 0 }}>✓</span>{r}
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 12, background: "#0f172a", borderRadius: 6, padding: 10, fontSize: 12, color: "#64748b", borderLeft: "3px solid #f59e0b" }}>
                        <span style={{ color: "#f59e0b", fontWeight: 700 }}>Consequences: </span>{adr.consequences}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseManagementDemo;
