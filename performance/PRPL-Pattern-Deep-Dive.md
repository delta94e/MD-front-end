# PRPL Pattern — Performance Pattern Deep Dive

> 📅 2026-02-15 · ⏱ 25 phút đọc
>
> PRPL Pattern, Push / Render / Pre-cache / Lazy-load,
> HTTP/2 Server Push, Service Worker Caching,
> App Shell Architecture, Tự viết Service Worker từ đầu,
> Tự viết Route-based Prefetcher, Preload Resource Hints
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Performance / Architecture
>
> _Dựa trên patterns.dev — Addy Osmani & web.dev_

---

## Mục Lục

| #   | Phần                                      |
| --- | ----------------------------------------- |
| 1   | PRPL Pattern là gì?                       |
| 2   | HTTP/1.1 vs HTTP/2 — Nền tảng             |
| 3   | Push — Đẩy tài nguyên critical            |
| 4   | Render — Hiển thị route ban đầu           |
| 5   | Pre-cache — Tự viết Service Worker        |
| 6   | Lazy-load — Tải route/assets theo yêu cầu |
| 7   | App Shell Architecture                    |
| 8   | Tự viết Route Prefetcher                  |
| 9   | Tự viết Resource Hint Manager             |
| 10  | Tổng hợp luồng PRPL                       |
| 11  | Tóm tắt phỏng vấn                         |

---

## §1. PRPL Pattern là gì?

```
PRPL — 4 TRỤ CỘT HIỆU SUẤT:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  P ─ PUSH     Đẩy tài nguyên CRITICAL hiệu quả!       │
  │                → Giảm roundtrips server!                │
  │                → HTTP/2 Server Push hoặc Preload!       │
  │                                                         │
  │  R ─ RENDER   Render route BAN ĐẦU sớm nhất!           │
  │                → FCP/LCP nhanh!                         │
  │                → Không chờ tài nguyên KHÔNG CẦN!       │
  │                                                         │
  │  P ─ PRE-CACHE  Cache tài nguyên trong BACKGROUND!     │
  │                → Service Worker lưu routes phổ biến!    │
  │                → Offline-ready!                         │
  │                → Lần sau → tải từ CACHE!                │
  │                                                         │
  │  L ─ LAZY-LOAD  Tải routes/assets THEO YÊU CẦU!       │
  │                → Code splitting!                        │
  │                → Không tải code CHƯA CẦN!              │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  MỤC TIÊU: TỐI ƯU CHO MỌI ĐIỀU KIỆN!
  → Thiết bị LOW-END (RAM ít, CPU yếu!)
  → Mạng CHẬM (3G, vùng xa!)
  → User TOÀN CẦU (không chỉ thành phố lớn!)

  TIMELINE:
  ─────────────────────────────────────────────────────────
  Request → P(ush) → R(ender) → P(re-cache) → L(azy-load)
  │         │         │          │              │
  │         ▼         ▼          ▼              ▼
  │    Critical    Hiển thị   SW cache      Routes khác
  │    resources   route      routes        tải khi cần!
  │    đẩy tới!    đầu tiên!  phổ biến!
```

---

## §2. HTTP/1.1 vs HTTP/2 — Nền tảng

```
TẠI SAO PRPL CẦN HTTP/2?
═══════════════════════════════════════════════════════════════

  HTTP/1.1 — VẤN ĐỀ:
  ┌────────────────────────────────────────────────────────┐
  │ ① Head-of-Line Blocking:                               │
  │ ┌──── Request 1 ────────────────────┐                  │
  │ │     (chờ response...)             │                  │
  │ │     Request 2 PHẢI CHỜ!           │                  │
  │ │     Request 3 PHẢI CHỜ!           │                  │
  │ └───────────────────────────────────┘                  │
  │ → Tối đa 6 TCP connections!                            │
  │ → Request trước CHẬM → TẤT CẢ chờ!                   │
  │                                                        │
  │ ② Nhiều roundtrips:                                    │
  │ Client → Server: GET index.html                        │
  │ Server → Client: index.html                            │
  │ Client parse → phát hiện cần style.css + app.js!       │
  │ Client → Server: GET style.css                         │
  │ Client → Server: GET app.js                            │
  │ → MỖI tài nguyên = 1 roundtrip!                       │
  │ → Latency CAO trên mạng chậm!                         │
  └────────────────────────────────────────────────────────┘

  HTTP/2 — GIẢI QUYẾT:
  ┌────────────────────────────────────────────────────────┐
  │ ① Multiplexing (đa luồng):                            │
  │ ┌─ Stream 1: Request 1 ──→ Response 1 ─┐              │
  │ ├─ Stream 2: Request 2 ──→ Response 2 ─┤ 1 TCP conn! │
  │ ├─ Stream 3: Request 3 ──→ Response 3 ─┤              │
  │ └──────────────────────────────────────┘              │
  │ → SONG SONG trên 1 TCP connection!                     │
  │ → Không head-of-line blocking!                         │
  │                                                        │
  │ ② Binary Framing:                                      │
  │ → Headers frame + Data frame!                          │
  │ → Nhỏ hơn, parse nhanh hơn plaintext!                 │
  │                                                        │
  │ ③ Server Push:                                         │
  │ Client → Server: GET index.html                        │
  │ Server → Client: index.html                            │
  │ Server → Client: style.css  (PUSH! không cần request!)│
  │ Server → Client: app.js    (PUSH! không cần request!)│
  │ → Server BIẾT client cần gì → đẩy LUÔN!              │
  │ → GIẢM roundtrips xuống 1!                             │
  └────────────────────────────────────────────────────────┘

  SO SÁNH:
  HTTP/1.1:  ───req1──resp1───req2──resp2───req3──resp3───
             (tuần tự, chậm!)

  HTTP/2:    ───req1──┬──resp1──┐
             ───req2──┤──resp2──┤  (song song, nhanh!)
             ───req3──┘──resp3──┘
```

---

## §3. Push — Đẩy tài nguyên critical

```
PUSH — 2 CÁCH THỰC HIỆN:
═══════════════════════════════════════════════════════════════

  ① HTTP/2 SERVER PUSH:
  ┌────────────────────────────────────────────────────────┐
  │ Server tự động ĐẨY resources cùng với HTML!            │
  │                                                        │
  │ Client request index.html                              │
  │ Server trả về: index.html                              │
  │              + PUSH style.css                          │
  │              + PUSH app.js                             │
  │              + PUSH hero.webp                          │
  │                                                        │
  │ → Client nhận TẤT CẢ trong 1 roundtrip!               │
  │ → Resources vào BROWSER CACHE!                         │
  │ → Parser phát hiện cần → lấy từ cache NGAY!           │
  │                                                        │
  │ ⚠️ HẠN CHẾ:                                            │
  │ → Server Push KHÔNG biết browser cache!                │
  │ → Lần 2 visit → PUSH LẠI (dù đã có cache!)           │
  │ → → Lãng phí bandwidth!                                │
  │ → → Cần Service Worker bổ sung! (Pre-cache!)           │
  └────────────────────────────────────────────────────────┘

  ② PRELOAD RESOURCE HINTS:
  ┌────────────────────────────────────────────────────────┐
  │ Báo browser: "Tài nguyên này CRITICAL, tải SỚM!"     │
  │                                                        │
  │ <link rel="preload" href="style.css" as="style">      │
  │ <link rel="preload" href="app.js" as="script">        │
  │ <link rel="preload" href="font.woff2" as="font"       │
  │       crossorigin>                                     │
  │                                                        │
  │ → Browser phát hiện hint → tải NGAY!                   │
  │ → Không cần chờ parser gặp <link> hoặc <script>!     │
  │ → Priority CAO!                                        │
  │                                                        │
  │ ⚠️ CHÚ Ý:                                              │
  │ → Preload QUÁ NHIỀU → bandwidth cạn!                  │
  │ → Browser cache CÓ GIỚI HẠN!                          │
  │ → Chỉ preload tài nguyên THẬT SỰ critical!            │
  └────────────────────────────────────────────────────────┘
```

---

## §4. Render — Hiển thị route ban đầu

```
RENDER — INITIAL ROUTE TRƯỚC HẾT:
═══════════════════════════════════════════════════════════════

  QUY TẮC: KHÔNG tải resources KHÁC trước khi
  initial route HIỂN THỊ và RENDER XONG!

  ┌────────────────────────────────────────────────────────┐
  │ ❌ SAI: Tải TẤT CẢ routes ngay!                       │
  │                                                        │
  │ Page load ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ Render!        │
  │           │Home│About│Dashboard│Settings│               │
  │           │ Tải TẤT CẢ code!          │               │
  │           → FCP / LCP rất CHẬM!                        │
  │                                                        │
  │ ✅ ĐÚNG: Chỉ tải code cho ROUTE HIỆN TẠI!             │
  │                                                        │
  │ Page load ▓▓▓▓▓▓ Render! ····· pre-cache ·····        │
  │           │Home │             │About│Dash│              │
  │           │ CHỈ │             │ background │            │
  │           │ code│             │ caching!   │            │
  │           │ cần!│                                       │
  │           → FCP / LCP NHANH!                           │
  └────────────────────────────────────────────────────────┘

  CÁCH ĐẠT ĐƯỢC:
  → Code splitting: mỗi route = 1 chunk riêng!
  → App Shell: minimal HTML/CSS/JS chung!
  → Inline critical CSS!
  → Defer non-critical JS!
```

---

## §5. Pre-cache — Tự viết Service Worker

```
SERVICE WORKER — PRE-CACHE ROUTES:
═══════════════════════════════════════════════════════════════

  Service Worker = script chạy NGOÀI main thread!
  → Đứng GIỮA browser và network!
  → Chặn requests → trả lời từ CACHE!
  → Chạy BACKGROUND → không block UI!

  SƠ ĐỒ:
  ┌──────────┐    ┌───────────────┐    ┌──────────┐
  │ Browser  │ ←→ │ Service       │ ←→ │ Network  │
  │ (main    │    │ Worker        │    │ (server) │
  │  thread) │    │ (background!) │    │          │
  │          │    │               │    │          │
  │ fetch()  │──→ │ Có cache?     │    │          │
  │          │    │ ├── CÓ → trả! │    │          │
  │          │    │ └── KHÔNG     │──→ │ fetch!   │
  │          │ ←──│     cache lại!│ ←──│ response │
  └──────────┘    └───────────────┘    └──────────┘
```

```javascript
// ═══ service-worker.js — TỰ VIẾT TỪ ĐẦU ═══

const CACHE_NAME = "prpl-cache-v1";

// ① Danh sách routes PHỔ BIẾN cần pre-cache!
const PRECACHE_ROUTES = [
  "/",
  "/index.html",
  "/styles/main.css",
  "/scripts/app.js",
  "/scripts/home.chunk.js",
  "/scripts/about.chunk.js",
  "/scripts/dashboard.chunk.js",
  "/manifest.json",
];

// ② INSTALL — Pre-cache routes khi SW cài đặt!
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Pre-caching routes...");
        // addAll: TẢI + CACHE tất cả URLs!
        return cache.addAll(PRECACHE_ROUTES);
      })
      .then(() => self.skipWaiting()), // Kích hoạt NGAY!
  );
});

// ③ ACTIVATE — Xóa cache CŨ!
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME) // Cache cũ!
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          }),
      );
    }),
  );
  // Claim tất cả clients NGAY!
  return self.clients.claim();
});

// ④ FETCH — Chặn request → trả từ cache!
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // CÓ trong cache → trả NGAY! (nhanh!)
        console.log("[SW] Cache hit:", event.request.url);
        return cachedResponse;
      }

      // KHÔNG có cache → fetch từ network!
      return fetch(event.request).then((networkResponse) => {
        // Cache response MỚI cho lần sau!
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    }),
  );
});
```

```
GIẢI THÍCH CHI TIẾT:
═══════════════════════════════════════════════════════════════

  ② INSTALL EVENT:
  ┌────────────────────────────────────────────────────┐
  │ → SW cài đặt LẦN ĐẦU!                             │
  │ → cache.addAll(PRECACHE_ROUTES)                    │
  │ → TẢI tất cả URLs trong list → lưu vào cache!     │
  │ → skipWaiting() → kích hoạt NGAY (không chờ!)     │
  │                                                    │
  │ THỜI ĐIỂM: SAU initial route render xong!          │
  │ → Không ảnh hưởng initial load!                    │
  │ → Background downloading!                          │
  └────────────────────────────────────────────────────┘

  ③ ACTIVATE EVENT:
  ┌────────────────────────────────────────────────────┐
  │ → SW sẵn sàng kiểm soát requests!                  │
  │ → XÓA cache cũ (version trước!)                    │
  │ → clients.claim() → kiểm soát NGAY mọi tab!       │
  └────────────────────────────────────────────────────┘

  ④ FETCH EVENT — Cache-First Strategy:
  ┌────────────────────────────────────────────────────┐
  │ Request đến:                                       │
  │ ├── Cache HIT → trả response từ cache! (NHANH!)   │
  │ └── Cache MISS → fetch network                    │
  │     → Response OK → CLONE + cache cho lần sau!     │
  │     → Trả response cho browser!                    │
  │                                                    │
  │ TẠI SAO CLONE?                                     │
  │ → Response là STREAM → chỉ đọc 1 LẦN!             │
  │ → Clone 1 bản cho CACHE!                           │
  │ → Bản gốc cho BROWSER!                             │
  └────────────────────────────────────────────────────┘
```

```javascript
// ═══ ĐĂNG KÝ SERVICE WORKER — TỰ VIẾT ═══

// app.js — chạy SAU khi initial route render xong!
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.log("SW not supported!");
    return;
  }

  // Đăng ký SAU khi page load xong → không block render!
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        { scope: "/" },
      );
      console.log("SW registered:", registration.scope);
    } catch (error) {
      console.error("SW registration failed:", error);
    }
  });
}

registerServiceWorker();
```

---

## §6. Lazy-load — Routes/assets theo yêu cầu

```
LAZY-LOAD — CHỮ L TRONG PRPL:
═══════════════════════════════════════════════════════════════

  Routes KHÔNG PHỔ BIẾN → tải KHI CẦN!
  (Khác pre-cache: routes phổ biến cache TRƯỚC!)

  ┌────────────────────────────────────────────────────────┐
  │ Phân loại routes:                                      │
  │                                                        │
  │ CRITICAL (Push + Render):                              │
  │ → / (Home) → tải NGAY!                                │
  │                                                        │
  │ PHỔ BIẾN (Pre-cache):                                  │
  │ → /about, /dashboard → SW cache background!            │
  │                                                        │
  │ ÍT DÙNG (Lazy-load):                                  │
  │ → /settings, /admin → dynamic import() khi navigate!  │
  │ → KHÔNG cache trước (lãng phí!)                        │
  │ → KHÔNG tải trước (không cần!)                         │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══ LAZY-LOAD ROUTES — React ═══

import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// AppShell tải NGAY (critical!)
import AppShell from "./AppShell";

// Routes PHỔ BIẾN — pre-cache bởi SW, lazy load code
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

// Routes ÍT DÙNG — lazy load HOÀN TOÀN
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  );
}
```

---

## §7. App Shell Architecture

```
APP SHELL — NỀN TẢNG CỦA PRPL:
═══════════════════════════════════════════════════════════════

  App Shell = KHUNG ỨNG DỤNG tối thiểu!
  → Header + Sidebar + Router + Footer!
  → KHÔNG chứa content cụ thể!
  → DÙNG CHUNG cho TẤT CẢ routes!
  → Cache VĨNH VIỄN bởi Service Worker!

  ┌─────────────────────────────────────────┐
  │ ┌───────────────────────────────────┐   │
  │ │         HEADER (App Shell)        │   │
  │ └───────────────────────────────────┘   │
  │ ┌──────┐ ┌─────────────────────────┐   │
  │ │ NAV  │ │                         │   │
  │ │      │ │    CONTENT AREA         │   │
  │ │(Shell│ │    (Route-specific!)     │   │
  │ │      │ │                         │   │
  │ │ )    │ │    ← LAZY LOADED!       │   │
  │ │      │ │    ← Từ cache hoặc      │   │
  │ │      │ │      network!           │   │
  │ └──────┘ └─────────────────────────┘   │
  │ ┌───────────────────────────────────┐   │
  │ │         FOOTER (App Shell)        │   │
  │ └───────────────────────────────────┘   │
  └─────────────────────────────────────────┘
    ↑ App Shell = cached bởi SW!
    ↑ Load NGAY từ cache → hiện khung NHANH!
    ↑ Content fill vào sau!
```

```javascript
// ═══ AppShell.jsx — TỰ VIẾT ═══

import React from "react";

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
      </header>

      <main className="app-content">
        {children} {/* Route content render ở đây! */}
      </main>

      <footer className="app-footer">
        <p>© 2026 My App</p>
      </footer>
    </div>
  );
}

export default AppShell;
// → AppShell = entry point!
// → Chứa router, navigation, layout!
// → KHÔNG chứa page-specific code!
// → Cache bởi SW → load INSTANT!
```

---

## §8. Tự viết Route Prefetcher

```javascript
// ═══ RoutePrefetcher.js — TỰ VIẾT TỪ ĐẦU ═══

/**
 * Prefetch route chunks khi user HOVER link!
 * → Route code tải TRƯỚC khi click!
 * → Click → đã có trong cache → INSTANT navigation!
 */
class RoutePrefetcher {
  constructor() {
    this._prefetched = new Set();
    this._routeMap = new Map();
  }

  // ① Đăng ký route → chunk URL mapping
  registerRoutes(routes) {
    // routes = { '/about': '/scripts/about.chunk.js', ... }
    Object.entries(routes).forEach(([path, chunkUrl]) => {
      this._routeMap.set(path, chunkUrl);
    });
  }

  // ② Prefetch 1 route chunk
  prefetch(routePath) {
    if (this._prefetched.has(routePath)) return;

    const chunkUrl = this._routeMap.get(routePath);
    if (!chunkUrl) return;

    // Tạo <link rel="prefetch">!
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = chunkUrl;
    link.as = "script";
    document.head.appendChild(link);

    this._prefetched.add(routePath);
    console.log(`[Prefetch] ${routePath} → ${chunkUrl}`);
  }

  // ③ Tự động prefetch khi HOVER links!
  observeLinks() {
    document.addEventListener("mouseover", (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;

      const href = link.getAttribute("href");
      if (href && this._routeMap.has(href)) {
        this.prefetch(href);
      }
    });
  }

  // ④ Prefetch routes PHỔ BIẾN khi idle!
  prefetchPopular(routes) {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        routes.forEach((route) => this.prefetch(route));
      });
    } else {
      // Fallback: prefetch sau 2s
      setTimeout(() => {
        routes.forEach((route) => this.prefetch(route));
      }, 2000);
    }
  }
}

// ═══ SỬ DỤNG ═══
const prefetcher = new RoutePrefetcher();

prefetcher.registerRoutes({
  "/about": "/scripts/about.abc123.chunk.js",
  "/dashboard": "/scripts/dashboard.def456.chunk.js",
  "/settings": "/scripts/settings.ghi789.chunk.js",
});

// Hover link → prefetch chunk!
prefetcher.observeLinks();

// Idle → prefetch routes phổ biến!
prefetcher.prefetchPopular(["/about", "/dashboard"]);
```

---

## §9. Tự viết Resource Hint Manager

```javascript
// ═══ ResourceHintManager.js — TỰ VIẾT TỪ ĐẦU ═══

/**
 * Quản lý preload, prefetch, preconnect TẬP TRUNG!
 * Không dùng thư viện!
 */
class ResourceHintManager {
  constructor() {
    this._hints = new Set(); // Tránh trùng!
  }

  _addHint(rel, href, options = {}) {
    const key = `${rel}:${href}`;
    if (this._hints.has(key)) return;

    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (options.as) link.as = options.as;
    if (options.type) link.type = options.type;
    if (options.crossorigin) link.crossOrigin = "anonymous";

    document.head.appendChild(link);
    this._hints.add(key);
  }

  // PRELOAD: tài nguyên CRITICAL cho route HIỆN TẠI!
  preload(href, as, options = {}) {
    this._addHint("preload", href, { as, ...options });
  }

  // PREFETCH: tài nguyên CẦN SỚM cho route TIẾP THEO!
  prefetch(href, as = "script") {
    this._addHint("prefetch", href, { as });
  }

  // PRECONNECT: thiết lập connection TRƯỚC!
  preconnect(origin) {
    this._addHint("preconnect", origin, { crossorigin: true });
    // DNS-prefetch fallback cho browser cũ!
    this._addHint("dns-prefetch", origin);
  }

  // Preload TẤT CẢ critical resources cho 1 route!
  preloadRoute(resources) {
    resources.forEach(({ href, as, type }) => {
      this.preload(href, as, { type });
    });
  }
}

// ═══ SỬ DỤNG ═══
const hints = new ResourceHintManager();

// Push critical resources!
hints.preload("/styles/critical.css", "style");
hints.preload("/scripts/app.js", "script");
hints.preload("/fonts/inter.woff2", "font", {
  type: "font/woff2",
  crossorigin: true,
});

// Preconnect tới 3P domains!
hints.preconnect("https://fonts.googleapis.com");
hints.preconnect("https://cdn.analytics.com");

// Prefetch next route (idle!)
hints.prefetch("/scripts/about.chunk.js");
```

---

## §10. Tổng hợp luồng PRPL

```
LUỒNG PRPL HOÀN CHỈNH:
═══════════════════════════════════════════════════════════════

  ① User request trang /home
  │
  ▼
  ② Server trả index.html + PUSH critical resources
  │  (HTTP/2 Push HOẶC <link rel="preload">)
  │  → critical.css, app.js, home.chunk.js, font.woff2
  │
  ▼
  ③ Browser RENDER initial route (/home)
  │  → App Shell hiển thị NGAY!
  │  → Home content render!
  │  → FCP + LCP nhanh!
  │  → KHÔNG tải code cho /about, /dashboard...
  │
  ▼
  ④ Initial route XONG → đăng ký Service Worker!
  │  → SW install → PRE-CACHE routes phổ biến!
  │  → /about, /dashboard chunks tải BACKGROUND!
  │  → User KHÔNG biết (không ảnh hưởng UX!)
  │
  ▼
  ⑤ User navigate → /about
  │  ├── SW cache HIT → trả INSTANT! ← TỪ CACHE!
  │  └── SW cache MISS → fetch network → cache lại!
  │
  ▼
  ⑥ User navigate → /settings (ít dùng)
     → LAZY-LOAD: import('/settings') → fetch!
     → Không pre-cache (không phổ biến!)

  TỔNG KẾT:
  ┌────────────┬──────────────────────────────────────┐
  │ Chữ        │ Hành động                             │
  ├────────────┼──────────────────────────────────────┤
  │ P(ush)     │ Preload critical CSS/JS/Font!        │
  │ R(ender)   │ Render /home TRƯỚC, code split!      │
  │ P(re-cache)│ SW cache /about, /dashboard ngầm!    │
  │ L(azy)     │ /settings, /admin tải khi navigate!  │
  └────────────┴──────────────────────────────────────┘
```

---

## §11. Tóm tắt phỏng vấn

```
Q&A PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "PRPL Pattern là gì?"
  A: 4 trụ cột: Push critical resources, Render initial route,
  Pre-cache frequent routes (SW), Lazy-load the rest!
  Tối ưu cho low-end devices + mạng chậm!

  Q: "HTTP/2 Server Push khác Preload thế nào?"
  A: Server Push: server TỰ ĐỘNG đẩy resources!
  Preload: browser TỰ TẢI sớm sau khi đọc hint!
  Push KHÔNG biết browser cache → có thể lãng phí!
  Preload tuân theo browser cache!

  Q: "Service Worker giúp gì trong PRPL?"
  A: → Pre-cache routes phổ biến BACKGROUND!
  → Chặn fetch → trả từ cache (INSTANT!)
  → Giải quyết hạn chế Server Push (cache-aware!)
  → Offline support!

  Q: "App Shell là gì?"
  A: Entry point TỐI THIỂU: header + nav + router + footer!
  Dùng CHUNG mọi routes → cache VĨNH VIỄN!
  Content area = lazy loaded theo route!

  Q: "Khi nào dùng prefetch vs preload?"
  A: Preload: tài nguyên CRITICAL cho ROUTE HIỆN TẠI!
  → Priority CAO → tải NGAY!
  Prefetch: tài nguyên cho ROUTE TIẾP THEO!
  → Priority THẤP → tải khi NHÀN!

  Q: "Unbundled modules là gì?"
  A: HTTP/2 multiplexing → có thể TẢI nhiều files nhỏ song song!
  → Không cần gom thành bundle lớn!
  → Mỗi module = 1 file → cache GRANULAR!
  → Thay đổi 1 module → chỉ tải 1 file!
```

---

### Checklist

- [ ] **Push**: Preload critical CSS/JS/Fonts — `<link rel="preload">`!
- [ ] **Render**: Code split → chỉ tải code cho ROUTE HIỆN TẠI!
- [ ] **Pre-cache**: Service Worker cache routes phổ biến BACKGROUND!
- [ ] **Lazy-load**: Routes ít dùng → `import()` khi navigate!
- [ ] **App Shell**: Minimal entry → header + router → cache vĩnh viễn!
- [ ] **HTTP/2**: Multiplexing + Server Push giảm roundtrips!
- [ ] **SW Install**: Đăng ký SAU initial render → không block FCP!
- [ ] **SW Fetch**: Cache-first strategy → cache hit = INSTANT!
- [ ] **SW Activate**: Xóa cache cũ → tránh stale resources!
- [ ] **Prefetch on hover**: Hover link → prefetch chunk → click = instant!
- [ ] **requestIdleCallback**: Prefetch khi browser NHÀN!
- [ ] **Preconnect 3P**: DNS + TCP + TLS trước → load nhanh hơn!

---

_Nguồn: patterns.dev & web.dev — Addy Osmani — "PRPL Pattern"_
_Cập nhật lần cuối: Tháng 2, 2026_
