---
phase: 5
title: "Bidirectional Sync"
status: completed
priority: P1
effort: "2h"
dependencies: [2, 4]
---

# Phase 5: Bidirectional Sync

## Overview

Ensure robust bidirectional content sync between Lexical WYSIWYG and markdown string. The markdown string is the source of truth; Lexical is a rich view layer.

## Requirements

- Functional: Lexical → Markdown conversion via `$convertToMarkdownString(TRANSFORMERS)`
- Functional: Markdown → Lexical conversion via `$convertFromMarkdownString(md, TRANSFORMERS)`
- Functional: Debounced sync (300ms) to avoid excessive re-renders
- Non-functional: Handle edge cases (nested lists, code blocks with language, tables, images)

## Architecture

```
Content Flow:
  WYSIWYG edit → OnChangePlugin → debounced $convertToMarkdownString → store.editorContent
  Source edit → CodeMirror onChange → debounced $convertFromMarkdownString → Lexical state
  Mode switch → immediate full sync (no debounce)
```

## Related Code Files

- Create: `components/editor/editor-sync.ts` (sync logic, debounced converters)
- Modify: `components/editor/lexical-editor.tsx` (use sync module)
- Modify: `components/editor/markdown-source.tsx` (use sync module)
- Modify: `components/content-viewer.tsx` (orchestrate sync)

## Implementation Steps

1. Create `editor-sync.ts`:
   - `debouncedMarkdownToLexical(md: string, editor: LexicalEditor)`: 300ms debounce, calls `editor.update(() => $convertFromMarkdownString(md, TRANSFORMERS))`
   - `debouncedLexicalToMarkdown(editor: LexicalEditor, callback: (md: string) => void)`: 300ms debounce, reads editor state and converts
   - `immediateSync(direction: 'md-to-lexical' | 'lexical-to-md')`: for mode switches, no debounce

2. Wire up LexicalEditor:
   - `OnChangePlugin` → call `debouncedLexicalToMarkdown` → update `store.editorContent`
   - On mount / content change from store → call `debouncedMarkdownToLexical`

3. Wire up MarkdownSource:
   - CodeMirror `onChange` → update `store.editorContent` directly (already works)
   - On mode switch to source → content is already in sync (markdown string is truth)

4. Handle edge cases:
   - Tables: Lexical doesn't natively support GFM tables. Option A: use `@lexical/table` plugin. Option B: preserve tables as HTML/code blocks. Prefer Option A if time allows, fall back to B.
   - Images: Lexical handles images via `@lexical/markdown` IMAGE transformer
   - Nested lists: Test deeply nested bullet/numbered lists
   - Code blocks with language: Ensure ````js` → code node with language attribute

5. Test round-trip fidelity:
   - Load each of the 5 main markdown content types (plain text, headings, lists, code, links)
   - Edit in WYSIWYG → switch to Source → verify markdown
   - Edit in Source → switch to WYSIWYG → verify rich text

## Success Criteria

- [ ] Typing in WYSIWYG updates markdown string in store (debounced 300ms)
- [ ] Editing markdown in source mode updates Lexical on switch (immediate)
- [ ] Round-trip preserves: headings, bold/italic, lists (nested), code blocks (with lang), links, blockquotes
- [ ] No content loss on repeated mode switches
- [ ] Tables handled gracefully (either as rich table or preserved as markdown)

## Risk Assessment

- **Transformer gaps**: `@lexical/markdown` TRANSFORMERS may not cover all GFM features (tables, task lists). Mitigation: extend TRANSFORMERS array with custom transformers for missing features, or use `@lexical/table`.
- **Race conditions**: Debounced sync could cause conflicts if user switches modes rapidly. Mitigation: cancel pending debounces on mode switch, use immediate sync.
