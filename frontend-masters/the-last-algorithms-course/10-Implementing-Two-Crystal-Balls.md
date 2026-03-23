# The Last Algorithms Course You'll Need — Phần 10: Implementing Two Crystal Balls — "√N Jump, Walk Back, Walk Forward, First Try!"

> 📅 2026-03-08 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implementing Two Crystal Balls — "Math.floor(Math.sqrt(N)), jump loop, walk back, linear forward, first try!"
> Độ khó: ⭐️⭐️⭐️ | Implementation — translating √N concept to code!

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | Setup — "Math.floor(Math.sqrt(N))!"            |
| 2   | Phase 1 — "Jump √N Until Break!"               |
| 3   | Phase 2 — "Walk Back √N!"                      |
| 4   | Phase 3 — "Walk Forward √N!"                   |
| 5   | First Try! — "It Worked!"                      |
| 6   | Q: "Why Not Cube Root?" — "Jump Approaches 1!" |
| 7   | Tự Implement: Complete Two Crystal Balls       |

---

## §1. Setup — "Math.floor(Math.sqrt(N))!"

> Prime: _"Const jump amount = Math.floor(Math.sqrt(breaks.length)). Let's assume the array is big enough to have a square root."_

### Tính khoảng nhảy!

```typescript
const jumpAmount = Math.floor(Math.sqrt(breaks.length));
// √3 = 1.73... → floor → 1
// √16 = 4 → floor → 4
// √100 = 10 → floor → 10
```

### Giải thích sâu: tại sao cần Math.floor?

`Math.sqrt(N)` thường trả về số thập phân (ví dụ: √10 = 3.162...), nhưng index mảng phải là **số nguyên**. `Math.floor` làm tròn xuống — điều này đảm bảo bạn không nhảy quá xa.

Tại sao **làm tròn xuống** chứ không làm tròn lên? Vì nếu làm tròn lên, bước nhảy **lớn hơn** √N → phần walk sau khi quả cầu vỡ cũng **dài hơn** √N → worst case tệ hơn.

```
MATH.FLOOR vs MATH.CEIL:
═══════════════════════════════════════════════════════════════

  N = 10, √10 = 3.162...

  Math.floor(3.162) = 3 → nhảy 3 bước
  → Số lần nhảy: ceil(10/3) = 4
  → Walk tối đa: 3
  → Tổng: 4 + 3 = 7 ✅

  Math.ceil(3.162) = 4 → nhảy 4 bước
  → Số lần nhảy: ceil(10/4) = 3
  → Walk tối đa: 4
  → Tổng: 3 + 4 = 7 (tương đương)

  → Cả hai đều OK, nhưng floor là quy ước chuẩn!
  → Quan trọng: đừng quên floor — nhảy 3.162 bước
    sẽ gây lỗi index!
```

---

## §2. Phase 1 — "Jump √N Until Break!"

> Prime: _"We use our first crystal ball to see where does it break."_

### Quả cầu 1: nhảy tiến!

```typescript
let i = jumpAmount;
for (; i < breaks.length; i += jumpAmount) {
  if (breaks[i]) break; // Quả cầu 1 vỡ! 💥
}
```

### Giải thích sâu: phân tích code

```
PHASE 1 — PHÂN TÍCH CODE:
═══════════════════════════════════════════════════════════════

  let i = jumpAmount;
  → Bắt đầu từ vị trí √N (không phải 0!)
  → Tại sao? Vì nếu breaks[0] = true, phase 3 sẽ bắt nó!

  for (; i < breaks.length; i += jumpAmount)
  → Không khởi tạo trong for (đã khởi tạo ở trên!)
  → Nhảy √N mỗi bước
  → Dừng khi vượt quá mảng HOẶC quả cầu vỡ!

  if (breaks[i]) break;
  → Kiểm tra: "tầng i có làm quả cầu vỡ không?"
  → Nếu vỡ → DỪNG! Bỏ vào phase 2!
  → Nếu không → nhảy tiếp!

  Ví dụ: N=16, √N=4, transition ở index 12
  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
  │F │F │F │F │F │F │F │F │F │F │F │F │T │T │T │T │
  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
   0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
              ↑           ↑           ↑
             i=4         i=8        i=12 → VỠ! 💥

  3 lần nhảy → quả cầu 1 mất!
```

---

## §3. Phase 2 — "Walk Back √N!"

> Prime: _"We jump back √N."_

### Phép trừ đơn giản!

```typescript
i -= jumpAmount; // Quay lại vị trí safe cuối cùng!
```

### Giải thích sâu: tại sao quay lại?

Khi quả cầu vỡ ở vị trí `i`, bạn biết:
- **breaks[i] = TRUE** (vừa kiểm tra!)
- **breaks[i - jumpAmount] = FALSE** (đã kiểm tra lần nhảy trước!)
- → Transition nằm đâu đó **giữa** `i - jumpAmount` và `i`!

```
PHASE 2 — QUAY LẠI:
═══════════════════════════════════════════════════════════════

  Quả cầu vỡ ở i = 12, jumpAmount = 4

  i -= jumpAmount → i = 12 - 4 = 8

  Biết chắc:
  → breaks[8] = FALSE (đã kiểm tra, safe!)
  → breaks[12] = TRUE (vừa vỡ!)
  → Transition nằm trong [8, 12)!
  → Chỉ cần kiểm tra 4 vị trí: 8, 9, 10, 11!

  Đây là vùng mà quả cầu 2 sẽ "đi bộ" kiểm tra!
```

---

## §4. Phase 3 — "Walk Forward √N!"

> Prime: _"Now we linearly walk forward at most √N until we find a break."_

### Quả cầu 2: đi bộ linear!

```typescript
for (let j = 0; j < jumpAmount && i < breaks.length; j++, i++) {
  if (breaks[i]) return i; // Tìm thấy chính xác vị trí vỡ!
}
return -1; // Không tìm thấy!
```

### Giải thích sâu: hai điều kiện dừng

Loop này có **hai điều kiện** cùng lúc: `j < jumpAmount` (đi tối đa √N bước) VÀ `i < breaks.length` (không vượt quá mảng). Tại sao cần cả hai?

```
PHASE 3 — HAI ĐIỀU KIỆN:
═══════════════════════════════════════════════════════════════

  j < jumpAmount:
  → Đảm bảo chỉ đi TỐI ĐA √N bước!
  → Nếu không có điều kiện này → có thể đi quá xa!

  i < breaks.length:
  → Đảm bảo không đọc NGOÀI mảng!
  → Trường hợp: transition ở cuối mảng
    và phase 1 nhảy VƯỢT QUA cuối mảng!

  Ví dụ edge case:
  N = 10, √N = 3, transition ở index 9
  Phase 1: i=3 (safe), i=6 (safe), i=9 (VỠ!)
  Phase 2: i = 9 - 3 = 6
  Phase 3: walk 6→7→8→9 → VỠ! return 9! ✅

  Edge case 2: N = 10, √N = 3, KHÔNG có transition
  Phase 1: i=3 (safe), i=6 (safe), i=9 (safe), i=12 → OUT!
           → Loop kết thúc vì i >= breaks.length!
  Phase 2: i = 12 - 3 = 9
  Phase 3: walk 9 (safe) → hết jumpAmount → return -1! ✅
```

---

## §5. First Try! — "It Worked!"

> Prime: _"My goodness, it worked out again!"_

### Code hoàn chỉnh!

```typescript
function two_crystal_balls(breaks: boolean[]): number {
  const jumpAmount = Math.floor(Math.sqrt(breaks.length));

  // Phase 1: Nhảy √N (Quả cầu 1)
  let i = jumpAmount;
  for (; i < breaks.length; i += jumpAmount) {
    if (breaks[i]) break;
  }

  // Phase 2: Quay lại √N
  i -= jumpAmount;

  // Phase 3: Đi bộ tối đa √N (Quả cầu 2)
  for (let j = 0; j < jumpAmount && i < breaks.length; j++, i++) {
    if (breaks[i]) return i;
  }

  return -1;
}
```

### Tổng quan 3 giai đoạn

```
3 GIAI ĐOẠN — MÔ PHỎNG HOÀN CHỈNH:
═══════════════════════════════════════════════════════════════

  Mảng: [F,F,F,F,F,F,F,F,F,F,F,F,T,T,T,T]  (N=16, √N=4)

  Phase 1 — Nhảy √N (Quả cầu 1):
  [F,F,F,F,F,F,F,F,F,F,F,F,T,T,T,T]
           ↑           ↑           ↑
          i=4         i=8        i=12 → VỠ! 💥

  Phase 2 — Quay lại √N:
  i = 12 - 4 = 8

  Phase 3 — Đi bộ tối đa √N (Quả cầu 2):
  [F,F,F,F,F,F,F,F,F,F,F,F,T,T,T,T]
                   ↑→↑→↑→↑→↑
                   8  9 10 11 12 → VỠ! 💥
                   → return 12! ✅

  Tổng: 3 nhảy + 4 walk = 7 ≈ 2√16 = 8 🎯
```

### Tại sao lại "first try"?

Cũng giống binary search: Prime đã **vẽ whiteboard trước**, **viết pseudocode**, rồi mới code. Khi logic đã rõ ràng trong đầu, việc dịch sang TypeScript chỉ là **cơ học**. Mỗi phase tương ứng một đoạn code ngắn:

```
PSEUDOCODE → CODE — TỪNG PHASE:
═══════════════════════════════════════════════════════════════

  Pseudocode:                    TypeScript:
  ─────────────────              ─────────────────────────
  jumpAmount = √N                const j = Math.floor(Math.sqrt(N))
  nhảy j mỗi bước               for (; i < N; i += j)
  nếu vỡ → dừng                   if (breaks[i]) break
  quay lại j                     i -= j
  đi bộ tối đa j                for (let k=0; k<j && i<N; k++, i++)
  nếu vỡ → return               if (breaks[i]) return i
  không thấy → -1               return -1

  → 3 phases = 3 đoạn code = ~10 dòng!
  → "Thật ra không khó." — Prime
```

---

## §6. Q: "Why Not Cube Root?" — "Jump Approaches 1!"

> Student: _"Why square root and not having like before?"_
> Prime: _"If you jump to middle and ball breaks, you need to walk N/2 — that's O(N). With √N, you walk at most √N."_

> Student: _"What if we go more than square root?"_
> Prime: _"As you increase the root level, the closer you get to linear. Quad root — you're practically jumping by 1."_

### √N = điểm cân bằng tối ưu!

```
SO SÁNH CÁC ROOT (N = 10,000):
═══════════════════════════════════════════════════════════════

  Root    │ Bước nhảy │ Số lần nhảy │ Walk   │ Tổng
  ────────┼───────────┼─────────────┼────────┼─────────────
  √N      │ 100       │ 100         │ 100    │ 200 ✅ TỐI ƯU!
  ∛N      │ 21        │ 476         │ 21     │ 497
  ⁴√N     │ 10        │ 1,000       │ 10     │ 1,010
  ⁵√N     │ 6         │ 1,666       │ 6      │ 1,672

  → Root càng cao → bước nhảy càng nhỏ
  → Số lần nhảy TĂNG VỌT!
  → Tiệm cận O(N) = KHÔNG cải thiện!

  Tại sao √N tối ưu?
  → Tổng = N/J + J (J = bước nhảy)
  → Tối thiểu khi N/J = J → J² = N → J = √N!
  → Cân bằng hoàn hảo giữa nhảy và walk!

  "√N cho bước nhảy TỐI ĐA
   với walk TỐI THIỂU!" — Prime
```

---

## §7. Tự Implement: Complete Two Crystal Balls

```javascript
// ═══ Two Crystal Balls — Implementation Hoàn Chỉnh ═══

function twoCrystalBalls(breaks) {
  const jumpAmount = Math.floor(Math.sqrt(breaks.length));

  // Phase 1: Nhảy √N (Quả cầu 1)
  let i = jumpAmount;
  for (; i < breaks.length; i += jumpAmount) {
    if (breaks[i]) break;
  }

  // Phase 2: Quay lại √N
  i -= jumpAmount;

  // Phase 3: Đi bộ (Quả cầu 2)
  for (let j = 0; j < jumpAmount && i < breaks.length; j++, i++) {
    if (breaks[i]) return i;
  }

  return -1;
}

// Helper: tạo mảng test
function createBreaks(size, breakPoint) {
  const arr = new Array(size).fill(false);
  for (let i = breakPoint; i < size; i++) arr[i] = true;
  return arr;
}

// Tests
console.log("═══ TWO CRYSTAL BALLS ═══\n");

const tests = [
  { size: 16, breakAt: 12, desc: "giữa mảng" },
  { size: 100, breakAt: 37, desc: "vị trí bất kỳ" },
  { size: 100, breakAt: 0, desc: "vỡ ngay đầu" },
  { size: 100, breakAt: 99, desc: "vỡ ở cuối" },
  { size: 100, breakAt: -1, desc: "không bao giờ vỡ" },
  { size: 1, breakAt: 0, desc: "mảng 1 phần tử" },
];

tests.forEach(({ size, breakAt, desc }) => {
  const breaks =
    breakAt >= 0 ? createBreaks(size, breakAt) : new Array(size).fill(false);
  const result = twoCrystalBalls(breaks);
  const expected = breakAt >= 0 ? breakAt : -1;
  const pass = result === expected;
  console.log(
    `${desc}: size=${size}, break=${breakAt}, ` +
    `got=${result} ${pass ? "✅" : "❌"}`
  );
});

// So sánh hiệu suất
console.log("\n═══ SO SÁNH ═══\n");
[100, 10000, 1000000, 100000000].forEach((size) => {
  const sqrt = Math.round(Math.sqrt(size)) * 2;
  console.log(
    `N = ${size.toLocaleString().padStart(13)}: ` +
    `Linear = ${size.toLocaleString().padStart(13)}, ` +
    `√N = ${sqrt.toLocaleString().padStart(7)} bước 🚀`
  );
});
```

---

## Checklist

```
[ ] Math.floor(Math.sqrt(N)) = khoảng nhảy!
[ ] Math.floor vì index phải là số nguyên!
[ ] Phase 1: nhảy √N mỗi bước (Quả cầu 1)!
[ ] Phase 2: quay lại √N (về vị trí safe cuối)!
[ ] Phase 3: đi bộ tối đa √N (Quả cầu 2)!
[ ] Hai điều kiện phase 3: j < jumpAmount VÀ i < length!
[ ] Return index hoặc -1 (sentinel)!
[ ] 3 phases = ~10 dòng code!
[ ] First try pass! ✅
[ ] √N tối ưu: cân bằng N/J + J → J = √N!
[ ] Root cao hơn → nhảy nhỏ hơn → nhiều nhảy hơn → tiệm cận O(N)!
TIẾP THEO → Phần 11: Bubble Sort!
```
