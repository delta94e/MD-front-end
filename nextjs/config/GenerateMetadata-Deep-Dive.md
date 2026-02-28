# generateMetadata() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v13.2.0!

---

## §1. generateMetadata() Là Gì?

```
  generateMetadata() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Định nghĩa METADATA cho page (SEO + social sharing!) ★   │
  │  → 2 cách: static metadata object HOẶC generateMetadata! ★ │
  │  → Next.js tự resolve → tạo <head> tags! ★                  │
  │                                                              │
  │  2 CÁCH ĐỊNH NGHĨA:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ① STATIC: export const metadata = { title: '...' }   │    │
  │  │  → Dùng khi KHÔNG phụ thuộc dynamic data! ★           │    │
  │  │                                                       │    │
  │  │  ② DYNAMIC: export async function generateMetadata()  │    │
  │  │  → Phụ thuộc params, searchParams, fetch data! ★      │    │
  │  │  → Return Metadata object! ★                          │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  RESOLUTION FLOW:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ app/layout.tsx (Root) → metadata                      │    │
  │  │       ↓ merge                                         │    │
  │  │ app/blog/layout.tsx → metadata                        │    │
  │  │       ↓ merge                                         │    │
  │  │ app/blog/[slug]/page.tsx → generateMetadata()         │    │
  │  │       ↓                                               │    │
  │  │ FINAL <head> tags! ★                                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  QUY TẮC:                                                     │
  │  → Chỉ trong Server Components! ★                           │
  │  → KHÔNG export cả 2 (metadata + generateMetadata)! ★★★    │
  │  → fetch trong generateMetadata được MEMOIZE! ★              │
  │  → File-based metadata (icon.tsx) > metadata object! ★      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Parameters + Returns!

```
  PARAMETERS — generateMetadata({ params, searchParams }, parent):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  params — Dynamic route parameters (Promise!):               │
  │  ┌──────────────────────────┬────────┬───────────────────┐   │
  │  │ Route                    │ URL    │ params             │   │
  │  ├──────────────────────────┼────────┼───────────────────┤   │
  │  │ app/shop/[slug]/page.js  │/shop/1 │{ slug: '1' }      │   │
  │  │ app/shop/[tag]/[item]/   │/shop/  │{ tag: '1',        │   │
  │  │   page.js                │  1/2   │  item: '2' }      │   │
  │  │ app/shop/[...slug]/      │/shop/  │{ slug: ['1','2'] }│   │
  │  │   page.js                │  1/2   │                   │   │
  │  └──────────────────────────┴────────┴───────────────────┘   │
  │                                                              │
  │  searchParams — Query string (Promise!):                     │
  │  ┌──────────────────────┬────────────────────────────────┐   │
  │  │ URL                  │ searchParams                   │   │
  │  ├──────────────────────┼────────────────────────────────┤   │
  │  │ /shop?a=1            │ { a: '1' }                     │   │
  │  │ /shop?a=1&b=2        │ { a: '1', b: '2' }            │   │
  │  │ /shop?a=1&a=2        │ { a: ['1', '2'] }             │   │
  │  └──────────────────────┴────────────────────────────────┘   │
  │                                                              │
  │  parent — Promise of PARENT segment metadata! ★              │
  │  → Dùng để extend (không replace) parent metadata! ★        │
  │  → (await parent).openGraph?.images || []                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Metadata Fields — title + openGraph + robots!

```
  TITLE — 4 DẠNG:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① String: title: 'Next.js'                                  │
  │     → <title>Next.js</title>                                 │
  │                                                              │
  │  ② Default: title: { default: 'Acme' }                       │
  │     → Fallback cho child segments KHÔNG có title! ★          │
  │                                                              │
  │  ③ Template: title: { template: '%s | Acme', default: '...' }│
  │     → Child title 'About' → <title>About | Acme</title>! ★  │
  │     → template CHỈ apply cho CHILD, không cho segment nó! ★ │
  │     → template trong page.js KHÔNG hiệu lực! (no child!) ★ │
  │     → default BẮT BUỘC khi dùng template! ★★★               │
  │                                                              │
  │  ④ Absolute: title: { absolute: 'About' }                    │
  │     → IGNORE parent template! ★                              │
  │     → <title>About</title> (không có | Acme!)               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  OPENGRAPH:
  ┌──────────────────────────────────────────────────────────────┐
  │  openGraph: {                                                │
  │    title, description, url, siteName,                        │
  │    images: [{ url, width, height, alt }],  ← ABSOLUTE URL!  │
  │    videos: [{ url, width, height }],                         │
  │    audio: [{ url }],                                         │
  │    locale, type: 'website' | 'article'                       │
  │  }                                                           │
  │  → Article: publishedTime, authors! ★                        │
  │  → File-based API ưu tiên hơn! ★                            │
  └──────────────────────────────────────────────────────────────┘

  ROBOTS:
  ┌──────────────────────────────────────────────────────────────┐
  │  robots: {                                                   │
  │    index, follow, nocache,                                   │
  │    googleBot: { index, follow, noimageindex,                 │
  │      'max-video-preview', 'max-image-preview', 'max-snippet'}│
  │  }                                                           │
  │  → <meta name="robots" content="index, follow">             │
  │  → <meta name="googlebot" content="...">                    │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Behavior — Ordering + Merging + Streaming!

```
  ORDERING — Root → Leaf:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  1. app/layout.tsx ← Root Layout                             │
  │  2. app/blog/layout.tsx ← Nested Blog Layout                 │
  │  3. app/blog/[slug]/page.tsx ← Blog Page                    │
  │                                                              │
  │  → Evaluate từ ROOT → LEAF! ★                                │
  │  → Deeper segment THẮNG! ★                                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  MERGING — Shallow merge:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  OVERWRITE:                                                   │
  │  Layout: { title: 'Acme', openGraph: { title, description } }│
  │  Page:   { title: 'Blog', openGraph: { title: 'Blog' } }    │
  │  → title = 'Blog' (replaced!) ★                             │
  │  → openGraph = { title: 'Blog' } (TOÀN BỘ replaced!) ★★★   │
  │  → openGraph.description BIẾN MẤT! ★★★                      │
  │                                                              │
  │  INHERIT:                                                     │
  │  Layout: { title: 'Acme', openGraph: { title, description } }│
  │  Page:   { title: 'About' }  ← KHÔNG set openGraph!         │
  │  → title = 'About' (replaced!) ★                             │
  │  → openGraph = { title, description } (INHERITED!) ★        │
  │                                                              │
  │  SHARE nested fields:                                         │
  │  → Tạo shared-metadata.ts với openGraphImage! ★             │
  │  → Spread { ...openGraphImage } trong mỗi segment! ★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  STREAMING METADATA (advanced!):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  → Stream UI TRƯỚC khi generateMetadata hoàn thành! ★       │
  │  → JS bots (Googlebot): metadata append vào <body>! ★       │
  │  → HTML-only bots (Facebook): metadata BLOCK rendering! ★   │
  │  → Improve TTFB + LCP! ★                                    │
  │  → Disable: htmlLimitedBots: /.*/                            │
  │                                                              │
  │  DEFAULT META TAGS (luôn có!):                                │
  │  <meta charset="utf-8">                                      │
  │  <meta name="viewport" content="width=device-width, ...">   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — MetadataEngine!

```javascript
var MetadataEngine = (function () {
  // ═══════════════════════════════════
  // 1. METADATA MERGER (shallow merge!)
  // ═══════════════════════════════════
  function mergeMetadata(segments) {
    var result = {};
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      for (var key in seg) {
        if (!seg.hasOwnProperty(key)) continue;
        // Shallow merge: nested objects REPLACED entirely!
        result[key] = seg[key];
      }
    }
    return result;
  }

  // ═══════════════════════════════════
  // 2. TITLE RESOLVER
  // ═══════════════════════════════════
  function resolveTitle(titleConfig, parentTemplate) {
    if (typeof titleConfig === "string") {
      return parentTemplate
        ? parentTemplate.replace("%s", titleConfig)
        : titleConfig;
    }
    if (titleConfig && typeof titleConfig === "object") {
      if (titleConfig.absolute) return titleConfig.absolute;
      if (titleConfig.default) return titleConfig.default;
      if (titleConfig.template) return { _template: titleConfig.template };
    }
    return titleConfig || "";
  }

  // ═══════════════════════════════════
  // 3. HEAD TAG GENERATOR
  // ═══════════════════════════════════
  function generateHeadTags(metadata) {
    var tags = [];
    // Default tags
    tags.push('<meta charset="utf-8">');
    tags.push(
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
    );

    if (metadata.title) {
      var t =
        typeof metadata.title === "string"
          ? metadata.title
          : metadata.title.default || "";
      tags.push("<title>" + t + "</title>");
    }
    if (metadata.description) {
      tags.push(
        '<meta name="description" content="' + metadata.description + '">',
      );
    }
    if (metadata.openGraph) {
      var og = metadata.openGraph;
      if (og.title)
        tags.push('<meta property="og:title" content="' + og.title + '">');
      if (og.description)
        tags.push(
          '<meta property="og:description" content="' + og.description + '">',
        );
      if (og.type)
        tags.push('<meta property="og:type" content="' + og.type + '">');
    }
    if (metadata.robots) {
      var r = metadata.robots;
      var parts = [];
      if (r.index !== false) parts.push("index");
      if (r.follow !== false) parts.push("follow");
      if (parts.length)
        tags.push('<meta name="robots" content="' + parts.join(", ") + '">');
    }
    return tags;
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Metadata Engine ═══");

    console.log("\n── Merge ──");
    var merged = mergeMetadata([
      {
        title: "Acme",
        openGraph: { title: "Acme", description: "Acme is..." },
      },
      { title: "Blog", openGraph: { title: "Blog" } },
    ]);
    console.log("Merged:", merged);
    console.log("→ openGraph.description GONE! ★★★");

    console.log("\n── Title ──");
    console.log("String:", resolveTitle("About", "%s | Acme"));
    console.log("Absolute:", resolveTitle({ absolute: "About" }, "%s | Acme"));
    console.log("Default:", resolveTitle({ default: "Acme" }));

    console.log("\n── Head Tags ──");
    console.log(
      generateHeadTags({
        title: "My Blog",
        description: "A great blog",
        openGraph: { title: "My Blog", type: "website" },
        robots: { index: true, follow: true },
      }),
    );
  }

  return { demo: demo };
})();
// Chạy: MetadataEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: metadata object vs generateMetadata — khi nào dùng?    │
  │  → Static data → metadata object! ★                         │
  │  → Dynamic (params, fetch) → generateMetadata()! ★          │
  │  → KHÔNG export cả 2 cùng segment! ★★★                     │
  │                                                              │
  │  ❓ 2: title.template áp dụng cho ai?                          │
  │  → CHỈ cho CHILD segments! ★★★                               │
  │  → KHÔNG cho segment nó được define! ★                       │
  │  → page.js define template → KHÔNG hiệu lực (no child!) ★  │
  │  → PHẢI có title.default khi dùng template! ★               │
  │                                                              │
  │  ❓ 3: Metadata merge như thế nào?                              │
  │  → Root → Leaf, leaf THẮNG! ★                                │
  │  → SHALLOW merge: nested objects bị REPLACE toàn bộ! ★★★    │
  │  → openGraph ở child → parent openGraph BIẾN MẤT! ★         │
  │  → Fix: shared-metadata.ts + spread! ★                      │
  │                                                              │
  │  ❓ 4: Streaming metadata là gì?                                │
  │  → Stream UI trước khi metadata resolve! ★                  │
  │  → JS bots → metadata append <body>! ★                      │
  │  → HTML bots → metadata BLOCK rendering! ★                  │
  │  → Improve TTFB + LCP! ★                                    │
  │                                                              │
  │  ❓ 5: File-based metadata vs object — ai ưu tiên?             │
  │  → File-based (icon.tsx, opengraph-image.tsx) THẮNG! ★★★    │
  │  → Override cả metadata object lẫn generateMetadata! ★      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
