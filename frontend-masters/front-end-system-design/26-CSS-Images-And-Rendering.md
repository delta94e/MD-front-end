# Front-End System Design — Phần 26: CSS, Images & Rendering — "Critical CSS, WebP, Font Loading!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: CSS/Images/Rendering — "Split CSS per device. Tailwind: 2.1MB → 46KB Brotli. Critical CSS inline in HTML. Non-critical: media='print' hack or preload. GIF 60KB → WebP 5KB. AVIF 38% smaller than JPEG. WebP 97%, AVIF 93% support. SVG path compression 50%+. Font: 3s wait default! Use font-display: fallback. Rendering: virtualization, flat selectors, CSS animations (GPU), placeholders."
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — asset optimization!

---

## Mục Lục

| #   | Phần                                        |
| --- | ------------------------------------------- |
| 1   | CSS Optimization — "Split per Device!"      |
| 2   | Critical CSS Extraction — "Inline in HTML!" |
| 3   | Non-Critical CSS Loading — "Print Hack!"    |
| 4   | Image Formats — "GIF → WebP, JPEG → AVIF!"  |
| 5   | SVG Path Compression — "50%+ Smaller!"      |
| 6   | Font Loading — "3 Second Wait!"             |
| 7   | Rendering Performance Summary               |
| 8   | JavaScript Performance Summary              |

---

## §1. CSS Optimization — "Split per Device!"

> Evgenii: _"If 3 device types: mobile, standard, super wide — split CSS into 3 bundles, serve based on user-agent."_

```
CSS SPLITTING:
═══════════════════════════════════════════════════════════════

  Before: styles.css = 500KB (everything!)

  After:
  mobile.css   = 150KB (mobile only!)
  desktop.css  = 200KB (desktop!)
  wide.css     = 150KB (ultra-wide!)

  Server detects user-agent → serve correct bundle!
  Mobile users save 350KB! ✅

  Tailwind CSS example:
  Uncompressed: 2,100 KB (2.1 MB!)
  Minified:     1,900 KB
  Gzip:         200 KB
  Brotli:       46 KB! ✅ (98% reduction!)
```

---

## §2. Critical CSS Extraction — "Inline in HTML!"

> Evgenii: _"When we fetch index.html and see CSS link, we need additional HTTP request — 2 network trips. Optimize: inline critical styles in initial HTML."_

```html
<!-- ❌ Non-optimized (2 trips!): -->
<link rel="stylesheet" href="https://cdn.example.com/styles.css" />
<!-- Trip 1: HTML. Trip 2: CSS file! -->

<!-- ✅ Optimized (1 trip!): -->
<style>
  /* Critical CSS inlined! */
  body {
    margin: 0;
    font-family: sans-serif;
  }
  .header {
    height: 60px;
    background: #333;
  }
  .hero {
    min-height: 400px;
  }
  /* Only styles for first screen! */
</style>
```

```
CRITICAL CSS:
═══════════════════════════════════════════════════════════════

  Non-optimized: HTML → request CSS → render!
  Optimized: HTML (with CSS!) → render immediately! ✅

  "When we load first page, we already have
   all styles inlined. Immediately show content." — Evgenii
```

---

## §3. Non-Critical CSS Loading — "Print Hack!"

> Evgenii: _"Two ways: media='print' hack (loads after page rendered) or preload (loads in background). Print hack fires only when page fully loaded."_

```html
<!-- Method 1: Print Hack (loads AFTER page rendered!) -->
<link
  rel="stylesheet"
  href="non-critical.css"
  media="print"
  onload="this.media='all'"
/>
<!-- Browser thinks it's for printer → defers loading!
     onload: switch to 'all' → applies to screen! -->

<!-- Method 2: Preload (loads in background) -->
<link rel="preload" href="non-critical.css" as="style" />
```

```
PRINT vs PRELOAD:
═══════════════════════════════════════════════════════════════

  media="print" + onload:
  → Browser loads ONLY after page fully rendered!
  → Truly deferred!

  rel="preload":
  → Browser fires request immediately (low priority)
  → May queue with other assets

  "Preload: browser still fires request.
   Print: fires only when whole page rendered.
   Ordering slightly different." — Evgenii

  ⚠️ "Using preload too much → too many assets queued!
      Consider case-by-case." — Evgenii
```

---

## §4. Image Formats — "GIF → WebP, JPEG → AVIF!"

> Evgenii: _"60KB GIF = 5KB WebP. AVIF 38% smaller than JPEG uncompressed. WebP 97% support, AVIF 93%. Always provide JPEG fallback."_

```
IMAGE FORMAT COMPARISON:
═══════════════════════════════════════════════════════════════

  Animated content:
  GIF:  60 KB (3 sec animation can be 10MB!)
  WebP: 5 KB! (92% smaller!) ✅
  MP4:  even smaller for video!

  Photo content (10 MB original):
  JPEG:   10,000 KB
  WebP:   7,500 KB (25% smaller!)
  AVIF:   6,200 KB (38% smaller!) ✅

  | Format | Use Case       | Compression | Support |
  |--------|---------------|-------------|---------|
  | GIF    | Animation     | Poor        | 100%    |
  | SVG    | Icons/logos   | Vector!     | 100%    |
  | PNG    | Raster        | Good        | 100%    |
  | WebP   | Replace all!  | Great       | 97% ✅  |
  | AVIF   | Photos        | Best!       | 93% ✅  |

  "Very important to choose right format.
   These formats are already standard." — Evgenii
```

```html
<!-- Fallback for legacy browsers: -->
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Fallback JPEG" />
</picture>
```

---

## §5. SVG Path Compression — "50%+ Smaller!"

> Evgenii: _"Express same SVG with slightly different semantics. Remove a few symbols → compress 50%+. Without zip/brotli! Large SVG icon sets benefit significantly."_

```
SVG COMPRESSION:
═══════════════════════════════════════════════════════════════

  Before (verbose):
  <path d="M 10 10 L 20 20 L 30 10 Z" />

  After (compressed):
  <path d="M10 10l10 10 10-10z" />
  → Same visual! 50%+ smaller! ✅

  For large icon libraries:
  100 icons × 50% savings = significant!
  + Brotli compression on top = even more! ✅

  Tools: SVGO, bundler plugins (automated!)
```

---

## §6. Font Loading — "3 Second Wait!"

> Evgenii: _"Browser waits 3 seconds to load custom font. If font fails, user sees nothing for 3 seconds! Use font-display: fallback or optional."_

```css
/* ❌ Default (auto): wait 3 seconds! */
@font-face {
  font-family: "CustomFont";
  src: url("font.woff2");
  /* font-display: auto; ← DEFAULT = 3s wait! */
}

/* ✅ Fallback: show unstyled text immediately! */
@font-face {
  font-family: "CustomFont";
  src: url("font.woff2");
  font-display: fallback; /* Show text now, swap when loaded! */
}

/* ✅ Optional: show unstyled, cache for next visit! */
@font-face {
  font-family: "CustomFont";
  src: url("font.woff2");
  font-display: optional; /* Use cached font next time! */
}
```

```
FONT-DISPLAY VALUES:
═══════════════════════════════════════════════════════════════

  auto (default):
  → Wait 3 seconds for font → show unstyled after 💀
  → If CDN down: 3s blank screen!

  fallback:
  → Show unstyled text IMMEDIATELY!
  → Swap to custom font when loaded! ✅
  → "Pretty good alternative." — Evgenii

  optional:
  → Show unstyled text immediately!
  → Load + CACHE font (don't swap!)
  → Next page load: use cached font! ✅
```

---

## §7. Rendering Performance Summary

```
RENDERING OPTIMIZATION:
═══════════════════════════════════════════════════════════════

  1. DOM: minimize nodes, use virtualization!
  2. Graphic layers: minimize, use wisely!
  3. Avoid reflows: use separate stacking context!
  4. CSS selectors: flatten! (100+ complex = +50-100ms!)
  5. CSS animations: GPU-accelerated (transform, opacity!)
  6. Placeholders/loaders: visual feedback while loading!

  "Use naming methodology for CSS selectors.
   Long selectors add 50-100ms to first render." — Evgenii
```

---

## §8. JavaScript Performance Summary

```
JAVASCRIPT OPTIMIZATION:
═══════════════════════════════════════════════════════════════

  Rule of thumb: DON'T BLOCK UI THREAD!

  1. Reduce CPU usage: optimize search/access cost!
  2. Reduce RAM usage: offload to IndexedDB!
  3. Avoid synchronous storage (localStorage/sessionStorage!)
  4. Heavy tasks → Web Worker (separate thread!)
  5. Or → requestIdleCallback (browser idle time!)
  6. Or → offload to server!
  7. Reduce downloadable JS (split, multi-target!)
  8. Less code = less parsing = faster startup!

  "Don't block UI thread at any cost." — Evgenii
```

---

## Checklist

```
[ ] CSS: split per device (mobile/desktop/wide)!
[ ] Critical CSS: inline in HTML (1 network trip!)!
[ ] Non-critical CSS: media="print" hack or preload!
[ ] GIF → WebP (92% smaller!), JPEG → AVIF (38% smaller!)!
[ ] WebP: 97% support, AVIF: 93% support!
[ ] SVG path compression: 50%+ reduction!
[ ] Font: default waits 3s! Use font-display: fallback!
[ ] Rendering: virtualize, flat selectors, CSS animations (GPU)!
[ ] JS: don't block UI, Web Workers, idle callback, IndexedDB!
TIẾP THEO → Phần 27: Mock Interview — Twitter Newsfeed!
```
