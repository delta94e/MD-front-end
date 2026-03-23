# Frontend System Design: Financial Dashboard (Trading View)

**Tác giả:** Senior Frontend Engineer
**Phiên bản:** 1.0
**Ngày:** Tháng 3, 2026
**Đối tượng:** Senior Engineers, System Design Interview Preparation

---

## Table of Contents

1. [Tổng Quan Bài Toán & Yêu Cầu](#1-tổng-quan-bài-toán--yêu-cầu)
2. [Mockup & Giao Diện](#2-mockup--giao-diện)
3. [Layout Design — Thiết Kế Bố Cục](#3-layout-design--thiết-kế-bố-cục)
4. [Data & Property Model — Mô Hình Dữ Liệu](#4-data--property-model--mô-hình-dữ-liệu)
5. [Data Storage — Lưu Trữ Dữ Liệu](#5-data-storage--lưu-trữ-dữ-liệu)
6. [Storage Requirements — Ước Tính Dung Lượng](#6-storage-requirements--ước-tính-dung-lượng)
7. [Data Upsampling & Downsampling](#7-data-upsampling--downsampling)
8. [API Design — Thiết Kế API](#8-api-design--thiết-kế-api)
9. [Multi-Window Support — Hỗ Trợ Đa Cửa Sổ](#9-multi-window-support--hỗ-trợ-đa-cửa-sổ)
10. [Script Phỏng Vấn 90 Phút](#10-script-phỏng-vấn-90-phút)

---

## 1. Tổng Quan Bài Toán & Yêu Cầu

### 1.1 Mô Tả Bài Toán

Thiết kế một **Financial Dashboard** (bảng điều khiển tài chính) tương tự **TradingView** — nền tảng cho phép người dùng theo dõi nhiều biểu đồ tài chính (cổ phiếu, crypto, forex...) trên cùng một màn hình.

**Các thách thức cốt lõi:**

- **Layout phức tạp**: Hỗ trợ nhiều chart resizable trên cùng một canvas
- **Dữ liệu khổng lồ**: Hàng triệu data points cho mỗi asset trong các khung thời gian khác nhau
- **Real-time updates**: Dữ liệu tài chính cần cập nhật liên tục, độ trễ thấp
- **Đồng bộ hóa**: Synchronization giữa các chart (theo asset, time frame)
- **Multi-monitor**: Mở rộng ứng dụng sang nhiều cửa sổ/màn hình
- **Legacy API**: Thống nhất nhiều nguồn dữ liệu khác nhau dưới một interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FINANCIAL DASHBOARD                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐                    │
│  │    AAPL (Apple)       │  │    TSLA (Tesla)       │                    │
│  │  ┌──────────────────┐ │  │  ┌──────────────────┐ │                    │
│  │  │  ╱╲    ╱╲       │ │  │  │     ╱╲  ╱╲      │ │                    │
│  │  │ ╱  ╲  ╱  ╲  ╱╲  │ │  │  │ ╱╲ ╱  ╲╱  ╲    │ │                    │
│  │  │╱    ╲╱    ╲╱  ╲ │ │  │  │╱  ╲       ╲╱╲ │ │                    │
│  │  └──────────────────┘ │  │  └──────────────────┘ │                    │
│  │  1H  4H  1D  1W  1M  │  │  1H  4H  1D  1W  1M  │                    │
│  └──────────────────────┘  └──────────────────────┘                    │
│                                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐                    │
│  │    GOOG (Google)      │  │    META (Facebook)    │                    │
│  │  ┌──────────────────┐ │  │  ┌──────────────────┐ │                    │
│  │  │    ╱╲            │ │  │  │  ╱╲    ╱╲       │ │                    │
│  │  │   ╱  ╲  ╱╲  ╱╲  │ │  │  │ ╱  ╲  ╱  ╲ ╱╲  │ │                    │
│  │  │  ╱    ╲╱  ╲╱  ╲ │ │  │  │╱    ╲╱    ╲╱  ╲ │ │                    │
│  │  └──────────────────┘ │  │  └──────────────────┘ │                    │
│  │  1H  4H  1D  1W  1M  │  │  1H  4H  1D  1W  1M  │                    │
│  └──────────────────────┘  └──────────────────────┘                    │
│                                                                         │
│  [Sync: Asset ID ✓] [Sync: Interval ✓] [Layout: 2x2]                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Yêu Cầu Sản Phẩm (Product Requirements)

| STT | Yêu cầu | Mô tả chi tiết |
|-----|---------|-----------------|
| 1 | **Multiple Resizable Charts** | Nhiều chart trên cùng dashboard, user có thể resize từng chart |
| 2 | **Configurable Grid Layout** | User chọn layout (2x2, 3x3, 6x6...) theo ý muốn |
| 3 | **Unified Data Interface** | Dữ liệu từ nhiều API khác nhau nhưng cùng một format |
| 4 | **Extensible Chart Types** | Mỗi chart type (line, candle, bar, pie) có data model riêng |
| 5 | **Generic Server Model** | Server trả về data format chung, chart tự transform |
| 6 | **Chart Synchronization** | Đồng bộ theo Asset ID, Interval giữa các chart |

### 1.3 Yêu Cầu Kỹ Thuật (Non-Product Requirements)

| Yêu cầu | Mô tả | Tại sao quan trọng |
|----------|-------|---------------------|
| **Network Performance** | Tối ưu data loading, cache browser | Lượng data khổng lồ đổ vào browser |
| **Rendering Stability** | Hiển thị partial data khi chuyển time frame | UX mượt mà khi chờ data mới |
| **Legacy API Unified** | 1 interface cho nhiều API endpoints | Developer dùng 1 method cho tất cả |
| **Modern Browser** | Chỉ cần hỗ trợ trình duyệt hiện đại | Trader dùng máy tính chuyên nghiệp |

> **Giải thích thêm về Rendering Stability**: Khi user chuyển time frame từ 1 ngày sang 1 giờ, thay vì hiển thị màn hình trống trong khi chờ data mới, ta có thể **downscale** data cũ để hiển thị tạm — giúp chart luôn có nội dung, tạo trải nghiệm mượt mà.

---

## 2. Mockup & Giao Diện

Dashboard có thiết kế dạng **column/grid** cho phép đặt nhiều chart, mỗi chart có thể chiếm bất kỳ vùng nào trên grid:

```
┌─────────────────────────────────────────────────────────────────┐
│                        DASHBOARD CANVAS                          │
├────────┬────────┬────────┬────────┬────────┬────────┬──────────┤
│        │        │        │        │        │        │          │
│  0,0   │  1,0   │  2,0   │  3,0   │  4,0   │  5,0   │  ...     │
│        │        │        │        │        │        │          │
├────────┼────────┼────────┼────────┼────────┼────────┼──────────┤
│        │████████│████████│        │        │        │          │
│  0,1   │█CHART █│█  A   █│  3,1   │  4,1   │  5,1   │  ...     │
│        │████████│████████│        │        │        │          │
├────────┼────────┼────────┼────────┼────────┼────────┼──────────┤
│        │████████│████████│        │        │        │          │
│  0,2   │█CHART █│█  A   █│  3,2   │  4,2   │  5,2   │  ...     │
│        │████████│████████│        │        │        │          │
├────────┼────────┼────────┼────────┼────────┼────────┼──────────┤
│        │        │        │████████│████████│████████│          │
│  0,3   │  1,3   │  2,3   │█CHART █│█      █│█  B   █│  ...     │
│        │        │        │████████│████████│████████│          │
└────────┴────────┴────────┴────────┴────────┴────────┴──────────┘

Chart A: grid-column: 1/3, grid-row: 1/3  (chiếm 2 cột x 2 hàng)
Chart B: grid-column: 3/6, grid-row: 3/4  (chiếm 3 cột x 1 hàng)
```

**Đặc điểm:**
- Mỗi chart có thể chiếm bất kỳ vùng trống nào trên grid
- User có thể cấu hình số lượng cột/hàng (vd: 6x6, 8x8, 12x12)
- Hỗ trợ drag & drop để đặt chart lên canvas
- Resize từng chart bằng cách thay đổi grid span

---

## 3. Layout Design — Thiết Kế Bố Cục

### 3.1 Tại Sao Chọn CSS Grid?

Đây là **quyết định kiến trúc quan trọng nhất** cho layout. So sánh các phương án:

| Phương án | Pros | Cons | Phù hợp? |
|-----------|------|------|-----------|
| **CSS Grid** | Natural grid system, overlap support, responsive | Cần modern browser | ✅ Tốt nhất |
| **Flexbox** | Linh hoạt, hỗ trợ rộng | Không phải grid tự nhiên, overlap khó | ❌ Không phù hợp |
| **Absolute Positioning** | Kiểm soát tuyệt đối | Phức tạp, khó responsive | ❌ Quá phức tạp |
| **Canvas** | Performance tốt | Mất accessibility, khó tương tác | ❌ Overkill |

**Kết luận**: CSS Grid là lựa chọn tối ưu vì:
1. CSS Grid **tự nhiên** là một hệ thống grid — đúng với nhu cầu bài toán
2. Hỗ trợ **overlap** (đặt nhiều phần tử cùng vị trí grid) — cần cho sandwich design
3. User trading desk dùng trình duyệt hiện đại → không lo tương thích

### 3.2 Sandwich Design — Thiết Kế 3 Lớp

Đây là khái niệm cốt lõi cho việc đặt chart lên grid. Gọi là "sandwich" vì ta dùng **3 lớp chồng lên nhau**:

```
┌─────────────────────────────────────────────────────────────┐
│                    SANDWICH DESIGN                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 3 (Trên cùng):  CHART CONTENT LAYER                  │
│  ┌─────────────────────────────────┐                         │
│  │  ████████████████████████████   │  ← Chart thực tế        │
│  │  █  Line Chart / Candle     █   │    được đặt trên grid   │
│  │  ████████████████████████████   │    bằng grid-column/row │
│  └─────────────────────────────────┘                         │
│                    ↕ (overlap)                                │
│  Layer 2 (Giữa):   CELL GRID LAYER (Drag & Drop)            │
│  ┌──────┬──────┬──────┬──────┐                               │
│  │ cell │ cell │ cell │ cell │     ← Mỗi cell lắng nghe     │
│  ├──────┼──────┼──────┼──────┤       sự kiện drag/drop      │
│  │ cell │ cell │ cell │ cell │       và có data attributes    │
│  ├──────┼──────┼──────┼──────┤       (data-col, data-row)    │
│  │ cell │ cell │ cell │ cell │                               │
│  └──────┴──────┴──────┴──────┘                               │
│                    ↕ (overlap)                                │
│  Layer 1 (Dưới cùng): GRID CONTAINER LAYER                  │
│  ┌─────────────────────────────────┐                         │
│  │  display: grid                  │  ← Container CSS Grid   │
│  │  grid-template-columns: ...     │    tạo ra hệ thống      │
│  │  grid-template-rows: ...        │    lưới                  │
│  └─────────────────────────────────┘                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Triển Khai CSS Grid Container

**Bước 1: Tạo Grid Container (Layer 1)**

```css
/* Layer 1: Grid Container */
.dashboard-grid {
  display: grid;
  /* Số cột/hàng do user cấu hình */
  /* Ví dụ: grid 6 cột x 4 hàng, mỗi ô bằng nhau */
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(4, 1fr);
  width: 100%;
  height: 100vh;
  position: relative;
}
```

```javascript
/**
 * Tạo grid container với số cột/hàng tùy chỉnh
 * @param {number} columns - Số cột
 * @param {number} rows - Số hàng
 */
function createGridContainer(columns, rows) {
  const container = document.createElement('div');
  container.className = 'dashboard-grid';
  container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  return container;
}
```

**Bước 2: Tạo Cell Grid (Layer 2)**

Mỗi cell là một container nhỏ, có **data attributes** để xác định vị trí:

```javascript
/**
 * Tạo tất cả cell cho grid
 * Mỗi cell có data-col và data-row để xác định vị trí khi drop
 */
function createCellGrid(container, columns, rows) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      // Data attributes — dùng để xác định vị trí khi drag & drop
      cell.dataset.column = col;
      cell.dataset.row = row;
      container.appendChild(cell);
    }
  }
}
```

```css
/* Layer 2: Cell nhận sự kiện drag */
.grid-cell {
  border: 1px dashed rgba(255, 255, 255, 0.1);
  /* Cell nằm chồng lên trên grid container */
  /* nhưng bên dưới chart content */
  z-index: 1;
}

.grid-cell:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}
```

**Bước 3: Đặt Chart lên Grid (Layer 3)**

```javascript
/**
 * Đặt chart container lên grid tại vị trí xác định
 * @param {HTMLElement} chartElement - Chart cần đặt
 * @param {number} colStart - Cột bắt đầu
 * @param {number} colEnd - Cột kết thúc
 * @param {number} rowStart - Hàng bắt đầu
 * @param {number} rowEnd - Hàng kết thúc
 */
function placeChartOnGrid(chartElement, colStart, colEnd, rowStart, rowEnd) {
  // CSS Grid dùng 1-indexed cho grid lines
  chartElement.style.gridColumn = `${colStart + 1} / ${colEnd + 1}`;
  chartElement.style.gridRow = `${rowStart + 1} / ${rowEnd + 1}`;
  // Chart nằm trên cùng, phía trên cell grid
  chartElement.style.zIndex = '2';
}
```

```css
/* Layer 3: Chart content */
.chart-container {
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 16px;
  z-index: 2;
  overflow: hidden;
}
```

### 3.4 Drag & Drop — Kéo Thả Chart

**Nguyên lý hoạt động:**

```
User kéo chart     Cell nhận sự kiện     Lấy vị trí từ        Gán CSS Grid
từ toolbar    →    drop (dragend)    →   data attributes  →   column/row
                                         (data-col, data-row)
```

**Tại sao dùng Event Delegation (Event Bubbling)?**

Thay vì gán **64 handlers** cho từng cell (grid 8×8), ta chỉ cần **1 handler** trên container cha:

```javascript
/**
 * CÁCH SAI — Gán handler cho từng cell
 * Grid 8x8 = 64 handlers → tốn bộ nhớ, chậm
 */
// ❌ KHÔNG NÊN
// cells.forEach(cell => {
//   cell.addEventListener('drop', handleDrop);
//   cell.addEventListener('dragover', handleDragOver);
// });

/**
 * CÁCH ĐÚNG — Event Delegation
 * 1 handler duy nhất trên container cha
 * Sự kiện bubble lên từ cell → container
 */
function setupDragAndDrop(gridContainer) {
  // Cho phép drop (mặc định browser chặn drop)
  gridContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  // Chỉ 1 handler cho TOÀN BỘ grid
  gridContainer.addEventListener('drop', (e) => {
    e.preventDefault();

    // e.target = cell mà user thả chart vào
    const targetCell = e.target.closest('.grid-cell');
    if (!targetCell) return;

    // Lấy vị trí từ data attributes
    const col = parseInt(targetCell.dataset.column);
    const row = parseInt(targetCell.dataset.row);

    // Lấy chart ID từ dữ liệu drag
    const chartId = e.dataTransfer.getData('text/plain');

    // Đặt chart — mặc định chiếm 2 cột x 2 hàng
    const chartElement = document.getElementById(chartId);
    placeChartOnGrid(chartElement, col, col + 2, row, row + 2);
  });
}
```

> **Tại sao Event Delegation hiệu quả hơn?**
> - **Bộ nhớ**: 1 handler thay vì N×M handlers
> - **Dynamic elements**: Cell thêm/xóa thì không cần gán lại handler
> - **Performance**: Ít event listeners = browser xử lý nhanh hơn
> - **Nguyên lý**: Mọi DOM event đều **bubble** từ con lên cha → cha bắt được hết

### 3.5 Resize Chart

Khi user muốn thay đổi kích thước chart, ta chỉ cần **cập nhật CSS Grid properties**:

```javascript
/**
 * Resize chart bằng cách thay đổi grid-column và grid-row
 */
function resizeChart(chartElement, newColStart, newColEnd, newRowStart, newRowEnd) {
  chartElement.style.gridColumn = `${newColStart + 1} / ${newColEnd + 1}`;
  chartElement.style.gridRow = `${newRowStart + 1} / ${newRowEnd + 1}`;
}

// Ví dụ: Mở rộng chart từ 2x2 thành 3x3
// Trước:  grid-column: 1/3, grid-row: 1/3
// Sau:    grid-column: 1/4, grid-row: 1/4
resizeChart(chartElement, 0, 3, 0, 3);
```

### 3.6 Tóm Tắt Layout Design

```
┌────────────────────────────────────────────────────────────┐
│                 LAYOUT DESIGN SUMMARY                       │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CSS Grid ← Hệ thống grid tự nhiên, hỗ trợ overlap      │
│                                                              │
│  2. Sandwich Design (3 layers):                              │
│     • Layer 1: Grid Container (display: grid)                │
│     • Layer 2: Cell Grid (lắng nghe drag & drop events)      │
│     • Layer 3: Chart Content (nội dung thực tế)              │
│                                                              │
│  3. Event Delegation:                                        │
│     • 1 handler trên container thay vì N handler trên cells  │
│     • Sử dụng data attributes trên mỗi cell                 │
│                                                              │
│  4. Placement & Resize:                                      │
│     • grid-column: start / end                               │
│     • grid-row: start / end                                  │
│     • Chỉ cần thay đổi CSS properties                       │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Data & Property Model — Mô Hình Dữ Liệu

### 4.1 Component Hierarchy — Phân Cấp Component

Hệ thống gồm 3 lớp component, mỗi lớp đảm nhận một trách nhiệm riêng biệt:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPONENT HIERARCHY                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────┐                                       │
│  │     DRAGGABLE             │  ← Xử lý logic drag & drop           │
│  │     Container             │     KHÔNG biết gì về data             │
│  └───────────┬───────────────┘                                       │
│              │                                                        │
│  ┌───────────▼───────────────┐                                       │
│  │     DASHBOARD             │  ← Xử lý fetch data từ API           │
│  │     Component             │     Biết cần lấy data gì             │
│  │  (asset, range, interval) │     Format data thống nhất            │
│  └───────────┬───────────────┘                                       │
│              │                                                        │
│  ┌───────────▼───────────────┐                                       │
│  │     CHART                 │  ← Biết cách transform data          │
│  │     Element               │     thành visual (line, candle...)    │
│  │  (transformer function)   │                                       │
│  └───────────────────────────┘                                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Interface — Giao Diện Dữ Liệu

Tất cả data từ server đều tuân theo **một format duy nhất**:

```javascript
/**
 * TData — Format dữ liệu thống nhất từ server
 *
 * Tại sao cần thống nhất?
 * → Dù có 5 API khác nhau (legacy, mới...), tất cả đều trả về cùng format
 * → Developer chỉ cần viết 1 hàm fetch, không cần biết API nào đang dùng
 */

/**
 * @typedef {Object} TData
 * @property {string} asset - Mã tài sản (VD: "AAPL", "TSLA", "BTC")
 * @property {number} start - Timestamp bắt đầu (milliseconds)
 * @property {number} end - Timestamp kết thúc (milliseconds)
 * @property {string} interval - Khung thời gian ("1m", "5m", "1h", "1d")
 * @property {Array<{open: number, close: number}>} points - Danh sách điểm dữ liệu
 */

// Ví dụ dữ liệu thực tế
const sampleData = {
  asset: "AAPL",
  start: 1710374400000,   // 2025-03-14 00:00 UTC
  end: 1710460800000,     // 2025-03-15 00:00 UTC
  interval: "1h",          // Mỗi point = 1 giờ
  points: [
    { open: 171.50, close: 172.30 },  // 00:00 - 01:00
    { open: 172.30, close: 171.80 },  // 01:00 - 02:00
    { open: 171.80, close: 173.00 },  // 02:00 - 03:00
    // ... 24 points cho 1 ngày với interval 1h
  ]
};
```

### 4.3 Chart Element Interface — Transformer Pattern

Mỗi loại chart **tự biết** cách biến đổi (transform) data chung thành format riêng:

```javascript
/**
 * TChartElement<T> — Interface cho mọi loại chart
 * 
 * T = kiểu data riêng của chart đó
 * transformer = hàm biến đổi TData (chung) → T (riêng)
 * 
 * Tại sao dùng pattern này?
 * → Server chỉ cần trả 1 format
 * → Thêm chart mới chỉ cần viết transformer mới
 * → Dashboard component không cần biết chart hiển thị gì
 */

// --- Line Chart ---
// Data riêng: chỉ cần mảng số (close prices)
function lineChartTransformer(sourceData) {
  return sourceData.points.map(point => point.close);
  // Input:  [{ open: 171.5, close: 172.3 }, ...]
  // Output: [172.3, 171.8, 173.0, ...]
}

// --- Candlestick Chart ---
// Data riêng: cần cả open, close, high, low
function candleChartTransformer(sourceData) {
  return sourceData.points.map(point => ({
    open: point.open,
    close: point.close,
    color: point.close >= point.open ? '#00c853' : '#ff1744'
  }));
}

// --- Data Table ---
// Data riêng: mảng objects với header
function dataTableTransformer(sourceData) {
  return {
    headers: ['Time', 'Open', 'Close', 'Change'],
    rows: sourceData.points.map((point, i) => ({
      time: new Date(sourceData.start + i * intervalToMs(sourceData.interval)),
      open: point.open,
      close: point.close,
      change: ((point.close - point.open) / point.open * 100).toFixed(2) + '%'
    }))
  };
}
```

### 4.4 Dashboard Component Interface

Dashboard component kết hợp data và chart:

```javascript
/**
 * TDashboardComponent — Cấu hình cho mỗi ô trên dashboard
 * 
 * Chứa:
 * - range: khoảng thời gian hiển thị (start, end)
 * - asset: mã tài sản
 * - interval: khung thời gian
 * - component: loại chart (line, candle, pie...)
 * - render: hàm custom render (optional)
 */
function createDashboardComponent(config) {
  return {
    // State — thay đổi khi user tương tác
    range: {
      start: config.start || Date.now() - 24 * 60 * 60 * 1000,
      end: config.end || Date.now()
    },
    asset: config.asset || 'AAPL',
    interval: config.interval || '1h',
    
    // Loại chart
    chartType: config.chartType || 'candlestick',
    
    // Transformer tương ứng
    transformer: config.transformer || candleChartTransformer,
    
    // Fetch data và transform
    async fetchAndRender() {
      const rawData = await getData(this.asset, this.range.start, this.range.end, this.interval);
      const chartData = this.transformer(rawData);
      return chartData;
    }
  };
}
```

```
┌─────────────────────────────────────────────────────────────────┐
│              DATA FLOW: Server → Chart                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Server API                Dashboard              Chart           │
│  ┌──────────┐             Component           ┌──────────┐      │
│  │          │   TData     ┌──────────┐        │          │      │
│  │  Legacy  │──────────→ │          │ T      │  Line    │      │
│  │  API 1   │            │  Fetch   │──────→ │  Chart   │      │
│  │          │            │  Data    │        │          │      │
│  ├──────────┤            │          │        ├──────────┤      │
│  │  New     │──────────→ │  Apply   │ T      │ Candle   │      │
│  │  API 2   │   TData    │  Trans-  │──────→ │  Chart   │      │
│  │          │            │  former  │        │          │      │
│  ├──────────┤            │          │        ├──────────┤      │
│  │  API 3   │──────────→ │          │ T      │  Table   │      │
│  │  ...     │   TData    └──────────┘──────→ │          │      │
│  └──────────┘                                 └──────────┘      │
│                                                                   │
│  Tất cả API trả        Dashboard dùng          Mỗi chart có     │
│  về cùng TData       transformer để chuyển    format riêng (T)   │
│                      TData → format riêng                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Storage — Lưu Trữ Dữ Liệu

### 5.1 Hai Lựa Chọn Lưu Trữ

Khi dữ liệu tài chính rất lớn (hàng trăm nghìn data points), ta cần quyết định **lưu ở đâu**:

| Phương án | Ưu điểm | Nhược điểm | Khi nào dùng |
|-----------|---------|-------------|--------------|
| **Global State** (RAM) | Truy cập nhanh, reactive | Giới hạn bộ nhớ, mất khi refresh | Data nhỏ, cần reactive |
| **IndexedDB** (Disk) | 2GB/domain, persist, có key index | Truy cập chậm hơn RAM | Data lớn, cần cache |

**Kết luận**: Dùng **cả hai** — IndexedDB làm persistent cache, Global State cho data đang hiển thị:

```
┌──────────────────────────────────────────────────────────────┐
│                    DATA STORAGE FLOW                          │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Server ──→ IndexedDB ──→ Global State ──→ Chart Render       │
│  (fetch)    (cache lâu     (cache tạm,     (hiển thị)         │
│              dài trên       reactive,                          │
│              đĩa cứng)     trong RAM)                         │
│                                                                │
│  Khi cần data:                                                 │
│  1. Kiểm tra Global State → có? → dùng luôn                  │
│  2. Kiểm tra IndexedDB → có? → load vào Global State → dùng  │
│  3. Cả hai không có → fetch từ Server → lưu IndexedDB → dùng │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Bucketing — Chia Dữ Liệu Thành Bucket

**Vấn đề**: Nếu lưu từng data point riêng lẻ trong IndexedDB, tra cứu rất chậm (O(n) scan).

**Giải pháp**: Nhóm data points thành **bucket** (xô chứa) theo thời gian:

```
┌────────────────────────────────────────────────────────────┐
│            BUCKETING CONCEPT                                │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  KHÔNG DÙNG BUCKET (3,600 points cho 1 giờ):                │
│  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─ ... ─┬─┐     │
│  │p│p│p│p│p│p│p│p│p│p│p│p│p│p│p│p│p│p│p│p│     │p│     │
│  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─ ... ─┴─┘     │
│  → Scan 3,600 records trong IndexedDB = CHẬM!               │
│                                                              │
│  DÙNG BUCKET 5 phút (chỉ 12 buckets cho 1 giờ):            │
│  ┌──────────┐┌──────────┐┌──────────┐     ┌──────────┐     │
│  │ Bucket 0 ││ Bucket 1 ││ Bucket 2 │ ... │Bucket 11 │     │
│  │ 300 pts  ││ 300 pts  ││ 300 pts  │     │ 300 pts  │     │
│  │ 0-5min   ││ 5-10min  ││ 10-15min │     │ 55-60min │     │
│  └──────────┘└──────────┘└──────────┘     └──────────┘     │
│  → Chỉ cần đọc 12 records = NHANH!                          │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### 5.3 Compound Key — Khóa Ghép

Để tra cứu nhanh trong IndexedDB, ta dùng **compound key** gồm 3 phần:

```javascript
/**
 * Compound Key Structure:
 * [assetId, bucketId, timeFrame]
 *
 * assetId:   Mã tài sản (VD: "AAPL")
 * bucketId:  ID của bucket (tính từ timestamp)
 * timeFrame: Khung thời gian bucket ("5m", "1h", "1d")
 */

// Công thức tính bucketId:
// bucketId = Math.floor(currentTimestamp / bucketDuration)

function calculateBucketId(timestamp, bucketDurationMs) {
  return Math.floor(timestamp / bucketDurationMs);
}

// Ví dụ:
// timestamp = 300001ms, bucketDuration = 300000ms (5 phút)
// bucketId = Math.floor(300001 / 300000) = 1  → Bucket 1

// Các time frame bucket:
const BUCKET_DURATIONS = {
  '5m':  5 * 60 * 1000,       // 300,000 ms
  '1h':  60 * 60 * 1000,      // 3,600,000 ms
  '1d':  24 * 60 * 60 * 1000, // 86,400,000 ms
};
```

### 5.4 IndexedDB Implementation

```javascript
/**
 * Tạo IndexedDB store với compound key index
 * Không dùng thư viện — viết bằng tay hoàn toàn
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FinancialDashboard', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Tạo object store với compound key path
      const store = db.createObjectStore('marketData', {
        keyPath: ['asset', 'bucketId', 'timeFrame']
      });

      // Index phụ để query theo asset
      store.createIndex('by_asset', 'asset', { unique: false });
      // Index phụ để query theo time frame
      store.createIndex('by_timeframe', 'timeFrame', { unique: false });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Lưu bucket vào IndexedDB
 */
async function saveBucket(db, asset, bucketId, timeFrame, points) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('marketData', 'readwrite');
    const store = tx.objectStore('marketData');

    store.put({
      asset,
      bucketId,
      timeFrame,
      points,
      updatedAt: Date.now()
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Đọc dữ liệu theo khoảng thời gian
 * Chỉ cần đọc N buckets thay vì hàng nghìn points
 */
async function getDataRange(db, asset, startTime, endTime, timeFrame) {
  const bucketDuration = BUCKET_DURATIONS[timeFrame];
  const startBucket = calculateBucketId(startTime, bucketDuration);
  const endBucket = calculateBucketId(endTime, bucketDuration);

  const results = [];
  const tx = db.transaction('marketData', 'readonly');
  const store = tx.objectStore('marketData');

  for (let bucketId = startBucket; bucketId <= endBucket; bucketId++) {
    const key = [asset, bucketId, timeFrame];
    const request = store.get(key);

    await new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result) {
          results.push(...request.result.points);
        }
        resolve();
      };
    });
  }

  return results;
}
```

---

## 6. Storage Requirements — Ước Tính Dung Lượng

### 6.1 Kích Thước Từng Thành Phần

| Thành phần | Kiểu dữ liệu | Kích thước | Ghi chú |
|------------|---------------|------------|---------|
| `asset` (key) | String | 8 bytes | Worst case 8 ký tự (VD: "MSFT    ") |
| `open` (giá mở) | Number | 4 bytes | Float 32-bit |
| `close` (giá đóng) | Number | 4 bytes | Float 32-bit |
| `bucketId` | Number | 4 bytes | Integer 32-bit |
| `timeFrame` | String | 2 bytes | Tối đa 2 ký tự ("5m", "1h", "1d") |
| **1 point** | `{open, close}` | **8 bytes** | 4 + 4 |

### 6.2 Tính Toán Cho 1 Ngày

```
Giả sử: worst case = 1 data point mỗi giây (1s interval)

Số points/ngày = 24h × 60m × 60s = 86,400 points

Dung lượng = 86,400 × 8 bytes = 691,200 bytes ≈ 0.7 MB/asset/ngày
```

### 6.3 Tính Toán Cho 1 Năm

```
Dung lượng/năm = 0.7 MB × 365 = 255 MB/asset/năm

→ Vẫn NẰM TRONG giới hạn 2GB của IndexedDB
→ Thực tế: hiếm khi dùng interval 1s cho cả năm
→ Interval 1h cho 1 năm = 8,760 points = ~70 KB (rất nhỏ!)
```

### 6.4 Số Buckets Cần Thiết

```
Với bucket 5 phút:
  Số bucket/ngày = 1440 phút ÷ 5 = 288 buckets
  Số points/bucket = 86,400 ÷ 288 ≈ 300 points

Với bucket 1 giờ:
  Số bucket/ngày = 24 buckets
  Số points/bucket = 86,400 ÷ 24 = 3,600 points

Với bucket 1 ngày:
  Số bucket/năm = 365 buckets
  Số points/bucket = 86,400 points (1 ngày đầy đủ)
```

```
┌──────────────────────────────────────────────────────────────┐
│            TRADEOFF: Bucket Size vs Query Efficiency          │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Bucket nhỏ (5 phút):                                         │
│  ✅ Ít data mỗi bucket (300 points) → load nhanh              │
│  ❌ Nhiều buckets → nhiều lần query IndexedDB                  │
│                                                                │
│  Bucket lớn (1 ngày):                                         │
│  ✅ Ít buckets → ít lần query                                  │
│  ❌ Nhiều data mỗi bucket → load chậm nếu chỉ cần 1 phần     │
│                                                                │
│  → Giải pháp: Lưu NHIỀU time frame bucket cùng lúc!          │
│     5m bucket: cho hiển thị ngắn hạn (intraday)               │
│     1h bucket: cho hiển thị trung hạn (tuần/tháng)            │
│     1d bucket: cho hiển thị dài hạn (năm)                     │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

> **Tip giảm tải IndexedDB**: Giảm `durability` của transaction xuống `"relaxed"` — IndexedDB sẽ tăng throughput nhưng có thể mất 1% data nếu browser crash. Với dữ liệu tài chính (có thể fetch lại), đây là tradeoff chấp nhận được.

```javascript
// Giảm durability cho throughput cao hơn
const tx = db.transaction('marketData', 'readwrite', { durability: 'relaxed' });
```

---

## 7. Data Upsampling & Downsampling

### 7.1 Downsampling — Từ Granular → Tổng Quan

**Tình huống**: Đang có data 5 phút (rất chi tiết), user muốn xem time frame 1 giờ.

**Giải pháp**: Không cần fetch lại! Gộp 12 bucket 5 phút thành 1 point 1 giờ:

```
5 phút (granular):
┌────────┐┌────────┐┌────────┐        ┌────────┐
│Bucket 0││Bucket 1││Bucket 2│  ...   │Bucket11│
│300 pts ││300 pts ││300 pts │        │300 pts │
└────────┘└────────┘└────────┘        └────────┘
    │                                      │
    │    GỘP LẠI (downsampling)           │
    ▼                                      ▼
┌──────────────────────────────────────────────┐
│              1 POINT (1 giờ)                  │
│  open  = bucket[0].points[0].open            │
│  close = bucket[11].points[last].close       │
└──────────────────────────────────────────────┘
```

```javascript
/**
 * Downsampling: Gộp nhiều bucket nhỏ thành 1 point lớn
 * 
 * Đặc điểm: LOSSLESS (không mất data)
 * → open lấy từ point ĐẦU TIÊN của bucket đầu tiên
 * → close lấy từ point CUỐI CÙNG của bucket cuối cùng
 * → Tiết kiệm network request!
 */
function downsample(buckets) {
  if (buckets.length === 0) return null;

  const firstBucket = buckets[0];
  const lastBucket = buckets[buckets.length - 1];

  return {
    open: firstBucket.points[0].open,
    close: lastBucket.points[lastBucket.points.length - 1].close,
  };
}

// Ví dụ: 12 bucket 5 phút → 1 point 1 giờ
const hourlyPoint = downsample(fiveMinuteBuckets.slice(0, 12));
// { open: 171.50, close: 173.20 }
```

### 7.2 Upsampling — Từ Tổng Quan → Chi Tiết

**Tình huống**: Đang có data 1 giờ, user muốn xem time frame 5 phút.

**Vấn đề**: Không thể tạo data chính xác từ data ít chi tiết hơn → **CẦN FETCH TỪ SERVER**.

**Giải pháp tạm**: Trong khi chờ server trả data, tạo **placeholder** để chart không hiện trống:

```
1 giờ (tổng quan):
┌──────────────────────────────────────────────┐
│              1 POINT (1 giờ)                  │
│  open = 171.50, close = 173.20               │
└──────────────────────────────────────────────┘
    │
    │  UPSAMPLING (tạo placeholder)
    ▼
┌─────┐┌─────┐┌─────┐┌─────┐        ┌─────┐
│ P0  ││ P1  ││ P2  ││ P3  │  ...   │ P11 │
│171.5││171.5││171.5││171.5│        │171.5│  ← Tất cả đều duplicate!
│173.2││173.2││173.2││173.2│        │173.2│     Chỉ là placeholder
└─────┘└─────┘└─────┘└─────┘        └─────┘

→ Chart hiển thị ĐƯỜNG THẲNG (không chính xác)
→ Nhưng TỐT HƠN hiện màn TRỐNG
→ Khi data thật đến → thay thế placeholder
```

```javascript
/**
 * Upsampling: Tạo placeholder từ data ít chi tiết
 * 
 * Đặc điểm: LOSSY (mất thông tin, chỉ là placeholder)
 * → Dùng tạm trong khi chờ fetch data thật từ server
 * → Chart hiển thị đường phẳng thay vì trống rỗng
 */
function upsample(singlePoint, numBuckets) {
  const placeholderBuckets = [];

  for (let i = 0; i < numBuckets; i++) {
    placeholderBuckets.push({
      points: [{
        open: singlePoint.open,
        close: singlePoint.close,
      }],
      isPlaceholder: true  // Đánh dấu để UI biết đây là tạm
    });
  }

  return placeholderBuckets;
}

// Ví dụ: 1 point 1 giờ → 12 placeholder buckets 5 phút
const placeholders = upsample(hourlyPoint, 12);

// Đồng thời fetch data thật
fetchRealData(asset, '5m').then(realData => {
  replacePlaceholders(realData);  // Thay thế khi data thật đến
});
```

### 7.3 So Sánh Downsampling vs Upsampling

| | Downsampling | Upsampling |
|--|--|--|
| **Hướng** | Chi tiết → Tổng quan | Tổng quan → Chi tiết |
| **Chất lượng** | ✅ Lossless (chính xác) | ❌ Lossy (chỉ placeholder) |
| **Cần server?** | ❌ Không | ✅ Có (để lấy data thật) |
| **Mục đích** | Tiết kiệm network request | UX: hiển thị tạm khi loading |

---

## 8. API Design — Thiết Kế API

### 8.1 Unified Data Interface

Bất kể dùng API nào phía dưới, developer chỉ thấy **1 interface**:

```javascript
/**
 * getData — Interface thống nhất cho tất cả API endpoints
 * 
 * @param {string} assetId - Mã tài sản ("AAPL", "BTC")
 * @param {number} start - Timestamp bắt đầu
 * @param {number} end - Timestamp kết thúc
 * @param {string} timeFrame - Interval ("5m", "1h", "1d")
 * @returns {Promise<TData>} - Data theo format thống nhất
 */
async function getData(assetId, start, end, timeFrame) {
  // Chọn API dựa trên config/routing
  const apiEndpoint = selectApiEndpoint(assetId);
  
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    body: JSON.stringify({ assetId, start, end, timeFrame })
  });
  
  // Tất cả API đều trả về cùng TData format
  return response.json();
}
```

### 8.2 So Sánh Các Giao Thức Truyền Tải

#### WebSockets

```
┌──────────────────────────────────────────────────────────────┐
│                        WEBSOCKETS                             │
├──────────────────────────────────────────────────────────────┤
│  Client ←───── Kết nối TCP 2 chiều (full-duplex) ─────→ Server │
│                                                                │
│  Ưu điểm:                              Nhược điểm:           │
│  ✅ Real-time (latency cực thấp)        ❌ Phức tạp:           │
│  ✅ Binary data (nén hiệu quả)           - Reconnection       │
│  ✅ 2 chiều (gửi + nhận)                 - State management   │
│                                           - Error handling     │
│                                          ❌ Khó scale          │
│                                           (stateful connection)│
└──────────────────────────────────────────────────────────────┘
```

```javascript
// WebSocket Implementation (viết tay, không dùng thư viện)
function createWebSocketConnection(url) {
  let ws = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT = 5;
  const subscribers = new Map();

  function connect() {
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('Connected');
      reconnectAttempts = 0;
      // Resubscribe tất cả assets
      subscribers.forEach((callback, assetId) => {
        ws.send(JSON.stringify({ action: 'subscribe', assetId }));
      });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const callback = subscribers.get(data.asset);
      if (callback) callback(data);
    };

    ws.onclose = () => {
      if (reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.pow(2, reconnectAttempts) * 1000;
        setTimeout(connect, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };
  }

  connect();

  return {
    subscribe(assetId, callback) {
      subscribers.set(assetId, callback);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'subscribe', assetId }));
      }
    },
    unsubscribe(assetId) {
      subscribers.delete(assetId);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'unsubscribe', assetId }));
      }
    },
    close() {
      ws.close();
    }
  };
}
```

#### Server-Sent Events (SSE)

```
┌──────────────────────────────────────────────────────────────┐
│                   SERVER-SENT EVENTS (SSE)                    │
├──────────────────────────────────────────────────────────────┤
│  Client ←──────── HTTP/2 1 chiều (server → client) ────── Server │
│                                                                │
│  Ưu điểm:                              Nhược điểm:           │
│  ✅ HTTP/2 based → stateless            ❌ Chậm hơn WebSocket │
│  ✅ Reconnection tự động (built-in)     ❌ Text data only     │
│  ✅ Multiplexing (200 streams/TCP)      ❌ 1 chiều (server→    │
│  ✅ Dễ scale (stateless)                   client only)        │
└──────────────────────────────────────────────────────────────┘
```

```javascript
// SSE Implementation (viết tay)
function createSSEConnection(url, assetId) {
  const eventSource = new EventSource(`${url}?asset=${assetId}`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateChart(data);
  };

  // Reconnection TỰ ĐỘNG — không cần viết thêm!
  eventSource.onerror = () => {
    console.log('SSE disconnected, auto-reconnecting...');
    // Browser tự reconnect
  };

  return eventSource;
}
```

> **Multiplexing là gì?** HTTP/2 cho phép **1 kết nối TCP** mở **~200 streams song song**. Nghĩa là ta có thể subscribe **200 stocks cùng lúc** qua 1 connection duy nhất — rất hiệu quả cho financial dashboard.

#### HTTP Streaming

```
┌──────────────────────────────────────────────────────────────┐
│                     HTTP STREAMING                            │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Ưu điểm:                              Nhược điểm:           │
│  ✅ Binary data                         ❌ Chậm (TCP overhead) │
│  ✅ HTTP/2 features                     ❌ Không hỗ trợ frame │
│                                            marking             │
│                                          ❌ Phù hợp cho file   │
│                                            hơn là data points  │
│                                                                │
│  → KHÔNG PHÙ HỢP cho financial data vì không đánh dấu        │
│    được đâu là frame bắt đầu, đâu là frame kết thúc           │
└──────────────────────────────────────────────────────────────┘
```

#### WebTransport (Tương Lai)

```
┌──────────────────────────────────────────────────────────────┐
│                     WEB TRANSPORT                             │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Ưu điểm:                              Nhược điểm:           │
│  ✅ UDP + QUIC based                   ❌ Browser support ~60% │
│  ✅ Zero-RTT (không cần 3-way          ❌ Server support hạn   │
│     handshake → nhanh hơn TCP)            chế                  │
│  ✅ Binary data                                                │
│  ✅ Frame marking (đánh dấu                                   │
│     data frames)                                               │
│  ✅ Nhanh hơn cả WebSocket!                                   │
│                                                                │
│  → TƯƠNG LAI sẽ thay thế WebSocket                            │
│    (tương tự HTTP/2 đã thay thế HTTP/1.1)                     │
└──────────────────────────────────────────────────────────────┘
```

### 8.3 Bảng So Sánh Tổng Hợp

| Tiêu chí | WebSocket | SSE | HTTP Streaming | WebTransport |
|----------|-----------|-----|----------------|--------------|
| **Tốc độ** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Dữ liệu** | Binary ✅ | Text only ❌ | Binary ✅ | Binary ✅ |
| **Hướng** | 2 chiều | 1 chiều (S→C) | 1 chiều | 2 chiều |
| **Frame marking** | ✅ | ✅ | ❌ | ✅ |
| **Auto reconnect** | ❌ Tự viết | ✅ Built-in | ❌ | ❌ |
| **Scale** | Khó (stateful) | Dễ (stateless) | Trung bình | Dễ |
| **Browser support** | ~98% | ~95% | ~95% | ~60% |
| **Phù hợp nhất** | Trading hiện tại | Dashboard alert | File download | Trading tương lai |

### 8.4 Data Serialization — Protobuf

Khi truyền **binary data** (WebSocket, WebTransport), ta có thể dùng **Protocol Buffers (Protobuf)** để nén data:

```
┌──────────────────────────────────────────────────────────────┐
│                 JSON vs PROTOBUF                              │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  JSON (text):                                                  │
│  {"asset":"AAPL","open":171.50,"close":172.30}                │
│  = 51 bytes                                                    │
│                                                                │
│  Protobuf (binary):                                           │
│  [0A 04 41 41 50 4C 15 00 80 2B 43 1D 9A 99 2C 43]          │
│  = 16 bytes                                                    │
│                                                                │
│  → Protobuf nhỏ hơn ~6-8x so với JSON!                       │
│  → Giảm đáng kể bandwidth cho financial data                 │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

```javascript
// Protobuf-like serialization (viết tay đơn giản)
// Trong thực tế dùng protobuf.js hoặc tương tự

/**
 * Serialize data point thành ArrayBuffer
 * Format: [4 bytes open] [4 bytes close]
 */
function serializeDataPoint(point) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat32(0, point.open, true);   // 4 bytes, little-endian
  view.setFloat32(4, point.close, true);  // 4 bytes, little-endian
  return buffer;
}

/**
 * Deserialize ArrayBuffer thành data point
 */
function deserializeDataPoint(buffer) {
  const view = new DataView(buffer);
  return {
    open: view.getFloat32(0, true),
    close: view.getFloat32(4, true),
  };
}

// Ví dụ sử dụng với WebSocket
ws.binaryType = 'arraybuffer';
ws.onmessage = (event) => {
  const point = deserializeDataPoint(event.data);
  // { open: 171.5, close: 172.3 }
};
```

### 8.5 CDN cho Low Latency

Để đảm bảo latency thấp cho user toàn cầu, data API cần được deploy gần user thông qua CDN edge servers:

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN TOPOLOGY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User (VN) ──→ Edge Server (Singapore) ──→ Origin (US)          │
│                     ↑                                             │
│                     │ ~20ms latency                               │
│                     │ (thay vì ~200ms đến US)                     │
│                                                                   │
│  User (EU) ──→ Edge Server (Frankfurt) ──→ Origin (US)          │
│                     ↑                                             │
│                     │ ~10ms latency                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Multi-Window Support — Hỗ Trợ Đa Cửa Sổ

### 9.1 Tại Sao Cần Multi-Window?

Trader chuyên nghiệp thường dùng **2-3 màn hình** cùng lúc. Họ muốn mở thêm tab/cửa sổ và kéo sang màn hình thứ 2 như một **phần mở rộng** (extension) của ứng dụng chính — không phải 1 app độc lập.

```
┌──────────────────┐     ┌──────────────────┐
│   Monitor 1       │     │   Monitor 2       │
│                    │     │                    │
│  ┌──────────────┐ │     │ ┌──────────────┐  │
│  │  Window 1    │ │     │ │  Window 2    │  │
│  │  (HOST)      │ │     │ │ (EXTENSION)  │  │
│  │              │ │     │ │              │  │
│  │  AAPL  TSLA  │ │     │ │  BTC   ETH   │  │
│  │  GOOG  META  │ │     │ │  SOL   ADA   │  │
│  │              │ │     │ │              │  │
│  └──────────────┘ │     │ └──────────────┘  │
│                    │     │                    │
└──────────────────┘     └──────────────────┘
       ↕ Đồng bộ state giữa 2 cửa sổ ↕
```

### 9.2 Kiến Trúc Host — Extension

```
┌────────────────────────────────────────────────────────────────┐
│                HOST — EXTENSION ARCHITECTURE                    │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Window 1 (HOST)                   Window 2 (EXTENSION)         │
│  ┌──────────────────┐             ┌──────────────────┐         │
│  │                   │             │                   │         │
│  │  ✅ Fetch data    │             │  ❌ KHÔNG fetch    │         │
│  │  ✅ Write state   │  Broadcast  │  ✅ Read state     │         │
│  │  ✅ Control sync  │ ←────────→ │  ✅ Hiển thị       │         │
│  │  ✅ Manage layout │  Channel    │  ❌ KHÔNG write    │         │
│  │                   │             │                   │         │
│  └────────┬─────────┘             └────────┬─────────┘         │
│           │                                 │                    │
│           └──────────┬──────────────────────┘                    │
│                      │                                           │
│              ┌───────▼────────┐                                  │
│              │  localStorage  │  ← Dùng chung (cùng domain)     │
│              │  ┌───────────┐ │                                  │
│              │  │ hostId    │ │  ← ID của window chính           │
│              │  │ extensions│ │  ← Danh sách extension IDs       │
│              │  └───────────┘ │                                  │
│              └────────────────┘                                  │
│                                                                  │
│  Quy tắc:                                                       │
│  • CHỈ HOST được write state                                    │
│  • Extension chỉ đọc state + gửi "yêu cầu" qua BroadcastChannel│
│  • Tránh race condition vì chỉ 1 writer                        │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

### 9.3 LocalStorage — Xác Định Host vs Extension

```javascript
/**
 * Xác định window hiện tại là HOST hay EXTENSION
 * 
 * Cách hoạt động:
 * - Window đầu tiên mở → ghi hostId vào localStorage → trở thành HOST
 * - Window mở sau → thấy hostId đã có → trở thành EXTENSION
 */

function initializeWindow() {
  const windowId = generateUniqueId(); // crypto.randomUUID()

  const existingHostId = localStorage.getItem('hostId');

  if (!existingHostId) {
    // Chưa có host → Tôi là HOST
    localStorage.setItem('hostId', windowId);
    return { role: 'host', windowId };
  } else {
    // Đã có host → Tôi là EXTENSION
    const extensions = JSON.parse(localStorage.getItem('extensions') || '[]');
    extensions.push(windowId);
    localStorage.setItem('extensions', JSON.stringify(extensions));
    return { role: 'extension', windowId };
  }
}

// Khi window đóng → cleanup
window.addEventListener('beforeunload', () => {
  const windowId = currentWindow.windowId;
  
  if (currentWindow.role === 'host') {
    localStorage.removeItem('hostId');
    // Có thể promote extension lên làm host mới
  } else {
    const extensions = JSON.parse(localStorage.getItem('extensions') || '[]');
    const updated = extensions.filter(id => id !== windowId);
    localStorage.setItem('extensions', JSON.stringify(updated));
  }
});
```

### 9.4 BroadcastChannel — Giao Tiếp Giữa Các Cửa Sổ

```javascript
/**
 * BroadcastChannel — API của browser để gửi message giữa các tab/window
 * cùng domain. Không cần server!
 * 
 * Extension gửi "yêu cầu" → Host nhận và xử lý → Host broadcast kết quả
 */

// Tạo channel chung cho tất cả windows
const channel = new BroadcastChannel('financial-dashboard');

// === HOST: Lắng nghe yêu cầu từ Extension ===
if (currentWindow.role === 'host') {
  channel.onmessage = (event) => {
    const { type, payload, sourceId } = event.data;
    
    switch (type) {
      case 'FETCH_CHART_DATA':
        // Extension yêu cầu fetch data
        fetchData(payload.asset, payload.timeFrame).then(data => {
          // Broadcast kết quả cho TẤT CẢ windows
          channel.postMessage({
            type: 'CHART_DATA_UPDATE',
            payload: { asset: payload.asset, data },
          });
        });
        break;
        
      case 'SYNC_INTERVAL':
        // Extension thay đổi interval → đồng bộ tất cả charts
        updateAllCharts(payload.interval);
        channel.postMessage({
          type: 'INTERVAL_CHANGED',
          payload: { interval: payload.interval },
        });
        break;
    }
  };
}

// === EXTENSION: Gửi yêu cầu và nhận kết quả ===
if (currentWindow.role === 'extension') {
  // Gửi yêu cầu fetch data
  function requestChartData(asset, timeFrame) {
    channel.postMessage({
      type: 'FETCH_CHART_DATA',
      payload: { asset, timeFrame },
      sourceId: currentWindow.windowId,
    });
  }

  // Nhận kết quả từ Host
  channel.onmessage = (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'CHART_DATA_UPDATE':
        renderChart(payload.asset, payload.data);
        break;
      case 'INTERVAL_CHANGED':
        updateLocalInterval(payload.interval);
        break;
    }
  };
}
```

### 9.5 Data Flow Giữa Host và Extension

```
┌─────────────────────────────────────────────────────────────────┐
│           MULTI-WINDOW DATA FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Extension                         Host                          │
│  ┌──────────┐                      ┌──────────┐                 │
│  │ User     │  1. Gửi yêu cầu     │          │                 │
│  │ clicks   │ ─────────────────→  │ Nhận     │                 │
│  │ "BTC"    │  BroadcastChannel   │ request  │                 │
│  └──────────┘                      └────┬─────┘                 │
│                                         │                        │
│                                    2. Fetch data                 │
│                                         │                        │
│                                    ┌────▼─────┐                 │
│                                    │  Server  │                 │
│                                    └────┬─────┘                 │
│                                         │                        │
│                                    3. Lưu IndexedDB             │
│                                         │                        │
│  ┌──────────┐                      ┌────▼─────┐                 │
│  │ Nhận     │  4. Broadcast result │          │                 │
│  │ data     │ ←─────────────────  │ Broadcast│                 │
│  │ Render   │  BroadcastChannel   │ kết quả  │                 │
│  └──────────┘                      └──────────┘                 │
│                                                                   │
│  Extension đọc IndexedDB (cùng domain) nếu cần thêm data       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

> **Tại sao chỉ Host được write?** Để tránh **race condition** — nếu cả Host và Extension đều write vào IndexedDB/state cùng lúc, data có thể bị overwrite hoặc hỏng. Bằng cách chỉ cho 1 writer (Host), ta đơn giản hóa synchronization đáng kể.

---


## 10. Script Phỏng Vấn 90 Phút

> **Bối cảnh**: Cuộc phỏng vấn system design tại một tier-1 trading firm. Interviewer (I) — Minh, Staff Engineer, 15 năm kinh nghiệm. Candidate (C) — Hưng, Senior Frontend Engineer, 10+ năm kinh nghiệm.

---

**I:** Chào Hưng, mình là Minh bên trading infrastructure. Hôm nay mình sẽ cùng design một financial dashboard tương tự TradingView. Anh có background gì liên quan domain này không?

**C:** Có, mình từng lead team 6 người build real-time portfolio dashboard cho một fintech startup — khoảng 500 concurrent users, mỗi session theo dõi 8-12 assets. Ngoài ra mình cũng dùng TradingView khá nhiều nên cũng quen domain rồi.

**I:** Tốt. Bắt đầu thế nào?

**C:** OK so trước khi mình vẽ bất kỳ cái gì thì mình muốn clarify requirements trước đã. Vì theo kinh nghiệm thì 80% lỗi system design đến từ hiểu sai requirements chứ không phải từ technical decisions. Mình từng mất 3 tuần design rồi phát hiện scope hiểu sai nên giờ mình luôn confirm first.

So mình sẽ cần biết mấy thứ. Target users là retail hay institutional? Concurrent users khoảng bao nhiêu? Layout thì user chọn preset hay free-form drag? Có bao nhiêu legacy APIs và format có giống nhau không? Sync giữa charts hoạt động thế nào? Worst case data volume là gì? Browser support tới đâu?

**I:** Institutional traders, 2000 concurrent users. Preset grid 2×2 đến 6×6, drag and drop chart vào. Nhiều legacy APIs, format khác nhau. Sync optional theo cả asset ID và time interval. 1 tick per second worst case. Modern browsers only.

**C:** OK perfect. So let me just quickly summarize lại để confirm mình không miss gì nhé.

So essentially chúng ta cần build một grid layout 2×2 đến 6×6 hỗ trợ drag and drop. Multiple chart types — candlestick, line, volume... Nhiều legacy APIs cần normalize về một format chung. Optional chart sync. 1 tick per second, 2000 concurrent institutional users, modern browsers.

And then mình cũng muốn set mấy non-functional requirements explicitly: latency dưới 100ms P99 vì institutional trading, rendering stability khi switch timeframe — tức là khi đổi timeframe không được hiện blank screen, memory management cho tối đa 36 charts, và multi-monitor support vì traders dùng nhiều màn hình. Sound right?

**I:** Đúng rồi. Go ahead.

**C:** So mình sẽ đi outside-in — bắt đầu từ layout, rồi data model, storage, rồi API và real-time, cuối cùng là multi-window. The reason is mỗi layer ngoài sẽ đặt constraints cho layer trong — ví dụ layout quyết định maximum bao nhiêu charts, từ đó mình mới tính được storage budget.

---

**C:** Alright so let's start với layout design. And I think đây là quyết định kiến trúc quan trọng nhất vì nếu sai ở đây thì cost rewrite rất lớn.

So the way mình think about this — bài toán của mình essentially là "place N charts on a grid". And nếu nhìn vào mấy options mình có thì the first one khá obvious là CSS Grid, vì essentially CSS Grid literally là grid system. Mình chỉ cần `grid-template-columns: repeat(6, 1fr)` là đã có layout rồi. And what's nice about CSS Grid is nó support overlap — tức là multiple elements có thể chồng lên nhau trên cùng grid area, and this is important — mình sẽ explain tại sao.

The second option sẽ là Flexbox, which also works nhưng vấn đề là nó không phải grid tự nhiên. Muốn làm grid 6×6 thì phải nested nhiều containers, rồi overlap thì lại cần absolute positioning — essentially ra hybrid approach mà phức tạp hơn without any real gain.

Third option — absolute positioning, which gives full control nhưng phải tự tính tất cả mọi thứ: collision detection, responsive resize, z-index management. And I can tell you from experience — đội mình từng thử approach này cho project khác. 3 tháng đầu OK nhưng đến tháng 6 thì có 1 file utils 800 dòng chỉ để tính layout positions. Cuối cùng phải rewrite sang Grid, mất thêm 2 sprint. So yeah, lesson learned.

And the fourth one is Canvas or WebGL — rendering performance tốt nhất nhưng mất toàn bộ DOM. No keyboard navigation, no screen reader, no dev tools debugging. Institutional firms thường có accessibility compliance requirements nên this one is out.

So CSS Grid is our winner here.

**I:** Sao không hybrid — Canvas cho chart rendering bên trong, DOM cho layout?

**C:** That's a good question. So technically we could do that — mỗi ô grid là một DOM element và bên trong embed Canvas cho chart rendering. But the thing is bài toán hôm nay là design layout system chứ không phải chart rendering engine. So mình sẽ focus vào grid system, còn chart rendering mình treat như black box. Nếu đề bài là "design chart rendering engine from scratch" thì answer sẽ khác.

**I:** Fair enough. Giải thích overlap?

**C:** Right so this is where it gets interesting. Mình gọi concept này là **sandwich design** — essentially we're using three layers stacked on top of each other on the same CSS Grid.

So the first layer — the bottom one — is just our grid container. `display: grid`, `grid-template-columns`, `grid-template-rows`. This layer is completely invisible — nó chỉ tạo ra coordinate system cho toàn bộ dashboard thôi.

The second layer — this is the interesting part — là cell grid. So mỗi ô trong grid sẽ là một empty div with `data-col` and `data-row` attributes. And you might ask tại sao mình cần layer riêng cho mấy cái div trống? The reason is CSS Grid container nó không tạo DOM elements cho từng ô. Khi mình viết `repeat(6, 1fr)` nó chỉ define tracks — nó nói "tôi có 6 cột equal width" nhưng nó không tạo ra actual divs. Mà mình cần real DOM elements để nhận drag and drop events — `dragover`, `drop`, `dragleave`... nên mình phải tự tạo 36 divs cho grid 6×6.

```javascript
function createCellGrid(cols, rows) {
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  grid.style.position = 'absolute';
  grid.style.inset = '0';

  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const cell = document.createElement('div');
      cell.dataset.col = c;
      cell.dataset.row = r;
      grid.appendChild(cell);
    }
  }
  return grid;
}
```

And then the third layer on top is the chart content — the actual charts. Each chart is placed using `grid-column` and `grid-row` to span the area it needs. So for instance if mình muốn chart chiếm từ cột 2 đến cột 4, hàng 1 đến hàng 3 thì:

```javascript
function placeChart(chartEl, col, row, colSpan, rowSpan) {
  chartEl.style.gridColumn = `${col} / ${col + colSpan}`;
  chartEl.style.gridRow = `${row} / ${row + rowSpan}`;
}
```

And this is why it's called sandwich design — because we stack these three layers: grid container at the bottom, cell grid in the middle listening to drag events, and chart content on top showing the actual financial data.

**I:** When user click lên chart thì cell bên dưới có nhận event không?

**C:** Good question. So khi chart đã được place rồi thì nó covers the cells underneath — click event chỉ hit chart layer. And actually this is exactly what we want! Because khi chart đã đặt thì user cần interact with the chart — zoom, pan, hover tooltip. Cell grid chỉ cần active khi user đang drag.

The way mình handle this is — when drag starts, mình set `pointer-events: none` lên chart layer, which exposes the cell grid underneath. Khi drag ends thì restore:

```javascript
chartLayer.addEventListener('dragstart', () => {
  chartLayer.style.pointerEvents = 'none';
});
document.addEventListener('dragend', () => {
  chartLayer.style.pointerEvents = 'auto';
});
```

And `dragend` fires cho cả successful drop lẫn cancelled drag nên we never get stuck in a bad state.

**I:** Event handling cho 36 cells thì sao?

**C:** So for this we definitely want to use event delegation. The idea is instead of registering a handler on each individual cell — which would be 36 handlers minimum — we register just one single handler on the parent grid container:

```javascript
cellGrid.addEventListener('drop', (e) => {
  e.preventDefault();
  const cell = e.target.closest('[data-col][data-row]');
  if (!cell) return;
  const { col, row } = cell.dataset;
  placeChart(e.dataTransfer.getData('text/plain'), parseInt(col), parseInt(row));
});
```

And what's nice about event delegation is not just performance — the bigger benefit is maintainability. Khi user đổi grid từ 4×4 sang 6×6, mình chỉ cần tạo thêm cell divs vào container, không cần touch bất kỳ listener nào. Events just bubble up to the same parent handler.

**I:** Resize chart thì sao?

**C:** So CSS Grid makes this really straightforward — we just change the grid placement properties:

```javascript
function resizeChart(el, colSpan, rowSpan) {
  const col = parseInt(el.style.gridColumnStart);
  const row = parseInt(el.style.gridRowStart);
  el.style.gridColumn = `${col} / ${col + colSpan}`;
  el.style.gridRow = `${row} / ${row + rowSpan}`;
}
```

Browser tự handle reflow. And for user-facing interaction, mình think cho institutional traders thì buttons or dropdown cho width/height sẽ reliable hơn custom drag handles. We can enhance với drag handles later. Plus mình sẽ dùng ResizeObserver bên trong mỗi chart để adjust rendering khi size thay đổi — axis labels, data density...

**I:** OK layout solid rồi. Data model?

---

**C:** Alright so now let's talk about component hierarchy. So the way mình want to structure this is into three layers following separation of concerns. And the reason for three — not two, not four — is mà two layers thì sẽ mix drag logic with data fetching trong cùng 1 file, and I've seen codebases like that — 2000 lines, function 400 dòng, people are afraid to touch it. Four layers thì overhead không justify.

So **layer one** is the Draggable Container. This component only cares about drag and drop and grid positioning. It has zero knowledge about data — it doesn't know whether the chart is showing BTC or AAPL. It only knows "I'm at position (2,3), I span 2×2".

**Layer two** is the Dashboard Component — this is the orchestrator. It knows what data to fetch — which asset, what time range, what interval. It knows when to use cache, when to sync with other charts. But it doesn't know how data will be rendered.

**Layer three** is the Chart Element — this transforms raw data into visuals. Each chart type has its own transformer.

**I:** Tại sao Dashboard không transform data luôn rồi forward xuống Chart?

**C:** So the problem with that approach is if Dashboard transforms data thì Dashboard has to know chart type. Which means you end up with an if-else chain — if line chart then do this, if candlestick then do that. And every time you add a new chart type you have to modify Dashboard — which violates Open-Closed Principle.

If the Chart transforms its own data then adding a new chart type is just writing a new class. Zero changes to Dashboard, zero changes to server.

So the way this works is — essentially mình define a canonical data format that mình gọi là TData. This is what the server returns:

```javascript
{ asset: "AAPL", interval: "1h",
  points: [{ timestamp: 1700000000, open: 171.5, high: 173.2,
             low: 170.8, close: 172.3, volume: 45200 }, ...] }
```

And then each chart type implements its own transformer that converts TData into whatever shape it needs:

```javascript
// Line chart chỉ cần timestamp + close
const lineTransformer = (data) => data.points.map(p => ({ x: p.timestamp, y: p.close }));

// Candlestick cần full OHLC + color
const candleTransformer = (data) => data.points.map(p => ({
  x: p.timestamp, open: p.open, high: p.high, low: p.low, close: p.close,
  color: p.close >= p.open ? '#00c853' : '#ff1744'
}));
```

So if product team says "hey let's add Heikin-Ashi chart" — mình just write one new transformer. Zero changes anywhere else.

**I:** Unified data layer — sao không để mỗi chart tự gọi API riêng?

**C:** So this is something that sounds reasonable at first. And actually đội mình ban đầu cũng làm vậy — mỗi chart tự fetch, independent, loose coupling. But then we ran into three problems.

First — N+1 problem. Grid 3×3 syncing cùng AAPL means 9 charts fire 9 identical requests to the same endpoint at the same time. That's 9x waste.

Second — and this was the painful one — data inconsistency. Chart A fetches at 10:00:01, chart B fetches at 10:00:03, price has changed between those two moments. User sees two charts both showing AAPL but with different prices. And for traders, that's instant loss of trust.

Third — error handling. 9 independent error states, each chart showing different error messages. 

So the solution is centralized `getData()` with request deduplication:

```javascript
const inflight = new Map();

async function getData(assetId, start, end, timeFrame) {
  const key = `${assetId}:${start}:${end}:${timeFrame}`;
  if (inflight.has(key)) return inflight.get(key);

  const promise = fetchFromAPI(assetId, start, end, timeFrame).then(normalize);
  inflight.set(key, promise);
  try { return await promise; }
  finally { inflight.delete(key); }
}
```

So when 9 charts call `getData("AAPL", ...)` at the same time — the first call creates the actual fetch, the other 8 see that key already exists in the inflight Map and return the same promise. One network request, consistent data, one error state.

**I:** `normalize` là gì?

**C:** Right so because we have multiple legacy APIs returning different formats — one returns `{ o: 171.5, c: 172.3 }`, another returns `{ open_price: 171.5 }` — `normalize` converts everything to our canonical TData format. Backend team thêm API mới thì frontend chỉ thêm one normalizer function. Charts don't care which API data came from.

**I:** Storage?

---

**C:** So when it comes to data storage, we need to think about how much data we're dealing with. 1 tick per second means 86,400 data points per day per asset. That's a lot. So the question is where do we store this data.

And the way mình approach this is essentially like a cache hierarchy — similar to how CPU has L1, L2, L3 cache but adapted for the browser.

So **L1** is our global state in RAM — data currently displayed on screen. Access time is microseconds, it's just reading a JavaScript variable. But budget is limited — around 50MB.

**L2** is IndexedDB — persistent cache on disk. Close the tab, come back tomorrow, data is still there. Around 2GB per domain, access time in milliseconds.

**L3** is the server — source of truth. 50-200ms, unlimited data.

And the flow is straightforward — check L1 first, if miss then check L2, if miss then fetch from L3, write to L2, promote to L1, render.

**I:** Cần IndexedDB thật không? L1 + L3 thôi?

**C:** So let me do the math. For viewport-visible data — each chart shows maybe 1000 points — 36 charts × 1000 × 80 bytes ≈ 2.9 MB. That's fine for L1.

But when user scrolls back to view historical data — say one week — that's 604,800 points per chart. 36 charts × 604,800 × 80 bytes ≈ 1.7 GB. Way beyond what RAM can handle.

Without L2, every scroll back means re-fetching from server — 200ms each time. With L2, previously viewed data is on disk — reload in 2-5ms. That's 40-100x improvement. And for financial app where traders constantly scroll back to analyze patterns, this is a core UX requirement.

**I:** IndexedDB chậm nếu query từng record. 86,400 `get()` calls?

**C:** Right, mình definitely don't want to query individual records. So what we do instead is **bucketing** — this is a pattern from time-series databases like InfluxDB. So instead of storing 86,400 individual records, we group them into buckets. Each bucket covers a fixed time period — say 5 minutes — and contains 300 data points as a single record.

So one day becomes 288 buckets. Querying one hour of data is just 12 `get()` calls instead of 3,600. That's 300x improvement.

And the key we use is a compound key — `[asset, bucketId, timeFrame]`:

```javascript
const store = db.createObjectStore('timeseries', {
  keyPath: ['asset', 'bucketId', 'timeFrame']
});

function getBucketId(timestamp, duration) {
  return Math.floor(timestamp / duration);
}
```

And another thing mình do is set `durability: 'relaxed'` on the IndexedDB transaction. What this does is it tells the browser it doesn't need to flush to disk before confirming the write — it can buffer writes and flush in the background. This increases write throughput about 3x. And since this is cache data — we can always re-fetch from server if we lose something — the trade-off is acceptable.

**I:** Multi-timeframe?

**C:** So what we do is store the same data in multiple timeframe buckets in parallel. 5-minute buckets for intraday view, 1-hour buckets for weekly view, 1-day buckets for yearly view. Compound key naturally distinguishes them. It costs more storage but eliminates server round-trip when switching timeframe — which is a massive UX win.

**I:** Khi user đổi timeframe — 5 phút sang 1 giờ?

**C:** So this depends on direction, and the two directions are completely different.

Going from 5 minutes to 1 hour — that's downsampling. We already have the detailed data, we just need to aggregate. Take 12 five-minute buckets, combine them into one 1-hour point. First point's open becomes the open, last point's close becomes the close, take max of highs and min of lows. This is **lossless** — mathematically exact.

```javascript
function downsample(points, ratio) {
  const result = [];
  for (let i = 0; i < points.length; i += ratio) {
    const chunk = points.slice(i, i + ratio);
    result.push({
      timestamp: chunk[0].timestamp,
      open: chunk[0].open,
      high: Math.max(...chunk.map(p => p.high)),
      low: Math.min(...chunk.map(p => p.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((s, p) => s + p.volume, 0)
    });
  }
  return result;
}
```

Going the other direction — 1 hour to 5 minutes — that's upsampling, and here you can't really fabricate 12 real data points from 1 point. You need server data. But while we wait for the server response, what we can do is create placeholder data — essentially duplicate the 1-hour point into 12 five-minute slots. The chart shows a flat line — not accurate but much better than a blank screen.

I actually A/B tested this at my previous company — 68% of users rated the experience as "fast" with placeholder versus only 23% with blank-then-load. Same actual latency.

**I:** OK. Real-time communication?

---

**C:** So when it comes to real-time data, we need to choose a protocol. And mình think there are four main options, and what mình want to do is go through each one and explain why mình would or wouldn't use it.

So the first one is **HTTP Streaming**. It does support binary data which is good, but the problem is there's no frame marking. What this means is — if two data ticks get packed into the same TCP segment, we can't tell where one tick ends and the next begins. For video streaming this is fine, but financial data is discrete events — we need clear boundaries between each tick. So this one is out.

The second option is **SSE** — Server-Sent Events. And what's nice about SSE is auto-reconnection comes built-in — browser handles it. HTTP/2 multiplexing gives us around 200 streams per connection. But there are two deal-breakers. First — text only. It only sends text data, so we're stuck with JSON which is 6-8x larger than binary. At 72,000 messages per second, that bandwidth difference is significant. Second — it's unidirectional. Client can only receive, not send. So subscribe/unsubscribe has to go through a separate HTTP channel.

Third option is **WebTransport** — and technically this is the best. UDP-based, QUIC protocol, zero-RTT, supports binary, bidirectional. But browser support is only around 60% and the spec is still evolving. So mình would put this as a future migration target rather than day-1 choice.

Which leaves **WebSocket**. Full-duplex, binary data via ArrayBuffer, 98% browser support, mature ecosystem. We have to handle reconnection ourselves, but that's a known problem with known solutions.

**I:** SSE có auto-reconnection, đơn giản hơn?

**C:** It is simpler for basic use cases. But for financial data — the binary savings alone at 72,000 messages per second makes WebSocket worth it. Plus bidirectional means subscribe/unsubscribe goes through the same channel instead of needing a separate HTTP sidecar. And WebSocket reconnection is maybe 30 lines of code — it's not that much complexity.

For scalability, mình use connection multiplexing — one WebSocket per user, not per chart. 36 charts subscribe 36 assets through 1 connection, 36 subscription messages internally. 2000 users = 2000 connections.

And mình wrap it in an abstraction layer:

```javascript
class TransportLayer {
  subscribe(asset, callback) {}
  unsubscribe(asset) {}
}
class WSTransport extends TransportLayer { /* WebSocket impl */ }
// Future: class WTTransport extends TransportLayer { /* WebTransport impl */ }
```

When WebTransport matures — mình estimate 12-18 months — swap implementation, zero changes for consumer code.

**I:** Binary serialization?

**C:** So for OHLCV data, the binary layout would look something like this — asset hash is 4 bytes, timestamp 4 bytes, then mình use float64 for prices because float32 only has 7 digits precision which isn't enough for crypto with 8 decimal places. So open, high, low, close each 8 bytes, volume 4 bytes, total 44 bytes.

Compare that to JSON which is around 75 bytes. So we get about 40% saving. And we serialize using `DataView` which is a native browser API:

```javascript
function serializeTick(asset, point) {
  const buf = new ArrayBuffer(44);
  const view = new DataView(buf);
  view.setUint32(0, hashAsset(asset), true);
  view.setUint32(4, point.timestamp, true);
  view.setFloat64(8, point.open, true);
  view.setFloat64(16, point.high, true);
  view.setFloat64(24, point.low, true);
  view.setFloat64(32, point.close, true);
  view.setUint32(40, point.volume, true);
  return buf;
}
```

**I:** Reconnection strategy?

**C:** Exponential backoff with jitter. And the jitter part is critical — without it, if server crashes and 2000 clients all retry at the same intervals, they all reconnect at the exact same moment — thundering herd — and crash the server again. Đội mình từng gặp chuyện này — server crashed 3 times in a row before we realized we forgot jitter.

```javascript
function getReconnectDelay(attempt) {
  return Math.min(1000 * Math.pow(2, attempt), 30000) + Math.random() * 1000;
}
```

And when reconnection succeeds, mình request backfill from last-known timestamp so we don't miss any data during the gap.

**I:** Multi-monitor support?

---

**C:** So institutional traders typically use 2 to 6 monitors. And what this means is we have multiple browser windows that need to share state — change interval on window 1 and window 2 should sync.

So the way mình approach this is using what's called a **Leader-Follower pattern** — it's essentially a simplified version of Raft consensus adapted for the browser.

The Leader — which is the first window opened — controls everything. It holds the only WebSocket connection to the server, writes state to IndexedDB, and broadcasts data to all followers via BroadcastChannel API.

Followers are read-only. They don't make their own server connections. Instead, they send **intents** to the Leader — like "I want to subscribe to BTC" — and the Leader decides what to do.

**I:** Tại sao chỉ Leader giữ WebSocket?

**C:** Two reasons. Resource efficiency — 6 windows with 6 separate connections means 12,000 total connections for 2000 users. Leader pattern brings that down to 2000.

But more importantly — consistency. If 6 connections subscribe to AAPL independently, each receives ticks at slightly different times due to network jitter. Trader sitting in front of 6 monitors sees 6 different prices for a few milliseconds. That's instant "system is broken" perception.

Single connection means single source of truth — all windows show exactly the same data at exactly the same time.

**I:** Leader election?

**C:** So mình use localStorage as the coordination point because it's synchronous and shared across all same-origin tabs:

```javascript
async function electLeader() {
  await sleep(Math.random() * 100); // stagger to reduce race
  const myId = crypto.randomUUID();
  if (!localStorage.getItem('leader')) {
    localStorage.setItem('leader', myId);
    await sleep(50);
    if (localStorage.getItem('leader') === myId) {
      startHeartbeat(myId);
      return 'leader';
    }
  }
  return 'follower';
}
```

**I:** localStorage operations không atomic across tabs. Race condition?

**C:** Right, so that's why there's a verify step — after setItem, we read getItem back. If someone overwrote us, we become follower. And the sleep(50) gives concurrent writes time to settle. Worst case two leaders emerge — heartbeat mechanism detects the conflict and forces re-election.

Speaking of which — heartbeat is essential because `beforeunload` doesn't reliably fire when tab crashes or OS kills the process. So Leader writes timestamp to localStorage every 5 seconds. Followers check — if heartbeat is older than 15 seconds, Leader is considered dead, trigger re-election:

```javascript
function startHeartbeat(id) {
  setInterval(() => localStorage.setItem('leader_heartbeat', Date.now().toString()), 5000);
}

function monitorLeader() {
  setInterval(() => {
    if (Date.now() - parseInt(localStorage.getItem('leader_heartbeat') || '0') > 15000) {
      localStorage.removeItem('leader');
      electLeader();
    }
  }, 5000);
}
```

**I:** Communication channel giữa windows?

**C:** BroadcastChannel API — native browser API for same-origin inter-tab messaging. Zero server involvement:

```javascript
const channel = new BroadcastChannel('dashboard');

// Leader broadcasts data
channel.postMessage({ type: 'MARKET_DATA', payload: { asset: 'AAPL', tick } });

// Follower receives
channel.onmessage = (e) => {
  if (e.data.type === 'MARKET_DATA') updateLocalChart(e.data.payload);
};

// Follower sends intent
channel.postMessage({ type: 'SUBSCRIBE_REQUEST', asset: 'BTC' });
```

And the reason only Leader writes — single-writer principle. Multiple writers to IndexedDB means last-write-wins data loss. Multiple WebSocket subscriptions means duplicate messages. Single writer eliminates an entire category of bugs.

**I:** Tổng kết?

**C:** So to summarize, we have 5 layers and each layer changes independently:

```
┌──────────────────────────────────────────────────────┐
│  LAYER 1 — LAYOUT                                    │
│  CSS Grid + Sandwich Design + Event Delegation       │
├──────────────────────────────────────────────────────┤
│  LAYER 2 — COMPONENT                                 │
│  Draggable → Dashboard → Chart (Strategy Pattern)    │
│  Request deduplication, TData canonical format        │
├──────────────────────────────────────────────────────┤
│  LAYER 3 — STORAGE                                   │
│  L1 RAM → L2 IndexedDB → L3 Server                  │
│  Bucketing, compound keys, relaxed durability         │
├──────────────────────────────────────────────────────┤
│  LAYER 4 — COMMUNICATION                            │
│  WebSocket + Binary (swap-ready for WebTransport)    │
│  Backoff with jitter, backfill on reconnect          │
├──────────────────────────────────────────────────────┤
│  LAYER 5 — MULTI-WINDOW                             │
│  Leader-Follower + BroadcastChannel + Heartbeat      │
│  Single-writer, intent-based follower                │
└──────────────────────────────────────────────────────┘
```

Swap WebSocket to WebTransport — only Layer 4 changes. Add new chart type — just add a transformer in Layer 2. Change storage strategy — only Layer 3. Each change is isolated, blast radius is small.

**I:** Very solid. Anh không chỉ đưa solution mà show rõ reasoning — evaluate options, eliminate with justification, reference production experience. Exactly senior-level. Thank you.

**C:** Thanks Minh. One thing mình want to note — this architecture is a starting point. In production we need to instrument performance — Web Vitals, custom timing for chart render, WebSocket latency P50/P99, memory pressure monitoring. And then iterate based on real user data. System design doesn't end at the whiteboard — it ends at production metrics.



## 11. Presentation Script — Financial Dashboard System Design (English)

> **Context**: This is a solo YouTube-style presentation script walking through the complete system design of a financial dashboard similar to TradingView. The speaker explains each concept step by step on a drawing board, with natural spoken English.

---

### Intro

Hey guys, welcome back. So today we're going to look at another really interesting system design problem. We're going to try to design a financial dashboard — or more specifically, a TradingView-style dashboard. So this question comes up quite often in interviews at trading companies, and I think it's a really cool problem because it touches on a lot of interesting frontend challenges — layout systems, data management, real-time communication, multi-window support. So without further ado, let's jump into it.

### Problem Overview

All right. So essentially what we're going to try to build is something like TradingView. If you're not familiar with it, TradingView is this really popular tool that allows you to have multiple financial charts on the screen — stocks, crypto, forex, whatever — and you can arrange them in different layouts.

So for instance, you can create a six-column layout and each slot in that layout can have its own chart with a different financial asset. So maybe you've got Apple in one, Bitcoin in another, PayPal in a third. And every window is resizable — you can drag the borders to make one chart bigger and another smaller.

We can also do some really cool things like synchronization. So for instance, we can say that we want to synchronize all the charts by the interval — and if we change the interval to 1 hour, every chart gets synchronized to that 1-hour interval. We can also synchronize by the symbol — so if I choose Apple here, all the charts update to show Apple's data.

So our main challenges in this problem are: how do we design the layout that supports this type of grid-based placement and resizing, how do we handle the large amount of data that comes into each chart, how do we reuse data across charts so we're not making redundant requests, and how do we support multi-monitor setups. I think it's pretty interesting, so let's go to our drawing board and figure this out.

### Interview Plan

So I already prepared a simple plan for how we're going to approach this. As a first step, we're going to look at the requirements and the mockup. Then we'll move to the layout design — how do we actually build this grid system. After that, we'll tackle the data model — how do we represent financial data and how do we store it in application state. Then we need to understand the API layer — what protocol do we use to connect to the backend. And finally, we'll look at multi-window support — how do we synchronize between multiple browser tabs, for instance when a trader has two or three monitors.

### Requirements

So let's start with the product requirements. What do we actually need this financial dashboard to do?

So the first thing is — each dashboard should support multiple resizable charts. We can place as many charts as we want, and the user can configure basically any layout as long as it's a grid. So it could be 2 by 2, it could be 4 by 4, it could be 6 by 6 — that's configurable by the user.

The second thing is — the data may come from different data sources. So we might have multiple APIs. Some of these might be legacy APIs, some might be newer ones, but the important thing is that we want all of these APIs to return the same data format. So the data interface is unified across all APIs. This is really important because it means we can have a single method to fetch data regardless of which backend we're actually talking to.

Another thing is extensibility. Each chart can technically have a different data model. So a table chart has its own model, a pie chart has its own, a candlestick chart has its own. However, the data that comes from the server is always in a generic format. So each chart needs to know how to transform this generic data into whatever it needs to render itself.

And then we have synchronization. We can synchronize charts by asset ID or by time frame. So if you select a specific asset on one chart and synchronization mode is on, all the other charts should update to show that same asset. It's kind of a bonus point in this design — not the most complex part, but good to have.

Now for the non-product requirements. I'd say network performance is the big one — we have so much data coming into the browser that we need to think carefully about how to optimize data loading. We don't want to load too much, we want to utilize browser caching, things like that.

Another one is rendering stability. When we change parameters — for instance switching the time frame from daily to 1-hour — can we still display something on the chart while we wait for the new data? Can we somehow downsample the existing data to show a partial chart instead of a blank screen?

And the last one is legacy API support. We want a unified interface that works across all the different APIs, even if they use slightly different request formats or response shapes. As a developer, you might have five different endpoints, but you want to use them all through a single method.

All right, so with the requirements clear, let's move to the layout design.

### Layout Design

All right. So what do we want to do with our layout? As we already mentioned, our layout is essentially a grid. So we want a grid system similar to CSS Grid. The user can adjust the grid layout — it could be 4 by 4, it could be 6 by 8, and this is configurable on the user side.

So the question is — what analogy do we have in frontend development for a grid system? And the answer is CSS Grid. CSS Grid is super convenient for our case because it's a natural grid provided by the CSS standard. And since we mentioned in the requirements that we're targeting modern browsers — I mean, we don't really expect traders to be using Internet Explorer at their trading desk — we can take full advantage of CSS Grid without worrying about browser support.

Now, CSS Grid will be much more useful than Flexbox here because it's a natural grid. With Flexbox, you'd have to nest containers to create a grid effect — one flex container for rows, each row containing another flex container for columns. It works, but it's not as clean. CSS Grid gives us the grid structure directly.

OK so now we have our grid system, but the main challenge is — how do we implement drag and drop? How do we let users place charts onto this grid? And for that, I'm going to introduce a concept that I call the **sandwich design**. Let me explain.

So we'll start with an empty container. This is our root container where we'll place all our content. What we want is to split this container into a grid — columns and rows. So for example, if we have a 4 by 4 grid, we'll have four columns and four rows.

Now, the way CSS Grid works is — we assign our container `display: grid`, and then we set `grid-template-columns` and `grid-template-rows` based on user settings. So if the user wants 6 columns, we do `grid-template-columns: repeat(6, 1fr)`. Each column gets an equal fraction of the available space. This creates our grid.

Now, to place a chart on this grid, we use the `grid-column` and `grid-row` properties. So if I want a chart to span from column 1 to column 3 and from row 1 to row 3, I just set `grid-column: 1 / 3` and `grid-row: 1 / 3`. That's it — CSS Grid handles the positioning for us.

But here's the interesting part — how does drag and drop work with this? The way it's going to work is that every cell in our grid will be a small container that listens to drag and drop events. When we drag a chart and drop it onto a cell, that cell fires a drop event which tells us where the mouse pointer was — which column, which row. And we can use data attributes on each cell to know exactly where the chart was dropped.

So when you drop a chart on, say, column 2 row 3, we read the data attributes, and then we assign the chart the corresponding CSS Grid properties — `grid-column: 2 / 4`, `grid-row: 3 / 5` — assuming each chart takes 2 columns and 2 rows by default.

And this is why it's called the sandwich design — because we're essentially using a three-layer system:

**Layer 1** — the grid container. This is just the CSS Grid definition. It creates the coordinate system for our layout. It's invisible — just a skeleton.

**Layer 2** — the cell grid. These are small empty divs, one for each grid cell, and each one has `data-column` and `data-row` attributes. These cells listen to drag and drop events. The important thing here is that we don't register event handlers on each individual cell — because if you have a 8 by 8 grid, that's 64 handlers, which is not great for performance. Instead, we use **event bubbling**. All events bubble up from the cells to the parent grid container, and we register just a single handler on that container. So to figure out which cell was targeted, we just read the `data-column` and `data-row` from the event target.

**Layer 3** — the chart content layer. This is where the actual charts live. Each chart is placed on top of the cell grid using `grid-column` and `grid-row` properties to span the appropriate area.

And the cool thing about CSS Grid is it allows multiple items to overlap in the same grid area. So our cell grid and our chart content can sit on top of each other — and the spec allows this. If we want to resize a chart, we just reassign the `grid-column` and `grid-row` properties to a new configuration. CSS Grid handles the rest.

Let me quickly write out what I'm thinking. First — each cell represents a droppable container. Second — we set data attributes on each cell so we know its position. Third — when the mouse pointer targets a cell and the chart is dropped, we use the drop event to get the final element where we need to place the chart. And fourth — we span the chart using CSS Grid properties.

All right, I think the layout design is solid. Let's move to the data model.

### Data Model and Component Architecture

So before we define the data model, I think it's good to understand how our component hierarchy is going to look. The hierarchy directly responds to the data structure that we're going to use, so it's worth drawing out.

I think we need three layers of components.

The first is the **Draggable Container**. This is a generic reusable component that handles all the drag and drop logic — placing things on the grid, moving things around. It doesn't have any other logic. It doesn't know about financial data, it doesn't know about charts. It just handles drag and drop. And the reason we encapsulate this in its own component is because drag and drop is complex — and we don't want that complexity leaking into our business logic.

The second is the **Dashboard Component**. This is responsible for handling all the data API requests. It fetches the data, and remember — we said that all data follows the same unified format. So the Dashboard Component has a single `getData` method that works with any asset, any time range, any interval. It handles the data layer — caching, request deduplication, sync configuration. But it doesn't know how to render the data — it just passes it down.

And the third is the **Chart Element**. Now here's where it gets interesting. Each chart type — candlestick, line, volume bar, whatever — may need a different shape of data. A candlestick needs OHLC data, a line chart just needs timestamp and close price. But the data from the API is always in the same generic format.

So the way we solve this is with a **transformer**. Each Chart Element implements a transformer that converts the source data from TData format into whatever the chart needs. I'll use TypeScript-style notation here — we define a `ChartElement<T>` interface with a `transformer` method that takes `TData` and returns `T`. So a `CandlestickChart` transforms TData into OHLC shapes, a `LineChart` transforms it into x/y points, and so on.

And the beautiful thing about this is extensibility. Want to add a new chart type? Just create a new class that implements the transformer interface. You don't touch the Dashboard Component, you don't touch the API layer. Everything just works.

All right, so let's define the data interface. Our TData type needs:
- `asset` — the stock symbol, like "AAPL"
- `start` and `end` — timestamps defining the time range
- `interval` — how granular the data is (1 second, 5 minutes, 1 hour)
- `points` — an array of data points, each with `open`, `close`, `high`, `low`, and `volume`

The interval is important because in financial charts, each point on a candlestick corresponds to one interval. So if the chart is set to 1 hour, each candle represents one hour of trading. The smaller the interval, the more granular the data, the more points we have.

Now, one thing I want to talk about is unified data fetching. Remember we said we might have multiple legacy APIs? We don't want each chart to independently call different endpoints. So we create a single `getData` function that takes asset ID, start, end, and time frame, and returns our standard TData format. Under the hood, this function can route to whichever backend API is appropriate and normalize the response.

And there's another really important optimization here — **request deduplication**. If you have a 3 by 3 grid and all 9 charts are showing Apple, you don't want 9 identical requests going to the server. So when the first chart calls `getData("AAPL", ...)`, we store that promise in a Map. When the next 8 charts call the same thing, they get back the same promise. One network request, consistent data across all charts.

```javascript
const inflight = new Map();

async function getData(assetId, start, end, timeFrame) {
  const key = `${assetId}:${start}:${end}:${timeFrame}`;
  if (inflight.has(key)) return inflight.get(key);

  const promise = fetchFromAPI(assetId, start, end, timeFrame).then(normalize);
  inflight.set(key, promise);
  try { return await promise; }
  finally { inflight.delete(key); }
}
```

All right, let's move on to data storage.

### Data Storage

So when it comes to data storage, we need to think about two things. First — how do we store the runtime data, the data that's currently in our global state and being displayed on screen? And second — how do we handle the really large amounts of data that we might need for scrollback and historical views, without eating up all the RAM?

And here we essentially have two options. We can store data in the global state — that's our runtime memory, our JavaScript heap. Or we can store it in IndexedDB.

So why IndexedDB? IndexedDB is essentially the only way in the browser to store large amounts of data on the hard drive. Each browser allows roughly 2 GB per domain in IndexedDB. So 2 GB — that's quite a lot of storage that we can utilize. And what's nice about it is the data persists — if the user closes the tab and comes back tomorrow, the data is still there. No need to re-fetch from the server.

But the challenge is — how do we structure the data in IndexedDB so we can efficiently access specific data points for a given asset and time frame? And the key insight is **bucketing**.

So imagine we have a 5-minute time frame and we want to fetch the data for the last 60 minutes. If we stored every single data point as a separate record — one point per second — we'd have 3,600 records. And querying 3,600 individual records from IndexedDB is not efficient at all, because each read is an async operation.

So what we can do instead is introduce buckets. We group our data points into 5-minute buckets. Each bucket contains up to 300 data points. So within our 60-minute window, instead of scanning 3,600 individual records, we scan 12 buckets. That's much much faster.

And IndexedDB is actually very well optimized for this kind of storage because it supports **compound keys**. Our compound key will have three parts: the asset ID, the bucket ID, and the time frame. So for instance, we might have a key like `["AAPL", 42, "5m"]` — that gives us the 5-minute bucket number 42 for Apple stock.

Now, how do we calculate the bucket ID? It's simple — we take the current timestamp and divide it by the bucket duration. So if our bucket is 5 minutes — that's 300,000 milliseconds — and the current timestamp is 300,001 milliseconds, we divide 300,001 by 300,000 and floor it, which gives us bucket ID 1. The formula is essentially:

```
bucketId = Math.floor(currentTimestamp / bucketDuration)
```

And what's really cool is we can store multiple time frames simultaneously. We can have 5-minute buckets for intraday views, 1-hour buckets for daily views, and 1-day buckets for yearly views. They don't conflict with each other because the compound key differentiates them. Yes, there's some overhead on storage — we're essentially storing the same data at different granularities — but as long as it's on the hard drive, it doesn't affect our application's runtime memory.

#### Storage Requirements

Now you might ask — how much storage do we actually need? Let's do the math.

To calculate the maximum number of points per day — assuming worst case, one point per second per asset — we take 24 hours times 60 minutes times 60 seconds, which gives us 86,400 points. Each point has an open and close price — that's about 8 bytes per point. So 86,400 times 8 gives us roughly 691,200 bytes, which is about **0.7 megabytes** per asset per day.

For the whole year, that's 0.7 times 365 — about **255 megabytes** per asset. That sounds like a lot, but it's the absolute worst case. In practice, traders don't usually look at second-level data for an entire year. They use 1-hour or daily time frames for longer periods.

And in terms of buckets — in one day with 5-minute buckets, we'd have 1,440 minutes divided by 5, which is **288 buckets**. Each bucket containing about 300 points maximum. That's very manageable.

One more optimization we can do is reduce the **durability** of IndexedDB transactions. Normally, IndexedDB ensures that every write is flushed to disk before confirming. If we set `durability: 'relaxed'`, the browser can buffer writes and flush them in the background. This significantly increases write throughput — about 3x in my testing. And for financial cache data, this trade-off is fine — if we lose a small amount of cached data due to a crash, we just re-fetch it from the server.

#### Data Downsampling and Upsampling

Now let's talk about what happens when the user changes the time frame.

Imagine we're working with a 5-minute time frame and we have all our buckets loaded. The user switches to 1-hour view. Do we need to request new data from the server?

The answer is **no** — we can downsample. Since we already have all the detailed 5-minute data, we can combine it. We take the first point of the first bucket to get the opening price, and the last point of the last bucket to get the closing price, and combine them into a single 1-hour point. This is called **data downsampling**, and it's lossless — we're not losing any information, we're just aggregating it.

```javascript
function downsample(points, ratio) {
  const result = [];
  for (let i = 0; i < points.length; i += ratio) {
    const chunk = points.slice(i, i + ratio);
    result.push({
      timestamp: chunk[0].timestamp,
      open: chunk[0].open,
      high: Math.max(...chunk.map(p => p.high)),
      low: Math.min(...chunk.map(p => p.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((s, p) => s + p.volume, 0)
    });
  }
  return result;
}
```

This is really useful because it saves us a server request entirely.

But what about the opposite situation? What if we have 1-hour data and the user switches to 5-minute view? This is **upsampling**, and it's trickier. You can't really go from less accurate to more accurate data without getting more data from the server. You can't fabricate 12 five-minute points from a single 1-hour point — you don't know what happened within that hour.

So the solution is to use **placeholder data**. While the request travels to the server to get the detailed data, we create temporary buckets where each bucket contains a duplicate of the 1-hour entry. So the chart shows a flat line — not accurate, but at least we're displaying something instead of a blank screen. The user can see that data is loading, and when the real data arrives, the chart updates seamlessly.

The key thing to remember — downsampling reuses existing data to create less granular views. Upsampling requires new data from the server, and we use placeholders to maintain a good user experience while we wait.

### API Design

All right, so our next step is to talk about the API layer. We know from our requirements that we might have multiple legacy endpoints using different technologies. So we want to unify them under a single interface.

For that, I'm going to introduce a `getData` interface — it takes an asset ID, a start point, an end point, and a time frame, and it returns our standard TData format. Under the hood, this function routes to the appropriate backend and normalizes the response.

Now, for our real-time data feed, we need to choose a communication protocol. And there are several options, so let's go through the pros and cons of each.

**WebSockets** — this is the most common technology used in trading applications. The pros are: real-time low-latency communication, binary data transfer — which is really important for financial apps and I'll explain why in a second — and it's bidirectional, so we can send data to the server and receive from the server. The cons are: implementation complexity around error handling, reconnection, and state management. WebSockets are stateful, so if the connection drops, we need to restore the connection and replay the state. It's also relatively hard to scale on the infrastructure side.

**Server-Sent Events** — the cool thing about SSE is that it's HTTP/2 based and stateless. So reconnection and error handling come out of the box — the browser handles it automatically. And because it's HTTP/2, we can use multiplexing — one single TCP connection allows us to split into around 200 streams. So we can receive data for 200 different stocks through one connection. And it's easy to scale. But the cons are — it's slower than WebSockets, it only supports text data (not binary), and it's unidirectional. You can only receive data from the server, not send to it. For a financial dashboard where we mostly read data, that's not a huge problem, but for apps that need real-time input, it matters.

**HTTP Streaming** — we still get binary data and HTTP/2 benefits. But the cons are significant — the TCP stack requires handshakes and reconnections which impact latency. And HTTP streaming doesn't support **frame marking** — which means if we're receiving a stream of data points, we can't easily tell where one data point ends and the next begins. For financial data where we need clear boundaries between each tick, this is a problem. Streaming is more suited for files where you don't care about frame boundaries.

**WebTransport** — this is the newest and most interesting option. It's UDP and QUIC based, which means the messages can be transferred without the three-way handshake that TCP requires — this is called zero-RTT. So it's actually faster than WebSockets. It supports binary data, it supports frame marking, it's bidirectional. But the cons — limited browser and server support, around 60% right now. Though I'll say, five years ago HTTP/2 had the same limited support, and now it's the de facto standard. So WebTransport will get there.

Now, the important thing about binary data — why does it matter? When data is in binary format, we can apply serialization protocols like Protobuf that can compress the data 6 to 8 times compared to JSON. So instead of sending a JSON string like `{"open": 171.5, "close": 172.3}` which is about 75 bytes, we can send a binary payload of about 44 bytes — using DataView and fixed-width fields. At scale — say 72,000 messages per second across 2,000 users — that bandwidth saving is massive.

For our implementation, I'd choose **WebSocket** as the day-1 protocol because of mature support and binary capability. But I'd wrap it in an abstraction layer:

```javascript
class TransportLayer {
  subscribe(asset, callback) {}
  unsubscribe(asset) {}
}
class WSTransport extends TransportLayer { /* WebSocket */ }
// Future: class WTTransport extends TransportLayer { /* WebTransport */ }
```

This way, when WebTransport matures, we can swap the implementation without changing any consumer code.

One more important thing — reconnection strategy. We use exponential backoff with **jitter**. Plain exponential backoff means all clients retry at the exact same intervals — if the server crashed, 2,000 clients all reconnect at 1 second, then 2 seconds, then 4 seconds — all at the same time. That's a thundering herd problem. With jitter, we add a random delay — so instead of all reconnecting at exactly 4 seconds, they spread out between 4 and 5 seconds. This lets the server recover gradually.

```javascript
function getReconnectDelay(attempt) {
  return Math.min(1000 * Math.pow(2, attempt), 30000) + Math.random() * 1000;
}
```

### Multi-Window Support

All right, the last topic — and I think this is one of the most interesting concepts. Multi-window support.

So here's the scenario. We have window one — let's call it the **host**. It's the main window that handles all the event changes, state changes, data fetching. And the trader wants to open a second tab, move it to a second monitor, and have it act as an **extension** of the application — not a standalone app, but an extension that stays in sync.

So we need to create a communication layer between window one and window two. And the key principle is — **only the host writes**. The state in window two is essentially a replication of window one's state. Window one is the main controller. Window two reads from the same IndexedDB, reads from localStorage, but it doesn't write directly. If it wants something — like subscribing to a new asset — it sends a request to window one, and window one handles it.

Why this approach? Because if both windows can write state independently, we run into race conditions. Two windows writing to IndexedDB at the same time — last write wins, data loss. Two windows subscribing to the same asset — duplicate messages from the server. By having a single writer, we eliminate an entire category of bugs.

So how does window one know it's the host? **localStorage**. Since both windows are running on the same domain, they share the same localStorage. Window one writes a `hostId` variable with its window ID. When window two opens, it checks — is there already a hostId? If yes, then I'm an extension. If no, then I become the host.

And for communication between the windows, we use the **BroadcastChannel API**. This is a browser API that allows us to send messages with payloads between same-origin tabs. So window two can send a message like "hey, I want to see the chart for Bitcoin" — and window one receives that message, fetches the data, puts it in state, and broadcasts the update back to window two.

```javascript
const channel = new BroadcastChannel('trading-dashboard');

// Host broadcasts data
channel.postMessage({ type: 'MARKET_DATA', asset: 'AAPL', data: tickData });

// Extension receives
channel.onmessage = (e) => {
  if (e.data.type === 'MARKET_DATA') updateChart(e.data);
};
```

Now, one important thing — what if the host window crashes? We need fault tolerance. So the host writes a **heartbeat** to localStorage every few seconds. Extensions monitor the heartbeat. If the heartbeat stops — say, no update for 15 seconds — extensions assume the host is dead and one of them promotes itself to become the new host. It opens a new WebSocket connection, restores subscriptions from localStorage, and starts broadcasting.

This is essentially a simplified Leader-Follower pattern adapted for the browser. It's not as robust as a full Raft consensus algorithm, but for our use case — synchronized trading dashboards — it's more than sufficient.

### Outro

All right, so I think we covered quite a lot of interesting ground today. We looked at how to build the layout using CSS Grid and the sandwich design pattern. We explored the data model with transformers and unified data fetching. We tackled storage with IndexedDB bucketing and compound keys. We went through the different communication protocols and why we'd choose WebSocket with a migration path to WebTransport. And we designed multi-window support with the host-extension pattern using localStorage and BroadcastChannel.

I hope you found this useful. If you did, please leave a comment, hit the like button, subscribe to the channel. It really does help a lot. And I'll see you guys in the next one. Bye!

---

*This document provides a comprehensive foundation for designing and interviewing for Financial Dashboard / TradingView system design. All code examples are handwritten without external libraries.*
