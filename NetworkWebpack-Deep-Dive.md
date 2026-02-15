# Network & Webpack — Q63–Q76 — Deep Dive

> 📅 2026-02-12 · ⏱ 18 phút đọc
>
> Tổng hợp Q63–Q76: Image formats, DNS, Strong/Conditional caching,
> Chrome multi-process, TCP 3-way handshake / 4-way teardown,
> URL → Page flow, CDN, HTTP vs HTTPS, Webpack build/hash/loader/plugin.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: Network / Browser / Build Tools

---

## Mục Lục

0. [Image Formats (Q63)](#q63)
1. [DNS (Q64)](#q64)
2. [Strong Caching (Q65)](#q65)
3. [Conditional Caching — 304 (Q66)](#q66)
4. [Chrome Multi-Process (Q67–Q68)](#q67)
5. [TCP 3-Way Handshake & 4-Way Teardown (Q69)](#q69)
6. [URL → Page Display (Q70)](#q70)
7. [CDN (Q71)](#q71)
8. [HTTP vs HTTPS (Q72)](#q72)
9. [Webpack Hash Strategies (Q73)](#q73)
10. [Webpack Build Process (Q74)](#q74)
11. [Loader vs Plugin (Q75)](#q75)
12. [Webpack Build Optimization (Q76)](#q76)
13. [Tóm Tắt & Checklist](#tóm-tắt)

---

## Q63. Image Formats

```
IMAGE FORMATS — COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌─────────┬───────────┬───────┬──────────┬────────────────┐
  │ Format  │ Transparent│ Anim │ Colors   │ Use case       │
  ├─────────┼───────────┼───────┼──────────┼────────────────┤
  │ PNG     │ ✅        │ ❌    │ 16M+     │ Icons, UI, logo│
  │         │           │       │          │ (phổ biến nhất)│
  ├─────────┼───────────┼───────┼──────────┼────────────────┤
  │ JPG/JPEG│ ❌        │ ❌    │ 16M      │ Photos, wall-  │
  │         │           │       │ compress │ papers, banners│
  ├─────────┼───────────┼───────┼──────────┼────────────────┤
  │ GIF     │ ✅        │ ✅    │ 256      │ Simple anims,  │
  │         │           │       │          │ emojis, stickers│
  ├─────────┼───────────┼───────┼──────────┼────────────────┤
  │ BMP     │ ❌        │ ❌    │ 16M      │ Uncompressed,  │
  │         │           │       │          │ rất ít dùng web│
  ├─────────┼───────────┼───────┼──────────┼────────────────┤
  │ WebP    │ ✅        │ ✅    │ 16M      │ Modern web ⭐  │
  │         │           │       │ ~30% nhỏ │ JPG+PNG+GIF    │
  ├─────────┼───────────┼───────┼──────────┼────────────────┤
  │ AVIF    │ ✅        │ ✅    │ 16M+     │ Next-gen ⭐⭐   │
  │         │           │       │ ~50% nhỏ │ Best compress  │
  ├─────────┼───────────┼───────┼──────────┼────────────────┤
  │ SVG     │ ✅        │ ✅    │ Vector   │ Icons, logos,   │
  │         │           │       │ ∞ scale  │ illustrations  │
  └─────────┴───────────┴───────┴──────────┴────────────────┘

  CHỌN FORMAT NÀO?
  → Photo: JPG (lossy OK) → WebP/AVIF nếu modern browser
  → Icon/Logo/UI: PNG (transparency) → SVG nếu vector OK
  → Animation: GIF (simple) → WebP/AVIF (complex)
  → 2024+: WebP là standard, AVIF đang lên
```

---

## Q64. DNS — Domain Name System

```
DNS = Dịch domain → IP address
═══════════════════════════════════════════════════════════════

  www.example.com → DNS → 93.184.216.34

  DNS LOOKUP — 4 BƯỚC (theo thứ tự ưu tiên):

  ① Browser DNS Cache
     → Chrome: chrome://net-internals/#dns
     → Nếu có → DONE!

  ② OS hosts file
     → /etc/hosts (macOS/Linux) hoặc C:\Windows\...\hosts
     → Nếu có mapping → DONE!

  ③ Local DNS Server (ISP hoặc custom: 8.8.8.8)
     → ISP DNS server cache
     → Nếu có → DONE!

  ④ Recursive Query → Root servers
     → Root (.com) → TLD (.example) → Authoritative → IP!

  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ Browser  │ → │ OS hosts │ → │ ISP DNS  │ → │ Root DNS │
  │ cache    │   │ file     │   │ cache    │   │ servers  │
  └──────────┘   └──────────┘   └──────────┘   └──────────┘

  DNS chạy trên UDP, port 53
  → UDP nhanh hơn TCP (no handshake)
  → DNS query nhỏ, fit trong 1 UDP packet
```

---

## Q65. Strong Caching

```
STRONG CACHING — KHÔNG gửi request lên server:
═══════════════════════════════════════════════════════════════

  Browser có cache → kiểm tra header → còn hạn?
  → CÓ → Dùng cache ngay (200 from cache) → KHÔNG request!
  → KHÔNG → Chuyển sang Conditional Caching (Q66)

  2 HEADERS:

  ┌──────────────┬───────────────────────────────────────────┐
  │ Expires      │ HTTP/1.0 — thời gian tuyệt đối          │
  │ (cũ)        │ Expires: Mon, 18 Oct 2066 23:59:59 GMT   │
  │              │ ❌ Client/Server time lệch → sai cache   │
  ├──────────────┼───────────────────────────────────────────┤
  │ Cache-Control│ HTTP/1.1 — thời gian tương đối ⭐        │
  │ (mới, ưu tiên)│ Cache-Control: max-age=3600            │
  │              │ = "cache trong 3600 giây"                │
  └──────────────┴───────────────────────────────────────────┘

  Cache-Control ƯU TIÊN hơn Expires (nếu cả 2 có)

  Cache-Control VALUES:
  ┌──────────────┬────────────────────────────────────────────┐
  │ max-age=N    │ Cache N giây                              │
  │ no-cache     │ PHẢI validate với server trước khi dùng   │
  │ no-store     │ KHÔNG cache gì cả (mọi request = fresh)  │
  │ public       │ CDN + browser đều cache được              │
  │ private      │ CHỈ browser cache (không CDN)             │
  └──────────────┴────────────────────────────────────────────┘

  ⚠️ no-cache ≠ "không cache"!
  → no-cache = "cache nhưng lần nào cũng hỏi server"
  → no-store = "thực sự không cache"
```

---

## Q66. Conditional Caching — 304

```
CONDITIONAL CACHING — Hỏi server "có thay đổi không?":
═══════════════════════════════════════════════════════════════

  Strong cache hết hạn → Browser gửi request + metadata
  → Server check: "file thay đổi chưa?"
  → CHƯA → 304 Not Modified (dùng cache cũ, KHÔNG gửi body)
  → RỒI → 200 + file mới

  2 CẶP HEADERS:

  ① Last-Modified / If-Modified-Since (theo thời gian)
  ┌──────────────────────────────────────────────────────────┐
  │ Lần đầu: Server → Last-Modified: Wed, 01 Jan 2025 ...  │
  │ Lần sau: Browser → If-Modified-Since: Wed, 01 Jan ...   │
  │ Server check: file thời gian = if-modified-since?       │
  │ → GIỐNG → 304 │ KHÁC → 200 + file mới                  │
  │                                                         │
  │ ❌ NHƯỢC ĐIỂM:                                          │
  │ → Chỉ chính xác đến GIÂY (< 1s changes → miss!)       │
  │ → File edit rồi undo → Last-Modified đổi → re-download │
  └──────────────────────────────────────────────────────────┘

  ② ETag / If-None-Match (theo CONTENT hash) ⭐
  ┌──────────────────────────────────────────────────────────┐
  │ Lần đầu: Server → ETag: "abc123def456"                 │
  │ Lần sau: Browser → If-None-Match: "abc123def456"       │
  │ Server check: file hash = if-none-match?                │
  │ → GIỐNG → 304 │ KHÁC → 200 + file mới + ETag mới      │
  │                                                         │
  │ ✅ ƯU ĐIỂM:                                             │
  │ → Based on CONTENT (nội dung) → chính xác               │
  │ → File edit + undo → cùng hash → KHÔNG re-download     │
  │ ❌ Phải tính hash → overhead CPU                        │
  └──────────────────────────────────────────────────────────┘

  ƯU TIÊN: ETag > Last-Modified
  → Server check ETag TRƯỚC, nếu match → 304
  → Nếu ETag chưa có → check Last-Modified → 304 hoặc 200
```

```
CACHING FLOW TỔNG QUAN:
═══════════════════════════════════════════════════════════════

  Browser request
  → Có cache?
    ├── KHÔNG → Request server → 200 + cache lại
    └── CÓ → Strong cache (Expires / Cache-Control)?
        ├── CÒN HẠN → 200 (from cache) ← KHÔNG request!
        └── HẾT HẠN → Conditional cache
            → Gửi If-None-Match / If-Modified-Since
            ├── 304 Not Modified → dùng cache cũ
            └── 200 + new file → cache mới
```

---

## Q67–Q68. Chrome Multi-Process

```
CHROME — MINIMUM 4 PROCESSES PER TAB:
═══════════════════════════════════════════════════════════════

  ┌───────────────────────────────────────────────────────────┐
  │ ① Browser Process (1)     — UI, tabs, address bar       │
  │ ② GPU Process (1)         — 3D rendering, compositing   │
  │ ③ Network Process (1)     — HTTP requests               │
  │ ④ Renderer Process (N)    — Page rendering, JS, DOM     │
  │ ⑤ Plugin Processes (N)    — Flash, PDF, etc.            │
  │ ⑥ Extension Processes (N) — Chrome extensions           │
  └───────────────────────────────────────────────────────────┘

  EXTRA PROCESSES:
  → iframe → separate process (Site Isolation)
  → Extension → separate process
  → Plugin → separate process

  Xem: Chrome Task Manager (Shift + Esc)
```

### Same-Site crash (Q68)

```
PROCESS-PER-SITE-INSTANCE:
═══════════════════════════════════════════════════════════════

  MẶC ĐỊNH: mỗi tab = 1 Renderer Process
  NGOẠI TRỪ: cùng site + tab A mở tab B → SHARE process!

  Same site = cùng scheme + cùng root domain:
  → https://time.geekbang.org
  → https://www.geekbang.org      } SAME SITE!
  → https://www.geekbang.org:8080

  Tại sao share?
  → Cùng site → cần share JS environment
  → Page A có thể scripting Page B (postMessage, window.opener)

  Hậu quả:
  → 1 page crash → TẤT CẢ pages cùng site CŨNG CRASH!
  → Vì chúng ở CÙNG 1 Renderer Process

  → Đây là trade-off: performance vs isolation
```

---

## Q69. TCP 3-Way Handshake & 4-Way Teardown

### 3-Way Handshake (thiết lập kết nối)

```
TCP 3-WAY HANDSHAKE:
═══════════════════════════════════════════════════════════════

     Client                          Server
       │                                │
  ①    │── SYN=1, seq=x ──────────────→│  SYN-SENT
       │   "Tôi muốn kết nối"          │
       │                                │
  ②    │←── SYN=1, ACK=1, ────────────│  SYN-RCVD
       │    seq=y, ack=x+1             │
       │   "OK, tôi cũng sẵn sàng"     │
       │                                │
  ③    │── ACK=1, seq=x+1, ──────────→│  ESTABLISHED
       │   ack=y+1                      │
       │   "Xác nhận, bắt đầu!"        │  ESTABLISHED
       │                                │

  TẠI SAO 3 BƯỚC, KHÔNG PHẢI 2?
  → Tránh "ghost connection" (kết nối ma)!

  Scenario 2-way (BUG):
  ① Client gửi SYN → bị delay ở mạng
  ② Client timeout → gửi SYN mới → connect thành công → xong!
  ③ SYN cũ (delay) cuối cùng ĐẾN server
  ④ Server tưởng request MỚI → ACK → ESTABLISHED (2-way)
  ⑤ Client KHÔNG gửi data → Server chờ MÃI → LÃNG PHÍ!

  Với 3-way: bước ③ client KHÔNG gửi ACK cho SYN cũ
  → Server không nhận ACK → biết client KHÔNG muốn kết nối
  → KHÔNG lãng phí resources!
```

### 4-Way Teardown (đóng kết nối)

```
TCP 4-WAY TEARDOWN:
═══════════════════════════════════════════════════════════════

     Client                          Server
       │                                │
  ①    │── FIN=1, seq=u ──────────────→│  FIN-WAIT-1
       │   "Tôi gửi xong, muốn đóng"  │
       │                                │  CLOSE-WAIT
  ②    │←── ACK=1, seq=v, ack=u+1 ───│
       │   "OK, tôi biết rồi"          │  FIN-WAIT-2
       │                                │
       │   (Server vẫn có thể gửi data) │
       │                                │
  ③    │←── FIN=1, ACK=1, seq=w, ────│  LAST-ACK
       │    ack=u+1                     │
       │   "Tôi cũng gửi xong"         │
       │                                │
  ④    │── ACK=1, seq=u+1, ──────────→│  CLOSED
       │   ack=w+1                      │
       │   "Xác nhận, đóng!"           │
       │                                │
       │ TIME-WAIT (2MSL) → CLOSED      │

  TẠI SAO 4 BƯỚC, KHÔNG PHẢI 3?
  → TCP full-duplex: 2 chiều INDEPENDENT
  → Client đóng chiều A→B ← 2 bước (FIN + ACK)
  → Server đóng chiều B→A ← 2 bước (FIN + ACK)
  → Tổng: 4 bước!
  → Giữa bước 2-3: Server vẫn gửi data (half-close)

  TIME-WAIT (2MSL) — TẠI SAO?
  → Nếu ACK cuối cùng BỊ MẤT
  → Server re-send FIN → Client vẫn alive để re-ACK
  → Nếu Client đóng ngay → Server chờ ACK MÃI → stuck!
```

---

## Q70. URL → Page Display

```
URL → PAGE — 6 BƯỚC:
═══════════════════════════════════════════════════════════════

  ① URL PARSING
  → Check: URL hợp lệ hay search keyword?
  → Parse: protocol, domain, path, query, fragment

  ② DNS LOOKUP
  → Domain → IP: browser cache → OS hosts → ISP DNS → Root

  ③ TCP CONNECTION
  → 3-way handshake (SYN → SYN-ACK → ACK)
  → HTTPS? + TLS handshake (certificate exchange)

  ④ HTTP REQUEST
  → Browser gửi GET/POST + headers (cookies, user-agent)
  → Server xử lý logic, query DB, etc.

  ⑤ HTTP RESPONSE
  → Status code (200, 301, 304, 404, 500)
  → Headers: Content-Type, Cache-Control, Set-Cookie
  → Body: HTML, CSS, JS, images

  ⑥ PAGE RENDERING
  ┌───────────────────────────────────────────────────────┐
  │ 1. Parse HTML    → DOM Tree                          │
  │ 2. Parse CSS     → CSSOM Tree                        │
  │ 3. Merge         → Render Tree                       │
  │ 4. Layout        → Tính position + size (reflow)     │
  │ 5. Paint         → Vẽ pixels (colors, borders)       │
  │ 6. Composite     → GPU ghép layers → hiển thị        │
  └───────────────────────────────────────────────────────┘
```

---

## Q71. CDN — Content Delivery Network

```
CDN — HÌNH DUNG:
═══════════════════════════════════════════════════════════════

  Giống "đại lý bán vé" — user mua vé ở đại lý GẦN NHẤT
  thay vì phải ra ga tàu (origin server)

  User (HCM) → CDN node (HCM) ← NHANH!
  THAY VÌ:
  User (HCM) → Origin server (Tokyo) ← CHẬM!

  CDN = mạng lưới cache servers PHÂN TÁN toàn cầu

  CDN FLOW:
  ① Browser gửi request
  ② DNS route đến CDN node GẦN NHẤT
  ③ CDN node có cache?
     → CÓ + còn hạn → Trả ngay (fast!)
     → KHÔNG / hết hạn → Fetch from origin → cache → trả
  ④ CDN cache dùng Cache-Control: max-age (giống browser cache)

  CDN ƯU ĐIỂM:
  → Giải quyết cross-region + cross-ISP latency
  → Phân tải (reduce origin server load)
  → Tăng availability (origin down → CDN vẫn serve)
```

---

## Q72. HTTP vs HTTPS

```
HTTP vs HTTPS:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬─────────────────┬──────────────────────┐
  │              │ HTTP            │ HTTPS                │
  ├──────────────┼─────────────────┼──────────────────────┤
  │ Security     │ Plaintext ❌    │ SSL/TLS encrypted ✅ │
  │ Port         │ 80              │ 443                  │
  │ Certificate  │ Không cần       │ SSL cert (có chi phí)│
  │ Performance  │ Nhanh hơn       │ Chậm hơn (TLS handshake)│
  │ URL          │ http://         │ https://             │
  │ SEO          │ Thấp hơn        │ Google ưu tiên ⭐    │
  └──────────────┴─────────────────┴──────────────────────┘

  HTTPS = HTTP + TLS/SSL layer
  → Encrypt data in transit (chống man-in-the-middle)
  → Verify server identity (certificate)
  → Data integrity (chống tamper)

  TLS HANDSHAKE (simplified):
  ① Client Hello: TLS version, cipher suites, random
  ② Server Hello: chosen cipher, certificate (public key)
  ③ Client: verify cert → generate pre-master secret
            → encrypt with server's public key → send
  ④ Both: derive session key from pre-master + randoms
  ⑤ Symmetric encryption begins (fast!)
```

---

## Q73. Webpack Hash Strategies

```
3 HASH STRATEGIES:
═══════════════════════════════════════════════════════════════

  ┌─────────────┬─────────────────────────────────────────────┐
  │ hash        │ Project-level: BẤT KỲ file thay đổi       │
  │             │ → TẤT CẢ hash đổi → cache BUST toàn bộ!  │
  │             │ ❌ Tệ cho caching                           │
  ├─────────────┼─────────────────────────────────────────────┤
  │ chunkhash   │ Chunk-level: 1 entry thay đổi              │
  │             │ → CHỈ chunk đó đổi hash                    │
  │             │ ✅ Tốt cho JS (1 entry = 1 chunk)           │
  │             │ ❌ CSS cùng chunk với JS → đổi cùng lúc    │
  ├─────────────┼─────────────────────────────────────────────┤
  │ contenthash │ File-level: CHỈ file có CONTENT thay đổi   │
  │             │ → CHỈ file đó đổi hash                     │
  │             │ ✅ CHÍNH XÁC NHẤT cho caching ⭐            │
  └─────────────┴─────────────────────────────────────────────┘

  KHUYẾN NGHỊ:
  → CSS: contenthash (tách riêng, cache tốt nhất)
  → JS: chunkhash (chunk-level)
  → Images/Fonts: contenthash

  // webpack.config.js
  output: {
      filename: '[name].[chunkhash:8].js',      // JS
  },
  plugins: [
      new MiniCssExtractPlugin({
          filename: '[name].[contenthash:8].css', // CSS
      })
  ]
```

---

## Q74. Webpack Build Process

```
WEBPACK BUILD — 7 BƯỚC:
═══════════════════════════════════════════════════════════════

  ① INIT PARAMS
  → Merge: webpack.config.js + CLI args → final config

  ② START COMPILE
  → Init Compiler object → register plugins
  → Plugins listen lifecycle hooks → compiler.run()

  ③ DETERMINE ENTRY
  → Config entry → starting point(s)

  ④ COMPILE MODULES
  → Entry file → parse AST → find dependencies
  → Apply matching Loaders (transform: TS→JS, SCSS→CSS)
  → Recursive: dependencies → parse → transform → ...
  → Until ALL reachable files processed

  ⑤ COMPLETE MODULE COMPILATION
  → Mỗi module: translated content + dependency graph

  ⑥ OUTPUT RESOURCES
  → Group modules → Chunks (theo entry + dynamic import)
  → Each Chunk → 1 output file
  → LAST CHANCE to modify output (emit hook)

  ⑦ WRITE FILES
  → Config output path + filename → write to filesystem
```

---

## Q75. Loader vs Plugin

```
LOADER vs PLUGIN:
═══════════════════════════════════════════════════════════════

  ┌──────────┬──────────────────────┬────────────────────────┐
  │          │ Loader               │ Plugin                 │
  ├──────────┼──────────────────────┼────────────────────────┤
  │ Mục đích │ Transform FILES      │ Extend CAPABILITIES    │
  │          │ (A.scss → B.css)     │ (optimize, inject, etc)│
  │ Timing   │ TRƯỚC build (module) │ TOÀN BỘ lifecycle      │
  │ How      │ Function(source) →   │ Class { apply(compiler)│
  │          │ return transformed   │ { hooks.tap(...) } }   │
  │ Scope    │ File-level           │ Build-level            │
  │ Chain    │ Right → Left         │ Event-based (tap)      │
  └──────────┴──────────────────────┴────────────────────────┘

  LOADER = File converter
  PLUGIN = Build lifecycle subscriber
```

### Writing a Loader

```javascript
// loader = function nhận source, return transformed content
module.exports = function (source) {
  // this.query = loader options
  const options = this.query;

  // Transform source
  const result = doTransform(source);

  // Sync: return trực tiếp
  return result;

  // Async: dùng this.callback
  // this.callback(error, content, sourceMap, AST)
  this.callback(null, result);
};

// RULES:
// → KHÔNG dùng arrow function (cần this context)
// → 1 loader = 1 việc (single responsibility)
// → Chain: less-loader → css-loader → style-loader
```

### Writing a Plugin

```javascript
class MyPlugin {
  apply(compiler) {
    // Hook vào lifecycle event
    compiler.hooks.emit.tap("MyPlugin", (compilation) => {
      // compilation = current build context
      // Có thể modify output ở đây

      console.log("Assets:", Object.keys(compilation.assets));
    });
  }
}
module.exports = MyPlugin;

// 2 CORE OBJECTS:
// compiler = webpack environment (options, loaders, plugins)
//          → TOÀN BỘ lifecycle, 1 instance duy nhất
// compilation = 1 build session (modules, chunks, assets)
//             → Re-created mỗi lần file change (watch mode)

// RULES:
// → Plugin = class/object có apply(compiler) method
// → compiler/compilation là reference → KHÔNG modify trực tiếp
// → Async plugin: PHẢI call callback(), nếu không → STUCK!
```

---

## Q76. Webpack Build Optimization

```
WEBPACK OPTIMIZATION — 8 TECHNIQUES:
═══════════════════════════════════════════════════════════════

  ① OPTIMIZE LOADER CONFIG
  → include/exclude → chỉ process files CẦN THIẾT
  → Tránh loader chạy trên node_modules

  module: {
      rules: [{
          test: /\.js$/,
          use: 'babel-loader',
          include: path.resolve('src'), // ← CHỈ src/
          exclude: /node_modules/
      }]
  }

  ② RESOLVE.EXTENSIONS — giới hạn số extension tìm kiếm
  resolve: { extensions: ['.js', '.jsx'] } // ← ít hơn = nhanh hơn

  ③ RESOLVE.MODULES — chỉ định chính xác node_modules path
  resolve: { modules: [path.resolve('node_modules')] }

  ④ RESOLVE.ALIAS — shortcut tránh deep resolve
  resolve: { alias: { '@': path.resolve('src') } }

  ⑤ DLL PLUGIN — pre-build vendor libraries (ít dùng 2024+)
  → Build once, cache DLL → skip rebuild mỗi lần compile

  ⑥ CACHE-LOADER — cache loader results
  → Lần build sau: KHÔNG re-transform nếu file unchanged

  ⑦ TERSER MULTI-THREAD
  → TerserPlugin({ parallel: true }) → multi-core minify

  ⑧ SOURCEMAP — chọn mode phù hợp
  → Production: source-map (separate file)
  → Development: eval-cheap-module-source-map (fast rebuild)
```

---

## Tóm Tắt

### Quick Reference

```
Q63-Q76 — QUICK REF:
═══════════════════════════════════════════════════════════════

  IMAGES: PNG (transparent), JPG (photo compress), GIF (anim),
          WebP (modern best), AVIF (next-gen), SVG (vector)

  DNS: domain → IP: browser cache → hosts → ISP → Root
       UDP port 53, recursive query

  CACHING:
  → Strong: Cache-Control > Expires (200 from cache)
  → Conditional: ETag > Last-Modified (304 Not Modified)
  → no-cache ≠ no-store! (validate vs truly no cache)

  CHROME: min 4 processes (Browser, GPU, Network, Renderer)
  → Same-site pages share Renderer → 1 crash = all crash

  TCP: 3-way handshake (SYN → SYN-ACK → ACK)
       4-way teardown (FIN → ACK → FIN → ACK)
       3-way: tránh ghost connection
       4-way: full-duplex, 2 chiều đóng riêng

  URL → PAGE: URL parse → DNS → TCP → HTTP → Response → Render
  → Render: HTML→DOM + CSS→CSSOM → Render Tree → Layout → Paint

  CDN: distributed cache servers, gần user nhất, phân tải

  HTTPS = HTTP + TLS: encrypt (443) vs plaintext (80)

  WEBPACK HASH: hash (project) < chunkhash (chunk) < contenthash ⭐
  BUILD: init → compile → entry → modules/loaders → chunks → output
  LOADER: file transformer (function) | PLUGIN: lifecycle hooks (class)
```

### Checklist

- [ ] Image: PNG transparent, JPG compress, GIF anim, WebP modern best
- [ ] DNS: 4-step lookup (browser → hosts → ISP → Root), UDP port 53
- [ ] Strong cache: Cache-Control max-age (relative) > Expires (absolute)
- [ ] no-cache = validate trước, no-store = không cache gì
- [ ] Conditional: ETag (content hash) > Last-Modified (time) → 304
- [ ] Chrome min 4 processes, same-site share Renderer (crash risk)
- [ ] TCP 3-way handshake: chống ghost connection (SYN delay)
- [ ] TCP 4-way teardown: full-duplex, TIME-WAIT 2MSL chờ re-ACK
- [ ] URL→Page: URL parse → DNS → TCP → HTTP → Response → Render pipeline
- [ ] Render: DOM + CSSOM → Render Tree → Layout → Paint → Composite
- [ ] CDN: distributed cache, gần user, phân tải origin
- [ ] HTTPS = HTTP + TLS, port 443, SSL cert, chậm hơn HTTP
- [ ] Webpack hash < chunkhash < contenthash (CSS: content, JS: chunk)
- [ ] Build: 7 steps, entry → AST → loaders → chunks → output
- [ ] Loader: file transform function (right→left chain)
- [ ] Plugin: lifecycle hooks class (apply + compiler.hooks.tap)
- [ ] Optimize: include/exclude, alias, DLL, cache-loader, parallel

---

_Cập nhật lần cuối: Tháng 2, 2026_
