# cacheTag() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/cacheTag
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Requires**: `cacheComponents: true` trong next.config.js!

---

## §1. cacheTag() Là Gì?

```
  cacheTag() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → GẮN TAG cho cached data! ★                                │
  │  → Để ON-DEMAND INVALIDATION! ★                              │
  │  → Purge CHÍNH XÁC cache entry cần xóa! ★                   │
  │  → Không ảnh hưởng cache entries khác! ★                     │
  │                                                              │
  │  IMPORT:                                                      │
  │  import { cacheTag } from 'next/cache'                       │
  │  import { revalidateTag } from 'next/cache'                  │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ① GẮN TAG:                                            │    │
  │  │  async function getData() {                           │    │
  │  │    'use cache'                                         │    │
  │  │    cacheTag('my-data')  ← Gắn tag! ★                  │    │
  │  │    return fetch('/api/data')                           │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │      CACHE STORE:                                      │    │
  │  │      ┌──────────────────────────────────┐             │    │
  │  │      │ Entry     │ Tags                 │             │    │
  │  │      ├───────────┼──────────────────────┤             │    │
  │  │      │ getData() │ ['my-data'] ★        │             │    │
  │  │      │ getUser() │ ['user-123'] ★       │             │    │
  │  │      │ getPosts()│ ['posts','post-1'] ★ │             │    │
  │  │      └──────────────────────────────────┘             │    │
  │  │                                                       │    │
  │  │  ② INVALIDATE:                                         │    │
  │  │  revalidateTag('my-data')  ← Xóa cache! ★             │    │
  │  │       │                                               │    │
  │  │       ▼                                               │    │
  │  │  getData() cache → PURGED! ★                          │    │
  │  │  getUser() cache → KHÔNG ảnh hưởng! ✅                │    │
  │  │  getPosts() cache → KHÔNG ảnh hưởng! ✅               │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Usage + "Good to Know"!

```
  USAGE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  // GẮN TAG:                                                   │
  │  import { cacheTag } from 'next/cache'                       │
  │                                                              │
  │  export async function getData() {                            │
  │    'use cache'                  ← BẮT BUỘC! ★                │
  │    cacheTag('my-data')          ← Gắn 1 tag!                │
  │    const data = await fetch('/api/data')                     │
  │    return data                                               │
  │  }                                                           │
  │                                                              │
  │  // INVALIDATE:                                                │
  │  'use server'                                                 │
  │  import { revalidateTag } from 'next/cache'                  │
  │                                                              │
  │  export async function submit() {                             │
  │    await addPost()                                           │
  │    revalidateTag('my-data')     ← Purge cache! ★             │
  │  }                                                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  "GOOD TO KNOW" — 3 QUY TẮC:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① IDEMPOTENT! ★                                              │
  │  → Gắn CÙNG tag nhiều lần = KHÔNG có thêm effect!           │
  │  → cacheTag('a'); cacheTag('a') = chỉ 1 tag 'a'! ★          │
  │                                                              │
  │  ② MULTIPLE TAGS! ★                                           │
  │  → Truyền nhiều string VALUES cùng lúc!                      │
  │  → cacheTag('tag-one', 'tag-two')  ← 2 tags! ★              │
  │  → revalidateTag('tag-one') → PURGE entry này! ★            │
  │  → revalidateTag('tag-two') → CŨNG PURGE! ★                 │
  │                                                              │
  │  ③ LIMITS! ★★★                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Max tag LENGTH:   256 characters! ★                   │    │
  │  │ Max tag ITEMS:    128 tags / entry! ★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Examples — 3 Patterns!

```
  PATTERN 1: TAG COMPONENTS/FUNCTIONS!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  export async function Bookings({ type = 'haircut' }) {      │
  │    'use cache'                                                │
  │    cacheTag('bookings-data')  ← Tag component! ★             │
  │    const data = await fetch(`/api/bookings?type=${type}`)    │
  │    return /* render bookings */                              │
  │  }                                                           │
  │                                                              │
  │  → Toàn bộ component output được tagged! ★                   │
  │  → revalidateTag('bookings-data') → purge component! ★      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  PATTERN 2: TAGS TỪ EXTERNAL DATA! ★★★
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  export async function Bookings({ type = 'haircut' }) {      │
  │    async function getBookingsData() {                        │
  │      'use cache'                                              │
  │      const data = await fetch(...)                           │
  │      cacheTag('bookings-data', data.id)  ← Dynamic tag! ★   │
  │      return data                                             │
  │    }                                                         │
  │    return /* ... */                                          │
  │  }                                                           │
  │                                                              │
  │  → Tag TỪ data trả về! ★                                    │
  │  → cacheTag SAU fetch! ★                                     │
  │  → Invalidate cụ thể: revalidateTag(data.id)! ★             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  PATTERN 3: INVALIDATE TAGGED CACHE!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  'use server'                                                 │
  │  import { revalidateTag } from 'next/cache'                  │
  │                                                              │
  │  export async function updateBookings() {                     │
  │    await updateBookingData()                                 │
  │    revalidateTag('bookings-data')  ← Purge! ★               │
  │  }                                                           │
  │                                                              │
  │  WHERE TO CALL revalidateTag:                                 │
  │  → Server Action (form submit!) ★                            │
  │  → Route Handler (API endpoint!) ★                           │
  │  → Webhook handler! ★                                        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  cacheTag + cacheLife — COMBO:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  async function getPostContent(slug) {                        │
  │    'use cache'                                                │
  │    const post = await fetchPost(slug)                        │
  │                                                              │
  │    cacheTag(`post-${slug}`)    ← Tag cụ thể! ★               │
  │    cacheLife('days')           ← Lifetime! ★                 │
  │                                                              │
  │    return post.data                                          │
  │  }                                                           │
  │                                                              │
  │  → cacheTag = WHAT to invalidate! ★                          │
  │  → cacheLife = HOW LONG to cache! ★                          │
  │  → cacheTag + revalidateTag = ON-DEMAND purge! ★             │
  │  → cacheLife = TIME-BASED expiry! ★                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — CacheTagEngine!

```javascript
var CacheTagEngine = (function () {
  // ═══════════════════════════════════
  // 1. CACHE STORE
  // ═══════════════════════════════════
  var MAX_TAG_LENGTH = 256;
  var MAX_TAG_ITEMS = 128;
  var cache = {}; // key → { data, tags: Set }

  function cacheTag(key, tags) {
    if (!cache[key]) {
      cache[key] = { data: null, tags: new Set() };
    }
    var tagList = Array.isArray(tags) ? tags : [tags];
    var errors = [];

    for (var i = 0; i < tagList.length; i++) {
      var tag = tagList[i];
      if (typeof tag !== "string") {
        errors.push("Tag phải là string! Got: " + typeof tag);
        continue;
      }
      if (tag.length > MAX_TAG_LENGTH) {
        errors.push(
          "Tag '" +
            tag.substring(0, 20) +
            "...' vượt " +
            MAX_TAG_LENGTH +
            " chars!",
        );
        continue;
      }
      if (cache[key].tags.size >= MAX_TAG_ITEMS) {
        errors.push("Vượt " + MAX_TAG_ITEMS + " tags! ★");
        break;
      }
      cache[key].tags.add(tag); // Idempotent! ★
    }

    return { key: key, tags: Array.from(cache[key].tags), errors: errors };
  }

  function setCacheData(key, data) {
    if (!cache[key]) cache[key] = { data: null, tags: new Set() };
    cache[key].data = data;
  }

  // ═══════════════════════════════════
  // 2. REVALIDATE TAG
  // ═══════════════════════════════════
  function revalidateTag(tag) {
    var purged = [];
    for (var key in cache) {
      if (cache.hasOwnProperty(key) && cache[key].tags.has(tag)) {
        purged.push(key);
        delete cache[key];
      }
    }
    return {
      tag: tag,
      purgedEntries: purged,
      count: purged.length,
    };
  }

  // ═══════════════════════════════════
  // 3. TAG VALIDATOR
  // ═══════════════════════════════════
  function validateTags(tags) {
    var errors = [];
    if (tags.length > MAX_TAG_ITEMS) {
      errors.push("Quá " + MAX_TAG_ITEMS + " tags! Có " + tags.length + "!");
    }
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].length > MAX_TAG_LENGTH) {
        errors.push("Tag[" + i + "] quá " + MAX_TAG_LENGTH + " chars!");
      }
    }
    return { valid: errors.length === 0, errors: errors };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ CacheTag Engine ═══");

    console.log("\n── Set Tags ──");
    setCacheData("getUser", { name: "Acme" });
    console.log("User tags:", cacheTag("getUser", ["user-123", "users"]));

    setCacheData("getPosts", [{ id: 1 }, { id: 2 }]);
    console.log(
      "Posts tags:",
      cacheTag("getPosts", ["posts", "post-1", "post-2"]),
    );

    setCacheData("getBookings", { type: "haircut" });
    console.log("Bookings tags:", cacheTag("getBookings", "bookings-data"));

    // Idempotent!
    console.log("Duplicate:", cacheTag("getUser", "user-123"));

    console.log("\n── Revalidate ──");
    console.log("Purge 'user-123':", revalidateTag("user-123"));
    console.log("Purge 'post-1':", revalidateTag("post-1"));
    console.log("Purge 'unknown':", revalidateTag("unknown"));

    console.log("\n── Validate ──");
    console.log("OK:", validateTags(["a", "b", "c"]));
    console.log("Too long:", validateTags(["x".repeat(300)]));
  }

  return { demo: demo };
})();
// Chạy: CacheTagEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: cacheTag() dùng để làm gì?                              │
  │  → GẮN TAG cho cached data! ★                                │
  │  → Để ON-DEMAND INVALIDATION bằng revalidateTag()! ★        │
  │  → Purge CHÍNH XÁC entry, không ảnh hưởng khác! ★           │
  │                                                              │
  │  ❓ 2: cacheTag vs cacheLife — khác gì?                        │
  │  → cacheTag = WHAT to invalidate (tag-based!) ★              │
  │  → cacheLife = HOW LONG to cache (time-based!) ★             │
  │  → cacheTag + revalidateTag = on-demand purge! ★             │
  │  → cacheLife = automatic time-based expiry! ★                │
  │  → Thường DÙNG CẢ HAI cùng nhau! ★                          │
  │                                                              │
  │  ❓ 3: Limits của cacheTag?                                     │
  │  → Max tag LENGTH: 256 characters! ★                         │
  │  → Max tag ITEMS: 128 tags per entry! ★                      │
  │  → Idempotent: gắn cùng tag nhiều lần = 1 lần! ★            │
  │                                                              │
  │  ❓ 4: Dynamic tags từ data — cách nào?                        │
  │  → Fetch data TRƯỚC! ★                                       │
  │  → cacheTag('bookings', data.id) SAU fetch! ★               │
  │  → revalidateTag(data.id) để purge cụ thể! ★                │
  │                                                              │
  │  ❓ 5: revalidateTag gọi ở đâu?                                │
  │  → Server Action (form submit!) ★                            │
  │  → Route Handler (API endpoint!) ★                           │
  │  → Webhook handler! ★                                        │
  │  → KHÔNG gọi trong Client Component! ★                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
