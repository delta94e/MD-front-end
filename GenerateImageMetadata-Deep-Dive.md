# generateImageMetadata() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/generate-image-metadata
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v13.3.0! id as Promise since v16.0.0!

---

## §1. generateImageMetadata() Là Gì?

```
  generateImageMetadata() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Generate NHIỀU PHIÊN BẢN của 1 image! ★                   │
  │  → Hoặc NHIỀU images cho 1 route segment! ★                 │
  │  → Tránh hard-code metadata (icons, OG images!) ★           │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  icon.tsx / opengraph-image.tsx:                        │    │
  │  │                                                       │    │
  │  │  export function generateImageMetadata() {             │    │
  │  │    return [                                            │    │
  │  │      { id: 'small', size: {w:48,h:48} },  ← Icon 1!  │    │
  │  │      { id: 'medium', size: {w:72,h:72} }, ← Icon 2!  │    │
  │  │    ]                                                   │    │
  │  │  }                                                     │    │
  │  │       │                                               │    │
  │  │       ▼                                               │    │
  │  │  Next.js gọi default export CHO MỖI id:               │    │
  │  │  Icon({ id: 'small' })  → <link> 48x48! ★             │    │
  │  │  Icon({ id: 'medium' }) → <link> 72x72! ★             │    │
  │  │                                                       │    │
  │  │  OUTPUT HTML:                                          │    │
  │  │  <link rel="icon" href="/icon/small" sizes="48x48">   │    │
  │  │  <link rel="icon" href="/icon/medium" sizes="72x72">  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Parameters + Returns + Props!

```
  PARAMETERS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  generateImageMetadata({ params })                           │
  │                                                              │
  │  params (optional):                                           │
  │  → Dynamic route parameters! ★                               │
  │  → Từ root segment đến segment hiện tại! ★                  │
  │                                                              │
  │  PARAMS MAPPING:                                              │
  │  ┌──────────────────────┬──────────┬──────────────────────┐  │
  │  │ File                 │ URL      │ params               │  │
  │  ├──────────────────────┼──────────┼──────────────────────┤  │
  │  │ app/shop/icon.js     │ /shop    │ undefined            │  │
  │  │ app/shop/[slug]/     │ /shop/1  │ { slug: '1' }        │  │
  │  │   icon.js            │          │                      │  │
  │  │ app/shop/[tag]/      │ /shop/   │ { tag: '1',          │  │
  │  │   [item]/icon.js     │   1/2    │   item: '2' }        │  │
  │  └──────────────────────┴──────────┴──────────────────────┘  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  RETURNS — Array of objects:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Return: Array<{                                              │
  │    id: string | number   ← BẮT BUỘC! Unique ID! ★           │
  │    alt?: string          ← Alt text! ★                       │
  │    size?: { width, height } ← Kích thước! ★                 │
  │    contentType?: string  ← MIME type ('image/png'!) ★       │
  │  }>                                                          │
  │                                                              │
  │  → id truyền vào default export function! ★                  │
  │  → Mỗi item = 1 image generated! ★                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  IMAGE GENERATION FUNCTION PROPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  export default async function Icon({ id, params }) { ... }  │
  │                                                              │
  │  id: Promise<string | number>                                │
  │  → PHẢI await! (v16.0.0+) ★                                 │
  │  → Từ generateImageMetadata return! ★                       │
  │                                                              │
  │  params: Promise<{ slug: string }>                           │
  │  → PHẢI await! (v16.0.0+) ★                                 │
  │  → Dynamic route params! ★                                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Examples — 2 Patterns!

```
  PATTERN 1: MULTIPLE ICONS!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  // app/icon.tsx                                              │
  │  import { ImageResponse } from 'next/og'                    │
  │                                                              │
  │  export function generateImageMetadata() {                    │
  │    return [                                                   │
  │      { contentType: 'image/png',                             │
  │        size: { width: 48, height: 48 }, id: 'small' },      │
  │      { contentType: 'image/png',                             │
  │        size: { width: 72, height: 72 }, id: 'medium' },     │
  │    ]                                                         │
  │  }                                                           │
  │                                                              │
  │  export default async function Icon({ id }) {                 │
  │    const iconId = await id                                   │
  │    return new ImageResponse(                                 │
  │      <div style={{ ... }}>Icon {iconId}</div>                │
  │    )                                                         │
  │  }                                                           │
  │                                                              │
  │  → 1 file → 2 icons (48x48 + 72x72)! ★                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  PATTERN 2: EXTERNAL DATA + OG IMAGES!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  // app/products/[id]/opengraph-image.tsx                    │
  │                                                              │
  │  export async function generateImageMetadata({ params }) {   │
  │    const images = await getOGImages(params.id)               │
  │    return images.map((image, idx) => ({                      │
  │      id: idx,                                                │
  │      size: { width: 1200, height: 600 },                    │
  │      alt: image.text,                                        │
  │      contentType: 'image/png',                              │
  │    }))                                                       │
  │  }                                                           │
  │                                                              │
  │  export default async function Image({ params, id }) {       │
  │    const productId = (await params).id                       │
  │    const imageId = await id                                  │
  │    const text = await getCaptionForImage(productId, imageId) │
  │    return new ImageResponse(<div>{text}</div>)               │
  │  }                                                           │
  │                                                              │
  │  → Fetch từ DB/API → dynamic image count! ★                 │
  │  → Mỗi product có N OG images! ★                            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — GenerateImageMetadataEngine!

```javascript
var GenerateImageMetadataEngine = (function () {
  // ═══════════════════════════════════
  // 1. IMAGE METADATA GENERATOR
  // ═══════════════════════════════════
  function generateImageMetadata(items) {
    var errors = [];
    var results = [];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];

      // Validate id (required!)
      if (item.id === undefined || item.id === null) {
        errors.push("Item[" + i + "] thiếu 'id'! BẮT BUỘC! ★");
        continue;
      }

      // Validate size
      if (item.size && (!item.size.width || !item.size.height)) {
        errors.push("Item[" + i + "] size cần width + height! ★");
      }

      results.push({
        id: item.id,
        alt: item.alt || "",
        size: item.size || { width: 32, height: 32 },
        contentType: item.contentType || "image/png",
      });
    }

    return { items: results, errors: errors, count: results.length };
  }

  // ═══════════════════════════════════
  // 2. LINK TAG GENERATOR
  // ═══════════════════════════════════
  function generateLinkTags(basePath, metadata, type) {
    type = type || "icon";
    var tags = [];
    for (var i = 0; i < metadata.length; i++) {
      var m = metadata[i];
      var rel = type === "icon" ? "icon" : "apple-touch-icon";
      var href = basePath + "/" + m.id;
      tags.push(
        '<link rel="' +
          rel +
          '" href="' +
          href +
          '" sizes="' +
          m.size.width +
          "x" +
          m.size.height +
          '" type="' +
          m.contentType +
          '">',
      );
    }
    return tags;
  }

  // ═══════════════════════════════════
  // 3. PARAMS RESOLVER
  // ═══════════════════════════════════
  function resolveParams(filePath, url) {
    // app/shop/[slug]/icon.js + /shop/1 → { slug: '1' }
    var pathParts = filePath
      .replace("app/", "")
      .replace("/icon.js", "")
      .split("/");
    var urlParts = url.replace(/^\//, "").split("/");
    var params = {};

    for (var i = 0; i < pathParts.length; i++) {
      var part = pathParts[i];
      if (part.startsWith("[") && part.endsWith("]")) {
        var key = part.slice(1, -1);
        params[key] = urlParts[i] || undefined;
      }
    }

    return Object.keys(params).length > 0 ? params : undefined;
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ GenerateImageMetadata Engine ═══");

    console.log("\n── Generate ──");
    console.log(
      generateImageMetadata([
        {
          id: "small",
          size: { width: 48, height: 48 },
          contentType: "image/png",
        },
        {
          id: "medium",
          size: { width: 72, height: 72 },
          contentType: "image/png",
        },
        { id: "large", size: { width: 192, height: 192 }, alt: "App icon" },
      ]),
    );

    console.log("\n── Missing ID ──");
    console.log(generateImageMetadata([{ size: { width: 48, height: 48 } }]));

    console.log("\n── Link Tags ──");
    var meta = [
      {
        id: "small",
        size: { width: 48, height: 48 },
        contentType: "image/png",
      },
      {
        id: "medium",
        size: { width: 72, height: 72 },
        contentType: "image/png",
      },
    ];
    console.log(generateLinkTags("/icon", meta, "icon"));

    console.log("\n── Params ──");
    console.log(resolveParams("app/shop/icon.js", "/shop"));
    console.log(resolveParams("app/shop/[slug]/icon.js", "/shop/1"));
    console.log(resolveParams("app/shop/[tag]/[item]/icon.js", "/shop/1/2"));
  }

  return { demo: demo };
})();
// Chạy: GenerateImageMetadataEngine.demo();
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: generateImageMetadata() dùng để làm gì?                │
  │  → Generate NHIỀU versions của 1 image! ★                    │
  │  → Hoặc NHIỀU images cho 1 route segment! ★                 │
  │  → Tránh hard-code metadata cho icons/OG images! ★         │
  │                                                              │
  │  ❓ 2: Return array phải có gì?                                │
  │  → id (BẮT BUỘC!): string | number → unique mỗi image! ★   │
  │  → alt (optional): alt text! ★                               │
  │  → size (optional): { width, height }! ★                    │
  │  → contentType (optional): MIME type! ★                     │
  │                                                              │
  │  ❓ 3: id truyền vào default export như thế nào?               │
  │  → Dưới dạng Promise! (v16.0.0+) ★                          │
  │  → PHẢI: const iconId = await id! ★                         │
  │  → Mỗi item trong array → 1 lần gọi default function! ★   │
  │                                                              │
  │  ❓ 4: Kết hợp external data như thế nào?                      │
  │  → Fetch danh sách images từ DB/API! ★                      │
  │  → Map thành array of { id, size, alt }! ★                  │
  │  → Default function nhận id + params → generate image! ★   │
  │                                                              │
  │  ❓ 5: So sánh với single image export?                        │
  │  → Single: 1 file = 1 image! ★                              │
  │  → generateImageMetadata: 1 file = N images! ★              │
  │  → Dynamic count dựa trên data! ★                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
