# inlineCss — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/inlineCss
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **⚠️ EXPERIMENTAL feature!**

---

## §1. inlineCss Là Gì?

```
  inlineCss — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Inline CSS vào <head> thay vì <link>! ★★★              │
  │  → <link> tag → <style> tag! ★                             │
  │  → Styles đến CÙNG HTML! No extra request! ★★★            │
  │  → ⚠️ EXPERIMENTAL! ★                                       │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  const nextConfig = {                                  │    │
  │  │    experimental: {                                     │    │
  │  │      inlineCss: true  ★★★                              │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TRƯỚC (default — external CSS):                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Browser nhận HTML                                     │    │
  │  │       ↓  parse HTML                                    │    │
  │  │  Tìm thấy <link href="style.css">                     │    │
  │  │       ↓  ⚠️ THÊM 1 request! (render-blocking!) ★★★     │    │
  │  │  Download style.css                                    │    │
  │  │       ↓  parse CSS                                     │    │
  │  │  RENDER! ★                                             │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SAU (inlineCss: true):                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Browser nhận HTML (chứa <style>...</style>)          │    │
  │  │       ↓  parse HTML + CSS cùng lúc! ★★★              │    │
  │  │  RENDER NGAY! ★★★                                     │    │
  │  │  → Không cần extra request! ★★★                      │    │
  │  │  → FCP & LCP cải thiện! ★★★                          │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Trade-Offs — Khi Nào Dùng?

```
  TRADE-OFFS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ✅ NÊN DÙNG khi:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  • First-time visitors nhiều! ★★★                     │    │
  │  │    → CSS render-blocking → inline loại bỏ delay! ★  │    │
  │  │  • FCP/LCP quan trọng! ★★★                           │    │
  │  │    → Bớt network requests! ★                         │    │
  │  │  • Slow connections/high latency! ★                   │    │
  │  │    → Mỗi request thêm delay → inline bớt trips! ★  │    │
  │  │  • Atomic CSS (Tailwind)! ★★★                         │    │
  │  │    → CSS nhỏ! Không bloat HTML! ★                    │    │
  │  │    → Utility classes = compact! ★                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ❌ KHÔNG NÊN khi:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  • Returning visitors nhiều! ★★★                      │    │
  │  │    → Cached external CSS nhanh hơn! ★                │    │
  │  │    → Inline = re-download mỗi lần! ★★★              │    │
  │  │  • Large CSS bundles (Bootstrap, MUI)! ★★★            │    │
  │  │    → Tăng TTFB! HTML nặng! ★★★                      │    │
  │  │    → Không cache riêng CSS được! ★                   │    │
  │  │  • Many pages sharing styles! ★                       │    │
  │  │    → External CSS cache cross-page! ★★★              │    │
  │  │    → Inline = no cross-page benefit! ★               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ KNOWN LIMITATIONS:                                        │
  │  → Global only! Không config per-page! ★                  │
  │  → SSR: duplicate styles (style + RSC payload)! ★          │
  │  → Static pages: dùng <link> thay vì inline! ★            │
  │  → Production only! Không hoạt động dev mode! ★★★        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — InlineCssEngine!

```javascript
var InlineCssEngine = (function () {
  // ═══════════════════════════════════
  // 1. CSS DELIVERY SIMULATOR
  // ═══════════════════════════════════
  function simulateDelivery(cssSize, inline, isFirstVisit, latency) {
    latency = latency || 100; // ms per request

    if (inline) {
      var htmlSize = 5000 + cssSize; // HTML + inline CSS
      return {
        mode: "INLINE (<style>)",
        requests: 1,
        totalSize: htmlSize + " bytes",
        renderDelay: latency + "ms (1 request)",
        cached: false,
        note: isFirstVisit
          ? "FAST for first visit! No CSS request! ★★★"
          : "Re-download CSS every time! ★",
      };
    }

    // External CSS
    if (isFirstVisit) {
      return {
        mode: "EXTERNAL (<link>)",
        requests: 2,
        totalSize: 5000 + cssSize + " bytes",
        renderDelay: latency * 2 + "ms (2 requests: HTML + CSS)",
        cached: false,
        note: "SLOW first visit! CSS render-blocking! ★★★",
      };
    }
    return {
      mode: "EXTERNAL (<link>) — cached!",
      requests: 1,
      totalSize: "5000 bytes (HTML only, CSS cached!)",
      renderDelay: latency + "ms (1 request)",
      cached: true,
      note: "FAST return visit! CSS from cache! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 2. RECOMMENDATION ENGINE
  // ═══════════════════════════════════
  function recommend(cssFramework, returnRate, cssSize) {
    var isAtomic =
      ["tailwind", "unocss", "windicss"].indexOf(cssFramework.toLowerCase()) >=
      0;
    var isSmall = cssSize < 50000; // < 50KB
    var moreNewVisitors = returnRate < 0.5;

    var shouldInline = isAtomic && isSmall && moreNewVisitors;

    return {
      framework: cssFramework,
      cssSize: cssSize + " bytes",
      returnRate: returnRate * 100 + "%",
      isAtomicCSS: isAtomic,
      recommendation: shouldInline ? "INLINE! ★★★" : "EXTERNAL! ★★★",
      reasons: shouldInline
        ? ["Atomic CSS = small!", "More new visitors!", "FCP/LCP boost!"]
        : [
            !isAtomic ? "Non-atomic = potentially large CSS!" : null,
            !isSmall ? "CSS > 50KB = bloats HTML!" : null,
            !moreNewVisitors ? "Return visitors benefit from cache!" : null,
          ].filter(Boolean),
    };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ InlineCss Engine ═══");

    console.log("\n── 1. Delivery Simulation ──");
    console.log("Inline, first:", simulateDelivery(8000, true, true));
    console.log("Inline, return:", simulateDelivery(8000, true, false));
    console.log("External, first:", simulateDelivery(8000, false, true));
    console.log("External, return:", simulateDelivery(8000, false, false));

    console.log("\n── 2. Recommendations ──");
    console.log(recommend("Tailwind", 0.3, 15000));
    console.log(recommend("Bootstrap", 0.7, 200000));
    console.log(recommend("Tailwind", 0.8, 12000));
  }

  return { demo: demo };
})();
// Chạy: InlineCssEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: inlineCss dùng làm gì?                                  │
  │  → Inline CSS vào <style> thay vì <link>! ★★★             │
  │  → Loại bỏ extra CSS request! ★                            │
  │  → Render ngay không cần chờ! ★★★                         │
  │                                                              │
  │  ❓ 2: Trade-offs?                                             │
  │  → PRO: No render-blocking → FCP/LCP tốt! ★★★            │
  │  → CON: Không cache riêng CSS! ★★★                       │
  │  → CON: Return visitors re-download! ★                    │
  │  → CON: Large CSS → tăng TTFB! ★★★                      │
  │                                                              │
  │  ❓ 3: Khi nào dùng?                                           │
  │  → Atomic CSS (Tailwind) + nhiều new visitors! ★★★        │
  │  → KHÔNG dùng: Bootstrap/MUI, returning visitors! ★       │
  │                                                              │
  │  ❓ 4: Limitations?                                            │
  │  → Global only (không per-page)! ★                         │
  │  → Production only (không dev mode)! ★★★                  │
  │  → SSR duplicate styles! ★                                 │
  │  → Static pages dùng <link>! ★                             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
