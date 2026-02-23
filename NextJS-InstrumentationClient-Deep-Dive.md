# Next.js instrumentation-client.js — Deep Dive!

> **Chủ đề**: `instrumentation-client.js` — Client-Side Observability
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
> **Hình ảnh trang gốc**: 0 (trang chỉ có text + code blocks, KHÔNG có diagram/hình ảnh)

---

## Mục Lục

1. [§1. Tổng Quan — instrumentation-client.js là gì?](#1)
2. [§2. Vị Trí Đặt File + Cách Sử Dụng](#2)
3. [§3. Router Navigation Tracking — onRouterTransitionStart](#3)
4. [§4. Performance Considerations — Yêu Cầu Hiệu Suất](#4)
5. [§5. Execution Timing — Thời Điểm Thực Thi](#5)
6. [§6. 4 Ví Dụ Thực Tế (Error, Analytics, Performance, Polyfills)](#6)
7. [§7. So Sánh instrumentation.js vs instrumentation-client.js](#7)
8. [§8. Sơ Đồ Tổng Hợp — Tự Vẽ](#8)
9. [§9. Tự Viết — InstrumentationClientEngine](#9)
10. [§10. Câu Hỏi Luyện Tập](#10)

---

## §1. Tổng Quan — instrumentation-client.js là gì?

```
  instrumentation-client.js — TỔNG QUAN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                 │
  │  File instrumentation-client.js (hoặc .ts) cho phép bạn     │
  │  thêm monitoring code, analytics code, và các side-effects  │
  │  chạy TRƯỚC KHI ứng dụng trở nên interactive trên CLIENT!  │
  │                                                              │
  │  VỊ TRÍ THỰC THI: BROWSER (Client-side)                      │
  │  ⚠️ KHÁC với instrumentation.js → chạy trên SERVER!         │
  │                                                              │
  │  4 MỤC ĐÍCH CHÍNH:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ① THEO DÕI HIỆU SUẤT (Performance Tracking)        │    │
  │  │   → Đo Time to Interactive (TTI)                    │    │
  │  │   → PerformanceObserver API                         │    │
  │  │   → performance.mark() để đánh dấu mốc thời gian   │    │
  │  │                                                      │    │
  │  │ ② GIÁM SÁT LỖI (Error Monitoring)                  │    │
  │  │   → window.addEventListener('error', ...)           │    │
  │  │   → Bắt lỗi client-side TRƯỚC khi React mount!     │    │
  │  │   → Gửi đến Sentry/Datadog/Custom API              │    │
  │  │                                                      │    │
  │  │ ③ ANALYTICS (Phân Tích Hành Vi)                     │    │
  │  │   → analytics.init() — khởi tạo tracking           │    │
  │  │   → Theo dõi page views, navigation events         │    │
  │  │   → Google Analytics, Mixpanel, Amplitude...        │    │
  │  │                                                      │    │
  │  │ ④ POLYFILLS (Bù Đắp Trình Duyệt Cũ)               │    │
  │  │   → Import polyfills trước khi app code chạy       │    │
  │  │   → Static imports: luôn load                       │    │
  │  │   → Dynamic imports: conditional (feature detect!)  │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ĐIỂM ĐẶC BIỆT:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → KHÔNG CẦN export function cụ thể nào!            │    │
  │  │   (khác instrumentation.js cần export register())   │    │
  │  │ → Viết code trực tiếp trong file!                   │    │
  │  │ → Code chạy ngay khi file được load!                │    │
  │  │ → TUỲ CHỌN: export onRouterTransitionStart()       │    │
  │  │   để theo dõi navigation events                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Vị Trí Đặt File + Cách Sử Dụng

```
  VỊ TRÍ + USAGE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VỊ TRÍ (giống instrumentation.js):                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ CÁCH 1: Root dự án                                   │    │
  │  │ my-app/                                               │    │
  │  │ ├── app/                                              │    │
  │  │ ├── instrumentation-client.js  ← ĐÂY!              │    │
  │  │ ├── instrumentation.js     (server — riêng biệt!)   │    │
  │  │ └── next.config.js                                    │    │
  │  │                                                      │    │
  │  │ CÁCH 2: Trong src/ folder                            │    │
  │  │ my-app/                                               │    │
  │  │ ├── src/                                              │    │
  │  │ │   ├── app/                                          │    │
  │  │ │   └── instrumentation-client.js  ← ĐÂY!          │    │
  │  │ └── next.config.js                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH SỬ DỤNG — VIẾT CODE TRỰC TIẾP:                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ // instrumentation-client.js                         │    │
  │  │                                                      │    │
  │  │ // ① Đo performance — mark thời điểm khởi tạo      │    │
  │  │ performance.mark('app-init')                         │    │
  │  │                                                      │    │
  │  │ // ② Khởi tạo analytics                             │    │
  │  │ console.log('Analytics initialized')                 │    │
  │  │                                                      │    │
  │  │ // ③ Setup error tracking                           │    │
  │  │ window.addEventListener('error', (event) => {        │    │
  │  │   // Gửi đến error tracking service                 │    │
  │  │   reportError(event.error)                           │    │
  │  │ })                                                   │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH TỪNG PHẦN:                                │    │
  │  │ → performance.mark('app-init'):                     │    │
  │  │   Đánh dấu mốc thời gian 'app-init' trong          │    │
  │  │   Performance Timeline API. Sau đó có thể đo        │    │
  │  │   khoảng cách giữa mark này và events khác!         │    │
  │  │                                                      │    │
  │  │ → window.addEventListener('error', ...):            │    │
  │  │   Bắt TẤT CẢ uncaught errors trên trang!           │    │
  │  │   Kể cả lỗi xảy ra TRƯỚC React mount!              │    │
  │  │   → event.error = Error object gốc                 │    │
  │  │   → reportError() = hàm gửi lỗi đến server        │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ⚠️ BEST PRACTICE: Bọc code trong try-catch!                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Nếu 1 tracking feature fail                       │    │
  │  │ → KHÔNG ảnh hưởng các features khác!                │    │
  │  │ → App vẫn chạy bình thường!                        │    │
  │  │                                                      │    │
  │  │ try {                                                │    │
  │  │   initAnalytics()                                    │    │
  │  │ } catch (e) {                                        │    │
  │  │   console.warn('Analytics init failed:', e)         │    │
  │  │ }                                                    │    │
  │  │ try {                                                │    │
  │  │   initErrorTracking()                                │    │
  │  │ } catch (e) {                                        │    │
  │  │   console.warn('Error tracking init failed:', e)    │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Router Navigation Tracking — onRouterTransitionStart

```
  onRouterTransitionStart() — THEO DÕI NAVIGATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  WHAT: Export TÙY CHỌN cho phép nhận thông báo khi          │
  │  navigation BẮT ĐẦU trong Next.js router!                   │
  │                                                              │
  │  FUNCTION SIGNATURE:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ export function onRouterTransitionStart(              │    │
  │  │   url: string,                                        │    │
  │  │   navigationType: 'push' | 'replace' | 'traverse'    │    │
  │  │ ): void                                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  2 PARAMETERS:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ① url: string                                       │    │
  │  │   → URL đích mà user đang navigate đến              │    │
  │  │   → Ví dụ: '/dashboard', '/blog/post-1'            │    │
  │  │                                                      │    │
  │  │ ② navigationType: 'push' | 'replace' | 'traverse'  │    │
  │  │   → Loại navigation đang xảy ra:                    │    │
  │  │                                                      │    │
  │  │   'push':                                            │    │
  │  │   → Thêm entry MỚI vào browser history!            │    │
  │  │   → <Link href="/about"> hoặc router.push()        │    │
  │  │   → User nhấn Back → quay lại trang trước!         │    │
  │  │                                                      │    │
  │  │   'replace':                                         │    │
  │  │   → THAY THẾ entry hiện tại trong history!          │    │
  │  │   → router.replace('/new-url')                      │    │
  │  │   → User nhấn Back → KHÔNG quay lại trang cũ!     │    │
  │  │   → Dùng cho redirect, form submit thành công...    │    │
  │  │                                                      │    │
  │  │   'traverse':                                        │    │
  │  │   → Navigate qua browser history!                   │    │
  │  │   → User nhấn nút Back / Forward trên browser      │    │
  │  │   → Hoặc router.back() / router.forward()          │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CODE MẪU:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // instrumentation-client.ts                         │    │
  │  │                                                      │    │
  │  │ performance.mark('app-init')                         │    │
  │  │                                                      │    │
  │  │ export function onRouterTransitionStart(              │    │
  │  │   url: string,                                       │    │
  │  │   navigationType: 'push' | 'replace' | 'traverse'   │    │
  │  │ ) {                                                  │    │
  │  │   console.log(`Nav started: ${navigationType}        │    │
  │  │     to ${url}`)                                      │    │
  │  │   performance.mark(`nav-start-${Date.now()}`)        │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ PHÂN TÍCH:                                           │    │
  │  │ → performance.mark('app-init'): code chạy trực tiếp │    │
  │  │   khi file load (KHÔNG cần export!)                  │    │
  │  │ → onRouterTransitionStart: PHẢI export!              │    │
  │  │   Next.js gọi hàm này mỗi khi navigation xảy ra   │    │
  │  │ → performance.mark(`nav-start-${Date.now()}`):      │    │
  │  │   Đánh dấu thời điểm bắt đầu navigation            │    │
  │  │   → Kết hợp với nav-end mark để đo duration!       │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Performance Considerations — Yêu Cầu Hiệu Suất!

```
  PERFORMANCE CONSIDERATIONS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  QUY TẮC VÀNG: GIỮ CODE NHẸ! (Lightweight!)                 │
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ⚠️ CẢNH BÁO PERFORMANCE:                            │    │
  │  │                                                      │    │
  │  │ Next.js GIÁM SÁT thời gian khởi tạo trong DEV      │    │
  │  │ và sẽ LOG WARNING nếu > 16ms!                       │    │
  │  │                                                      │    │
  │  │ TẠI SAO 16ms?                                       │    │
  │  │ → 1 frame ở 60fps = 16.67ms                        │    │
  │  │ → Nếu instrumentation > 16ms:                       │    │
  │  │   → Trì hoãn hydration                             │    │
  │  │   → User thấy trang "đơ" (jank!)                   │    │
  │  │   → Ảnh hưởng Largest Contentful Paint (LCP)       │    │
  │  │   → Ảnh hưởng First Input Delay (FID)              │    │
  │  │   → Core Web Vitals bị giảm!                       │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  NÊN LÀM:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ✅ Chỉ setup listeners, KHÔNG xử lý nặng           │    │
  │  │ ✅ Defer heavy operations (setTimeout, requestIdleCallback)│
  │  │ ✅ Dynamic import cho polyfills lớn                  │    │
  │  │ ✅ try-catch bọc từng tracking feature              │    │
  │  │ ✅ Tránh synchronous network requests               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHÔNG NÊN:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ Import thư viện lớn synchronously                │    │
  │  │ ❌ Thực hiện tính toán nặng trực tiếp               │    │
  │  │ ❌ Blocking DOM manipulation                        │    │
  │  │ ❌ Gọi API synchronously                            │    │
  │  │ ❌ Quá nhiều event listeners cùng lúc              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Execution Timing — Thời Điểm Thực Thi!

```
  EXECUTION TIMING — THỜI ĐIỂM CHÍNH XÁC:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  instrumentation-client.js thực thi tại 1 ĐIỂM CỤ THỂ      │
  │  trong vòng đời ứng dụng:                                    │
  │                                                              │
  │  TIMELINE (theo thứ tự):                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ① HTML document loaded                              │    │
  │  │   → Browser đã tải xong cây DOM                     │    │
  │  │   → Trang hiển thị nhưng chưa interactive!          │    │
  │  │          │                                           │    │
  │  │          ▼                                           │    │
  │  │ ② instrumentation-client.js CHẠY! ← ĐÂY!          │    │
  │  │   → Code trong file execute!                        │    │
  │  │   → performance.mark(), analytics.init()...         │    │
  │  │   → window.addEventListener('error')...             │    │
  │  │          │                                           │    │
  │  │          ▼                                           │    │
  │  │ ③ React hydration BẮT ĐẦU                          │    │
  │  │   → React attach event listeners vào DOM            │    │
  │  │   → Server-rendered HTML trở nên interactive        │    │
  │  │          │                                           │    │
  │  │          ▼                                           │    │
  │  │ ④ User interactions CÓ THỂ xảy ra                   │    │
  │  │   → Clicks, typing, scrolling... hoạt động!         │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VISUALIZATION:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │ ──[HTML Load]──[instr-client]──[Hydration]──[Ready]  │    │
  │  │       │              │              │           │    │    │
  │  │       │              │              │           └─ Click│  │
  │  │       │              │              └─ React attaches │  │
  │  │       │              └─ Setup monitoring            │    │
  │  │       └─ DOM parsed                                 │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO THỜI ĐIỂM NÀY LÝ TƯỞNG?                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Bắt lỗi KỂ CẢ lỗi xảy ra TRƯỚC React mount!    │    │
  │  │ → Analytics initialized TRƯỚC user interaction!     │    │
  │  │ → Performance marks capture TOÀN BỘ lifecycle!     │    │
  │  │ → Polyfills loaded TRƯỚC khi app code cần chúng!   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. 4 Ví Dụ Thực Tế — Từ Docs!

### Ví Dụ 1: Error Tracking

```
  VÍ DỤ 1: ERROR TRACKING
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MỤC ĐÍCH: Khởi tạo error tracking TRƯỚC React start        │
  │  + thêm navigation breadcrumbs cho debugging context!        │
  │                                                              │
  │  CODE (từ docs):                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import Monitor from './lib/monitoring'                │    │
  │  │                                                      │    │
  │  │ Monitor.initialize()                                  │    │
  │  │                                                      │    │
  │  │ export function onRouterTransitionStart(               │    │
  │  │   url: string                                         │    │
  │  │ ) {                                                   │    │
  │  │   Monitor.pushEvent({                                 │    │
  │  │     message: `Navigation to ${url}`,                  │    │
  │  │     category: 'navigation',                           │    │
  │  │   })                                                  │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHÂN TÍCH TỪNG DÒNG:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import Monitor:                                      │    │
  │  │   → Import module monitoring TỰ VIẾT                │    │
  │  │   → Có thể là wrapper cho Sentry, Datadog, etc.     │    │
  │  │                                                      │    │
  │  │ Monitor.initialize():                                │    │
  │  │   → Code chạy TRỰC TIẾP (không export!)            │    │
  │  │   → Setup error handlers, session tracking          │    │
  │  │   → Chạy TRƯỚC React hydration!                     │    │
  │  │                                                      │    │
  │  │ onRouterTransitionStart():                           │    │
  │  │   → PHẢI export (Next.js gọi hàm này!)             │    │
  │  │   → Mỗi khi user navigate → tạo "breadcrumb"       │    │
  │  │   → Breadcrumb = path trail giúp debug!             │    │
  │  │   → Khi crash → biết user đã qua những trang nào!  │    │
  │  │   → category: 'navigation' → filter trong dashboard │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Ví Dụ 2: Analytics Tracking

```
  VÍ DỤ 2: ANALYTICS TRACKING
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MỤC ĐÍCH: Khởi tạo analytics + track navigation events     │
  │  với metadata chi tiết cho phân tích hành vi user!           │
  │                                                              │
  │  CODE (từ docs):                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ import { analytics } from './lib/analytics'           │    │
  │  │                                                      │    │
  │  │ analytics.init()                                      │    │
  │  │                                                      │    │
  │  │ export function onRouterTransitionStart(               │    │
  │  │   url: string,                                        │    │
  │  │   navigationType: string                              │    │
  │  │ ) {                                                   │    │
  │  │   analytics.track('page_navigation', {                │    │
  │  │     url,                                              │    │
  │  │     type: navigationType,                             │    │
  │  │     timestamp: Date.now(),                            │    │
  │  │   })                                                  │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHÂN TÍCH:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ analytics.init():                                    │    │
  │  │   → Khởi tạo SDK (Mixpanel, Amplitude, GA4...)     │    │
  │  │   → Chạy trực tiếp, không cần export               │    │
  │  │                                                      │    │
  │  │ analytics.track('page_navigation', {...}):           │    │
  │  │   → Track event: tên = 'page_navigation'           │    │
  │  │   → url: trang đích                                 │    │
  │  │   → type: 'push'/'replace'/'traverse'              │    │
  │  │   → timestamp: thời điểm chính xác (ms since epoch)│    │
  │  │   → Dữ liệu này → dashboard analytics → insights!│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Ví Dụ 3: Performance Monitoring

```
  VÍ DỤ 3: PERFORMANCE MONITORING
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MỤC ĐÍCH: Đo Time to Interactive (TTI) + theo dõi          │
  │  performance navigation sử dụng PerformanceObserver API!    │
  │                                                              │
  │  CODE (từ docs):                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const startTime = performance.now()                   │    │
  │  │                                                      │    │
  │  │ const observer = new PerformanceObserver(             │    │
  │  │   (list: PerformanceObserverEntryList) => {           │    │
  │  │     for (const entry of list.getEntries()) {          │    │
  │  │       if (entry instanceof                            │    │
  │  │           PerformanceNavigationTiming) {              │    │
  │  │         console.log('Time to Interactive:',           │    │
  │  │           entry.loadEventEnd - startTime)             │    │
  │  │       }                                               │    │
  │  │     }                                                 │    │
  │  │   }                                                   │    │
  │  │ )                                                     │    │
  │  │ observer.observe({ entryTypes: ['navigation'] })      │    │
  │  │                                                      │    │
  │  │ export function onRouterTransitionStart(               │    │
  │  │   url: string                                         │    │
  │  │ ) {                                                   │    │
  │  │   performance.mark(`nav-start-${url}`)                │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHÂN TÍCH CHI TIẾT:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ performance.now():                                   │    │
  │  │   → Thời điểm hiện tại (high-resolution, ms)       │    │
  │  │   → Chính xác hơn Date.now() (microsecond!)        │    │
  │  │   → Baseline để tính TTI                            │    │
  │  │                                                      │    │
  │  │ PerformanceObserver:                                 │    │
  │  │   → Web API theo dõi performance entries             │    │
  │  │   → entryTypes: ['navigation'] → chỉ navigation!   │    │
  │  │   → Callback chạy khi có entry mới                  │    │
  │  │                                                      │    │
  │  │ PerformanceNavigationTiming:                         │    │
  │  │   → Type-check entry (chỉ xử lý navigation!)       │    │
  │  │   → .loadEventEnd = khi load event hoàn thành       │    │
  │  │   → TTI = loadEventEnd - startTime                  │    │
  │  │                                                      │    │
  │  │ performance.mark(`nav-start-${url}`):                │    │
  │  │   → Đánh dấu MỖI client navigation                 │    │
  │  │   → Có thể kết hợp performance.measure() sau!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Ví Dụ 4: Polyfills

```
  VÍ DỤ 4: POLYFILLS
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MỤC ĐÍCH: Load polyfills TRƯỚC KHI app code chạy!          │
  │  2 cách: Static import (luôn load) + Dynamic import          │
  │  (conditional, chỉ load khi browser thiếu feature!)         │
  │                                                              │
  │  CODE (từ docs):                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // ① Static import — LUÔN load!                     │    │
  │  │ import './lib/polyfills'                              │    │
  │  │                                                      │    │
  │  │ // ② Dynamic import — CHỈ load khi cần!            │    │
  │  │ if (!window.ResizeObserver) {                         │    │
  │  │   import('./lib/polyfills/resize-observer')           │    │
  │  │     .then((mod) => {                                  │    │
  │  │       window.ResizeObserver = mod.default             │    │
  │  │     })                                                │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PHÂN TÍCH:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Static import './lib/polyfills':                     │    │
  │  │   → Import TẤT CẢ polyfills core                    │    │
  │  │   → Bundle vào client JS             │    │
  │  │   → Luôn load dù browser có hỗ trợ hay không       │    │
  │  │   → Ví dụ: Promise polyfill, Array.from...          │    │
  │  │                                                      │    │
  │  │ Dynamic import (conditional):                        │    │
  │  │   → Feature detection: !window.ResizeObserver       │    │
  │  │     → Browser CŨ không có ResizeObserver?           │    │
  │  │     → Chỉ KHI ĐÓ mới load polyfill!                │    │
  │  │   → import() = dynamic import (code splitting!)     │    │
  │  │   → .then(mod => ...) = sau khi load xong           │    │
  │  │   → mod.default = polyfill class                    │    │
  │  │   → Gán vào window.ResizeObserver                    │    │
  │  │                                                      │    │
  │  │ Ưu điểm: Browser mới → KHÔNG load polyfill dư!     │    │
  │  │   → Giảm bundle size cho browser hiện đại!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. So Sánh instrumentation.js vs instrumentation-client.js

```
  SO SÁNH 2 FILE INSTRUMENTATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌─────────────────────┬──────────────┬──────────────────┐   │
  │  │ Thuộc tính          │ server       │ client           │   │
  │  │                     │ (.js)        │ (-client.js)     │   │
  │  ├─────────────────────┼──────────────┼──────────────────┤   │
  │  │ Chạy trên           │ Server       │ Browser          │   │
  │  │                     │              │                  │   │
  │  │ Runtime             │ Node.js +    │ Browser only     │   │
  │  │                     │ Edge         │                  │   │
  │  │                     │              │                  │   │
  │  │ Exports BẮT BUỘC   │ Không (opt)  │ Không            │   │
  │  │                     │              │                  │   │
  │  │ Export chính         │ register()   │ (direct code)   │   │
  │  │                     │ onRequestErr │ onRouterTransi-  │   │
  │  │                     │              │ tionStart()      │   │
  │  │                     │              │                  │   │
  │  │ Thời điểm           │ Server boot  │ After HTML load  │   │
  │  │                     │ (1 lần!)     │ Before hydration │   │
  │  │                     │              │                  │   │
  │  │ Số lần gọi          │ 1 lần/       │ Mỗi page load   │   │
  │  │                     │ server start │ (mỗi tab!)      │   │
  │  │                     │              │                  │   │
  │  │ Use cases           │ OTel, Sentry │ Analytics, Error │   │
  │  │                     │ DB pools     │ Performance, Poly│   │
  │  │                     │              │                  │   │
  │  │ Performance limit   │ Không giới   │ < 16ms (warning!)│  │
  │  │                     │ hạn rõ       │                  │   │
  │  │                     │              │                  │   │
  │  │ Async support       │ ✅ register  │ ✅ dynamic import│  │
  │  │                     │ có thể async │                  │   │
  │  │                     │              │                  │   │
  │  │ Error tracking      │ onRequest-   │ window.add-      │   │
  │  │                     │ Error()      │ EventListener()  │   │
  │  │                     │              │                  │   │
  │  │ Version             │ v13.2.0 (exp)│ v15.3            │   │
  │  │                     │ v14.0.4 (sta)│                  │   │
  │  └─────────────────────┴──────────────┴──────────────────┘   │
  │                                                              │
  │  KẾT HỢP CẢ 2:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → instrumentation.js: setup SERVER monitoring       │    │
  │  │   (OpenTelemetry, server error tracking)            │    │
  │  │                                                      │    │
  │  │ → instrumentation-client.js: setup CLIENT monitoring│    │
  │  │   (analytics, client error tracking, performance)   │    │
  │  │                                                      │    │
  │  │ → CẢ 2 CÙNG TỒN TẠI! Mỗi file cho 1 môi trường! │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Sơ Đồ Tổng Hợp — Tự Vẽ!

> **Lưu ý**: Trang docs gốc KHÔNG có hình ảnh/diagram nào.
> Các sơ đồ dưới đây là tự vẽ để giúp hiểu rõ hơn!

### Sơ Đồ 1: Vòng Đời Client Instrumentation

```
  VÒNG ĐỜI instrumentation-client.js:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  USER GÕ URL / CLICK LINK:                                   │
  │       │                                                      │
  │       ▼                                                      │
  │  ┌──────────────────────┐                                    │
  │  │ Server render HTML   │ ← Server Components render!       │
  │  │ + send to browser    │                                    │
  │  └──────────┬───────────┘                                    │
  │             │                                                │
  │             ▼                                                │
  │  ┌──────────────────────┐                                    │
  │  │ Browser parse HTML   │ ← DOM tree xây dựng!             │
  │  │ (DOMContentLoaded)   │                                    │
  │  └──────────┬───────────┘                                    │
  │             │                                                │
  │             ▼                                                │
  │  ┌────────────────────────────────────────────────┐          │
  │  │ ★ instrumentation-client.js EXECUTE! ★        │          │
  │  │ ┌──────────────────────────────────────┐      │          │
  │  │ │ • performance.mark('app-init')       │      │          │
  │  │ │ • analytics.init()                   │      │          │
  │  │ │ • window.addEventListener('error')   │      │          │
  │  │ │ • import polyfills                   │      │          │
  │  │ │ • export onRouterTransitionStart()  │      │          │
  │  │ └──────────────────────────────────────┘      │          │
  │  │ ⚠️ Phải hoàn thành trong < 16ms!              │          │
  │  └──────────┬─────────────────────────────────────┘          │
  │             │                                                │
  │             ▼                                                │
  │  ┌──────────────────────┐                                    │
  │  │ React HYDRATION      │ ← React attach events!           │
  │  │ (make interactive!)  │                                    │
  │  └──────────┬───────────┘                                    │
  │             │                                                │
  │             ▼                                                │
  │  ┌──────────────────────┐                                    │
  │  │ APP READY!           │ ← User có thể tương tác!         │
  │  │ Clicks, typing...    │                                    │
  │  └──────────┬───────────┘                                    │
  │             │                                                │
  │             ▼ (user navigates)                               │
  │  ┌──────────────────────────────────┐                        │
  │  │ onRouterTransitionStart(url,     │ ← Gọi MỖI LẦN!     │
  │  │   navigationType)                │                        │
  │  │ → 'push'/'replace'/'traverse'  │                        │
  │  └─────────────────────────────────┘                         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: navigationType Mapping

```
  NAVIGATION TYPE MAPPING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  USER ACTION            → navigationType             │    │
  │  │  ════════════            ══════════════════            │    │
  │  │                                                      │    │
  │  │  <Link href="/about">   → 'push'    ┐               │    │
  │  │  router.push('/about')  → 'push'    ├─ Thêm history │    │
  │  │  <a> click (App Router) → 'push'    ┘               │    │
  │  │                                                      │    │
  │  │  router.replace('/new') → 'replace' ─ Thay thế URL  │    │
  │  │  redirect() server      → 'replace'                  │    │
  │  │                                                      │    │
  │  │  Browser Back button    → 'traverse' ┐              │    │
  │  │  Browser Forward button → 'traverse' ├─ History nav │    │
  │  │  router.back()          → 'traverse' │              │    │
  │  │  router.forward()       → 'traverse' ┘              │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 3: Full-Stack Instrumentation Architecture

```
  FULL-STACK INSTRUMENTATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │         CLIENT (Browser)        │     SERVER (Node/Edge)     │
  │  ┌──────────────────────────┐   │  ┌─────────────────────┐  │
  │  │ instrumentation-client   │   │  │ instrumentation.js  │  │
  │  │ ┌──────────────────────┐ │   │  │ ┌─────────────────┐ │  │
  │  │ │ analytics.init()     │ │   │  │ │ register()      │ │  │
  │  │ │ error listener       │ │   │  │ │ → OTel setup    │ │  │
  │  │ │ performance marks    │ │   │  │ │ → DB pool       │ │  │
  │  │ │ polyfills            │ │   │  │ │ → Sentry init   │ │  │
  │  │ └──────────────────────┘ │   │  │ └─────────────────┘ │  │
  │  │                          │   │  │                     │  │
  │  │ onRouterTransitionStart  │   │  │ onRequestError      │  │
  │  │ → track client nav      │   │  │ → track server err  │  │
  │  └──────────────────────────┘   │  └─────────────────────┘  │
  │             │                   │            │               │
  │             └───────────┬───────┘────────────┘               │
  │                         │                                    │
  │                         ▼                                    │
  │              ┌─────────────────────┐                         │
  │              │   Monitoring        │                         │
  │              │   Dashboard         │                         │
  │              │   (Sentry/Datadog)  │                         │
  │              └─────────────────────┘                         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Tự Viết — InstrumentationClientEngine!

```javascript
/**
 * InstrumentationClientEngine — Mô phỏng instrumentation-client.js!
 * Tự viết bằng tay, KHÔNG dùng thư viện nào!
 * Covers: init timing, navigation tracking, error monitoring,
 *         performance measurement, polyfill loading
 */
var InstrumentationClientEngine = (function () {

  // ═══════════════════════════════════
  // 1. EXECUTION TIMING SIMULATOR
  // ═══════════════════════════════════
  function simulateExecutionTiming(initDurationMs) {
    var timeline = [
      { step: 1, event: 'HTML document loaded', status: 'done' },
      { step: 2, event: 'instrumentation-client.js executes',
        duration: initDurationMs + 'ms',
        warning: initDurationMs > 16
          ? 'WARNING: > 16ms! Ảnh hưởng page loading!'
          : 'OK: < 16ms! Performance tốt!' },
      { step: 3, event: 'React hydration begins', status: 'pending' },
      { step: 4, event: 'User interactions possible', status: 'pending' }
    ];
    return {
      timeline: timeline,
      totalBlockingTime: initDurationMs,
      recommendation: initDurationMs > 16
        ? 'Giảm code trong instrumentation-client! Defer heavy ops!'
        : 'Instrumentation nhẹ, không ảnh hưởng UX!'
    };
  }

  // ═══════════════════════════════════
  // 2. NAVIGATION TRACKER
  // ═══════════════════════════════════
  var _navLog = [];

  function onRouterTransitionStart(url, navigationType) {
    var validTypes = ['push', 'replace', 'traverse'];
    if (validTypes.indexOf(navigationType) === -1) {
      return { error: 'Invalid navigationType! Phải là: ' + validTypes.join(', ') };
    }

    var entry = {
      timestamp: Date.now(),
      url: url,
      navigationType: navigationType,
      description: navigationType === 'push'
        ? 'Thêm entry mới vào history (link click / router.push)'
        : navigationType === 'replace'
        ? 'Thay thế URL hiện tại (router.replace / redirect)'
        : 'Navigate qua history (Back/Forward button)'
    };

    _navLog.push(entry);
    return { tracked: entry, totalNavigations: _navLog.length };
  }

  // ═══════════════════════════════════
  // 3. ERROR MONITOR (Client-side)
  // ═══════════════════════════════════
  var _clientErrors = [];

  function simulateErrorListener(errorEvent) {
    var entry = {
      timestamp: Date.now(),
      message: errorEvent.message || 'Unknown error',
      filename: errorEvent.filename || 'unknown',
      lineno: errorEvent.lineno || 0,
      colno: errorEvent.colno || 0,
      breadcrumbs: _navLog.slice(-5).map(function(n) {
        return n.navigationType + ' → ' + n.url;
      })
    };
    _clientErrors.push(entry);
    return {
      logged: entry,
      note: 'Error bắt TRƯỚC React mount! Breadcrumbs = navigation history!'
    };
  }

  // ═══════════════════════════════════
  // 4. PERFORMANCE MEASURER
  // ═══════════════════════════════════
  var _marks = {};

  function performanceMark(name) {
    _marks[name] = Date.now();
    return { marked: name, at: _marks[name] };
  }

  function performanceMeasure(name, startMark, endMark) {
    if (!_marks[startMark]) return { error: 'Start mark "' + startMark + '" not found!' };
    if (!_marks[endMark]) return { error: 'End mark "' + endMark + '" not found!' };
    var duration = _marks[endMark] - _marks[startMark];
    return {
      name: name,
      startMark: startMark,
      endMark: endMark,
      duration: duration + 'ms'
    };
  }

  // ═══════════════════════════════════
  // 5. POLYFILL LOADER (Conditional)
  // ═══════════════════════════════════
  function simulatePolyfillLoad(featureName, isSupported) {
    if (isSupported) {
      return {
        feature: featureName,
        action: 'SKIP',
        reason: 'Browser đã hỗ trợ ' + featureName + '! Không cần polyfill!'
      };
    }
    return {
      feature: featureName,
      action: 'LOAD',
      method: 'dynamic import',
      reason: 'Browser KHÔNG hỗ trợ ' + featureName + '! Loading polyfill...',
      code: 'import("./lib/polyfills/' + featureName.toLowerCase() + '")'
        + '.then(mod => window.' + featureName + ' = mod.default)'
    };
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  INSTRUMENTATION CLIENT ENGINE — DEMO     ║');
    console.log('╚══════════════════════════════════════════╝');

    // 1. Execution Timing
    console.log('\n─── 1. EXECUTION TIMING ───');
    console.log('5ms (fast):', JSON.stringify(
      simulateExecutionTiming(5), null, 2));
    console.log('25ms (slow!):', JSON.stringify(
      simulateExecutionTiming(25), null, 2));

    // 2. Navigation Tracking
    console.log('\n─── 2. NAVIGATION TRACKING ───');
    console.log(JSON.stringify(
      onRouterTransitionStart('/dashboard', 'push'), null, 2));
    console.log(JSON.stringify(
      onRouterTransitionStart('/settings', 'push'), null, 2));
    console.log(JSON.stringify(
      onRouterTransitionStart('/dashboard', 'traverse'), null, 2));
    console.log(JSON.stringify(
      onRouterTransitionStart('/login', 'replace'), null, 2));

    // 3. Error Monitor
    console.log('\n─── 3. CLIENT ERROR ───');
    console.log(JSON.stringify(simulateErrorListener({
      message: 'Cannot read property "x" of undefined',
      filename: '/app/dashboard/page.js',
      lineno: 42,
      colno: 15
    }), null, 2));

    // 4. Performance
    console.log('\n─── 4. PERFORMANCE ───');
    performanceMark('app-init');
    performanceMark('hydration-start');
    performanceMark('hydration-end');
    console.log('TTI:', JSON.stringify(
      performanceMeasure('TTI', 'app-init', 'hydration-end'), null, 2));

    // 5. Polyfills
    console.log('\n─── 5. POLYFILLS ───');
    console.log(JSON.stringify(
      simulatePolyfillLoad('ResizeObserver', true), null, 2));
    console.log(JSON.stringify(
      simulatePolyfillLoad('ResizeObserver', false), null, 2));
    console.log(JSON.stringify(
      simulatePolyfillLoad('IntersectionObserver', false), null, 2));

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                         ║');
    console.log('╚══════════════════════════════════════════╝');
  }

  return {
    simulateExecutionTiming: simulateExecutionTiming,
    onRouterTransitionStart: onRouterTransitionStart,
    simulateErrorListener: simulateErrorListener,
    performanceMark: performanceMark,
    performanceMeasure: performanceMeasure,
    simulatePolyfillLoad: simulatePolyfillLoad,
    demo: demo
  };
})();

// Chạy: InstrumentationClientEngine.demo();
```

---

## §10. Câu Hỏi Luyện Tập!

### ❓ Câu 1: instrumentation-client.js cần export gì?

**Trả lời:**

**KHÔNG cần export gì cả!** Đây là điểm khác biệt lớn với `instrumentation.js` (server).

- Code viết trực tiếp → tự chạy khi file load!
- **TÙY CHỌN**: export `onRouterTransitionStart()` để theo dõi navigation
- Không có register(), không có onRequestError()

### ❓ Câu 2: File này chạy vào thời điểm nào trong lifecycle?

**Trả lời:**

3 mốc quan trọng **theo thứ tự**:
1. ✅ **SAU** HTML document loaded (DOM đã parse xong)
2. ✅ **instrumentation-client.js CHẠY!** ← đây!
3. ✅ **TRƯỚC** React hydration (React chưa attach events)

→ Nghĩa là: error listeners bắt được lỗi KỂ CẢ lỗi xảy ra TRƯỚC React mount!

### ❓ Câu 3: Tại sao có giới hạn 16ms?

**Trả lời:**

- 1 frame ở **60fps** = **16.67ms**
- Nếu instrumentation chạy > 16ms → **block hydration** → **jank**!
- Next.js giám sát trong dev mode và **log warning**
- Ảnh hưởng: LCP, FID, Core Web Vitals

**Best practice**: Chỉ setup listeners, defer heavy ops, dynamic import cho polyfills lớn.

### ❓ Câu 4: 3 loại navigationType là gì, cho ví dụ?

**Trả lời:**

| Type | Mô tả | Ví dụ |
|---|---|---|
| `'push'` | Thêm entry MỚI vào history | `<Link>`, `router.push()` |
| `'replace'` | THAY THẾ entry hiện tại | `router.replace()`, redirect |
| `'traverse'` | Navigate qua history | Back/Forward button, `router.back()` |

### ❓ Câu 5: Khi nào dùng static import vs dynamic import cho polyfills?

**Trả lời:**

| Loại | Khi nào dùng | Ví dụ |
|---|---|---|
| **Static** `import './polyfills'` | Polyfills LUÔN cần (core) | Promise, Array.from |
| **Dynamic** `import('./polyfills/x')` | Chỉ cần cho browser CŨ | ResizeObserver, IntersectionObserver |

Dynamic import = **feature detection** trước! Nếu browser hỗ trợ → KHÔNG load → giảm bundle size!

```javascript
// Static: luôn load
import './lib/polyfills'

// Dynamic: chỉ load khi thiếu
if (!window.ResizeObserver) {
  import('./lib/polyfills/resize-observer')
    .then(mod => { window.ResizeObserver = mod.default })
}
```

---

> 🎯 **Tổng kết**: Guide phân tích TOÀN BỘ trang `instrumentation-client.js`:
> - **0 hình ảnh** trong trang gốc (chỉ text + code)
> - **3 sơ đồ tự vẽ**: vòng đời client, navigationType mapping, full-stack architecture
> - **InstrumentationClientEngine** tự viết với 6 functions mô phỏng
> - **5 câu hỏi luyện tập** với đáp án chi tiết
> - **Version**: v15.3 (lần đầu ra mắt!)
