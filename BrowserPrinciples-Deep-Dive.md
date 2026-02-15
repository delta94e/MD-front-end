# Browser Principles — Deep Dive

> 📅 2026-02-13 · ⏱ 30 phút đọc
>
> JS Engines, URL → Page Display, HTML/CSS Parsing,
> Render Pipeline, Reflow/Repaint, Garbage Collection,
> Browser Caching, Resource Loading
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Core Browser Interview

---

## Mục Lục

| #   | Phần                                     |
| --- | ---------------------------------------- |
| 1   | JS Engines — So sánh & Phân biệt         |
| 2   | Request ↔ Server — Các bước tương tác    |
| 3   | URL → Page Display — Toàn bộ quy trình   |
| 4   | HTML Parsing → DOM Tree                  |
| 5   | CSS Parsing → CSSOM & Style Rules        |
| 6   | Render Tree → Layout → Paint → Composite |
| 7   | Resource Loading — Async / Sync / Defer  |
| 8   | Reflow & Repaint — Nguyên lý & Tối ưu    |
| 9   | Garbage Collection — Tránh Memory Leak   |
| 10  | Browser Caching — Chiến lược & Lựa chọn  |
| 11  | Tổng kết & Checklist phỏng vấn           |

---

## §1. JS Engines — So sánh & Phân biệt

```
BROWSER ENGINES:
═══════════════════════════════════════════════════════════════

  Mỗi browser có 2 engines chính:
  ① Rendering Engine (Layout Engine) — parse HTML/CSS → render
  ② JavaScript Engine — parse + execute JS

  ┌─────────────┬────────────────┬────────────────────────┐
  │ Browser     │ Rendering      │ JS Engine              │
  ├─────────────┼────────────────┼────────────────────────┤
  │ Chrome      │ Blink          │ V8                     │
  │ Edge        │ Blink          │ V8                     │
  │ Firefox     │ Gecko          │ SpiderMonkey           │
  │ Safari      │ WebKit         │ JavaScriptCore (Nitro) │
  │ Opera       │ Blink          │ V8                     │
  │ IE (legacy) │ Trident        │ Chakra                 │
  │ React Native│ —              │ Hermes / JSC           │
  │ Node.js     │ —              │ V8                     │
  │ Deno / Bun  │ —              │ V8 / JSC               │
  └─────────────┴────────────────┴────────────────────────┘

  V8 (Chrome/Node) — phổ biến nhất!
  → Compile JS → machine code TRỰC TIẾP (no bytecode ban đầu!)
  → Pipeline: Parser → AST → Ignition (bytecode) → TurboFan (optimize!)
  → Features: Hidden Classes, Inline Caching, Deoptimization
```

```
V8 ENGINE PIPELINE (CHI TIẾT):
═══════════════════════════════════════════════════════════════

  Source Code
       │
       ▼
  ┌──────────┐
  │ Scanner  │ → Tokenization (Lexical Analysis)
  │ (Lexer)  │ → "var x = 5" → [VAR, IDENTIFIER(x), ASSIGN, NUMBER(5)]
  └────┬─────┘
       ▼
  ┌──────────┐
  │ Parser   │ → Parse tokens → AST (Abstract Syntax Tree)
  │          │ → Lazy parsing: chỉ parse function KHI CẦN! ⚡
  └────┬─────┘
       ▼
  ┌──────────┐
  │ Ignition │ → AST → Bytecode (compact, portable!)
  │(Interpret│ → Chạy bytecode ngay! (khởi động NHANH!)
  │   er)    │ → Thu thập TYPE FEEDBACK (profiling!)
  └────┬─────┘
       │ Hot functions (gọi nhiều lần!)
       ▼
  ┌──────────┐
  │ TurboFan │ → Bytecode + Type Feedback → OPTIMIZED Machine Code!
  │(Compiler)│ → Giả sử types KHÔNG ĐỔI → tối ưu mạnh!
  └────┬─────┘
       │ ⚠️ Type thay đổi? (VD: number → string)
       ▼
  ┌──────────┐
  │ Deoptim. │ → Quay lại bytecode (Ignition)!
  │          │ → Bỏ optimized code → re-interpret!
  └──────────┘

  ⚠️ BÀI HỌC: Giữ TYPE ỔN ĐỊNH để V8 optimize tốt!
  → Đừng: add(1, 2) rồi add("hello", "world")!
  → TurboFan sẽ deoptimize → CHẬM!
```

```javascript
// ═══ PHÂN BIỆT BROWSER BẰNG CODE ═══

// ❌ userAgent (KHÔNG đáng tin — ai cũng fake!):
navigator.userAgent; // "Mozilla/5.0 ... Chrome/120 ... Safari/537.36"
// → Chrome có "Safari" trong userAgent! Mọi browser đều có "Mozilla"!

// ✅ Feature Detection (ĐÚNG CÁCH!):
const isChrome = !!window.chrome && !!window.chrome.runtime;
const isFirefox = typeof InstallTrigger !== "undefined";
const isSafari =
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !window.chrome;

// ✅ TỐT NHẤT: Feature Detection thay vì Browser Detection!
if ("IntersectionObserver" in window) {
  // Dùng IntersectionObserver
} else {
  // Fallback: scroll event
}

if (CSS.supports("display", "grid")) {
  // Dùng CSS Grid
} else {
  // Fallback: Flexbox
}
```

---

## §2. Request ↔ Server — Các bước tương tác

```
TỪ LÚC GỬI REQUEST ĐẾN NHẬN RESPONSE:
═══════════════════════════════════════════════════════════════

  ┌──────────┐                              ┌──────────┐
  │  Client  │                              │  Server  │
  │ (Browser)│                              │          │
  └────┬─────┘                              └────┬─────┘
       │                                         │
       │ ① DNS Lookup                            │
       │ → Domain → IP address                   │
       │ → Cache: Browser → OS → Router → ISP   │
       │                                         │
       │ ② TCP 3-Way Handshake                   │
       │ ── SYN ────────────────────────────────→│
       │ ←─ SYN+ACK ────────────────────────────│
       │ ── ACK ────────────────────────────────→│
       │                                         │
       │ ③ TLS Handshake (nếu HTTPS)             │
       │ ── ClientHello ────────────────────────→│
       │ ←─ ServerHello + Certificate ───────────│
       │ ── Key Exchange ───────────────────────→│
       │ ←─ Finished ───────────────────────────│
       │                                         │
       │ ④ HTTP Request                          │
       │ ── GET /page HTTP/1.1 ────────────────→│
       │    Host: example.com                    │
       │    Accept: text/html                    │
       │                                         │
       │ ⑤ Server Processing                    │
       │    → Receive request                    │
       │    → Route → Controller → Logic         │
       │    → Query database                     │
       │    → Build response                     │
       │                                         │
       │ ⑥ HTTP Response                        │
       │ ←─ HTTP/1.1 200 OK ────────────────────│
       │    Content-Type: text/html              │
       │    Cache-Control: max-age=3600          │
       │    [HTML content]                       │
       │                                         │
       │ ⑦ Browser Parse & Render               │
       │    → Parse HTML → DOM Tree              │
       │    → Parse CSS → CSSOM                  │
       │    → Render Tree → Layout → Paint       │
       │                                         │
       │ ⑧ Thêm requests (CSS, JS, Images...)   │
       │ ── GET /style.css ─────────────────────→│
       │ ←─ CSS file ──────────────────────────│
       │ ── GET /app.js ───────────────────────→│
       │ ←─ JS file ───────────────────────────│
       │                                         │
       │ ⑨ TCP 4-Way Handshake (đóng)           │
       │ (hoặc Keep-Alive giữ connection!)       │
       └─────────────────────────────────────────┘
```

---

## §3. URL → Page Display — Toàn bộ quy trình

```
TỪ GÕ URL ĐẾN TRANG HIỂN THỊ — 8 BƯỚC CHI TIẾT:
═══════════════════════════════════════════════════════════════

  ① URL PARSING:
     → Browser parse URL: protocol, host, path, query, hash
     → Kiểm tra: URL hay search query? → navigate hay search!
     → Encode special characters (space → %20)

  ② DNS RESOLUTION:
     → Domain name → IP address
     → Cache chain: Browser → OS → Router → ISP Resolver
     → Recursive: Root NS → TLD NS → Authoritative NS → IP!

  ③ TCP CONNECTION:
     → 3-way handshake (SYN → SYN+ACK → ACK)
     → TLS handshake nếu HTTPS (thêm 1-2 round-trips!)
     → HTTP/2: chỉ 1 connection (multiplexing!)

  ④ HTTP REQUEST:
     → Send request headers + body
     → Cache check: Cache-Control → ETag/Last-Modified → 304!
     → Cookies auto-attach!

  ⑤ SERVER RESPONSE:
     → Status code + headers + body
     → Redirect (301/302)? → Quay lại bước ①!
     → Content-Encoding: gzip/br? → Decompress!

  ⑥ HTML PARSING → DOM + CSSOM:
     → Incremental parsing (nhận đến đâu parse đến đó!)
     → HTML → DOM Tree
     → CSS → CSSOM Tree
     → <script> → BLOCK parsing! (trừ async/defer)
     → Preload scanner: tìm resources sớm!

  ⑦ RENDER:
     → DOM + CSSOM → Render Tree (chỉ visible elements!)
     → Layout (Reflow): tính toán vị trí, kích thước
     → Paint: vẽ pixels (color, border, shadow...)
     → Composite: ghép layers → màn hình!

  ⑧ JAVASCRIPT EXECUTION:
     → Parse JS → AST → Bytecode → Execute
     → Có thể THAY ĐỔI DOM/CSSOM → trigger re-render!
     → DOMContentLoaded → JS có thể tương tác DOM!
     → window.onload → TẤT CẢ resources (images, CSS) đã tải!

  TIMELINE:
  ┌─ DNS ─┬─ TCP ─┬─ TLS ─┬─ Request ─┬─ Response ─┬─ Parse ─┬─ Render ─┐
  │ ~20ms │ ~20ms │ ~30ms │ Network   │ Server     │ Parse  │ Paint   │
  └───────┴───────┴───────┴───────────┴────────────┴────────┴─────────┘

  ⚠️ CÂU HỎI PHỎNG VẤN KINH ĐIỂN:
  "Mô tả chuyện gì xảy ra khi gõ URL và nhấn Enter?"
  → Phải giải thích ĐẦY ĐỦ 8 bước trên!
```

---

## §4. HTML Parsing → DOM Tree

```
HTML PARSER — INCREMENTAL & ERROR-TOLERANT:
═══════════════════════════════════════════════════════════════

  HTML Parser: KHÔNG dùng Context-Free Grammar!
  → HTML cho phép: tag thiếu closing, attributes sai, nesting lỗi
  → Parser phải TOLERANT (tự sửa lỗi!)
  → Tiêu chuẩn: HTML5 Parsing Algorithm (spec rất chi tiết!)

  BƯỚC 1: TOKENIZATION (Lexical Analysis)
  ═══════════════════════════════════════
  HTML bytes → Characters → Tokens

  Input: <div class="box"><p>Hello</p></div>

  Tokens:
  ┌─────────────────────────────────────────────┐
  │ StartTag: div, attrs: [{class: "box"}]      │
  │ StartTag: p, attrs: []                      │
  │ Character: "Hello"                          │
  │ EndTag: p                                   │
  │ EndTag: div                                 │
  └─────────────────────────────────────────────┘

  State Machine: Data → TagOpen → TagName → BeforeAttrName → ...
  → Mỗi character chuyển state → emit token!

  BƯỚC 2: TREE CONSTRUCTION
  ═══════════════════════════════════════
  Tokens → DOM Tree

  Dùng STACK OF OPEN ELEMENTS:

  Token: StartTag(div)
  Stack: [html, body, div]     → Push div!

  Token: StartTag(p)
  Stack: [html, body, div, p]  → Push p!

  Token: Character("Hello")
  → Tạo Text node, append vào p!

  Token: EndTag(p)
  Stack: [html, body, div]     → Pop p!

  Token: EndTag(div)
  Stack: [html, body]          → Pop div!

  KẾT QUẢ DOM TREE:
  document
  └── html
      ├── head
      └── body
          └── div.box
              └── p
                  └── #text "Hello"

  ⚠️ ERROR RECOVERY (tự sửa lỗi!):
  → <p>Hello<p>World → Browser tự đóng <p> đầu tiên!
  → <b><i>text</b></i> → Browser fix nesting!
  → <table><tr><div>text → <div> bị đẩy ra ngoài <table>!
```

```
SCRIPT BLOCKING:
═══════════════════════════════════════════════════════════════

  <script> GẶP TRONG HTML PARSING:
  → Parser DỪNG! (Synchronous blocking!)
  → Download + Execute script!
  → Script có thể document.write() → thay đổi HTML đang parse!
  → SAU KHI execute → parser tiếp tục!

  ┌──── HTML Parsing ────┬── BLOCKED ──┬── HTML Parsing ──┐
  │ parse <div>...       │ <script>    │ parse <p>...     │
  │                      │ download +  │                  │
  │                      │ execute     │                  │
  └──────────────────────┴─────────────┴──────────────────┘

  → Vì sao đặt <script> CUỐI <body>!
  → Hoặc dùng async / defer (xem §7!)

  PRELOAD SCANNER:
  → Trong khi parser bị BLOCK bởi script
  → Preload scanner TIẾP TỤC scan HTML
  → Tìm: CSS, images, fonts → bắt đầu download TRƯỚC!
  → Tối ưu: giảm thời gian chờ!
```

---

## §5. CSS Parsing → CSSOM & Style Rules

```
CSS PARSING — CSSOM TREE:
═══════════════════════════════════════════════════════════════

  CSS bytes → Characters → Tokens → Nodes → CSSOM Tree

  BƯỚC 1: TOKENIZATION:
  → "div .box { color: red; }" → [IDENT, WHITESPACE, DOT, IDENT,
     LBRACE, IDENT, COLON, IDENT, SEMICOLON, RBRACE]

  BƯỚC 2: PARSE → CSSOM:
  → CSS dùng Context-Free Grammar (không như HTML!)
  → Parser tạo CSSOM Tree:

  StyleSheet
  └── Rule
      ├── Selectors: "div .box"
      └── Declarations
          ├── color: red
          └── font-size: 16px

  CSSOM TREE (full):
  ┌─── body ─────────────────────────────────────┐
  │ font-size: 16px (inherited!)                 │
  │ color: black                                 │
  ├── div ───────────────────────────────────────┤
  │   │ display: block (user-agent stylesheet!)  │
  │   ├── .box ──────────────────────────────────┤
  │   │   color: red (override!)                 │
  │   │   font-size: 16px (inherited from body!) │
  │   └── p ─────────────────────────────────────┤
  │       display: block                         │
  │       color: red (inherited from .box!)      │
  └──────────────────────────────────────────────┘

  CSS SPECIFICITY (Độ ưu tiên):
  ┌───────────────┬──────────┬─────────────────┐
  │ Selector      │ (a,b,c)  │ Ví dụ           │
  ├───────────────┼──────────┼─────────────────┤
  │ inline style  │ (1,0,0)  │ style="..."     │
  │ #id           │ (0,1,0)  │ #header         │
  │ .class/[attr] │ (0,0,1)  │ .btn, [type]    │
  │ element       │ (0,0,0,1)│ div, p          │
  │ *             │ (0,0,0,0)│ universal       │
  └───────────────┴──────────┴─────────────────┘
  → !important > inline > #id > .class > element
  → Cùng specificity → CÁI SAU THẮNG!

  ⚠️ CSS BLOCKING:
  → CSS KHÔNG block HTML parsing
  → NHƯNG CSS BLOCK RENDERING! (cần CSSOM để render!)
  → CSS BLOCK JS execution! (JS có thể đọc computed styles!)
  → Đặt CSS TRƯỚC JS, trong <head>!
```

---

## §6. Render Tree → Layout → Paint → Composite

```
RENDERING PIPELINE — 5 BƯỚC:
═══════════════════════════════════════════════════════════════

  DOM Tree + CSSOM Tree
       │
       ▼
  ┌─────────────┐
  │ RENDER TREE │ → DOM + CSSOM = Render Tree
  │             │ → CHỈ visible elements!
  │             │ → ❌ <head>, <script>, display:none
  │             │ → ✅ visibility:hidden (vẫn chiếm space!)
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │   LAYOUT    │ → Tính toán CHÍNH XÁC:
  │  (Reflow)   │ → Position (x, y)
  │             │ → Size (width, height)
  │             │ → Box model (margin, padding, border)
  │             │ → Relative positions (float, flex, grid)
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │   PAINT     │ → Vẽ PIXELS: color, background, border,
  │             │ → shadow, text, images
  │             │ → Tạo PAINT RECORDS (draw commands!)
  │             │ → Thứ tự: background → border → content
  │             │ → → outline → children
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  COMPOSITE  │ → Chia thành LAYERS
  │             │ → GPU render mỗi layer ĐỘC LẬP!
  │             │ → Ghép layers → Final frame!
  │             │ → Layers: will-change, transform, opacity,
  │             │ →         <video>, <canvas>, position:fixed
  └─────────────┘

  ⚠️ LAYER TRIGGERS (tạo composite layer MỚI):
  → will-change: transform/opacity
  → transform: translateZ(0) / translate3d()
  → opacity animation
  → position: fixed / sticky
  → <video>, <canvas>, <iframe>
  → Có sibling đã ở composite layer → PROMOTE!
```

```
CRITICAL RENDERING PATH (CRP):
═══════════════════════════════════════════════════════════════

  HTML → DOM ─────────────┐
                          ├─→ Render Tree → Layout → Paint
  CSS → CSSOM ────────────┘
         ▲
         │ (CSS blocks rendering & JS!)
  JS ────┘ (JS blocks HTML parsing!)

  TỐI ƯU CRP:
  ① Minimize critical resources (CSS/JS cần trước render!)
  ② Minimize critical bytes (minify, compress!)
  ③ Minimize critical path length (round-trips!)

  → Inline critical CSS (above-the-fold!)
  → Defer non-critical JS (async/defer!)
  → Preload critical resources (<link rel="preload">!)
```

---

## §7. Resource Loading — Async / Sync / Defer

```
SCRIPT LOADING — async vs defer vs normal:
═══════════════════════════════════════════════════════════════

  ① NORMAL (không attribute):
  <script src="app.js"></script>

  HTML: ──parse──┤ BLOCK! ├──download──execute──├──parse──→
  → DỪNG parse → download → execute → TIẾP parse!
  → CHẬM NHẤT! Block rendering!

  ② ASYNC:
  <script async src="analytics.js"></script>

  HTML: ──parse───────────parse──┤ BLOCK ├──parse──→
  JS:         ──download──       ──exec──
  → Download SONG SONG với parse!
  → Execute NGAY khi download xong → BLOCK parse lúc đó!
  → THỨ TỰ KHÔNG ĐẢM BẢO! (ai xong trước chạy trước!)
  → Dùng cho: analytics, ads, scripts KHÔNG phụ thuộc nhau!

  ③ DEFER:
  <script defer src="app.js"></script>

  HTML: ──parse────────────────────parse──complete!──→
  JS:         ──download──                  ──exec──
  → Download SONG SONG!
  → Execute SAU KHI HTML parse XONG!
  → THỨ TỰ ĐẢM BẢO! (theo thứ tự trong HTML!)
  → DOMContentLoaded event SAU defer scripts!
  → Dùng cho: main app scripts cần DOM!

  ④ MODULE:
  <script type="module" src="app.mjs"></script>
  → Mặc định = DEFER!
  → Strict mode tự động!
  → Import/export support!

  SO SÁNH:
  ┌──────────┬───────────┬──────────┬──────────┬──────────┐
  │ Feature  │ Normal    │ Async    │ Defer    │ Module   │
  ├──────────┼───────────┼──────────┼──────────┼──────────┤
  │ Download │ Block!    │ Parallel │ Parallel │ Parallel │
  │ Execute  │ Immediate │ Immediate│ After    │ After    │
  │          │ (block!)  │ (block!) │ parse!   │ parse!   │
  │ Order    │ ✅       │ ❌      │ ✅      │ ✅      │
  │ DOM ready│ Before    │ Maybe    │ Before   │ Before   │
  │          │           │ before   │ DCL*     │ DCL      │
  └──────────┴───────────┴──────────┴──────────┴──────────┘
  * DCL = DOMContentLoaded

  CSS LOADING:
  → <link rel="stylesheet"> = RENDER BLOCKING!
  → Nhưng KHÔNG block HTML parsing!
  → Media queries: <link media="print" ...> → không block screen render!
  → Preload: <link rel="preload" as="style" ...> → download TRƯỚC!
```

---

## §8. Reflow & Repaint — Nguyên lý & Tối ưu

```
REFLOW (Layout) vs REPAINT:
═══════════════════════════════════════════════════════════════

  REFLOW (tính toán lại layout):
  → Thay đổi GEOMETRY: width, height, position, margin, padding
  → TỐN KÉM! Ảnh hưởng children + siblings + ancestors!
  → Reflow LUÔN trigger Repaint!

  REPAINT (vẽ lại pixels):
  → Thay đổi APPEARANCE: color, background, visibility, shadow
  → Rẻ hơn Reflow! Chỉ vẽ lại affected pixels!
  → Repaint KHÔNG trigger Reflow!

  ┌─── Reflow (đắt!) ─────────────────────────────┐
  │ Layout → Paint → Composite                     │
  │                                                │
  │ Triggers:                                      │
  │ → width, height, padding, margin, border       │
  │ → display, position, float, overflow           │
  │ → font-size, font-family, line-height          │
  │ → offsetTop, offsetLeft, scrollTop (ĐỌC!)      │
  │ → getComputedStyle(), getBoundingClientRect()  │
  │ → appendChild, removeChild, innerHTML          │
  │ → window.resize, scroll                        │
  └────────────────────────────────────────────────┘

  ┌─── Repaint (rẻ hơn) ─────────────────────────┐
  │ Paint → Composite (skip Layout!)               │
  │                                                │
  │ Triggers:                                      │
  │ → color, background-color, background-image    │
  │ → visibility, outline, box-shadow              │
  │ → border-radius, border-color                  │
  └────────────────────────────────────────────────┘

  ┌─── Composite Only (RẺ NHẤT!) ────────────────┐
  │ Chỉ Composite! (GPU layer!)                   │
  │                                                │
  │ Triggers:                                      │
  │ → transform (translate, scale, rotate)         │
  │ → opacity                                      │
  │ → will-change                                  │
  │ → Animate THESE cho 60fps mượt! ⚡              │
  └────────────────────────────────────────────────┘
```

```javascript
// ═══ TỐI ƯU REFLOW / REPAINT ═══

// ① BATCH DOM reads và writes — TRÁNH layout thrashing!
// ❌ Đọc → Viết → Đọc → Viết (mỗi đọc = forced reflow!):
elements.forEach(el => {
    const h = el.offsetHeight;      // FORCE reflow (đọc!)
    el.style.height = h * 2 + 'px'; // Invalidate (viết!)
    // Vòng tiếp: đọc lại → force reflow NGAY! 💀
});

// ✅ Batch đọc → batch viết:
const heights = elements.map(el => el.offsetHeight); // Đọc TẤT CẢ trước!
elements.forEach((el, i) => {
    el.style.height = heights[i] * 2 + 'px'; // Viết TẤT CẢ sau!
});
// → 1 reflow duy nhất!

// ② DÙng requestAnimationFrame:
// ✅ Viết DOM trong rAF → gộp với browser paint cycle!
requestAnimationFrame(() => {
    el.style.width = '200px';
    el.style.height = '300px';
    // → Browser gộp thành 1 reflow!
});

// ③ Dùng DocumentFragment hoặc display:none:
el.style.display = 'none'; // Rời khỏi render tree!
// ... 100 DOM changes ...    → 0 reflows!
el.style.display = 'block'; // 1 reflow duy nhất!

// ④ Dùng transform thay vì top/left:
// ❌ Reflow:
el.style.top = '100px';
el.style.left = '200px';

// ✅ Composite only (GPU!):
el.style.transform = 'translate(200px, 100px)';

// ⑤ will-change — Hint cho browser promote layer:
.animated-element {
    will-change: transform, opacity;
    /* Browser tạo composite layer TRƯỚC! */
    /* ⚠️ Đừng dùng quá nhiều → tốn memory GPU! */
}

// ⑥ CSS containment — Giới hạn scope reflow:
.card {
    contain: layout style paint;
    /* Reflow bên trong card KHÔNG ảnh hưởng bên ngoài! */
}

// ⑦ Tránh trigger forced reflow properties:
// offsetTop, offsetLeft, offsetWidth, offsetHeight
// scrollTop, scrollLeft, scrollWidth, scrollHeight
// clientTop, clientLeft, clientWidth, clientHeight
// getComputedStyle(), getBoundingClientRect()
// → Đọc 1 lần, cache lại!
```

---

## §9. Garbage Collection — Tránh Memory Leak

```
GARBAGE COLLECTION ALGORITHMS:
═══════════════════════════════════════════════════════════════

  ① REFERENCE COUNTING (cũ — không dùng nữa!):
     → Mỗi object theo dõi số references
     → Reference = 0 → GC thu hồi!
     → ⚠️ VẤN ĐỀ: Circular references!
       let a = {}; let b = {};
       a.ref = b; b.ref = a;
       a = null; b = null;
       // → references VẪN = 1! KHÔNG GC được! 💀

  ② MARK-AND-SWEEP (hiện tại — V8 dùng!):
     → Bắt đầu từ ROOT (global, stack, closures)
     → MARK: duyệt all reachable objects → đánh dấu "live"
     → SWEEP: objects KHÔNG ĐƯỢC đánh dấu → thu hồi!
     → ✅ Giải quyết circular references!

  ┌─── ROOT ──────────────────────────────┐
  │ global           stack                │
  │   │                │                  │
  │   ▼                ▼                  │
  │  obj1 ──→ obj2   obj3                │
  │   ↑        │                          │
  │   └────────┘ (circular — nhưng VẪN    │
  │              reachable từ root!)       │
  │                                       │
  │  obj4 ←→ obj5 (NOT reachable! → GC!) │
  └───────────────────────────────────────┘
```

```
V8 GC — GENERATIONAL GC:
═══════════════════════════════════════════════════════════════

  V8 chia HEAP thành 2 vùng:

  ① YOUNG GENERATION (New Space) — NHỎ (~1-8MB):
     → Objects MỚI TẠO → vào đây!
     → GC THƯỜNG XUYÊN (Scavenger — Minor GC!)
     → Algorithm: Cheney's Semi-space (copy collector)
     → Chia thành FROM + TO:
       → Allocate trong FROM
       → GC: copy live objects FROM → TO
       → Swap FROM ↔ TO!
       → Object sống qua 2 lần GC → promote lên Old!
     → Nhanh! (~1-2ms)

  ② OLD GENERATION (Old Space) — LỚN (~1GB):
     → Objects sống LÂU (promoted từ Young!)
     → GC ÍT hơn (Mark-Sweep-Compact — Major GC!)
     → Mark: mark reachable objects
     → Sweep: free unmarked objects
     → Compact: defragment memory
     → Chậm hơn! (~50-100ms) → incremental marking!

  INCREMENTAL MARKING (V8 optimization):
  → KHÔNG dừng JS hoàn toàn!
  → Mark TỪ TỪ, xen kẽ với JS execution!
  → Giảm pause time đáng kể!
```

```javascript
// ═══ COMMON MEMORY LEAKS — CÁCH TRÁNH ═══

// ① GLOBAL VARIABLES (vô tình!):
function leak() {
    name = 'Alice';    // ❌ Quên var/let/const → global!
    this.data = [];    // ❌ Nếu gọi leak() (this = window!)
}
// ✅ FIX: 'use strict'; hoặc luôn dùng let/const!


// ② FORGOTTEN TIMERS & CALLBACKS:
const interval = setInterval(() => {
    const data = heavyComputation();
    updateUI(data);
}, 1000);
// ❌ Quên clearInterval → callback + data KHÔNG ĐƯỢC GC!

// ✅ FIX:
componentWillUnmount() { clearInterval(interval); }
// React: useEffect cleanup!
useEffect(() => {
    const id = setInterval(fn, 1000);
    return () => clearInterval(id); // Cleanup!
}, []);


// ③ CLOSURES giữ references:
function createHandler() {
    const largeData = new Array(1000000).fill('*');
    return function() {
        console.log(largeData.length);
        // ❌ Closure giữ reference đến largeData!
    };
}
// ✅ FIX: null hóa khi không cần!
function createHandler() {
    let largeData = new Array(1000000).fill('*');
    const len = largeData.length;
    largeData = null; // ✅ Giải phóng!
    return function() {
        console.log(len);
    };
}


// ④ DOM REFERENCES (detached DOM):
const cache = {};
cache.button = document.getElementById('myBtn');
document.body.removeChild(document.getElementById('myBtn'));
// ❌ DOM node ĐÃ XÓA nhưng cache.button VẪN GIỮ reference!
// → Node KHÔNG ĐƯỢC GC!

// ✅ FIX: Xóa reference khi remove DOM!
cache.button = null;
// ✅ Dùng WeakRef / WeakMap:
const weakCache = new WeakMap();
weakCache.set(element, data); // Element bị GC → entry tự xóa!


// ⑤ EVENT LISTENERS quên remove:
element.addEventListener('click', handler);
element.remove(); // ❌ Listener VẪN CÒN! → element không GC!

// ✅ FIX:
element.removeEventListener('click', handler);
element.remove();
// ✅ Hoặc dùng AbortController:
const controller = new AbortController();
el.addEventListener('click', handler, { signal: controller.signal });
controller.abort(); // Remove TẤT CẢ listeners cùng lúc!


// ═══ DEBUG MEMORY LEAKS ═══
// Chrome DevTools → Memory tab:
// → Heap Snapshot: so sánh 2 snapshots → tìm objects TĂNG!
// → Allocation Timeline: xem allocations theo thời gian
// → performance.measureUserAgentSpecificMemory() (experimental)
```

---

## §10. Browser Caching — Chiến lược & Lựa chọn

```
BROWSER CACHING — 2 LOẠI CHÍNH:
═══════════════════════════════════════════════════════════════

  ① STRONG CACHE (Cache-Control / Expires):
     → Browser KHÔNG hỏi server!
     → Dùng local cache trực tiếp! → Status: 200 (from cache)!

  ② CONDITIONAL CACHE (ETag / Last-Modified):
     → Browser HỎI server: "Có thay đổi không?"
     → Server: "Chưa đổi!" → 304 Not Modified (dùng cache!)
     → Server: "Đã đổi!" → 200 + new content!

  ┌─── REQUEST FLOW ─────────────────────────────────────┐
  │                                                      │
  │  ① Có Cache-Control/Expires? (Strong Cache)          │
  │     │                                                │
  │    YES → max-age HẾT CHƯA?                          │
  │     │        │                                       │
  │     │       NO → 200 (from disk/memory cache) ⚡     │
  │     │        │                                       │
  │     │       YES ↓                                    │
  │     │                                                │
  │  ② Có ETag?                                          │
  │     │                                                │
  │    YES → Gửi If-None-Match: "etag-value"             │
  │     │   → Server kiểm tra ETag                       │
  │     │   → Match? → 304! (dùng cache!)                │
  │     │   → Khác? → 200 + new content!                 │
  │     │                                                │
  │  ③ Có Last-Modified?                                 │
  │     │                                                │
  │    YES → Gửi If-Modified-Since: date                 │
  │     │   → Server kiểm tra modification date          │
  │     │   → Chưa đổi? → 304!                          │
  │     │   → Đã đổi? → 200 + new content!              │
  │     │                                                │
  │  ④ Không có cache → 200 + download fresh!            │
  │                                                      │
  └──────────────────────────────────────────────────────┘
```

```
STRONG CACHE:
═══════════════════════════════════════════════════════════════

  EXPIRES (HTTP/1.0) — TUYỆT ĐỐI:
  Expires: Thu, 13 Feb 2027 10:00:00 GMT
  → Hết hạn vào thời điểm CỤ THỂ!
  → ⚠️ Phụ thuộc client clock! (sai giờ → cache sai!)

  CACHE-CONTROL (HTTP/1.1) — TỐT HƠN:
  Cache-Control: max-age=31536000
  → Hết hạn sau 31536000 giây (1 năm) từ response!
  → KHÔNG phụ thuộc clock!
  → Cache-Control > Expires (ưu tiên hơn!)

  DIRECTIVES:
  ┌────────────────────┬────────────────────────────────────┐
  │ Directive          │ Ý nghĩa                            │
  ├────────────────────┼────────────────────────────────────┤
  │ max-age=N          │ Cache N giây                       │
  │ no-cache           │ Cache NHƯNG phải validate mỗi lần! │
  │ no-store           │ KHÔNG cache! (sensitive data!)     │
  │ public             │ CDN/proxy ĐƯỢC cache!              │
  │ private            │ Chỉ browser cache! (có user data!) │
  │ must-revalidate    │ Hết hạn → PHẢI revalidate!        │
  │ s-maxage=N         │ max-age cho shared caches (CDN!)   │
  │ immutable          │ KHÔNG BAO GIỜ revalidate!          │
  │ stale-while-       │ Trả cache cũ TRONG KHI revalidate! │
  │ revalidate=N       │                                    │
  └────────────────────┴────────────────────────────────────┘

  ⚠️ no-cache ≠ no caching!
  → no-cache: CÓ cache, nhưng LUÔN hỏi server trước khi dùng!
  → no-store: THỰC SỰ không cache!
```

```
CONDITIONAL CACHE:
═══════════════════════════════════════════════════════════════

  ETAG (Entity Tag):
  → Server tạo hash/fingerprint cho file
  → Response: ETag: "abc123def"
  → Next request: If-None-Match: "abc123def"
  → Match → 304! Khác → 200 + new!
  → CHÍNH XÁC hơn Last-Modified!

  LAST-MODIFIED:
  → Server gửi: Last-Modified: Thu, 01 Feb 2026 08:00:00 GMT
  → Next request: If-Modified-Since: Thu, 01 Feb 2026 08:00:00 GMT
  → Chưa đổi → 304! Đã đổi → 200 + new!
  → ⚠️ Precision: 1 giây! (file thay đổi trong < 1s → MISS!)
  → ⚠️ Touch file (không đổi nội dung) → sai Last-Modified!

  ETag > Last-Modified (ưu tiên hơn!)
```

```
CHIẾN LƯỢC CACHE THỰC TẾ:
═══════════════════════════════════════════════════════════════

  ① HTML files — NO strong cache! (cổng vào!)
  Cache-Control: no-cache
  → Luôn check server (304 hoặc 200!)
  → HTML trỏ đến CSS/JS có HASH → nếu HTML mới → tải file mới!

  ② CSS/JS bundles — STRONG cache + hash filename!
  Cache-Control: public, max-age=31536000, immutable
  → File: style.abc123.css, app.def456.js
  → Nội dung đổi → hash đổi → URL MỚI → tải fresh!
  → URL cũ → cache 1 năm! ⚡

  ③ Images/Fonts — STRONG cache!
  Cache-Control: public, max-age=31536000

  ④ API responses — Tùy!
  → Dữ liệu thường xuyên đổi: no-cache hoặc max-age=60
  → Dữ liệu ít đổi: max-age=3600 + stale-while-revalidate

  MEMORY CACHE vs DISK CACHE:
  ┌──────────────────┬──────────────┬──────────────┐
  │                  │ Memory Cache │ Disk Cache   │
  ├──────────────────┼──────────────┼──────────────┤
  │ Speed            │ Cực nhanh ⚡  │ Nhanh        │
  │ Persist          │ Tab close = ❌│ ✅ Persist   │
  │ Size             │ Nhỏ          │ Lớn          │
  │ Priority         │ Small files  │ Large files  │
  │                  │ Scripts, CSS │ Images, fonts│
  └──────────────────┴──────────────┴──────────────┘

  PUSH CACHE (HTTP/2):
  → Exists for session duration
  → Cho server-pushed resources
  → Ít dùng nhất!

  THỨ TỰ BROWSER TÌM CACHE:
  Service Worker → Memory Cache → Disk Cache → Push Cache → Network!
```

---

## §11. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  Browser Principles
  ├── Engines: V8(Chrome), SpiderMonkey(Firefox), JSC(Safari)
  │   └── V8: Scanner→Parser→Ignition(bytecode)→TurboFan(optimize!)→Deopt
  ├── URL → Page: DNS→TCP→TLS→Request→Response→Parse→Render
  ├── HTML Parse: Tokenization→TreeConstruction (stack), BLOCK by <script>
  ├── CSS Parse: Tokens→CSSOM, Specificity (!important>#id>.class>element)
  ├── Render: RenderTree→Layout(reflow)→Paint→Composite(GPU layers)
  ├── Resources: normal(block!) vs async(parallel,no order) vs defer(after parse,ordered)
  ├── Reflow/Repaint: reflow(geometry→expensive!) > repaint(appearance) > composite(GPU!)
  ├── GC: Mark-and-Sweep, Generational (Young=Scavenger, Old=Mark-Sweep-Compact)
  │   └── Leaks: globals, timers, closures, detached DOM, event listeners
  └── Caching: Strong(Cache-Control)→Conditional(ETag/Last-Modified)→Network
```

### Checklist

- [ ] **JS Engines**: V8 (Chrome/Node), SpiderMonkey (Firefox), JSC (Safari); Feature detection > userAgent!
- [ ] **V8 Pipeline**: Scanner → Parser (lazy!) → Ignition (bytecode + profiling) → TurboFan (optimize) → Deoptimization (type changed!)
- [ ] **URL→Page 8 bước**: URL parse → DNS → TCP → TLS → HTTP request → Server process → HTML parse + render → Sub-resource loading
- [ ] **HTML Parsing**: Tokenizer (state machine) → Tree Constructor (stack of open elements); Error tolerant!; Incremental!
- [ ] **Script blocking**: `<script>` block parsing! Preload scanner tìm resources trong khi bị block!
- [ ] **CSS blocking**: CSS KHÔNG block parsing, NHƯNG block RENDERING! CSS block JS execution!
- [ ] **CSSOM**: CSS tokens → CSSOM tree; Specificity: !important > inline > #id > .class > element
- [ ] **Render pipeline**: DOM+CSSOM → Render Tree (visible only!) → Layout → Paint → Composite
- [ ] **Composite layer triggers**: will-change, transform, opacity, position:fixed, `<video>`/`<canvas>`
- [ ] **async vs defer**: async = parallel download + execute immediately (NO order!); defer = parallel + after parse (ORDERED!)
- [ ] **Reflow triggers**: geometry changes (width/height/margin), reading offset*/scroll*/client\*, DOM add/remove
- [ ] **Composite only** (cheap!): transform + opacity animation → skip layout+paint → 60fps!
- [ ] **Avoid layout thrashing**: batch reads then writes, rAF, DocumentFragment, display:none trick
- [ ] **GC Mark-and-Sweep**: từ ROOT duyệt reachable → mark → sweep unmarked; giải quyết circular refs!
- [ ] **V8 Generational GC**: Young (Scavenger, fast ~1-2ms) → promote → Old (Mark-Sweep-Compact, slow ~50-100ms, incremental!)
- [ ] **Memory leaks**: accidental globals, forgotten timers/intervals, closures holding large data, detached DOM, event listeners not removed
- [ ] **Strong Cache**: Cache-Control: max-age (relative!) > Expires (absolute, clock-dependent!); no-cache ≠ no caching!
- [ ] **Conditional Cache**: ETag + If-None-Match (accurate!) > Last-Modified + If-Modified-Since (1s precision!)
- [ ] **Cache strategy**: HTML = no-cache; CSS/JS = hash filename + max-age=1year+immutable; Images = strong cache
- [ ] **Cache lookup**: Service Worker → Memory Cache → Disk Cache → Push Cache → Network

---

_Nguồn: ConardLi — "Browser Principles" · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
