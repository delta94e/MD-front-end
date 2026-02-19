# Next.js Linking & Navigating — Deep Dive!

> **Chủ đề**: Linking và Navigating trong Next.js App Router — từ A đến Z
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/getting-started/linking-and-navigating

---

## Mục Lục

1. [§1. Tổng Quan — Navigation trong Next.js!](#1)
2. [§2. Server Rendering — Static vs Dynamic!](#2)
3. [§3. Prefetching — Tải Trước Route!](#3)
4. [§4. Streaming — loading.tsx & Suspense!](#4)
5. [§5. Client-side Transitions — SPA-like Navigation!](#5)
6. [§6. What Makes Transitions Slow? — Nguyên Nhân Chậm!](#6)
7. [§7. Solutions — Cách Tối Ưu Navigation!](#7)
8. [§8. Native History API — pushState & replaceState!](#8)
9. [§9. Tự Viết — Navigation Engine!](#9)
10. [§10. Tự Viết — Prefetch Cache & Link Simulator!](#10)
11. [§11. Tổng Kết & Câu Hỏi Luyện Tập!](#11)

---

## §1. Tổng Quan — Navigation trong Next.js!

```
  LINKING & NAVIGATING — TỔNG QUAN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ROUTES = SERVER RENDERED BY DEFAULT!                  │
  │  → Client PHẢI CHỜ server response                   │
  │  → Có thể gây CẢM GIÁC CHẬM                         │
  │                                                        │
  │  Next.js GIẢI QUYẾT bằng 4 OPTIMIZATIONS:            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ① PREFETCHING                                   │  │
  │  │     → Tải route TRƯỚC khi user navigate         │  │
  │  │     → Data sẵn sàng khi click!                  │  │
  │  │                                                  │  │
  │  │  ② STREAMING                                     │  │
  │  │     → Server GỬI TỪNG PHẦN khi ready            │  │
  │  │     → User thấy UI sớm hơn                     │  │
  │  │                                                  │  │
  │  │  ③ CLIENT-SIDE TRANSITIONS                       │  │
  │  │     → KHÔNG full page reload                    │  │
  │  │     → Giữ layout, chỉ swap page                │  │
  │  │                                                  │  │
  │  │  ④ SERVER RENDERING                              │  │
  │  │     → Static (build time) or Dynamic (request)  │  │
  │  │     → RSC Payload gửi từ server                 │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SƠ ĐỒ — LUỒNG NAVIGATION TỔNG THỂ:                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  User nhìn thấy <Link>                           │  │
  │  │       ↓                                          │  │
  │  │  ① PREFETCH (background)                        │  │
  │  │     Static route → prefetch TOÀN BỘ             │  │
  │  │     Dynamic route → prefetch loading.tsx        │  │
  │  │       ↓                                          │  │
  │  │  User CLICK link                                 │  │
  │  │       ↓                                          │  │
  │  │  ② CLIENT-SIDE TRANSITION                       │  │
  │  │     → KHÔNG reload page                         │  │
  │  │     → Giữ layouts + state                       │  │
  │  │       ↓                                          │  │
  │  │  ③ STREAMING (nếu dynamic)                      │  │
  │  │     → Hiện loading skeleton                     │  │
  │  │     → Swap khi server ready                     │  │
  │  │       ↓                                          │  │
  │  │  ④ COMPLETE                                      │  │
  │  │     → Page mới hiển thị, layouts intact         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Server Rendering — Static vs Dynamic!

```
  SERVER RENDERING — 2 LOẠI:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Layouts & Pages = React Server Components (RSC)      │
  │  → Render trên SERVER trước khi gửi client           │
  │  → Gửi RSC Payload (không phải HTML thuần)            │
  │                                                        │
  │  ┌────────────────────────┬───────────────────────┐    │
  │  │   STATIC RENDERING    │  DYNAMIC RENDERING    │    │
  │  │   (Prerendering)      │                       │    │
  │  ├────────────────────────┼───────────────────────┤    │
  │  │ Build time HOẶC       │ Request time          │    │
  │  │ revalidation          │ (mỗi lần request)     │    │
  │  ├────────────────────────┼───────────────────────┤    │
  │  │ Kết quả CACHED        │ KHÔNG cached          │    │
  │  ├────────────────────────┼───────────────────────┤    │
  │  │ Prefetch: TOÀN BỘ     │ Prefetch: BỎ QUA     │    │
  │  │ route                  │ hoặc CHỈ loading.tsx  │    │
  │  ├────────────────────────┼───────────────────────┤    │
  │  │ Navigate: INSTANT     │ Navigate: CHỜ server  │    │
  │  ├────────────────────────┼───────────────────────┤    │
  │  │ VD: Blog post tĩnh,   │ VD: searchParams,     │    │
  │  │ about page             │ cookies, headers      │    │
  │  └────────────────────────┴───────────────────────┘    │
  │                                                        │
  │  SƠ ĐỒ — STATIC vs DYNAMIC FLOW:                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  STATIC:                                         │  │
  │  │  Build time → HTML + RSC Payload → Cache        │  │
  │  │  User visit → Từ cache → INSTANT!              │  │
  │  │                                                  │  │
  │  │  DYNAMIC:                                        │  │
  │  │  User visit → Request → Server render          │  │
  │  │  → Chờ response → Client hiển thị             │  │
  │  │  ⚠️ Chậm hơn nếu KHÔNG có loading.tsx!        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  💡 Good to know:                                      │
  │  → Initial visit (lần đầu) cũng generate HTML!       │
  │  → Subsequent navigations dùng RSC Payload            │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

**Giải thích chi tiết**:

- **Static Rendering (Prerendering)**: Route được render tại **build time** hoặc khi **revalidation**. Kết quả được cache → user truy cập thấy **ngay lập tức**. Prefetch tải **toàn bộ route**.
- **Dynamic Rendering**: Route render tại **request time** (mỗi lần user request). Xảy ra khi dùng `searchParams`, `cookies()`, `headers()`. Prefetch **bị bỏ qua** hoặc chỉ tải `loading.tsx`.
- **Trade-off**: Server rendering = client phải chờ server response. Next.js giải quyết bằng **prefetching** + **client-side transitions**.

---

## §3. Prefetching — Tải Trước Route!

```
  PREFETCHING — TẢI TRƯỚC ROUTE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  PREFETCHING = Tải route TRƯỚC KHI user navigate!    │
  │                                                        │
  │  KHI NÀO PREFETCH XẢY RA?                             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  <Link href="/blog">Blog</Link>                  │  │
  │  │                                                  │  │
  │  │  TỰ ĐỘNG prefetch khi:                          │  │
  │  │  → Link XUẤT HIỆN trong viewport                │  │
  │  │  → Link được HOVER                              │  │
  │  │                                                  │  │
  │  │  KHÔNG prefetch:                                 │  │
  │  │  → <a href="/contact"> (HTML thuần)             │  │
  │  │  → <Link prefetch={false}>                      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  PREFETCH BAO NHIÊU?                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  STATIC ROUTE:                                   │  │
  │  │  → Prefetch TOÀN BỘ route!                      │  │
  │  │  → Layout + Page + Data = TẤT CẢ!              │  │
  │  │  → Navigate = INSTANT!                          │  │
  │  │                                                  │  │
  │  │  DYNAMIC ROUTE:                                  │  │
  │  │  → Prefetch BỎ QUA hoàn toàn                    │  │
  │  │  → HOẶC PARTIAL (nếu có loading.tsx):           │  │
  │  │    ┌─ Prefetch: ─────────────────────┐           │  │
  │  │    │ ✅ Shared layouts                │           │  │
  │  │    │ ✅ loading.tsx (skeleton)        │           │  │
  │  │    │ ❌ Page content (chờ server)     │           │  │
  │  │    └──────────────────────────────────┘           │  │
  │  │                                                  │  │
  │  │  → Tránh unnecessary server work               │  │
  │  │  → User có thể KHÔNG bao giờ visit route!      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SƠ ĐỒ — PREFETCH FLOW:                               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  <Link href="/blog"> xuất hiện viewport         │  │
  │  │       ↓                                          │  │
  │  │  Is route STATIC?                                │  │
  │  │  ├── YES → Prefetch FULL route → Cache          │  │
  │  │  └── NO (DYNAMIC):                               │  │
  │  │       ├── Has loading.tsx?                        │  │
  │  │       │   ├── YES → Prefetch layouts + skeleton  │  │
  │  │       │   └── NO → Skip prefetch entirely       │  │
  │  │       ↓                                          │  │
  │  │  User clicks → Data from cache OR server        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

**Code ví dụ — Link với prefetching:**

```typescript
import Link from 'next/link'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <nav>
          {/* ✅ Prefetch khi hover hoặc xuất hiện viewport */}
          <Link href="/blog">Blog</Link>

          {/* ❌ KHÔNG prefetch — HTML <a> thuần */}
          <a href="/contact">Contact</a>
        </nav>
        {children}
      </body>
    </html>
  )
}
```

---

## §4. Streaming — loading.tsx & Suspense!

```
  STREAMING — GỬI TỪNG PHẦN KHI READY:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  STREAMING = Server gửi parts KHI SẴN SÀNG:          │
  │  → KHÔNG chờ TOÀN BỘ route render xong              │
  │  → User thấy UI SỚMS hơn                             │
  │                                                        │
  │  CÁCH DÙNG — loading.tsx:                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Tạo file loading.tsx trong route folder:        │  │
  │  │  app/                                            │  │
  │  │  └── blog/                                       │  │
  │  │      ├── loading.tsx  ← Skeleton UI             │  │
  │  │      └── page.tsx     ← Actual content          │  │
  │  │                                                  │  │
  │  │  BEHIND THE SCENES:                              │  │
  │  │  Next.js TỰ ĐỘNG wrap page.tsx trong             │  │
  │  │  <Suspense> boundary!                            │  │
  │  │                                                  │  │
  │  │  ┌── layout.tsx ───────────────────────────┐     │  │
  │  │  │                                         │     │  │
  │  │  │  <Suspense fallback={<Loading />}>      │     │  │
  │  │  │    <Page />  ← swap khi ready           │     │  │
  │  │  │  </Suspense>                            │     │  │
  │  │  │                                         │     │  │
  │  │  └─────────────────────────────────────────┘     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SƠ ĐỒ — STREAMING FLOW:                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  User navigate → dynamic route                   │  │
  │  │       ↓                                          │  │
  │  │  ① HIỆN NGAY: loading.tsx (skeleton)            │  │
  │  │     → Layouts vẫn interactive!                   │  │
  │  │     → Navigation vẫn interruptible!             │  │
  │  │       ↓                                          │  │
  │  │  ② Server render page.tsx xong                   │  │
  │  │       ↓                                          │  │
  │  │  ③ SWAP: loading → actual content               │  │
  │  │     → Smooth transition!                        │  │
  │  │                                                  │  │
  │  │  LỢI ÍCH:                                       │  │
  │  │  → Immediate navigation + visual feedback       │  │
  │  │  → Layouts INTERACTIVE trong khi chờ            │  │
  │  │  → Navigation INTERRUPTIBLE (có thể cancel)     │  │
  │  │  → Core Web Vitals tốt hơn:                    │  │
  │  │    TTFB ↓  FCP ↓  TTI ↓                        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  💡 <Suspense> cũng dùng cho NESTED components:       │
  │  → Wrap riêng từng phần cần loading                   │
  │  → Granular hơn loading.tsx (toàn route)             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

**Code ví dụ — loading.tsx:**

```typescript
// app/blog/loading.tsx
export default function Loading() {
  // Fallback UI hiển thị trong khi route đang loading
  return <LoadingSkeleton />
}
```

**Giải thích behind the scenes**:

- Next.js **tự động** wrap `page.tsx` trong `<Suspense>` boundary
- `loading.tsx` = fallback cho `<Suspense>`
- Khi server render xong → swap loading → actual content
- Bạn cũng có thể dùng `<Suspense>` trực tiếp cho **nested components** granular hơn!

---

## §5. Client-side Transitions — SPA-like Navigation!

```
  CLIENT-SIDE TRANSITIONS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  TRUYỀN THÔNG: Server-rendered page                   │
  │  → Full page load mỗi lần navigate                   │
  │  → Mất state, reset scroll, block interactivity       │
  │                                                        │
  │  NEXT.JS: Client-side transitions với <Link>:         │
  │  → KHÔNG reload page!                                 │
  │  → Cập nhật content DYNAMICALLY:                      │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  CÁCH HOẠT ĐỘNG:                                 │  │
  │  │                                                  │  │
  │  │  ① GIỮ shared layouts + UI                      │  │
  │  │     → Sidebar, navbar, footer NGUYÊN VẸN!       │  │
  │  │     → State, scroll position PRESERVED!         │  │
  │  │                                                  │  │
  │  │  ② THAY THẾ page hiện tại bằng:                 │  │
  │  │     → Loading state (nếu prefetched)            │  │
  │  │     → HOẶC page mới (nếu đã có data)           │  │
  │  │                                                  │  │
  │  │  KẾT QUẢ:                                       │  │
  │  │  → Server-rendered app CẢM GIÁC NHƯ SPA!       │  │
  │  │  → Khi kết hợp prefetch + streaming:            │  │
  │  │    = FAST transitions cho CẢ dynamic routes!    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SO SÁNH — TRADITIONAL vs NEXT.JS:                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  TRADITIONAL SERVER RENDER:                      │  │
  │  │  Click → Full page load → White screen          │  │
  │  │  → Re-download CSS/JS → Re-render toàn bộ     │  │
  │  │  → State MẤT! Scroll MẤT!                      │  │
  │  │                                                  │  │
  │  │  NEXT.JS CLIENT-SIDE TRANSITION:                 │  │
  │  │  Click → Swap children ONLY → No white screen  │  │
  │  │  → Layouts GIỮU NGUYÊN → State PRESERVED      │  │
  │  │  → Từ cache → INSTANT!                         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §6. What Makes Transitions Slow? — Nguyên Nhân Chậm!

```
  TRANSITIONS CHẬM — 5 NGUYÊN NHÂN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① DYNAMIC ROUTES KHÔNG CÓ loading.tsx:               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  KHÔNG có loading.tsx:                           │  │
  │  │  → Client CHỜ server response                   │  │
  │  │  → KHÔNG CÓ visual feedback                     │  │
  │  │  → User tưởng app TREO!                        │  │
  │  │                                                  │  │
  │  │  CÓ loading.tsx:                                 │  │
  │  │  → Hiện skeleton NGAY LẬP TỨC                  │  │
  │  │  → User biết app đang xử lý                    │  │
  │  │  → Partial prefetch hoạt động                   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② DYNAMIC SEGMENTS KHÔNG CÓ generateStaticParams:   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  [slug] CÓ THỂ prerender nhưng THIẾU            │  │
  │  │  generateStaticParams:                           │  │
  │  │  → Fallback về DYNAMIC rendering!               │  │
  │  │  → Mỗi request = server render lại!            │  │
  │  │                                                  │  │
  │  │  THÊM generateStaticParams:                      │  │
  │  │  → Routes pre-built tại build time              │  │
  │  │  → Navigate = INSTANT (from cache)              │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ SLOW NETWORKS:                                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Mạng chậm/không ổn định:                       │  │
  │  │  → Prefetch CHƯA XONG khi user click            │  │
  │  │  → loading.js fallback KHÔNG hiện ngay          │  │
  │  │  → Ảnh hưởng CẢ static và dynamic routes!     │  │
  │  │                                                  │  │
  │  │  GIẢI PHÁP: useLinkStatus hook                  │  │
  │  │  → Hiển thị feedback NGAY khi click            │  │
  │  │  → Debounce với animation delay                 │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ④ DISABLING PREFETCHING:                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  <Link prefetch={false}>:                        │  │
  │  │  → Static route: fetch khi CLICK (chậm hơn!)   │  │
  │  │  → Dynamic route: chờ server hoàn toàn         │  │
  │  │                                                  │  │
  │  │  GIẢI PHÁP: Prefetch ON HOVER                   │  │
  │  │  → Chỉ prefetch routes user SẮP click          │  │
  │  │  → Tiết kiệm resources hơn prefetch toàn bộ   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⑤ HYDRATION CHƯA HOÀN THÀNH:                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  <Link> = Client Component                       │  │
  │  │  → PHẢI hydrate trước khi prefetch!             │  │
  │  │  → Bundle JS lớn = hydrate CHẬM               │  │
  │  │  → Prefetch BỊ DELAY                           │  │
  │  │                                                  │  │
  │  │  GIẢI PHÁP:                                      │  │
  │  │  → @next/bundle-analyzer: giảm bundle size     │  │
  │  │  → Chuyển logic lên server (RSC)               │  │
  │  │  → React Selective Hydration giúp tự động      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §7. Solutions — Cách Tối Ưu Navigation!

### 7.1. Thêm loading.tsx cho dynamic routes

```typescript
// app/blog/[slug]/loading.tsx
export default function Loading() {
  return <LoadingSkeleton />
}
```

### 7.2. Thêm generateStaticParams cho dynamic segments

```typescript
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch("https://.../posts").then((res) => res.json());

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // ...
}
```

### 7.3. useLinkStatus — Feedback cho slow networks

```
  useLinkStatus — HIỂN THỊ TRẠNG THÁI LINK:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CÁCH DÙNG:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  import { useLinkStatus } from 'next/link'       │  │
  │  │                                                  │  │
  │  │  const { pending } = useLinkStatus()             │  │
  │  │                                                  │  │
  │  │  pending = true  → navigation đang diễn ra      │  │
  │  │  pending = false → đã hoàn thành                │  │
  │  │                                                  │  │
  │  │  TIP: Debounce bằng animation delay!            │  │
  │  │  → Set initial animation-delay: 100ms           │  │
  │  │  → opacity: 0 → chỉ hiện nếu chậm > 100ms    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
'use client'
import { useLinkStatus } from 'next/link'

export default function LoadingIndicator() {
  const { pending } = useLinkStatus()
  return (
    <span
      aria-hidden
      className={`link-hint ${pending ? 'is-pending' : ''}`}
    />
  )
}
```

### 7.4. HoverPrefetchLink — Prefetch chỉ khi hover

```typescript
'use client'
import Link from 'next/link'
import { useState } from 'react'

function HoverPrefetchLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const [active, setActive] = useState(false)

  return (
    <Link
      href={href}
      prefetch={active ? null : false}  // null = default behavior
      onMouseEnter={() => setActive(true)}
    >
      {children}
    </Link>
  )
}
```

**Giải thích**:

- `prefetch={false}` → KHÔNG prefetch
- `prefetch={null}` → Dùng default behavior (auto prefetch)
- Khi hover → chuyển từ `false` sang `null` → bắt đầu prefetch!
- **Trade-off**: Tiết kiệm bandwidth, nhưng hơi chậm hơn so với prefetch tất cả

### 7.5. Giảm bundle size — Tăng tốc hydration

```
  GIẢM BUNDLE SIZE:
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  ① @next/bundle-analyzer                        │
  │     → Phân tích bundle, tìm dependencies lớn   │
  │     → Loại bỏ hoặc thay thế bằng lightweight   │
  │                                                  │
  │  ② Chuyển logic lên Server (RSC)                │
  │     → Server Components KHÔNG gửi JS xuống     │
  │     → Giảm client bundle significantly          │
  │                                                  │
  │  ③ React Selective Hydration                    │
  │     → React tự ưu tiên hydrate visible parts   │
  │     → Interactive sớm hơn!                     │
  └──────────────────────────────────────────────────┘
```

---

## §8. Native History API — pushState & replaceState!

```
  NATIVE HISTORY API — TÍCH HỢP VỚI NEXT.JS ROUTER:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Next.js cho phép dùng NATIVE browser APIs:           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  window.history.pushState(state, '', url)        │  │
  │  │  → THÊM entry mới vào history stack             │  │
  │  │  → User CÓ THỂ back lại!                       │  │
  │  │  → Sync với usePathname + useSearchParams       │  │
  │  │                                                  │  │
  │  │  window.history.replaceState(state, '', url)     │  │
  │  │  → THAY THẾ entry hiện tại                      │  │
  │  │  → User KHÔNG THỂ back lại!                     │  │
  │  │  → Sync với usePathname + useSearchParams       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SO SÁNH:                                              │
  │  ┌──────────────────┬──────────────────────────────┐   │
  │  │ pushState        │ replaceState                 │   │
  │  ├──────────────────┼──────────────────────────────┤   │
  │  │ THÊM vào stack   │ THAY THẾ trong stack         │   │
  │  │ Back button: ✅  │ Back button: ❌ (bỏ qua)    │   │
  │  │ VD: Sort list    │ VD: Switch locale           │   │
  │  │ VD: Filter       │ VD: Update tab              │   │
  │  └──────────────────┴──────────────────────────────┘   │
  │                                                        │
  │  QUAN TRỌNG:                                           │
  │  → KHÔNG reload page!                                 │
  │  → TỰ ĐỘNG sync với Next.js Router!                  │
  │  → usePathname & useSearchParams tự cập nhật!        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

**Code ví dụ — pushState (Sort products):**

```typescript
'use client'
import { useSearchParams } from 'next/navigation'

export default function SortProducts() {
  const searchParams = useSearchParams()

  function updateSorting(sortOrder: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sortOrder)
    // Thêm entry mới → user CÓ THỂ back!
    window.history.pushState(null, '', `?${params.toString()}`)
  }

  return (
    <>
      <button onClick={() => updateSorting('asc')}>Sort Ascending</button>
      <button onClick={() => updateSorting('desc')}>Sort Descending</button>
    </>
  )
}
```

**Code ví dụ — replaceState (Locale switcher):**

```typescript
'use client'
import { usePathname } from 'next/navigation'

export function LocaleSwitcher() {
  const pathname = usePathname()

  function switchLocale(locale: string) {
    const newPath = `/${locale}${pathname}`
    // Thay thế entry → user KHÔNG back lại locale cũ!
    window.history.replaceState(null, '', newPath)
  }

  return (
    <>
      <button onClick={() => switchLocale('en')}>English</button>
      <button onClick={() => switchLocale('fr')}>French</button>
    </>
  )
}
```

---

## §9. Tự Viết — Navigation Engine!

> **Mục tiêu**: Mô phỏng toàn bộ navigation flow — KHÔNG dùng thư viện!

```javascript
// ═══════════════════════════════════════════════════════
// TỰ VIẾT — NavigationEngine
// Mô phỏng prefetch + streaming + client-side transitions
// KHÔNG dùng bất kỳ thư viện nào!
// ═══════════════════════════════════════════════════════

var NavigationEngine = (function () {
  // ──── 1. ROUTE REGISTRY ────
  var routes = {
    "/": { type: "static", hasLoading: false, renderTime: 0 },
    "/about": { type: "static", hasLoading: false, renderTime: 0 },
    "/blog": { type: "static", hasLoading: false, renderTime: 0 },
    "/blog/[slug]": { type: "dynamic", hasLoading: true, renderTime: 800 },
    "/dashboard": { type: "dynamic", hasLoading: true, renderTime: 500 },
    "/products/[id]": { type: "dynamic", hasLoading: false, renderTime: 1200 },
    "/settings": { type: "static", hasLoading: false, renderTime: 0 },
  };

  // ──── 2. PREFETCH CACHE ────
  var prefetchCache = {};

  function prefetch(url) {
    var route = matchRoute(url);
    if (!route) return null;

    if (prefetchCache[url]) {
      console.log("  ⚡ Already prefetched: " + url);
      return prefetchCache[url];
    }

    if (route.type === "static") {
      // Static = prefetch FULL route
      prefetchCache[url] = {
        type: "full",
        content: "Full page content for " + url,
        loadingSkeleton: null,
        prefetchedAt: Date.now(),
      };
      console.log("  📦 FULL prefetch (static): " + url);
    } else if (route.hasLoading) {
      // Dynamic + loading.tsx = PARTIAL prefetch
      prefetchCache[url] = {
        type: "partial",
        content: null, // Chưa có page content!
        loadingSkeleton: '<div class="skeleton">Loading...</div>',
        prefetchedAt: Date.now(),
      };
      console.log("  📦 PARTIAL prefetch (dynamic + loading.tsx): " + url);
    } else {
      // Dynamic KHÔNG CÓ loading.tsx = SKIP
      console.log("  ⏭️  SKIP prefetch (dynamic, no loading.tsx): " + url);
      return null;
    }
    return prefetchCache[url];
  }

  // ──── 3. ROUTE MATCHER ────
  function matchRoute(url) {
    var pathname = url.split("?")[0].replace(/\/+$/, "") || "/";
    if (routes[pathname]) return routes[pathname];

    // Try dynamic segments
    var segs = pathname === "/" ? [] : pathname.replace(/^\//, "").split("/");
    var keys = Object.keys(routes);
    for (var i = 0; i < keys.length; i++) {
      var pSegs = keys[i] === "/" ? [] : keys[i].replace(/^\//, "").split("/");
      if (segs.length !== pSegs.length) continue;
      var matched = true;
      for (var j = 0; j < pSegs.length; j++) {
        if (pSegs[j].charAt(0) === "[") continue;
        if (pSegs[j] !== segs[j]) {
          matched = false;
          break;
        }
      }
      if (matched) return routes[keys[i]];
    }
    return null;
  }

  // ──── 4. NAVIGATE — Core navigation flow ────
  function navigate(fromUrl, toUrl) {
    console.log("");
    console.log("╔═══ NAVIGATION ═══════════════════════════╗");
    console.log("║ From: " + fromUrl);
    console.log("║ To:   " + toUrl);
    console.log("╚══════════════════════════════════════════╝");

    var route = matchRoute(toUrl);
    if (!route) {
      console.log("❌ 404 — Route not found");
      return;
    }

    var cached = prefetchCache[toUrl];
    console.log("");
    console.log("📊 Route type: " + route.type.toUpperCase());
    console.log("📊 Has loading.tsx: " + (route.hasLoading ? "YES" : "NO"));
    console.log("📊 Server render time: " + route.renderTime + "ms");

    // Step 1: Client-side transition starts
    console.log("");
    console.log("① CLIENT-SIDE TRANSITION starts");
    console.log("   → Shared layouts PRESERVED");
    console.log("   → NO full page reload");

    // Step 2: Show content based on cache
    if (cached && cached.type === "full") {
      console.log("");
      console.log("② FROM CACHE: Full content available!");
      console.log("   → Navigate: INSTANT (0ms)");
      console.log("   → Content: " + cached.content);
      console.log("   ✅ Navigation complete!");
      return;
    }

    if (cached && cached.type === "partial") {
      console.log("");
      console.log("② STREAMING: Show loading skeleton");
      console.log("   → Skeleton: " + cached.loadingSkeleton);
      console.log("   → Layouts still INTERACTIVE");
      console.log("   → Navigation INTERRUPTIBLE");
      console.log("");
      console.log("③ WAITING for server... (" + route.renderTime + "ms)");
      console.log("");
      console.log("④ SWAP: skeleton → actual content");
      console.log("   ✅ Total time: " + route.renderTime + "ms");
      console.log("   (But user saw skeleton IMMEDIATELY!)");
      return;
    }

    // No cache at all — worst case
    console.log("");
    console.log("② NO CACHE — waiting for server...");
    console.log("   ⚠️ NO visual feedback!");
    console.log("   ⚠️ User might think app is FROZEN!");
    console.log("   → Server rendering: " + route.renderTime + "ms");
    console.log("");
    console.log("③ Server response received");
    console.log("   → Show content");
    console.log("   ✅ Total time: " + route.renderTime + "ms");
    console.log("   ⚠️ Perceived as SLOW because no feedback!");
  }

  // ──── 5. DEMO ────
  function demo() {
    console.log("╔══════════════════════════════════════════╗");
    console.log("║  NAVIGATION ENGINE — FULL DEMO          ║");
    console.log("╚══════════════════════════════════════════╝");

    // Prefetch visible links
    console.log("\n━━━ PHASE 1: PREFETCHING (links in viewport) ━━━");
    prefetch("/about");
    prefetch("/blog");
    prefetch("/blog/hello-world");
    prefetch("/dashboard");
    prefetch("/products/42");

    // Navigate
    console.log("\n━━━ PHASE 2: NAVIGATIONS ━━━");
    navigate("/", "/about"); // Static, full cache → instant
    navigate("/about", "/blog"); // Static, full cache → instant
    navigate("/blog", "/blog/hello-world"); // Dynamic + loading → streaming
    navigate("/blog/hello-world", "/dashboard"); // Dynamic + loading → streaming
    navigate("/dashboard", "/products/42"); // Dynamic NO loading → slow!
  }

  return {
    prefetch: prefetch,
    navigate: navigate,
    matchRoute: matchRoute,
    demo: demo,
  };
})();
// Chạy thử: NavigationEngine.demo();
```

---

## §10. Tự Viết — Prefetch Cache & Link Simulator!

> **Mục tiêu**: Mô phỏng `<Link>`, `useRouter`, `useLinkStatus`, và History API — KHÔNG dùng thư viện!

```javascript
// ═══════════════════════════════════════════════════════
// TỰ VIẾT — LinkSimulator
// Mô phỏng <Link>, useRouter, useLinkStatus, History API
// KHÔNG dùng bất kỳ thư viện nào!
// ═══════════════════════════════════════════════════════

var LinkSimulator = (function () {
  // ──── 1. BROWSER HISTORY STACK ────
  var historyStack = [{ url: "/", state: null }];
  var historyIndex = 0;
  var currentPathname = "/";
  var currentSearchParams = {};

  function pushState(url) {
    // Xoá forward history
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push({ url: url, state: null });
    historyIndex++;
    updateCurrent(url);
    console.log(
      "  📌 pushState: " + url + " (stack size: " + historyStack.length + ")",
    );
  }

  function replaceState(url) {
    historyStack[historyIndex] = { url: url, state: null };
    updateCurrent(url);
    console.log(
      "  🔄 replaceState: " +
        url +
        " (stack size: " +
        historyStack.length +
        ")",
    );
  }

  function back() {
    if (historyIndex <= 0) {
      console.log("  ⛔ Cannot go back!");
      return;
    }
    historyIndex--;
    updateCurrent(historyStack[historyIndex].url);
    console.log("  ⬅️  back → " + historyStack[historyIndex].url);
  }

  function forward() {
    if (historyIndex >= historyStack.length - 1) {
      console.log("  ⛔ Cannot go forward!");
      return;
    }
    historyIndex++;
    updateCurrent(historyStack[historyIndex].url);
    console.log("  ➡️  forward → " + historyStack[historyIndex].url);
  }

  function updateCurrent(url) {
    var qi = url.indexOf("?");
    currentPathname = qi === -1 ? url : url.slice(0, qi);
    currentSearchParams = {};
    if (qi !== -1) {
      var qs = url.slice(qi + 1);
      var pairs = qs.split("&");
      for (var i = 0; i < pairs.length; i++) {
        var ei = pairs[i].indexOf("=");
        if (ei !== -1) {
          currentSearchParams[pairs[i].slice(0, ei)] = pairs[i].slice(ei + 1);
        }
      }
    }
  }

  // ──── 2. HOOKS SIMULATION ────
  function usePathname() {
    return currentPathname;
  }
  function useSearchParams() {
    return currentSearchParams;
  }

  function useLinkStatus(isNavigating) {
    return { pending: !!isNavigating };
  }

  // ──── 3. DEMO ────
  function demo() {
    console.log("╔══════════════════════════════════════════╗");
    console.log("║  LINK SIMULATOR — FULL DEMO             ║");
    console.log("╚══════════════════════════════════════════╝");

    console.log("\n━━━ pushState Demo (Sort) ━━━");
    console.log("pathname: " + usePathname());
    pushState("/products?sort=asc");
    console.log("pathname: " + usePathname());
    console.log("searchParams: " + JSON.stringify(useSearchParams()));
    pushState("/products?sort=desc");
    console.log("searchParams: " + JSON.stringify(useSearchParams()));

    console.log("\n━━━ Back/Forward Demo ━━━");
    back(); // → /products?sort=asc
    console.log("searchParams: " + JSON.stringify(useSearchParams()));
    back(); // → /
    console.log("pathname: " + usePathname());
    forward(); // → /products?sort=asc
    console.log("searchParams: " + JSON.stringify(useSearchParams()));

    console.log("\n━━━ replaceState Demo (Locale) ━━━");
    replaceState("/en/about");
    console.log("pathname: " + usePathname());
    replaceState("/fr/about");
    console.log("pathname: " + usePathname());
    back(); // Goes to / (skips en/about because it was replaced!)
    console.log("pathname: " + usePathname());

    console.log("\n━━━ useLinkStatus Demo ━━━");
    console.log("Before navigate: pending=" + useLinkStatus(false).pending);
    console.log("During navigate: pending=" + useLinkStatus(true).pending);
    console.log("After navigate:  pending=" + useLinkStatus(false).pending);

    console.log("\n━━━ History Stack ━━━");
    for (var i = 0; i < historyStack.length; i++) {
      var marker = i === historyIndex ? " ← CURRENT" : "";
      console.log("  [" + i + "] " + historyStack[i].url + marker);
    }
  }

  return {
    pushState: pushState,
    replaceState: replaceState,
    back: back,
    forward: forward,
    usePathname: usePathname,
    useSearchParams: useSearchParams,
    useLinkStatus: useLinkStatus,
    demo: demo,
  };
})();
// Chạy thử: LinkSimulator.demo();
```

---

## §11. Tổng Kết & Câu Hỏi Luyện Tập!

```
  TỔNG KẾT — LINKING & NAVIGATING:
  ┌────────────────────────────────────────────────────────┐
  │  ① Server Rendering: Static (cached) vs Dynamic       │
  │  ② Prefetching: Full (static) / Partial (dynamic)    │
  │  ③ Streaming: loading.tsx + <Suspense> auto-wrap      │
  │  ④ Client-side transitions: NO reload, SPA-like      │
  │  ⑤ Slow causes: no loading.tsx, no static params,    │
  │     slow networks, disabled prefetch, large bundles   │
  │  ⑥ useLinkStatus: pending feedback cho slow networks  │
  │  ⑦ HoverPrefetchLink: prefetch chỉ khi hover        │
  │  ⑧ History API: pushState (back ✅) / replaceState   │
  │  ⑨ Sync: usePathname + useSearchParams auto-update   │
  └────────────────────────────────────────────────────────┘
```

### Câu Hỏi Luyện Tập

**Câu 1**: Static rendering khác Dynamic rendering thế nào? Ảnh hưởng gì đến prefetching?

<details><summary>Đáp án</summary>

|                     | Static                    | Dynamic                             |
| ------------------- | ------------------------- | ----------------------------------- |
| Khi nào render?     | Build time / revalidation | Request time                        |
| Cached?             | ✅ Có                     | ❌ Không                            |
| Prefetch bao nhiêu? | **FULL** route            | **Skip** hoặc partial (loading.tsx) |
| Navigate speed      | **Instant**               | Chờ server response                 |

Static route → prefetch **TOÀN BỘ** → navigate **instant**!
Dynamic route → chỉ prefetch loading skeleton → user thấy skeleton → chờ server.

</details>

---

**Câu 2**: `loading.tsx` hoạt động thế nào? Tại sao QUAN TRỌNG cho dynamic routes?

<details><summary>Đáp án</summary>

- Next.js **tự động wrap** `page.tsx` trong `<Suspense fallback={<Loading />}>`
- `loading.tsx` export component hiển thị khi route đang loading
- Cho phép **partial prefetch** cho dynamic routes (prefetch layout + skeleton)
- User thấy **feedback ngay lập tức** thay vì màn hình trống
- Layouts vẫn **interactive**, navigation vẫn **interruptible**
- Cải thiện **TTFB**, **FCP**, **TTI**

</details>

---

**Câu 3**: `<Link>` prefetch khi nào? Prefetch bao nhiêu?

<details><summary>Đáp án</summary>

**Khi nào**:

- Link xuất hiện trong **viewport** (auto)
- Link được **hover**

**Bao nhiêu**:

- Static route → **FULL** (layout + page + data)
- Dynamic route + loading.tsx → **PARTIAL** (layout + loading skeleton)
- Dynamic route without loading.tsx → **SKIP**

`<a>` tag KHÔNG prefetch! Chỉ `<Link>` mới có!

</details>

---

**Câu 4**: `pushState` khác `replaceState` thế nào? Cho ví dụ thực tế.

<details><summary>Đáp án</summary>

| pushState                  | replaceState                  |
| -------------------------- | ----------------------------- |
| **Thêm** entry vào history | **Thay thế** entry hiện tại   |
| Back button: **quay lại**  | Back button: **bỏ qua**       |
| VD: Sort sản phẩm, filter  | VD: Switch locale, update tab |

**pushState**: Sort `?sort=asc` → `?sort=desc` → user back → thấy `?sort=asc`
**replaceState**: Switch `/en/about` → `/fr/about` → user back → bỏ qua `/en/about`!

Cả hai **sync** với `usePathname` + `useSearchParams` tự động!

</details>

---

**Câu 5**: 5 nguyên nhân làm transitions chậm và giải pháp?

<details><summary>Đáp án</summary>

| Nguyên nhân                                  | Giải pháp                                              |
| -------------------------------------------- | ------------------------------------------------------ |
| Dynamic route KHÔNG CÓ `loading.tsx`         | Thêm `loading.tsx` → partial prefetch + skeleton       |
| Dynamic segment THIẾU `generateStaticParams` | Thêm `generateStaticParams` → pre-build tại build time |
| Mạng chậm                                    | `useLinkStatus` hook → feedback ngay khi click         |
| Disabled prefetching                         | `HoverPrefetchLink` pattern → prefetch on hover        |
| JS bundle lớn → hydration chậm               | `@next/bundle-analyzer` + chuyển logic lên RSC         |

</details>

---

**Câu 6**: `useLinkStatus` dùng khi nào? Giải thích debounce technique.

<details><summary>Đáp án</summary>

- Dùng khi **mạng chậm** — prefetch chưa xong khi user click
- `const { pending } = useLinkStatus()` → `pending = true` khi đang navigate
- **Debounce technique**: Set CSS `animation-delay: 100ms` + `opacity: 0`
  → Loading indicator chỉ hiện nếu navigation > 100ms
  → Fast navigations: KHÔNG hiện indicator (mượt hơn!)
  → Slow navigations: hiện indicator sau 100ms (feedback rõ ràng!)

</details>

---

**Câu 7**: HoverPrefetchLink pattern — tại sao `prefetch={null}` chứ không phải `true`?

<details><summary>Đáp án</summary>

- `prefetch={false}` → KHÔNG prefetch
- `prefetch={null}` → Dùng **default behavior** (auto prefetch khi viewport/hover)
- `prefetch={true}` → Force prefetch **full** route (kể cả dynamic)

Dùng `null` thay vì `true` vì:

- `null` = để Next.js quyết định (smart behavior)
- `true` = force full prefetch, có thể gây **unnecessary server work** cho dynamic routes!

</details>

---

**Câu 8**: Mô tả toàn bộ flow khi user click `<Link href="/blog/hello">` (dynamic route CÓ loading.tsx).

<details><summary>Đáp án</summary>

```
1. <Link> xuất hiện viewport
   → PARTIAL prefetch: layout + loading.tsx skeleton
   → Cache lại!

2. User CLICK link
   → Client-side transition starts
   → KHÔNG full page reload

3. SWAP: current page → loading skeleton (INSTANT)
   → User thấy skeleton ngay!
   → Layouts GIỮU NGUYÊN + interactive
   → Navigation INTERRUPTIBLE

4. Server render page.tsx
   → Generate RSC Payload
   → Stream to client

5. SWAP: skeleton → actual content
   → Smooth transition
   → Complete!

Timeline:
[Click] → [Skeleton shown: 0ms] → [Server: 800ms] → [Content shown]
          ↑ instant!                                    ↑ swap!
```

</details>
