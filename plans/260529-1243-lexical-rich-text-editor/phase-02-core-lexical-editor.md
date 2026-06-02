---
phase: 2
title: "Core Lexical Editor"
status: completed
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Core Lexical Editor

## Overview

Build the core Lexical editor component with rich text support, markdown shortcuts, and proper theming. Replace CodeMirror as the primary edit-mode editor.

## Requirements

- Functional: Rich text editing (headings, bold, italic, lists, code, links, blockquotes)
- Functional: Inline markdown shortcuts (type `**text**` → bold, `# ` → heading, etc.)
- Functional: Load markdown content into editor, export back to markdown
- Non-functional: SSR-safe (dynamic import), matches design guidelines

## Architecture

```
ContentViewer (edit mode)
├── EditorToolbar (formatting buttons)
└── LexicalEditor
    ├── LexicalComposer (config + theme)
    ├── RichTextPlugin (contentEditable)
    ├── HistoryPlugin (undo/redo)
    ├── MarkdownShortcutPlugin (inline md → rich)
    ├── ListPlugin (bullet/numbered lists)
    ├── LinkPlugin (clickable links)
    └── OnChangePlugin (sync to store)
```

## Related Code Files

- Create: `components/editor/lexical-editor.tsx`
- Create: `components/editor/editor-theme.ts`
- Modify: `components/content-viewer.tsx` (swap CodeMirror for Lexical in edit mode)
- Modify: `components/markdown-editor.tsx` (deprecate or wrap)

## Implementation Steps

1. Build `editor-theme.ts`:
   - Map `h1`-`h6` to Tailwind classes from `design-guidelines.md` (h1: 24px/700, h2: 20px/600, h3: 17px/600)
   - Map `quote` to left-border accent + italic + text-secondary
   - Map `code` to JetBrains Mono + bg-active
   - Map `link` to accent-primary + underline
   - Map `list` with proper indent (24px)
   - Map `text` to body: 15px, line-height 1.75

2. Build `lexical-editor.tsx`:
   - `LexicalComposer` with namespace `"md-knowledge-hub"`, theme from step 1
   - `RichTextPlugin` with `ContentEditable` styled to match markdown viewer typography
   - `HistoryPlugin` for undo/redo
   - `MarkdownShortcutPlugin` with `TRANSFORMERS` from `@lexical/markdown`
   - `ListPlugin` for bullet/numbered lists
   - `LinkPlugin` for auto-linking URLs
   - `OnChangePlugin` to call `setEditorContent` with `$convertToMarkdownString(TRANSFORMERS)`
   - Initial config: load content via `$convertFromMarkdownString(editorContent, TRANSFORMERS)` in a `useEffect`

3. Update `content-viewer.tsx`:
   - In edit mode, replace `MarkdownEditor` (CodeMirror) with `LexicalEditor`
   - Keep split-pane: left = LexicalEditor, right = MarkdownViewer (live preview)
   - Pass `editorContent` and `handleEditorChange` as props

4. Test with various markdown files (headings, lists, code blocks, links, images)

## Success Criteria

- [ ] Lexical editor renders with proper typography matching `design-guidelines.md`
- [ ] Markdown shortcuts work (type `# ` → h1, `**text**` → bold, `- ` → bullet list)
- [ ] Content loads from markdown string and exports back to markdown
- [ ] Live preview (right pane) updates as user types
- [ ] Undo/redo works (Ctrl+Z / Ctrl+Shift+Z)
- [ ] No SSR errors (dynamic import)

## Risk Assessment

- **Markdown round-trip fidelity**: Some Lexical nodes may not perfectly convert to/from markdown. Mitigation: test with real content from the 485+ files, handle edge cases.
- **Large file performance**: Lexical may be slower than CodeMirror for very large files. Mitigation: add debounced onChange (300ms).
