---
phase: 1
title: "Research & Setup"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Research & Setup

## Overview

Install Lexical packages, set up the basic project structure, and verify the editor renders in a test component.

## Requirements

- Install all required Lexical packages
- Verify no conflicts with existing dependencies (React 19.2.4, Next.js 16)
- Create module structure under `components/editor/`

## Related Code Files

- Modify: `package.json` (add Lexical deps)
- Create: `components/editor/` directory structure

## Implementation Steps

1. Install packages:
   ```bash
   npm install lexical @lexical/react @lexical/markdown @lexical/rich-text @lexical/list @lexical/code @lexical/link @lexical/selection @lexical/utils
   ```
2. Create directory structure:
   ```
   components/editor/
   ├── lexical-editor.tsx       # Main Lexical editor component
   ├── editor-toolbar.tsx       # Formatting toolbar
   ├── editor-theme.ts          # Lexical theme config
   ├── markdown-source.tsx      # CodeMirror markdown source view
   └── editor-sync.ts           # Bidirectional sync logic
   ```
3. Create `editor-theme.ts` with Tailwind-compatible class mappings for Lexical nodes (headings, lists, quotes, code blocks, links)
4. Verify Lexical renders with a minimal `LexicalComposer` + `RichTextPlugin` + `ContentEditable`
5. Test `npm run build` passes with no errors

## Success Criteria

- [ ] All Lexical packages installed, no peer dep conflicts
- [ ] `components/editor/` directory created with file stubs
- [ ] `editor-theme.ts` maps Lexical nodes to Tailwind classes matching `design-guidelines.md`
- [ ] Minimal Lexical editor renders in browser (dynamic import, no SSR)
- [ ] `npm run build` passes

## Risk Assessment

- **React 19 compatibility**: Lexical v0.45.0 may have hydration issues with React 19.2.4. Mitigation: use `dynamic()` with `ssr: false` for all Lexical components.
- **Bundle size**: Lexical adds ~50KB gzipped. Mitigation: dynamic import (loaded only in edit mode, zero initial impact).
