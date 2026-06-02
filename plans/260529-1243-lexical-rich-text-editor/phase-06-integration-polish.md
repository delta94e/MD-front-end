---
phase: 6
title: "Integration & Polish"
status: pending
priority: P2
effort: "2h"
dependencies: [1, 2, 3, 4, 5]
---

# Phase 6: Integration & Polish

## Overview

Integrate the Lexical editor into the full app, update documentation, handle edge cases, and polish the UX.

## Requirements

- Functional: Selection toolbar works with Lexical (select text → AI actions)
- Functional: Ctrl+S save works in both WYSIWYG and source modes
- Functional: AI panel integration (selected text → explain/translate/rewrite)
- Non-functional: Update tech-stack.md and design-guidelines.md docs

## Related Code Files

- Modify: `components/content-viewer.tsx` (final integration)
- Modify: `components/selection-toolbar.tsx` (verify compatibility with Lexical)
- Modify: `docs/tech-stack.md` (update editor section)
- Modify: `docs/design-guidelines.md` (update editor section)
- Deprecate: `components/markdown-editor.tsx` (replaced by Lexical)

## Implementation Steps

1. Verify selection toolbar compatibility:
   - `selection-toolbar.tsx` uses `window.getSelection()` — should work with Lexical's contentEditable
   - Test: select text in WYSIWYG → toolbar appears → click "Explain" → AI panel opens with selected text

2. Verify Ctrl+S save:
   - Already handled in `content-viewer.tsx` via `window.addEventListener('keydown')`
   - Test save works in both WYSIWYG and source modes

3. Update `docs/tech-stack.md`:
   - Replace CodeMirror editor entry with Lexical
   - Update bundle strategy (Lexical ~50KB gzipped, dynamic import)
   - Update dependency summary

4. Update `docs/design-guidelines.md`:
   - Update section 4.3 (Markdown Editor) to describe Lexical toolbar
   - Add toolbar button specifications (icons, sizes, groups)

5. Clean up:
   - Remove unused CodeMirror imports from `markdown-editor.tsx` if fully replaced
   - Or keep `markdown-editor.tsx` as the source mode component (rename to `markdown-source.tsx`)

6. E2E testing:
   - Open a file → click Edit → WYSIWYG mode with toolbar
   - Format text (bold, heading, list) → verify preview matches
   - Toggle to Source → verify markdown is correct
   - Edit in Source → toggle to WYSIWYG → verify rich text
   - Save → reload → verify content persisted
   - Select text → AI toolbar appears → actions work

## Success Criteria

- [ ] Selection toolbar works with Lexical editor
- [ ] Ctrl+S saves in both modes
- [ ] AI panel receives selected text from Lexical
- [ ] `docs/tech-stack.md` updated with Lexical info
- [ ] `docs/design-guidelines.md` updated with toolbar specs
- [ ] No console errors in browser
- [ ] `npm run build` passes
- [ ] All existing features still work (file tree, TOC, knowledge graph, AI panel)

## Risk Assessment

- **Selection API differences**: Lexical manages its own selection, which may conflict with `window.getSelection()` used by `selection-toolbar.tsx`. Mitigation: test and add Lexical-specific selection handling if needed.
- **Regression**: Changing the editor could break existing features. Mitigation: thorough manual testing of all edit-mode interactions.
