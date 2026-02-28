# Web Workers — Deep Dive!

> **"Anh hùng thầm lặng" của hiệu năng Frontend!**
> Main thread free, background computation, postMessage!

---

## §1. Tại Sao Cần Web Worker?

```
  VẤN ĐỀ: MAIN THREAD BỊ BLOCK!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  JS = SINGLE THREAD! ★                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Main Thread:                                          │    │
  │  │ ┌────┐ ┌────┐ ┌────────────────────┐ ┌────┐          │    │
  │  │ │ UI │ │Click│ │ HEAVY COMPUTATION │ │Click│          │    │
  │  │ │draw│ │ evt │ │ (sort 1M items!)  │ │ evt │          │    │
  │  │ └────┘ └────┘ └────────────────────┘ └────┘          │    │
  │  │  10ms   5ms    ████ 5000ms! ████     5ms              │    │
  │  │                ↑                                      │    │
  │  │                UI FREEZE! ❌                           │    │
  │  │                User click = KHÔNG phản hồi! ❌        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TRIỆU CHỨNG:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ Page đóng băng (frozen!) — click không phản hồi! │    │
  │  │ ❌ CPU quá tải — quạt laptop quay vù vù!            │    │
  │  │ ❌ UX tệ — user tưởng web hỏng, đóng tab ngay!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ THỰC TẾ (E-commerce sort!):                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ User click "Sắp xếp giá" → PAGE FREEZE 5s! ❌      │    │
  │  │ → Không search được! Không add cart được!            │    │
  │  │ → Tỉ lệ rời trang: 40%! ❌❌                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP: WEB WORKER! ★                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ "Thuê thêm 1 trợ lý ở phòng sau!"                   │    │
  │  │ → Việc nặng giao cho Worker (background thread!)    │    │
  │  │ → Main thread CHỈ lo UI! ★                           │    │
  │  │ → User LUÔN tương tác mượt mà!                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Nguyên Lý Hoạt Động!

```
  KIẾN TRÚC WEB WORKER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌────────────────────┐      ┌────────────────────┐         │
  │  │ MAIN THREAD         │      │ WORKER THREAD       │         │
  │  │                    │      │                    │         │
  │  │ ★ UI rendering     │      │ ★ Heavy computation│         │
  │  │ ★ Event handling    │      │ ★ Data processing  │         │
  │  │ ★ DOM access        │      │ ★ Sorting/Filtering│         │
  │  │ ★ User interaction  │      │ ★ Encryption       │         │
  │  │                    │      │                    │         │
  │  │  postMessage(data)──┼──→──┼─ self.onmessage    │         │
  │  │                    │      │      │              │         │
  │  │                    │      │      ▼              │         │
  │  │                    │      │  Xử lý data!       │         │
  │  │                    │      │      │              │         │
  │  │  worker.onmessage──┼──←──┼─ self.postMessage   │         │
  │  │      │              │      │                    │         │
  │  │      ▼              │      │                    │         │
  │  │  Update UI!         │      │                    │         │
  │  └────────────────────┘      └────────────────────┘         │
  │                                                              │
  │  3 KHÁI NIỆM CHÍNH:                                            │
  │  ┌──────────────┬──────────────────┬────────────────┐        │
  │  │ Khái niệm   │ Giải thích      │ Ví von         │        │
  │  ├──────────────┼──────────────────┼────────────────┤        │
  │  │ Main thread   │ UI + interaction │ Lễ tân công ty│        │
  │  │ Web Worker    │ Background task  │ Quản lý kho  │        │
  │  │ postMessage   │ Giao tiếp 2 chiều│ Bộ đàm! ★  │        │
  │  └──────────────┴──────────────────┴────────────────┘        │
  │                                                              │
  │  GIỚI HẠN CỦA WORKER:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ KHÔNG truy cập DOM! (document, window.X!)        │    │
  │  │ ❌ KHÔNG chia sẻ memory trực tiếp! ★                │    │
  │  │ ❌ Cross-origin bị hạn chế!                         │    │
  │  │ ✅ CÓ: setTimeout, setInterval, fetch, IndexedDB!   │    │
  │  │ ✅ CÓ: XMLHttpRequest, WebSocket!                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Cách Sử Dụng — Step by Step!

```javascript
// ═══════════════════════════════════════════════════════════
// BƯỚC 1: Tạo Worker file riêng!
// ═══════════════════════════════════════════════════════════

// === worker.js ===
self.onmessage = function (event) {
  var data = event.data;
  var result = 0;

  // ★ Tính toán nặng chạy ở ĐÂY!
  // → Main thread KHÔNG bị block! ★
  for (var i = 0; i < 100000000; i++) {
    result += i;
  }

  // ★ Gửi kết quả về main thread!
  self.postMessage(result);
};

// === main.js ===
var worker = new Worker("worker.js");

// ★ Gửi lệnh cho Worker!
worker.postMessage("start");

// ★ Nhận kết quả!
worker.onmessage = function (event) {
  console.log("Kết quả:", event.data);
  document.getElementById("result").textContent = "Kết quả: " + event.data;
};

// ★ Xử lý lỗi!
worker.onerror = function (error) {
  console.error("Worker lỗi:", error.message);
};

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Inline Worker — KHÔNG cần file riêng!
// ★ Tạo Worker từ function bằng Blob URL!
// ═══════════════════════════════════════════════════════════

function createInlineWorker(workerFunc) {
  var code = "(" + workerFunc.toString() + ")()";
  var blob = new Blob([code], { type: "application/javascript" });
  var url = URL.createObjectURL(blob);
  var worker = new Worker(url);

  // ★ Cleanup URL sau khi tạo!
  worker._blobUrl = url;
  return worker;
}

function terminateWorker(worker) {
  worker.terminate();
  if (worker._blobUrl) {
    URL.revokeObjectURL(worker._blobUrl);
  }
}
```

---

## §4. Ứng Dụng Thực Tế!

```javascript
// ═══════════════════════════════════════════════════════════
// ỨNG DỤNG 1: Sort 1 triệu items!
// ═══════════════════════════════════════════════════════════

function sortInWorker(items) {
  return new Promise(function (resolve, reject) {
    var worker = createInlineWorker(function () {
      self.onmessage = function (e) {
        var arr = e.data;
        // ★ Merge sort 1M items — ở BACKGROUND!
        arr.sort(function (a, b) {
          return a.price - b.price;
        });
        self.postMessage(arr);
      };
    });

    worker.onmessage = function (e) {
      resolve(e.data);
      terminateWorker(worker); // ★ Dọn dẹp!
    };
    worker.onerror = reject;
    worker.postMessage(items);
  });
}

// ═══════════════════════════════════════════════════════════
// ỨNG DỤNG 2: Image filter processing!
// ═══════════════════════════════════════════════════════════

function applyFilterInWorker(imageData) {
  return new Promise(function (resolve, reject) {
    var worker = createInlineWorker(function () {
      self.onmessage = function (e) {
        var data = e.data;
        var pixels = data.data;

        // ★ Grayscale filter!
        for (var i = 0; i < pixels.length; i += 4) {
          var avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          pixels[i] = avg; // R
          pixels[i + 1] = avg; // G
          pixels[i + 2] = avg; // B
          // pixels[i+3] = alpha (giữ nguyên!)
        }

        // ★ Dùng Transferable → KHÔNG copy data!
        self.postMessage(data, [data.data.buffer]);
      };
    });

    worker.onmessage = function (e) {
      resolve(e.data);
      terminateWorker(worker);
    };
    worker.onerror = reject;

    // ★ Transfer ownership → zero-copy! ★
    worker.postMessage(imageData, [imageData.data.buffer]);
  });
}

// ═══════════════════════════════════════════════════════════
// ỨNG DỤNG 3: Data aggregation (sales report!)
// ═══════════════════════════════════════════════════════════

function aggregateInWorker(salesData) {
  return new Promise(function (resolve, reject) {
    var worker = createInlineWorker(function () {
      self.onmessage = function (e) {
        var data = e.data;
        var byCategory = {};
        var total = 0;

        for (var i = 0; i < data.length; i++) {
          var item = data[i];
          total += item.amount;
          if (!byCategory[item.category]) {
            byCategory[item.category] = { count: 0, sum: 0 };
          }
          byCategory[item.category].count++;
          byCategory[item.category].sum += item.amount;
        }

        self.postMessage({ total: total, byCategory: byCategory });
      };
    });

    worker.onmessage = function (e) {
      resolve(e.data);
      terminateWorker(worker);
    };
    worker.onerror = reject;
    worker.postMessage(salesData);
  });
}
```

```
  SO SÁNH HIỆU NĂNG:
  ┌──────────────────────────────────────────────────────────────┐
  │  ┌──────────────────┬──────────────┬──────────────────┐     │
  │  │ Tiêu chí        │ Không Worker │ Có Worker ★      │     │
  │  ├──────────────────┼──────────────┼──────────────────┤     │
  │  │ Response time     │ 5s ❌        │ 0.5s ✅ ★        │     │
  │  │ CPU sử dụng     │ 90% ❌       │ 30% ✅           │     │
  │  │ Page lag?         │ CÓ ❌        │ KHÔNG ✅ ★       │     │
  │  │ User interaction  │ Block! ❌    │ Mượt mà! ✅ ★  │     │
  │  └──────────────────┴──────────────┴──────────────────┘     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Advanced — Transferable, Pool, Sub-Worker!

```javascript
// ═══════════════════════════════════════════════════════════
// ADVANCED 1: Transferable Objects — zero-copy!
// ★ Chuyển QUYỀN SỞ HỮU thay vì COPY data!
// ═══════════════════════════════════════════════════════════

// ❌ TỆ: Copy ArrayBuffer (tốn memory + time!)
// worker.postMessage(buffer);
// → Browser COPY toàn bộ buffer! Chậm với data lớn!

// ✅ TỐT: Transfer ArrayBuffer! ★
// worker.postMessage(buffer, [buffer]);
// → CHUYỂN quyền sở hữu! Không copy!
// → buffer ở main thread = EMPTY sau khi transfer!

function transferExample() {
  var buffer = new ArrayBuffer(1024 * 1024); // 1MB
  console.log("Before:", buffer.byteLength); // 1048576

  worker.postMessage(buffer, [buffer]); // ★ Transfer!

  console.log("After:", buffer.byteLength); // 0! ★
  // → buffer KHÔNG còn sử dụng được ở main thread!
  // → Worker giờ SỞ HỮU buffer!
}

// ═══════════════════════════════════════════════════════════
// ADVANCED 2: Worker Pool — quản lý nhiều Worker!
// ★ Tự viết pool, không dùng thư viện!
// ═══════════════════════════════════════════════════════════

function WorkerPool(workerFunc, size) {
  this.size = size || navigator.hardwareConcurrency || 4;
  this.workers = [];
  this.queue = [];
  this.activeCount = 0;

  // ★ Tạo pool workers!
  for (var i = 0; i < this.size; i++) {
    this.workers.push({
      worker: createInlineWorker(workerFunc),
      busy: false,
    });
  }
}

// ★ Gửi task → Worker rảnh nhất!
WorkerPool.prototype.exec = function (data) {
  var self = this;

  return new Promise(function (resolve, reject) {
    var task = { data: data, resolve: resolve, reject: reject };

    // Tìm worker rảnh!
    var free = null;
    for (var i = 0; i < self.workers.length; i++) {
      if (!self.workers[i].busy) {
        free = self.workers[i];
        break;
      }
    }

    if (free) {
      self._runTask(free, task);
    } else {
      self.queue.push(task); // ★ Hàng đợi!
    }
  });
};

WorkerPool.prototype._runTask = function (workerObj, task) {
  var self = this;
  workerObj.busy = true;
  self.activeCount++;

  workerObj.worker.onmessage = function (e) {
    task.resolve(e.data);
    workerObj.busy = false;
    self.activeCount--;

    // ★ Có task đang chờ? Chạy tiếp!
    if (self.queue.length > 0) {
      var nextTask = self.queue.shift();
      self._runTask(workerObj, nextTask);
    }
  };

  workerObj.worker.onerror = function (err) {
    task.reject(err);
    workerObj.busy = false;
    self.activeCount--;
  };

  workerObj.worker.postMessage(task.data);
};

// ★ Dọn dẹp tất cả!
WorkerPool.prototype.terminate = function () {
  for (var i = 0; i < this.workers.length; i++) {
    terminateWorker(this.workers[i].worker);
  }
  this.workers = [];
  this.queue = [];
};

// SỬ DỤNG:
// var pool = new WorkerPool(function() {
//   self.onmessage = function(e) {
//     var result = heavyComputation(e.data);
//     self.postMessage(result);
//   };
// }, 4);
//
// pool.exec(data1).then(r => console.log(r));
// pool.exec(data2).then(r => console.log(r));
// → 4 tasks chạy SONG SONG! ★

// ═══════════════════════════════════════════════════════════
// ADVANCED 3: Task Chunking — chia nhỏ để báo progress!
// ═══════════════════════════════════════════════════════════

function processWithProgress(items, onProgress) {
  return new Promise(function (resolve, reject) {
    var worker = createInlineWorker(function () {
      self.onmessage = function (e) {
        var items = e.data;
        var chunkSize = 10000;
        var result = [];

        for (var i = 0; i < items.length; i += chunkSize) {
          var chunk = items.slice(i, i + chunkSize);

          // Xử lý chunk!
          for (var j = 0; j < chunk.length; j++) {
            result.push(chunk[j] * 2); // Heavy work!
          }

          // ★ Báo progress!
          var progress = Math.min(
            100,
            Math.round(((i + chunkSize) / items.length) * 100),
          );
          self.postMessage({ type: "progress", value: progress });
        }

        self.postMessage({ type: "done", result: result });
      };
    });

    worker.onmessage = function (e) {
      if (e.data.type === "progress") {
        if (onProgress) onProgress(e.data.value);
      } else if (e.data.type === "done") {
        resolve(e.data.result);
        terminateWorker(worker);
      }
    };
    worker.onerror = reject;
    worker.postMessage(items);
  });
}
```

---

## §6. Các Loại Worker!

```
  LOẠI WORKER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────┬──────────────────┬──────────────────┐     │
  │  │ Loại         │ Phạm vi         │ Use case         │     │
  │  ├──────────────┼──────────────────┼──────────────────┤     │
  │  │ Dedicated ★  │ 1 page duy nhất │ Data processing  │     │
  │  │ Worker       │                  │ Sort, filter, calc│    │
  │  ├──────────────┼──────────────────┼──────────────────┤     │
  │  │ Shared       │ Nhiều tab/page!★│ Chat system      │     │
  │  │ Worker       │ Chia sẻ giữa   │ Shared state     │     │
  │  │              │ các tab!         │ Cross-tab sync   │     │
  │  ├──────────────┼──────────────────┼──────────────────┤     │
  │  │ Service      │ Proxy network!★ │ Offline cache    │     │
  │  │ Worker       │ Chặn request!   │ Push notification│     │
  │  │              │ Chạy background! │ Background sync  │     │
  │  └──────────────┴──────────────────┴──────────────────┘     │
  │                                                              │
  │  CHỌN LOẠI NÀO?                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Tính toán nặng 1 page? → Dedicated Worker! ★        │    │
  │  │ Chia sẻ giữa nhiều tab? → Shared Worker!            │    │
  │  │ Offline + cache + push? → Service Worker! ★          │    │
  │  │ Audio processing? → Audio Worklet! (mới!)            │    │
  │  │ CSS paint? → Paint Worklet! (Houdini!)               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Best Practices!

```javascript
// ═══════════════════════════════════════════════════════════
// BEST PRACTICES:
// ═══════════════════════════════════════════════════════════

// ① Tự động detect số Worker tối ưu! ★
function getOptimalWorkerCount() {
  // navigator.hardwareConcurrency = số CPU cores!
  var cores = navigator.hardwareConcurrency || 4;
  return Math.min(cores, 8); // ★ Cap ở 8!
  // → Quá nhiều Worker = tốn memory!
}

// ② LUÔN terminate Worker khi xong! ★
function safeWorkerExec(workerFunc, data) {
  return new Promise(function (resolve, reject) {
    var worker = createInlineWorker(workerFunc);
    var timeout = setTimeout(function () {
      terminateWorker(worker);
      reject(new Error("Worker timeout!"));
    }, 30000); // ★ Timeout 30s!

    worker.onmessage = function (e) {
      clearTimeout(timeout);
      resolve(e.data);
      terminateWorker(worker); // ★ Dọn dẹp!
    };
    worker.onerror = function (err) {
      clearTimeout(timeout);
      reject(err);
      terminateWorker(worker);
    };
    worker.postMessage(data);
  });
}

// ③ Error handling robust! ★
// ④ Dùng Transferable cho big data! ★
// ⑤ Task chunking + progress cho UX tốt! ★
// ⑥ Worker Pool cho nhiều tasks đồng thời! ★
```

---

## §8. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Web Worker giải quyết vấn đề gì?                        │
  │  → JS single thread → heavy computation BLOCK UI! ❌        │
  │  → Worker chạy ở BACKGROUND thread! ★                       │
  │  → Main thread luôn FREE cho UI! ★                           │
  │                                                              │
  │  ❓ 2: Worker có truy cập DOM được không?                       │
  │  → KHÔNG! ❌ Không có document, window.location! ★           │
  │  → Chỉ giao tiếp qua postMessage!                            │
  │  → CÓ: setTimeout, fetch, IndexedDB, WebSocket!             │
  │                                                              │
  │  ❓ 3: postMessage copy hay transfer?                            │
  │  → Mặc định: STRUCTURED CLONE (deep copy!) ★                │
  │  → Chậm với big data! Tốn memory gấp đôi!                  │
  │  → Transferable: CHUYỂN quyền sở hữu! Zero-copy! ★        │
  │  → worker.postMessage(buf, [buf]); → buf = empty ở main!   │
  │                                                              │
  │  ❓ 4: Dedicated vs Shared vs Service Worker?                    │
  │  → Dedicated: 1 page, computation! ★                          │
  │  → Shared: nhiều tab chia sẻ! (chat, sync!)                 │
  │  → Service: proxy network, offline cache, push! ★            │
  │                                                              │
  │  ❓ 5: Worker Pool là gì? Sao cần?                              │
  │  → Pool = nhóm Workers tái sử dụng! ★                      │
  │  → Tạo/hủy Worker tốn tài nguyên → pool tránh!            │
  │  → Queue task → Worker rảnh nhận task tiếp! ★               │
  │  → Giới hạn max workers = hardwareConcurrency!               │
  │                                                              │
  │  ❓ 6: Khi nào KHÔNG nên dùng Worker?                            │
  │  → Task < 50ms → overhead tạo Worker > lợi ích! ❌          │
  │  → Cần DOM access → Worker không làm được!                  │
  │  → Data quá nhỏ → postMessage overhead không đáng!          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
