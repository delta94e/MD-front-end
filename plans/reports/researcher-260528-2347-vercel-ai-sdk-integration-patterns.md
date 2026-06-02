# Vercel AI SDK Integration Patterns for Next.js PKM App

**Date:** 2026-05-28 | **Status:** Research Complete

---

## 1. Architecture Overview

```
Client (React)  →  Route Handler (API)  →  Vercel AI SDK  →  LLM Provider
  useCompletion      /api/summarize         streamText()      Gemini/Claude
  useChat            /api/explain           generateText()
  fetch (stream)     /api/translate
```

**Key packages:** `ai`, `@ai-sdk/google` (Gemini), `@ai-sdk/anthropic` (Claude)

## 2. Core Patterns

### 2a. Streaming Text (Summarization, Translation)

**Route Handler** (`app/api/summarize/route.ts`):
```ts
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export async function POST(req: Request) {
  const { content } = await req.json();
  const result = streamText({
    model: google('gemini-2.0-flash'),
    system: 'You are a concise summarizer. Output markdown.',
    prompt: `Summarize this document in 3-5 bullet points:\n\n${content}`,
  });
  return result.toDataStreamResponse();
}
```

**Client** (`useCompletion` for single-turn tasks):
```ts
'use client';
import { useCompletion } from 'ai/react';

export function SummarizeButton({ docContent }: { docContent: string }) {
  const { completion, complete, isLoading } = useCompletion({
    api: '/api/summarize',
  });

  return (
    <>
      <button onClick={() => complete(docContent)} disabled={isLoading}>
        {isLoading ? 'Summarizing...' : 'Summarize'}
      </button>
      {completion && <div className="prose">{completion}</div>}
    </>
  );
}
```

### 2b. Contextual Explanations (Selected Text)

Send **selected text + surrounding paragraph** as context window:

```ts
// Client: capture selection
const selection = window.getSelection();
const selectedText = selection?.toString() || '';
const paragraph = selection?.anchorNode?.parentElement?.textContent || '';

complete('', {
  body: { selectedText, surroundingContext: paragraph },
});
```

**Route handler** receives both fields, builds prompt:
```ts
prompt: `Explain this text in simple terms (target: Vietnamese developer).\n
Selected: "${selectedText}"\nContext: "${surroundingContext}"`
```

### 2c. Translation (EN <-> VI)

Dedicated route with direction parameter:

```ts
const result = streamText({
  model: google('gemini-2.0-flash'),
  system: `You are a technical translator (English <-> Vietnamese).
Rules: Preserve markdown formatting. Keep code blocks unchanged.
Use natural Vietnamese, not word-for-word translation.
Keep technical terms in English with Vietnamese explanation in parentheses if needed.`,
  prompt: `Translate to ${direction}:\n\n${text}`,
});
```

**Direction toggle** in UI: `direction: 'en-to-vi' | 'vi-to-en'` passed as body param.

### 2d. Writing Assistant (Expand/Fix/Format)

Use `useChat` for multi-turn if user can refine, or `useCompletion` for one-shot:

```ts
// Route handler
const result = streamText({
  model: google('gemini-2.0-flash'),
  system: 'You are a writing assistant for technical markdown docs.',
  prompt: `${action}: "${selectedText}"\n\nFull document context:\n${fullDoc.slice(0, 3000)}`,
});
// action = 'expand' | 'fix-grammar' | 'format' | 'simplify'
```

## 3. Provider Comparison

| Dimension | Google Gemini 2.0 Flash | Claude 3.5 Sonnet |
|---|---|---|
| **Speed** | Faster (Flash optimized for speed) | Slower (thorough reasoning) |
| **Cost (input/output per 1M tokens)** | ~$0.10 / ~$0.40 | ~$3 / ~$15 |
| **Context window** | 1M tokens | 200K tokens |
| **Vietnamese quality** | Good | Better (nuanced translation) |
| **Streaming** | Excellent | Excellent |
| **Best for** | Summarization, translation, speed-critical | Complex explanation, writing quality |

**Recommendation:** Use **Gemini Flash as default** for cost/speed. Route "explain" and "writing assist" tasks to Claude when quality matters more than latency. Vercel AI SDK makes provider swapping trivial -- just change the model import.

## 4. Token Management & Cost Optimization

### Chunking large docs
```ts
// Split markdown by headings, send largest relevant section
function chunkMarkdown(md: string, maxTokens = 3000): string[] {
  const sections = md.split(/(?=^#{1,3} )/gm);
  // Merge small sections, split large ones at paragraph boundaries
  // Return chunks fitting within token budget
}
```

### Caching strategy
- **Route-level:** Cache `generateText` results by `(contentHash, action)` key using Vercel KV or Upstash Redis
- **Client-level:** Store last AI response in component state; show cached result instantly on re-trigger
- **Prompt caching (Gemini):** Use `cacheControl: { type: 'ephemeral' }` on system prompts to avoid re-processing static instructions

### Rate limiting
```ts
// In route handler, before calling streamText
import { Ratelimit } from '@upstash/ratelimit';
const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m') });
const { success } = await ratelimit.limit(userId);
if (!success) return new Response('Rate limited', { status: 429 });
```

## 5. UI Streaming Pattern

For **non-chat** streaming (summarize, translate, explain), prefer `useCompletion` over `useChat`:

```tsx
// Simplest streaming display
{completion && (
  <ReactMarkdown className="prose dark:prose-invert">
    {completion}
  </ReactMarkdown>
)}
```

For **AI writing assistant** (inline replacement), use `fetch` with manual stream reading:

```ts
const res = await fetch('/api/writing-assist', { method: 'POST', body });
const reader = res.body!.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  setAiSuggestion(prev => prev + decoder.decode(value));
}
```

## 6. Recommended API Routes Structure

```
app/api/
├── summarize/route.ts      # streamText → toDataStreamResponse
├── explain/route.ts        # streamText with context
├── translate/route.ts      # streamText with direction
└── writing-assist/route.ts # streamText with action type
```

All 4 routes share identical structure: validate input, build prompt, call `streamText`, return `toDataStreamResponse()`. Extract shared logic:

```ts
// lib/ai-helpers.ts
export function createStreamingRoute(systemPrompt: string) {
  return async (req: Request) => {
    const body = await req.json();
    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: systemPrompt,
      prompt: buildPrompt(body),
    });
    return result.toDataStreamResponse();
  };
}
```

## 7. Key Trade-offs

| Decision | Choice | Why |
|---|---|---|
| `useCompletion` vs `useChat` | `useCompletion` for 3/4 features | Single-turn tasks; `useChat` only for writing assistant with follow-up |
| Streaming vs blocking | Always streaming | Better UX for 500+ token responses |
| Gemini vs Claude default | Gemini Flash | 10-40x cheaper, fast enough for most tasks |
| Full doc vs chunked | Chunk by sections | Avoid hitting context limits; summarize per-section then merge |

## 8. Source Credibility Note

This report is based on Vercel AI SDK v4.x patterns from official docs (`sdk.vercel.ai`), the `ai` package source, and established Next.js App Router conventions. Web search was unavailable during research -- pricing figures and model availability should be verified against current provider pages before implementation.

---

**Unresolved Questions:**
1. Which LLM tier to use for dev vs production? (Gemini Flash free tier limits?)
2. Do we need auth before rate limiting, or use IP-based limits initially?
3. Should translation cache results per-paragraph or per-document?
4. Is streaming necessary for short responses (e.g., grammar fixes < 100 tokens)?
