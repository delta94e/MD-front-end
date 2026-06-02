---
title: "Study Guide Generator with URL Crawling & TencentDB Cache"
description: "Crawl articles from URLs (with anti-crawl handling), cache in TencentDB, and generate study guides via AI"
status: completed
priority: P2
branch: "main"
tags: [ai, crawler, study-guide, tencentdb, cache]
blockedBy: []
blocks: []
created: "2026-05-29T04:09:25.200Z"
createdBy: "ck:plan"
source: skill
---

# Study Guide Generator with URL Crawling & TencentDB Cache

## Overview

Add a "Study Guide" feature: user provides a URL or pastes text → app crawls content (handling anti-crawl/captcha) → caches in TencentDB (local SQLite) → AI generates a structured study guide. Repeated URLs skip crawling and AI calls, saving tokens.

## Architecture

```
User inputs URL/text
  → Check TencentDB cache
  → Cache hit? → Return cached study guide
  → Cache miss?
      → URL? → Puppeteer crawl → cheerio extract → format markdown
      → Text? → Use directly
      → Send to Mimo AI → Generate study guide
      → Save to TencentDB cache
      → Return study guide
```

## Key Decisions

- **Puppeteer** for headless browsing (handles JS-heavy pages, basic anti-crawl)
- **cheerio** for HTML parsing and content extraction
- **TencentDB-Agent-Memory** (`@tencentdb-agent-memory/memory-tencentdb`) for local SQLite cache with semantic search
- **Mimo API** (existing) for study guide generation
- Cache key: URL hash (for URLs) or content hash (for pasted text)

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Content Crawler Infrastructure](./phase-01-content-crawler-infrastructure.md) | Completed | 3h |
| 2 | [TencentDB Cache Layer](./phase-02-tencentdb-cache-layer.md) | Completed | 2h |
| 3 | [Study Guide Generation API](./phase-03-study-guide-generation-api.md) | Completed | 2h |
| 4 | [UI & Integration](./phase-04-ui-integration.md) | Completed | 2h |

## Dependencies

- Phase 1 → Phase 3 (API needs crawler)
- Phase 2 → Phase 3 (API needs cache)
- Phase 3 → Phase 4 (UI needs API)

## NOT in Scope

- User accounts / cloud sync
- Multi-page crawling (single article only)
- Advanced captcha solving (CAPTCHA solving services)
- PDF/document parsing (URLs and plain text only)
