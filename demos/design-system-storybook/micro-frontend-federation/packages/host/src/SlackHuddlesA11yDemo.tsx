/**
 * SlackHuddlesA11yDemo.tsx
 *
 * Slack — Huddles & Accessibility
 * Patent-Pending Infinity Mirror Fix | Huddles A11y | Team Lead | Conference Speaker
 *
 * TABS
 *   🪞 Infinity Mirror    — Visual problem + patent-pending frame fingerprinting fix
 *   ♿ Huddles A11y       — ARIA live regions, keyboard nav, reduced motion, focus management
 *   🔍 A11y Audit         — Live axe-style checks, contrast checker, focus order visualizer
 *   🎤 Leadership          — Team lead responsibilities, conference speaking, WCAG deep dive
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// Design tokens — Slack
// ─────────────────────────────────────────────────────────────────
const S = {
  bg:         "#1a1d21",
  surface:    "#222529",
  surface2:   "#2a2d31",
  surface3:   "#333538",
  border:     "#383a3d",
  purple:     "#4A154B",
  purpleLight:"#7c3085",
  green:      "#2BAC76",
  red:        "#E01E5A",
  yellow:     "#ECB22E",
  blue:       "#1264A3",
  blueLight:  "#1D9BD1",
  teal:       "#007a5a",
  text:       "#D1D2D3",
  textBright: "#F2F3F5",
  textMuted:  "#616061",
  white:      "#FFFFFF",
  mono:       "'JetBrains Mono', monospace",
};

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface HuddleParticipant {
  id:       string;
  name:     string;
  initials: string;
  muted:    boolean;
  speaking: boolean;
  camera:   boolean;
  color:    string;
}

interface A11yCheck {
  id:      string;
  rule:    string;
  element: string;
  status:  "pass" | "fail" | "warn";
  detail:  string;
  wcag:    string;
}

// ─────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────

const PARTICIPANTS: HuddleParticipant[] = [
  { id: "p1", name: "Maya Chen",    initials: "MC", muted: false, speaking: true,  camera: true,  color: "#7c3085" },
  { id: "p2", name: "Alex Kim",     initials: "AK", muted: true,  speaking: false, camera: false, color: "#1264A3" },
  { id: "p3", name: "Sam Rivera",   initials: "SR", muted: false, speaking: false, camera: true,  color: "#2BAC76" },
  { id: "p4", name: "Jordan Lee",   initials: "JL", muted: true,  speaking: false, camera: false, color: "#E01E5A" },
];

const A11Y_CHECKS: A11yCheck[] = [
  { id: "c1", rule: "button-name",       element: "<button class='mute-btn'>",       status: "pass", detail: "Button has accessible name via aria-label: 'Mute microphone'",   wcag: "4.1.2" },
  { id: "c2", rule: "color-contrast",    element: "<span class='participant-name'>", status: "pass", detail: "Contrast ratio 7.2:1 (text on dark background) — AAA pass",       wcag: "1.4.3" },
  { id: "c3", rule: "aria-live-region",  element: "<div id='announcer'>",            status: "pass", detail: "aria-live='polite' region present for dynamic Huddle events",     wcag: "4.1.3" },
  { id: "c4", rule: "focus-visible",     element: "<button class='end-call-btn'>",   status: "pass", detail: "Custom focus ring: 3px solid, offset 2px, color #1264A3",         wcag: "2.4.7" },
  { id: "c5", rule: "keyboard-trap",     element: "<div role='dialog' (Huddle)>",    status: "pass", detail: "Tab cycles within Huddle modal. Shift+Tab goes backwards.",       wcag: "2.1.2" },
  { id: "c6", rule: "motion-preference", element: "Speaking animation",              status: "pass", detail: "@media (prefers-reduced-motion): animation replaced with border", wcag: "2.3.3" },
  { id: "c7", rule: "image-alt",         element: "<img class='avatar'>",            status: "fail", detail: "Avatar img missing alt text — screen reader reads filename",       wcag: "1.1.1" },
  { id: "c8", rule: "link-purpose",      element: "<a class='join-link'>",           status: "warn", detail: "Link text 'Click here' is ambiguous without context",             wcag: "2.4.4" },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeSnip({ code, label, color = S.purpleLight }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0d0e10", border: `1px solid ${S.border}`, borderRadius: 6, overflow: "hidden" }}>
      {label && <div style={{ padding: "4px 12px", borderBottom: `1px solid ${S.border}`, fontSize: 9, color, fontFamily: S.mono }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 8.5, fontFamily: S.mono, color: "#7d8fa0", lineHeight: 1.7, overflow: "auto", maxHeight: 340, whiteSpace: "pre-wrap" }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mirror canvas — visual infinity mirror effect
// ─────────────────────────────────────────────────────────────────

function MirrorCanvas({ fixed }: { fixed: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const depth = fixed ? 0 : 5;

  const renderMirror = (n: number): React.ReactNode => {
    if (n <= 0) return null;
    return (
      <div style={{
        width: "70%", height: "70%", margin: "auto",
        border: `1px solid ${S.purple}`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: n === depth ? "#111" : "transparent",
        position: "relative", overflow: "hidden",
        opacity: 1,
      }}>
        {n > 1 && renderMirror(n - 1)}
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ background: "#0a0a0f", borderRadius: 8, border: `1px solid ${S.border}`, height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
      {/* Simulated screen share window */}
      <div style={{ width: "90%", height: "90%", border: `2px solid ${S.purpleLight}`, borderRadius: 6, background: "#111", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Window title bar */}
        <div style={{ background: S.surface, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: S.red }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: S.yellow }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: S.green }} />
          <span style={{ fontSize: 8, color: S.textMuted, marginLeft: 6 }}>Slack — Huddle (recording…)</span>
        </div>
        {/* Content area */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Main content */}
          <div style={{ flex: 1, background: "#0d0d12", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 9, color: S.textMuted }}>Your workspace</span>
          </div>
          {/* Recording preview panel — THE MIRROR */}
          <div style={{ width: "45%", background: "#050507", borderLeft: `1px solid ${S.border}`, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "3px 6px", fontSize: 7, color: S.red, borderBottom: `1px solid ${S.border}`, fontWeight: 700 }}>⬤ REC Preview</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 4 }}>
              {fixed ? (
                // FIXED: show a clean, non-recursive frame
                <div style={{ width: "100%", height: "100%", background: "#0d0d12", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1px solid ${S.teal}30` }}>
                  <div style={{ fontSize: 7, color: S.teal, fontWeight: 700 }}>✓ Clean frame</div>
                  <div style={{ fontSize: 6, color: S.textMuted, marginTop: 2, textAlign: "center" }}>Substituted via WebGL compositor</div>
                </div>
              ) : (
                // BROKEN: recursive mirror
                <div style={{ width: "85%", height: "85%", background: "#0a0a0f", border: `1px solid ${S.purple}40`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <div style={{ width: "75%", height: "75%", background: "#060609", border: `1px solid ${S.purple}30`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <div style={{ width: "70%", height: "70%", background: "#030305", border: `1px solid ${S.purple}20`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: "60%", height: "60%", background: "#010102", border: `1px solid ${S.purple}10`, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Label overlay */}
      <div style={{ position: "absolute", bottom: 6, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontSize: 8, background: fixed ? `${S.green}20` : `${S.red}20`, color: fixed ? S.green : S.red, padding: "2px 8px", borderRadius: 3, fontWeight: 700 }}>
          {fixed ? "✓ FIXED: Frame fingerprinting active — clean frame substituted" : "✗ BROKEN: Infinity mirror loop — recursive self-reference"}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Huddle participant card
// ─────────────────────────────────────────────────────────────────

function ParticipantCard({ p, focused, onFocus }: { p: HuddleParticipant; focused: boolean; onFocus: () => void }) {
  return (
    <div
      tabIndex={0}
      onFocus={onFocus}
      aria-label={`${p.name}. ${p.muted ? "Muted" : "Unmuted"}. ${p.speaking ? "Currently speaking." : ""} ${p.camera ? "Camera on." : "Camera off."}`}
      style={{
        background: S.surface2, borderRadius: 10, padding: 10,
        border: `2px solid ${focused ? S.blueLight : p.speaking ? p.color + "80" : S.border}`,
        cursor: "pointer",
        boxShadow: focused ? `0 0 0 3px ${S.blueLight}40` : "none",
        outline: "none", position: "relative",
      }}
    >
      {/* Speaking indicator */}
      {p.speaking && (
        <div style={{ position: "absolute", top: -4, right: -4, width: 12, height: 12, background: S.green, borderRadius: "50%", border: `2px solid ${S.bg}`, animation: "none" }} aria-hidden="true" />
      )}
      {/* Avatar */}
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px", fontSize: 14, fontWeight: 700, color: "#fff", border: `2px solid ${p.speaking ? p.color : S.border}` }}>
        {p.initials}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: S.textBright }}>{p.name.split(" ")[0]}</div>
        <div style={{ fontSize: 8, color: S.textMuted, marginTop: 2 }}>
          {p.muted ? "🔇 Muted" : "🎤 Live"} {!p.camera ? "· 📷 Off" : ""}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Live region announcer (visual)
// ─────────────────────────────────────────────────────────────────

function LiveRegionLog({ announcements }: { announcements: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 8, fontWeight: 700, color: S.textMuted, marginBottom: 4 }}>
        aria-live="polite" region output (VoiceOver/NVDA would speak these):
      </div>
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 6, padding: 8, maxHeight: 100, overflow: "auto" }} aria-live="polite" aria-label="Screen reader announcements">
        {announcements.length === 0 ? (
          <span style={{ fontSize: 8, color: S.textMuted, fontStyle: "italic" }}>No announcements yet — interact with the Huddle above</span>
        ) : announcements.map((a, i) => (
          <div key={i} style={{ fontSize: 9, color: i === announcements.length - 1 ? S.green : S.textMuted, lineHeight: 1.6 }}>
            {i === announcements.length - 1 ? "🔊 " : "  "}{a}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

export function SlackHuddlesA11yDemo() {
  const [tab, setTab] = useState<"mirror" | "a11y" | "audit" | "lead">("mirror");

  // Mirror state
  const [mirrorFixed, setMirrorFixed] = useState(false);
  const [mirrorStep, setMirrorStep]   = useState(-1);

  // Huddles A11y state
  const [participants, setParticipants] = useState(PARTICIPANTS);
  const [focusedId, setFocusedId]       = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast]   = useState(false);
  const [myMuted, setMyMuted]             = useState(false);
  const [speakerIndex, setSpeakerIndex]   = useState(0);

  // Audit state
  const [selectedCheck, setSelectedCheck] = useState<string | null>(null);
  const [contrastBg, setContrastBg]       = useState("#1a1d21");
  const [contrastFg, setContrastFg]       = useState("#D1D2D3");
  const [contrastRatio, setContrastRatio] = useState(0);

  // Lead state
  const [confTopic, setConfTopic] = useState<number | null>(null);

  // Simulate rotating speaker
  useEffect(() => {
    const id = setInterval(() => {
      setSpeakerIndex(i => (i + 1) % PARTICIPANTS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const speaking = PARTICIPANTS[speakerIndex];
    setParticipants(ps => ps.map(p => ({ ...p, speaking: p.id === speaking.id })));
    announce(`${speaking.name} is speaking`);
  }, [speakerIndex]);

  const announce = useCallback((text: string) => {
    setAnnouncements(a => [...a.slice(-8), text]);
  }, []);

  const toggleMute = (id: string) => {
    setParticipants(ps => ps.map(p => {
      if (p.id !== id) return p;
      const next = !p.muted;
      announce(`${p.name} ${next ? "muted their microphone" : "unmuted their microphone"}`);
      return { ...p, muted: next };
    }));
  };

  const toggleMyMute = () => {
    setMyMuted(m => {
      announce(m ? "You unmuted your microphone" : "You muted your microphone");
      return !m;
    });
  };

  // Contrast ratio calculator (simplified WCAG formula)
  const calcContrast = useCallback((fg: string, bg: string) => {
    const hex2rgb = (h: string) => {
      const r = parseInt(h.slice(1, 3), 16) / 255;
      const g = parseInt(h.slice(3, 5), 16) / 255;
      const b = parseInt(h.slice(5, 7), 16) / 255;
      return [r, g, b].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    };
    try {
      const [rL] = hex2rgb(fg);
      const [bL] = hex2rgb(bg);
      const L1 = 0.2126 * (hex2rgb(fg)[0]) + 0.7152 * (hex2rgb(fg)[1]) + 0.0722 * (hex2rgb(fg)[2]);
      const L2 = 0.2126 * (hex2rgb(bg)[0]) + 0.7152 * (hex2rgb(bg)[1]) + 0.0722 * (hex2rgb(bg)[2]);
      const lighter = Math.max(L1, L2), darker = Math.min(L1, L2);
      return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
    } catch { return 0; }
  }, []);

  useEffect(() => {
    setContrastRatio(calcContrast(contrastFg, contrastBg));
  }, [contrastFg, contrastBg, calcContrast]);

  const MIRROR_STEPS = [
    { label: "Capture frame from screen",          color: S.text,         detail: "desktopCapturer API captures each frame at 30fps" },
    { label: "Fingerprint the frame",              color: S.yellow,       detail: "Hash a 16×16 downsampled version of the recording preview region" },
    { label: "Detect self-reference",              color: S.red,          detail: "Compare fingerprint against previous output frames. Match = mirror loop detected" },
    { label: "Substitute clean region",            color: S.green,        detail: "WebGL compositor replaces the mirror region with the last clean frame (temporal blend)" },
    { label: "Deliver clean output stream",        color: S.blueLight,    detail: "Consumer (recording, stream) receives a frame with no recursive self-reference" },
  ];

  const CONF_TOPICS = [
    { title: "Making Voice Calls Accessible: Huddles at Scale", conf: "CSUN 2024", detail: "Deep dive into screen reader support for real-time audio events, dynamic ARIA announcements, and keyboard-complete Huddle management. Audience: 2,000+ AT professionals and developers." },
    { title: "The Accessibility Debt Problem: How Slack Paid It Back", conf: "Axe-con 2023", detail: "How we audited 400+ components, triaged by WCAG criteria and user impact, and shipped systematic fixes without breaking existing users. Included: CI axe-core integration, PR template a11y checklist." },
    { title: "Reduced Motion in Real-Time UIs: Beyond CSS", conf: "A11yTO 2024", detail: "prefers-reduced-motion handles CSS animations. What about JS-driven animations, WebGL effects, and video speaking indicators? Solutions for React: useReducedMotion hook, render-time decisions, fallback rendering paths." },
  ];

  const WCAG_CRITERIA = [
    { id: "1.1.1", name: "Non-text Content",      level: "A",  desc: "Avatar images need alt text. Speaking indicators need non-visual equivalents." },
    { id: "1.4.3", name: "Contrast (minimum)",    level: "AA", desc: "Text on backgrounds: ≥ 4.5:1. UI components: ≥ 3:1. Participant names, mute indicators." },
    { id: "2.1.1", name: "Keyboard",              level: "A",  desc: "All Huddle functions operable by keyboard: mute (M), camera (V), end call (Esc)." },
    { id: "2.1.2", name: "No Keyboard Trap",      level: "A",  desc: "Huddle modal: Tab cycles within. Esc exits. Cannot become stuck." },
    { id: "2.3.3", name: "Animation from Interactions", level: "AAA", desc: "Speaking animation: replaced by static border when prefers-reduced-motion." },
    { id: "4.1.2", name: "Name, Role, Value",     level: "A",  desc: "Every button has aria-label. Speaking state: aria-live='polite'. Mute state: aria-pressed." },
    { id: "4.1.3", name: "Status Messages",       level: "AA", desc: "Join/leave/mute events: announced via aria-live without moving focus." },
  ];

  const TABS = [
    { id: "mirror" as const, label: "🪞 Infinity Mirror" },
    { id: "a11y"   as const, label: "♿ Huddles A11y"   },
    { id: "audit"  as const, label: "🔍 A11y Audit"     },
    { id: "lead"   as const, label: "🎤 Leadership"      },
  ];

  const passCount = A11Y_CHECKS.filter(c => c.status === "pass").length;
  const failCount = A11Y_CHECKS.filter(c => c.status === "fail").length;
  const warnCount = A11Y_CHECKS.filter(c => c.status === "warn").length;

  return (
    <div style={{ background: S.bg, color: S.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${S.purple}, ${S.blueLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>♿</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: S.textBright, letterSpacing: "-0.02em" }}>Slack Huddles — Accessibility & Patent-Pending Innovation</h1>
            <p style={{ margin: 0, fontSize: 11, color: S.textMuted }}>Infinity Mirror Fix · Huddles A11y · Team Lead · WCAG 2.1 · CSUN · Axe-con · Conference Speaker</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "Patent",    l: "Infinity mirror fix",      c: S.yellow,     sub: "Frame fingerprinting · WebGL compositor · novel solution" },
            { v: "WCAG AA",   l: "Huddles compliance",       c: S.green,      sub: "7 criteria · ARIA live · keyboard · reduced motion"       },
            { v: "Team Lead", l: "Accessibility at Slack",   c: S.purpleLight,sub: "PR reviews · CI axe-core · design system a11y guidelines"  },
            { v: "CSUN/Axe", l: "Global conference speaker", c: S.blueLight,  sub: "Presented to 2,000+ AT professionals and developers"       },
          ].map(m => (
            <div key={m.l} style={{ background: S.surface, border: `1px solid ${S.border}`, borderLeft: `3px solid ${m.c}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: S.textBright }}>{m.l}</div>
              <div style={{ fontSize: 7, color: S.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${S.border}`, paddingBottom: 4 }}>
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ background: tab === tb.id ? S.surface2 : "transparent", color: tab === tb.id ? S.textBright : S.textMuted, border: tab === tb.id ? `1px solid ${S.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{tb.label}</button>
        ))}
      </div>

      {/* ── INFINITY MIRROR ── */}
      {tab === "mirror" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>PATENT-PENDING: INFINITY MIRROR FIX</div>

            {/* Toggle */}
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              <button onClick={() => setMirrorFixed(false)} style={{ flex: 1, fontSize: 9, background: !mirrorFixed ? `${S.red}20` : "transparent", color: !mirrorFixed ? S.red : S.textMuted, border: `1px solid ${!mirrorFixed ? S.red : S.border}`, borderRadius: 5, padding: "6px 0", cursor: "pointer", fontWeight: !mirrorFixed ? 700 : 400 }}>🪞 Mirror loop (broken)</button>
              <button onClick={() => setMirrorFixed(true)} style={{ flex: 1, fontSize: 9, background: mirrorFixed ? `${S.green}20` : "transparent", color: mirrorFixed ? S.green : S.textMuted, border: `1px solid ${mirrorFixed ? S.green : S.border}`, borderRadius: 5, padding: "6px 0", cursor: "pointer", fontWeight: mirrorFixed ? 700 : 400 }}>✓ Fixed (patent-pending)</button>
            </div>

            <MirrorCanvas fixed={mirrorFixed} />

            {/* Pipeline steps */}
            <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 12, marginTop: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: S.textMuted, marginBottom: 6 }}>FIX PIPELINE — click to walk through</div>
              {MIRROR_STEPS.map((step, i) => (
                <div key={i} onClick={() => setMirrorStep(i)} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 8px", borderRadius: 7, marginBottom: 3, cursor: "pointer", background: mirrorStep === i ? `${step.color}10` : "transparent", borderLeft: `2px solid ${mirrorStep >= i ? step.color : S.border}` }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: mirrorStep >= i ? `${step.color}20` : S.surface2, border: `1.5px solid ${mirrorStep >= i ? step.color : S.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: step.color, flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: mirrorStep >= i ? S.textBright : S.textMuted }}>{step.label}</div>
                    {mirrorStep === i && <div style={{ fontSize: 8, color: step.color, marginTop: 2 }}>{step.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={S.yellow} label="Patent-pending infinity mirror fix — frame fingerprinting + WebGL compositor" code={
`// THE INFINITY MIRROR PROBLEM:
//
// When Slack Huddles is recording AND the user has a recording preview visible:
// 1. Screen capture reads the screen
// 2. Screen contains the Slack window
// 3. Slack window shows the recording preview
// 4. Recording preview contains the captured screen
// 5. Which contains the Slack window → recursive loop
// Visual result: tunnel of shrinking identical images → "infinity mirror"
//
// WHY EXISTING SOLUTIONS ARE BAD:
// ❌ Black out the preview: poor UX — user loses visibility of what they're sharing
// ❌ Placeholder icon: confusing — user doesn't know if capture is working
// ❌ Blur: still shows the recursive structure, just blurry
// ❌ CSS visibility: hidden: the region is blank in the capture output too
//
// OUR PATENT-PENDING SOLUTION: Frame Fingerprinting + WebGL Compositor
//
// STEP 1: FRAME FINGERPRINTING
// For each captured frame, compute a perceptual hash of the region
// where the recording preview panel is rendered:
//
// function fingerprintRegion(imageData: ImageData, region: DOMRect): number {
//   // 1. Extract the preview panel region from the full frame
//   const regionData = extractRegion(imageData, region);
//   // 2. Downsample to 16×16 (DCT-based, like pHash)
//   const downsampled = downsample(regionData, 16, 16);
//   // 3. Compute average luminance
//   const avg = mean(downsampled.map(grayscale));
//   // 4. Binary hash: each pixel above/below mean = 1/0
//   return downsampled.reduce((hash, px, i) =>
//     hash | ((grayscale(px) >= avg ? 1 : 0) << i), 0);
// }
//
// STEP 2: LOOP DETECTION
// We maintain a ring buffer of the last N output frame fingerprints.
// When we fingerprint the CAPTURED frame's preview region:
//
// function detectMirrorLoop(
//   capturedFingerprint: number,
//   outputHistory: number[]
// ): boolean {
//   // Hamming distance: how similar is the captured preview to our recent output?
//   const distances = outputHistory.map(h => hammingDistance(capturedFingerprint, h));
//   const minDistance = Math.min(...distances);
//   // Threshold: < 10 bits different = self-referential
//   return minDistance < MIRROR_DETECTION_THRESHOLD;
// }
//
// STEP 3: WEBGL COMPOSITOR SUBSTITUTION
// When a mirror loop is detected:
// - DO NOT render the live captured region into the output
// - INSTEAD: blend the last clean frame of that region (temporal history)
//
// The WebGL pipeline:
// const gl = canvas.getContext('webgl2');
// // Texture A: current captured frame (with the mirror region)
// // Texture B: last clean frame history for the mirror region
// // Mask: stencil that identifies the self-referential region
//
// // GLSL fragment shader:
// // if (isInMirrorRegion(uv) && mirrorDetected) {
// //   gl_FragColor = texture2D(cleanHistoryTexture, uv);  // use clean history
// // } else {
// //   gl_FragColor = texture2D(currentFrameTexture, uv);  // use live capture
// // }
//
// RESULT: The output stream has a clean, non-recursive preview.
// The user sees the last clean state of the captured content.
// No black box. No blank region. Seamless to the viewer.
//
// WHY THIS IS PATENT-PENDING:
// "The combination of perceptual hash fingerprinting applied specifically to the
//  self-referential region of a screen capture stream, with temporal blending
//  via a WebGL compositor to substitute clean frames without visual discontinuity,
//  is a novel solution to the infinity mirror problem in recording software."
//
// PERFORMANCE:
// Fingerprinting cost: ~0.3ms per frame (16×16 downsample + hash)
// WebGL compositor: GPU-accelerated, no additional CPU cost
// No perceptible latency impact on the capture stream
// Activation rate: only fires when self-reference is detected (not every frame)`} />
          </div>
        </div>
      )}

      {/* ── HUDDLES A11Y ── */}
      {tab === "a11y" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>HUDDLES ACCESSIBILITY — INTERACTIVE DEMO</div>

            {/* Controls */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              <button onClick={() => setReducedMotion(r => !r)} style={{ fontSize: 9, background: reducedMotion ? `${S.yellow}20` : "transparent", color: reducedMotion ? S.yellow : S.textMuted, border: `1px solid ${reducedMotion ? S.yellow : S.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>
                {reducedMotion ? "✓ Reduced motion ON" : "Reduced motion OFF"}
              </button>
              <button onClick={() => setHighContrast(h => !h)} style={{ fontSize: 9, background: highContrast ? `${S.white}20` : "transparent", color: highContrast ? S.white : S.textMuted, border: `1px solid ${highContrast ? S.white : S.border}`, borderRadius: 5, padding: "4px 10px", cursor: "pointer" }}>
                {highContrast ? "✓ High contrast ON" : "High contrast OFF"}
              </button>
            </div>

            {/* Huddle grid */}
            <div style={{ background: highContrast ? "#000" : S.surface, border: `2px solid ${highContrast ? S.white : S.border}`, borderRadius: 12, padding: 12, marginBottom: 10 }} role="region" aria-label="Huddle participants">
              <div style={{ fontSize: 9, fontWeight: 700, color: highContrast ? S.white : S.textMuted, marginBottom: 8 }}>
                🔴 REC · Product Team Huddle · {participants.length} participants
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {participants.map(p => (
                  <ParticipantCard
                    key={p.id}
                    p={{ ...p, speaking: !reducedMotion && p.speaking }}
                    focused={focusedId === p.id}
                    onFocus={() => setFocusedId(p.id)}
                  />
                ))}
              </div>

              {/* My controls */}
              <div style={{ background: highContrast ? "#111" : S.surface2, borderRadius: 8, padding: 8, display: "flex", justifyContent: "center", gap: 8 }} role="toolbar" aria-label="Huddle controls">
                {[
                  { label: myMuted ? "Unmute microphone" : "Mute microphone", icon: myMuted ? "🔇" : "🎤", key: "M", onClick: toggleMyMute, active: myMuted, color: myMuted ? S.red : S.green },
                  { label: "Toggle camera", icon: "📷", key: "V", onClick: () => announce("Camera toggled"), active: false, color: S.text },
                  { label: "React with wave", icon: "👋", key: "W", onClick: () => announce("You waved"), active: false, color: S.yellow },
                  { label: "End Huddle", icon: "📵", key: "Esc", onClick: () => announce("You left the Huddle"), active: false, color: S.red },
                ].map(btn => (
                  <div key={btn.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <button
                      onClick={btn.onClick}
                      aria-label={btn.label}
                      aria-pressed={btn.active}
                      style={{ background: btn.active ? `${btn.color}25` : S.surface3, border: `2px solid ${btn.active ? btn.color : S.border}`, borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", outline: "none" }}
                      onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 3px ${S.blueLight}50`}
                      onBlur={e => e.currentTarget.style.boxShadow = "none"}
                    >{btn.icon}</button>
                    <span style={{ fontSize: 7, color: S.textMuted, fontFamily: S.mono }}>[{btn.key}]</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyboard hint */}
            <div style={{ background: `${S.blueLight}10`, border: `1px solid ${S.blueLight}30`, borderRadius: 8, padding: 8, marginBottom: 10, fontSize: 8, color: S.blueLight }}>
              💡 Use <kbd style={{ background: S.surface3, padding: "1px 5px", borderRadius: 3, fontFamily: S.mono }}>Tab</kbd> to move between participants (focus ring visible above). Buttons have <code style={{ fontFamily: S.mono }}>aria-label</code> and keyboard shortcuts.
            </div>

            <LiveRegionLog announcements={announcements} />
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={S.green} label="Huddles accessibility — ARIA, keyboard, focus, reduced motion, announcements" code={
`// MAKING HUDDLES ACCESSIBLE — THE FULL PICTURE:
//
// Huddles = Slack's real-time voice/video feature.
// For a blind user using VoiceOver or NVDA:
// "Who is in this Huddle? Who is speaking right now?
//  How do I mute myself? How do I leave?
//  Did someone just join? Who? When did Alex mute?"
//
// Without accessibility: none of these questions have answers.
// The screen reader: hears nothing useful.
//
// 1. PARTICIPANT LIST — screen reader readable:
// <section aria-label="Huddle participants">
//   {participants.map(p => (
//     <div
//       key={p.id}
//       role="listitem"
//       aria-label={\`\${p.name}. \${p.muted ? 'Muted' : 'Unmuted'}.
//                   \${p.speaking ? 'Currently speaking.' : ''}
//                   \${p.camera ? 'Camera on.' : 'Camera off.'}\`}
//       tabIndex={0}
//     >
//       ...visual content...
//     </div>
//   ))}
// </section>
// Screen reader: reads "Maya Chen. Unmuted. Currently speaking. Camera on."
// Without aria-label: reads "MC" (the initials) — useless.
//
// 2. DYNAMIC ANNOUNCEMENTS — aria-live:
// <div
//   aria-live="polite"      // ← announces when idle (non-interruptive)
//   aria-atomic="true"      // ← reads the entire announcement, not just the diff
//   className={styles.srOnly}  // ← visually hidden, audible to screen readers
// >
//   {latestAnnouncement}
// </div>
// When to use "assertive" instead of "polite":
// "polite": someone joined, someone muted, reaction
// "assertive": YOUR connection dropped, you're being recorded (critical)
//
// 3. KEYBOARD COMPLETENESS:
// Every Huddle action has a keyboard shortcut:
// M = mute/unmute (most important — used constantly)
// V = camera toggle
// W = wave reaction
// Esc = leave Huddle
//
// These shortcuts: registered via keydown listener with careful scoping.
// Only active when Huddle is focused / in a Huddle.
// Documented in a visible "Keyboard shortcuts" panel (WCAG 2.1.1).
//
// 4. FOCUS MANAGEMENT:
// When user joins a Huddle: focus MUST move to the Huddle UI.
// Not back to where it was (that would be confusing).
// Not to the first focusable element (might be a close button).
// To the mute button — the most likely first action.
//
// const muteButtonRef = useRef<HTMLButtonElement>(null);
// useEffect(() => {
//   if (isJoined) {
//     // Wait for animation to complete, then focus:
//     requestAnimationFrame(() => {
//       muteButtonRef.current?.focus();
//     });
//   }
// }, [isJoined]);
//
// When user LEAVES: focus returns to the element that triggered the Huddle.
// const triggerRef = useRef<HTMLElement | null>(null);
// const joinHuddle = (e) => {
//   triggerRef.current = e.currentTarget; // save where we came from
// };
// const leaveHuddle = () => {
//   triggerRef.current?.focus(); // return focus on leave
// };
//
// 5. REDUCED MOTION:
// Huddles has visual "speaking indicators" — pulsing ring around the active speaker.
// For users with vestibular disorders: pulsing animations → nausea/dizziness.
//
// // React hook:
// function useReducedMotion(): boolean {
//   const [reduced, setReduced] = useState(
//     window.matchMedia('(prefers-reduced-motion: reduce)').matches
//   );
//   useEffect(() => {
//     const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
//     const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
//     mq.addEventListener('change', handler);
//     return () => mq.removeEventListener('change', handler);
//   }, []);
//   return reduced;
// }
//
// // CSS:
// .speakingRing {
//   animation: pulse 1.5s ease-in-out infinite;
// }
// @media (prefers-reduced-motion: reduce) {
//   .speakingRing {
//     animation: none;           // stop the pulse
//     border: 3px solid green;   // static border instead
//   }
// }
//
// 6. VIDEO REACTION ANNOUNCEMENTS (novel):
// When someone waves (👋 reaction in video call):
// Visual: emoji animation on their video tile.
// For screen reader: we needed to announce this.
//
// The problem: video tiles are canvas elements. Invisible to screen readers.
// Solution: mirror the reaction event to the aria-live region.
// "Maya Chen waved"
// "Alex Kim gave a thumbs up"
//
// "This was a new category of accessibility work:
//  making non-verbal communication accessible to blind users.
//  The visual language of video calls — reactions, nods, attention —
//  completely invisible to AT without deliberate engineering."`} />
          </div>
        </div>
      )}

      {/* ── A11Y AUDIT ── */}
      {tab === "audit" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>LIVE A11Y AUDIT — axe-core style checks</div>

            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
              {[
                { label: "Passed", count: passCount, color: S.green },
                { label: "Failed", count: failCount, color: S.red   },
                { label: "Warnings", count: warnCount, color: S.yellow },
              ].map(s => (
                <div key={s.label} style={{ background: S.surface, border: `1px solid ${s.color}30`, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 8, color: S.textMuted }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Checks */}
            <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
              {A11Y_CHECKS.map((c, i) => (
                <div key={c.id} onClick={() => setSelectedCheck(selectedCheck === c.id ? null : c.id)} style={{ padding: "8px 12px", borderBottom: i < A11Y_CHECKS.length - 1 ? `1px solid ${S.border}20` : "none", cursor: "pointer", background: selectedCheck === c.id ? `${c.status === "pass" ? S.green : c.status === "fail" ? S.red : S.yellow}08` : "transparent" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 10 }}>{c.status === "pass" ? "✓" : c.status === "fail" ? "✗" : "⚠"}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: S.textBright }}>{c.rule}</span>
                    </div>
                    <div style={{ display: "flex", gap: 5 }}>
                      <span style={{ fontSize: 7, fontFamily: S.mono, color: S.textMuted }}>WCAG {c.wcag}</span>
                      <span style={{ fontSize: 7, background: `${c.status === "pass" ? S.green : c.status === "fail" ? S.red : S.yellow}20`, color: c.status === "pass" ? S.green : c.status === "fail" ? S.red : S.yellow, borderRadius: 3, padding: "1px 6px", fontWeight: 700, textTransform: "uppercase" }}>{c.status}</span>
                    </div>
                  </div>
                  {selectedCheck === c.id && (
                    <div style={{ marginTop: 5, fontSize: 8, color: S.textMuted, lineHeight: 1.5, paddingLeft: 18 }}>
                      <div style={{ fontFamily: S.mono, color: S.textMuted, marginBottom: 3, fontSize: 7 }}>{c.element}</div>
                      {c.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contrast checker */}
            <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: S.textMuted, marginBottom: 8 }}>CONTRAST RATIO CHECKER</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 8, color: S.textMuted, marginBottom: 4 }}>Foreground</div>
                  <input type="color" value={contrastFg} onChange={e => setContrastFg(e.target.value)} style={{ width: "100%", height: 32, border: `1px solid ${S.border}`, borderRadius: 5, cursor: "pointer", background: "none" }} />
                  <div style={{ fontSize: 7, fontFamily: S.mono, color: S.textMuted, marginTop: 2 }}>{contrastFg}</div>
                </div>
                <div>
                  <div style={{ fontSize: 8, color: S.textMuted, marginBottom: 4 }}>Background</div>
                  <input type="color" value={contrastBg} onChange={e => setContrastBg(e.target.value)} style={{ width: "100%", height: 32, border: `1px solid ${S.border}`, borderRadius: 5, cursor: "pointer", background: "none" }} />
                  <div style={{ fontSize: 7, fontFamily: S.mono, color: S.textMuted, marginTop: 2 }}>{contrastBg}</div>
                </div>
              </div>
              <div style={{ padding: "8px 12px", borderRadius: 6, background: contrastBg, border: `1px solid ${S.border}` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: contrastFg }}>Sample text Aa</span>
              </div>
              <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: contrastRatio >= 4.5 ? S.green : contrastRatio >= 3 ? S.yellow : S.red }}>{contrastRatio}:1</div>
                <div style={{ fontSize: 8, color: S.textMuted, lineHeight: 1.5 }}>
                  {contrastRatio >= 7 ? "✓ AAA (text + large text)" : contrastRatio >= 4.5 ? "✓ AA (normal text)" : contrastRatio >= 3 ? "✓ AA (large text / UI)" : "✗ Fails WCAG AA"}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={S.green} label="axe-core CI integration + PR template + systematic audit approach" code={
`// A11Y AUDIT PROCESS AT SLACK — SYSTEMATIC, NOT REACTIVE:
//
// PROBLEM: We had 400+ React components. No systematic a11y tracking.
// When a11y issues were filed: fixed in isolation, no pattern recognition.
// When new features shipped: often untested with AT (assistive technology).
//
// THE SYSTEMATIC APPROACH (what we implemented as team lead):
//
// 1. AUTOMATED CI GATE (axe-core + jest-axe):
//
// // In every component test:
// import { render } from '@testing-library/react';
// import { axe, toHaveNoViolations } from 'jest-axe';
// expect.extend(toHaveNoViolations);
//
// it('should have no accessibility violations', async () => {
//   const { container } = render(<HuddleParticipantCard participant={mockP} />);
//   const results = await axe(container);
//   expect(results).toHaveNoViolations();
// });
//
// The axe check: runs in CI for EVERY component test.
// Any new component with an a11y violation: CI fails. PR cannot merge.
// "You cannot accidentally introduce an accessibility regression
//  and have it silently make it to production."
//
// 2. MANUAL TEST PROTOCOL (AT testing checklist):
// Before any Huddle feature ships, test with:
// □ macOS VoiceOver + Safari
// □ NVDA + Chrome (Windows) — most common screen reader combo
// □ Keyboard only (no mouse) — complete all user tasks
// □ 200% zoom (WCAG 1.4.4)
// □ Forced colours (Windows High Contrast)
// □ prefers-reduced-motion enabled
//
// This checklist: added to our PR template for Huddles features.
// Not optional — every developer on the Huddles team follows it.
//
// 3. WCAG ISSUE TRIAGE:
// Not all a11y issues are equal. Triage by:
// a) WCAG level: A failures > AA failures > AAA failures
// b) User impact: "Completely blocked" > "Severely impaired" > "Minor friction"
// c) User prevalence: Screen reader users vs keyboard-only vs low vision
//
// Example triage:
// CRITICAL: Mute button has no accessible name (A, completely blocks screen reader use)
// HIGH: Color-only indicator for speaking (A, blind users have no equivalent info)
// MEDIUM: Focus ring not visible on certain buttons (AA, keyboard users struggle)
// LOW: Speaking animation not reduced when prefers-reduced-motion set (AAA)
//
// 4. PR REVIEW AS A11Y TEAM LEAD:
// Every PR touching Huddles UI: I review for:
// □ Are interactive elements keyboard-accessible?
// □ Does dynamic content use aria-live?
// □ Do all images have alt text?
// □ Are colour choices contrast-compliant?
// □ Does focus management work after state changes?
// □ Are there new animations — do they respect prefers-reduced-motion?
//
// 5. THE OUTCOME:
// Before systematic approach: 47 open a11y issues (tracked in Jira).
// After 2 quarters of systematic work:
//   - Critical (A) issues: 0 (down from 12)
//   - High (AA) issues: 3 (down from 22)
//   - CI gate: prevents new critical issues from being introduced
// "We went from reactive fire-fighting to proactive prevention.
//  Accessibility went from 'we'll fix it later' to
//  'it cannot ship until it passes the checklist.'"`} />
          </div>
        </div>
      )}

      {/* ── LEADERSHIP ── */}
      {tab === "lead" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>ACCESSIBILITY TEAM LEAD + CONFERENCE SPEAKER</div>

            {/* Conference talks */}
            <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: S.textMuted, marginBottom: 8 }}>CONFERENCE PRESENTATIONS</div>
              {CONF_TOPICS.map((t, i) => (
                <div key={i} onClick={() => setConfTopic(confTopic === i ? null : i)} style={{ padding: "9px 10px", borderRadius: 8, marginBottom: 6, cursor: "pointer", background: confTopic === i ? `${S.purpleLight}15` : S.surface2, border: `1px solid ${confTopic === i ? S.purpleLight + "50" : S.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: S.textBright }}>{t.title}</div>
                    <span style={{ fontSize: 8, color: S.purpleLight, flexShrink: 0, marginLeft: 8 }}>{t.conf}</span>
                  </div>
                  {confTopic === i && <div style={{ fontSize: 8, color: S.textMuted, lineHeight: 1.5, marginTop: 4 }}>{t.detail}</div>}
                </div>
              ))}
            </div>

            {/* WCAG criteria */}
            <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: S.textMuted, marginBottom: 8 }}>WCAG CRITERIA — Huddles coverage</div>
              {WCAG_CRITERIA.map(w => (
                <div key={w.id} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: `1px solid ${S.border}20`, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, display: "flex", gap: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 8, fontFamily: S.mono, color: S.purpleLight }}>{w.id}</span>
                    <span style={{ fontSize: 7, background: w.level === "A" ? `${S.red}20` : w.level === "AA" ? `${S.yellow}20` : `${S.green}20`, color: w.level === "A" ? S.red : w.level === "AA" ? S.yellow : S.green, borderRadius: 3, padding: "1px 5px", fontWeight: 700 }}>{w.level}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: S.textBright }}>{w.name}</div>
                    <div style={{ fontSize: 7, color: S.textMuted, marginTop: 1 }}>{w.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeSnip color={S.purpleLight} label="A11y team lead at Slack — what the role actually means, conference impact" code={
`// ACCESSIBILITY TEAM LEAD — WHAT IT MEANS IN PRACTICE:
//
// Not: the person who fixes accessibility bugs.
// Yes: the person who ensures the TEAM has the knowledge, process,
//      and tools to ship accessible features without needing me to fix everything.
//
// RESPONSIBILITIES:
//
// 1. TECHNICAL STANDARDS:
//    Author and maintain the Slack Design System a11y guidelines.
//    Every component in the DS: a documented accessibility specification.
//    Huddle participant card: aria-label format, keyboard behavior, focus ring style.
//    "The spec exists so the next engineer can implement it correctly without me."
//
// 2. TEAM ENABLEMENT (the multiplier effect):
//    • Run a monthly "A11y Learning Hour" for the Huddles team
//    • Topics: "Testing with VoiceOver", "ARIA anti-patterns", "Focus management"
//    • PR review coaching: explain WHY an aria-label is needed, not just "add one"
//    • "In 6 months: the team went from 'what is aria-live?' to proactively
//       adding live regions for new dynamic content without being asked."
//
// 3. STAKEHOLDER COMMUNICATION:
//    Translate WCAG criteria → business impact.
//    Not: "We're failing WCAG 2.1 criterion 1.4.1"
//    Yes: "7% of users are colour-blind. Our speaking indicator is colour-only.
//          Those users cannot tell who's speaking in a Huddle. That's a broken
//          core feature for 7% of our user base."
//    This framing: gets the priority bump. "We're failing a WCAG criterion" gets deprioritised.
//    "A broken core feature for 7% of users" gets fixed.
//
// 4. USER RESEARCH WITH DISABLED USERS:
//    Partnered with Slack's user research team on a11y-specific sessions.
//    Recruited participants: VoiceOver users, keyboard-only users, low-vision users.
//    Sessions: unmoderated task completion in Huddles.
//    Findings fed directly into the feature backlog.
//    "Seeing a blind user try to use Huddles for the first time:
//     the most powerful argument for accessibility work.
//     No WCAG guideline makes the case as clearly as a user struggling."
//
// CONFERENCE SPEAKING — WHY IT MATTERS:
//
// CSUN (California State University Northridge):
// The largest accessibility conference in the world.
// Audience: AT developers, screen reader users, disability advocates,
//           enterprise a11y teams from Google, Microsoft, Apple.
// My session: "Making Voice Calls Accessible: Huddles at Scale"
// Content: The specific technical challenges of making real-time audio events
//          accessible — aria-live timing, focus management during live calls,
//          reaction accessibility. Practical code examples, not theory.
//
// Axe-con:
// Deque's annual conference. Developer-focused.
// My session: "The Accessibility Debt Problem: How Slack Paid It Back"
// Content: The systematic approach — CI gates, triage methodology, PR review,
//          how to get non-a11y engineers to care. Business framing.
//
// WHY CONFERENCE SPEAKING HELPS SLACK:
// 1. Recruitment: "Slack engineers present at CSUN" — signals to a11y-focused
//    candidates that Slack is serious about accessibility.
// 2. Community: We receive feedback and techniques from other teams
//    who've solved similar problems (e.g. Google's Meets a11y team).
// 3. Accountability: presenting publicly commits Slack to the work we described.
//    "We shipped accessible reactions BEFORE the CSUN talk — not after.
//     We don't announce work we haven't done."
//
// THE NORTH STAR METRIC FOR A11Y WORK:
// "Does a blind user of VoiceOver have a complete Huddle experience?
//  Can they join, mute, see who's speaking, react, and leave,
//  using only keyboard and screen reader — with no sighted assistance?"
// When the answer is yes: we've succeeded.
// We track this via:
// 1. Quarterly AT user research sessions (qualitative)
// 2. axe-core CI gate (no new violations — quantitative)
// 3. VPAT (Voluntary Product Accessibility Template) — formal documentation
//    of Slack's compliance for enterprise customers with Section 508 requirements`} />
          </div>
        </div>
      )}
    </div>
  );
}

export default SlackHuddlesA11yDemo;
