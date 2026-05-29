---
phase: 4
title: "Animation & Transitions"
status: completed
priority: P2
effort: "2h"
dependencies: [3]
---

# Phase 4: Animation & Transitions

## Overview

Add smooth enter/exit transitions for panels, AI streaming typewriter effect, and ensure all animations respect prefers-reduced-motion (from Phase 3).

## Requirements

- Functional: Sidebar/AI panel slide in/out smoothly
- Functional: AI response text streams with typewriter effect
- Functional: Toast notifications animate in/out
- Functional: Graph view fades in when opened
- Non-functional: All animations respect prefers-reduced-motion
- Non-functional: No layout shift during transitions

## Related Code Files

- Modify: `app/page.tsx` — panel transition classes
- Modify: `components/ai-panel.tsx` — typewriter effect for AI responses
- Modify: `components/knowledge-graph.tsx` — fade-in on mount
- Modify: `app/globals.css` — transition utility classes, reduced-motion guard

## Implementation Steps

1. Update `globals.css`:
   - Add `.slide-in-left`, `.slide-in-right`, `.fade-in` utility classes
   - All use `transition-*` properties (covered by reduced-motion guard from Phase 3)
2. Update `app/page.tsx`:
   - Sidebar: use `transform: translateX` instead of `width` for smoother animation
   - AI panel: same approach
3. Update `components/ai-panel.tsx`:
   - AI response: animate text appearance with CSS `@keyframes typewriter` or JS-based character-by-character reveal
   - Use `overflow-hidden` + `white-space: nowrap` + `width` animation for typewriter
4. Update `components/knowledge-graph.tsx`:
   - Add `animate-in fade-in duration-300` on mount
5. Verify reduced-motion: all animations should be instant when `prefers-reduced-motion: reduce`

## Success Criteria

- [x] Sidebar slides in/out smoothly (not just width change)
- [x] AI response has typewriter-like streaming effect
- [x] Toasts animate in/out
- [x] Graph view fades in on open
- [x] All animations disabled with prefers-reduced-motion
- [x] No layout shift during panel transitions
