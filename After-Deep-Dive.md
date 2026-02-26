# after() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/after
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v15.0.0-rc (unstable_after) → v15.1.0 (stable!)

---

## §1. after() Là Gì?

```
  after() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Schedule work SAU KHI response gửi xong! ★                │
  │  → Không block response = User nhận kết quả NHANH! ★        │
  │  → Chạy side effects sau khi response finished! ★           │
  │                                                              │
  │  IMPORT:                                                      │
  │  import { after } from 'next/server'                         │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Request ──→ Server Component render                  │    │
  │  │       │          │                                    │    │
  │  │       │          ▼                                    │    │
  │  │       │    after(() => log())  ← ĐĂNG KÝ callback!  │    │
  │  │       │          │                                    │    │
  │  │       │          ▼                                    │    │
  │  │       │    return <Page />  ← GỬI response! ★        │    │
  │  │       │          │                                    │    │
  │  │       │          ▼                                    │    │
  │  │       │    ── User nhận response! ✅ ──               │    │
  │  │       │          │                                    │    │
  │  │       │          ▼                                    │    │
  │  │       │    log() chạy! ← SAU response! ★             │    │
  │  │       │    (analytics, logging, cleanup...)           │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DÙNG ĐƯỢC Ở ĐÂU:                                            │
  │  → Server Components (pages, layouts!) ★                     │
  │  → generateMetadata! ★                                       │
  │  → Server Functions (Server Actions!) ★                      │
  │  → Route Handlers! ★                                         │
  │  → Proxy! ★                                                  │
  │                                                              │
  │  ⚠️ QUAN TRỌNG: after() KHÔNG phải Dynamic API! ★            │
  │  → KHÔNG biến route thành dynamic! ★                         │
  │  → Static page → callback chạy tại BUILD TIME! ★            │
  │  → Hoặc khi page revalidated! ★                              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Reference — Parameters + Duration!

```
  PARAMETERS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  after(callback: () => void | Promise<void>)                 │
  │                                                              │
  │  → callback: function chạy SAU response! ★                  │
  │  → Có thể async! ★                                           │
  │  → Không return gì (void!)                                   │
  │                                                              │
  │  VÍ DỤ:                                                       │
  │  after(() => {                                                │
  │    log()  // sync callback!                                  │
  │  })                                                          │
  │                                                              │
  │  after(async () => {                                          │
  │    await saveToDatabase()  // async callback! ★              │
  │  })                                                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  DURATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  → Chạy trong platform's default/configured max duration! ★ │
  │  → Config timeout bằng maxDuration route segment config!     │
  │                                                              │
  │  // route segment config:                                      │
  │  export const maxDuration = 30  // 30 giây! ★                │
  │                                                              │
  │  → Nếu callback chạy QUÁ maxDuration → bị terminate!        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. "Good to Know" — 3 Quy Tắc Quan Trọng!

```
  3 QUY TẮC:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① after() chạy NGAY CẢ KHI response FAIL! ★★★              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → throw Error → after() VẪN chạy! ★                  │    │
  │  │ → notFound() → after() VẪN chạy! ★                   │    │
  │  │ → redirect() → after() VẪN chạy! ★                   │    │
  │  │                                                       │    │
  │  │ → Giống try/finally! ★                                │    │
  │  │ → Logging errors, cleanup resources... ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② Dùng React cache() để DEDUPLICATE! ★                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { cache } from 'react'                         │    │
  │  │ const logOnce = cache(() => {                          │    │
  │  │   // Chỉ chạy 1 lần dù gọi nhiều lần! ★              │    │
  │  │ })                                                     │    │
  │  │ after(() => logOnce())                                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ after() CÓ THỂ LỒNG NHAU! ★                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ after(() => {                                          │    │
  │  │   after(() => {                                        │    │
  │  │     // nested after! ★                                 │    │
  │  │   })                                                   │    │
  │  │ })                                                     │    │
  │  │ → Utility functions wrap after calls! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Request APIs Trong after() — QUY TẮC QUAN TRỌNG!

```
  COOKIES/HEADERS TRONG after() — 2 TRƯỜNG HỢP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★★★ Route Handlers + Server Functions:                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → cookies() + headers() TRỰC TIẾP trong after! ✅    │    │
  │  │                                                       │    │
  │  │ export async function POST(request) {                 │    │
  │  │   // Mutation...                                       │    │
  │  │   after(async () => {                                  │    │
  │  │     const ua = (await headers()).get('user-agent')     │    │
  │  │     const sid = (await cookies()).get('session-id')    │    │
  │  │     logUserAction({ ua, sid })  // ✅ OK!              │    │
  │  │   })                                                   │    │
  │  │   return Response.json({ status: 'success' })         │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ★★★ Server Components (pages, layouts):                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → cookies()/headers() TRONG after → RUNTIME ERROR! ❌│    │
  │  │ → PHẢI đọc TRƯỚC, rồi truyền vào! ★★★               │    │
  │  │                                                       │    │
  │  │ // ❌ SAI!                                              │    │
  │  │ after(async () => {                                    │    │
  │  │   const ua = (await headers()).get('...') // CRASH! ❌ │    │
  │  │ })                                                     │    │
  │  │                                                       │    │
  │  │ // ✅ ĐÚNG! Đọc TRƯỚC, truyền VÀO!                    │    │
  │  │ const ua = (await headers()).get('user-agent')         │    │
  │  │ const sid = (await cookies()).get('session-id')?.value │    │
  │  │ after(() => {                                          │    │
  │  │   logUserAction({ ua, sid })  // ✅ Dùng closure!     │    │
  │  │ })                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO? → PPR (Partial Prerendering)! ★                    │
  │  → Next.js cần biết PHẦN NÀO dùng request data!             │
  │  → after() chạy SAU React render lifecycle!                  │
  │  → Nên KHÔNG được gọi Dynamic API trong after!              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  CACHE COMPONENTS + after():
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Pattern: Static Shell + Dynamic Component! ★                │
  │                                                              │
  │  export default function Page() {                             │
  │    return (                                                   │
  │      <>                                                      │
  │        <h1>Static shell!</h1>  ← prerendered! ★              │
  │        <Suspense fallback={<p>Loading...</p>}>               │
  │          <DynamicContent />    ← dynamic! ★                  │
  │        </Suspense>                                           │
  │      </>                                                     │
  │    )                                                         │
  │  }                                                           │
  │                                                              │
  │  async function DynamicContent() {                            │
  │    const sid = (await cookies()).get('session-id')?.value    │
  │    after(() => {                                              │
  │      logUserAction({ sid })  // ✅ OK trong component!       │
  │    })                                                        │
  │    return <p>Your session: {sid}</p>                         │
  │  }                                                           │
  │                                                              │
  │  → cookies() gọi NGOÀI after (trong render!) ★               │
  │  → Truyền vào after qua closure! ★                           │
  │  → <h1> + <Suspense fallback> = static shell! ★             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Platform Support + waitUntil!

```
  PLATFORM SUPPORT:
  ┌──────────────────┬────────────────────────────────────────┐
  │ Platform         │ Support                                │
  ├──────────────────┼────────────────────────────────────────┤
  │ Node.js server   │ ✅ Full support!                       │
  │ Docker container │ ✅ Full support!                       │
  │ Static export    │ ❌ KHÔNG (không có server!)            │
  │ Adapters         │ ⚠️ Cần implement waitUntil! ★          │
  │ Vercel           │ ✅ Built-in waitUntil! ★               │
  └──────────────────┴────────────────────────────────────────┘

  waitUntil — NỀN TẢNG CỦA after()! ★★★
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ:                                                     │
  │  → Serverless function = chết SAU response! ★                │
  │  → after() cần tiếp tục chạy SAU response! ★                │
  │  → waitUntil(promise) = giữ function SỐNG! ★                │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Request → Render → Response sent ──── User OK! ✅   │    │
  │  │                          │                            │    │
  │  │                          ▼                            │    │
  │  │  KHÔNG CÓ waitUntil: Function CHẾT! ❌                │    │
  │  │  CÓ waitUntil: Function SỐNG → chạy after! ★ ✅      │    │
  │  │                          │                            │    │
  │  │                          ▼                            │    │
  │  │                    Log, analytics...                   │    │
  │  │                          │                            │    │
  │  │                          ▼                            │    │
  │  │                    Promise settled → Function CHẾT!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NEXT.JS TÌM waitUntil:                                      │
  │  globalThis[Symbol.for('@next/request-context')]             │
  │    .get()                                                    │
  │    .waitUntil   ← platform phải cung cấp! ★                 │
  │                                                              │
  │  TYPE:                                                        │
  │  type NextRequestContext = {                                  │
  │    get(): {                                                  │
  │      waitUntil?: (promise: Promise<any>) => void             │
  │    } | undefined                                             │
  │  }                                                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — AfterEngine!

```javascript
var AfterEngine = (function () {
  // ═══════════════════════════════════
  // 1. AFTER SIMULATOR
  // ═══════════════════════════════════
  var pendingCallbacks = [];

  function after(callback) {
    // Đăng ký callback, KHÔNG chạy ngay!
    pendingCallbacks.push({
      callback: callback,
      registeredAt: Date.now(),
    });
  }

  // Simulate: Flush all after() callbacks SAU response
  function flushAfterCallbacks() {
    console.log(
      "── Response sent! Flushing " +
        pendingCallbacks.length +
        " after() callbacks ──",
    );
    var results = [];
    for (var i = 0; i < pendingCallbacks.length; i++) {
      var entry = pendingCallbacks[i];
      try {
        var result = entry.callback();
        results.push({ index: i, status: "success", result: result });
      } catch (err) {
        results.push({ index: i, status: "error", error: err.message });
      }
    }
    pendingCallbacks = [];
    return results;
  }

  // ═══════════════════════════════════
  // 2. REQUEST API CHECKER
  // ═══════════════════════════════════
  function canUseRequestAPIs(context, apiName) {
    var rules = {
      "Route Handler": {
        inCallback: true,
        reason: "Route Handler cho phép trực tiếp! ✅",
      },
      "Server Function": {
        inCallback: true,
        reason: "Server Function cho phép trực tiếp! ✅",
      },
      "Server Component": {
        inCallback: false,
        reason: "Server Component KHÔNG cho phép! ❌ Đọc TRƯỚC, truyền VÀO! ★",
      },
      Layout: {
        inCallback: false,
        reason: "Layout KHÔNG cho phép! ❌ Đọc TRƯỚC! ★",
      },
      generateMetadata: {
        inCallback: false,
        reason: "generateMetadata KHÔNG cho phép! ❌",
      },
    };

    var rule = rules[context];
    if (!rule) return { allowed: false, reason: "Unknown context: " + context };

    return {
      context: context,
      api: apiName,
      allowedInCallback: rule.inCallback,
      advice: rule.inCallback
        ? "Gọi " + apiName + "() trực tiếp trong after()! ✅"
        : "Đọc " + apiName + "() TRƯỚC after(), truyền qua closure! ★",
      reason: rule.reason,
    };
  }

  // ═══════════════════════════════════
  // 3. WAITUNTIL SIMULATOR
  // ═══════════════════════════════════
  function createWaitUntil() {
    var promises = [];
    return {
      waitUntil: function (promise) {
        promises.push(promise);
      },
      getAllPromises: function () {
        return promises;
      },
      setup: function () {
        var self = this;
        // simulate globalThis[@next/request-context]
        return {
          "Symbol.for('@next/request-context')": {
            get: function () {
              return { waitUntil: self.waitUntil };
            },
          },
        };
      },
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ After Engine ═══");

    console.log("\n── After Simulator ──");
    after(function () {
      console.log("Log analytics!");
    });
    after(function () {
      console.log("Send webhook!");
    });
    after(function () {
      throw new Error("Failed!");
    });
    console.log("Pending:", pendingCallbacks.length);
    console.log("Flush:", flushAfterCallbacks());

    console.log("\n── Request API Check ──");
    console.log(
      "Route Handler cookies:",
      canUseRequestAPIs("Route Handler", "cookies"),
    );
    console.log(
      "Server Component headers:",
      canUseRequestAPIs("Server Component", "headers"),
    );
    console.log("Layout cookies:", canUseRequestAPIs("Layout", "cookies"));

    console.log("\n── WaitUntil ──");
    var wu = createWaitUntil();
    wu.waitUntil(Promise.resolve("done!"));
    console.log("Context:", wu.setup());
    console.log("Promises:", wu.getAllPromises().length);
  }

  return { demo: demo };
})();
// Chạy: AfterEngine.demo();
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: after() dùng để làm gì?                                 │
  │  → Schedule work SAU KHI response gửi xong! ★                │
  │  → Không block response = user nhận kết quả NHANH! ★        │
  │  → Use cases: logging, analytics, webhooks, cleanup! ★      │
  │                                                              │
  │  ❓ 2: after() có phải Dynamic API không?                      │
  │  → KHÔNG! ★★★ Không biến route thành dynamic!                │
  │  → Static page → callback chạy tại BUILD TIME! ★            │
  │  → Hoặc khi revalidated! ★                                  │
  │                                                              │
  │  ❓ 3: cookies()/headers() trong after() — quy tắc?           │
  │  → Route Handler/Server Function → ✅ TRỰC TIẾP OK!          │
  │  → Server Component → ❌ RUNTIME ERROR! ★★★                  │
  │  → Server Component → đọc TRƯỚC, truyền qua closure! ★      │
  │  → Lý do: PPR cần biết phần nào dùng request data!          │
  │                                                              │
  │  ❓ 4: after() chạy khi response FAIL thì sao?                │
  │  → VẪN CHẠY! ★ (error, notFound, redirect!)                 │
  │  → Giống try/finally pattern! ★                              │
  │                                                              │
  │  ❓ 5: waitUntil là gì? Tại sao cần?                          │
  │  → Serverless function chết SAU response! ★                  │
  │  → waitUntil(promise) giữ function SỐNG để chạy after! ★    │
  │  → Vercel cung cấp built-in! ★                               │
  │  → Self-host → phải implement qua                            │
  │    globalThis[Symbol.for('@next/request-context')]! ★        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
