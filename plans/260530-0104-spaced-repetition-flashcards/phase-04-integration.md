---
title: "Phase 4: Integration"
description: "Wire flashcards into AI panel, add due cards indicator, and statistics view"
status: pending
priority: P2
effort: 3h
---

# Phase 4: Integration

## Overview

Connect all pieces: add "Flashcards" tab to AI panel with generate/review/stats sub-views, show due card count badge, and provide a statistics dashboard.

## Key Insights

- Follow existing AI panel tab pattern (see `ai-panel.tsx:275-288`)
- Use Zustand store for flashcard UI state (which sub-view, loading states)
- Due card count badge uses existing Badge component
- Stats can be simple text-based, no charts needed (YAGNI)

## Related Code Files

### Modify
- `components/ai-panel.tsx` — Add flashcards tab (lines 275-288 for tab config, lines 302-348 for tab content)
- `lib/store.ts` — Add flashcard UI state to Zustand store

### Create
- `components/flashcards/flashcards-tab.tsx` — Main tab component with sub-navigation
- `components/flashcards/generate-view.tsx` — Generate flashcards from current note
- `components/flashcards/stats-view.tsx` — Review statistics dashboard
- `components/flashcards/due-badge.tsx` — Due cards count badge component

### Reference (read-only)
- `components/ai-panel.tsx:69-113` — SummarizeTab pattern for generate
- `components/study-guide-tab.tsx:1-325` — Full tab component pattern
- `lib/store.ts:27-73` — Store interface pattern

## Implementation Steps

### 4.1 Update Zustand Store (`lib/store.ts`)

Add flashcard UI state:

```typescript
// Add to PKMStore interface:
flashcardSubView: "generate" | "review" | "stats";
setFlashcardSubView: (view: "generate" | "review" | "stats") => void;
dueCardCount: number;
setDueCardCount: (count: number) => void;
```

### 4.2 Create Generate View (`components/flashcards/generate-view.tsx`)

Pattern: same as SummarizeTab but calls `/api/generate-flashcards`.

1. Show current file name
2. "Generate Flashcards" button
3. On success: save cards to IndexedDB via `addFlashcards()`
4. Show generated cards in a list (front only, expandable)
5. "Start Review" button if there are due cards

### 4.3 Create Stats View (`components/flashcards/stats-view.tsx`)

Simple stats dashboard:
- Total cards / Due today / Reviewed today
- Current streak (consecutive days)
- Average ease factor
- Cards by source file (grouped list)
- "Review Now" button with due count

### 4.4 Create Due Badge (`components/flashcards/due-badge.tsx`)

Small component that:
- On mount, queries IndexedDB for due card count
- Shows Badge with count (hidden if 0)
- Updates every 60 seconds (or on focus)
- Used in AI panel tab trigger

### 4.5 Create Flashcards Tab (`components/flashcards/flashcards-tab.tsx`)

Main tab with sub-navigation:
```
[Generate] [Review] [Stats]
```

- Generate: `GenerateView` component
- Review: `ReviewSession` component (from Phase 3)
- Stats: `StatsView` component

Default to "review" if there are due cards, else "generate".

### 4.6 Update AI Panel (`components/ai-panel.tsx`)

Add to secondaryTabs array (line 282-288):
```typescript
{ value: "flashcards", icon: Brain, label: "Cards" },
```

Add TabsContent:
```tsx
<TabsContent value="flashcards" className="mt-3">
  <FlashcardsTab />
</TabsContent>
```

Import `Brain` from lucide-react.

## Todo List

- [ ] Update `lib/store.ts` with flashcard UI state
- [ ] Create `components/flashcards/due-badge.tsx`
- [ ] Create `components/flashcards/generate-view.tsx`
- [ ] Create `components/flashcards/stats-view.tsx`
- [ ] Create `components/flashcards/flashcards-tab.tsx`
- [ ] Update `components/ai-panel.tsx` with flashcards tab
- [ ] Test full flow: generate -> review -> stats
- [ ] Verify due badge updates correctly

## Success Criteria

- "Cards" tab appears in AI panel secondary row
- Generate creates cards from current note and saves to IndexedDB
- Due badge shows correct count, updates on review
- Review session accessible from both generate success and stats views
- Stats show meaningful data after at least one review session
- Tab defaults to "review" when due cards exist

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tab layout breaks with 6 secondary tabs | Low | Medium | Test responsive layout, adjust grid-cols if needed |
| Due badge polling causes performance issues | Low | Low | Use `visibilitychange` event, not setInterval |
| Store bloat | Low | Low | Flashcard UI state is minimal (2 fields) |

## Security Considerations

- No new attack surface (all client-side)
- API endpoint already secured by env var

## File Ownership

| File | Action |
|------|--------|
| `lib/store.ts` | Modify (add 3 fields) |
| `components/ai-panel.tsx` | Modify (add tab + import) |
| `components/flashcards/*` | Create (new directory) |
