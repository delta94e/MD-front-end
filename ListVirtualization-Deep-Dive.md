# List Virtualization (Windowing) — Deep Dive

> 📅 2026-02-15 · ⏱ 35 phút đọc
>
> List Virtualization, Windowing, Virtual Scrolling,
> Tự viết FixedSizeList, VariableSizeList, VirtualGrid,
> CellMeasurer, InfiniteLoader, AutoSizer, ScrollSync,
> react-window vs react-virtualized, content-visibility
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Performance / Rendering
>
> _Dựa trên patterns.dev, CSS-Tricks, LogRocket_

---

## Mục Lục

| #   | Phần                                      |
| --- | ----------------------------------------- |
| 1   | Vấn đề: Render danh sách lớn              |
| 2   | List Virtualization là gì?                |
| 3   | Cách hoạt động bên trong                  |
| 4   | Tự viết FixedSizeList từ đầu              |
| 5   | Tự viết VariableSizeList (dynamic height) |
| 6   | Tự viết VirtualGrid (2D)                  |
| 7   | Tự viết CellMeasurer (auto measure)       |
| 8   | Tự viết InfiniteLoader                    |
| 9   | Tự viết AutoSizer                         |
| 10  | ScrollSync — đồng bộ scroll               |
| 11  | react-window vs react-virtualized         |
| 12  | CSS content-visibility                    |
| 13  | Best Practices & Phỏng vấn                |

---

## §1. Vấn đề: Render danh sách lớn

```
VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  Render 10,000 items TRỰC TIẾP:
  ┌────────────────────────────────────────────────────┐
  │ Browser tạo 10,000 DOM nodes!                      │
  │ → Memory: 20.6 MB!                                 │
  │ → Render time: 242.7ms!                            │
  │ → Frame rate: 31.5 fps (giật lag!)                 │
  │ → GPU Raster: spikes liên tục!                     │
  │                                                    │
  │ CHỈ THẤY ~10-20 items trên màn hình!              │
  │ → 9,980 DOM nodes = LÃNG PHÍ HOÀN TOÀN!          │
  └────────────────────────────────────────────────────┘

  Render 10,000 items VỚI VIRTUALIZATION:
  ┌────────────────────────────────────────────────────┐
  │ Browser tạo CHỈ ~20-30 DOM nodes!                  │
  │ → Memory: 4.8 MB! (giảm 76%!)                     │
  │ → Render time: 2.4ms! (nhanh hơn 100x!)           │
  │ → Frame rate: 59 fps (mượt mà!)                   │
  │ → GPU Raster: ổn định!                             │
  └────────────────────────────────────────────────────┘

  SƠ ĐỒ SO SÁNH:
  ┌─────────── KHÔNG VIRTUALIZE ──────────┐
  │ <ul>                                   │
  │   <li>Item 0</li>     ← render!       │
  │   <li>Item 1</li>     ← render!       │
  │   <li>Item 2</li>     ← VISIBLE ✅    │
  │   <li>Item 3</li>     ← VISIBLE ✅    │
  │   <li>Item 4</li>     ← VISIBLE ✅    │
  │   <li>Item 5</li>     ← render!       │
  │   ...                                  │
  │   <li>Item 9999</li>  ← render!       │
  │ </ul>                                  │
  │ → 10,000 DOM nodes! 🚨                │
  └────────────────────────────────────────┘

  ┌─────────── CÓ VIRTUALIZE ────────────┐
  │ <div style="height: 350000px">        │ ← scroll container
  │   (không render)                       │
  │   <div top=70>Item 2</div>  ← VISIBLE │
  │   <div top=105>Item 3</div> ← VISIBLE │
  │   <div top=140>Item 4</div> ← VISIBLE │
  │   (không render)                       │
  │ </div>                                 │
  │ → CHỈ ~20 DOM nodes! ✅              │
  └────────────────────────────────────────┘
```

---

## §2. List Virtualization là gì?

```
ĐỊNH NGHĨA:
═══════════════════════════════════════════════════════════════

  List Virtualization (Windowing) = CHỈ render items
  HIỆN visible trên viewport!

  Items NGOÀI viewport → KHÔNG tạo DOM!
  User scroll → đổi items được render!

  ┌─────────────────────────────────────────────────────────┐
  │                    FULL LIST (10,000 items)              │
  │  ┌───┐                                                  │
  │  │ 0 │  Not rendered                                    │
  │  │ 1 │  Not rendered                                    │
  │  ├───┤ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ VIEWPORT TOP ─ ─ ─ ─    │
  │  │ 2 │  ✅ Rendered                                     │
  │  │ 3 │  ✅ Rendered                                     │
  │  │ 4 │  ✅ Rendered     ← "WINDOW"                     │
  │  │ 5 │  ✅ Rendered                                     │
  │  │ 6 │  ✅ Rendered                                     │
  │  ├───┤ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ VIEWPORT BOTTOM ─ ─ ─   │
  │  │ 7 │  Not rendered                                    │
  │  │ 8 │  Not rendered                                    │
  │  │...│                                                   │
  │  │9999│ Not rendered                                    │
  │  └───┘                                                  │
  └─────────────────────────────────────────────────────────┘

  KHI USER SCROLL XUỐNG:
  ┌───┐
  │ 0 │  Not rendered
  │ 1 │  Not rendered
  │ 2 │  Not rendered  ← bị GỠ khỏi DOM!
  ├───┤ ─ ─ ─ ─ ─ ─ ─ VIEWPORT TOP ─ ─ ─
  │ 3 │  ✅ Rendered
  │ 4 │  ✅ Rendered
  │ 5 │  ✅ Rendered   ← WINDOW di chuyển!
  │ 6 │  ✅ Rendered
  │ 7 │  ✅ Rendered   ← THÊM vào DOM!
  ├───┤ ─ ─ ─ ─ ─ ─ ─ VIEWPORT BOTTOM ─ ─ ─
  │ 8 │  Not rendered
  └───┘
```

---

## §3. Cách hoạt động bên trong

```
KIẾN TRÚC INTERNAL:
═══════════════════════════════════════════════════════════════

  CẤU TRÚC DOM:
  ┌──────────────────────────────────────────────────────┐
  │ <div class="outer"                                   │
  │   style="position: relative;                         │
  │          height: 400px;          ← viewport height   │
  │          width: 700px;           ← viewport width    │
  │          overflow: auto;         ← SCROLLBAR!        │
  │          will-change: transform">                    │
  │                                                      │
  │   <div class="inner"                                 │
  │     style="height: 350000px;     ← totalHeight!      │
  │            width: 100%;          ← = 10000 × 35px    │
  │            position: relative;                       │
  │            overflow: hidden">    ← ẩn vùng ngoài     │
  │                                                      │
  │     <div style="position: absolute;                  │
  │       top: 245px; left: 0;       ← item 7           │
  │       height: 35px; width: 100%">                    │
  │       Item 7                                         │
  │     </div>                                           │
  │                                                      │
  │     <div style="position: absolute;                  │
  │       top: 280px; left: 0;       ← item 8           │
  │       height: 35px; width: 100%">                    │
  │       Item 8                                         │
  │     </div>                                           │
  │     ...                                              │
  │   </div>                                             │
  │ </div>                                               │
  └──────────────────────────────────────────────────────┘

  THUẬT TOÁN TÍNH VISIBLE RANGE:
  ┌────────────────────────────────────────────────────┐
  │ scrollTop = 245                                    │
  │ viewportHeight = 400                               │
  │ itemHeight = 35                                    │
  │                                                    │
  │ startIndex = floor(scrollTop / itemHeight)         │
  │            = floor(245 / 35) = 7                   │
  │                                                    │
  │ visibleCount = ceil(viewportHeight / itemHeight)   │
  │              = ceil(400 / 35) = 12                 │
  │                                                    │
  │ endIndex = startIndex + visibleCount = 19          │
  │                                                    │
  │ → Render items [7..19] = 13 items!                 │
  │ → overscan thêm 3 trước + 3 sau                   │
  │ → Render items [4..22] = 19 items!                 │
  └────────────────────────────────────────────────────┘

  OVERSCAN — CHỐNG FLICKERING:
  ┌────────────────────────────────────────────────────┐
  │       overscan=3                                   │
  │ ┌───┐                                              │
  │ │ 4 │ overscan (phía trên)                         │
  │ │ 5 │ overscan                                     │
  │ │ 6 │ overscan                                     │
  │ ├───┤─── VIEWPORT TOP ────                        │
  │ │ 7 │ visible                                      │
  │ │...│                                              │
  │ │19 │ visible                                      │
  │ ├───┤─── VIEWPORT BOTTOM ──                       │
  │ │20 │ overscan (phía dưới)                         │
  │ │21 │ overscan                                     │
  │ │22 │ overscan                                     │
  │ └───┘                                              │
  │ → User scroll nhanh → items đã sẵn sàng!          │
  └────────────────────────────────────────────────────┘
```

---

## §4. Tự viết FixedSizeList từ đầu

```javascript
// ═══ FIXED SIZE LIST — TỰ VIẾT TỪ ĐẦU ═══
// Mỗi item có CÙNG chiều cao!

class VirtualList {
  constructor(
    container,
    {
      itemCount,
      itemHeight,
      renderItem, // (index) => HTMLElement
      overscanCount = 3,
    },
  ) {
    this._container = container;
    this._itemCount = itemCount;
    this._itemHeight = itemHeight;
    this._renderItem = renderItem;
    this._overscan = overscanCount;

    // ① Tạo outer container (viewport)!
    this._outer = document.createElement("div");
    this._outer.style.cssText = `
      position: relative;
      overflow: auto;
      height: ${container.clientHeight}px;
      width: 100%;
      will-change: transform;
    `;

    // ② Tạo inner container (scroll area)!
    this._inner = document.createElement("div");
    const totalHeight = itemCount * itemHeight;
    this._inner.style.cssText = `
      height: ${totalHeight}px;
      width: 100%;
      position: relative;
      overflow: hidden;
    `;

    this._outer.appendChild(this._inner);
    container.appendChild(this._outer);

    // ③ Cache rendered items!
    this._renderedItems = new Map();
    this._startIndex = -1;
    this._endIndex = -1;

    // ④ Listen scroll!
    this._onScroll = this._onScroll.bind(this);
    this._outer.addEventListener("scroll", this._onScroll, {
      passive: true,
    });

    // ⑤ Initial render!
    this._update();
  }

  // Tính visible range!
  _getVisibleRange() {
    const scrollTop = this._outer.scrollTop;
    const viewportH = this._outer.clientHeight;

    let start = Math.floor(scrollTop / this._itemHeight);
    let end = Math.ceil((scrollTop + viewportH) / this._itemHeight);

    // Thêm overscan!
    start = Math.max(0, start - this._overscan);
    end = Math.min(this._itemCount - 1, end + this._overscan);

    return { start, end };
  }

  // Scroll handler!
  _onScroll() {
    // requestAnimationFrame để batch updates!
    if (this._rafId) return;
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      this._update();
    });
  }

  // Update rendered items!
  _update() {
    const { start, end } = this._getVisibleRange();

    // Không thay đổi → skip!
    if (start === this._startIndex && end === this._endIndex) return;

    // ① Xóa items NGOÀI range!
    this._renderedItems.forEach((el, index) => {
      if (index < start || index > end) {
        this._inner.removeChild(el);
        this._renderedItems.delete(index);
      }
    });

    // ② Thêm items MỚI trong range!
    for (let i = start; i <= end; i++) {
      if (!this._renderedItems.has(i)) {
        const el = this._renderItem(i);

        // Absolute position!
        el.style.position = "absolute";
        el.style.top = `${i * this._itemHeight}px`;
        el.style.left = "0";
        el.style.width = "100%";
        el.style.height = `${this._itemHeight}px`;

        this._inner.appendChild(el);
        this._renderedItems.set(i, el);
      }
    }

    this._startIndex = start;
    this._endIndex = end;
  }

  // Scroll to index!
  scrollToIndex(index, align = "start") {
    const offset = index * this._itemHeight;
    const viewportH = this._outer.clientHeight;

    let scrollTop;
    if (align === "start") scrollTop = offset;
    else if (align === "center")
      scrollTop = offset - viewportH / 2 + this._itemHeight / 2;
    else if (align === "end") scrollTop = offset - viewportH + this._itemHeight;

    this._outer.scrollTop = Math.max(0, scrollTop);
  }

  // Cleanup!
  destroy() {
    this._outer.removeEventListener("scroll", this._onScroll);
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._renderedItems.clear();
    this._container.removeChild(this._outer);
  }
}

// ═══ SỬ DỤNG ═══
const container = document.getElementById("app");
container.style.height = "400px";

const list = new VirtualList(container, {
  itemCount: 10000,
  itemHeight: 35,
  overscanCount: 3,
  renderItem: (index) => {
    const div = document.createElement("div");
    div.className = index % 2 ? "odd" : "even";
    div.textContent = `Item ${index}`;
    return div;
  },
});

// Scroll to item 5000!
list.scrollToIndex(5000, "center");
```

---

## §5. Tự viết VariableSizeList

```javascript
// ═══ VARIABLE SIZE LIST — DYNAMIC HEIGHT ═══
// Mỗi item có chiều cao KHÁC NHAU!

class VariableSizeList {
  constructor(
    container,
    {
      itemCount,
      itemHeight, // (index) => number — function trả về height!
      renderItem,
      overscanCount = 3,
      estimatedItemHeight = 50,
    },
  ) {
    this._container = container;
    this._itemCount = itemCount;
    this._getItemHeight = itemHeight; // function!
    this._renderItem = renderItem;
    this._overscan = overscanCount;

    // ① Tính offset cache — tổng height của items [0..i]!
    // Dùng estimatedHeight cho items chưa đo!
    this._offsets = new Float64Array(itemCount + 1);
    this._measured = new Set();
    this._estimatedHeight = estimatedItemHeight;
    this._recalcOffsets();

    // Tạo DOM structure!
    this._outer = document.createElement("div");
    this._outer.style.cssText = `
      position: relative; overflow: auto;
      height: ${container.clientHeight}px; width: 100%;
    `;

    this._inner = document.createElement("div");
    this._inner.style.cssText = `
      position: relative; overflow: hidden; width: 100%;
    `;
    this._updateInnerHeight();

    this._outer.appendChild(this._inner);
    container.appendChild(this._outer);

    this._renderedItems = new Map();

    this._outer.addEventListener("scroll", this._onScroll.bind(this), {
      passive: true,
    });

    this._update();
  }

  // Tính cumulative offsets!
  _recalcOffsets() {
    this._offsets[0] = 0;
    for (let i = 0; i < this._itemCount; i++) {
      const h = this._measured.has(i)
        ? this._getItemHeight(i)
        : this._estimatedHeight;
      this._offsets[i + 1] = this._offsets[i] + h;
    }
  }

  _updateInnerHeight() {
    const total = this._offsets[this._itemCount];
    this._inner.style.height = `${total}px`;
  }

  // Binary search tìm startIndex từ scrollTop!
  _findIndex(offset) {
    let lo = 0,
      hi = this._itemCount - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (this._offsets[mid] <= offset && this._offsets[mid + 1] > offset)
        return mid;
      if (this._offsets[mid] < offset) lo = mid + 1;
      else hi = mid - 1;
    }
    return Math.max(0, lo);
  }

  _getVisibleRange() {
    const scrollTop = this._outer.scrollTop;
    const viewportH = this._outer.clientHeight;

    let start = this._findIndex(scrollTop);
    let end = this._findIndex(scrollTop + viewportH);

    start = Math.max(0, start - this._overscan);
    end = Math.min(this._itemCount - 1, end + this._overscan);
    return { start, end };
  }

  _onScroll() {
    if (this._rafId) return;
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      this._update();
    });
  }

  _update() {
    const { start, end } = this._getVisibleRange();

    this._renderedItems.forEach((el, idx) => {
      if (idx < start || idx > end) {
        this._inner.removeChild(el);
        this._renderedItems.delete(idx);
      }
    });

    let needsRecalc = false;

    for (let i = start; i <= end; i++) {
      if (!this._renderedItems.has(i)) {
        const el = this._renderItem(i);
        const h = this._getItemHeight(i);
        const top = this._offsets[i];

        el.style.position = "absolute";
        el.style.top = `${top}px`;
        el.style.left = "0";
        el.style.width = "100%";
        el.style.height = `${h}px`;

        this._inner.appendChild(el);
        this._renderedItems.set(i, el);

        if (!this._measured.has(i)) {
          this._measured.add(i);
          needsRecalc = true;
        }
      }
    }

    if (needsRecalc) {
      this._recalcOffsets();
      this._updateInnerHeight();
      // Reposition visible items!
      this._renderedItems.forEach((el, idx) => {
        el.style.top = `${this._offsets[idx]}px`;
        el.style.height = `${this._getItemHeight(idx)}px`;
      });
    }
  }

  destroy() {
    this._outer.removeEventListener("scroll", this._onScroll);
    this._container.removeChild(this._outer);
  }
}
```

---

## §6. Tự viết VirtualGrid (2D)

```javascript
// ═══ VIRTUAL GRID — 2D VIRTUALIZATION ═══
// Virtualize theo CẢ trục X và Y!

class VirtualGrid {
  constructor(
    container,
    {
      rowCount,
      columnCount,
      rowHeight,
      columnWidth,
      renderCell, // (rowIndex, colIndex) => HTMLElement
      overscanCount = 2,
    },
  ) {
    this._rowCount = rowCount;
    this._colCount = columnCount;
    this._rowH = rowHeight;
    this._colW = columnWidth;
    this._renderCell = renderCell;
    this._overscan = overscanCount;

    this._outer = document.createElement("div");
    this._outer.style.cssText = `
      position: relative; overflow: auto;
      height: ${container.clientHeight}px;
      width: ${container.clientWidth}px;
    `;

    this._inner = document.createElement("div");
    this._inner.style.cssText = `
      position: relative;
      height: ${rowCount * rowHeight}px;
      width: ${columnCount * columnWidth}px;
    `;

    this._outer.appendChild(this._inner);
    container.appendChild(this._outer);

    this._cells = new Map(); // key = "row,col"
    this._outer.addEventListener("scroll", () => this._scheduleUpdate(), {
      passive: true,
    });

    this._update();
  }

  _scheduleUpdate() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = null;
      this._update();
    });
  }

  _update() {
    const { scrollTop, scrollLeft, clientHeight, clientWidth } = this._outer;

    // Tính visible range cho ROWS!
    let rowStart = Math.floor(scrollTop / this._rowH);
    let rowEnd = Math.ceil((scrollTop + clientHeight) / this._rowH);
    rowStart = Math.max(0, rowStart - this._overscan);
    rowEnd = Math.min(this._rowCount - 1, rowEnd + this._overscan);

    // Tính visible range cho COLUMNS!
    let colStart = Math.floor(scrollLeft / this._colW);
    let colEnd = Math.ceil((scrollLeft + clientWidth) / this._colW);
    colStart = Math.max(0, colStart - this._overscan);
    colEnd = Math.min(this._colCount - 1, colEnd + this._overscan);

    // Xóa cells ngoài range!
    const visibleKeys = new Set();
    for (let r = rowStart; r <= rowEnd; r++) {
      for (let c = colStart; c <= colEnd; c++) {
        visibleKeys.add(`${r},${c}`);
      }
    }

    this._cells.forEach((el, key) => {
      if (!visibleKeys.has(key)) {
        this._inner.removeChild(el);
        this._cells.delete(key);
      }
    });

    // Thêm cells mới!
    for (let r = rowStart; r <= rowEnd; r++) {
      for (let c = colStart; c <= colEnd; c++) {
        const key = `${r},${c}`;
        if (!this._cells.has(key)) {
          const el = this._renderCell(r, c);
          el.style.position = "absolute";
          el.style.top = `${r * this._rowH}px`;
          el.style.left = `${c * this._colW}px`;
          el.style.width = `${this._colW}px`;
          el.style.height = `${this._rowH}px`;

          this._inner.appendChild(el);
          this._cells.set(key, el);
        }
      }
    }
  }
}

// ═══ SỬ DỤNG ═══
const grid = new VirtualGrid(document.getElementById("app"), {
  rowCount: 1000,
  columnCount: 100,
  rowHeight: 50,
  columnWidth: 150,
  renderCell: (row, col) => {
    const div = document.createElement("div");
    div.textContent = `[${row}, ${col}]`;
    div.style.border = "1px solid #eee";
    return div;
  },
});
```

---

## §7. Tự viết CellMeasurer

```javascript
// ═══ CELL MEASURER — TỰ ĐO CHIỀU CAO ═══
// Render tạm NGOÀI viewport → đo → cache!

class CellMeasurerCache {
  constructor({ defaultHeight = 50, fixedWidth = true }) {
    this._cache = new Map();
    this._defaultH = defaultHeight;
    this._fixedWidth = fixedWidth;
  }

  has(index) {
    return this._cache.has(index);
  }

  get(index) {
    return this._cache.get(index) || this._defaultH;
  }

  set(index, height) {
    this._cache.set(index, height);
  }

  clearAll() {
    this._cache.clear();
  }
}

// Đo phần tử bằng cách render offscreen!
function measureElement(renderFn, index, containerWidth) {
  // Tạo container ẩn!
  const measurer = document.createElement("div");
  measurer.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: ${containerWidth}px;
    visibility: hidden;
  `;

  const el = renderFn(index);
  measurer.appendChild(el);
  document.body.appendChild(measurer);

  // Đo height THẬT!
  const height = measurer.getBoundingClientRect().height;

  // Cleanup!
  document.body.removeChild(measurer);
  return height;
}

// ═══ SỬ DỤNG VỚI VARIABLE LIST ═══
const cache = new CellMeasurerCache({ defaultHeight: 60 });

function getItemHeight(index) {
  if (cache.has(index)) return cache.get(index);

  // Đo lần đầu!
  const height = measureElement(renderItem, index, 700);
  cache.set(index, height);
  return height;
}
```

---

## §8. Tự viết InfiniteLoader

```javascript
// ═══ INFINITE LOADER — LOAD DATA KHI SCROLL ═══
// Fetch thêm data khi user scroll gần cuối!

class InfiniteLoader {
  constructor(
    virtualList,
    {
      isItemLoaded, // (index) => boolean
      loadMoreItems, // (startIndex, endIndex) => Promise
      threshold = 15, // bắt đầu load sớm 15 items!
      minimumBatchSize = 10,
    },
  ) {
    this._list = virtualList;
    this._isLoaded = isItemLoaded;
    this._loadMore = loadMoreItems;
    this._threshold = threshold;
    this._minBatch = minimumBatchSize;
    this._loading = false;

    // Hook vào scroll event của list!
    const origScroll = virtualList._onScroll.bind(virtualList);
    virtualList._onScroll = () => {
      origScroll();
      this._checkAndLoad();
    };
  }

  _checkAndLoad() {
    if (this._loading) return;

    const { end } = this._list._getVisibleRange();
    const total = this._list._itemCount;

    // Nếu gần cuối danh sách đã load!
    if (end + this._threshold >= total) return;

    // Tìm items chưa load!
    let unloadedStart = -1;
    let unloadedEnd = -1;

    for (let i = end; i < Math.min(end + this._threshold, total); i++) {
      if (!this._isLoaded(i)) {
        if (unloadedStart === -1) unloadedStart = i;
        unloadedEnd = i;
      }
    }

    if (unloadedStart === -1) return;

    // Đảm bảo minimum batch size!
    unloadedEnd = Math.max(unloadedEnd, unloadedStart + this._minBatch - 1);

    this._loading = true;
    this._loadMore(unloadedStart, unloadedEnd)
      .then(() => {
        this._loading = false;
        this._list._update(); // Re-render!
      })
      .catch(() => {
        this._loading = false;
      });
  }
}

// ═══ SỬ DỤNG ═══
const loadedItems = new Set();

const loader = new InfiniteLoader(virtualList, {
  isItemLoaded: (index) => loadedItems.has(index),
  loadMoreItems: async (start, end) => {
    const response = await fetch(`/api/items?start=${start}&end=${end}`);
    const items = await response.json();
    items.forEach((_, i) => loadedItems.add(start + i));
  },
});
```

---

## §9. Tự viết AutoSizer

```javascript
// ═══ AUTO SIZER — TỰ DETECT KÍCH THƯỚC PARENT ═══

class AutoSizer {
  constructor(container, callback) {
    // callback = ({ width, height }) => void
    this._container = container;
    this._callback = callback;
    this._width = 0;
    this._height = 0;

    // ResizeObserver — modern API!
    this._observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Chỉ trigger khi SIZE thật sự thay đổi!
        if (width !== this._width || height !== this._height) {
          this._width = width;
          this._height = height;
          this._callback({ width, height });
        }
      }
    });

    this._observer.observe(container);

    // Initial size!
    const rect = container.getBoundingClientRect();
    this._width = rect.width;
    this._height = rect.height;
    this._callback({ width: rect.width, height: rect.height });
  }

  destroy() {
    this._observer.disconnect();
  }
}

// ═══ SỬ DỤNG ═══
const wrapper = document.getElementById("list-wrapper");
wrapper.style.height = "calc(100vh - 60px)";

let virtualList = null;

const autoSizer = new AutoSizer(wrapper, ({ width, height }) => {
  if (virtualList) virtualList.destroy();

  virtualList = new VirtualList(wrapper, {
    itemCount: 10000,
    itemHeight: 35,
    renderItem: (i) => {
      const div = document.createElement("div");
      div.textContent = `Item ${i}`;
      return div;
    },
  });
});
```

---

## §10. ScrollSync

```javascript
// ═══ SCROLL SYNC — ĐỒNG BỘ SCROLL GIỮA 2 LISTS ═══

class ScrollSync {
  constructor(
    sourceEl,
    targetEl,
    { syncVertical = true, syncHorizontal = false } = {},
  ) {
    this._source = sourceEl;
    this._target = targetEl;
    this._syncing = false;

    this._handler = () => {
      if (this._syncing) return;
      this._syncing = true;

      requestAnimationFrame(() => {
        if (syncVertical) {
          this._target.scrollTop = this._source.scrollTop;
        }
        if (syncHorizontal) {
          this._target.scrollLeft = this._source.scrollLeft;
        }
        this._syncing = false;
      });
    };

    this._source.addEventListener("scroll", this._handler, {
      passive: true,
    });
  }

  destroy() {
    this._source.removeEventListener("scroll", this._handler);
  }
}

// ═══ SỬ DỤNG ═══
// List IDs bên trái + list nội dung bên phải!
const leftList = document.querySelector(".left-list");
const rightList = document.querySelector(".right-list");

// Scroll rightList → leftList auto sync!
new ScrollSync(rightList, leftList, { syncVertical: true });
```

---

## §11. react-window vs react-virtualized

```
SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬─────────────────┬──────────────────┐
  │                  │ react-virtualized│ react-window     │
  ├──────────────────┼─────────────────┼──────────────────┤
  │ Gzipped size     │ 34.7 KB          │ 5.4 KB          │
  │ Minified         │ 135.1 KB         │ 21.3 KB         │
  │ Tree-shakeable   │ Có               │ TỐT HƠN         │
  │ API              │ Phức tạp         │ Đơn giản         │
  │ Dependencies     │ 6                │ 2                │
  ├──────────────────┼─────────────────┼──────────────────┤
  │ List             │ ✅               │ FixedSizeList    │
  │ Variable List    │ ✅               │ VariableSizeList │
  │ Grid             │ ✅               │ FixedSizeGrid    │
  │ Variable Grid    │ ✅               │ VariableSizeGrid │
  │ Table            │ ✅               │ ❌               │
  │ Masonry          │ ✅               │ ❌               │
  │ Collection       │ ✅               │ ❌               │
  │ WindowScroller   │ ✅               │ ❌               │
  │ AutoSizer        │ ✅               │ Riêng package    │
  │ CellMeasurer     │ ✅               │ ❌               │
  │ ScrollSync       │ ✅               │ ❌               │
  │ InfiniteLoader   │ ✅               │ Riêng package    │
  └──────────────────┴─────────────────┴──────────────────┘

  KẾT LUẬN:
  → react-window NHẸ hơn 6x! ĐỦ cho hầu hết use cases!
  → react-virtualized ĐẦY ĐỦ hơn (Table, Masonry, Collection)
  → Cùng tác giả: Brian Vaughn!
```

---

## §12. CSS content-visibility

```
CSS content-visibility — BROWSER NATIVE:
═══════════════════════════════════════════════════════════════

  .list-item {
    content-visibility: auto;
    contain-intrinsic-size: 0 50px;  /* estimated size! */
  }

  → Browser TỰ ĐỘNG skip rendering offscreen items!
  → Không cần JS library!
  → Nhưng: vẫn giữ DOM nodes (không gỡ bỏ!)
  → react-window/virtualized TỐT HƠN vì remove DOM!

  KHI NÀO DÙNG:
  → content-visibility: danh sách TĨNH, HTML dài!
  → JS virtualization: danh sách ĐỘNG, 10K+ items!
```

---

## §13. Mini react-window — Tự viết React Component Library

> **Mục tiêu**: Viết lại react-window từ đầu dưới dạng React components,
> giải thích CHI TIẾT TỪNG BƯỚC flow bên trong để trả lời phỏng vấn.

```
FLOW TỔNG QUAN — react-window hoạt động thế nào?
═══════════════════════════════════════════════════════════════

  ① MOUNT:
  ┌──────────────────────────────────────────────────────┐
  │ <FixedSizeList                                       │
  │   height={400}        ← viewport height              │
  │   width={700}         ← viewport width               │
  │   itemCount={10000}   ← tổng số items                │
  │   itemSize={35}       ← chiều cao mỗi item           │
  │   overscanCount={3}   ← thêm items phía trên/dưới   │
  │ >                                                    │
  │   {({ index, style }) => <Row style={style} />}     │
  │ </FixedSizeList>                                     │
  └──────────────────────────────────────────────────────┘
           │
           ▼
  ② TÍNH toTAL HEIGHT:
  ┌──────────────────────────────────────────────────────┐
  │ totalHeight = itemCount × itemSize                   │
  │             = 10000 × 35 = 350,000px                 │
  │                                                      │
  │ → Inner div height = 350,000px (tạo scrollbar!)     │
  │ → Outer div height = 400px (viewport!)               │
  └──────────────────────────────────────────────────────┘
           │
           ▼
  ③ TÍNH VISIBLE RANGE (lần đầu scrollTop = 0):
  ┌──────────────────────────────────────────────────────┐
  │ startIndex = floor(0 / 35) = 0                       │
  │ endIndex   = ceil((0 + 400) / 35) - 1 = 11          │
  │                                                      │
  │ + overscan 3 phía trên:  start = max(0, 0-3) = 0    │
  │ + overscan 3 phía dưới:  end = min(9999, 11+3) = 14 │
  │                                                      │
  │ → Render items [0..14] = 15 React elements!         │
  └──────────────────────────────────────────────────────┘
           │
           ▼
  ④ RENDER với ABSOLUTE POSITIONING:
  ┌──────────────────────────────────────────────────────┐
  │ Item 0:  style={{ position: 'absolute',              │
  │            top: 0,   height: 35, width: '100%' }}    │
  │ Item 1:  style={{ top: 35,  height: 35 }}            │
  │ Item 2:  style={{ top: 70,  height: 35 }}            │
  │ ...                                                  │
  │ Item 14: style={{ top: 490, height: 35 }}            │
  └──────────────────────────────────────────────────────┘
           │
           ▼
  ⑤ USER SCROLL → onScroll event:
  ┌──────────────────────────────────────────────────────┐
  │ scrollTop = 245 (user scroll xuống!)                 │
  │                                                      │
  │ startIndex = floor(245 / 35) = 7                     │
  │ endIndex   = ceil((245 + 400) / 35) - 1 = 18        │
  │ + overscan: [4..21]                                  │
  │                                                      │
  │ → setState({ scrollOffset: 245 })                    │
  │ → Re-render CHỈ items [4..21]!                      │
  │ → Items [0..3] TỰ ĐỘNG biến mất (React reconciler!) │
  │ → Items [15..21] TỰ ĐỘNG xuất hiện!                 │
  └──────────────────────────────────────────────────────┘
           │
           ▼
  ⑥ REACT RECONCILIATION:
  ┌──────────────────────────────────────────────────────┐
  │ React dùng KEY để diff!                              │
  │ key={index} → React biết item nào MỚI, item nào CŨ │
  │ → Chỉ mount items MỚI (15→21)                      │
  │ → Unmount items RA KHỎI range (0→3)                 │
  │ → Items 4→14 GIỮ NGUYÊN (chỉ update style.top!)    │
  └──────────────────────────────────────────────────────┘
```

### 13.1 FixedSizeList Component

```jsx
import React, { useState, useCallback, useRef, useMemo } from "react";

// ═══ MINI REACT-WINDOW: FixedSizeList ═══
// API giống hệt react-window!

function FixedSizeList({
  height, // Chiều cao viewport (px)
  width, // Chiều rộng viewport (px)
  itemCount, // Tổng số items
  itemSize, // Chiều cao MỖI item (cố định!)
  overscanCount = 3, // Số items render thêm
  children, // Render function: ({ index, style }) => JSX
  onScroll, // Optional scroll callback
  className,
  style: outerStyle,
}) {
  // ① STATE: chỉ lưu scrollOffset!
  // → Mỗi khi scroll → setState → re-render!
  const [scrollOffset, setScrollOffset] = useState(0);
  const outerRef = useRef(null);

  // ② TÍNH TOTAL HEIGHT cho inner container!
  // → Tạo scrollbar bằng cách set height rất lớn!
  const totalHeight = itemCount * itemSize;

  // ③ TÍNH VISIBLE RANGE — CORE ALGORITHM!
  const { startIndex, endIndex } = useMemo(() => {
    // Items đầu tiên visible = scrollOffset / itemSize
    let start = Math.floor(scrollOffset / itemSize);
    // Items cuối cùng visible
    let end = Math.ceil((scrollOffset + height) / itemSize) - 1;

    // Clamp trong bounds!
    start = Math.max(0, start);
    end = Math.min(itemCount - 1, end);

    // Thêm overscan → chống flickering khi scroll nhanh!
    const overscanStart = Math.max(0, start - overscanCount);
    const overscanEnd = Math.min(itemCount - 1, end + overscanCount);

    return { startIndex: overscanStart, endIndex: overscanEnd };
  }, [scrollOffset, height, itemSize, itemCount, overscanCount]);

  // ④ SCROLL HANDLER!
  const handleScroll = useCallback(
    (e) => {
      const newOffset = e.currentTarget.scrollTop;
      setScrollOffset(newOffset);

      // Forward event nếu có callback!
      if (onScroll) {
        onScroll({
          scrollOffset: newOffset,
          scrollDirection: newOffset > scrollOffset ? "forward" : "backward",
        });
      }
    },
    [onScroll, scrollOffset],
  );

  // ⑤ RENDER CHỈ VISIBLE ITEMS!
  const items = [];
  for (let index = startIndex; index <= endIndex; index++) {
    // Tạo STYLE cho mỗi item — ABSOLUTE POSITIONING!
    const style = {
      position: "absolute",
      top: index * itemSize, // ← VỊ TRÍ = index × height!
      height: itemSize,
      left: 0,
      width: "100%",
    };

    // Gọi children function (render prop pattern!)
    items.push(children({ index, style, key: index }));
  }

  // ⑥ RENDER DOM STRUCTURE!
  return (
    // OUTER: viewport với overflow auto → scrollbar!
    <div
      ref={outerRef}
      className={className}
      onScroll={handleScroll}
      style={{
        position: "relative",
        height,
        width,
        overflow: "auto",
        willChange: "transform", // ← GPU hint!
        ...outerStyle,
      }}
    >
      {/* INNER: height = totalHeight → tạo scroll space! */}
      <div
        style={{
          height: totalHeight,
          width: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {items}
      </div>
    </div>
  );
}
```

```
FLOW CHI TIẾT — TỪ SCROLL ĐẾN RENDER:
═══════════════════════════════════════════════════════════════

  User scroll ↓
       │
       ▼
  onScroll event fire
       │
       ▼
  e.currentTarget.scrollTop = 245
       │
       ▼
  setScrollOffset(245)     ← React setState!
       │
       ▼
  Component RE-RENDER      ← React triggers render!
       │
       ▼
  useMemo recalculate:
  ┌─────────────────────────────────────┐
  │ start = floor(245/35) = 7          │
  │ end   = ceil(645/35) - 1 = 18     │
  │ overscanStart = 7 - 3 = 4         │
  │ overscanEnd   = 18 + 3 = 21       │
  └─────────────────────────────────────┘
       │
       ▼
  for loop: index 4 → 21
  ┌─────────────────────────────────────┐
  │ index=4:  style.top = 140px        │
  │ index=5:  style.top = 175px        │
  │ index=6:  style.top = 210px        │
  │ index=7:  style.top = 245px ← TOP  │
  │ ...                                │
  │ index=21: style.top = 735px        │
  └─────────────────────────────────────┘
       │
       ▼
  React reconciliation (key-based diff!)
       │
       ▼
  Browser paint CHỈ 18 items! ✅
```

### 13.2 VariableSizeList Component

```jsx
// ═══ MINI REACT-WINDOW: VariableSizeList ═══
// Mỗi item có chiều cao KHÁC NHAU!

function VariableSizeList({
  height,
  width,
  itemCount,
  itemSize, // (index) => number — FUNCTION!
  overscanCount = 3,
  children,
  estimatedItemSize = 50,
}) {
  const [scrollOffset, setScrollOffset] = useState(0);

  // ① OFFSET CACHE — tính cumulative position!
  // offsets[i] = tổng height của items [0..i-1]
  // → offsets[i] = vị trí TOP của item thứ i!
  const offsets = useMemo(() => {
    const arr = new Array(itemCount + 1);
    arr[0] = 0;
    for (let i = 0; i < itemCount; i++) {
      arr[i + 1] = arr[i] + itemSize(i);
    }
    return arr;
  }, [itemCount, itemSize]);

  const totalHeight = offsets[itemCount];

  // ② BINARY SEARCH tìm index từ scrollOffset!
  // → O(log n) thay vì O(n)!
  const findIndex = useCallback(
    (offset) => {
      let lo = 0,
        hi = itemCount - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        if (offsets[mid] <= offset && offsets[mid + 1] > offset) {
          return mid;
        }
        if (offsets[mid] < offset) lo = mid + 1;
        else hi = mid - 1;
      }
      return Math.min(Math.max(0, lo), itemCount - 1);
    },
    [offsets, itemCount],
  );

  // ③ TÍNH VISIBLE RANGE!
  const { startIndex, endIndex } = useMemo(() => {
    let start = findIndex(scrollOffset);
    let end = findIndex(scrollOffset + height);

    start = Math.max(0, start - overscanCount);
    end = Math.min(itemCount - 1, end + overscanCount);
    return { startIndex: start, endIndex: end };
  }, [scrollOffset, height, findIndex, itemCount, overscanCount]);

  const handleScroll = useCallback((e) => {
    setScrollOffset(e.currentTarget.scrollTop);
  }, []);

  // ④ RENDER items với VARIABLE heights!
  const items = [];
  for (let index = startIndex; index <= endIndex; index++) {
    const style = {
      position: "absolute",
      top: offsets[index], // ← từ offset cache!
      height: itemSize(index), // ← height KHÁC nhau!
      left: 0,
      width: "100%",
    };
    items.push(children({ index, style, key: index }));
  }

  return (
    <div
      onScroll={handleScroll}
      style={{
        position: "relative",
        height,
        width,
        overflow: "auto",
        willChange: "transform",
      }}
    >
      <div
        style={{
          height: totalHeight,
          width: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {items}
      </div>
    </div>
  );
}
```

```
VARIABLE SIZE — TẠI SAO CẦN BINARY SEARCH?
═══════════════════════════════════════════════════════════════

  FIXED SIZE: startIndex = floor(scrollTop / itemHeight)
  → O(1)! Chia đơn giản vì mọi item CÙNG height!

  VARIABLE SIZE: items có height KHÁC nhau!
  → Không thể chia đơn giản!
  → Cần BINARY SEARCH trên offset array!

  VÍ DỤ:
  ┌───────┬────────┬────────────────────────┐
  │ Index │ Height │ Offset (top position)  │
  ├───────┼────────┼────────────────────────┤
  │ 0     │ 40px   │ 0                      │
  │ 1     │ 60px   │ 40                     │
  │ 2     │ 30px   │ 100                    │
  │ 3     │ 80px   │ 130                    │
  │ 4     │ 50px   │ 210                    │
  │ 5     │ 45px   │ 260                    │
  └───────┴────────┴────────────────────────┘

  scrollTop = 115 → tìm index nào?
  Binary search trên offsets:
  → offsets[2]=100 ≤ 115 < offsets[3]=130
  → index = 2! ✅

  Naive search: O(n) — duyệt tuần tự!
  Binary search: O(log n) — nhanh gấp 1000x với 10K items!
```

### 13.3 FixedSizeGrid Component

```jsx
// ═══ MINI REACT-WINDOW: FixedSizeGrid ═══
// Virtualize theo CẢ 2 chiều: vertical + horizontal!

function FixedSizeGrid({
  height,
  width,
  rowCount,
  columnCount,
  rowHeight,
  columnWidth,
  overscanCount = 2,
  children, // ({ rowIndex, columnIndex, style }) => JSX
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const totalHeight = rowCount * rowHeight;
  const totalWidth = columnCount * columnWidth;

  // Tính visible range cho CẢ 2 chiều!
  const range = useMemo(() => {
    let rowStart = Math.floor(scrollTop / rowHeight);
    let rowEnd = Math.ceil((scrollTop + height) / rowHeight) - 1;
    let colStart = Math.floor(scrollLeft / columnWidth);
    let colEnd = Math.ceil((scrollLeft + width) / columnWidth) - 1;

    // Overscan!
    rowStart = Math.max(0, rowStart - overscanCount);
    rowEnd = Math.min(rowCount - 1, rowEnd + overscanCount);
    colStart = Math.max(0, colStart - overscanCount);
    colEnd = Math.min(columnCount - 1, colEnd + overscanCount);

    return { rowStart, rowEnd, colStart, colEnd };
  }, [
    scrollTop,
    scrollLeft,
    height,
    width,
    rowHeight,
    columnWidth,
    rowCount,
    columnCount,
    overscanCount,
  ]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  // Render visible CELLS!
  const cells = [];
  for (let r = range.rowStart; r <= range.rowEnd; r++) {
    for (let c = range.colStart; c <= range.colEnd; c++) {
      const style = {
        position: "absolute",
        top: r * rowHeight,
        left: c * columnWidth,
        height: rowHeight,
        width: columnWidth,
      };
      cells.push(
        children({
          rowIndex: r,
          columnIndex: c,
          style,
          key: `${r}-${c}`,
        }),
      );
    }
  }

  return (
    <div
      onScroll={handleScroll}
      style={{
        position: "relative",
        height,
        width,
        overflow: "auto",
        willChange: "transform",
      }}
    >
      <div
        style={{
          height: totalHeight,
          width: totalWidth,
          position: "relative",
        }}
      >
        {cells}
      </div>
    </div>
  );
}
```

### 13.4 Sử dụng — giống hệt react-window API!

```jsx
// ═══ SỬ DỤNG MINI REACT-WINDOW ═══

// ① FixedSizeList — giống react-window!
const data = Array.from({ length: 10000 }, (_, i) => ({
  name: `User ${i}`,
  email: `user${i}@example.com`,
}));

const Row = ({ index, style }) => (
  <div key={index} style={style} className={index % 2 ? "odd" : "even"}>
    <strong>{data[index].name}</strong>
    <span>{data[index].email}</span>
  </div>
);

function App() {
  return (
    <FixedSizeList
      height={400}
      width={700}
      itemCount={data.length}
      itemSize={35}
      overscanCount={3}
    >
      {Row}
    </FixedSizeList>
  );
}

// ② VariableSizeList!
const getItemSize = (index) => {
  // Mỗi item cao khác nhau!
  return index % 3 === 0 ? 80 : index % 2 === 0 ? 50 : 35;
};

function VariableApp() {
  return (
    <VariableSizeList
      height={400}
      width={700}
      itemCount={10000}
      itemSize={getItemSize}
    >
      {({ index, style }) => (
        <div style={style}>
          Item {index} (h={getItemSize(index)})
        </div>
      )}
    </VariableSizeList>
  );
}

// ③ FixedSizeGrid!
function GridApp() {
  return (
    <FixedSizeGrid
      height={400}
      width={700}
      rowCount={1000}
      columnCount={50}
      rowHeight={40}
      columnWidth={120}
    >
      {({ rowIndex, columnIndex, style }) => (
        <div
          style={{
            ...style,
            border: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          [{rowIndex}, {columnIndex}]
        </div>
      )}
    </FixedSizeGrid>
  );
}
```

### 13.5 Performance Optimizations trong react-window thật

```
TỐI ƯU MÀ REACT-WINDOW THẬT LÀM:
═══════════════════════════════════════════════════════════════

  ① MEMOIZE STYLE OBJECTS:
  ┌────────────────────────────────────────────────────┐
  │ // react-window cache style objects!               │
  │ // → Không tạo object MỚI mỗi render!             │
  │ _getItemStyle(index) {                             │
  │   let style = this._styleCache[index];             │
  │   if (!style) {                                    │
  │     const offset = getOffset(index);               │
  │     const size = getSize(index);                   │
  │     style = {                                      │
  │       position: 'absolute',                        │
  │       top: offset, height: size,                   │
  │       left: 0, width: '100%',                      │
  │     };                                             │
  │     this._styleCache[index] = style;               │
  │   }                                                │
  │   return style;                                    │
  │ }                                                  │
  │ → Tránh unnecessary re-render children!            │
  └────────────────────────────────────────────────────┘

  ② DEBOUNCE SCROLL VỚI RAF:
  ┌────────────────────────────────────────────────────┐
  │ // Không setState MỖI scroll event!                │
  │ // → Batch bằng requestAnimationFrame!             │
  │                                                    │
  │ _onScroll = (e) => {                               │
  │   const scrollTop = e.currentTarget.scrollTop;     │
  │   if (!this._rafHandle) {                          │
  │     this._rafHandle = requestAnimationFrame(() => { │
  │       this.setState({ scrollOffset: scrollTop });  │
  │       this._rafHandle = null;                      │
  │     });                                            │
  │   }                                                │
  │ };                                                 │
  │ → Giới hạn re-render = 60fps max!                 │
  └────────────────────────────────────────────────────┘

  ③ shouldComponentUpdate / React.memo:
  ┌────────────────────────────────────────────────────┐
  │ // Chỉ re-render khi RANGE thay đổi!              │
  │ // Nếu scroll nhỏ chưa đổi range → skip render!  │
  │                                                    │
  │ shouldComponentUpdate(nextProps, nextState) {       │
  │   const { startIndex, endIndex } = getRange(       │
  │     nextState.scrollOffset                         │
  │   );                                               │
  │   return startIndex !== this._startIndex           │
  │     || endIndex !== this._endIndex;                │
  │ }                                                  │
  └────────────────────────────────────────────────────┘

  ④ INSTANCE METHODS:
  ┌────────────────────────────────────────────────────┐
  │ // scrollTo(offset)                                │
  │ // scrollToItem(index, align)                      │
  │ //   align: 'auto'|'smart'|'center'|'start'|'end' │
  │ //                                                 │
  │ // 'smart' = nếu item đã visible → không scroll!  │
  │ //           nếu item gần → scroll ít nhất!        │
  │ //           nếu item xa → scroll vào center!      │
  └────────────────────────────────────────────────────┘
```

### 13.6 Phỏng vấn Deep-Dive: "Viết react-window từ đầu"

> **Mục tiêu**: Giải thích CỰC KỲ chi tiết TỪNG khía cạnh
> để khi interviewer hỏi follow-up → trả lời ngay lập tức!

```
═══════════════════════════════════════════════════════════════
  BƯỚC 1: CẤU TRÚC DOM — TẠI SAO 2 DIV LỒNG NHAU?
═══════════════════════════════════════════════════════════════

  GIẢI THÍCH:
  "Virtual list cần 2 div lồng nhau:
   - OUTER div = viewport, có overflow:auto → tạo scrollbar!
   - INNER div = scroll content, height = totalHeight → tạo scroll space!"

  CẤU TRÚC:
  ┌─ OUTER ──────────────────────────────────────────┐
  │ position: relative                                │
  │ height: 400px          ← kích thước viewport!     │
  │ overflow: auto         ← TẠO SCROLLBAR!           │
  │ will-change: transform ← GPU acceleration!        │
  │                                                   │
  │  ┌─ INNER ────────────────────────────────────┐   │
  │  │ position: relative                          │   │
  │  │ height: 350000px    ← totalHeight!           │   │
  │  │ overflow: hidden    ← ẩn content ngoài!      │   │
  │  │                                              │   │
  │  │  ┌─ ITEM ──────────────────────────────┐    │   │
  │  │  │ position: absolute                   │    │   │
  │  │  │ top: 245px  ← vị trí CHÍNH XÁC!     │    │   │
  │  │  │ height: 35px                          │    │   │
  │  │  │ width: 100%                           │    │   │
  │  │  └──────────────────────────────────────┘    │   │
  │  │                                              │   │
  │  └──────────────────────────────────────────────┘   │
  └──────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "Tại sao overflow: auto mà không phải scroll?"
  A: → auto = CHỈ hiện scrollbar khi content > container!
  → scroll = LUÔN hiện scrollbar (ngay cả khi không cần!)
  → auto tốt hơn cho UX!

  FOLLOW-UP Q: "will-change: transform làm gì?"
  A: → Hint cho browser: "element này SẼ thay đổi transform!"
  → Browser tạo RIÊNG composite layer cho element!
  → Scroll painting xảy ra trên GPU thay vì CPU!
  → CẢNH BÁO: không lạm dụng! Mỗi layer tốn memory!
  → Chỉ dùng cho scroll container, không dùng cho mọi item!

  FOLLOW-UP Q: "overflow: hidden trên inner div để làm gì?"
  A: → Ẩn content tràn ra ngoài inner container!
  → Khi items absolute positioned vượt ra ngoài bounds
     → overflow:hidden không cho chúng hiển thị!
  → NẾU KHÔNG CÓ: items ở edge có thể bị nhìn thấy
     ngoài vùng virtualized, tạo hiệu ứng lạ!

  FOLLOW-UP Q: "Tại sao items dùng position: absolute?"
  A: → absolute cho phép ĐẶT CHÍNH XÁC vị trí bằng top!
  → Không phụ thuộc vào thứ tự DOM!
  → Khi scroll: chỉ cần THAY ĐỔI top, không cần reorder DOM!
  → Nếu dùng static/relative: phải insert/remove DOM nodes
     ĐÚNG THỨ TỰ → expensive DOM operations!
  → absolute + top tính toán = O(1) cho mỗi item!

  FOLLOW-UP Q: "Tại sao không dùng transform: translateY() thay vì top?"
  A: → CẢ HAI đều hoạt động! Nhưng có trade-offs:
  → translateY(): trigger COMPOSITE ONLY (không layout/paint!)
     → Nhanh hơn cho animations!
     → NHƯNG: tạo stacking context mới → z-index affected!
  → top: trigger LAYOUT → PAINT → COMPOSITE
     → Chậm hơn NẾU thay đổi liên tục
     → NHƯNG: chỉ set 1 lần khi item render → không vấn đề!
  → react-window dùng top vì đơn giản hơn!
  → Một số thư viện khác (react-virtuoso) dùng transform!
```

```
═══════════════════════════════════════════════════════════════
  BƯỚC 2: THUẬT TOÁN TÍNH VISIBLE RANGE
═══════════════════════════════════════════════════════════════

  GIẢI THÍCH:
  "Từ scrollTop, tính ra items nào VISIBLE trên viewport.
   FixedSize: phép chia đơn giản O(1).
   VariableSize: binary search O(log n)."

  FIXED SIZE FORMULA — chi tiết:
  ┌────────────────────────────────────────────────────┐
  │ VÍ DỤ: height=400, itemSize=35, scrollTop=245     │
  │                                                    │
  │ // Item đầu tiên BỊ CẮT bởi viewport top          │
  │ startIndex = Math.floor(scrollTop / itemSize)      │
  │            = Math.floor(245 / 35)                  │
  │            = Math.floor(7.0)                       │
  │            = 7                                     │
  │                                                    │
  │ // Số items fit trong viewport                     │
  │ visibleCount = Math.ceil(height / itemSize)        │
  │              = Math.ceil(400 / 35)                 │
  │              = Math.ceil(11.43)                    │
  │              = 12                                  │
  │                                                    │
  │ // Item cuối visible                               │
  │ endIndex = startIndex + visibleCount - 1           │
  │          = 7 + 12 - 1                              │
  │          = 18                                      │
  │                                                    │
  │ // HOẶC tính trực tiếp:                            │
  │ endIndex = Math.ceil((scrollTop + height) / itemSize) - 1  │
  │          = Math.ceil((245 + 400) / 35) - 1         │
  │          = Math.ceil(18.43) - 1                    │
  │          = 19 - 1 = 18                             │
  │                                                    │
  │ → Render items [7..18] = 12 items!                 │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "Tại sao dùng floor cho start và ceil cho end?"
  A: → floor(scrollTop/itemSize):
     scrollTop=245, itemSize=35 → 7.0
     Item 7 bắt đầu ở pixel 245 → CHÍNH XÁC visible!
     NẾU scrollTop=246 → 7.03 → floor = 7
     Item 7 bắt đầu ở 245, ta ở 246 → vẫn thấy 1px của item 7!
     → floor LUÔN trả về item đầu tiên CÓ THỂ visible!

  → ceil((scrollTop+height)/itemSize):
     (245+400)/35 = 18.43
     Item 18 kết thúc ở 18×35+35 = 665
     Viewport bottom = 245+400 = 645
     Item 18 bắt đầu ở 630, kết thúc 665 → visible 15px!
     → ceil BẮT item cuối NẾU nó visible dù chỉ 1px!

  FOLLOW-UP Q: "Khi scrollTop = 0 thì sao?"
  A: → startIndex = floor(0/35) = 0
  → endIndex = ceil(400/35) - 1 = 12 - 1 = 11
  → Render [0..11] = 12 items!
  → Chính xác: 12 × 35 = 420 > 400 (cover hết viewport!)

  FOLLOW-UP Q: "Khi scroll đến CUỐI thì sao?"
  A: → scrollTop = totalHeight - height = 350000 - 400 = 349600
  → startIndex = floor(349600/35) = 9988
  → endIndex = ceil(350000/35) - 1 = 10000 - 1 = 9999
  → Render [9988..9999] = 12 items!
  → CLAMP: endIndex = min(9999, itemCount - 1) = 9999 ✅

  FOLLOW-UP Q: "Nếu itemCount = 0?"
  A: → totalHeight = 0 → inner div height = 0
  → Không có scrollbar!
  → startIndex = 0, endIndex = -1 → loop không chạy!
  → Render empty div! ✅

  FOLLOW-UP Q: "Nếu height > totalHeight (ít items)?"
  A: → Không có scrollbar (content nhỏ hơn viewport!)
  → scrollTop luôn = 0!
  → endIndex = min(ceil(height/itemSize)-1, itemCount-1)
  → Render ALL items! Virtualization tự tắt!
```

```
═══════════════════════════════════════════════════════════════
  BƯỚC 3: OVERSCAN — CHỐNG FLICKERING
═══════════════════════════════════════════════════════════════

  GIẢI THÍCH:
  "Render thêm items PHÍA TRÊN và PHÍA DƯỚI viewport.
   Khi user scroll, items mới ĐÃ SẴN SÀNG trong DOM,
   tránh flash of empty content (flickering)."

  VÍ DỤ overscanCount = 3:
  ┌────────────────────────────────────────────────────┐
  │ overscanStart = max(0, startIndex - 3)             │
  │               = max(0, 7 - 3) = 4                 │
  │                                                    │
  │ overscanEnd = min(itemCount-1, endIndex + 3)       │
  │             = min(9999, 18 + 3) = 21               │
  │                                                    │
  │ TRƯỚC overscan: render [7..18]  = 12 items         │
  │ SAU overscan:   render [4..21]  = 18 items         │
  │                                                    │
  │ Extra: 6 items thêm (3 trên + 3 dưới)             │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "Overscan bao nhiêu là tốt?"
  A: → Quá ít (0-1): flickering khi scroll nhanh!
  → Quá nhiều (10+): render nhiều items → chậm!
  → Sweet spot: 3-5 items!
  → react-window default: overscanCount = 1!
  → react-virtualized default: overscanRowCount = 10!
  → Tùy thuộc item complexity:
     Simple text → overscan = 1 đủ!
     Complex component → overscan = 5+!

  FOLLOW-UP Q: "Overscan có khác nhau khi scroll UP vs DOWN?"
  A: → CÓ! react-window dùng overscan THÔNG MINH:
  → Khi scroll DOWN: overscan NHIỀU phía dưới, ÍT phía trên!
  → Khi scroll UP: overscan NHIỀU phía trên, ÍT phía dưới!
  → Vì user SẼ scroll tiếp CÙNG hướng!

  react-window implementation:
  ┌────────────────────────────────────────────────────┐
  │ if (scrollDirection === 'forward') {               │
  │   overscanBackward = 1;  // phía trên: ít!        │
  │   overscanForward = overscanCount; // dưới: nhiều! │
  │ } else {                                           │
  │   overscanBackward = overscanCount; // trên: nhiều!│
  │   overscanForward = 1; // phía dưới: ít!          │
  │ }                                                  │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "Overscan ảnh hưởng performance thế nào?"
  A: → Thêm 6 items (overscan=3) với item đơn giản → không đáng kể!
  → Thêm 6 items với component phức tạp (charts, images):
     → Mỗi item tốn 5ms render → thêm 30ms!
     → Ở 60fps, budget = 16.67ms → VƯỢT budget!
  → Giải pháp: giảm overscan + optimize item render!

  FOLLOW-UP Q: "Không có overscan thì sao?"
  A: → User scroll 1px:
     Item mới CẦN xuất hiện ở bottom!
     React render → browser paint → composite → display!
     Pipeline này mất ~5-15ms!
     Trong thời gian đó: BLANK SPACE ở bottom! 🚨
     → User thấy flash trắng 1 frame! = FLICKERING!
  → Với overscan: item ĐÃ CÓ trong DOM → hiện NGAY!
```

```
═══════════════════════════════════════════════════════════════
  BƯỚC 4: SCROLL EVENT → RE-RENDER FLOW
═══════════════════════════════════════════════════════════════

  GIẢI THÍCH:
  "Scroll → lấy scrollTop → setState → React re-render →
   useMemo tính range mới → render items mới.
   requestAnimationFrame batch nhiều scroll events."

  FLOW CHI TIẾT:
  ┌────────────────────────────────────────────────────┐
  │ ① User flick ngón tay (mobile) hoặc scroll wheel  │
  │                                                    │
  │ ② Browser fire NHIỀU scroll events:                │
  │    scroll (scrollTop=245)                          │
  │    scroll (scrollTop=248)  ← ~16ms sau             │
  │    scroll (scrollTop=253)  ← ~16ms sau             │
  │    scroll (scrollTop=260)  ← ~16ms sau             │
  │                                                    │
  │ ③ KHÔNG RAF: setState 4 LẦN → 4 re-renders! 🚨   │
  │    CÓ RAF:   setState 1 LẦN (cuối cùng)! ✅      │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "requestAnimationFrame giải quyết gì?"
  A: → Scroll event fire rất NHANH (có thể > 60/s!)
  → Mỗi setState → 1 re-render → 1 React reconciliation!
  → RAF batch: chỉ 1 render per animation frame (60fps)!

  IMPLEMENTATION:
  ┌────────────────────────────────────────────────────┐
  │ // CÁCH 1: RAF debounce (vanilla JS approach)      │
  │ let rafId = null;                                  │
  │                                                    │
  │ onScroll = (e) => {                                │
  │   const scrollTop = e.currentTarget.scrollTop;     │
  │   if (rafId) return; // ← SKIP nếu đang pending!  │
  │                                                    │
  │   rafId = requestAnimationFrame(() => {            │
  │     rafId = null;                                  │
  │     setState({ scrollOffset: scrollTop });         │
  │   });                                              │
  │ };                                                 │
  │                                                    │
  │ // CÁCH 2: Direct setState (react-window thật)     │
  │ // React 18 auto-batches multiple setStates        │
  │ onScroll = (e) => {                                │
  │   setScrollOffset(e.currentTarget.scrollTop);      │
  │ };                                                 │
  │ // React 18 batching → 1 render per frame tự nhiên!│
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "React 18 có cần RAF không?"
  A: → React 18 có AUTOMATIC BATCHING!
  → Multiple setState trong cùng event → 1 render!
  → Scroll event = browser event → auto-batched!
  → NHƯNG: scroll fire rất nhanh, mỗi event = 1 batch!
  → RAF vẫn HỮU ÍCH vì nó skip intermediate events!
  → Event ở 200fps → RAF chỉ chạy 60 lần/s!

  FOLLOW-UP Q: "Tại sao onScroll mà không dùng addEventListener?"
  A: → React onScroll:
     → Dùng SyntheticEvent → event delegation!
     → Tự cleanup khi component unmount!
     → NHƯNG: KHÔNG passive by default trong React!

  → addEventListener({ passive: true }):
     → passive = KHÔNG gọi preventDefault()!
     → Browser BIẾT scroll KHÔNG bị chặn → smooth hơn!
     → PHẢI tự cleanup trong useEffect return!

  → react-window dùng React onScroll vì đơn giản!
  → NẾU cần tối ưu thêm: useEffect + addEventListener!

  FOLLOW-UP Q: "passive: true quan trọng thế nào?"
  A: → Chrome/Firefox block scroll cho đến khi event handler chạy xong!
  → Vì handler CÓ THỂ gọi e.preventDefault() để chặn scroll!
  → passive:true = LỜI HỨA: "tôi KHÔNG gọi preventDefault()"!
  → Browser: "OK, tôi scroll NGAY, không cần đợi handler!"
  → Kết quả: scroll MỀM MỊN hơn nhiều!
  → Chrome 56+: touchstart/touchmove auto passive!
  → scroll event: ĐÃ auto passive (không thể preventDefault)!
```

```
═══════════════════════════════════════════════════════════════
  BƯỚC 5: REACT RECONCILIATION — KEY LÀ GÌ?
═══════════════════════════════════════════════════════════════

  GIẢI THÍCH:
  "React dùng KEY để biết item nào MỚI, item nào CŨ.
   Khi scroll: một số items ra khỏi range → unmount,
   items mới vào range → mount,
   items còn lại → chỉ update style.top."

  VÍ DỤ: scroll từ [4..21] → [7..24]:
  ┌────────────────────────────────────────────────────┐
  │ TRƯỚC:  key=4, key=5, key=6, key=7, ..., key=21   │
  │ SAU:    key=7, key=8, ..., key=21, key=22,23,24   │
  │                                                    │
  │ React diff:                                        │
  │ → key=4: TRƯỚC có, SAU không → UNMOUNT!           │
  │ → key=5: TRƯỚC có, SAU không → UNMOUNT!           │
  │ → key=6: TRƯỚC có, SAU không → UNMOUNT!           │
  │ → key=7..21: CẢ HAI có → UPDATE (style.top)!     │
  │ → key=22: TRƯỚC không, SAU có → MOUNT!            │
  │ → key=23: TRƯỚC không, SAU có → MOUNT!            │
  │ → key=24: TRƯỚC không, SAU có → MOUNT!            │
  │                                                    │
  │ → CHỈ 6 DOM operations! (3 unmount + 3 mount)     │
  │ → 15 items GIỮ NGUYÊN! (chỉ update CSS!)          │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "Tại sao key={index} mà không phải key={data.id}?"
  A: → key={index}:
     Item 7 LUÔN là key=7, dù data thay đổi!
     Khi scroll: key=7 ở cả TRƯỚC và SAU → DOM element REUSE!
     React chỉ update props/style → NHANH!

  → key={data.id}:
     Khi data change (sort, filter): id ĐÃ render → REUSE!
     NHƯNG: khi scroll, id mới chưa từng render → MOUNT MỚI!
     Tỉ lệ reuse THẤP hơn!

  → react-window dùng key={index} vì:
     Scroll = use case CHÍNH → optimize cho scroll!
     Items CÙNG vị trí reuse DOM node!
     NẾU data change → user truyền itemData prop → force re-render!

  FOLLOW-UP Q: "Nếu items có state riêng (input, checkbox)?"
  A: → key={index} SẼ GÂY BUG!
     User nhập text vào Item 7 (key=7)
     Scroll xuống → Item 7 unmount!
     Scroll ngược lên → Item 7 mount LẠI → MẤT TEXT! 🚨

  → GIẢI PHÁP:
     ① Lift state UP! Input value lưu ở parent!
     ② Dùng key={data.id}!
     ③ Dùng external state (Redux, Zustand, Jotai)!
     → Rule: Virtual list items KHÔNG NÊN có local state!

  FOLLOW-UP Q: "React có cần reconcile toàn bộ tree?"
  A: → KHÔNG! React chỉ reconcile CHILDREN của inner div!
  → Outer div: props KHÔNG đổi (height, width) → SKIP!
  → Inner div: props KHÔNG đổi (totalHeight) → SKIP!
  → Children: ARRAY thay đổi → reconcile TỪNG item!
  → Mỗi item: so sánh key + props:
     → key match + props same = NOTHING!
     → key match + style changed = UPDATE style only!
     → key mismatch = MOUNT/UNMOUNT!
```

```
═══════════════════════════════════════════════════════════════
  BƯỚC 6: VARIABLE SIZE — BINARY SEARCH CHI TIẾT
═══════════════════════════════════════════════════════════════

  GIẢI THÍCH:
  "Khi items có height KHÁC nhau, không thể dùng
   floor(scrollTop/itemSize). Cần xây offset array
   và binary search O(log n) tìm startIndex."

  XÂY DỰNG OFFSET ARRAY:
  ┌────────────────────────────────────────────────────┐
  │ itemSize = (index) => [40, 60, 30, 80, 50, 45]    │
  │                                                    │
  │ offsets[0] = 0                                     │
  │ offsets[1] = 0 + 40 = 40      ← top of item 1     │
  │ offsets[2] = 40 + 60 = 100    ← top of item 2     │
  │ offsets[3] = 100 + 30 = 130   ← top of item 3     │
  │ offsets[4] = 130 + 80 = 210   ← top of item 4     │
  │ offsets[5] = 210 + 50 = 260   ← top of item 5     │
  │ offsets[6] = 260 + 45 = 305   ← totalHeight!      │
  │                                                    │
  │ offsets = [0, 40, 100, 130, 210, 260, 305]         │
  │                                                    │
  │ offsets[i] = vị trí TOP của item thứ i!            │
  │ offsets[itemCount] = totalHeight!                  │
  │ itemSize(i) = offsets[i+1] - offsets[i]!           │
  └────────────────────────────────────────────────────┘

  BINARY SEARCH WALKTHROUGH (scrollTop = 155):
  ┌────────────────────────────────────────────────────┐
  │ Tìm: offsets[i] ≤ 155 < offsets[i+1]              │
  │                                                    │
  │ offsets = [0, 40, 100, 130, 210, 260, 305]         │
  │                                                    │
  │ Step 1: lo=0, hi=5                                 │
  │   mid = (0+5)>>>1 = 2                              │
  │   offsets[2]=100, offsets[3]=130                    │
  │   100 ≤ 155? YES, 130 > 155? NO                    │
  │   → 155 > 130 → lo = 3                            │
  │                                                    │
  │ Step 2: lo=3, hi=5                                 │
  │   mid = (3+5)>>>1 = 4                              │
  │   offsets[4]=210, offsets[5]=260                    │
  │   210 ≤ 155? NO                                    │
  │   → hi = 3                                         │
  │                                                    │
  │ Step 3: lo=3, hi=3                                 │
  │   mid = (3+3)>>>1 = 3                              │
  │   offsets[3]=130, offsets[4]=210                    │
  │   130 ≤ 155? YES, 210 > 155? YES!                  │
  │   → FOUND! index = 3! ✅                           │
  │                                                    │
  │ Verification: Item 3 ở [130, 210), 155 ∈ [130,210) │
  │ → 3 steps cho 6 items = O(log₂ 6) ≈ 2.6 → 3 ✅  │
  │ → 10000 items: log₂(10000) ≈ 13 steps! 🚀        │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: ">>> 1 là gì? Tại sao không dùng Math.floor?"
  A: → >>> 1 = unsigned right shift 1 bit = chia 2 làm tròn xuống!
  → Math.floor((lo + hi) / 2) cũng đúng!
  → NHƯNG: (lo + hi) có thể OVERFLOW nếu lo, hi rất lớn!
     lo = 2^31 - 1 + hi = 2^31 - 1 → overflow!
  → (lo + hi) >>> 1 KHÔNG overflow vì unsigned!
  → Performance: bitwise operation NHANH hơn Math.floor!
  → Practical: với itemCount < 2^31 → cả hai đều OK!

  FOLLOW-UP Q: "Nếu itemSize(i) chưa biết trước?"
  A: → CellMeasurer pattern:
     ① Dùng estimatedItemSize cho items CHƯA ĐO!
     ② Render → getBoundingClientRect() → đo height thật!
     ③ Cache vào CellMeasurerCache!
     ④ Recalc offset array với height mới!
     ⑤ Re-render với positions chính xác!
     → Render 2 LẦN! Trade-off: accuracy vs performance!

  FOLLOW-UP Q: "Offset array tốn bao nhiêu memory?"
  A: → 10,000 items × 8 bytes (Float64) = 80KB!
  → 100,000 items = 800KB!
  → 1,000,000 items = 8MB! → CẦN CÂN NHẮC!
  → Giải pháp: dùng lazy calculation!
     Chỉ tính offsets KHI CẦN (trong viewport + overscan)!
     Cache kết quả cho lần sau!
```

```
═══════════════════════════════════════════════════════════════
  BƯỚC 7: STYLE CACHING — TẠI SAO QUAN TRỌNG?
═══════════════════════════════════════════════════════════════

  GIẢI THÍCH:
  "Mỗi item cần 1 style object. Nếu tạo MỚI mỗi render,
   React so sánh object reference → KHÁC → re-render child!
   Cache style → CÙNG reference → skip re-render child!"

  VẤN ĐỀ: KHÔNG cache style
  ┌────────────────────────────────────────────────────┐
  │ // ❌ BÀI: Tạo style MỚI mỗi render!             │
  │ for (let i = start; i <= end; i++) {               │
  │   const style = {                                  │
  │     position: 'absolute',                          │
  │     top: i * 35,                                   │
  │     height: 35,                                    │
  │   };                                               │
  │   // style = object MỚI mỗi lần!                  │
  │   // → React: prevStyle !== nextStyle = true!      │
  │   // → Re-render Row component! 🚨                 │
  │ }                                                  │
  │                                                    │
  │ // ✅ TỐT: Cache style objects!                    │
  │ const styleCache = useRef({});                     │
  │                                                    │
  │ for (let i = start; i <= end; i++) {               │
  │   if (!styleCache.current[i]) {                    │
  │     styleCache.current[i] = {                      │
  │       position: 'absolute',                        │
  │       top: i * 35,                                 │
  │       height: 35,                                  │
  │     };                                             │
  │   }                                                │
  │   // styleCache.current[i] = CÙNG reference!      │
  │   // → React: prevStyle === nextStyle = true!      │
  │   // → Skip re-render! ✅                          │
  │ }                                                  │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "Style cache có bị memory leak?"
  A: → CÓ NẾU không cleanup!
  → Cache tích lũy: user scroll qua 10000 items → 10000 cache entries!
  → GIẢI PHÁP: LRU cache — giới hạn N entries!
  → react-window: cache TẤT CẢ (chấp nhận vì object nhỏ)!
     10000 × ~100 bytes = ~1MB → chấp nhận được!
  → Invalidate cache khi: itemSize thay đổi, resize!

  FOLLOW-UP Q: "React.memo có giúp gì không?"
  A: → CÓ! React.memo wrapper cho Row component:
  ┌────────────────────────────────────────────────────┐
  │ const Row = React.memo(({ index, style, data }) => │
  │   <div style={style}>{data[index].name}</div>      │
  │ );                                                 │
  │                                                    │
  │ // React.memo: shallow compare props!              │
  │ // NẾU style cached (same ref):                    │
  │ //   prevProps.style === nextProps.style → SKIP!   │
  │ // NẾU index unchanged:                            │
  │ //   prevProps.index === nextProps.index → SKIP!   │
  │ → Items CÙNG index + style = NO re-render! ✅     │
  └────────────────────────────────────────────────────┘
  → react-window khuyến khích LUÔN dùng React.memo cho Row!
  → itemData prop: pass data riêng, thay đổi → re-render TẤT CẢ!
     → Nên dùng useRef hoặc stable reference cho itemData!
```

```
═══════════════════════════════════════════════════════════════
  BƯỚC 8: SCROLL TO INDEX — SMART ALIGNMENT
═══════════════════════════════════════════════════════════════

  GIẢI THÍCH:
  "scrollToItem(index, align) set scrollTop để item
   xuất hiện ở vị trí mong muốn. 'smart' alignment
   tự chọn vị trí tối ưu dựa trên current scroll."

  5 ALIGN MODES:
  ┌────────────────────────────────────────────────────┐
  │ 'start':  item ở TOP viewport!                     │
  │   scrollTop = offsets[index]                        │
  │                                                    │
  │ 'end':    item ở BOTTOM viewport!                  │
  │   scrollTop = offsets[index] + itemSize - height    │
  │                                                    │
  │ 'center': item ở GIỮA viewport!                    │
  │   scrollTop = offsets[index] - height/2 + itemSize/2│
  │                                                    │
  │ 'auto':   scroll ÍT NHẤT có thể!                   │
  │   if (item TRÊN viewport) → scroll lên = 'start'!  │
  │   if (item DƯỚI viewport) → scroll xuống = 'end'!  │
  │   if (item ĐÃ visible) → KHÔNG scroll!            │
  │                                                    │
  │ 'smart':  TỰ CHỌN align tốt nhất!                  │
  │   if (item VISIBLE) → KHÔNG scroll!                │
  │   if (item GẦN = < 1 screen away) → 'auto'!       │
  │   if (item XA = > 1 screen away) → 'center'!      │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "'smart' khác 'auto' thế nào?"
  A: → 'auto': luôn scroll ÍT NHẤT, item ở edge viewport!
  → 'smart': nếu item XA → scroll vào CENTER!
     Lý do: user muốn THẤY context xung quanh item!
     Nếu item ở edge → chỉ thấy 1 phía!
  → 'smart' là DEFAULT trong react-window!
```

```
═══════════════════════════════════════════════════════════════
  BƯỚC 9: EDGE CASES & PITFALLS
═══════════════════════════════════════════════════════════════

  ① RESIZE WINDOW:
  ┌────────────────────────────────────────────────────┐
  │ Window resize → viewport height/width thay đổi!   │
  │ → visibleCount thay đổi → range thay đổi!         │
  │ → CẦN re-render!                                  │
  │                                                    │
  │ GIẢI PHÁP: AutoSizer + ResizeObserver!             │
  │ → Detect size change → update height/width props!  │
  │ → react-window: user tự handle (hoặc AutoSizer)!  │
  └────────────────────────────────────────────────────┘

  ② SCROLL RESTORATION:
  ┌────────────────────────────────────────────────────┐
  │ User navigate away → quay lại → muốn ĐÚng vị trí!│
  │ → Lưu scrollOffset khi leave!                     │
  │ → Restore scrollOffset khi mount!                  │
  │ → this.outerRef.scrollTop = savedOffset!           │
  │ → react-window: initialScrollOffset prop!          │
  └────────────────────────────────────────────────────┘

  ③ DYNAMIC ITEM COUNT (load more):
  ┌────────────────────────────────────────────────────┐
  │ itemCount thay đổi → totalHeight thay đổi!        │
  │ → Inner div height update!                         │
  │ → Offset array recalculate (variable size)!        │
  │ → Style cache INVALIDATE (variable size)!          │
  │ → react-window: tự handle khi props change!       │
  └────────────────────────────────────────────────────┘

  ④ RTL (Right-to-Left) SUPPORT:
  ┌────────────────────────────────────────────────────┐
  │ direction="rtl" → scrollLeft logic NGƯỢC!          │
  │ → Chrome: scrollLeft = 0 ở RIGHT edge              │
  │ → Firefox: scrollLeft = NEGATIVE!                  │
  │ → react-window normalize scrollLeft cho RTL!       │
  └────────────────────────────────────────────────────┘

  ⑤ KEYBOARD ACCESSIBILITY:
  ┌────────────────────────────────────────────────────┐
  │ Tab + Arrow keys phải hoạt động!                   │
  │ → Items NGOÀI range KHÔNG CÓ TRONG DOM!           │
  │ → User Tab → focus gì? 🚨                         │
  │                                                    │
  │ GIẢI PHÁP:                                         │
  │ → tabIndex=0 trên outer container!                │
  │ → Manage focus với onKeyDown!                     │
  │ → ArrowDown: scrollToItem(focusedIndex + 1)!      │
  │ → ArrowUp: scrollToItem(focusedIndex - 1)!        │
  │ → react-virtualized: ArrowKeyStepper component!   │
  └────────────────────────────────────────────────────┘

  ⑥ SEARCH/FILTER:
  ┌────────────────────────────────────────────────────┐
  │ User filter: itemCount 10000 → 500!                │
  │ → totalHeight collapse → scrollbar NHẢY!          │
  │ → scrollTop có thể > new totalHeight!             │
  │ → CẦN clamp scrollTop: min(scrollTop, newTotal)!  │
  │ → react-window: tự handle khi itemCount thay đổi! │
  └────────────────────────────────────────────────────┘
```

```
═══════════════════════════════════════════════════════════════
  BƯỚC 10: PERFORMANCE PROFILING
═══════════════════════════════════════════════════════════════

  LÀM SAO ĐO PERFORMANCE CỦA VIRTUAL LIST?

  ① Chrome DevTools Performance tab:
  ┌────────────────────────────────────────────────────┐
  │ 1. Open Performance tab                            │
  │ 2. Start recording                                 │
  │ 3. Scroll list nhanh                               │
  │ 4. Stop recording                                  │
  │                                                    │
  │ XEM:                                               │
  │ → Scripting time (scroll handler + React render)   │
  │ → Rendering time (browser layout)                  │
  │ → Painting time (browser paint)                    │
  │ → Frame rate (should be ~60fps)                    │
  │ → Long tasks (> 50ms = jank!)                      │
  └────────────────────────────────────────────────────┘

  ② React DevTools Profiler:
  ┌────────────────────────────────────────────────────┐
  │ → Commit durations                                 │
  │ → Which components re-rendered?                    │
  │ → WHY did they re-render?                          │
  │ → Flamegraph: visual cost breakdown!               │
  └────────────────────────────────────────────────────┘

  ③ Custom metrics:
  ┌────────────────────────────────────────────────────┐
  │ performance.mark('scroll-start');                  │
  │ // ... scroll handler + render                     │
  │ performance.mark('scroll-end');                    │
  │ performance.measure('scroll', 'scroll-start',     │
  │   'scroll-end');                                   │
  │                                                    │
  │ TARGET METRICS:                                    │
  │ → Scroll handler: < 2ms ✅                        │
  │ → React render: < 5ms ✅                          │
  │ → Total frame: < 16.67ms (60fps) ✅              │
  │ → DOM nodes: < 50 ✅                              │
  │ → Memory: < 10MB ✅                               │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "Nếu scroll vẫn giật?"
  A: → Check:
  ① Item component quá complex? → Simplify!
  ② Overscan quá lớn? → Giảm xuống!
  ③ Style objects tạo mới mỗi render? → Cache!
  ④ Inline functions trong render? → useCallback!
  ⑤ Large images trong items? → Lazy load!
  ⑥ CSS box-shadow, border-radius? → will-change!
  ⑦ React DevTools: which component re-renders?
  ⑧ Chrome Performance: long tasks ở đâu?
```

```
═══════════════════════════════════════════════════════════════
  TÓM TẮT — FRAMEWORK TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  "Để viết react-window từ đầu, tôi cần:"

  ① DOM: 2 div lồng nhau (outer=viewport, inner=scrollSpace)
  ② ALGORITHM: floor(scrollTop/itemSize) → startIndex
  ③ OVERSCAN: ±3 items chống flickering
  ④ SCROLL: onScroll → setState(scrollOffset) → re-render
  ⑤ RENDER: absolute positioning, top = index × itemSize
  ⑥ KEYS: key={index} cho React reconciliation
  ⑦ VARIABLE: offset array + binary search O(log n)
  ⑧ PERFORMANCE: style caching, RAF debounce, React.memo
  ⑨ EDGE CASES: resize, RTL, accessibility, scroll restore
  ⑩ PROFILING: React Profiler + Chrome DevTools + 60fps target

  → "Tôi có thể viết code demo NGAY nếu cần!"
```

---

## §14. Mini react-virtualized — Tự viết Full-Featured Library

> **Mục tiêu**: Viết lại react-virtualized từ đầu — thư viện ĐẦY ĐỦ hơn react-window!
> Bao gồm: **Table**, **Collection**, **Masonry**, **WindowScroller**, **CellMeasurer**
> Giải thích kiến trúc + flow chi tiết để phỏng vấn!

```

KIẾN TRÚC react-virtualized vs react-window:
═══════════════════════════════════════════════════════════════

react-window (5.4KB): react-virtualized (34.7KB):
┌──────────────┐ ┌──────────────────────────┐
│ FixedSizeList│ │ List │
│ VariableList │ │ Grid (core) │
│ FixedSizeGrid│ │ Table ← header + body! │
│ VariableGrid │ │ Collection ← 2D tự do! │
└──────────────┘ │ Masonry ← Pinterest! │
│ WindowScroller │
│ AutoSizer │
│ CellMeasurer │
│ ScrollSync │
│ InfiniteLoader │
│ ArrowKeyStepper │
│ MultiGrid │
└──────────────────────────┘

DEPENDENCY TREE:
┌─────────────────────────────────────────────────────────┐
│ Grid (BASE) │
│ │ │
│ ┌───────────┼───────────┐ │
│ ▼ ▼ ▼ │
│ List Table Collection │
│ │ │ │ │
│ ▼ │ ▼ │
│ WindowScroller │ Masonry │
│ │ │
│ ┌─────┼─────┐ │
│ ▼ ▼ ▼ │
│ Header Body ScrollSync │
│ │
│ ┌─────────────────────────────────────┐ │
│ │ AutoSizer CellMeasurer │ ← Utils │
│ │ InfiniteLoader ArrowKeyStepper │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

CORE CONCEPT — Grid là NỀN TẢNG:
→ List = Grid với 1 column!
→ Table = Grid + sticky header row!
→ Collection = Grid nhưng items TỰ DO vị trí!
→ Masonry = Collection + auto-placement algorithm!

```

### 14.1 Grid — Base Component (nền tảng!)

```jsx
// ═══ MINI REACT-VIRTUALIZED: Grid ═══
// Đây là CORE — mọi component khác kế thừa từ đây!

import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from "react";

function Grid({
  // Dimensions
  width,
  height,
  rowCount,
  columnCount,
  rowHeight, // number | (index) => number
  columnWidth, // number | (index) => number
  // Rendering
  cellRenderer, // ({ columnIndex, rowIndex, key, style }) => ReactNode
  overscanRowCount = 3,
  overscanColumnCount = 3,
  // Scroll
  scrollTop: scrollTopProp,
  scrollLeft: scrollLeftProp,
  onScroll,
  // Performance
  className,
  style: outerStyle,
}) {
  const [scrollState, setScrollState] = useState({
    scrollTop: scrollTopProp || 0,
    scrollLeft: scrollLeftProp || 0,
  });
  const outerRef = useRef(null);
  const styleCache = useRef({}); // ← CACHE style objects!

  // ① TÍNH OFFSETS cho rows và columns!
  const rowOffsets = useMemo(() => {
    const offsets = [0];
    for (let i = 0; i < rowCount; i++) {
      const h =
        typeof rowHeight === "function" ? rowHeight({ index: i }) : rowHeight;
      offsets.push(offsets[i] + h);
    }
    return offsets;
  }, [rowCount, rowHeight]);

  const colOffsets = useMemo(() => {
    const offsets = [0];
    for (let i = 0; i < columnCount; i++) {
      const w =
        typeof columnWidth === "function"
          ? columnWidth({ index: i })
          : columnWidth;
      offsets.push(offsets[i] + w);
    }
    return offsets;
  }, [columnCount, columnWidth]);

  const totalHeight = rowOffsets[rowCount];
  const totalWidth = colOffsets[columnCount];

  // ② BINARY SEARCH — tìm index từ offset!
  const findIndex = useCallback((offsets, offset, count) => {
    let lo = 0,
      hi = count - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (offsets[mid] <= offset && offsets[mid + 1] > offset) return mid;
      if (offsets[mid] < offset) lo = mid + 1;
      else hi = mid - 1;
    }
    return Math.min(Math.max(0, lo), count - 1);
  }, []);

  // ③ TÍNH VISIBLE RANGE 2D!
  const range = useMemo(() => {
    const { scrollTop, scrollLeft } = scrollState;

    let rowStart = findIndex(rowOffsets, scrollTop, rowCount);
    let rowEnd = findIndex(rowOffsets, scrollTop + height, rowCount);
    let colStart = findIndex(colOffsets, scrollLeft, columnCount);
    let colEnd = findIndex(colOffsets, scrollLeft + width, columnCount);

    // Overscan!
    rowStart = Math.max(0, rowStart - overscanRowCount);
    rowEnd = Math.min(rowCount - 1, rowEnd + overscanRowCount);
    colStart = Math.max(0, colStart - overscanColumnCount);
    colEnd = Math.min(columnCount - 1, colEnd + overscanColumnCount);

    return { rowStart, rowEnd, colStart, colEnd };
  }, [
    scrollState,
    height,
    width,
    rowOffsets,
    colOffsets,
    rowCount,
    columnCount,
    overscanRowCount,
    overscanColumnCount,
    findIndex,
  ]);

  // ④ SCROLL HANDLER với RAF debounce!
  const rafRef = useRef(null);
  const handleScroll = useCallback(
    (e) => {
      const target = e.currentTarget;
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const newState = {
          scrollTop: target.scrollTop,
          scrollLeft: target.scrollLeft,
        };
        setScrollState(newState);

        if (onScroll) {
          onScroll({
            scrollTop: target.scrollTop,
            scrollLeft: target.scrollLeft,
            clientHeight: target.clientHeight,
            clientWidth: target.clientWidth,
            scrollHeight: target.scrollHeight,
            scrollWidth: target.scrollWidth,
          });
        }
      });
    },
    [onScroll],
  );

  // Cleanup RAF!
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ⑤ RENDER CELLS với STYLE CACHING!
  const cells = [];
  for (let rowIndex = range.rowStart; rowIndex <= range.rowEnd; rowIndex++) {
    for (let colIndex = range.colStart; colIndex <= range.colEnd; colIndex++) {
      const key = `${rowIndex}-${colIndex}`;

      // Cache style để tránh re-create objects!
      if (!styleCache.current[key]) {
        const rh =
          typeof rowHeight === "function"
            ? rowHeight({ index: rowIndex })
            : rowHeight;
        const cw =
          typeof columnWidth === "function"
            ? columnWidth({ index: colIndex })
            : columnWidth;

        styleCache.current[key] = {
          position: "absolute",
          top: rowOffsets[rowIndex],
          left: colOffsets[colIndex],
          height: rh,
          width: cw,
        };
      }

      cells.push(
        cellRenderer({
          columnIndex: colIndex,
          rowIndex,
          key,
          style: styleCache.current[key],
          isScrolling: false,
        }),
      );
    }
  }

  return (
    <div
      ref={outerRef}
      className={className}
      onScroll={handleScroll}
      style={{
        position: "relative",
        height,
        width,
        overflow: "auto",
        willChange: "transform",
        WebkitOverflowScrolling: "touch", // ← iOS smooth scroll!
        ...outerStyle,
      }}
    >
      <div
        style={{
          height: totalHeight,
          width: totalWidth,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {cells}
      </div>
    </div>
  );
}
```

```
GRID FLOW — NỀN TẢNG CỦA MỌI COMPONENT:
═══════════════════════════════════════════════════════════════

  Props: rowCount, columnCount, rowHeight, columnWidth
       │
       ▼
  ① Tính offset arrays (cumulative):
  ┌─────────────────────────────────────┐
  │ rowOffsets = [0, 35, 70, 105, ...]  │
  │ colOffsets = [0, 150, 300, 450, ...]│
  │ totalHeight = rowOffsets[rowCount]   │
  │ totalWidth  = colOffsets[colCount]   │
  └─────────────────────────────────────┘
       │
       ▼
  ② Binary search tìm visible range:
  ┌─────────────────────────────────────┐
  │ scrollTop=245 → rowStart=7          │
  │ scrollTop+height → rowEnd=18        │
  │ scrollLeft=0 → colStart=0           │
  │ scrollLeft+width → colEnd=4         │
  │ + overscan → [4..21] × [0..7]       │
  └─────────────────────────────────────┘
       │
       ▼
  ③ Double for loop render cells:
  ┌─────────────────────────────────────┐
  │ for (row = 4..21)                   │
  │   for (col = 0..7)                  │
  │     style = cache[key] || compute() │
  │     cellRenderer({ rowIndex, ... }) │
  └─────────────────────────────────────┘
       │
       ▼
  ④ React reconcile → Browser paint!
```

### 14.2 List — Grid wrapper 1 cột

```jsx
// ═══ List = Grid với 1 column! ═══

function List({
  width,
  height,
  rowCount,
  rowHeight, // number | ({ index }) => number
  rowRenderer, // ({ index, key, style }) => ReactNode
  overscanRowCount = 10,
  onScroll,
  scrollToIndex,
  scrollTop,
}) {
  // List CHỈ LÀ Grid với columnCount=1!
  return (
    <Grid
      width={width}
      height={height}
      rowCount={rowCount}
      columnCount={1}
      rowHeight={rowHeight}
      columnWidth={() => width} // ← Full width!
      overscanRowCount={overscanRowCount}
      overscanColumnCount={0}
      onScroll={onScroll}
      scrollTop={scrollTop}
      cellRenderer={({ rowIndex, key, style }) =>
        // Map Grid's cellRenderer → List's rowRenderer!
        rowRenderer({
          index: rowIndex,
          key,
          style,
          isScrolling: false,
        })
      }
    />
  );
}
```

```
LIST vs GRID — RELATIONSHIP:
═══════════════════════════════════════════════════════════════

  List = Grid + những thay đổi sau:
  ┌────────────────────────────────────────────────────┐
  │ columnCount = 1 (luôn luôn!)                       │
  │ columnWidth = width (full width!)                  │
  │ overscanColumnCount = 0 (không cần!)               │
  │ cellRenderer → rowRenderer (đổi tên!)              │
  │                                                    │
  │ → Đây là lý do react-virtualized lớn hơn          │
  │   react-window: CẤU TRÚC KẾ THỪA!               │
  │   Mọi thứ build trên Grid base!                   │
  └────────────────────────────────────────────────────┘
```

### 14.3 Table — Grid + Sticky Header

```jsx
// ═══ Table = Grid + Header row cố định! ═══

function Table({
  width,
  height,
  headerHeight = 40,
  rowCount,
  rowHeight,
  rowGetter, // ({ index }) => rowData
  headerRowRenderer, // Optional custom header
  children, // <Column> elements!
  onScroll,
  overscanRowCount = 10,
  disableHeader = false,
}) {
  // ① Parse Column definitions từ children!
  const columns = React.Children.toArray(children).map((child) => ({
    label: child.props.label,
    dataKey: child.props.dataKey,
    width: child.props.width,
    flexGrow: child.props.flexGrow || 0,
    cellRenderer: child.props.cellRenderer,
    headerRenderer: child.props.headerRenderer,
  }));

  // ② Tính column widths (flex layout!)
  const totalFixed = columns.reduce((sum, c) => sum + c.width, 0);
  const remaining = width - totalFixed;
  const totalFlex = columns.reduce((sum, c) => sum + c.flexGrow, 0);

  const resolvedWidths = columns.map((col) => {
    if (totalFlex > 0 && col.flexGrow > 0) {
      return col.width + (remaining * col.flexGrow) / totalFlex;
    }
    return col.width;
  });

  // ③ Column offsets!
  const colOffsets = [0];
  resolvedWidths.forEach((w, i) => {
    colOffsets.push(colOffsets[i] + w);
  });

  // ④ RENDER HEADER (sticky!)
  const renderHeader = () => {
    if (disableHeader) return null;

    return (
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          height: headerHeight,
          width: "100%",
          display: "flex",
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #ddd",
        }}
      >
        {columns.map((col, i) => (
          <div
            key={col.dataKey}
            style={{
              width: resolvedWidths[i],
              display: "flex",
              alignItems: "center",
              padding: "0 8px",
              fontWeight: "bold",
            }}
          >
            {col.headerRenderer
              ? col.headerRenderer({ label: col.label, dataKey: col.dataKey })
              : col.label}
          </div>
        ))}
      </div>
    );
  };

  // ⑤ RENDER BODY (virtualized!)
  const bodyHeight = height - (disableHeader ? 0 : headerHeight);

  return (
    <div style={{ width, height, overflow: "hidden" }}>
      {renderHeader()}

      <Grid
        width={width}
        height={bodyHeight}
        rowCount={rowCount}
        columnCount={columns.length}
        rowHeight={rowHeight}
        columnWidth={({ index }) => resolvedWidths[index]}
        overscanRowCount={overscanRowCount}
        onScroll={onScroll}
        cellRenderer={({ columnIndex, rowIndex, key, style }) => {
          const rowData = rowGetter({ index: rowIndex });
          const col = columns[columnIndex];
          const cellData = rowData[col.dataKey];

          return (
            <div
              key={key}
              style={{
                ...style,
                display: "flex",
                alignItems: "center",
                padding: "0 8px",
                borderBottom: "1px solid #eee",
              }}
            >
              {col.cellRenderer
                ? col.cellRenderer({
                    cellData,
                    rowData,
                    rowIndex,
                    columnIndex,
                    dataKey: col.dataKey,
                  })
                : String(cellData)}
            </div>
          );
        }}
      />
    </div>
  );
}

// Column component (chỉ là config, không render!)
function Column(props) {
  return null; // ← Declarative config pattern!
}

// ═══ SỬ DỤNG TABLE ═══
const users = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `User ${i}`,
  email: `user${i}@example.com`,
  role: i % 3 === 0 ? "Admin" : "User",
}));

function TableApp() {
  return (
    <Table
      width={800}
      height={500}
      headerHeight={40}
      rowCount={users.length}
      rowHeight={35}
      rowGetter={({ index }) => users[index]}
    >
      <Column label="ID" dataKey="id" width={60} />
      <Column label="Name" dataKey="name" width={200} flexGrow={1} />
      <Column label="Email" dataKey="email" width={300} flexGrow={1} />
      <Column
        label="Role"
        dataKey="role"
        width={100}
        cellRenderer={({ cellData }) => (
          <span
            style={{
              color: cellData === "Admin" ? "#e74c3c" : "#3498db",
              fontWeight: cellData === "Admin" ? "bold" : "normal",
            }}
          >
            {cellData}
          </span>
        )}
      />
    </Table>
  );
}
```

```
TABLE FLOW — HEADER + VIRTUALIZED BODY:
═══════════════════════════════════════════════════════════════

  <Table>
    <Column label="ID" dataKey="id" width={60} />
    <Column label="Name" dataKey="name" width={200} />
  </Table>
       │
       ▼
  ① Parse children → column configs:
  ┌────────────────────────────────────────────────────┐
  │ columns = [                                        │
  │   { label:'ID', dataKey:'id', width:60 },          │
  │   { label:'Name', dataKey:'name', width:200 },     │
  │ ]                                                  │
  └────────────────────────────────────────────────────┘
       │
       ▼
  ② Tính flex widths:
  ┌────────────────────────────────────────────────────┐
  │ totalFixed = 60 + 200 = 260                        │
  │ remaining = 800 - 260 = 540                        │
  │ flexGrow phân bổ remaining cho columns!            │
  └────────────────────────────────────────────────────┘
       │
       ▼
  ③ Render 2 phần:
  ┌────────────────────────────────────────────────────┐
  │ HEADER (sticky, không virtualize!)                 │
  │ ┌──────┬──────────┬──────────────┬────────┐        │
  │ │ ID   │ Name     │ Email        │ Role   │        │
  │ └──────┴──────────┴──────────────┴────────┘        │
  │                                                    │
  │ BODY (virtualized Grid!)                           │
  │ ┌──────┬──────────┬──────────────┬────────┐        │
  │ │ 0    │ User 0   │ u0@e.com     │ Admin  │        │
  │ │ 1    │ User 1   │ u1@e.com     │ User   │        │
  │ │ ...  │ ...      │ ...          │ ...    │        │
  │ └──────┴──────────┴──────────────┴────────┘        │
  └────────────────────────────────────────────────────┘

  KEY INSIGHT:
  → Header LUÔN hiển thị (sticky!)
  → Body VIRTUALIZED (chỉ render visible rows!)
  → Column component = DECLARATIVE CONFIG (không render gì!)
  → Đây là pattern "children as configuration"!
```

### 14.4 Collection — Vị trí tự do (2D)

```jsx
// ═══ Collection — Items ở vị trí BẤT KỲ! ═══
// Không grid đều, mỗi item có position + size riêng!

function Collection({
  width,
  height,
  cellCount,
  cellRenderer, // ({ index, key, style }) => ReactNode
  cellSizeAndPositionGetter, // ({ index }) => { x, y, width, height }
  onScroll,
}) {
  const [scrollState, setScrollState] = useState({
    scrollTop: 0,
    scrollLeft: 0,
  });

  // ① Tính size + position CHO TỪNG CELL!
  const cellMetadata = useMemo(() => {
    const data = [];
    let maxRight = 0;
    let maxBottom = 0;

    for (let i = 0; i < cellCount; i++) {
      const info = cellSizeAndPositionGetter({ index: i });
      data.push(info);
      maxRight = Math.max(maxRight, info.x + info.width);
      maxBottom = Math.max(maxBottom, info.y + info.height);
    }

    return { cells: data, totalWidth: maxRight, totalHeight: maxBottom };
  }, [cellCount, cellSizeAndPositionGetter]);

  // ② Sector Map — chia viewport thành SECTORS!
  // O(1) lookup thay vì O(n) tìm visible cells!
  const SECTOR_SIZE = 100; // 100px × 100px sectors

  const sectorMap = useMemo(() => {
    const map = new Map();

    cellMetadata.cells.forEach((cell, index) => {
      // Cell overlap sectors nào?
      const sectorRowStart = Math.floor(cell.y / SECTOR_SIZE);
      const sectorRowEnd = Math.floor((cell.y + cell.height) / SECTOR_SIZE);
      const sectorColStart = Math.floor(cell.x / SECTOR_SIZE);
      const sectorColEnd = Math.floor((cell.x + cell.width) / SECTOR_SIZE);

      for (let r = sectorRowStart; r <= sectorRowEnd; r++) {
        for (let c = sectorColStart; c <= sectorColEnd; c++) {
          const key = `${r},${c}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key).push(index);
        }
      }
    });

    return map;
  }, [cellMetadata]);

  // ③ TÌM VISIBLE CELLS bằng sector lookup!
  const visibleIndices = useMemo(() => {
    const { scrollTop, scrollLeft } = scrollState;
    const indices = new Set();

    const sectorRowStart = Math.floor(scrollTop / SECTOR_SIZE);
    const sectorRowEnd = Math.floor((scrollTop + height) / SECTOR_SIZE);
    const sectorColStart = Math.floor(scrollLeft / SECTOR_SIZE);
    const sectorColEnd = Math.floor((scrollLeft + width) / SECTOR_SIZE);

    for (let r = sectorRowStart; r <= sectorRowEnd; r++) {
      for (let c = sectorColStart; c <= sectorColEnd; c++) {
        const key = `${r},${c}`;
        const cellsInSector = sectorMap.get(key);
        if (cellsInSector) {
          cellsInSector.forEach((i) => indices.add(i));
        }
      }
    }

    return [...indices];
  }, [scrollState, height, width, sectorMap]);

  const handleScroll = useCallback((e) => {
    setScrollState({
      scrollTop: e.currentTarget.scrollTop,
      scrollLeft: e.currentTarget.scrollLeft,
    });
  }, []);

  // ④ RENDER visible cells!
  const cells = visibleIndices.map((index) => {
    const { x, y, width: w, height: h } = cellMetadata.cells[index];
    const style = {
      position: "absolute",
      top: y,
      left: x,
      width: w,
      height: h,
    };
    return cellRenderer({ index, key: `cell-${index}`, style });
  });

  return (
    <div
      onScroll={handleScroll}
      style={{
        position: "relative",
        height,
        width,
        overflow: "auto",
      }}
    >
      <div
        style={{
          height: cellMetadata.totalHeight,
          width: cellMetadata.totalWidth,
          position: "relative",
        }}
      >
        {cells}
      </div>
    </div>
  );
}
```

```
COLLECTION — SECTOR MAP ALGORITHM:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: Items ở vị trí BẤT KỲ!
  → Không thể dùng floor(scrollTop/itemHeight) như Grid!
  → Phải check TỪNG item xem có visible không? → O(n)! 🚨

  GIẢI PHÁP: SECTOR MAP!
  → Chia canvas thành ô 100×100px!
  → Mỗi ô biết nó chứa items nào!
  → Scroll → chỉ check ô visible → O(1) lookup!

  ┌────┬────┬────┬────┬────┐
  │ S0 │ S1 │ S2 │ S3 │ S4 │  ← Sectors (100×100px)
  ├────┼────┼────┼────┼────┤
  │ S5 │████│████│ S8 │ S9 │
  ├────┼████┼────┼────┼────┤  ████ = VIEWPORT
  │S10 │████│████│S13 │S14 │
  ├────┼────┼────┼────┼────┤
  │S15 │S16 │S17 │S18 │S19 │
  └────┴────┴────┴────┴────┘

  sectorMap = {
    "1,1": [0, 3, 7],    ← items trong sector (1,1)
    "1,2": [1, 3],       ← items trong sector (1,2)
    "2,1": [3, 5, 9],    ← items trong sector (2,1)
    "2,2": [2, 4, 9],    ← items trong sector (2,2)
    ...
  }

  Viewport covers sectors [1,1] → [2,2]
  → visibleIndices = {0, 1, 2, 3, 4, 5, 7, 9}
  → Chỉ render 8 items thay vì 10000! ✅
```

### 14.5 Masonry — Pinterest Layout

```jsx
// ═══ Masonry = Collection + Auto-placement! ═══
// Items được xếp tự động theo cột NGẮN NHẤT!

function Masonry({
  width,
  height,
  columnCount = 3,
  gutterSize = 10,
  cellCount,
  cellMeasurerCache, // CellMeasurerCache instance!
  cellRenderer,
  overscanByPixels = 200,
}) {
  // ① Tính column width!
  const totalGutter = gutterSize * (columnCount - 1);
  const colWidth = (width - totalGutter) / columnCount;

  // ② PLACEMENT ALGORITHM — xếp vào cột NGẮN NHẤT!
  const layout = useMemo(() => {
    const columnHeights = new Array(columnCount).fill(0);
    const positions = [];

    for (let i = 0; i < cellCount; i++) {
      // Tìm cột NGẮN NHẤT!
      let shortestCol = 0;
      for (let c = 1; c < columnCount; c++) {
        if (columnHeights[c] < columnHeights[shortestCol]) {
          shortestCol = c;
        }
      }

      const x = shortestCol * (colWidth + gutterSize);
      const y = columnHeights[shortestCol];
      const h = cellMeasurerCache ? cellMeasurerCache.get(i) : 200; // default height

      positions.push({ x, y, width: colWidth, height: h });

      // Cập nhật column height!
      columnHeights[shortestCol] += h + gutterSize;
    }

    const totalHeight = Math.max(...columnHeights);
    return { positions, totalHeight };
  }, [cellCount, columnCount, colWidth, gutterSize, cellMeasurerCache]);

  // ③ Dùng Collection để virtualize!
  return (
    <Collection
      width={width}
      height={height}
      cellCount={cellCount}
      cellSizeAndPositionGetter={({ index }) => layout.positions[index]}
      cellRenderer={cellRenderer}
    />
  );
}
```

```
MASONRY PLACEMENT ALGORITHM:
═══════════════════════════════════════════════════════════════

  3 cột, gutter = 10px:

  Bước 0: columnHeights = [0, 0, 0]
  Item 0 (h=200): cột 0 (ngắn nhất!)
  ┌────────┐
  │ Item 0 │
  │ h=200  │
  └────────┘

  Bước 1: columnHeights = [210, 0, 0]
  Item 1 (h=150): cột 1 (ngắn nhất!)
  ┌────────┬────────┐
  │ Item 0 │ Item 1 │
  │ h=200  │ h=150  │
  └────────┴────────┘

  Bước 2: columnHeights = [210, 160, 0]
  Item 2 (h=180): cột 2 (ngắn nhất!)
  ┌────────┬────────┬────────┐
  │ Item 0 │ Item 1 │ Item 2 │
  │ h=200  │ h=150  │ h=180  │
  └────────┴────────┴────────┘

  Bước 3: columnHeights = [210, 160, 190]
  Item 3 (h=120): cột 1 (ngắn nhất = 160!)
  ┌────────┬────────┬────────┐
  │ Item 0 │ Item 1 │ Item 2 │
  │ h=200  │ h=150  │ h=180  │
  │        ├────────┤        │
  │        │ Item 3 │        │
  │        │ h=120  │        │
  └────────┴────────┴────────┘

  → Luôn xếp vào cột NGẮN NHẤT → cân bằng!
  → Pinterest, Google Photos dùng giải thuật này!
```

### 14.6 WindowScroller — Scroll theo window!

```jsx
// ═══ WindowScroller — dùng window scroll thay vì container! ═══

function WindowScroller({ children }) {
  const [state, setState] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
    scrollTop: 0,
    isScrolling: false,
  });

  const containerRef = useRef(null);
  const scrollTimerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;

      // Tính scrollTop TƯƠNG ĐỐI với container!
      const rect = el.getBoundingClientRect();
      const scrollTop = Math.max(0, -rect.top);

      setState((prev) => ({
        ...prev,
        scrollTop,
        isScrolling: true,
      }));

      // Debounce isScrolling reset!
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, isScrolling: false }));
      }, 150);
    };

    const handleResize = () => {
      setState((prev) => ({
        ...prev,
        height: window.innerHeight,
        width: window.innerWidth,
      }));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      clearTimeout(scrollTimerRef.current);
    };
  }, []);

  // Render prop pattern — truyền scroll info xuống!
  return (
    <div ref={containerRef}>
      {children({
        height: state.height,
        width: state.width,
        scrollTop: state.scrollTop,
        isScrolling: state.isScrolling,
        registerChild: containerRef,
      })}
    </div>
  );
}

// ═══ SỬ DỤNG ═══
function WindowScrollerApp() {
  return (
    <WindowScroller>
      {({ height, width, scrollTop, isScrolling }) => (
        <List
          height={height}
          width={width}
          rowCount={10000}
          rowHeight={35}
          scrollTop={scrollTop}
          rowRenderer={({ index, style }) => (
            <div key={index} style={style}>
              {isScrolling ? "Loading..." : `Item ${index}`}
            </div>
          )}
        />
      )}
    </WindowScroller>
  );
}
```

```
WINDOWSCROLLER — TẠI SAO CẦN?
═══════════════════════════════════════════════════════════════

  BÌNH THƯỜNG:
  ┌──── Page ──────────────────────────┐
  │ Header                              │
  │ ┌── Container (overflow:auto) ──┐  │
  │ │ ← SCROLL Ở ĐÂY!             │  │
  │ │ Item 0                        │  │
  │ │ Item 1                        │  │
  │ │ ...                           │  │
  │ └───────────────────────────────┘  │
  │ Footer                              │
  └─────────────────────────────────────┘
  → 2 scrollbars! Content scroll + Page scroll = BAD UX!

  VỚI WindowScroller:
  ┌──── Page (SCROLL Ở ĐÂY!) ─────────┐
  │ Header                              │
  │ Item 0                              │
  │ Item 1  ← VIRTUALIZED!             │
  │ Item 2  ← nhưng scroll = window!   │
  │ ...                                 │
  │ Footer                              │
  └─────────────────────────────────────┘
  → 1 scrollbar! Window scroll → natural UX! ✅

  CÁCH HOẠT ĐỘNG:
  → Listen window.scroll thay vì container.scroll!
  → Tính scrollTop = -containerRect.top!
  → Truyền scrollTop prop vào List/Grid!
  → List/Grid KHÔNG tự scroll, dùng scrollTop từ props!
```

### 14.7 CellMeasurer — React Component

```jsx
// ═══ CellMeasurer — TỰ ĐO CHIỀU CAO TRONG REACT ═══

class CellMeasurerCache {
  constructor({ defaultHeight = 50, defaultWidth = 100, fixedWidth = true }) {
    this._defaultH = defaultHeight;
    this._defaultW = defaultWidth;
    this._fixedWidth = fixedWidth;
    this._heights = {};
    this._widths = {};
  }

  get(index) {
    return this._heights[index] || this._defaultH;
  }

  getWidth(index) {
    return this._widths[index] || this._defaultW;
  }

  has(index) {
    return index in this._heights;
  }

  set(index, width, height) {
    this._heights[index] = height;
    if (!this._fixedWidth) this._widths[index] = width;
  }

  clearAll() {
    this._heights = {};
    this._widths = {};
  }
}

// CellMeasurer component — wrap mỗi cell!
function CellMeasurer({ cache, index, parent, children }) {
  const measureRef = useRef(null);

  useEffect(() => {
    if (!cache.has(index) && measureRef.current) {
      // ĐO element THẬT sau khi DOM render!
      const el = measureRef.current;
      const rect = el.getBoundingClientRect();
      cache.set(index, rect.width, rect.height);

      // Force parent re-render để update positions!
      if (parent && parent.recomputeGridSize) {
        parent.recomputeGridSize({ rowIndex: index });
      }
    }
  }, [cache, index, parent]);

  // Inject ref vào children!
  return (
    <div ref={measureRef} style={{ width: "100%" }}>
      {typeof children === "function"
        ? children({ measure: () => {} })
        : children}
    </div>
  );
}

// ═══ SỬ DỤNG ═══
const cache = new CellMeasurerCache({
  defaultHeight: 50,
  fixedWidth: true,
});

function DynamicList() {
  return (
    <List
      width={700}
      height={400}
      rowCount={1000}
      rowHeight={({ index }) => cache.get(index)}
      rowRenderer={({ index, key, style, parent }) => (
        <CellMeasurer cache={cache} index={index} key={key} parent={parent}>
          <div style={style}>
            <p>{longTexts[index]}</p>
          </div>
        </CellMeasurer>
      )}
    />
  );
}
```

```
CELLMEASURER FLOW:
═══════════════════════════════════════════════════════════════

  Lần render ĐẦU TIÊN:
  ┌────────────────────────────────────────────────────┐
  │ Item 0: cache MISS → dùng defaultHeight (50px)    │
  │ Item 1: cache MISS → dùng defaultHeight (50px)    │
  │ ...                                                │
  └────────────────────────────────────────────────────┘
       │
       ▼ useEffect (sau DOM render!)
  ┌────────────────────────────────────────────────────┐
  │ Item 0: getBoundingClientRect() → height = 73px!  │
  │ Item 1: getBoundingClientRect() → height = 42px!  │
  │ → cache.set(0, _, 73)                             │
  │ → cache.set(1, _, 42)                             │
  └────────────────────────────────────────────────────┘
       │
       ▼ recomputeGridSize()
  ┌────────────────────────────────────────────────────┐
  │ Re-render List!                                    │
  │ Item 0: cache HIT → height = 73px ✅             │
  │ Item 1: cache HIT → height = 42px ✅             │
  │ → Positions chính xác!                            │
  └────────────────────────────────────────────────────┘

  → Render 2 LẦN: lần 1 estimate, lần 2 chính xác!
  → Đây là trade-off: accuracy vs performance!
  → react-window KHÔNG có CellMeasurer vì lý do này!
```

### 14.8 Phỏng vấn Deep-Dive: "So sánh react-window vs react-virtualized"

> **Mục tiêu**: Giải thích CỰC KỲ chi tiết mọi khía cạnh kiến trúc,
> trade-offs, internals của CẢ HAI thư viện để trả lời mọi follow-up!

```
═══════════════════════════════════════════════════════════════
  PHẦN 1: KIẾN TRÚC THIẾT KẾ — COMPOSITION vs INHERITANCE
═══════════════════════════════════════════════════════════════

  react-window — COMPOSITION (Unix philosophy):
  ┌────────────────────────────────────────────────────┐
  │ "Mỗi component LÀM 1 VIỆC, làm TỐT!"             │
  │                                                    │
  │ FixedSizeList ──── independent!                    │
  │ VariableSizeList ── independent!                   │
  │ FixedSizeGrid ──── independent!                    │
  │ VariableSizeGrid ── independent!                   │
  │                                                    │
  │ → Không kế thừa lẫn nhau!                         │
  │ → Import CHỈ component cần → tree-shake tối ưu!   │
  │ → Mỗi component tự chứa logic riêng!              │
  │ → AutoSizer, InfiniteLoader = SEPARATE packages!  │
  │                                                    │
  │ import { FixedSizeList } from 'react-window';      │
  │ // → Chỉ nhận code FixedSizeList! ~2KB!           │
  └────────────────────────────────────────────────────┘

  react-virtualized — INHERITANCE (OOP philosophy):
  ┌────────────────────────────────────────────────────┐
  │ "Module LỚN, tất cả build trên 1 nền tảng!"       │
  │                                                    │
  │                   Grid (BASE)                       │
  │                    │                                │
  │        ┌───────────┼───────────┐                    │
  │        ▼           ▼           ▼                    │
  │      List        Table      Collection              │
  │        │                       │                    │
  │        ▼                       ▼                    │
  │   WindowScroller            Masonry                 │
  │                                                    │
  │ → List KẾ THỪA từ Grid! Nếu import List → kéo    │
  │   theo TOÀN BỘ Grid code!                          │
  │ → Tree-shaking KÉMHƠN vì coupled!                 │
  │                                                    │
  │ import { List } from 'react-virtualized';          │
  │ // → Nhận List + Grid + utilities! ~15KB+!        │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "Tại sao Brian Vaughn viết lại react-window?"
  A: → Brian Vaughn LÀ tác giả CẢ HAI thư viện!
  → react-virtualized (2015): first attempt, feature-rich!
     → Thời đó: class components, no hooks, no tree-shaking!
     → Cứ thêm features → grows to 34.7KB!
  → react-window (2018): rewrite from scratch!
     → Rút kinh nghiệm: "80% users chỉ cần List + Grid!"
     → Bỏ hết Table, Collection, Masonry, CellMeasurer!
     → Kết quả: 5.4KB! Giảm 85% size!
  → Brian nói: "react-window là phiên bản nhẹ hơn,
     nhanh hơn của react-virtualized cho hầu hết use cases."

  FOLLOW-UP Q: "Tại sao không deprecate react-virtualized?"
  A: → Vì react-virtualized CÓ features react-window KHÔNG CÓ:
     Table, Collection, Masonry, CellMeasurer, MultiGrid!
  → Nhiều production apps ĐANG dùng react-virtualized!
  → Migration cost CAO → không nên deprecate!
  → Cả hai CÒN ĐƯỢC maintain (tuy react-virtualized ít updates hơn)
```

```
═══════════════════════════════════════════════════════════════
  PHẦN 2: INTERNAL DIFFERENCES — CLASS vs FUNCTIONAL
═══════════════════════════════════════════════════════════════

  react-virtualized (CLASS components):
  ┌────────────────────────────────────────────────────┐
  │ class Grid extends PureComponent {                 │
  │   // Instance variables cho performance!           │
  │   _cellCache = {};                                 │
  │   _styleCache = {};                                │
  │                                                    │
  │   // shouldComponentUpdate TỰ VIẾT!               │
  │   shouldComponentUpdate(nextProps, nextState) {     │
  │     // So sánh TỪNG prop để tránh re-render!       │
  │     return (                                       │
  │       nextState.scrollTop !== this.state.scrollTop  │
  │     );                                              │
  │   }                                                │
  │                                                    │
  │   // Instance methods EXPOSED cho user:            │
  │   scrollToCell({ rowIndex, columnIndex })           │
  │   recomputeGridSize({ rowIndex, columnIndex })      │
  │   measureAllCells()                                 │
  │ }                                                  │
  └────────────────────────────────────────────────────┘

  react-window (FUNCTIONAL components + hooks):
  ┌────────────────────────────────────────────────────┐
  │ const FixedSizeList = React.forwardRef((props, ref) => { │
  │   const [scrollOffset, setScrollOffset] = useState(0);   │
  │                                                    │
  │   // useMemo thay shouldComponentUpdate!            │
  │   const range = useMemo(() => {                    │
  │     return calculateRange(scrollOffset, ...);       │
  │   }, [scrollOffset, height, itemSize]);             │
  │                                                    │
  │   // useImperativeHandle EXPOSE methods!            │
  │   useImperativeHandle(ref, () => ({                │
  │     scrollTo(offset) {},                            │
  │     scrollToItem(index, align) {},                  │
  │   }));                                              │
  │                                                    │
  │   // useRef cho style cache!                        │
  │   const styleCache = useRef({});                    │
  │ });                                                │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "Class vs Functional — ai nhanh hơn?"
  A: → Performance LÝ THUYẾT: gần BẰNG nhau!
  → Performance THỰC TẾ: react-window nhanh hơn vì:
     ① Ít code hơn → ít parse/execute time!
     ② Ít components trong tree → ít reconciliation!
     ③ useMemo tốt hơn shouldComponentUpdate
        vì chỉ recompute KHI deps thay đổi!
  → Benchmark (10000 items, scroll nhanh):
     react-virtualized: ~8ms/frame
     react-window: ~4ms/frame
     → react-window nhanh ~2x!

  FOLLOW-UP Q: "useImperativeHandle dùng để làm gì?"
  A: → Functional component KHÔNG CÓ instance methods!
  → Nhưng user CẦN: listRef.current.scrollToItem(500)!
  → useImperativeHandle EXPOSE methods qua ref!
  ┌────────────────────────────────────────────────────┐
  │ const listRef = useRef(null);                      │
  │                                                    │
  │ // react-window:                                   │
  │ <FixedSizeList ref={listRef} ... />                │
  │ listRef.current.scrollToItem(500, 'center');       │
  │                                                    │
  │ // react-virtualized:                              │
  │ <List ref={listRef} ... />                         │
  │ listRef.current.scrollToRow(500);                  │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "PureComponent vs React.memo?"
  A: → PureComponent: class component, shallow compare
     ALL props + state tự động!
  → React.memo: functional component, shallow compare
     ONLY props (state do hooks quản lý!)
  → Cả hai: prevent re-render nếu props KHÔNG đổi!
  → React.memo linh hoạt hơn: custom comparator!
     React.memo(Component, (prev, next) => prev.id === next.id)
```

```
═══════════════════════════════════════════════════════════════
  PHẦN 3: SO SÁNH CHI TIẾT TỪNG COMPONENT
═══════════════════════════════════════════════════════════════

  ┌──────────────┬───────────────────┬────────────────────┐
  │ Feature      │ react-window      │ react-virtualized  │
  ├──────────────┼───────────────────┼────────────────────┤
  │ List         │ FixedSizeList     │ List (Grid wrapper)│
  │              │ VariableSizeList  │                    │
  ├──────────────┼───────────────────┼────────────────────┤
  │ Grid         │ FixedSizeGrid     │ Grid (BASE!)       │
  │              │ VariableSizeGrid  │                    │
  ├──────────────┼───────────────────┼────────────────────┤
  │ Table        │ ❌ KHÔNG CÓ       │ ✅ Table + Column  │
  ├──────────────┼───────────────────┼────────────────────┤
  │ Collection   │ ❌ KHÔNG CÓ       │ ✅ Sector map      │
  ├──────────────┼───────────────────┼────────────────────┤
  │ Masonry      │ ❌ KHÔNG CÓ       │ ✅ Auto-placement  │
  ├──────────────┼───────────────────┼────────────────────┤
  │ CellMeasurer │ ❌ KHÔNG CÓ       │ ✅ Render+Measure  │
  ├──────────────┼───────────────────┼────────────────────┤
  │ WindowScroller│ ❌ KHÔNG CÓ      │ ✅ window.scroll   │
  ├──────────────┼───────────────────┼────────────────────┤
  │ ScrollSync   │ ❌ KHÔNG CÓ       │ ✅ Multi-panel     │
  ├──────────────┼───────────────────┼────────────────────┤
  │ MultiGrid    │ ❌ KHÔNG CÓ       │ ✅ Frozen rows/cols│
  ├──────────────┼───────────────────┼────────────────────┤
  │ AutoSizer    │ react-virtualized │ ✅ Built-in        │
  │              │ -auto-sizer (sep!)│                    │
  ├──────────────┼───────────────────┼────────────────────┤
  │ InfiniteLoader│ react-window-    │ ✅ Built-in        │
  │              │ infinite-loader   │                    │
  ├──────────────┼───────────────────┼────────────────────┤
  │ ArrowKeyStepper│ ❌ KHÔNG CÓ     │ ✅ Keyboard nav    │
  ├──────────────┼───────────────────┼────────────────────┤
  │ Bundle Size  │ 5.4KB gzipped     │ 34.7KB gzipped     │
  ├──────────────┼───────────────────┼────────────────────┤
  │ API Style    │ Render props      │ Render props       │
  │              │ (children fn)     │ (rowRenderer)      │
  ├──────────────┼───────────────────┼────────────────────┤
  │ RTL Support  │ ✅ Có             │ ⚠️ Limited         │
  ├──────────────┼───────────────────┼────────────────────┤
  │ React 18     │ ✅ Full support   │ ⚠️ Works but old   │
  └──────────────┴───────────────────┴────────────────────┘

  FOLLOW-UP Q: "react-window thiếu Table, làm sao?"
  A: → 3 CÁCH:
  ① Tự build Table = FixedSizeList + sticky header div!
     → Header cố định TRÊN, body virtualized DƯỚI!
  ② Dùng thư viện bên thứ 3:
     → react-table + react-window = useBlockLayout hook!
     → TanStack Virtual (successor!) = headless virtualization!
  ③ Dùng react-virtualized CHỈ cho Table!
     → import { Table } from 'react-virtualized/dist/es/Table'
     → Tree-shake: chỉ lấy Table module!

  FOLLOW-UP Q: "Tại sao react-window bỏ CellMeasurer?"
  A: → Brian Vaughn nói: "CellMeasurer là anti-pattern!"
  → Lý do:
     ① Render 2 LẦN: estimate → measure → re-render!
        → 2x cost cho INITIAL render!
     ② getBoundingClientRect forces browser LAYOUT!
        → Synchronous layout = layout thrashing risk!
     ③ Dynamic height items = O(n) offset recalculation!
        → Mỗi khi 1 item change height → recalc TẤT CẢ offsets phía sau!
     ④ Phức tạp hóa code + harder to reason about!
  → Giải pháp trong react-window:
     → User tự quản lý heights!
     → Dùng VariableSizeList + estimatedItemSize!
     → Hook bên thứ 3: react-virtualized-auto-sizer!
```

```
═══════════════════════════════════════════════════════════════
  PHẦN 4: PERFORMANCE BENCHMARKS CHI TIẾT
═══════════════════════════════════════════════════════════════

  TEST: 10000 items, scroll liên tục 5 giây:
  ┌────────────────────────────────────────────────────┐
  │                react-window  react-virtualized     │
  │ ─────────────────────────────────────────────────  │
  │ Bundle (gzip)   5.4KB        34.7KB                │
  │ Parse time      ~2ms         ~12ms                 │
  │ Initial render  ~8ms         ~15ms                 │
  │ Scroll frame    ~4ms         ~8ms                  │
  │ FPS (avg)       58fps        52fps                 │
  │ DOM nodes       ~25          ~25                   │
  │ Memory (heap)   ~3MB         ~5MB                  │
  │ GC pauses       rare         occasional            │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "Tại sao react-window nhanh hơn 2x?"
  A: → 4 lý do:
  ① ÍT CODE: 5.4KB vs 34.7KB → ít JS parse time!
  ② ÍT ABSTRACTION: List là component TRỰC TIẾP
     vs List → Grid → ... chain of inheritance!
  ③ FUNCTIONAL: hooks + useMemo = granular updates
     vs class lifecycle = coarser updates!
  ④ STYLE CACHING tốt hơn:
     react-window: cache dùng compound key (index)
     react-virtualized: phức tạp hơn (row+col keys)

  FOLLOW-UP Q: "DOM nodes giống nhau, tại sao frame time khác?"
  A: → DOM nodes giống = CÙNG painting cost!
  → Khác biệt ở SCRIPTING cost:
     react-window: onScroll → setState → useMemo → render
     react-virtualized: onScroll → setState → SCU check
       → Grid render → cellRenderer → styling → render
     → react-virtualized có NHIỀU layers of abstraction hơn!
     → Mỗi layer = thêm function calls + object allocations!

  FOLLOW-UP Q: "Cả hai có handle 1 TRIỆU items?"
  A: → CẢ HAI xử lý được! Vì:
     → CHỈ render ~20-50 DOM nodes cùng lúc!
     → scrollHeight max = browser limit (~33 million px)
     → 1,000,000 × 35px = 35,000,000px → GẦN limit!
  → VẤN ĐỀ: offset array cho VariableSize!
     → 1M × 8 bytes = 8MB array! → nhiều memory!
  → GIẢI PHÁP:
     → FixedSizeList: OK (không cần offset array!)
     → VariableSizeList: dùng estimatedItemSize
       + lazy offset calculation!
```

```
═══════════════════════════════════════════════════════════════
  PHẦN 5: MIGRATION — react-virtualized → react-window
═══════════════════════════════════════════════════════════════

  API DIFFERENCES:
  ┌────────────────────────────────────────────────────┐
  │ react-virtualized:                                 │
  │ <List                                              │
  │   width={700}                                      │
  │   height={400}                                     │
  │   rowCount={items.length}                          │
  │   rowHeight={35}                                   │
  │   rowRenderer={({ index, key, style }) => ...}     │
  │ />                                                 │
  │                                                    │
  │ react-window:                                      │
  │ <FixedSizeList                                     │
  │   width={700}                                      │
  │   height={400}                                     │
  │   itemCount={items.length}     ← renamed!          │
  │   itemSize={35}                ← renamed!          │
  │ >                                                  │
  │   {({ index, style }) => ...}  ← children fn!      │
  │ </FixedSizeList>                                   │
  └────────────────────────────────────────────────────┘

  MIGRATION STEPS:
  ┌────────────────────────────────────────────────────┐
  │ ① RENAME props:                                    │
  │   rowCount → itemCount                             │
  │   rowHeight → itemSize                             │
  │   rowRenderer → children (render prop)             │
  │                                                    │
  │ ② REMOVE key from render function:                 │
  │   react-virtualized: user tự pass key              │
  │   react-window: tự quản lý key internally!         │
  │                                                    │
  │ ③ REPLACE AutoSizer:                               │
  │   from 'react-virtualized' →                       │
  │   from 'react-virtualized-auto-sizer'              │
  │                                                    │
  │ ④ REPLACE InfiniteLoader:                          │
  │   from 'react-virtualized' →                       │
  │   from 'react-window-infinite-loader'              │
  │                                                    │
  │ ⑤ CANNOT MIGRATE (cần giữ react-virtualized):     │
  │   → Table (dùng <Column> children!)                │
  │   → CellMeasurer (dynamic heights!)                │
  │   → WindowScroller (window scroll!)                │
  │   → MultiGrid (frozen rows/cols!)                  │
  │   → Collection/Masonry (free-form!)                │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "Có thể dùng CẢ HAI trong 1 project?"
  A: → CÓ! Nhưng không nên!
  → Bundle = 5.4KB + 34.7KB = 40KB! (lãng phí!)
  → Nên chọn 1:
     Cần Table/Masonry/CellMeasurer → react-virtualized!
     Chỉ cần List/Grid → react-window!

  FOLLOW-UP Q: "TanStack Virtual vs cả hai?"
  A: → TanStack Virtual (2022+) = thế hệ MỚI:
  ┌────────────────────────────────────────────────────┐
  │ → HEADLESS (không render gì! chỉ cung cấp logic!) │
  │ → Framework agnostic (React, Vue, Solid, Svelte!)  │
  │ → Hooks-based API!                                 │
  │ → Dynamic measurements BUILT-IN!                   │
  │ → ~3KB gzipped! Nhỏ hơn cả react-window!          │
  │                                                    │
  │ const virtualizer = useVirtualizer({               │
  │   count: 10000,                                    │
  │   getScrollElement: () => parentRef.current,       │
  │   estimateSize: () => 35,                          │
  │ });                                                │
  │                                                    │
  │ → MỚI nhất, maintained, RECOMMENDED cho new projects!│
  └────────────────────────────────────────────────────┘
```

```
═══════════════════════════════════════════════════════════════
  PHẦN 6: KIẾN TRÚC NỘI BỘ — DEEP DIVE TỪNG COMPONENT
═══════════════════════════════════════════════════════════════

  ① GRID (react-virtualized) — BASE:
  ┌────────────────────────────────────────────────────┐
  │ FLOW:                                              │
  │ constructor → componentDidMount → render           │
  │      │                                             │
  │ ① _calculateSizeAndPositionData()                  │
  │    → Tính offset arrays cho rows + columns!        │
  │    → Cache vào instance: _rowSizeMap, _colSizeMap  │
  │                                                    │
  │ ② _calculateChildrenToRender()                     │
  │    → Binary search tìm visible range!              │
  │    → overscanStartIndex, overscanStopIndex          │
  │    → columnStartIndex, columnStopIndex              │
  │                                                    │
  │ ③ cellRenderer loop → Render cells!                │
  │    → Mỗi cell: get cached style hoặc compute!     │
  │                                                    │
  │ KEY OPTIMIZATION:                                   │
  │ → _cellCache: cache React elements!                │
  │   → Nếu cell props KHÔNG đổi → trả về CACHED!    │
  │   → Tránh React.createElement mỗi render!         │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "_cellCache cache React elements — có safe?"
  A: → CÓ! React elements = immutable plain objects!
  → { type: 'div', props: {...}, key: '...' }
  → Không giữ state → safe to cache!
  → NHƯNG: nếu user thay đổi cellRenderer logic
     → cache STALE! Cần invalidate!
  → react-virtualized: cache key = `${rowIndex}-${colIndex}`
  → Invalidate khi: resize, recompute, data change!

  ② LIST (react-virtualized) — GRID WRAPPER:
  ┌────────────────────────────────────────────────────┐
  │ render() {                                         │
  │   return (                                         │
  │     <Grid                                          │
  │       cellRenderer={this._cellRenderer}            │
  │       columnCount={1}                              │
  │       columnWidth={this.props.width}               │
  │       rowCount={this.props.rowCount}               │
  │       rowHeight={this.props.rowHeight}              │
  │       {...otherProps}                               │
  │     />                                             │
  │   );                                               │
  │ }                                                  │
  │                                                    │
  │ _cellRenderer = ({ rowIndex, style, ...rest }) => { │
  │   return this.props.rowRenderer({                  │
  │     index: rowIndex,                               │
  │     style,                                         │
  │     ...rest,                                       │
  │   });                                              │
  │ };                                                 │
  │                                                    │
  │ → List = THIN WRAPPER! Hầu hết logic ở Grid!     │
  │ → Đây là lý do bundle size: List KÉO THEO Grid!  │
  └────────────────────────────────────────────────────┘

  ③ TABLE — CHILDREN AS CONFIGURATION:
  ┌────────────────────────────────────────────────────┐
  │ PATTERN: Declarative Column Configuration          │
  │                                                    │
  │ <Table rowGetter={({index}) => data[index]}>       │
  │   <Column label="Name" dataKey="name" width={200}/>│
  │   <Column label="Age" dataKey="age" width={60} />  │
  │ </Table>                                           │
  │                                                    │
  │ Table.render():                                    │
  │ ① React.Children.toArray(children) → columns[]    │
  │ ② Render header row (sticky!) từ columns          │
  │ ③ Render body = Grid với cellRenderer:             │
  │    → rowGetter({index}) → get rowData              │
  │    → columns[colIndex].dataKey → get cellData      │
  │    → columns[colIndex].cellRenderer → render cell  │
  │                                                    │
  │ KEY INSIGHT:                                        │
  │ → Column component KHÔNG render gì!               │
  │ → Column = declarative config object!              │
  │ → Table READ config từ Column children!            │
  │ → Giống React Router <Route>: config, không render!│
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "Children as configuration — ưu nhược điểm?"
  A: → ƯU:
     → JSX syntax đẹp, declarative!
     → IDE autocomplete cho Column props!
     → Familiar với developers (giống HTML <table>)!
  → NHƯỢC:
     → React.Children.toArray mỗi render!
     → Column changes → Table phải re-parse!
     → Không thể truyền runtime config dễ dàng!
  → THAY THẾ: config array pattern:
     columns={[{ label: 'Name', dataKey: 'name' }]}
     → Đơn giản hơn, dễ dynamic!

  ④ COLLECTION — SECTOR MAP DEEP DIVE:
  ┌────────────────────────────────────────────────────┐
  │ SECTOR MAP = Spatial hashing for 2D!               │
  │                                                    │
  │ Grid: items XẾP ĐỀU → index = floor(pos/size)    │
  │ Collection: items BẤT KỲ → KHÔNG THỂ floor!      │
  │                                                    │
  │ Naive: O(n) — check TỪNG item xem visible?        │
  │ Sector map: O(1) — chia canvas thành ô!            │
  │                                                    │
  │ BUILD TIME: O(n) — mỗi item → register vào sectors│
  │ QUERY TIME: O(k) — k = items trong visible sectors │
  │                     k << n (HẦU HẾT items ngoài!) │
  │                                                    │
  │ TRADE-OFF:                                          │
  │ → Sector quá NHỎ (10px): nhiều sectors, nhiều memory│
  │ → Sector quá LỚN (1000px): nhiều items/sector → slow│
  │ → Sweet spot: ~100px sectors!                       │
  │                                                    │
  │ → Đây là SPATIAL HASHING — dùng trong game engines!│
  │ → Giống R-tree, nhưng đơn giản hơn!               │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "Spatial hashing vs R-tree?"
  A: → Spatial hashing (sector map):
     → Đơn giản! Fixed-size grid!
     → O(1) insert, O(1) query!
     → NHƯỢC: không hiệu quả nếu items phân bố KHÔNG đều!
  → R-tree:
     → Adaptive! Split/merge nodes!
     → O(log n) insert, O(log n + k) query!
     → Tốt cho items phân bố KHÔNG đều!
     → NHƯNG: phức tạp hơn nhiều!
  → react-virtualized chọn spatial hashing vì:
     → Đơn giản implement!
     → UI items thường phân bố TƯƠNG ĐỐI đều!
     → Performance đủ tốt cho hầu hết cases!

  ⑤ MASONRY — SHORTEST COLUMN ALGORITHM:
  ┌────────────────────────────────────────────────────┐
  │ THUẬT TOÁN:                                        │
  │ columnHeights = Array(numCols).fill(0)             │
  │                                                    │
  │ for each item:                                     │
  │   shortestCol = columnHeights.indexOf(min)         │
  │   item.x = shortestCol × (colWidth + gutter)      │
  │   item.y = columnHeights[shortestCol]              │
  │   columnHeights[shortestCol] += item.height + gutter│
  │                                                    │
  │ COMPLEXITY:                                         │
  │ → O(n × k) where k = number of columns            │
  │ → k thường = 3-5 → practically O(n)               │
  │                                                    │
  │ ALTERNATIVES:                                       │
  │ → CSS columns: browser native, nhưng order sai!   │
  │   (items xếp TOP→BOTTOM theo column, không L→R!)  │
  │ → CSS Grid: grid-auto-rows + dense packing!        │
  │   (Không virtualize được!)                         │
  │ → Masonry CSS (future): masonry value for          │
  │   grid-template-rows (Chrome flag only!)           │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP Q: "CSS Masonry khi nào sẽ có?"
  A: → CSS masonry-layout: đang ở stage experimental!
  → Chrome: behind flag (chrome://flags)!
  → Firefox: đã có (grid-template-rows: masonry)!
  → Khi stable: SẼ thay thế JS Masonry cho static content!
  → NHƯNG: vẫn cần JS cho VIRTUALIZED masonry!
```

```
═══════════════════════════════════════════════════════════════
  PHẦN 7: REAL-WORLD DECISION FRAMEWORK
═══════════════════════════════════════════════════════════════

  KHI NÀO CHỌN CÁI NÀO — DECISION TREE:

  "Bạn cần virtualize cái gì?"
       │
       ├─ Chỉ List/Grid đơn giản?
       │    │
       │    ├─ YES + NEW project → TanStack Virtual! 🏆
       │    ├─ YES + EXISTING project → react-window ✅
       │    └─ YES + bundle CRITICAL → react-window (5.4KB)
       │
       ├─ Cần Table với header sticky?
       │    │
       │    ├─ Simple table → react-window + tự build header
       │    └─ Complex table → react-virtualized Table ✅
       │         (hoặc TanStack Table + TanStack Virtual)
       │
       ├─ Cần Masonry/Pinterest layout?
       │    │
       │    └─ react-virtualized Masonry ✅
       │       (hoặc react-masonry-css + custom virtualization)
       │
       ├─ Items height CHƯA BIẾT TRƯỚC?
       │    │
       │    ├─ Có estimateSize → react-window VariableSizeList
       │    └─ Hoàn toàn dynamic → react-virtualized CellMeasurer
       │       (hoặc TanStack Virtual measureElement!)
       │
       ├─ Cần window-level scroll?
       │    │
       │    └─ react-virtualized WindowScroller ✅
       │       (hoặc react-virtuoso = built-in window scroll!)
       │
       └─ Cần frozen rows/columns (Excel-like)?
            │
            └─ react-virtualized MultiGrid ✅

  FOLLOW-UP Q: "Tại sao bạn recommend TanStack Virtual?"
  A: → 5 lý do:
  ① HEADLESS: không render gì → full control over DOM!
  ② FRAMEWORK AGNOSTIC: React, Vue, Solid, Svelte!
  ③ DYNAMIC MEASUREMENTS: built-in measureElement!
     → Không cần CellMeasurer riêng!
  ④ ~3KB gzipped! Nhỏ nhất!
  ⑤ ACTIVELY maintained bởi Tanner Linsley!

  FOLLOW-UP Q: "react-virtuoso thì sao?"
  A: → react-virtuoso = alternative hiện đại:
  ┌────────────────────────────────────────────────────┐
  │ → Auto height detection (không cần CellMeasurer!) │
  │ → Window scroll BUILT-IN!                          │
  │ → Grouped/Sticky headers!                         │
  │ → Chat-style reverse scrolling!                    │
  │ → ~8KB gzipped                                     │
  │                                                    │
  │ KHI NÀO dùng:                                      │
  │ → Chat apps (reverse scroll!)                      │
  │ → Dynamic heights (auto measure!)                  │
  │ → Khi react-window + react-virtualized đều thiếu! │
  └────────────────────────────────────────────────────┘
```

```
═══════════════════════════════════════════════════════════════
  TÓM TẮT — FRAMEWORK TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  "Khi được hỏi so sánh react-window vs react-virtualized:"

  ① CÙNG TÁC GIẢ: Brian Vaughn (React core team!)
  ② TRIẾT LÝ: Composition (window) vs Inheritance (virtualized)
  ③ SIZE: 5.4KB vs 34.7KB (6.4x!)
  ④ COMPONENTS: 4 vs 12+
  ⑤ PERFORMANCE: window ~2x nhanh hơn (ít abstraction)
  ⑥ CLASS vs HOOKS: virtualized = class, window = functional
  ⑦ TABLE: chỉ virtualized có (sticky header + Column config)
  ⑧ COLLECTION/MASONRY: chỉ virtualized (sector map + shortest-col)
  ⑨ CELLMEASURER: chỉ virtualized (render→measure→cache→rerender)
  ⑩ MIGRATION: rename props + separate packages cho AutoSizer/InfiniteLoader
  ⑪ ALTERNATIVE MỚI: TanStack Virtual (headless, 3KB, framework agnostic!)

  → "80% projects chỉ cần react-window.
     20% cần react-virtualized cho Table/Masonry/CellMeasurer.
     New projects nên consider TanStack Virtual!"
```

---

## §15. Best Practices & Phỏng vấn — Comprehensive

```
═══════════════════════════════════════════════════════════════
  Q&A PHỎNG VẤN — CỰC KỲ CHI TIẾT (FOLLOW-UP READY):
═══════════════════════════════════════════════════════════════

  Q1: "Virtualization là gì? Giải thích cho non-tech?"
  A: → Hãy tưởng tượng cuốn sách 10000 trang!
  → Bạn MỞ cuốn sách: chỉ THẤY 2 trang (trái + phải)!
  → Bạn LƯỚT: trang cũ BIẾN MẤT, trang mới XUẤT HIỆN!
  → Virtualization = chỉ "in" trang bạn ĐANG XEM!
  → Kỹ thuật: chỉ render items VISIBLE trên viewport!
  → 10K items nhưng chỉ ~20 DOM nodes tại mọi thời điểm!

  FOLLOW-UP: "Overhead của virtualization?"
  → JavaScript computation mỗi scroll event!
  → Scroll handler + range calculation + React reconciliation!
  → Trade-off: ÍT DOM nodes (giảm memory + paint)
     vs NHIỀU scripting (tính toán range + re-render)!
  → Sweet spot: > 100 items → virtualization THẮNG!
  → < 50 items → render thẳng nhanh hơn (no overhead)!

  ─────────────────────────────────────────────────────

  Q2: "Cách tính visible range — giải thích MỌI bước?"
  A: → 4 bước:
  ① scrollTop = pixels đã scroll!
  ② startIndex = floor(scrollTop / itemHeight)
     → Tại sao floor? Item đầu CÓ THỂ bị cắt ở top!
     → floor đảm bảo BẮT item dù chỉ visible 1px!
  ③ visibleCount = ceil(viewportHeight / itemHeight)
     → Tại sao ceil? Item cuối CÓ THỂ visible 1px!
     → ceil đảm bảo render ĐỦ items cover viewport!
  ④ endIndex = startIndex + visibleCount - 1
     → Clamp: min(endIndex, itemCount - 1)!

  FOLLOW-UP: "Khi itemHeight thay đổi?"
  → KHÔNG THỂ dùng floor! (itemHeight KHÁC mỗi item!)
  → Xây offset array: offsets[i] = sum(heights[0..i-1])
  → Binary search: tìm i sao cho offsets[i] ≤ scrollTop < offsets[i+1]
  → O(log n) thay vì O(1)!
  → react-virtualized: _rowSizeAndPositionManager!
  → react-window: getItemOffset(index)!

  ─────────────────────────────────────────────────────

  Q3: "Dynamic height — 3 approaches?"
  A: → 3 cách xử lý dynamic heights:

  CÁCH 1: ESTIMATE → VariableSizeList + estimatedItemSize
  ┌────────────────────────────────────────────────────┐
  │ User BIẾT estimated height (50px average)          │
  │ → estimatedItemSize prop tính APPROXIMATE scroll!  │
  │ → itemSize function RETURN height CHÍNH XÁC       │
  │   cho items ĐÃ ĐO!                                │
  │ → Items chưa đo: dùng estimate!                   │
  │ → Scrollbar size có thể "nhảy" khi đo thêm!      │
  └────────────────────────────────────────────────────┘

  CÁCH 2: MEASURE → CellMeasurer (react-virtualized)
  ┌────────────────────────────────────────────────────┐
  │ Render OFFSCREEN → getBoundingClientRect()         │
  │ → Cache height → recompute offsets → re-render!   │
  │ → Chính xác nhất! Nhưng CHẬM nhất!               │
  │ → Layout thrashing risk!                           │
  └────────────────────────────────────────────────────┘

  CÁCH 3: HEADLESS → TanStack Virtual measureElement
  ┌────────────────────────────────────────────────────┐
  │ ResizeObserver theo dõi EACH rendered element!     │
  │ → Khi size change → auto update virtualizer!       │
  │ → Không cần 2-pass render!                        │
  │ → Hiện đại nhất, recommended!                      │
  └────────────────────────────────────────────────────┘

  ─────────────────────────────────────────────────────

  Q4: "Overscan — tại sao cần? Bao nhiêu là đủ?"
  A: → KHÔNG CÓ overscan:
  → User scroll 1px → item mới cần XUẤT HIỆN!
  → React render: ~5ms | Browser paint: ~3ms | Total: ~8ms
  → Trong 8ms đó: BLANK SPACE! = flickering!

  → CÓ overscan = 3:
  → Item ĐÃ SẴN SÀNG trong DOM (render trước!)
  → User scroll → item NGAY LẬP TỨC visible! Không flicker!

  → Bao nhiêu là đủ?
  ┌────────────────────────────────────────────────────┐
  │ overscan=0: flickering! ❌                         │
  │ overscan=1: OK cho slow scroll ⚠️                 │
  │ overscan=3: sweet spot cho hầu hết apps! ✅       │
  │ overscan=5: cho complex components ✅              │
  │ overscan=10: overkill → render quá nhiều! ⚠️      │
  │ overscan=20: BAD → 40 extra items! ❌              │
  └────────────────────────────────────────────────────┘

  FOLLOW-UP: "Directional overscan?"
  → react-window: overscan THÔNG MINH theo hướng scroll!
  → Scroll DOWN → overscan nhiều DƯỚI, ít TRÊN!
  → Scroll UP → overscan nhiều TRÊN, ít DƯỚI!
  → Lý do: user SẼ scroll tiếp cùng hướng!

  ─────────────────────────────────────────────────────

  Q5: "Absolute positioning vs relative — tại sao?"
  A: → ABSOLUTE:
  → Mỗi item: style.top = index × itemSize
  → Items KHÔNG PHỤ THUỘC thứ tự DOM!
  → Scroll: chỉ thay đổi WHICH items render!
  → Items mới: xuất hiện ở ĐÚNG vị trí ngay!
  → KHÔNG reflow nếu 1 item bị remove!

  → RELATIVE (bad):
  → Items phụ thuộc thứ tự!
  → Remove item 5 → item 6,7,8... reflow TOÀN BỘ!
  → Insert item → push down TẤT CẢ items sau!
  → O(n) reflow! ❌

  FOLLOW-UP: "Có thể dùng CSS Grid/Flexbox?"
  → KHÔNG hiệu quả cho virtualization!
  → Grid/Flexbox: items phụ thuộc lẫn nhau!
  → 1 item add/remove → browser recalculate TẤT CẢ!
  → Absolute: mỗi item HOÀN TOÀN độc lập!
  → Đây là lý do EVERY virtualization library dùng absolute!

  ─────────────────────────────────────────────────────

  Q6: "Style caching — tại sao tạo mới object là vấn đề?"
  A: → React shallow comparison:
  → prevProps.style === nextProps.style?
  → Object mới: { top: 35 } !== { top: 35 }! (reference khác!)
  → React: "props changed!" → RE-RENDER child component!
  → Chrome DevTools: "Why did this render?" → "style prop changed"

  → Cached style: styleCache[key] = { top: 35 }
  → prevProps.style === nextProps.style! (CÙNG reference!)
  → React: "props same!" → SKIP render! ✅

  FOLLOW-UP: "Memory concern?"
  → 10000 items × ~6 properties × ~50 bytes = ~300KB!
  → Con số NHỎ cho browser (thường có 1-4GB heap!)
  → Cache TOÀN BỘ = simpler code + better performance!
  → NẾU memory concern: LRU cache giới hạn 200 entries!

  ─────────────────────────────────────────────────────

  Q7: "ScrollSync — làm sao sync 2 scrollable panels?"
  A: → USE CASE: Excel-like spreadsheet!
  → Panel TRÁI (frozen columns) + Panel PHẢI (scrollable)!
  → Panel TRÊN (frozen headers) + Panel DƯỚI (scrollable body)!

  → CÁCH HOẠT ĐỘNG:
  ┌────────────────────────────────────────────────────┐
  │ <ScrollSync>                                       │
  │   {({ scrollLeft, scrollTop, onScroll }) => (      │
  │     <div>                                          │
  │       <Grid                    ← HEADER (scroll X) │
  │         scrollLeft={scrollLeft}                    │
  │       />                                           │
  │       <Grid                    ← BODY (scroll X+Y) │
  │         onScroll={onScroll}                        │
  │         scrollLeft={scrollLeft}                    │
  │         scrollTop={scrollTop}                      │
  │       />                                           │
  │     </div>                                         │
  │   )}                                               │
  │ </ScrollSync>                                      │
  │                                                    │
  │ → BODY scroll → onScroll update state!             │
  │ → HEADER receives scrollLeft → sync horizontal!   │
  │ → Kết quả: 2 panels LUÔN sync!                    │
  └────────────────────────────────────────────────────┘

  ─────────────────────────────────────────────────────

  Q8: "Alternatives hiện tại cho 2 thư viện này?"
  A: → Landscape 2024-2026:
  ┌────────────────────────────────────────────────────┐
  │ TanStack Virtual    │ Headless, 3KB, multi-framework│
  │ react-virtuoso      │ Auto-measure, chat support    │
  │ @tanstack/react-    │ Table + Virtual combo         │
  │   table + virtual   │                               │
  │ react-window        │ Simple, 5.4KB, stable         │
  │ react-virtualized   │ Full-featured, 34.7KB, mature │
  │ CSS content-        │ Browser native! No JS!        │
  │   visibility        │ (hạn chế control)             │
  │ CSS contain          │ Performance hint for browser  │
  └────────────────────────────────────────────────────┘

  → NEW project: TanStack Virtual!
  → EXISTING + simple: react-window!
  → EXISTING + complex: react-virtualized!
  → STATIC content: CSS content-visibility!
```

### Checklist — Comprehensive

**Core Virtualization:**

- [ ] Không render trực tiếp 1000+ items!
- [ ] FixedSizeList cho items cùng height!
- [ ] VariableSizeList cho dynamic height!
- [ ] FixedSizeGrid cho 2D data!
- [ ] Set overscanCount = 3-5 chống flickering!
- [ ] Luôn set key + style cho rendered items!

**Performance Optimization:**

- [ ] Memoize style objects (useRef cache)!
- [ ] React.memo cho Row/Cell components!
- [ ] requestAnimationFrame cho scroll handler!
- [ ] will-change: transform cho scroll container!
- [ ] Stable reference cho itemData (useRef/useMemo)!
- [ ] Binary search cho variable-size offset lookup!

**Advanced Components:**

- [ ] AutoSizer cho responsive width/height!
- [ ] InfiniteLoader cho lazy-load data (threshold-based)!
- [ ] Table: sticky header + virtualized body!
- [ ] Collection: sector map cho free-form layout!
- [ ] Masonry: shortest-column placement algorithm!
- [ ] WindowScroller cho single-scrollbar UX!
- [ ] ScrollSync cho multi-panel synchronization!

**Edge Cases:**

- [ ] Scroll restoration (initialScrollOffset)!
- [ ] RTL direction support!
- [ ] Keyboard accessibility (ArrowKeyStepper)!
- [ ] Dynamic itemCount (load more / filter)!
- [ ] Window resize → AutoSizer / ResizeObserver!
- [ ] Items với local state → lift state UP!

**CSS Alternative:**

- [ ] content-visibility: auto cho static lists!
- [ ] contain: layout style paint cho performance hints!

---

_Nguồn: patterns.dev — Addy Osmani_
_CSS-Tricks — "Creating More Efficient React Views with Windowing"_
_LogRocket — "Rendering Large Lists With React Virtualized"_
_react-window source code — Brian Vaughn_
_react-virtualized source code — Brian Vaughn_
_TanStack Virtual — Tanner Linsley_
_Cập nhật lần cuối: Tháng 2, 2026_
