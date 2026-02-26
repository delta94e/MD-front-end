# updateTag() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/updateTag
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/cache`

---

## §1. updateTag() Là Gì?

```
  updateTag() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Update cached data ON-DEMAND theo cache tag! ★            │
  │  → import { updateTag } from 'next/cache'! ★                │
  │  → CHỈ dùng trong Server Actions! ★★★                       │
  │                                                              │
  │  MỤC ĐÍCH CHÍNH:                                              │
  │  → READ-YOUR-OWN-WRITES! ★★★                                │
  │  → User thay đổi data → UI NGAY LẬP TỨC hiển thị mới! ★   │
  │  → KHÔNG serve stale data! ★                                │
  │                                                              │
  │  READ-YOUR-OWN-WRITES LÀ GÌ?                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  User tạo bài post mới:                                │    │
  │  │  ① User submit form "Create Post"                      │    │
  │  │  ② Server Action: db.post.create(...)                  │    │
  │  │  ③ updateTag('posts')  ← EXPIRE cache! ★              │    │
  │  │  ④ redirect('/posts')                                  │    │
  │  │  ⑤ User thấy NGAY bài post mới! ★★★                   │    │
  │  │                                                       │    │
  │  │  KHÔNG DÙNG updateTag:                                 │    │
  │  │  ① User submit form                                    │    │
  │  │  ② Server Action: db.post.create(...)                  │    │
  │  │  ③ redirect('/posts')                                  │    │
  │  │  ④ User thấy STALE DATA! ❌ Bài post mới KHÔNG CÓ!   │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Server Action                                         │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Mutate data (create/update/delete)                   │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  updateTag('posts')                                   │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Cache entry for 'posts' → EXPIRED! ★                │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Next request → WAIT for fresh data! ★               │    │
  │  │  (KHÔNG serve stale!)                                 │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  User sees FRESH data! ✅                             │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Parameters + Returns!

```
  SIGNATURE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  updateTag(tag: string): void                                │
  │                                                              │
  │  PARAMETERS:                                                  │
  │  ┌───────────┬──────────┬────────────────────────────────┐   │
  │  │ Param      │ Type     │ Mô tả                          │   │
  │  ├───────────┼──────────┼────────────────────────────────┤   │
  │  │ tag        │ string   │ Cache tag muốn update! ★       │   │
  │  │            │          │ Max 256 characters! ★           │   │
  │  │            │          │ CASE-SENSITIVE! ★★★             │   │
  │  └───────────┴──────────┴────────────────────────────────┘   │
  │                                                              │
  │  RETURNS: void — KHÔNG trả giá trị gì! ★                    │
  │                                                              │
  │  CASE-SENSITIVE NGHĨA LÀ:                                    │
  │  → updateTag('Posts') ≠ updateTag('posts')! ★★★              │
  │  → Phải match CHÍNH XÁC tag khi set! ★                     │
  │                                                              │
  │  TAG PHẢI ĐƯỢC GÁN TRƯỚC (2 cách):                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  CÁCH 1: fetch + next.tags:                            │    │
  │  │  ┌────────────────────────────────────────────────┐   │    │
  │  │  │ fetch(url, { next: { tags: ['posts'] } })      │   │    │
  │  │  │           ← tag = 'posts'! ★                   │   │    │
  │  │  └────────────────────────────────────────────────┘   │    │
  │  │                                                       │    │
  │  │  CÁCH 2: cacheTag + 'use cache':                       │    │
  │  │  ┌────────────────────────────────────────────────┐   │    │
  │  │  │ import { cacheTag } from 'next/cache'          │   │    │
  │  │  │                                                │   │    │
  │  │  │ async function getData() {                      │   │    │
  │  │  │   'use cache'                                   │   │    │
  │  │  │   cacheTag('posts')  ← tag = 'posts'! ★       │   │    │
  │  │  │   // ...                                        │   │    │
  │  │  │ }                                               │   │    │
  │  │  └────────────────────────────────────────────────┘   │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. updateTag vs revalidateTag — KHÁC NHAU!

```
  SO SÁNH CHI TIẾT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────────────────┬──────────────────┬─────────────────┐ │
  │  │                    │ updateTag         │ revalidateTag    │ │
  │  ├────────────────────┼──────────────────┼─────────────────┤ │
  │  │ Import             │ next/cache        │ next/cache       │ │
  │  │ Context            │ Server Actions    │ Server Actions   │ │
  │  │                    │ ONLY! ★★★         │ + Route Handlers │ │
  │  │                    │                  │ + khác! ★        │ │
  │  │ Stale data?        │ KHÔNG! ★★★       │ CÓ! (SWR!) ★    │ │
  │  │ Next request       │ WAIT fresh! ★    │ Serve stale +    │ │
  │  │                    │                  │ fetch bg! ★      │ │
  │  │ Use case           │ Read-your-own-   │ Background       │ │
  │  │                    │ writes! ★         │ revalidation! ★  │ │
  │  │ User experience    │ Immediate! ★     │ Eventually       │ │
  │  │                    │ Thấy ngay!       │ consistent! ★    │ │
  │  └────────────────────┴──────────────────┴─────────────────┘ │
  │                                                              │
  │  HÌNH DUNG:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  updateTag('posts'):                                   │    │
  │  │  ┌─────────────────────────────────────────────────┐  │    │
  │  │  │ User action → mutate → updateTag → redirect     │  │    │
  │  │  │   → next request WAITS → fetch fresh → show! ★ │  │    │
  │  │  │                                                 │  │    │
  │  │  │ Timeline:                                        │  │    │
  │  │  │ ──[mutate]──[expire]──[wait]──[fresh data]──→  │  │    │
  │  │  │                       ↑                         │  │    │
  │  │  │                 User đợi ở đây!                 │  │    │
  │  │  │                 Nhưng thấy data MỚI! ★          │  │    │
  │  │  └─────────────────────────────────────────────────┘  │    │
  │  │                                                       │    │
  │  │  revalidateTag('posts', 'max'):                        │    │
  │  │  ┌─────────────────────────────────────────────────┐  │    │
  │  │  │ User action → mutate → revalidateTag            │  │    │
  │  │  │   → next request → serve STALE → fetch bg! ★   │  │    │
  │  │  │                                                 │  │    │
  │  │  │ Timeline:                                        │  │    │
  │  │  │ ──[mutate]──[serve stale]──[bg fetch]──→        │  │    │
  │  │  │              ↑                                   │  │    │
  │  │  │        User thấy CŨ trước!                      │  │    │
  │  │  │        Rồi mới thấy MỚI! ★                     │  │    │
  │  │  └─────────────────────────────────────────────────┘  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LEGACY NOTE:                                                 │
  │  → revalidateTag() KHÔNG có profile = legacy behavior! ★    │
  │  → Legacy behavior = TƯƠNG ĐƯƠNG updateTag()! ★★★            │
  │  → Vậy updateTag() = revalidateTag() cũ! ★                 │
  │  → revalidateTag('x', 'max') = SWR mới! ★                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Usage Rules — CHỈ Server Actions!

```
  RULES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────┬──────────┬──────────────────────┐  │
  │  │ Context               │ Dùng?    │ Thay thế             │  │
  │  ├──────────────────────┼──────────┼──────────────────────┤  │
  │  │ Server Actions       │ ✅ ★★★   │ — (chỉ dùng ở đây!) │  │
  │  │ Route Handlers       │ ❌        │ revalidateTag! ★     │  │
  │  │ Client Components    │ ❌        │ Server Action! ★     │  │
  │  │ Server Components    │ ❌        │ revalidateTag! ★     │  │
  │  │ Middleware            │ ❌        │ revalidateTag! ★     │  │
  │  │ Webhooks (API)       │ ❌        │ revalidateTag! ★     │  │
  │  └──────────────────────┴──────────┴──────────────────────┘  │
  │                                                              │
  │  ⚠️ NGOÀI SERVER ACTION → THROW ERROR! ★★★                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  // Route Handler — KHÔNG ĐƯỢC! ❌                     │    │
  │  │  import { updateTag } from 'next/cache'               │    │
  │  │                                                       │    │
  │  │  export async function POST() {                        │    │
  │  │    updateTag('posts')                                  │    │
  │  │    // ❌ Error: updateTag can only be called            │    │
  │  │    // from within a Server Action!                     │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  // GIẢI PHÁP: Dùng revalidateTag! ★                  │    │
  │  │  import { revalidateTag } from 'next/cache'           │    │
  │  │                                                       │    │
  │  │  export async function POST() {                        │    │
  │  │    revalidateTag('posts', 'max')  ← OK! ★             │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO CHỈ SERVER ACTIONS?                                  │
  │  → Server Action = USER action trực tiếp! ★                 │
  │  → User tạo/sửa data → cần thấy NGAY! ★                    │
  │  → Route Handler = API call → background OK! ★              │
  │  → Webhook = external → stale-while-revalidate OK! ★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Examples Chi Tiết!

```
  EXAMPLE 1: Server Action — Create Post!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  // app/actions/post.ts                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 'use server'                                          │    │
  │  │                                                       │    │
  │  │ import { updateTag } from 'next/cache'                │    │
  │  │ import { redirect } from 'next/navigation'            │    │
  │  │                                                       │    │
  │  │ export async function createPost(formData: FormData) {│    │
  │  │   const title = formData.get('title')                 │    │
  │  │   const content = formData.get('content')             │    │
  │  │                                                       │    │
  │  │   // ① Mutate data!                                    │    │
  │  │   const post = await db.post.create({                  │    │
  │  │     data: { title, content },                          │    │
  │  │   })                                                   │    │
  │  │                                                       │    │
  │  │   // ② Invalidate cache tags! ★★★                      │    │
  │  │   updateTag('posts')                                  │    │
  │  │   // → Expire danh sách posts! ★                      │    │
  │  │                                                       │    │
  │  │   updateTag(`post-${post.id}`)                        │    │
  │  │   // → Expire chi tiết post! ★                        │    │
  │  │                                                       │    │
  │  │   // ③ Redirect → user thấy fresh data! ✅             │    │
  │  │   redirect(`/posts/${post.id}`)                       │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GỌI NHIỀU updateTag() CÓ ĐƯỢC KHÔNG?                        │
  │  → CÓ! ★ Mỗi tag expire riêng biệt! ★                     │
  │  → updateTag('posts')     = expire list page! ★             │
  │  → updateTag(`post-123`)  = expire detail page! ★           │
  │  → PHẢI expire TẤT CẢ tags liên quan! ★★★                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  EXAMPLE 2: Error — Route Handler!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  // app/api/revalidate/route.ts ← Route Handler!             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { updateTag } from 'next/cache'                │    │
  │  │                                                       │    │
  │  │ export async function POST() {                         │    │
  │  │   updateTag('posts')  ← ❌ THROW ERROR! ★★★          │    │
  │  │   // Error: updateTag can only be called               │    │
  │  │   // from within a Server Action                       │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FIX:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { revalidateTag } from 'next/cache'            │    │
  │  │                                                       │    │
  │  │ export async function POST() {                         │    │
  │  │   revalidateTag('posts', 'max')  ← ✅ Route Handler!  │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. When To Use — Decision Guide!

```
  DECISION GUIDE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  KHI NÀO DÙNG updateTag()?                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ✅ Trong Server Action! ★                             │    │
  │  │ ✅ Cần cache NGAY LẬP TỨC bị invalidate! ★           │    │
  │  │ ✅ Read-your-own-writes! User thấy data mới! ★       │    │
  │  │ ✅ Next request PHẢI thấy data updated! ★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHI NÀO DÙNG revalidateTag()?                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ✅ Route Handler / non-action context! ★              │    │
  │  │ ✅ Stale-while-revalidate semantics! ★                │    │
  │  │ ✅ Webhook / API endpoint! ★                          │    │
  │  │ ✅ Background cache invalidation! ★                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DECISION TREE:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Cần invalidate cache tag?                             │    │
  │  │       │                                                │    │
  │  │    ┌──┴──────────────────────┐                         │    │
  │  │  Trong         Trong Route Handler/                    │    │
  │  │  Server        Webhook/other?                          │    │
  │  │  Action?           │                                   │    │
  │  │    │                ▼                                   │    │
  │  │    │          revalidateTag('x', 'max')! ★             │    │
  │  │    │          (stale-while-revalidate!)                 │    │
  │  │    ▼                                                   │    │
  │  │  User cần thấy                                         │    │
  │  │  data MỚI ngay?                                        │    │
  │  │       │                                                │    │
  │  │    ┌──┴──┐                                              │    │
  │  │   YES   NO                                             │    │
  │  │    │     │                                              │    │
  │  │    ▼     ▼                                              │    │
  │  │ updateTag()  revalidateTag()                            │    │
  │  │ (immediate!)  (background!)                             │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — UpdateTagEngine!

```javascript
var UpdateTagEngine = (function () {
  // ═══════════════════════════════════
  // 1. TAG STORE (simulated cache)
  // ═══════════════════════════════════
  var tagStore = {};
  var TAG_MAX_LENGTH = 256;

  function setCache(tag, data) {
    if (tag.length > TAG_MAX_LENGTH) {
      return { error: "Tag quá dài! Max " + TAG_MAX_LENGTH + " chars! ★" };
    }
    tagStore[tag] = {
      data: data,
      timestamp: Date.now(),
      expired: false,
    };
    return { set: true, tag: tag };
  }

  // ═══════════════════════════════════
  // 2. updateTag SIMULATOR
  // ═══════════════════════════════════
  function updateTag(tag, context) {
    // Validate context — CHỈ Server Action!
    if (context !== "server-action") {
      return {
        error: "updateTag can only be called from within a Server Action! ★★★",
        context: context,
        fix: "Dùng revalidateTag('" + tag + "', 'max') thay thế! ★",
      };
    }

    // Case-sensitive check
    if (!tagStore[tag]) {
      return {
        warning: "Tag '" + tag + "' not found! Case-sensitive! ★★★",
        hint: "Tags available: " + Object.keys(tagStore).join(", "),
      };
    }

    // Expire immediately
    tagStore[tag].expired = true;
    tagStore[tag].expiredAt = Date.now();
    return {
      action: "EXPIRED",
      tag: tag,
      note: "Next request sẽ WAIT for fresh data! ★",
      behavior: "read-your-own-writes! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. revalidateTag SIMULATOR (so sánh)
  // ═══════════════════════════════════
  function revalidateTag(tag, profile) {
    if (!tagStore[tag]) {
      return { warning: "Tag '" + tag + "' not found!" };
    }

    if (profile === "max") {
      // Stale-while-revalidate
      tagStore[tag].stale = true;
      return {
        action: "STALE-WHILE-REVALIDATE",
        tag: tag,
        note: "Serve stale → fetch fresh in background! ★",
        behavior: "eventually consistent! ★",
      };
    }

    // No profile = legacy = same as updateTag
    tagStore[tag].expired = true;
    return {
      action: "EXPIRED (legacy)",
      tag: tag,
      note: "Legacy behavior = TƯƠNG ĐƯƠNG updateTag()! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 4. REQUEST SIMULATOR
  // ═══════════════════════════════════
  function simulateRequest(tag) {
    if (!tagStore[tag]) {
      return { status: "MISS", note: "Cache miss → fetch fresh! ★" };
    }

    var entry = tagStore[tag];

    if (entry.expired) {
      return {
        status: "EXPIRED → WAIT",
        note: "Cache expired by updateTag → WAIT for fresh data! ★",
        staleServed: false,
        userSeesOldData: false,
      };
    }

    if (entry.stale) {
      return {
        status: "STALE → SERVE + BG FETCH",
        note: "Cache stale by revalidateTag → serve stale + fetch bg! ★",
        staleServed: true,
        userSeesOldData: true,
      };
    }

    return {
      status: "HIT",
      data: entry.data,
      note: "Cache hit! Serve cached data! ★",
    };
  }

  // ═══════════════════════════════════
  // 5. FULL FLOW SIMULATOR
  // ═══════════════════════════════════
  function simulateCreatePost() {
    var results = [];

    // Setup: cache has posts
    setCache("posts", [{ id: 1, title: "Old Post" }]);
    setCache("post-1", { id: 1, title: "Old Post" });
    results.push({
      step: "SETUP",
      store: JSON.parse(JSON.stringify(tagStore)),
    });

    // Step 1: User reads (cache HIT)
    results.push({ step: "READ_BEFORE", result: simulateRequest("posts") });

    // Step 2: Server Action — create post
    results.push({ step: "MUTATE", action: "db.post.create(...)" });

    // Step 3: updateTag
    results.push({
      step: "UPDATE_TAG_1",
      result: updateTag("posts", "server-action"),
    });
    results.push({
      step: "UPDATE_TAG_2",
      result: updateTag("post-2", "server-action"),
    });

    // Step 4: Next request
    results.push({ step: "READ_AFTER", result: simulateRequest("posts") });

    return results;
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ UpdateTag Engine ═══");

    console.log("\n── 1. Context Validation ──");
    setCache("posts", [{ id: 1 }]);
    console.log("Server Action:", updateTag("posts", "server-action")); // OK
    setCache("posts", [{ id: 1 }]); // reset
    console.log("Route Handler:", updateTag("posts", "route-handler")); // ERROR

    console.log("\n── 2. Case-Sensitive ──");
    setCache("posts", [{ id: 1 }]);
    console.log("'posts':", updateTag("posts", "server-action")); // OK
    setCache("posts", [{ id: 1 }]); // reset
    console.log("'Posts':", updateTag("Posts", "server-action")); // NOT FOUND

    console.log("\n── 3. updateTag vs revalidateTag ──");
    setCache("articles", [{ id: 1 }]);
    console.log("updateTag:", updateTag("articles", "server-action"));
    console.log("request after updateTag:", simulateRequest("articles"));

    setCache("articles", [{ id: 1 }]);
    console.log("revalidateTag(max):", revalidateTag("articles", "max"));
    console.log("request after revalidateTag:", simulateRequest("articles"));

    console.log("\n── 4. Full Create Post Flow ──");
    var flow = simulateCreatePost();
    for (var i = 0; i < flow.length; i++) {
      console.log(flow[i].step + ":", flow[i].result || flow[i].action || "");
    }
  }

  return { demo: demo };
})();
// Chạy: UpdateTagEngine.demo();
```

---

## §8. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: updateTag() vs revalidateTag() — khác gì?               │
  │  → updateTag: CHỈ Server Actions! ★★★                        │
  │    → Expire NGAY → next request WAIT fresh! ★                │
  │    → Read-your-own-writes! User thấy data mới! ★            │
  │  → revalidateTag: Server Actions + Route Handlers! ★         │
  │    → profile='max' → Serve stale + bg fetch! ★              │
  │    → Stale-while-revalidate! Eventually consistent! ★       │
  │  → Legacy revalidateTag (no profile) = updateTag! ★★★       │
  │                                                              │
  │  ❓ 2: Read-your-own-writes nghĩa là gì?                       │
  │  → User VIẾT data (create/update/delete)! ★                  │
  │  → User NGAY LẬP TỨC ĐỌC lại data MỚI! ★                  │
  │  → Không thấy stale/cũ! ★★★                                │
  │  → Ví dụ: Tạo post → redirect → thấy post mới! ★          │
  │                                                              │
  │  ❓ 3: Tại sao CHỈ dùng trong Server Actions?                  │
  │  → Server Action = USER action TRỰC TIẾP! ★                 │
  │  → User tạo/sửa data → CẦN thấy ngay! ★                   │
  │  → Route Handler = API/webhook → background OK! ★           │
  │  → Dùng revalidateTag cho Route Handler! ★                 │
  │                                                              │
  │  ❓ 4: updateTag() ngoài Server Action → sao?                  │
  │  → THROW ERROR! ★★★                                          │
  │  → "updateTag can only be called from within                 │
  │     a Server Action"! ★                                      │
  │  → FIX: revalidateTag('x', 'max')! ★                       │
  │                                                              │
  │  ❓ 5: Tag case-sensitive nghĩa là gì?                         │
  │  → updateTag('Posts') ≠ updateTag('posts')! ★★★              │
  │  → PHẢI match CHÍNH XÁC tag khi set! ★                     │
  │  → Max 256 characters! ★                                    │
  │                                                              │
  │  ❓ 6: Gọi nhiều updateTag() trong 1 Server Action?            │
  │  → CÓ! Mỗi tag expire riêng! ★                             │
  │  → Ví dụ: updateTag('posts') + updateTag('post-123')! ★    │
  │  → PHẢI expire hết tags liên quan để tránh stale! ★★★      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
