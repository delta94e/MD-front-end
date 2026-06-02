---
phase: 1
title: Research & Design
status: completed
priority: P2
effort: 1h
dependencies: []
---

# Phase 1: Research & Design

## Overview

Research text selection highlighting approaches in React/Markdown, design the data model, and define component interfaces.

## Requirements

- Functional: Define annotation data schema, highlight rendering strategy, component API
- Non-functional: Minimal performance impact on markdown rendering, stable positions across re-renders

## Architecture

### Data Model

```typescript
interface Annotation {
  id: string;                    // nanoid
  filePath: string;              // relative path (e.g., "docs/readme.md")
  startOffset: number;           // char offset in plain-text content
  endOffset: number;             // char offset in plain-text content
  selectedText: string;          // the highlighted text (for display/search)
  note: string;                  // user's annotation note (plain text)
  color: string;                 // highlight color (hex)
  createdAt: number;             // timestamp
  updatedAt: number;             // timestamp
}
```

### Highlight Strategy

Use a custom rehype plugin that:
1. Converts markdown to HTML (existing react-markdown pipeline)
2. Walks the AST, tracking character offsets in the plain-text representation
3. Wraps annotated ranges in `<mark>` elements with data attributes
4. Preserves existing formatting (code blocks, links, etc.)

Alternative considered: DOM Range API for selection, CSS highlights. Rejected because rehype-based approach integrates with existing react-markdown pipeline and doesn't require post-render DOM manipulation.

### Component Flow

```
MarkdownViewer
  ├── ReactMarkdown (with annotation rehype plugin)
  │     └── <mark data-annotation-id="...">highlighted text</mark>
  ├── AnnotationPopover (inline, positioned near selection)
  └── AnnotationPanel (sidebar or bottom panel)
```

## Related Code Files

- Read: `components/markdown-viewer.tsx` — current rendering pipeline
- Read: `lib/store.ts` — Zustand store patterns
- Read: `lib/content-cache.ts` — SQLite patterns to follow

## Implementation Steps

1. Research rehype plugin API for text offset tracking
2. Design SQLite schema for annotations table
3. Define TypeScript interfaces and store shape
4. Document the approach for phases 2-5

## Success Criteria

- [ ] Data model documented and reviewed
- [ ] Highlight rendering strategy validated (rehype plugin approach)
- [ ] Component interfaces defined

## Risk Assessment

- **Risk**: Character offsets may shift if document content changes
  - **Mitigation**: Store selectedText alongside offsets; use fuzzy matching as fallback
- **Risk**: Rehype plugin may conflict with existing rehypePrism
  - **Mitigation**: Run annotation plugin after prism, test with code blocks
