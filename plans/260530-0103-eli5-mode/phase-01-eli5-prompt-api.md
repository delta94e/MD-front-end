---
phase: 1
title: "ELI5 Prompt & API"
status: completed
priority: P2
effort: "30min"
dependencies: []
---

# Phase 1: ELI5 Prompt & API

## Overview

Add ELI5 system prompt and update the Explain API route to accept a `mode` parameter.

## Requirements

- Functional: New `explainELI5` system prompt that uses analogies, avoids jargon
- Functional: Explain API reads `mode` from request body, selects prompt accordingly
- Non-functional: Backward compatible — no mode = technical (current behavior)

## Related Code Files

- Modify: `lib/ai-helpers.ts` — add `explainELI5` to SYSTEM_PROMPTS
- Modify: `app/api/explain/route.ts` — read mode, select prompt

## Implementation Steps

1. Add to `SYSTEM_PROMPTS` in `lib/ai-helpers.ts`:
   ```
   explainELI5: "You explain technical concepts to a complete beginner. Use everyday analogies and real-world examples. Avoid jargon — if you must use a technical term, immediately explain it in simple words. Use a friendly, encouraging tone. Format with markdown. Keep explanations under 200 words unless the concept is very complex."
   ```
2. Update `app/api/explain/route.ts`:
   - Read `body.mode` (default: "technical")
   - If mode === "eli5": use `SYSTEM_PROMPTS.explainELI5`
   - Else: use `SYSTEM_PROMPTS.explain`

## Success Criteria

- [ ] `explainELI5` prompt exists in ai-helpers.ts
- [ ] API route accepts `mode` parameter
- [ ] ELI5 mode uses simplified prompt
- [ ] Default behavior unchanged (backward compatible)
