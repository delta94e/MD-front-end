# Code Review: daily.dev Crawler Feature

**Date:** 2026-05-29
**Files reviewed:** 5 files + 1 dependency (`lib/content-crawler.ts`)

## Files

| File | LOC | Role |
|------|-----|------|
| `lib/daily-dev/types.ts` | 62 | TypeScript interfaces |
| `lib/daily-dev/client.ts` | 216 | GraphQL client + rate limiter |
| `lib/daily-dev/crawler.ts` | 152 | Crawl orchestrator |
| `app/api/daily-dev/route.ts` | 46 | POST endpoint |
| `components/daily-dev-tab.tsx` | 210 | UI component |

---

## Critical Issues

### 1. Unbounded recursion on HTTP 429 — `client.ts:104-109`

```ts
if (res.status === 429) {
  const retryAfter = Number(res.headers.get("retry-after") || "5");
  await new Promise((r) => setTimeout(r, retryAfter * 1000));
  return executeQuery(query, variables); // no depth limit
}
```

If daily.dev keeps returning 429 (extended outage, IP ban), this recurses until stack overflow. **Fix:** add a `retries` counter (max 3), throw after limit.

### 2. XSS via crawled content rendered with `rehype-raw`

`markdown-viewer.tsx` uses `rehype-raw` which renders raw HTML inside markdown. Crawled content from arbitrary external sites can contain `<script>`, `<img onerror=...>`, event handlers, etc. If crawled articles are ever displayed in the markdown viewer, this is a stored XSS vector.

**Fix:** Either strip HTML from crawled content before storage, or use `rehype-sanitize` alongside `rehype-raw`.

---

## High Priority

### 3. No authentication on API endpoint — `route.ts`

The POST `/api/daily-dev` endpoint is completely unauthenticated. Any external caller can trigger Puppeteer browser launches against arbitrary URLs (via the daily.dev feed). This is a resource exhaustion / denial-of-service vector.

**Fix:** At minimum, check for a valid session or API key.

### 4. No API-level rate limiting — `route.ts`

Multiple concurrent requests each spawn their own Puppeteer instance (2 concurrent pages each, per `MAX_CONCURRENT`). 10 concurrent requests = 20 browser pages, ~2-4GB RAM.

**Fix:** Add a semaphore or use an in-memory rate limiter (e.g., `lru-cache` with rate limiting).

### 5. Module-level rate limiter is ineffective — `client.ts:73-84`

`lastRequestTime` is module-scoped. In Next.js serverless (or even long-running with multiple workers), each invocation gets a fresh module instance, so `lastRequestTime` starts at 0 every time. The rate limiter only serializes within a single request handler call, not across concurrent requests.

**Fix:** Use a shared store (Redis, or a process-level singleton with a lock) or accept that rate limiting only applies per-request-batch.

### 6. `first` parameter not validated in `fetchFeed` — `client.ts:176`

`fetchFeed` accepts `first` without bounds checking. A caller could pass `first: -1` or `first: 10000`. The API route validates (1-50), but `fetchFeed` is also exported and usable directly.

**Fix:** Add `Math.min(Math.max(first, 1), 50)` or validate + throw.

---

## Medium Priority

### 7. No runtime validation on GraphQL response shape — `client.ts:165`

`n.type as DailyDevPost["type"]` is a type assertion. If daily.dev adds a new post type (e.g., `"ShortVideo"`), it silently passes through as a valid type. Downstream code may not handle it.

**Fix:** Validate against the known union, default to `"Article"` for unknowns.

### 8. `after` cursor not validated — `route.ts:11`

The `after` parameter is a string passed directly from user input to the GraphQL query. While GraphQL variables handle injection safely, there's no length limit. A megabyte-long string could cause issues.

**Fix:** Validate `after` is null or a string under 256 chars.

### 9. Error messages leak internal details — `route.ts:42`

`err.message` is returned directly to the client. Internal errors from Puppeteer, file system, or Node.js can contain file paths, stack traces, or environment details.

**Fix:** Return generic messages to client, log full errors server-side.

### 10. `crawlUrl` called with untrusted `permalink` — `crawler.ts:62`

The `post.permalink` from daily.dev's API is passed to `crawlUrl`. The `isSafeUrl` check in `content-crawler.ts` blocks localhost and private IPs, which is good. However, it does NOT block:
- `file://` protocol (caught by the protocol check — OK)
- Cloud metadata endpoints via DNS rebinding (e.g., `169.254.169.254` is blocked, but custom DNS pointing to it is not)

The existing SSRF protection is reasonable for this threat model.

### 11. `onProgress` callback is server-side only — `crawler.ts:108`

The `onProgress` callback is defined in the interface but the API endpoint never uses it (can't stream to client with a simple JSON response). The UI shows progress based on the request lifecycle, not actual crawl progress.

**Fix:** Either remove `onProgress` (YAGNI) or implement SSE/streaming for real progress.

---

## Low Priority

### 12. `key={i}` in article list — `daily-dev-tab.tsx:145`

Using array index as React key. Acceptable since the list is append-only and never reordered, but fragile if filtering is added later.

### 13. No barrel `index.ts` — `lib/daily-dev/`

Missing `index.ts` to re-export public API. Callers must import from submodules directly.

### 14. `handleSaveArticle` filename sanitization could produce empty string — `daily-dev-tab.tsx:67`

If the title is all special characters (e.g., `"!@#$%"`), the sanitized result is empty, producing `.md` as filename.

**Fix:** Fallback to `article.id` or `"untitled"`.

---

## Positive Observations

- **SSRF protection in `content-crawler.ts`** is solid: blocks localhost, private IPs, and non-HTTP protocols.
- **Concurrency limiter** in `crawler.ts` (`runWithLimit`) is correctly implemented for single-threaded JS.
- **Input validation** on the API route is good: ranking allowlist, `first` bounds.
- **Error propagation** pattern in `processPost` is clean: errors don't crash the batch, they're captured per-article.
- **GraphQL query structure** is correct with proper `edges`/`node`/`pageInfo` pattern.
- **Puppeteer page cleanup** in `finally` block prevents resource leaks.

---

## Recommended Actions (Priority Order)

1. **Fix unbounded 429 retry** — add max retry count (trivial fix, prevents stack overflow)
2. **Add `rehype-sanitize`** or strip HTML from crawled content before display
3. **Add basic auth** or session check on the API route
4. **Add API-level rate limiter** (even a simple in-memory token bucket)
5. **Validate `first` in `fetchFeed`** for direct callers
6. **Sanitize error messages** returned to client

---

## Unresolved Questions

- Is the daily.dev API truly anonymous, or does it require an API key at scale? If rate-limited by IP, serverless deployments may hit limits quickly.
- Should crawled content be persisted (file/DB) or re-crawled each time? Re-crawling is expensive with Puppeteer.
- Is there a plan to add pagination UI for the feed, or is single-page sufficient?
