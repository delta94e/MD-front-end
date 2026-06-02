---
phase: 6
title: "AI Integration"
status: completed
priority: P1
effort: "5h"
dependencies: [3, 4]
---

# Phase 6: AI Integration

## Overview

Implement 4 AI features using Vercel AI SDK: document summarization, contextual explanation, EN↔VI translation, and writing assistant. Create API route handlers, client-side streaming UI, and wire up the AI panel.

## Requirements

- Functional: Summarize docs, explain selected text, translate EN↔VI, writing assist (expand/fix/format)
- Non-functional: Streaming responses, markdown rendering of AI output, token-efficient prompts

## Architecture

```
AI Panel (client)
├── Tab: Summarize → useCompletion → /api/summarize
├── Tab: Explain → useCompletion → /api/explain (sends selection)
├── Tab: Translate → useCompletion → /api/translate (direction toggle)
└── Tab: Write → useCompletion → /api/writing-assist (action type)

API Routes (server):
├── /api/summarize/route.ts — streamText with summarization prompt
├── /api/explain/route.ts — streamText with explanation prompt + context
├── /api/translate/route.ts — streamText with translation prompt + direction
└── /api/writing-assist/route.ts — streamText with writing prompt + action

Shared:
├── lib/ai-helpers.ts — createStreamingRoute, prompt builders
└── lib/ai-prompts.ts — system prompts for each feature
```

## Related Code Files

- Create: `lib/ai-helpers.ts` (shared route logic)
- Create: `lib/ai-prompts.ts` (system prompts)
- Create: `app/api/summarize/route.ts`
- Create: `app/api/explain/route.ts`
- Create: `app/api/translate/route.ts`
- Create: `app/api/writing-assist/route.ts`
- Create: `components/ai-panel.tsx` (main AI panel with tabs)
- Create: `components/ai-summarize.tsx`
- Create: `components/ai-explain.tsx`
- Create: `components/ai-translate.tsx`
- Create: `components/ai-write.tsx`
- Create: `components/ai-response.tsx` (shared streaming response renderer)
- Modify: `components/ai-panel-shell.tsx` (replace placeholder with AI panel)

## Implementation Steps

1. Create `lib/ai-prompts.ts`:
   - `SUMMARIZE_SYSTEM`: "You are a concise technical summarizer. Output markdown. Focus on key concepts and takeaways."
   - `EXPLAIN_SYSTEM`: "You are a patient technical educator. Explain the selected text in simple terms for a Vietnamese developer. Use examples when helpful."
   - `TRANSLATE_SYSTEM`: "You are a technical translator (English ↔ Vietnamese). Preserve markdown formatting. Keep code blocks unchanged. Use natural Vietnamese, not word-for-word. Keep technical terms in English with Vietnamese explanation in parentheses if needed."
   - `WRITE_SYSTEM`: "You are a writing assistant for technical markdown documentation. Maintain the author's voice and technical accuracy."

2. Create `lib/ai-helpers.ts`:
   - `createStreamingRoute(systemPrompt, buildPromptFn)` — generic POST handler
   - `chunkMarkdown(content, maxTokens)` — split by headings for large docs
   - Validate input (max length, required fields)
   - Error handling (API key missing, rate limit, model error)

3. Create API route handlers (all follow same pattern):
   ```
   /api/summarize: POST { content: string }
   /api/explain: POST { selectedText: string, surroundingContext: string }
   /api/translate: POST { text: string, direction: 'en-to-vi' | 'vi-to-en' }
   /api/writing-assist: POST { text: string, action: 'expand'|'fix-grammar'|'format'|'simplify', fullDoc: string }
   ```
   Each: validate input → build prompt → streamText(google('gemini-2.0-flash')) → return toDataStreamResponse()

4. Create `components/ai-response.tsx`:
   - Shared component for streaming AI output
   - Uses `useCompletion` hook from ai/react
   - Renders response as markdown (react-markdown)
   - Loading state: pulsing dots
   - Error state: error message with retry button

5. Create `components/ai-summarize.tsx`:
   - One-click "Summarize" button
   - Sends current document content to /api/summarize
   - Shows streaming summary in AiResponse component
   - Chunk large docs (>5000 chars) and summarize sections, then merge

6. Create `components/ai-explain.tsx`:
   - Auto-captures selected text from viewer
   - Sends selectedText + surroundingContext to /api/explain
   - Shows explanation in AiResponse
   - Empty state: "Select text in the document and click Explain"

7. Create `components/ai-translate.tsx`:
   - Direction toggle: EN → VI / VI → EN
   - Input: selected text or full document
   - Shows streaming translation in AiResponse
   - "Copy translation" button

8. Create `components/ai-write.tsx`:
   - Action selector: Expand | Fix Grammar | Format | Simplify
   - Input: selected text from editor or free-form textarea
   - Shows result in AiResponse
   - "Insert into editor" button (replaces selection)

9. Create `components/ai-panel.tsx`:
   - Tabs: Summarize | Explain | Translate | Write
   - Each tab renders corresponding component
   - Header: "AI Assistant" + collapse button
   - Style: bg-secondary, 320px width, scrollable

10. Wire up AI panel:
    - Replace placeholder in `ai-panel-shell.tsx` with AiPanel
    - Action bar buttons open AI panel with correct tab pre-selected
    - When file changes: clear previous AI responses

11. Wire up selection capture:
    - On text selection in MarkdownViewer → capture selectedText
    - Pass to AI Explain component
    - Use `window.getSelection()` + parent paragraph for context

12. Run `npm run build` to verify

## Success Criteria

- [ ] Summarize: generates concise markdown summary of any document
- [ ] Explain: explains selected text in simple terms
- [ ] Translate: translates EN↔VI preserving markdown formatting
- [ ] Write: expand/fix/format/simplify text
- [ ] All AI responses stream in real-time (typewriter effect)
- [ ] AI output renders as markdown
- [ ] Large documents are chunked before sending to AI
- [ ] Error handling works (missing API key, rate limit, network error)
- [ ] Action bar buttons open AI panel with correct tab

## Risk Assessment

- **Risk:** Gemini API rate limits. **Mitigation:** Client-side rate limiting, queue requests, show friendly error.
- **Risk:** Large documents exceed token limits. **Mitigation:** Chunk by headings, summarize sections, merge results.
- **Risk:** Translation quality for technical content. **Mitigation:** Test with real markdown docs, iterate on system prompt.
- **Risk:** Missing API key crashes app. **Mitigation:** Check env var on startup, show setup instructions if missing.

## Security Considerations

- **API keys:** Never expose keys to client. All AI calls go through server route handlers.
- **Input validation:** Sanitize user input before sending to LLM. Max length limits.
- **Rate limiting:** Consider Upstash Redis rate limiting for production.
- **Prompt injection:** System prompts are hardcoded, user input goes in user message only.
