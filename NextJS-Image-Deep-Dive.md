# Next.js `Image` Component — Deep Dive!

> **Chủ đề**: `next/image` — Automatic Image Optimization!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/api-reference/components/image
> **Hình ảnh**: 3 diagrams trong trang gốc — TẤT CẢ được phân tích!

---

## Mục Lục

1. [§1. Tổng Quan — Image Component!](#1)
2. [§2. Props — Complete Reference!](#2)
3. [§3. Configuration Options!](#3)
4. [§4. Examples — 3 Diagrams Analysis!](#4)
5. [§5. Advanced — getImageProps + Art Direction!](#5)
6. [§6. Tự Viết — NextImageEngine!](#6)
7. [§7. Câu Hỏi Luyện Tập](#7)

---

## §1. Tổng Quan — Image Component!

```
  NEXT/IMAGE COMPONENT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT: Extends HTML <img> for AUTOMATIC image optimization!  │
  │                                                              │
  │  import Image from 'next/image'                              │
  │  <Image src="/photo.png" width={500} height={500}            │
  │         alt="Description" />                                 │
  │                                                              │
  │  WHAT IT DOES AUTOMATICALLY:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Format conversion  → WebP / AVIF (smaller!)      │    │
  │  │ ② Responsive srcset  → multiple sizes generated!    │    │
  │  │ ③ Lazy loading        → defer off-screen images!    │    │
  │  │ ④ Layout shift prevention → reserves space!         │    │
  │  │ ⑤ Size optimization  → serve correct size!          │    │
  │  │ ⑥ Blur placeholder   → better perceived perf!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  OPTIMIZATION PIPELINE:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Original Image (2MB JPEG)                           │    │
  │  │       │                                              │    │
  │  │       ▼                                              │    │
  │  │  /_next/image?url=...&w=640&q=75                     │    │
  │  │       │                                              │    │
  │  │       ├── Resize to requested width (640px)         │    │
  │  │       ├── Convert to WebP/AVIF (if browser supports)│    │
  │  │       ├── Compress to quality=75                    │    │
  │  │       └── Cache result (minimumCacheTTL)            │    │
  │  │       │                                              │    │
  │  │       ▼                                              │    │
  │  │  Optimized Image (50KB WebP) ✅                     │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  <img> vs <Image>:                                            │
  │  ┌──────────────────┬────────────────┬──────────────────┐    │
  │  │                  │ <img>          │ <Image>          │    │
  │  ├──────────────────┼────────────────┼──────────────────┤    │
  │  │ Optimization     │ ❌ None!      │ ✅ Auto!        │    │
  │  │ Format           │ Original only! │ WebP/AVIF!       │    │
  │  │ Lazy loading     │ Manual attr!   │ ✅ Default!     │    │
  │  │ Layout shift     │ ❌ Possible!  │ ✅ Prevented!   │    │
  │  │ Responsive       │ Manual srcset! │ ✅ Auto srcset! │    │
  │  │ Blur placeholder │ ❌ None!      │ ✅ Built-in!    │    │
  │  │ Remote security  │ ❌ Any URL!   │ ✅ Allowlist!   │    │
  │  └──────────────────┴────────────────┴──────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Props — Complete Reference!

```
  ALL PROPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  REQUIRED:                                                    │
  │  ┌────────────┬─────────────────────────────────────────┐    │
  │  │ src        │ Image source (3 types!)                 │    │
  │  │            │  ① "/photo.png"  → internal path!      │    │
  │  │            │  ② "https://..."  → external URL!       │    │
  │  │            │  ③ import photo → static import!       │    │
  │  │ alt        │ Screen reader + fallback text!          │    │
  │  │            │  "" = decorative (skip for a11y!)       │    │
  │  │ width      │ Intrinsic px (aspect ratio, NOT render!)│    │
  │  │ height     │ Intrinsic px (skip if fill or static!)  │    │
  │  └────────────┴─────────────────────────────────────────┘    │
  │                                                              │
  │  SIZING:                                                      │
  │  ┌────────────┬─────────────────────────────────────────┐    │
  │  │ fill       │ Boolean! Image fills parent container!  │    │
  │  │            │ → Parent MUST have position: relative!  │    │
  │  │            │ → No width/height needed!               │    │
  │  │            │ → objectFit: "cover" | "contain"!      │    │
  │  │ sizes      │ Responsive breakpoints for srcset!      │    │
  │  │            │ "(max-width:768px) 100vw, 33vw"        │    │
  │  │            │ → Without: browser assumes 100vw!       │    │
  │  │            │ → With fill: ALWAYS use sizes!          │    │
  │  └────────────┴─────────────────────────────────────────┘    │
  │                                                              │
  │  OPTIMIZATION:                                                │
  │  ┌────────────┬─────────────────────────────────────────┐    │
  │  │ quality    │ 1-100 (default:75). Higher=bigger file! │    │
  │  │ loader     │ Custom URL function! ({src,width,q})   │    │
  │  │ unoptimized│ Skip optimization! (for SVG/GIF!)       │    │
  │  │ placeholder│ "empty" | "blur" | "data:image/..."    │    │
  │  │ blurDataURL│ Data URL for blur placeholder!          │    │
  │  │            │ → Static import: AUTO generated! ✅    │    │
  │  │            │ → Remote: must provide manually!        │    │
  │  └────────────┴─────────────────────────────────────────┘    │
  │                                                              │
  │  LOADING:                                                     │
  │  ┌────────────┬─────────────────────────────────────────┐    │
  │  │ loading    │ "lazy" (default) | "eager"!             │    │
  │  │ preload    │ true = <link> in <head>! For LCP!       │    │
  │  │ priority   │ ⚠️ Deprecated v16 → use preload!       │    │
  │  │ decoding   │ "async"(default) | "sync" | "auto"     │    │
  │  └────────────┴─────────────────────────────────────────┘    │
  │                                                              │
  │  CALLBACKS (requires 'use client'!):                          │
  │  ┌────────────┬─────────────────────────────────────────┐    │
  │  │ onLoad     │ Image loaded + placeholder removed!     │    │
  │  │ onError    │ Image failed to load!                   │    │
  │  │ onLoading  │ ⚠️ Deprecated → use onLoad!            │    │
  │  │ Complete   │                                         │    │
  │  └────────────┴─────────────────────────────────────────┘    │
  │                                                              │
  │  SPECIAL:                                                     │
  │  ┌────────────┬─────────────────────────────────────────┐    │
  │  │ style      │ CSS inline styles! {borderRadius:'50%'} │    │
  │  │            │ → Set height:'auto' with custom width!  │    │
  │  │ overrideSrc│ Override <img> src for SEO migration!   │    │
  │  │            │ → srcset stays optimized!               │    │
  │  └────────────┴─────────────────────────────────────────┘    │
  │                                                              │
  │  SIZES + SRCSET GENERATION:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ WITHOUT sizes:                                       │    │
  │  │   srcset = "img 1x, img 2x"  ← fixed size only!    │    │
  │  │                                                      │    │
  │  │ WITH sizes="(max-width:768px) 100vw, 33vw":         │    │
  │  │   srcset = "img 640w, img 750w, img 828w,           │    │
  │  │            img 1080w, img 1200w, ..."               │    │
  │  │   ← Full responsive! Browser picks best size!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Configuration Options!

```
  next.config.js — images:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  SECURITY:                                                    │
  │  ┌─────────────────────┬────────────────────────────────┐    │
  │  │ remotePatterns      │ Allowlist for external images! │    │
  │  │                     │ protocol + hostname + pathname │    │
  │  │                     │ + port + search!               │    │
  │  │                     │ Wildcards: * (one), ** (many)! │    │
  │  │ localPatterns       │ Restrict local image paths!    │    │
  │  │ domains             │ ⚠️ Deprecated → remotePatterns│    │
  │  │ dangerouslyAllowSVG │ Allow SVG (XSS risk!) + CSP!  │    │
  │  │ dangerouslyAllow    │ Allow local network IPs!       │    │
  │  │ LocalIP             │                                │    │
  │  └─────────────────────┴────────────────────────────────┘    │
  │                                                              │
  │  SIZING:                                                      │
  │  ┌─────────────────────┬────────────────────────────────┐    │
  │  │ deviceSizes         │ [640,750,828,1080,1200,        │    │
  │  │                     │  1920,2048,3840]               │    │
  │  │ imageSizes          │ [32,48,64,96,128,256,384]      │    │
  │  │                     │ → Used when sizes prop set!    │    │
  │  └─────────────────────┴────────────────────────────────┘    │
  │                                                              │
  │  QUALITY + FORMAT:                                            │
  │  ┌─────────────────────┬────────────────────────────────┐    │
  │  │ qualities           │ [75] default! REQUIRED in v16! │    │
  │  │                     │ → Allowlist of quality values! │    │
  │  │ formats             │ ['image/webp'] default!        │    │
  │  │                     │ → ['image/avif'] 20% smaller!  │    │
  │  │                     │ → ['image/avif','image/webp']  │    │
  │  └─────────────────────┴────────────────────────────────┘    │
  │                                                              │
  │  CACHING:                                                     │
  │  ┌─────────────────────┬────────────────────────────────┐    │
  │  │ minimumCacheTTL     │ 14400 (4hrs) default!          │    │
  │  │                     │ → Higher = fewer revalidations!│    │
  │  │                     │ → Static import = immutable!   │    │
  │  └─────────────────────┴────────────────────────────────┘    │
  │                                                              │
  │  LOADER:                                                      │
  │  ┌─────────────────────┬────────────────────────────────┐    │
  │  │ loaderFile          │ Custom image service!          │    │
  │  │                     │ loader:'custom' + path!        │    │
  │  │ path                │ /_next/image (API prefix!)     │    │
  │  └─────────────────────┴────────────────────────────────┘    │
  │                                                              │
  │  LIMITS:                                                      │
  │  ┌─────────────────────┬────────────────────────────────┐    │
  │  │ maximumRedirects    │ 3 default! (0 = disable!)      │    │
  │  │ maximumResponseBody │ 50MB default!                   │    │
  │  └─────────────────────┴────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Examples — 3 Diagrams Analysis!

### Hình 1: Responsive Image Filling Parent

```
  ┌────────────────────────────────────────────┐
  │ 🌐 acme.com                               │
  │ ┌────────────────────────────────────────┐ │
  │ │ ███████████████████████████████████████ │ │ ← gray bars
  │ │                                        │ │
  │ │  ┌──────────────────────────────────┐  │ │
  │ │  │                                  │  │ │
  │ │  │      🏔️ Mountains Image         │  │ │ ← Image fills
  │ │  │      (width: 100%)              │  │ │    parent width!
  │ │  │      (height: auto)             │  │ │    Aspect ratio
  │ │  │                                  │  │ │    preserved!
  │ │  └──────────────────────────────────┘  │ │
  │ │                                        │ │
  │ └────────────────────────────────────────┘ │
  └────────────────────────────────────────────┘

  CODE:
  ┌──────────────────────────────────────────────────────┐
  │ import Image from 'next/image'                       │
  │ import mountains from '../public/mountains.jpg'      │
  │                                                      │
  │ export default function Responsive() {               │
  │   return (                                           │
  │     <div style={{display:'flex',flexDirection:'column'}}>│
  │       <Image                                         │
  │         alt="Mountains"                              │
  │         src={mountains}                              │
  │         sizes="100vw"          ← full viewport!     │
  │         style={{                                     │
  │           width: '100%',       ← fills parent!      │
  │           height: 'auto',      ← preserve ratio!   │
  │         }}                                           │
  │       />                                             │
  │     </div>                                           │
  │   )                                                  │
  │ }                                                    │
  │                                                      │
  │ KEY: Static import = auto width/height!              │
  │   → sizes="100vw" = full responsive srcset!          │
  │   → style width:100% + height:auto = responsive!    │
  └──────────────────────────────────────────────────────┘
```

### Hình 2: Grid of Images with Fill

```
  ┌────────────────────────────────────────────┐
  │ 🌐 acme.com                               │
  │ ┌──────────────────┬───────────────────┐   │
  │ │  🏔️ Mountains   │  🏔️ Mountains    │   │ ← 2x2 grid
  │ │  (fill + cover)  │  (fill + cover)   │   │
  │ ├──────────────────┼───────────────────┤   │
  │ │  🏔️ Mountains   │  🏔️ Mountains    │   │ ← Each image
  │ │  (fill + cover)  │  (fill + cover)   │   │   400px wide
  │ └──────────────────┴───────────────────┘   │
  └────────────────────────────────────────────┘

  CODE:
  ┌──────────────────────────────────────────────────────┐
  │ <div style={{                                        │
  │   display: 'grid',                                   │
  │   gridGap: '8px',                                   │
  │   gridTemplateColumns:                               │
  │     'repeat(auto-fit, minmax(400px, auto))',         │
  │ }}>                                                  │
  │   <div style={{position:'relative',width:'400px'}}>  │
  │     <Image                                           │
  │       alt="Mountains"                                │
  │       src={mountains}                                │
  │       fill                     ← fills parent!      │
  │       sizes="(min-width:808px) 50vw, 100vw"         │
  │       style={{objectFit:'cover'}}  ← crop to fit!   │
  │     />                                               │
  │   </div>                                             │
  │ </div>                                               │
  │                                                      │
  │ KEY: fill = no width/height needed!                  │
  │   → Parent MUST have position:relative!              │
  │   → objectFit:cover = crop excess, fill container!  │
  │   → objectFit:contain = shrink to fit, no crop!     │
  └──────────────────────────────────────────────────────┘
```

### Hình 3: Background Image

```
  ┌────────────────────────────────────────────┐
  │ 🌐 acme.com                               │
  │ ┌────────────────────────────────────────┐ │
  │ │                                        │ │
  │ │     🏔️ Mountains Image               │ │ ← Image covers
  │ │     (ENTIRE SCREEN!)                   │ │    ENTIRE PAGE!
  │ │     (fill + objectFit: cover)          │ │
  │ │     (quality: 100)                     │ │ ← Max quality
  │ │     (placeholder: blur!)               │ │ ← Blur while
  │ │                                        │ │    loading!
  │ └────────────────────────────────────────┘ │
  └────────────────────────────────────────────┘

  CODE:
  ┌──────────────────────────────────────────────────────┐
  │ <Image                                               │
  │   alt="Mountains"                                    │
  │   src={mountains}                                    │
  │   placeholder="blur"       ← blur while loading!    │
  │   quality={100}            ← max quality!           │
  │   fill                     ← fill entire space!     │
  │   sizes="100vw"            ← full viewport!         │
  │   style={{objectFit:'cover'}}  ← crop to fit!       │
  │ />                                                   │
  │                                                      │
  │ KEY: fill without parent position:relative!          │
  │   → Image uses position:absolute by default!         │
  │   → covers entire page/nearest positioned ancestor!  │
  │   → placeholder="blur" = auto blurDataURL!          │
  └──────────────────────────────────────────────────────┘
```

---

## §5. Advanced — getImageProps + Art Direction!

```
  ADVANCED PATTERNS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  getImageProps() — Extract props without <Image>!            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { getImageProps } from 'next/image'           │    │
  │  │                                                      │    │
  │  │ const { props } = getImageProps({                    │    │
  │  │   src: '/photo.jpg', alt: 'Photo',                   │    │
  │  │   width: 1200, height: 800                           │    │
  │  │ })                                                   │    │
  │  │                                                      │    │
  │  │ // Use with <figure>!                                │    │
  │  │ <figure>                                             │    │
  │  │   <img {...props} />                                 │    │
  │  │   <figcaption>Caption</figcaption>                   │    │
  │  │ </figure>                                            │    │
  │  │                                                      │    │
  │  │ ✅ No useState() → better performance!              │    │
  │  │ ❌ Cannot use placeholder (never removed!)          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ART DIRECTION — Different image per viewport!               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const { props: { srcSet: desktop } }                 │    │
  │  │   = getImageProps({ src:'/desktop.jpg', ... })       │    │
  │  │ const { props: { srcSet: mobile, ...rest } }         │    │
  │  │   = getImageProps({ src:'/mobile.jpg', ... })        │    │
  │  │                                                      │    │
  │  │ <picture>                                            │    │
  │  │   <source media="(min-width:1000px)"                 │    │
  │  │           srcSet={desktop} />                        │    │
  │  │   <source media="(min-width:500px)"                  │    │
  │  │           srcSet={mobile} />                         │    │
  │  │   <img {...rest} style={{width:'100%',height:'auto'}}│    │
  │  │   />                                                 │    │
  │  │ </picture>                                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  THEME DETECTION — Light/Dark mode!                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ CSS Module:                                          │    │
  │  │ .imgDark { display: none }                           │    │
  │  │ @media (prefers-color-scheme: dark) {                │    │
  │  │   .imgLight { display: none }                        │    │
  │  │   .imgDark  { display: unset }                       │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ <Image src={srcLight} className={styles.imgLight} /> │    │
  │  │ <Image src={srcDark}  className={styles.imgDark} />  │    │
  │  │                                                      │    │
  │  │ → loading="lazy" = only correct image loads! ✅     │    │
  │  │ → Do NOT use preload or eager → both would load! ❌ │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BACKGROUND CSS — image-set() optimization!                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const { props: { srcSet } } = getImageProps({...})   │    │
  │  │ const bgImage = getBackgroundImage(srcSet)           │    │
  │  │ // → "image-set(url('...') 1x, url('...') 2x)"     │    │
  │  │                                                      │    │
  │  │ <main style={{ backgroundImage: bgImage }} />        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BROWSER BUGS:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Safari 15-16.3: gray border during lazy load!        │    │
  │  │   Fix: clip-path: inset(0.6px) OR loading="eager"   │    │
  │  │                                                      │    │
  │  │ Firefox 67+: white background during lazy load!      │    │
  │  │   Fix: Enable AVIF format OR use placeholder!        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — NextImageEngine!

```javascript
var NextImageEngine = (function () {
  // ═══════════════════════════════════
  // 1. CONFIGURATION
  // ═══════════════════════════════════
  var config = {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    qualities: [75],
    formats: ["image/webp"],
    minimumCacheTTL: 14400,
    remotePatterns: [],
    localPatterns: [],
  };

  var cache = {};
  var stats = { hits: 0, misses: 0, optimized: 0 };

  // ═══════════════════════════════════
  // 2. REMOTE PATTERN CHECKER
  // ═══════════════════════════════════
  function matchPattern(url, pattern) {
    if (pattern.protocol && !url.startsWith(pattern.protocol + "://")) {
      return false;
    }
    if (pattern.hostname) {
      var host = url.split("://")[1];
      if (!host) return false;
      host = host.split("/")[0].split(":")[0];
      if (pattern.hostname.startsWith("**")) {
        var suffix = pattern.hostname.replace("**", "");
        if (!host.endsWith(suffix) && host !== suffix.substr(1)) return false;
      } else if (pattern.hostname !== host) {
        return false;
      }
    }
    return true;
  }

  function isAllowedRemote(src) {
    if (!src.startsWith("http")) return true; // local
    for (var i = 0; i < config.remotePatterns.length; i++) {
      if (matchPattern(src, config.remotePatterns[i])) return true;
    }
    return config.remotePatterns.length === 0;
  }

  // ═══════════════════════════════════
  // 3. SRCSET GENERATOR
  // ═══════════════════════════════════
  function generateSrcset(src, hasSizes, quality) {
    quality = quality || 75;
    var widths;

    if (hasSizes) {
      // Full responsive srcset!
      widths = config.imageSizes.concat(config.deviceSizes);
      widths.sort(function (a, b) {
        return a - b;
      });
      return widths
        .map(function (w) {
          return (
            "/_next/image?url=" +
            encodeURIComponent(src) +
            "&w=" +
            w +
            "&q=" +
            quality +
            " " +
            w +
            "w"
          );
        })
        .join(", ");
    } else {
      // Fixed size srcset (1x, 2x)!
      return [
        "/_next/image?url=" +
          encodeURIComponent(src) +
          "&w=640&q=" +
          quality +
          " 1x",
        "/_next/image?url=" +
          encodeURIComponent(src) +
          "&w=828&q=" +
          quality +
          " 2x",
      ].join(", ");
    }
  }

  // ═══════════════════════════════════
  // 4. IMAGE OPTIMIZER
  // ═══════════════════════════════════
  function optimize(src, width, quality, format) {
    quality = quality || 75;
    format = format || "image/webp";

    var cacheKey = src + "|" + width + "|" + quality + "|" + format;
    if (cache[cacheKey]) {
      stats.hits++;
      return {
        cached: true,
        url: cache[cacheKey].url,
        size: cache[cacheKey].size,
      };
    }

    stats.misses++;
    stats.optimized++;

    // Simulate optimization
    var originalSize = 2000000; // 2MB
    var ratio = width / 3840;
    var qualityRatio = quality / 100;
    var formatRatio = format === "image/avif" ? 0.6 : 0.8;
    var optimizedSize = Math.round(
      originalSize * ratio * qualityRatio * formatRatio,
    );

    var result = {
      url:
        "/_next/image?url=" +
        encodeURIComponent(src) +
        "&w=" +
        width +
        "&q=" +
        quality,
      size: optimizedSize,
      format: format,
      width: width,
      quality: quality,
      savings: Math.round((1 - optimizedSize / originalSize) * 100) + "%",
    };

    cache[cacheKey] = result;
    return result;
  }

  // ═══════════════════════════════════
  // 5. FILL MODE RESOLVER
  // ═══════════════════════════════════
  function resolveFill(parentStyle) {
    var errors = [];
    if (!parentStyle) {
      errors.push("Parent element style not provided!");
    } else {
      var pos = parentStyle.position;
      if (pos !== "relative" && pos !== "fixed" && pos !== "absolute") {
        errors.push("Parent must have position: relative|fixed|absolute!");
      }
    }
    return {
      valid: errors.length === 0,
      errors: errors,
      imgStyle: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
      },
    };
  }

  // ═══════════════════════════════════
  // 6. PROPS VALIDATOR
  // ═══════════════════════════════════
  function validateProps(props) {
    var errors = [];
    var warnings = [];

    if (!props.src) errors.push("src is required!");
    if (!props.alt && props.alt !== "") errors.push("alt is required!");

    if (!props.fill && !props.width)
      errors.push("width required (or use fill)!");
    if (!props.fill && !props.height)
      errors.push("height required (or use fill)!");
    if (props.fill && props.width)
      warnings.push("width ignored when fill is set!");
    if (props.fill && props.height)
      warnings.push("height ignored when fill is set!");

    if (props.fill && !props.sizes) {
      warnings.push("sizes recommended with fill!");
    }

    if (props.quality && config.qualities.indexOf(props.quality) === -1) {
      warnings.push(
        "quality=" +
          props.quality +
          " not in allowed list: [" +
          config.qualities.join(",") +
          "]",
      );
    }

    if (typeof props.src === "string" && props.src.startsWith("http")) {
      if (!isAllowedRemote(props.src)) {
        errors.push("Remote URL not in remotePatterns allowlist!");
      }
    }

    if (typeof props.onLoad === "function") {
      warnings.push('onLoad requires "use client" directive!');
    }
    if (typeof props.onError === "function") {
      warnings.push('onError requires "use client" directive!');
    }

    return { valid: errors.length === 0, errors: errors, warnings: warnings };
  }

  // ═══════════════════════════════════
  // 7. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔══════════════════════════════════════╗");
    console.log("║  NEXT IMAGE ENGINE DEMO               ║");
    console.log("╚══════════════════════════════════════╝");

    // Configure
    config.remotePatterns = [
      { protocol: "https", hostname: "s3.amazonaws.com" },
    ];
    config.qualities = [25, 50, 75, 100];

    // Validate props
    console.log("\n── Props Validation ──");
    var tests = [
      { src: "/photo.png", alt: "Photo", width: 500, height: 300 },
      { src: "/photo.png", alt: "Photo", fill: true },
      { src: "/photo.png" }, // missing alt!
      { src: "https://evil.com/hack.jpg", alt: "x", width: 100, height: 100 },
      { src: "/photo.png", alt: "x", fill: true, width: 500, height: 300 },
    ];
    for (var i = 0; i < tests.length; i++) {
      var v = validateProps(tests[i]);
      console.log(
        "  Test " +
          (i + 1) +
          ": " +
          (v.valid ? "✅" : "❌") +
          " errors=" +
          v.errors.length +
          " warnings=" +
          v.warnings.length,
      );
      for (var e = 0; e < v.errors.length; e++) {
        console.log("    ❌ " + v.errors[e]);
      }
      for (var w = 0; w < v.warnings.length; w++) {
        console.log("    ⚠️ " + v.warnings[w]);
      }
    }

    // Srcset generation
    console.log("\n── Srcset Generation ──");
    var fixed = generateSrcset("/photo.png", false);
    console.log("  Without sizes (fixed):");
    console.log("    " + fixed.substring(0, 80) + "...");
    var responsive = generateSrcset("/photo.png", true);
    console.log("  With sizes (responsive):");
    console.log("    entries:", responsive.split(",").length);

    // Image optimization
    console.log("\n── Image Optimization ──");
    var sizes = [640, 1200, 3840];
    for (var s = 0; s < sizes.length; s++) {
      var opt = optimize("/photo.jpg", sizes[s], 75, "image/webp");
      console.log(
        "  " +
          sizes[s] +
          "px: " +
          Math.round(opt.size / 1024) +
          "KB " +
          "(saved " +
          opt.savings +
          ")" +
          (opt.cached ? " [CACHED]" : ""),
      );
    }
    // AVIF comparison
    var avif = optimize("/photo.jpg", 1200, 75, "image/avif");
    console.log(
      "  1200px AVIF: " +
        Math.round(avif.size / 1024) +
        "KB" +
        " (saved " +
        avif.savings +
        ") ← 20% smaller!",
    );

    // Fill mode
    console.log("\n── Fill Mode ──");
    var fill1 = resolveFill({ position: "relative" });
    console.log(
      "  position:relative → " + (fill1.valid ? "✅ Valid!" : "❌ Invalid!"),
    );
    var fill2 = resolveFill({ position: "static" });
    console.log(
      "  position:static → " +
        (fill2.valid ? "✅ Valid!" : "❌ " + fill2.errors[0]),
    );

    // Cache stats
    console.log("\n── Cache Stats ──");
    optimize("/photo.jpg", 640, 75, "image/webp"); // cache hit!
    console.log(
      "  Hits:",
      stats.hits,
      "Misses:",
      stats.misses,
      "Optimized:",
      stats.optimized,
    );
  }

  return { demo: demo };
})();
// Chạy: NextImageEngine.demo();
```

---

## §7. Câu Hỏi Luyện Tập!

**Câu 1**: `width/height` vs `fill` — khi nào dùng?

<details><summary>Đáp án</summary>

```
width/height — Khi BIẾT kích thước!
  → Static import: tự động! Không cần set!
  → Remote image: phải set thủ công!
  → width/height = INTRINSIC (aspect ratio!)
  → NOT = rendered size! CSS controls rendered size!
  → Set style={{width:'100%',height:'auto'}} for responsive!

fill — Khi KHÔNG biết kích thước!
  → Image expands to parent container!
  → No width/height needed!
  → Parent MUST have position: relative|fixed|absolute!
  → ALWAYS use sizes prop with fill!
  → Use objectFit to control cropping:
    • "cover" = fill + crop excess!
    • "contain" = fit inside, no crop!
```

</details>

---

**Câu 2**: `sizes` prop ảnh hưởng srcset thế nào?

<details><summary>Đáp án</summary>

```
WITHOUT sizes:
  srcset = "img.webp 1x, img.webp 2x"
  → Only 2 entries! Fixed size only!
  → Browser downloads based on pixel density!

WITH sizes="(max-width:768px) 100vw, 33vw":
  srcset = "img?w=32 32w, img?w=48 48w, ...,
            img?w=3840 3840w"
  → 15 entries! Full responsive!
  → Browser picks BEST width based on:
    ① Viewport width (screen size!)
    ② sizes hint (how big image will be!)
    ③ Device pixel ratio (retina!)

RULE: Always use sizes when:
  → fill prop is set!
  → CSS makes image responsive!
  → Image is NOT fixed size!
```

</details>

---

**Câu 3**: Remote images — security config?

<details><summary>Đáp án</summary>

```
WHY RESTRICT:
  Next.js Image API = proxy! Fetches + optimizes images!
  If unrestricted → anyone can use your server to optimize
  ANY image → abuse + cost!

remotePatterns:
  module.exports = {
    images: {
      remotePatterns: [{
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        pathname: '/my-bucket/**',
        search: '',
      }],
    },
  }

  → Only https://s3.amazonaws.com/my-bucket/* allowed!
  → Other URLs → 400 Bad Request!
  → Wildcards: * = one segment, ** = any number!
  → hostname: '**.example.com' = all subdomains!
  → ALWAYS set search:'' to block query injection!

localPatterns:
  → Same for local images! pathname + search restriction!
```

</details>

---

**Câu 4**: `placeholder="blur"` — cơ chế?

<details><summary>Đáp án</summary>

```
Static import:
  → blurDataURL AUTO GENERATED! ✅
  → Next.js creates tiny (10px) blurred version at build!
  → Shown while full image loads!
  → Removed when onLoad fires!

Remote/dynamic image:
  → Must provide blurDataURL MANUALLY! ⚠️
  → Use tiny base64 data URL (keep small!)
  → Tools: png-pixel.com, Plaiceholder library!
  → <Image placeholder="blur"
           blurDataURL="data:image/jpeg;base64,..." />

FLOW:
  ① Show blurDataURL (tiny, instant!) 🔵
  ② Start loading real image (lazy!) ⏳
  ③ Real image loaded → swap! ✅
  ④ Placeholder removed!

PERFORMANCE:
  → Better perceived loading! User sees something immediately!
  → Large blurDataURL = hurts performance! Keep ≤10px!
```

</details>
