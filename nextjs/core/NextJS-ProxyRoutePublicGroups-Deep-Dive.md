# Next.js proxy.js + public + route.js + Route Groups — Deep Dive!

> **Chủ đề**: 4 File Conventions: proxy.js, public folder, route.js, Route Groups
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: 4 trang docs Next.js
> **Hình ảnh**: proxy (0), public (0), route (0), Route Groups (1 diagram)

---

## Mục Lục

**PHẦN A — proxy.js**
1. [§1. proxy.js — Tổng Quan](#1)
2. [§2. Exports — Proxy Function + Config + Matcher](#2)
3. [§3. NextResponse + Execution Order + Runtime](#3)
4. [§4. Examples — Cookies, Headers, CORS, Response](#4)
5. [§5. Migration — Middleware → Proxy](#5)

**PHẦN B — public Folder**
6. [§6. public Folder — Static Files](#6)

**PHẦN C — route.js**
7. [§7. route.js — Route Handlers](#7)
8. [§8. HTTP Methods + Parameters + RouteContext](#8)
9. [§9. Examples — Cookies, Headers, Streaming, FormData](#9)

**PHẦN D — Route Groups**
10. [§10. Route Groups — (folderName) Convention](#10)
11. [§11. Phân Tích Hình Gốc — Route Groups Diagram](#11)

**PHẦN E — Tổng Hợp**
12. [§12. Sơ Đồ Tự Vẽ](#12)
13. [§13. Tự Viết — CombinedEngine](#13)
14. [§14. Câu Hỏi Luyện Tập](#14)

---

# PHẦN A — proxy.js (Middleware → Proxy!)

## §1. proxy.js — Tổng Quan!

```
  proxy.js — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                 │
  │  proxy.js (trước đây: middleware.js) chạy code trên          │
  │  SERVER TRƯỚC KHI request được hoàn thành!                   │
  │                                                              │
  │  ⚠️ middleware.js DEPRECATED → đổi thành proxy.js!           │
  │                                                              │
  │  CHỨC NĂNG:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ • REDIRECT incoming request tới URL khác!           │    │
  │  │ • REWRITE response (hiển thị URL khác!)             │    │
  │  │ • MODIFY request/response headers!                  │    │
  │  │ • SET/READ cookies!                                 │    │
  │  │ • RESPOND trực tiếp (return Response!)              │    │
  │  │ • Authentication, logging, CORS, etc.!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VỊ TRÍ FILE:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ project-root/                                        │    │
  │  │ ├── proxy.ts    ← CÙNG CẤP với app/ hoặc pages/!  │    │
  │  │ ├── app/                                             │    │
  │  │ └── pages/                                           │    │
  │  │                                                      │    │
  │  │ HOẶC: src/proxy.ts (nếu dùng src/)                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GOOD TO KNOW:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ • Proxy chạy TÁCH BIỆT khỏi render code!           │    │
  │  │ • Có thể deploy tới CDN cho fast redirect!          │    │
  │  │ • KHÔNG dùng shared modules/globals!                │    │
  │  │ • Truyền data qua: headers, cookies, rewrites,     │    │
  │  │   redirects, hoặc URL!                               │    │
  │  │ • Chỉ 1 proxy file per project!                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CODE CƠ BẢN:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { NextResponse, NextRequest }                 │    │
  │  │   from 'next/server'                                 │    │
  │  │                                                      │    │
  │  │ export function proxy(request: NextRequest) {        │    │
  │  │   return NextResponse.redirect(                      │    │
  │  │     new URL('/home', request.url)                    │    │
  │  │   )                                                  │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ export const config = {                              │    │
  │  │   matcher: '/about/:path*',                          │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Exports — Proxy Function + Config + Matcher!

```
  EXPORTS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① PROXY FUNCTION:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Export 1 function duy nhất!                       │    │
  │  │ → Default export HOẶC named "proxy"!                │    │
  │  │ → KHÔNG hỗ trợ multiple proxy!                     │    │
  │  │                                                      │    │
  │  │ export default function proxy(request) { ... }       │    │
  │  │ // HOẶC                                              │    │
  │  │ export function proxy(request) { ... }               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② CONFIG + MATCHER:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ matcher = CHỈ ĐỊNH paths nào proxy chạy!            │    │
  │  │                                                      │    │
  │  │ Single path:                                         │    │
  │  │ matcher: '/about'                                    │    │
  │  │                                                      │    │
  │  │ Multiple paths:                                      │    │
  │  │ matcher: ['/about', '/dashboard/:path*']             │    │
  │  │                                                      │    │
  │  │ Regex (negative lookahead — exclude!):               │    │
  │  │ matcher: ['/((?!api|_next/static|_next/image|        │    │
  │  │   favicon.ico|sitemap.xml|robots.txt).*)']           │    │
  │  │                                                      │    │
  │  │ Advanced object:                                     │    │
  │  │ matcher: [{                                          │    │
  │  │   source: '/api/:path*',                             │    │
  │  │   locale: false,                                     │    │
  │  │   has: [{ type:'header', key:'Authorization' }],     │    │
  │  │   missing: [{ type:'cookie', key:'session' }]        │    │
  │  │ }]                                                   │    │
  │  │                                                      │    │
  │  │ SOURCE PATH RULES:                                   │    │
  │  │ 1. PHẢI bắt đầu bằng /                              │    │
  │  │ 2. Named params: /about/:path → match /about/a     │    │
  │  │ 3. Modifiers: * (0+), ? (0-1), + (1+)              │    │
  │  │ 4. Regex: /about/(.*) = /about/:path*               │    │
  │  │ 5. Anchored to start: /about match /about/team     │    │
  │  │                                                      │    │
  │  │ ⚠️ Matcher values = CONSTANTS (build-time)!          │    │
  │  │ ⚠️ _next/data routes vẫn chạy proxy dù excluded!   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. NextResponse + Execution Order + Runtime!

```
  NEXTRESPONSE + EXECUTION ORDER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  NEXTRESPONSE API:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → redirect: chuyển request tới URL khác!            │    │
  │  │ → rewrite: hiển thị URL khác (URL bar giữ nguyên!) │    │
  │  │ → Set request headers cho API Routes, SSR!          │    │
  │  │ → Set response cookies!                              │    │
  │  │ → Set response headers!                              │    │
  │  │ → Return Response/NextResponse trực tiếp!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EXECUTION ORDER (THỨ TỰ THỰC THI):                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1. headers (next.config.js)                          │    │
  │  │ 2. redirects (next.config.js)                        │    │
  │  │ 3. ★ PROXY (rewrites, redirects!)              ★   │    │
  │  │ 4. beforeFiles (rewrites, next.config.js)            │    │
  │  │ 5. Filesystem routes (public/, _next/static/,       │    │
  │  │    pages/, app/)                                     │    │
  │  │ 6. afterFiles (rewrites, next.config.js)             │    │
  │  │ 7. Dynamic Routes (/blog/[slug])                     │    │
  │  │ 8. fallback (rewrites, next.config.js)               │    │
  │  │                                                      │    │
  │  │ → Proxy ở VỊ TRÍ 3! Sau config headers/redirects! │    │
  │  │ → TRƯỚC filesystem routes!                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  RUNTIME:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Mặc định: Node.js runtime!                       │    │
  │  │ → KHÔNG thể set runtime config trong proxy file!    │    │
  │  │ → Set runtime = ERROR!                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ADVANCED FLAGS:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ skipTrailingSlashRedirect:                           │    │
  │  │ → Tắt auto trailing slash redirect!                 │    │
  │  │ → Custom handling trong proxy!                      │    │
  │  │                                                      │    │
  │  │ skipMiddlewareUrlNormalize:                          │    │
  │  │ → Tắt URL normalization!                            │    │
  │  │ → Direct visits = client transitions!               │    │
  │  │ → Full control over original URL!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Examples — Cookies, Headers, CORS!

```
  PROXY EXAMPLES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  EX 1: CONDITIONAL REWRITE                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ export function proxy(request: NextRequest) {        │    │
  │  │   if (request.nextUrl.pathname.startsWith('/about')) │    │
  │  │     return NextResponse.rewrite(                     │    │
  │  │       new URL('/about-2', request.url))              │    │
  │  │   if (request.nextUrl.pathname.startsWith('/dash'))  │    │
  │  │     return NextResponse.rewrite(                     │    │
  │  │       new URL('/dashboard/user', request.url))       │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EX 2: COOKIES                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ REQUEST cookies: get, getAll, set, delete, has, clear│    │
  │  │ RESPONSE cookies: get, getAll, set, delete           │    │
  │  │                                                      │    │
  │  │ // Read cookie                                       │    │
  │  │ let cookie = request.cookies.get('nextjs')           │    │
  │  │ // → { name: 'nextjs', value: 'fast', Path: '/' }  │    │
  │  │                                                      │    │
  │  │ // Set cookie on response                            │    │
  │  │ const response = NextResponse.next()                 │    │
  │  │ response.cookies.set('vercel', 'fast')               │    │
  │  │ return response                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EX 3: SETTING HEADERS                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Request headers → upstream                       │    │
  │  │ const requestHeaders = new Headers(request.headers)  │    │
  │  │ requestHeaders.set('x-custom', 'hello')              │    │
  │  │ const response = NextResponse.next({                 │    │
  │  │   request: { headers: requestHeaders }               │    │
  │  │ })                                                   │    │
  │  │ // Response headers → client                        │    │
  │  │ response.headers.set('x-response', 'hello')          │    │
  │  │                                                      │    │
  │  │ ⚠️ NextResponse.next({ request: { headers } })      │    │
  │  │    → headers cho UPSTREAM (server)!                  │    │
  │  │ ⚠️ NextResponse.next({ headers })                    │    │
  │  │    → headers cho CLIENT! (KHÁC!)                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EX 4: CORS                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Check origin → allowedOrigins list!               │    │
  │  │ → Handle preflight (OPTIONS) riêng!                 │    │
  │  │ → Set Access-Control-Allow-* headers!               │    │
  │  │ → matcher: '/api/:path*' (chỉ cho API!)            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EX 5: PRODUCE RESPONSE DIRECTLY                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ if (!isAuthenticated(request)) {                     │    │
  │  │   return Response.json(                              │    │
  │  │     { success: false, message: 'auth failed' },      │    │
  │  │     { status: 401 }                                  │    │
  │  │   )                                                  │    │
  │  │ }                                                    │    │
  │  │ → Return Response/NextResponse trực tiếp!           │    │
  │  │ → Từ v13.1.0!                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EX 6: waitUntil + NextFetchEvent                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ export function proxy(req, event: NextFetchEvent) {  │    │
  │  │   event.waitUntil(                                   │    │
  │  │     fetch('https://analytics.com', {                 │    │
  │  │       method: 'POST',                                │    │
  │  │       body: JSON.stringify({                         │    │
  │  │         pathname: req.nextUrl.pathname               │    │
  │  │       })                                             │    │
  │  │     })                                               │    │
  │  │   )                                                  │    │
  │  │   return NextResponse.next()                         │    │
  │  │ }                                                    │    │
  │  │ → Background work! Response gửi trước!             │    │
  │  │ → Analytics, logging trong background!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Migration — Middleware → Proxy!

```
  MIGRATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHY RENAME?                                                  │
  │  → "middleware" hay bị nhầm với Express.js middleware!       │
  │  → "proxy" mô tả đúng hơn: network boundary trước app!     │
  │  → Proxy có thể chạy ở Edge, gần client, tách app!         │
  │                                                              │
  │  HOW TO MIGRATE:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ npx @next/codemod@canary middleware-to-proxy .       │    │
  │  │                                                      │    │
  │  │ // middleware.ts → proxy.ts                         │    │
  │  │ - export function middleware() {                     │    │
  │  │ + export function proxy() {                          │    │
  │  │                                                      │    │
  │  │ → Codemod tự đổi file name + function name!        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

# PHẦN B — public Folder

## §6. public Folder — Static Files!

```
  public FOLDER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                 │
  │  → Serve STATIC FILES (images, fonts, etc.)!                 │
  │  → Folder "public" ở root directory!                         │
  │  → Files referenced từ base URL (/)!                         │
  │                                                              │
  │  VÍ DỤ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ public/avatars/me.png → /avatars/me.png             │    │
  │  │                                                      │    │
  │  │ import Image from 'next/image'                       │    │
  │  │                                                      │    │
  │  │ export function Avatar({ id, alt }) {                │    │
  │  │   return (                                           │    │
  │  │     <Image                                           │    │
  │  │       src={`/avatars/${id}.png`}                     │    │
  │  │       alt={alt}                                      │    │
  │  │       width="64"                                     │    │
  │  │       height="64"                                    │    │
  │  │     />                                               │    │
  │  │   )                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CACHING:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Next.js KHÔNG THỂ cache safely!                   │    │
  │  │ → Files có thể thay đổi!                            │    │
  │  │ → Default header:                                    │    │
  │  │   Cache-Control: public, max-age=0                   │    │
  │  │ → max-age=0 = KHÔNG cache! Luôn fetch mới!         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ROBOTS, FAVICONS:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → robots.txt, favicon.ico → NÊN dùng special       │    │
  │  │   metadata files trong app/ thay vì public/!        │    │
  │  │ → app/favicon.ico, app/robots.ts → auto handled!   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

# PHẦN C — route.js (Route Handlers!)

## §7. route.js — Route Handlers!

```
  route.js — ROUTE HANDLERS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                 │
  │  → Tạo custom request handlers cho given route!              │
  │  → Dùng Web Request + Response APIs!                         │
  │  → Thay thế API Routes trong Pages Router!                  │
  │                                                              │
  │  CODE CƠ BẢN:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // app/api/hello/route.ts                            │    │
  │  │ export async function GET() {                        │    │
  │  │   return Response.json({ message: 'Hello World' })   │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ĐẶC ĐIỂM:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ • Dùng Web standard Request/Response!               │    │
  │  │ • KHÔNG cần bodyParser!                              │    │
  │  │ • Supports: GET, POST, PUT, PATCH, DELETE,          │    │
  │  │   HEAD, OPTIONS!                                     │    │
  │  │ • OPTIONS auto-implement nếu không define!          │    │
  │  │ • Có thể dùng NextRequest cho extra features!       │    │
  │  │ • Cùng route segment config như pages/layouts!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. HTTP Methods + Parameters + RouteContext!

```
  REFERENCE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  HTTP METHODS:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ export async function GET(request) {}                │    │
  │  │ export async function POST(request) {}               │    │
  │  │ export async function PUT(request) {}                │    │
  │  │ export async function PATCH(request) {}              │    │
  │  │ export async function DELETE(request) {}             │    │
  │  │ export async function HEAD(request) {}               │    │
  │  │ export async function OPTIONS(request) {}            │    │
  │  │                                                      │    │
  │  │ → OPTIONS auto: set Allow header từ defined methods!│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PARAMETERS:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① request (optional): NextRequest instance!         │    │
  │  │   → .cookies, .nextUrl, .headers...                 │    │
  │  │                                                      │    │
  │  │ ② context (optional): { params: Promise<...> }      │    │
  │  │   → Dynamic route parameters!                       │    │
  │  │                                                      │    │
  │  │ BẢNG VÍ DỤ:                                          │    │
  │  │ ┌──────────────────────────┬─────────┬────────────┐ │    │
  │  │ │ Route                   │ URL     │ params     │ │    │
  │  │ ├──────────────────────────┼─────────┼────────────┤ │    │
  │  │ │ app/dashboard/[team]/   │/dash/1  │{team:'1'}  │ │    │
  │  │ │ route.js                │         │            │ │    │
  │  │ ├──────────────────────────┼─────────┼────────────┤ │    │
  │  │ │ app/shop/[tag]/[item]/  │/shop/1/2│{tag:'1',   │ │    │
  │  │ │ route.js                │         │ item:'2'}  │ │    │
  │  │ ├──────────────────────────┼─────────┼────────────┤ │    │
  │  │ │ app/blog/[...slug]/     │/blog/1/2│{slug:      │ │    │
  │  │ │ route.js                │         │ ['1','2']} │ │    │
  │  │ └──────────────────────────┴─────────┴────────────┘ │    │
  │  │                                                      │    │
  │  │ → params = PROMISE (v15)! Phải await!               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ROUTECONTEXT HELPER:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ export async function GET(                           │    │
  │  │   _req: NextRequest,                                 │    │
  │  │   ctx: RouteContext<'/users/[id]'>                   │    │
  │  │ ) {                                                  │    │
  │  │   const { id } = await ctx.params                    │    │
  │  │   return Response.json({ id })                       │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → Globally available! KHÔNG cần import!             │    │
  │  │ → Types generated: next dev/build/typegen!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Examples!

```
  ROUTE HANDLER EXAMPLES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  EX 1: COOKIES                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { cookies } from 'next/headers'               │    │
  │  │ export async function GET() {                        │    │
  │  │   const cookieStore = await cookies()                │    │
  │  │   const a = cookieStore.get('a')                     │    │
  │  │   cookieStore.set('b', '1')                          │    │
  │  │   cookieStore.delete('c')                            │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EX 2: STREAMING (AI/LLM!)                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { openai } from '@ai-sdk/openai'              │    │
  │  │ import { StreamingTextResponse, streamText } from 'ai│    │
  │  │ export async function POST(req) {                    │    │
  │  │   const { messages } = await req.json()              │    │
  │  │   const result = await streamText({                  │    │
  │  │     model: openai('gpt-4-turbo'), messages           │    │
  │  │   })                                                 │    │
  │  │   return new StreamingTextResponse(                  │    │
  │  │     result.toAIStream())                             │    │
  │  │ }                                                    │    │
  │  │ → Streaming cho AI-generated content!               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EX 3: FORMDATA                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ export async function POST(request) {                │    │
  │  │   const formData = await request.formData()          │    │
  │  │   const name = formData.get('name')                  │    │
  │  │   return Response.json({ name })                     │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EX 4: REVALIDATE CACHED DATA                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ export const revalidate = 60 // 60 seconds!         │    │
  │  │ export async function GET() {                        │    │
  │  │   const data = await fetch('https://api/blog')       │    │
  │  │   return Response.json(await data.json())            │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EX 5: NON-UI RESPONSES (RSS, XML!)                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ export async function GET() {                        │    │
  │  │   return new Response(`<?xml ...><rss>...</rss>`, {  │    │
  │  │     headers: { 'Content-Type': 'text/xml' }          │    │
  │  │   })                                                 │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SEGMENT CONFIG OPTIONS:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ export const dynamic = 'auto'                        │    │
  │  │ export const dynamicParams = true                    │    │
  │  │ export const revalidate = false                      │    │
  │  │ export const fetchCache = 'auto'                     │    │
  │  │ export const runtime = 'nodejs'                      │    │
  │  │ export const preferredRegion = 'auto'                │    │
  │  │ → Cùng config như pages/layouts!                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

# PHẦN D — Route Groups

## §10. Route Groups — (folderName)!

```
  ROUTE GROUPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                 │
  │  → Folder convention: (folderName) — dấu ngoặc đơn!        │
  │  → Tổ chức routes theo category/team!                        │
  │  → KHÔNG ảnh hưởng URL path!                                │
  │                                                              │
  │  CONVENTION:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ app/(admin)/dashboard/page.js → URL: /dashboard     │    │
  │  │ app/(marketing)/about/page.js → URL: /about         │    │
  │  │ app/(marketing)/blog/page.js  → URL: /blog          │    │
  │  │                                                      │    │
  │  │ (admin) và (marketing) BỊ LOẠI BỎ khỏi URL!        │    │
  │  │ Chỉ dùng để tổ chức code!                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  USE CASES:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1. Organize routes by team/concern/feature!         │    │
  │  │    → (admin)/, (marketing)/, (shop)/                │    │
  │  │                                                      │    │
  │  │ 2. Multiple ROOT LAYOUTS!                            │    │
  │  │    → app/(shop)/layout.js ← root layout 1!         │    │
  │  │    → app/(marketing)/layout.js ← root layout 2!    │    │
  │  │                                                      │    │
  │  │ 3. Opt segments into SHARED layout!                  │    │
  │  │    → Chỉ group nào share layout, group khác không!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ CAVEATS:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1. FULL PAGE LOAD khi navigate giữa                 │    │
  │  │    DIFFERENT root layouts!                           │    │
  │  │    /cart (shop layout) → /blog (marketing layout)   │    │
  │  │    = FULL RELOAD!                                    │    │
  │  │                                                      │    │
  │  │ 2. CONFLICTING PATHS = ERROR!                       │    │
  │  │    (marketing)/about/page.js +                       │    │
  │  │    (shop)/about/page.js → cả 2 = /about → ERROR!  │    │
  │  │                                                      │    │
  │  │ 3. Không có top-level layout.js?                     │    │
  │  │    → Home route (/) PHẢI nằm trong 1 group!        │    │
  │  │    → app/(marketing)/page.js                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. Phân Tích Hình Gốc — Route Groups Diagram!

> **Trang gốc có 1 diagram** cho Route Groups. 3 trang còn lại KHÔNG có hình.

```
  HÌNH GỐC — ROUTE GROUPS FILE STRUCTURE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MÔ TẢ:                                                       │
  │  Sơ đồ minh họa file tree → URL mapping!                    │
  │  (folderName) bị loại bỏ khỏi URL!                          │
  │                                                              │
  │  BÊN TRÁI — File Tree:       BÊN PHẢI — URL:               │
  │  ┌─────────────────────────┐  ┌────────────────────────┐    │
  │  │ app/                    │  │                        │    │
  │  │ ├── (admin)       ●     │  │                        │    │
  │  │ │   └── dashboard/      │  │                        │    │
  │  │ │       └── page.js ──────→│ /dashboard             │    │
  │  │ │                       │  │                        │    │
  │  │ ├── (marketing)   ●     │  │                        │    │
  │  │ │   ├── about/          │  │                        │    │
  │  │ │   │   └── page.js ──────→│ /about                 │    │
  │  │ │   └── blog/           │  │                        │    │
  │  │ │       └── page.js ──────→│ /blog                  │    │
  │  │ │                       │  │                        │    │
  │  └─────────────────────────┘  └────────────────────────┘    │
  │                                                              │
  │  Chấm XANH (●): đánh dấu route groups!                      │
  │                                                              │
  │  Mũi tên (→): FILE → URL mapping!                          │
  │  → (admin) bị BỎ: dashboard/page.js → /dashboard           │
  │  → (marketing) bị BỎ: about/page.js → /about              │
  │  → (marketing) bị BỎ: blog/page.js → /blog                │
  │                                                              │
  │  Ý NGHĨA:                                                    │
  │  → Route groups = TỔ CHỨC CODE, không ảnh hưởng routing!  │
  │  → Mỗi group có thể có LAYOUT RIÊNG!                       │
  │  → Groups cho phép organize by team/feature!                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

# PHẦN E — Tổng Hợp!

## §12. Sơ Đồ Tự Vẽ!

### Sơ Đồ 1: Request Lifecycle (proxy → route!)

```
  REQUEST LIFECYCLE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CLIENT REQUEST                                              │
  │       │                                                      │
  │       ▼                                                      │
  │  ┌─── PROXY.JS ─────────────────────────────────────────┐   │
  │  │ • Check matcher → path match?                        │   │
  │  │ • Auth check? Redirect? Rewrite? CORS?               │   │
  │  │ • Modify headers/cookies?                             │   │
  │  │ • Return Response trực tiếp?                         │   │
  │  └──────────┬────────────────────────────────────────────┘   │
  │             │ (NextResponse.next() → continue!)             │
  │             ▼                                                │
  │  ┌─── FILESYSTEM ROUTES ─────────────────────────────────┐  │
  │  │                                                        │  │
  │  │  public/ → static files (images, fonts...)            │  │
  │  │  app/    → pages, layouts, route handlers             │  │
  │  │                                                        │  │
  │  │  ┌──────────────────┐  ┌──────────────────────────┐   │  │
  │  │  │ page.js          │  │ route.js                 │   │  │
  │  │  │ → UI rendering! │  │ → API handler!           │   │  │
  │  │  │ → Server/Client │  │ → GET, POST, PUT...     │   │  │
  │  │  │ → HTML response │  │ → JSON/XML response     │   │  │
  │  │  └──────────────────┘  └──────────────────────────┘   │  │
  │  │                                                        │  │
  │  │  ⚠️ page.js + route.js KHÔNG THỂ ở cùng route!       │  │
  │  │     /api/route.js ✅  |  /api/page.js ✅              │  │
  │  │     /api/route.js + /api/page.js ❌ (conflict!)       │  │
  │  │                                                        │  │
  │  └────────────────────────────────────────────────────────┘  │
  │             │                                                │
  │             ▼                                                │
  │  CLIENT RESPONSE                                             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: Route Groups vs @Slots vs (.)Intercept

```
  FILE CONVENTION COMPARISON:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Convention      │ Syntax     │ URL Impact │ Purpose         │
  │  ────────────────┼────────────┼────────────┼─────────────── │
  │  Route Groups    │ (folder)   │ REMOVED!   │ Organize code  │
  │                  │            │            │ Multiple layouts│
  │  ────────────────┼────────────┼────────────┼─────────────── │
  │  Parallel Routes │ @folder    │ REMOVED!   │ Simultaneous   │
  │                  │            │            │ rendering      │
  │  ────────────────┼────────────┼────────────┼─────────────── │
  │  Intercepting    │ (.)folder  │ Intercepts!│ Modal pattern  │
  │  Routes          │ (..)folder │            │                │
  │  ────────────────┼────────────┼────────────┼─────────────── │
  │  Dynamic Routes  │ [folder]   │ INCLUDED!  │ Dynamic params │
  │                  │ [...folder]│            │                │
  │  ────────────────┼────────────┼────────────┼─────────────── │
  │                                                              │
  │  → (parentheses): Route Groups — organizational only!      │
  │  → @at-sign: Parallel slots — render simultaneously!       │
  │  → [brackets]: Dynamic segments — URL params!              │
  │  → (.)dot: Intercepting — modal/overlay patterns!          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 3: public/ Folder Mapping

```
  PUBLIC FOLDER MAPPING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PROJECT ROOT:                                               │
  │  ┌──────────────────────┐    ┌──────────────────────────┐   │
  │  │ public/              │    │ URL MAPPING:             │   │
  │  │ ├── avatars/         │    │                          │   │
  │  │ │   └── me.png ──────│────│→ /avatars/me.png         │   │
  │  │ ├── images/          │    │                          │   │
  │  │ │   └── hero.jpg ────│────│→ /images/hero.jpg        │   │
  │  │ ├── fonts/           │    │                          │   │
  │  │ │   └── inter.woff2 ─│────│→ /fonts/inter.woff2      │   │
  │  │ └── favicon.ico ─────│────│→ /favicon.ico            │   │
  │  └──────────────────────┘    └──────────────────────────┘   │
  │                                                              │
  │  → public/ prefix BỊ BỎ trong URL!                         │
  │  → Cache-Control: public, max-age=0 (NO CACHE!)            │
  │  → Nên dùng app/favicon.ico cho metadata!                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §13. Tự Viết — CombinedEngine!

```javascript
/**
 * CombinedEngine — Mô phỏng proxy.js + public + route.js + Route Groups!
 * Tự viết bằng tay, KHÔNG dùng thư viện nào!
 */
var CombinedEngine = (function () {

  // ═══════════════════════════════════
  // 1. PROXY — Matcher Engine
  // ═══════════════════════════════════
  function matchProxy(url, matchers) {
    for (var i = 0; i < matchers.length; i++) {
      var m = matchers[i];
      // Simple string match
      if (typeof m === 'string') {
        var pattern = m.replace(/:path\*/g, '.*');
        if (new RegExp('^' + pattern).test(url)) {
          return { matched: true, matcher: m, url: url };
        }
      }
    }
    return { matched: false, url: url, note: 'No matcher hit!' };
  }

  function simulateProxy(url, action) {
    var result = { originalUrl: url };
    if (action.type === 'redirect') {
      result.action = 'REDIRECT';
      result.target = action.target;
      result.status = action.status || 307;
    } else if (action.type === 'rewrite') {
      result.action = 'REWRITE';
      result.target = action.target;
      result.note = 'URL bar KHÔNG đổi! Content từ target!';
    } else if (action.type === 'next') {
      result.action = 'NEXT (continue to route!)';
    } else if (action.type === 'respond') {
      result.action = 'DIRECT RESPONSE';
      result.body = action.body;
    }
    return result;
  }

  // ═══════════════════════════════════
  // 2. PUBLIC — File Resolver
  // ═══════════════════════════════════
  function resolvePublic(filePath) {
    if (filePath.indexOf('public/') === 0) {
      var url = filePath.replace(/^public/, '');
      return {
        file: filePath,
        url: url,
        cacheControl: 'public, max-age=0',
        note: 'public/ prefix bị bỏ trong URL!'
      };
    }
    return { error: 'Not in public/ folder!' };
  }

  // ═══════════════════════════════════
  // 3. ROUTE HANDLER — Method Router
  // ═══════════════════════════════════
  function routeHandler(method, routeFile, handlers) {
    var upperMethod = method.toUpperCase();
    if (handlers[upperMethod]) {
      return {
        method: upperMethod,
        file: routeFile,
        handler: 'FOUND!',
        response: handlers[upperMethod]()
      };
    }
    if (upperMethod === 'OPTIONS') {
      var allowedMethods = Object.keys(handlers).join(', ');
      return {
        method: 'OPTIONS (auto!)',
        allow: allowedMethods,
        note: 'Auto-implemented by Next.js!'
      };
    }
    return {
      method: upperMethod,
      status: 405,
      error: 'Method Not Allowed!'
    };
  }

  // ═══════════════════════════════════
  // 4. ROUTE GROUPS — URL Resolver
  // ═══════════════════════════════════
  function resolveRouteGroup(filePath) {
    // Remove (groupName) from path
    var url = filePath
      .replace(/^app/, '')
      .replace(/\([^)]+\)\//g, '')  // Remove (group)/
      .replace(/\/page\.(js|tsx)$/, '')
      .replace(/\/$/, '');
    return {
      filePath: filePath,
      actualUrl: url || '/',
      groupsRemoved: (filePath.match(/\([^)]+\)/g) || []),
      note: '(parentheses) folders removed from URL!'
    };
  }

  function checkConflict(files) {
    var urls = {};
    var conflicts = [];
    for (var i = 0; i < files.length; i++) {
      var result = resolveRouteGroup(files[i]);
      if (urls[result.actualUrl]) {
        conflicts.push({
          url: result.actualUrl,
          file1: urls[result.actualUrl],
          file2: files[i],
          error: 'CONFLICTING PATHS! Both resolve to same URL!'
        });
      }
      urls[result.actualUrl] = files[i];
    }
    return {
      totalFiles: files.length,
      conflicts: conflicts,
      hasConflicts: conflicts.length > 0
    };
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  COMBINED ENGINE — DEMO                     ║');
    console.log('╚═══════════════════════════════════════════╝');

    // 1. Proxy matcher
    console.log('\n--- 1. PROXY MATCHER ---');
    console.log(JSON.stringify(matchProxy(
      '/about/team', ['/about/:path*', '/api/:path*']
    ), null, 2));
    console.log(JSON.stringify(matchProxy(
      '/blog/hello', ['/about/:path*']
    ), null, 2));

    // 2. Proxy actions
    console.log('\n--- 2. PROXY ACTIONS ---');
    console.log(JSON.stringify(simulateProxy(
      '/about', { type: 'redirect', target: '/about-2' }
    )));
    console.log(JSON.stringify(simulateProxy(
      '/dashboard', { type: 'rewrite', target: '/dash/user' }
    )));
    console.log(JSON.stringify(simulateProxy(
      '/api/data', { type: 'respond', body: '{"error":"401"}' }
    )));

    // 3. Public folder
    console.log('\n--- 3. PUBLIC FOLDER ---');
    console.log(JSON.stringify(resolvePublic('public/avatars/me.png')));
    console.log(JSON.stringify(resolvePublic('public/fonts/inter.woff2')));

    // 4. Route handler
    console.log('\n--- 4. ROUTE HANDLER ---');
    var handlers = {
      GET: function() { return { message: 'Hello' }; },
      POST: function() { return { created: true }; }
    };
    console.log(JSON.stringify(routeHandler('GET', 'app/api/route.ts', handlers)));
    console.log(JSON.stringify(routeHandler('OPTIONS', 'app/api/route.ts', handlers)));
    console.log(JSON.stringify(routeHandler('DELETE', 'app/api/route.ts', handlers)));

    // 5. Route Groups
    console.log('\n--- 5. ROUTE GROUPS ---');
    console.log(JSON.stringify(resolveRouteGroup(
      'app/(admin)/dashboard/page.js')));
    console.log(JSON.stringify(resolveRouteGroup(
      'app/(marketing)/about/page.js')));

    // 6. Conflict check
    console.log('\n--- 6. CONFLICT CHECK ---');
    console.log(JSON.stringify(checkConflict([
      'app/(marketing)/about/page.js',
      'app/(shop)/about/page.js'
    ]), null, 2));

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                           ║');
    console.log('╚═══════════════════════════════════════════╝');
  }

  return {
    matchProxy: matchProxy,
    simulateProxy: simulateProxy,
    resolvePublic: resolvePublic,
    routeHandler: routeHandler,
    resolveRouteGroup: resolveRouteGroup,
    checkConflict: checkConflict,
    demo: demo
  };
})();

// Chạy: CombinedEngine.demo();
```

---

## §14. Câu Hỏi Luyện Tập!

### ❓ Câu 1: proxy.js vs middleware.js?

**Trả lời:**

Cùng một thứ! `middleware.js` đã được **RENAME** thành `proxy.js` vì:
- "middleware" dễ nhầm với Express.js middleware
- "proxy" mô tả đúng hơn: **network boundary** trước app
- Migration: `npx @next/codemod@canary middleware-to-proxy .`

### ❓ Câu 2: Proxy execution order?

**Trả lời:**

```
1. headers (next.config.js)
2. redirects (next.config.js)
3. ★ PROXY ← Ở ĐÂY!
4. beforeFiles rewrites (next.config.js)
5. Filesystem routes (public/, app/)
6. afterFiles rewrites
7. Dynamic Routes
8. fallback rewrites
```

→ Proxy chạy **SAU** config headers/redirects, **TRƯỚC** filesystem routes!

### ❓ Câu 3: public/ folder có cache không?

**Trả lời:**

**KHÔNG cache!** Default: `Cache-Control: public, max-age=0`

→ Next.js không thể safely cache vì files có thể thay đổi!
→ Nên dùng `next/image` để optimize images cho caching riêng!

### ❓ Câu 4: route.js vs page.js?

**Trả lời:**

| Tiêu chí | page.js | route.js |
|---|---|---|
| Output | UI (HTML!) | Data (JSON/XML!) |
| Methods | N/A | GET, POST, PUT, DELETE... |
| Props | params, searchParams | request, context |
| Conflict | ❌ KHÔNG thể cùng route! | ❌ KHÔNG thể cùng route! |
| Use case | Render trang | API endpoint |

→ page.js + route.js **KHÔNG THỂ** nằm cùng route segment!

### ❓ Câu 5: Route Groups caveats?

**Trả lời:**

1. **Full page load** khi navigate giữa DIFFERENT root layouts!
   - `/cart` (shop layout) → `/blog` (marketing layout) = **FULL RELOAD!**

2. **Conflicting paths = ERROR!**
   - `(marketing)/about/page.js` + `(shop)/about/page.js` → cả 2 = `/about` → **BUILD ERROR!**

3. **No top-level layout?**
   - Home route `/` PHẢI nằm trong 1 group!

### ❓ Câu 6: NextResponse.next({ request: { headers } }) vs NextResponse.next({ headers })?

**Trả lời:**

**KHÁC BIỆT QUAN TRỌNG!**

```
NextResponse.next({ request: { headers } })
→ Headers gửi cho UPSTREAM (server, route handlers)!

NextResponse.next({ headers })
→ Headers gửi cho CLIENT (browser)!
```

→ Nếu muốn pass headers cho server-side code → dùng `request: { headers }`!
→ Nếu muốn set response headers cho browser → dùng `{ headers }`!

### ❓ Câu 7: Proxy có thể return Response trực tiếp không?

**Trả lời:**

**CÓ!** Từ v13.1.0! Có thể return `Response` hoặc `NextResponse` trực tiếp!

```javascript
if (!isAuthenticated(request)) {
  return Response.json(
    { success: false, message: 'auth failed' },
    { status: 401 }
  )
}
```

→ Dùng cho auth check, rate limiting, API gating!

### ❓ Câu 8: waitUntil trong proxy dùng để làm gì?

**Trả lời:**

`event.waitUntil(promise)` = kéo dài **lifetime** của proxy UNTIL promise settles!

→ Gửi response cho client TRƯỚC, rồi tiếp tục background work!
→ Use case: **analytics, logging, audit trail** — không block response!

---

> 🎯 **Tổng kết 4 File Conventions:**
> - **proxy.js**: Gateway trước app, auth/redirect/rewrite/CORS! (0 hình)
> - **public folder**: Static files, max-age=0 caching! (0 hình)
> - **route.js**: API endpoints, Web Request/Response! (0 hình)
> - **Route Groups**: (folderName) organize code, không ảnh hưởng URL! (1 hình — file tree → URL mapping)
> - **CombinedEngine** tự viết: matcher, proxy actions, public resolver, route handler, group resolver, conflict checker!
> - **8 câu hỏi luyện tập** với đáp án chi tiết!
