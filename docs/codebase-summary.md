# Codebase Summary

> AI-Powered Markdown Knowledge Hub -- Personal Knowledge Management (PKM) web app.

**Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui, Zustand

---

## Directory Structure

```
.
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout (fonts, theme, providers)
│   ├── page.tsx                 # Main page (sidebar + content + AI panel)
│   ├── globals.css              # Tailwind imports, custom keyframes
│   ├── actions/
│   │   ├── files.ts             # Server Actions: read/write file content, tree index
│   │   └── annotations.ts      # Server Actions: CRUD annotations (SQLite)
│   └── api/
│       ├── summarize/route.ts   # Gemini Flash: document summarization
│       ├── explain/route.ts     # Claude Sonnet: selection explanation
│       ├── translate/route.ts   # Gemini Flash: EN<->VI translation
│       └── writing-assist/route.ts # Claude Sonnet: expand/grammar/format/simplify
│
├── components/
│   ├── markdown-viewer.tsx      # ReactMarkdown renderer with CodeBlock, headings, annotations
│   ├── code-playground.tsx      # Inline JS/TS sandbox runner (iframe-based)
│   ├── content-viewer.tsx       # Main content area: view/edit modes, TOC, toolbar
│   ├── file-tree.tsx            # Recursive file tree with search, keyboard nav
│   ├── ai-panel.tsx             # 8-tab AI assistant (summarize, explain, translate, write, path, guide, skill, notes)
│   ├── knowledge-graph.tsx      # Force-directed graph visualization
│   ├── mermaid-diagram.tsx      # Inline Mermaid diagram renderer
│   ├── annotation-popover.tsx   # Text selection annotation UI
│   ├── annotation-panel.tsx     # Annotation list/management
│   ├── selection-toolbar.tsx    # Floating toolbar on text selection
│   ├── reading-settings-popover.tsx # Font, size, line-height, width preferences
│   ├── toc-panel.tsx            # Table of contents with scroll-spy
│   ├── learning-path-tab.tsx    # AI-generated learning paths
│   ├── study-guide-tab.tsx      # AI-generated study guides
│   ├── skill-generator-tab.tsx  # AI skill file generator
│   ├── editor/                  # Lexical WYSIWYG + CodeMirror source editor
│   └── ui/                      # shadcn/ui primitives (button, input, tabs, etc.)
│
├── lib/
│   ├── store.ts                 # Zustand global state (sidebar, AI panel, editor, graph, annotations, reading prefs)
│   ├── fs.ts                    # File system utilities: recursive dir scan, read/write .md files
│   ├── code-sandbox.ts          # Sandbox HTML builder, console capture, TS transpilation, postMessage protocol
│   ├── ai-helpers.ts            # Shared AI prompt helpers
│   ├── annotations-db.ts        # SQLite (better-sqlite3) annotation storage
│   ├── content-cache.ts         # In-memory LRU cache for file content
│   ├── content-crawler.ts       # HTML-to-markdown web crawler
│   ├── graph-extractor.ts       # Extract heading/link graph from markdown files
│   ├── html-to-markdown.ts      # Turndown-based HTML-to-markdown conversion
│   ├── rehype-annotate.ts       # Rehype plugin: inject annotation highlights into HTML
│   ├── toc-extractor.ts         # Extract h2/h3 headings + slugify for TOC
│   ├── topic-index.ts           # Build topic-to-file index from frontmatter
│   ├── ai-output-saver.ts       # Save AI outputs to disk as markdown
│   ├── learning-path-types.ts   # Type definitions for learning paths
│   ├── study-guide-types.ts     # Type definitions for study guides
│   ├── utils.ts                 # cn() classname merge utility
│   └── skill-generator/         # Skill file generation logic
│
└── docs/                        # Project documentation
```

## Key Architectural Patterns

### Client/Server Split
- **Server:** File I/O via Server Actions (`app/actions/`), API routes for AI streaming
- **Client:** All components are `"use client"`. Zustand for global state. No React context providers.

### Markdown Pipeline
1. Server reads `.md` file via `fs.ts`
2. Client renders via `react-markdown` with `remark-gfm` (GFM tables, task lists) + `rehype-prism-plus` (syntax highlighting) + custom `rehype-annotate` (annotation highlights)
3. `CodeBlock` component wraps `<pre>` blocks: adds Copy button, Play button (JS/TS/JSX/TSX), Mermaid diagram rendering
4. `CodePlayground` executes JS/TS in sandboxed iframe with console capture

### AI Integration
- Vercel AI SDK (`ai` package) with `useCompletion` hook
- Streaming text responses via `/api/*` route handlers
- Two model tiers: Gemini 2.0 Flash (cheap/fast) and Claude 3.5 Sonnet (quality)

### State Management
- Single Zustand store (`lib/store.ts`) manages: sidebar, AI panel, editor mode/content, graph, annotations, reading preferences
- No prop drilling through deep trees; components pull from store directly

### Editor Modes
- **View mode:** `MarkdownViewer` (react-markdown) + TOC panel
- **Edit mode:** Toggle between Lexical WYSIWYG editor and CodeMirror source editor
- Dirty state tracked locally; Ctrl+S saves via Server Action
