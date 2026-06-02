---
phase: 2
title: "Line Focus Dimming"
status: completed
priority: P2
effort: "2h"
dependencies: [1]
---

# Phase 2: Line Focus Dimming

## Overview

Add line focus dimming to the reading mode — when hovering over a paragraph, it highlights while siblings dim. Uses pure CSS for performance.

## Requirements

- Functional: Hovered paragraph/block gets full opacity
- Functional: Sibling blocks dim to 40% opacity
- Functional: Smooth opacity transitions (150ms)
- Functional: Toggle on/off via reading settings
- Non-functional: Pure CSS, no JavaScript scroll tracking
- Non-functional: Only applies to prose content (not code blocks, not UI)

## Architecture

```css
/* CSS-only line focus */
.reading-focus .markdown-content > * {
  opacity: 0.4;
  transition: opacity 150ms ease;
}
.reading-focus .markdown-content > *:hover {
  opacity: 1;
}
.reading-focus .markdown-content > *:hover ~ * {
  opacity: 0.4; /* siblings after */
}
/* Keep code blocks at full opacity */
.reading-focus .markdown-content pre {
  opacity: 1 !important;
}
```

## Related Code Files

- Create: `styles/reading-mode.css` (CSS for focus dimming)
- Modify: `components/content-viewer.tsx` (toggle class)
- Modify: `lib/store.ts` (add lineFocus boolean to preferences)

## Implementation Steps

1. Create `styles/reading-mode.css`:
   ```css
   .reading-focus .markdown-content > :not(pre):not(.annotation-highlight) {
     opacity: 0.4;
     transition: opacity 150ms ease;
   }
   .reading-focus .markdown-content > :not(pre):not(.annotation-highlight):hover {
     opacity: 1;
   }
   /* Keep headings at slightly higher opacity */
   .reading-focus .markdown-content > h1,
   .reading-focus .markdown-content > h2,
   .reading-focus .markdown-content > h3 {
     opacity: 0.6;
   }
   .reading-focus .markdown-content > h1:hover,
   .reading-focus .markdown-content > h2:hover,
   .reading-focus .markdown-content > h3:hover {
     opacity: 1;
   }
   ```

2. Import CSS in `globals.css` or `content-viewer.tsx`

3. Add `lineFocus: boolean` to reading preferences in store

4. Update `reading-settings-popover.tsx`:
   - Add toggle switch for "Line Focus"
   - Default: off

5. Update `content-viewer.tsx`:
   - Conditionally add `reading-focus` class to viewer container
   - Class toggles based on `readingPreferences.lineFocus`

## Success Criteria

- [ ] Hovering a paragraph dims siblings to 40% opacity
- [ ] Hovered block stays at full opacity
- [ ] Code blocks always stay at full opacity
- [ ] Headings have slightly higher base opacity (60%)
- [ ] Smooth transitions (150ms)
- [ ] Toggle works from reading settings
- [ ] State persists in localStorage

## Risk Assessment

- **Nested elements**: `:hover` on child elements may trigger parent opacity changes. Mitigation: use direct child selector `> *` only.
- **Annotation highlights**: Annotation spans inside paragraphs should not break dimming. Mitigation: `.annotation-highlight` inherits parent opacity.
