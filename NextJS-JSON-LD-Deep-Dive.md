# Next.js JSON-LD — Deep Dive!

> **Chủ đề**: JSON-LD — Structured Data cho SEO + AI!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/json-ld
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. JSON-LD Là Gì? — Tổng Quan](#1)
2. [§2. Schema.org — Các @type Phổ Biến](#2)
3. [§3. Implementation — script Tag Trong Next.js](#3)
4. [§4. XSS Prevention — Sanitize JSON-LD](#4)
5. [§5. TypeScript Typing — schema-dts](#5)
6. [§6. Validation — Test Structured Data](#6)
7. [§7. Tự Viết — JsonLdEngine](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. JSON-LD Là Gì? — Tổng Quan!

```
  JSON-LD — BIG PICTURE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  JSON-LD = JSON for Linking Data                           │
  │  = Structured Data FORMAT cho search engines + AI!        │
  │                                                            │
  │  VẤN ĐỀ:                                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  <h1>iPhone 16 Pro</h1>                              │  │
  │  │  <p>$999</p>                                         │  │
  │  │  <p>4.8 stars</p>                                    │  │
  │  │                                                      │  │
  │  │  Googlebot: "Đây là gì? Product? Article? Person?" │  │
  │  │  → HTML chỉ có text! Không có NGHĨA cấu trúc!     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  GIẢI PHÁP — JSON-LD:                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  <script type="application/ld+json">                 │  │
  │  │  {                                                   │  │
  │  │    "@context": "https://schema.org",                 │  │
  │  │    "@type": "Product",                               │  │
  │  │    "name": "iPhone 16 Pro",                          │  │
  │  │    "price": "999",                                   │  │
  │  │    "rating": "4.8"                                   │  │
  │  │  }                                                   │  │
  │  │  </script>                                           │  │
  │  │                                                      │  │
  │  │  Googlebot: "Đây là Product! Tên, giá, đánh giá!" │  │
  │  │  → HIỂU cấu trúc! Rich Results!                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  JSON-LD vs MICRODATA vs RDFa:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  3 CÁCH EMBED STRUCTURED DATA:                           │
  │                                                          │
  │  ① MICRODATA (HTML attributes):                          │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ <div itemscope itemtype="schema.org/Product">      │  │
  │  │   <span itemprop="name">iPhone</span>              │  │
  │  │   → Trộn vào HTML! Khó maintain!                   │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  ② RDFa (HTML attributes):                               │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ <div vocab="schema.org" typeof="Product">          │  │
  │  │   <span property="name">iPhone</span>              │  │
  │  │   → Tương tự Microdata! Phức tạp hơn!             │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  ③ JSON-LD (separate script): ← KHUYÊN DÙNG!           │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ <script type="application/ld+json">                │  │
  │  │   { "@type": "Product", "name": "iPhone" }         │  │
  │  │ </script>                                           │  │
  │  │   → TÁCH BIỆT khỏi HTML!                          │  │
  │  │   → Dễ generate từ data!                            │  │
  │  │   → Google KHUYÊN DÙNG!                             │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  AI + SEARCH ENGINE SỬ DỤNG JSON-LD:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Search Engine (Google, Bing):                            │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ → Rich Results (stars, price, image in SERP!)     │  │
  │  │ → Knowledge Graph entries                          │  │
  │  │ → Featured Snippets                                │  │
  │  │ → Product carousels                                │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  AI (ChatGPT, Gemini, Claude):                           │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ → Understand page structure beyond text           │  │
  │  │ → Extract entities (Product, Person, Event)       │  │
  │  │ → Better answer generation                         │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. Schema.org — Các @type Phổ Biến!

```
  SCHEMA.ORG TYPES:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  @context: "https://schema.org" ← Luôn dùng!          │
  │                                                          │
  │  ┌────────────┬──────────────────────────────────────┐   │
  │  │ @type      │ Mô tả                               │   │
  │  ├────────────┼──────────────────────────────────────┤   │
  │  │ Product    │ Sản phẩm (name, price, image, sku)  │   │
  │  │ Person     │ Người (name, jobTitle, email)        │   │
  │  │ Organization│ Tổ chức (name, logo, url)           │   │
  │  │ Article    │ Bài viết (headline, author, date)    │   │
  │  │ Event      │ Sự kiện (startDate, location)        │   │
  │  │ Movie      │ Phim (director, actor, dateCreated)  │   │
  │  │ Book       │ Sách (author, isbn, publisher)       │   │
  │  │ Recipe     │ Công thức nấu ăn (ingredients, time)│   │
  │  │ FAQPage    │ FAQ (mainEntity: Q&A pairs)          │   │
  │  │ BreadcrumbList│ Breadcrumb navigation             │   │
  │  │ WebSite    │ Toàn site (searchAction)             │   │
  │  │ LocalBusiness│ Doanh nghiệp (address, hours)     │   │
  │  └────────────┴──────────────────────────────────────┘   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Implementation — script Tag Trong Next.js!

```
  NEXT.JS IMPLEMENTATION:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Render trong layout.tsx hoặc page.tsx:                    │
  │                                                            │
  │  Server Component                                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  1. Fetch data (product, article...)                │  │
  │  │  2. Build jsonLd object                              │  │
  │  │  3. JSON.stringify() + sanitize                      │  │
  │  │  4. Render <script type="application/ld+json">       │  │
  │  │  5. dangerouslySetInnerHTML={{ __html: ... }}        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  HTML Output:                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  <section>                                           │  │
  │  │    <script type="application/ld+json">               │  │
  │  │      {"@context":"https://schema.org",               │  │
  │  │       "@type":"Product",                             │  │
  │  │       "name":"iPhone 16 Pro",                        │  │
  │  │       "image":"...",                                 │  │
  │  │       "description":"..."}                           │  │
  │  │    </script>                                         │  │
  │  │    <h1>iPhone 16 Pro</h1>                            │  │
  │  │    <!-- ... visible content ... -->                  │  │
  │  │  </section>                                          │  │
  │  │                                                      │  │
  │  │  → Script KHÔNG visible! Chỉ cho bots!            │  │
  │  │  → Server-rendered! Bots thấy ngay!                │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Full code:**

```typescript
export default async function Page({ params }) {
  const { id } = await params
  const product = await getProduct(id)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description,
  }

  return (
    <section>
      {/* JSON-LD — invisible to users, visible to bots! */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, '\\u003c'),
        }}
      />
      {/* Visible content */}
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </section>
  )
}
```

---

## §4. XSS Prevention — Sanitize JSON-LD!

```
  XSS ATTACK VECTOR:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VẤN ĐỀ: JSON.stringify() KHÔNG sanitize HTML!           │
  │                                                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  // Attacker đặt tên product:                       │  │
  │  │  product.name = '</script><script>alert("XSS")</script>'│
  │  │                                                      │  │
  │  │  // JSON.stringify giữ nguyên:                       │  │
  │  │  <script type="application/ld+json">                 │  │
  │  │    {"name":"</script><script>alert("XSS")</script>"} │  │
  │  │  </script>                                           │  │
  │  │            ↑                                         │  │
  │  │    Browser thấy </script> → ĐÓNG script tag!        │  │
  │  │    → alert("XSS") CHẠY! → XSS ATTACK! 💀          │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  GIẢI PHÁP: Replace < → \u003c                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  JSON.stringify(jsonLd).replace(/</g, '\\u003c')     │  │
  │  │                                                      │  │
  │  │  // Trước: </script><script>alert("XSS")</script>   │  │
  │  │  // Sau:   \u003c/script\u003e\u003cscript\u003e...  │  │
  │  │                                                      │  │
  │  │  → Browser KHÔNG thấy </script> nữa!               │  │
  │  │  → \u003c là Unicode escape → an toàn!             │  │
  │  │  → JSON parsers hiểu \u003c = <                     │  │
  │  │  → Bots vẫn đọc được! ✅                           │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. TypeScript Typing — schema-dts!

```
  TYPE SAFETY VỚI schema-dts:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  KHÔNG có schema-dts:                                    │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ const jsonLd = {                                   │  │
  │  │   '@context': 'https://schema.org',                │  │
  │  │   '@type': 'Product',                              │  │
  │  │   naem: 'iPhone', // ← TYPO! Không bị bắt!       │  │
  │  │   pirce: '999',   // ← TYPO! Không bị bắt!      │  │
  │  │ }                                                  │  │
  │  │ → TypeScript: {} → any → mọi thứ OK! ❌          │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  CÓ schema-dts:                                          │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ import { Product, WithContext } from 'schema-dts'  │  │
  │  │                                                    │  │
  │  │ const jsonLd: WithContext<Product> = {              │  │
  │  │   '@context': 'https://schema.org',                │  │
  │  │   '@type': 'Product',                              │  │
  │  │   naem: 'iPhone', // ← TS ERROR! ✅               │  │
  │  │   pirce: '999',   // ← TS ERROR! ✅              │  │
  │  │ }                                                  │  │
  │  │ → TypeScript: Property 'naem' does not exist!     │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  WithContext<T> =                                        │
  │    T & { '@context': 'https://schema.org' }              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Validation — Test Structured Data!

```
  VALIDATION TOOLS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Google Rich Results Test:                             │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  URL: search.google.com/test/rich-results          │  │
  │  │  → Paste URL hoặc code snippet                    │  │
  │  │  → Kiểm tra: có eligible cho Rich Results?        │  │
  │  │  → Xem preview kết quả tìm kiếm!                 │  │
  │  │  → Báo lỗi/warnings cụ thể!                      │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  ② Schema Markup Validator:                              │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  URL: validator.schema.org                          │  │
  │  │  → Generic validator (không chỉ Google!)          │  │
  │  │  → Validate syntax JSON-LD                        │  │
  │  │  → Check schema.org compliance                    │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  WORKFLOW:                                                │
  │  Code → Deploy → Rich Results Test → Fix → Repeat!    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — JsonLdEngine!

```javascript
var JsonLdEngine = (function () {
  // ═══════════════════════════════════
  // 1. SCHEMA REGISTRY (mini schema.org)
  // ═══════════════════════════════════
  var schemas = {
    Product: {
      required: ["name"],
      optional: ["image", "description", "price", "sku", "brand", "review"],
    },
    Person: {
      required: ["name"],
      optional: ["jobTitle", "email", "url", "telephone", "image"],
    },
    Article: {
      required: ["headline", "author"],
      optional: ["datePublished", "dateModified", "image", "publisher"],
    },
    Event: {
      required: ["name", "startDate"],
      optional: ["endDate", "location", "description", "organizer"],
    },
    Organization: {
      required: ["name"],
      optional: ["url", "logo", "description", "contactPoint"],
    },
  };

  // ═══════════════════════════════════
  // 2. BUILDER — Create JSON-LD
  // ═══════════════════════════════════
  function createJsonLd(type, data) {
    var schema = schemas[type];
    if (!schema) {
      console.log("  ❌ Unknown type: " + type);
      return null;
    }

    var jsonLd = {
      "@context": "https://schema.org",
      "@type": type,
    };

    // Add required fields
    for (var i = 0; i < schema.required.length; i++) {
      var key = schema.required[i];
      if (!(key in data)) {
        console.log("  ⚠️ Missing required: " + key);
        return null;
      }
      jsonLd[key] = data[key];
    }

    // Add optional fields
    for (var j = 0; j < schema.optional.length; j++) {
      var optKey = schema.optional[j];
      if (optKey in data) {
        jsonLd[optKey] = data[optKey];
      }
    }

    console.log("  ✅ Created " + type + " JSON-LD");
    return jsonLd;
  }

  // ═══════════════════════════════════
  // 3. SANITIZER — XSS Prevention
  // ═══════════════════════════════════
  function sanitize(jsonLd) {
    var raw = JSON.stringify(jsonLd);
    var sanitized = raw.replace(/</g, "\\u003c");

    if (raw !== sanitized) {
      console.log("  🛡️ Sanitized! Replaced < with \\u003c");
    } else {
      console.log("  ✅ Clean! No < found.");
    }
    return sanitized;
  }

  // ═══════════════════════════════════
  // 4. VALIDATOR — Check Structured Data
  // ═══════════════════════════════════
  function validate(jsonLd) {
    var errors = [];
    var warnings = [];

    if (!jsonLd["@context"]) {
      errors.push("Missing @context");
    }
    if (jsonLd["@context"] !== "https://schema.org") {
      errors.push("@context must be https://schema.org");
    }
    if (!jsonLd["@type"]) {
      errors.push("Missing @type");
    }
    if (!(jsonLd["@type"] in schemas)) {
      warnings.push("Unknown @type: " + jsonLd["@type"]);
    }

    var schema = schemas[jsonLd["@type"]];
    if (schema) {
      for (var i = 0; i < schema.required.length; i++) {
        if (!(schema.required[i] in jsonLd)) {
          errors.push("Missing required: " + schema.required[i]);
        }
      }
      if (!jsonLd.image) {
        warnings.push("Image recommended for Rich Results");
      }
    }

    console.log(
      "  📋 Validation: " +
        errors.length +
        " errors, " +
        warnings.length +
        " warnings",
    );
    if (errors.length > 0) {
      console.log("  ❌ Errors: " + errors.join(", "));
    }
    if (warnings.length > 0) {
      console.log("  ⚠️ Warnings: " + warnings.join(", "));
    }
    return { valid: errors.length === 0, errors: errors, warnings: warnings };
  }

  // ═══════════════════════════════════
  // 5. RENDERER — Generate <script> tag
  // ═══════════════════════════════════
  function renderScriptTag(jsonLd) {
    var sanitized = sanitize(jsonLd);
    var html = '<script type="application/ld+json">' + sanitized + "</script>";
    console.log("  🖥️ HTML output (" + html.length + " chars)");
    return html;
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  JSON-LD ENGINE DEMO                ║");
    console.log("╚════════════════════════════════════╝");

    // Scenario 1: Product
    console.log("\n── Scenario 1: Product ──");
    var product = createJsonLd("Product", {
      name: "iPhone 16 Pro",
      image: "https://example.com/iphone.jpg",
      description: "Latest iPhone",
      price: "999",
    });
    validate(product);
    renderScriptTag(product);

    // Scenario 2: XSS Attack!
    console.log("\n── Scenario 2: XSS Prevention ──");
    var xss = createJsonLd("Product", {
      name: '</script><script>alert("XSS")</script>',
    });
    renderScriptTag(xss);

    // Scenario 3: Missing required
    console.log("\n── Scenario 3: Missing Required ──");
    createJsonLd("Event", { description: "Party" });
    // Missing: name, startDate

    // Scenario 4: Validation warnings
    console.log("\n── Scenario 4: Validation ──");
    var article = createJsonLd("Article", {
      headline: "Next.js Guide",
      author: "Vercel",
    });
    validate(article);
  }

  return { demo: demo };
})();
// Chạy: JsonLdEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: JSON-LD là gì? Tại sao Google khuyên dùng thay vì Microdata?

<details><summary>Đáp án</summary>

**JSON-LD** (JSON for Linking Data) là format structured data dùng JSON, embedded trong `<script type="application/ld+json">`.

**Google khuyên dùng vì**:

1. **Tách biệt**: JSON-LD nằm trong `<script>` riêng — không trộn vào HTML như Microdata (`itemprop`, `itemscope`)
2. **Dễ generate**: JSON object → `JSON.stringify()` → done! Microdata cần modify HTML elements
3. **Dễ maintain**: Thay đổi structured data không ảnh hưởng HTML structure
4. **Server-friendly**: Dễ generate từ server data (database, API) → inject vào page
5. **Không ảnh hưởng rendering**: `<script type="application/ld+json">` không render visible content

</details>

---

**Câu 2**: Tại sao cần `.replace(/</g, '\\u003c')`? Giải thích XSS vector.

<details><summary>Đáp án</summary>

**Attack vector**:

```
product.name = '</script><script>alert("XSS")</script>'
```

Browser parse HTML **tuần tự** từ trên xuống:

1. Gặp `<script type="application/ld+json">` → bắt đầu script block
2. Gặp `</script>` TRONG product.name → **ĐÓNG script block**!
3. `<script>alert("XSS")</script>` → browser hiểu là **script mới** → **CHẠY**!

**Fix**: Replace `<` → `\u003c` (Unicode escape):

- `\u003c` là Unicode cho `<` → JSON parsers hiểu = `<`
- Browser HTML parser **KHÔNG** coi `\u003c` là tag opener
- `</script>` trở thành `\u003c/script>` → browser không đóng script block

</details>

---

**Câu 3**: Đặt JSON-LD ở layout.tsx hay page.tsx?

<details><summary>Đáp án</summary>

**Tùy vào scope**:

| Vị trí       | Khi nào dùng                | Ví dụ @type                                 |
| ------------ | --------------------------- | ------------------------------------------- |
| `layout.tsx` | Data chung cho TẤT CẢ pages | `WebSite`, `Organization`, `BreadcrumbList` |
| `page.tsx`   | Data CỤ THỂ cho từng page   | `Product`, `Article`, `Event`, `Person`     |

**Layout**: JSON-LD cho toàn site (tên công ty, logo, search action) — render 1 lần, áp dụng mọi page.

**Page**: JSON-LD cho từng trang riêng — fetch data cụ thể (product details, article content) → generate JSON-LD tương ứng.

Có thể dùng **CẢ HAI** cùng lúc: layout cho Organization + page cho Product → 2 `<script>` tags trên page.

</details>

---

**Câu 4**: dangerouslySetInnerHTML có nguy hiểm không? Tại sao phải dùng?

<details><summary>Đáp án</summary>

**Tại sao phải dùng**: React **escape** tất cả string trong JSX (`<`, `>`, `"` → HTML entities). Nhưng JSON-LD cần là **raw JSON string** trong `<script>` tag — nếu React escape → JSON bị hỏng!

```jsx
// ❌ React escape:
<script>{jsonString}</script>
// Output: &quot;@context&quot;: ... → BROKEN JSON!

// ✅ dangerouslySetInnerHTML:
<script dangerouslySetInnerHTML={{ __html: jsonString }} />
// Output: "@context": ... → VALID JSON!
```

**Có nguy hiểm không?** Tên "dangerously" là **cảnh báo** — nếu inject raw HTML from user input → XSS! Đó là lý do cần `.replace(/</g, '\\u003c')` — sanitize TRƯỚC khi inject.

**Kết hợp**: `dangerouslySetInnerHTML` + `.replace()` = an toàn! Raw JSON cho bots, sanitized cho security.

</details>
