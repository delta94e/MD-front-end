# useSearchParams() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/use-search-params
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/navigation`
> **Since**: v13.0.0!

---

## §1. useSearchParams() Là Gì?

```
  useSearchParams() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Client Component hook! ★                                  │
  │  → Đọc QUERY STRING hiện tại! ★                             │
  │  → READ-ONLY URLSearchParams! ★★★                           │
  │  → import { useSearchParams } from 'next/navigation'! ★     │
  │                                                              │
  │  VÍ DỤ NHANH:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  URL: /dashboard?search=my-project                     │    │
  │  │                                                       │    │
  │  │  const searchParams = useSearchParams()               │    │
  │  │  searchParams.get('search') → 'my-project'! ★        │    │
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
  │  const searchParams = useSearchParams()                      │
  │                                                              │
  │  PARAMETERS: KHÔNG CÓ! ★                                    │
  │                                                              │
  │  RETURNS: ReadonlyURLSearchParams! ★                        │
  │  → Read-only version của URLSearchParams! ★                 │
  │  → KHÔNG thể set/append/delete! ★★★                        │
  │                                                              │
  │  AVAILABLE METHODS (read-only):                               │
  │  ┌───────────────┬──────────────────────────────────────┐    │
  │  │ Method         │ Mô tả                                │    │
  │  ├───────────────┼──────────────────────────────────────┤    │
  │  │ .get(key)      │ First value! null nếu ko có! ★       │    │
  │  │ .getAll(key)   │ ALL values (array)! ★                 │    │
  │  │ .has(key)      │ Boolean! ★                            │    │
  │  │ .keys()        │ Iterator all keys! ★                  │    │
  │  │ .values()      │ Iterator all values! ★                │    │
  │  │ .entries()     │ Iterator [key, value]! ★              │    │
  │  │ .forEach()     │ Loop qua tất cả! ★                   │    │
  │  │ .toString()    │ String representation! ★              │    │
  │  └───────────────┴──────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  .get() EXAMPLES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────┬─────────────────────┐              │
  │  │ URL                   │ get("a")              │              │
  │  ├──────────────────────┼─────────────────────┤              │
  │  │ /dashboard?a=1        │ '1'                  │              │
  │  │ /dashboard?a=         │ '' (empty string!)    │              │
  │  │ /dashboard?b=3        │ null (ko có key a!)  │              │
  │  │ /dashboard?a=1&a=2    │ '1' (FIRST only!)    │              │
  │  │                       │ → dùng getAll! ★     │              │
  │  └──────────────────────┴─────────────────────┘              │
  │                                                              │
  │  .has() EXAMPLES:                                             │
  │  ┌──────────────────────┬─────────────────────┐              │
  │  │ URL                   │ has("a")              │              │
  │  ├──────────────────────┼─────────────────────┤              │
  │  │ /dashboard?a=1        │ true! ★               │              │
  │  │ /dashboard?b=3        │ false! ★              │              │
  │  └──────────────────────┴─────────────────────┘              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Behavior — Static vs Dynamic Rendering!

```
  STATIC vs DYNAMIC:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  STATIC RENDERING:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ⚠️ useSearchParams → component tree =                │    │
  │  │     CLIENT-SIDE RENDERED! ★★★                         │    │
  │  │  → Đến Suspense boundary GẦN NHẤT! ★                 │    │
  │  │  → Phần còn lại VẪN static! ★                        │    │
  │  │                                                       │    │
  │  │  GIẢI PHÁP:                                            │    │
  │  │  → BỌC Suspense! ★★★                                  │    │
  │  │  → Phần trên Suspense → static! ★                    │    │
  │  │  → Phần trong Suspense → CSR! ★                      │    │
  │  │                                                       │    │
  │  │  ⚠️ PRODUCTION BUILD:                                  │    │
  │  │  → KHÔNG có Suspense → BUILD FAIL! ★★★                │    │
  │  │  → Error: "Missing Suspense boundary                   │    │
  │  │     with useSearchParams"! ★★★                        │    │
  │  │  → Dev mode → không thấy lỗi! ★                      │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DYNAMIC RENDERING:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  → useSearchParams available on SERVER! ★              │    │
  │  │  → Initial server render → log on server! ★           │    │
  │  │  → Subsequent navigations → log on client! ★          │    │
  │  │  → Dùng connection() để force dynamic! ★              │    │
  │  │  → KHÔNG cần Suspense! ★                              │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SERVER COMPONENTS:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Pages → dùng searchParams prop! ★                    │    │
  │  │  Layouts → KHÔNG có searchParams prop! ★★★            │    │
  │  │  → Vì layout KHÔNG re-render khi navigate! ★         │    │
  │  │  → searchParams sẽ STALE! ★★★                        │    │
  │  │  → Dùng useSearchParams trong CC thay thế! ★         │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Example — Updating searchParams!

```
  UPDATING searchParams:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 'use client'                                          │    │
  │  │                                                       │    │
  │  │ export default function SortControls() {               │    │
  │  │   const router = useRouter()                          │    │
  │  │   const pathname = usePathname()                      │    │
  │  │   const searchParams = useSearchParams()              │    │
  │  │                                                       │    │
  │  │   // Merge searchParams với key/value mới! ★          │    │
  │  │   const createQueryString = useCallback(               │    │
  │  │     (name, value) => {                                 │    │
  │  │       const params = new URLSearchParams(              │    │
  │  │         searchParams.toString()                       │    │
  │  │       )                                                │    │
  │  │       params.set(name, value) ← SET trên copy! ★     │    │
  │  │       return params.toString()                        │    │
  │  │     },                                                 │    │
  │  │     [searchParams]                                     │    │
  │  │   )                                                    │    │
  │  │                                                       │    │
  │  │   // Cách 1: useRouter                                 │    │
  │  │   <button onClick={() => {                             │    │
  │  │     router.push(                                       │    │
  │  │       pathname + '?' +                                 │    │
  │  │       createQueryString('sort', 'asc')                │    │
  │  │     )  // → /page?sort=asc                            │    │
  │  │   }}>ASC</button>                                      │    │
  │  │                                                       │    │
  │  │   // Cách 2: <Link>                                    │    │
  │  │   <Link href={                                         │    │
  │  │     pathname + '?' +                                   │    │
  │  │     createQueryString('sort', 'desc')                  │    │
  │  │   }>DESC</Link>                                        │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PATTERN:                                                     │
  │  1. Đọc current → searchParams.toString()! ★                │
  │  2. Copy sang new URLSearchParams()! ★                      │
  │  3. .set(key, value) trên copy! ★                           │
  │  4. router.push hoặc <Link> với string mới! ★              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — UseSearchParamsEngine!

```javascript
var UseSearchParamsEngine = (function () {
  // ═══════════════════════════════════
  // 1. URLSearchParams SIMULATOR (READ-ONLY)
  // ═══════════════════════════════════
  function ReadonlyURLSearchParams(queryString) {
    // Parse query string
    var params = {};
    var qs = queryString.replace("?", "");
    if (!qs) return { _params: params, _readonly: true };

    var pairs = qs.split("&");
    for (var i = 0; i < pairs.length; i++) {
      var kv = pairs[i].split("=");
      var key = decodeURIComponent(kv[0]);
      var val = kv.length > 1 ? decodeURIComponent(kv[1]) : "";
      if (!params[key]) params[key] = [];
      params[key].push(val);
    }
    return { _params: params, _readonly: true };
  }

  function get(sp, key) {
    if (!sp._params[key]) return null;
    return sp._params[key][0];
  }

  function getAll(sp, key) {
    return sp._params[key] || [];
  }

  function has(sp, key) {
    return !!sp._params[key];
  }

  function keys(sp) {
    return Object.keys(sp._params);
  }

  function toString(sp) {
    var parts = [];
    for (var key in sp._params) {
      for (var i = 0; i < sp._params[key].length; i++) {
        parts.push(
          encodeURIComponent(key) +
            "=" +
            encodeURIComponent(sp._params[key][i]),
        );
      }
    }
    return parts.join("&");
  }

  // ═══════════════════════════════════
  // 2. SUSPENSE VALIDATOR
  // ═══════════════════════════════════
  function validateUsage(context) {
    var rules = {
      "static-with-suspense": {
        valid: true,
        rendering: "CSR inside Suspense! Static outside! ★",
      },
      "static-without-suspense": {
        valid: false,
        error: "BUILD FAIL! Missing Suspense boundary! ★★★",
        fix: "Bọc component dùng useSearchParams trong <Suspense>! ★",
      },
      dynamic: {
        valid: true,
        rendering: "Available on server! Không cần Suspense! ★",
      },
      "server-component": {
        valid: false,
        error: "Client Component hook! Không dùng trong SC! ★★★",
        fix: "Dùng searchParams prop cho Pages (SC)! ★",
      },
      "layout-server": {
        valid: false,
        error: "Layout KHÔNG có searchParams prop! ★★★",
        reason: "Layout không re-render → searchParams stale! ★",
        fix: "Dùng useSearchParams trong Client Component! ★",
      },
    };
    return rules[context] || { error: "Unknown context!" };
  }

  // ═══════════════════════════════════
  // 3. UPDATE searchParams PATTERN
  // ═══════════════════════════════════
  function createQueryString(currentSearchParams, name, value) {
    // Clone current → set new → return string
    var copy = ReadonlyURLSearchParams(toString(currentSearchParams));
    // Mutate copy (simulated writable version)
    if (!copy._params[name]) copy._params[name] = [];
    copy._params[name] = [value];
    return toString(copy);
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ UseSearchParams Engine ═══");

    console.log("\n── 1. Parse ──");
    var sp = ReadonlyURLSearchParams("?search=hello&page=2&tag=a&tag=b");
    console.log("get('search'):", get(sp, "search"));
    console.log("get('missing'):", get(sp, "missing"));
    console.log("getAll('tag'):", getAll(sp, "tag"));
    console.log("has('page'):", has(sp, "page"));
    console.log("keys:", keys(sp));
    console.log("toString:", toString(sp));

    console.log("\n── 2. Validate ──");
    console.log("Static+Suspense:", validateUsage("static-with-suspense"));
    console.log(
      "Static-no-Suspense:",
      validateUsage("static-without-suspense"),
    );
    console.log("Dynamic:", validateUsage("dynamic"));
    console.log("Server Component:", validateUsage("server-component"));

    console.log("\n── 3. Update ──");
    var updated = createQueryString(sp, "sort", "asc");
    console.log("Added sort=asc:", updated);
  }

  return { demo: demo };
})();
// Chạy: UseSearchParamsEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: useSearchParams trả ReadonlyURLSearchParams?            │
  │  → READ-ONLY! Không thể set/append/delete! ★★★             │
  │  → Muốn update → new URLSearchParams(sp.toString())! ★     │
  │  → .set() trên copy → router.push! ★                       │
  │                                                              │
  │  ❓ 2: Static Rendering → Suspense BẮT BUỘC?                  │
  │  → ĐÚNG! Không Suspense → BUILD FAIL! ★★★                 │
  │  → useSearchParams gây CSR tree đến Suspense gần nhất! ★  │
  │  → Dev mode không thấy → production mới fail! ★            │
  │                                                              │
  │  ❓ 3: Layout không có searchParams prop?                      │
  │  → ĐÚNG! Layout KHÔNG re-render khi navigate! ★★★         │
  │  → searchParams sẽ STALE! ★                                │
  │  → Dùng useSearchParams trong Client Component! ★          │
  │  → Hoặc dùng searchParams prop ở Page! ★                   │
  │                                                              │
  │  ❓ 4: get() khi có duplicate keys?                            │
  │  → ?a=1&a=2 → get('a') = '1' (FIRST only)! ★              │
  │  → Muốn ALL → dùng getAll('a') → ['1','2']! ★             │
  │                                                              │
  │  ❓ 5: Dynamic Rendering → khác gì?                            │
  │  → useSearchParams available ON SERVER! ★                   │
  │  → KHÔNG cần Suspense! ★                                   │
  │  → Dùng connection() để force dynamic! ★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
