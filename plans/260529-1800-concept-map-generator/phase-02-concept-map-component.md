# Phase 2: Concept Map Component

**Status:** completed

## Overview
Create a React component that renders the concept map using `react-force-graph-2d`, reusing patterns from the existing KnowledgeGraph component.

## Related Code Files
- Create: `components/concept-map.tsx`
- Read: `components/knowledge-graph.tsx` (reuse rendering patterns)
- Read: `lib/graph-extractor.ts` (reuse color utilities)

## Implementation Steps

1. Create `components/concept-map.tsx`
   - Props: `{ content: string }` (raw markdown content)
   - Use `extractConceptMap()` from phase 1 to get graph data
   - Dynamic import `react-force-graph-2d` (SSR disabled)

2. Node rendering (`nodeCanvasObject`):
   - Circle size based on heading level (h1=8px, h2=5px, h3=3px)
   - Color: use category colors based on heading text keywords
   - Label: show heading text when zoomed in (globalScale > 1.5)
   - Active node highlight (if linked to current file)

3. Edge rendering (`linkCanvasObject`):
   - Draw lines between connected concepts
   - Show link text as edge label when zoomed in
   - Dim non-connected nodes on hover (neighborhood dimming)

4. Interactions:
   - Click node → scroll to that heading in the markdown viewer
   - Hover node → highlight connected nodes
   - Zoom/pan support
   - Search filter (text input to highlight matching nodes)

5. Layout:
   - Force-directed with `d3VelocityDecay: 0.4`
   - Cluster by heading level (h1 nodes more central)
   - Auto-fit on load

## Success Criteria
- [ ] Graph renders with heading nodes and link edges
- [ ] Node size reflects heading level
- [ ] Labels appear on zoom
- [ ] Click navigates to heading
- [ ] Hover highlights neighbors
- [ ] Search filter works
