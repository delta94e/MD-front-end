# unauthorized() Function — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/unauthorized
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/navigation`
> **Since**: Next.js v15.1.0!
> **⚠️ Experimental**: Cần bật `authInterrupts` trong `next.config.js`!

---

## §1. unauthorized() Là Gì?

```
  unauthorized() FUNCTION — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Function! Throw error → render 401 page! ★               │
  │  → import { unauthorized } from 'next/navigation'! ★        │
  │  → Render unauthorized.js file gần nhất! ★                  │
  │  → Xử lý AUTHENTICATION errors! ★                           │
  │                                                              │
  │  KHÁC VỚI unauthorized.js:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  unauthorized()  = FUNCTION! ★ (trigger!)             │    │
  │  │  → Gọi từ code! import from 'next/navigation'!       │    │
  │  │  → Throw internal error → tìm & render UI!           │    │
  │  │                                                       │    │
  │  │  unauthorized.js = FILE CONVENTION! ★ (UI!)           │    │
  │  │  → File đặc biệt trong app/! render UI 401!          │    │
  │  │  → Được render KHI unauthorized() được gọi!          │    │
  │  │                                                       │    │
  │  │  RELATIONSHIP:                                         │    │
  │  │  unauthorized() ──throws──→ Next.js catches ──→       │    │
  │  │    ──renders──→ unauthorized.js! ★★★                  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW CHI TIẾT:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  ① Server Component / Server Action / Route Handler   │    │
  │  │  ② verifySession() → null?                            │    │
  │  │       │                                                │    │
  │  │    ┌──┴──┐                                             │    │
  │  │   YES   NO                                            │    │
  │  │    │     │                                             │    │
  │  │    ▼     ▼                                             │    │
  │  │  unauthorized()  render page ✅                        │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  throw NEXT_UNAUTHORIZED! ★                           │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Next.js catches error internally! ★                  │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Set HTTP status = 401! ★                             │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Tìm unauthorized.js GẦN NHẤT! ★                     │    │
  │  │  (ancestor segment!)                                  │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Render 401 UI cho user! ★                            │    │
  │  │  (login form, redirect link, etc.)                    │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Setup — authInterrupts Config!

```
  SETUP BẮT BUỘC:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ⚠️ PHẢI BẬT experimental.authInterrupts! ★★★               │
  │                                                              │
  │  Không bật → unauthorized() SẼ KHÔNG HOẠT ĐỘNG! ★★★        │
  │                                                              │
  │  // next.config.ts                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import type { NextConfig } from 'next'                │    │
  │  │                                                       │    │
  │  │ const nextConfig: NextConfig = {                       │    │
  │  │   experimental: {                                      │    │
  │  │     authInterrupts: true,  ← BẮT BUỘC! ★★★           │    │
  │  │   },                                                   │    │
  │  │ }                                                      │    │
  │  │                                                       │    │
  │  │ export default nextConfig                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO EXPERIMENTAL?                                        │
  │  → v15.1.0 mới thêm! ★                                      │
  │  → API có thể thay đổi! ★                                   │
  │  → Cùng flag với forbidden()! ★                              │
  │  → Flask icon (🧪) trong docs! ★                             │
  │                                                              │
  │  CŨNG CẦN TẠO FILE:                                           │
  │  → app/unauthorized.tsx! ★                                   │
  │  → Nếu không có → Next.js dùng default 401 page! ★         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Dùng Ở Đâu — Contexts!

```
  CONTEXTS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────┬──────────┬───────────────────────┐ │
  │  │ Context               │ Dùng?    │ Ghi chú               │ │
  │  ├──────────────────────┼──────────┼───────────────────────┤ │
  │  │ Server Components     │ ✅       │ Phổ biến nhất! ★      │ │
  │  │ Server Functions      │ ✅       │ (Server Actions!) ★   │ │
  │  │ Route Handlers        │ ✅       │ API routes! ★         │ │
  │  │ Root Layout           │ ❌ ★★★   │ KHÔNG ĐƯỢC! ★★★      │ │
  │  │ Client Components     │ ❌       │ Server-only! ★        │ │
  │  │ Middleware             │ ❌       │ Dùng redirect! ★      │ │
  │  └──────────────────────┴──────────┴───────────────────────┘ │
  │                                                              │
  │  ⚠️ ROOT LAYOUT EXCEPTION:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  unauthorized() CANNOT be called in root layout! ★★★ │    │
  │  │                                                       │    │
  │  │  Tại sao?                                              │    │
  │  │  → Root layout render TRƯỚC tất cả! ★                 │    │
  │  │  → Không có parent để catch error! ★                  │    │
  │  │  → unauthorized.js cần nằm NGOÀI segment gọi! ★      │    │
  │  │  → Root layout = segment CAO NHẤT → không parent! ★  │    │
  │  │                                                       │    │
  │  │  GIẢI PHÁP:                                            │    │
  │  │  → Dùng Middleware redirect thay thế! ★               │    │
  │  │  → Hoặc kiểm tra auth trong nested layout! ★         │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Examples — 3 Patterns Chi Tiết!

```
  PATTERN 1: Server Component — Hiển thị Login UI!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  USE CASE: User truy cập dashboard mà chưa login! ★         │
  │                                                              │
  │  // app/dashboard/page.tsx                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { verifySession } from '@/app/lib/dal'         │    │
  │  │ import { unauthorized } from 'next/navigation'        │    │
  │  │                                                       │    │
  │  │ export default async function DashboardPage() {       │    │
  │  │   const session = await verifySession()               │    │
  │  │                                                       │    │
  │  │   if (!session) {                                      │    │
  │  │     unauthorized()  ← THROW! render 401 UI! ★        │    │
  │  │   }                                                    │    │
  │  │                                                       │    │
  │  │   // Code dưới đây CHỈ chạy khi có session! ★         │    │
  │  │   return (                                             │    │
  │  │     <main>                                             │    │
  │  │       <h1>Welcome to the Dashboard</h1>                │    │
  │  │       <p>Hi, {session.user.name}.</p>                  │    │
  │  │     </main>                                            │    │
  │  │   )                                                    │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  // app/unauthorized.tsx (UI được render!)                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import Login from '@/app/components/Login'             │    │
  │  │                                                       │    │
  │  │ export default function UnauthorizedPage() {           │    │
  │  │   return (                                             │    │
  │  │     <main>                                             │    │
  │  │       <h1>401 - Unauthorized</h1>                      │    │
  │  │       <p>Please log in to access this page.</p>        │    │
  │  │       <Login />  ← Login form! ★                      │    │
  │  │     </main>                                            │    │
  │  │   )                                                    │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  /dashboard → DashboardPage → verifySession() → null         │
  │    → unauthorized() → THROW → Next.js catches                │
  │    → HTTP 401 → render UnauthorizedPage → Login form! ★     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  PATTERN 2: Server Action — Guard Mutations!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  USE CASE: Bảo vệ data mutations! ★                         │
  │  → Chỉ user authenticated mới được thay đổi data! ★         │
  │                                                              │
  │  // app/actions/profile.ts                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 'use server'                                          │    │
  │  │                                                       │    │
  │  │ import { verifySession } from '@/app/lib/dal'         │    │
  │  │ import { unauthorized } from 'next/navigation'        │    │
  │  │ import db from '@/app/lib/db'                         │    │
  │  │                                                       │    │
  │  │ export async function updateProfile(data: FormData) { │    │
  │  │   const session = await verifySession()               │    │
  │  │                                                       │    │
  │  │   // If not authenticated → return 401! ★              │    │
  │  │   if (!session) {                                      │    │
  │  │     unauthorized()                                    │    │
  │  │   }                                                    │    │
  │  │                                                       │    │
  │  │   // Proceed with mutation...                          │    │
  │  │   await db.user.update({                               │    │
  │  │     where: { id: session.user.id },                    │    │
  │  │     data: { name: data.get('name') }                  │    │
  │  │   })                                                   │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO QUAN TRỌNG?                                          │
  │  → Không check auth → user anonymous CÓ THỂ sửa data! ★★★ │
  │  → Server Action chạy trên server! ★                        │
  │  → Client có thể gọi trực tiếp (RPC)! ★                    │
  │  → PHẢI guard mọi mutation! ★★★                             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  PATTERN 3: Route Handler — API Guard!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  USE CASE: Bảo vệ API endpoints! ★                          │
  │  → Chỉ authenticated requests mới nhận data! ★              │
  │                                                              │
  │  // app/api/users/route.ts                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { NextRequest, NextResponse } from             │    │
  │  │   'next/server'                                       │    │
  │  │ import { verifySession } from '@/app/lib/dal'         │    │
  │  │ import { unauthorized } from 'next/navigation'        │    │
  │  │                                                       │    │
  │  │ export async function GET(                             │    │
  │  │   req: NextRequest                                    │    │
  │  │ ): Promise<NextResponse> {                            │    │
  │  │                                                       │    │
  │  │   // Verify session                                    │    │
  │  │   const session = await verifySession()               │    │
  │  │                                                       │    │
  │  │   // No session → 401! ★                               │    │
  │  │   if (!session) {                                      │    │
  │  │     unauthorized()                                    │    │
  │  │   }                                                    │    │
  │  │                                                       │    │
  │  │   // Fetch and return data...                          │    │
  │  │   return NextResponse.json({ users: [...] })           │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ROUTE HANDLER vs SERVER COMPONENT:                           │
  │  → Route Handler: trả 401 status → render unauthorized.tsx!★│
  │  → Server Component: render unauthorized.tsx thay thế page!★│
  │  → Cả hai đều dùng unauthorized() giống nhau! ★             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Mechanism — Cách unauthorized() Hoạt Động Bên Trong!

```
  INTERNAL MECHANISM:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  unauthorized() hoạt động GIỐNG redirect() và notFound()! ★ │
  │                                                              │
  │  ① THROW PATTERN:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  function unauthorized() {                             │    │
  │  │    throw NEXT_UNAUTHORIZED  ← internal error! ★       │    │
  │  │  }                                                    │    │
  │  │                                                       │    │
  │  │  → KHÔNG phải return! THROW! ★★★                     │    │
  │  │  → Code sau unauthorized() KHÔNG BAO GIỜ chạy! ★     │    │
  │  │  → Giống notFound() và redirect()! ★                  │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② ERROR BOUNDARY TREE:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  app/                                                  │    │
  │  │  ├── layout.tsx (root — KHÔNG gọi unauthorized!)      │    │
  │  │  ├── unauthorized.tsx ← CAUGHT HERE! ★                │    │
  │  │  │                                                    │    │
  │  │  ├── dashboard/                                        │    │
  │  │  │   ├── page.tsx ← unauthorized() THROWN HERE! ★     │    │
  │  │  │   └── unauthorized.tsx ← HOẶC caught here! ★      │    │
  │  │  │                                                    │    │
  │  │  └── admin/                                            │    │
  │  │      ├── page.tsx ← unauthorized() THROWN HERE! ★     │    │
  │  │      └── (no unauthorized.tsx → bubble UP!) ★         │    │
  │  │           → app/unauthorized.tsx catches! ★           │    │
  │  │                                                       │    │
  │  │  RESOLUTION ORDER:                                     │    │
  │  │  ① Tìm unauthorized.tsx CÙNG segment! ★               │    │
  │  │  ② Không có? → bubble lên PARENT segment! ★           │    │
  │  │  ③ Tiếp tục cho đến root app/! ★                      │    │
  │  │  ④ Không có ở đâu → default 401 page! ★              │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ GIỐNG NHÓM "AUTH INTERRUPTS":                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  unauthorized() + forbidden() = AUTH INTERRUPTS! ★    │    │
  │  │                                                       │    │
  │  │  → Cùng flag: authInterrupts: true! ★                 │    │
  │  │  → Cùng pattern: throw → catch → render file! ★      │    │
  │  │  → Cùng giới hạn: không root layout! ★               │    │
  │  │  → Cùng version: v15.1.0! ★                          │    │
  │  │                                                       │    │
  │  │  unauthorized() = 401 (AUTHENTICATION!) ★              │    │
  │  │  forbidden()    = 403 (AUTHORIZATION!)  ★              │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — UnauthorizedFunctionEngine!

```javascript
var UnauthorizedFunctionEngine = (function () {
  // ═══════════════════════════════════
  // 1. CONFIG VALIDATOR
  // ═══════════════════════════════════
  function validateConfig(nextConfig) {
    if (!nextConfig || !nextConfig.experimental) {
      return {
        valid: false,
        error: "Missing experimental config! ★★★",
        fix: "Thêm experimental: { authInterrupts: true }",
      };
    }
    if (!nextConfig.experimental.authInterrupts) {
      return {
        valid: false,
        error: "authInterrupts chưa bật! ★★★",
        fix: "Set authInterrupts: true",
      };
    }
    return { valid: true, note: "Config OK! unauthorized() sẵn sàng! ★" };
  }

  // ═══════════════════════════════════
  // 2. CONTEXT VALIDATOR
  // ═══════════════════════════════════
  function validateContext(context) {
    var allowed = {
      "server-component": { ok: true, note: "Phổ biến nhất! ★" },
      "server-action": { ok: true, note: "Guard mutations! ★" },
      "route-handler": { ok: true, note: "API guard! ★" },
      "nested-layout": { ok: true, note: "OK trong nested layout! ★" },
      "root-layout": {
        ok: false,
        error: "CANNOT call unauthorized() in root layout! ★★★",
        fix: "Dùng Middleware redirect hoặc nested layout! ★",
      },
      "client-component": {
        ok: false,
        error: "unauthorized() is server-only! ★★★",
        fix: "Di chuyển logic vào Server Component! ★",
      },
      middleware: {
        ok: false,
        error: "Middleware không hỗ trợ unauthorized()! ★",
        fix: "Dùng NextResponse.redirect()! ★",
      },
    };
    return (
      allowed[context] || { ok: false, error: "Unknown context: " + context }
    );
  }

  // ═══════════════════════════════════
  // 3. UNAUTHORIZED SIMULATOR
  // ═══════════════════════════════════
  var NEXT_UNAUTHORIZED = "NEXT_UNAUTHORIZED";

  function unauthorized() {
    return { thrown: NEXT_UNAUTHORIZED, status: 401 };
  }

  function simulateRequest(config, context, session) {
    // Step 1: Check config
    var configResult = validateConfig(config);
    if (!configResult.valid) {
      return { step: "CONFIG", error: configResult.error };
    }

    // Step 2: Check context
    var contextResult = validateContext(context);
    if (!contextResult.ok) {
      return { step: "CONTEXT", error: contextResult.error };
    }

    // Step 3: Check session
    if (!session) {
      var throwResult = unauthorized();
      return {
        step: "AUTH_CHECK",
        action: "THROW " + throwResult.thrown,
        status: throwResult.status,
        rendered: "unauthorized.tsx (nearest ancestor!) ★",
        userSees: "Login form UI! ★",
      };
    }

    // Step 4: Authenticated!
    return {
      step: "AUTH_CHECK",
      action: "CONTINUE",
      status: 200,
      rendered: "page.tsx ★",
      userSees: "Dashboard content! ✅",
    };
  }

  // ═══════════════════════════════════
  // 4. BOUNDARY RESOLUTION
  // ═══════════════════════════════════
  function findUnauthorizedBoundary(segments, thrownAt) {
    // segments = ['app', 'dashboard', 'settings']
    // thrownAt = 'settings' (page.tsx threw unauthorized())
    var thrownIndex = segments.indexOf(thrownAt);
    if (thrownIndex < 0) return { error: "Segment not found!" };

    // Bubble upward looking for unauthorized.tsx
    var fileSystem = {
      app: { hasUnauthorized: true },
      dashboard: { hasUnauthorized: false },
      settings: { hasUnauthorized: false },
    };

    for (var i = thrownIndex; i >= 0; i--) {
      var seg = segments[i];
      if (fileSystem[seg] && fileSystem[seg].hasUnauthorized) {
        return {
          found: seg + "/unauthorized.tsx",
          searchPath: segments.slice(thrownIndex, i - 1).reverse(),
          note: "Bubbled " + (thrownIndex - i) + " segments! ★",
        };
      }
    }

    return {
      found: "Default 401 page",
      note: "No unauthorized.tsx found anywhere! ★",
    };
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Unauthorized Function Engine ═══");

    console.log("\n── 1. Config Validation ──");
    console.log(validateConfig({ experimental: { authInterrupts: true } }));
    console.log(validateConfig({ experimental: {} }));
    console.log(validateConfig({}));

    console.log("\n── 2. Context Validation ──");
    var contexts = [
      "server-component",
      "server-action",
      "route-handler",
      "root-layout",
      "client-component",
      "middleware",
    ];
    for (var i = 0; i < contexts.length; i++) {
      console.log(contexts[i] + ":", validateContext(contexts[i]));
    }

    console.log("\n── 3. Request Simulation ──");
    var validConfig = { experimental: { authInterrupts: true } };
    console.log(
      "No session:",
      simulateRequest(validConfig, "server-component", null),
    );
    console.log(
      "Has session:",
      simulateRequest(validConfig, "server-component", { user: "Jun" }),
    );
    console.log("Bad config:", simulateRequest({}, "server-component", null));
    console.log(
      "Root layout:",
      simulateRequest(validConfig, "root-layout", null),
    );

    console.log("\n── 4. Boundary Resolution ──");
    console.log(
      findUnauthorizedBoundary(["app", "dashboard", "settings"], "settings"),
    );
  }

  return { demo: demo };
})();
// Chạy: UnauthorizedFunctionEngine.demo();
```

---

## §7. Version History!

```
  VERSION HISTORY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────┬──────────────────────────────────────────────┐ │
  │  │ Version   │ Thay đổi                                     │ │
  │  ├──────────┼──────────────────────────────────────────────┤ │
  │  │ v15.1.0   │ unauthorized introduced! ★                   │ │
  │  │           │ → Experimental! Cần authInterrupts flag! ★  │ │
  │  │           │ → Cùng lúc với forbidden()! ★               │ │
  │  └──────────┴──────────────────────────────────────────────┘ │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: unauthorized() hoạt động thế nào nội bộ?                 │
  │  → THROW internal error (NEXT_UNAUTHORIZED)! ★               │
  │  → Next.js catches → set HTTP 401! ★                        │
  │  → Tìm unauthorized.tsx gần nhất (bubble up)! ★             │
  │  → Render 401 UI page! ★                                    │
  │  → Code sau unauthorized() KHÔNG chạy! ★★★                 │
  │                                                              │
  │  ❓ 2: Setup cần những gì?                                      │
  │  → ① next.config.ts: authInterrupts: true! ★★★              │
  │  → ② Tạo app/unauthorized.tsx! ★                             │
  │  → ③ import { unauthorized } from 'next/navigation'! ★     │
  │  → Không bật config → function KHÔNG hoạt động! ★★★        │
  │                                                              │
  │  ❓ 3: Tại sao không gọi được trong Root Layout?                │
  │  → Root layout render TRƯỚC tất cả! ★                        │
  │  → Không có parent segment để catch error! ★                │
  │  → unauthorized.tsx phải nằm NGOÀI segment gọi! ★           │
  │  → GIẢI PHÁP: Middleware redirect hoặc nested layout! ★     │
  │                                                              │
  │  ❓ 4: unauthorized() vs forbidden() — khác gì?                 │
  │  → unauthorized = 401 = AUTHENTICATION! ★                   │
  │    → "Bạn là ai?" → Chưa login! ★                           │
  │  → forbidden = 403 = AUTHORIZATION! ★                        │
  │    → "Bạn có quyền không?" → Đã login nhưng không quyền! ★ │
  │  → Cùng flag authInterrupts! ★                              │
  │  → Cùng pattern throw → catch → render! ★                  │
  │                                                              │
  │  ❓ 5: unauthorized() dùng trong Server Action khi nào?         │
  │  → GUARD MUTATIONS! ★★★                                      │
  │  → Server Action = RPC → client gọi trực tiếp! ★            │
  │  → PHẢI kiểm tra session TRƯỚC mọi mutation! ★              │
  │  → Không check → anonymous user CÓ THỂ sửa data! ★★★      │
  │                                                              │
  │  ❓ 6: Giống và khác notFound() thế nào?                        │
  │  → GIỐNG:                                                    │
  │    → Throw pattern (throw internal error)! ★                 │
  │    → Bubble up tìm boundary file! ★                         │
  │    → Code sau không chạy! ★                                  │
  │  → KHÁC:                                                     │
  │    → notFound = 404 (resource missing)! ★                    │
  │    → unauthorized = 401 (auth missing)! ★                    │
  │    → notFound → since v13.0! ★                               │
  │    → unauthorized → since v15.1.0 (experimental)! ★          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
