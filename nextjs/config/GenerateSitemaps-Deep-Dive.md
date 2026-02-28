# generateSitemaps() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v13.3.2! (URL format changed v15.0.0!)

---

## §1. generateSitemaps() Là Gì?

```
  generateSitemaps() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Generate NHIỀU sitemaps cho application! ★                │
  │  → Google giới hạn 50,000 URLs / sitemap! ★★★               │
  │  → Chia nhỏ large sites thành multiple sitemaps! ★           │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  generateSitemaps() → [{ id: 0 }, { id: 1 }, ...]    │    │
  │  │       │                                               │    │
  │  │       ▼                                               │    │
  │  │  Next.js tạo sitemap FILES:                            │    │
  │  │  /product/sitemap/0.xml  ← URLs 0-49999! ★            │    │
  │  │  /product/sitemap/1.xml  ← URLs 50000-99999! ★        │    │
  │  │  /product/sitemap/2.xml  ← URLs 100000-149999! ★      │    │
  │  │  /product/sitemap/3.xml  ← URLs 150000-199999! ★      │    │
  │  │                                                       │    │
  │  │  URL FORMAT:                                           │    │
  │  │  /.../sitemap/[id].xml                                 │    │
  │  │  (v13: /.../sitemap.xml/[id])                          │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  RETURNS:                                                     │
  │  → Array of objects with 'id' property! ★                    │
  │  → id được truyền vào default sitemap function! ★            │
  │  → v16: id là Promise<string>! ★                             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Example — Splitting Large Sitemaps!

```
  FULL EXAMPLE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  // app/product/sitemap.ts                                    │
  │                                                              │
  │  export async function generateSitemaps() {                   │
  │    return [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]      │
  │  }                                                           │
  │                                                              │
  │  export default async function sitemap(props) {               │
  │    const id = await props.id                                 │
  │    const start = id * 50000                                  │
  │    const end = start + 50000                                 │
  │    const products = await getProducts(                       │
  │      `SELECT id, date FROM products                          │
  │       WHERE id BETWEEN ${start} AND ${end}`                  │
  │    )                                                         │
  │    return products.map(product => ({                          │
  │      url: `${BASE_URL}/product/${product.id}`,               │
  │      lastModified: product.date,                             │
  │    }))                                                       │
  │  }                                                           │
  │                                                              │
  │  GENERATED FILES:                                             │
  │  /product/sitemap/0.xml → products 0-49999! ★                │
  │  /product/sitemap/1.xml → products 50000-99999! ★            │
  │  /product/sitemap/2.xml → products 100000-149999! ★          │
  │  /product/sitemap/3.xml → products 150000-199999! ★          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — GenerateSitemapsEngine!

```javascript
var GenerateSitemapsEngine = (function () {
  var GOOGLE_LIMIT = 50000;

  function splitIntoSitemaps(totalCount) {
    var count = Math.ceil(totalCount / GOOGLE_LIMIT);
    var sitemaps = [];
    for (var i = 0; i < count; i++) {
      sitemaps.push({
        id: i,
        range: {
          start: i * GOOGLE_LIMIT,
          end: Math.min((i + 1) * GOOGLE_LIMIT, totalCount),
        },
        url: "/sitemap/" + i + ".xml",
      });
    }
    return sitemaps;
  }

  function generateSitemapXml(baseUrl, items) {
    var xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (var i = 0; i < items.length; i++) {
      xml += "  <url>\n    <loc>" + baseUrl + items[i].path + "</loc>\n";
      if (items[i].lastModified)
        xml += "    <lastmod>" + items[i].lastModified + "</lastmod>\n";
      xml += "  </url>\n";
    }
    xml += "</urlset>";
    return xml;
  }

  function demo() {
    console.log("═══ GenerateSitemaps Engine ═══");
    console.log("\n── Split ──");
    console.log("120,000 products:", splitIntoSitemaps(120000));
    console.log("\n── XML ──");
    console.log(
      generateSitemapXml("https://example.com", [
        { path: "/product/1", lastModified: "2024-01-01" },
        { path: "/product/2", lastModified: "2024-01-02" },
      ]),
    );
  }

  return { demo: demo };
})();
// Chạy: GenerateSitemapsEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: generateSitemaps() dùng khi nào?                        │
  │  → Site có > 50,000 URLs! ★                                  │
  │  → Google limit 50,000 URLs / sitemap! ★★★                   │
  │  → Split thành multiple sitemap files! ★                     │
  │                                                              │
  │  ❓ 2: URL format của generated sitemaps?                       │
  │  → v15+: /.../sitemap/[id].xml! ★                            │
  │  → v13: /.../sitemap.xml/[id]! ★                             │
  │                                                              │
  │  ❓ 3: Return gì?                                               │
  │  → Array of { id }! ★                                        │
  │  → id truyền vào default sitemap function! ★                 │
  │  → v16: id là Promise<string>! ★                             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
