# unauthorized.js — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/unauthorized
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: Next.js v15.1.0!

---

## §1. unauthorized.js Là Gì?

```
  unauthorized.js — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → File đặc biệt để render UI khi unauthorized() được gọi!  │
  │  → Next.js tự động trả HTTP 401 status code! ★              │
  │  → Dùng cho AUTHENTICATION! (chưa đăng nhập!) ★             │
  │                                                              │
  │  HOW IT WORKS:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │ ① Server Component kiểm tra authentication!          │    │
  │  │ ② Gọi unauthorized() từ 'next/navigation'!          │    │
  │  │ ③ Next.js trả HTTP 401 status!                        │    │
  │  │ ④ Render unauthorized.js UI!                          │    │
  │  │                                                       │    │
  │  │ FLOW:                                                  │    │
  │  │ Request → Server Component → verifySession()          │    │
  │  │   → NO session? → unauthorized() → 401 + UI! ★       │    │
  │  │   → HAS session? → render Dashboard! ✅               │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ EXPERIMENTAL! (v15.1.0!) Flask icon trong docs! ★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Convention — Cách Viết!

```
  CONVENTION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FILE: app/unauthorized.tsx (hoặc .js, .jsx)                  │
  │                                                              │
  │  // app/unauthorized.tsx                                        │
  │  import Login from '@/app/components/Login'                   │
  │                                                              │
  │  export default function Unauthorized() {                     │
  │    return (                                                   │
  │      <main>                                                   │
  │        <h1>401 - Unauthorized</h1>                            │
  │        <p>Please log in to access this page.</p>              │
  │        <Login />  ← Login form component!                    │
  │      </main>                                                  │
  │    )                                                          │
  │  }                                                            │
  │                                                              │
  │  TRIGGERING (trong page/layout/route handler):                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // app/dashboard/page.tsx                             │    │
  │  │ import { verifySession } from '@/app/lib/dal'         │    │
  │  │ import { unauthorized } from 'next/navigation'        │    │
  │  │                                                       │    │
  │  │ export default async function DashboardPage() {       │    │
  │  │   const session = await verifySession()               │    │
  │  │   if (!session) {                                      │    │
  │  │     unauthorized()  ← triggers 401 + UI! ★           │    │
  │  │   }                                                    │    │
  │  │   return <div>Dashboard</div>                          │    │
  │  │ }                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Props — KHÔNG CÓ!

```
  PROPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  unauthorized.js KHÔNG nhận BẤT KỲ prop nào! ★              │
  │                                                              │
  │  → KHÔNG có error, reset! (khác error.js!)                   │
  │  → KHÔNG có params! (khác page.js!)                          │
  │  → KHÔNG có children! (khác layout/template!)                │
  │  → Component đơn giản, chỉ render UI! ★                     │
  │                                                              │
  │  export default function Unauthorized() {                     │
  │    // Không có props!                                         │
  │    return <div>401 - Please log in!</div>                    │
  │  }                                                            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. unauthorized vs forbidden vs not-found vs error!

```
  SO SÁNH 4 SPECIAL FILES:
  ┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
  │              │ unauthorized │ forbidden    │ not-found    │ error        │
  ├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
  │ Status       │ 401 ★        │ 403          │ 404          │ 500          │
  │ Trigger      │ unauthorized()│ forbidden() │ notFound()   │ throw Error  │
  │ Import       │ next/        │ next/        │ next/        │ N/A (auto)   │
  │              │ navigation   │ navigation   │ navigation   │              │
  │ Use case     │ Chưa LOGIN!  │ Không QUYỀN! │ Không TỒN TẠI│ Runtime BUG │
  │ Props        │ NONE ★       │ NONE         │ NONE         │ error, reset │
  │ 'use client' │ Optional     │ Optional     │ Optional     │ REQUIRED!    │
  │ Since        │ v15.1.0 ★    │ v15.1.0      │ v13.0        │ v13.0        │
  └──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘

  AUTHENTICATION vs AUTHORIZATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  401 unauthorized = AUTHENTICATION! ★                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → "BẠN LÀ AI?" ★                                     │    │
  │  │ → Chưa đăng nhập! Chưa xác thực danh tính!           │    │
  │  │ → Cần LOGIN trước! ★                                  │    │
  │  │ → Ví dụ: Truy cập /dashboard mà chưa login!          │    │
  │  │ → Hiển thị: Login form! ★                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  403 forbidden = AUTHORIZATION! ★                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → "BẠN CÓ QUYỀN KHÔNG?" ★                            │    │
  │  │ → Đã đăng nhập NHƯNG không đủ quyền!                 │    │
  │  │ → Biết bạn là ai, nhưng KHÔNG CHO PHÉP! ★            │    │
  │  │ → Ví dụ: User thường truy cập /admin!                │    │
  │  │ → Hiển thị: "Bạn không có quyền truy cập!" ★         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DECISION TREE:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Request đến → Đã đăng nhập?                          │    │
  │  │       │                                                │    │
  │  │    ┌──┴──┐                                             │    │
  │  │   NO    YES                                           │    │
  │  │    │     │                                             │    │
  │  │    ▼     ▼                                             │    │
  │  │  401!   Có quyền?                                     │    │
  │  │ (login)  │                                             │    │
  │  │       ┌──┴──┐                                          │    │
  │  │      NO    YES                                        │    │
  │  │       │     │                                          │    │
  │  │       ▼     ▼                                          │    │
  │  │     403!  Render page! ✅                              │    │
  │  │  (forbidden)                                           │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — UnauthorizedEngine!

```javascript
var UnauthorizedEngine = (function () {
  // ═══════════════════════════════════
  // 1. AUTH CHECK SIMULATOR
  // ═══════════════════════════════════
  function checkAuth(session, requiredRole, hasFiles) {
    // Step 1: Authentication check (401)
    if (!session) {
      return {
        status: 401,
        rendered: hasFiles.unauthorized ? "unauthorized.js" : "default 401",
        reason: "Chưa đăng nhập! Cần LOGIN! ★",
        showLoginForm: true,
      };
    }

    // Step 2: Authorization check (403)
    if (requiredRole && session.role !== requiredRole) {
      return {
        status: 403,
        rendered: hasFiles.forbidden ? "forbidden.js" : "default 403",
        reason: "Đã login nhưng KHÔNG đủ quyền! ★",
        currentRole: session.role,
        requiredRole: requiredRole,
      };
    }

    // Step 3: Success
    return {
      status: 200,
      rendered: "page.js",
      reason: "Authenticated + Authorized! ✅",
    };
  }

  // ═══════════════════════════════════
  // 2. STATUS CODE RESOLVER
  // ═══════════════════════════════════
  function resolveStatusFile(statusCode) {
    var mapping = {
      401: {
        file: "unauthorized.js",
        function: "unauthorized()",
        import: "next/navigation",
        meaning: "Chưa xác thực! Cần đăng nhập! ★",
        props: "NONE!",
        since: "v15.1.0",
      },
      403: {
        file: "forbidden.js",
        function: "forbidden()",
        import: "next/navigation",
        meaning: "Không có quyền truy cập! ★",
        props: "NONE!",
        since: "v15.1.0",
      },
      404: {
        file: "not-found.js",
        function: "notFound()",
        import: "next/navigation",
        meaning: "Tài nguyên không tồn tại! ★",
        props: "NONE!",
        since: "v13.0",
      },
      500: {
        file: "error.js",
        function: "throw Error",
        import: "N/A (auto catch!)",
        meaning: "Lỗi runtime! ★",
        props: "{ error, reset }",
        since: "v13.0",
        mustBeClient: true,
      },
    };
    return mapping[statusCode] || { error: "Unknown status: " + statusCode };
  }

  // ═══════════════════════════════════
  // 3. AUTH FLOW SIMULATOR
  // ═══════════════════════════════════
  function simulateAuthFlow(routes) {
    var results = [];
    for (var i = 0; i < routes.length; i++) {
      var route = routes[i];
      var result = checkAuth(route.session, route.requiredRole, {
        unauthorized: route.hasUnauthorizedFile,
        forbidden: route.hasForbiddenFile,
      });
      results.push({
        path: route.path,
        user: route.session ? route.session.user : "anonymous",
        result: result,
      });
    }
    return results;
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Unauthorized Engine ═══");

    console.log("\n── Auth Check ──");
    console.log("No session:", checkAuth(null, null, { unauthorized: true }));
    console.log(
      "User → admin:",
      checkAuth({ role: "user", user: "Jun" }, "admin", { forbidden: true }),
    );
    console.log(
      "Admin → admin:",
      checkAuth({ role: "admin", user: "Jun" }, "admin", {}),
    );

    console.log("\n── Status Files ──");
    console.log("401:", resolveStatusFile(401));
    console.log("403:", resolveStatusFile(403));
    console.log("404:", resolveStatusFile(404));
    console.log("500:", resolveStatusFile(500));

    console.log("\n── Flow Simulation ──");
    var flow = simulateAuthFlow([
      {
        path: "/dashboard",
        session: null,
        requiredRole: null,
        hasUnauthorizedFile: true,
      },
      {
        path: "/admin",
        session: { role: "user", user: "Jun" },
        requiredRole: "admin",
        hasForbiddenFile: true,
      },
      {
        path: "/admin",
        session: { role: "admin", user: "Boss" },
        requiredRole: "admin",
        hasUnauthorizedFile: true,
        hasForbiddenFile: true,
      },
    ]);
    for (var i = 0; i < flow.length; i++) {
      console.log(
        flow[i].path + " (" + flow[i].user + "):",
        flow[i].result.status,
        flow[i].result.rendered,
        flow[i].result.reason,
      );
    }
  }

  return { demo: demo };
})();
// Chạy: UnauthorizedEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: 401 vs 403 — khác nhau thế nào?                        │
  │  → 401 = AUTHENTICATION! "Bạn là AI?" ★                     │
  │    → Chưa đăng nhập! Cần login! ★                            │
  │    → unauthorized() + unauthorized.js!                        │
  │  → 403 = AUTHORIZATION! "Bạn có QUYỀN không?" ★             │
  │    → Đã login nhưng không đủ quyền! ★                        │
  │    → forbidden() + forbidden.js!                              │
  │                                                              │
  │  ❓ 2: unauthorized.js nhận props gì?                          │
  │  → KHÔNG CÓ! Không nhận bất kỳ prop nào! ★                  │
  │  → Giống forbidden.js và not-found.js!                       │
  │  → Khác error.js (có error + reset props!)                   │
  │                                                              │
  │  ❓ 3: unauthorized() gọi ở đâu?                               │
  │  → Server Components! (page, layout, route handler!)         │
  │  → import { unauthorized } from 'next/navigation'! ★        │
  │  → Kiểm tra session → không có → unauthorized()! ★           │
  │                                                              │
  │  ❓ 4: Thứ tự check authentication đúng?                       │
  │  → ① Đã login? → NO → 401 unauthorized! ★                   │
  │  → ② Có quyền? → NO → 403 forbidden! ★                      │
  │  → ③ Resource tồn tại? → NO → 404 not-found! ★              │
  │  → ④ Runtime OK? → NO → 500 error! ★                        │
  │  → ⑤ All good! → 200 render page! ✅                        │
  │                                                              │
  │  ❓ 5: unauthorized.js có cần 'use client' không?              │
  │  → OPTIONAL! Không bắt buộc! ★                               │
  │  → Nếu cần Login form (useState, onClick) → thêm!           │
  │  → Nếu chỉ hiện text tĩnh → Server Component OK!           │
  │  → Khác error.js (BẮT BUỘC 'use client'!)                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
