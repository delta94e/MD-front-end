# Next.js Lazy Loading — Deep Dive!

> **Chủ đề**: Lazy Loading — Giảm JS Bundle, Tăng Tốc Tải Trang!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/lazy-loading
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Lazy Loading Là Gì?](#1)
2. [§2. next/dynamic vs React.lazy](#2)
3. [§3. Importing Client Components](#3)
4. [§4. Skipping SSR — ssr: false](#4)
5. [§5. Importing Server Components](#5)
6. [§6. Loading External Libraries — import()](#6)
7. [§7. Custom Loading + Named Exports](#7)
8. [§8. Tự Viết — LazyLoadEngine](#8)
9. [§9. Câu Hỏi Luyện Tập](#9)

---

## §1. Tổng Quan — Lazy Loading Là Gì?

```
  LAZY LOADING — BIG PICTURE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VẤN ĐỀ: Bundle Size Quá Lớn!                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  page.tsx imports:                                   │  │
  │  │    ComponentA (50KB)                                 │  │
  │  │    ComponentB (100KB) ← chỉ hiện khi click!         │  │
  │  │    ComponentC (200KB) ← chỉ cần trên client!        │  │
  │  │    fuse.js (30KB)     ← chỉ dùng khi search!       │  │
  │  │                                                      │  │
  │  │  Total JS: 380KB → TẤT CẢ load lúc đầu! 😱         │  │
  │  │  → First Load chậm!                                │  │
  │  │  → User chờ lâu!                                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  GIẢI PHÁP: Lazy Loading!                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  ComponentA → load ngay (separate chunk!)           │  │
  │  │  ComponentB → load KHI user click!                  │  │
  │  │  ComponentC → load CHỈ trên client!                 │  │
  │  │  fuse.js    → load KHI user type!                   │  │
  │  │                                                      │  │
  │  │  Initial JS: 50KB → NHANH! ⚡                       │  │
  │  │  Phần còn lại: load on-demand!                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  SERVER vs CLIENT COMPONENTS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Server Components (default):                            │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  → TỰ ĐỘNG code-split!                            │  │
  │  │  → Streaming UI (loading.tsx)                      │  │
  │  │  → KHÔNG cần lazy loading!                         │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  Client Components ('use client'):                       │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  → CẦN lazy loading!                               │  │
  │  │  → next/dynamic hoặc React.lazy()                  │  │
  │  │  → Giảm initial JS bundle!                        │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  → Lazy loading CHỈ ÁP DỤNG cho Client Components!    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. next/dynamic vs React.lazy!

```
  2 CÁCH LAZY LOADING:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① next/dynamic (KHUYÊN DÙNG trong Next.js):              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  import dynamic from 'next/dynamic'                  │  │
  │  │  const Comp = dynamic(() => import('./Comp'))         │  │
  │  │                                                      │  │
  │  │  = React.lazy() + Suspense COMBINED!                │  │
  │  │  + ssr: false option!                                │  │
  │  │  + loading component option!                         │  │
  │  │  + Works in app/ AND pages/!                        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② React.lazy() + Suspense (vanilla React):               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  import { lazy, Suspense } from 'react'              │  │
  │  │  const Comp = lazy(() => import('./Comp'))            │  │
  │  │  <Suspense fallback={<Loading />}>                   │  │
  │  │    <Comp />                                          │  │
  │  │  </Suspense>                                         │  │
  │  │                                                      │  │
  │  │  → Cần wrap Suspense thủ công!                     │  │
  │  │  → Không có ssr: false!                             │  │
  │  │  → Không có loading option built-in!                │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  SO SÁNH:                                                  │
  │  ┌──────────────┬──────────────┬──────────────────────┐    │
  │  │              │ next/dynamic │ React.lazy+Suspense  │    │
  │  ├──────────────┼──────────────┼──────────────────────┤    │
  │  │ Suspense     │ Built-in     │ Manual wrap          │    │
  │  │ ssr: false   │ ✅           │ ❌                   │    │
  │  │ loading prop │ ✅           │ ❌ (Suspense only)   │    │
  │  │ Named export │ ✅ .then()   │ ❌ default only      │    │
  │  │ app/ + pages/│ ✅           │ ✅                   │    │
  │  └──────────────┴──────────────┴──────────────────────┘    │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. Importing Client Components!

```
  3 PATTERNS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Pattern A: Load ngay — SEPARATE bundle                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  const CompA = dynamic(() => import('./A'))           │  │
  │  │  <CompA />  ← Render ngay!                           │  │
  │  │                                                      │  │
  │  │  → Vẫn trong initial render                         │  │
  │  │  → NHƯNG tách chunk riêng (parallel load!)          │  │
  │  │  → Main bundle nhỏ hơn!                            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Pattern B: Load ON-DEMAND — conditional render            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  const CompB = dynamic(() => import('./B'))           │  │
  │  │  {showMore && <CompB />}  ← Chỉ load khi cần!      │  │
  │  │                                                      │  │
  │  │  → JS chunk CHỈ download khi showMore = true!      │  │
  │  │  → Modal, drawer, tabs... → PERFECT!               │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Pattern C: CLIENT-ONLY — skip SSR                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  const CompC = dynamic(                               │  │
  │  │    () => import('./C'),                               │  │
  │  │    { ssr: false }                                     │  │
  │  │  )                                                    │  │
  │  │  <CompC />  ← Chỉ render trên client!               │  │
  │  │                                                      │  │
  │  │  → KHÔNG render trong SSR!                          │  │
  │  │  → Dùng cho: canvas, WebGL, window-dependent code  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Full code example:**

```typescript
'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'

// Pattern A: Separate bundle, load immediately
const ComponentA = dynamic(() => import('../components/A'))

// Pattern B: On-demand loading
const ComponentB = dynamic(() => import('../components/B'))

// Pattern C: Client-only (no SSR)
const ComponentC = dynamic(
  () => import('../components/C'),
  { ssr: false }
)

export default function ClientComponentExample() {
  const [showMore, setShowMore] = useState(false)

  return (
    <div>
      <ComponentA />                         {/* Always rendered */}
      {showMore && <ComponentB />}           {/* On-demand! */}
      <button onClick={() => setShowMore(!showMore)}>
        Toggle
      </button>
      <ComponentC />                         {/* Client-only! */}
    </div>
  )
}
```

---

## §4. Skipping SSR — ssr: false!

```
  ssr: false — KHI NÀO DÙNG?
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  MẶC ĐỊNH: Client Components được PRERENDER (SSR)!      │
  │  → React.lazy() + Suspense → SSR by default!          │
  │  → next/dynamic → SSR by default!                     │
  │                                                          │
  │  CẦN ssr: false KHI:                                     │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ ① Component dùng window/document                   │  │
  │  │   → window.innerWidth, document.createElement     │  │
  │  │   → KHÔNG có trên server!                         │  │
  │  │                                                    │  │
  │  │ ② Component dùng browser APIs                      │  │
  │  │   → Canvas, WebGL, IntersectionObserver            │  │
  │  │   → localStorage, sessionStorage                   │  │
  │  │                                                    │  │
  │  │ ③ Third-party lib browser-only                     │  │
  │  │   → Map libraries (Leaflet, Google Maps)           │  │
  │  │   → Chart libraries (Chart.js, D3)                 │  │
  │  │   → Rich text editors (Quill, TipTap)              │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  ⚠️ QUY TẮC QUAN TRỌNG:                                 │
  │  → ssr: false CHỈ dùng trong Client Components!        │
  │  → Server Components dùng → ERROR!                     │
  │  → error: "ssr: false is not allowed with              │
  │     next/dynamic in Server Components"                  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Importing Server Components!

```
  SERVER COMPONENT + dynamic():
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  dynamic() import Server Component → ĐẶC BIỆT!        │
  │                                                          │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  // page.tsx (Server Component)                    │  │
  │  │  const ServerComp = dynamic(                       │  │
  │  │    () => import('./ServerComponent')                │  │
  │  │  )                                                 │  │
  │  │                                                    │  │
  │  │  WHAT HAPPENS:                                     │  │
  │  │  ① Server Component BẢN THÂN → KHÔNG lazy!       │  │
  │  │  ② Client Components CON → lazy-loaded!           │  │
  │  │  ③ Static assets (CSS) → PRELOADED!               │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │  ServerComponent                                     ││
  │  │  ├── <Header /> (Server) → KHÔNG lazy             ││
  │  │  ├── <HeavyChart /> (Client) → LAZY! ✅           ││
  │  │  ├── <Footer /> (Server) → KHÔNG lazy             ││
  │  │  └── styles.css → PRELOADED! ✅                    ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  ⚠️ ssr: false → ERROR trong Server Components!        │
  │  → "ssr: false is not allowed with next/dynamic         │
  │     in Server Components. Please move it into            │
  │     a Client Component."                                 │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Loading External Libraries — import()!

```
  DYNAMIC import() — LOAD LIBRARIES ON-DEMAND:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Khác với dynamic() cho Components:                        │
  │  → import() cho LIBRARIES (fuse.js, lodash, moment...)   │
  │  → Gọi TRONG event handler!                              │
  │  → Module load KHI user tương tác!                       │
  │                                                            │
  │  FLOW:                                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  Page load (0KB fuse.js!) ← NHANH!                  │  │
  │  │       ↓                                              │  │
  │  │  User types in search input                          │  │
  │  │       ↓                                              │  │
  │  │  onChange fires                                       │  │
  │  │       ↓                                              │  │
  │  │  const Fuse = (await import('fuse.js')).default      │  │
  │  │       ↓                                              │  │
  │  │  fuse.js chunk downloads (30KB)                      │  │
  │  │       ↓                                              │  │
  │  │  new Fuse(data).search(query)                        │  │
  │  │       ↓                                              │  │
  │  │  Results rendered!                                    │  │
  │  │                                                      │  │
  │  │  ⚡ Subsequent types → Fuse already cached!        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```typescript
'use client'
import { useState } from 'react'

const names = ['Tim', 'Joe', 'Bel', 'Lee']

export default function Page() {
  const [results, setResults] = useState()

  return (
    <div>
      <input
        type="text"
        placeholder="Search"
        onChange={async (e) => {
          const { value } = e.currentTarget
          // Load fuse.js ONLY khi user type!
          const Fuse = (await import('fuse.js')).default
          const fuse = new Fuse(names)
          setResults(fuse.search(value))
        }}
      />
      <pre>Results: {JSON.stringify(results, null, 2)}</pre>
    </div>
  )
}
```

---

## §7. Custom Loading + Named Exports!

```
  CUSTOM LOADING COMPONENT:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  dynamic({ loading: () => <Skeleton /> })               │
  │                                                          │
  │  FLOW:                                                    │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  ① Render → <Skeleton /> hiện (placeholder!)     │  │
  │  │  ② JS chunk downloading...                        │  │
  │  │  ③ Chunk loaded → <RealComponent /> thay thế!    │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```typescript
'use client'
import dynamic from 'next/dynamic'

const WithCustomLoading = dynamic(
  () => import('../components/WithCustomLoading'),
  { loading: () => <p>Loading...</p> }
)

export default function Page() {
  return <WithCustomLoading />
  // Shows "Loading..." → then real component!
}
```

```
  NAMED EXPORTS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  VẤN ĐỀ: Component KHÔNG phải default export!          │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  // hello.tsx                                      │  │
  │  │  export function Hello() { return <p>Hello!</p> }  │  │
  │  │  //     ↑ NAMED export (không phải default!)       │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  GIẢI PHÁP: .then() để pick named export!               │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  const ClientComponent = dynamic(                  │  │
  │  │    () => import('../components/hello')              │  │
  │  │          .then((mod) => mod.Hello)                  │  │
  │  │  //                          ↑                     │  │
  │  │  //                Pick named export!              │  │
  │  │  )                                                 │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  import() returns Promise<Module>:                       │
  │  { default: ..., Hello: ..., Goodbye: ... }              │
  │  → .then(mod => mod.Hello) pick đúng export!           │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. Tự Viết — LazyLoadEngine!

```javascript
var LazyLoadEngine = (function () {
  // ═══════════════════════════════════
  // 1. MODULE REGISTRY (simulates chunks)
  // ═══════════════════════════════════
  var modules = {};
  var loadedModules = {};
  var loadCount = 0;

  function registerModule(name, factory, sizeKB) {
    modules[name] = {
      factory: factory,
      size: sizeKB,
      loaded: false,
    };
  }

  // ═══════════════════════════════════
  // 2. DYNAMIC IMPORT SIMULATION
  // ═══════════════════════════════════
  function dynamicImport(name) {
    if (loadedModules[name]) {
      console.log("  ⚡ Cache HIT: " + name + " (0ms)");
      return loadedModules[name];
    }

    var mod = modules[name];
    if (!mod) {
      console.log("  ❌ Module not found: " + name);
      return null;
    }

    // Simulate network load
    loadCount++;
    console.log(
      "  📦 Loading: " +
        name +
        " (" +
        mod.size +
        "KB) [chunk #" +
        loadCount +
        "]",
    );
    var result = mod.factory();
    mod.loaded = true;
    loadedModules[name] = result;
    return result;
  }

  // ═══════════════════════════════════
  // 3. next/dynamic SIMULATION
  // ═══════════════════════════════════
  function dynamic(importFn, options) {
    var opts = options || {};
    var ssrEnabled = opts.ssr !== false;
    var loadingFn = opts.loading || null;
    var loaded = false;
    var component = null;

    return {
      // SSR phase
      renderSSR: function () {
        if (!ssrEnabled) {
          console.log("  🚫 SSR skipped (ssr: false)");
          return loadingFn ? loadingFn() : null;
        }
        component = importFn();
        loaded = true;
        console.log("  🖥️ SSR rendered: " + (component ? component.name : "?"));
        return component;
      },

      // Client phase
      renderClient: function () {
        if (loaded && component) {
          console.log("  ✅ Already loaded: " + component.name);
          return component;
        }
        // Show loading
        if (loadingFn) {
          console.log("  ⏳ Showing: " + loadingFn());
        }
        // Load chunk
        component = importFn();
        loaded = true;
        console.log(
          "  ✅ Client rendered: " + (component ? component.name : "?"),
        );
        return component;
      },

      isLoaded: function () {
        return loaded;
      },
    };
  }

  // ═══════════════════════════════════
  // 4. NAMED EXPORT HANDLER
  // ═══════════════════════════════════
  function importNamed(moduleName, exportName) {
    var mod = dynamicImport(moduleName);
    if (!mod) return null;
    if (!(exportName in mod)) {
      console.log(
        '  ❌ Export "' + exportName + '" not found in ' + moduleName,
      );
      return null;
    }
    console.log("  📌 Picked: " + moduleName + "." + exportName);
    return mod[exportName];
  }

  // ═══════════════════════════════════
  // 5. BUNDLE SIZE CALCULATOR
  // ═══════════════════════════════════
  function calculateBundleSize(eagerly, lazily) {
    var eagerSize = 0;
    var lazySize = 0;
    for (var i = 0; i < eagerly.length; i++) {
      eagerSize += (modules[eagerly[i]] || { size: 0 }).size;
    }
    for (var j = 0; j < lazily.length; j++) {
      lazySize += (modules[lazily[j]] || { size: 0 }).size;
    }
    console.log("  📊 Initial bundle: " + eagerSize + "KB");
    console.log("  📊 Lazy chunks:    " + lazySize + "KB");
    console.log("  📊 Total:          " + (eagerSize + lazySize) + "KB");
    console.log(
      "  📊 Savings:        " +
        lazySize +
        "KB deferred! (" +
        Math.round((lazySize / (eagerSize + lazySize)) * 100) +
        "%)",
    );
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  LAZY LOAD ENGINE DEMO              ║");
    console.log("╚════════════════════════════════════╝");

    // Register modules
    registerModule(
      "CompA",
      function () {
        return { name: "ComponentA", render: "<div>A</div>" };
      },
      50,
    );
    registerModule(
      "CompB",
      function () {
        return { name: "ComponentB", render: "<div>B</div>" };
      },
      100,
    );
    registerModule(
      "CompC",
      function () {
        return { name: "ComponentC", render: "<canvas/>" };
      },
      200,
    );
    registerModule(
      "fuse",
      function () {
        return {
          default: function FuseJS(data) {
            return {
              search: function (q) {
                return data.filter(function (d) {
                  return d.indexOf(q) >= 0;
                });
              },
            };
          },
          version: "7.0",
        };
      },
      30,
    );
    registerModule(
      "hello",
      function () {
        return {
          default: { name: "HelloDefault" },
          Hello: { name: "HelloNamed" },
          Goodbye: { name: "GoodbyeNamed" },
        };
      },
      10,
    );

    // Scenario 1: Pattern A — Separate bundle
    console.log("\n── Scenario 1: Separate Bundle ──");
    var compA = dynamic(function () {
      return dynamicImport("CompA");
    });
    compA.renderSSR();

    // Scenario 2: Pattern B — On-demand
    console.log("\n── Scenario 2: On-Demand ──");
    var compB = dynamic(function () {
      return dynamicImport("CompB");
    });
    console.log("  showMore = false → skip");
    console.log("  showMore = true →");
    compB.renderClient();

    // Scenario 3: Pattern C — ssr: false
    console.log("\n── Scenario 3: ssr: false ──");
    var compC = dynamic(
      function () {
        return dynamicImport("CompC");
      },
      {
        ssr: false,
        loading: function () {
          return "<Skeleton/>";
        },
      },
    );
    compC.renderSSR();
    compC.renderClient();

    // Scenario 4: External library
    console.log("\n── Scenario 4: External Library ──");
    var Fuse = importNamed("fuse", "default");
    var fuse = Fuse(["Tim", "Joe", "Bel"]);
    console.log('  Search "Jo": ' + JSON.stringify(fuse.search("Jo")));

    // Scenario 5: Named exports
    console.log("\n── Scenario 5: Named Exports ──");
    importNamed("hello", "Hello");
    importNamed("hello", "Goodbye");

    // Scenario 6: Bundle savings
    console.log("\n── Scenario 6: Bundle Size ──");
    calculateBundleSize(["CompA"], ["CompB", "CompC", "fuse"]);
  }

  return { demo: demo };
})();
// Chạy: LazyLoadEngine.demo();
```

---

## §9. Câu Hỏi Luyện Tập!

**Câu 1**: next/dynamic và React.lazy() khác nhau thế nào?

<details><summary>Đáp án</summary>

`next/dynamic` = **React.lazy() + Suspense COMPOSITE** + extras:

| Feature        | next/dynamic                  | React.lazy + Suspense      |
| -------------- | ----------------------------- | -------------------------- |
| Suspense       | **Built-in** (tự wrap)        | Manual Suspense wrap       |
| `ssr: false`   | ✅ Skip SSR                   | ❌ Không có                |
| `loading` prop | ✅ `{ loading: () => <...> }` | Dùng `<Suspense fallback>` |
| Named exports  | ✅ `.then(mod => mod.Name)`   | ❌ Chỉ default export      |
| app/ + pages/  | ✅ Cả hai                     | ✅ Cả hai                  |

**Khi nào dùng gì**: Trong Next.js → luôn dùng `next/dynamic`. React.lazy chỉ dùng khi muốn vanilla React API hoặc code không phụ thuộc Next.js.

</details>

---

**Câu 2**: 3 patterns import Client Components — khi nào dùng cái nào?

<details><summary>Đáp án</summary>

| Pattern                | Code                                                | Khi nào                                                                  |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| **A: Separate bundle** | `dynamic(() => import('./A'))` + render ngay        | Component CẦN ở initial render nhưng muốn tách chunk (parallel download) |
| **B: On-demand**       | `dynamic(() => import('./B'))` + conditional render | Modal, drawer, tabs, accordion — chỉ load khi user interact              |
| **C: Client-only**     | `dynamic(() => import('./C'), { ssr: false })`      | Browser-only APIs: Canvas, WebGL, Maps, localStorage                     |

**Pattern B** tiết kiệm NHẤT vì JS chunk chỉ download khi thực sự cần.

</details>

---

**Câu 3**: Tại sao `ssr: false` chỉ dùng trong Client Components?

<details><summary>Đáp án</summary>

**Server Components chạy TRÊN SERVER** — output là HTML/RSC payload. Chúng **không bao giờ chạy trên client**. Concept "skip SSR" **vô nghĩa** với Server Components vì chúng **chỉ có SSR**!

`ssr: false` nghĩa là: "KHÔNG render component TRÊN SERVER, chỉ render trên CLIENT". Điều này chỉ hợp lý cho **Client Components** — components chạy **CẢ** server (SSR) và client (hydration).

Nếu dùng `ssr: false` trong Server Component → Next.js throw error: `"ssr: false is not allowed with next/dynamic in Server Components. Please move it into a Client Component."`

</details>

---

**Câu 4**: dynamic() import Server Component → chuyện gì xảy ra?

<details><summary>Đáp án</summary>

Khi `dynamic()` import Server Component:

1. **Server Component bản thân** → **KHÔNG lazy-loaded** (vẫn render trên server như bình thường)
2. **Client Components CON** bên trong → **LAZY-LOADED** (tách chunk riêng!)
3. **Static assets** (CSS, fonts) → **PRELOADED** (tối ưu performance!)

Đây là behavior đặc biệt vì Server Components **đã tự động code-split** rồi. `dynamic()` chỉ giúp **preload CSS** và lazy-load **children Client Components**.

**Lưu ý**: Code splitting tự động cho Server Component dynamically importing Client Component **hiện chưa được hỗ trợ** — đây là limitation hiện tại.

</details>
