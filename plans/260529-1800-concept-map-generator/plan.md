# Concept Map Generator

## Overview
Auto-generate a concept-level mind map from markdown content. Nodes = headings (concepts), edges = internal links between files. Different from existing Knowledge Graph (file-level nodes).

## Phases

| # | Phase | Status | Progress |
|---|-------|--------|----------|
| 1 | Concept Extractor | completed | 100% |
| 2 | Concept Map Component | completed | 100% |
| 3 | UI Integration | completed | 100% |

## Key Decisions
- **Nodes**: Each heading (h1-h3) becomes a concept node
- **Edges**: Internal links `[text](./path.md)` create edges between concepts
- **Hierarchy**: Heading levels define node size (h1 > h2 > h3)
- **Visualization**: Reuse `react-force-graph-2d` (same as Knowledge Graph)
- **Scope**: Single-file concept map (not cross-file) — shows structure within one markdown file

## Dependencies
- Existing: `lib/toc-extractor.ts` (heading extraction, slugify)
- Existing: `components/knowledge-graph.tsx` (graph rendering pattern)
- Existing: `lib/graph-extractor.ts` (GraphData types, color utilities)
