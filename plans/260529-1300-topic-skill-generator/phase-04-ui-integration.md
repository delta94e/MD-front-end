---
phase: 4
title: "UI Integration"
status: pending
priority: P2
effort: "2h"
dependencies: [3]
---

# Phase 4: UI Integration

## Overview

Add UI controls to the Knowledge Hub for generating skills. Users can generate a skill for the current topic category or batch-generate all skills.

## Related Code Files

- Create: `components/skill-generator-button.tsx`
- Modify: `components/ai-panel.tsx` (add skill generation tab/section)
- Modify: `app/page.tsx` (if layout changes needed)

## Implementation Steps

1. Create `components/skill-generator-button.tsx`:
   - Button component with loading state
   - Calls `POST /api/generate-skills` with current category
   - Shows success/error toast notification
   - Displays generated skill path on success

2. Add "Generate Skill" action to AI panel:
   - New tab or section in `components/ai-panel.tsx`
   - Shows current topic category info
   - "Generate Skill for This Topic" button
   - "Generate All Skills" button
   - Progress indicator during generation
   - Result display with link to generated skill directory

3. Add skill generation status to file tree:
   - Show indicator on categories that have generated skills
   - Optional: show skill folder in file tree

## Success Criteria

- [ ] Button generates skill for current topic
- [ ] Batch generation works for all categories
- [ ] Loading states and error handling
- [ ] Success feedback with output path
