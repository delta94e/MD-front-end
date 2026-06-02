---
phase: 1
title: "Research"
status: pending
priority: P2
effort: "1h"
dependencies: []
---

# Phase 1: Research

## Overview

Research existing skill template structures, understand the Agent Skills Spec, and design the skill generation approach.

## Key Insights

- Skill = folder with `SKILL.md` (required) + optional `scripts/`, `references/`, `assets/`
- SKILL.md requires YAML frontmatter: `name` (kebab-case), `description` (trigger-focused)
- SKILL.md body < 300 lines, references < 300 lines each
- `skill-creator` already has `init_skill.py` for scaffolding — can reuse patterns
- Topic index (`lib/topic-index.ts`) parses README.md to get categories + file lists
- Each category has: `id`, `name`, `files[]` with `title`, `path`, `category`

## Related Code Files

- Read: `~/.claude/skills/agent_skills_spec.md`
- Read: `~/.claude/skills/template-skill/SKILL.md`
- Read: `~/.claude/skills/skill-creator/SKILL.md`
- Read: `~/.claude/skills/skill-creator/scripts/init_skill.py`
- Read: `lib/topic-index.ts`
- Read: `lib/ai-helpers.ts`

## Implementation Steps

1. Analyze 3-5 existing skills to identify common SKILL.md patterns (frontmatter, structure, description style)
2. Study `init_skill.py` template to understand scaffolding logic
3. Map topic categories to skill naming convention (e.g., "React Hooks" → `react-hooks`)
4. Design skill content generation strategy: what goes in SKILL.md body per topic
5. Document findings in a brief design note

## Success Criteria

- [ ] Skill template structure documented
- [ ] Topic-to-skill naming convention defined
- [ ] Content generation strategy outlined
