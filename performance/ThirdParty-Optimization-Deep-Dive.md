# Optimize Loading Third-Parties — Deep Dive

> 📅 2026-02-15 · ⏱ 30 phút đọc
>
> Third-Party Scripts, async/defer, Resource Hints,
> Self-hosting, Service Worker Cache, Facade Pattern,
> Tự viết Third-Party Manager, Script Loader, Partytown-style Worker,
> Next.js Script Component, GTM/Analytics/A-B Testing
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Performance / Loading
>
> _Dựa trên patterns.dev — Addy Osmani, web.dev_

---

## Mục Lục

| #   | Phần                                              |
| --- | ------------------------------------------------- |
| 1   | Third-Party là gì? Tại sao ảnh hưởng performance? |
| 2   | Đánh giá tác động — Lighthouse & WebPageTest      |
| 3   | async vs defer — nền tảng tối ưu                  |
| 4   | Resource Hints cho 3P origins                     |
| 5   | Lazy-load 3P embeds & Facade Pattern              |
| 6   | Self-host 3P scripts                              |
| 7   | Service Worker cache cho 3P                       |
| 8   | Tối ưu theo loại script cụ thể                    |
| 9   | Tự viết Third-Party Script Manager                |
| 10  | Tự viết Mini Partytown (Web Worker Proxy)         |
| 11  | Next.js Script Component                          |
| 12  | Tóm tắt phỏng vấn                                 |

---

## §1. Third-Party là gì?

```
THIRD-PARTY (3P) — TÀI NGUYÊN TỪ DOMAIN KHÁC:
═══════════════════════════════════════════════════════════════

  94%+ websites dùng third-party resources! (Web Almanac 2021)

  CÁC LOẠI 3P PHỔ BIẾN:
  ┌────────────────────────────────────────────────────────┐
  │ ① Embeds:    YouTube, Google Maps, Social Media       │
  │ ② Ads:       Google Ads, Facebook Ads                 │
  │ ③ Analytics: Google Analytics, GTM, Mixpanel          │
  │ ④ A/B Test:  Google Optimize, Optimizely              │
  │ ⑤ Chat:      Intercom, Drift, Zendesk                │
  │ ⑥ Bot:       reCAPTCHA, hCaptcha                      │
  │ ⑦ Fonts:     Google Fonts, Adobe Fonts                │
  │ ⑧ Utils:     jQuery, Lodash, Moment.js                │
  └────────────────────────────────────────────────────────┘

  TẠI SAO CHẬM?
  ┌────────────────────────────────────────────────────────┐
  │ → DNS lookup đến DOMAIN KHÁC! (+50-300ms)             │
  │ → TCP + TLS handshake! (+100-500ms)                   │
  │ → Download JS/CSS/images NẶng!                        │
  │ → Execute JS trên MAIN THREAD → block!                │
  │ → Behavior KHÔNG kiểm soát được!                      │
  │ → BLOCK rendering resources quan trọng!                │
  │                                                        │
  │ VÍ DỤ:                                                │
  │ → YouTube embed: ~800KB JS!                            │
  │ → Intercom chat: ~314KB JS!                            │
  │ → Google reCAPTCHA: ~450KB JS!                         │
  │ → Facebook SDK: ~200KB JS!                             │
  └────────────────────────────────────────────────────────┘

  ẢNH HƯỞNG CORE WEB VITALS:
  ┌────────────────────────────────────────────────────────┐
  │ LCP ← Render-blocking 3P CSS/JS!                      │
  │ FID ← 3P JS execute trên main thread!                 │
  │ CLS ← 3P embeds/ads không có kích thước!              │
  │ INP ← 3P event handlers chặn interaction!             │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Đánh giá tác động

```
LIGHTHOUSE AUDITS:
═══════════════════════════════════════════════════════════════

  3 audits liên quan 3P:
  ┌────────────────────────────────────────────────────────┐
  │ ① "Reduce the impact of third-party code"             │
  │   → Scripts BLOCK main thread bao lâu?                 │
  │   → Transfer size bao nhiêu?                           │
  │   → Liệt kê TỪNG 3P domain + thời gian!              │
  │                                                        │
  │ ② "Reduce JavaScript execution time"                   │
  │   → Scripts nào EXECUTE lâu nhất?                      │
  │   → 3P thường chiếm 30-60% execution time!            │
  │                                                        │
  │ ③ "Avoid enormous network payloads"                    │
  │   → Resources nào NẶNG nhất?                           │
  │   → 3P images/JS thường nằm TOP!                      │
  └────────────────────────────────────────────────────────┘

  WEBPAGETEST:
  ┌────────────────────────────────────────────────────────┐
  │ → Waterfall chart: thấy 3P blocking scripts!           │
  │ → Side-by-side: so sánh CÓ vs KHÔNG 3P!              │
  │ → Block domains: disable 1 3P → đo tác động!          │
  └────────────────────────────────────────────────────────┘

  BUNDLEPHOBIA:
  ┌────────────────────────────────────────────────────────┐
  │ → bundlephobia.com → nhập package name!               │
  │ → Xem: minified size, gzipped size, download time!    │
  │ → Xem: dependencies kéo thêm!                         │
  │ → So sánh alternatives nhẹ hơn!                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. async vs defer — nền tảng tối ưu

```
ASYNC vs DEFER — 2 CÁCH TẢI SCRIPT KHÔNG BLOCK:
═══════════════════════════════════════════════════════════════

  MẶC ĐỊNH (không async/defer):
  ─────────────────────────────────────────────────────
  Parse HTML ━━━┃ STOP! ┃━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                ┃ fetch ┃ execute ┃
                ┃ script┃ script  ┃ Parse tiếp...
  → BLOCK HTML parser hoàn toàn!

  ASYNC:
  ─────────────────────────────────────────────────────
  Parse HTML ━━━━━━━━━━━━┃STOP┃━━━━━━━━━━━━━━━━━━━━━━
                ┃ fetch  ┃exec┃
  → Fetch song song, execute NGAY khi xong → block!
  → DÙNG CHO: scripts cần chạy SỚM (analytics early!)

  DEFER:
  ─────────────────────────────────────────────────────
  Parse HTML ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃          ┃
                ┃ fetch  ┃                 ┃ execute  ┃
  → Fetch song song, execute SAU khi parse XONG!
  → DÙNG CHO: hầu hết 3P scripts (default choice!)

  ⚠️ CAVEAT:
  ┌────────────────────────────────────────────────────┐
  │ → async/defer HẠ PRIORITY của script!              │
  │ → Browser tải MUỘN hơn so với blocking scripts!   │
  │ → Cần script priority CAO nhưng async?             │
  │ → → Dùng Priority Hints: fetchpriority="high"!   │
  │                                                    │
  │ <script async fetchpriority="high"                 │
  │   src="critical-analytics.js"></script>            │
  └────────────────────────────────────────────────────┘

  CASE STUDY — The Telegraph:
  ┌────────────────────────────────────────────────────┐
  │ → Defer TẤT CẢ non-critical scripts!              │
  │ → Analytics/advertising metrics KHÔNG SAI!         │
  │ → First Ad Loaded CẢI THIỆN 4 giây!               │
  └────────────────────────────────────────────────────┘
```

---

## §4. Resource Hints cho 3P origins

```
RESOURCE HINTS — KẾT NỐI SỚM ĐẾN 3P:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: Kết nối 3P domain = CHẬM!
  ┌────────────────────────────────────────────────────┐
  │ DNS lookup:     50-300ms                           │
  │ TCP handshake:  50-200ms                           │
  │ TLS handshake:  50-300ms                           │
  │ ─────────────────────────                          │
  │ TỔNG:           150-800ms TRƯỚC KHI tải resource!  │
  └────────────────────────────────────────────────────┘

  GIẢI PHÁP: dns-prefetch + preconnect!
  ┌────────────────────────────────────────────────────┐
  │ <head>                                             │
  │   <!-- Preconnect cho 3P QUAN TRỌNG NHẤT! -->     │
  │   <link rel="preconnect"                           │
  │     href="https://www.googletagmanager.com" />     │
  │   <link rel="preconnect"                           │
  │     href="https://fonts.googleapis.com" />         │
  │                                                    │
  │   <!-- dns-prefetch = fallback cho preconnect! --> │
  │   <link rel="dns-prefetch"                         │
  │     href="https://www.googletagmanager.com" />     │
  │   <link rel="dns-prefetch"                         │
  │     href="https://connect.facebook.net" />         │
  │ </head>                                            │
  └────────────────────────────────────────────────────┘

  preconnect vs dns-prefetch:
  ┌────────────────┬──────────────────┬────────────────┐
  │                │ preconnect       │ dns-prefetch   │
  ├────────────────┼──────────────────┼────────────────┤
  │ DNS lookup     │ ✅               │ ✅              │
  │ TCP handshake  │ ✅               │ ❌              │
  │ TLS negotiation│ ✅               │ ❌              │
  │ Browser support│ Modern           │ Rộng hơn       │
  │ Dùng cho       │ 3P CRITICAL!     │ 3P phụ         │
  └────────────────┴──────────────────┴────────────────┘

  CASE STUDY:
  → Preconnect đến 3P image CDN → giảm 400ms median!
  → 95th percentile: giảm HƠN 1 GIÂY!
```

---

## §5. Lazy-load 3P Embeds & Facade Pattern

```
LAZY-LOAD EMBEDS:
═══════════════════════════════════════════════════════════════

  3P embeds NẶNG nhưng thường DƯỚI fold!
  → YouTube: ~800KB! Maps: ~600KB! Twitter: ~300KB!
  → User chưa scroll xuống → LÃNG PHÍ!

  3 CÁCH LAZY-LOAD:
  ┌────────────────────────────────────────────────────┐
  │ ① loading="lazy" (browser native!)                 │
  │ <iframe loading="lazy"                             │
  │   src="https://www.youtube.com/embed/..."          │
  │   width="560" height="315">                        │
  │ </iframe>                                          │
  │                                                    │
  │ ② IntersectionObserver (custom!)                   │
  │ → Xem §7 — tự viết!                               │
  │                                                    │
  │ ③ Facade Pattern (tốt nhất!)                       │
  │ → Hiển thị HÌNH ẢNH TĨNH giống embed!             │
  │ → Click → tải embed THẬT!                          │
  │ → Tiết kiệm 100% bandwidth cho user KHÔNG click!  │
  └────────────────────────────────────────────────────┘

  FACADE EXAMPLES:
  ┌────────────────────────────────────────────────────┐
  │ YouTube → lite-youtube-embed (tự viết!)            │
  │ Maps    → Static image (Maps Static API!)          │
  │ Twitter → Tweetpik (screenshot tweet!)             │
  │ Chat    → Fake button (tự viết!)                   │
  └────────────────────────────────────────────────────┘

  ⚠️ CLS — LAYOUT SHIFT!
  ┌────────────────────────────────────────────────────┐
  │ → Lazy-load embed KHÔNG có kích thước → CLS!      │
  │ → FIX: LUÔN set width + height hoặc aspect-ratio! │
  │ → .embed-container { aspect-ratio: 16/9; }        │
  └────────────────────────────────────────────────────┘
```

---

## §6. Self-host 3P scripts

```
SELF-HOST — TỰ LƯU TRỮ 3P SCRIPTS:
═══════════════════════════════════════════════════════════════

  TẠI SAO?
  ┌────────────────────────────────────────────────────┐
  │ → LOẠI BỎ DNS + TCP + TLS cho 3P domain!          │
  │ → KIỂM SOÁT caching strategy (Cache-Control!)     │
  │ → Dùng HTTP/2 server push!                        │
  │ → Không phụ thuộc 3P server availability!          │
  └────────────────────────────────────────────────────┘

  CASE STUDY — Casper.com:
  → Self-host Optimizely script
  → Start render CẢI THIỆN 1.7 GIÂY!

  CÁCH LÀM:
  ┌────────────────────────────────────────────────────┐
  │ ① Download 3P script về server/CDN CỦA BẠN!       │
  │ ② Serve từ CÙNG origin → same connection!         │
  │ ③ Set Cache-Control tối ưu!                        │
  │ ④ Set up cron job CẬP NHẬT script định kỳ!        │
  └────────────────────────────────────────────────────┘

  ⚠️ TRADE-OFFS:
  ┌────────────────────────────────────────────────────┐
  │ → PHẢI cập nhật thường xuyên (script cũ = lỗi!)  │
  │ → Mất edge-caching của 3P CDN!                    │
  │ → Chỉ phù hợp cho scripts ÍT thay đổi!           │
  │ → Scripts thay đổi thường → dùng SW cache!        │
  └────────────────────────────────────────────────────┘
```

---

## §7. Service Worker cache cho 3P

```
SERVICE WORKER — CACHE 3P SCRIPTS:
═══════════════════════════════════════════════════════════════

  Khi self-host KHÔNG phù hợp (script thay đổi thường!)
  → Service Worker = giải pháp!
  → Vẫn dùng 3P CDN + kiểm soát cache!
```

```javascript
// ═══ SERVICE WORKER CHO 3P — TỰ VIẾT ═══

const THIRD_PARTY_CACHE = "3p-cache-v1";

// Danh sách 3P domains cho phép cache!
const CACHEABLE_ORIGINS = [
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://connect.facebook.net",
  "https://platform.twitter.com",
];

// Thời gian cache tối đa (giờ!)
const MAX_AGE_HOURS = 24;

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Chỉ cache 3P trong whitelist!
  const isCacheable = CACHEABLE_ORIGINS.some((origin) =>
    url.href.startsWith(origin),
  );

  if (!isCacheable) return; // Bỏ qua!

  event.respondWith(
    caches.open(THIRD_PARTY_CACHE).then((cache) => {
      return cache.match(event.request).then((cached) => {
        if (cached) {
          // Kiểm tra tuổi cache!
          const dateHeader = cached.headers.get("sw-cache-date");
          if (dateHeader) {
            const age = Date.now() - new Date(dateHeader).getTime();
            const maxAge = MAX_AGE_HOURS * 60 * 60 * 1000;

            if (age < maxAge) {
              console.log("[SW] 3P cache HIT:", url.href);
              return cached; // Cache còn mới → dùng!
            }
          }
        }

        // Cache miss hoặc hết hạn → fetch mới!
        return fetch(event.request).then((response) => {
          if (response.ok) {
            // Clone + thêm timestamp!
            const headers = new Headers(response.headers);
            headers.set("sw-cache-date", new Date().toISOString());

            const cachedResponse = new Response(response.clone().body, {
              status: response.status,
              headers,
            });

            cache.put(event.request, cachedResponse);
            console.log("[SW] 3P cached:", url.href);
          }
          return response;
        });
      });
    }),
  );
});

// Xóa cache cũ khi activate!
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== THIRD_PARTY_CACHE)
          .map((key) => caches.delete(key)),
      );
    }),
  );
});
```

---

## §8. Tối ưu theo loại script cụ thể

```
HƯỚNG DẪN THEO LOẠI 3P:
═══════════════════════════════════════════════════════════════

  ① ANALYTICS / TAG MANAGERS:
  ┌────────────────────────────────────────────────────┐
  │ → DEFER hoặc afterInteractive!                     │
  │ → Telegraph: defer ALL → First Ad +4s!             │
  │ → Metrics KHÔNG bị ảnh hưởng!                     │
  │                                                    │
  │ GTM best practices:                                │
  │ → Site owner SỞ HỮU account (không agency!)       │
  │ → Audit tags thường xuyên, xóa unused!            │
  │ → Không load GTM trên MỌI page!                   │
  │ → Defer GTM scripts!                               │
  │ → Tránh document.write() trong custom HTML tags!  │
  └────────────────────────────────────────────────────┘

  ② reCAPTCHA / BOT DETECTION:
  ┌────────────────────────────────────────────────────┐
  │ → ~450KB JS! Main thread footprint LỚN!           │
  │ → Chỉ load trên PAGES CÓ FORM!                   │
  │ → Lazy load khi user FOCUS vào form!              │
  │ → Preconnect nếu cần load trên page load!         │
  └────────────────────────────────────────────────────┘

  ③ A/B TESTING / PERSONALIZATION:
  ┌────────────────────────────────────────────────────┐
  │ → Mỗi test thêm ~1s loading time!                 │
  │ → Script PHẢI chạy SỚM (UI depends on output!)   │
  │ → Giới hạn users nhận script!                     │
  │ → Lý tưởng: server-side A/B testing!              │
  │ → Google Optimize: rules evaluate trên server!    │
  └────────────────────────────────────────────────────┘

  ④ YOUTUBE / MAP EMBEDS:
  ┌────────────────────────────────────────────────────┐
  │ → Lazy-load hoặc click-to-load!                   │
  │ → Dùng facade (lite-youtube-embed!)                │
  │ → Maps: dùng Static Image API!                    │
  │ → ⚠️ iOS/Safari: cần tap 2 LẦN cho video!        │
  └────────────────────────────────────────────────────┘

  ⑤ SOCIAL MEDIA EMBEDS:
  ┌────────────────────────────────────────────────────┐
  │ → Facebook: data-lazy attribute!                   │
  │ → Twitter: dùng tweetpik facade!                   │
  │ → lazyOnload strategy!                             │
  └────────────────────────────────────────────────────┘

  BẢNG TỔNG HỢP:
  ┌──────────────────┬──────────────┬────────────────────┐
  │ Loại 3P          │ Strategy     │ Technique          │
  ├──────────────────┼──────────────┼────────────────────┤
  │ Analytics/GTM    │ defer/after  │ afterInteractive   │
  │ reCAPTCHA        │ lazy on form │ Lazy + preconnect  │
  │ A/B Testing      │ early/server │ beforeInteractive  │
  │ YouTube/Maps     │ lazy/facade  │ click-to-load      │
  │ Social Media     │ lazy         │ lazyOnload         │
  │ Chat widget      │ lazy/facade  │ onClick load       │
  │ Fonts            │ preload      │ preload+display    │
  │ Ads              │ lazy         │ IntersectionObs    │
  └──────────────────┴──────────────┴────────────────────┘
```

---

## §9. Tự viết Third-Party Script Manager

```javascript
// ═══ THIRD-PARTY SCRIPT MANAGER — TỰ VIẾT TỪ ĐẦU ═══

class ThirdPartyManager {
  constructor() {
    this._scripts = new Map(); // registry
    this._loaded = new Set(); // đã tải
    this._observers = new Map(); // lazy observers
  }

  // ① Đăng ký 3P script với strategy!
  register(id, config) {
    // config = { src, strategy, onLoad, attributes }
    // strategy: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload'
    //         | 'onInteraction' | 'onVisible'
    this._scripts.set(id, {
      src: config.src,
      strategy: config.strategy || "afterInteractive",
      onLoad: config.onLoad || null,
      attributes: config.attributes || {},
      selector: config.selector || null, // cho onVisible
      trigger: config.trigger || null, // cho onInteraction
    });
  }

  // ② Bắt đầu load theo strategy!
  start() {
    this._scripts.forEach((config, id) => {
      switch (config.strategy) {
        case "beforeInteractive":
          this._loadScript(id); // Load NGAY!
          break;

        case "afterInteractive":
          // Sau DOMContentLoaded!
          if (document.readyState !== "loading") {
            this._loadScript(id);
          } else {
            document.addEventListener("DOMContentLoaded", () => {
              this._loadScript(id);
            });
          }
          break;

        case "lazyOnload":
          // Sau window load + requestIdleCallback!
          window.addEventListener("load", () => {
            if ("requestIdleCallback" in window) {
              requestIdleCallback(() => this._loadScript(id));
            } else {
              setTimeout(() => this._loadScript(id), 2000);
            }
          });
          break;

        case "onInteraction":
          this._setupInteractionTrigger(id, config);
          break;

        case "onVisible":
          this._setupVisibilityTrigger(id, config);
          break;
      }
    });
  }

  // ③ Load script!
  _loadScript(id) {
    if (this._loaded.has(id)) return Promise.resolve();
    this._loaded.add(id);

    const config = this._scripts.get(id);
    if (!config) return Promise.reject(`Unknown: ${id}`);

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = config.src;
      script.async = true;

      // Set custom attributes!
      Object.entries(config.attributes).forEach(([key, val]) => {
        script.setAttribute(key, val);
      });

      script.onload = () => {
        console.log(`[3P] Loaded: ${id}`);
        if (config.onLoad) config.onLoad();
        resolve();
      };

      script.onerror = () => {
        this._loaded.delete(id); // Cho phép retry!
        console.error(`[3P] Failed: ${id}`);
        reject(new Error(`Failed to load: ${config.src}`));
      };

      document.head.appendChild(script);
    });
  }

  // ④ Load khi user INTERACT!
  _setupInteractionTrigger(id, config) {
    const events = config.trigger || ["click", "mouseover"];
    const target = config.selector
      ? document.querySelector(config.selector)
      : document;

    if (!target) return;

    const handler = () => {
      events.forEach((evt) => target.removeEventListener(evt, handler));
      // Preconnect trước!
      this._preconnect(config.src);
      this._loadScript(id);
    };

    events.forEach((evt) =>
      target.addEventListener(evt, handler, {
        once: false,
        passive: true,
      }),
    );
  }

  // ⑤ Load khi element VISIBLE!
  _setupVisibilityTrigger(id, config) {
    const target = config.selector
      ? document.querySelector(config.selector)
      : null;

    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.disconnect();
            this._loadScript(id);
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(target);
    this._observers.set(id, observer);
  }

  // ⑥ Preconnect helper!
  _preconnect(src) {
    try {
      const origin = new URL(src).origin;
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = origin;
      document.head.appendChild(link);
    } catch {
      /* ignore */
    }
  }

  // Cleanup
  destroy() {
    this._observers.forEach((obs) => obs.disconnect());
    this._observers.clear();
  }
}

// ═══ SỬ DỤNG ═══
const tpm = new ThirdPartyManager();

tpm.register("gtm", {
  src: "https://www.googletagmanager.com/gtm.js?id=GTM-XXX",
  strategy: "afterInteractive",
  onLoad: () => console.log("GTM ready!"),
});

tpm.register("recaptcha", {
  src: "https://www.google.com/recaptcha/api.js",
  strategy: "onInteraction",
  selector: "#contact-form",
  trigger: ["focus", "click"],
});

tpm.register("youtube", {
  src: "https://www.youtube.com/iframe_api",
  strategy: "onVisible",
  selector: "#video-section",
});

tpm.register("facebook", {
  src: "https://connect.facebook.net/en_US/sdk.js",
  strategy: "lazyOnload",
});

tpm.start();
```

---

## §10. Tự viết Mini Partytown (Web Worker Proxy)

```javascript
// ═══ MINI PARTYTOWN — CHẠY 3P TRÊN WEB WORKER ═══
// Ý tưởng: Main thread cho CODE CỦA BẠN!
// 3P scripts chạy trên WORKER → không block UI!

// ── main.js (Main Thread) ──
class MiniPartytown {
  constructor() {
    this._worker = null;
    this._pendingCalls = new Map();
    this._callId = 0;
  }

  // ① Khởi tạo Worker!
  init() {
    // Tạo worker từ inline code!
    const workerCode = `
      // Web Worker context!
      self.addEventListener('message', async (e) => {
        const { type, id, src, code } = e.data;

        if (type === 'LOAD_SCRIPT') {
          try {
            // importScripts load 3P trong worker!
            importScripts(src);
            self.postMessage({ type: 'LOADED', id, success: true });
          } catch (err) {
            self.postMessage({
              type: 'LOADED', id,
              success: false, error: err.message
            });
          }
        }

        if (type === 'EXEC') {
          try {
            const fn = new Function(code);
            const result = fn();
            self.postMessage({
              type: 'EXEC_RESULT', id, result
            });
          } catch (err) {
            self.postMessage({
              type: 'EXEC_RESULT', id, error: err.message
            });
          }
        }
      });
    `;

    const blob = new Blob([workerCode], { type: "text/javascript" });
    this._worker = new Worker(URL.createObjectURL(blob));

    // Listen for responses!
    this._worker.addEventListener("message", (e) => {
      const { type, id, success, result, error } = e.data;
      const pending = this._pendingCalls.get(id);
      if (!pending) return;

      this._pendingCalls.delete(id);

      if (error || !success) {
        pending.reject(new Error(error || "Unknown error"));
      } else {
        pending.resolve(result);
      }
    });
  }

  // ② Load 3P script trong Worker!
  loadScript(src) {
    const id = ++this._callId;
    return new Promise((resolve, reject) => {
      this._pendingCalls.set(id, { resolve, reject });
      this._worker.postMessage({ type: "LOAD_SCRIPT", id, src });
    });
  }

  // ③ Execute code trong Worker!
  exec(code) {
    const id = ++this._callId;
    return new Promise((resolve, reject) => {
      this._pendingCalls.set(id, { resolve, reject });
      this._worker.postMessage({ type: "EXEC", id, code });
    });
  }

  // Cleanup
  destroy() {
    if (this._worker) {
      this._worker.terminate();
    }
  }
}

// ═══ SỬ DỤNG ═══
const party = new MiniPartytown();
party.init();

// Load analytics trong Worker → KHÔNG BLOCK main thread!
party
  .loadScript("https://example.com/analytics.js")
  .then(() => console.log("Analytics loaded in worker!"))
  .catch((err) => console.error("Failed:", err));
```

```
MINI PARTYTOWN — SƠ ĐỒ:
═══════════════════════════════════════════════════════════════

  MAIN THREAD                    WEB WORKER
  ┌──────────────┐              ┌──────────────┐
  │ Your App Code│              │ 3P Scripts   │
  │ React render │              │ Analytics    │
  │ User events  │ ←postMessage→│ GTM          │
  │ DOM updates  │              │ A/B Testing  │
  └──────────────┘              └──────────────┘
        ↑                              ↑
  KHÔNG BỊ BLOCK!              Chạy TÁCH BIỆT!
  UI MƯỢT MÀ! ✅               Không block UI! ✅

  ⚠️ GIỚI HẠN:
  → Worker KHÔNG có DOM access!
  → 3P scripts cần DOM? → Proxy qua postMessage!
  → Partytown thật dùng JS Proxy + SW để bridge!
  → Mini version chỉ cho scripts KHÔNG cần DOM!
```

---

## §11. Next.js Script Component

```
NEXT.JS SCRIPT COMPONENT — 3 STRATEGIES:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬─────────────────────────────────────┐
  │ beforeInteractive │ Browser execute TRƯỚC page          │
  │                   │ interactive! VD: bot detection,     │
  │                   │ critical polyfills!                 │
  ├──────────────────┼─────────────────────────────────────┤
  │ afterInteractive  │ Browser execute SAU page            │
  │ (DEFAULT!)        │ interactive! = defer!               │
  │                   │ VD: GTM, analytics!                │
  ├──────────────────┼─────────────────────────────────────┤
  │ lazyOnload        │ Execute khi browser NHÀN!           │
  │                   │ VD: social media, chat, low-prio!  │
  └──────────────────┴─────────────────────────────────────┘

  VÍ DỤ SỬ DỤNG:
  ┌────────────────────────────────────────────────────┐
  │ // Polyfill — load SỚM!                           │
  │ <Script                                            │
  │   src="https://polyfill.io/v3/polyfill.min.js"    │
  │   strategy="beforeInteractive"                     │
  │ />                                                 │
  │                                                    │
  │ // GTM — load SAU interactive!                     │
  │ <Script                                            │
  │   strategy="afterInteractive"                      │
  │   dangerouslySetInnerHTML={{ __html: `             │
  │     (function(w,d,s,l,i){...})(                    │
  │       window,document,'script','dataLayer','ID'    │
  │     );                                             │
  │   `}}                                              │
  │ />                                                 │
  │                                                    │
  │ // Facebook SDK — load KHI NHÀN!                   │
  │ <Script                                            │
  │   src="https://connect.facebook.net/sdk.js"        │
  │   strategy="lazyOnload"                            │
  │ />                                                 │
  │                                                    │
  │ // onLoad callback!                                │
  │ <Script                                            │
  │   src={consentUrl}                                 │
  │   strategy="beforeInteractive"                     │
  │   onLoad={() => {                                  │
  │     // Load other scripts after consent!           │
  │   }}                                               │
  │ />                                                 │
  └────────────────────────────────────────────────────┘
```

---

## §12. Tóm tắt phỏng vấn

```
Q&A PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Third-party scripts ảnh hưởng performance thế nào?"
  A: → Extra DNS + TCP + TLS roundtrips!
  → Heavy JS blocking main thread!
  → Ảnh hưởng LCP, FID/INP, CLS!
  → 94%+ sites dùng 3P → vấn đề PHỔ BIẾN!

  Q: "async vs defer cho 3P?"
  A: → defer = default! Fetch parallel, execute SAU parse!
  → async = fetch parallel, execute NGAY → vẫn block!
  → defer TỐT cho hầu hết 3P (analytics, chat...)!
  → async CHỈ khi cần data SỚM (early analytics!)

  Q: "Cách tối ưu reCAPTCHA?"
  A: → ~450KB JS! Rất nặng!
  → Chỉ load trên pages CÓ FORM!
  → Lazy load khi form FOCUS!
  → Preconnect nếu cần on page load!

  Q: "Self-host vs CDN cho 3P?"
  A: → Self-host: loại bỏ DNS roundtrip, ki​ểm soát cache!
  → Casper.com: start render +1.7s!
  → Nhưng: phải update thường xuyên, mất edge cache!
  → Scripts thay đổi thường → Service Worker cache!

  Q: "Partytown làm gì?"
  A: → Chạy 3P scripts trên WEB WORKER!
  → Main thread chỉ cho CODE CỦA BẠN!
  → JS Proxy + SW bridge DOM access!
  → type="text/partytown" trên script tags!

  Q: "Next.js Script component?"
  A: → 3 strategies: before/after/lazy!
  → Encapsulate best practices!
  → afterInteractive = default = defer!
  → lazyOnload = requestIdleCallback!
```

---

### Checklist

- [ ] **Audit 3P**: Lighthouse + WebPageTest + Bundlephobia!
- [ ] **async/defer**: Mọi 3P non-critical đều DEFER!
- [ ] **Resource hints**: preconnect cho critical 3P origins!
- [ ] **Lazy-load embeds**: loading="lazy" hoặc facade!
- [ ] **Facade pattern**: Static image thay cho heavy embeds!
- [ ] **Self-host**: 3P ít thay đổi → lưu cùng origin!
- [ ] **SW cache**: 3P thay đổi thường → cache trong SW!
- [ ] **GTM audit**: Xóa unused tags, giới hạn access!
- [ ] **reCAPTCHA**: Lazy load on form focus!
- [ ] **CLS**: Set width/height cho lazy-loaded embeds!
- [ ] **Partytown**: 3P analytics → Web Worker!
- [ ] **Next.js Script**: Dùng strategy phù hợp!

---

_Nguồn: patterns.dev — Addy Osmani_
_web.dev — "Optimize loading third-parties"_
_Next.js Documentation — Script Component_
_Cập nhật lần cuối: Tháng 2, 2026_
