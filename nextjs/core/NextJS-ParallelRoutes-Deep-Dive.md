# Next.js Parallel Routes — Deep Dive!

> **Chủ đề**: Parallel Routes — Simultaneous/Conditional Rendering
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes
> **Hình ảnh trang gốc**: 6 diagrams — phân tích chi tiết bên dưới!

---

## Mục Lục

1. [§1. Tổng Quan — Parallel Routes là gì?](#1)
2. [§2. Convention — @folder Slots](#2)
3. [§3. default.js — Fallback cho Unmatched Slots](#3)
4. [§4. Behavior — Soft vs Hard Navigation](#4)
5. [§5. Examples — useSelectedLayoutSegment, Conditional, Tabs](#5)
6. [§6. Modals — Parallel Routes + Intercepting Routes](#6)
7. [§7. Phân Tích 6 Hình Gốc — Chi Tiết!](#7)
8. [§8. Sơ Đồ Tự Vẽ — Tổng Hợp](#8)
9. [§9. Tự Viết — ParallelRouteEngine](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. Tổng Quan — Parallel Routes là gì?

```
  PARALLEL ROUTES — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                 │
  │  Parallel Routes cho phép BẤT ĐỒNG THỜI hoặc CÓ ĐIỀU KIỆN │
  │  render 1 hoặc nhiều pages trong CÙNG 1 layout!              │
  │                                                              │
  │  DÙNG CHO:                                                    │
  │  → Dashboards (team + analytics cùng lúc!)                  │
  │  → Social feeds (content + sidebar!)                         │
  │  → Modals với deep linking!                                  │
  │  → Conditional UI theo user role!                            │
  │                                                              │
  │  ĐẶC ĐIỂM CHÍNH:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ • Render MULTIPLE pages ĐỒNG THỜI trong 1 layout!  │    │
  │  │ • Slots = @folder convention!                       │    │
  │  │ • Slots KHÔNG ảnh hưởng URL!                        │    │
  │  │   /@analytics/views → URL = /views!                │    │
  │  │ • Mỗi slot có thể navigate INDEPENDENTLY!          │    │
  │  │ • Slots có thể có loading.js, error.js riêng!      │    │
  │  │ • children prop = implicit slot @children!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Convention — @folder Slots!

```
  @FOLDER SLOTS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  NAMED SLOTS:                                                 │
  │  → Tạo bằng @folder convention!                              │
  │  → Passed as PROPS cho parent layout!                        │
  │                                                              │
  │  VÍ DỤ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ app/                                                 │    │
  │  │ ├── @analytics/        ← Slot!                     │    │
  │  │ │   └── page.js                                      │    │
  │  │ ├── @team/             ← Slot!                     │    │
  │  │ │   └── page.js                                      │    │
  │  │ ├── layout.js          ← Nhận slots as props!      │    │
  │  │ └── page.js            ← children (implicit slot!) │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LAYOUT CODE:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ export default function Layout({                     │    │
  │  │   children,   ← implicit @children slot!           │    │
  │  │   team,       ← @team slot!                        │    │
  │  │   analytics,  ← @analytics slot!                   │    │
  │  │ }: {                                                 │    │
  │  │   children: React.ReactNode                          │    │
  │  │   analytics: React.ReactNode                         │    │
  │  │   team: React.ReactNode                              │    │
  │  │ }) {                                                 │    │
  │  │   return (                                           │    │
  │  │     <>                                               │    │
  │  │       {children}                                     │    │
  │  │       {team}                                         │    │
  │  │       {analytics}                                    │    │
  │  │     </>                                              │    │
  │  │   )                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ QUAN TRỌNG:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ • Slots KHÔNG phải route segments!                  │    │
  │  │ • /@analytics/views → URL = /views!                │    │
  │  │   @analytics bị BỎ QUA trong URL!                   │    │
  │  │                                                      │    │
  │  │ • KHÔNG THỂ có static + dynamic slots cùng level!   │    │
  │  │   → Nếu 1 slot dynamic → TẤT CẢ phải dynamic!    │    │
  │  │                                                      │    │
  │  │ • children = implicit slot!                          │    │
  │  │   app/page.js ≡ app/@children/page.js               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. default.js — Fallback!

```
  default.js — FALLBACK:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ:                                                     │
  │  → @team có /settings page                                  │
  │  → @analytics KHÔNG có /settings page                       │
  │  → Navigate to /settings → @analytics hiện gì???           │
  │                                                              │
  │  GIẢI PHÁP: default.js!                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ default.js = FALLBACK khi slot KHÔNG có page        │    │
  │  │ matching URL hiện tại!                               │    │
  │  │                                                      │    │
  │  │ app/                                                 │    │
  │  │ ├── @team/                                           │    │
  │  │ │   └── settings/                                    │    │
  │  │ │       └── page.js     ← CÓ /settings!            │    │
  │  │ ├── @analytics/                                      │    │
  │  │ │   ├── default.js      ← FALLBACK!                │    │
  │  │ │   └── page.js                                      │    │
  │  │ ├── default.js          ← Root fallback!            │    │
  │  │ ├── layout.js                                        │    │
  │  │ └── page.js                                          │    │
  │  │                                                      │    │
  │  │ Navigate to /settings:                               │    │
  │  │ → @team: render settings/page.js ✅                 │    │
  │  │ → @analytics: render default.js ✅                  │    │
  │  │                                                      │    │
  │  │ Không có default.js?                                 │    │
  │  │ → 404 rendered! ❌                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  children CŨNG CẦN default.js!                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → children = implicit slot!                         │    │
  │  │ → Cũng cần default.js cho fallback!                 │    │
  │  │ → Khi Next.js KHÔNG thể recover active state       │    │
  │  │   của parent page!                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Behavior — Soft vs Hard Navigation!

```
  NAVIGATION BEHAVIOR:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Next.js track ACTIVE STATE cho mỗi slot!                    │
  │  Behavior KHÁC NHAU tùy loại navigation!                     │
  │                                                              │
  │  SOFT NAVIGATION (Client-side: Link, router.push):           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → PARTIAL RENDER!                                   │    │
  │  │ → Chỉ thay đổi subpage TRONG slot matched!         │    │
  │  │ → GIỮ NGUYÊN other slots' active subpages!         │    │
  │  │ → KỀ CẢ KHI chúng KHÔNG match URL hiện tại!       │    │
  │  │                                                      │    │
  │  │ VÍ DỤ:                                               │    │
  │  │ → Đang ở / → @team=page, @analytics=page          │    │
  │  │ → Click Link → /settings                           │    │
  │  │ → @team: render /settings (matched!)                │    │
  │  │ → @analytics: GIỮ NGUYÊN page trước đó!            │    │
  │  │   (dù @analytics/settings KHÔNG tồn tại!)         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  HARD NAVIGATION (Browser refresh, initial load):            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → FULL PAGE LOAD!                                   │    │
  │  │ → KHÔNG THỂ xác định active state cũ!              │    │
  │  │ → Slots KHÔNG match → render default.js!           │    │
  │  │ → Không có default.js → 404!                       │    │
  │  │                                                      │    │
  │  │ VÍ DỤ:                                               │    │
  │  │ → Refresh ở /settings                               │    │
  │  │ → @team: render /settings (matched!) ✅             │    │
  │  │ → @analytics: render default.js ✅                  │    │
  │  │   (hoặc 404 nếu không có default.js!)              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  → 404 ngăn render parallel route ở page không đúng!        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Examples — Conditional Routes, Tabs!

```
  EXAMPLES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  EX 1: useSelectedLayoutSegment                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 'use client'                                        │    │
  │  │ import { useSelectedLayoutSegment }                  │    │
  │  │   from 'next/navigation'                             │    │
  │  │                                                      │    │
  │  │ export default function Layout({                     │    │
  │  │   auth                                               │    │
  │  │ }: { auth: React.ReactNode }) {                      │    │
  │  │   const loginSegment =                               │    │
  │  │     useSelectedLayoutSegment('auth')                 │    │
  │  │   // → app/@auth/login → loginSegment = "login"    │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → parallelRoutesKey = tên slot (bỏ @!)             │    │
  │  │ → Biết SUBPAGE nào đang active trong slot!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EX 2: CONDITIONAL ROUTES (User Role!)                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { checkUserRole } from '@/lib/auth'           │    │
  │  │                                                      │    │
  │  │ export default function Layout({                     │    │
  │  │   user,                                              │    │
  │  │   admin,                                             │    │
  │  │ }: {                                                 │    │
  │  │   user: React.ReactNode                              │    │
  │  │   admin: React.ReactNode                             │    │
  │  │ }) {                                                 │    │
  │  │   const role = checkUserRole()                       │    │
  │  │   return role === 'admin' ? admin : user             │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → @admin/page.js: admin dashboard!                  │    │
  │  │ → @user/page.js: user dashboard!                    │    │
  │  │ → CÙNG URL nhưng UI KHÁC NHAU theo role!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  EX 3: TAB GROUPS (Independent Navigation!)                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ @analytics/                                          │    │
  │  │ ├── layout.js     ← layout RIÊNG cho slot!         │    │
  │  │ ├── page-views/                                      │    │
  │  │ │   └── page.js                                      │    │
  │  │ └── visitors/                                        │    │
  │  │     └── page.js                                      │    │
  │  │                                                      │    │
  │  │ // @analytics/layout.js                              │    │
  │  │ import Link from 'next/link'                         │    │
  │  │ export default function Layout({ children }) {       │    │
  │  │   return (                                           │    │
  │  │     <>                                               │    │
  │  │       <nav>                                          │    │
  │  │         <Link href="/page-views">Page Views</Link>   │    │
  │  │         <Link href="/visitors">Visitors</Link>       │    │
  │  │       </nav>                                         │    │
  │  │       <div>{children}</div>                          │    │
  │  │     </>                                              │    │
  │  │   )                                                  │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → Slot có NESTED layout riêng!                      │    │
  │  │ → Navigate WITHIN slot independently!               │    │
  │  │ → Như mini-app trong main layout!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Modals — Parallel Routes + Intercepting Routes!

```
  MODALS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Parallel Routes + Intercepting Routes = MODALS!              │
  │                                                              │
  │  GIẢI QUYẾT CÁC VẤN ĐỀ:                                     │
  │  → Modal content SHAREABLE qua URL!                          │
  │  → PRESERVE context khi refresh!                             │
  │  → CLOSE modal khi back navigation!                          │
  │  → REOPEN modal khi forward navigation!                      │
  │                                                              │
  │  FILE STRUCTURE:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ app/                                                 │    │
  │  │ ├── @auth/               ← Slot cho auth!          │    │
  │  │ │   ├── default.js       ← return null (inactive!) │    │
  │  │ │   └── (.)login/        ← Intercept /login!       │    │
  │  │ │       └── page.js      ← Modal version!          │    │
  │  │ ├── login/                                           │    │
  │  │ │   └── page.js          ← Full page version!      │    │
  │  │ ├── layout.js            ← Render @auth slot!      │    │
  │  │ └── page.js                                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Client-side click <Link href="/login">:              │    │
  │  │ → (.)login intercepts!                              │    │
  │  │ → @auth slot renders Modal + Login!                 │    │
  │  │ → Main page stays underneath! ✅                    │    │
  │  │                                                      │    │
  │  │ Direct URL /login (refresh/initial):                 │    │
  │  │ → Full login/page.js renders!                       │    │
  │  │ → Normal full-page login! ✅                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  OPEN MODAL:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // layout.js                                         │    │
  │  │ import Link from 'next/link'                         │    │
  │  │ export default function Layout({ auth, children }) { │    │
  │  │   return (                                           │    │
  │  │     <>                                               │    │
  │  │       <nav>                                          │    │
  │  │         <Link href="/login">Open modal</Link>        │    │
  │  │       </nav>                                         │    │
  │  │       <div>{auth}</div>    ← modal renders here!   │    │
  │  │       <div>{children}</div>← main content!          │    │
  │  │     </>                                              │    │
  │  │   )                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CLOSE MODAL:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Cách 1: router.back()                                │    │
  │  │ 'use client'                                        │    │
  │  │ import { useRouter } from 'next/navigation'          │    │
  │  │ export function Modal({ children }) {                │    │
  │  │   const router = useRouter()                         │    │
  │  │   return (                                           │    │
  │  │     <>                                               │    │
  │  │       <button onClick={() => router.back()}>        │    │
  │  │         Close modal                                  │    │
  │  │       </button>                                      │    │
  │  │       <div>{children}</div>                          │    │
  │  │     </>                                              │    │
  │  │   )                                                  │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ Cách 2: Link (navigate away)                         │    │
  │  │ → @auth/page.tsx return null                        │    │
  │  │ → Hoặc catch-all: @auth/[...catchAll]/page.tsx      │    │
  │  │   return null                                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Phân Tích 6 Hình Gốc — Chi Tiết!

> **Trang docs gốc có 6 diagrams.** Dưới đây phân tích từng hình!

### Hình 1: Parallel Routes Introduction — Dashboard Layout

```
  HÌNH 1 — DASHBOARD LAYOUT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MÔ TẢ:                                                       │
  │  Sơ đồ minh họa concept CƠ BẢN của Parallel Routes!         │
  │  Trình bày cách file system MAP vào UI thật!                 │
  │                                                              │
  │  BÊN TRÁI — File Tree:               BÊN PHẢI — UI:        │
  │  ┌─────────────────────┐   ┌─────────────────────────┐      │
  │  │ app/                │   │ ┌─ acme.com ──────────┐ │      │
  │  │ ├── @team/          │───│ │                      │ │      │
  │  │ │   └── page.js  ──│─A─│ │ ┌──────┐ ┌────────┐ │ │      │
  │  │ ├── @analytics/     │   │ │ │ Team │ │Analytics│ │ │      │
  │  │ │   └── page.js  ──│─B─│ │ │      │ │        │ │ │      │
  │  │ └── layout.js       │   │ │ └──────┘ └────────┘ │ │      │
  │  └─────────────────────┘   │ └──────────────────────┘ │      │
  │                            └─────────────────────────┘      │
  │                                                              │
  │  Mũi tên A: @team/page.js → Team panel (BÊN TRÁI UI)      │
  │  Mũi tên B: @analytics/page.js → Analytics panel (PHẢI)   │
  │                                                              │
  │  CODE hiển thị bên dưới:                                     │
  │  layout.js nhận props: { children, team, analytics }         │
  │  → export default function Layout({ children, team,         │
  │       analytics }) { return ... }                             │
  │                                                              │
  │  Ý NGHĨA:                                                    │
  │  → Multiple pages render đồng thời!                         │
  │  → @slots KHÔNG ảnh hưởng URL!                              │
  │  → Layout compose các slots vào UI!                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Hình 2: Slots File Structure (File Tree)

```
  HÌNH 2 — FILE TREE CHI TIẾT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MÔ TẢ:                                                       │
  │  Tree view thể hiện cấu trúc file chi tiết cho slots!       │
  │                                                              │
  │  VẼ LẠI:                                                      │
  │  app/                                                        │
  │  ├── @analytics/        ● (chấm xanh — đánh dấu slot!)    │
  │  │   └── page.js                                             │
  │  ├── @team/             ● (chấm xanh — đánh dấu slot!)    │
  │  │   └── page.js                                             │
  │  ├── layout.js                                               │
  │  └── page.js                                                 │
  │                                                              │
  │  VISUAL ELEMENTS:                                             │
  │  → Chấm XANH (●) đánh dấu @analytics và @team             │
  │  → Phân biệt slots với standard folders!                    │
  │  → Slots = SIBLINGS với layout.js + page.js!                │
  │  → Mỗi slot PHẢI có page.js bên trong!                     │
  │                                                              │
  │  Ý NGHĨA:                                                    │
  │  → Slots nằm CÙNG CẤP với layout!                          │
  │  → Passed as PROPS cho layout component!                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Hình 3: default.js Fallback Structure

```
  HÌNH 3 — DEFAULT.JS FALLBACK:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MÔ TẢ:                                                       │
  │  Giải thích vị trí + vai trò của default.js files!           │
  │                                                              │
  │  VẼ LẠI:                                                      │
  │  app/                                                        │
  │  ├── @team/                                                  │
  │  │   └── settings/                                           │
  │  │       └── page.js         ← CÓ /settings!               │
  │  ├── @analytics/                                             │
  │  │   ├── default.js    ●     ← FALLBACK! (chấm xanh!)     │
  │  │   └── page.js                                             │
  │  ├── default.js        ●     ← ROOT fallback! (chấm xanh!)│
  │  ├── layout.js                                               │
  │  └── page.js                                                 │
  │                                                              │
  │  LOGIC KHI NAVIGATION → /settings:                          │
  │  → @team slot: TÌM @team/settings/page.js → FOUND! ✅     │
  │  → @analytics slot: TÌM @analytics/settings/page.js        │
  │    → NOT FOUND! → render @analytics/default.js ✅          │
  │                                                              │
  │  VISUAL: Chấm XANH (●) highlight default.js files!          │
  │  → Nhấn mạnh tầm quan trọng của fallback!                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Hình 4: Conditional Routes (Role-based!)

```
  HÌNH 4 — CONDITIONAL ROUTES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MÔ TẢ:                                                       │
  │  Sơ đồ thể hiện conditional rendering dựa trên user role!   │
  │                                                              │
  │  CẤU TRÚC:                                                    │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │                                                        │  │
  │  │  ┌─ layout.js ──────────────────────────────────────┐  │  │
  │  │  │ import { checkUserRole } from '@/lib/auth'       │  │  │
  │  │  │ export default function Layout({ admin, user }) { │  │  │
  │  │  │   const role = checkUserRole()                    │  │  │
  │  │  │   return role === 'admin' ? admin : user          │  │  │
  │  │  │ }                                                 │  │  │
  │  │  └──────────┬─────────────────────┬─────────────────┘  │  │
  │  │             │                     │                     │  │
  │  │    role = 'admin'           role = 'user'              │  │
  │  │             │                     │                     │  │
  │  │             ▼                     ▼                     │  │
  │  │  ┌── @admin/page.js ──┐  ┌── @user/page.js ──┐       │  │
  │  │  │ ┌────┐┌────┐      │  │ ┌──────────────┐   │       │  │
  │  │  │ │████││████│      │  │ │ List view    │   │       │  │
  │  │  │ │ Charts   │      │  │ │ ─────────── │   │       │  │
  │  │  │ │ & Graphs │      │  │ │ ─────────── │   │       │  │
  │  │  │ └────┘└────┘      │  │ │ ─────────── │   │       │  │
  │  │  │ (Complex dashboard)│  │ └──────────────┘   │       │  │
  │  │  └────────────────────┘  └────────────────────┘       │  │
  │  │                                                        │  │
  │  └────────────────────────────────────────────────────────┘  │
  │                                                              │
  │  Ý NGHĨA:                                                    │
  │  → CÙNG URL → UI KHÁC theo quyền!                          │
  │  → Admin: dashboard phức tạp (charts, graphs)               │
  │  → User: danh sách đơn giản                                 │
  │  → Code: layout quyết định hiển thị slot nào!               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Hình 5: Tab Groups (Independent Slot Navigation)

```
  HÌNH 5 — TAB GROUPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MÔ TẢ:                                                       │
  │  Navigation ĐỘC LẬP bên trong 1 slot!                       │
  │                                                              │
  │  VẼ LẠI:                                                      │
  │  app/                                                        │
  │  ├── @analytics/                                             │
  │  │   ├── layout.js            ← Layout RIÊNG cho slot!    │
  │  │   ├── page-views/                                         │
  │  │   │   └── page.js          ← Sub-page 1!               │
  │  │   └── visitors/                                           │
  │  │       └── page.js          ← Sub-page 2!               │
  │  └── layout.js                ← Main layout                │
  │                                                              │
  │  → Slot @analytics có NESTED LAYOUT riêng!                  │
  │  → Navigate giữa page-views ↔ visitors TRONG slot!         │
  │  → Như mini-app! Main layout KHÔNG bị ảnh hưởng!           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Hình 6: Modals File Structure (Auth Modal)

```
  HÌNH 6 — MODALS (AUTH):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MÔ TẢ:                                                       │
  │  File structure cho modal pattern! Kết hợp @slot +           │
  │  intercepting routes (.)!                                    │
  │                                                              │
  │  BÊN TRÁI — File Tree:       BÊN PHẢI — UI:                │
  │  ┌──────────────────────┐   ┌──────────────────────┐        │
  │  │ app/                 │   │ ┌─ acme.com ───────┐ │        │
  │  │ ├── @auth/     ●     │   │ │                  │ │        │
  │  │ │   ├── default.js   │   │ │ ┌──────────────┐ │ │        │
  │  │ │   └── (.)login/    │   │ │ │  Login Modal │ │ │        │
  │  │ │       └── page.js  │   │ │ │  ┌────────┐  │ │ │        │
  │  │ ├── login/           │   │ │ │  │ Form   │  │ │ │        │
  │  │ │   └── page.js      │   │ │ │  └────────┘  │ │ │        │
  │  │ └── layout.js        │   │ │ └──────────────┘ │ │        │
  │  └──────────────────────┘   │ │  (overlay modal) │ │        │
  │                             │ └──────────────────┘ │        │
  │                             └──────────────────────┘        │
  │                                                              │
  │  Chấm XANH (●): @auth slot highlighted!                     │
  │                                                              │
  │  HOW IT WORKS:                                                │
  │  → Client nav <Link href="/login">:                         │
  │    → (.)login intercepts → render @auth slot = MODAL!      │
  │  → Direct /login (refresh):                                  │
  │    → login/page.js → full page login!                      │
  │  → Modal shareable via URL /login!                          │
  │  → Back button → close modal!                               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Sơ Đồ Tự Vẽ — Tổng Hợp!

### Sơ Đồ A: Complete Parallel Routes Architecture

```
  PARALLEL ROUTES — FULL ARCHITECTURE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  REQUEST: /dashboard                                         │
  │       │                                                      │
  │       ▼                                                      │
  │  Next.js Router                                              │
  │       │                                                      │
  │       ▼                                                      │
  │  Find layout.js at /dashboard                                │
  │       │                                                      │
  │       ├─── children (implicit @children)                     │
  │       │    → app/dashboard/page.js                          │
  │       │                                                      │
  │       ├─── @team slot                                        │
  │       │    → app/dashboard/@team/page.js                    │
  │       │                                                      │
  │       └─── @analytics slot                                   │
  │            → app/dashboard/@analytics/page.js               │
  │                                                              │
  │       │                                                      │
  │       ▼                                                      │
  │  ┌── LAYOUT RENDER ─────────────────────────────────────┐    │
  │  │                                                       │    │
  │  │  export default function Layout({                     │    │
  │  │    children, team, analytics                          │    │
  │  │  }) {                                                 │    │
  │  │    return (                                           │    │
  │  │      <div className="dashboard">                      │    │
  │  │        <main>{children}</main>                        │    │
  │  │        <aside>{team}</aside>                          │    │
  │  │        <aside>{analytics}</aside>                     │    │
  │  │      </div>                                           │    │
  │  │    )                                                  │    │
  │  │  }                                                    │    │
  │  │                                                       │    │
  │  └───────────────────────────────────────────────────────┘    │
  │       │                                                      │
  │       ▼                                                      │
  │  ┌─────────────────────────────────────────────────────┐     │
  │  │ ┌──────────┐ ┌──────────┐ ┌─────────────────────┐  │     │
  │  │ │ children │ │   Team   │ │    Analytics        │  │     │
  │  │ │ (main    │ │  (slot)  │ │    (slot)           │  │     │
  │  │ │  content)│ │          │ │                     │  │     │
  │  │ └──────────┘ └──────────┘ └─────────────────────┘  │     │
  │  │                RENDERED UI                          │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ B: Soft vs Hard Navigation

```
  SOFT vs HARD NAVIGATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TRẠNG THÁI HIỆN TẠI: URL = /                               │
  │  @team = page (home)  │  @analytics = page (home)           │
  │                                                              │
  │  ═══════════════════════════════════════════════════════════  │
  │                                                              │
  │  SOFT NAV: Click <Link href="/settings">                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ @team: /settings/page.js ← THAY ĐỔI! (matched!)   │    │
  │  │ @analytics: GIỮ NGUYÊN page trước!  ← KHÔNG đổi!  │    │
  │  │                                                      │    │
  │  │ → Partial render! Nhanh!                            │    │
  │  │ → Active state PRESERVED!                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ═══════════════════════════════════════════════════════════  │
  │                                                              │
  │  HARD NAV: Browser refresh ở /settings                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ @team: /settings/page.js ← FOUND! ✅               │    │
  │  │ @analytics: ???                                      │    │
  │  │   ├── @analytics/settings? → KHÔNG CÓ! ❌          │    │
  │  │   ├── @analytics/default.js? → CÓ → render! ✅    │    │
  │  │   └── Không có default.js? → 404! ❌                │    │
  │  │                                                      │    │
  │  │ → Full page load! Active state LOST!                │    │
  │  │ → default.js = SAFETY NET!                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — ParallelRouteEngine!

```javascript
/**
 * ParallelRouteEngine — Mô phỏng Next.js Parallel Routes!
 * Tự viết bằng tay, KHÔNG dùng thư viện nào!
 * Covers: slots, default.js, soft/hard nav, conditionals
 */
var ParallelRouteEngine = (function () {

  // ═══════════════════════════════════
  // 1. SLOT RESOLVER
  // ═══════════════════════════════════
  function resolveSlots(layoutPath, fileStructure) {
    var slots = { children: null };

    for (var i = 0; i < fileStructure.length; i++) {
      var file = fileStructure[i];
      var match = file.match(/@(\w+)/);
      if (match && file.indexOf(layoutPath) === 0) {
        slots[match[1]] = file;
      }
    }

    // children = implicit slot
    var childrenPage = layoutPath + '/page.js';
    for (var j = 0; j < fileStructure.length; j++) {
      if (fileStructure[j] === childrenPage) {
        slots.children = childrenPage;
        break;
      }
    }

    return {
      slots: slots,
      count: Object.keys(slots).length,
      note: 'children = implicit @children slot!'
    };
  }

  // ═══════════════════════════════════
  // 2. NAVIGATION SIMULATOR
  // ═══════════════════════════════════
  function simulateNavigation(type, targetUrl, slots, fileStructure) {
    var results = {};

    for (var slotName in slots) {
      var slotPath = slots[slotName];
      if (!slotPath) continue;

      var slotDir = slotPath.replace(/\/page\.js$/, '');
      var targetPage = slotDir + targetUrl + '/page.js';
      var defaultFile = slotDir + '/default.js';

      var hasTarget = fileStructure.indexOf(targetPage) !== -1;
      var hasDefault = fileStructure.indexOf(defaultFile) !== -1;

      if (hasTarget) {
        results[slotName] = {
          renders: targetPage,
          status: 'MATCHED'
        };
      } else if (type === 'soft') {
        results[slotName] = {
          renders: 'PREVIOUS ACTIVE STATE (preserved!)',
          status: 'KEPT (soft nav!)'
        };
      } else if (type === 'hard') {
        if (hasDefault) {
          results[slotName] = {
            renders: defaultFile,
            status: 'FALLBACK (default.js!)'
          };
        } else {
          results[slotName] = {
            renders: null,
            status: '404! (no default.js!)'
          };
        }
      }
    }

    return {
      type: type === 'soft' ? 'SOFT (client-side)' : 'HARD (refresh)',
      targetUrl: targetUrl,
      results: results
    };
  }

  // ═══════════════════════════════════
  // 3. CONDITIONAL ROUTE RESOLVER
  // ═══════════════════════════════════
  function resolveConditional(role, adminSlot, userSlot) {
    return {
      role: role,
      rendered: role === 'admin' ? adminSlot : userSlot,
      slotName: role === 'admin' ? '@admin' : '@user',
      note: 'Same URL, different UI based on role!'
    };
  }

  // ═══════════════════════════════════
  // 4. URL CHECK — Slots don't affect URL!
  // ═══════════════════════════════════
  function resolveUrl(filePath) {
    // Remove @slot from URL
    var url = filePath
      .replace(/^app/, '')
      .replace(/@\w+\//g, '')  // Remove @slot/
      .replace(/\/page\.(js|tsx)$/, '')
      .replace(/\/$/, '');
    return {
      filePath: filePath,
      actualUrl: url || '/',
      note: '@slots are REMOVED from URL!'
    };
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  PARALLEL ROUTE ENGINE — DEMO              ║');
    console.log('╚══════════════════════════════════════════╝');

    var files = [
      'app/layout.js',
      'app/page.js',
      'app/@team/page.js',
      'app/@team/settings/page.js',
      'app/@analytics/page.js',
      'app/@analytics/default.js',
      'app/default.js'
    ];

    // 1. Resolve slots
    console.log('\n--- 1. RESOLVE SLOTS ---');
    console.log(JSON.stringify(resolveSlots('app', files), null, 2));

    // 2. Soft navigation → /settings
    console.log('\n--- 2. SOFT NAV → /settings ---');
    var slots = {
      team: 'app/@team/page.js',
      analytics: 'app/@analytics/page.js'
    };
    console.log(JSON.stringify(
      simulateNavigation('soft', '/settings', slots, files), null, 2));

    // 3. Hard navigation → /settings
    console.log('\n--- 3. HARD NAV → /settings ---');
    console.log(JSON.stringify(
      simulateNavigation('hard', '/settings', slots, files), null, 2));

    // 4. Conditional routes
    console.log('\n--- 4. CONDITIONAL ---');
    console.log(JSON.stringify(
      resolveConditional('admin', '@admin/page.js', '@user/page.js')));
    console.log(JSON.stringify(
      resolveConditional('user', '@admin/page.js', '@user/page.js')));

    // 5. URL resolution (slots removed!)
    console.log('\n--- 5. URL RESOLUTION ---');
    console.log(JSON.stringify(resolveUrl('app/@analytics/views/page.js')));
    console.log(JSON.stringify(resolveUrl('app/@auth/(.)login/page.js')));

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                         ║');
    console.log('╚══════════════════════════════════════════╝');
  }

  return {
    resolveSlots: resolveSlots,
    simulateNavigation: simulateNavigation,
    resolveConditional: resolveConditional,
    resolveUrl: resolveUrl,
    demo: demo
  };
})();

// Chạy: ParallelRouteEngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

### ❓ Câu 1: Parallel Routes khác gì với nested routes thông thường?

**Trả lời:**

| Tiêu chí | Nested Routes | Parallel Routes |
|---|---|---|
| Render | Tuần tự (cha → con) | **ĐỒNG THỜI** (cùng lúc!) |
| URL | Mỗi segment = 1 URL part | @slots **KHÔNG** ảnh hưởng URL! |
| Layout | Cha wrap con | Slots là **SIBLINGS** trong layout! |
| Navigation | Cùng navigate | Có thể navigate **ĐỘC LẬP**! |
| Loading/Error | Share qua segment | Mỗi slot có **RIÊNG**! |

### ❓ Câu 2: children prop có phải là slot không?

**Trả lời:**

**CÓ!** `children` là **implicit slot** — tương đương `@children`.

```
app/page.js  ≡  app/@children/page.js
```

→ Không cần tạo folder `@children`, Next.js tự hiểu!
→ children cũng cần `default.js` fallback khi hard nav!

### ❓ Câu 3: Tại sao cần default.js?

**Trả lời:**

Vì **Hard Navigation** (refresh) KHÔNG nhớ active state của slots!

- **Soft nav** (Link): giữ nguyên slot state cũ → OK!
- **Hard nav** (refresh): slot KHÔNG match URL → cần fallback!
  - Có `default.js` → render fallback! ✅
  - Không có → **404!** ❌

→ `default.js` = **safety net** cho parallel routes!

### ❓ Câu 4: Slots có ảnh hưởng URL không?

**Trả lời:**

**KHÔNG!** @slots bị **loại bỏ** khỏi URL!

```
File: app/@analytics/views/page.js
URL:  /views  (KHÔNG có @analytics!)
```

→ `@analytics` là slot, KHÔNG phải route segment!
→ Chỉ dùng để tổ chức code, không ảnh hưởng URL structure!

### ❓ Câu 5: Giải thích Modal pattern với Parallel Routes?

**Trả lời:**

**Parallel Routes + Intercepting Routes = URL-aware Modals!**

1. Tạo `@auth` slot → render modal content
2. `@auth/default.js` return null → inactive khi không cần
3. `@auth/(.)login/page.js` → intercept `/login` → show modal
4. `login/page.js` → full page (khi direct nav / refresh)
5. Close: `router.back()` hoặc `<Link href="/">`

**Lợi ích:**
- Modal shareable qua URL!
- Preserve context khi refresh!
- Back button close modal (không phải navigate back!)

### ❓ Câu 6: Static + Dynamic slots cùng level được không?

**Trả lời:**

**KHÔNG!** Nếu 1 slot là dynamic → **TẤT CẢ** slots ở cùng level PHẢI dynamic!

→ Slots combine với Page component để tạo final page
→ Không thể mix static + dynamic ở cùng route segment level!

---

> 🎯 **Tổng kết**: Guide phân tích TOÀN BỘ trang Parallel Routes:
> - **6 hình gốc** phân tích chi tiết (dashboard layout, file tree, default.js, conditional routes, tab groups, modals)
> - **2 sơ đồ tự vẽ** bổ sung (full architecture, soft vs hard nav)
> - **ParallelRouteEngine** tự viết 4 functions (slot resolver, nav simulator, conditional, URL resolver)
> - **6 câu hỏi luyện tập** với đáp án chi tiết
> - **Loading + Error UI**: mỗi slot có thể stream ĐỘC LẬP với loading.js/error.js RIÊNG!
