# Thiết kế Data Tracking SDK — Deep Dive

> 📅 2026-02-14 · ⏱ 18 phút đọc
>
> Khái niệm Tracking (Buried Point), Phân loại theo dõi,
> Thiết kế SDK (Data + Performance + Error Monitoring),
> Image Beacon, PV/UV, Custom Events, performance API,
> Error/UnhandledRejection, React/Vue Error Boundaries
> Độ khó: ⭐️⭐️⭐️⭐️ | System Design Interview

---

## Mục Lục

| #   | Phần                                        |
| --- | ------------------------------------------- |
| 1   | Khái niệm Tracking (Buried Point)           |
| 2   | Phân loại Tracking — 3 loại                 |
| 3   | Kiến trúc tổng thể SDK                      |
| 4   | Data Monitoring — Theo dõi dữ liệu          |
| 5   | Performance Monitoring — Theo dõi hiệu năng |
| 6   | Error Monitoring — Theo dõi lỗi             |
| 7   | Image Beacon — Tại sao dùng thẻ img?        |
| 8   | Nâng cao: Batch, Queue, Sampling            |
| 9   | Nâng cao: Auto-tracking & Exposure          |
| 10  | Framework Integration (React/Vue)           |
| 11  | SDK hoàn chỉnh                              |
| 12  | Tóm tắt phỏng vấn                           |

---

## §1. Khái niệm Tracking (Buried Point)

```
TRACKING / BURIED POINT — ĐỊNH NGHĨA:
═══════════════════════════════════════════════════════════════

  "Tracking" (埋点) là thuật ngữ trong lĩnh vực THU THẬP DỮ LIỆU
  hành vi người dùng (User Behavior Analytics).

  → Bao gồm: CAPTURE + PROCESS + TRANSMIT các hành vi hoặc
    sự kiện CỤ THỂ của người dùng!

  VÍ DỤ:
  → Người dùng click icon bao nhiêu lần?
  → Xem video bao lâu?
  → Scroll đến đâu trên trang?
  → Thao tác nào dẫn đến mua hàng?

  BẢN CHẤT KỸ THUẬT:
  → LẮNG NGHE events trong quá trình chạy ứng dụng!
  → ĐÁNH GIÁ + BẮT sự kiện cần theo dõi khi chúng xảy ra!
  → GỬI dữ liệu về server để phân tích!
```

```
VÍ DỤ THỰC TẾ — MUA ĐIỆN THOẠI:
═══════════════════════════════════════════════════════════════

  HÀNH TRÌNH NGƯỜI DÙNG:

  ① Mở App Shopee      ← TRACKING: app_open event!
       │
  ② Tìm kiếm "iPhone"  ← TRACKING: search event (keyword!)
       │
  ③ Chọn model, màu,   ← TRACKING: click events (model, size,
     dung lượng              color → theo dõi SỞ THÍCH!)
       │
  ④ Thanh toán          ← TRACKING: purchase event!

  NẾU người dùng DỪNG ở bước 3 (không mua):
  → Data tracking cho ta biết: user XEM model nào, màu nào!
  → Phân tích: tại sao không mua? Giá cao? Hết hàng?
  → Tối ưu: giảm giá, push notification, gợi ý sản phẩm tương tự!

  VÒNG LẶP (CLOSED LOOP):
  ┌─────────────────────────────────────────────────────────┐
  │  ① MONITOR (thu thập data)                              │
  │       ↓                                                 │
  │  ② ANALYZE (phân tích data)                             │
  │       ↓                                                 │
  │  ③ OPTIMIZE (tối ưu sản phẩm)                           │
  │       ↓                                                 │
  │  ① MONITOR lại (đo hiệu quả tối ưu!)                   │
  └─────────────────────────────────────────────────────────┘
```

---

## §2. Phân loại Tracking — 3 loại

```
3 LOẠI TRACKING:
═══════════════════════════════════════════════════════════════

  ① DISPLAY TRACKING (展现埋点 — Theo dõi HIỂN THỊ):
  ┌────────────────────────────────────────────────────────┐
  │ → Server-side trigger!                                 │
  │ → Ghi lại NỘI DUNG server GỬI ĐẾN client!            │
  │ → Nội dung CHÍNH của trang (không tính UI tương tác!) │
  │                                                        │
  │ VD: Server trả về 20 sản phẩm → tracking ghi lại      │
  │     danh sách 20 sản phẩm đó!                         │
  │                                                        │
  │ CÂU HỎI TRẢ LỜI: "Server đã GỬI gì cho user?"       │
  └────────────────────────────────────────────────────────┘

  ② EXPOSURE TRACKING (曝光埋点 — Theo dõi PHƠI BÀY):
  ┌────────────────────────────────────────────────────────┐
  │ → NỘI DUNG NÀO user THỰC SỰ NHÌN THẤY?              │
  │ → Màn hình có giới hạn ↔ Nội dung KHÔNG giới hạn!    │
  │ → 1 trang 20 sản phẩm → user scroll thấy 8 → ghi 8! │
  │                                                        │
  │ IMPLEMENT: IntersectionObserver API!                   │
  │ → Quan sát khi element XUẤT HIỆN trong viewport!       │
  │ → Đếm thời gian element visible (viewability!)        │
  │                                                        │
  │ CÂU HỎI TRẢ LỜI: "User THỰC SỰ THẤY gì?"           │
  └────────────────────────────────────────────────────────┘

  ③ INTERACTION TRACKING (交互埋点 — Theo dõi TƯƠNG TÁC):
  ┌────────────────────────────────────────────────────────┐
  │ → User đã CLICK / TAP / TƯƠNG TÁC gì?                │
  │ → Downstream của display + exposure!                   │
  │ → Ghi lại "tiêu thụ" dịch vụ!                         │
  │                                                        │
  │ VD:                                                    │
  │ → Click sản phẩm → ghi interaction tracking!           │
  │ → Like video → ghi interaction tracking!               │
  │ → Play/Pause video → ghi consumption tracking!        │
  │ → Submit form → ghi conversion tracking!              │
  │                                                        │
  │ CÂU HỎI TRẢ LỜI: "User đã LÀM GÌ?"                 │
  └────────────────────────────────────────────────────────┘

  PIPELINE:
  Display → Exposure → Interaction
  (gửi gì?) → (thấy gì?) → (làm gì?)
```

---

## §3. Kiến trúc tổng thể SDK

```
SDK ARCHITECTURE — 3 TRỤ CỘT:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │                    TRACKING SDK                         │
  │                                                        │
  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
  │  │    DATA       │ │ PERFORMANCE  │ │   ERROR      │   │
  │  │  MONITORING   │ │  MONITORING  │ │  MONITORING  │   │
  │  │              │ │              │ │              │   │
  │  │ • PV/UV      │ │ • Load time  │ │ • JS errors  │   │
  │  │ • Click      │ │ • TTFB       │ │ • Promise    │   │
  │  │ • Custom     │ │ • FCP/LCP    │ │   rejection  │   │
  │  │   events     │ │ • CLS        │ │ • Resource   │   │
  │  │ • Search     │ │ • FID        │ │   load error │   │
  │  │ • Exposure   │ │ • DNS time   │ │ • API errors │   │
  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘   │
  │         │                │                │            │
  │         └────────────────┼────────────────┘            │
  │                          │                             │
  │                  ┌───────▼───────┐                     │
  │                  │  SEND MODULE  │                     │
  │                  │ (Image Beacon)│                     │
  │                  └───────┬───────┘                     │
  │                          │                             │
  └──────────────────────────┼─────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  ANALYTICS      │
                    │  SERVER         │
                    └─────────────────┘
```

---

## §4. Data Monitoring — Theo dõi dữ liệu

```typescript
// ═══ DATA MONITORING — CỐT LÕI SDK ═══

interface SDKConfig {
  product: string; // Tên sản phẩm (để phân biệt khi nhiều app!)
  url: string; // URL server nhận tracking data!
  appVersion?: string; // Phiên bản app!
  userId?: string; // User ID (nếu đã đăng nhập!)
}

class TrackingSDK {
  private product: string;
  private url: string;
  private appVersion: string;
  private userId: string;

  constructor(config: SDKConfig) {
    this.product = config.product;
    this.url = config.url;
    this.appVersion = config.appVersion || "1.0.0";
    this.userId = config.userId || "";

    // Auto-init:
    this.initPerformance();
    this.initError();
  }

  // ═══ PV (Page View) — Lượt xem trang ═══
  // PV = mỗi lần user TRUY CẬP trang → +1!
  // UV = mỗi USER DUY NHẤT truy cập → +1 (theo ngày!)
  pv() {
    this.event("pv", {
      href: window.location.href,
      referrer: document.referrer,
      title: document.title,
    });
  }

  // ═══ CUSTOM EVENT — Sự kiện tùy chỉnh ═══
  event(key: string, value: any = {}) {
    this.send(this.url, {
      eventType: key,
      eventData: value,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
    });
  }

  // ═══ SEND — Gửi dữ liệu bằng Image Beacon! ═══
  private send(url: string, params: Record<string, any> = {}) {
    // Thêm metadata chung:
    params.product = this.product;
    params.appVersion = this.appVersion;
    params.userId = this.userId;
    params.sessionId = this.getSessionId();

    // Serialize params thành query string:
    const queryString = Object.entries(params)
      .map(([key, val]) => {
        const value =
          typeof val === "object" ? JSON.stringify(val) : String(val);
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join("&");

    const fullUrl = `${url}?${queryString}`;

    // GỬI bằng Image tag! (xem §7 giải thích tại sao!)
    const img = new Image();
    img.src = fullUrl;
  }

  // Session ID — duy nhất mỗi phiên truy cập:
  private getSessionId(): string {
    let sid = sessionStorage.getItem("_tracking_sid");
    if (!sid) {
      sid = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem("_tracking_sid", sid);
    }
    return sid;
  }
}
```

```
PV vs UV:
═══════════════════════════════════════════════════════════════

  PV (Page View):
  → Mỗi lần user TRUY CẬP trang → +1!
  → 1 user truy cập 10 lần → PV = 10!

  UV (Unique Visitor):
  → Mỗi USER DUY NHẤT trong 1 ngày → +1!
  → 1 user truy cập 10 lần → UV = 1!
  → Xác định bằng: cookie, fingerprint, user ID!

  VÍ DỤ:
  → 100 users, mỗi user truy cập 5 lần:
     PV = 500, UV = 100
```

---

## §5. Performance Monitoring — Theo dõi hiệu năng

```typescript
// ═══ PERFORMANCE MONITORING — performance API ═══

class TrackingSDK {
  // ... (phần trước)

  initPerformance() {
    // ĐỢI trang load xong mới lấy performance data!
    window.addEventListener("load", () => {
      // Delay để đảm bảo loadEventEnd có giá trị:
      setTimeout(() => {
        this.collectPerformance();
      }, 0);
    });
  }

  private collectPerformance() {
    const timing = performance.timing;
    const perfData = {
      // ═══ NETWORK TIMING ═══
      // DNS lookup time:
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      // TCP connection time:
      tcp: timing.connectEnd - timing.connectStart,
      // SSL handshake time (HTTPS):
      ssl:
        timing.secureConnectionStart > 0
          ? timing.connectEnd - timing.secureConnectionStart
          : 0,
      // TTFB (Time to First Byte):
      ttfb: timing.responseStart - timing.requestStart,
      // Response download time:
      download: timing.responseEnd - timing.responseStart,

      // ═══ PAGE TIMING ═══
      // DOM parsing time:
      domParse: timing.domInteractive - timing.responseEnd,
      // DOM Content Loaded:
      domContentLoaded:
        timing.domContentLoadedEventEnd - timing.navigationStart,
      // Full page load time:
      pageLoad: timing.loadEventEnd - timing.navigationStart,
      // DOM Ready:
      domReady: timing.domComplete - timing.domLoading,

      // ═══ REDIRECT ═══
      redirect: timing.redirectEnd - timing.redirectStart,
    };

    this.send(this.url + "/performance", perfData);
  }
}
```

```
PERFORMANCE TIMING — PIPELINE:
═══════════════════════════════════════════════════════════════

  navigationStart
       │
  redirectStart ─── redirectEnd
       │
  fetchStart
       │
  domainLookupStart ─── domainLookupEnd    ← DNS!
       │
  connectStart ─── (secureConnectionStart) ─── connectEnd  ← TCP+SSL!
       │
  requestStart ─── responseStart           ← TTFB!
       │                │
       │         responseEnd               ← Download!
       │                │
       │         domLoading
       │                │
       │         domInteractive            ← DOM parsed!
       │                │
       │         domContentLoadedEventStart
       │                │
       │         domContentLoadedEventEnd   ← DCL!
       │                │
       │         domComplete
       │                │
       │         loadEventStart
       │                │
       │         loadEventEnd              ← Full load!
```

```typescript
// ═══ MODERN: Web Vitals (Core Web Vitals) ═══

// performance.timing ĐÃ DEPRECATED! Dùng PerformanceObserver!

private collectWebVitals() {
    // LCP (Largest Contentful Paint):
    new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.event('web_vital', {
            metric: 'LCP',
            value: lastEntry.startTime,
        });
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // FID (First Input Delay):
    new PerformanceObserver((list) => {
        const entry = list.getEntries()[0];
        this.event('web_vital', {
            metric: 'FID',
            value: entry.processingStart - entry.startTime,
        });
    }).observe({ type: 'first-input', buffered: true });

    // CLS (Cumulative Layout Shift):
    let clsValue = 0;
    new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
            }
        }
        this.event('web_vital', { metric: 'CLS', value: clsValue });
    }).observe({ type: 'layout-shift', buffered: true });
}

// CORE WEB VITALS:
// LCP < 2.5s  → TỐT!    (ĐO: tốc độ tải nội dung chính!)
// FID < 100ms → TỐT!    (ĐO: phản hồi tương tác đầu tiên!)
// CLS < 0.1   → TỐT!    (ĐO: ổn định bố cục trang!)
```

---

## §6. Error Monitoring — Theo dõi lỗi

```typescript
// ═══ ERROR MONITORING — 3 LOẠI LỖI ═══

class TrackingSDK {
  // ... (phần trước)

  initError() {
    // ① JS RUNTIME ERRORS:
    window.addEventListener(
      "error",
      (event) => {
        // Phân biệt: JS error vs Resource load error!
        if (event instanceof ErrorEvent) {
          // JS Error!
          this.reportError({
            type: "js_error",
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack || "",
          });
        }
      },
      true,
    ); // true = capture phase! Bắt resource errors!

    // ② RESOURCE LOAD ERRORS (img, script, css...):
    window.addEventListener(
      "error",
      (event) => {
        const target = event.target as HTMLElement;
        if (
          target &&
          (target.tagName === "IMG" ||
            target.tagName === "SCRIPT" ||
            target.tagName === "LINK")
        ) {
          this.reportError({
            type: "resource_error",
            tagName: target.tagName,
            src:
              (target as HTMLImageElement).src ||
              (target as HTMLLinkElement).href ||
              "",
          });
        }
      },
      true,
    ); // PHẢI dùng capture! Vì resource errors KHÔNG bubble!

    // ③ UNHANDLED PROMISE REJECTIONS:
    window.addEventListener("unhandledrejection", (event) => {
      this.reportError({
        type: "unhandled_rejection",
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack || "",
      });
    });
  }

  // GỬI error report:
  reportError(errorInfo: Record<string, any>) {
    this.send(this.url + "/error", {
      ...errorInfo,
      href: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    });
  }
}
```

```
3 LOẠI LỖI CẦN BẮT:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬────────────────────────────────────┐
  │ ① JS Runtime Error │ window.addEventListener('error')   │
  │                    │ → SyntaxError, TypeError,           │
  │                    │   ReferenceError, RangeError...     │
  │                    │ → ErrorEvent có: message, filename, │
  │                    │   lineno, colno, error.stack!       │
  ├────────────────────┼────────────────────────────────────┤
  │ ② Resource Error   │ window.addEventListener('error',    │
  │                    │   fn, TRUE) ← CAPTURE PHASE!        │
  │                    │ → Image, Script, CSS load thất bại! │
  │                    │ → target.tagName + src/href!        │
  │                    │ → ⚠️ Resource errors KHÔNG bubble!  │
  │                    │   PHẢI dùng capture phase!          │
  ├────────────────────┼────────────────────────────────────┤
  │ ③ Promise Rejection│ window.addEventListener(             │
  │                    │   'unhandledrejection')              │
  │                    │ → Promise không có .catch()!        │
  │                    │ → event.reason = error object!      │
  └────────────────────┴────────────────────────────────────┘

  ⚠️ LƯU Ý QUAN TRỌNG:
  → Resource errors KHÔNG bubble lên window!
  → PHẢI dùng addEventListener('error', fn, TRUE) ← capture!
  → Dùng event.target.tagName để phân biệt JS error vs Resource error!
```

---

## §7. Image Beacon — Tại sao dùng thẻ img?

```
TẠI SAO DÙNG <img> TAG ĐỂ GỬI TRACKING?
═══════════════════════════════════════════════════════════════

  LÝ DO 1: KHÔNG BỊ CORS (Cross-Origin)!
  ┌────────────────────────────────────────────────────────┐
  │ → <img> tag KHÔNG bị Same-Origin Policy!               │
  │ → fetch/XMLHttpRequest → CẦN CORS headers!            │
  │ → <img src="https://tracking.com?data=..."> → OK!     │
  │ → Gửi cross-domain KHÔNG CẦN server config!            │
  └────────────────────────────────────────────────────────┘

  LÝ DO 2: TƯƠNG THÍCH TỐT!
  ┌────────────────────────────────────────────────────────┐
  │ → Mọi browser đều hỗ trợ <img> tag!                   │
  │ → Không cần polyfill!                                  │
  │ → Hoạt động cả trên IE cũ!                            │
  └────────────────────────────────────────────────────────┘

  LÝ DO 3: KHÔNG ẢNH HƯỞNG UX!
  ┌────────────────────────────────────────────────────────┐
  │ → new Image() → KHÔNG thêm vào DOM!                   │
  │ → Request ẨN hoàn toàn! User không biết!               │
  │ → Không chặn main thread!                              │
  └────────────────────────────────────────────────────────┘

  LÝ DO 4: ĐƠN GIẢN!
  ┌────────────────────────────────────────────────────────┐
  │ → Chỉ 2 dòng code!                                    │
  │ → const img = new Image();                             │
  │ → img.src = url + '?' + queryString;                   │
  │ → Xong! Browser TỰ ĐỘNG gửi GET request!              │
  └────────────────────────────────────────────────────────┘

  GIỚI HẠN:
  → CHỈ GET method! URL length ~2KB → data hạn chế!
  → Không nhận response data!

  THAY THẾ HIỆN ĐẠI:
  → navigator.sendBeacon(url, data)!
    → KHÔNG block page unload!
    → POST method → data KHÔNG giới hạn!
    → Đảm bảo gửi NGAY CẢ KHI user đóng tab!
```

```javascript
// ═══ SO SÁNH CÁC PHƯƠNG PHÁP GỬI TRACKING ═══

// ① Image Beacon (truyền thống):
const img = new Image();
img.src = `${url}?data=${encodeURIComponent(JSON.stringify(data))}`;
// ⚠️ URL limit ~2KB! Chỉ GET!

// ② navigator.sendBeacon (HIỆN ĐẠI — KHUYẾN KHÍCH!):
navigator.sendBeacon(url, JSON.stringify(data));
// ✅ POST! Không giới hạn data!
// ✅ Gửi async, KHÔNG block page unload!
// ✅ Đảm bảo gửi khi đóng tab/navigate away!

// ③ fetch + keepalive:
fetch(url, {
  method: "POST",
  body: JSON.stringify(data),
  keepalive: true, // ← Giống sendBeacon! Gửi khi page unload!
  headers: { "Content-Type": "application/json" },
});

// ④ XMLHttpRequest (cũ):
const xhr = new XMLHttpRequest();
xhr.open("POST", url);
xhr.send(JSON.stringify(data));
// ⚠️ Có thể bị cancel khi page unload!
```

---

## §8. Nâng cao: Batch, Queue, Sampling

```typescript
// ═══ BATCH SENDING — GỘP NHIỀU EVENTS ═══

class TrackingSDK {
  private queue: any[] = [];
  private batchSize: number = 10;
  private flushInterval: number = 5000; // 5 giây!
  private timer: ReturnType<typeof setTimeout> | null = null;

  // Thêm event vào queue thay vì gửi ngay:
  private enqueue(data: Record<string, any>) {
    this.queue.push({
      ...data,
      timestamp: Date.now(),
    });

    // Đủ batch → gửi ngay!
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      // Chưa đủ → đợi interval rồi gửi!
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  // Gửi tất cả events trong queue:
  private flush() {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Gửi batch bằng sendBeacon (đảm bảo gửi khi close tab!):
    const success = navigator.sendBeacon(
      this.url + "/batch",
      JSON.stringify({
        product: this.product,
        events: batch,
      }),
    );

    // Fallback nếu sendBeacon thất bại:
    if (!success) {
      fetch(this.url + "/batch", {
        method: "POST",
        body: JSON.stringify({ product: this.product, events: batch }),
        keepalive: true,
      }).catch(() => {
        // Lưu vào localStorage để retry sau!
        this.saveToLocalStorage(batch);
      });
    }
  }

  // GỬI khi user RỜI trang:
  private initBeforeUnload() {
    window.addEventListener("beforeunload", () => {
      this.flush(); // Gửi hết queue!
    });

    // Visibility change (mobile: chuyển tab, minimize!):
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flush();
      }
    });
  }

  // Retry từ localStorage:
  private saveToLocalStorage(events: any[]) {
    const stored = JSON.parse(localStorage.getItem("_tracking_retry") || "[]");
    stored.push(...events);
    localStorage.setItem("_tracking_retry", JSON.stringify(stored));
  }
}
```

```
SAMPLING (LẤY MẪU):
═══════════════════════════════════════════════════════════════

  → Không phải LUÔN gửi 100% events!
  → Lượng data QUÁ LỚN → tốn bandwidth + server!
  → Sampling = chỉ gửi X% events!

  IMPLEMENT:
  → this.sampleRate = 0.1;  // 10%!
  → if (Math.random() > this.sampleRate) return; // Skip 90%!

  LƯU Ý:
  → Performance + Error monitoring: 100% (quan trọng!)
  → Click/scroll tracking: có thể sample!
  → PV tracking: thường 100%!
```

---

## §9. Nâng cao: Auto-tracking & Exposure

```typescript
// ═══ AUTO-TRACKING — TỰ ĐỘNG BẮT CLICK ═══

class TrackingSDK {
  // ... (phần trước)

  // Tự động tracking TẤT CẢ clicks (event delegation!):
  initAutoTracking() {
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target as HTMLElement;

        // Tìm element có data-track attribute:
        const trackEl = target.closest("[data-track]");
        if (trackEl) {
          const trackData = trackEl.getAttribute("data-track");
          this.event("click", {
            trackId: trackData,
            tagName: target.tagName,
            text: target.textContent?.slice(0, 50) || "",
            path: this.getDomPath(target),
          });
        }
      },
      true,
    );
  }

  // Tạo CSS-like path cho element:
  private getDomPath(el: HTMLElement): string {
    const path: string[] = [];
    let current: HTMLElement | null = el;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) selector += `#${current.id}`;
      else if (current.className) {
        selector += `.${current.className.split(" ")[0]}`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(" > ");
  }
}

// HTML:
// <button data-track="buy_button">Mua ngay</button>
// → TỰ ĐỘNG tracking khi click! Không cần code thêm!
```

```typescript
// ═══ EXPOSURE TRACKING — IntersectionObserver ═══

class TrackingSDK {
  private exposedSet = new Set<string>(); // Tránh track trùng!

  // Theo dõi element XUẤT HIỆN trong viewport:
  trackExposure(selector: string, eventName: string) {
    const elements = document.querySelectorAll(selector);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const trackId = el.dataset.exposureId || "";

            // CHỈ track 1 lần!
            if (!this.exposedSet.has(trackId)) {
              this.exposedSet.add(trackId);
              this.event(eventName, {
                exposureId: trackId,
                // Visibility ratio:
                ratio: entry.intersectionRatio,
              });
            }
          }
        });
      },
      {
        threshold: 0.5, // 50% visible mới tính!
        // rootMargin: '0px', // Viewport margin!
      },
    );

    elements.forEach((el) => observer.observe(el));
  }
}

// SỬ DỤNG:
// sdk.trackExposure('.product-card', 'product_exposure');
//
// HTML:
// <div class="product-card" data-exposure-id="product_123">
//     iPhone 15 Pro
// </div>
// → Khi user SCROLL đến (50% visible) → auto track!
```

---

## §10. Framework Integration (React/Vue)

```typescript
// ═══ REACT — Error Boundary ═══

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    sdk: TrackingSDK;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // GỬI error tracking!
        this.props.sdk.reportError({
            type: 'react_error',
            message: error.message,
            stack: error.stack || '',
            componentStack: errorInfo.componentStack || '',
        });
    }

    render() {
        if (this.state.hasError) {
            return <h1>Đã xảy ra lỗi!</h1>;
        }
        return this.props.children;
    }
}

// SỬ DỤNG:
// <ErrorBoundary sdk={sdk}>
//     <App />
// </ErrorBoundary>
// → Bắt TẤT CẢ React render errors!
```

```typescript
// ═══ VUE — errorCaptured + errorHandler ═══

// Vue 3:
const app = createApp(App);

// Global error handler:
app.config.errorHandler = (err, instance, info) => {
  sdk.reportError({
    type: "vue_error",
    message: (err as Error).message,
    stack: (err as Error).stack || "",
    info: info, // "setup function" / "render function" etc.
    component: instance?.$options?.name || "Unknown",
  });
};

// Component-level (Composition API):
import { onErrorCaptured } from "vue";

onErrorCaptured((error, instance, info) => {
  sdk.reportError({
    type: "vue_component_error",
    message: error.message,
    component: instance?.$options?.name || "Unknown",
  });
  return false; // Ngăn propagate lên parent!
});
```

---

## §11. SDK hoàn chỉnh

```typescript
// ═══ FULL TRACKING SDK ═══

interface SDKConfig {
  product: string;
  url: string;
  appVersion?: string;
  userId?: string;
  sampleRate?: number; // 0-1, mặc định 1!
  batchSize?: number; // Mặc định 10!
  flushInterval?: number; // ms, mặc định 5000!
  enableAutoTrack?: boolean;
  enablePerformance?: boolean;
  enableError?: boolean;
}

class TrackingSDK {
  private product: string;
  private url: string;
  private appVersion: string;
  private userId: string;
  private sampleRate: number;
  private queue: any[] = [];
  private batchSize: number;
  private flushInterval: number;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: SDKConfig) {
    this.product = config.product;
    this.url = config.url;
    this.appVersion = config.appVersion || "1.0.0";
    this.userId = config.userId || "";
    this.sampleRate = config.sampleRate ?? 1;
    this.batchSize = config.batchSize || 10;
    this.flushInterval = config.flushInterval || 5000;

    if (config.enablePerformance !== false) this.initPerformance();
    if (config.enableError !== false) this.initError();
    if (config.enableAutoTrack) this.initAutoTracking();

    this.initBeforeUnload();
  }

  // PUBLIC API:
  pv() {
    /* PV tracking */
  }
  event(key: string, value?: any) {
    /* Custom event */
  }
  reportError(info: Record<string, any>) {
    /* Error report */
  }
  trackExposure(selector: string, name: string) {
    /* Exposure */
  }
  setUserId(id: string) {
    this.userId = id;
  }

  // PRIVATE:
  private send(url: string, params: any) {
    /* Image/sendBeacon */
  }
  private enqueue(data: any) {
    /* Batch queue */
  }
  private flush() {
    /* Send batch */
  }
  private initPerformance() {
    /* performance API */
  }
  private initError() {
    /* error + unhandledrejection */
  }
  private initAutoTracking() {
    /* click delegation */
  }
  private initBeforeUnload() {
    /* beforeunload + visibilitychange */
  }
}
```

```javascript
// ═══ SỬ DỤNG SDK ═══

// ① KHỞI TẠO — đặt trong DOMContentLoaded hoặc sau load!
window.addEventListener("DOMContentLoaded", () => {
  const sdk = new TrackingSDK({
    product: "my-ecommerce-app",
    url: "https://analytics.mycompany.com/collect",
    appVersion: "2.1.0",
    enableAutoTrack: true,
    enablePerformance: true,
    enableError: true,
    sampleRate: 1, // 100% tracking!
    batchSize: 10,
    flushInterval: 5000,
  });

  // ② PV tracking:
  sdk.pv();

  // ③ Custom events:
  sdk.event("search", { keyword: "iPhone 15", results: 42 });
  sdk.event("add_to_cart", { productId: "P123", price: 29990000 });
  sdk.event("purchase", { orderId: "O456", total: 29990000 });

  // ④ Exposure tracking:
  sdk.trackExposure(".product-card", "product_exposure");

  // ⑤ Set user ID sau khi login:
  sdk.setUserId("user_789");

  // ⑥ Manual error tracking:
  try {
    riskyOperation();
  } catch (e) {
    sdk.reportError({
      type: "custom_error",
      message: e.message,
      context: "riskyOperation in checkout flow",
    });
  }
});
```

---

## §12. Tóm tắt phỏng vấn

```
PHỎNG VẤN — TRẢ LỜI NGẮN GỌN:
═══════════════════════════════════════════════════════════════

  Q: "Thiết kế Frontend Tracking SDK như thế nào?"

  A: Tracking SDK thiết kế theo 3 TRỤ CỘT:

  ① DATA MONITORING:
  → Theo dõi PV (page views), UV (unique visitors)!
  → Custom events (click, search, purchase...)!
  → Auto-tracking bằng event delegation + data-* attributes!
  → Exposure tracking bằng IntersectionObserver!

  ② PERFORMANCE MONITORING:
  → Dùng performance API (performance.timing → PerformanceObserver)!
  → Thu thập: DNS, TCP, TTFB, DOM parse, page load time!
  → Core Web Vitals: LCP, FID, CLS!

  ③ ERROR MONITORING:
  → JS errors: window.addEventListener('error')!
  → Promise rejections: 'unhandledrejection' event!
  → Resource load errors: capture phase!
  → Framework: React ErrorBoundary (componentDidCatch),
    Vue errorHandler/errorCaptured!

  GỬI DATA:
  → Image beacon (<img> tag): tránh CORS, tương thích tốt!
  → navigator.sendBeacon(): HIỆN ĐẠI, đảm bảo gửi khi đóng tab!
  → Batch + Queue: gộp events, gửi theo batch!
  → beforeunload + visibilitychange: flush trước khi rời trang!

  NÂNG CAO:
  → Sampling: gửi X% events để giảm tải!
  → Retry: lưu localStorage khi offline, retry sau!
  → Session tracking: sessionId duy nhất mỗi phiên!
```

---

### Checklist

- [ ] **Tracking 3 loại**: Display (server gửi gì), Exposure (user thấy gì), Interaction (user làm gì)!
- [ ] **SDK 3 trụ cột**: Data monitoring + Performance monitoring + Error monitoring!
- [ ] **PV vs UV**: PV = mỗi lần truy cập; UV = mỗi user duy nhất/ngày!
- [ ] **Image beacon**: `new Image().src = url`; tránh CORS, tương thích tốt, không block UI!
- [ ] **sendBeacon**: `navigator.sendBeacon(url, data)`; POST, async, đảm bảo gửi khi đóng tab!
- [ ] **Performance API**: `performance.timing` (deprecated) → `PerformanceObserver`; Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1!
- [ ] **Error 3 loại**: JS error (`error` event), Resource error (capture phase!), Promise rejection (`unhandledrejection`)!
- [ ] **Resource error**: KHÔNG bubble! Phải dùng `addEventListener('error', fn, true)` — capture phase!
- [ ] **React Error Boundary**: `componentDidCatch(error, errorInfo)` → bắt render errors!
- [ ] **Vue**: `app.config.errorHandler` (global) + `onErrorCaptured` (component-level)!
- [ ] **Batch Queue**: gom events → gửi theo batch (10 events hoặc 5s); flush khi `beforeunload` / `visibilitychange`!
- [ ] **Auto-tracking**: event delegation trên document + `data-track` attribute; DOM path cho element identification!
- [ ] **Exposure**: `IntersectionObserver` + threshold 50%; `Set` để tránh track trùng!
- [ ] **Sampling**: `Math.random() > sampleRate → skip`; Performance/Error = 100%, Click = có thể sample!

---

_Nguồn: 安安稳稳过一生 — "面试官: 如何设计一个埋点SDK" · juejin.cn/post/7080797016086806536_
_Cập nhật lần cuối: Tháng 2, 2026_
