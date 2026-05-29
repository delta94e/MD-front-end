---
phase: 1
title: "Theme & Feedback Polish"
status: completed
priority: P2
effort: "3h"
dependencies: []
---

# Phase 1: Theme & Feedback Polish

## Overview

Fix light-mode code blocks, sync design-doc palette with CSS tokens, add toast notifications for save/error feedback, add loading skeletons for markdown viewer.

## Requirements

- Functional: Code blocks render correctly in both light and dark mode
- Functional: Toast notifications on save success/failure
- Functional: Loading skeleton replaces spinner in content viewer
- Functional: AI panel tabs show full labels (not truncated)
- Non-functional: Design-doc hex values match CSS oklch values

## Architecture

```
globals.css
├── Fix: code block background uses CSS variable (theme-aware)
├── Fix: sync --ai-glow and accent tokens with design-doc palette
└── Add: prefers-reduced-motion media query (foundation for Phase 4)

components/ui/sonner.tsx (new)
└── shadcn Sonner toast component

app/layout.tsx
└── Add <Toaster /> provider

components/content-viewer.tsx
└── Replace Loader2 spinner with skeleton

components/ai-panel.tsx
└── Full tab labels: "Summarize", "Explain", "Translate", "Write", "Path"
```

## Related Code Files

- Modify: `app/globals.css` — fix code block bg, sync tokens, add reduced-motion
- Create: `components/ui/sonner.tsx` — toast component (shadcn)
- Modify: `app/layout.tsx` — add Toaster provider
- Modify: `components/content-viewer.tsx` — skeleton loading
- Modify: `components/ai-panel.tsx` — full tab labels
- Modify: `components/markdown-viewer.tsx` — code block theme-aware bg
- Modify: `docs/design-guidelines.md` — sync palette with actual CSS values

## Implementation Steps

1. Install sonner: `npx shadcn@latest add sonner`
2. Fix `globals.css`:
   - Change code block `background` to use `hsl(var(--muted))` or oklch variable
   - Add `@media (prefers-reduced-motion: reduce)` base rule
3. Add `<Toaster />` to `app/layout.tsx`
4. Update `components/content-viewer.tsx`:
   - Replace `<Loader2>` spinner with 3-line skeleton (text blocks with pulse)
5. Update `components/ai-panel.tsx`:
   - Change tab labels from "Sum", "Trans" to "Summarize", "Translate"
   - Use `text-[11px]` instead of `text-[10px]`
6. Update `components/markdown-viewer.tsx`:
   - Code block background: use `bg-muted` instead of hardcoded oklch
7. Call `toast.success("File saved")` / `toast.error("Save failed")` in save handler

## Success Criteria

- [x] Code blocks visible and styled in both light/dark mode
- [x] Toast appears on file save (success or error)
- [x] Content viewer shows skeleton instead of spinner
- [x] AI panel tabs show full readable labels
- [x] prefers-reduced-motion media query exists in globals.css
- [x] Design-doc palette matches actual CSS values
