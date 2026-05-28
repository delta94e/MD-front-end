# AI Learning Path Generator — Ship Report

**Date**: 2026-05-29
**Severity**: Medium
**Component**: AI Panel / Learning Path API
**Status**: Resolved

## What Happened

Built and shipped the AI Learning Path Generator feature. Users can now request ordered study paths from the 485-file knowledge base. The feature spans a topic index (`lib/topic-index.ts`), type definitions (`lib/learning-path-types.ts`), an API route (`app/api/learning-path/route.ts`), and a UI tab (`components/learning-path-tab.tsx`). Touched existing files: `app/actions/files.ts`, `components/ai-panel.tsx`, `components/keyboard-help-dialog.tsx`.

## Key Decisions

- **Mimo API with JSON mode**: Used OpenAI-compatible JSON mode for structured output instead of free-form text parsing. Relied on `response_format: { type: "json_object" }` to enforce schema compliance. This eliminated regex extraction bugs we'd hit with the chat endpoint.
- **Server-side topic index**: Built a lightweight topic index in `lib/topic-index.ts` that maps file paths to topic metadata. Avoids scanning 485 files on every request.
- **shadcn/ui select component**: Added the select primitive for the topic dropdown. Consistent with existing UI patterns.

## What Worked

- JSON mode output made the LLM response parseable without fragile string manipulation.
- Code review caught three issues before they shipped: a missing `.catch()` on the fetch call, API error details leaking to the client, and an unsafe `body` type cast. All fixed in a single pass.

## What Could Improve

- The topic index is static — no hot-reload when files are added. A file watcher or rebuild step would help.
- No caching of LLM responses. Repeated requests for the same topic hit the API every time. A simple in-memory cache with TTL would cut costs.
- Error handling on the UI side is minimal. The user sees a generic toast on failure; we could surface more actionable messages (e.g., "topic not found" vs. "API rate limited").
