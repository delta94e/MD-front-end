# Phase 1: Concept Extractor

**Status:** completed

## Overview
Build a function that parses markdown content and extracts concept nodes (from headings) and edges (from internal links).

## Related Code Files
- Create: `lib/concept-map-extractor.ts`
- Read: `lib/toc-extractor.ts` (reuse `extractHeadings`, `slugify`)
- Read: `lib/graph-extractor.ts` (reuse `GraphNode`, `GraphEdge`, `GraphData` types)

## Implementation Steps

1. Create `lib/concept-map-extractor.ts`
   - Define `ConceptNode` interface: `{ id, label, level, line }` (level = heading depth 1-6)
   - Define `ConceptEdge` interface: `{ source, target, label }` (label = link text)
   - Main function: `extractConceptMap(markdown: string): { nodes, edges }`

2. Node extraction logic:
   - Parse headings using regex: `/^(#{1,6})\s+(.+)$/gm`
   - Skip headings inside fenced code blocks (``` ... ```)
   - Use `slugify()` from `toc-extractor.ts` for node IDs
   - Node size based on heading level: h1=8, h2=5, h3=3

3. Edge extraction logic:
   - Parse internal links: `/\[([^\]]+)\]\(([^)]+)\)/g`
   - Only keep links to `.md` files or anchor links (`#section`)
   - For anchor links, map to existing node IDs
   - For file links, create edge from current heading context to target

4. Handle edge cases:
   - Empty markdown → empty graph
   - No headings → empty graph
   - Duplicate heading IDs → append `-1`, `-2` suffix (reuse toc-extractor pattern)

## Success Criteria
- [ ] `extractConceptMap()` returns valid nodes and edges
- [ ] Headings become nodes with correct level
- [ ] Internal links become edges
- [ ] Code block headings are skipped
- [ ] Handles empty/malformed input gracefully
