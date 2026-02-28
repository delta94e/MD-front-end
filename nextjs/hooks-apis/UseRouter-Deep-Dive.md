# useRouter() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/use-router
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/navigation` (KHÔNG PHẢI next/router!)
> **Since**: v13.0.0 (v15.4.0 thêm onInvalidate cho prefetch)

---

## §1. useRouter() Là Gì?

```
  useRouter() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Client Component hook! ★                                  │
  │  → Programmatic navigation! ★                               │
  │  → import { useRouter } from 'next/navigation'! ★★★         │
  │  → KHÔNG phải 'next/router' (Pages Router)! ★★★            │
  │                                                              │
  │  ⚠️ KHUYẾN NGHỊ:                                              │
  │  → Ưu tiên <Link> component cho navigation! ★               │
  │  → useRouter chỉ khi có yêu cầu ĐẶC BIỆT! ★              │
  │  → VD: navigate sau form submit, button click! ★            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. 6 Methods!

```
  ROUTER METHODS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬──────────────────────────────────────┐ │
  │  │ Method             │ Mô tả                                │ │
  │  ├──────────────────┼──────────────────────────────────────┤ │
  │  │ router.push()      │ Navigate + ADD history entry! ★     │ │
  │  │                    │ push(href, { scroll: boolean })     │ │
  │  ├──────────────────┼──────────────────────────────────────┤ │
  │  │ router.replace()   │ Navigate + KHÔNG add history! ★    │ │
  │  │                    │ replace(href, { scroll: boolean })  │ │
  │  ├──────────────────┼──────────────────────────────────────┤ │
  │  │ router.refresh()   │ Refresh route hiện tại! ★           │ │
  │  │                    │ Re-fetch data + re-render Server    │ │
  │  │                    │ Components! GIỮ client state! ★★★  │ │
  │  ├──────────────────┼──────────────────────────────────────┤ │
  │  │ router.prefetch()  │ Prefetch route cho transition! ★    │ │
  │  │                    │ prefetch(href, { onInvalidate? })   │ │
  │  │                    │ v15.4.0: thêm onInvalidate! ★      │ │
  │  ├──────────────────┼──────────────────────────────────────┤ │
  │  │ router.back()      │ → Quay lại trang trước! ★          │ │
  │  │                    │ (history.back())                    │ │
  │  ├──────────────────┼──────────────────────────────────────┤ │
  │  │ router.forward()   │ → Đi tới trang sau! ★              │ │
  │  │                    │ (history.forward())                 │ │
  │  └──────────────────┴──────────────────────────────────────┘ │
  │                                                              │
  │  push vs replace:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  push('/dashboard'):                                   │    │
  │  │  History: [/home, /about, /dashboard] ← THÊM! ★      │    │
  │  │  Back button → /about! ★                              │    │
  │  │                                                       │    │
  │  │  replace('/dashboard'):                                │    │
  │  │  History: [/home, /dashboard] ← THAY THẾ /about! ★   │    │
  │  │  Back button → /home! ★                               │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  refresh() CÓ GÌ ĐẶC BIỆT:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  → Re-fetch data requests! ★                          │    │
  │  │  → Re-render Server Components! ★                     │    │
  │  │  → MERGE updated RSC payload! ★                       │    │
  │  │  → GIỮ client-side state (useState)! ★★★              │    │
  │  │  → GIỮ browser state (scroll position)! ★★★           │    │
  │  │  → KHÔNG full page reload! ★                          │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Good to Know — Security + Caveats!

```
  RULES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ⚠️ XSS WARNING! ★★★                                         │
  │  → KHÔNG gửi untrusted URLs vào push/replace! ★★★           │
  │  → javascript: URLs sẽ bị EXECUTE! ★★★                     │
  │  → router.push('javascript:alert(1)') → XSS! ★★★          │
  │  → PHẢI sanitize URLs! ★★★                                 │
  │                                                              │
  │  refresh() + cached fetch:                                    │
  │  → fetch cached → refresh có thể cho CÙNG kết quả! ★       │
  │  → cookies/headers thay đổi → response có thể khác! ★     │
  │                                                              │
  │  <Link> auto prefetch:                                        │
  │  → <Link> prefetch khi visible trong viewport! ★            │
  │  → useRouter.prefetch → prefetch thủ công! ★               │
  │                                                              │
  │  onInvalidate (v15.4.0):                                      │
  │  → Callback khi prefetched data stale! ★                   │
  │  → Gọi tối đa 1 lần per prefetch request! ★               │
  │  → Signal để trigger prefetch mới! ★                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Migration — next/router → next/navigation!

```
  MIGRATION GUIDE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌─────────────────────┬─────────────────────────────────┐   │
  │  │ Pages Router (cũ)    │ App Router (mới)                 │   │
  │  ├─────────────────────┼─────────────────────────────────┤   │
  │  │ next/router          │ next/navigation! ★★★             │   │
  │  │ router.pathname      │ usePathname()! ★                 │   │
  │  │ router.query         │ useSearchParams()! ★             │   │
  │  │ router.events        │ usePathname + useSearchParams    │   │
  │  │                     │ + useEffect! ★                   │   │
  │  └─────────────────────┴─────────────────────────────────┘   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Examples — Router Events + Scroll!

```
  EXAMPLE 1: Router Events (thay thế router.events!)
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  // components/navigation-events.tsx                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 'use client'                                          │    │
  │  │ import { useEffect } from 'react'                     │    │
  │  │ import { usePathname, useSearchParams }                │    │
  │  │   from 'next/navigation'                               │    │
  │  │                                                       │    │
  │  │ export function NavigationEvents() {                   │    │
  │  │   const pathname = usePathname()                      │    │
  │  │   const searchParams = useSearchParams()              │    │
  │  │                                                       │    │
  │  │   useEffect(() => {                                    │    │
  │  │     const url = `${pathname}?${searchParams}`         │    │
  │  │     console.log(url)                                  │    │
  │  │     // Analytics, logging, etc.                        │    │
  │  │   }, [pathname, searchParams])                         │    │
  │  │                                                       │    │
  │  │   return '...'                                         │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  // layout.tsx — BỌC Suspense! ★★★                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { Suspense } from 'react'                      │    │
  │  │ import { NavigationEvents } from                       │    │
  │  │   './components/navigation-events'                     │    │
  │  │                                                       │    │
  │  │ export default function Layout({ children }) {         │    │
  │  │   return (                                             │    │
  │  │     <html>                                             │    │
  │  │       <body>                                           │    │
  │  │         {children}                                     │    │
  │  │         <Suspense fallback={null}> ← BẮT BUỘC! ★★★   │    │
  │  │           <NavigationEvents />                         │    │
  │  │         </Suspense>                                    │    │
  │  │       </body>                                          │    │
  │  │     </html>                                            │    │
  │  │   )                                                    │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │  → useSearchParams gây CSR → cần Suspense! ★★★             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  EXAMPLE 2: Disable Scroll to Top!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  router.push('/dashboard', { scroll: false })                │
  │  // → Navigate NHƯNG KHÔNG scroll lên top! ★                │
  │                                                              │
  │  router.replace('/settings', { scroll: false })              │
  │  // → Replace NHƯNG giữ vị trí scroll! ★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — UseRouterEngine!

```javascript
var UseRouterEngine = (function () {
  // ═══════════════════════════════════
  // 1. HISTORY STACK SIMULATOR
  // ═══════════════════════════════════
  var history = ["/"];
  var currentIndex = 0;

  function push(href, options) {
    // Remove forward history
    history = history.slice(0, currentIndex + 1);
    history.push(href);
    currentIndex++;
    return {
      action: "PUSH",
      href: href,
      history: history.slice(),
      index: currentIndex,
      scrollToTop: options && options.scroll === false ? false : true,
    };
  }

  function replace(href, options) {
    history[currentIndex] = href;
    return {
      action: "REPLACE",
      href: href,
      history: history.slice(),
      index: currentIndex,
      scrollToTop: options && options.scroll === false ? false : true,
    };
  }

  function back() {
    if (currentIndex > 0) {
      currentIndex--;
      return {
        action: "BACK",
        current: history[currentIndex],
        history: history.slice(),
        index: currentIndex,
      };
    }
    return { action: "BACK", error: "Already at first page!" };
  }

  function forward() {
    if (currentIndex < history.length - 1) {
      currentIndex++;
      return {
        action: "FORWARD",
        current: history[currentIndex],
        history: history.slice(),
        index: currentIndex,
      };
    }
    return { action: "FORWARD", error: "Already at last page!" };
  }

  // ═══════════════════════════════════
  // 2. REFRESH SIMULATOR
  // ═══════════════════════════════════
  function refresh() {
    return {
      action: "REFRESH",
      current: history[currentIndex],
      reFetchData: true,
      reRenderServerComponents: true,
      preserveClientState: true,
      preserveScrollPosition: true,
      note: "Server Components re-render + CLIENT state GIỮ! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 3. PREFETCH SIMULATOR
  // ═══════════════════════════════════
  var prefetchCache = {};
  function prefetch(href, options) {
    prefetchCache[href] = { prefetchedAt: Date.now(), stale: false };

    // Simulate onInvalidate
    if (options && options.onInvalidate) {
      setTimeout(function () {
        prefetchCache[href].stale = true;
        options.onInvalidate();
      }, 5000);
    }

    return {
      action: "PREFETCH",
      href: href,
      note: "Route prefetched for faster transition! ★",
      hasOnInvalidate: !!(options && options.onInvalidate),
    };
  }

  // ═══════════════════════════════════
  // 4. XSS VALIDATOR
  // ═══════════════════════════════════
  function validateUrl(href) {
    if (href.indexOf("javascript:") === 0) {
      return {
        safe: false,
        error: "XSS VULNERABILITY! javascript: URL detected! ★★★",
        fix: "Sanitize URL before passing to router.push()! ★",
      };
    }
    if (href.indexOf("data:") === 0) {
      return { safe: false, error: "data: URL → potential XSS! ★★★" };
    }
    return { safe: true, note: "URL is safe! ★" };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ UseRouter Engine ═══");

    console.log("\n── 1. Push ──");
    console.log(push("/about"));
    console.log(push("/dashboard"));
    console.log(push("/settings", { scroll: false }));

    console.log("\n── 2. Back/Forward ──");
    console.log(back());
    console.log(back());
    console.log(forward());

    console.log("\n── 3. Replace ──");
    console.log(replace("/profile"));

    console.log("\n── 4. Refresh ──");
    console.log(refresh());

    console.log("\n── 5. XSS Check ──");
    console.log(validateUrl("/dashboard"));
    console.log(validateUrl("javascript:alert(1)"));
  }

  return { demo: demo };
})();
// Chạy: UseRouterEngine.demo();
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: push vs replace?                                        │
  │  → push: ADD entry vào history stack! Back = trang trước! ★│
  │  → replace: THAY THẾ entry! Back = trang trước nữa! ★     │
  │                                                              │
  │  ❓ 2: refresh() đặc biệt gì?                                  │
  │  → Re-fetch data + re-render Server Components! ★           │
  │  → GIỮ client-side state (useState)! ★★★                  │
  │  → GIỮ browser state (scroll)! ★★★                        │
  │  → MERGE RSC payload! Không full reload! ★                 │
  │                                                              │
  │  ❓ 3: next/router vs next/navigation?                         │
  │  → next/router = Pages Router! ★                            │
  │  → next/navigation = App Router! ★★★                       │
  │  → pathname → usePathname()! ★                              │
  │  → query → useSearchParams()! ★                            │
  │  → events → usePathname + useSearchParams + useEffect! ★  │
  │                                                              │
  │  ❓ 4: XSS risk với router.push?                               │
  │  → javascript: URLs bị EXECUTE! ★★★                        │
  │  → PHẢI sanitize URLs trước khi push/replace! ★             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
