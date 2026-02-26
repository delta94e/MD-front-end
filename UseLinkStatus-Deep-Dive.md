# useLinkStatus() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/use-link-status
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/link`
> **Since**: Next.js v15.3.0!

---

## §1. useLinkStatus() Là Gì?

```
  useLinkStatus() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Client Component hook! ★                                  │
  │  → Track PENDING state của <Link>! ★                        │
  │  → import { useLinkStatus } from 'next/link'! ★             │
  │  → Hiển thị subtle inline feedback khi navigate! ★          │
  │  → Ví dụ: shimmer effect trên link đang chờ! ★             │
  │                                                              │
  │  KHI NÀO CẦN?                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ① Prefetching bị OFF hoặc đang in progress! ★       │    │
  │  │    → Navigation bị BLOCK chờ fetch! ★                 │    │
  │  │                                                       │    │
  │  │  ② Route đích là DYNAMIC + KHÔNG có loading.js! ★    │    │
  │  │    → Không thể instant navigation! ★                  │    │
  │  │                                                       │    │
  │  │  → useLinkStatus cho phép hiển thị hint! ★            │    │
  │  │  → User biết navigation đang xử lý! ★                │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  User click <Link> ─────────────────────────────────→ │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Prefetched? ──YES──→ Navigate instantly! ✅          │    │
  │  │    │                    (pending = false!)             │    │
  │  │    │NO                                                │    │
  │  │    ▼                                                  │    │
  │  │  pending = true! ★                                    │    │
  │  │  → Hiển thị shimmer/dot/hint! ★                      │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Route fetched ─────────────────────────────────────→ │    │
  │  │  pending = false! → Navigate! ✅                      │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. You Might NOT Need useLinkStatus!

```
  TRƯỚC KHI DÙNG — KIỂM TRA:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Route đích là STATIC + đã PREFETCHED?                     │
  │  → pending phase sẽ bị SKIP! ★                              │
  │  → Navigation gần như INSTANT! ★                            │
  │  → KHÔNG cần useLinkStatus! ★                               │
  │                                                              │
  │  ② Route có loading.js file?                                  │
  │  → Instant transition với route-level fallback! ★           │
  │  → KHÔNG cần useLinkStatus! ★                               │
  │                                                              │
  │  BEST PRACTICE:                                               │
  │  → useLinkStatus = QUICK PATCH! ★                           │
  │  → Dùng khi phát hiện slow transition! ★                    │
  │  → Sau đó FIX ROOT CAUSE:                                    │
  │    → Thêm prefetching! ★                                     │
  │    → Thêm loading.js fallback! ★                            │
  │                                                              │
  │  ƯU TIÊN:                                                     │
  │  1. loading.js (route-level fallback!) ★★★                  │
  │  2. Prefetching (instant transitions!) ★★                   │
  │  3. useLinkStatus (inline hint!) ★                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Parameters + Returns!

```
  SIGNATURE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  const { pending } = useLinkStatus()                         │
  │                                                              │
  │  PARAMETERS: KHÔNG CÓ! ★                                    │
  │  → Không nhận tham số nào! ★                                │
  │                                                              │
  │  RETURNS: object với 1 property:                              │
  │  ┌───────────┬──────────┬────────────────────────────────┐   │
  │  │ Property   │ Type     │ Mô tả                          │   │
  │  ├───────────┼──────────┼────────────────────────────────┤   │
  │  │ pending    │ boolean  │ true = đang navigate! ★        │   │
  │  │            │          │ false = done/idle! ★            │   │
  │  └───────────┴──────────┴────────────────────────────────┘   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Rules — Good to Know!

```
  RULES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① PHẢI là descendant của <Link>! ★★★                        │
  │  → useLinkStatus chỉ hoạt động BÊN TRONG <Link>! ★        │
  │  → Không phải children trực tiếp → cũng OK! ★              │
  │  → Nhưng PHẢI nằm trong component tree của <Link>! ★       │
  │                                                              │
  │  ② phù hợp nhất khi prefetch={false}! ★                     │
  │  → Nếu prefetched → pending = false luôn! ★                │
  │  → useLinkStatus KHÔNG làm gì! ★                            │
  │                                                              │
  │  ③ Multiple links click nhanh → chỉ link CUỐI pending! ★   │
  │  → Click A → Click B nhanh → pending chỉ cho B! ★          │
  │                                                              │
  │  ④ Pages Router → luôn trả { pending: false }! ★            │
  │  → KHÔNG hỗ trợ! ★                                          │
  │                                                              │
  │  ⑤ TRÁNH layout shift! ★★★                                   │
  │  → Dùng fixed-size hint element! ★                          │
  │  → Toggle opacity thay vì show/hide! ★                     │
  │  → Hoặc dùng animation! ★                                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Examples — Inline Hint + CSS Animation!

```
  EXAMPLE 1: Loading Indicator Component!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  // components/loading-indicator.tsx                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 'use client'                                          │    │
  │  │ import { useLinkStatus } from 'next/link'             │    │
  │  │                                                       │    │
  │  │ export default function LoadingIndicator() {           │    │
  │  │   const { pending } = useLinkStatus()                 │    │
  │  │   return (                                             │    │
  │  │     <span                                              │    │
  │  │       aria-hidden  ← accessibility! ★                 │    │
  │  │       className={`link-hint                           │    │
  │  │         ${pending ? 'is-pending' : ''}`}              │    │
  │  │     />                                                 │    │
  │  │   )                                                    │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  // layout.tsx — Menubar dùng LoadingIndicator!              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import Link from 'next/link'                          │    │
  │  │ import LoadingIndicator from                          │    │
  │  │   './components/loading-indicator'                     │    │
  │  │                                                       │    │
  │  │ const links = [                                        │    │
  │  │   { href: '/shop/electronics', label: 'Electronics' },│    │
  │  │   { href: '/shop/clothing', label: 'Clothing' },      │    │
  │  │   { href: '/shop/books', label: 'Books' },            │    │
  │  │ ]                                                      │    │
  │  │                                                       │    │
  │  │ function Menubar() {                                   │    │
  │  │   return (                                             │    │
  │  │     <div>                                              │    │
  │  │       {links.map(link => (                             │    │
  │  │         <Link key={link.label} href={link.href}>      │    │
  │  │           <span className="label">{link.label}</span> │    │
  │  │           <LoadingIndicator />  ← INSIDE <Link>! ★   │    │
  │  │         </Link>                                        │    │
  │  │       ))}                                              │    │
  │  │     </div>                                             │    │
  │  │   )                                                    │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  EXAMPLE 2: CSS — Graceful Fast Navigation!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PROBLEM: Navigation nhanh → flash hint không cần thiết! ★  │
  │  SOLUTION: animation-delay 100ms! ★                         │
  │                                                              │
  │  .link-hint {                                                 │
  │    display: inline-block;                                     │
  │    width: 0.6em;                                              │
  │    height: 0.6em;                                             │
  │    margin-left: 0.25rem;                                      │
  │    border-radius: 9999px;                                     │
  │    background: currentColor;                                  │
  │    opacity: 0;        ← ẩn mặc định! ★                      │
  │    visibility: hidden; ← giữ chỗ! ★                         │
  │  }                                                            │
  │                                                              │
  │  .link-hint.is-pending {                                      │
  │    visibility: visible;                                       │
  │    animation-name: fadeIn, pulse;                              │
  │    animation-duration: 200ms, 1s;                              │
  │    animation-delay: 100ms, 100ms;  ← DELAY! ★★★              │
  │    animation-timing-function: ease, ease-in-out;              │
  │    animation-iteration-count: 1, infinite;                    │
  │    animation-fill-mode: forwards, none;                       │
  │  }                                                            │
  │                                                              │
  │  @keyframes fadeIn { to { opacity: 0.35; } }                  │
  │  @keyframes pulse { 50% { opacity: 0.15; } }                 │
  │                                                              │
  │  GIẢI THÍCH:                                                  │
  │  → fadeIn: hiện từ từ SAU 100ms! ★                          │
  │  → pulse: nhấp nháy sutble! ★                               │
  │  → Nếu navigate < 100ms → KHÔNG hiện! ★★★                  │
  │  → Chỉ hiện khi navigate THỰC SỰ chậm! ★                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — UseLinkStatusEngine!

```javascript
var UseLinkStatusEngine = (function () {
  // ═══════════════════════════════════
  // 1. LINK STATUS SIMULATOR
  // ═══════════════════════════════════
  function useLinkStatus(linkConfig) {
    // Check if prefetched
    if (linkConfig.prefetched) {
      return {
        pending: false,
        reason: "Prefetched! Navigate instantly! ★",
        showHint: false,
      };
    }

    // Check if loading.js exists
    if (linkConfig.hasLoadingJs) {
      return {
        pending: false,
        reason: "loading.js → instant transition with fallback! ★",
        showHint: false,
        useLinkStatusNeeded: false,
      };
    }

    // Not prefetched, no loading.js → PENDING!
    return {
      pending: true,
      reason: "No prefetch + no loading.js → navigation blocked! ★",
      showHint: true,
      duration: linkConfig.fetchTime || "unknown",
    };
  }

  // ═══════════════════════════════════
  // 2. CONTEXT VALIDATOR
  // ═══════════════════════════════════
  function validateUsage(context) {
    var rules = {
      "inside-link": {
        valid: true,
        note: "Descendant of <Link>! OK! ★",
      },
      "outside-link": {
        valid: false,
        error: "PHẢI nằm TRONG <Link> component! ★★★",
      },
      "pages-router": {
        valid: true,
        note: "Luôn trả { pending: false }! Không hỗ trợ! ★",
        alwaysFalse: true,
      },
    };
    return rules[context] || { valid: false, error: "Unknown context!" };
  }

  // ═══════════════════════════════════
  // 3. MULTI-CLICK SIMULATOR
  // ═══════════════════════════════════
  function simulateMultiClick(clicks) {
    // Only last link's pending state is shown
    var results = [];
    for (var i = 0; i < clicks.length; i++) {
      var isLast = i === clicks.length - 1;
      results.push({
        link: clicks[i],
        pending: isLast,
        note: isLast
          ? "Navigating to THIS one! pending = true! ★"
          : "Overridden by next click! pending = false! ★",
      });
    }
    return results;
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ UseLinkStatus Engine ═══");

    console.log("\n── 1. Link Status ──");
    console.log("Prefetched:", useLinkStatus({ prefetched: true }));
    console.log("Has loading:", useLinkStatus({ hasLoadingJs: true }));
    console.log(
      "No prefetch:",
      useLinkStatus({
        prefetched: false,
        hasLoadingJs: false,
        fetchTime: "500ms",
      }),
    );

    console.log("\n── 2. Context ──");
    console.log("Inside Link:", validateUsage("inside-link"));
    console.log("Outside Link:", validateUsage("outside-link"));
    console.log("Pages Router:", validateUsage("pages-router"));

    console.log("\n── 3. Multi-Click ──");
    console.log(simulateMultiClick(["/shop", "/blog", "/about"]));
  }

  return { demo: demo };
})();
// Chạy: UseLinkStatusEngine.demo();
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: useLinkStatus khi nào trả pending=true?                 │
  │  → Khi prefetch CHƯA XONG hoặc bị OFF! ★                   │
  │  → Route đích dynamic + KHÔNG có loading.js! ★              │
  │  → Navigation bị block chờ fetch! ★                         │
  │  → Nếu đã prefetched → pending bị SKIP! ★                  │
  │                                                              │
  │  ❓ 2: Tại sao ưu tiên loading.js hơn useLinkStatus?           │
  │  → loading.js = route-level fallback! ★                     │
  │  → Instant transition! Không chờ! ★                         │
  │  → useLinkStatus = inline hint = quick patch! ★             │
  │  → FIX root cause: prefetching + loading.js! ★             │
  │                                                              │
  │  ❓ 3: useLinkStatus phải dùng ở đâu?                          │
  │  → DESCENDANT của <Link>! ★★★                               │
  │  → Không cần children trực tiếp! ★                          │
  │  → Nhưng PHẢI trong component tree của <Link>! ★            │
  │                                                              │
  │  ❓ 4: Làm sao tránh flash hint khi navigate nhanh?            │
  │  → CSS animation-delay: 100ms! ★★★                         │
  │  → Nếu navigate < 100ms → hint KHÔNG hiện! ★               │
  │  → Chỉ hiện khi THỰC SỰ chậm! ★                           │
  │  → Fixed-size element + toggle opacity! ★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
