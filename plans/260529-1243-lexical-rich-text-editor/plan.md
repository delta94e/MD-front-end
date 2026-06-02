---
title: "Lexical Rich Text Editor with Toolbar & Dual Mode"
description: "Replace CodeMirror with Lexical (Meta) for rich text editing. Add formatting toolbar (bold, italic, headings, lists, code, links, blockquotes). Support 2 modes: WYSIWYG preview and raw markdown source, with bidirectional sync."
status: pending
priority: P1
branch: "main"
tags: [lexical, editor, rich-text, markdown, toolbar]
blockedBy: []
blocks: []
created: "2026-05-29T06:11:17.809Z"
createdBy: "ck:plan"
source: skill
---

# Lexical Rich Text Editor with Toolbar & Dual Mode

## Overview

Replace the current CodeMirror-based markdown editor with Lexical (Meta's editor framework) to provide a WYSIWYG rich text editing experience. Add a formatting toolbar for common text operations. Support dual modes: WYSIWYG (preview) and raw markdown source, with bidirectional content sync between them.

## Tech Stack

- **Editor**: `lexical` + `@lexical/react` + `@lexical/markdown` + `@lexical/rich-text` + `@lexical/list` + `@lexical/code` + `@lexical/link` + `@lexical/utils`
- **Source mode**: `@uiw/react-codemirror` + `@codemirror/lang-markdown` (keep existing)
- **UI**: Existing shadcn/ui components + lucide-react icons
- **State**: Existing Zustand store (add `editorSubMode: "wysiwyg" | "source"`)

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Research & Setup](./phase-01-research-setup.md) | Pending | 1h |
| 2 | [Core Lexical Editor](./phase-02-core-lexical-editor.md) | Pending | 3h |
| 3 | [Formatting Toolbar](./phase-03-formatting-toolbar.md) | Pending | 3h |
| 4 | [Markdown Source Mode](./phase-04-markdown-source-mode.md) | Pending | 2h |
| 5 | [Bidirectional Sync](./phase-05-bidirectional-sync.md) | Pending | 2h |
| 6 | [Integration & Polish](./phase-06-integration-polish.md) | Pending | 2h |

## Dependencies

- Phase 2 depends on Phase 1 (packages installed)
- Phase 3 depends on Phase 2 (editor working)
- Phase 4 depends on Phase 2 (editor working)
- Phase 5 depends on Phases 2+4 (both modes exist)
- Phase 6 depends on all previous phases

## Key Decisions

1. **Dual-pane in edit mode**: Left = Lexical WYSIWYG, Right = CodeMirror markdown source (toggle between them)
2. **Keep CodeMirror for source mode**: Proven to work, no reason to replace
3. **Bidirectional sync**: Lexical → Markdown via `$convertToMarkdownString`, Markdown → Lexical via `$convertFromMarkdownString`
4. **Toolbar position**: Above the editor area, context-aware (show active states)
5. **SSR**: All Lexical components dynamically imported with `ssr: false`
