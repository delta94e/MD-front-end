---
phase: 2
title: "Exercise Generator API"
status: completed
priority: P2
effort: "30min"
dependencies: []
---

# Phase 2: Exercise Generator API

## Overview

Create API route that takes note content and returns AI-generated exercises. Three types: predict-output, fix-bug, quiz (multiple choice). On-the-fly generation, no persistence.

## Requirements

- Functional: API accepts note content, returns JSON array of exercises
- Functional: Three exercise types: predict-output, fix-bug, quiz
- Functional: 3-5 exercises per request
- Non-functional: Uses existing Mimo API via `createStreamingRoute` pattern (but returns JSON, not stream)

## Architecture

```
POST /api/generate-exercises
Body: { content: string }
Response: Exercise[]

Exercise types:
├── predict-output: { type, code, question, answer, explanation }
├── fix-bug: { type, code, buggyLine, correctCode, explanation }
└── quiz: { type, question, options[], correctIndex, explanation }
```

## Related Code Files

- Create: `app/api/generate-exercises/route.ts`
- Modify: `lib/ai-helpers.ts` — add `generateExercises` system prompt

## Implementation Steps

1. Add to `SYSTEM_PROMPTS` in `lib/ai-helpers.ts`:
   ```typescript
   generateExercises:
     "You generate coding exercises from technical notes. Output ONLY valid JSON array. Each exercise has: type ('predict-output' | 'fix-bug' | 'quiz'), and type-specific fields. For predict-output: code, question, answer, explanation. For fix-bug: code, buggyLine, correctCode, explanation. For quiz: question, options (4 choices), correctIndex (0-3), explanation. Generate 3-5 exercises. Mix types. Keep code snippets short (<10 lines). All explanations in Vietnamese.",
   ```

2. Create `app/api/generate-exercises/route.ts`:
   ```typescript
   import { NextResponse } from "next/server";
   import { SYSTEM_PROMPTS } from "@/lib/ai-helpers";

   const MIMO_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1";
   const MIMO_MODEL = "mimo-v2.5-pro";

   export async function POST(req: Request) {
     const { content } = await req.json();
     if (!content) {
       return NextResponse.json({ error: "No content" }, { status: 400 });
     }

     const apiKey = process.env.MIMO_API_KEY;
     if (!apiKey) {
       return NextResponse.json({ error: "API key missing" }, { status: 500 });
     }

     const response = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
       method: "POST",
       headers: { "Content-Type": "application/json", "api-key": apiKey },
       body: JSON.stringify({
         model: MIMO_MODEL,
         messages: [
           { role: "system", content: SYSTEM_PROMPTS.generateExercises },
           { role: "user", content: `Generate exercises from this note:\n\n${content.slice(0, 4000)}` },
         ],
         temperature: 0.8,
       }),
     });

     const data = await response.json();
     const text = data.choices?.[0]?.message?.content ?? "[]";

     // Extract JSON from response (may be wrapped in markdown code block)
     const jsonMatch = text.match(/\[[\s\S]*\]/);
     if (!jsonMatch) {
       return NextResponse.json({ error: "Invalid response" }, { status: 500 });
     }

     const exercises = JSON.parse(jsonMatch[0]);
     return NextResponse.json(exercises);
   }
   ```

3. Error handling: wrap JSON.parse in try/catch, return empty array on failure

## Success Criteria

- [ ] `generateExercises` prompt exists in ai-helpers.ts
- [ ] API route returns JSON array of exercises
- [ ] Three exercise types supported
- [ ] Graceful error handling (invalid JSON → empty array)
