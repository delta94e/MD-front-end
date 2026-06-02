---
title: "Reading Mode with Typography Controls"
description: "Add a reading mode with adjustable typography (font size, line height, font family, reading width) and line focus dimming for distraction-free reading."
status: completed
priority: P2
branch: "main"
tags: [reading-mode, typography, ux, accessibility]
blockedBy: []
blocks: []
created: "2026-05-29T08:08:46.530Z"
createdBy: "ck:plan"
source: skill
---

# Reading Mode with Typography Controls

## Overview

Enhance the markdown viewer with a reading mode that provides typography controls (font size, line height, font family, reading width) and line focus dimming. Settings persist in localStorage.

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Typography Controls](./phase-01-typography-controls.md) | Completed | 3h |
| 2 | [Line Focus Dimming](./phase-02-line-focus-dimming.md) | Completed | 2h |
| 3 | [Integration & Polish](./phase-03-integration-polish.md) | Completed | 1h |

## Dependencies

- Phase 2 depends on Phase 1 (controls panel exists)
- Phase 3 depends on Phases 1+2

## Key Decisions

- **No new mode**: Enhance existing view mode, don't add a separate "reading mode" state. Toggle reading features via a settings popover.
- **CSS variables**: Apply typography via CSS custom properties on the viewer container, scoped to `.reading-mode`.
- **localStorage**: Persist preferences under key `reading-preferences`.
- **Line focus**: Pure CSS approach using `:hover` + sibling selectors, no JS scroll tracking needed.
