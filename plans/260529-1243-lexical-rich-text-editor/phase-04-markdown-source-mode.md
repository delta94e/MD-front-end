---
phase: 4
title: "Markdown Source Mode"
status: completed
priority: P2
effort: "2h"
dependencies: [2]
---

# Phase 4: Markdown Source Mode

## Overview

Add a raw markdown source editing mode using CodeMirror (existing). User can toggle between WYSIWYG and source mode via toolbar button.

## Requirements

- Functional: Toggle between WYSIWYG (Lexical) and Source (CodeMirror) modes
- Functional: Source mode shows raw markdown with syntax highlighting
- Functional: Changes in source mode reflect in WYSIWYG when switching back
- Non-functional: Smooth transition between modes, no content loss

## Architecture

```
Edit Mode Layout
├── EditorToolbar (with WYSIWYG/Source toggle)
├── [WYSIWYG mode] LexicalEditor
└── [Source mode] MarkdownSource (CodeMirror)
    └── same value/onChange interface as before
```

## Related Code Files

- Create: `components/editor/markdown-source.tsx` (thin wrapper around existing CodeMirror)
- Modify: `components/editor/editor-toolbar.tsx` (add mode toggle)
- Modify: `components/content-viewer.tsx` (switch between Lexical and CodeMirror based on sub-mode)
- Modify: `lib/store.ts` (add `editorSubMode: "wysiwyg" | "source"`)

## Implementation Steps

1. Update `lib/store.ts`:
   - Add `editorSubMode: "wysiwyg" | "source"` with default `"wysiwyg"`
   - Add `setEditorSubMode` action

2. Create `markdown-source.tsx`:
   - Wrap existing `@uiw/react-codemirror` with same props interface
   - Keep markdown language support, line numbers, dark theme
   - Style to fill the editor area (no split pane in source mode)

3. Update `editor-toolbar.tsx`:
   - Add toggle button group: WYSIWYG icon | Source icon
   - Use `Code2` icon for source, `Eye` icon for WYSIWYG
   - Toggle calls `setEditorSubMode`

4. Update `content-viewer.tsx`:
   - In edit mode, check `editorSubMode`:
     - `"wysiwyg"`: show LexicalEditor (full width, no split)
     - `"source"`: show MarkdownSource (full width, no split)
   - Remove old split-pane layout (preview is now built into WYSIWYG)
   - Or keep split pane only in WYSIWYG mode if user wants side-by-side preview

5. Test switching between modes:
   - Edit in WYSIWYG → switch to Source → verify markdown is correct
   - Edit in Source → switch to WYSIWYG → verify rich text is correct

## Success Criteria

- [ ] Toggle button in toolbar switches between WYSIWYG and Source modes
- [ ] Source mode shows raw markdown with syntax highlighting (CodeMirror)
- [ ] WYSIWYG mode shows rich text editor (Lexical)
- [ ] Content persists when switching modes (no data loss)
- [ ] Edits in source mode reflect in WYSIWYG after switch
- [ ] Edits in WYSIWYG reflect in source after switch

## Risk Assessment

- **Content loss on switch**: If markdown → Lexical conversion fails for complex markdown, content could be lost. Mitigation: always keep the markdown string as source of truth, Lexical is a view layer.
- **Performance**: Re-initializing Lexical on every mode switch could be slow. Mitigation: keep both mounted but hidden, or use a state flag to minimize re-renders.
