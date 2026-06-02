---
phase: 2
title: "Data Layer"
status: pending
priority: P2
effort: "2h"
dependencies: [1]
---

# Phase 2: Data Layer

## Overview

Build the data layer that extracts topic content and prepares it for skill generation. Reads markdown files per category, extracts key concepts, patterns, and code examples.

## Architecture

```
Topic Index (README.md)
    ↓
Topic Content Extractor (new)
    ↓
Skill Data Model (types)
    ↓
Skill Generator Engine (phase 3)
```

## Related Code Files

- Create: `lib/skill-generator/types.ts`
- Create: `lib/skill-generator/topic-content-extractor.ts`
- Modify: `lib/topic-index.ts` (if needed for additional data)

## Implementation Steps

1. Create `lib/skill-generator/types.ts` with interfaces:
   ```typescript
   interface SkillConfig {
     name: string;           // kebab-case, e.g. "react-hooks"
     description: string;    // trigger-focused, <200 chars
     topicCategory: string;  // original category name
     files: TopicFile[];     // source markdown files
   }

   interface SkillContent {
     config: SkillConfig;
     skillMd: string;        // generated SKILL.md content
     references?: string[];  // optional reference docs
   }
   ```

2. Create `lib/skill-generator/topic-content-extractor.ts`:
   - `extractTopicSummary(categoryId)` — reads all files in a category, extracts headers, key terms, code patterns
   - `generateSkillName(categoryName)` — converts "React Hooks" → "react-hooks"
   - `generateSkillDescription(category, files)` — produces pushy trigger description
   - `generateSkillBody(category, summaries)` — produces SKILL.md markdown body

3. Reuse `getTopicCategories()` and `getFilesForCategory()` from `lib/topic-index.ts`

## Success Criteria

- [ ] Types defined for skill generation pipeline
- [ ] Topic content extraction works for all categories
- [ ] Skill name generation produces valid kebab-case
- [ ] Description generation follows Agent Skills Spec (<200 chars, pushy triggers)
