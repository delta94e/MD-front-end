---
phase: 3
title: "Study Guide Generation API"
status: pending
priority: P2
effort: "2h"
dependencies: [1, 2]
---

# Phase 3: Study Guide Generation API

## Overview

Create API endpoint that orchestrates: cache check → crawl (if needed) → AI generation → cache save. Returns structured study guide.

## Requirements

- POST `/api/study-guide` accepts `{ url?: string, text?: string }`
- Check TencentDB cache first
- If URL and cache miss: crawl with Puppeteer
- If text: use directly (no crawling)
- Generate study guide via Mimo AI
- Save result to cache
- Return structured study guide

## Architecture

```
POST /api/study-guide
  → Validate input (url or text required)
  → Check cache (url hash or content hash)
  → Cache hit? → Return cached guide
  → Cache miss:
      → URL? → crawlUrl(url) → get content
      → Text? → use directly
      → Send to Mimo AI with study guide prompt
      → Save to cache
      → Return study guide
```

## Related Code Files

- Create: `app/api/study-guide/route.ts`
- Uses: `lib/content-crawler.ts`, `lib/content-cache.ts`, `lib/ai-helpers.ts`

## Implementation Steps

1. Create `app/api/study-guide/route.ts`:
   - Accept POST with `{ url?: string, text?: string }`
   - Validate: must have url or text
   - Generate cache key: hashUrl(url) or hashContent(text)
   - Check cache → return if hit
   - If URL: call `crawlUrl(url)`
   - If crawl error (captcha): return error with manual paste option
   - Build AI prompt with crawled content or pasted text
   - Call Mimo API (non-streaming, JSON mode for structured output)
   - Save to cache
   - Return study guide

2. AI prompt for study guide generation:
   ```
   System: You are a technical study guide creator. Given article content,
   create a structured study guide with:
   - Title and summary (2-3 sentences)
   - Key concepts (bullet points)
   - Important terms and definitions
   - Code examples (if applicable)
   - Practice questions (3-5)
   - Related topics to explore

   Return JSON: { title, summary, concepts[], terms[], examples[], questions[], relatedTopics[] }
   ```

3. Response type:
   ```ts
   interface StudyGuide {
     title: string;
     summary: string;
     concepts: string[];
     terms: { term: string; definition: string }[];
     examples: { code: string; explanation: string }[];
     questions: string[];
     relatedTopics: string[];
     sourceUrl?: string;
     cached: boolean;
   }
   ```

## Success Criteria

- [ ] POST with URL returns study guide (after crawling)
- [ ] POST with text returns study guide (no crawling)
- [ ] Cached results returned without re-crawling or re-generating
- [ ] Captcha errors handled gracefully
- [ ] Invalid input returns 400 error

## Risk Assessment

- **Medium risk:** Large articles may exceed AI context. Mitigation: truncate to 10K chars, summarize first.
- **Low risk:** Mimo API may not return valid JSON. Mitigation: retry once, fallback to plain text.
