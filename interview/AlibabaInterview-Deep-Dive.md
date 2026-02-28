# Alibaba Front-End Interview — Compiled Answers Deep Dive

> 📅 2026-02-12 · ⏱ 15 phút đọc
>
> Nguồn: Alibaba (Gaode) Front-End Team — Tổng hợp đáp án phỏng vấn
> Topics: HTTP/TCP, Virtual DOM, Modules, Auth, Image, V8, Floating Point
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: Core Fundamentals / Interview Strategy

---

## Mục Lục

0. [Tổng Quan — Interview Mindset](#tổng-quan)
1. [HTTP Requests on a Single TCP Connection](#http-tcp)
2. [Virtual DOM — Real Advantages](#virtual-dom)
3. [CommonJS vs ES6 Modules](#modules)
4. [Cookie vs Token vs Session](#auth)
5. [Image Format Selection](#image-formats)
6. [First Screen & White Screen Timing](#performance-timing)
7. [Mini-Program vs H5](#mini-program)
8. [0.1 + 0.2 === 0.3? — IEEE 754](#floating-point)
9. [V8 Engine — How JS Executes](#v8-engine)
10. [Tóm Tắt & Checklist](#tóm-tắt)

---

## Tổng Quan — Interview Mindset

```
ALIBABA INTERVIEW PHILOSOPHY:
═══════════════════════════════════════════════════════════════

  ❌ SAI LẦM: Trả lời "đúng" nhưng NÔNG CẠN
  → "Virtual DOM nhanh hơn Real DOM" → SAI & thiếu depth!
  → "0.1+0.2 !== 0.3, dùng toFixed" → THIẾU bản chất!

  ✅ ĐÚNG CÁCH: Show DEPTH that others don't have
  → Giải thích WHY → underlying principle
  → Mention industry solutions (math.js, etc.)
  → Share personal experience (đã gặp vấn đề này trong project X)
  → Mở rộng chủ đề liên quan (BigInt, safe integers, etc.)

  FORMULA:
  Background → Problem → Underlying Principle → Solutions → Expansion
```

---

## §1. HTTP Requests on a Single TCP Connection

> **[Gaode Interview]** Trên 1 TCP connection có thể gửi bao nhiêu HTTP request?

```
HTTP VERSIONS — TCP CONNECTION BEHAVIOR:
═══════════════════════════════════════════════════════════════

  HTTP/1.0 (default):
  ┌─────────────────────────────────────────────────────────┐
  │ 1 TCP connection = 1 HTTP request → CLOSE              │
  │ Mỗi request → TCP handshake → request → response → FIN│
  │                                                         │
  │ EXCEPTION: Connection: Keep-Alive header                │
  │ → Server giữ TCP open → multiple requests              │
  │ → Nhưng có nhiều limitations và rules                   │
  └─────────────────────────────────────────────────────────┘

  HTTP/1.1 (persistent connections):
  ┌─────────────────────────────────────────────────────────┐
  │ Keep-Alive = DEFAULT (không cần header)                 │
  │ 1 TCP = UNLIMITED HTTP requests (sequential)           │
  │                                                         │
  │ ⚠️ Head-of-Line Blocking:                              │
  │ Request 1 chưa xong → Request 2 phải ĐỢI!             │
  │ Pipelining: gửi nhiều request, nhưng response vẫn FIFO │
  │                                                         │
  │ Browser limit: 6-8 TCP connections per domain           │
  └─────────────────────────────────────────────────────────┘

  HTTP/2.0 (multiplexing):
  ┌─────────────────────────────────────────────────────────┐
  │ 1 TCP = UNLIMITED HTTP requests (CONCURRENT! ⭐)       │
  │ Multiplexing: multiple streams trên 1 connection        │
  │ KHÔNG có Head-of-Line Blocking (ở HTTP level)           │
  │ Binary framing → interleave requests/responses          │
  │                                                         │
  │ → Chỉ cần 1 TCP connection cho entire domain!          │
  │ → Header compression (HPACK)                            │
  │ → Server Push                                           │
  └─────────────────────────────────────────────────────────┘

  HTTP/3.0 (QUIC over UDP):
  ┌─────────────────────────────────────────────────────────┐
  │ Giải quyết TCP-level Head-of-Line Blocking              │
  │ QUIC: mỗi stream independent → 1 stream loss           │
  │ → KHÔNG block other streams!                            │
  │ → 0-RTT connection establishment                        │
  └─────────────────────────────────────────────────────────┘

  TIMELINE:
  HTTP/1.0  → 1 TCP = 1 request (waste!)
  HTTP/1.1  → 1 TCP = ∞ requests (sequential, HOL blocking)
  HTTP/2.0  → 1 TCP = ∞ requests (concurrent, multiplexed!)
  HTTP/3.0  → 1 QUIC = ∞ requests (no TCP HOL, 0-RTT)
```

---

## §2. Virtual DOM — Real Advantages

> **[Tencent Round 1]** Virtual DOM có ưu điểm gì?

```
INTERVIEWER THỰC SỰ MUỐN NGHE GÌ?
═══════════════════════════════════════════════════════════════

  ❌ "Virtual DOM nhanh hơn real DOM"
  → SAI! Direct DOM manipulation CÓ THỂ nhanh hơn
  → jQuery vẫn tồn tại chứng minh direct DOM works fine

  ✅ Interviewer muốn nghe:
  → TẠI SAO frequent DOM manipulation gây performance issues
  → VDOM giải quyết PROBLEMS gì
  → Underlying mechanism: JS engine ↔ DOM engine switching
```

```
JS ENGINE vs DOM ENGINE — THE REAL COST:
═══════════════════════════════════════════════════════════════

  ┌──────────────┐     ┌──────────────┐
  │  JS Engine   │ ←→  │  DOM Engine   │   SAME THREAD!
  │  (V8, etc.)  │     │  (Blink, etc.)│
  └──────────────┘     └──────────────┘

  Khi JS gọi DOM API:
  ① JS engine SUSPEND (tạm dừng)
  ② Transform input parameters (bridge overhead)
  ③ Activate DOM engine
  ④ DOM engine execute (possible reflow/repaint!)
  ⑤ Transform return values
  ⑥ Re-activate JS engine
  → Mỗi lần switch = có cost!

  Frequent calls → accumulated switching cost = LAG! 🐌

  NẾU có forced reflow (offsetHeight, getComputedStyle...):
  → Browser PHẢI recalculate layout + repaint
  → Cost CÀNG LỚN!
```

```
VDOM — HOW IT HELPS:
═══════════════════════════════════════════════════════════════

  ① KHÔNG immediately layout/repaint:
  → Modify VDOM (JS object) → NO DOM engine involved!
  → All changes happen in JS memory → FAST!

  ② BATCH + DIFF:
  → Accumulate nhiều changes vào VDOM
  → Diff old VDOM vs new VDOM → find MINIMAL changes
  → Apply ONLY minimal changes to real DOM (1 batch!)

  ③ REDUCE repaint area:
  → Diff → chỉ 3 nodes thay đổi → chỉ update 3 nodes
  → KHÔNG repaint entire page!

  PROCESS:
  setState() → new VDOM → diff(old, new) → patches → batch DOM update
                JS memory (fast!)                    1 time DOM (slow)

  TÓM LẠI:
  → VDOM không "nhanh hơn DOM"
  → VDOM giúp MINIMIZE số lần và phạm vi DOM operations
  → Trade-off: extra memory (VDOM tree) + diff computation
  → Worth it khi có NHIỀU frequent updates
```

---

## §3. CommonJS vs ES6 Modules

> **[ByteDance]** CommonJS và ES6 Module khác nhau thế nào?

```
COMMONJS vs ES6 MODULES — 5 KEY DIFFERENCES:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬──────────────────┬─────────────────────┐
  │                │ CommonJS (CJS)   │ ES6 Modules (ESM)   │
  ├────────────────┼──────────────────┼─────────────────────┤
  │ Output         │ COPY of value    │ REFERENCE (live!)    │
  │                │ → thay đổi gốc   │ → thay đổi gốc      │
  │                │   KHÔNG ảnh hưởng│   CÓ ảnh hưởng! ⭐  │
  ├────────────────┼──────────────────┼─────────────────────┤
  │ Loading        │ RUNTIME          │ COMPILE TIME         │
  │                │ (synchronous)    │ (static analysis)    │
  │                │ → require() bất  │ → import phải ở      │
  │                │   cứ đâu         │   TOP LEVEL          │
  ├────────────────┼──────────────────┼─────────────────────┤
  │ Exports        │ SINGLE value     │ MULTIPLE values      │
  │                │ module.exports={}│ export const a,b,c   │
  ├────────────────┼──────────────────┼─────────────────────┤
  │ Dynamic syntax │ ✅ YES           │ ❌ NO (static only)  │
  │                │ if(x) require(y) │ → import() dynamic   │
  │                │                  │   returns Promise     │
  ├────────────────┼──────────────────┼─────────────────────┤
  │ this           │ current module   │ undefined            │
  └────────────────┴──────────────────┴─────────────────────┘
```

```javascript
// CJS: COPY of value → changes DON'T reflect
// lib.cjs
let count = 0;
module.exports = { count, increment: () => count++ };

// main.cjs
const lib = require("./lib.cjs");
lib.increment();
console.log(lib.count); // 0 (copy, NOT updated!)

// ESM: REFERENCE → changes DO reflect ⭐
// lib.mjs
export let count = 0;
export function increment() {
  count++;
}

// main.mjs
import { count, increment } from "./lib.mjs";
increment();
console.log(count); // 1 (live binding!)
```

```
TẠI SAO ESM STATIC ANALYSIS QUAN TRỌNG?
═══════════════════════════════════════════════════════════════

  Static analysis → compiler biết TRƯỚC import/export
  → Tree Shaking: remove unused exports (dead code elimination)
  → Vite pre-bundling: optimize trước khi serve
  → IDE: auto-complete, go-to-definition chính xác

  CJS: require() dynamic → KHÔNG thể tree shake!
  → Bundle luôn include TOÀN BỘ module
  → Đây là lý do angular/react migrate sang ESM!
```

---

## §4. Cookie vs Token vs Session

```
EVOLUTION — TẠI SAO CẦN AUTHENTICATION?
═══════════════════════════════════════════════════════════════

  HTTP = STATELESS → Server KHÔNG biết ai gửi request!
  → Cần mechanism để "nhớ" user → 3 solutions evolved:

  ┌─────────────────────────────────────────────────────────┐
  │ COOKIE (oldest):                                        │
  │ → Server set cookie → browser auto-send mỗi request    │
  │ → Stored: browser (4KB limit per domain)                │
  │ → Auto-attached: YES (Cookie header)                    │
  │ → Vulnerable: CSRF (cross-site request forgery!)        │
  │ → Domain-bound: YES (SameSite, HttpOnly, Secure)        │
  │                                                         │
  │ ⚠️ Chrome 80: block 3rd-party cookies by default!      │
  │ → SameSite=Lax (default) → no cross-site cookies       │
  │ → Tracking/advertising industry impacted!               │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ SESSION (server-side):                                  │
  │ → Server tạo session → store in memory/DB/Redis         │
  │ → Send sessionId via cookie to browser                  │
  │ → Browser sends sessionId → server lookup session data  │
  │ → Stored: SERVER (no size limit, but memory cost!)      │
  │ → Scalability: ❌ session KHÔNG share across servers!   │
  │ → Solution: Redis centralized session store             │
  └─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │ TOKEN / JWT (modern):                                   │
  │ → Server sign token (header.payload.signature)          │
  │ → Client store anywhere (localStorage, cookie, memory)  │
  │ → Client sends via Authorization header                 │
  │ → Server VERIFY signature → no need to store state!     │
  │ → Stored: CLIENT (no server memory cost!)               │
  │ → Scalability: ✅ stateless, works across servers       │
  │ → Drawback: cannot revoke (until expiry), larger size   │
  └─────────────────────────────────────────────────────────┘
```

```
SO SÁNH — 3 APPROACHES:
═══════════════════════════════════════════════════════════════

  ┌──────────┬────────────┬────────────┬────────────────────┐
  │          │ Cookie     │ Session    │ Token (JWT)        │
  ├──────────┼────────────┼────────────┼────────────────────┤
  │ Stored   │ Client     │ Server     │ Client             │
  │ Size     │ 4KB limit  │ Unlimited  │ ~1-2KB typically   │
  │ Auto-send│ ✅ Yes     │ Via cookie │ ❌ Manual (header) │
  │ Stateless│ ❌         │ ❌ (store) │ ✅ Yes             │
  │ Scale    │ OK         │ ❌ Hard    │ ✅ Easy            │
  │ CSRF     │ ❌ Vuln    │ ❌ Vuln    │ ✅ Safe (header)   │
  │ Revoke   │ ✅ Delete  │ ✅ Delete  │ ❌ Wait expiry     │
  │ XSS      │ HttpOnly ✅│ HttpOnly ✅│ localStorage ❌    │
  └──────────┴────────────┴────────────┴────────────────────┘

  BEST PRACTICE:
  → JWT stored in HttpOnly cookie + CSRF token
  → Combines JWT scalability + cookie security!
```

---

## §5. Image Format Selection

> **[ByteDance/Headline]** Chọn format ảnh thế nào? PNG, WebP, etc.?

```
IMAGE FORMAT COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌────────┬────────────┬──────┬──────┬───────────┬─────────────────────┐
  │ Format │ Compress   │Trans │Anim  │ Compat    │ Best For            │
  ├────────┼────────────┼──────┼──────┼───────────┼─────────────────────┤
  │ JPEG   │ Lossy      │ ❌   │ ❌   │ ALL       │ Photos, complex     │
  │        │ (good!)    │      │      │           │ colors              │
  ├────────┼────────────┼──────┼──────┼───────────┼─────────────────────┤
  │ PNG    │ Lossless   │ ✅   │ ❌   │ ALL       │ Icons, logos,       │
  │        │            │      │      │           │ transparency needed │
  ├────────┼────────────┼──────┼──────┼───────────┼─────────────────────┤
  │ GIF    │ Lossless   │ ✅   │ ✅   │ ALL       │ Simple animations,  │
  │        │ (256 color)│      │      │           │ limited colors      │
  ├────────┼────────────┼──────┼──────┼───────────┼─────────────────────┤
  │ WebP   │ Both       │ ✅   │ ✅   │ Modern    │ Everything! 25-35%  │
  │        │            │      │      │           │ smaller than JPEG   │
  ├────────┼────────────┼──────┼──────┼───────────┼─────────────────────┤
  │ AVIF   │ Both       │ ✅   │ ✅   │ Chrome,FF │ Next-gen, 50%       │
  │        │            │      │      │           │ smaller than JPEG!  │
  ├────────┼────────────┼──────┼──────┼───────────┼─────────────────────┤
  │ SVG    │ Lossless   │ ✅   │ ✅   │ ALL (IE8+)│ Icons, logos,       │
  │        │ (vector!)  │      │      │           │ scalable graphics   │
  ├────────┼────────────┼──────┼──────┼───────────┼─────────────────────┤
  │ APNG   │ Lossless   │ ✅   │ ✅   │ FF,Safari │ Animated with       │
  │        │            │      │      │           │ semi-transparency   │
  └────────┴────────────┴──────┴──────┴───────────┴─────────────────────┘

  DECISION TREE:
  Photo/complex? → JPEG (or WebP if modern browser)
  Need transparency? → PNG (or WebP)
  Simple animation? → GIF (or WebP)
  Scalable/dynamic? → SVG
  Modern browser only? → WebP (best all-rounder!)
  Cutting edge? → AVIF (smallest file size)
```

---

## §6. First Screen & White Screen Timing

```
PERFORMANCE METRICS — CÁCH TÍNH:
═══════════════════════════════════════════════════════════════

  FIRST SCREEN TIME (首屏时间):
  ┌─────────────────────────────────────────────────────────┐
  │ Definition: Khi "main content" hiện trên viewport       │
  │                                                         │
  │ Native WebView:                                         │
  │ → iOS: webViewDidFinishLoad                             │
  │ → Android: onPageFinished                               │
  │                                                         │
  │ Web:                                                    │
  │ → performance.timing (Navigation Timing API)            │
  │ → LCP (Largest Contentful Paint) — Core Web Vitals      │
  │ → MutationObserver: observe DOM changes → mark time     │
  │ → Custom: performance.mark('first-screen-ready')        │
  └─────────────────────────────────────────────────────────┘

  WHITE SCREEN TIME (白屏时间):
  ┌─────────────────────────────────────────────────────────┐
  │ Có NHIỀU definitions:                                   │
  │                                                         │
  │ ① "No content": DOM node count < threshold X            │
  │    → document.querySelectorAll('*').length < X          │
  │                                                         │
  │ ② "Network/service error": shows error code             │
  │    → Check specific error elements/codes                │
  │                                                         │
  │ ③ "Loading": shows loading spinner/skeleton             │
  │    → Detect loading state persistence                   │
  │                                                         │
  │ ④ "Image fail": images not loaded                       │
  │    → MutationObserver + img.onerror tracking            │
  │                                                         │
  │ CALCULATION:                                            │
  │ → FP (First Paint) - navigationStart                    │
  │ → performance.getEntriesByType('paint')[0].startTime    │
  └─────────────────────────────────────────────────────────┘
```

---

## §7. Mini-Program vs H5

```
MINI-PROGRAM vs H5 — KEY DIFFERENCES:
═══════════════════════════════════════════════════════════════

  ① RENDERING:
  ┌─────────────────────────────────────────────────────────┐
  │ H5: Browser renders HTML/CSS/JS (WebView)               │
  │ Mini-program: NATIVE rendering (default, faster!)       │
  │ → Also supports WebView (for embedding H5 pages)        │
  │ → Hybrid: native for perf-critical, WebView for H5      │
  └─────────────────────────────────────────────────────────┘

  ② DUAL-THREAD ARCHITECTURE (双线程) ⭐:
  ┌─────────────────────────────────────────────────────────┐
  │ H5: 1 bundle.js → single thread (main thread)          │
  │                                                         │
  │ Mini-program: 2 threads!                                │
  │ ┌─────────────────┐  ┌─────────────────┐               │
  │ │ Render Thread    │  │ Service Worker  │               │
  │ │ (index.js)       │  │ (index.worker.js│               │
  │ │ → view layer     │  │ → business logic│               │
  │ │ → UI rendering   │  │ → API calls     │               │
  │ │ → WXML/WXSS      │  │ → data process  │               │
  │ └─────────────────┘  └─────────────────┘               │
  │                                                         │
  │ Communication: Native bridge (setData)                  │
  │ → setData serializes data to render thread              │
  │ → Tại sao KHÔNG access DOM? → JS thread ≠ render thread│
  └─────────────────────────────────────────────────────────┘

  ③ WHY NO DOM APIs?
  → Business logic runs in Service Worker thread
  → DOM exists in Render Thread (separate!)
  → No direct access → must use setData bridge
  → This is BY DESIGN: security + performance isolation
```

---

## §8. 0.1 + 0.2 === 0.3? — IEEE 754

```
FLOATING POINT — IEEE 754 EXPLAINED:
═══════════════════════════════════════════════════════════════

  0.1 + 0.2 === 0.30000000000000004  // NOT 0.3!

  ❌ KHÔNG phải lỗi JavaScript!
  → TẤT CẢ ngôn ngữ dùng IEEE 754 đều có vấn đề này
  → Python, Java, C, Ruby... all same!

  IEEE 754 — 64-bit double precision:
  ┌───┬───────────────┬──────────────────────────────────────┐
  │ S │   Exponent    │            Mantissa (Fraction)       │
  │1b │   11 bits     │            52 bits                   │
  └───┴───────────────┴──────────────────────────────────────┘

  3 PRECISION LOSSES:
  ① 0.1 → binary = 0.0001100110011... (infinite repeating!)
     → Truncated to 52 bits → loss ①
  ② 0.2 → binary = 0.0011001100110... (infinite repeating!)
     → Truncated to 52 bits → loss ②
  ③ 0.1 + 0.2 result → may need rounding again → loss ③
```

```javascript
// SOLUTIONS:

// ① Number.EPSILON comparison
function equal(a, b) {
  return Math.abs(a - b) < Number.EPSILON;
}
equal(0.1 + 0.2, 0.3); // true

// ② Integer arithmetic (multiply → calculate → divide)
function add(a, b) {
  const precision = Math.max(
    (String(a).split(".")[1] || "").length,
    (String(b).split(".")[1] || "").length,
  );
  const multiplier = 10 ** precision;
  return (Math.round(a * multiplier) + Math.round(b * multiplier)) / multiplier;
}
add(0.1, 0.2); // 0.3 ✅

// ③ Library: math.js, big.js, bignumber.js
// → Handle arbitrary precision
// → Production recommended!

// EXPANSION: Safe Integer range
// Number.MAX_SAFE_INTEGER = 2^53 - 1 = 9007199254740991
// Beyond this → use BigInt: 9007199254740993n
```

---

## §9. V8 Engine — How JS Executes

```
V8 EXECUTION — STEP BY STEP:
═══════════════════════════════════════════════════════════════

  ① CREATE EXECUTION STACK (Call Stack):
  ┌─────────────────────────────────────────────────────────┐
  │ JS engine tạo execution stack                           │
  └─────────────────────────────────────────────────────────┘

  ② CREATE GLOBAL EXECUTION CONTEXT:
  ┌─────────────────────────────────────────────────────────┐
  │ Push Global EC vào stack                                │
  │ → CREATION phase: allocate memory cho ALL variables     │
  │   → Variables = undefined (HOISTING!)                   │
  │   → Functions = full function body                      │
  │ → EXECUTION phase: assign real values line by line      │
  └─────────────────────────────────────────────────────────┘

  ③ FUNCTION CALL → FUNCTION EC:
  ┌─────────────────────────────────────────────────────────┐
  │ Gặp function call → create Function EC → push to stack │
  │ Same process: creation (hoist) → execution (assign)     │
  │                                                         │
  │ NESTED CALLS:                                           │
  │ parentFn() → childFn() → push child EC on TOP          │
  │ → Child can access parent's variables (scope chain!)    │
  └─────────────────────────────────────────────────────────┘

  ④ CLOSURE CREATION:
  ┌─────────────────────────────────────────────────────────┐
  │ Parent function RETURNS while child still executing     │
  │ → Parent EC removed from stack                          │
  │ → Engine creates CLOSURE for child                      │
  │ → Closure stores parent's variables & values            │
  │ → Child can still access parent's variables!            │
  │                                                         │
  │ After child finishes:                                   │
  │ → Child EC + Closure both removed from stack            │
  └─────────────────────────────────────────────────────────┘

  ⑤ ASYNC CODE → EVENT LOOP:
  ┌─────────────────────────────────────────────────────────┐
  │ JS is SINGLE-THREADED! How handle async?                │
  │                                                         │
  │ setTimeout/fetch → ENGINE removes from call stack       │
  │ → Delegates to Browser API (Web API thread)             │
  │ → When result ready → callback → TASK QUEUE             │
  │ → Call stack EMPTY → event loop → push callback to stack│
  │                                                         │
  │ ┌──────────┐                                            │
  │ │Call Stack │←── Event Loop checks: empty?              │
  │ │          │     YES → take from Task Queue             │
  │ │          │                                            │
  │ └──────────┘                                            │
  │       ↑                                                 │
  │  Task Queue: [cb1, cb2, cb3...]                        │
  │       ↑                                                 │
  │  Microtask Queue: [promise.then, queueMicrotask]       │
  │  (HIGHER PRIORITY! drain before next macrotask)        │
  └─────────────────────────────────────────────────────────┘
```

```
KEY CONCEPTS — PHẢI NẮM VỮNG:
═══════════════════════════════════════════════════════════════

  ① Execution Context: Global EC, Function EC, Eval EC
  ② Scope & Scope Chain: lexical scope → parent → global
  ③ Hoisting: var/function → creation phase, let/const → TDZ
  ④ Closures: function + captured lexical environment
  ⑤ Event Loop: call stack → microtask → macrotask → render
  ⑥ Call Stack: LIFO, push EC on call, pop EC on return

  These 6 concepts = FOUNDATION of JS execution model
  → Hiểu 6 cái này = hiểu TẤT CẢ JS behavior!
```

---

## Tóm Tắt

```
ALIBABA INTERVIEW — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  HTTP/TCP:
  → 1.0: 1 TCP = 1 request | 1.1: persistent | 2.0: multiplex
  → Key: HOL blocking, 6 connections/domain, binary framing

  VIRTUAL DOM:
  → NOT "faster than DOM" → MINIMIZES DOM operations
  → JS↔DOM engine switching cost + batch + diff

  CJS vs ESM:
  → CJS: copy, runtime, dynamic | ESM: reference, compile, static
  → Tree shaking cần ESM static analysis

  AUTH:
  → Cookie: auto-send, CSRF vuln | Session: server-side, scale hard
  → JWT: stateless, scalable, can't revoke

  IMAGE:
  → Photo: JPEG | Transparency: PNG | Animation: GIF
  → Modern: WebP (25-35% smaller) | Next-gen: AVIF (50% smaller)

  TIMING:
  → First screen: LCP, webViewDidFinishLoad
  → White screen: DOM count < threshold, error codes

  MINI-PROGRAM:
  → Dual-thread: render + service worker (KHÔNG access DOM!)
  → Native rendering > WebView | Hybrid approach

  IEEE 754:
  → 3 precision losses | Number.EPSILON | integer arithmetic
  → BigInt for > MAX_SAFE_INTEGER

  V8 ENGINE:
  → EC creation (hoist) → execution (assign) → scope chain
  → Closure: parent returns, child keeps parent's vars
  → Event loop: stack empty → microtask → macrotask
```

### Checklist

- [ ] HTTP/TCP: 1.0 vs 1.1 vs 2.0 vs 3.0 connection behavior
- [ ] HOL blocking: HTTP-level (1.1) vs TCP-level (2.0) vs none (3.0)
- [ ] VDOM: JS↔DOM engine switching cost, NOT "faster than DOM"
- [ ] Diff optimization: same-level, key-based, static hoisting
- [ ] CJS vs ESM: copy vs reference, runtime vs compile, this difference
- [ ] Tree shaking: WHY needs ESM static analysis
- [ ] Cookie/Session/Token: stored where, scalability, security tradeoffs
- [ ] Chrome 80 SameSite=Lax: 3rd-party cookie blocking
- [ ] JWT in HttpOnly cookie: best practice combining both benefits
- [ ] Image format decision tree: photo→JPEG, transparency→PNG, modern→WebP
- [ ] First screen/white screen timing: multiple definitions and methods
- [ ] Mini-program dual-thread: WHY can't access DOM (separate threads!)
- [ ] IEEE 754: 64-bit, 3 precision losses, Number.EPSILON solution
- [ ] BigInt for numbers > MAX_SAFE_INTEGER
- [ ] V8: EC creation (hoist) → execution → scope chain → closure → event loop
- [ ] 6 core concepts: EC, scope, hoisting, closure, event loop, call stack

---

_Nguồn: Alibaba Front-End Team — "Compiled Answers to Front-End Interview Questions"_
_Cập nhật lần cuối: Tháng 2, 2026_
