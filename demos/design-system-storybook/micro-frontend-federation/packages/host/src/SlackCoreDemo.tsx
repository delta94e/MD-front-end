/**
 * SlackCoreDemo.tsx
 *
 * Staff Engineer — Slack Core Collaboration Team
 * 35 Million Daily Active Users
 *
 * Achievements covered:
 *   1. Core collaboration features (messaging, threads, reactions, presence)
 *   2. Real-time architecture (WebSocket events, optimistic updates, reconnection)
 *   3. High-quality accessible features (keyboard nav, ARIA, focus management)
 *   4. Technical leadership (RFCs, performance at scale, prototyping, mentoring)
 *
 * TABS
 *   💬 Messaging        — Slack-like UI, optimistic updates, thread/reaction system
 *   ⚡ Real-time         — WebSocket event stream, reconnection, presence indicators
 *   ♿ Accessibility     — Keyboard shortcuts, ARIA live regions, focus management
 *   📐 Staff Eng         — RFC lifecycle, 35M DAU performance budget, feature flags
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Types + Data
// ─────────────────────────────────────────────────────────────────

interface Message {
  id: string; author: string; initials: string; avatarColor: string;
  text: string; time: string; optimistic?: boolean;
  reactions?: { emoji: string; count: number; mine: boolean }[];
  threadCount?: number;
}

interface Channel { id: string; name: string; unread: number }
interface DMUser  { id: string; name: string; status: "online" | "away" | "dnd" }

const CHANNELS: Channel[] = [
  { id: "general",     name: "general",            unread: 3 },
  { id: "engineering", name: "engineering",         unread: 0 },
  { id: "frontend",    name: "frontend-platform",   unread: 1 },
  { id: "design",      name: "design-system",       unread: 0 },
];

const DMS: DMUser[] = [
  { id: "sarah",  name: "Sarah Chen",       status: "online" },
  { id: "marcus", name: "Marcus Thompson",  status: "away"   },
  { id: "priya",  name: "Priya Sharma",     status: "online" },
  { id: "alex",   name: "Alex Rivera",      status: "dnd"    },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1", author: "Sarah Chen", initials: "SC", avatarColor: "#1264A3",
    text: "Hey team! Just merged the message composer RFC. The @mention handling uses a virtual popup anchored to the cursor position — avoids the jank we had with absolute-positioned dropdowns.",
    time: "9:02 AM",
    reactions: [{ emoji: "🎉", count: 5, mine: false }, { emoji: "👍", count: 3, mine: true }],
    threadCount: 4,
  },
  {
    id: "2", author: "Marcus Thompson", initials: "MT", avatarColor: "#2BAC76",
    text: "Accessibility review done on the virtualized message list PR. Left comments on keyboard navigation — when focus is inside the list, j/k should scroll without jumping to the composer.",
    time: "9:14 AM",
    reactions: [{ emoji: "✅", count: 2, mine: false }],
  },
  {
    id: "3", author: "Priya Sharma", initials: "PS", avatarColor: "#E01E5A",
    text: "Question on optimistic updates: when the server rejects a message (e.g. rate limit), do we remove it with a slide-out animation or keep it grayed out with a Retry button?",
    time: "9:31 AM",
    threadCount: 2,
  },
  {
    id: "4", author: "Alex Rivera", initials: "AR", avatarColor: "#ECB22E",
    text: "Did the math on our 35M DAU scale: a 50ms render improvement = 486 hours of aggregate saved time per day globally. A 1KB bundle reduction = 35MB saved every page load. Small wins compound enormously.",
    time: "9:45 AM",
    reactions: [{ emoji: "🤯", count: 7, mine: false }, { emoji: "💡", count: 4, mine: false }],
  },
];

// WS event pool for simulation
const WS_EVENT_POOL = [
  { type: "message_received",  color: "#1264A3", label: "New message in #engineering" },
  { type: "typing_start",      color: "#2BAC76", label: "Sarah Chen is typing…"       },
  { type: "reaction_add",      color: "#E01E5A", label: "🎉 reaction on your message"  },
  { type: "presence_change",   color: "#ECB22E", label: "Marcus Thompson → away"       },
  { type: "typing_stop",       color: "#616061", label: "Sarah Chen stopped typing"    },
  { type: "channel_mark",      color: "#7C5CBF", label: "#frontend-platform read"      },
  { type: "message_received",  color: "#1264A3", label: "Thread reply from Priya"      },
  { type: "presence_change",   color: "#2BAC76", label: "Alex Rivera → online"         },
];

// Keyboard shortcuts
const SHORTCUTS = [
  { keys: ["K"],            desc: "Quick switcher — jump to any channel or DM",   cat: "Navigation" },
  { keys: ["⌘", "/"],      desc: "Search all messages, files and channels",       cat: "Navigation" },
  { keys: ["⌥", "↑↓"],    desc: "Navigate between channels and DMs",             cat: "Navigation" },
  { keys: ["Tab"],         desc: "Move focus to next interactive element",         cat: "Focus"      },
  { keys: ["Shift","Tab"], desc: "Move focus to previous element",                 cat: "Focus"      },
  { keys: ["Esc"],         desc: "Close modal or return focus to message list",    cat: "Focus"      },
  { keys: ["j","k"],       desc: "Navigate messages in current channel",           cat: "Messages"   },
  { keys: ["e"],           desc: "Add emoji reaction to focused message",          cat: "Messages"   },
  { keys: ["t"],           desc: "Reply in thread to focused message",             cat: "Messages"   },
  { keys: ["Enter"],       desc: "Open or activate the focused item",              cat: "Messages"   },
];

// RFC lifecycle
const RFCS = [
  { id: "RFC-047", title: "Message Composer Rich Text Architecture",       status: "implemented", impact: "High",     date: "Jan 2025" },
  { id: "RFC-043", title: "Real-time Presence System v2",                  status: "approved",    impact: "High",     date: "Feb 2025" },
  { id: "RFC-051", title: "Virtualized Message List for 10K+ Channels",    status: "review",      impact: "Critical", date: "Mar 2025" },
  { id: "RFC-055", title: "Universal Keyboard Navigation Framework",        status: "draft",       impact: "Medium",   date: "Apr 2025" },
];

const RFC_STATUS_COLOR: Record<string, string> = {
  draft: "#64748b", review: "#ECB22E", approved: "#1264A3", implemented: "#2BAC76",
};

// Performance metrics
const PERF_METRICS = [
  { label: "Message list render (p50)", value: 12, budget: 16, unit: "ms"  },
  { label: "Message list render (p99)", value: 48, budget: 50, unit: "ms"  },
  { label: "Composer keystroke latency",value: 8,  budget: 16, unit: "ms"  },
  { label: "Channel switch TTI",        value: 280,budget: 300,unit: "ms"  },
  { label: "Initial JS parse time",     value: 1.2,budget: 1.5,unit: "s"   },
];

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

const STATUS_COLOR: Record<string, string> = { online: "#2BAC76", away: "#ECB22E", dnd: "#E01E5A" };
const STATUS_ICON:  Record<string, string> = { online: "●", away: "◐", dnd: "⊘" };

function Avatar({ initials, color, size = 28 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 6, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function SlackCoreDemo() {
  const [activeTab, setActiveTab] = useState<"msg" | "rt" | "a11y" | "lead">("msg");

  // ── Messaging state ───────────────────────────────────────────
  const [activeChannel, setActiveChannel] = useState("general");
  const [messages, setMessages]           = useState<Message[]>(INITIAL_MESSAGES);
  const [composerText, setComposerText]   = useState("");
  const [isTyping, setIsTyping]           = useState(false);
  const [hoveredMsg, setHoveredMsg]       = useState<string | null>(null);
  const [threadMsg, setThreadMsg]         = useState<Message | null>(null);
  const [channels, setChannels]           = useState<Channel[]>(CHANNELS);
  const typingTimer                       = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMessage = useCallback(() => {
    if (!composerText.trim()) return;
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId, author: "You", initials: "YO", avatarColor: "#4A154B",
      text: composerText, time: "Now", optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setComposerText("");
    // Simulate server ack after 400ms
    setTimeout(() => {
      setMessages(prev => prev.map(m =>
        m.id === optimisticId ? { ...m, optimistic: false, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) } : m
      ));
      // Clear unread for active channel
      setChannels(prev => prev.map(c => c.id === activeChannel ? { ...c, unread: 0 } : c));
    }, 400);
  }, [composerText, activeChannel]);

  const toggleReaction = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.reactions) return m;
      return {
        ...m,
        reactions: m.reactions.map(r =>
          r.emoji === emoji ? { ...r, mine: !r.mine, count: r.mine ? r.count - 1 : r.count + 1 } : r
        ),
      };
    }));
  };

  // Simulate "Sarah is typing" periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2500);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // ── Real-time state ───────────────────────────────────────────
  const [wsEvents, setWsEvents]       = useState<Array<{ type: string; label: string; color: string; ts: number }>>([]);
  const [wsStatus, setWsStatus]       = useState<"connected" | "connecting" | "disconnected">("connected");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wsEventRef                    = useRef(0);

  useEffect(() => {
    if (activeTab !== "rt") return;
    const interval = setInterval(() => {
      const pool = WS_EVENT_POOL;
      const evt  = pool[wsEventRef.current % pool.length];
      wsEventRef.current += 1;
      setWsEvents(prev => [...prev.slice(-11), { ...evt, ts: Date.now() }]);
    }, 900);
    return () => clearInterval(interval);
  }, [activeTab]);

  const simulateDisconnect = () => {
    setWsStatus("disconnected");
    setReconnectAttempt(0);
    let attempt = 0;
    const reconnect = () => {
      attempt += 1;
      setReconnectAttempt(attempt);
      setWsStatus("connecting");
      setTimeout(() => {
        if (attempt >= 3) { setWsStatus("connected"); setReconnectAttempt(0); }
        else { setWsStatus("disconnected"); setTimeout(reconnect, 800 * attempt); }
      }, 600);
    };
    setTimeout(reconnect, 500);
  };

  // ── Accessibility state ───────────────────────────────────────
  const [focusedShortcut, setFocusedShortcut]   = useState<number | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string | null>(null);
  const [focusDemo, setFocusDemo]               = useState<"sidebar" | "messages" | "composer" | null>(null);
  const announcementTimer                       = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = (text: string) => {
    setLiveAnnouncement(text);
    if (announcementTimer.current) clearTimeout(announcementTimer.current);
    announcementTimer.current = setTimeout(() => setLiveAnnouncement(null), 3000);
  };

  // ── Leadership state ──────────────────────────────────────────
  const [selectedRfc, setSelectedRfc] = useState<string | null>(null);

  const TABS = [
    { id: "msg"  as const, label: "💬 Messaging"     },
    { id: "rt"   as const, label: "⚡ Real-time"      },
    { id: "a11y" as const, label: "♿ Accessibility"  },
    { id: "lead" as const, label: "📐 Staff Eng"      },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#4A154B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>S</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Slack — Staff Engineer, Core Collaboration</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>35M DAU · Messaging · Real-time · Accessibility · Technical Leadership</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "35M",   l: "Daily Active Users",     c: "#4A154B", sub: "Core collaboration features" },
            { v: "<16ms", l: "Message Render Budget",   c: "#2BAC76", sub: "p99 at scale"                },
            { v: "4",     l: "RFCs Authored",           c: "#1264A3", sub: "High/Critical impact"         },
            { v: "100%",  l: "WCAG 2.1 AA",             c: "#ECB22E", sub: "Keyboard + screen reader"     },
          ].map(m => (
            <div key={m.l} style={{ background: "#1e293b", border: `1px solid ${m.c}30`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 9, fontWeight: 700 }}>{m.l}</div>
              <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? "#1e293b" : "transparent", color: activeTab === tab.id ? "#f1f5f9" : "#64748b", border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 22px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{tab.label}</button>
        ))}
      </div>

      {/* ── MESSAGING ── */}
      {activeTab === "msg" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Left: Slack UI */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>LIVE DEMO — SLACK-LIKE MESSAGING</div>
            <div style={{ border: "1px solid #1e293b", borderRadius: 12, overflow: "hidden", height: 520, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Sidebar */}
                <div style={{ width: 188, background: "#19171D", display: "flex", flexDirection: "column", flexShrink: 0 }}>
                  {/* Workspace header */}
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid #2D2B30", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: "#4A154B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>S</div>
                    <span style={{ fontWeight: 700, fontSize: 12, color: "#D1D2D3" }}>Slack Corp</span>
                  </div>
                  {/* Channels */}
                  <div style={{ padding: "8px 0", flex: 1, overflow: "auto" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#616061", padding: "4px 12px", letterSpacing: "0.08em" }}>CHANNELS</div>
                    {channels.map(ch => (
                      <div key={ch.id} onClick={() => { setActiveChannel(ch.id); setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, unread: 0 } : c)); }} style={{ padding: "3px 12px", cursor: "pointer", background: activeChannel === ch.id ? "#27242C" : "transparent", borderLeft: activeChannel === ch.id ? "2px solid #7C5CBF" : "2px solid transparent", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: ch.unread > 0 ? "#D1D2D3" : "#616061", fontWeight: ch.unread > 0 ? 700 : 400 }}># {ch.name}</span>
                        {ch.unread > 0 && <span style={{ background: "#CC1B25", color: "#fff", fontSize: 8, fontWeight: 700, borderRadius: 10, padding: "1px 5px" }}>{ch.unread}</span>}
                      </div>
                    ))}
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#616061", padding: "8px 12px 4px", letterSpacing: "0.08em" }}>DIRECT MESSAGES</div>
                    {DMS.map(dm => (
                      <div key={dm.id} style={{ padding: "3px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: STATUS_COLOR[dm.status], fontSize: 8 }}>{STATUS_ICON[dm.status]}</span>
                        <span style={{ fontSize: 10, color: "#616061" }}>{dm.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message area */}
                <div style={{ flex: 1, background: "#1A1D21", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {/* Channel header */}
                  <div style={{ padding: "8px 14px", borderBottom: "1px solid #2D2B30", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#D1D2D3" }}># {channels.find(c => c.id === activeChannel)?.name}</span>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
                    {messages.map(msg => (
                      <div key={msg.id} onMouseEnter={() => setHoveredMsg(msg.id)} onMouseLeave={() => setHoveredMsg(null)} style={{ padding: "4px 14px", background: hoveredMsg === msg.id ? "#26282C" : "transparent", display: "flex", gap: 8, position: "relative", opacity: msg.optimistic ? 0.6 : 1 }}>
                        <Avatar initials={msg.initials} color={msg.avatarColor} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: msg.avatarColor }}>{msg.author}</span>
                            <span style={{ fontSize: 8, color: "#616061" }}>{msg.time}{msg.optimistic && " (sending…)"}</span>
                          </div>
                          <div style={{ fontSize: 10, color: "#D1D2D3", lineHeight: 1.5 }}>{msg.text}</div>
                          {/* Reactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                              {msg.reactions.map(r => (
                                <button key={r.emoji} onClick={() => toggleReaction(msg.id, r.emoji)} style={{ background: r.mine ? "#1264A320" : "#2C2D30", border: `1px solid ${r.mine ? "#1264A3" : "transparent"}`, borderRadius: 12, padding: "2px 7px", cursor: "pointer", fontSize: 9, color: "#D1D2D3", display: "flex", alignItems: "center", gap: 3 }}>
                                  {r.emoji} {r.count}
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Thread */}
                          {msg.threadCount && (
                            <button onClick={() => setThreadMsg(msg)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 9, color: "#1264A3", padding: "2px 0", marginTop: 2 }}>
                              {msg.threadCount} replies →
                            </button>
                          )}
                        </div>
                        {/* Hover actions */}
                        {hoveredMsg === msg.id && !msg.optimistic && (
                          <div style={{ position: "absolute", right: 14, top: 4, display: "flex", gap: 3 }}>
                            {["😊", "💬", "✏️", "⋯"].map(action => (
                              <button key={action} style={{ background: "#2C2D30", border: "1px solid #3F3F3F", borderRadius: 6, width: 24, height: 24, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>{action}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Typing indicator */}
                    {isTyping && (
                      <div style={{ padding: "4px 14px", display: "flex", gap: 8, alignItems: "center" }}>
                        <Avatar initials="SC" color="#1264A3" size={22} />
                        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#616061", animation: `bounce ${0.6 + i * 0.15}s infinite alternate`, animationDelay: `${i * 0.15}s` }} />
                          ))}
                          <span style={{ fontSize: 9, color: "#616061", marginLeft: 4 }}>Sarah Chen is typing…</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Composer */}
                  <div style={{ padding: "8px 14px", borderTop: "1px solid #2D2B30" }}>
                    <div style={{ background: "#2C2D30", borderRadius: 8, border: "1px solid #3F3F3F", padding: "6px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                      <input value={composerText} onChange={e => setComposerText(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())} placeholder={`Message #${channels.find(c => c.id === activeChannel)?.name}`} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 10, color: "#D1D2D3" }} />
                      <button onClick={sendMessage} disabled={!composerText.trim()} style={{ background: composerText.trim() ? "#007A5A" : "#2C2D30", border: "none", borderRadius: 5, width: 26, height: 26, cursor: composerText.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>↑</button>
                    </div>
                    <div style={{ fontSize: 7, color: "#616061", marginTop: 4 }}>Enter to send · Shift+Enter for new line</div>
                  </div>
                </div>

                {/* Thread panel */}
                {threadMsg && (
                  <div style={{ width: 220, background: "#1A1D21", borderLeft: "1px solid #2D2B30", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "8px 12px", borderBottom: "1px solid #2D2B30", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#D1D2D3" }}>Thread</span>
                      <button onClick={() => setThreadMsg(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#616061", fontSize: 14 }}>×</button>
                    </div>
                    <div style={{ flex: 1, padding: 10, overflow: "auto" }}>
                      <div style={{ fontSize: 9, color: "#D1D2D3", background: "#26282C", borderRadius: 6, padding: 8, marginBottom: 8 }}>{threadMsg.text.slice(0, 80)}…</div>
                      <div style={{ fontSize: 9, color: "#616061", marginBottom: 8 }}>3 replies · View thread</div>
                      {[{ author: "You", text: "Good point! I'll add it to the RFC." }, { author: "Sarah", text: "Makes sense. The retry animation is cleaner." }].map((r, i) => (
                        <div key={i} style={{ marginBottom: 6, display: "flex", gap: 6 }}>
                          <Avatar initials={r.author.slice(0, 2).toUpperCase()} color={i === 0 ? "#4A154B" : "#1264A3"} size={20} />
                          <div><div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8" }}>{r.author}</div><div style={{ fontSize: 9, color: "#D1D2D3" }}>{r.text}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Code */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Optimistic updates — message send with server reconciliation" color="#2BAC76" code={
`// OPTIMISTIC UPDATES: show message immediately, reconcile after server ack.
// Why: at 35M DAU, even a 200ms delay feels like lag for the sender.
// "The message should appear the instant you press Enter."
//
// PATTERN: temporary ID → replace with server ID on ack.

function useOptimisticMessages() {
  const [messages, dispatch] = useReducer(messagesReducer, []);

  const sendMessage = useCallback(async (text: string) => {
    const tempId = \`opt-\${crypto.randomUUID()}\`;

    // 1. OPTIMISTIC INSERT: add immediately to UI
    dispatch({ type: "INSERT_OPTIMISTIC", payload: {
      id: tempId, text, time: Date.now(), optimistic: true
    }});

    try {
      // 2. SERVER REQUEST: fires in background
      const { messageId, ts } = await api.sendMessage({ text });

      // 3. CONFIRM: replace temp ID with server ID, clear optimistic flag
      dispatch({ type: "CONFIRM_MESSAGE", payload: { tempId, messageId, ts } });

    } catch (error) {
      if (error.code === "RATE_LIMIT") {
        // 4. REJECT: mark with error state + retry button
        dispatch({ type: "REJECT_MESSAGE", payload: {
          tempId, error: "Rate limited. Retry?", retryable: true,
        }});
      } else if (error.code === "NETWORK_ERROR") {
        // 5. QUEUE: add to offline queue, retry on reconnect
        offlineQueue.enqueue({ text, tempId });
        dispatch({ type: "QUEUE_MESSAGE", payload: { tempId } });
      }
    }
  }, []);

  return { messages, sendMessage };
}

// WHY useReducer over useState for messages:
// Messages: a complex data structure with multiple mutation types.
// Reducer: centralises all transitions → easier to reason about.
// Especially important for concurrent React (transitions/deferred):
// All state updates in the reducer: atomic. No partial state.

// AT 35M SCALE: every message send goes through this path.
// The failure rate even at 0.001%: 35,000 failures/day.
// The retry + offline queue: not an edge case. It's essential.`} />

              <CodeBlock label="Message list virtualisation — why it matters at scale" color="#1264A3" code={
`// PROBLEM: Slack channels can have 100,000+ messages.
// Rendering them all: 100K DOM nodes. Browser: frozen.
// Solution: virtual list — render ONLY the visible messages + buffer.
//
// CONCEPTUALLY (simplified for clarity):

function VirtualMessageList({ messages, itemHeight = 72 }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 520; // viewport height
  const totalHeight = messages.length * itemHeight;

  // Calculate visible range with overscan buffer (prevents blank flash during scroll)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 3);
  const endIndex   = Math.min(
    messages.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + 3
  );

  // Only messages in the visible range are rendered:
  const visibleMessages = messages.slice(startIndex, endIndex + 1);

  return (
    <div ref={containerRef} style={{ height: containerHeight, overflow: "auto" }}
         onScroll={e => setScrollTop(e.currentTarget.scrollTop)}>
      {/* Spacer: makes scrollbar correct without rendering all items */}
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleMessages.map((msg, i) => (
          <MessageRow key={msg.id} message={msg}
            style={{ position: "absolute", top: (startIndex + i) * itemHeight, width: "100%" }}
          />
        ))}
      </div>
    </div>
  );
}

// AT 35M SCALE IMPACT:
// Without virtualisation: 10K messages × 3KB DOM per message = 30MB DOM
// With virtualisation: ~20 visible messages × 3KB = 60KB DOM
// Memory: 500× reduction. Scroll: buttery smooth.
//
// SLACK-SPECIFIC CHALLENGE: variable row heights.
// Messages: 1 line or 5 lines depending on content.
// Approach: measure each row after render, cache height per message ID.
// On first render: estimate height. After mount: measure + cache.
// This is the hard part. Libraries like react-window or tanstack-virtual
// handle this but require customisation for Slack's rich messages
// (reactions, thread previews, file attachments, code blocks).`} />
            </div>
          </div>
        </div>
      )}

      {/* ── REAL-TIME ── */}
      {activeTab === "rt" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>REAL-TIME ARCHITECTURE — WEBSOCKET + PRESENCE</div>

            {/* Connection status */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: wsStatus === "connected" ? "#2BAC76" : wsStatus === "connecting" ? "#ECB22E" : "#E01E5A" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: wsStatus === "connected" ? "#2BAC76" : wsStatus === "connecting" ? "#ECB22E" : "#E01E5A" }}>
                    WebSocket: {wsStatus.toUpperCase()}{wsStatus === "connecting" ? ` (attempt ${reconnectAttempt})` : ""}
                  </span>
                </div>
                <button onClick={simulateDisconnect} disabled={wsStatus !== "connected"} style={{ background: "#ef444420", border: "1px solid #ef4444", borderRadius: 6, padding: "4px 10px", cursor: wsStatus === "connected" ? "pointer" : "not-allowed", color: "#f87171", fontSize: 8, fontWeight: 700 }}>
                  Simulate Disconnect
                </button>
              </div>
              <div style={{ fontSize: 7, color: "#64748b" }}>
                {wsStatus === "connected" ? "Events: multiplexed on a single persistent connection. All channels, DMs, and presence on one socket." : wsStatus === "connecting" ? `Reconnecting with exponential backoff: ${Math.pow(2, reconnectAttempt) * 500}ms delay` : "Disconnected. Waiting before reconnect attempt."}
              </div>
            </div>

            {/* Event stream */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>📡 Live WebSocket Event Stream</div>
              <div style={{ maxHeight: 160, overflow: "auto", fontFamily: "monospace" }}>
                {wsEvents.length === 0
                  ? <div style={{ fontSize: 8, color: "#475569" }}>Switch to this tab to see live events…</div>
                  : wsEvents.map((evt, i) => (
                    <div key={`${evt.ts}-${i}`} style={{ display: "flex", gap: 8, marginBottom: 3, alignItems: "baseline" }}>
                      <span style={{ fontSize: 7, color: "#475569", flexShrink: 0 }}>{new Date(evt.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                      <span style={{ fontSize: 7, color: evt.color, fontWeight: 700, flexShrink: 0 }}>{evt.type}</span>
                      <span style={{ fontSize: 7, color: "#94a3b8" }}>{evt.label}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Presence grid */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 8 }}>👥 Team Presence</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {DMS.map(dm => (
                  <div key={dm.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#0f172a", borderRadius: 8, padding: "5px 10px", border: `1px solid ${STATUS_COLOR[dm.status]}30` }}>
                    <div style={{ position: "relative" }}>
                      <Avatar initials={dm.name.split(" ").map(n => n[0]).join("")} color="#334155" size={24} />
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: STATUS_COLOR[dm.status], border: "1.5px solid #1e293b" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 8, fontWeight: 700 }}>{dm.name}</div>
                      <div style={{ fontSize: 7, color: STATUS_COLOR[dm.status] }}>{dm.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Event type legend */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6 }}>Event Types — Single Socket, Multiplexed</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {WS_EVENT_POOL.filter((e, i, arr) => arr.findIndex(x => x.type === e.type) === i).map(e => (
                  <div key={e.type} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 7, color: "#94a3b8", fontFamily: "monospace" }}>{e.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="WebSocket manager — reconnection with exponential backoff" color="#2BAC76" code={
`// WHY A SINGLE MULTIPLEXED WEBSOCKET (not one per channel/DM):
// At 35M DAU: each user is in ~8 channels + ~10 DMs on average.
// One socket per channel: 18 persistent connections per user.
// 35M users × 18 connections = 630 MILLION concurrent connections.
// One socket per user: 35M connections. 18× more efficient.
//
// Slack uses RTM (Real Time Messaging) protocol:
// One WebSocket carries ALL events: messages, typing, presence, reactions.
// Client: subscribes to channels it cares about. Server: filters.

class SlackRTMClient {
  private ws: WebSocket | null = null;
  private reconnectDelay = 500; // ms (base)
  private maxDelay = 32000;     // ms (cap at 32s)
  private pingInterval: number | null = null;

  connect(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onopen    = this.onOpen.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onclose   = this.onClose.bind(this);
    this.ws.onerror   = this.onError.bind(this);
  }

  private onOpen() {
    this.reconnectDelay = 500; // reset backoff on successful connect
    // Heartbeat: send ping every 30s to detect stale connections
    this.pingInterval = window.setInterval(() => {
      this.send({ type: "ping", id: Date.now() });
    }, 30_000);
    eventBus.emit("ws:connected");
  }

  private onClose(event: CloseEvent) {
    clearInterval(this.pingInterval!);
    if (event.wasClean) return; // intentional close (logout, tab close)
    // EXPONENTIAL BACKOFF: 500ms → 1s → 2s → 4s → 8s → 16s → 32s
    setTimeout(() => this.reconnect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
  }

  private onMessage(event: MessageEvent) {
    const msg = JSON.parse(event.data);
    // Route to the correct handler based on event type:
    switch (msg.type) {
      case "message":         handleMessage(msg);         break;
      case "typing":          handleTyping(msg);          break;
      case "presence_change": handlePresenceChange(msg);  break;
      case "reaction_added":  handleReactionAdded(msg);   break;
      case "pong":            /* heartbeat ack */          break;
      default:
        console.warn("Unknown RTM event:", msg.type);
    }
  }

  private reconnect() {
    eventBus.emit("ws:reconnecting", { attempt: this.reconnectAttempt++ });
    this.connect(this.url);
  }
}

// OFFLINE QUEUE: messages typed during disconnect
// When the user sends a message while offline:
//   1. Message is stored in memory (and optionally IndexedDB for crash recovery).
//   2. On reconnect: flush the queue in order.
//   3. Server receives them with original timestamps.

const offlineQueue: Message[] = [];
eventBus.on("ws:connected", () => {
  offlineQueue.forEach(msg => api.sendMessage(msg));
  offlineQueue.length = 0; // clear
});`} />

              <CodeBlock label="Presence system — heartbeat and state machine" color="#ECB22E" code={
`// PRESENCE: online/away/DND/offline.
// Challenge: at 35M DAU, detecting disconnects in real-time is hard.
// If the user closes their laptop: the WebSocket doesn't send a disconnect.
// The TCP connection hangs for up to 7 minutes (TCP timeout).
//
// SOLUTION: Application-level heartbeat.
// Client: sends a ping every 30 seconds.
// Server: if no ping for 90 seconds → mark user as "away".
// After 5 minutes no ping → mark as "offline".
//
// CLIENT-SIDE PRESENCE STATE MACHINE:
type PresenceState = "active" | "idle" | "away" | "dnd";

class PresenceManager {
  private state: PresenceState = "active";
  private idleTimer: number | null = null;
  private readonly IDLE_THRESHOLD = 30_000; // 30s without mouse/key

  constructor() {
    // Detect user activity
    ["mousemove", "keydown", "scroll"].forEach(evt =>
      window.addEventListener(evt, this.onActivity.bind(this), { passive: true })
    );
    // Detect tab visibility (Page Visibility API)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.transition("idle");
      else this.onActivity();
    });
  }

  private onActivity() {
    if (this.state === "dnd") return; // DND: user explicitly set, don't override
    this.transition("active");
    clearTimeout(this.idleTimer!);
    this.idleTimer = window.setTimeout(() => this.transition("idle"), this.IDLE_THRESHOLD);
  }

  private transition(next: PresenceState) {
    if (this.state === next) return;
    const prev = this.state;
    this.state = next;
    // Debounce: don't send a server update for transient idle states
    // (e.g., user pauses typing for 15 seconds but is still "active")
    if (next === "idle") {
      setTimeout(() => {
        if (this.state === "idle") this.notifyServer("away"); // still idle after grace
      }, 60_000); // 1 minute grace before server considers "away"
    } else if (next === "active") {
      this.notifyServer("online");
    }
    eventBus.emit("presence:changed", { prev, next });
  }

  private notifyServer(status: string) {
    rtm.send({ type: "presence_change", presence: status });
  }
}

// WHY THIS MATTERS AT SCALE:
// Presence: shown on every DM, every @mention, every people picker.
// 35M users × presence state: 35M entries in the presence service.
// The heartbeat system: determines when entries expire.
// A 5s vs 30s heartbeat: 6× more server load. 30s is the trade-off.`} />
            </div>
          </div>
        </div>
      )}

      {/* ── ACCESSIBILITY ── */}
      {activeTab === "a11y" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>ACCESSIBILITY — SLACK'S KEYBOARD-FIRST APPROACH</div>

            {/* Live region */}
            {liveAnnouncement && (
              <div role="status" aria-live="polite" style={{ background: "#2BAC7620", border: "1px solid #2BAC76", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 9, color: "#2BAC76", fontWeight: 700 }}>
                📢 Screen reader announces: "{liveAnnouncement}"
              </div>
            )}

            {/* Focus demo */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6 }}>🎯 Focus Management Demo</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                {[
                  { key: "sidebar" as const, label: "1. Channel sidebar",   color: "#4A154B" },
                  { key: "messages" as const, label: "2. Message list",     color: "#1264A3" },
                  { key: "composer" as const, label: "3. Composer",          color: "#2BAC76" },
                ].map(({ key, label, color }) => (
                  <button key={key} onClick={() => { setFocusDemo(key); announce(`Focus moved to: ${label}`); }} style={{ background: focusDemo === key ? `${color}20` : "#0f172a", border: `1px solid ${focusDemo === key ? color : "#334155"}`, borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: focusDemo === key ? color : "#64748b", fontSize: 8, fontWeight: 700 }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ background: "#0f172a", borderRadius: 8, padding: 10, border: "1px solid #334155", height: 80, position: "relative", overflow: "hidden" }}>
                {/* Mini Slack layout */}
                <div style={{ display: "flex", gap: 6, height: "100%", alignItems: "stretch" }}>
                  <div style={{ width: 60, background: "#19171D", borderRadius: 4, border: `2px solid ${focusDemo === "sidebar" ? "#4A154B" : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#616061" }}>sidebar</div>
                  <div style={{ flex: 1, background: "#1A1D21", borderRadius: 4, border: `2px solid ${focusDemo === "messages" ? "#1264A3" : "transparent"}`, display: "flex", flexDirection: "column", gap: 3, padding: 6 }}>
                    <div style={{ fontSize: 7, color: "#616061" }}>message list</div>
                    {[1, 2].map(i => <div key={i} style={{ height: 8, background: "#26282C", borderRadius: 2 }} />)}
                    <div style={{ height: 14, background: "#2C2D30", borderRadius: 3, marginTop: "auto", border: `1px solid ${focusDemo === "composer" ? "#2BAC76" : "#3F3F3F"}` }} />
                  </div>
                </div>
                <div style={{ position: "absolute", top: 4, right: 6, fontSize: 7, color: "#475569" }}>
                  {focusDemo ? `Focus: ${focusDemo}` : "Click above to move focus"}
                </div>
              </div>
            </div>

            {/* Keyboard shortcuts */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6 }}>⌨️ Keyboard Shortcuts — Click to Explore</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                {["Navigation", "Focus", "Messages"].map(cat => (
                  <span key={cat} style={{ fontSize: 7, background: "#0f172a", border: "1px solid #334155", borderRadius: 4, padding: "2px 7px", color: "#64748b" }}>{cat}</span>
                ))}
              </div>
              <div style={{ maxHeight: 200, overflow: "auto" }}>
                {SHORTCUTS.map((s, i) => (
                  <div key={i} onClick={() => { setFocusedShortcut(focusedShortcut === i ? null : i); announce(`Shortcut: ${s.desc}`); }} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 6px", borderRadius: 6, cursor: "pointer", background: focusedShortcut === i ? "#1264A320" : "transparent", marginBottom: 2 }}>
                    <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                      {s.keys.map((k, ki) => (
                        <span key={ki} style={{ background: "#2C2D30", border: "1px solid #3F3F3F", borderRadius: 4, padding: "1px 5px", fontSize: 8, fontFamily: "monospace", color: "#D1D2D3", whiteSpace: "nowrap" }}>{k}</span>
                      ))}
                    </div>
                    <span style={{ fontSize: 8, color: focusedShortcut === i ? "#D1D2D3" : "#616061" }}>{s.desc}</span>
                    <span style={{ fontSize: 7, color: "#475569", marginLeft: "auto", flexShrink: 0 }}>{s.cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="ARIA live regions — real-time message announcements for screen readers" color="#2BAC76" code={
`// CHALLENGE: Slack is a real-time app. New messages appear constantly.
// A screen reader user: cannot watch the screen update.
// Without ARIA live regions: they have no idea new messages arrived.
//
// SOLUTION: ARIA live regions.
// role="log" aria-live="polite": announces new items when the user is idle.
// role="status": for notifications that don't interrupt.
// role="alert" aria-live="assertive": for urgent messages (DM, @mention).

function MessageList({ channel }) {
  const messagesEndRef = useRef(null);

  return (
    <>
      {/*
        The live region: announces new messages to screen readers.
        aria-live="polite": waits until the user finishes their current task.
        aria-relevant="additions": only announce additions, not deletions.
        The visually-hidden announcer: separate from the visible list.
        This gives us control over WHAT is announced (not the full DOM).
      */}
      <div
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
        aria-label={\`Messages in \${channel.name}\`}
        style={{ position: "absolute", left: -9999, top: -9999, width: 1, height: 1, overflow: "hidden" }}
      >
        {/* Only append the latest message here for announcement */}
        {latestMessage && (
          <p>
            {latestMessage.author} said: {latestMessage.text}
          </p>
        )}
      </div>

      {/* The visual message list (separate from the live region) */}
      <div role="list" aria-label="Message history">
        {messages.map(msg => (
          <article role="listitem" key={msg.id}
            aria-label={\`Message from \${msg.author} at \${msg.time}\`}>
            <header>
              <span>{msg.author}</span>
              <time dateTime={msg.isoTime}>{msg.displayTime}</time>
            </header>
            <div>{msg.text}</div>
            {msg.reactions?.length > 0 && (
              <div role="group" aria-label="Reactions">
                {msg.reactions.map(r => (
                  <button
                    aria-label={\`\${r.emoji} reaction, \${r.count} people. \${r.mine ? "You reacted." : ""}\`}
                    aria-pressed={r.mine}
                  >
                    {r.emoji} {r.count}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
        <div ref={messagesEndRef} tabIndex={-1} aria-hidden="true" />
      </div>
    </>
  );
}

// KEY INSIGHT: don't use the visible list as the live region.
// The visible list: can contain 100s of messages.
// If screen reader announces the whole list: overwhelming.
// The hidden announcer: only the LATEST message.
// Screen reader says: "Sarah Chen said: Hey team!". Clean and useful.`} />

              <CodeBlock label="Keyboard navigation — j/k message traversal + focus management" color="#1264A3" code={
`// SLACK KEYBOARD SHORTCUT PHILOSOPHY:
// Power users navigate Slack entirely with keyboard.
// "K" (quick switcher) → type channel name → Enter → in channel.
// "j/k" → move through messages → "e" → react → "t" → thread.
// Never touching the mouse.
//
// IMPLEMENTATION: keyboard router at the app level.

function useSlackKeyboard() {
  const [focusedMessageIndex, setFocusedMessageIndex] = useState(-1);
  const [focusZone, setFocusZone] = useState<"sidebar" | "messages" | "composer">("messages");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in composer
      if (isComposerFocused()) return;

      switch (e.key) {
        case "j": // next message
          e.preventDefault();
          setFocusedMessageIndex(i => Math.min(i + 1, messages.length - 1));
          break;
        case "k": // previous message
          e.preventDefault();
          setFocusedMessageIndex(i => Math.max(i - 1, 0));
          break;
        case "e": // react to focused message
          e.preventDefault();
          if (focusedMessageIndex >= 0) openEmojiPicker(messages[focusedMessageIndex]);
          break;
        case "t": // reply in thread
          e.preventDefault();
          if (focusedMessageIndex >= 0) openThread(messages[focusedMessageIndex]);
          break;
        case "Escape":
          // Context-sensitive: close thread → close search → blur composer
          if (threadPanelOpen)      { closeThread(); break; }
          if (searchOpen)            { closeSearch(); break; }
          if (isComposerFocused())   { blurComposer(); break; }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusedMessageIndex, messages]);

  // Scroll focused message into view
  useEffect(() => {
    if (focusedMessageIndex < 0) return;
    messageRefs[focusedMessageIndex]?.current?.scrollIntoView({
      behavior: "smooth", block: "nearest",
    });
    // Set aria-activedescendant on the container
    messageListRef.current?.setAttribute(
      "aria-activedescendant",
      \`message-\${messages[focusedMessageIndex]?.id}\`
    );
  }, [focusedMessageIndex]);
}

// FOCUS TRAP IN MODALS:
// Every modal (emoji picker, file upload, user profile) traps focus.
// Tab: cycles through the modal's interactive elements.
// Shift+Tab: cycles backwards.
// Escape: closes and RETURNS focus to the element that opened it.
//
// "Return focus on close" is the most commonly missed pattern.
// Without it: screen reader user closes a dialog → focus is lost.
// They're at the top of the document. They have to Tab back to where they were.
const openModal = useCallback((triggerElement: HTMLElement) => {
  modalTriggerRef.current = triggerElement; // remember who opened it
  setModalOpen(true);
}, []);

const closeModal = useCallback(() => {
  setModalOpen(false);
  // Return focus after DOM update
  requestAnimationFrame(() => {
    modalTriggerRef.current?.focus();
  });
}, []);`} />
            </div>
          </div>
        </div>
      )}

      {/* ── STAFF ENGINEERING ── */}
      {activeTab === "lead" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>STAFF ENGINEERING — LEADERSHIP AT 35M DAU SCALE</div>

            {/* Performance budget */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6 }}>⚡ Performance Budget — 35M DAU Impact Calculation</div>
              {PERF_METRICS.map(m => {
                const pct = (m.value / m.budget) * 100;
                const ok  = m.value <= m.budget;
                return (
                  <div key={m.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 8 }}>
                      <span style={{ color: "#94a3b8" }}>{m.label}</span>
                      <span style={{ color: ok ? "#2BAC76" : "#E01E5A", fontWeight: 700 }}>{m.value}{m.unit} / {m.budget}{m.unit}</span>
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: 2, height: 6, overflow: "hidden" }}>
                      <div style={{ background: ok ? "#2BAC76" : "#E01E5A", width: `${Math.min(pct, 100)}%`, height: "100%", borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 8, background: "#0f172a", borderRadius: 6, padding: "6px 8px", fontSize: 7, color: "#64748b" }}>
                <strong style={{ color: "#f1f5f9" }}>Scale math:</strong> 1ms render improvement × 35M users × 10 renders/session = <strong style={{ color: "#2BAC76" }}>97 hours</strong> of aggregate time saved daily.
              </div>
            </div>

            {/* RFC tracker */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6 }}>📋 RFC Lifecycle Tracker</div>
              {RFCS.map(rfc => (
                <div key={rfc.id} onClick={() => setSelectedRfc(selectedRfc === rfc.id ? null : rfc.id)} style={{ background: "#0f172a", border: `1px solid ${RFC_STATUS_COLOR[rfc.status]}30`, borderLeft: `3px solid ${RFC_STATUS_COLOR[rfc.status]}`, borderRadius: 6, padding: "7px 10px", marginBottom: 6, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, fontFamily: "monospace", color: RFC_STATUS_COLOR[rfc.status] }}>{rfc.id}</span>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      <span style={{ fontSize: 7, color: rfc.impact === "Critical" ? "#E01E5A" : rfc.impact === "High" ? "#ECB22E" : "#64748b" }}>{rfc.impact}</span>
                      <span style={{ fontSize: 7, background: `${RFC_STATUS_COLOR[rfc.status]}20`, color: RFC_STATUS_COLOR[rfc.status], borderRadius: 4, padding: "1px 6px" }}>{rfc.status}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 9, color: "#94a3b8" }}>{rfc.title}</div>
                  {selectedRfc === rfc.id && (
                    <div style={{ marginTop: 6, fontSize: 7, color: "#475569", borderTop: "1px solid #1e293b", paddingTop: 6 }}>
                      {rfc.status === "draft" && "📝 Written by you. Requesting reviews from senior engineers and the design team. ETA: 2 weeks to first review round."}
                      {rfc.status === "review" && "🔍 In review with 6 stakeholders across Frontend, Backend, and Mobile. Two rounds of review completed. Addressing feedback on the memory budget for the virtual list cache."}
                      {rfc.status === "approved" && "✅ Approved unanimously. Implementation started. Two engineers mentored through the implementation with weekly design reviews."}
                      {rfc.status === "implemented" && "🚀 Shipped to 100% of users (35M DAU). Post-launch metrics: within all performance budgets. Zero regressions in accessibility tests."}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Leadership metrics */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 6 }}>📊 Technical Leadership Metrics (Quarterly)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { v: "4",  l: "RFCs authored",       c: "#1264A3" },
                  { v: "23", l: "Design reviews led",  c: "#2BAC76" },
                  { v: "6",  l: "Engineers mentored",  c: "#4A154B" },
                  { v: "87", l: "PRs reviewed",        c: "#ECB22E" },
                ].map(m => (
                  <div key={m.l} style={{ background: "#0f172a", borderRadius: 7, padding: "7px 10px", border: `1px solid ${m.c}20` }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: m.c }}>{m.v}</div>
                    <div style={{ fontSize: 7, color: "#64748b" }}>{m.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CodeBlock label="Why performance at 35M DAU requires a different mindset" color="#4A154B" code={
`// AT STARTUP SCALE (100K users):
// A slow component: 10 users complain. You fix it.
// A missed memoization: barely noticeable in aggregate.
//
// AT 35M DAU (Slack scale):
// A 1ms improvement to the message list render:
//   1ms × 35M users × 10 renders/session = 350,000,000 ms/day
//   = 97 HOURS of aggregate time saved EVERY DAY
//
// A missed React.memo() on a message bubble:
//   If it causes 1 extra re-render per message receive:
//   35M users × 20 messages/hour avg × 1ms wasted = 700,000 ms/hour
//   = 194 HOURS of wasted CPU time per hour globally
//
// This is why we treat performance as a feature, not a nice-to-have.
// And why we have performance budgets enforced in CI.

// MEMOIZATION PATTERN for the message bubble (used 35M × N/day):
const MessageBubble = React.memo(({ message, isHovered, onReact, onThread }) => {
  // memoize handlers: prevents child re-renders from stable parent re-renders
  const handleReact = useCallback((emoji) => {
    onReact(message.id, emoji);
  }, [message.id, onReact]);

  return (
    <div style={{ opacity: message.optimistic ? 0.6 : 1 }}>
      <MessageHeader author={message.author} time={message.time} />
      <MessageBody text={message.text} mentions={message.mentions} />
      {message.reactions && (
        <ReactionBar reactions={message.reactions} onReact={handleReact} />
      )}
    </div>
  );
}, (prev, next) => {
  // Custom comparison: only re-render if something visible changed
  // (React.memo default: shallow equality of ALL props)
  return (
    prev.message.id === next.message.id &&
    prev.message.text === next.message.text &&
    prev.message.reactions === next.message.reactions && // referential equality (immutable)
    prev.isHovered === next.isHovered &&
    prev.message.optimistic === next.message.optimistic
  );
});

// WHY custom comparison function instead of React.memo default?
// Default: compares every prop. For onReact + onThread (functions):
// Unless they're memoized with useCallback, they change on every render.
// Result: MessageBubble re-renders on EVERY parent render.
// Custom: we decide what constitutes "different". The props we care about.
//
// At 35M DAU: the MessageBubble renders billions of times per day.
// Each unnecessary re-render: wasted CPU. Real users feel this.`} />

              <CodeBlock label="Prototyping strategy — from idea to 35M users in 6 steps" color="#2BAC76" code={
`// PROTOTYPING AT SLACK'S SCALE:
// Shipping a bad feature to 35M users is very expensive to roll back.
// The prototyping process exists to validate ideas BEFORE full commitment.
//
// STEP 1: LOCAL PROTOTYPE (Day 1-3)
// Build the feature in isolation. No backend. Mock data.
// Goal: does the interaction feel right? Does the performance hold up?
// Tools: React DevTools Profiler, Lighthouse in dev mode.
//
// STEP 2: INTERNAL DOGFOOD (Week 1-2)
// Ship behind a feature flag to Slack employees only.
// ~5,000 internal users. Real data. Real usage patterns.
// "Dogfooding" named after "eating your own dog food."
// Internal users: more forgiving but give detailed, technical feedback.

function useFeatureFlag(flag: string) {
  const user = useCurrentUser();
  // Flags resolve server-side, cached in the app bootstrap payload.
  // No async waterfall: the flag state is known before first render.
  return user.featureFlags.includes(flag);
}

// Usage in component:
const isNewComposerEnabled = useFeatureFlag("new-composer-rich-text");
return isNewComposerEnabled
  ? <NewRichTextComposer />
  : <LegacyComposer />;

//
// STEP 3: 1% BETA ROLLOUT (Week 2-4)
// 1% of 35M users = 350,000 users.
// Large enough for statistically significant data in days.
// Feature flag: tied to a percentage of users by user ID modulo.
//   e.g., userId % 100 < 1 → in the 1% beta group.
// Metric dashboards: monitor error rates, session length, engagement.
// STOP condition: error rate spikes > 0.1% above baseline → auto-rollback.
//
// STEP 4: 10% ROLLOUT (Week 4-6)
// Broader signal. Edge cases emerge.
// Performance: profiling in production (not just dev). Real devices.
// A/B test: compare 10% (new) vs 90% (old) on key metrics.
// Metrics: DAU, session length, message send rate, NPS, error rate.
//
// STEP 5: GRADUAL 100% ROLLOUT (Week 6-8)
// 10% → 25% → 50% → 100% over days.
// Each step: automated rollout + metric monitoring.
// Human checkpoint required to advance each step.
//
// STEP 6: FEATURE FLAG CLEANUP (Week 8+)
// Once at 100% and stable: remove the feature flag and old code path.
// Technical debt: accumulated during the rollout period.
// Flag cleanup: scheduled immediately after 100% confirmation.
// "Never let feature flags become permanent config." — RFC-047 guideline.
//
// WHY THIS MATTERS AS A STAFF ENGINEER:
// Staff engineers: don't just ship features. They design the PROCESS.
// This prototyping framework: designed and documented by me in RFC-039.
// Now used by all 6 teams in the core collaboration org.
// Every feature shipped at Slack: goes through this process.`} />
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-4px); } }`}</style>
    </div>
  );
}

export default SlackCoreDemo;
