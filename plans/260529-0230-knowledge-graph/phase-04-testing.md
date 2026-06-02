---
phase: 4
title: "Testing"
status: completed
priority: P2
effort: "2h"
dependencies: [3]
---

# Phase 4: Testing

## Overview

Test the graph data extraction pipeline, component rendering, and user interactions. Verify performance with the full 485-node dataset.

## Requirements

- Unit tests for graph extraction functions
- Integration test for graph data pipeline
- Manual verification of rendering, interaction, and performance

## Related Code Files

- Create: `__tests__/lib/graph-extractor.test.ts` — unit tests
- Create: `__tests__/components/knowledge-graph.test.tsx` — component tests (limited, canvas)
- Reference: `__tests__/lib/fs.test.ts` — existing test patterns

## Implementation Steps

1. Write unit tests for `lib/graph-extractor.ts`:
   - `parseReadmeCategories`: test with sample README tables
   - `buildNodes`: test node count, category assignment
   - `buildCategoryEdges`: test edges within category
   - `buildDirectoryEdges`: test subfolder grouping
   - `buildFilenameEdges`: test Jaccard similarity threshold
   - `mergeEdges`: test deduplication and weight priority
2. Write integration test:
   - Run full pipeline on test fixture (10-20 sample files)
   - Verify output structure matches `GraphData` type
   - Verify edge count is reasonable
3. Manual testing:
   - Run `npm run build:graph` on full dataset
   - Verify graph renders with 485 nodes
   - Test click-to-navigate works
   - Test category filter toggles nodes
   - Test search highlights matching nodes
   - Test zoom/pan performance
   - Test responsive resize on panel toggle
   - Measure FPS during interaction (target: 60fps)
4. Build verification:
   - `npm run build` passes
   - No TypeScript errors
   - No console errors in browser

## Success Criteria

- [x] All unit tests pass for graph-extractor
- [x] `npm run build:graph` generates valid graph.json
- [x] Graph renders 485 nodes at 60fps
- [x] Click-to-navigate opens correct file
- [x] Category filter works
- [x] Search highlights nodes
- [x] No console errors
- [x] `npm run build` passes clean

## Risk Assessment

- **Risk**: Canvas-based component hard to unit test. **Mitigation**: Test data layer thoroughly; component testing limited to data fetching and state management.
- **Risk**: Performance regression with full dataset. **Mitigation**: Profile with Chrome DevTools, optimize `nodeCanvasObject` if needed (batch draws, skip off-screen nodes).
