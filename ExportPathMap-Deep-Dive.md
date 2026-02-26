# exportPathMap — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/exportPathMap
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **⚠️ DEPRECATED**: Dùng getStaticPaths (pages) hoặc generateStaticParams (app)!

---

## §1. exportPathMap Là Gì?

```
  exportPathMap — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Mapping request paths → page destinations! ★★★          │
  │  → Dùng khi `next export` (static HTML)! ★                 │
  │  → ⚠️ DEPRECATED! Dùng generateStaticParams! ★★★            │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    exportPathMap: async function(                      │    │
  │  │      defaultPathMap,                                   │    │
  │  │      { dev, dir, outDir, distDir, buildId }           │    │
  │  │    ) {                                                 │    │
  │  │      return {                                          │    │
  │  │        '/':              { page: '/' },                │    │
  │  │        '/about':         { page: '/about' },           │    │
  │  │        '/p/hello-nextjs': {                            │    │
  │  │          page: '/post',                                │    │
  │  │          query: { title: 'hello-nextjs' } ★★★         │    │
  │  │        },                                              │    │
  │  │      }                                                 │    │
  │  │    }                                                   │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  MAPPING FLOW:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Request Path          →  Page File + Query           │    │
  │  │  ─────────────────────────────────────────────        │    │
  │  │  '/'                   →  pages/index.js              │    │
  │  │  '/about'              →  pages/about.js              │    │
  │  │  '/p/hello-nextjs'     →  pages/post.js               │    │
  │  │                           + { title: 'hello-nextjs' } │    │
  │  │                                                       │    │
  │  │  OUTPUT (next export):                                 │    │
  │  │  /out/index.html          ← from pages/index.js      │    │
  │  │  /out/about.html          ← from pages/about.js      │    │
  │  │  /out/p/hello-nextjs.html ← from pages/post.js       │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Function Arguments!

```
  ARGUMENTS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  exportPathMap(defaultPathMap, context)                       │
  │                                                              │
  │  ① defaultPathMap:                                            │
  │  → Default path map từ Next.js! ★                          │
  │  → Dựa trên pages/ directory! ★                            │
  │                                                              │
  │  ② context object:                                            │
  │  ┌──────────────┬──────────────────────────────────────┐     │
  │  │ Property       │ Mô tả                                │     │
  │  ├──────────────┼──────────────────────────────────────┤     │
  │  │ dev            │ true = development! ★                 │     │
  │  │               │ false = next export! ★                │     │
  │  │ dir            │ Absolute path → project dir! ★       │     │
  │  │ outDir         │ Absolute path → out/ dir! ★           │     │
  │  │               │ null khi dev = true! ★                │     │
  │  │ distDir        │ Absolute path → .next/ dir! ★         │     │
  │  │ buildId        │ Generated build id! ★                 │     │
  │  └──────────────┴──────────────────────────────────────┘     │
  │                                                              │
  │  RETURN VALUE:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  { [pathname]: { page, query? } }                     │    │
  │  │                                                       │    │
  │  │  page: String  → page trong pages/ dir! ★             │    │
  │  │  query: Object → passed to getInitialProps! ★         │    │
  │  │                  Default: {} ★                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ CAVEAT: query KHÔNG dùng được với:                         │
  │  → Automatically statically optimized pages! ★★★           │
  │  → getStaticProps pages! ★★★                               │
  │  → Vì render HTML lúc build, không có runtime query! ★    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Trailing Slash + Output Dir!

```
  EXTRAS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① trailingSlash:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = { trailingSlash: true }              │    │
  │  │                                                       │    │
  │  │  KHÔNG trailing slash:                                 │    │
  │  │  /about → /about.html ★                               │    │
  │  │                                                       │    │
  │  │  CÓ trailing slash:                                    │    │
  │  │  /about → /about/index.html ★                         │    │
  │  │  → Routable via /about/ ★                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② Custom output directory:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  next export -o outdir  ★                              │    │
  │  │  → Mặc định: out/                                     │    │
  │  │  → Custom: outdir/                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — ExportPathMapEngine!

```javascript
var ExportPathMapEngine = (function () {
  // ═══════════════════════════════════
  // 1. PATH MAP BUILDER
  // ═══════════════════════════════════
  function buildPathMap(pages, customMappings) {
    // Generate default path map from pages/
    var defaultMap = {};
    for (var i = 0; i < pages.length; i++) {
      var pagePath = pages[i];
      var urlPath =
        pagePath
          .replace(/^pages/, "")
          .replace(/\.js$/, "")
          .replace(/\/index$/, "/")
          .replace(/\/$/, "") || "/";
      defaultMap[urlPath] = { page: urlPath };
    }

    // Merge custom mappings
    var finalMap = {};
    for (var key in defaultMap) finalMap[key] = defaultMap[key];
    if (customMappings) {
      for (var key2 in customMappings) finalMap[key2] = customMappings[key2];
    }

    return {
      defaultMap: defaultMap,
      finalMap: finalMap,
      totalPaths: Object.keys(finalMap).length,
    };
  }

  // ═══════════════════════════════════
  // 2. HTML OUTPUT GENERATOR
  // ═══════════════════════════════════
  function generateOutput(pathMap, trailingSlash) {
    var files = [];
    for (var urlPath in pathMap) {
      var htmlPath;
      if (urlPath === "/") {
        htmlPath = "/index.html";
      } else if (trailingSlash) {
        htmlPath = urlPath + "/index.html";
      } else {
        htmlPath = urlPath + ".html";
      }

      files.push({
        url: urlPath,
        page: pathMap[urlPath].page,
        query: pathMap[urlPath].query || null,
        output: "out" + htmlPath,
      });
    }
    return {
      trailingSlash: trailingSlash || false,
      files: files,
      totalFiles: files.length,
    };
  }

  // ═══════════════════════════════════
  // 3. QUERY VALIDATOR
  // ═══════════════════════════════════
  function validateQuery(pathMap, staticPages) {
    var warnings = [];
    for (var urlPath in pathMap) {
      var entry = pathMap[urlPath];
      if (entry.query && Object.keys(entry.query).length > 0) {
        if (staticPages.indexOf(entry.page) >= 0) {
          warnings.push({
            path: urlPath,
            page: entry.page,
            issue: "query KHÔNG dùng được với static/getStaticProps! ★★★",
          });
        }
      }
    }
    return {
      warnings: warnings,
      note:
        warnings.length > 0
          ? warnings.length + " query issues found! ★★★"
          : "No issues! ★",
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ ExportPathMap Engine ═══");

    var pages = ["pages/index.js", "pages/about.js", "pages/post.js"];

    console.log("\n── 1. Build Path Map ──");
    var result = buildPathMap(pages, {
      "/p/hello": { page: "/post", query: { title: "hello" } },
      "/p/learn": { page: "/post", query: { title: "learn" } },
    });
    console.log(result);

    console.log("\n── 2. HTML Output ──");
    console.log("No trailing:", generateOutput(result.finalMap, false));
    console.log("Trailing:", generateOutput(result.finalMap, true));

    console.log("\n── 3. Query Validation ──");
    console.log(validateQuery(result.finalMap, ["/about"]));
  }

  return { demo: demo };
})();
// Chạy: ExportPathMapEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: exportPathMap dùng làm gì?                              │
  │  → Map request paths → page destinations! ★                │
  │  → Cho next export (static HTML)! ★                        │
  │  → ⚠️ DEPRECATED! Dùng generateStaticParams! ★★★            │
  │                                                              │
  │  ❓ 2: query field dùng thế nào?                               │
  │  → Passed to getInitialProps khi prerender! ★              │
  │  → KHÔNG dùng được với getStaticProps! ★★★                │
  │  → KHÔNG dùng với statically optimized pages! ★★★         │
  │                                                              │
  │  ❓ 3: trailingSlash ảnh hưởng gì?                            │
  │  → false: /about → /about.html! ★                         │
  │  → true: /about → /about/index.html! ★                    │
  │                                                              │
  │  ❓ 4: Thay thế bằng gì?                                      │
  │  → Pages router: getStaticPaths! ★                         │
  │  → App router: generateStaticParams! ★★★                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
