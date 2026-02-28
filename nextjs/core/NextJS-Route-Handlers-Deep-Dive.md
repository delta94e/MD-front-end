# Next.js Route Handlers — Deep Dive!

> **Chủ đề**: Route Handlers trong Next.js App Router
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/getting-started/route-handlers

---

## Mục Lục

1. [§1. Tổng Quan — Route Handlers Là Gì?](#1)
2. [§2. Phân Tích Sơ Đồ — File Structure Convention](#2)
3. [§3. Convention — File route.js](#3)
4. [§4. Supported HTTP Methods](#4)
5. [§5. NextRequest & NextResponse APIs](#5)
6. [§6. Caching — Cơ Chế Cache Route Handlers](#6)
7. [§7. Cache Components — use cache](#7)
8. [§8. Special Route Handlers](#8)
9. [§9. Route Resolution — route.js vs page.js](#9)
10. [§10. Route Context Helper — TypeScript](#10)
11. [§11. Sơ Đồ Tổng Hợp — Route Handlers Pipeline](#11)
12. [§12. Tự Viết — RouteHandlerEngine](#12)
13. [§13. Câu Hỏi Luyện Tập](#13)

---

## §1. Tổng Quan — Route Handlers Là Gì?

```
  ROUTE HANDLERS — TẠI SAO CẦN?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ROUTE HANDLERS = API endpoints TRONG Next.js!        │
  │  → Tạo custom request handlers cho một route!         │
  │  → Dùng Web API chuẩn: Request + Response!            │
  │  → CHỈ có trong app/ directory (App Router)!          │
  │                                                        │
  │  TƯƠNG ĐƯƠNG với:                                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Pages Router   →  API Routes (pages/api/...)   │  │
  │  │  App Router     →  Route Handlers (app/.../route)│  │
  │  │                                                  │  │
  │  │  ⚠️ KHÔNG dùng CẢ HAI cùng lúc!                │  │
  │  │  → Chọn 1 trong 2!                              │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SO SÁNH:                                              │
  │  ┌──────────────┬─────────────────┬────────────────┐  │
  │  │              │ API Routes      │ Route Handlers │  │
  │  │              │ (Pages Router)  │ (App Router)   │  │
  │  ├──────────────┼─────────────────┼────────────────┤  │
  │  │ File         │ pages/api/*.ts  │ app/**/route.ts│  │
  │  │ Handler      │ handler(req,res)│ GET(request)   │  │
  │  │ Request      │ NextApiRequest  │ Web Request API│  │
  │  │ Response     │ NextApiResponse │ Web Response   │  │
  │  │ Nested       │ Tự động         │ Tự động        │  │
  │  │ Caching      │ Không           │ Có (GET)       │  │
  │  └──────────────┴─────────────────┴────────────────┘  │
  │                                                        │
  │  ĐẶC ĐIỂM QUAN TRỌNG:                                │
  │  → Dùng Web Request/Response API chuẩn!               │
  │  → KHÔNG phải Express.js!                              │
  │  → KHÔNG có req.query, res.send()!                    │
  │  → Dùng: request.url, Response.json()!                │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Phân Tích Sơ Đồ — File Structure Convention!

**Sơ đồ gốc trên trang docs:**

![Route Handlers File Structure](images/nextjs-route-handlers-file-structure.png)

```
  PHÂN TÍCH SƠ ĐỒ — FILE STRUCTURE MAPPING:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Sơ đồ cho thấy MỐI QUAN HỆ giữa:                   │
  │  FILE SYSTEM  ←→  URL ROUTES                          │
  │                                                        │
  │  ┌─────────────────────┐     ┌───────────────────┐    │
  │  │   FILE SYSTEM        │     │   URL ROUTES       │    │
  │  │                     │     │                   │    │
  │  │  app/               │     │                   │    │
  │  │  ├── page.js     ───┼────▶│  /     (homepage) │    │
  │  │  │                  │     │                   │    │
  │  │  └── api/           │     │                   │    │
  │  │      └── route.js───┼────▶│  /api  (API endpoint)│  │
  │  │                     │     │                   │    │
  │  └─────────────────────┘     └───────────────────┘    │
  │                                                        │
  │  ═══════════════════════════════════════════════════   │
  │                                                        │
  │  GIẢI THÍCH CHI TIẾT:                                  │
  │                                                        │
  │  ① app/page.js → render UI tại "/"                    │
  │     → Đây là PAGE component (hiển thị HTML!)          │
  │     → User THẤY giao diện web!                        │
  │                                                        │
  │  ② app/api/route.js → API endpoint tại "/api"         │
  │     → Đây là ROUTE HANDLER (trả JSON!)                │
  │     → User KHÔNG thấy UI — chỉ data!                 │
  │     → Frontend gọi fetch('/api') để lấy data!        │
  │                                                        │
  │  PHÂN BIỆT:                                            │
  │  ┌──────────────┬───────────────┬──────────────────┐  │
  │  │ File         │ Loại          │ Output           │  │
  │  ├──────────────┼───────────────┼──────────────────┤  │
  │  │ page.js      │ UI Page       │ HTML (React JSX) │  │
  │  │ route.js     │ API Handler   │ JSON / Text / etc│  │
  │  └──────────────┴───────────────┴──────────────────┘  │
  │                                                        │
  │  ⚠️ QUAN TRỌNG:                                       │
  │  → page.js VÀ route.js KHÔNG được ở CÙNG folder!    │
  │  → app/page.js + app/route.js → ❌ CONFLICT!         │
  │  → app/page.js + app/api/route.js → ✅ OK!           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Convention — File route.js!

```
  CONVENTION — CÁCH TẠO ROUTE HANDLER:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Tạo file tên "route.js" hoặc "route.ts"           │
  │  ② Đặt BẤT KỲ ĐÂU trong app/ directory!             │
  │  ③ Export NAMED function theo HTTP method!             │
  │                                                        │
  │  VÍ DỤ:                                               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  // app/api/route.ts                             │  │
  │  │                                                  │  │
  │  │  export async function GET(request: Request) {   │  │
  │  │    return Response.json({ message: 'Hello!' })   │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CÓ THỂ NESTED SÂU:                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  app/                                            │  │
  │  │  ├── api/                                        │  │
  │  │  │   ├── route.ts         → /api                │  │
  │  │  │   ├── users/                                  │  │
  │  │  │   │   ├── route.ts     → /api/users          │  │
  │  │  │   │   └── [id]/                               │  │
  │  │  │   │       └── route.ts → /api/users/:id      │  │
  │  │  │   └── posts/                                  │  │
  │  │  │       └── route.ts     → /api/posts          │  │
  │  │  └── dashboard/                                  │  │
  │  │      └── api/                                    │  │
  │  │          └── route.ts     → /dashboard/api      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠️ QUY TẮC XUNG ĐỘT:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ❌ KHÔNG ĐƯỢC:                                  │  │
  │  │  app/                                            │  │
  │  │  ├── page.js    ← UI page cho "/"               │  │
  │  │  └── route.js   ← API handler cho "/" → XUNG!   │  │
  │  │                                                  │  │
  │  │  ✅ ĐƯỢC:                                        │  │
  │  │  app/                                            │  │
  │  │  ├── page.js    ← UI page cho "/"               │  │
  │  │  └── api/                                        │  │
  │  │      └── route.js ← API cho "/api" → OK!        │  │
  │  │                                                  │  │
  │  │  TẠI SAO?                                        │  │
  │  │  → page.js và route.js ĐỀU "own" HTTP verbs!   │  │
  │  │  → Cùng route → ai xử lý GET? → CONFLICT!      │  │
  │  │  → Khác route → mỗi file xử lý riêng → OK!    │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §4. Supported HTTP Methods!

```
  HTTP METHODS — 7 METHODS ĐƯỢC HỖ TRỢ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌──────────┬───────────────────────────────────────┐  │
  │  │ Method   │ Mục đích                               │  │
  │  ├──────────┼───────────────────────────────────────┤  │
  │  │ GET      │ Lấy data (read-only)                  │  │
  │  │ POST     │ Tạo mới (create)                      │  │
  │  │ PUT      │ Cập nhật toàn bộ (full update)        │  │
  │  │ PATCH    │ Cập nhật một phần (partial update)    │  │
  │  │ DELETE   │ Xóa resource                          │  │
  │  │ HEAD     │ Giống GET nhưng KHÔNG body             │  │
  │  │ OPTIONS  │ CORS preflight / khả năng server      │  │
  │  └──────────┴───────────────────────────────────────┘  │
  │                                                        │
  │  NẾU GỌI METHOD KHÔNG HỖ TRỢ:                        │
  │  → Next.js trả 405 Method Not Allowed!                │
  │                                                        │
  │  CÁCH EXPORT — MỖI METHOD LÀ 1 FUNCTION:              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  // app/api/users/route.ts                       │  │
  │  │                                                  │  │
  │  │  // GET — lấy danh sách users                    │  │
  │  │  export async function GET(request: Request) {   │  │
  │  │    const users = await db.query('SELECT * ...')   │  │
  │  │    return Response.json(users)                    │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  // POST — tạo user mới                          │  │
  │  │  export async function POST(request: Request) {  │  │
  │  │    const body = await request.json()              │  │
  │  │    const user = await db.insert(body)             │  │
  │  │    return Response.json(user, { status: 201 })   │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  // DELETE — xóa user                            │  │
  │  │  export async function DELETE(request: Request) { │  │
  │  │    // ...                                        │  │
  │  │    return new Response(null, { status: 204 })    │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  FLOW XỬ LÝ:                                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Client: fetch('/api/users', { method: 'POST' }) │  │
  │  │     │                                             │  │
  │  │     ▼                                             │  │
  │  │  Next.js Router: tìm app/api/users/route.ts     │  │
  │  │     │                                             │  │
  │  │     ▼                                             │  │
  │  │  Có export POST? → ✅ Gọi POST(request)!        │  │
  │  │  Không có?       → ❌ 405 Method Not Allowed!   │  │
  │  │     │                                             │  │
  │  │     ▼                                             │  │
  │  │  Response.json({ user }) → trả về client!        │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. NextRequest & NextResponse APIs!

```
  REQUEST & RESPONSE — HAI CẤP ĐỘ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CẤP 1: WEB API CHUẨN (native)                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Request  — Web API chuẩn (MDN)                  │  │
  │  │  Response — Web API chuẩn (MDN)                  │  │
  │  │                                                  │  │
  │  │  → Giống Fetch API, Service Worker!              │  │
  │  │  → request.url, request.json()                   │  │
  │  │  → Response.json(), new Response()               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CẤP 2: NEXT.JS EXTENDED (thêm helpers!)              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  NextRequest  — extends Request!                 │  │
  │  │  NextResponse — extends Response!                │  │
  │  │                                                  │  │
  │  │  NEXTREQUEST thêm:                               │  │
  │  │  → nextUrl    → parse URL tự động!              │  │
  │  │  → cookies    → đọc/ghi cookies!                │  │
  │  │  → geo        → thông tin vị trí!               │  │
  │  │  → ip         → IP address!                      │  │
  │  │                                                  │  │
  │  │  NEXTRESPONSE thêm:                              │  │
  │  │  → cookies    → set/delete cookies!             │  │
  │  │  → redirect() → redirect dễ hơn!               │  │
  │  │  → rewrite()  → rewrite URL!                    │  │
  │  │  → json()     → static method!                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  VÍ DỤ SO SÁNH:                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  // Web API chuẩn:                               │  │
  │  │  export async function GET(request: Request) {   │  │
  │  │    const url = new URL(request.url)               │  │
  │  │    const id = url.searchParams.get('id')         │  │
  │  │    return Response.json({ id })                   │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  // NextRequest (tiện hơn!):                     │  │
  │  │  import { NextRequest } from 'next/server'       │  │
  │  │  export async function GET(request: NextRequest) {│  │
  │  │    const id = request.nextUrl.searchParams        │  │
  │  │                .get('id')  // ← đã parse sẵn!  │  │
  │  │    return Response.json({ id })                   │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §6. Caching — Cơ Chế Cache Route Handlers!

```
  CACHING — MẶC ĐỊNH KHÔNG CACHE!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  QUY TẮC MẶC ĐỊNH:                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Route Handlers → KHÔNG cached mặc định!        │  │
  │  │  → Mỗi request → chạy lại handler!              │  │
  │  │  → Giống PHP/Express: request → response!       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  OPT-IN CACHING — CHỈ CHO GET!                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Chỉ GET method MỚI có thể cache!               │  │
  │  │  POST, PUT, PATCH, DELETE → KHÔNG BAO GIỜ!      │  │
  │  │                                                  │  │
  │  │  Cách bật: export const dynamic = 'force-static' │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  VÍ DỤ:                                               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  // app/api/data/route.ts                        │  │
  │  │                                                  │  │
  │  │  export const dynamic = 'force-static'           │  │
  │  │  //      ↑ BẬT caching cho GET!                  │  │
  │  │                                                  │  │
  │  │  export async function GET() {                   │  │
  │  │    const res = await fetch('https://api...',{    │  │
  │  │      headers: {                                  │  │
  │  │        'Content-Type': 'application/json',       │  │
  │  │        'API-Key': process.env.DATA_API_KEY,      │  │
  │  │      },                                          │  │
  │  │    })                                            │  │
  │  │    const data = await res.json()                 │  │
  │  │    return Response.json({ data })                │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠️ CHÚ Ý:                                            │
  │  Ngay cả khi POST, DELETE NẰM CÙNG FILE với GET      │
  │  đã cached → chúng VẪN KHÔNG được cache!              │
  │  → Cache CHỈ APPLY cho GET function!                  │
  │                                                        │
  │  FLOW CACHING:                                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Request 1: GET /api/data                        │  │
  │  │    → Chạy handler → fetch data → CACHE kết quả │  │
  │  │    → Response: { data: [...] }                   │  │
  │  │                                                  │  │
  │  │  Request 2: GET /api/data (cùng route)           │  │
  │  │    → TRẢ TỪ CACHE! Không chạy handler!         │  │
  │  │    → Response: { data: [...] } (same!)           │  │
  │  │                                                  │  │
  │  │  Request 3: POST /api/data                       │  │
  │  │    → KHÔNG cache! Chạy handler bình thường!     │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §7. Cache Components — use cache!

```
  CACHE COMPONENTS — MÔ HÌNH MỚI:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Khi CACHE COMPONENTS được bật:                        │
  │  → GET Route Handlers hoạt động GIỐNG UI routes!      │
  │  → Mặc định chạy tại REQUEST TIME!                    │
  │  → NHƯNG có thể PRERENDER nếu không dùng dynamic data!│
  │                                                        │
  │  3 LOẠI HÀNH VI:                                       │
  │                                                        │
  │  ① STATIC (prerendered at build):                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  // Không dynamic data → prerender tại build!   │  │
  │  │  export async function GET() {                   │  │
  │  │    return Response.json({                        │  │
  │  │      projectName: 'Next.js',  // ← CỨNG!       │  │
  │  │    })                                            │  │
  │  │  }                                               │  │
  │  │  → Build time: render → cache kết quả!         │  │
  │  │  → Runtime: trả cached response!                │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② DYNAMIC (request-time rendering):                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  // Non-deterministic → request time!            │  │
  │  │  export async function GET() {                   │  │
  │  │    return Response.json({                        │  │
  │  │      randomNumber: Math.random(), // ← DYNAMIC! │  │
  │  │    })                                            │  │
  │  │  }                                               │  │
  │  │  → Math.random() → kết quả KHÁC mỗi lần!       │  │
  │  │  → KHÔNG THỂ prerender!                         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ RUNTIME DATA (request-specific):                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  import { headers } from 'next/headers'          │  │
  │  │                                                  │  │
  │  │  export async function GET() {                   │  │
  │  │    const headersList = await headers()           │  │
  │  │    const userAgent = headersList                  │  │
  │  │      .get('user-agent')  // ← KHÁC mỗi user!   │  │
  │  │    return Response.json({ userAgent })            │  │
  │  │  }                                               │  │
  │  │  → headers() = runtime API → CẦN request!       │  │
  │  │  → Prerendering BỊ DỪNG!                        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  PRERENDERING DỪNG KHI NÀO?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  GET handler KHÔNG THỂ prerender nếu dùng:            │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ❌ Network requests (fetch, axios...)           │  │
  │  │  ❌ Database queries (db.query, prisma...)       │  │
  │  │  ❌ Async file system (fs.readFile...)           │  │
  │  │  ❌ request.url, request.headers,                │  │
  │  │     request.cookies, request.body                │  │
  │  │  ❌ cookies() — runtime API                     │  │
  │  │  ❌ headers() — runtime API                     │  │
  │  │  ❌ connection() — runtime API                  │  │
  │  │  ❌ Math.random(), Date.now() — non-deterministic│  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  use cache — CACHE DYNAMIC DATA:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VẤN ĐỀ: Muốn prerender NHƯNG cần data từ DB?       │
  │  → DB query = dynamic → không prerender được!         │
  │                                                        │
  │  GIẢI PHÁP: 'use cache' directive!                     │
  │  → Wrap dynamic data trong cached function!           │
  │  → Kết quả được cache → revalidate theo cacheLife!   │
  │                                                        │
  │  ⚠️ KHÔNG dùng 'use cache' TRỰC TIẾP trong handler!  │
  │  → Phải TÁCH ra helper function!                      │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  import { cacheLife } from 'next/cache'          │  │
  │  │                                                  │  │
  │  │  // Route Handler — KHÔNG 'use cache' ở đây!    │  │
  │  │  export async function GET() {                   │  │
  │  │    const products = await getProducts()          │  │
  │  │    return Response.json(products)                │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  // Helper function — 'use cache' Ở ĐÂY!        │  │
  │  │  async function getProducts() {                  │  │
  │  │    'use cache'              // ← directive!      │  │
  │  │    cacheLife('hours')       // ← TTL = vài giờ! │  │
  │  │    return await db.query('SELECT * FROM products')│  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  FLOW:                                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Request 1: GET /api/products                    │  │
  │  │    → getProducts()                               │  │
  │  │      → 'use cache' → check cache → MISS!       │  │
  │  │      → DB query → cache kết quả (TTL: hours)   │  │
  │  │    → Response: [{ name: 'Shirt' }, ...]          │  │
  │  │                                                  │  │
  │  │  Request 2 (trong TTL):                          │  │
  │  │    → getProducts()                               │  │
  │  │      → 'use cache' → check cache → HIT!        │  │
  │  │      → Trả từ cache! NO DB QUERY!               │  │
  │  │    → Response: [{ name: 'Shirt' }, ...] (same!) │  │
  │  │                                                  │  │
  │  │  Request 3 (sau TTL hết):                        │  │
  │  │    → getProducts()                               │  │
  │  │      → 'use cache' → check cache → STALE!      │  │
  │  │      → Revalidate: DB query lại!                │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §8. Special Route Handlers!

```
  SPECIAL ROUTE HANDLERS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Một số file ĐẶC BIỆT cũng là Route Handlers:        │
  │                                                        │
  │  ┌──────────────────────┬──────────────────────────┐  │
  │  │ File                 │ Mục đích                  │  │
  │  ├──────────────────────┼──────────────────────────┤  │
  │  │ sitemap.ts           │ Generate sitemap.xml     │  │
  │  │ opengraph-image.tsx  │ Generate OG images       │  │
  │  │ icon.tsx             │ Generate app icons       │  │
  │  │ Các metadata files   │ Generate meta tags       │  │
  │  └──────────────────────┴──────────────────────────┘  │
  │                                                        │
  │  ĐẶC ĐIỂM:                                            │
  │  → Mặc định STATIC (prerendered tại build time)!     │
  │  → TRỪ KHI dùng Dynamic APIs hoặc dynamic config!    │
  │  → Ví dụ: opengraph-image.tsx dùng params             │
  │    → trở thành dynamic!                                │
  │                                                        │
  │  VÍ DỤ — SITEMAP DYNAMIC:                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  // app/sitemap.ts                               │  │
  │  │  export default async function sitemap() {       │  │
  │  │    const posts = await getPosts()  // ← dynamic! │  │
  │  │    return posts.map(post => ({                   │  │
  │  │      url: `https://.../${post.slug}`,            │  │
  │  │      lastModified: post.updatedAt,               │  │
  │  │    }))                                           │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §9. Route Resolution — route.js vs page.js!

```
  ROUTE RESOLUTION — QUY TẮC QUAN TRỌNG!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  route.js = ROUTING PRIMITIVE CẤP THẤP NHẤT!         │
  │                                                        │
  │  KHÁC BIỆT VỚI page.js:                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │               route.js         page.js           │  │
  │  │  Layout?      ❌ Không!        ✅ Có!            │  │
  │  │  Client nav?  ❌ Không!        ✅ Có!            │  │
  │  │  HTML output? ❌ (JSON/text)   ✅ (React JSX)   │  │
  │  │  HTTP verbs?  ✅ Control!      ❌ Auto!          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  → route.js KHÔNG tham gia layouts, templates!        │
  │  → route.js KHÔNG có client-side navigation!          │
  │  → route.js KHÔNG có loading.js, error.js!            │
  │                                                        │
  │  QUY TẮC XỬ LÝ XUNG ĐỘT:                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ❌ CẢ HAI cùng route segment:                  │  │
  │  │  app/page.js    + app/route.js    → CONFLICT!   │  │
  │  │                                                  │  │
  │  │  ✅ page.js + route.js KHÁC route:              │  │
  │  │  app/page.js    + app/api/route.js → OK!        │  │
  │  │                                                  │  │
  │  │  ✅ Dynamic route + API route:                   │  │
  │  │  app/[user]/page.js + app/api/route.js → OK!    │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  MỖI route.js HOẶC page.js "SỞ HỮU" TẤT CẢ          │
  │  HTTP VERBS cho route đó:                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  // ❌ KHÔNG THỂ chia sẻ:                       │  │
  │  │  // app/page.js → handle GET (render UI)        │  │
  │  │  // app/route.js → handle POST (API)            │  │
  │  │  // → XUNG ĐỘT! Ai xử lý GET?                 │  │
  │  │                                                  │  │
  │  │  // ✅ TÁCH ra:                                  │  │
  │  │  // app/page.js      → "/" (UI, tất cả verbs)   │  │
  │  │  // app/api/route.js → "/api" (API, tất cả)    │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §10. Route Context Helper — TypeScript!

```
  ROUTE CONTEXT — TYPED PARAMS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Route Handlers nhận 2 THAM SỐ:                       │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  export async function GET(                      │  │
  │  │    request: NextRequest,    ← ① Request object  │  │
  │  │    ctx: RouteContext<...>   ← ② Context (params)│  │
  │  │  ) { ... }                                       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  RouteContext — GLOBAL TYPE HELPER:                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  → RouteContext<'/users/[id]'>                   │  │
  │  │  → Tự động generate type cho params!             │  │
  │  │  → ctx.params = { id: string }                   │  │
  │  │                                                  │  │
  │  │  → RouteContext<'/blog/[...slug]'>               │  │
  │  │  → ctx.params = { slug: string[] }               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  VÍ DỤ ĐẦY ĐỦ:                                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  // app/api/users/[id]/route.ts                  │  │
  │  │  import type { NextRequest } from 'next/server'  │  │
  │  │                                                  │  │
  │  │  export async function GET(                      │  │
  │  │    _req: NextRequest,                            │  │
  │  │    ctx: RouteContext<'/users/[id]'>              │  │
  │  │  ) {                                             │  │
  │  │    const { id } = await ctx.params               │  │
  │  │    //     ↑ type-safe! id: string                │  │
  │  │    return Response.json({ id })                  │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠️ TYPES GENERATED khi:                               │
  │  → next dev   (development mode)                      │
  │  → next build (production build)                      │
  │  → next typegen (chạy thủ công)                       │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §11. Sơ Đồ Tổng Hợp — Route Handlers Pipeline!

```
  NEXT.JS ROUTE HANDLERS — TOÀN BỘ PIPELINE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① CLIENT GỬI REQUEST:                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  fetch('/api/users', {                           │  │
  │  │    method: 'POST',                               │  │
  │  │    body: JSON.stringify({ name: 'Jun' })         │  │
  │  │  })                                              │  │
  │  └──────────┬───────────────────────────────────────┘  │
  │             │                                          │
  │             ▼                                          │
  │  ② NEXT.JS ROUTER:                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Path: /api/users                                │  │
  │  │  → Tìm: app/api/users/route.ts                  │  │
  │  │  → Có file? ✅                                   │  │
  │  │  → Method: POST                                  │  │
  │  │  → Có export POST? ✅                            │  │
  │  └──────────┬───────────────────────────────────────┘  │
  │             │                                          │
  │             ▼                                          │
  │  ③ CHECK CACHE (chỉ GET!):                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Method = POST → SKIP cache!                     │  │
  │  │  (Nếu GET + force-static → check cache trước!) │  │
  │  └──────────┬───────────────────────────────────────┘  │
  │             │                                          │
  │             ▼                                          │
  │  ④ CHẠY HANDLER:                                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  POST(request, context)                          │  │
  │  │    │                                              │  │
  │  │    ├── Parse body: await request.json()          │  │
  │  │    ├── Validate data                             │  │
  │  │    ├── DB insert: await db.insert(...)           │  │
  │  │    └── Return: Response.json(user, {status: 201})│  │
  │  └──────────┬───────────────────────────────────────┘  │
  │             │                                          │
  │             ▼                                          │
  │  ⑤ CLIENT NHẬN RESPONSE:                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  HTTP 201 Created                                │  │
  │  │  Content-Type: application/json                  │  │
  │  │  Body: { "id": 1, "name": "Jun" }               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  DECISION TREE — CACHING:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Route Handler nhận request:                           │
  │  │                                                     │
  │  ├── Method = GET?                                     │
  │  │   ├── Có dynamic = 'force-static'?                 │
  │  │   │   └── ✅ CACHE kết quả!                        │
  │  │   │                                                 │
  │  │   ├── Cache Components enabled?                    │
  │  │   │   ├── Có dùng dynamic data? (headers, etc.)    │
  │  │   │   │   ├── Có 'use cache' helper?               │
  │  │   │   │   │   └── ✅ Cache helper + prerender!     │
  │  │   │   │   └── Không → ❌ Request time rendering!   │
  │  │   │   └── Không dynamic data                       │
  │  │   │       └── ✅ Prerender at build time!           │
  │  │   └── Mặc định                                     │
  │  │       └── ❌ Không cache!                           │
  │  │                                                     │
  │  └── Method ≠ GET (POST, PUT, DELETE...)?              │
  │      └── ❌ KHÔNG BAO GIỜ cache!                      │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §12. Tự Viết — RouteHandlerEngine!

```javascript
var RouteHandlerEngine = (function () {
  // ═══════════════════════════════════
  // 1. ROUTE REGISTRY
  // ═══════════════════════════════════
  var routes = {}; // path → { methods, config }
  var cache = {}; // path:method → cached response
  var SUPPORTED = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

  function registerRoute(path, methods, config) {
    // Validate: không cho route + page cùng path!
    routes[path] = {
      methods: methods,
      config: config || {},
    };
    console.log(
      "  [Register] " + path + " → " + Object.keys(methods).join(", "),
    );
  }

  // ═══════════════════════════════════
  // 2. REQUEST HANDLING
  // ═══════════════════════════════════
  function handleRequest(method, path, body) {
    method = method.toUpperCase();

    // Check supported method
    if (SUPPORTED.indexOf(method) === -1) {
      return { status: 405, body: "Method Not Allowed" };
    }

    // Find route
    var route = routes[path];
    if (!route) {
      return { status: 404, body: "Route not found: " + path };
    }

    // Check if method exported
    var handler = route.methods[method];
    if (!handler) {
      return { status: 405, body: method + " not exported for " + path };
    }

    // Check cache (only GET!)
    if (method === "GET" && route.config.dynamic === "force-static") {
      var cacheKey = path + ":GET";
      if (cache[cacheKey]) {
        console.log("  [CACHE HIT] " + cacheKey);
        return cache[cacheKey];
      }
    }

    // Run handler
    var request = {
      method: method,
      url: "http://localhost" + path,
      body: body,
      json: function () {
        return body;
      },
    };

    var result = handler(request);

    // Cache GET if force-static
    if (method === "GET" && route.config.dynamic === "force-static") {
      cache[path + ":GET"] = result;
      console.log("  [CACHED] " + path + ":GET");
    }

    return result;
  }

  // ═══════════════════════════════════
  // 3. ROUTE CONFLICT CHECKER
  // ═══════════════════════════════════
  var pages = {};

  function registerPage(path) {
    pages[path] = true;
    console.log("  [Page] " + path);
  }

  function checkConflict(path) {
    if (routes[path] && pages[path]) {
      return '❌ CONFLICT: route.js + page.js at "' + path + '"!';
    }
    return '✅ No conflict at "' + path + '"';
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔══════════════════════════════════════╗");
    console.log("║ ROUTE HANDLER ENGINE                  ║");
    console.log("╚══════════════════════════════════════╝");

    // 1. Register routes
    console.log("\n━━━ 1. Register Routes ━━━");
    registerRoute("/api/users", {
      GET: function (req) {
        return {
          status: 200,
          body: [
            { id: 1, name: "Jun" },
            { id: 2, name: "Linh" },
          ],
        };
      },
      POST: function (req) {
        var user = req.json();
        user.id = 3;
        return { status: 201, body: user };
      },
    });

    registerRoute(
      "/api/data",
      {
        GET: function (req) {
          return { status: 200, body: { temperature: 25 } };
        },
      },
      { dynamic: "force-static" },
    );

    // 2. Register pages
    console.log("\n━━━ 2. Register Pages ━━━");
    registerPage("/");
    registerPage("/about");

    // 3. Handle requests
    console.log("\n━━━ 3. Handle GET /api/users ━━━");
    var r1 = handleRequest("GET", "/api/users");
    console.log("  Status:", r1.status);
    console.log("  Body:", JSON.stringify(r1.body));

    console.log("\n━━━ 4. Handle POST /api/users ━━━");
    var r2 = handleRequest("POST", "/api/users", { name: "Minh" });
    console.log("  Status:", r2.status);
    console.log("  Body:", JSON.stringify(r2.body));

    console.log("\n━━━ 5. Handle DELETE /api/users (no export!) ━━━");
    var r3 = handleRequest("DELETE", "/api/users");
    console.log("  Status:", r3.status);
    console.log("  Body:", r3.body);

    // 4. Caching demo
    console.log("\n━━━ 6. Cache Demo: GET /api/data ━━━");
    var r4 = handleRequest("GET", "/api/data");
    console.log(
      "  Request 1 — Status:",
      r4.status,
      "Body:",
      JSON.stringify(r4.body),
    );
    var r5 = handleRequest("GET", "/api/data");
    console.log("  Request 2 — Status:", r5.status, "(from cache!)");

    // 5. Conflict check
    console.log("\n━━━ 7. Conflict Checks ━━━");
    registerRoute("/", {
      GET: function () {
        return { status: 200 };
      },
    });
    console.log("  " + checkConflict("/"));
    console.log("  " + checkConflict("/api/users"));
    console.log("  " + checkConflict("/about"));
  }

  return { demo: demo };
})();
// Chạy: RouteHandlerEngine.demo();
```

---

## §13. Câu Hỏi Luyện Tập!

**Câu 1**: Route Handlers là gì? Khác gì với API Routes trong Pages Router?

<details><summary>Đáp án</summary>

**Route Handlers** là custom request handlers trong **App Router**, dùng file `route.js/ts` đặt trong `app/` directory.

**Khác biệt với API Routes (Pages Router)**:
| | API Routes | Route Handlers |
|---|---|---|
| File | `pages/api/*.ts` | `app/**/route.ts` |
| Handler signature | `handler(req, res)` | `GET(request)` |
| Request object | `NextApiRequest` | Web `Request` API |
| Response object | `NextApiResponse` (res.json()) | Web `Response` API |
| Caching | Không hỗ trợ | Có (`force-static`, `use cache`) |
| Web standard | Không | Có (Request/Response API) |

→ Route Handlers dùng **Web API chuẩn**, portable hơn!

</details>

---

**Câu 2**: Tại sao `route.js` và `page.js` KHÔNG THỂ nằm cùng route segment?

<details><summary>Đáp án</summary>

Vì cả `route.js` và `page.js` đều **"sở hữu" tất cả HTTP verbs** cho route đó!

```
app/page.js  → handle GET → render UI (HTML)
app/route.js → handle GET → trả JSON

→ Khi user gọi GET "/"
→ Next.js KHÔNG BIẾT gọi page.js hay route.js!
→ CONFLICT!
```

**Giải pháp**: Tách `route.js` vào sub-folder:

```
app/page.js      → "/" (UI page)
app/api/route.js → "/api" (API endpoint)  ✅
```

Đặc biệt, `route.js` **không tham gia** layouts, templates, loading.js — nó là routing primitive **cấp thấp nhất**!

</details>

---

**Câu 3**: Giải thích cơ chế caching trong Route Handlers.

<details><summary>Đáp án</summary>

**Mặc định**: Route Handlers **KHÔNG cached** — mỗi request chạy lại handler.

**Opt-in caching cho GET**:

1. **`force-static`**: `export const dynamic = 'force-static'` → cache kết quả GET
2. **Cache Components + `use cache`**: Dùng `'use cache'` directive trong helper function

**Quy tắc caching**:

- **CHỈ GET** có thể cache! POST/PUT/DELETE **KHÔNG BAO GIỜ**!
- Ngay cả POST cùng file với GET cached → POST **vẫn không cache**!
- `'use cache'` **KHÔNG dùng trực tiếp** trong handler body → phải tách helper!
- Cached responses revalidate theo `cacheLife` config

**Prerendering dừng khi** GET dùng: `headers()`, `cookies()`, `request.url`, `Math.random()`, DB queries, network requests...

</details>

---

**Câu 4**: Phân tích sơ đồ file structure trên trang docs — nó thể hiện điều gì?

<details><summary>Đáp án</summary>

Sơ đồ cho thấy **file system routing mapping**:

| File System        | URL Route | Loại                     |
| ------------------ | --------- | ------------------------ |
| `app/page.js`      | `/`       | UI Page (render HTML)    |
| `app/api/route.js` | `/api`    | Route Handler (trả JSON) |

**Ý nghĩa sâu**:

1. `page.js` và `route.js` **tách biệt** route segment → không conflict
2. Convention **"api/"** folder chỉ là convention chung — route.js có thể đặt **bất kỳ đâu**
3. File `page.js` → **"/"** (root page, render giao diện)
4. File `route.js` trong `api/` → **"/api"** (API endpoint, trả data)
5. Đây chính là **Backend-for-Frontend (BFF)** pattern: Next.js vừa render UI vừa serve API!

</details>

---

**Câu 5**: RouteContext helper dùng khi nào? Viết một route handler typed đầy đủ.

<details><summary>Đáp án</summary>

**RouteContext** là global TypeScript type helper — dùng để **type-safe params** trong dynamic routes!

```typescript
// app/api/users/[id]/route.ts
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/users/[id]">,
  //   ↑ TypeScript tự biết: ctx.params = { id: string }
) {
  const { id } = await ctx.params;
  // id: string ← type-safe!

  const user = await getUser(id);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  return Response.json(user);
}
```

**Types generated khi**: `next dev`, `next build`, hoặc `next typegen`
**Lưu ý**: `ctx.params` là **Promise** → phải `await`!

</details>
