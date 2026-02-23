# Next.js Jest Testing — Deep Dive!

> **Chủ đề**: Jest + React Testing Library — Unit + Snapshot Testing!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/testing/jest
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Jest + RTL Là Gì?](#1)
2. [§2. Installation — 7 Packages!](#2)
3. [§3. jest.config.ts + next/jest!](#3)
4. [§4. Absolute Imports + Custom Matchers!](#4)
5. [§5. Creating Tests — Unit + Snapshot!](#5)
6. [§6. Running Tests!](#6)
7. [§7. Tự Viết — JestEngine!](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — Jest + RTL Là Gì?

```
  JEST + REACT TESTING LIBRARY:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  2 TOOLS — COMPLEMENTARY ROLES:                            │
  │  ┌──────────────────────────┬──────────────────────────┐   │
  │  │ Jest                     │ React Testing Library    │   │
  │  ├──────────────────────────┼──────────────────────────┤   │
  │  │ Test RUNNER!             │ Test UTILITIES!          │   │
  │  │ → describe, it, expect │ → render, screen,       │   │
  │  │ → Mocking, spying!     │   getByRole, getByText! │   │
  │  │ → Snapshot testing!     │ → Query DOM elements!   │   │
  │  │ → Coverage reports!     │ → User-centric testing! │   │
  │  │ → Watch mode!           │ → Accessibility-first!  │   │
  │  └──────────────────────────┴──────────────────────────┘   │
  │                                                            │
  │  2 TEST TYPES:                                              │
  │  ┌──────────────────────────┬──────────────────────────┐   │
  │  │ Unit Testing             │ Snapshot Testing         │   │
  │  ├──────────────────────────┼──────────────────────────┤   │
  │  │ Test component behavior! │ Track render changes!    │   │
  │  │ "Does h1 exist?"         │ "Did output change?"     │   │
  │  │ expect(el).toBeIn        │ expect(container)        │   │
  │  │   TheDocument()          │   .toMatchSnapshot()     │   │
  │  └──────────────────────────┴──────────────────────────┘   │
  │                                                            │
  │  ⚠️ LIMITATION:                                           │
  │  async Server Components: NOT supported by Jest!          │
  │  → Synchronous Server/Client Components: ✅ OK!          │
  │  → async components → use E2E tests (Cypress!)           │
  │                                                            │
  │  TESTING TOOLS OVERVIEW:                                    │
  │  ┌──────────────┬─────────────┬───────────┬────────────┐  │
  │  │              │ Jest+RTL    │ Cypress   │ Playwright │  │
  │  ├──────────────┼─────────────┼───────────┼────────────┤  │
  │  │ Type         │ Unit/Snap   │ E2E/Comp  │ E2E        │  │
  │  │ Environment  │ jsdom(fake!)│ Real      │ Real       │  │
  │  │              │             │ browser!  │ browser!   │  │
  │  │ Speed        │ ⚡ Fast!   │ Slower    │ Fast!      │  │
  │  │ Server need  │ ❌ No!    │ ✅ E2E   │ ✅ Yes    │  │
  │  │ async SC     │ ❌ No!    │ ✅ E2E   │ ✅ Yes    │  │
  │  │ Visual       │ Terminal    │ GUI+Term  │ Terminal   │  │
  │  └──────────────┴─────────────┴───────────┴────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Installation — 7 Packages!

```
  SETUP — 2 WAYS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  WAY 1: QUICKSTART (template!)                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ pnpm create next-app --example with-jest with-jest-app│ │
  │  │ → Pre-configured! Ready to go!                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  WAY 2: MANUAL (3 steps!)                                  │
  │                                                            │
  │  Step 1: Install 7 packages!                               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ pnpm add -D jest jest-environment-jsdom              │  │
  │  │   @testing-library/react @testing-library/dom        │  │
  │  │   @testing-library/jest-dom ts-node @types/jest      │  │
  │  │                                                      │  │
  │  │ 7 PACKAGES:                                          │  │
  │  │ ┌─────────────────────────┬──────────────────────┐   │  │
  │  │ │ Package                 │ Purpose              │   │  │
  │  │ ├─────────────────────────┼──────────────────────┤   │  │
  │  │ │ jest                    │ Test runner!         │   │  │
  │  │ │ jest-environment-jsdom  │ Browser DOM sim!     │   │  │
  │  │ │ @testing-library/react  │ render, screen!      │   │  │
  │  │ │ @testing-library/dom   │ DOM queries!         │   │  │
  │  │ │ @testing-library/      │ Custom matchers!     │   │  │
  │  │ │   jest-dom             │ toBeInTheDocument()! │   │  │
  │  │ │ ts-node                │ TypeScript support!  │   │  │
  │  │ │ @types/jest            │ Jest type defs!      │   │  │
  │  │ └─────────────────────────┴──────────────────────┘   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Step 2: Generate Jest config!                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ pnpm create jest@latest                              │  │
  │  │ → Interactive prompts!                              │  │
  │  │ → Creates jest.config.ts!                           │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Step 3: Add test scripts!                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // package.json                                      │  │
  │  │ "scripts": {                                         │  │
  │  │   "test": "jest",           ← Run once!             │  │
  │  │   "test:watch": "jest --watch" ← Watch mode!       │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. jest.config.ts + next/jest!

```
  JEST CONFIG — next/jest MAGIC!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  jest.config.ts:                                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ import type { Config } from 'jest'                   │  │
  │  │ import nextJest from 'next/jest.js'                  │  │
  │  │                                                      │  │
  │  │ const createJestConfig = nextJest({                  │  │
  │  │   dir: './',  // ← Path to Next.js app!            │  │
  │  │ })                                                   │  │
  │  │                                                      │  │
  │  │ const config: Config = {                             │  │
  │  │   coverageProvider: 'v8',  // ← Coverage engine!   │  │
  │  │   testEnvironment: 'jsdom', // ← Browser sim!      │  │
  │  │   // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'] │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ // MUST export this way! (async config!)             │  │
  │  │ export default createJestConfig(config)              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  next/jest AUTO-CONFIGURES 6 THINGS:                       │
  │  ┌───┬─────────────────────────┬────────────────────────┐  │
  │  │ # │ What                    │ How                    │  │
  │  ├───┼─────────────────────────┼────────────────────────┤  │
  │  │ 1 │ transform               │ Next.js Compiler (SWC)│  │
  │  │   │                         │ → Fast! Rust-based!  │  │
  │  │ 2 │ Auto-mock stylesheets   │ .css, .module.css,   │  │
  │  │   │                         │ .scss → mocked!      │  │
  │  │ 3 │ Auto-mock images +      │ Static imports →     │  │
  │  │   │ next/font               │ mocked strings!      │  │
  │  │ 4 │ Load .env files         │ .env → process.env!  │  │
  │  │ 5 │ Ignore node_modules     │ Skip from transform! │  │
  │  │   │ + .next                 │ Skip from resolve!   │  │
  │  │ 6 │ Load next.config.js     │ SWC transform flags! │  │
  │  └───┴─────────────────────────┴────────────────────────┘  │
  │                                                            │
  │  WHY next/jest MATTERS:                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ WITHOUT next/jest:             WITH next/jest:       │  │
  │  │ ┌──────────────────┐          ┌──────────────────┐  │  │
  │  │ │ Manual transform │          │ Auto-configured! │  │  │
  │  │ │ Manual mocks!    │          │ Auto-mocks!      │  │  │
  │  │ │ Manual .env!     │          │ Auto .env!       │  │  │
  │  │ │ LOTS of config!  │          │ Minimal config!  │  │  │
  │  │ │ Babel slow!      │          │ SWC fast! ⚡    │  │  │
  │  │ └──────────────────┘          └──────────────────┘  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Absolute Imports + Custom Matchers!

```
  MODULE PATH ALIASES:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  tsconfig.json / jsconfig.json:                           │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ {                                                    ││
  │  │   "compilerOptions": {                               ││
  │  │     "baseUrl": "./",                                 ││
  │  │     "paths": {                                       ││
  │  │       "@/components/*": ["components/*"]             ││
  │  │     }                                                ││
  │  │   }                                                  ││
  │  │ }                                                    ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  jest.config.ts cần moduleNameMapper:                    │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ moduleNameMapper: {                                   ││
  │  │   '^@/components/(.*)$': '<rootDir>/components/$1',  ││
  │  │ }                                                    ││
  │  │                                                      ││
  │  │ MAPPING:                                              ││
  │  │ Source:  import Button from '@/components/Button'     ││
  │  │ Jest:    resolves to → <rootDir>/components/Button   ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  CUSTOM MATCHERS — @testing-library/jest-dom:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Step 1: jest.config.ts                                   │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']      ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  Step 2: jest.setup.ts                                    │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ import '@testing-library/jest-dom'                    ││
  │  │                                                      ││
  │  │ → Adds custom matchers to expect()!                 ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  CUSTOM MATCHERS AVAILABLE:                               │
  │  ┌──────────────────────────┬──────────────────────────┐ │
  │  │ Matcher                  │ Checks                   │ │
  │  ├──────────────────────────┼──────────────────────────┤ │
  │  │ .toBeInTheDocument()     │ Element exists in DOM!   │ │
  │  │ .toBeVisible()           │ Element is visible!      │ │
  │  │ .toHaveTextContent('x')  │ Element has text 'x'!   │ │
  │  │ .toHaveAttribute('href') │ Element has attribute!   │ │
  │  │ .toBeDisabled()          │ Element is disabled!     │ │
  │  │ .toHaveClass('active')   │ Element has CSS class!   │ │
  │  │ .toBeChecked()           │ Checkbox/radio checked!  │ │
  │  └──────────────────────────┴──────────────────────────┘ │
  │                                                          │
  │  ⚠️ v6.0+: import '@testing-library/jest-dom'          │
  │  Pre-v6:   import '@testing-library/jest-dom/extend-     │
  │             expect'                                       │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Creating Tests — Unit + Snapshot!

```
  UNIT TEST + SNAPSHOT TEST:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  PROJECT STRUCTURE:                                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ my-app/                                              │  │
  │  │ ├── app/                                             │  │
  │  │ │   └── page.tsx           (component to test!)     │  │
  │  │ ├── __tests__/             ← TEST FOLDER!           │  │
  │  │ │   ├── page.test.tsx      (unit test!)             │  │
  │  │ │   └── snapshot.test.tsx  (snapshot test!)          │  │
  │  │ ├── jest.config.ts                                   │  │
  │  │ ├── jest.setup.ts                                    │  │
  │  │ └── package.json                                     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Component Under Test:                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // app/page.tsx                                      │  │
  │  │ import Link from 'next/link'                         │  │
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
  │  ① UNIT TEST:                                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // __tests__/page.test.tsx                           │  │
  │  │ import '@testing-library/jest-dom'                    │  │
  │  │ import { render, screen } from '@testing-library/    │  │
  │  │   react'                                             │  │
  │  │ import Page from '../app/page'                       │  │
  │  │                                                      │  │
  │  │ describe('Page', () => {                             │  │
  │  │   it('renders a heading', () => {                    │  │
  │  │     render(<Page />)       // Mount component!       │  │
  │  │     const heading = screen.getByRole('heading', {    │  │
  │  │       level: 1             // h1 specifically!       │  │
  │  │     })                                               │  │
  │  │     expect(heading).toBeInTheDocument() // Assert!    │  │
  │  │   })                                                 │  │
  │  │ })                                                   │  │
  │  │                                                      │  │
  │  │ FLOW:                                                │  │
  │  │ render() → screen.getByRole() → expect().toBe...() │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② SNAPSHOT TEST:                                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // __tests__/snapshot.test.tsx                        │  │
  │  │ import { render } from '@testing-library/react'      │  │
  │  │ import Page from '../app/page'                       │  │
  │  │                                                      │  │
  │  │ it('renders homepage unchanged', () => {             │  │
  │  │   const { container } = render(<Page />)             │  │
  │  │   expect(container).toMatchSnapshot()                │  │
  │  │ })                                                   │  │
  │  │                                                      │  │
  │  │ SNAPSHOT FLOW:                                        │  │
  │  │ 1st run: Generate snapshot file! (reference!)        │  │
  │  │ 2nd run: Compare with snapshot → MATCH? ✅ PASS!   │  │
  │  │          Changed? → ❌ FAIL! (review change!)      │  │
  │  │          Update: jest --updateSnapshot               │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. Running Tests!

```
  RUN COMMANDS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌──────────────────┬──────────────────────────────────┐ │
  │  │ Command          │ Purpose                          │ │
  │  ├──────────────────┼──────────────────────────────────┤ │
  │  │ pnpm test        │ Run ALL tests once!              │ │
  │  │ pnpm test:watch  │ Watch mode! Re-run on changes!  │ │
  │  │ jest --coverage  │ Generate coverage report!        │ │
  │  │ jest --update    │ Update snapshots!                │ │
  │  │ Snapshot                                            │ │
  │  │ jest path/to/    │ Run specific test file!          │ │
  │  │ test.ts                                             │ │
  │  └──────────────────┴──────────────────────────────────┘ │
  │                                                          │
  │  TEST OUTPUT:                                             │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ PASS  __tests__/page.test.tsx                        ││
  │  │   Page                                               ││
  │  │     ✅ renders a heading (15 ms)                    ││
  │  │                                                      ││
  │  │ PASS  __tests__/snapshot.test.tsx                     ││
  │  │     ✅ renders homepage unchanged (8 ms)            ││
  │  │                                                      ││
  │  │ Test Suites: 2 passed, 2 total                       ││
  │  │ Tests:       2 passed, 2 total                       ││
  │  │ Time:        1.234 s                                 ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — JestEngine!

```javascript
var JestEngine = (function () {
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
    // Build textContent from children
    for (var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      if (typeof child === "string") {
        el.textContent += child;
      } else if (child && child.textContent) {
        el.textContent += child.textContent;
      }
    }
    return el;
  }

  // ═══════════════════════════════════
  // 2. render() — React Testing Library
  // ═══════════════════════════════════
  function render(component) {
    document.elements = [];
    // Flatten component tree into elements
    function flatten(node) {
      if (!node) return;
      if (typeof node === "string") return;
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

  // ═══════════════════════════════════
  // 3. screen queries
  // ═══════════════════════════════════
  var screen = {
    getByRole: function (role, options) {
      var tagMap = { heading: "h1" };
      var targetTag = tagMap[role] || role;
      if (options && options.level) {
        targetTag = "h" + options.level;
      }
      for (var i = 0; i < document.elements.length; i++) {
        if (document.elements[i].tag === targetTag) {
          return document.elements[i];
        }
      }
      throw new Error('Unable to find role="' + role + '"');
    },

    getByText: function (text) {
      for (var i = 0; i < document.elements.length; i++) {
        if (document.elements[i].textContent.indexOf(text) !== -1) {
          return document.elements[i];
        }
      }
      throw new Error('Unable to find text: "' + text + '"');
    },

    queryByText: function (text) {
      try {
        return screen.getByText(text);
      } catch (e) {
        return null;
      }
    },
  };

  // ═══════════════════════════════════
  // 4. expect() + matchers
  // ═══════════════════════════════════
  function expect(actual) {
    return {
      toBeInTheDocument: function () {
        var found = false;
        for (var i = 0; i < document.elements.length; i++) {
          if (document.elements[i] === actual) {
            found = true;
            break;
          }
        }
        if (!found) throw new Error("Element NOT in document!");
        return true;
      },

      toHaveTextContent: function (text) {
        if (!actual || actual.textContent.indexOf(text) === -1) {
          throw new Error(
            'Expected text "' +
              text +
              '", got "' +
              (actual ? actual.textContent : "null") +
              '"',
          );
        }
        return true;
      },

      toMatchSnapshot: function () {
        var snapshot = JSON.stringify(actual, null, 2);
        if (!snapshotStore[currentTest]) {
          snapshotStore[currentTest] = snapshot;
          return { status: "CREATED", firstRun: true };
        }
        if (snapshotStore[currentTest] !== snapshot) {
          throw new Error(
            "Snapshot MISMATCH!\n" +
              "Stored: " +
              snapshotStore[currentTest] +
              "\n" +
              "Got:    " +
              snapshot,
          );
        }
        return { status: "MATCHED" };
      },

      toBe: function (expected) {
        if (actual !== expected)
          throw new Error("Expected " + expected + ", got " + actual);
        return true;
      },

      not: {
        toBeNull: function () {
          if (actual === null) throw new Error("Expected NOT null!");
          return true;
        },
      },
    };
  }

  // ═══════════════════════════════════
  // 5. SNAPSHOT STORE
  // ═══════════════════════════════════
  var snapshotStore = {};
  var currentTest = "";

  // ═══════════════════════════════════
  // 6. TEST RUNNER
  // ═══════════════════════════════════
  var results = [];

  function describe(name, fn) {
    console.log("\n  📋 " + name);
    fn();
  }

  function it(name, fn) {
    currentTest = name;
    try {
      fn();
      results.push({ test: name, status: "✅ PASS" });
      console.log("    ✅ " + name);
    } catch (e) {
      results.push({ test: name, status: "❌ FAIL", error: e.message || e });
      console.log("    ❌ " + name + " — " + (e.message || e));
    }
  }

  // ═══════════════════════════════════
  // 7. MODULE NAME MAPPER
  // ═══════════════════════════════════
  function resolveImport(importPath, aliases) {
    for (var pattern in aliases) {
      var regex = new RegExp("^" + pattern.replace("*", "(.*)"));
      var match = importPath.match(regex);
      if (match) {
        var target = aliases[pattern].replace("*", match[1] || "");
        return { original: importPath, resolved: target };
      }
    }
    return { original: importPath, resolved: importPath };
  }

  // ═══════════════════════════════════
  // 8. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  JEST ENGINE DEMO                   ║");
    console.log("╚════════════════════════════════════╝");

    // Build component tree
    var PageComponent = createElement("div", {}, [
      createElement("h1", {}, ["Home"]),
      createElement("a", { href: "/about" }, ["About"]),
    ]);

    // Unit test
    describe("Page", function () {
      it("renders a heading", function () {
        render(PageComponent);
        var heading = screen.getByRole("heading", { level: 1 });
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveTextContent("Home");
      });

      it("renders About link", function () {
        render(PageComponent);
        var link = screen.getByText("About");
        expect(link).not.toBeNull();
        expect(link).toBeInTheDocument();
      });
    });

    // Snapshot test
    describe("Snapshot", function () {
      it("renders homepage unchanged (1st)", function () {
        var { container } = render(PageComponent);
        var result = expect(container).toMatchSnapshot();
        console.log("      Snapshot:", result.status);
      });

      it("renders homepage unchanged (2nd)", function () {
        var { container } = render(PageComponent);
        var result = expect(container).toMatchSnapshot();
        console.log("      Snapshot:", result.status);
      });
    });

    // Module aliases
    console.log("\n── Module Aliases ──");
    var aliases = { "@/components/*": "<rootDir>/components/*" };
    console.log("  ", resolveImport("@/components/Button", aliases));
    console.log("  ", resolveImport("@/components/Card", aliases));
    console.log("  ", resolveImport("./utils/helper", aliases));

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
// Chạy: JestEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: `next/jest` auto-configures 6 thứ — kể tên?

<details><summary>Đáp án</summary>

| #   | What                             | Detail                                                      |
| --- | -------------------------------- | ----------------------------------------------------------- |
| 1   | **transform**                    | Dùng Next.js Compiler (SWC, Rust!) thay vì Babel! Fast!     |
| 2   | **Auto-mock CSS**                | `.css`, `.module.css`, `.scss` → mocked! (không parse CSS!) |
| 3   | **Auto-mock images + next/font** | Static imports → mocked strings!                            |
| 4   | **Load .env**                    | `.env`, `.env.local`, `.env.test` → `process.env`!          |
| 5   | **Ignore node_modules + .next**  | Skip từ transform + resolve! Faster!                        |
| 6   | **Load next.config.js**          | SWC transform flags (experimental features!)                |

→ **without next/jest**: phải config TẤT CẢ manually! 😱

</details>

---

**Câu 2**: Unit test vs Snapshot test — khác nhau?

<details><summary>Đáp án</summary>

|                     | Unit Test                        | Snapshot Test                         |
| ------------------- | -------------------------------- | ------------------------------------- |
| **Question**        | "Does element X exist?"          | "Did output change?"                  |
| **Assert**          | `expect(el).toBeInTheDocument()` | `expect(container).toMatchSnapshot()` |
| **First run**       | Pass/Fail immediately            | Creates snapshot FILE!                |
| **Next runs**       | Pass/Fail based on assertion     | Compare with stored snapshot!         |
| **Change detected** | Only what you assert!            | ANY render change!                    |
| **Update**          | Fix code or assertion!           | `jest --updateSnapshot`!              |

**When to use**: Unit = specific behavior. Snapshot = catch unexpected UI changes!

</details>

---

**Câu 3**: `moduleNameMapper` — tại sao cần?

<details><summary>Đáp án</summary>

```
Problem:
  Source code: import Button from '@/components/Button'
  tsconfig: paths: { "@/components/*": ["components/*"] }

  Next.js: resolves @/ → components/ ✅
  Jest:    DOESN'T know about tsconfig paths! ❌ ERROR!

Fix: moduleNameMapper in jest.config.ts!
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
  }

  Jest now resolves:
  '@/components/Button' → '<rootDir>/components/Button' ✅
```

</details>

---

**Câu 4**: async Server Components — tại sao Jest KHÔNG support?

<details><summary>Đáp án</summary>

```
async Server Components:
  → Chạy trên SERVER (Node.js runtime!)
  → Await data fetching DURING render!
  → Mới trong React ecosystem!

Jest:
  → Chạy trong jsdom (fake browser!)
  → KHÔNG có server runtime!
  → KHÔNG support async component rendering!

Workarounds:
  ① Synchronous Server Components → ✅ Jest works!
  ② Client Components → ✅ Jest works!
  ③ async Components → ❌ Use E2E tests (Cypress/Playwright!)
```

</details>
