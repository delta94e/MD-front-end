/**
 * SlackCanvasNavigationDemo.tsx
 *
 * Technical Lead — Canvas Organization & Navigation
 * Slack Productivity Pillar
 *
 * TABS
 *   🖊️ Canvas Editor     — Live rich-text canvas: blocks, ToC, section deep-links, collaboration
 *   🗺️ Navigation Arch   — State machine: Canvas ↔ Messages ↔ Search ↔ Video; focus zones
 *   🔬 Prototyping       — Prototype → Dogfood → 1% → 100% pipeline; feature flags; rapid iteration
 *   📐 Technical Lead    — RFC lifecycle; cross-team dependencies; ambiguous problem framework
 */

import React, { useState, useRef, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────
// Slack brand tokens
// ─────────────────────────────────────────────────────────────────
const S = {
  purple:      "#4A154B",
  purpleLight: "#611f69",
  aubergine:   "#3D0E40",
  green:       "#2BAC76",
  blue:        "#1264A3",
  yellow:      "#ECB22E",
  red:         "#E01E5A",
  surface:     "#1a1d21",
  surface2:    "#222529",
  surface3:    "#2c2d30",
  border:      "#383a3d",
  text:        "#d1d2d3",
  textMuted:   "#9b9b9b",
  textBright:  "#FFFFFF",
};

// ─────────────────────────────────────────────────────────────────
// Canvas document model
// ─────────────────────────────────────────────────────────────────

type BlockType = "h1" | "h2" | "h3" | "paragraph" | "todo" | "code" | "divider" | "canvas-link" | "message-ref";

interface CanvasBlock {
  id:      string;
  type:    BlockType;
  content: string;
  checked?: boolean;
  language?: string;
  preview?: string;
}

const SAMPLE_CANVAS: CanvasBlock[] = [
  { id: "b1",  type: "h1",          content: "Q3 Product Roadmap" },
  { id: "b2",  type: "paragraph",   content: "This canvas tracks our Q3 priorities for the Canvas Org & Nav team. Last updated by @sarah.chen · 2 hours ago." },
  { id: "b3",  type: "h2",          content: "Goals" },
  { id: "b4",  type: "todo",        content: "Ship canvas section deep-linking to 100%",  checked: true },
  { id: "b5",  type: "todo",        content: "Launch Canvas Table of Contents (ToC) panel", checked: true },
  { id: "b6",  type: "todo",        content: "Canvas ↔ Search integration (index canvas blocks)", checked: false },
  { id: "b7",  type: "todo",        content: "Focus-zone keyboard navigation across all Slack surfaces", checked: false },
  { id: "b8",  type: "h2",          content: "Technical Architecture" },
  { id: "b9",  type: "paragraph",   content: "Canvas documents are ProseMirror-based rich-text documents with a custom Slack schema. Each block is a ProseMirror node type. Real-time sync uses Operational Transform (OT) via our document collaboration service." },
  { id: "b10", type: "code",        content: `// Canvas URL routing scheme\n// Channel canvas:  /archives/{channelId}/canvas/{canvasId}\n// Standalone:      /canvas/{canvasId}\n// Section link:    /canvas/{canvasId}#section-{blockId}\n// Template:        /canvas/new?template={templateId}`, language: "typescript" },
  { id: "b11", type: "h2",          content: "Open Questions" },
  { id: "b12", type: "paragraph",   content: "Navigation history: when a user follows a canvas-to-canvas link, should the Back button return to the originating canvas or to the originating Slack surface (channel/DM)? Currently unresolved — RFC-112 in review." },
  { id: "b13", type: "canvas-link", content: "Navigation RFC-112 — Deep Linking Architecture", preview: "canvas" },
  { id: "b14", type: "h2",          content: "References" },
  { id: "b15", type: "message-ref", content: "#canvas-team · Jun 14", preview: "Sarah: The OT conflict resolution issue with concurrent heading edits is now fixed in v3.2.1 of the collab service." },
  { id: "b16", type: "divider",     content: "" },
  { id: "b17", type: "paragraph",   content: "Next review: Jun 25 · Owner: @truong.nguyen · Status: In Progress" },
];

// ─────────────────────────────────────────────────────────────────
// Navigation state machine
// ─────────────────────────────────────────────────────────────────

type SlackSurface = "channel" | "canvas" | "search" | "video" | "dm" | "thread";

interface NavState {
  current: SlackSurface;
  history: SlackSurface[];
  canvasSection?: string;
  searchQuery?: string;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#9b9b9b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a0a", borderRadius: 8, overflow: "hidden", border: `1px solid ${S.border}` }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: `1px solid ${S.border}`, fontSize: 10, color, fontFamily: "monospace" }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 300 }}>{code}</pre>
    </div>
  );
}

const SURFACE_COLORS: Record<SlackSurface, string> = {
  channel: S.green,  canvas: S.purple, search: S.blue,
  video: S.red,       dm: S.yellow,     thread: "#64748b",
};

const SURFACE_ICONS: Record<SlackSurface, string> = {
  channel: "#", canvas: "🖊", search: "🔍",
  video: "📹",  dm: "💬",    thread: "↩",
};

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function SlackCanvasNavigationDemo() {
  const [activeTab, setActiveTab] = useState<"canvas" | "nav" | "proto" | "lead">("canvas");

  // ── Canvas state ─────────────────────────────────────────────
  const [blocks, setBlocks]           = useState<CanvasBlock[]>(SAMPLE_CANVAS);
  const [activeSectionId, setActiveSection] = useState<string | null>(null);
  const [showToc, setShowToc]         = useState(true);
  const [collaborators]               = useState(["@truong", "@sarah.chen", "@amit.k"]);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [otLog, setOtLog]             = useState<string[]>([]);

  // ── Nav state ────────────────────────────────────────────────
  const [navState, setNavState]       = useState<NavState>({ current: "channel", history: [] });
  const [focusZone, setFocusZone]     = useState<"sidebar" | "content" | "thread">("content");

  // ── Proto state ──────────────────────────────────────────────
  const [protoStage, setProtoStage]   = useState(0);
  const [flagEnabled, setFlagEnabled] = useState(false);
  const [iterCount, setIterCount]     = useState(3);

  const headings = blocks.filter(b => b.type === "h1" || b.type === "h2" || b.type === "h3");

  const navigate = useCallback((to: SlackSurface, section?: string) => {
    setNavState(prev => ({
      current: to,
      history: [...prev.history.slice(-4), prev.current],
      canvasSection: section,
    }));
    if (to === "canvas") {
      const msg = `OT[${Date.now() % 10000}]: navigate to canvas${section ? `#${section}` : ""} — syncing doc v${Math.floor(Math.random() * 10) + 42}`;
      setOtLog(l => [msg, ...l.slice(0, 5)]);
    }
  }, []);

  const goBack = useCallback(() => {
    setNavState(prev => {
      if (prev.history.length === 0) return prev;
      const history = [...prev.history];
      const last = history.pop()!;
      return { current: last, history, canvasSection: undefined };
    });
  }, []);

  const toggleTodo = (id: string) =>
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, checked: !b.checked } : b));

  const PROTO_STAGES = [
    { label: "Local Prototype",    icon: "🔬", desc: "Hack in 2-3 days. Real codebase, mock data.", color: "#64748b", users: "~3 (you + design + PM)" },
    { label: "Internal Dogfood",   icon: "🐕", desc: "Slack employees only. Real data, real usage.",   color: S.yellow,  users: "~8,000 Slack employees" },
    { label: "1% Beta Rollout",    icon: "🧪", desc: "Feature flag: userId % 100 < 1.",              color: S.blue,    users: "~350,000 users" },
    { label: "10% Rollout",        icon: "📊", desc: "Perf profiling in prod. Metric gates required.",color: S.green,   users: "~3.5M users" },
    { label: "100% Shipped",       icon: "🚀", desc: "Flag cleanup in same sprint.",                 color: S.purple,  users: "35M+ daily active users" },
  ];

  const CROSS_TEAM_DEPS = [
    { team: "Search",     dep: "Index canvas block content for full-text search",            status: "active",  risk: "high"   },
    { team: "Messaging",  dep: "Canvas pins in channels; share-to-message canvas previews",  status: "active",  risk: "medium" },
    { team: "AI/ML",      dep: "Canvas summaries, auto-generated ToC, smart section suggest",status: "pending", risk: "medium" },
    { team: "Video",      dep: "Canvas co-edit during Slack huddles (focus mode)",            status: "planned", risk: "high"   },
    { team: "Mobile",     dep: "Canvas view + edit on iOS/Android (shared schema)",           status: "active",  risk: "high"   },
    { team: "Platform",   dep: "Canvas Bolt SDK — 3rd party apps embed canvas blocks",       status: "planned", risk: "low"    },
  ];

  const TABS = [
    { id: "canvas" as const, label: "🖊️ Canvas Editor"      },
    { id: "nav"    as const, label: "🗺️ Navigation Arch"    },
    { id: "proto"  as const, label: "🔬 Prototyping"        },
    { id: "lead"   as const, label: "📐 Tech Lead"          },
  ];

  return (
    <div style={{ background: S.surface, color: S.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: S.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🖊️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: S.textBright }}>Slack Canvas — Organization & Navigation</h1>
            <p style={{ margin: 0, fontSize: 13, color: S.textMuted }}>Technical Lead · Productivity Pillar · 35M DAU · Rich-text editor + Navigation state machine + Rapid prototyping</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "Canvas",     l: "Slack's doc editor",     c: S.purple, sub: "ProseMirror + OT + real-time collab" },
            { v: "Nav TL",     l: "Technical Lead",         c: S.blue,   sub: "Canvas ↔ 6 Slack surfaces"          },
            { v: "Prototyper", l: "Most experienced at Slack", c: S.green, sub: "Hack → Dogfood → 1% → 100%"       },
            { v: "Ambiguous",  l: "Problem solver",         c: S.yellow, sub: "Complex org + nav decisions"         },
          ].map(m => (
            <div key={m.l} style={{ background: S.surface2, border: `1px solid ${m.c}30`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: S.text }}>{m.l}</div>
              <div style={{ fontSize: 8, color: S.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${S.border}`, paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? S.surface2 : "transparent", color: activeTab === tab.id ? S.textBright : S.textMuted, border: activeTab === tab.id ? `1px solid ${S.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── CANVAS EDITOR ── */}
      {activeTab === "canvas" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>LIVE CANVAS — ORGANIZATION FEATURES</div>

            {/* Toolbar */}
            <div style={{ background: S.surface2, border: `1px solid ${S.border}`, borderRadius: "10px 10px 0 0", padding: "7px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 5 }}>
                {["H1","H2","¶","✓","<>","─","🔗","↩"].map(t => (
                  <button key={t} style={{ background: "#0a0a0a", border: `1px solid ${S.border}`, borderRadius: 4, padding: "3px 7px", fontSize: 9, color: S.textMuted, cursor: "pointer" }}>{t}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {collaborators.map(c => (
                  <div key={c} style={{ width: 20, height: 20, borderRadius: "50%", background: [S.purple, S.green, S.blue][collaborators.indexOf(c) % 3], fontSize: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, border: `2px solid ${S.surface2}` }}>{c[1].toUpperCase()}</div>
                ))}
                <span style={{ fontSize: 8, color: S.textMuted, marginLeft: 4 }}>3 editing</span>
                <button onClick={() => setShowToc(v => !v)} style={{ fontSize: 8, background: showToc ? `${S.purple}20` : "#0a0a0a", border: `1px solid ${showToc ? S.purple : S.border}`, borderRadius: 4, padding: "3px 8px", cursor: "pointer", color: showToc ? S.purple : S.textMuted }}>≡ ToC</button>
              </div>
            </div>

            {/* Canvas body */}
            <div style={{ display: "flex", background: "#111", border: `1px solid ${S.border}`, borderTop: "none", borderRadius: "0 0 10px 10px", minHeight: 440 }}>
              {/* ToC panel */}
              {showToc && (
                <div style={{ width: 140, flexShrink: 0, borderRight: `1px solid ${S.border}`, padding: "10px 8px", overflowY: "auto" }}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: S.textMuted, marginBottom: 6, letterSpacing: "0.08em" }}>TABLE OF CONTENTS</div>
                  {headings.map(h => (
                    <button key={h.id} onClick={() => { setActiveSection(h.id); navigate("canvas", h.id); }} style={{ display: "block", width: "100%", textAlign: "left", background: activeSectionId === h.id ? `${S.purple}20` : "transparent", border: "none", borderLeft: `2px solid ${activeSectionId === h.id ? S.purple : "transparent"}`, padding: `3px ${h.type === "h1" ? 6 : h.type === "h2" ? 10 : 14}px`, cursor: "pointer", color: activeSectionId === h.id ? S.purple : S.textMuted, fontSize: h.type === "h1" ? 8 : 7, fontWeight: h.type === "h1" ? 700 : 400, lineHeight: 1.5 }}>
                      {h.content.length > 20 ? h.content.slice(0, 18) + "…" : h.content}
                    </button>
                  ))}
                </div>
              )}

              {/* Block list */}
              <div style={{ flex: 1, padding: "12px 14px", overflowY: "auto", maxHeight: 440 }}>
                {blocks.map(block => (
                  <div key={block.id} onClick={() => setActiveSection(block.id)} style={{ marginBottom: block.type === "divider" ? 8 : 5, background: activeSectionId === block.id ? `${S.purple}10` : "transparent", borderRadius: 4, padding: "2px 4px", cursor: "pointer" }}>
                    {block.type === "h1" && <h1 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: S.textBright }}>{block.content}</h1>}
                    {block.type === "h2" && <h2 style={{ margin: "8px 0 2px", fontSize: 11, fontWeight: 700, color: S.text, borderBottom: `1px solid ${S.border}`, paddingBottom: 3 }}>{block.content}</h2>}
                    {block.type === "h3" && <h3 style={{ margin: 0, fontSize: 9, fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{block.content}</h3>}
                    {block.type === "paragraph" && <p style={{ margin: 0, fontSize: 9, lineHeight: 1.6, color: S.text }}>{block.content}</p>}
                    {block.type === "todo" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input type="checkbox" checked={block.checked} onChange={() => toggleTodo(block.id)} style={{ accentColor: S.purple, cursor: "pointer" }} />
                        <span style={{ fontSize: 9, color: block.checked ? S.textMuted : S.text, textDecoration: block.checked ? "line-through" : "none" }}>{block.content}</span>
                      </div>
                    )}
                    {block.type === "code" && <pre style={{ margin: 0, background: "#0a0a0a", border: `1px solid ${S.border}`, borderRadius: 5, padding: 8, fontSize: 8, color: "#94a3b8", fontFamily: "monospace", overflow: "auto" }}>{block.content}</pre>}
                    {block.type === "canvas-link" && (
                      <div style={{ background: `${S.purple}15`, border: `1px solid ${S.purple}40`, borderRadius: 5, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12 }}>🖊️</span>
                        <span style={{ fontSize: 9, color: S.purple, fontWeight: 600 }}>{block.content}</span>
                        <span style={{ fontSize: 7, color: S.textMuted, marginLeft: "auto" }}>Canvas</span>
                      </div>
                    )}
                    {block.type === "message-ref" && (
                      <div style={{ background: `${S.green}15`, border: `1px solid ${S.green}40`, borderLeft: `3px solid ${S.green}`, borderRadius: 5, padding: "6px 10px" }}>
                        <div style={{ fontSize: 7, color: S.green, fontWeight: 700, marginBottom: 2 }}>{block.content}</div>
                        <div style={{ fontSize: 8, color: S.textMuted }}>{block.preview}</div>
                      </div>
                    )}
                    {block.type === "divider" && <hr style={{ border: "none", borderTop: `1px solid ${S.border}`, margin: "4px 0" }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* OT log */}
            {otLog.length > 0 && (
              <div style={{ marginTop: 8, background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 8, padding: 8 }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: S.textMuted, marginBottom: 4 }}>⚡ OT COLLABORATION LOG</div>
                {otLog.map((m, i) => <div key={i} style={{ fontSize: 7, color: S.green, fontFamily: "monospace", lineHeight: 1.6 }}>{m}</div>)}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Canvas document model — ProseMirror schema with Slack extensions" color={S.purple} code={
`// SLACK CANVAS = ProseMirror + custom node schema + OT sync
//
// WHY ProseMirror (not Lexical, Draft.js, Slate)?
//   ProseMirror: the most battle-tested rich-text foundation.
//   Used by: Atlassian, NYT, Dropbox Paper, GitHub (PR reviews).
//   Custom node schema: lets us add Slack-specific block types
//   (canvas-link, message-ref, @mention, channel-link) without forking.
//
// CANVAS DOCUMENT MODEL:
interface CanvasDocument {
  id:            string;          // UUID
  version:       number;          // OT version vector — monotonically increasing
  title:         string;          // from H1 block, denormalized for list views
  channelId?:    string;          // if pinned to a channel (Channel Canvas)
  workspaceId:   string;
  createdBy:     string;          // user ID
  collaborators: string[];        // active editors (for avatar presence UI)
  blocks:        ProseMirrorDoc;  // serialised ProseMirror JSON document
  lastModified:  Date;
}

// CUSTOM SLACK NODE TYPES (extends ProseMirror schema):
type CanvasNodeType =
  | "heading"      // H1/H2/H3 — auto-populates Table of Contents
  | "paragraph"    // standard text
  | "todo_item"    // checkbox + text (grouped in todo_list)
  | "code_block"   // syntax-highlighted, language attribute
  | "canvas_link"  // embedded canvas reference (transclusion preview)
  | "message_ref"  // pinned Slack message excerpt
  | "file_attach"  // uploaded file/image
  | "divider"      // horizontal rule
  | "table"        // table (TH + TD cells, merged cells supported)
  | "slack_mention"// @user, #channel, @here, @channel (inline)

// TABLE OF CONTENTS — auto-generated:
// Traverse the ProseMirror doc tree. Collect all heading nodes.
// Emit: { id, level, text, offset } for scroll-to and URL anchors.
function buildToc(doc: ProseMirrorDoc): TocEntry[] {
  const entries: TocEntry[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      entries.push({
        id:     node.attrs.id ?? generateAnchorId(node.textContent),
        level:  node.attrs.level,   // 1 | 2 | 3
        text:   node.textContent,
        offset: pos,               // byte offset → used for scroll-to
      });
    }
  });
  return entries;
}
// "When the user types a new H2, the ToC updates in real-time.
//  When they click a ToC entry: smooth scroll + URL hash update.
//  When they share the URL with the hash: the recipient jumps directly
//  to that section. This is canvas section deep-linking."`} />

              <CodeBlock label="Real-time collaboration — Operational Transform (OT) at 35M DAU" color={S.blue} code={
`// WHY OT (not CRDT)?
// CRDT: better for P2P, offline-first, complex merge semantics.
//       Figma, Linear, Notion use CRDT.
// OT: better for server-authoritative architectures.
//     Google Docs uses OT. Slack's architecture is server-authoritative.
//     OT is simpler to reason about for text documents.
//     "We already had OT infrastructure from Slack messaging.
//      Extending it to canvas blocks was a more natural fit."
//
// OT FLOW:
// 1. User A types "Hello" at position 0.
//    Client: optimistic apply (zero latency feel).
//    Client: send operation to server: Insert("Hello", pos=0, v=42)
//
// 2. User B concurrently types "World" at position 0.
//    Client B: optimistic apply locally.
//    Client B: send Insert("World", pos=0, v=42)
//
// 3. Server receives A's op first (v=42).
//    Server: apply A's op. New doc version: v=43.
//    Server: broadcast to all clients.
//
// 4. Server receives B's op (v=42, now STALE — doc is at v=43).
//    Server: TRANSFORM B's op against A's op.
//    Transform(Insert("World", 0), Insert("Hello", 0))
//    → Insert("World", pos=5)  (shift by len("Hello"))
//    Apply transformed op. New doc: v=44.
//    Broadcast.
//
// 5. Both clients converge to same document state.
//    "Hello World" — A's text then B's text.
//
// CANVAS-SPECIFIC OT CHALLENGE:
// Block-level operations vs character-level operations.
// Inserting a new block (e.g., a todo_item) between two heading blocks:
// This is a tree transform, not just a linear position transform.
// We extended OT with block-path notation:
// Insert(block, path=[2, 0]) = insert as first child of 3rd top-level block.
//
// CONFLICT WE SOLVED (RFC-98):
// User A: reorders blocks (drag block 3 before block 1).
// User B: concurrently edits text inside block 3.
// Naive OT: B's edit applies to wrong block after A's reorder.
// Fix: operations carry block IDs (stable identifiers), not positions.
// Position: computed at apply-time from block IDs. Never transmitted.
// "Block IDs are the stable reference. Positions are ephemeral.
//  This was the key insight that fixed the concurrent reorder bug."`} />
            </div>
          </div>
        </div>
      )}

      {/* ── NAVIGATION ARCH ── */}
      {activeTab === "nav" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>LIVE NAVIGATION STATE MACHINE</div>

            {/* Current state */}
            <div style={{ background: S.surface2, border: `1px solid ${SURFACE_COLORS[navState.current]}40`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: S.textMuted }}>CURRENT SURFACE</div>
                <button onClick={goBack} disabled={navState.history.length === 0} style={{ fontSize: 8, background: navState.history.length > 0 ? "#0a0a0a" : "transparent", border: `1px solid ${S.border}`, borderRadius: 5, padding: "3px 8px", cursor: navState.history.length > 0 ? "pointer" : "not-allowed", color: navState.history.length > 0 ? S.text : S.textMuted }}>← Back ({navState.history.length})</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: SURFACE_COLORS[navState.current], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{SURFACE_ICONS[navState.current]}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: SURFACE_COLORS[navState.current] }}>{navState.current.toUpperCase()}</div>
                  {navState.canvasSection && <div style={{ fontSize: 8, color: S.textMuted, fontFamily: "monospace" }}>#section-{navState.canvasSection}</div>}
                </div>
                <div style={{ marginLeft: "auto", fontSize: 8, color: S.textMuted, fontFamily: "monospace", textAlign: "right" }}>
                  history: [{navState.history.join(" → ")}]
                </div>
              </div>
            </div>

            {/* Navigation actions */}
            <div style={{ background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: S.textMuted, marginBottom: 8 }}>NAVIGATE TO →</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
                {(["channel", "canvas", "search", "video", "dm", "thread"] as SlackSurface[]).map(s => (
                  <button key={s} onClick={() => navigate(s)} style={{ background: navState.current === s ? `${SURFACE_COLORS[s]}20` : "#0a0a0a", border: `1px solid ${navState.current === s ? SURFACE_COLORS[s] : S.border}`, borderRadius: 7, padding: "8px 5px", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 14 }}>{SURFACE_ICONS[s]}</div>
                    <div style={{ fontSize: 8, color: navState.current === s ? SURFACE_COLORS[s] : S.textMuted, fontWeight: navState.current === s ? 700 : 400, marginTop: 2 }}>{s}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Focus zones */}
            <div style={{ background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: S.textMuted, marginBottom: 6 }}>FOCUS ZONES (Tab to cycle, ⌘+[ to shift)</div>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 90px", gap: 4, height: 100 }}>
                {(["sidebar", "content", "thread"] as const).map(zone => (
                  <div key={zone} onClick={() => setFocusZone(zone)} style={{ background: focusZone === zone ? `${S.purple}20` : "#0a0a0a", border: `2px solid ${focusZone === zone ? S.purple : S.border}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 7, color: focusZone === zone ? S.purple : S.textMuted, fontWeight: 700, textAlign: "center", padding: 4 }}>{zone.toUpperCase()}{focusZone === zone ? "\n▸ FOCUSED" : ""}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 6, fontSize: 7, color: S.textMuted }}>
                In Canvas: keyboard shortcuts from the <em>canvas editor</em> (ProseMirror) take priority over Slack shell shortcuts. Must explicitly hand-off focus (Esc → shell).
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="The hardest navigation problem: Canvas ↔ Slack context switching" color={S.purple} code={
`// THE CORE NAVIGATION PROBLEM:
// Slack has 6 primary surfaces. Canvas is a DOCUMENT editor.
// All other surfaces are EPHEMERAL (messages flow by, search clears).
// Canvas is PERSISTENT (you return to the same state).
//
// This creates a fundamental tension:
// When you navigate FROM a channel INTO a canvas linked in a message,
// do you want the Back button to go back to:
// (a) The message in the channel?  ← document-editor mental model
// (b) The channel message list?    ← messaging app mental model
// "This was ambiguous. We ran an experiment.
//  Prototype A: back → originating message.
//  Prototype B: back → channel (not the specific message).
//  Dogfood result: users expected (a). 82% back-tapped to a specific message.
//  We shipped (a)."
//
// NAVIGATION STATE MACHINE (simplified):
type Surface = "channel" | "canvas" | "search" | "video" | "dm" | "thread";

interface NavigationState {
  current:  Surface;
  history:  NavigationEntry[];     // max depth: 10
  focus:    FocusZone;             // sidebar | content | thread
}

interface NavigationEntry {
  surface:  Surface;
  entityId: string;                // channelId, canvasId, searchQuery, etc.
  anchor?:  string;                // canvas section ID for deep links
  scroll?:  number;                // restore scroll position on back-nav
}

// URL ROUTING SCHEME:
// Challenge: Slack is a single-page app with its own routing.
// Canvas adds a NEW dimension: the canvas itself has sections.
// URLs must encode: Slack surface state + Canvas state + Section.
//
// Solution: compound URL path + hash:
// /archives/{channelId}                      → channel messages
// /archives/{channelId}/canvas/{canvasId}    → canvas in channel
// /canvas/{canvasId}                         → standalone canvas
// /canvas/{canvasId}#h-{sectionId}           → canvas + section anchor
//
// KEYBOARD SHORTCUTS CONFLICT:
// ProseMirror registers its own keyboard handlers:
//   Ctrl+B = bold (ProseMirror)   vs  Ctrl+B = bold sidebar (Slack shell)
//   Ctrl+K = link (ProseMirror)   vs  Ctrl+K = jump to DM (Slack shell)
//   Escape = cancel edit          vs  Escape = close modal (Slack shell)
//
// SOLUTION: focus-aware event routing.
// When canvas editor is focused: ProseMirror key handlers take priority.
// Escape: blur canvas → return focus to Slack shell.
// Slack shell receives keyboard events ONLY when canvas is not focused.
// Implementation: single keydown listener on document root.
// Route based on: document.activeElement inside canvas DOM subtree?
//   → canvas handlers. Else → shell handlers.
//
// "This is why keyboard navigation in Canvas feels native.
//  It required deep integration with Slack's global event system."`} />

              <CodeBlock label="Deep linking to canvas sections — the full chain" color={S.blue} code={
`// CANVAS SECTION DEEP LINK — end-to-end:
//
// 1. ANCHOR GENERATION:
//    Every heading block gets a stable anchor ID on creation.
//    ID: slug of heading text + random 4-char suffix.
//    "Technical Architecture" → "technical-architecture-a3x9"
//    Stable: renames update the display text, NOT the anchor ID.
//    "If renaming headings broke all shared links: every shared canvas URL
//     would stop working. Anchor IDs are immutable once created."
//
// 2. URL CONSTRUCTION:
//    /canvas/{canvasId}#h-{anchorId}
//    The "h-" prefix: namespaces anchor IDs from other hash params.
//
// 3. ON LOAD — SCROLL TO SECTION:
//    useEffect(() => {
//      const hash = window.location.hash; // "#h-technical-architecture-a3x9"
//      if (!hash.startsWith("#h-")) return;
//      const anchorId = hash.slice(3);
//      // Wait for canvas doc to load and render:
//      waitForCanvasRender().then(() => {
//        const el = document.querySelector(\`[data-anchor-id="\${anchorId}"]\`);
//        el?.scrollIntoView({ behavior: "smooth", block: "start" });
//        // Focus the heading for screen readers:
//        el?.focus({ preventScroll: true });
//        // ARIA: announce to screen reader:
//        announce(\`Jumped to section: \${el?.textContent}\`);
//      });
//    }, [canvasId]);
//
// 4. SHARING:
//    "Copy link to this section" → navigator.clipboard.writeText(url)
//    The URL: works for any Slack user in the workspace.
//    Outside Slack: shows a preview card + "Open in Slack" CTA.
//
// 5. CANVAS-TO-CANVAS NAVIGATION:
//    A canvas block of type "canvas_link" embeds another canvas.
//    Clicking: navigate(canvasId, { pushHistory: true })
//    Back button: pop history → return to originating canvas + scroll position.
//    "Scroll position restoration: critical for long canvases.
//     We cache scroll offset in the navigation history entry.
//     On back: restore scroll to the exact position before the user left.
//     Without it: every back-nav jumps to top of canvas. Jarring."`} />
            </div>
          </div>
        </div>
      )}

      {/* ── PROTOTYPING ── */}
      {activeTab === "proto" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>PROTOTYPE → PRODUCTION PIPELINE</div>

            {/* Stage progression */}
            <div style={{ background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: S.textMuted, marginBottom: 8 }}>CURRENT STAGE — click to advance</div>
              {PROTO_STAGES.map((stage, i) => (
                <div key={stage.label} onClick={() => setProtoStage(i)} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "7px 8px", borderRadius: 7, marginBottom: 4, background: protoStage === i ? `${stage.color}15` : "transparent", border: `1px solid ${protoStage === i ? stage.color + "50" : "transparent"}`, cursor: "pointer", opacity: i > protoStage + 1 ? 0.4 : 1 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: i <= protoStage ? stage.color : S.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>
                    {i < protoStage ? "✓" : stage.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: i <= protoStage ? stage.color : S.textMuted }}>{stage.label}</div>
                    <div style={{ fontSize: 7, color: S.textMuted, lineHeight: 1.5 }}>{stage.desc}</div>
                    <div style={{ fontSize: 7, color: stage.color, marginTop: 2 }}>👥 {stage.users}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature flag toggle */}
            <div style={{ background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: S.textMuted, marginBottom: 6 }}>FEATURE FLAG — canvas_toc_v2</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 9, color: flagEnabled ? S.green : S.textMuted, fontWeight: 700 }}>{flagEnabled ? "✓ ENABLED" : "○ DISABLED"}</div>
                  <div style={{ fontSize: 7, color: S.textMuted }}>Rollout: {PROTO_STAGES[protoStage]?.users}</div>
                </div>
                <button onClick={() => setFlagEnabled(f => !f)} style={{ background: flagEnabled ? S.green : "#0a0a0a", border: `1px solid ${S.border}`, borderRadius: 20, padding: "5px 14px", cursor: "pointer", color: "#fff", fontSize: 9, fontWeight: 700 }}>
                  {flagEnabled ? "Disable" : "Enable"}
                </button>
              </div>
              <div style={{ background: "#0a0a0a", borderRadius: 6, padding: 8, fontFamily: "monospace", fontSize: 8, color: "#94a3b8" }}>
                {`// User bucketing (deterministic):\nconst inExperiment = userId.charCodeAt(0) % 100 < ${PROTO_STAGES[protoStage] ? (protoStage === 0 ? 0 : protoStage === 1 ? 0 : protoStage === 2 ? 1 : protoStage === 3 ? 10 : 100) : 0};\nif (inExperiment) renderCanvasToCv2();\nelse renderCanvasToCv1();`}
              </div>
            </div>

            {/* Iteration counter */}
            <div style={{ background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: S.textMuted, marginBottom: 4 }}>PROTOTYPE ITERATION LOG — Canvas ToC Navigation</div>
              {[
                { v: "v1",  result: "❌ ToC hidden behind menu — users missed it completely (0% discovery rate in dogfood)",         action: "Always-visible sidebar panel"      },
                { v: "v2",  result: "⚠️  ToC too wide (200px) — collapsed canvas reading area too much",                            action: "Collapsed by default, toggle button" },
                { v: "v3",  result: "✅ 73% of users opened ToC in first 30s. Scroll-to-section felt instant.",                     action: "Ship to 1%"                        },
              ].map((it, i) => (
                <div key={it.v} style={{ padding: "5px 7px", borderLeft: `2px solid ${i === 2 ? S.green : i === 1 ? S.yellow : S.red}`, marginBottom: 5, background: "#0a0a0a", borderRadius: "0 5px 5px 0" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: S.textBright }}>{it.v}</div>
                  <div style={{ fontSize: 7, color: S.textMuted, lineHeight: 1.5 }}>{it.result}</div>
                  <div style={{ fontSize: 7, color: S.blue, marginTop: 1 }}>→ {it.action}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Rapid prototyping — what 'most experienced' actually means technically" color={S.purple} code={
`// WHAT "EXPERIENCED TECHNICAL PROTOTYPER" MEANS AT SLACK:
//
// 1. CODEBASE DEPTH:
//    Slack's monorepo: millions of lines. Years of features.
//    A senior engineer: knows their own team's code well.
//    An experienced prototyper: knows WHERE to find things across the repo.
//    "I can find the MessageBubble component in 30 seconds.
//     I know which stores own which state.
//     I know which feature flags are available and how to add new ones.
//     This breadth: makes prototyping 10x faster than someone learning the codebase."
//
// 2. PROTOTYPE PHILOSOPHY — what makes a GOOD prototype at Slack:
//    a. REAL DATA, not mocks.
//       "A prototype with hardcoded text is a wireframe.
//        A prototype with real canvas documents, real users, real OT sync:
//        that's something PMs and designers can make real decisions from."
//
//    b. REAL CODEBASE, not throwaway code.
//       Prototype in a feature-flagged branch of production code.
//       WHY: "Throwaway prototypes lie. They never account for
//        edge cases the real codebase forces you to handle.
//        A canvas with 1 block: trivial.
//        A canvas with 500 blocks, concurrent edits, and a mobile user:
//        that's what the prototype must handle."
//
//    c. MEASURE EARLY.
//       Even at prototype stage: add performance markers.
//       If canvas render > 16ms at prototype time: it'll be worse in prod.
//       "We caught a 380ms canvas-switch performance regression
//        in prototype v1. Fixed before dogfood. 
//        Cost: 2 hours of profiling.
//        Without catching it: it would have shipped to 35M users."
//
// 3. PROTOTYPE SPEED TRICKS:
//    a. Reuse existing Slack components — never build a Button.
//    b. Use the Design System tokens — never hardcode colors.
//    c. Feature flag from day 1 — never branch off main.
//    d. Share early — dogfood at day 3, not day 30.
//    e. Record a Loom — async video > sync meeting for design review.
//
// HOW TO BUILD A CANVAS FEATURE IN 3 DAYS:
// Day 1: Define the user interaction. Write no code.
//        Interview 2 engineers and 1 designer about constraints.
//        Identify the single riskiest assumption to invalidate.
//
// Day 2: Build the happy path only. Feature-flagged. Real data.
//        Goal: something a PM can click through in a Loom recording.
//
// Day 3: Send Loom to PM, design, and 2 staff engineers.
//        Collect written feedback (async).
//        List the top 3 open questions that the prototype raised.
//
// "A prototype that raises MORE questions than it answers
//  is a SUCCESSFUL prototype.
//  Questions are the output. Not the code."`} />

              <CodeBlock label="Ambiguous problem framework — how TLs solve undefined problems" color={S.yellow} code={
`// "SOLVING COMPLEX AND AMBIGUOUS PROBLEMS" — what this means technically:
//
// EXAMPLE: Canvas Organization — "How should users organise their canvases?"
//
// AMBIGUITY: Users have 100+ canvases. How do they find them?
// Options:
//   (a) Folders/nested folders (Notion model)
//   (b) Tags/labels (Linear model)  
//   (c) Search-first (Gmail model)
//   (d) Pinned + recency (Slack channel model)
//   (e) Workspace-level "Canvas hub" (new surface)
//
// THE AMBIGUITY RESOLUTION PROCESS (my approach):
//
// STEP 1: FRAME the problem correctly.
//   "Organisation" is NOT the user's goal.
//   The user's goal: "Find the canvas I need, when I need it."
//   Better framing: "What signals can we use to surface the right canvas
//   at the right time, with the least user effort?"
//
// STEP 2: GATHER CONSTRAINTS.
//   Constraint A: Mobile must work. Folders ≠ great on mobile.
//   Constraint B: Enterprise users: thousands of canvases per workspace.
//                 Tag-based: n² tag combinations → doesn't scale.
//   Constraint C: Slack is channel-centric. Users orient by channel.
//                 Solution must hook into this mental model.
//
// STEP 3: PROTOTYPE to learn, not to ship.
//   Built prototype with option (d): Pinned + recency.
//   Dogfood result: "I can't find canvases from 2 months ago."
//   Insight: recency fails for infrequently-accessed reference docs.
//
//   Built prototype with hybrid: Channels-as-folders.
//   Canvas list filtered by active channel. + search.
//   Dogfood result: "This is how I already think about it."
//   73% of canvas finds were from the channel-scoped list.
//
// STEP 4: DOCUMENT the decision with explicit trade-offs.
//   RFC-109: Canvas Discovery Architecture.
//   "We chose channel-scoped canvas list + workspace search.
//    Trade-off accepted: canvases not pinned to a channel are
//    discoverable ONLY via search. This is acceptable because
//    channel-pinned canvases account for 89% of canvas opens."
//
// STEP 5: SET UP a metric to validate (not prove) the decision.
//   Primary: canvas-open-from-channel-list rate (target >70%).
//   Secondary: canvas-search-usage rate (understand the 11%).
//   Threshold: if search > 30% of opens → revisit org model.
//   "We don't iterate on decisions. We set a threshold at which
//    the decision is revisited. This prevents endless re-opening
//    of closed decisions."`} />
            </div>
          </div>
        </div>
      )}

      {/* ── TECH LEAD ── */}
      {activeTab === "lead" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>TECHNICAL LEADERSHIP — CANVAS ORG & NAV</div>

            {/* Cross-team dependencies */}
            <div style={{ background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: S.textMuted, marginBottom: 8 }}>🔗 CROSS-TEAM DEPENDENCIES (I own the interfaces)</div>
              {CROSS_TEAM_DEPS.map(dep => (
                <div key={dep.team} style={{ display: "flex", gap: 8, padding: "5px 6px", borderBottom: `1px solid ${S.border}`, marginBottom: 3, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: S.blue, width: 60, flexShrink: 0 }}>{dep.team}</span>
                  <span style={{ fontSize: 7, color: S.textMuted, flex: 1, lineHeight: 1.5 }}>{dep.dep}</span>
                  <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                    <span style={{ fontSize: 6, background: dep.status === "active" ? `${S.green}20` : dep.status === "pending" ? `${S.yellow}20` : `${S.border}`, color: dep.status === "active" ? S.green : dep.status === "pending" ? S.yellow : S.textMuted, borderRadius: 3, padding: "1px 5px" }}>{dep.status}</span>
                    <span style={{ fontSize: 6, background: dep.risk === "high" ? `${S.red}20` : dep.risk === "medium" ? `${S.yellow}20` : `${S.green}20`, color: dep.risk === "high" ? S.red : dep.risk === "medium" ? S.yellow : S.green, borderRadius: 3, padding: "1px 5px" }}>{dep.risk}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* RFC examples */}
            <div style={{ background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: S.textMuted, marginBottom: 8 }}>📋 RFC TRACKER — Canvas Team Authored</div>
              {[
                { id: "RFC-98",  title: "Canvas OT: Block-ID-based transforms", status: "SHIPPED",  impact: "Fixed concurrent reorder + edit conflict" },
                { id: "RFC-109", title: "Canvas Discovery Architecture",         status: "SHIPPED",  impact: "Channel-scoped list + search. 89% coverage." },
                { id: "RFC-112", title: "Canvas Deep Linking & Navigation History", status: "REVIEW", impact: "Back-button behaviour, URL scheme, scroll restore" },
                { id: "RFC-118", title: "Canvas ↔ Search Index Integration",    status: "DRAFT",   impact: "Full-text search across canvas block content" },
              ].map(rfc => {
                const sc = { SHIPPED: S.green, REVIEW: S.yellow, DRAFT: S.textMuted }[rfc.status];
                return (
                  <div key={rfc.id} style={{ background: "#0a0a0a", borderRadius: 7, padding: "7px 9px", marginBottom: 6, borderLeft: `3px solid ${sc}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: sc, fontFamily: "monospace" }}>{rfc.id}</span>
                      <span style={{ fontSize: 7, background: `${sc}20`, color: sc, borderRadius: 3, padding: "1px 6px" }}>{rfc.status}</span>
                    </div>
                    <div style={{ fontSize: 8, color: S.text, fontWeight: 600, marginBottom: 2 }}>{rfc.title}</div>
                    <div style={{ fontSize: 7, color: S.textMuted }}>{rfc.impact}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Technical lead vs senior engineer — the actual difference at Slack" color={S.purple} code={
`// TECHNICAL LEAD ON CANVAS ORG & NAV — DAY-TO-DAY:
//
// IC WORK (~40%):
//   - Own the hardest, most ambiguous technical problems on the team.
//   - "I take the problems that don't have a clear solution yet.
//      Senior engineers on my team: take problems with clear solutions.
//      The difference: my problems require prototyping to discover the solution."
//   - RFC authorship: write the design docs that align the team.
//   - Code review: set the bar for what 'good' looks like.
//
// TECHNICAL LEADERSHIP (~40%):
//   - INTERFACE OWNER for cross-team dependencies.
//     I define the contract between Canvas and Search, Messaging, AI/ML.
//     "If I don't own these interfaces: they drift. Every team builds
//      to their convenience. Canvas becomes isolated.
//      I sit in weekly syncs with Search, Messaging, Video. I write the API."
//
//   - PROTOTYPING CHAMPION:
//     I go first on prototypes. My prototypes: set the quality bar.
//     "When I deliver a prototype in 3 days with real data and perf metrics,
//      the team sees what's possible. They prototype faster too."
//
//   - DESIGN REVIEW:
//     I participate in every design review for Canvas surfaces.
//     Not to design UI — to catch technical constraints EARLY.
//     "If I'm not in the design review: designers spec a feature that's
//      technically infeasible or expensive. I catch it in design, not in eng.
//      Cost of catching in design: 30-min conversation.
//      Cost of catching in engineering: 3-week replan."
//
// AMBIGUITY MANAGEMENT (~20%):
//   When the team is stuck: I unblock by reducing ambiguity.
//   NOT by making decisions FOR them.
//   BY making the decision SURFACE explicit:
//   "Here are the 3 options. Here are the constraints.
//    Here's the cheapest experiment to learn which is right.
//    Let's run it this sprint and decide with data."
//
// WHAT I DON'T DO AS TL:
//   - I don't manage people (that's the EM's job).
//   - I don't estimate for others (engineers own their estimates).
//   - I don't make product decisions (that's the PM's job).
//   - I don't approve every design (I trust my team).
//   "Technical lead: I make the TECHNICAL decisions that others can't.
//    Not the people decisions. Not the product decisions. Just the hard tech."`} />

              <CodeBlock label="The 'most experienced prototyper' — what that enables at 35M scale" color={S.green} code={
`// WHY PROTOTYPING EXPERIENCE MATTERS MORE AT LARGER SCALE:
//
// AT A STARTUP (100K users):
//   "Just ship it. We'll fix it if users complain."
//   Prototyping: optional. You can afford to be wrong.
//   Cost of a bad feature: manageable.
//
// AT SLACK (35M DAU):
//   A bad feature: seen by 35M people on Day 1.
//   A broken navigation: reported by thousands before you're awake.
//   Rollback: one command. But the trust damage: lasts.
//   "At Slack: we can't afford to be publicly wrong.
//    Prototyping is how we be wrong privately, cheaply, and quickly."
//
// THE COMPOUNDING VALUE OF PROTOTYPING EXPERIENCE:
//
// Year 1: I learned WHERE things are in the codebase.
//         Prototype time: 5 days for a simple feature.
//
// Year 3: I know HOW the systems interact.
//         Prototype time: 3 days. More realistic (handles edge cases).
//
// Year 5 (now): I know WHAT WON'T WORK before I build it.
//         Prototype time: 2 days. First prototype is much closer to correct.
//         "I've seen enough failed prototypes to know which ideas fail.
//          I prototype the ideas I'm UNCERTAIN about.
//          The ideas I'm certain will fail: I kill in conversation, not code."
//
// PROTOTYPING + DESIGN COLLABORATION AT SLACK:
// The design team: works in Figma. High fidelity, but static.
// My prototypes: interactive, real data, real performance.
// The gap between Figma and reality: my prototype fills it.
//
// "There are always Figma frames that look great but interact badly.
//  The frame shows the happy path in 1 pixel of perfection.
//  My prototype shows the edge cases:
//  What happens when the canvas has 0 sections? Or 50 headings in the ToC?
//  What happens on a slow network? On a 6-year-old Android?
//  Those are the questions Figma can't answer.
//  The prototype can."
//
// SPECIFIC CANVAS PROTOTYPE THAT CHANGED THE PRODUCT DIRECTION:
// Prototype: Canvas inline comments (like Google Docs side comments).
// Figma: beautiful. Team excited.
// My prototype (built in 4 days): worked, but had a fatal flaw.
// The canvas editor occupies 100% width.
// Side comments: required 300px right margin.
// On a 1280px monitor: canvas reading area → 980px. Acceptable.
// On a 1024px monitor: canvas reading area → 724px. Cramped.
// On mobile: side comments overlap the canvas text. Unusable.
// Decision: pivot to bottom-sheet comments (like Notion).
// Prototype saved us 6 weeks of engineering on the wrong approach.`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SlackCanvasNavigationDemo;
