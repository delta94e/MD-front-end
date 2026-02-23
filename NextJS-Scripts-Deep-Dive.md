# Next.js Scripts — Deep Dive!

> **Chủ đề**: Script Component — Load & Optimize 3rd Party Scripts!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/scripts
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — next/script Là Gì?](#1)
2. [§2. Layout Scripts vs Application Scripts](#2)
3. [§3. 4 Loading Strategies!](#3)
4. [§4. Inline Scripts + Event Handlers](#4)
5. [§5. Web Worker — Experimental!](#5)
6. [§6. Additional Attributes](#6)
7. [§7. Tự Viết — ScriptEngine!](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — next/script Là Gì?

```
  next/script — OPTIMIZED SCRIPT LOADING!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  HTML <script>:            next/script <Script>:           │
  │  ┌──────────────┐          ┌──────────────┐                │
  │  │ Blocks render│          │ Strategy     │                │
  │  │ No control   │          │ controlled!  │                │
  │  │ Loads eagerly│          │ Deduplication│                │
  │  │ No dedup     │          │ Event hooks  │                │
  │  │ Manual manage│          │ Auto-optimize│                │
  │  └──────────────┘          └──────────────┘                │
  │  😱 Hurts perf!           ⚡ Optimized!                  │
  │                                                            │
  │  IMPORT:                                                   │
  │  import Script from 'next/script'                          │
  │                                                            │
  │  <Script                                                   │
  │    src="https://example.com/analytics.js"                  │
  │    strategy="afterInteractive"  // ← QUAN TRỌNG!         │
  │    onLoad={() => console.log('loaded!')}                   │
  │  />                                                        │
  │                                                            │
  │  KEY FEATURES:                                             │
  │  ① 4 loading strategies (when to load!)                   │
  │  ② Auto deduplication (load once, dù nhiều routes!)     │
  │  ③ Event handlers (onLoad, onReady, onError!)             │
  │  ④ Inline scripts support!                                │
  │  ⑤ Web Worker offloading (experimental!)                  │
  │  ⑥ Auto-forward DOM attributes (nonce, data-*)!          │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Layout Scripts vs Application Scripts

```
  SCOPE: NƠI ĐẶT <Script> QUYẾT ĐỊNH PHẠM VI!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① LAYOUT SCRIPTS — Multiple Routes!                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // app/dashboard/layout.tsx                          │  │
  │  │ import Script from 'next/script'                     │  │
  │  │                                                      │  │
  │  │ export default function DashboardLayout({ children }) │  │
  │  │ {                                                    │  │
  │  │   return (                                           │  │
  │  │     <>                                               │  │
  │  │       <section>{children}</section>                  │  │
  │  │       <Script src="https://example.com/script.js" /> │  │
  │  │     </>                                              │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Coverage:                                                  │
  │  /dashboard ─────────── ✅ Script loads!                  │
  │  /dashboard/settings ── ✅ Script loads! (nested!)        │
  │  /dashboard/analytics ─ ✅ Script loads! (nested!)        │
  │  /profile ──────────── ❌ KHÔNG load! (outside scope!)   │
  │                                                            │
  │  → Script loads ONCE dù navigate giữa nested routes!    │
  │                                                            │
  │  ② APPLICATION SCRIPTS — ALL Routes!                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // app/layout.tsx (ROOT layout!)                     │  │
  │  │ import Script from 'next/script'                     │  │
  │  │                                                      │  │
  │  │ export default function RootLayout({ children }) {   │  │
  │  │   return (                                           │  │
  │  │     <html lang="en">                                 │  │
  │  │       <body>{children}</body>                        │  │
  │  │       <Script src="https://example.com/script.js" /> │  │
  │  │     </html>                                          │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Coverage:                                                  │
  │  / ─────────── ✅                                         │
  │  /dashboard ── ✅                                         │
  │  /profile ──── ✅                                         │
  │  TẤT CẢ ROUTES! Load ONCE + navigate DEDUP!             │
  │                                                            │
  │  ⚠️ RECOMMENDATION:                                       │
  │  Chỉ include scripts ở pages/layouts CẦN THIẾT!        │
  │  → Minimize perf impact!                                  │
  │  → KHÔNG bỏ tất cả vào root layout nếu không cần!     │
  │                                                            │
  │  SO SÁNH:                                                   │
  │  ┌──────────────────┬──────────────┬───────────────┐       │
  │  │                  │ Layout Script│ App Script    │       │
  │  ├──────────────────┼──────────────┼───────────────┤       │
  │  │ Scope            │ Layout +     │ ALL routes!   │       │
  │  │                  │ nested only  │               │       │
  │  │ Where            │ Specific     │ Root layout!  │       │
  │  │                  │ layout.tsx   │ app/layout.tsx│       │
  │  │ Use case         │ Dashboard    │ Analytics,    │       │
  │  │                  │ analytics    │ global chat   │       │
  │  │ Dedup            │ ✅ YES      │ ✅ YES       │       │
  │  └──────────────────┴──────────────┴───────────────┘       │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. 4 Loading Strategies!

```
  strategy PROP — KHI NÀO LOAD SCRIPT?
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  PAGE LIFECYCLE TIMELINE:                                   │
  │                                                            │
  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
  │  │HTML  │ │Parse │ │Hydra │ │Inter │ │Page  │ │Idle  │  │
  │  │Down- │►│DOM   │►│tion  │►│active│►│Fully │►│Time  │  │
  │  │load  │ │      │ │      │ │      │ │Loaded│ │      │  │
  │  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘  │
  │     │        │        │        │        │        │        │
  │     ▼        │        │        │        │        │        │
  │  ┌──────────────┐     │        │        │        │        │
  │  │ before       │     │        │        │        │        │
  │  │ Interactive  │     │        │        │        │        │
  │  │ (TRƯỚC hết!) │     │        │        │        │        │
  │  └──────────────┘     │        │        │        │        │
  │                       ▼        │        │        │        │
  │                ┌──────────────┐│        │        │        │
  │                │ after        ││        │        │        │
  │                │ Interactive  ││        │        │        │
  │                │ (DEFAULT!)   ││        │        │        │
  │                └──────────────┘│        │        │        │
  │                                │        │        │        │
  │                                │        │        ▼        │
  │                                │        │ ┌────────────┐  │
  │                                │        │ │ lazyOnload │  │
  │                                │        │ │ (Idle time)│  │
  │                                │        │ └────────────┘  │
  │                                │        │                  │
  │                                ▼        │                  │
  │                         ┌────────────┐  │                  │
  │                         │ worker     │  │                  │
  │                         │ (Web Worker│  │                  │
  │                         │ thread!)   │  │                  │
  │                         └────────────┘  │                  │
  │                                                            │
  │  4 STRATEGIES:                                              │
  │  ┌──────────────────┬──────────┬────────────────────────┐  │
  │  │ Strategy         │ When     │ Use Case               │  │
  │  ├──────────────────┼──────────┼────────────────────────┤  │
  │  │ beforeInteractive│ BEFORE   │ Critical scripts!      │  │
  │  │                  │ hydration│ Bot detection,          │  │
  │  │                  │          │ consent managers!       │  │
  │  │ afterInteractive │ AFTER    │ ⭐ DEFAULT!           │  │
  │  │ (default!)       │ some     │ Analytics, tag         │  │
  │  │                  │ hydration│ managers!               │  │
  │  │ lazyOnload       │ Browser  │ Low priority!          │  │
  │  │                  │ IDLE     │ Chat widgets,           │  │
  │  │                  │ time     │ social embeds!          │  │
  │  │ worker           │ Web      │ ⚠️ EXPERIMENTAL!      │  │
  │  │ (experimental)   │ Worker   │ Heavy scripts           │  │
  │  │                  │ thread   │ off main thread!        │  │
  │  └──────────────────┴──────────┴────────────────────────┘  │
  │                                                            │
  │  PERFORMANCE IMPACT:                                        │
  │  beforeInteractive: ⚠️ BLOCKS! Use only if CRITICAL!     │
  │  afterInteractive:  ✅ Balanced! Default cho lý do!      │
  │  lazyOnload:        ⚡ BEST perf! Loads last!             │
  │  worker:            🚀 Off main thread! No blocking!      │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Inline Scripts + Event Handlers

```
  INLINE SCRIPTS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  2 CÁCH VIẾT INLINE:                                      │
  │                                                          │
  │  ① Curly braces (template literal):                      │
  │  <Script id="show-banner">                               │
  │    {`document.getElementById('banner')                   │
  │        .classList.remove('hidden')`}                      │
  │  </Script>                                               │
  │                                                          │
  │  ② dangerouslySetInnerHTML:                              │
  │  <Script                                                 │
  │    id="show-banner"                                      │
  │    dangerouslySetInnerHTML={{                             │
  │      __html: `document.getElementById('banner')          │
  │               .classList.remove('hidden')`,              │
  │    }}                                                    │
  │  />                                                      │
  │                                                          │
  │  ⚠️ id PROP BẮT BUỘC cho inline scripts!               │
  │  → Next.js cần id để track + optimize + dedup!         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  EVENT HANDLERS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  3 EVENT HANDLERS:                                        │
  │  ┌──────────┬──────────────────────────────────────┐     │
  │  │ Handler  │ When fires?                          │     │
  │  ├──────────┼──────────────────────────────────────┤     │
  │  │ onLoad   │ Script finished loading!             │     │
  │  │          │ → Fires ONCE!                       │     │
  │  │ onReady  │ Script loaded + component mounted!   │     │
  │  │          │ → Fires EVERY mount! (re-renders!) │     │
  │  │ onError  │ Script FAILED to load!               │     │
  │  │          │ → Error handling!                   │     │
  │  └──────────┴──────────────────────────────────────┘     │
  │                                                          │
  │  ⚠️ QUAN TRỌNG: CHỈ TRONG CLIENT COMPONENT!            │
  │                                                          │
  │  'use client'   // ← BẮT BUỘC!                         │
  │  import Script from 'next/script'                        │
  │                                                          │
  │  export default function Page() {                        │
  │    return (                                              │
  │      <Script                                             │
  │        src="https://example.com/script.js"               │
  │        onLoad={() => {                                   │
  │          console.log('Script has loaded')                │
  │        }}                                                │
  │        onReady={() => {                                  │
  │          console.log('Script ready + mounted')           │
  │        }}                                                │
  │        onError={(e) => {                                 │
  │          console.error('Script failed!', e)              │
  │        }}                                                │
  │      />                                                  │
  │    )                                                     │
  │  }                                                       │
  │                                                          │
  │  onLoad vs onReady:                                       │
  │  ┌──────────┐   ┌──────────┐   ┌──────────┐             │
  │  │ Script   │   │ onLoad   │   │ Navigate │             │
  │  │ loads!   │──►│ fires!   │   │ away &   │             │
  │  │ (first)  │   │ (ONCE!)  │   │ back!    │             │
  │  └──────────┘   └──────────┘   └────┬─────┘             │
  │                                     │                    │
  │                                     ▼                    │
  │                               ┌──────────┐              │
  │                               │ onReady  │              │
  │                               │ fires!   │              │
  │                               │ (AGAIN!) │              │
  │                               └──────────┘              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Web Worker — Experimental!

```
  strategy="worker" — OFF MAIN THREAD!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  MAIN THREAD:           WEB WORKER THREAD:               │
  │  ┌──────────────┐      ┌──────────────┐                  │
  │  │ Your App     │      │ 3rd Party    │                  │
  │  │ React render │      │ Script runs  │                  │
  │  │ User events  │      │ here instead!│                  │
  │  │ Animations   │      │ (Partytown)  │                  │
  │  │ NOT blocked! │      │              │                  │
  │  └──────────────┘      └──────────────┘                  │
  │  ⚡ Smooth UI!         📦 Isolated!                     │
  │                                                          │
  │  SETUP:                                                   │
  │  ① Enable in next.config.js:                             │
  │     module.exports = {                                   │
  │       experimental: {                                    │
  │         nextScriptWorkers: true,                         │
  │       },                                                 │
  │     }                                                    │
  │                                                          │
  │  ② Run pnpm dev → Next.js sẽ nói cài Partytown:      │
  │     npm install @qwik.dev/partytown                      │
  │                                                          │
  │  ③ Dùng strategy="worker":                              │
  │     <Script                                              │
  │       src="https://example.com/heavy-analytics.js"       │
  │       strategy="worker"                                  │
  │     />                                                   │
  │                                                          │
  │  ⚠️ CẢNH BÁO:                                           │
  │  → EXPERIMENTAL! Chưa stable!                           │
  │  → KHÔNG work với App Router (chưa)!                   │
  │  → Có trade-offs! (DOM access giới hạn, async comms!)  │
  │  → Dùng cẩn thận!                                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Additional Attributes

```
  DOM ATTRIBUTES — AUTO-FORWARDED!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  <Script                                                 │
  │    src="https://example.com/script.js"                   │
  │    id="example-script"                                   │
  │    nonce="XUENAJFW"          // ← CSP nonce!            │
  │    data-test="script"        // ← Custom data attr!     │
  │  />                                                      │
  │                                                          │
  │  OUTPUT HTML:                                             │
  │  <script                                                 │
  │    src="https://example.com/script.js"                   │
  │    id="example-script"                                   │
  │    nonce="XUENAJFW"                                      │
  │    data-test="script"                                    │
  │  ></script>                                              │
  │                                                          │
  │  → Bất kỳ DOM attribute nào cũng tự forward!          │
  │  → nonce: cho Content Security Policy!                  │
  │  → data-*: custom data cho tracking!                    │
  │  → crossorigin, referrerpolicy, etc!                    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — ScriptEngine!

```javascript
var ScriptEngine = (function () {
  // ═══════════════════════════════════
  // 1. STRATEGIES
  // ═══════════════════════════════════
  var BEFORE_INTERACTIVE = "beforeInteractive";
  var AFTER_INTERACTIVE = "afterInteractive";
  var LAZY_ONLOAD = "lazyOnload";
  var WORKER = "worker";

  // ═══════════════════════════════════
  // 2. SCRIPT REGISTRY (deduplication!)
  // ═══════════════════════════════════
  var scripts = {};
  var loadOrder = [];

  function registerScript(config) {
    var id = config.id || config.src;

    // Deduplication!
    if (scripts[id]) {
      return {
        id: id,
        status: "SKIPPED",
        reason: "Already registered! (dedup!)",
      };
    }

    scripts[id] = {
      id: id,
      src: config.src || null,
      inline: config.inline || null,
      strategy: config.strategy || AFTER_INTERACTIVE,
      attributes: config.attributes || {},
      loaded: false,
      error: false,
      handlers: {
        onLoad: config.onLoad || null,
        onReady: config.onReady || null,
        onError: config.onError || null,
      },
    };

    return { id: id, status: "REGISTERED", strategy: scripts[id].strategy };
  }

  // ═══════════════════════════════════
  // 3. LOADING SIMULATOR
  // ═══════════════════════════════════
  function simulateLoad(id) {
    var s = scripts[id];
    if (!s) return { error: "Script not found!" };

    // Simulate loading based on strategy
    var loadTime;
    switch (s.strategy) {
      case BEFORE_INTERACTIVE:
        loadTime = 0; // Before anything else!
        break;
      case AFTER_INTERACTIVE:
        loadTime = 200; // After hydration starts
        break;
      case LAZY_ONLOAD:
        loadTime = 5000; // During idle time
        break;
      case WORKER:
        loadTime = 100; // Off main thread
        break;
      default:
        loadTime = 200;
    }

    s.loaded = true;
    loadOrder.push({ id: id, strategy: s.strategy, at: loadTime });

    // Fire handlers
    var events = [];
    if (s.handlers.onLoad) {
      events.push("onLoad fired!");
    }
    if (s.handlers.onReady) {
      events.push("onReady fired!");
    }

    return {
      id: id,
      strategy: s.strategy,
      loadTime: loadTime + "ms",
      mainThread: s.strategy !== WORKER,
      events: events,
    };
  }

  // ═══════════════════════════════════
  // 4. SCOPE RESOLVER
  // ═══════════════════════════════════
  function resolveScope(scriptId, currentRoute, layoutRoutes) {
    var s = scripts[scriptId];
    if (!s) return { error: "Script not found!" };

    var inScope = false;
    for (var i = 0; i < layoutRoutes.length; i++) {
      if (currentRoute.indexOf(layoutRoutes[i]) === 0) {
        inScope = true;
        break;
      }
    }

    return {
      scriptId: scriptId,
      currentRoute: currentRoute,
      inScope: inScope,
      action: inScope ? "LOAD script!" : "SKIP (out of scope!)",
    };
  }

  // ═══════════════════════════════════
  // 5. INLINE SCRIPT HANDLER
  // ═══════════════════════════════════
  function createInlineScript(id, code) {
    if (!id) return { error: "id is REQUIRED for inline scripts!" };

    return registerScript({
      id: id,
      inline: code,
      strategy: AFTER_INTERACTIVE,
    });
  }

  // ═══════════════════════════════════
  // 6. ATTRIBUTE FORWARDER
  // ═══════════════════════════════════
  function generateScriptTag(id) {
    var s = scripts[id];
    if (!s) return { error: "Script not found!" };

    var attrs = [];
    if (s.src) attrs.push('src="' + s.src + '"');
    if (s.id) attrs.push('id="' + s.id + '"');
    for (var key in s.attributes) {
      attrs.push(key + '="' + s.attributes[key] + '"');
    }

    var tag = "<script " + attrs.join(" ") + ">";
    if (s.inline) tag += s.inline;
    tag += "</script>";

    return tag;
  }

  // ═══════════════════════════════════
  // 7. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  SCRIPT ENGINE DEMO                 ║");
    console.log("╚════════════════════════════════════╝");

    // Register scripts with different strategies
    console.log("\n── Register Scripts ──");
    var scripts_list = [
      { id: "consent", src: "consent.js", strategy: BEFORE_INTERACTIVE },
      {
        id: "analytics",
        src: "analytics.js",
        strategy: AFTER_INTERACTIVE,
        onLoad: function () {},
      },
      { id: "chat", src: "chat-widget.js", strategy: LAZY_ONLOAD },
      { id: "heavy", src: "heavy-tracking.js", strategy: WORKER },
    ];

    for (var i = 0; i < scripts_list.length; i++) {
      var result = registerScript(scripts_list[i]);
      console.log(
        "  " + result.id + ": " + result.status + " (" + result.strategy + ")",
      );
    }

    // Deduplication test
    console.log("\n── Deduplication ──");
    var dup = registerScript({ id: "analytics", src: "analytics.js" });
    console.log("  analytics again: " + dup.status + " — " + dup.reason);

    // Simulate loading
    console.log("\n── Loading Simulation ──");
    var ids = ["consent", "analytics", "chat", "heavy"];
    for (var j = 0; j < ids.length; j++) {
      var loaded = simulateLoad(ids[j]);
      console.log(
        "  " +
          loaded.id +
          ": " +
          loaded.loadTime +
          " (main thread: " +
          loaded.mainThread +
          ")" +
          (loaded.events.length ? " → " + loaded.events.join(", ") : ""),
      );
    }

    // Scope resolution
    console.log("\n── Scope Resolution ──");
    var routes = ["/dashboard", "/dashboard/settings", "/profile"];
    for (var k = 0; k < routes.length; k++) {
      var scope = resolveScope("analytics", routes[k], ["/dashboard"]);
      console.log("  " + scope.currentRoute + ": " + scope.action);
    }

    // Inline script
    console.log("\n── Inline Script ──");
    createInlineScript(
      "show-banner",
      "document.getElementById('banner').classList.remove('hidden')",
    );
    var tag = generateScriptTag("show-banner");
    console.log("  " + tag);

    // Load order
    console.log("\n── Load Order ──");
    loadOrder.sort(function (a, b) {
      return a.at - b.at;
    });
    for (var l = 0; l < loadOrder.length; l++) {
      var o = loadOrder[l];
      console.log("  " + o.at + "ms: " + o.id + " (" + o.strategy + ")");
    }
  }

  return { demo: demo };
})();
// Chạy: ScriptEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: 4 strategies — so sánh và khi nào dùng?

<details><summary>Đáp án</summary>

| Strategy              | When loads?          | Main Thread?     | Use Case                                        |
| --------------------- | -------------------- | ---------------- | ----------------------------------------------- |
| **beforeInteractive** | BEFORE hydration     | ✅ YES (blocks!) | Bot detection, consent mgrs, critical polyfills |
| **afterInteractive**  | After SOME hydration | ✅ YES           | ⭐ **DEFAULT!** Analytics, tag managers         |
| **lazyOnload**        | Browser IDLE time    | ✅ YES           | Chat widgets, social embeds, low priority       |
| **worker**            | Web Worker thread    | ❌ OFF main!     | ⚠️ EXPERIMENTAL! Heavy tracking, non-critical   |

**Performance ranking**: `lazyOnload` ⚡ > `afterInteractive` ✅ > `beforeInteractive` ⚠️
**`worker`** đặc biệt: tốt nhất cho perf (off main thread) nhưng còn experimental!

</details>

---

**Câu 2**: Layout Script vs Application Script — khác gì?

<details><summary>Đáp án</summary>

|              | Layout Script                               | Application Script            |
| ------------ | ------------------------------------------- | ----------------------------- |
| **Đặt ở**    | Specific `layout.tsx` (dashboard, admin...) | Root `app/layout.tsx`         |
| **Scope**    | Layout + nested routes only                 | ALL routes!                   |
| **Dedup**    | ✅ Load once across nested routes           | ✅ Load once across all pages |
| **Use case** | Dashboard-only analytics                    | Global analytics, chat        |

**Recommendation**: Chỉ include scripts ở pages/layouts CẦN THIẾT! Minimize perf impact!

</details>

---

**Câu 3**: onLoad vs onReady — khác gì?

<details><summary>Đáp án</summary>

|                          | onLoad                  | onReady                           |
| ------------------------ | ----------------------- | --------------------------------- |
| **Fires khi**            | Script finished loading | Script loaded + component mounted |
| **Frequency**            | **1 LẦN** duy nhất!     | **MỖI LẦN** component mount!      |
| **Navigate away & back** | KHÔNG fire lại          | CÓ fire lại!                      |
| **Use case**             | Init SDK 1 lần          | Re-init UI widget mỗi mount       |

**Cả 2 đều**: CHỈ work trong **Client Component** (`'use client'`)!

</details>

---

**Câu 4**: Inline scripts — tại sao `id` prop bắt buộc?

<details><summary>Đáp án</summary>

`id` prop bắt buộc để Next.js có thể:

1. **Track** inline script → biết script nào đã load
2. **Optimize** → không inject duplicate scripts
3. **Deduplication** → nếu cùng `id` xuất hiện nhiều lần → chỉ load 1 lần!

```jsx
// ✅ CORRECT — có id!
<Script id="show-banner">
  {`document.getElementById('banner').classList.remove('hidden')`}
</Script>

// ❌ WRONG — thiếu id!
<Script>
  {`document.getElementById('banner').classList.remove('hidden')`}
</Script>
// → Warning: id required for inline scripts!
```

</details>
