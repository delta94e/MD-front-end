---
title: "AI Learning Path Generator"
description: "Generate ordered study paths from the 485-file knowledge base based on topic selection"
status: completed
priority: P2
branch: "main"
tags: [ai, learning-path, knowledge-base]
blockedBy: []
blocks: []
created: "2026-05-28T18:59:40.635Z"
createdBy: "ck:plan"
source: skill
---

# AI Learning Path Generator

## Overview

Add an AI-powered learning path generator to the Markdown Knowledge Hub. Users select a topic (e.g., "React Hooks", "Browser Rendering", "System Design"), and the AI generates an ordered study path through the knowledge base — telling them which files to read, in what order, with brief rationale for each step.

## Architecture

```
User selects topic → Topic Index (JSON) provides file list + metadata
→ AI generates ordered path with rationale → UI displays as vertical timeline
```

**Key decisions:**
- Topic index built from README.md categories + directory structure (no new deps)
- AI uses `generateObject` with Zod schema for structured output (not streaming text)
- Session-only paths (no persistence) — YAGNI for now
- New "Learning Path" tab in existing AI panel

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Topic Index Builder](./phase-01-topic-index-builder.md) | Completed | 2h |
| 2 | [AI Path Generation API](./phase-02-ai-path-generation-api.md) | Completed | 2h |
| 3 | [Learning Path UI](./phase-03-learning-path-ui.md) | Completed | 3h |
| 4 | [Integration & Polish](./phase-04-integration-polish.md) | Completed | 1h |

## Dependencies

- Phase 1 → Phase 2 (API needs topic index)
- Phase 2 → Phase 3 (UI needs API)
- Phase 3 → Phase 4 (polish after UI works)

## NOT in Scope

- Path persistence / user accounts
- Graph visualization of topic relationships
- Progress tracking / completion state
- Difficulty filtering
- Prerequisite auto-detection via LLM batch enrichment
