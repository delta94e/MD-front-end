# Frontend Performance In Practice — Deep Dive!

> **Thực chiến tối ưu: từ 8s xuống 2s!**
> Chẩn đoán → Resource → Rendering → Cache → Code Execution!

---

## §1. Chẩn Đoán — Phân Tích Vấn Đề!

```
  CASE STUDY: Dashboard 8s → 2s!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TRƯỚC TỐI ƯU (8s loading!):                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ┌──────────┬──────────┬──────────┐                    │    │
  │  │ │ Chỉ số  │ Giá trị │ Chuẩn    │                    │    │
  │  │ ├──────────┼──────────┼──────────┤                    │    │
  │  │ │ FCP      │ 3.8s ❌  │ ≤ 1.8s   │                    │    │
  │  │ │ LCP      │ 8.2s ❌❌ │ ≤ 2.5s   │                    │    │
  │  │ │ FID      │ 280ms ❌ │ ≤ 100ms  │                    │    │
  │  │ │ CLS      │ 0.28 ❌  │ ≤ 0.1    │                    │    │
  │  │ └──────────┴──────────┴──────────┘                    │    │
  │  │ → TẤT CẢ đều FAIL! ❌❌❌                              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  WATERFALL ANALYSIS — 4 VẤN ĐỀ CHÍNH:                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ① RESOURCE OVERLOAD ❌                                │    │
  │  │  ┌────────────────────────────────────────┐           │    │
  │  │  │ bundle.js ████████████████████ 5MB!    │           │    │
  │  │  │ images   ██████████████ 3MB!           │           │    │
  │  │  │ fonts    ████ 800KB!                    │           │    │
  │  │  └────────────────────────────────────────┘           │    │
  │  │  → Tổng: ~9MB load lần đầu! ❌                       │    │
  │  │                                                      │    │
  │  │  ② RENDER BLOCKING ❌                                  │    │
  │  │  → CSS lớn load trước render!                         │    │
  │  │  → JS synchronous block DOM parse!                     │    │
  │  │                                                      │    │
  │  │  ③ CODE EXECUTION INEFFICIENT ❌                       │    │
  │  │  → Heavy computation trên main thread!                │    │
  │  │  → Long list render toàn bộ DOM!                     │    │
  │  │                                                      │    │
  │  │  ④ NO CACHING ❌                                       │    │
  │  │  → Mỗi lần refresh = download lại tất cả!           │    │
  │  │  → API gọi lại dù data không đổi!                   │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  QUY TRÌNH TỐI ƯU (như bảo dưỡng xe!):                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  ① Chẩn đoán (DevTools + Lighthouse!)                │    │
  │  │       ↓                                                │    │
  │  │  ② Tối ưu Resource Loading!                           │    │
  │  │       ↓                                                │    │
  │  │  ③ Tối ưu Rendering!                                  │    │
  │  │       ↓                                                │    │
  │  │  ④ Tối ưu Caching!                                    │    │
  │  │       ↓                                                │    │
  │  │  ⑤ Tối ưu Code Execution!                             │    │
  │  │       ↓                                                │    │
  │  │  ⑥ Verify + Monitor! ★                                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Resource Loading — Code Splitting & Lazy!

```
  CODE SPLITTING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TRƯỚC: 1 file 5MB! ❌                                        │
  │  ┌─────────────────────────────────────────────────┐         │
  │  │ bundle.js ████████████████████████████ 5MB      │         │
  │  │ → User phải tải 5MB mới thấy TRANG ĐẦU! ❌    │         │
  │  └─────────────────────────────────────────────────┘         │
  │                                                              │
  │  SAU: Nhiều chunk nhỏ! ✅                                    │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
  │  │ vendor   │ │ home     │ │ dashboard│ ← LAZY! ★           │
  │  │ (shared) │ │ (50KB)   │ │ (200KB)  │                     │
  │  └──────────┘ └──────────┘ └──────────┘                     │
  │  → Initial load: ~300KB! ★ (giảm 94%!)                      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Route-level lazy loading!
// ★ Không dùng React.lazy, tự viết từ đầu!
// ═══════════════════════════════════════════════════════════

function createLazyRoute(importFn) {
  var cachedComponent = null;
  var loadPromise = null;

  return {
    // ★ Load component lần đầu → cache lại!
    load: function () {
      if (cachedComponent) return Promise.resolve(cachedComponent);
      if (loadPromise) return loadPromise;

      loadPromise = importFn().then(function (module) {
        cachedComponent = module.default || module;
        return cachedComponent;
      });
      return loadPromise;
    },

    // ★ Prefetch khi hover menu!
    prefetch: function () {
      if (!cachedComponent && !loadPromise) {
        this.load(); // Load sẵn ở background!
      }
    },
  };
}

// Khai báo routes!
var routes = {
  "/": createLazyRoute(function () {
    return loadScript("/pages/home.js");
  }),
  "/dashboard": createLazyRoute(function () {
    return loadScript("/pages/dashboard.js");
  }),
};

// ★ Tự viết dynamic script loader!
function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var script = document.createElement("script");
    script.src = src;
    script.onload = function () {
      resolve(window.__MODULE__); // Module export!
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Responsive Image Component!
// ★ WebP + srcset + lazy loading!
// ═══════════════════════════════════════════════════════════

function createOptimizedImage(container, config) {
  var picture = document.createElement("picture");

  // ★ WebP source (ưu tiên!)
  var webpSource = document.createElement("source");
  webpSource.type = "image/webp";
  webpSource.srcset =
    config.src +
    "?w=400&f=webp 400w, " +
    config.src +
    "?w=800&f=webp 800w, " +
    config.src +
    "?w=1200&f=webp 1200w";
  webpSource.sizes =
    "(max-width:600px) 400px, (max-width:1000px) 800px, 1200px";

  // ★ Fallback img!
  var img = document.createElement("img");
  img.alt = config.alt || "";
  img.loading = "lazy"; // ★ Native lazy loading!
  img.decoding = "async"; // ★ Không block main thread!
  img.width = config.width; // ★ CLS fix: set width/height!
  img.height = config.height;
  img.src = config.src + "?w=800";

  picture.appendChild(webpSource);
  picture.appendChild(img);
  container.appendChild(picture);
}
```

---

## §3. Rendering — Virtual List!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Virtual List — 10K items, ~20 DOM nodes!
// ★ Mượt mà 60fps! Không lag!
// ═══════════════════════════════════════════════════════════

function VirtualList(container, options) {
  this.items = options.items;
  this.rowHeight = options.rowHeight || 50;
  this.visibleCount = Math.ceil(container.clientHeight / this.rowHeight) + 2;
  this.scrollTop = 0;

  // ★ Tạo DOM structure!
  this.outer = document.createElement("div");
  this.outer.style.cssText =
    "height:" + container.clientHeight + "px;overflow:auto;";

  this.phantom = document.createElement("div");
  this.phantom.style.height = this.items.length * this.rowHeight + "px";

  this.content = document.createElement("div");

  this.outer.appendChild(this.phantom);
  this.outer.appendChild(this.content);
  container.appendChild(this.outer);

  this._bindScroll();
  this._render();
}

VirtualList.prototype._bindScroll = function () {
  var self = this;
  var ticking = false;

  this.outer.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        self.scrollTop = self.outer.scrollTop;
        self._render();
        ticking = false;
      });
      ticking = true; // ★ RAF throttle!
    }
  });
};

VirtualList.prototype._render = function () {
  var start = Math.max(0, Math.floor(this.scrollTop / this.rowHeight) - 1);
  var end = Math.min(start + this.visibleCount, this.items.length);

  // ★ Transform (composite-only! Không reflow!) ★
  this.content.style.transform = "translateY(" + start * this.rowHeight + "px)";

  // ★ Chỉ render visible items!
  this.content.innerHTML = "";
  for (var i = start; i < end; i++) {
    var row = document.createElement("div");
    row.style.cssText =
      "height:" +
      this.rowHeight +
      "px;border-bottom:1px solid #eee;" +
      "display:flex;align-items:center;padding:0 16px;box-sizing:border-box;";
    row.textContent = this.items[i];
    this.content.appendChild(row);
  }
};

// SỬ DỤNG:
// new VirtualList(document.getElementById('list'), {
//   items: Array.from({ length: 100000 }, (_, i) => 'Item ' + i),
//   rowHeight: 50,
// });
```

---

## §4. Cache Strategy!

```
  CACHE STRATEGY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Resource          │ Cache Header                    │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ HTML              │ no-cache ★ (luôn verify!)      │    │
  │  │ Static (hashed)   │ max-age=31536000, immutable ★  │    │
  │  │ API (public)      │ max-age=300, stale-while-       │    │
  │  │                  │ revalidate=60 ★                  │    │
  │  │ Sensitive         │ no-store                        │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Data Cache Hook pattern!
// ★ Cache data trong memory → tránh re-fetch!
// ═══════════════════════════════════════════════════════════

var dataCache = {};

function fetchWithCache(key, fetcher, options) {
  var ttl = (options && options.ttl) || 60000; // 60s default!
  var forceRefresh = options && options.forceRefresh;

  // ① Check cache!
  if (!forceRefresh && dataCache[key]) {
    var entry = dataCache[key];
    if (Date.now() - entry.timestamp < ttl) {
      console.log("⚡️ Cache HIT:", key);
      return Promise.resolve(entry.data);
    }
  }

  // ② Fetch + cache!
  console.log("📡 Fetching:", key);
  return fetcher().then(function (data) {
    dataCache[key] = { data: data, timestamp: Date.now() };
    return data;
  });
}

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Stale-While-Revalidate trong memory!
// ★ Trả data cũ NGAY → update ở background!
// ═══════════════════════════════════════════════════════════

function fetchSWR(key, fetcher, onUpdate) {
  var entry = dataCache[key];

  // ★ Luôn fetch mới ở background!
  var fetchPromise = fetcher().then(function (newData) {
    dataCache[key] = { data: newData, timestamp: Date.now() };
    if (onUpdate) onUpdate(newData); // ★ Thông báo data mới!
    return newData;
  });

  // ★ Có cache → trả NGAY! Không loading!
  if (entry) {
    console.log("⚡️ SWR: stale data NOW, fresh later!");
    return Promise.resolve(entry.data);
  }

  // ★ Chưa có cache → đợi fetch!
  return fetchPromise;
}

// SỬ DỤNG:
// fetchSWR('products', () => fetch('/api/products').then(r => r.json()),
//   newData => renderProducts(newData) // ★ Update UI khi có data mới!
// ).then(data => renderProducts(data)); // ★ Render ngay (stale hoặc fresh!)
```

---

## §5. Code Execution — Web Worker & RAF!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Inline Web Worker — heavy computation!
// ═══════════════════════════════════════════════════════════

function createWorker(workerFn) {
  var code = "(" + workerFn.toString() + ")()";
  var blob = new Blob([code], { type: "application/javascript" });
  var url = URL.createObjectURL(blob);
  return new Worker(url);
}

function processInWorker(data) {
  return new Promise(function (resolve, reject) {
    var worker = createWorker(function () {
      self.onmessage = function (e) {
        var items = e.data;
        // ★ Heavy computation ở WORKER!
        // → Main thread KHÔNG bị block!
        var result = items
          .filter(function (item) {
            return item.active;
          })
          .sort(function (a, b) {
            return b.value - a.value;
          })
          .slice(0, 100);

        self.postMessage(result);
      };
    });

    worker.onmessage = function (e) {
      resolve(e.data);
      worker.terminate(); // ★ Dọn dẹp!
    };
    worker.onerror = reject;
    worker.postMessage(data);
  });
}

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Smooth Scroll — RAF + easing!
// ═══════════════════════════════════════════════════════════

function smoothScroll(targetY, duration) {
  duration = duration || 500;
  var startY = window.pageYOffset;
  var distance = targetY - startY;
  var startTime = null;

  // ★ Ease-in-out function!
  function easeInOut(t) {
    return t < 0.5
      ? 4 * t * t * t // ease-in!
      : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease-out!
  }

  function frame(currentTime) {
    if (!startTime) startTime = currentTime;
    var elapsed = currentTime - startTime;
    var progress = Math.min(elapsed / duration, 1);

    window.scrollTo(0, startY + distance * easeInOut(progress));

    if (elapsed < duration) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame); // ★ Sync với refresh rate!
}

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Batch DOM operations — avoid layout thrashing!
// ═══════════════════════════════════════════════════════════

function batchDOMUpdate(updates) {
  // ★ ĐỌC tất cả trước!
  var readings = [];
  for (var i = 0; i < updates.length; i++) {
    if (updates[i].read) {
      readings.push(updates[i].read());
    }
  }

  // ★ GHI tất cả sau! → 1 lần reflow duy nhất! ★
  requestAnimationFrame(function () {
    for (var i = 0; i < updates.length; i++) {
      if (updates[i].write) {
        updates[i].write(readings[i]);
      }
    }
  });
}

// SỬ DỤNG:
// batchDOMUpdate([
//   { read: () => el1.offsetWidth, write: (w) => el1.style.width = w+10+'px' },
//   { read: () => el2.offsetHeight, write: (h) => el2.style.height = h+10+'px' },
// ]);
// → 1 read batch + 1 write batch = 1 reflow! ★
```

---

## §6. Kết Quả Verify!

```
  KẾT QUẢ SAU TỐI ƯU:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
  │  │ Chỉ số  │ Trước    │ Sau      │ Chuẩn   │ Cải thiện│  │
  │  ├──────────┼──────────┼──────────┼──────────┼──────────┤  │
  │  │ FCP      │ 3.8s ❌  │ 1.2s ✅  │ ≤ 1.8s  │ 68% ↓ ★│  │
  │  │ LCP      │ 8.2s ❌  │ 2.1s ✅  │ ≤ 2.5s  │ 74% ↓ ★│  │
  │  │ FID      │ 280ms ❌ │ 80ms ✅  │ ≤ 100ms │ 71% ↓ ★│  │
  │  │ CLS      │ 0.28 ❌  │ 0.05 ✅  │ ≤ 0.1   │ 82% ↓ ★│  │
  │  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
  │                                                              │
  │  ★ TẤT CẢ đều ĐẠT chuẩn Google! ✅✅✅                     │
  │  ★ User feedback: "Mượt như app native!" ★                  │
  │                                                              │
  │  BREAKDOWN TỐI ƯU:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ┌──────────────────┬──────────────────────────┐       │    │
  │  │ │ Kỹ thuật        │ Đóng góp                │       │    │
  │  │ ├──────────────────┼──────────────────────────┤       │    │
  │  │ │ Code splitting   │ Bundle 5MB → 300KB! ★    │       │    │
  │  │ │ Image optimize   │ 3MB → 400KB (WebP+lazy!) │       │    │
  │  │ │ Virtual list     │ 10K DOM → 20 nodes! ★    │       │    │
  │  │ │ Cache strategy   │ 2nd visit: 0.3s! ★       │       │    │
  │  │ │ Web Worker       │ Main thread free! ★       │       │    │
  │  │ │ RAF animation    │ 60fps smooth! ★           │       │    │
  │  │ └──────────────────┴──────────────────────────┘       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Khi trang load chậm, bạn tiếp cận thế nào?               │
  │  → ① Chẩn đoán: DevTools Performance + Lighthouse! ★        │
  │  → ② Xác định bottleneck: resource? render? code? cache?   │
  │  → ③ Tối ưu theo thứ tự ưu tiên (impact lớn nhất trước!)│
  │  → ④ Verify + monitor liên tục!                              │
  │                                                              │
  │  ❓ 2: Virtual list giải quyết vấn đề gì?                      │
  │  → 10K items = 10K DOM nodes → LAG! ❌                      │
  │  → Virtual: chỉ render ~20 visible nodes! ★                  │
  │  → translateY positioning → composite only → 60fps! ★       │
  │                                                              │
  │  ❓ 3: Stale-While-Revalidate ưu điểm gì?                      │
  │  → Trả data cũ NGAY → user không thấy loading! ★            │
  │  → Fetch mới ở background → cache tự update!                 │
  │  → Lần sau user thấy data mới nhất!                          │
  │                                                              │
  │  ❓ 4: Web Worker khi nào dùng?                                  │
  │  → Heavy computation: sort, filter, aggregate 100K items!   │
  │  → KHÔNG truy cập DOM! Giao tiếp qua postMessage! ★        │
  │  → Main thread luôn free cho UI! ★                           │
  │                                                              │
  │  ❓ 5: Layout thrashing là gì? Cách tránh?                      │
  │  → Đọc-ghi-đọc-ghi xen kẽ → forced reflow mỗi lần! ❌   │
  │  → Batch ĐỌC trước, GHI sau! ★                              │
  │  → Dùng requestAnimationFrame cho write batch! ★             │
  │                                                              │
  │  ❓ 6: CLS là gì? Cách fix?                                     │
  │  → Cumulative Layout Shift = layout nhảy bất ngờ! ❌        │
  │  → Fix: ĐẶT width/height cho img/video! ★                   │
  │  → Fix: font-display: swap + size-adjust!                    │
  │  → Fix: skeleton placeholder thay vì blank!                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
