---
phase: 2
title: "AI Path Generation API"
status: completed
priority: P2
effort: "2h"
dependencies: [1]
---

# Phase 2: AI Path Generation API

## Overview

Create an API route that takes a topic category (or free-text topic) and generates an ordered learning path using AI. Uses `generateObject` for structured output instead of streaming text.

## Requirements

- POST `/api/learning-path` accepts `{ topic: string, files: TopicFile[] }`
- Returns structured `{ steps: LearningPathStep[] }` where each step has file path, title, order, and rationale
- Uses existing `createAnthropic` provider from `lib/ai-helpers.ts`
- Zod schema for type-safe structured output

## Architecture

```
Client sends topic + file list → API route → AI generates ordered path → Structured response
```

The AI receives:
1. The selected topic/category name
2. The list of available files in that category (title + path)
3. Instructions to order them from beginner → advanced with rationale

## Related Code Files

- Create: `app/api/learning-path/route.ts`
- Create: `lib/learning-path-types.ts` — shared types + Zod schema
- Modify: `lib/ai-helpers.ts` — add `generateObject` helper if needed

## Implementation Steps

1. Create `lib/learning-path-types.ts`:
   ```ts
   import { z } from "zod";

   export const LearningPathStepSchema = z.object({
     order: z.number(),
     title: z.string(),
     path: z.string(),
     rationale: z.string(),
     estimatedMinutes: z.number().optional(),
   });

   export const LearningPathSchema = z.object({
     topic: z.string(),
     steps: z.array(LearningPathStepSchema),
     totalEstimatedMinutes: z.number().optional(),
   });

   export type LearningPathStep = z.infer<typeof LearningPathStepSchema>;
   export type LearningPath = z.infer<typeof LearningPathSchema>;
   ```

2. Create `app/api/learning-path/route.ts`:
   - Accept POST with `{ topic: string, files: TopicFile[] }`
   - Use `generateObject` from `ai` package with Anthropic provider
   - System prompt: "You are a senior frontend engineer creating study paths. Order files from foundational to advanced. Each step should build on previous knowledge."
   - User prompt: includes topic name and file list as context
   - Return structured `LearningPath` object

3. Add `generateObject` helper to `lib/ai-helpers.ts`:
   - Reuse existing `anthropic` provider
   - Export a `generateStructuredObject` function alongside existing `createStreamingRoute`

## Success Criteria

- [ ] POST `/api/learning-path` returns valid `LearningPath` JSON
- [ ] Steps are logically ordered (basics before advanced)
- [ ] Each step has a brief rationale (1-2 sentences)
- [ ] Error handling for invalid topic or empty file list
- [ ] Uses existing Anthropic provider (no new API keys)

## Risk Assessment

- **Medium risk:** AI may return files in wrong order or hallucinate paths. Mitigation: validate returned paths exist in the input file list.
- **Edge case:** Large categories (70 React files) may exceed context. Mitigation: cap at top 15-20 files, or let user select subcategory.
