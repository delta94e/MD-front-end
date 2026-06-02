---
title: "Phase 3: Review UI"
description: "Review session interface with flashcard flip and SM-2 difficulty rating"
status: pending
priority: P2
effort: 3h
---

# Phase 3: Review UI

## Overview

Build the review session UI: a focused, distraction-free interface where users see due flashcards one at a time, think about the answer, reveal it, then rate their recall quality (0-5).

## Key Insights

- Card flip animation via CSS transform (no library needed)
- Show rating buttons only after answer is revealed
- Session ends when all due cards are reviewed or user exits
- Track session progress (card X of Y)

## Related Code Files

### Create
- `components/flashcards/review-session.tsx` — Main review component
- `components/flashcards/flashcard-card.tsx` — Single card with flip animation
- `components/flashcards/rating-buttons.tsx` — 0-5 quality rating buttons
- `components/flashcards/review-complete.tsx` — Session complete summary
- `components/flashcards/flashcard-styles.css` — Card flip CSS animations

### Reference (read-only)
- `components/ui/button.tsx` — Button component
- `components/ui/badge.tsx` — Badge component
- `components/ui/scroll-area.tsx` — Scroll area
- `lib/flashcard-db.ts` — DB functions from Phase 1
- `lib/sm-2.ts` — SM-2 algorithm from Phase 1

## Implementation Steps

### 3.1 Flashcard Card Component (`components/flashcards/flashcard-card.tsx`)

A card that flips to reveal the answer:
- Front: question text, tags displayed as badges
- Back: answer text
- Click/tap to flip
- CSS 3D transform for smooth flip animation
- Keyboard support: Space to flip

```tsx
interface FlashcardCardProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}
```

### 3.2 Rating Buttons (`components/flashcards/rating-buttons.tsx`)

Six buttons (0-5) with descriptive labels:
- 0: "Blackout" (red)
- 1: "Wrong" (red-orange)
- 2: "Hard" (orange)
- 3: "Okay" (yellow)
- 4: "Good" (green)
- 5: "Easy" (green)

Show only when card is flipped (answer visible). Each button shows the resulting next review interval.

```tsx
interface RatingButtonsProps {
  schedule: FlashcardSchedule;
  onRate: (quality: number) => void;
}
```

### 3.3 Review Session (`components/flashcards/review-session.tsx`)

Main orchestrator component:
1. Load due cards from IndexedDB on mount
2. Show progress bar (card X of Y)
3. Display current card (flippable)
4. After flip, show rating buttons
5. On rate: apply SM-2, save to DB, advance to next card
6. When all cards reviewed, show summary

State machine:
```
LOADING -> NO_CARDS -> (exit)
LOADING -> SHOWING_CARD -> SHOWING_ANSWER -> RATING -> SHOWING_CARD (loop)
SHOWING_ANSWER -> COMPLETE (when last card rated)
```

### 3.4 Review Complete (`components/flashcards/review-complete.tsx`)

Session summary:
- Cards reviewed count
- Average quality rating
- Breakdown by quality (how many easy/hard/etc.)
- "Review Again" button (if more cards became due)
- "Back to Notes" button

### 3.5 Card Flip CSS (`components/flashcards/flashcard-styles.css`)

```css
.flashcard-container {
  perspective: 1000px;
}
.flashcard-inner {
  transition: transform 0.5s;
  transform-style: preserve-3d;
}
.flashcard-inner.flipped {
  transform: rotateY(180deg);
}
.flashcard-front, .flashcard-back {
  backface-visibility: hidden;
}
.flashcard-back {
  transform: rotateY(180deg);
}
```

## Todo List

- [ ] Create `components/flashcards/flashcard-styles.css`
- [ ] Create `components/flashcards/flashcard-card.tsx`
- [ ] Create `components/flashcards/rating-buttons.tsx`
- [ ] Create `components/flashcards/review-complete.tsx`
- [ ] Create `components/flashcards/review-session.tsx`
- [ ] Test keyboard navigation (Space to flip, 0-5 to rate)
- [ ] Test empty state (no due cards)

## Success Criteria

- Card flips smoothly on click with 3D animation
- Rating buttons show predicted next review interval
- Session progresses through all due cards
- SM-2 updates persist to IndexedDB after each rating
- Keyboard shortcuts work (Space=flip, 1-6=rate)
- Empty state shows friendly message with next review time

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| CSS flip animation janky on mobile | Medium | Medium | Use `will-change: transform`, test on mobile viewport |
| IndexedDB read slow on large collections | Low | Medium | Index on `nextReview`, limit query to due cards only |
| User closes mid-session | High | Low | Each rating saves immediately, no session state to lose |

## Security Considerations

- No sensitive data displayed
- All data client-side only
- No network requests during review (except initial load)
