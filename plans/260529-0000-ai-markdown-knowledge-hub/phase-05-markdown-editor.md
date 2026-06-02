---
phase: 5
title: "Markdown Editor"
status: completed
priority: P2
effort: "3h"
dependencies: [4]
---

# Phase 5: Markdown Editor

## Overview

Implement the markdown editor using CodeMirror 6 with split-pane layout (allotment), live preview, save functionality, and toggle between view-only and edit mode.

## Requirements

- Functional: Edit markdown text, live preview updates, save to filesystem, toggle view/edit mode
- Non-functional: CodeMirror handles large files, debounced preview (300ms), Ctrl+S save

## Architecture

```
Content Area (when editorMode === 'edit')
├── Editor toolbar — Save, mode toggle, word count
└── Allotment split pane
    ├── Left: CodeMirror 6 editor
    │   ├── @codemirror/lang-markdown
    │   ├── @codemirror/theme-one-dark (dark mode)
    │   └── Custom keymaps (Ctrl+S, Tab for indent)
    └── Right: Live preview (react-markdown)
        └── Same components as MarkdownViewer
```

## Related Code Files

- Create: `components/markdown-editor.tsx` (CodeMirror wrapper)
- Create: `components/editor-toolbar.tsx` (save, toggle, word count)
- Create: `components/split-pane-editor.tsx` (allotment with editor + preview)
- Modify: `components/action-bar.tsx` (wire Edit button to toggle mode)
- Modify: `app/[category]/[slug]/page.tsx` (conditional render viewer vs editor)

## Implementation Steps

1. Create `components/markdown-editor.tsx`:
   - Wrap `@uiw/react-codemirror` with markdown language support
   - Extensions: `markdown()`, `oneDark` (conditional on theme), `lineNumbers()`, `highlightActiveLine()`
   - Theme toggle: use `Compartment` to swap between light/dark themes
   - Value: from Zustand `editorContent`
   - onChange: update Zustand `editorContent`
   - Height: 100% of container

2. Create `components/editor-toolbar.tsx`:
   - Save button (Ctrl+S shortcut): calls `saveFileContent` server action
   - Mode toggle: View ↔ Edit (updates Zustand `editorMode`)
   - Word count: display current document word count
   - Save indicator: dot next to filename when unsaved changes
   - Position: top bar above split pane

3. Create `components/split-pane-editor.tsx`:
   - Use `allotment` for split pane (50/50 default, draggable)
   - Left: MarkdownEditor (CodeMirror)
   - Right: live MarkdownViewer preview (same component from Phase 4)
   - Debounce preview update: 300ms after typing stops
   - Min pane width: 300px each

4. Wire up save functionality:
   - `Ctrl+S` → prevent default, call `saveFileContent(path, content)`
   - Show success toast/feedback on save
   - Show error toast on save failure
   - Clear unsaved indicator after save

5. Wire up mode toggle:
   - Edit button in action bar → sets `editorMode: 'edit'` in Zustand
   - Back button in editor toolbar → sets `editorMode: 'view'`
   - When switching to edit: load current file content into editor
   - When switching to view: discard unsaved changes (confirm dialog if dirty)

6. Update document page to support both modes:
   - Read `editorMode` from Zustand
   - If 'view': render MarkdownViewer (Phase 4)
   - If 'edit': render SplitPaneEditor
   - Smooth transition between modes

7. Add CodeMirror keyboard shortcuts:
   - `Ctrl+S` → save
   - `Ctrl+B` → bold (wrap with `**`)
   - `Ctrl+I` → italic (wrap with `*`)
   - `Ctrl+K` → insert link
   - `Tab` → indent, `Shift+Tab` → outdent

8. Handle unsaved changes:
   - Track dirty state (content changed since last save/load)
   - Warn on file switch if dirty (confirm dialog)
   - Warn on browser close if dirty (`beforeunload` event)

9. Dynamic import CodeMirror:
   - Use `next/dynamic` with `ssr: false` for CodeMirror component
   - Show skeleton while loading

10. Run `npm run build` to verify

## Success Criteria

- [ ] Editor renders with markdown syntax highlighting
- [ ] Split pane: editor left, preview right, draggable divider
- [ ] Live preview updates while typing (debounced 300ms)
- [ ] Ctrl+S saves file to filesystem
- [ ] Mode toggle switches between view and edit
- [ ] Dark/light theme applies to editor
- [ ] Large files (>5000 lines) edit smoothly
- [ ] Unsaved changes warning on file switch

## Risk Assessment

- **Risk:** allotment SSR hydration mismatch. **Mitigation:** Dynamic import with `ssr: false`.
- **Risk:** CodeMirror bundle size (~100KB). **Mitigation:** Dynamic import, only loads when editor is opened.
- **Risk:** Preview re-render on every keystroke causes jank. **Mitigation:** Debounce 300ms, use React.memo on preview.

## Security Considerations

- **File write:** Validate path is within CONTENT_DIR before saving.
- **Content validation:** Ensure content is valid UTF-8 before writing.
