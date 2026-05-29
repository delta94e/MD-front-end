---
phase: 3
title: "Accessibility Enhancements"
status: completed
priority: P2
effort: "3h"
dependencies: [2]
---

# Phase 3: Accessibility Enhancements

## Overview

Add focus-visible rings, aria-current on active file, keyboard arrow-key navigation for file tree, prefers-reduced-motion support, and proper heading hierarchy.

## Requirements

- Functional: Visible focus ring on all interactive elements
- Functional: Active file has `aria-current="page"`
- Functional: Arrow keys navigate file tree (Up/Down to move, Enter to open, Left/Right to collapse/expand)
- Functional: `prefers-reduced-motion: reduce` disables all animations
- Non-functional: WCAG 2.1 AA compliance for focus indicators
- Non-functional: Screen reader accessible

## Related Code Files

- Modify: `app/globals.css` — focus-visible styles, reduced-motion rules
- Modify: `components/file-tree.tsx` — aria-current, keyboard nav
- Modify: `components/app-header.tsx` — aria-current on active breadcrumb
- Modify: `components/content-viewer.tsx` — heading hierarchy check
- Modify: `components/ai-panel.tsx` — aria-labels on tabs
- Modify: `components/selection-toolbar.tsx` — aria-label on buttons
- Modify: `components/graph-toolbar.tsx` — aria-labels

## Implementation Steps

1. Add `focus-visible` styles in `globals.css`:
   ```css
   :focus-visible {
     outline: 2px solid hsl(var(--ring));
     outline-offset: 2px;
   }
   ```
2. Add `prefers-reduced-motion` rules:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
3. Update `components/file-tree.tsx`:
   - Add `aria-current="page"` on active file button
   - Add `role="tree"` on container, `role="treeitem"` on items
   - Add keyboard handler: ArrowDown/ArrowUp to move focus, Enter to select, ArrowLeft to collapse, ArrowRight to expand
4. Update `components/ai-panel.tsx`:
   - Add `aria-label` on each TabsTrigger
5. Update all icon-only buttons:
   - Ensure every `<Button size="icon">` has `aria-label`

## Success Criteria

- [x] Focus ring visible on Tab/keyboard navigation
- [x] Active file has aria-current="page"
- [x] Arrow keys navigate file tree
- [x] prefers-reduced-motion disables animations
- [x] All icon buttons have aria-label
- [x] No focus traps or lost focus scenarios
