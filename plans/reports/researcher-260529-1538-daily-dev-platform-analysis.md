# daily.dev Platform Research Report

**Date:** 2026-05-29
**Status:** Complete
**Purpose:** Evaluate daily.dev for content crawling/extraction to markdown

---

## 1. What is daily.dev?

daily.dev is a **link-aggregation platform for developers** (think Hacker News for devs). It does NOT host full article content. It:

- Aggregates links to external blogs (Medium, Dev.to, Hashnode, personal blogs)
- Provides feed curation via upvotes, tags, sources, algorithms
- Has "Squads" (community discussions) where users post directly (Freeform posts)
- Offers AI features: Smart Prompts, Clickbait Shield, Briefing digests
- Open-source frontend: `github.com/dailydotdev/apps` (React/Next.js + browser extension)
- Backend: `github.com/dailydotdev/daily-api` (Fastify + Apollo GraphQL + PostgreSQL + ClickHouse)

**Key insight:** For external articles, daily.dev stores metadata (title, image, URL, summary, tags) but the full article text lives on the original site. For Freeform/Squad posts, content IS stored in daily.dev's DB.

---

## 2. API Availability

### Public REST API (Paid - Plus subscription required)

- **Base URL:** `https://api.daily.dev/public/v1`
- **Auth:** Bearer token (`Authorization: Bearer <token>`)
- **Token generation:** `https://app.daily.dev/settings/api` (configurable expiration)
- **OpenAPI spec:** `https://api.daily.dev/public/v1/docs/json` and `/yaml`
- **Requires:** Active Plus subscription

**Endpoints:**

| Category | Capabilities |
|----------|-------------|
| Feeds | Personalized, trending, tag-filtered, most discussed |
| Posts | Full details, summaries, engagement, comments |
| Search | Posts by keyword, tags, sources |
| Bookmarks | List, search, folders, add/remove |
| Custom Feeds | CRUD with filters and thresholds |
| Feed Filters | Follow/block tags/sources |
| Notifications | List, unread counts, mark as read |
| Profile | Get/update profile |
| Tech Stack | Add/remove/reorder tools |

### Internal GraphQL API (Free, cookie-auth)

- **Endpoint:** `https://api.daily.dev/graphql`
- **Auth:** Cookie-based (`credentials: 'include'`), optional for anonymous queries
- **Client:** `graphql-request` library
- **Schema:** Apollo-based, resolvers in `daily-api/src/schema`

**Key GraphQL queries (from source code):**

| Query | Purpose |
|-------|---------|
| `ANONYMOUS_FEED_QUERY` | Fetch feed without auth (works without login) |
| `FEED_QUERY` | Authenticated personalized feed |
| `SOURCE_FEED_QUERY` | Posts from a specific source |
| `TAG_FEED_QUERY` | Posts by tag |
| `POST_BY_ID_QUERY` | Single post with all fields |
| `POST_BY_ID_STATIC_FIELDS_QUERY` | Lighter single post fetch |
| `POST_CODE_SNIPPETS_QUERY` | Code snippets from a post |

**Anonymous feed query supports:**
- `$first` (page size), `$after` (cursor), `$ranking` (ordering), `$version` (algorithm)
- Returns: paginated `FeedPostConnection` with `hasNextPage`, `endCursor`

---

## 3. Content Structure

### Post fields available (from SharedPostInfo fragment):

**Metadata (always available):**
- `id`, `title`, `titleHtml`, `image`, `readTime`, `permalink`, `commentsPermalink`
- `summary`, `createdAt`, `tags`, `domain`, `slug`, `type`, `subType`
- `numUpvotes`, `numComments`, `numAwards`, `numReposts`
- `author` (name, handle, image, bio), `source` (name, handle, image)
- `language`, `clickbaitTitleDetected`, `translation`

**Full content (conditional):**
- `content` - markdown content (for Freeform/Squad posts only)
- `contentHtml` - rendered HTML (for Freeform/Squad posts only)
- `description` - article description
- `toc` - table of contents
- `videoId` - for YouTube posts

**Post types:** Article, Share, Freeform, SocialTwitter, VideoYouTube, Collection, Poll, LiveRoom

**Critical distinction:**
- **External articles (Article type):** Only metadata + external URL. Full text on original site.
- **Freeform/Squad posts:** Full content stored in daily.dev. `content` and `contentHtml` fields populated.
- **Collections:** Curated sets of posts with `sharedPost` references.

---

## 4. RSS Feeds

**Finding: No public RSS feeds confirmed.**

- `https://app.daily.dev/rss.xml` returns HTML page, not XML
- `https://app.daily.dev/api/feed/rss` returns 404
- No RSS `<link>` tags found in page source
- Official API docs make no mention of RSS
- The GraphQL codebase contains zero RSS-related code

**Possible community patterns (unverified):**
- `https://app.daily.dev/api/feed/tag/{tag}.rss`
- `https://app.daily.dev/api/feed/user/{username}.rss`

These are speculative and not confirmed. daily.dev appears to have deprecated or never shipped public RSS.

---

## 5. Web Scraping Feasibility

### Server-side rendering: YES

daily.dev uses Next.js with SSR. Pages are server-rendered, meaning:
- Standard HTTP requests (fetch/axios) can retrieve HTML with content
- No headless browser required for basic page scraping
- Post pages at `https://app.dev/{slug}` contain rendered content in HTML

### Scraping approach options:

| Approach | Feasibility | Notes |
|----------|------------|-------|
| GraphQL API (anonymous) | HIGH | `ANONYMOUS_FEED_QUERY` works without auth, returns structured JSON |
| REST Public API | MEDIUM | Best structured data, but requires Plus subscription ($$$) |
| HTML scraping | MEDIUM | SSR pages work, but HTML structure may change |
| RSS | NONE | No RSS feeds available |

### Recommended approach for crawling:

1. **Primary:** Use GraphQL API anonymously for feed listing and metadata
2. **For full text of external articles:** Follow `permalink` URL, scrape original source
3. **For Freeform posts:** Use `POST_BY_ID_QUERY` which returns `content` and `contentHtml`
4. **Convert to markdown:** Use `turndown` (HTML-to-markdown) or `content` field directly

---

## 6. Authentication Requirements

| Access Level | Auth Required | What You Get |
|-------------|--------------|--------------|
| Anonymous GraphQL | No | Feed listing, post metadata, tags, sources |
| Authenticated GraphQL | Cookie (login session) | Personalized feed, bookmarks, upvotes, user state |
| Public REST API | Bearer token + Plus sub | Full API access, search, bookmarks, custom feeds |

**Anonymous access is sufficient for:**
- Browsing public feeds
- Getting post metadata (title, image, summary, tags, author, source, URL)
- Fetching post details by ID
- Accessing Freeform post content

**Not available without auth:**
- Personalized feeds
- Bookmarks
- User-specific state (upvotes, read history)

---

## 7. Rate Limits

### Public REST API:
- **IP-based:** 300 requests/minute
- **User-based:** 60 requests/minute
- Headers: `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`
- 429 status with `retry-after` header

### GraphQL API (internal):
- No documented rate limits for anonymous access
- Likely has undocumented IP-based throttling
- Recommendation: 1-2 req/sec with exponential backoff

---

## 8. Existing Tools

### Found:

| Tool | Language | Stars | Status |
|------|----------|-------|--------|
| `Ben-Davis1/daily-dev-scraper` | JavaScript | 0 | Minimal (6 commits, no README) |

### Not found:
- No npm packages for daily.dev
- No Python libraries
- No well-maintained crawling tools

**Verdict:** Build from scratch. The GraphQL API approach is straightforward enough.

---

## 9. Content Format Per Article

### For external articles (most common):

```json
{
  "id": "post-id",
  "title": "Article Title",
  "image": "https://...",
  "permalink": "https://original-blog.com/article",
  "summary": "AI-generated or author summary",
  "readTime": 5,
  "createdAt": "2026-05-29T...",
  "tags": ["javascript", "react"],
  "domain": "blog.com",
  "author": { "name": "Author", "handle": "author", "image": "..." },
  "source": { "name": "Source Name", "handle": "source" },
  "numUpvotes": 42,
  "numComments": 7,
  "type": "Article"
  // NO content/contentHtml - must fetch from permalink
}
```

### For Freeform/Squad posts:

```json
{
  // ... all above fields plus:
  "content": "## Markdown content\n\nFull post text...",
  "contentHtml": "<h2>Markdown content</h2><p>Full post text...</p>",
  "type": "Freeform"
}
```

### For code snippets:

Available via `POST_CODE_SNIPPETS_QUERY` - returns paginated code blocks from posts.

---

## Practical Crawling Strategy

### Step 1: Fetch feed metadata via GraphQL

```
POST https://api.daily.dev/graphql
Query: ANONYMOUS_FEED_QUERY
Variables: { first: 50, after: null, ranking: POPULARITY }
```

Returns paginated list of posts with metadata.

### Step 2: For each post, determine type

- If `type === "Freeform"` -> use `content` field directly (markdown)
- If `type === "Article"` -> fetch `permalink` and extract content from original source

### Step 3: Extract full text from external articles

For external articles, use one of:
- `@mozilla/readability` + `jsdom` for article extraction
- `turndown` for HTML-to-markdown conversion
- Direct fetch of the permalink URL

### Step 4: Convert to markdown

- Freeform posts: `content` is already markdown
- External articles: fetch HTML from `permalink`, convert with `turndown`

### Rate limiting strategy:
- 1 req/sec to daily.dev GraphQL
- Respect `retry-after` headers
- Cache aggressively (posts don't change frequently)
- 1-2 req/sec to external article sites (varies by site)

---

## Unresolved Questions

1. **GraphQL anonymous query stability:** The internal GraphQL API is undocumented and could change without notice. How stable are the query names/fields?
2. **Freeform post volume:** What percentage of daily.dev content is Freeform vs external links? This affects how much content can be extracted directly vs requiring external scraping.
3. **Search capability:** Can the anonymous GraphQL API search by keyword, or is search Plus-only?
4. **Pagination limits:** Is there a maximum cursor depth for anonymous feed queries?
5. **Content freshness:** How often does the feed update? Are there stale cursor implications for crawling?
6. **Legal/ToS:** Does daily.dev's Terms of Service prohibit programmatic access via the internal GraphQL API?
