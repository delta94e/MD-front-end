# Next.js Cypress Testing — Deep Dive!

> **Chủ đề**: Cypress — E2E + Component Testing Với Next.js!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/testing/cypress
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Cypress Là Gì?](#1)
2. [§2. Installation + Setup!](#2)
3. [§3. E2E Testing — End-to-End!](#3)
4. [§4. Component Testing!](#4)
5. [§5. CI — Continuous Integration!](#5)
6. [§6. E2E vs Component Testing!](#6)
7. [§7. Tự Viết — CypressEngine!](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — Cypress Là Gì?

```
  CYPRESS — TEST RUNNER!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  2 TESTING MODES:                                           │
  │  ┌──────────────────────────┬──────────────────────────┐   │
  │  │ E2E Testing              │ Component Testing        │   │
  │  ├──────────────────────────┼──────────────────────────┤   │
  │  │ Full app in REAL browser!│ Single component in      │   │
  │  │ Navigate between pages!  │ isolation!               │   │
  │  │ Real server running!     │ NO server needed!        │   │
  │  │ Test user flows!         │ Test render + behavior!  │   │
  │  │ Slow but realistic!      │ Fast but limited!        │   │
  │  └──────────────────────────┴──────────────────────────┘   │
  │                                                            │
  │  CYPRESS vs OTHER TOOLS:                                    │
  │  ┌──────────────┬─────────────┬──────────────┐             │
  │  │              │ Cypress     │ Jest/RTL     │             │
  │  ├──────────────┼─────────────┼──────────────┤             │
  │  │ Environment  │ Real browser│ jsdom (fake!)│             │
  │  │ E2E tests    │ ✅ YES!    │ ❌ No!      │             │
  │  │ Component    │ ✅ YES!    │ ✅ YES!     │             │
  │  │ Visual       │ ✅ GUI!    │ ❌ Terminal! │             │
  │  │ Speed        │ Slower     │ Faster       │             │
  │  │ Setup        │ Easy!      │ Config needed│             │
  │  └──────────────┴─────────────┴──────────────┘             │
  │                                                            │
  │  ⚠️ TypeScript 5: Cypress < 13.6.3 KHÔNG support        │
  │     moduleResolution: "bundler" → Dùng >= 13.6.3!        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Installation + Setup!

```
  SETUP — 2 WAYS!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  WAY 1: QUICKSTART (template!)                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ pnpm create next-app --example with-cypress          │  │
  │  │   with-cypress-app                                   │  │
  │  │                                                      │  │
  │  │ → Pre-configured! Ready to go! 🎉                  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  WAY 2: MANUAL SETUP (3 steps!)                            │
  │                                                            │
  │  Step 1: Install!                                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ pnpm add -D cypress                                  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Step 2: Add script to package.json!                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ {                                                    │  │
  │  │   "scripts": {                                       │  │
  │  │     "dev": "next dev",                               │  │
  │  │     "build": "next build",                           │  │
  │  │     "start": "next start",                           │  │
  │  │     "cypress:open": "cypress open"  ← NEW!          │  │
  │  │   }                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Step 3: First run!                                        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ pnpm cypress:open                                    │  │
  │  │                                                      │  │
  │  │ → Opens Cypress GUI!                                │  │
  │  │ → Choose: E2E Testing or Component Testing!         │  │
  │  │ → AUTO-CREATES:                                     │  │
  │  │   ① cypress.config.js  (config file!)               │  │
  │  │   ② cypress/ folder    (test files!)                │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  PROJECT STRUCTURE AFTER SETUP:                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ my-app/                                              │  │
  │  │ ├── app/                                             │  │
  │  │ │   ├── page.tsx                                     │  │
  │  │ │   └── about/page.tsx                               │  │
  │  │ ├── cypress/                   ← AUTO-CREATED!      │  │
  │  │ │   ├── e2e/                   ← E2E tests!         │  │
  │  │ │   │   └── navigation.cy.ts                         │  │
  │  │ │   └── component/            ← Component tests!    │  │
  │  │ │       └── page.cy.tsx                              │  │
  │  │ ├── cypress.config.js          ← AUTO-CREATED!      │  │
  │  │ └── package.json                                     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. E2E Testing — End-to-End!

```
  E2E TESTING FLOW:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  E2E = Full app, real browser, real server!                │
  │                                                            │
  │  ① cypress.config.js:                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ import { defineConfig } from 'cypress'                │  │
  │  │                                                      │  │
  │  │ export default defineConfig({                         │  │
  │  │   e2e: {                                              │  │
  │  │     baseUrl: 'http://localhost:3000', // optional!    │  │
  │  │     setupNodeEvents(on, config) {},                   │  │
  │  │   },                                                  │  │
  │  │ })                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② Test pages (app/page.tsx + app/about/page.tsx):        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // app/page.tsx                                      │  │
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
  │  ③ E2E Test:                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // cypress/e2e/navigation.cy.ts                      │  │
  │  │ describe('Navigation', () => {                       │  │
  │  │   it('should navigate to about page', () => {        │  │
  │  │     cy.visit('http://localhost:3000/') // Go to home  │  │
  │  │     cy.get('a[href*="about"]').click() // Click link  │  │
  │  │     cy.url().should('include', '/about') // Check URL │  │
  │  │     cy.get('h1').contains('About') // Check content   │  │
  │  │   })                                                 │  │
  │  │ })                                                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  RUNNING E2E:                                               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Terminal 1:                 Terminal 2:               │  │
  │  │ npm run build              (wait for build...)       │  │
  │  │ npm run start ─────────▶  npm run cypress:open      │  │
  │  │ (server at :3000)          (test runner GUI!)        │  │
  │  │                                                      │  │
  │  │ → Test against PRODUCTION build!                    │  │
  │  │ → More realistic than dev mode!                     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  TIP: start-server-and-test package!                       │
  │  "test": "start-server-and-test start                      │
  │           http://localhost:3000 cypress"                    │
  │  → Auto-start server + run tests! 1 command! 🎉          │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Component Testing!

```
  COMPONENT TESTING — ISOLATION!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Component test = mount 1 component, NO full app!          │
  │                                                            │
  │  ① cypress.config.js:                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ import { defineConfig } from 'cypress'                │  │
  │  │                                                      │  │
  │  │ export default defineConfig({                         │  │
  │  │   component: {                                        │  │
  │  │     devServer: {                                      │  │
  │  │       framework: 'next',     ← Next.js framework!   │  │
  │  │       bundler: 'webpack',    ← Bundler to use!      │  │
  │  │     },                                                │  │
  │  │   },                                                  │  │
  │  │ })                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② Component Test:                                        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // cypress/component/page.cy.tsx                     │  │
  │  │ import Page from '../../app/page'                    │  │
  │  │                                                      │  │
  │  │ describe('<Page />', () => {                          │  │
  │  │   it('should render expected content', () => {       │  │
  │  │     cy.mount(<Page />)    ← MOUNT component!       │  │
  │  │     cy.get('h1').contains('Home')                    │  │
  │  │     cy.get('a[href="/about"]').should('be.visible')  │  │
  │  │   })                                                 │  │
  │  │ })                                                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  E2E vs COMPONENT:                                          │
  │  ┌──────────────────────┬──────────────────────────────┐   │
  │  │ E2E                  │ Component                    │   │
  │  ├──────────────────────┼──────────────────────────────┤   │
  │  │ cy.visit(url)        │ cy.mount(<Component />)      │   │
  │  │ Full app + server!   │ Single component, no server! │   │
  │  │ Test navigation      │ Test render + behavior!      │   │
  │  │ Test user flows      │ Test props + events!         │   │
  │  └──────────────────────┴──────────────────────────────┘   │
  │                                                            │
  │  ⚠️ LIMITATIONS:                                          │
  │  ① async Server Components: NOT supported!                │
  │    → Use E2E testing instead!                             │
  │  ② <Image />: NOT function (needs server!)                │
  │    → Component tests run WITHOUT Next.js server!          │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. CI — Continuous Integration!

```
  CI SETUP:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  INTERACTIVE vs HEADLESS:                                 │
  │  ┌──────────────────┬──────────────────────────────┐     │
  │  │ Interactive       │ Headless (CI!)              │     │
  │  ├──────────────────┼──────────────────────────────┤     │
  │  │ cypress open     │ cypress run                  │     │
  │  │ GUI browser!     │ No GUI! Terminal only!       │     │
  │  │ Local dev!       │ CI/CD pipelines!             │     │
  │  │ Watch mode!      │ Run once, exit!              │     │
  │  └──────────────────┴──────────────────────────────┘     │
  │                                                          │
  │  PACKAGE.JSON SCRIPTS:                                    │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ {                                                    ││
  │  │   "scripts": {                                       ││
  │  │     "e2e": "start-server-and-test dev               ││
  │  │            http://localhost:3000                      ││
  │  │            \"cypress open --e2e\"",                   ││
  │  │     "e2e:headless": "start-server-and-test dev      ││
  │  │            http://localhost:3000                      ││
  │  │            \"cypress run --e2e\"",                    ││
  │  │     "component": "cypress open --component",         ││
  │  │     "component:headless": "cypress run --component"  ││
  │  │   }                                                  ││
  │  │ }                                                    ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  4 SCRIPTS:                                               │
  │  ┌────────────────────┬────────────┬──────────────────┐  │
  │  │ Script             │ Mode       │ Type             │  │
  │  ├────────────────────┼────────────┼──────────────────┤  │
  │  │ e2e                │ Interactive│ E2E (GUI!)       │  │
  │  │ e2e:headless       │ Headless   │ E2E (CI!)       │  │
  │  │ component          │ Interactive│ Component (GUI!) │  │
  │  │ component:headless │ Headless   │ Component (CI!)  │  │
  │  └────────────────────┴────────────┴──────────────────┘  │
  │                                                          │
  │  CI FLOW:                                                 │
  │  Push code → CI runs → start-server-and-test →          │
  │  cypress run --e2e → Pass/Fail → Report! ✅             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. E2E vs Component Testing — When to Use?

```
  DECISION GUIDE:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  USE E2E WHEN:                                            │
  │  ① Testing navigation (page A → page B!)               │
  │  ② Testing full user flows (login → dashboard!)        │
  │  ③ Testing async Server Components!                     │
  │  ④ Testing features needing server (<Image />, etc!)    │
  │  ⑤ Testing API integration (real HTTP requests!)        │
  │                                                          │
  │  USE COMPONENT WHEN:                                      │
  │  ① Testing render output (props → UI!)                 │
  │  ② Testing events (click, input, hover!)                │
  │  ③ Testing state changes (useState, etc!)               │
  │  ④ Testing visual appearance (snapshot comparisons!)     │
  │  ⑤ Fast feedback loop (no server needed!)               │
  │                                                          │
  │  TESTING PYRAMID:                                         │
  │       ╱╲                                                  │
  │      ╱  ╲  E2E (few, slow, realistic!)                   │
  │     ╱────╲                                                │
  │    ╱      ╲  Integration (medium!)                       │
  │   ╱────────╲                                              │
  │  ╱          ╲  Unit/Component (many, fast!)              │
  │ ╱────────────╲                                            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — CypressEngine!

```javascript
var CypressEngine = (function () {
  // ═══════════════════════════════════
  // 1. DOM SIMULATOR
  // ═══════════════════════════════════
  var dom = {};
  var currentUrl = "";

  function setPage(url, elements) {
    dom[url] = elements;
  }

  // ═══════════════════════════════════
  // 2. cy.visit()
  // ═══════════════════════════════════
  function visit(url) {
    if (!dom[url]) {
      return { success: false, error: "Page not found: " + url };
    }
    currentUrl = url;
    return { success: true, url: url, elements: dom[url] };
  }

  // ═══════════════════════════════════
  // 3. cy.get()
  // ═══════════════════════════════════
  function get(selector) {
    var page = dom[currentUrl];
    if (!page) return { found: false, error: "No page loaded!" };

    var matches = [];
    for (var i = 0; i < page.length; i++) {
      var el = page[i];
      // Simple selector matching
      if (selector.indexOf("[href") !== -1) {
        var hrefMatch = selector.match(/href\*?="([^"]+)"/);
        if (hrefMatch && el.href && el.href.indexOf(hrefMatch[1]) !== -1) {
          matches.push(el);
        }
      } else if (selector === "h1" && el.tag === "h1") {
        matches.push(el);
      } else if (selector === "a" && el.tag === "a") {
        matches.push(el);
      }
    }

    return {
      found: matches.length > 0,
      count: matches.length,
      elements: matches,
      // Chainable methods
      click: function () {
        if (matches.length && matches[0].href) {
          return visit(matches[0].href);
        }
        return { error: "Nothing to click!" };
      },
      contains: function (text) {
        for (var j = 0; j < matches.length; j++) {
          if (matches[j].text && matches[j].text.indexOf(text) !== -1) {
            return { pass: true, text: text };
          }
        }
        return { pass: false, expected: text };
      },
      should: function (assertion) {
        if (assertion === "be.visible") {
          return { pass: matches.length > 0 };
        }
        return { pass: false, unknown: assertion };
      },
    };
  }

  // ═══════════════════════════════════
  // 4. cy.url()
  // ═══════════════════════════════════
  function url() {
    return {
      value: currentUrl,
      should: function (assertion, expected) {
        if (assertion === "include") {
          var pass = currentUrl.indexOf(expected) !== -1;
          return { pass: pass, url: currentUrl, expected: expected };
        }
        return { pass: false };
      },
    };
  }

  // ═══════════════════════════════════
  // 5. cy.mount() — Component Testing
  // ═══════════════════════════════════
  function mount(component) {
    // Simulate mounting a component
    currentUrl = "__component__";
    dom["__component__"] = component.elements || [];
    return {
      mounted: true,
      component: component.name,
      elements: dom["__component__"],
    };
  }

  // ═══════════════════════════════════
  // 6. TEST RUNNER
  // ═══════════════════════════════════
  var results = [];

  function describe(name, fn) {
    console.log("\n  📋 " + name);
    fn();
  }

  function it(name, fn) {
    try {
      fn();
      results.push({ test: name, status: "✅ PASS" });
      console.log("    ✅ " + name);
    } catch (e) {
      results.push({ test: name, status: "❌ FAIL", error: e });
      console.log("    ❌ " + name + " — " + e);
    }
  }

  function expect(actual) {
    return {
      toBe: function (expected) {
        if (actual !== expected) {
          throw "Expected " + expected + ", got " + actual;
        }
      },
      toBeTrue: function () {
        if (actual !== true) throw "Expected true, got " + actual;
      },
    };
  }

  // ═══════════════════════════════════
  // 7. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  CYPRESS ENGINE DEMO                ║");
    console.log("╚════════════════════════════════════╝");

    // Setup pages
    setPage("/", [
      { tag: "h1", text: "Home" },
      { tag: "a", href: "/about", text: "About" },
    ]);
    setPage("/about", [
      { tag: "h1", text: "About" },
      { tag: "a", href: "/", text: "Home" },
    ]);

    // E2E Test
    describe("Navigation", function () {
      it("should navigate to about page", function () {
        visit("/");
        var link = get('a[href*="about"]');
        expect(link.found).toBeTrue();
        link.click();
        var u = url().should("include", "/about");
        expect(u.pass).toBeTrue();
        var h1 = get("h1").contains("About");
        expect(h1.pass).toBeTrue();
      });

      it("should navigate back to home", function () {
        var link = get('a[href*="/"]');
        link.click();
        var h1 = get("h1").contains("Home");
        expect(h1.pass).toBeTrue();
      });
    });

    // Component Test
    describe("<Page />", function () {
      it("should render expected content", function () {
        mount({
          name: "Page",
          elements: [
            { tag: "h1", text: "Home" },
            { tag: "a", href: "/about", text: "About" },
          ],
        });
        var h1 = get("h1").contains("Home");
        expect(h1.pass).toBeTrue();
        var link = get('a[href*="/about"]');
        var visible = link.should("be.visible");
        expect(visible.pass).toBeTrue();
      });
    });

    // Results summary
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
// Chạy: CypressEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: E2E test — tại sao chạy trên PRODUCTION build?

<details><summary>Đáp án</summary>

```
Dev mode (next dev):
  → HMR, error overlays, unoptimized code
  → KHÔNG giống production behavior!
  → React Strict Mode double-renders!

Production (next build + next start):
  → Optimized, minified, tree-shaken!
  → GIỐNG THẬT user experience!
  → E2E test = test what users ACTUALLY see!

Command:
  Terminal 1: npm run build && npm run start
  Terminal 2: npm run cypress:open

TIP: start-server-and-test package = 1 command!
```

</details>

---

**Câu 2**: `cy.visit()` vs `cy.mount()` — khi nào dùng?

<details><summary>Đáp án</summary>

|               | cy.visit(url)              | cy.mount(\<Component /\>) |
| ------------- | -------------------------- | ------------------------- |
| **Type**      | E2E Testing                | Component Testing         |
| **What**      | Navigate to URL in browser | Mount single component    |
| **Server**    | ✅ NEEDS running server!   | ❌ No server needed!      |
| **Test**      | Navigation, user flows     | Render, props, events     |
| **Speed**     | Slower (full app!)         | Faster (isolation!)       |
| **async SC?** | ✅ Supported!              | ❌ NOT supported!         |

**Rule**: Test **user flows** → E2E (`cy.visit`). Test **component behavior** → Component (`cy.mount`).

</details>

---

**Câu 3**: Component testing — 2 limitations với Next.js?

<details><summary>Đáp án</summary>

```
① async Server Components: NOT SUPPORTED!
  → Server Components cần server runtime!
  → cy.mount() chạy trong browser, KHÔNG có server!
  → Fix: Dùng E2E testing thay thế!

② <Image /> component: NOT function out-of-box!
  → next/image cần Next.js server để optimize!
  → Component test = NO Next.js server running!
  → Fix: Mock Image component hoặc dùng E2E!
```

</details>

---

**Câu 4**: 4 CI scripts — giải thích từng cái?

<details><summary>Đáp án</summary>

| Script               | Mode              | Type      | Use case                                  |
| -------------------- | ----------------- | --------- | ----------------------------------------- |
| `e2e`                | Interactive (GUI) | E2E       | Local development! Xem browser chạy test! |
| `e2e:headless`       | Headless (no GUI) | E2E       | CI/CD pipeline! GitHub Actions, Jenkins!  |
| `component`          | Interactive (GUI) | Component | Local dev! Debug component visually!      |
| `component:headless` | Headless (no GUI) | Component | CI/CD! Fast component verification!       |

**Key difference**: `cypress open` (GUI) vs `cypress run` (headless)!

- `open` = mở browser, xem test chạy, debug visual!
- `run` = terminal only, exit khi xong, CI/CD!

</details>
