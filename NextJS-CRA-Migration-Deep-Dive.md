# Next.js CRA Migration — Deep Dive!

> **Chủ đề**: Di Chuyển Từ Create React App Sang Next.js!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/migrating/from-create-react-app
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — CRA vs Next.js](#1)
2. [§2. Why Switch — 7 Lý Do](#2)
3. [§3. Steps 1-4: Install, Config, Layout, Metadata](#3)
4. [§4. Steps 5-7: Styles, Entry Page, ClientOnly](#4)
5. [§5. Steps 8-11: Images, Env, Scripts, Clean Up](#5)
6. [§6. Additional — basePath, Proxy, Webpack, TypeScript](#6)
7. [§7. Bundler + Next Steps](#7)
8. [§8. Tự Viết — CraMigrationEngine](#8)
9. [§9. Câu Hỏi Luyện Tập](#9)

---

## §1. Tổng Quan — CRA vs Next.js!

```
  CRA vs NEXT.JS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  CREATE REACT APP (CRA):                                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  public/                                             │  │
  │  │  ├── index.html       ← Entry HTML!                │  │
  │  │  ├── favicon.ico                                    │  │
  │  │  └── manifest.json                                  │  │
  │  │  src/                                                │  │
  │  │  ├── index.tsx        ← Entry JS! (ReactDOM.render)│  │
  │  │  ├── App.tsx          ← Root component             │  │
  │  │  ├── App.css                                        │  │
  │  │  └── reportWebVitals.ts                             │  │
  │  │  package.json                                        │  │
  │  │                                                      │  │
  │  │  Đặc điểm:                                          │  │
  │  │  → Client-Side Rendering (CSR) ONLY!               │  │
  │  │  → react-scripts (webpack + babel + eslint)        │  │
  │  │  → 1 HTML file, 1 JS bundle lớn!                  │  │
  │  │  → KHÔNG có SSR, SSG, ISR!                        │  │
  │  │  → KHÔNG có file-based routing!                   │  │
  │  │  → REACT_APP_ prefix cho env vars                 │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  NEXT.JS:                                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  app/                                                │  │
  │  │  ├── layout.tsx       ← Root layout (thay HTML!)   │  │
  │  │  ├── page.tsx         ← Entry page                 │  │
  │  │  ├── [[...slug]]/     ← Catch-all (SPA mode!)     │  │
  │  │  │   ├── page.tsx                                   │  │
  │  │  │   └── client.tsx   ← 'use client' wrapper      │  │
  │  │  next.config.ts                                      │  │
  │  │  package.json                                        │  │
  │  │                                                      │  │
  │  │  Đặc điểm:                                          │  │
  │  │  → SSR + SSG + ISR + CSR!                          │  │
  │  │  → Auto code splitting!                            │  │
  │  │  → Server Components (default!)                    │  │
  │  │  → File-based routing!                             │  │
  │  │  → Built-in Image/Font/Script optimization!       │  │
  │  │  → NEXT_PUBLIC_ prefix cho env vars               │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CHIẾN LƯỢC: Migrate INCREMENTAL!                        │
  │  → Bước 1: Chạy CRA app AS-IS trên Next.js (SPA mode) │  │
  │  → Bước 2: Dần dần adopt Next.js features!            │  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Why Switch — 7 Lý Do!

```
  7 LÝ DO CHUYỂN TỪ CRA SANG NEXT.JS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① SLOW INITIAL LOAD (CSR problem):                        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ CRA Flow:                                            │  │
  │  │ Browser → Download HTML (gần rỗng!)               │  │
  │  │ Browser → Download JS bundle (TOÀN BỘ app!)      │  │
  │  │ Browser → Execute JS                               │  │
  │  │ Browser → Fetch data từ API                       │  │
  │  │ Browser → Render UI                                │  │
  │  │ ────────── 3-5 giây trắng! 😱 ──────────        │  │
  │  │                                                      │  │
  │  │ Next.js Flow:                                        │  │
  │  │ Server → Render HTML (có content sẵn!)            │  │
  │  │ Browser → Hiển thị NGAY!                          │  │
  │  │ Browser → Hydrate (thêm interactivity)            │  │
  │  │ ────────── < 1 giây hiển thị! ⚡ ──────────      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② NO AUTO CODE SPLITTING:                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ CRA:     1 bundle.js = TOÀN BỘ app! (2MB+)        │  │
  │  │ Next.js: Mỗi page = chunk riêng! (50-200KB)       │  │
  │  │          + Automatic tree-shaking!                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ NETWORK WATERFALLS:                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ CRA (sequential):                                    │  │
  │  │ Parent mount → fetch A ──────┐                     │  │
  │  │                               ↓                     │  │
  │  │ Child mount  → fetch B ──────┐  ← PHẢI đợi A!   │  │
  │  │                               ↓                     │  │
  │  │ Grandchild   → fetch C ──────   ← PHẢI đợi B!   │  │
  │  │                                                      │  │
  │  │ Next.js (parallel on server):                        │  │
  │  │ Server: fetch A, B, C đồng thời! → HTML          │  │
  │  │         → Không có waterfall!                       │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ④ STREAMING + SUSPENSE:                                   │
  │  → Load UI theo thứ tự ưu tiên!                         │
  │  → Không layout shifts! Faster perceived load!            │
  │                                                            │
  │  ⑤ DATA FETCHING STRATEGY:                                │
  │  → SSG (build-time) cho static content (blog)             │
  │  → SSR (request-time) cho dynamic content (dashboard)     │
  │  → ISR (revalidate) cho hybrid (e-commerce)               │
  │  → CHỌN per-page hoặc per-component!                     │
  │                                                            │
  │  ⑥ PROXY (Server-side logic):                             │
  │  → Redirect unauthenticated users TRƯỚC khi render!      │
  │  → A/B testing, i18n, experiment!                         │
  │                                                            │
  │  ⑦ BUILT-IN OPTIMIZATIONS:                                │
  │  → <Image> = auto resize, lazy load, WebP!               │
  │  → next/font = no layout shift, privacy!                  │
  │  → <Script> = loading strategy control!                   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. Steps 1-4: Install, Config, Layout, Metadata!

```
  STEP 1: INSTALL NEXT.JS
  ┌──────────────────────────────────────────────────────────┐
  │  pnpm add next@latest                                    │
  │  → Thêm vào project HIỆN TẠI! Không tạo project mới! │
  └──────────────────────────────────────────────────────────┘

  STEP 2: NEXT.CONFIG.TS
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // next.config.ts                                       │
  │  import type { NextConfig } from 'next'                  │
  │  const nextConfig: NextConfig = {                        │
  │    output: 'export',  // SPA mode! (static export)      │
  │    distDir: 'build',  // Giống CRA output dir!          │
  │  }                                                       │
  │  export default nextConfig                               │
  │                                                          │
  │  ⚠️ output: 'export' = KHÔNG có SSR, API routes!       │
  │  → Xóa dòng này SAU khi muốn dùng server features!    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  STEP 3: ROOT LAYOUT (thay public/index.html!)
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  CRA:          public/index.html                            │
  │  Next.js:      app/layout.tsx                               │
  │                                                            │
  │  CHUYỂN ĐỔI:                                               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ public/index.html:                                   │  │
  │  │ <html lang="en">                                     │  │
  │  │   <head>                                             │  │
  │  │     <meta charset="UTF-8" />                         │  │
  │  │     <link rel="icon" href="favicon.ico" />           │  │
  │  │     <meta name="viewport" content="..." />           │  │
  │  │     <title>React App</title>                         │  │
  │  │   </head>                                            │  │
  │  │   <body>                                             │  │
  │  │     <div id="root"></div>                             │  │
  │  │   </body>                                            │  │
  │  │ </html>                                              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                         ↓                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ app/layout.tsx:                                      │  │
  │  │ export default function RootLayout({                 │  │
  │  │   children                                           │  │
  │  │ }: { children: React.ReactNode }) {                  │  │
  │  │   return (                                           │  │
  │  │     <html lang="en">                                 │  │
  │  │       <body>                                         │  │
  │  │         <div id="root">{children}</div>               │  │
  │  │       </body>                                        │  │
  │  │     </html>                                          │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  KEY: <div id="root"></div> → <div id="root">{children} │
  │       </div>                                               │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  STEP 4: METADATA (thay <head> tags!)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Next.js TỰ ĐỘNG thêm:                                  │
  │  → <meta charset="UTF-8" />          ← XÓA!           │
  │  → <meta name="viewport" ... />      ← XÓA!           │
  │                                                          │
  │  File-based metadata:                                    │
  │  → Đặt favicon.ico, icon.png, robots.txt               │
  │    VÀO THƯ MỤC app/ → tự thêm vào <head>!           │
  │  → XÓA <link> tags khỏi layout!                       │
  │                                                          │
  │  Metadata API:                                           │
  │  export const metadata: Metadata = {                     │
  │    title: 'React App',                                   │
  │    description: 'Web site created...',                   │
  │  }                                                       │
  │  → Thay thế TẤT CẢ <head> tags còn lại!             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Steps 5-7: Styles, Entry Page, ClientOnly!

```
  STEP 5: STYLES
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Import global CSS vào app/layout.tsx:                   │
  │  import '../index.css'                                   │
  │                                                          │
  │  → CSS Modules: hoạt động giống CRA!                  │
  │  → Tailwind: xem installation docs riêng!              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  STEP 6: ENTRYPOINT PAGE (catch-all route!)
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  CRA entry: src/index.tsx → ReactDOM.render(<App />)      │
  │  Next.js:   app/[[...slug]]/page.tsx                       │
  │                                                            │
  │  [[...slug]] = OPTIONAL catch-all route!                   │
  │  → Matches: /, /about, /blog/post-1, /any/deep/path      │
  │  → TẤT CẢ routes → cùng 1 page = SPA behavior!        │
  │                                                            │
  │  app/                                                      │
  │  ├── [[...slug]]/      ← Catch-all!                      │
  │  │   ├── page.tsx      ← Server Component                │
  │  │   └── client.tsx    ← Client Component                │
  │  └── layout.tsx                                            │
  │                                                            │
  │  // app/[[...slug]]/page.tsx                                │
  │  export function generateStaticParams() {                  │
  │    return [{ slug: [''] }]  // Pre-render / route          │
  │  }                                                         │
  │  export default function Page() {                          │
  │    return <ClientOnly />                                   │
  │  }                                                         │
  │                                                            │
  └────────────────────────────────────────────────────────────┘

  STEP 7: CLIENT-ONLY ENTRYPOINT
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  // app/[[...slug]]/client.tsx                              │
  │  'use client'                                              │
  │  import dynamic from 'next/dynamic'                        │
  │                                                            │
  │  const App = dynamic(() => import('../../App'), {          │
  │    ssr: false     ← NO server-side rendering!            │
  │  })                                                        │
  │                                                            │
  │  export function ClientOnly() {                            │
  │    return <App />                                          │
  │  }                                                         │
  │                                                            │
  │  KEY INSIGHTS:                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ 'use client' → đánh dấu Client Component          │  │
  │  │ dynamic + ssr: false → KHÔNG render trên server!   │  │
  │  │ → App component = purely client (giống CRA!)       │  │
  │  │                                                      │  │
  │  │ Client Components VẪN prerender HTML trên server!  │  │
  │  │ → ssr: false = SKIP prerender (true SPA!)          │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Steps 8-11: Images, Env, Scripts, Clean Up!

```
  STEP 8: STATIC IMAGE IMPORTS
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  CRA:     import logo from './logo.png'                    │
  │           → logo = 'string URL'                           │
  │           → <img src={logo} />                            │
  │                                                            │
  │  Next.js: import logo from './logo.png'                    │
  │           → logo = { src, height, width, blurDataURL }    │
  │           → <img src={logo.src} />  ← .src cần thiết!  │
  │                                                            │
  │  HOẶC dùng <Image> component:                              │
  │  import Image from 'next/image'                            │
  │  <Image src={logo} alt="Logo" />  ← Tự auto optimize!  │
  │                                                            │
  │  FIX PATHS:                                                │
  │  BEFORE: import logo from '/logo.png'     (absolute)       │
  │  AFTER:  import logo from '../public/logo.png' (relative)  │
  │                                                            │
  │  ⚠️ TypeScript: Thêm next-env.d.ts vào tsconfig.json    │
  │  include array để fix type errors cho .src property!      │
  │                                                            │
  └────────────────────────────────────────────────────────────┘

  STEP 9: ENVIRONMENT VARIABLES
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  CRA:     REACT_APP_API_URL=https://api.example.com     │
  │  Next.js: NEXT_PUBLIC_API_URL=https://api.example.com   │
  │                                                          │
  │  → Đổi TẤT CẢ REACT_APP_ → NEXT_PUBLIC_!            │
  │  → Logic giống: chỉ vars có prefix = exposed client!  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  STEP 10: PACKAGE.JSON SCRIPTS
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  BEFORE (CRA):                                           │
  │  "scripts": {                                            │
  │    "start": "react-scripts start",                       │
  │    "build": "react-scripts build",                       │
  │    "test": "react-scripts test"                          │
  │  }                                                       │
  │                                                          │
  │  AFTER (Next.js):                                        │
  │  "scripts": {                                            │
  │    "dev": "next dev",                                    │
  │    "build": "next build",                                │
  │    "start": "npx serve@latest ./build"                   │
  │  }                                                       │
  │                                                          │
  │  Thêm vào .gitignore:                                    │
  │  .next                                                   │
  │  next-env.d.ts                                           │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  STEP 11: CLEAN UP
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  XÓA:                                                    │
  │  ✗ public/index.html       (→ app/layout.tsx)           │
  │  ✗ src/index.tsx           (→ app/[[...slug]]/page.tsx) │
  │  ✗ src/react-app-env.d.ts  (→ next-env.d.ts)           │
  │  ✗ reportWebVitals setup                                │
  │  ✗ react-scripts (pnpm remove react-scripts!)          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Additional — basePath, Proxy, Webpack, TypeScript!

```
  ADDITIONAL CONSIDERATIONS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① CRA homepage → Next.js basePath:                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ CRA:     "homepage": "/my-app" (package.json)        │  │
  │  │ Next.js: basePath: '/my-app'   (next.config.ts)      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② Service Worker → PWA:                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ CRA: serviceWorker.js (register/unregister)          │  │
  │  │ Next.js: Xem docs PWA để setup service worker!      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ③ CRA proxy → Next.js rewrites:                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ CRA:     "proxy": "http://localhost:5000"             │  │
  │  │          (package.json → tất cả /api/* đi backend) │  │
  │  │                                                      │  │
  │  │ Next.js: async rewrites() {                          │  │
  │  │   return [{                                          │  │
  │  │     source: '/api/:path*',                           │  │
  │  │     destination: 'https://backend.com/:path*',       │  │
  │  │   }]                                                 │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ④ Custom Webpack:                                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ webpack: (config, { isServer }) => {                  │  │
  │  │   // Modify config here!                             │  │
  │  │   return config                                      │  │
  │  │ }                                                    │  │
  │  │ ⚠️ Cần --webpack flag trong dev script!            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ⑤ TypeScript:                                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ tsconfig.json include:                               │  │
  │  │ ["next-env.d.ts", "app/**/*", "src/**/*"]            │  │
  │  │ → Next.js auto setup TS từ tsconfig.json!          │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §7. Bundler + Next Steps!

```
  BUNDLER COMPATIBILITY:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  CRA:     Webpack (always!)                              │
  │  Next.js: Turbopack (default!) hoặc Webpack              │
  │                                                          │
  │  next dev                ← Turbopack (nhanh hơn!)     │
  │  next dev --webpack      ← Webpack (giống CRA!)       │
  │                                                          │
  │  → Custom webpack config vẫn hoạt động!               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  NEXT STEPS (sau khi SPA hoạt động):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Migrate React Router → Next.js App Router           │
  │    → Auto code splitting!                               │
  │    → Streaming server rendering!                        │
  │    → React Server Components!                           │
  │                                                          │
  │  ② Optimize images → <Image> component                 │
  │  ③ Optimize fonts → next/font                          │
  │  ④ Optimize scripts → <Script> strategy                │
  │  ⑤ Enable ESLint recommended rules                     │
  │                                                          │
  │  ⑥ XÓA output: 'export' → unlock server features!    │
  │     (SSR, API Routes, useParams, etc.)                  │
  │                                                          │
  │  ⚠️ output: 'export' = KHÔNG dùng được useParams     │
  │     và các server features khác!                        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. Tự Viết — CraMigrationEngine!

```javascript
var CraMigrationEngine = (function () {
  // ═══════════════════════════════════
  // 1. CRA PROJECT STRUCTURE
  // ═══════════════════════════════════
  var craProject = {
    files: {
      "public/index.html":
        "<html><head><title>React App</title>" +
        '</head><body><div id="root"></div></body></html>',
      "src/index.tsx": "ReactDOM.render(<App />, root)",
      "src/App.tsx":
        "export default function App() { return <h1>Hello CRA</h1> }",
      "src/App.css": ".App { text-align: center; }",
      "src/react-app-env.d.ts": '/// <reference types="react-scripts" />',
      "package.json": JSON.stringify({
        scripts: {
          start: "react-scripts start",
          build: "react-scripts build",
        },
        dependencies: { "react-scripts": "5.0.1" },
      }),
      ".env": "REACT_APP_API_URL=https://api.example.com",
    },
  };

  // ═══════════════════════════════════
  // 2. MIGRATION ENGINE
  // ═══════════════════════════════════
  function migrate(project) {
    var result = { added: [], modified: [], removed: [], logs: [] };

    // Step 1: Install next
    result.logs.push("  📦 Step 1: pnpm add next@latest");

    // Step 2: next.config.ts
    result.added.push("next.config.ts");
    result.logs.push(
      "  📄 Step 2: Created next.config.ts" +
        ' (output: "export", distDir: "build")',
    );

    // Step 3: Root layout from index.html
    var html = project.files["public/index.html"];
    var titleMatch = html.match(/<title>([^<]+)<\/title>/);
    var title = titleMatch ? titleMatch[1] : "App";
    result.added.push("app/layout.tsx");
    result.logs.push(
      "  📄 Step 3: Created app/layout.tsx" +
        ' (from index.html, title="' +
        title +
        '")',
    );

    // Step 4: Metadata
    result.logs.push(
      "  🏷️ Step 4: Extracted metadata:" + ' title="' + title + '"',
    );
    result.logs.push(
      "    → Removed charset + viewport" + " (auto by Next.js!)",
    );

    // Step 5: Styles
    result.logs.push('  🎨 Step 5: import "../src/App.css"' + " in layout.tsx");

    // Step 6: Entrypoint page
    result.added.push("app/[[...slug]]/page.tsx");
    result.logs.push(
      "  📄 Step 6: Created [[...slug]]/page.tsx" + " (catch-all SPA route)",
    );

    // Step 7: Client-only wrapper
    result.added.push("app/[[...slug]]/client.tsx");
    result.logs.push(
      "  📄 Step 7: Created client.tsx" +
        ' ("use client" + dynamic import ssr:false)',
    );

    // Step 8: Image imports
    result.logs.push(
      "  🖼️ Step 8: img.src → img.src" + " (object instead of string)",
    );

    // Step 9: Env vars
    var envContent = project.files[".env"] || "";
    var envVars = envContent.match(/REACT_APP_/g) || [];
    result.logs.push(
      "  🔧 Step 9: " + envVars.length + " env vars: REACT_APP_ → NEXT_PUBLIC_",
    );
    result.modified.push(".env");

    // Step 10: Scripts
    result.modified.push("package.json");
    result.logs.push("  📝 Step 10: Scripts updated:" + " dev/build/start");
    result.added.push(".gitignore entries: .next, next-env.d.ts");

    // Step 11: Clean up
    result.removed.push("public/index.html");
    result.removed.push("src/index.tsx");
    result.removed.push("src/react-app-env.d.ts");
    result.logs.push(
      "  🧹 Step 11: Removed " + result.removed.length + " CRA files",
    );
    result.logs.push("  🧹 Step 11: Uninstall react-scripts");

    return result;
  }

  // ═══════════════════════════════════
  // 3. ENV VAR CONVERTER
  // ═══════════════════════════════════
  function convertEnvVars(envContent) {
    return envContent.replace(/REACT_APP_/g, "NEXT_PUBLIC_");
  }

  // ═══════════════════════════════════
  // 4. IMAGE IMPORT CONVERTER
  // ═══════════════════════════════════
  function convertImageImport(code) {
    // Convert <img src={logo} /> → <img src={logo.src} />
    return code.replace(/src=\{(\w+)\}/g, "src={$1.src}");
  }

  // ═══════════════════════════════════
  // 5. CATCH-ALL ROUTE GENERATOR
  // ═══════════════════════════════════
  function generateCatchAll(appComponentPath) {
    var page = [
      "import { ClientOnly } from './client'",
      "",
      "export function generateStaticParams() {",
      "  return [{ slug: [''] }]",
      "}",
      "",
      "export default function Page() {",
      "  return <ClientOnly />",
      "}",
    ].join("\n");

    var client = [
      "'use client'",
      "import dynamic from 'next/dynamic'",
      "",
      'const App = dynamic(() => import("' + appComponentPath + '"), {',
      "  ssr: false",
      "})",
      "",
      "export function ClientOnly() {",
      "  return <App />",
      "}",
    ].join("\n");

    return { page: page, client: client };
  }

  // ═══════════════════════════════════
  // 6. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  CRA MIGRATION ENGINE DEMO          ║");
    console.log("╚════════════════════════════════════╝");

    // Scenario 1: Full migration
    console.log("\n── Scenario 1: Full Migration ──");
    var result = migrate(craProject);
    for (var i = 0; i < result.logs.length; i++) {
      console.log(result.logs[i]);
    }
    console.log("\n  Summary:");
    console.log("  Added:    " + result.added.join(", "));
    console.log("  Modified: " + result.modified.join(", "));
    console.log("  Removed:  " + result.removed.join(", "));

    // Scenario 2: Env vars
    console.log("\n── Scenario 2: Env Vars ──");
    var env =
      "REACT_APP_API=https://api.com\n" +
      "REACT_APP_KEY=abc123\n" +
      "SECRET_KEY=hidden";
    console.log("  Before:\n  " + env.replace(/\n/g, "\n  "));
    console.log("  After:\n  " + convertEnvVars(env).replace(/\n/g, "\n  "));

    // Scenario 3: Image imports
    console.log("\n── Scenario 3: Images ──");
    var imgCode = '<img src={logo} alt="Logo" />';
    console.log("  Before: " + imgCode);
    console.log("  After:  " + convertImageImport(imgCode));

    // Scenario 4: Generated files
    console.log("\n── Scenario 4: Generated Files ──");
    var files = generateCatchAll("../../App");
    console.log("  page.tsx:\n" + files.page);
    console.log("\n  client.tsx:\n" + files.client);
  }

  return { demo: demo };
})();
// Chạy: CraMigrationEngine.demo();
```

---

## §9. Câu Hỏi Luyện Tập!

**Câu 1**: Tại sao CRA chậm? Next.js giải quyết thế nào?

<details><summary>Đáp án</summary>

CRA chậm vì **CSR** (Client-Side Rendering):

1. Browser download HTML **rỗng** → màn hình trắng
2. Download **TOÀN BỘ** JS bundle (1 file lớn, không code splitting)
3. Execute JS → mới bắt đầu fetch data
4. Fetch xong → mới render UI
5. **3-5 giây** user thấy màn trắng!

**Next.js giải quyết**:

- **SSR/SSG**: Server render HTML có content sẵn → user thấy **ngay lập tức**
- **Auto code splitting**: Mỗi page = chunk riêng → load ít JS hơn
- **Server-side data fetching**: Không cần client fetch → không waterfall
- **Streaming + Suspense**: UI load theo priority → không layout shift
- **Built-in optimization**: Image/Font/Script tự động tối ưu

</details>

---

**Câu 2**: [[...slug]] dùng để làm gì trong migration? Tại sao cần ssr: false?

<details><summary>Đáp án</summary>

**`[[...slug]]`** = Optional catch-all route:

- Match **TẤT CẢ** URL paths: `/`, `/about`, `/blog/post-1`, `/any/deep/path`
- Toàn bộ routes → 1 page → **SPA behavior** (giống CRA!)
- `generateStaticParams: [{ slug: [''] }]` → pre-render `/` route

**`ssr: false`** cần thiết vì:

- CRA app dùng `window`, `document`, DOM APIs → **KHÔNG chạy được trên server**
- `dynamic(() => import('../../App'), { ssr: false })` = **skip** server-side rendering hoàn toàn
- App component chỉ chạy **trên browser** = true SPA
- Không có `ssr: false` → server cố render → **crash** vì `window is not defined`!

Lưu ý: Client Components trong Next.js **vẫn prerender HTML** trên server by default. `ssr: false` mới thực sự skip prerender.

</details>

---

**Câu 3**: Image import khác gì giữa CRA vs Next.js?

<details><summary>Đáp án</summary>

|                                 | CRA                                      | Next.js                                                |
| ------------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| `import logo from './logo.png'` | `logo = "/logo.abc123.png"` (string URL) | `logo = { src, height, width, blurDataURL }` (object!) |
| Sử dụng                         | `<img src={logo} />`                     | `<img src={logo.src} />` (phải `.src`!)                |
| Optimize                        | Không, manual `<img>`                    | `<Image src={logo} />` = auto resize, lazy load, WebP! |
| Absolute path                   | `import from '/logo.png'`                | `import from '../public/logo.png'` (relative!)         |

**TypeScript fix**: Thêm `next-env.d.ts` vào `tsconfig.json` `include` array để fix `.src` property type errors.

</details>

---

**Câu 4**: Liệt kê 11 bước migration và files bị ảnh hưởng.

<details><summary>Đáp án</summary>

| Step | Hành động       | File                                                                 |
| ---- | --------------- | -------------------------------------------------------------------- |
| 1    | Install Next.js | `pnpm add next@latest`                                               |
| 2    | Create config   | `next.config.ts` (output:'export', distDir:'build')                  |
| 3    | Root layout     | `app/layout.tsx` (từ `public/index.html`)                            |
| 4    | Metadata        | Xóa charset/viewport, dùng `export const metadata`                   |
| 5    | Styles          | Import `../index.css` trong `layout.tsx`                             |
| 6    | Entry page      | `app/[[...slug]]/page.tsx` (catch-all)                               |
| 7    | Client wrapper  | `app/[[...slug]]/client.tsx` ('use client' + ssr:false)              |
| 8    | Images          | `img.src` → `img.src`, `/path` → `../public/path`                    |
| 9    | Env vars        | `REACT_APP_` → `NEXT_PUBLIC_`                                        |
| 10   | Scripts         | `react-scripts` → `next dev/build`, .gitignore                       |
| 11   | Clean up        | Xóa `index.html`, `index.tsx`, `react-app-env.d.ts`, `react-scripts` |

</details>
