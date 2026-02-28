# Next.js Updating Data — Deep Dive!

> **Chủ đề**: Updating Data — Server Functions & Server Actions!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/getting-started/updating-data

---

## Mục Lục

1. [§1. Tổng Quan — Server Functions là gì?](#1)
2. [§2. Tạo Server Functions — `use server` Directive](#2)
3. [§3. Server Components — Inline Actions](#3)
4. [§4. Client Components — Import Actions](#4)
5. [§5. Passing Actions As Props](#5)
6. [§6. Gọi Server Functions — Forms](#6)
7. [§7. Gọi Server Functions — Event Handlers](#7)
8. [§8. Pending State — useActionState & useFormStatus](#8)
9. [§9. Refreshing — refresh()](#9)
10. [§10. Revalidating — revalidatePath & revalidateTag](#10)
11. [§11. Redirecting — redirect()](#11)
12. [§12. Cookies — get/set/delete](#12)
13. [§13. useEffect — Auto-trigger Mutations](#13)
14. [§14. Sơ Đồ Tổng Hợp — Data Flow](#14)
15. [§15. Tự Viết — Server Action Engine](#15)
16. [§16. Tổng Kết & Câu Hỏi Luyện Tập](#16)

---

## §1. Tổng Quan — Server Functions là gì?

```
  SERVER FUNCTIONS — TỔNG QUAN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Server Function = async function chạy trên SERVER    │
  │  → Client gọi qua NETWORK REQUEST                    │
  │  → Phải là ASYNC (vì cross-network)                   │
  │                                                        │
  │  PHÂN BIỆT:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Server Function = thuật ngữ RỘNG               │  │
  │  │  → Bất kỳ async function nào chạy trên server  │  │
  │  │                                                  │  │
  │  │  Server Action = thuật ngữ HẸP hơn              │  │
  │  │  → Server Function dùng cho MUTATIONS           │  │
  │  │  → Xử lý form submissions, data updates        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  KHI NÀO GỌI LÀ "SERVER ACTION"?                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Khi function được dùng với startTransition:     │  │
  │  │  ① Truyền vào <form action={fn}>               │  │
  │  │  ② Truyền vào <button formAction={fn}>         │  │
  │  │  → React TỰ ĐỘNG wrap trong startTransition!   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  BEHIND THE SCENES:                                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Client          →    Server                     │  │
  │  │  <form>          →    POST request               │  │
  │  │  action={fn}     →    fn(formData)               │  │
  │  │                  ←    Updated UI + new data      │  │
  │  │                       (single roundtrip!)        │  │
  │  │                                                  │  │
  │  │  → CHỈ dùng HTTP POST method!                   │  │
  │  │  → Tích hợp caching architecture               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Tạo Server Functions — `use server` Directive!

```
  'use server' DIRECTIVE — 2 CÁCH DÙNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① FUNCTION LEVEL — inline trong function:            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  async function createPost(formData) {           │  │
  │  │    'use server'   ←── ĐẦU function body!        │  │
  │  │    // code chạy trên server                     │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② FILE LEVEL — đầu file:                             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  'use server'   ←── ĐẦU FILE!                   │  │
  │  │                                                  │  │
  │  │  export async function createPost() { ... }      │  │
  │  │  export async function deletePost() { ... }      │  │
  │  │  // TẤT CẢ exports = Server Functions!          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  QUY TẮC:                                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ✅ Function PHẢI là async                       │  │
  │  │  ✅ 'use server' ở ĐẦU function body hoặc file  │  │
  │  │  ❌ KHÔNG được dùng trong Client Component body │  │
  │  │  ✅ Client import từ file có 'use server'       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
// FILE LEVEL — actions.ts
"use server";

export async function createPost(formData: FormData) {
  const title = formData.get("title");
  const content = formData.get("content");
  // Update data
  // Revalidate cache
}

export async function deletePost(formData: FormData) {
  const id = formData.get("id");
  // Update data
  // Revalidate cache
}
```

---

## §3. Server Components — Inline Actions!

```
  INLINE ACTIONS TRONG SERVER COMPONENTS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Server Component → define action TRỰC TIẾP bên trong│
  │                                                        │
  │  export default function Page() {                      │
  │    async function createPost(formData) {               │
  │      'use server'  ←── inline directive!              │
  │      // mutate data trên server                       │
  │    }                                                   │
  │    return <form action={createPost}>...</form>         │
  │  }                                                     │
  │                                                        │
  │  ✅ PROGRESSIVE ENHANCEMENT:                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Form submit NGAY CẢ KHI:                       │  │
  │  │  → JavaScript chưa load xong!                   │  │
  │  │  → JavaScript bị disabled!                      │  │
  │  │  → HTML form submission truyền thống!           │  │
  │  │  → Ưu tiên hydration khi JS sẵn sàng          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
// Server Component — inline action
export default function Page() {
  async function createPost(formData: FormData) {
    'use server'
    const title = formData.get('title')
    // Save to database...
  }

  return (
    <form action={createPost}>
      <input type="text" name="title" />
      <button type="submit">Create</button>
    </form>
  )
}
```

---

## §4. Client Components — Import Actions!

```
  CLIENT COMPONENTS — IMPORT TỪ FILE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ❌ KHÔNG THỂ define 'use server' TRONG Client Comp!  │
  │                                                        │
  │  ✅ IMPORT từ file riêng:                              │
  │                                                        │
  │  ┌── actions.ts ──────────┐                            │
  │  │  'use server'          │                            │
  │  │  export async function │                            │
  │  │    createPost() { ... }│                            │
  │  └────────────┬───────────┘                            │
  │               │ import                                 │
  │               ▼                                        │
  │  ┌── Button.tsx ──────────┐                            │
  │  │  'use client'          │                            │
  │  │  import { createPost } │                            │
  │  │    from '@/app/actions' │                           │
  │  │  <button               │                            │
  │  │    formAction=          │                            │
  │  │    {createPost}>        │                            │
  │  └────────────────────────┘                            │
  │                                                        │
  │  ⚠️ PROGRESSIVE ENHANCEMENT (Client):                 │
  │  → Forms QUEUE submissions nếu JS chưa load          │
  │  → Ưu tiên hydration                                 │
  │  → Sau hydration, browser KHÔNG full page refresh     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
// actions.ts — file riêng
'use server'
export async function createPost() {
  // Server-side mutation
}

// Button.tsx — Client Component
'use client'
import { createPost } from '@/app/actions'

export function Button() {
  return <button formAction={createPost}>Create</button>
}
```

---

## §5. Passing Actions As Props!

```
  TRUYỀN ACTION QUA PROPS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Server Component → Client Component (via prop):      │
  │                                                        │
  │  ┌── ServerPage.tsx ──────────────────────────┐        │
  │  │  import { updateItem } from './actions'    │        │
  │  │  import ClientComp from './ClientComp'     │        │
  │  │                                            │        │
  │  │  <ClientComp                               │        │
  │  │    updateItemAction={updateItem}  ← PROP! │        │
  │  │  />                                        │        │
  │  └────────────────────────────────────────────┘        │
  │               │                                        │
  │               ▼ action as prop                         │
  │  ┌── ClientComp.tsx ──────────────────────────┐        │
  │  │  'use client'                              │        │
  │  │  export default function ClientComponent({ │        │
  │  │    updateItemAction                        │        │
  │  │  }) {                                      │        │
  │  │    return (                                │        │
  │  │      <form action={updateItemAction}>      │        │
  │  │        {/* form fields */}                 │        │
  │  │      </form>                               │        │
  │  │    )                                       │        │
  │  │  }                                         │        │
  │  └────────────────────────────────────────────┘        │
  │                                                        │
  │  ✅ Pattern này cho phép Server Component quyết        │
  │     định WHICH action → Client Component chỉ render  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
// Server Component — truyền action as prop
<ClientComponent updateItemAction={updateItem} />

// Client Component — nhận action
'use client'
export default function ClientComponent({
  updateItemAction,
}: {
  updateItemAction: (formData: FormData) => void
}) {
  return <form action={updateItemAction}>{/* ... */}</form>
}
```

---

## §6. Gọi Server Functions — Forms!

```
  FORMS — CÁCH GỌI TỰ NHIÊN NHẤT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  React MỞ RỘNG HTML <form>:                           │
  │  → action prop nhận Server Function!                  │
  │  → Tự động truyền FormData object                     │
  │                                                        │
  │  FLOW:                                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  User click Submit                               │  │
  │  │       │                                          │  │
  │  │       ▼                                          │  │
  │  │  Browser tạo FormData từ <form>                 │  │
  │  │       │                                          │  │
  │  │       ▼                                          │  │
  │  │  React gọi action(formData) — POST request      │  │
  │  │       │                                          │  │
  │  │       ▼                                          │  │
  │  │  Server nhận FormData → xử lý                   │  │
  │  │       │                                          │  │
  │  │       ▼                                          │  │
  │  │  Response: Updated UI + new data                │  │
  │  │  (single roundtrip!)                            │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  NATIVE FormData methods:                              │
  │  → formData.get('name')   — lấy giá trị              │
  │  → formData.getAll('tags') — multiple values          │
  │  → formData.has('field')  — check tồn tại            │
  │  → formData.entries()     — iterate                   │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
// Form Component
import { createPost } from '@/app/actions'

export function Form() {
  return (
    <form action={createPost}>
      <input type="text" name="title" />
      <input type="text" name="content" />
      <button type="submit">Create</button>
    </form>
  )
}

// Server Action
'use server'
export async function createPost(formData: FormData) {
  const title = formData.get('title')    // ← Native API!
  const content = formData.get('content')
  // Save to DB → revalidate cache
}
```

---

## §7. Gọi Server Functions — Event Handlers!

```
  EVENT HANDLERS — onClick, onChange...:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Dùng KHI KHÔNG CÓ <form>:                            │
  │  → Like buttons, toggle switches, counters            │
  │  → Bất kỳ interaction nào                             │
  │                                                        │
  │  FLOW:                                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  User click button                               │  │
  │  │       │                                          │  │
  │  │       ▼                                          │  │
  │  │  onClick handler → await serverFunction()       │  │
  │  │       │                                          │  │
  │  │       ▼                                          │  │
  │  │  POST request → server processes                │  │
  │  │       │                                          │  │
  │  │       ▼                                          │  │
  │  │  Return value → setState(newValue)              │  │
  │  │       │                                          │  │
  │  │       ▼                                          │  │
  │  │  UI re-renders with new data                    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠️ SERVER FUNCTIONS = ONE AT A TIME (sequential)      │
  │  → Client dispatch + await tuần tự                    │
  │  → Nếu cần parallel: fetch trong Server Component    │
  │    hoặc dùng Route Handler                            │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
'use client'
import { incrementLike } from './actions'
import { useState } from 'react'

export default function LikeButton({
  initialLikes,
}: {
  initialLikes: number
}) {
  const [likes, setLikes] = useState(initialLikes)

  return (
    <>
      <p>Total Likes: {likes}</p>
      <button
        onClick={async () => {
          const updatedLikes = await incrementLike()
          setLikes(updatedLikes)
        }}
      >
        Like
      </button>
    </>
  )
}
```

---

## §8. Pending State — useActionState!

```
  PENDING STATE — UI FEEDBACK:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VẤN ĐỀ: User click → chờ server → không biết       │
  │  đang xảy ra gì!                                      │
  │                                                        │
  │  GIẢI PHÁP — useActionState:                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  const [state, action, pending] =                │  │
  │  │    useActionState(serverAction, initialState)     │  │
  │  │                                                  │  │
  │  │  → state: kết quả trả về từ action              │  │
  │  │  → action: wrapped function để gọi              │  │
  │  │  → pending: boolean — TRUE khi đang xử lý      │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  TIMELINE:                                             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Click          pending=true       pending=false │  │
  │  │    │               │                    │        │  │
  │  │    ▼               ▼                    ▼        │  │
  │  │  [Create]  →  [⏳ Loading...]  →  [Create]      │  │
  │  │               (spinner/disabled)   (done!)       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
'use client'
import { useActionState, startTransition } from 'react'
import { createPost } from '@/app/actions'
import { LoadingSpinner } from '@/app/ui/loading-spinner'

export function Button() {
  const [state, action, pending] = useActionState(createPost, false)

  return (
    <button onClick={() => startTransition(action)}>
      {pending ? <LoadingSpinner /> : 'Create Post'}
    </button>
  )
}
```

---

## §9. Refreshing — refresh()!

```
  refresh() — LÀM MỚI UI:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  SAU KHI MUTATION → cần cập nhật UI!                  │
  │                                                        │
  │  refresh() từ 'next/cache':                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  'use server'                                    │  │
  │  │  import { refresh } from 'next/cache'            │  │
  │  │                                                  │  │
  │  │  export async function updatePost(formData) {    │  │
  │  │    // Update data...                             │  │
  │  │    refresh()  ← ĐÂY!                            │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  refresh() LÀM GÌ?                                    │
  │  → Refresh client router                              │
  │  → UI phản ánh state mới nhất                         │
  │                                                        │
  │  ⚠️ refresh() KHÔNG revalidate tagged data!           │
  │  → Cần revalidate? Dùng updateTag hoặc revalidateTag │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §10. Revalidating — revalidatePath & revalidateTag!

```
  REVALIDATION — CẬP NHẬT CACHE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  SAU MUTATION → cache cũ → cần REVALIDATE!            │
  │                                                        │
  │  ① revalidatePath — theo ĐƯỜNG DẪN:                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  import { revalidatePath } from 'next/cache'     │  │
  │  │                                                  │  │
  │  │  export async function createPost(formData) {    │  │
  │  │    'use server'                                  │  │
  │  │    // Save data...                               │  │
  │  │    revalidatePath('/posts')  ← INVALIDATE!      │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  → Xóa cache cho PATH '/posts'                  │  │
  │  │  → Lần truy cập tiếp → fetch data mới          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② revalidateTag — theo TAG:                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  import { revalidateTag } from 'next/cache'      │  │
  │  │                                                  │  │
  │  │  export async function createPost(formData) {    │  │
  │  │    'use server'                                  │  │
  │  │    // Save data...                               │  │
  │  │    revalidateTag('posts')  ← TAG!               │  │
  │  │  }                                               │  │
  │  │                                                  │  │
  │  │  → Xóa cache cho TẤT CẢ entries có tag 'posts' │  │
  │  │  → Linh hoạt hơn revalidatePath!               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SO SÁNH:                                              │
  │  ┌───────────────────┬─────────────────────────────┐  │
  │  │ revalidatePath    │ revalidateTag               │  │
  │  ├───────────────────┼─────────────────────────────┤  │
  │  │ Theo URL path     │ Theo semantic tag            │  │
  │  │ '/posts'          │ 'posts', 'user-123'         │  │
  │  │ Invalidate 1 path │ Invalidate nhiều entries    │  │
  │  │ Đơn giản          │ Linh hoạt hơn              │  │
  │  └───────────────────┴─────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §11. Redirecting — redirect()!

```
  redirect() — CHUYỂN TRANG SAU MUTATION:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  PATTERN PHỔ BIẾN:                                     │
  │  Create post → revalidate → redirect to /posts        │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  'use server'                                    │  │
  │  │  import { revalidatePath } from 'next/cache'     │  │
  │  │  import { redirect } from 'next/navigation'      │  │
  │  │                                                  │  │
  │  │  export async function createPost(formData) {    │  │
  │  │    // 1. Save data                               │  │
  │  │    await db.insert(...)                          │  │
  │  │                                                  │  │
  │  │    // 2. Revalidate TRƯỚC!                       │  │
  │  │    revalidatePath('/posts')                      │  │
  │  │                                                  │  │
  │  │    // 3. Redirect SAU!                           │  │
  │  │    redirect('/posts')  ← CUỐI CÙNG!            │  │
  │  │    // ⚠️ Code SAU redirect() KHÔNG chạy!       │  │
  │  │  }                                               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠️ QUAN TRỌNG:                                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  redirect() THROWS một exception đặc biệt!     │  │
  │  │  → Framework-handled control-flow exception     │  │
  │  │  → Code sau redirect() KHÔNG BAO GIỜ chạy!     │  │
  │  │  → Gọi revalidatePath/Tag TRƯỚC redirect()!    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  // 1. Update data
  const title = formData.get("title");
  await db.insert(posts).values({ title });

  // 2. Revalidate cache (TRƯỚC redirect!)
  revalidatePath("/posts");

  // 3. Redirect (CUỐI CÙNG — code sau không chạy!)
  redirect("/posts");
}
```

---

## §12. Cookies — get/set/delete!

```
  COOKIES TRONG SERVER ACTIONS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  cookies() API — read/write cookies trên server:      │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  import { cookies } from 'next/headers'          │  │
  │  │                                                  │  │
  │  │  const cookieStore = await cookies()              │  │
  │  │                                                  │  │
  │  │  // GET — đọc cookie                            │  │
  │  │  cookieStore.get('name')?.value                   │  │
  │  │                                                  │  │
  │  │  // SET — tạo/cập nhật cookie                   │  │
  │  │  cookieStore.set('name', 'Delba')                │  │
  │  │                                                  │  │
  │  │  // DELETE — xóa cookie                         │  │
  │  │  cookieStore.delete('name')                       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠️ KHI SET hoặc DELETE cookie:                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Next.js RE-RENDER page + layouts trên server!  │  │
  │  │  → UI phản ánh cookie value mới                 │  │
  │  │  → Client state được PRESERVE!                  │  │
  │  │  → Effects re-run nếu dependencies thay đổi    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
"use server";
import { cookies } from "next/headers";

export async function exampleAction() {
  const cookieStore = await cookies();

  // Get cookie
  const name = cookieStore.get("name")?.value;

  // Set cookie
  cookieStore.set("name", "Delba");

  // Delete cookie
  cookieStore.delete("name");
}
```

---

## §13. useEffect — Auto-trigger Mutations!

```
  useEffect + SERVER FUNCTIONS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  KHI NÀO DÙNG?                                        │
  │  → Component mount (view count, page tracking)        │
  │  → Global events (keyboard shortcuts)                 │
  │  → Intersection observer (infinite scrolling)         │
  │  → Dependency changes (auto-sync)                     │
  │                                                        │
  │  ⚠️ QUAN TRỌNG — wrap trong startTransition:          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  useEffect(() => {                               │  │
  │  │    startTransition(async () => {                  │  │
  │  │      const result = await serverAction()          │  │
  │  │      setState(result)                             │  │
  │  │    })                                             │  │
  │  │  }, [])                                           │  │
  │  │                                                  │  │
  │  │  → startTransition = non-blocking UI update     │  │
  │  │  → isPending = feedback cho user                │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
'use client'
import { incrementViews } from './actions'
import { useState, useEffect, useTransition } from 'react'

export default function ViewCount({
  initialViews,
}: {
  initialViews: number
}) {
  const [views, setViews] = useState(initialViews)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const updatedViews = await incrementViews()
      setViews(updatedViews)
    })
  }, [])

  return <p>Total Views: {isPending ? '...' : views}</p>
}
```

---

## §14. Sơ Đồ Tổng Hợp — Data Update Flow!

> Trang docs này **KHÔNG có hình minh họa** nào. Dưới đây là sơ đồ tự vẽ tổng hợp toàn bộ flow:

```
  UPDATING DATA — COMPLETE FLOW:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─ USER ACTION ─────────────────────────────────────┐ │
  │  │  ① <form action={fn}>  → Submit form             │ │
  │  │  ② onClick={fn}        → Event handler            │ │
  │  │  ③ useEffect           → Auto-trigger             │ │
  │  └──────────────────────┬────────────────────────────┘ │
  │                         │                              │
  │                         ▼ POST request                 │
  │  ┌─ SERVER ─────────────────────────────────────────┐  │
  │  │  'use server'                                     │  │
  │  │                                                   │  │
  │  │  ┌── MUTATION ────────────────────────────────┐   │  │
  │  │  │  formData.get('title')                     │   │  │
  │  │  │  await db.insert(...)                      │   │  │
  │  │  │  await db.update(...)                      │   │  │
  │  │  │  cookieStore.set(...)                      │   │  │
  │  │  └────────────────────────────────────────────┘   │  │
  │  │                                                   │  │
  │  │  ┌── POST-MUTATION ───────────────────────────┐   │  │
  │  │  │  refresh()         → refresh UI            │   │  │
  │  │  │  revalidatePath()  → invalidate path cache │   │  │
  │  │  │  revalidateTag()   → invalidate by tag     │   │  │
  │  │  │  redirect()        → navigate (LAST!)      │   │  │
  │  │  └────────────────────────────────────────────┘   │  │
  │  └──────────────────────┬────────────────────────────┘  │
  │                         │                              │
  │                         ▼ Response                     │
  │  ┌─ CLIENT ─────────────────────────────────────────┐  │
  │  │  Updated UI + new data (single roundtrip!)       │  │
  │  │  → pending = false                               │  │
  │  │  → New page (if redirected)                      │  │
  │  │  → Fresh data (if revalidated)                   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  SERVER FUNCTION DECISION TREE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Ở ĐÂU define Server Function?                        │
  │                                                        │
  │  Server Component?                                     │
  │  ├── YES → inline 'use server' trong function body   │
  │  │                                                     │
  │  Client Component?                                     │
  │  ├── Define TRỰC TIẾP? → ❌ KHÔNG ĐƯỢC!              │
  │  ├── Import từ file 'use server'? → ✅ OK!           │
  │  └── Nhận qua props? → ✅ OK!                        │
  │                                                        │
  │  GỌI Server Function BẰNG GÌ?                         │
  │                                                        │
  │  Có <form>?                                            │
  │  ├── YES → <form action={fn}> (auto FormData)        │
  │  │         <button formAction={fn}>                   │
  │  │                                                     │
  │  Không có form?                                        │
  │  ├── onClick → await serverFunction()                │
  │  ├── useEffect → startTransition(() => fn())         │
  │  └── Any event handler                                │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §15. Tự Viết — Server Action Engine!

> **Mục tiêu**: Mô phỏng Server Functions — KHÔNG dùng thư viện!

```javascript
var ServerActionEngine = (function () {
  // 1. FAKE DATABASE
  var database = {
    posts: [{ id: "1", title: "Hello World", content: "First post" }],
    cookies: {},
    nextId: 2,
  };

  // 2. FAKE FORM DATA
  function createFormData(obj) {
    var data = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        data[key] = obj[key];
      }
    }
    return {
      get: function (name) {
        return data[name] || null;
      },
      has: function (name) {
        return data.hasOwnProperty(name);
      },
      entries: function () {
        var keys = Object.keys(data);
        var i = 0;
        return {
          next: function () {
            if (i < keys.length) {
              var k = keys[i++];
              return { value: [k, data[k]], done: false };
            }
            return { done: true };
          },
        };
      },
    };
  }

  // 3. SERVER ACTION — CREATE POST
  function createPost(formData) {
    console.log("  🔒 [SERVER] createPost()");
    var title = formData.get("title");
    var content = formData.get("content");
    if (!title) {
      console.log("  ❌ Validation failed: title required!");
      return { error: "Title required" };
    }
    var post = {
      id: String(database.nextId++),
      title: title,
      content: content || "",
    };
    database.posts.push(post);
    console.log("  ✅ Created: " + JSON.stringify(post));
    return { success: true, post: post };
  }

  // 4. SERVER ACTION — DELETE POST
  function deletePost(formData) {
    console.log("  🔒 [SERVER] deletePost()");
    var id = formData.get("id");
    var index = -1;
    for (var i = 0; i < database.posts.length; i++) {
      if (database.posts[i].id === id) {
        index = i;
        break;
      }
    }
    if (index === -1) {
      console.log("  ❌ Post not found: " + id);
      return { error: "Not found" };
    }
    var removed = database.posts.splice(index, 1)[0];
    console.log("  ✅ Deleted: " + JSON.stringify(removed));
    return { success: true };
  }

  // 5. REVALIDATION
  var pathCache = {};
  function revalidatePath(path) {
    console.log('  🔄 revalidatePath("' + path + '")');
    delete pathCache[path];
    console.log("     Cache cleared for: " + path);
  }

  // 6. REDIRECT
  function redirect(path) {
    console.log('  ↪️  redirect("' + path + '")');
    console.log("     [THROW] Control-flow exception!");
    console.log("     ⚠️ Code after redirect() NOT executed!");
  }

  // 7. COOKIES
  function cookieActions() {
    console.log("\n━━━ COOKIES DEMO ━━━");
    // Set
    database.cookies["session"] = "abc123";
    console.log("  📝 SET cookie: session = abc123");
    // Get
    var val = database.cookies["session"];
    console.log("  📖 GET cookie: session = " + val);
    // Delete
    delete database.cookies["session"];
    console.log("  🗑️  DELETE cookie: session");
    console.log("  → Next.js re-renders page + layouts!");
  }

  // 8. PENDING STATE SIMULATOR
  function simulatePendingState(actionName) {
    console.log("\n━━━ PENDING STATE ━━━");
    console.log("  ① pending = true → [⏳ Loading...]");
    console.log("  ② await " + actionName + "()  — processing...");
    console.log("  ③ pending = false → [✅ Done!]");
  }

  // 9. FULL DEMO
  function demo() {
    console.log("╔══════════════════════════════════════════╗");
    console.log("║ SERVER ACTION ENGINE — DEMO               ║");
    console.log("╚══════════════════════════════════════════╝");

    // Form submission
    console.log("\n━━━ FORM SUBMISSION ━━━");
    var formData = createFormData({
      title: "New Post",
      content: "This is a new post",
    });
    var result = createPost(formData);
    revalidatePath("/posts");

    // Event handler
    console.log("\n━━━ EVENT HANDLER (onClick) ━━━");
    console.log('  🖱️ User clicks "Like" button');
    console.log("  → await incrementLike()");
    console.log("  → setLikes(newValue)");
    console.log("  → UI re-renders!");

    // Pending state
    simulatePendingState("createPost");

    // Delete + redirect
    console.log("\n━━━ DELETE + REDIRECT ━━━");
    var delFormData = createFormData({ id: "1" });
    deletePost(delFormData);
    revalidatePath("/posts");
    redirect("/posts");

    // Cookies
    cookieActions();

    // Show final DB state
    console.log("\n━━━ DATABASE STATE ━━━");
    console.log("  Posts:", JSON.stringify(database.posts, null, 2));
  }

  return {
    createPost: createPost,
    deletePost: deletePost,
    createFormData: createFormData,
    revalidatePath: revalidatePath,
    redirect: redirect,
    demo: demo,
  };
})();
// Chạy thử: ServerActionEngine.demo();
```

---

## §16. Tổng Kết & Câu Hỏi Luyện Tập!

```
  TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │  ① Server Function = async fn chạy trên server       │
  │  ② Server Action = Server Function cho mutations      │
  │  ③ 'use server' ở function body hoặc đầu file        │
  │  ④ Server Comp: inline actions                        │
  │  ⑤ Client Comp: import hoặc nhận qua props           │
  │  ⑥ Forms: <form action={fn}> + auto FormData         │
  │  ⑦ Events: onClick → await fn()                      │
  │  ⑧ Pending: useActionState → pending boolean         │
  │  ⑨ refresh(): làm mới UI (không revalidate tag)      │
  │  ⑩ revalidatePath/Tag: xóa cache                     │
  │  ⑪ redirect(): chuyển trang (THROWS! — gọi CUỐI)    │
  │  ⑫ Cookies: get/set/delete → re-render page          │
  │  ⑬ useEffect: auto-trigger + startTransition         │
  └────────────────────────────────────────────────────────┘
```

### Câu Hỏi Luyện Tập

**Câu 1**: Server Function vs Server Action — khác nhau thế nào?

<details><summary>Đáp án</summary>

|              | Server Function                                | Server Action                         |
| ------------ | ---------------------------------------------- | ------------------------------------- |
| Scope        | Thuật ngữ RỘNG                                 | Thuật ngữ HẸP                         |
| Dùng cho     | Mọi async operation                            | Form submissions, mutations           |
| Điều kiện    | `'use server'` directive                       | + được dùng với `startTransition`     |
| Auto trigger | Qua `<form action>` hoặc `<button formAction>` | React tự wrap trong `startTransition` |

Server Action = Server Function IN CONTEXT of mutations.

</details>

---

**Câu 2**: Tại sao Client Component KHÔNG THỂ define `'use server'`?

<details><summary>Đáp án</summary>

Client Component code chạy trên CLIENT (browser). `'use server'` đánh dấu code chạy trên SERVER. Nếu define trực tiếp → code bị bundle cho client → lộ server logic + secrets!

**Giải pháp**: Tạo file riêng với `'use server'` ở đầu → Client Component import function từ file đó → Next.js tự tạo API endpoint.

</details>

---

**Câu 3**: Tại sao `redirect()` phải gọi CUỐI CÙNG?

<details><summary>Đáp án</summary>

`redirect()` **THROW** một framework-managed exception → control flow dừng ngay → code phía sau KHÔNG BAO GIỜ chạy!

Pattern đúng:

```
// 1. Mutation
await db.insert(...)
// 2. Revalidate TRƯỚC
revalidatePath('/posts')
// 3. Redirect CUỐI
redirect('/posts')  // ← throw! Dừng ở đây!
```

</details>

---

**Câu 4**: `refresh()` vs `revalidatePath()` vs `revalidateTag()` — khi nào dùng gì?

<details><summary>Đáp án</summary>

|             | `refresh()`         | `revalidatePath()`    | `revalidateTag()`       |
| ----------- | ------------------- | --------------------- | ----------------------- |
| Scope       | Client router       | Specific path cache   | All entries with tag    |
| Tagged data | ❌ Không revalidate | ❌ Không (path-based) | ✅ Theo tag!            |
| Best for    | Quick UI refresh    | Path-specific update  | Cross-path invalidation |
| Import      | `next/cache`        | `next/cache`          | `next/cache`            |

Recommendation: Dùng `revalidateTag` cho linh hoạt nhất, `revalidatePath` cho đơn giản, `refresh` chỉ khi cần quick UI update.

</details>

---

**Câu 5**: Progressive Enhancement hoạt động thế nào với Server Actions?

<details><summary>Đáp án</summary>

**Server Components**: Form submit NGAY CẢ KHI JavaScript chưa load hoặc disabled! HTML form submission native.

**Client Components**: Forms QUEUE submissions nếu JS chưa load → ưu tiên hydration → sau hydration, browser không full page refresh.

Lợi ích: App hoạt động ngay từ đầu, không cần chờ JS bundle download!

</details>

---

**Câu 6**: Viết pattern đúng cho form create + revalidate + redirect.

<details><summary>Đáp án</summary>

```typescript
// actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  // 1. Validate
  if (!title) throw new Error('Title required')
  // 2. Mutate
  await db.insert(posts).values({ title })
  // 3. Revalidate TRƯỚC redirect!
  revalidatePath('/posts')
  // 4. Redirect CUỐI CÙNG!
  redirect('/posts')
}

// Form component
<form action={createPost}>
  <input name="title" />
  <button type="submit">Create</button>
</form>
```

</details>

---

**Câu 7**: Khi nào dùng `useEffect` để trigger Server Function?

<details><summary>Đáp án</summary>

Dùng khi mutation cần trigger **TỰ ĐỘNG**, không từ user interaction:

- **Component mount**: view count, page tracking, analytics
- **Global events**: keyboard shortcuts (`onKeyDown`)
- **Intersection observer**: infinite scrolling
- **Dependency changes**: auto-sync data

PHẢI wrap trong `startTransition` để non-blocking UI + có `isPending` feedback!

</details>
