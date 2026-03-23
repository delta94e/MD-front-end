# The Last Algorithms Course You'll Need — Phần 11: Bubble Sort — "3 Lines of Code, Plane Crashing, Gauss's Story, O(N²)!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Bubble Sort — "Simplest sort, largest bubbles to end, progressively smaller iterations, Gauss formula, O(N²)!"
> Độ khó: ⭐️⭐️⭐️ | Sorting — bubble sort visualization, Gauss story, Big O derivation!

---

## Mục Lục

| #   | Phần                                                    |
| --- | ------------------------------------------------------- |
| 1   | "Write Bubble Sort on a Crashing Plane!" — Ray Babcock  |
| 2   | Sorted Array Definition — "Xi ≤ Xi+1!"                  |
| 3   | How Bubble Sort Works — "Am I Larger? Swap!"            |
| 4   | Walkthrough — "Largest Bubbles to the End!"             |
| 5   | Progressively Smaller — "N, N-1, N-2, ... 1!"           |
| 6   | Gauss's Story — "The Asshole in Third Grade!"           |
| 7   | Big O Derivation — "N(N+1)/2 → O(N²)!"                  |
| 8   | Tự Implement: Bubble Sort                               |
| 9   | 🔬 Deep Analysis — Why N² and Drop Insignificant Values |

---

## §1. "Write Bubble Sort on a Crashing Plane!" — Ray Babcock

> Prime: _"Ray Babcock once said — if an airplane was going down, stewardess kicks the curtain between first class and economy, and she said 'Quickly, we need someone that can write a sorting algorithm or this plane will crash.' You could write bubble sort under a plane crashing. It is THAT simple."_

### 3 dòng code!

Prime: _"Bubble sort is not only really easy to visualize, it's also THREE LINES OF CODE. An extremely simple algorithm."_

_"Normally it starts with insertion sort — but the example always sucks, it's like a card deck. I still don't know how to sort cards."_

### Tại sao bắt đầu khoá sorting bằng bubble sort?

Prime chọn bubble sort thay vì insertion sort (cách truyền thống) vì hai lý do:

1. **Trực quan nhất**: bạn có thể hình dung "phần tử lớn nhất nổi lên cuối" — giống bong bóng nổi lên mặt nước. Tên "bubble sort" đến từ đây.

2. **Đơn giản nhất**: chỉ có 3 dòng logic — so sánh, swap nếu cần, lặp lại. Ray Babcock's test: nếu bạn không thể viết nó khi máy bay đang rơi, nó quá phức tạp.

```
TẠI SAO BUBBLE SORT ĐẦU TIÊN:
═══════════════════════════════════════════════════════════════

  Insertion Sort (cách truyền thống):
  → Ví dụ: "sắp xếp bài" → khó hình dung
  → "Tôi VẪN không biết cách xếp bài." — Prime 😂

  Bubble Sort (cách của Prime):
  → Ví dụ: "phần tử lớn NỔI LÊN cuối"
  → 3 dòng code!
  → Viết được khi máy bay rơi! ✈️💀

  → Đơn giản = dễ hiểu = nền tảng tốt để
    so sánh với sorting algorithms phức tạp hơn sau!
```

---

## §2. Sorted Array Definition — "Xi ≤ Xi+1!"

> Prime: _"The mathy definition — any Xi is going to be ≤ any Xi+1. This is true for the ENTIRE array. That's how you know an array is sorted."_

### Định nghĩa chính thức!

```
MẢNG ĐÃ SORTED:
═══════════════════════════════════════════════════════════════

  Với MỌI i: array[i] ≤ array[i + 1]

  ✅ Sorted:      [1, 2, 3, 4, 5]
     1≤2 ✅  2≤3 ✅  3≤4 ✅  4≤5 ✅

  ❌ Unsorted:    [1, 3, 7, 4, 2]
     1≤3 ✅  3≤7 ✅  7≤4 ❌  → KHÔNG sorted!

  Chỉ cần MỘT cặp vi phạm → toàn bộ NOT sorted!
```

### Giải thích sâu: tại sao định nghĩa này quan trọng?

Định nghĩa `array[i] ≤ array[i+1]` cho mọi i chính là **cơ sở** của bubble sort. Nếu bạn **kiểm tra mọi cặp liền kề** và **swap khi vi phạm**, bạn sẽ dần dần đưa mảng về trạng thái sorted. Đây là logic cốt lõi: bubble sort **sửa từng vi phạm một** cho đến khi không còn vi phạm nào.

Lưu ý: `≤` (nhỏ hơn hoặc bằng) nghĩa là **cho phép phần tử bằng nhau**. Nếu dùng `<` (strictly less than), thì mảng [1, 1, 2, 3] sẽ không thoả mãn. Bubble sort cho phép phần tử trùng — nó là thuật toán **stable** (giữ nguyên thứ tự tương đối của các phần tử bằng nhau).

---

## §3. How Bubble Sort Works — "Am I Larger? Swap!"

> Prime: _"It starts at the zeroth position, goes to the end. It says: hey person next to me, if I'm LARGER than you, we SWAP positions. That's the ENTIRETY of the algorithm."_

### Thuật toán!

Với mỗi phần tử, so sánh với phần tử kế tiếp:

- Nếu current > next → **swap!**
- Nếu current ≤ next → bỏ qua!

Lặp lại cho đến khi sorted!

### Giải thích sâu: hình dung "bong bóng nổi"

Hãy tưởng tượng mảng như một **cột nước**, và mỗi phần tử là một **bong bóng** có kích thước khác nhau. Bong bóng lớn nhất sẽ **nổi lên trên** (cuối mảng) trước. Sau đó bong bóng lớn thứ hai nổi lên. Cứ thế cho đến khi tất cả bong bóng ở đúng vị trí.

```
BONG BÓNG NỔI — TRỰC QUAN:
═══════════════════════════════════════════════════════════════

  Cột nước (mảng đứng):

  Trước:     Sau lần 1:   Sau lần 2:   Sau lần 3:
  ┌───┐      ┌───┐        ┌───┐        ┌───┐
  │ 1 │      │ 1 │        │ 1 │        │ 1 │
  │ 3 │      │ 3 │        │ 2 │        │ 2 │
  │ 7 │      │ 4 │        │ 3 │        │ 3 │ ← SORTED!
  │ 4 │      │ 2 │        │ 4 │ ←      │ 4 │
  │ 2 │      │ 7 │ ← lớn  │ 7 │ ← lớn  │ 7 │
  └───┘      └───┘ nhất!  └───┘ nhì!   └───┘

  7 "nổi" lên cuối trước (lần 1)
  4 "nổi" lên vị trí kế tiếp (lần 2)
  3 "nổi" lên (lần 3)
  → Xong!
```

---

## §4. Walkthrough — "Largest Bubbles to the End!"

> Prime: _"By a singular iteration, what happens? The LARGEST item is at the END."_

### Mô phỏng từng bước!

```
BUBBLE SORT — MÔ PHỎNG CHI TIẾT:
═══════════════════════════════════════════════════════════════

  Bắt đầu: [1, 3, 7, 4, 2]

  ── Lần duyệt 1 (so sánh đến index 4): ──
  1 vs 3: 1 < 3 → giữ nguyên!     [1, 3, 7, 4, 2]
  3 vs 7: 3 < 7 → giữ nguyên!     [1, 3, 7, 4, 2]
  7 vs 4: 7 > 4 → SWAP!           [1, 3, 4, 7, 2]
  7 vs 2: 7 > 2 → SWAP!           [1, 3, 4, 2, 7] ← 7 ở cuối! ✅

  → Nhận xét: 7 (lớn nhất) "nổi" qua từng vị trí
    cho đến khi đến cuối mảng!

  ── Lần duyệt 2 (so sánh đến index 3): ──
  1 vs 3: giữ nguyên!              [1, 3, 4, 2, 7]
  3 vs 4: giữ nguyên!              [1, 3, 4, 2, 7]
  4 vs 2: 4 > 2 → SWAP!           [1, 3, 2, 4, 7] ← 4 sorted! ✅

  ── Lần duyệt 3 (so sánh đến index 2): ──
  1 vs 3: giữ nguyên!              [1, 3, 2, 4, 7]
  3 vs 2: 3 > 2 → SWAP!           [1, 2, 3, 4, 7] ← 3 sorted! ✅

  ── Lần duyệt 4 (so sánh đến index 1): ──
  1 vs 2: giữ nguyên!              [1, 2, 3, 4, 7] ← XONG! ✅

  "Một lần duyệt duy nhất sẽ luôn đưa
   phần tử LỚN NHẤT về vị trí cuối." — Prime
```

### Tại sao phần tử lớn nhất luôn "nổi" lên cuối?

Hãy theo dõi số 7 trong ví dụ trên: mỗi khi so sánh với phần tử kế tiếp, 7 luôn **lớn hơn** → luôn **swap** → 7 di chuyển sang phải một bước. Quá trình này lặp lại cho đến khi 7 đến cuối mảng — vì không còn phần tử nào lớn hơn nó để "chặn" nó lại.

---

## §5. Progressively Smaller — "N, N-1, N-2, ... 1!"

> Prime: _"The next time we do bubble sort, we only have to go up to but NOT INCLUDING the last position — it's already sorted."_

### Mỗi lần duyệt ngắn hơn!

```
NGẮN DẦN:
═══════════════════════════════════════════════════════════════

  Lần duyệt 1: so sánh N phần tử!      (toàn bộ mảng!)
  Lần duyệt 2: so sánh N-1 phần tử!    (cuối đã sorted!)
  Lần duyệt 3: so sánh N-2 phần tử!
  ...
  Lần duyệt N-1: so sánh 2 phần tử!
  Lần duyệt N:   so sánh 1 phần tử!    (luôn sorted!)

  "Một mảng có MỘT phần tử LUÔN LUÔN sorted." — Prime
```

Đây là tối ưu quan trọng: sau mỗi lần duyệt, phần tử cuối cùng **chắc chắn** đã ở đúng vị trí → không cần so sánh nữa → tiết kiệm comparisons.

---

## §6. Gauss's Story — "The Asshole in Third Grade!"

> Prime: _"There's this asshole in third grade named Gauss. His teacher said: kids, add numbers from 1 to 100. Gauss did it in TEN SECONDS."_

### Mẹo của Gauss!

Prime: _"1 + 100 = 101. 2 + 99 = 101. 3 + 98 = 101... all the way to 50 + 51 = 101. So 101 × 50 = 5050!"_

### Giải thích sâu: Gauss và mối liên hệ với bubble sort

Carl Friedrich Gauss (1777-1855) là một trong những nhà toán học vĩ đại nhất lịch sử. Câu chuyện (dù có thể hư cấu một phần) kể rằng khi mới **7-10 tuổi**, giáo viên giao bài: "Cộng tất cả số từ 1 đến 100." Trong khi cả lớp loay hoay cộng từng số, Gauss nhận ra pattern:

```
CÔNG THỨC GAUSS:
═══════════════════════════════════════════════════════════════

     1 +  2 +  3 + ... + 98 + 99 + 100
     ↓    ↓                  ↓    ↓
   (1+100) = 101
   (2+99)  = 101
   (3+98)  = 101
   ...
   (50+51) = 101

   50 cặp × 101 = 5,050! ✅

   Công thức tổng quát: N × (N + 1) / 2

   Kiểm tra: 100 × 101 / 2 = 5,050 ✅

   "Thầy giáo kể tôi câu chuyện này,
    và tôi luôn nhớ nó vì vậy." — Prime
```

Tại sao Gauss liên quan đến bubble sort? Vì **tổng số comparisons** của bubble sort chính là dãy: `(N-1) + (N-2) + ... + 2 + 1` — chính xác là công thức Gauss! Đây là cầu nối giữa toán học và thuật toán.

---

## §7. Big O Derivation — "N(N+1)/2 → O(N²)!"

> Prime: _"If we look at this pattern: N, N-1, N-2, ... 1 — that's Gauss's formula reversed!"_

### Từ đếm operations đến Big O!

```
CHỨNG MINH BIG O:
═══════════════════════════════════════════════════════════════

  Tổng comparisons:
  (N-1) + (N-2) + (N-3) + ... + 2 + 1

  Đảo lại: 1 + 2 + 3 + ... + (N-1)

  Gauss: (N-1) × N / 2

  Khai triển: (N² - N) / 2

  Drop hằng số (/2): N² - N

  Drop giá trị không đáng kể (-N): N²

  → O(N²)! 🎯
```

### Drop insignificant values — tại sao?

Prime: _"Imagine input at 10,000 — N² is 100 million. The +N (10,000) is so insignificant, it eventually goes to zero as N grows."_

```
DROP INSIGNIFICANT VALUES — CHỨNG MINH BẰNG SỐ:
═══════════════════════════════════════════════════════════════

  N = 10:
  N² = 100, N = 10 → N chiếm 10% của N²!
  → Còn đáng kể...

  N = 100:
  N² = 10,000, N = 100 → N chiếm 1% của N²!
  → Bắt đầu nhỏ...

  N = 1,000:
  N² = 1,000,000, N = 1,000 → N chiếm 0.1%!
  → Gần như không đáng...

  N = 10,000:
  N² = 100,000,000, N = 10,000 → N chiếm 0.01%!
  → "+N là KHÔNG GÌ so với N²" — Prime

  N = 1,000,000:
  N² = 1,000,000,000,000 (1 nghìn tỷ!)
  N = 1,000,000 (1 triệu)
  → N chiếm 0.0001% của N²! → KHÔNG ĐÁNG KỂ!

  Quy tắc: Khi có tổng các bậc khác nhau,
  CHỈ GIỮ BẬC CAO NHẤT!
  N² + N → O(N²)
  N³ + N² + N → O(N³)
  2^N + N³ → O(2^N)
```

---

## §8. Tự Implement: Bubble Sort

```javascript
// ═══ Bubble Sort ═══

function bubbleSort(arr) {
  // Outer: mỗi lần duyệt "cố định" phần tử cuối!
  for (let i = 0; i < arr.length; i++) {
    // Inner: so sánh cặp liền kề, ngắn dần!
    for (let j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap!
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

const arr = [1, 3, 7, 4, 2];
console.log("Input:", arr.join(", "));
console.log("Sorted:", bubbleSort([...arr]).join(", "));

// Phiên bản verbose
function bubbleSortVerbose(arr) {
  const a = [...arr];
  let tổngSwaps = 0;
  for (let i = 0; i < a.length; i++) {
    let swaps = 0;
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        tổngSwaps++;
      }
    }
    console.log(`  Lần duyệt ${i + 1}: [${a.join(", ")}] (${swaps} swaps)`);
  }
  console.log(`  Tổng swaps: ${tổngSwaps}`);
  return a;
}

console.log("\n═══ CHI TIẾT ═══\n");
bubbleSortVerbose([5, 3, 8, 1, 2]);

// Kiểm tra công thức Gauss
console.log("\n═══ CÔNG THỨC GAUSS ═══\n");
[10, 100, 1000].forEach((n) => {
  const gauss = (n * (n + 1)) / 2;
  let manual = 0;
  for (let i = 1; i <= n; i++) manual += i;
  console.log(
    `1+2+...+${n} = ${gauss.toLocaleString()} ` +
    `(kiểm tra: ${manual === gauss ? "✅" : "❌"})`
  );
});

// So sánh operations vs N²
console.log("\n═══ OPERATIONS vs N² ═══\n");
[10, 100, 1000, 10000].forEach((n) => {
  const ops = (n * (n - 1)) / 2;
  const nSq = n * n;
  console.log(
    `N=${n.toLocaleString().padStart(6)}: ` +
    `ops=${ops.toLocaleString().padStart(12)}, ` +
    `N²=${nSq.toLocaleString().padStart(12)}, ` +
    `tỷ lệ=${(ops / nSq).toFixed(2)}`
  );
});
```

---

## §9. 🔬 Deep Analysis — Why N² and Drop Insignificant Values

```
PHÂN TÍCH BUBBLE SORT:
═══════════════════════════════════════════════════════════════

  CÁCH HOẠT ĐỘNG:
  1. So sánh các cặp phần tử liền kề!
  2. Swap nếu sai thứ tự!
  3. Phần tử lớn nhất "nổi" về cuối mỗi lần duyệt!
  4. Vùng so sánh thu hẹp sau mỗi lần!

  TIME COMPLEXITY:
  Best case:  O(N)   — đã sorted (cần tối ưu early exit!)
  Worst case: O(N²)  — sorted ngược!
  Average:    O(N²)

  SPACE: O(1) — in-place! Không cần bộ nhớ phụ!
  STABLE: Có — phần tử bằng nhau giữ thứ tự ban đầu!

  TỐI ƯU EARLY EXIT:
  ┌──────────────────────────────────────────────────────────┐
  │ Nếu một lần duyệt KHÔNG swap → mảng đã sorted!         │
  │ → Dừng sớm! → Best case O(N)!                          │
  │                                                          │
  │ function bubbleSortOpt(arr) {                            │
  │   for (let i = 0; i < arr.length; i++) {                │
  │     let swapped = false;                                 │
  │     for (let j = 0; j < arr.length-1-i; j++) {         │
  │       if (arr[j] > arr[j+1]) {                          │
  │         swap(arr, j, j+1);                               │
  │         swapped = true;                                  │
  │       }                                                  │
  │     }                                                    │
  │     if (!swapped) break; // ĐÃ SORTED! DỪNG!           │
  │   }                                                      │
  │ }                                                        │
  └──────────────────────────────────────────────────────────┘

  SO SÁNH VỚI CÁC SORT KHÁC:
  ┌───────────────┬──────────┬──────────┬────────┬─────────┐
  │ Thuật toán    │ Best     │ Average  │ Worst  │ Space   │
  │───────────────┼──────────┼──────────┼────────┼─────────│
  │ Bubble Sort   │ O(N)     │ O(N²)    │ O(N²)  │ O(1)    │
  │ Insertion Sort│ O(N)     │ O(N²)    │ O(N²)  │ O(1)    │
  │ Selection Sort│ O(N²)    │ O(N²)    │ O(N²)  │ O(1)    │
  │ Merge Sort    │ O(N logN)│ O(N logN)│O(N logN)│ O(N)   │
  │ Quick Sort    │ O(N logN)│ O(N logN)│ O(N²)  │ O(logN) │
  └───────────────┴──────────┴──────────┴────────┴─────────┘

  "Bạn có thể viết bubble sort khi máy bay đang rơi.
   Nó ĐƠN GIẢN đến vậy." — Ray Babcock qua Prime ✈️
```

---

## Checklist

```
[ ] Sorted: Xi ≤ Xi+1 cho mọi i!
[ ] Bubble sort: so sánh cặp liền kề, swap nếu sai!
[ ] Mỗi lần duyệt: phần tử lớn nhất "nổi" về cuối!
[ ] Ngắn dần: N, N-1, N-2, ... 1!
[ ] Gauss: 1+2+...+100 = 50 × 101 = 5050!
[ ] Công thức: N(N+1)/2!
[ ] Big O: N(N-1)/2 → N² - N → drop N → O(N²)!
[ ] Drop insignificant: N² + N → giữ bậc cao nhất → O(N²)!
[ ] In-place (O(1) space), stable!
[ ] Tối ưu early exit: không swap → đã sorted → dừng!
[ ] 3 dòng code! Viết được khi máy bay rơi! ✈️
TIẾP THEO → Phần 12: Implementing Bubble Sort!
```
