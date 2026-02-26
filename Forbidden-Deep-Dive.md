# forbidden() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/forbidden
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v15.1.0! **Experimental**: authInterrupts!

---

## §1. forbidden() Là Gì?

```
  forbidden() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Throw error → render 403 Forbidden page! ★                │
  │  → Xử lý AUTHORIZATION errors! ★                            │
  │  → User ĐÃ đăng nhập nhưng KHÔNG ĐỦ quyền! ★              │
  │                                                              │
  │  IMPORT:                                                      │
  │  import { forbidden } from 'next/navigation'                 │
  │                                                              │
  │  SETUP (next.config.js):                                      │
  │  experimental: { authInterrupts: true }  ← BẮT BUỘC! ★     │
  │                                                              │
  │  FLOW — AUTHORIZATION CHECK:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  Request → Server Component                           │    │
  │  │     │                                                  │    │
  │  │     ▼                                                  │    │
  │  │  verifySession() → session                            │    │
  │  │     │                                                  │    │
  │  │     ▼                                                  │    │
  │  │  session.role !== 'admin'?                             │    │
  │  │     │                                                  │    │
  │  │     ├── YES → forbidden()! ★                           │    │
  │  │     │           │                                      │    │
  │  │     │           ▼                                      │    │
  │  │     │    Render forbidden.js → 403 page! ★             │    │
  │  │     │                                                  │    │
  │  │     └── NO → Render admin page! ✅                     │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DÙNG ĐƯỢC Ở ĐÂU:                                            │
  │  → Server Components ✅                                      │
  │  → Server Functions ✅                                       │
  │  → Route Handlers ✅                                         │
  │  → Root Layout ❌ KHÔNG ĐƯỢC! ★★★                            │
  │                                                              │
  │  403 vs 401 vs 404:                                           │
  │  ┌──────────┬────────────────────────────────────────────┐   │
  │  │ Status   │ Ý nghĩa                                   │   │
  │  ├──────────┼────────────────────────────────────────────┤   │
  │  │ 401      │ UNAUTHORIZED: Chưa đăng nhập! ★           │   │
  │  │ 403      │ FORBIDDEN: Đăng nhập rồi, KHÔNG quyền! ★ │   │
  │  │ 404      │ NOT FOUND: Resource không tồn tại! ★      │   │
  │  └──────────┴────────────────────────────────────────────┘   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Examples — 2 Patterns!

```
  PATTERN 1: ROLE-BASED ROUTE PROTECTION!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  import { verifySession } from '@/app/lib/dal'               │
  │  import { forbidden } from 'next/navigation'                │
  │                                                              │
  │  export default async function AdminPage() {                  │
  │    const session = await verifySession()                     │
  │                                                              │
  │    if (session.role !== 'admin') {                            │
  │      forbidden()  // → 403 page! ★                           │
  │    }                                                         │
  │                                                              │
  │    return (                                                   │
  │      <main>                                                  │
  │        <h1>Admin Dashboard</h1>                              │
  │        <p>Welcome, {session.user.name}!</p>                  │
  │      </main>                                                 │
  │    )                                                         │
  │  }                                                           │
  │                                                              │
  │  → Authenticated nhưng KHÔNG phải admin → 403! ★             │
  │  → Admin → render dashboard! ✅                              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  PATTERN 2: SERVER ACTION MUTATION PROTECTION!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  'use server'                                                 │
  │  import { verifySession } from '@/app/lib/dal'               │
  │  import { forbidden } from 'next/navigation'                │
  │                                                              │
  │  export async function updateRole(formData) {                 │
  │    const session = await verifySession()                     │
  │                                                              │
  │    if (session.role !== 'admin') {                            │
  │      forbidden()  // Chỉ admin mới update role! ★            │
  │    }                                                         │
  │                                                              │
  │    // Update role trong database...                          │
  │  }                                                           │
  │                                                              │
  │  → Bảo vệ MUTATION (write operations!) ★                    │
  │  → Sensitive data chỉ admin mới sửa! ★                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  forbidden() vs unauthorized() vs notFound():
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────────────┬────────┬──────────────────────────────┐  │
  │  │ Function       │ Status │ Khi nào dùng?                │  │
  │  ├────────────────┼────────┼──────────────────────────────┤  │
  │  │ unauthorized() │ 401    │ Chưa đăng nhập! ★            │  │
  │  │ forbidden()    │ 403    │ Đã đăng nhập, thiếu quyền! ★│  │
  │  │ notFound()     │ 404    │ Resource không tồn tại! ★    │  │
  │  └────────────────┴────────┴──────────────────────────────┘  │
  │                                                              │
  │  DECISION TREE:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ User request → Có session?                            │    │
  │  │   NO  → unauthorized()! (401!) ★                      │    │
  │  │   YES → Có đủ quyền?                                  │    │
  │  │           NO  → forbidden()! (403!) ★                  │    │
  │  │           YES → Render page! ✅                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — ForbiddenEngine!

```javascript
var ForbiddenEngine = (function () {
  // ═══════════════════════════════════
  // 1. AUTHORIZATION CHECKER
  // ═══════════════════════════════════
  function checkAuthorization(session, requiredRole) {
    if (!session) {
      return {
        status: 401,
        action: "unauthorized()",
        reason: "Chưa đăng nhập! → 401! ★",
      };
    }
    if (session.role !== requiredRole) {
      return {
        status: 403,
        action: "forbidden()",
        reason:
          "Role '" +
          session.role +
          "' KHÔNG phải '" +
          requiredRole +
          "'! → 403! ★",
      };
    }
    return {
      status: 200,
      action: "render",
      reason:
        "Authorized! Role '" + session.role + "' = '" + requiredRole + "'! ✅",
    };
  }

  // ═══════════════════════════════════
  // 2. CONTEXT CHECKER
  // ═══════════════════════════════════
  function canCallForbidden(context) {
    var rules = {
      "Server Component": true,
      "Server Function": true,
      "Route Handler": true,
      "Root Layout": false,
      "Client Component": false,
    };
    var allowed = rules[context];
    return {
      context: context,
      allowed: allowed !== undefined ? allowed : false,
      reason: allowed
        ? context + " cho phép forbidden()! ✅"
        : context + " KHÔNG cho phép forbidden()! ❌",
    };
  }

  // ═══════════════════════════════════
  // 3. STATUS CODE RESOLVER
  // ═══════════════════════════════════
  function resolveErrorFunction(session, resourceExists) {
    if (!session) return { func: "unauthorized()", status: 401 };
    if (!resourceExists) return { func: "notFound()", status: 404 };
    return { func: "forbidden()", status: 403 };
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Forbidden Engine ═══");

    console.log("\n── Auth Check ──");
    console.log("No session:", checkAuthorization(null, "admin"));
    console.log("User role:", checkAuthorization({ role: "user" }, "admin"));
    console.log("Admin role:", checkAuthorization({ role: "admin" }, "admin"));

    console.log("\n── Context ──");
    console.log(canCallForbidden("Server Component"));
    console.log(canCallForbidden("Root Layout"));
    console.log(canCallForbidden("Client Component"));

    console.log("\n── Resolve ──");
    console.log("No session:", resolveErrorFunction(null, true));
    console.log("No resource:", resolveErrorFunction({ role: "user" }, false));
    console.log("No permission:", resolveErrorFunction({ role: "user" }, true));
  }

  return { demo: demo };
})();
// Chạy: ForbiddenEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: forbidden() dùng để làm gì?                            │
  │  → Throw error → render 403 page! ★                         │
  │  → User ĐÃ đăng nhập nhưng KHÔNG ĐỦ quyền! ★              │
  │  → Customize UI bằng forbidden.js! ★                        │
  │                                                              │
  │  ❓ 2: forbidden() vs unauthorized() — khác gì?               │
  │  → unauthorized() = 401 = CHƯA đăng nhập! ★                 │
  │  → forbidden() = 403 = Đăng nhập RỒI, thiếu QUYỀN! ★      │
  │  → 2 hàm khác nhau cho 2 tình huống khác nhau! ★           │
  │                                                              │
  │  ❓ 3: Setup cần gì?                                           │
  │  → experimental: { authInterrupts: true }! ★                 │
  │  → Trong next.config.js! ★                                  │
  │  → Tùy chọn: tạo forbidden.js cho custom UI! ★             │
  │                                                              │
  │  ❓ 4: forbidden() gọi ở đâu KHÔNG ĐƯỢC?                      │
  │  → Root Layout! ❌ ★★★                                       │
  │  → Client Component (không có trên docs nhưng server-only!) │
  │                                                              │
  │  ❓ 5: Dùng forbidden() trong Server Action — khi nào?         │
  │  → Bảo vệ MUTATION (write operations!) ★                    │
  │  → Chỉ admin mới update sensitive data! ★                   │
  │  → Check role TRƯỚC khi thực hiện mutation! ★               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
