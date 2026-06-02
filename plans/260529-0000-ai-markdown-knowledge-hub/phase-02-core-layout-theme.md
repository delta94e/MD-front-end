---
phase: 2
title: "Core Layout & Theme"
status: completed
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Core Layout & Theme

## Overview

Build the three-panel layout shell (sidebar + content + AI panel), implement dark/light theme toggle, set up Zustand store, and create responsive behavior with mobile drawer.

## Requirements

- Functional: Three-panel layout visible, sidebar collapsible, AI panel collapsible, theme toggle works
- Non-functional: Responsive (mobile drawer), smooth transitions, keyboard shortcut `Ctrl+B` for sidebar

## Architecture

```
Root Layout (server)
├── Header (client) — logo, search trigger, theme toggle, AI toggle
├── Sidebar shell (client) — collapsible, resizable
├── Content area — flex-1, scrollable
└── AI Panel shell (client) — collapsible from right

Zustand Store:
├── sidebarOpen: boolean
├── sidebarWidth: number
├── aiPanelOpen: boolean
├── activeFile: string | null
├── editorContent: string
└── editorMode: 'view' | 'edit'
```

## Related Code Files

- Create: `app/layout.tsx` (update with three-panel structure)
- Create: `components/app-header.tsx`
- Create: `components/sidebar-shell.tsx`
- Create: `components/ai-panel-shell.tsx`
- Create: `components/theme-toggle.tsx`
- Create: `lib/store.ts` (Zustand store)
- Create: `hooks/use-keyboard-shortcuts.ts`

## Implementation Steps

1. Create `lib/store.ts` with Zustand store: sidebarOpen, sidebarWidth, aiPanelOpen, activeFile, editorContent, editorMode
2. Create `components/app-header.tsx`: logo, breadcrumb placeholder, theme toggle, AI panel toggle button
3. Create `components/theme-toggle.tsx` using next-themes: sun/moon icon, toggles dark/light
4. Create `components/sidebar-shell.tsx`:
   - Wrapper with width from Zustand, collapse animation (200ms ease-in-out)
   - Collapse button at bottom (`panel-left-close` / `panel-left-open` icons)
   - Placeholder content: "File tree coming in Phase 3"
   - Mobile: overlay drawer using shadcn Sheet
5. Create `components/ai-panel-shell.tsx`:
   - Fixed 320px width, slides in from right
   - Collapse button, placeholder: "AI features coming in Phase 6"
   - Mobile: bottom sheet
6. Update `app/layout.tsx`:
   - Server component shell with Header + three-column flex layout
   - Import and render SidebarShell, content children, AIPanelShell
   - Use `allotment` for resizable sidebar (optional, can defer to Phase 3)
7. Create `hooks/use-keyboard-shortcuts.ts`:
   - `Ctrl+B` → toggle sidebar
   - `Ctrl+\\` → toggle AI panel
   - Register in root layout via useEffect
8. Add responsive breakpoints:
   - `< 768px`: sidebar hidden (drawer), AI panel hidden (bottom sheet)
   - `768-1279px`: sidebar visible, AI panel hidden
   - `>= 1280px`: all panels visible
9. Apply design tokens from `docs/design-guidelines.md` (colors, spacing, radius)
10. Run `npm run build` to verify

## Success Criteria

- [ ] Three-panel layout renders correctly on desktop
- [ ] Sidebar collapses/expands with animation
- [ ] AI panel slides in/out from right
- [ ] Dark/light theme toggle works and persists
- [ ] `Ctrl+B` toggles sidebar
- [ ] Mobile: sidebar opens as overlay drawer
- [ ] Responsive breakpoints work correctly
- [ ] All colors use CSS custom properties from design tokens

## Risk Assessment

- **Risk:** `allotment` SSR hydration mismatch. **Mitigation:** Use dynamic import with `ssr: false` for allotment panes.
- **Risk:** Zustand store hydration issues in SSR. **Mitigation:** Use `persist` middleware with `skipHydration` or initialize defaults in useEffect.

## Security Considerations

- No user data in Zustand persist (only UI preferences)
