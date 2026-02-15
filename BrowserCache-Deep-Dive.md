# Browser Caching Mechanisms — Deep Dive

> 📅 2026-02-12 · ⏱ 20 phút đọc
>
> In-depth understanding of browser caching: locations, strategies, and real-world scenarios
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Performance & Networking Interview Essential

---

## Mục Lục

| #   | Section                                 |
| --- | --------------------------------------- |
| 1   | Why Caching Matters                     |
| 2   | 4 Cache Locations (Priority Order)      |
| 3   | Caching Process — First Request Flow    |
| 4   | Strong Cache (Expires + Cache-Control)  |
| 5   | Negotiated Cache (Last-Modified + ETag) |
| 6   | Complete Caching Mechanism Flowchart    |
| 7   | Cache-Control Decision Tree             |
| 8   | Real-World Caching Strategies           |
| 9   | User Behavior & Cache                   |
| 10  | Summary & Interview Checklist           |

---

## §1. Why Caching Matters

```
A DATA REQUEST HAS 3 STEPS:
═══════════════════════════════════════════════════════════════

  ① Initiate Network Request  ← caching helps here!
  ② Backend Processing
  ③ Browser Response           ← caching helps here!

  WITH CACHE:
  → Skip step ①: read directly from cache (no request!)
  → Optimize step ③: server says "not modified" → 304 (no body!)

  BENEFITS:
  → Shorter distance between request ↔ resource
  → Reduced latency
  → Less bandwidth & network load
  → Faster page loads!
```

---

## §2. Four Cache Locations (Priority Order)

```
CACHE LOOKUP ORDER:
═══════════════════════════════════════════════════════════════

  ①  Service Worker          ← highest priority
  ②  Memory Cache            ← fast but volatile
  ③  Disk Cache              ← persistent, slower
  ④  Push Cache (HTTP/2)     ← last resort
  ⑤  Network Request         ← if ALL miss!

  Browser checks each location IN ORDER.
  Only makes a network request if NONE have the resource.
```

### 2a. Service Worker Cache

```
SERVICE WORKER:
═══════════════════════════════════════════════════════════════

  → Independent thread running in background
  → Requires HTTPS (intercepts requests → security!)
  → Full control over what/how to cache
  → Cache is PERSISTENT (survives tab close!)

  3 STEPS:
  ① Register Service Worker
  ② Listen to 'install' event → cache required files
  ③ Intercept 'fetch' event → serve from cache or network

  KEY BEHAVIOR:
  → If SW doesn't find cache → falls back to normal priority
  → But browser ALWAYS shows "from Service Worker" in DevTools
     (even if data actually came from Memory/Disk/Network!)

  USE CASES:
  → Offline-first PWAs
  → Custom caching strategies (cache-first, network-first)
  → Background sync
```

```javascript
// Service Worker — basic caching example
const CACHE_NAME = "my-cache-v1";
const URLS_TO_CACHE = ["/", "/styles.css", "/app.js"];

// Install: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    }),
  );
});

// Fetch: serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
```

### 2b. Memory Cache (in-memory)

```
MEMORY CACHE:
═══════════════════════════════════════════════════════════════

  → Stores resources already fetched in current page
  → Fastest read speed (RAM access!)
  → Extremely short lifespan: RELEASED when TAB CLOSES!
  → Limited capacity (OS manages memory carefully)

  WHAT GETS CACHED IN MEMORY?
  → Preloaded resources: <link rel="prefetch">
  → Small files (scripts, styles, images already downloaded)
  → Resources from preloader (browser pre-parses JS/CSS)

  IMPORTANT:
  → Memory cache IGNORES Cache-Control header!
  → Matching checks: URL + Content-Type + CORS headers

  WHEN YOU REFRESH A PAGE:
  → Many resources show "from memory cache" in DevTools
  → Because tab is still open → memory cache still alive!

  RULE OF THUMB:
  → Large files → probably NOT in memory (disk instead)
  → High system memory usage → disk preferred
  → Small files + low memory pressure → memory preferred
```

### 2c. Disk Cache

```
DISK CACHE:
═══════════════════════════════════════════════════════════════

  → Stored on HARD DRIVE (HDD/SSD)
  → Slower than memory, but MORE capacity + PERSISTENT
  → Survives tab close, browser restart!
  → BROADEST coverage of all cache types

  KEY FEATURES:
  → Decides what to cache based on HTTP headers
  → Determines if cached resource can be reused
  → Knows when cached resource has expired
  → Works CROSS-SITE: same URL cached once, shared across sites!

  The vast majority of caching comes from Disk Cache.
  → "from disk cache" in DevTools Network tab
```

### 2d. Push Cache (HTTP/2)

```
PUSH CACHE (HTTP/2 Server Push):
═══════════════════════════════════════════════════════════════

  → Used ONLY when Service Worker + Memory + Disk all MISS
  → Exists only within a SESSION (connection)
  → Released when connection closes
  → Very short duration: ~5 minutes in Chrome
  → Does NOT strictly follow HTTP cache headers!

  KEY FACTS (from Jake Archibald's research):
  → All resources can be pushed (Edge/Safari = weak support)
  → Can push no-cache and no-store resources!
  → Released when connection closes
  → Multiple pages can share same HTTP/2 connection → same Push Cache
  → Push cache can only be used ONCE
  → Browser can REFUSE push of existing resources
  → Can push resources to OTHER DOMAINS

  → Very limited adoption in practice (HTTP/2 not universal)
```

---

## §3. Caching Process — First Request Flow

```
FIRST REQUEST — ESTABLISHING CACHE:
═══════════════════════════════════════════════════════════════

  Browser                Browser Cache              Server
  ───────                ─────────────              ──────
     │                         │                       │
     │──── First HTTP Request ─┤                       │
     │                         │                       │
     │   No cache found!       │                       │
     │                         │──── Forward Request ──→│
     │                         │                       │
     │                         │←── Response + Headers ─│
     │                         │    (Cache-Control,     │
     │                         │     ETag, Last-Modified│
     │                         │     Expires)           │
     │                         │                       │
     │   Store result +        │                       │
     │   cache identifier      │                       │
     │←── Return Response ─────│                       │
     │                         │                       │

  TWO GOLDEN RULES:
  ① Every request → browser checks cache FIRST
  ② Every response → browser STORES result + cache identifier

  → These two rules are the FOUNDATION of browser caching!
  → The cache behavior depends on RESPONSE HEADERS from first request
```

---

## §4. Strong Cache (Expires + Cache-Control)

```
STRONG CACHE — NO REQUEST TO SERVER:
═══════════════════════════════════════════════════════════════

  → Browser reads resource DIRECTLY from cache
  → NO network request at all!
  → DevTools shows: 200 (from disk cache) or (from memory cache)
  → Controlled by: Expires and Cache-Control headers

  Browser                Browser Cache
  ───────                ─────────────
     │                         │
     │──── Request Resource ──→│
     │                         │
     │   Cache found!          │
     │   Not expired!          │
     │                         │
     │←── 200 (from cache) ────│   ← No server contact!
     │                         │
```

### 4a. Expires (HTTP/1.0)

```
EXPIRES:
═══════════════════════════════════════════════════════════════

  Expires: Wed, 22 Oct 2025 08:41:00 GMT

  → Specifies an ABSOLUTE expiration date/time
  → Before this time → use cache directly
  → After this time → request server again
  → Used with Last-Modified

  ⚠️ FLAW: uses LOCAL CLOCK!
  → If user changes system time → cache may break!
  → Local time ≠ server time → unreliable!

  → Expires = max-age + request_time (effectively)
  → HTTP/1.0 product → considered OUTDATED
  → Still exists for backward compatibility
```

### 4b. Cache-Control (HTTP/1.1)

```
CACHE-CONTROL — THE KING OF CACHING:
═══════════════════════════════════════════════════════════════

  Cache-Control: max-age=300
  → Resource valid for 300 seconds from response time
  → Uses RELATIVE time (not absolute!) → no clock issues!

  ┌──────────────┬──────────────────────────────────────────────┐
  │ Directive     │ Meaning                                     │
  ├──────────────┼──────────────────────────────────────────────┤
  │ public       │ Cache anywhere (client + CDN/proxy)          │
  │ private      │ Cache ONLY on client (DEFAULT!)              │
  │              │ Proxies must NOT cache                       │
  │ no-cache     │ Cache BUT must validate with server first!   │
  │              │ (misleading name! it DOES cache!)            │
  │ no-store     │ Do NOT cache at all! No strong, no negotiated│
  │ max-age=N    │ Cache for N seconds (client)                 │
  │ s-maxage=N   │ Cache for N seconds (proxy/CDN only!)        │
  │              │ Overrides max-age AND Expires for proxies    │
  │ max-stale=N  │ Client accepts expired cache up to N seconds │
  │ min-fresh=N  │ Client wants cache fresh for at least N more │
  └──────────────┴──────────────────────────────────────────────┘

  COMBINING DIRECTIVES:
  Cache-Control: public, max-age=31536000
  → Cache everywhere, valid for 1 year!

  Cache-Control: private, no-cache
  → Cache on client only, but MUST validate every time!
```

```
public vs private — PROXY BEHAVIOR:
═══════════════════════════════════════════════════════════════

  Browser ←── Proxy1 ←── Proxy2 ←── Server

  public:
  → Proxy1 & Proxy2 CAN cache the response
  → Proxy1 serves cached copy to Browser directly!
  → Faster for shared resources (JS libs, images)

  private:
  → Proxies PASS THROUGH only, no caching!
  → Only Browser caches the response
  → For personalized/sensitive data (user profiles, auth)

  no-cache ≠ no-store:
  → no-cache: CACHES data, but validates EVERY TIME
  → no-store: NEVER stores anything. Period.
```

### 4c. Expires vs Cache-Control

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬─────────────────┬─────────────────────┐
  │                │ Expires         │ Cache-Control       │
  ├────────────────┼─────────────────┼─────────────────────┤
  │ HTTP Version   │ 1.0             │ 1.1                 │
  │ Time Type      │ ABSOLUTE date   │ RELATIVE seconds    │
  │ Clock Issue    │ ⚠️ Local time!  │ ✅ No clock issue   │
  │ Priority       │ Lower           │ HIGHER (overrides!) │
  │ Status         │ LEGACY/outdated │ Current standard    │
  └────────────────┴─────────────────┴─────────────────────┘

  If BOTH exist → Cache-Control WINS!
  Expires = backward compatibility only.

  STRONG CACHE LIMITATION:
  → Checks time only, NOT file content!
  → Server file may have changed, but cache still serves old version!
  → Solution: Negotiated Cache!
```

---

## §5. Negotiated Cache (Last-Modified + ETag)

```
NEGOTIATED CACHE — VALIDATE WITH SERVER:
═══════════════════════════════════════════════════════════════

  → Strong cache expired → browser asks server: "is my copy still good?"
  → Server checks → answers YES (304) or NO (200 + new resource)

  CASE 1: Cache VALID → 304 Not Modified (empty body!)

  Browser            Browser Cache            Server
  ───────            ─────────────            ──────
     │                     │                     │
     │── Request ─────────→│                     │
     │                     │  Cache expired!     │
     │                     │  Return cache ID    │
     │←─ Cache identifier ─│                     │
     │                                           │
     │── Request + cache ID ────────────────────→│
     │                                           │
     │←──────────── 304 Not Modified ────────────│
     │                     │                     │  (empty body!)
     │── Read from cache ─→│                     │
     │←─ Cached resource ──│                     │

  CASE 2: Cache INVALID → 200 + new resource

  Browser                                    Server
  ───────                                    ──────
     │── Request + cache ID ────────────────────→│
     │                                           │
     │←──── 200 OK + new resource + new headers ─│
     │        (new ETag, new Last-Modified)       │
```

### 5a. Last-Modified / If-Modified-Since

```
LAST-MODIFIED — FILE MODIFICATION TIME:
═══════════════════════════════════════════════════════════════

  FIRST REQUEST:
  Server Response Header:
  Last-Modified: Fri, 22 Jul 2016 01:47:00 GMT
  → Browser caches file + this timestamp

  SUBSEQUENT REQUEST:
  Browser Request Header:
  If-Modified-Since: Fri, 22 Jul 2016 01:47:00 GMT
  → "Hey server, has this file changed since this time?"

  SERVER CHECKS:
  → File modified AFTER this time → 200 + new file
  → File NOT modified → 304 Not Modified (use cache!)

  ⚠️ FLAWS:
  ① Opening a file without editing → Last-Modified CHANGES!
     → Server thinks it's modified → re-sends identical file!
     → Wasted bandwidth!

  ② Time precision = SECONDS only!
     → File modified within same second → NOT detected!
     → Server serves stale cache!

  → These flaws led to ETag in HTTP/1.1...
```

### 5b. ETag / If-None-Match

```
ETAG — CONTENT-BASED IDENTIFIER:
═══════════════════════════════════════════════════════════════

  FIRST REQUEST:
  Server Response Header:
  ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
  → Unique hash/fingerprint of the file CONTENT
  → Changes ONLY when file content actually changes!

  SUBSEQUENT REQUEST:
  Browser Request Header:
  If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
  → "Hey server, does this resource still match this ETag?"

  SERVER CHECKS:
  → ETag MATCHES → 304 Not Modified (use cache!)
  → ETag DIFFERENT → 200 + new resource + new ETag
```

### 5c. Last-Modified vs ETag

```
COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────┬─────────────────────┐
  │                 │ Last-Modified    │ ETag                │
  ├─────────────────┼──────────────────┼─────────────────────┤
  │ Based on        │ File mod TIME    │ File CONTENT hash   │
  │ Precision       │ ⚠️ Seconds only │ ✅ Exact content    │
  │ False positive  │ ⚠️ Open=changed │ ✅ No false changes │
  │ Load balancing  │ ⚠️ Diff servers  │ ✅ Content-based    │
  │                 │   = diff times!  │   = consistent!     │
  │ Performance     │ ✅ Just record   │ ⚠️ Hash computation │
  │                 │   timestamp      │   (CPU cost)        │
  │ Priority        │ Lower            │ HIGHER!             │
  └─────────────────┴──────────────────┴─────────────────────┘

  ACCURACY:   ETag > Last-Modified
  PERFORMANCE: Last-Modified > ETag (no hash calculation!)
  PRIORITY:   Server checks ETag FIRST!

  If BOTH exist → ETag takes precedence.
```

---

## §6. Complete Caching Mechanism Flowchart

```
FULL CACHE DECISION FLOW:
═══════════════════════════════════════════════════════════════

  Browser wants a resource
         │
         ▼
  ┌─────────────────────┐
  │ Check Browser Cache │
  └────────┬────────────┘
           │
           ▼
  ┌─────────────────────────────┐    YES
  │ Strong cache valid?         │──────────→ ✅ 200 (from cache)
  │ (Cache-Control / Expires)   │            No request to server!
  └────────┬────────────────────┘
           │ NO (expired)
           ▼
  ┌─────────────────────────────┐
  │ Send request to server      │
  │ with cache identifiers:     │
  │ • If-None-Match (ETag)      │
  │ • If-Modified-Since (LM)    │
  └────────┬────────────────────┘
           │
           ▼
  ┌─────────────────────────────┐    YES
  │ Server: resource changed?   │──────────→ 200 + new resource
  │ (compare ETag / Last-Mod)   │            + new cache headers
  └────────┬────────────────────┘            → Store in cache
           │ NO (unchanged)
           ▼
  ┌─────────────────────────────┐
  │ 304 Not Modified            │
  │ → Use cached version!       │
  │ (empty response body)       │
  └─────────────────────────────┘

  PRIORITY ORDER:
  ① Strong cache (Cache-Control > Expires)
  ② Negotiated cache (ETag > Last-Modified)

  NO CACHE HEADERS SET?
  → Browser uses HEURISTIC algorithm:
  → Cache time ≈ (Date - Last-Modified) × 10%
```

---

## §7. Cache-Control Decision Tree

```
HOW TO CHOOSE CACHE-CONTROL DIRECTIVES:
═══════════════════════════════════════════════════════════════

                  Can be reused?
                 /            \
               No              Yes
               │                │
          no-store         Requires fresh
                          validation every
                          time?
                         /            \
                       Yes             No
                        │               │
                   no-cache        Allow proxy
                                   cache?
                                  /        \
                                No          Yes
                                │            │
                           private        public
                                \          /
                                 \        /
                           Allow offline cache
                              for N seconds
                                    │
                              max-age=N
```

```
COMMON CONFIGURATIONS:
═══════════════════════════════════════════════════════════════

  Static assets (JS/CSS/images with hash):
  Cache-Control: public, max-age=31536000
  → 1 year! Change filename hash to bust cache.

  API responses (frequently changing):
  Cache-Control: no-cache
  → Always validate with server (ETag/Last-Modified)

  Sensitive data (user profiles):
  Cache-Control: private, no-cache
  → Client-only, always validate

  Never cache (real-time data):
  Cache-Control: no-store
  → No caching whatsoever!

  CDN with revalidation:
  Cache-Control: public, max-age=0, s-maxage=600
  → Browser always validates, CDN caches 10 min
```

---

## §8. Real-World Caching Strategies

### 8a. Frequently Changing Resources

```
STRATEGY: Cache-Control: no-cache
═══════════════════════════════════════════════════════════════

  → Force browser to validate with server EVERY time
  → Use ETag or Last-Modified to check if resource changed
  → Does NOT reduce number of requests
  → BUT significantly reduces RESPONSE SIZE (304 = no body!)

  USE CASES:
  → API endpoints returning dynamic data
  → HTML pages that change often
  → User-specific content
```

### 8b. Infrequently Changing Resources

```
STRATEGY: Cache-Control: max-age=31536000 (1 year!)
═══════════════════════════════════════════════════════════════

  → Cache for a VERY long time
  → No requests to server at all during cache period!
  → For updates: change FILENAME with hash/version

  EXAMPLES:
  → jquery-3.3.1.min.js     ← version in filename!
  → lodash.min.js
  → styles.a1b2c3d4.css     ← content hash in filename!
  → bundle.e5f6g7h8.js

  HOW CACHE BUSTING WORKS:
  → Old: <script src="app.abc123.js">   (cached 1 year)
  → New: <script src="app.def456.js">   (different URL!)
  → Browser sees NEW URL → makes new request!
  → Old cached file remains but is no longer referenced

  ⚠️ The old cache doesn't "invalidate" — it's just abandoned!
     A new URL = a new cache entry entirely.
```

---

## §9. User Behavior & Cache

```
3 TYPES OF USER BEHAVIOR:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────┬──────────────────────────────────────┐
  │ User Action         │ Cache Behavior                       │
  ├─────────────────────┼──────────────────────────────────────┤
  │ Enter URL in        │ Check Disk Cache for match           │
  │ address bar         │ → Found: use it                      │
  │                     │ → Not found: network request         │
  │                     │                                      │
  │ Normal Refresh      │ Tab still open → Memory Cache first! │
  │ (F5 / Cmd+R)        │ → Memory hit: use it                │
  │                     │ → Miss: check Disk Cache             │
  │                     │ → Miss: network request              │
  │                     │                                      │
  │ Hard Refresh        │ Browser uses NO cache at all!        │
  │ (Ctrl+F5 /          │ Request headers include:             │
  │  Cmd+Shift+R)       │ Cache-Control: no-cache              │
  │                     │ Pragma: no-cache (compatibility)     │
  │                     │ → Server returns 200 + fresh content │
  └─────────────────────┴──────────────────────────────────────┘

  KEY INSIGHT:
  → Normal refresh: memory cache survives (tab is open!)
  → Hard refresh: forces EVERYTHING to be re-fetched
  → Navigate to URL: only disk cache checked (memory may be cleared)
```

---

## §10. Summary & Interview Checklist

```
COMPLETE CACHING MENTAL MODEL:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │                    BROWSER CACHE                         │
  │                                                          │
  │  Location Priority:                                      │
  │  ① Service Worker (custom, persistent, HTTPS only)       │
  │  ② Memory Cache (fast, volatile, tab-scoped)             │
  │  ③ Disk Cache (persistent, broad, HTTP-header based)     │
  │  ④ Push Cache (HTTP/2, session-scoped, ~5min)            │
  │  ⑤ Network Request (all miss)                            │
  │                                                          │
  │  Strategy Priority:                                      │
  │  Strong Cache → Negotiated Cache                         │
  │                                                          │
  │  Strong Cache:                                           │
  │  ┌─────────────────────────────────────────────┐         │
  │  │ Cache-Control > Expires                     │         │
  │  │ → Hit: 200 (from cache), no server contact  │         │
  │  │ → Miss: proceed to negotiated cache         │         │
  │  └─────────────────────────────────────────────┘         │
  │                                                          │
  │  Negotiated Cache:                                       │
  │  ┌─────────────────────────────────────────────┐         │
  │  │ ETag/If-None-Match > Last-Modified/If-Mod.  │         │
  │  │ → Valid: 304 Not Modified (use cache)        │         │
  │  │ → Invalid: 200 + new resource + new headers │         │
  │  └─────────────────────────────────────────────┘         │
  └──────────────────────────────────────────────────────────┘
```

### Checklist

- [ ] **4 Cache Locations**: Service Worker → Memory → Disk → Push Cache → Network
- [ ] **Service Worker**: HTTPS required, persistent, full control, shows "from SW" always
- [ ] **Memory Cache**: fastest, released on tab close, ignores Cache-Control, prefetch stored here
- [ ] **Disk Cache**: persistent, largest capacity, respects HTTP headers, works cross-site
- [ ] **Push Cache**: HTTP/2 only, session-scoped, ~5 min, used once, can push no-store!
- [ ] **Strong Cache**: no server request! 200 from cache
- [ ] **Expires**: HTTP/1.0, absolute date, broken by local clock changes
- [ ] **Cache-Control**: HTTP/1.1, relative time, overrides Expires
- [ ] **no-cache ≠ no-store**: no-cache = cache + validate, no-store = never cache!
- [ ] **public vs private**: public = proxy can cache, private = client only
- [ ] **s-maxage**: proxy/CDN only, overrides max-age for proxies
- [ ] **Negotiated Cache**: server validates → 304 (cached) or 200 (new)
- [ ] **Last-Modified**: file mod time, seconds precision, false positives on open
- [ ] **ETag**: content hash, exact, higher priority, more CPU cost
- [ ] **Priority**: Cache-Control > Expires, ETag > Last-Modified
- [ ] **No headers set**: heuristic = (Date - Last-Modified) × 10%
- [ ] **Frequently changing**: `no-cache` + ETag (validate every time)
- [ ] **Rarely changing**: `max-age=31536000` + filename hash for busting
- [ ] **User behavior**: address bar = disk, F5 = memory first, Ctrl+F5 = no cache
- [ ] **304 response**: empty body! Only headers sent → saves bandwidth

---

_Nguồn: "In-depth understanding of browser caching mechanisms" (208K reads)_
_Cập nhật lần cuối: Tháng 2, 2026_
