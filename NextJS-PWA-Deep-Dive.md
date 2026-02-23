# Next.js Progressive Web Apps (PWA) — Deep Dive!

> **Chủ đề**: PWA — Web App Như Native App!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/progressive-web-apps
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — PWA Là Gì?](#1)
2. [§2. 8-Step Implementation Guide!](#2)
3. [§3. Web Push Notifications — Full Flow!](#3)
4. [§4. Security Headers — Bảo Vệ PWA!](#4)
5. [§5. Extending PWA!](#5)
6. [§6. Tự Viết — PWAEngine!](#6)
7. [§7. Câu Hỏi Luyện Tập](#7)

---

## §1. Tổng Quan — PWA Là Gì?

```
  PWA = WEB APP + NATIVE APP FEATURES!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  WEB APP:         NATIVE APP:        PWA:                  │
  │  ┌──────────┐    ┌──────────┐      ┌──────────┐           │
  │  │ Browser  │    │ App Store│      │ Browser  │           │
  │  │ only     │    │ Install  │      │ + Install│           │
  │  │ URL      │    │ Update   │      │ + Offline│           │
  │  │ No push  │    │ Push     │      │ + Push   │           │
  │  │ Online   │    │ Offline  │      │ + Home   │           │
  │  └──────────┘    └──────────┘      │   Screen │           │
  │  Accessible!     Powerful!         └──────────┘           │
  │  But limited     But friction      BEST OF BOTH! 🎉      │
  │                                                            │
  │  PWA LÀM ĐƯỢC:                                            │
  │  ① Deploy updates INSTANTLY (không qua App Store!)        │
  │  ② Cross-platform: 1 codebase = iOS + Android + Desktop! │
  │  ③ Home screen installation (app icon như native!)       │
  │  ④ Push notifications (re-engage users!)                  │
  │  ⑤ Offline support (với Service Worker!)                 │
  │  ⑥ No App Store approval needed! 🚀                      │
  │                                                            │
  │  BROWSER SUPPORT:                                          │
  │  ┌──────────────────────┬───────────────────────────────┐  │
  │  │ Browser              │ Push Notifications?           │  │
  │  ├──────────────────────┼───────────────────────────────┤  │
  │  │ Chrome/Edge/Opera    │ ✅ Full support!             │  │
  │  │ Firefox              │ ✅ Full support!             │  │
  │  │ Safari macOS 13+     │ ✅ Safari 16+!              │  │
  │  │ iOS                  │ ✅ iOS 16.4+ (home screen!) │  │
  │  └──────────────────────┴───────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. 8-Step Implementation Guide!

```
  8 STEPS ĐỂ TẠO PWA VỚI NEXT.JS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │ STEP 1: Web App Manifest (app/manifest.ts)          │   │
  │  │ → Định nghĩa tên, icons, display mode!           │   │
  │  └──────────────────────┬──────────────────────────────┘   │
  │                         ▼                                  │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │ STEP 2: Push Notification UI (app/page.tsx)         │   │
  │  │ → PushNotificationManager + InstallPrompt!         │   │
  │  └──────────────────────┬──────────────────────────────┘   │
  │                         ▼                                  │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │ STEP 3: Server Actions (app/actions.ts)             │   │
  │  │ → subscribe, unsubscribe, sendNotification!        │   │
  │  └──────────────────────┬──────────────────────────────┘   │
  │                         ▼                                  │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │ STEP 4: VAPID Keys (.env)                           │   │
  │  │ → web-push generate-vapid-keys!                    │   │
  │  └──────────────────────┬──────────────────────────────┘   │
  │                         ▼                                  │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │ STEP 5: Service Worker (public/sw.js)               │   │
  │  │ → Push event + notificationclick handler!          │   │
  │  └──────────────────────┬──────────────────────────────┘   │
  │                         ▼                                  │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │ STEP 6: Add to Home Screen                          │   │
  │  │ → HTTPS + valid manifest = browser auto prompt!    │   │
  │  └──────────────────────┬──────────────────────────────┘   │
  │                         ▼                                  │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │ STEP 7: Test Locally                                │   │
  │  │ → next dev --experimental-https!                   │   │
  │  └──────────────────────┬──────────────────────────────┘   │
  │                         ▼                                  │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │ STEP 8: Security Headers (next.config.js)           │   │
  │  │ → X-Frame-Options, CSP, Cache-Control cho SW!     │   │
  │  └─────────────────────────────────────────────────────┘   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  STEP 1: WEB APP MANIFEST (app/manifest.ts)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // app/manifest.ts                                      │
  │  import type { MetadataRoute } from 'next'               │
  │                                                          │
  │  export default function manifest():                     │
  │    MetadataRoute.Manifest {                              │
  │    return {                                              │
  │      name: 'Next.js PWA',                                │
  │      short_name: 'NextPWA',                              │
  │      description: 'A PWA built with Next.js',           │
  │      start_url: '/',                                     │
  │      display: 'standalone',                              │
  │      background_color: '#ffffff',                        │
  │      theme_color: '#000000',                             │
  │      icons: [                                            │
  │        { src: '/icon-192x192.png',                       │
  │          sizes: '192x192', type: 'image/png' },          │
  │        { src: '/icon-512x512.png',                       │
  │          sizes: '512x512', type: 'image/png' },          │
  │      ],                                                  │
  │    }                                                     │
  │  }                                                       │
  │                                                          │
  │  FIELDS EXPLAINED:                                        │
  │  ┌──────────────────┬───────────────────────────────┐    │
  │  │ name             │ Tên FULL hiển thị!           │    │
  │  │ short_name       │ Tên ngắn trên home screen!  │    │
  │  │ start_url        │ URL mở khi launch!           │    │
  │  │ display          │ standalone = giống native!   │    │
  │  │                  │ (no browser chrome!)          │    │
  │  │ background_color │ Splash screen background!     │    │
  │  │ theme_color      │ Status bar color!             │    │
  │  │ icons            │ 192x192 + 512x512 MINIMUM!   │    │
  │  └──────────────────┴───────────────────────────────┘    │
  │                                                          │
  │  TIP: Dùng realfavicongenerator.net để tạo icons!      │
  │  → Đặt trong public/ folder!                           │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Web Push Notifications — Full Flow!

```
  PUSH NOTIFICATION ARCHITECTURE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌─────────┐  Subscribe  ┌──────────┐  Store  ┌────────┐  │
  │  │ Browser │ ═══════════►│ Push     │ ═════►│ Server │  │
  │  │ (Client)│             │ Service  │        │ (DB)   │  │
  │  │         │◄════════════│ (Google/ │        │        │  │
  │  │ sw.js   │  Push Event │ Apple/   │◄═══════│ Send   │  │
  │  │ handles │             │ Mozilla) │ Notify │ Action │  │
  │  └─────────┘             └──────────┘        └────────┘  │
  │                                                            │
  │  FLOW:                                                     │
  │  ① Client: navigator.serviceWorker.register('/sw.js')     │
  │  ② Client: pushManager.subscribe({ VAPID public key })    │
  │  ③ Client → Server Action: subscribeUser(subscription)   │
  │  ④ Server: store subscription in DB                        │
  │  ⑤ Server: webpush.sendNotification(subscription, data)   │
  │  ⑥ Push Service → Browser → sw.js 'push' event          │
  │  ⑦ SW: self.registration.showNotification(title, opts)    │
  │  ⑧ User clicks → SW: 'notificationclick' → open URL    │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  VAPID KEYS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  VAPID = Voluntary Application Server Identification!    │
  │  → Xác thực server với Push Service!                  │
  │                                                          │
  │  GENERATE:                                                │
  │  pnpm add -g web-push                                    │
  │  web-push generate-vapid-keys                            │
  │                                                          │
  │  .env:                                                    │
  │  NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key             │
  │  VAPID_PRIVATE_KEY=your_private_key                      │
  │                                                          │
  │  ┌─────────────────┬───────────────────────────────┐     │
  │  │ Key             │ Dùng ở đâu?                 │     │
  │  ├─────────────────┼───────────────────────────────┤     │
  │  │ PUBLIC key      │ Client! (NEXT_PUBLIC_ prefix) │     │
  │  │ (applicationSer │ → subscribe request!         │     │
  │  │ verKey)         │                               │     │
  │  │ PRIVATE key     │ Server ONLY!                  │     │
  │  │                 │ → webpush.setVapidDetails()   │     │
  │  └─────────────────┴───────────────────────────────┘     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  SERVICE WORKER (public/sw.js):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // public/sw.js                                         │
  │  self.addEventListener('push', function (event) {        │
  │    if (event.data) {                                     │
  │      const data = event.data.json()                      │
  │      const options = {                                   │
  │        body: data.body,                                  │
  │        icon: data.icon || '/icon.png',                   │
  │        badge: '/badge.png',                              │
  │        vibrate: [100, 50, 100],                          │
  │        data: {                                           │
  │          dateOfArrival: Date.now(),                       │
  │          primaryKey: '2',                                │
  │        },                                                │
  │      }                                                   │
  │      event.waitUntil(                                    │
  │        self.registration.showNotification(               │
  │          data.title, options                              │
  │        )                                                 │
  │      )                                                   │
  │    }                                                     │
  │  })                                                      │
  │                                                          │
  │  self.addEventListener('notificationclick',              │
  │    function (event) {                                    │
  │      event.notification.close()                          │
  │      event.waitUntil(                                    │
  │        clients.openWindow('https://your-site.com')       │
  │      )                                                   │
  │    }                                                     │
  │  )                                                       │
  │                                                          │
  │  2 EVENT LISTENERS:                                       │
  │  ┌──────────────────┬───────────────────────────────┐    │
  │  │ Event            │ Action                        │    │
  │  ├──────────────────┼───────────────────────────────┤    │
  │  │ 'push'           │ Nhận push từ server         │    │
  │  │                  │ → showNotification()         │    │
  │  │ 'notificationcli │ User click notification       │    │
  │  │ ck'              │ → close + openWindow()       │    │
  │  └──────────────────┴───────────────────────────────┘    │
  │                                                          │
  │  NOTIFICATION OPTIONS:                                    │
  │  icon: icon hiển thị bên cạnh notification!            │
  │  badge: icon nhỏ trên notification bar (Android!)      │
  │  vibrate: [100, 50, 100] = rung 100ms, nghỉ 50, 100  │
  │  data: custom data gắn vào notification!               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  ADD TO HOME SCREEN — REQUIREMENTS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ╔════╗                                                  │
  │  ║ A2HS REQUIREMENTS:                                    │
  │  ║ ① Valid web app manifest (manifest.ts)               │
  │  ║ ② Website served over HTTPS!                         │
  │  ║ → Meet 2 điều kiện = browser AUTO PROMPT!         │
  │  ╚════╝                                                  │
  │                                                          │
  │  iOS SPECIFIC:                                            │
  │  → iOS KHÔNG có auto install prompt!                   │
  │  → Phải hướng dẫn user: Share → Add to Home Screen  │
  │  → Dùng InstallPrompt component:                       │
  │    if (isIOS && !isStandalone)                           │
  │      → Show instructions! (⎋ → ➕)                     │
  │                                                          │
  │  DETECT STANDALONE:                                       │
  │  window.matchMedia('(display-mode: standalone)').matches  │
  │  → true = ĐÃ cài từ home screen!                    │
  │  → false = chạy trong browser!                         │
  │                                                          │
  │  ⚠️ beforeinstallprompt:                                 │
  │  → Chromium-only! KHÔNG work trên Safari iOS!          │
  │  → Next.js docs khuyên KHÔNG dùng!                    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Security Headers — Bảo Vệ PWA!

```
  SECURITY HEADERS (next.config.js):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  GLOBAL HEADERS (tất cả routes):                        │
  │  ┌──────────────────────┬──────────────────────────┐     │
  │  │ Header               │ Purpose                  │     │
  │  ├──────────────────────┼──────────────────────────┤     │
  │  │ X-Content-Type-      │ Chặn MIME type sniffing!│     │
  │  │ Options: nosniff     │ → Malicious file upload │     │
  │  │ X-Frame-Options:     │ Chặn clickjacking!     │     │
  │  │ DENY                 │ → Site không embed     │     │
  │  │                      │   trong iframe!          │     │
  │  │ Referrer-Policy:     │ Kiểm soát referrer!    │     │
  │  │ strict-origin-when-  │ → Cross-origin: chỉ   │     │
  │  │ cross-origin         │   gửi origin!          │     │
  │  └──────────────────────┴──────────────────────────┘     │
  │                                                          │
  │  SERVICE WORKER HEADERS (chỉ /sw.js):                  │
  │  ┌──────────────────────┬──────────────────────────┐     │
  │  │ Header               │ Purpose                  │     │
  │  ├──────────────────────┼──────────────────────────┤     │
  │  │ Content-Type:        │ Đảm bảo SW = JS!       │     │
  │  │ application/         │                          │     │
  │  │ javascript;utf-8     │                          │     │
  │  │ Cache-Control:       │ KHÔNG cache SW!          │     │
  │  │ no-cache,no-store,   │ → Luôn update mới!    │     │
  │  │ must-revalidate      │                          │     │
  │  │ CSP: default-src     │ SW chỉ load script     │     │
  │  │ 'self'; script-src   │ từ same origin!        │     │
  │  │ 'self'               │                          │     │
  │  └──────────────────────┴──────────────────────────┘     │
  │                                                          │
  │  ⚠️ SW Cache-Control QUAN TRỌNG:                        │
  │  → no-cache = user LUÔN có SW update mới nhất!       │
  │  → Nếu cache SW → user stuck với SW cũ! 💥          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Extending PWA!

```
  EXTENDING YOUR PWA:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌──────┬──────────────────────────────────────────────┐ │
  │  │ #    │ Extension                                    │ │
  │  ├──────┼──────────────────────────────────────────────┤ │
  │  │ 1    │ PWA Capabilities:                            │ │
  │  │      │ → Background Sync!                          │ │
  │  │      │ → Periodic Background Sync!                 │ │
  │  │      │ → File System Access API!                   │ │
  │  │      │ → whatpwacando.today (full list!)           │ │
  │  │ 2    │ Static Exports:                              │ │
  │  │      │ → output: 'export' in next.config.js       │ │
  │  │      │ → Server Actions → external API!           │ │
  │  │      │ → Headers → proxy config!                  │ │
  │  │ 3    │ Offline Support:                             │ │
  │  │      │ → Serwist library!                          │ │
  │  │      │ → Tích hợp với Next.js!                   │ │
  │  │      │ → ⚠️ Requires webpack config!              │ │
  │  │ 4    │ Security:                                    │ │
  │  │      │ → HTTPS required!                           │ │
  │  │      │ → Validate push message source!             │ │
  │  │      │ → Proper error handling!                    │ │
  │  │ 5    │ Progressive Enhancement:                     │ │
  │  │      │ → App works WITHOUT PWA features too!       │ │
  │  │      │ → Feature detection before using APIs!      │ │
  │  └──────┴──────────────────────────────────────────────┘ │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — PWAEngine!

```javascript
var PWAEngine = (function () {
  // ═══════════════════════════════════
  // 1. MANIFEST GENERATOR
  // ═══════════════════════════════════
  function generateManifest(config) {
    return {
      name: config.name || "My PWA",
      short_name: config.shortName || "PWA",
      description: config.description || "",
      start_url: config.startUrl || "/",
      display: config.display || "standalone",
      background_color: config.backgroundColor || "#ffffff",
      theme_color: config.themeColor || "#000000",
      icons: [
        { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
    };
  }

  // ═══════════════════════════════════
  // 2. PUSH SUBSCRIPTION MANAGER
  // ═══════════════════════════════════
  var subscriptions = {};

  function subscribe(userId, sub) {
    subscriptions[userId] = {
      endpoint: sub.endpoint,
      keys: sub.keys,
      subscribedAt: Date.now(),
    };
    return { success: true, userId: userId };
  }

  function unsubscribe(userId) {
    delete subscriptions[userId];
    return { success: true };
  }

  // ═══════════════════════════════════
  // 3. NOTIFICATION SENDER
  // ═══════════════════════════════════
  function sendNotification(userId, message) {
    var sub = subscriptions[userId];
    if (!sub) {
      return { success: false, error: "No subscription!" };
    }
    // Simulate webpush.sendNotification
    var payload = {
      title: message.title || "Notification",
      body: message.body || "",
      icon: message.icon || "/icon.png",
      badge: "/badge.png",
      vibrate: [100, 50, 100],
      data: { dateOfArrival: Date.now() },
    };
    return {
      success: true,
      sentTo: sub.endpoint,
      payload: payload,
    };
  }

  function broadcastNotification(message) {
    var results = [];
    for (var userId in subscriptions) {
      results.push(sendNotification(userId, message));
    }
    return { sent: results.length, results: results };
  }

  // ═══════════════════════════════════
  // 4. SERVICE WORKER SIMULATOR
  // ═══════════════════════════════════
  var swListeners = {};

  function addEventListener(event, handler) {
    if (!swListeners[event]) swListeners[event] = [];
    swListeners[event].push(handler);
  }

  function dispatchSWEvent(event, data) {
    var handlers = swListeners[event] || [];
    var results = [];
    for (var i = 0; i < handlers.length; i++) {
      results.push(handlers[i](data));
    }
    return results;
  }

  // ═══════════════════════════════════
  // 5. INSTALL PROMPT DETECTOR
  // ═══════════════════════════════════
  function detectInstallState(userAgent) {
    var isIOS = /iPad|iPhone|iPod/.test(userAgent);
    var isAndroid = /Android/.test(userAgent);
    var isStandalone = false; // simulated

    return {
      isIOS: isIOS,
      isAndroid: isAndroid,
      isStandalone: isStandalone,
      showInstallPrompt: !isStandalone,
      installMethod: isIOS
        ? "MANUAL (Share → Add to Home Screen)"
        : "AUTO (beforeinstallprompt)",
    };
  }

  // ═══════════════════════════════════
  // 6. SECURITY HEADERS GENERATOR
  // ═══════════════════════════════════
  function generateSecurityHeaders() {
    return {
      global: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
      serviceWorker: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        {
          key: "Content-Security-Policy",
          value: "default-src 'self'; script-src 'self'",
        },
      ],
    };
  }

  // ═══════════════════════════════════
  // 7. PWA READINESS CHECKER
  // ═══════════════════════════════════
  function checkReadiness(config) {
    var checks = [
      { name: "manifest.json", ok: !!config.manifest },
      { name: "HTTPS", ok: !!config.https },
      { name: "Service Worker", ok: !!config.serviceWorker },
      { name: "Icons (192+512)", ok: !!config.icons },
      { name: "VAPID Keys", ok: !!config.vapidKeys },
    ];

    var passed = 0;
    for (var i = 0; i < checks.length; i++) {
      if (checks[i].ok) passed++;
    }

    return {
      checks: checks,
      passed: passed,
      total: checks.length,
      ready: passed === checks.length,
      grade:
        passed === 5
          ? "A (Installable!)"
          : passed >= 3
            ? "B (Almost!)"
            : "C (Not Ready!)",
    };
  }

  // ═══════════════════════════════════
  // 8. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  PWA ENGINE DEMO                    ║");
    console.log("╚════════════════════════════════════╝");

    // Manifest
    console.log("\n── Manifest ──");
    var m = generateManifest({
      name: "My App",
      shortName: "App",
      description: "A cool PWA",
      themeColor: "#4a90d9",
    });
    console.log("  name: " + m.name);
    console.log("  display: " + m.display);
    console.log("  icons: " + m.icons.length + " sizes");

    // Push subscription
    console.log("\n── Push Subscriptions ──");
    subscribe("user-1", {
      endpoint: "https://fcm.googleapis.com/...",
      keys: { p256dh: "abc", auth: "xyz" },
    });
    subscribe("user-2", {
      endpoint: "https://updates.push.services.mozilla.com/...",
      keys: { p256dh: "def", auth: "uvw" },
    });

    // Send notification
    var result = sendNotification("user-1", {
      title: "New Message",
      body: "You have 3 new messages!",
    });
    console.log("  Sent: " + result.success + " → " + result.payload.title);

    // Broadcast
    var bc = broadcastNotification({
      title: "Update!",
      body: "New features available!",
    });
    console.log("  Broadcast: " + bc.sent + " users");

    // Install detection
    console.log("\n── Install Detection ──");
    var ios = detectInstallState("iPhone OS 16_4");
    var android = detectInstallState("Android 13");
    console.log("  iOS: " + ios.installMethod);
    console.log("  Android: " + android.installMethod);

    // PWA Readiness
    console.log("\n── PWA Readiness ──");
    var ready = checkReadiness({
      manifest: true,
      https: true,
      serviceWorker: true,
      icons: true,
      vapidKeys: false,
    });
    console.log(
      "  Score: " + ready.passed + "/" + ready.total + " (" + ready.grade + ")",
    );
    for (var i = 0; i < ready.checks.length; i++) {
      var c = ready.checks[i];
      console.log("  " + (c.ok ? "✅" : "❌") + " " + c.name);
    }
  }

  return { demo: demo };
})();
// Chạy: PWAEngine.demo();
```

---

## §7. Câu Hỏi Luyện Tập!

**Câu 1**: PWA cần gì tối thiểu để installable trên home screen?

<details><summary>Đáp án</summary>

**2 yêu cầu tối thiểu**:

1. **Valid Web App Manifest** (`app/manifest.ts`) với: `name`, `short_name`, `start_url`, `display: 'standalone'`, icons (192x192 + 512x512)
2. **HTTPS** — website phải serve qua HTTPS!

**Browser tự động** hiển thị install prompt khi 2 điều kiện đã đáp ứng!

**iOS riêng**: KHÔNG có auto install prompt!
→ Phải hướng dẫn user: Share button (⎋) → "Add to Home Screen" (➕)
→ Dùng `InstallPrompt` component detect iOS + hiển thị instructions

</details>

---

**Câu 2**: Web Push flow từ subscribe tới hiển thị notification?

<details><summary>Đáp án</summary>

```
8-step flow:
① navigator.serviceWorker.register('/sw.js')
② pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC })
③ Client → Server Action: subscribeUser(subscription)
④ Server: lưu subscription vào database
⑤ Khi cần gửi: webpush.sendNotification(subscription, payload)
⑥ Push Service (Google/Apple) → deliver tới browser
⑦ SW 'push' event → self.registration.showNotification()
⑧ User click → SW 'notificationclick' → clients.openWindow()
```

**Key pieces**: VAPID keys (xác thực server), `web-push` library (gửi từ server), Service Worker (nhận và hiển thị), Push Service (trung gian delivery).

</details>

---

**Câu 3**: Service Worker cần security headers gì và tại sao?

<details><summary>Đáp án</summary>

| Header            | Value                                   | Tại sao?                                                                                           |
| ----------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Content-Type**  | `application/javascript; charset=utf-8` | Đảm bảo browser parse SW đúng là JS!                                                               |
| **Cache-Control** | `no-cache, no-store, must-revalidate`   | **KHÔNG CACHE SW!** User luôn nhận bản mới nhất! Nếu cache → stuck với SW cũ, bugs không fix được! |
| **CSP**           | `default-src 'self'; script-src 'self'` | SW CHỈ load scripts từ same origin! Ngăn chặn injection!                                           |

**Quan trọng nhất**: `Cache-Control: no-cache` — vì SW kiểm soát TOÀN BỘ network requests. SW cũ = app cũ cho TẤT CẢ users!

</details>

---

**Câu 4**: Khi nào dùng Static Export cho PWA? Lưu ý gì?

<details><summary>Đáp án</summary>

**Khi nào**: App không cần server → deploy lên CDN/static hosting (GitHub Pages, Netlify, etc.)

**Config**:

```javascript
// next.config.js
module.exports = {
  output: "export",
};
```

**Lưu ý quan trọng**:

1. **Server Actions → KHÔNG hoạt động!** Phải chuyển thành gọi external API
2. **Security headers** → Chuyển config vào proxy/hosting platform (không có `next.config.js` headers runtime!)
3. **Offline Support** → Dùng Serwist library (requires webpack config)
4. **Dynamic routes** → Phải dùng `generateStaticParams()` cho tất cả routes

</details>
