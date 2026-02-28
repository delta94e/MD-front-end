# Next.js Content Security Policy (CSP) — Deep Dive!

> **Chủ đề**: Content Security Policy — Bảo mật ứng dụng Next.js!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/content-security-policy
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. CSP Là Gì? — Tổng Quan Bảo Mật](#1)
2. [§2. Nonces — Chìa Khóa Bảo Mật](#2)
3. [§3. Proxy — Tạo Nonce Tự Động](#3)
4. [§4. Nonces Hoạt Động Trong Next.js](#4)
5. [§5. Static vs Dynamic Rendering + CSP](#5)
6. [§6. Without Nonces — CSP Tĩnh](#6)
7. [§7. SRI — Subresource Integrity (Experimental)](#7)
8. [§8. Dev vs Production](#8)
9. [§9. Troubleshooting & Third-party Scripts](#9)
10. [§10. Tự Viết — CSPEngine](#10)
11. [§11. Câu Hỏi Luyện Tập](#11)

---

## §1. CSP Là Gì? — Tổng Quan Bảo Mật!

```
  CONTENT SECURITY POLICY — TẠI SAO CẦN?
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  KHÔNG CÓ CSP:                                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  Browser tải HTML                                    │  │
  │  │    ↓                                                 │  │
  │  │  <script>alert('XSS!')</script>  ← CHẠY!           │  │
  │  │  <script src="evil.js"></script>  ← CHẠY!           │  │
  │  │  <img src="x" onerror="steal()">  ← CHẠY!          │  │
  │  │                                                      │  │
  │  │  → Browser KHÔNG BIẾT script nào hợp lệ!           │  │
  │  │  → Attacker inject code → CHẠY TẤT CẢ!            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CÓ CSP:                                                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  Content-Security-Policy header:                     │  │
  │  │  "script-src 'self' 'nonce-abc123'"                  │  │
  │  │                                                      │  │
  │  │  <script nonce="abc123">ok()</script>  ← CHẠY!     │  │
  │  │  <script>alert('XSS!')</script>  ← BLOCKED!        │  │
  │  │  <script src="evil.js"></script>  ← BLOCKED!        │  │
  │  │                                                      │  │
  │  │  → Browser CHỈ chạy scripts có nonce đúng!         │  │
  │  │  → Attacker KHÔNG biết nonce → BLOCKED!             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CSP BẢO VỆ KHỎI:                                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Cross-Site Scripting (XSS)  → block inline script │  │
  │  │ ② Clickjacking               → frame-ancestors      │  │
  │  │ ③ Code injection             → restrict sources     │  │
  │  │ ④ Data exfiltration          → connect-src           │  │
  │  │ ⑤ Mixed content              → upgrade-insecure     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CSP DIRECTIVES — CÁC LỆNH:                               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Directive         │ Kiểm soát              │ Ví dụ  │  │
  │  ├───────────────────┼────────────────────────┼────────┤  │
  │  │ default-src       │ Fallback cho TẤT CẢ   │ 'self' │  │
  │  │ script-src        │ JavaScript             │ nonce  │  │
  │  │ style-src         │ CSS                    │ nonce  │  │
  │  │ img-src           │ Hình ảnh               │ data:  │  │
  │  │ font-src          │ Fonts                  │ 'self' │  │
  │  │ connect-src       │ fetch/XHR/WebSocket    │ API    │  │
  │  │ object-src        │ <object>,<embed>       │ 'none' │  │
  │  │ base-uri          │ <base> tag             │ 'self' │  │
  │  │ form-action       │ Form submissions       │ 'self' │  │
  │  │ frame-ancestors   │ Ai embed được trang?  │ 'none' │  │
  │  └───────────────────┴────────────────────────┴────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Nonces — Chìa Khóa Bảo Mật!

```
  NONCE — SỐ DÙNG 1 LẦN:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  NONCE = Number used ONCE (số dùng 1 lần!)                │
  │  → Random string, unique MỖI request!                    │
  │  → Cho phép scripts CỤ THỂ chạy, block phần còn lại!   │
  │                                                            │
  │  TẠI SAO DÙNG NONCE?                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  CSP block TẤT CẢ inline scripts theo mặc định!    │  │
  │  │  Nhưng app CẦN inline scripts (React hydration...)  │  │
  │  │                                                      │  │
  │  │  VẤN ĐỀ: Dùng 'unsafe-inline' = mất bảo mật!     │  │
  │  │  GIẢI PHÁP: Dùng NONCE!                             │  │
  │  │                                                      │  │
  │  │  Server tạo nonce random → gắn vào script tags      │  │
  │  │  → CSP header chứa nonce → Browser match nonce      │  │
  │  │  → Match = CHẠY! Không match = BLOCK!               │  │
  │  │                                                      │  │
  │  │  Attacker KHÔNG BIẾT nonce (random mỗi request!)    │  │
  │  │  → Inject script KHÔNG CÓ nonce → BLOCKED!         │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FLOW:                                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Request → Server tạo nonce "abc123"                  │  │
  │  │    ↓                                                 │  │
  │  │ CSP: script-src 'nonce-abc123' 'strict-dynamic'      │  │
  │  │    ↓                                                 │  │
  │  │ HTML: <script nonce="abc123">React()</script>        │  │
  │  │    ↓                                                 │  │
  │  │ Browser: nonce match CSP? → YES → CHẠY!            │  │
  │  │    ↓                                                 │  │
  │  │ Next request → Server tạo nonce MỚI "xyz789"        │  │
  │  │ → "abc123" KHÔNG HỢP LỆ nữa!                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. Proxy — Tạo Nonce Tự Động!

```
  PROXY → CSP + NONCE FLOW:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Request                                                   │
  │    │                                                       │
  │    ▼                                                       │
  │  proxy.ts (TRƯỚC page render!)                             │
  │    │                                                       │
  │    ├── ① Tạo nonce: crypto.randomUUID() → base64         │
  │    │                                                       │
  │    ├── ② Build CSP header:                                │
  │    │   "default-src 'self';                                │
  │    │    script-src 'self' 'nonce-{nonce}' 'strict-dynamic';│
  │    │    style-src 'self' 'nonce-{nonce}';                  │
  │    │    img-src 'self' blob: data:;                        │
  │    │    font-src 'self';                                   │
  │    │    object-src 'none';                                 │
  │    │    base-uri 'self';                                   │
  │    │    form-action 'self';                                │
  │    │    frame-ancestors 'none';                            │
  │    │    upgrade-insecure-requests;"                        │
  │    │                                                       │
  │    ├── ③ Set request header: x-nonce = nonce              │
  │    │   (cho Server Components đọc!)                       │
  │    │                                                       │
  │    ├── ④ Set request header: Content-Security-Policy      │
  │    │   (cho Next.js tự gắn nonce vào scripts!)           │
  │    │                                                       │
  │    └── ⑤ Set response header: Content-Security-Policy     │
  │        (cho Browser enforce!)                              │
  │    │                                                       │
  │    ▼                                                       │
  │  Next.js renders page (với nonce tự động gắn!)            │
  │    │                                                       │
  │    ▼                                                       │
  │  Response → Browser (CSP enforced!)                        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Code proxy.ts đầy đủ:**

```typescript
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;
  const cspValue = cspHeader.replace(/\s{2,}/g, " ").trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspValue);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", cspValue);

  return response;
}

// Matcher: bỏ qua static assets + prefetch!
export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
```

```
  GIẢI THÍCH MATCHER:
  ┌──────────────────────────────────────────────────────────┐
  │ KHÔNG chạy proxy cho:                                    │
  │ → /api/*           (API routes không cần CSP header)    │
  │ → /_next/static/*  (static JS/CSS đã build)            │
  │ → /_next/image/*   (optimized images)                   │
  │ → /favicon.ico     (favicon)                             │
  │ → Prefetch requests (next/link prefetch)                 │
  │                                                          │
  │ missing conditions:                                       │
  │ → next-router-prefetch header = Link prefetch            │
  │ → purpose: prefetch = browser prefetch                   │
  │ → Những request này KHÔNG CẦN fresh nonce!              │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Nonces Hoạt Động Trong Next.js!

```
  NEXT.JS TỰ ĐỘNG GẮN NONCE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  4 BƯỚC TỰ ĐỘNG:                                          │
  │                                                            │
  │  ① Proxy tạo nonce → set vào headers                     │
  │    │                                                       │
  │    ▼                                                       │
  │  ② Next.js parse CSP header → extract nonce              │
  │    (tìm pattern 'nonce-{value}')                          │
  │    │                                                       │
  │    ▼                                                       │
  │  ③ Next.js TỰ ĐỘNG gắn nonce vào:                        │
  │    ┌──────────────────────────────────────────────────┐    │
  │    │ ✅ Framework scripts (React, Next.js runtime)    │    │
  │    │ ✅ Page-specific JS bundles                       │    │
  │    │ ✅ Inline styles/scripts do Next.js tạo          │    │
  │    │ ✅ <Script> components có prop nonce              │    │
  │    └──────────────────────────────────────────────────┘    │
  │    │                                                       │
  │    ▼                                                       │
  │  ④ BẠN KHÔNG CẦN tự thêm nonce vào mỗi tag!            │
  │     (Next.js làm tự động!)                                │
  │                                                            │
  │  CHỈ CẦN THỦ CÔNG KHI:                                    │
  │  → Third-party scripts (Google Tag Manager, Analytics)    │
  │  → Custom <Script> components                              │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Đọc nonce trong Server Component:**

```typescript
import { headers } from 'next/headers'
import Script from 'next/script'

export default async function Page() {
  const nonce = (await headers()).get('x-nonce')

  return (
    <Script
      src="https://www.googletagmanager.com/gtag/js"
      strategy="afterInteractive"
      nonce={nonce}
    />
  )
}
```

**Force dynamic rendering (BẮT BUỘC khi dùng nonce!):**

```typescript
import { connection } from "next/server";

export default async function Page() {
  await connection(); // Force dynamic!
  // Page content...
}
```

---

## §5. Static vs Dynamic Rendering + CSP!

```
  NONCE → BẮT BUỘC DYNAMIC RENDERING:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  TẠI SAO? Nonce PHẢI unique mỗi request!                 │
  │  → Static page = build 1 lần = 1 nonce = KHÔNG AN TOÀN! │
  │  → Dynamic page = render mỗi request = nonce MỚI!        │
  │                                                            │
  │  HỆ QUẢ:                                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ❌ Static optimization      → DISABLED!              │  │
  │  │ ❌ ISR (Incremental Static) → DISABLED!              │  │
  │  │ ❌ CDN caching (mặc định)   → DISABLED!              │  │
  │  │ ❌ PPR (Partial Prerender)  → KHÔNG tương thích!     │  │
  │  │                                                      │  │
  │  │ ✅ Mỗi request = fresh page + fresh nonce!           │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  PERFORMANCE IMPACT:                                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ → Chậm hơn: mỗi request = server render!           │  │
  │  │ → Server load tăng: SSR mỗi lần!                   │  │
  │  │ → Không CDN: dynamic = no edge caching!             │  │
  │  │ → Chi phí hosting tăng!                              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  KHI NÀO DÙNG NONCE?                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ✅ Strict security (cấm 'unsafe-inline')            │  │
  │  │ ✅ Sensitive data (banking, medical...)              │  │
  │  │ ✅ Allow inline scripts cụ thể, block phần còn lại  │  │
  │  │ ✅ Compliance requirements (PCI-DSS, HIPAA...)       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  SO SÁNH 3 APPROACH:                                       │
  │  ┌────────────┬──────────┬───────────┬──────────────────┐  │
  │  │ Approach   │ Security │ Rendering │ Performance      │  │
  │  ├────────────┼──────────┼───────────┼──────────────────┤  │
  │  │ Nonce      │ ⭐⭐⭐   │ Dynamic   │ Slower (SSR)     │  │
  │  │ SRI        │ ⭐⭐     │ Static!   │ Fast (cached)    │  │
  │  │ No nonce   │ ⭐       │ Static    │ Fastest          │  │
  │  └────────────┴──────────┴───────────┴──────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. Without Nonces — CSP Tĩnh!

```
  CSP KHÔNG CẦN NONCE:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ Nếu app KHÔNG cần bảo mật strict → dùng CSP tĩnh!     │
  │ → Config trong next.config.js (KHÔNG cần proxy!)       │
  │ → Dùng 'unsafe-inline' thay vì nonce!                  │
  │ → Giữ static rendering + CDN caching!                  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```javascript
// next.config.js
const isDev = process.env.NODE_ENV === "development";
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;
module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },
};
```

---

## §7. SRI — Subresource Integrity (Experimental)!

```
  SRI — ALTERNATIVE TO NONCES:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  SRI = Hash-based verification (thay vì nonce!)            │
  │  → Build time: hash TẤT CẢ JS files (sha256/384/512)    │
  │  → HTML: <script integrity="sha256-abc123..." src="...">  │
  │  → Browser: tải file → hash → so sánh → match = CHẠY!  │
  │                                                            │
  │  SO SÁNH NONCE vs SRI:                                     │
  │  ┌─────────────────┬──────────────┬──────────────────┐     │
  │  │                 │ Nonce        │ SRI              │     │
  │  ├─────────────────┼──────────────┼──────────────────┤     │
  │  │ Tạo khi nào?   │ Runtime      │ Build time       │     │
  │  │ Rendering       │ Dynamic!     │ Static OK!       │     │
  │  │ CDN caching     │ ❌           │ ✅               │     │
  │  │ Performance     │ Chậm (SSR)   │ Nhanh (cached)   │     │
  │  │ Inline scripts  │ ✅ Hỗ trợ   │ ❌ Không         │     │
  │  │ Status          │ Stable       │ Experimental!    │     │
  │  │ Bundler         │ Webpack+Turbo│ Webpack only!    │     │
  │  │ Router          │ App + Pages  │ App only!        │     │
  │  └─────────────────┴──────────────┴──────────────────┘     │
  │                                                            │
  │  LIMITATIONS:                                              │
  │  → Experimental — có thể thay đổi hoặc bị loại bỏ!     │
  │  → Webpack only — KHÔNG hỗ trợ Turbopack!                │
  │  → App Router only — KHÔNG hỗ trợ Pages Router!          │
  │  → Build-time only — KHÔNG xử lý dynamic scripts!        │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Enable SRI:**

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    sri: {
      algorithm: "sha256", // hoặc 'sha384' hoặc 'sha512'
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'; style-src 'self';",
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
```

---

## §8. Dev vs Production!

```
  DEV vs PRODUCTION CSP:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  DEVELOPMENT:                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ PHẢI thêm 'unsafe-eval':                             │  │
  │  │ → React dùng eval() cho debug info!                  │  │
  │  │ → Reconstruct server-side error stacks!              │  │
  │  │ → Show errors originated on server!                  │  │
  │  │                                                      │  │
  │  │ CÓ THỂ thêm 'unsafe-inline' cho style-src:          │  │
  │  │ → Hot Module Replacement inject inline styles!       │  │
  │  │                                                      │  │
  │  │ ⚠️ KHÔNG bao giờ dùng unsafe-eval ở PRODUCTION!    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  PRODUCTION:                                               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Checklist:                                            │  │
  │  │ ☐ Proxy chạy trên TẤT CẢ routes cần CSP            │  │
  │  │ ☐ CSP cho phép Next.js static assets                 │  │
  │  │ ☐ Third-party domains được whitelist                  │  │
  │  │ ☐ KHÔNG có unsafe-eval!                              │  │
  │  │ ☐ KHÔNG có unsafe-inline (nếu dùng nonce)!          │  │
  │  │ ☐ Test CSP violations trong Console!                 │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §9. Troubleshooting & Third-party Scripts!

**Google Tag Manager với nonce:**

```typescript
import { GoogleTagManager } from '@next/third-parties/google'
import { headers } from 'next/headers'

export default async function RootLayout({
  children,
}: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce')

  return (
    <html lang="en">
      <body>
        {children}
        <GoogleTagManager gtmId="GTM-XYZ" nonce={nonce} />
      </body>
    </html>
  )
}
```

```
  COMMON CSP VIOLATIONS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ ① Inline styles bị block:                               │
  │   → Dùng CSS-in-JS libraries hỗ trợ nonce!            │
  │   → Hoặc move styles ra external files!                │
  │                                                          │
  │ ② Dynamic imports bị block:                             │
  │   → Kiểm tra script-src cho phép dynamic!              │
  │   → 'strict-dynamic' giúp propagate trust!             │
  │                                                          │
  │ ③ WebAssembly bị block:                                 │
  │   → Thêm 'wasm-unsafe-eval' vào script-src!           │
  │                                                          │
  │ ④ Service Workers bị block:                             │
  │   → Thêm policies cho worker scripts!                  │
  │                                                          │
  │ ⑤ Third-party scripts:                                  │
  │   → Whitelist domains trong script-src!                │
  │   → Whitelist connect-src cho analytics!               │
  │   → Whitelist img-src cho tracking pixels!             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §10. Tự Viết — CSPEngine!

```javascript
var CSPEngine = (function () {
  // ═══════════════════════════════════
  // 1. NONCE GENERATOR
  // ═══════════════════════════════════
  function generateNonce() {
    var chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var nonce = "";
    for (var i = 0; i < 24; i++) {
      nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return btoa(nonce); // base64
  }

  // ═══════════════════════════════════
  // 2. CSP HEADER BUILDER
  // ═══════════════════════════════════
  function buildCSP(nonce, options) {
    var isDev = options && options.isDev;
    var directives = {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'nonce-" + nonce + "'", "'strict-dynamic'"],
      "style-src": ["'self'", "'nonce-" + nonce + "'"],
      "img-src": ["'self'", "blob:", "data:"],
      "font-src": ["'self'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
    };
    if (isDev) {
      directives["script-src"].push("'unsafe-eval'");
    }
    var parts = [];
    for (var key in directives) {
      parts.push(key + " " + directives[key].join(" "));
    }
    return parts.join("; ") + ";";
  }

  // ═══════════════════════════════════
  // 3. SCRIPT VALIDATOR
  // ═══════════════════════════════════
  function validateScript(script, cspHeader) {
    var nonceMatch = cspHeader.match(/'nonce-([^']+)'/);
    var allowedNonce = nonceMatch ? nonceMatch[1] : null;
    if (script.nonce && script.nonce === allowedNonce) {
      return { allowed: true, reason: "Nonce matched!" };
    }
    if (
      script.src &&
      cspHeader.indexOf("'self'") !== -1 &&
      script.src.indexOf("/") === 0
    ) {
      return { allowed: true, reason: "Self-origin script" };
    }
    if (!script.nonce && !script.src) {
      if (cspHeader.indexOf("'unsafe-inline'") !== -1) {
        return { allowed: true, reason: "unsafe-inline allowed" };
      }
      return {
        allowed: false,
        reason: "Inline script without nonce — BLOCKED!",
      };
    }
    return { allowed: false, reason: "No matching policy — BLOCKED!" };
  }

  // ═══════════════════════════════════
  // 4. SRI HASH GENERATOR (simulated)
  // ═══════════════════════════════════
  function generateSRI(content, algorithm) {
    var hash = 0;
    for (var i = 0; i < content.length; i++) {
      var chr = content.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return (algorithm || "sha256") + "-" + Math.abs(hash).toString(36);
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  CSP ENGINE DEMO                    ║");
    console.log("╚════════════════════════════════════╝");

    var nonce = generateNonce();
    console.log("\n── Nonce: " + nonce);

    var csp = buildCSP(nonce, { isDev: false });
    console.log("\n── CSP Header:\n  " + csp);

    console.log("\n── Validate Scripts:");
    var scripts = [
      { desc: "React runtime (nonce)", nonce: nonce },
      {
        desc: "GTM (nonce)",
        nonce: nonce,
        src: "https://www.googletagmanager.com/gtag/js",
      },
      { desc: "XSS attack (no nonce)" },
      { desc: "Self script", src: "/bundle.js" },
      { desc: "Evil script", src: "https://evil.com/steal.js" },
    ];
    for (var i = 0; i < scripts.length; i++) {
      var result = validateScript(scripts[i], csp);
      console.log(
        "  " +
          (result.allowed ? "✅" : "❌") +
          " " +
          scripts[i].desc +
          ": " +
          result.reason,
      );
    }

    console.log("\n── SRI Demo:");
    var content = 'console.log("hello")';
    var sri = generateSRI(content, "sha256");
    console.log("  Content: " + content);
    console.log("  Integrity: " + sri);
  }

  return { demo: demo };
})();
// Chạy: CSPEngine.demo();
```

---

## §11. Câu Hỏi Luyện Tập!

**Câu 1**: Nonce là gì? Tại sao phải unique mỗi request?

<details><summary>Đáp án</summary>

**Nonce** = Number used Once = chuỗi random dùng 1 lần. Được tạo bằng `crypto.randomUUID()` → base64.

Phải unique mỗi request vì: Nếu nonce giống nhau giữa các requests, attacker có thể **sniff** nonce từ response trước và dùng lại cho request sau. Random + unique = attacker **KHÔNG THỂ đoán** → script inject KHÔNG CÓ nonce đúng → **BLOCKED**.

</details>

---

**Câu 2**: Tại sao dùng nonce BẮT BUỘC dynamic rendering?

<details><summary>Đáp án</summary>

Static pages được build 1 lần tại build time, khi **KHÔNG CÓ request/response headers**. Nonce cần được:

1. **Tạo** mỗi request (unique!)
2. Gắn vào **CSP header** (response)
3. Gắn vào **script tags** (HTML)

Static page = 1 nonce cố định cho mọi user = **KHÔNG AN TOÀN**. Nên phải dynamic render → mỗi request tạo fresh page + fresh nonce.

Hệ quả: ISR disabled, CDN caching disabled, PPR incompatible, server load tăng.

</details>

---

**Câu 3**: SRI khác gì với Nonce? Khi nào dùng SRI?

<details><summary>Đáp án</summary>

|                 | Nonce                     | SRI                               |
| --------------- | ------------------------- | --------------------------------- |
| **Cơ chế**      | Random token mỗi request  | Hash nội dung file tại build time |
| **Rendering**   | Dynamic (SSR mỗi request) | Static (build 1 lần, cache CDN)   |
| **Bảo vệ**      | Inline scripts + external | External scripts only             |
| **Performance** | Chậm hơn                  | Nhanh hơn                         |
| **Status**      | Stable                    | **Experimental**                  |

Dùng SRI khi: Cần CSP nhưng muốn giữ **static rendering + CDN caching + performance**. Không xử lý được dynamic/inline scripts.

</details>

---

**Câu 4**: 'strict-dynamic' trong CSP có tác dụng gì?

<details><summary>Đáp án</summary>

`'strict-dynamic'` cho phép **trust propagation**: khi script có nonce đúng được tin tưởng, tất cả scripts mà script đó dynamically load (createElement, import) cũng được **tự động tin tưởng** mà không cần nonce riêng.

Ví dụ: React runtime có nonce → React dynamically load page bundles → page bundles tự động được allow nhờ `strict-dynamic`.

Không có `strict-dynamic`: phải thêm nonce cho **MỖI** script file Next.js tạo ra → không thực tế!

</details>
