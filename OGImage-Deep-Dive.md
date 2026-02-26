# opengraph-image & twitter-image — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có bảng, code blocks, callout boxes!
> **Since**: v13.3.0! (params Promise: v16.0.0!)

---

## §1. Tổng Quan — Social Sharing Images!

```
  OG IMAGE + TWITTER IMAGE — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Set image hiển thị khi CHIA SẺ LINK trên social! ★       │
  │  → Facebook, LinkedIn, Slack, Discord → OG Image! ★         │
  │  → Twitter/X → Twitter Image! ★                              │
  │                                                              │
  │  KHI SHARE LINK:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Facebook / LinkedIn / Slack / Discord:               │    │
  │  │  ┌──────────────────────────────────┐                 │    │
  │  │  │ ┌────────────────────────────┐   │                 │    │
  │  │  │ │      OG IMAGE 1200x630    │   │                 │    │
  │  │  │ │     (opengraph-image!)     │   │                 │    │
  │  │  │ └────────────────────────────┘   │                 │    │
  │  │  │  My Website Title                │                 │    │
  │  │  │  Description text here...        │                 │    │
  │  │  │  example.com                     │                 │    │
  │  │  └──────────────────────────────────┘                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  2 CÁCH SET:                                                  │
  │  → Cách 1: Image files (.jpg, .png, .gif) ★                 │
  │  → Cách 2: Code generation (.js, .ts, .tsx) ★               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Cách 1: Image Files!

```
  IMAGE FILES:
  ┌──────────────────┬──────────────┬──────────────────────────┐
  │ File             │ Extensions   │ Output <meta>            │
  ├──────────────────┼──────────────┼──────────────────────────┤
  │ opengraph-image  │ .jpg .jpeg   │ <meta property="og:image"│
  │                  │ .png .gif    │  content="<generated>" />│
  │                  │              │ + og:image:type          │
  │                  │              │ + og:image:width         │
  │                  │              │ + og:image:height        │
  ├──────────────────┼──────────────┼──────────────────────────┤
  │ twitter-image    │ .jpg .jpeg   │ <meta name="twitter:image│
  │                  │ .png .gif    │  " content="<generated>"/>│
  │                  │              │ + twitter:image:type     │
  │                  │              │ + twitter:image:width    │
  │                  │              │ + twitter:image:height   │
  ├──────────────────┼──────────────┼──────────────────────────┤
  │ opengraph-image  │ .txt         │ <meta property=          │
  │   .alt.txt       │              │ "og:image:alt"           │
  │                  │              │  content="About Acme" /> │
  ├──────────────────┼──────────────┼──────────────────────────┤
  │ twitter-image    │ .txt         │ <meta property=          │
  │   .alt.txt       │              │ "twitter:image:alt"      │
  │                  │              │  content="About Acme" /> │
  └──────────────────┴──────────────┴──────────────────────────┘

  FILE SIZE LIMITS! ★★★
  ┌──────────────────────────────────────────────────────────────┐
  │  twitter-image: MAX 5MB! ★ (vượt → BUILD FAIL!) ❌          │
  │  opengraph-image: MAX 8MB! ★ (vượt → BUILD FAIL!) ❌       │
  └──────────────────────────────────────────────────────────────┘

  ALT TEXT FILES! ★
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  File Structure:                                              │
  │  app/about/                                                   │
  │  ├── opengraph-image.png          ← image!                  │
  │  ├── opengraph-image.alt.txt      ← alt text (SEO!) ★       │
  │  ├── twitter-image.png                                       │
  │  └── twitter-image.alt.txt                                   │
  │                                                              │
  │  opengraph-image.alt.txt content:                             │
  │  "About Acme"                                                │
  │                                                              │
  │  → Output: <meta property="og:image:alt"                     │
  │             content="About Acme" />                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Cách 2: Generate Images Bằng Code!

```
  CODE GENERATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FILES:                                                       │
  │  ┌──────────────────┬──────────────────────┐                 │
  │  │ File             │ Extensions           │                 │
  │  ├──────────────────┼──────────────────────┤                 │
  │  │ opengraph-image  │ .js, .ts, .tsx        │                 │
  │  │ twitter-image    │ .js, .ts, .tsx        │                 │
  │  └──────────────────┴──────────────────────┘                 │
  │                                                              │
  │  CODE VÍ DỤ (opengraph-image.tsx):                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { ImageResponse } from 'next/og'              │    │
  │  │ import { readFile } from 'node:fs/promises'          │    │
  │  │ import { join } from 'node:path'                     │    │
  │  │                                                       │    │
  │  │ // Config exports!                                     │    │
  │  │ export const alt = 'About Acme'                        │    │
  │  │ export const size = { width: 1200, height: 630 }      │    │
  │  │ export const contentType = 'image/png'                 │    │
  │  │                                                       │    │
  │  │ export default async function Image() {               │    │
  │  │   const interSemiBold = await readFile(               │    │
  │  │     join(process.cwd(), 'assets/Inter-SemiBold.ttf')  │    │
  │  │   )                                                    │    │
  │  │   return new ImageResponse(                            │    │
  │  │     (                                                  │    │
  │  │       <div style={{                                     │    │
  │  │         fontSize: 128,                                  │    │
  │  │         background: 'white',                            │    │
  │  │         width: '100%', height: '100%',                 │    │
  │  │         display: 'flex',                                │    │
  │  │         alignItems: 'center',                           │    │
  │  │         justifyContent: 'center',                       │    │
  │  │       }}>                                               │    │
  │  │         About Acme                                      │    │
  │  │       </div>                                            │    │
  │  │     ),                                                  │    │
  │  │     { ...size, fonts: [{ name: 'Inter',                │    │
  │  │       data: interSemiBold, style: 'normal',            │    │
  │  │       weight: 400 }] }                                 │    │
  │  │   )                                                     │    │
  │  │ }                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  OUTPUT (5 meta tags!):                                       │
  │  <meta property="og:image" content="<generated>" />          │
  │  <meta property="og:image:alt" content="About Acme" />      │
  │  <meta property="og:image:type" content="image/png" />      │
  │  <meta property="og:image:width" content="1200" />          │
  │  <meta property="og:image:height" content="630" />          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  "GOOD TO KNOW" (từ docs!):
  ┌──────────────────────────────────────────────────────────────┐
  │  ① STATICALLY OPTIMIZED by default! ★                        │
  │    → Build time generate + cache!                            │
  │    → Trừ khi dùng Dynamic APIs/uncached data!               │
  │  ② Multiple images → generateImageMetadata API! ★           │
  │  ③ og-image.js + twitter-image.js = Special Route Handlers! │
  │    → Cached by default! ★                                    │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Props, Returns, Config Exports!

```
  PROPS:
  ┌──────────────────────────────────────────────────────────────┐
  │  params (optional — Promise!):                                │
  │  ┌──────────────────────┬──────────┬─────────────────────┐   │
  │  │ Route                │ URL      │ params              │   │
  │  ├──────────────────────┼──────────┼─────────────────────┤   │
  │  │ app/shop/            │ /shop    │ undefined           │   │
  │  │   opengraph-image.js │          │                     │   │
  │  │ app/shop/[slug]/     │ /shop/1  │ Promise<{slug:'1'}> │   │
  │  │   opengraph-image.js │          │                     │   │
  │  │ app/shop/[tag]/      │ /shop/   │ Promise<{tag:'1',   │   │
  │  │   [item]/og-image.js │   1/2    │   item:'2'}>        │   │
  │  └──────────────────────┴──────────┴─────────────────────┘   │
  │                                                              │
  │  + generateImageMetadata → thêm id prop (Promise!) ★        │
  └──────────────────────────────────────────────────────────────┘

  RETURNS:
  → Blob | ArrayBuffer | TypedArray | DataView
  → ReadableStream | Response
  → ImageResponse (satisfies all!) ★

  CONFIG EXPORTS:
  ┌──────────────────┬───────────────────────┬──────────────────┐
  │ Export           │ Type                  │ Output           │
  ├──────────────────┼───────────────────────┼──────────────────┤
  │ export const alt │ string                │ og:image:alt     │
  │ export const size│ {width,height}        │ og:image:width/  │
  │                  │                       │ og:image:height  │
  │ export const     │ string (MIME!)        │ og:image:type    │
  │   contentType    │                       │                  │
  └──────────────────┴───────────────────────┴──────────────────┘
  + Route Segment Config cũng áp dụng (dynamic, revalidate)! ★
```

---

## §5. Examples — External Data + Local Assets!

```
  EXAMPLE 1: EXTERNAL DATA (Dynamic OG Image!):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  // app/blog/[slug]/opengraph-image.tsx                        │
  │  export default async function Image({                       │
  │    params,                                                   │
  │  }: {                                                        │
  │    params: Promise<{ slug: string }>                         │
  │  }) {                                                        │
  │    const { slug } = await params                             │
  │    const post = await fetch(`https://.../posts/${slug}`)     │
  │      .then(res => res.json())                                │
  │                                                              │
  │    return new ImageResponse(                                  │
  │      <div style={{...}}>                                     │
  │        {post.title}  ← Dynamic content! ★                   │
  │      </div>,                                                 │
  │      { ...size }                                             │
  │    )                                                         │
  │  }                                                           │
  │                                                              │
  │  → Mặc định STATICALLY OPTIMIZED! ★                          │
  │  → Có thể config fetch options hoặc route segment config!    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  EXAMPLE 2: LOCAL ASSETS — 2 CÁCH!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Cách A: Base64 String!                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const logoData = await readFile(                      │    │
  │  │   join(process.cwd(), 'logo.png'), 'base64'           │    │
  │  │ )                                                      │    │
  │  │ const logoSrc = `data:image/png;base64,${logoData}`   │    │
  │  │ <img src={logoSrc} height="100" />                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  Cách B: ArrayBuffer! (Satori engine!)                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const logoData = await readFile(                      │    │
  │  │   join(process.cwd(), 'logo.png')                     │    │
  │  │ )                                                      │    │
  │  │ const logoSrc = Uint8Array.from(logoData).buffer      │    │
  │  │ {/* @ts-expect-error Satori runtime */}               │    │
  │  │ <img src={logoSrc} height="100" />                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ ArrayBuffer cho <img src> KHÔNG phải HTML spec! ★       │
  │  → Satori engine (next/og) hỗ trợ tại runtime! ★            │
  │  → TypeScript sẽ lỗi → cần @ts-expect-error! ★              │
  │  → process.cwd() = project root, KHÔNG phải file location!  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — OGImageEngine!

```javascript
var OGImageEngine = (function () {
  // ═══════════════════════════════════
  // 1. FILE VALIDATOR
  // ═══════════════════════════════════
  var RULES = {
    "opengraph-image": {
      extensions: [".jpg", ".jpeg", ".png", ".gif"],
      maxSizeMB: 8,
    },
    "twitter-image": {
      extensions: [".jpg", ".jpeg", ".png", ".gif"],
      maxSizeMB: 5,
    },
    "opengraph-image.alt": { extensions: [".txt"] },
    "twitter-image.alt": { extensions: [".txt"] },
  };

  function validateFile(type, extension, fileSizeMB) {
    var rule = RULES[type];
    if (!rule) return { valid: false, reason: "Unknown type: " + type };

    var extOK = false;
    for (var i = 0; i < rule.extensions.length; i++) {
      if (extension === rule.extensions[i]) {
        extOK = true;
        break;
      }
    }
    if (!extOK) {
      return {
        valid: false,
        reason: type + " không hỗ trợ " + extension + "!",
      };
    }

    if (rule.maxSizeMB && fileSizeMB > rule.maxSizeMB) {
      return {
        valid: false,
        reason: type + " vượt " + rule.maxSizeMB + "MB! BUILD FAIL! ❌",
        actual: fileSizeMB + "MB",
        limit: rule.maxSizeMB + "MB",
      };
    }

    return { valid: true, output: generateMetaTags(type, extension) };
  }

  // ═══════════════════════════════════
  // 2. META TAG GENERATOR
  // ═══════════════════════════════════
  function generateMetaTags(type, extension) {
    var isTwitter = type.indexOf("twitter") === 0;
    var prefix = isTwitter ? "twitter" : "og";
    var propAttr = isTwitter ? "name" : "property";

    if (type.indexOf(".alt") > -1) {
      return (
        "<meta " + propAttr + '="' + prefix + ':image:alt" content="..." />'
      );
    }

    var mimeMap = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
    };

    return [
      "<meta " + propAttr + '="' + prefix + ':image" content="<generated>" />',
      "<meta " +
        propAttr +
        '="' +
        prefix +
        ':image:type" content="' +
        (mimeMap[extension] || "image/png") +
        '" />',
      "<meta " +
        propAttr +
        '="' +
        prefix +
        ':image:width" content="<detected>" />',
      "<meta " +
        propAttr +
        '="' +
        prefix +
        ':image:height" content="<detected>" />',
    ].join("\n");
  }

  // ═══════════════════════════════════
  // 3. CONFIG EXPORT SIMULATOR
  // ═══════════════════════════════════
  function simulateConfigExports(config) {
    var tags = [];
    if (config.alt) {
      tags.push(
        '<meta property="og:image:alt" content="' + config.alt + '" />',
      );
    }
    if (config.size) {
      tags.push(
        '<meta property="og:image:width" content="' +
          config.size.width +
          '" />',
      );
      tags.push(
        '<meta property="og:image:height" content="' +
          config.size.height +
          '" />',
      );
    }
    if (config.contentType) {
      tags.push(
        '<meta property="og:image:type" content="' +
          config.contentType +
          '" />',
      );
    }
    return {
      tags: tags,
      caching: config.hasDynamicAPI ? "DYNAMIC!" : "STATIC (cached!) ★",
    };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ OG Image Engine ═══");

    console.log("\n── Validate ──");
    console.log("OG .png 3MB:", validateFile("opengraph-image", ".png", 3));
    console.log("OG .png 10MB:", validateFile("opengraph-image", ".png", 10));
    console.log("Twitter .jpg 6MB:", validateFile("twitter-image", ".jpg", 6));
    console.log("Twitter .jpg 4MB:", validateFile("twitter-image", ".jpg", 4));
    console.log(
      "OG alt .txt:",
      validateFile("opengraph-image.alt", ".txt", 0.001),
    );

    console.log("\n── Config Exports ──");
    console.log(
      "Full config:",
      simulateConfigExports({
        alt: "About Acme",
        size: { width: 1200, height: 630 },
        contentType: "image/png",
      }),
    );
  }

  return { demo: demo };
})();
// Chạy: OGImageEngine.demo();
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: opengraph-image vs twitter-image — khác gì?             │
  │  → OG: Facebook, LinkedIn, Slack, Discord! ★                 │
  │  → Twitter: Twitter/X card! ★                                │
  │  → Cùng extensions (.jpg .png .gif)!                         │
  │  → KHÁC size limit: OG=8MB, Twitter=5MB! ★★★                │
  │                                                              │
  │  ❓ 2: Kích thước OG image chuẩn?                              │
  │  → 1200 x 630 pixels! ★ (tỷ lệ 1.91:1!)                    │
  │  → Đây là kích thước CHUẨN cho Facebook/LinkedIn!            │
  │                                                              │
  │  ❓ 3: Alt text set bằng cách nào?                              │
  │  → Cách 1: File opengraph-image.alt.txt! ★                  │
  │  → Cách 2: export const alt = '...' (code gen!) ★           │
  │  → Quan trọng cho SEO và accessibility! ★                    │
  │                                                              │
  │  ❓ 4: ArrayBuffer cho <img src> — tại sao cần @ts-expect?    │
  │  → Satori (rendering engine) HỖ TRỢ tại runtime! ★          │
  │  → HTML spec KHÔNG cho phép ArrayBuffer cho src! ★           │
  │  → TypeScript theo spec → báo lỗi! ★                        │
  │  → @ts-expect-error để bypass! ★                             │
  │                                                              │
  │  ❓ 5: Generated images cached hay dynamic?                    │
  │  → CACHED by default (static optimized!) ★                  │
  │  → Special Route Handlers! ★                                 │
  │  → Dùng Dynamic API → dynamic! ★                            │
  │  → Config fetch options hoặc route segment config! ★         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
