---
phase: 4
title: "Integration & Polish"
status: completed
priority: P2
effort: "1h"
dependencies: [3]
---

# Phase 4: Integration & Polish

## Overview

Final integration: error handling, edge cases, keyboard shortcut, and ensuring the feature works end-to-end smoothly.

## Requirements

- Error states for API failures, empty categories, network issues
- Keyboard shortcut to open Learning Path tab (e.g., `L` when AI panel focused)
- Empty state when no topic selected
- Ensure the feature doesn't break existing AI panel tabs

## Related Code Files

- Modify: `components/learning-path-tab.tsx` — error/empty states
- Modify: `components/keyboard-help-dialog.tsx` — add shortcut documentation
- Modify: `components/ai-panel.tsx` — ensure tab count doesn't break layout

## Implementation Steps

1. Add error handling to `learning-path-tab.tsx`:
   - Display error message if API returns non-200
   - Retry button on failure
   - Handle empty file list for a category

2. Add empty state:
   - Show illustration or message when no topic selected
   - Prompt user to select a topic

3. Update keyboard help dialog:
   - Document the new "Path" tab
   - Add any new keyboard shortcuts

4. Test end-to-end:
   - Select "JavaScript" → Generate → Verify 10+ ordered steps
   - Click a step → Verify file opens in viewer
   - Select "React" → Generate → Verify different ordering
   - Test with AI panel closed → Open → Switch to Path tab

5. Compile check:
   - Run `npm run build` to verify no TypeScript errors
   - Verify no console errors in dev mode

## Success Criteria

- [ ] Error states display user-friendly messages
- [ ] Empty state guides user to select a topic
- [ ] Keyboard help dialog updated
- [ ] `npm run build` passes with no errors
- [ ] End-to-end flow works: select → generate → view → open file

## Risk Assessment

- **Low risk:** Polish phase. Main risk is breaking existing AI panel layout with 5th tab.
- **Mitigation:** Test existing tabs still work after adding the new one.
