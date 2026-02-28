# Next.js Vitest Testing — Deep Dive!

> **Chủ đề**: Vitest — Unit Testing Cực Nhanh Với Vite!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/testing/vitest
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Vitest Là Gì?](#1)
2. [§2. Installation — 6 Packages!](#2)
3. [§3. vitest.config.mts — Plugins!](#3)
4. [§4. Creating Unit Tests!](#4)
5. [§5. Running Tests + Watch Mode!](#5)
6. [§6. Vitest vs Jest — So Sánh!](#6)
7. [§7. Tự Viết — VitestEngine!](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — Vitest Là Gì?

```
  VITEST — VITE-NATIVE TEST FRAMEWORK!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  2 TOOLS — COMPLEMENTARY ROLES:                            │
  │  ┌──────────────────────────┬──────────────────────────┐   │
  │  │ Vitest                   │ React Testing Library    │   │
  │  ├──────────────────────────┼──────────────────────────┤   │
  │  │ Test RUNNER!             │ Test UTILITIES!          │   │
  │  │ → test, expect, vi     │ → render, screen,       │   │
  │  │ → Watch mode by default!│   getByRole, getByText! │   │
  │  │ → Vite-powered fast! ⚡│ → User-centric testing! │   │
  │  │ → ESM native!          │ → Accessibility-first!  │   │
  │  │ → Jest-compatible API! │ → Same as Jest+RTL!     │   │
  │  └──────────────────────────┴──────────────────────────┘   │
  │                                                            │
  │  WHY VITEST OVER JEST?                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Vite (build tool)                                    │  │
  │  │   │                                                  │  │
  │  │   ├──► Vitest (test runner)                         │  │
  │  │   │    → SHARES same config! (vite.config.ts!)     │  │
  │  │   │    → SHARES same transform pipeline!           │  │
  │  │   │    → ESM/TypeScript NATIVE! (no Babel!)        │  │
  │  │   │    → HMR-like test re-runs! ⚡                │  │
  │  │   │                                                  │  │
  │  │   └──► Vite Dev Server                              │  │
  │  │        → SAME bundler powers both!                  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⚠️ LIMITATION:                                           │
  │  async Server Components: NOT supported by Vitest!        │
  │  → Synchronous Server/Client Components: ✅ OK!          │
  │  → async components → use E2E tests! (Playwright!)       │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Installation — 6 Packages!

```
  SETUP — 2 WAYS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  WAY 1: QUICKSTART (template!)                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ pnpm create next-app --example with-vitest           │  │
  │  │   with-vitest-app                                    │  │
  │  │ → Pre-configured! Ready to test! 🎉               │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  WAY 2: MANUAL (3 steps!)                                  │
  │                                                            │
  │  Step 1: Install packages!                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ # TypeScript:                                        │  │
  │  │ pnpm add -D vitest @vitejs/plugin-react jsdom        │  │
  │  │   @testing-library/react @testing-library/dom        │  │
  │  │   vite-tsconfig-paths                                │  │
  │  │                                                      │  │
  │  │ # JavaScript (no vite-tsconfig-paths):               │  │
  │  │ pnpm add -D vitest @vitejs/plugin-react jsdom        │  │
  │  │   @testing-library/react @testing-library/dom        │  │
  │  │                                                      │  │
  │  │ 6 PACKAGES (TypeScript):                             │  │
  │  │ ┌─────────────────────────┬──────────────────────┐   │  │
  │  │ │ Package                 │ Purpose              │   │  │
  │  │ ├─────────────────────────┼──────────────────────┤   │  │
  │  │ │ vitest                  │ Test runner! ⚡      │   │  │
  │  │ │ @vitejs/plugin-react    │ React JSX transform! │   │  │
  │  │ │ jsdom                   │ Browser DOM sim!     │   │  │
  │  │ │ @testing-library/react  │ render, screen!      │   │  │
  │  │ │ @testing-library/dom   │ DOM queries!         │   │  │
  │  │ │ vite-tsconfig-paths     │ TS path aliases!     │   │  │
  │  │ │                         │ (@/ → resolved!)    │   │  │
  │  │ └─────────────────────────┴──────────────────────┘   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Step 2: Create vitest.config.mts!                         │
  │  (See §3!)                                                 │
  │                                                            │
  │  Step 3: Add test script!                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // package.json                                      │  │
  │  │ "scripts": {                                         │  │
  │  │   "test": "vitest"   ← WATCH MODE by default!      │  │
  │  │ }                                                    │  │
  │  │ → pnpm test → vitest starts watching!              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  VITEST vs JEST PACKAGES:                                   │
  │  ┌───────────────────────┬────────────────────────────┐    │
  │  │ Jest needs (7 pkgs!)  │ Vitest needs (5-6 pkgs!)  │    │
  │  ├───────────────────────┼────────────────────────────┤    │
  │  │ jest                  │ vitest                     │    │
  │  │ jest-environment-jsdom│ jsdom  (same!)             │    │
  │  │ @testing-library/react│ @testing-library/react     │    │
  │  │ @testing-library/dom │ @testing-library/dom       │    │
  │  │ @testing-library/     │ (NOT needed! Vitest has   │    │
  │  │   jest-dom            │  built-in matchers!)       │    │
  │  │ ts-node               │ (NOT needed! ESM native!) │    │
  │  │ @types/jest           │ (NOT needed! TS built-in!)│    │
  │  │ —                     │ @vitejs/plugin-react       │    │
  │  │ —                     │ vite-tsconfig-paths (TS)   │    │
  │  └───────────────────────┴────────────────────────────┘    │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. vitest.config.mts — Plugins!

```
  CONFIG FILE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  vitest.config.mts (or .js):                               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ import { defineConfig } from 'vitest/config'         │  │
  │  │ import react from '@vitejs/plugin-react'             │  │
  │  │ import tsconfigPaths from 'vite-tsconfig-paths'      │  │
  │  │                                                      │  │
  │  │ export default defineConfig({                        │  │
  │  │   plugins: [                                         │  │
  │  │     tsconfigPaths(), // ← TS path aliases!         │  │
  │  │     react(),         // ← React JSX transform!     │  │
  │  │   ],                                                 │  │
  │  │   test: {                                            │  │
  │  │     environment: 'jsdom', // ← Browser sim!        │  │
  │  │   },                                                 │  │
  │  │ })                                                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  3 KEY SETTINGS:                                            │
  │  ┌───┬──────────────────────┬───────────────────────────┐  │
  │  │ # │ Setting              │ Purpose                   │  │
  │  ├───┼──────────────────────┼───────────────────────────┤  │
  │  │ 1 │ tsconfigPaths()      │ Resolve @/ paths!         │  │
  │  │   │                      │ tsconfig.json → Vitest!  │  │
  │  │   │                      │ Auto-read paths config!  │  │
  │  │ 2 │ react()              │ Transform JSX/TSX!        │  │
  │  │   │                      │ React Fast Refresh!       │  │
  │  │   │                      │ 'use client' support!    │  │
  │  │ 3 │ environment: 'jsdom' │ Simulate browser DOM!     │  │
  │  │   │                      │ window, document, etc!   │  │
  │  │   │                      │ No real browser needed!  │  │
  │  └───┴──────────────────────┴───────────────────────────┘  │
  │                                                            │
  │  VITEST vs JEST CONFIG:                                     │
  │  ┌──────────────────────────┬───────────────────────────┐  │
  │  │ Jest (jest.config.ts)    │ Vitest (vitest.config.mts)│  │
  │  ├──────────────────────────┼───────────────────────────┤  │
  │  │ import nextJest          │ import defineConfig       │  │
  │  │ from 'next/jest.js'      │ from 'vitest/config'      │  │
  │  │                          │                           │  │
  │  │ createJestConfig({...})  │ defineConfig({...})       │  │
  │  │ → async wrapper needed! │ → direct config!         │  │
  │  │                          │                           │  │
  │  │ testEnvironment: 'jsdom' │ test: {environment:       │  │
  │  │                          │   'jsdom'}                │  │
  │  │                          │                           │  │
  │  │ moduleNameMapper: {...}  │ tsconfigPaths() plugin!   │  │
  │  │ → manual regex mapping! │ → auto from tsconfig!    │  │
  │  │                          │                           │  │
  │  │ setupFilesAfterEnv:     │ (NOT needed by default!)  │  │
  │  │ ['jest.setup.ts']        │                           │  │
  │  └──────────────────────────┴───────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Creating Unit Tests!

```
  UNIT TEST:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  PROJECT STRUCTURE — 2 conventions:                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Convention 1: __tests__/ folder                      │  │
  │  │ my-app/                                              │  │
  │  │ ├── app/                                             │  │
  │  │ │   └── page.tsx                                     │  │
  │  │ ├── __tests__/          ← TEST FOLDER!              │  │
  │  │ │   └── page.test.tsx                                │  │
  │  │ └── vitest.config.mts                                │  │
  │  │                                                      │  │
  │  │ Convention 2: Colocated (in app/)                    │  │
  │  │ my-app/                                              │  │
  │  │ ├── app/                                             │  │
  │  │ │   ├── page.tsx                                     │  │
  │  │ │   └── page.test.tsx   ← NEXT TO component!       │  │
  │  │ └── vitest.config.mts                                │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Component Under Test:                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // app/page.tsx                                      │  │
  │  │ import Link from 'next/link'                         │  │
  │  │                                                      │  │
  │  │ export default function Page() {                     │  │
  │  │   return (                                           │  │
  │  │     <div>                                            │  │
  │  │       <h1>Home</h1>                                  │  │
  │  │       <Link href="/about">About</Link>               │  │
  │  │     </div>                                           │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Unit Test:                                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // __tests__/page.test.tsx                           │  │
  │  │ import { expect, test } from 'vitest'                │  │
  │  │ import { render, screen } from '@testing-library/    │  │
  │  │   react'                                             │  │
  │  │ import Page from '../app/page'                       │  │
  │  │                                                      │  │
  │  │ test('Page', () => {                                 │  │
  │  │   render(<Page />)                                   │  │
  │  │   expect(                                            │  │
  │  │     screen.getByRole('heading', {                    │  │
  │  │       level: 1,                                      │  │
  │  │       name: 'Home'                                   │  │
  │  │     })                                               │  │
  │  │   ).toBeDefined()                                    │  │
  │  │ })                                                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  API COMPARISON — Vitest vs Jest:                           │
  │  ┌──────────────────────────┬───────────────────────────┐  │
  │  │ Vitest                   │ Jest                      │  │
  │  ├──────────────────────────┼───────────────────────────┤  │
  │  │ import { test, expect }  │ (No import needed!)      │  │
  │  │ from 'vitest'            │ → Jest globals!          │  │
  │  │                          │                           │  │
  │  │ test('name', () => {})   │ test('name', () => {})   │  │
  │  │ (SAME!)                  │ (SAME!)                   │  │
  │  │                          │                           │  │
  │  │ expect(x).toBeDefined()  │ expect(x).toBeIn         │  │
  │  │                          │   TheDocument()           │  │
  │  │ (Vitest built-in!)       │ (needs jest-dom!)        │  │
  │  └──────────────────────────┴───────────────────────────┘  │
  │                                                            │
  │  TEST FLOW:                                                 │
  │  render(<Page />) → screen.getByRole() → expect()        │
  │  (mount)            (find element)        (assert!)        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Running Tests + Watch Mode!

```
  RUNNING:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  pnpm test → vitest                                    │
  │  → WATCH MODE by default! ⚡                          │
  │                                                          │
  │  WATCH MODE:                                              │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ $ pnpm test                                          ││
  │  │                                                      ││
  │  │  ✅ __tests__/page.test.tsx                         ││
  │  │    ✅ Page (5ms)                                    ││
  │  │                                                      ││
  │  │  Tests: 1 passed                                     ││
  │  │  Time: 0.5s                                          ││
  │  │                                                      ││
  │  │  Watching for file changes...                        ││
  │  │  ← Vitest WAITS! Any file change → re-run! ⚡     ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  COMMANDS:                                                │
  │  ┌──────────────────┬──────────────────────────────────┐ │
  │  │ Command          │ Purpose                          │ │
  │  ├──────────────────┼──────────────────────────────────┤ │
  │  │ pnpm test        │ Watch mode! Re-run on changes!  │ │
  │  │ vitest run       │ Run ONCE! (CI mode!)            │ │
  │  │ vitest --ui      │ Visual UI in browser!           │ │
  │  │ vitest --coverage│ Generate coverage report!        │ │
  │  └──────────────────┴──────────────────────────────────┘ │
  │                                                          │
  │  JEST vs VITEST DEFAULT:                                  │
  │  ┌───────────────────┬────────────────────┐              │
  │  │ Jest              │ Vitest             │              │
  │  ├───────────────────┼────────────────────┤              │
  │  │ "test": "jest"    │ "test": "vitest"   │              │
  │  │ → Run ONCE!      │ → WATCH by default!│              │
  │  │ Need --watch flag!│ Need "run" for once│              │
  │  └───────────────────┴────────────────────┘              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Vitest vs Jest — So Sánh Chi Tiết!

```
  VITEST vs JEST:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌──────────────────┬─────────────────┬────────────────┐ │
  │  │                  │ Vitest          │ Jest           │ │
  │  ├──────────────────┼─────────────────┼────────────────┤ │
  │  │ Powered by       │ Vite (esbuild!) │ Babel/SWC      │ │
  │  │ ESM support      │ Native! ✅     │ Needs config!  │ │
  │  │ TypeScript        │ Native! ✅     │ ts-node needed!│ │
  │  │ Watch mode       │ Default! ✅    │ Need --watch!  │ │
  │  │ Speed            │ ⚡ Faster!     │ Slower!         │ │
  │  │ Config           │ vitest.config   │ jest.config +   │ │
  │  │                  │ (shares Vite!)  │ next/jest       │ │
  │  │ Path aliases     │ vite-tsconfig   │ moduleNameMapper│ │
  │  │                  │ -paths plugin!  │ (manual regex!) │ │
  │  │ API              │ Jest-compatible!│ Original!       │ │
  │  │                  │ (same test,     │                │ │
  │  │                  │  expect, vi!)   │                │ │
  │  │ Import style     │ import { test } │ Auto globals!  │ │
  │  │                  │ from 'vitest'   │ (no import!)   │ │
  │  │ Matchers         │ Built-in!       │ Need jest-dom! │ │
  │  │ UI               │ vitest --ui     │ Third-party!   │ │
  │  │ Coverage         │ c8 or istanbul  │ v8 or istanbul │ │
  │  │ async SC         │ ❌ Not yet!    │ ❌ Not yet!   │ │
  │  │ Next.js built-in │ ❌ (manual!)   │ ✅ next/jest! │ │
  │  └──────────────────┴─────────────────┴────────────────┘ │
  │                                                          │
  │  WHEN TO USE WHICH?                                       │
  │  ① Already using Vite? → Vitest! (shared config!)      │
  │  ② New project? → Vitest! (faster, modern!)             │
  │  ③ Existing Jest project? → Keep Jest! (next/jest!)     │
  │  ④ Need next/jest auto-config? → Jest!                  │
  │  ⑤ Want watch by default? → Vitest!                     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — VitestEngine!

```javascript
var VitestEngine = (function () {
  // ═══════════════════════════════════
  // 1. DOM SIMULATOR (jsdom-like!)
  // ═══════════════════════════════════
  var document = { elements: [] };

  function createElement(tag, props, children) {
    var el = {
      tag: tag,
      props: props || {},
      children: children || [],
      textContent: "",
    };
    for (var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      if (typeof child === "string") el.textContent += child;
      else if (child && child.textContent) el.textContent += child.textContent;
    }
    return el;
  }

  // ═══════════════════════════════════
  // 2. render() + screen
  // ═══════════════════════════════════
  function render(component) {
    document.elements = [];
    function flatten(node) {
      if (!node || typeof node === "string") return;
      document.elements.push(node);
      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
          flatten(node.children[i]);
        }
      }
    }
    flatten(component);
    return { container: component };
  }

  var screen = {
    getByRole: function (role, options) {
      var tagMap = { heading: "h1", link: "a", button: "button" };
      var targetTag = tagMap[role] || role;
      if (options && options.level) targetTag = "h" + options.level;

      for (var i = 0; i < document.elements.length; i++) {
        var el = document.elements[i];
        if (el.tag === targetTag) {
          if (options && options.name) {
            if (el.textContent.indexOf(options.name) !== -1) return el;
          } else {
            return el;
          }
        }
      }
      throw new Error(
        'Unable to find role="' +
          role +
          '"' +
          (options ? ' name="' + options.name + '"' : ""),
      );
    },

    getByText: function (text) {
      for (var i = 0; i < document.elements.length; i++) {
        if (document.elements[i].textContent.indexOf(text) !== -1)
          return document.elements[i];
      }
      throw new Error('Unable to find text: "' + text + '"');
    },
  };

  // ═══════════════════════════════════
  // 3. expect() — Vitest-style!
  // ═══════════════════════════════════
  function expect(actual) {
    return {
      toBeDefined: function () {
        if (actual === undefined)
          throw new Error("Expected defined, got undefined!");
        return true;
      },
      toBe: function (expected) {
        if (actual !== expected)
          throw new Error("Expected " + expected + ", got " + actual);
        return true;
      },
      toEqual: function (expected) {
        var a = JSON.stringify(actual);
        var b = JSON.stringify(expected);
        if (a !== b) throw new Error("Expected " + b + ", got " + a);
        return true;
      },
      toContain: function (item) {
        if (typeof actual === "string") {
          if (actual.indexOf(item) === -1)
            throw new Error('"' + actual + '" does not contain "' + item + '"');
        }
        return true;
      },
      not: {
        toBeUndefined: function () {
          if (actual === undefined) throw new Error("Expected NOT undefined!");
          return true;
        },
      },
    };
  }

  // ═══════════════════════════════════
  // 4. TEST RUNNER + WATCH SIM
  // ═══════════════════════════════════
  var results = [];
  var watchCallbacks = [];

  function test(name, fn) {
    try {
      fn();
      results.push({ test: name, status: "✅ PASS" });
      console.log("  ✅ " + name);
    } catch (e) {
      results.push({ test: name, status: "❌ FAIL", error: e.message || e });
      console.log("  ❌ " + name + " — " + (e.message || e));
    }
  }

  function describe(name, fn) {
    console.log("\n  📋 " + name);
    fn();
  }

  // ═══════════════════════════════════
  // 5. WATCH MODE SIMULATOR
  // ═══════════════════════════════════
  function watch(testFn) {
    watchCallbacks.push(testFn);
    return {
      watching: true,
      message: "Watching for file changes... (press q to quit)",
      rerun: function () {
        console.log("  🔄 File changed! Re-running tests...");
        results = [];
        testFn();
      },
    };
  }

  // ═══════════════════════════════════
  // 6. PLUGIN SIMULATOR
  // ═══════════════════════════════════
  function tsconfigPaths() {
    return {
      name: "vite-tsconfig-paths",
      resolveId: function (source) {
        if (source.startsWith("@/")) {
          return source.replace("@/", "./");
        }
        return null;
      },
    };
  }

  function reactPlugin() {
    return {
      name: "@vitejs/plugin-react",
      transform: function (code) {
        // Simulate JSX transform
        return code
          .replace(/<(\w+)>/g, 'createElement("$1", null, ')
          .replace(/<\/\w+>/g, ")");
      },
    };
  }

  function defineConfig(options) {
    return {
      plugins: options.plugins || [],
      test: options.test || {},
      resolved: true,
    };
  }

  // ═══════════════════════════════════
  // 7. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  VITEST ENGINE DEMO                 ║");
    console.log("╚════════════════════════════════════╝");

    // Config
    console.log("\n── Config ──");
    var config = defineConfig({
      plugins: [tsconfigPaths(), reactPlugin()],
      test: { environment: "jsdom" },
    });
    console.log(
      "  Plugins:",
      config.plugins.map(function (p) {
        return p.name;
      }),
    );
    console.log("  Environment:", config.test.environment);

    // Path resolution
    console.log("\n── Path Resolution ──");
    var paths = tsconfigPaths();
    console.log(
      "  @/components/Button →",
      paths.resolveId("@/components/Button"),
    );
    console.log("  ./utils/helper →", paths.resolveId("./utils/helper"));

    // Build component
    var PageComponent = createElement("div", {}, [
      createElement("h1", {}, ["Home"]),
      createElement("a", { href: "/about" }, ["About"]),
    ]);

    // Unit tests
    console.log("\n── Unit Tests ──");
    describe("Page", function () {
      test("renders heading", function () {
        render(PageComponent);
        var heading = screen.getByRole("heading", {
          level: 1,
          name: "Home",
        });
        expect(heading).toBeDefined();
      });

      test("renders About link", function () {
        render(PageComponent);
        var link = screen.getByText("About");
        expect(link).toBeDefined();
        expect(link.props.href).toBe("/about");
      });

      test("heading has correct text", function () {
        render(PageComponent);
        var heading = screen.getByRole("heading", { level: 1 });
        expect(heading.textContent).toContain("Home");
      });
    });

    // Watch mode
    console.log("\n── Watch Mode ──");
    var w = watch(function () {
      test("re-run: heading exists", function () {
        render(PageComponent);
        expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
      });
    });
    console.log("  " + w.message);
    w.rerun();

    // Summary
    console.log("\n── Results ──");
    var pass = 0,
      fail = 0;
    for (var i = 0; i < results.length; i++) {
      if (results[i].status.indexOf("PASS") !== -1) pass++;
      else fail++;
    }
    console.log(
      "  Total: " + results.length + " | Pass: " + pass + " | Fail: " + fail,
    );
  }

  return { demo: demo };
})();
// Chạy: VitestEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: Vitest — tại sao nhanh hơn Jest?

<details><summary>Đáp án</summary>

```
Vitest:
  → Powered by Vite (esbuild!) = Rust/Go compiled!
  → ESM NATIVE! (no CommonJS transform!)
  → TypeScript NATIVE! (no ts-node, no Babel!)
  → HMR-like re-runs! (only changed tests!)
  → Shares Vite config! (no duplicate setup!)

Jest:
  → Babel or SWC transform! (extra step!)
  → CommonJS by default! (CJS → ESM overhead!)
  → Needs ts-node for TypeScript!
  → Full re-transform on changes!
  → Separate config from bundler!

Result:
  Vitest ⚡ ≈ 2-5x faster than Jest for many projects!
```

</details>

---

**Câu 2**: `vite-tsconfig-paths` plugin — tại sao cần?

<details><summary>Đáp án</summary>

|             | Without plugin                                           | With plugin                       |
| ----------- | -------------------------------------------------------- | --------------------------------- |
| **Problem** | `@/components/Button` → ERROR! Vitest doesn't know `@/`! | Auto-resolved! ✅                 |
| **Source**  | tsconfig.json: `"@/*": ["./app/*"]`                      | Same tsconfig!                    |
| **Fix**     | Manual moduleNameMapper (regex! tedious!)                | Plugin reads tsconfig paths AUTO! |

```
// tsconfig.json
"paths": { "@/*": ["./app/*"] }

// vite-tsconfig-paths reads this!
import Button from '@/components/Button'
→ resolves to → ./app/components/Button ✅
```

**vs Jest**: Jest needs manual `moduleNameMapper` with regex! Vitest plugin = automatic!

</details>

---

**Câu 3**: `vitest` vs `vitest run` — khác nhau?

<details><summary>Đáp án</summary>

| Command             | Mode                 | Behavior                                         |
| ------------------- | -------------------- | ------------------------------------------------ |
| `vitest`            | **Watch** (default!) | Runs tests → watches files → re-runs on changes! |
| `vitest run`        | **One-shot**         | Runs tests ONCE → exits! (CI!)                   |
| `vitest --ui`       | **UI mode**          | Opens browser UI for test results!               |
| `vitest --coverage` | **Coverage**         | Generates coverage report!                       |

**Important**: Jest defaults to **run once**. Vitest defaults to **watch**!

</details>

---

**Câu 4**: `@vitejs/plugin-react` — trong vitest.config.mts để làm gì?

<details><summary>Đáp án</summary>

```
Purpose: Transform JSX/TSX syntax!

Without plugin:
  <h1>Home</h1>  → SyntaxError! (JSX not valid JS!)

With plugin:
  <h1>Home</h1>  → React.createElement('h1', null, 'Home')
  → Vitest can execute transformed code! ✅

Also provides:
  ① React Fast Refresh support!
  ② 'use client' / 'use server' directive handling!
  ③ Automatic JSX runtime (React 17+ new transform!)
```

</details>
