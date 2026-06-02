---
phase: 1
title: "Typography Controls"
status: completed
priority: P2
effort: "3h"
dependencies: []
---

# Phase 1: Typography Controls

## Overview

Add a reading settings popover with sliders/selectors for font size, line height, font family, and reading width. Apply changes via CSS variables on the viewer container. Persist to localStorage.

## Requirements

- Functional: Font size slider (14-24px, default 15px)
- Functional: Line height slider (1.4-2.2, default 1.75)
- Functional: Font family selector (Geist Sans, Georgia, System Sans, Literata)
- Functional: Reading width selector (Narrow 540px, Default 672px, Wide 800px, Full)
- Functional: Reset to defaults button
- Non-functional: Settings persist in localStorage
- Non-functional: Smooth transitions (200ms ease)

## Architecture

```
ContentViewer (view mode)
├── Toolbar (existing)
│   └── [Aa] button → opens ReadingSettingsPopover
├── MarkdownViewer
│   └── div.reading-mode (style={--font-size, --line-height, --font-family, --max-width})
```

## Related Code Files

- Create: `components/reading-settings-popover.tsx`
- Modify: `components/content-viewer.tsx` (add settings button + apply reading styles)
- Modify: `components/markdown-viewer.tsx` (accept reading style props)
- Modify: `lib/store.ts` (add readingPreferences state)

## Implementation Steps

1. Add reading preferences to store:
   ```ts
   readingPreferences: { fontSize, lineHeight, fontFamily, maxWidth, lineFocus }
   setReadingPreferences: (prefs) => set({ readingPreferences: prefs })
   ```

2. Create `reading-settings-popover.tsx`:
   - Uses shadcn/ui `Popover` + `Slider` + `Select`
   - Font size: `Slider` 14-24, step 1
   - Line height: `Slider` 1.4-2.2, step 0.1
   - Font family: `Select` with 4 options
   - Reading width: `Select` with 4 presets
   - Reset button restores defaults
   - All changes update store immediately (no apply button)

3. Update `content-viewer.tsx`:
   - Add `[Aa]` button in toolbar (only in view mode)
   - Compute CSS variables from `readingPreferences`:
     ```css
     --reading-font-size: 15px;
     --reading-line-height: 1.75;
     --reading-font-family: var(--font-geist-sans);
     --reading-max-width: 672px;
     ```
   - Wrap MarkdownViewer container with these variables

4. Update `markdown-viewer.tsx`:
   - Apply CSS variables to `.markdown-content`:
     ```css
     font-size: var(--reading-font-size);
     line-height: var(--reading-line-height);
     font-family: var(--reading-font-family);
     max-width: var(--reading-max-width);
     ```
   - Ensure headings scale relative to body font size

5. Persist to localStorage:
   - On change: `localStorage.setItem('reading-preferences', JSON.stringify(prefs))`
   - On mount: `JSON.parse(localStorage.getItem('reading-preferences'))` or defaults

## Success Criteria

- [ ] [Aa] button visible in view mode toolbar
- [ ] Popover opens with 4 controls (font size, line height, font family, width)
- [ ] Font size changes viewer text size in real-time
- [ ] Line height changes viewer line spacing in real-time
- [ ] Font family switches between sans-serif options
- [ ] Reading width changes max-width of content
- [ ] Reset button restores all defaults
- [ ] Settings persist across page reloads (localStorage)
- [ ] Smooth CSS transitions on changes

## Risk Assessment

- **Prose classes conflict**: Tailwind `prose` plugin sets fixed typography. Mitigation: override with CSS variables using higher specificity or `!important` on key properties.
- **Heading scale**: If body font changes, headings should scale proportionally. Mitigation: use `em` units for headings relative to body.
