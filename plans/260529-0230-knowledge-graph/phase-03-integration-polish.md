---
phase: 3
title: "Integration & Polish"
status: completed
priority: P2
effort: "3h"
dependencies: [2]
---

# Phase 3: Integration & Polish

## Overview

Integrate the knowledge graph into the main layout — toggle between ContentViewer and GraphView in the center panel. Add keyboard shortcut, header button, responsive sizing, and visual polish.

## Requirements

- Functional: Toggle between document view and graph view
- Functional: Keyboard shortcut (Ctrl+G) to toggle graph
- Functional: Header button with graph icon
- Functional: Graph fills available space (respects sidebar/AI panel)
- Functional: Active file highlighted in graph when switching back
- Non-functional: Smooth transition between views
- Non-functional: Graph re-renders correctly after layout changes

## Architecture

```
app/page.tsx
├── if graphOpen → KnowledgeGraph (center panel)
├── else → ContentViewer (center panel)

components/app-header.tsx
└── Graph toggle button (Network icon, Ctrl+G)

lib/store.ts
└── graphOpen: boolean (existing from Phase 2)
```

## Related Code Files

- Modify: `app/page.tsx` — conditional render ContentViewer vs KnowledgeGraph
- Modify: `components/app-header.tsx` — add graph toggle button
- Modify: `components/keyboard-help-dialog.tsx` — add Ctrl+G shortcut docs
- Modify: `components/knowledge-graph.tsx` — handle resize, highlight active file

## Implementation Steps

1. Modify `app/page.tsx`:
   - Import `KnowledgeGraph` (dynamic, no SSR)
   - Conditionally render: `{graphOpen ? <KnowledgeGraph /> : <ContentViewer />}`
   - Both panels share same flex-1 space in center
2. Modify `components/app-header.tsx`:
   - Add `Network` icon button to toggle graph
   - Active state styling when graph is open
   - Import `graphOpen`/`setGraphOpen` from store
3. Add keyboard shortcut:
   - `Ctrl+G` / `Cmd+G` toggles graph in page.tsx keydown handler
   - Add to keyboard help dialog
4. Handle active file highlighting:
   - When `activeFile` changes, highlight corresponding node in graph
   - Use `nodeCanvasObject` to draw a ring/border around the active node
5. Responsive sizing:
   - Graph container uses `useRef` + `ResizeObserver` to track dimensions
   - Pass `width`/`height` props to `ForceGraph2D`
   - Recalculate on sidebar/AI panel toggle
6. Visual polish:
   - Smooth fade transition between views
   - Loading skeleton while graph data fetches
   - Empty state if no graph data available

## Success Criteria

- [x] Ctrl+G toggles between document and graph view
- [x] Header has graph toggle button with active state
- [x] Graph fills the center panel correctly
- [x] Active file node is highlighted in graph
- [x] Graph re-renders correctly after sidebar/AI panel toggle
- [x] Keyboard help dialog documents Ctrl+G
- [x] Smooth visual transition between views

## Risk Assessment

- **Risk**: Graph loses state when switching away and back. **Mitigation**: Keep graph in memory, only hide with `display: none` instead of unmounting, or use React.memo.
- **Risk**: ResizeObserver not firing on panel transitions. **Mitigation**: Trigger manual resize event after panel animation completes.
