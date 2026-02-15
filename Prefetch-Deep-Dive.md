# Prefetch — Performance Pattern Deep Dive

> 📅 2026-02-15 · ⏱ 30 phút đọc
>
> Prefetch vs Preload vs Preconnect, Resource Hints,
> Chrome Priority System, Prefetching Heuristics,
> Tự viết Quicklink từ đầu, Predictive Prefetcher,
> Hover Prefetch, Service Worker Precache, Guess.js,
> What NOT to Prefetch, Double Fetch Pitfalls
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Performance / Network
>
> _Dựa trên patterns.dev, web.dev — Addy Osmani_

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | Prefetch là gì? Tại sao cần?                   |
| 2   | Preload vs Prefetch vs Preconnect              |
| 3   | Chrome Priority System — Bảng ưu tiên          |
| 4   | Caching Behavior — Prefetch trong cache        |
| 5   | Webpack Magic Comments                         |
| 6   | 5 chiến lược Prefetching Heuristics            |
| 7   | Tự viết Quicklink (Prefetch Visible Links)     |
| 8   | Tự viết Hover Prefetcher                       |
| 9   | Tự viết Predictive Prefetcher (Guess.js-style) |
| 10  | What NOT to Prefetch — Các bẫy nguy hiểm       |
| 11  | Double Fetch Pitfalls                          |
| 12  | Tóm tắt phỏng vấn                              |

---

## §1. Prefetch là gì? Tại sao cần?

```
PREFETCH — TẢI TRƯỚC TÀI NGUYÊN TƯƠNG LAI:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: Import On Interaction / Visibility → có DELAY!
  ┌────────────────────────────────────────────────────────┐
  │ User click "Open EmojiPicker"                          │
  │ → import('./EmojiPicker') bắt đầu!                    │
  │ → Fetch chunk từ server...                             │
  │ → Parse + compile...                                   │
  │ → Execute + render!                                    │
  │ → → User PHẢI CHỜ 200-2000ms!                        │
  │ → → Trải nghiệm KHÔNG MƯỢT!                           │
  └────────────────────────────────────────────────────────┘

  GIẢI PHÁP: PREFETCH — tải TRƯỚC khi cần!
  ┌────────────────────────────────────────────────────────┐
  │ Page load xong → browser NHÀN RỖI!                    │
  │ → Prefetch EmojiPicker chunk trong background!         │
  │ → Lưu vào CACHE!                                      │
  │                                                        │
  │ User click "Open EmojiPicker":                         │
  │ → Chunk đã có trong CACHE!                             │
  │ → Lấy từ cache → INSTANT! (~0ms network!)             │
  │ → Chỉ cần parse + execute!                            │
  │ → → Trải nghiệm MƯỢT MÀ!                             │
  └────────────────────────────────────────────────────────┘

  3 CÁCH KHAI BÁO PREFETCH:

  ① HTML:
  <link rel="prefetch" href="/pages/next-page.html" />
  <link rel="prefetch" href="/js/emoji-picker.js" />

  ② HTTP Header:
  Link: </js/chat-widget.js>; rel=prefetch

  ③ JavaScript (dynamic):
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = '/js/emoji-picker.js';
  document.head.appendChild(link);
```

```
PREFETCH TIMELINE:
═══════════════════════════════════════════════════════════════

  KHÔNG CÓ PREFETCH:
  ─────────────────────────────────────────────────────────
  Page load ━━━━━━━┥          User click          │
                    │          ┌─ fetch ──────┐    │
                    │          │  200-2000ms!  │    │
                    │          └──────────────┘    │
                                                   ▼
                                              Component
                                              hiển thị!
                              ← DELAY lâu! →

  CÓ PREFETCH:
  ─────────────────────────────────────────────────────────
  Page load ━━━━━━━┥ prefetch (background)│      │
                    │ ┌─ fetch ─────┐      │      │
                    │ └─ vào cache! ┘      │      │
                    │                      │      │
                    │          User click   │      │
                    │          ┌ cache! ┐   │      │
                    │          └────────┘   │      │
                                           ▼
                                      Component
                                      hiển thị!
                              ← INSTANT! →
```

---

## §2. Preload vs Prefetch vs Preconnect

```
3 RESOURCE HINTS — KHÁC NHAU HOÀN TOÀN:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬─────────────────────────────────────────┐
  │ PRELOAD      │ Tài nguyên cần cho TRANG HIỆN TẠI!     │
  │ rel="preload"│ → Priority CAO!                         │
  │              │ → Tải NGAY, không chờ parser!           │
  │              │ → VD: critical CSS, hero image, font!   │
  │              │ → Chưa dùng sau 3s → Chrome WARNING!   │
  │              │ → KHÔNG persist qua navigation!         │
  ├──────────────┼─────────────────────────────────────────┤
  │ PREFETCH     │ Tài nguyên cần cho TRANG TIẾP THEO!    │
  │rel="prefetch"│ → Priority THẤP!                        │
  │              │ → Tải khi browser NHÀN và đủ bandwidth! │
  │              │ → VD: next route chunk, data!           │
  │              │ → PERSIST qua navigation!               │
  │              │ → Cache ít nhất 5 phút (Chrome!)        │
  ├──────────────┼─────────────────────────────────────────┤
  │ PRECONNECT   │ Thiết lập CONNECTION trước!             │
  │rel="preconnect"│ → DNS + TCP + TLS handshake!          │
  │              │ → KHÔNG tải resource!                   │
  │              │ → VD: CDN, API server, font server!     │
  │              │ → Tiết kiệm 100-500ms!                 │
  └──────────────┴─────────────────────────────────────────┘

  KHI NÀO DÙNG GÌ:
  ┌────────────────────────────────────────────────────────┐
  │ Trang HIỆN TẠI cần → PRELOAD!                         │
  │ → <link rel="preload" href="hero.webp" as="image">   │
  │                                                        │
  │ Trang TIẾP THEO cần → PREFETCH!                       │
  │ → <link rel="prefetch" href="about.chunk.js">        │
  │                                                        │
  │ Cần kết nối đến DOMAIN khác → PRECONNECT!             │
  │ → <link rel="preconnect" href="https://cdn.example">  │
  │                                                        │
  │ ⚠️ KHÔNG dùng prefetch THAY CHO preload!               │
  │ → Mục đích KHÁC NHAU!                                 │
  │ → Dùng sai → DOUBLE FETCH!                            │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Chrome Priority System — Bảng ưu tiên

```
BẢNG ƯU TIÊN TÀI NGUYÊN TRONG CHROME:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────┬──────────────────────────┐
  │ Loại tài nguyên  │ Priority │ Ghi chú                  │
  ├──────────────────┼──────────┼──────────────────────────┤
  │ HTML (main doc)  │ Highest  │ Luôn ưu tiên nhất!       │
  │ CSS (head)       │ Highest  │ Render-blocking!         │
  │ Font (preload)   │ Highest  │ Cần crossorigin!         │
  ├──────────────────┼──────────┼──────────────────────────┤
  │ Script (blocking)│ High     │ Trước first image!       │
  │ Script (blocking)│ Medium   │ Sau first image!         │
  │ Preload (as=*)   │ = as type│ Theo loại resource!      │
  │ Preload (no as)  │ High     │ = async XHR!             │
  ├──────────────────┼──────────┼──────────────────────────┤
  │ Image (viewport) │ Medium   │ Nhìn thấy trên màn hình!│
  │ Script (async)   │ Low      │ Không block render!      │
  │ Script (defer)   │ Low      │ Sau DOMContentLoaded!    │
  ├──────────────────┼──────────┼──────────────────────────┤
  │ Image (offscreen)│ Lowest   │ Ngoài viewport!          │
  │ Prefetch         │ Lowest   │ Tương lai, khi nhàn!     │
  └──────────────────┴──────────┴──────────────────────────┘

  QUAN TRỌNG:
  → Preload as="script" = priority High/Medium (= script!)
  → Preload as="style" = priority Highest (= CSS!)
  → Prefetch = LUÔN Lowest! → Không tranh bandwidth!
  → Preload KHÔNG có "as" = High → LÃNG PHÍ priority!
```

---

## §4. Caching Behavior

```
PREFETCH TRONG CACHE:
═══════════════════════════════════════════════════════════════

  Chrome có 4 LOẠI CACHE:
  ┌────────────────────────────────────────────────────────┐
  │ ① HTTP Cache       (disk cache!)                       │
  │ ② Memory Cache     (RAM — nhanh!)                      │
  │ ③ Service Worker Cache                                 │
  │ ④ Push Cache       (HTTP/2 Push!)                      │
  └────────────────────────────────────────────────────────┘

  LUỒNG PREFETCH:
  ┌────────────────────────────────────────────────────────┐
  │ Network → HTTP Cache → Memory Cache → Renderer        │
  │                                                        │
  │ Cacheable (cache-control valid)?                       │
  │ ├── CÓ → lưu HTTP Cache → dùng HIỆN TẠI + TƯƠNG LAI!│
  │ └── KHÔNG → lưu Memory Cache → chỉ session HIỆN TẠI! │
  └────────────────────────────────────────────────────────┘

  ĐẶC BIỆT CỦA PREFETCH TRONG CHROME:
  ┌────────────────────────────────────────────────────────┐
  │ → User navigate KHỎI trang → prefetch requests        │
  │   TIẾP TỤC (không bị cancel!)                         │
  │ → Prefetch resources lưu trong net-stack cache         │
  │   ÍT NHẤT 5 PHÚT bất kể cache-control!                │
  │ → → Prefetch cho next page: resource SẴN SÀNG!        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Webpack Magic Comments

```javascript
// ═══ WEBPACK PREFETCH — MAGIC COMMENTS ═══

import React, { lazy, Suspense, useReducer } from "react";

// ① webpackPrefetch: true → <link rel="prefetch">!
const EmojiPicker = lazy(
  () =>
    import(
      /* webpackPrefetch: true */
      /* webpackChunkName: "emoji-picker" */
      "./EmojiPicker"
    ),
);

function ChatInput() {
  const [open, toggle] = useReducer((s) => !s, false);

  return (
    <div>
      <input type="text" placeholder="Type a message..." />
      <button onClick={toggle}>😀</button>
      {open && (
        <Suspense fallback={<p>Loading...</p>}>
          <EmojiPicker />
        </Suspense>
      )}
    </div>
  );
}

// BUILD OUTPUT:
//  Asset                             Size       Chunk Names
//  main.bundle.js                    1.34 MiB   main
//  emoji-picker.bundle.js            1.49 KiB   emoji-picker
//  vendors~emoji-picker.bundle.js    171 KiB    vendors~emoji-picker
//
// Entrypoint main = main.bundle.js
// (prefetch: vendors~emoji-picker.bundle.js emoji-picker.bundle.js)
//
// Webpack TỰ ĐỘNG thêm vào <head>:
// <link rel="prefetch" href="emoji-picker.bundle.js" as="script" />
// <link rel="prefetch" href="vendors~emoji-picker.bundle.js" as="script" />
```

```
WEBPACK PREFETCH vs PRELOAD:
═══════════════════════════════════════════════════════════════

  /* webpackPrefetch: true */
  ┌────────────────────────────────────────────────────┐
  │ → <link rel="prefetch"> được thêm SAU parent load!│
  │ → Browser tải khi NHÀN!                            │
  │ → Cho TƯƠNG LAI (khi user navigate/interact!)      │
  └────────────────────────────────────────────────────┘

  /* webpackPreload: true */
  ┌────────────────────────────────────────────────────┐
  │ → <link rel="preload"> tải SONG SONG với parent!  │
  │ → Browser tải NGAY lập tức!                        │
  │ → Cho HIỆN TẠI (cần ngay!)                         │
  └────────────────────────────────────────────────────┘
```

---

## §6. 5 chiến lược Prefetching Heuristics

```
5 CHIẾN LƯỢC PREFETCH:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬─────────┬─────────┬────┬───────┬────────┐
  │ Heuristic    │Accuracy │Network  │CPU │Setup  │Size    │
  ├──────────────┼─────────┼─────────┼────┼───────┼────────┤
  │①Prefetch All │ CAO     │ CAO ❌   │CAO │ Thấp  │ Nhỏ    │
  │②Precaching   │ CAO     │ CAO ❌   │Thấp│ Thấp  │ Nhỏ    │
  │③Quicklink    │ CAO     │ TB      │TB  │ Thấp  │ Nhỏ/TB │
  │④Hover        │ TB      │ THẤP ✅ │Thấp│ Thấp  │ Nhỏ/TB │
  │⑤Predictive   │ CAO     │ THẤP ✅ │Thấp│ CAO   │ TB/Lớn │
  └──────────────┴─────────┴─────────┴────┴───────┴────────┘

  ① PREFETCH ALL:
  ┌────────────────────────────────────────────────────┐
  │ → Tải TẤT CẢ lazy chunks ngay lập tức!            │
  │ → Accuracy: CAO (tải hết thì chắc chắn có!)       │
  │ → Network: CAO → lãng phí bandwidth!               │
  │ → VD: Angular PreloadAllModules!                   │
  │ → OK cho app nhỏ (< 12 routes!)                   │
  │ → ❌ App lớn: hàng trăm routes = hàng MB!          │
  └────────────────────────────────────────────────────┘

  ② PRECACHING (Service Worker):
  ┌────────────────────────────────────────────────────┐
  │ → SW tải + cache TẤT CẢ static assets!            │
  │ → Chạy NGOÀI main thread → CPU thấp!              │
  │ → Network vẫn CAO nhưng không block UI!            │
  │ → VD: Angular Service Worker, Workbox!             │
  └────────────────────────────────────────────────────┘

  ③ QUICKLINK (Prefetch Visible Links):
  ┌────────────────────────────────────────────────────┐
  │ → Chỉ prefetch links ĐANG NHÌN THẤY trên viewport!│
  │ → IntersectionObserver theo dõi <a> tags!          │
  │ → Link vào viewport → prefetch href!              │
  │ → Network: TRUNG BÌNH!                            │
  │ → → Section §7 — TỰ VIẾT!                        │
  └────────────────────────────────────────────────────┘

  ④ HOVER PREFETCH:
  ┌────────────────────────────────────────────────────┐
  │ → User HOVER link → prefetch!                      │
  │ → Thời gian hover → click: 50-400ms!              │
  │ → Đủ thời gian bắt đầu tải!                       │
  │ → Network: RẤT THẤP (chỉ tải khi hover!)         │
  │ → VD: instant.page!                                │
  │ → → Section §8 — TỰ VIẾT!                        │
  └────────────────────────────────────────────────────┘

  ⑤ PREDICTIVE PREFETCH:
  ┌────────────────────────────────────────────────────┐
  │ → Phân tích navigational patterns (analytics!)     │
  │ → Dự đoán user SẼ ĐI ĐÂU tiếp theo!             │
  │ → Chỉ prefetch pages có XÁC SUẤT CAO!             │
  │ → VD: Guess.js + Google Analytics!                 │
  │ → Setup phức tạp nhưng HIỆU QUẢ NHẤT!            │
  │ → → Section §9 — TỰ VIẾT!                        │
  └────────────────────────────────────────────────────┘
```

---

## §7. Tự viết Quicklink (Prefetch Visible Links)

```javascript
// ═══ QUICKLINK — TỰ VIẾT TỪ ĐẦU ═══
// Prefetch links ĐANG HIỂN THỊ trên viewport!

class Quicklink {
  constructor(options = {}) {
    this._prefetched = new Set();
    this._observer = null;

    // Cấu hình
    this._options = {
      // Chỉ prefetch cùng origin (tránh cross-origin!)
      origins: [location.hostname],
      // Timeout cho IntersectionObserver
      timeout: 2000,
      // Giới hạn số lượng prefetch đồng thời
      limit: 10,
      // Chỉ prefetch khi mạng tốt
      ignoreSlowConnection: true,
      ...options,
    };

    this._count = 0;
  }

  // ① Kiểm tra mạng — không prefetch khi CHẬM!
  _isSlowConnection() {
    if (!this._options.ignoreSlowConnection) return false;

    const conn = navigator.connection;
    if (!conn) return false;

    // Slow = 2G hoặc save-data ON!
    return conn.saveData || /2g/.test(conn.effectiveType);
  }

  // ② Kiểm tra URL hợp lệ để prefetch
  _isValidUrl(url) {
    // Đã prefetch → skip!
    if (this._prefetched.has(url)) return false;

    // Quá limit → skip!
    if (this._count >= this._options.limit) return false;

    try {
      const parsed = new URL(url, location.href);

      // Chỉ http/https!
      if (!/^https?:$/.test(parsed.protocol)) return false;

      // Kiểm tra origin!
      if (this._options.origins.length > 0) {
        if (!this._options.origins.includes(parsed.hostname)) {
          return false;
        }
      }

      // Tránh URL hiện tại!
      if (parsed.href === location.href) return false;

      // Tránh hash-only links!
      if (parsed.pathname === location.pathname && parsed.hash) return false;

      return true;
    } catch {
      return false;
    }
  }

  // ③ Thực hiện prefetch!
  _prefetch(url) {
    if (this._prefetched.has(url)) return;
    this._prefetched.add(url);
    this._count++;

    // Prefer <link rel="prefetch"> (native!)
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = "document"; // Prefetch page!
    document.head.appendChild(link);

    console.log(`[Quicklink] Prefetch: ${url}`);
  }

  // ④ Observe tất cả <a> tags!
  observe(root = document) {
    if (this._isSlowConnection()) {
      console.log("[Quicklink] Slow connection, skipping!");
      return;
    }

    // Tạo IntersectionObserver!
    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const link = entry.target;
          const href = link.href;

          if (this._isValidUrl(href)) {
            // Dùng requestIdleCallback → prefetch khi NHÀN!
            if ("requestIdleCallback" in window) {
              requestIdleCallback(() => this._prefetch(href), {
                timeout: this._options.timeout,
              });
            } else {
              this._prefetch(href);
            }
          }

          // Unobserve — chỉ prefetch 1 lần!
          this._observer.unobserve(link);
        });
      },
      { threshold: 0 }, // Bất kỳ phần nào visible!
    );

    // Observe tất cả <a> tags có href!
    const links = root.querySelectorAll("a[href]");
    links.forEach((link) => this._observer.observe(link));

    console.log(`[Quicklink] Observing ${links.length} links`);
  }

  // ⑤ Cleanup
  destroy() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }
}

// ═══ SỬ DỤNG ═══
const quicklink = new Quicklink({
  origins: [location.hostname], // Chỉ same-origin!
  limit: 10, // Tối đa 10 prefetch!
});

// Observe sau khi page load xong (không block render!)
window.addEventListener("load", () => {
  quicklink.observe();
});
```

```
GIẢI THÍCH QUICKLINK:
═══════════════════════════════════════════════════════════════

  LUỒNG HOẠT ĐỘNG:
  ┌────────────────────────────────────────────────────┐
  │ ① Page load xong → observe() được gọi!            │
  │ ② Tìm TẤT CẢ <a> tags → observe chúng!          │
  │ ③ IntersectionObserver theo dõi visibility!        │
  │ ④ Link XUẤT HIỆN trên viewport:                   │
  │    → Kiểm tra: cùng origin? chưa prefetch?        │
  │    → Kiểm tra: mạng không chậm? chưa quá limit?  │
  │    → requestIdleCallback → prefetch khi browser   │
  │      NHÀN RỖI!                                     │
  │ ⑤ Tạo <link rel="prefetch"> → browser tải!       │
  │ ⑥ Unobserve link (chỉ prefetch 1 lần!)           │
  └────────────────────────────────────────────────────┘

  TẠI SAO requestIdleCallback?
  → Prefetch có priority THẤP!
  → Chỉ tải khi browser KHÔNG BẬN!
  → Không ảnh hưởng user interaction!
  → Không gây frame drops!
```

---

## §8. Tự viết Hover Prefetcher

```javascript
// ═══ HOVER PREFETCHER — TỰ VIẾT (à la instant.page) ═══

class HoverPrefetcher {
  constructor(options = {}) {
    this._prefetched = new Set();
    this._hoverTimeout = null;

    this._options = {
      // Delay trước khi prefetch (ms)
      delay: 65,
      // Chỉ same-origin
      allowExternalLinks: false,
      // Hỗ trợ touch devices
      enableTouch: true,
      ...options,
    };

    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
  }

  // ① Bắt đầu listen!
  start() {
    // Mouse hover
    document.addEventListener("mouseover", this._onMouseEnter, {
      capture: true,
      passive: true,
    });

    // Touch (mobile!)
    if (this._options.enableTouch) {
      document.addEventListener("touchstart", this._onTouchStart, {
        capture: true,
        passive: true,
      });
    }
  }

  // ② Mouse enter → chờ delay → prefetch!
  _onMouseEnter(event) {
    const link = this._findLink(event.target);
    if (!link) return;

    const href = link.href;
    if (!this._isValidUrl(href)) return;

    // Thêm preconnect NGAY khi hover!
    this._preconnect(href);

    // Chờ delay → nếu vẫn hover → prefetch!
    this._hoverTimeout = setTimeout(() => {
      this._prefetch(href);
    }, this._options.delay);

    // Mouse leave → cancel!
    link.addEventListener("mouseleave", this._onMouseLeave, {
      once: true,
      passive: true,
    });
  }

  // ③ Mouse leave → CANCEL prefetch!
  _onMouseLeave() {
    if (this._hoverTimeout) {
      clearTimeout(this._hoverTimeout);
      this._hoverTimeout = null;
    }
  }

  // ④ Touch start → prefetch NGAY!
  _onTouchStart(event) {
    const link = this._findLink(event.target);
    if (!link) return;

    const href = link.href;
    if (this._isValidUrl(href)) {
      this._prefetch(href);
    }
  }

  // ⑤ Tìm <a> tag gần nhất
  _findLink(element) {
    return element.closest("a[href]");
  }

  // ⑥ Kiểm tra URL hợp lệ
  _isValidUrl(url) {
    if (this._prefetched.has(url)) return false;

    try {
      const parsed = new URL(url);

      if (!/^https?:$/.test(parsed.protocol)) return false;

      if (
        !this._options.allowExternalLinks &&
        parsed.hostname !== location.hostname
      ) {
        return false;
      }

      if (parsed.href === location.href) return false;

      return true;
    } catch {
      return false;
    }
  }

  // ⑦ Preconnect → thiết lập connection TRƯỚC!
  _preconnect(url) {
    try {
      const origin = new URL(url).origin;
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = origin;
      document.head.appendChild(link);
    } catch {
      /* ignore */
    }
  }

  // ⑧ Prefetch resource
  _prefetch(url) {
    if (this._prefetched.has(url)) return;
    this._prefetched.add(url);

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.appendChild(link);

    console.log(`[Hover] Prefetched: ${url}`);
  }

  // Cleanup
  destroy() {
    document.removeEventListener("mouseover", this._onMouseEnter);
    document.removeEventListener("touchstart", this._onTouchStart);
  }
}

// ═══ SỬ DỤNG ═══
const hoverPrefetch = new HoverPrefetcher({ delay: 65 });

window.addEventListener("load", () => {
  hoverPrefetch.start();
});
```

```
HOVER PREFETCH — TIMELINE:
═══════════════════════════════════════════════════════════════

  User di chuột qua link:
  ─────────────────────────────────────────────────────
  hover ──→ 65ms delay ──→ prefetch! ──→ click!
  │          (vẫn hover?)   (tải chunk)   (từ cache!)
  │
  ├─ Nếu rời chuột TRƯỚC 65ms → CANCEL! (không tải!)
  └─ Nếu ở lại → prefetch → sẵn sàng khi click!

  THỜI GIAN THỰC TẾ:
  → Hover → click trung bình: 200-400ms!
  → 65ms delay chờ → 135-335ms tải chunk!
  → Đủ thời gian cho chunk nhỏ-vừa!
  → → User CẢM NHẬN: click = INSTANT!
```

---

## §9. Tự viết Predictive Prefetcher (Guess.js-style)

```javascript
// ═══ PREDICTIVE PREFETCHER — TỰ VIẾT ═══
// Dựa trên Markov Chain (như Guess.js!)

class PredictivePrefetcher {
  constructor(options = {}) {
    this._prefetched = new Set();
    this._options = {
      threshold: 0.3, // Xác suất tối thiểu để prefetch!
      maxPrefetch: 3, // Tối đa 3 prefetch!
      ...options,
    };

    // Transition matrix: P(next | current)
    // Dữ liệu từ analytics → build time inject!
    this._transitions = {};
  }

  // ① Load transition data (từ analytics!)
  loadTransitions(data) {
    // data = {
    //   '/home': { '/about': 0.6, '/products': 0.3, '/cart': 0.1 },
    //   '/about': { '/home': 0.4, '/contact': 0.5, '/blog': 0.1 },
    //   '/products': { '/cart': 0.7, '/home': 0.2, '/about': 0.1 },
    // }
    this._transitions = data;
  }

  // ② Dự đoán pages tiếp theo!
  predict(currentPath) {
    const transitions = this._transitions[currentPath];
    if (!transitions) return [];

    // Sắp xếp theo xác suất GIẢM DẦN!
    return Object.entries(transitions)
      .sort(([, a], [, b]) => b - a)
      .filter(([, prob]) => prob >= this._options.threshold)
      .slice(0, this._options.maxPrefetch)
      .map(([path, prob]) => ({ path, probability: prob }));
  }

  // ③ Prefetch predicted pages!
  prefetchPredictions(currentPath, chunkMap) {
    const predictions = this.predict(currentPath);

    if (predictions.length === 0) {
      console.log("[Predict] No confident predictions");
      return;
    }

    // Kiểm tra mạng!
    const conn = navigator.connection;
    const isSlowNetwork =
      conn && (conn.saveData || /2g/.test(conn.effectiveType));

    predictions.forEach(({ path, probability }) => {
      // Mạng chậm → chỉ prefetch xác suất RẤT CAO!
      if (isSlowNetwork && probability < 0.7) return;

      // Tìm chunk tương ứng trong chunkMap!
      const chunkUrl = chunkMap[path];
      if (!chunkUrl || this._prefetched.has(chunkUrl)) return;

      this._prefetched.add(chunkUrl);

      // Tạo prefetch link!
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = chunkUrl;
      link.as = "script";
      document.head.appendChild(link);

      console.log(
        `[Predict] ${path} (${(probability * 100).toFixed(0)}%)` +
          ` → ${chunkUrl}`,
      );
    });
  }

  // ④ Tự động prefetch khi navigate!
  autoStart(chunkMap) {
    // Prefetch cho trang hiện tại!
    const doPrefetch = () => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          this.prefetchPredictions(location.pathname, chunkMap);
        });
      } else {
        setTimeout(() => {
          this.prefetchPredictions(location.pathname, chunkMap);
        }, 1000);
      }
    };

    // Initial!
    window.addEventListener("load", doPrefetch);

    // SPA navigation!
    const origPushState = history.pushState;
    history.pushState = (...args) => {
      origPushState.apply(history, args);
      this._prefetched.clear(); // Reset cho route mới!
      doPrefetch();
    };

    window.addEventListener("popstate", () => {
      this._prefetched.clear();
      doPrefetch();
    });
  }
}

// ═══ SỬ DỤNG ═══
const predictor = new PredictivePrefetcher({
  threshold: 0.3,
  maxPrefetch: 3,
});

// Dữ liệu từ Google Analytics (build-time inject!)
predictor.loadTransitions({
  "/home": { "/products": 0.6, "/about": 0.3, "/blog": 0.1 },
  "/products": { "/cart": 0.7, "/home": 0.2, "/about": 0.1 },
  "/about": { "/contact": 0.5, "/home": 0.4, "/blog": 0.1 },
});

// Chunk mapping (from webpack build!)
const chunkMap = {
  "/products": "/js/products.abc123.chunk.js",
  "/about": "/js/about.def456.chunk.js",
  "/cart": "/js/cart.ghi789.chunk.js",
  "/contact": "/js/contact.jkl012.chunk.js",
  "/blog": "/js/blog.mno345.chunk.js",
};

predictor.autoStart(chunkMap);

// User ở /home:
// → [Predict] /products (60%) → products.chunk.js
// → [Predict] /about (30%) → about.chunk.js
// → /blog (10%) → SKIP! (< threshold 30%)
```

```
PREDICTIVE PREFETCH — SƠ ĐỒ:
═══════════════════════════════════════════════════════════════

  Guess.js HOẠT ĐỘNG:
  ┌────────────────────────────────────────────────────┐
  │ ① Thu thập data từ Google Analytics!               │
  │    → User journeys: /home → /products → /cart     │
  │    → Build transition matrix!                      │
  │                                                    │
  │ ② Build time: map URLs → Webpack chunks!           │
  │    → /products → products.chunk.js                 │
  │    → /cart → cart.chunk.js                         │
  │                                                    │
  │ ③ Inject predictions vào MỖI chunk!                │
  │    → __GUESS__.p(['products.js', 0.6],             │
  │                   ['cart.js', 0.3])                │
  │                                                    │
  │ ④ Runtime: kiểm tra connection speed!              │
  │    ├── Nhanh → prefetch CẢ 2! (0.6 + 0.3)        │
  │    └── Chậm → chỉ prefetch cao! (0.6)             │
  │                                                    │
  │ ⑤ Tạo <link rel="prefetch"> cho mỗi chunk!        │
  └────────────────────────────────────────────────────┘
```

---

## §10. What NOT to Prefetch

```
NHỮNG GÌ KHÔNG NÊN PREFETCH:
═══════════════════════════════════════════════════════════════

  ① TRANG AUTHENTICATION:
  ┌────────────────────────────────────────────────────┐
  │ ❌ Prefetch /login, /logout, /signup, /reset-password │
  │ → Prefetch /logout = ĐĂNG XUẤT user!              │
  │ → User đang ở A → navigate B → bị kick!           │
  │ → → KIỂM TRA và BỎ QUA login/logout URLs!        │
  └────────────────────────────────────────────────────┘

  ② QUÁ NHIỀU RESOURCES:
  ┌────────────────────────────────────────────────────┐
  │ ❌ Prefetch TẤT CẢ 100 links trên trang!          │
  │ → Bandwidth hết!                                   │
  │ → Server nghĩ là DDoS → block IP!                 │
  │ → Tốn tiền data (10MB = ~1¢ trên Google Fi!)     │
  │ → 138 trang/ngày × 10MB = $1.30/ngày!            │
  │ → → GIỚI HẠN số lượng + tần suất!                │
  └────────────────────────────────────────────────────┘

  ③ TRANG CHECKOUT / CART:
  ┌────────────────────────────────────────────────────┐
  │ ❌ Prefetch /cart, /checkout, /add-to-cart          │
  │ → Làm sai THỐNG KÊ server (views ảo!)            │
  │ → add-to-cart có thể THÊM sản phẩm vào giỏ!     │
  │ → → Bỏ qua e-commerce action URLs!                │
  └────────────────────────────────────────────────────┘

  ④ FILES LỚN:
  ┌────────────────────────────────────────────────────┐
  │ ❌ Prefetch .mp4, .gif, .zip, .pdf                 │
  │ → Download files KHÔNG ĐƯỢC ĐỒNG Ý!               │
  │ → Tốn bandwidth vô ích!                           │
  │ → → Bỏ qua file extensions lớn!                   │
  └────────────────────────────────────────────────────┘

  ⑤ CROSS-ORIGIN LINKS:
  ┌────────────────────────────────────────────────────┐
  │ ❌ Prefetch links đến DOMAIN KHÁC!                 │
  │ → Double-keyed caching: không dùng được cache!     │
  │ → Lộ browsing history cho 3rd party!               │
  │ → → Chỉ prefetch SAME-ORIGIN!                     │
  └────────────────────────────────────────────────────┘

  ⑥ ADS:
  ┌────────────────────────────────────────────────────┐
  │ ❌ Prefetch ad links!                              │
  │ → Tính là AD CLICK → thổi phồng metrics (CTR!)   │
  │ → → Bỏ qua iframe ads + ad URLs!                  │
  └────────────────────────────────────────────────────┘

  ⑦ PROTOCOLS KHÁC:
  ┌────────────────────────────────────────────────────┐
  │ ❌ tel:, mailto:, javascript:, market:, intent:    │
  │ → Browser có thể TRIGGER actions!                  │
  │ → VD: tel: = mở dailer! mailto: = mở mail!       │
  │ → → Chỉ prefetch http:// và https://!             │
  └────────────────────────────────────────────────────┘
```

---

## §11. Double Fetch Pitfalls

```
DOUBLE FETCH — BẪY TẢI TRÙNG LẶP:
═══════════════════════════════════════════════════════════════

  ① DÙNG PREFETCH THAY CHO PRELOAD:
  ┌────────────────────────────────────────────────────┐
  │ ❌ Dùng prefetch cho tài nguyên HIỆN TẠI!          │
  │ → Prefetch tải với priority LOW!                   │
  │ → Parser gặp resource → tải LẠI priority HIGH!    │
  │ → → 2 requests cho 1 resource!                    │
  │                                                    │
  │ ✅ Hiện tại → preload! Tương lai → prefetch!       │
  └────────────────────────────────────────────────────┘

  ② PRELOAD THIẾU "as" ATTRIBUTE:
  ┌────────────────────────────────────────────────────┐
  │ ❌ <link rel="preload" href="app.js">              │
  │ → Không có as → browser KHÔNG BIẾT loại resource! │
  │ → Tải với priority XHR (HIGH!)                    │
  │ → Khi <script> gặp → tải LẠI!                    │
  │ → → DOUBLE FETCH!                                 │
  │                                                    │
  │ ✅ <link rel="preload" href="app.js" as="script"> │
  └────────────────────────────────────────────────────┘

  ③ FONTS THIẾU crossorigin:
  ┌────────────────────────────────────────────────────┐
  │ ❌ <link rel="preload" href="font.woff2" as="font">│
  │ → Fonts LUÔN dùng anonymous CORS!                 │
  │ → Preload không crossorigin → mode KHÁC!          │
  │ → → Tải 2 LẦN!                                    │
  │                                                    │
  │ ✅ <link rel="preload" href="font.woff2"           │
  │         as="font" crossorigin>                     │
  └────────────────────────────────────────────────────┘

  ④ INTEGRITY ATTRIBUTE:
  ┌────────────────────────────────────────────────────┐
  │ → <link rel="preload"> chưa hỗ trợ integrity!    │
  │ → Preloaded resource BỊ BỎ QUA!                   │
  │ → <script integrity="sha..."> tải LẠI!           │
  │ → → Bỏ integrity HOẶC chấp nhận double fetch!    │
  └────────────────────────────────────────────────────┘
```

---

## §12. Tóm tắt phỏng vấn

```
Q&A PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Prefetch khác Preload thế nào?"
  A: Preload: resource cho TRANG HIỆN TẠI, priority CAO!
  Prefetch: resource cho TRANG TIẾP THEO, priority THẤP!
  Preload không persist qua navigation!
  Prefetch persist ít nhất 5 phút trong Chrome!

  Q: "Khi nào dùng Prefetch?"
  A: → Biết user SẼ navigate đến page khác!
  → Code chunks cho routes phổ biến!
  → SAU khi initial route render XONG!
  → Khi browser NHÀN và đủ bandwidth!

  Q: "Quicklink hoạt động thế nào?"
  A: → IntersectionObserver theo dõi <a> tags!
  → Link XUẤT HIỆN trên viewport → prefetch href!
  → requestIdleCallback → tải khi nhàn!
  → Kiểm tra: same-origin, mạng tốt, chưa trùng!

  Q: "Predictive Prefetching là gì?"
  A: → Phân tích navigation patterns từ analytics!
  → Build Markov chain: P(next | current)!
  → Runtime: prefetch pages xác suất CAO!
  → Mạng chậm → chỉ prefetch xác suất RẤT CAO!

  Q: "Double fetch xảy ra khi nào?"
  A: → Prefetch thay preload → 2 lần tải!
  → Preload thiếu "as" → browser không biết type!
  → Font preload thiếu crossorigin → mode khác!
  → Integrity attribute chưa hỗ trợ trên preload!

  Q: "Những gì KHÔNG NÊN prefetch?"
  A: Auth pages (logout!), cross-origin, ads, files lớn,
  checkout/cart, protocols khác (tel:, mailto:)!
  → Quá nhiều prefetch = DDoS + tốn tiền data!
```

---

### Checklist

- [ ] **Prefetch**: `<link rel="prefetch">` cho tài nguyên TƯƠNG LAI, priority THẤP!
- [ ] **Preload**: `<link rel="preload">` cho tài nguyên HIỆN TẠI, priority CAO!
- [ ] **Webpack**: `/* webpackPrefetch: true */` magic comment!
- [ ] **Quicklink**: IntersectionObserver + prefetch visible links!
- [ ] **Hover Prefetch**: mouseover → delay 65ms → prefetch!
- [ ] **Predictive**: Analytics → Markov chain → prefetch xác suất cao!
- [ ] **Slow network**: Kiểm tra navigator.connection, saveData, 2G!
- [ ] **requestIdleCallback**: Prefetch khi browser NHÀN!
- [ ] **Same-origin only**: Tránh cross-origin prefetch!
- [ ] **Không prefetch**: Auth, checkout, ads, files lớn, tel/mailto!
- [ ] **Double fetch**: as attribute, crossorigin cho fonts!
- [ ] **Limit**: Giới hạn số lượng prefetch đồng thời!

---

_Nguồn: patterns.dev — Addy Osmani_
_Chrome Team — "Preload, Prefetch and Priorities"_
_Minko Gechev — "Predictive Prefetching with Guess.js"_
_Cập nhật lần cuối: Tháng 2, 2026_
