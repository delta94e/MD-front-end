---
title: "Phase 1: Data Layer"
description: "Types, IndexedDB storage, SM-2 algorithm implementation"
status: pending
priority: P2
effort: 3h
---

# Phase 1: Data Layer

## Overview

Build the foundation: TypeScript types for flashcards, IndexedDB storage layer, and SM-2 spaced repetition algorithm.

## Key Insights

- IndexedDB is async (Promise-based); all storage functions must be async
- SM-2 is deterministic; easy to unit test with known inputs/outputs
- Card IDs should be UUIDs to avoid collisions across notes

## Related Code Files

### Create
- `lib/flashcard-types.ts` — Type definitions
- `lib/sm-2.ts` — SM-2 algorithm implementation
- `lib/flashcard-db.ts` — IndexedDB storage layer
- `__tests__/sm-2.test.ts` — SM-2 unit tests
- `__tests__/flashcard-db.test.ts` — DB integration tests

### Reference (read-only)
- `lib/annotations-db.ts:1-141` — DB pattern reference (SQLite, but structure is instructive)
- `lib/store.ts:1-155` — Zustand store patterns

## Implementation Steps

### 1.1 Define Types (`lib/flashcard-types.ts`)

```typescript
export interface Flashcard {
  id: string;                    // UUID
  filePath: string;              // Source markdown file path
  front: string;                 // Question/prompt
  back: string;                  // Answer
  tags: string[];                // Auto-generated tags from content
  createdAt: number;             // Epoch ms
  updatedAt: number;             // Epoch ms
}

export interface FlashcardReview {
  id: string;                    // UUID
  cardId: string;                // FK to Flashcard.id
  quality: number;               // 0-5 SM-2 rating
  reviewedAt: number;            // Epoch ms
}

export interface FlashcardSchedule {
  cardId: string;                // FK to Flashcard.id (PK)
  easeFactor: number;            // EF, starts at 2.5
  interval: number;              // Days until next review
  repetitions: number;           // Consecutive successful reviews
  nextReview: number;            // Epoch ms of next review date
  lastReview: number;            // Epoch ms of last review (0 if never)
}

export interface ReviewStats {
  totalCards: number;
  dueToday: number;
  reviewedToday: number;
  streak: number;                // Consecutive days with reviews
  averageEase: number;
}
```

### 1.2 Implement SM-2 Algorithm (`lib/sm-2.ts`)

Pure function: `calculateNextReview(schedule, quality) => FlashcardSchedule`

```typescript
export function calculateNextReview(
  current: Pick<FlashcardSchedule, 'easeFactor' | 'interval' | 'repetitions'>,
  quality: number  // 0-5
): Pick<FlashcardSchedule, 'easeFactor' | 'interval' | 'repetitions'> {
  // Validate quality range
  if (quality < 0 || quality > 5) throw new Error('Quality must be 0-5');

  let { easeFactor, interval, repetitions } = current;

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Update interval and repetitions
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  return { easeFactor, interval, repetitions };
}
```

### 1.3 Implement IndexedDB Storage (`lib/flashcard-db.ts`)

Three object stores: `flashcards`, `reviews`, `schedules`.

Key functions:
- `openFlashcardDb()` — Open/create DB with versioning
- `addFlashcards(cards: Flashcard[])` — Bulk insert, create initial schedules
- `getFlashcardsByFile(filePath: string)` — Get cards for a note
- `getDueCards(limit?: number)` — Cards where `nextReview <= now`
- `getSchedule(cardId: string)` — Get schedule for a card
- `updateSchedule(cardId: string, quality: number)` — Apply SM-2, save review
- `getReviewStats()` — Aggregate stats
- `deleteFlashcardsByFile(filePath: string)` — Cleanup
- `getAllFlashcards()` — For browse/manage view

### 1.4 Unit Tests

**SM-2 tests** (`__tests__/sm-2.test.ts`):
- New card, quality 5 => interval=1, EF~2.6, reps=1
- After 1 rep success, quality 4 => interval=6, reps=2
- After 2 reps success, quality 4 => interval=round(6*EF)
- Quality < 3 resets interval=1, reps=0
- EF never drops below 1.3
- Edge: quality=0 (complete blackout)
- Edge: quality=3 (barely correct)

**DB tests** (`__tests__/flashcard-db.test.ts`):
- Add and retrieve cards by file
- Due cards query returns correct set
- Schedule update persists correctly
- Stats aggregation

## Todo List

- [ ] Create `lib/flashcard-types.ts`
- [ ] Create `lib/sm-2.ts`
- [ ] Create `__tests__/sm-2.test.ts`
- [ ] Create `lib/flashcard-db.ts`
- [ ] Create `__tests__/flashcard-db.test.ts`
- [ ] Run tests, verify SM-2 correctness

## Success Criteria

- SM-2 produces correct intervals for all quality ratings (verified by tests)
- IndexedDB CRUD operations work in browser
- Due card query returns cards where `nextReview <= Date.now()`
- All unit tests pass

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| IndexedDB not available (SSR) | Medium | High | Guard all DB calls with `typeof window !== 'undefined'` check |
| IndexedDB quota exceeded | Low | Medium | Show user-friendly error, suggest clearing old reviews |
| SM-2 edge cases | Low | High | Comprehensive unit test coverage |

## Security Considerations

- No sensitive data in flashcards (user's own notes)
- IndexedDB is origin-scoped, not accessible cross-origin
- No server-side storage needed for this phase
