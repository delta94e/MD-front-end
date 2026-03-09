# Front-End System Design — Phần 25: JavaScript Bundling & Loading — "ES5 = 16.9KB, ES20 = 69 Bytes!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: JS Bundling — "HTTP/2 headers 12 bytes vs HTTP/1 5KB (98% efficient!). ES5 polyfill 16.9KB vs ES20 69B for same code! Core-JS 74KB min → 243KB uncompressed. ES6 98% support. Multi-target bundles by user-agent. Code split + prefetch/preload. Gzip 80% vs Brotli 91%. Defer non-critical scripts."
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — bundle optimization!

---

## Mục Lục

| #   | Phần                                        |
| --- | ------------------------------------------- |
| 1   | Header Compression — "5KB → 12 Bytes!"      |
| 2   | Polyfill Problem — "16.9KB vs 69 Bytes!"    |
| 3   | Multi-Target Bundles — "ES5, ES10, ES2024!" |
| 4   | Code Splitting — "600KB → Split Modules!"   |
| 5   | Prefetch & Preload — "Background Loading!"  |
| 6   | Minification — "20% Size Reduction!"        |
| 7   | Compression — "Gzip 80% vs Brotli 91%!"     |
| 8   | Script Defer — "Load Critical First!"       |

---

## §1. Header Compression — "5KB → 12 Bytes!"

```
HEADER SIZE:
═══════════════════════════════════════════════════════════════

  HTTP/1: average 5,000 bytes per request!
  HTTP/2: average 12 bytes per request!
  → 98% more efficient! ✅

  100 requests:
  HTTP/1: 100 × 5KB = 500KB wasted on headers!
  HTTP/2: 100 × 12B = 1.2KB on headers!
```

---

## §2. Polyfill Problem — "16.9KB vs 69 Bytes!"

> Evgenii: _"Guess the bundle size for this line of code. ES5: 16.9KB. ES20: 69 bytes. Core-JS: 74KB minified → 243KB uncompressed for parser."_

```javascript
// This single line:
const result = [1, 2, 3].flatMap((x) => [x, x * 2]);

// ES5 bundle: 16,900 bytes! (polyfills!)
// ES20 bundle: 69 bytes! (native support!)
```

```
POLYFILL COST:
═══════════════════════════════════════════════════════════════

  Core-JS (popular polyfill library):
  Minified + compressed: 74 KB
  Uncompressed (what parser sees): 243 KB!
  → Browser must parse 243KB before app runs! 💀

  Browser support TODAY:
  ES6:  98% of clients! ✅
  ES7-10: 96% of clients!
  ES12: 89% of clients!

  "We are providing polyfills for a very minority
   of the clients." — Evgenii
```

---

## §3. Multi-Target Bundles — "ES5, ES10, ES2024!"

> Evgenii: _"Instruct JS compiler to prepare multiple bundles. Detect browser engine via user-agent. Return optimized bundle for that client."_

```
MULTI-TARGET STRATEGY:
═══════════════════════════════════════════════════════════════

  Build: 3 bundles!
  ├── bundle.es5.js     → 600KB (all polyfills)
  ├── bundle.es10.js    → 200KB (some polyfills)
  └── bundle.es2024.js  → 80KB  (no polyfills!) ✅

  Server detects user-agent:
  Chrome 120 → serve bundle.es2024.js (80KB!)
  IE 11      → serve bundle.es5.js (600KB)
  Safari 14  → serve bundle.es10.js (200KB)

  98% of users get smallest bundle! ✅
```

---

## §4. Code Splitting — "600KB → Split Modules!"

> Evgenii: _"In HTTP/1 world, one big bundle was best practice. Now it's anti-pattern! Split code into separate modules, load dynamically."_

```
CODE SPLITTING:
═══════════════════════════════════════════════════════════════

  Before (HTTP/1 era):
  bundle.js = 600KB (everything!) → 1 request

  After (HTTP/2 era):
  main.js    = 100KB (core!)   → load immediately!
  module1.js = 80KB  (page 1)  → load on demand!
  module2.js = 120KB (page 2)  → load on demand!
  module3.js = 90KB  (page 3)  → load on demand!
  → All load in parallel via HTTP/2! ✅

  "We encourage to split the code because
   it will load faster now." — Evgenii
```

---

## §5. Prefetch & Preload — "Background Loading!"

> Evgenii: _"Instruct browser to fetch assets and cache them. Prefetch: low priority background. Preload: high priority. When you access the module, it's already there!"_

```html
<!-- Preload: HIGH priority (need soon!) -->
<link rel="preload" href="module1.js" as="script" />

<!-- Prefetch: LOW priority (need later!) -->
<link rel="prefetch" href="module2.js" />
<link rel="prefetch" href="module3.js" />
```

```
PRELOAD vs PREFETCH:
═══════════════════════════════════════════════════════════════

  Preload:
  → High priority!
  → Load NOW, need for current page!
  → Fonts, critical JS, above-fold images

  Prefetch:
  → Low priority, background!
  → Load for FUTURE navigation!
  → Next page modules, lazy features

  "You can prefetch all JS assets in background.
   When you access specific module,
   it's already there!" — Evgenii
```

---

## §6. Minification — "20% Size Reduction!"

```
MINIFICATION:
═══════════════════════════════════════════════════════════════

  Before:
  const longVariableName = calculateSomething();
  function processUserData(userData) { ... }

  After:
  const a = b();
  function c(d) { ... }

  → ~20% smaller!
  → 1MB → 800KB
  → Included in every bundler! ✅
```

---

## §7. Compression — "Gzip 80% vs Brotli 91%!"

> Evgenii: _"Gzip: supported by most clients/servers/CDNs, ~80% compression. Brotli: newer, 20-30% more efficient. If we can compress more, why don't we?"_

```
COMPRESSION:
═══════════════════════════════════════════════════════════════

  Lodash example:
  Original:     530 KB
  Gzip:         94 KB  (82% compression!)
  Brotli:       73 KB  (86% compression!) ✅

  Full pipeline:
  Source code:  1,000 KB
  Minified:     800 KB  (-20%)
  Gzip:         160 KB  (-80%)
  Brotli:       72 KB   (-91%!) ✅

  "Brotli 20-30% more efficient than Gzip.
   If we can compress more, why don't we?" — Evgenii
```

---

## §8. Script Defer — "Load Critical First!"

> Evgenii: _"Analytics, telemetry scripts don't impact UX. Tell browser: I don't need these for first load, defer them."_

```html
<!-- Normal: blocks rendering! -->
<script src="app.js"></script>
<script src="analytics.js"></script>
<script src="telemetry.js"></script>

<!-- Optimized: defer non-critical! -->
<script src="app.js"></script>
<script src="analytics.js" defer></script>
<script src="telemetry.js" defer></script>
```

```
SCRIPT LOADING ORDER:
═══════════════════════════════════════════════════════════════

  Without defer:
  HTML parse → app.js → analytics.js → telemetry.js → render!
  User waits for ALL scripts! 💀

  With defer:
  HTML parse → app.js → RENDER! → analytics.js → telemetry.js
  User sees content first! ✅

  "These scripts are optional, our app can function
   without that. Defer them, optimize first screen." — Evgenii
```

---

## Checklist

```
[ ] HTTP/2 headers: 12 bytes (vs HTTP/1: 5KB)!
[ ] ES5 polyfill: 16.9KB vs ES20: 69 bytes for same code!
[ ] Core-JS: 243KB uncompressed parser must process!
[ ] ES6 supported by 98% — polyfills for minority!
[ ] Multi-target bundles: ES5/ES10/ES2024 by user-agent!
[ ] Code split: anti-pattern to bundle all in HTTP/2 era!
[ ] Prefetch (low priority) + preload (high priority)!
[ ] Minification: ~20% size reduction (automatic)!
[ ] Gzip: 80% compression, Brotli: 91% compression!
[ ] Defer non-critical scripts (analytics, telemetry)!
TIẾP THEO → Phần 26: CSS, Images & Rendering!
```
