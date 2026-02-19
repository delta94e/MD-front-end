# Next.js ISR (Incremental Static Regeneration) — Deep Dive!

> **Chủ đề**: ISR — Update Static Pages Không Cần Rebuild!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/incremental-static-regeneration
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. ISR Là Gì? — Tổng Quan](#1)
2. [§2. Time-based Revalidation](#2)
3. [§3. On-demand — revalidatePath](#3)
4. [§4. On-demand — revalidateTag](#4)
5. [§5. generateStaticParams + dynamicParams](#5)
6. [§6. Error Handling + Cache Location](#6)
7. [§7. Troubleshooting + Debug](#7)
8. [§8. Caveats — Lưu Ý Quan Trọng](#8)
9. [§9. Tự Viết — ISREngine](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. ISR Là Gì? — Tổng Quan!

```
  ISR — INCREMENTAL STATIC REGENERATION:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VẤN ĐỀ: Static Site Generation (SSG)                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  next build → generate 10,000 pages → deploy!       │  │
  │  │  → Nhanh! Cached! CDN!                              │  │
  │  │  → NHƯNG: Content cập nhật → REBUILD TẤT CẢ?      │  │
  │  │  → 10,000 pages × 2s = 20,000s = 5.5 giờ! ❌       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  GIẢI PHÁP: ISR — update TỪNG page riêng lẻ!            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  ✅ Update static content KHÔNG rebuild toàn site!  │  │
  │  │  ✅ Giảm server load → serve prerendered pages!    │  │
  │  │  ✅ Auto cache-control headers!                     │  │
  │  │  ✅ Handle hàng ngàn pages → build time ngắn!      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  SO SÁNH:                                                  │
  │  ┌──────────────┬─────────────┬──────────────┬──────────┐  │
  │  │              │ SSG         │ ISR          │ SSR      │  │
  │  ├──────────────┼─────────────┼──────────────┼──────────┤  │
  │  │ Build        │ Tất cả     │ Tất cả      │ Không    │  │
  │  │ Update       │ Rebuild all │ Per-page!   │ Per-req  │  │
  │  │ Speed        │ ★★★★★      │ ★★★★       │ ★★       │  │
  │  │ Freshness    │ ★            │ ★★★★       │ ★★★★★  │  │
  │  │ Server load  │ Minimal     │ Low         │ High     │  │
  │  │ CDN          │ ✅          │ ✅          │ ❌       │  │
  │  └──────────────┴─────────────┴──────────────┴──────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  STALE-WHILE-REVALIDATE PATTERN:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  revalidate = 60 (giây)                                    │
  │                                                            │
  │  Timeline:                                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  t=0s    Build → page cached (version 1)            │  │
  │  │  t=10s   Request → serve cached v1 ⚡ (fast!)       │  │
  │  │  t=30s   Request → serve cached v1 ⚡               │  │
  │  │  t=59s   Request → serve cached v1 ⚡               │  │
  │  │  ─────── 60s elapsed ───────                        │  │
  │  │  t=65s   Request → serve STALE v1 ⚡ (still fast!) │  │
  │  │          └── ĐỒNG THỜI: regenerate v2 (background!)│  │
  │  │  t=66s   v2 DONE → replace cache!                   │  │
  │  │  t=70s   Request → serve FRESH v2 ⚡ (updated!)     │  │
  │  │  t=130s  Request → serve STALE v2 ⚡                │  │
  │  │          └── regenerate v3 (background!)            │  │
  │  │  ...                                                │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  KEY INSIGHT:                                              │
  │  → User LUÔN nhận response NGAY (cached!)                │
  │  → Page mới generate BACKGROUND!                          │
  │  → KHÔNG BAO GIỜ chờ đợi!                                │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Time-based Revalidation!

```typescript
// app/blog/page.tsx
interface Post {
  id: string
  title: string
  content: string
}

// Invalidate cache TỐI ĐA mỗi 3600s (1 giờ)!
export const revalidate = 3600

export default async function Page() {
  const data = await fetch('https://api.vercel.app/blog')
  const posts: Post[] = await data.json()

  return (
    <main>
      <h1>Blog Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </main>
  )
}
```

```
  export const revalidate — HOẠT ĐỘNG:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  revalidate = 3600  (Route Segment Config)              │
  │                                                          │
  │  ① Build → page rendered + cached!                      │
  │  ② 0-3600s: Serve cached version (fast!)                │
  │  ③ >3600s: Next request → serve STALE + regen!         │
  │  ④ Regen done → cache updated → fresh for next!        │
  │                                                          │
  │  ⚠️ KHUYẾN NGHỊ:                                        │
  │  → Dùng thời gian DÀI (1h, không phải 1s!)            │
  │  → Cần chính xác hơn? → On-demand revalidation!       │
  │  → Cần real-time? → Dynamic rendering!                 │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. On-demand — revalidatePath!

```
  revalidatePath — INVALIDATE THEO ĐƯỜNG DẪN:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  FLOW:                                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  CMS Editor publish bài mới                          │  │
  │  │    ↓                                                  │  │
  │  │  Webhook → gọi Server Action / Route Handler         │  │
  │  │    ↓                                                  │  │
  │  │  revalidatePath('/posts')                             │  │
  │  │    ↓                                                  │  │
  │  │  Cache cho /posts bị INVALIDATE!                     │  │
  │  │    ↓                                                  │  │
  │  │  Request tiếp theo → REGENERATE trên server!         │  │
  │  │    ↓                                                  │  │
  │  │  Fresh page cached → serve cho các requests sau!     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⚠️ revalidatePath CHƯA eager regenerate!                 │
  │  → Invalidate cache NHƯNG regen xảy ra ở REQUEST TIẾP! │
  │  → KHÔNG regen ngay lập tức!                             │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```typescript
"use server";
import { revalidatePath } from "next/cache";

export async function createPost() {
  // Invalidate cache cho TOÀN BỘ /posts route!
  revalidatePath("/posts");
}
```

---

## §4. On-demand — revalidateTag!

```
  revalidateTag — INVALIDATE THEO TAG (GRANULAR!):
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  revalidatePath:  Invalidate TOÀN BỘ 1 route!           │
  │  revalidateTag:   Invalidate CHỈ data có tag cụ thể!    │
  │                                                            │
  │  VÍ DỤ:                                                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  Page A: fetch(..., { next: { tags: ['posts'] } })   │  │
  │  │  Page B: fetch(..., { next: { tags: ['posts'] } })   │  │
  │  │  Page C: fetch(..., { next: { tags: ['users'] } })   │  │
  │  │                                                      │  │
  │  │  revalidateTag('posts')                               │  │
  │  │    → Page A: INVALIDATED! ✅                         │  │
  │  │    → Page B: INVALIDATED! ✅                         │  │
  │  │    → Page C: KHÔNG ảnh hưởng! ❌ (tag khác)        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Dùng với fetch:**

```typescript
export default async function Page() {
  const data = await fetch("https://api.vercel.app/blog", {
    next: { tags: ["posts"] }, // ← tag fetch call!
  });
  const posts = await data.json();
  // ...
}
```

**Dùng với ORM/database (unstable_cache):**

```typescript
import { unstable_cache } from "next/cache";
import { db, posts } from "@/lib/db";

const getCachedPosts = unstable_cache(
  async () => {
    return await db.select().from(posts);
  },
  ["posts"], // ← cache key
  {
    revalidate: 3600, // ← time-based backup
    tags: ["posts"], // ← tag cho on-demand!
  },
);
```

**Invalidate:**

```typescript
"use server";
import { revalidateTag } from "next/cache";

export async function createPost() {
  revalidateTag("posts"); // ← Invalidate TẤT CẢ data tagged 'posts'!
}
```

```
  revalidatePath vs revalidateTag:
  ┌──────────────┬──────────────────┬──────────────────────┐
  │              │ revalidatePath   │ revalidateTag        │
  ├──────────────┼──────────────────┼──────────────────────┤
  │ Scope        │ Toàn bộ route   │ Chỉ data có tag     │
  │ Granularity  │ Coarse           │ Fine-grained!        │
  │ Use case     │ Page-level       │ Data-level           │
  │ Multiple pg  │ 1 path           │ Nhiều pages cùng tag│
  │ Recommendation│ Hầu hết cases  │ Cần control cao     │
  └──────────────┴──────────────────┴──────────────────────┘
```

---

## §5. generateStaticParams + dynamicParams!

```
  DYNAMIC ROUTES + ISR:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  // app/blog/[id]/page.tsx                                 │
  │                                                            │
  │  export const revalidate = 60                              │
  │                                                            │
  │  export async function generateStaticParams() {            │
  │    const posts = await fetch('...')                         │
  │    return posts.map(p => ({ id: String(p.id) }))           │
  │    // → Pre-generate: /blog/1, /blog/2, ... /blog/25      │
  │  }                                                         │
  │                                                            │
  │  BUILD TIME:                                               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  /blog/1  → generated ✅ cached!                    │  │
  │  │  /blog/2  → generated ✅ cached!                    │  │
  │  │  ...                                                 │  │
  │  │  /blog/25 → generated ✅ cached!                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  RUNTIME — /blog/26 requested (chưa build!):              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  dynamicParams = true (default):                     │  │
  │  │    → Generate ON-DEMAND! → cache! → serve!          │  │
  │  │                                                      │  │
  │  │  dynamicParams = false:                               │  │
  │  │    → 404! KHÔNG generate!                            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. Error Handling + Cache Location!

```
  ERROR HANDLING:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Regeneration FAIL (API down, DB error...):              │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  ① Revalidation → ERROR thrown!                    │  │
  │  │  ② Serve LAST SUCCESSFULLY generated page!        │  │
  │  │     → User vẫn thấy content (stale but valid!)   │  │
  │  │  ③ Next request → RETRY revalidation!             │  │
  │  │  ④ Success? → Update cache!                       │  │
  │  │     Fail again? → Keep serving stale!             │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  → KHÔNG BAO GIỜ serve error page cho cached route!    │
  │  → Graceful degradation!                                │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  CACHE LOCATION (Self-hosting):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Default: .next/cache (local filesystem)                 │
  │                                                          │
  │  Custom location hữu ích khi:                           │
  │  → Multiple containers/instances → cần SHARED cache!   │
  │  → Persistent storage (survive redeploy!)               │
  │  → Redis, S3, custom handler...                         │
  │                                                          │
  │  Cấu hình: cacheHandler trong next.config.js            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Troubleshooting + Debug!

```
  DEBUG ISR:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Logging fetch requests:                               │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  // next.config.js                                 │  │
  │  │  module.exports = {                                │  │
  │  │    logging: {                                      │  │
  │  │      fetches: { fullUrl: true }                    │  │
  │  │    }                                               │  │
  │  │  }                                                 │  │
  │  │  → Console log: cached/uncached + full URL!       │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  ② Test production behavior:                             │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  next build && next start                          │  │
  │  │  → ISR CHƯA hoạt động trong dev mode!            │  │
  │  │  → PHẢI test với production build!                │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  ③ Debug cache hits/misses:                              │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  // .env                                           │  │
  │  │  NEXT_PRIVATE_DEBUG_CACHE=1                        │  │
  │  │                                                    │  │
  │  │  → Console log: HIT/MISS cho mỗi page!           │  │
  │  │  → Thấy pages nào generated lúc build             │  │
  │  │  → Thấy pages nào generated on-demand             │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. Caveats — Lưu Ý Quan Trọng!

```
  CAVEATS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ ① Node.js runtime ONLY!                                  │
  │   → Edge runtime KHÔNG hỗ trợ ISR!                    │
  │                                                          │
  │ ② Static Export KHÔNG hỗ trợ!                            │
  │   → ISR cần server → next start / Vercel / Docker     │
  │                                                          │
  │ ③ Multiple fetch, LOWEST revalidate wins!                │
  │   ┌────────────────────────────────────────────────┐     │
  │   │ fetch A: revalidate = 3600                     │     │
  │   │ fetch B: revalidate = 60                       │     │
  │   │ → ISR for route = 60 (lowest!)                │     │
  │   │ → But Data Cache respects individual values!  │     │
  │   └────────────────────────────────────────────────┘     │
  │                                                          │
  │ ④ revalidate = 0 hoặc no-store → DYNAMIC RENDERING!    │
  │   → KHÔNG phải ISR nữa!                               │
  │                                                          │
  │ ⑤ Proxy KHÔNG chạy cho on-demand ISR!                   │
  │   → Revalidate EXACT path: /post/1, KHÔNG /post-1!    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  PLATFORM SUPPORT:
  ┌────────────────────────────────────────────────────────┐
  │ ✅ Node.js server (next start)                       │
  │ ✅ Docker container                                  │
  │ ❌ Static export                                     │
  │ ✅ Adapters (custom)                                 │
  └────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — ISREngine!

```javascript
var ISREngine = (function () {
  // ═══════════════════════════════════
  // 1. CACHE STORE
  // ═══════════════════════════════════
  var cache = {};
  var NOW = 0; // simulated clock

  function tick(seconds) {
    NOW += seconds;
    console.log("  ⏰ Time: " + NOW + "s");
  }

  // ═══════════════════════════════════
  // 2. PAGE GENERATOR
  // ═══════════════════════════════════
  var version = 0;
  function generatePage(path) {
    version++;
    var page = {
      path: path,
      content: "Content v" + version,
      generatedAt: NOW,
      version: version,
    };
    console.log("  🔨 Generated: " + path + " → v" + version + " at t=" + NOW);
    return page;
  }

  // ═══════════════════════════════════
  // 3. ISR CORE — Stale-While-Revalidate
  // ═══════════════════════════════════
  function requestPage(path, revalidate) {
    var entry = cache[path];

    // MISS — never generated
    if (!entry) {
      console.log("  ❌ MISS: " + path);
      var page = generatePage(path);
      cache[path] = { page: page, revalidate: revalidate };
      return page;
    }

    var age = NOW - entry.page.generatedAt;

    if (age <= entry.revalidate) {
      // HIT — still fresh!
      console.log("  ✅ HIT: " + path + " (age=" + age + "s, fresh!)");
      return entry.page;
    } else {
      // STALE — serve old, regen background!
      console.log(
        "  ⚡ STALE: " + path + " (age=" + age + "s) → serve + regen!",
      );
      var stalePage = entry.page;
      // "Background" regen
      var newPage = generatePage(path);
      cache[path] = { page: newPage, revalidate: revalidate };
      return stalePage; // User gets stale (fast!)
    }
  }

  // ═══════════════════════════════════
  // 4. REVALIDATE PATH
  // ═══════════════════════════════════
  function revalidatePath(path) {
    if (cache[path]) {
      // Force stale by setting generatedAt to 0
      cache[path].page.generatedAt = 0;
      console.log('  🗑️ revalidatePath("' + path + '") → cache invalidated!');
    }
  }

  // ═══════════════════════════════════
  // 5. REVALIDATE TAG
  // ═══════════════════════════════════
  var tagMap = {}; // tag → [path1, path2, ...]

  function tagPage(path, tag) {
    if (!tagMap[tag]) tagMap[tag] = [];
    tagMap[tag].push(path);
  }

  function revalidateTag(tag) {
    var paths = tagMap[tag] || [];
    console.log(
      '  🏷️ revalidateTag("' + tag + '") → ' + paths.length + " pages",
    );
    for (var i = 0; i < paths.length; i++) {
      revalidatePath(paths[i]);
    }
  }

  // ═══════════════════════════════════
  // 6. ERROR HANDLING
  // ═══════════════════════════════════
  function requestPageWithError(path, revalidate, shouldFail) {
    var entry = cache[path];
    if (!entry) {
      var p = generatePage(path);
      cache[path] = { page: p, revalidate: revalidate };
      return p;
    }
    var age = NOW - entry.page.generatedAt;
    if (age > entry.revalidate) {
      console.log("  ⚡ STALE: " + path + " → regen...");
      if (shouldFail) {
        console.log("  💥 Regen FAILED! Serve last good version!");
        return entry.page; // Graceful degradation!
      }
      var newP = generatePage(path);
      cache[path] = { page: newP, revalidate: revalidate };
      return entry.page;
    }
    return entry.page;
  }

  // ═══════════════════════════════════
  // 7. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  ISR ENGINE DEMO                    ║");
    console.log("╚════════════════════════════════════╝");

    // Scenario 1: Time-based revalidation
    console.log("\n── Scenario 1: Time-based (revalidate=60) ──");
    requestPage("/blog", 60);
    tick(30);
    requestPage("/blog", 60); // HIT (30s < 60s)
    tick(40);
    requestPage("/blog", 60); // STALE (70s > 60s) → regen!
    requestPage("/blog", 60); // HIT (fresh v2!)

    // Scenario 2: On-demand revalidatePath
    console.log("\n── Scenario 2: revalidatePath ──");
    tick(10);
    requestPage("/posts", 3600);
    revalidatePath("/posts");
    requestPage("/posts", 3600); // Regen triggered!

    // Scenario 3: revalidateTag
    console.log("\n── Scenario 3: revalidateTag ──");
    tagPage("/page-a", "data");
    tagPage("/page-b", "data");
    requestPage("/page-a", 3600);
    requestPage("/page-b", 3600);
    revalidateTag("data");
    requestPage("/page-a", 3600); // Regen!
    requestPage("/page-b", 3600); // Regen!

    // Scenario 4: Error handling
    console.log("\n── Scenario 4: Error → Serve stale ──");
    cache = {};
    version = 0;
    NOW = 0;
    requestPage("/fragile", 10);
    tick(15);
    requestPageWithError("/fragile", 10, true); // Fail → stale!
  }

  return { demo: demo };
})();
// Chạy: ISREngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

**Câu 1**: ISR "Stale-While-Revalidate" hoạt động thế nào?

<details><summary>Đáp án</summary>

ISR dùng pattern **Stale-While-Revalidate** (SWR):

1. **Build time**: Page generated → cached
2. **< revalidate time**: Serve cached (fast!)
3. **> revalidate time**: Serve **STALE** page (vẫn fast!) → đồng thời **regenerate** mới trong background
4. **Regen xong**: Cache updated → request tiếp theo nhận **fresh** page

Key: User **KHÔNG BAO GIỜ chờ** regeneration! Luôn nhận cached response ngay. Page mới chỉ thay thế ở request SAU.

</details>

---

**Câu 2**: revalidatePath vs revalidateTag — khi nào dùng cái nào?

<details><summary>Đáp án</summary>

|                 | revalidatePath      | revalidateTag           |
| --------------- | ------------------- | ----------------------- |
| **Scope**       | Toàn bộ 1 route     | Chỉ data có tag cụ thể  |
| **Granularity** | Coarse (path-level) | Fine (data-level)       |
| **Cross-page**  | ❌ 1 path           | ✅ Nhiều pages cùng tag |
| **Use case**    | Page-level refresh  | Shared data invalidate  |

**revalidatePath**: Dùng cho **hầu hết cases**. VD: `revalidatePath('/posts')` invalidate toàn bộ `/posts`.

**revalidateTag**: Cần **granular control**. VD: Nhiều pages fetch cùng data `posts` → tag `'posts'` → `revalidateTag('posts')` invalidate tất cả cùng lúc.

</details>

---

**Câu 3**: Khi regeneration FAIL, chuyện gì xảy ra?

<details><summary>Đáp án</summary>

**Graceful degradation**: Khi revalidation throw error:

1. **Serve last successfully generated page** — user vẫn thấy content (stale nhưng valid)
2. **Next request → retry** — Next.js tự retry ở request tiếp theo
3. **KHÔNG BAO GIỜ** serve error page cho cached route

Đây là ưu điểm lớn so với SSR: SSR fail → user thấy error. ISR fail → user thấy **content cũ** (better than nothing!).

</details>

---

**Câu 4**: Multiple fetch với revalidate khác nhau → ISR time là gì?

<details><summary>Đáp án</summary>

Nếu route có nhiều fetch calls với `revalidate` khác nhau:

```
fetch A: revalidate = 3600 (1h)
fetch B: revalidate = 60  (1 min)
```

→ ISR cho **route** = **60** (LOWEST wins!)
→ Nhưng **Data Cache** vẫn tôn trọng từng giá trị riêng: A cached 1h, B cached 1 min.

Special cases:

- `revalidate = 0` → Route trở thành **dynamically rendered** (SSR, không ISR!)
- `cache: 'no-store'` → cũng dynamic rendering!

</details>
