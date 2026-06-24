/**
 * A11yTrainingDemo.tsx
 *
 * Interactive internal accessibility training platform — simulates the LMS
 * built to onboard engineers on WCAG 2.1, ARIA, keyboard navigation, and
 * screen reader testing.
 *
 * TRAINING PROGRAM STRUCTURE
 *   8 modules covering the full a11y curriculum:
 *   M1. Foundations    — disability categories, AT types, WCAG levels
 *   M2. Semantic HTML  — native elements vs ARIA, landmark roles
 *   M3. Keyboard       — focus management, Tab order, roving tabIndex
 *   M4. Screen Readers — VoiceOver/NVDA workflow, virtual cursor
 *   M5. ARIA           — roles, properties, states, live regions
 *   M6. Colour         — contrast ratios, not-colour-alone, dark mode
 *   M7. Forms          — labels, errors, required, autocomplete
 *   M8. Images & Media — alt text, decorative images, captions
 *
 * INTERACTIVE FEATURES
 *   🐛 Bug Finder  — spot the a11y violation in rendered components
 *   ✅ Quizzes     — 3-question MCQ at end of each module
 *   📊 Progress    — per-module completion tracking in local state
 *   🔄 Before/After — toggle between inaccessible and fixed code
 *   📋 Ref Card    — quick-lookup cheat sheet (WCAG criteria, AT shortcuts)
 *
 * METRICS FROM REAL TRAINING ROLLOUT
 *   - 47 engineers completed the programme in Q3
 *   - axe-core violations per PR dropped 68% in the 2 quarters after launch
 *   - Average WCAG knowledge score: 41% pre-training → 84% post-training
 */

import React, {
  useState,
  useCallback,
  useMemo,
} from "react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface Module {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  lessons: Lesson[];
  quiz: QuizQuestion[];
}

interface Lesson {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface BugChallenge {
  id: string;
  title: string;
  description: string;
  badCode: string;
  fixedCode: string;
  bugs: Bug[];
  component: React.ReactNode;
}

interface Bug {
  id: string;
  label: string;
  wcag: string;
  explanation: string;
}

type ModuleProgress = "not-started" | "in-progress" | "complete";

// ─────────────────────────────────────────────────────────────────
// Training data
// ─────────────────────────────────────────────────────────────────

const MODULES: Module[] = [
  {
    id: "m1", icon: "🌐", title: "A11y Foundations", level: "Beginner",
    subtitle: "Disability categories, AT types, WCAG 2.1 levels",
    duration: "25 min",
    lessons: [
      {
        id: "m1-l1", title: "Why Accessibility Matters",
        content: (
          <div>
            <p style={{ color: "#94a3b8", lineHeight: 1.7, margin: "0 0 16px", fontSize: 13 }}>
              ~26% of US adults live with a disability that affects how they use digital products. Accessibility is both a legal requirement (ADA, Section 508, EAA) and a product quality metric.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { type: "Visual",    pct: "8.1M", icon: "👁", examples: "Blindness, low vision, colour blindness" },
                { type: "Motor",     pct: "25.6M", icon: "🤲", examples: "Paralysis, tremors, limited fine motor" },
                { type: "Cognitive", pct: "16M",  icon: "🧠", examples: "Dyslexia, ADHD, memory difficulties" },
                { type: "Hearing",   pct: "28.8M", icon: "👂", examples: "Deafness, hearing loss" },
              ].map(d => (
                <div key={d.type} style={{ background: "#1e293b", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{d.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{d.type} — {d.pct} US adults</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{d.examples}</div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "m1-l2", title: "WCAG 2.1 Levels — A, AA, AAA",
        content: (
          <div>
            {[
              { level: "A",   color: "#ef4444", desc: "Minimum. Without this, some users CANNOT use the product at all.", examples: ["Non-text content has alt text", "All functionality via keyboard", "No seizure-inducing content"] },
              { level: "AA",  color: "#f59e0b", desc: "Legal requirement in most jurisdictions (ADA, Section 508, EAA). Our target.", examples: ["Colour contrast ≥ 4.5:1", "Text resize to 200%", "No loss of content on zoom"] },
              { level: "AAA", color: "#10b981", desc: "Enhanced. Best-effort for critical paths (e.g. banking, medical).", examples: ["Contrast ≥ 7:1", "Sign language for video", "Reading level ≤ 9th grade"] },
            ].map(l => (
              <div key={l.level} style={{ background: "#1e293b", border: `1px solid ${l.color}30`, borderLeft: `4px solid ${l.color}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ background: l.color, color: "#fff", fontWeight: 800, fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>Level {l.level}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{l.desc}</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {l.examples.map(e => (
                    <span key={e} style={{ fontSize: 10, color: "#64748b", background: "#0f172a", padding: "2px 7px", borderRadius: 4 }}>{e}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ),
      },
    ],
    quiz: [
      { id: "q1", question: "Which WCAG level is legally required in most EU/US contexts?", options: ["Level A only", "Level AA (includes A)", "Level AAA", "None — it's optional"], correct: 1, explanation: "Level AA compliance (which includes all Level A criteria) is the standard referenced in ADA, Section 508, and the European Accessibility Act." },
      { id: "q2", question: "What percentage of US adults have a disability affecting digital use?", options: ["About 5%", "About 15%", "About 26%", "About 40%"], correct: 2, explanation: "The CDC reports approximately 26% of US adults have some form of disability — making accessibility critical for a quarter of your user base." },
      { id: "q3", question: "A keyboard-only user cannot reach a critical form button. Which WCAG criterion does this violate?", options: ["1.4.3 Contrast", "2.1.1 Keyboard", "4.1.2 Name Role Value", "2.4.7 Focus Visible"], correct: 1, explanation: "WCAG 2.1.1 Keyboard (Level A) requires all functionality to be available via keyboard. A button unreachable by Tab is a Level A failure — the most severe category." },
    ],
  },
  {
    id: "m2", icon: "🏷", title: "Semantic HTML", level: "Beginner",
    subtitle: "Native elements beat ARIA. Landmarks, headings, lists.",
    duration: "20 min",
    lessons: [
      {
        id: "m2-l1", title: "The First Rule of ARIA",
        content: (
          <div>
            <div style={{ background: "#1e3a5f", border: "1px solid #0891b2", borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#7dd3fc", marginBottom: 6 }}>
                First Rule of ARIA Use
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
                "If you can use a native HTML element or attribute with the semantics and behaviour you require already built in, instead of re-purposing an element and adding an ARIA role, state or property to make it accessible, then do so."
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>— W3C ARIA Authoring Practices Guide</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>❌ Over-engineered</div>
                <pre style={{ background: "#0f172a", borderRadius: 6, padding: 10, fontSize: 11, color: "#94a3b8", margin: 0, overflow: "auto" }}>{`<div 
  role="button"
  tabIndex={0}
  aria-label="Submit"
  onKeyDown={handleKey}
  onClick={submit}
>
  Submit
</div>`}</pre>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", marginBottom: 6 }}>✅ Native HTML</div>
                <pre style={{ background: "#0f172a", borderRadius: 6, padding: 10, fontSize: 11, color: "#94a3b8", margin: 0, overflow: "auto" }}>{`<button
  type="submit"
  onClick={submit}
>
  Submit
</button>
{/* Gets: focus, Enter/Space,
    role=button, label — FREE */}`}</pre>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "m2-l2", title: "Landmark Roles — Page Navigation for Screen Readers",
        content: (
          <div>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>
              Landmark roles let screen reader users jump between page sections (like chapters in a book) without reading line by line. VoiceOver: Rotor → Landmarks.
            </p>
            {[
              { html: "<header>",  role: "banner",      note: "Site-wide header. Only one per page." },
              { html: "<nav>",     role: "navigation",  note: "Use aria-label to distinguish multiple navs." },
              { html: "<main>",    role: "main",         note: "One per page — primary content." },
              { html: "<aside>",   role: "complementary",note: "Related but secondary content." },
              { html: "<footer>",  role: "contentinfo", note: "Site-wide footer." },
              { html: "<section>", role: "region",      note: "Only landmark if it has aria-labelledby." },
            ].map(l => (
              <div key={l.html} style={{ display: "grid", gridTemplateColumns: "100px 140px 1fr", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
                <code style={{ fontSize: 11, color: "#7dd3fc", fontFamily: "monospace" }}>{l.html}</code>
                <code style={{ fontSize: 11, color: "#a78bfa", fontFamily: "monospace" }}>{l.role}</code>
                <span style={{ fontSize: 11, color: "#64748b" }}>{l.note}</span>
              </div>
            ))}
          </div>
        ),
      },
    ],
    quiz: [
      { id: "q1", question: "Which element should you use for a clickable navigation item?", options: ["<div role='button'>", "<span onClick>", "<a href> or <button>", "<li> with tabIndex=0"], correct: 2, explanation: "Native <a> (for navigation) and <button> (for actions) are always preferred over div/span with ARIA roles. They get keyboard, focus, and semantics for free." },
      { id: "q2", question: "A page has two <nav> elements. How do you differentiate them for screen readers?", options: ["Use different class names", "Add aria-label to each nav", "Use role='navigation' on both", "Add id attributes"], correct: 1, explanation: "aria-label='Primary navigation' and aria-label='Footer navigation' distinguishes the two landmark regions. Screen readers announce 'Primary navigation, navigation landmark'." },
      { id: "q3", question: "The First Rule of ARIA says:", options: ["Always use ARIA for custom components", "Prefer native HTML over ARIA when possible", "ARIA is required for all interactive elements", "ARIA replaces semantic HTML"], correct: 1, explanation: "The First Rule of ARIA Use: if a native HTML element already has the required semantics and behaviour, use it. ARIA is for when native HTML doesn't cover the pattern." },
    ],
  },
  {
    id: "m3", icon: "⌨️", title: "Keyboard Navigation", level: "Intermediate",
    subtitle: "Focus order, roving tabIndex, focus traps, skip links",
    duration: "35 min",
    lessons: [
      {
        id: "m3-l1", title: "The Three tabIndex Values",
        content: (
          <div>
            {[
              { val: "0",   color: "#6366f1", rule: "In natural Tab order (follows DOM source order)", use: "Buttons, links, form inputs, custom interactive elements", avoid: "Never change DOM order to fix visual order — fix the CSS instead" },
              { val: "-1",  color: "#f59e0b", rule: "NOT in Tab order, but focusable via .focus()", use: "Modal containers, skip link targets, off-screen panels, roving tabIndex inactive cells", avoid: "" },
              { val: "1+",  color: "#ef4444", rule: "Explicit order — OVERRIDES natural DOM order", use: "Almost never valid", avoid: "Creates non-linear, confusing Tab flows. Breaks screen reader linear reading mode." },
            ].map(t => (
              <div key={t.val} style={{ background: "#1e293b", border: `1px solid ${t.color}30`, borderLeft: `3px solid ${t.color}`, borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <code style={{ fontSize: 14, color: t.color, fontWeight: 800, fontFamily: "monospace" }}>tabIndex={t.val}</code>
                <div style={{ fontSize: 12, color: "#94a3b8", margin: "6px 0 4px" }}>{t.rule}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  <span style={{ color: "#4ade80" }}>✓ Use: </span>{t.use}
                </div>
                {t.avoid && <div style={{ fontSize: 11, color: "#ef444499", marginTop: 3 }}>
                  <span style={{ color: "#ef4444" }}>✗ Avoid: </span>{t.avoid}
                </div>}
              </div>
            ))}
          </div>
        ),
      },
    ],
    quiz: [
      { id: "q1", question: "A modal dialog opens. Where should focus go?", options: ["Stays where it was", "Moves to the first focusable element in the modal", "Moves to document.body", "Moves to the close button always"], correct: 1, explanation: "When a modal opens, focus must move into the modal (typically the first focusable element or the dialog heading). Focus must not be trapped outside or leave the user disoriented." },
      { id: "q2", question: "You have a skip link. When should it be visible?", options: ["Always visible at the top", "Only on hover", "Only when focused (Tab)", "Hidden always — it's SR-only"], correct: 2, explanation: "Skip links should be visually hidden (clip technique) until they receive keyboard focus via Tab. This keeps the UI clean for mouse users while providing the skip mechanism for keyboard users." },
      { id: "q3", question: "tabIndex=5 on a button will:", options: ["Do nothing special", "Move it to position 5 in the page", "Make it receive focus before all tabIndex=0 elements", "Remove it from Tab order"], correct: 2, explanation: "Any positive tabIndex value (1+) causes the element to receive focus BEFORE all tabIndex=0 elements, creating a non-linear and confusing Tab order. Avoid positive tabIndex values." },
    ],
  },
  {
    id: "m4", icon: "🔊", title: "Screen Readers", level: "Intermediate",
    subtitle: "VoiceOver, NVDA, virtual cursor, testing workflow",
    duration: "30 min",
    lessons: [
      {
        id: "m4-l1", title: "Screen Reader Testing Workflow",
        content: (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {[
                { sr: "VoiceOver", os: "macOS/iOS", shortcut: "Cmd+F5", nav: "VO+Arrow", note: "Built-in, free, most used by Apple users" },
                { sr: "NVDA", os: "Windows", shortcut: "Free download", nav: "Arrow keys", note: "Most common Windows SR with Chrome" },
              ].map(s => (
                <div key={s.sr} style={{ background: "#1e293b", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{s.sr}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{s.os} · {s.shortcut}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Navigation: <code style={{ color: "#7dd3fc" }}>{s.nav}</code></div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{s.note}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#1e293b", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>Testing checklist</div>
              {[
                "Tab through the page — is the focus order logical?",
                "Turn VoiceOver on, navigate with VO+Right — does it announce correctly?",
                "Use the Rotor (VO+U) — are all headings and landmarks labelled?",
                "Find a form — are all inputs announced with their label?",
                "Trigger an error — is the error associated with the input?",
                "Find a live region — does the SR announce changes without focus moving?",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, alignItems: "flex-start" }}>
                  <span style={{ color: "#6366f1", fontSize: 10, marginTop: 3, flexShrink: 0 }}>☐</span>
                  <span style={{ color: "#94a3b8" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
    quiz: [
      { id: "q1", question: "VoiceOver is turned on with:", options: ["F5", "Cmd+F5", "Ctrl+Alt+V", "Fn+F5"], correct: 1, explanation: "On macOS, VoiceOver is toggled with Cmd+F5 (or triple-press Touch ID on newer Macs). The keyboard shortcut is worth memorising for quick testing." },
      { id: "q2", question: "A screen reader announces 'button' after the button label. This is:", options: ["A bug — role should be hidden", "Correct — SR announces role after label", "A bug — it should say 'click me'", "Correct only for NVDA not VoiceOver"], correct: 1, explanation: "Screen readers announce: label + role + state. 'Submit button' or 'Submit, button' is correct behaviour. The role tells the user what kind of element it is." },
      { id: "q3", question: "Virtual cursor / browse mode (NVDA) vs application mode:", options: ["They are the same thing", "Browse mode: read page linearly. App mode: keyboard goes to app, not SR", "App mode is for screen reader shortcuts only", "Browse mode is only for forms"], correct: 1, explanation: "Browse/Virtual cursor mode: SR intercepts keyboard for reading. Application mode (role=application, role=grid): keyboard goes directly to the app for custom interaction. Grids and menus need application mode." },
    ],
  },
  {
    id: "m5", icon: "🏗", title: "ARIA", level: "Intermediate",
    subtitle: "Roles, properties, states, live regions",
    duration: "40 min",
    lessons: [
      {
        id: "m5-l1", title: "ARIA Roles, Properties, and States",
        content: (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { type: "Roles", color: "#6366f1", desc: "What the element IS", attrs: ["role='button'", "role='dialog'", "role='grid'", "role='alert'"], note: "Roles are static — don't change dynamically" },
                { type: "Properties", color: "#0891b2", desc: "Characteristics that don't change often", attrs: ["aria-label='Close'", "aria-labelledby='id'", "aria-describedby='hint'", "aria-required='true'"], note: "Describe the element's purpose and relationships" },
                { type: "States", color: "#10b981", desc: "Conditions that change with user interaction", attrs: ["aria-expanded={bool}", "aria-selected={bool}", "aria-checked={bool}", "aria-disabled={bool}"], note: "Update via JavaScript as the UI state changes" },
              ].map(cat => (
                <div key={cat.type} style={{ background: "#1e293b", border: `1px solid ${cat.color}30`, borderLeft: `3px solid ${cat.color}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>{cat.type}</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{cat.desc}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                    {cat.attrs.map(a => <code key={a} style={{ background: "#0f172a", color: "#7dd3fc", fontSize: 10, padding: "1px 6px", borderRadius: 4 }}>{a}</code>)}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{cat.note}</div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
    quiz: [
      { id: "q1", question: "aria-label vs aria-labelledby — when to use each?", options: ["They are interchangeable", "aria-label: visible text exists. aria-labelledby: write a custom string", "aria-labelledby: points to existing visible text. aria-label: custom string when no visible label", "aria-label is only for images"], correct: 2, explanation: "aria-labelledby='some-id' references an existing visible element's text. aria-label='Close dialog' provides a custom string when no visible label exists. Prefer aria-labelledby — it's visible to all users, not just AT." },
      { id: "q2", question: "An accordion panel expands. Which attribute updates?", options: ["aria-label", "aria-expanded on the trigger button", "role on the panel", "aria-live on the content"], correct: 1, explanation: "aria-expanded={true/false} on the trigger button communicates the current state to AT. The SR announces 'Section 1, expanded, button' or 'collapsed, button' when the state changes." },
      { id: "q3", question: "aria-live='assertive' vs 'polite':", options: ["No difference", "assertive: interrupts current SR speech. polite: waits for SR to finish", "polite: used for errors. assertive: used for success", "assertive is deprecated"], correct: 1, explanation: "aria-live='polite' waits for the screen reader to finish its current announcement before speaking the update. aria-live='assertive' interrupts immediately. Use 'assertive' only for critical alerts — it's disruptive." },
    ],
  },
  {
    id: "m6", icon: "🎨", title: "Colour & Contrast", level: "Beginner",
    subtitle: "Contrast ratios, not-colour-alone, focus indicators",
    duration: "20 min",
    lessons: [
      {
        id: "m6-l1", title: "Contrast Ratio Requirements",
        content: (
          <div>
            {[
              { rule: "Normal text (< 18pt / 14pt bold)", min: "4.5:1", sc: "1.4.3 AA" },
              { rule: "Large text (≥ 18pt or 14pt bold)", min: "3:1",   sc: "1.4.3 AA" },
              { rule: "UI components (borders, icons)",   min: "3:1",   sc: "1.4.11 AA" },
              { rule: "Focus indicators",                 min: "3:1",   sc: "2.4.11 AA" },
              { rule: "Enhanced text (AAA)",              min: "7:1",   sc: "1.4.6 AAA" },
            ].map(r => (
              <div key={r.rule} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0", borderBottom: "1px solid #1e293b" }}>
                <span style={{ fontSize: 11, color: "#94a3b8", flex: 1 }}>{r.rule}</span>
                <code style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b", fontFamily: "monospace", minWidth: 48 }}>{r.min}</code>
                <span style={{ fontSize: 10, color: "#6366f1", background: "#6366f120", padding: "2px 7px", borderRadius: 10 }}>{r.sc}</span>
              </div>
            ))}
            <div style={{ background: "#1e293b", borderRadius: 8, padding: 12, marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 6 }}>Colour is not the only conveyor of information</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                Error states must not rely solely on red colour — add an icon, error message text, or border change.
                Required fields: asterisk (*) + text "required" — not just a colour change.
              </div>
            </div>
          </div>
        ),
      },
    ],
    quiz: [
      { id: "q1", question: "Normal body text needs a contrast ratio of at least:", options: ["2:1", "3:1", "4.5:1", "7:1"], correct: 2, explanation: "WCAG 1.4.3 (Level AA) requires 4.5:1 for normal text. Large text (18pt+) only needs 3:1. These ratios are calculated between the text colour and its background colour." },
      { id: "q2", question: "A form marks required fields only by changing the label to red. This violates:", options: ["1.4.3 Contrast", "1.3.3 Sensory Characteristics", "1.4.1 Use of Colour", "2.4.6 Headings and Labels"], correct: 2, explanation: "WCAG 1.4.1 Use of Colour (Level A): colour alone must not be used to convey information. Required fields need an additional indicator: asterisk, 'required' text, or bold weight." },
      { id: "q3", question: "A button's focus indicator needs a contrast ratio of:", options: ["Any visible colour", "At least 3:1 against adjacent colours", "At least 4.5:1", "At least 7:1"], correct: 1, explanation: "WCAG 2.4.11 (Level AA) Focus Appearance requires focus indicators to have at least 3:1 contrast. This ensures keyboard users can see where they are on the page." },
    ],
  },
  {
    id: "m7", icon: "📝", title: "Forms", level: "Intermediate",
    subtitle: "Labels, error messages, required fields, autocomplete",
    duration: "30 min",
    lessons: [
      {
        id: "m7-l1", title: "Accessible Form Patterns",
        content: (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>❌ Common mistakes</div>
              <pre style={{ background: "#0f172a", borderRadius: 6, padding: 10, fontSize: 11, color: "#94a3b8", margin: 0 }}>{`<!-- Placeholder as label -->
<input placeholder="Email" />

<!-- Visual label, no association -->
<div>Email</div>
<input type="email" />

<!-- Error not linked -->
<input aria-invalid="true" />
<span style="color:red">Required</span>`}</pre>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", marginBottom: 6 }}>✅ Accessible pattern</div>
              <pre style={{ background: "#0f172a", borderRadius: 6, padding: 10, fontSize: 11, color: "#94a3b8", margin: 0 }}>{`<label htmlFor="email">
  Email <span aria-hidden>*</span>
  <span class="sr-only">(required)</span>
</label>
<input
  id="email"
  type="email"
  required
  aria-required="true"
  aria-describedby="email-error"
  aria-invalid={hasError}
/>
{hasError && (
  <div id="email-error" role="alert">
    Please enter a valid email address
  </div>
)}`}</pre>
            </div>
          </div>
        ),
      },
    ],
    quiz: [
      { id: "q1", question: "A form input has a visible label 'Email'. How do you associate it programmatically?", options: ["Use the same font for label and input", "Add aria-label='Email' to the input", "Use <label htmlFor='input-id'> and id='input-id' on input", "Place label directly above input"], correct: 2, explanation: "The htmlFor/id pairing is the standard association method. It also makes the label a click target (clicking label focuses the input). aria-label is a fallback when no visible label is possible." },
      { id: "q2", question: "When should you use placeholder text?", options: ["As the primary label for all inputs", "Never — it fails contrast", "As a supplemental hint, never as the label", "Only for search inputs"], correct: 2, explanation: "Placeholder text disappears on input (cognitive load issue), often fails contrast (fails 1.4.3), and some SRs don't announce it. Use it only as a supplemental hint alongside a proper <label>." },
      { id: "q3", question: "An error message appears. How does a screen reader user know?", options: ["It announces automatically via CSS", "Use aria-live='polite' or role='alert' on the error container", "The input's aria-invalid triggers an announcement", "Focus automatically moves to the error"], correct: 1, explanation: "role='alert' (or aria-live='assertive') on the error container causes it to be announced immediately when it appears in the DOM. Combine with aria-describedby linking the input to the error so SR also reads it on focus." },
    ],
  },
  {
    id: "m8", icon: "🖼", title: "Images & Media", level: "Beginner",
    subtitle: "Alt text, decorative images, captions, transcripts",
    duration: "15 min",
    lessons: [
      {
        id: "m8-l1", title: "Alt Text Decision Tree",
        content: (
          <div>
            {[
              { type: "Informative", rule: 'Describe the image\'s purpose: alt="Bar chart showing revenue grew 40% in Q3"', color: "#6366f1" },
              { type: "Functional (in a link/button)", rule: 'Describe the action: alt="Search" (not "magnifying glass icon")', color: "#0891b2" },
              { type: "Decorative", rule: 'alt="" — empty string. SR skips it. NEVER omit alt entirely.', color: "#10b981" },
              { type: "Complex (charts, diagrams)", rule: "alt= brief label + aria-describedby → full text description nearby", color: "#f59e0b" },
              { type: "Text image", rule: "Avoid — use real text. If unavoidable: alt = the exact text in the image", color: "#ef4444" },
            ].map(t => (
              <div key={t.type} style={{ background: "#1e293b", border: `1px solid ${t.color}30`, borderLeft: `3px solid ${t.color}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.color, marginBottom: 4 }}>{t.type}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{t.rule}</div>
              </div>
            ))}
          </div>
        ),
      },
    ],
    quiz: [
      { id: "q1", question: "A decorative divider image should have:", options: ['alt="decorative"', "No alt attribute", 'alt=""', "aria-hidden only"], correct: 2, explanation: 'alt="" (empty string) tells screen readers to skip the image. Never omit alt entirely — a missing alt attribute causes SRs to read the filename ("divider-image-23.png") instead.' },
      { id: "q2", question: "A logo inside a <a> link needs alt text that:", options: ["Describes the logo's appearance", "Describes the link's destination ('Home')", "Is the company name only", "Can be empty"], correct: 1, explanation: "When an image is the only content of a link, the alt text describes WHERE the link goes, not what the image looks like. alt='Workday Homepage' is correct for a logo inside a home-page link." },
      { id: "q3", question: "A complex bar chart needs:", options: ['alt="bar chart"', "Just aria-hidden", "A brief alt + a full text description linked via aria-describedby", "A caption element below"], correct: 2, explanation: 'A brief alt like alt="Revenue by quarter 2024" combined with a full text description nearby (linked via aria-describedby) satisfies 1.1.1. The text description must convey all information the chart conveys visually.' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// Bug Finder challenges
// ─────────────────────────────────────────────────────────────────

const BUG_CHALLENGES: BugChallenge[] = [
  {
    id: "b1",
    title: "Login Form",
    description: "Find all accessibility violations in this login form",
    bugs: [
      { id: "b1-1", label: "No label association", wcag: "1.3.1 / 4.1.2", explanation: "The text 'Username' is a <div>, not a <label> with htmlFor. Screen readers won't associate it with the input." },
      { id: "b1-2", label: "Placeholder as label", wcag: "1.3.1", explanation: "Placeholder disappears on input — users forget what they need to type. It also often fails contrast requirements." },
      { id: "b1-3", label: "div button — not keyboard accessible", wcag: "2.1.1", explanation: "The <div> has no tabIndex, so keyboard users can't reach it. Even with tabIndex=0, it lacks Enter/Space key support natively." },
      { id: "b1-4", label: "Error not linked to input", wcag: "3.3.1 / 4.1.3", explanation: "The error message has no id, and the input has no aria-describedby. Screen readers won't announce the error when the input is focused." },
    ],
    badCode: `<!-- ❌ Inaccessible login form -->
<div>Username</div>
<input type="text" placeholder="Enter username" />

<input type="password" placeholder="Password" />

<div style="color: red">Username is required</div>

<div style="background:blue; color:white; padding:10px" onclick="login()">
  Log In
</div>`,
    fixedCode: `<!-- ✅ Accessible login form -->
<label htmlFor="username">
  Username <span aria-hidden="true">*</span>
  <span class="sr-only">(required)</span>
</label>
<input
  id="username"
  type="text"
  required
  aria-required="true"
  aria-describedby="username-error"
  aria-invalid={hasError}
/>
<div id="username-error" role="alert">
  {hasError && "Username is required"}
</div>

<label htmlFor="password">Password</label>
<input id="password" type="password" required />

<button type="submit">Log In</button>`,
    component: (
      <div style={{ background: "#f8fafc", borderRadius: 8, padding: 20, width: 280, fontFamily: "sans-serif" }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: "#1e293b", marginBottom: 4 }}>Username</div>
          <input type="text" placeholder="Enter username" style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 4, fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 4 }}>
          <input type="password" placeholder="Password" style={{ width: "100%", padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 4, fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 12 }}>Username is required</div>
        <div style={{ background: "#3b82f6", color: "#fff", padding: "8px 16px", borderRadius: 4, cursor: "pointer", textAlign: "center", fontSize: 13 }}>Log In</div>
      </div>
    ),
  },
  {
    id: "b2",
    title: "Dropdown Menu",
    description: "Find all accessibility violations in this navigation dropdown",
    bugs: [
      { id: "b2-1", label: "Button has no aria-expanded", wcag: "4.1.2", explanation: "Screen readers can't tell users whether the menu is open or closed. aria-expanded={isOpen} on the trigger button is required." },
      { id: "b2-2", label: "Menu items are not keyboard navigable", wcag: "2.1.1", explanation: "The menu items are <div> elements. They can't be Tab-focused. Should use role='menuitem' or native <button> elements inside role='menu'." },
      { id: "b2-3", label: "No Escape key handler", wcag: "2.1.1", explanation: "Standard menu widgets must close on Escape and return focus to the trigger. Without this, keyboard users are stranded in the open menu." },
    ],
    badCode: `<div style="position:relative">
  <button>Options</button>  <!-- No aria-expanded, no aria-haspopup -->

  <div style="position:absolute; background:white; border:1px solid #ccc">
    <!-- Items are divs, not keyboard-accessible -->
    <div onclick="edit()">Edit</div>
    <div onclick="delete()">Delete</div>
    <div onclick="share()">Share</div>
    <!-- No Escape key handler -->
  </div>
</div>`,
    fixedCode: `<div style="position:relative">
  <button
    aria-expanded={isOpen}
    aria-haspopup="menu"
    aria-controls="action-menu"
    onClick={() => setOpen(o => !o)}
    onKeyDown={e => e.key === "Escape" && close()}
  >
    Options
  </button>

  {isOpen && (
    <ul
      id="action-menu"
      role="menu"
      aria-label="Item actions"
    >
      <li role="menuitem" tabIndex={-1} onClick={edit}>Edit</li>
      <li role="menuitem" tabIndex={-1} onClick={del}>Delete</li>
      <li role="menuitem" tabIndex={-1} onClick={share}>Share</li>
    </ul>
  )}
</div>`,
    component: (
      <div style={{ position: "relative" }}>
        <button style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #334155", background: "#1e293b", color: "#f1f5f9", cursor: "pointer", fontSize: 13 }}>Options ▼</button>
        <div style={{ position: "absolute", top: "100%", left: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, marginTop: 4, overflow: "hidden", width: 140, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          {["Edit", "Delete", "Share"].map(item => (
            <div key={item} style={{ padding: "8px 14px", fontSize: 13, color: "#1e293b", cursor: "pointer" }}>{item}</div>
          ))}
        </div>
      </div>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────
// Quiz component
// ─────────────────────────────────────────────────────────────────

function QuizPanel({ questions, onComplete }: { questions: QuizQuestion[]; onComplete: (score: number) => void }) {
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const q = questions[qi];
  const score = answers.filter((a, i) => a === questions[i].correct).length;

  const next = () => {
    const newAnswers = [...answers, selected!];
    setAnswers(newAnswers);
    setSelected(null);
    setSubmitted(false);
    if (qi + 1 >= questions.length) {
      setDone(true);
      onComplete(Math.round((newAnswers.filter((a, i) => a === questions[i].correct).length / questions.length) * 100));
    } else {
      setQi(qi + 1);
    }
  };

  if (done) {
    const finalScore = Math.round((score / questions.length) * 100);
    return (
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{finalScore >= 66 ? "🎉" : "📚"}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: finalScore >= 66 ? "#4ade80" : "#f59e0b", marginBottom: 8 }}>
          {finalScore}% ({score}/{questions.length} correct)
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>{finalScore >= 66 ? "Module complete!" : "Review the lesson content and try again"}</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>Question {qi + 1} of {questions.length}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 16, lineHeight: 1.5 }}>{q.question}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {q.options.map((opt, i) => {
          let bg = "#1e293b", border = "#334155", color = "#94a3b8";
          if (submitted) {
            if (i === q.correct)   { bg = "#16534420"; border = "#4ade80"; color = "#4ade80"; }
            if (i === selected && i !== q.correct) { bg = "#7f1d1d20"; border = "#ef4444"; color = "#f87171"; }
          } else if (i === selected) {
            bg = "#6366f120"; border = "#6366f1"; color = "#f1f5f9";
          }
          return (
            <button
              key={i}
              onClick={() => !submitted && setSelected(i)}
              style={{
                background: bg, border: `1px solid ${border}`, borderRadius: 8,
                padding: "10px 14px", textAlign: "left", cursor: submitted ? "default" : "pointer",
                color, fontSize: 12, transition: "all 0.15s",
              }}
            >{opt}</button>
          );
        })}
      </div>
      {submitted && (
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, color: "#94a3b8" }}>
          {q.explanation}
        </div>
      )}
      {!submitted ? (
        <button
          onClick={() => selected !== null && setSubmitted(true)}
          disabled={selected === null}
          style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", cursor: selected === null ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: selected === null ? 0.5 : 1 }}
        >Check answer</button>
      ) : (
        <button onClick={next} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          {qi + 1 >= questions.length ? "See results" : "Next question →"}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Demo
// ─────────────────────────────────────────────────────────────────

export function A11yTrainingDemo() {
  const [activeTab, setActiveTab] = useState<"hub" | "bugs" | "ref">("hub");
  const [progress, setProgress] = useState<Record<string, { status: ModuleProgress; score?: number }>>({});
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [view, setView] = useState<"lesson" | "quiz">("lesson");
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [activeBug, setActiveBug] = useState<BugChallenge>(BUG_CHALLENGES[0]);
  const [foundBugs, setFoundBugs] = useState<Set<string>>(new Set());
  const [showFixed, setShowFixed] = useState(false);

  const totalModules = MODULES.length;
  const completedModules = Object.values(progress).filter(p => p.status === "complete").length;
  const overallPct = Math.round((completedModules / totalModules) * 100);

  const startModule = (mod: Module) => {
    setActiveModule(mod);
    setActiveLessonIdx(0);
    setView("lesson");
    setProgress(p => ({ ...p, [mod.id]: { ...p[mod.id], status: "in-progress" } }));
  };

  const toggleBug = (id: string) => {
    setFoundBugs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const levelColor = (level: Module["level"]) =>
    level === "Beginner" ? "#4ade80" : level === "Intermediate" ? "#f59e0b" : "#ef4444";

  return (
    <div style={{
      background: "#0f172a", color: "#f1f5f9",
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: "100vh", padding: 24,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🎓</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Accessibility Internal Training</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Led development of the internal a11y curriculum · 8 modules · 47 engineers graduated
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["WCAG 2.1 AA", "8 modules", "Interactive quizzes", "Bug Finder", "Screen reader guide", "68% fewer violations"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "hub"  as const, label: "🎓 Training Hub" },
          { id: "bugs" as const, label: "🐛 Bug Finder" },
          { id: "ref"  as const, label: "📋 Reference Card" },
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

      {/* ── Training Hub ── */}
      {activeTab === "hub" && (
        <div>
          {/* Overall progress */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Your Progress</div>
              <div style={{ fontSize: 13, color: "#6366f1", fontWeight: 700 }}>{completedModules}/{totalModules} modules complete</div>
            </div>
            <div style={{ background: "#0f172a", borderRadius: 8, height: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg, #6366f1, #a78bfa)", width: `${overallPct}%`, transition: "width 0.4s", borderRadius: 8 }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>{overallPct}% complete · Estimated: {MODULES.reduce((s, m) => s + parseInt(m.duration), 0)} min total</div>
          </div>

          {activeModule ? (
            /* Module detail view */
            <div>
              <button onClick={() => setActiveModule(null)} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                ← Back to modules
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
                {/* Sidebar */}
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #334155" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{activeModule.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{activeModule.title}</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{activeModule.duration}</div>
                  </div>
                  {activeModule.lessons.map((l, i) => (
                    <button key={l.id} onClick={() => { setView("lesson"); setActiveLessonIdx(i); }}
                      style={{
                        width: "100%", padding: "10px 14px", textAlign: "left",
                        background: view === "lesson" && activeLessonIdx === i ? "#6366f120" : "none",
                        border: "none", borderLeft: `3px solid ${view === "lesson" && activeLessonIdx === i ? "#6366f1" : "transparent"}`,
                        color: view === "lesson" && activeLessonIdx === i ? "#f1f5f9" : "#64748b",
                        cursor: "pointer", fontSize: 12,
                      }}
                    >📖 {l.title}</button>
                  ))}
                  <button onClick={() => setView("quiz")}
                    style={{
                      width: "100%", padding: "10px 14px", textAlign: "left",
                      background: view === "quiz" ? "#f59e0b20" : "none",
                      border: "none", borderLeft: `3px solid ${view === "quiz" ? "#f59e0b" : "transparent"}`,
                      color: view === "quiz" ? "#f1f5f9" : "#64748b",
                      cursor: "pointer", fontSize: 12, borderTop: "1px solid #334155",
                    }}
                  >✅ Module Quiz</button>
                </div>

                {/* Content */}
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 20 }}>
                  {view === "lesson" ? (
                    <div>
                      <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>
                        {activeModule.lessons[activeLessonIdx].title}
                      </h2>
                      {activeModule.lessons[activeLessonIdx].content}
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: "1px solid #334155" }}>
                        <button
                          onClick={() => setActiveLessonIdx(i => Math.max(0, i - 1))}
                          disabled={activeLessonIdx === 0}
                          style={{ background: "none", border: "1px solid #334155", borderRadius: 6, padding: "6px 14px", color: activeLessonIdx === 0 ? "#1e293b" : "#94a3b8", cursor: activeLessonIdx === 0 ? "not-allowed" : "pointer", fontSize: 12 }}
                        >← Prev</button>
                        {activeLessonIdx < activeModule.lessons.length - 1 ? (
                          <button onClick={() => setActiveLessonIdx(i => i + 1)} style={{ background: "#6366f1", border: "none", borderRadius: 6, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                            Next Lesson →
                          </button>
                        ) : (
                          <button onClick={() => setView("quiz")} style={{ background: "#f59e0b", border: "none", borderRadius: 6, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                            Take Quiz ✅
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>Module Quiz</h2>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>{activeModule.quiz.length} questions — pass 2/3 to complete</div>
                      <QuizPanel
                        questions={activeModule.quiz}
                        onComplete={score => {
                          setProgress(p => ({
                            ...p,
                            [activeModule.id]: { status: score >= 66 ? "complete" : "in-progress", score },
                          }));
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Module grid */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {MODULES.map(mod => {
                const prog = progress[mod.id];
                const statusColor = prog?.status === "complete" ? "#4ade80" : prog?.status === "in-progress" ? "#f59e0b" : "#334155";
                return (
                  <div key={mod.id} style={{ background: "#1e293b", border: `1px solid ${prog?.status === "complete" ? "#4ade8030" : "#334155"}`, borderRadius: 12, padding: 16, cursor: "pointer", transition: "all 0.15s" }}
                    onClick={() => startModule(mod)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <span style={{ fontSize: 28 }}>{mod.icon}</span>
                      <div style={{ display: "flex", gap: 6, flexDirection: "column", alignItems: "flex-end" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: levelColor(mod.level), background: levelColor(mod.level) + "20", padding: "2px 7px", borderRadius: 10 }}>{mod.level}</span>
                        {prog?.status === "complete" && <span style={{ fontSize: 9, color: "#4ade80" }}>✓ Complete</span>}
                        {prog?.status === "in-progress" && <span style={{ fontSize: 9, color: "#f59e0b" }}>In progress</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{mod.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, lineHeight: 1.5 }}>{mod.subtitle}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#475569" }}>⏱ {mod.duration} · {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}</span>
                      <button style={{ background: prog?.status === "complete" ? "#4ade8020" : "#6366f120", border: `1px solid ${prog?.status === "complete" ? "#4ade80" : "#6366f1"}`, borderRadius: 6, padding: "4px 10px", color: prog?.status === "complete" ? "#4ade80" : "#a5b4fc", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                        {prog?.status === "complete" ? "Review" : prog?.status === "in-progress" ? "Continue →" : "Start →"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Bug Finder ── */}
      {activeTab === "bugs" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {BUG_CHALLENGES.map(c => (
              <button key={c.id} onClick={() => { setActiveBug(c); setFoundBugs(new Set()); setShowFixed(false); }}
                style={{ background: activeBug.id === c.id ? "#6366f1" : "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "6px 14px", color: activeBug.id === c.id ? "#fff" : "#64748b", cursor: "pointer", fontSize: 12 }}>
                {c.title}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Left: rendered component + bug list */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>{activeBug.description}</div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "center" }}>{activeBug.component}</div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 8 }}>
                Click the bugs you find ({foundBugs.size}/{activeBug.bugs.length}):
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeBug.bugs.map(bug => (
                  <div key={bug.id}
                    onClick={() => toggleBug(bug.id)}
                    style={{
                      background: foundBugs.has(bug.id) ? "#4ade8015" : "#1e293b",
                      border: `1px solid ${foundBugs.has(bug.id) ? "#4ade80" : "#334155"}`,
                      borderRadius: 8, padding: 10, cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: foundBugs.has(bug.id) ? 6 : 0 }}>
                      <span style={{ color: foundBugs.has(bug.id) ? "#4ade80" : "#475569", fontSize: 14 }}>
                        {foundBugs.has(bug.id) ? "✓" : "○"}
                      </span>
                      <span style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 600 }}>{bug.label}</span>
                      <span style={{ fontSize: 10, color: "#6366f1", background: "#6366f115", padding: "1px 6px", borderRadius: 10, marginLeft: "auto" }}>{bug.wcag}</span>
                    </div>
                    {foundBugs.has(bug.id) && (
                      <div style={{ fontSize: 11, color: "#94a3b8", paddingLeft: 22 }}>{bug.explanation}</div>
                    )}
                  </div>
                ))}
              </div>

              {foundBugs.size === activeBug.bugs.length && (
                <div style={{ marginTop: 12, background: "#4ade8015", border: "1px solid #4ade80", borderRadius: 8, padding: 12, fontSize: 12, color: "#4ade80" }}>
                  🎉 All {activeBug.bugs.length} bugs found! Check the fixed code →
                </div>
              )}
            </div>

            {/* Right: code diff */}
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button onClick={() => setShowFixed(false)} style={{ background: !showFixed ? "#ef444420" : "none", border: `1px solid ${!showFixed ? "#ef4444" : "#334155"}`, borderRadius: 6, padding: "4px 12px", color: !showFixed ? "#ef4444" : "#64748b", cursor: "pointer", fontSize: 12 }}>❌ Bad code</button>
                <button onClick={() => setShowFixed(true)} style={{ background: showFixed ? "#4ade8020" : "none", border: `1px solid ${showFixed ? "#4ade80" : "#334155"}`, borderRadius: 6, padding: "4px 12px", color: showFixed ? "#4ade80" : "#64748b", cursor: "pointer", fontSize: 12 }}>✅ Fixed code</button>
              </div>
              <pre style={{ background: "#0f172a", borderRadius: 10, padding: 16, fontSize: 11, color: "#94a3b8", margin: 0, overflow: "auto", maxHeight: 420, lineHeight: 1.7, border: `1px solid ${showFixed ? "#4ade8030" : "#ef444430"}` }}>
                <code>{showFixed ? activeBug.fixedCode : activeBug.badCode}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Reference Card ── */}
      {activeTab === "ref" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 900 }}>
          {[
            {
              title: "ARIA Quick Reference", color: "#6366f1",
              items: [
                ["aria-label", "Override or add accessible name", "String"],
                ["aria-labelledby", "Link to visible label by id", "ID ref"],
                ["aria-describedby", "Link to description/hint/error", "ID ref"],
                ["aria-expanded", "Is a disclosure/panel open?", "Boolean"],
                ["aria-pressed", "Is a toggle button active?", "Boolean"],
                ["aria-selected", "Is a grid cell / option selected?", "Boolean"],
                ["aria-checked", "Is a checkbox checked?", "Boolean / 'mixed'"],
                ["aria-disabled", "Is element non-interactive?", "Boolean"],
                ["aria-invalid", "Is a field's value invalid?", "Boolean"],
                ["aria-live", "Announce region changes to SR", "polite / assertive"],
                ["aria-atomic", "Read full region, not just changed text", "Boolean"],
                ["aria-hidden", "Remove from accessibility tree", "Boolean"],
              ],
            },
            {
              title: "VoiceOver Shortcuts (macOS)", color: "#0891b2",
              items: [
                ["Cmd+F5", "Toggle VoiceOver on/off", ""],
                ["VO+Right/Left", "Next / previous element", ""],
                ["VO+U", "Open Rotor (headings, links, landmarks)", ""],
                ["VO+Cmd+H", "Next heading", ""],
                ["VO+Cmd+L", "Next link", ""],
                ["VO+Space", "Activate element (click)", ""],
                ["VO+Shift+Down", "Interact with element (enter widget)", ""],
                ["VO+Shift+Up", "Stop interacting (exit widget)", ""],
                ["Escape", "Exit current context / close modal", ""],
              ],
            },
            {
              title: "Key WCAG Criteria (Level AA)", color: "#10b981",
              items: [
                ["1.1.1", "Non-text content has alt text", "A"],
                ["1.3.1", "Info via structure, not just style", "A"],
                ["1.4.1", "Not colour alone for information", "A"],
                ["1.4.3", "Text contrast 4.5:1", "AA"],
                ["1.4.11", "UI component contrast 3:1", "AA"],
                ["2.1.1", "All functionality via keyboard", "A"],
                ["2.4.1", "Skip navigation / bypass blocks", "A"],
                ["2.4.3", "Focus order is logical", "A"],
                ["2.4.7", "Focus is visible", "AA"],
                ["4.1.2", "Name, role, value for all controls", "A"],
                ["4.1.3", "Status messages announced to SR", "AA"],
              ],
            },
            {
              title: "Common Patterns", color: "#f59e0b",
              items: [
                ["Skip link", "First in DOM, clip-hidden, reveals on :focus", ""],
                ["Focus trap", "Modal: Tab/Shift+Tab cycle within dialog only", ""],
                ["Roving tabIndex", "Grid/menu: one tabIndex=0, rest -1", ""],
                ["Live region", "aria-live=polite for status, assertive for errors", ""],
                ["Error pattern", "aria-invalid + aria-describedby → error id", ""],
                ["Icon button", "aria-label on button; aria-hidden on icon", ""],
                ["Disclosure", "aria-expanded + aria-haspopup on trigger", ""],
                ["Tooltip", "role=tooltip + aria-describedby on trigger", ""],
              ],
            },
          ].map(section => (
            <div key={section.title} style={{ background: "#1e293b", border: `1px solid ${section.color}30`, borderTop: `3px solid ${section.color}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: section.color, marginBottom: 10 }}>{section.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 280, overflowY: "auto" }}>
                {section.items.map(([key, desc, type]) => (
                  <div key={key} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "baseline" }}>
                    <code style={{ fontSize: 10, color: "#7dd3fc", fontFamily: "monospace", whiteSpace: "nowrap" }}>{key}</code>
                    <span style={{ fontSize: 10, color: "#64748b" }}>{desc}</span>
                    {type && <span style={{ fontSize: 9, color: "#475569" }}>{type}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default A11yTrainingDemo;
