---
phase: 3
title: "Integration & Polish"
status: completed
priority: P3
effort: "1h"
dependencies: [1, 2]
---

# Phase 3: Integration & Polish

## Overview

Final integration, edge case handling, and documentation updates.

## Requirements

- Keyboard shortcut to toggle line focus (e.g., `Ctrl+Shift+F`)
- Reading settings button has active state when non-default settings
- Responsive: controls work on mobile (popover becomes bottom sheet)
- Update docs

## Related Code Files

- Modify: `components/content-viewer.tsx` (keyboard shortcut)
- Modify: `docs/design-guidelines.md` (add reading mode section)

## Implementation Steps

1. Add keyboard shortcut `Ctrl+Shift+F` to toggle line focus

2. Make [Aa] button show active state (dot indicator) when any setting differs from defaults

3. Test responsive behavior:
   - On mobile, reading settings popover should be full-width at bottom
   - Font size slider should be touch-friendly (larger thumb)

4. Update `docs/design-guidelines.md`:
   - Add section "Reading Mode" with control specifications
   - Document CSS variable names and defaults

## Success Criteria

- [ ] Ctrl+Shift+F toggles line focus
- [ ] [Aa] button shows indicator when custom settings active
- [ ] Mobile: popover usable at small screen widths
- [ ] `docs/design-guidelines.md` updated
- [ ] No regressions in existing view/edit modes
- [ ] `npm run build` passes
