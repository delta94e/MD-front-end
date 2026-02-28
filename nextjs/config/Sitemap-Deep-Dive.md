# sitemap.xml — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
> **Spec**: https://www.sitemaps.org/protocol.html
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v13.3.0!

---

## §1. sitemap.xml Là Gì?

```
  SITEMAP — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → File XML cho search engine biết CẤU TRÚC site! ★         │
  │  → Giúp crawlers index HIỆU QUẢ hơn! ★                     │
  │  → Theo chuẩn Sitemaps XML Format! ★                        │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Googlebot ──→ GET /sitemap.xml                       │    │
  │  │       │                                               │    │
  │  │       ▼                                               │    │
  │  │  Đọc danh sách URLs + metadata:                       │    │
  │  │  ┌────────────────────────────────────────────┐       │    │
  │  │  │ URL            │ lastmod    │ freq   │ pri │       │    │
  │  │  ├────────────────┼────────────┼────────┼─────┤       │    │
  │  │  │ /              │ 2024-01-01 │ yearly │ 1.0 │       │    │
  │  │  │ /about         │ 2024-01-01 │ monthly│ 0.8 │       │    │
  │  │  │ /blog          │ 2024-01-01 │ weekly │ 0.5 │       │    │
  │  │  │ /blog/post-1   │ 2024-03-15 │ daily  │ 0.7 │       │    │
  │  │  └────────────────┴────────────┴────────┴─────┘       │    │
  │  │       │                                               │    │
  │  │       ▼                                               │    │
  │  │  Crawl và index theo thứ tự ưu tiên! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FILES:                                                       │
  │  → sitemap.xml (static!) ★                                  │
  │  → sitemap.js / sitemap.ts (code!) ★                        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cách 1: Static sitemap.xml!

```
  STATIC FILE: app/sitemap.xml
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">│
  │    <url>                                                     │
  │      <loc>https://acme.com</loc>                             │
  │      <lastmod>2023-04-06T15:02:24.021Z</lastmod>            │
  │      <changefreq>yearly</changefreq>                        │
  │      <priority>1</priority>                                  │
  │    </url>                                                    │
  │    <url>                                                     │
  │      <loc>https://acme.com/about</loc>                       │
  │      <lastmod>2023-04-06T15:02:24.021Z</lastmod>            │
  │      <changefreq>monthly</changefreq>                       │
  │      <priority>0.8</priority>                                │
  │    </url>                                                    │
  │    <url>                                                     │
  │      <loc>https://acme.com/blog</loc>                        │
  │      <lastmod>2023-04-06T15:02:24.021Z</lastmod>            │
  │      <changefreq>weekly</changefreq>                        │
  │      <priority>0.5</priority>                                │
  │    </url>                                                    │
  │  </urlset>                                                   │
  │                                                              │
  │  → Cho smaller applications! ★                               │
  │  → Đặt ở ROOT app/ directory! ★                             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  XML TAGS GIẢI THÍCH:
  ┌──────────────┬──────────────────────────────────────────────┐
  │ Tag          │ Mô tả                                       │
  ├──────────────┼──────────────────────────────────────────────┤
  │ <loc>        │ URL tuyệt đối! (REQUIRED!) ★                │
  │ <lastmod>    │ Lần cuối chỉnh sửa! (ISO 8601!) ★          │
  │ <changefreq> │ Tần suất thay đổi! ★                        │
  │              │ always | hourly | daily | weekly            │
  │              │ | monthly | yearly | never                  │
  │ <priority>   │ 0.0 → 1.0! Mặc định 0.5! ★                 │
  │              │ 1.0 = quan trọng nhất! ★                    │
  └──────────────┴──────────────────────────────────────────────┘
```

---

## §3. Cách 2: Generate Bằng Code!

```
  CODE GENERATION: app/sitemap.ts
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  import type { MetadataRoute } from 'next'                   │
  │                                                              │
  │  export default function sitemap(): MetadataRoute.Sitemap {  │
  │    return [                                                   │
  │      {                                                       │
  │        url: 'https://acme.com',                              │
  │        lastModified: new Date(),  ← Dynamic date! ★         │
  │        changeFrequency: 'yearly',                            │
  │        priority: 1,                                          │
  │      },                                                      │
  │      {                                                       │
  │        url: 'https://acme.com/about',                        │
  │        lastModified: new Date(),                             │
  │        changeFrequency: 'monthly',                           │
  │        priority: 0.8,                                        │
  │      },                                                      │
  │      {                                                       │
  │        url: 'https://acme.com/blog',                         │
  │        lastModified: new Date(),                             │
  │        changeFrequency: 'weekly',                            │
  │        priority: 0.5,                                        │
  │      },                                                      │
  │    ]                                                         │
  │  }                                                           │
  │                                                              │
  │  ★ "Good to know": Special Route Handler! ★                  │
  │  → CACHED by default!                                        │
  │  → Trừ khi dùng Dynamic API hoặc dynamic config!            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Image + Video Sitemaps!

```
  IMAGE SITEMAPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  { url: 'https://example.com',                               │
  │    lastModified: '2021-01-01',                               │
  │    changeFrequency: 'weekly',                                │
  │    priority: 0.5,                                            │
  │    images: ['https://example.com/image.jpg'], ← images! ★   │
  │  }                                                           │
  │                                                              │
  │  OUTPUT XML:                                                  │
  │  <urlset xmlns:image="...sitemap-image/1.1">                 │
  │    <url>                                                     │
  │      <loc>https://example.com</loc>                          │
  │      <image:image>                                           │
  │        <image:loc>https://example.com/image.jpg</image:loc>  │
  │      </image:image>                                          │
  │    </url>                                                    │
  │  </urlset>                                                   │
  │                                                              │
  │  → Giúp Google Images tìm hình! ★                           │
  │  → Thêm xmlns:image namespace! ★                            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  VIDEO SITEMAPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  { url: 'https://example.com',                               │
  │    videos: [{                                                │
  │      title: 'example',                                       │
  │      thumbnail_loc: 'https://example.com/image.jpg',         │
  │      description: 'this is the description',                 │
  │    }], ← videos! ★                                          │
  │  }                                                           │
  │                                                              │
  │  OUTPUT XML:                                                  │
  │  <urlset xmlns:video="...sitemap-video/1.1">                 │
  │    <url>                                                     │
  │      <loc>https://example.com</loc>                          │
  │      <video:video>                                           │
  │        <video:title>example</video:title>                    │
  │        <video:thumbnail_loc>...</video:thumbnail_loc>        │
  │        <video:description>...</video:description>            │
  │      </video:video>                                          │
  │    </url>                                                    │
  │  </urlset>                                                   │
  │                                                              │
  │  → Giúp Google tìm video! ★                                 │
  │  → Thêm xmlns:video namespace! ★                            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Localized Sitemaps + Multiple Sitemaps!

```
  LOCALIZED SITEMAPS (i18n!):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  { url: 'https://acme.com',                                  │
  │    lastModified: new Date(),                                 │
  │    alternates: {                                             │
  │      languages: {                                            │
  │        es: 'https://acme.com/es',      ← Spanish! ★         │
  │        de: 'https://acme.com/de',      ← German! ★          │
  │      },                                                      │
  │    },                                                        │
  │  }                                                           │
  │                                                              │
  │  OUTPUT XML:                                                  │
  │  <urlset xmlns:xhtml="http://www.w3.org/1999/xhtml">        │
  │    <url>                                                     │
  │      <loc>https://acme.com</loc>                             │
  │      <xhtml:link rel="alternate"                             │
  │        hreflang="es" href="https://acme.com/es"/>            │
  │      <xhtml:link rel="alternate"                             │
  │        hreflang="de" href="https://acme.com/de"/>            │
  │    </url>                                                    │
  │  </urlset>                                                   │
  │                                                              │
  │  → Giúp Google biết phiên bản ngôn ngữ! ★                   │
  │  → Thêm xmlns:xhtml namespace! ★                            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  MULTIPLE SITEMAPS (large sites!):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Google giới hạn: 50,000 URLs / sitemap! ★★★                 │
  │                                                              │
  │  2 CÁCH CHIA:                                                 │
  │                                                              │
  │  Cách 1: Nested trong route segments! ★                      │
  │  app/                                                        │
  │  ├── sitemap.xml           → /sitemap.xml                   │
  │  └── products/                                               │
  │      └── sitemap.xml       → /products/sitemap.xml           │
  │                                                              │
  │  Cách 2: generateSitemaps function! ★                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ export async function generateSitemaps() {            │    │
  │  │   return [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]│   │
  │  │ }                                                      │    │
  │  │                                                       │    │
  │  │ export default async function sitemap(props) {        │    │
  │  │   const id = await props.id                           │    │
  │  │   const start = id * 50000                            │    │
  │  │   const end = start + 50000                           │    │
  │  │   const products = await getProducts(                 │    │
  │  │     `SELECT ... WHERE id BETWEEN ${start} AND ${end}` │    │
  │  │   )                                                    │    │
  │  │   return products.map(p => ({                         │    │
  │  │     url: `${BASE_URL}/product/${p.id}`,               │    │
  │  │     lastModified: p.date,                              │    │
  │  │   }))                                                  │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  OUTPUT URLs:                                                 │
  │  /product/sitemap/0.xml  ← 0-49,999! ★                      │
  │  /product/sitemap/1.xml  ← 50,000-99,999! ★                 │
  │  /product/sitemap/2.xml  ← 100,000-149,999! ★               │
  │  /product/sitemap/3.xml  ← 150,000-199,999! ★               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Returns — TypeScript Type!

```
  SITEMAP TYPE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  type Sitemap = Array<{                                      │
  │    url: string                     ← REQUIRED! ★             │
  │    lastModified?: string | Date                              │
  │    changeFrequency?:                                         │
  │      | 'always' | 'hourly' | 'daily'                        │
  │      | 'weekly' | 'monthly' | 'yearly'                      │
  │      | 'never'                                               │
  │    priority?: number               ← 0.0 → 1.0! ★           │
  │    alternates?: {                                            │
  │      languages?: Languages<string> ← i18n! ★                │
  │    }                                                         │
  │    images?: string[]               ← v14.2.0! ★              │
  │    videos?: Array<{                ← v14.2.0! ★              │
  │      title: string                                           │
  │      thumbnail_loc: string                                   │
  │      description: string                                     │
  │    }>                                                        │
  │  }>                                                          │
  │                                                              │
  │  CHANGEFREQUENCY HIERARCHY:                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ always → hourly → daily → weekly → monthly           │    │
  │  │   → yearly → never                                    │    │
  │  │                                                       │    │
  │  │ "always": Mỗi request đều khác (stock prices!) ★     │    │
  │  │ "hourly": News feed! ★                                │    │
  │  │ "daily": Blog posts! ★                                │    │
  │  │ "weekly": Product pages! ★                            │    │
  │  │ "monthly": About page! ★                              │    │
  │  │ "yearly": Terms of Service! ★                         │    │
  │  │ "never": Archive pages! ★                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — SitemapEngine!

```javascript
var SitemapEngine = (function () {
  // ═══════════════════════════════════
  // 1. SITEMAP XML GENERATOR
  // ═══════════════════════════════════
  function generateSitemapXML(entries, options) {
    var namespaces = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    var hasImages = false,
      hasVideos = false,
      hasAlternates = false;

    for (var i = 0; i < entries.length; i++) {
      if (entries[i].images && entries[i].images.length > 0) hasImages = true;
      if (entries[i].videos && entries[i].videos.length > 0) hasVideos = true;
      if (entries[i].alternates) hasAlternates = true;
    }

    if (hasImages)
      namespaces +=
        '\n  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
    if (hasVideos)
      namespaces +=
        '\n  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"';
    if (hasAlternates)
      namespaces += '\n  xmlns:xhtml="http://www.w3.org/1999/xhtml"';

    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += "<urlset " + namespaces + ">\n";

    for (var j = 0; j < entries.length; j++) {
      xml += generateUrlEntry(entries[j]);
    }

    xml += "</urlset>";
    return xml;
  }

  function generateUrlEntry(entry) {
    var xml = "  <url>\n";
    xml += "    <loc>" + entry.url + "</loc>\n";

    if (entry.images) {
      for (var i = 0; i < entry.images.length; i++) {
        xml += "    <image:image>\n";
        xml += "      <image:loc>" + entry.images[i] + "</image:loc>\n";
        xml += "    </image:image>\n";
      }
    }

    if (entry.videos) {
      for (var v = 0; v < entry.videos.length; v++) {
        xml += "    <video:video>\n";
        xml +=
          "      <video:title>" + entry.videos[v].title + "</video:title>\n";
        xml +=
          "      <video:thumbnail_loc>" +
          entry.videos[v].thumbnail_loc +
          "</video:thumbnail_loc>\n";
        xml +=
          "      <video:description>" +
          entry.videos[v].description +
          "</video:description>\n";
        xml += "    </video:video>\n";
      }
    }

    if (entry.alternates && entry.alternates.languages) {
      var langs = entry.alternates.languages;
      for (var lang in langs) {
        if (langs.hasOwnProperty(lang)) {
          xml +=
            '    <xhtml:link rel="alternate" hreflang="' +
            lang +
            '" href="' +
            langs[lang] +
            '"/>\n';
        }
      }
    }

    if (entry.lastModified) {
      var d =
        entry.lastModified instanceof Date
          ? entry.lastModified.toISOString()
          : entry.lastModified;
      xml += "    <lastmod>" + d + "</lastmod>\n";
    }
    if (entry.changeFrequency) {
      xml += "    <changefreq>" + entry.changeFrequency + "</changefreq>\n";
    }
    if (entry.priority !== undefined) {
      xml += "    <priority>" + entry.priority + "</priority>\n";
    }

    xml += "  </url>\n";
    return xml;
  }

  // ═══════════════════════════════════
  // 2. SITEMAP SPLITTER (50,000 limit!)
  // ═══════════════════════════════════
  function splitSitemap(totalUrls, limit) {
    limit = limit || 50000;
    var count = Math.ceil(totalUrls / limit);
    var sitemaps = [];
    for (var i = 0; i < count; i++) {
      sitemaps.push({
        id: i,
        start: i * limit,
        end: Math.min((i + 1) * limit, totalUrls),
        path: "/sitemap/" + i + ".xml",
      });
    }
    return { totalSitemaps: count, sitemaps: sitemaps };
  }

  // ═══════════════════════════════════
  // 3. PRIORITY ADVISOR
  // ═══════════════════════════════════
  function advisePriority(pageType) {
    var map = {
      homepage: { priority: 1.0, changeFrequency: "yearly" },
      about: { priority: 0.8, changeFrequency: "monthly" },
      blog_index: { priority: 0.7, changeFrequency: "weekly" },
      blog_post: { priority: 0.6, changeFrequency: "daily" },
      product: { priority: 0.8, changeFrequency: "weekly" },
      contact: { priority: 0.3, changeFrequency: "yearly" },
      terms: { priority: 0.1, changeFrequency: "never" },
    };
    return map[pageType] || { priority: 0.5, changeFrequency: "monthly" };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Sitemap Engine ═══");

    console.log("\n── Generate XML ──");
    console.log(
      generateSitemapXML([
        {
          url: "https://acme.com",
          lastModified: "2024-01-01",
          changeFrequency: "yearly",
          priority: 1,
          images: ["https://acme.com/hero.jpg"],
          alternates: {
            languages: { es: "https://acme.com/es", vi: "https://acme.com/vi" },
          },
        },
        {
          url: "https://acme.com/blog",
          lastModified: "2024-03-01",
          changeFrequency: "weekly",
          priority: 0.5,
          videos: [
            {
              title: "Intro",
              thumbnail_loc: "https://acme.com/thumb.jpg",
              description: "Intro video",
            },
          ],
        },
      ]),
    );

    console.log("\n── Split Sitemap (200,000 URLs) ──");
    console.log(splitSitemap(200000));

    console.log("\n── Priority Advisor ──");
    console.log("homepage:", advisePriority("homepage"));
    console.log("blog_post:", advisePriority("blog_post"));
    console.log("terms:", advisePriority("terms"));
  }

  return { demo: demo };
})();
// Chạy: SitemapEngine.demo();
```

---

## §8. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: sitemap.xml dùng để làm gì?                             │
  │  → Cho search engine biết CẤU TRÚC site! ★                  │
  │  → URLs nào tồn tại + metadata (lastmod, freq, priority)!   │
  │  → Giúp crawler index HIỆU QUẢ hơn! ★                      │
  │                                                              │
  │  ❓ 2: Google giới hạn bao nhiêu URLs / sitemap?               │
  │  → 50,000 URLs / sitemap! ★★★                               │
  │  → Vượt → dùng generateSitemaps chia nhỏ! ★                 │
  │  → Output: /sitemap/0.xml, /sitemap/1.xml... ★              │
  │                                                              │
  │  ❓ 3: Image + Video sitemaps khác gì thường?                  │
  │  → Thêm namespace (xmlns:image, xmlns:video)! ★             │
  │  → Giúp Google Images + Google Video tìm content! ★         │
  │  → images: string[], videos: Array<{title,thumb,desc}> ★    │
  │                                                              │
  │  ❓ 4: Localized sitemap — alternates là gì?                   │
  │  → Cho Google biết phiên bản ngôn ngữ! ★                    │
  │  → alternates.languages: { es: '...', de: '...' } ★         │
  │  → Output: <xhtml:link rel="alternate" hreflang="es"> ★     │
  │                                                              │
  │  ❓ 5: sitemap.js có cached không?                              │
  │  → CÓ! Special Route Handler, CACHED by default! ★          │
  │  → Trừ khi dùng Dynamic API hoặc dynamic config! ★          │
  │  → Giống robots.js, icon.js, manifest.js! ★                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
