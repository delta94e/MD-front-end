---
phase: 3
title: "File Tree Sidebar"
status: completed
priority: P1
effort: "4h"
dependencies: [2]
---

# Phase 3: File Tree Sidebar

## Overview

Implement the file tree sidebar using react-arborist with virtualized rendering, filesystem access via Server Actions, search/filter, and folder expand/collapse. Build the tree data structure from the repo's markdown files.

## Requirements

- Functional: Tree view of all markdown files, expand/collapse folders, click to open file, search filter
- Non-functional: Virtualized for 862+ files, lazy content loading, keyboard navigation

## Architecture

```
Client: FileTree (react-arborist)
  ↓ fetches tree data
Server Action: getFileTree()
  ↓ reads filesystem
lib/tree.ts — builds tree structure from fs
  ↓ returns nested TreeNode[]
lib/fs.ts — readdir, readFile, stat wrappers

app/api/tree/route.ts — cached tree index (ISR, revalidate 1h)
```

## Related Code Files

- Create: `components/file-tree.tsx` (react-arborist wrapper)
- Create: `components/tree-node.tsx` (custom node renderer)
- Create: `lib/fs.ts` (filesystem helpers)
- Create: `lib/tree.ts` (tree builder)
- Create: `app/api/tree/route.ts` (cached tree endpoint)
- Create: `app/actions/files.ts` (server actions)
- Modify: `components/sidebar-shell.tsx` (replace placeholder with FileTree)

## Implementation Steps

1. Create `lib/fs.ts`:
   - `readDirRecursive(dirPath)` — returns `{ name, path, type: 'file'|'dir', children? }[]`
   - `readFileContent(filePath)` — reads markdown file as UTF-8
   - `getFileStats(filePath)` — returns size, modified date
   - Root dir from `process.env.CONTENT_DIR || process.cwd()`
   - Filter: only `.md` files, skip `.git`, `node_modules`, `.claude`, `plans`, `docs/wireframe`

2. Create `lib/tree.ts`:
   - `buildFileTree(rootDir)` — calls readDirRecursive, returns nested tree
   - Sort: folders first (alphabetical), then files (alphabetical)
   - Each node: `{ id, name, path, type, children?, size?, modified? }`
   - Add file count per folder

3. Create `app/api/tree/route.ts`:
   - GET handler, calls buildFileTree, returns JSON
   - Cache with `Cache-Control: s-maxage=3600, stale-while-revalidate=86400`

4. Create `app/actions/files.ts`:
   - `getFileContent(path: string)` — reads single file, returns markdown string
   - `saveFileContent(path: string, content: string)` — writes file
   - `getTreeData()` — calls buildFileTree (for server component use)

5. Create `components/tree-node.tsx`:
   - Custom renderer for react-arborist
   - Folder: folder-open/folder icon + name + file count badge + chevron
   - File: file-text icon + name
   - Active state: `bg-active` + left accent border
   - Hover: `bg-hover`
   - Indent: 16px per level

6. Create `components/file-tree.tsx`:
   - Wrapper around `<Tree>` from react-arborist
   - Props: data (tree nodes), onSelect callback
   - Virtualization: built-in via react-arborist (react-window)
   - Keyboard: arrow keys, Enter to open, `/` to focus search
   - Width: 100% of sidebar container

7. Create search bar component:
   - Input at top of sidebar, sticky
   - Debounced filter (300ms) — filters tree nodes by name
   - `flexsearch` for full-text filename search
   - Clear button when input has value

8. Update `components/sidebar-shell.tsx`:
   - Replace placeholder with FileTree + search bar
   - On file click: update Zustand `activeFile`, trigger content load

9. Create file selection handler:
   - On select: set `activeFile` in Zustand
   - Call `getFileContent` server action
   - Set `editorContent` in Zustand
   - Update URL to `/{category}/{slug}` (optional, for deep linking)

10. Run `npm run build` to verify

## Success Criteria

- [ ] All markdown files appear in tree (485+ files across 20+ folders)
- [ ] Folders expand/collapse with animation
- [ ] File click loads content in viewer (Phase 4)
- [ ] Search filters tree in real-time
- [ ] Tree is virtualized (smooth scroll with 862+ nodes)
- [ ] Keyboard navigation works (arrows, Enter)
- [ ] Active file is highlighted
- [ ] File count badges show per folder

## Risk Assessment

- **Risk:** react-arborist SSR issues. **Mitigation:** Dynamic import with `ssr: false`.
- **Risk:** Large tree data payload (~862 nodes). **Mitigation:** Cache tree endpoint, compress with gzip.
- **Risk:** File path traversal vulnerability. **Mitigation:** Validate paths are within CONTENT_DIR, reject `..` segments.

## Security Considerations

- **Path traversal:** Validate all file paths against CONTENT_DIR root. Reject paths containing `..` or absolute paths outside root.
- **File write:** Only allow writing `.md` files within CONTENT_DIR.
