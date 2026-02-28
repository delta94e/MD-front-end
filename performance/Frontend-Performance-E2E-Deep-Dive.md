# Frontend Performance End-to-End — Deep Dive!

> **Tối ưu hiệu năng toàn trình: từ Loading đến Rendering!**
> Core Web Vitals, Code Splitting, Web Worker, Virtual List, Monitoring!

---

## §1. Core Web Vitals — Chỉ Số Cốt Lõi!

```
  CORE WEB VITALS 2026:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TẠI SAO QUAN TRỌNG?                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Loading +1s    → Bounce rate tăng 7%! ❌              │    │
  │  │ First screen >3s → 53% mobile user ĐÓNG APP! ❌      │    │
  │  │ Lighthouse <60  → SEO giảm 23 bậc! ❌                │    │
  │  │ Speed +1s       → Conversion tăng 22%! ✅ ★          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  3 CHỈ SỐ CỐT LÕI:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌──────────┬──────────┬──────────────────────┐       │    │
  │  │  │ Chỉ số  │ Mục tiêu│ Ý nghĩa             │       │    │
  │  │  ├──────────┼──────────┼──────────────────────┤       │    │
  │  │  │ LCP      │ ≤ 2.5s  │ Nội dung chính load  │       │    │
  │  │  │          │         │ xong! (ảnh/text lớn) │       │    │
  │  │  │ INP      │ ≤ 100ms │ Tốc độ phản hồi     │       │    │
  │  │  │          │         │ interaction! (thay FID)│      │    │
  │  │  │ CLS      │ ≤ 0.1   │ Ổn định layout!     │       │    │
  │  │  │          │         │ (không nhảy bố cục!) │       │    │
  │  │  └──────────┴──────────┴──────────────────────┘       │    │
  │  │                                                      │    │
  │  │  ĐÁNH GIÁ: ★                                          │    │
  │  │  ┌─────────┬──────────┬──────────┬──────────┐         │    │
  │  │  │ Rating  │ LCP      │ INP      │ CLS      │         │    │
  │  │  ├─────────┼──────────┼──────────┼──────────┤         │    │
  │  │  │ Good ✅ │ ≤ 2.5s   │ ≤ 200ms  │ ≤ 0.1    │         │    │
  │  │  │ Needs 🟡│ ≤ 4.0s   │ ≤ 500ms  │ ≤ 0.25   │         │    │
  │  │  │ Poor ❌ │ > 4.0s   │ > 500ms  │ > 0.25   │         │    │
  │  │  └─────────┴──────────┴──────────┴──────────┘         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TIMELINE:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  Request                                              │    │
  │  │  │                                                    │    │
  │  │  ├─ DNS lookup                                        │    │
  │  │  ├─ TCP connect                                       │    │
  │  │  ├─ TLS handshake                                     │    │
  │  │  ├─ TTFB (Time to First Byte!) ★                     │    │
  │  │  ├─ FCP (First Contentful Paint!)                     │    │
  │  │  ├─ LCP (Largest Contentful Paint!) ★★★               │    │
  │  │  ├─ TTI (Time to Interactive!)                        │    │
  │  │  └─ Load Complete                                     │    │
  │  │                                                      │    │
  │  │  User click → INP (response time!) ★★★                │    │
  │  │  Layout shift → CLS (visual stability!) ★★★           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Web Vitals Collector — không dùng thư viện!
// ★ Thu thập LCP, FCP, CLS, Navigation Timing!
// ═══════════════════════════════════════════════════════════

function WebVitalsCollector() {
  this.metrics = {};
  this._collectFCP();
  this._collectLCP();
  this._collectCLS();
  this._collectNavigation();
}

// ★ FCP: First Contentful Paint!
WebVitalsCollector.prototype._collectFCP = function () {
  var self = this;
  var observer = new PerformanceObserver(function (list) {
    var entries = list.getEntries();
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].name === "first-contentful-paint") {
        self.metrics.fcp = Math.round(entries[i].startTime);
        observer.disconnect();
      }
    }
  });
  observer.observe({ type: "paint", buffered: true });
};

// ★ LCP: Largest Contentful Paint!
WebVitalsCollector.prototype._collectLCP = function () {
  var self = this;
  var observer = new PerformanceObserver(function (list) {
    var entries = list.getEntries();
    // Lấy entry CUỐI CÙNG = LCP thực tế! ★
    var last = entries[entries.length - 1];
    self.metrics.lcp = Math.round(last.startTime);
  });
  observer.observe({ type: "largest-contentful-paint", buffered: true });
};

// ★ CLS: Cumulative Layout Shift!
WebVitalsCollector.prototype._collectCLS = function () {
  var self = this;
  var clsValue = 0;
  var observer = new PerformanceObserver(function (list) {
    var entries = list.getEntries();
    for (var i = 0; i < entries.length; i++) {
      // Chỉ tính shift KHÔNG do user input! ★
      if (!entries[i].hadRecentInput) {
        clsValue += entries[i].value;
      }
    }
    self.metrics.cls = Math.round(clsValue * 1000) / 1000;
  });
  observer.observe({ type: "layout-shift", buffered: true });
};

// ★ Navigation Timing!
WebVitalsCollector.prototype._collectNavigation = function () {
  var self = this;
  window.addEventListener("load", function () {
    setTimeout(function () {
      var nav = performance.getEntriesByType("navigation")[0];
      if (!nav) return;

      self.metrics.dns = Math.round(
        nav.domainLookupEnd - nav.domainLookupStart,
      );
      self.metrics.tcp = Math.round(nav.connectEnd - nav.connectStart);
      self.metrics.ttfb = Math.round(nav.responseStart - nav.requestStart);
      self.metrics.domReady = Math.round(
        nav.domContentLoadedEventEnd - nav.startTime,
      );
      self.metrics.loadComplete = Math.round(nav.loadEventEnd - nav.startTime);
    }, 0);
  });
};

// ★ Gửi data lên server!
WebVitalsCollector.prototype.report = function () {
  var data = {
    url: window.location.href,
    timestamp: Date.now(),
    metrics: this.metrics,
    userAgent: navigator.userAgent,
    screen: screen.width + "x" + screen.height,
  };

  // sendBeacon: gửi được ngay cả khi page unload! ★
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/performance", JSON.stringify(data));
  } else {
    // Fallback!
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/performance");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(data));
  }
};

// Tự động report khi rời trang!
// var collector = new WebVitalsCollector();
// window.addEventListener('visibilitychange', function() {
//   if (document.hidden) collector.report();
// });
```

---

## §2. Resource Loading — Code Splitting & Preload!

```
  CODE SPLITTING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TRƯỚC:                                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ bundle.js (5MB!) ❌❌❌                                 │    │
  │  │ ┌─────────────────────────────────────────────┐       │    │
  │  │ │ Vue + Router + Pinia + ElementPlus +        │       │    │
  │  │ │ Lodash + Dayjs + Axios + ECharts +          │       │    │
  │  │ │ ALL pages + ALL components!                 │       │    │
  │  │ └─────────────────────────────────────────────┘       │    │
  │  │ → User phải tải 5MB mới thấy trang! ❌               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SAU (Code Splitting!):                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ┌──────────┐ ┌──────────┐ ┌──────────┐               │    │
  │  │ │vendor-fw │ │vendor-ui │ │vendor-util│ ★ CACHED!    │    │
  │  │ │Vue+Router│ │ElementUI │ │lodash+day│               │    │
  │  │ │(~200KB)  │ │(~300KB)  │ │(~100KB)  │               │    │
  │  │ └──────────┘ └──────────┘ └──────────┘               │    │
  │  │ ┌──────────┐ ┌──────────┐ ┌──────────┐               │    │
  │  │ │ home.js  │ │ about.js │ │ chart.js │ ★ LAZY!      │    │
  │  │ │ (50KB)   │ │ (30KB)   │ │ (200KB)  │               │    │
  │  │ └──────────┘ └──────────┘ └──────────┘               │    │
  │  │ → Initial load chỉ ~300KB! ★                          │    │
  │  │ → Chart load khi cần! ★                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PRELOAD vs PREFETCH vs PRECONNECT:                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ┌──────────────┬──────────────────────────────┐       │    │
  │  │ │ Chiến lược  │ Khi nào                       │       │    │
  │  │ ├──────────────┼──────────────────────────────┤       │    │
  │  │ │ preload ★    │ Tải NGAY! Critical resource! │       │    │
  │  │ │              │ (font, CSS, hero image!)       │       │    │
  │  │ │ prefetch     │ Tải KHI RẢI! Next page! ★    │       │    │
  │  │ │ preconnect   │ DNS + TCP + TLS sẵn! ★       │       │    │
  │  │ │ dns-prefetch │ Chỉ DNS! (nhẹ hơn!)          │       │    │
  │  │ └──────────────┴──────────────────────────────┘       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Resource Preloader!
// ═══════════════════════════════════════════════════════════

function ResourcePreloader() {
  this.loaded = {};
}

// ★ Preload: tải ngay, priority CAO!
ResourcePreloader.prototype.preload = function (url, type) {
  if (this.loaded[url]) return;
  var link = document.createElement("link");
  link.rel = "preload";
  link.href = url;
  link.as = type; // 'style', 'script', 'font', 'image'
  if (type === "font") link.crossOrigin = "anonymous";
  document.head.appendChild(link);
  this.loaded[url] = true;
};

// ★ Prefetch: tải khi rải, priority THẤP!
ResourcePreloader.prototype.prefetch = function (url) {
  if (this.loaded[url]) return;
  var link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;
  document.head.appendChild(link);
  this.loaded[url] = true;
};

// ★ Preconnect: DNS + TCP + TLS sẵn!
ResourcePreloader.prototype.preconnect = function (origin) {
  var link = document.createElement("link");
  link.rel = "preconnect";
  link.href = origin;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
};

// ★ Dynamic import (code splitting!):
ResourcePreloader.prototype.loadModule = function (path) {
  return new Promise(function (resolve, reject) {
    var script = document.createElement("script");
    script.src = path;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};
```

---

## §3. Image Optimization — Responsive & Lazy!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Responsive Image Generator!
// ★ Tạo srcset cho multi-device!
// ═══════════════════════════════════════════════════════════

function generateSrcSet(baseSrc, widths, format) {
  widths = widths || [320, 640, 960, 1280];
  format = format || "webp";

  return widths
    .map(function (w) {
      // path/image.jpg → path/image-640.webp
      var url = baseSrc.replace(/\.(jpg|png|jpeg)$/i, "-" + w + "." + format);
      return url + " " + w + "w";
    })
    .join(", ");
}

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Advanced Lazy Loader with placeholder!
// ═══════════════════════════════════════════════════════════

function AdvancedLazyLoader(options) {
  this.rootMargin = (options && options.rootMargin) || "100px";
  this.placeholder = (options && options.placeholder) || "";
  this._init();
}

AdvancedLazyLoader.prototype._init = function () {
  var self = this;
  var images = document.querySelectorAll("img[data-src]");

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            self._loadImage(entries[i].target);
            observer.unobserve(entries[i].target);
          }
        }
      },
      { rootMargin: self.rootMargin },
    );

    for (var i = 0; i < images.length; i++) {
      // Set placeholder!
      if (self.placeholder && !images[i].src) {
        images[i].src = self.placeholder;
      }
      observer.observe(images[i]);
    }
  }
};

AdvancedLazyLoader.prototype._loadImage = function (img) {
  var src = img.getAttribute("data-src");
  var srcset = img.getAttribute("data-srcset");

  // Preload trong Image() trước!
  var testImg = new Image();
  testImg.onload = function () {
    img.src = src;
    if (srcset) img.srcset = srcset;
    img.classList.add("loaded");
    img.removeAttribute("data-src");
    img.removeAttribute("data-srcset");
  };
  testImg.src = src;
};
```

---

## §4. Code Execution — Web Worker & Debounce!

```
  WEB WORKER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ JS = SINGLE THREAD! ★                                 │    │
  │  │ Heavy computation → BLOCK main thread! ❌              │    │
  │  │ → UI freeze! User không click/scroll được!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP: WEB WORKER! ★                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Main Thread              Worker Thread               │    │
  │  │  ┌──────────────┐        ┌──────────────┐             │    │
  │  │  │ UI render    │        │ Heavy        │             │    │
  │  │  │ Event handle │──msg──→│ computation  │             │    │
  │  │  │ DOM access   │←result─│ Data process │             │    │
  │  │  │ ★ KHÔNG bị  │        │ Sorting      │             │    │
  │  │  │  block! ✅   │        │ Filtering    │             │    │
  │  │  └──────────────┘        └──────────────┘             │    │
  │  │                                                      │    │
  │  │  ★ Worker KHÔNG truy cập được DOM!                   │    │
  │  │  ★ Giao tiếp qua postMessage! ★                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Inline Web Worker — không cần file riêng!
// ═══════════════════════════════════════════════════════════

function createInlineWorker(workerFunc) {
  // ★ Tạo worker từ function, không cần file .js riêng!
  var blob = new Blob(["(" + workerFunc.toString() + ")()"], {
    type: "application/javascript",
  });
  var url = URL.createObjectURL(blob);
  var worker = new Worker(url);

  // Cleanup URL!
  worker.addEventListener("error", function () {
    URL.revokeObjectURL(url);
  });

  return worker;
}

// ★ Heavy computation trong Worker!
function heavyWorkerCode() {
  self.onmessage = function (e) {
    var data = e.data;
    var action = data.action;

    if (action === "sort") {
      // ★ Sort 100K items → KHÔNG block UI!
      var sorted = data.items.sort(function (a, b) {
        return a.value - b.value;
      });
      self.postMessage({ action: "sort", result: sorted });
    }

    if (action === "filter") {
      var filtered = data.items.filter(function (item) {
        return item.status === data.filterBy;
      });
      self.postMessage({ action: "filter", result: filtered });
    }

    if (action === "aggregate") {
      // ★ Tính toán thống kê phức tạp!
      var sum = 0;
      var min = Infinity;
      var max = -Infinity;
      for (var i = 0; i < data.items.length; i++) {
        var val = data.items[i].value;
        sum += val;
        if (val < min) min = val;
        if (val > max) max = val;
      }
      self.postMessage({
        action: "aggregate",
        result: {
          sum: sum,
          avg: sum / data.items.length,
          min: min,
          max: max,
          count: data.items.length,
        },
      });
    }
  };
}

// SỬ DỤNG:
// var worker = createInlineWorker(heavyWorkerCode);
// worker.postMessage({ action: 'sort', items: bigArray });
// worker.onmessage = function(e) {
//   console.log('Sorted!', e.data.result);
// };
```

---

## §5. Rendering — Virtual List & Animation!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Virtual List — render chỉ visible items!
// ★ 100,000 items nhưng chỉ render ~20 DOM nodes!
// ═══════════════════════════════════════════════════════════

function VirtualList(container, options) {
  this.container = container;
  this.items = options.items || [];
  this.itemHeight = options.itemHeight || 50;
  this.renderItem = options.renderItem; // function(item, index)

  this.scrollTop = 0;
  this.containerHeight = container.clientHeight;

  // Tạo DOM structure!
  this.wrapper = document.createElement("div");
  this.wrapper.style.cssText = "overflow:auto;height:100%;";

  this.spacer = document.createElement("div");
  this.content = document.createElement("div");
  this.content.style.position = "relative";

  this.wrapper.appendChild(this.spacer);
  this.wrapper.appendChild(this.content);
  container.appendChild(this.wrapper);

  this._bindEvents();
  this._render();
}

VirtualList.prototype._bindEvents = function () {
  var self = this;
  this.wrapper.addEventListener(
    "scroll",
    throttle(function () {
      self.scrollTop = self.wrapper.scrollTop;
      self._render();
    }, 16),
  );
};

VirtualList.prototype._render = function () {
  var totalHeight = this.items.length * this.itemHeight;
  this.spacer.style.height = totalHeight + "px";

  // ★ Tính visible range!
  var startIdx = Math.floor(this.scrollTop / this.itemHeight);
  var visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
  var endIdx = Math.min(startIdx + visibleCount + 2, this.items.length);
  startIdx = Math.max(0, startIdx - 1); // Buffer!

  // ★ Clear + render chỉ visible items!
  this.content.innerHTML = "";
  this.content.style.top = startIdx * this.itemHeight + "px";

  for (var i = startIdx; i < endIdx; i++) {
    var el = this.renderItem(this.items[i], i);
    el.style.height = this.itemHeight + "px";
    el.style.boxSizing = "border-box";
    this.content.appendChild(el);
  }
};

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Smooth Animation — RAF + easing!
// ★ Dùng transform → KHÔNG reflow! GPU accelerated!
// ═══════════════════════════════════════════════════════════

function smoothAnimate(element, fromX, toX, duration) {
  var startTime = performance.now();

  function frame(currentTime) {
    var elapsed = currentTime - startTime;
    var progress = Math.min(elapsed / duration, 1);

    // ★ Ease-out cubic!
    var eased = 1 - Math.pow(1 - progress, 3);
    var value = fromX + (toX - fromX) * eased;

    // ★ transform → composite only! Không reflow! ★
    element.style.transform = "translateX(" + value + "px)";

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

// ═══════════════════════════════════════════════════════════
// CSS CONTAINMENT — giảm phạm vi reflow!
// ═══════════════════════════════════════════════════════════

// .isolated { contain: layout style paint; }
//   → Thay đổi bên trong KHÔNG ảnh hưởng bên ngoài! ★
//
// .fixed-size { contain: size; }
//   → Browser biết kích thước KHÔNG đổi! ★
//
// .content-box { contain: content; }
//   → = layout + style + paint! (shorthand!)
//
// will-change: transform;
//   → Tạo GPU layer TRƯỚC → animation mượt! ★
//   → CHỈ dùng khi thực sự cần! (tốn memory!)
```

---

## §6. Caching & CDN!

```
  CACHING STRATEGY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬──────────────┬──────────────────┐      │
  │  │ Resource          │ Cache        │ Lý do            │      │
  │  ├──────────────────┼──────────────┼──────────────────┤      │
  │  │ JS/CSS (hashed)   │ 1 year ★     │ Hash đổi = file │      │
  │  │                  │ immutable    │ mới! Cache safe! │      │
  │  │ Fonts            │ 1 year ★     │ Hầu như ko đổi!│      │
  │  │ Images           │ 1 year ★     │ Dùng CDN! ★      │      │
  │  │ HTML             │ no-cache! ★  │ Luôn kiểm tra  │      │
  │  │                  │              │ version mới!     │      │
  │  │ API              │ no-cache     │ Data realtime!    │      │
  │  └──────────────────┴──────────────┴──────────────────┘      │
  │                                                              │
  │  COMPRESSION:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ┌──────────┬──────────┬──────────────────────┐       │    │
  │  │ │ Loại    │ Nén     │ Ghi chú              │       │    │
  │  │ ├──────────┼──────────┼──────────────────────┤       │    │
  │  │ │ Gzip     │ ~70%     │ Phổ biến nhất! ★    │       │    │
  │  │ │ Brotli   │ ~80% ★   │ Tốt hơn Gzip 15-20%│       │    │
  │  │ └──────────┴──────────┴──────────────────────┘       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Performance Monitor!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Performance Monitor — full system!
// ★ Thu thập + đánh giá + cảnh báo + report!
// ═══════════════════════════════════════════════════════════

function PerformanceMonitor() {
  this.metrics = {};
  this.thresholds = {
    lcp: { good: 2500, needsImprovement: 4000 },
    inp: { good: 200, needsImprovement: 500 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    fcp: { good: 1800, needsImprovement: 3000 },
  };
}

// ★ Thu thập Resource Timing!
PerformanceMonitor.prototype.collectResources = function () {
  var resources = performance.getEntriesByType("resource");
  var byType = {};
  var totalSize = 0;

  for (var i = 0; i < resources.length; i++) {
    var r = resources[i];
    var type = r.initiatorType || "other";
    byType[type] = (byType[type] || 0) + 1;
    totalSize += r.transferSize || 0;
  }

  return {
    count: resources.length,
    totalSize: totalSize,
    totalSizeKB: Math.round(totalSize / 1024),
    byType: byType,
  };
};

// ★ Đánh giá rating!
PerformanceMonitor.prototype.rate = function (metric, value) {
  var t = this.thresholds[metric];
  if (!t) return "unknown";
  if (value <= t.good) return "good";
  if (value <= t.needsImprovement) return "needs-improvement";
  return "poor";
};

// ★ Tạo report tổng hợp!
PerformanceMonitor.prototype.getReport = function () {
  var self = this;
  var report = {
    url: window.location.href,
    timestamp: Date.now(),
    metrics: {},
    resources: this.collectResources(),
    ratings: {},
  };

  // Đánh giá từng metric!
  var metricNames = Object.keys(this.metrics);
  for (var i = 0; i < metricNames.length; i++) {
    var name = metricNames[i];
    report.metrics[name] = this.metrics[name];
    report.ratings[name] = this.rate(name, this.metrics[name]);
  }

  return report;
};

// ★ Kiểm tra + cảnh báo!
PerformanceMonitor.prototype.checkAlerts = function () {
  var alerts = [];
  var metricNames = Object.keys(this.metrics);

  for (var i = 0; i < metricNames.length; i++) {
    var name = metricNames[i];
    var rating = this.rate(name, this.metrics[name]);
    if (rating === "poor") {
      alerts.push({
        metric: name,
        value: this.metrics[name],
        rating: rating,
        message: name.toUpperCase() + " = " + this.metrics[name] + " (POOR!)",
      });
    }
  }
  return alerts;
};

// ★ Gửi report!
PerformanceMonitor.prototype.sendReport = function () {
  var report = this.getReport();
  report.alerts = this.checkAlerts();

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/performance/report", JSON.stringify(report));
  }
};
```

---

## §8. Optimization Checklist & Results!

```
  KẾT QUẢ TỐI ƯU:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬──────────┬──────────┬──────────┐      │
  │  │ Chỉ số          │ Trước    │ Sau      │ Cải thiện│      │
  │  ├──────────────────┼──────────┼──────────┼──────────┤      │
  │  │ First screen      │ 4.2s     │ 1.3s     │ 69% ↓ ★│      │
  │  │ LCP              │ 3.8s     │ 1.5s     │ 60% ↓ ★│      │
  │  │ INP              │ 280ms    │ 85ms     │ 70% ↓ ★│      │
  │  │ CLS              │ 0.25     │ 0.05     │ 80% ↓  │      │
  │  │ Bundle size       │ 5.2MB    │ 1.1MB    │ 79% ↓ ★│      │
  │  │ Lighthouse        │ 52       │ 94       │ 81% ↑ ★│      │
  │  └──────────────────┴──────────┴──────────┴──────────┘      │
  │                                                              │
  │  CHECKLIST:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ RESOURCE LOADING:                                      │    │
  │  │ ☐ Gzip/Brotli compression!                            │    │
  │  │ ☐ CDN acceleration!                                    │    │
  │  │ ☐ Code splitting (vendor, route, component!)          │    │
  │  │ ☐ Image WebP/AVIF + lazy loading!                     │    │
  │  │ ☐ Preload critical resources!                          │    │
  │  │ ☐ Static assets long-term cache (hash!)               │    │
  │  │                                                      │    │
  │  │ CODE EXECUTION:                                        │    │
  │  │ ☐ Tree shaking (dead code elimination!)               │    │
  │  │ ☐ Web Worker cho heavy computation!                   │    │
  │  │ ☐ Debounce/Throttle!                                   │    │
  │  │ ☐ Tránh memory leak!                                  │    │
  │  │                                                      │    │
  │  │ RENDERING:                                              │    │
  │  │ ☐ Virtual list cho long list!                          │    │
  │  │ ☐ Animation: transform/opacity (GPU!)                 │    │
  │  │ ☐ CSS containment!                                     │    │
  │  │ ☐ Avoid forced sync layout!                            │    │
  │  │ ☐ Batch DOM reads/writes!                              │    │
  │  │                                                      │    │
  │  │ MONITORING:                                             │    │
  │  │ ☐ Core Web Vitals collection!                          │    │
  │  │ ☐ Performance alerts!                                  │    │
  │  │ ☐ Lighthouse CI!                                       │    │
  │  │ ☐ Performance dashboard!                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Core Web Vitals gồm những gì?                            │
  │  → LCP ≤2.5s: nội dung chính load xong!                    │
  │  → INP ≤100ms: phản hồi interaction (thay FID!) ★          │
  │  → CLS ≤0.1: ổn định layout (không nhảy!)                 │
  │                                                              │
  │  ❓ 2: Code splitting giúp gì?                                   │
  │  → Tách bundle lớn → nhiều chunk nhỏ!                      │
  │  → Vendor cached lâu dài (hash immutable!)                   │
  │  → Route lazy load → initial chỉ load trang hiện tại! ★   │
  │                                                              │
  │  ❓ 3: Web Worker khi nào dùng?                                  │
  │  → Heavy computation (sort 100K, filter, aggregate!)        │
  │  → KHÔNG truy cập DOM! Giao tiếp qua postMessage! ★        │
  │  → Tránh block main thread → UI luôn mượt! ★               │
  │                                                              │
  │  ❓ 4: Virtual list hoạt động thế nào?                           │
  │  → 100K items nhưng chỉ render ~20 DOM nodes! ★             │
  │  → Tính startIdx/endIdx từ scrollTop!                        │
  │  → Chỉ render visible items + buffer!                        │
  │                                                              │
  │  ❓ 5: Tại sao animation dùng transform tốt hơn left/top?       │
  │  → transform: composite only → GPU accelerated! ★            │
  │  → left/top: trigger REFLOW + REPAINT! Rất tốn! ❌          │
  │  → will-change: tạo GPU layer trước!                         │
  │                                                              │
  │  ❓ 6: sendBeacon vs fetch khi report performance?               │
  │  → sendBeacon: gửi được KHI PAGE UNLOAD! ★ (reliable!)     │
  │  → fetch: có thể bị cancel khi page close!                   │
  │  → sendBeacon: async, không block navigation! ★              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
