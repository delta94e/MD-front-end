# The Last Algorithms Course You'll Need — Phần 9: Two Crystal Balls Problem — "√N Jump, Sub-Linear, The Interviewer Didn't Know!"

> 📅 2026-03-08 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Two Crystal Balls Problem — "Linear fails, binary fails, √N jump = O(√N), interviewer didn't know the answer!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Interview — classic problem, creative thinking, sub-linear search!

---

## Mục Lục

| #   | Phần                                                   |
| --- | ------------------------------------------------------ |
| 1   | The Problem — "100 Storey Building, 2 Balls!"          |
| 2   | Generalized — "Array of Falses Then Trues!"            |
| 3   | Linear Search? — "Didn't Use Our Constraint!"          |
| 4   | Binary Search? — "Ball Breaks, Walk N/2 = Still O(N)!" |
| 5   | √N Jump! — "The Breakthrough!"                         |
| 6   | Q: "Why Not Cube Root?" — "Approaches N!"              |
| 7   | Interview Story — "The Interviewer Didn't Know!"       |
| 8   | Tự Implement: Two Crystal Balls                        |
| 9   | 🔬 Deep Analysis — Why √N Is Optimal                   |

---

## §1. The Problem — "100 Storey Building, 2 Balls!"

> Prime: _"Given 2 crystal balls that will break if dropped from a high enough distance, determine the EXACT SPOT in which they'll break in the MOST OPTIMIZED way."_

### Bài toán phỏng vấn kinh điển!

Prime: _"This was an interview question at my first job. I also had it in computational theory class."_

_"Often you'll hear: you're in a 100 storey building, 2 crystal balls, find out which floor they break."_

### Giải thích sâu: hiểu rõ bài toán

Hãy tưởng tượng bạn đứng trước toà nhà 100 tầng, tay cầm 2 quả cầu thuỷ tinh. Quả cầu có một đặc tính: nếu thả từ tầng **thấp hơn một giới hạn nào đó**, nó không vỡ. Nhưng từ tầng **giới hạn trở lên**, nó **luôn vỡ**. Bạn cần tìm **đúng tầng giới hạn** đó.

Nhưng đây là constraint quan trọng: **bạn chỉ có 2 quả cầu!** Mỗi lần quả cầu vỡ, bạn mất nó vĩnh viễn. Nếu cả hai đều vỡ mà chưa tìm ra đáp án → bạn thua.

```
BÀI TOÁN HAI QUẢ CẦU THUỶ TINH:
═══════════════════════════════════════════════════════════════

  Toà nhà 100 tầng:

   Tầng 100  ← vỡ!
   Tầng 99   ← vỡ!
   ...
   Tầng 73   ← VỠ! ← đây là tầng giới hạn! (cần tìm!)
   Tầng 72   ← không vỡ!
   Tầng 71   ← không vỡ!
   ...
   Tầng 1    ← không vỡ!

  Constraint:
  → Chỉ có 2 quả cầu!
  → Khi quả cầu vỡ → MẤT VĨNH VIỄN!
  → Cần tìm tầng 73 với ÍT BƯỚC NHẤT!
```

Tại sao bài toán này thú vị? Vì nó **loại bỏ** cả hai phương pháp phổ biến nhất:
- Linear search **hoạt động** nhưng **không tận dụng** constraint 2 quả cầu
- Binary search **thất bại** vì khi quả cầu vỡ ở giữa, bạn chỉ còn 1 quả

Bạn buộc phải **sáng tạo** — và đó là lý do nó xuất hiện trong phỏng vấn!

---

## §2. Generalized — "Array of Falses Then Trues!"

> Prime: _"When you really think about it, it's an array full of FALSES that at some point becomes TRUE and from there on out, it's true."_

### Phiên bản tổng quát!

Prime không dừng ở bài toán "toà nhà" — ông ấy **tổng quát hoá** ngay:

```
TỔNG QUÁT HOÁ — MẢNG BOOLEAN:
═══════════════════════════════════════════════════════════════

  Toà nhà 100 tầng:
  Tầng:   1  2  3  ...  72  73  74  ... 100
  Vỡ?:    F  F  F  ...  F   T   T   ...  T

  Tổng quát → mảng boolean:
  [F, F, F, F, F, F, F, T, T, T, T, T, T]
                        ↑
                   Tìm điểm này!

  Trước điểm này: tất cả FALSE (không vỡ!)
  Sau điểm này: tất cả TRUE (vỡ!)

  Constraint: chỉ có 2 lần "nhìn" vào TRUE!
  (= 2 quả cầu, mỗi lần chạm TRUE = quả cầu vỡ!)
```

Tại sao tổng quát hoá quan trọng? Vì khi bạn chuyển từ "toà nhà + quả cầu" sang "mảng boolean", bạn nhận ra đây **không chỉ là bài toán về toà nhà** — đây là bài toán về **tìm điểm chuyển đổi** (transition point) trong dữ liệu sorted, với constraint **giới hạn số lần "phá huỷ"**. Pattern này xuất hiện trong nhiều bài toán thực tế khác.

### Ứng dụng thực tế của pattern này

Bài toán "tìm transition point với limited destructive tests" xuất hiện ở nhiều nơi:

```
ỨNG DỤNG THỰC TẾ:
═══════════════════════════════════════════════════════════════

  1. Kiểm tra tải (Load Testing):
     → Server chịu được bao nhiêu requests/giây?
     → Mỗi lần test quá tải = server crash = "quả cầu vỡ"!
     → Chỉ muốn crash TỐI THIỂU lần!

  2. Kiểm tra vật liệu (Material Testing):
     → Cáp chịu được bao nhiêu kg?
     → Mỗi lần đứt = mất mẫu = "quả cầu vỡ"!

  3. Tìm version gây bug (Git Bisect):
     → Commit nào đầu tiên gây bug?
     → Mảng: [OK, OK, OK, BUG, BUG, BUG]
     → Binary search! (nhưng nếu test tốn kém thì sao?)

  → Pattern chung: tìm transition point với
    constraint giới hạn số lần kiểm tra!
```

---

## §3. Linear Search? — "Didn't Use Our Constraint!"

> Prime: _"If we start at 0 and linearly walk, yes we will find it. But we're given a constraint — 2 crystal balls — and we didn't even USE it."_

### Linear = O(N), bỏ qua constraint 2 quả cầu!

```javascript
// Linear: O(N) — hoạt động nhưng lãng phí!
for (let i = 0; i < breaks.length; i++) {
  if (breaks[i]) return i; // tìm thấy!
}
// Chỉ dùng 1 quả cầu! Lãng phí quả còn lại!
```

### Giải thích sâu: tại sao linear search "tệ" ở đây?

Linear search **hoạt động đúng** — nó sẽ tìm ra đáp án. Nhưng vấn đề là: bạn được cho **2 quả cầu** mà chỉ dùng **1**. Trong algorithms, khi bạn không tận dụng constraint, bạn đang **bỏ phí thông tin** có thể giúp tối ưu.

```
LINEAR SEARCH — BỎ PHÍ CONSTRAINT:
═══════════════════════════════════════════════════════════════

  [F, F, F, F, F, F, F, T, T, T, T, T]
   ↑→ ↑→ ↑→ ↑→ ↑→ ↑→ ↑→ ↑  BREAK!
   1  2  3  4  5  6  7  8  ← 8 bước!

  Chỉ dùng 1 quả cầu!
  Quả thứ 2 nằm yên không làm gì! 🤷‍♂️

  Vấn đề:
  → Nếu mảng có 1 triệu phần tử → 1 triệu bước!
  → Bạn có 2 quả cầu nhưng hành xử như có 1!
  → Trong phỏng vấn, interviewer sẽ nói:
     "Tốt, nhưng bạn có thể làm TỐT HƠN không?"
```

Đây là bài học quan trọng trong phỏng vấn: **luôn đọc kỹ constraints**. Nếu đề bài cho bạn thêm thông tin (2 balls, sorted array, v.v.), đó là **gợi ý** rằng bạn cần tận dụng nó.

---

## §4. Binary Search? — "Ball Breaks, Walk N/2 = Still O(N)!"

> Prime: _"We jump to the middle — hey Xi, are you true? YES. What just happened? One of our 2 crystal balls just BROKE."_

### Binary search THẤT BẠI ở đây!

Nếu quả cầu 1 vỡ ở midpoint → chỉ còn 1 quả → phải **linear walk** từ điểm safe cuối cùng!

Walk N/2 → drop constant → **O(N)!** 😤

### Giải thích sâu: tại sao binary search thất bại?

Trong binary search bình thường, khi bạn kiểm tra midpoint và phát hiện nó lớn hơn needle, bạn **bỏ nửa phải** và tiếp tục binary search nửa trái. Nhưng ở đây, kiểm tra midpoint = **thả quả cầu**. Nếu nó vỡ (TRUE), bạn **mất** quả cầu đó!

Giờ bạn chỉ còn 1 quả cầu. Với 1 quả cầu, bạn **không thể binary search nữa** — vì nếu nó cũng vỡ, bạn hết quả cầu và không biết đáp án. Bạn buộc phải **linear walk** từ điểm safe cuối cùng.

```
BINARY SEARCH THẤT BẠI — TẠI SAO:
═══════════════════════════════════════════════════════════════

  Mảng 100 phần tử, transition ở index 73:
  [F F F F F F ... F F T T T ... T T T]
                       ↑73

  Bước 1: Nhảy đến giữa (index 50)
  → breaks[50] = FALSE → safe! Quả cầu 1 không vỡ! ✅

  Bước 2: Nhảy đến giữa nửa phải (index 75)
  → breaks[75] = TRUE → VỠ! 💥 Quả cầu 1 mất!

  Giờ: chỉ còn 1 quả cầu!
  → Biết: transition nằm giữa index 50 và 75
  → Nhưng PHẢI linear walk từ 51 → 52 → 53 → ... → 73!
  → Walk 23 bước!

  Worst case: transition ở gần đầu:
  Bước 1: mid = 50 → VỠ! 💥
  → Walk từ 0 → 1 → 2 → ... → 49
  → Walk N/2 = 50 bước!

  Drop constant: O(N/2) = O(N) 😤

  "CẢ HAI cách tìm kiếm đều TỆ.
   Không cách nào hoạt động." — Prime
```

Điểm mấu chốt: binary search chia mảng theo **tỷ lệ N** (N/2, N/4, N/8...). Khi quả cầu vỡ, phần phải linear walk cũng theo **tỷ lệ N**. Và bất cứ thứ gì tỷ lệ N → sau khi drop constants → vẫn là O(N).

→ **Cần nhảy theo đơn vị KHÔNG tỷ lệ N!**

---

## §5. √N Jump! — "The Breakthrough!"

> Prime: _"We have to jump in such a way that ISN'T some portion of N. We need to jump by a FUNDAMENTALLY DIFFERENT unit."_

### Nhảy theo √N!

Prime: _"We jump √N, √N, √N... until it breaks. Walk back √N, then walk forward √N."_

### Giải thích sâu: tại sao √N là "bước nhảy thần kỳ"?

Đây là **insight cốt lõi** của bài toán, và cũng là lý do nó xuất hiện trong phỏng vấn — nó kiểm tra khả năng **tư duy sáng tạo** của bạn.

Vấn đề với mọi cách nhảy "tỷ lệ N" (N/2, N/10, N/100...): khi quả cầu vỡ, bạn phải linear walk một đoạn cũng **tỷ lệ N** → O(N).

Giải pháp: nhảy theo đơn vị **hoàn toàn khác** — √N. Tại sao √N hiệu quả?

```
√N — PHÂN TÍCH CHI TIẾT:
═══════════════════════════════════════════════════════════════

  Giai đoạn 1 — NHẢY (Quả cầu 1):
  → Nhảy √N, √N, √N... cho đến khi quả cầu vỡ!
  → Tối đa bao nhiêu lần nhảy? N / √N = √N lần!
  → Chi phí: √N bước!

  Giai đoạn 2 — ĐI BỘ (Quả cầu 2):
  → Quay lại vị trí safe cuối cùng!
  → Linear walk tối đa √N bước (khoảng cách giữa 2 lần nhảy!)
  → Chi phí: √N bước!

  Tổng worst case: √N + √N = 2√N → O(√N)! 🎉

  VÍ DỤ: Mảng 100 phần tử, √100 = 10
  ┌──────────────────────────────────────────────────────────┐
  │ Nhảy đến 10 → safe ✅                                   │
  │ Nhảy đến 20 → safe ✅                                   │
  │ Nhảy đến 30 → VỠ! 💥 (quả cầu 1 mất!)                 │
  │                                                          │
  │ → Transition nằm giữa 20 và 30!                        │
  │ → Walk từ 21 → 22 → 23 → ... → 27 → VỠ! 💥           │
  │ → Đáp án: index 27!                                     │
  │                                                          │
  │ Tổng: 3 nhảy + 7 walk = 10 bước = √100 ✅             │
  └──────────────────────────────────────────────────────────┘
```

### Trực quan hoá toàn bộ quá trình

```
MÔ PHỎNG TRÊN MẢNG 36 PHẦN TỬ (√36 = 6):
═══════════════════════════════════════════════════════════════

  [F F F F F F | F F F F F F | F F F F F F | F T T T T T | T T T T T T | T T T T T T]
   0         5   6        11  12        17  18        23  24        29  30        35
              ↑              ↑              ↑              ↑
          Nhảy 1         Nhảy 2         Nhảy 3         Nhảy 4

  Transition ở index 19. √36 = 6.

  GIAI ĐOẠN 1 — NHẢY (Quả cầu 1):
  Nhảy 1: index 6  → F → safe ✅
  Nhảy 2: index 12 → F → safe ✅
  Nhảy 3: index 18 → F → safe ✅
  Nhảy 4: index 24 → T → VỠ! 💥 (quả cầu 1 mất!)

  → Transition nằm trong [18, 24)!

  GIAI ĐOẠN 2 — ĐI BỘ (Quả cầu 2):
  Walk: index 18 → F → safe ✅
  Walk: index 19 → T → VỠ! 💥 Tìm thấy!

  Tổng: 4 nhảy + 2 walk = 6 bước!
  √36 = 6 → đúng! ✅

  So sánh:
  Linear: 19 bước (duyệt 0→19)!
  Binary: mid=18 → safe, mid=27 → VỠ! → walk 18→19 = OK
          nhưng worst case vẫn O(N)!
  √N: tối đa 6 + 6 = 12 bước! Sub-linear! 🚀
```

### Tại sao "fundamentally different unit"?

Prime dùng cụm từ này rất chính xác. "Portion of N" (phần của N) có nghĩa là N/k với k là hằng số — ví dụ N/2, N/10, N/100. Tất cả đều **tỷ lệ thuận N** → O(N).

√N **không phải** portion of N — nó là **căn bậc hai** của N, tăng trưởng **chậm hơn** N. Khi N gấp 4, √N chỉ gấp 2. Khi N gấp 100, √N chỉ gấp 10. Đó là lý do nó "fundamentally different."

```
PORTION vs FUNDAMENTALLY DIFFERENT:
═══════════════════════════════════════════════════════════════

  N = 1,000,000:
  N/2   = 500,000    (portion of N → O(N)!)
  N/10  = 100,000    (portion of N → O(N)!)
  N/100 = 10,000     (portion of N → O(N)!)
  √N    = 1,000      (fundamentally different → O(√N)!)

  N = 100,000,000:
  N/2   = 50,000,000
  N/10  = 10,000,000
  √N    = 10,000     ← nhỏ hơn NHIỀU!

  → Portions of N tăng tuyến tính với N!
  → √N tăng CHẬM hơn N rất nhiều!
  → Đó là "fundamentally different"!
```

---

## §6. Q: "Why Not Cube Root?" — "Approaches N!"

> Student: _"Can we do cube root?"_
> Prime: _"Cube root is SMALLER than square root. Your jumps become progressively smaller. As you increase the root level, the closer you get to a LINEAR run."_

### Root cao hơn → tệ hơn!

### Giải thích sâu: tại sao root cao hơn chậm hơn?

Đây là câu hỏi rất tự nhiên: "nếu √N hiệu quả hơn portion of N, tại sao không dùng ∛N (cube root) cho bước nhảy NHỎ HƠN nữa?"

Sai lầm ở đây: **bước nhảy nhỏ hơn KHÔNG tốt hơn**. Hãy nhớ: tổng chi phí = **số lần nhảy + số bước walk**. Bước nhảy nhỏ → walk ngắn hơn → TƯỞNG tốt. Nhưng bước nhảy nhỏ → **nhảy NHIỀU LẦN hơn** → tổng nhảy lớn!

```
SO SÁNH CÁC ROOT:
═══════════════════════════════════════════════════════════════

  N = 1,000,000:

  √N (square root):
  → Bước nhảy: √1,000,000 = 1,000
  → Số lần nhảy: 1,000,000 / 1,000 = 1,000
  → Walk tối đa: 1,000
  → Tổng: 1,000 + 1,000 = 2,000 ← O(√N) ✅

  ∛N (cube root):
  → Bước nhảy: ∛1,000,000 = 100
  → Số lần nhảy: 1,000,000 / 100 = 10,000
  → Walk tối đa: 100
  → Tổng: 10,000 + 100 = 10,100 ← O(N/∛N) > O(√N)! 😤

  ⁴√N (fourth root):
  → Bước nhảy: ⁴√1,000,000 ≈ 31
  → Số lần nhảy: 1,000,000 / 31 ≈ 32,258
  → Walk tối đa: 31
  → Tổng: 32,258 + 31 ≈ 32,289 ← gần O(N)! 😤😤

  CÂN BẰNG:
  ┌──────────────────────────────────────────────────────────┐
  │ Root    │ Bước nhảy │ Số lần nhảy │ Walk  │ Tổng       │
  │─────────┼───────────┼─────────────┼───────┼────────────│
  │ √N      │ 1,000     │ 1,000       │ 1,000 │ 2,000 ✅  │
  │ ∛N      │ 100       │ 10,000      │ 100   │ 10,100    │
  │ ⁴√N     │ 31        │ 32,258      │ 31    │ 32,289    │
  │ ⁵√N     │ 15        │ 63,096      │ 15    │ 63,111    │
  └──────────────────────────────────────────────────────────┘

  → Root càng cao → bước nhảy càng nhỏ
    → số lần nhảy TĂNG VỌT → tiệm cận O(N)!
  → √N là điểm CÂN BẰNG TỐI ƯU giữa nhảy và walk!
```

√N tối ưu vì nó **cân bằng** hai chi phí: **số lần nhảy** (N/J) và **số bước walk** (J). Khi J = √N, cả hai đều bằng √N → tổng = 2√N → nhỏ nhất có thể!

---

## §7. Interview Story — "The Interviewer Didn't Know!"

> Prime: _"During the interview, the interviewer did NOT know the generalized answer. When I said it, they said 'that's not the answer.' I said 'it IS the answer, and here's why.' It was so exciting."_

### Thêm một thủ thuật trong túi!

Prime: _"I love these tricks — they expand my mind to use in other areas. It's always good to have one more trick inside the bag."_

### Giải thích sâu: bài học từ câu chuyện phỏng vấn

Câu chuyện này chứa nhiều bài học quý:

**1. Interviewer không phải lúc nào cũng đúng.** Prime đưa ra đáp án đúng (tổng quát hoá + √N), nhưng interviewer bảo "sai" vì họ chỉ biết đáp án cụ thể cho "100 tầng." Điều này cho thấy: đôi khi bạn biết nhiều hơn interviewer, và bạn cần **tự tin bảo vệ đáp án** bằng logic chặt chẽ.

**2. "Tổng quát hoá" = sức mạnh.** Bài toán "100 tầng + 2 balls" có nhiều đáp án cụ thể (optimal là 14 tầng cho 100). Nhưng khi Prime tổng quát thành N tầng + 2 balls, đáp án √N áp dụng cho **mọi N** — mạnh hơn nhiều.

**3. "One more trick in the bag."** Prime nhấn mạnh giá trị của việc **tích luỹ patterns**. √N jump không chỉ dùng cho bài toán quả cầu — nó là pattern tổng quát cho "tìm transition point với limited destructive tests."

```
BÀI HỌC PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  1. Interviewer nói "sai" ≠ bạn sai!
     → Bảo vệ đáp án bằng chứng minh toán học!
     → "Đây LÀ đáp án, và đây là LÝ DO." — Prime

  2. Tổng quát hoá = điểm cộng LỚN!
     → Interviewer hỏi "100 tầng"
     → Bạn trả lời "N tầng, √N bước"
     → Thể hiện tư duy thuật toán THỰC SỰ!

  3. Tích luỹ tricks!
     → Linear search: O(N) — luôn hoạt động!
     → Binary search: O(log N) — cần sorted!
     → √N jump: O(√N) — giới hạn destructive tests!
     → Mỗi trick = thêm CÔNG CỤ trong hộp đồ nghề!

  "Tôi yêu những tricks này — chúng mở rộng
   tư duy để tôi dùng ở nơi khác." — Prime
```

---

## §8. Tự Implement: Two Crystal Balls

```javascript
// ═══ Two Crystal Balls — Implementation ═══

function twoCrystalBalls(breaks) {
  const n = breaks.length;
  const jump = Math.floor(Math.sqrt(n));

  // Giai đoạn 1: NHẢY √N mỗi bước (Quả cầu 1!)
  let i = jump;
  while (i < n) {
    if (breaks[i]) break;  // VỠ! 💥
    i += jump;
  }

  // Nếu nhảy hết mảng mà không vỡ → không có transition!
  // (edge case: kiểm tra phần cuối)

  // Giai đoạn 2: Quay lại vị trí safe cuối
  i -= jump;

  // Giai đoạn 3: LINEAR WALK (Quả cầu 2!)
  for (let j = 0; j <= jump && i < n; j++, i++) {
    if (breaks[i]) return i;  // TÌM THẤY! 🎯
  }

  return -1;  // không tìm thấy!
}

// Demo
console.log("═══ TWO CRYSTAL BALLS ═══\n");

// Test 1: transition ở giữa
const n1 = 25;
const bp1 = 17;
const breaks1 = new Array(n1).fill(false);
for (let i = bp1; i < n1; i++) breaks1[i] = true;
console.log(`Mảng ${n1} phần tử, transition ở ${bp1}:`);
console.log(`Kết quả: ${twoCrystalBalls(breaks1)} ✅\n`);

// Test 2: transition ở đầu
const breaks2 = new Array(10).fill(true);
console.log(`Mảng 10 phần tử, transition ở 0:`);
console.log(`Kết quả: ${twoCrystalBalls(breaks2)} ✅\n`);

// Test 3: không có transition
const breaks3 = new Array(10).fill(false);
console.log(`Mảng 10 phần tử, không có transition:`);
console.log(`Kết quả: ${twoCrystalBalls(breaks3)} (= -1 ✅)\n`);

// So sánh hiệu suất
console.log("═══ SO SÁNH ═══\n");
const sizes = [100, 10000, 1000000, 100000000];
sizes.forEach((size) => {
  const linear = size;
  const binary = size / 2; // worst case khi ball vỡ ở giữa
  const sqrtN = Math.round(Math.sqrt(size)) * 2; // 2√N
  console.log(
    `N = ${size.toLocaleString().padStart(13)}: ` +
    `Linear = ${linear.toLocaleString().padStart(13)}, ` +
    `Binary = ${Math.round(binary).toLocaleString().padStart(13)}, ` +
    `√N = ${sqrtN.toLocaleString().padStart(7)} 🚀`
  );
});
```

---

## §9. 🔬 Deep Analysis — Why √N Is Optimal

### Chứng minh toán học: tại sao √N tối ưu?

```
CHỨNG MINH √N TỐI ƯU:
═══════════════════════════════════════════════════════════════

  Gọi J = kích thước bước nhảy!

  Khi nhảy theo J:
  → Worst case số lần nhảy: N/J (nhảy hết mảng!)
  → Worst case linear walk: J (walk hết một khoảng!)
  → Tổng chi phí: f(J) = N/J + J

  Tối ưu: tìm J sao cho f(J) NHỎ NHẤT!

  Lấy đạo hàm: f'(J) = -N/J² + 1
  Đặt f'(J) = 0:
  → -N/J² + 1 = 0
  → J² = N
  → J = √N! 🎯

  Kiểm tra: f(√N) = N/√N + √N = √N + √N = 2√N ✅

  Kiểm tra đạo hàm bậc 2: f''(J) = 2N/J³ > 0
  → Đây là điểm CỰC TIỂU (minimum)! ✅
```

### Bảng tổng kết

```
TỔNG KẾT — BA PHƯƠNG PHÁP:
═══════════════════════════════════════════════════════════════

  Phương pháp     │ Big O    │ Quả cầu │  N=1M bước  │ Nhận xét
  ─────────────────┼──────────┼─────────┼─────────────┼────────────
  Linear Search   │ O(N)     │ Dùng 1  │ 1,000,000   │ Lãng phí!
  Binary Search   │ O(N)*    │ Dùng 2  │ 500,000     │ Walk N/2!
  √N Jump Search  │ O(√N)   │ Dùng 2  │ 2,000       │ Tối ưu! 🎯

  * Binary search bình thường là O(log N), nhưng khi có
    constraint "chỉ 2 lần chạm TRUE", nó degrade thành O(N)!

  PATTERN NHỚ:
  ┌──────────────────────────────────────────────────────────┐
  │ → Nếu mỗi bước KHÔNG phá huỷ: binary search = O(log N)│
  │ → Nếu mỗi bước CÓ THỂ phá huỷ (limited): √N = O(√N)! │
  │ → Constraint thay đổi HOÀN TOÀN thuật toán tối ưu!     │
  └──────────────────────────────────────────────────────────┘

  "Bạn có thêm MỘT TRICK trong túi đồ nghề." — Prime
```

---

## Checklist

```
[ ] Bài toán: 2 quả cầu, tìm transition point trong mảng boolean sorted!
[ ] Tổng quát: mảng [F, F, ..., F, T, T, ..., T] → tìm T đầu tiên!
[ ] Linear: O(N) — không tận dụng constraint 2 quả cầu!
[ ] Binary: quả cầu vỡ ở mid → walk N/2 → vẫn O(N)!
[ ] Insight: phải nhảy theo đơn vị KHÔNG tỷ lệ N!
[ ] √N jump: giai đoạn 1 nhảy √N, giai đoạn 2 walk √N!
[ ] Tổng: 2√N → O(√N)! Sub-linear! 🎉
[ ] Tại sao √N tối ưu: tối thiểu hoá N/J + J → J = √N!
[ ] Cube root: nhảy nhỏ hơn → nhảy NHIỀU hơn → tiệm cận O(N)!
[ ] Câu chuyện: interviewer không biết đáp án tổng quát!
[ ] Bảo vệ đáp án bằng chứng minh logic!
[ ] Pattern: constraint phá huỷ → √N thay vì log N!
[ ] "Thêm một trick trong túi đồ nghề!" — Prime
TIẾP THEO → Phần 10: Implementing Two Crystal Balls!
```
