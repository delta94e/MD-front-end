---
phase: 1
title: "Research & Data Layer"
status: completed
priority: P2
effort: "3h"
dependencies: []
---

# Phase 1: Research & Data Layer

## Overview

Install `react-force-graph-2d`, build the graph data extraction pipeline (README parser + directory walker + filename tokenizer), and create a build-time script that outputs `graph.json`.

## Requirements

- Functional: Extract all .md files as graph nodes with category/color metadata
- Functional: Build weighted edges from 3 signals (README, directory, filename)
- Functional: Output `graph.json` consumable by the graph component
- Non-functional: Pre-computation completes in <5s for 485 files
- Non-functional: Output file <100KB

## Architecture

```
README.md ──┐
            ├─→ lib/graph-extractor.ts ─→ graph.json
Dir tree ───┤     (parse README, walk dirs,
Filenames ──┘      tokenize filenames, merge edges)
```

Data flow:
1. `parseReadmeCategories(readme)` → `Map<filename, category>`
2. `buildDirectoryEdges(tree)` → edges from shared parent dirs
3. `buildFilenameEdges(filenames)` → edges from Jaccard similarity > 0.5
4. `mergeEdges(...)` → weighted edge list with deduplication
5. Output `{ nodes: [...], edges: [...] }` to `graph.json`

## Related Code Files

- Create: `lib/graph-extractor.ts` — core extraction logic
- Create: `scripts/build-graph.ts` — build-time CLI script
- Create: `public/graph.json` — generated output (gitignored)
- Modify: `package.json` — add `react-force-graph-2d` + `build:graph` script
- Modify: `app/actions/files.ts` — add `getGraphData()` server action
- Reference: `lib/fs.ts` — reuse `buildFileTree()` for directory walking
- Reference: `lib/topic-index.ts` — existing README parser (if compatible)

## Implementation Steps

1. Install `react-force-graph-2d`: `npm install react-force-graph-2d`
2. Create `lib/graph-extractor.ts`:
   - `parseReadmeCategories(readmeContent: string): Map<string, string>` — regex-parse README tables to map filenames to category names
   - `buildNodes(tree: TreeNode[], categoryMap): GraphNode[]` — flatten tree, assign category/color
   - `buildCategoryEdges(nodes: GraphNode[]): GraphEdge[]` — connect files sharing a category
   - `buildDirectoryEdges(tree: TreeNode[]): GraphEdge[]` — connect files in same subfolder
   - `buildFilenameEdges(nodes: GraphNode[]): GraphEdge[]` — Jaccard similarity on kebab-case tokens, threshold > 0.5
   - `mergeEdges(...edges: GraphEdge[][]): GraphEdge[]` — deduplicate, keep highest weight
   - Export types: `GraphNode { id, name, path, category, color }`, `GraphEdge { source, target, weight }`, `GraphData { nodes, edges }`
3. Create `scripts/build-graph.ts`:
   - Read README.md, call `buildFileTree()`, run extraction pipeline
   - Write `public/graph.json`
   - Log stats (node count, edge count, file size)
4. Add to `package.json`: `"build:graph": "npx tsx scripts/build-graph.ts"`
5. Add `getGraphData()` server action in `app/actions/files.ts`:
   - Read `public/graph.json`, return parsed `GraphData`
   - Fallback: compute on-the-fly if file missing (dev mode)

## Success Criteria

- [x] `react-force-graph-2d` installed and compiles
- [x] `lib/graph-extractor.ts` exports all extraction functions
- [x] `npm run build:graph` generates `public/graph.json`
- [x] `graph.json` contains ~485 nodes with categories and weighted edges
- [x] `getGraphData()` server action returns valid `GraphData`
- [x] Edge count is reasonable (500-2000 edges, not fully connected)

## Risk Assessment

- **Risk**: README parser fails on inconsistent table formats across categories. **Mitigation**: Use flexible regex, log unparsed rows, manual fallback for edge cases.
- **Risk**: Filename Jaccard produces too many/too few edges. **Mitigation**: Tune threshold (0.3-0.7) after seeing output; make it configurable.
