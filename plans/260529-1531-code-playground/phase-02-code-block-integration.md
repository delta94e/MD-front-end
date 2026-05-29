---
phase: 2
title: "Code Block Integration"
status: completed
priority: P2
effort: "2h"
dependencies: [1]
---

# Phase 2: Code Block Integration

## Overview

Integrate the sandbox executor into the existing CodeBlock component in markdown-viewer.tsx. JS/TS code blocks get a "Run" button that triggers sandbox execution.

## Requirements

- Functional: JS/JSX/TS/TSX code blocks show "Run" button
- Functional: Clicking "Run" executes code and shows output below the block
- Functional: Non-JS code blocks (Python, CSS, etc.) unchanged
- Functional: "Run" button has play icon, changes to "Running..." with spinner during execution
- Non-functional: No layout shift when output appears

## Architecture

```
markdown-viewer.tsx
├── CodeBlock component (existing)
│   ├── Detects language from className: "language-js" | "language-ts" | etc.
│   ├── If executable language:
│   │   ├── Add <Play> button to existing toolbar (next to Copy)
│   │   └── Render <CodePlayground> below <pre> when Run clicked
│   └── Else: unchanged behavior

Executable languages: js, javascript, jsx, ts, typescript, tsx
```

## Related Code Files

- Modify: `components/markdown-viewer.tsx` — CodeBlock gets Run button + CodePlayground integration

## Implementation Steps

1. Add `useState` for `showPlayground` and `code` in CodeBlock
2. Detect executable language from `className` prop
3. Add "Run" button (Play icon) next to Copy button, visible on hover
4. On click: extract code text from `<pre>`, toggle `showPlayground`
5. Render `<CodePlayground code={code} />` below `<pre>` when active
6. Style: output panel has muted background, border, matches code block width

## Success Criteria

- [x] JS/TS code blocks show Play button on hover
- [x] Clicking Play opens sandbox with code
- [x] Console output appears below code block
- [x] Non-JS code blocks unaffected
- [x] No layout shift on activation

## Risk Assessment

- **Risk:** Code extraction from highlighted DOM may include HTML tags
  - **Mitigation:** Use `textContent` on the `<code>` element, not `innerHTML`
