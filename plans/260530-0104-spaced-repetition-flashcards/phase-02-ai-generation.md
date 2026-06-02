---
title: "Phase 2: AI Generation"
description: "API endpoint to generate flashcards from markdown content using AI"
status: pending
priority: P2
effort: 3h
---

# Phase 2: AI Generation

## Overview

Create an API endpoint that takes markdown content and returns structured flashcard Q&A pairs. Follows the same non-streaming JSON pattern as `/api/study-guide`.

## Key Insights

- Use `response_format: { type: "json_object" }` for reliable JSON output (proven pattern in study-guide)
- Limit content to 15000 chars to stay within token limits
- Generate 5-15 cards per note (configurable)
- Each card needs front (question), back (answer), and tags

## Related Code Files

### Create
- `app/api/generate-flashcards/route.ts` — API endpoint
- `lib/flashcard-ai-prompts.ts` — System prompt (optional, can inline)

### Reference (read-only)
- `app/api/study-guide/route.ts:1-209` — Non-streaming JSON API pattern
- `lib/ai-helpers.ts:16-17` — MIMO_BASE_URL, MIMO_MODEL constants
- `lib/flashcard-types.ts` — Types from Phase 1

## Implementation Steps

### 2.1 Create API Route (`app/api/generate-flashcards/route.ts`)

Follow the study-guide pattern:
1. Accept `{ content: string, filePath?: string }` in POST body
2. Validate content length (max 15000 chars)
3. Call MIMO API with JSON response format
4. Parse response into `Flashcard[]`
5. Return `{ cards: Flashcard[] }`

System prompt:
```
You are a flashcard generator for technical learning materials.
Generate question-answer flashcards from the provided markdown content.

Rules:
- Generate 5-15 flashcards covering the most important concepts
- Each flashcard has a "front" (question) and "back" (answer)
- Questions should test understanding, not just memorization
- Answers should be concise but complete (1-3 sentences)
- Include "tags" array with 1-3 relevant topic tags
- Mix question types: conceptual, definition, application, comparison
- Questions should be self-contained (understandable without the source)
- Write in the same language as the source content

Return JSON:
{
  "cards": [
    {
      "front": "What is the purpose of useEffect in React?",
      "back": "useEffect lets you perform side effects in function components, such as data fetching, subscriptions, or DOM manipulation. It runs after render and can optionally clean up when the component unmounts.",
      "tags": ["react", "hooks", "side-effects"]
    }
  ]
}
```

### 2.2 Handle Edge Cases

- Empty content => 400 error
- Content too long => truncate with warning
- AI returns invalid JSON => 502 error with retry option
- AI returns empty cards array => return empty, let UI handle

### 2.3 Response Type

```typescript
// Response shape
interface GenerateFlashcardsResponse {
  cards: Array<{
    front: string;
    back: string;
    tags: string[];
  }>;
}
```

## Todo List

- [ ] Create `app/api/generate-flashcards/route.ts`
- [ ] Test with curl/Postman
- [ ] Verify JSON response structure
- [ ] Test edge cases (empty input, long input)

## Success Criteria

- POST `/api/generate-flashcards` with markdown content returns valid JSON
- Response contains 5-15 well-formed flashcard objects
- Each card has non-empty front, back, and tags
- Error responses are clear and actionable

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI returns malformed JSON | Medium | High | Use `response_format: { type: "json_object" }`, add JSON parse try/catch |
| Token limit exceeded | Low | Medium | Truncate content to 15000 chars before sending |
| Poor quality cards | Medium | Medium | Iterative prompt tuning; add card count parameter |

## Security Considerations

- Validate input length to prevent abuse
- No authentication needed (local app)
- API key handled server-side via env var
