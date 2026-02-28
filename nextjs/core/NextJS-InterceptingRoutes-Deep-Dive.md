# Next.js Intercepting Routes — Deep Dive!

> **Chủ đề**: Intercepting Routes — Load Route Trong Layout Hiện Tại
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes
> **Hình ảnh trang gốc**: 4 diagrams (phân tích toàn bộ bên dưới!)

---

## Mục Lục

1. [§1. Tổng Quan — Intercepting Routes là gì?](#1)
2. [§2. Convention — Cú Pháp (.) (..) (..)(..) (...)](#2)
3. [§3. Quy Tắc Quan Trọng: Route Segments vs File-System!](#3)
4. [§4. Modals — Kết Hợp Với Parallel Routes](#4)
5. [§5. Phân Tích 4 Diagrams Từ Trang Docs!](#5)
6. [§6. Sơ Đồ Tự Vẽ — Luồng Hoạt Động](#6)
7. [§7. Tự Viết — InterceptingRoutesEngine](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — Intercepting Routes là gì?

```
  INTERCEPTING ROUTES — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                 │
  │  Intercepting Routes cho phép bạn LOAD một route từ          │
  │  PHẦN KHÁC của ứng dụng BÊN TRONG layout hiện tại!         │
  │                                                              │
  │  NGHĨA LÀ:                                                   │
  │  → User ở trang A                                           │
  │  → Click link đến trang B                                   │
  │  → THAY VÌ chuyển hoàn toàn sang trang B:                   │
  │    → Hiển thị NỘI DUNG trang B TRONG layout của A!         │
  │    → URL thay đổi sang /B (có thể share!)                  │
  │    → Context trang A KHÔNG bị mất!                          │
  │                                                              │
  │  VÍ DỤ CỤ THỂ (từ docs):                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  User đang ở /feed (xem danh sách ảnh)              │    │
  │  │       │                                              │    │
  │  │       │ Click vào 1 ảnh                              │    │
  │  │       ▼                                              │    │
  │  │  ┌───────────────────────────────────────────┐      │    │
  │  │  │ CÓ Intercepting Routes:                   │      │    │
  │  │  │ → URL = /photo/123 (shareable!)           │      │    │
  │  │  │ → Feed vẫn hiện ở background!             │      │    │
  │  │  │ → Ảnh hiện trong MODAL overlay!            │      │    │
  │  │  │ → User vẫn thấy feed context! ✅          │      │    │
  │  │  └───────────────────────────────────────────┘      │    │
  │  │                                                      │    │
  │  │  ┌───────────────────────────────────────────┐      │    │
  │  │  │ KHÔNG CÓ Intercepting Routes:              │      │    │
  │  │  │ → URL = /photo/123                         │      │    │
  │  │  │ → Chuyển hẳn sang trang photo!             │      │    │
  │  │  │ → Feed biến mất hoàn toàn! ❌             │      │    │
  │  │  │ → Mất context! Phải click back!            │      │    │
  │  │  └───────────────────────────────────────────┘      │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  HÀNH VI KHI TRỰC TIẾP VÀO URL:                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Gõ URL /photo/123 trực tiếp vào browser          │    │
  │  │ → Hoặc REFRESH trang khi đang ở /photo/123         │    │
  │  │ → KHÔNG có interception!                            │    │
  │  │ → Render FULL PAGE cho photo!                       │    │
  │  │ → Đây là "shareable URL" behavior!                  │    │
  │  │                                                      │    │
  │  │ PHÂN BIỆT:                                          │    │
  │  │ ┌─────────────────────┬──────────────────────┐      │    │
  │  │ │ Client-side nav     │ Direct/Refresh       │      │    │
  │  │ ├─────────────────────┼──────────────────────┤      │    │
  │  │ │ INTERCEPTED!        │ KHÔNG intercept!     │      │    │
  │  │ │ Modal overlay       │ Full page render     │      │    │
  │  │ │ Feed vẫn hiện       │ Chỉ photo page      │      │    │
  │  │ │ Soft navigation     │ Hard navigation      │      │    │
  │  │ └─────────────────────┴──────────────────────┘      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Convention — Cú Pháp (.) (..) (..)(..) (...)

```
  CONVENTION — CÚ PHÁP INTERCEPTING ROUTES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Tương tự ../ trong file system, nhưng cho ROUTE SEGMENTS!   │
  │                                                              │
  │  4 LOẠI MATCHER:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ① (.)      → Match segments CÙNG CẤP!              │    │
  │  │   Giống: ./  trong file system                       │    │
  │  │   Ví dụ: app/feed/(.)photo → intercept /photo      │    │
  │  │   từ /feed (cùng level: feed ↔ photo)              │    │
  │  │                                                      │    │
  │  │ ② (..)     → Match segments MỘT CẤP TRÊN!          │    │
  │  │   Giống: ../ trong file system                       │    │
  │  │   Ví dụ: app/feed/(..)photo → intercept /photo     │    │
  │  │   từ feed/ đi lên 1 cấp → app/ → photo            │    │
  │  │                                                      │    │
  │  │ ③ (..)(..) → Match segments HAI CẤP TRÊN!          │    │
  │  │   Giống: ../../ trong file system                    │    │
  │  │   Ví dụ: app/a/b/(..)(..)/photo → đi lên 2 cấp   │    │
  │  │                                                      │    │
  │  │ ④ (...)    → Match segments từ ROOT app/ directory! │    │
  │  │   Giống: /  (absolute path)                          │    │
  │  │   Ví dụ: app/a/b/c/(...)/photo → từ root app/     │    │
  │  │   Bất kể bao nhiêu levels deep!                     │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BẢNG SO SÁNH:                                                │
  │  ┌──────────┬────────────┬──────────────────────────────┐    │
  │  │ Matcher  │ Tương tự   │ Ý nghĩa                     │    │
  │  ├──────────┼────────────┼──────────────────────────────┤    │
  │  │ (.)      │ ./         │ Cùng cấp (same level)       │    │
  │  │ (..)     │ ../        │ Một cấp trên (one up)       │    │
  │  │ (..)(..) │ ../../     │ Hai cấp trên (two up)       │    │
  │  │ (...)    │ / (root)   │ Từ root app/ directory      │    │
  │  └──────────┴────────────┴──────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ CỤ THỂ TỪ DOCS:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ Muốn intercept /photo từ trong /feed:               │    │
  │  │ → Tạo (..)photo directory trong feed/                │    │
  │  │                                                      │    │
  │  │ app/                                                 │    │
  │  │ ├── feed/                                            │    │
  │  │ │   ├── layout.js                                    │    │
  │  │ │   └── (..)photo/       ← INTERCEPTING FOLDER!    │    │
  │  │ │       └── [id]/                                    │    │
  │  │ │           └── page.js  ← Modal version!           │    │
  │  │ ├── photo/                                           │    │
  │  │ │   └── [id]/                                        │    │
  │  │ │       └── page.js      ← Full page version!      │    │
  │  │ ├── layout.js                                        │    │
  │  │ └── page.js                                          │    │
  │  │                                                      │    │
  │  │ feed → (..)photo = đi LÊN 1 level → app/           │    │
  │  │                    → match photo/ ở cùng level!     │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Quy Tắc Quan Trọng: Route Segments vs File-System!

```
  ⚠️ QUY TẮC QUAN TRỌNG — ROUTE SEGMENTS ≠ FILE-SYSTEM:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  (..) convention dựa trên ROUTE SEGMENTS,                    │
  │  KHÔNG PHẢI file-system paths!                               │
  │                                                              │
  │  VÍ DỤ MINH HỌA:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ FILE SYSTEM:                ROUTE SEGMENTS:          │    │
  │  │                                                      │    │
  │  │ app/                        /                        │    │
  │  │ ├── feed/                   /feed                    │    │
  │  │ │   └── @modal/     ← SLOT, KHÔNG PHẢI SEGMENT!   │    │
  │  │ │       └── (..)photo/      (..)photo               │    │
  │  │ │           └── [id]/       [id]                     │    │
  │  │ │               └── page.js                          │    │
  │  │ └── photo/                  /photo                   │    │
  │  │     └── [id]/               [id]                     │    │
  │  │         └── page.js                                  │    │
  │  │                                                      │    │
  │  │ TÍNH LEVELS:                                         │    │
  │  │ ┌──────────────────────────────────────────────┐    │    │
  │  │ │ File-system: feed → @modal → (..)photo      │    │    │
  │  │ │   = 2 levels UP trong file-system!            │    │    │
  │  │ │                                               │    │    │
  │  │ │ Route segments: feed → (..)photo              │    │    │
  │  │ │   = CHỈ 1 level UP! (bỏ qua @modal!)        │    │    │
  │  │ │                                               │    │    │
  │  │ │ → @modal là SLOT, không phải route segment!  │    │    │
  │  │ │ → @slot folders bị IGNORE khi tính (..)!     │    │    │
  │  │ │ → Nên chỉ cần (..) thay vì (..)(..)!        │    │    │
  │  │ └──────────────────────────────────────────────┘    │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI THÍCH CHI TIẾT VÍ DỤ:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ app/feed/@modal/(..)photo/[id]/page.js               │    │
  │  │                                                      │    │
  │  │ File-system path:                                    │    │
  │  │   feed → @modal → (..)photo                         │    │
  │  │   Nếu đếm file-system: 2 levels (qua @modal)       │    │
  │  │                                                      │    │
  │  │ Route segments:                                      │    │
  │  │   feed → (..)photo                                   │    │
  │  │   @modal = parallel route SLOT (bỏ qua!)            │    │
  │  │   CHỈ 1 segment level khác biệt!                    │    │
  │  │   → Dùng (..) là đúng!                              │    │
  │  │                                                      │    │
  │  │ QUY TẮC:                                             │    │
  │  │ ┌──────────────────────────────────────────────┐    │    │
  │  │ │ @slot folders   → KHÔNG PHẢI route segments! │    │    │
  │  │ │ (group) folders → KHÔNG PHẢI route segments! │    │    │
  │  │ │ Route groups, parallel slots = organizational│    │    │
  │  │ │ → SKIP khi tính (..) levels!                 │    │    │
  │  │ └──────────────────────────────────────────────┘    │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Modals — Kết Hợp Với Parallel Routes!

```
  MODALS + INTERCEPTING ROUTES + PARALLEL ROUTES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT: Kết hợp Intercepting Routes + Parallel Routes        │
  │  để tạo MODALS có URL shareable!                             │
  │                                                              │
  │  CÁC VẤN ĐỀ MÀ PATTERN NÀY GIẢI QUYẾT:                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ✅ Modal content SHAREABLE qua URL!                  │    │
  │  │   → Copy URL /photo/123 → gửi bạn bè → họ thấy!  │    │
  │  │                                                      │    │
  │  │ ✅ PRESERVE context khi REFRESH!                     │    │
  │  │   → Refresh → không đóng modal → hiện full page!   │    │
  │  │   → Modal truyền thống: refresh = mất hết!         │    │
  │  │                                                      │    │
  │  │ ✅ ĐÓNG modal khi nhấn BACK!                        │    │
  │  │   → Browser Back = đóng modal, quay lại feed!      │    │
  │  │   → Không phải navigate về route trước đó!          │    │
  │  │                                                      │    │
  │  │ ✅ MỞ LẠI modal khi nhấn FORWARD!                   │    │
  │  │   → Browser Forward = mở lại modal!                 │    │
  │  │   → History navigation hoạt động hoàn hảo!          │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CẤU TRÚC CODE (từ Diagram 4 trong docs):                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ app/                                                 │    │
  │  │ ├── feed/                                            │    │
  │  │ │   ├── @modal/              ← PARALLEL ROUTE SLOT!│    │
  │  │ │   │   └── (..)photo/       ← INTERCEPTING!       │    │
  │  │ │   │       └── [id]/                                │    │
  │  │ │   │           └── page.js  ← PhotoModal component │    │
  │  │ │   ├── layout.js                                    │    │
  │  │ │   └── page.js              ← Feed page           │    │
  │  │ ├── photo/                                           │    │
  │  │ │   └── [id]/                                        │    │
  │  │ │       └── page.js          ← PhotoPage (full!)   │    │
  │  │ ├── layout.js                                        │    │
  │  │ └── page.js                                          │    │
  │  │                                                      │    │
  │  │ feed/@modal/(..)photo/[id]/page.js:                  │    │
  │  │ ┌──────────────────────────────────────────────┐    │    │
  │  │ │ export default function PhotoModal({ params })│   │    │
  │  │ │ {                                              │    │    │
  │  │ │   const photo = photos.find(                   │    │    │
  │  │ │     (p) => p.id === params.id                  │    │    │
  │  │ │   );                                           │    │    │
  │  │ │   return (                                     │    │    │
  │  │ │     <Modal>              ← WRAPPED IN MODAL!  │    │    │
  │  │ │       <Photo photo={photo} />                  │    │    │
  │  │ │     </Modal>                                   │    │    │
  │  │ │   );                                           │    │    │
  │  │ │ }                                              │    │    │
  │  │ └──────────────────────────────────────────────┘    │    │
  │  │                                                      │    │
  │  │ photo/[id]/page.js:                                  │    │
  │  │ ┌──────────────────────────────────────────────┐    │    │
  │  │ │ export default function PhotoPage({ params }) │   │    │
  │  │ │ {                                              │    │    │
  │  │ │   const photo = photos.find(                   │    │    │
  │  │ │     (p) => p.id === params.id                  │    │    │
  │  │ │   );                                           │    │    │
  │  │ │   return <Photo photo={photo} />;              │    │    │
  │  │ │ }                                              │    │    │
  │  │ │ // KHÔNG có <Modal> wrapper!                   │    │    │
  │  │ │ // → Full page render!                        │    │    │
  │  │ └──────────────────────────────────────────────┘    │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO CHỈ CẦN (..) MÀ KHÔNG PHẢI (..)(..)?               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ File-system: feed → @modal → (..)photo = 2 levels  │    │
  │  │ Route segs:  feed → (..)photo = 1 level!            │    │
  │  │ → @modal là SLOT → SKIP! → Chỉ cần (..)!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁC USE CASES KHÁC:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ • Login modal ở top navbar + dedicated /login page  │    │
  │  │ • Shopping cart modal ở sidebar                     │    │
  │  │ • Preview modal cho items trong list                │    │
  │  │ • Share dialog overlay                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Phân Tích 4 Diagrams Từ Trang Docs!

### 📊 Diagram 1: Intercepting Routes — Modal Overlay

```
  PHÂN TÍCH DIAGRAM 1: "Intercepting Routes — Modal"
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Sơ đồ gồm 2 CỬA SỔ BROWSER cạnh nhau + MŨI TÊN:          │
  │                                                              │
  │  CỬA SỔ BÊN TRÁI:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ● ● ●  ┌─ acme.com/feed ────────────────────┐      │    │
  │  │         │                                     │      │    │
  │  │         │  ┌─────┐  ┌────────────────────┐   │      │    │
  │  │         │  │ 🏔️  │  │ ═══════════════    │   │      │    │
  │  │         │  └─────┘  │ ═══════════════    │   │      │    │
  │  │         │           │ [Card.tsx] ███████  │   │      │    │
  │  │         │           └────────────────────┘   │      │    │
  │  │         │  ┌─────┐  ┌────────────────────┐   │      │    │
  │  │         │  │ 🏔️  │  │ ═════════════      │   │      │    │
  │  │         │  └─────┘  └────────────────────┘   │      │    │
  │  │         └─────────────────────────────────────┘      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  → Hiển thị feed bình thường tại acme.com/feed               │
  │  → Có nhiều cards, mỗi card có ảnh thu nhỏ + text           │
  │  → Card.tsx label ở dưới = component card                    │
  │  → User sẽ click vào 1 card ảnh...                           │
  │                                                              │
  │              ────→ (mũi tên sang phải)                       │
  │                                                              │
  │  CỬA SỔ BÊN PHẢI:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ● ● ●  ┌─ acme.com/photo/123 ───────────────┐      │    │
  │  │         │                                     │      │    │
  │  │         │  ┌───── MODAL OVERLAY ──────────┐  │      │    │
  │  │         │  │                               │  │      │    │
  │  │         │  │      🏔️ (ảnh lớn)             │  │      │    │
  │  │         │  │                               │  │      │    │
  │  │         │  └───────────────────────────────┘  │      │    │
  │  │         │                                     │      │    │
  │  │         │  (feed content mờ ở background!)    │      │    │
  │  │         └─────────────────────────────────────┘      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  → URL ĐÃ THAY ĐỔI sang acme.com/photo/123!                │
  │  → Feed content VẪN HIỆN ở background (dimmed!)              │
  │  → Ảnh hiển thị trong MODAL overlay (centered!)              │
  │  → User VẪN THẤY CONTEXT feed!                               │
  │  → Đây là INTERCEPTION behavior!                              │
  │                                                              │
  │  Ý NGHĨA:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Client-side navigation → INTERCEPTED!            │    │
  │  │ → URL shareable (/photo/123) ✅                     │    │
  │  │ → Feed context preserved ✅                         │    │
  │  │ → Photo hiện trong modal ✅                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 📊 Diagram 2: Direct Navigation — Full Page

```
  PHÂN TÍCH DIAGRAM 2: "Direct Navigation — Full Page"
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Sơ đồ gồm 2 PHẦN: browser nhỏ (trái) + browser lớn:       │
  │                                                              │
  │  BROWSER NHỎ (BÊN TRÁI DƯỚI):                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ● ● ●  ┌─ acme.com/photo/123 ──────┐               │    │
  │  │         │  (direct URL access)       │               │    │
  │  │         └────────────────────────────┘               │    │
  │  │                                                      │    │
  │  │     ────→ (mũi tên sang phải)                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BROWSER LỚN (BÊN PHẢI TRÊN):                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ● ● ●  ┌─ acme.com ────────────────────────┐       │    │
  │  │         │                                     │       │    │
  │  │         │     🏔️ (ảnh lớn, FULL PAGE!)         │       │    │
  │  │         │                                     │       │    │
  │  │         │  ═══════════════════════════════    │       │    │
  │  │         │  ═══════════════════════════════    │       │    │
  │  │         │  ═══════════════════════════════    │       │    │
  │  │         │                                     │       │    │
  │  │         └─────────────────────────────────────┘       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  → User GÕ URL trực tiếp hoặc REFRESH trang!                │
  │  → KHÔNG CÓ interception!                                   │
  │  → Photo render FULL PAGE (không có modal!)                  │
  │  → KHÔNG CÓ feed background!                                │
  │  → Layout riêng cho photo page!                              │
  │                                                              │
  │  Ý NGHĨA:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Direct navigation/Refresh → NO interception!     │    │
  │  │ → Full page render (photo/[id]/page.js)             │    │
  │  │ → SAME URL works both ways!                         │    │
  │  │   Client nav → modal                                │    │
  │  │   Direct URL → full page                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 📊 Diagram 3: Convention File Tree

```
  PHÂN TÍCH DIAGRAM 3: "Convention — File Tree"
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Sơ đồ hiển thị FILE TREE dọc + blue arrow:                  │
  │                                                              │
  │  ┌─────────────────────────────────────────────────────┐     │
  │  │ 📁 feed                                             │     │
  │  │ ├── 📄 layout.js                                    │     │
  │  │ └── 📁 (..)photo     ● ← BLUE DOT (intercept!)    │     │
  │  │     └── 📁 [id]                                     │     │
  │  │         └── 📄 page.js                              │     │
  │  │                                                     │     │
  │  │ 📁 photo              ● ← BLUE DOT (target!)      │     │
  │  │ └── 📁 [id]                                         │     │
  │  │     └── 📄 page.js                                  │     │
  │  │                                                     │     │
  │  │ 📄 layout.js           (root layout)                │     │
  │  │ 📄 page.js             (root page)                  │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  │  BLUE ARROW:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Mũi tên XANH kết nối (..)photo → photo           │    │
  │  │ → Cho thấy (..)photo INTERCEPTS route /photo        │    │
  │  │ → feed/ chứa (..)photo = đi 1 level UP             │    │
  │  │ → Match photo/ ở cùng cấp với feed/                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BLUE DOTS (●):                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → (..)photo có blue dot = đây là intercepting folder│    │
  │  │ → photo có blue dot = đây là target route           │    │
  │  │ → 2 folders cùng serve /photo/[id] nhưng:          │    │
  │  │   (..)photo → modal version (từ feed)              │    │
  │  │   photo → full page version (direct access)        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 📊 Diagram 4: Modals — File Structure + Code Mapping

```
  PHÂN TÍCH DIAGRAM 4: "Modals Implementation"
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Sơ đồ phức tạp nhất! Gồm 3 PHẦN liên kết:                  │
  │                                                              │
  │  PHẦN 1 — FILE TREE (bên trái):                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 📁 ...                                              │    │
  │  │ ├── 📁 feed                                         │    │
  │  │ │   ├── 📁 @modal          ← PARALLEL SLOT!       │    │
  │  │ │   │   └── 📁 (..)photo  ● ← INTERCEPT + DOT!   │    │
  │  │ │   │       └── 📁 [id]                             │    │
  │  │ │   │           └── 📄 page.js ─────┐               │    │
  │  │ │   └── ...                          │               │    │
  │  │ ├── 📁 photo              ● ← TARGET + DOT!       │    │
  │  │ │   └── 📁 [id]                     │               │    │
  │  │ │       └── 📄 page.js ──────────────┼───┐           │    │
  │  │ └── ...                              │   │           │    │
  │  └──────────────────────────────────────┼───┼──────────┘    │
  │                                          │   │               │
  │  PHẦN 2 — CODE SNIPPET TOP (từ (..)photo):│   │              │
  │  ┌──────────────────────────────────────┘   │               │
  │  │ ┌──────────────────────────────────────────────┐          │
  │  │ │ feed/@modal/(..)photo/[id]/page.js           │          │
  │  │ │                                              │          │
  │  │ │ export default function PhotoModal({params}) {│         │
  │  │ │   const photo = photos.find(                  │          │
  │  │ │     (p) => p.id === params.id                 │          │
  │  │ │   );                                          │          │
  │  │ │   return (                                    │          │
  │  │ │     <Modal>                ← MODAL WRAPPER!  │          │
  │  │ │       <Photo photo={photo} />                 │          │
  │  │ │     </Modal>                                  │          │
  │  │ │   );                                          │          │
  │  │ │ }                                              │          │
  │  │ └──────────────────────────────────────────────┘          │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHẦN 3 — CODE SNIPPET BOTTOM (từ photo):                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ┌──────────────────────────────────────────────┐     │    │
  │  │ │ photo/[id]/page.js                           │     │    │
  │  │ │                                              │     │    │
  │  │ │ export default function PhotoPage({ params }){│    │    │
  │  │ │   const photo = photos.find(                  │     │    │
  │  │ │     (p) => p.id === params.id                 │     │    │
  │  │ │   );                                          │     │    │
  │  │ │   return <Photo photo={photo} />;             │     │    │
  │  │ │ }                                              │     │    │
  │  │ │ // KHÔNG CÓ <Modal> wrapper!                  │     │    │
  │  │ └──────────────────────────────────────────────┘     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DASHED LINES (đường nét đứt):                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Nối (..)photo/[id]/page.js → Code snippet TOP    │    │
  │  │ → Nối photo/[id]/page.js → Code snippet BOTTOM     │    │
  │  │ → Cho thấy CÙNG route /photo/[id] nhưng:           │    │
  │  │   TOP: có <Modal> wrapper (modal version)           │    │
  │  │   BOTTOM: không có wrapper (full page version)      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KEY INSIGHT TỪ DIAGRAM:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → @modal = PARALLEL ROUTE slot (prop cho layout!)   │    │
  │  │ → (..)photo = INTERCEPT target route (1 level up)   │    │
  │  │ → CÙNG logic (find photo by id) nhưng KHÁC UI!    │    │
  │  │ → Modal: <Modal><Photo /></Modal>                   │    │
  │  │ → Full page: <Photo /> only!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Sơ Đồ Tự Vẽ — Luồng Hoạt Động!

### Sơ Đồ 1: Luồng Quyết Định — Intercept hay Full Page?

```
  LUỒNG QUYẾT ĐỊNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  User truy cập /photo/123                                    │
  │       │                                                      │
  │       ▼                                                      │
  │  ┌──────────────────────┐                                    │
  │  │ Cách truy cập?       │                                    │
  │  └──────────┬───────────┘                                    │
  │             │                                                │
  │    ┌────────┴────────┐                                       │
  │    ▼                 ▼                                       │
  │  ┌──────────┐   ┌──────────────┐                             │
  │  │ Client-  │   │ Direct URL   │                             │
  │  │ side nav │   │ / Refresh    │                             │
  │  │ (Link,   │   │ / Shareable  │                             │
  │  │ router)  │   │ URL          │                             │
  │  └────┬─────┘   └──────┬───────┘                             │
  │       │                │                                     │
  │       ▼                ▼                                     │
  │  ┌──────────┐   ┌──────────────┐                             │
  │  │ CÓ (..)  │   │ Route        │                             │
  │  │ folder?  │   │ KHÔNG bị     │                             │
  │  └────┬─────┘   │ intercept!   │                             │
  │       │         └──────┬───────┘                             │
  │  ┌────┴────┐          │                                      │
  │  ▼         ▼          ▼                                      │
  │ YES       NO    ┌──────────────┐                             │
  │  │         │    │ photo/[id]/  │                             │
  │  │         │    │ page.js      │                             │
  │  │         │    │ FULL PAGE!   │                             │
  │  │         │    └──────────────┘                             │
  │  ▼         ▼                                                 │
  │ ┌──────┐ ┌──────────────┐                                    │
  │ │MODAL!│ │ Normal nav   │                                    │
  │ │(..)  │ │ (full page)  │                                    │
  │ │photo/│ └──────────────┘                                    │
  │ │page  │                                                     │
  │ └──────┘                                                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: Matcher Levels Visualization

```
  MATCHER LEVELS — TRỰC QUAN HÓA:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  app/ (root)  ─── level 0                                    │
  │  ├── users/   ─── level 1                                    │
  │  │   └── profile/ ─── level 2                                │
  │  │       └── settings/ ─── level 3                           │
  │  │           └── ??? ─── muốn intercept từ đây!             │
  │  ├── photos/  ─── level 1                                    │
  │  └── admin/   ─── level 1                                    │
  │      └── dashboard/ ─── level 2                              │
  │                                                              │
  │  TỪ settings/ (level 3) muốn intercept:                      │
  │                                                              │
  │  (.)target   → intercept target CÙNG level 3                │
  │               → app/users/profile/settings/(.)target        │
  │                                                              │
  │  (..)target  → ĐI LÊN 1 level → level 2 (profile)         │
  │               → app/users/profile/settings/(..)target       │
  │                                                              │
  │  (..)(..)target → ĐI LÊN 2 levels → level 1 (users)       │
  │               → app/users/profile/settings/(..)(..)/target  │
  │                                                              │
  │  (...)target → ĐI LÊN ROOT → level 0 (app/)               │
  │               → app/users/profile/settings/(...)/target     │
  │                                                              │
  │  MŨI TÊN:                                                    │
  │  settings ──(.)──→ same level                                │
  │  settings ──(..)──→ profile (1 up)                           │
  │  settings ──(..)(..)──→ users (2 up)                         │
  │  settings ──(...)──→ app/ root (absolute)                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 3: @slot Không Phải Segment — Visual

```
  @SLOT KHÔNG PHẢI ROUTE SEGMENT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FILE SYSTEM:                    ROUTE SEGMENTS:             │
  │                                                              │
  │  app/             ←────────→    /                            │
  │  ├── feed/        ←────────→    /feed        (segment!)     │
  │  │   ├── @modal/  ←── ✖️ ──→    (SKIP!)       (slot!)      │
  │  │   │   └── (..)photo/         (chỉ 1 (..) vì            │
  │  │   │       └── [id]/            @modal bị skip!)          │
  │  │   │           └── page.js                                 │
  │  │   └── page.js                                             │
  │  └── photo/       ←────────→    /photo       (segment!)     │
  │      └── [id]/    ←────────→    /photo/[id]                  │
  │          └── page.js                                         │
  │                                                              │
  │  ĐẾM (..) LEVELS:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Từ feed/@modal/(..)photo:                            │    │
  │  │                                                      │    │
  │  │ ❌ FILE-SYSTEM counting:                             │    │
  │  │   (..)photo → lên @modal → lên feed → 2 levels    │    │
  │  │   → Sai! Phải dùng (..)(..) nếu tính thế!         │    │
  │  │                                                      │    │
  │  │ ✅ ROUTE-SEGMENT counting:                           │    │
  │  │   (..)photo → @modal bị skip → lên feed → 1 level │    │
  │  │   → Đúng! Chỉ cần (..)!                            │    │
  │  │                                                      │    │
  │  │ CÁC FOLDER BỊ SKIP:                                 │    │
  │  │ • @modal, @sidebar, @header... (parallel slots)     │    │
  │  │ • (auth), (marketing)... (route groups)             │    │
  │  │ • _private... (private folders)                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — InterceptingRoutesEngine!

```javascript
/**
 * InterceptingRoutesEngine — Mô phỏng Intercepting Routes!
 * Tự viết bằng tay, KHÔNG dùng thư viện nào!
 * Covers: matcher resolution, interception check,
 *         modal vs full page routing, @slot skipping
 */
var InterceptingRoutesEngine = (function () {

  // ═══════════════════════════════════
  // 1. ROUTE SEGMENT PARSER
  // ═══════════════════════════════════
  function parseRouteSegments(filePath) {
    // Tách path thành segments, BỎ QUA @slot và (group) folders!
    var parts = filePath.split('/').filter(function (p) {
      return p !== '' && p !== 'app';
    });

    var segments = [];
    var skipped = [];

    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part.charAt(0) === '@') {
        // @slot → KHÔNG phải route segment!
        skipped.push({ folder: part, reason: 'Parallel Route slot' });
      } else if (part.charAt(0) === '(' && part.charAt(part.length - 1) === ')'
                 && !part.match(/^\(\.*\)/)) {
        // (group) → route group, không phải segment!
        skipped.push({ folder: part, reason: 'Route group' });
      } else if (part.match(/^\(\.*\)/)) {
        // (..) hoặc (.) hoặc (...) → matcher, skip from segments
        skipped.push({ folder: part, reason: 'Intercepting matcher' });
      } else {
        segments.push(part);
      }
    }

    return {
      originalPath: filePath,
      routeSegments: segments,
      skippedFolders: skipped,
      segmentCount: segments.length
    };
  }

  // ═══════════════════════════════════
  // 2. MATCHER RESOLVER
  // ═══════════════════════════════════
  function resolveMatcher(matcher, currentSegments, targetRoute) {
    var levels;

    switch (matcher) {
      case '(.)':
        levels = 0;  // Same level
        break;
      case '(..)':
        levels = 1;  // One level up
        break;
      case '(..)(..)':
        levels = 2;  // Two levels up
        break;
      case '(...)':
        levels = 'root';  // From root app/
        break;
      default:
        return { error: 'Matcher không hợp lệ: ' + matcher
          + '. Phải là (.), (..), (..)(..), hoặc (...)' };
    }

    var resolvedLevel;
    if (levels === 'root') {
      resolvedLevel = 0;
    } else {
      resolvedLevel = currentSegments.length - levels;
    }

    return {
      matcher: matcher,
      fromSegments: currentSegments,
      currentLevel: currentSegments.length,
      goUpLevels: levels,
      resolvedLevel: resolvedLevel,
      interceptsRoute: targetRoute,
      explanation: levels === 'root'
        ? 'Đi đến ROOT app/ directory! Intercept ' + targetRoute + ' từ bất kỳ đâu!'
        : 'Đi lên ' + levels + ' level(s) từ level ' + currentSegments.length
          + ' → level ' + resolvedLevel + '. Intercept ' + targetRoute + '!'
    };
  }

  // ═══════════════════════════════════
  // 3. NAVIGATION DECISION ENGINE
  // ═══════════════════════════════════
  function decideNavigation(navigationType, hasInterceptor) {
    if (navigationType === 'client-side') {
      if (hasInterceptor) {
        return {
          result: 'INTERCEPTED!',
          renderType: 'MODAL',
          file: 'feed/@modal/(..)photo/[id]/page.js',
          uiState: 'Feed visible in background + photo in modal overlay',
          urlChange: 'YES — URL changes to /photo/[id]',
          contextPreserved: true
        };
      }
      return {
        result: 'Normal navigation',
        renderType: 'FULL PAGE',
        file: 'photo/[id]/page.js',
        uiState: 'Full page photo view',
        urlChange: 'YES — URL changes to /photo/[id]',
        contextPreserved: false
      };
    }

    // Direct URL or refresh
    return {
      result: 'Direct access — NO interception!',
      renderType: 'FULL PAGE',
      file: 'photo/[id]/page.js',
      uiState: 'Full page photo view (no feed background)',
      urlChange: 'N/A — URL accessed directly',
      contextPreserved: false,
      reason: 'Direct URL/Refresh → luôn render full page! Shareable!'
    };
  }

  // ═══════════════════════════════════
  // 4. MODAL BENEFITS CHECKER
  // ═══════════════════════════════════
  function checkModalBenefits() {
    return {
      problems_solved: [
        {
          problem: 'Modal content KHÔNG shareable',
          solution: 'URL thay đổi → có thể share /photo/123!',
          status: 'SOLVED ✅'
        },
        {
          problem: 'Refresh = modal đóng mất hết',
          solution: 'Refresh → full page render (không mất content!)!',
          status: 'SOLVED ✅'
        },
        {
          problem: 'Back button = đi về route trước (không phải đóng modal)',
          solution: 'Back = đóng modal, quay lại feed!',
          status: 'SOLVED ✅'
        },
        {
          problem: 'Forward button không mở lại modal',
          solution: 'Forward = mở lại modal!',
          status: 'SOLVED ✅'
        }
      ]
    };
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  INTERCEPTING ROUTES ENGINE — DEMO        ║');
    console.log('╚══════════════════════════════════════════╝');

    // 1. Parse segments
    console.log('\n─── 1. PARSE ROUTE SEGMENTS ───');
    console.log(JSON.stringify(
      parseRouteSegments('app/feed/@modal/(..)photo/[id]'), null, 2));
    console.log(JSON.stringify(
      parseRouteSegments('app/photo/[id]'), null, 2));

    // 2. Resolve matchers
    console.log('\n─── 2. RESOLVE MATCHERS ───');
    console.log('(.): ', JSON.stringify(
      resolveMatcher('(.)', ['feed'], 'photo'), null, 2));
    console.log('(..): ', JSON.stringify(
      resolveMatcher('(..)', ['feed'], 'photo'), null, 2));
    console.log('(..)(..): ', JSON.stringify(
      resolveMatcher('(..)(..)','a/b'.split('/'), 'photo'),null,2));
    console.log('(...): ', JSON.stringify(
      resolveMatcher('(...)', ['a', 'b', 'c'], 'photo'), null, 2));

    // 3. Navigation decisions
    console.log('\n─── 3. NAVIGATION DECISIONS ───');
    console.log('Client nav + interceptor:',
      JSON.stringify(decideNavigation('client-side', true), null, 2));
    console.log('Client nav, no interceptor:',
      JSON.stringify(decideNavigation('client-side', false), null, 2));
    console.log('Direct URL:',
      JSON.stringify(decideNavigation('direct', true), null, 2));

    // 4. Modal benefits
    console.log('\n─── 4. MODAL BENEFITS ───');
    console.log(JSON.stringify(checkModalBenefits(), null, 2));

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                         ║');
    console.log('╚══════════════════════════════════════════╝');
  }

  return {
    parseRouteSegments: parseRouteSegments,
    resolveMatcher: resolveMatcher,
    decideNavigation: decideNavigation,
    checkModalBenefits: checkModalBenefits,
    demo: demo
  };
})();

// Chạy: InterceptingRoutesEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

### ❓ Câu 1: Intercepting Routes là gì và khi nào dùng?

**Trả lời:**

Intercepting Routes cho phép load route từ phần khác của app **BÊN TRONG layout hiện tại**, thay vì chuyển trang hoàn toàn.

**Khi dùng:** Muốn hiển thị content mà **không mất context hiện tại** — ví dụ click ảnh trong feed → hiện modal overlay + URL thay đổi (shareable!).

```
  Client-side nav → INTERCEPTED → Modal + feed background
  Direct URL      → KHÔNG intercept → Full page render
```

### ❓ Câu 2: 4 loại matcher là gì? Cho ví dụ mỗi loại!

**Trả lời:**

| Matcher | Tương tự | Ý nghĩa | Ví dụ từ level 3 |
|---|---|---|---|
| `(.)` | `./` | Cùng level | `settings/(.)target` → target cùng level |
| `(..)` | `../` | 1 level lên | `settings/(..)target` → profile level |
| `(..)(..)` | `../../` | 2 levels lên | `settings/(..)(..)/target` → users level |
| `(...)` | `/` (root) | Root app/ | `settings/(...)/target` → app/ root |

### ❓ Câu 3: Tại sao dùng (..) mà không phải (..)(..) khi có @modal?

**Trả lời:**

Vì `(..)` convention dựa trên **route segments**, KHÔNG PHẢI file-system!

- `@modal` là parallel route **SLOT** → NOT a segment → **SKIP!**
- File-system: `feed → @modal → (..)photo` = 2 file levels
- Route segments: `feed → (..)photo` = **1 segment level**
- → Chỉ cần `(..)` là đúng!

### ❓ Câu 4: Khi user refresh trang /photo/123 thì chuyện gì xảy ra?

**Trả lời:**

**KHÔNG có interception!** Photo render **full page**.

- Intercepting Routes CHỈ hoạt động với **client-side navigation** (Link, router.push)
- Direct URL / Refresh / Shareable URL → render `photo/[id]/page.js` (full page, không modal)
- Đây là **shareable URL behavior** — cùng URL nhưng render khác tùy cách truy cập!

### ❓ Câu 5: Intercepting Routes + Parallel Routes giải quyết mấy vấn đề gì của modal truyền thống?

**Trả lời:**

4 vấn đề được giải quyết:

| # | Vấn đề modal truyền thống | Giải pháp |
|---|---|---|
| 1 | Modal content **không shareable** | URL thay đổi → share được! |
| 2 | **Refresh** = modal đóng | Refresh → full page render (content vẫn có!) |
| 3 | **Back** button = đi về route trước | Back = **đóng modal**, quay lại feed! |
| 4 | **Forward** button không mở lại | Forward = **mở lại modal**! |

---

> 🎯 **Tổng kết**: Guide phân tích TOÀN BỘ trang `Intercepting Routes`:
> - **4 diagrams** từ trang gốc — phân tích chi tiết từng element, arrow, label, blue dot
> - **3 sơ đồ tự vẽ**: decision flow, matcher levels, @slot skip visual
> - **InterceptingRoutesEngine** tự viết với 4 functions mô phỏng
> - **5 câu hỏi luyện tập** với đáp án chi tiết
