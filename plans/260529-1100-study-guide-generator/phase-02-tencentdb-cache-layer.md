---
phase: 2
title: "TencentDB Cache Layer"
status: pending
priority: P2
effort: "2h"
dependencies: []
---

# Phase 2: TencentDB Cache Layer

## Overview

Integrate TencentDB-Agent-Memory as a local cache layer. Store crawled content and generated study guides to avoid re-crawling and re-generating, saving API tokens.

## Requirements

- Install `@tencentdb-agent-memory/memory-tencentdb`
- Initialize with local SQLite backend (no external services)
- Cache crawled content by URL hash
- Cache generated study guides by content hash
- Retrieve cached results on repeat requests
- TTL: 7 days (configurable)

## Architecture

```
Request → Check cache (URL hash)
  → Hit: return cached study guide
  → Miss: crawl → generate → save to cache → return
```

## Related Code Files

- Create: `lib/content-cache.ts` — TencentDB wrapper for caching
- New dep: `@tencentdb-agent-memory/memory-tencentdb`

## Implementation Steps

1. Install TencentDB:
   ```bash
   npm install @tencentdb-agent-memory/memory-tencentdb
   ```

2. Create `lib/content-cache.ts`:
   - Initialize TencentDB with SQLite backend (local file: `./data/content-cache.db`)
   - `getCachedContent(url: string): Promise<CachedEntry | null>`
   - `setCachedContent(url: string, content: string, studyGuide?: string): Promise<void>`
   - `hashUrl(url: string): string` — SHA-256 hash of URL for cache key
   - TTL check: skip cache entries older than 7 days

3. Cache entry type:
   ```ts
   interface CachedEntry {
     urlHash: string;
     url: string;
     title: string;
     crawledContent: string;
     studyGuide?: string;
     createdAt: number;
     expiresAt: number;
   }
   ```

4. Fallback if TencentDB install fails:
   - Use simple JSON file cache (`./data/content-cache.json`)
   - Same API, different backend
   - Log warning about fallback mode

## Success Criteria

- [ ] TencentDB initializes with local SQLite
- [ ] Cache hit returns stored content without crawling
- [ ] Cache miss triggers crawl and stores result
- [ ] TTL expiration works (7 days)
- [ ] Fallback to JSON file if TencentDB unavailable

## Risk Assessment

- **Medium risk:** TencentDB may have compatibility issues with Next.js. Mitigation: JSON file fallback.
- **Low risk:** SQLite file grows large. Mitigation: TTL cleanup, max cache size limit.
