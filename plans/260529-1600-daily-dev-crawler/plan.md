# Plan: daily.dev Article Crawler → Markdown

## Context

User wants to crawl articles from app.daily.dev and convert them to markdown for the Knowledge Hub.

**Key finding:** daily.dev is a **link aggregator**, NOT a content host. External articles only have metadata (title, summary, tags, URL). Full text lives on the original site. Exception: "Freeform" squad posts store full markdown in daily.dev's DB.

## Crawling Strategy

| Content Type | Source | Method |
|---|---|---|
| Feed listing + metadata | `api.daily.dev/graphql` (anonymous) | GraphQL `ANONYMOUS_FEED_QUERY` |
| Freeform/Squad posts | daily.dev DB | `content` field = already markdown |
| External articles | Original site URL | Existing `crawlUrl()` + `extractContent()` |

## Existing Code to Reuse

- `lib/content-crawler.ts` — Puppeteer-based URL crawler (already handles anti-bot, timeouts)
- `lib/html-to-markdown.ts` — cheerio HTML-to-markdown converter

## Files to Create/Modify

| File | Action | Purpose |
|---|---|---|
| `lib/daily-dev/client.ts` | **Create** | GraphQL client for daily.dev API |
| `lib/daily-dev/types.ts` | **Create** | TypeScript types for posts, feeds |
| `lib/daily-dev/crawler.ts` | **Create** | Orchestrator: fetch feed → extract content → convert to md |
| `app/api/daily-dev/route.ts` | **Create** | API endpoint for crawling |
| `components/daily-dev-tab.tsx` | **Create** | UI tab in AI panel |
| `components/ai-panel.tsx` | **Modify** | Add "Daily" tab |

## Implementation Phases

### Phase 1: GraphQL Client + Types

**`lib/daily-dev/types.ts`**
```typescript
export interface DailyDevPost {
  id: string;
  title: string;
  permalink: string;
  summary: string;
  image: string;
  readTime: number;
  tags: string[];
  domain: string;
  author: { name: string; handle: string };
  source: { name: string; handle: string };
  numUpvotes: number;
  numComments: number;
  type: "Article" | "Freeform" | "Share" | "VideoYouTube";
  content?: string;        // Only for Freeform
  createdAt: string;
}

export interface DailyDevFeed {
  posts: DailyDevPost[];
  hasNextPage: boolean;
  endCursor: string | null;
}
```

**`lib/daily-dev/client.ts`**
- `fetchFeed(first?, after?, ranking?)` — anonymous GraphQL query
- `fetchPostById(id)` — single post with full fields
- Rate limit: 1 req/sec with exponential backoff

### Phase 2: Crawler Orchestrator

**`lib/daily-dev/crawler.ts`**
- `crawlDailyDevFeed(options)` — fetches feed, processes each post
- For Freeform: use `content` field directly
- For Articles: follow `permalink` → `crawlUrl()` from existing `content-crawler.ts`
- Returns `{ title, content (markdown), tags, author, source, url }[]`
- Concurrency: 2 parallel external fetches max

### Phase 3: API + UI

**`app/api/daily-dev/route.ts`**
- POST `{ ranking?, tags?, first?, after? }` → crawl and return markdown files

**`components/daily-dev-tab.tsx`**
- Feed type selector (Popular, Recent, Most Discussed)
- Tag filter input
- "Crawl" button with progress
- Results list with save-to-vault option

## Rate Limiting

- daily.dev GraphQL: 1 req/sec (undocumented, be conservative)
- External article sites: 1-2 req/sec per domain
- Max 50 posts per crawl batch

## Verification

1. Fetch popular feed → should return 50 posts with metadata
2. Freeform post → should return markdown content directly
3. External article → should crawl original site and convert to markdown
4. Rate limiting → no 429 errors
5. Error handling → graceful failure for blocked/slow sites
