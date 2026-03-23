# The Last Algorithms Course You'll Need — Phần 8: Implementing Binary Search — "First Try! 7 Lines! Google Docs Terror!"

> 📅 2026-03-08 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implementing Binary Search — "Pseudocode → TypeScript, Math.floor, don't forget /2, Google interview story!"
> Độ khó: ⭐️⭐️⭐️ | Implementation — direct translation from pseudocode!

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | Translation — "Pseudocode → TypeScript!"            |
| 2   | "Don't Forget to Divide by 2!" — Prime's Bug!       |
| 3   | First Try! — "npx jest binary → GREEN!"             |
| 4   | Google Interview Story — "+1 -1 Issues Everywhere!" |
| 5   | Tự Implement: Complete Binary Search                |

---

## §1. Translation — "Pseudocode → TypeScript!"

> Prime: _"Now that we've written it on a whiteboard, we can implement it. Let's translate from pseudocode."_

### Dịch trực tiếp!

```typescript
function binary_search(haystack: number[], needle: number): boolean {
  let lo = 0;
  let hi = haystack.length;

  do {
    const m = Math.floor(lo + (hi - lo) / 2);
    const value = haystack[m];

    if (value === needle) {
      return true;
    } else if (value > needle) {
      hi = m;
    } else {
      lo = m + 1;
    }
  } while (lo < hi);

  return false;
}
```

Prime: _"It's really only 7 lines of actual code. It's a pretty SIMPLE piece of code — it's just being able to focus and do this correctly."_

### Giải thích sâu: từ pseudocode sang code thật

Quá trình dịch từ pseudocode sang TypeScript rất **1:1** — gần như mỗi dòng pseudocode tương ứng một dòng code thật. Đây chính là sức mạnh của việc **viết pseudocode trước**: khi bạn đã suy nghĩ xong logic, việc code chỉ là "dịch" sang cú pháp ngôn ngữ.

Hãy so sánh:

```
PSEUDOCODE → TYPESCRIPT — SO SÁNH TỪNG DÒNG:
═══════════════════════════════════════════════════════════════

  Pseudocode:                      TypeScript:
  ─────────────────────────────    ──────────────────────────
  lo = 0                          let lo = 0;
  hi = array.length               let hi = haystack.length;
  do:                              do {
    mid = lo + floor(...)            const m = Math.floor(...);
    value = array[mid]               const value = haystack[m];
    if value === needle:             if (value === needle) {
      return true                      return true;
    else if value > needle:          } else if (value > needle) {
      hi = mid                         hi = m;
    else:                            } else {
      lo = mid + 1                     lo = m + 1;
  while lo < hi                    } while (lo < hi);
  return false                     return false;

  → Gần như GIỐNG NHAU! Chỉ khác cú pháp!
  → Đây là lý do pseudocode cực kỳ hữu ích!
```

Điểm khác biệt duy nhất đáng chú ý: `Math.floor()` — vì JavaScript chia hai integer có thể cho ra số thập phân (ví dụ: 7/2 = 3.5), mà index mảng phải là số nguyên.

### Tại sao chỉ có 7 dòng?

Prime nhấn mạnh: binary search chỉ có **7 dòng code thật**. Nhưng 7 dòng này chứa **rất nhiều logic phức tạp**:

```
7 DÒNG — NHƯNG MỖI DÒNG QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  let lo = 0;                              ← khởi tạo vùng tìm kiếm
  let hi = haystack.length;                ← exclusive boundary!
  const m = Math.floor(lo + (hi-lo)/2);    ← safe midpoint (tránh overflow!)
  const value = haystack[m];               ← đọc giá trị tại midpoint
  if (value === needle) return true;       ← trường hợp 1: tìm thấy!
  else if (value > needle) hi = m;         ← trường hợp 2: đi trái!
  else lo = m + 1;                         ← trường hợp 3: đi phải!

  Mỗi dòng đều có THỂ viết sai:
  → Quên Math.floor? → Index thập phân! 💀
  → Quên /2? → m = hi, không phải midpoint! 💀
  → hi = m - 1? → Bỏ sót phần tử! 💀
  → lo = m? → Infinite loop khi lo = m! 💀
  → while (lo <= hi)? → Infinite loop! 💀

  "Chỉ 7 dòng. Khá ĐƠN GIẢN — chỉ cần
   tập trung và làm ĐÚNG." — Prime
```

---

## §2. "Don't Forget to Divide by 2!" — Prime's Bug!

> Prime: _"Don't forget to divide by 2! When I programmed this, it took me THREE MINUTES to realize I had a bug because I forgot to divide by 2."_

### Lỗi phổ biến!

```javascript
// ❌ SAI — quên /2!
const m = Math.floor(lo + (hi - lo)); // = hi! Không phải midpoint!

// ✅ ĐÚNG!
const m = Math.floor(lo + (hi - lo) / 2); // midpoint thật!
```

### Giải thích sâu: tại sao lỗi này khó phát hiện?

Khi bạn viết `lo + (hi - lo)`, đơn giản hoá toán học: `lo + hi - lo = hi`. Vậy `m = hi` — bạn luôn nhảy đến **cuối** vùng tìm kiếm thay vì **giữa**! Đây là lý do Prime mất 3 phút debug — vì code vẫn chạy, vẫn compile, nhưng **cho kết quả sai**.

```
LỖI QUÊN /2 — CHUYỆN GÌ XẢY RA:
═══════════════════════════════════════════════════════════════

  Mảng: [1, 3, 5, 7, 9]    lo = 0, hi = 5

  ❌ Quên /2: m = 0 + (5-0) = 5
  → haystack[5] = NGOÀI MẢNG! 💀
  → Hoặc đọc giá trị rác!

  ✅ Có /2: m = 0 + (5-0)/2 = 2
  → haystack[2] = 5 → đúng! ✅

  Tại sao khó phát hiện:
  → Code COMPILE bình thường!
  → Đôi khi CHẠY ĐÚNG (nếu needle ở cuối!)
  → Chỉ SAI khi needle ở giữa hoặc đầu!
  → Đây là dạng bug "works sometimes" = ÁC MỘNG!

  Mẹo: luôn KIỂM TRA bằng tay với mảng nhỏ!
  → m có nằm GIỮA lo và hi không?
  → Nếu lo=0, hi=10 → m phải ≈ 5, không phải 10!
```

---

## §3. First Try! — "npx jest binary → GREEN!"

> Prime: _"npx jest binary — binary search actually WORKED, first try!"_

### Test passed! ✅

Prime also accidentally reveals the test list: _"Don't look at the second one, 'compare binary tree.' You're not supposed to see that yet. Let's pretend the man behind the curtain doesn't exist."_ 😂

### Ý nghĩa của "first try"

Đây không phải là may mắn — đây là **kết quả của quy trình**. Prime đã:

1. **Vẽ trên whiteboard** trước (hình dung logic)
2. **Viết pseudocode** (xác định logic chính xác)
3. **Chọn convention** (lo inclusive, hi exclusive)
4. **Dịch sang code** (chỉ cần theo pseudocode)

Khi bạn có quy trình rõ ràng, "first try" không phải là ngoại lệ — nó là **kỳ vọng**.

```
TẠI SAO "FIRST TRY" KHÔNG PHẢI MAY MẮN:
═══════════════════════════════════════════════════════════════

  Quy trình Prime dùng:
  ┌──────────────────────────────────────────────────────────┐
  │ 1. Whiteboard: hiểu bài toán bằng hình!                 │
  │ 2. Pseudocode: logic chính xác trước khi code!          │
  │ 3. Convention: lo inclusive, hi exclusive → không nhầm!  │
  │ 4. Code: chỉ DỊCH pseudocode → TypeScript!              │
  │ 5. Test: npx jest binary → GREEN! ✅                    │
  └──────────────────────────────────────────────────────────┘

  Không quy trình:
  ┌──────────────────────────────────────────────────────────┐
  │ 1. Mở editor → bắt đầu gõ code ngay!                    │
  │ 2. "Hmm, mid + 1 hay mid?"                               │
  │ 3. "Hmm, < hay <=?"                                      │
  │ 4. "Hmm, hi = mid hay hi = mid - 1?"                     │
  │ 5. Test → FAIL! Debug... sửa... FAIL! Debug...          │
  │ 6. 30 phút sau → "tại sao infinite loop?!" 😱           │
  └──────────────────────────────────────────────────────────┘
```

---

## §4. Google Interview Story — "+1 -1 Issues Everywhere!"

> Prime: _"One of my first interviews at Google, they made me code binary search in Google Docs. It was TERRIBLE. I had +1 -1 issues ALL OVER the place."_

### Binary search = classic interview trap!

Prime: _"I didn't come into it with a really clean idea of exactly what needed to happen."_

**Bài học**: Đến phỏng vấn với **convention** (lo inclusive, hi exclusive) hoặc off-by-ones sẽ phá huỷ bạn!

### Giải thích sâu: câu chuyện Google

Đây là một trong những câu chuyện thú vị nhất trong khoá học. Prime — một senior engineer — kể rằng phỏng vấn Google lần đầu, ông ấy phải viết binary search **trong Google Docs** (không phải IDE — không autocomplete, không syntax highlighting, không test!). Và ông ấy **thất bại** vì +1 -1 issues.

Tại sao điều này quan trọng? Vì nó cho thấy:

1. **Binary search TRÔNG đơn giản nhưng RẤT dễ sai**. Chỉ có 7 dòng, nhưng mỗi dòng có thể off-by-one.
2. **Convention cứu mạng**. Nếu Prime đã có convention rõ ràng (`[lo, hi)`) trước khi vào phỏng vấn, ông ấy không phải "đoán" `+1` hay không mỗi lần. Convention cho bạn **quy tắc nhất quán** mà bạn chỉ cần **áp dụng máy móc**.
3. **Google Docs = không có safety net**. Không compiler, không linter, không test. Bạn phải **đúng ngay từ đầu** — đây là lý do tại sao vẽ trên whiteboard trước quan trọng.

```
BÀI HỌC TỪ GOOGLE:
═══════════════════════════════════════════════════════════════

  Không convention:
  ┌──────────────────────────────────────────────────────────┐
  │ "mid nên +1 hay không nhỉ?"                             │
  │ "hi nên là mid hay mid-1?"                               │
  │ "Loop nên là < hay <=?"                                  │
  │ → Hoảng loạn! +1 -1 ở MỌI NƠI! 😱                     │
  └──────────────────────────────────────────────────────────┘

  Có convention (lo inclusive, hi exclusive):
  ┌──────────────────────────────────────────────────────────┐
  │ needle > value → lo = mid + 1 (inclusive, bỏ mid!)      │
  │ needle < value → hi = mid (exclusive đã loại mid!)      │
  │ loop: while lo < hi (exclusive = không include!)        │
  │ → Sạch sẽ, nhất quán, không hoảng! ✅                  │
  └──────────────────────────────────────────────────────────┘

  Mẹo phỏng vấn:
  ┌──────────────────────────────────────────────────────────┐
  │ 1. NÓI RÕ convention trước khi code!                     │
  │    "Tôi dùng lo inclusive, hi exclusive."                 │
  │    → Interviewer biết bạn có KINH NGHIỆM!               │
  │                                                          │
  │ 2. Viết pseudocode trước → code sau!                     │
  │    → Thể hiện tư duy có hệ thống!                       │
  │                                                          │
  │ 3. Test bằng ví dụ nhỏ (3-5 phần tử)!                  │
  │    → Kiểm tra edge cases (đầu, cuối, giữa, không có!)  │
  │                                                          │
  │ 4. Kiểm tra: mid có nằm GIỮA lo và hi không?           │
  │    → Nếu không → quên /2 hoặc logic sai!                │
  └──────────────────────────────────────────────────────────┘

  "Đến với MỘT KẾ HOẠCH." — Prime
```

### Sai lầm phổ biến khi implement binary search

```
5 LỖI PHỔ BIẾN NHẤT:
═══════════════════════════════════════════════════════════════

  ❌ Lỗi 1: Quên /2 trong midpoint
  const m = lo + (hi - lo);     // = hi, không phải giữa!
  ✅ const m = lo + (hi - lo) / 2;

  ❌ Lỗi 2: Dùng (lo + hi) / 2
  → Overflow khi lo + hi > 2^31!
  ✅ lo + (hi - lo) / 2;

  ❌ Lỗi 3: Quên Math.floor
  const m = lo + (hi - lo) / 2;  // có thể = 3.5!
  ✅ const m = Math.floor(lo + (hi - lo) / 2);

  ❌ Lỗi 4: lo = mid thay vì lo = mid + 1
  → Khi lo = mid = 5, vòng lặp KHÔNG TIẾN!
  → Infinite loop! 💀
  ✅ lo = mid + 1;

  ❌ Lỗi 5: Trộn convention
  → hi bắt đầu = length (exclusive)
  → Nhưng dùng while (lo <= hi) (inclusive style!)
  → Off-by-one hoặc infinite loop!
  ✅ Chọn MỘT convention, giữ NHẤT QUÁN!
```

---

## §5. Tự Implement: Complete Binary Search

```javascript
// ═══ Binary Search — Implementation Hoàn Chỉnh ═══

// Phiên bản boolean (giống bài giảng!)
function binarySearch(haystack, needle) {
  let lo = 0;
  let hi = haystack.length; // exclusive!

  do {
    const m = Math.floor(lo + (hi - lo) / 2);
    const value = haystack[m];

    if (value === needle) return true;
    else if (value > needle) hi = m;
    else lo = m + 1;
  } while (lo < hi);

  return false;
}

// Phiên bản trả về INDEX (giống indexOf!)
function binarySearchIndex(haystack, needle) {
  let lo = 0;
  let hi = haystack.length;

  do {
    const m = Math.floor(lo + (hi - lo) / 2);
    const value = haystack[m];

    if (value === needle)
      return m; // trả về VỊ TRÍ!
    else if (value > needle) hi = m;
    else lo = m + 1;
  } while (lo < hi);

  return -1; // sentinel value!
}

// Tests
const sorted = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];

console.log("═══ BINARY SEARCH ═══\n");

// Boolean
console.log("Boolean:");
console.log("  Tìm 9:", binarySearch(sorted, 9)); // true
console.log("  Tìm 20:", binarySearch(sorted, 20)); // false

// Index
console.log("\nIndex:");
console.log("  Tìm 9:", binarySearchIndex(sorted, 9)); // 4
console.log("  Tìm 20:", binarySearchIndex(sorted, 20)); // -1

// Edge cases
console.log("\nEdge cases:");
console.log("  Phần tử đầu:", binarySearch(sorted, 1)); // true
console.log("  Phần tử cuối:", binarySearch(sorted, 21)); // true
console.log("  Mảng rỗng:", binarySearch([], 5)); // false
console.log("  Một phần tử (đúng):", binarySearch([5], 5)); // true
console.log("  Một phần tử (sai):", binarySearch([5], 3)); // false

// So sánh hiệu suất!
console.log("\n═══ HIỆU SUẤT ═══\n");
const big = Array.from({ length: 1000000 }, (_, i) => i * 2);
const target = 999998; // gần cuối mảng!

let linearSteps = 0;
for (let i = 0; i < big.length; i++) {
  linearSteps++;
  if (big[i] === target) break;
}

let binarySteps = 0;
let lo = 0,
  hi = big.length;
do {
  binarySteps++;
  const m = Math.floor(lo + (hi - lo) / 2);
  if (big[m] === target) break;
  else if (big[m] > target) hi = m;
  else lo = m + 1;
} while (lo < hi);

console.log(`Kích thước mảng: ${big.length.toLocaleString()}`);
console.log(`Linear search: ${linearSteps.toLocaleString()} bước`);
console.log(`Binary search: ${binarySteps} bước`);
console.log(`Nhanh hơn: ${Math.round(linearSteps / binarySteps)}× ! 🚀`);
```

---

## Checklist

```
[ ] Dịch trực tiếp pseudocode → TypeScript — gần như 1:1!
[ ] Math.floor cho integer midpoint (JS chia cho số thập phân!)
[ ] Đừng quên /2! (Bug 3 phút của Prime!)
[ ] Quên /2 → m = hi → ngoài mảng hoặc kết quả sai!
[ ] Chỉ 7 dòng code thật — nhưng mỗi dòng CÓ THỂ sai!
[ ] 5 lỗi phổ biến: quên /2, overflow, quên floor, lo=mid, trộn convention!
[ ] Google interview: +1 -1 issues không convention!
[ ] Convention cứu mạng: nói rõ TRƯỚC khi code trong phỏng vấn!
[ ] Quy trình = first try: whiteboard → pseudocode → convention → code!
[ ] Sentinel value -1 cho phiên bản trả index!
[ ] 1 triệu phần tử: 20 bước vs 500,000 bước → 25,000× nhanh hơn!
TIẾP THEO → Phần 9: Two Crystal Balls Problem!
```
