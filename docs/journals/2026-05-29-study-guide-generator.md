# Study Guide Generator -- Feature Implementation

**Date**: 2026-05-29 13:09
**Severity**: Medium
**Component**: AI Panel / Content Crawling / Caching
**Status**: Resolved

## What Happened

Built a Study Guide Generator feature from scratch: a URL or raw text goes in, a structured study guide comes out via AI. Integrated as the 6th tab ("Guide") in the AI panel. The stack is Puppeteer (stealth) for crawling, cheerio for HTML-to-markdown, SQLite for local caching, and Mimo API for generation.

## The Brutal Truth

This feature sounds straightforward but the edge cases are brutal. Anti-bot protection on target sites forced us into Puppeteer with stealth measures -- a heavy dependency we now have to maintain. The code review caught a genuine SSRF vulnerability (we were blindly following URLs into private IP ranges), a Puppeteer race condition on the browser singleton, and prompt injection risks from untrusted crawled content. These were not theoretical -- they would have been exploited.

## Technical Details

**Core architecture:**
- `lib/content-crawler.ts`: Puppeteer singleton with mutex (`getBrowser()` returns a promise, not a raw instance). SSRF protection validates URL protocol (`http`/`https` only) and rejects private/reserved IP ranges.
- `lib/html-to-markdown.ts`: cheerio-based converter with captcha detection to avoid serving garbage to the AI.
- `lib/content-cache.ts`: SQLite (better-sqlite3) with WAL mode. Cache key = SHA-256 hash truncated to 16 chars. TTL = 7 days. Periodic cleanup via `cleanupExpired()` on an hourly interval, not per-request.
- `lib/study-guide-types.ts`: Shared `StudyGuide` interface -- DRY fix extracted after code review found the same shape duplicated in the API route and the UI component.
- `app/api/study-guide/route.ts`: POST endpoint. Content truncated to 12K chars to keep token costs sane. Wraps user content in `BEGIN_CONTENT`/`END_CONTENT` delimiters to mitigate prompt injection.

**Code review fixes (all critical):**
1. SSRF -- private IP validation added. Without this, `http://169.254.169.254` would have been fair game.
2. Prompt injection -- delimiter wrapping. Raw crawled HTML was being dumped straight into the prompt.
3. Browser race condition -- mutex on `getBrowser()`. Concurrent requests were spawning multiple browser instances.
4. Cache cleanup -- hourly `cleanupExpired()`. Without it, stale entries pile up forever.
5. Input validation -- `MAX_INPUT_LENGTH` on text paste. Users could send megabytes of raw text.
6. Browser cleanup -- `SIGTERM`/`SIGINT` handlers. Orphaned Chromium processes are a nightmare.
7. Unsafe `JSON.parse` -- try/catch around cache reads. Corrupt entries crash the request.
8. Clipboard fallback -- textarea fallback for non-HTTPS contexts. `navigator.clipboard.writeText()` fails on HTTP.
9. DRY violation -- extracted shared `StudyGuide` interface.

**Key decisions:**
- `better-sqlite3` directly instead of any ORM or the TencentDB-Agent-Memory plugin (which is an OpenClaw plugin, not standalone -- misleading name).
- 12K content truncation. Enough context for a solid study guide, low enough to keep costs reasonable.
- Hourly cache cleanup instead of per-request. Avoids latency spikes on every API call.

## What We Tried

- Initially used raw `fetch` for crawling. Hit Cloudflare and similar protections immediately. Switched to Puppeteer with `puppeteer-extra-plugin-stealth`. Heavy but necessary.
- Considered using a managed cache (Redis). Overkill for a local-first feature. SQLite with WAL mode is sufficient and has zero infrastructure requirements.
- First pass at the prompt had no content delimiters. Code review flagged that crawled HTML could contain adversarial instructions. Added `BEGIN_CONTENT`/`END_CONTENT` wrapping.

## Root Cause Analysis

The SSRF vulnerability existed because the initial implementation trusted user-provided URLs without validation. The Puppeteer race condition existed because the singleton pattern was implemented as a simple `if (!browser)` check without accounting for concurrent async calls. Both are classic "works in development, exploited in production" patterns.

## Lessons Learned

1. **Always validate URLs server-side.** User-provided URLs are untrusted input. Protocol checks and IP range validation are not optional.
2. **Singleton patterns in async contexts need mutexes.** A simple null check is a race condition. Use a promise-based lock.
3. **Wrap untrusted content in delimiters before sending to LLMs.** Prompt injection from crawled content is real.
4. **Handle process cleanup for heavy dependencies.** Puppeteer spawns Chromium. SIGTERM/SIGINT handlers are mandatory.
5. **Code review caught 9 issues the implementation missed.** This is why we have code review.

## Next Steps

- Monitor cache hit rates and adjust TTL if needed.
- Consider adding retry logic for transient Puppeteer failures.
- Track AI token usage per study guide to validate the 12K truncation threshold.
- Add rate limiting on the API endpoint to prevent abuse.
