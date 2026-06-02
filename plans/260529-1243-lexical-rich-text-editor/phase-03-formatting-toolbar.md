---
phase: 3
title: "Formatting Toolbar"
status: completed
priority: P1
effort: "3h"
dependencies: [2]
---

# Phase 3: Formatting Toolbar

## Overview

Build a formatting toolbar above the editor with buttons for common text operations: bold, italic, strikethrough, headings (h1-h3), bullet list, numbered list, blockquote, code inline, code block, link, and undo/redo.

## Requirements

- Functional: All formatting actions work via toolbar buttons
- Functional: Active state highlighting (e.g., bold button glows when cursor is in bold text)
- Functional: Keyboard shortcuts for common actions (Ctrl+B, Ctrl+I, Ctrl+K for link)
- Non-functional: Toolbar matches design guidelines (ghost buttons, 32px height, lucide icons)

## Architecture

```
EditorToolbar
├── Text format group: Bold | Italic | Strikethrough | Code
├── Block format group: H1 | H2 | H3 | BulletList | NumberedList | Blockquote | CodeBlock
├── Insert group: Link
├── History group: Undo | Redo
└── Sub-mode toggle: WYSIWYG | Source
```

## Related Code Files

- Create: `components/editor/editor-toolbar.tsx`
- Create: `components/editor/toolbar-button.tsx` (reusable button with active state)
- Modify: `components/editor/lexical-editor.tsx` (register toolbar commands)

## Implementation Steps

1. Create `toolbar-button.tsx`:
   - Reusable button: ghost variant, 32x32, icon + optional label
   - `active` prop for toggle state (highlighted with accent background)
   - `disabled` prop
   - Tooltip on hover

2. Create `editor-toolbar.tsx`:
   - Use `useLexicalComposerContext()` to get editor instance
   - **Text format group**:
     - Bold: `editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')` + `editor.dispatchCommand(KEY_MODIFIER_COMMAND, 'b')`
     - Italic: `FORMAT_TEXT_COMMAND, 'italic'`
     - Strikethrough: `FORMAT_TEXT_COMMAND, 'strikethrough'`
     - Code: `FORMAT_TEXT_COMMAND, 'code'`
   - **Block format group**:
     - H1/H2/H3: `$setBlocksType(selection, () => $createHeadingNode('h1'))` etc.
     - Bullet list: `editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND)`
     - Numbered list: `editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND)`
     - Blockquote: `$setBlocksType(selection, () => $createQuoteNode())`
     - Code block: `$setBlocksType(selection, () => $createCodeNode())`
   - **Insert group**:
     - Link: open dialog, get URL, `$toggleLink(url)`
   - **History group**:
     - Undo: `editor.dispatchCommand(UNDO_COMMAND)`
     - Redo: `editor.dispatchCommand(REDO_COMMAND)`
   - **Active states**: Subscribe to `editor.registerUpdateListener` to check `$getSelection()` and detect active formats

3. Register keyboard shortcuts:
   - Ctrl+B → bold, Ctrl+I → italic, Ctrl+K → link dialog, Ctrl+Z → undo, Ctrl+Shift+Z → redo

4. Style toolbar to match design guidelines:
   - Height: 40px, border-bottom, bg-secondary
   - Icon size: 16px, stroke-width 1.75
   - Gap between groups: 8px, with separator line

## Success Criteria

- [ ] All toolbar buttons visible and clickable
- [ ] Bold/italic/strikethrough/code toggle correctly
- [ ] Heading buttons change block type
- [ ] List buttons create bullet/numbered lists
- [ ] Blockquote and code block buttons work
- [ ] Link button opens URL input, creates link
- [ ] Undo/redo buttons work
- [ ] Active states highlight when cursor is in formatted text
- [ ] Keyboard shortcuts work (Ctrl+B, Ctrl+I, Ctrl+K)
- [ ] Toolbar matches design guidelines

## Risk Assessment

- **Active state detection**: Lexical's selection API can be complex. Mitigation: use `$isRangeSelection` + `selection.hasFormat()` for text formats, `$getSelectedNode` parent check for block types.
- **Link dialog**: Need a simple URL input dialog. Mitigation: use shadcn/ui `Dialog` or inline popover.
