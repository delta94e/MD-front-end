# Annotation System — Implementation Report

**Date**: 2026-05-29
**Severity**: High
**Component**: Markdown Viewer / AI Panel / SQLite Storage
**Status**: Resolved

## What Happened

Built a full annotation system: text selection in the markdown viewer triggers an inline popover for creating highlighted notes. Annotations persist per-file in SQLite via better-sqlite3. A rehype plugin (`rehype-annotate`) wraps annotated ranges in `<mark>` elements during markdown rendering. The Notes tab in the AI panel provides a management interface. State flows through Zustand for reactive UI updates.

New files: `lib/annotations-db.ts`, `app/actions/annotations.ts`, `lib/rehype-annotate.ts`, `components/annotation-popover.tsx`, `components/annotation-panel.tsx`.

Modified: `lib/store.ts`, `components/markdown-viewer.tsx`, `components/content-viewer.tsx`, `components/selection-toolbar.tsx`, `components/ai-panel.tsx`.

## The Brutal Truth

Code review caught five real bugs before they shipped. Five. The offset calculation was silently wrong — using `indexOf` to find annotated text positions, which breaks when the same substring appears multiple times in a document. The rehype plugin had a visitor iteration bug where splicing nodes during traversal corrupts the tree. XSS through the color input was wide open. UUID was truncated to 10 chars (collision city). Server actions had no path traversal protection. These weren't edge cases — they were the default failure modes.

## Technical Details

- **Offset bug**: `indexOf` returns first match. For text like "the ... the ... the", annotating the third "the" would highlight the first one. Replaced with DOM `TreeWalker` that walks text nodes and accumulates character offsets, matching the rehype plugin's offset domain (which skips `<code>` blocks).
- **Rehype splice**: The original visitor called `node.children.splice(i, 1, ...replacements)` inside a `forEach`. After splice, indices shift — later nodes get skipped or visited twice. Fixed by collecting all mutations and applying in reverse order.
- **XSS via color**: `style={{ backgroundColor: color }}` with user-supplied `color`. Added validation: `if (!/^#[0-9a-fA-F]{3,8}$/.test(color)) reject`.
- **ID truncation**: `crypto.randomUUID().slice(0, 10)` — 10 hex chars gives ~10^12 possibilities, but with thousands of annotations per file, birthday paradox makes collisions likely within a year. Switched to full UUID.
- **Server action hardening**: Added `path.resolve()` check against allowed base directory, offset bounds validation against file content length, and text length cap at 10,000 chars.

## Key Decisions

- **Character offsets over DOM selectors**: Anchoring annotations to `(startOffset, endOffset)` in plain text (excluding code blocks) rather than CSS selectors or XPath. Survives re-renders and content edits — offsets degrade gracefully when text changes.
- **Inline popover over modal**: Selection toolbar shows "Annotate" button, clicking opens a small popover near the selection. Faster workflow than a center-modal that breaks reading flow.
- **Notes tab in AI panel**: Rather than a standalone sidebar, annotations live as the 8th tab in the existing AI panel. Consistent with the panel's existing UX.
- **Color presets**: Yellow, green, blue, pink, orange. Kept it simple — no custom color picker, just five options that cover most use cases.
- **better-sqlite3 over Prisma**: Direct SQLite access for a single-table, CRUD-only feature. No ORM overhead, no migration complexity. The DB layer is ~80 lines.

## What Worked

- The TreeWalker approach for offset calculation is robust. It mirrors the rehype plugin's traversal logic, so highlights align correctly with rendered output.
- Reverse-order splice in the rehype plugin is a clean fix — no need to rewrite the visitor pattern.
- Five bugs caught in code review, all fixed in one pass. The review process worked.

## What Could Improve

- No undo/redo for annotation creation. Accidental highlights require manual deletion.
- Annotations don't survive content edits well — if text shifts, the offset becomes stale. A fuzzy matching or paragraph-relative anchor would be more resilient.
- No export/import of annotations. If the SQLite file is lost, annotations are gone.
- The color preset list is hardcoded. Should be configurable or at least stored in a constant.

## Lessons Learned

1. **Never use `indexOf` for text position matching in documents with repeated substrings.** This is a trap. Always use a traversal-based approach that counts positions explicitly.
2. **Never mutate an array while iterating it with `splice`.** Collect mutations, apply after iteration. This is basic but easy to miss when building AST visitors.
3. **Validate all user inputs in server actions, even "simple" ones like color.** A hex color string is an attack vector when injected into CSS.
4. **Don't truncate UUIDs.** The full 36-char UUID costs nothing in storage and eliminates collision risk entirely.
