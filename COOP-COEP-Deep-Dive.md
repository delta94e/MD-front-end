# COOP & COEP — Cross-Origin Isolation Deep Dive

> 📅 2026-02-14 · ⏱ 12 phút đọc
>
> Cross-Origin Isolation, Spectre Vulnerability, Context Group,
> COOP, COEP, CORP, CORS, CORB, SharedArrayBuffer
> Độ khó: ⭐️⭐️⭐️⭐️ | Browser Security Interview

---

## Mục Lục

| #   | Phần                                                  |
| --- | ----------------------------------------------------- |
| 1   | Web Composability & Rủi ro bảo mật                    |
| 2   | Same-Origin Policy & Ngoại lệ                         |
| 3   | Browser Context Group                                 |
| 4   | Lỗ hổng Spectre — Tại sao cần Cross-Origin Isolation? |
| 5   | Bảng thuật ngữ — COEP, COOP, CORP, CORS, CORB         |
| 6   | COOP — Cross-Origin Opener Policy                     |
| 7   | CORP & CORS — Cho phép tài nguyên cross-origin        |
| 8   | COEP — Cross-Origin Embedder Policy                   |
| 9   | Kiểm tra Cross-Origin Isolation                       |
| 10  | Tổng kết & Checklist phỏng vấn                        |

---

## §1. Web Composability & Rủi ro bảo mật

```
WEB COMPOSABILITY — SỨC MẠNH & RỦI RO:
═══════════════════════════════════════════════════════════════

  COMPOSABILITY = khả năng KẾT HỢP tài nguyên!
  → Load resources từ NHIỀU NGUỒN KHÁC NHAU!
  → Tăng cường chức năng web page!

  VÍ DỤ:
  ┌────────────────────────────────────────────────────┐
  │  Website của bạn (https://mysite.com)              │
  │  ├── Font từ Google Fonts (fonts.googleapis.com)   │
  │  ├── Image từ CDN (cdn.example.com)                │
  │  ├── Video từ YouTube (youtube.com)                │
  │  ├── Script từ npm CDN (unpkg.com)                 │
  │  └── iframe từ bên thứ ba (widget.example.com)     │
  └────────────────────────────────────────────────────┘

  → Rất MẠNH MẼ + TIỆN LỢI!

  NHƯNG: Tăng NGUY CƠ rò rỉ thông tin!
  → Attacker có thể dùng MỘT SỐ PHƯƠNG PHÁP
    để đánh cắp thông tin user!
  → Side-channel attacks, timing attacks, ...
  → Đặc biệt nguy hiểm với lỗ hổng CPU (Spectre!)
```

---

## §2. Same-Origin Policy & Ngoại lệ

```
SAME-ORIGIN POLICY — HÀNG RÀO BẢO VỆ:
═══════════════════════════════════════════════════════════════

  Browser dùng SAME-ORIGIN POLICY để hạn chế truy cập!
  → Cùng origin: protocol + host + port GIỐNG NHAU!
  → Khác origin → BỊ HẠN CHẾ truy cập tài nguyên!

  VÍ DỤ:
  https://a.example.com:443/page1
  https://a.example.com:443/page2  → CÙNG origin! ✅
  http://a.example.com:443/page1   → KHÁC protocol! ❌
  https://b.example.com:443/page1  → KHÁC host! ❌
  https://a.example.com:8080/page1 → KHÁC port! ❌

  NHƯNG! CÓ NGOẠI LỆ:
  ┌────────────────────────────────────────────────────┐
  │ Bất kỳ website nào ĐỀU CÓ THỂ load:              │
  │                                                    │
  │ ① Embedded cross-domain <iframe>                   │
  │ ② <img>, <script>, <link> resources                │
  │ ③ Mở cross-domain popup qua DOM (window.open)      │
  │                                                    │
  │ → Không bị Same-Origin Policy chặn!                │
  └────────────────────────────────────────────────────┘

  → Đây chính là LỖ HỔNG mà attacker khai thác!
```

---

## §3. Browser Context Group

```
CONTEXT GROUP — NHÓM NGỮ CẢNH TRÌNH DUYỆT:
═══════════════════════════════════════════════════════════════

  Context Group = TẬP HỢP tabs, windows, iframes
  chia sẻ CÙNG NGỮ CẢNH!

  VÍ DỤ:
  ┌──────────────────────────────────────────────────────┐
  │ Website https://a.example mở popup https://b.example │
  │                                                      │
  │  ┌─────────────┐     window.open()    ┌────────────┐│
  │  │ a.example    │ ──────────────────→  │ b.example  ││
  │  │ (opener)     │                      │ (popup)    ││
  │  │              │  ← window.opener     │            ││
  │  └─────────────┘                       └────────────┘│
  │                                                      │
  │  → CÙNG Context Group!                               │
  │  → Truy cập LẪN NHAU qua DOM API!                   │
  │  → window.opener, window.postMessage, ...            │
  └──────────────────────────────────────────────────────┘

  Browser TÁCH cross-domain resources vào Context Group KHÁC NHAU!
  → Resources ở Context Group KHÁC → KHÔNG truy cập được nhau!

  NHƯNG! Ngoại lệ ở §2 phá vỡ sự cách ly này!
  → iframe, popup, images... vẫn CHIA SẺ Context Group!
  → Lỗ hổng Spectre khai thác ĐIỀU NÀY!
```

---

## §4. Lỗ hổng Spectre — Tại sao cần Cross-Origin Isolation?

```
SPECTRE — LỖ HỔNG CPU:
═══════════════════════════════════════════════════════════════

  Spectre = lỗ hổng ở MỨC CPU! (không phải software!)
  → Speculative execution attack!
  → CPU "đoán trước" branch → thực thi trước → cache data!
  → Attacker đọc được cache → LỘ DỮ LIỆU!

  NGUY HIỂM:
  → Attacker CÓ THỂ đọc BẤT KỲ tài nguyên nào
    trong CÙNG Context Group!

  ┌──────────────────────────────────────────────────────┐
  │ Context Group chung                                   │
  │  ┌────────────┐    ┌────────────┐   ┌────────────┐  │
  │  │ Tab 1      │    │ Tab 2      │   │ iframe     │  │
  │  │ bank.com   │    │ evil.com   │   │ widget.com │  │
  │  │ (dữ liệu  │    │ (attacker!)│   │            │  │
  │  │  nhạy cảm!)│    │            │   │            │  │
  │  └────────────┘    └────────────┘   └────────────┘  │
  │                                                      │
  │  evil.com dùng Spectre → ĐỌC dữ liệu bank.com! 💀  │
  └──────────────────────────────────────────────────────┘

  ĐẶC BIỆT NGUY HIỂM VỚI CÁC API TƯƠNG TÁC PHẦN CỨNG:
  ┌────────────────────────────────────────────────────┐
  │ ① SharedArrayBuffer (cần cho WebAssembly Threads!) │
  │   → Chia sẻ memory giữa threads!                   │
  │   → Spectre đọc shared memory → LỘ DATA!           │
  │                                                    │
  │ ② performance.measureUserAgentSpecificMemory()     │
  │   → Đo memory → leak thông tin layout!              │
  │                                                    │
  │ ③ JS Self-Profiling API                             │
  │   → Profile execution → leak timing info!           │
  └────────────────────────────────────────────────────┘

  → Browser ĐÃ TẠM THỜI VÔ HIỆU HÓA SharedArrayBuffer!
  → Và các high-risk APIs khác!
  → ĐỂ BẬT LẠI: cần Cross-Origin Isolation!
```

```
CROSS-ORIGIN ISOLATION — GIẢI PHÁP:
═══════════════════════════════════════════════════════════════

  Để dùng được các API mạnh mẽ (SharedArrayBuffer, ...)
  VÀ đảm bảo AN TOÀN tài nguyên website:
  → Cần tạo MÔI TRƯỜNG CÁCH LY cross-domain cho browser!

  CÁCH THỰC HIỆN: 2 HTTP Headers!
  ┌────────────────────────────────────────────────────┐
  │ Cross-Origin-Embedder-Policy: require-corp         │
  │ Cross-Origin-Opener-Policy: same-origin            │
  └────────────────────────────────────────────────────┘

  → 2 headers này = TẠO CROSS-ORIGIN ISOLATION!
  → Website được đặt vào Context Group RIÊNG BIỆT!
  → Không chia sẻ context với cross-origin resources!
  → SharedArrayBuffer + high-risk APIs = HOẠT ĐỘNG TRỞ LẠI!
```

---

## §5. Bảng thuật ngữ — COEP, COOP, CORP, CORS, CORB

```
5 THUẬT NGỮ CROSS-ORIGIN — PHÂN BIỆT:
═══════════════════════════════════════════════════════════════

  ┌───────┬──────────────────────────────────┬─────────────────────────────┐
  │ Viết  │ Tên đầy đủ                       │ Ý nghĩa                     │
  │ tắt   │                                  │                             │
  ├───────┼──────────────────────────────────┼─────────────────────────────┤
  │ COEP  │ Cross-Origin Embedder Policy     │ Chính sách nhúng cross-origin│
  │       │                                  │ → Kiểm soát resources NHÚ NG │
  │       │                                  │ vào trang (img, iframe, ...) │
  ├───────┼──────────────────────────────────┼─────────────────────────────┤
  │ COOP  │ Cross-Origin Opener Policy       │ Chính sách opener cross-origin│
  │       │                                  │ → Kiểm soát window.opener    │
  │       │                                  │ giữa các trang!              │
  ├───────┼──────────────────────────────────┼─────────────────────────────┤
  │ CORP  │ Cross-Origin Resource Policy     │ Chính sách tài nguyên c-o    │
  │       │                                  │ → Server KHAI BÁO ai được    │
  │       │                                  │ phép LOAD tài nguyên này!    │
  ├───────┼──────────────────────────────────┼─────────────────────────────┤
  │ CORS  │ Cross-Origin Resource Sharing    │ Chia sẻ tài nguyên c-o       │
  │       │                                  │ → Quen thuộc! Access-Control │
  │       │                                  │ headers cho phép cross-origin│
  ├───────┼──────────────────────────────────┼─────────────────────────────┤
  │ CORB  │ Cross-Origin Read Blocking       │ Chặn đọc cross-origin        │
  │       │                                  │ → Browser TỰ ĐỘNG chặn đọc  │
  │       │                                  │ responses cross-origin nhạy  │
  │       │                                  │ cảm (HTML, JSON, XML)!       │
  └───────┴──────────────────────────────────┴─────────────────────────────┘

  MỐI QUAN HỆ:
  ┌────────────────────────────────────────────────────────┐
  │ COOP + COEP = Tạo Cross-Origin Isolation!              │
  │ CORP / CORS = Cho phép resources được load cross-origin│
  │ CORB = Browser tự bảo vệ (không cần config!)          │
  └────────────────────────────────────────────────────────┘
```

---

## §6. COOP — Cross-Origin Opener Policy

```
COOP — KIỂM SOÁT WINDOW.OPENER:
═══════════════════════════════════════════════════════════════

  HTTP Header: Cross-Origin-Opener-Policy
  → Kiểm soát mối quan hệ giữa trang HIỆN TẠI và trang POPUP!

  3 GIÁ TRỊ:

  ┌────────────────────────────────────────────────────────────┐
  │ ① same-origin (NGHIÊM NGẶT NHẤT!)                         │
  │                                                            │
  │ Cross-Origin-Opener-Policy: same-origin                    │
  │                                                            │
  │ → Window cross-origin mở từ trang này = Context Group KHÁC│
  │ → window.opener = null! 🔒                                │
  │ → CÁCH LY HOÀN TOÀN!                                      │
  │                                                            │
  │ VÍ DỤ:                                                    │
  │ https://a.com (COOP: same-origin)                          │
  │   └── window.open("https://b.com")                         │
  │       → b.com ở Context Group RIÊNG!                       │
  │       → b.com: window.opener === null ✅                   │
  │       → a.com KHÔNG THỂ truy cập popup!                    │
  ├────────────────────────────────────────────────────────────┤
  │ ② same-origin-allow-popups (LINH HOẠT HƠN!)               │
  │                                                            │
  │ Cross-Origin-Opener-Policy: same-origin-allow-popups       │
  │                                                            │
  │ → Trang top-level GIỮ REFERENCE đến một số popups!        │
  │ → Popups KHÔNG set COOP → vẫn truy cập được!              │
  │ → Popups set COOP: unsafe-none → vẫn truy cập được!       │
  │ → Popups set COOP: same-origin → bị cách ly!              │
  ├────────────────────────────────────────────────────────────┤
  │ ③ unsafe-none (MẶC ĐỊNH!)                                  │
  │                                                            │
  │ Cross-Origin-Opener-Policy: unsafe-none                    │
  │                                                            │
  │ → Mặc định! Không cách ly!                                 │
  │ → Trang hiện tại + popup = CHIA SẺ Context Group!          │
  │ → window.opener = hoạt động bình thường!                   │
  │ → ⚠️ KHÔNG AN TOÀN với Spectre!                           │
  └────────────────────────────────────────────────────────────┘
```

```
COOP — MINH HỌA:
═══════════════════════════════════════════════════════════════

  KHÔNG CÓ COOP (unsafe-none — mặc định):
  ┌──────────────┐          ┌──────────────┐
  │ a.example     │ opener  │ b.example     │
  │ (COOP: none)  │◄───────►│ (popup)       │
  │               │ truy cập│               │
  │               │ LẪN NHAU│               │
  └──────────────┘          └──────────────┘
  → CÙNG Context Group! → Spectre có thể tấn công! 💀

  CÓ COOP (same-origin):
  ┌──────────────┐          ┌──────────────┐
  │ a.example     │    ❌    │ b.example     │
  │ (COOP: s-o)  │ CÁCH LY │ (popup)       │
  │               │         │ opener = null │
  └──────────────┘          └──────────────┘
  Context Group A           Context Group B
  → KHÁC Context Group! → Spectre KHÔNG tấn công được! ✅
```

---

## §7. CORP & CORS — Cho phép tài nguyên cross-origin

```
ĐỂ BẬT CROSS-ORIGIN ISOLATION:
═══════════════════════════════════════════════════════════════

  COEP (require-corp) yêu cầu:
  → TẤT CẢ cross-origin resources PHẢI KHAI BÁO rõ ràng
    là CÓ THỂ CHIA SẺ!

  2 CÁCH KHAI BÁO:
  ① CORP — Cross-Origin Resource Policy (server-side header!)
  ② CORS — Cross-Origin Resource Sharing (quen thuộc!)
```

```
CORP — CROSS-ORIGIN RESOURCE POLICY:
═══════════════════════════════════════════════════════════════

  HTTP Header: Cross-Origin-Resource-Policy
  → Server KHAI BÁO: ai được phép LOAD tài nguyên này!

  3 GIÁ TRỊ:

  ┌────────────────────────────────────────────────────────────┐
  │ ① same-site                                                │
  │                                                            │
  │ Cross-Origin-Resource-Policy: same-site                    │
  │                                                            │
  │ → Chỉ load từ CÙNG SITE!                                  │
  │ → https://cdn.example.com → https://www.example.com ✅    │
  │   (cùng site: example.com!)                                │
  │ → https://another.com → ❌ CHẶN!                          │
  ├────────────────────────────────────────────────────────────┤
  │ ② same-origin                                              │
  │                                                            │
  │ Cross-Origin-Resource-Policy: same-origin                  │
  │                                                            │
  │ → Chỉ load từ CÙNG ORIGIN!                                │
  │ → Protocol + Host + Port phải GIỐNG HỆT!                  │
  │ → NGHIÊM NGẶT hơn same-site!                              │
  ├────────────────────────────────────────────────────────────┤
  │ ③ cross-origin                                             │
  │                                                            │
  │ Cross-Origin-Resource-Policy: cross-origin                 │
  │                                                            │
  │ → BẤT KỲ website nào CŨNG LOAD ĐƯỢC!                      │
  │ → Dùng cho: CDN images, fonts, videos, scripts!            │
  │ → ⚠️ CDN resource PHẢI set cross-origin!                  │
  │   Nếu không → COEP sẽ CHẶN load!                          │
  └────────────────────────────────────────────────────────────┘
```

```
CORS — CROSS-ORIGIN RESOURCE SHARING:
═══════════════════════════════════════════════════════════════

  Quen thuộc rồi! Nhắc lại nhanh:
  → Server set Access-Control-Allow-Origin header!
  → Access-Control-Allow-Origin: * (cho phép tất cả!)
  → Access-Control-Allow-Origin: https://a.com (chỉ a.com!)

  VỚI COEP: Nếu resource có CORS headers hợp lệ
  → COEP coi như đã được khai báo cho phép! ✅

  KHI KHÔNG KIỂM SOÁT ĐƯỢC SERVER:
  → Không thể thêm CORP / CORS headers!
  → GIẢI PHÁP: thêm attribute crossorigin vào HTML tag!

  <img src="https://cdn.example.com/pic.jpg" crossorigin />
  <script src="https://cdn.example.com/lib.js" crossorigin></script>
  <link href="https://fonts.googleapis.com/..." crossorigin />

  → crossorigin attribute = yêu cầu browser dùng CORS mode!
  → Server CẦN hỗ trợ Access-Control-Allow-Origin!
```

```
CORP vs CORS — SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌───────────┬──────────────────────┬────────────────────────┐
  │           │ CORP                 │ CORS                   │
  ├───────────┼──────────────────────┼────────────────────────┤
  │ Header    │ Cross-Origin-        │ Access-Control-        │
  │           │ Resource-Policy      │ Allow-Origin           │
  ├───────────┼──────────────────────┼────────────────────────┤
  │ Ai set?   │ Server tài nguyên   │ Server tài nguyên      │
  ├───────────┼──────────────────────┼────────────────────────┤
  │ Kiểm soát │ Ai được LOAD        │ Ai được ĐỌC response   │
  │           │ tài nguyên!          │ tài nguyên!            │
  ├───────────┼──────────────────────┼────────────────────────┤
  │ Mức độ    │ Đơn giản hơn!       │ Phức tạp hơn!          │
  │           │ 1 header, 3 values! │ Nhiều headers!          │
  ├───────────┼──────────────────────┼────────────────────────┤
  │ Preflight │ KHÔNG cần!          │ CÓ THỂ cần OPTIONS!    │
  ├───────────┼──────────────────────┼────────────────────────┤
  │ Dùng với  │ ✅ COEP chấp nhận   │ ✅ COEP chấp nhận      │
  │ COEP      │                      │                        │
  └───────────┴──────────────────────┴────────────────────────┘

  → Cả 2 đều hợp lệ cho COEP (require-corp)!
  → CORP đơn giản hơn cho resources bạn KIỂM SOÁT!
  → CORS cho resources bạn KHÔNG kiểm soát (third-party)!
```

---

## §8. COEP — Cross-Origin Embedder Policy

```
COEP — KIỂM SOÁT TÀI NGUYÊN NHÚNG:
═══════════════════════════════════════════════════════════════

  HTTP Header: Cross-Origin-Embedder-Policy
  → Kiểm soát: tài nguyên nào ĐƯỢC PHÉP nhúng vào trang!

  2 GIÁ TRỊ:

  ┌────────────────────────────────────────────────────────────┐
  │ ① require-corp (NGHIÊM NGẶT!)                              │
  │                                                            │
  │ Cross-Origin-Embedder-Policy: require-corp                 │
  │                                                            │
  │ → CHỈ load cross-origin resources ĐƯỢC ĐÁNH DẤU rõ ràng!  │
  │ → Resources PHẢI có: CORP header hoặc CORS headers!        │
  │ → KHÔNG có? → BỊ CHẶN LOAD! ❌                            │
  │                                                            │
  │ VÍ DỤ:                                                    │
  │ <img src="https://cdn.com/pic.jpg" />                      │
  │ → cdn.com KHÔNG có CORP/CORS → BỊ CHẶN! ❌                │
  │                                                            │
  │ <img src="https://cdn.com/pic.jpg" />                      │
  │ → cdn.com trả về CORP: cross-origin → LOAD OK! ✅         │
  ├────────────────────────────────────────────────────────────┤
  │ ② unsafe-none (MẶC ĐỊNH!)                                  │
  │                                                            │
  │ Cross-Origin-Embedder-Policy: unsafe-none                  │
  │                                                            │
  │ → Mặc định! Cho phép tất cả cross-origin resources!        │
  │ → ⚠️ KHÔNG tạo cross-origin isolation!                    │
  └────────────────────────────────────────────────────────────┘
```

```
COEP — REPORT-ONLY MODE:
═══════════════════════════════════════════════════════════════

  TRƯỚC khi bật COEP hoàn toàn → KIỂM TRA trước!
  → Dùng header: Cross-Origin-Embedder-Policy-Report-Only

  Cross-Origin-Embedder-Policy-Report-Only: require-corp

  → Resources KHÔNG TUÂN THỦ:
  → KHÔNG bị chặn load! (vẫn hoạt động bình thường!)
  → NHƯNG: browser gửi REPORT đến server logs!
  → Bạn biết resources nào CẦN FIX!

  FLOW TRIỂN KHAI AN TOÀN:
  ┌──────────────────────────────────────────────────────────┐
  │ ① Set COEP: Report-Only → theo dõi logs                  │
  │ ② Fix tất cả cross-origin resources (thêm CORP/CORS!)    │
  │ ③ Không còn reports → CHUYỂN sang COEP: require-corp!    │
  │ ④ Set COOP: same-origin                                  │
  │ ⑤ Kiểm tra self.crossOriginIsolated === true ✅          │
  └──────────────────────────────────────────────────────────┘
```

```
COOP + COEP — TOÀN BỘ CẤU HÌNH:
═══════════════════════════════════════════════════════════════

  SERVER CONFIG (Node.js / Express):
  ┌────────────────────────────────────────────────────────────┐
  │ // Trang chính:                                            │
  │ app.use((req, res, next) => {                              │
  │     res.setHeader(                                         │
  │         'Cross-Origin-Opener-Policy', 'same-origin'        │
  │     );                                                     │
  │     res.setHeader(                                         │
  │         'Cross-Origin-Embedder-Policy', 'require-corp'     │
  │     );                                                     │
  │     next();                                                │
  │ });                                                        │
  ├────────────────────────────────────────────────────────────┤
  │ // CDN / resources (nếu bạn kiểm soát):                   │
  │ res.setHeader(                                             │
  │     'Cross-Origin-Resource-Policy', 'cross-origin'         │
  │ );                                                         │
  ├────────────────────────────────────────────────────────────┤
  │ // Hoặc dùng CORS headers (nếu đã có sẵn):                │
  │ res.setHeader(                                             │
  │     'Access-Control-Allow-Origin', '*'                     │
  │ );                                                         │
  └────────────────────────────────────────────────────────────┘

  NGINX CONFIG:
  ┌────────────────────────────────────────────────────────────┐
  │ # Trang chính:                                             │
  │ add_header Cross-Origin-Opener-Policy "same-origin";       │
  │ add_header Cross-Origin-Embedder-Policy "require-corp";    │
  │                                                            │
  │ # CDN / static resources:                                  │
  │ add_header Cross-Origin-Resource-Policy "cross-origin";    │
  └────────────────────────────────────────────────────────────┘

  HTML (resources bên thứ 3 — không kiểm soát server):
  ┌────────────────────────────────────────────────────────────┐
  │ <img src="https://third-party.com/pic.jpg" crossorigin />  │
  │ <script src="https://cdn.com/lib.js" crossorigin></script> │
  │ <link href="https://fonts.com/..." crossorigin />          │
  └────────────────────────────────────────────────────────────┘
```

---

## §9. Kiểm tra Cross-Origin Isolation

```javascript
// ═══ KIỂM TRA CROSS-ORIGIN ISOLATION ═══

if (self.crossOriginIsolated) {
  // ✅ Cross-origin isolation THÀNH CÔNG!
  // → Bây giờ có thể sử dụng:

  // ① SharedArrayBuffer:
  const sab = new SharedArrayBuffer(1024);
  // → Chia sẻ memory giữa main thread + Web Workers!
  // → Cần cho WebAssembly Threads!

  // ② performance.measureUserAgentSpecificMemory():
  const result = await performance.measureUserAgentSpecificMemory();
  // → Đo memory usage chính xác!

  // ③ JS Self-Profiling API:
  // → Profile JavaScript execution!

  console.log("🔒 Cross-origin isolated! All APIs available.");
} else {
  console.warn("⚠️ NOT cross-origin isolated!");
  console.warn("Check COOP and COEP headers!");
  // → SharedArrayBuffer KHÔNG khả dụng!
}
```

```
CHECKLIST CẤU HÌNH:
═══════════════════════════════════════════════════════════════

  ① COOP: same-origin → trên trang chính! ✅
  ② COEP: require-corp → trên trang chính! ✅
  ③ Tất cả cross-origin resources:
     → CORP: cross-origin (nếu bạn kiểm soát server!) ✅
     → HOẶC CORS headers (Access-Control-Allow-Origin!) ✅
     → HOẶC crossorigin attr trên HTML tag! ✅
  ④ self.crossOriginIsolated === true → ĐÃ CÁCH LY! ✅

  TROUBLESHOOTING:
  → self.crossOriginIsolated = false?
    → Kiểm tra DevTools → Network tab → Response Headers!
    → Thiếu COOP? Thiếu COEP? Resource bị chặn?
    → Dùng COEP Report-Only trước để debug!
```

```
BROWSER SUPPORT:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬──────────────────────┐
  │ Feature        │ Support              │
  ├────────────────┼──────────────────────┤
  │ COOP           │ Chrome 83+ ✅        │
  │                │ Firefox 79+ ✅       │
  │                │ Safari 15.2+ ✅      │
  │                │ Edge 83+ ✅          │
  ├────────────────┼──────────────────────┤
  │ COEP           │ Chrome 83+ ✅        │
  │                │ Firefox 79+ ✅       │
  │                │ Safari 15.2+ ✅      │
  │                │ Edge 83+ ✅          │
  ├────────────────┼──────────────────────┤
  │ crossOrigin    │ Chrome 87+ ✅        │
  │ Isolated       │ Firefox 72+ ✅       │
  │                │ Safari 15.2+ ✅      │
  └────────────────┴──────────────────────┘

  → Tất cả browsers hiện đại đều HỖ TRỢ! ✅
  → IE? → ❌ Không hỗ trợ (nhưng IE đã chết rồi! 😄)
```

---

## §10. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  Cross-Origin Isolation
  ├── Vấn đề: Web composability → load resources nhiều nguồn → rủi ro!
  ├── Same-Origin Policy: hàng rào bảo vệ NHƯNG có ngoại lệ (iframe, img, popup!)
  ├── Context Group: tabs+windows+iframes chia sẻ cùng context
  │   → Khác context → không truy cập lẫn nhau!
  ├── Spectre: lỗ hổng CPU → đọc BẤT KỲ data trong cùng Context Group!
  │   → Browser vô hiệu hóa SharedArrayBuffer + high-risk APIs!
  │   → Để bật lại → cần Cross-Origin Isolation!
  ├── COOP: Cross-Origin-Opener-Policy
  │   ├── same-origin → cách ly popup → window.opener = null!
  │   ├── same-origin-allow-popups → giữ reference popup unsafe-none!
  │   └── unsafe-none → mặc định, chia sẻ Context Group!
  ├── COEP: Cross-Origin-Embedder-Policy
  │   ├── require-corp → CHỈ load resources có CORP/CORS!
  │   ├── unsafe-none → mặc định, cho phép tất cả!
  │   └── Report-Only mode → debug trước khi bật!
  ├── CORP: Cross-Origin-Resource-Policy (server khai báo!)
  │   ├── same-site → cùng site mới load được!
  │   ├── same-origin → cùng origin mới load được!
  │   └── cross-origin → ai cũng load được! (CDN!)
  ├── CORS: Access-Control-Allow-Origin (quen thuộc!)
  ├── CORB: Browser tự chặn đọc cross-origin nhạy cảm (auto!)
  └── Kiểm tra: self.crossOriginIsolated === true → OK!
```

### Checklist

- [ ] **Web Composability**: Load resources từ nhiều nguồn → mạnh nhưng RỦI RO rò rỉ thông tin!
- [ ] **Same-Origin Policy**: Protocol+Host+Port giống → cùng origin; có NGOẠI LỆ: iframe, img, script, popup!
- [ ] **Context Group**: Tập hợp tabs/windows/iframes chia sẻ cùng context; window.opener truy cập lẫn nhau!
- [ ] **Spectre**: Lỗ hổng CPU (speculative execution); đọc data BẤT KỲ trong cùng Context Group; tấn công qua side-channel!
- [ ] **SharedArrayBuffer bị disable**: Do Spectre; cần Cross-Origin Isolation để bật lại! Cùng performance.measureMemory, Self-Profiling API!
- [ ] **Cross-Origin Isolation**: COOP: same-origin + COEP: require-corp → 2 headers tạo môi trường cách ly!
- [ ] **5 thuật ngữ**: COEP (embedder), COOP (opener), CORP (resource policy), CORS (resource sharing), CORB (read blocking)!
- [ ] **COOP 3 giá trị**: same-origin (cách ly hoàn toàn, opener=null); same-origin-allow-popups (giữ reference popup unsafe-none); unsafe-none (mặc định!)
- [ ] **CORP 3 giá trị**: same-site (cùng site); same-origin (cùng origin); cross-origin (tất cả → dùng cho CDN!)
- [ ] **COEP require-corp**: CHỈ load resources có CORP hoặc CORS headers; không có → BỊ CHẶN!
- [ ] **COEP Report-Only**: Debug trước khi bật; resources vi phạm KHÔNG bị chặn nhưng được REPORT!
- [ ] **crossorigin attribute**: Thêm vào HTML tag (img, script, link) khi không kiểm soát server → dùng CORS mode!
- [ ] **CORP vs CORS**: CORP = 1 header đơn giản (ai LOAD); CORS = nhiều headers phức tạp (ai ĐỌC response); cả 2 hợp lệ cho COEP!
- [ ] **self.crossOriginIsolated**: Boolean API kiểm tra isolation thành công; true → SharedArrayBuffer hoạt động!
- [ ] **Triển khai an toàn**: Report-Only → fix resources → require-corp → COOP → kiểm tra crossOriginIsolated!

---

_Nguồn: ConardLi — "New cross-domain strategy: Using COOP and COEP" · TikTok Frontend Security Team · MDN Web Docs_
_Cập nhật lần cuối: Tháng 2, 2026_
