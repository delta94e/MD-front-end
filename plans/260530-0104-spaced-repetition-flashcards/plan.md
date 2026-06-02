---
title: "Spaced Repetition Flashcards"
description: "Auto-generate flashcards from markdown notes with SM-2 spaced repetition review scheduling"
status: pending
priority: P2
effort: 12h
branch: main
tags: [ai, flashcards, spaced-repetition, learning, sm-2]
created: 2026-05-30
---

# Spaced Repetition Flashcards

## Overview

Add flashcard generation and spaced repetition review to the markdown knowledge hub. Users can auto-generate Q&A flashcards from any note via AI, then review due cards using the SM-2 algorithm for optimal retention.

## Phases

| # | Phase | Status | Effort | Description |
|---|-------|--------|--------|-------------|
| 1 | [Data Layer](phase-01-data-layer.md) | pending | 3h | Types, IndexedDB storage, SM-2 algorithm |
| 2 | [AI Generation](phase-02-ai-generation.md) | pending | 3h | Flashcard generation API from markdown content |
| 3 | [Review UI](phase-03-review-ui.md) | pending | 3h | Review session interface with difficulty rating |
| 4 | [Integration](phase-04-integration.md) | pending | 3h | AI panel tab, due cards indicator, statistics |

## Key Dependencies

```
Phase 1 (Data Layer) ──> Phase 2 (AI Generation) ──> Phase 3 (Review UI) ──> Phase 4 (Integration)
```

Phase 1 is foundation; Phase 2 depends on Phase 1 types; Phase 3 depends on Phase 1+2; Phase 4 wires everything together.

## Architecture Decisions

- **Storage**: IndexedDB via raw API (no new dependency) for client-side flashcard data. SQLite is server-side only; flashcard data is per-user, per-browser.
- **AI**: Non-streaming JSON response (same pattern as `/api/study-guide`) for structured flashcard output.
- **SM-2**: Pure TypeScript implementation, no external library.
- **UI**: New `flashcards/` component directory + new AI panel tab. Uses existing shadcn/ui components.

## Decisions

1. **Generation source**: Full document (not selected text)
2. **Max cards per generation**: Fixed 15
3. **Browse view**: Not needed — review session + stats only

## Success Criteria

- User can generate up to 15 flashcards from any markdown note
- Flashcards persist across browser sessions via IndexedDB
- Review session shows due cards, user rates recall 0-5
- SM-2 schedules next review correctly (verified by unit tests)
- Due card count visible in AI panel badge
