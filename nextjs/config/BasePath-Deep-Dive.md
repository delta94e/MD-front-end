# basePath — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!

---

## §1. basePath Là Gì?

```
  basePath — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Deploy Next.js app dưới SUB-PATH! ★★★                   │
  │  → VD: example.com/docs thay vì example.com! ★             │
  │  → Path prefix cho TOÀN BỘ ứng dụng! ★                    │
  │                                                              │
  │  CONFIG:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  module.exports = {                                   │    │
  │  │    basePath: '/docs'  ← sub-path! ★★★                │    │
  │  │  }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ BUILD-TIME VALUE! ★★★                                    │
  │  → Inlined vào client-side bundles! ★                       │
  │  → PHẢI re-build khi thay đổi! ★★★                        │
  │  → Không thể thay đổi runtime! ★                           │
  │                                                              │
  │  BEFORE vs AFTER:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Không basePath:            Có basePath: '/docs'      │    │
  │  │  ┌────────────────┐         ┌────────────────────┐    │    │
  │  │  │ example.com/    │         │ example.com/docs/   │    │    │
  │  │  │ example.com/    │         │ example.com/docs/   │    │    │
  │  │  │   about         │         │   about              │    │    │
  │  │  │ example.com/    │         │ example.com/docs/   │    │    │
  │  │  │   contact       │         │   contact            │    │    │
  │  │  └────────────────┘         └────────────────────┘    │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Links — Auto Prefix!

```
  LINKS — TỰ ĐỘNG THÊM basePath:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  next/link + next/router → AUTO apply basePath! ★★★        │
  │                                                              │
  │  CODE:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  <Link href="/about">About Page</Link>               │    │
  │  │                                                       │    │
  │  │  // basePath = '/docs'                                 │    │
  │  │  // OUTPUT HTML:                                       │    │
  │  │  <a href="/docs/about">About Page</a> ← AUTO! ★★★    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ✅ KHÔNG cần sửa Link href! ★★★                             │
  │  → Viết href="/about" — Next.js AUTO thêm /docs! ★        │
  │  → Đổi basePath → KHÔNG cần sửa code! ★★★                │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Code: href="/about"                                   │    │
  │  │         ↓                                              │    │
  │  │  Next.js: basePath + href                              │    │
  │  │         ↓                                              │    │
  │  │  Output: "/docs/about"  ← AUTO! ★★★                  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Images — PHẢI Thêm Thủ Công!

```
  IMAGES — KHÔNG AUTO PREFIX! ★★★:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ⚠️ next/image: PHẢI thêm basePath vào src! ★★★             │
  │  → KHÁC với Link (auto)! ★                                  │
  │  → Image src = MANUAL prefix! ★★★                          │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  // basePath = '/docs'                                │    │
  │  │                                                       │    │
  │  │  // ❌ SAI:                                             │    │
  │  │  <Image src="/me.png" ... />                          │    │
  │  │  // → /me.png → 404! ★★★                             │    │
  │  │                                                       │    │
  │  │  // ✅ ĐÚNG:                                            │    │
  │  │  <Image src="/docs/me.png" ... />                     │    │
  │  │  // → /docs/me.png → OK! ★★★                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO SÁNH:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  <Link href="/about">   → AUTO /docs/about! ✅ ★★★    │    │
  │  │  <Image src="/me.png">  → MANUAL /docs/me.png! ⚠️ ★★★ │    │
  │  │                                                       │    │
  │  │  → Link = tự động prefix! ★                          │    │
  │  │  → Image = thủ công prefix! ★★★                      │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. basePath vs assetPrefix!

```
  SO SÁNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌─────────────┬───────────────────┬─────────────────────┐   │
  │  │ Feature       │ basePath           │ assetPrefix           │   │
  │  ├─────────────┼───────────────────┼─────────────────────┤   │
  │  │ Mục đích     │ Sub-path deploy   │ CDN cho assets      │   │
  │  │              │ (/docs)            │ (cdn.example.com)   │   │
  │  │              │                   │                     │   │
  │  │ Ảnh hưởng   │ TOÀN BỘ URLs!    │ Chỉ /_next/static/ │   │
  │  │              │ Pages + API +     │                     │   │
  │  │              │ Assets! ★★★       │                     │   │
  │  │              │                   │                     │   │
  │  │ Link auto    │ ✅ CÓ! ★★★         │ N/A                 │   │
  │  │ Image auto   │ ❌ KHÔNG! ★★★       │ N/A                 │   │
  │  │              │                   │                     │   │
  │  │ Build-time   │ ✅ Inlined! ★       │ ✅ Inlined! ★        │   │
  │  │              │                   │                     │   │
  │  │ Ví dụ       │ example.com/docs  │ cdn.example.com/    │   │
  │  │              │ /about             │ _next/static/...    │   │
  │  └─────────────┴───────────────────┴─────────────────────┘   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — BasePathEngine!

```javascript
var BasePathEngine = (function () {
  // ═══════════════════════════════════
  // 1. BASE PATH RESOLVER
  // ═══════════════════════════════════
  var basePath = "";

  function setBasePath(path) {
    // Validate: must start with /, no trailing slash
    if (path && path.charAt(0) !== "/") {
      return { error: "basePath PHẢI bắt đầu bằng /! ★★★" };
    }
    if (path && path.charAt(path.length - 1) === "/") {
      return { error: "basePath KHÔNG nên có trailing slash! ★" };
    }
    basePath = path || "";
    return {
      basePath: basePath,
      note: basePath
        ? "App served at sub-path: " + basePath + "! ★"
        : "No basePath! App at root! ★",
      warning: "BUILD-TIME! Must re-build to change! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 2. LINK RESOLVER (AUTO PREFIX)
  // ═══════════════════════════════════
  function resolveLink(href) {
    // next/link auto-applies basePath
    return {
      input: href,
      output: basePath + href,
      auto: true,
      note: "Link auto-prefix! ★★★",
    };
  }

  // ═══════════════════════════════════
  // 3. IMAGE RESOLVER (MANUAL PREFIX)
  // ═══════════════════════════════════
  function resolveImage(src, hasManualPrefix) {
    if (hasManualPrefix) {
      return {
        input: src,
        output: src,
        correct: true,
        note: "Manual prefix added! Correct! ★",
      };
    }
    return {
      input: src,
      expectedOutput: basePath + src,
      correct: false,
      error: "Image src NEEDS manual basePath prefix! ★★★",
      fix: "Change src to: " + basePath + src + "! ★",
    };
  }

  // ═══════════════════════════════════
  // 4. ROUTER RESOLVER (AUTO PREFIX)
  // ═══════════════════════════════════
  function resolveRouter(method, path) {
    return {
      method: method,
      input: path,
      output: basePath + path,
      auto: true,
      note: "router." + method + " auto-prefix! ★",
    };
  }

  // ═══════════════════════════════════
  // 5. FULL URL RESOLVER
  // ═══════════════════════════════════
  function resolveFullUrl(domain, pagePath) {
    return {
      domain: domain,
      basePath: basePath,
      page: pagePath,
      fullUrl: domain + basePath + pagePath,
    };
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ BasePath Engine ═══");

    console.log("\n── 1. Set basePath ──");
    console.log(setBasePath("/docs"));

    console.log("\n── 2. Links (AUTO) ──");
    console.log("href='/about':", resolveLink("/about"));
    console.log("href='/contact':", resolveLink("/contact"));
    console.log("href='/':", resolveLink("/"));

    console.log("\n── 3. Images (MANUAL) ──");
    console.log("src='/me.png' (no prefix):", resolveImage("/me.png", false));
    console.log(
      "src='/docs/me.png' (correct):",
      resolveImage("/docs/me.png", true),
    );

    console.log("\n── 4. Router (AUTO) ──");
    console.log("push('/dashboard'):", resolveRouter("push", "/dashboard"));
    console.log("replace('/settings'):", resolveRouter("replace", "/settings"));

    console.log("\n── 5. Full URL ──");
    console.log(resolveFullUrl("https://example.com", "/about"));
    console.log(resolveFullUrl("https://example.com", "/"));
  }

  return { demo: demo };
})();
// Chạy: BasePathEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: basePath dùng làm gì?                                  │
  │  → Deploy app dưới sub-path! ★                              │
  │  → VD: basePath: '/docs' → example.com/docs/! ★            │
  │  → BUILD-TIME! Inlined! Phải re-build! ★★★                │
  │                                                              │
  │  ❓ 2: Link có cần thêm basePath thủ công không?               │
  │  → KHÔNG! next/link AUTO prefix! ★★★                       │
  │  → href="/about" → output: /docs/about AUTO! ★            │
  │  → next/router cũng AUTO! ★                                │
  │                                                              │
  │  ❓ 3: Image thì sao?                                          │
  │  → PHẢI thêm basePath THỦ CÔNG! ★★★                       │
  │  → src="/me.png" → 404! ★★★                                │
  │  → src="/docs/me.png" → OK! ★                              │
  │  → ĐÂY LÀ KHÁC BIỆT với Link! ★★★                       │
  │                                                              │
  │  ❓ 4: basePath vs assetPrefix?                                │
  │  → basePath: sub-path cho TOÀN BỘ app! ★                  │
  │  → assetPrefix: CDN prefix CHỈ cho /_next/static/! ★      │
  │  → Mục đích KHÁC NHAU hoàn toàn! ★★★                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
