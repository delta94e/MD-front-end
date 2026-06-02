---
phase: 4
title: Annotation Panel
status: completed
priority: P2
effort: 2h
dependencies:
  - 2
---

# Phase 4: Annotation Panel

## Overview

Build an annotation panel that lists all annotations for the current file with click-to-navigate, edit, and delete functionality.

## Requirements

- Functional: List annotations, click to scroll, edit note, delete annotation
- Non-functional: Sorted by position in document, responsive layout

## Architecture

```
components/annotation-panel.tsx
  ├── List of annotations for active file
  │     ├── Selected text preview
  │     ├── Note content
  │     ├── Color indicator
  │     └── Edit/Delete actions
  ├── Click → scroll to annotation in viewer
  └── Empty state when no annotations
```

## Related Code Files

- Create: `components/annotation-panel.tsx`
- Modify: `components/markdown-viewer.tsx` — add scroll-to logic

## Implementation Steps

1. Create `components/annotation-panel.tsx`
   - Read annotations from store (filtered by activeFile)
   - Render list with: color dot, selected text (truncated), note preview
   - Click handler → scroll to annotation position in viewer
   - Edit button → inline edit of note
   - Delete button → confirmation → remove
   - Empty state with annotation icon and prompt

2. Add scroll-to-annotation in `markdown-viewer.tsx`
   - `data-annotation-id` attribute on `<mark>` elements (from phase 3)
   - `scrollIntoView({ behavior: "smooth", block: "center" })` on click
   - Brief flash animation on the target highlight

3. Wire into AI panel or as a tab
   - Add "Notes" tab to AI panel (7th tab) OR
   - Add as a collapsible section below the viewer
   - Preference: new tab in AI panel for consistency

## Success Criteria

- [ ] Panel shows all annotations for current file
- [ ] Click annotation → scrolls to highlight in viewer
- [ ] Can edit and delete annotations from panel
- [ ] Empty state shown when no annotations
- [ ] Panel updates when switching files

## Risk Assessment

- **Risk**: Panel clutter with many annotations
  - **Mitigation**: Collapse long notes, show only first line by default
