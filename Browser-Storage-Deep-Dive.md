# Browser Local Storage — Cookie, Web Storage & IndexedDB Deep Dive

> 📅 2026-02-11 · ⏱ 20 phút đọc
>
> Tài liệu chuyên sâu về Browser Storage: Cookie (fields, security),
> LocalStorage, SessionStorage, so sánh 3 loại, IndexedDB,
> và các phương pháp lưu trữ frontend.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: Browser Storage

---

## Mục Lục

0. [Cookie](#0-cookie)
1. [LocalStorage](#1-localstorage)
2. [SessionStorage](#2-sessionstorage)
3. [Các trường (fields) trong Cookie](#3-các-trường-fields-trong-cookie)
4. [So sánh Cookie vs LocalStorage vs SessionStorage](#4-so-sánh-cookie-vs-localstorage-vs-sessionstorage)
5. [Tổng hợp phương pháp lưu trữ Frontend](#5-tổng-hợp-phương-pháp-lưu-trữ-frontend)
6. [IndexedDB — Đặc điểm chi tiết](#6-indexeddb--đặc-điểm-chi-tiết)
7. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#7-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Cookie

> **🎯 Phương thức local storage ĐẦU TIÊN, ra đời trước HTML5**

```
COOKIE — TỔNG QUAN:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ BAN ĐẦU:
  → Server KHÔNG THỂ xác định 2 requests trên network
    có phải từ CÙNG 1 USER hay không
  → Cookie ra đời để GIẢI QUYẾT vấn đề này

  DEFINITION:
  → PLAIN TEXT file, kích thước chỉ 4KB
  → Được GỬI KÈM mỗi HTTP request
  → Server set → Client lưu → Client gửi lại mỗi request

  ┌──────┐  Request + Cookie       ┌──────┐
  │      │─────────────────────────►│      │
  │Client│                          │Server│
  │      │◄─────────────────────────│      │
  └──────┘  Response + Set-Cookie   └──────┘
```

### Đặc điểm Cookie

```
5 ĐẶC ĐIỂM CHÍNH:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ ① Tên cookie SAU KHI TẠO → KHÔNG THỂ ĐỔI              │
  ├──────────────────────────────────────────────────────────┤
  │ ② KHÔNG chia sẻ cross-domain                            │
  │   → Cookie domain A ≠ Cookie domain B                   │
  │   → Bảo mật: ngăn website khác truy cập cookies       │
  ├──────────────────────────────────────────────────────────┤
  │ ③ Giới hạn: MAX 20 cookies/domain, MAX 4KB/cookie      │
  ├──────────────────────────────────────────────────────────┤
  │ ④ Bảo mật kém: cookie bị intercept → LỘ session info   │
  │   → Kẻ tấn công forward cookie → đạt mục đích        │
  │   → Dù mã hóa vẫn KHÔNG an toàn hoàn toàn            │
  ├──────────────────────────────────────────────────────────┤
  │ ⑤ Cookie được GỬI khi request page MỚI                 │
  │   → TỐN bandwidth cho mỗi request                      │
  └──────────────────────────────────────────────────────────┘
```

### Chia sẻ Cookie cross-domain

```
CHIA SẺ COOKIE CROSS-DOMAIN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ Cách 1: NGINX REVERSE PROXY                             │
  │ → Tất cả requests đi qua 1 proxy                       │
  │ → Proxy chuyển tiếp cookies giữa các domains           │
  ├──────────────────────────────────────────────────────────┤
  │ Cách 2: VIẾT COOKIE cho các websites khác               │
  │ → Login 1 website → ghi cookies vào websites khác      │
  │ → Server-side session lưu trên 1 NODE                  │
  │ → Cookie chỉ lưu sessionId                              │
  │ → Áp dụng cho Single Sign-On (SSO)                      │
  └──────────────────────────────────────────────────────────┘
```

### Use Cases

```
COOKIE USE CASES:
═══════════════════════════════════════════════════════════════

  ① COOKIE + SESSION (phổ biến nhất):
  → Lưu sessionId trong cookie
  → Mỗi request gửi kèm sessionId
  → Server biết AI gửi request → trả response phù hợp

  ② ĐẾM SỐ CLICKS trên page:
  → Cookie lưu số lần click
  → Mỗi lần click → cập nhật cookie
```

---

## 1. LocalStorage

> **🎯 HTML5: lưu trữ lớn (5MB), persistent, KHÔNG gửi theo request**

```
LOCALSTORAGE — ƯU NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ ƯU ĐIỂM:
  ┌──────────────────────────────────────────────────────────┐
  │ ① Kích thước ~5MB (LỚN hơn cookie 4KB rất nhiều)      │
  │ ② PERSISTENT — không mất khi đóng page/browser        │
  │   → Tồn tại VĨNH VIỄN (trừ khi xóa thủ công)        │
  │ ③ Lưu trữ LOCAL — KHÔNG gửi kèm HTTP request          │
  │   → Không tốn bandwidth như cookie                     │
  └──────────────────────────────────────────────────────────┘

  ❌ NHƯỢC ĐIỂM:
  ┌──────────────────────────────────────────────────────────┐
  │ ① Compatibility: Browsers < IE8 KHÔNG hỗ trợ           │
  │ ② Private Mode: browser private → KHÔNG đọc được       │
  │ ③ Same-origin Policy: khác port/protocol/host → NO     │
  └──────────────────────────────────────────────────────────┘
```

### API

```javascript
// ===== LOCALSTORAGE API =====

// Lưu data
localStorage.setItem("key", "value");

// Đọc data
let data = localStorage.getItem("key");

// Xóa 1 item
localStorage.removeItem("key");

// Xóa TẤT CẢ
localStorage.clear();

// Lấy key theo index
localStorage.key(index);
```

### Use Cases

```
LOCALSTORAGE USE CASES:
═══════════════════════════════════════════════════════════════

  ① SKIN / THEME: lưu cấu hình giao diện
  → User đổi theme → lưu vào localStorage
  → Lần sau mở → load theme từ localStorage

  ② USER BROWSING INFO: lịch sử duyệt web
  → Lưu thông tin cá nhân ít thay đổi
  → VD: ngôn ngữ, preferences, last visited
```

---

## 2. SessionStorage

> **🎯 HTML5: giống LocalStorage nhưng ĐÓNG TAB = MẤT DATA**

```
SESSIONSTORAGE — ĐẶC ĐIỂM:
═══════════════════════════════════════════════════════════════

  → Lưu trữ TẠM THỜI theo window/tab
  → Refresh page → DATA VẪN CÒN ✅
  → Đóng window/tab → DATA BỊ XÓA ❌

  SO SÁNH VỚI LOCALSTORAGE:
  ┌────────────────────┬──────────────────┬──────────────────┐
  │ Tiêu chí            │ LocalStorage     │ SessionStorage   │
  ├────────────────────┼──────────────────┼──────────────────┤
  │ Lưu trữ            │ Local            │ Local            │
  │ Same-origin         │ CÓ              │ NGHIÊM NGẶT HƠN │
  │                     │                  │ Cùng window +    │
  │                     │                  │ cùng browser     │
  │ Hết hạn             │ Không (vĩnh viễn)│ Đóng tab = mất  │
  │ Web crawlers        │ KHÔNG crawl được│ KHÔNG crawl được │
  │ Chia sẻ giữa tabs  │ CÓ (same origin) │ KHÔNG ❌         │
  └────────────────────┴──────────────────┴──────────────────┘

  📌 SessionStorage NGHIÊM NGẶT hơn:
  → Chỉ chia sẻ trong CÙNG WINDOW + CÙNG BROWSER
  → Tab A và Tab B (cùng origin) → KHÔNG chia sẻ!
```

### API

```javascript
// ===== SESSIONSTORAGE API =====

// Lưu data
sessionStorage.setItem("key", "value");

// Đọc data
let data = sessionStorage.getItem("key");

// Xóa 1 item
sessionStorage.removeItem("key");

// Xóa TẤT CẢ
sessionStorage.clear();

// Lấy key theo index
sessionStorage.key(index);
```

### Use Cases

```
SESSIONSTORAGE USE CASES:
═══════════════════════════════════════════════════════════════

  → Lưu LOGIN INFO tạm thời (session-based)
  → Lưu BROWSING HISTORY tạm thời
  → Đóng website → TẤT CẢ bị xóa
  → Phù hợp cho data NHẠY CẢM theo phiên
```

---

## 3. Các trường (fields) trong Cookie

> **🎯 Cookie gồm 8 fields chính**

```
8 FIELDS TRONG COOKIE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │  ① NAME                                                  │
  │  → Tên của cookie                                        │
  │  → Sau khi tạo KHÔNG THỂ ĐỔI                           │
  ├──────────────────────────────────────────────────────────┤
  │  ② VALUE                                                  │
  │  → Giá trị cookie                                        │
  │  → Authentication cookies: chứa ACCESS TOKEN             │
  │    do web server cung cấp                                │
  ├──────────────────────────────────────────────────────────┤
  │  ③ SIZE                                                   │
  │  → Kích thước cookie (max 4KB)                           │
  ├──────────────────────────────────────────────────────────┤
  │  ④ PATH                                                   │
  │  → Đường dẫn page có thể TRU CẬP cookie               │
  │  → VD: domain = abc.com, path = /test                   │
  │  → Chỉ pages trong /test đọc được cookie này           │
  ├──────────────────────────────────────────────────────────┤
  │  ⑤ SECURE                                                 │
  │  → Chỉ gửi cookie qua HTTPS (secure protocol)          │
  │  → BẢO VỆ cookie khỏi bị đánh cắp/xuyên tạc         │
  │  → Browser kiểm tra SSL certificate trong HTTPS         │
  │    handshake                                             │
  │  → SSL không hợp lệ → cảnh báo, user chọn tiếp tục   │
  ├──────────────────────────────────────────────────────────┤
  │  ⑥ DOMAIN                                                 │
  │  → Domain có thể truy cập cookie                        │
  │  → Subdomain có thể SET/GET cookies của parent domain  │
  │                                                          │
  │  ✅ HỮU ÍCH: Single Sign-On (SSO)                       │
  │  ❌ RỦI RO: tấn công session targeting                  │
  │                                                          │
  │  → Browser CẤM set Domain = top-level domains           │
  │    (.org, .com, .vn...) để giảm phạm vi tấn công      │
  ├──────────────────────────────────────────────────────────┤
  │  ⑦ HTTPONLY                                               │
  │  → Mặc định: empty → script CÓ THỂ truy cập           │
  │  → Set HTTPOnly → script KHÔNG truy cập được           │
  │  → CHỈ có thể set bởi SERVER (không phải client JS)   │
  │  → CHỐNG XSS: ngăn document.cookie bị đọc/sửa        │
  │                                                          │
  │  ⚠️ Hạn chế:                                             │
  │  → Một số browsers cho phép WRITE (chỉ chặn read)     │
  │  → XHR vẫn đọc được Set-Cookie header                 │
  ├──────────────────────────────────────────────────────────┤
  │  ⑧ EXPIRES / MAX-AGE                                      │
  │  → Thời gian HẾT HẠN của cookie                        │
  │  → Set thời gian → hết hạn → cookie bị xóa            │
  │  → KHÔNG set → default = "Session"                      │
  │  → Session cookie: ĐÓNG BROWSER (toàn bộ) = MẤT       │
  │    (không phải chỉ đóng 1 tab)                          │
  └──────────────────────────────────────────────────────────┘
```

### Tóm tắt 5 thuộc tính quan trọng

```
TÓM TẮT 5 THUỘC TÍNH SET-COOKIE:
═══════════════════════════════════════════════════════════════

  Set-Cookie: name=value;
              expires=Thu, 01 Jan 2027 00:00:00 GMT;
              domain=.example.com;
              path=/;
              secure;
              HttpOnly

  ┌────────────┬──────────────────────────────────────────┐
  │ Thuộc tính  │ Mô tả                                    │
  ├────────────┼──────────────────────────────────────────┤
  │ expires    │ Thời gian hết hạn                        │
  │ domain     │ Domain nào truy cập được                 │
  │ path       │ URL path nào truy cập được               │
  │ secure     │ Chỉ gửi qua HTTPS                       │
  │ HttpOnly   │ Chỉ server truy cập, JS KHÔNG được      │
  └────────────┴──────────────────────────────────────────┘

  domain + path → xác định PHẠM VI URL truy cập cookie
  secure → đảm bảo TRUYỀN TẢI an toàn
  HttpOnly → đảm bảo TRUY CẬP an toàn (chống XSS)
```

---

## 4. So sánh Cookie vs LocalStorage vs SessionStorage

```
COOKIE vs LOCALSTORAGE vs SESSIONSTORAGE:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬────────────┬─────────────┬──────────────┐
  │ Tiêu chí        │ Cookie     │ LocalStorage│ Session-     │
  │                 │            │             │ Storage      │
  ├────────────────┼────────────┼─────────────┼──────────────┤
  │ Kích thước      │ 4KB        │ ~5MB+       │ ~5MB+        │
  ├────────────────┼────────────┼─────────────┼──────────────┤
  │ Thời hạn        │ expires    │ VĨNH VIỄN   │ Đóng tab     │
  │                 │ attribute  │ (trừ manual │ = MẤT        │
  │                 │            │  delete)    │              │
  ├────────────────┼────────────┼─────────────┼──────────────┤
  │ Gửi kèm HTTP   │ CÓ ✅      │ KHÔNG ❌    │ KHÔNG ❌     │
  │ request         │ (mỗi lần) │             │              │
  ├────────────────┼────────────┼─────────────┼──────────────┤
  │ Truy cập        │ Server +   │ Client only │ Client only  │
  │                 │ Client     │             │              │
  ├────────────────┼────────────┼─────────────┼──────────────┤
  │ Same-origin     │ Same-      │ Same-origin │ Same-origin  │
  │                 │ origin     │ pages       │ + SAME       │
  │                 │ pages      │             │ WINDOW       │
  ├────────────────┼────────────┼─────────────┼──────────────┤
  │ Chia sẻ tabs    │ CÓ        │ CÓ          │ KHÔNG ❌     │
  ├────────────────┼────────────┼─────────────┼──────────────┤
  │ API             │ Phức tạp  │ Đơn giản    │ Đơn giản     │
  │                 │ (manual)   │ ✅          │ ✅           │
  ├────────────────┼────────────┼─────────────┼──────────────┤
  │ Set bởi         │ Server     │ Client      │ Client       │
  │                 │ (Set-      │             │              │
  │                 │  Cookie)   │             │              │
  ├────────────────┼────────────┼─────────────┼──────────────┤
  │ Giới hạn domain│ 20 cookies │ Không       │ Không        │
  └────────────────┴────────────┴─────────────┴──────────────┘

  📌 CHO DỮ LIỆU LỚN (vượt quá LocalStorage):
  → Dùng IndexedDB — local database trong browser
  → NoSQL, object repository, KHÔNG phải relational DB
```

---

## 5. Tổng hợp phương pháp lưu trữ Frontend

> **🎯 5 phương pháp: Cookie, LocalStorage, SessionStorage, Web SQL, IndexedDB**

```
5 PHƯƠNG PHÁP LƯU TRỮ FRONTEND:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │  ① COOKIE (trước HTML5)                                  │
  │                                                          │
  │  ✅ Tương thích tốt, gửi kèm request header tiện       │
  │  ❌ Chỉ 4KB, tốn bandwidth, max 20/domain              │
  │  ❌ API phức tạp, cần custom encapsulation               │
  ├──────────────────────────────────────────────────────────┤
  │  ② LOCALSTORAGE (HTML5)                                   │
  │                                                          │
  │  ✅ Dễ dùng, persistent (vĩnh viễn), ~5MB              │
  │  ✅ Tương thích IE8+                                     │
  │  → Key-value pair format                                 │
  ├──────────────────────────────────────────────────────────┤
  │  ③ SESSIONSTORAGE (HTML5)                                 │
  │                                                          │
  │  → Giống LocalStorage nhưng:                             │
  │  → Đóng window → XÓA                                    │
  │  → KHÔNG chia sẻ giữa tabs (khác localStorage)         │
  │  → Session-level storage                                 │
  ├──────────────────────────────────────────────────────────┤
  │  ④ WEB SQL (ĐÃ BỊ BỎ bởi W3C — 2010)                   │
  │                                                          │
  │  → Giống SQLite, RELATIONAL database                    │
  │  → Dùng SQL operations                                   │
  │  → JS cần convert → phiền phức                          │
  │  → Mainstream browsers (trừ Firefox) đã implement       │
  │  ⚠️ BỊ BỎ — dùng IndexedDB thay thế                    │
  ├──────────────────────────────────────────────────────────┤
  │  ⑤ INDEXEDDB (HTML5 official)                             │
  │                                                          │
  │  → NoSQL database, key-value pairs                       │
  │  → Đọc NHANH, phù hợp web scenarios                    │
  │  → JS operation thuận tiện                               │
  │  → STORAGE LỚN (≥250MB, không giới hạn trên)           │
  └──────────────────────────────────────────────────────────┘

  SO SÁNH NHANH:
  ┌────────────┬────────┬──────────┬──────────┬──────────────┐
  │ Phương pháp │ Size   │ Loại DB  │ Hết hạn  │ Trạng thái │
  ├────────────┼────────┼──────────┼──────────┼──────────────┤
  │ Cookie     │ 4KB    │ Key-Val  │ expires  │ Active       │
  │ localStorage│ 5MB+  │ Key-Val  │ manual   │ Active       │
  │ sessionStr │ 5MB+   │ Key-Val  │ tab close│ Active       │
  │ Web SQL    │ Large  │ SQL/Rel  │ manual   │ DEPRECATED   │
  │ IndexedDB  │ 250MB+ │ NoSQL    │ manual   │ Active       │
  └────────────┴────────┴──────────┴──────────┴──────────────┘
```

---

## 6. IndexedDB — Đặc điểm chi tiết

> **🎯 NoSQL database trong browser, key-value, async, transaction support**

```
INDEXEDDB — 6 ĐẶC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │  ① KEY-VALUE PAIR STORAGE                                │
  │                                                          │
  │  → Dùng OBJECT STORE để lưu data                        │
  │  → Lưu TRỰC TIẾP mọi loại data (kể cả JS objects)    │
  │  → Mỗi record có PRIMARY KEY duy nhất                   │
  │  → Key TRÙNG → THROW ERROR!                             │
  ├──────────────────────────────────────────────────────────┤
  │  ② ASYNCHRONOUS (Bất đồng bộ)                           │
  │                                                          │
  │  → Operations KHÔNG lock browser                         │
  │  → User vẫn thao tác được khi đang read/write          │
  │  → ≠ LocalStorage (SYNCHRONOUS — đồng bộ)              │
  │  → Tránh large data read/write → slow webpage          │
  ├──────────────────────────────────────────────────────────┤
  │  ③ TRANSACTION SUPPORT                                    │
  │                                                          │
  │  → Nếu 1 step trong series FAIL:                        │
  │    → CANCEL toàn bộ transaction                         │
  │    → ROLLBACK database về trạng thái trước             │
  │  → KHÔNG có tình trạng data bị sửa 1 phần             │
  │  → ACID compliance!                                      │
  ├──────────────────────────────────────────────────────────┤
  │  ④ SAME-ORIGIN RESTRICTION                                │
  │                                                          │
  │  → Mỗi database tương ứng với DOMAIN tạo ra nó        │
  │  → KHÔNG truy cập cross-domain                          │
  │  → Pages chỉ truy cập DB của domain mình               │
  ├──────────────────────────────────────────────────────────┤
  │  ⑤ LARGE STORAGE SPACE                                    │
  │                                                          │
  │  → LỚN HƠN LocalStorage rất nhiều                      │
  │  → Thông thường ≥ 250MB                                  │
  │  → KHÔNG CÓ GIỚI HẠN TRÊN                               │
  ├──────────────────────────────────────────────────────────┤
  │  ⑥ BINARY STORAGE SUPPORT                                 │
  │                                                          │
  │  → Lưu strings ✅                                        │
  │  → Lưu binary data ✅                                    │
  │    → ArrayBuffer objects                                 │
  │    → Blob objects                                        │
  └──────────────────────────────────────────────────────────┘
```

### IndexedDB vs LocalStorage

```
INDEXEDDB vs LOCALSTORAGE:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬──────────────────┬──────────────────────┐
  │ Tiêu chí        │ LocalStorage     │ IndexedDB            │
  ├────────────────┼──────────────────┼──────────────────────┤
  │ Loại           │ Key-Value store  │ NoSQL Database        │
  │ Kích thước     │ ~5MB             │ ≥250MB (no limit)    │
  │ Sync/Async     │ SYNCHRONOUS      │ ASYNCHRONOUS          │
  │ Transaction    │ KHÔNG            │ CÓ (ACID)            │
  │ Data types     │ Strings only     │ Mọi loại + binary   │
  │ Query          │ Key lookup       │ Index + cursor        │
  │ Same-origin    │ CÓ              │ CÓ                    │
  │ Use case       │ Small data       │ Large/complex data   │
  └────────────────┴──────────────────┴──────────────────────┘
```

---

## 7. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
BROWSER STORAGE — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  COOKIE:     4KB, gửi kèm HTTP, expires, server set
  LOCAL:      5MB+, persistent, client only, same-origin
  SESSION:    5MB+, đóng tab = mất, client, same window
  INDEXEDDB:  250MB+, NoSQL, async, transactions, binary

  COOKIE FIELDS: Name, Value, Size, Path, Secure,
                 Domain, HTTPOnly, Expires/Max-Age

  CROSS-DOMAIN COOKIE: Nginx proxy hoặc SSO (write
                       cookies cho các sites khác)

  PRIORITY DỮ LIỆU NHỎ: Cookie (nếu server cần) hoặc
                         LocalStorage (nếu chỉ client cần)
  PRIORITY DỮ LIỆU LỚN: IndexedDB
  PRIORITY SESSION:       SessionStorage
```

### Câu Hỏi Phỏng Vấn Thường Gặp

**1. Cookie, LocalStorage, SessionStorage khác nhau thế nào?**

> **Cookie**: 4KB, gửi kèm mỗi HTTP request, server set (Set-Cookie), hết hạn theo expires. **LocalStorage**: ~5MB, persistent (vĩnh viễn trừ manual delete), client only, same-origin. **SessionStorage**: ~5MB, đóng tab = mất, KHÔNG chia sẻ giữa tabs (nghiêm ngặt hơn localStorage), session-level. Cả 3 đều tuân thủ same-origin policy nhưng mức độ khác nhau.

**2. Cookie có những trường (fields) nào?**

> 8 fields: **Name** (tên, không đổi sau khi tạo), **Value** (giá trị, chứa access token), **Size** (max 4KB), **Path** (pages nào truy cập được), **Secure** (chỉ gửi qua HTTPS), **Domain** (domain nào truy cập, subdomain có thể access parent), **HTTPOnly** (JS không truy cập được, chống XSS), **Expires/Max-Age** (thời hạn, mặc định Session = đóng browser mất).

**3. HTTPOnly trong cookie có tác dụng gì?**

> HTTPOnly ngăn client-side JS truy cập cookie qua `document.cookie`. Chỉ server mới set được HTTPOnly cookies. **Chống XSS**: kẻ tấn công không thể đọc/steal cookies qua script injection. Hạn chế: một số browsers cho phép write (chỉ chặn read), XHR vẫn đọc Set-Cookie header.

**4. Làm sao chia sẻ cookie cross-domain?**

> 2 cách: ① **Nginx Reverse Proxy** — tất cả requests đi qua 1 proxy chuyển tiếp cookies. ② **Write cookies cho websites khác** — login 1 site → ghi cookies vào sites khác, server session lưu trên 1 node, cookie chỉ lưu sessionId. Cách 2 thường dùng cho **SSO (Single Sign-On)**.

**5. IndexedDB có những đặc điểm gì?**

> 6 đặc điểm: ① **Key-value pairs** (object store, primary key unique). ② **Asynchronous** (không lock browser, khác localStorage sync). ③ **Transaction support** (fail → rollback toàn bộ). ④ **Same-origin** restriction. ⑤ **Large storage** (≥250MB, không giới hạn trên). ⑥ **Binary support** (ArrayBuffer, Blob objects).

**6. Khi nào dùng Cookie, khi nào dùng LocalStorage?**

> **Cookie**: khi server CẦN nhận data mỗi request (authentication, session tracking). **LocalStorage**: khi chỉ client cần (theme, preferences, user info ít thay đổi) — 5MB lớn hơn, không tốn bandwidth. **SessionStorage**: data tạm thời theo session (form data, browsing history tạm).

**7. Frontend có những phương pháp lưu trữ nào?**

> 5 phương pháp: ① **Cookie** (4KB, trước HTML5, gửi kèm request). ② **LocalStorage** (5MB, persistent). ③ **SessionStorage** (5MB, đóng tab = mất). ④ **Web SQL** (deprecated 2010, relational DB dùng SQL). ⑤ **IndexedDB** (HTML5 official, NoSQL, 250MB+, async, transactions). Dữ liệu nhỏ → Cookie/LocalStorage. Dữ liệu lớn → IndexedDB.

**8. SessionStorage có chia sẻ giữa các tabs không?**

> **KHÔNG**. SessionStorage nghiêm ngặt hơn LocalStorage — chỉ chia sẻ trong CùNG window/tab + cùng browser. 2 tabs cùng origin → mỗi tab có SessionStorage RIÊNG. Đây là khác biệt chính so với LocalStorage (chia sẻ giữa tabs cùng origin) và Cookie (cũng chia sẻ giữa tabs).

---

## Checklist Học Tập

- [ ] Hiểu Cookie (4KB, gửi kèm request, 5 đặc điểm)
- [ ] Biết 8 fields trong Cookie (Name, Value, Path, Domain...)
- [ ] Hiểu HTTPOnly + Secure trong Cookie
- [ ] Biết chia sẻ cookie cross-domain (Nginx, SSO)
- [ ] So sánh LocalStorage vs SessionStorage (persistent vs session)
- [ ] Biết APIs: setItem, getItem, removeItem, clear, key
- [ ] So sánh Cookie vs LocalStorage vs SessionStorage (bảng 9 tiêu chí)
- [ ] Biết 5 phương pháp lưu trữ frontend
- [ ] Hiểu IndexedDB (6 đặc điểm: async, transaction, 250MB+...)
- [ ] Biết khi nào dùng Cookie, localStorage, sessionStorage, IndexedDB

---

_Cập nhật lần cuối: Tháng 2, 2026_
