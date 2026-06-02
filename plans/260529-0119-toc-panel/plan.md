---
title: "Auto-generated Table of Contents Panel"
description: "Add a TOC panel that extracts headings from markdown, provides clickable navigation, and highlights the current section via scroll spy."
status: in-progress
priority: P1
branch: "main"
tags: [toc, navigation, markdown, scroll-spy]
blockedBy: []
blocks: []
created: "2026-05-29T01:19:00Z"
createdBy: "ck:plan"
source: skill
---

# Auto-generated Table of Contents Panel

## Overview

Add a TOC panel that auto-extracts headings from the current markdown file, renders a clickable outline, and highlights the active section using IntersectionObserver scroll spy.

## Tech Stack

rehype-slug · react-markdown (existing) · IntersectionObserver API · Zustand (existing)

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Heading ID Generation](./phase-01-heading-ids.md) | Pending |
| 2 | [TOC Data Extraction](./phase-02-toc-extraction.md) | Pending |
| 3 | [TOC Panel Component](./phase-03-toc-panel.md) | Pending |
| 4 | [Scroll Spy](./phase-04-scroll-spy.md) | Pending |

## Dependencies

- Phase 2 depends on Phase 1 (headings need IDs)
- Phase 3 depends on Phase 2 (panel needs TOC data)
- Phase 4 depends on Phase 3 (scroll spy needs panel rendered)

## Key References

- Markdown viewer: `components/markdown-viewer.tsx`
- Content viewer: `components/content-viewer.tsx`
- Main layout: `app/page.tsx`
- Store: `lib/store.ts`
