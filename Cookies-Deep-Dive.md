# cookies() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/cookies
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **Since**: v13.0.0 (sync) → v15.0.0-RC (async!)

---

## §1. cookies() Là Gì?

```
  cookies() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Async function đọc/ghi HTTP cookies! ★                    │
  │  → Dynamic API → route trở thành DYNAMIC! ★                 │
  │                                                              │
  │  IMPORT:                                                      │
  │  import { cookies } from 'next/headers'                      │
  │                                                              │
  │  READ vs WRITE — QUY TẮC QUAN TRỌNG:                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  READ (get, getAll, has):                              │    │
  │  │  → Server Components ✅                                │    │
  │  │  → Server Functions ✅                                 │    │
  │  │  → Route Handlers ✅                                   │    │
  │  │                                                       │    │
  │  │  WRITE (set, delete):                                  │    │
  │  │  → Server Components ❌ KHÔNG ĐƯỢC! ★★★               │    │
  │  │  → Server Functions ✅                                 │    │
  │  │  → Route Handlers ✅                                   │    │
  │  │                                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO Server Components KHÔNG set được?                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Browser ──→ Request (Cookie header) ──→ Server      │    │
  │  │                                                       │    │
  │  │  Server Component RENDER:                              │    │
  │  │  → Đọc Cookie header ✅ (incoming request!)            │    │
  │  │  → Set-Cookie? ❌ (streaming đã bắt đầu!)             │    │
  │  │  → HTTP KHÔNG cho set cookie SAU streaming! ★★★       │    │
  │  │                                                       │    │
  │  │  Server Function / Route Handler:                      │    │
  │  │  → Set-Cookie header ✅ (response chưa gửi!)          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Methods — 6 Methods!

```
  6 METHODS:
  ┌──────────────────┬──────────────────────────────────────────┐
  │ Method           │ Mô tả                                   │
  ├──────────────────┼──────────────────────────────────────────┤
  │ .get('name')     │ Lấy 1 cookie theo tên! ★                │
  │                  │ Return: { name, value } | undefined      │
  │ .getAll()        │ Lấy TẤT CẢ cookies! ★                   │
  │                  │ Return: Array<{ name, value }>           │
  │ .has('name')     │ Cookie TỒN TẠI? true/false! ★           │
  │ .set(n, v, opts) │ Tạo/update cookie! ★                    │
  │                  │ Chỉ Server Function / Route Handler!     │
  │ .delete('name')  │ Xóa cookie! ★                           │
  │                  │ Chỉ Server Function / Route Handler!     │
  │ .toString()      │ Cookie string representation! ★          │
  └──────────────────┴──────────────────────────────────────────┘

  OPTIONS KHI SET:
  ┌──────────────────┬──────────────────────────────────────────┐
  │ Option           │ Mô tả                                   │
  ├──────────────────┼──────────────────────────────────────────┤
  │ name             │ Tên cookie! ★                            │
  │ value            │ Giá trị cookie! ★                        │
  │ expires          │ Hết hạn tuyệt đối (Date!) ★             │
  │ maxAge           │ Hết hạn tương đối (giây!) ★             │
  │ domain           │ Domain áp dụng! ★                        │
  │ path             │ Path áp dụng! Default: '/' ★             │
  │ secure           │ Chỉ HTTPS! ★                             │
  │ httpOnly         │ JS không đọc được! ★                     │
  │ sameSite         │ 'lax' | 'strict' | 'none' ★             │
  │ priority         │ 'low' | 'medium' | 'high' ★             │
  │ partitioned      │ CHIPS (Privacy Sandbox!) ★               │
  └──────────────────┴──────────────────────────────────────────┘

  → path '/' là OPTION DUY NHẤT có default value! ★
```

---

## §3. "Good to Know" + Cookie Behavior!

```
  "GOOD TO KNOW":
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① cookies() là ASYNC! (v15+) ★                               │
  │  → const cookieStore = await cookies()                       │
  │  → v14: sync → v15: async (breaking change!) ★              │
  │  → v15 backward compat: sync vẫn hoạt động (deprecated!)   │
  │                                                              │
  │  ② Dynamic API! ★                                             │
  │  → Route opt-in DYNAMIC rendering! ★                         │
  │  → Không prerender tại build time! ★                        │
  │                                                              │
  │  ③ .delete() rules! ★                                         │
  │  → Chỉ trong Server Function / Route Handler! ★             │
  │  → CÙNG domain với .set()! ★                                 │
  │  → Wildcard domain → exact subdomain match! ★                │
  │  → CÙNG protocol (HTTP/HTTPS)! ★                             │
  │                                                              │
  │  ④ .set() → TRƯỚC streaming! ★★★                              │
  │  → HTTP không cho set cookie sau streaming starts! ★         │
  │  → Phải dùng trong Server Function / Route Handler! ★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  SERVER COMPONENTS — COOKIE BEHAVIOR:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Cookie = CLIENT-SIDE storage! ★                              │
  │  Server CHỈ gửi Set-Cookie header → Browser LƯU! ★          │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Browser → Request (Cookie: theme=dark) → Server      │    │
  │  │                                                       │    │
  │  │ Server Component:                                      │    │
  │  │ → cookies().get('theme') ✅ Đọc từ request header!    │    │
  │  │ → cookies().set('x','y') ❌ KHÔNG set được!           │    │
  │  │                                                       │    │
  │  │ Server ← Response (Set-Cookie: x=y) ← Server Func.   │    │
  │  │                                                       │    │
  │  │ Browser → Lưu cookie x=y! ✅                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

  SERVER FUNCTIONS — COOKIE BEHAVIOR:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Set/delete cookie trong Server Function:                     │
  │  → Next.js return UI + data trong 1 roundtrip! ★             │
  │  → UI KHÔNG unmount! ★                                       │
  │  → Effects re-run nếu depend on server data! ★              │
  │  → Muốn refresh cached data?                                │
  │    → Gọi revalidatePath() hoặc revalidateTag()! ★           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Examples — 5 Patterns!

```
  5 PATTERNS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① GET A COOKIE:                                              │
  │  const cookieStore = await cookies()                         │
  │  const theme = cookieStore.get('theme')                      │
  │  // → { name: 'theme', value: 'dark' } | undefined          │
  │                                                              │
  │  ② GET ALL COOKIES:                                           │
  │  const cookieStore = await cookies()                         │
  │  cookieStore.getAll().map(c => ({ name: c.name, val: c.val }))│
  │                                                              │
  │  ③ SET A COOKIE (3 cách!):                                    │
  │  // Server Function only!                                     │
  │  'use server'                                                 │
  │  cookieStore.set('name', 'lee')                              │
  │  cookieStore.set('name', 'lee', { secure: true })            │
  │  cookieStore.set({ name: 'name', value: 'lee',              │
  │    httpOnly: true, path: '/' })                              │
  │                                                              │
  │  ④ CHECK EXISTS:                                              │
  │  const hasCookie = cookieStore.has('theme')  // boolean!     │
  │                                                              │
  │  ⑤ DELETE (3 cách!):                                          │
  │  // Cách 1: delete()                                          │
  │  cookieStore.delete('name')                                  │
  │  // Cách 2: set empty value                                   │
  │  cookieStore.set('name', '')                                 │
  │  // Cách 3: maxAge: 0 → expire ngay!                         │
  │  cookieStore.set('name', 'value', { maxAge: 0 })             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết — CookiesEngine!

```javascript
var CookiesEngine = (function () {
  // ═══════════════════════════════════
  // 1. COOKIE STORE SIMULATOR
  // ═══════════════════════════════════
  var store = {};

  function get(name) {
    if (!store[name]) return undefined;
    var c = store[name];
    // Check expiry
    if (c.expires && new Date(c.expires) < new Date()) {
      delete store[name];
      return undefined;
    }
    if (c.maxAge !== undefined && c.maxAge <= 0) {
      delete store[name];
      return undefined;
    }
    return { name: name, value: c.value };
  }

  function getAll() {
    var result = [];
    for (var name in store) {
      if (store.hasOwnProperty(name)) {
        var c = get(name);
        if (c) result.push(c);
      }
    }
    return result;
  }

  function has(name) {
    return get(name) !== undefined;
  }

  function set(nameOrObj, value, options) {
    var name, opts;
    if (typeof nameOrObj === "object") {
      name = nameOrObj.name;
      value = nameOrObj.value;
      opts = nameOrObj;
    } else {
      name = nameOrObj;
      opts = options || {};
    }

    store[name] = {
      value: value,
      path: opts.path || "/",
      secure: opts.secure || false,
      httpOnly: opts.httpOnly || false,
      sameSite: opts.sameSite || "lax",
      maxAge: opts.maxAge,
      expires: opts.expires,
      domain: opts.domain,
      priority: opts.priority,
      partitioned: opts.partitioned || false,
    };

    return { name: name, value: value, options: store[name] };
  }

  function deleteCookie(name) {
    if (store[name]) {
      delete store[name];
      return { deleted: true, name: name };
    }
    return { deleted: false, name: name, reason: "Not found!" };
  }

  function toString() {
    var parts = [];
    for (var name in store) {
      if (store.hasOwnProperty(name) && get(name)) {
        parts.push(name + "=" + store[name].value);
      }
    }
    return parts.join("; ");
  }

  // ═══════════════════════════════════
  // 2. CONTEXT CHECKER
  // ═══════════════════════════════════
  function canPerform(context, method) {
    var readMethods = ["get", "getAll", "has", "toString"];
    var writeMethods = ["set", "delete"];
    var isRead = readMethods.indexOf(method) !== -1;
    var isWrite = writeMethods.indexOf(method) !== -1;

    var rules = {
      "Server Component": { read: true, write: false },
      "Server Function": { read: true, write: true },
      "Route Handler": { read: true, write: true },
      "Client Component": { read: false, write: false },
    };

    var rule = rules[context];
    if (!rule) return { allowed: false, reason: "Unknown context!" };

    var allowed = isRead ? rule.read : isWrite ? rule.write : false;
    return {
      context: context,
      method: method,
      allowed: allowed,
      reason: allowed
        ? context + " cho phép ." + method + "()! ✅"
        : context +
          " KHÔNG cho phép ." +
          method +
          "()! ❌ Dùng Server Function hoặc Route Handler! ★",
    };
  }

  // ═══════════════════════════════════
  // 3. SET-COOKIE HEADER GENERATOR
  // ═══════════════════════════════════
  function generateSetCookieHeader(name, value, opts) {
    opts = opts || {};
    var header = name + "=" + encodeURIComponent(value);
    if (opts.path) header += "; Path=" + opts.path;
    if (opts.domain) header += "; Domain=" + opts.domain;
    if (opts.maxAge !== undefined) header += "; Max-Age=" + opts.maxAge;
    if (opts.expires)
      header += "; Expires=" + new Date(opts.expires).toUTCString();
    if (opts.secure) header += "; Secure";
    if (opts.httpOnly) header += "; HttpOnly";
    if (opts.sameSite) header += "; SameSite=" + opts.sameSite;
    if (opts.priority) header += "; Priority=" + opts.priority;
    if (opts.partitioned) header += "; Partitioned";
    return header;
  }

  // ═══════════════════════════════════
  // 4. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("═══ Cookies Engine ═══");

    console.log("\n── Set ──");
    console.log(set("theme", "dark", { httpOnly: true, secure: true }));
    console.log(set("session", "abc123", { maxAge: 86400 }));
    console.log(
      set({ name: "lang", value: "vi", path: "/", sameSite: "strict" }),
    );

    console.log("\n── Get ──");
    console.log("theme:", get("theme"));
    console.log("all:", getAll());
    console.log("has session:", has("session"));
    console.log("toString:", toString());

    console.log("\n── Delete ──");
    console.log(deleteCookie("theme"));
    console.log("after delete:", getAll());

    console.log("\n── Context Check ──");
    console.log(canPerform("Server Component", "get"));
    console.log(canPerform("Server Component", "set"));
    console.log(canPerform("Server Function", "set"));
    console.log(canPerform("Client Component", "get"));

    console.log("\n── Set-Cookie Header ──");
    console.log(
      generateSetCookieHeader("token", "xyz", {
        path: "/",
        secure: true,
        httpOnly: true,
        sameSite: "strict",
        maxAge: 3600,
      }),
    );
  }

  return { demo: demo };
})();
// Chạy: CookiesEngine.demo();
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: cookies() có mấy methods? Kể tên!                      │
  │  → 6 methods! ★                                              │
  │  → get, getAll, has (READ!) ★                                │
  │  → set, delete (WRITE!) ★                                   │
  │  → toString ★                                               │
  │                                                              │
  │  ❓ 2: Tại sao Server Components KHÔNG set cookie được?        │
  │  → Cookie = Set-Cookie response header! ★                    │
  │  → Server Component render → streaming ĐÃ bắt đầu! ★       │
  │  → HTTP KHÔNG cho set header SAU streaming! ★★★              │
  │  → Phải dùng Server Function / Route Handler! ★             │
  │                                                              │
  │  ❓ 3: 3 cách xóa cookie?                                      │
  │  → cookieStore.delete('name') ★                              │
  │  → cookieStore.set('name', '') ← empty value! ★             │
  │  → cookieStore.set('name', 'v', { maxAge: 0 }) ★            │
  │                                                              │
  │  ❓ 4: cookies() v14 vs v15 — khác gì?                        │
  │  → v14: SYNC → const c = cookies() ★                        │
  │  → v15: ASYNC → const c = await cookies() ★                 │
  │  → v15 backward compat: sync deprecated! ★                  │
  │                                                              │
  │  ❓ 5: cookies() là Dynamic API — nghĩa là gì?                │
  │  → Route trở thành DYNAMIC rendering! ★                     │
  │  → KHÔNG prerender tại build time! ★                        │
  │  → Giống headers(), searchParams! ★                         │
  │  → Giá trị KHÔNG biết trước (per-request!) ★                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
