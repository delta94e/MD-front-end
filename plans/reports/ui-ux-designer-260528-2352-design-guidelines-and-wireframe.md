# Design Guidelines & Wireframe Report

## Deliverables

### 1. Design Guidelines Document
**Path:** `/Users/truongnguyen/MD-front-end/docs/design-guidelines.md`

Covers:
- **Color palette** — Dark (default) and light mode tokens. Deep navy/slate dark, clean white light. AI panel uses purple accent to distinguish from primary blue.
- **Typography** — Inter for UI, JetBrains Mono for code. Full type scale from h1 (28px) to caption (12px). Markdown content gets its own optimized scale (paragraphs 15px, line-height 1.75 for readability).
- **Spacing** — 4px base scale: xs(4) sm(8) md(12) lg(16) xl(24) 2xl(32) 3xl(48).
- **Layout** — Three-panel: sidebar 280px (resizable 200-400), content flex-1, AI panel 320px (collapsible). Header 48px fixed.
- **Breakpoints** — sm(640) md(768) lg(1024) xl(1280) 2xl(1536). Sidebar overlay on mobile, AI panel hidden below xl.
- **Component patterns** — File tree (indented, expand/collapse, active highlight, count badges), markdown viewer (breadcrumb, TOC with scroll-spy, code blocks with copy), editor (split-pane, CodeMirror + live preview), AI panel (4 tabs, streaming output).
- **Buttons** — Primary (accent bg), secondary (tertiary bg + border), ghost, icon (32x32), danger.
- **Icons** — Lucide React, 16px default, 1.75px stroke.
- **Motion** — Sidebar 200ms, folders 150ms, AI panel 250ms, hover 100ms. Respects prefers-reduced-motion.
- **Accessibility** — Focus rings, keyboard nav (Ctrl+B sidebar, Ctrl+K search, Ctrl+S save), aria-expanded, WCAG AA contrast, 44px touch targets.
- **shadcn/ui components** — Sidebar, ResizablePanel, Tabs, Button, Input, Tooltip, ScrollArea, Sheet, Skeleton.

### 2. Interactive Wireframe
**Path:** `/Users/truongnguyen/MD-front-end/docs/wireframe/main-layout.html`

Self-contained HTML with Tailwind CSS (CDN). Features:
- **Three-panel layout** with real content (closures deep dive article)
- **Sidebar** — Search input with Ctrl+K shortcut, full file tree with 12 folders (485+ files), expand/collapse, file count badges, active file highlight, collapse-all button
- **Markdown viewer** — Rendered with h2/h3 headings, paragraphs, blockquote, code block (syntax-highlighted with copy button), table, lists, links, horizontal rule
- **Markdown editor** — Split-pane with line-numbered editor (contenteditable) and live preview, save button with toast
- **AI panel** — 4 tabs (Summarize, Explain, Translate, Write). Summarize shows result, Explain shows selected text context, Translate has EN/VI toggle with textarea, Write has 4 action buttons (Expand, Fix Grammar, Format, Simplify)
- **Theme toggle** — Dark/light mode with CSS custom properties
- **Resizable sidebar** — Drag handle between sidebar and content
- **Keyboard shortcuts** — Ctrl+B (sidebar), Ctrl+K (search), Ctrl+S (save)
- **Mobile responsive** — Sidebar as overlay drawer below md, hamburger menu

## Design Decisions

1. **Dark mode default** — Developer audience expects dark. Light mode is secondary.
2. **Purple for AI, Blue for primary** — Visual separation between AI features and core navigation.
3. **280px sidebar** — Fits ~30-char filenames comfortably. Resizable for power users.
4. **320px AI panel** — Enough for streaming text without crowding content. Collapsible since it's not always needed.
5. **Code blocks get special treatment** — Syntax highlighting, copy button, line numbers. Developers spend most time reading code.
6. **TOC on xl+ only** — Floating right in content area. Hidden below 1280px to save space.

## Unresolved Questions

- Should the TOC be floating (current) or integrated into the sidebar below the file tree?
- AI panel: bottom sheet on mobile or full-screen overlay?
- Should the editor support vim/emacs keybindings via CodeMirror extensions?
- File tree: virtualized list needed for 485+ files, or is DOM acceptable at this scale?
