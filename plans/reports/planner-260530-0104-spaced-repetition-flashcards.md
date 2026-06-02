# Planner Report: Spaced Repetition Flashcards

**Date:** 2026-05-30
**Plan:** `plans/260530-0104-spaced-repetition-flashcards/`

## Summary

Created a 4-phase implementation plan for spaced repetition flashcards feature. Plan is ready for execution.

## Plan Structure

| File | Purpose |
|------|---------|
| `plan.md` | Overview, phase table, architecture decisions |
| `phase-01-data-layer.md` | Types, IndexedDB storage, SM-2 algorithm |
| `phase-02-ai-generation.md` | Flashcard generation API endpoint |
| `phase-03-review-ui.md` | Review session with card flip + rating |
| `phase-04-integration.md` | AI panel tab, due badge, stats |

## Key Decisions

- **IndexedDB over localStorage**: More storage capacity, structured queries, async API
- **Non-streaming JSON API**: Same pattern as `/api/study-guide` — proven reliable for structured output
- **No new dependencies**: Raw IndexedDB API, pure TS SM-2 implementation
- **Client-side only**: Flashcard data stays in browser, no server storage needed

## Dependency Chain

```
Phase 1 ──> Phase 2 ──> Phase 3 ──> Phase 4
```

Strictly sequential. Each phase builds on the previous.

## Files to Create (11 total)

- `lib/flashcard-types.ts`
- `lib/sm-2.ts`
- `lib/flashcard-db.ts`
- `app/api/generate-flashcards/route.ts`
- `components/flashcards/flashcard-card.tsx`
- `components/flashcards/rating-buttons.tsx`
- `components/flashcards/review-session.tsx`
- `components/flashcards/review-complete.tsx`
- `components/flashcards/generate-view.tsx`
- `components/flashcards/stats-view.tsx`
- `components/flashcards/flashcards-tab.tsx`

## Files to Modify (2)

- `lib/store.ts` — Add 2 flashcard UI state fields
- `components/ai-panel.tsx` — Add "Cards" tab

## Unresolved Questions

1. Should flashcard generation be available for selected text only, or always full document?
2. Max cards per generation — 15 enough, or should user be able to configure?
3. Should there be a "browse all cards" view separate from stats?
