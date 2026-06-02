# Plan: Annotation System for Markdown Viewer

## Summary

5-phase plan to add text annotation (highlight + note) to the markdown viewer. Uses SQLite for persistence, rehype plugin for highlight rendering, and inline popover for annotation creation.

## Phases

| # | Phase | Effort | Key Files |
|---|-------|--------|-----------|
| 1 | Research & Design | 1h | — |
| 2 | Data Layer | 2h | `lib/annotations-db.ts`, `app/actions/annotations.ts` |
| 3 | Highlight UI | 3h | `lib/rehype-annotate.ts`, `components/annotation-popover.tsx` |
| 4 | Annotation Panel | 2h | `components/annotation-panel.tsx` |
| 5 | Integration & Polish | 2h | `components/selection-toolbar.tsx` |

## Architecture

- **Storage**: SQLite (better-sqlite3), same pattern as `content-cache.ts`
- **Highlighting**: Custom rehype plugin wraps annotated ranges in `<mark>` elements
- **Position tracking**: Character offsets in plain-text content
- **UI**: Inline popover for creation, panel tab for management

## Total Effort: ~10h

## Next Step

```
/ck:cook /Users/truongnguyen/MD-front-end/plans/260529-1312-annotation-system/plan.md
```
