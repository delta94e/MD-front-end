# Next.js Production Checklist — Deep Dive!

> **Chủ đề**: Optimize Trước Khi Lên Production!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/production-checklist
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — 3 Giai Đoạn!](#1)
2. [§2. Automatic Optimizations — 5 Tối Ưu Tự Động!](#2)
3. [§3. Development Checklist — 6 Categories!](#3)
4. [§4. Before Production — Build + Test + Analyze!](#4)
5. [§5. Tự Viết — ProductionChecklistEngine!](#5)
6. [§6. Câu Hỏi Luyện Tập](#6)

---

## §1. Tổng Quan — 3 Giai Đoạn!

```
  PRODUCTION CHECKLIST — 3 PHASES:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
  │  │  PHASE 1     │  │  PHASE 2     │  │  PHASE 3     │     │
  │  │  AUTOMATIC   │  │  DEVELOPMENT │  │  BEFORE      │     │
  │  │  (mặc định!) │  │  (coding!)   │  │  PRODUCTION  │     │
  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
  │         │                 │                  │              │
  │         ▼                 ▼                  ▼              │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
  │  │ 5 tối ưu    │  │ 6 categories │  │ Build        │     │
  │  │ MIỄN PHÍ!   │  │ checklist!   │  │ + Test       │     │
  │  │ (ko config!) │  │ (best        │  │ + Analyze    │     │
  │  │              │  │  practices!) │  │ + CWV!       │     │
  │  └──────────────┘  └──────────────┘  └──────────────┘     │
  │                                                            │
  │  MỤC TIÊU: Performance + UX + Security!                   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Automatic Optimizations — 5 Tối Ưu Tự Động!

```
  5 AUTO OPTIMIZATIONS (không cần config!):
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① SERVER COMPONENTS (default!)                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ → Components run trên SERVER mặc định!             │  │
  │  │ → KHÔNG cần JS trên client để render!             │  │
  │  │ → Client-side JS bundle = 0KB cho Server Components!│  │
  │  │ → Dùng Client Components CHỈ KHI cần interactivity!│  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② CODE-SPLITTING (per route!)                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ → Tự động chia code theo route segments!           │  │
  │  │ → Chỉ load JS cho current route (không load hết!) │  │
  │  │ → Thêm: lazy loading cho Client Components!        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ PREFETCHING (viewport-based!)                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ → <Link> vào viewport → prefetch routes ngầm!   │  │
  │  │ → Navigate = almost instant!                        │  │
  │  │ → Có thể opt-out khi cần!                        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ④ STATIC RENDERING (build time!)                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ → Server + Client Components render tại build time!│  │
  │  │ → Cache kết quả → serve instantly!               │  │
  │  │ → Opt into Dynamic Rendering khi cần!              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⑤ CACHING (multi-layer!)                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ → Data requests cached!                             │  │
  │  │ → Rendered results cached!                          │  │
  │  │ → Static assets cached!                             │  │
  │  │ → Giảm network requests đến server/database!     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  → 5 optimizations FREE! Chỉ cần dùng Next.js! 🎉     │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. Development Checklist — 6 Categories!

```
  CATEGORY 1: ROUTING & RENDERING!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌──────┬──────────────────────────────────────────────┐ │
  │  │ Item │ Best Practice                                │ │
  │  ├──────┼──────────────────────────────────────────────┤ │
  │  │ ☐ 1 │ Layouts: Share UI + enable partial rendering │ │
  │  │      │ on navigation (chỉ render leaf thay đổi!) │ │
  │  │ ☐ 2 │ <Link>: Client-side nav + auto prefetch!    │ │
  │  │      │ (KHÔNG dùng <a> cho internal links!)       │ │
  │  │ ☐ 3 │ Error Handling: Custom error pages!          │ │
  │  │      │ → error.tsx (catch-all errors!)             │ │
  │  │      │ → not-found.tsx (404 pages!)                │ │
  │  │ ☐ 4 │ Client vs Server Components:                 │ │
  │  │      │ → "use client" boundary ĐẨY XUỐNG thấp! │ │
  │  │      │ → Avoid increasing client JS bundle!        │ │
  │  │ ☐ 5 │ Dynamic APIs (cookies, searchParams):       │ │
  │  │      │ → Opt TOÀN BỘ route vào Dynamic Rendering!│ │
  │  │      │ → Root Layout dùng → ENTIRE app dynamic! │ │
  │  │      │ → Wrap trong <Suspense> boundaries!        │ │
  │  └──────┴──────────────────────────────────────────────┘ │
  │                                                          │
  │  ⚠️ Dynamic APIs WARNING:                               │
  │  cookies() trong Root Layout                              │
  │  = EVERY route becomes dynamic                            │
  │  = NO static rendering anywhere! 💥                      │
  │                                                          │
  │  TIP: Partial Prerendering (PPR) sẽ cho phép          │
  │  một phần route là dynamic mà KHÔNG ảnh hưởng        │
  │  toàn bộ route!                                         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  CATEGORY 2: DATA FETCHING & CACHING!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌──────┬──────────────────────────────────────────────┐ │
  │  │ Item │ Best Practice                                │ │
  │  ├──────┼──────────────────────────────────────────────┤ │
  │  │ ☐ 1 │ Server Components: fetch data trên server! │ │
  │  │      │ → Gần database, ít latency!               │ │
  │  │ ☐ 2 │ Route Handlers: cho Client → backend!      │ │
  │  │      │ ❌ KHÔNG call Route Handler từ Server     │ │
  │  │      │ Component! (thừa 1 server request!)        │ │
  │  │ ☐ 3 │ Streaming: Loading UI + React Suspense!     │ │
  │  │      │ → Progressive UI, không block toàn route! │ │
  │  │ ☐ 4 │ Parallel Data Fetching: giảm waterfall!    │ │
  │  │      │ Promise.all([fetchA(), fetchB()])            │ │
  │  │      │ + Preloading data khi cần!                 │ │
  │  │ ☐ 5 │ Data Caching: verify requests are cached!   │ │
  │  │      │ → Non-fetch requests: dùng unstable_cache! │ │
  │  │ ☐ 6 │ Static Images: dùng /public directory!     │ │
  │  │      │ → Auto-cached bởi Next.js!                │ │
  │  └──────┴──────────────────────────────────────────────┘ │
  │                                                          │
  │  ❌ COMMON MISTAKE:                                      │
  │  Server Component → call Route Handler → fetch data   │
  │  → THỪA 1 REQUEST!                                     │
  │  ✅ Server Component → fetch TRỰC TIẾP từ DB/API!  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  CATEGORY 3: UI & ACCESSIBILITY!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌──────┬──────────────────────────────────────────────┐ │
  │  │ Item │ Best Practice                                │ │
  │  ├──────┼──────────────────────────────────────────────┤ │
  │  │ ☐ 1 │ Forms: Server Actions + server validation!   │ │
  │  │ ☐ 2 │ Global Error: app/global-error.tsx           │ │
  │  │      │ → Accessible fallback UI cho uncaught errors│ │
  │  │ ☐ 3 │ Global 404: app/global-not-found.tsx         │ │
  │  │      │ → Accessible 404 cho unmatched routes       │ │
  │  │ ☐ 4 │ Font Module: next/font!                      │ │
  │  │      │ → Auto-host fonts locally!                  │ │
  │  │      │ → No external network requests!             │ │
  │  │      │ → Eliminate CLS (layout shift)!             │ │
  │  │ ☐ 5 │ <Image>: Optimize images!                    │ │
  │  │      │ → Auto resize, WebP, prevent CLS!          │ │
  │  │ ☐ 6 │ <Script>: Optimize 3rd-party scripts!       │ │
  │  │      │ → Auto defer, not block main thread!        │ │
  │  │ ☐ 7 │ ESLint: eslint-plugin-jsx-a11y!              │ │
  │  │      │ → Catch accessibility issues early!         │ │
  │  └──────┴──────────────────────────────────────────────┘ │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  CATEGORY 4: SECURITY!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌──────┬──────────────────────────────────────────────┐ │
  │  │ Item │ Best Practice                                │ │
  │  ├──────┼──────────────────────────────────────────────┤ │
  │  │ ☐ 1 │ Tainting: ngăn sensitive data leak!         │ │
  │  │      │ → taintObjectReference() cho objects!       │ │
  │  │      │ → taintUniqueValue() cho values!            │ │
  │  │      │ → Data marked tainted ≠ pass to Client!  │ │
  │  │ ☐ 2 │ Server Actions: auth check!                  │ │
  │  │      │ → Verify user authorized TRƯỚC xử lý!    │ │
  │  │      │ → Follow security best practices!           │ │
  │  │ ☐ 3 │ Env Variables: .env.* → .gitignore!        │ │
  │  │      │ → Chỉ NEXT_PUBLIC_ expose to client!      │ │
  │  │      │ → KHÔNG prefix = server-only!               │ │
  │  │ ☐ 4 │ CSP (Content Security Policy):               │ │
  │  │      │ → Protect: XSS, clickjacking, injection!   │ │
  │  │      │ → Headers hoặc nonce-based CSP!           │ │
  │  └──────┴──────────────────────────────────────────────┘ │
  │                                                          │
  │  ⚠️ ENV VARIABLES RULE:                                 │
  │  NEXT_PUBLIC_API_URL → client CÓ THỂ thấy!           │
  │  DATABASE_URL → ONLY server! An toàn!                  │
  │  SECRET_KEY → ❌ NEVER expose to client!                │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  CATEGORY 5: METADATA & SEO!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌──────┬──────────────────────────────────────────────┐ │
  │  │ Item │ Best Practice                                │ │
  │  ├──────┼──────────────────────────────────────────────┤ │
  │  │ ☐ 1 │ Metadata API: title, description per page!   │ │
  │  │      │ → export const metadata = { ... }           │ │
  │  │      │ → export function generateMetadata()        │ │
  │  │ ☐ 2 │ OG Images: opengraph-image.tsx!              │ │
  │  │      │ → Social sharing preview!                   │ │
  │  │ ☐ 3 │ Sitemaps: sitemap.ts!                        │ │
  │  │      │ → Help crawlers index pages!                │ │
  │  │ ☐ 4 │ Robots: robots.ts!                           │ │
  │  │      │ → Control crawler access!                   │ │
  │  └──────┴──────────────────────────────────────────────┘ │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  CATEGORY 6: TYPE SAFETY!
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ☐ TypeScript: Dùng .tsx, strict mode!                  │
  │  ☐ TS Plugin: next.js typescript plugin!                 │
  │    → Better type-safety cho layouts, pages, metadata    │
  │    → Catch errors at compile time!                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Before Production — Build + Test + Analyze!

```
  BEFORE PRODUCTION:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  STEP 1: BUILD LOCALLY!                                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ pnpm next build                                     │  │
  │  │ → Catch build errors trước khi deploy!            │  │
  │  │ → TypeScript errors, import errors, etc.            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  STEP 2: TEST PERFORMANCE LOCALLY!                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ pnpm next start                                     │  │
  │  │ → Production-like environment!                      │  │
  │  │ → Measure actual performance!                       │  │
  │  │ → Test SSR, SSG, ISR behavior!                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  STEP 3: CORE WEB VITALS!                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  Tool 1: Lighthouse (simulated!)                     │  │
  │  │  → Run in Incognito mode!                           │  │
  │  │  → Gives: LCP, FID, CLS, TBT, SI scores!          │  │
  │  │  → ⚠️ Simulated ≠ real! Pair with field data!    │  │
  │  │                                                      │  │
  │  │  Tool 2: useReportWebVitals hook!                    │  │
  │  │  → Send real CWV data to analytics!                 │  │
  │  │  → LCP, CLS, FCP, TTFB, INP!                       │  │
  │  │  → Field data = REAL user experience!               │  │
  │  │                                                      │  │
  │  │  ┌─────────────┬────────────┬────────────────────┐   │  │
  │  │  │ Metric      │ Good       │ Cần cải thiện    │   │  │
  │  │  ├─────────────┼────────────┼────────────────────┤   │  │
  │  │  │ LCP         │ ≤ 2.5s   │ > 4.0s            │   │  │
  │  │  │ CLS         │ ≤ 0.1    │ > 0.25            │   │  │
  │  │  │ INP         │ ≤ 200ms  │ > 500ms           │   │  │
  │  │  └─────────────┴────────────┴────────────────────┘   │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  STEP 4: ANALYZE BUNDLES!                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  ┌──────────────────┬────────────────────────────┐   │  │
  │  │  │ Tool             │ Purpose                    │   │  │
  │  │  ├──────────────────┼────────────────────────────┤   │  │
  │  │  │ @next/bundle-    │ Analyze FULL bundle!       │   │  │
  │  │  │ analyzer         │ Treemap visualization!     │   │  │
  │  │  │ Import Cost      │ VS Code extension!         │   │  │
  │  │  │ (VS Code)        │ See size INLINE!           │   │  │
  │  │  │ Package Phobia   │ Publish size + install     │   │  │
  │  │  │                  │ size of npm packages!      │   │  │
  │  │  │ Bundle Phobia    │ Cost of adding a package   │   │  │
  │  │  │                  │ to bundle!                 │   │  │
  │  │  │ bundlejs         │ Online bundler + analyzer! │   │  │
  │  │  │                  │ Tree-shaking simulation!   │   │  │
  │  │  └──────────────────┴────────────────────────────┘   │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — ProductionChecklistEngine!

```javascript
var ProductionChecklistEngine = (function () {
  // ═══════════════════════════════════
  // 1. CHECKLIST DATA STRUCTURE
  // ═══════════════════════════════════
  var categories = {
    routingRendering: {
      name: "Routing & Rendering",
      items: [
        {
          id: "RR1",
          text: "Layouts for shared UI + partial rendering",
          done: false,
          severity: "HIGH",
        },
        {
          id: "RR2",
          text: "<Link> for client-side nav + prefetch",
          done: false,
          severity: "HIGH",
        },
        {
          id: "RR3",
          text: "Custom error pages (error.tsx, not-found.tsx)",
          done: false,
          severity: "MEDIUM",
        },
        {
          id: "RR4",
          text: '"use client" boundaries pushed down tree',
          done: false,
          severity: "HIGH",
        },
        {
          id: "RR5",
          text: "Dynamic APIs wrapped in <Suspense>",
          done: false,
          severity: "HIGH",
        },
      ],
    },
    dataFetching: {
      name: "Data Fetching & Caching",
      items: [
        {
          id: "DF1",
          text: "Fetch data in Server Components",
          done: false,
          severity: "HIGH",
        },
        {
          id: "DF2",
          text: "Route Handlers only from Client Components",
          done: false,
          severity: "HIGH",
        },
        {
          id: "DF3",
          text: "Streaming with Loading UI + Suspense",
          done: false,
          severity: "MEDIUM",
        },
        {
          id: "DF4",
          text: "Parallel data fetching (Promise.all)",
          done: false,
          severity: "MEDIUM",
        },
        {
          id: "DF5",
          text: "Data caching verified (unstable_cache)",
          done: false,
          severity: "MEDIUM",
        },
        {
          id: "DF6",
          text: "Static assets in /public directory",
          done: false,
          severity: "LOW",
        },
      ],
    },
    uiAccessibility: {
      name: "UI & Accessibility",
      items: [
        {
          id: "UA1",
          text: "Server Actions for forms + validation",
          done: false,
          severity: "MEDIUM",
        },
        {
          id: "UA2",
          text: "app/global-error.tsx exists",
          done: false,
          severity: "MEDIUM",
        },
        {
          id: "UA3",
          text: "app/global-not-found.tsx exists",
          done: false,
          severity: "LOW",
        },
        {
          id: "UA4",
          text: "Font Module (next/font) — no external requests",
          done: false,
          severity: "MEDIUM",
        },
        {
          id: "UA5",
          text: "<Image> component for all images",
          done: false,
          severity: "HIGH",
        },
        {
          id: "UA6",
          text: "<Script> component for 3rd-party scripts",
          done: false,
          severity: "MEDIUM",
        },
        {
          id: "UA7",
          text: "ESLint jsx-a11y plugin enabled",
          done: false,
          severity: "LOW",
        },
      ],
    },
    security: {
      name: "Security",
      items: [
        {
          id: "S1",
          text: "Tainting for sensitive data objects",
          done: false,
          severity: "HIGH",
        },
        {
          id: "S2",
          text: "Server Actions auth check",
          done: false,
          severity: "HIGH",
        },
        {
          id: "S3",
          text: ".env.* in .gitignore + NEXT_PUBLIC_ prefix",
          done: false,
          severity: "HIGH",
        },
        {
          id: "S4",
          text: "Content Security Policy (CSP)",
          done: false,
          severity: "MEDIUM",
        },
      ],
    },
    metadataSEO: {
      name: "Metadata & SEO",
      items: [
        {
          id: "M1",
          text: "Metadata API (title, description per page)",
          done: false,
          severity: "HIGH",
        },
        {
          id: "M2",
          text: "OG images for social sharing",
          done: false,
          severity: "MEDIUM",
        },
        {
          id: "M3",
          text: "sitemap.ts generated",
          done: false,
          severity: "MEDIUM",
        },
        {
          id: "M4",
          text: "robots.ts configured",
          done: false,
          severity: "LOW",
        },
      ],
    },
    typeSafety: {
      name: "Type Safety",
      items: [
        {
          id: "T1",
          text: "TypeScript strict mode",
          done: false,
          severity: "MEDIUM",
        },
        {
          id: "T2",
          text: "Next.js TS Plugin enabled",
          done: false,
          severity: "LOW",
        },
      ],
    },
  };

  // ═══════════════════════════════════
  // 2. SCORE CALCULATOR
  // ═══════════════════════════════════
  var SEVERITY_WEIGHT = { HIGH: 3, MEDIUM: 2, LOW: 1 };

  function calculateScore() {
    var totalWeight = 0;
    var doneWeight = 0;
    var totalItems = 0;
    var doneItems = 0;

    for (var cat in categories) {
      var items = categories[cat].items;
      for (var i = 0; i < items.length; i++) {
        var w = SEVERITY_WEIGHT[items[i].severity];
        totalWeight += w;
        totalItems++;
        if (items[i].done) {
          doneWeight += w;
          doneItems++;
        }
      }
    }

    return {
      score: Math.round((doneWeight / totalWeight) * 100),
      completed: doneItems,
      total: totalItems,
    };
  }

  // ═══════════════════════════════════
  // 3. READINESS CHECKER
  // ═══════════════════════════════════
  function checkReadiness() {
    var result = calculateScore();
    var blockers = [];
    for (var cat in categories) {
      var items = categories[cat].items;
      for (var i = 0; i < items.length; i++) {
        if (!items[i].done && items[i].severity === "HIGH") {
          blockers.push({
            category: categories[cat].name,
            item: items[i].text,
            id: items[i].id,
          });
        }
      }
    }

    var grade;
    if (result.score >= 90) grade = "A (Production Ready!)";
    else if (result.score >= 70) grade = "B (Almost Ready)";
    else if (result.score >= 50) grade = "C (Needs Work)";
    else grade = "D (Not Ready!)";

    return {
      score: result.score,
      grade: grade,
      completed: result.completed,
      total: result.total,
      blockers: blockers,
      isReady: blockers.length === 0 && result.score >= 70,
    };
  }

  // ═══════════════════════════════════
  // 4. CWV SIMULATOR
  // ═══════════════════════════════════
  function simulateCWV(config) {
    config = config || {};
    var lcp = config.lcp || 2.5;
    var cls = config.cls || 0.1;
    var inp = config.inp || 200;

    function rateMetric(value, good, poor) {
      if (value <= good) return "GOOD ✅";
      if (value <= poor) return "NEEDS IMPROVEMENT ⚠️";
      return "POOR ❌";
    }

    return {
      LCP: { value: lcp + "s", rating: rateMetric(lcp, 2.5, 4.0) },
      CLS: { value: cls, rating: rateMetric(cls, 0.1, 0.25) },
      INP: { value: inp + "ms", rating: rateMetric(inp, 200, 500) },
      overall:
        lcp <= 2.5 && cls <= 0.1 && inp <= 200
          ? "ALL GOOD! 🎉"
          : "NEEDS OPTIMIZATION! ⚠️",
    };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  PRODUCTION CHECKLIST ENGINE        ║");
    console.log("╚════════════════════════════════════╝");

    // Mark some items as done
    categories.routingRendering.items[0].done = true; // Layouts
    categories.routingRendering.items[1].done = true; // <Link>
    categories.dataFetching.items[0].done = true; // SC fetch
    categories.uiAccessibility.items[4].done = true; // <Image>
    categories.security.items[2].done = true; // env vars
    categories.metadataSEO.items[0].done = true; // Metadata

    // Readiness check
    console.log("\n── Readiness Check ──");
    var ready = checkReadiness();
    console.log("  Score: " + ready.score + "% (" + ready.grade + ")");
    console.log("  Completed: " + ready.completed + "/" + ready.total);
    console.log("  Ready: " + (ready.isReady ? "YES!" : "NO!"));

    // Blockers
    if (ready.blockers.length > 0) {
      console.log("\n── HIGH Priority Blockers ──");
      for (var i = 0; i < ready.blockers.length; i++) {
        var b = ready.blockers[i];
        console.log("  ❌ [" + b.id + "] " + b.category + ": " + b.item);
      }
    }

    // CWV
    console.log("\n── Core Web Vitals ──");
    var cwv = simulateCWV({ lcp: 2.8, cls: 0.05, inp: 180 });
    console.log("  LCP: " + cwv.LCP.value + " → " + cwv.LCP.rating);
    console.log("  CLS: " + cwv.CLS.value + " → " + cwv.CLS.rating);
    console.log("  INP: " + cwv.INP.value + " → " + cwv.INP.rating);
    console.log("  Overall: " + cwv.overall);
  }

  return { demo: demo };
})();
// Chạy: ProductionChecklistEngine.demo();
```

---

## §6. Câu Hỏi Luyện Tập!

**Câu 1**: 5 automatic optimizations — liệt kê và giải thích?

<details><summary>Đáp án</summary>

| #   | Optimization          | Effect                                                                        |
| --- | --------------------- | ----------------------------------------------------------------------------- |
| 1   | **Server Components** | Default! Components chạy trên server → 0KB client JS cho chúng                |
| 2   | **Code-splitting**    | Tự chia JS chunks per route → chỉ load code current route                     |
| 3   | **Prefetching**       | `<Link>` vào viewport → prefetch route → navigate instant                     |
| 4   | **Static Rendering**  | Build time render + cache → serve instantly, opt into dynamic khi cần         |
| 5   | **Caching**           | Multi-layer: data + rendered result + static assets → giảm server/DB requests |

**Key**: Tất cả FREE, không cần config! Chỉ opt-out khi cần.

</details>

---

**Câu 2**: Dynamic APIs trap — tại sao cookies() trong Root Layout nguy hiểm?

<details><summary>Đáp án</summary>

`cookies()`, `searchParams` là **Dynamic APIs** → opt route vào **Dynamic Rendering**.

```
cookies() trong Root Layout
→ Root Layout = parent của MỌI route
→ TẤT CẢ routes trở thành Dynamic!
→ KHÔNG route nào được Static Rendering!
→ Performance giảm TOÀN APP! 💥
```

**Fix**:

1. Di chuyển `cookies()` vào specific route/layout (không phải Root!)
2. Wrap trong `<Suspense>` boundary
3. Đợi PPR (Partial Prerendering) cho phép mix static + dynamic

</details>

---

**Câu 3**: Route Handler từ Server Component — tại sao sai?

<details><summary>Đáp án</summary>

```
❌ Server Component → call GET /api/data → server process request
   → THỪA 1 HOP! Server gọi chính server! 😱

✅ Server Component → trực tiếp fetch DB/API
   → 1 hop duy nhất! Nhanh hơn!

❌ WRONG:
// Server Component
const data = await fetch('/api/data') // calls own server!

✅ CORRECT:
// Server Component
const data = await db.query('SELECT * FROM products')
// or
const data = await fetch('https://external-api.com/data')
```

**Rule**: Route Handlers chỉ dành cho **Client Components** gọi backend! Server Components access data **TRỰC TIẾP**.

</details>

---

**Câu 4**: Core Web Vitals — 3 metrics quan trọng nhất?

<details><summary>Đáp án</summary>

| Metric  | Full Name                 | Good Threshold | Đo gì?                                                       |
| ------- | ------------------------- | -------------- | ------------------------------------------------------------ |
| **LCP** | Largest Contentful Paint  | ≤ 2.5s         | Thời gian load phần tử lớn nhất (hero image, heading...)     |
| **CLS** | Cumulative Layout Shift   | ≤ 0.1          | Layout shift (content nhảy khi load — fonts, images, ads...) |
| **INP** | Interaction to Next Paint | ≤ 200ms        | Thời gian phản hồi user interaction (click, type...)         |

**Next.js giúp CWV**:

- LCP: Static rendering + prefetching → content available instantly
- CLS: `next/font` (no FOUT) + `<Image>` (reserved dimensions)
- INP: Server Components (less client JS) + code-splitting

**Tools**:

- Simulated: Lighthouse (incognito!)
- Field data: `useReportWebVitals` hook → analytics

</details>
