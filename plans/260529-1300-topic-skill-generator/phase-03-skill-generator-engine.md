---
phase: 3
title: "Skill Generator Engine"
status: pending
priority: P2
effort: "3h"
dependencies: [2]
---

# Phase 3: Skill Generator Engine

## Overview

Core engine that generates complete skill directories from topic data. Produces SKILL.md files following the Agent Skills Spec, with optional references.

## Architecture

```
SkillGeneratorEngine
├── generateSkill(categoryId) → SkillContent
├── generateAllSkills() → SkillContent[]
├── writeSkillToDisk(skill, outputPath)
└── writeAllSkillsToDisk(outputPath)
```

## Related Code Files

- Create: `lib/skill-generator/skill-generator-engine.ts`
- Create: `lib/skill-generator/skill-template.ts`
- Create: `app/api/generate-skills/route.ts`

## Implementation Steps

1. Create `lib/skill-generator/skill-template.ts`:
   - SKILL.md template with frontmatter placeholders
   - Body template with sections: Overview, Key Concepts, Common Patterns, Quick Reference, Related Files
   - Follow Agent Skills Spec: imperative form, pushy description, <300 lines

2. Create `lib/skill-generator/skill-generator-engine.ts`:
   - `generateSkillMd(config, topicSummaries)` — fills template with extracted content
   - `generateSkillDescription(category, fileCount)` — produces trigger-focused description
   - `buildSkillDirectory(skill)` — creates folder structure on disk
   - `generateAndWriteAll(outputDir)` — orchestrates full generation

3. Create `app/api/generate-skills/route.ts`:
   - POST endpoint: `{ categoryId?: string }` → generates skill(s)
   - If categoryId provided: generate single skill
   - If no categoryId: generate all skills
   - Returns: `{ skills: SkillConfig[], outputPath: string }`
   - Uses `createStreamingRoute` pattern or standard JSON response

4. Skill output structure per topic:
   ```
   .claude/skills/{topic-id}/
   ├── SKILL.md              (generated)
   └── references/
       └── key-concepts.md   (extracted from topic files)
   ```

## Success Criteria

- [ ] Engine generates valid SKILL.md per Agent Skills Spec
- [ ] Frontmatter has correct `name`, `description` fields
- [ ] Body is <300 lines with actionable content
- [ ] Description is <200 chars with specific triggers
- [ ] API endpoint returns generated skill data
- [ ] Skills written to `.claude/skills/` directory
