# PKM App Architecture, File Tree, FS Access & State Management

**Date:** 2026-05-28 | **Context:** Next.js App Router, 862 markdown files in topic folders

---

## 1. File Tree Component

### Option A: `react-arborist` (Recommended)
- **npm:** `react-arborist` — built on `react-window` for virtualization
- **Features:** Drag-and-drop, keyboard nav, search/filter, custom renderers, virtualized (handles 1000+ nodes)
- **API:** `<Tree data={treeData} ...>{NodeRenderer}</Tree>` — declarative, React-native
- **Size:** ~30KB gzipped
- **Maturity:** Active, used by CodeSandbox, Linear
- **Trade-off:** Slightly complex API for custom rendering; drag-drop not needed initially

### Option B: Custom with `@radix-ui/react-collapsible`
- **Pros:** Full control, minimal bundle, Radix is accessibility-first
- **Cons:** Must implement virtualization, keyboard nav, search yourself
- **Verdict:** Only if tree is small (<100 nodes) or you need pixel-perfect control

### Option C: `@headlessui` + custom
- Not designed for trees. Skip.

**Recommendation:** `react-arborist` — virtualization is critical for 862 files across 20+ folders. Custom tree = weeks of work to match what react-arborist gives OOB.

---

## 2. Filesystem Access in Next.js

### Option A: Server Actions (Recommended)
```ts
// app/actions/files.ts
'use server'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'

export async function getFileTree(rootDir: string) {
  // Recursive directory read, return tree structure
}

export async function getFileContent(filePath: string) {
  return await readFile(join(rootDir, filePath), 'utf-8')
}
```
- **Pros:** No API routes needed, direct `fs` access, type-safe, co-located with components
- **Cons:** Runs on every call (no built-in caching like Route Handlers)
- **Use for:** File reads, writes, tree building

### Option B: Route Handlers (`app/api/files/route.ts`)
- **Pros:** Cacheable via `revalidateTag`, can use `generateStaticParams` for static generation
- **Cons:** More boilerplate, separate from component logic
- **Use for:** File tree index (cacheable), bulk operations

### Hybrid Approach (Best)
- **Route Handler** for file tree index (build once, cache with ISR)
- **Server Actions** for individual file reads/writes (on-demand)

```ts
// app/api/tree/route.ts — cached file tree
export async function GET() {
  const tree = await buildFileTree(CONTENT_DIR)
  return Response.json(tree, {
    headers: { 'Cache-Control': 's-maxage=3600' }
  })
}
```

---

## 3. App Router Architecture

```
app/
├── layout.tsx                    # Root layout (sidebar + main)
├── page.tsx                      # Home / dashboard
├── [category]/
│   ├── layout.tsx                # Category layout (filtered tree)
│   └── [slug]/
│       └── page.tsx              # Document viewer/editor
├── api/
│   ├── tree/route.ts             # File tree index (cached)
│   ├── summarize/route.ts        # AI: summarize
│   ├── explain/route.ts          # AI: explain selection
│   ├── translate/route.ts        # AI: EN↔VI
│   └── writing-assist/route.ts   # AI: writing help
├── components/
│   ├── file-tree.tsx             # Client: react-arborist wrapper
│   ├── markdown-viewer.tsx       # Client: react-markdown
│   ├── markdown-editor.tsx       # Client: CodeMirror 6
│   ├── ai-panel.tsx              # Client: AI features UI
│   └── sidebar.tsx               # Client: tree + search
└── lib/
    ├── fs.ts                     # File system helpers
    ├── tree.ts                   # Tree data structure
    └── ai-helpers.ts             # Shared AI route logic
```

### Server vs Client Split
| Component | Type | Why |
|-----------|------|-----|
| `layout.tsx` | Server | Static shell, sidebar position |
| `page.tsx` (document) | Server | Read file, pass to client |
| `file-tree.tsx` | Client | Interactive tree, drag-drop |
| `markdown-viewer.tsx` | Client | React components, click handlers |
| `markdown-editor.tsx` | Client | CodeMirror needs DOM |
| `ai-panel.tsx` | Client | Streaming, user interaction |

---

## 4. State Management

### Option A: Zustand (Recommended)
- **Size:** ~1KB gzipped
- **Pros:** Simple API, no providers, works with SSR, devtools, middleware (persist, immer)
- **Cons:** Less opinionated (need to structure stores yourself)
- **Use for:** Active file path, editor content, AI panel state, sidebar width

```ts
// lib/store.ts
import { create } from 'zustand'

interface PKMStore {
  activeFile: string | null
  setActiveFile: (path: string) => void
  sidebarWidth: number
  editorContent: string
  setEditorContent: (content: string) => void
}

export const usePKMStore = create<PKMStore>((set) => ({
  activeFile: null,
  setActiveFile: (path) => set({ activeFile: path }),
  sidebarWidth: 280,
  editorContent: '',
  setEditorContent: (content) => set({ editorContent: content }),
}))
```

### Option B: Jotai
- **Size:** ~2KB gzipped
- **Pros:** Atomic state, fine-grained updates, good for derived state
- **Cons:** More conceptual overhead, less intuitive for simple state
- **Verdict:** Good if you have many independent pieces of state; overkill here

### Option C: React Context
- **Pros:** Built-in, no deps
- **Cons:** Re-renders entire tree on any change, no middleware, no SSR-friendly persistence
- **Verdict:** Only for truly static config (theme, locale). Not for app state.

**Recommendation:** Zustand — simple, performant, SSR-compatible, perfect for this scope.

---

## 5. Performance for 862+ Files

### File Tree
- **Virtualization:** react-arborist handles this. Only renders visible nodes.
- **Lazy loading:** Don't load all file contents upfront. Load tree metadata (path, name) first; fetch content on click.
- **Search:** Build a search index at build time (or on first load) using `flexsearch` or `minisearch`.

### Document Loading
- **ISR/SSG:** Pre-build file tree as static JSON. Use `revalidateTag` to invalidate on file changes.
- **Streaming:** Use `loading.tsx` + `Suspense` for document pages.
- **Code splitting:** Dynamic import CodeMirror (`next/dynamic`) — only loads when editor is opened.

### Bundle Size
| Component | Size | Load Strategy |
|-----------|------|---------------|
| react-arborist | ~30KB | Dynamic import (sidebar) |
| react-markdown + plugins | ~40KB | Eager (viewer is primary) |
| CodeMirror 6 | ~100KB | Dynamic import (editor only) |
| AI SDK | ~15KB | Dynamic import (AI panel) |
| **Total initial** | ~40KB | Viewer + tree metadata |

---

## Recommended Stack Summary

| Layer | Choice | Why |
|-------|--------|-----|
| File tree | `react-arborist` | Virtualized, keyboard nav, search |
| FS access | Server Actions + cached Route Handler | Best of both worlds |
| State | Zustand | Simple, performant, SSR-safe |
| Architecture | Server shell + Client interactive islands | Optimal RSC split |
| Performance | ISR tree index + dynamic imports + lazy content | Minimal initial load |

---

## Unresolved Questions

1. **File watching:** Should the tree auto-update when files change on disk? (chokidar in dev, webhook in prod?)
2. **Search scope:** Full-text search across all 862 files or just filenames? (full-text = build-time index needed)
3. **Edit persistence:** Save directly to filesystem or git commit flow?
4. **Multi-user:** Is this single-user local tool or deployed for team access? (affects auth, file locking)
5. **Mobile support:** Touch interactions for tree navigation and editor?
