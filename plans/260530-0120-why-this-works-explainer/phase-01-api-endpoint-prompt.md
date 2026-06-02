# Phase 1: API Endpoint + Prompt

## Overview
Create a `/api/why-explain` endpoint with a specialized prompt that elicits design rationale, trade-offs, and alternatives — not just behavior description.

## Related Code Files
- Create: `app/api/why-explain/route.ts`
- Read: `app/api/explain/route.ts` (reuse streaming pattern)
- Read: `lib/ai-helpers.ts` (add WHY system prompt)

## Implementation Steps

1. Add `whyExplain` system prompt to `lib/ai-helpers.ts`:
   ```
   You are a senior engineer explaining DESIGN RATIONALE, not behavior.
   For the given code, explain:
   1. WHY this approach was chosen (not WHAT it does)
   2. What trade-offs were made
   3. What alternatives exist and why they were rejected
   4. What problems this design solves
   Be concise. Use concrete comparisons. Max 200 words.
   ```

2. Create `app/api/why-explain/route.ts`:
   - Reuse `createStreamingRoute` from `ai-helpers.ts`
   - Accept `selectedText` + `surroundingContext` (full file or section)
   - The surrounding context is critical — AI needs to see the bigger picture to explain design decisions

3. Prompt construction:
   - Include selected code snippet
   - Include surrounding 2000 chars of context
   - Include file path (helps AI understand the module's role)

## Success Criteria
- [ ] `/api/why-explain` returns streaming response
- [ ] Response focuses on WHY, not WHAT
- [ ] Response mentions trade-offs and alternatives
- [ ] Works with code blocks, functions, and architectural patterns
