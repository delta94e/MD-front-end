# The Last Algorithms Course You'll Need — Phần 2: Big O Time Complexity — "Growth with Respect to Input, Drop Constants, Worst Case!"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Big O Time Complexity — "Categorize algorithm by time/memory, look for loops, drop constants, worst case only!"
> Độ khó: ⭐️⭐️ | Fundamental — Big O notation, 3 core concepts, common complexities!

---

## Mục Lục

| #   | Phần                                                           |
| --- | -------------------------------------------------------------- |
| 1   | Big O Là Gì? — "Categorize, Not Exact!"                        |
| 2   | Concept #1 — "Growth with Respect to Input!"                   |
| 3   | Look for Loops — "Simplest Trick!"                             |
| 4   | Concept #2 — "Always Drop Constants!"                          |
| 5   | Practical vs Theoretical — "Insertion Sort Faster on Small N!" |
| 6   | Concept #3 — "Worst Case!"                                     |
| 7   | Common Complexities — "O(1) to O(n!)!"                         |
| 8   | Space Complexity — "The Final Frontier!"                       |
| 9   | Prime's Favorites — "Quicksort + Ring Buffer!"                 |
| 10  | Tự Implement: Big O Examples                                   |
| 11  | 🔬 Deep Analysis — Big O Cheat Sheet                           |

---

## §1. Big O Là Gì? — "Categorize, Not Exact!"

> Prime: _"Big O is the easiest way to put it — it CATEGORIZES your algorithm on time or memory based on the input. It's NOT meant to be an exact measurement."_

### Phân loại, không phải đo chính xác!

Prime: _"Someone's not gonna say your algorithm is gonna take 450 CPU units. Instead it's a GENERALIZED way to understand how your algorithm will react as your input GROWS."_

_"If someone says this is O(N), they mean your algorithm GROWS LINEARLY based on input."_

```
BIG O — WHAT IT IS:
═══════════════════════════════════════════════════════════════

  ❌ KHÔNG phải thế này:
  "Thuật toán của bạn mất 450 CPU units."
  → "CPU unit là gì? Lấy con số đó ở đâu?"

  ✅ MÀ LÀ THẾ NÀY:
  "Thuật toán của bạn là O(N) — tăng trưởng TUYẾN TÍNH."
  → Input gấp đôi → thời gian gấp đôi!
  → Input gấp 10 → thời gian gấp 10!

  "Đây là cách TỔNG QUÁT để hiểu thuật toán
   phản ứng ra sao khi input TĂNG LÊN." — Prime
```

### Tại sao dùng Big O?

Prime: _"It helps us make decisions on why you should or should not use a specific data structure."_

_"Data structures progressively make constraints to become more and more performant. But if you use them INCORRECTLY, they become massively in-performance."_

### Hiểu sâu hơn: Big O không phải là "thời gian chạy"

Đây là điểm mà rất nhiều người mới học nhầm lẫn. **Big O không đo thời gian chạy thật** (elapsed time) — nó đo **tốc độ tăng trưởng** (growth rate) của số lượng operations khi input tăng.

Tại sao phân biệt điều này quan trọng? Vì cùng một algorithm, chạy trên máy tính khác nhau sẽ cho thời gian khác nhau. Một chiếc MacBook Pro M3 chạy nhanh hơn một chiếc laptop cũ 10 năm — nhưng **Big O của algorithm vẫn giống nhau**. Big O không quan tâm máy bạn nhanh hay chậm, mà chỉ quan tâm: **khi input tăng gấp đôi, thuật toán phải làm thêm bao nhiêu công việc?**

Hãy tưởng tượng Big O như **phân loại tốc độ phương tiện giao thông**:

- O(1) = Dịch chuyển tức thì (teleport) — bất kể khoảng cách, đến ngay!
- O(log N) = Máy bay — tăng khoảng cách gấp đôi, thời gian không tăng gấp đôi
- O(N) = Xe ô tô — tăng khoảng cách gấp đôi, thời gian gấp đôi
- O(N²) = Đi bộ — tăng khoảng cách gấp đôi, thời gian gấp BỐN
- O(2ⁿ) = Bò — mỗi bước thêm mất gấp đôi bước trước 💀

Bạn không cần biết chính xác "máy bay bay bao nhiêu km/h" — bạn chỉ cần biết **loại phương tiện** để quyết định dùng cái nào cho phù hợp.

### Big O trong ngữ cảnh phỏng vấn

Khi interviewer hỏi _"Big O của giải pháp này là gì?"_, họ không hỏi bạn tính toán chính xác. Họ muốn biết bạn có **tư duy phân tích** — bạn có nhận ra algorithm của mình nhanh hay chậm không, và bạn có biết cách cải thiện không.

Prime nhấn mạnh điểm này rất rõ: Big O giúp bạn **so sánh** các giải pháp. Khi bạn nói "giải pháp A là O(N²) và giải pháp B là O(N log N)", bạn đang nói rằng **ở scale lớn**, B sẽ nhanh hơn A rất nhiều — dù có thể ở scale nhỏ, A nhanh hơn (sẽ nói ở phần Practical vs Theoretical).

---

## §2. Concept #1 — "Growth with Respect to Input!"

> Prime: _"Number ONE: growth is with respect to input. Put that in your head."_

### Mọi thứ đều relative theo input!

Prime shows function nhận string `n`:

_"Notice it's a string — it has a LENGTH and a series of characters. Strings are effectively arrays."_

_"The for loop has to execute the LENGTH of the string. If our string grows by 50%, how much slower is our function? 50%. It grows LINEARLY."_

_"For every one more unit of string, there is one more loop."_

```javascript
// O(N) — tuyến tính!
function sumCharCodes(n: string): number {
  let sum = 0;
  for (let i = 0; i < n.length; i++) {  // ← vòng lặp = N!
    sum += n.charCodeAt(i);
  }
  return sum;
}
```

```
SỰ TĂNG TRƯỞNG:
═══════════════════════════════════════════════════════════════

  Kích thước input → Thời gian:
  n = 10     → 10 lần lặp
  n = 100    → 100 lần lặp    (input ×10 = thời gian ×10!)
  n = 1000   → 1000 lần lặp   (input ×100 = thời gian ×100!)

  → O(N): tăng trưởng TUYẾN TÍNH! 📈
```

### Giải thích sâu: "with respect to input" nghĩa là gì?

Cụm từ "with respect to input" (tương ứng với input) là **chìa khoá** để hiểu Big O. Nó có nghĩa là: **ta chỉ quan tâm đến những thao tác phụ thuộc vào kích thước input**.

Hãy xem ví dụ sau:

```javascript
function doStuff(arr: number[]): number {
  let x = 5;           // O(1) — không phụ thuộc input!
  let y = x * 2;       // O(1) — không phụ thuộc input!
  console.log("hi");   // O(1) — không phụ thuộc input!

  let sum = 0;
  for (let i = 0; i < arr.length; i++) {  // O(N) — PHỤ THUỘC input!
    sum += arr[i];
  }

  return sum + x + y;  // O(1) — không phụ thuộc input!
}
```

Trong function trên, có 3 dòng O(1) trước vòng lặp và 1 dòng O(1) sau vòng lặp. Tổng là O(1 + 1 + 1 + N + 1) = O(N + 4) = **O(N)** (drop constants!).

3 dòng O(1) ở đầu không ảnh hưởng gì — dù `arr` có 10 phần tử hay 10 triệu phần tử, 3 dòng đó vẫn chạy đúng 3 lần. **Chỉ có vòng lặp mới phụ thuộc input**, vì vậy Big O của toàn bộ function là O(N).

Đây là lý do tại sao Prime nói "growth with respect to **input**" — chúng ta chỉ quan tâm đến phần nào của code **thay đổi** khi input thay đổi. Phần còn lại là constant, và constant luôn bị drop.

```
"WITH RESPECT TO INPUT":
═══════════════════════════════════════════════════════════════

  function doStuff(arr):
    x = 5                    ← O(1) — không đổi!
    y = x * 2                ← O(1) — không đổi!
    for i in arr:            ← O(N) — PHỤ THUỘC arr.length!
      sum += arr[i]
    return sum               ← O(1) — không đổi!

  Tổng: O(1 + 1 + N + 1) = O(N + 3) = O(N)!

  Quy tắc:
  → Tìm phần nào PHỤTHUỘC kích thước input!
  → Phần đó quyết định Big O!
  → Phần còn lại = constant → bỏ qua!
```

---

## §3. Look for Loops — "Simplest Trick!"

> Prime: _"Simplest trick in all of it — just LOOK FOR LOOPS. Where do you loop over the input? Easiest way to tell the Big O complexity."_

### Đếm loops = biết Big O!

Prime: _"For those who did not see that — it's not very obvious. But for me, that's O(N), and you can see it right away."_

Trick: **Đếm số lần loop qua input** → đó là Big O!

- 1 loop qua input → O(N)
- 2 loops liên tiếp → O(2N) → **drop constant** → O(N)!
- 2 loops lồng nhau → O(N²)!

### Mẹo thực tế: phân biệt loops liên tiếp vs lồng nhau

Đây là điểm mà nhiều người mới nhầm lẫn rất nhiều. Hãy nhìn kỹ sự khác biệt:

```javascript
// CÁC LOOPS LIÊN TIẾP (sequential) → O(N)!
function sequential(arr) {
  // Loop 1: duyệt toàn bộ arr
  for (let i = 0; i < arr.length; i++) {
    console.log(arr[i]);
  }
  // Loop 2: duyệt toàn bộ arr LẦN NỮA
  for (let j = 0; j < arr.length; j++) {
    console.log(arr[j]);
  }
  // Tổng: N + N = 2N → drop constant → O(N)!
}

// CÁC LOOPS LỒNG NHAU (nested) → O(N²)!
function nested(arr) {
  for (let i = 0; i < arr.length; i++) {
    // N lần
    for (let j = 0; j < arr.length; j++) {
      // × N lần
      console.log(arr[i], arr[j]); // = N² lần!
    }
  }
  // Tổng: N × N = N² → O(N²)!
}
```

**Tại sao khác nhau?** Vì loops liên tiếp là **cộng** (N + N = 2N), còn loops lồng nhau là **nhân** (N × N = N²). Ở scale lớn, 2N (linear) nhỏ hơn N² (quadratic) rất nhiều.

```
LOOPS LIÊN TIẾP vs LỒNG NHAU:
═══════════════════════════════════════════════════════════════

  Liên tiếp (sequential):
  ┌─── Loop 1: N lần ───┐  ┌─── Loop 2: N lần ───┐
  │ ████████████████████ │  │ ████████████████████ │
  └──────────────────────┘  └──────────────────────┘
  Tổng = N + N = 2N → O(N)!

  Lồng nhau (nested):
  ┌─── Loop ngoài: N lần ──────────────────────────┐
  │ ┌─── Loop trong: N lần ───┐                    │
  │ │ ████████████████████████ │  ← chạy N lần     │
  │ └─────────────────────────┘     cho MỖI i!     │
  └────────────────────────────────────────────────┘
  Tổng = N × N = N² → O(N²)!

  N = 1000:
  → Liên tiếp: 2,000 operations ✅
  → Lồng nhau: 1,000,000 operations 💀
```

Một trường hợp hay gặp: **hai loops lồng nhau nhưng trên hai input khác nhau**:

```javascript
function doStuff(arr1, arr2) {
  for (let i = 0; i < arr1.length; i++) {
    // A lần
    for (let j = 0; j < arr2.length; j++) {
      // × B lần
      // ...
    }
  }
}
// Big O: O(A × B) — KHÔNG phải O(N²)!
// Chỉ là O(N²) khi A = B = N!
```

Đây là một câu trap rất phổ biến trong phỏng vấn. Khi hai loops duyệt **hai input khác nhau**, bạn phải dùng **hai biến khác nhau** (A và B) chứ không phải N².

---

## §4. Concept #2 — "Always Drop Constants!"

> Prime: _"Second most important concept — you ALWAYS drop constants."_

### Constants không quan trọng ở scale lớn!

Prime shows function loop 2 lần:

```javascript
function sumCharCodes(n: string): number {
  let sum = 0;
  for (let i = 0; i < n.length; i++) {  // loop 1
    sum += n.charCodeAt(i);
  }
  for (let i = 0; i < n.length; i++) {  // loop 2
    sum += n.charCodeAt(i);
  }
  return sum;
}
```

Student: _"O(N)."_ → Prime: _"Okay, we got one O(N). Anything else? I was hoping someone would say O(2N)."_

**Answer**: O(2N) → **drop constant** → **O(N)**!

### Tại sao drop constants?

Prime: _"If you had 10N versus N², you'd clearly see N² gets MASSIVELY larger. It grows disproportionately fast compared to ANY constant in front of linear N."_

### Giải thích sâu: toán học đằng sau "drop constants"

Lý do "drop constants" không phải là vì constants không tồn tại — mà vì **ở scale lớn, constants trở nên vô nghĩa so với hình dạng tăng trưởng**.

Hãy so sánh 10N (linear với hệ số 10) và N² (quadratic):

```
DROP CONSTANTS — TẠI SAO:
═══════════════════════════════════════════════════════════════

  N = 10:     10N = 100        N² = 100       (bằng nhau!)
  N = 100:    10N = 1,000      N² = 10,000    (N² gấp 10!)
  N = 1,000:  10N = 10,000     N² = 1,000,000  (N² gấp 100!)
  N = 10,000: 10N = 100,000    N² = 100,000,000 (N² gấp 1000!)
  N = 100,000: 10N = 1,000,000 N² = 10,000,000,000 (gấp 10000!)

  → Ở scale lớn, constants KHÔNG QUAN TRỌNG!
  → HÌNH DẠNG tăng trưởng mới quan trọng!

  "Chúng ta không cố đo thời gian chính xác.
   Câu hỏi là: NÓ TĂNG TRƯỞNG NHƯ THẾ NÀO?" — Prime
```

Hãy nghĩ như thế này: nếu bạn có hai nhà hàng, một nhà hàng phục vụ 10 khách/giờ (10N) và một nhà hàng phục vụ theo kiểu "mỗi khách mới phải chờ tất cả khách cũ xong" (N²), thì khi chỉ có 5 khách, cả hai tương đương. Nhưng khi có 1000 khách — nhà hàng thứ hai sẽ mất **100 lần lâu hơn** so với nhà hàng đầu tiên. Constant "10" ở nhà hàng đầu không quan trọng nữa.

Đây cũng là lý do tại sao trong Big O, ta viết **O(N)** chứ không phải O(2N), O(3N), hay O(100N). Tất cả đều là **linear** — hình dạng tăng trưởng giống nhau, chỉ khác hệ số. Và hệ số đó bị "nuốt" bởi sự khác biệt về hình dạng khi N đủ lớn.

### Quy tắc mở rộng: chỉ giữ lại "bậc cao nhất"

Tương tự, khi bạn có tổng hợp nhiều bậc, chỉ giữ bậc cao nhất:

```
O(N² + N + 100) → O(N²)!

Tại sao?
N = 1000:
  N² = 1,000,000
  N  = 1,000        ← chỉ bằng 0.1% của N²!
  100 = 100          ← chỉ bằng 0.01% của N²!

→ N và 100 trở nên vô nghĩa so với N²!
→ Chỉ giữ THÀNH PHẦN LỚN NHẤT!
```

---

## §5. Practical vs Theoretical — "Insertion Sort Faster on Small N!"

> Prime: _"Practically speaking, sometimes things that are O(N²) are FASTER than O(N log N) — because your N is sufficiently small."_

### Constants DO matter in practice!

Prime: _"Just like in sorting, often it will use INSERTION SORT for smaller subsets of data. Though slower in theoretical terms (N²), it's actually FASTER than quicksort (N log N) for small datasets."_

_"Because practically speaking, the constant that is dropped is large enough that it makes REAL impact."_

### Giải thích sâu: khi lý thuyết và thực tế khác nhau

Đây là một nuance rất quan trọng mà Prime muốn bạn hiểu. Big O nói cho bạn biết **thuật toán nào thắng ở scale lớn**, nhưng nó **không nói gì** về scale nhỏ.

Tại sao? Vì Big O **bỏ qua constants**, mà ở scale nhỏ, constants lại **rất quan trọng**.

Ví dụ cụ thể:

- Quicksort: O(N log N) nhưng có overhead lớn — chọn pivot, chia mảng, gọi đệ quy. Mỗi lần gọi đệ quy có chi phí tạo stack frame.
- Insertion Sort: O(N²) nhưng rất **đơn giản** — chỉ cần so sánh và swap, không cần đệ quy, không cần chia mảng.

Khi N = 10: Insertion Sort có thể chạy trong ~50 operations, trong khi Quicksort có thể cần ~100 operations (do overhead). **N² thắng ở đây!**

Khi N = 10,000: Insertion Sort cần ~100,000,000 operations, Quicksort chỉ cần ~133,000 operations. **N log N thắng áp đảo!**

```
PRACTICAL vs THEORETICAL:
═══════════════════════════════════════════════════════════════

  LÝ THUYẾT:
  O(N²) > O(N log N) → N² luôn "tệ hơn" trên giấy!

  THỰC TẾ (N nhỏ):
  Insertion Sort (N²) với constant nhỏ
  có thể THẮNG Quicksort (N log N) với constant lớn!

  N = 10:
  Insertion Sort: 10² × c₁ = 100 × 1 = 100 ops
  Quicksort:      10 × log(10) × c₂ = 33 × 5 = 165 ops
  → Insertion Sort NHANH HƠN! 🏆

  N = 10,000:
  Insertion Sort: 10000² × 1 = 100,000,000 ops 💀
  Quicksort:      10000 × 13.3 × 5 = 665,000 ops ✅
  → Quicksort NHANH HƠN GẤP 150 LẦN!

  → Tại sao? Vì N đủ lớn để constants không còn ý nghĩa!
  → Thực tế: nhiều sorting libraries dùng HYBRID!
  → Ví dụ: Timsort (Python) = Merge Sort + Insertion Sort!
  → "Đôi khi N² nhanh hơn N log N
     cho datasets nhỏ." — Prime
```

Đây là lý do tại sao các thuật toán sắp xếp trong thực tế (như Timsort của Python/Java, hay Introsort của C++) đều là **hybrid** — chúng dùng thuật toán O(N log N) cho mảng lớn, nhưng chuyển sang Insertion Sort khi mảng nhỏ hơn một ngưỡng (thường là 16-64 phần tử).

Bài học: **Big O cho bạn bức tranh tổng quan, nhưng thực tế luôn phức tạp hơn**. Khi tối ưu hiệu suất, bạn cần xem xét cả lý thuyết (Big O) lẫn thực hành (constants, cache locality, overhead).

---

## §6. Concept #3 — "Worst Case!"

> Prime: _"Often we consider WORST CASE. In interviews, you're gonna pretty much exclusively describe worst case."_

### Early return doesn't change Big O!

```javascript
function sumCharCodes(n: string): number {
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    const charCode = n.charCodeAt(i);
    if (charCode === 69) return sum;  // Thoát sớm khi gặp 'E'!
    sum += charCode;
  }
  return sum;
}
```

Student: _"O(N)."_ → Prime: _"O(N) would be correct!"_

Prime: _"A string without a capital E — how much do you go through? ALL of it. A string with E at the end? O(N - 2). Well, that's just N — we drop constants."_

_"If it's one-half N, still just N."_

### Giải thích sâu: Best, Average, Worst Case

Khi phân tích Big O, thật ra có **ba trường hợp** cần xem xét:

1. **Best case (Ω — Omega)**: trường hợp tốt nhất. Ví dụ: string bắt đầu bằng 'E' → thoát ngay → O(1)!
2. **Average case (Θ — Theta)**: trường hợp trung bình. Ví dụ: 'E' nằm giữa string → O(N/2) → O(N).
3. **Worst case (O — Big O)**: trường hợp xấu nhất. Ví dụ: không có 'E' → duyệt hết → O(N)!

Trong phỏng vấn, **luôn luôn nói worst case**, trừ khi interviewer hỏi cụ thể. Lý do: worst case cho bạn **đảm bảo** (guarantee). Khi bạn nói "thuật toán này là O(N)", bạn đang nói: "dù input tệ đến đâu, thuật toán cũng không chậm hơn N."

```
BEST / AVERAGE / WORST CASE:
═══════════════════════════════════════════════════════════════

  function sumCharCodes(n: string):
    for mỗi ký tự:
      nếu ký tự = 'E' → thoát!
      cộng vào sum

  Input: "ELEPHANT" (E ở đầu!)
  → Best case: O(1)! Thoát ngay ký tự đầu!

  Input: "TELEPHONE" (E ở giữa!)
  → Average case: O(N/2) = O(N)! Drop constant!

  Input: "CALIFORNIA" (không có E!)
  → Worst case: O(N)! Duyệt hết cả string!

  ┌──────────────────────────────────────────────────────────┐
  │ Khi phỏng vấn: LUÔN nói WORST CASE!                     │
  │ "Chuỗi không có E → phải duyệt HẾT → O(N)!" ✅        │
  │                                                          │
  │ Nếu interviewer hỏi best case:                           │
  │ "E ở đầu → O(1)!" ✅                                    │
  └──────────────────────────────────────────────────────────┘
```

### Ba concepts tổng kết!

1. **Growth with respect to input** → nó tăng trưởng như thế nào?
2. **Constants are always dropped** → O(2N) = O(N)!
3. **Worst case** → giả sử input không có shortcut!

Đây là **bộ ba quy tắc vàng** của Big O. Nếu bạn nhớ 3 điều này, bạn đã có đủ nền tảng để phân tích Big O trong phỏng vấn. Prime nhấn mạnh: _"Long as you keep these 3 concepts, you'll do well in an interview."_

---

## §7. Common Complexities — "O(1) to O(n!)!"

> Prime: _"O(1) means constant time. Doesn't matter how big the input — same operations every time. Effectively instant."_

### Bảng common complexities!

```
CÁC COMPLEXITY PHỔ BIẾN:
═══════════════════════════════════════════════════════════════

  O(1)       → Hằng số! Thời gian không đổi dù input bao lớn!
  O(log N)   → Logarithm! Mỗi bước giảm một nửa!
  O(N)       → Tuyến tính! Tỷ lệ thuận với input!
  O(N log N) → Tuyến tính-log! Phổ biến trong sorting!
  O(N²)      → Bình phương! Loops lồng nhau!
  O(N³)      → Lập phương! Ba loops lồng! (nhân ma trận)
  O(2ⁿ)      → Mũ! Không chạy nổi trên máy tính! 😱
  O(N!)      → Giai thừa! Bài toán người bán hàng! 😱😱

  Và loại hiếm:
  O(√N)      → "Squirt of N" 😂 — Prime thích cái này!
```

### Giải thích chi tiết từng loại

**O(1) — Constant Time — Hằng số**

Đây là "thánh grail" của algorithms. O(1) có nghĩa là **dù input có 1 phần tử hay 1 tỷ phần tử, thời gian vẫn giống nhau**.

Ví dụ: truy cập phần tử bằng index trong array thật (`arr[5]`). Engine tính `base_address + 5 × 4` → lấy giá trị. Không cần duyệt, không cần tìm. Tức thì.

Lưu ý: "constant time" **không có nghĩa là nhanh** — nó có nghĩa là **không thay đổi**. Một function chạy 1000 operations mà không phụ thuộc input vẫn là O(1). Chỉ là một O(1) rất chậm.

**O(log N) — Logarithmic — Logarithm**

O(log N) xuất hiện khi **mỗi bước loại bỏ một nửa** input. Binary Search là ví dụ kinh điển: bạn có danh sách sorted, mỗi lần so sánh loại bỏ 50% options.

Logarithm là **phép toán ngược của lũy thừa**. log₂(1024) = 10, nghĩa là bạn chỉ cần 10 bước để tìm trong 1024 phần tử! 20 bước cho 1 triệu phần tử! Cực kỳ nhanh.

**O(N) — Linear— Tuyến tính**

Input gấp đôi → thời gian gấp đôi. Đơn giản, dễ hiểu. Xuất hiện khi bạn cần duyệt qua **mọi phần tử** một lần.

**O(N log N) — Linearithmic — Tuyến tính-log**

Đây là complexity "ngon nhất" cho sorting dựa trên comparison. Merge Sort và Quicksort (average case) đều là O(N log N). Có thể hiểu là: "duyệt toàn bộ input (N), nhưng mỗi phần tử chỉ cần xử lý log N lần."

**O(N²) — Quadratic — Bình phương**

Hai loops lồng nhau trên cùng input. Bubble Sort, Selection Sort, Insertion Sort đều là O(N²). Prime nói rất hay: _"N² is like computing the AREA of a square — N by N."_

**O(2ⁿ) và O(N!) — Exponential và Factorial**

Đây là "vùng chết" — các thuật toán với complexity này **không thể chạy** trên bất kỳ máy tính nào với input lớn. O(2ⁿ) xuất hiện trong brute-force recursion (ví dụ: Fibonacci đệ quy không memoization). O(N!) xuất hiện trong bài toán Travelling Salesman (TSP) — thử tất cả hoán vị.

```
BẢNG SO SÁNH (N = 1,000,000):
═══════════════════════════════════════════════════════════════

  O(1)       → 1 operation                        ✅ Tức thì!
  O(log N)   → 20 operations                      ✅ Cực nhanh!
  O(N)       → 1,000,000 operations                ✅ Ổn!
  O(N log N) → 20,000,000 operations               🟡 OK!
  O(N²)      → 1,000,000,000,000 operations        🔴 1 triệu giây!
  O(2ⁿ)      → 10^301029 operations                💀 Vũ trụ kết thúc!
  O(N!)      → ∞ ?? operations                     💀💀 Bất khả thi!
```

### Loop counting!

```javascript
// O(N²) — loops lồng nhau!
for (let i = 0; i < n.length; i++) {
  for (let j = 0; j < n.length; j++) {
    // N × N = N²!
  }
}

// O(N³) — ba loops lồng nhau!
for (let i = 0; i < n.length; i++) {
  for (let j = 0; j < n.length; j++) {
    for (let k = 0; k < n.length; k++) {
      // N × N × N = N³!
    }
  }
}
```

Prime: _"N² is like computing the AREA of a square — N by N."_

_"N³ is like multiplying matrices — painful."_

### O(N log N) — halving inside a loop!

Prime: _"For every time, you go over half the amount of space you need to search, but you search the whole space once. So N characters, then halve what you need to do."_

### O(√N) — rarest!

Prime: _"The craziest of all runtimes — I've only seen it in ONE problem. Very excited about it. √N = squirt of N."_ 😂

---

## §8. Space Complexity — "The Final Frontier!"

> Prime: _"Space, the final frontier. We're not gonna really be talking much about it. It's just less interesting."_

### Space = tăng trưởng bộ nhớ!

Prime: _"I've gotten it once or twice in an interview."_

Then jokes about React: _"People do THIS in React — which emotionally BRUISES me. So I assume people don't care about space or time sometimes."_ 😂

### Giải thích sâu: Space Complexity là gì?

Space Complexity đo lường **algorithm cần bao nhiêu bộ nhớ bổ sung** (ngoài input) để hoạt động. Lưu ý: bộ nhớ dùng để lưu **input không tính** — chỉ tính bộ nhớ **mới tạo ra**.

```
SPACE COMPLEXITY:
═══════════════════════════════════════════════════════════════

  function sum(arr):        // Space: O(1)!
    let total = 0           // 1 biến — không phụ thuộc input!
    for i in arr:
      total += arr[i]
    return total

  function double(arr):     // Space: O(N)!
    let result = []         // Mảng mới = N phần tử!
    for i in arr:
      result.push(arr[i] * 2)
    return result

  function allPairs(arr):   // Space: O(N²)!
    let pairs = []          // Mảng N² phần tử!
    for i in arr:
      for j in arr:
        pairs.push([i, j])
    return pairs

  Quy tắc:
  → Đếm bộ nhớ BỔ SUNG mà algorithm TẠO RA!
  → Không tính input ban đầu!
  → Cách đếm giống Time Complexity — đếm biến/mảng mới!
```

Tại sao Space Complexity ít được hỏi hơn? Vì trong thực tế, **bộ nhớ rẻ hơn thời gian**. Bạn có thể mua thêm RAM, nhưng không thể mua thêm thời gian cho user đang chờ response. Tuy nhiên, trong một số trường hợp nhất định (embedded systems, mobile apps, xử lý file cực lớn), Space Complexity trở nên cực kỳ quan trọng.

---

## §9. Prime's Favorites — "Quicksort + Ring Buffer!"

> Prime: _"My favorite algorithm to implement is probably QUICKSORT. Practically speaking, I think a RING BUFFER is just — it's always awesome."_

_"You can replace a ring buffer with an array list if you don't need first-in-first-out behavior. By the end of the course, you will AGREE with me."_

### Tại sao Prime chọn hai thứ này?

**Quicksort**: Đây là thuật toán sắp xếp đẹp nhất về mặt thiết kế. Nó kết hợp nhiều concept (divide-and-conquer, partitioning, recursion) và có hiệu suất thực tế tuyệt vời. Prime thích Quicksort không chỉ vì nó nhanh, mà vì **quá trình implement nó dạy bạn rất nhiều fundamental concepts**.

**Ring Buffer (Circular Buffer)**: Đây là cấu trúc dữ liệu mà Prime cho là "luôn luôn tuyệt vời." Ring Buffer giải quyết một bài toán rất phổ biến: queue (hàng đợi) với O(1) cho cả enqueue và dequeue, mà không cần allocate bộ nhớ mới. Bạn sẽ gặp nó trong network buffers, audio processing, logging systems, và rất nhiều nơi khác.

---

## §10. Tự Implement: Big O Examples

```javascript
// ═══ Ví dụ Big O ═══

// O(1) — Hằng số!
function getFirst(arr: number[]): number {
  return arr[0];  // Thời gian như nhau dù mảng bao lớn!
}

// O(N) — Tuyến tính!
function sum(arr: number[]): number {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {  // 1 loop!
    total += arr[i];
  }
  return total;
}

// O(N) — KHÔNG PHẢI O(2N)! Drop constants!
function sumTwice(arr: number[]): number {
  let sum1 = 0;
  for (let i = 0; i < arr.length; i++) sum1 += arr[i];  // loop 1
  let sum2 = 0;
  for (let i = 0; i < arr.length; i++) sum2 += arr[i];  // loop 2
  return sum1 + sum2;
  // O(2N) → drop constant → O(N)!
}

// O(N) — Worst case! (early return không giúp gì cả!)
function findE(str: string): number {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) === 69) return sum;  // Tìm thấy E!
    sum += str.charCodeAt(i);
  }
  return sum;
  // Worst case: không có E → duyệt hết → O(N)!
}

// O(N²) — Loops lồng nhau!
function allPairs(arr: number[]): number {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      count++;  // N × N = N²!
    }
  }
  return count;
}

// O(log N) — Giảm nửa mỗi bước!
function binarySearch(arr: number[], target: number): number {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    else if (arr[mid] < target) lo = mid + 1;  // bỏ nửa trái!
    else hi = mid - 1;  // bỏ nửa phải!
  }
  return -1;
  // Mỗi bước loại 50% → O(log N)!
}

// Demo
const arr = [1, 2, 3, 4, 5];
console.log("O(1):", getFirst(arr));           // tức thì!
console.log("O(N):", sum(arr));                // 5 ops
console.log("O(N) not O(2N):", sumTwice(arr)); // 10 ops → vẫn O(N)!
console.log("O(N²):", allPairs(arr));          // 25 ops (5²)!

console.log("\n✅ 3 concepts:");
console.log("  1. Tăng trưởng theo input!");
console.log("  2. Drop constants! O(2N) = O(N)!");
console.log("  3. Worst case! Early return không giúp gì!");
```

---

## §11. 🔬 Deep Analysis — Big O Cheat Sheet

```
BIG O CHEAT SHEET:
═══════════════════════════════════════════════════════════════

  MẸO: Đếm các loops!
  ┌──────────────────────────────────────────────────────────┐
  │ Không loop qua input          → O(1)                    │
  │ 1 loop, giảm nửa mỗi lần     → O(log N)                │
  │ 1 loop qua input              → O(N)                    │
  │ 1 loop + giảm nửa bên trong   → O(N log N)              │
  │ 2 loops lồng nhau qua input   → O(N²)                   │
  │ 3 loops lồng nhau             → O(N³)                   │
  └──────────────────────────────────────────────────────────┘

  3 QUY TẮC:
  ┌──────────────────────────────────────────────────────────┐
  │ 1. Tăng trưởng theo INPUT!                              │
  │ 2. LUÔN drop constants!                                  │
  │ 3. Xét WORST CASE!                                       │
  └──────────────────────────────────────────────────────────┘

  BIỂU ĐỒ (trái = nhanh, phải = chậm):
  O(1) < O(log N) < O(N) < O(N log N) < O(N²) < O(N³) < O(2ⁿ) < O(N!)
   🟢     🟢        🟡      🟡           🔴      🔴      💀      💀

  CÂU HỎI PHỎNG VẤN PHỔ BIẾN:
  ┌──────────────────────────────────────────────────────────┐
  │ Q: "Big O của function này là gì?"                       │
  │ A: Đếm loops → drop constants → worst case!             │
  │                                                          │
  │ Q: "Có thể tối ưu không?"                               │
  │ A: Giảm từ O(N²) → O(N log N) hoặc O(N)!               │
  │    Thường bằng cách dùng data structure phù hợp!         │
  │                                                          │
  │ Q: "Space complexity?"                                    │
  │ A: Đếm bộ nhớ BỔ SUNG. O(1) = in-place, O(N) = tạo    │
  │    mảng mới cùng kích thước!                             │
  └──────────────────────────────────────────────────────────┘

  "Chỉ cần nhớ 3 concepts này,
   bạn sẽ làm tốt trong phỏng vấn." — Prime 🎯
```

---

## Checklist

```
[ ] Big O = phân loại, KHÔNG PHẢI đo chính xác!
[ ] Concept 1: tăng trưởng theo INPUT!
[ ] Đếm loops = mẹo Big O đơn giản nhất!
[ ] Loops liên tiếp = cộng (O(N)), lồng nhau = nhân (O(N²))!
[ ] Concept 2: LUÔN drop constants! O(2N) = O(N)!
[ ] Giữ bậc cao nhất: O(N² + N + 100) = O(N²)!
[ ] Practical: insertion sort thắng quicksort trên N nhỏ!
[ ] Concept 3: xét WORST CASE!
[ ] Best/Average/Worst — phỏng vấn luôn hỏi worst!
[ ] Common: O(1), O(log N), O(N), O(N log N), O(N²), O(N³)!
[ ] Space complexity: đếm bộ nhớ BỔ SUNG!
[ ] Rare: O(√N) = "squirt of N" 😂!
[ ] Prime's favorites: quicksort + ring buffer!
TIẾP THEO → Phần 3: Arrays!
```
