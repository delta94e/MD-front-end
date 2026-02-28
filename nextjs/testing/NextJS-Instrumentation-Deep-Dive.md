# Next.js instrumentation.js — Deep Dive!

> **Chủ đề**: `instrumentation.js` — Server-Side Observability
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
> **Hình ảnh trang gốc**: 0 (trang chỉ có text + code blocks, KHÔNG có diagram/hình ảnh)

---

## Mục Lục

1. [§1. Tổng Quan — instrumentation.js là gì?](#1)
2. [§2. Vị Trí Đặt File](#2)
3. [§3. register() — Khởi Tạo Server](#3)
4. [§4. onRequestError() — Theo Dõi Lỗi Server](#4)
5. [§5. Phân Tích Chi Tiết Parameters của onRequestError](#5)
6. [§6. Specifying the Runtime — Chọn Runtime](#6)
7. [§7. Sơ Đồ Tổng Hợp — Luồng Hoạt Động](#7)
8. [§8. Version History — Lịch Sử Phát Triển](#8)
9. [§9. Tự Viết — InstrumentationEngine](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. Tổng Quan — instrumentation.js là gì?

```
  instrumentation.js — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊnh NGHĨA:                                                 │
  │  File instrumentation.js (hoặc .ts) được sử dụng để         │
  │  TÍCH HỢP các công cụ theo dõi (observability tools)        │
  │  vào ứng dụng Next.js của bạn!                               │
  │                                                              │
  │  MỤC ĐÍCH (3 mục tiêu chính):                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ① THEO DÕI HIỆU SUẤT (Performance Tracking)        │    │
  │  │   → Đo thời gian render của mỗi request            │    │
  │  │   → Phát hiện bottlenecks trong production          │    │
  │  │   → Ví dụ: OpenTelemetry, Datadog, New Relic       │    │
  │  │                                                      │    │
  │  │ ② GIÁM SÁT HÀNH VI (Behavior Monitoring)           │    │
  │  │   → Theo dõi patterns sử dụng server               │    │
  │  │   → Biết routes nào được gọi nhiều nhất             │    │
  │  │   → Phát hiện bất thường (anomaly detection)        │    │
  │  │                                                      │    │
  │  │ ③ GỠ LỖI PRODUCTION (Debug Production Issues)      │    │
  │  │   → Track lỗi server → gửi đến Sentry/PagerDuty   │    │
  │  │   → error.digest giúp match log server ↔ client    │    │
  │  │   → Biết lỗi xảy ra ở đâu, route nào, context gì  │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  QUAN TRỌNG: File này chạy trên SERVER ONLY!                 │
  │  (Client-side monitoring → dùng instrumentation-client.js)  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Vị Trí Đặt File

```
  VỊ TRÍ ĐẶT FILE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CÁCH 1: Đặt ở ROOT dự án (phổ biến nhất!)                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ my-next-app/                                         │    │
  │  │ ├── app/                                             │    │
  │  │ │   ├── layout.js                                    │    │
  │  │ │   └── page.js                                      │    │
  │  │ ├── instrumentation.js  ← ĐÂY! Cùng cấp với app/  │    │
  │  │ ├── next.config.js                                   │    │
  │  │ └── package.json                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH 2: Đặt trong src/ folder                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ my-next-app/                                         │    │
  │  │ ├── src/                                             │    │
  │  │ │   ├── app/                                         │    │
  │  │ │   │   ├── layout.js                                │    │
  │  │ │   │   └── page.js                                  │    │
  │  │ │   └── instrumentation.js  ← ĐÂY! Trong src/     │    │
  │  │ ├── next.config.js                                   │    │
  │  │ └── package.json                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  QUY TẮC: Đặt CÙNG CẤP với folder app/ hoặc pages/!       │
  │  Extension: .js hoặc .ts đều được!                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. register() — Khởi Tạo Server!

```
  register() — HÀM KHỞI TẠO SERVER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  register() là gì?                                            │
  │  → Hàm được export từ instrumentation.js                    │
  │  → Optional (không bắt buộc export!)                        │
  │  → Được gọi DUY NHẤT MỘT LẦN khi server instance khởi tạo │
  │  → CÓ THỂ là async function!                                │
  │                                                              │
  │  THỜI ĐIỂM THỰC THI:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ┌─────────┐    ┌──────────────┐    ┌────────────┐   │    │
  │  │ │ Server  │──→│ register()   │──→│ Server    │   │    │
  │  │ │ boots   │    │ RUNS HERE!   │    │ READY!    │   │    │
  │  │ └─────────┘    └──────────────┘    └────────────┘   │    │
  │  │                      │                               │    │
  │  │                      ▼                               │    │
  │  │              PHẢI hoàn thành                          │    │
  │  │              TRƯỚC KHI server                         │    │
  │  │              xử lý request nào!                       │    │
  │  │                                                      │    │
  │  │ ⚠️ Nếu register() chưa xong = server chưa sẵn sàng!│   │
  │  │ ⚠️ Hỗ trợ async → có thể await trong register()!   │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ SỬ DỤNG:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ // instrumentation.ts                                │    │
  │  │ import { registerOTel } from '@vercel/otel'          │    │
  │  │                                                      │    │
  │  │ export function register() {                         │    │
  │  │   registerOTel('next-app')                           │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH TỪNG DÒNG:                                │    │
  │  │ ① import { registerOTel } → nhập hàm setup từ      │    │
  │  │   thư viện @vercel/otel (OpenTelemetry wrapper)     │    │
  │  │ ② export function register() → export hàm mà       │    │
  │  │   Next.js sẽ tự động gọi khi server start          │    │
  │  │ ③ registerOTel('next-app') → khởi tạo              │    │
  │  │   OpenTelemetry với tên service là 'next-app'       │    │
  │  │   → Từ đây mọi request đều được trace!             │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁC TOOL CÓ THỂ SETUP TRONG register():                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ • OpenTelemetry (tracing, metrics, logs)            │    │
  │  │ • Sentry (error tracking + performance)             │    │
  │  │ • Datadog APM (application performance monitoring)  │    │
  │  │ • New Relic (full-stack observability)               │    │
  │  │ • Custom loggers (Winston, Pino, etc.)              │    │
  │  │ • Database connection pools                         │    │
  │  │ • Cache warming                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. onRequestError() — Theo Dõi Lỗi Server!

```
  onRequestError() — THEO DÕI LỖI SERVER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  onRequestError() là gì?                                      │
  │  → Hàm export tùy chọn (optional) từ instrumentation.js     │
  │  → Được gọi KHI CÓ LỖI trên server!                        │
  │  → Gửi thông tin lỗi đến observability provider!             │
  │  → Có thể là async function!                                │
  │                                                              │
  │  LUỒNG KHI LỖI XẢY RA:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Request đến server                                  │    │
  │  │       │                                              │    │
  │  │       ▼                                              │    │
  │  │  ┌─────────────────┐                                 │    │
  │  │  │ Render / Action  │                                │    │
  │  │  │ Route Handler    │                                │    │
  │  │  └────────┬────────┘                                 │    │
  │  │           │ LỖI!                                     │    │
  │  │           ▼                                          │    │
  │  │  ┌─────────────────────┐                             │    │
  │  │  │ Next.js BẮT lỗi!   │                             │    │
  │  │  └────────┬────────────┘                             │    │
  │  │           │                                          │    │
  │  │           ▼                                          │    │
  │  │  ┌─────────────────────────────────┐                 │    │
  │  │  │ onRequestError(error, req, ctx) │ ← GỌI ĐÂY!   │    │
  │  │  └────────┬────────────────────────┘                 │    │
  │  │           │                                          │    │
  │  │           ▼                                          │    │
  │  │  ┌─────────────────────────────────┐                 │    │
  │  │  │ Gửi đến Sentry/Datadog/Custom  │                 │    │
  │  │  └─────────────────────────────────┘                 │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LƯU Ý QUAN TRỌNG:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ⚠️ Nếu có async tasks → PHẢI await chúng!          │    │
  │  │   onRequestError được trigger KHI Next.js server    │    │
  │  │   bắt được lỗi. Nếu không await → lỗi có thể      │    │
  │  │   bị bỏ qua (promise unhandled!)                    │    │
  │  │                                                      │    │
  │  │ ⚠️ Error instance CÓ THỂ không phải error gốc!    │    │
  │  │   → Nếu lỗi xảy ra trong Server Components,        │    │
  │  │     React có thể XỬLÝ (process) error trước!       │    │
  │  │   → Dùng error.digest để IDENTIFY lỗi thật!        │    │
  │  │   → digest = unique ID match với server logs!       │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CODE MẪU (gửi lỗi đến API endpoint):                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ import { type Instrumentation } from 'next'          │    │
  │  │                                                      │    │
  │  │ export const onRequestError:                         │    │
  │  │   Instrumentation.onRequestError = async (           │    │
  │  │     err,      // Error object + digest              │    │
  │  │     request,  // Request info (path, method, headers)│   │
  │  │     context   // Context (routerKind, routePath...)  │    │
  │  │ ) => {                                               │    │
  │  │   await fetch('https://my-api/report-error', {       │    │
  │  │     method: 'POST',                                  │    │
  │  │     body: JSON.stringify({                           │    │
  │  │       message: err.message,                          │    │
  │  │       request,                                       │    │
  │  │       context,                                       │    │
  │  │     }),                                              │    │
  │  │     headers: {                                       │    │
  │  │       'Content-Type': 'application/json',            │    │
  │  │     },                                               │    │
  │  │   })                                                 │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH TỪNG PHẦN:                                │    │
  │  │ ① import Instrumentation type → để TypeScript       │    │
  │  │   biết chính xác kiểu dữ liệu của hàm              │    │
  │  │ ② async (...) => → hàm async vì cần await fetch    │    │
  │  │ ③ err.message → tin nhắn mô tả lỗi                 │    │
  │  │ ④ request → thông tin request gây lỗi              │    │
  │  │ ⑤ context → ngữ cảnh: App/Pages Router, route...  │    │
  │  │ ⑥ fetch POST → gửi tất cả đến monitoring API      │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Phân Tích Chi Tiết Parameters của onRequestError

```
  3 PARAMETERS CỦA onRequestError():
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PARAMETER 1: error                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Type: { digest: string } & Error                     │    │
  │  │                                                      │    │
  │  │ ┌──────────────┬──────────────────────────────────┐  │    │
  │  │ │ Property     │ Mô tả                            │  │    │
  │  │ ├──────────────┼──────────────────────────────────┤  │    │
  │  │ │ .message     │ Tin nhắn mô tả lỗi              │  │    │
  │  │ │              │ "Cannot read property of null"   │  │    │
  │  │ │              │                                  │  │    │
  │  │ │ .digest      │ ID duy nhất của lỗi!             │  │    │
  │  │ │              │ → Match với server-side logs!    │  │    │
  │  │ │              │ → Khi React xử lý error trong   │  │    │
  │  │ │              │   Server Components, error gốc   │  │    │
  │  │ │              │   có thể bị thay đổi. Dùng       │  │    │
  │  │ │              │   digest để tìm error thật!      │  │    │
  │  │ │              │ → e.g. "d5g3st_abc123xyz"        │  │    │
  │  │ │              │                                  │  │    │
  │  │ │ .stack       │ Stack trace (từ Error object)    │  │    │
  │  │ │ .name        │ Tên loại error (từ Error object) │  │    │
  │  │ └──────────────┴──────────────────────────────────┘  │    │
  │  │                                                      │    │
  │  │ TẠI SAO CẦN digest?                                 │    │
  │  │ → Server Components render trên server              │    │
  │  │ → React có thể wrap/transform error trước khi       │    │
  │  │   gửi đến client                                    │    │
  │  │ → error.message có thể KHÔNG PHẢI message gốc!     │    │
  │  │ → digest = "chìa khóa" để tìm lại error gốc       │    │
  │  │   trong server logs!                                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PARAMETER 2: request                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Type: { path, method, headers } (READ-ONLY!)        │    │
  │  │                                                      │    │
  │  │ ┌──────────────┬──────────────────────────────────┐  │    │
  │  │ │ Property     │ Mô tả                            │  │    │
  │  │ ├──────────────┼──────────────────────────────────┤  │    │
  │  │ │ .path        │ Đường dẫn resource               │  │    │
  │  │ │              │ Ví dụ: /blog?name=foo            │  │    │
  │  │ │              │ BAO GỒM query string!            │  │    │
  │  │ │              │                                  │  │    │
  │  │ │ .method      │ HTTP method của request          │  │    │
  │  │ │              │ GET, POST, PUT, DELETE, etc.     │  │    │
  │  │ │              │                                  │  │    │
  │  │ │ .headers     │ Headers của request              │  │    │
  │  │ │              │ { [key: string]: string |        │  │    │
  │  │ │              │   string[] }                     │  │    │
  │  │ │              │ Ví dụ:                           │  │    │
  │  │ │              │ { 'content-type': 'app/json',   │  │    │
  │  │ │              │   'accept-language': 'vi,en' }   │  │    │
  │  │ └──────────────┴──────────────────────────────────┘  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PARAMETER 3: context                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ context — Ngữ cảnh khi lỗi xảy ra!                  │    │
  │  │                                                      │    │
  │  │ ┌─────────────────┬─────────────────────────────────┐│   │
  │  │ │ Property        │ Giá trị & Giải thích            ││   │
  │  │ ├─────────────────┼─────────────────────────────────┤│   │
  │  │ │ routerKind      │ 'Pages Router' | 'App Router'   ││   │
  │  │ │                 │ → Loại router đang sử dụng      ││   │
  │  │ │                 │ → App Router = mới (app/)       ││   │
  │  │ │                 │ → Pages Router = cũ (pages/)    ││   │
  │  │ │                 │                                 ││   │
  │  │ │ routePath       │ Đường dẫn FILE route            ││   │
  │  │ │                 │ Ví dụ: /app/blog/[dynamic]      ││   │
  │  │ │                 │ → KHÔNG phải URL!               ││   │
  │  │ │                 │ → Là đường dẫn file trong dự án ││   │
  │  │ │                 │                                 ││   │
  │  │ │ routeType       │ 'render' → Server Components    ││   │
  │  │ │                 │   rendering (SSR, RSC)           ││   │
  │  │ │                 │ 'route' → Route Handlers         ││   │
  │  │ │                 │   (API routes trong app/)       ││   │
  │  │ │                 │ 'action' → Server Actions        ││   │
  │  │ │                 │ 'proxy' → Proxy/Middleware       ││   │
  │  │ │                 │                                 ││   │
  │  │ │ renderSource    │ 'react-server-components'       ││   │
  │  │ │                 │   → Lỗi trong RSC render        ││   │
  │  │ │                 │ 'react-server-components-payload'││  │
  │  │ │                 │   → Lỗi trong RSC payload       ││   │
  │  │ │                 │ 'server-rendering'               ││   │
  │  │ │                 │   → Lỗi trong SSR truyền thống  ││   │
  │  │ │                 │                                 ││   │
  │  │ │ revalidateReason│ 'on-demand' → revalidate thủ công│   │
  │  │ │                 │ 'stale' → ISR tự động revalidate││   │
  │  │ │                 │ undefined → request bình thường  ││   │
  │  │ │                 │   (không liên quan revalidation) ││   │
  │  │ │                 │                                 ││   │
  │  │ │ renderType      │ 'dynamic' → render động         ││   │
  │  │ │                 │ 'dynamic-resume' → PPR!          ││   │
  │  │ │                 │   (Partial Prerendering)         ││   │
  │  │ │                 │   = pre-render static shell +    ││   │
  │  │ │                 │     stream dynamic parts         ││   │
  │  │ └─────────────────┴─────────────────────────────────┘│   │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Specifying the Runtime — Chọn Runtime!

```
  SPECIFYING THE RUNTIME:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  instrumentation.js hoạt động trên CẢ 2 runtimes:           │
  │                                                              │
  │  ┌─────────────────────────────────────────────────────┐     │
  │  │ ① Node.js Runtime (mặc định)                       │     │
  │  │   → Full Node.js APIs (fs, crypto, etc.)           │     │
  │  │   → Mạnh, đầy đủ tính năng                        │     │
  │  │   → Chạy trên serverless functions                 │     │
  │  │                                                     │     │
  │  │ ② Edge Runtime                                      │     │
  │  │   → Lightweight, chạy trên CDN edge                │     │
  │  │   → APIs hạn chế (no fs, limited crypto)           │     │
  │  │   → Latency rất thấp (gần người dùng!)            │     │
  │  └─────────────────────────────────────────────────────┘     │
  │                                                              │
  │  CÁCH PHÂN BIỆT RUNTIME:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ process.env.NEXT_RUNTIME === 'edge'                  │    │
  │  │   → true:  đang chạy trên Edge runtime              │    │
  │  │   → false: đang chạy trên Node.js runtime           │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CODE MẪU (tách logic theo runtime):                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ export function register() {                         │    │
  │  │   if (process.env.NEXT_RUNTIME === 'edge') {         │    │
  │  │     return require('./register.edge')                │    │
  │  │     // → Load module riêng cho Edge!                │    │
  │  │     // → Chỉ dùng Edge-compatible APIs!             │    │
  │  │   } else {                                           │    │
  │  │     return require('./register.node')                │    │
  │  │     // → Load module riêng cho Node.js!             │    │
  │  │     // → Có thể dùng full Node.js APIs!             │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ export function onRequestError() {                   │    │
  │  │   if (process.env.NEXT_RUNTIME === 'edge') {         │    │
  │  │     return require('./on-request-error.edge')        │    │
  │  │   } else {                                           │    │
  │  │     return require('./on-request-error.node')        │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                          │    │
  │  │ → MỘT file instrumentation.js cho CẢ 2 runtimes!   │    │
  │  │ → Nhưng logic bên trong tách theo biến môi trường   │    │
  │  │ → require() để lazy-load module phù hợp             │    │
  │  │ → register.edge.ts: setup cho Edge runtime          │    │
  │  │ → register.node.ts: setup cho Node.js runtime       │    │
  │  │ → Tương tự cho onRequestError!                      │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO CẦN TÁCH?                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Node.js module (vd: fs, child_process) KHÔNG có   │    │
  │  │   trên Edge runtime!                                │    │
  │  │ → Nếu import trực tiếp trong instrumentation.js:    │    │
  │  │   → Build error khi chạy trên Edge!                │    │
  │  │ → require() conditional = chỉ load khi cần!        │    │
  │  │ → Tree-shaking không ảnh hưởng!                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Sơ Đồ Tổng Hợp — Luồng Hoạt Động!

> **Lưu ý**: Trang docs gốc KHÔNG có hình ảnh/diagram nào.
> Các sơ đồ dưới đây là tự vẽ để giúp hiểu rõ hơn!

### Sơ Đồ 1: Vòng Đời Instrumentation

```
  VÒNG ĐỜI INSTRUMENTATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  SERVER LIFECYCLE:                                            │
  │                                                              │
  │  ┌──────────┐   ┌───────────────┐   ┌──────────────────┐    │
  │  │ next dev │   │ register()    │   │ Server READY!    │    │
  │  │ hoặc     │──→│ chạy 1 LẦN!  │──→│ Bắt đầu nhận    │    │
  │  │ next start│   │ setup tools   │   │ requests!        │    │
  │  └──────────┘   └───────────────┘   └───────┬──────────┘    │
  │                                              │               │
  │                                              ▼               │
  │                  ┌───────────────────────────────────────┐    │
  │                  │        REQUEST HANDLING LOOP          │    │
  │                  │  ┌──────────────────────────────────┐ │   │
  │                  │  │ Request #1 → Response (OK)       │ │   │
  │                  │  │ Request #2 → Response (OK)       │ │   │
  │                  │  │ Request #3 → ERROR! ──┐          │ │   │
  │                  │  │ Request #4 → Response │(OK)      │ │   │
  │                  │  └───────────────────────┼──────────┘ │   │
  │                  │                          │             │    │
  │                  │                          ▼             │    │
  │                  │  ┌──────────────────────────────────┐ │   │
  │                  │  │ onRequestError(error, req, ctx)  │ │   │
  │                  │  │ → Gửi đến Sentry / monitoring   │ │   │
  │                  │  └──────────────────────────────────┘ │   │
  │                  └───────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: so sánh instrumentation.js vs instrumentation-client.js

```
  SERVER vs CLIENT INSTRUMENTATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌─────────────────────────┬─────────────────────────┐       │
  │  │  instrumentation.js    │  instrumentation-client  │       │
  │  │  (SERVER)               │  (CLIENT)                │       │
  │  ├─────────────────────────┼─────────────────────────┤       │
  │  │ Chạy trên: Server      │ Chạy trên: Browser      │       │
  │  │                         │                          │       │
  │  │ Exports:                │ Exports:                 │       │
  │  │ • register() (opt)     │ • Không cần export!      │       │
  │  │ • onRequestError()     │ • onRouterTransitionStart │       │
  │  │   (opt)                │   (opt)                   │       │
  │  │                         │                          │       │
  │  │ Thời điểm:             │ Thời điểm:               │       │
  │  │ Server khởi tạo        │ Sau HTML load,            │       │
  │  │ (1 lần duy nhất!)     │ trước React hydration    │       │
  │  │                         │                          │       │
  │  │ Use cases:              │ Use cases:               │       │
  │  │ • OpenTelemetry        │ • Analytics               │       │
  │  │ • Sentry server        │ • Error tracking          │       │
  │  │ • Server error track   │ • Performance monitor     │       │
  │  │ • DB connection pools  │ • Polyfills               │       │
  │  │                         │                          │       │
  │  │ Runtime:                │ Runtime:                  │       │
  │  │ Node.js + Edge         │ Browser only              │       │
  │  └─────────────────────────┴─────────────────────────┘       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 3: Cấu trúc Context — routeType mapping

```
  routeType MAPPING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  routeType cho biết LỖI XẢY RA Ở ĐÂU:                      │
  │                                                              │
  │  ┌──────────────────┬──────────────────────────────────┐     │
  │  │ routeType        │ Nơi lỗi xảy ra                  │     │
  │  ├──────────────────┼──────────────────────────────────┤     │
  │  │ 'render'         │ Server Components rendering      │     │
  │  │                  │ → page.tsx / layout.tsx           │     │
  │  │                  │ → RSC render trên server          │     │
  │  │                  │                                  │     │
  │  │ 'route'          │ Route Handlers (API)             │     │
  │  │                  │ → app/api/*/route.ts              │     │
  │  │                  │ → GET, POST, PUT, DELETE...      │     │
  │  │                  │                                  │     │
  │  │ 'action'         │ Server Actions                   │     │
  │  │                  │ → "use server" functions          │     │
  │  │                  │ → Form submissions               │     │
  │  │                  │                                  │     │
  │  │ 'proxy'          │ Proxy / Middleware               │     │
  │  │                  │ → proxy.js xử lý request         │     │
  │  │                  │ → Redirect/rewrite logic          │     │
  │  └──────────────────┴──────────────────────────────────┘     │
  │                                                              │
  │  renderSource → chi tiết hơn cho 'render':                   │
  │  ┌──────────────────────────────────────┐                    │
  │  │ 'react-server-components'            │                    │
  │  │   → RSC render (component tree)      │                    │
  │  │ 'react-server-components-payload'    │                    │
  │  │   → RSC payload generation           │                    │
  │  │ 'server-rendering'                   │                    │
  │  │   → Traditional SSR (HTML render)    │                    │
  │  └──────────────────────────────────────┘                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Version History — Lịch Sử Phát Triển

```
  VERSION HISTORY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────┬──────────────────────────────────────────┐     │
  │  │ Version  │ Thay đổi                                 │     │
  │  ├──────────┼──────────────────────────────────────────┤     │
  │  │ v13.2.0  │ instrumentation LẦN ĐẦU ra mắt!        │     │
  │  │          │ (experimental flag!)                     │     │
  │  │          │ → Chỉ có register()                     │     │
  │  │          │                                          │     │
  │  │ v14.0.4  │ instrumentation ỔN ĐỊNH (stable)!       │     │
  │  │          │ → Turbopack support!                     │     │
  │  │          │ → Không cần experimental flag nữa!       │     │
  │  │          │                                          │     │
  │  │ v15.0.0  │ onRequestError THÊM VÀO!                │     │
  │  │          │ → Track server errors!                   │     │
  │  │          │ → instrumentation.js stable hoàn toàn!  │     │
  │  └──────────┴──────────────────────────────────────────┘     │
  │                                                              │
  │  TIMELINE:                                                    │
  │  v13.2 ──── v14.0.4 ──── v15.0.0                             │
  │    │           │            │                                 │
  │    │           │            └── + onRequestError()            │
  │    │           └── Stable + Turbopack                         │
  │    └── Experimental (register only)                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — InstrumentationEngine!

```javascript
/**
 * InstrumentationEngine — Mô phỏng cơ chế instrumentation.js!
 * Tự viết bằng tay, KHÔNG dùng thư viện nào!
 * Covers: register, onRequestError, runtime detection, error tracking
 */
var InstrumentationEngine = (function () {

  // ═══════════════════════════════════
  // 1. REGISTER SIMULATOR
  // ═══════════════════════════════════
  var _isRegistered = false;
  var _registeredTools = [];

  function register(toolName) {
    if (_isRegistered) {
      return { success: false, reason: 'register() đã được gọi rồi! Chỉ gọi 1 LẦN!' };
    }
    _registeredTools.push(toolName);
    _isRegistered = true;
    return {
      success: true,
      tool: toolName,
      note: 'Server SẴN SÀNG nhận requests sau khi register() hoàn thành!'
    };
  }

  // ═══════════════════════════════════
  // 2. ON REQUEST ERROR SIMULATOR
  // ═══════════════════════════════════
  var _errorLog = [];

  function onRequestError(error, request, context) {
    // Validate error
    if (!error || !error.message) {
      return { success: false, reason: 'Error object PHẢI có message!' };
    }

    // Generate digest nếu chưa có
    var digest = error.digest || 'digest_' + Math.random().toString(36).substr(2, 10);

    // Validate context routeType
    var validRouteTypes = ['render', 'route', 'action', 'proxy'];
    if (context && validRouteTypes.indexOf(context.routeType) === -1) {
      return { success: false, reason: 'routeType phải là: ' + validRouteTypes.join(', ') };
    }

    var entry = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        digest: digest,
        name: error.name || 'Error'
      },
      request: {
        path: request ? request.path : 'unknown',
        method: request ? request.method : 'GET',
        headers: request ? request.headers : {}
      },
      context: {
        routerKind: context ? context.routerKind : 'App Router',
        routePath: context ? context.routePath : '/unknown',
        routeType: context ? context.routeType : 'render',
        renderSource: context ? context.renderSource : 'react-server-components',
        revalidateReason: context ? context.revalidateReason : undefined,
        renderType: context ? context.renderType : 'dynamic'
      }
    };

    _errorLog.push(entry);
    return { success: true, logged: entry, totalErrors: _errorLog.length };
  }

  // ═══════════════════════════════════
  // 3. RUNTIME DETECTOR
  // ═══════════════════════════════════
  function detectRuntime(envValue) {
    if (envValue === 'edge') {
      return {
        runtime: 'edge',
        features: ['Web APIs', 'Limited crypto', 'NO fs!', 'NO child_process!'],
        recommendation: 'Dùng require("./register.edge") cho Edge-specific setup!'
      };
    }
    return {
      runtime: 'nodejs',
      features: ['Full Node.js APIs', 'fs', 'crypto', 'child_process', 'net'],
      recommendation: 'Dùng require("./register.node") cho Node-specific setup!'
    };
  }

  // ═══════════════════════════════════
  // 4. DIGEST MATCHER
  // ═══════════════════════════════════
  function findErrorByDigest(digest) {
    for (var i = 0; i < _errorLog.length; i++) {
      if (_errorLog[i].error.digest === digest) {
        return {
          found: true,
          entry: _errorLog[i],
          note: 'Tìm thấy error gốc bằng digest! Đây là cách match client error với server logs!'
        };
      }
    }
    return {
      found: false,
      note: 'Không tìm thấy error với digest "' + digest + '". Kiểm tra lại server logs!'
    };
  }

  // ═══════════════════════════════════
  // 5. ERROR REPORT BUILDER
  // ═══════════════════════════════════
  function buildReport() {
    var report = {
      totalErrors: _errorLog.length,
      byRouteType: { render: 0, route: 0, action: 0, proxy: 0 },
      byRouterKind: { 'App Router': 0, 'Pages Router': 0 },
      byRenderSource: {},
      recentErrors: _errorLog.slice(-5)
    };

    for (var i = 0; i < _errorLog.length; i++) {
      var ctx = _errorLog[i].context;
      report.byRouteType[ctx.routeType] = (report.byRouteType[ctx.routeType] || 0) + 1;
      report.byRouterKind[ctx.routerKind] = (report.byRouterKind[ctx.routerKind] || 0) + 1;
      report.byRenderSource[ctx.renderSource] = (report.byRenderSource[ctx.renderSource] || 0) + 1;
    }

    return report;
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  INSTRUMENTATION ENGINE — DEMO            ║');
    console.log('╚══════════════════════════════════════════╝');

    // 1. Register
    console.log('\n─── 1. REGISTER ───');
    console.log(JSON.stringify(register('OpenTelemetry'), null, 2));
    console.log('Gọi lại:', JSON.stringify(register('Sentry')));

    // 2. Runtime Detection
    console.log('\n─── 2. RUNTIME DETECTION ───');
    console.log('Edge:', JSON.stringify(detectRuntime('edge'), null, 2));
    console.log('Node:', JSON.stringify(detectRuntime('nodejs'), null, 2));

    // 3. Error Tracking
    console.log('\n─── 3. ERROR TRACKING ───');
    var r1 = onRequestError(
      { message: 'Cannot read property of null', name: 'TypeError' },
      { path: '/blog?id=123', method: 'GET', headers: { 'user-agent': 'Chrome' } },
      { routerKind: 'App Router', routePath: '/app/blog/[slug]',
        routeType: 'render', renderSource: 'react-server-components',
        revalidateReason: undefined, renderType: 'dynamic' }
    );
    console.log('Error 1:', JSON.stringify(r1, null, 2));

    var r2 = onRequestError(
      { message: 'Database connection failed', name: 'Error' },
      { path: '/api/users', method: 'POST', headers: { 'content-type': 'application/json' } },
      { routerKind: 'App Router', routePath: '/app/api/users',
        routeType: 'route', renderSource: 'server-rendering',
        revalidateReason: 'stale', renderType: 'dynamic' }
    );
    console.log('Error 2:', JSON.stringify(r2, null, 2));

    var r3 = onRequestError(
      { message: 'Form validation failed', name: 'ValidationError' },
      { path: '/dashboard/settings', method: 'POST', headers: {} },
      { routerKind: 'App Router', routePath: '/app/dashboard/settings',
        routeType: 'action', renderSource: 'react-server-components',
        revalidateReason: undefined, renderType: 'dynamic' }
    );
    console.log('Error 3:', JSON.stringify(r3, null, 2));

    // 4. Find by Digest
    console.log('\n─── 4. FIND BY DIGEST ───');
    var digest = r1.logged.error.digest;
    console.log('Tìm digest "' + digest + '":', JSON.stringify(findErrorByDigest(digest), null, 2));
    console.log('Tìm digest không tồn tại:', JSON.stringify(findErrorByDigest('fake_digest')));

    // 5. Report
    console.log('\n─── 5. ERROR REPORT ───');
    console.log(JSON.stringify(buildReport(), null, 2));

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                         ║');
    console.log('╚══════════════════════════════════════════╝');
  }

  return {
    register: register,
    onRequestError: onRequestError,
    detectRuntime: detectRuntime,
    findErrorByDigest: findErrorByDigest,
    buildReport: buildReport,
    demo: demo
  };
})();

// Chạy: InstrumentationEngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

### ❓ Câu 1: register() được gọi bao nhiêu lần và khi nào?

**Trả lời:**

`register()` được gọi **DUY NHẤT MỘT LẦN** khi server instance khởi tạo. Nó **PHẢI hoàn thành** TRƯỚC KHI server sẵn sàng xử lý requests. Có thể là `async` function.

```
  Server boots → register() chạy → XONG → Server ready!
                 ↑ chỉ 1 lần!     ↑ phải xong trước!
```

### ❓ Câu 2: Tại sao cần error.digest? Không dùng error.message được sao?

**Trả lời:**

Khi lỗi xảy ra trong **Server Components**, React có thể **XỬ LÝ (process)** error trước khi truyền đến `onRequestError`. Kết quả:
- `error.message` có thể **KHÔNG PHẢI** message gốc (bị React thay đổi!)
- `error.digest` là **ID duy nhất** không bị thay đổi
- Dùng `digest` để **match** với server logs → tìm ra error gốc!

| Property | Tin cậy? | Dùng để |
|---|---|---|
| `error.message` | ❌ Có thể bị React đổi | Hiển thị cho user (dev mode) |
| `error.digest` | ✅ Luôn chính xác | Match với server logs |

### ❓ Câu 3: instrumentation.js chạy trên runtime nào?

**Trả lời:**

Chạy trên **CẢ 2**: Node.js VÀ Edge runtime!

Phân biệt bằng `process.env.NEXT_RUNTIME`:
- `=== 'edge'` → Edge runtime
- Ngược lại → Node.js runtime

**Phải tách logic** vì Node.js APIs (fs, crypto full) KHÔNG có trên Edge. Dùng `require()` conditional để lazy-load module phù hợp.

### ❓ Câu 4: Sự khác biệt giữa routeType 'render', 'route', 'action', 'proxy'?

**Trả lời:**

| routeType | Nơi lỗi xảy ra | Ví dụ file |
|---|---|---|
| `'render'` | Server Components rendering | `page.tsx`, `layout.tsx` |
| `'route'` | Route Handlers (API) | `app/api/users/route.ts` |
| `'action'` | Server Actions | `"use server"` functions |
| `'proxy'` | Proxy/Middleware | `proxy.js` |

### ❓ Câu 5: Viết code setup Sentry trong instrumentation.js (không dùng thư viện Sentry, mô phỏng!)

**Trả lời:**

```javascript
// instrumentation.ts (mô phỏng — tự viết!)
var errorQueue = [];

export function register() {
  console.log('[Instrumentation] Server started — monitoring active!');
  // Trong thực tế: Sentry.init({ dsn: '...' })
}

export function onRequestError(error, request, context) {
  var entry = {
    timestamp: new Date().toISOString(),
    digest: error.digest,
    message: error.message,
    path: request.path,
    method: request.method,
    routeType: context.routeType,
    routerKind: context.routerKind
  };
  errorQueue.push(entry);
  console.error('[Sentry Mock] Error tracked:', entry);
  // Trong thực tế: Sentry.captureException(error, { extra: { request, context } })
}
```

---

> 🎯 **Tổng kết**: Guide này phân tích TOÀN BỘ nội dung trang `instrumentation.js` docs:
> - **0 hình ảnh** trong trang gốc (chỉ text + code)
> - **3 sơ đồ tự vẽ**: Vòng đời instrumentation, Server vs Client, routeType mapping
> - **InstrumentationEngine** tự viết với 5 functions mô phỏng
> - **5 câu hỏi luyện tập** với đáp án chi tiết
