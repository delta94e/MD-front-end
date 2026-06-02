---
phase: 2
title: "Graph Component"
status: completed
priority: P2
effort: "4h"
dependencies: [1]
---

# Phase 2: Graph Component

## Overview

Build the `KnowledgeGraph` component using `react-force-graph-2d` with custom node rendering (file names, category colors), click-to-navigate, hover tooltips, zoom/pan, and category filter controls.

## Requirements

- Functional: Render all nodes with file names and category-based colors
- Functional: Click a node to open that file in ContentViewer
- Functional: Hover shows tooltip with file path and category
- Functional: Zoom/pan with mouse wheel and drag (built-in)
- Functional: Category filter to show/hide node groups
- Functional: Search box to highlight matching nodes
- Non-functional: 60fps with 485 nodes on desktop
- Non-functional: Graph loads in <2s

## Architecture

```
components/knowledge-graph.tsx
├── ForceGraph2D (dynamic import, no SSR)
├── nodeCanvasObject → draw colored circle + file name text
├── onNodeClick → setActiveFile(path, category)
├── onNodeHover → show HTML tooltip overlay
├── GraphControls (category filter, search, zoom reset)
└── GraphLegend (category colors)
```

Component tree:
```
KnowledgeGraphPanel
├── GraphToolbar (search, filter, zoom reset)
├── ForceGraph2D
└── GraphTooltip (absolute positioned HTML overlay)
```

## Related Code Files

- Create: `components/knowledge-graph.tsx` — main graph component
- Create: `components/graph-toolbar.tsx` — search, filter, zoom controls
- Modify: `lib/store.ts` — add `graphOpen`, `graphCategoryFilter`, `graphSearchQuery`
- Reference: `components/file-tree.tsx` — `setActiveFile()` pattern
- Reference: `lib/graph-extractor.ts` — types from Phase 1

## Implementation Steps

1. Create `components/knowledge-graph.tsx`:
   - Dynamic import: `const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false })`
   - Fetch `graphData` via `getGraphData()` on mount
   - `nodeCanvasObject`: draw filled circle (category color) + truncated file name label
   - Color palette: 10 distinct colors mapped to top categories
   - `onNodeClick`: call `setActiveFile(node.path, node.category)`
   - `onNodeHover`: set tooltip state with node info, position near cursor
   - `linkCanvasObject`: draw thin semi-transparent lines, thicker for higher weight
   - `d3VelocityDecay: 0.3` for stable layout
2. Create `components/graph-toolbar.tsx`:
   - Search input: filter/highlight nodes matching query
   - Category checkboxes: toggle visibility of node groups
   - Zoom reset button: `graphRef.current?.zoomToFit(400)`
3. Add to Zustand store (`lib/store.ts`):
   - `graphOpen: boolean` — toggle graph view
   - `setGraphOpen: (open) => void`
   - `graphCategoryFilter: string[]` — active categories (empty = all)
   - `setGraphCategoryFilter: (categories) => void`
4. Implement category color mapping:
   - Predefined palette: `["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac"]`
   - Map each unique category to a color (stable assignment)

## Success Criteria

- [x] `KnowledgeGraph` renders with all nodes visible
- [x] Nodes show file name labels and category colors
- [x] Clicking a node opens the file in ContentViewer
- [x] Hover shows tooltip with file path and category
- [x] Zoom/pan works smoothly with mouse
- [x] Category filter toggles node visibility
- [x] Search highlights matching nodes
- [x] Graph performs at 60fps with 485 nodes

## Risk Assessment

- **Risk**: Canvas text rendering blurry on HiDPI. **Mitigation**: Use `devicePixelRatio` in canvas context.
- **Risk**: Graph layout unstable (nodes keep moving). **Mitigation**: Increase `d3VelocityDecay`, use `warmupTicks` to pre-settle.
- **Risk**: 485 labels overlapping. **Mitigation**: Only show labels for nodes above a zoom threshold, or use `nodeLabel` (HTML tooltip) instead of canvas text for small nodes.
