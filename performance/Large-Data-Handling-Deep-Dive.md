# Backend Trả Về 10 Vạn Dữ Liệu — Frontend Xử Lý Thế Nào?

> 📅 2025-06-15 · ⏱ 7 phút đọc
>
> Interviewer hỏi: "Nếu backend trả về **10 vạn** dữ liệu cùng lúc, bạn sẽ xử lý như thế nào?"
> Tôi cười méo mặt rồi gửi luôn một triệu request lên backend, crash server cho interviewer khóc luôn! 😂

---

## TL;DR

```
10 VẠN DỮ LIỆU — CHIẾN LƯỢC XỬ LÝ:
═══════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  MỤC TIÊU: Không render 100K DOM cùng lúc!           │
  │                                                        │
  │  CHIẾN LƯỢC:                                           │
  │  ① Data Sharding — chia nhỏ, render từng phần        │
  │  ② Virtual List — chỉ render viewport                 │
  │  ③ Lazy Loading — load thêm khi user cần             │
  │  ④ Data Flattening — tree → flat (ID + parentID)     │
  │  ⑤ Web Worker — xử lý nặng ở background thread      │
  │  ⑥ Time Slicing — requestAnimationFrame chia nhỏ     │
  │  ⑦ IndexedDB Cache — cache data đã load              │
  │  ⑧ Throttle/Debounce — giảm render thừa             │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §1. Interviewer Đang Kiểm Tra Gì?

Câu hỏi "10 vạn dữ liệu" không chỉ test kỹ thuật, mà test **tư duy tổng thể** của bạn:

```
6 NĂNG LỰC ĐÁNH GIÁ:
═══════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Performance Awareness                               │
  │  → Có NHẬN RA "100K data" sẽ gây vấn đề không?      │
  │  → Phản ứng đầu tiên có phải là optimize không?      │
  │                                                        │
  │  ② Browser Rendering Mechanism                         │
  │  → Hiểu impact: nhiều DOM, memory cao, long task      │
  │  → Biết tại sao UI bị LAG                            │
  │                                                        │
  │  ③ Data Processing Strategy                            │
  │  → Pagination? Slicing? Lazy loading? Virtual scroll? │
  │                                                        │
  │  ④ Project Experience                                  │
  │  → Có thể giải thích kết hợp business scenario?      │
  │                                                        │
  │  ⑤ Frontend-Backend Collaboration                      │
  │  → Có nghĩ tới việc ĐÀM PHÁN với backend không?     │
  │  → Pagination API, cursor-based pagination, etc.      │
  │                                                        │
  │  ⑥ Code Abstraction                                    │
  │  → Data structure hợp lý? Caching? Worker? Throttle? │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

> **Key insight**: Câu trả lời tốt nhất bắt đầu bằng "Bước đầu tiên, tôi sẽ hỏi lại backend tại sao không pagination" — thể hiện **tư duy collaboration**.

---

## §2. Tổng Quan Giải Pháp

```
3 TẦNG GIẢI PHÁP:
═══════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────┐
  │  TẦNG 1: DATA PROCESSING STRATEGY                   │
  │  ┌─────────────────────────────────────────────────┐ │
  │  │ Data Sharding    → chia chunks, load dần dần   │ │
  │  │ Virtual List     → chỉ render DOM trong viewport│ │
  │  │ Lazy Loading     → load con khi user expand     │ │
  │  └─────────────────────────────────────────────────┘ │
  │                                                      │
  │  TẦNG 2: FRONTEND OPTIMIZATION                       │
  │  ┌─────────────────────────────────────────────────┐ │
  │  │ Data Flattening  → tree → flat object (O(1))   │ │
  │  │ Web Worker       → background thread xử lý     │ │
  │  │ Caching          → IndexedDB / localStorage    │ │
  │  └─────────────────────────────────────────────────┘ │
  │                                                      │
  │  TẦNG 3: RENDERING OPTIMIZATION                      │
  │  ┌─────────────────────────────────────────────────┐ │
  │  │ Time Slicing     → rAF chia nhỏ render task    │ │
  │  │ Component Lazy   → React.lazy() + Suspense     │ │
  │  │ Throttle/Debounce→ giảm scroll/expand rendering│ │
  │  └─────────────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────┘
```

---

## §3. Data Sharding — Render Từng Phần

### Nguyên lý

Chia dataset lớn thành **chunks nhỏ**, render **từng chunk** qua `requestAnimationFrame` để tránh block main thread.

```
DATA SHARDING FLOW:
═══════════════════════════════════════════════════════════

  100,000 items
      │
      ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Chunk 1  │  │ Chunk 2  │  │ Chunk 3  │  ...
  │ 0-99     │  │ 100-199  │  │ 200-299  │
  └────┬─────┘  └────┬─────┘  └────┬─────┘
       │              │              │
       ▼              ▼              ▼
    Frame 1        Frame 2        Frame 3      ...
   (render 100)  (render 100)  (render 100)

  → Mỗi frame chỉ render chunkSize items
  → Browser có thời gian paint + respond user input
  → UI KHÔNG BỊ FREEZE!
```

### Implementation

```javascript
function renderChunk(data, renderFn, chunkSize = 100) {
  /**
   * @param {Array} data       - Danh sách dữ liệu cần render
   * @param {Function} renderFn - Logic render cho mỗi item: renderFn(item)
   * @param {number} chunkSize  - Số items render mỗi frame (default 100)
   */

  let index = 0; // Vị trí hiện tại trong data

  function nextChunk() {
    // Lấy chunk hiện tại
    const chunk = data.slice(index, index + chunkSize);

    // Render từng item trong chunk
    chunk.forEach(renderFn);

    // Cập nhật index
    index += chunkSize;

    // Còn data → tiếp tục ở frame tiếp theo
    if (index < data.length) {
      requestAnimationFrame(nextChunk);
    }
    // Hết data → dừng
  }

  // Bắt đầu render
  nextChunk();
}
```

> **Tại sao `requestAnimationFrame` mà không phải `setTimeout`?**
>
> - `rAF` đồng bộ với **refresh rate** của browser (thường 60fps = ~16.67ms/frame)
> - `setTimeout(fn, 0)` thực tế delay **4ms+** và không sync với paint cycle
> - `rAF` tự động **pause** khi tab không active → tiết kiệm CPU

---

## §4. Data Flattening — Tree → Flat

### Nguyên lý

Biến đổi cấu trúc **tree lồng nhau** thành **flat object** với quan hệ `ID ↔ parentID`. Truy xuất O(1) thay vì traverse O(n).

```
TREE → FLAT TRANSFORMATION:
═══════════════════════════════════════════════════════════

  TRƯỚC (nested tree):              SAU (flat object):
  ┌─────────────────────┐           ┌──────────────────────┐
  │ { id: 1,            │           │ {                    │
  │   children: [       │           │   "1": {             │
  │     { id: 2,        │    ══►    │     id: 1,           │
  │       children: [   │           │     parentId: null,  │
  │         { id: 4 }   │           │     children: [2,3]  │
  │       ]             │           │   },                 │
  │     },              │           │   "2": {             │
  │     { id: 3 }       │           │     id: 2,           │
  │   ]                 │           │     parentId: 1,     │
  │ }                   │           │     children: [4]    │
  └─────────────────────┘           │   },                 │
                                    │   "3": { ... },      │
                                    │   "4": { ... }       │
                                    │ }                    │
                                    └──────────────────────┘

  ⭐ Lợi ích:
  → Truy xuất node: O(1) thay vì DFS/BFS
  → Update node: trực tiếp qua ID
  → Dễ cache, dễ sync với IndexedDB
```

### Implementation

```javascript
function flattenTree(tree) {
  const result = {};

  function flatten(node, parentId = null) {
    const id = node.id;

    // Lưu node với parentId, thay children objects → children IDs
    result[id] = {
      ...node,
      parentId,
      children: node.children ? node.children.map((child) => child.id) : [],
    };

    // Đệ quy xử lý children
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => flatten(child, id));
    }
  }

  // Xử lý tất cả root nodes
  tree.forEach((node) => flatten(node));

  return result;
}
```

> **Khi nào dùng flattening?**
>
> - Data có dạng **tree** (comment threads, file explorer, org chart)
> - Cần **random access** theo ID thường xuyên
> - Kết hợp với **virtual list** (flat list dễ virtualize hơn nested tree)

---

## §5. Web Worker — Background Thread

### Nguyên lý

Chuyển logic xử lý **tốn thời gian** (sorting, filtering, flattening 100K items) sang **background thread**. Main thread chỉ lo render UI.

```
WEB WORKER ARCHITECTURE:
═══════════════════════════════════════════════════════════

  ┌─────────────────┐     postMessage()     ┌──────────────┐
  │                 │ ───────────────────►   │              │
  │   MAIN THREAD   │     { type, data }     │  WEB WORKER  │
  │                 │                        │              │
  │  • DOM access   │     postMessage()      │  • Sort 100K │
  │  • UI rendering │ ◄───────────────────   │  • Filter    │
  │  • User events  │     { type, result }   │  • Flatten   │
  │                 │                        │  • Transform │
  └─────────────────┘                        └──────────────┘

  ⭐ KEY: Worker KHÔNG có quyền truy cập DOM
  → Chỉ xử lý DATA, gửi kết quả về main thread
  → Main thread KHÔNG BỊ BLOCK!
```

### Implementation

**Main thread (`main.js`):**

```javascript
// Tạo Worker instance
const worker = new Worker("worker.js");

// Gửi data sang Worker
worker.postMessage({
  type: "PROCESS_TREE",
  data: largeTreeData, // 100K items
});

// Nhận kết quả từ Worker
worker.onmessage = function (e) {
  if (e.data.type === "PROCESSED_TREE") {
    // Data đã xử lý xong → update UI
    updateUI(e.data.result);
  }
};
```

**Worker thread (`worker.js`):**

```javascript
// Nhận message từ main thread
self.onmessage = function (e) {
  if (e.data.type === "PROCESS_TREE") {
    // Xử lý nặng ở đây (sort, filter, flatten, ...)
    const result = processLargeTree(e.data.data);

    // Gửi kết quả về main thread
    self.postMessage({ type: "PROCESSED_TREE", result });
  }
};

function processLargeTree(treeData) {
  // Flatten tree, sort, filter, ...
  // CPU-intensive nhưng KHÔNG ảnh hưởng UI!
  return flattenedAndSortedData;
}
```

> **Lưu ý quan trọng:**
>
> - `postMessage` **serialize** data (structured clone) → overhead với data lớn
> - Có thể dùng **Transferable Objects** (`ArrayBuffer`) để transfer ownership thay vì copy
> - Worker phù hợp cho: sorting, searching, data transformation, crypto

---

## §6. Time Slicing — Chia Nhỏ Render Task

### Nguyên lý

Tương tự Data Sharding nhưng tổng quát hơn — chia **bất kỳ task array** thành batches nhỏ, mỗi batch chạy trong **một frame**.

```
TIME SLICING vs NO SLICING:
═══════════════════════════════════════════════════════════

  ❌ KHÔNG time slicing:
  ┌────────────────────────────────────────────────────────┐
  │  Frame 1: ████████████████████████████████ 500ms BLOCK │
  │  → User click/scroll → KHÔNG PHẢN HỒI!              │
  │  → Browser freeze 500ms                               │
  └────────────────────────────────────────────────────────┘

  ✅ CÓ time slicing:
  ┌────────────────────────────────────────────────────────┐
  │  Frame 1: ██░░░░  Frame 2: ██░░░░  Frame 3: ██░░░░  │
  │           5 tasks          5 tasks          5 tasks    │
  │  → Mỗi frame xử lý ít → browser KỊP paint + input  │
  │  → UI MƯỢT MÀ!                                       │
  └────────────────────────────────────────────────────────┘
```

### Implementation

```javascript
function timeSlice(tasks, fn, chunkSize = 5) {
  /**
   * @param {Array} tasks     - Danh sách tasks cần xử lý
   * @param {Function} fn     - Logic xử lý cho mỗi task
   * @param {number} chunkSize - Số tasks mỗi frame (default 5)
   */

  function next() {
    // Lấy chunkSize tasks đầu tiên (splice = lấy + xóa khỏi array gốc)
    const chunk = tasks.splice(0, chunkSize);

    // Xử lý từng task
    chunk.forEach(fn);

    // Còn tasks → tiếp tục frame sau
    if (tasks.length > 0) {
      requestAnimationFrame(next);
    }
  }

  // Bắt đầu từ frame tiếp theo
  requestAnimationFrame(next);
}
```

> **Khác biệt với Data Sharding:**
>
> - Data Sharding: focus vào **render DOM** (append elements)
> - Time Slicing: tổng quát hơn — **bất kỳ CPU task** (calc, transform, validate)
> - Cùng dùng `requestAnimationFrame` nhưng mục đích khác nhau

---

## §7. IndexedDB Cache — Lưu Data Đã Load

### Nguyên lý

Dùng **IndexedDB** (browser-side database, async, lưu trữ lớn) để cache data đã tải. Lần sau truy cập → đọc từ cache, không cần request lại.

```
INDEXEDDB CACHING FLOW:
═══════════════════════════════════════════════════════════

  User request data
        │
        ▼
  ┌─────────────┐    HIT     ┌──────────────┐
  │  IndexedDB   │ ────────► │  Trả data    │
  │  có cache?   │           │  từ cache    │
  └──────┬───────┘           └──────────────┘
         │ MISS
         ▼
  ┌─────────────┐           ┌──────────────┐
  │  Fetch from  │ ────────► │  Lưu vào     │
  │  Backend API │           │  IndexedDB   │
  └─────────────┘           └──────────────┘

  ⭐ IndexedDB vs localStorage:
  ┌────────────────┬──────────────┬────────────────┐
  │                │ localStorage │ IndexedDB      │
  ├────────────────┼──────────────┼────────────────┤
  │ Dung lượng     │ ~5MB         │ ~50MB+         │
  │ API            │ Sync         │ Async          │
  │ Data types     │ String only  │ Any (object,   │
  │                │              │ blob, array...)│
  │ Index/Query    │ Không        │ CÓ (keyPath)   │
  └────────────────┴──────────────┴────────────────┘
```

### Implementation

```javascript
// ═══════════════════════════════════════════════════
// MỞ DATABASE
// ═══════════════════════════════════════════════════
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("TreeDataDB", 1);

    // Lần đầu tạo hoặc upgrade version → tạo object store
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      db.createObjectStore("trees", { keyPath: "id" });
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// ═══════════════════════════════════════════════════
// LƯU DATA VÀO INDEXEDDB
// ═══════════════════════════════════════════════════
async function storeTreeData(treeId, treeData) {
  const db = await openDatabase();
  const tx = db.transaction("trees", "readwrite");
  const store = tx.objectStore("trees");

  // put = insert hoặc update nếu id đã tồn tại
  await store.put({ id: treeId, data: treeData });
  await tx.complete;
}

// ═══════════════════════════════════════════════════
// ĐỌC DATA TỪ INDEXEDDB
// ═══════════════════════════════════════════════════
async function getTreeData(treeId) {
  const db = await openDatabase();
  const tx = db.transaction("trees", "readonly");
  const store = tx.objectStore("trees");

  return await store.get(treeId);
}
```

> **Flow hoàn chỉnh:**
>
> 1. `indexedDB.open()` — mở/tạo database
> 2. `onupgradeneeded` — tạo object store (chỉ chạy lần đầu hoặc khi upgrade version)
> 3. `storeTreeData(id, data)` — lưu cache qua transaction
> 4. `getTreeData(id)` — đọc cache, trả `{ id, data }`

---

## §8. Virtual List — Chỉ Render Viewport

### Nguyên lý

Thay vì render **100K DOM nodes**, chỉ render **những items hiện tại trong viewport** (~20-50 items). Scroll lên/xuống → recalculate visible range → swap DOM content.

```
VIRTUAL LIST CONCEPT:
═══════════════════════════════════════════════════════════

                    ┌───────────────┐
                    │  Buffer Zone  │ ← render thêm vài items
                    │  (overscan)   │   để scroll mượt
  ┌─────────────────┼───────────────┼─────────────────┐
  │                 │               │                 │
  │                 │  ██ Item 15   │                 │
  │   KHÔNG        │  ██ Item 16   │   KHÔNG         │
  │   RENDER       │  ██ Item 17   │   RENDER        │
  │   (ẩn)         │  ██ Item 18   │ ← VIEWPORT      │
  │                 │  ██ Item 19   │   (user thấy)   │
  │   Items 1-14   │  ██ Item 20   │                 │
  │                 │  ██ Item 21   │   Items 27+     │
  │                 │               │                 │
  └─────────────────┼───────────────┼─────────────────┘
                    │  Buffer Zone  │
                    └───────────────┘

  ⭐ Chỉ CÓ ~20 DOM nodes trong DOM tree tại mọi thời điểm
  → Thay vì 100,000 nodes → Memory giảm ĐÁNG KỂ
  → Scroll → recalculate startIndex/endIndex → re-render
```

### Key Calculations

```javascript
// Core calculations cho virtual list:

const itemHeight = 40; // Chiều cao mỗi item (px)
const containerHeight = 600; // Chiều cao viewport (px)
const overscan = 5; // Buffer items mỗi bên

// Tổng chiều cao "ảo" (để scrollbar đúng kích thước)
const totalHeight = data.length * itemHeight;

// Khi scroll:
function getVisibleRange(scrollTop) {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = startIndex + Math.ceil(containerHeight / itemHeight);

  return {
    start: Math.max(0, startIndex - overscan),
    end: Math.min(data.length - 1, endIndex + overscan),
    offsetY: startIndex * itemHeight, // translateY cho visible items
  };
}
```

> **Libraries phổ biến:** `react-window`, `react-virtuoso`, `@tanstack/react-virtual`

---

## §9. Tổng Hợp — Chiến Lược Kết Hợp

```
FULL SOLUTION — KẾT HỢP CÁC KỸ THUẬT:
═══════════════════════════════════════════════════════════

  Backend trả 100K data
         │
         ▼
  ┌──────────────────────────────────────────────────────┐
  │ BƯỚC 1: CHECK CACHE (IndexedDB)                      │
  │ → Có cache + chưa expire? → dùng cache              │
  │ → Không có → fetch từ API                           │
  └────────────────────────┬─────────────────────────────┘
                           │
                           ▼
  ┌──────────────────────────────────────────────────────┐
  │ BƯỚC 2: WEB WORKER XỬ LÝ DATA                       │
  │ → Flatten tree structure                              │
  │ → Sort / Filter / Transform                          │
  │ → postMessage kết quả về main thread                 │
  └────────────────────────┬─────────────────────────────┘
                           │
                           ▼
  ┌──────────────────────────────────────────────────────┐
  │ BƯỚC 3: CACHE KẾT QUẢ (IndexedDB)                   │
  │ → Lưu processed data để lần sau dùng lại            │
  └────────────────────────┬─────────────────────────────┘
                           │
                           ▼
  ┌──────────────────────────────────────────────────────┐
  │ BƯỚC 4: VIRTUAL LIST RENDER                          │
  │ → Chỉ render visible items (~20-50 DOM nodes)       │
  │ → Scroll → recalculate → re-render                  │
  │ → Throttle scroll handler                            │
  └──────────────────────────────────────────────────────┘

  ⚡ BONUS: Nếu data là TREE:
  → Lazy load children khi user expand node
  → Time slicing cho initial render
  → React.lazy + Suspense cho heavy components
```

---

## §10. Câu Hỏi Phỏng Vấn

### Q1: Backend trả 10 vạn dữ liệu, bước đầu tiên bạn làm gì?

> **Trả lời mẫu:**
> Bước đầu tiên tôi sẽ **hỏi lại backend** tại sao không pagination ở phía server — đây là approach tốt nhất về mặt architecture. Nếu business requirement BẮT BUỘC phải trả hết (ví dụ: offline-first app, export data), thì tôi sẽ kết hợp **Virtual List** (chỉ render viewport), **Web Worker** (xử lý data ở background thread), và **IndexedDB** (cache data để không fetch lại). Render dùng **time slicing** với `requestAnimationFrame` để tránh block main thread.

### Q2: Virtual List hoạt động thế nào? Tại sao nó nhanh?

> Thay vì mount 100K DOM nodes → chỉ render **~20-50 nodes** trong viewport. Dùng **container có height cố định** scroll, tính `startIndex` / `endIndex` từ `scrollTop`, render phần visible + overscan buffer. Tổng height "giả" bằng `totalItems × itemHeight` để scrollbar chính xác. Nhanh vì: **ít DOM nodes** → ít memory, ít layout/paint, ít GC.

### Q3: requestAnimationFrame vs setTimeout — khác gì?

> `rAF` đồng bộ với **paint cycle** của browser (~16.67ms ở 60fps), tự pause khi tab inactive. `setTimeout(fn, 0)` thực tế delay ≥4ms, không sync với paint, tiếp tục chạy khi tab inactive → waste CPU.

### Q4: Web Worker có giới hạn gì?

> **Không access DOM**, không access `window`/`document`. Communication qua `postMessage` — data bị **structured clone** (copy) → overhead với large objects. Giải pháp: dùng **Transferable Objects** (`ArrayBuffer`) để transfer ownership không copy. Mỗi Worker là **1 thread riêng** → tạo quá nhiều = overhead.

### Q5: Tại sao dùng IndexedDB thay vì localStorage cho large data?

> `localStorage` chỉ **5MB**, **sync** API (block main thread), chỉ lưu **string** (phải `JSON.stringify`). IndexedDB lưu **50MB+**, có **async** API, hỗ trợ **mọi data type** (object, blob, array), có **index** để query nhanh. Với 100K items (~vài MB JSON), IndexedDB là lựa chọn duy nhất hợp lý.

### Q6: Data Flattening có lợi ích gì trong thực tế?

> Chuyển tree lồng nhau thành flat object `{ [id]: node }` → **O(1) access** thay vì traverse O(n). Dễ dùng với Virtual List (flat array dễ virtualize). Dễ **update từng node** mà không cần rebuild tree. Dễ **sync với IndexedDB** (key-value store).

### Q7: Throttle và Debounce — dùng cái nào cho scroll trong virtual list?

> **Throttle** — vì muốn scroll handler CHẠY ĐỀU mỗi ~16ms (mỗi frame), không bỏ lỡ scroll events. Debounce sẽ CHỈ chạy SAU KHI ngừng scroll → user thấy blank content trong lúc scroll. Trong thực tế, `requestAnimationFrame` chính là "natural throttle" tốt nhất cho scroll.

### Q8: Nếu data thay đổi real-time (WebSocket push), xử lý thế nào?

> Dùng **diff + patch**: so sánh data cũ và mới, chỉ update các items thay đổi thay vì re-render toàn bộ. Kết hợp **immutable data structures** (hoặc `structuredClone`) để React detect changes qua reference comparison. Batch multiple updates vào **1 render cycle** bằng `requestAnimationFrame` hoặc React 18's `startTransition`.
