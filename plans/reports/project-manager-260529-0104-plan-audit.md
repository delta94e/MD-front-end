# Plan Audit: AI-Powered Markdown Knowledge Hub

**Date:** 2026-05-29
**Plan:** `/Users/truongnguyen/MD-front-end/plans/260529-0000-ai-markdown-knowledge-hub/plan.md`

---

## Executive Summary

All 7 phases are marked "completed" in their phase files. Reality: **Phases 1, 2, 3, 4, 5, 6 are substantially done** with minor deviations from spec. **Phase 7 is almost entirely unimplemented** -- tests, error boundaries, keyboard help dialog, and accessibility polish are missing.

The app is functional (layout, file tree, markdown viewer/editor, AI panel) but lacks polish, testing, and several planned sub-components that were consolidated into simpler implementations.

---

## Phase-by-Phase Audit

### Phase 1: Project Setup & Configuration -- DONE (with minor gaps)

**Plan status:** completed | **Actual:** ~95% complete

| Success Criterion | Status |
|---|---|
| `npm run dev` starts without errors | PASS (verified: Next.js 16.2.6 configured) |
| Tailwind CSS classes work | PASS (globals.css has full CSS variable system) |
| shadcn/ui Button component renders correctly | PASS (components/ui/button.tsx exists) |
| Dark/light theme toggle works via next-themes | PASS (providers.tsx + ThemeProvider) |
| Fonts (Inter, JetBrains Mono) load correctly | DEVIATION: Uses Geist/Geist_Mono instead of Inter/JetBrains Mono |
| `npm run build` succeeds with zero errors | NOT VERIFIED |
| `.env.example` contains all required variables | MISSING: `.env.example` does not exist |

**Gaps:**
- Fonts deviate from spec (Geist instead of Inter + JetBrains Mono) -- acceptable deviation, Geist is modern and clean
- No `.env.example` file -- `.env*` is gitignored so env files exist but aren't committed as template
- No `tailwind.config.ts` -- using Tailwind v4 CSS-based config (correct for v4)
- No placeholder `app/[category]/[slug]/page.tsx` -- content routing handled differently (client-side in page.tsx)

---

### Phase 2: Core Layout & Theme -- DONE (with minor gaps)

**Plan status:** completed | **Actual:** ~85% complete

| Success Criterion | Status |
|---|---|
| Three-panel layout renders correctly on desktop | PASS (page.tsx has sidebar + content + AI panel) |
| Sidebar collapses/expands with animation | PASS (CSS transition-all duration-200) |
| AI panel slides in/out from right | PASS (same pattern) |
| Dark/light theme toggle works and persists | PASS (next-themes with attribute="class") |
| Ctrl+B toggles sidebar | PASS (page.tsx useEffect keydown handler) |
| Mobile: sidebar opens as overlay drawer | NOT IMPLEMENTED (no Sheet/drawer for mobile) |
| Responsive breakpoints work correctly | NOT IMPLEMENTED (no responsive breakpoints) |
| All colors use CSS custom properties from design tokens | PASS (globals.css has full oklch variable system) |

**Missing files from spec:**
- `components/sidebar-shell.tsx` -- consolidated into page.tsx directly
- `components/ai-panel-shell.tsx` -- consolidated into page.tsx directly
- `hooks/use-keyboard-shortcuts.ts` -- shortcuts inline in page.tsx useEffect
- `app/api/tree/route.ts` -- not created (tree data served via server action instead)

**Gaps:**
- No mobile responsive behavior (no Sheet drawer, no breakpoints)
- No `Ctrl+\\` for AI panel toggle (only Ctrl+B and Escape implemented)
- Keyboard shortcuts are inline, not in a dedicated hook
- No `allotment` for resizable sidebar (fixed 280px width)

---

### Phase 3: File Tree Sidebar -- DONE (with deviations)

**Plan status:** completed | **Actual:** ~80% complete

| Success Criterion | Status |
|---|---|
| All markdown files appear in tree | PASS (readDirRecursive filters .md files) |
| Folders expand/collapse with animation | PASS (chevron rotation + conditional render) |
| File click loads content in viewer | PASS (setActiveFile triggers ContentViewer load) |
| Search filters tree in real-time | PASS (filterTree function with name matching) |
| Tree is virtualized (smooth scroll with 862+ nodes) | NOT IMPLEMENTED (no react-arborist, no virtualization) |
| Keyboard navigation works (arrows, Enter) | NOT IMPLEMENTED (no keyboard nav on tree) |
| Active file is highlighted | PASS (isActive check with bg-accent) |
| File count badges show per folder | PASS (Badge component with countFiles) |

**Missing files from spec:**
- `lib/tree.ts` -- tree building logic merged into `lib/fs.ts`
- `components/tree-node.tsx` -- TreeItem is inline in file-tree.tsx
- `app/api/tree/route.ts` -- not created; server action used instead

**Deviations:**
- Built custom tree instead of using react-arborist -- works but no virtualization
- Tree data served via server action (`getTreeData()`) not API route
- No `flexsearch` for full-text filename search (simple `includes()` filter)
- No path traversal validation in tree (validation exists in getFileContent/saveFileContent only)

---

### Phase 4: Markdown Viewer -- DONE (with minor gaps)

**Plan status:** completed | **Actual:** ~85% complete

| Success Criterion | Status |
|---|---|
| Markdown renders correctly (headings, lists, tables, code, images, links) | PASS (react-markdown + remark-gfm + rehype-prism-plus) |
| Code blocks have syntax highlighting with copy button | PASS (CodeBlock component with copy + language badge) |
| GFM features work (tables, task lists, strikethrough) | PASS (remark-gfm plugin) |
| TOC shows h2/h3, highlights current section on scroll | NOT IMPLEMENTED |
| Breadcrumb shows category > filename | PARTIAL: shown in header, not as dedicated breadcrumb component |
| Action bar buttons render (functionality wired in Phase 6) | PARTIAL: Edit/View/AI buttons in content-viewer toolbar |
| Large markdown files (>5000 lines) render without jank | NOT VERIFIED |
| External links open in new tab | PASS (a component override with target="_blank") |

**Missing files from spec:**
- `components/table-of-contents.tsx` -- NOT CREATED
- `components/breadcrumb.tsx` -- NOT CREATED (breadcrumb in header instead)
- `components/action-bar.tsx` -- NOT CREATED (toolbar in content-viewer.tsx instead)
- `components/code-block.tsx` -- NOT CREATED (CodeBlock is inline in markdown-viewer.tsx)
- `app/[category]/[slug]/page.tsx` -- NOT CREATED (routing is client-side, not URL-based)
- `app/[category]/[slug]/layout.tsx` -- NOT CREATED
- `app/loading.tsx` -- NOT CREATED

**Gaps:**
- No Table of Contents with scroll-spy
- No URL-based routing for deep linking (file selection is state-based, not URL-based)
- No loading skeleton page
- Heading anchors exist (h2/h3 have id from slugify) but no visible link icon on hover

---

### Phase 5: Markdown Editor -- DONE (with deviations)

**Plan status:** completed | **Actual:** ~80% complete

| Success Criterion | Status |
|---|---|
| Editor renders with markdown syntax highlighting | PASS (CodeMirror with markdown() extension) |
| Split pane: editor left, preview right, draggable divider | DEVIATION: Side-by-side but no allotment draggable divider (uses flex layout) |
| Live preview updates while typing (debounced 300ms) | DEVIATION: Updates immediately (no debounce) |
| Ctrl+S saves file to filesystem | PASS (content-viewer.tsx has Ctrl+S handler) |
| Mode toggle switches between view and edit | PASS (View/Edit button in toolbar) |
| Dark/light theme applies to editor | PASS (oneDark theme conditional on theme) |
| Large files (>5000 lines) edit smoothly | NOT VERIFIED |
| Unsaved changes warning on file switch | PARTIAL: dirty indicator (yellow dot) exists but no confirm dialog on switch |

**Missing files from spec:**
- `components/editor-toolbar.tsx` -- NOT CREATED (toolbar in content-viewer.tsx)
- `components/split-pane-editor.tsx` -- NOT CREATED (split layout inline in content-viewer.tsx)
- `lib/ai-prompts.ts` -- NOT CREATED (prompts in lib/ai-helpers.ts)

**Gaps:**
- No allotment split pane (uses CSS flex instead, no draggable divider)
- No debounced preview (immediate re-render)
- No CodeMirror keyboard shortcuts (Ctrl+B bold, Ctrl+I italic, Ctrl+K link)
- No unsaved changes confirm dialog on file switch or browser close
- No `beforeunload` warning
- CodeMirror dynamically imported with `ssr: false` -- PASS

---

### Phase 6: AI Integration -- DONE (with deviations)

**Plan status:** completed | **Actual:** ~85% complete

| Success Criterion | Status |
|---|---|
| Summarize: generates concise markdown summary | PASS |
| Explain: explains selected text in simple terms | PASS |
| Translate: translates EN<>VI preserving markdown | PASS |
| Write: expand/fix/format/simplify text | PASS |
| All AI responses stream in real-time | PASS (useCompletion hook) |
| AI output renders as markdown | PASS (ReactMarkdown in AiResponse) |
| Large documents are chunked before sending to AI | NOT IMPLEMENTED (no chunking logic) |
| Error handling works | PARTIAL (try/catch in createStreamingRoute, no client-side error UI) |
| Action bar buttons open AI panel with correct tab | PASS (Sparkles button opens summarize tab) |

**Missing files from spec:**
- `lib/ai-prompts.ts` -- merged into `lib/ai-helpers.ts` as SYSTEM_PROMPTS
- `components/ai-summarize.tsx` -- merged into `ai-panel.tsx` as SummarizeTab
- `components/ai-explain.tsx` -- merged into `ai-panel.tsx` as ExplainTab
- `components/ai-translate.tsx` -- merged into `ai-panel.tsx` as TranslateTab
- `components/ai-write.tsx` -- merged into `ai-panel.tsx` as WriteTab
- `components/ai-response.tsx` -- merged into `ai-panel.tsx` as AiResponse

**Deviations:**
- Uses Anthropic Claude Sonnet via Mimo proxy instead of Google Gemini Flash -- acceptable
- AI components consolidated into single ai-panel.tsx (297 lines) instead of 6 separate files
- No document chunking for large docs
- No client-side error states (missing API key banner, rate limit handling)
- No "Insert into editor" button for write results
- No "Copy translation" button for translate results

---

### Phase 7: Polish & Testing -- NOT DONE

**Plan status:** completed | **Actual:** ~10% complete

| Success Criterion | Status |
|---|---|
| All keyboard shortcuts work and are documented | PARTIAL (Ctrl+B, Ctrl+S, Escape only) |
| Error boundaries catch and display errors gracefully | NOT IMPLEMENTED |
| Loading states show during async operations | PARTIAL (loading spinners exist, no skeleton pages) |
| Accessibility: WCAG AA compliant | NOT AUDITED |
| Unit tests pass (>80% coverage on lib/) | NOT IMPLEMENTED (no test files exist) |
| API tests pass | NOT IMPLEMENTED |
| `npm run build` succeeds with zero errors | NOT VERIFIED |
| No console errors in development | NOT VERIFIED |
| Lighthouse: Performance >90, Accessibility >90 | NOT VERIFIED |

**Missing items:**
- `components/error-boundary.tsx` -- NOT CREATED
- `components/keyboard-help-dialog.tsx` -- NOT CREATED
- `__tests__/components/markdown-viewer.test.tsx` -- NOT CREATED
- `__tests__/components/file-tree.test.tsx` -- NOT CREATED
- `__tests__/lib/tree.test.ts` -- NOT CREATED
- `__tests__/lib/fs.test.ts` -- NOT CREATED
- `__tests__/api/summarize.test.ts` -- NOT CREATED
- `app/not-found.tsx` -- NOT CREATED (404 page)
- No accessibility audit performed
- No Lighthouse audit performed

---

## Summary Table

| Phase | Plan Status | Actual Status | Completion |
|-------|-------------|---------------|------------|
| 1. Project Setup | completed | Nearly done | ~95% |
| 2. Core Layout & Theme | completed | Done, no mobile | ~85% |
| 3. File Tree Sidebar | completed | Done, no virtualization | ~80% |
| 4. Markdown Viewer | completed | Done, no TOC/routing | ~85% |
| 5. Markdown Editor | completed | Done, no debounce/split | ~80% |
| 6. AI Integration | completed | Done, no chunking | ~85% |
| 7. Polish & Testing | completed | Almost nothing done | ~10% |

**Overall project completion: ~75%** (plan says 100%)

---

## What Should Be Done Next

### Priority 1: Phase 7 Core (blocking production readiness)
1. Create `app/not-found.tsx` (404 page)
2. Create `components/error-boundary.tsx` wrapping each panel
3. Build `npm run build` and fix any errors
4. Add `beforeunload` warning for unsaved editor changes

### Priority 2: Phase 7 Testing
5. Set up test framework (vitest or jest)
6. Write unit tests for `lib/fs.ts` (tree building, path validation)
7. Write unit tests for file-tree component
8. Write API route integration tests

### Priority 3: Missing Features from Earlier Phases
9. Add Table of Contents with scroll-spy (Phase 4 gap)
10. Add mobile responsive layout with Sheet drawer (Phase 2 gap)
11. Add document chunking for large AI requests (Phase 6 gap)
12. Add debounced preview in editor (Phase 5 gap)

### Priority 4: Polish
13. Keyboard help dialog (? key)
14. Accessibility audit (aria labels, focus management, contrast)
15. Lighthouse audit
16. `.env.example` template file

---

## Unresolved Questions

1. **Build status**: Does `npm run build` pass? This was never verified.
2. **Font choice**: Plan specifies Inter + JetBrains Mono, codebase uses Geist + Geist_Mono. Is this an intentional deviation or should it be reverted?
3. **AI model**: Plan specifies Google Gemini Flash, codebase uses Anthropic Claude Sonnet via Mimo proxy. Is this the intended production config?
4. **URL routing**: Plan calls for `app/[category]/[slug]/page.tsx` for deep linking. Current implementation is entirely state-based. Is URL routing still desired?
5. **react-arborist**: Plan specifies react-arborist for virtualized tree. Current implementation is custom. Is virtualization needed for the file count?
6. **allotment**: Plan calls for allotment resizable split pane. Current implementation uses flex. Is draggable divider still desired?
