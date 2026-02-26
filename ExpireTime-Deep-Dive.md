# expireTime — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/expireTime
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. expireTime Là Gì?

```
  expireTime — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Custom stale-while-revalidate EXPIRE TIME! ★★★          │
  │  → Cho CDNs consume trong Cache-Control header! ★           │
  │  → Dùng cho ISR (Incremental Static Regeneration)! ★       │
  │  → Đơn vị: SECONDS! ★                                     │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // next.config.js                                    │    │
  │  │  module.exports = {                                   │    │
  │  │    expireTime: 3600  ← 1 giờ (seconds)! ★★★          │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CACHE-CONTROL HEADER:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  s-maxage=<revalidate>,                                │    │
  │  │  stale-while-revalidate=<expireTime - revalidate>      │    │
  │  │                                                       │    │
  │  │  VÍ DỤ:                                                 │    │
  │  │  revalidate = 900 (15 phút)                            │    │
  │  │  expireTime = 3600 (1 giờ)                             │    │
  │  │  → stale-while-revalidate = 3600 - 900 = 2700! ★★★   │    │
  │  │                                                       │    │
  │  │  HEADER:                                                │    │
  │  │  s-maxage=900, stale-while-revalidate=2700 ★★★         │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Timeline!

```
  TIMELINE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VÍ DỤ: revalidate=900, expireTime=3600                      │
  │                                                              │
  │  t=0          t=900         t=3600                            │
  │  │             │              │                                │
  │  ├─────────────┤              │                                │
  │  │ s-maxage    │              │                                │
  │  │ FRESH! ★   │              │                                │
  │  │ CDN serve   ├──────────────┤                                │
  │  │ directly!   │ stale-while- │                                │
  │  │             │ revalidate   │                                │
  │  │             │ STALE! ★★★  │                                │
  │  │             │ CDN serve    │                                │
  │  │             │ stale +      │                                │
  │  │             │ background   │                                │
  │  │             │ refetch! ★  │ EXPIRED! ★★★                  │
  │  ▼             ▼              ▼ CDN phải fetch mới!           │
  │                                                              │
  │  CÔNG THỨC:                                                    │
  │  stale-while-revalidate = expireTime - revalidate! ★★★     │
  │  → 3600 - 900 = 2700 seconds (45 phút)! ★                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — ExpireTimeEngine!

```javascript
var ExpireTimeEngine = (function () {
  // ═══════════════════════════════════
  // 1. CACHE-CONTROL GENERATOR
  // ═══════════════════════════════════
  function generateCacheControl(revalidate, expireTime) {
    if (!revalidate || revalidate <= 0) {
      return { error: "revalidate phải > 0! ★" };
    }
    if (!expireTime || expireTime <= 0) {
      return { error: "expireTime phải > 0! ★" };
    }
    if (expireTime <= revalidate) {
      return {
        warning: "expireTime nên > revalidate! ★★★",
        staleTime: 0,
      };
    }

    var sMaxAge = revalidate;
    var staleWhileRevalidate = expireTime - revalidate;

    return {
      header:
        "s-maxage=" +
        sMaxAge +
        ", stale-while-revalidate=" +
        staleWhileRevalidate,
      sMaxAge: sMaxAge + "s (" + Math.round(sMaxAge / 60) + " phút)",
      staleWhileRevalidate:
        staleWhileRevalidate +
        "s (" +
        Math.round(staleWhileRevalidate / 60) +
        " phút)",
      totalExpire: expireTime + "s (" + Math.round(expireTime / 60) + " phút)",
      note: "Cache-Control header generated! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 2. TIMELINE SIMULATOR
  // ═══════════════════════════════════
  function simulateRequest(requestTime, revalidate, expireTime) {
    if (requestTime <= revalidate) {
      return {
        time: requestTime + "s",
        phase: "FRESH (s-maxage)",
        action: "CDN serve directly! No origin hit! ★",
      };
    }
    if (requestTime <= expireTime) {
      return {
        time: requestTime + "s",
        phase: "STALE (stale-while-revalidate)",
        action: "CDN serve stale + background refetch! ★★★",
      };
    }
    return {
      time: requestTime + "s",
      phase: "EXPIRED",
      action: "CDN MUST fetch from origin! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ ExpireTime Engine ═══");

    console.log("\n── 1. Cache-Control Header ──");
    console.log("15m/1h:", generateCacheControl(900, 3600));
    console.log("30m/2h:", generateCacheControl(1800, 7200));
    console.log("1h/1d:", generateCacheControl(3600, 86400));

    console.log("\n── 2. Request Simulation (15m revalidate, 1h expire) ──");
    var times = [0, 300, 900, 1800, 3000, 3600, 4000];
    for (var i = 0; i < times.length; i++) {
      console.log(simulateRequest(times[i], 900, 3600));
    }
  }

  return { demo: demo };
})();
// Chạy: ExpireTimeEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: expireTime dùng làm gì?                                 │
  │  → Custom stale-while-revalidate expire cho CDN! ★★★      │
  │  → Ảnh hưởng Cache-Control header! ★                      │
  │  → Cho ISR pages! ★                                        │
  │                                                              │
  │  ❓ 2: Công thức tính?                                         │
  │  → stale-while-revalidate = expireTime - revalidate! ★★★  │
  │  → VD: 3600 - 900 = 2700! ★                                │
  │  → Header: s-maxage=900, stale-while-revalidate=2700! ★   │
  │                                                              │
  │  ❓ 3: s-maxage vs stale-while-revalidate?                     │
  │  → s-maxage: FRESH! CDN serve trực tiếp! ★                │
  │  → stale-while-revalidate: STALE! CDN serve cũ             │
  │    + background refetch! ★★★                               │
  │  → Sau cả hai: CDN PHẢI fetch mới! ★★★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
