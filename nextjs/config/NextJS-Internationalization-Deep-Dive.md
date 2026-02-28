# Next.js Internationalization (i18n) — Deep Dive!

> **Chủ đề**: i18n — Đa Ngôn Ngữ Trong Next.js!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/internationalization
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Internationalization vs Localization](#1)
2. [§2. Terminology — Locale Là Gì?](#2)
3. [§3. Routing — Accept-Language + Proxy](#3)
4. [§4. app/[lang] — Dynamic Locale Segment](#4)
5. [§5. Localization — Dictionaries Pattern](#5)
6. [§6. Static Rendering — generateStaticParams](#6)
7. [§7. Tự Viết — I18nEngine](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — Internationalization vs Localization!

```
  i18n BIG PICTURE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  2 KHÁI NIỆM CẦN PHÂN BIỆT:                              │
  │                                                            │
  │  INTERNATIONALIZATION (i18n):                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  = THIẾT KẾ ứng dụng để HỖ TRỢ nhiều ngôn ngữ!   │  │
  │  │  → Routing: /en/products, /vi/products              │  │
  │  │  → Dynamic segments: app/[lang]/page.tsx             │  │
  │  │  → Locale detection: Accept-Language header          │  │
  │  │  → Infrastructure! Kiến trúc!                       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  LOCALIZATION (l10n):                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  = DỊCH NỘI DUNG cho từng ngôn ngữ cụ thể!        │  │
  │  │  → "Add to Cart" → "Thêm vào Giỏ hàng"           │  │
  │  │  → Dictionaries: en.json, vi.json, nl.json          │  │
  │  │  → Content! Nội dung!                               │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  NEXT.JS SUPPORT:                                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  ① Routing — sub-path hoặc domain-based            │  │
  │  │  ② Locale detection — Proxy (middleware)            │  │
  │  │  ③ Dictionaries — JSON translation files            │  │
  │  │  ④ Static rendering — generateStaticParams          │  │
  │  │  ⑤ Server Components — translations KHÔNG vào      │  │
  │  │     client bundle!                                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Terminology — Locale Là Gì?

```
  LOCALE — IDENTIFIER FORMAT:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Locale = Language + (optional) Region                   │
  │                                                          │
  │  ┌──────────┬──────────────┬──────────────────────────┐  │
  │  │ Locale   │ Language     │ Region                   │  │
  │  ├──────────┼──────────────┼──────────────────────────┤  │
  │  │ en-US    │ English      │ United States             │  │
  │  │ en-GB    │ English      │ Great Britain             │  │
  │  │ nl-NL    │ Dutch        │ Netherlands               │  │
  │  │ nl       │ Dutch        │ (no specific region)      │  │
  │  │ vi-VN    │ Vietnamese   │ Vietnam                   │  │
  │  │ zh-CN    │ Chinese      │ China (Simplified)        │  │
  │  │ zh-TW    │ Chinese      │ Taiwan (Traditional)      │  │
  │  │ pt-BR    │ Portuguese   │ Brazil                    │  │
  │  │ pt-PT    │ Portuguese   │ Portugal                  │  │
  │  └──────────┴──────────────┴──────────────────────────┘  │
  │                                                          │
  │  FORMAT: [language]-[REGION]                              │
  │  → language = ISO 639-1 (2 letters lowercase)           │
  │  → REGION = ISO 3166-1 (2 letters UPPERCASE)            │
  │  → Region là optional!                                  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Routing — Accept-Language + Proxy!

```
  LOCALE DETECTION FLOW:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Browser                                                   │
  │  ┌──────────────────────┐                                  │
  │  │ User Settings:       │                                  │
  │  │ Preferred: vi-VN     │                                  │
  │  │ Fallback: en-US      │                                  │
  │  └──────────┬───────────┘                                  │
  │             │                                              │
  │             ▼ GET /products                                │
  │  ┌──────────────────────┐                                  │
  │  │ Accept-Language:     │                                  │
  │  │ vi-VN,vi;q=0.9,     │                                  │
  │  │ en-US,en;q=0.5       │                                  │
  │  └──────────┬───────────┘                                  │
  │             │                                              │
  │             ▼                                              │
  │  ┌──────────────────────┐    ┌───────────────────────┐     │
  │  │ Proxy (middleware)   │    │ Supported Locales:    │     │
  │  │ ┌──────────────────┐ │    │ ['en-US','nl-NL','nl']│     │
  │  │ │ 1. Parse headers │←┼────│ Default: 'en-US'     │     │
  │  │ │ 2. Match locale  │ │    └───────────────────────┘     │
  │  │ │ 3. Check pathname│ │                                  │
  │  │ │ 4. Redirect?     │ │                                  │
  │  │ └──────────────────┘ │                                  │
  │  └──────────┬───────────┘                                  │
  │             │                                              │
  │     pathname has locale?                                   │
  │     ├── YES: /en-US/products → pass through!             │
  │     └── NO:  /products → REDIRECT to /en-US/products!    │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  2 STRATEGIES ROUTING:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① SUB-PATH (recommended):                              │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  mysite.com/en/products                             │  │
  │  │  mysite.com/vi/products                             │  │
  │  │  mysite.com/nl/products                             │  │
  │  │                                                    │  │
  │  │  ✅ 1 domain! Dễ setup!                            │  │
  │  │  ✅ app/[lang]/products/page.tsx                   │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  ② DOMAIN-BASED:                                         │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  mysite.com/products      → English                │  │
  │  │  mysite.vn/products       → Vietnamese             │  │
  │  │  mysite.nl/products       → Dutch                  │  │
  │  │                                                    │  │
  │  │  ⚠️ Multiple domains! DNS setup!                   │  │
  │  │  ⚠️ Phức tạp hơn!                                 │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

**Proxy code (middleware):**

```typescript
import { NextResponse } from "next/server";

let locales = ["en-US", "nl-NL", "nl"];

function getLocale(request) {
  /* ... parse Accept-Language ... */
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Pathname đã có locale? → Pass through!
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) return;

  // KHÔNG có locale → Redirect!
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  // /products → /en-US/products
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next).*)"], // Skip _next internal paths
};
```

---

## §4. app/[lang] — Dynamic Locale Segment!

```
  FOLDER STRUCTURE:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  app/                                                    │
  │  └── [lang]/                ← Dynamic locale segment!  │
  │      ├── layout.tsx         ← <html lang={lang}>       │
  │      ├── page.tsx           ← Homepage                 │
  │      ├── products/                                      │
  │      │   └── page.tsx       ← /en/products             │
  │      ├── about/                                        │
  │      │   └── page.tsx       ← /en/about                │
  │      └── dictionaries/                                  │
  │          ├── en.json        ← English translations     │
  │          ├── nl.json        ← Dutch translations       │
  │          └── vi.json        ← Vietnamese translations  │
  │                                                          │
  │  ⚠️ TẤT CẢ files TRONG app/[lang]/!                    │
  │  → lang param truyền vào mọi layout + page!           │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```typescript
// app/[lang]/page.tsx
export default async function Page({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  // /en-US/products → lang = "en-US"
  // /vi-VN/products → lang = "vi-VN"
  return ...
}
```

---

## §5. Localization — Dictionaries Pattern!

```
  DICTIONARIES PATTERN:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  dictionaries/en.json:                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  {                                                   │  │
  │  │    "products": {                                     │  │
  │  │      "cart": "Add to Cart",                          │  │
  │  │      "title": "Our Products"                         │  │
  │  │    }                                                 │  │
  │  │  }                                                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  dictionaries/nl.json:                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  {                                                   │  │
  │  │    "products": {                                     │  │
  │  │      "cart": "Toevoegen aan Winkelwagen",             │  │
  │  │      "title": "Onze Producten"                       │  │
  │  │    }                                                 │  │
  │  │  }                                                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  getDictionary():                                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  import 'server-only'  ← KHÔNG leak ra client!     │  │
  │  │                                                      │  │
  │  │  const dictionaries = {                               │  │
  │  │    en: () => import('./dictionaries/en.json')         │  │
  │  │            .then(m => m.default),                     │  │
  │  │    nl: () => import('./dictionaries/nl.json')         │  │
  │  │            .then(m => m.default),                     │  │
  │  │  }                                                    │  │
  │  │                                                      │  │
  │  │  → Dynamic import! Chỉ load locale CẦN!           │  │
  │  │  → Server Component → KHÔNG vào client bundle!     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  hasLocale() — Type guard:                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  lang = "en"  → hasLocale("en")  → true ✅          │  │
  │  │  lang = "xx"  → hasLocale("xx")  → false → 404!    │  │
  │  │                                                      │  │
  │  │  → Narrowing string → Locale type!                  │  │
  │  │  → Invalid locale → notFound()!                     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Full getDictionary code:**

```typescript
import "server-only";

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  nl: () => import("./dictionaries/nl.json").then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries;

export const getDictionary = async (locale: Locale) => dictionaries[locale]();
```

**Usage in page:**

```typescript
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from './dictionaries'

export default async function Page({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()  // ← 404 for invalid locales!

  const dict = await getDictionary(lang)
  return <button>{dict.products.cart}</button>
  // en → "Add to Cart"
  // nl → "Toevoegen aan Winkelwagen"
}
```

```
  SERVER COMPONENTS — TẠI SAO QUAN TRỌNG?
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Server Components (default in App Router):              │
  │  → getDictionary() chạy trên SERVER!                   │
  │  → JSON translations KHÔNG vào client JS bundle!       │
  │  → Client chỉ nhận HTML đã render!                    │
  │                                                          │
  │  en.json = 50KB, nl.json = 52KB, vi.json = 48KB       │
  │  → Client JS bundle: +0KB! (server-only!)              │
  │  → Performance không ảnh hưởng!                        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Static Rendering — generateStaticParams!

```
  STATIC i18n PAGES:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  generateStaticParams → pre-render cho MỖI locale!     │
  │                                                          │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  export async function generateStaticParams() {    │  │
  │  │    return [                                         │  │
  │  │      { lang: 'en-US' },                             │  │
  │  │      { lang: 'de' },                                │  │
  │  │      { lang: 'vi' },                                │  │
  │  │    ]                                                │  │
  │  │  }                                                  │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  BUILD TIME:                                              │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  /en-US/products → static HTML ✅                   │  │
  │  │  /de/products    → static HTML ✅                   │  │
  │  │  /vi/products    → static HTML ✅                   │  │
  │  │  /en-US/about    → static HTML ✅                   │  │
  │  │  /de/about       → static HTML ✅                   │  │
  │  │  /vi/about       → static HTML ✅                   │  │
  │  │  → Mỗi locale × mỗi page = 1 static file!       │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  → CDN cached! Instant load! SEO friendly!             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```typescript
// app/[lang]/layout.tsx
export async function generateStaticParams() {
  return [{ lang: 'en-US' }, { lang: 'de' }]
}

export default async function RootLayout({
  children, params,
}: LayoutProps<'/[lang]'>) {
  return (
    <html lang={(await params).lang}>
      <body>{children}</body>
    </html>
  )
}
```

---

## §7. Tự Viết — I18nEngine!

```javascript
var I18nEngine = (function () {
  // ═══════════════════════════════════
  // 1. LOCALE MATCHER (replaces negotiator + intl-localematcher)
  // ═══════════════════════════════════
  function parseAcceptLanguage(header) {
    // "en-US,en;q=0.9,vi;q=0.8,nl;q=0.5"
    return header
      .split(",")
      .map(function (part) {
        var pieces = part.trim().split(";");
        var locale = pieces[0].trim();
        var q = 1;
        if (pieces[1]) {
          var match = pieces[1].trim().match(/q=([0-9.]+)/);
          if (match) q = parseFloat(match[1]);
        }
        return { locale: locale, quality: q };
      })
      .sort(function (a, b) {
        return b.quality - a.quality;
      });
  }

  function matchLocale(acceptLangs, supported, defaultLocale) {
    for (var i = 0; i < acceptLangs.length; i++) {
      var requested = acceptLangs[i].locale;
      // Exact match
      if (supported.indexOf(requested) !== -1) {
        return requested;
      }
      // Language-only match (en → en-US)
      var lang = requested.split("-")[0];
      for (var j = 0; j < supported.length; j++) {
        if (supported[j].split("-")[0] === lang) {
          return supported[j];
        }
      }
    }
    return defaultLocale;
  }

  // ═══════════════════════════════════
  // 2. PROXY SIMULATION (middleware)
  // ═══════════════════════════════════
  var supportedLocales = ["en-US", "nl-NL", "vi"];
  var defaultLocale = "en-US";

  function proxy(pathname, acceptLanguage) {
    console.log("  📨 Request: " + pathname);
    console.log("  🌐 Accept-Language: " + acceptLanguage);

    // Check if pathname already has locale
    var hasLocale = false;
    for (var i = 0; i < supportedLocales.length; i++) {
      var loc = supportedLocales[i];
      if (pathname === "/" + loc || pathname.indexOf("/" + loc + "/") === 0) {
        hasLocale = true;
        break;
      }
    }

    if (hasLocale) {
      console.log("  ✅ Locale found! Pass through.");
      return { action: "pass", url: pathname };
    }

    // No locale → detect + redirect!
    var langs = parseAcceptLanguage(acceptLanguage);
    var matched = matchLocale(langs, supportedLocales, defaultLocale);
    var redirectUrl = "/" + matched + pathname;
    console.log("  🔀 Redirect → " + redirectUrl);
    return { action: "redirect", url: redirectUrl };
  }

  // ═══════════════════════════════════
  // 3. DICTIONARY SYSTEM
  // ═══════════════════════════════════
  var dictionaries = {
    "en-US": {
      products: { cart: "Add to Cart", title: "Our Products" },
      common: { welcome: "Welcome", goodbye: "Goodbye" },
    },
    "nl-NL": {
      products: { cart: "Toevoegen aan Winkelwagen", title: "Onze Producten" },
      common: { welcome: "Welkom", goodbye: "Tot ziens" },
    },
    vi: {
      products: { cart: "Thêm vào Giỏ hàng", title: "Sản phẩm của chúng tôi" },
      common: { welcome: "Xin chào", goodbye: "Tạm biệt" },
    },
  };

  function hasLocale(locale) {
    return locale in dictionaries;
  }

  function getDictionary(locale) {
    if (!hasLocale(locale)) {
      console.log("  ❌ 404! Unknown locale: " + locale);
      return null;
    }
    console.log("  📖 Loaded dictionary for: " + locale);
    return dictionaries[locale];
  }

  // ═══════════════════════════════════
  // 4. PAGE RENDERER
  // ═══════════════════════════════════
  function renderPage(pathname) {
    // Extract lang from /[lang]/rest
    var parts = pathname.split("/").filter(Boolean);
    var lang = parts[0] || defaultLocale;
    var route = "/" + parts.slice(1).join("/");

    var dict = getDictionary(lang);
    if (!dict) return "<h1>404 Not Found</h1>";

    console.log("  🖥️ Rendering " + route + " in " + lang);
    console.log('  📝 cart = "' + dict.products.cart + '"');
    console.log('  📝 welcome = "' + dict.common.welcome + '"');
    return "<button>" + dict.products.cart + "</button>";
  }

  // ═══════════════════════════════════
  // 5. STATIC PARAMS GENERATOR
  // ═══════════════════════════════════
  function generateStaticParams() {
    var params = [];
    for (var locale in dictionaries) {
      params.push({ lang: locale });
    }
    console.log("  📦 Static params: " + JSON.stringify(params));
    return params;
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  I18N ENGINE DEMO                   ║");
    console.log("╚════════════════════════════════════╝");

    // Scenario 1: Accept-Language parsing
    console.log("\n── Scenario 1: Parse Accept-Language ──");
    var langs = parseAcceptLanguage("vi-VN,vi;q=0.9,en-US,en;q=0.5");
    console.log(
      "  Parsed: " +
        JSON.stringify(
          langs.map(function (l) {
            return l.locale + "(" + l.quality + ")";
          }),
        ),
    );
    var best = matchLocale(langs, supportedLocales, defaultLocale);
    console.log("  Best match: " + best);

    // Scenario 2: Proxy redirects
    console.log("\n── Scenario 2: Proxy Redirect ──");
    proxy("/products", "en-US,en;q=0.5");
    proxy("/en-US/products", "en-US,en;q=0.5");
    proxy("/about", "nl;q=0.9,en;q=0.5");

    // Scenario 3: Dictionary loading
    console.log("\n── Scenario 3: Dictionaries ──");
    renderPage("/en-US/products");
    renderPage("/vi/products");
    renderPage("/nl-NL/products");
    renderPage("/xx/products"); // 404!

    // Scenario 4: Static generation
    console.log("\n── Scenario 4: generateStaticParams ──");
    generateStaticParams();
  }

  return { demo: demo };
})();
// Chạy: I18nEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: Sub-path routing cho i18n hoạt động thế nào với Proxy?

<details><summary>Đáp án</summary>

**Flow**:

1. User request `/products` (không có locale)
2. **Proxy** (middleware) intercept trước khi đến page
3. Parse `Accept-Language` header từ browser → xác định locale ưu tiên
4. Check pathname: `/products` → **chưa có locale**!
5. Detect best locale: dựa vào Accept-Language → match với supported locales
6. **Redirect** → `/en-US/products`
7. Request mới `/en-US/products` → Proxy kiểm tra → **đã có locale** → pass through!
8. Next.js router: `app/[lang]/products/page.tsx` → `lang = "en-US"`

**matcher config**: `'/((?!_next).*)'` — skip `_next` internal paths (static assets, chunks) để không redirect chúng.

</details>

---

**Câu 2**: Tại sao dùng `import 'server-only'` trong getDictionary?

<details><summary>Đáp án</summary>

`import 'server-only'` đảm bảo file **KHÔNG BAO GIỜ** được import trong Client Components.

**Tại sao quan trọng cho i18n?**

- Translation dictionaries (JSON files) có thể **rất lớn** (50KB+ mỗi locale)
- Nếu import trong Client Component → JSON vào **client JS bundle** → tăng bundle size → chậm!
- Server Components chạy trên server → JSON load trên server → client chỉ nhận **rendered HTML**
- `server-only` là **build-time guard**: nếu ai vô tình import trong Client Component → **build error**!

Không có `server-only`: code vẫn chạy, nhưng không có protection — developer có thể vô tình import getDictionary trong Client Component → leak translations vào client bundle mà không biết.

</details>

---

**Câu 3**: hasLocale() dùng để làm gì? Type guard hoạt động thế nào?

<details><summary>Đáp án</summary>

`hasLocale(locale: string): locale is Locale` là **TypeScript type guard**.

**Mục đích kép**:

1. **Runtime**: Kiểm tra locale có hợp lệ không → nếu không → `notFound()` → 404 page
2. **Type narrowing**: TypeScript hiểu rằng SAU `hasLocale(lang)` → `lang` CHẮC CHẮN là `Locale` type (union của supported locales) → gọi `getDictionary(lang)` không cần cast

**Nếu không có hasLocale**:

- `lang = "xx"` → `getDictionary("xx")` → runtime error!
- TypeScript: `lang` vẫn là `string` → `getDictionary(lang)` → type error!

**Với hasLocale**:

```typescript
if (!hasLocale(lang)) notFound(); // lang: string
// Sau dòng này: lang: Locale (narrowed!)
const dict = await getDictionary(lang); // ✅ type-safe!
```

</details>

---

**Câu 4**: generateStaticParams cho i18n tạo bao nhiêu pages?

<details><summary>Đáp án</summary>

**Công thức**: `số locales × số pages = tổng static pages`

Ví dụ:

- 3 locales: `['en-US', 'de', 'vi']`
- 5 pages: home, products, about, contact, blog
- **Total**: 3 × 5 = **15 static HTML files**!

```
/en-US/          /de/          /vi/
/en-US/products  /de/products  /vi/products
/en-US/about     /de/about     /vi/about
/en-US/contact   /de/contact   /vi/contact
/en-US/blog      /de/blog      /vi/blog
```

**Đặt trong root layout** → áp dụng cho TẤT CẢ pages bên dưới. Không cần khai báo lại trong mỗi page.

**Lợi ích**: CDN cached, instant load, SEO friendly (mỗi locale có URL riêng → Google index riêng).

</details>
