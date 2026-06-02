---
phase: 2
title: "TOC Data Extraction"
status: pending
priority: P1
effort: "30min"
dependencies: [1]
---

# Phase 2: TOC Data Extraction

## Overview

Extract heading data from markdown content to build a structured TOC array. Parse markdown source to get heading text, level, and slug ID.

## Requirements

- Functional: Extract all headings with level (1-6), text, and slug ID
- Non-functional: Fast parsing, works on raw markdown string

## Architecture

```
markdown content (string)
    ↓
lib/toc-extractor.ts — parse markdown, extract headings
    ↓
TOCItem[] — { id, text, level }
    ↓
used by TOC panel component
```

## Related Code Files

- Create: `lib/toc-extractor.ts` — heading extraction utility

## Implementation Steps

1. Create `lib/toc-extractor.ts`:
   - Export `TOCItem` interface: `{ id: string; text: string; level: number }`
   - Export `extractHeadings(markdown: string): TOCItem[]`
   - Parse markdown with regex: `/^(#{1,6})\s+(.+)$/gm`
   - Generate slug from heading text (same algorithm as rehype-slug)
   - Return sorted array of headings

2. Slug function:
   - Lowercase
   - Replace spaces with `-`
   - Remove special chars (keep alphanumeric, hyphens)
   - Handle Vietnamese diacritics (optional: strip or transliterate)

3. Edge cases:
   - Skip headings inside code blocks (``` fenced blocks)
   - Handle inline markdown in headings (`**bold**`, `*italic*`, `` `code` ``)
   - Strip markdown formatting from heading text for display

## Success Criteria

- [ ] `extractHeadings()` returns correct TOC for test markdown
- [ ] Headings inside code blocks are excluded
- [ ] Inline formatting stripped from display text
- [ ] Slugs match rehype-slug output IDs
- [ ] TypeScript compiles clean

## Risk Assessment

- **Risk:** Regex misses edge cases. **Mitigation:** Test with real markdown files from the knowledge base.
