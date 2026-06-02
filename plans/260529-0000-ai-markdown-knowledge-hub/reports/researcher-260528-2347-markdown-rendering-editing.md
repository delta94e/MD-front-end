# Markdown Rendering & Editing — Research Report

**Date:** 2026-05-28 | **Context:** PKM app on Next.js (React)

---

## 1. Markdown Viewer (Rendering)

### Option A: `react-markdown` + plugins
- **npm:** `react-markdown`, `remark-gfm`, `rehype-highlight`, `rehype-raw`
- **Pros:** Lightweight (~30KB), component-based (custom renderers per element), huge community (~9M weekly DL), React-native approach, tree-shakeable
- **Cons:** Plugin ecosystem fragmented; `rehype-raw` for raw HTML has XSS risk if user content is untrusted; GFM requires separate plugin
- **Maturity:** Very mature, stable API, actively maintained
- **Verdict: BEST for viewer**

### Option B: `@uiw/react-md-editor` (viewer mode)
- **npm:** `@uiw/react-md-editor`
- **Pros:** All-in-one (viewer + editor), built-in preview, syntax highlighting included
- **Cons:** Heavy (~200KB+), opinionated styling, harder to customize viewer independently, less flexible for split-pane design
- **Verdict:** Good for quick MVP, but couples viewer+editor too tightly

---

## 2. Markdown Editor

### Option A: `@uiw/react-md-editor` (editor mode)
- **Pros:** Drop-in markdown editor with toolbar, preview pane, WYSIWYG-lite, built on CodeMirror 5
- **Cons:** Bundles its own preview (duplicates your viewer), CodeMirror 5 (not 6), limited extensibility, heavy
- **Verdict:** OK for simple cases, but conflicts with custom viewer

### Option B: CodeMirror 6 (via `@uiw/react-codemirror`)
- **npm:** `@uiw/react-codemirror`, `@codemirror/lang-markdown`
- **Pros:** Modern, extensible, lightweight core, excellent Markdown language support, LSP-capable, great keyboard shortcuts OOB, dark/light themes via `@codemirror/theme-one-dark`
- **Cons:** Steeper API than Monaco, less well-known
- **Verdict: BEST for editor pane**

### Option C: Monaco Editor (`@monaco-editor/react`)
- **npm:** `@monaco-editor/react`
- **Pros:** VS Code engine, familiar UX, great IntelliSense
- **Cons:** Very heavy (~2-4MB), overkill for markdown (designed for code), poor mobile support, complex SSR setup in Next.js
- **Verdict:** Wrong tool for markdown editing

---

## 3. Syntax Highlighting (Code Blocks in Viewer)

| Library | Bundle Size | Speed | Themes | SSR | Languages | Notes |
|---------|------------|-------|--------|-----|-----------|-------|
| **shiki** | ~500KB (lazy) | Fast (WASM) | VS Code themes | Yes (async) | 200+ | Best quality output |
| **Prism.js** | ~30KB | Fast | 100+ | Yes | 200+ | Most popular, via `rehype-prism-plus` |
| **highlight.js** | ~45KB | Fast | 100+ | Yes | 190+ | Via `rehype-highlight` |

**Verdict: Prism.js via `rehype-prism-plus`** — best balance of size, quality, and React ecosystem integration. Use shiki if you want VS Code-quality output and can tolerate async/higher bundle.

---

## 4. Split-Pane Layout

| Library | npm | Size | Maintained | SSR-safe | Resize | Keyboard |
|---------|-----|------|-----------|----------|--------|----------|
| **allotment** | `allotment` | ~15KB | Yes | Yes | Yes | Yes |
| **react-split** | `react-split` | ~8KB | Minimal | Yes | Yes | No |
| **react-resizable-panels** | `react-resizable-panels` | ~10KB | Yes | Yes | Yes | Yes |

**Verdict: `allotment`** — actively maintained (by VS Code contributor), supports persistent sizes, keyboard nav, works well in Next.js SSR. `react-resizable-panels` is a good alternative if you want something smaller.

---

## 5. Large File Handling

- **Virtualization:** `react-window` or `react-virtuoso` for the viewer pane if files exceed ~5000 lines. Markdown doesn't virtualize cleanly (variable-height rows), so `react-virtuoso` (dynamic row heights) is better.
- **Lazy loading images:** Use Next.js `<Image>` with `loading="lazy"` inside custom `react-markdown` components
- **Editor:** CodeMirror 6 handles large docs natively via viewport-based rendering (only renders visible lines). No extra work needed.
- **Debounce preview:** Debounce markdown re-render (300ms) to avoid jank during typing

---

## 6. Dark/Light Theme

- **Viewer:** CSS custom properties + `next-themes` for toggling. Style `react-markdown` output with CSS variables.
- **Editor (CodeMirror 6):** `@codemirror/theme-one-dark` for dark; default light theme built-in. Toggle via Compartment extension.
- **Code blocks:** Prism themes swapped via CSS class on `<pre>` parent (match `data-theme` from `next-themes`)

---

## 7. Keyboard Shortcuts

CodeMirror 6 provides OOB: Ctrl+B (bold), Ctrl+I (italic), Ctrl+Z/Y (undo/redo), Tab (indent), Ctrl+K (link). Extend with custom keymap via `@codemirror/view` `keymap` facet.

---

## Recommended Stack

```
Viewer:   react-markdown + remark-gfm + rehype-prism-plus + rehype-raw
Editor:   @uiw/react-codemirror + @codemirror/lang-markdown + @codemirror/theme-one-dark
Layout:   allotment
Themes:   next-themes (toggle), CSS variables (viewer), CodeMirror Compartment (editor)
Large:    CodeMirror 6 viewport rendering (editor), react-virtuoso (viewer if needed)
```

### Trade-off Matrix

| Concern | Recommended Stack | @uiw/react-md-editor (all-in-one) |
|---------|------------------|-----------------------------------|
| Bundle size | ~80KB total | ~200KB+ |
| Customizability | High (separate viewer/editor) | Low (coupled) |
| Code highlighting | Prism (flexible) | Built-in (less flexible) |
| Editor quality | CodeMirror 6 (modern) | CodeMirror 5 (older) |
| Split-pane | Native allotment | Built-in preview only |
| Dark mode | Full control via next-themes | Partial |
| Maintenance risk | Low (each lib is actively maintained) | Medium (single maintainer) |
| Dev effort | Medium (wire components together) | Low (drop-in) |

### Adoption Risk
- **react-markdown:** Very low risk. 9M+ weekly downloads, 5+ years stable
- **CodeMirror 6:** Low risk. Backed by Mozilla/community, used by many editors
- **allotment:** Low-medium risk. Smaller community but VS Code pedigree
- **rehype-prism-plus:** Low risk. Thin wrapper over Prism.js
- **next-themes:** Very low risk. De facto standard for Next.js theme toggling

---

## Unresolved Questions

1. **WYSIWYG vs raw editing** — Is the target audience markdown-literate, or do they need rich-text editing? If the latter, consider `tiptap` or `milkdown` instead of CodeMirror.
2. **Collaboration** — Real-time co-editing would push toward Yjs + CodeMirror collaboration extension (significant scope increase).
3. **Mobile support** — CodeMirror 6 works on mobile but is keyboard-centric. Touch-first editing may need a different editor.
4. **File size ceiling** — What's the expected max document size? Virtualization is only needed past ~5K lines; if docs stay small, skip `react-virtuoso`.
5. **Offline/PWA** — If offline support is needed, service worker strategy affects how Prism themes and CodeMirror extensions are bundled.
