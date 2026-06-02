# Inline Code Runner and Exercise Generator Implementation

**Date**: 2026-05-30
**Severity**: Low
**Component**: CodeBlock, CodePlayground, ExerciseTab, /api/generate-exercises
**Status**: Resolved

## What Happened

Four-phase implementation delivered in a single session: (1) inline code execution via `js run` fence annotation, (2) exercise generation API hitting Mimo, (3) interactive exercise UI with three exercise types, (4) build verification. Zero new packages. All phases passed build.

## The Brutal Truth

This went smoother than it had any right to. The `js run` annotation approach was the right call -- no new syntax, no custom parser, just a string check on the language class. The exercise generator is intentionally bare-bones: no persistence, no progress tracking, no difficulty calibration. That's fine for now. YAGNI.

## Technical Details

**Phase 1 -- Inline Code Runner:**
- `CodeBlock` component parses `"run"` from the fence language string (e.g., ` ```js run `)
- `CodePlayground` receives `autoRun` prop; on mount, if true, triggers `handleRun()` automatically
- No new event system or lifecycle hooks needed -- React's existing mount cycle is sufficient

**Phase 2 -- Exercise Generator API:**
- New route: `/api/generate-exercises`
- Calls Mimo API with `generateExercises` system prompt
- Returns JSON array of exercises with three types: `predict-output`, `fix-bug`, `quiz`
- No database. Exercises are ephemeral. Session-scoped only.

**Phase 3 -- Exercise Generator UI:**
- `ExerciseTab` component in the AI panel sidebar
- `ExerciseCard` renders per type: quiz gets clickable options, predict-output and fix-bug get reveal buttons
- State management is local React state. No global store pollution.

**Phase 4 -- Build:** Clean pass. No warnings.

## What We Tried

Only real decision point was where to store exercises. Considered localStorage or a lightweight KV store. Rejected both -- the user generates exercises for the current topic, works through them, moves on. Persistence adds complexity for a workflow that doesn't need it.

## Root Cause Analysis

No failures to analyze. This is a success journal. The architecture choices held: fence-based annotation avoids parser complexity, API-only exercise generation avoids schema migrations, and per-type card rendering keeps the component tree shallow.

## Lessons Learned

1. **Fence language annotations are powerful.** `js run` is just a string in the language field, but it unlocks inline execution without touching the markdown parser. Future annotations (e.g., `js hidden`, `js editable`) can follow the same pattern.
2. **Three exercise types cover 90% of learning scenarios.** Predict-output tests comprehension, fix-bug tests debugging instinct, quiz tests recall. Don't over-engineer exercise taxonomies.
3. **Ephemeral is a feature.** No DB means no migration risk, no cleanup burden, no stale data bugs. If users want persistence later, that's a separate feature with clear scope.

## Next Steps

- Monitor Mimo API latency for exercise generation -- if it exceeds 3s consistently, consider streaming or a loading skeleton with progress indication.
- Track which exercise types users prefer to inform future UI emphasis.
- If `js run` adoption is high, consider adding `ts run` support for TypeScript code blocks.
