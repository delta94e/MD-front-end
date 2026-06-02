---
phase: 4
title: "UI & Integration"
status: pending
priority: P2
effort: "2h"
dependencies: [3]
---

# Phase 4: UI & Integration

## Overview

Add a "Guide" tab to the AI panel. User inputs URL or pastes text, clicks generate, and sees a structured study guide. Auto-saves results to `ai-outputs/`.

## Requirements

- New "Guide" tab in AI panel (6th tab)
- Input: URL text field or pasted text area
- Generate button with loading state
- Display: structured study guide with sections
- Auto-save to `ai-outputs/study-guide-{title}-{date}.md`
- Error handling for crawl failures (show manual paste option)

## Architecture

```
AiPanel → StudyGuideTab
  ├── InputMode toggle (URL / Text)
  ├── URL input or Text area
  ├── Generate button
  └── StudyGuide display
      ├── Summary section
      ├── Key Concepts list
      ├── Terms & Definitions
      ├── Code Examples
      ├── Practice Questions
      └── Related Topics
```

## Related Code Files

- Create: `components/study-guide-tab.tsx`
- Modify: `components/ai-panel.tsx` — add "Guide" tab
- Uses: `lib/ai-output-saver.ts` for auto-save

## Implementation Steps

1. Create `components/study-guide-tab.tsx`:
   - `InputMode` toggle: "URL" | "Text"
   - URL mode: text input field
   - Text mode: textarea for pasting content
   - `GenerateButton`: calls POST `/api/study-guide`
   - `StudyGuideDisplay`: renders the structured guide
   - Loading state with progress indicator
   - Error state with retry + manual paste option

2. Style the study guide display:
   - Collapsible sections (summary, concepts, terms, etc.)
   - Code blocks with syntax highlighting
   - Practice questions as expandable cards
   - "Copy" button for each section
   - Responsive at 300px panel width

3. Add tab to `ai-panel.tsx`:
   - New `TabsTrigger` with `BookOpen` icon
   - `TabsContent` rendering `StudyGuideTab`
   - Tab label: "Guide"

4. Auto-save integration:
   - After generation, call `saveAiOutput("study-guide", title, markdownContent)`
   - Format as markdown with all sections

## Success Criteria

- [ ] "Guide" tab visible in AI panel
- [ ] URL input → generates study guide from crawled content
- [ ] Text input → generates study guide from pasted text
- [ ] Loading state shows during crawl + generation
- [ ] Error state shows for crawl failures with manual paste option
- [ ] Study guide displays with all sections
- [ ] Auto-saves to `ai-outputs/`
- [ ] Responsive at 300px panel width

## Risk Assessment

- **Low risk:** UI is straightforward form + display.
- **UX concern:** 6 tabs may be too many. Mitigation: use scrollable tab bar or icon-only triggers.
