# cacheHandlers — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v16.0.0!

---

## §1. cacheHandlers Là Gì?

```
  cacheHandlers — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Custom cache STORAGE implementations! ★★★                │
  │  → Cho 'use cache' + 'use cache: remote'! ★                │
  │  → Lưu cached components/functions ở                        │
  │    external services (Redis, Memcached...)! ★★★             │
  │  → 'use cache: private' KHÔNG customizable! ★               │
  │                                                              │
  │  MẶC ĐỊNH:                                                    │
  │  → In-memory LRU cache! ★                                   │
  │  → Isolated per process! ★                                  │
  │  → Mất khi restart! ★                                      │
  │                                                              │
  │  VỚI CUSTOM HANDLER:                                          │
  │  → Shared cache (Redis, DynamoDB)! ★★★                     │
  │  → Persist across restarts! ★                               │
  │  → Multiple instances share 1 cache! ★★★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Khi Nào Cần?

```
  USE CASES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Share cache ACROSS INSTANCES! ★★★                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  MẶC ĐỊNH:                                             │    │
  │  │  Server A → Cache A (isolated)! ★                     │    │
  │  │  Server B → Cache B (isolated)! ★                     │    │
  │  │  Server C → Cache C (isolated)! ★                     │    │
  │  │  → KHÔNG share! Duplicate work! ★                     │    │
  │  │                                                       │    │
  │  │  VỚI CUSTOM HANDLER (Redis):                           │    │
  │  │  Server A ┐                                            │    │
  │  │  Server B ├→ Redis (shared cache)! ★★★                │    │
  │  │  Server C ┘                                            │    │
  │  │  → SHARE! Write once, read everywhere! ★★★            │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② Thay đổi STORAGE TYPE! ★                                 │
  │  → Disk, database, external service! ★                     │
  │  → Persist across restarts! ★                               │
  │  → Giảm memory usage! ★                                    │
  │  → Integrate với existing infrastructure! ★                │
  │                                                              │
  │  ❌ KHÔNG CẦN CUSTOM:                                          │
  │  → Single instance, typical use case! ★                    │
  │  → In-memory LRU mặc định đủ tốt! ★                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Cấu Hình + Handler Types!

```
  CONFIG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  import type { NextConfig } from 'next'               │    │
  │  │  const nextConfig: NextConfig = {                     │    │
  │  │    cacheHandlers: {                                    │    │
  │  │      default: require.resolve(                         │    │
  │  │        './cache-handlers/default-handler.js'           │    │
  │  │      ),  ← cho 'use cache'! ★                        │    │
  │  │      remote: require.resolve(                          │    │
  │  │        './cache-handlers/remote-handler.js'            │    │
  │  │      ),  ← cho 'use cache: remote'! ★                │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  HANDLER TYPES:                                               │
  │  ┌──────────────────┬───────────────────────────────────┐    │
  │  │ Key               │ Directive                          │    │
  │  ├──────────────────┼───────────────────────────────────┤    │
  │  │ default           │ 'use cache'! ★                     │    │
  │  │ remote            │ 'use cache: remote'! ★             │    │
  │  │ <custom-name>     │ 'use cache: <name>'! ★             │    │
  │  │ (sessions, etc.)  │                                    │    │
  │  │ ─────────────────│───────────────────────────────────│    │
  │  │ ⛔ private         │ 'use cache: private'! ★            │    │
  │  │                   │ KHÔNG customizable! ★★★            │    │
  │  └──────────────────┴───────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  'use cache'         → cacheHandlers.default! ★       │    │
  │  │  'use cache: remote' → cacheHandlers.remote! ★        │    │
  │  │  'use cache: myKV'   → cacheHandlers.myKV! ★          │    │
  │  │  'use cache: private'→ internal (KHÔNG custom)! ★★★   │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. CacheHandler Interface — 5 Methods!

```
  API — 5 METHODS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬───────────────────────────────────┐    │
  │  │ Method             │ Mô tả                             │    │
  │  ├──────────────────┼───────────────────────────────────┤    │
  │  │ get(key, softTags)│ Đọc cache entry! ★                │    │
  │  │                   │ → CacheEntry | undefined! ★        │    │
  │  │                   │ → Check expired! ★                 │    │
  │  ├──────────────────┼───────────────────────────────────┤    │
  │  │ set(key, pending) │ Ghi cache entry! ★                 │    │
  │  │                   │ → pending = Promise! ★★★           │    │
  │  │                   │ → PHẢI await trước khi lưu! ★★★  │    │
  │  ├──────────────────┼───────────────────────────────────┤    │
  │  │ refreshTags()     │ Sync tags trước mỗi request! ★    │    │
  │  │                   │ → In-memory: no-op! ★              │    │
  │  │                   │ → Distributed: sync external! ★   │    │
  │  ├──────────────────┼───────────────────────────────────┤    │
  │  │ getExpiration(    │ Max revalidation timestamp! ★      │    │
  │  │   tags)            │ → 0: chưa revalidate! ★            │    │
  │  │                   │ → timestamp: lần cuối reval.! ★   │    │
  │  │                   │ → Infinity: check trong get! ★    │    │
  │  ├──────────────────┼───────────────────────────────────┤    │
  │  │ updateTags(       │ Tags bị revalidate/expire! ★       │    │
  │  │   tags, durations)│ → Invalidate matching entries! ★★★│    │
  │  │                   │ → Delete cache có tag đó! ★       │    │
  │  └──────────────────┴───────────────────────────────────┘    │
  │                                                              │
  │  CACHE FLOW:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Request → refreshTags() → get(key)                   │    │
  │  │                              ↓                         │    │
  │  │                    ┌─── HIT? ───┐                      │    │
  │  │                    │ YES    │ NO │                      │    │
  │  │                    ↓        ↓     │                      │    │
  │  │                 return   render + set(key, entry) ★   │    │
  │  │                                                       │    │
  │  │  revalidateTag('tag') → updateTags(['tag'])            │    │
  │  │                          → delete matching entries! ★ │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. CacheEntry Type!

```
  CacheEntry:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  interface CacheEntry {                                       │
  │    value: ReadableStream<Uint8Array>  ← STREAM! ★★★         │
  │    tags: string[]      ← cache tags cho invalidation! ★    │
  │    stale: number       ← stale timestamp! ★                 │
  │    timestamp: number   ← khi nào được cache! ★              │
  │    expire: number      ← TTL (seconds)! ★                   │
  │    revalidate: number  ← revalidate interval (seconds)! ★  │
  │  }                                                            │
  │                                                              │
  │  ⚠️ value = ReadableStream! ★★★                               │
  │  → KHÔNG phải string/object! ★                               │
  │  → Dùng .tee() nếu cần đọc + lưu! ★★★                    │
  │  → Stream có thể lỗi giữa chừng! ★                        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — CacheHandlersEngine!

```javascript
var CacheHandlersEngine = (function () {
  // ═══════════════════════════════════
  // 1. IN-MEMORY CACHE HANDLER
  // ═══════════════════════════════════
  function createInMemoryHandler() {
    var cache = {};
    var pendingSets = {};
    var tagTimestamps = {};

    return {
      name: "in-memory",

      get: function (cacheKey, softTags) {
        // Wait for pending set
        if (pendingSets[cacheKey]) {
          // In real code: await pendingSets[cacheKey]
        }

        var entry = cache[cacheKey];
        if (!entry) {
          return { result: undefined, note: "CACHE MISS! ★" };
        }

        // Check expired
        var now = Date.now();
        if (now > entry.timestamp + entry.revalidate * 1000) {
          return { result: undefined, note: "EXPIRED! ★★★" };
        }

        // Check tag invalidation
        for (var i = 0; i < entry.tags.length; i++) {
          var tagTime = tagTimestamps[entry.tags[i]];
          if (tagTime && tagTime > entry.timestamp) {
            return { result: undefined, note: "TAG INVALIDATED! ★★★" };
          }
        }

        return {
          result: entry,
          note: "CACHE HIT! ★",
          age: Math.round((now - entry.timestamp) / 1000) + "s",
        };
      },

      set: function (cacheKey, entryData) {
        // In real code: entry = await pendingEntry
        cache[cacheKey] = {
          value: entryData.value,
          tags: entryData.tags || [],
          stale: entryData.stale || 0,
          timestamp: Date.now(),
          expire: entryData.expire || 3600,
          revalidate: entryData.revalidate || 60,
        };
        return { note: "Cache entry SET! ★", key: cacheKey };
      },

      refreshTags: function () {
        return { note: "No-op for in-memory! ★" };
      },

      getExpiration: function (tags) {
        var max = 0;
        for (var i = 0; i < tags.length; i++) {
          var t = tagTimestamps[tags[i]];
          if (t && t > max) max = t;
        }
        return {
          maxTimestamp: max,
          note:
            max === 0
              ? "No tags revalidated yet! ★"
              : "Most recent: " + new Date(max).toISOString() + "! ★",
        };
      },

      updateTags: function (tags) {
        var now = Date.now();
        var invalidated = 0;

        // Mark tags
        for (var i = 0; i < tags.length; i++) {
          tagTimestamps[tags[i]] = now;
        }

        // Delete matching entries
        for (var key in cache) {
          var entry = cache[key];
          for (var j = 0; j < entry.tags.length; j++) {
            if (tags.indexOf(entry.tags[j]) >= 0) {
              delete cache[key];
              invalidated++;
              break;
            }
          }
        }

        return {
          tags: tags,
          invalidated: invalidated,
          note: "Tags updated + entries invalidated! ★★★",
        };
      },

      // Debug
      stats: function () {
        return {
          entries: Object.keys(cache).length,
          tags: Object.keys(tagTimestamps),
        };
      },
    };
  }

  // ═══════════════════════════════════
  // 2. EXTERNAL (REDIS-LIKE) HANDLER
  // ═══════════════════════════════════
  function createExternalHandler() {
    var store = {}; // Simulates Redis

    return {
      name: "external-redis",

      get: function (cacheKey) {
        var stored = store[cacheKey];
        if (!stored) return { result: undefined, note: "REDIS MISS! ★" };

        var data = JSON.parse(stored);
        var now = Date.now();
        if (now > data.timestamp + data.revalidate * 1000) {
          delete store[cacheKey];
          return { result: undefined, note: "REDIS EXPIRED + deleted! ★" };
        }

        return {
          result: data,
          note: "REDIS HIT! ★★★",
          serialized: true,
        };
      },

      set: function (cacheKey, entryData) {
        store[cacheKey] = JSON.stringify({
          value: entryData.value,
          tags: entryData.tags || [],
          stale: entryData.stale || 0,
          timestamp: Date.now(),
          expire: entryData.expire || 3600,
          revalidate: entryData.revalidate || 60,
        });
        return {
          note: "Stored in Redis (serialized)! ★",
          ttl: (entryData.expire || 3600) + "s",
        };
      },

      updateTags: function (tags) {
        var invalidated = 0;
        for (var key in store) {
          var data = JSON.parse(store[key]);
          for (var i = 0; i < data.tags.length; i++) {
            if (tags.indexOf(data.tags[i]) >= 0) {
              delete store[key];
              invalidated++;
              break;
            }
          }
        }
        return {
          invalidated: invalidated,
          note: "Redis entries invalidated! ★",
        };
      },
    };
  }

  // ═══════════════════════════════════
  // 3. HANDLER REGISTRY
  // ═══════════════════════════════════
  function createRegistry(handlers) {
    return {
      resolve: function (directive) {
        // 'use cache' → default
        // 'use cache: remote' → remote
        // 'use cache: myKV' → myKV
        var parts = directive.split(":").map(function (s) {
          return s.trim();
        });
        var handlerName = parts.length > 1 ? parts[1] : "default";

        if (handlerName === "private") {
          return { error: "'use cache: private' CANNOT be customized! ★★★" };
        }

        var handler = handlers[handlerName];
        if (!handler) {
          return { error: "No handler for: " + handlerName + "! ★" };
        }

        return {
          directive: directive,
          handlerName: handlerName,
          handler: handler.name,
          note: "Resolved! ★",
        };
      },
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ CacheHandlers Engine ═══");

    var memHandler = createInMemoryHandler();
    var redisHandler = createExternalHandler();

    console.log("\n── 1. In-Memory Handler ──");
    console.log("GET (miss):", memHandler.get("page-1", []));
    console.log(
      "SET:",
      memHandler.set("page-1", {
        value: "<html>...</html>",
        tags: ["products", "homepage"],
        revalidate: 60,
      }),
    );
    console.log("GET (hit):", memHandler.get("page-1", []));
    console.log("Stats:", memHandler.stats());

    console.log("\n── 2. Tag Invalidation ──");
    console.log("updateTags:", memHandler.updateTags(["products"]));
    console.log("GET after invalidate:", memHandler.get("page-1", []));

    console.log("\n── 3. Redis Handler ──");
    console.log(
      "SET:",
      redisHandler.set("api-data", {
        value: '{"items":[]}',
        tags: ["api"],
        revalidate: 30,
      }),
    );
    console.log("GET:", redisHandler.get("api-data"));

    console.log("\n── 4. Handler Registry ──");
    var registry = createRegistry({
      default: memHandler,
      remote: redisHandler,
    });
    console.log("'use cache':", registry.resolve("use cache"));
    console.log("'use cache: remote':", registry.resolve("use cache: remote"));
    console.log(
      "'use cache: private':",
      registry.resolve("use cache: private"),
    );
    console.log("'use cache: myKV':", registry.resolve("use cache: myKV"));
  }

  return { demo: demo };
})();
// Chạy: CacheHandlersEngine.demo();
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: cacheHandlers dùng làm gì?                             │
  │  → Custom cache storage cho 'use cache'! ★★★               │
  │  → Thay in-memory bằng Redis, Memcached... ★               │
  │  → Share cache giữa nhiều instances! ★★★                  │
  │                                                              │
  │  ❓ 2: Handler types nào có?                                   │
  │  → default → 'use cache'! ★                                │
  │  → remote → 'use cache: remote'! ★                         │
  │  → <custom> → 'use cache: <name>'! ★                       │
  │  → private → KHÔNG custom! ★★★                             │
  │                                                              │
  │  ❓ 3: set() nhận gì?                                          │
  │  → pendingEntry = PROMISE! ★★★                             │
  │  → PHẢI await trước khi store! ★★★                        │
  │  → Entry có thể đang generate khi set() gọi! ★            │
  │                                                              │
  │  ❓ 4: CacheEntry.value là gì?                                 │
  │  → ReadableStream<Uint8Array>! ★★★                         │
  │  → KHÔNG phải string/object! ★                              │
  │  → Dùng .tee() để đọc + lưu! ★                            │
  │  → Stream có thể lỗi giữa chừng! ★                        │
  │                                                              │
  │  ❓ 5: refreshTags() vs updateTags()?                          │
  │  → refreshTags: SYNC tags TỪ external — trước request! ★  │
  │  → updateTags: INVALIDATE entries KHI revalidate! ★★★     │
  │  → Hai hướng khác nhau! ★                                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
