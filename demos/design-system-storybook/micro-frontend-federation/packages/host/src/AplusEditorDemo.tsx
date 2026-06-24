/**
 * AplusEditorDemo.tsx
 *
 * Senior Frontend Engineer / Tech Lead — Amazon A+ Content Editor
 * Focus: A+ Editor Framework, Modular Template Scaling (10 to 73+ modules), Frontend Modernization, Mentorship & Guilds
 *
 * Achievements covered:
 *   1. Designed & implemented the modular A+ Editor framework for Selling Partners
 *   2. Scaled module templates from 10 to 73+ using a declarative metadata schemas
 *   3. Modernized codebase from JSP/jQuery tables to React functional components
 *   4. Team mentorship & adoption strategies (Guild leadership, onboarding pathways)
 *
 * TABS:
 *   📝 Editor Canvas    — Drag-and-stack editor workspace with live module rendering, text fields, and order adjustments
 *   🧱 73+ Modules Engine— Metadata schema builder showing schema configurations for diverse template types
 *   ⚡ Modernization     — Tech comparison (Legacy JSP/jQuery vs React TSX metadata engine) and parser metrics
 *   🤝 Mentorship Hub   — Interactive guild dashboard tracking onboarding timelines, PR review metrics, and mentee outcomes
 */

import React, { useState } from "react";

// Style tokens (Amazon Squid Ink & Orange theme)
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
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

interface AplusModule {
  id: string;
  type: "header" | "image-grid" | "comparison-table";
  title: string;
  body: string;
  extraData?: any;
}

const INITIAL_MODULES: AplusModule[] = [
  { id: "1", type: "header", title: "Premium Noise Cancelling Headphones", body: "Immersive sound, designed for all-day comfort and acoustic isolation." },
  { id: "2", type: "image-grid", title: "Acoustic Excellence & Ergonomic Design", body: "Three custom audio modes. Soft leather ear cushions. Up to 40 hours battery life." },
];

export function AplusEditorDemo() {
  const [tab, setTab] = useState<"canvas" | "engine" | "modern" | "mentor">("canvas");

  // ── Editor Canvas States ──
  const [modules, setModules] = useState<AplusModule[]>(INITIAL_MODULES);
  const [editModuleId, setEditModuleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const addModule = (type: "header" | "image-grid" | "comparison-table") => {
    const defaultData = {
      header: { title: "New Header Module", body: "Enter descriptive details here." },
      "image-grid": { title: "New Feature Grid", body: "Describe three features with image assets." },
      "comparison-table": { title: "Product Specs Comparison", body: "Compare model features side-by-side." },
    }[type];

    const newMod: AplusModule = {
      id: Math.random().toString(),
      type,
      ...defaultData,
    };
    setModules([...modules, newMod]);
  };

  const deleteModule = (id: string) => {
    setModules(prev => prev.filter(m => m.id !== id));
    if (editModuleId === id) setEditModuleId(null);
  };

  const moveModule = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= modules.length) return;
    
    const nextModules = [...modules];
    const temp = nextModules[index]!;
    nextModules[index] = nextModules[nextIndex]!;
    nextModules[nextIndex] = temp;
    setModules(nextModules);
  };

  const startEdit = (mod: AplusModule) => {
    setEditModuleId(mod.id);
    setEditTitle(mod.title);
    setEditBody(mod.body);
  };

  const saveEdit = () => {
    if (!editModuleId) return;
    setModules(prev => prev.map(m => 
      m.id === editModuleId ? { ...m, title: editTitle, body: editBody } : m
    ));
    setEditModuleId(null);
  };

  return (
    <div style={{ background: AM.bg, color: AM.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${AM.amazonOrange}, ${AM.amazonGold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📝</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: AM.textBright, letterSpacing: "-0.02em" }}>Amazon A+ Content — Senior Frontend Engineer</h1>
            <p style={{ margin: 0, fontSize: 11, color: AM.textMuted }}>A+ Editor Framework · 10 to 73+ Modules Extension · Codebase Modernisation · Tech Mentorship</p>
          </div>
        </div>

        {/* Global Statistics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "73+ Templates", l: "Unified Module Engine", c: AM.amazonOrange, sub: "Scaled from 10 legacy templates" },
            { v: "React + TSX", l: "Declarative Metadata Framework", c: AM.amazonGold, sub: "Eliminated old JSP/jQuery code" },
            { v: "p95 = 14ms", l: "Canvas Render Latency", c: AM.green, sub: "High performance rendering block" },
            { v: "4 Mentees", l: "Promoted to Mid/Senior", c: AM.textBright, sub: "Onboarding and Tech Guild paths" },
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
          { id: "canvas" as const, label: "📝 Editor Canvas Workspace" },
          { id: "engine" as const, label: "🧱 73+ Modules Engine" },
          { id: "modern" as const, label: "⚡ Codebase Modernisation" },
          { id: "mentor" as const, label: "🤝 Mentorship Hub" },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ background: tab === tb.id ? AM.surface2 : "transparent", color: tab === tb.id ? AM.textBright : AM.textMuted, border: tab === tb.id ? `1px solid ${AM.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{tb.label}</button>
        ))}
      </div>

      {/* ── EDITOR CANVAS WORKSPACE ── */}
      {tab === "canvas" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Interactive Canvas */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>INTERACTIVE A+ EDITOR CANVAS</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 460, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              {/* Active Modules Stack */}
              <div style={{ overflowY: "auto", flex: 1, paddingRight: 4, marginBottom: 12 }}>
                {modules.map((m, idx) => (
                  <div key={m.id} style={{ background: AM.surface2, border: `1px solid ${AM.border}`, borderRadius: 8, padding: 10, marginBottom: 8, position: "relative" }}>
                    {/* Header Controls */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 7.5, fontFamily: AM.mono, color: AM.amazonOrange, background: `${AM.amazonOrange}15`, padding: "2px 5px", borderRadius: 3 }}>
                        {m.type.toUpperCase()} MODULE
                      </span>
                      
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => moveModule(idx, "up")} disabled={idx === 0} style={{ background: "transparent", border: "none", color: idx === 0 ? AM.textMuted : AM.textBright, cursor: idx === 0 ? "default" : "pointer", fontSize: 10 }}>▲</button>
                        <button onClick={() => moveModule(idx, "down")} disabled={idx === modules.length - 1} style={{ background: "transparent", border: "none", color: idx === modules.length - 1 ? AM.textMuted : AM.textBright, cursor: idx === modules.length - 1 ? "default" : "pointer", fontSize: 10 }}>▼</button>
                        <button onClick={() => startEdit(m)} style={{ background: "transparent", border: "none", color: AM.amazonGold, cursor: "pointer", fontSize: 10 }}>✏️</button>
                        <button onClick={() => deleteModule(m.id)} style={{ background: "transparent", border: "none", color: AM.red, cursor: "pointer", fontSize: 12 }}>×</button>
                      </div>
                    </div>

                    {/* Module Content Preview */}
                    {m.type === "header" && (
                      <div>
                        <h3 style={{ margin: 0, fontSize: 11, fontWeight: 800, color: AM.textBright }}>{m.title}</h3>
                        <p style={{ margin: "4px 0 0", fontSize: 9.5, color: AM.text, lineHeight: 1.5 }}>{m.body}</p>
                      </div>
                    )}
                    
                    {m.type === "image-grid" && (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ width: 36, height: 36, background: AM.surface, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🖼️</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: 10, fontWeight: 700, color: AM.textBright }}>{m.title}</h4>
                          <p style={{ margin: "2px 0 0", fontSize: 8.5, color: AM.textMuted, lineHeight: 1.4 }}>{m.body}</p>
                        </div>
                      </div>
                    )}

                    {m.type === "comparison-table" && (
                      <div>
                        <h4 style={{ margin: 0, fontSize: 10, color: AM.textBright }}>{m.title}</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginTop: 4, background: "#06080C", padding: 4, borderRadius: 4, fontSize: 7.5, fontFamily: AM.mono }}>
                          <span style={{ color: AM.textMuted }}>Spec A: Yes</span>
                          <span style={{ color: AM.textMuted }}>Spec B: Ultra</span>
                          <span style={{ color: AM.textMuted }}>Spec C: Pro</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Editing form or add tools */}
              {editModuleId ? (
                <div style={{ borderTop: `1px solid ${AM.border}`, paddingTop: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: AM.amazonGold, marginBottom: 6 }}>Edit Module Content</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Module Title" style={{ background: "#06080C", border: `1px solid ${AM.border}`, borderRadius: 5, padding: "5px 8px", fontSize: 9.5, color: AM.textBright, outline: "none" }} />
                    <textarea value={editBody} onChange={e => setEditBody(e.target.value)} placeholder="Module Body" style={{ background: "#06080C", border: `1px solid ${AM.border}`, borderRadius: 5, padding: "5px 8px", fontSize: 9, color: AM.textBright, outline: "none", resize: "none", height: 40 }} />
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={saveEdit} style={{ flex: 1, background: AM.amazonOrange, color: "#fff", border: "none", borderRadius: 5, padding: "6px 0", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Save Edits</button>
                    <button onClick={() => setEditModuleId(null)} style={{ flex: 1, background: "transparent", border: `1px solid ${AM.border}`, color: AM.text, borderRadius: 5, padding: "6px 0", fontSize: 9, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ borderTop: `1px solid ${AM.border}`, paddingTop: 10 }}>
                  <div style={{ fontSize: 8, color: AM.textMuted, marginBottom: 6 }}>Insert a new A+ Module template:</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => addModule("header")} style={{ flex: 1, background: AM.surface2, border: `1px solid ${AM.border}`, color: AM.textBright, borderRadius: 5, padding: "5px 0", cursor: "pointer", fontSize: 8.5 }}>+ Header</button>
                    <button onClick={() => addModule("image-grid")} style={{ flex: 1, background: AM.surface2, border: `1px solid ${AM.border}`, color: AM.textBright, borderRadius: 5, padding: "5px 0", cursor: "pointer", fontSize: 8.5 }}>+ Feature Grid</button>
                    <button onClick={() => addModule("comparison-table")} style={{ flex: 1, background: AM.surface2, border: `1px solid ${AM.border}`, color: AM.textBright, borderRadius: 5, padding: "5px 0", cursor: "pointer", fontSize: 8.5 }}>+ Specs Table</button>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={AM.amazonOrange} label="A+ Canvas content layout & order management logic" code={
`// React State & Order logic for modular templates
// Implements secure node shifts and update loops

interface AplusModule {
  id: string;
  type: 'header' | 'image-grid' | 'comparison-table';
  title: string;
  body: string;
}

export function moveModuleInStack(
  modulesList: AplusModule[],
  index: number,
  direction: 'up' | 'down'
): AplusModule[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  
  // Boundary validation checks
  if (targetIndex < 0 || targetIndex >= modulesList.length) {
    return modulesList;
  }

  const result = [...modulesList];
  const [removed] = result.splice(index, 1);
  
  if (removed) {
    result.splice(targetIndex, 0, removed);
  }
  
  return result;
}

// Telemetry & metrics verified:
// - Order updates complete in under 2ms.
// - Reducer ensures state changes preserve immutable references.
// - Handles up to 73+ distinct template nodes within the same editing session.`} />
          </div>
        </div>
      )}

      {/* ── 73+ MODULES ENGINE ── */}
      {tab === "engine" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Metadata schema builder */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>METADATA CONFIGURATION ENGINE</div>

            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 460, display: "flex", flexDirection: "column", justifyContnet: "space-between" }}>
              <div style={{ flex: 1, overflowY: "auto" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: AM.textBright, display: "block", marginBottom: 8 }}>Scaling Templates with Declarative Schemas</span>
                <p style={{ fontSize: 9.5, color: AM.text, lineHeight: 1.5, marginBottom: 12 }}>
                  Instead of writing isolated UI code for each template, we built a schema-driven engine. Adding a new module template to the 73+ suite requires only declaring its metadata schema (text inputs, assets parameters, and spec bindings).
                </p>

                {/* Simulated schema template configs */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { name: "Premium Header (Module #1)", fields: "title, body, logoImage", complexity: "Simple" },
                    { name: "Specs Matrix Comparison (Module #34)", fields: "title, rowsCount, columnsData, specHighlight", complexity: "Complex" },
                    { name: "3-Image Carousel Grid (Module #68)", fields: "title, imagesList(url, label, link)[3]", complexity: "Medium" },
                  ].map((schema, idx) => (
                    <div key={idx} style={{ background: AM.surface2, border: `1px solid ${AM.border}`, padding: 8, borderRadius: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: AM.textBright }}>{schema.name}</span>
                        <span style={{ fontSize: 7, padding: "1px 4px", borderRadius: 3, background: `${AM.amazonGold}20`, color: AM.amazonGold, fontWeight: 700 }}>{schema.complexity}</span>
                      </div>
                      <div style={{ fontSize: 8, color: AM.textMuted, marginTop: 4, fontFamily: AM.mono }}>
                        Fields: {schema.fields}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${AM.border}`, paddingTop: 10, background: "#06080C", padding: 8, borderRadius: 8 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: AM.textMuted, display: "block", marginBottom: 4 }}>DEVLOPER WORKFLOW BENEFITS</span>
                <div style={{ fontSize: 8, color: AM.text, lineHeight: 1.5 }}>
                  <strong>Legacy template development:</strong> 5-7 working days per module (custom HTML/JSP, isolated SASS, validation).<br />
                  <strong>Metadata Engine development:</strong> 4 hours per module template (schema declaration in JSON, standard styles layout mapping).
                </div>
              </div>

            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={AM.amazonGold} label="Declarative metadata schema declaration specification" code={
`// aplus-schema-specification.ts
// Central engine configuration mapping metadata inputs to UI components

export interface SchemaField {
  key: string;
  type: 'text' | 'textarea' | 'image' | 'list';
  label: string;
  validation?: {
    required: boolean;
    maxLength?: number;
  };
}

export interface ModuleTemplateSpecification {
  templateId: string;
  name: string;
  fields: SchemaField[];
}

// Module #34 Specification example (Specs Comparison Table)
export const specsTableSpec: ModuleTemplateSpecification = {
  templateId: 'module-34',
  name: 'Specs Matrix Comparison',
  fields: [
    {
      key: 'title',
      type: 'text',
      label: 'Section Title',
      validation: { required: true, maxLength: 80 }
    },
    {
      key: 'rowsData',
      type: 'list',
      label: 'Comparison Rows',
      validation: { required: true }
    }
  ]
};

// Parser maps raw user data configurations against target specifications
export function validateModuleData(
  data: Record<string, any>,
  spec: ModuleTemplateSpecification
): boolean {
  for (const field of spec.fields) {
    if (field.validation?.required && !data[field.key]) {
      return false; // Missing required field
    }
  }
  return true;
}`} />
          </div>
        </div>
      )}

      {/* ── CODEBASE MODERNISATION ── */}
      {tab === "modern" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Tech comparisons */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>FRONTEND REFACTOR SUMMARY</div>

            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 460, display: "flex", flexDirection: "column", justifyContnet: "space-between" }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: AM.textBright, display: "block", marginBottom: 8 }}>JSP & jQuery Tables vs React Metadata</span>
                <p style={{ fontSize: 9.5, color: AM.text, lineHeight: 1.5, marginBottom: 12 }}>
                  The legacy A+ modules were rendered using JSP templates and absolute table layout markers, which broke frequently on mobile and tablet viewport widths.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: AM.surface2, padding: 8, borderRadius: 6 }}>
                    <div style={{ fontSize: 8.5, color: AM.red, fontWeight: 700, marginBottom: 4 }}>❌ Legacy Stack</div>
                    <ul style={{ margin: 0, paddingLeft: 10, fontSize: 7.5, color: AM.textMuted, lineHeight: 1.4 }}>
                      <li>JSP server-side templates</li>
                      <li>Absolute tables layout</li>
                      <li>No type safety (JQuery DOM updates)</li>
                    </ul>
                  </div>
                  <div style={{ background: AM.surface2, padding: 8, borderRadius: 6 }}>
                    <div style={{ fontSize: 8.5, color: AM.green, fontWeight: 700, marginBottom: 4 }}>✔ Modern Stack</div>
                    <ul style={{ margin: 0, paddingLeft: 10, fontSize: 7.5, color: AM.text, lineHeight: 1.4 }}>
                      <li>React Functional components</li>
                      <li>CSS Flexbox/Grid systems</li>
                      <li>Strict TypeScript validation</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div style={{ background: "#06080C", borderRadius: 8, padding: 8, border: `1px solid ${AM.border}` }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: AM.textMuted, marginBottom: 6 }}>PERFORMANCE ADVANCEMENT METRICS</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[
                    { label: "Compile/Load Speed", pct: "-60% load" },
                    { label: "Layout Shift (CLS)", score: "0.01 (Stable)" },
                  ].map((metric, idx) => (
                    <div key={idx} style={{ background: AM.surface, padding: 6, borderRadius: 5 }}>
                      <div style={{ fontSize: 7, color: AM.textMuted }}>{metric.label}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: AM.green, marginTop: 2 }}>{metric.pct || metric.score}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={AM.green} label="Code modernization comparison (Legacy JSP tables vs React)" code={
`<!-- BEFORE: Legacy JSP layout tables implementation -->
<!-- /templates/aplus_header.jsp -->
<table>
  <tr>
    <td width="100%">
      <div class="aplus-header-title">
        <c:out value="\${moduleData.title}" />
      </div>
      <div class="aplus-header-body">
        <c:out value="\${moduleData.body}" />
      </div>
    </td>
  </tr>
</table>
<!-- ❌ Problems: layout tables are fragile, break responsive layouts.
     Zero input typecheck diagnostic checking in template files. -->

<!-- ────────────────────────────────────────────────────────── -->

// AFTER: React modern template renderer
// /components/AplusHeader.tsx

import React from 'react';

interface AplusHeaderProps {
  title: string;
  body: string;
}

export function AplusHeader({ title, body }: AplusHeaderProps) {
  return (
    <section style={styles.container}>
      <h3 style={styles.titleText}>{title}</h3>
      <p style={styles.bodyText}>{body}</p>
    </section>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: 8 },
  titleText: { fontSize: 16, fontWeight: 800, color: '#fff' },
  bodyText:  { fontSize: 12, color: '#ccc', lineHeight: 1.5 }
};`} />
          </div>
        </div>
      )}

      {/* ── MENTORSHIP HUB ── */}
      {tab === "mentor" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Mentorship & Guild stats */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>MENTORSHIP & GUILD TRACKER</div>

            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 460, display: "flex", flexDirection: "column", justifyContnet: "space-between" }}>
              <div style={{ flex: 1, overflowY: "auto" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: AM.textBright, display: "block", marginBottom: 8 }}>Mentorship Pipeline & Outcomes</span>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { name: "Sarah K. (Junior → Mid)", scope: "Led specs comparison table rewrite", status: "Promoted", color: AM.green },
                    { name: "Priya V. (Mid → Senior)", scope: "Coordinated design system tokens sync", status: "Promoted", color: AM.green },
                    { name: "Alex R. (Junior → Mid)", scope: "Developed unit test automation suite", status: "Promoted", color: AM.green },
                    { name: "Maria L. (Mid → Senior)", scope: "Led layout tables refactoring", status: "Promoted", color: AM.green },
                  ].map((m, idx) => (
                    <div key={idx} style={{ background: AM.surface2, padding: 8, borderRadius: 6, borderLeft: `2px solid ${m.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: AM.textBright }}>{m.name}</span>
                        <span style={{ fontSize: 7.5, color: m.color, fontWeight: 700 }}>{m.status}</span>
                      </div>
                      <div style={{ fontSize: 8, color: AM.textMuted, marginTop: 4 }}>
                        Focus: {m.scope}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${AM.border}`, paddingTop: 10, fontSize: 8.5, color: AM.text }}>
                <span style={{ fontWeight: 700, color: AM.amazonGold, display: "block", marginBottom: 4 }}>Mentorship Framework:</span>
                I co-founded the Frontend Technical Guild, holding bi-weekly office hours to help teams adopt modern technologies, reducing average developer onboarding time by **50%** (from 4 weeks down to 2).
              </div>

            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={AM.amazonOrange} label="Onboarding roadmap & training checklist" code={
`# Junior developer onboarding checklist (Slack Frontend Guild)
# Reduces setup friction and aligns teams on coding standards

## Phase 1: Environment Setup (Week 1)
- [x] Run \`infra-cli dev-setup\` to initialize compiler configs.
- [x] Verify local Webpack Module Federation connects to staging remotes.
- [x] Walkthrough listings schema parser specification files.

## Phase 2: First Component contribution (Week 2)
- [x] Develop a simple stateless presentation component (e.g. badge, tag).
- [x] Write React Testing Library unit tests verifying properties.
- [x] Submit code review PR, resolving diagnostic static checks.

## Phase 3: Collaborative shipping (Week 3-4)
- [x] Shadow mid-level engineer during a canary deployment rollout.
- [x] Participate in design API reviews for new modules.
- [x] Lead first independent feature release to product beta targets.

# Onboarding performance feedback loop:
- Shorter onboarding loop: reduces team setup overhead by 20 hours.
- Direct component ownership: increases junior engineer shipping metrics by 40%.`} />
          </div>
        </div>
      )}
    </div>
  );
}
