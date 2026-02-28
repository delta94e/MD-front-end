# Interview Two Side — Deep Dive

> 📅 2026-02-14 · ⏱ 20 phút đọc
>
> let/var/const, HTTP Headers, Keep-Alive, CORS Solutions,
> Webpack Optimization, HTTP Methods, TypeScript vs JavaScript,
> type vs interface, React Optimization, Merge Intervals
> Độ khó: ⭐️⭐️⭐️⭐️ | Frontend Interview Round 2

---

## Mục Lục

| #   | Phần                                    |
| --- | --------------------------------------- |
| 1   | Giới thiệu khó khăn trong dự án         |
| 2   | let, var, const — Khác biệt             |
| 3   | HTTP Headers bạn biết                   |
| 4   | Duy trì kết nối với Server (Keep-Alive) |
| 5   | Giải quyết vấn đề Cross-Origin (CORS)   |
| 6   | Tối ưu Webpack                          |
| 7   | HTTP Methods — Chức năng & Khác biệt    |
| 8   | TypeScript vs JavaScript                |
| 9   | Các Types trong TypeScript              |
| 10  | type vs interface trong TypeScript      |
| 11  | Tối ưu React                            |
| 12  | Algorithm: Merge disordered intervals   |

---

## §1. Giới thiệu khó khăn trong dự án

```
FRAMEWORK TRẢ LỜI — STAR METHOD:
═══════════════════════════════════════════════════════════════

  S — Situation: Bối cảnh dự án, team, tech stack
  T — Task: Nhiệm vụ cụ thể, vấn đề gặp phải
  A — Action: Những bước bạn ĐÃ LÀM để giải quyết
  R — Result: Kết quả đạt được (CÓ SỐ LIỆU!)

  VÍ DỤ CÁC LOẠI KHÓ KHĂN:

  ① PERFORMANCE:
  → "LCP 4s → tối ưu code splitting, lazy loading,
     image optimization → giảm xuống 1.2s"

  ② KIẾN TRÚC:
  → "Monolith FE → micro-frontend, module federation,
     giảm build time 70%, deploy độc lập"

  ③ TƯƠNG THÍCH:
  → "Hỗ trợ IE11 + mobile → polyfill strategy,
     responsive design, progressive enhancement"

  ④ REAL-TIME:
  → "Chat + notification system → WebSocket + Redux,
     xử lý reconnect, message queue, offline support"

  ⚠️ TIPS:
  → Chọn khó khăn THẬT SỰ (không quá đơn giản!)
  → Nhấn mạnh BẠN đã làm gì (không phải team!)
  → Kết quả CÓ SỐ → giảm X%, tăng Y%, tiết kiệm Z giờ!
  → Chuẩn bị 2-3 câu chuyện KHÁC NHAU!
```

---

## §2. let, var, const — Khác biệt

```
let vs var vs const — SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌───────────────────┬─────────┬─────────┬──────────────────┐
  │ Tiêu chí          │ var     │ let     │ const             │
  ├───────────────────┼─────────┼─────────┼──────────────────┤
  │ Scope             │ Function│ Block   │ Block              │
  │                   │ scope!  │ scope!  │ scope!             │
  ├───────────────────┼─────────┼─────────┼──────────────────┤
  │ Hoisting          │ CÓ! ✅  │ CÓ!    │ CÓ!               │
  │                   │ init =  │ NHƯNG   │ NHƯNG              │
  │                   │ undefined│ TDZ! ❌ │ TDZ! ❌           │
  ├───────────────────┼─────────┼─────────┼──────────────────┤
  │ Re-declare        │ ĐÃ✅    │ ❌      │ ❌ Lỗi!           │
  │ (cùng scope)      │         │ Lỗi!   │                    │
  ├───────────────────┼─────────┼─────────┼──────────────────┤
  │ Re-assign         │ ✅      │ ✅      │ ❌ Lỗi!           │
  │                   │         │         │ (binding bất biến!)│
  ├───────────────────┼─────────┼─────────┼──────────────────┤
  │ Global object     │ ✅      │ ❌      │ ❌                 │
  │ (window.xxx)      │ Thêm vào│Không!   │ Không!             │
  │                   │ window! │         │                    │
  └───────────────────┴─────────┴─────────┴──────────────────┘
```

```javascript
// ═══ SCOPE — Function vs Block ═══

// VAR: function scope!
function varScope() {
  if (true) {
    var x = 10;
  }
  console.log(x); // 10! ← TRUY CẬP ĐƯỢC ngoài if! 😱
}

// LET/CONST: block scope!
function letScope() {
  if (true) {
    let y = 10;
    const z = 20;
  }
  console.log(y); // ReferenceError! ← KHÔNG truy cập ngoài block!
}
```

```javascript
// ═══ HOISTING & TDZ (Temporal Dead Zone) ═══

// VAR hoisting: biến được nâng lên ĐẦU function, init = undefined!
console.log(a); // undefined (không lỗi!)
var a = 5;
// Tương đương:
// var a;          ← hoisted!
// console.log(a); // undefined
// a = 5;

// LET/CONST hoisting: CÓ hoist NHƯNG vào TDZ!
console.log(b); // ReferenceError: Cannot access 'b' before initialization!
let b = 5;
// → let/const BỊ HOIST nhưng KHÔNG được khởi tạo!
// → Từ đầu scope đến dòng khai báo = TDZ!
// → Truy cập trong TDZ → ReferenceError!
```

```javascript
// ═══ CONST — Binding bất biến, NOT value bất biến! ═══

const num = 42;
num = 100; // ❌ TypeError: Assignment to constant variable!

// NHƯNG:
const obj = { name: "John" };
obj.name = "Jane"; // ✅ OK! Object MUTABLE!
obj.age = 30; // ✅ OK! Thêm property!
obj = {}; // ❌ TypeError! KHÔNG thể re-assign binding!

const arr = [1, 2, 3];
arr.push(4); // ✅ OK! Array MUTABLE!
arr = []; // ❌ TypeError!

// → const chỉ khóa BINDING (tham chiếu)!
// → KHÔNG khóa VALUE bên trong!
// → Muốn freeze value → Object.freeze()!
```

---

## §3. HTTP Headers bạn biết

```
HTTP HEADERS — PHÂN LOẠI:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ ① GENERAL HEADERS (chung cho Request + Response):        │
  ├──────────────────────────────────────────────────────────┤
  │ Cache-Control: no-cache / max-age=3600 / no-store        │
  │ → Kiểm soát caching!                                    │
  │ Connection: keep-alive / close                           │
  │ → Duy trì kết nối hay đóng sau response!                 │
  │ Date: Wed, 14 Feb 2026 08:00:00 GMT                     │
  │ → Thời gian tạo message!                                 │
  └──────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │ ② REQUEST HEADERS (client gửi lên):                      │
  ├──────────────────────────────────────────────────────────┤
  │ Accept: application/json, text/html                      │
  │ → Loại content CLIENT CHẤP NHẬN!                         │
  │ Accept-Encoding: gzip, deflate, br                       │
  │ → Encoding client hỗ trợ (nén!)                          │
  │ Accept-Language: vi-VN, en-US                            │
  │ → Ngôn ngữ ưu tiên!                                     │
  │ Authorization: Bearer <token>                            │
  │ → Xác thực! JWT token!                                   │
  │ Cookie: session_id=abc123                                │
  │ → Gửi cookies lên server!                                │
  │ Host: www.example.com                                    │
  │ → Tên miền đích! (BẮT BUỘC trong HTTP/1.1!)             │
  │ Origin: https://mysite.com                               │
  │ → Nguồn gốc request! (dùng cho CORS!)                   │
  │ Referer: https://mysite.com/page1                        │
  │ → Trang trước đó (URL referer!)                          │
  │ User-Agent: Mozilla/5.0...                               │
  │ → Thông tin browser/device!                              │
  │ If-None-Match: "etag-value"                              │
  │ → Conditional request (304 Not Modified!)                 │
  │ If-Modified-Since: Wed, 14 Feb 2026 00:00:00 GMT        │
  │ → Conditional request theo thời gian!                     │
  └──────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │ ③ RESPONSE HEADERS (server trả về):                      │
  ├──────────────────────────────────────────────────────────┤
  │ Content-Type: application/json; charset=utf-8            │
  │ → Loại nội dung response!                                │
  │ Content-Length: 1234                                     │
  │ → Kích thước body (bytes!)                               │
  │ Content-Encoding: gzip                                   │
  │ → Response đã nén bằng gzip!                             │
  │ Set-Cookie: session_id=abc123; HttpOnly; Secure          │
  │ → Set cookie cho client!                                  │
  │ ETag: "abc123"                                           │
  │ → Fingerprint tài nguyên (caching!)                      │
  │ Last-Modified: Wed, 14 Feb 2026 00:00:00 GMT            │
  │ → Thời gian sửa đổi cuối (caching!)                     │
  │ Location: https://example.com/new-page                   │
  │ → Redirect URL! (dùng với 301/302!)                      │
  │ Access-Control-Allow-Origin: *                           │
  │ → CORS header! Cho phép origin nào!                      │
  │ Access-Control-Allow-Methods: GET, POST, PUT             │
  │ → CORS: methods được phép!                               │
  │ Access-Control-Allow-Headers: Content-Type, Authorization│
  │ → CORS: headers được phép!                               │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Duy trì kết nối với Server (Keep-Alive)

```
KEEP-ALIVE & CÁC PHƯƠNG PHÁP:
═══════════════════════════════════════════════════════════════

  ① HTTP KEEP-ALIVE (Persistent Connection):
  ┌────────────────────────────────────────────────────────┐
  │ Connection: keep-alive                                 │
  │ Keep-Alive: timeout=5, max=100                         │
  │                                                        │
  │ HTTP/1.0: mỗi request = 1 TCP connection → ĐÓNG!       │
  │ HTTP/1.1: keep-alive MẶC ĐỊNH! Tái sử dụng TCP!       │
  │           nhiều requests qua CÙNG connection!           │
  │ HTTP/2:   multiplexing! TẤT CẢ qua 1 TCP connection!  │
  └────────────────────────────────────────────────────────┘

  ② WEBSOCKET:
  ┌────────────────────────────────────────────────────────┐
  │ → Full-duplex! Hai chiều liên tục!                     │
  │ → ws:// hoặc wss:// protocol!                          │
  │ → Client + Server gửi data BẤT KỲ LÚC NÀO!           │
  │ → Dùng cho: chat, gaming, real-time!                   │
  └────────────────────────────────────────────────────────┘

  ③ SERVER-SENT EVENTS (SSE):
  ┌────────────────────────────────────────────────────────┐
  │ → Một chiều: Server → Client!                          │
  │ → HTTP streaming! Auto-reconnect!                      │
  │ → Dùng cho: notifications, live feeds!                  │
  └────────────────────────────────────────────────────────┘

  ④ LONG POLLING:
  ┌────────────────────────────────────────────────────────┐
  │ → Client gửi request → server GIỮ đến khi có data!     │
  │ → Trả response → client gửi request MỚI ngay!          │
  │ → Giả real-time! Đơn giản hơn WebSocket!               │
  └────────────────────────────────────────────────────────┘

  ⑤ HEARTBEAT:
  ┌────────────────────────────────────────────────────────┐
  │ → Gửi "ping" định kỳ để giữ connection sống!           │
  │ → WebSocket: built-in ping/pong frames!                 │
  │ → Phát hiện connection bị chết sớm!                     │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Giải quyết vấn đề Cross-Origin (CORS)

```
CÁC PHƯƠNG PHÁP GIẢI QUYẾT CROSS-ORIGIN:
═══════════════════════════════════════════════════════════════

  ① CORS Headers (PHỔ BIẾN NHẤT!):
  ┌────────────────────────────────────────────────────────┐
  │ Server set headers:                                     │
  │ Access-Control-Allow-Origin: https://frontend.com      │
  │ Access-Control-Allow-Methods: GET, POST, PUT, DELETE   │
  │ Access-Control-Allow-Headers: Content-Type, Authorization│
  │ Access-Control-Allow-Credentials: true                 │
  │                                                        │
  │ Preflight (OPTIONS request):                           │
  │ → Browser TỰ ĐỘNG gửi trước khi gửi request thật!      │
  │ → Kiểm tra server có cho phép không!                    │
  │ → Simple requests (GET/POST form-data) KHÔNG cần!      │
  └────────────────────────────────────────────────────────┘

  ② PROXY SERVER (Frontend Dev thường dùng!):
  ┌────────────────────────────────────────────────────────┐
  │ // vite.config.js hoặc webpack devServer:              │
  │ proxy: {                                               │
  │     '/api': {                                          │
  │         target: 'https://backend.com',                 │
  │         changeOrigin: true,                            │
  │         rewrite: (path) => path.replace(/^\/api/, '') │
  │     }                                                  │
  │ }                                                      │
  │                                                        │
  │ → Dev: proxy qua dev server! (same-origin!)             │
  │ → Prod: Nginx reverse proxy!                            │
  └────────────────────────────────────────────────────────┘

  ③ JSONP (Cách cũ, chỉ GET!):
  ┌────────────────────────────────────────────────────────┐
  │ → Lợi dụng <script> tag KHÔNG bị same-origin policy!   │
  │ → Server trả về: callback({ data })                     │
  │ → Client định nghĩa function callback sẵn!             │
  │ → ⚠️ CHỈ HỖ TRỢ GET! Không an toàn! Ít dùng!         │
  └────────────────────────────────────────────────────────┘

  ④ NGINX REVERSE PROXY:
  ┌────────────────────────────────────────────────────────┐
  │ location /api/ {                                       │
  │     proxy_pass https://backend.com/;                   │
  │ }                                                      │
  │ → Client request → Nginx (same-origin) → Backend!     │
  │ → Backend response → Nginx → Client!                   │
  │ → Client KHÔNG biết backend URL thật!                  │
  └────────────────────────────────────────────────────────┘

  ⑤ postMessage (Cross-origin iframes!):
  ┌────────────────────────────────────────────────────────┐
  │ // Parent → iframe:                                    │
  │ iframe.contentWindow.postMessage(data, targetOrigin);  │
  │ // iframe → Parent:                                    │
  │ window.parent.postMessage(data, targetOrigin);         │
  │ // Nhận:                                               │
  │ window.addEventListener('message', (e) => {            │
  │     if (e.origin === 'https://trusted.com') { ... }    │
  │ });                                                    │
  └────────────────────────────────────────────────────────┘

  ⑥ document.domain (Cùng parent domain!):
  ┌────────────────────────────────────────────────────────┐
  │ // a.example.com + b.example.com:                      │
  │ document.domain = 'example.com';                       │
  │ → Cả 2 subdomain truy cập được nhau!                  │
  │ → ⚠️ ĐÃ BỊ DEPRECATED! Không khuyến khích!           │
  └────────────────────────────────────────────────────────┘
```

---

## §6. Tối ưu Webpack

```
WEBPACK OPTIMIZATION — 3 CHIỀU:
═══════════════════════════════════════════════════════════════

  ① TỐI ƯU TỐC ĐỘ BUILD:
  ┌────────────────────────────────────────────────────────┐
  │ a) cache: filesystem                                   │
  │ → Cache build results! Rebuild NHANH hơn!              │
  │ module.exports = { cache: { type: 'filesystem' } }     │
  │                                                        │
  │ b) thread-loader / parallel processing                 │
  │ → Chạy loaders trên NHIỀU THREADS!                     │
  │ { loader: 'thread-loader', options: { workers: 4 } }  │
  │                                                        │
  │ c) include/exclude trong loaders                       │
  │ → CHỈ process files CẦN THIẾT!                         │
  │ { test: /\.js$/, include: /src/, exclude: /node_modules/}│
  │                                                        │
  │ d) resolve.extensions minimize                         │
  │ → Giảm số extensions Webpack thử!                       │
  │ resolve: { extensions: ['.js', '.jsx', '.ts', '.tsx'] }│
  │                                                        │
  │ e) noParse                                             │
  │ → Skip parsing cho thư viện KHÔNG có dependencies!      │
  │ module: { noParse: /jquery|lodash/ }                   │
  └────────────────────────────────────────────────────────┘

  ② TỐI ƯU DUNG LƯỢNG BUNDLE:
  ┌────────────────────────────────────────────────────────┐
  │ a) Code Splitting (SplitChunksPlugin!)                 │
  │ → Tách vendor code ra chunk riêng!                      │
  │ → Dynamic import() cho lazy loading!                    │
  │                                                        │
  │ optimization: {                                        │
  │     splitChunks: {                                     │
  │         chunks: 'all',                                 │
  │         cacheGroups: {                                 │
  │             vendor: {                                  │
  │                 test: /node_modules/,                   │
  │                 name: 'vendors',                        │
  │                 chunks: 'all'                           │
  │             }                                          │
  │         }                                              │
  │     }                                                  │
  │ }                                                      │
  │                                                        │
  │ b) Tree Shaking                                        │
  │ → Loại bỏ code KHÔNG sử dụng!                          │
  │ → mode: 'production' TỰ ĐỘNG bật!                     │
  │ → Cần: ES Modules (import/export)!                     │
  │ → sideEffects: false trong package.json!               │
  │                                                        │
  │ c) Minification (TerserPlugin!)                        │
  │ → Nén JS: bỏ comments, rút gọn biến!                  │
  │ → Production mode TỰ ĐỘNG!                            │
  │                                                        │
  │ d) Compression (gzip/brotli!)                          │
  │ → CompressionWebpackPlugin!                            │
  │ → Giảm 60-80% kích thước!                              │
  │                                                        │
  │ e) Externals                                           │
  │ → Loại libraries lớn ra khỏi bundle!                   │
  │ → Load từ CDN!                                          │
  │ externals: { react: 'React', 'react-dom': 'ReactDOM' }│
  │                                                        │
  │ f) Bundle Analyzer                                     │
  │ → webpack-bundle-analyzer!                             │
  │ → Phân tích SIZE từng module! Tìm "thủ phạm" lớn!     │
  └────────────────────────────────────────────────────────┘

  ③ TỐI ƯU RUNTIME / LOADING:
  ┌────────────────────────────────────────────────────────┐
  │ a) Lazy Loading (Dynamic import!)                      │
  │ const Page = React.lazy(() => import('./Page'));        │
  │                                                        │
  │ b) Prefetch / Preload                                  │
  │ import(/* webpackPrefetch: true */ './NextPage');       │
  │ → Browser tải TRƯỚC khi user cần!                      │
  │                                                        │
  │ c) Content Hashing (Long-term caching!)                │
  │ output: { filename: '[name].[contenthash].js' }        │
  │ → File thay đổi → hash MỚI! Không thay đổi → cache!  │
  │                                                        │
  │ d) Module Federation (Micro-frontend!)                 │
  │ → Chia sẻ modules giữa các ứng dụng!                   │
  │ → Không cần rebuild toàn bộ!                           │
  └────────────────────────────────────────────────────────┘
```

---

## §7. HTTP Methods — Chức năng & Khác biệt

```
HTTP METHODS:
═══════════════════════════════════════════════════════════════

  ┌─────────┬───────────────┬────────┬────────┬───────────────┐
  │ Method  │ Chức năng     │ Body?  │ Idem-  │ Ghi chú        │
  │         │               │        │ potent?│                │
  ├─────────┼───────────────┼────────┼────────┼───────────────┤
  │ GET     │ LẤY tài nguyên│ ❌     │ ✅     │ Cacheable!     │
  │         │               │        │        │ Params ở URL!  │
  ├─────────┼───────────────┼────────┼────────┼───────────────┤
  │ POST    │ TẠO MỚI       │ ✅     │ ❌     │ Không cache!   │
  │         │ tài nguyên    │        │        │ Data ở body!   │
  ├─────────┼───────────────┼────────┼────────┼───────────────┤
  │ PUT     │ THAY THẾ      │ ✅     │ ✅     │ Toàn bộ       │
  │         │ hoàn toàn     │        │        │ resource!      │
  ├─────────┼───────────────┼────────┼────────┼───────────────┤
  │ PATCH   │ CẬP NHẬT      │ ✅     │ ❌     │ Một phần       │
  │         │ một phần      │        │        │ resource!      │
  ├─────────┼───────────────┼────────┼────────┼───────────────┤
  │ DELETE  │ XÓA tài nguyên│ Opt.   │ ✅     │ Xóa resource!  │
  ├─────────┼───────────────┼────────┼────────┼───────────────┤
  │ HEAD    │ Như GET nhưng  │ ❌     │ ✅     │ Chỉ headers!   │
  │         │ KHÔNG body!   │        │        │ Check exist!   │
  ├─────────┼───────────────┼────────┼────────┼───────────────┤
  │ OPTIONS │ Hỏi server    │ ❌     │ ✅     │ CORS preflight!│
  │         │ supports gì?  │        │        │                │
  └─────────┴───────────────┴────────┴────────┴───────────────┘

  IDEMPOTENT = Gọi 1 lần hay N lần → KẾT QUẢ GIỐNG NHAU!
  → GET: lấy data 5 lần → cùng kết quả! ✅
  → POST: tạo 5 lần → 5 records MỚI! ❌
  → PUT: thay thế 5 lần → kết quả GIỐ NG! ✅
  → DELETE: xóa 5 lần → resource ĐÃ XÓA từ lần 1! ✅

  GET vs POST:
  → GET: data ở URL (query string), giới hạn ~2KB, CACHEABLE!
  → POST: data ở body, KHÔNG giới hạn, KHÔNG cache!
  → GET: bookmark được, POST: không!
  → GET: KHÔNG nên có side effects, POST: có!

  PUT vs PATCH:
  → PUT: gửi TOÀN BỘ resource mới → thay thế hoàn toàn!
  → PATCH: gửi CHỈ fields cần sửa → cập nhật một phần!
  → PUT { name: 'John', age: 31 } → thay thế!
  → PATCH { age: 31 } → chỉ sửa age!
```

---

## §8. TypeScript vs JavaScript

```
TYPESCRIPT vs JAVASCRIPT:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────┬──────────────────────┐
  │ Tiêu chí        │ JavaScript       │ TypeScript            │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Typing          │ Dynamic! ❌      │ Static! ✅            │
  │                 │ Runtime errors!  │ Compile-time errors!  │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Type checking   │ Không có!        │ CÓ! tsc compiler!    │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Compile         │ Trực tiếp chạy!  │ TS → JS → chạy!      │
  │                 │                  │ Cần compile!          │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Superset        │ Là gốc!          │ SUPERSET của JS!      │
  │                 │                  │ Mọi JS = TS hợp lệ!  │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ IDE Support     │ Cơ bản          │ MẠNH! Autocomplete,   │
  │                 │                  │ refactor, navigation! │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Generic         │ Không có!        │ CÓ! <T> generics!    │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Enum            │ Không có built-in│ CÓ! enum keyword!    │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Interface       │ Không có!        │ CÓ! interface keyword│
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Decorator       │ Stage 3 proposal │ CÓ! experimentalDeco-│
  │                 │                  │ rators!               │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Learning curve  │ Thấp!           │ Cao hơn!              │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Ecosystem       │ Rộng nhất!       │ Rộng! DefinitelyTyped│
  └─────────────────┴──────────────────┴──────────────────────┘

  TS ƯU ĐIỂM:
  → Phát hiện lỗi TRƯỚC khi chạy! (compile-time!)
  → Code DOCUMENTATION sống! Types = docs!
  → Refactoring AN TOÀN! IDE hỗ trợ mạnh!
  → Team collaboration TỐT hơn! Types = contract!

  TS NHƯỢC ĐIỂM:
  → Cần compile! (chậm hơn dev loop!)
  → Learning curve! (generics, conditional types!)
  → Boilerplate nhiều hơn! (type annotations!)
  → Third-party libs có thể thiếu types!
```

---

## §9. Các Types trong TypeScript

```typescript
// ═══ BASIC TYPES ═══

let str: string = "hello";
let num: number = 42;
let bool: boolean = true;
let n: null = null;
let u: undefined = undefined;
let sym: symbol = Symbol("id");
let big: bigint = 100n;

// ═══ SPECIAL TYPES ═══

let any_val: any = "anything"; // Bỏ qua type checking! ⚠️
let unknown_val: unknown = 42; // An toàn hơn any! Phải kiểm tra trước khi dùng!
let void_val: void = undefined; // Functions không return!
let never_val: never; // KHÔNG BAO GIỜ có giá trị! (throw, infinite loop!)
```

```typescript
// ═══ OBJECT TYPES ═══

// Array:
let arr1: number[] = [1, 2, 3];
let arr2: Array<string> = ["a", "b"];

// Tuple:
let tuple: [string, number] = ["hello", 42];

// Object:
let obj: { name: string; age: number } = { name: "John", age: 30 };

// Enum:
enum Direction {
  Up,
  Down,
  Left,
  Right,
}
let dir: Direction = Direction.Up;

// ═══ FUNCTION TYPES ═══
type MathFn = (a: number, b: number) => number;
const add: MathFn = (a, b) => a + b;
```

```typescript
// ═══ UNION & INTERSECTION ═══

// Union: "HOẶC" → 1 trong các types!
type StringOrNumber = string | number;
let val: StringOrNumber = "hello"; // OK!
val = 42; // OK!

// Intersection: "VÀ" → TẤT CẢ các types!
type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged; // Phải có CẢ name VÀ age!

// ═══ LITERAL TYPES ═══
type Status = "success" | "error" | "loading";
let s: Status = "success"; // OK!
// s = 'abc';                 // ❌ Lỗi!
```

```typescript
// ═══ UTILITY TYPES ═══

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Partial<T> → tất cả fields OPTIONAL!
type PartialUser = Partial<User>; // { id?: number; name?: string; ... }

// Required<T> → tất cả fields REQUIRED!
type RequiredUser = Required<PartialUser>;

// Pick<T, K> → CHỌN một số fields!
type UserPreview = Pick<User, "id" | "name">; // { id: number; name: string }

// Omit<T, K> → LOẠI BỎ một số fields!
type UserWithoutEmail = Omit<User, "email">; // { id, name, age }

// Record<K, V> → object với keys K, values V!
type UserMap = Record<string, User>; // { [key: string]: User }

// Readonly<T> → tất cả fields READ-ONLY!
type ReadonlyUser = Readonly<User>;

// ReturnType<T> → lấy return type của function!
type Result = ReturnType<typeof add>; // number

// Extract / Exclude — filter unions!
type A = "a" | "b" | "c";
type B = Extract<A, "a" | "b">; // 'a' | 'b'
type C = Exclude<A, "a">; // 'b' | 'c'
```

```typescript
// ═══ GENERIC TYPES ═══

function identity<T>(arg: T): T {
  return arg;
}

// Generic with constraint:
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}

// Generic interface:
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

const response: ApiResponse<User[]> = {
  data: [{ id: 1, name: "John", email: "john@example.com", age: 30 }],
  status: 200,
  message: "Success",
};
```

---

## §10. type vs interface trong TypeScript

```
type vs interface — SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬──────────────────┬──────────────────────┐
  │ Tiêu chí           │ interface        │ type                  │
  ├────────────────────┼──────────────────┼──────────────────────┤
  │ Khai báo           │ interface User   │ type User = { ... }  │
  │                    │ { ... }          │                       │
  ├────────────────────┼──────────────────┼──────────────────────┤
  │ Extend             │ extends keyword! │ Intersection (&)!    │
  │                    │ interface B      │ type B = A & { ... } │
  │                    │ extends A { }    │                       │
  ├────────────────────┼──────────────────┼──────────────────────┤
  │ Declaration        │ CÓ! ✅           │ ❌ KHÔNG!            │
  │ Merging            │ Cùng tên → merge!│ Cùng tên → LỖI!     │
  ├────────────────────┼──────────────────┼──────────────────────┤
  │ Union              │ ❌ KHÔNG!        │ CÓ! ✅               │
  │                    │                  │ type A = B | C;      │
  ├────────────────────┼──────────────────┼──────────────────────┤
  │ Primitive          │ ❌ KHÔNG!        │ CÓ! ✅               │
  │                    │                  │ type ID = number;    │
  ├────────────────────┼──────────────────┼──────────────────────┤
  │ Tuple              │ ❌ KHÔNG!        │ CÓ! ✅               │
  │                    │                  │ type Pair = [a, b];  │
  ├────────────────────┼──────────────────┼──────────────────────┤
  │ Mapped types       │ ❌ KHÔNG!        │ CÓ! ✅               │
  │                    │                  │ { [K in keyof T]: }  │
  ├────────────────────┼──────────────────┼──────────────────────┤
  │ Computed props     │ ❌ KHÔNG!        │ CÓ! ✅               │
  ├────────────────────┼──────────────────┼──────────────────────┤
  │ implements         │ CÓ! ✅           │ CÓ! ✅ (object types)│
  │ (class)            │                  │                       │
  └────────────────────┴──────────────────┴──────────────────────┘
```

```typescript
// ═══ DECLARATION MERGING (CHỈ interface!) ═══

interface User {
  name: string;
}
interface User {
  age: number;
}
// → User = { name: string; age: number } → TỰ ĐỘNG MERGE!
// → Useful cho extending third-party types!

type Animal = { name: string };
type Animal = { age: number };
// → ❌ Error: Duplicate identifier 'Animal'!
```

```typescript
// ═══ UNION TYPES (CHỈ type!) ═══

type Status = "success" | "error" | "loading"; // ✅ type!
// interface Status = 'success' | 'error';        // ❌ interface KHÔNG làm được!

type Shape = Circle | Square | Triangle; // ✅ Union!
```

```
KHI NÀO DÙNG GÌ?
═══════════════════════════════════════════════════════════════

  DÙNG interface:
  → Định nghĩa SHAPE của object! (API response, props...)
  → Cần EXTEND (thừa kế)!
  → Cần DECLARATION MERGING! (augmenting third-party!)
  → Public API/Library definitions!

  DÙNG type:
  → Union types! (A | B)
  → Intersection types! (A & B)
  → Primitive aliases! (type ID = number)
  → Tuple types! ([string, number])
  → Mapped/Conditional types! (complex type transforms!)
  → Utility types!

  ⚠️ THỰC TẾ:
  → Cả 2 đều OK cho hầu hết use cases!
  → Team convention QUAN TRỌNG HƠN!
  → Recommendation: interface cho objects, type cho phần còn lại!
```

---

## §11. Tối ưu React

```
REACT OPTIMIZATION — 5 CHIỀU:
═══════════════════════════════════════════════════════════════

  ① TRÁNH RE-RENDER KHÔNG CẦN THIẾT:
  ┌────────────────────────────────────────────────────────┐
  │ a) React.memo():                                       │
  │ → Wrap component! Chỉ re-render khi PROPS THAY ĐỔI!   │
  │ const Item = React.memo(({ name }) => <div>{name}</div>)│
  │                                                        │
  │ b) useMemo():                                          │
  │ → Cache KẾT QUẢ TÍNH TOÁN tốn kém!                    │
  │ const sorted = useMemo(() => items.sort(), [items]);   │
  │                                                        │
  │ c) useCallback():                                      │
  │ → Cache FUNCTION REFERENCE! Tránh re-create mỗi render│
  │ const onClick = useCallback(() => {}, [deps]);         │
  │                                                        │
  │ d) Tránh tạo OBJECT/ARRAY MỚI trong render!           │
  │ → ❌ style={{ color: 'red' }} → tạo object MỚI!       │
  │ → ✅ const style = useMemo(() => ({ color: 'red' }),[]); │
  └────────────────────────────────────────────────────────┘

  ② CODE SPLITTING & LAZY LOADING:
  ┌────────────────────────────────────────────────────────┐
  │ const LazyPage = React.lazy(() => import('./Page'));    │
  │ <Suspense fallback={<Loading />}>                      │
  │     <LazyPage />                                       │
  │ </Suspense>                                            │
  │                                                        │
  │ → Load component KHI CẦN! Không tải hết lúc đầu!      │
  │ → Giảm initial bundle size!                            │
  └────────────────────────────────────────────────────────┘

  ③ VIRTUALIZATION (Danh sách lớn!):
  ┌────────────────────────────────────────────────────────┐
  │ → react-window / react-virtuoso / TanStack Virtual!    │
  │ → CHỈ RENDER items hiển thị trên viewport!             │
  │ → 10,000 items → chỉ render ~20 items visible!        │
  │ → DOM nodes ÍT → performance TỐT!                     │
  └────────────────────────────────────────────────────────┘

  ④ STATE MANAGEMENT TỐI ƯU:
  ┌────────────────────────────────────────────────────────┐
  │ a) Đặt state GẦN component cần!                       │
  │ → Tránh lift state lên quá cao! (re-render cascading!) │
  │                                                        │
  │ b) Tách Context nhỏ!                                   │
  │ → 1 Context lớn thay đổi → TẤT CẢ consumers re-render│
  │ → Tách: UserContext, ThemeContext, CartContext...       │
  │                                                        │
  │ c) useReducer cho complex state!                       │
  │ → Batched updates! Predictable transitions!            │
  │                                                        │
  │ d) External state (Zustand/Jotai/Redux!)               │
  │ → Selector pattern: subscribe CHỈ phần cần!            │
  └────────────────────────────────────────────────────────┘

  ⑤ PERFORMANCE TOOLS:
  ┌────────────────────────────────────────────────────────┐
  │ → React DevTools Profiler: đo render times!            │
  │ → React.StrictMode: phát hiện side effects!            │
  │ → why-did-you-render: log re-renders không cần thiết!  │
  │ → useTransition / useDeferredValue: React 18!          │
  │   → Mark updates as NON-URGENT! UI responsive!        │
  └────────────────────────────────────────────────────────┘
```

---

## §12. Algorithm: Merge disordered intervals

```
MERGE INTERVALS (LeetCode 56):
═══════════════════════════════════════════════════════════════

  INPUT:  [[1,3], [8,10], [2,6], [15,18]]  (KHÔNG có thứ tự!)
  OUTPUT: [[1,6], [8,10], [15,18]]

  [1,3] và [2,6] CHỒNG CHÉO → merge thành [1,6]!

  NGUYÊN TẮC CHỒNG CHÉO:
  → 2 intervals [a, b] và [c, d] chồng chéo nếu:
    a <= d VÀ c <= b (sau khi sắp xếp theo start!)
  → Đơn giản hóa: nếu sắp xếp theo start:
    prev.end >= curr.start → CHỒNG CHÉO!
```

```javascript
// ═══ MERGE INTERVALS — SOLUTION ═══

function mergeIntervals(intervals) {
  if (intervals.length <= 1) return intervals;

  // BƯỚC 1: SẮP XẾP theo start time!
  intervals.sort((a, b) => a[0] - b[0]);
  // [[1,3], [2,6], [8,10], [15,18]]

  const result = [intervals[0]]; // Bắt đầu với interval đầu tiên!

  for (let i = 1; i < intervals.length; i++) {
    const prev = result[result.length - 1]; // interval CUỐI CÙNG trong result!
    const curr = intervals[i];

    if (prev[1] >= curr[0]) {
      // CHỒNG CHÉO! → Merge!
      // prev.end = MAX(prev.end, curr.end)!
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      // KHÔNG chồng chéo! → Thêm interval mới!
      result.push(curr);
    }
  }

  return result;
}

// VÍ DỤ TỪNG BƯỚC:
// Input: [[1,3], [8,10], [2,6], [15,18]]
//
// Sau sort: [[1,3], [2,6], [8,10], [15,18]]
//
// result = [[1,3]]
//
// i=1: curr=[2,6], prev=[1,3]
//   prev[1](3) >= curr[0](2) → CHỒNG CHÉO!
//   prev[1] = max(3, 6) = 6
//   result = [[1,6]]
//
// i=2: curr=[8,10], prev=[1,6]
//   prev[1](6) >= curr[0](8)? → 6 < 8 → KHÔNG chồng!
//   result = [[1,6], [8,10]]
//
// i=3: curr=[15,18], prev=[8,10]
//   prev[1](10) >= curr[0](15)? → 10 < 15 → KHÔNG chồng!
//   result = [[1,6], [8,10], [15,18]]
//
// OUTPUT: [[1,6], [8,10], [15,18]] ✅

console.log(
  mergeIntervals([
    [1, 3],
    [8, 10],
    [2, 6],
    [15, 18],
  ]),
);
// [[1,6],[8,10],[15,18]]

console.log(
  mergeIntervals([
    [1, 4],
    [4, 5],
  ]),
);
// [[1,5]] — chồng tại điểm 4!

console.log(
  mergeIntervals([
    [1, 4],
    [0, 4],
  ]),
);
// [[0,4]]

console.log(
  mergeIntervals([
    [1, 4],
    [2, 3],
  ]),
);
// [[1,4]] — [2,3] nằm TRONG [1,4]!
```

```
ĐỘ PHỨC TẠP:
═══════════════════════════════════════════════════════════════

  Time:  O(n log n) — sorting chiếm chủ đạo!
  Space: O(n)       — result array worst case = n intervals!

  ⚠️ KEY INSIGHT:
  → SẮP XẾP theo start time TRƯỚC!
  → Sau khi sắp xếp: chỉ cần so sánh prev.end vs curr.start!
  → prev.end >= curr.start → MERGE (lấy max end)!
  → prev.end < curr.start → KHÔNG merge → push mới!
```

---

## Tổng kết — Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  Interview Two Side
  ├── Khó khăn dự án: STAR method (Situation, Task, Action, Result!)
  ├── let/var/const: scope (function vs block), hoisting (TDZ!),
  │   re-declare, re-assign, const = binding bất biến!
  ├── HTTP Headers: General (Cache-Control), Request (Accept, Auth,
  │   Cookie), Response (Content-Type, Set-Cookie, CORS!)
  ├── Keep-Alive: HTTP/1.1 persistent, WebSocket, SSE, Long Polling, Heartbeat
  ├── CORS: (1) CORS headers, (2) Proxy, (3) JSONP, (4) Nginx,
  │   (5) postMessage, (6) document.domain (deprecated!)
  ├── Webpack: Build speed (cache, thread-loader), Bundle size
  │   (split chunks, tree shaking, externals), Runtime (lazy load, prefetch!)
  ├── HTTP Methods: GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS; idempotent!
  ├── TS vs JS: Static vs Dynamic typing, compile-time errors, IDE!
  ├── TS Types: Basic/Special/Object/Union/Intersection/Generic/Utility!
  ├── type vs interface: merge (interface!), union (type!), extend vs &
  ├── React Optimization: memo/useMemo/useCallback, lazy loading,
  │   virtualization, state management, profiler!
  └── Merge Intervals: sort by start → prev.end >= curr.start → merge!
```

### Checklist

- [ ] **STAR method**: Situation→Task→Action→Result; nói IMPACT có số liệu; chuẩn bị 2-3 câu chuyện!
- [ ] **let/var/const**: var=function scope+hoisting(undefined); let/const=block scope+TDZ; const=binding bất biến, value vẫn mutable!
- [ ] **HTTP Headers**: Request (Accept, Authorization, Cookie, Host, Origin, User-Agent, If-None-Match); Response (Content-Type, Set-Cookie, ETag, Location, Access-Control-\*)!
- [ ] **Keep-Alive**: HTTP/1.1 mặc định persistent; WebSocket (full-duplex!); SSE (1 chiều); Long Polling; Heartbeat ping/pong!
- [ ] **CORS 6 cách**: CORS headers (preflight!); Proxy (dev server/Nginx); JSONP (chỉ GET, cũ!); postMessage (iframes!); document.domain (deprecated!)
- [ ] **Webpack optimization**: Build speed (cache filesystem, thread-loader, include/exclude); Bundle size (code splitting, tree shaking, externals, compression); Runtime (lazy loading, prefetch, content hashing!)
- [ ] **HTTP Methods**: GET (lấy, cacheable), POST (tạo, non-idempotent), PUT (thay thế toàn bộ), PATCH (cập nhật một phần), DELETE (xóa), HEAD (headers only), OPTIONS (preflight!)
- [ ] **Idempotent**: GET/PUT/DELETE/HEAD/OPTIONS = idempotent; POST/PATCH = NOT idempotent!
- [ ] **TS vs JS**: TS = superset JS + static typing + compile-time errors + IDE support + generics + enum + interface!
- [ ] **TS Types**: Basic (string/number/boolean); Special (any/unknown/void/never); Object (array/tuple/enum); Union (\|), Intersection (&); Utility (Partial/Pick/Omit/Record/ReturnType!)
- [ ] **type vs interface**: interface = declaration merging + extends; type = union + primitive alias + tuple + mapped types; cả 2 OK cho objects!
- [ ] **React Optimization**: React.memo (skip re-render), useMemo (cache computation), useCallback (cache function), lazy loading (code splitting), virtualization (long lists), split Context, useTransition (React 18!)
- [ ] **Merge Intervals**: Sort by start O(n log n) → iterate: prev.end >= curr.start → merge (max end); else push new! Space O(n)!

---

_Nguồn: ByteDance Frontend Interview — Two Side · LeetCode 56_
_Cập nhật lần cuối: Tháng 2, 2026_
