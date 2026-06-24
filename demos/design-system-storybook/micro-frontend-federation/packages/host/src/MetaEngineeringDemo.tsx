/**
 * MetaEngineeringDemo.tsx
 *
 * Meta engineering contributions across four areas:
 *
 * 1. DESIGN SYSTEM
 *    Reusable component library with design tokens.
 *    UI consistency across large-scale Meta products.
 *    StyleX-influenced: co-located, typed, atomic styles.
 *
 * 2. LEXICAL EDITOR
 *    Meta's next-gen open-source text editor (successor to Draft.js).
 *    Node-based EditorState, plugin architecture, immutable state model.
 *    Contributions: tooling, testing infrastructure, reliability.
 *
 * 3. TESTING WORKFLOWS
 *    Custom test utilities, render helpers, test factories.
 *    Snapshot testing for design system components.
 *    Scaled test coverage without scaling test complexity.
 *
 * 4. FE INFRASTRUCTURE
 *    How design system + editor + testing form a coherent platform.
 *    Cross-product consistency, module boundaries, release process.
 *
 * TABS
 *   🎨 Design System  — token grid, component showcase, consistency
 *   📝 Lexical        — working editor + live node tree + plugin system
 *   🧪 Testing        — custom utilities, test patterns, coverage strategy
 *   🏗 Infrastructure — the big picture: how it all connects at Meta scale
 */

import React, {
  useState, useRef, useCallback, useEffect, useMemo,
} from "react";

// ─────────────────────────────────────────────────────────────────
// Design token data
// ─────────────────────────────────────────────────────────────────

const COLORS = [
  { name: "--color-primary",    value: "#0866ff", label: "Primary" },
  { name: "--color-surface",    value: "#1c1e21", label: "Surface" },
  { name: "--color-surface-2",  value: "#242526", label: "Surface 2" },
  { name: "--color-border",     value: "#3a3b3c", label: "Border" },
  { name: "--color-text",       value: "#e4e6eb", label: "Text" },
  { name: "--color-text-muted", value: "#b0b3b8", label: "Muted" },
  { name: "--color-success",    value: "#42b72a", label: "Success" },
  { name: "--color-error",      value: "#f02849", label: "Error" },
  { name: "--color-warning",    value: "#f7b928", label: "Warning" },
  { name: "--color-info",       value: "#0866ff", label: "Info" },
  { name: "--color-accent",     value: "#a855f7", label: "Accent" },
  { name: "--color-highlight",  value: "#f59e0b", label: "Highlight" },
];

const DS_COMPONENTS = [
  { name: "Button",    variants: ["primary", "secondary", "ghost", "danger"],   usage: "CTAs, form submissions, confirmations" },
  { name: "TextInput", variants: ["default", "error", "disabled", "search"],    usage: "Form fields, search, inline editing" },
  { name: "Badge",     variants: ["neutral", "success", "warning", "error"],    usage: "Status labels, counts, tags" },
  { name: "Avatar",    variants: ["xs", "sm", "md", "lg", "group"],             usage: "User identity across all products" },
  { name: "Card",      variants: ["elevated", "outlined", "filled"],            usage: "Content containers, feed items" },
  { name: "Dialog",    variants: ["alert", "confirm", "sheet", "fullscreen"],   usage: "Modals, action confirmations" },
];

// ─────────────────────────────────────────────────────────────────
// Lexical data
// ─────────────────────────────────────────────────────────────────

const LEXICAL_PLUGINS_DATA = [
  { name: "RichTextPlugin",  emoji: "✍️",  active: true,  desc: "Bold, italic, underline, strikethrough, code formatting" },
  { name: "ListPlugin",      emoji: "📋",  active: true,  desc: "Ordered and unordered lists with nested support" },
  { name: "HistoryPlugin",   emoji: "↩️",  active: true,  desc: "Undo/redo with collaborative merge support" },
  { name: "MarkdownPlugin",  emoji: "🔷",  active: false, desc: "Shortcuts: ## → Heading, ** → Bold, - → List" },
  { name: "TablePlugin",     emoji: "📊",  active: false, desc: "Insert and resize tables with keyboard navigation" },
  { name: "MentionPlugin",   emoji: "@",   active: false, desc: "@ mention autocomplete with user search" },
  { name: "AutoLinkPlugin",  emoji: "🔗",  active: false, desc: "Auto-detect and linkify URLs as user types" },
  { name: "CodePlugin",      emoji: "💻",  active: false, desc: "Syntax-highlighted code blocks with language selection" },
];

// ─────────────────────────────────────────────────────────────────
// Testing data
// ─────────────────────────────────────────────────────────────────

const TEST_UTILS = [
  {
    name: "renderWithTheme()",
    color: "#6366f1",
    before: `// Before: boilerplate in every test
const theme = createTheme({ mode: "dark" });
const { getByRole } = render(
  <ThemeProvider value={theme}>
    <FeatureFlagProvider flags={{}}>
      <I18nProvider locale="en">
        <Button variant="primary">Save</Button>
      </I18nProvider>
    </FeatureFlagProvider>
  </ThemeProvider>
);`,
    after: `// After: one utility handles all providers
const { getByRole } = renderWithTheme(
  <Button variant="primary">Save</Button>,
  { theme: "dark" }
);
// Automatically wraps: ThemeProvider, FeatureFlagProvider,
// I18nProvider, RouterProvider, and QueryClientProvider`,
  },
  {
    name: "createMockEditor()",
    color: "#10b981",
    before: `// Before: complex Lexical setup in every editor test
const config = { namespace: "test", theme: {}, onError: () => {} };
const editor = createEditor(config);
const div = document.createElement("div");
document.body.appendChild(div);
editor.setRootElement(div);
await Promise.resolve(); // wait for init
// ... 10 more lines of setup`,
    after: `// After: one factory sets up editor + DOM
const editor = createMockEditor({
  plugins: [RichTextPlugin, ListPlugin],
  initialHtml: "<p>Hello <b>world</b></p>",
});
// editor.state, editor.dispatch(), editor.getContent()
// all available immediately — cleanup handled automatically`,
  },
  {
    name: "waitForEditorUpdate()",
    color: "#f59e0b",
    before: `// Before: manual timing for async editor updates
editor.dispatch(insertText("hello"));
await new Promise(r => setTimeout(r, 50)); // ← flaky!
expect(container.textContent).toBe("hello");`,
    after: `// After: utility waits for Lexical's update cycle
editor.dispatch(insertText("hello"));
await waitForEditorUpdate(editor);
// Resolves after Lexical's reconciler completes —
// no timeouts, no flakiness`,
  },
];

// ─────────────────────────────────────────────────────────────────
// Live editor helpers
// ─────────────────────────────────────────────────────────────────

interface NodeInfo {
  type: string; text?: string; format?: string[];
  children?: NodeInfo[]; key: string;
}

function domToNodeTree(el: Element, depth = 0): NodeInfo {
  const tag = el.tagName?.toLowerCase() ?? "unknown";
  const typeMap: Record<string, string> = {
    div: "RootNode", p: "ParagraphNode", b: "TextNode(bold)",
    strong: "TextNode(bold)", em: "TextNode(italic)", i: "TextNode(italic)",
    u: "TextNode(underline)", h1: "HeadingNode(h1)", h2: "HeadingNode(h2)",
    ul: "ListNode(bullet)", ol: "ListNode(number)", li: "ListItemNode",
    span: "TextNode", br: "LineBreakNode", "#text": "TextNode",
  };
  const type = typeMap[tag] ?? `Node(${tag})`;

  const children: NodeInfo[] = [];
  el.childNodes.forEach((child, i) => {
    if (child.nodeType === Node.TEXT_NODE) {
      if (child.textContent?.trim()) {
        children.push({ type: "TextNode", text: child.textContent, key: `t${depth}_${i}` });
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(domToNodeTree(child as Element, depth + 1));
    }
  });
  return { type, key: `n${depth}_${tag}`, children: children.length ? children : undefined };
}

function NodeTreeView({ node, depth = 0 }: { node: NodeInfo; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const typeColor = node.type.startsWith("Text") ? "#4ade80"
    : node.type.startsWith("Paragraph") ? "#60a5fa"
    : node.type.startsWith("Heading") ? "#f59e0b"
    : node.type.startsWith("List") ? "#a855f7"
    : "#94a3b8";

  return (
    <div style={{ paddingLeft: depth * 14 }}>
      <div
        onClick={() => hasChildren && setOpen(o => !o)}
        style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 10, fontFamily: "monospace", cursor: hasChildren ? "pointer" : "default", padding: "1px 0", color: "#94a3b8" }}
      >
        {hasChildren && <span style={{ color: "#334155" }}>{open ? "▾" : "▸"}</span>}
        {!hasChildren && <span style={{ display: "inline-block", width: 10 }} />}
        <span style={{ color: typeColor }}>&lt;{node.type}&gt;</span>
        {node.text && <span style={{ color: "#64748b" }}> "{node.text.slice(0, 30)}"</span>}
      </div>
      {open && hasChildren && node.children!.map(child => (
        <NodeTreeView key={child.key} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helper: CodeBlock
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0f172a", borderRadius: 8, overflow: "hidden" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 10, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 320 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

export function MetaEngineeringDemo() {
  const [activeTab, setActiveTab] = useState<"design" | "lexical" | "testing" | "infra">("design");

  // Design system
  const [dsComponent, setDsComponent] = useState(0);
  const [colorFilter, setColorFilter] = useState("");

  // Lexical editor
  const editorRef = useRef<HTMLDivElement>(null);
  const [nodeTree, setNodeTree] = useState<NodeInfo | null>(null);
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false });
  const [plugins, setPlugins] = useState(LEXICAL_PLUGINS_DATA);
  const [showPluginCode, setShowPluginCode] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Testing
  const [testUtil, setTestUtil] = useState(0);

  const updateTree = useCallback(() => {
    if (!editorRef.current) return;
    setNodeTree(domToNodeTree(editorRef.current));
    setCharCount(editorRef.current.textContent?.length ?? 0);
  }, []);

  const checkFormats = useCallback(() => {
    setActiveFormats({
      bold:      document.queryCommandState("bold"),
      italic:    document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  }, []);

  const applyFormat = (cmd: string) => {
    document.execCommand(cmd, false);
    editorRef.current?.focus();
    checkFormats();
    updateTree();
  };

  const applyBlock = (tag: string) => {
    document.execCommand("formatBlock", false, tag);
    editorRef.current?.focus();
    updateTree();
  };

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = "<p>Welcome to <b>Lexical</b> — Meta's next-gen editor.<br>Try <i>formatting</i> this text using the toolbar above.</p>";
      updateTree();
    }
  }, [updateTree]);

  const filteredColors = useMemo(() =>
    COLORS.filter(c => c.label.toLowerCase().includes(colorFilter.toLowerCase()) || !colorFilter),
  [colorFilter]);

  const togglePlugin = (i: number) => {
    setPlugins(prev => prev.map((p, idx) => idx === i ? { ...p, active: !p.active } : p));
  };

  const TABS = [
    { id: "design"  as const, label: "🎨 Design System" },
    { id: "lexical" as const, label: "📝 Lexical Editor" },
    { id: "testing" as const, label: "🧪 Testing" },
    { id: "infra"   as const, label: "🏗 Infrastructure" },
  ];

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🔵</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Meta Engineering</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Design System · Lexical Editor · Testing Infrastructure · FE Platform
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Design System", "StyleX", "Lexical", "Open Source", "Component Library", "Testing Infra", "FE Platform", "UI Consistency", "Rich Text Editor"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4, flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── DESIGN SYSTEM ── */}
      {activeTab === "design" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #0866ff30", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#93c5fd", marginBottom: 4 }}>Meta Design System — UI consistency across thousands of product surfaces</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              Meta's products (Facebook, Instagram, Messenger, Workplace, Portal, VR) share the same design system.
              One Button component, one colour token, one spacing scale — change in one place, reflects everywhere.
              Built with <strong style={{ color: "#f1f5f9" }}>StyleX</strong> (Meta's open-source atomic CSS-in-JS system)
              for type safety, zero-runtime cost, and deterministic specificity.
            </div>
          </div>

          {/* Token grid */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9" }}>Design Tokens — Color</div>
              <input value={colorFilter} onChange={e => setColorFilter(e.target.value)} placeholder="Filter…"
                style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "4px 10px", color: "#f1f5f9", fontSize: 11, outline: "none" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
              {filteredColors.map(c => (
                <div key={c.name} style={{ background: "#1e293b", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ height: 40, background: c.value }} />
                  <div style={{ padding: "6px 8px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#f1f5f9" }}>{c.label}</div>
                    <div style={{ fontSize: 8, color: "#64748b", fontFamily: "monospace" }}>{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Component showcase */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #334155", overflowX: "auto" }}>
              {DS_COMPONENTS.map((c, i) => (
                <button key={c.name} onClick={() => setDsComponent(i)} style={{
                  background: dsComponent === i ? "#0f172a" : "transparent",
                  border: "none", borderRight: "1px solid #334155",
                  padding: "10px 16px", color: dsComponent === i ? "#f1f5f9" : "#64748b",
                  cursor: "pointer", fontSize: 12, fontWeight: dsComponent === i ? 700 : 400, whiteSpace: "nowrap",
                }}>{DS_COMPONENTS[i].name}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <div style={{ padding: 16, borderRight: "1px solid #334155" }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10 }}>VARIANTS · {DS_COMPONENTS[dsComponent].usage}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {DS_COMPONENTS[dsComponent].variants.map(v => (
                    <div key={v} style={{
                      background: v === "primary" ? "#0866ff" : v === "danger" ? "#f02849" : v === "success" ? "#42b72a" : v === "error" ? "#f0284920" : v === "warning" ? "#f7b92820" : "#3a3b3c",
                      border: ["secondary","ghost","disabled","outlined","error","warning","neutral","search"].includes(v) ? "1px solid #3a3b3c" : "none",
                      borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 600,
                      color: ["error","warning","neutral"].includes(v) ? "#e4e6eb" : "#fff",
                    }}>{v}</div>
                  ))}
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <CodeBlock label="Design token usage (StyleX pattern)" color="#0866ff" code={
`import * as stylex from "@stylexjs/stylex";
import { colors, spacing } from "@meta/tokens";

const styles = stylex.create({
  button: {
    backgroundColor: colors.primary,  // token, not hex
    paddingBlock:    spacing.sm,       // 8px via token
    borderRadius:    4,
    color:           colors.onPrimary,
    // Atomic CSS generated at build time — zero runtime cost
  },
  buttonHover: {
    "@media (hover: hover)": {
      backgroundColor: colors.primaryHover,
    },
  },
});

// StyleX guarantees:
// 1. Specificity is always the same — no cascade bugs
// 2. Dead code eliminated — only used tokens in bundle
// 3. Type-safe — token names are TypeScript literals`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LEXICAL EDITOR ── */}
      {activeTab === "lexical" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #10b98130", borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6ee7b7", marginBottom: 4 }}>Lexical — Meta's open-source successor to Draft.js</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              Lexical models editor content as an <strong style={{ color: "#f1f5f9" }}>immutable node tree</strong> (EditorState).
              Updates are atomic transactions via <code style={{ background: "#0f172a", padding: "1px 4px", borderRadius: 3 }}>editor.update()</code>.
              Features are plugins — composable, isolated, independently testable.
              The result is a framework that scales from a simple comment box to a collaborative document editor.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 14, marginBottom: 14 }}>
            <div>
              {/* Toolbar */}
              <div style={{ display: "flex", gap: 4, padding: "8px 10px", background: "#1e293b", borderRadius: "8px 8px 0 0", borderBottom: "1px solid #334155", flexWrap: "wrap" }}>
                {[
                  { cmd: () => applyFormat("bold"),      label: "B",  tip: "Bold",      active: activeFormats.bold,      style: { fontWeight: 900 } },
                  { cmd: () => applyFormat("italic"),    label: "I",  tip: "Italic",    active: activeFormats.italic,    style: { fontStyle: "italic" } },
                  { cmd: () => applyFormat("underline"), label: "U",  tip: "Underline", active: activeFormats.underline, style: { textDecoration: "underline" } },
                ].map(({ cmd, label, tip, active, style }) => (
                  <button key={tip} onClick={cmd} title={tip} style={{ background: active ? "#0866ff30" : "transparent", border: `1px solid ${active ? "#0866ff" : "#334155"}`, borderRadius: 5, padding: "4px 10px", color: active ? "#93c5fd" : "#94a3b8", cursor: "pointer", fontSize: 12, ...style }}>
                    {label}
                  </button>
                ))}
                <div style={{ width: 1, background: "#334155", margin: "0 4px" }} />
                {[
                  { cmd: () => applyBlock("h1"), label: "H1" },
                  { cmd: () => applyBlock("h2"), label: "H2" },
                  { cmd: () => applyBlock("p"),  label: "¶" },
                ].map(({ cmd, label }) => (
                  <button key={label} onClick={cmd} style={{ background: "transparent", border: "1px solid #334155", borderRadius: 5, padding: "4px 10px", color: "#94a3b8", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>{label}</button>
                ))}
                <div style={{ width: 1, background: "#334155", margin: "0 4px" }} />
                <button onClick={() => { document.execCommand("insertUnorderedList"); updateTree(); }} style={{ background: "transparent", border: "1px solid #334155", borderRadius: 5, padding: "4px 10px", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>• List</button>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#475569", alignSelf: "center" }}>{charCount} chars</span>
              </div>

              {/* Editor area */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => { updateTree(); checkFormats(); }}
                onKeyUp={checkFormats}
                onMouseUp={checkFormats}
                style={{
                  background: "#1e293b", border: "1px solid #334155", borderTop: "none",
                  borderRadius: "0 0 8px 8px", padding: 16, minHeight: 200, outline: "none",
                  color: "#e4e6eb", fontSize: 14, lineHeight: 1.7,
                }}
              />

              {/* Plugins */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9" }}>Plugins — toggle to enable features</div>
                  <button onClick={() => setShowPluginCode(v => !v)} style={{ background: "transparent", border: "1px solid #334155", borderRadius: 6, padding: "3px 10px", color: "#64748b", cursor: "pointer", fontSize: 10 }}>
                    {showPluginCode ? "Hide code" : "Show plugin code"}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {plugins.map((p, i) => (
                    <button key={p.name} onClick={() => togglePlugin(i)} title={p.desc} style={{
                      background: p.active ? "#10b98120" : "#1e293b",
                      border: `1px solid ${p.active ? "#10b981" : "#334155"}`,
                      borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontSize: 10,
                      color: p.active ? "#4ade80" : "#64748b",
                    }}>
                      {p.emoji} {p.name.replace("Plugin", "")}
                    </button>
                  ))}
                </div>
                {showPluginCode && (
                  <CodeBlock label="Plugin pattern — how Lexical plugins work" color="#10b981" code={
`// Each plugin is a React component with NO UI —
// it uses hooks to register with the editor.

function MarkdownPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register a TRANSFORM: runs on every editor update.
    // Detects "## " at start of line → convert to HeadingNode.
    return editor.registerNodeTransform(TextNode, (node) => {
      const text = node.getTextContent();

      if (text.startsWith("## ")) {
        node.getParent()?.replace(
          $createHeadingNode("h2").append(
            $createTextNode(text.slice(3))
          )
        );
      }
    });
  }, [editor]);

  return null; // plugins have no UI
}

// Register in the editor:
<LexicalComposer initialConfig={config}>
  <RichTextPlugin />
  <MarkdownPlugin />   ← just add the component
  <HistoryPlugin />
</LexicalComposer>`} />
                )}
              </div>
            </div>

            {/* Node tree */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", background: "#0f172a", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b", fontWeight: 700 }}>
                LIVE EditorState — node tree
              </div>
              <div style={{ padding: 10, minHeight: 200, overflowY: "auto", maxHeight: 380 }}>
                {nodeTree
                  ? <NodeTreeView node={nodeTree} />
                  : <div style={{ fontSize: 10, color: "#334155" }}>Start typing to see the node tree…</div>
                }
              </div>
              <div style={{ padding: "6px 12px", background: "#0f172a", borderTop: "1px solid #334155", fontSize: 9, color: "#475569" }}>
                ↑ Updates on every keystroke. Each edit = immutable state snapshot.
              </div>
            </div>
          </div>

          <CodeBlock label="Lexical's EditorState — immutable, serializable, diffable" color="#6ee7b7" code={
`// Lexical's core insight: EditorState is IMMUTABLE.
// Every edit creates a new EditorState (like React's virtual DOM).

// Reading state:
editor.getEditorState().read(() => {
  const root  = $getRoot();
  const first = root.getFirstChild();  // ParagraphNode
  const text  = first?.getTextContent();  // "Hello world"
});

// Writing state — atomic transaction:
editor.update(() => {
  const paragraph = $createParagraphNode();
  const bold      = $createTextNode("Important!");
  bold.setFormat("bold");       // TextFormatType bit flags
  paragraph.append(bold);
  $getRoot().append(paragraph);
  // All mutations applied atomically — no partial states
});

// EditorState is serializable — enables:
// 1. Undo/redo: store snapshots of EditorState
// 2. Collaboration: diff two EditorStates → ops
// 3. Server persistence: serialize() → JSON → DB
// 4. Testing: create EditorState in tests without a DOM

const json = editor.getEditorState().toJSON();
// { root: { children: [...nodes], direction: "ltr", ... } }`} />
        </div>
      )}

      {/* ── TESTING ── */}
      {activeTab === "testing" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #f59e0b30", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fde68a", marginBottom: 4 }}>Testing at Meta scale — without scaling test complexity</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              At Meta, hundreds of engineers contribute to shared infrastructure. Tests must be
              <strong style={{ color: "#f1f5f9" }}> fast to write</strong> (otherwise people skip them),
              <strong style={{ color: "#f1f5f9" }}> reliable</strong> (flaky tests erode trust), and
              <strong style={{ color: "#f1f5f9" }}> meaningful</strong> (test behaviour, not implementation).
              Custom test utilities reduce boilerplate from 15 lines to 1 line — which directly increases the number of tests written.
            </div>
          </div>

          {/* Util selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {TEST_UTILS.map((u, i) => (
              <button key={u.name} onClick={() => setTestUtil(i)} style={{
                background: testUtil === i ? u.color + "20" : "#1e293b",
                border: `1px solid ${testUtil === i ? u.color : "#334155"}`,
                borderRadius: 8, padding: "7px 14px", cursor: "pointer",
                color: testUtil === i ? u.color : "#64748b", fontSize: 11, fontFamily: "monospace",
              }}>{u.name}</button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <CodeBlock label="❌ Before — boilerplate per test" color="#ef4444" code={TEST_UTILS[testUtil].before} />
            <CodeBlock label="✅ After — custom utility" color="#4ade80" code={TEST_UTILS[testUtil].after} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Lexical editor testing patterns</div>
              <CodeBlock label="Testing EditorState directly — no DOM required" color="#10b981" code={
`// Lexical's EditorState is fully testable outside the browser.
// No jsdom setup needed for pure state tests.

test("bold command produces TextNode with bold format", async () => {
  const editor = createMockEditor();

  await editor.update(() => {
    const text = $createTextNode("hello");
    text.select(0, 5);  // select all
    $getRoot()
      .getFirstChild()
      .append(text);
  });

  editor.dispatch(FORMAT_TEXT_COMMAND, "bold");
  await waitForEditorUpdate(editor);

  editor.getEditorState().read(() => {
    const textNode = $getRoot()
      .getFirstChild()
      .getFirstChild();

    expect(textNode.hasFormat("bold")).toBe(true);
    expect(textNode.getTextContent()).toBe("hello");
  });
});`} />
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Design system snapshot testing</div>
              <CodeBlock label="Snapshot tests for component variants" color="#f59e0b" code={
`// Snapshot tests for every design system component.
// Catch unintended visual regressions before they ship.

describe("Button snapshots", () => {
  const variants = ["primary","secondary","ghost","danger"] as const;

  test.each(variants)("renders variant: %s", async (variant) => {
    const { container } = renderWithTheme(
      <Button variant={variant}>Click me</Button>
    );

    // Visual snapshot — fails if any HTML or style changes
    expect(container).toMatchSnapshot();
  });

  test("loading state matches snapshot", () => {
    const { container } = renderWithTheme(
      <Button variant="primary" loading>Click me</Button>
    );
    expect(container).toMatchSnapshot();
  });
});

// Updating snapshots:
// jest --updateSnapshot
// — must be intentional, reviewed in PR
// Snapshots committed to git → changes are visible in diff`} />
            </div>
          </div>
        </div>
      )}

      {/* ── INFRASTRUCTURE ── */}
      {activeTab === "infra" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 4 }}>FE Infrastructure — the platform that makes everything possible</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
              Design system, Lexical, and testing utilities are all infrastructure — they are not user-visible features.
              Their value is in what they enable: product engineers can build new surfaces faster, with fewer bugs,
              consistent with the rest of the product. The infrastructure team's metric is not their own output —
              it is how productive the product teams using their infrastructure become.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              {
                title: "Design System",
                icon: "🎨",
                color: "#0866ff",
                provides: ["Shared component library", "Design tokens (colors, spacing, type)", "StyleX integration", "Accessibility built-in", "Theming (light/dark/high-contrast)"],
                impact: "Product engineers do not build UI primitives. They compose them. Velocity increases. Visual consistency is automatic.",
              },
              {
                title: "Lexical",
                icon: "📝",
                color: "#10b981",
                provides: ["Rich text editing for all Meta products", "Plugin architecture for features", "EditorState for collaboration", "Testing utilities for editor logic", "TypeScript-first API"],
                impact: "Comments, posts, documents, captions — all built on one editor. Bug fix in Lexical benefits every product.",
              },
              {
                title: "Testing Infra",
                icon: "🧪",
                color: "#f59e0b",
                provides: ["renderWithTheme() — 1 line setup", "createMockEditor() — Lexical in tests", "waitForEditorUpdate() — reliable async", "Test factories for complex state", "Coverage thresholds in CI"],
                impact: "Tests are written because writing them is easy. More tests = fewer regressions. Scales without hiring more QA.",
              },
            ].map(col => (
              <div key={col.title} style={{ background: "#1e293b", borderRadius: 10, overflow: "hidden", borderTop: `3px solid ${col.color}` }}>
                <div style={{ padding: "12px 14px", borderBottom: "1px solid #334155" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: col.color }}>{col.icon} {col.title}</div>
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>PROVIDES</div>
                  {col.provides.map(p => <div key={p} style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3, display: "flex", gap: 4 }}><span style={{ color: col.color }}>›</span>{p}</div>)}
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", margin: "10px 0 6px" }}>PRODUCT IMPACT</div>
                  <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.6 }}>{col.impact}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CodeBlock label="How these three connect — editor with design system tokens" color="#a5b4fc" code={
`// Lexical's editor UI uses the design system tokens.
// Testing utilities wrap both.
// Everything is consistent.

// EditorTheme — maps Lexical node types to design system classes
const editorTheme: EditorTheme = {
  text: {
    bold:      stylex(textStyles.bold),
    italic:    stylex(textStyles.italic),
    underline: stylex(textStyles.underline),
    code:      stylex(codeStyles.inline),
  },
  paragraph:  stylex(editorStyles.paragraph),
  heading: {
    h1: stylex(typographyStyles.h1),  // from design system tokens
    h2: stylex(typographyStyles.h2),
  },
  list: {
    ul:   stylex(listStyles.bullet),
    ol:   stylex(listStyles.number),
    listitem: stylex(listStyles.item),
  },
};

// Test: renders with correct design system class
test("editor renders headings with design token class", () => {
  const { getByRole } = renderWithTheme(
    <LexicalEditor theme={editorTheme}>
      <h1>Title</h1>
    </LexicalEditor>
  );
  const heading = getByRole("heading", { level: 1 });
  expect(heading).toHaveClass("typography-h1"); // token class
});`} />

            <div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>Infrastructure team's north-star metrics</div>
                {[
                  { metric: "Time to first PR for new engineer", target: "< 1 day with infra setup", icon: "⏱" },
                  { metric: "Test setup lines per test file",    target: "≤ 3 lines (was 18)",      icon: "📏" },
                  { metric: "Editor bug regression rate",        target: "0 in 6 months post-fix",  icon: "🐛" },
                  { metric: "Design token drift (ad-hoc hex values)", target: "0 new ones per sprint", icon: "🎨" },
                  { metric: "Flaky test rate",                   target: "< 0.5% of all runs",      icon: "🎲" },
                ].map(r => (
                  <div key={r.metric} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 14 }}>{r.icon}</span>
                    <div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{r.metric}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#4ade80" }}>{r.target}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MetaEngineeringDemo;
