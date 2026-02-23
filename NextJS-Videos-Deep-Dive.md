# Next.js Videos — Deep Dive!

> **Chủ đề**: Videos — Tối Ưu Video Trong Next.js!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/videos
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Video Trong Next.js!](#1)
2. [§2. `<video>` Tag — Self-Hosted!](#2)
3. [§3. `<iframe>` Tag — External Platforms!](#3)
4. [§4. Chọn Method Nào?](#4)
5. [§5. Embedding External Videos — Suspense!](#5)
6. [§6. Self-Hosted Videos — Vercel Blob!](#6)
7. [§7. Subtitles — `<track>` Element!](#7)
8. [§8. Resources — 5 Platforms!](#8)
9. [§9. Tự Viết — VideoEngine!](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. Tổng Quan — Video Trong Next.js!

```
  VIDEO IN NEXT.JS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  2 WAYS TO EMBED VIDEO:                                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │   ┌───────────────┐        ┌───────────────┐        │  │
  │  │   │  <video>      │        │  <iframe>     │        │  │
  │  │   │  Self-hosted! │        │  YouTube/     │        │  │
  │  │   │  Full control!│        │  Vimeo/etc!   │        │  │
  │  │   └───────┬───────┘        └───────┬───────┘        │  │
  │  │           │                        │                 │  │
  │  │   ┌───────▼───────┐        ┌───────▼───────┐        │  │
  │  │   │ Your server / │        │ External      │        │  │
  │  │   │ Vercel Blob / │        │ platform      │        │  │
  │  │   │ public/       │        │ hosts video!  │        │  │
  │  │   └───────────────┘        └───────────────┘        │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  KEY GOAL: Display videos WITHOUT hurting performance!     │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. `<video>` Tag — Self-Hosted!

```
  <video> — SELF-HOSTED VIDEO:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  USE WHEN: Full control over playback + appearance!        │
  │                                                            │
  │  EXAMPLE:                                                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ export function Video() {                            │  │
  │  │   return (                                           │  │
  │  │     <video                                           │  │
  │  │       width="320"                                    │  │
  │  │       height="240"                                   │  │
  │  │       controls                                       │  │
  │  │       preload="none"                                 │  │
  │  │     >                                                │  │
  │  │       <source                                        │  │
  │  │         src="/path/to/video.mp4"                     │  │
  │  │         type="video/mp4"                             │  │
  │  │       />                                             │  │
  │  │       <track                                         │  │
  │  │         src="/path/to/captions.vtt"                  │  │
  │  │         kind="subtitles"                             │  │
  │  │         srcLang="en"                                 │  │
  │  │         label="English"                              │  │
  │  │       />                                             │  │
  │  │       Your browser does not support the video tag.   │  │
  │  │     </video>                                         │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  8 ATTRIBUTES:                                              │
  │  ┌──────────────┬──────────────────────────────────────┐   │
  │  │ Attribute    │ Purpose                              │   │
  │  ├──────────────┼──────────────────────────────────────┤   │
  │  │ src          │ Video source URL!                    │   │
  │  │ width        │ Video width (px)!                    │   │
  │  │ height       │ Video height (px)!                   │   │
  │  │ controls     │ Show play/pause/volume controls!     │   │
  │  │ autoPlay     │ Auto-start playback!                 │   │
  │  │ loop         │ Loop continuously!                   │   │
  │  │ muted        │ Start muted! (REQUIRED for autoPlay!)│   │
  │  │ preload      │ none / metadata / auto!              │   │
  │  │              │ → none = DON'T preload! (perf!) ⚡  │   │
  │  │ playsInline  │ Inline playback on iOS! (no FS!)     │   │
  │  └──────────────┴──────────────────────────────────────┘   │
  │                                                            │
  │  ⚠️ autoPlay TIP:                                        │
  │  autoPlay + muted + playsInline → ALL 3 TOGETHER!         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ <video autoPlay muted playsInline>                   │  │
  │  │                                                      │  │
  │  │ autoPlay alone      → Most browsers BLOCK! ❌      │  │
  │  │ autoPlay + muted    → Browsers allow! ✅           │  │
  │  │ + playsInline       → iOS compatibility! ✅        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  3 BEST PRACTICES:                                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Fallback Content:                                 │  │
  │  │   → Text inside <video> for unsupported browsers!  │  │
  │  │   "Your browser does not support the video tag."    │  │
  │  │                                                      │  │
  │  │ ② Subtitles/Captions:                               │  │
  │  │   → <track> element for deaf/hearing impaired!      │  │
  │  │   → VTT file format! (WebVTT)                      │  │
  │  │                                                      │  │
  │  │ ③ Accessible Controls:                              │  │
  │  │   → HTML5 controls = keyboard + screen reader! ✅  │  │
  │  │   → Advanced: react-player or video.js!             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. `<iframe>` Tag — External Platforms!

```
  <iframe> — EXTERNAL VIDEOS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  USE WHEN: YouTube, Vimeo, etc!                           │
  │                                                          │
  │  EXAMPLE:                                                 │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ export default function Page() {                     ││
  │  │   return (                                           ││
  │  │     <iframe                                          ││
  │  │       src="https://www.youtube.com/embed/19g66ezsKAg"││
  │  │       allowFullScreen                                ││
  │  │     />                                               ││
  │  │   )                                                  ││
  │  │ }                                                    ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  7 ATTRIBUTES:                                            │
  │  ┌──────────────────┬──────────────────────────────┐     │
  │  │ Attribute        │ Purpose                      │     │
  │  ├──────────────────┼──────────────────────────────┤     │
  │  │ src              │ Video embed URL!             │     │
  │  │ width            │ Iframe width!                │     │
  │  │ height           │ Iframe height!               │     │
  │  │ allowFullScreen  │ Allow fullscreen mode!       │     │
  │  │ sandbox          │ Security restrictions!       │     │
  │  │ loading          │ lazy = defer loading! ⚡    │     │
  │  │ title            │ Accessible description!      │     │
  │  └──────────────────┴──────────────────────────────┘     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Chọn Method Nào?

```
  <video> vs <iframe> — DECISION:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌──────────────────────┬──────────────────────────┐     │
  │  │ <video> Self-hosted  │ <iframe> External        │     │
  │  ├──────────────────────┼──────────────────────────┤     │
  │  │ Full control over    │ Platform handles         │     │
  │  │ playback + UI!       │ everything!              │     │
  │  │ Custom styling!      │ Limited customization!   │     │
  │  │ Need own storage!    │ YouTube/Vimeo host free! │     │
  │  │ Need own bandwidth!  │ CDN built-in!            │     │
  │  │ Dynamic backgrounds! │ Embed & forget!          │     │
  │  │ Need encoding work!  │ Auto-adaptive quality!   │     │
  │  └──────────────────────┴──────────────────────────┘     │
  │                                                          │
  │  CHOOSE:                                                  │
  │  ① Need FULL CONTROL (player UI, CSS, events)?          │
  │     → <video> self-hosted!                               │
  │  ② Just SHOW a YouTube/Vimeo video?                      │
  │     → <iframe> external!                                 │
  │  ③ Dynamic background / hero video?                      │
  │     → <video autoPlay muted loop playsInline>            │
  │  ④ Video course / premium content?                       │
  │     → Self-hosted + DRM or Mux!                          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Embedding External Videos — Suspense!

```
  SERVER COMPONENT + SUSPENSE PATTERN:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  2-STEP PATTERN:                                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Step 1: Server Component (fetch + render iframe!)    │  │
  │  │ ┌──────────────────────────────────────────────┐     │  │
  │  │ │ // app/ui/VideoComponent.tsx                  │     │  │
  │  │ │ export default async function VideoComponent()│     │  │
  │  │ │ {                                             │     │  │
  │  │ │   const src = await getVideoSrc()             │     │  │
  │  │ │   //    ↑ Fetch from DB/CMS/API!             │     │  │
  │  │ │   return <iframe src={src} allowFullScreen /> │     │  │
  │  │ │ }                                             │     │  │
  │  │ └──────────────────────────────────────────────┘     │  │
  │  │                                                      │  │
  │  │ Step 2: Stream with Suspense (fallback!)             │  │
  │  │ ┌──────────────────────────────────────────────┐     │  │
  │  │ │ // app/page.tsx                               │     │  │
  │  │ │ import { Suspense } from 'react'              │     │  │
  │  │ │ import VideoComponent from '../ui/Video...'   │     │  │
  │  │ │                                               │     │  │
  │  │ │ export default function Page() {              │     │  │
  │  │ │   return (                                    │     │  │
  │  │ │     <section>                                 │     │  │
  │  │ │       <Suspense fallback={                    │     │  │
  │  │ │         <p>Loading video...</p>               │     │  │
  │  │ │       }>                                      │     │  │
  │  │ │         <VideoComponent />                    │     │  │
  │  │ │       </Suspense>                             │     │  │
  │  │ │     </section>                                │     │  │
  │  │ │   )                                           │     │  │
  │  │ │ }                                             │     │  │
  │  │ └──────────────────────────────────────────────┘     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FLOW:                                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Page renders → Fallback shown ("Loading video...")  │  │
  │  │       ▼                                              │  │
  │  │ User can INTERACT with rest of page! ✅            │  │
  │  │       ▼                                              │  │
  │  │ VideoComponent streams in → replaces fallback!      │  │
  │  │       ▼                                              │  │
  │  │ Video visible! ✅                                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  💡 BETTER UX: Use VideoSkeleton!                         │
  │  <Suspense fallback={<VideoSkeleton />}>                   │
  │    → Skeleton (gray box with play icon) instead of text!  │
  │    → Feels MORE professional!                             │
  │                                                            │
  │  RESPONSIVE TIP:                                            │
  │  → Use CSS to make iframe adapt to screen sizes!          │
  │  → Consider network conditions for loading strategy!      │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. Self-Hosted Videos — Vercel Blob!

```
  SELF-HOSTING:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  WHY SELF-HOST?                                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Complete control! (playback, appearance, DRM!)    │  │
  │  │ ② Customization! (dynamic backgrounds, custom UI!) │  │
  │  │ ③ Performance! (choose your CDN/storage!)           │  │
  │  │ ④ Cost balance! (storage + bandwidth vs features!)  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  VERCEL BLOB — SCALABLE CLOUD STORAGE:                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Upload (3 ways!):                                    │  │
  │  │  ① Dashboard → Storage → Blob → Upload button!    │  │
  │  │  ② Server action! (server-side upload!)             │  │
  │  │  ③ Client-side upload! (browser direct!)            │  │
  │  │                                                      │  │
  │  │ CDN: Automatic with Vercel Blob! ✅                 │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  DISPLAY WITH @vercel/blob:                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ import { Suspense } from 'react'                     │  │
  │  │ import { list } from '@vercel/blob'                  │  │
  │  │                                                      │  │
  │  │ export default function Page() {                     │  │
  │  │   return (                                           │  │
  │  │     <Suspense fallback={<p>Loading video...</p>}>    │  │
  │  │       <VideoComponent fileName="my-video.mp4" />     │  │
  │  │     </Suspense>                                      │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ async function VideoComponent({ fileName }) {        │  │
  │  │   const { blobs } = await list({                     │  │
  │  │     prefix: fileName,                                │  │
  │  │     limit: 1,                                        │  │
  │  │   })                                                 │  │
  │  │   const { url } = blobs[0]                           │  │
  │  │                                                      │  │
  │  │   return (                                           │  │
  │  │     <video controls preload="none"                   │  │
  │  │            aria-label="Video player">                │  │
  │  │       <source src={url} type="video/mp4" />          │  │
  │  │       Your browser does not support the video tag.   │  │
  │  │     </video>                                         │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FLOW:                                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Server Component                                     │  │
  │  │   ▼                                                  │  │
  │  │ list({ prefix: 'my-video.mp4' }) → Vercel Blob API │  │
  │  │   ▼                                                  │  │
  │  │ Get blob URL                                         │  │
  │  │   ▼                                                  │  │
  │  │ Render <video src={url} /> → stream to client!      │  │
  │  │   ▼                                                  │  │
  │  │ Suspense shows fallback while fetching! ✅          │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §7. Subtitles — `<track>` Element!

```
  SUBTITLES:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  <track> ELEMENT:                                         │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ async function VideoComponent({ fileName }) {        ││
  │  │   const { blobs } = await list({                     ││
  │  │     prefix: fileName,                                ││
  │  │     limit: 2,   // ← video + captions!             ││
  │  │   })                                                 ││
  │  │   const { url } = blobs[0]          // video!        ││
  │  │   const { url: captionsUrl } = blobs[1] // VTT!     ││
  │  │                                                      ││
  │  │   return (                                           ││
  │  │     <video controls preload="none"                   ││
  │  │            aria-label="Video player">                ││
  │  │       <source src={url} type="video/mp4" />          ││
  │  │       <track                                         ││
  │  │         src={captionsUrl}                             ││
  │  │         kind="subtitles"  // ← type!                ││
  │  │         srcLang="en"      // ← language!            ││
  │  │         label="English"   // ← display name!        ││
  │  │       />                                             ││
  │  │       Your browser does not support the video tag.   ││
  │  │     </video>                                         ││
  │  │   )                                                  ││
  │  │ }                                                    ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  <track> ATTRIBUTES:                                      │
  │  ┌──────────┬───────────────────────────────────────┐    │
  │  │ Attr     │ Purpose                               │    │
  │  ├──────────┼───────────────────────────────────────┤    │
  │  │ src      │ URL to VTT subtitle file!             │    │
  │  │ kind     │ subtitles / captions / descriptions!  │    │
  │  │ srcLang  │ Language code (en, vi, ja, etc!)      │    │
  │  │ label    │ Display name ("English", "Tiếng Việt")│    │
  │  └──────────┴───────────────────────────────────────┘    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. Resources — 5 Platforms + Optimization Tips!

```
  VIDEO OPTIMIZATION:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  4 OPTIMIZATION AREAS:                                      │
  │  ┌──────────────────┬──────────────────────────────────┐   │
  │  │ Area             │ Detail                           │   │
  │  ├──────────────────┼──────────────────────────────────┤   │
  │  │ Formats & codecs │ MP4 (compatibility!) vs          │   │
  │  │                  │ WebM (web optimized!)            │   │
  │  │ Compression      │ FFmpeg! Balance quality vs size! │   │
  │  │ Resolution       │ Lower for mobile devices!        │   │
  │  │ & bitrate        │ Adaptive = best experience!      │   │
  │  │ CDNs             │ Speed up delivery! Vercel Blob   │   │
  │  │                  │ has auto CDN! ✅                 │   │
  │  └──────────────────┴──────────────────────────────────┘   │
  │                                                            │
  │  5 STREAMING PLATFORMS:                                     │
  │  ┌──────────────────┬──────────────────────────────────┐   │
  │  │ Platform         │ Component & Features             │   │
  │  ├──────────────────┼──────────────────────────────────┤   │
  │  │ next-video       │ <Video> component! Open source!  │   │
  │  │ (next-video.dev) │ Works with Blob, S3, Backblaze,  │   │
  │  │                  │ and Mux!                         │   │
  │  │ Cloudinary       │ <CldVideoPlayer>! Drop-in!       │   │
  │  │                  │ Adaptive Bitrate Streaming!       │   │
  │  │                  │ Node.js SDK available!            │   │
  │  │ Mux              │ Video API! Starter template!     │   │
  │  │                  │ High-performance for Next.js!     │   │
  │  │ Fastly           │ CDN + Video on Demand!           │   │
  │  │                  │ Streaming media delivery!         │   │
  │  │ ImageKit.io      │ <IKVideo> component!             │   │
  │  │                  │ Node.js SDK available!            │   │
  │  └──────────────────┴──────────────────────────────────┘   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — VideoEngine!

```javascript
var VideoEngine = (function () {
  // ═══════════════════════════════════
  // 1. <video> ELEMENT BUILDER
  // ═══════════════════════════════════
  function createVideoElement(options) {
    var attrs = {
      tag: "video",
      src: options.src,
      width: options.width || 320,
      height: options.height || 240,
      controls: options.controls !== false,
      preload: options.preload || "none",
      autoPlay: options.autoPlay || false,
      muted: options.muted || false,
      loop: options.loop || false,
      playsInline: options.playsInline || false,
    };

    // autoPlay validation!
    if (attrs.autoPlay && !attrs.muted) {
      console.warn("  ⚠️ autoPlay without muted — browsers will BLOCK!");
      attrs.blocked = true;
    }
    if (attrs.autoPlay && !attrs.playsInline) {
      console.warn("  ⚠️ autoPlay without playsInline — iOS issue!");
    }

    return attrs;
  }

  // ═══════════════════════════════════
  // 2. <iframe> ELEMENT BUILDER
  // ═══════════════════════════════════
  function createIframeElement(options) {
    return {
      tag: "iframe",
      src: options.src,
      width: options.width || 560,
      height: options.height || 315,
      allowFullScreen: options.allowFullScreen !== false,
      loading: options.loading || "lazy",
      sandbox: options.sandbox || false,
      title: options.title || "Video",
    };
  }

  // ═══════════════════════════════════
  // 3. <track> SUBTITLE BUILDER
  // ═══════════════════════════════════
  function createTrack(options) {
    return {
      tag: "track",
      src: options.src,
      kind: options.kind || "subtitles",
      srcLang: options.srcLang || "en",
      label: options.label || "English",
    };
  }

  // ═══════════════════════════════════
  // 4. VERCEL BLOB SIMULATOR
  // ═══════════════════════════════════
  var blobStore = {};

  function blobUpload(fileName, data) {
    var url = "https://blob.vercel-storage.com/" + fileName;
    blobStore[fileName] = { url: url, size: data.size || 0 };
    return { uploaded: true, url: url, fileName: fileName };
  }

  function blobList(options) {
    var prefix = options.prefix || "";
    var limit = options.limit || 10;
    var matches = [];
    for (var key in blobStore) {
      if (key.indexOf(prefix) === 0 && matches.length < limit) {
        matches.push(blobStore[key]);
      }
    }
    return { blobs: matches };
  }

  // ═══════════════════════════════════
  // 5. SUSPENSE SIMULATOR
  // ═══════════════════════════════════
  function Suspense(options) {
    var fallback = options.fallback || "Loading...";
    var component = options.component;

    console.log('  [Suspense] Showing fallback: "' + fallback + '"');

    // Simulate async component fetch
    var result = component();

    console.log("  [Suspense] Component ready! Replacing fallback!");
    return result;
  }

  // ═══════════════════════════════════
  // 6. EMBEDDING METHOD CHOOSER
  // ═══════════════════════════════════
  function chooseMethod(requirements) {
    var result = {
      method: "",
      reasons: [],
    };

    if (requirements.fullControl) {
      result.method = "<video>";
      result.reasons.push("Full player control needed!");
    } else if (requirements.external) {
      result.method = "<iframe>";
      result.reasons.push("External platform (YouTube/Vimeo)!");
    }

    if (requirements.backgroundVideo) {
      result.method = "<video>";
      result.reasons.push("Background: autoPlay+muted+loop+playsInline!");
    }

    if (requirements.selfHosted) {
      result.reasons.push("Consider Vercel Blob for hosting!");
    }

    return result;
  }

  // ═══════════════════════════════════
  // 7. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  VIDEO ENGINE DEMO                  ║");
    console.log("╚════════════════════════════════════╝");

    // Self-hosted video
    console.log("\n── Self-Hosted <video> ──");
    var v1 = createVideoElement({
      src: "/videos/intro.mp4",
      width: 640,
      height: 360,
      controls: true,
      preload: "none",
    });
    console.log("  Tag:", v1.tag, "| Size:", v1.width + "x" + v1.height);
    console.log("  Preload:", v1.preload, "| Controls:", v1.controls);

    // autoPlay validation
    console.log("\n── autoPlay Validation ──");
    var v2 = createVideoElement({
      src: "/bg.mp4",
      autoPlay: true, // missing muted!
    });
    var v3 = createVideoElement({
      src: "/bg.mp4",
      autoPlay: true,
      muted: true,
      playsInline: true,
    });
    console.log("  ✅ Correct: autoPlay + muted + playsInline");

    // External iframe
    console.log("\n── External <iframe> ──");
    var iframe = createIframeElement({
      src: "https://www.youtube.com/embed/19g66ezsKAg",
      title: "Next.js Tutorial",
    });
    console.log("  Tag:", iframe.tag, "| Loading:", iframe.loading);
    console.log("  Title:", iframe.title);

    // Subtitles
    console.log("\n── Subtitles <track> ──");
    var track = createTrack({
      src: "/captions/en.vtt",
      srcLang: "en",
      label: "English",
    });
    console.log("  Kind:", track.kind, "| Lang:", track.srcLang);

    // Vercel Blob
    console.log("\n── Vercel Blob ──");
    blobUpload("my-video.mp4", { size: 15000000 });
    blobUpload("my-video.vtt", { size: 5000 });
    var blobs = blobList({ prefix: "my-video", limit: 2 });
    console.log("  Uploaded:", Object.keys(blobStore).length, "files");
    console.log("  Video URL:", blobs.blobs[0].url);

    // Suspense
    console.log("\n── Suspense Pattern ──");
    Suspense({
      fallback: "Loading video...",
      component: function () {
        return createVideoElement({
          src: blobs.blobs[0].url,
          controls: true,
          preload: "none",
        });
      },
    });

    // Method chooser
    console.log("\n── Method Chooser ──");
    var m1 = chooseMethod({ fullControl: true, selfHosted: true });
    console.log("  Full control →", m1.method, "|", m1.reasons.join(", "));
    var m2 = chooseMethod({ external: true });
    console.log("  External →", m2.method, "|", m2.reasons.join(", "));
    var m3 = chooseMethod({ backgroundVideo: true });
    console.log("  Background →", m3.method, "|", m3.reasons.join(", "));
  }

  return { demo: demo };
})();
// Chạy: VideoEngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

**Câu 1**: `<video>` vs `<iframe>` — khi nào dùng cái nào?

<details><summary>Đáp án</summary>

|              | `<video>`                       | `<iframe>`                   |
| ------------ | ------------------------------- | ---------------------------- |
| **Source**   | Self-hosted files!              | YouTube/Vimeo URLs!          |
| **Control**  | FULL (UI, CSS, events!)         | LIMITED (platform player!)   |
| **Storage**  | YOUR server/CDN!                | Platform hosts free!         |
| **Use case** | Custom player, background, DRM! | Quick embed, social sharing! |

**Rule**: Need control → `<video>`. Just display → `<iframe>`.

</details>

---

**Câu 2**: `autoPlay` — tại sao cần `muted` + `playsInline`?

<details><summary>Đáp án</summary>

```
autoPlay ALONE:
  → Browsers BLOCK! (anti-annoyance policy!)
  → Sound playing without user consent = BAD UX!

autoPlay + muted:
  → Browsers ALLOW! (muted = no surprise sound!)
  → ✅ Chrome, Firefox, Safari!

autoPlay + muted + playsInline:
  → iOS REQUIRES playsInline!
  → Without it: iOS opens fullscreen video player!
  → With it: plays INLINE in page! ✅

COMBINATION: <video autoPlay muted playsInline loop>
  → Background video pattern! (hero sections!)
```

</details>

---

**Câu 3**: Vercel Blob + Suspense — flow giải thích?

<details><summary>Đáp án</summary>

```
Flow:
  ① Page component renders → Suspense boundary!
  ② Fallback shown immediately: "Loading video..."
  ③ Server Component VideoComponent executes:
     → list({ prefix: 'my-video.mp4' })
     → Calls Vercel Blob API (server-side!)
     → Gets blob URL
  ④ VideoComponent returns <video src={blobUrl}>
  ⑤ Suspense replaces fallback with <video>!
  ⑥ User sees video player! ✅

KEY: User can interact with page DURING loading!
     → Non-blocking! Streaming SSR pattern!
```

</details>

---

**Câu 4**: 5 video platforms — khi nào dùng cái nào?

<details><summary>Đáp án</summary>

| Platform       | Use when...                                                             |
| -------------- | ----------------------------------------------------------------------- |
| **next-video** | Open source! Want simple `<Video>` component! Works with Blob, S3, Mux! |
| **Cloudinary** | Need ABR (Adaptive Bitrate)! Image + video CDN! Drop-in player!         |
| **Mux**        | Video course! High-performance API! Starter template!                   |
| **Fastly**     | CDN-focused! Video on demand + streaming! High traffic!                 |
| **ImageKit**   | Image + video combo! Simple `<IKVideo>` component! Node.js SDK!         |

</details>
