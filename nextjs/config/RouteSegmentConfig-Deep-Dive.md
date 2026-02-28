# Route Segment Config — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình** — chỉ có bảng, code blocks, callout boxes!

---

## §1. Tổng Quan — Route Segment Config là gì?

```
  ROUTE SEGMENT CONFIG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ Cấu hình hành vi của Page/Layout/Route Handler! ★         │
  │  ★ Bằng cách EXPORT các biến const từ file! ★                │
  │  ★ CHỈ hoạt động trong Server Components! ★                  │
  │                                                              │
  │  // page.tsx hoặc layout.tsx hoặc route.ts                       │
  │  export const dynamic = 'auto'                                 │
  │  export const dynamicParams = true                              │
  │  export const revalidate = false                                │
  │  export const fetchCache = 'auto'                               │
  │  export const runtime = 'nodejs'                                │
  │  export const preferredRegion = 'auto'                          │
  │  export const maxDuration = 5                                   │
  │                                                              │
  │  ⚠️ LƯU Ý QUAN TRỌNG:                                        │
  │  → Nếu bật cacheComponents flag → các option này BỊ VÔ HIỆU!│
  │  → Tương lai sẽ bị DEPRECATED!                                │
  │  → generateStaticParams KHÔNG dùng được trong 'use client'!  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  BẢNG TÓM TẮT (từ trang docs):
  ┌──────────────────┬────────────────────────────────┬──────────┐
  │ Option           │ Type                           │ Default  │
  ├──────────────────┼────────────────────────────────┼──────────┤
  │ dynamic           │ 'auto'|'force-dynamic'|        │ 'auto'   │
  │                  │ 'error'|'force-static'         │          │
  ├──────────────────┼────────────────────────────────┼──────────┤
  │ dynamicParams     │ boolean                        │ true     │
  ├──────────────────┼────────────────────────────────┼──────────┤
  │ revalidate        │ false | 0 | number             │ false    │
  ├──────────────────┼────────────────────────────────┼──────────┤
  │ fetchCache        │ 'auto'|'default-cache'|        │ 'auto'   │
  │                  │ 'only-cache'|'force-cache'|    │          │
  │                  │ 'force-no-store'|              │          │
  │                  │ 'default-no-store'|            │          │
  │                  │ 'only-no-store'                │          │
  ├──────────────────┼────────────────────────────────┼──────────┤
  │ runtime           │ 'nodejs' | 'edge'              │ 'nodejs' │
  ├──────────────────┼────────────────────────────────┼──────────┤
  │ preferredRegion   │ 'auto'|'global'|'home'|        │ 'auto'   │
  │                  │ string | string[]              │          │
  ├──────────────────┼────────────────────────────────┼──────────┤
  │ maxDuration       │ number                         │ (none)   │
  └──────────────────┴────────────────────────────────┴──────────┘
```

---

## §2. dynamic — Điều Khiển Static vs Dynamic!

```
  dynamic — 4 GIÁ TRỊ:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① 'auto' (MẶC ĐỊNH!):                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Next.js TỰ QUYẾT ĐỊNH! ★                          │    │
  │  │ → Cache TỐI ĐA có thể!                               │    │
  │  │ → Component vẫn tự do opt-in dynamic!                │    │
  │  │ → Granular control ở từng fetch request!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② 'force-dynamic': ★★★                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → ÉP DYNAMIC mỗi request! (SSR!)                    │    │
  │  │ → Tương đương getServerSideProps (pages dir!)        │    │
  │  │ → Mọi fetch() → { cache: 'no-store',                │    │
  │  │                    next: { revalidate: 0 } }! ★      │    │
  │  │ → Tương đương fetchCache = 'force-no-store'!         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ 'error': ★★★                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → ÉP STATIC! ★                                       │    │
  │  │ → Dùng Dynamic API (cookies, headers) → THROW ERROR! │    │
  │  │ → Tương đương getStaticProps (pages dir!)             │    │
  │  │ → Mọi fetch() → { cache: 'force-cache' }! ★          │    │
  │  │ → fetchCache = 'only-cache'! ★                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ④ 'force-static': ★★★                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → ÉP STATIC nhưng KHÔNG throw error! ★               │    │
  │  │ → cookies() → trả empty values! ★                    │    │
  │  │ → headers() → trả empty values! ★                    │    │
  │  │ → useSearchParams() → trả rỗng! ★                    │    │
  │  │ → VẪN có thể dùng revalidate, revalidatePath,        │    │
  │  │   revalidateTag! ★                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  SO SÁNH PAGES DIR ↔ APP DIR:
  ┌──────────────────────┬───────────────────────────────┐
  │ Pages Dir (cũ)       │ App Dir (mới!) ★              │
  ├──────────────────────┼───────────────────────────────┤
  │ getStaticProps        │ dynamic = 'error' ★           │
  │ getServerSideProps    │ dynamic = 'force-dynamic' ★   │
  └──────────────────────┴───────────────────────────────┘

  ★ "Good to know" từ docs:
  → App dir model mới ưu tiên GRANULAR caching ở fetch level!
  → dynamic option = cách opt BACK IN to old binary model!
  → Migration guide: getServerSideProps → 'force-dynamic',
    getStaticProps → 'error'!
```

---

## §3. dynamicParams — Xử Lý Params Chưa Generate!

```
  dynamicParams:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  export const dynamicParams = true // true | false            │
  │                                                              │
  │  Dùng với dynamic route segments + generateStaticParams!     │
  │                                                              │
  │  generateStaticParams() → return [{ slug: 'hello' },         │
  │                                   { slug: 'world' }]         │
  │                                                              │
  │  User truy cập /blog/random-slug (CHƯA generate!):           │
  │                                                              │
  │  ┌──────────────────────┬───────────────────────────────┐    │
  │  │ dynamicParams = true  │ dynamicParams = false         │    │
  │  │ (MẶC ĐỊNH!)          │                               │    │
  │  ├──────────────────────┼───────────────────────────────┤    │
  │  │ → Render ON-DEMAND!  │ → Return 404! ❌              │    │
  │  │ → Streaming SSR! ★   │ → CHỈ chấp nhận params       │    │
  │  │ → Cache cho lần sau! │   đã generate! ★              │    │
  │  └──────────────────────┴───────────────────────────────┘    │
  │                                                              │
  │  ★ "Good to know" từ docs:                                    │
  │  → Thay thế fallback: true|false|blocking (getStaticPaths!)  │
  │  → Muốn static render TẤT CẢ paths lần đầu visit?           │
  │    → return [] trong generateStaticParams + force-static!    │
  │  → dynamicParams=true → dùng Streaming Server Rendering!    │
  │                                                              │
  │  MIGRATION:                                                    │
  │  ┌──────────────────────┬───────────────────────────────┐    │
  │  │ Pages Dir (cũ)       │ App Dir (mới!) ★              │    │
  │  ├──────────────────────┼───────────────────────────────┤    │
  │  │ fallback: true        │ dynamicParams = true ★        │    │
  │  │ fallback: false       │ dynamicParams = false ★       │    │
  │  │ fallback: 'blocking'  │ dynamicParams = true ★        │    │
  │  └──────────────────────┴───────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. revalidate — ISR (Incremental Static Regeneration)!

```
  revalidate — 3 GIÁ TRỊ:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  export const revalidate = false // false | 0 | number        │
  │                                                              │
  │  ① false (MẶC ĐỊNH!):                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Cache VĨNH VIỄN! (= revalidate: Infinity!) ★      │    │
  │  │ → fetch có cache: 'force-cache' → được cache!        │    │
  │  │ → NHƯNG fetch riêng lẻ VẪN có thể opt-out! ★         │    │
  │  │   → cache: 'no-store' → dynamic!                     │    │
  │  │   → revalidate: 0 → dynamic!                          │    │
  │  │   → revalidate: 30 → ISR 30s!                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② 0:                                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → LUÔN DYNAMIC! Mỗi request render lại! ★            │    │
  │  │ → fetch KHÔNG set cache → mặc định 'no-store'! ★     │    │
  │  │ → NHƯNG fetch có 'force-cache' VẪN được cache! ★     │    │
  │  │ → fetch có revalidate > 0 → VẪN ISR! ★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ number (VD: 60):                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → ISR: Revalidate sau N giây! ★                       │    │
  │  │ → Request đầu → serve cached version!                 │    │
  │  │ → Sau N giây → request kế → revalidate background!   │    │
  │  │                                                       │    │
  │  │ TIMELINE (revalidate = 60):                            │    │
  │  │ ─── 0s ──── 30s ──── 60s ──── 61s ───                │    │
  │  │  ↑cache     ↑cache   ↑stale   ↑revalidate            │    │
  │  │  ↑serve!    ↑serve!  ↑serve!  ↑serve stale            │    │
  │  │                               ↑+ rebuild background!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ★ "Good to know" từ docs:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Giá trị phải STATICALLY ANALYZABLE! ★               │    │
  │  │   revalidate = 600 ✅ (OK!)                            │    │
  │  │   revalidate = 60 * 10 ❌ (KHÔNG được tính toán!)     │    │
  │  │ → KHÔNG hoạt động với runtime = 'edge'! ★             │    │
  │  │ → Dev mode: LUÔN render mỗi request! (không cache!)  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  REVALIDATION FREQUENCY RULE: ★★★
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Route: /dashboard/settings                                    │
  │                                                              │
  │  app/dashboard/layout.tsx:                                      │
  │    export const revalidate = 60       ← 60 giây!              │
  │                                                              │
  │  app/dashboard/settings/page.tsx:                               │
  │    export const revalidate = 30       ← 30 giây!              │
  │                                                              │
  │  → Route dùng giá trị THẤP NHẤT! ★★★                        │
  │  → 30 < 60 → route revalidate mỗi 30 giây! ★                │
  │                                                              │
  │  NGUYÊN TẮC:                                                    │
  │  → Mỗi layout + page được tính!                                │
  │  → Giá trị THẤP NHẤT → tần suất cho TOÀN route! ★           │
  │  → Child page quyết định nếu thấp hơn parent!               │
  │  → fetch riêng lẻ có thể set thấp hơn route default! ★      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. fetchCache — Kiểm Soát Cache Toàn Bộ Fetch!

```
  fetchCache — 7 GIÁ TRỊ:
  ┌──────────────────┬──────────────────────────────────────────┐
  │ Giá trị         │ Hành vi                                  │
  ├──────────────────┼──────────────────────────────────────────┤
  │ 'auto'            │ MẶC ĐỊNH! Next.js tự quyết! ★           │
  │                  │ Trước Dynamic API → cache!               │
  │                  │ Sau Dynamic API → KHÔNG cache!           │
  ├──────────────────┼──────────────────────────────────────────┤
  │ 'default-cache'   │ Không set cache → mặc định force-cache! │
  │                  │ fetch SAU Dynamic API cũng STATIC! ★    │
  ├──────────────────┼──────────────────────────────────────────┤
  │ 'only-cache'      │ Mặc định force-cache!                   │
  │                  │ fetch dùng no-store → THROW ERROR! ❌   │
  ├──────────────────┼──────────────────────────────────────────┤
  │ 'force-cache'     │ MỌI fetch → force-cache! ★★★           │
  │                  │ Ghi đè CẢ fetch riêng lẻ!               │
  ├──────────────────┼──────────────────────────────────────────┤
  │ 'default-no-store'│ Không set → mặc định no-store! ★        │
  │                  │ fetch TRƯỚC Dynamic API cũng DYNAMIC!   │
  ├──────────────────┼──────────────────────────────────────────┤
  │ 'only-no-store'   │ Mặc định no-store!                      │
  │                  │ fetch dùng force-cache → ERROR! ❌      │
  ├──────────────────┼──────────────────────────────────────────┤
  │ 'force-no-store'  │ MỌI fetch → no-store! ★★★              │
  │                  │ Ghi đè CẢ fetch có force-cache!         │
  └──────────────────┴──────────────────────────────────────────┘

  MỨC ĐỘ FORCE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  default-* : chỉ set KHI fetch KHÔNG có option!              │
  │              → fetch riêng lẻ VẪN ghi đè được! ★             │
  │                                                              │
  │  only-*   : set mặc định + THROW ERROR nếu ngược lại!       │
  │              → Strict! Không cho phép option khác! ★         │
  │                                                              │
  │  force-*  : GHI ĐÈ TẤT CẢ! ★★★                              │
  │              → Kể cả fetch có option ngược! ★                 │
  │              → Mạnh nhất!                                     │
  │                                                              │
  │  default-* < only-* < force-* (mức độ mạnh!) ★               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  CROSS-ROUTE SEGMENT RULES: ★★★
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❌ KHÔNG được kết hợp trong cùng route:                       │
  │  → 'only-cache' + 'only-no-store' ❌                          │
  │  → 'force-cache' + 'force-no-store' ❌                        │
  │                                                              │
  │  ★ force-* THẮNG only-*:                                       │
  │  → only-cache + force-cache → force-cache THẮNG! ★           │
  │  → only-no-store + force-no-store → force-no-store THẮNG! ★ │
  │                                                              │
  │  ★ Parent-child rules:                                         │
  │  → Parent 'default-no-store' + child 'auto' → ❌ conflict!  │
  │  → Parent 'default-no-store' + child '*-cache' → ❌!         │
  │  → Parent nên dùng 'auto' → child tự customize! ★           │
  │                                                              │
  │  MỤC ĐÍCH:                                                      │
  │  → 'only-*' + 'force-*' = ĐẢM BẢO route 100% static        │
  │    HOẶC 100% dynamic! Không pha trộn! ★                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. runtime, preferredRegion, maxDuration!

```
  runtime:
  ┌──────────────────┬──────────────────────────────────┐
  │ Giá trị         │ Mô tả                           │
  ├──────────────────┼──────────────────────────────────┤
  │ 'nodejs'          │ MẶC ĐỊNH! Full Node.js APIs! ★  │
  │ (mặc định!)      │ fs, crypto, Buffer, streams...  │
  ├──────────────────┼──────────────────────────────────┤
  │ 'edge'            │ Edge Runtime (V8 Isolates!) ★   │
  │                  │ Cold start NHANH! Latency THẤP! │
  │                  │ API bị giới hạn! ★               │
  │                  │ KHÔNG hỗ trợ Cache Components!  │
  └──────────────────┴──────────────────────────────────┘
  → Docs khuyến nghị dùng 'nodejs'! ★
  → 'edge' không dùng được trong Proxy! ★

  preferredRegion:
  ┌──────────────────────────────────────────────────────────────┐
  │  export const preferredRegion = 'auto'                        │
  │  export const preferredRegion = 'global'                      │
  │  export const preferredRegion = 'home'                        │
  │  export const preferredRegion = ['iad1', 'sfo1']              │
  │                                                              │
  │  → Phụ thuộc deployment platform!                             │
  │  → Không set → kế thừa từ parent layout gần nhất!           │
  │  → Root layout mặc định = 'all' regions!                     │
  └──────────────────────────────────────────────────────────────┘

  maxDuration:
  ┌──────────────────────────────────────────────────────────────┐
  │  export const maxDuration = 5 // giây!                        │
  │                                                              │
  │  → Giới hạn thời gian chạy server-side logic!                │
  │  → Mặc định: Next.js KHÔNG giới hạn!                         │
  │  → Platform (Vercel) dùng giá trị này set timeout!           │
  │  → Yêu cầu Next.js >= 13.4.10!                               │
  │  → Server Actions trên page: set ở PAGE level!              │
  │    → Thay đổi timeout cho TẤT CẢ Server Actions trên page! │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. generateStaticParams!

```
  generateStaticParams:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT: Kết hợp với dynamic route segments để DEFINE          │
  │  danh sách params được pre-render tại BUILD TIME! ★          │
  │                                                              │
  │  // app/blog/[slug]/page.tsx                                    │
  │  export async function generateStaticParams() {               │
  │    var posts = await fetch('https://api.example.com/posts')   │
  │    var data = await posts.json()                               │
  │    return data.map(function(post) {                           │
  │      return { slug: post.slug }                               │
  │    })                                                         │
  │  }                                                            │
  │                                                              │
  │  BUILD FLOW:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ generateStaticParams()                                │    │
  │  │ → return [{ slug: 'hello' }, { slug: 'world' }]       │    │
  │  │                                                       │    │
  │  │ Next.js BUILD:                                         │    │
  │  │ → /blog/hello → static HTML! ✅                        │    │
  │  │ → /blog/world → static HTML! ✅                        │    │
  │  │                                                       │    │
  │  │ REQUEST /blog/random:                                   │    │
  │  │   dynamicParams=true → on-demand render! ★             │    │
  │  │   dynamicParams=false → 404! ❌                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ KHÔNG dùng trong 'use client' file!                      │
  │  → Xem API reference để biết thêm chi tiết!                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Tự Viết — RouteSegmentConfigEngine!

```javascript
var RouteSegmentConfigEngine = (function () {
  // ═══════════════════════════════════
  // 1. DYNAMIC MODE RESOLVER
  // ═══════════════════════════════════
  function resolveDynamic(mode, hasDynamicAPI) {
    var modes = {
      auto: function () {
        return hasDynamicAPI
          ? { rendering: "dynamic", reason: "Dynamic API detected!" }
          : { rendering: "static", reason: "No Dynamic API → cache!" };
      },
      "force-dynamic": function () {
        return {
          rendering: "dynamic",
          fetchDefault: "no-store",
          equivalent: "getServerSideProps",
          fetchCache: "force-no-store",
        };
      },
      error: function () {
        if (hasDynamicAPI) {
          return {
            rendering: "ERROR!",
            reason: "Dynamic API used with mode=error! THROW!",
          };
        }
        return {
          rendering: "static",
          fetchDefault: "force-cache",
          equivalent: "getStaticProps",
          fetchCache: "only-cache",
        };
      },
      "force-static": function () {
        return {
          rendering: "static",
          cookiesValue: "empty!",
          headersValue: "empty!",
          searchParamsValue: "empty!",
          canRevalidate: true,
        };
      },
    };
    var resolver = modes[mode];
    if (!resolver) return { error: "Unknown mode: " + mode };
    return resolver();
  }

  // ═══════════════════════════════════
  // 2. REVALIDATE FREQUENCY CALCULATOR
  // ═══════════════════════════════════
  function calcRevalidateFrequency(segments) {
    // segments = [{ name, revalidate }, ...]
    // Rule: LOWEST value wins!
    var lowest = Infinity;
    var winner = null;
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      var val = seg.revalidate;
      if (val === false) val = Infinity;
      if (val === 0) {
        return { frequency: 0, winner: seg.name, mode: "always-dynamic!" };
      }
      if (typeof val === "number" && val < lowest) {
        lowest = val;
        winner = seg.name;
      }
    }
    if (lowest === Infinity) {
      return {
        frequency: "Infinity",
        winner: "default",
        mode: "cache-forever!",
      };
    }
    return { frequency: lowest + "s", winner: winner, mode: "ISR!" };
  }

  // ═══════════════════════════════════
  // 3. FETCH CACHE CONFLICT CHECKER
  // ═══════════════════════════════════
  function checkFetchCacheConflict(parentFetchCache, childFetchCache) {
    var conflicts = [
      ["only-cache", "only-no-store"],
      ["force-cache", "force-no-store"],
    ];
    for (var i = 0; i < conflicts.length; i++) {
      var a = conflicts[i][0],
        b = conflicts[i][1];
      if (
        (parentFetchCache === a && childFetchCache === b) ||
        (parentFetchCache === b && childFetchCache === a)
      ) {
        return { conflict: true, reason: a + " + " + b + " → ❌ NOT ALLOWED!" };
      }
    }
    // force-* wins over only-*
    if (
      parentFetchCache.startsWith("force-") ||
      childFetchCache.startsWith("force-")
    ) {
      var forceVal = parentFetchCache.startsWith("force-")
        ? parentFetchCache
        : childFetchCache;
      return { conflict: false, winner: forceVal, reason: "force-* WINS!" };
    }
    return {
      conflict: false,
      winner: childFetchCache,
      reason: "Child takes priority!",
    };
  }

  // ═══════════════════════════════════
  // 4. VALIDATE REVALIDATE VALUE
  // ═══════════════════════════════════
  function validateRevalidate(value, runtime) {
    if (runtime === "edge") {
      return {
        valid: false,
        reason: "revalidate KHÔNG hoạt động với edge runtime!",
      };
    }
    if (value === false || value === 0) return { valid: true };
    if (typeof value !== "number" || value < 0) {
      return { valid: false, reason: "Phải là false | 0 | number >= 0!" };
    }
    return { valid: true, note: "ISR mỗi " + value + " giây!" };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Route Segment Config Engine ═══");

    console.log("\n── dynamic modes ──");
    console.log("auto + no API:", resolveDynamic("auto", false));
    console.log("auto + has API:", resolveDynamic("auto", true));
    console.log("force-dynamic:", resolveDynamic("force-dynamic", false));
    console.log("error + no API:", resolveDynamic("error", false));
    console.log("error + has API:", resolveDynamic("error", true));
    console.log("force-static:", resolveDynamic("force-static", true));

    console.log("\n── revalidate frequency ──");
    console.log(
      "Layout=60 + Page=30:",
      calcRevalidateFrequency([
        { name: "layout", revalidate: 60 },
        { name: "page", revalidate: 30 },
      ]),
    );
    console.log(
      "Layout=false + Page=120:",
      calcRevalidateFrequency([
        { name: "layout", revalidate: false },
        { name: "page", revalidate: 120 },
      ]),
    );
    console.log(
      "Layout=60 + Page=0:",
      calcRevalidateFrequency([
        { name: "layout", revalidate: 60 },
        { name: "page", revalidate: 0 },
      ]),
    );

    console.log("\n── fetchCache conflicts ──");
    console.log(
      "only-cache + only-no-store:",
      checkFetchCacheConflict("only-cache", "only-no-store"),
    );
    console.log(
      "force-cache + only-cache:",
      checkFetchCacheConflict("force-cache", "only-cache"),
    );
    console.log(
      "auto + default-cache:",
      checkFetchCacheConflict("auto", "default-cache"),
    );

    console.log("\n── validate revalidate ──");
    console.log("600 + nodejs:", validateRevalidate(600, "nodejs"));
    console.log("60 + edge:", validateRevalidate(60, "edge"));
  }

  return { demo: demo };
})();
// Chạy: RouteSegmentConfigEngine.demo();
```

---

## §9. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: dynamic='force-dynamic' vs revalidate=0?                │
  │  → force-dynamic: ÉP MỌI fetch → no-store! ★                │
  │  → revalidate=0: fetch KHÔNG set cache → no-store!           │
  │    NHƯNG fetch có force-cache VẪN giữ cache! ★               │
  │  → force-dynamic MẠNH hơn! Ghi đè tất cả! ★★★              │
  │                                                              │
  │  ❓ 2: dynamic='error' vs dynamic='force-static'?              │
  │  → 'error': ép static, dùng Dynamic API → THROW ERROR! ❌   │
  │  → 'force-static': ép static, Dynamic API trả EMPTY! ★      │
  │    cookies()→empty, headers()→empty, searchParams→empty!     │
  │  → 'force-static' mềm hơn, không crash! ★                   │
  │                                                              │
  │  ❓ 3: revalidate frequency ai quyết định?                     │
  │  → Giá trị THẤP NHẤT giữa layout + page! ★★★                │
  │  → Layout=60, Page=30 → route dùng 30! ★                    │
  │  → fetch riêng lẻ cũng có thể set thấp hơn! ★               │
  │                                                              │
  │  ❓ 4: fetchCache 'force-cache' vs 'only-cache'?               │
  │  → force-cache: GHI ĐÈ mọi fetch! Kể cả no-store! ★        │
  │  → only-cache: mặc định cache, fetch dùng no-store           │
  │    → THROW ERROR! (strict mode!) ★                            │
  │  → force ghi đè im lặng, only throw error to cảnh báo! ★   │
  │                                                              │
  │  ❓ 5: revalidate = 60 * 10 có hoạt động không?                │
  │  → KHÔNG! ❌ Giá trị phải STATICALLY ANALYZABLE! ★           │
  │  → revalidate = 600 ✅ (literal number!)                      │
  │  → Next.js parse SOURCE CODE, không execute expression! ★   │
  │                                                              │
  │  ❓ 6: runtime='edge' có gì khác?                               │
  │  → V8 Isolates! Cold start nhanh! Latency thấp! ★           │
  │  → NHƯNG: API giới hạn, KHÔNG hỗ trợ revalidate! ★          │
  │  → KHÔNG dùng được Cache Components! ★                       │
  │  → Docs khuyến nghị dùng 'nodejs'! ★                         │
  │                                                              │
  │  ❓ 7: Version History quan trọng gì?                           │
  │  → v16.0: experimental_ppr bị remove (có codemod!)           │
  │  → v15.0-RC: 'experimental-edge' đổi thành 'edge'!          │
  │  → Luôn check version khi nâng cấp! ★                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
