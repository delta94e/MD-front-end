# Promise Concurrency Control — all, race, any, allSettled

> 📅 2026-02-04 · ⏱ 10 phút đọc
>
> So sánh chi tiết 4 static methods kiểm soát concurrency của Promise.
> Mỗi method có ❌ / ✅ use case, code example, và edge cases.
> Độ khó: ⭐️⭐️⭐️ | Chuyên mục: JavaScript Basics

---

## Mục Lục

1. [Tổng Quan — Tại Sao Cần Concurrency Control?](#1-tổng-quan--tại-sao-cần-concurrency-control)
2. [Promise.all() — "Tất Cả Phải Pass"](#2-promiseall--tất-cả-phải-pass)
3. [Promise.race() — "Ai Nhanh Nhất Thắng"](#3-promiserace--ai-nhanh-nhất-thắng)
4. [Promise.any() — "Chỉ Cần 1 Thành Công"](#4-promiseany--chỉ-cần-1-thành-công)
5. [Promise.allSettled() — "Thu Thập Tất Cả Kết Quả"](#5-promiseallsettled--thu-thập-tất-cả-kết-quả)
6. [Bảng So Sánh Core Differences](#6-bảng-so-sánh-core-differences)
7. [Kết Hợp Với async/await — Advanced Patterns](#7-kết-hợp-với-asyncawait--advanced-patterns)
8. [Edge Cases & Gotchas](#8-edge-cases--gotchas)
9. [Câu Hỏi Phỏng Vấn](#9-câu-hỏi-phỏng-vấn)

---

## 1. Tổng Quan — Tại Sao Cần Concurrency Control?

```
TÌNH HUỐNG THỰC TẾ:
═══════════════════════════════════════════════════════════════

  Khi xử lý async tasks, ta thường cần:
  → Gọi NHIỀU requests cùng lúc
  → Kiểm soát KHI NÀO xử lý kết quả
  → Quyết định CÁCH XỬ LÝ lỗi

  Promise cung cấp 4 static methods:

  ┌────────────────┬──────────────────────────────────────────┐
  │ Method         │ Triết lý                                 │
  ├────────────────┼──────────────────────────────────────────┤
  │ .all()         │ "Tất cả phải pass"                       │
  │ .race()        │ "Ai nhanh nhất thắng" (kể cả lỗi)      │
  │ .any()         │ "Chỉ cần 1 thành công"                  │
  │ .allSettled()  │ "Thu thập hết, bất kể thành/bại"        │
  └────────────────┴──────────────────────────────────────────┘

  VÍ DỤ TRỰC QUAN:

  Bạn gửi 3 shipper giao 3 món hàng:

  .all()        → ĐỢI cả 3 về mới bắt đầu ăn. 1 giao hỏng = HỦY hết!
  .race()       → Ai tới trước thì ăn LẬP TỨC, bỏ 2 cái sau.
  .any()        → Ai tới đúng món trước → ăn. Ai giao hỏng → bỏ qua.
                   Chỉ fail nếu CẢ 3 đều giao hỏng.
  .allSettled() → ĐỢI cả 3 về. Ghi nhận: món OK, món hỏng, rồi quyết.

═══════════════════════════════════════════════════════════════
```

---

## 2. Promise.all() — "Tất Cả Phải Pass"

```
CONCEPT:
═══════════════════════════════════════════════════════════════

  Gói NHIỀU Promise thành MỘT.

  ┌──────────────────────────────────────────────────────────┐
  │ Fulfilled: TẤT CẢ instances thành công                  │
  │ Rejected:  BẤT KỲ 1 cái fail → FAIL NGAY!              │
  │ Return:    Array kết quả [r1, r2, r3] (GIỮ THỨ TỰ)    │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Ví dụ cơ bản

```javascript
const p1 = Promise.resolve(1);
const p2 = Promise.resolve(2);
const p3 = Promise.resolve(3);

Promise.all([p1, p2, p3])
  .then((results) => {
    console.log(results); // [1, 2, 3] ← giữ đúng thứ tự truyền vào!
  })
  .catch((err) => {
    console.error("Một cái fail rồi:", err);
  });
```

### Khi có lỗi — fail-fast

```
FLOW KHI 1 PROMISE REJECT:
═══════════════════════════════════════════════════════════════

  p1: ──────✅ resolve(1) (100ms)
  p2: ───❌ reject('lỗi!') (80ms)     ← NHANH NHẤT fail
  p3: ────────────✅ resolve(3) (200ms)

  Promise.all([p1, p2, p3])
    ↓
  .catch(err => err)  // "lỗi!" ← p2 fail → BỎ QUA p1, p3!

  ⚠️ p1 và p3 VẪN CHẠY (không cancel được!)
     nhưng kết quả của chúng bị IGNORED.

═══════════════════════════════════════════════════════════════
```

```javascript
const p1 = Promise.resolve(1);
const p2 = Promise.reject("lỗi mạng!");
const p3 = Promise.resolve(3);

Promise.all([p1, p2, p3])
  .then((results) => console.log(results)) // KHÔNG chạy!
  .catch((err) => console.error("Failed:", err)); // "Failed: lỗi mạng!"
```

### Use Case thực tế: Load page data

```javascript
// Dashboard cần 3 API calls TRƯỚC khi render
async function loadDashboard() {
  try {
    const [user, orders, stats] = await Promise.all([
      fetchUser(), // 200ms
      fetchOrders(), // 300ms
      fetchDashStats(), // 150ms
    ]);
    // Tổng: max(200, 300, 150) = 300ms (KHÔNG phải 650ms!)
    renderDashboard(user, orders, stats);
  } catch (err) {
    showErrorPage(err); // 1 cái fail → error page
  }
}
```

---

## 3. Promise.race() — "Ai Nhanh Nhất Thắng"

```
CONCEPT:
═══════════════════════════════════════════════════════════════

  Ai thay đổi state ĐẦU TIÊN → quyết định kết quả.

  ┌──────────────────────────────────────────────────────────┐
  │ Fulfilled: Promise ĐẦU TIÊN resolve                     │
  │ Rejected:  Promise ĐẦU TIÊN reject                      │
  │ Return:    Giá trị của promise NHANH NHẤT               │
  │                                                          │
  │ ⚠️ "Race" = kể cả rejection cũng thắng nếu nó nhanh!  │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Ví dụ cơ bản

```javascript
const p1 = new Promise((resolve) => setTimeout(() => resolve("1 giây"), 1000));
const p2 = new Promise((resolve) => setTimeout(() => resolve("500ms"), 500));

Promise.race([p1, p2]).then((res) => console.log(res)); // "500ms" ← p2 nhanh hơn!
```

### Use Case kinh điển: Request Timeout

```
REQUEST TIMEOUT PATTERN:
═══════════════════════════════════════════════════════════════

  fetchData():  ──────────────────✅ (2000ms)
  timeout:      ───────❌ (1000ms)     ← NHANH HƠN → race wins!

  → Nếu fetch lâu hơn timeout → REJECT!
  → Nếu fetch nhanh hơn timeout → RESOLVE!

═══════════════════════════════════════════════════════════════
```

```javascript
function fetchWithTimeout(url, ms) {
  const fetchPromise = fetch(url);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout sau ${ms}ms`)), ms),
  );
  return Promise.race([fetchPromise, timeoutPromise]);
}

// Dùng:
fetchWithTimeout("/api/data", 3000)
  .then((res) => res.json())
  .catch((err) => console.error(err.message));
// Nếu API > 3s → "Timeout sau 3000ms"
```

### ⚠️ Gotcha: Rejection cũng win race!

```javascript
const fast = new Promise((_, reject) =>
  setTimeout(() => reject("FAIL nhanh!"), 100),
);
const slow = new Promise((resolve) =>
  setTimeout(() => resolve("OK chậm"), 500),
);

Promise.race([fast, slow])
  .then((res) => console.log(res)) // KHÔNG chạy!
  .catch((err) => console.error(err)); // "FAIL nhanh!" ← reject THẮNG race!
```

---

## 4. Promise.any() — "Chỉ Cần 1 Thành Công"

```
CONCEPT:
═══════════════════════════════════════════════════════════════

  Chỉ quan tâm THÀNH CÔNG đầu tiên. Bỏ qua tất cả lỗi.

  ┌──────────────────────────────────────────────────────────┐
  │ Fulfilled: BẤT KỲ 1 cái resolve → thành công NGAY!     │
  │ Rejected:  CHỈ khi TẤT CẢ đều fail                     │
  │            → trả AggregateError (chứa tất cả errors)    │
  │ Return:    Giá trị của promise THÀNH CÔNG đầu tiên      │
  │                                                          │
  │ So với .race(): .any() BỎ QUA rejections!               │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Ví dụ cơ bản

```javascript
const p1 = Promise.resolve(1); // ✅ resolve
const p2 = Promise.reject("lỗi 2"); // ❌ reject (bị BỎ QUA!)
const p3 = Promise.reject("lỗi 3"); // ❌ reject (bị BỎ QUA!)

Promise.any([p1, p2, p3])
  .then((res) => console.log(`Thành công: ${res}`)) // "Thành công: 1"
  .catch((err) => console.log(`Tất cả fail: ${err}`));
```

### Khi TẤT CẢ đều fail → AggregateError

```javascript
const p1 = Promise.reject("lỗi 1");
const p2 = Promise.reject("lỗi 2");
const p3 = Promise.reject("lỗi 3");

Promise.any([p1, p2, p3])
  .then((res) => console.log(res))
  .catch((err) => {
    console.log(err instanceof AggregateError); // true
    console.log(err.errors); // ['lỗi 1', 'lỗi 2', 'lỗi 3']
    console.log(err.message); // "All promises were rejected"
  });
```

### Use Case: Backup Server / CDN Fallback

```
MULTI-CDN PATTERN:
═══════════════════════════════════════════════════════════════

  CDN-1 (US):    ──────────────✅ (300ms)
  CDN-2 (EU):    ───❌ (50ms, down)        ← reject, BỎ QUA
  CDN-3 (Asia):  ─────✅ (150ms)           ← THẮNG! nhanh nhất resolve

  Promise.any([cdn1, cdn2, cdn3])
  → cdn3 (150ms) ← thành công đầu tiên!
  → cdn2 fail → bỏ qua
  → cdn1 thành công nhưng CHẬM hơn → bỏ qua

═══════════════════════════════════════════════════════════════
```

```javascript
async function fetchFromBestCDN(path) {
  try {
    const result = await Promise.any([
      fetch(`https://cdn-us.example.com${path}`),
      fetch(`https://cdn-eu.example.com${path}`),
      fetch(`https://cdn-asia.example.com${path}`),
    ]);
    return result.json();
  } catch (err) {
    // AggregateError → TẤT CẢ CDN đều down!
    console.error("Tất cả CDN đều fail:", err.errors);
    throw err;
  }
}
```

---

## 5. Promise.allSettled() — "Thu Thập Tất Cả Kết Quả"

```
CONCEPT:
═══════════════════════════════════════════════════════════════

  Đợi TẤT CẢ hoàn thành, KHÔNG QUAN TÂM thành/bại.

  ┌──────────────────────────────────────────────────────────┐
  │ State: LUÔN fulfilled (KHÔNG BAO GIỜ reject!)           │
  │ Return: Array of objects:                                │
  │   { status: 'fulfilled', value: ... }                    │
  │   { status: 'rejected',  reason: ... }                   │
  │                                                          │
  │ ⚠️ CHẮC CHẮN sẽ chờ TẤT CẢ, kể cả mấy cái rất chậm  │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### Ví dụ cơ bản

```javascript
const p1 = Promise.resolve("OK");
const p2 = Promise.reject("lỗi!");
const p3 = Promise.resolve(42);

Promise.allSettled([p1, p2, p3]).then((results) => {
  console.log(results);
  // [
  //   { status: 'fulfilled', value: 'OK' },
  //   { status: 'rejected',  reason: 'lỗi!' },
  //   { status: 'fulfilled', value: 42 }
  // ]
});
// ⚠️ KHÔNG CẦN .catch() vì allSettled KHÔNG BAO GIỜ reject!
```

### Use Case: Batch Operations + Report

```javascript
async function batchUpdateUsers(users) {
  const results = await Promise.allSettled(
    users.map((user) => updateUser(user)),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled");
  const failed = results.filter((r) => r.status === "rejected");

  console.log(`✅ Thành công: ${succeeded.length}`);
  console.log(`❌ Thất bại:   ${failed.length}`);

  // Log chi tiết lỗi
  failed.forEach((r, i) => {
    console.error(`User ${i} fail:`, r.reason);
  });

  return { succeeded: succeeded.length, failed: failed.length };
}
```

---

## 6. Bảng So Sánh Core Differences

```
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────┬──────────────┬──────────────────────────┐
  │ Method          │ Fulfilled    │ Rejected     │ Return value             │
  │                 │ condition    │ condition    │                          │
  ├─────────────────┼──────────────┼──────────────┼──────────────────────────┤
  │ .all()          │ TẤT CẢ OK   │ BẤT KỲ 1    │ Array kết quả            │
  │                 │              │ fail         │ (giữ thứ tự)            │
  ├─────────────────┼──────────────┼──────────────┼──────────────────────────┤
  │ .race()         │ Cái ĐẦU     │ Cái ĐẦU     │ Giá trị cái             │
  │                 │ TIÊN resolve │ TIÊN reject  │ NHANH nhất              │
  ├─────────────────┼──────────────┼──────────────┼──────────────────────────┤
  │ .any()          │ BẤT KỲ 1    │ TẤT CẢ      │ Giá trị cái             │
  │                 │ resolve      │ fail         │ THÀNH CÔNG đầu tiên     │
  ├─────────────────┼──────────────┼──────────────┼──────────────────────────┤
  │ .allSettled()   │ TẤT CẢ      │ KHÔNG BAO    │ Array objects            │
  │                 │ hoàn thành   │ GIỜ reject   │ {status, value/reason}  │
  └─────────────────┴──────────────┴──────────────┴──────────────────────────┘

  SO SÁNH TRỰC QUAN (Promise.all vs Promise.race):

  .all()  = Chờ người CHẬM NHẤT. Kết quả sau khi TẤT CẢ về.
            1 fail → HỦY.

  .race() = Chỉ quan tâm người NHANH NHẤT.
            Kể cả fail nhanh nhất cũng "thắng".

═══════════════════════════════════════════════════════════════
```

---

## 7. Kết Hợp Với async/await — Advanced Patterns

### 7.1 TypeScript Typed Results

```typescript
// Khai báo kiểu rõ ràng cho kết quả Promise.all
const fetchData = async () => {
  try {
    const [user, orders] = await Promise.all<[UserType, OrderType[]]>([
      getUserInfo(),
      getOrderList(),
    ]);
    console.log(user.name, orders.length);
  } catch (error) {
    // Xử lý error ĐẦU TIÊN bắt được
  }
};
```

### 7.2 Promise.all + map — Concurrent Batch Processing

```javascript
// Gửi 100 emails cùng lúc (cẩn thận rate limit!)
async function sendAllEmails(emails) {
  const results = await Promise.all(emails.map((email) => sendEmail(email)));
  return results; // [res1, res2, ..., res100]
}
```

### 7.3 Controlled Concurrency (Chunked)

```
VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  Promise.all(100requests) → 100 requests CÙNG LÚC!
  → Server overload, rate limit, network congestion

  GIẢI PHÁP: Chia thành chunks, chạy từng batch 5-10 cái:

═══════════════════════════════════════════════════════════════
```

```javascript
async function batchProcess(items, batchSize, processor) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item) => processor(item)),
    );
    results.push(...batchResults);
  }

  return results;
}

// Dùng: chạy 5 request mỗi lần
await batchProcess(urls, 5, (url) => fetch(url));
// Batch 1: [url0..url4] song song → chờ hết
// Batch 2: [url5..url9] song song → chờ hết
// ...
```

### 7.4 race + allSettled — Timeout với cleanup

```javascript
async function fetchWithTimeoutAndCleanup(urls, timeoutMs) {
  const controller = new AbortController();

  const fetchPromise = Promise.any(
    urls.map((url) => fetch(url, { signal: controller.signal })),
  );

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => {
      controller.abort(); // Cancel TẤT CẢ pending fetches!
      reject(new Error("Timeout!"));
    }, timeoutMs),
  );

  return Promise.race([fetchPromise, timeoutPromise]);
}
```

---

## 8. Edge Cases & Gotchas

```
CẠM BẪY CẦN NHỚ:
═══════════════════════════════════════════════════════════════

  ① EMPTY ARRAY:

  Promise.all([])          → resolve([])       ← NGAY LẬP TỨC!
  Promise.race([])         → PENDING MÃI MÃI!  ← ⚠️ NEVER settles!
  Promise.any([])          → reject(AggregateError) ← NGAY!
  Promise.allSettled([])   → resolve([])       ← NGAY LẬP TỨC!

  ② NON-PROMISE VALUES:

  Promise.all([1, 2, 3])   → resolve([1, 2, 3])
  // Non-promise values tự động wrap bằng Promise.resolve()!

  ③ PROMISE.ALL KHÔNG CANCEL:

  Promise.all([p1, p2, p3])
  // p2 reject → .all() reject NGAY
  // NHƯNG p1 và p3 VẪN ĐANG CHẠY! (chỉ bị ignore kết quả)
  // → Dùng AbortController nếu cần cancel thật sự!

  ④ .any() LÀ ES2021:

  // Không có trong Node < 15, Chrome < 85
  // Polyfill nếu cần hỗ trợ browser cũ

  ⑤ .allSettled() LUÔN FULFILLED:

  Promise.allSettled([reject('x')])
    .then(...)   // ← LUÔN VÀO ĐÂY!
    .catch(...)  // ← KHÔNG BAO GIỜ vào đây!

  ⑥ ORDER GIỮ NGUYÊN (all + allSettled):

  Promise.all([slowAPI, fastAPI])
  // results[0] = kết quả slowAPI (DÙ nó chậm hơn)
  // results[1] = kết quả fastAPI
  // → Thứ tự TRUYỀN VÀO, KHÔNG phải thứ tự hoàn thành!

═══════════════════════════════════════════════════════════════
```

---

## 9. Câu Hỏi Phỏng Vấn

### Q1: So sánh Promise.all và Promise.race?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Promise.all = chờ người CHẬM NHẤT:                         │
│  → Tất cả phải xong mới có kết quả                          │
│  → 1 fail → toàn bộ fail ngay (fail-fast)                   │
│  → Return: array kết quả GIỮ THỨ TỰ                        │
│  → Use case: Load page cần nhiều API                        │
│                                                              │
│  Promise.race = chỉ quan tâm người NHANH NHẤT:             │
│  → Ai thay đổi state đầu tiên → kết quả                    │
│  → Kể cả reject cũng "thắng" nếu nó nhanh nhất            │
│  → Return: giá trị DUY NHẤT của promise nhanh nhất          │
│  → Use case: Request timeout                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q2: Sự khác biệt giữa Promise.race và Promise.any?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  .race() → ai NHANH NHẤT, kể cả REJECT:                    │
│                                                              │
│  race([reject(50ms), resolve(100ms)]) → REJECT!             │
│  // reject nhanh hơn → race cho reject                      │
│                                                              │
│  .any() → ai THÀNH CÔNG NHANH NHẤT, BỎ QUA reject:         │
│                                                              │
│  any([reject(50ms), resolve(100ms)]) → RESOLVE!             │
│  // reject bị bỏ qua → chờ resolve đầu tiên               │
│                                                              │
│  .any() chỉ reject khi TẤT CẢ đều fail → AggregateError   │
│                                                              │
│  Cách nhớ:                                                   │
│  race = "cuộc đua tốc độ" (fail cũng tính)                 │
│  any  = "cuộc đua thành công" (chỉ tính resolve)           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q3: Promise.all() chạy mảng rỗng thì sao?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Promise.all([])        → resolve([]) NGAY LẬP TỨC         │
│  Promise.race([])       → ⚠️ PENDING MÃI MÃI!              │
│  Promise.any([])        → reject(AggregateError) NGAY       │
│  Promise.allSettled([]) → resolve([]) NGAY LẬP TỨC         │
│                                                              │
│  ĐẶC BIỆT NGUY HIỂM: Promise.race([])                      │
│  → Không bao giờ settle → potential memory leak!            │
│  → Nếu dùng await → treo vĩnh viễn!                        │
│  → Luôn check array.length trước khi gọi race              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q4: Promise.all fail thì các promise khác có bị cancel không?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  KHÔNG! Đây là misconception phổ biến.                       │
│                                                              │
│  Promise.all([p1, p2, p3])                                   │
│  → p2 reject → .all() reject NGAY                           │
│  → p1 và p3 VẪN ĐANG CHẠY                                   │
│  → Chỉ là kết quả của chúng bị IGNORED                      │
│                                                              │
│  Lý do: Promise spec KHÔNG có cancel mechanism               │
│                                                              │
│  Muốn cancel thật sự → dùng AbortController:                │
│                                                              │
│  const controller = new AbortController()                    │
│                                                              │
│  Promise.all([                                               │
│    fetch(url1, { signal: controller.signal }),                │
│    fetch(url2, { signal: controller.signal }),                │
│  ]).catch(() => controller.abort())                           │
│  // Khi 1 cái fail → abort TẤT CẢ pending fetches!         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q5: AggregateError là gì? Khi nào gặp?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  AggregateError = Error chứa NHIỀU errors bên trong.        │
│  → Thuộc tính: .errors = array of all errors                │
│  → Thuộc tính: .message = "All promises were rejected"      │
│                                                              │
│  Chỉ xuất hiện khi Promise.any() fail (tất cả reject):      │
│                                                              │
│  Promise.any([reject('a'), reject('b')])                     │
│    .catch(err => {                                           │
│      err instanceof AggregateError  // true                  │
│      err.errors                     // ['a', 'b']            │
│    })                                                        │
│                                                              │
│  Cách xử lý:                                                │
│  → Log err.errors để debug từng lỗi                         │
│  → Có thể retry từng promise riêng lẻ                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q6: Khi nào dùng allSettled thay vì all?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  .all()        → Khi TẤT CẢ phải thành công mới có ý nghĩa│
│  .allSettled() → Khi muốn biết KẾT QUẢ TỪNG cái            │
│                                                              │
│  Ví dụ dùng .all():                                          │
│  → Load dashboard (cần cả user + orders + stats)            │
│  → Transaction (cả 3 bước phải OK)                          │
│                                                              │
│  Ví dụ dùng .allSettled():                                   │
│  → Batch update 100 users (báo cáo: 95 OK, 5 fail)         │
│  → Send notifications (gửi hết, log failed ones)            │
│  → Health check nhiều services (report tổng hợp)            │
│                                                              │
│  Quy tắc:                                                    │
│  → Nếu partial failure CHẤP NHẬN ĐƯỢC → allSettled          │
│  → Nếu 1 fail = TOÀN BỘ vô nghĩa → all                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q7: Implement Promise.all() thủ công?

```javascript
// TRẢ LỜI:

function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    // Edge case: mảng rỗng
    if (promises.length === 0) return resolve([]);

    const results = new Array(promises.length);
    let count = 0;

    promises.forEach((promise, index) => {
      // Wrap non-promise values
      Promise.resolve(promise)
        .then((value) => {
          results[index] = value; // GIỮ THỨ TỰ!
          count++;
          if (count === promises.length) {
            resolve(results); // TẤT CẢ xong → resolve
          }
        })
        .catch(reject); // 1 fail → reject NGAY!
    });
  });
}

// ĐIỂM QUAN TRỌNG:
// ① results[index] giữ thứ tự (không phải .push)
// ② count++ + check count === length (không phải results.length)
// ③ Promise.resolve(promise) để handle non-promise values
// ④ .catch(reject) chỉ gọi 1 lần (Promise chỉ settle 1 lần)
```

### Q8: Làm sao giới hạn concurrency?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Promise.all() KHÔNG giới hạn concurrency!                   │
│  100 items → 100 requests CÙNG LÚC!                         │
│                                                              │
│  Giải pháp 1: Chunk-based (đơn giản)                        │
│  → Chia mảng thành batches 5-10 items                        │
│  → Promise.all() từng batch → chờ xong → batch tiếp         │
│                                                              │
│  Giải pháp 2: Pool-based (advanced)                          │
│  → Duy trì pool N workers                                    │
│  → Xong 1 → lấy task tiếp → luôn có N đang chạy            │
│  → Library: p-limit, p-queue                                 │
│                                                              │
│  Giải pháp 3: Semaphore pattern                              │
│  → let running = 0                                           │
│  → if (running < limit) start()                              │
│  → on complete: running--, start next                        │
│                                                              │
│  Thực tế: dùng p-limit là phổ biến nhất:                    │
│  import pLimit from 'p-limit'                                │
│  const limit = pLimit(5) // Max 5 concurrent                 │
│  await Promise.all(urls.map(url => limit(() => fetch(url)))) │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
