---
phase: 5
title: "Testing"
status: pending
priority: P2
effort: "2h"
dependencies: [1, 2, 3, 4]
---

# Phase 5: Testing

## Overview

Test the skill generator end-to-end: data extraction, SKILL.md generation, API endpoint, and UI integration.

## Related Code Files

- Create: `__tests__/skill-generator/topic-content-extractor.test.ts`
- Create: `__tests__/skill-generator/skill-generator-engine.test.ts`
- Create: `__tests__/api/generate-skills.test.ts`

## Implementation Steps

1. Unit tests for `topic-content-extractor.ts`:
   - Test `generateSkillName()` with various category names
   - Test `generateSkillDescription()` output length and format
   - Test `extractTopicSummary()` with sample markdown files

2. Unit tests for `skill-generator-engine.ts`:
   - Test SKILL.md output has valid YAML frontmatter
   - Test body is <300 lines
   - Test description is <200 chars
   - Test file writing creates correct directory structure

3. Integration test for API:
   - Test POST `/api/generate-skills` with single category
   - Test POST `/api/generate-skills` for all categories
   - Verify generated skills are valid

4. Manual validation:
   - Generate skill for 2-3 different topics
   - Verify SKILL.md content is meaningful and actionable
   - Test generated skill loads in Claude Code

## Success Criteria

- [ ] All unit tests pass
- [ ] API integration tests pass
- [ ] Generated SKILL.md passes Agent Skills Spec validation
- [ ] At least 3 topic skills generated and validated manually
