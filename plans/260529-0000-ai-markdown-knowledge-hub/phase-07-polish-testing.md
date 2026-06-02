---
phase: 7
title: "Polish & Testing"
status: completed
priority: P2
effort: "3h"
dependencies: [1, 2, 3, 4, 5, 6]
---

# Phase 7: Polish & Testing

## Overview

Polish the app with keyboard shortcuts, accessibility improvements, error boundaries, loading states, and write unit + integration tests. Ensure production build is clean.

## Requirements

- Functional: All keyboard shortcuts work, accessibility audit passes, tests pass
- Non-functional: Lighthouse score >90, no console errors, clean build

## Architecture

```
Testing:
├── __tests__/components/ — component unit tests
├── __tests__/lib/ — utility unit tests
├── __tests__/api/ — API route integration tests
└── e2e/ — Playwright E2E tests (optional)

Polish:
├── Error boundaries per panel
├── Loading skeletons
├── Keyboard shortcut help dialog
└── Accessibility audit
```

## Related Code Files

- Create: `__tests__/components/markdown-viewer.test.tsx`
- Create: `__tests__/components/file-tree.test.tsx`
- Create: `__tests__/lib/tree.test.ts`
- Create: `__tests__/lib/fs.test.ts`
- Create: `__tests__/api/summarize.test.ts`
- Modify: all components (accessibility improvements)
- Create: `components/error-boundary.tsx`
- Create: `components/keyboard-help-dialog.tsx`

## Implementation Steps

1. Create `components/error-boundary.tsx`:
   - React error boundary with fallback UI
   - Wrap each panel (sidebar, content, AI panel) independently
   - "Retry" button to reset boundary
   - Log errors to console (or Sentry if configured)

2. Add loading states:
   - Sidebar: skeleton tree nodes while loading
   - Content: skeleton paragraphs while loading file
   - AI panel: skeleton response lines while waiting for stream
   - Use shadcn Skeleton component

3. Complete keyboard shortcuts:
   - `Ctrl+B` — toggle sidebar (Phase 2)
   - `Ctrl+\\` — toggle AI panel (Phase 2)
   - `Ctrl+K` — focus search bar
   - `Ctrl+S` — save in editor (Phase 5)
   - `Ctrl+E` — toggle edit mode
   - `Escape` — close panels, deselect
   - `?` — show keyboard shortcut help dialog
   - Register all in `hooks/use-keyboard-shortcuts.ts`

4. Create `components/keyboard-help-dialog.tsx`:
   - Modal showing all keyboard shortcuts
   - Triggered by `?` key or header button
   - Grouped by: Navigation, Editor, AI

5. Accessibility improvements:
   - `aria-expanded` on folder tree nodes
   - `aria-current="page"` on active file
   - `aria-label` on all icon buttons
   - Focus management: trap focus in modals, restore on close
   - Skip-to-content link
   - Color contrast audit (WCAG AA)
   - `prefers-reduced-motion` support

6. Write unit tests:
   - `lib/tree.test.ts`: tree building, sorting, file count
   - `lib/fs.test.ts`: file reading, path validation
   - `components/markdown-viewer.test.tsx`: renders headings, code blocks, tables
   - `components/file-tree.test.tsx`: renders tree, click handler

7. Write API integration tests:
   - `api/summarize.test.ts`: mock Gemini API, verify streaming response
   - `api/translate.test.ts`: verify direction parameter handling
   - Path traversal rejection tests

8. Performance audit:
   - Check bundle size (target: <200KB initial JS)
   - Verify dynamic imports work (CodeMirror, AI SDK lazy loaded)
   - Check Lighthouse scores (target: >90 Performance, >90 Accessibility)
   - Verify no unnecessary re-renders (React DevTools Profiler)

9. Error handling polish:
   - 404 page for missing documents
   - API error responses with friendly messages
   - Network error handling (offline state)
   - Missing API key warning banner

10. Final build verification:
    - `npm run build` — zero errors, zero warnings
    - `npm run lint` — clean
    - `npm test` — all passing
    - Manual smoke test of all features

## Success Criteria

- [ ] All keyboard shortcuts work and are documented
- [ ] Error boundaries catch and display errors gracefully
- [ ] Loading states show during async operations
- [ ] Accessibility: WCAG AA compliant
- [ ] Unit tests pass (>80% coverage on lib/)
- [ ] API tests pass
- [ ] `npm run build` succeeds with zero errors
- [ ] No console errors in development
- [ ] Lighthouse: Performance >90, Accessibility >90

## Risk Assessment

- **Risk:** Test coverage is low due to time constraints. **Mitigation:** Focus on critical paths (tree building, file ops, AI routes).
- **Risk:** Accessibility gaps in complex components (tree, editor). **Mitigation:** Use shadcn/ui components which are accessibility-first.

## Security Considerations

- **Test data:** Don't commit real API keys in test files. Use mocks.
- **Error messages:** Don't expose internal paths or stack traces in production.
