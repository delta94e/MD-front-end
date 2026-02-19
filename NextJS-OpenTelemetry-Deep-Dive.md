# Next.js OpenTelemetry — Deep Dive!

> **Chủ đề**: Instrumentation Với OpenTelemetry!
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: https://nextjs.org/docs/app/guides/open-telemetry
> **Lưu ý**: Trang gốc KHÔNG có sơ đồ — tất cả diagrams TỰ VẼ!

---

## Mục Lục

1. [§1. Tổng Quan — OpenTelemetry Là Gì?](#1)
2. [§2. Setup — @vercel/otel vs Manual](#2)
3. [§3. Testing + Deployment](#3)
4. [§4. Custom Spans — Tự Thêm Tracing!](#4)
5. [§5. Default Spans — 11 Spans Next.js Tự Tạo!](#5)
6. [§6. next Namespace — Custom Attributes!](#6)
7. [§7. Tự Viết — OpenTelemetryEngine!](#7)
8. [§8. Câu Hỏi Luyện Tập](#8)

---

## §1. Tổng Quan — OpenTelemetry Là Gì?

```
  OBSERVABILITY + OPENTELEMETRY:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  OBSERVABILITY = Khả năng QUAN SÁT hệ thống!             │
  │  → Hiểu hành vi + hiệu suất của app!                    │
  │  → Phát hiện bottlenecks, lỗi, slow requests!            │
  │  → 3 trụ cột: Traces + Metrics + Logs!                  │
  │                                                            │
  │  OPENTELEMETRY (OTel) = TIÊU CHUẨN CHUNG!                │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ → Platform-agnostic: không phụ thuộc vendor!       │  │
  │  │ → Đổi provider (Datadog → Jaeger) mà không đổi  │  │
  │  │   code instrumentation!                              │  │
  │  │ → Next.js hỗ trợ OTel OUT OF THE BOX!             │  │
  │  │ → Next.js ĐÃ tự instrument sẵn!                 │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  3 KHÁI NIỆM CỐT LÕI:                                   │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  TRACE = 1 request lifecycle đầy đủ!               │  │
  │  │  ┌────────────────────────────────────────────┐      │  │
  │  │  │ Trace: GET /api/products                    │      │  │
  │  │  │  ├── Span: handleRequest (200ms)            │      │  │
  │  │  │  │    ├── Span: renderRoute (80ms)          │      │  │
  │  │  │  │    ├── Span: fetch DB (50ms)             │      │  │
  │  │  │  │    └── Span: generateMetadata (10ms)     │      │  │
  │  │  │  └── Span: startResponse (0ms)              │      │  │
  │  │  └────────────────────────────────────────────┘      │  │
  │  │                                                      │  │
  │  │  SPAN = 1 operation trong trace!                    │  │
  │  │  → Có: name, start time, duration, attributes      │  │
  │  │  → Nested: parent → child spans!                  │  │
  │  │                                                      │  │
  │  │  EXPORTER = Gửi data đến backend!                  │  │
  │  │  → Jaeger, Datadog, New Relic, Grafana Tempo...    │  │
  │  │  → OTLP protocol (chuẩn OTel!)                   │  │
  │  │                                                      │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  FULL ARCHITECTURE:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Next.js App                                               │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ instrumentation.ts                                   │  │
  │  │ → register() → registerOTel({ serviceName })       │  │
  │  │                                                      │  │
  │  │ Built-in Spans (auto!):                              │  │
  │  │ → handleRequest, renderRoute, fetch, API routes...  │  │
  │  │                                                      │  │
  │  │ Custom Spans (developer thêm!):                     │  │
  │  │ → trace.getTracer().startActiveSpan(...)            │  │
  │  └──────────────┬───────────────────────────────────────┘  │
  │                 │ OTLP (HTTP/gRPC)                         │
  │                 ▼                                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ OpenTelemetry Collector (optional!)                  │  │
  │  │ → Receive → Process → Export                      │  │
  │  └──────────────┬───────────────────────────────────────┘  │
  │                 │                                          │
  │                 ▼                                          │
  │  ┌──────────────────────────────────────────────────────┐  │
  │  │ Backend (chọn 1 hoặc nhiều!):                       │  │
  │  │ ┌──────────┬──────────┬──────────┬───────────────┐  │  │
  │  │ │ Jaeger   │ Datadog  │ Grafana  │ New Relic     │  │  │
  │  │ │          │          │ Tempo    │               │  │  │
  │  │ └──────────┴──────────┴──────────┴───────────────┘  │  │
  │  └──────────────────────────────────────────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §2. Setup — @vercel/otel vs Manual!

```
  2 CÁCH SETUP:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌──────────────────┬───────────────────────────────────┐  │
  │  │                  │ @vercel/otel    │ Manual NodeSDK  │  │
  │  ├──────────────────┼────────────────┼─────────────────┤  │
  │  │ Packages         │ 4              │ 5               │  │
  │  │ Config           │ 3 dòng!       │ 15+ dòng       │  │
  │  │ Edge Runtime     │ ✅ Hỗ trợ    │ ❌ Chỉ Node    │  │
  │  │ Customizable     │ Có giới hạn   │ Full control!   │  │
  │  │ File             │ instrumentation│ instrumentation  │  │
  │  │                  │ .ts            │ .ts +            │  │
  │  │                  │                │ instrumentation  │  │
  │  │                  │                │ .node.ts         │  │
  │  │ Recommend        │ ✅ Hầu hết   │ Advanced cases │  │
  │  └──────────────────┴────────────────┴─────────────────┘  │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  CÁCH 1: @vercel/otel (RECOMMENDED!)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Step 1: Install                                         │
  │  pnpm add @vercel/otel                                   │
  │           @opentelemetry/sdk-logs                        │
  │           @opentelemetry/api-logs                        │
  │           @opentelemetry/instrumentation                 │
  │                                                          │
  │  Step 2: instrumentation.ts (ROOT of project!)           │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ import { registerOTel } from '@vercel/otel'      │    │
  │  │                                                  │    │
  │  │ export function register() {                     │    │
  │  │   registerOTel({ serviceName: 'next-app' })      │    │
  │  │ }                                                │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  ⚠️ File placement:                                     │
  │  project-root/instrumentation.ts  ← ĐÚNG!             │
  │  project-root/src/instrumentation.ts ← Nếu dùng src!  │
  │  project-root/app/instrumentation.ts ← ❌ SAI!        │
  │                                                          │
  │  ĐÓ LÀ TẤT CẢ! 3 dòng code! 🎉                     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  CÁCH 2: MANUAL NODESDK (full control!)
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Step 1: Install                                         │
  │  pnpm add @opentelemetry/sdk-node                       │
  │           @opentelemetry/resources                       │
  │           @opentelemetry/semantic-conventions             │
  │           @opentelemetry/sdk-trace-node                  │
  │           @opentelemetry/exporter-trace-otlp-http        │
  │                                                          │
  │  Step 2: instrumentation.ts                              │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ export async function register() {               │    │
  │  │   if (process.env.NEXT_RUNTIME === 'nodejs') {   │    │
  │  │     await import('./instrumentation.node.ts')     │    │
  │  │   }                                              │    │
  │  │ }                                                │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  Step 3: instrumentation.node.ts                         │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ import { OTLPTraceExporter }                     │    │
  │  │   from '@opentelemetry/exporter-trace-otlp-http' │    │
  │  │ import { resourceFromAttributes }                │    │
  │  │   from '@opentelemetry/resources'                │    │
  │  │ import { NodeSDK }                               │    │
  │  │   from '@opentelemetry/sdk-node'                 │    │
  │  │ import { SimpleSpanProcessor }                   │    │
  │  │   from '@opentelemetry/sdk-trace-node'           │    │
  │  │ import { ATTR_SERVICE_NAME }                     │    │
  │  │   from '@opentelemetry/semantic-conventions'     │    │
  │  │                                                  │    │
  │  │ const sdk = new NodeSDK({                        │    │
  │  │   resource: resourceFromAttributes({             │    │
  │  │     [ATTR_SERVICE_NAME]: 'next-app',             │    │
  │  │   }),                                            │    │
  │  │   spanProcessor: new SimpleSpanProcessor(        │    │
  │  │     new OTLPTraceExporter()                      │    │
  │  │   ),                                             │    │
  │  │ })                                               │    │
  │  │ sdk.start()                                      │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  TẠI SAO check NEXT_RUNTIME?                            │
  │  → NodeSDK KHÔNG chạy trên Edge Runtime!              │
  │  → Edge = Cloudflare Workers, Vercel Edge Functions    │
  │  → Chỉ import NodeSDK khi runtime = 'nodejs'!       │
  │  → @vercel/otel TỰ xử lý điều này → recommend!     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Testing + Deployment!

```
  TESTING LOCALLY:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Cần OTel Collector + compatible backend!             │
  │     → Recommend: vercel/opentelemetry-collector-dev-setup│
  │     → Chạy local Jaeger/Grafana để xem traces!       │
  │                                                          │
  │  ② Root span = GET /requested/pathname                   │
  │     → Tất cả child spans nested bên trong!            │
  │                                                          │
  │  ③ Muốn XEM NHIỀU spans hơn?                           │
  │     NEXT_OTEL_VERBOSE=1                                  │
  │     → Bật chế độ verbose → trace nhiều hơn!          │
  │     → Default: chỉ emit spans quan trọng!             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  DEPLOYMENT OPTIONS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌──────────────────┬──────────────────────────────────┐   │
  │  │ Option           │ Details                          │   │
  │  ├──────────────────┼──────────────────────────────────┤   │
  │  │ Vercel           │ Built-in! Connect observability  │   │
  │  │                  │ provider trong dashboard!         │   │
  │  ├──────────────────┼──────────────────────────────────┤   │
  │  │ Self-hosted      │ Tự setup OTel Collector!         │   │
  │  │ + Collector      │ Collector nhận → xử lý → gửi │   │
  │  │                  │ đến backend (Jaeger/Grafana)    │   │
  │  ├──────────────────┼──────────────────────────────────┤   │
  │  │ Custom Exporter  │ KHÔNG cần Collector!             │   │
  │  │                  │ Direct export → backend!        │   │
  │  │                  │ Dùng @vercel/otel hoặc manual  │   │
  │  └──────────────────┴──────────────────────────────────┘   │
  │                                                            │
  │  FLOW:                                                     │
  │  App → [Collector (optional)] → Backend                  │
  │                                                            │
  │  Collector = TRUNG GIAN:                                   │
  │  → Batching (gom nhóm spans)                              │
  │  → Filtering (lọc bỏ spans không cần)                   │
  │  → Multi-export (gửi đến N backends cùng lúc!)         │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

---

## §4. Custom Spans — Tự Thêm Tracing!

```
  CUSTOM SPANS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Install: pnpm add @opentelemetry/api                    │
  │                                                          │
  │  Code:                                                   │
  │  ┌──────────────────────────────────────────────────┐    │
  │  │ import { trace } from '@opentelemetry/api'       │    │
  │  │                                                  │    │
  │  │ export async function fetchGithubStars() {       │    │
  │  │   return await trace                             │    │
  │  │     .getTracer('nextjs-example')                 │    │
  │  │     .startActiveSpan(                            │    │
  │  │       'fetchGithubStars',                        │    │
  │  │       async (span) => {                          │    │
  │  │         try {                                    │    │
  │  │           return await getValue()                │    │
  │  │         } finally {                              │    │
  │  │           span.end()  // ← PHẢI gọi!           │    │
  │  │         }                                        │    │
  │  │       }                                          │    │
  │  │     )                                            │    │
  │  │ }                                                │    │
  │  └──────────────────────────────────────────────────┘    │
  │                                                          │
  │  BREAKDOWN:                                               │
  │  ① trace.getTracer('name') → lấy/tạo tracer!         │
  │  ② .startActiveSpan('spanName', fn) → tạo + kích    │
  │     hoạt span!                                           │
  │  ③ span.end() → KẾT THÚC span! (PHẢI gọi!)         │
  │  ④ try/finally → đảm bảo span.end() luôn chạy!     │
  │  ⑤ Span tự động nested vào parent span hiện tại!     │
  │                                                          │
  │  TRACE RESULT:                                            │
  │  GET /api/stars (root)                                    │
  │   └── fetchGithubStars (custom!) ← 50ms                │
  │        └── fetch https://api.github.com (auto!) ← 45ms │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Default Spans — 11 Spans Next.js Tự Tạo!

```
  11 DEFAULT SPANS:
  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌───┬────────────────────────┬──────────────────────────┐ │
  │  │ # │ Span Name              │ span_type                │ │
  │  ├───┼────────────────────────┼──────────────────────────┤ │
  │  │ 1 │ [method] [route]       │ BaseServer.              │ │
  │  │   │ (ROOT SPAN!)           │ handleRequest            │ │
  │  │ 2 │ render route (app)     │ AppRender.               │ │
  │  │   │                        │ getBodyResult            │ │
  │  │ 3 │ fetch [method] [url]   │ AppRender.fetch          │ │
  │  │ 4 │ executing api route    │ AppRouteRouteHandlers.   │ │
  │  │   │ (app)                  │ runHandler               │ │
  │  │ 5 │ getServerSideProps     │ Render.                  │ │
  │  │   │                        │ getServerSideProps       │ │
  │  │ 6 │ getStaticProps         │ Render.                  │ │
  │  │   │                        │ getStaticProps           │ │
  │  │ 7 │ render route (pages)   │ Render.                  │ │
  │  │   │                        │ renderDocument           │ │
  │  │ 8 │ generateMetadata       │ ResolveMetadata.         │ │
  │  │   │                        │ generateMetadata         │ │
  │  │ 9 │ resolve page           │ NextNodeServer.          │ │
  │  │   │ components             │ findPageComponents       │ │
  │  │10 │ resolve segment        │ NextNodeServer.          │ │
  │  │   │ modules                │ getLayoutOrPageModule    │ │
  │  │11 │ start response         │ NextNodeServer.          │ │
  │  │   │ (zero-length!)         │ startResponse            │ │
  │  └───┴────────────────────────┴──────────────────────────┘ │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

```
  SPAN HIERARCHY (ví dụ App Router request):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  GET /products/123 (200) ─── ROOT (#1)                   │
  │   │  span_type: BaseServer.handleRequest                 │
  │   │  http.method: GET                                    │
  │   │  http.route: /products/[id]                          │
  │   │  http.status_code: 200                               │
  │   │                                                      │
  │   ├── resolve page components ─── (#9)                   │
  │   │    span_type: NextNodeServer.findPageComponents      │
  │   │                                                      │
  │   ├── resolve segment modules ─── (#10)                  │
  │   │    span_type: NextNodeServer.getLayoutOrPageModule   │
  │   │    next.segment: [id]                                │
  │   │                                                      │
  │   ├── generateMetadata [/products/[id]] ─── (#8)         │
  │   │    span_type: ResolveMetadata.generateMetadata       │
  │   │                                                      │
  │   ├── render route (app) [/products/[id]] ─── (#2)       │
  │   │    span_type: AppRender.getBodyResult                │
  │   │    │                                                 │
  │   │    └── fetch GET https://api/data ─── (#3)           │
  │   │         span_type: AppRender.fetch                   │
  │   │         http.url: https://api/data                   │
  │   │                                                      │
  │   └── start response ─── (#11, zero-length!)             │
  │        span_type: NextNodeServer.startResponse           │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
  SPAN DETAILS — TOP 4 QUAN TRỌNG NHẤT:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  #1 ROOT SPAN: [http.method] [next.route]                │
  │  → MỌI request đều có span này!                       │
  │  → Attributes: http.method, http.status_code,           │
  │    http.route, http.target, next.route                   │
  │                                                          │
  │  #2 render route (app): Rendering App Router page!       │
  │  → Thời gian render React component tree!              │
  │  → Nếu lâu → component tree quá phức tạp!          │
  │                                                          │
  │  #3 fetch: MỌI fetch() trong code!                      │
  │  → Attributes: http.method, http.url, net.peer.name    │
  │  → Tắt: NEXT_OTEL_FETCH_DISABLED=1                    │
  │  → Tắt khi dùng custom fetch instrumentation!         │
  │                                                          │
  │  #11 start response: First byte sent!                    │
  │  → Zero-length span! (đánh dấu thời điểm!)          │
  │  → TTFB (Time To First Byte) indicator!                │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. next Namespace — Custom Attributes!

```
  NEXT.JS CUSTOM ATTRIBUTES:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ┌─────────────────┬─────────────────────────────────┐   │
  │  │ Attribute        │ Ý nghĩa                        │   │
  │  ├─────────────────┼─────────────────────────────────┤   │
  │  │ next.span_name  │ Duplicate tên span (search!)   │   │
  │  │ next.span_type  │ Unique ID cho loại span!       │   │
  │  │                 │ (e.g. BaseServer.handleRequest) │   │
  │  │ next.route      │ Route pattern!                  │   │
  │  │                 │ (e.g. /products/[id])           │   │
  │  │ next.rsc        │ true/false — RSC request?       │   │
  │  │                 │ (prefetch hay page load?)       │   │
  │  │ next.page       │ Internal: file path!            │   │
  │  │                 │ (page.ts, layout.ts, etc.)      │   │
  │  │                 │ Cần pair với next.route!       │   │
  │  │ next.segment    │ Route segment hiện tại!        │   │
  │  │                 │ (e.g. [id])                     │   │
  │  └─────────────────┴─────────────────────────────────┘   │
  │                                                          │
  │  next.page CAVEAT:                                        │
  │  /layout → /(groupA)/layout.ts HAY /(groupB)/layout.ts? │
  │  → PHẢI kết hợp next.route mới biết chính xác!       │
  │                                                          │
  │  ENV VARIABLES:                                           │
  │  ┌──────────────────────────┬────────────────────────┐    │
  │  │ Variable                 │ Effect                 │    │
  │  ├──────────────────────────┼────────────────────────┤    │
  │  │ NEXT_OTEL_VERBOSE=1      │ Emit NHIỀU spans hơn! │    │
  │  │ NEXT_OTEL_FETCH_DISABLED │ Tắt auto fetch span! │    │
  │  │ =1                       │                        │    │
  │  └──────────────────────────┴────────────────────────┘    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — OpenTelemetryEngine!

```javascript
var OpenTelemetryEngine = (function () {
  // ═══════════════════════════════════
  // 1. SPAN DATA STRUCTURE
  // ═══════════════════════════════════
  var spanIdCounter = 0;
  var allSpans = [];
  var activeSpanStack = [];

  function createSpan(name, attributes) {
    spanIdCounter++;
    var parentId =
      activeSpanStack.length > 0
        ? activeSpanStack[activeSpanStack.length - 1].id
        : null;
    var span = {
      id: "span-" + spanIdCounter,
      name: name,
      parentId: parentId,
      attributes: attributes || {},
      startTime: Date.now(),
      endTime: null,
      duration: null,
      status: "ACTIVE",
    };
    allSpans.push(span);
    return span;
  }

  function endSpan(span) {
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = "ENDED";
  }

  // ═══════════════════════════════════
  // 2. TRACER
  // ═══════════════════════════════════
  var tracers = {};

  function getTracer(name) {
    if (!tracers[name]) {
      tracers[name] = { name: name };
    }
    return {
      startActiveSpan: function (spanName, fn) {
        var span = createSpan(spanName, {
          "tracer.name": name,
        });
        activeSpanStack.push(span);
        try {
          return fn(span);
        } finally {
          activeSpanStack.pop();
          if (span.status === "ACTIVE") endSpan(span);
        }
      },
    };
  }

  // ═══════════════════════════════════
  // 3. NEXT.JS DEFAULT SPANS SIMULATOR
  // ═══════════════════════════════════
  var SPAN_TYPES = {
    handleRequest: "BaseServer.handleRequest",
    renderRouteApp: "AppRender.getBodyResult",
    fetch: "AppRender.fetch",
    apiRoute: "AppRouteRouteHandlers.runHandler",
    getSSP: "Render.getServerSideProps",
    getSSG: "Render.getStaticProps",
    renderRoutePages: "Render.renderDocument",
    generateMetadata: "ResolveMetadata.generateMetadata",
    resolvePageComponents: "NextNodeServer.findPageComponents",
    resolveSegmentModules: "NextNodeServer.getLayoutOrPageModule",
    startResponse: "NextNodeServer.startResponse",
  };

  function simulateRequest(method, route, options) {
    options = options || {};
    allSpans = [];
    activeSpanStack = [];

    // Root span: [method] [route]
    var root = createSpan(method + " " + route, {
      "http.method": method,
      "http.route": route,
      "http.target": options.target || route,
      "http.status_code": options.status || 200,
      "next.span_type": SPAN_TYPES.handleRequest,
      "next.route": route,
    });
    activeSpanStack.push(root);

    // resolve page components
    var resolve = createSpan("resolve page components", {
      "next.span_type": SPAN_TYPES.resolvePageComponents,
      "next.route": route,
    });
    endSpan(resolve);

    // resolve segment modules
    var segments = route.split("/").filter(Boolean);
    for (var i = 0; i < segments.length; i++) {
      var seg = createSpan("resolve segment modules", {
        "next.span_type": SPAN_TYPES.resolveSegmentModules,
        "next.segment": segments[i],
      });
      endSpan(seg);
    }

    // generateMetadata
    var meta = createSpan("generateMetadata " + route, {
      "next.span_type": SPAN_TYPES.generateMetadata,
      "next.page": route,
    });
    endSpan(meta);

    // render route (app)
    var render = createSpan("render route (app) " + route, {
      "next.span_type": SPAN_TYPES.renderRouteApp,
      "next.route": route,
    });
    activeSpanStack.push(render);

    // Simulate fetches
    var fetches = options.fetches || [];
    for (var j = 0; j < fetches.length; j++) {
      var f = createSpan("fetch GET " + fetches[j], {
        "next.span_type": SPAN_TYPES.fetch,
        "http.method": "GET",
        "http.url": fetches[j],
      });
      endSpan(f);
    }

    activeSpanStack.pop();
    endSpan(render);

    // start response (zero-length!)
    var resp = createSpan("start response", {
      "next.span_type": SPAN_TYPES.startResponse,
    });
    resp.duration = 0;
    endSpan(resp);

    activeSpanStack.pop();
    endSpan(root);

    return allSpans;
  }

  // ═══════════════════════════════════
  // 4. EXPORTER
  // ═══════════════════════════════════
  function exportSpans(spans, format) {
    if (format === "console") {
      for (var i = 0; i < spans.length; i++) {
        var s = spans[i];
        var indent = "";
        var parent = s.parentId;
        while (parent) {
          indent += "  ";
          var found = null;
          for (var j = 0; j < spans.length; j++) {
            if (spans[j].id === parent) {
              found = spans[j];
              break;
            }
          }
          parent = found ? found.parentId : null;
        }
        console.log(
          indent +
            "├── " +
            s.name +
            " [" +
            (s.duration || 0) +
            "ms]" +
            " (" +
            (s.attributes["next.span_type"] || "") +
            ")",
        );
      }
    }
    if (format === "otlp") {
      return {
        resourceSpans: [
          {
            resource: {
              attributes: [{ key: "service.name", value: "next-app" }],
            },
            scopeSpans: [
              {
                spans: spans.map(function (s) {
                  return {
                    traceId: "trace-001",
                    spanId: s.id,
                    parentSpanId: s.parentId,
                    name: s.name,
                    startTimeUnixNano: s.startTime * 1e6,
                    endTimeUnixNano: (s.endTime || s.startTime) * 1e6,
                    attributes: s.attributes,
                  };
                }),
              },
            ],
          },
        ],
      };
    }
  }

  // ═══════════════════════════════════
  // 5. DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log("╔════════════════════════════════════╗");
    console.log("║  OPENTELEMETRY ENGINE DEMO          ║");
    console.log("╚════════════════════════════════════╝");

    // Scenario 1: App Router page with fetches
    console.log("\n── Scenario 1: GET /products/123 ──");
    var spans = simulateRequest("GET", "/products/[id]", {
      target: "/products/123",
      status: 200,
      fetches: [
        "https://api.example.com/products/123",
        "https://api.example.com/reviews?product=123",
      ],
    });
    exportSpans(spans, "console");

    // Scenario 2: Custom span
    console.log("\n── Scenario 2: Custom Span ──");
    allSpans = [];
    activeSpanStack = [];
    var tracer = getTracer("my-app");
    tracer.startActiveSpan("fetchGithubStars", function (span) {
      span.attributes["github.repo"] = "vercel/next.js";
      tracer.startActiveSpan("parseResponse", function (child) {
        child.attributes["parsed.count"] = 120000;
        endSpan(child);
      });
      endSpan(span);
    });
    exportSpans(allSpans, "console");

    // Scenario 3: Span types catalog
    console.log("\n── Scenario 3: All Span Types ──");
    for (var key in SPAN_TYPES) {
      console.log("  " + key + ": " + SPAN_TYPES[key]);
    }
  }

  return { demo: demo };
})();
// Chạy: OpenTelemetryEngine.demo();
```

---

## §8. Câu Hỏi Luyện Tập!

**Câu 1**: @vercel/otel vs Manual NodeSDK — khi nào dùng gì?

<details><summary>Đáp án</summary>

|                   | @vercel/otel                                                  | Manual NodeSDK                                                                                    |
| ----------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Dùng khi**      | Hầu hết trường hợp!                                           | Cần full customization                                                                            |
| **Packages**      | 4 (`@vercel/otel`, `sdk-logs`, `api-logs`, `instrumentation`) | 5 (`sdk-node`, `resources`, `semantic-conventions`, `sdk-trace-node`, `exporter-trace-otlp-http`) |
| **Setup**         | 3 dòng (registerOTel!)                                        | 15+ dòng (NodeSDK, Exporter, Processor...)                                                        |
| **Edge Runtime**  | ✅ Hỗ trợ!                                                    | ❌ Chỉ Node.js!                                                                                   |
| **Files**         | 1 (`instrumentation.ts`)                                      | 2 (`instrumentation.ts` + `instrumentation.node.ts`)                                              |
| **Runtime check** | Tự động!                                                      | Phải check `NEXT_RUNTIME === 'nodejs'` thủ công!                                                  |

**Rule**: Dùng `@vercel/otel` trừ khi cần custom span processor, custom exporter không standard, hoặc cần modify features mà `@vercel/otel` không expose.

</details>

---

**Câu 2**: 11 default spans — liệt kê 4 quan trọng nhất và giải thích?

<details><summary>Đáp án</summary>

1. **`[http.method] [next.route]`** (ROOT span!):
   - `span_type: BaseServer.handleRequest`
   - Mọi request đều có! Tracks method, route, status code
   - Tất cả spans khác nested bên trong

2. **`render route (app)`**:
   - `span_type: AppRender.getBodyResult`
   - Thời gian render React component tree trong App Router
   - Lâu = component tree phức tạp hoặc có blocking data fetch

3. **`fetch [method] [url]`**:
   - `span_type: AppRender.fetch`
   - MỌI `fetch()` call trong code đều được track!
   - Tắt: `NEXT_OTEL_FETCH_DISABLED=1` (khi dùng custom instrumentation)

4. **`start response`**:
   - `span_type: NextNodeServer.startResponse`
   - **Zero-length** span! Đánh dấu thời điểm first byte sent
   - = TTFB indicator (Time To First Byte)

</details>

---

**Câu 3**: NEXT_OTEL_VERBOSE=1 và NEXT_OTEL_FETCH_DISABLED=1 làm gì?

<details><summary>Đáp án</summary>

| Env Variable                 | Effect                                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_OTEL_VERBOSE=1`        | Emit **NHIỀU spans hơn** mặc định! Default chỉ emit spans quan trọng. Bật verbose → tất cả internal spans (resolve modules, find components...)                                  |
| `NEXT_OTEL_FETCH_DISABLED=1` | **Tắt** auto fetch span instrumentation! Dùng khi bạn đã có **custom fetch instrumentation library** riêng (e.g. `@opentelemetry/instrumentation-fetch`). Tránh duplicate spans! |

</details>

---

**Câu 4**: Custom span — viết code tạo custom span cho database query?

<details><summary>Đáp án</summary>

```typescript
import { trace } from "@opentelemetry/api";

export async function queryProducts(category: string) {
  return await trace
    .getTracer("my-app") // ① Tạo/lấy tracer
    .startActiveSpan(
      "queryProducts", // ② Tên span
      async (span) => {
        try {
          span.setAttribute("db.system", "postgresql");
          span.setAttribute("db.operation", "SELECT");
          span.setAttribute("db.table", "products");
          span.setAttribute("query.category", category);

          const result = await db.query(
            "SELECT * FROM products WHERE category = $1",
            [category],
          );

          span.setAttribute("db.row_count", result.length);
          return result;
        } catch (error) {
          span.setStatus({
            // ④ Set error status!
            code: 2, // ERROR
            message: error.message,
          });
          throw error;
        } finally {
          span.end(); // ③ PHẢI gọi span.end()!
        }
      },
    );
}
```

**Key points**:

- `getTracer('name')` → namespace cho spans
- `startActiveSpan` → auto parent-child nesting!
- `span.end()` → **BẮT BUỘC** trong `finally`
- `span.setAttribute()` → thêm context cho debugging
- `span.setStatus({ code: 2 })` → đánh dấu error

</details>
