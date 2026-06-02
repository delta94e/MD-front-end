---
title: Annotation System for Markdown Viewer
description: >-
  Highlight text in markdown viewer, attach notes to specific positions, persist
  annotations separately
status: completed
priority: P2
branch: main
tags:
  - ui
  - annotations
  - highlights
  - notes
  - markdown
blockedBy: []
blocks: []
created: '2026-05-29T06:13:27.378Z'
createdBy: 'ck:plan'
source: skill
---

# Annotation System for Markdown Viewer

## Overview

Add an annotation system: select text in the markdown viewer → highlight it → attach a note. Annotations persist per-file in a local SQLite database. An annotation panel shows all annotations for the current file with click-to-navigate.

## Architecture

```
User selects text in MarkdownViewer
  → SelectionToolbar shows "Annotate" button
  → Click opens inline popover (color picker + note textarea)
  → Save annotation → SQLite (better-sqlite3)
  → Re-render: highlighted spans injected into markdown output
  → AnnotationPanel: list all annotations for active file
  → Click annotation → scroll to position in viewer
```

## Key Decisions

- **SQLite** (better-sqlite3) for persistence — same pattern as content-cache.ts
- **CSS-based highlighting** via custom rehype plugin that wraps annotated ranges in `<mark>` elements
- **Character offset-based positions** — store startOffset/endOffset relative to plain-text content for stability across re-renders
- **Inline popover** for annotation input (not a modal) — faster workflow

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Research & Design](./phase-01-research-design.md) | Completed | - |
| 2 | [Data Layer](./phase-02-data-layer.md) | Completed | - |
| 3 | [Highlight UI](./phase-03-highlight-ui.md) | Completed | - |
| 4 | [Annotation Panel](./phase-04-annotation-panel.md) | Completed | - |
| 5 | [Integration & Polish](./phase-05-integration-polish.md) | Completed | - |

## Dependencies

- Phase 1 → Phase 2 (data model from design)
- Phase 2 → Phase 3 (highlight rendering needs data)
- Phase 2 → Phase 4 (panel needs data)
- Phase 3 → Phase 5 (integration needs highlights)
- Phase 4 → Phase 5 (integration needs panel)

## NOT in Scope

- Collaborative/multi-user annotations
- Cloud sync
- PDF annotation
- Image annotation
- Rich text formatting in notes (plain text only)
