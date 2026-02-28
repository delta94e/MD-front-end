# Next.js Draft Mode — Deep Dive!

> **Chủ đề**: Draft Mode — Preview nội dung nháp từ Headless CMS!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/draft-mode
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams là TỰ VẼ!

---

## Mục Lục

1. [§1. Draft Mode Là Gì? — Tổng Quan](#1)
2. [§2. Bước 1 — Tạo Route Handler](#2)
3. [§3. Bước 2 — Kết Nối Headless CMS](#3)
4. [§4. Bước 3 — Preview Draft Content](#4)
5. [§5. Cookie \_\_prerender_bypass Chi Tiết](#5)
6. [§6. Security — Chống Open Redirect](#6)
7. [§7. Tự Viết — DraftModeEngine](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Draft Mode Là Gì? — Tổng Quan!

```
  DRAFT MODE — VẤN ĐỀ VÀ GIẢI PHÁP:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VẤN ĐỀ: Static Pages + Headless CMS                      │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  Build time:                                         │  │
  │  │  ┌──────────┐      ┌────────────┐    ┌──────────┐   │  │
  │  │  │ Next.js  │─fetch→│ CMS API    │──→│ Static   │   │  │
  │  │  │ Build    │      │(published) │    │ HTML     │   │  │
  │  │  └──────────┘      └────────────┘    └──────────┘   │  │
  │  │                                                      │  │
  │  │  Content editor viết bài MỚI...                      │  │
  │  │  Muốn XEM TRƯỚC (preview) draft...                   │  │
  │  │  Nhưng page ĐÃ STATIC → hiển thị NỘI DUNG CŨ!     │  │
  │  │  Phải REBUILD toàn bộ site? → CHẬM! KHÔNG THỰC TẾ! │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  GIẢI PHÁP: Draft Mode!                                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  ① Editor click "Preview" trên CMS                   │  │
  │  │  ② CMS gọi Route Handler: /api/draft?secret=...      │  │
  │  │  ③ Route Handler SET COOKIE → enable Draft Mode!     │  │
  │  │  ④ Redirect đến page cần preview                     │  │
  │  │  ⑤ Page detect cookie → SWITCH sang Dynamic!        │  │
  │  │  ⑥ Fetch DRAFT data thay vì published data!         │  │
  │  │  ⑦ Editor thấy nội dung nháp → KHÔNG cần rebuild!  │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  SO SÁNH:                                                  │
  │  ┌──────────────┬─────────────────┬─────────────────────┐  │
  │  │              │ KHÔNG Draft Mode│ CÓ Draft Mode       │  │
  │  ├──────────────┼─────────────────┼─────────────────────┤  │
  │  │ Rendering    │ Static (build)  │ Dynamic (request)   │  │
  │  │ Data         │ Published only  │ Draft content!      │  │
  │  │ Preview      │ ❌ Phải rebuild │ ✅ Instant!         │  │
  │  │ Cookie       │ Không có        │ __prerender_bypass  │  │
  │  │ Performance  │ Nhanh (cached)  │ Chậm hơn (SSR)     │  │
  │  │ Ai dùng?    │ Visitors        │ Content editors     │  │
  │  └──────────────┴─────────────────┴─────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  TOÀN BỘ FLOW:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Headless CMS (Contentful, Sanity, Strapi...)              │
  │    │                                                       │
  │    │ Editor click "Preview Draft"                          │
  │    ▼                                                       │
  │  GET /api/draft?secret=TOKEN&slug=/posts/hello             │
  │    │                                                       │
  │    ▼                                                       │
  │  Route Handler (app/api/draft/route.ts)                    │
  │    ├── ① Verify secret token                               │
  │    ├── ② Check slug exists in CMS                          │
  │    ├── ③ draftMode().enable() → SET COOKIE!               │
  │    └── ④ redirect(post.slug) → /posts/hello               │
  │    │                                                       │
  │    ▼                                                       │
  │  Page /posts/hello (with cookie!)                          │
  │    ├── draftMode().isEnabled → true!                       │
  │    ├── fetch('https://draft.api.com') ← DRAFT data!      │
  │    └── Render draft content! ✅                            │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Bước 1 — Tạo Route Handler!

**Code đơn giản nhất:**

```typescript
// app/api/draft/route.ts
import { draftMode } from "next/headers";

export async function GET(request: Request) {
  const draft = await draftMode();
  draft.enable();
  return new Response("Draft mode is enabled");
}
```

```
  PHÂN TÍCH:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ draftMode() — từ 'next/headers'                         │
  │   → Trả về object với 3 methods:                       │
  │   ┌────────────────────────────────────────────────┐     │
  │   │ .enable()     → BẬT draft mode (set cookie!)  │     │
  │   │ .disable()    → TẮT draft mode (xóa cookie!)  │     │
  │   │ .isEnabled    → Boolean: đang bật?             │     │
  │   └────────────────────────────────────────────────┘     │
  │                                                          │
  │ draft.enable() làm gì?                                   │
  │   → Set cookie: __prerender_bypass                       │
  │   → Cookie chứa encrypted token!                        │
  │   → Browser gửi cookie MỌI request sau đó!             │
  │   → Next.js detect cookie → SWITCH sang dynamic!       │
  │                                                          │
  │ Test thủ công:                                           │
  │   → Truy cập /api/draft                                 │
  │   → DevTools → Network → Response Headers               │
  │   → Thấy: Set-Cookie: __prerender_bypass=...            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Bước 2 — Kết Nối Headless CMS!

**Route Handler đầy đủ (có security!):**

```typescript
// app/api/draft/route.ts
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  // ① Parse query params
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug");

  // ② Verify secret token!
  if (secret !== "MY_SECRET_TOKEN" || !slug) {
    return new Response("Invalid token", { status: 401 });
  }

  // ③ Check slug exists trong CMS!
  const post = await getPostBySlug(slug);
  if (!post) {
    return new Response("Invalid slug", { status: 401 });
  }

  // ④ Enable draft mode!
  const draft = await draftMode();
  draft.enable();

  // ⑤ Redirect đến page (dùng post.slug, KHÔNG dùng searchParams!)
  redirect(post.slug);
}
```

```
  SECURITY FLOW:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  CMS Draft URL (cấu hình trong CMS):                      │
  │  https://mysite.com/api/draft?secret=TOKEN&slug=/posts/one │
  │                                                            │
  │  Route Handler xử lý:                                     │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  secret === 'MY_SECRET_TOKEN'?                        │  │
  │  │    ├── ❌ NO  → 401 Invalid token!                   │  │
  │  │    └── ✅ YES                                        │  │
  │  │         │                                            │  │
  │  │         ▼                                            │  │
  │  │  slug exists?                                        │  │
  │  │    ├── ❌ NO  → 401 slug missing!                    │  │
  │  │    └── ✅ YES                                        │  │
  │  │         │                                            │  │
  │  │         ▼                                            │  │
  │  │  getPostBySlug(slug) — post exists in CMS?           │  │
  │  │    ├── ❌ NO  → 401 Invalid slug!                    │  │
  │  │    └── ✅ YES                                        │  │
  │  │         │                                            │  │
  │  │         ▼                                            │  │
  │  │  draftMode().enable() → SET COOKIE!                  │  │
  │  │         │                                            │  │
  │  │         ▼                                            │  │
  │  │  redirect(post.slug) → /posts/one                    │  │
  │  │  (KHÔNG dùng searchParams.slug → chống redirect!)   │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CMS CẤU HÌNH DYNAMIC URL:                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  Draft URL template:                                 │  │
  │  │  https://mysite.com/api/draft                         │  │
  │  │    ?secret=MY_SECRET_TOKEN                            │  │
  │  │    &slug=/posts/{entry.fields.slug}                   │  │
  │  │                    ↑                                  │  │
  │  │          CMS tự điền slug cho mỗi bài!              │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Bước 3 — Preview Draft Content!

```typescript
// app/posts/[slug]/page.tsx
import { draftMode } from 'next/headers'

async function getData() {
  const { isEnabled } = await draftMode()

  // Draft mode? → fetch DRAFT API!
  // Normal mode? → fetch PUBLISHED API!
  const url = isEnabled
    ? 'https://draft.example.com'
    : 'https://production.example.com'

  const res = await fetch(url)
  return res.json()
}

export default async function Page() {
  const { title, desc } = await getData()

  return (
    <main>
      <h1>{title}</h1>
      <p>{desc}</p>
    </main>
  )
}
```

```
  RUNTIME BEHAVIOR:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  VISITOR BÌNH THƯỜNG (không có cookie):                    │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  draftMode().isEnabled → false                       │  │
  │  │  → fetch('https://production.example.com')           │  │
  │  │  → Hiển thị nội dung ĐÃ PUBLISH!                   │  │
  │  │  → Static page (nhanh, cached!)                     │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  CONTENT EDITOR (có __prerender_bypass cookie):            │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │  draftMode().isEnabled → true!                       │  │
  │  │  → fetch('https://draft.example.com')                │  │
  │  │  → Hiển thị nội dung NHÁP!                          │  │
  │  │  → Dynamic rendering (SSR mỗi request!)            │  │
  │  │  → Update draft trên CMS → refresh → thấy ngay!   │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §5. Cookie \_\_prerender_bypass Chi Tiết!

```
  __prerender_bypass COOKIE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  HOẠT ĐỘNG:                                                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  draftMode().enable()                                 │  │
  │  │    ↓                                                  │  │
  │  │  Set-Cookie: __prerender_bypass=<encrypted-value>     │  │
  │  │    → HttpOnly (JS không đọc được!)                  │  │
  │  │    → SameSite=Lax                                    │  │
  │  │    → Path=/                                           │  │
  │  │    → Secure (production)                              │  │
  │  │                                                      │  │
  │  │  MỌI request sau → browser gửi cookie!              │  │
  │  │    ↓                                                  │  │
  │  │  Next.js detect cookie                                │  │
  │  │    ↓                                                  │  │
  │  │  BYPASS static generation!                            │  │
  │  │    → Static page → become Dynamic!                   │  │
  │  │    → Data fetched at REQUEST TIME!                   │  │
  │  │                                                      │  │
  │  │  draftMode().disable()                                │  │
  │  │    ↓                                                  │  │
  │  │  XÓA cookie → trở lại Static!                       │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  TẠI SAO ENCRYPTED?                                        │
  │  → Giá trị cookie = encrypted token!                     │
  │  → KHÔNG THỂ giả mạo!                                    │
  │  → Chỉ Next.js instance tạo ra mới decrypt được!        │
  │  → Mỗi build = key khác → cũ invalid!                   │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §6. Security — Chống Open Redirect!

```
  OPEN REDIRECT VULNERABILITY:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ ❌ BAD — redirect trực tiếp từ searchParams:            │
  │ ┌────────────────────────────────────────────────────┐   │
  │ │  const slug = searchParams.get('slug')              │   │
  │ │  redirect(slug)                                     │   │
  │ │                                                     │   │
  │ │  Attacker gửi:                                     │   │
  │ │  /api/draft?secret=TOKEN&slug=https://evil.com      │   │
  │ │  → redirect('https://evil.com') → NGUY HIỂM!     │   │
  │ └────────────────────────────────────────────────────┘   │
  │                                                          │
  │ ✅ GOOD — redirect dùng data từ CMS:                    │
  │ ┌────────────────────────────────────────────────────┐   │
  │ │  const post = await getPostBySlug(slug)            │   │
  │ │  redirect(post.slug)  // ← TỪ CMS DATA!          │   │
  │ │                                                     │   │
  │ │  → post.slug lấy từ DATABASE → an toàn!          │   │
  │ │  → Attacker KHÔNG kiểm soát redirect destination! │   │
  │ │  → Nếu slug không tồn tại → 401!                  │   │
  │ └────────────────────────────────────────────────────┘   │
  │                                                          │
  │ SECRET TOKEN:                                            │
  │ ┌────────────────────────────────────────────────────┐   │
  │ │  → Sinh bằng token generator!                     │   │
  │ │  → Lưu trong env var: process.env.DRAFT_SECRET    │   │
  │ │  → Cấu hình CÙNG giá trị trên CMS!              │   │
  │ │  → KHÔNG hardcode trong code!                     │   │
  │ └────────────────────────────────────────────────────┘   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — DraftModeEngine!

```javascript
var DraftModeEngine = (function () {
  // ═══════════════════════════════════
  // 1. COOKIE STORE (simulated)
  // ═══════════════════════════════════
  var cookies = {};

  function setCookie(name, value) {
    cookies[name] = value;
    console.log("  🍪 Set-Cookie: " + name + "=" + value.slice(0, 20) + "...");
  }

  function getCookie(name) {
    return cookies[name] || null;
  }

  function deleteCookie(name) {
    delete cookies[name];
    console.log("  🍪 Deleted cookie: " + name);
  }

  // ═══════════════════════════════════
  // 2. DRAFT MODE CORE
  // ═══════════════════════════════════
  var COOKIE_NAME = "__prerender_bypass";
  var BUILD_KEY = Math.random().toString(36).slice(2, 10);

  function encrypt(value) {
    return btoa(BUILD_KEY + ":" + value);
  }

  function decrypt(token) {
    try {
      var decoded = atob(token);
      var parts = decoded.split(":");
      if (parts[0] !== BUILD_KEY) return null;
      return parts.slice(1).join(":");
    } catch (e) {
      return null;
    }
  }

  function draftMode() {
    return {
      enable: function () {
        var token = encrypt("draft-enabled");
        setCookie(COOKIE_NAME, token);
        console.log("  ✅ Draft mode ENABLED");
      },
      disable: function () {
        deleteCookie(COOKIE_NAME);
        console.log("  ❌ Draft mode DISABLED");
      },
      get isEnabled() {
        var token = getCookie(COOKIE_NAME);
        if (!token) return false;
        var val = decrypt(token);
        return val === "draft-enabled";
      },
    };
  }

  // ═══════════════════════════════════
  // 3. CMS SIMULATION
  // ═══════════════════════════════════
  var cmsData = {
    published: {
      "/posts/hello": { title: "Hello World", desc: "Published content" },
    },
    draft: {
      "/posts/hello": { title: "Hello World v2", desc: "DRAFT: Updated!" },
    },
  };

  function getPostBySlug(slug) {
    return cmsData.published[slug] || cmsData.draft[slug] || null;
  }

  function fetchData(slug) {
    var dm = draftMode();
    var source = dm.isEnabled ? "draft" : "published";
    var data = cmsData[source][slug];
    console.log("  📡 Fetching from: " + source);
    console.log("  📄 Data: " + JSON.stringify(data));
    return data;
  }

  // ═══════════════════════════════════
  // 4. ROUTE HANDLER SIMULATION
  // ═══════════════════════════════════
  function handleDraftRequest(url) {
    var params = new URLSearchParams(url.split("?")[1] || "");
    var secret = params.get("secret");
    var slug = params.get("slug");

    console.log("  🔑 Secret: " + secret);
    console.log("  📎 Slug: " + slug);

    // Verify secret
    if (secret !== "MY_SECRET" || !slug) {
      console.log("  ❌ 401: Invalid token!");
      return null;
    }

    // Check slug exists
    var post = getPostBySlug(slug);
    if (!post) {
      console.log("  ❌ 401: Invalid slug!");
      return null;
    }

    // Enable draft mode!
    draftMode().enable();

    // Redirect (using CMS data, NOT searchParams!)
    console.log("  ↪️ Redirect → " + slug);
    return slug;
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  DRAFT MODE ENGINE DEMO             ║");
    console.log("╚════════════════════════════════════╝");

    // Scenario 1: Normal visitor
    console.log("\n── Scenario 1: Normal Visitor ──");
    console.log("  Draft mode enabled? " + draftMode().isEnabled);
    fetchData("/posts/hello");

    // Scenario 2: CMS editor clicks "Preview"
    console.log("\n── Scenario 2: CMS Preview Click ──");
    var redirectTo = handleDraftRequest(
      "/api/draft?secret=MY_SECRET&slug=/posts/hello",
    );

    // Scenario 3: Page renders with draft cookie
    console.log("\n── Scenario 3: Page Render (draft) ──");
    console.log("  Draft mode enabled? " + draftMode().isEnabled);
    fetchData("/posts/hello");

    // Scenario 4: Disable draft mode
    console.log("\n── Scenario 4: Disable Draft Mode ──");
    draftMode().disable();
    console.log("  Draft mode enabled? " + draftMode().isEnabled);
    fetchData("/posts/hello");

    // Scenario 5: Invalid secret
    console.log("\n── Scenario 5: Invalid Secret ──");
    handleDraftRequest("/api/draft?secret=WRONG&slug=/posts/hello");
  }

  return { demo: demo };
})();
// Chạy: DraftModeEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: Draft Mode giải quyết vấn đề gì?

<details><summary>Đáp án</summary>

**Vấn đề**: Static pages được generate tại build time → lấy nội dung **đã publish** từ CMS. Khi content editor viết bài mới (draft), họ muốn xem trước (preview) nhưng page đã static → hiển thị nội dung cũ → phải rebuild toàn bộ site → chậm, không thực tế.

**Giải pháp**: Draft Mode cho phép **chuyển đổi** từ Static → Dynamic rendering **cho từng user** thông qua cookie. Content editor có cookie → page render dynamically → fetch draft content. Visitors bình thường → không cookie → vẫn static, nhanh.

3 bước: Route Handler enable cookie → CMS gọi Route Handler → Page check `draftMode().isEnabled`.

</details>

---

**Câu 2**: Tại sao redirect dùng post.slug thay vì searchParams.slug?

<details><summary>Đáp án</summary>

**Chống Open Redirect vulnerability!**

Nếu dùng `redirect(searchParams.get('slug'))`:

- Attacker gửi: `/api/draft?secret=TOKEN&slug=https://evil.com`
- Server redirect đến `https://evil.com` → user bị dẫn đến site lừa đảo!

Nếu dùng `redirect(post.slug)`:

- `post` lấy từ CMS database → attacker **KHÔNG kiểm soát** giá trị
- Slug chỉ là path nội bộ (`/posts/hello`) → không redirect ra ngoài
- Nếu slug giả → `getPostBySlug()` return null → 401!

</details>

---

**Câu 3**: Cookie \_\_prerender_bypass hoạt động thế nào?

<details><summary>Đáp án</summary>

Khi `draftMode().enable()`:

- Set cookie `__prerender_bypass` với **encrypted value** (không giả mạo được)
- Cookie flags: HttpOnly, SameSite=Lax, Path=/, Secure (prod)
- Browser gửi cookie **mọi request** tiếp theo

Next.js detect cookie:

- **Có cookie** → bypass static cache → render **dynamically** (SSR) → fetch data tại request time
- **Không cookie** → serve static HTML như bình thường

Khi `draftMode().disable()`:

- Xóa cookie → page trở lại static

Encrypted vì: Mỗi build tạo key mới → cookie cũ invalid → session draft mode auto-expire khi deploy mới.

</details>

---

**Câu 4**: Draft Mode khác ISR (Incremental Static Regeneration) thế nào?

<details><summary>Đáp án</summary>

|                 | Draft Mode                  | ISR                                       |
| --------------- | --------------------------- | ----------------------------------------- |
| **Mục đích**    | Preview DRAFT cho editors   | Revalidate PUBLISHED cho tất cả           |
| **Ai dùng?**    | Content editors (có cookie) | Tất cả visitors                           |
| **Data source** | Draft API (unpublished)     | Published API                             |
| **Rendering**   | Dynamic (SSR per request)   | Static + revalidate (time/on-demand)      |
| **Trigger**     | Cookie `__prerender_bypass` | `revalidate` time hoặc `revalidatePath()` |
| **Scope**       | Per-user (chỉ ai có cookie) | Global (tất cả users thấy cùng data)      |

**Draft Mode** = individual preview cho editors. **ISR** = update content cho tất cả users.

</details>
