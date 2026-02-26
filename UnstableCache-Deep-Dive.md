# unstable_cache() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/unstable_cache
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/cache`
> **⚠️ DEPRECATED**: Đã thay bằng `'use cache'` directive trong Next.js 16!

---

## §1. unstable_cache() Là Gì?

```
  unstable_cache() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Cache kết quả của expensive operations! ★                 │
  │  → DB queries, API calls → reuse across requests! ★        │
  │  → Persist vào Data Cache (across requests + deploys!) ★    │
  │  → import { unstable_cache } from 'next/cache'              │
  │                                                              │
  │  ⚠️ DEPRECATED in v16:                                        │
  │  → Thay bằng 'use cache' directive! ★★★                    │
  │  → Cache Components pattern! ★                              │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const getCachedUser = unstable_cache(                │    │
  │  │    async (id) => getUser(id),  ← function! ★          │    │
  │  │    ['my-app-user'],            ← keyParts! ★          │    │
  │  │    { tags: ['users'], revalidate: 60 }  ← options! ★ │    │
  │  │  )                                                    │    │
  │  │                                                       │    │
  │  │  const user = await getCachedUser(userId)              │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Cache hit? → return cached! ★                        │    │
  │  │  Cache miss? → invoke fn → cache result → return! ★  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIỚI HẠN:                                                    │
  │  → KHÔNG truy cập headers/cookies trong cache scope! ★★★   │
  │  → Pass dynamic data as ARGUMENTS thay thế! ★               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Parameters + Returns!

```
  PARAMETERS:
  ┌──────────────────────────────────────────────────────────────┐
  │  unstable_cache(fetchData, keyParts?, options?)               │
  │                                                              │
  │  ┌───────────┬──────────────┬─────────────────────────────┐  │
  │  │ Param      │ Type         │ Mô tả                       │  │
  │  ├───────────┼──────────────┼─────────────────────────────┤  │
  │  │ fetchData  │ () => Promise│ Async function! ★            │  │
  │  │ keyParts   │ string[]     │ Extra cache key parts! ★    │  │
  │  │            │ (optional)   │ Closures used? → ADD! ★★★  │  │
  │  │ options    │ object       │ Cache behavior! ★            │  │
  │  └───────────┴──────────────┴─────────────────────────────┘  │
  │                                                              │
  │  options:                                                     │
  │  → tags: string[] — cho revalidateTag()! ★                  │
  │  → revalidate: number | false — seconds! ★                  │
  │    → Omit/false = cache INDEFINITELY! ★                     │
  │    → number = time-based revalidation! ★                    │
  │                                                              │
  │  RETURNS:                                                     │
  │  → Function! Invoke → Promise<cached data>! ★               │
  │                                                              │
  │  CACHE KEY = fn args + stringified fn + keyParts! ★          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — UnstableCacheEngine!

```javascript
var UnstableCacheEngine = (function () {
  var store = {};

  function unstable_cache(fetchData, keyParts, options) {
    keyParts = keyParts || [];
    options = options || {};

    return function () {
      var args = Array.prototype.slice.call(arguments);
      var cacheKey = JSON.stringify({ keyParts: keyParts, args: args });

      // Check cache hit
      if (store[cacheKey]) {
        var entry = store[cacheKey];
        var age = (Date.now() - entry.timestamp) / 1000;
        if (!options.revalidate || age < options.revalidate) {
          return Promise.resolve({
            data: entry.data,
            source: "CACHE HIT! ★",
            age: age,
          });
        }
        // Stale → refetch
      }

      // Cache miss → invoke
      return fetchData.apply(null, args).then(function (result) {
        store[cacheKey] = {
          data: result,
          timestamp: Date.now(),
          tags: options.tags || [],
        };
        return { data: result, source: "CACHE MISS → fetched! ★" };
      });
    };
  }

  function invalidateByTag(tag) {
    var count = 0;
    for (var key in store) {
      if (store[key].tags && store[key].tags.indexOf(tag) >= 0) {
        delete store[key];
        count++;
      }
    }
    return { tag: tag, invalidated: count };
  }

  function demo() {
    console.log("═══ UnstableCache Engine ═══");

    var getUser = unstable_cache(
      function (id) {
        return Promise.resolve({ id: id, name: "User " + id });
      },
      ["my-app-user"],
      { tags: ["users"], revalidate: 60 },
    );

    getUser("123").then(function (r) {
      console.log("Call 1:", r);
    });
    getUser("123").then(function (r) {
      console.log("Call 2:", r);
    }); // HIT!
    getUser("456").then(function (r) {
      console.log("Call 3:", r);
    }); // MISS!

    setTimeout(function () {
      console.log("\n── Invalidate ──");
      console.log(invalidateByTag("users"));
      getUser("123").then(function (r) {
        console.log("After invalidate:", r);
      });
    }, 100);
  }

  return { demo: demo };
})();
// Chạy: UnstableCacheEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: unstable_cache vs 'use cache'?                           │
  │  → unstable_cache: DEPRECATED from v16! ★★★                 │
  │  → 'use cache': directive-based, cleaner API! ★             │
  │  → Migrate: Cache Components pattern! ★                     │
  │                                                              │
  │  ❓ 2: Cache key tạo từ đâu?                                    │
  │  → fn arguments + stringified fn + keyParts! ★               │
  │  → keyParts quan trọng khi dùng closures! ★★★               │
  │                                                              │
  │  ❓ 3: Tại sao KHÔNG truy cập headers/cookies?                  │
  │  → Dynamic data sources trong cache scope! ★                │
  │  → Pass dynamic data as ARGUMENTS thay thế! ★               │
  │  → headers() outside → pass result in! ★                    │
  │                                                              │
  │  ❓ 4: revalidate option hoạt động thế nào?                     │
  │  → number = seconds! Time-based revalidation! ★             │
  │  → false/omit = cache INDEFINITELY! ★                       │
  │  → Invalidate: revalidateTag() / revalidatePath()! ★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
