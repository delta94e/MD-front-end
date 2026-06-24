/**
 * RiotEsportsOpsDemo.tsx
 *
 * Lead Developer — Riot Games Esports
 * Next.js Operator Tools | Global Power Rankings | Graph Tournament Editor | 0 Major Incidents
 *
 * TABS
 *   🎮 Game Day Ops        — Live operator dashboard: match automation, DR controls, data mapping
 *   🏆 Power Rankings      — lolesports.com/gpr — Next.js ISR, region filtering, team cards
 *   🌐 Tournament Editor   — Graph-based bracket builder: nodes, edges, complex tournament formats
 *   📊 Reliability         — 0 major incidents story: validation engine, audit log, migration metrics
 */

import React, { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
// Riot / LoL design tokens
// ─────────────────────────────────────────────────────────────────
const R = {
  bg:        "#0A0E1A",
  surface:   "#0d1117",
  surface2:  "#161B27",
  surface3:  "#1C2333",
  border:    "#1E2D3D",
  gold:      "#C89B3C",
  goldLight: "#F0E6BE",
  blue:      "#0BC4E3",
  purple:    "#7B5EA7",
  green:     "#1DB954",
  red:       "#FF4655",
  yellow:    "#F0B429",
  text:      "#C8AA6E",
  textDim:   "#785A28",
  textBright:"#F0E6BE",
  textMuted: "#5B5A56",
  mono:      "'JetBrains Mono', monospace",
};

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type MatchStatus = "scheduled" | "in_progress" | "completed" | "failed";
type DrStatus    = "healthy"   | "degraded"    | "down";

interface EsportsMatch {
  id:        string;
  team1:     string;
  team2:     string;
  time:      string;
  status:    MatchStatus;
  automated: boolean;
  gameNum:   number;
}

interface DrSystem {
  id:      string;
  name:    string;
  status:  DrStatus;
  latency: number;
}

interface GPRTeam {
  rank:     number;
  prevRank: number;
  name:     string;
  abbrev:   string;
  region:   string;
  points:   number;
  wins:     number;
  losses:   number;
  color:    string;
}

// ─────────────────────────────────────────────────────────────────
// Graph tournament editor types
// ─────────────────────────────────────────────────────────────────

interface GraphNode {
  id:       string;
  type:     "group" | "match" | "final";
  label:    string;
  x:        number;
  y:        number;
  teams:    number;
  capacity: number;
  advance:  number;
}

interface GraphEdge {
  id:    string;
  from:  string;
  to:    string;
  label: string;
}

// ─────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────

const INIT_MATCHES: EsportsMatch[] = [
  { id: "m1", team1: "T1",    team2: "Gen.G",   time: "13:00", status: "completed",   automated: true,  gameNum: 3 },
  { id: "m2", team1: "NRG",   team2: "Cloud9",  time: "15:30", status: "in_progress", automated: true,  gameNum: 1 },
  { id: "m3", team1: "G2",    team2: "Fnatic",  time: "17:00", status: "scheduled",   automated: true,  gameNum: 1 },
  { id: "m4", team1: "BLG",   team2: "JDG",     time: "19:30", status: "scheduled",   automated: false, gameNum: 1 },
];

const DR_SYSTEMS: DrSystem[] = [
  { id: "s1", name: "Match Data API",      status: "healthy",  latency: 42  },
  { id: "s2", name: "Lobby Service",       status: "healthy",  latency: 18  },
  { id: "s3", name: "Score Sync",          status: "degraded", latency: 340 },
  { id: "s4", name: "Broadcast Feed",      status: "healthy",  latency: 67  },
  { id: "s5", name: "Stats Pipeline",      status: "healthy",  latency: 89  },
  { id: "s6", name: "Fan-facing CDN",      status: "healthy",  latency: 24  },
];

const GPR_TEAMS: GPRTeam[] = [
  { rank: 1, prevRank: 1, name: "T1",            abbrev: "T1",    region: "LCK",  points: 2400, wins: 24, losses: 3,  color: "#C89B3C" },
  { rank: 2, prevRank: 3, name: "Bilibili Gaming",abbrev: "BLG",  region: "LPL",  points: 2280, wins: 22, losses: 5,  color: "#1B73E8" },
  { rank: 3, prevRank: 2, name: "Gen.G",          abbrev: "GEN",   region: "LCK",  points: 2250, wins: 21, losses: 6,  color: "#1E90FF" },
  { rank: 4, prevRank: 5, name: "JDG Gaming",     abbrev: "JDG",   region: "LPL",  points: 2100, wins: 20, losses: 7,  color: "#FF6B35" },
  { rank: 5, prevRank: 4, name: "G2 Esports",     abbrev: "G2",    region: "LEC",  points: 1980, wins: 18, losses: 9,  color: "#BFFF00" },
  { rank: 6, prevRank: 7, name: "Cloud9",         abbrev: "C9",    region: "LCS",  points: 1750, wins: 15, losses: 12, color: "#1DA1F2" },
  { rank: 7, prevRank: 6, name: "Fnatic",         abbrev: "FNC",   region: "LEC",  points: 1680, wins: 14, losses: 13, color: "#FF6600" },
  { rank: 8, prevRank: 8, name: "NRG Esports",    abbrev: "NRG",   region: "LCS",  points: 1560, wins: 13, losses: 14, color: "#E63946" },
];

const INIT_NODES: GraphNode[] = [
  { id: "n1", type: "group", label: "Group A",        x: 20,  y: 60,  teams: 4, capacity: 4, advance: 2 },
  { id: "n2", type: "group", label: "Group B",        x: 20,  y: 200, teams: 4, capacity: 4, advance: 2 },
  { id: "n3", type: "match", label: "Quarterfinal 1", x: 280, y: 80,  teams: 2, capacity: 2, advance: 1 },
  { id: "n4", type: "match", label: "Quarterfinal 2", x: 280, y: 200, teams: 2, capacity: 2, advance: 1 },
  { id: "n5", type: "match", label: "Semifinal",      x: 500, y: 140, teams: 2, capacity: 2, advance: 1 },
  { id: "n6", type: "final", label: "Grand Final",   x: 680, y: 140, teams: 2, capacity: 2, advance: 1 },
];

const INIT_EDGES: GraphEdge[] = [
  { id: "e1", from: "n1", to: "n3", label: "1st"   },
  { id: "e2", from: "n2", to: "n3", label: "2nd"   },
  { id: "e3", from: "n1", to: "n4", label: "2nd"   },
  { id: "e4", from: "n2", to: "n4", label: "1st"   },
  { id: "e5", from: "n3", to: "n5", label: "Winner" },
  { id: "e6", from: "n4", to: "n5", label: "Winner" },
  { id: "e7", from: "n5", to: "n6", label: "Winner" },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeSnip({ code, label, color = R.blue }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#060810", border: `1px solid ${R.border}`, borderRadius: 8, overflow: "hidden" }}>
      {label && <div style={{ padding: "4px 12px", borderBottom: `1px solid ${R.border}`, fontSize: 9, color, fontFamily: R.mono }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 8.5, fontFamily: R.mono, color: "#8892a4", lineHeight: 1.7, overflow: "auto", maxHeight: 340, whiteSpace: "pre-wrap" }}>{code}</pre>
    </div>
  );
}

const STATUS_COLOR: Record<MatchStatus, string> = {
  scheduled: R.textMuted, in_progress: R.blue, completed: R.green, failed: R.red,
};
const DR_COLOR: Record<DrStatus, string> = {
  healthy: R.green, degraded: R.yellow, down: R.red,
};
const NODE_COLOR: Record<GraphNode["type"], string> = {
  group: R.purple, match: R.blue, final: R.gold,
};
const NODE_BG: Record<GraphNode["type"], string> = {
  group: `${R.purple}25`, match: `${R.blue}20`, final: `${R.gold}20`,
};

// ─────────────────────────────────────────────────────────────────
// Graph Editor helpers
// ─────────────────────────────────────────────────────────────────

function edgePath(nodes: GraphNode[], from: string, to: string) {
  const s = nodes.find(n => n.id === from);
  const t = nodes.find(n => n.id === to);
  if (!s || !t) return "";
  const sx = s.x + 120, sy = s.y + 28;
  const tx = t.x,       ty = t.y + 28;
  const cx = (sx + tx) / 2;
  return `M ${sx} ${sy} C ${cx} ${sy} ${cx} ${ty} ${tx} ${ty}`;
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

export function RiotEsportsOpsDemo() {
  const [tab, setTab] = useState<"ops" | "gpr" | "graph" | "reliability">("ops");

  // ── Game Day Ops state ─────────────────────────────────────────
  const [matches, setMatches]         = useState<EsportsMatch[]>(INIT_MATCHES);
  const [drSystems]                   = useState<DrSystem[]>(DR_SYSTEMS);
  const [drMode, setDrMode]           = useState(false);
  const [auditLog, setAuditLog]       = useState<string[]>([]);
  const [dataMapStep, setDataMapStep] = useState(0);

  // ── GPR state ─────────────────────────────────────────────────
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [isrTimestamp, setIsrTimestamp] = useState("2024-06-18 12:30 UTC");

  // ── Graph state ────────────────────────────────────────────────
  const [nodes, setNodes]             = useState<GraphNode[]>(INIT_NODES);
  const [edges, setEdges]             = useState<GraphEdge[]>(INIT_EDGES);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);

  // ── Reliability state ─────────────────────────────────────────
  const [incidentYear, setIncidentYear] = useState<2023 | 2024>(2024);
  const [migPct, setMigPct]           = useState(100);
  const [runbookStep, setRunbookStep] = useState(-1);

  // Live match progress simulation
  useEffect(() => {
    const id = setInterval(() => {
      setMatches(ms => ms.map(m =>
        m.id === "m2" && m.status === "in_progress"
          ? { ...m, gameNum: Math.min(m.gameNum, 3) }
          : m
      ));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const advanceMatch = (id: string) => {
    setMatches(ms => ms.map(m => {
      if (m.id !== id) return m;
      const next: MatchStatus = m.status === "scheduled" ? "in_progress" : m.status === "in_progress" ? "completed" : m.status;
      setAuditLog(l => [`[${new Date().toLocaleTimeString()}] ${m.team1} vs ${m.team2} → ${next.replace("_", " ")}`, ...l.slice(0, 9)]);
      return { ...m, status: next };
    }));
  };

  const addNode = (type: GraphNode["type"]) => {
    const id = `n${Date.now()}`;
    const labels: Record<GraphNode["type"], string> = {
      group: "New Group", match: "New Match", final: "Final",
    };
    setNodes(ns => [...ns, { id, type, label: labels[type], x: 150, y: 60 + ns.length * 40, teams: type === "group" ? 4 : 2, capacity: type === "group" ? 4 : 2, advance: 1 }]);
  };

  const handleNodeClick = (nodeId: string) => {
    if (connectMode) {
      if (!connectFrom) { setConnectFrom(nodeId); return; }
      if (connectFrom !== nodeId) {
        const id = `e${Date.now()}`;
        setEdges(es => [...es, { id, from: connectFrom, to: nodeId, label: "→" }]);
      }
      setConnectFrom(null);
      setConnectMode(false);
    } else {
      setSelectedNode(selectedNode === nodeId ? null : nodeId);
    }
  };

  const deleteNode = (id: string) => {
    setNodes(ns => ns.filter(n => n.id !== id));
    setEdges(es => es.filter(e => e.from !== id && e.to !== id));
    setSelectedNode(null);
  };

  const filteredTeams = regionFilter === "ALL"
    ? GPR_TEAMS
    : GPR_TEAMS.filter(t => t.region === regionFilter);

  const RUNBOOK = [
    "1. Verify all DR systems health",
    "2. Switch Score Sync to backup endpoint",
    "3. Enable manual result entry mode",
    "4. Notify broadcast team of degraded mode",
    "5. Pause automated lobby creation",
    "6. Confirm fan-facing display still live",
  ];

  const DATA_MAP_STAGES = [
    { label: "Raw league data", icon: "📥", detail: "Teams, schedules from regional provider APIs (LCK, LPL, LEC, LCS)" },
    { label: "Schema validation",icon: "✅", detail: "Zod schemas validate incoming data — missing fields or wrong types surface immediately" },
    { label: "Canonical mapping", icon: "🔄", detail: "Regional team IDs → internal Riot team IDs. Schedule times → UTC. Player aliases → canonical names." },
    { label: "Conflict detection",icon: "⚠️", detail: "Detect data conflicts: same match_id with different scores, duplicate player entries" },
    { label: "Operator review",   icon: "👤", detail: "Ambiguous mappings surfaced to operator for manual resolution before processing" },
    { label: "Published",         icon: "🚀", detail: "Clean, validated, mapped data written to production — powers brackets, GPR, fan apps" },
  ];

  const TABS = [
    { id: "ops"         as const, label: "🎮 Game Day Ops"      },
    { id: "gpr"         as const, label: "🏆 Power Rankings"    },
    { id: "graph"       as const, label: "🌐 Tournament Editor" },
    { id: "reliability" as const, label: "📊 Reliability"       },
  ];

  return (
    <div style={{ background: R.bg, color: R.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${R.gold}, ${R.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⚔️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: R.textBright, letterSpacing: "-0.02em" }}>Riot Games Esports — Operator Tools & lolesports.com</h1>
            <p style={{ margin: 0, fontSize: 11, color: R.textDim }}>Next.js · Game Day Automation · Global Power Rankings · Graph Tournament Editor · 0 Major Incidents 2024</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "0",       l: "Major incidents 2024",   c: R.green,  sub: "↓ 50% from 2023 · automation + validation" },
            { v: "Next.js", l: "Operator tooling",       c: R.blue,   sub: "SSR + ISR · game day ops · DR automation"  },
            { v: "Graph",   l: "Tournament editor",      c: R.purple, sub: "React Flow nodes/edges · complex brackets"  },
            { v: "GPR",     l: "Global Power Rankings",  c: R.gold,   sub: "lolesports.com/gpr · LoL esports fans"      },
          ].map(m => (
            <div key={m.l} style={{ background: R.surface, border: `1px solid ${R.border}`, borderLeft: `3px solid ${m.c}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: R.textBright }}>{m.l}</div>
              <div style={{ fontSize: 7, color: R.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${R.border}`, paddingBottom: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? R.surface2 : "transparent", color: tab === t.id ? R.textBright : R.textMuted, border: tab === t.id ? `1px solid ${R.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{t.label}</button>
        ))}
      </div>

      {/* ── GAME DAY OPS ── */}
      {tab === "ops" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: R.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>GAME DAY OPERATOR DASHBOARD</div>

            {/* Match queue */}
            <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: R.textMuted }}>MATCH QUEUE — LCS Summer 2024</div>
                <div style={{ fontSize: 8, color: R.blue }}>⬤ LIVE</div>
              </div>
              {matches.map(m => (
                <div key={m.id} style={{ background: R.surface2, border: `1px solid ${m.status === "in_progress" ? R.blue + "50" : m.status === "failed" ? R.red + "50" : R.border}`, borderRadius: 8, padding: "9px 11px", marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: R.textBright }}>{m.team1}</span>
                      <span style={{ fontSize: 8, color: R.textMuted }}>vs</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: R.textBright }}>{m.team2}</span>
                      <span style={{ fontSize: 8, color: R.textMuted }}>{m.time}</span>
                      {m.status === "in_progress" && <span style={{ fontSize: 7, color: R.blue, fontFamily: R.mono }}>Game {m.gameNum}</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 7, color: m.automated ? R.green : R.yellow }}>{m.automated ? "🤖 AUTO" : "👤 MANUAL"}</span>
                      <span style={{ fontSize: 7, background: `${STATUS_COLOR[m.status]}20`, color: STATUS_COLOR[m.status], borderRadius: 3, padding: "1px 6px", fontWeight: 700, textTransform: "uppercase" }}>{m.status.replace("_", " ")}</span>
                    </div>
                  </div>
                  {(m.status === "scheduled" || m.status === "in_progress") && (
                    <button onClick={() => advanceMatch(m.id)} style={{ fontSize: 8, background: R.blue, border: "none", borderRadius: 5, padding: "3px 10px", color: "#fff", cursor: "pointer" }}>
                      {m.status === "scheduled" ? "▶ Start Match" : "✓ Record Result"}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* DR panel */}
            <div style={{ background: R.surface, border: `1px solid ${drMode ? R.yellow + "40" : R.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: R.textMuted }}>DISASTER RECOVERY SYSTEMS</div>
                <button onClick={() => setDrMode(d => !d)} style={{ fontSize: 8, background: drMode ? R.yellow : "transparent", border: `1px solid ${drMode ? R.yellow : R.border}`, borderRadius: 5, padding: "3px 10px", color: drMode ? "#000" : R.textMuted, cursor: "pointer", fontWeight: drMode ? 700 : 400 }}>
                  {drMode ? "⚠ DR MODE ACTIVE" : "Enable DR Mode"}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {drSystems.map(s => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", background: R.surface2, borderRadius: 6, border: `1px solid ${s.status !== "healthy" ? DR_COLOR[s.status] + "40" : R.border}` }}>
                    <span style={{ fontSize: 8, color: R.text }}>{s.name}</span>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <span style={{ fontSize: 7, fontFamily: R.mono, color: s.latency > 200 ? R.yellow : R.textMuted }}>{s.latency}ms</span>
                      <span style={{ fontSize: 7, color: DR_COLOR[s.status], fontWeight: 700 }}>{s.status === "healthy" ? "✓" : s.status === "degraded" ? "⚠" : "✗"}</span>
                    </div>
                  </div>
                ))}
              </div>
              {drMode && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: R.yellow, marginBottom: 4 }}>DR RUNBOOK — click to execute steps</div>
                  {RUNBOOK.map((step, i) => (
                    <div key={i} onClick={() => setRunbookStep(i)} style={{ padding: "4px 8px", borderLeft: `2px solid ${runbookStep >= i ? R.green : R.border}`, background: runbookStep === i ? `${R.green}10` : "transparent", cursor: "pointer", fontSize: 8, color: runbookStep >= i ? R.green : R.textMuted, marginBottom: 2 }}>
                      {runbookStep > i ? "✓ " : ""}{step}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Data mapping */}
            <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: R.textMuted, marginBottom: 8 }}>DATA MAPPING PIPELINE — click to advance</div>
              <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
                {DATA_MAP_STAGES.map((s, i) => (
                  <React.Fragment key={s.label}>
                    <div onClick={() => setDataMapStep(i)} style={{ flex: 1, textAlign: "center", cursor: "pointer" }}>
                      <div style={{ fontSize: 14, marginBottom: 2 }}>{s.icon}</div>
                      <div style={{ fontSize: 6, color: i <= dataMapStep ? R.gold : R.textMuted, fontWeight: i <= dataMapStep ? 700 : 400, lineHeight: 1.3 }}>{s.label}</div>
                    </div>
                    {i < DATA_MAP_STAGES.length - 1 && <div style={{ fontSize: 10, color: i < dataMapStep ? R.gold : R.border, flexShrink: 0 }}>→</div>}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ marginTop: 8, padding: "7px 10px", background: R.surface2, borderRadius: 6, fontSize: 8, color: R.text, lineHeight: 1.5 }}>
                <strong style={{ color: DATA_MAP_STAGES[dataMapStep].icon.includes("⚠") ? R.yellow : R.gold }}>{DATA_MAP_STAGES[dataMapStep].label}:</strong>{" "}
                {DATA_MAP_STAGES[dataMapStep].detail}
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: R.textMuted, marginBottom: 0, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>

              {/* Audit log */}
              <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: R.textMuted, marginBottom: 5 }}>🔍 OPERATOR AUDIT LOG (immutable — advance matches to populate)</div>
                {auditLog.length === 0 ? (
                  <div style={{ fontSize: 8, color: R.textMuted, fontStyle: "italic" }}>No events yet — click "Start Match" or "Record Result" above</div>
                ) : auditLog.map((l, i) => (
                  <div key={i} style={{ fontSize: 8, fontFamily: R.mono, color: R.green, lineHeight: 1.6 }}>{l}</div>
                ))}
              </div>

              <CodeSnip color={R.gold} label="Next.js Operator App — game day automation architecture" code={
`// WHAT "GAME DAY OPERATIONS" MEANS:
// League of Legends Esports broadcast day:
// - Operators run 4-10 matches across different stages.
// - Each match: create lobby → load teams → start game → record result → advance bracket.
// - Before automation: every step was MANUAL. Human error = broadcast incident.
// - After automation: operator APPROVES actions, system executes them.
//
// AUTOMATION ARCHITECTURE (Next.js + Server Actions):
//
// Match state machine:
// SCHEDULED → IN_LOBBY → CHAMPION_SELECT → IN_GAME → COMPLETED → BRACKET_ADVANCED
//
// Each transition: triggered by operator approval OR auto-triggered from game client signals.
//
// "use server"
// async function advanceMatchStatus(matchId: string, to: MatchStatus) {
//   // 1. Validate: is this transition legal?
//   const current = await getMatch(matchId);
//   const valid = VALID_TRANSITIONS[current.status];
//   if (!valid.includes(to)) throw new Error(\`Invalid transition: \${current.status} → \${to}\`);
//
//   // 2. Pre-flight checks:
//   if (to === "IN_LOBBY") {
//     const teamsReady = await verifyTeamsEnrolled(matchId);
//     if (!teamsReady) throw new Error("Teams not enrolled — cannot create lobby");
//   }
//
//   // 3. Execute the action (call Riot internal game API)
//   await riotGameApi.createLobby(matchId);
//
//   // 4. Write immutable audit record
//   await auditLog.append({
//     matchId, action: "STATUS_CHANGE",
//     from: current.status, to,
//     operatorId: getCurrentOperator(),
//     timestamp: new Date().toISOString(),
//   });
//
//   // 5. Revalidate Next.js cache for operator dashboard
//   revalidatePath("/ops/game-day");
// }
//
// WHY NEXT.JS FOR OPERATOR TOOLING?
// "We need server-side validation on every state transition.
//  We need real-time UI updates when match state changes.
//  We need ISR for read-heavy dashboards and RSC for reducing client JS.
//  Next.js Server Actions: form submissions that call server-side logic directly.
//  No separate API layer to maintain. No client-server serialization layer.
//  For an internal tool used by 50 operators: this simplicity is a feature."`} />

              <CodeSnip color={R.red} label="Disaster Recovery — how the frontend handles system degradation" code={
`// DISASTER RECOVERY IN AN ESPORTS CONTEXT:
//
// The failure scenario:
// A match is live. 30,000 viewers watching. Score Sync goes down.
// Without DR: operator cannot record the match result.
//             Bracket doesn't advance. Broadcast stalls.
//             This was a "major incident" in 2023.
//
// DR ARCHITECTURE:
//
// 1. HEALTH MONITORING (frontend + backend):
//    const { data: health } = useSWR('/api/health', fetcher, { refreshInterval: 5000 });
//    Every 5 seconds: check all critical systems.
//    If latency > THRESHOLD or status !== "healthy": surface immediately.
//    Not as a hidden admin page — as a persistent banner on the operator dashboard.
//    "The operator should never be surprised by a system outage.
//     They should know 2 minutes before it affects their workflow."
//
// 2. GRACEFUL DEGRADATION MODES:
//    FULL_AUTO:     All systems healthy. Automation handles everything.
//    DEGRADED_AUTO: Non-critical system down. Automation continues with limitations.
//    MANUAL:        Critical system down. Operator enters data manually.
//                   All automation paused. All actions require explicit confirmation.
//
// 3. FALLBACK DATA SOURCES:
//    Primary: Riot Match Data API (real-time from game client)
//    Fallback: Manual entry form (operator types score directly)
//    "The match result MUST be recordable even if the game API is down.
//     Manual entry is ugly but it means we never block a broadcast."
//
// 4. FRONTEND DR MODE ACTIVATION:
//    When DR mode is detected:
//    → Replace all automated actions with manual confirmation dialogs
//    → Show which systems are degraded and exactly what functionality is affected
//    → Display runbook: ordered steps for the operator to follow
//    → Highlight the manual fallback for each automated step
//    "The runbook is built into the UI. Not in Confluence. Not in Slack.
//     In the UI that the operator has open right now.
//     That was the key insight: runbooks in external tools = forgotten in a crisis."
//
// 5. DATA MAPPING — the third pillar:
//    Regional providers: LCK sends team IDs like "T1_TEAM_001".
//                        LPL sends team IDs like "T1-LPL-PRIMARY".
//    Both mean T1. Our canonical ID: "RIOT_TEAM_T1".
//    Before automation: operators manually mapped data before each match day.
//    After automation:
//    → Zod schema validates incoming data immediately.
//    → Known mappings: applied automatically (500+ pre-mapped team aliases).
//    → Unknown mappings: surfaced to operator for one-time resolution.
//    → New mapping: saved to the mapping DB → never manually mapped again.
//    "The data mapping automation eliminated an entire pre-game-day workflow
//     that previously took 2-3 hours per week. Operators now review 5-10 ambiguous
//     mappings per week instead of doing the full mapping themselves."`} />
            </div>
          </div>
        </div>
      )}

      {/* ── GLOBAL POWER RANKINGS ── */}
      {tab === "gpr" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: R.textMuted, letterSpacing: "0.08em" }}>GLOBAL POWER RANKINGS — lolesports.com/gpr</div>
              <div style={{ fontSize: 7, color: R.textMuted, fontFamily: R.mono }}>ISR revalidated: {isrTimestamp}</div>
            </div>

            {/* Region filter */}
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              {["ALL", "LCK", "LPL", "LEC", "LCS"].map(r => (
                <button key={r} onClick={() => setRegionFilter(r)} style={{ fontSize: 9, background: regionFilter === r ? R.gold : "transparent", color: regionFilter === r ? "#000" : R.textMuted, border: `1px solid ${regionFilter === r ? R.gold : R.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontWeight: regionFilter === r ? 700 : 400 }}>{r}</button>
              ))}
            </div>

            {/* Rankings */}
            <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "35px 1fr 50px 80px 60px", padding: "6px 12px", borderBottom: `1px solid ${R.border}`, fontSize: 8, fontWeight: 700, color: R.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                <span>#</span><span>Team</span><span>Region</span><span>Points</span><span>W/L</span>
              </div>
              {filteredTeams.map((t, i) => {
                const delta = t.prevRank - t.rank;
                return (
                  <div key={t.name} style={{ display: "grid", gridTemplateColumns: "35px 1fr 50px 80px 60px", padding: "9px 12px", borderBottom: `1px solid ${R.border}20`, background: i % 2 === 0 ? "transparent" : `${R.surface2}60`, alignItems: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: t.rank <= 3 ? R.gold : R.textMuted }}>{t.rank}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{t.abbrev.slice(0, 2)}</div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: R.textBright }}>{t.name}</div>
                        <div style={{ fontSize: 7, color: delta > 0 ? R.green : delta < 0 ? R.red : R.textMuted }}>
                          {delta > 0 ? `↑${delta}` : delta < 0 ? `↓${Math.abs(delta)}` : "–"}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 9, color: R.textMuted }}>{t.region}</span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: R.gold }}>{t.points.toLocaleString()}</div>
                      <div style={{ background: R.surface3, borderRadius: 3, height: 3, width: 60, overflow: "hidden", marginTop: 2 }}>
                        <div style={{ width: `${(t.points / 2400) * 100}%`, height: "100%", background: R.gold }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 9, color: R.text }}>{t.wins}W {t.losses}L</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 8, background: R.surface2, border: `1px solid ${R.border}`, borderRadius: 8, padding: 10, display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, fontSize: 8, color: R.textMuted, lineHeight: 1.5 }}>
                <strong style={{ color: R.gold }}>ISR (Incremental Static Regeneration):</strong> This page is statically generated. After each major international match, the server re-runs the GPR algorithm and generates a new static page. Fans get sub-10ms page loads. Rankings update within minutes of match completion.
              </div>
              <button onClick={() => setIsrTimestamp(new Date().toUTCString().slice(0, 25) + " UTC")} style={{ fontSize: 8, background: R.blue, border: "none", borderRadius: 5, padding: "4px 10px", color: "#fff", cursor: "pointer", flexShrink: 0 }}>↻ Simulate ISR revalidation</button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: R.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={R.gold} label="GPR — Next.js ISR + algorithm + data pipeline" code={
`// GLOBAL POWER RANKINGS (GPR) — TECHNICAL BREAKDOWN:
//
// WHAT GPR IS:
// A ranking system for all professional LoL teams globally.
// 12 regional leagues. ~120 teams. Rankings update after each international event.
// Fans visit lolesports.com/gpr to see: where is T1 ranked relative to BLG?
// This is a PUBLIC FAN-FACING page. SEO, performance, and visual impact matter.
//
// ALGORITHM (simplified — cannot disclose full formula):
// Points = Σ (Tournament result score × Tournament weight × Recency decay)
// Tournament weight: Worlds > MSI > Regional finals > Regular season
// Recency decay: results from 2 years ago are worth less than last month's
// Cross-regional comparison: adjusted for strength of competition
// "The algorithm itself is owned by the data science team.
//  My responsibility: receive the computed rankings via API
//  and surface them beautifully, performantly, and accurately."
//
// NEXT.JS RENDERING STRATEGY:
//
// Why NOT SSR (Server-Side Rendering)?
//   Rankings change rarely — only after major matches.
//   SSR re-runs the page for EVERY visitor. For millions of fans: wasteful.
//
// Why NOT CSR (Client-Side Rendering)?
//   SEO: fans google "LoL power rankings" — must be indexable.
//   Performance: initial load must be fast without client JS.
//   Social sharing: og:image and og:description must be pre-rendered.
//
// Why ISR (Incremental Static Regeneration)? ✅
//   Page is statically generated → sub-10ms CDN delivery.
//   After a match: revalidate on-demand via webhook from results API.
//   Stale-while-revalidate: fans always see a valid page (never a loading state).
//
// export async function generateStaticParams() {
//   return [{ locale: 'en-US' }, { locale: 'ko-KR' }, { locale: 'zh-CN' }]; // etc.
// }
//
// export async function generateMetadata(): Promise<Metadata> {
//   const { teams } = await getGPRData();
//   const leader = teams[0];
//   return {
//     title: \`Global Power Rankings – \${leader.name} leads | lolesports\`,
//     description: \`See how every LoL team ranks globally. Updated after every international event.\`,
//     openGraph: {
//       images: [{ url: \`/api/og/gpr?leader=\${leader.id}\` }], // dynamic OG image
//     },
//   };
// }
//
// export default async function GPRPage() {
//   const { teams, lastUpdated } = await getGPRData();
//   // This function runs at build time + on revalidation.
//   // Not on every request.
//   return <GPRClient teams={teams} lastUpdated={lastUpdated} />;
// }
//
// ON-DEMAND REVALIDATION (webhook from match results):
// // pages/api/revalidate.ts
// export default async function handler(req, res) {
//   const secret = req.headers['x-riot-webhook-secret'];
//   if (secret !== process.env.REVALIDATION_SECRET) return res.status(401).end();
//   await res.revalidate('/gpr');           // re-run generateStaticParams
//   await res.revalidate('/gpr/[teamId]'); // each team's detail page
//   return res.json({ revalidated: true, timestamp: new Date() });
// }
// "Within 60 seconds of a match result being recorded:
//  The GPR page automatically regenerates.
//  Every fan who loads the page after that sees updated rankings.
//  No engineer needs to manually trigger a deploy."
//
// VISUALISATION CHALLENGES:
// - Rank change indicators: ↑2 / ↓1 / NEW (team first entering top 20)
// - Points bar: relative width based on leader's score (not absolute)
// - Region colour coding: consistent across all Riot esports properties
// - Mobile: full table on mobile — had to build a responsive grid
//   that collapses non-essential columns on small screens
//   (hide 'Games Played' on mobile, keep rank/team/region/points)
// - Internationalisation: team names in Korean (한국어) on ko-KR locale`} />
          </div>
        </div>
      )}

      {/* ── TOURNAMENT GRAPH EDITOR ── */}
      {tab === "graph" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: R.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>GRAPH-BASED TOURNAMENT EDITOR</div>

            {/* Toolbar */}
            <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: "10px 10px 0 0", padding: "7px 10px", display: "flex", gap: 5, alignItems: "center" }}>
              {[
                { label: "+ Group Stage", type: "group" as const, color: R.purple },
                { label: "+ Match",       type: "match" as const, color: R.blue   },
                { label: "+ Final",       type: "final" as const, color: R.gold   },
              ].map(btn => (
                <button key={btn.type} onClick={() => addNode(btn.type)} style={{ fontSize: 9, background: `${btn.color}20`, color: btn.color, border: `1px solid ${btn.color}50`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>{btn.label}</button>
              ))}
              <button onClick={() => { setConnectMode(c => !c); setConnectFrom(null); }} style={{ fontSize: 9, background: connectMode ? `${R.green}20` : "transparent", color: connectMode ? R.green : R.textMuted, border: `1px solid ${connectMode ? R.green : R.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer", marginLeft: "auto" }}>
                {connectMode ? (connectFrom ? `🔗 Click target node` : "🔗 Click source node") : "↗ Connect"}
              </button>
              {selectedNode && <button onClick={() => deleteNode(selectedNode)} style={{ fontSize: 9, background: `${R.red}20`, color: R.red, border: `1px solid ${R.red}50`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>✕ Delete</button>}
            </div>

            {/* Graph canvas */}
            <div style={{ background: "#060810", border: `1px solid ${R.border}`, borderTop: "none", borderRadius: "0 0 10px 10px", position: "relative", height: 340, overflow: "hidden" }}>
              {/* Grid dots */}
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.5" fill={R.border} />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Edges */}
                {edges.map(e => (
                  <g key={e.id}>
                    <path d={edgePath(nodes, e.from, e.to)} fill="none" stroke={R.gold} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
                    <text fontSize="8" fill={R.gold} opacity="0.7">
                      {(() => {
                        const from = nodes.find(n => n.id === e.from);
                        const to = nodes.find(n => n.id === e.to);
                        if (!from || !to) return null;
                        const mx = (from.x + 120 + to.x) / 2;
                        const my = (from.y + to.y) / 2 + 28;
                        return <tspan x={mx} y={my}>{e.label}</tspan>;
                      })()}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Nodes */}
              {nodes.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNodeClick(n.id)}
                  style={{
                    position: "absolute", left: n.x, top: n.y,
                    width: 120, background: selectedNode === n.id ? `${NODE_COLOR[n.type]}30` : NODE_BG[n.type],
                    border: `2px solid ${selectedNode === n.id ? NODE_COLOR[n.type] : NODE_COLOR[n.type] + "60"}`,
                    borderRadius: 8, padding: "6px 8px", cursor: "pointer",
                    boxShadow: selectedNode === n.id ? `0 0 12px ${NODE_COLOR[n.type]}40` : "none",
                  }}
                >
                  <div style={{ fontSize: 8, fontWeight: 700, color: NODE_COLOR[n.type], marginBottom: 2 }}>{n.label}</div>
                  <div style={{ fontSize: 7, color: R.textMuted }}>{n.type === "group" ? `${n.teams} teams · top ${n.advance} advance` : "Best of " + (n.capacity <= 2 ? "5" : "1")}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[
                { icon: "🟣", label: "Group Stage",   count: nodes.filter(n => n.type === "group").length },
                { icon: "🔵", label: "Match",         count: nodes.filter(n => n.type === "match").length  },
                { icon: "🟡", label: "Grand Final",   count: nodes.filter(n => n.type === "final").length  },
              ].map(s => (
                <div key={s.label} style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: 7, padding: "6px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 14 }}>{s.icon}</div>
                  <div style={{ fontSize: 8, color: R.textMuted }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: R.textBright }}>{s.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: R.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={R.purple} label="Graph-based tournament editor — why graphs, React Flow, and the hard problems" code={
`// WHY "GRAPH-BASED" TOURNAMENT EDITOR?
//
// SIMPLE TOURNAMENTS: expressible as a tree.
//   Single elimination: Binary tree. 8 teams → 4 QFs → 2 SFs → 1 Final.
//   A tree renderer would work fine.
//
// COMPLEX TOURNAMENTS (what Riot actually runs): require a DAG (Directed Acyclic Graph).
//   Example: 2024 LoL World Championship format:
//   Play-In Stage (8 teams, Swiss format)
//     → 4 advance to: Group Stage
//   Group Stage (16 teams, double round-robin in 4 groups)
//     → 1st & 2nd from each group → Knockout Stage
//     → 3rd from each group → Play-In Bracket (for 2 more spots)
//   Knockout Stage (8 teams, single elimination)
//     → Quarterfinals → Semifinals → Grand Final
//
//   The 3rd-place teams: loop back into a different stage.
//   This is NOT a tree. Trees have no "feeding back" edges.
//   This is a GRAPH: nodes have multiple inputs from different sources.
//
// DATA MODEL:
//
// interface TournamentGraph {
//   nodes: TournamentNode[];
//   edges: TournamentEdge[];
// }
//
// interface TournamentNode {
//   id:       string;                    // stable UUID
//   type:     "group" | "match" | "final";
//   config:   {
//     format:    "single_elim" | "double_elim" | "swiss" | "round_robin";
//     teamCount: number;                 // total teams in this stage
//     advance:   number;                 // how many advance to next stage
//   };
//   position: { x: number; y: number }; // for visual layout in editor
// }
//
// interface TournamentEdge {
//   source:       string;               // node ID
//   sourceHandle: "1st" | "2nd" | "3rd" | string; // which placement exits
//   target:       string;               // node ID
//   targetSlot:   number;               // which input slot on the target node
// }
//
// FRONTEND IMPLEMENTATION: React Flow
//
// React Flow is the library for node-edge graph UIs in React.
// Handles: node rendering, drag-and-drop positioning, edge drawing (bezier curves),
//          zoom/pan, selection, deletion.
//
// <ReactFlow
//   nodes={nodes}
//   edges={edges}
//   onNodesChange={onNodesChange}   // RTK: handles drag, resize, select
//   onEdgesChange={onEdgesChange}
//   onConnect={onConnect}           // operator draws an edge: source → target
//   nodeTypes={customNodeTypes}     // our GroupStageNode, MatchNode, FinalNode
//   edgeTypes={customEdgeTypes}     // custom edge with "placement label" (1st, 2nd)
// />
//
// CUSTOM NODE TYPES:
// Each node type: a React component. Full control over appearance.
// GroupStageNode: shows format (Swiss/RR), team count, advancement count.
// MatchNode: shows "Best of 5", team slot indicators.
// FinalNode: gold-highlighted, "Champions" label at bottom.
//
// VALIDATION (the important frontend work):
// Before saving a tournament structure: validate the graph.
//
// function validateTournamentGraph(graph: TournamentGraph): ValidationResult {
//   const errors: string[] = [];
//
//   // 1. Cycle detection (cannot have A → B → A — bracket would never end)
//   if (hasCycle(graph)) errors.push("Cycle detected: tournament would loop forever");
//
//   // 2. Orphan nodes (nodes with no incoming or outgoing edges except start/end)
//   const orphans = findOrphans(graph);
//   if (orphans.length) errors.push(\`Disconnected stages: \${orphans.join(", ")}\`);
//
//   // 3. Slot overflow (more teams feeding in than a stage can hold)
//   for (const node of graph.nodes) {
//     const incomingTeams = countIncomingTeams(graph, node.id);
//     if (incomingTeams > node.config.teamCount) {
//       errors.push(\`\${node.label}: receives \${incomingTeams} teams but configured for \${node.config.teamCount}\`);
//     }
//   }
//
//   // 4. Exactly one final node
//   const finals = graph.nodes.filter(n => n.type === "final");
//   if (finals.length !== 1) errors.push("Tournament must have exactly one Grand Final");
//
//   return { valid: errors.length === 0, errors };
// }
//
// "Before this editor existed: tournament structures were defined in config files
//  by engineering. Every new format change required an engineer.
//  After the editor: Riot esports operators define complex custom formats themselves.
//  The graph validation prevents invalid configurations from being saved.
//  The editor reduced tournament setup time from 2+ engineering days to 30 operator minutes."`} />
          </div>
        </div>
      )}

      {/* ── RELIABILITY ── */}
      {tab === "reliability" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: R.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>INCIDENT REDUCTION — FROM ~50% TO 0 MAJOR INCIDENTS</div>

            {/* Incident chart */}
            <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                <button onClick={() => setIncidentYear(2023)} style={{ fontSize: 9, background: incidentYear === 2023 ? `${R.red}20` : "transparent", color: incidentYear === 2023 ? R.red : R.textMuted, border: `1px solid ${incidentYear === 2023 ? R.red : R.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>2023</button>
                <button onClick={() => setIncidentYear(2024)} style={{ fontSize: 9, background: incidentYear === 2024 ? `${R.green}20` : "transparent", color: incidentYear === 2024 ? R.green : R.textMuted, border: `1px solid ${incidentYear === 2024 ? R.green : R.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>2024</button>
              </div>
              <div style={{ fontSize: 8, fontWeight: 700, color: R.textMuted, marginBottom: 8 }}>
                {incidentYear === 2023 ? "2023: BEFORE — Legacy tooling, manual processes" : "2024: AFTER — Automated + validated + React/TS migration"}
              </div>
              {(incidentYear === 2023
                ? [
                    { event: "LCS Spring",   incidents: 3, label: "Wrong bracket advance (manual error)" },
                    { event: "MSI",          incidents: 2, label: "Score sync outage during live match" },
                    { event: "LCS Summer",   incidents: 4, label: "Data mapping failures, team ID conflicts" },
                    { event: "Worlds 2023",  incidents: 2, label: "Lobby creation failure mid-series" },
                  ]
                : [
                    { event: "LCS Spring",   incidents: 0, label: "✓ All matches completed successfully" },
                    { event: "MSI",          incidents: 0, label: "✓ Automated fallback handled DR scenario" },
                    { event: "LCS Summer",   incidents: 0, label: "✓ Data mapping pipeline: 100% auto-resolved" },
                    { event: "Worlds 2024",  incidents: 0, label: "✓ 0 incidents across 47 match days" },
                  ]
              ).map(r => (
                <div key={r.event} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <span style={{ fontSize: 8, color: R.textMuted, width: 80, flexShrink: 0 }}>{r.event}</span>
                  <div style={{ flex: 1, background: R.surface2, borderRadius: 4, height: 16, overflow: "hidden", position: "relative" }}>
                    <div style={{ width: `${(r.incidents / 4) * 100}%`, height: "100%", background: r.incidents > 0 ? R.red : R.green, minWidth: r.incidents === 0 ? "100%" : undefined }} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 6px" }}>
                      <span style={{ fontSize: 7, color: "#fff", fontWeight: 700 }}>{r.incidents === 0 ? r.label : `${r.incidents} incident${r.incidents !== 1 ? "s" : ""}`}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 10, padding: "7px 10px", background: `${incidentYear === 2024 ? R.green : R.red}15`, border: `1px solid ${incidentYear === 2024 ? R.green : R.red}30`, borderRadius: 6, fontSize: 8, color: R.textBright }}>
                {incidentYear === 2024 ? "✓ 2024: 0 major incidents across full season (↓ 100% from 2023)" : "✗ 2023: ~11 major incidents across season"}
              </div>
            </div>

            {/* Migration progress */}
            <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: R.textMuted, marginBottom: 8 }}>LEGACY → REACT/TS MIGRATION — Critical Path Tooling</div>
              {[
                { feature: "Match Status Dashboard",  pct: 100, note: "First migrated — highest incident risk" },
                { feature: "Bracket Advancement",     pct: 100, note: "Manual error caused 3 incidents in 2023" },
                { feature: "Data Mapping UI",         pct: 100, note: "Eliminated 2-3hr weekly manual work"     },
                { feature: "Disaster Recovery Panel", pct: 100, note: "Runbook now built into UI"              },
                { feature: "Tournament Editor",       pct: 100, note: "New feature — graph-based, TypeScript"   },
                { feature: "GPR (lolesports.com)",   pct: 100, note: "Next.js ISR, fan-facing"                },
              ].map(f => (
                <div key={f.feature} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 8, color: R.text, fontWeight: 600 }}>{f.feature}</span>
                    <span style={{ fontSize: 7, color: R.textMuted }}>{f.note}</span>
                  </div>
                  <div style={{ background: R.surface2, borderRadius: 4, height: 5, overflow: "hidden" }}>
                    <div style={{ width: `${f.pct}%`, height: "100%", background: `linear-gradient(90deg, ${R.blue}, ${R.green})` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: R.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeSnip color={R.green} label="0 incidents 2024 — the specific engineering decisions that got there" code={
`// WHAT CAUSED INCIDENTS IN 2023:
//
// 1. WRONG BRACKET ADVANCE (3 incidents):
//    Operator manually clicked "advance team" in the bracket UI.
//    The UI didn't show: who you're about to advance, from where, to where.
//    Under time pressure (live broadcast): wrong team advanced.
//    Realised on-air. Panic. Manual correction while show was live.
//
//    FIX: Confirmation dialog with full diff:
//    "You are advancing T1 (1st place, Group A) to Quarterfinal 1 Slot A.
//     BLG will be placed in Quarterfinal 1 Slot B.
//     Click CONFIRM to proceed or CANCEL to review."
//    Additional: validation that the team being advanced actually qualified.
//    TypeScript: typed match state — compiler catches invalid state transitions.
//
// 2. SCORE SYNC OUTAGE (2 incidents):
//    Score Sync went down. Operator had no fallback.
//    Match result couldn't be recorded. Broadcast stalled.
//
//    FIX: Manual entry fallback always available.
//    Health monitoring: degraded status shown 2 minutes before it affected ops.
//    DR runbook: built into the UI (not in Confluence).
//    Automated failover to backup endpoint for non-critical fields.
//
// 3. DATA MAPPING FAILURES (4 incidents):
//    LCK changed their team ID format mid-season.
//    Old mapping: { "T1_MAIN": "RIOT_T1" }
//    New format:  { "T1-KR-PRIMARY": "?" } → unknown ID → crash.
//    Operator didn't notice until match data failed to load.
//
//    FIX: Zod schema validation + unmapped ID alert.
//    Unknown IDs: surfaced immediately to operator when data is ingested.
//    Not when the match page fails to load.
//    New mappings: resolved once, saved permanently.
//    Zero "unknown team ID" incidents in 2024.
//
// 4. LOBBY CREATION FAILURE (2 incidents):
//    Operator clicked "Create Lobby" during lobby creation → double-submission.
//    Two lobbies created. Duplicate lobby → game crashed.
//
//    FIX: Idempotency key on all lobby creation requests.
//    If operator submits twice: second request is a no-op.
//    Button disabled after click + loading state.
//    TypeScript: match creation function is typed to accept an idempotencyKey.
//    Cannot call without one → compile error.
//
// THE META-LESSON:
// "We didn't reduce incidents by adding monitoring (that helped).
//  We reduced incidents by making it HARD to do the wrong thing
//  and EASY to do the right thing.
//  The UI now prevents most invalid actions before they happen.
//  TypeScript catches the rest at compile time.
//  React Testing Library ensures our validation flows work correctly.
//  Monitoring catches the rare case where all of those fail.
//  Incidents at 0: because the first line of defence is the UI,
//  not the monitoring system."`} />

              <CodeSnip color={R.blue} label="Legacy → React/TS/RTL migration — what 'critical path' means" code={
`// "CRITICAL PATH TOOLING" — WHY THIS MIGRATION WAS DIFFERENT:
//
// Not all tools are equal.
// Some tools: used once a week, bugs are annoying but recoverable.
// Critical path tools: used live, during broadcasts, with millions watching.
// A bug in a critical path tool: immediate broadcast incident.
//
// THE LEGACY STACK (before migration):
// - jQuery + vanilla JavaScript
// - No TypeScript: type errors discovered at runtime by operators
// - No component framework: ad-hoc DOM manipulation, hard to test
// - Zero automated tests: "we'll be careful" was the testing strategy
// - Deployment: manual FTP to a server (yes, really)
//
// MIGRATION STRATEGY — prioritised by incident risk:
// 1. Match Status Dashboard (caused 3 incidents in 2023) → migrated first
// 2. Bracket Advancement (caused 3 incidents) → migrated second
// 3. Data Mapping UI (caused 4 incidents) → migrated third
// 4. DR Panel (new feature — built in React/TS from day 1)
//
// WHY REACT TESTING LIBRARY (RTL)?
// "RTL tests what the user does, not what the code does.
//  Our 'user' is an esports operator running a live match.
//  Our test: render the operator dashboard. Click 'Advance Team'.
//  Expect the confirmation dialog to appear with the correct team name.
//  Click 'CONFIRM'. Expect the API to be called with the correct match ID.
//  This test: still passes even if we refactor the state management.
//  An implementation-detail test (testing internal state, not UI):
//  would break on every refactor. We had 0 tests. RTL gave us
//  stable, meaningful tests without fighting the testing framework."
//
// TEST COVERAGE TARGETS (critical path tools):
// - Validation flows: 100% (every invalid action must be tested)
// - Happy path per feature: 100%
// - DR fallback flows: 100%
// - Non-critical UI states: 80%
//
// TYPESCRIPT DISCIPLINE:
// - Strict mode: on from day 1
// - No 'any': enforced by ESLint rule
// - Match state: typed as discriminated union (cannot access 'score' on a SCHEDULED match)
// - All API response shapes: validated by Zod, then typed
// "TypeScript caught 3 bugs during migration that would have been
//  incidents in production. All three: accessing properties on potentially
//  undefined match data. The old code: assumed data was always there.
//  TypeScript: forced us to handle the undefined case.
//  At least one of those would have caused a live broadcast incident."`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiotEsportsOpsDemo;
