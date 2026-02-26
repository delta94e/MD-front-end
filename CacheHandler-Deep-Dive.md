# cacheHandler (incrementalCacheHandlerPath) — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/incrementalCacheHandlerPath
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **⚠️ cacheHandler (singular) ≠ cacheHandlers (plural)!**

---

## §1. cacheHandler Là Gì?

```
  cacheHandler — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Custom cache location cho Next.js! ★★★                  │
  │  → Persist cached pages + data vào durable storage! ★      │
  │  → Share cache giữa multiple containers! ★★★              │
  │  → Dùng cho ISR + Route Handler responses! ★               │
  │                                                              │
  │  ⚠️ PHÂN BIỆT:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  cacheHandler (singular):                              │    │
  │  │  → ISR + Route Handlers! ★★★                         │    │
  │  │  → Server cache operations! ★                         │    │
  │  │                                                       │    │
  │  │  cacheHandlers (plural):                               │    │
  │  │  → 'use cache' directives! ★★★                       │    │
  │  │  → KHÁC NHAU! ★★★                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    cacheHandler: require.resolve('./cache-handler.js')│    │
  │  │    cacheMaxMemorySize: 0 ← tắt in-memory cache! ★   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Default (no custom handler):                          │    │
  │  │  Next.js → in-memory + filesystem cache! ★            │    │
  │  │  → Single server only! Isolated! ★                    │    │
  │  │                                                       │    │
  │  │  Custom handler:                                       │    │
  │  │  Next.js → cacheHandler → Redis/Memcached/etc! ★★★  │    │
  │  │  → Shared across containers! ★★★                     │    │
  │  │                                                       │    │
  │  │  Container A ──┐                                       │    │
  │  │  Container B ──┼──→ Redis (shared cache) ★★★          │    │
  │  │  Container C ──┘                                       │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. API Reference — 4 Methods!

```
  API:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌───────────────────┬──────────────────────────────────┐    │
  │  │ Method              │ Mô tả                            │    │
  │  ├───────────────────┼──────────────────────────────────┤    │
  │  │ get(key)            │ Lấy cached value! ★★★            │    │
  │  │                    │ key: string                       │    │
  │  │                    │ return: value | null ★            │    │
  │  ├───────────────────┼──────────────────────────────────┤    │
  │  │ set(key, data, ctx)│ Lưu vào cache! ★★★               │    │
  │  │                    │ key: string                       │    │
  │  │                    │ data: null (delete) | cache data  │    │
  │  │                    │ ctx: { tags: [] }                 │    │
  │  │                    │ return: Promise<void> ★           │    │
  │  ├───────────────────┼──────────────────────────────────┤    │
  │  │ revalidateTag(tag)  │ Invalidate by tag! ★★★           │    │
  │  │                    │ tag: string | string[]            │    │
  │  │                    │ return: Promise<void> ★           │    │
  │  │                    │ revalidatePath dùng cái này! ★   │    │
  │  ├───────────────────┼──────────────────────────────────┤    │
  │  │ resetRequestCache()│ Reset in-memory per request! ★   │    │
  │  │                    │ Temp cache cho single request     │    │
  │  │                    │ return: void ★                    │    │
  │  └───────────────────┴──────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ revalidatePath = convenience trên revalidateTag! ★★★     │
  │  → revalidatePath gọi revalidateTag bên dưới! ★           │
  │                                                              │
  │  VERSION HISTORY:                                             │
  │  → v12.2.0: incrementalCacheHandlerPath (alpha)! ★        │
  │  → v13.4.0: + revalidateTag support! ★                    │
  │  → v14.1.0: renamed → cacheHandler (stable)! ★★★         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — CacheHandlerEngine!

```javascript
var CacheHandlerEngine = (function () {
  // ═══════════════════════════════════
  // 1. IN-MEMORY CACHE HANDLER (simulate Redis)
  // ═══════════════════════════════════
  var store = {};
  var tagMap = {}; // tag → [keys]

  function get(key) {
    var entry = store[key];
    if (!entry) return null;
    // Check expiry
    if (entry.expireAt && Date.now() > entry.expireAt) {
      delete store[key];
      return null;
    }
    return {
      value: entry.data,
      lastModified: entry.lastModified,
      tags: entry.tags || [],
    };
  }

  function set(key, data, ctx) {
    if (data === null) {
      delete store[key];
      return;
    }
    store[key] = {
      data: data,
      lastModified: Date.now(),
      tags: (ctx && ctx.tags) || [],
    };
    // Update tag map
    var tags = (ctx && ctx.tags) || [];
    for (var i = 0; i < tags.length; i++) {
      if (!tagMap[tags[i]]) tagMap[tags[i]] = [];
      if (tagMap[tags[i]].indexOf(key) < 0) {
        tagMap[tags[i]].push(key);
      }
    }
  }

  function revalidateTag(tag) {
    var tags = Array.isArray(tag) ? tag : [tag];
    var invalidated = [];
    for (var i = 0; i < tags.length; i++) {
      var keys = tagMap[tags[i]] || [];
      for (var j = 0; j < keys.length; j++) {
        delete store[keys[j]];
        invalidated.push(keys[j]);
      }
      delete tagMap[tags[i]];
    }
    return {
      tags: tags,
      invalidated: invalidated,
      note: invalidated.length + " entries invalidated! ★★★",
    };
  }

  function resetRequestCache() {
    // In production: reset temp per-request dedup cache
    return { note: "Request cache reset! ★" };
  }

  // ═══════════════════════════════════
  // 2. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ CacheHandler Engine ═══");

    console.log("\n── 1. Set ──");
    set("/page/home", { html: "<h1>Home</h1>" }, { tags: ["page", "home"] });
    set("/page/about", { html: "<h1>About</h1>" }, { tags: ["page", "about"] });
    set("/api/data", { json: { id: 1 } }, { tags: ["api"] });
    console.log("Stored 3 entries! ★");

    console.log("\n── 2. Get ──");
    console.log("home:", get("/page/home"));
    console.log("missing:", get("/page/missing"));

    console.log("\n── 3. Revalidate Tag ──");
    console.log(revalidateTag("page"));
    console.log("home after:", get("/page/home"));
    console.log("api still:", get("/api/data"));

    console.log("\n── 4. Reset ──");
    console.log(resetRequestCache());
  }

  return { demo: demo };
})();
// Chạy: CacheHandlerEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: cacheHandler dùng làm gì?                               │
  │  → Custom cache location (Redis, Memcached)! ★★★          │
  │  → Share cache giữa containers! ★★★                       │
  │  → Dùng cho ISR + Route Handlers! ★                       │
  │                                                              │
  │  ❓ 2: cacheHandler vs cacheHandlers?                          │
  │  → cacheHandler (singular): ISR + Route Handlers! ★        │
  │  → cacheHandlers (plural): 'use cache' directives! ★★★   │
  │  → KHÁC NHAU hoàn toàn! ★★★                              │
  │                                                              │
  │  ❓ 3: 4 methods?                                              │
  │  → get(key): lấy cached value! ★                          │
  │  → set(key, data, ctx): lưu + tags! ★                    │
  │  → revalidateTag(tag): invalidate by tag! ★★★             │
  │  → resetRequestCache(): reset per-request cache! ★        │
  │                                                              │
  │  ❓ 4: revalidatePath vs revalidateTag?                        │
  │  → revalidatePath = convenience layer! ★                   │
  │  → Gọi revalidateTag bên dưới! ★★★                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
