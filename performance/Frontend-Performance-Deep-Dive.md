# Frontend Performance Optimization — Deep Dive!

> **Tối ưu hiệu năng toàn diện: từ Loading đến Rendering!**
> Lazy loading, Reflow/Repaint, Debounce/Throttle, Image, Webpack, Security!

---

## §1. Lazy Loading Ảnh!

```
  LAZY LOADING — NGUYÊN LÝ:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Trang dài 50 ảnh → load HẾT 50 ảnh ngay! ❌         │    │
  │  │ → Bandwidth lãng phí! Server tải nặng!                │    │
  │  │ → User chỉ thấy 3-5 ảnh đầu tiên!                  │    │
  │  │ → Chặn render critical resources! ❌                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ CHỈ load ảnh khi ẢNH VÀO viewport! ★              │    │
  │  │                                                      │    │
  │  │  ┌─── Viewport (visible!) ─────────────────┐         │    │
  │  │  │ ┌─────┐ ┌─────┐ ┌─────┐                 │         │    │
  │  │  │ │ IMG │ │ IMG │ │ IMG │ ← LOADED! ✅    │         │    │
  │  │  │ │ src │ │ src │ │ src │                  │         │    │
  │  │  │ └─────┘ └─────┘ └─────┘                 │         │    │
  │  │  └─────────────────────────────────────────┘         │    │
  │  │  ┌─── Below viewport ──────────────────────┐         │    │
  │  │  │ ┌─────┐ ┌─────┐ ┌─────┐                 │         │    │
  │  │  │ │data-│ │data-│ │data-│ ← CHƯA LOAD! ★ │         │    │
  │  │  │ │ src │ │ src │ │ src │   (placeholder)  │         │    │
  │  │  │ └─────┘ └─────┘ └─────┘                 │         │    │
  │  │  └─────────────────────────────────────────┘         │    │
  │  │                                                      │    │
  │  │  CƠ CHẾ: data-src → src khi vào viewport! ★          │    │
  │  │  <img data-src="real.jpg"> → <img src="real.jpg">     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: LazyLoader — không dùng thư viện!
// ═══════════════════════════════════════════════════════════

function LazyLoader() {
  this.images = document.querySelectorAll("img[data-src]");
  this._init();
}

LazyLoader.prototype._init = function () {
  var self = this;
  // Check ngay lập tức!
  this._checkImages();

  // Throttle scroll + resize!
  var throttledCheck = this._throttle(function () {
    self._checkImages();
  }, 200);

  window.addEventListener("scroll", throttledCheck);
  window.addEventListener("resize", throttledCheck);
};

// ★ Kiểm tra ảnh có trong viewport không!
LazyLoader.prototype._checkImages = function () {
  var self = this;
  for (var i = 0; i < this.images.length; i++) {
    var img = this.images[i];
    if (this._isInViewport(img) && img.getAttribute("data-src")) {
      this._loadImage(img);
    }
  }
};

// ★ Tự viết: kiểm tra element có trong viewport!
LazyLoader.prototype._isInViewport = function (el) {
  var rect = el.getBoundingClientRect();
  var viewH = window.innerHeight;
  var viewW = window.innerWidth;
  // Buffer 1.5x viewport → preload sớm hơn!
  return (
    rect.top <= viewH * 1.5 &&
    rect.bottom >= viewH * -0.5 &&
    rect.left <= viewW &&
    rect.right >= 0
  );
};

// ★ Load ảnh: tạo Image() test trước → rồi mới gán src!
LazyLoader.prototype._loadImage = function (img) {
  var src = img.getAttribute("data-src");
  var testImg = new Image();

  testImg.onload = function () {
    img.src = src; // ★ Gán src thật!
    img.classList.add("loaded"); // CSS transition!
    img.removeAttribute("data-src"); // Xóa data-src!
  };

  testImg.onerror = function () {
    img.setAttribute("data-error", "true");
  };

  testImg.src = src; // Bắt đầu load!
};

// ★ Tự viết throttle!
LazyLoader.prototype._throttle = function (func, delay) {
  var timeoutId = null;
  return function () {
    if (!timeoutId) {
      timeoutId = setTimeout(function () {
        func();
        timeoutId = null;
      }, delay);
    }
  };
};

// ═══════════════════════════════════════════════════════════
// CÁCH 2: IntersectionObserver — hiện đại hơn!
// ★ Tự viết wrapper, KHÔNG dùng thư viện!
// ═══════════════════════════════════════════════════════════

function ModernLazyLoader() {
  this.images = document.querySelectorAll("img[data-src]");

  if ("IntersectionObserver" in window) {
    this._useObserver();
  } else {
    // Fallback cho browser cũ!
    new LazyLoader(); // Dùng scroll-based ở trên!
  }
}

ModernLazyLoader.prototype._useObserver = function () {
  var observer = new IntersectionObserver(
    function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          var img = entries[i].target;
          img.src = img.getAttribute("data-src");
          img.removeAttribute("data-src");
          img.classList.add("loaded");
          observer.unobserve(img); // ★ Ngừng theo dõi!
        }
      }
    },
    { rootMargin: "50% 0px" }, // ★ Preload sớm 50% viewport!
  );

  for (var i = 0; i < this.images.length; i++) {
    observer.observe(this.images[i]);
  }
};
```

---

## §2. Reflow & Repaint!

```
  REFLOW vs REPAINT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  RENDER PIPELINE:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  DOM                                                  │    │
  │  │   ↓                                                   │    │
  │  │  CSSOM                                                 │    │
  │  │   ↓                                                   │    │
  │  │  Render Tree ─→ Layout ─→ Paint ─→ Composite          │    │
  │  │                  (REFLOW!)  (REPAINT!)                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  REFLOW (Tái bố cục!) ★★★ TỐN NHẤT!                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Thay đổi HÌNH HỌC → tính lại layout TOÀN BỘ!    │    │
  │  │ → LUÔN trigger repaint theo sau! ★                    │    │
  │  │                                                      │    │
  │  │ TRIGGER REFLOW:                                        │    │
  │  │ → width, height, padding, margin, border! ★            │    │
  │  │ → position, display, float!                            │    │
  │  │ → font-size, line-height!                               │    │
  │  │ → innerHTML, textContent!                               │    │
  │  │ → offsetWidth, getComputedStyle() (đọc cũng trigger!)│    │
  │  │ → window resize!                                       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  REPAINT (Tái vẽ!) — nhẹ hơn reflow!                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Thay đổi STYLE nhưng KHÔNG ảnh hưởng layout!      │    │
  │  │ → KHÔNG trigger reflow! ★                              │    │
  │  │                                                      │    │
  │  │ CHỈ TRIGGER REPAINT:                                    │    │
  │  │ → color, background-color! ★                           │    │
  │  │ → border-radius, box-shadow!                            │    │
  │  │ → visibility, outline!                                  │    │
  │  │ → opacity!                                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHÔNG REFLOW, KHÔNG REPAINT — Composite only! ★★★           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → transform (translate, scale, rotate!) ★              │    │
  │  │ → opacity (khi dùng will-change!) ★                    │    │
  │  │ → GPU layer! Nhanh nhất!                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ┌─────────────────┬──────────┬──────────┬───────────┐       │
  │  │ Thay đổi       │ Reflow?  │ Repaint? │ Chi phí   │       │
  │  ├─────────────────┼──────────┼──────────┼───────────┤       │
  │  │ width/height     │ ✅       │ ✅       │ Cao ❌    │       │
  │  │ color            │ ❌       │ ✅       │ Trung bình│       │
  │  │ transform        │ ❌       │ ❌       │ Thấp ★   │       │
  │  │ opacity+will-chg │ ❌       │ ❌       │ Thấp ★   │       │
  │  └─────────────────┴──────────┴──────────┴───────────┘       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỐI ƯU REFLOW — Batch DOM operations!
// ═══════════════════════════════════════════════════════════

// ❌ TỆ: Reflow NHIỀU LẦN!
function badExample() {
  var el = document.getElementById("box");
  el.style.width = "100px"; // reflow ①!
  el.style.height = "200px"; // reflow ②!
  el.style.margin = "10px"; // reflow ③!
  // → 3 lần reflow! (browser CÓ THỂ batch nhưng không chắc!)
}

// ✅ TỐT: Dùng cssText hoặc class!
function goodExample() {
  var el = document.getElementById("box");
  el.style.cssText = "width:100px;height:200px;margin:10px;";
  // → 1 lần reflow duy nhất! ★
}

// ✅ TỐT: Dùng DocumentFragment!
function batchInsert(count) {
  var fragment = document.createDocumentFragment();
  for (var i = 0; i < count; i++) {
    var div = document.createElement("div");
    div.textContent = "Item " + i;
    fragment.appendChild(div); // ★ Chưa reflow!
  }
  document.getElementById("container").appendChild(fragment);
  // ★ 1 lần reflow duy nhất! (dù thêm 1000 phần tử!)
}

// ✅ TỐT: Đọc/Ghi tách biệt (Read-Write split!)
function readWriteSplit() {
  // ĐỌC trước!
  var width = el.offsetWidth; // đọc → force layout!
  var height = el.offsetHeight; // đọc (batched!)

  // GHI sau!
  el.style.width = width + 10 + "px"; // ghi
  el.style.height = height + 10 + "px"; // ghi (batched!)
  // ★ Tránh đọc-ghi-đọc-ghi xen kẽ! ★
}

// ❌ TỆ: Đọc-ghi xen kẽ → FORCED REFLOW mỗi lần đọc!
function badReadWrite() {
  el.style.width = "100px"; // ghi
  var w = el.offsetWidth; // đọc → FORCE REFLOW! ❌
  el.style.height = "200px"; // ghi
  var h = el.offsetHeight; // đọc → FORCE REFLOW! ❌
}
```

---

## §3. Debounce & Throttle!

```
  DEBOUNCE vs THROTTLE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  DEBOUNCE (Chống rung!):                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Đợi user NGỪNG action → mới chạy! ★                │    │
  │  │ → Reset timer mỗi khi có action mới!                  │    │
  │  │                                                      │    │
  │  │ Events:  ×  ×  ×  ×  ×  ×         ×  ×               │    │
  │  │ Time:    ─────────────────│delay│──────│delay│        │    │
  │  │ Execute:                  ✅            ✅             │    │
  │  │                                                      │    │
  │  │ USE CASE: search input, resize, form validate! ★     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  THROTTLE (Giới hạn tần suất!):                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Chạy TỐI ĐA 1 lần mỗi N ms! ★                    │    │
  │  │ → Không reset timer!                                   │    │
  │  │                                                      │    │
  │  │ Events:  ×  ×  ×  ×  ×  ×  ×  ×  ×  ×               │    │
  │  │ Time:    │──limit──│──limit──│──limit──│              │    │
  │  │ Execute: ✅         ✅         ✅                       │    │
  │  │                                                      │    │
  │  │ USE CASE: scroll, mousemove, game loop! ★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Debounce — có immediate mode!
// ═══════════════════════════════════════════════════════════

function debounce(func, wait, immediate) {
  var timeoutId = null;

  return function () {
    var context = this;
    var args = arguments;

    var callNow = immediate && !timeoutId;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(function () {
      timeoutId = null;
      if (!immediate) {
        func.apply(context, args); // ★ Trailing edge!
      }
    }, wait);

    if (callNow) {
      func.apply(context, args); // ★ Leading edge!
    }
  };
}

// SỬ DỤNG:
// var search = debounce(function(e) {
//   callAPI(e.target.value);
// }, 300);
// input.addEventListener('input', search);

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Throttle — timestamp + timer hybrid!
// ═══════════════════════════════════════════════════════════

function throttle(func, limit) {
  var lastTime = 0;
  var timeoutId = null;

  return function () {
    var context = this;
    var args = arguments;
    var now = Date.now();

    var remaining = limit - (now - lastTime);

    if (remaining <= 0) {
      // ★ Đủ thời gian → chạy NGAY!
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      func.apply(context, args);
      lastTime = now;
    } else if (!timeoutId) {
      // ★ Chưa đủ → đặt timer cho lần cuối (trailing!)
      timeoutId = setTimeout(function () {
        func.apply(context, args);
        lastTime = Date.now();
        timeoutId = null;
      }, remaining);
    }
  };
}

// SỬ DỤNG:
// window.addEventListener('scroll', throttle(function() {
//   updateScrollUI();
// }, 100));
```

---

## §4. Image Optimization!

```
  CHIẾN LƯỢC TỐI ƯU ẢNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① FORMAT SELECTION:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ┌──────────┬──────────┬──────────┬───────────────┐   │    │
  │  │ │ Format   │ Khi nào  │ Nén     │ Đặc điểm    │   │    │
  │  │ ├──────────┼──────────┼──────────┼───────────────┤   │    │
  │  │ │ WebP     │ Mặc định★│ Tốt nhất│ -25-35% vs JPG│   │    │
  │  │ │ AVIF     │ Hiện đại│ Cực tốt │ Mới, ít hỗ trợ│   │    │
  │  │ │ JPEG     │ Ảnh chụp│ Tốt     │ Lossy          │   │    │
  │  │ │ PNG      │ Trong suốt│ Trung bình│ Lossless    │   │    │
  │  │ │ SVG      │ Icon ★   │ Vector  │ Scale vô hạn │   │    │
  │  │ └──────────┴──────────┴──────────┴───────────────┘   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② RESPONSIVE IMAGES:                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ srcset: nhiều kích thước cho nhiều màn hình!      │    │
  │  │ ★ sizes: quy định width tùy breakpoint!              │    │
  │  │ ★ <picture>: fallback format!                          │    │
  │  │                                                      │    │
  │  │ Mobile (320w): ảnh nhỏ 320px! ★                     │    │
  │  │ Tablet (768w): ảnh vừa 768px!                        │    │
  │  │ Desktop (1200w): ảnh lớn 1200px!                     │    │
  │  │ → Tiết kiệm bandwidth trên mobile! ★                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Client-side image compression!
// ★ Dùng Canvas API — không thư viện!
// ═══════════════════════════════════════════════════════════

function compressImage(file, quality, maxWidth) {
  quality = quality || 0.8;
  maxWidth = maxWidth || 1920;

  return new Promise(function (resolve, reject) {
    var reader = new FileReader();

    reader.onload = function (e) {
      var img = new Image();

      img.onload = function () {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");

        // ★ Resize nếu quá lớn!
        var ratio = 1;
        if (img.width > maxWidth) {
          ratio = maxWidth / img.width;
        }

        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // ★ Vẽ lên canvas (đã resize!)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // ★ Xuất ra Blob với quality compression!
        canvas.toBlob(
          function (blob) {
            resolve({
              blob: blob,
              originalSize: file.size,
              compressedSize: blob.size,
              ratio: ((1 - blob.size / file.size) * 100).toFixed(1) + "%",
            });
          },
          "image/jpeg",
          quality,
        );
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

// SỬ DỤNG:
// compressImage(fileInput.files[0], 0.7, 1280).then(function(result) {
//   console.log('Giảm ' + result.ratio + '!');
// });
```

---

## §5. Webpack Build Optimization!

```
  WEBPACK OPTIMIZATION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① CODE SPLITTING:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ splitChunks: tách vendor ra riêng! ★                │    │
  │  │ ★ Dynamic import: lazy load component!                │    │
  │  │                                                      │    │
  │  │ TRƯỚC:                                                  │    │
  │  │ ┌─────────────────────────────────┐                    │    │
  │  │ │ bundle.js (2MB!) ❌              │                    │    │
  │  │ └─────────────────────────────────┘                    │    │
  │  │                                                      │    │
  │  │ SAU:                                                    │    │
  │  │ ┌──────────┐ ┌──────────┐ ┌──────────┐                │    │
  │  │ │vendor.js │ │common.js │ │ page.js  │ ★              │    │
  │  │ │(cached!) │ │(shared!) │ │ (small!) │                │    │
  │  │ └──────────┘ └──────────┘ └──────────┘                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ② PRELOAD & PREFETCH:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ preload:  tải NGAY! (critical resources!) ★            │    │
  │  │ prefetch: tải KHI RẢI! (next page resources!)         │    │
  │  │                                                      │    │
  │  │ <link rel="preload" href="critical.css" as="style">  │    │
  │  │ <link rel="prefetch" href="next-page.js" as="script">│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ③ TREE SHAKING:                                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ Loại bỏ code KHÔNG DÙNG! (dead code elimination!) │    │
  │  │ ★ ESM (import/export) bắt buộc! ★                    │    │
  │  │ ★ sideEffects: false trong package.json!              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Security — XSS & CSRF!

```
  BẢO MẬT FRONTEND:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  XSS (Cross-Site Scripting!):                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ Attacker chèn script vào trang web! ❌              │    │
  │  │ → Đánh cắp cookie, session, data!                    │    │
  │  │                                                      │    │
  │  │ User input: <script>alert('XSS')</script>              │    │
  │  │ → Nếu render NGUYÊN → script CHẠY! ❌                 │    │
  │  │ → Phải ESCAPE trước khi render! ★                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CSRF (Cross-Site Request Forgery!):                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ Attacker trick user gửi request giả! ❌             │    │
  │  │ → User đang login bank.com → vào evil.com             │    │
  │  │ → evil.com gửi request đến bank.com với cookie user! │    │
  │  │ → Phải có CSRF token! ★                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: XSS Protection — HTML sanitizer!
// ═══════════════════════════════════════════════════════════

function escapeHTML(str) {
  var div = document.createElement("div");
  div.textContent = str; // ★ textContent tự escape!
  return div.innerHTML;
  // '<script>' → '&lt;script&gt;' ★
}

// Hoặc thủ công:
function escapeHTMLManual(str) {
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return String(str).replace(/[&<>"'/]/g, function (char) {
    return map[char];
  });
}

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: CSRF Token request!
// ═══════════════════════════════════════════════════════════

function csrfFetch(url, data) {
  var tokenMeta = document.querySelector('meta[name="csrf-token"]');
  var token = tokenMeta ? tokenMeta.getAttribute("content") : "";

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token, // ★ Gửi CSRF token!
    },
    body: JSON.stringify(data),
    credentials: "same-origin", // ★ Gửi cookie!
  }).then(function (res) {
    return res.json();
  });
}
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Lazy loading ảnh hoạt động thế nào?                      │
  │  → Lưu URL vào data-src, placeholder ở src!                 │
  │  → Khi ảnh vào viewport → copy data-src sang src! ★         │
  │  → Detect: getBoundingClientRect hoặc IntersectionObserver! │
  │  → Throttle scroll event để tránh gọi quá nhiều!             │
  │                                                              │
  │  ❓ 2: Reflow vs Repaint khác gì?                                │
  │  → Reflow: thay đổi LAYOUT (width, height, position...)!   │
  │  → Repaint: thay đổi VISUAL (color, background...) ★       │
  │  → Reflow LUÔN trigger repaint! Repaint KHÔNG trigger reflow!│
  │  → transform: KHÔNG reflow, KHÔNG repaint! (composite!) ★  │
  │                                                              │
  │  ❓ 3: Debounce vs Throttle dùng khi nào?                       │
  │  → Debounce: đợi user DỪNG → search input, validate! ★     │
  │  → Throttle: giới hạn tần suất → scroll, resize! ★         │
  │                                                              │
  │  ❓ 4: Tối ưu ảnh thế nào?                                      │
  │  → Format: WebP > JPEG > PNG (theo use case!)               │
  │  → Responsive: srcset + sizes cho multi-device! ★            │
  │  → Lazy loading! Compression! CDN! ★                          │
  │                                                              │
  │  ❓ 5: XSS là gì? Phòng chống thế nào?                          │
  │  → Attacker chèn script vào trang!                            │
  │  → Phòng: escape HTML (textContent!), CSP header! ★          │
  │  → Không dùng innerHTML với user input!                       │
  │                                                              │
  │  ❓ 6: Webpack code splitting tại sao quan trọng?                │
  │  → Tách bundle lớn → nhiều chunk nhỏ! ★                     │
  │  → Vendor chunk cached lâu dài!                               │
  │  → Dynamic import → lazy load per route!                      │
  │  → Giảm initial load time đáng kể!                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
