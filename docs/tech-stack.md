# Tech Stack — AI-Powered Markdown Knowledge Hub

**Date:** 2026-05-28

---

## Core Framework

| Layer | Choice | Version | Why |
|-------|--------|---------|-----|
| Framework | Next.js (App Router) | 15.x | RSC, server actions, streaming, ISR |
| Language | TypeScript | 5.x | Type safety across FS, API, UI |
| Styling | Tailwind CSS | 4.x | Utility-first, dark mode, fast iteration |
| UI Components | shadcn/ui (Radix UI) | latest | Accessible, composable, copy-paste model |

## File Tree & Navigation

| Layer | Choice | Size | Why |
|-------|--------|------|-----|
| Tree component | `react-arborist` | ~30KB | Virtualized (862+ files), keyboard nav, search, drag-drop |
| FS access | Server Actions + Route Handler | — | Server Actions for read/write, cached Route Handler for tree index |
| Search | `flexsearch` | ~10KB | Full-text search across markdown files, build-time index |

## Markdown Rendering & Editing

| Layer | Choice | Size | Why |
|-------|--------|------|-----|
| Viewer | `react-markdown` + `remark-gfm` + `rehype-prism-plus` | ~40KB | Component-based, GFM support, Prism code highlighting, inline code playground for JS/TS |
| Editor | `@uiw/react-codemirror` + `@codemirror/lang-markdown` | ~100KB | CodeMirror 6, handles large files, markdown language support |
| Split pane | `allotment` | ~15KB | VS Code pedigree, keyboard nav, SSR-safe, persistent sizes |
| Code highlighting (viewer) | `rehype-prism-plus` (Prism.js) | ~30KB | Best size/quality trade-off |
| Theme (editor) | `@codemirror/theme-one-dark` | ~5KB | Dark theme for CodeMirror |

## AI Integration

| Layer | Choice | Why |
|-------|--------|-----|
| AI SDK | Vercel AI SDK (`ai` package) | Unified streaming API, `useCompletion`, `streamText` |
| Default LLM | Google Gemini 2.0 Flash (`@ai-sdk/google`) | Cheap (~$0.10/1M input), fast, good Vietnamese support |
| Quality LLM | Claude 3.5 Sonnet (`@ai-sdk/anthropic`) | Better nuance for explanations, writing assist |

### AI Features Architecture

| Feature | Hook | Route | Model |
|---------|------|-------|-------|
| Summarize | `useCompletion` | `/api/summarize` | Gemini Flash |
| Explain selection | `useCompletion` | `/api/explain` | Claude Sonnet |
| Translate EN↔VI | `useCompletion` | `/api/translate` | Gemini Flash |
| Writing assist | `useCompletion` | `/api/writing-assist` | Claude Sonnet |

## State Management & Utilities

| Layer | Choice | Size | Why |
|-------|--------|------|-----|
| State | Zustand | ~1KB | Simple, SSR-safe, no providers, devtools |
| Theme toggle | `next-themes` | ~2KB | Dark/light mode, system preference detection |
| Icons | `lucide-react` | Tree-shakeable | Consistent icon set, lightweight |

## Bundle Strategy

| Component | Load Strategy | Initial Impact |
|-----------|---------------|---------------|
| react-markdown + plugins | Eager | ~40KB |
| react-arborist | Dynamic import (sidebar) | ~0KB initial |
| CodeMirror 6 | Dynamic import (editor toggle) | ~0KB initial |
| AI SDK | Dynamic import (AI panel) | ~0KB initial |
| react-force-graph-2d | Dynamic import (knowledge graph) | ~0KB initial |
| **Total initial** | — | **~40KB** |

## Development Tooling

| Tool | Purpose |
|------|---------|
| ESLint + Prettier | Code quality |
| Husky + lint-staged | Pre-commit hooks |
| Vitest | Unit testing |
| Playwright | E2E testing |

## Environment Variables

```env
GOOGLE_GENERATIVE_AI_API_KEY=     # Gemini API key
ANTHROPIC_API_KEY=                 # Claude API key (optional)
CONTENT_DIR=./                     # Root dir for markdown files
```

## Dependency Summary

```
# Core
next react react-dom typescript tailwindcss

# UI
@radix-ui/react-* (via shadcn/ui)
lucide-react
next-themes

# File tree
react-arborist
flexsearch

# Markdown
react-markdown remark-gfm rehype-prism-plus rehype-raw

# Editor
@uiw/react-codemirror
@codemirror/lang-markdown
@codemirror/theme-one-dark
allotment

# AI
ai @ai-sdk/google @ai-sdk/anthropic

# Visualization
react-force-graph-2d

# State
zustand

# Dev
eslint prettier husky lint-staged vitest @playwright/test
```
