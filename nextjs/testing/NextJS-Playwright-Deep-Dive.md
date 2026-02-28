# Next.js Playwright Testing — Deep Dive!

> **Chủ đề**: Playwright — E2E Testing Across Browsers!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/testing/playwright
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Playwright Là Gì?](#1)
2. [§2. Installation + Setup!](#2)
3. [§3. E2E Testing — First Test!](#3)
4. [§4. Running Tests — 3 Browsers!](#4)
5. [§5. CI — Continuous Integration!](#5)
6. [§6. Playwright vs Cypress vs Jest!](#6)
7. [§7. Tự Viết — PlaywrightEngine!](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — Playwright Là Gì?

```
  PLAYWRIGHT — E2E TEST FRAMEWORK!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  1 API → 3 BROWSERS!                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │        ┌──────────────┐                              │  │
  │  │        │  Playwright  │                              │  │
  │  │        │  (1 test!)   │                              │  │
  │  │        └──────┬───────┘                              │  │
  │  │               │                                      │  │
  │  │     ┌─────────┼─────────┐                            │  │
  │  │     ▼         ▼         ▼                            │  │
  │  │  ┌──────┐ ┌──────┐ ┌──────┐                         │  │
  │  │  │Chrome│ │Firefox│ │Safari│                         │  │
  │  │  │(ium) │ │      │ │(Kit) │                         │  │
  │  │  └──────┘ └──────┘ └──────┘                         │  │
  │  │                                                      │  │
  │  │  → Write ONCE, test on ALL!                        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  KEY FEATURES:                                              │
  │  ┌──────────────────────────┬──────────────────────────┐   │
  │  │ Feature                  │ Detail                   │   │
  │  ├──────────────────────────┼──────────────────────────┤   │
  │  │ Cross-browser            │ Chromium + Firefox +     │   │
  │  │                          │ WebKit (Safari)!         │   │
  │  │ Auto-wait                │ Wait for elements before │   │
  │  │                          │ acting! (No sleep!)      │   │
  │  │ Headless + headed        │ CI (headless) or         │   │
  │  │                          │ debug (headed)!          │   │
  │  │ Parallel                 │ Tests run in parallel!   │   │
  │  │ Trace viewer             │ Debug with screenshots,  │   │
  │  │                          │ network logs, DOM!       │   │
  │  │ webServer config         │ Auto-start dev server!   │   │
  │  │ Built by Microsoft      │ Active development!      │   │
  │  └──────────────────────────┴──────────────────────────┘   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Installation + Setup!

```
  SETUP — 2 WAYS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  WAY 1: QUICKSTART (template!)                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ pnpm create next-app --example with-playwright       │  │
  │  │   with-playwright-app                                │  │
  │  │ → Pre-configured! Ready to go! 🎉                  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  WAY 2: MANUAL (2 steps!)                                  │
  │                                                            │
  │  Step 1: Install Playwright!                               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ pnpm create playwright                               │  │
  │  │                                                      │  │
  │  │ → Interactive prompts:                              │  │
  │  │   ① Choose test directory (tests/ or e2e/)          │  │
  │  │   ② Add GitHub Actions workflow? (y/n)              │  │
  │  │   ③ Install browsers? (Chromium, Firefox, WebKit)   │  │
  │  │                                                      │  │
  │  │ → AUTO-CREATES:                                     │  │
  │  │   ① playwright.config.ts  (config!)                 │  │
  │  │   ② tests/ folder         (test files!)             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  Step 2: playwright.config.ts — baseURL!                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ import { defineConfig } from '@playwright/test'      │  │
  │  │                                                      │  │
  │  │ export default defineConfig({                        │  │
  │  │   use: {                                             │  │
  │  │     baseURL: 'http://localhost:3000',                 │  │
  │  │   },                                                 │  │
  │  │   // Optional: auto-start server!                    │  │
  │  │   webServer: {                                       │  │
  │  │     command: 'npm run dev',                          │  │
  │  │     url: 'http://localhost:3000',                     │  │
  │  │     reuseExistingServer: !process.env.CI,            │  │
  │  │   },                                                 │  │
  │  │ })                                                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  PROJECT STRUCTURE:                                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ my-app/                                              │  │
  │  │ ├── app/                                             │  │
  │  │ │   ├── page.tsx                                     │  │
  │  │ │   └── about/page.tsx                               │  │
  │  │ ├── tests/                    ← TESTS FOLDER!       │  │
  │  │ │   └── navigation.spec.ts    ← E2E test!           │  │
  │  │ ├── playwright.config.ts      ← CONFIG!             │  │
  │  │ └── package.json                                     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. E2E Testing — First Test!

```
  E2E TEST — NAVIGATION!
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① 2 Test Pages:                                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // app/page.tsx                  // app/about/page   │  │
  │  │ export default function Page() { // .tsx             │  │
  │  │   return (                       // Same structure!  │  │
  │  │     <div>                                            │  │
  │  │       <h1>Home</h1>             <h1>About</h1>     │  │
  │  │       <Link href="/about">      <Link href="/">    │  │
  │  │         About                     Home              │  │
  │  │       </Link>                   </Link>             │  │
  │  │     </div>                                           │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② Playwright Test:                                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // tests/navigation.spec.ts                          │  │
  │  │ import { test, expect } from '@playwright/test'      │  │
  │  │                                                      │  │
  │  │ test('should navigate to about page',                │  │
  │  │   async ({ page }) => {                              │  │
  │  │   // Go to home page                                 │  │
  │  │   await page.goto('http://localhost:3000/')           │  │
  │  │                                                      │  │
  │  │   // Click on "About" text                           │  │
  │  │   await page.click('text=About')                     │  │
  │  │                                                      │  │
  │  │   // Check URL changed                               │  │
  │  │   await expect(page).toHaveURL(                      │  │
  │  │     'http://localhost:3000/about')                    │  │
  │  │                                                      │  │
  │  │   // Check page content                              │  │
  │  │   await expect(page.locator('h1'))                   │  │
  │  │     .toContainText('About')                          │  │
  │  │ })                                                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  API BREAKDOWN:                                             │
  │  ┌────────────────────────┬─────────────────────────────┐  │
  │  │ API                    │ What it does                │  │
  │  ├────────────────────────┼─────────────────────────────┤  │
  │  │ page.goto(url)         │ Navigate to URL!            │  │
  │  │ page.click('text=X')   │ Click element with text X! │  │
  │  │ page.locator('h1')     │ Find element by selector!  │  │
  │  │ expect(page)           │ Assertions on page!        │  │
  │  │  .toHaveURL(url)       │ Check current URL!         │  │
  │  │ expect(locator)        │ Assertions on element!     │  │
  │  │  .toContainText(text)  │ Check text content!        │  │
  │  └────────────────────────┴─────────────────────────────┘  │
  │                                                            │
  │  TIP: Use baseURL!                                          │
  │  playwright.config.ts: baseURL: 'http://localhost:3000'    │
  │  → Then: page.goto('/') instead of full URL! ✅          │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Running Tests — 3 Browsers!

```
  RUNNING PLAYWRIGHT:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  TEST AGAINST PRODUCTION BUILD! (recommended!)            │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ Terminal 1:               Terminal 2:                ││
  │  │ npm run build             (wait...)                  ││
  │  │ npm run start ─────────▶ npx playwright test        ││
  │  │ (server at :3000)         (runs all tests!)         ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  3 BROWSERS RUN SIMULTANEOUSLY:                           │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ npx playwright test                                  ││
  │  │ ┌───────────┐ ┌───────────┐ ┌───────────┐          ││
  │  │ │ Chromium  │ │ Firefox   │ │ WebKit    │          ││
  │  │ │ (Chrome!) │ │ (Mozilla!)│ │ (Safari!) │          ││
  │  │ │ ✅ Pass  │ │ ✅ Pass  │ │ ✅ Pass  │          ││
  │  │ └───────────┘ └───────────┘ └───────────┘          ││
  │  │                                                      ││
  │  │ → ALL 3 browsers in PARALLEL! ⚡                   ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  ALTERNATIVE: webServer config!                           │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ // playwright.config.ts                              ││
  │  │ webServer: {                                         ││
  │  │   command: 'npm run dev',     // Auto-start!        ││
  │  │   url: 'http://localhost:3000', // Wait for ready!  ││
  │  │   reuseExistingServer: !process.env.CI,              ││
  │  │ }                                                    ││
  │  │ → 1 command: npx playwright test                    ││
  │  │ → Server starts automatically! 🎉                  ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. CI — Continuous Integration!

```
  CI SETUP:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  HEADLESS BY DEFAULT:                                     │
  │  → Playwright in CI = NO visible browser!               │
  │  → Runs headless automatically!                         │
  │                                                          │
  │  INSTALL BROWSER DEPENDENCIES:                            │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ npx playwright install-deps                          ││
  │  │                                                      ││
  │  │ → Installs system dependencies for ALL browsers!    ││
  │  │ → Chromium: libgbm, libnss, etc!                    ││
  │  │ → Firefox: libgtk, libdbus, etc!                    ││
  │  │ → WebKit: libwpe, libharfbuzz, etc!                 ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  │  CI FLOW:                                                 │
  │  ┌──────────────────────────────────────────────────────┐│
  │  │ Push code                                            ││
  │  │   ▼                                                  ││
  │  │ CI runner (GitHub Actions, Jenkins, etc!)             ││
  │  │   ▼                                                  ││
  │  │ npx playwright install-deps  ← Install browsers!   ││
  │  │   ▼                                                  ││
  │  │ npm run build                ← Build app!           ││
  │  │   ▼                                                  ││
  │  │ npm run start                ← Start server!        ││
  │  │   ▼                                                  ││
  │  │ npx playwright test         ← Run tests!           ││
  │  │   ▼                                                  ││
  │  │ Report: Pass ✅ / Fail ❌                          ││
  │  └──────────────────────────────────────────────────────┘│
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Playwright vs Cypress vs Jest!

```
  COMPARISON TABLE:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌──────────────┬────────────┬──────────┬─────────────┐ │
  │  │              │ Playwright │ Cypress  │ Jest+RTL    │ │
  │  ├──────────────┼────────────┼──────────┼─────────────┤ │
  │  │ Type         │ E2E only!  │ E2E +    │ Unit +      │ │
  │  │              │            │ Component│ Snapshot    │ │
  │  │ Browsers     │ 3! (Chrome │ 1 browser│ jsdom       │ │
  │  │              │ FF, Safari)│ at a time│ (fake!)     │ │
  │  │ Speed        │ Fast!      │ Medium   │ Fastest!    │ │
  │  │              │ (parallel!)│          │             │ │
  │  │ Auto-wait    │ ✅ Built-in│ ✅ Yes  │ ❌ N/A    │ │
  │  │ Headless     │ ✅ Default│ ✅ CLI  │ ✅ Always │ │
  │  │ GUI          │ Trace      │ Full GUI!│ Terminal    │ │
  │  │              │ viewer!    │          │             │ │
  │  │ API style    │ async/     │ Chainable│ sync +      │ │
  │  │              │ await!     │ (.click  │ callbacks!  │ │
  │  │              │            │  .get)   │             │ │
  │  │ webServer    │ ✅ Built-in│ Need     │ ❌ N/A    │ │
  │  │              │            │ package! │             │ │
  │  │ async SC     │ ✅ Yes!   │ ✅ E2E  │ ❌ No!    │ │
  │  │ Made by      │ Microsoft  │ Cypress  │ Meta (FB)   │ │
  │  │              │            │ .io      │             │ │
  │  └──────────────┴────────────┴──────────┴─────────────┘ │
  │                                                          │
  │  WHEN TO USE WHICH:                                       │
  │  ① Cross-browser E2E → Playwright! (3 browsers!)       │
  │  ② Visual E2E debugging → Cypress! (GUI!)              │
  │  ③ Fast unit tests → Jest+RTL! (jsdom!)                │
  │  ④ Component isolation → Cypress Component!             │
  │  ⑤ CI pipeline → Playwright! (fastest, parallel!)      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — PlaywrightEngine!

```javascript
var PlaywrightEngine = (function () {
  // ═══════════════════════════════════
  // 1. BROWSER SIMULATOR
  // ═══════════════════════════════════
  var browsers = ["chromium", "firefox", "webkit"];

  var pages = {};
  var currentUrl = "";
  var currentBrowser = "";

  function registerPage(url, elements) {
    pages[url] = elements;
  }

  // ═══════════════════════════════════
  // 2. page.goto()
  // ═══════════════════════════════════
  function pageGoto(url, baseURL) {
    var fullUrl = url.startsWith("/")
      ? (baseURL || "http://localhost:3000") + url
      : url;
    // Normalize
    var path = fullUrl.replace(/https?:\/\/[^/]+/, "") || "/";
    if (!pages[path]) {
      return { success: false, error: "Page not found: " + path };
    }
    currentUrl = fullUrl;
    return { success: true, url: fullUrl, browser: currentBrowser };
  }

  // ═══════════════════════════════════
  // 3. page.click()
  // ═══════════════════════════════════
  function pageClick(selector) {
    var path = currentUrl.replace(/https?:\/\/[^/]+/, "") || "/";
    var page = pages[path];
    if (!page) return { error: "No page loaded!" };

    // text=X selector
    var textMatch = selector.match(/^text=(.+)$/);
    if (textMatch) {
      var text = textMatch[1];
      for (var i = 0; i < page.length; i++) {
        if (page[i].text && page[i].text.indexOf(text) !== -1) {
          if (page[i].href) {
            return pageGoto(page[i].href);
          }
          return { clicked: true, element: page[i] };
        }
      }
      return { error: "No element with text: " + text };
    }
    return { error: "Unsupported selector: " + selector };
  }

  // ═══════════════════════════════════
  // 4. page.locator()
  // ═══════════════════════════════════
  function pageLocator(selector) {
    var path = currentUrl.replace(/https?:\/\/[^/]+/, "") || "/";
    var page = pages[path] || [];

    var matches = [];
    for (var i = 0; i < page.length; i++) {
      if (page[i].tag === selector) matches.push(page[i]);
    }

    return {
      selector: selector,
      count: matches.length,
      elements: matches,
      first: matches[0] || null,
    };
  }

  // ═══════════════════════════════════
  // 5. expect() assertions
  // ═══════════════════════════════════
  function expect(target) {
    return {
      toHaveURL: function (url) {
        if (currentUrl !== url) {
          throw new Error(
            "URL mismatch! Expected: " + url + ", Got: " + currentUrl,
          );
        }
        return true;
      },
      toContainText: function (text) {
        if (!target || !target.first) {
          throw new Error("No element found!");
        }
        if (target.first.text.indexOf(text) === -1) {
          throw new Error(
            'Text not found: "' + text + '" in "' + target.first.text + '"',
          );
        }
        return true;
      },
    };
  }

  // ═══════════════════════════════════
  // 6. TEST RUNNER (3 browsers!)
  // ═══════════════════════════════════
  var allResults = [];

  function test(name, fn) {
    for (var b = 0; b < browsers.length; b++) {
      currentBrowser = browsers[b];
      currentUrl = "";
      var label = "[" + currentBrowser + "] " + name;
      try {
        fn();
        allResults.push({ test: label, status: "✅ PASS" });
        console.log("  ✅ " + label);
      } catch (e) {
        allResults.push({
          test: label,
          status: "❌ FAIL",
          error: e.message || e,
        });
        console.log("  ❌ " + label + " — " + (e.message || e));
      }
    }
  }

  // ═══════════════════════════════════
  // 7. webServer simulator
  // ═══════════════════════════════════
  function webServer(config) {
    return {
      command: config.command,
      url: config.url,
      status: "started",
      reuseExisting: config.reuseExistingServer || false,
      message: "Server running at " + config.url,
    };
  }

  // ═══════════════════════════════════
  // 8. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  PLAYWRIGHT ENGINE DEMO             ║");
    console.log("╚════════════════════════════════════╝");

    // Register pages
    registerPage("/", [
      { tag: "h1", text: "Home" },
      { tag: "a", href: "/about", text: "About" },
    ]);
    registerPage("/about", [
      { tag: "h1", text: "About" },
      { tag: "a", href: "/", text: "Home" },
    ]);

    // webServer
    console.log("\n── webServer ──");
    var server = webServer({
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
    });
    console.log("  " + server.message);

    // E2E test (runs on ALL 3 browsers!)
    console.log("\n── E2E Tests (3 browsers!) ──");

    test("should navigate to about page", function () {
      pageGoto("http://localhost:3000/");
      pageClick("text=About");
      expect({ toHaveURL: true }).toHaveURL;
      // Check URL
      if (currentUrl.indexOf("/about") === -1) {
        throw new Error("URL should include /about!");
      }
      var h1 = pageLocator("h1");
      expect(h1).toContainText("About");
    });

    test("should navigate back to home", function () {
      pageGoto("http://localhost:3000/about");
      pageClick("text=Home");
      if (currentUrl.indexOf("/about") !== -1) {
        throw new Error("Should be on home page!");
      }
      var h1 = pageLocator("h1");
      expect(h1).toContainText("Home");
    });

    // Summary
    console.log("\n── Results ──");
    var pass = 0,
      fail = 0;
    for (var i = 0; i < allResults.length; i++) {
      if (allResults[i].status.indexOf("PASS") !== -1) pass++;
      else fail++;
    }
    console.log("  Browsers: " + browsers.length);
    console.log(
      "  Total: " + allResults.length + " | Pass: " + pass + " | Fail: " + fail,
    );
    console.log(
      "  (" +
        allResults.length / browsers.length +
        " tests × " +
        browsers.length +
        " browsers)",
    );
  }

  return { demo: demo };
})();
// Chạy: PlaywrightEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: Playwright — test trên bao nhiêu browsers? Kể tên?

<details><summary>Đáp án</summary>

```
3 BROWSERS:
  ① Chromium  → Chrome, Edge, Opera!
  ② Firefox   → Mozilla Firefox!
  ③ WebKit    → Safari (macOS, iOS)!

Write 1 test → runs on ALL 3 simultaneously!
→ Cross-browser coverage with single code!
→ Tests run in PARALLEL → fast!
```

</details>

---

**Câu 2**: `page.goto()` vs `page.click()` vs `page.locator()` — khác nhau?

<details><summary>Đáp án</summary>

| API                      | Purpose                   | Example                          |
| ------------------------ | ------------------------- | -------------------------------- |
| `page.goto(url)`         | Navigate to URL!          | `await page.goto('/')`           |
| `page.click(selector)`   | Click element!            | `await page.click('text=About')` |
| `page.locator(selector)` | Find element (no action)! | `page.locator('h1')`             |

**Flow**: goto → interact → assert!

```
page.goto('/')              → Load home page
page.click('text=About')    → Click About link
expect(page).toHaveURL(...)  → Check URL changed
expect(page.locator('h1'))  → Check content
  .toContainText('About')
```

</details>

---

**Câu 3**: `webServer` config — lợi ích?

<details><summary>Đáp án</summary>

```
WITHOUT webServer:
  Terminal 1: npm run build && npm run start  ← Manual!
  Terminal 2: npx playwright test             ← Manual!
  → 2 terminals, 2 commands!

WITH webServer:
  // playwright.config.ts
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  }

  → 1 command: npx playwright test
  → Auto-start server! Auto-wait for ready!
  → CI: always fresh server!
  → Local: reuse existing if running!
```

</details>

---

**Câu 4**: Playwright vs Cypress — 3 khác biệt chính?

<details><summary>Đáp án</summary>

|                         | Playwright                                      | Cypress                               |
| ----------------------- | ----------------------------------------------- | ------------------------------------- |
| **Browsers**            | 3 simultaneously! (Chromium + Firefox + WebKit) | 1 at a time!                          |
| **API style**           | `async/await` (native JS!)                      | Chainable (`.click().get()`)          |
| **Component tests**     | ❌ E2E only!                                    | ✅ E2E + Component!                   |
| **Parallel by default** | ✅ Yes!                                         | ❌ Need config!                       |
| **webServer**           | ✅ Built-in!                                    | Need `start-server-and-test` package! |

**Rule**: Cross-browser E2E → **Playwright**. Component testing + GUI debug → **Cypress**.

</details>
