---
phase: 1
title: "Heading ID Generation"
status: pending
priority: P1
effort: "30min"
dependencies: []
---

# Phase 1: Heading ID Generation

## Overview

Install `rehype-slug` to auto-generate IDs for all heading levels (h1-h6), replacing the manual slugify approach that only covers h2/h3.

## Requirements

- Functional: All headings (h1-h6) get stable, slugified IDs
- Non-functional: IDs are URL-safe, deduplicated by rehype-slug

## Architecture

```
react-markdown
├── remark-gfm (existing)
├── rehype-prism-plus (existing)
├── rehype-raw (existing)
└── rehype-slug (NEW) → auto adds id="slugified-text" to all headings
```

## Related Code Files

- Modify: `components/markdown-viewer.tsx` — add rehype-slug plugin, remove manual slugify
- Modify: `package.json` — add rehype-slug dependency

## Implementation Steps

1. Install `rehype-slug`:
   ```bash
   npm install rehype-slug
   ```

2. Update `components/markdown-viewer.tsx`:
   - Import `rehypeSlug` from `rehype-slug`
   - Add to `rehypePlugins` array: `[rehypePrismPlus, rehypeSlug]`
   - Remove manual `slugify()` function
   - Remove manual `id` props from h2/h3 custom renderers
   - Keep custom renderers for styling only (no more manual IDs)

3. Verify headings get IDs:
   - h1 → `id="heading-text"`
   - h2 → `id="heading-text"`
   - h3 → `id="heading-text"`
   - Duplicate headings get `-1`, `-2` suffixes automatically

## Success Criteria

- [ ] `rehype-slug` installed
- [ ] All heading levels (h1-h6) have IDs in rendered HTML
- [ ] Manual `slugify()` function removed
- [ ] Existing code block styling unaffected
- [ ] TypeScript compiles clean

## Risk Assessment

- **Risk:** ID format changes break existing anchor links. **Mitigation:** rehype-slug uses same slug algorithm as manual implementation.
