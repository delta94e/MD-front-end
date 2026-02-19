# \_\_next_f.push & RSC Hydration Data — Deep Dive!

> **Chủ đề**: `__next_f.push`, RSC Hydration, Dynamic Bundling
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. \_\_next_f.push Là Gì?](#1)
2. [§2. Tại Sao Data Này CẦN THIẾT?](#2)
3. [§3. RSC = Dynamic Bundling!](#3)
4. [§4. Data Consistency & Cache!](#4)
5. [§5. Core Web Vitals & Page Performance!](#5)
6. [§6. Server Components KHÔNG CẦN Hydration?](#6)
7. [§7. MPA Mode & Tối Ưu Tương Lai!](#7)
8. [§8. Tự Viết — RSC Payload Serializer!](#8)
9. [§9. Tự Viết — RSC Stream Renderer!](#9)
10. [§10. Tự Viết — RSC Hydration Client!](#10)
11. [§11. Client vs Server Component — Khi Nào Dùng?](#11)
12. [§12. Tổng Kết & Câu Hỏi Phỏng Vấn!](#12)

---

## §1. \_\_next_f.push Là Gì?

```
  __next_f.push — TỔNG QUAN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Khi Next.js render 1 trang, HTML document chứa:      │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  <html>                                          │  │
  │  │  <head>                                          │  │
  │  │    <link rel="stylesheet" ...>                   │  │
  │  │    <script src="/_next/static/chunks/...">       │  │
  │  │  </head>                                         │  │
  │  │  <body>                                          │  │
  │  │    <!-- ① HTML CONTENT (visual) -->              │  │
  │  │    <div id="__next">                             │  │
  │  │      <h1>Hello World</h1>                        │  │
  │  │      <p>Content here...</p>                      │  │
  │  │    </div>                                        │  │
  │  │                                                  │  │
  │  │    <!-- ② INITIAL DATA (cuối document!) -->      │  │
  │  │    <script>                                      │  │
  │  │      self.__next_f.push([1,"0:\"$L1\"\n"])       │  │
  │  │      self.__next_f.push([1,"1:[[\"$\",\"div\"..."])│ │
  │  │      self.__next_f.push([1,"2:{\"children\":..."])│  │
  │  │    </script>                                     │  │
  │  │  </body>                                         │  │
  │  │  </html>                                         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  __next_f.push = MẢNG chứa RSC PAYLOAD                │
  │  = Dữ liệu để React HYDRATE trang!                    │
  │  = "Dynamic Bundle" — thay thế static JS bundles!     │
  │                                                        │
  │  ⚠️ LUÔN Ở CUỐI document!                             │
  │  → Không block visual content!                         │
  │  → Browser paint HTML TRƯỚC, load data SAU!           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  RSC PAYLOAD FORMAT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  self.__next_f.push([1, "0:\"$L1\"\n"])                │
  │                     ▲       ▲                          │
  │                     │       │                          │
  │                  type=1   RSC data (dạng text/stream)  │
  │                  (data)                                │
  │                                                        │
  │  RSC Payload chứa GÌ?                                 │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① Component Tree — cấu trúc cây component     │  │
  │  │    → Tag names, props, children                 │  │
  │  │    → Vị trí Client Components trong cây         │  │
  │  │                                                  │  │
  │  │  ② Client Component References                  │  │
  │  │    → Chunk file nào chứa component code         │  │
  │  │    → Để React biết load chunk nào                │  │
  │  │                                                  │  │
  │  │  ③ Server Component Output                      │  │
  │  │    → KẾT QUẢ render (tag names, text nodes)    │  │
  │  │    → KHÔNG CẦN re-execute trên client!          │  │
  │  │                                                  │  │
  │  │  ④ Serialized Props                             │  │
  │  │    → Props truyền từ Server → Client components │  │
  │  │    → Đã serialize (JSON-like format)            │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Tại Sao Data Này CẦN THIẾT?

```
  TẠI SAO CẦN __next_f.push?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  React CẦN hydration để có INTERACTIVITY!             │
  │                                                        │
  │  "Hydration" = gắn event handlers + state vào HTML    │
  │  HTML tĩnh (từ SSR) → HTML TƯƠNG TÁC (click, type..) │
  │                                                        │
  │  ĐỂ HYDRATE, React cần BIẾT:                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① Cấu trúc component tree (ai chứa ai?)       │  │
  │  │  ② Client components ở ĐÂU trong cây?          │  │
  │  │  ③ Props nào truyền cho component nào?          │  │
  │  │  ④ Server component render RA GÌ? (output)     │  │
  │  │  ⑤ Hidden content (tooltips, modals chưa hiện) │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ❌ KHÔNG THỂ suy ra từ HTML:                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  HTML: <div><h1>Hello</h1><p>World</p></div>    │  │
  │  │                                                  │  │
  │  │  Nhưng cấu trúc component có thể là:            │  │
  │  │  <Layout>          ← Server Component           │  │
  │  │    <Header>        ← Client Component!          │  │
  │  │      <h1>Hello</h1>                             │  │
  │  │    </Header>                                    │  │
  │  │    <Content>       ← Server Component           │  │
  │  │      <p>World</p>                               │  │
  │  │    </Content>                                   │  │
  │  │  </Layout>                                      │  │
  │  │                                                  │  │
  │  │  → HTML giống nhau, nhưng component tree KHÁC!  │  │
  │  │  → React KHÔNG THỂ biết Header là Client       │  │
  │  │    Component chỉ từ HTML!                        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  VÀ CÒN HIDDEN CONTENT:                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  <Tooltip content="Chi tiết sản phẩm">          │  │
  │  │    <button>Hover me</button>                    │  │
  │  │  </Tooltip>                                      │  │
  │  │                                                  │  │
  │  │  HTML chỉ chứa: <button>Hover me</button>       │  │
  │  │  "Chi tiết sản phẩm" CHƯA có trong HTML!       │  │
  │  │  → Cần initial data để React biết nội dung!     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. RSC = Dynamic Bundling!

```
  STATIC BUNDLING vs DYNAMIC BUNDLING:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ❌ TRƯỚC RSC (Pages Router / SPA):                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  STATIC BUNDLING:                                │  │
  │  │                                                  │  │
  │  │  Build time → tạo JS bundles TĨNH:              │  │
  │  │  ┌─────────────────────────────────────────┐    │  │
  │  │  │  main.js     (200kb) — React runtime    │    │  │
  │  │  │  pages/home.js (50kb) — Home page code  │    │  │
  │  │  │  pages/about.js (30kb)                   │    │  │
  │  │  │  pages/admin.js (150kb)                  │    │  │
  │  │  │  vendor.js    (300kb) — 3rd party libs   │    │  │
  │  │  └─────────────────────────────────────────┘    │  │
  │  │                                                  │  │
  │  │  Browser tải bundles → EXECUTE ALL → hydrate    │  │
  │  │  → Phải download + execute TẤT CẢ code!        │  │
  │  │  → Bundle SIZE tăng theo app SIZE!              │  │
  │  │  → CDN cache được (tốt) nhưng SIZE lớn (xấu)   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ✅ SAU RSC (App Router):                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  DYNAMIC BUNDLING:                               │  │
  │  │                                                  │  │
  │  │  Request time → tạo "bundle" ĐỘNG:              │  │
  │  │  ┌─────────────────────────────────────────┐    │  │
  │  │  │  RSC Payload = COMPONENT TREE đã render │    │  │
  │  │  │  + References tới CLIENT chunks cần     │    │  │
  │  │  │  + Props đã serialized                  │    │  │
  │  │  │                                         │    │  │
  │  │  │  Chỉ chứa CÁI GÌ ĐƯỢC RENDER!         │    │  │
  │  │  │  Không chứa code KHÔNG DÙNG!            │    │  │
  │  │  └─────────────────────────────────────────┘    │  │
  │  │                                                  │  │
  │  │  Server Components: KHÔNG gửi code!             │  │
  │  │  → Chỉ gửi OUTPUT (tag names, text)            │  │
  │  │  → Client KHÔNG cần re-execute!                 │  │
  │  │                                                  │  │
  │  │  Client Components: gửi REFERENCE (chunk ID)    │  │
  │  │  → Browser tải chunk + hydrate                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  SO SÁNH SIZE:                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Static Bundle (Pages Router):                   │  │
  │  │  ████████████████████████████████ 500kb+          │  │
  │  │  (Tăng theo app complexity!)                     │  │
  │  │                                                  │  │
  │  │  Dynamic Bundle (App Router RSC):                │  │
  │  │  ██████████████ ~200kb                            │  │
  │  │  (Chỉ chứa cái ĐÃ RENDER + client refs!)       │  │
  │  │                                                  │  │
  │  │  Bet: Dynamic bundles TỐT HƠN cho hầu hết apps │  │
  │  │  đặc biệt khi app lớn + phức tạp!              │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §4. Data Consistency & Cache!

```
  TẠI SAO EMBED TRONG HTML DOCUMENT?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① DATA CONSISTENCY (nhất quán dữ liệu):             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  SSR HTML và Initial Data PHẢI KHỚP NHAU!       │  │
  │  │                                                  │  │
  │  │  ❌ Nếu tách riêng (separate resource):         │  │
  │  │  Request 1: GET /page → HTML (render lúc T=0)   │  │
  │  │  Request 2: GET /data → RSC payload             │  │
  │  │                                                  │  │
  │  │  Vấn đề:                                        │  │
  │  │  • new Date() lúc T=0 ≠ new Date() lúc T=1!   │  │
  │  │  • Database data có thể đã thay đổi!            │  │
  │  │  • HTML và data KHÔNG KHỚP → hydration error!  │  │
  │  │                                                  │  │
  │  │  ✅ Embed trong HTML:                            │  │
  │  │  1 request → HTML + data CÙNG LÚC!             │  │
  │  │  → Luôn nhất quán! Không thể lệch!             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② CACHE INVALIDATION (vô hiệu cache):               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ❌ Nếu tách riêng:                              │  │
  │  │  Cache HTML: /page → cached version A           │  │
  │  │  Cache Data: /data → cached version B           │  │
  │  │                                                  │  │
  │  │  Khi deploy mới:                                │  │
  │  │  HTML invalidated → version C                   │  │
  │  │  Data CHƯA invalidated → vẫn version B!        │  │
  │  │  → MISMATCH! Hydration error!                   │  │
  │  │                                                  │  │
  │  │  ✅ Embed trong HTML:                            │  │
  │  │  Cache 1 resource: /page (chứa cả data)        │  │
  │  │  Invalidate 1 lần → CẢ HAI đều mới!            │  │
  │  │  → Không bao giờ mismatch!                      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ INFRASTRUCTURE CONCERNS:                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ❌ Separate resource có rủi ro:                 │  │
  │  │  • Write quá chậm? User thấy HTML nhưng         │  │
  │  │    không có data → hydration fail!              │  │
  │  │  • Network error? Data request fail!             │  │
  │  │  • Race conditions giữa 2 requests!             │  │
  │  │                                                  │  │
  │  │  ✅ Embed eliminates ALL these issues!           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Core Web Vitals & Page Performance!

```
  INITIAL DATA vs CORE WEB VITALS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  STREAMING ORDER (Next.js HTML Document):             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  PRIORITY CAO ← Gửi TRƯỚC                       │  │
  │  │  ─────────────────────────────────               │  │
  │  │  ① <head> — stylesheets, fonts, meta             │  │
  │  │  ② HTML Shell — visual layout, skeleton          │  │
  │  │  ③ Page Content — SSR'd HTML (visible!)          │  │
  │  │  ④ Streamed HTML — Suspense boundaries resolve   │  │
  │  │  ─────────────────────────────────               │  │
  │  │  PRIORITY THẤP ← Gửi SAU                        │  │
  │  │  ⑤ __next_f.push — Initial data (CUỐI CÙNG!)   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  → FCP/LCP KHÔNG BỊ ẢNH HƯỞNG!                       │
  │  → Initial data KHÔNG BAO GIỜ block visual content!  │
  │                                                        │
  │  PAGE WEIGHT — HIỂU LẦM PHỔ BIẾN:                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ❌ "Page nặng hơn → CWV xấu hơn"              │  │
  │  │                                                  │  │
  │  │  ✅ Page Weight KHÔNG trực tiếp làm CWV xấu!   │  │
  │  │  Nó chỉ là INDIRECT INDICATOR!                  │  │
  │  │                                                  │  │
  │  │  Cái THỰC SỰ ảnh hưởng CWV:                    │  │
  │  │  • Server data fetching chậm                    │  │
  │  │  • Images chưa optimize                         │  │
  │  │  • Fonts chưa preload                           │  │
  │  │  • CSS blocking render                          │  │
  │  │  • JS blocking main thread                      │  │
  │  │                                                  │  │
  │  │  __next_f.push data = KHÔNG thuộc nhóm nào!    │  │
  │  │  → Thêm bytes nhưng KHÔNG ảnh hưởng CWV!      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  TẠI SAO EMBED TỐT HƠN SUBRESOURCE?                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ❌ Subresource (fetch riêng):                   │  │
  │  │  Browser tải /rsc-data → CẠNH TRANH bandwidth! │  │
  │  │  → Có thể STARVE CSS, fonts!                    │  │
  │  │                                                  │  │
  │  │  ✅ Embed in document:                           │  │
  │  │  Data đến SAU visual content                    │  │
  │  │  → KHÔNG cạnh tranh bandwidth!                  │  │
  │  │  → Priority thấp nhất = tối ưu nhất!            │  │
  │  └──────────────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────────┘
```

---

## §6. "Server Components KHÔNG CẦN Hydration" — Hiểu Đúng!

```
  MISCONCEPTION PHỔ BIẾN NHẤT VỀ RSC:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ❌ HIỂU SAI:                                          │
  │  "Server Components không cần hydration"               │
  │  → "Chỉ có HTML, không cần gửi data gì thêm!"        │
  │                                                        │
  │  ✅ HIỂU ĐÚNG:                                         │
  │  "Server Components không cần RE-EXECUTE trên client" │
  │  → NHƯNG vẫn cần biết OUTPUT!                         │
  │                                                        │
  │  Client-only React (trước RSC):                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Step 1: Download JS bundle (code)              │  │
  │  │  Step 2: EXECUTE component code! ← CHẬM!       │  │
  │  │    → fetch data, calculate, produce output      │  │
  │  │  Step 3: Match output vs DOM (hydrate)          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  RSC (App Router):                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Step 1: Nhận RSC Payload (output ĐÃ CÓ!)      │  │
  │  │  Step 2: Match output vs DOM (hydrate)          │  │
  │  │  → SKIP step chậm nhất!                         │  │
  │  │  → Vẫn CẦN payload (tag names, tree)!           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  🐢 CHẬM (skip trên client):     ⚡ NHANH (vẫn cần): │
  │  • Fetching data                  • Match tags→DOM    │
  │  • Complex calculations           • Build tree        │
  │  • Re-executing components        • Attach handlers   │
  │  → Bytes trong stream ≠ re-fetch/re-compute!          │
  └────────────────────────────────────────────────────────┘
```

---

## §7. MPA Mode & Tối Ưu Tương Lai!

```
  MPA MODE & FUTURE OPTIMIZATIONS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① MPA MODE:                                          │
  │  Nếu KHÔNG có Client Components → về lý thuyết       │
  │  không cần initial data. Nhưng Next.js CHƯA hỗ trợ! │
  │  Focus hiện tại: full-stack SPA experience.           │
  │                                                        │
  │  ② LEAF HTML OPTIMIZATION (React tương lai):          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  <Layout>           ← Server (chứa Client)     │  │
  │  │    <Header>         ← Client Component          │  │
  │  │    <Article>        ← Server (LEAF! Không CC)   │  │
  │  │      <h2>Title</h2>                              │  │
  │  │      <p>Content...</p>                           │  │
  │  │    </Article>                                    │  │
  │  │    <Footer>         ← Client Component          │  │
  │  │  </Layout>                                       │  │
  │  │                                                  │  │
  │  │  Article = LEAF HTML TREE                        │  │
  │  │  React CÓ THỂ bỏ qua data cho Article!         │  │
  │  │  → Suy ra từ HTML đủ rồi!                       │  │
  │  │  ⚠️ Chưa bắt đầu, không có ETA!               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ REACT FIRST-CLASS INITIAL DATA:                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Hiện tại: Next.js implement __next_f.push      │  │
  │  │  Tương lai: React implement TRỰC TIẾP!          │  │
  │  │  → Không còn __next_f.push                      │  │
  │  │  → CÓ thứ TƯƠNG ĐƯƠNG do React tạo!            │  │
  │  │  → Data VẪN embed trong Document!               │  │
  │  │  → Dùng cho: RSC, i18n, auth state, v.v.       │  │
  │  └──────────────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────────┘
```

---

## §8. Tự Viết — RSC Payload Serializer!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleRSCPayload
// Mô phỏng cách Next.js serialize RSC component tree!
// ═══════════════════════════════════════════════════════════

var SimpleRSCPayload = (function () {
  var SYMBOLS = {
    SERVER_COMPONENT: "$", // Đã render trên server
    CLIENT_REFERENCE: "$L", // Reference tới client chunk
    ELEMENT: "$$", // React element
  };

  // Serialize component tree → RSC payload chunks:
  function serialize(tree) {
    var chunks = [];
    var chunkId = 0;

    function processNode(node) {
      var id = chunkId++;

      if (!node || typeof node === "string") {
        chunks.push(id + ":" + JSON.stringify(node));
        return '"$T' + id + '"';
      }

      if (node.type === "server") {
        // Server Component → serialize OUTPUT (không gửi code!):
        var childRefs = [];
        if (node.children) {
          node.children.forEach(function (child) {
            childRefs.push(processNode(child));
          });
        }
        chunks.push(
          id +
            ':["$","' +
            node.tag +
            '",' +
            JSON.stringify(node.props || null) +
            "," +
            JSON.stringify(childRefs) +
            "]",
        );
        return '"$' + id + '"';
      }

      if (node.type === "client") {
        // Client Component → serialize REFERENCE (chunk file!):
        chunks.push(
          id +
            ':{"$L":"' +
            node.chunkFile +
            '",' +
            '"name":"' +
            node.name +
            '",' +
            '"props":' +
            JSON.stringify(node.props || {}) +
            "}",
        );
        return '"$L' + id + '"';
      }

      // HTML element:
      var childRefs = [];
      if (node.children) {
        node.children.forEach(function (child) {
          childRefs.push(processNode(child));
        });
      }
      chunks.push(
        id +
          ':["$$","' +
          (node.tag || "div") +
          '",' +
          JSON.stringify(node.props || null) +
          "," +
          JSON.stringify(childRefs) +
          "]",
      );
      return '"$$' + id + '"';
    }

    processNode(tree);
    return chunks;
  }

  // Tạo __next_f.push script tags:
  function generateScriptTags(chunks) {
    return chunks
      .map(function (chunk) {
        return (
          "<script>self.__next_f.push([1," +
          JSON.stringify(chunk + "\n") +
          "])</script>"
        );
      })
      .join("\n");
  }

  return { serialize: serialize, generateScriptTags: generateScriptTags };
})();

// SỬ DỤNG:
var tree = {
  type: "server",
  tag: "Layout",
  props: { className: "main" },
  children: [
    {
      type: "client",
      name: "Header",
      chunkFile: "/_next/static/chunks/Header-abc123.js",
      props: { title: "My App" },
    },
    {
      type: "server",
      tag: "main",
      props: null,
      children: [
        { type: "server", tag: "h1", children: ["Hello World"] },
        { type: "server", tag: "p", children: ["Server rendered!"] },
      ],
    },
    {
      type: "client",
      name: "Footer",
      chunkFile: "/_next/static/chunks/Footer-def456.js",
      props: { year: 2024 },
    },
  ],
};

var chunks = SimpleRSCPayload.serialize(tree);
var scripts = SimpleRSCPayload.generateScriptTags(chunks);
// → Header, Footer = CLIENT references (tải chunk JS)
// → Layout, main, h1, p = SERVER output (không cần code!)
```

---

## §9. Tự Viết — RSC Stream Renderer!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleRSCStreamRenderer
// Mô phỏng cách Next.js stream HTML + initial data!
// ═══════════════════════════════════════════════════════════

var SimpleRSCStreamRenderer = (function () {
  // ① Render component tree → HTML string:
  function renderToHTML(tree) {
    if (!tree) return "";
    if (typeof tree === "string") return tree;

    var tag = tree.tag || "div";
    var props = tree.props || {};
    var propsStr = "";
    for (var key in props) {
      if (key !== "children" && props[key] != null) {
        propsStr += " " + key + '="' + props[key] + '"';
      }
    }

    var childrenHTML = "";
    if (tree.children) {
      tree.children.forEach(function (child) {
        childrenHTML += renderToHTML(child);
      });
    }

    // Self-closing tags:
    var selfClosing = ["img", "br", "hr", "input", "meta", "link"];
    if (selfClosing.indexOf(tag) !== -1) {
      return "<" + tag + propsStr + " />";
    }

    return "<" + tag + propsStr + ">" + childrenHTML + "</" + tag + ">";
  }

  // ② Simulate streaming response:
  function streamResponse(tree, rscChunks) {
    var stream = [];

    // PRIORITY 1: Document head
    stream.push({
      priority: 1,
      type: "head",
      content:
        "<!DOCTYPE html><html><head>" +
        '<meta charset="utf-8">' +
        '<link rel="stylesheet" href="/styles.css">' +
        "</head>",
    });

    // PRIORITY 2: Visual HTML content
    stream.push({
      priority: 2,
      type: "body-start",
      content: '<body><div id="__next">',
    });

    // PRIORITY 3: SSR'd page content
    stream.push({
      priority: 3,
      type: "page-content",
      content: renderToHTML(tree),
    });

    stream.push({
      priority: 3,
      type: "body-close-visual",
      content: "</div>",
    });

    // PRIORITY 5 (LOWEST): RSC initial data
    // → LUÔN ở cuối! Không block visual!
    stream.push({
      priority: 5,
      type: "initial-data",
      content: "<script>self.__next_f=self.__next_f||[]</script>",
    });

    rscChunks.forEach(function (chunk) {
      stream.push({
        priority: 5,
        type: "rsc-chunk",
        content:
          "<script>self.__next_f.push([1," +
          JSON.stringify(chunk + "\n") +
          "])</script>",
      });
    });

    stream.push({
      priority: 5,
      type: "end",
      content: "</body></html>",
    });

    return stream;
  }

  // ③ Combine stream → final HTML:
  function toHTML(stream) {
    return stream
      .map(function (s) {
        return s.content;
      })
      .join("\n");
  }

  return {
    renderToHTML: renderToHTML,
    streamResponse: streamResponse,
    toHTML: toHTML,
  };
})();

// SỬ DỤNG:
var pageTree = {
  tag: "main",
  props: { className: "page" },
  children: [
    { tag: "h1", children: ["Welcome!"] },
    { tag: "p", children: ["Server rendered content"] },
  ],
};

var rscChunks = ['0:["$","Layout",null]', '1:{"$L":"Header-abc.js"}'];
var stream = SimpleRSCStreamRenderer.streamResponse(pageTree, rscChunks);
var html = SimpleRSCStreamRenderer.toHTML(stream);
// → HTML visual content TRƯỚC
// → __next_f.push script tags CUỐI CÙNG!
// → Browser paint ngay, không chờ RSC data!
```

---

## §10. Tự Viết — RSC Hydration Client!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleRSCHydrator
// Mô phỏng cách React hydrate RSC payload trên client!
// ═══════════════════════════════════════════════════════════

var SimpleRSCHydrator = (function () {
  // ① Buffer để nhận chunks từ __next_f.push:
  var buffer = [];
  var parsed = {};
  var clientModules = {};

  // ② Nhận chunk (giống self.__next_f.push):
  function receiveChunk(chunk) {
    var type = chunk[0];
    var data = chunk[1];
    buffer.push(data);

    // Parse chunk data:
    var colonIdx = data.indexOf(":");
    if (colonIdx > -1) {
      var id = data.substring(0, colonIdx);
      var value = data.substring(colonIdx + 1).trim();
      parsed[id] = value;
    }
  }

  // ③ Kiểm tra node có phải Client Component reference:
  function isClientReference(value) {
    return typeof value === "string" && value.indexOf("$L") !== -1;
  }

  // ④ Load client component chunk:
  function loadClientModule(chunkFile, name) {
    if (clientModules[chunkFile]) {
      return Promise.resolve(clientModules[chunkFile]);
    }

    return new Promise(function (resolve) {
      console.log("[Hydrator] Loading client chunk: " + chunkFile);
      // Giả lập network fetch:
      setTimeout(function () {
        clientModules[chunkFile] = {
          name: name,
          hydrated: true,
          handlers: { onClick: function () {}, onChange: function () {} },
        };
        console.log("[Hydrator] Client chunk loaded: " + name + " ✅");
        resolve(clientModules[chunkFile]);
      }, 50);
    });
  }

  // ⑤ Hydrate: match RSC tree vs DOM:
  function hydrate(domRoot) {
    var results = {
      serverComponents: 0,
      clientComponents: 0,
      domNodesMatched: 0,
      handlers: [],
    };

    // Walk through parsed RSC data:
    for (var id in parsed) {
      var data = parsed[id];

      if (isClientReference(data)) {
        // Client Component → cần LOAD CHUNK + HYDRATE:
        results.clientComponents++;
        results.handlers.push("Event handlers attached for chunk " + id);
      } else {
        // Server Component → chỉ MATCH DOM, không execute!
        results.serverComponents++;
        results.domNodesMatched++;
        // ⚡ NHANH! Chỉ verify DOM node tồn tại!
      }
    }

    return results;
  }

  // ⑥ Get full state:
  function getState() {
    return {
      chunksReceived: buffer.length,
      parsed: Object.keys(parsed).length,
      clientModulesLoaded: Object.keys(clientModules).length,
    };
  }

  return {
    receiveChunk: receiveChunk,
    loadClientModule: loadClientModule,
    hydrate: hydrate,
    getState: getState,
  };
})();

// SỬ DỤNG — Simulate __next_f.push flow:
// Browser nhận HTML → paint → rồi nhận RSC data:

SimpleRSCHydrator.receiveChunk([1, '0:["$","Layout",null,["$1","$2"]]']);
SimpleRSCHydrator.receiveChunk([1, '1:{"$L":"Header-abc.js","name":"Header"}']);
SimpleRSCHydrator.receiveChunk([1, '2:["$","main",null,["$3","$4"]]']);
SimpleRSCHydrator.receiveChunk([1, '3:["$","h1",null,"Hello World"]']);
SimpleRSCHydrator.receiveChunk([1, '4:["$","p",null,"Content"]']);

var result = SimpleRSCHydrator.hydrate(document.getElementById("__next"));
// → serverComponents: 4  (Layout, main, h1, p — chỉ match DOM!)
// → clientComponents: 1  (Header — load chunk + attach handlers!)
// → Server components: NHANH (không re-execute!)
// → Client components: cần load JS chunk nhưng chỉ component ĐÓ!
```

---

## §11. Client vs Server Component — Khi Nào Dùng?

```
  CLIENT vs SERVER — QUYẾT ĐỊNH ĐÚNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  DÙNG SERVER COMPONENT khi:                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ✅ Data fetching (API, database)               │  │
  │  │  ✅ Logic cần server-only (secrets, env vars)   │  │
  │  │  ✅ Heavy computation                           │  │
  │  │  ✅ Content unique theo request                  │  │
  │  │  ✅ Layouts, pages (mặc định!)                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  DÙNG CLIENT COMPONENT khi:                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ✅ Interactivity (onClick, onChange...)         │  │
  │  │  ✅ useState, useEffect, useRef                 │  │
  │  │  ✅ Browser APIs (localStorage, navigator)      │  │
  │  │  ✅ Repeated markup (compress thành JS!)        │  │
  │  │  ✅ Content cần cache CDN (static bundle!)      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚡ MICRO-OPTIMIZATION TIP:                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Nếu component có REPEATED MARKUP lớn:          │  │
  │  │                                                  │  │
  │  │  Server Component:                               │  │
  │  │  → RSC payload chứa FULL HTML cho mỗi lần lặp  │  │
  │  │  → 100 items × 500 bytes = 50KB RSC payload!   │  │
  │  │                                                  │  │
  │  │  Client Component:                               │  │
  │  │  → JS template: 2KB (load 1 lần!)              │  │
  │  │  → Data: 100 items × 50 bytes = 5KB             │  │
  │  │  → Tổng: 7KB << 50KB!                           │  │
  │  │                                                  │  │
  │  │  ⚠️ Chỉ optimize khi cần! Đừng lo lắng quá!  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  MIGRATION STRATEGY (Pages Router → App Router):      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Step 1: Layouts + Pages = Client Components    │  │
  │  │          (giữ nguyên behavior!)                  │  │
  │  │  Step 2: Tìm client-side data fetching          │  │
  │  │          → Chuyển sang Server Components         │  │
  │  │  Step 3: Nếu component cần CDN cache            │  │
  │  │          → Giữ Client Component!                 │  │
  │  │  Step 4: Dynamic data → RSC (có thể dynamic)    │  │
  │  │  Step 5: Static document → cache LUÔN data!     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ⚠️ MỤC TIÊU RSC KHÔNG PHẢI loại bỏ Client         │
  │  Components! Không nên ép migrate tất cả lên server! │
  │  → Cân bằng giữa tree size và bundle size!           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §12. Tổng Kết & Câu Hỏi Phỏng Vấn!

```
  TỔNG KẾT — __next_f.push & RSC HYDRATION:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① __next_f.push = RSC Payload                        │
  │     = Initial Data cho React hydrate!                  │
  │     = "Dynamic Bundle" thay static JS bundles!         │
  │                                                        │
  │  ② Data này CẦN THIẾT vì:                             │
  │     → React cần component tree structure               │
  │     → Cần biết Client Components ở đâu                │
  │     → Hidden content không có trong HTML               │
  │     → Không thể suy ra từ HTML!                       │
  │                                                        │
  │  ③ EMBED trong HTML Document vì:                      │
  │     → Data consistency (HTML + data cùng lúc!)        │
  │     → Cache invalidation (1 resource!)                │
  │     → Không cạnh tranh bandwidth!                     │
  │     → Priority thấp nhất, không block paint!          │
  │                                                        │
  │  ④ Server Components:                                 │
  │     → KHÔNG re-execute trên client! (nhanh!)          │
  │     → VẪN cần output data (tag names, props)!        │
  │     → Bytes ≠ re-fetch/re-compute!                   │
  │                                                        │
  │  ⑤ Tương lai React:                                   │
  │     → First-class initial data support                │
  │     → Leaf HTML optimization                          │
  │     → Vẫn embed trong Document!                       │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

**❓ Q1: \_\_next_f.push là gì? Tại sao cần thiết?**

> `__next_f.push` = mảng chứa **RSC Payload** — dữ liệu ban đầu để React hydrate trang. Nó chứa: component tree structure, Client Component references (chunk files), Server Component output (tag names), và serialized props. Cần thiết vì React KHÔNG THỂ suy ra component tree từ HTML — cùng HTML `<div><h1>Hello</h1></div>` có thể là nhiều cấu trúc component khác nhau. Ngoài ra, hidden content (tooltips, modals) không có trong HTML nên cần data để React biết!

**❓ Q2: Tại sao initial data nằm CUỐI HTML document?**

> Next.js deliberately đặt `__next_f.push` ở **cuối document** vì: ① Browser streaming render — parse + paint visual content TRƯỚC khi gặp script tags. ② Priority thấp nhất — không block FCP/LCP. ③ Không cạnh tranh bandwidth với CSS, fonts, images — nếu fetch riêng (subresource) sẽ STARVE bandwidth từ critical resources. ④ Page Weight thêm KHÔNG ảnh hưởng CWV — chỉ là indirect indicator!

**❓ Q3: RSC "dynamic bundling" khác "static bundling" thế nào?**

> **Static bundling** (Pages Router): Build time tạo JS bundles tĩnh → browser download ALL + execute → hydrate. Bundle size tăng theo app size! **Dynamic bundling** (RSC): Request time tạo "bundle" động = RSC Payload chỉ chứa CÁI ĐÃ RENDER + client refs. Server Components gửi OUTPUT (không gửi code!), Client Components gửi REFERENCE (chunk ID). Total size thường nhỏ hơn và nhanh hơn hydrate!

**❓ Q4: Tại sao không tách initial data thành separate resource?**

> Ba lý do: ① **Data consistency** — SSR HTML render lúc T=0, nếu fetch data riêng lúc T=1 thì `new Date()` hay DB data có thể KHÁC → hydration mismatch! Embed = luôn nhất quán. ② **Cache invalidation** — nếu tách, cache HTML và cache data cần sync → phức tạp! Embed = invalidate 1 lần. ③ **Infrastructure** — separate resource có rủi ro: write chậm, network error, race conditions!

**❓ Q5: "Server Components không cần hydration" — hiểu thế nào cho đúng?**

> Câu này có nghĩa Server Components không cần **re-execute** trên client (KHÔNG fetch data, KHÔNG calculate lại). Nhưng React VẪN CẦN biết output của chúng (tag names, text) để **match DOM nodes** và build đúng component tree. Phần "line up" này rất NHANH — chỉ verify DOM tồn tại, không có bất kỳ slow operation nào. Bytes trong stream ≠ re-fetch/re-compute!

**❓ Q6: Khi nào nên dùng Client Component thay vì Server Component?**

> Dùng Client Component khi: ① Cần interactivity (onClick, onChange). ② Dùng hooks (useState, useEffect). ③ Browser APIs. ④ **Repeated markup** — 100 items × 500 bytes Server = 50KB payload, nhưng Client template 2KB + data 5KB = 7KB! ⑤ Cần CDN cache (static bundle). Mục tiêu RSC **KHÔNG PHẢI** loại bỏ Client Components — cân bằng tree size vs bundle size!

**❓ Q7: React tương lai sẽ thay đổi \_\_next_f.push thế nào?**

> React sẽ implement **first-class initial data** trực tiếp — mọi SSR React project không cần tự implement. Sẽ KHÔNG CÒN `__next_f.push` nhưng CÓ thứ TƯƠNG ĐƯƠNG. Data VẪN embed trong Document (cùng lý do). Thêm vào đó, **leaf HTML optimization** cho phép bỏ qua payload cho server component subtrees KHÔNG chứa client components — suy từ HTML đủ. Tuy nhiên chưa có ETA và impact phụ thuộc vào mức interactive của app!

---

> 📝 **Ghi nhớ cuối cùng:**
> "`__next_f.push` = RSC Payload = Dynamic Bundle! CẦN THIẾT vì React không suy ra component tree từ HTML! EMBED trong Document: data consistency, cache invalidation, không cạnh tranh bandwidth! CUỐI document = không block FCP/LCP! Page Weight ≠ CWV! Server Components không re-execute nhưng VẪN cần output data! Bytes ≠ re-compute! Client Components cho interactivity + repeated markup + CDN cache! RSC KHÔNG loại bỏ Client Components — cân bằng! Tương lai: React first-class initial data + leaf HTML optimization!"
