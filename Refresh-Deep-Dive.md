# refresh() — Deep Dive!

> **Nguồn**: https://nextjs.org/docs/app/api-reference/functions/refresh
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Trang này KHÔNG có hình/diagram** — chỉ có text + code blocks!
> **import**: `next/cache`

---

## §1. refresh() Là Gì?

```
  refresh() — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT:                                                        │
  │  → Refresh client router từ Server Action! ★                │
  │  → Re-fetch Server Components data! ★                       │
  │  → GIỮ NGUYÊN client-side state (React state, scroll)! ★   │
  │  → import { refresh } from 'next/cache'                     │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Server Action                                        │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  await db.post.create(...)  ← mutate data! ★          │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  refresh()  ← trigger client re-render! ★             │    │
  │  │    │                                                  │    │
  │  │    ▼                                                  │    │
  │  │  Client router re-fetch Server Components! ★          │    │
  │  │  Client state preserved! ★                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIỚI HẠN:                                                    │
  │  → CHỈ trong Server Actions! ★★★                            │
  │  → KHÔNG trong Route Handlers! ★★★                          │
  │  → KHÔNG trong Client Components! ★★★                       │
  │  → Gọi ngoài Server Action → THROW ERROR! ★                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Parameters + Returns + Example!

```
  API:
  ┌──────────────────────────────────────────────────────────────┐
  │  refresh(): void                                              │
  │  → Không có parameters! ★                                    │
  │  → Không return gì! ★                                       │
  └──────────────────────────────────────────────────────────────┘

  EXAMPLE — Server Action:
  ┌──────────────────────────────────────────────────────────────┐
  │  'use server'                                                │
  │  import { refresh } from 'next/cache'                        │
  │                                                              │
  │  export async function createPost(formData: FormData) {       │
  │    const title = formData.get('title')                       │
  │    const content = formData.get('content')                   │
  │    await db.post.create({ data: { title, content } })        │
  │    refresh()  ← UI cập nhật ngay! ★                         │
  │  }                                                           │
  └──────────────────────────────────────────────────────────────┘

  ERROR — Route Handler (KHÔNG WORK!):
  ┌──────────────────────────────────────────────────────────────┐
  │  import { refresh } from 'next/cache'                        │
  │  export async function POST() {                               │
  │    refresh()  ← THROW ERROR! ★★★                            │
  │  }                                                           │
  └──────────────────────────────────────────────────────────────┘

  refresh() vs revalidatePath():
  ┌──────────────────────────────────────────────────────────────┐
  │  ┌────────────────┬──────────────────┬──────────────────┐    │
  │  │                 │ refresh()        │ revalidatePath()  │    │
  │  ├────────────────┼──────────────────┼──────────────────┤    │
  │  │ Scope           │ Current page! ★  │ Specific path! ★ │    │
  │  │ Client state    │ PRESERVED! ★     │ May reset! ★     │    │
  │  │ Where           │ Server Action    │ Server Action +   │    │
  │  │                 │ ONLY! ★★★        │ Route Handler! ★ │    │
  │  │ Mechanism       │ Client re-fetch! │ Invalidate cache!│    │
  │  └────────────────┴──────────────────┴──────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — RefreshEngine!

```javascript
var RefreshEngine = (function () {
  function refresh(context) {
    if (context !== "server-action") {
      return {
        error: "refresh() can only be called from within Server Actions! ★★★",
        valid: false,
      };
    }
    return {
      action: "REFRESH_CLIENT_ROUTER",
      preserveState: true,
      refetchServerComponents: true,
      valid: true,
    };
  }

  function compare() {
    return {
      refresh: {
        scope: "current page",
        state: "preserved",
        where: "Server Action ONLY",
      },
      revalidatePath: {
        scope: "specific path",
        state: "may reset",
        where: "Server Action + Route Handler",
      },
      revalidateTag: {
        scope: "all pages with tag",
        state: "may reset",
        where: "Server Action + Route Handler",
      },
      "router.refresh": {
        scope: "current page",
        state: "preserved",
        where: "Client Component (useRouter)",
      },
    };
  }

  function demo() {
    console.log("═══ Refresh Engine ═══");
    console.log(refresh("server-action"));
    console.log(refresh("route-handler"));
    console.log("\n── Compare ──");
    console.log(compare());
  }

  return { demo: demo };
})();
// Chạy: RefreshEngine.demo();
```

---

## §4. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: refresh() vs router.refresh()?                           │
  │  → refresh(): Server Action only! import next/cache! ★      │
  │  → router.refresh(): Client Component! useRouter()! ★       │
  │  → Cả 2 đều preserve client state! ★                       │
  │                                                              │
  │  ❓ 2: refresh() dùng ở đâu được?                               │
  │  → CHỈ Server Actions! ★★★                                   │
  │  → NOT Route Handlers! NOT Client Components! ★              │
  │  → Gọi sai context → throw error! ★                        │
  │                                                              │
  │  ❓ 3: refresh() vs revalidatePath()?                            │
  │  → refresh: current page + preserve state! ★                 │
  │  → revalidatePath: specific path + invalidate cache! ★      │
  │  → Dùng kết hợp cả 2 khi cần! ★                            │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
