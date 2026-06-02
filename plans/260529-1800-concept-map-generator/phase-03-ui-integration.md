# Phase 3: UI Integration

**Status:** completed

## Overview
Integrate the Concept Map into the existing Knowledge Hub UI as a toggle option alongside the file-level Knowledge Graph.

## Related Code Files
- Modify: `components/content-viewer.tsx` (add concept map toggle)
- Read: `components/knowledge-graph.tsx` (existing graph tab)

## Implementation Steps

1. Add toggle in content viewer:
   - Add a "Concept Map" button/icon near the existing Knowledge Graph button
   - Toggle between file-level graph and concept-level map
   - Use `Network` or `GitBranch` icon from lucide-react

2. Pass markdown content to ConceptMap:
   - Get current file's markdown content from store
   - Pass as prop to `<ConceptMap content={markdown} />`
   - Only show when a file is selected

3. State management:
   - Add `showConceptMap` boolean to store (or local state)
   - Persist preference in localStorage

4. Responsive layout:
   - Full-width panel below or beside the markdown viewer
   - Collapsible with smooth animation
   - Min height 300px for usability

## Success Criteria
- [ ] Concept Map accessible via UI toggle
- [ ] Shows correct graph for current file
- [ ] Toggle persists across sessions
- [ ] Responsive on different screen sizes
