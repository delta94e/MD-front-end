# useParams() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/use-params
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/navigation`
> **Since**: Next.js v13.3.0!

---

## §1. useParams() Là Gì?

```
  useParams() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Client Component hook! ★                                  │
  │  → Đọc DYNAMIC PARAMS của route hiện tại! ★                 │
  │  → import { useParams } from 'next/navigation'! ★           │
  │  → Params được fill bởi URL! ★                              │
  │                                                              │
  │  VÍ DỤ NHANH:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Route:  /shop/[tag]/[item]                            │    │
  │  │  URL:    /shop/shoes/nike-air-max-97                   │    │
  │  │                                                       │    │
  │  │  const params = useParams()                            │    │
  │  │  // params = { tag: 'shoes', item: 'nike-air-max-97' }│    │
  │  │                                                       │    │
  │  │  ┌────────────┬──────────────────┐                    │    │
  │  │  │ Dynamic     │ Filled value      │                    │    │
  │  │  ├────────────┼──────────────────┤                    │    │
  │  │  │ [tag]       │ 'shoes'           │                    │    │
  │  │  │ [item]      │ 'nike-air-max-97' │                    │    │
  │  │  └────────────┴──────────────────┘                    │    │
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
  │  const params = useParams()                                  │
  │  // HOẶC với TypeScript generics:                            │
  │  const params = useParams<{ tag: string; item: string }>()  │
  │                                                              │
  │  PARAMETERS: KHÔNG CÓ! ★                                    │
  │                                                              │
  │  RETURNS: object chứa dynamic parameters!                    │
  │  → Property name = segment name! ★                          │
  │  → Property value = string HOẶC string[]! ★                │
  │  → Không có dynamic params → {} (empty object)! ★          │
  │  → Pages Router + chưa ready → null! ★                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Return Values — Bảng Chi Tiết!

```
  BẢNG RETURN VALUES THEO ROUTE TYPE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────┬──────────┬──────────────────┐  │
  │  │ Route                     │ URL      │ useParams()       │  │
  │  ├──────────────────────────┼──────────┼──────────────────┤  │
  │  │ app/shop/page.js          │ /shop    │ {}                │  │
  │  │ (no dynamic segments!)    │          │ ← empty! ★       │  │
  │  ├──────────────────────────┼──────────┼──────────────────┤  │
  │  │ app/shop/[slug]/page.js   │ /shop/1  │ { slug: '1' }    │  │
  │  │ (single segment!)         │          │ ← string! ★      │  │
  │  ├──────────────────────────┼──────────┼──────────────────┤  │
  │  │ app/shop/[tag]/[item]/    │ /shop/   │ { tag: '1',      │  │
  │  │ page.js                   │ 1/2      │   item: '2' }    │  │
  │  │ (multiple segments!)      │          │ ← 2 strings! ★   │  │
  │  ├──────────────────────────┼──────────┼──────────────────┤  │
  │  │ app/shop/[...slug]/       │ /shop/   │ { slug:           │  │
  │  │ page.js                   │ 1/2      │   ['1', '2'] }   │  │
  │  │ (catch-all!)              │          │ ← ARRAY! ★★★     │  │
  │  └──────────────────────────┴──────────┴──────────────────┘  │
  │                                                              │
  │  KEY TAKEAWAYS:                                               │
  │  → [slug] = string! ★                                       │
  │  → [...slug] = string[]! (catch-all!) ★★★                  │
  │  → [[...slug]] = string[] | undefined! (optional!) ★       │
  │  → Không dynamic → {} empty!                                 │
  │                                                              │
  │  DYNAMIC SEGMENT TYPES:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  [slug]      = 1 segment!    → string! ★              │    │
  │  │  [tag][item] = 2 segments!   → 2 strings! ★           │    │
  │  │  [...slug]   = catch-all!    → string[]! ★            │    │
  │  │  [[...slug]] = optional!     → string[] | undefined!★ │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — UseParamsEngine!

```javascript
var UseParamsEngine = (function () {
  // ═══════════════════════════════════
  // 1. ROUTE PARSER
  // ═══════════════════════════════════
  function parseRoute(routePattern) {
    // Extract dynamic segments from route pattern
    var segments = [];
    var regex = /\[{1,2}\.{0,3}(\w+)\]{1,2}/g;
    var match;
    while ((match = regex.exec(routePattern)) !== null) {
      var raw = match[0];
      var name = match[1];
      var type = "single";
      if (raw.indexOf("...") >= 0) type = "catch-all";
      if (raw.indexOf("[[") >= 0) type = "optional-catch-all";
      segments.push({ name: name, type: type, raw: raw });
    }
    return segments;
  }

  // ═══════════════════════════════════
  // 2. useParams SIMULATOR
  // ═══════════════════════════════════
  function useParams(routePattern, currentUrl) {
    var segments = parseRoute(routePattern);

    // Split route and URL into parts
    var routeParts = routePattern.split("/").filter(Boolean);
    var urlParts = currentUrl.split("/").filter(Boolean);

    // No dynamic segments
    if (segments.length === 0) {
      return { params: {}, note: "No dynamic params! Empty object! ★" };
    }

    var params = {};
    var dynamicStartIndex = -1;

    for (var i = 0; i < routeParts.length; i++) {
      var routePart = routeParts[i];
      var seg = segments.find(function (s) {
        return s.raw === routePart;
      });

      if (seg) {
        if (seg.type === "catch-all" || seg.type === "optional-catch-all") {
          // Grab ALL remaining URL parts
          params[seg.name] = urlParts.slice(i);
        } else {
          // Single segment
          params[seg.name] = urlParts[i] || undefined;
        }
      }
    }

    return {
      params: params,
      segments: segments,
      note: "Dynamic params extracted! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. TYPE CHECKER
  // ═══════════════════════════════════
  function checkReturnType(value) {
    if (value === undefined) return "undefined (optional catch-all, no match)";
    if (value === null) return "null (Pages Router, not ready)";
    if (Array.isArray(value)) return "string[] (catch-all!)";
    if (typeof value === "string") return "string (single segment!)";
    if (typeof value === "object") return "object (params map!)";
    return typeof value;
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ UseParams Engine ═══");

    console.log("\n── 1. Parse Routes ──");
    console.log(parseRoute("/shop/[tag]/[item]"));
    console.log(parseRoute("/shop/[...slug]"));
    console.log(parseRoute("/shop/[[...slug]]"));
    console.log(parseRoute("/shop"));

    console.log("\n── 2. useParams ──");
    console.log(
      "/shop/[slug] + /shop/1:",
      useParams("/shop/[slug]", "/shop/1"),
    );
    console.log(
      "/shop/[tag]/[item] + /shop/shoes/nike:",
      useParams("/shop/[tag]/[item]", "/shop/shoes/nike"),
    );
    console.log(
      "/shop/[...slug] + /shop/1/2/3:",
      useParams("/shop/[...slug]", "/shop/1/2/3"),
    );
    console.log("/shop (static) + /shop:", useParams("/shop", "/shop"));

    console.log("\n── 3. Return Types ──");
    console.log(checkReturnType("shoes"));
    console.log(checkReturnType(["1", "2"]));
    console.log(checkReturnType({}));
    console.log(checkReturnType(null));
    console.log(checkReturnType(undefined));
  }

  return { demo: demo };
})();
// Chạy: UseParamsEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: useParams trả string hay string[]?                      │
  │  → [slug]      → string! ★                                  │
  │  → [...slug]   → string[]! (catch-all!) ★★★                │
  │  → [[...slug]] → string[] | undefined! (optional!) ★       │
  │  → PHỤ THUỘC vào type of dynamic segment! ★                │
  │                                                              │
  │  ❓ 2: Route không có dynamic segment → trả gì?                │
  │  → {} empty object! ★                                       │
  │  → KHÔNG phải null! KHÔNG phải undefined! ★                │
  │                                                              │
  │  ❓ 3: useParams trong Pages Router?                            │
  │  → Initial render → null! ★                                 │
  │  → Router ready → object with params! ★                    │
  │  → App Router → luôn object! ★                              │
  │                                                              │
  │  ❓ 4: useParams vs Server Component params prop?              │
  │  → useParams: Client Component hook! ★                      │
  │  → params prop: Server Component (page, layout)! ★         │
  │  → Cùng data! Khác cách access! ★                          │
  │  → useParams dùng khi cần params trong CC sâu! ★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
