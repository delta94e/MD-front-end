# Next.js mdx-components.js — Deep Dive!

> **Chủ đề**: `mdx-components.js` — Custom Components cho MDX
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/mdx-components
> **Bổ sung**: https://nextjs.org/docs/app/guides/mdx (MDX Guide đầy đủ!)
> **Hình ảnh trang gốc**: 0 (trang chỉ có text + code blocks, KHÔNG có diagram/hình ảnh)

---

## Mục Lục

1. [§1. Tổng Quan — MDX là gì? mdx-components.js là gì?](#1)
2. [§2. Exports — useMDXComponents Function](#2)
3. [§3. Setup Toàn Bộ — Từ Install đến Config](#3)
4. [§4. 3 Cách Render MDX — File Routing, Import, Dynamic](#4)
5. [§5. Custom Styles & Components — Global, Local, Shared](#5)
6. [§6. Frontmatter + remark/rehype Plugins](#6)
7. [§7. Deep Dive — Markdown → HTML Transform Pipeline](#7)
8. [§8. Sơ Đồ Tự Vẽ — Tổng Hợp](#8)
9. [§9. Tự Viết — MDXEngine](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. Tổng Quan — MDX là gì? mdx-components.js là gì?

```
  MDX + mdx-components.js — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MARKDOWN là gì?                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Ngôn ngữ MARKUP nhẹ để format text!               │    │
  │  │ → Viết bằng plain text → convert sang HTML!        │    │
  │  │ → Dùng cho websites, blogs, documentation...        │    │
  │  │                                                      │    │
  │  │ VÍ DỤ:                                               │    │
  │  │ Input:  I **love** using [Next.js](nextjs.org)       │    │
  │  │ Output: <p>I <strong>love</strong> using             │    │
  │  │         <a href="nextjs.org">Next.js</a></p>         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  MDX là gì?                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → SUPERSET of Markdown!                              │    │
  │  │ → Cho phép viết JSX TRỰC TIẾP trong markdown!       │    │
  │  │ → Embed React Components trong content!              │    │
  │  │ → Dynamic, interactive content!                      │    │
  │  │                                                      │    │
  │  │ VÍ DỤ MDX:                                           │    │
  │  │ ┌──────────────────────────────────────────────┐    │    │
  │  │ │ import { MyComponent } from 'my-component'    │    │    │
  │  │ │                                               │    │    │
  │  │ │ # Welcome to my MDX page!                     │    │    │
  │  │ │ This is some **bold** text.                    │    │    │
  │  │ │                                               │    │    │
  │  │ │ <MyComponent />  ← REACT COMPONENT!          │    │    │
  │  │ └──────────────────────────────────────────────┘    │    │
  │  │                                                      │    │
  │  │ → Markdown syntax + JSX components cùng file!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  mdx-components.js là gì?                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → File REQUIRED khi dùng @next/mdx với App Router! │    │
  │  │ → Không có file này = @next/mdx KHÔNG hoạt động!  │    │
  │  │ → Dùng để CUSTOMIZE components render trong MDX!    │    │
  │  │                                                      │    │
  │  │ VỊ TRÍ: Root project (cùng cấp app/, pages/, src/) │    │
  │  │ VERSION: Introduced v13.1.2                          │    │
  │  │                                                      │    │
  │  │ CHỨC NĂNG:                                           │    │
  │  │ → Thay đổi cách render <h1>, <p>, <a>, <img>...   │    │
  │  │ → Map HTML tags → custom React components!         │    │
  │  │ → Global styling cho tất cả MDX files!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Exports — useMDXComponents Function

```
  useMDXComponents — EXPORT DUY NHẤT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FILE PHẢI EXPORT 1 FUNCTION DUY NHẤT: useMDXComponents!     │
  │                                                              │
  │  ĐẶC ĐIỂM:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ • Tên: useMDXComponents (CHÍNH XÁC!)               │    │
  │  │ • Arguments: KHÔNG nhận argument nào!               │    │
  │  │ • Return: MDXComponents object                       │    │
  │  │ • Phải export (named export, không phải default!)   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CODE CƠ BẢN (trống):                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import type { MDXComponents } from 'mdx/types'       │    │
  │  │                                                      │    │
  │  │ const components: MDXComponents = {}                  │    │
  │  │                                                      │    │
  │  │ export function useMDXComponents(): MDXComponents {   │    │
  │  │   return components                                   │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → components = {} → KHÔNG custom gì cả!            │    │
  │  │ → MDX sẽ dùng default HTML tags!                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CODE VỚI CUSTOM COMPONENTS:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import type { MDXComponents } from 'mdx/types'       │    │
  │  │ import Image, { ImageProps } from 'next/image'       │    │
  │  │                                                      │    │
  │  │ const components = {                                  │    │
  │  │   // Override built-in HTML tags:                    │    │
  │  │   h1: ({ children }) => (                            │    │
  │  │     <h1 style={{ color: 'red', fontSize: '48px' }}> │    │
  │  │       {children}                                     │    │
  │  │     </h1>                                            │    │
  │  │   ),                                                 │    │
  │  │   img: (props) => (                                  │    │
  │  │     <Image                                           │    │
  │  │       sizes="100vw"                                  │    │
  │  │       style={{ width: '100%', height: 'auto' }}      │    │
  │  │       {...(props as ImageProps)}                      │    │
  │  │     />                                               │    │
  │  │   ),                                                 │    │
  │  │ } satisfies MDXComponents                            │    │
  │  │                                                      │    │
  │  │ export function useMDXComponents(): MDXComponents {   │    │
  │  │   return components                                   │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → Mọi # heading → <h1> custom (red, 48px!)        │    │
  │  │ → Mọi ![img]() → next/Image (optimized!)           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Setup Toàn Bộ — Từ Install đến Config!

```
  SETUP MDX TRONG NEXT.JS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  BƯỚC 1: INSTALL DEPENDENCIES                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ pnpm add @next/mdx @mdx-js/loader                   │    │
  │  │          @mdx-js/react @types/mdx                    │    │
  │  │                                                      │    │
  │  │ @next/mdx      → Plugin chính cho Next.js          │    │
  │  │ @mdx-js/loader → Webpack loader cho MDX             │    │
  │  │ @mdx-js/react  → React runtime cho MDX              │    │
  │  │ @types/mdx     → TypeScript types!                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BƯỚC 2: CONFIGURE next.config.mjs                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import createMDX from '@next/mdx'                    │    │
  │  │                                                      │    │
  │  │ const nextConfig = {                                  │    │
  │  │   pageExtensions: [                                  │    │
  │  │     'js', 'jsx', 'md', 'mdx', 'ts', 'tsx'          │    │
  │  │   ],                                                 │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ const withMDX = createMDX({                           │    │
  │  │   // remarkPlugins, rehypePlugins ở đây              │    │
  │  │ })                                                   │    │
  │  │                                                      │    │
  │  │ export default withMDX(nextConfig)                    │    │
  │  │                                                      │    │
  │  │ → pageExtensions thêm 'md', 'mdx'                   │    │
  │  │ → .mdx files hoạt động như pages/routes/imports!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BƯỚC 3: TẠO mdx-components.tsx                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // mdx-components.tsx (ở ROOT project!)             │    │
  │  │ import type { MDXComponents } from 'mdx/types'       │    │
  │  │                                                      │    │
  │  │ const components: MDXComponents = {}                  │    │
  │  │                                                      │    │
  │  │ export function useMDXComponents(): MDXComponents {   │    │
  │  │   return components                                   │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ ⚠️ BẮT BUỘC cho App Router!                         │    │
  │  │ → Không có file này = @next/mdx sẽ KHÔNG hoạt động!│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẤU TRÚC FILE:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ my-project/                                          │    │
  │  │ ├── app/                                             │    │
  │  │ │   └── mdx-page/                                    │    │
  │  │ │       └── page.mdx      ← MDX page!              │    │
  │  │ ├── mdx-components.tsx    ← ROOT! BẮT BUỘC!        │    │
  │  │ ├── next.config.mjs       ← withMDX config!        │    │
  │  │ └── package.json                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. 3 Cách Render MDX!

```
  3 CÁCH RENDER MDX:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CÁCH 1: FILE-BASED ROUTING                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Dùng .mdx file trực tiếp như page!                │    │
  │  │ → Giống page.tsx nhưng viết markdown + JSX!         │    │
  │  │                                                      │    │
  │  │ app/                                                 │    │
  │  │ └── mdx-page/                                        │    │
  │  │     └── page.mdx  ← TRỰC TIẾP là page!             │    │
  │  │                                                      │    │
  │  │ // page.mdx                                          │    │
  │  │ import { MyComponent } from 'my-component'           │    │
  │  │                                                      │    │
  │  │ # Welcome to my MDX page!                            │    │
  │  │ This is some **bold** text.                          │    │
  │  │ <MyComponent />                                      │    │
  │  │                                                      │    │
  │  │ → Navigate to /mdx-page → rendered!                 │    │
  │  │ → Hỗ trợ metadata API!                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH 2: USING IMPORTS                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Import .mdx file vào page.tsx!                    │    │
  │  │ → MDX file ở bất kỳ đâu (không cần trong app/)    │    │
  │  │                                                      │    │
  │  │ markdown/                                            │    │
  │  │ └── welcome.mdx  ← Ở ngoài app/!                   │    │
  │  │                                                      │    │
  │  │ app/mdx-page/                                        │    │
  │  │ └── page.tsx                                         │    │
  │  │                                                      │    │
  │  │ // page.tsx                                          │    │
  │  │ import Welcome from '@/markdown/welcome.mdx'         │    │
  │  │                                                      │    │
  │  │ export default function Page() {                     │    │
  │  │   return <Welcome />  ← Render như component!       │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH 3: DYNAMIC IMPORTS                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Import MDX dynamically dựa trên route params!     │    │
  │  │ → Kết hợp dynamic route + generateStaticParams!     │    │
  │  │                                                      │    │
  │  │ // app/blog/[slug]/page.tsx                          │    │
  │  │ export default async function Page({ params }) {     │    │
  │  │   const { slug } = await params                      │    │
  │  │   const { default: Post } = await import(            │    │
  │  │     `@/content/${slug}.mdx`                          │    │
  │  │   )                                                  │    │
  │  │   return <Post />                                    │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ export function generateStaticParams() {             │    │
  │  │   return [                                           │    │
  │  │     { slug: 'welcome' },                             │    │
  │  │     { slug: 'about' }                                │    │
  │  │   ]                                                  │    │
  │  │ }                                                    │    │
  │  │ export const dynamicParams = false                   │    │
  │  │                                                      │    │
  │  │ → /blog/welcome → content/welcome.mdx              │    │
  │  │ → /blog/about → content/about.mdx                  │    │
  │  │ → /blog/xyz → 404! (dynamicParams = false)         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Custom Styles & Components — Global, Local, Shared!

```
  CUSTOM STYLES & COMPONENTS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Markdown → HTML elements (h1, p, ul, li, a...)             │
  │  MDX cho phép OVERRIDE các elements này!                     │
  │                                                              │
  │  CÁCH 1: GLOBAL (mdx-components.tsx) — TẤT CẢ MDX files!    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // mdx-components.tsx                                │    │
  │  │ const components = {                                  │    │
  │  │   h1: ({ children }) => (                            │    │
  │  │     <h1 style={{color:'red', fontSize:'48px'}}>      │    │
  │  │       {children}                                     │    │
  │  │     </h1>                                            │    │
  │  │   ),                                                 │    │
  │  │   img: (props) => (                                  │    │
  │  │     <Image sizes="100vw"                             │    │
  │  │       style={{width:'100%', height:'auto'}}          │    │
  │  │       {...(props as ImageProps)} />                   │    │
  │  │   ),                                                 │    │
  │  │ } satisfies MDXComponents                            │    │
  │  │                                                      │    │
  │  │ → ẢNH HƯỞNG tất cả MDX files trong app!            │    │
  │  │ → Mọi # heading → đỏ, 48px!                       │    │
  │  │ → Mọi ảnh → next/Image (optimized!)                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH 2: LOCAL (per-page) — CHỈ 1 page!                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // app/blog/page.tsx                                 │    │
  │  │ import Welcome from '@/markdown/welcome.mdx'         │    │
  │  │                                                      │    │
  │  │ function CustomH1({ children }) {                    │    │
  │  │   return <h1 style={{color:'blue', fontSize:'100px'}}│    │
  │  │     >{children}</h1>                                 │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ const overrideComponents = { h1: CustomH1 }          │    │
  │  │                                                      │    │
  │  │ export default function Page() {                     │    │
  │  │   return <Welcome                                    │    │
  │  │     components={overrideComponents}  ← LOCAL!       │    │
  │  │   />                                                 │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → Local components OVERRIDE global!                 │    │
  │  │ → Chỉ page này: h1 = blue, 100px!                  │    │
  │  │ → Các page khác: vẫn dùng global (red, 48px)!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH 3: SHARED LAYOUTS                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // app/blog/layout.tsx                               │    │
  │  │ export default function MdxLayout({                  │    │
  │  │   children                                           │    │
  │  │ }: {                                                 │    │
  │  │   children: React.ReactNode                          │    │
  │  │ }) {                                                 │    │
  │  │   return (                                           │    │
  │  │     <div style={{ color: 'blue' }}>                  │    │
  │  │       {children}                                     │    │
  │  │     </div>                                           │    │
  │  │   )                                                  │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → Dùng Next.js layout.js pattern!                   │    │
  │  │ → Share layout ACROSS MDX pages!                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ĐỘ ƯU TIÊN:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Local (per-page) > Global (mdx-components.tsx)       │    │
  │  │                                                      │    │
  │  │ → Local merge + override global!                    │    │
  │  │ → Global là fallback!                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Frontmatter + remark/rehype Plugins!

```
  FRONTMATTER + PLUGINS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FRONTMATTER:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → YAML key/value ở đầu file MDX!                   │    │
  │  │ → @next/mdx KHÔNG hỗ trợ mặc định!                 │    │
  │  │                                                      │    │
  │  │ GIẢI PHÁP:                                           │    │
  │  │ → remark-frontmatter (plugin!)                      │    │
  │  │ → remark-mdx-frontmatter                            │    │
  │  │ → gray-matter                                       │    │
  │  │                                                      │    │
  │  │ CÁCH THAY THẾ — Dùng exports:                       │    │
  │  │ ┌──────────────────────────────────────────────┐    │    │
  │  │ │ // content/blog-post.mdx                      │    │    │
  │  │ │ export const metadata = {                     │    │    │
  │  │ │   author: 'John Doe'                          │    │    │
  │  │ │ }                                             │    │    │
  │  │ │                                               │    │    │
  │  │ │ # My Blog Post                                │    │    │
  │  │ │ Content here...                               │    │    │
  │  │ └──────────────────────────────────────────────┘    │    │
  │  │                                                      │    │
  │  │ │ // page.tsx — import metadata!                     │    │
  │  │ │ import BlogPost, { metadata }                      │    │
  │  │ │   from '@/content/blog-post.mdx'                   │    │
  │  │ │                                                    │    │
  │  │ │ export default function Page() {                   │    │
  │  │ │   console.log(metadata)                            │    │
  │  │ │   // => { author: 'John Doe' }                    │    │
  │  │ │   return <BlogPost />                              │    │
  │  │ │ }                                                  │    │
  │  │                                                      │    │
  │  │ USE CASE: Blog index — iterate all posts!            │    │
  │  │ → Dùng Node fs + globby → read posts directory    │    │
  │  │ → Extract metadata → build index page!             │    │
  │  │ ⚠️ fs, globby chỉ dùng server-side!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  REMARK + REHYPE PLUGINS:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → remark = ecosystem cho MARKDOWN transform!        │    │
  │  │ → rehype = ecosystem cho HTML transform!            │    │
  │  │                                                      │    │
  │  │ VÍ DỤ: remark-gfm (GitHub Flavored Markdown!)      │    │
  │  │                                                      │    │
  │  │ // next.config.mjs                                   │    │
  │  │ import remarkGfm from 'remark-gfm'                   │    │
  │  │ import createMDX from '@next/mdx'                    │    │
  │  │                                                      │    │
  │  │ const nextConfig = {                                  │    │
  │  │   pageExtensions: [                                  │    │
  │  │     'js','jsx','md','mdx','ts','tsx'                 │    │
  │  │   ],                                                 │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ const withMDX = createMDX({                           │    │
  │  │   options: {                                         │    │
  │  │     remarkPlugins: [remarkGfm],  ← PLUGIN!         │    │
  │  │     rehypePlugins: [],                               │    │
  │  │   },                                                 │    │
  │  │ })                                                   │    │
  │  │                                                      │    │
  │  │ export default withMDX(nextConfig)                    │    │
  │  │                                                      │    │
  │  │ PLUGINS PHỔ BIẾN:                                    │    │
  │  │ → rehype-pretty-code (syntax highlighting!)         │    │
  │  │ → rehype-autolink-headings (heading links!)         │    │
  │  │ → remark-toc (table of contents!)                   │    │
  │  │                                                      │    │
  │  │ ⚠️ remark/rehype ecosystem = ESM only!              │    │
  │  │ → Phải dùng next.config.mjs hoặc .ts!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Deep Dive — Markdown → HTML Transform Pipeline!

```
  MARKDOWN → HTML TRANSFORM PIPELINE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  React KHÔNG hiểu markdown natively!                          │
  │  → Cần transform markdown plaintext → HTML!                 │
  │  → Dùng remark + rehype pipeline!                            │
  │                                                              │
  │  PIPELINE:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  "Hello, Next.js!"                                   │    │
  │  │       │                                              │    │
  │  │       ▼                                              │    │
  │  │  ┌────────────────┐                                  │    │
  │  │  │ remarkParse     │ → Convert into Markdown AST!   │    │
  │  │  └───────┬────────┘                                  │    │
  │  │          │                                           │    │
  │  │          ▼                                           │    │
  │  │  ┌────────────────┐                                  │    │
  │  │  │ remarkRehype    │ → Transform to HTML AST!       │    │
  │  │  └───────┬────────┘                                  │    │
  │  │          │                                           │    │
  │  │          ▼                                           │    │
  │  │  ┌────────────────┐                                  │    │
  │  │  │ rehypeSanitize  │ → Sanitize HTML input!         │    │
  │  │  └───────┬────────┘                                  │    │
  │  │          │                                           │    │
  │  │          ▼                                           │    │
  │  │  ┌────────────────┐                                  │    │
  │  │  │ rehypeStringify │ → Convert AST → HTML string!  │    │
  │  │  └───────┬────────┘                                  │    │
  │  │          │                                           │    │
  │  │          ▼                                           │    │
  │  │  "<p>Hello, Next.js!</p>"                            │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CODE:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { unified } from 'unified'                    │    │
  │  │ import remarkParse from 'remark-parse'               │    │
  │  │ import remarkRehype from 'remark-rehype'             │    │
  │  │ import rehypeSanitize from 'rehype-sanitize'         │    │
  │  │ import rehypeStringify from 'rehype-stringify'       │    │
  │  │                                                      │    │
  │  │ async function main() {                              │    │
  │  │   const file = await unified()                       │    │
  │  │     .use(remarkParse)     // → Markdown AST        │    │
  │  │     .use(remarkRehype)    // → HTML AST            │    │
  │  │     .use(rehypeSanitize)  // → Sanitize!           │    │
  │  │     .use(rehypeStringify) // → HTML string!        │    │
  │  │     .process('Hello, Next.js!')                      │    │
  │  │                                                      │    │
  │  │   console.log(String(file))                          │    │
  │  │   // <p>Hello, Next.js!</p>                          │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ ⚠️ Khi dùng @next/mdx → KHÔNG cần dùng trực tiếp!│    │
  │  │ → @next/mdx handle tất cả cho bạn!                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  RUST-BASED MDX COMPILER (EXPERIMENTAL!):                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ module.exports = withMDX({                           │    │
  │  │   experimental: {                                    │    │
  │  │     mdxRs: true,  ← Rust compiler!                 │    │
  │  │   },                                                 │    │
  │  │ })                                                   │    │
  │  │                                                      │    │
  │  │ Hoặc chi tiết:                                       │    │
  │  │ mdxRs: {                                             │    │
  │  │   jsxRuntime: string,     // Custom JSX runtime     │    │
  │  │   jsxImportSource: string,// Custom import source   │    │
  │  │   mdxType: 'gfm' | 'commonmark' // MDX syntax type │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ ⚠️ EXPERIMENTAL! Chưa khuyến nghị production!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Sơ Đồ Tự Vẽ — Tổng Hợp!

> **Trang docs gốc KHÔNG có diagram/hình ảnh nào (0 images).**
> Các sơ đồ dưới đây hoàn toàn tự vẽ!

### Sơ Đồ 1: MDX Full Architecture

```
  MDX ARCHITECTURE TRONG NEXT.JS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌─ SOURCE FILES ─────────────────────────────────────┐      │
  │  │                                                     │      │
  │  │  content/hello.mdx    app/blog/page.mdx             │      │
  │  │  ├── Markdown text    ├── # Title                   │      │
  │  │  ├── JSX components   ├── <Chart data={...} />     │      │
  │  │  └── export metadata  └── export metadata = {...}  │      │
  │  │                                                     │      │
  │  └──────────────────┬──────────────────────────────────┘      │
  │                     │                                         │
  │                     ▼                                         │
  │  ┌─ @next/mdx + WEBPACK LOADER ───────────────────────┐      │
  │  │                                                     │      │
  │  │  1. remarkParse     → Markdown AST                 │      │
  │  │  2. [remarkPlugins] → GFM, frontmatter...          │      │
  │  │  3. remarkRehype    → HTML AST                     │      │
  │  │  4. [rehypePlugins] → syntax highlight, links...   │      │
  │  │  5. Compile         → React Component!             │      │
  │  │                                                     │      │
  │  └──────────────────┬──────────────────────────────────┘      │
  │                     │                                         │
  │                     ▼                                         │
  │  ┌─ mdx-components.tsx ────────────────────────────────┐      │
  │  │                                                     │      │
  │  │  useMDXComponents() → {                            │      │
  │  │    h1: CustomH1,      ← Override <h1>!            │      │
  │  │    img: NextImage,     ← Override <img>!           │      │
  │  │    a: CustomLink,      ← Override <a>!            │      │
  │  │    code: CodeBlock,    ← Override <code>!          │      │
  │  │  }                                                  │      │
  │  │                                                     │      │
  │  │  → GLOBAL component mapping!                       │      │
  │  │  → Áp dụng cho TẤT CẢ MDX files!                 │      │
  │  │                                                     │      │
  │  └──────────────────┬──────────────────────────────────┘      │
  │                     │                                         │
  │                     ▼                                         │
  │  ┌─ RENDERED OUTPUT ───────────────────────────────────┐      │
  │  │                                                     │      │
  │  │  <CustomH1>Title</CustomH1>                         │      │
  │  │  <NextImage src="..." />                            │      │
  │  │  <Chart data={...} />   ← JSX component giữ!      │      │
  │  │  <p>Markdown text...</p>                            │      │
  │  │                                                     │      │
  │  └─────────────────────────────────────────────────────┘      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: Component Override Priority

```
  COMPONENT OVERRIDE PRIORITY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  # Heading in MDX                                            │
  │       │                                                      │
  │       ▼                                                      │
  │  Markdown parser tạo <h1>                                    │
  │       │                                                      │
  │       ▼                                                      │
  │  Có LOCAL override?        ──── CÓ ──→ Dùng LOCAL h1!      │
  │       │                           (color: blue, 100px)       │
  │       │ KHÔNG                                                │
  │       ▼                                                      │
  │  Có GLOBAL override        ──── CÓ ──→ Dùng GLOBAL h1!     │
  │  (mdx-components.tsx)?           (color: red, 48px)          │
  │       │                                                      │
  │       │ KHÔNG                                                │
  │       ▼                                                      │
  │  Dùng DEFAULT <h1> tag! (browser default styling!)           │
  │                                                              │
  │  THỨ TỰ: LOCAL > GLOBAL > DEFAULT                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 3: File Placement & Routing

```
  FILE PLACEMENT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  my-next-app/                                                │
  │  │                                                           │
  │  ├── mdx-components.tsx    ★ ROOT! BẮT BUỘC!               │
  │  │   └── useMDXComponents() → global component map         │
  │  │                                                           │
  │  ├── next.config.mjs       ★ withMDX() config!              │
  │  │   └── pageExtensions: ['mdx', ...]                       │
  │  │                                                           │
  │  ├── app/                                                    │
  │  │   ├── layout.tsx        Shared layout                     │
  │  │   │                                                       │
  │  │   ├── page.tsx          Homepage                          │
  │  │   │                                                       │
  │  │   ├── blog/                                               │
  │  │   │   ├── layout.tsx    Blog shared layout (optional)     │
  │  │   │   ├── page.mdx      ← FILE-BASED ROUTING!           │
  │  │   │   └── [slug]/                                         │
  │  │   │       └── page.tsx  ← DYNAMIC IMPORT!                │
  │  │   │                                                       │
  │  │   └── docs/                                               │
  │  │       └── page.tsx      ← IMPORT from markdown/          │
  │  │                                                           │
  │  ├── content/              MDX content files                 │
  │  │   ├── welcome.mdx       (dynamic import target)           │
  │  │   └── about.mdx         (dynamic import target)           │
  │  │                                                           │
  │  └── markdown/             MDX import files                  │
  │      └── welcome.mdx       (static import target)            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — MDXEngine!

```javascript
/**
 * MDXEngine — Mô phỏng Next.js MDX System!
 * Tự viết bằng tay, KHÔNG dùng thư viện nào!
 * Covers: markdown parsing, component mapping,
 *         priority resolution, rendering pipeline
 */
var MDXEngine = (function () {

  // ═══════════════════════════════════
  // 1. SIMPLE MARKDOWN PARSER
  // ═══════════════════════════════════
  function parseMarkdown(mdxContent) {
    var lines = mdxContent.split('\n');
    var ast = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line === '') continue;

      // Headings
      if (line.match(/^### /)) {
        ast.push({ type: 'h3', content: line.replace(/^### /, ''), line: i + 1 });
      } else if (line.match(/^## /)) {
        ast.push({ type: 'h2', content: line.replace(/^## /, ''), line: i + 1 });
      } else if (line.match(/^# /)) {
        ast.push({ type: 'h1', content: line.replace(/^# /, ''), line: i + 1 });
      }
      // Lists
      else if (line.match(/^- /)) {
        ast.push({ type: 'li', content: line.replace(/^- /, ''), line: i + 1 });
      }
      // JSX components (detect <Component />)
      else if (line.match(/^<[A-Z]/)) {
        ast.push({ type: 'jsx', content: line, line: i + 1 });
      }
      // Imports
      else if (line.match(/^import /)) {
        ast.push({ type: 'import', content: line, line: i + 1 });
      }
      // Exports
      else if (line.match(/^export /)) {
        ast.push({ type: 'export', content: line, line: i + 1 });
      }
      // Paragraph
      else {
        ast.push({ type: 'p', content: line, line: i + 1 });
      }
    }

    return { nodes: ast, totalNodes: ast.length };
  }

  // ═══════════════════════════════════
  // 2. COMPONENT MAP RESOLVER
  // ═══════════════════════════════════
  function resolveComponentMap(globalComponents, localComponents) {
    var merged = {};

    // Start with global
    for (var key in globalComponents) {
      merged[key] = {
        component: globalComponents[key],
        source: 'GLOBAL (mdx-components.tsx)'
      };
    }

    // Override with local
    if (localComponents) {
      for (var lKey in localComponents) {
        merged[lKey] = {
          component: localComponents[lKey],
          source: 'LOCAL (per-page override!)',
          overrides: merged[lKey] ? 'GLOBAL' : null
        };
      }
    }

    return merged;
  }

  // ═══════════════════════════════════
  // 3. RENDER PIPELINE
  // ═══════════════════════════════════
  function renderPipeline(mdxContent, componentMap) {
    var ast = parseMarkdown(mdxContent);
    var output = [];

    for (var i = 0; i < ast.nodes.length; i++) {
      var node = ast.nodes[i];

      if (node.type === 'import' || node.type === 'export') {
        output.push({
          type: node.type,
          content: node.content,
          rendered: false,
          note: 'Handled by bundler, not rendered as HTML!'
        });
        continue;
      }

      if (node.type === 'jsx') {
        output.push({
          type: 'jsx',
          content: node.content,
          rendered: true,
          note: 'React component — rendered as-is!'
        });
        continue;
      }

      // Check component map for override
      var hasOverride = componentMap && componentMap[node.type];
      output.push({
        type: node.type,
        content: node.content,
        htmlTag: '<' + node.type + '>',
        customComponent: hasOverride
          ? componentMap[node.type].source
          : 'DEFAULT (browser default!)',
        rendered: true
      });
    }

    return {
      totalNodes: ast.nodes.length,
      renderedNodes: output.filter(function (n) { return n.rendered; }).length,
      output: output
    };
  }

  // ═══════════════════════════════════
  // 4. FILE STRUCTURE VALIDATOR
  // ═══════════════════════════════════
  function validateSetup(files) {
    var issues = [];
    var hasMdxComponents = false;
    var hasNextConfig = false;
    var hasMdxFiles = false;

    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (f.match(/mdx-components\.(tsx|js)$/)) hasMdxComponents = true;
      if (f.match(/next\.config\.(mjs|ts|js)$/)) hasNextConfig = true;
      if (f.match(/\.(mdx|md)$/)) hasMdxFiles = true;
    }

    if (!hasMdxComponents) {
      issues.push({
        severity: 'ERROR',
        message: 'mdx-components.tsx MISSING! @next/mdx sẽ KHÔNG hoạt động!'
      });
    }
    if (!hasNextConfig) {
      issues.push({
        severity: 'WARNING',
        message: 'next.config.mjs không tìm thấy — cần withMDX config!'
      });
    }
    if (!hasMdxFiles) {
      issues.push({
        severity: 'INFO',
        message: 'Không có .mdx files — chưa cần MDX setup!'
      });
    }

    return {
      valid: issues.filter(function (i) { return i.severity === 'ERROR'; }).length === 0,
      issues: issues,
      hasMdxComponents: hasMdxComponents,
      hasNextConfig: hasNextConfig,
      hasMdxFiles: hasMdxFiles
    };
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  MDX ENGINE — DEMO                        ║');
    console.log('╚══════════════════════════════════════════╝');

    // 1. Parse MDX
    console.log('\n─── 1. PARSE MDX ───');
    var mdx = [
      'import { Chart } from "./Chart"',
      '# Welcome to My Blog',
      'This is some **bold** text.',
      '- Item one',
      '- Item two',
      '<Chart data={sampleData} />',
      'export const metadata = { author: "Jane" }'
    ].join('\n');
    console.log(JSON.stringify(parseMarkdown(mdx), null, 2));

    // 2. Component Map
    console.log('\n─── 2. COMPONENT MAP ───');
    var global = { h1: 'RedH1', img: 'NextImage' };
    var local = { h1: 'BlueH1' };
    console.log(JSON.stringify(
      resolveComponentMap(global, local), null, 2));

    // 3. Render Pipeline
    console.log('\n─── 3. RENDER PIPELINE ───');
    var map = resolveComponentMap(global, null);
    console.log(JSON.stringify(renderPipeline(mdx, map), null, 2));

    // 4. Validate Setup
    console.log('\n─── 4. VALIDATE SETUP ───');
    console.log('Valid:', JSON.stringify(validateSetup([
      'mdx-components.tsx', 'next.config.mjs',
      'app/blog/page.mdx'
    ]), null, 2));
    console.log('Invalid:', JSON.stringify(validateSetup([
      'next.config.mjs', 'app/page.tsx'
    ]), null, 2));

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                         ║');
    console.log('╚══════════════════════════════════════════╝');
  }

  return {
    parseMarkdown: parseMarkdown,
    resolveComponentMap: resolveComponentMap,
    renderPipeline: renderPipeline,
    validateSetup: validateSetup,
    demo: demo
  };
})();

// Chạy: MDXEngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

### ❓ Câu 1: mdx-components.tsx có bắt buộc không?

**Trả lời:**

**CÓ!** mdx-components.tsx **BẮT BUỘC** khi dùng `@next/mdx` với App Router!

- Không có file này → `@next/mdx` **KHÔNG hoạt động**!
- Phải đặt ở **root** project (cùng level `app/`, `pages/`, hoặc trong `src/`)
- Phải export function `useMDXComponents()`

### ❓ Câu 2: useMDXComponents nhận arguments gì?

**Trả lời:**

**KHÔNG!** `useMDXComponents()` không nhận **bất kỳ argument nào**.

- Trả về `MDXComponents` object
- Object này map HTML tags → custom React components
- Ví dụ: `{ h1: CustomH1, img: NextImage }`

### ❓ Câu 3: Local component override Global component thế nào?

**Trả lời:**

**Local MERGE + OVERRIDE Global!**

```
Priority: LOCAL > GLOBAL > DEFAULT

// Global (mdx-components.tsx):  h1 = Red, 48px
// Local (per-page):             h1 = Blue, 100px

// Kết quả cho page đó: h1 = Blue, 100px (LOCAL wins!)
// Các page khác:        h1 = Red, 48px (GLOBAL!)
```

Truyền local components qua `components` prop:
```jsx
<Welcome components={overrideComponents} />
```

### ❓ Câu 4: Sự khác biệt 3 cách render MDX?

**Trả lời:**

| Cách | File | Use Case |
|---|---|---|
| **File-based routing** | `app/blog/page.mdx` | MDX trực tiếp là page! Đơn giản nhất! |
| **Import** | `import Mdx from './content.mdx'` | MDX ở nơi khác, import vào page.tsx |
| **Dynamic import** | `await import(\`@/content/\${slug}.mdx\`)` | Dynamic routing + generateStaticParams! |

### ❓ Câu 5: @next/mdx hỗ trợ frontmatter không?

**Trả lời:**

**KHÔNG** mặc định! Cần plugins:
- `remark-frontmatter`
- `remark-mdx-frontmatter`
- `gray-matter`

**Cách thay thế**: Dùng JavaScript `export` trực tiếp trong MDX:
```mdx
export const metadata = { author: 'John Doe' }

# My Post
```
Rồi import:
```tsx
import Post, { metadata } from '@/content/post.mdx'
```

### ❓ Câu 6: Transform pipeline markdown → HTML gồm mấy bước?

**Trả lời:**

**4 bước** qua unified ecosystem:

1. **remarkParse** — Convert markdown → Markdown AST
2. **remarkRehype** — Transform Markdown AST → HTML AST
3. **rehypeSanitize** — Sanitize HTML (bảo mật!)
4. **rehypeStringify** — Convert HTML AST → HTML string

⚠️ Khi dùng `@next/mdx` → KHÔNG cần dùng trực tiếp! Plugin handle tất cả!

---

> 🎯 **Tổng kết**: Guide phân tích TOÀN BỘ trang `mdx-components.js` + MDX Guide:
> - **0 hình ảnh** trong trang gốc (chỉ text + code blocks)
> - **3 sơ đồ tự vẽ**: MDX architecture, component override priority, file placement
> - **MDXEngine** tự viết với 4 functions mô phỏng (parser, component resolver, render pipeline, validator)
> - **6 câu hỏi luyện tập** với đáp án chi tiết
> - **Bổ sung**: Setup (install, config, structure), 3 cách render, custom styles (global/local/shared), frontmatter, remark/rehype plugins, Rust compiler (experimental)
> - **Version History**: v13.1.2 (mdx-components introduced)
