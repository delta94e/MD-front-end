---
phase: 3
title: "TOC Panel Component"
status: pending
priority: P1
effort: "1h"
dependencies: [2]
---

# Phase 3: TOC Panel Component

## Overview

Create a TOC panel component that displays the heading outline for the current file. Clickable items scroll to the heading position. Integrated into the content area layout.

## Requirements

- Functional: Show heading outline, click to scroll, highlight active section
- Non-functional: Smooth scroll, compact design, collapsible nested items

## Architecture

```
content-viewer.tsx
├── Toolbar (existing)
├── TOC Panel (NEW) — fixed right side or top of content
│   ├── Heading list (indented by level)
│   └── Click → scrollIntoView
└── Content (existing markdown viewer)
```

## Related Code Files

- Create: `components/toc-panel.tsx` — TOC display component
- Modify: `components/content-viewer.tsx` — integrate TOC panel
- Modify: `lib/store.ts` — add `tocOpen` state (optional)

## Implementation Steps

1. Create `components/toc-panel.tsx`:
   - Props: `items: TOCItem[]`, `activeId: string | null`, `onItemClick: (id: string) => void`
   - Render heading list with indentation based on level
   - Style: text-xs, muted color, active item highlighted
   - Click handler: `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })`
   - Max height with overflow-y-auto

2. Integrate into `content-viewer.tsx`:
   - Call `extractHeadings(editorContent)` when content changes
   - Render TOC panel in view mode only (not edit mode)
   - Position: right side of content area, or as a floating panel
   - Hide when no headings found

3. Layout options (choose one):
   - **Option A:** Right sidebar inside content area (200px wide)
   - **Option B:** Floating panel, top-right corner
   - **Option C:** Collapsible panel above content

   Recommended: Option A — consistent with sidebar pattern

4. Responsive behavior:
   - Hide TOC on small screens (< 1024px)
   - Show toggle button to collapse/expand

## Success Criteria

- [ ] TOC panel renders heading outline
- [ ] Click heading scrolls to that section
- [ ] Only visible in view mode
- [ ] Indentation reflects heading levels
- [ ] Empty state when no headings
- [ ] TypeScript compiles clean

## Risk Assessment

- **Risk:** TOC takes too much horizontal space. **Mitigation:** Make it collapsible, default collapsed on narrow screens.
