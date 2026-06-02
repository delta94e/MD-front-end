---
phase: 5
title: Integration & Polish
status: completed
priority: P2
effort: 2h
dependencies:
  - 3
  - 4
---

# Phase 5: Integration & Polish

## Overview

Integrate annotation system end-to-end, add keyboard shortcuts, handle edge cases, and polish the UX.

## Requirements

- Functional: Full annotation workflow works seamlessly
- Non-functional: Keyboard accessible, handles edge cases

## Architecture

```
Integration points:
  ├── Keyboard shortcut: "a" to annotate selected text
  ├── Selection toolbar: add "Annotate" button alongside "Explain"
  ├── File switching: load annotations for new file
  ├── Export: annotations included in AI output saves
  └── Edge cases: empty selection, overlapping annotations, very long text
```

## Related Code Files

- Modify: `components/selection-toolbar.tsx` — add Annotate button
- Modify: `components/markdown-viewer.tsx` — keyboard shortcut
- Modify: `lib/ai-output-saver.ts` — include annotations in exports

## Implementation Steps

1. Add "Annotate" to selection toolbar
   - New button with Highlighter icon
   - Opens annotation popover (same as phase 3)
   - Works alongside existing Explain button

2. Keyboard shortcuts
   - `a` key when text selected → open annotation popover
   - `Escape` → close popover
   - Document in keyboard help dialog

3. File switching integration
   - Load annotations when `activeFile` changes
   - Clear annotations on unload
   - Debounce if user switches files rapidly

4. Edge cases
   - Empty selection → disable annotate button
   - Very long selection (>500 chars) → truncate in popover preview
   - Overlapping annotations → merge display or show both with different opacities
   - Deleted file → clean up orphaned annotations

5. Polish
   - Highlight animation on annotation creation
   - Smooth scroll to annotation from panel
   - Tooltip showing note preview on hover over highlight
   - Responsive: panel works on narrow screens

## Success Criteria

- [ ] Annotate button in selection toolbar works
- [ ] Keyboard shortcut "a" opens annotation popover
- [ ] Annotations load correctly when switching files
- [ ] Edge cases handled gracefully
- [ ] No performance regression in markdown rendering

## Risk Assessment

- **Risk**: Keyboard shortcut conflicts with text input
  - **Mitigation**: Only trigger when no input/textarea is focused
