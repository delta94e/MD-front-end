# localStorage 是同步还是异步？ — Deep Dive

> 📅 2026-02-12 · ⏱ 8 phút đọc
>
> localStorage là **ĐỒNG BỘ (synchronous)**, block JavaScript thread
> cho đến khi disk I/O hoàn tất. Bao gồm: tại sao sync dù disk là
> async I/O, quy trình hoạt động đầy đủ, lý do thiết kế, so sánh
> với IndexedDB (async alternative).
> Độ khó: ⭐️⭐️⭐️ | Chủ đề: Browser / Storage

---

## Mục Lục

0. [Kết luận nhanh](#0-kết-luận)
1. [Tại sao vấn đề này tồn tại?](#1-tại-sao)
2. [Disk là I/O — Tại sao lại sync?](#2-disk-io)
3. [Quy trình hoạt động đầy đủ](#3-quy-trình)
4. [Tại sao thiết kế sync?](#4-lý-do-thiết-kế)
5. [IndexedDB — Async Alternative](#5-indexeddb)
6. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#6-tóm-tắt)

---

## 0. Kết luận

```
KẾT LUẬN:
═══════════════════════════════════════════════════════════════

  localStorage là ĐỒNG BỘ (synchronous).

  → Dù disk I/O bản chất là async ở OS level,
    browser BLOCK JavaScript thread cho đến khi
    read/write hoàn tất.

  → Đặt/lấy data nhỏ (~5MB) → ít ảnh hưởng
  → Data lớn hoặc cần tránh block main thread
    → dùng IndexedDB (async)
```

---

## 1. Tại sao vấn đề này tồn tại?

```
localStorage — BẢN CHẤT:
═══════════════════════════════════════════════════════════════

  localStorage thuộc Web Storage API
  → Lưu key-value pairs
  → Data PERSISTENT trên ổ cứng (KHÔNG phải memory!)

  ┌─────────────────────────────────────────────────────┐
  │ localStorage.setItem('name', 'Jun');                │
  │                                                     │
  │ → Data ghi LÊN Ổ CỨNG (hard drive)                │
  │ → KHÔNG mất khi đóng browser, tắt máy             │
  │ → Chỉ mất khi: clear cache HOẶC code xóa          │
  └─────────────────────────────────────────────────────┘

  PERSISTENCE:
  ┌──────────────┬──────────────────────────────────────┐
  │ sessionStorage│ Mất khi đóng tab/browser            │
  │ localStorage │ Tồn tại vĩnh viễn (cho đến khi xóa)│
  │ Cookie       │ Có thể set expiry                    │
  │ IndexedDB    │ Tồn tại vĩnh viễn (cho đến khi xóa)│
  └──────────────┴──────────────────────────────────────┘

  → Data nằm trên DISK, không phải RAM
  → Đọc/ghi = DISK I/O operation!
  → Câu hỏi: Disk I/O thường là ASYNC... vậy tại sao
    localStorage lại SYNC?
```

---

## 2. Disk là I/O — Tại sao lại sync?

```
DISK I/O vs localStorage:
═══════════════════════════════════════════════════════════════

  ① OS LEVEL — Disk I/O là ASYNC:
  ┌─────────────────────────────────────────────────────┐
  │ Hầu hết OS-level I/O operations đều async          │
  │ → Tránh block process                              │
  │ → OS dùng interrupt, DMA, callback khi I/O xong    │
  └─────────────────────────────────────────────────────┘

  ② BROWSER LEVEL — localStorage là SYNC:
  ┌─────────────────────────────────────────────────────┐
  │ Browser CƯỠNG ÉP đồng bộ bằng cách:               │
  │ → Gửi synchronous I/O request                      │
  │ → BLOCK JavaScript thread                           │
  │ → ĐỢI cho đến khi disk operation HOÀN TẤT         │
  │ → Mới cho JS thread tiếp tục chạy                  │
  └─────────────────────────────────────────────────────┘

  Tại sao browser làm vậy?
  → DESIGN CHOICE, không phải technical limitation
  → Browser chọn đơn giản hóa API cho developer
  → Trade-off: simplicity > performance
```

```
VISUALIZATION — BLOCKING:

  SYNC (localStorage):
  JS Thread:  ████████░░░░░░░░░████████████████
              ^code    ^BLOCK!  ^tiếp tục sau khi
              chạy     đợi I/O  I/O hoàn tất

  ASYNC (IndexedDB):
  JS Thread:  ████████████████████████████████████
              ^code    ^gửi request  ^callback xử lý
              chạy     không block!   kết quả
  I/O:                 ░░░░░░░░░░░░→ done!
```

---

## 3. Quy trình hoạt động

```
COMPLETE OPERATION FLOW:
═══════════════════════════════════════════════════════════════

  localStorage.getItem('key')  hoặc  localStorage.setItem('key', 'value')

  ① JS Thread gọi localStorage API
     ↓
  ② Browser engine NHẬN request
     → Gửi synchronous I/O request đến storage subsystem
     → JS engine bắt đầu ĐỢI (BLOCKED!)
     ↓
  ③ Storage subsystem thực hiện disk I/O
     → File system operation (read/write)
     → OS có thể cache/optimize, nhưng browser
       vẫn XỬ LÝ NHƯ synchronous operation
     ↓
  ④ I/O hoàn tất
     → Data đã write lên disk HOẶC read từ disk
     → Storage subsystem trả result cho JS engine
     ↓
  ⑤ JS Thread TIẾP TỤC chạy
     → Dòng code TIẾP THEO mới được execute
     → getItem() return giá trị
     → setItem() return undefined
```

### Test chứng minh

```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <title>localStorage Sync Test</title>
  </head>
  <body>
    <script>
      const testLocalStorage = () => {
        console.log("1 → Trước setItem");

        localStorage.setItem("test", "Tôi là ĐỒNG BỘ");

        console.log("2 → Sau setItem, trước getItem");

        const value = localStorage.getItem("test");
        console.log("3 → getItem:", value);

        console.log("4 → Sau getItem");
      };

      testLocalStorage();

      // OUTPUT (luôn ĐÚNG THỨ TỰ):
      // 1 → Trước setItem
      // 2 → Sau setItem, trước getItem
      // 3 → getItem: Tôi là ĐỒNG BỘ
      // 4 → Sau getItem

      // → CHỨNG MINH: localStorage chạy đồng bộ,
      //   không có callback, không có Promise,
      //   code chạy line-by-line tuần tự!
    </script>
  </body>
</html>
```

---

## 4. Lý do thiết kế sync

```
TẠI SAO localStorage SYNC?
═══════════════════════════════════════════════════════════════

  ① LỊCH SỬ
     → localStorage ra đời trong Web standards sớm
     → Web apps thời đó ĐƠN GIẢN
     → Nhu cầu async chưa mạnh mẽ

  ② API ĐƠN GIẢN
     → Sync API dễ hiểu, dễ dùng hơn NHIỀU:
```

```javascript
// ✅ SYNC — đơn giản, trực quan:
const name = localStorage.getItem("name");
console.log(name); // Dùng ngay!

// ❌ Nếu ASYNC — phải handle callback/Promise:
const name = await localStorage.getItem("name"); // Giả sử
// hoặc:
localStorage.getItem("name", (err, value) => {
  console.log(value); // Callback hell?
});
```

```
  ③ DATA NHỎ
     → localStorage thiết kế cho ~5MB
     → Data nhỏ → sync operation NHANH
     → Ảnh hưởng performance: không đáng kể

  ④ COMPATIBILITY
     → Giữ sync giúp tương thích code cũ, browser cũ
     → Thay đổi sang async = BREAKING CHANGE!

  ⑤ BROWSER POLICY
     → Browser vendors muốn consistent UX
     → Quản lý user data dễ hơn với sync model

  SO SÁNH DESIGN DECISION:
  ┌────────────────┬──────────────────┬──────────────────┐
  │                │ localStorage     │ IndexedDB        │
  ├────────────────┼──────────────────┼──────────────────┤
  │ API style      │ Synchronous      │ Asynchronous     │
  │ Capacity       │ ~5MB             │ Hàng trăm MB+    │
  │ Data format    │ String only      │ Any (objects,    │
  │                │                  │ blobs, files)    │
  │ Query          │ Key only         │ Index, cursor,   │
  │                │                  │ range queries    │
  │ Block thread   │ ✅ YES           │ ❌ NO            │
  │ Use case       │ Small config,    │ Large data,      │
  │                │ tokens, flags    │ offline apps     │
  │ Ease of use    │ ⭐ Rất dễ        │ ⭐⭐⭐ Phức tạp    │
  └────────────────┴──────────────────┴──────────────────┘
```

---

## 5. IndexedDB — Async Alternative

### IndexedDB vs localStorage

```
IndexedDB — KHI NÀO DÙNG?
═══════════════════════════════════════════════════════════════

  DÙNG localStorage KHI:
  ✅ Data nhỏ (< 5MB)
  ✅ Key-value đơn giản (string only)
  ✅ Config, tokens, user preferences, flags
  ✅ Không cần query phức tạp

  DÙNG IndexedDB KHI:
  ✅ Data lớn (hàng trăm MB)
  ✅ Cần lưu objects, blobs, files
  ✅ Cần index, range query, cursor
  ✅ Offline-first apps (PWA)
  ✅ Tránh block main thread
```

### IndexedDB chống lạm dụng

```
IndexedDB — SAFEGUARDS:
═══════════════════════════════════════════════════════════════

  ① ASYNC — không block main thread
     → Dù data lớn, page vẫn responsive

  ② USER PROMPTS & PERMISSIONS
     → Browser có thể hỏi user khi site lưu nhiều data
     → User có quyền từ chối

  ③ STORAGE QUOTAS
     → Không vô hạn! Browser set quota
     → Vượt quota → request bị reject

  ④ ORGANIZED STORAGE
     → Database format rõ ràng
     → Dễ quản lý, xem, dọn dẹp

  ⑤ GRADUAL INCREASE
     → Một số browser hỏi user khi DB đạt threshold
     → Không allocate hết space từ đầu
```

### Code comparison

```javascript
// ═══ localStorage (SYNC) ═══
// Đơn giản, 1 dòng:
localStorage.setItem("user", JSON.stringify({ name: "Jun" }));
const user = JSON.parse(localStorage.getItem("user"));

// ═══ IndexedDB (ASYNC) ═══
// Phức tạp hơn nhiều:
const request = indexedDB.open("myDB", 1);

request.onupgradeneeded = (e) => {
  const db = e.target.result;
  db.createObjectStore("users", { keyPath: "id" });
};

request.onsuccess = (e) => {
  const db = e.target.result;

  // WRITE
  const tx = db.transaction("users", "readwrite");
  tx.objectStore("users").add({ id: 1, name: "Jun" });

  // READ
  const readTx = db.transaction("users", "readonly");
  const getReq = readTx.objectStore("users").get(1);
  getReq.onsuccess = () => {
    console.log(getReq.result); // { id: 1, name: 'Jun' }
  };
};

// → IndexedDB mạnh hơn nhưng VERBOSE hơn nhiều!
// → Thường dùng wrapper: idb, Dexie.js, localForage
```

---

## 6. Tóm Tắt

### Quick Reference

```
localStorage SYNC/ASYNC — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  ANSWER:
    localStorage là SYNCHRONOUS.
    Block JS thread cho đến khi disk I/O hoàn tất.

  WHY SYNC?
    ① Historical: early web standards, simple needs
    ② API simplicity: no callbacks, no Promises
    ③ Small data: ~5MB → sync impact negligible
    ④ Compatibility: changing to async = breaking change

  HOW IT WORKS:
    JS call → browser engine → sync I/O request
    → BLOCK thread → disk read/write → return result
    → JS thread continues

  COMPARISON:
    localStorage  → sync, ~5MB, string only, simple
    IndexedDB     → async, 100s MB, objects/blobs, complex
    sessionStorage→ sync, ~5MB, tab-scoped
    Cookie        → sync, ~4KB, sent with HTTP requests

  WHEN TO USE WHAT:
    Small config/tokens → localStorage ✅
    Large data/offline  → IndexedDB ✅
    Avoid blocking      → IndexedDB ✅
```

### Câu Hỏi Phỏng Vấn

**1. localStorage là đồng bộ hay bất đồng bộ? Tại sao?**

> localStorage là **đồng bộ (synchronous)**. Dù disk I/O ở OS level bản chất là async, browser **cưỡng ép sync** bằng cách block JavaScript thread cho đến khi read/write hoàn tất. Đây là **design choice** — đơn giản hóa API, phù hợp data nhỏ (~5MB). Code chạy tuần tự line-by-line, không cần callback hay Promise.

**2. Nếu localStorage sync, sao không gây lag?**

> localStorage thiết kế cho **data nhỏ (~5MB)**, và browser có thể **cache** data trong memory. Với data nhỏ, disk I/O hoàn tất rất nhanh → blocking duration negligible. Nhưng nếu bạn lưu **data lớn gần limit** hoặc thao tác **rất thường xuyên**, có thể gây **micro-jank** trên main thread. Đây là lý do tồn tại **IndexedDB** (async alternative).

**3. localStorage vs IndexedDB: khi nào dùng gì?**

> **localStorage**: data nhỏ (<5MB), key-value string đơn giản, config, tokens, user preferences. API cực đơn giản (1 dòng). **IndexedDB**: data lớn (hàng trăm MB), cần lưu objects/blobs/files, cần query phức tạp (index, range, cursor), offline-first PWA, tránh block main thread. API phức tạp → thường dùng wrapper (Dexie.js, localForage).

**4. Data localStorage lưu ở đâu? Mất khi nào?**

> Data lưu **trên ổ cứng** (persistent storage), KHÔNG phải RAM. **Không mất** khi đóng tab, đóng browser, tắt máy. Chỉ mất khi: user **clear browser cache**, code gọi `localStorage.removeItem()` hoặc `localStorage.clear()`, hoặc browser tự dọn khi hết dung lượng (hiếm).

**5. Tại sao không đổi localStorage sang async?**

> **Breaking change** cực kỳ lớn — hàng triệu website đang dùng localStorage sync. Đổi sang async sẽ vỡ toàn bộ code có sẵn. Thay vào đó, spec **tạo API mới** (IndexedDB) cho use case cần async. Đây là pattern thường thấy trong web standards: không break API cũ, tạo API mới tốt hơn.

---

## Checklist Học Tập

- [ ] localStorage là SYNCHRONOUS — block JS thread
- [ ] Data lưu trên disk (persistent), không phải memory
- [ ] Browser cưỡng ép sync dù OS-level I/O là async
- [ ] Flow: JS call → browser → sync I/O → block → return → continue
- [ ] Lý do sync: history, API simplicity, small data, compatibility
- [ ] localStorage: ~5MB, string only, key-value
- [ ] IndexedDB: async, 100s MB, objects/blobs, index queries
- [ ] sessionStorage: sync, ~5MB, mất khi đóng tab
- [ ] Cookie: sync, ~4KB, gửi kèm HTTP request
- [ ] Wrapper libraries: Dexie.js, localForage, idb

---

_Cập nhật lần cuối: Tháng 2, 2026_
