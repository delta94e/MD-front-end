---
title: "Topic Skill Generator"
description: "Generate Claude Code skills from markdown topics in the Knowledge Hub. Each topic category gets a skill that teaches agents how to work with that topic's content."
status: completed
priority: P2
branch: "main"
tags: [skills, ai, agent, generator]
blockedBy: []
blocks: []
created: "2026-05-29T05:54:30.686Z"
createdBy: "ck:plan"
source: skill
---

# Topic Skill Generator

## Overview

Add a feature to the Markdown Knowledge Hub that generates Claude Code skills for each topic category. The system reads markdown files organized by topic, extracts key patterns and knowledge, then produces skill directories following the `.claude/skills` template structure (SKILL.md + optional scripts/references/assets).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Research](./phase-01-research.md) | Completed |
| 2 | [Data Layer](./phase-02-data-layer.md) | Completed |
| 3 | [Skill Generator Engine](./phase-03-skill-generator-engine.md) | Completed |
| 4 | [UI Integration](./phase-04-ui-integration.md) | Completed |
| 5 | [Testing](./phase-05-testing.md) | Completed |

## Dependencies

- Phase 2 depends on Phase 1 (research informs data model)
- Phase 3 depends on Phase 2 (needs topic data to generate skills)
- Phase 4 depends on Phase 3 (needs generator to wire UI)
- Phase 5 depends on all previous phases
