# Phase 2: Selection Toolbar Integration

## Overview
Add a "Why" action to the SelectionToolbar that triggers the why-explain API and shows results inline.

## Related Code Files
- Modify: `components/selection-toolbar.tsx` (add "Why" action)
- Modify: `components/content-viewer.tsx` (handle "why" action)

## Implementation Steps

1. Add "Why" action to `selection-toolbar.tsx`:
   - Icon: `Lightbulb` from lucide-react (differentiates from `BookOpen` for Explain)
   - Label: "Why"
   - Position: after "Explain" in the action list

2. Handle "why" action in `content-viewer.tsx`:
   - Reuse the same inline-explain flow as "explain" action
   - Call `/api/why-explain` instead of `/api/explain`
   - Same marker format: `<!--inline-explain:{id}-->`
   - Same streaming + save/dismiss behavior

3. Reuse existing infrastructure:
   - `streamExplanation()` — just change the endpoint URL
   - `InlineExplainCard` — same card component
   - Save/dismiss handlers — identical

## Success Criteria
- [ ] "Why" button appears in selection toolbar
- [ ] Clicking "Why" streams design rationale inline
- [ ] Save/dismiss work identically to "Explain"
- [ ] Both "Explain" and "Why" can coexist on same document
