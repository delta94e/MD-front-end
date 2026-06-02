---
phase: 4
title: "Scroll Spy"
status: pending
priority: P1
effort: "45min"
dependencies: [3]
---

# Phase 4: Scroll Spy

## Overview

Implement IntersectionObserver-based scroll spy that highlights the currently visible heading in the TOC panel as the user scrolls through the document.

## Requirements

- Functional: Highlight active heading in TOC as user scrolls
- Non-functional: Performant (no scroll event spam), smooth transitions

## Architecture

```
Content scroll container
    ↓ (observes heading elements)
IntersectionObserver
    ↓ (reports visible heading)
activeId state
    ↓
TOC Panel highlights matching item
```

## Related Code Files

- Create: `hooks/use-scroll-spy.ts` — IntersectionObserver hook
- Modify: `components/toc-panel.tsx` — accept and display activeId
- Modify: `components/content-viewer.tsx` — wire up scroll spy

## Implementation Steps

1. Create `hooks/use-scroll-spy.ts`:
   - Export `useScrollSpy(containerRef, headingIds: string[]): string | null`
   - Create IntersectionObserver watching all heading elements
   - Use `rootMargin: '-80px 0px -80% 0px'` (trigger when heading is near top)
   - Return the ID of the currently visible heading
   - Disconnect observer on unmount

2. Wire up in `content-viewer.tsx`:
   - Get heading IDs from `extractHeadings()` result
   - Pass container ref (the scrollable div) to `useScrollSpy`
   - Pass `activeId` to `TOCPanel`

3. Update `toc-panel.tsx`:
   - Highlight active item: `text-foreground font-medium` vs `text-muted-foreground`
   - Add subtle left border or background highlight on active item
   - Auto-scroll TOC panel to keep active item visible

4. Performance considerations:
   - Observer uses `threshold: 0` (fire once when entering/leaving)
   - Debounce state updates if needed
   - Re-observe when content changes (file switch)

## Success Criteria

- [ ] Active heading highlighted in TOC while scrolling
- [ ] Highlight updates smoothly (no flicker)
- [ ] TOC auto-scrolls to keep active item visible
- [ ] Observer disconnects on unmount (no memory leaks)
- [ ] Works correctly on file switch
- [ ] TypeScript compiles clean

## Risk Assessment

- **Risk:** Scroll spy fires too often causing jank. **Mitigation:** Use IntersectionObserver (not scroll events), which is inherently efficient.
- **Risk:** Multiple headings visible at once. **Mitigation:** Use rootMargin to narrow the trigger zone to top portion of viewport.
