---
phase: 2
title: "Mobile Responsive Layout"
status: completed
priority: P2
effort: "4h"
dependencies: [1]
---

# Phase 2: Mobile Responsive Layout

## Overview

Make the app usable on mobile/tablet: sidebar becomes a drawer overlay, AI panel becomes a bottom sheet or hidden by default, content area takes full width, touch-friendly tap targets.

## Requirements

- Functional: Sidebar collapses to hamburger menu on < lg breakpoint
- Functional: Sidebar opens as overlay drawer on mobile
- Functional: AI panel hidden by default on mobile, toggleable
- Functional: Content area takes full width on mobile
- Functional: TOC hidden on mobile (already `hidden lg:block`)
- Non-functional: Touch-friendly (min 44px tap targets)
- Non-functional: No horizontal scroll on mobile

## Architecture

```
app/page.tsx
├── <lg: sidebar becomes fixed overlay (z-40) with backdrop
├── <lg: AI panel hidden by default
└── <lg: content takes full width

components/app-header.tsx
├── <lg: hamburger menu button (Menu icon)
└── <lg: hide breadcrumbs, show only filename

components/file-tree.tsx
└── On mobile file click → close sidebar drawer

components/app-header.tsx
└── Add mobile menu handler
```

## Related Code Files

- Modify: `app/page.tsx` — responsive layout, drawer sidebar
- Modify: `components/app-header.tsx` — hamburger menu, responsive header
- Modify: `components/file-tree.tsx` — close on file click (mobile)
- Modify: `components/content-viewer.tsx` — full width on mobile
- Modify: `components/ai-panel.tsx` — hidden on mobile by default
- Modify: `app/globals.css` — responsive utilities

## Implementation Steps

1. Update `app/page.tsx`:
   - Sidebar: on `<lg`, use fixed position overlay with backdrop
   - Add `mobileSidebarOpen` state
   - Click backdrop closes sidebar
   - AI panel: `hidden lg:block` wrapper
2. Update `components/app-header.tsx`:
   - Add `Menu` icon button visible on `<lg`
   - Hide breadcrumbs on `<lg`, show truncated filename only
3. Update `components/file-tree.tsx`:
   - On file click, if viewport < lg, call `setSidebarOpen(false)`
4. Update `components/content-viewer.tsx`:
   - Remove `max-w-4xl` on mobile: `max-w-full lg:max-w-4xl`
5. Add responsive utility classes in `globals.css`:
   - `.drawer-overlay` for mobile sidebar backdrop
6. Test at breakpoints: 375px (mobile), 768px (tablet), 1024px+ (desktop)

## Success Criteria

- [x] Sidebar opens as overlay drawer on mobile
- [x] Hamburger menu visible on < lg
- [x] Content area full width on mobile
- [x] No horizontal scroll on 375px viewport
- [x] File click closes drawer on mobile
- [x] AI panel hidden by default on mobile
- [x] Touch targets >= 44px on interactive elements
