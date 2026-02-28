# Next.js `use server` Directive — Deep Dive!

> **Chủ đề**: `use server` — Server Functions & Server Actions!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/api-reference/directives/use-server
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — use server!](#1)
2. [§2. File-Level — Toàn bộ file!](#2)
3. [§3. Inline — Trong function!](#3)
4. [§4. Client → Server Flow!](#4)
5. [§5. Security — Authentication!](#5)
6. [§6. use server vs use client — Complete!](#6)
7. [§7. Tự Viết — UseServerEngine!](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — use server!

```
  "use server" DIRECTIVE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  WHAT: Designates function or file to execute on SERVER!   │
  │  → React feature (not Next.js specific!)                  │
  │                                                            │
  │  2 WAYS TO USE:                                             │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① FILE-LEVEL: Top of file!                          │  │
  │  │   → ALL functions in file = Server Functions!        │  │
  │  │                                                      │  │
  │  │ ② INLINE: Top of function body!                     │  │
  │  │   → Only THAT function = Server Function!            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  WHAT IS A SERVER FUNCTION?                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ • Function that ALWAYS executes on the server!       │  │
  │  │ • Can be called from Client Components!              │  │
  │  │ • Client calls → network request → server executes! │  │
  │  │ • Result serialized → sent back to client!           │  │
  │  │ • Direct access to DB, filesystem, secrets! ✅      │  │
  │  │ • Also called "Server Actions" (when used in forms!) │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FLOW:                                                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  ┌──────────────┐     Network     ┌──────────────┐  │  │
  │  │  │ Client       │ ──────────────→ │ Server       │  │  │
  │  │  │ (Browser)    │     POST req    │ (Node.js)    │  │  │
  │  │  │              │                 │              │  │  │
  │  │  │ onClick()    │                 │ 'use server' │  │  │
  │  │  │ calls action │                 │ function     │  │  │
  │  │  │              │ ←────────────── │ executes     │  │  │
  │  │  │ receives     │   Serialized    │ accesses DB  │  │  │
  │  │  │ result       │    response     │ returns data │  │  │
  │  │  └──────────────┘                 └──────────────┘  │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. File-Level — Toàn bộ file!

```
  FILE-LEVEL 'use server':
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  'use server' at TOP OF FILE = ALL exports are Server!     │
  │                                                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // actions.ts                                        │  │
  │  │ 'use server'              // ← LINE 1! Before all!  │  │
  │  │                                                      │  │
  │  │ import { db } from '@/lib/db'                        │  │
  │  │                                                      │  │
  │  │ export async function createUser(data: {             │  │
  │  │   name: string                                       │  │
  │  │   email: string                                      │  │
  │  │ }) {                                                 │  │
  │  │   const user = await db.user.create({ data })        │  │
  │  │   return user                                        │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ export async function deleteUser(id: string) {       │  │
  │  │   await db.user.delete({ where: { id } })            │  │
  │  │ }                                                    │  │
  │  │                                                      │  │
  │  │ // ALL functions = Server Functions! ✅             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  BEST PRACTICE: Dedicated 'actions.ts' file!               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ app/                                                 │  │
  │  │ ├── actions.ts      ← 'use server' (all actions!)   │  │
  │  │ ├── page.tsx        ← Server Component               │  │
  │  │ └── components/                                      │  │
  │  │     └── form.tsx    ← 'use client' (imports actions!)│  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §3. Inline — Trong function!

```
  INLINE 'use server':
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  'use server' INSIDE function body!                        │
  │  → Only THAT function is Server!                          │
  │  → Can be defined inside Server Components!               │
  │  → Can CAPTURE closure variables!                         │
  │                                                            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // page.tsx (Server Component!)                      │  │
  │  │ import { EditPost } from './edit-post'               │  │
  │  │ import { revalidatePath } from 'next/cache'          │  │
  │  │                                                      │  │
  │  │ export default async function PostPage({ params }) {  │  │
  │  │   const post = await getPost(params.id)              │  │
  │  │                                                      │  │
  │  │   // INLINE Server Action!                           │  │
  │  │   async function updatePost(formData: FormData) {    │  │
  │  │     'use server'  // ← INSIDE function body!        │  │
  │  │     await savePost(params.id, formData)              │  │
  │  │     //             ↑ CLOSURE captures params.id!    │  │
  │  │     revalidatePath(`/posts/${params.id}`)            │  │
  │  │   }                                                  │  │
  │  │                                                      │  │
  │  │   return <EditPost updatePostAction={updatePost}     │  │
  │  │                    post={post} />                    │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CLOSURE CAPTURE:                                           │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ PostPage(params.id = '42')                           │  │
  │  │   │                                                  │  │
  │  │   └── updatePost(formData)                           │  │
  │  │       'use server'                                   │  │
  │  │       params.id = '42' ← CAPTURED from outer scope! │  │
  │  │                                                      │  │
  │  │ → Client receives reference to Server Function!     │  │
  │  │ → params.id encrypted + sent as hidden payload!     │  │
  │  │ → Client calls updatePost → POST request!           │  │
  │  │ → Server decrypts params.id + executes!             │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  FILE-LEVEL vs INLINE:                                      │
  │  ┌──────────────────┬──────────────────────────────────┐   │
  │  │                  │ File-Level      │ Inline         │   │
  │  ├──────────────────┼──────────────────┼────────────────┤   │
  │  │ Placement        │ Top of file!    │ Inside func!   │   │
  │  │ Scope            │ ALL exports!    │ Single func!   │   │
  │  │ Closure capture  │ ❌ No!         │ ✅ Yes!       │   │
  │  │ Import needed?   │ Yes! (export)   │ No! (inline!)  │   │
  │  │ Reusable?        │ ✅ (exported!) │ ⚠️ (local!)   │   │
  │  │ Best for         │ Shared actions! │ Page-specific! │   │
  │  └──────────────────┴──────────────────┴────────────────┘   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Client → Server Flow!

```
  USING SERVER FUNCTIONS IN CLIENT COMPONENTS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  STEP 1: Create Server Functions in dedicated file!        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // actions.ts                                        │  │
  │  │ 'use server'                                         │  │
  │  │                                                      │  │
  │  │ import { db } from '@/lib/db'                        │  │
  │  │                                                      │  │
  │  │ export async function fetchUsers() {                 │  │
  │  │   const users = await db.user.findMany()             │  │
  │  │   return users                                       │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  STEP 2: Import into Client Component!                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ // button.tsx                                        │  │
  │  │ 'use client'                                         │  │
  │  │ import { fetchUsers } from '../actions'              │  │
  │  │                                                      │  │
  │  │ export default function MyButton() {                 │  │
  │  │   return (                                           │  │
  │  │     <button onClick={() => fetchUsers()}>            │  │
  │  │       Fetch Users                                    │  │
  │  │     </button>                                        │  │
  │  │   )                                                  │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  WHAT HAPPENS:                                              │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Client imports fetchUsers                         │  │
  │  │   → But receives REFERENCE, not actual code!        │  │
  │  │   → Server code NEVER sent to browser!              │  │
  │  │                                                      │  │
  │  │ ② User clicks button                                │  │
  │  │   → onClick triggers fetchUsers()                   │  │
  │  │   → React sends POST request to server!             │  │
  │  │                                                      │  │
  │  │ ③ Server receives request                           │  │
  │  │   → Finds fetchUsers function by ID!                │  │
  │  │   → Executes with db.user.findMany()!               │  │
  │  │   → Has full server access! DB, fs, secrets!        │  │
  │  │                                                      │  │
  │  │ ④ Server returns serialized result                  │  │
  │  │   → users array serialized!                         │  │
  │  │   → Sent back to client via response!               │  │
  │  │                                                      │  │
  │  │ ⑤ Client receives data                              │  │
  │  │   → Deserialized users array!                       │  │
  │  │   → Can use in state, render, etc!                  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  USE CASES:                                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ① Form submissions    → <form action={save}>       │  │
  │  │ ② Button clicks       → onClick={fetchData}        │  │
  │  │ ③ Data mutations      → create, update, delete!    │  │
  │  │ ④ Revalidation        → revalidatePath/Tag!        │  │
  │  │ ⑤ File operations     → upload, read, write!       │  │
  │  │ ⑥ External APIs       → call with secrets!         │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Security — Authentication!

```
  SECURITY CONSIDERATIONS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ⚠️ CRITICAL: Server Functions are PUBLIC ENDPOINTS!      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Every Server Function = HTTP endpoint!               │  │
  │  │ Anyone with the URL can call it!                     │  │
  │  │ → MUST authenticate + authorize EVERY call! ⚠️     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  PATTERN: Auth Check FIRST!                                 │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ 'use server'                                         │  │
  │  │ import { db } from '@/lib/db'                        │  │
  │  │ import { authenticate } from '@/lib/auth'            │  │
  │  │                                                      │  │
  │  │ export async function createUser(                    │  │
  │  │   data: { name: string; email: string },             │  │
  │  │   token: string                                      │  │
  │  │ ) {                                                  │  │
  │  │   // ① AUTHENTICATE FIRST!                          │  │
  │  │   const user = authenticate(token)                   │  │
  │  │   if (!user) {                                       │  │
  │  │     throw new Error('Unauthorized')  // ← STOP!    │  │
  │  │   }                                                  │  │
  │  │                                                      │  │
  │  │   // ② Only then perform action!                    │  │
  │  │   const newUser = await db.user.create({ data })     │  │
  │  │   return newUser                                     │  │
  │  │ }                                                    │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  SECURITY CHECKLIST:                                        │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ ☐ Authenticate user (who are you?)                  │  │
  │  │ ☐ Authorize action (can you do this?)               │  │
  │  │ ☐ Validate input (is data safe?)                    │  │
  │  │ ☐ Sanitize output (no sensitive leaks?)             │  │
  │  │ ☐ Rate limit (prevent abuse?)                       │  │
  │  │ ☐ Error handling (no stack trace to client?)        │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CLOSURE SECURITY:                                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Inline Server Actions capture closure vars!          │  │
  │  │ → Closure vars ENCRYPTED before sending to client!  │  │
  │  │ → Client cannot read or modify them!                │  │
  │  │ → Server decrypts when function called!             │  │
  │  │ → Encryption key = server-only!                     │  │
  │  │                                                      │  │
  │  │ BUT: Still validate! Don't trust closure alone!      │  │
  │  │ → Always re-check permissions on server!            │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. use server vs use client — Complete!

```
  use server vs use client — COMPARISON:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────────────────┬────────────────┬──────────────────┐ │
  │  │                    │ 'use server'   │ 'use client'     │ │
  │  ├────────────────────┼────────────────┼──────────────────┤ │
  │  │ Purpose            │ Server-side    │ Client-side      │ │
  │  │                    │ execution!     │ rendering!       │ │
  │  │ Placement          │ File top OR    │ File top ONLY!   │ │
  │  │                    │ function body! │                  │ │
  │  │ Creates            │ Server Function│ Client Component │ │
  │  │                    │ (action!)      │ (interactive!)   │ │
  │  │ DB access          │ ✅ Direct!    │ ❌ Via API!     │ │
  │  │ Secrets/env        │ ✅ All!       │ ❌ NEXT_PUBLIC! │ │
  │  │ useState           │ ❌ No!        │ ✅ Yes!         │ │
  │  │ Events             │ ❌ No!        │ ✅ Yes!         │ │
  │  │ Browser APIs       │ ❌ No!        │ ✅ Yes!         │ │
  │  │ Called by Client?   │ ✅ Yes!       │ N/A (renders!)  │ │
  │  │ Network behavior   │ POST request!  │ JS download!     │ │
  │  │ Code in bundle?    │ ❌ No!        │ ✅ Yes!         │ │
  │  │ Serializable args  │ ✅ Required!  │ ✅ Required!    │ │
  │  │ Can use in forms   │ ✅ action={}  │ ❌ (handler!)   │ │
  │  └────────────────────┴────────────────┴──────────────────┘ │
  │                                                              │
  │  HOW THEY WORK TOGETHER:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ 'use server' (actions.ts)                            │    │
  │  │   export async function save() { ... }               │    │
  │  │       ↑                                              │    │
  │  │       │ import                                       │    │
  │  │       │                                              │    │
  │  │ 'use client' (form.tsx)                              │    │
  │  │   import { save } from './actions'                   │    │
  │  │   <form action={save}>  ← Server Action in form!    │    │
  │  │     <input name="data" />                            │    │
  │  │     <button>Submit</button>                          │    │
  │  │   </form>                                            │    │
  │  │       ↑                                              │    │
  │  │       │ rendered by                                  │    │
  │  │       │                                              │    │
  │  │ Server Component (page.tsx)                          │    │
  │  │   <Form />                                           │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — UseServerEngine!

```javascript
var UseServerEngine = (function () {
  // ═══════════════════════════════════
  // 1. SERVER FUNCTION REGISTRY
  // ═══════════════════════════════════
  var functions = {};
  var callLog = [];
  var encryptionKey =
    "SERVER_SECRET_" + Math.random().toString(36).substr(2, 8);

  function registerServerFunction(name, fn, options) {
    options = options || {};
    functions[name] = {
      fn: fn,
      name: name,
      level: options.level || "file", // 'file' or 'inline'
      requiresAuth: options.requiresAuth || false,
      closureVars: options.closureVars || {},
    };
    return name; // Return ID for client reference!
  }

  // ═══════════════════════════════════
  // 2. CLOSURE ENCRYPTION
  // ═══════════════════════════════════
  function encryptClosure(vars) {
    // Simulate encryption of closure variables!
    var payload = JSON.stringify(vars);
    var encrypted = "";
    for (var i = 0; i < payload.length; i++) {
      encrypted += String.fromCharCode(
        payload.charCodeAt(i) ^
          encryptionKey.charCodeAt(i % encryptionKey.length),
      );
    }
    return { encrypted: btoa(encrypted), keyHash: encryptionKey.substr(0, 4) };
  }

  function decryptClosure(encryptedPayload) {
    var decoded = atob(encryptedPayload.encrypted);
    var decrypted = "";
    for (var i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(
        decoded.charCodeAt(i) ^
          encryptionKey.charCodeAt(i % encryptionKey.length),
      );
    }
    return JSON.parse(decrypted);
  }

  // ═══════════════════════════════════
  // 3. CLIENT REFERENCE CREATOR
  // ═══════════════════════════════════
  function createClientReference(funcName, closureVars) {
    var encrypted = closureVars ? encryptClosure(closureVars) : null;

    return {
      _type: "SERVER_FUNCTION_REFERENCE",
      functionId: funcName,
      closurePayload: encrypted,
      // Client receives THIS, not actual code!
      toString: function () {
        return "[ServerFunction:" + funcName + "]";
      },
    };
  }

  // ═══════════════════════════════════
  // 4. SERVER EXECUTION (simulated POST!)
  // ═══════════════════════════════════
  function executeOnServer(reference, args, authToken) {
    var funcId = reference.functionId;
    var func = functions[funcId];

    if (!func) {
      return { error: "❌ Function not found: " + funcId };
    }

    // Auth check!
    if (func.requiresAuth) {
      if (!authToken || authToken !== "valid_token_123") {
        return { error: "❌ Unauthorized! Auth required!" };
      }
    }

    // Decrypt closure if present!
    var closureVars = {};
    if (reference.closurePayload) {
      closureVars = decryptClosure(reference.closurePayload);
    }

    // Execute!
    var allArgs = [closureVars].concat(args || []);
    var result = func.fn.apply(null, allArgs);

    callLog.push({
      functionId: funcId,
      timestamp: Date.now(),
      args: args,
      closureVars: closureVars,
      hadAuth: !!authToken,
      success: true,
    });

    return { success: true, data: result };
  }

  // ═══════════════════════════════════
  // 5. SERIALIZATION CHECKER
  // ═══════════════════════════════════
  function checkSerializable(value, name) {
    var type = typeof value;
    if (value === null || value === undefined) return { ok: true };
    if (type === "string" || type === "number" || type === "boolean") {
      return { ok: true, type: type };
    }
    if (type === "function") {
      return {
        ok: false,
        type: "function",
        error: "❌ " + name + ": Functions NOT serializable!",
      };
    }
    if (type === "symbol") {
      return {
        ok: false,
        type: "symbol",
        error: "❌ " + name + ": Symbols NOT serializable!",
      };
    }
    if (Array.isArray(value)) return { ok: true, type: "array" };
    if (type === "object") return { ok: true, type: "object" };
    return { ok: false, type: type };
  }

  // ═══════════════════════════════════
  // 6. SECURITY ANALYZER
  // ═══════════════════════════════════
  function analyzeSecurityRisks(funcBody) {
    var risks = [];
    if (
      funcBody.indexOf("authenticate") === -1 &&
      funcBody.indexOf("auth") === -1
    ) {
      risks.push("⚠️ No authentication check found!");
    }
    if (
      funcBody.indexOf("authorize") === -1 &&
      funcBody.indexOf("permission") === -1
    ) {
      risks.push("⚠️ No authorization check found!");
    }
    if (
      funcBody.indexOf("validate") === -1 &&
      funcBody.indexOf("schema") === -1
    ) {
      risks.push("⚠️ No input validation found!");
    }
    return {
      risks: risks,
      riskLevel:
        risks.length === 0 ? "LOW" : risks.length <= 1 ? "MEDIUM" : "HIGH",
    };
  }

  // ═══════════════════════════════════
  // 7. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔══════════════════════════════════════╗");
    console.log("║  USE SERVER ENGINE DEMO               ║");
    console.log("╚══════════════════════════════════════╝");

    // Register file-level actions
    console.log("\n── File-Level Actions ──");
    registerServerFunction(
      "createUser",
      function (closure, data) {
        return { id: "usr_" + Date.now(), name: data.name };
      },
      { level: "file", requiresAuth: true },
    );
    registerServerFunction(
      "fetchUsers",
      function () {
        return [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ];
      },
      { level: "file" },
    );
    console.log("  Registered: createUser (auth required!)");
    console.log("  Registered: fetchUsers (public!)");

    // Register inline action with closure
    console.log("\n── Inline Action (with closure!) ──");
    registerServerFunction(
      "updatePost",
      function (closure, formData) {
        return {
          postId: closure.postId,
          updated: true,
          data: formData,
        };
      },
      { level: "inline", closureVars: { postId: "42" } },
    );
    console.log("  Registered: updatePost (captures postId=42!)");

    // Create client references
    console.log("\n── Client References ──");
    var fetchRef = createClientReference("fetchUsers");
    console.log("  fetchUsers ref:", String(fetchRef));
    console.log("  Contains code?", "NO! Reference only! ✅");

    var updateRef = createClientReference("updatePost", { postId: "42" });
    console.log("  updatePost ref:", String(updateRef));
    console.log(
      "  Closure encrypted?",
      updateRef.closurePayload ? "YES! ✅" : "NO",
    );

    // Execute server functions
    console.log("\n── Server Execution ──");

    // Public function
    var r1 = executeOnServer(fetchRef, []);
    console.log(
      "  fetchUsers():",
      r1.success ? "✅" : "❌",
      JSON.stringify(r1.data),
    );

    // Auth-required without token
    var createRef = createClientReference("createUser");
    var r2 = executeOnServer(createRef, [{ name: "Charlie" }], null);
    console.log("  createUser(no token):", r2.error);

    // Auth-required with token
    var r3 = executeOnServer(
      createRef,
      [{ name: "Charlie" }],
      "valid_token_123",
    );
    console.log(
      "  createUser(valid token):",
      r3.success ? "✅" : "❌",
      JSON.stringify(r3.data),
    );

    // Inline with closure
    var r4 = executeOnServer(updateRef, [{ title: "New Title" }]);
    console.log("  updatePost(closure):", JSON.stringify(r4.data));
    console.log("  → postId came from encrypted closure!");

    // Serialization checks
    console.log("\n── Serialization Checks ──");
    var tests = [
      { v: "hello", n: "string" },
      { v: 42, n: "number" },
      { v: function () {}, n: "callback" },
      { v: { a: 1 }, n: "object" },
      { v: Symbol("x"), n: "symbol" },
    ];
    for (var i = 0; i < tests.length; i++) {
      var check = checkSerializable(tests[i].v, tests[i].n);
      console.log(
        "  " + tests[i].n + ": " + (check.ok ? "✅ OK" : check.error),
      );
    }

    // Security analysis
    console.log("\n── Security Analysis ──");
    var safe = analyzeSecurityRisks(
      "authenticate(token); authorize(user); validate(data);",
    );
    console.log("  Safe function: Risk=" + safe.riskLevel);

    var unsafe = analyzeSecurityRisks("db.user.create({ data })");
    console.log("  Unsafe function: Risk=" + unsafe.riskLevel);
    for (var j = 0; j < unsafe.risks.length; j++) {
      console.log("    " + unsafe.risks[j]);
    }

    // Call log
    console.log("\n── Call Log ──");
    console.log("  Total calls:", callLog.length);
    for (var k = 0; k < callLog.length; k++) {
      console.log(
        "  " +
          (k + 1) +
          ". " +
          callLog[k].functionId +
          " (auth: " +
          callLog[k].hadAuth +
          ")",
      );
    }
  }

  return { demo: demo };
})();
// Chạy: UseServerEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: File-level vs Inline `use server` — khác nhau?

<details><summary>Đáp án</summary>

|               | File-Level             | Inline                  |
| ------------- | ---------------------- | ----------------------- |
| **Placement** | Top of file!           | Inside function body!   |
| **Scope**     | ALL exports!           | Single function only!   |
| **Closure**   | ❌ No capture!         | ✅ Captures outer vars! |
| **Import**    | Must export + import!  | No import needed!       |
| **Reusable**  | ✅ Any component!      | ⚠️ Local to that page!  |
| **Best for**  | Shared actions (CRUD!) | Page-specific actions!  |

**Key difference**: Inline can CAPTURE closure variables (like `params.id`) and encrypt them for the client. File-level actions are pure functions — all data comes via arguments!

</details>

---

**Câu 2**: Khi Client import Server Function, code có gửi xuống browser không?

<details><summary>Đáp án</summary>

```
ABSOLUTELY NOT! ❌

Client receives: REFERENCE (ID) only!
  → { _type: 'SERVER_FUNCTION_REFERENCE', functionId: 'abc' }

Client does NOT receive:
  → Actual function code! ❌
  → Database queries! ❌
  → Import statements! ❌
  → Secret environment variables! ❌

What happens on call:
  ① Client: fetchUsers() → POST /api/__server_action
  ② Network: sends functionId + serialized args
  ③ Server: finds function by ID, executes
  ④ Server: serializes result
  ⑤ Client: receives deserialized data

Security: Server code NEVER in browser! ✅
EVEN IF someone inspects bundle → no server code visible!
```

</details>

---

**Câu 3**: Tại sao Server Functions = public endpoints? Implications?

<details><summary>Đáp án</summary>

```
WHY PUBLIC:
  Every 'use server' function = HTTP endpoint!
  React creates POST route for each function!
  → Anyone who knows the URL can call it!
  → Attacker doesn't need your Client UI!
  → Can use cURL, Postman, scripting to call!

IMPLICATIONS:
  ❌ BAD: No auth check!
     async function deleteUser(id) {
       'use server'
       await db.user.delete({ where: { id } })
       // Anyone can delete any user!!! ❌
     }

  ✅ GOOD: Always check!
     async function deleteUser(id) {
       'use server'
       const session = await getSession()
       if (!session?.user) throw new Error('Unauthorized')
       if (session.user.role !== 'admin')
         throw new Error('Forbidden')
       await db.user.delete({ where: { id } })
     }

SECURITY CHECKLIST:
  ① Authenticate → who is calling?
  ② Authorize → can they do THIS action?
  ③ Validate → is the input safe?
  ④ Sanitize → remove sensitive data from response!
  ⑤ Rate limit → prevent abuse!
```

</details>

---

**Câu 4**: Closure encryption — giải thích?

<details><summary>Đáp án</summary>

```
INLINE SERVER ACTION captures outer scope:

  async function Page({ params }) {
    const postId = params.id  // = '42'

    async function updatePost(formData) {
      'use server'
      // postId = '42' captured from closure!
      await save(postId, formData)
    }

    return <EditPost action={updatePost} />
  }

HOW IT WORKS:
  ① Server renders Page → sees updatePost closure
  ② postId='42' ENCRYPTED with server-only key!
  ③ Encrypted payload sent to client as hidden data
  ④ Client receives:
     { functionId: 'updatePost',
       closurePayload: 'encrypted_base64...' }
  ⑤ Client calls updatePost(formData)
     → POST request with encrypted payload + args
  ⑥ Server receives → decrypts closure → postId='42'
  ⑦ Executes save('42', formData)

SECURITY:
  → Client CANNOT read postId!
  → Client CANNOT modify postId!
  → Encryption key = server-only, rotated per build!
  → BUT: Still validate permissions! Don't rely only on
    closure for authorization!
```

</details>
