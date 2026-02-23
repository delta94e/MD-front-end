# Next.js Third Party Libraries — Deep Dive!

> **Chủ đề**: @next/third-parties — Tối Ưu Third-Party Libraries!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/third-party-libraries
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — @next/third-parties!](#1)
2. [§2. Google Tag Manager!](#2)
3. [§3. Google Analytics!](#3)
4. [§4. Google Maps Embed!](#4)
5. [§5. YouTube Embed!](#5)
6. [§6. Tự Viết — ThirdPartiesEngine!](#6)
7. [§7. Câu Hỏi Luyện Tập](#7)

---

## §1. Tổng Quan — @next/third-parties!

```
  @next/third-parties:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  WHAT: Collection of OPTIMIZED components for popular      │
  │        third-party libraries in Next.js!                   │
  │                                                            │
  │  WHY NEEDED?                                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ WITHOUT @next/third-parties:                         │  │
  │  │ ┌──────────────────────────────────────────┐         │  │
  │  │ │ <script src="gtm.js" />       ← blocking!│        │  │
  │  │ │ <script src="analytics.js" /> ← blocking!│        │  │
  │  │ │ <iframe src="maps" />          ← heavy!  │        │  │
  │  │ │ <iframe src="youtube" />       ← heavy!  │        │  │
  │  │ │ → Performance ❌ LCP/FID impact!        │        │  │
  │  │ └──────────────────────────────────────────┘         │  │
  │  │                                                      │  │
  │  │ WITH @next/third-parties:                            │  │
  │  │ ┌──────────────────────────────────────────┐         │  │
  │  │ │ <GoogleTagManager />   ← after hydration!│        │  │
  │  │ │ <GoogleAnalytics />    ← after hydration!│        │  │
  │  │ │ <GoogleMapsEmbed />    ← lazy-loaded!    │        │  │
  │  │ │ <YouTubeEmbed />       ← lite-youtube!   │        │  │
  │  │ │ → Performance ✅ Optimized loading!      │        │  │
  │  │ └──────────────────────────────────────────┘         │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  INSTALL:                                                   │
  │  pnpm add @next/third-parties@latest next@latest           │
  │  (⚠️ experimental, active development!)                   │
  │                                                            │
  │  4 COMPONENTS:                                              │
  │  ┌────────────────────┬─────────────────────────────────┐  │
  │  │ Component          │ Purpose                         │  │
  │  ├────────────────────┼─────────────────────────────────┤  │
  │  │ GoogleTagManager   │ GTM container! Tracking tags!   │  │
  │  │ GoogleAnalytics    │ GA4! Page views + events!       │  │
  │  │ GoogleMapsEmbed    │ Google Maps! Lazy-loaded!       │  │
  │  │ YouTubeEmbed       │ YouTube video! lite-embed!      │  │
  │  └────────────────────┴─────────────────────────────────┘  │
  │                                                            │
  │  ALL imported from:                                         │
  │  @next/third-parties/google                                │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Google Tag Manager!

```
  GTM — GOOGLE TAG MANAGER:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  WHAT: Container for ALL tracking tags!                    │
  │  (GA, Ads, Facebook Pixel, etc → managed from GTM!)        │
  │                                                            │
  │  LOADING STRATEGY:                                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Page loads → React hydrates → THEN fetch gtm.js!    │  │
  │  │ → NOT blocking! After hydration!                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ① ALL ROUTES (root layout!):                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // app/layout.tsx                                    │  │
  │  │ import { GoogleTagManager }                          │  │
  │  │   from '@next/third-parties/google'                  │  │
  │  │                                                      │  │
  │  │ export default function RootLayout({ children }) {   │  │
  │  │   return (                                           │  │
  │  │     <html lang="en">                                 │  │
  │  │       <GoogleTagManager gtmId="GTM-XYZ" />          │  │
  │  │       <body>{children}</body>                        │  │
  │  │     </html>                                          │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② SINGLE ROUTE (page!):                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // app/special/page.tsx                              │  │
  │  │ export default function Page() {                     │  │
  │  │   return <GoogleTagManager gtmId="GTM-XYZ" />       │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ SEND EVENTS (Client Component!):                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ 'use client'                    ← MUST be client!   │  │
  │  │ import { sendGTMEvent }                              │  │
  │  │   from '@next/third-parties/google'                  │  │
  │  │                                                      │  │
  │  │ export function EventButton() {                      │  │
  │  │   return (                                           │  │
  │  │     <button onClick={() => sendGTMEvent({            │  │
  │  │       event: 'buttonClicked',                        │  │
  │  │       value: 'xyz',                                  │  │
  │  │     })}>                                             │  │
  │  │       Send Event                                     │  │
  │  │     </button>                                        │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → Push to dataLayer! GTM picks up!                  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  OPTIONS:                                                   │
  │  ┌──────────────────┬─────────────────────────────────┐    │
  │  │ Prop             │ Purpose                         │    │
  │  ├──────────────────┼─────────────────────────────────┤    │
  │  │ gtmId            │ GTM container ID (GTM-XXX)      │    │
  │  │ gtmScriptUrl     │ Custom GTM script URL           │    │
  │  │                  │ (server-side tagging!)          │    │
  │  │ dataLayer        │ Initial dataLayer values!       │    │
  │  │ dataLayerName    │ Custom name (default:dataLayer) │    │
  │  │ auth             │ gtm_auth parameter!             │    │
  │  │ preview          │ gtm_preview parameter!          │    │
  │  └──────────────────┴─────────────────────────────────┘    │
  │                                                            │
  │  ⚠️ gtmId can be OMITTED if gtmScriptUrl provided!       │
  │  (Google tag gateway for advertisers!)                     │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. Google Analytics!

```
  GA4 — GOOGLE ANALYTICS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  WHAT: Google Analytics 4 via gtag.js!                     │
  │  LOADING: After hydration (like GTM!)                       │
  │                                                            │
  │  💡 TIP: If using GTM → configure GA INSIDE GTM!          │
  │  No need for separate <GoogleAnalytics /> component!       │
  │                                                            │
  │  ① ALL ROUTES:                                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // app/layout.tsx                                    │  │
  │  │ import { GoogleAnalytics }                           │  │
  │  │   from '@next/third-parties/google'                  │  │
  │  │                                                      │  │
  │  │ export default function RootLayout({ children }) {   │  │
  │  │   return (                                           │  │
  │  │     <html lang="en">                                 │  │
  │  │       <body>{children}</body>                        │  │
  │  │       <GoogleAnalytics gaId="G-XYZ" />               │  │
  │  │     </html>                                          │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② SEND EVENTS:                                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ 'use client'                                         │  │
  │  │ import { sendGAEvent }                               │  │
  │  │   from '@next/third-parties/google'                  │  │
  │  │                                                      │  │
  │  │ <button onClick={() => sendGAEvent(                  │  │
  │  │   'event',           // ← action type!              │  │
  │  │   'buttonClicked',   // ← event name!               │  │
  │  │   { value: 'xyz' }   // ← parameters!               │  │
  │  │ )}>                                                  │  │
  │  │   Send Event                                         │  │
  │  │ </button>                                            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ PAGEVIEW TRACKING — AUTOMATIC!                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Browser history changes → GA auto-tracks! ✅        │  │
  │  │ Next.js client navigation → pageview sent! ✅       │  │
  │  │                                                      │  │
  │  │ Requirements:                                        │  │
  │  │  ① "Enhanced Measurement" enabled in GA Admin!      │  │
  │  │  ② "Page changes based on browser history events"   │  │
  │  │     checkbox: ✅ selected!                          │  │
  │  │                                                      │  │
  │  │ ⚠️ If manual pageviews → disable default first!    │  │
  │  │    (avoid duplicate data!)                           │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  OPTIONS:                                                   │
  │  ┌──────────────────┬─────────────────────────────────┐    │
  │  │ Prop             │ Purpose                         │    │
  │  ├──────────────────┼─────────────────────────────────┤    │
  │  │ gaId             │ Measurement ID (G-XXX)          │    │
  │  │ dataLayerName    │ Custom name (default:dataLayer) │    │
  │  │ nonce            │ CSP nonce for security!         │    │
  │  └──────────────────┴─────────────────────────────────┘    │
  │                                                            │
  │  GTM vs GA — WHEN TO USE:                                   │
  │  ┌──────────────────────┬──────────────────────────────┐   │
  │  │ GTM                  │ GA (standalone)              │   │
  │  ├──────────────────────┼──────────────────────────────┤   │
  │  │ Multiple tags (GA +  │ Only GA needed!              │   │
  │  │ Ads + FB Pixel!)     │ Simple setup!                │   │
  │  │ Non-developer can    │ Developer manages code!      │   │
  │  │ manage tags!         │                              │   │
  │  │ Tag versioning!      │ No container overhead!       │   │
  │  │ → Choose GTM if     │ → Choose GA if only         │   │
  │  │   multiple tracking! │   analytics needed!          │   │
  │  └──────────────────────┴──────────────────────────────┘   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Google Maps Embed!

```
  GOOGLE MAPS EMBED:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  LOADING: lazy-load by default! (loading attribute!)     │
  │  → Only loads when user scrolls near the map!           │
  │                                                          │
  │  USAGE:                                                   │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ import { GoogleMapsEmbed }                           ││
  │  │   from '@next/third-parties/google'                  ││
  │  │                                                      ││
  │  │ export default function Page() {                     ││
  │  │   return (                                           ││
  │  │     <GoogleMapsEmbed                                 ││
  │  │       apiKey="XYZ"             // API key!           ││
  │  │       height={200}             // Height px!         ││
  │  │       width="100%"             // Full width!        ││
  │  │       mode="place"             // Map mode!          ││
  │  │       q="Brooklyn+Bridge,New+York,NY" // Query!      ││
  │  │     />                                               ││
  │  │   )                                                  ││
  │  │ }                                                    ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  OPTIONS:                                                 │
  │  ┌──────────────────┬─────────────────────────────────┐  │
  │  │ Prop             │ Purpose                         │  │
  │  ├──────────────────┼─────────────────────────────────┤  │
  │  │ apiKey ⭐        │ Google Maps API key! (required!)│  │
  │  │ mode ⭐          │ place/view/directions/          │  │
  │  │                  │ streetview/search!               │  │
  │  │ height           │ Embed height! (default: auto)   │  │
  │  │ width            │ Embed width! (default: auto)    │  │
  │  │ style            │ Custom CSS styles!              │  │
  │  │ allowfullscreen  │ Allow fullscreen!               │  │
  │  │ loading          │ lazy (default!) / eager!        │  │
  │  │ q                │ Search query! (place mode!)     │  │
  │  │ center           │ Map center coordinates!         │  │
  │  │ zoom             │ Zoom level!                     │  │
  │  │ maptype          │ roadmap / satellite!            │  │
  │  │ language         │ Language code! (en, vi, etc!)   │  │
  │  │ region           │ Region bias!                    │  │
  │  └──────────────────┴─────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. YouTube Embed!

```
  YOUTUBE EMBED:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  FAST LOADING: Uses lite-youtube-embed! ⚡               │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ Normal <iframe>:                                     ││
  │  │   → Load FULL YouTube player JS! (~800KB!)          ││
  │  │   → Slows page load significantly!                  ││
  │  │                                                      ││
  │  │ lite-youtube-embed:                                  ││
  │  │   → Show THUMBNAIL only! (~15KB!)                   ││
  │  │   → User clicks → THEN load full player!           ││
  │  │   → Performance boost!!! ⚡                        ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  USAGE:                                                   │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ import { YouTubeEmbed }                              ││
  │  │   from '@next/third-parties/google'                  ││
  │  │                                                      ││
  │  │ export default function Page() {                     ││
  │  │   return (                                           ││
  │  │     <YouTubeEmbed                                    ││
  │  │       videoid="ogfYd705cRs"    // Video ID!          ││
  │  │       height={400}              // Height!            ││
  │  │       params="controls=0"       // Player params!    ││
  │  │     />                                               ││
  │  │   )                                                  ││
  │  │ }                                                    ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  OPTIONS:                                                 │
  │  ┌──────────────────┬─────────────────────────────────┐  │
  │  │ Prop             │ Purpose                         │  │
  │  ├──────────────────┼─────────────────────────────────┤  │
  │  │ videoid ⭐       │ YouTube video ID! (required!)   │  │
  │  │ width            │ Width! (default: auto)          │  │
  │  │ height           │ Height! (default: auto)         │  │
  │  │ playlabel        │ Accessible label for play btn!  │  │
  │  │ params           │ Player params string!           │  │
  │  │                  │ "controls=0&start=10&end=30"    │  │
  │  │ style            │ Custom CSS styles!              │  │
  │  └──────────────────┴─────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — ThirdPartiesEngine!

```javascript
var ThirdPartiesEngine = (function () {
  // ═══════════════════════════════════
  // 1. SCRIPT LOADER (after hydration!)
  // ═══════════════════════════════════
  var loadedScripts = [];
  var hydrated = false;

  function simulateHydration() {
    hydrated = true;
    console.log("  React hydrated! ✅");
    // Load pending scripts
    for (var i = 0; i < pendingScripts.length; i++) {
      loadScript(pendingScripts[i]);
    }
    pendingScripts = [];
  }

  var pendingScripts = [];

  function loadScript(config) {
    if (!hydrated) {
      pendingScripts.push(config);
      return { status: "QUEUED", reason: "Waiting for hydration!" };
    }
    loadedScripts.push(config);
    return { status: "LOADED", src: config.src, name: config.name };
  }

  // ═══════════════════════════════════
  // 2. GoogleTagManager
  // ═══════════════════════════════════
  var dataLayers = {};

  function GoogleTagManager(options) {
    var gtmId = options.gtmId;
    var scriptUrl =
      options.gtmScriptUrl || "https://www.googletagmanager.com/gtm.js";
    var layerName = options.dataLayerName || "dataLayer";

    // Initialize dataLayer
    dataLayers[layerName] = options.dataLayer || [];

    var result = loadScript({
      name: "GoogleTagManager",
      src: scriptUrl + "?id=" + gtmId,
      gtmId: gtmId,
    });

    return {
      component: "GoogleTagManager",
      gtmId: gtmId,
      dataLayer: dataLayers[layerName],
      loadStatus: result.status,
    };
  }

  function sendGTMEvent(eventData) {
    var layer = dataLayers["dataLayer"] || [];
    layer.push(eventData);
    return {
      pushed: true,
      event: eventData,
      dataLayerSize: layer.length,
    };
  }

  // ═══════════════════════════════════
  // 3. GoogleAnalytics
  // ═══════════════════════════════════
  var gaEvents = [];

  function GoogleAnalytics(options) {
    var gaId = options.gaId;

    var result = loadScript({
      name: "GoogleAnalytics",
      src: "https://www.googletagmanager.com/gtag/js?id=" + gaId,
      gaId: gaId,
    });

    return {
      component: "GoogleAnalytics",
      gaId: gaId,
      loadStatus: result.status,
      autoPageview: true, // Browser history changes!
    };
  }

  function sendGAEvent(action, eventName, params) {
    var event = {
      action: action,
      name: eventName,
      params: params || {},
      timestamp: Date.now(),
    };
    gaEvents.push(event);
    return { sent: true, event: event, totalEvents: gaEvents.length };
  }

  // ═══════════════════════════════════
  // 4. GoogleMapsEmbed
  // ═══════════════════════════════════
  function GoogleMapsEmbed(options) {
    var apiKey = options.apiKey;
    var mode = options.mode || "place";
    var loading = options.loading || "lazy";

    var src = "https://www.google.com/maps/embed/v1/" + mode + "?key=" + apiKey;

    if (options.q) src += "&q=" + encodeURIComponent(options.q);
    if (options.center) src += "&center=" + options.center;
    if (options.zoom) src += "&zoom=" + options.zoom;
    if (options.maptype) src += "&maptype=" + options.maptype;
    if (options.language) src += "&language=" + options.language;

    return {
      component: "GoogleMapsEmbed",
      tag: "iframe",
      src: src,
      width: options.width || "auto",
      height: options.height || "auto",
      loading: loading, // lazy = performance!
      mode: mode,
    };
  }

  // ═══════════════════════════════════
  // 5. YouTubeEmbed (lite!)
  // ═══════════════════════════════════
  function YouTubeEmbed(options) {
    var videoid = options.videoid;
    var thumbnailUrl = "https://i.ytimg.com/vi/" + videoid + "/hqdefault.jpg";
    var playerUrl = "https://www.youtube.com/embed/" + videoid;

    if (options.params) playerUrl += "?" + options.params;

    return {
      component: "YouTubeEmbed",
      strategy: "lite-youtube-embed",
      thumbnail: {
        src: thumbnailUrl,
        size: "~15KB",
        loaded: "IMMEDIATELY",
      },
      player: {
        src: playerUrl,
        size: "~800KB",
        loaded: "ON CLICK", // lazy!
      },
      width: options.width || "auto",
      height: options.height || "auto",
      playlabel: options.playlabel || "Play",
    };
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  THIRD-PARTIES ENGINE DEMO          ║");
    console.log("╚════════════════════════════════════╝");

    // Before hydration
    console.log("\n── Before Hydration ──");
    var gtm1 = GoogleTagManager({ gtmId: "GTM-ABC123" });
    console.log("  GTM:", gtm1.loadStatus); // QUEUED!

    var ga1 = GoogleAnalytics({ gaId: "G-XYZ789" });
    console.log("  GA:", ga1.loadStatus); // QUEUED!

    // Hydrate!
    console.log("\n── Hydration ──");
    simulateHydration();
    console.log("  Scripts loaded:", loadedScripts.length);

    // After hydration
    console.log("\n── After Hydration ──");
    var gtm2 = GoogleTagManager({ gtmId: "GTM-DEF456" });
    console.log("  GTM:", gtm2.loadStatus); // LOADED!

    // GTM Events
    console.log("\n── GTM Events ──");
    var e1 = sendGTMEvent({ event: "pageView", page: "/" });
    console.log(
      "  Event 1:",
      e1.event.event,
      "→ layer size:",
      e1.dataLayerSize,
    );
    var e2 = sendGTMEvent({ event: "buttonClicked", value: "xyz" });
    console.log(
      "  Event 2:",
      e2.event.event,
      "→ layer size:",
      e2.dataLayerSize,
    );

    // GA Events
    console.log("\n── GA Events ──");
    var g1 = sendGAEvent("event", "page_view", { page: "/home" });
    console.log("  GA Event:", g1.event.name, "→ total:", g1.totalEvents);
    var g2 = sendGAEvent("event", "buttonClicked", { value: "abc" });
    console.log("  GA Event:", g2.event.name, "→ total:", g2.totalEvents);

    // Maps
    console.log("\n── Google Maps ──");
    var map = GoogleMapsEmbed({
      apiKey: "MY_KEY",
      mode: "place",
      q: "Brooklyn Bridge, New York",
      height: 200,
      width: "100%",
    });
    console.log(
      "  Mode:",
      map.mode,
      "| Loading:",
      map.loading,
      "| Size:",
      map.width,
      "×",
      map.height,
    );

    // YouTube
    console.log("\n── YouTube Embed ──");
    var yt = YouTubeEmbed({
      videoid: "ogfYd705cRs",
      height: 400,
      params: "controls=0",
    });
    console.log("  Strategy:", yt.strategy);
    console.log("  Thumbnail:", yt.thumbnail.size, "→", yt.thumbnail.loaded);
    console.log("  Player:", yt.player.size, "→", yt.player.loaded);

    // Summary
    console.log("\n── Summary ──");
    console.log("  Scripts loaded:", loadedScripts.length);
    console.log(
      "  GTM dataLayer size:",
      (dataLayers["dataLayer"] || []).length,
    );
    console.log("  GA events:", gaEvents.length);
  }

  return { demo: demo };
})();
// Chạy: ThirdPartiesEngine.demo();
```

---

## §7. Câu Hỏi Luyện Tập!

**Câu 1**: @next/third-parties — tải scripts KHI NÀO?

<details><summary>Đáp án</summary>

```
GoogleTagManager + GoogleAnalytics:
  → Load AFTER hydration!
  → Page HTML renders first ✅
  → React hydrates ✅
  → THEN fetch gtm.js / gtag.js!
  → NOT blocking initial paint! ⚡

GoogleMapsEmbed:
  → lazy-load by default!
  → Loading attribute = "lazy"!
  → Only loads when user SCROLLS near the map!

YouTubeEmbed:
  → lite-youtube-embed strategy!
  → Show thumbnail (~15KB) first ✅
  → User CLICKS → then load full player (~800KB)!
  → Massive perf improvement! ⚡
```

</details>

---

**Câu 2**: `sendGTMEvent` vs `sendGAEvent` — khác nhau?

<details><summary>Đáp án</summary>

|                  | sendGTMEvent                     | sendGAEvent                          |
| ---------------- | -------------------------------- | ------------------------------------ |
| **Component**    | `<GoogleTagManager />`           | `<GoogleAnalytics />`                |
| **Target**       | dataLayer object!                | gtag() function!                     |
| **API**          | `sendGTMEvent({ event, value })` | `sendGAEvent('event', name, params)` |
| **Params**       | 1 object!                        | 3 args (action, name, params)!       |
| **Use with**     | GTM container                    | GA4 directly                         |
| **Prerequisite** | `'use client'`                   | `'use client'`                       |

**Rule**: Both need `'use client'` directive! (onClick = client interaction!)

</details>

---

**Câu 3**: GA4 — pageview tracking tự động hay manual?

<details><summary>Đáp án</summary>

```
AUTOMATIC! ✅

How:
  Browser history state changes
    → GA4 detects automatically!
    → Next.js client navigation = history.pushState()
    → GA4 sends pageview! ✅

Requirements:
  ① GA Admin → "Enhanced Measurement" → ENABLE!
  ② Checkbox: "Page changes based on browser
     history events" → SELECTED!

⚠️ WARNING:
  If you add manual pageview tracking:
    → DISABLE default measurement first!
    → Otherwise: DUPLICATE pageview data! ❌
```

</details>

---

**Câu 4**: YouTubeEmbed — tại sao dùng `lite-youtube-embed`?

<details><summary>Đáp án</summary>

|                       | Normal `<iframe>`          | lite-youtube-embed        |
| --------------------- | -------------------------- | ------------------------- |
| **Initial load**      | ~800KB YouTube player JS!  | ~15KB thumbnail!          |
| **When loads player** | IMMEDIATELY (blocking!)    | ON CLICK (lazy!)          |
| **LCP impact**        | ❌ Heavy! Slower LCP!      | ✅ Minimal! Fast LCP!     |
| **User experience**   | Video ready but page slow! | Page fast, click to play! |

**Summary**: lite-youtube-embed = show image first, load player on demand → **massive performance boost!**

</details>
