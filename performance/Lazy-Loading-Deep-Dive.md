# Lazy Loading — Tải Chậm Hình Ảnh & Tài Nguyên Deep Dive

> 📅 2026-02-11 · ⏱ 15 phút đọc
>
> Tài liệu chuyên sâu về Lazy Loading: Khái niệm, đặc điểm,
> nguyên lý triển khai (offsetTop / scrollTop / innerHeight),
> Native JS implementation, IntersectionObserver API,
> và so sánh Lazy Loading vs Preloading.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: Frontend Performance Optimization

---

## Mục Lục

0. [Lazy Loading là gì?](#0-lazy-loading-là-gì)
1. [Đặc điểm của Lazy Loading](#1-đặc-điểm-của-lazy-loading)
2. [Nguyên lý triển khai](#2-nguyên-lý-triển-khai)
3. [Triển khai — Native JavaScript](#3-triển-khai--native-javascript)
4. [Triển khai — IntersectionObserver API](#4-triển-khai--intersectionobserver-api)
5. [Lazy Loading vs Preloading](#5-lazy-loading-vs-preloading)
6. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#6-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Lazy Loading là gì?

> **🎯 Trì hoãn loading images NGOÀI viewport → chỉ load KHI CẦN**

```
LAZY LOADING — ĐỊNH NGHĨA:
═══════════════════════════════════════════════════════════════

  Lazy Loading (tải chậm / deferred loading / on-demand loading)

  → Trì hoãn loading IMAGE DATA trong long web pages
  → Images NGOÀI visible area → CHƯA LOAD
  → Chỉ load KHI USER SCROLL tới

  VẤN ĐỀ KHI KHÔNG CÓ LAZY LOADING:
  ┌──────────────────────────────────────────────────────────┐
  │ Long page với NHIỀU images                               │
  │ → Load TẤT CẢ images cùng lúc                          │
  │ → User CHỈ THẤY 1 phần nhỏ (viewport)                  │
  │ → Phí BANDWIDTH + PERFORMANCE cho phần không thấy      │
  └──────────────────────────────────────────────────────────┘

  GIẢI PHÁP — LAZY LOADING:
  ┌──────────────────────────────────────────────────────────┐
  │ Images NGOÀI viewport → KHÔNG LOAD                      │
  │ User SCROLL tới → MỚI LOAD                              │
  │ → Webpage load NHANH hơn                                 │
  │ → Server load GIẢM                                       │
  │ → Phù hợp: e-commerce, long lists, image galleries     │
  └──────────────────────────────────────────────────────────┘
```

---

## 1. Đặc điểm của Lazy Loading

```
3 ĐẶC ĐIỂM CHÍNH:
═══════════════════════════════════════════════════════════════

  ① GIẢM TẢI TÀI NGUYÊN KHÔNG CẦN THIẾT:
  ┌──────────────────────────────────────────────────────────┐
  │ → Giảm đáng kể SERVER LOAD + TRAFFIC                   │
  │ → Giảm gánh nặng trên BROWSER                          │
  │ → Chỉ load resources user THỰC SỰ CẦN                 │
  └──────────────────────────────────────────────────────────┘

  ② CẢI THIỆN USER EXPERIENCE:
  ┌──────────────────────────────────────────────────────────┐
  │ → Load NHIỀU images cùng lúc → CHỜ ĐỢI LÂU           │
  │ → Lazy loading → trang hiển thị NGAY                   │
  │ → Images load dần khi scroll → mượt mà hơn            │
  └──────────────────────────────────────────────────────────┘

  ③ TRÁNH BLOCK TÀI NGUYÊN KHÁC:
  ┌──────────────────────────────────────────────────────────┐
  │ → Load QUÁ NHIỀU images → BLOCK JS, CSS, fonts...     │
  │ → Ảnh hưởng hoạt động bình thường của website          │
  │ → Lazy loading → ưu tiên load CRITICAL resources      │
  └──────────────────────────────────────────────────────────┘
```

---

## 2. Nguyên lý triển khai

> **🎯 data-src lưu path → kiểm tra viewport → gán vào src**

```
NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  Image loading ĐƯỢC TRIGGER bởi thuộc tính SRC
  → Khi có src → browser REQUEST image resource

  NGUYÊN LÝ LAZY LOADING:
  ① Dùng data-src lưu ĐƯỜNG DẪN thật của image
  ② src = placeholder (loading.gif hoặc rỗng)
  ③ Khi image VÀO VIEWPORT → gán data-src vào src
  ④ Browser TRIGGER loading image

  <img src="loading.gif" data-src="pic.png">
       ↑ placeholder        ↑ đường dẫn thật
       (không load pic)     (lưu tạm, chưa load)
```

### Xác định image trong viewport

```
XÁC ĐỊNH IMAGE TRONG VIEWPORT:
═══════════════════════════════════════════════════════════════

  3 GIÁ TRỊ QUAN TRỌNG:

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │ ┊ scrollTop                                             │
  │ ┊ (khoảng cách đã scroll)    ← document.body.scrollTop │
  │ ┊                            ← document.documentElement │
  │ ┊                               .scrollTop              │
  │ ▼                                                       │
  │ ╔═══════════════════════════════════════════════════╗   │
  │ ║                                                   ║   │
  │ ║             BROWSER VIEWPORT                      ║   │
  │ ║                                                   ║   │
  │ ║             window.innerHeight ──────► chiều cao  ║   │
  │ ║                     viewport                      ║   │
  │ ║                                                   ║   │
  │ ╚═══════════════════════════════════════════════════╝   │
  │                                                         │
  │ ┊                                                       │
  │ ┊ offsetTop                                             │
  │ ┊ (khoảng cách từ top element ← imgs[i].offsetTop      │
  │ ┊  tới top document)                                    │
  │ ▼                                                       │
  │ ┌───────────────────────────┐                           │
  │ │     🖼️ IMAGE TO LOAD      │                           │
  │ └───────────────────────────┘                           │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  ĐIỀU KIỆN LOAD IMAGE:

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  img.offsetTop  <  scrollTop + innerHeight               │
  │  ─────────────     ────────────────────────              │
  │  vị trí image     phần dưới cùng viewport               │
  │  từ top document  (đã scroll + chiều cao VP)            │
  │                                                          │
  │  → Nếu TRUE: image TRONG viewport → LOAD!              │
  │  → Nếu FALSE: image CHƯA tới viewport → CHƯA LOAD     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  VISUAL:
  ┌─── scrollTop = 200 ────────────────────────────────────┐
  │ ┊ 200px đã scroll lên                                  │
  │ ╔══════════════════════════════════════╗ ← top viewport │
  │ ║                                      ║               │
  │ ║ innerHeight = 600px                  ║               │
  │ ║                                      ║               │
  │ ╚══════════════════════════════════════╝ ← 800px       │
  │                                                         │
  │   Image A: offsetTop = 750 < 800 → LOAD ✅             │
  │   Image B: offsetTop = 1200 > 800 → CHƯA LOAD ❌      │
  └─────────────────────────────────────────────────────────┘
```

---

## 3. Triển khai — Native JavaScript

> **🎯 scroll event + offsetTop < scrollTop + innerHeight**

```html
<!-- HTML: src = placeholder, data-src = đường dẫn thật -->
<div class="container">
  <img src="loading.gif" data-src="pic1.png" />
  <img src="loading.gif" data-src="pic2.png" />
  <img src="loading.gif" data-src="pic3.png" />
  <img src="loading.gif" data-src="pic4.png" />
  <img src="loading.gif" data-src="pic5.png" />
  <img src="loading.gif" data-src="pic6.png" />
</div>
```

```javascript
// ===== Native JavaScript Lazy Loading =====
var imgs = document.querySelectorAll("img");

function lazyLoad() {
  var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
  var winHeight = window.innerHeight;

  for (var i = 0; i < imgs.length; i++) {
    // Điều kiện: image trong viewport
    if (imgs[i].offsetTop < scrollTop + winHeight) {
      // Gán data-src vào src → trigger loading
      imgs[i].src = imgs[i].getAttribute("data-src");
    }
  }
}

// Trigger khi scroll
window.onscroll = lazyLoad;

// Cũng nên gọi 1 lần khi page load (cho images đã trong VP)
window.onload = lazyLoad;
```

```
NATIVE JS — NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ❌ scroll event FIRES RẤT NHIỀU → performance issue
  ❌ Cần THROTTLE/DEBOUNCE để giảm tần suất
  ❌ offsetTop tính toán gây REFLOW
  ❌ Code verbose, cần quản lý thủ công
```

### Cải thiện: Throttle

```javascript
// ===== Lazy Loading + Throttle =====
function throttle(fn, delay) {
  let timer = null;
  return function () {
    if (!timer) {
      timer = setTimeout(() => {
        fn.apply(this, arguments);
        timer = null;
      }, delay);
    }
  };
}

// Scroll event chỉ fire mỗi 200ms
window.addEventListener("scroll", throttle(lazyLoad, 200));
```

---

## 4. Triển khai — IntersectionObserver API

> **🎯 Modern API: browser TỰ BÁO khi element vào viewport**

```
INTERSECTIONOBSERVER — ƯU ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ KHÔNG cần scroll event listener
  ✅ KHÔNG cần tính toán offsetTop / scrollTop
  ✅ Browser NATIVE tối ưu, KHÔNG gây reflow
  ✅ Code ngắn gọn, dễ bảo trì
  ✅ Hỗ trợ tất cả modern browsers
```

```javascript
// ===== IntersectionObserver Lazy Loading =====
const imgs = document.querySelectorAll("img[data-src]");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      // entry.isIntersecting = image VÀO viewport
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.getAttribute("data-src");
        img.removeAttribute("data-src");

        // Ngưng observe image đã load xong
        observer.unobserve(img);
      }
    });
  },
  {
    // Options
    rootMargin: "0px 0px 200px 0px", // Pre-load 200px trước
    threshold: 0.01, // 1% visible = trigger
  },
);

// Observe tất cả images
imgs.forEach((img) => observer.observe(img));
```

```
SO SÁNH 2 CÁCH TRIỂN KHAI:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────────┬────────────────────┐
  │                  │ Native JS        │ Intersection       │
  │                  │ (scroll event)   │ Observer           │
  ├──────────────────┼──────────────────┼────────────────────┤
  │ Performance      │ CẦN throttle     │ Browser native ✅  │
  │ Reflow           │ CÓ (offsetTop)   │ KHÔNG ✅           │
  │ Code             │ Verbose          │ Ngắn gọn ✅       │
  │ Scroll event     │ CẦN listener     │ KHÔNG CẦN ✅      │
  │ Pre-load offset  │ Manual           │ rootMargin ✅      │
  │ Auto unobserve   │ Manual           │ unobserve() ✅    │
  │ Browser support  │ Tất cả ✅        │ Modern browsers   │
  │ IE support       │ CÓ ✅            │ KHÔNG (polyfill)  │
  └──────────────────┴──────────────────┴────────────────────┘
```

### HTML5 Native: loading="lazy"

```html
<!-- HTML5 Native Lazy Loading (simplest!) -->
<img src="pic.png" loading="lazy" alt="Lazy loaded image" />

<!--
  loading="lazy"   → Lazy load (chỉ load khi gần viewport)
  loading="eager"  → Load ngay (default behavior)
  loading="auto"   → Browser quyết định

  ✅ Đơn giản nhất, KHÔNG CẦN JavaScript
  ❌ Không customize threshold / offset
  ❌ Không hỗ trợ IE, Safari < 15.4
-->
```

---

## 5. Lazy Loading vs Preloading

> **🎯 Lazy = load CHẬM (giảm tải); Preload = load TRƯỚC (tăng tải)**

```
LAZY LOADING vs PRELOADING:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────────┬────────────────────┐
  │                  │ LAZY LOADING     │ PRELOADING         │
  ├──────────────────┼──────────────────┼────────────────────┤
  │ Thời điểm load   │ CHẬM / KHI CẦN  │ TRƯỚC / SỚM       │
  │ Server load      │ GIẢM ↓           │ TĂNG ↑             │
  │ First-screen     │ NHANH ↑          │ Chậm hơn ↓        │
  │ UX sau đó        │ Chờ load khi     │ SẴN SÀNG ngay ✅  │
  │                  │ scroll           │                    │
  │ Bandwidth        │ Tiết kiệm ✅     │ Tốn nhiều hơn     │
  │ Use case         │ E-commerce,      │ Image gallery,     │
  │                  │ long pages       │ game assets,       │
  │                  │                  │ critical images    │
  └──────────────────┴──────────────────┴────────────────────┘

  LAZY LOADING:
  ┌──────────────────────────────────────────────────────────┐
  │ → Trì hoãn loading images trong long pages              │
  │ → CHỈ LOAD khi image VÀO viewport                      │
  │ → Cải thiện FIRST-SCREEN loading speed                  │
  │ → GIẢM server load                                      │
  │ → Nguyên lý:                                            │
  │   · src = "" (rỗng) hoặc placeholder                    │
  │   · data-src = đường dẫn thật                           │
  │   · Scroll → kiểm tra viewport → gán src               │
  └──────────────────────────────────────────────────────────┘

  PRELOADING:
  ┌──────────────────────────────────────────────────────────┐
  │ → Request + load resources CẦN THIẾT TRƯỚC             │
  │ → Lưu vào local cache                                   │
  │ → Khi cần → lấy TRỰC TIẾP từ cache                    │
  │ → GIẢM thời gian chờ user                               │
  │ → TĂNG server load                                       │
  │ → Nguyên lý:                                            │
  │   · Tạo Image object trong JS                           │
  │   · Set src → browser download + cache                  │
  └──────────────────────────────────────────────────────────┘
```

### Preloading — Code Example

```javascript
// ===== Preloading images =====

// Cách 1: JavaScript Image object
function preloadImage(url) {
  var img = new Image();
  img.src = url; // Browser download + cache
}
preloadImage("pic1.png");
preloadImage("pic2.png");

// Cách 2: HTML <link rel="preload">
// <link rel="preload" href="pic.png" as="image">

// Cách 3: CSS background-image (ẩn)
// .preload { background: url('pic.png') no-repeat -9999px -9999px; }
```

```
TÓM GỌN:
═══════════════════════════════════════════════════════════════

  LAZY LOADING:  Load CHẬM → GIẢM tải server  → first-screen ↑
  PRELOADING:    Load SỚM  → TĂNG tải server  → UX sau đó ↑

  → Cả 2 đều cải thiện PERFORMANCE, nhưng ở CHIỀU NGƯỢC NHAU
  → Lazy: giảm bớt resources lúc đầu
  → Preload: chuẩn bị sẵn resources cho lúc sau
```

---

## 6. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
LAZY LOADING — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  CONCEPT: Trì hoãn load images NGOÀI viewport → load khi scroll

  3 ĐẶC ĐIỂM:
    ① Giảm tải resource không cần thiết
    ② Cải thiện UX (trang hiển thị nhanh hơn)
    ③ Tránh block tài nguyên khác

  NGUYÊN LÝ:
    src = placeholder, data-src = đường dẫn thật
    Điều kiện: img.offsetTop < scrollTop + innerHeight

  3 CÁCH TRIỂN KHAI:
    ① Native JS: scroll event + offsetTop (cần throttle)
    ② IntersectionObserver: modern, native, no reflow
    ③ HTML5: loading="lazy" (simplest, limited customize)

  vs PRELOADING:
    Lazy = load CHẬM, GIẢM tải server
    Preload = load SỚM, TĂNG tải server
```

### Câu Hỏi Phỏng Vấn Thường Gặp

**1. Lazy Loading là gì? Tại sao cần?**

> Trì hoãn loading images/resources **ngoài viewport**, chỉ load khi user scroll tới. Long pages có nhiều images → load tất cả cùng lúc gây **lãng phí bandwidth** (user chỉ thấy viewport). Lazy loading → webpage load **nhanh hơn**, server **giảm tải**. Phù hợp: e-commerce, long lists, image galleries.

**2. Nguyên lý triển khai Lazy Loading?**

> Image loading trigger bởi thuộc tính **src**. Nguyên lý: ① Dùng **data-src** lưu đường dẫn thật. ② **src** = placeholder (loading.gif). ③ Khi image vào viewport → **gán data-src vào src** → browser load. Điều kiện: `img.offsetTop < scrollTop + innerHeight`.

**3. Có mấy cách triển khai Lazy Loading?**

> 3 cách: ① **Native JS**: scroll event + offsetTop/scrollTop/innerHeight (cần **throttle** vì scroll fires nhiều, offsetTop gây **reflow**). ② **IntersectionObserver**: modern API, browser native, **không reflow**, dùng rootMargin để pre-load, unobserve sau khi load. ③ **HTML5 native**: `loading="lazy"` attribute (đơn giản nhất, không cần JS, nhưng không customize được).

**4. IntersectionObserver hơn scroll event thế nào?**

> **Không cần** scroll event listener. **Không gây reflow** (không dùng offsetTop). Browser **native tối ưu**. Code **ngắn gọn**. Có **rootMargin** (pre-load offset) + **unobserve()** (tự cleanup). Nhược: không hỗ trợ IE (cần polyfill).

**5. Lazy Loading vs Preloading?**

> Cả 2 cải thiện performance nhưng **chiều ngược nhau**. **Lazy**: load chậm/khi cần → **giảm** server load → first-screen nhanh. **Preload**: load sớm/trước → **tăng** server load → UX sau đó mượt. Lazy dùng cho long pages/e-commerce. Preload dùng cho image gallery/game assets/critical images.

**6. Làm sao tối ưu scroll event trong Lazy Loading?**

> Scroll event fires **rất nhiều lần** → performance issue. Giải pháp: dùng **throttle** (giới hạn tần suất, VD: mỗi 200ms). Hoặc tốt hơn: chuyển sang **IntersectionObserver** (không cần scroll event).

---

## Checklist Học Tập

- [ ] Hiểu Lazy Loading khái niệm + 3 đặc điểm
- [ ] Biết nguyên lý: src vs data-src + điều kiện viewport
- [ ] Hiểu 3 giá trị: offsetTop, scrollTop, innerHeight
- [ ] Biết triển khai Native JS (scroll + throttle)
- [ ] Biết triển khai IntersectionObserver (rootMargin, unobserve)
- [ ] Biết HTML5 native: loading="lazy"
- [ ] Phân biệt Lazy Loading vs Preloading
- [ ] Biết Preloading techniques (Image object, link preload)

---

_Cập nhật lần cuối: Tháng 2, 2026_
