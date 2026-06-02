# ELI5 Mode for Explain Tab

**Date**: 2026-05-30 01:08
**Severity**: Low
**Component**: AI Panel / Explain Tab / API Explain Route
**Status**: Resolved

## What Happened

Added an ELI5 (Explain Like I'm 5) mode to the existing Explain feature. Users can now toggle between "Technical" and "Simple" explanations when they select text in the document. Three files touched, zero new dependencies, full backward compatibility — default mode remains "technical".

## The Brutal Truth

This was a clean, straightforward feature. No horror stories here. The implementation took maybe 20 minutes across three files. The only mild annoyance is that the route handler builds its own prompt string instead of using the `explainELI5` system prompt defined in `ai-helpers.ts`. The system prompt exists but sits unused — the route hardcodes the ELI5 instructions directly into the user prompt. Not a bug, but a missed opportunity for consistency.

## Technical Details

**Files modified:**

- `lib/ai-helpers.ts:8-9` — Added `explainELI5` system prompt constant. Instructs AI to use analogies, avoid jargon, explain terms inline, stay under 200 words.
- `app/api/explain/route.ts:6-9` — Route now reads `body.mode` (defaults to `"technical"`). Uses a ternary to build a different user prompt for ELI5 mode. Does NOT switch system prompts — the `explainELI5` constant goes unused.
- `components/ai-panel.tsx:117` — `ExplainTab` gains `mode` state (`useState<"technical" | "eli5">("technical")`). Two toggle buttons (Technical/Simple) with active state via `variant` prop. ELI5 badge appears conditionally when Simple mode selected. Mode passed in `complete()` body at line 129.

**UI structure:**
```
[Technical] [Simple]  ← toggle buttons
              [ELI5]  ← badge, visible only in Simple mode
[Selected text preview]
[Explain Selection]
```

**API contract:**
```json
POST /api/explain
{
  "selectedText": "...",
  "surroundingContext": "...",
  "mode": "eli5" | "technical"
}
```

## What We Tried

1. Read existing code to understand the `createStreamingRoute` pattern and `ExplainTab` component.
2. Added system prompt constant to `ai-helpers.ts` — this was the "right" way to do it, keeping prompts centralized.
3. Updated the route to accept `mode` parameter. Chose to put ELI5 instructions in the user prompt rather than swapping system prompts, because `createStreamingRoute` takes a single `systemPrompt` argument and doesn't support dynamic switching without refactoring.
4. Added toggle UI using existing `Button` and `Badge` shadcn components. No new imports needed beyond what was already in the file.

## Root Cause Analysis

No root cause — this is a feature, not a failure. The minor design tension is between the clean abstraction (system prompt per mode) and the pragmatic reality (the route helper doesn't support prompt swapping). Chose pragmatism. The `explainELI5` constant in `ai-helpers.ts` is technically dead code right now. If the team ever refactors `createStreamingRoute` to accept a prompt selector function, it can be wired up.

## Lessons Learned

- **Start with the API contract.** Defining `{ mode: "eli5" | "technical" }` in the request body first made the UI trivial — just a state variable and two buttons.
- **Reused existing patterns.** The toggle UI mirrors the pattern in `TranslateTab` (direction toggle) and `WriteTab` (action buttons). Consistency beats novelty.
- **Dead code is acceptable when intentional.** The `explainELI5` system prompt exists as documentation of the intended prompt engineering, even if the route currently embeds instructions in the user message instead. Mark it with a comment if it bothers you.

## Next Steps

- None blocking. Feature works as specified.
- Optional: Refactor `createStreamingRoute` to accept a `(body) => systemPrompt` selector function, then wire up the `explainELI5` constant properly.
- Optional: Add a brief tooltip or label explaining what "Simple" mode does for first-time users.
