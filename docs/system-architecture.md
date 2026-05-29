# System Architecture

> AI-Powered Markdown Knowledge Hub

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                     │
├──────────────┬──────────────────────┬───────────────────┤
│   Sidebar    │    Content Area      │    AI Panel       │
│  (FileTree)  │  (ContentViewer)     │   (AiPanel)       │
│              │  ┌──────────────┐    │                   │
│  File search │  │MarkdownViewer│    │ 8 tabs:           │
│  Tree nav    │  │  CodeBlock   │    │ summarize/explain │
│  Keyboard    │  │  Playground  │    │ translate/write   │
│              │  │  Mermaid     │    │ path/guide/skill  │
│              │  │  Annotations │    │ notes             │
│              │  └──────────────┘    │                   │
├──────────────┴──────────────────────┴───────────────────┤
│                    Zustand Store                          │
├─────────────────────────────────────────────────────────┤
│              Server Actions + API Routes                  │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐ │
│  │ fs.ts    │ │ annotations│ │ AI routes│ │ content  │ │
│  │ read/write│ │ SQLite DB  │ │ streaming│ │ cache    │ │
│  └──────────┘ └────────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Component Architecture

### Rendering Pipeline

```
Markdown string
    │
    ▼
ReactMarkdown (remark-gfm + rehype-prism-plus + rehype-annotate)
    │
    ├─ <pre>  → CodeBlock
    │           ├─ language === "mermaid"  → MermaidDiagram
    │           ├─ canExecute (JS/TS)     → Play button + CodePlayground
    │           └─ default                → Copy button only
    │
    ├─ <h1-h6> → createHeading() with slug IDs
    ├─ <a>     → external links open in new tab
    └─ other   → default rendering
```

### Code Playground Architecture

```
User clicks Play on JS/TS code block
    │
    ▼
CodePlayground component mounts
    │
    ├─ handleRun() called
    │   ├─ buildSandboxHtml(code) → HTML string with embedded JS
    │   └─ Sets iframe srcdoc = sandbox HTML
    │
    ▼
Sandboxed iframe (sandbox="allow-scripts")
    │
    ├─ Intercepts console.log/warn/error/info
    ├─ 5-second timeout prevents infinite loops
    ├─ window.onerror captures uncaught errors
    │
    ├─ Signals "ready" via postMessage
    │
    ▼
Parent receives "ready" message
    │
    ├─ prepareCode(code, language)
    │   ├─ JS: use as-is
    │   └─ TS: transpileTS() strips types via regex (~80% coverage)
    │
    ├─ Sends "sandbox-execute" with prepared code
    │
    ▼
Iframe executes code in async IIFE
    │
    ├─ Results/errors sent via postMessage { type: "sandbox-output", level, data }
    ├─ "done" message signals completion
    │
    ▼
Parent renders output lines in collapsible panel
```

**Security boundaries:**
- `sandbox="allow-scripts"` -- no DOM access, no navigation, no form submission
- postMessage source verification (checks `e.source === iframe.contentWindow`)
- 5-second hard timeout kills execution
- Iframe cleanup on component unmount

### File System Layer

```
Server Action (readFileContent / writeFileContent)
    │
    ▼
lib/fs.ts
    ├─ Path validation (must be within CONTENT_DIR)
    ├─ Only .md files writable
    └─ Uses Node.js fs/promises
```

### AI Layer

```
Component (e.g., SummarizeTab)
    │
    ├─ useCompletion({ api: "/api/summarize" })
    │
    ▼
API Route (/api/summarize/route.ts)
    │
    ├─ streamText() from Vercel AI SDK
    ├─ Model: Gemini Flash or Claude Sonnet
    └─ Returns streaming text response
```

### Annotation System

```
User selects text in MarkdownViewer
    │
    ├─ SelectionToolbar appears
    ├─ "Annotate" triggers AnnotationPopover
    │
    ▼
Server Action (createAnnotation)
    │
    ├─ SQLite via better-sqlite3
    ├─ Stores: file path, start/end offsets, color, note
    │
    ▼
rehype-annotate plugin
    │
    ├─ Injects <mark> elements at stored offsets
    └─ Click handler highlights annotation
```

## Data Flow

| Operation | Client | Server | Storage |
|-----------|--------|--------|---------|
| Browse files | FileTree | `getTreeData()` | Filesystem |
| View markdown | MarkdownViewer | `readFileContent()` | Filesystem |
| Edit & save | ContentViewer | `writeFileContent()` | Filesystem |
| Run code | CodePlayground | None (iframe) | None |
| AI features | AiPanel (useCompletion) | API routes | None |
| Annotations | AnnotationPopover | Server Actions | SQLite |
| Graph | KnowledgeGraph | `getTreeData()` | Filesystem |
| Reading prefs | ContentViewer | None | localStorage |

## Key Libraries

| Library | Role | Load Strategy |
|---------|------|---------------|
| react-markdown | Markdown rendering | Eager |
| rehype-prism-plus | Syntax highlighting | Eager |
| mermaid | Diagram rendering | Eager (lazy init) |
| zustand | State management | Eager |
| react-arborist | File tree (unused, custom impl used) | -- |
| @uiw/react-codemirror | Source editor | Dynamic import |
| Lexical | WYSIWYG editor | Dynamic import |
| ai / @ai-sdk/* | AI streaming | Dynamic import |
| better-sqlite3 | Annotation DB | Server only |
