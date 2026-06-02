# Phase 3: Inline Card Differentiation

## Overview
Visually distinguish "Why" explanation cards from regular "Explain" cards so users can tell them apart at a glance.

## Related Code Files
- Modify: `components/inline-explain-card.tsx` (add type prop)
- Modify: `components/content-viewer.tsx` (pass type when creating explanation)
- Modify: `lib/store.ts` (add `type` field to ExplanationEntry)

## Implementation Steps

1. Add `type` field to `ExplanationEntry` in `lib/store.ts`:
   ```ts
   type: "explain" | "why"; // default: "explain"
   ```

2. Update `InlineExplainCard` to accept `type` prop:
   - `explain` → `BookOpen` icon, "AI Explanation" label, default purple accent
   - `why` → `Lightbulb` icon, "Why This Works" label, amber accent (`oklch(0.7 0.15 80)`)
   - Different accent color helps quick visual scanning

3. Update `content-viewer.tsx`:
   - When action is "why", pass `type: "why"` to `addExplanation()`
   - When action is "explain", pass `type: "explain"` (existing behavior)

4. Update `markdown-viewer.tsx`:
   - Pass `type` from explanation entry to `InlineExplainCard`

## Success Criteria
- [ ] "Why" cards show Lightbulb icon and amber accent
- [ ] "Explain" cards show BookOpen icon and purple accent (unchanged)
- [ ] Both types render correctly inline in markdown
- [ ] Save/dismiss work for both types
