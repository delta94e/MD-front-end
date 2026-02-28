# unstable_rethrow() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/unstable_rethrow
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/navigation`

---

## §1. unstable_rethrow() Là Gì?

```
  unstable_rethrow() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Re-throw internal Next.js errors! ★                       │
  │  → Tránh catch block "nuốt" framework errors! ★★★          │
  │  → import { unstable_rethrow } from 'next/navigation'       │
  │                                                              │
  │  VẤN ĐỀ:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  try {                                                │    │
  │  │    notFound()    ← throw NEXT error! ★                │    │
  │  │  } catch (err) {                                      │    │
  │  │    console.log(err)  ← BẮT MẤT! not-found.js         │    │
  │  │                         KHÔNG render! ★★★             │    │
  │  │  }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  try {                                                │    │
  │  │    notFound()                                         │    │
  │  │  } catch (err) {                                      │    │
  │  │    unstable_rethrow(err)  ← RE-THROW nếu internal! ★ │    │
  │  │    console.log(err)       ← Chỉ log app errors! ★    │    │
  │  │  }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  APIs throw internal errors (PHẢI rethrow!):                  │
  │  → notFound()! ★                                             │
  │  → redirect()! ★                                             │
  │  → permanentRedirect()! ★                                    │
  │                                                              │
  │  Dynamic APIs (cũng throw nếu route force static!):          │
  │  → cookies()! ★                                              │
  │  → headers()! ★                                              │
  │  → searchParams! ★                                           │
  │  → fetch(..., { cache: 'no-store' })! ★                     │
  │  → fetch(..., { next: { revalidate: 0 } })! ★              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Usage Rules + Best Practices!

```
  RULES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Gọi ở ĐẦU catch block! ★★★                               │
  │  ② Pass error object as only argument! ★                    │
  │  ③ Cũng dùng được trong .catch() handler! ★                 │
  │  ④ Resource cleanup → trước rethrow hoặc finally! ★         │
  │                                                              │
  │  BEST PRACTICES:                                              │
  │  → Tách API calls ra function riêng! ★                      │
  │  → Caller handle exceptions! ★                              │
  │  → CHỈ dùng khi caught exceptions MIX:                      │
  │    app errors + framework errors! ★                         │
  │  → Nếu tách riêng được → KHÔNG cần rethrow! ★              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  VÍ DỤ:
  ┌──────────────────────────────────────────────────────────────┐
  │  import { notFound, unstable_rethrow } from 'next/navigation'│
  │                                                              │
  │  export default async function Page() {                       │
  │    try {                                                     │
  │      const post = await fetch('https://.../posts/1')         │
  │        .then((res) => {                                      │
  │          if (res.status === 404) notFound()                  │
  │          if (!res.ok) throw new Error(res.statusText)        │
  │          return res.json()                                   │
  │        })                                                    │
  │    } catch (err) {                                           │
  │      unstable_rethrow(err)  ← ĐẦU catch! ★★★               │
  │      console.error(err)     ← Chỉ app errors reach here! ★ │
  │    }                                                         │
  │  }                                                           │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — RethrowEngine!

```javascript
var RethrowEngine = (function () {
  // Internal error types Next.js uses
  var INTERNAL_ERRORS = [
    "NEXT_REDIRECT",
    "NEXT_NOT_FOUND",
    "NEXT_HTTP_ERROR_FALLBACK;404",
    "NEXT_HTTP_ERROR_FALLBACK;401",
    "NEXT_HTTP_ERROR_FALLBACK;403",
    "DYNAMIC_SERVER_USAGE",
  ];

  function isInternalError(err) {
    if (!err) return false;
    var msg = err.message || err.digest || String(err);
    return INTERNAL_ERRORS.some(function (ie) {
      return msg.indexOf(ie) >= 0;
    });
  }

  function unstable_rethrow(err) {
    if (isInternalError(err)) {
      return {
        action: "RETHROW",
        error: err,
        note: "Internal Next.js error → re-thrown! ★",
      };
    }
    return {
      action: "CONTINUE",
      error: err,
      note: "App error → handle normally! ★",
    };
  }

  function simulateTryCatch(scenario) {
    var results = [];
    try {
      if (scenario === "not-found") {
        throw { message: "NEXT_NOT_FOUND", type: "internal" };
      } else if (scenario === "redirect") {
        throw { message: "NEXT_REDIRECT", type: "internal" };
      } else {
        throw { message: "Network error", type: "app" };
      }
    } catch (err) {
      var rethrowResult = unstable_rethrow(err);
      results.push(rethrowResult);
      if (rethrowResult.action === "RETHROW") {
        results.push({ note: "Error re-thrown! Framework handles it! ★" });
      } else {
        results.push({ note: "App error logged! console.error(err)! ★" });
      }
    }
    return results;
  }

  function demo() {
    console.log("═══ Rethrow Engine ═══");

    console.log("\n── isInternal ──");
    console.log(isInternalError({ message: "NEXT_NOT_FOUND" }));
    console.log(isInternalError({ message: "Network error" }));

    console.log("\n── Simulate: not-found ──");
    console.log(simulateTryCatch("not-found"));

    console.log("\n── Simulate: redirect ──");
    console.log(simulateTryCatch("redirect"));

    console.log("\n── Simulate: app error ──");
    console.log(simulateTryCatch("app-error"));
  }

  return { demo: demo };
})();
// Chạy: RethrowEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Tại sao cần unstable_rethrow()?                          │
  │  → notFound/redirect throw INTERNAL errors! ★                │
  │  → try/catch "nuốt" errors → UI đúng không render! ★★★    │
  │  → rethrow cho framework handle! ★                          │
  │                                                              │
  │  ❓ 2: Gọi ở đâu trong catch block?                             │
  │  → ĐẦU catch block! Line đầu tiên! ★★★                     │
  │  → Nếu internal → throw lại, code sau KHÔNG chạy! ★        │
  │  → Nếu app error → continue bình thường! ★                 │
  │                                                              │
  │  ❓ 3: APIs nào throw internal errors?                           │
  │  → notFound(), redirect(), permanentRedirect()! ★           │
  │  → Dynamic: cookies(), headers(), searchParams! ★           │
  │  → fetch no-store, revalidate: 0! ★                        │
  │                                                              │
  │  ❓ 4: Có thể tránh dùng rethrow không?                         │
  │  → CÓ! Tách API calls ra function riêng! ★                 │
  │  → Caller handle exceptions! ★                              │
  │  → CHỈ dùng khi mixed app + framework errors! ★            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
