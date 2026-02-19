# Next.js Vite Migration — Deep Dive!

> **Chủ đề**: Di Chuyển Từ Vite Sang Next.js!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/migrating/from-vite
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — Vite vs Next.js](#1)
2. [§2. Why Switch — 7 Lý Do](#2)
3. [§3. Steps 1-3: Install, Config, TypeScript](#3)
4. [§4. Step 4: Root Layout (index.html → layout.tsx)](#4)
5. [§5. Step 5: Entrypoint + ClientOnly](#5)
6. [§6. Steps 6-9: Images, Env, Scripts, Clean Up](#6)
7. [§7. Next Steps + So Sánh CRA vs Vite Migration](#7)
8. [§8. Tự Viết — ViteMigrationEngine](#8)
9. [§9. Câu Hỏi Luyện Tập](#9)

---

## §1. Tổng Quan — Vite vs Next.js!

```
  VITE vs NEXT.JS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VITE (React SPA):                                         │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  index.html           ← Entry HTML! (root level)   │  │
  │  │  src/                                                │  │
  │  │  ├── main.tsx         ← Entry JS! (ReactDOM)       │  │
  │  │  ├── App.tsx          ← Root component             │  │
  │  │  └── index.css                                      │  │
  │  │  vite.config.ts       ← Vite config!               │  │
  │  │  tsconfig.json                                       │  │
  │  │  tsconfig.node.json   ← Vite-specific TS config    │  │
  │  │  vite-env.d.ts        ← Vite types                 │  │
  │  │  package.json                                        │  │
  │  │  .env                 ← VITE_ prefix!              │  │
  │  │                                                      │  │
  │  │  Đặc điểm:                                          │  │
  │  │  → Client-Side Rendering (CSR) ONLY!               │  │
  │  │  → ESBuild (dev) + Rollup (build)                  │  │
  │  │  → import.meta.env (env vars)                      │  │
  │  │  → HMR cực nhanh (native ESM!)                    │  │
  │  │  → KHÔNG có SSR, SSG, ISR!                        │  │
  │  │  → KHÔNG có file-based routing!                   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  NEXT.JS:                                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  src/app/                                            │  │
  │  │  ├── layout.tsx       ← Root layout (thay HTML!)   │  │
  │  │  ├── [[...slug]]/     ← Catch-all SPA route!      │  │
  │  │  │   ├── page.tsx     ← Server Component          │  │
  │  │  │   └── client.tsx   ← 'use client' wrapper      │  │
  │  │  next.config.mjs      ← Next.js config!            │  │
  │  │  tsconfig.json         ← Updated for Next.js!      │  │
  │  │  next-env.d.ts         ← Auto generated!           │  │
  │  │  .env                  ← NEXT_PUBLIC_ prefix!      │  │
  │  │                                                      │  │
  │  │  Đặc điểm:                                          │  │
  │  │  → SSR + SSG + ISR + CSR!                          │  │
  │  │  → Turbopack (dev) or Webpack (build)              │  │
  │  │  → process.env (env vars)                          │  │
  │  │  → Auto code splitting!                            │  │
  │  │  → Server Components (default!)                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CHIẾN LƯỢC: SPA trước, optimize SAU!                    │
  │  → Bước 1: Chạy Vite app AS-IS trên Next.js (SPA mode)│  │
  │  → Bước 2: Dần dần adopt SSR, App Router, etc!        │  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Why Switch — 7 Lý Do!

```
  7 LÝ DO CHUYỂN TỪ VITE SANG NEXT.JS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① SLOW INITIAL LOAD:                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Vite SPA:                                            │  │
  │  │ Browser → Download HTML rỗng                      │  │
  │  │        → Download JS bundle                        │  │
  │  │        → Execute JS (React render)                 │  │
  │  │        → Fetch data (useEffect)                    │  │
  │  │        → Render UI  ← 3-5s trắng! 😱            │  │
  │  │                                                      │  │
  │  │ Next.js SSR:                                         │  │
  │  │ Server → Render HTML (có content!)                 │  │
  │  │ Browser → Hiển thị NGAY → Hydrate  ← < 1s ⚡   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ② NO AUTO CODE SPLITTING:                                 │
  │  Vite: Manual React.lazy() → dễ tạo waterfalls         │
  │  Next.js: Auto per-route splitting + tree-shaking!        │
  │                                                            │
  │  ③ NETWORK WATERFALLS:                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Vite SPA (sequential):                               │  │
  │  │ Parent mount → fetch ──→ Child mount → fetch ──→  │  │
  │  │ → Grandchild mount → fetch                         │  │
  │  │ (mỗi level phải ĐỢI level trước!)                │  │
  │  │                                                      │  │
  │  │ Next.js Server (parallel):                           │  │
  │  │ Server: fetch A + B + C ĐỒNG THỜI → HTML!        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  ④ Streaming + Suspense → load UI theo priority!          │
  │  ⑤ SSG/SSR/ISR → chọn strategy per-page/component!      │
  │  ⑥ Proxy → redirect, auth, A/B testing, i18n!            │
  │  ⑦ Built-in <Image>, next/font, <Script> optimization!   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. Steps 1-3: Install, Config, TypeScript!

```
  STEP 1: INSTALL NEXT.JS
  ┌──────────────────────────────────────────────────────────┐
  │  pnpm add next@latest                                    │
  │  → Không tạo project mới! Thêm vào project hiện tại! │
  └──────────────────────────────────────────────────────────┘

  STEP 2: NEXT.CONFIG.MJS
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // next.config.mjs                                      │
  │  /** @type {import('next').NextConfig} */                 │
  │  const nextConfig = {                                    │
  │    output: 'export',   // SPA mode!                      │
  │    distDir: './dist',  // Giống Vite output dir!         │
  │  }                                                       │
  │  export default nextConfig                               │
  │                                                          │
  │  → .js hoặc .mjs đều OK!                              │
  │  → output: 'export' = static → XÓA SAU để dùng SSR! │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  STEP 3: TYPESCRIPT CONFIG (9 thay đổi!)
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌───┬────────────────────────────────┬────────────────┐   │
  │  │ # │ Thay đổi                       │ Giá trị        │   │
  │  ├───┼────────────────────────────────┼────────────────┤   │
  │  │ 1 │ XÓA reference tsconfig.node    │ (remove!)      │   │
  │  │ 2 │ include thêm                    │ ./dist/types   │   │
  │  │   │                                │ ./next-env.d.ts│   │
  │  │ 3 │ exclude thêm                    │ ./node_modules │   │
  │  │ 4 │ plugins thêm                    │ { name: next } │   │
  │  │ 5 │ esModuleInterop                │ true           │   │
  │  │ 6 │ jsx                            │ react-jsx      │   │
  │  │ 7 │ allowJs                        │ true           │   │
  │  │ 8 │ forceConsistentCasingInFileNames│ true           │   │
  │  │ 9 │ incremental                    │ true           │   │
  │  └───┴────────────────────────────────┴────────────────┘   │
  │                                                            │
  │  VÌ SAO:                                                    │
  │  → #1: tsconfig.node.json là Vite-specific, Next không  │
  │         cần!                                                │
  │  → #2: Next.js generate types vào dist/types/            │
  │  → #4: Next.js IDE plugin → auto-complete, type check!  │
  │  → #5: CommonJS ↔ ESM interop!                          │
  │  → #6: Không cần React import cho JSX (react-jsx!)      │
  │  → #9: Faster re-compilation!                            │
  │                                                            │
  │  FINAL tsconfig.json:                                       │
  │  {                                                          │
  │    "compilerOptions": {                                     │
  │      "target": "ES2020",                                    │
  │      "module": "ESNext",                                    │
  │      "esModuleInterop": true,                               │
  │      "jsx": "react-jsx",                                    │
  │      "allowJs": true,                                       │
  │      "forceConsistentCasingInFileNames": true,              │
  │      "incremental": true,                                   │
  │      "plugins": [{ "name": "next" }],                       │
  │      ... (giữ các options cũ!)                             │
  │    },                                                       │
  │    "include": ["./src", "./dist/types/**/*.ts",             │
  │               "./next-env.d.ts"],                           │
  │    "exclude": ["./node_modules"]                            │
  │  }                                                          │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Step 4: Root Layout (index.html → layout.tsx)!

```
  ROOT LAYOUT — 5 giai đoạn chuyển đổi:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  GĐ 1: Copy index.html → layout.tsx                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Vite index.html:                                     │  │
  │  │ <html lang="en">                                     │  │
  │  │   <head>                                             │  │
  │  │     <meta charset="UTF-8" />                         │  │
  │  │     <link rel="icon" type="image/svg+xml"            │  │
  │  │           href="/icon.svg" />                         │  │
  │  │     <meta name="viewport" content="..." />           │  │
  │  │     <title>My App</title>                             │  │
  │  │     <meta name="description" content="..." />        │  │
  │  │   </head>                                            │  │
  │  │   <body>                                             │  │
  │  │     <div id="root"></div>                             │  │
  │  │     <script type="module" src="/src/main.tsx" />     │  │
  │  │   </body>                                            │  │
  │  │ </html>                                              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │         ↓                                                  │
  │  GĐ 2: Thay div#root + <script> → {children}             │
  │  GĐ 3: Xóa <meta charset> + <meta viewport> (auto!)     │
  │  GĐ 4: Chuyển favicon vào app/ → xóa <link>             │
  │  GĐ 5: Dùng Metadata API → xóa <head> hoàn toàn!      │
  │         ↓                                                  │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ src/app/layout.tsx (FINAL):                          │  │
  │  │ import type { Metadata } from 'next'                 │  │
  │  │                                                      │  │
  │  │ export const metadata: Metadata = {                  │  │
  │  │   title: 'My App',                                   │  │
  │  │   description: 'My App is a...',                     │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
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
  │  KEY DIFFERENCES VS VITE:                                   │
  │  ┌────────────────────────┬──────────────────────────────┐ │
  │  │ Vite                   │ Next.js                      │ │
  │  ├────────────────────────┼──────────────────────────────┤ │
  │  │ index.html (static)    │ layout.tsx (React Component!)│ │
  │  │ <script src="main.tsx">│ {children} prop!             │ │
  │  │ <meta> tags in HTML    │ export const metadata!       │ │
  │  │ favicon in <link>      │ File-based (app/favicon.ico!)│ │
  │  └────────────────────────┴──────────────────────────────┘ │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Step 5: Entrypoint + ClientOnly!

```
  ENTRYPOINT MIGRATION:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Vite entry: src/main.tsx                                   │
  │  → ReactDOM.createRoot(document.getElementById('root'))    │
  │  →   .render(<App />)                                     │
  │                                                            │
  │  Next.js: src/app/[[...slug]]/page.tsx                      │
  │           src/app/[[...slug]]/client.tsx                     │
  │                                                            │
  │  FILE STRUCTURE:                                            │
  │  src/app/                                                   │
  │  ├── layout.tsx              ← Root layout               │
  │  └── [[...slug]]/            ← Optional catch-all!       │
  │      ├── page.tsx            ← Server Component          │
  │      └── client.tsx          ← Client Component          │
  │                                                            │
  │  [[...slug]] = OPTIONAL catch-all route!                   │
  │  → / (match!)  /about (match!)  /blog/1 (match!)          │
  │  → TẤT CẢ routes → 1 page = SPA behavior!              │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  2 FILES QUAN TRỌNG:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  FILE 1: page.tsx (Server Component!)                       │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ import '../../index.css'                             │  │
  │  │ import { ClientOnly } from './client'                │  │
  │  │                                                      │  │
  │  │ export function generateStaticParams() {             │  │
  │  │   return [{ slug: [''] }]  // Pre-render /           │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ export default function Page() {                     │  │
  │  │   return <ClientOnly />                              │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ → Server Component = prerender thành static HTML!  │  │
  │  │ → generateStaticParams → pre-render / route chỉ!  │  │
  │  │ → Import global CSS TẠI ĐÂY!                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FILE 2: client.tsx (Client Component!)                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ 'use client'                                         │  │
  │  │ import dynamic from 'next/dynamic'                   │  │
  │  │                                                      │  │
  │  │ const App = dynamic(                                 │  │
  │  │   () => import('../../App'),                         │  │
  │  │   { ssr: false }  ← KHÔNG render server!          │  │
  │  │ )                                                    │  │
  │  │                                                      │  │
  │  │ export function ClientOnly() {                       │  │
  │  │   return <App />                                     │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ KEY:                                                  │  │
  │  │ → 'use client' = Client Component                  │  │
  │  │ → ssr: false = SKIP prerender (true SPA!)          │  │
  │  │ → App (Vite) dùng window/document → cần ssr:false │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FLOW:                                                     │
  │  Vite main.tsx → ReactDOM.render(<App />)                  │
  │       ↓ MIGRATE                                            │
  │  page.tsx (Server) → client.tsx ('use client')             │
  │                    → dynamic(App, {ssr:false})             │
  │                    → Giống Vite: App chạy client-only!    │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. Steps 6-9: Images, Env, Scripts, Clean Up!

```
  STEP 6: IMAGE IMPORTS
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌──────────────────────┬──────────────────────────────┐   │
  │  │ Vite                 │ Next.js                      │   │
  │  ├──────────────────────┼──────────────────────────────┤   │
  │  │ import img from      │ import img from              │   │
  │  │ './img.png'          │ './img.png'                   │   │
  │  │ → string URL!       │ → object!                   │   │
  │  │ '/assets/img.2d8.png'│ { src, width, height, ... } │   │
  │  │ <img src={img} />    │ <img src={img.src} />        │   │
  │  └──────────────────────┴──────────────────────────────┘   │
  │                                                            │
  │  FIX PATHS:                                                │
  │  import logo from '/logo.png'     → absolute (Vite)       │
  │  import logo from '../public/logo.png' → relative (Next!) │
  │                                                            │
  │  HOẶC dùng <Image> sau:                                   │
  │  import Image from 'next/image'                            │
  │  <Image src={logo} alt="Logo" /> → auto optimize!        │
  │                                                            │
  │  ⚠️ TypeScript .src errors → sẽ tự fix khi hoàn tất!  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  STEP 7: ENVIRONMENT VARIABLES (import.meta.env → process.env!)
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  PREFIX:                                                    │
  │  VITE_API_URL=... → NEXT_PUBLIC_API_URL=...               │
  │                                                            │
  │  BUILT-IN VARS:                                            │
  │  ┌────────────────────────────┬────────────────────────┐   │
  │  │ Vite (import.meta.env)    │ Next.js (process.env)  │   │
  │  ├────────────────────────────┼────────────────────────┤   │
  │  │ import.meta.env.MODE      │ process.env.NODE_ENV   │   │
  │  │ import.meta.env.PROD      │ NODE_ENV === 'production'│  │
  │  │ import.meta.env.DEV       │ NODE_ENV !== 'production'│  │
  │  │ import.meta.env.SSR       │ typeof window !==      │   │
  │  │                           │ 'undefined'            │   │
  │  │ import.meta.env.BASE_URL  │ process.env             │   │
  │  │                           │ .NEXT_PUBLIC_BASE_PATH  │   │
  │  └────────────────────────────┴────────────────────────┘   │
  │                                                            │
  │  BASE_URL config:                                          │
  │  ① .env: NEXT_PUBLIC_BASE_PATH="/some-path"               │
  │  ② next.config.mjs: basePath: process.env                 │
  │     .NEXT_PUBLIC_BASE_PATH                                 │
  │                                                            │
  └────────────────────────────────────────────────────────────┘

  STEP 8: PACKAGE.JSON SCRIPTS
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  BEFORE (Vite):        AFTER (Next.js):                   │
  │  "dev": "vite"         "dev": "next dev"                  │
  │  "build": "vite build" "build": "next build"              │
  │  "preview": "vite      "start": "next start"              │
  │   preview"                                                │
  │                                                          │
  │  .gitignore thêm:                                         │
  │  .next                                                   │
  │  next-env.d.ts                                           │
  │  dist                                                    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  STEP 9: CLEAN UP (xóa 6 files Vite-specific!)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ✗ main.tsx             (→ app/[[...slug]]/page.tsx)    │
  │  ✗ index.html           (→ app/layout.tsx)              │
  │  ✗ vite-env.d.ts        (→ next-env.d.ts auto!)        │
  │  ✗ tsconfig.node.json   (→ không cần nữa!)            │
  │  ✗ vite.config.ts       (→ next.config.mjs)            │
  │  ✗ Vite dependencies    (pnpm remove vite              │
  │                           @vitejs/plugin-react!)        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Next Steps + So Sánh CRA vs Vite Migration!

```
  NEXT STEPS (sau khi SPA hoạt động):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① React Router → Next.js App Router                   │
  │    → Auto code splitting!                               │
  │    → Streaming server rendering!                        │
  │    → React Server Components!                           │
  │                                                          │
  │  ② <Image> component → auto optimization               │
  │  ③ next/font → no layout shift                         │
  │  ④ <Script> → loading strategy                         │
  │  ⑤ ESLint → Next.js rules                             │
  │                                                          │
  │  ⑥ XÓA output: 'export' → unlock SSR!                │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  SO SÁNH: CRA MIGRATION vs VITE MIGRATION
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌──────────────────┬──────────────────┬────────────────┐  │
  │  │                  │ CRA Migration    │ Vite Migration │  │
  │  ├──────────────────┼──────────────────┼────────────────┤  │
  │  │ Config file      │ next.config.ts   │ next.config.mjs│  │
  │  │ distDir          │ 'build'          │ './dist'       │  │
  │  │ Entry HTML       │ public/index.html│ index.html     │  │
  │  │ Entry JS         │ src/index.tsx    │ src/main.tsx   │  │
  │  │ Env prefix       │ REACT_APP_       │ VITE_          │  │
  │  │ Env API          │ process.env      │ import.meta.env│  │
  │  │ TypeScript       │ Minimal changes  │ 9 changes!     │  │
  │  │ Extra TS file    │ react-app-env.d  │ vite-env.d.ts  │  │
  │  │ Config to remove │ (none)           │ vite.config.ts │  │
  │  │                  │                  │ tsconfig.node  │  │
  │  │ Package to remove│ react-scripts    │ vite + plugins │  │
  │  │ Steps            │ 11               │ 9              │  │
  │  └──────────────────┴──────────────────┴────────────────┘  │
  │                                                            │
  │  GHI NHỚ: Cả 2 đều dùng cùng pattern!                   │
  │  → output: 'export' + [[...slug]] + ClientOnly(ssr:false) │
  │  → Migration = giữ SPA trước, optimize sau!              │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §8. Tự Viết — ViteMigrationEngine!

```javascript
var ViteMigrationEngine = (function () {
  // ═══════════════════════════════════
  // 1. VITE PROJECT STRUCTURE
  // ═══════════════════════════════════
  var viteProject = {
    files: {
      "index.html":
        "<html><head><title>My App</title>" +
        '</head><body><div id="root"></div>' +
        '<script type="module" src="/src/main.tsx"></script>' +
        "</body></html>",
      "src/main.tsx": "ReactDOM.createRoot(root).render(<App />)",
      "src/App.tsx":
        "export default function App() { return <h1>Vite App</h1> }",
      "vite.config.ts": 'import react from "@vitejs/plugin-react"',
      "vite-env.d.ts": '/// <reference types="vite/client" />',
      "tsconfig.json": '{ "references": [{"path":"./tsconfig.node.json"}] }',
      "tsconfig.node.json": "{ ... vite specific ... }",
      ".env":
        "VITE_API_URL=https://api.example.com\n" + "VITE_APP_TITLE=My App",
    },
  };

  // ═══════════════════════════════════
  // 2. ENV VAR CONVERTER
  // ═══════════════════════════════════
  function convertEnvVars(envContent) {
    return envContent.replace(/VITE_/g, "NEXT_PUBLIC_");
  }

  function convertEnvUsage(code) {
    var replacements = [
      ["import.meta.env.MODE", "process.env.NODE_ENV"],
      ["import.meta.env.PROD", "process.env.NODE_ENV === 'production'"],
      ["import.meta.env.DEV", "process.env.NODE_ENV !== 'production'"],
      ["import.meta.env.SSR", "typeof window !== 'undefined'"],
      ["import.meta.env.BASE_URL", "process.env.NEXT_PUBLIC_BASE_PATH"],
    ];
    var result = code;
    for (var i = 0; i < replacements.length; i++) {
      result = result.replace(
        new RegExp(replacements[i][0].replace(/\./g, "\\."), "g"),
        replacements[i][1],
      );
    }
    // Custom VITE_ vars
    result = result.replace(
      /import\.meta\.env\.VITE_/g,
      "process.env.NEXT_PUBLIC_",
    );
    return result;
  }

  // ═══════════════════════════════════
  // 3. TSCONFIG UPDATER
  // ═══════════════════════════════════
  function updateTsConfig(original) {
    var config = JSON.parse(JSON.stringify(original));
    // Remove references
    delete config.references;
    // Update compilerOptions
    if (!config.compilerOptions) config.compilerOptions = {};
    config.compilerOptions.esModuleInterop = true;
    config.compilerOptions.jsx = "react-jsx";
    config.compilerOptions.allowJs = true;
    config.compilerOptions.forceConsistentCasingInFileNames = true;
    config.compilerOptions.incremental = true;
    config.compilerOptions.plugins = [{ name: "next" }];
    // Update include/exclude
    config.include = ["./src", "./dist/types/**/*.ts", "./next-env.d.ts"];
    config.exclude = ["./node_modules"];
    return config;
  }

  // ═══════════════════════════════════
  // 4. IMAGE IMPORT CONVERTER
  // ═══════════════════════════════════
  function convertImageImport(code) {
    return code.replace(/src=\{(\w+)\}/g, "src={$1.src}");
  }

  // ═══════════════════════════════════
  // 5. LAYOUT GENERATOR (index.html → layout.tsx)
  // ═══════════════════════════════════
  function generateLayout(indexHtml) {
    var titleMatch = indexHtml.match(/<title>([^<]+)<\/title>/);
    var title = titleMatch ? titleMatch[1] : "App";

    var descMatch = indexHtml.match(/name="description"\s+content="([^"]+)"/);
    var desc = descMatch ? descMatch[1] : "";

    return [
      "import type { Metadata } from 'next'",
      "",
      "export const metadata: Metadata = {",
      "  title: '" + title + "',",
      desc ? "  description: '" + desc + "'," : "",
      "}",
      "",
      "export default function RootLayout({",
      "  children",
      "}: { children: React.ReactNode }) {",
      "  return (",
      '    <html lang="en">',
      "      <body>",
      '        <div id="root">{children}</div>',
      "      </body>",
      "    </html>",
      "  )",
      "}",
    ]
      .filter(Boolean)
      .join("\n");
  }

  // ═══════════════════════════════════
  // 6. CATCH-ALL ROUTE GENERATOR
  // ═══════════════════════════════════
  function generateCatchAll(appPath) {
    var page = [
      "import '../../index.css'",
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
      "const App = dynamic(",
      "  () => import('" + appPath + "'),",
      "  { ssr: false }",
      ")",
      "",
      "export function ClientOnly() {",
      "  return <App />",
      "}",
    ].join("\n");

    return { page: page, client: client };
  }

  // ═══════════════════════════════════
  // 7. FULL MIGRATION
  // ═══════════════════════════════════
  function migrate(project) {
    var logs = [];

    logs.push("📦 Step 1: pnpm add next@latest");
    logs.push(
      "📄 Step 2: Created next.config.mjs" +
        ' (output:"export", distDir:"./dist")',
    );

    // Step 3: TypeScript
    var tsConfig = updateTsConfig({
      compilerOptions: { target: "ES2020" },
      references: [{ path: "./tsconfig.node.json" }],
    });
    logs.push("🔧 Step 3: Updated tsconfig.json (9 changes)");
    logs.push("  → Removed references, added Next.js plugin");

    // Step 4: Layout
    var layout = generateLayout(project.files["index.html"]);
    logs.push("📄 Step 4: Generated app/layout.tsx from " + "index.html");

    // Step 5: Entrypoint
    var routes = generateCatchAll("../../App");
    logs.push("📄 Step 5: Generated [[...slug]]/page.tsx" + " + client.tsx");

    // Step 6: Images
    logs.push("🖼️ Step 6: Fix image imports (.src)");

    // Step 7: Env vars
    var envContent = project.files[".env"] || "";
    var envVars = envContent.match(/VITE_/g) || [];
    logs.push(
      "🔧 Step 7: " + envVars.length + " env vars: VITE_ → NEXT_PUBLIC_",
    );
    logs.push("  + import.meta.env.* → process.env.*");

    // Step 8: Scripts
    logs.push("📝 Step 8: Scripts: vite → next dev/build/start");

    // Step 9: Clean up
    var toDelete = [
      "main.tsx",
      "index.html",
      "vite-env.d.ts",
      "tsconfig.node.json",
      "vite.config.ts",
    ];
    logs.push(
      "🧹 Step 9: Delete " + toDelete.length + " Vite files + uninstall vite",
    );

    return { logs: logs, layout: layout, routes: routes };
  }

  // ═══════════════════════════════════
  // 8. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  VITE MIGRATION ENGINE DEMO         ║");
    console.log("╚════════════════════════════════════╝");

    // Scenario 1: Full migration
    console.log("\n── Scenario 1: Full Migration ──");
    var result = migrate(viteProject);
    for (var i = 0; i < result.logs.length; i++) {
      console.log("  " + result.logs[i]);
    }

    // Scenario 2: Env vars
    console.log("\n── Scenario 2: Env Vars ──");
    var env = "VITE_API=https://api.com\nVITE_KEY=abc";
    console.log("  .env before: " + env.replace(/\n/g, ", "));
    console.log("  .env after:  " + convertEnvVars(env).replace(/\n/g, ", "));

    // Scenario 3: import.meta.env
    console.log("\n── Scenario 3: import.meta.env ──");
    var code =
      "if (import.meta.env.DEV) { " + "console.log(import.meta.env.VITE_API) }";
    console.log("  Before: " + code);
    console.log("  After:  " + convertEnvUsage(code));

    // Scenario 4: TypeScript config
    console.log("\n── Scenario 4: tsconfig.json ──");
    var ts = updateTsConfig({
      compilerOptions: { target: "ES2020" },
      references: [{ path: "./tsconfig.node.json" }],
    });
    console.log("  references: " + JSON.stringify(ts.references || "REMOVED"));
    console.log("  plugins: " + JSON.stringify(ts.compilerOptions.plugins));
    console.log("  jsx: " + ts.compilerOptions.jsx);

    // Scenario 5: Generated layout
    console.log("\n── Scenario 5: Generated Layout ──");
    console.log(result.layout);
  }

  return { demo: demo };
})();
// Chạy: ViteMigrationEngine.demo();
```

---

## §9. Câu Hỏi Luyện Tập!

**Câu 1**: Vite migration cần thay đổi gì trong tsconfig.json? Tại sao?

<details><summary>Đáp án</summary>

**9 thay đổi**:

| #   | Thay đổi                                                 | Lý do                                              |
| --- | -------------------------------------------------------- | -------------------------------------------------- |
| 1   | Xóa `references` → `tsconfig.node.json`                  | Vite-specific, Next.js không cần                   |
| 2   | `include` thêm `./dist/types/**/*.ts`, `./next-env.d.ts` | Next.js generate types vào `dist/types/`           |
| 3   | `exclude` thêm `./node_modules`                          | Cần explicit cho Next.js                           |
| 4   | `plugins: [{ "name": "next" }]`                          | IDE plugin: auto-complete, type check cho Next.js! |
| 5   | `esModuleInterop: true`                                  | CommonJS ↔ ESM interop                             |
| 6   | `jsx: "react-jsx"`                                       | Không cần `import React` cho JSX                   |
| 7   | `allowJs: true`                                          | Cho phép .js files (mixed projects)                |
| 8   | `forceConsistentCasingInFileNames: true`                 | Tránh bugs cross-platform (macOS vs Linux)         |
| 9   | `incremental: true`                                      | Faster re-compilation (cache .tsbuildinfo)         |

</details>

---

**Câu 2**: import.meta.env thay đổi thế nào sang Next.js?

<details><summary>Đáp án</summary>

| Vite                       | Next.js                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `import.meta.env.MODE`     | `process.env.NODE_ENV`                                                                   |
| `import.meta.env.PROD`     | `process.env.NODE_ENV === 'production'`                                                  |
| `import.meta.env.DEV`      | `process.env.NODE_ENV !== 'production'`                                                  |
| `import.meta.env.SSR`      | `typeof window !== 'undefined'`                                                          |
| `import.meta.env.BASE_URL` | `process.env.NEXT_PUBLIC_BASE_PATH` (cần configure `.env` + `next.config.mjs` basePath!) |
| `import.meta.env.VITE_*`   | `process.env.NEXT_PUBLIC_*`                                                              |

**Key insight**: Vite dùng `import.meta.env` (ESM standard), Next.js dùng `process.env` (Node.js standard). Prefix client-exposed vars: `VITE_` → `NEXT_PUBLIC_`.

</details>

---

**Câu 3**: So sánh CRA migration vs Vite migration — điểm giống/khác?

<details><summary>Đáp án</summary>

**Giống** (cùng pattern!):

- Cả 2 dùng `output: 'export'` (SPA mode ban đầu)
- Cả 2 dùng `[[...slug]]` catch-all route
- Cả 2 dùng `ClientOnly` component with `dynamic(App, { ssr: false })`
- Cả 2 chuyển `index.html` → `app/layout.tsx`
- Cả 2 dùng Metadata API thay `<head>` tags

**Khác**:

- **Config**: CRA dùng `next.config.ts`, Vite dùng `next.config.mjs`
- **distDir**: CRA = `'build'`, Vite = `'./dist'`
- **Env prefix**: CRA = `REACT_APP_`, Vite = `VITE_`
- **Env API**: CRA đã dùng `process.env`, Vite dùng `import.meta.env` (cần migrate 5 built-in vars!)
- **TypeScript**: Vite cần **9 changes** (tsconfig.node.json, plugins, etc.), CRA chỉ cần minimal
- **Clean up**: CRA xóa `react-scripts`, Vite xóa `vite` + `@vitejs/plugin-react` + `vite.config.ts` + `tsconfig.node.json`

</details>

---

**Câu 4**: Tại sao cần [[...slug]] + ssr: false? Nếu không dùng thì sao?

<details><summary>Đáp án</summary>

**`[[...slug]]`** cần thiết vì:

- Vite SPA dùng client-side router (React Router) → **1 HTML** cho TẤT CẢ routes
- Next.js dùng file-based routing → mỗi folder = 1 route
- `[[...slug]]` = optional catch-all → **mọi URL** đều match → SPA behavior!
- Không có nó → chỉ `/` hoạt động, `/about` sẽ 404!

**`ssr: false`** cần thiết vì:

- Vite App component dùng `window`, `document`, DOM APIs
- Server Component **KHÔNG có** `window` → crash: `ReferenceError: window is not defined`
- `ssr: false` = dynamic import, chỉ load component **trên browser**
- Bỏ `ssr: false` → server cố render App → **error**

**Nếu không dùng**: Migrate sẽ **fail** — 404 trên mọi route trừ `/`, và server errors từ browser-only APIs.

</details>
