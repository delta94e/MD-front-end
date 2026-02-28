# useReportWebVitals() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/web-vitals`

---

## §1. useReportWebVitals() Là Gì?

```
  useReportWebVitals() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Hook report Core Web Vitals! ★                           │
  │  → import { useReportWebVitals } from 'next/web-vitals'! ★  │
  │  → Kết hợp với analytics service! ★                         │
  │  → Đo lường performance thực tế (RUM)! ★                   │
  │                                                              │
  │  CÁCH DÙNG CHUẨN:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  // components/web-vitals.tsx                          │    │
  │  │  'use client'                                          │    │
  │  │  import { useReportWebVitals } from 'next/web-vitals'  │    │
  │  │                                                       │    │
  │  │  const logWebVitals = (metric) => {                    │    │
  │  │    console.log(metric)                                │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  export function WebVitals() {                         │    │
  │  │    useReportWebVitals(logWebVitals)                   │    │
  │  │    return null  ← KHÔNG render gì! ★                 │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ CALLBACK REFERENCE PHẢI STABLE! ★★★                      │
  │  → Nếu reference đổi → report DUPLICATE data! ★            │
  │  → Khai báo NGOÀI component! ★                             │
  │  → Hoặc dùng useCallback! ★                                │
  │                                                              │
  │  BEST PRACTICE — TÁCH COMPONENT:                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  // app/layout.tsx (Server Component!)                 │    │
  │  │  import { WebVitals } from './_components/web-vitals'  │    │
  │  │                                                       │    │
  │  │  export default function Layout({ children }) {        │    │
  │  │    return (                                            │    │
  │  │      <html>                                            │    │
  │  │        <body>                                          │    │
  │  │          <WebVitals />  ← import vào root layout! ★   │    │
  │  │          {children}                                    │    │
  │  │        </body>                                         │    │
  │  │      </html>                                           │    │
  │  │    )                                                   │    │
  │  │  }                                                     │    │
  │  │                                                       │    │
  │  │  → Client boundary CHỈ ở WebVitals component! ★      │    │
  │  │  → Root layout vẫn Server Component! ★               │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Metric Object — 7 Properties!

```
  METRIC OBJECT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────────────┬──────────────────────────────────────┐   │
  │  │ Property        │ Mô tả                                │   │
  │  ├────────────────┼──────────────────────────────────────┤   │
  │  │ id              │ Unique ID cho page load hiện tại! ★  │   │
  │  │ name            │ Tên metric (TTFB, FCP, LCP,          │   │
  │  │                 │ FID, CLS, INP)! ★                    │   │
  │  │ delta           │ Chênh lệch value hiện tại vs         │   │
  │  │                 │ trước đó (ms)! ★                     │   │
  │  │ entries         │ Array PerformanceEntry! ★             │   │
  │  │ navigationType  │ 'navigate' | 'reload' |              │   │
  │  │                 │ 'back_forward' | 'prerender'! ★      │   │
  │  │ rating          │ 'good' | 'needs-improvement' |       │   │
  │  │                 │ 'poor'! ★★★                          │   │
  │  │ value           │ Giá trị thực (ms)! ★                 │   │
  │  └────────────────┴──────────────────────────────────────┘   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. 6 Web Vitals Metrics!

```
  WEB VITALS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────┬─────────────────────────┬────────────────────┐   │
  │  │ Metric  │ Tên đầy đủ               │ Đo gì?              │   │
  │  ├────────┼─────────────────────────┼────────────────────┤   │
  │  │ TTFB    │ Time to First Byte      │ Thời gian nhận     │   │
  │  │         │                         │ byte đầu tiên! ★   │   │
  │  │ FCP     │ First Contentful Paint  │ Nội dung đầu tiên  │   │
  │  │         │                         │ hiển thị! ★         │   │
  │  │ LCP     │ Largest Contentful Paint│ Phần tử LỚN NHẤT   │   │
  │  │         │                         │ hiển thị! ★★★       │   │
  │  │ FID     │ First Input Delay       │ Delay phản hồi     │   │
  │  │         │                         │ input đầu tiên! ★  │   │
  │  │ CLS     │ Cumulative Layout Shift │ Tổng layout shift   │   │
  │  │         │                         │ tích lũy! ★★★       │   │
  │  │ INP     │ Interaction to Next     │ Responsiveness      │   │
  │  │         │ Paint                   │ toàn bộ! ★          │   │
  │  └────────┴─────────────────────────┴────────────────────┘   │
  │                                                              │
  │  CORE WEB VITALS (Google dùng xếp hạng SEO):                 │
  │  → LCP (loading) + CLS (visual stability) + INP (interact)  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Gửi Data Ra External Systems!

```
  EXTERNAL SYSTEMS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PATTERN 1: Custom Endpoint + sendBeacon!                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function postWebVitals(metric) {                      │    │
  │  │   const body = JSON.stringify(metric)                 │    │
  │  │   const url = 'https://example.com/analytics'         │    │
  │  │                                                       │    │
  │  │   // sendBeacon → KHÔNG block page unload! ★★★        │    │
  │  │   if (navigator.sendBeacon) {                          │    │
  │  │     navigator.sendBeacon(url, body)                   │    │
  │  │   } else {                                             │    │
  │  │     fetch(url, {                                       │    │
  │  │       body, method: 'POST',                            │    │
  │  │       keepalive: true  ← giữ request alive! ★        │    │
  │  │     })                                                 │    │
  │  │   }                                                    │    │
  │  │ }                                                      │    │
  │  │ useReportWebVitals(postWebVitals)                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PATTERN 2: Google Analytics!                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ useReportWebVitals(metric => {                        │    │
  │  │   window.gtag('event', metric.name, {                 │    │
  │  │     value: Math.round(                                 │    │
  │  │       metric.name === 'CLS'                            │    │
  │  │         ? metric.value * 1000  ← CLS nhân 1000! ★    │    │
  │  │         : metric.value                                │    │
  │  │     ),                                                 │    │
  │  │     event_label: metric.id,                            │    │
  │  │     non_interaction: true,  ← ko ảnh hưởng bounce! ★ │    │
  │  │   })                                                   │    │
  │  │ })                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — WebVitalsEngine!

```javascript
var WebVitalsEngine = (function () {
  // ═══════════════════════════════════
  // 1. WEB VITALS DEFINITIONS
  // ═══════════════════════════════════
  var VITALS = {
    TTFB: { name: "Time to First Byte", good: 800, poor: 1800, unit: "ms" },
    FCP: { name: "First Contentful Paint", good: 1800, poor: 3000, unit: "ms" },
    LCP: {
      name: "Largest Contentful Paint",
      good: 2500,
      poor: 4000,
      unit: "ms",
    },
    FID: { name: "First Input Delay", good: 100, poor: 300, unit: "ms" },
    CLS: { name: "Cumulative Layout Shift", good: 0.1, poor: 0.25, unit: "" },
    INP: {
      name: "Interaction to Next Paint",
      good: 200,
      poor: 500,
      unit: "ms",
    },
  };

  // ═══════════════════════════════════
  // 2. RATING CALCULATOR
  // ═══════════════════════════════════
  function getRating(metricName, value) {
    var def = VITALS[metricName];
    if (!def) return { rating: "unknown", error: "Unknown metric!" };
    if (value <= def.good)
      return { rating: "good", threshold: "<= " + def.good };
    if (value <= def.poor)
      return { rating: "needs-improvement", threshold: "<= " + def.poor };
    return { rating: "poor", threshold: "> " + def.poor };
  }

  // ═══════════════════════════════════
  // 3. METRIC SIMULATOR
  // ═══════════════════════════════════
  var idCounter = 0;
  function createMetric(name, value, navigationType) {
    idCounter++;
    return {
      id: "v1-" + Date.now() + "-" + idCounter,
      name: name,
      value: value,
      delta: value,
      entries: [],
      navigationType: navigationType || "navigate",
      rating: getRating(name, value).rating,
    };
  }

  // ═══════════════════════════════════
  // 4. useReportWebVitals SIMULATOR
  // ═══════════════════════════════════
  var callbackRef = null;
  var reportedMetrics = [];

  function useReportWebVitals(callback) {
    callbackRef = callback;
  }

  function triggerMetric(metric) {
    reportedMetrics.push(metric);
    if (callbackRef) callbackRef(metric);
    return { reported: true, metric: metric };
  }

  // ═══════════════════════════════════
  // 5. SEND BEACON SIMULATOR
  // ═══════════════════════════════════
  function sendToAnalytics(metric, endpoint) {
    var body = JSON.stringify(metric);
    var hasSendBeacon =
      typeof navigator !== "undefined" && navigator.sendBeacon;
    return {
      method: hasSendBeacon ? "sendBeacon" : "fetch+keepalive",
      endpoint: endpoint,
      bodySize: body.length + " bytes",
      note: hasSendBeacon
        ? "sendBeacon → không block unload! ★"
        : "fetch keepalive → fallback! ★",
    };
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ WebVitals Engine ═══");

    console.log("\n── 1. Ratings ──");
    console.log("LCP 2000:", getRating("LCP", 2000));
    console.log("LCP 3500:", getRating("LCP", 3500));
    console.log("LCP 5000:", getRating("LCP", 5000));
    console.log("CLS 0.05:", getRating("CLS", 0.05));
    console.log("CLS 0.3:", getRating("CLS", 0.3));

    console.log("\n── 2. Report ──");
    useReportWebVitals(function (m) {
      console.log("REPORTED:", m.name, m.value, m.rating);
    });
    triggerMetric(createMetric("LCP", 2100, "navigate"));
    triggerMetric(createMetric("CLS", 0.08, "navigate"));
    triggerMetric(createMetric("INP", 350, "reload"));

    console.log("\n── 3. Analytics ──");
    var metric = createMetric("FCP", 1500);
    console.log(sendToAnalytics(metric, "https://example.com/analytics"));
  }

  return { demo: demo };
})();
// Chạy: WebVitalsEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: 6 Web Vitals metrics là gì?                             │
  │  → TTFB (first byte), FCP (first paint), LCP (largest)! ★  │
  │  → FID (first input), CLS (layout shift), INP (interact)!★ │
  │  → Core Web Vitals (SEO): LCP + CLS + INP! ★★★            │
  │                                                              │
  │  ❓ 2: Tại sao tách WebVitals component riêng?                 │
  │  → useReportWebVitals cần 'use client'! ★                   │
  │  → Tách ra → root layout vẫn Server Component! ★           │
  │  → Client boundary CHỈ ở WebVitals! ★                      │
  │                                                              │
  │  ❓ 3: sendBeacon vs fetch?                                    │
  │  → sendBeacon: KHÔNG block page unload! ★★★                │
  │  → fetch keepalive: fallback nếu ko có sendBeacon! ★       │
  │  → sendBeacon ưu tiên hơn! ★                                │
  │                                                              │
  │  ❓ 4: Callback reference phải stable tại sao?                 │
  │  → Reference đổi → hook gọi lại với metrics cũ! ★          │
  │  → Gây DUPLICATE reports! ★★★                              │
  │  → Khai báo NGOÀI component hoặc useCallback! ★            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
