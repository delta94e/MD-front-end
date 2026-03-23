# The Last Algorithms Course You'll Need — Phần 12: Implementing Bubble Sort — "First Sorting Algorithm, First Try, Immutability = N³!"

> 📅 2026-03-08 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implementing Bubble Sort — "i/j loops, minus i for progressively smaller, swap with temp, first try, immutability Q&A!"
> Độ khó: ⭐️⭐️⭐️ | Implementation — translating bubble sort to TypeScript, Big O re-explanation!

---

## Mục Lục

| #   | Phần                                                          |
| --- | ------------------------------------------------------------- |
| 1   | Pseudocode Recap — "Two Loops, Compare, Swap!"                |
| 2   | Implementation — "i Loop, j Loop, -1 -i!"                     |
| 3   | The Swap — "Temp, Classic Three Lines!"                       |
| 4   | First Try! — "Michael Bubble 🎤"                              |
| 5   | Big O Re-explanation — "Constant Ops Inside, Loops Cause N²!" |
| 6   | Q: Immutability + Sorting? — "N³, Terrible Idea!"             |
| 7   | Recursion Teaser — "Can't Do Quicksort Yet!"                  |
| 8   | Tự Implement: Complete Bubble Sort                            |

---

## §1. Pseudocode Recap — "Two Loops, Compare, Swap!"

> Prime: _"We have an array from 0 to N. We start at 0 and go up to but not including N-1, because we compare i to i+1 — don't wanna go off the array."_

### Kế hoạch!

```
for i từ 0 đến N:
  for j từ 0 đến N - 1 - i:     // ngắn dần!
    nếu array[j] > array[j + 1]:
      swap(array[j], array[j + 1])
```

Prime: _"If you're using a traditional language and you go off the array — array out of bounds exception in Java. In C++, 'things happen.' I don't wanna be reading HTML here — that's the hacker's language."_ 😂

### Giải thích sâu: tại sao hai vòng lặp?

Hai vòng lặp có **vai trò khác nhau**:

```
VAI TRÒ CỦA MỖI VÒNG LẶP:
═══════════════════════════════════════════════════════════════

  Vòng ngoài (i): "LẦN DUYỆT THỨ MẤY?"
  ┌──────────────────────────────────────────────────────────┐
  │ i = 0: lần duyệt 1 → cố định phần tử cuối!            │
  │ i = 1: lần duyệt 2 → cố định phần tử kế cuối!         │
  │ i = 2: lần duyệt 3 → tiếp tục cố định...              │
  │ ...                                                      │
  │ → Tổng: N lần duyệt!                                    │
  └──────────────────────────────────────────────────────────┘

  Vòng trong (j): "SO SÁNH VÀ SWAP!"
  ┌──────────────────────────────────────────────────────────┐
  │ j chạy từ 0 đến (N - 1 - i)                            │
  │ → So sánh arr[j] với arr[j+1]                           │
  │ → Nếu sai thứ tự → swap!                               │
  │ → "-1": không so sánh phần tử cuối với j+1 (out!)      │
  │ → "-i": bỏ qua phần đã sorted ở cuối!                  │
  └──────────────────────────────────────────────────────────┘

  Hai vòng lặp lồng nhau = N × N = O(N²)!
```

---

## §2. Implementation — "i Loop, j Loop, -1 -i!"

> Prime: _"Every single time we execute, the last element becomes the largest — we don't need to redo that. So we also minus i."_

### Tại sao `j < arr.length - 1 - i`?

```
TẠI SAO -1 VÀ -i:
═══════════════════════════════════════════════════════════════

  N = 5: [_, _, _, _, _]  (index 0 đến 4)

  "-1": VÌ SO SÁNH arr[j] VỚI arr[j+1]
  → Nếu j chạy đến 4: arr[4] so arr[5] → OUT OF BOUNDS! 💀
  → j chạy đến 3 max: arr[3] so arr[4] → OK! ✅

  "-i": VÌ CUỐI ĐÃ SORTED
  i=0: j chạy 0→3 (so sánh 4 cặp, cả mảng!)
  i=1: j chạy 0→2 (so sánh 3 cặp, bỏ cuối!)
  i=2: j chạy 0→1 (so sánh 2 cặp!)
  i=3: j chạy 0→0 (so sánh 1 cặp!)
  i=4: j chạy 0→-1 (KHÔNG chạy → xong!)

  Không có -i: vẫn ĐÚNG nhưng LÃNG PHÍ!
  → So sánh lại phần tử đã ở đúng vị trí!
  → Operations thừa nhưng kết quả giống!
  → Với -i: tối ưu hơn, ít comparisons hơn!
```

---

## §3. The Swap — "Temp, Classic Three Lines!"

> Prime: _"Swapping — const temp = arr[j], arr[j] = arr[j+1], arr[j+1] = temp. Simple swap. I should have just created a function — I don't know why I didn't."_

```typescript
const temp = arr[j];
arr[j] = arr[j + 1];
arr[j + 1] = temp;
```

### Giải thích sâu: tại sao cần biến tạm?

Nếu bạn viết `arr[j] = arr[j+1]` mà **không lưu** `arr[j]` trước, giá trị cũ của `arr[j]` sẽ **mất vĩnh viễn** — bị ghi đè. Biến `temp` giữ giá trị cũ để gán lại cho `arr[j+1]`.

```
SWAP — TẠI SAO CẦN BIẾN TẠM:
═══════════════════════════════════════════════════════════════

  arr = [7, 4], muốn swap thành [4, 7]

  ❌ KHÔNG biến tạm:
  arr[0] = arr[1]     → arr = [4, 4]  ← 7 MẤT RỒI! 💀
  arr[1] = arr[0]     → arr = [4, 4]  ← WRONG!

  ✅ CÓ biến tạm:
  temp = arr[0]       → temp = 7
  arr[0] = arr[1]     → arr = [4, 4]  ← 7 an toàn trong temp!
  arr[1] = temp       → arr = [4, 7]  ← ĐÚNG! ✅

  Cách khác trong JS (destructuring):
  [arr[0], arr[1]] = [arr[1], arr[0]];  // ngắn hơn!
  → Nhưng Prime dùng cách truyền thống — rõ ràng hơn!
  → Trong phỏng vấn, interviewer muốn thấy bạn HIỂU
    tại sao cần temp, không chỉ biết cú pháp ngắn!
```

---

## §4. First Try! — "Michael Bubble 🎤"

> Prime: _"npx jest bubble... That would have been so much better if I'd called the file 'Michael Bubble.' I'd have been great."_ 😂

### Code hoàn chỉnh!

```typescript
function bubble_sort(arr: number[]): void {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
      }
    }
  }
}
```

Prime: _"It's really not that hard — an extremely simple algorithm. Probably SIMPLER than binary search. Binary search is significantly harder."_

### So sánh độ khó: bubble sort vs binary search

```
ĐỘ KHÓ SO SÁNH:
═══════════════════════════════════════════════════════════════

  Bubble Sort:
  → Logic: "so sánh cặp, swap nếu sai" — ĐƠN GIẢN!
  → Không lo off-by-one nặng (chỉ cần -1 -i)
  → Không convention phức tạp
  → Không cần dữ liệu sorted trước
  → "Đơn giản hơn binary search ĐÁNG KỂ." — Prime

  Binary Search:
  → Logic: "chia đôi, chọn nửa" — KHÁI NIỆM đơn giản!
  → Nhưng: lo inclusive, hi exclusive, <=  vs <, +1 hay không?
  → Convention phức tạp, dễ off-by-one
  → Cần dữ liệu sorted

  → Bubble sort = dễ implement nhất!
  → Binary search = dễ hiểu concept nhưng khó implement đúng!
```

### Lưu ý: hàm trả void!

Prime viết `function bubble_sort(arr: number[]): void` — hàm **không trả về** gì cả, mà **thay đổi mảng trực tiếp** (mutate in-place). Đây là design choice chuẩn cho sorting algorithms: sort tại chỗ, không tạo mảng mới, tiết kiệm bộ nhớ O(1).

---

## §5. Big O Re-explanation — "Constant Ops Inside, Loops Cause N²!"

> Student: _"We're comparing each element — it's kind of N² but I didn't understand the N(N+1)/2 formula."_

### Prime giải thích lại!

Prime: _"Everything INSIDE the inner loop is constant. Accessing array twice, comparing, swapping — all constant. It's really just the TWO LOOPS that cause the squared algorithm."_

```
BIG O — PHÂN TÍCH TỪNG PHẦN:
═══════════════════════════════════════════════════════════════

  Các operations BÊN TRONG vòng lặp:
  arr[j]        → O(1) constant! (array access = base + offset)
  arr[j+1]      → O(1) constant!
  so sánh >     → O(1) constant!
  swap          → O(1) constant! (3 phép gán)

  → Tất cả bên trong = O(1)! Không phụ thuộc N!

  Cái GÂY RA N² — HAI VÒNG LẶP:
  i=0: j chạy (N-1) lần     ← N-1 comparisons!
  i=1: j chạy (N-2) lần     ← N-2 comparisons!
  i=2: j chạy (N-3) lần     ← N-3 comparisons!
  ...
  i=N-2: j chạy 1 lần       ← 1 comparison!

  Tổng: (N-1) + (N-2) + ... + 1
  = Gauss: (N-1) × N / 2
  = (N² - N) / 2
  → Drop constants & insignificant → O(N²)! 🎯

  Cách nhớ đơn giản:
  → Hai vòng lặp lồng nhau, mỗi cái ~N lần
  → N × N ≈ N²
  → Operations bên trong O(1) → không ảnh hưởng!
```

---

## §6. Q: Immutability + Sorting? — "N³, Terrible Idea!"

> Student: _"What's a good sorting algorithm for immutable arrays?"_
> Prime: _"If you create an immutable array, you have an EXCEPTIONALLY POOR performing data structure."_

### Immutability + sorting = thảm hoạ!

Prime: _"Worst case — reverse sorted array, every swap copies N elements. So it'd be somewhere in N³ if not higher."_

_"I would NEVER use immutability and sorting in the same sentence — that's a terrible idea for performance."_

### Giải thích sâu: tại sao N³?

Immutable array = **không thể thay đổi**. Mỗi lần "swap", bạn phải **tạo bản sao hoàn toàn mới** của mảng với hai phần tử đổi chỗ. Tạo bản sao = **copy N phần tử** = O(N).

```
IMMUTABILITY + SORTING = THẢM HOẠ:
═══════════════════════════════════════════════════════════════

  Mutable (bình thường):
  Swap = 3 phép gán = O(1)!
  Tổng: O(N²) × O(1) = O(N²) ✅

  Immutable:
  Swap = tạo mảng mới = COPY N phần tử = O(N)! 😱
  Tổng: O(N²) swaps × O(N) copy = O(N³)! 💀

  Ví dụ: N = 10,000
  Mutable:  O(N²) = 100,000,000 operations
  Immutable: O(N³) = 1,000,000,000,000 operations! (1 nghìn tỷ!)
  → Chậm hơn 10,000 lần!

  Worse case (reverse sorted):
  → Gần như MỌI cặp đều swap!
  → N²/2 swaps × N copy = N³/2 operations!

  "Tôi sẽ KHÔNG BAO GIỜ dùng immutability
   và sorting trong cùng một câu — ý tưởng
   KINH KHỦNG cho hiệu suất." — Prime
```

Đây là bài học quan trọng về **trade-off**: immutability có nhiều ưu điểm (an toàn, dễ debug, thread-safe), nhưng **không phải lúc nào cũng tốt**. Sorting là một trong những trường hợp mà mutability **cần thiết** cho hiệu suất.

---

## §7. Recursion Teaser — "Can't Do Quicksort Yet!"

> Prime: _"There are other sorting algorithms but they deal with RECURSION, and I haven't covered recursion yet. The problem with recursion IS recursion."_

_"You don't really understand it until you COMPLETELY understand it. There's no middle ground — you either get it or don't."_

### Preview: sorting algorithms cần recursion

```
CÁC THUẬT TOÁN SẮP TỚI:
═══════════════════════════════════════════════════════════════

  ĐÃ HỌC:
  ✅ Bubble Sort — O(N²), không cần recursion!

  SẮP HỌC (cần recursion):
  ⏳ Merge Sort — O(N log N), chia đôi rồi merge!
  ⏳ Quick Sort — O(N log N)*, chia theo pivot!

  * Quick sort worst case vẫn O(N²) nhưng average O(N log N)!

  "Vấn đề của recursion LÀ recursion."
  "Bạn không hiểu nó cho đến khi bạn
   HOÀN TOÀN hiểu nó." — Prime
```

---

## §8. Tự Implement: Complete Bubble Sort

```javascript
// ═══ Bubble Sort — Implementation Hoàn Chỉnh ═══

function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
      }
    }
  }
  return arr;
}

// Demo
console.log("═══ BUBBLE SORT ═══\n");

const tests = [
  { arr: [5, 3, 8, 1, 2], desc: "mảng bất kỳ" },
  { arr: [1, 2, 3, 4, 5], desc: "đã sorted (best case!)" },
  { arr: [5, 4, 3, 2, 1], desc: "sorted ngược (worst case!)" },
  { arr: [42], desc: "1 phần tử" },
  { arr: [], desc: "mảng rỗng" },
  { arr: [3, 3, 3, 1, 1], desc: "có phần tử trùng" },
];

tests.forEach(({ arr, desc }) => {
  const copy = [...arr];
  bubbleSort(copy);
  console.log(`${desc}: [${arr.join(",")}] → [${copy.join(",")}]`);
});

// Đếm operations
function bubbleSortCounted(arr) {
  let comparisons = 0, swaps = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      comparisons++;
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swaps++;
      }
    }
  }
  return { comparisons, swaps };
}

console.log("\n═══ ĐẾM OPERATIONS ═══\n");
[5, 10, 50, 100, 500].forEach((n) => {
  const arr = Array.from({ length: n }, () =>
    Math.floor(Math.random() * 1000)
  );
  const { comparisons, swaps } = bubbleSortCounted(arr);
  const formula = (n * (n - 1)) / 2;
  console.log(
    `N=${n.toString().padStart(3)}: ` +
    `comparisons=${comparisons.toLocaleString().padStart(8)} ` +
    `(N(N-1)/2=${formula.toLocaleString().padStart(8)}), ` +
    `swaps=${swaps.toLocaleString()}`
  );
});
```

---

## Checklist

```
[ ] Hai vòng lặp: i (số lần duyệt), j (so sánh cặp)!
[ ] j < arr.length - 1 - i: -1 tránh out-of-bounds, -i bỏ phần đã sorted!
[ ] Swap cần biến tạm (temp) — 3 dòng!
[ ] Operations bên trong tất cả O(1) — vòng lặp gây N²!
[ ] N(N-1)/2 → drop constants → O(N²)!
[ ] Immutability + sorting = O(N³) — THẢM HOẠ!
[ ] Mỗi swap copy N phần tử nếu immutable!
[ ] In-place sort (no extra memory)!
[ ] Return void — mutate mảng trực tiếp!
[ ] First try pass! "Michael Bubble" 🎤 😂
[ ] Recursion = cần cho quicksort, merge sort (sắp tới!)
TIẾP THEO → Phần 13: Linked List Data Structures!
```
