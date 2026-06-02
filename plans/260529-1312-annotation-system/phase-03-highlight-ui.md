---
phase: 3
title: Highlight UI
status: completed
priority: P2
effort: 3h
dependencies:
  - 2
---

# Phase 3: Highlight UI

## Overview

Implement text highlighting in the markdown viewer via a custom rehype plugin, and the inline annotation popover for creating annotations.

## Requirements

- Functional: Highlighted text visible in viewer, popover for creating annotation with color + note
- Non-functional: No re-render flicker, accessible color contrast

## Architecture

```
rehype-annotate.ts (rehype plugin)
  ├── Receives annotations array as plugin options
  ├── Walks HTML AST, tracks plain-text offsets
  ├── Wraps annotated ranges in <mark> with data-annotation-id
  └── Preserves existing element structure

components/markdown-viewer.tsx (modifications)
  ├── Pass annotations to rehype plugin
  ├── Handle text selection → show AnnotationPopover
  └── Handle click on <mark> → open annotation in panel

components/annotation-popover.tsx
  ├── Positioned near selection (using selection coordinates)
  ├── Color picker (5-6 preset colors)
  ├── Note textarea
  └── Save/Cancel buttons
```

## Related Code Files

- Create: `lib/rehype-annotate.ts`
- Create: `components/annotation-popover.tsx`
- Modify: `components/markdown-viewer.tsx`

## Implementation Steps

1. Create `lib/rehype-annotate.ts`
   - Rehype plugin that accepts `annotations: Annotation[]`
   - Walk AST nodes, track cumulative text length
   - For each annotation, find nodes that overlap the offset range
   - Split text nodes and wrap annotated portions in `<mark>` elements
   - Set `data-annotation-id` attribute for click handling

2. Create `components/annotation-popover.tsx`
   - Position using `getBoundingClientRect()` from selection
   - Color picker: yellow, green, blue, pink, orange presets
   - Note textarea (auto-focus)
   - Save button → calls `addAnnotation` from store
   - Cancel button / click outside → close

3. Modify `components/markdown-viewer.tsx`
   - Import and pass rehype-annotate plugin with annotations from store
   - Add `onMouseUp` handler to detect text selection
   - Show AnnotationPopover when text is selected
   - Add `onClick` handler for `<mark>` elements to navigate to annotation

## Success Criteria

- [ ] Selected text highlighted with chosen color in rendered output
- [ ] Popover appears near selection with color picker and note input
- [ ] Saving creates annotation in DB and updates display
- [ ] Clicking a highlight opens annotation details
- [ ] Existing code block copy button still works

## Risk Assessment

- **Risk**: Rehype plugin may break existing code highlighting
  - **Mitigation**: Run annotation plugin after rehypePrism, skip `<pre>` and `<code>` blocks
- **Risk**: Text offset mismatch after document edits
  - **Mitigation**: Store selectedText for fuzzy fallback; invalidate annotations on major edits
