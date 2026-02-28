# trailingSlash — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/trailingSlash
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. trailingSlash Là Gì?

```
  trailingSlash — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Control dấu "/" cuối URL! ★★★                          │
  │  → Default: redirect /about/ → /about (bỏ slash)! ★★★   │
  │  → trailingSlash: true → /about → /about/ (thêm)! ★★★  │
  │                                                              │
  │  DEFAULT (trailingSlash: false / undefined):                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  /about/  → redirect → /about ★★★                   │    │
  │  │  /blog/   → redirect → /blog ★                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ENABLED (trailingSlash: true):                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  /about   → redirect → /about/ ★★★                  │    │
  │  │  /blog    → redirect → /blog/ ★                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    trailingSlash: true  ★★★                            │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EXCEPTIONS (trailingSlash: true):                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  → Static files (có extension): KHÔNG thêm! ★        │    │
  │  │    /file.txt ★ (giữ nguyên)                           │    │
  │  │    /images/photo.png ★ (giữ nguyên)                  │    │
  │  │                                                       │    │
  │  │  → .well-known/ paths: KHÔNG thêm! ★                 │    │
  │  │    .well-known/config.json ★ (giữ nguyên)            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  STATIC EXPORT (output: 'export'):                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  trailingSlash: false → /about.html ★                 │    │
  │  │  trailingSlash: true  → /about/index.html ★★★        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VERSION: v9.5.0 ★                                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Tự Viết — TrailingSlashEngine!

```javascript
var TrailingSlashEngine = (function () {
  // ═══════════════════════════════════
  // 1. SLASH NORMALIZER
  // ═══════════════════════════════════
  function isStaticFile(path) {
    var ext = path.lastIndexOf(".");
    var slash = path.lastIndexOf("/");
    return ext > slash && ext > 0; // has extension after last /
  }

  function isWellKnown(path) {
    return path.indexOf(".well-known/") >= 0;
  }

  function normalize(path, trailingSlash) {
    // Root is always /
    if (path === "/") return { path: "/", redirect: false };

    // Exceptions: static files and .well-known
    if (isStaticFile(path) || isWellKnown(path)) {
      return { path: path, redirect: false, exception: true };
    }

    var hasSlash = path.charAt(path.length - 1) === "/";

    if (trailingSlash) {
      // Should HAVE trailing slash
      if (!hasSlash) {
        return { original: path, path: path + "/", redirect: true, code: 308 };
      }
      return { path: path, redirect: false };
    } else {
      // Should NOT have trailing slash
      if (hasSlash) {
        return {
          original: path,
          path: path.slice(0, -1),
          redirect: true,
          code: 308,
        };
      }
      return { path: path, redirect: false };
    }
  }

  // ═══════════════════════════════════
  // 2. EXPORT PATH RESOLVER
  // ═══════════════════════════════════
  function exportPath(route, trailingSlash) {
    if (route === "/") return "/index.html";
    if (trailingSlash) {
      return route + "/index.html";
    }
    return route + ".html";
  }

  // ═══════════════════════════════════
  // 3. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ TrailingSlash Engine ═══");

    console.log("\n── 1. Default (false) ──");
    console.log(normalize("/about/", false)); // redirect → /about
    console.log(normalize("/about", false)); // no redirect

    console.log("\n── 2. Enabled (true) ──");
    console.log(normalize("/about", true)); // redirect → /about/
    console.log(normalize("/about/", true)); // no redirect

    console.log("\n── 3. Exceptions ──");
    console.log(normalize("/file.txt", true)); // exception!
    console.log(normalize("/.well-known/config.json", true)); // exception!

    console.log("\n── 4. Static Export ──");
    console.log(exportPath("/about", false)); // /about.html
    console.log(exportPath("/about", true)); // /about/index.html
  }

  return { demo: demo };
})();
// Chạy: TrailingSlashEngine.demo();
```

---

## §3. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: trailingSlash dùng làm gì?                             │
  │  → Control dấu / cuối URL! ★★★                           │
  │  → Default: bỏ slash (/about/ → /about)! ★               │
  │  → true: thêm slash (/about → /about/)! ★★★             │
  │                                                              │
  │  ❓ 2: Exceptions?                                             │
  │  → Static files (.txt, .png): KHÔNG thêm slash! ★★★      │
  │  → .well-known/ paths: KHÔNG thêm! ★                     │
  │                                                              │
  │  ❓ 3: Ảnh hưởng static export?                               │
  │  → false: /about.html ★                                   │
  │  → true: /about/index.html ★★★                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
