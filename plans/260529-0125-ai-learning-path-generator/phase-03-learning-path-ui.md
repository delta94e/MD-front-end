---
phase: 3
title: "Learning Path UI"
status: completed
priority: P2
effort: "3h"
dependencies: [2]
---

# Phase 3: Learning Path UI

## Overview

Add a "Learning Path" tab to the AI panel. Users select a topic from a dropdown, click generate, and see an ordered vertical timeline of files to study with rationale for each step.

## Requirements

- New tab in existing `AiPanel` component alongside Summarize/Explain/Translate/Write
- Topic dropdown populated from `getTopicCategories()` server action
- Vertical timeline display with step numbers, file titles, rationale, and click-to-open
- Loading state while AI generates
- Re-generate capability

## Architecture

```
AiPanel → LearningPathTab
  ├── TopicSelector (dropdown)
  ├── GenerateButton
  └── PathTimeline (vertical list of steps)
      └── PathStep (number, title, rationale, link)
```

## Related Code Files

- Create: `components/learning-path-tab.tsx` — main tab component
- Modify: `components/ai-panel.tsx` — add new tab trigger + content
- Modify: `lib/store.ts` — add `learningPathTopic` state if needed

## Implementation Steps

1. Create `components/learning-path-tab.tsx`:
   - `TopicSelector` — dropdown with all categories from server action
   - `GenerateButton` — calls POST `/api/learning-path` with selected topic
   - `PathTimeline` — vertical timeline rendering of `LearningPath.steps`
   - Each step shows: order number, file title, rationale, "Open" button
   - Clicking "Open" calls `setActiveFile(path, category)` from store

2. Style the timeline:
   - Vertical line with numbered circles (like roadmap.sh)
   - Category color coding using existing Tailwind theme colors
   - Steps animate in on generation (simple fade-in)
   - Responsive: works in the AI panel sidebar width (~300px)

3. Add tab to `ai-panel.tsx`:
   - New `TabsTrigger` with `Map` icon from lucide-react
   - `TabsContent` rendering `LearningPathTab`
   - Tab label: "Path" (keep short to fit 5 tabs)

4. Wire up "Open" action:
   - On step click, call `setActiveFile(step.path, category)` from zustand store
   - File opens in the main content viewer

## Success Criteria

- [ ] "Path" tab visible in AI panel with topic dropdown
- [ ] Selecting topic + clicking Generate shows loading state
- [ ] Generated path displays as vertical timeline with ordered steps
- [ ] Each step shows title, rationale, and clickable link
- [ ] Clicking a step opens the file in the content viewer
- [ ] Re-generate works (submits again with same topic)
- [ ] Responsive at 300px panel width

## Risk Assessment

- **Low risk:** UI is a simple form + list. No complex state management.
- **UX concern:** 5 tabs may feel cramped. Mitigation: use icon-only triggers with tooltips, or make the tab bar scrollable.
