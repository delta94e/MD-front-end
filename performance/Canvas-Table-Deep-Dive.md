# Canvas High-Performance Table — Deep Dive!

> **Phân tích kiến trúc bảng hiệu năng cao Canvas!**
> Virtual scrolling, layered rendering, caching, frame scheduling!

---

## §1. Tổng Quan Kiến Trúc!

```
  TẠI SAO CANVAS TABLE?
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  DOM TABLE vs CANVAS TABLE:                                     │
  │  ┌──────────────────┬──────────────────┬────────────────┐    │
  │  │ TIÊU CHÍ          │ DOM Table        │ Canvas Table ★│    │
  │  ├──────────────────┼──────────────────┼────────────────┤    │
  │  │ 1,000 rows       │ Ổn ✅            │ Ổn ✅          │    │
  │  │ 10,000 rows      │ Chậm ❌          │ Mượt ✅ ★    │    │
  │  │ 100,000 rows     │ Lag/Crash ❌❌    │ Mượt ✅ ★    │    │
  │  │ Memory           │ Cao (DOM nodes!) │ Thấp ★        │    │
  │  │ Reflow/Repaint   │ Rất nhiều ❌    │ KHÔNG CÓ! ★   │    │
  │  │ Customization     │ CSS              │ Pixel-level ★ │    │
  │  │ Accessibility     │ Built-in ✅      │ Tự implement │    │
  │  │ Text select      │ Native ✅        │ Tự implement │    │
  │  └──────────────────┴──────────────────┴────────────────┘    │
  │                                                              │
  │  ★ Canvas Table = KHÔNG DOM node cho mỗi cell!              │
  │  ★ Chỉ VẼ pixel lên 1 canvas element duy nhất!              │
  │  ★ Virtual scrolling: chỉ vẽ rows ĐANG THẤY!               │
  │  ★ Không reflow/repaint → performance cực cao!               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```
  CẤU TRÚC MODULE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  EVirtTable (Entry Point!)                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │
  │  │  │ Scroller │ │ Header   │ │ Body     │              │    │
  │  │  │ (cuộn!) │ │ (đầu!)  │ │ (thân!) │              │    │
  │  │  └──────────┘ └──────────┘ └──────────┘              │    │
  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │
  │  │  │ Footer   │ │ Selector │ │ Autofill │              │    │
  │  │  │ (cuối!) │ │ (chọn!) │ │ (tự điền)│             │    │
  │  │  └──────────┘ └──────────┘ └──────────┘              │    │
  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │
  │  │  │ Tooltip  │ │ Editor   │ │ Empty    │              │    │
  │  │  │ (tip!)   │ │(sửa!)   │ │ (trống!)│              │    │
  │  │  └──────────┘ └──────────┘ └──────────┘              │    │
  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │
  │  │  │Overlayer │ │ Context  │ │ Loading  │              │    │
  │  │  │ (phủ!)  │ │  Menu    │ │ (tải!) │              │    │
  │  │  └──────────┘ └──────────┘ └──────────┘              │    │
  │  │                                                      │    │
  │  │  ★ Paint (ctx)  ← Canvas 2D rendering engine!        │    │
  │  │  ★ Database     ← Data layer + mapping cache!        │    │
  │  │  ★ Icons        ← SVG cache!                          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ★ Mỗi module ĐỘC LẬP, phụ trách 1 chức năng! ★          │
  │  ★ Single Responsibility Principle!                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Frame Scheduling & Render Throttling!

```
  FRAME SCHEDULING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  SƠ ĐỒ RENDER PIPELINE:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Event (scroll, click, data change...)                │    │
  │  │       │                                                │    │
  │  │       ▼                                                │    │
  │  │  emit('draw') → throttle! ★ (tránh vẽ quá nhiều!) │    │
  │  │       │                                                │    │
  │  │       ▼                                                │    │
  │  │  requestAnimationFrame (FRAME 1!):                     │    │
  │  │  ┌───────────────────────────────────────────┐         │    │
  │  │  │ ① header.update()   ← tính toán header!   │         │    │
  │  │  │ ② footer.update()   ← tính toán footer!   │         │    │
  │  │  │ ③ body.update()     ← tính visible rows!  │         │    │
  │  │  │ ④ paint.clear()     ← xóa canvas! ★       │         │    │
  │  │  │ ⑤ body.draw()       ← VẼ body!            │         │    │
  │  │  │ ⑥ footer.draw()     ← VẼ footer!          │         │    │
  │  │  │ ⑦ header.draw()     ← VẼ header!          │         │    │
  │  │  │ ⑧ scroller.draw()   ← VẼ scrollbar!       │         │    │
  │  │  │ ⑨ overlayer.draw()  ← VẼ overlay (tùy!)  │         │    │
  │  │  └───────────────────────────────────────────┘         │    │
  │  │       │                                                │    │
  │  │       ▼                                                │    │
  │  │  requestAnimationFrame (FRAME 2!):                     │    │
  │  │  ┌───────────────────────────────────────────┐         │    │
  │  │  │ body.updateAutoHeight()                    │         │    │
  │  │  │ ★ Tách ra frame riêng để KHÔNG ảnh hưởng │         │    │
  │  │  │   hiệu suất frame đầu tiên! ★             │         │    │
  │  │  └───────────────────────────────────────────┘         │    │
  │  │       │                                                │    │
  │  │       ▼                                                │    │
  │  │  Performance monitoring!                                │    │
  │  │  drawTime = endTime - startTime                        │    │
  │  │  → Tự điều chỉnh throttle delay! ★                   │    │
  │  │                                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Dynamic Throttle — không dùng lodash!
// ★ Delay tự động điều chỉnh theo thời gian vẽ thực tế!
// ═══════════════════════════════════════════════════════════

function dynamicThrottle(func, delayFunc) {
  let lastCalledTime = 0;
  let timeoutId = null;

  return function () {
    const context = this;
    const args = arguments;
    const now = Date.now();
    const delay = delayFunc(); // ★ Tính delay DYNAMIC!

    if (now - lastCalledTime >= delay) {
      // ★ Đủ thời gian → chạy NGAY!
      func.apply(context, args);
      lastCalledTime = now;
    } else if (!timeoutId) {
      // ★ Chưa đủ → đặt timer cho lần chạy tiếp!
      const remaining = delay - (now - lastCalledTime);
      timeoutId = setTimeout(function () {
        func.apply(context, args);
        lastCalledTime = Date.now();
        timeoutId = null;
      }, remaining);
    }
    // ★ Nếu đã có timer → BỎ QUA! (throttle!)
  };
}

// SỬ DỤNG:
// let drawTime = 16; // ms
// const throttledDraw = dynamicThrottle(draw, () => drawTime);
// → drawTime tự điều chỉnh sau mỗi lần vẽ!
```

---

## §3. Virtual Scrolling!

```
  VIRTUAL SCROLLING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  NGUYÊN LÝ:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ CHỈ VẼ những row ĐANG THẤY trong viewport! ★      │    │
  │  │ ★ 100,000 rows nhưng chỉ VẼ ~20-30 rows! ★          │    │
  │  │                                                      │    │
  │  │  Toàn bộ data (100,000 rows!):                        │    │
  │  │  ┌───────────────────────────┐                         │    │
  │  │  │ Row 0                     │ ← KHÔNG VẼ!            │    │
  │  │  │ Row 1                     │                         │    │
  │  │  │ ...                       │                         │    │
  │  │  │ Row 499                   │                         │    │
  │  │  ├───────────────────────────┤ ← scrollTop!            │    │
  │  │  │ Row 500 ██████████████████│ ★ VẼ! (visible!)       │    │
  │  │  │ Row 501 ██████████████████│ ★ VẼ!                  │    │
  │  │  │ Row 502 ██████████████████│ ★ VẼ!                  │    │
  │  │  │ ...     ██████████████████│ ★ VẼ!                  │    │
  │  │  │ Row 529 ██████████████████│ ★ VẼ!                  │    │
  │  │  ├───────────────────────────┤ ← scrollTop + height!  │    │
  │  │  │ Row 530                   │ ← KHÔNG VẼ!            │    │
  │  │  │ ...                       │                         │    │
  │  │  │ Row 99,999                │                         │    │
  │  │  └───────────────────────────┘                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BINARY SEARCH TÌM ROW:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ Dùng binary search → O(log n)! ★                   │    │
  │  │ ★ KHÔNG duyệt toàn bộ → nhanh với 100K rows!       │    │
  │  │                                                      │    │
  │  │  positions = [                                         │    │
  │  │    { top: 0,    height: 40 },   // row 0              │    │
  │  │    { top: 40,   height: 40 },   // row 1              │    │
  │  │    { top: 80,   height: 60 },   // row 2 (taller!)   │    │
  │  │    { top: 140,  height: 40 },   // row 3              │    │
  │  │    ...                                                 │    │
  │  │  ]                                                     │    │
  │  │                                                      │    │
  │  │  scrollTop = 2000                                      │    │
  │  │  → Binary search → startRowIndex = 50! ★              │    │
  │  │  → endRowIndex = startRowIndex + visibleCount!        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Virtual Scrolling Engine!
// ★ Hoàn toàn tự viết, không dùng thư viện!
// ═══════════════════════════════════════════════════════════

function VirtualScrollEngine(config) {
  this.totalRows = config.totalRows;
  this.rowHeight = config.rowHeight || 40;
  this.viewportHeight = config.viewportHeight;

  // ★ Mảng lưu vị trí mỗi row (hỗ trợ dynamic height!)
  this.positions = [];
  for (var i = 0; i < this.totalRows; i++) {
    this.positions.push({
      index: i,
      top: i * this.rowHeight,
      height: this.rowHeight,
    });
  }
}

// ★ BINARY SEARCH: Tìm row đầu tiên trong viewport!
VirtualScrollEngine.prototype.getStartIndex = function (scrollTop) {
  var low = 0;
  var high = this.positions.length - 1;
  var result = 0;

  while (low <= high) {
    var mid = Math.floor((low + high) / 2);
    var midTop = this.positions[mid].top;
    var midBottom = midTop + this.positions[mid].height;

    if (midTop <= scrollTop && midBottom > scrollTop) {
      return mid; // ★ Tìm thấy! Row chứa scrollTop!
    } else if (midTop > scrollTop) {
      high = mid - 1;
      result = mid;
    } else {
      low = mid + 1;
    }
  }
  return result;
};

// ★ Tìm row cuối cùng trong viewport!
VirtualScrollEngine.prototype.getEndIndex = function (scrollTop) {
  var startIdx = this.getStartIndex(scrollTop);
  var endIdx = startIdx;
  var accumulated = 0;

  while (endIdx < this.positions.length && accumulated < this.viewportHeight) {
    accumulated += this.positions[endIdx].height;
    endIdx++;
  }

  // Buffer thêm vài row cho smooth scroll!
  return Math.min(endIdx + 3, this.positions.length - 1);
};

// ★ Lấy danh sách visible rows!
VirtualScrollEngine.prototype.getVisibleRows = function (scrollTop) {
  var start = this.getStartIndex(scrollTop);
  var end = this.getEndIndex(scrollTop);
  return { startIndex: start, endIndex: end };
};

// ★ Cập nhật height thực tế (dynamic row height!)
VirtualScrollEngine.prototype.updateRowHeight = function (index, newHeight) {
  var diff = newHeight - this.positions[index].height;
  this.positions[index].height = newHeight;

  // Cập nhật top của tất cả row phía sau!
  for (var i = index + 1; i < this.positions.length; i++) {
    this.positions[i].top += diff;
  }
};

// ★ Tổng chiều cao (cho scrollbar!)
VirtualScrollEngine.prototype.getTotalHeight = function () {
  var last = this.positions[this.positions.length - 1];
  return last.top + last.height;
};
```

---

## §4. Layered Rendering!

```
  LAYERED RENDERING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  THỨ TỰ VẼ (quan trọng!):                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  Layer 1 (bottom): Non-fixed cell CONTAINERS          │    │
  │  │  ┌──────────────────────────────────────────┐         │    │
  │  │  │ background, borders (scrollable area!)    │         │    │
  │  │  └──────────────────────────────────────────┘         │    │
  │  │           ↓                                            │    │
  │  │  Layer 2: Non-fixed cell CONTENT                       │    │
  │  │  ┌──────────────────────────────────────────┐         │    │
  │  │  │ text, icons (scrollable area!)            │         │    │
  │  │  └──────────────────────────────────────────┘         │    │
  │  │           ↓                                            │    │
  │  │  Layer 3: Fixed cell CONTAINERS ★                       │    │
  │  │  ┌──────────────────────────────────────────┐         │    │
  │  │  │ frozen column backgrounds (ĐÈ LÊN trên!)│         │    │
  │  │  └──────────────────────────────────────────┘         │    │
  │  │           ↓                                            │    │
  │  │  Layer 4: Fixed cell CONTENT ★                          │    │
  │  │  ┌──────────────────────────────────────────┐         │    │
  │  │  │ frozen column text (always visible!)      │         │    │
  │  │  └──────────────────────────────────────────┘         │    │
  │  │           ↓                                            │    │
  │  │  Layer 5: Fixed column SHADOW                           │    │
  │  │  ┌──────────────────────────────────────────┐         │    │
  │  │  │ box-shadow effect for frozen columns!     │         │    │
  │  │  └──────────────────────────────────────────┘         │    │
  │  │           ↓                                            │    │
  │  │  Layer 6 (top): Tip lines, selection, autofill          │    │
  │  │                                                      │    │
  │  │  ★ Fixed columns VẼ SAU → đè lên scrollable area!   │    │
  │  │  ★ Giảm overdraw tối đa!                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  COLUMN VISIBILITY:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ Cả ROW và COLUMN đều kiểm tra visibility!        │    │
  │  │                                                      │    │
  │  │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐        │    │
  │  │  │Fixed│Fixed│ Col │ Col │ Col │ Col │ Col  │        │    │
  │  │  │  A  │  B  │  C  │  D  │  E  │  F  │  G   │        │    │
  │  │  └─────┴─────┘─────┴─────┴─────┴─────┴─────┘        │    │
  │  │  ★always★ ◄─── scrollLeft ───► ★clip!★              │    │
  │  │   visible   chỉ vẽ col C-F!                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Text Cache & Icon Cache!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Text Measurement Cache!
// ★ measureText() rất TỐN! Cache để không gọi lại!
// ═══════════════════════════════════════════════════════════

function TextCache() {
  this.cache = {}; // { cacheKey: string[] }
}

TextCache.prototype.wrapText = function (ctx, text, maxWidth, cacheKey) {
  // ★ Cache hit? Trả về ngay!
  if (cacheKey && this.cache[cacheKey]) {
    return this.cache[cacheKey];
  }

  // ★ Cache miss → tính toán line-break!
  var words = String(text);
  var lines = [];
  var currentLine = "";

  for (var i = 0; i < words.length; i++) {
    var testLine = currentLine + words[i];
    var metrics = ctx.measureText(testLine); // ★ TỐN KÉM!

    if (metrics.width > maxWidth && currentLine !== "") {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // ★ Lưu cache!
  if (cacheKey) {
    this.cache[cacheKey] = lines;
  }
  return lines;
};

TextCache.prototype.invalidate = function (cacheKey) {
  delete this.cache[cacheKey];
};

TextCache.prototype.clear = function () {
  this.cache = {};
};

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: SVG Icon Cache!
// ★ Parse SVG 1 lần → cache HTMLImageElement!
// ═══════════════════════════════════════════════════════════

function IconCache() {
  this.icons = {};
}

IconCache.prototype.getIcon = function (svgContent, color) {
  var cacheKey = svgContent + "_" + color;

  // ★ Cache hit!
  if (this.icons[cacheKey]) {
    return this.icons[cacheKey];
  }

  // ★ Tạo Image từ SVG!
  var coloredSvg = svgContent.replace(/currentColor/g, color);
  var blob = new Blob([coloredSvg], { type: "image/svg+xml" });
  var url = URL.createObjectURL(blob);

  var img = new Image();
  img.src = url;

  // ★ Cache Image object!
  this.icons[cacheKey] = img;

  // Cleanup URL khi load xong!
  img.onload = function () {
    URL.revokeObjectURL(url);
  };

  return img;
};
```

---

## §6. High DPI & Pixel Alignment!

```
  HIGH DPI RENDERING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ★ Retina/4K display: devicePixelRatio = 2 hoặc 3!  │    │
  │  │ ★ Canvas mặc định: 1 CSS pixel = 1 canvas pixel!    │    │
  │  │ ★ Retina: 1 CSS pixel = 2-3 device pixels!           │    │
  │  │ ★ Nếu không xử lý → CANVAS BỊ MỜ! ❌                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  dpr = 2 (Retina!)                                     │    │
  │  │  CSS display: 400×300px                                │    │
  │  │  Canvas actual: 800×600px ★ (×2!)                     │    │
  │  │  ctx.scale(2, 2) ★                                     │    │
  │  │                                                      │    │
  │  │  ┌──────────── 800px (actual) ──────────┐             │    │
  │  │  │ ┌──────── 400px (CSS) ─────────┐     │             │    │
  │  │  │ │                               │     │             │    │
  │  │  │ │   Canvas vẫn vẽ theo        │     │             │    │
  │  │  │ │   tọa độ CSS (400×300)      │     │ 600px       │    │
  │  │  │ │   nhưng output 800×600!      │     │ (actual)    │    │
  │  │  │ │   → SẮC NÉT! ★              │     │             │    │
  │  │  │ │                               │     │             │    │
  │  │  │ └───────────────────────────────┘     │             │    │
  │  │  └──────────────────────────────────────┘             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  PIXEL ALIGNMENT (giải quyết 1px mờ!):                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │                                                      │    │
  │  │  KHÔNG offset:        CÓ offset -0.5:                 │    │
  │  │  ┌─────────┐          ┌─────────┐                      │    │
  │  │  │ ░░░░░░░ │ ← MỜ!  │ ████████│ ← SẮC! ★           │    │
  │  │  │ ░░░░░░░ │         │         │                      │    │
  │  │  └─────────┘          └─────────┘                      │    │
  │  │                                                      │    │
  │  │  ★ Canvas vẽ 1px line ở giữa 2 pixel → mờ!         │    │
  │  │  ★ Offset -0.5 → line nằm ĐÚNG trên pixel grid! ★  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: High DPI Canvas Setup!
// ═══════════════════════════════════════════════════════════

function setupHighDPICanvas(canvas, width, height) {
  var dpr = window.devicePixelRatio || 1;

  // ★ Canvas actual size = CSS size × dpr!
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  // ★ CSS display size giữ nguyên!
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  // ★ Scale context → vẽ theo CSS coordinates!
  var ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  return ctx;
}

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Paint helper với pixel alignment!
// ═══════════════════════════════════════════════════════════

function CanvasPaint(ctx) {
  this.ctx = ctx;
}

// ★ Vẽ rect với pixel alignment!
CanvasPaint.prototype.drawRect = function (x, y, w, h, options) {
  this.ctx.beginPath();
  // ★ -0.5 offset → sắc nét trên pixel grid!
  this.ctx.rect(x - 0.5, y - 0.5, w, h);

  if (options.fill) {
    this.ctx.fillStyle = options.fill;
    this.ctx.fill();
  }
  if (options.stroke) {
    this.ctx.strokeStyle = options.stroke;
    this.ctx.lineWidth = options.lineWidth || 1;
    this.ctx.stroke();
  }
};

// ★ Vẽ line với pixel alignment!
CanvasPaint.prototype.drawLine = function (x1, y1, x2, y2, options) {
  this.ctx.beginPath();
  this.ctx.moveTo(x1 - 0.5, y1 - 0.5);
  this.ctx.lineTo(x2 - 0.5, y2 - 0.5);
  this.ctx.strokeStyle = options.color || "#ddd";
  this.ctx.lineWidth = options.width || 1;
  this.ctx.stroke();
};
```

---

## §7. Data Layer & Mapping Cache!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Database — Data layer mapping cache!
// ★ Nhiều Map cache → query O(1) thay vì O(n)!
// ═══════════════════════════════════════════════════════════

function TableDatabase() {
  // ★ Cache mappings!
  this.rowKeyMap = {}; // rowKey → rowData
  this.rowIndexToKey = {}; // index → rowKey
  this.rowKeyToIndex = {}; // rowKey → index
  this.colIndexToKey = {}; // colIndex → colKey
  this.headerMap = {}; // colKey → headerConfig
  this.selectionMap = {}; // "rowKey_colKey" → selected?
  this.expandMap = {}; // rowKey → expanded?
  this.validationMap = {}; // "rowKey_colKey" → error
  this.positions = []; // Virtual scroll positions!
}

// ★ Set data → build ALL caches!
TableDatabase.prototype.setData = function (rows, columns) {
  this.positions = [];
  var accTop = 0;

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var key = row.id || String(i);

    this.rowKeyMap[key] = row;
    this.rowIndexToKey[i] = key;
    this.rowKeyToIndex[key] = i;

    this.positions.push({
      index: i,
      top: accTop,
      height: row._height || 40,
    });
    accTop += row._height || 40;
  }

  for (var j = 0; j < columns.length; j++) {
    var col = columns[j];
    this.colIndexToKey[j] = col.key;
    this.headerMap[col.key] = col;
  }
};

// ★ O(1) lookups!
TableDatabase.prototype.getRowByKey = function (key) {
  return this.rowKeyMap[key]; // O(1)! ★
};

TableDatabase.prototype.getRowByIndex = function (index) {
  var key = this.rowIndexToKey[index];
  return this.rowKeyMap[key]; // O(1)! ★
};

TableDatabase.prototype.isSelected = function (rowKey, colKey) {
  return !!this.selectionMap[rowKey + "_" + colKey]; // O(1)!
};

TableDatabase.prototype.toggleExpand = function (rowKey) {
  this.expandMap[rowKey] = !this.expandMap[rowKey];
};
```

---

## §8. Tổng Hợp — Mini Canvas Table!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Mini Canvas Table Engine!
// ★ Đầy đủ: virtual scroll + cache + HiDPI + throttle!
// ═══════════════════════════════════════════════════════════

function MiniCanvasTable(container, config) {
  this.container = container;
  this.columns = config.columns;
  this.rowHeight = config.rowHeight || 36;
  this.headerHeight = config.headerHeight || 40;

  // Canvas setup!
  this.canvas = document.createElement("canvas");
  container.appendChild(this.canvas);
  this.ctx = setupHighDPICanvas(
    this.canvas,
    container.clientWidth,
    container.clientHeight,
  );

  // Modules!
  this.paint = new CanvasPaint(this.ctx);
  this.textCache = new TextCache();
  this.scrollEngine = null;
  this.database = new TableDatabase();
  this.scrollTop = 0;
  this.drawTime = 16;

  // Throttled draw!
  var self = this;
  this._throttledDraw = dynamicThrottle(
    function () {
      self._draw();
    },
    function () {
      return self.drawTime;
    },
  );

  this._bindEvents();
}

// ★ Set data + build caches!
MiniCanvasTable.prototype.setData = function (rows) {
  this.database.setData(rows, this.columns);
  this.scrollEngine = new VirtualScrollEngine({
    totalRows: rows.length,
    rowHeight: this.rowHeight,
    viewportHeight: this.container.clientHeight - this.headerHeight,
  });
  this._throttledDraw();
};

// ★ Scroll handler!
MiniCanvasTable.prototype._bindEvents = function () {
  var self = this;
  this.canvas.addEventListener("wheel", function (e) {
    e.preventDefault();
    self.scrollTop = Math.max(
      0,
      Math.min(
        self.scrollTop + e.deltaY,
        self.scrollEngine.getTotalHeight() - self.container.clientHeight,
      ),
    );
    self._throttledDraw();
  });
};

// ★ Core draw — RAF + performance monitoring!
MiniCanvasTable.prototype._draw = function () {
  var self = this;
  requestAnimationFrame(function () {
    var startTime = performance.now();

    // Clear!
    self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);

    // ① Header!
    self._drawHeader();

    // ② Visible rows only! ★
    var visible = self.scrollEngine.getVisibleRows(self.scrollTop);
    for (var i = visible.startIndex; i <= visible.endIndex; i++) {
      self._drawRow(i);
    }

    // Performance monitoring → adaptive throttle! ★
    var endTime = performance.now();
    self.drawTime = Math.round(endTime - startTime) * 2;
    self.drawTime = Math.max(self.drawTime, 16); // min 16ms!
  });
};

// ★ Draw header!
MiniCanvasTable.prototype._drawHeader = function () {
  var x = 0;
  for (var j = 0; j < this.columns.length; j++) {
    var col = this.columns[j];
    this.paint.drawRect(x, 0, col.width, this.headerHeight, {
      fill: "#f5f5f5",
      stroke: "#ddd",
    });
    this.ctx.fillStyle = "#333";
    this.ctx.font = "bold 13px sans-serif";
    this.ctx.fillText(col.title, x + 8, this.headerHeight / 2 + 4);
    x += col.width;
  }
};

// ★ Draw single row!
MiniCanvasTable.prototype._drawRow = function (rowIndex) {
  var row = this.database.getRowByIndex(rowIndex);
  if (!row) return;

  var pos = this.scrollEngine.positions[rowIndex];
  var y = pos.top - this.scrollTop + this.headerHeight;
  var x = 0;

  for (var j = 0; j < this.columns.length; j++) {
    var col = this.columns[j];
    var value = row[col.key] || "";

    // Cell background!
    this.paint.drawRect(x, y, col.width, pos.height, {
      fill: rowIndex % 2 === 0 ? "#fff" : "#fafafa",
      stroke: "#e8e8e8",
    });

    // Cell text (with cache!)
    var cacheKey = rowIndex + "_" + j;
    var lines = this.textCache.wrapText(
      this.ctx,
      value,
      col.width - 16,
      cacheKey,
    );
    this.ctx.fillStyle = "#333";
    this.ctx.font = "13px sans-serif";
    for (var l = 0; l < lines.length; l++) {
      this.ctx.fillText(lines[l], x + 8, y + 16 + l * 18);
    }

    x += col.width;
  }
};
```

---

## §9. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Canvas table vs DOM table khác gì?                        │
  │  → DOM: mỗi cell = 1 node, reflow/repaint, chậm 10K+ rows!│
  │  → Canvas: vẽ pixel, KHÔNG DOM node, không reflow! ★        │
  │  → Canvas: virtual scroll chỉ vẽ visible rows!              │
  │                                                              │
  │  ❓ 2: Virtual scrolling hoạt động thế nào?                     │
  │  → Mảng positions lưu top + height mỗi row!                 │
  │  → Binary search O(log n) tìm startIndex từ scrollTop! ★    │
  │  → Chỉ VẼ rows trong viewport + buffer! ★                   │
  │                                                              │
  │  ❓ 3: Tại sao cần offset -0.5px khi vẽ canvas?                 │
  │  → Canvas vẽ line ở GIỮA 2 pixel → anti-alias → MỜ!       │
  │  → Offset -0.5 → line nằm ĐÚNG trên pixel grid → SẮC! ★  │
  │                                                              │
  │  ❓ 4: High DPI canvas xử lý thế nào?                           │
  │  → canvas.width = CSS width × devicePixelRatio! ★            │
  │  → canvas.style.width giữ nguyên CSS size!                   │
  │  → ctx.scale(dpr, dpr) → vẽ theo CSS tọa độ!              │
  │                                                              │
  │  ❓ 5: Tại sao cần text measurement cache?                       │
  │  → ctx.measureText() rất TỐN hiệu suất! ★                  │
  │  → Cùng text + width → kết quả KHÔNG ĐỔI!                  │
  │  → Cache → gọi measureText 1 LẦN duy nhất! ★               │
  │                                                              │
  │  ❓ 6: Frame scheduling tối ưu thế nào?                          │
  │  → requestAnimationFrame: sync với refresh rate! ★            │
  │  → Throttle: tránh vẽ quá nhiều!                              │
  │  → Tách autoHeight sang frame 2 → không block frame 1! ★    │
  │  → Dynamic throttle: tự điều chỉnh delay theo drawTime!    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
