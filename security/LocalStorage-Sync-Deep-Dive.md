# localStorage Sync vs Async — Deep Dive!

> **localStorage là ĐỒNG BỘ! Tại sao?**
> Disk I/O, blocking JS thread, IndexedDB, Web Storage API!

---

## §1. localStorage Là Đồng Bộ!

```
  localStorage — SYNCHRONOUS! ★
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  localStorage.setItem('key', 'value')                         │
  │       │                                                        │
  │       ▼                                                        │
  │  ┌─────────────────────────────────────┐                      │
  │  │ JS Thread BỊ BLOCK! ★               │                      │
  │  │ → Chờ ghi xong disk!               │                      │
  │  │ → KHÔNG chạy code tiếp!            │                      │
  │  └─────────────┬───────────────────────┘                      │
  │                │                                              │
  │                ▼                                              │
  │  ┌─────────────────────────────────────┐                      │
  │  │ Browser Storage Subsystem            │                      │
  │  │ → Synchronous I/O → Disk! ★         │                      │
  │  └─────────────┬───────────────────────┘                      │
  │                │                                              │
  │                ▼                                              │
  │  ┌─────────────────────────────────────┐                      │
  │  │ I/O hoàn tất → return!              │                      │
  │  │ → JS Thread TIẾP TỤC! ★            │                      │
  │  └─────────────────────────────────────┘                      │
  │                                                              │
  │  ★ Data lưu trên HARD DRIVE! (persistent!)                   │
  │  ★ Đóng trình duyệt → data VẪN CÒN! ★                      │
  │  ★ Giới hạn ~5MB! ★                                          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Quy Trình Hoạt Động Chi Tiết!

```
  FLOW — từng bước!
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① JS gọi localStorage.setItem('key', 'value')               │
  │     │                                                          │
  │     │  ★ Single-threaded! Gọi trên JS thread!                │
  │     ▼                                                          │
  │  ② Browser engine nhận request!                                │
  │     │                                                          │
  │     │  ★ Gửi synchronous I/O request!                         │
  │     │  ★ JS engine CHỜ! (blocked!) ★★★                       │
  │     ▼                                                          │
  │  ③ Storage subsystem → ghi disk!                               │
  │     │                                                          │
  │     │  ★ OS có thể cache/optimize!                            │
  │     │  ★ Nhưng từ browser → đây là SYNC operation!           │
  │     ▼                                                          │
  │  ④ I/O hoàn tất → return result!                               │
  │     │                                                          │
  │     │  ★ Data đã ghi/đọc xong!                                │
  │     ▼                                                          │
  │  ⑤ JS thread TIẾP TỤC dòng tiếp theo!                        │
  │     │                                                          │
  │     ★ ĐỒNG BỘ = code chạy TUẦN TỰ! ★                        │
  │     ★ Dòng sau CHẮC CHẮN thấy data đã set! ★                │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// CHỨNG MINH: localStorage là ĐỒNG BỘ!
// ═══════════════════════════════════════════════════════════

function testSync() {
  console.log("1. Trước setItem");

  localStorage.setItem("test", "đồng bộ!");

  console.log("2. Sau setItem");

  var value = localStorage.getItem("test");

  console.log("3. Giá trị:", value);

  console.log("4. Sau getItem");
}
// Output TUẦN TỰ:
// 1. Trước setItem
// 2. Sau setItem
// 3. Giá trị: đồng bộ!    ← ★ Có ngay! Không cần callback!
// 4. Sau getItem

// ═══════════════════════════════════════════════════════════
// SO SÁNH NẾU LÀ ASYNC:
// ═══════════════════════════════════════════════════════════

// NẾU localStorage là async (giả sử!):
// console.log('1. Trước');
// localStorage.setItem('key', 'value', function() {
//   console.log('3. Callback!'); // ← Cần callback!
// });
// console.log('2. Sau');
// Output: 1 → 2 → 3 (async!)
//
// NHƯNG localStorage KHÔNG CẦN callback! ★
// → Vì nó là SYNC! ★
```

---

## §3. Tại Sao Thiết Kế Đồng Bộ?

```
  5 LÝ DO:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① LỊCH SỬ:                                                     │
  │  → localStorage ra đời thời web ĐƠN GIẢN! ★                │
  │  → Chưa cần async phức tạp!                                  │
  │                                                              │
  │  ② ĐƠN GIẢN:                                                    │
  │  → API trực quan! Không cần callback/Promise! ★              │
  │  → var x = localStorage.getItem('key') → XONG! ★            │
  │  → Dễ hiểu, dễ dùng!                                         │
  │                                                              │
  │  ③ DATA NHỎ:                                                    │
  │  → Giới hạn ~5MB! ★                                          │
  │  → Data nhỏ → sync nhanh → ít ảnh hưởng! ★                 │
  │                                                              │
  │  ④ TƯƠNG THÍCH:                                                  │
  │  → Giữ sync → tương thích code cũ! ★                        │
  │  → Đổi sang async → BREAK tất cả code cũ! ❌                │
  │                                                              │
  │  ⑤ NHẤT QUÁN:                                                   │
  │  → Đọc ngay sau ghi → CHẮC CHẮN có data! ★                 │
  │  → Không race condition! ★                                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Disk I/O Không Phải Async Sao?

```
  ★ ĐÚNG! Disk I/O ở OS level là ASYNC! ★
  ★ NHƯNG browser CHỌN block JS thread! ★

  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  OS Level:          ← ASYNC I/O! ★                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Process gửi I/O request → OS xử lý async →          │    │
  │  │ Callback khi xong! (non-blocking!)                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  Browser Level:     ← SYNC trên JS thread! ★                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ JS call → Browser engine BLOCK thread! ★              │    │
  │  │ → Chờ OS I/O xong → return → JS tiếp tục! ★         │    │
  │  │                                                      │    │
  │  │ Browser làm "cầu nối":                                │    │
  │  │   OS async I/O → Browser chờ → return sync cho JS!   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ★ Browser BIẾN async thành sync bằng cách BLOCK! ★★★        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Tự Viết Wrapper!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Safe localStorage wrapper! ★
// ═══════════════════════════════════════════════════════════

function SafeStorage() {
  this.prefix = "app_";
}

// ★ setItem — có try/catch! (quota exceeded!)
SafeStorage.prototype.set = function (key, value) {
  try {
    var data = JSON.stringify({
      value: value,
      timestamp: Date.now(),
    });
    localStorage.setItem(this.prefix + key, data);
    return true;
  } catch (e) {
    // ★ QuotaExceededError khi vượt 5MB! ★
    console.error("localStorage set lỗi:", e.message);
    return false;
  }
};

// ★ getItem — parse JSON + fallback!
SafeStorage.prototype.get = function (key, fallback) {
  try {
    var raw = localStorage.getItem(this.prefix + key);
    if (raw === null) return fallback !== undefined ? fallback : null;

    var parsed = JSON.parse(raw);
    return parsed.value;
  } catch (e) {
    // ★ JSON parse lỗi → return fallback!
    return fallback !== undefined ? fallback : null;
  }
};

// ★ setItem với TTL (Time To Live — hết hạn!)
SafeStorage.prototype.setWithTTL = function (key, value, ttlMs) {
  try {
    var data = JSON.stringify({
      value: value,
      expiry: Date.now() + ttlMs, // ★ Thời điểm hết hạn!
    });
    localStorage.setItem(this.prefix + key, data);
    return true;
  } catch (e) {
    return false;
  }
};

// ★ getItem với TTL check!
SafeStorage.prototype.getWithTTL = function (key, fallback) {
  try {
    var raw = localStorage.getItem(this.prefix + key);
    if (raw === null) return fallback !== undefined ? fallback : null;

    var parsed = JSON.parse(raw);

    // ★ Kiểm tra hết hạn!
    if (parsed.expiry && Date.now() > parsed.expiry) {
      localStorage.removeItem(this.prefix + key); // ★ Xóa!
      return fallback !== undefined ? fallback : null;
    }

    return parsed.value;
  } catch (e) {
    return fallback !== undefined ? fallback : null;
  }
};

// ★ remove!
SafeStorage.prototype.remove = function (key) {
  localStorage.removeItem(this.prefix + key);
};

// ★ clear tất cả key có prefix!
SafeStorage.prototype.clearAll = function () {
  var keysToRemove = [];
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k && k.indexOf(this.prefix) === 0) {
      keysToRemove.push(k);
    }
  }
  for (var j = 0; j < keysToRemove.length; j++) {
    localStorage.removeItem(keysToRemove[j]);
  }
};

// ★ Kiểm tra dung lượng đã dùng! (ước lượng!)
SafeStorage.prototype.getUsedSize = function () {
  var total = 0;
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    var v = localStorage.getItem(k);
    // ★ UTF-16: mỗi ký tự = 2 bytes!
    total += (k.length + v.length) * 2;
  }
  return {
    bytes: total,
    kb: Math.round(total / 1024),
    mb: (total / (1024 * 1024)).toFixed(2),
  };
};
```

---

## §6. localStorage vs IndexedDB!

```
  SO SÁNH:
  ┌──────────────────┬──────────────────┬──────────────────┐
  │ Tiêu chí        │ localStorage ★   │ IndexedDB ★      │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Sync/Async       │ ĐỒNG BỘ! ★      │ BẤT ĐỒNG BỘ! ★ │
  │ Block thread     │ CÓ! ❌ ★         │ KHÔNG! ✅ ★      │
  │ Dung lượng      │ ~5MB ★           │ Hàng trăm MB! ★ │
  │ Data type         │ String only!     │ Mọi type! ★      │
  │ API               │ Đơn giản! ★     │ Phức tạp hơn!   │
  │ Query             │ Chỉ key! ★      │ Index + cursor!  │
  │ Transaction       │ KHÔNG!           │ CÓ! ★            │
  │ Web Worker        │ KHÔNG dùng! ❌  │ CÓ dùng! ✅ ★   │
  │ Dùng khi          │ Config nhỏ! ★   │ Data lớn! ★      │
  │                  │ Token, theme!    │ Offline app! ★   │
  └──────────────────┴──────────────────┴──────────────────┘

  KHI NÀO DÙNG GÌ?
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  localStorage:                                                 │
  │  → Token, user preferences, theme! ★                         │
  │  → Data < 5MB! ★                                              │
  │  → Cần API đơn giản! ★                                       │
  │  → Đọc/ghi nhanh, data nhỏ! ★                               │
  │                                                              │
  │  IndexedDB:                                                     │
  │  → Offline-first app! ★                                       │
  │  → Cache API response! ★                                      │
  │  → Data lớn (images, files!) ★                                │
  │  → Cần query phức tạp! ★                                     │
  │  → KHÔNG muốn block main thread! ★★★                         │
  │                                                              │
  │  sessionStorage:                                                │
  │  → Data CHỈ trong 1 tab! ★                                   │
  │  → Đóng tab → MẤT! ★                                        │
  │  → Form state tạm thời! ★                                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: localStorage đồng bộ hay bất đồng bộ?                    │
  │  → ĐỒNG BỘ! ★ Block JS thread! ★                            │
  │  → Disk I/O ở OS là async NHƯNG browser block chờ! ★        │
  │  → Dòng sau setItem CHẮC CHẮN thấy data! ★                  │
  │                                                              │
  │  ❓ 2: Tại sao đồng bộ?                                          │
  │  → Lịch sử (web đơn giản!)                                   │
  │  → API đơn giản (không callback/Promise!)                    │
  │  → Data nhỏ (~5MB → sync nhanh!)                             │
  │  → Tương thích code cũ! ★                                    │
  │                                                              │
  │  ❓ 3: Nhược điểm?                                                │
  │  → Block main thread → UI đơ nếu data lớn! ❌ ★             │
  │  → Chỉ lưu STRING! ★                                         │
  │  → Giới hạn ~5MB! ★                                          │
  │  → Không dùng trong Web Worker! ★                             │
  │                                                              │
  │  ❓ 4: Khi nào dùng IndexedDB thay localStorage?                 │
  │  → Data > 5MB! ★                                              │
  │  → Cần async (không block!)! ★                                │
  │  → Cần lưu object/blob (không chỉ string!)! ★               │
  │  → Cần query, index, transaction! ★                           │
  │  → Offline-first application! ★                               │
  │                                                              │
  │  ❓ 5: QuotaExceededError?                                       │
  │  → Vượt ~5MB → throw error! ★                                │
  │  → PHẢI try/catch khi setItem! ★★★                           │
  │  → Fallback: xóa data cũ hoặc báo user! ★                   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
