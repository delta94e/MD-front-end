# revalidateTag() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/revalidateTag
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/cache`

---

## §1. revalidateTag() Là Gì?

```
  revalidateTag() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Invalidate cached data theo CACHE TAG! ★                  │
  │  → Cross-page: affect ALL pages using that tag! ★★★         │
  │  → import { revalidateTag } from 'next/cache'               │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ① Tag data khi fetch:                                │    │
  │  │  fetch(url, { next: { tags: ['posts'] } })            │    │
  │  │  HOẶC:                                                │    │
  │  │  'use cache' + cacheTag('posts')                       │    │
  │  │                                                       │    │
  │  │  ② Invalidate khi data thay đổi:                      │    │
  │  │  revalidateTag('posts', 'max')                        │    │
  │  │                                                       │    │
  │  │  ③ ALL pages with tag 'posts' get fresh data! ★       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  IDEAL FOR:                                                   │
  │  → Blog posts, product catalogs, documentation! ★            │
  │  → Content where slight delay is acceptable! ★               │
  │  → Stale-while-revalidate semantics! ★                      │
  │                                                              │
  │  DÙNG TRONG:                                                  │
  │  → Server Functions ✅                                       │
  │  → Route Handlers ✅                                         │
  │  → Client Components ❌ (server only!)                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Parameters + Revalidation Behavior!

```
  PARAMETERS:
  ┌──────────────────────────────────────────────────────────────┐
  │  revalidateTag(tag, profile): void                            │
  │                                                              │
  │  tag:     string — cache tag (≤ 256 chars, case-sensitive!)  │
  │  profile: string | { expire?: number } — behavior! ★        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  PROFILE — 3 modes:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① profile="max" (RECOMMENDED!):                              │
  │  → Mark tag as STALE! ★                                      │
  │  → Next visit → stale-while-revalidate! ★                   │
  │  → Serve stale content WHILE fetching fresh! ★              │
  │  → KHÔNG trigger revalidation ngay! ★                       │
  │                                                              │
  │  ② Custom cache life profile:                                  │
  │  → Any profile defined in cacheLife config! ★                │
  │  → Custom revalidation behaviors! ★                          │
  │                                                              │
  │  ③ Without profile (DEPRECATED!):                              │
  │  → Expire IMMEDIATELY! ★                                     │
  │  → Next request = blocking cache miss! ★                    │
  │  → Migrate to profile="max" OR updateTag()! ★★★            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  TAGGING DATA — 2 Ways:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① fetch + next.tags:                                         │
  │  fetch(url, { next: { tags: ['posts'] } })                   │
  │                                                              │
  │  ② cacheTag + 'use cache':                                    │
  │  import { cacheTag } from 'next/cache'                       │
  │  async function getData() {                                   │
  │    'use cache'                                               │
  │    cacheTag('posts')                                         │
  │  }                                                           │
  │                                                              │
  │  NOTE: single-arg revalidateTag(tag) is DEPRECATED! ★★★    │
  │  → Update to 2-arg: revalidateTag(tag, 'max')! ★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. revalidateTag vs revalidatePath!

```
  COMPARISON:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬────────────────────────────────────┐   │
  │  │ Function          │ Scope                               │   │
  │  ├──────────────────┼────────────────────────────────────┤   │
  │  │ revalidateTag     │ ALL pages with specific tag! ★     │   │
  │  │ revalidatePath    │ Specific page/layout path! ★       │   │
  │  │ updateTag         │ Immediate expire for tag! ★        │   │
  │  └──────────────────┴────────────────────────────────────┘   │
  │                                                              │
  │  BEST PRACTICE — dùng kết hợp:                                │
  │  async function updatePost() {                                │
  │    await updatePostInDatabase()                              │
  │    revalidatePath('/blog')      ← refresh page! ★           │
  │    updateTag('posts')           ← refresh all tag users! ★  │
  │  }                                                           │
  │                                                              │
  │  WEBHOOK / 3rd party — cần expire ngay:                       │
  │  revalidateTag(tag, { expire: 0 })! ★                       │
  │  → Hoặc dùng updateTag() trong Server Actions! ★            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — RevalidateTagEngine!

```javascript
var RevalidateTagEngine = (function () {
  var cache = {};

  function tagData(tag, data) {
    if (!cache[tag]) cache[tag] = [];
    cache[tag].push({ data: data, stale: false, timestamp: Date.now() });
  }

  function revalidateTag(tag, profile) {
    if (!cache[tag])
      return { error: "Tag '" + tag + "' not found!", valid: false };

    if (!profile) {
      // DEPRECATED: immediate expire
      delete cache[tag];
      return {
        tag: tag,
        behavior: "EXPIRED (deprecated!)",
        blocking: true,
        valid: true,
      };
    }

    if (profile === "max" || typeof profile === "string") {
      for (var i = 0; i < cache[tag].length; i++) {
        cache[tag][i].stale = true;
      }
      return {
        tag: tag,
        profile: profile,
        behavior: "STALE (stale-while-revalidate!)",
        blocking: false,
        note: "Serve stale → fetch fresh in background! ★",
        valid: true,
      };
    }

    if (
      profile &&
      typeof profile === "object" &&
      profile.expire !== undefined
    ) {
      if (profile.expire === 0) {
        delete cache[tag];
        return {
          tag: tag,
          behavior: "EXPIRED IMMEDIATELY (webhook pattern!)",
          valid: true,
        };
      }
      return {
        tag: tag,
        behavior: "Custom expire: " + profile.expire + "ms",
        valid: true,
      };
    }

    return { error: "Invalid profile!", valid: false };
  }

  function getTagStatus(tag) {
    if (!cache[tag]) return { tag: tag, exists: false };
    return {
      tag: tag,
      exists: true,
      entries: cache[tag].length,
      stale: cache[tag].some(function (e) {
        return e.stale;
      }),
    };
  }

  function demo() {
    console.log("═══ RevalidateTag Engine ═══");

    tagData("posts", { id: 1, title: "Hello" });
    tagData("posts", { id: 2, title: "World" });
    tagData("users", { id: 1, name: "Lee" });

    console.log("\n── Before ──");
    console.log(getTagStatus("posts"));

    console.log("\n── Revalidate (max) ──");
    console.log(revalidateTag("posts", "max"));
    console.log(getTagStatus("posts"));

    console.log("\n── Webhook (expire: 0) ──");
    console.log(revalidateTag("users", { expire: 0 }));
    console.log(getTagStatus("users"));

    console.log("\n── Deprecated (no profile) ──");
    tagData("temp", { id: 1 });
    console.log(revalidateTag("temp"));
  }

  return { demo: demo };
})();
// Chạy: RevalidateTagEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: revalidateTag với profile="max" hoạt động thế nào?       │
  │  → Mark tag as STALE! ★                                      │
  │  → Next visit: serve stale + fetch fresh background! ★      │
  │  → Stale-while-revalidate semantics! ★                      │
  │  → KHÔNG trigger revalidation ngay! ★★★                     │
  │                                                              │
  │  ❓ 2: 2 cách tag data?                                         │
  │  → fetch(url, { next: { tags: ['posts'] } })! ★             │
  │  → 'use cache' + cacheTag('posts')! ★                       │
  │                                                              │
  │  ❓ 3: revalidateTag vs revalidatePath?                          │
  │  → Tag: cross-page, ALL pages with that tag! ★              │
  │  → Path: specific page/layout only! ★                       │
  │  → Best practice: dùng CẢ HAI! ★                            │
  │                                                              │
  │  ❓ 4: Webhook cần expire ngay → làm sao?                       │
  │  → revalidateTag(tag, { expire: 0 })! ★                     │
  │  → Route Handler pattern! ★                                 │
  │  → Server Actions → dùng updateTag() thay thế! ★           │
  │                                                              │
  │  ❓ 5: Single-arg deprecated?                                    │
  │  → revalidateTag(tag) is DEPRECATED! ★★★                    │
  │  → Blocking cache miss! Performance issue! ★                │
  │  → Migrate: revalidateTag(tag, 'max')! ★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
