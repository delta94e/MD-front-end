# 🔄 Rotate an Array — GfG (Easy-Medium)

> 📖 Code: [Rotate Array.js](./Rotate%20Array.js)

```mermaid
graph TD
    A["🔄 Rotate Array Right by d"] --> B{"Approach?"}
    B --> C["One-by-One O(n×d)"]
    B --> D["Temp Array O(n) space"]
    B --> E["Juggling O(n) phức tạp"]
    B --> F["Reversal Algorithm O(n) ⭐"]

    F --> F1["d = d % n"]
    F1 --> F2["reverse ALL"]
    F2 --> F3["reverse 0..d-1"]
    F3 --> F4["reverse d..n-1"]
    F4 --> F5["✅ Done! O(n), O(1)"]

    style F fill:#4CAF50,color:white
    style F5 fill:#FF5722,color:white
```

```mermaid
graph LR
    subgraph "Reversal Algorithm — 3 bước"
        R1["reverse ALL"] --> R2["reverse 0..d-1"] --> R3["reverse d..n-1"]
    end

    subgraph "Complexity so sánh"
        A1["One-by-One: O(n×d), O(1)"]
        A2["Temp Array: O(n), O(n)"]
        A3["Juggling: O(n), O(1) phức tạp"]
        A4["Reversal: O(n), O(1) ⭐"]
    end
```

---

## R — Repeat & Clarify

🧠 _"Rotate right d bước = d phần tử CUỐI chuyển lên ĐẦU. Reversal Algorithm = reverse 3 lần = O(n), O(1)!"_

> 🎙️ _"Right rotate array by d positions: last d elements move to the front, remaining shift right. Left rotate is the opposite."_

### Clarification Questions

```
Q: Right rotate hay Left rotate?
A: Cả hai! Right: cuối → đầu. Left: đầu → cuối

Q: Nếu d > n?
A: d = d % n (rotate n lần = quay về vị trí cũ!)

Q: In-place?
A: Reversal Algorithm = in-place O(1) space ✅

Q: Negative d?
A: Right rotate -d = Left rotate d (và ngược lại)

Q: Mảng rỗng hoặc 1 phần tử?
A: Trả về nguyên mảng (rotation vô nghĩa)
```

### Tại sao bài này quan trọng?

```
  Rotation là BÀI KINH ĐIỂN cho in-place array manipulation!

  BẠN PHẢI hiểu:
  1. Reversal Algorithm: "reverse 3 lần" — trick đẹp nhất trong arrays
  2. Cyclic replacement (Juggling): hiểu GCD và permutation cycles
  3. Mối liên hệ Left ↔ Right rotation
  4. Reverse() là BUILDING BLOCK cho nhiều thuật toán khác

  Bài này liên kết đến:
  ┌──────────────────────────────────────────────────────────┐
  │  Array Reverse (#344)     → foundation (reverse helper)  │
  │  Rotate Array (#189)      → LeetCode classic             │
  │  Rotate String (#796)     → string version               │
  │  Rotate Image (#48)       → 2D matrix version            │
  │  Multiple Rotations       → modular indexing (read-only) │
  │  Circular Buffer          → ring buffer applications     │
  └──────────────────────────────────────────────────────────┘
```

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

### Rotation = Cắt rồi DÁN LẠI

```
  Tưởng tượng mảng như 1 CUỘN GIẤY:

  RIGHT rotate d = 2:
    [1, 2, 3, 4, | 5, 6]
     ──── A ────   ─ B ─

    Cắt tại vị trí (n - d) = 4:
      Phần A = [1, 2, 3, 4]   (n - d phần tử đầu)
      Phần B = [5, 6]          (d phần tử cuối)

    Dán B lên TRƯỚC A:
      [5, 6, | 1, 2, 3, 4]  ✅
       ─ B ─   ──── A ────

  LEFT rotate d = 2:
    [1, 2, | 3, 4, 5, 6]
     ─ A ─   ──── B ────

    Cắt tại vị trí d = 2:
      Phần A = [1, 2]          (d phần tử đầu)
      Phần B = [3, 4, 5, 6]   (n - d phần tử cuối)

    Dán B lên TRƯỚC A:
      [3, 4, 5, 6, | 1, 2]  ✅
       ──── B ────   ─ A ─

  💡 KEY INSIGHT:
     Rotation = CẮT mảng thành 2 phần rồi ĐỔI CHỖ!
     Bài toán: làm cách nào đổi chỗ IN-PLACE, O(1) space?
```

### Left vs Right — Mối quan hệ ĐỐI XỨNG

```
  ┌───────────────────────────────────────────────────────────┐
  │  Right rotate d  =  Left rotate (n - d)                   │
  │  Left rotate d   =  Right rotate (n - d)                  │
  │                                                           │
  │  Ví dụ: arr = [1, 2, 3, 4, 5, 6], n = 6                 │
  │                                                           │
  │  Right rotate 2 = [5, 6, 1, 2, 3, 4]                    │
  │  Left rotate 4  = [5, 6, 1, 2, 3, 4]  ← CÙNG KẾT QUẢ! │
  │                                                           │
  │  Vì: Right 2 = Left (6 - 2) = Left 4 ✅                  │
  └───────────────────────────────────────────────────────────┘

  → Chỉ cần implement 1 hướng, suy ra hướng kia!
  → LeetCode #189 hỏi Right → nếu thuộc Left, gọi Left(n-d)!
```

### Tại sao Reversal Algorithm ĐÚNG? — Chứng minh TRỰC GIÁC

```
  Bài toán: đổi chỗ 2 khối A và B → [A, B] thành [B, A]

  💡 Nhận xét thiên tài:
    Nếu ta REVERSE toàn bộ → [A, B] trở thành [B', A']
    (B' = B đảo ngược, A' = A đảo ngược)

    Bây giờ B' đã ở ĐÚNG VỊ TRÍ (phía trước), nhưng bị ĐẢO!
    → Reverse B' → B (khôi phục lại)
    → Reverse A' → A (khôi phục lại)
    → Kết quả: [B, A] ✅

  CHỨNG MINH bằng ví dụ:
    arr = [1, 2, 3, 4, 5, 6], right rotate d = 2
    A = [1, 2, 3, 4], B = [5, 6]

    Step 1: Reverse ALL → [6, 5, 4, 3, 2, 1]
            = [B', A'] = [6, 5 | 4, 3, 2, 1]
                          ─B'─   ────A'────

    Step 2: Reverse B' (0..d-1) → [5, 6, 4, 3, 2, 1]
            = [B, A'] = [5, 6 | 4, 3, 2, 1]
                         ─B─   ────A'────

    Step 3: Reverse A' (d..n-1) → [5, 6, 1, 2, 3, 4]
            = [B, A] ✅

  🧠 Bản chất TOÁN HỌC:
    reverse(reverse(X)) = X   ← reverse 2 lần = trở về ban đầu!

    [A, B] → reverse → [B'A'] → reverse B' → [BA'] → reverse A' → [BA] ✅

    Viết dạng công thức:
    rev([A, B]) = [rev(B), rev(A)]       ← tính chất reverse
    rev(rev(B)) = B                      ← tự triệt tiêu
    rev(rev(A)) = A
    → Kết quả: [B, A]
```

```mermaid
graph LR
    S0["[A, B]"] -->|"① reverse ALL"| S1["[B', A']"]
    S1 -->|"② reverse B'"| S2["[B, A']"]
    S2 -->|"③ reverse A'"| S3["[B, A] ✅"]

    style S0 fill:#2196F3,color:white
    style S1 fill:#FF9800,color:white
    style S2 fill:#FF9800,color:white
    style S3 fill:#4CAF50,color:white
```

### Tại sao LEFT rotate thứ tự NGƯỢC?

```
  RIGHT rotate: reverse ALL → reverse đầu → reverse cuối
  LEFT rotate:  reverse đầu → reverse cuối → reverse ALL

  🧠 Tại sao?

  RIGHT: Muốn [A, B] → [B, A]
    B ở CUỐI, cần lên ĐẦU
    Reverse ALL đẩy B lên đầu (nhưng bị đảo) → fix B → fix A

  LEFT: Muốn [A, B] → [B, A]  (A ở đầu, B ở cuối)
    Reverse A trước → [A', B]
    Reverse B trước → [A', B']
    Reverse ALL → [B, A] ✅

    Hoặc hiểu: LEFT rotate d = RIGHT rotate (n - d)
    → Chạy RIGHT rotate với d' = n - d → cùng reversal algorithm!

  📌 NHỚ:
    RIGHT: "đảo TẤT CẢ trước, sửa TỪNG PHẦN sau"
    LEFT:  "đảo TỪNG PHẦN trước, đảo TẤT CẢ sau"
    → Thứ tự NGƯỢC NHAU! Cả 2 đều 3 lần reverse.
```

---

## 🧭 Luồng Suy Nghĩ — Từ đọc đề đến solution

> 💡 Phần này dạy bạn **CÁCH TƯ DUY** để tự giải bài, không chỉ biết đáp án.

### Bước 1: Đọc đề → Gạch chân KEYWORDS

```
  Đề bài: "Right rotate an array by d positions. In-place."

  Gạch chân:
    "rotate"    → circular, phần tử cuối → đầu (hoặc ngược lại)
    "by d"      → d bước, cần xử lý d > n
    "in-place"  → O(1) space → KHÔNG dùng mảng phụ!

  🧠 Tự hỏi: "Rotate = gì?"
    Right: mỗi phần tử dịch PHẢI 1 vị trí, phần tử cuối → đầu
    Lặp d lần → d phần tử cuối → đầu

  📌 Kỹ năng chuyển giao:
    "in-place" + "rearrange" → phải dùng SWAP hoặc REVERSE
    → Không được tạo mảng mới!
```

### Bước 2: Vẽ ví dụ → Tìm PATTERN

```
  arr = [1, 2, 3, 4, 5, 6], d = 2

  Right rotate 1 lần: [6, 1, 2, 3, 4, 5]  ← 6 lên đầu
  Right rotate 2 lần: [5, 6, 1, 2, 3, 4]  ← 5 lên đầu

  🧠 Quan sát:
    Phần cuối [5, 6] → lên đầu, GIỮ THỨ TỰ!
    Phần đầu [1, 2, 3, 4] → xuống cuối, GIỮ THỨ TỰ!

    → Rotation = ĐỔI CHỖ 2 khối A và B!
    → Bài toán = in-place block swap!
```

### Bước 3: Brute Force → Optimize

```
  Brute force: lặp d lần, mỗi lần dịch 1 bước
    → 1 bước = shift n phần tử → O(n)
    → d bước → O(n × d) → nếu d = n/2 → O(n²)!

  Optimize 1: dùng mảng phụ
    → Copy 2 phần vào đúng vị trí → O(n) time + O(n) space
    → Tốt hơn, nhưng tốn space!

  Optimize 2: Reversal Algorithm!
    → 3 lần reverse = 3 × O(n) = O(n) time, O(1) space!
    → ĐÚNG insight: "reverse ALL, fix từng phần"

  📌 Kỹ năng chuyển giao:
    Khi cần ĐỔI CHỖ 2 block trong mảng IN-PLACE:
    → Nghĩ ngay: REVERSAL ALGORITHM!
    → "Đảo tất cả, sửa từng phần"
```

### Bước 4: Cây quyết định — Khi nào dùng approach nào?

```mermaid
graph TD
    Q["Rotate array?"] --> Q1{"Modify mảng OK?"}
    Q1 -->|No| M["Modular Index O(n), read-only"]
    Q1 -->|Yes| Q2{"Space constraint?"}
    Q2 -->|"O(n) OK"| T["Temp Array — đơn giản nhất"]
    Q2 -->|"O(1) only"| Q3{"Ưu tiên gì?"}
    Q3 -->|"Đơn giản"| R["Reversal Algorithm ⭐"]
    Q3 -->|"Hiểu sâu"| J["Juggling — cycle decomposition"]

    style R fill:#4CAF50,color:white
    style M fill:#2196F3,color:white
```

---

## E — Examples

```
RIGHT ROTATE by d = 2:
  arr = [1, 2, 3, 4, 5, 6]

  Step 1: [6, 1, 2, 3, 4, 5]    ← 6 lên đầu
  Step 2: [5, 6, 1, 2, 3, 4]    ← 5 lên đầu

  Kết quả: [5, 6, 1, 2, 3, 4] ✅

  Nhận xét:
    2 phần tử CUỐI [5, 6] → lên ĐẦU
    4 phần tử ĐẦU [1, 2, 3, 4] → xuống CUỐI

LEFT ROTATE by d = 2:
  arr = [1, 2, 3, 4, 5, 6]

  Step 1: [2, 3, 4, 5, 6, 1]    ← 1 xuống cuối
  Step 2: [3, 4, 5, 6, 1, 2]    ← 2 xuống cuối

  Kết quả: [3, 4, 5, 6, 1, 2] ✅

d > n:
  arr = [1, 2, 3], d = 4
  d % n = 4 % 3 = 1 → rotate 1 lần
  [3, 1, 2] ✅
```

### Minh họa trực quan — Reversal Algorithm

```
  arr = [1, 2, 3, 4, 5, 6], RIGHT rotate d = 2

  ┌─── TRƯỚC ──────────────────────────────────────────┐
  │  [1, 2, 3, 4, | 5, 6]                              │
  │   ──── A ────    ─ B ─                             │
  │   (n-d = 4)     (d = 2)                            │
  └────────────────────────────────────────────────────┘

  ┌─── Step 1: Reverse ALL ────────────────────────────┐
  │  [1, 2, 3, 4, 5, 6]  →  [6, 5, 4, 3, 2, 1]       │
  │   ←─────────────→       ←─────────────→           │
  │                          ─B'─  ────A'────          │
  │  B' (2 phần tử đầu) = [6, 5] = reverse của [5, 6] │
  │  A' (4 phần tử cuối) = [4, 3, 2, 1] = reverse A   │
  └────────────────────────────────────────────────────┘

  ┌─── Step 2: Reverse 0..d-1 (fix B') ────────────────┐
  │  [6, 5, | 4, 3, 2, 1]  →  [5, 6, | 4, 3, 2, 1]   │
  │   ↕  ↕                     ─ B ─                   │
  │  B' → B ✅  (khôi phục thứ tự gốc)                │
  └────────────────────────────────────────────────────┘

  ┌─── Step 3: Reverse d..n-1 (fix A') ────────────────┐
  │  [5, 6, | 4, 3, 2, 1]  →  [5, 6, | 1, 2, 3, 4]   │
  │           ↕        ↕                ──── A ────     │
  │              ↕  ↕                                   │
  │  A' → A ✅  (khôi phục thứ tự gốc)                │
  └────────────────────────────────────────────────────┘

  Kết quả: [5, 6, 1, 2, 3, 4] = [B, A] ✅
```

---

## A — Approach

### Approach 1: Rotate One by One — O(n × d)

```
  Ý tưởng: Lặp d lần, mỗi lần dồn MỌI phần tử sang phải 1 ô

  ┌──────────────────────────────────────────────────────────┐
  │  Mỗi iteration:                                          │
  │    1. Lưu phần tử CUỐI (last = arr[n-1])                │
  │    2. Shift TẤT CẢ sang PHẢI 1 ô (n-1 phép gán)        │
  │    3. Đặt last vào ĐẦU (arr[0] = last)                  │
  │                                                          │
  │  Lặp d lần → tổng: d × n phép gán                       │
  │                                                          │
  │  Time: O(n × d) → worst case d = n/2 → O(n²/2)         │
  │  Space: O(1)                                             │
  │                                                          │
  │  ⚠️ Chỉ dùng khi d RẤT NHỎ (d = 1 hoặc 2)             │
  │     Khi d lớn → QUÁ CHẬM!                               │
  └──────────────────────────────────────────────────────────┘
```

### Approach 2: Temporary Array — O(n) time, O(n) space

```
  💡 Ý tưởng: dùng mảng phụ, copy 2 phần vào đúng vị trí!

  Right rotate d:
    temp[0..d-1]   = arr[n-d..n-1]     ← d phần tử cuối → đầu temp
    temp[d..n-1]   = arr[0..n-d-1]     ← n-d phần tử đầu → cuối temp
    arr = temp                          ← copy ngược lại

  Trace: arr = [1, 2, 3, 4, 5, 6], d = 2

    temp[0] = arr[4] = 5    ← cuối → đầu
    temp[1] = arr[5] = 6
    temp[2] = arr[0] = 1    ← đầu → cuối
    temp[3] = arr[1] = 2
    temp[4] = arr[2] = 3
    temp[5] = arr[3] = 4

    temp = [5, 6, 1, 2, 3, 4] ✅

  Time: O(n)    Space: O(n)
  → Nhanh nhưng TỐN memory! Interviewer sẽ hỏi "O(1) space?"
```

### Approach 3: Juggling Algorithm — O(n) time, O(1) space

```
  💡 Ý tưởng: Chia mảng thành gcd(n, d) CYCLES (chu trình)
     Mỗi cycle: di chuyển phần tử theo bước d, tạo "vòng tròn"

  🧠 Tại sao gcd(n, d)?

    Khi di chuyển phần tử từ index i → (i + d) % n → ((i + d) + d) % n ...
    → Cuối cùng sẽ QUAY LẠI index i!
    → Số phần tử trong 1 cycle = n / gcd(n, d)
    → Số cycles = gcd(n, d)

  Ví dụ: n = 6, d = 2, gcd(6, 2) = 2 → 2 cycles, mỗi cycle 3 phần tử

    Cycle 0: index 0 → 2 → 4 → 0    (3 phần tử)
    Cycle 1: index 1 → 3 → 5 → 1    (3 phần tử)

  Ví dụ: n = 6, d = 4, gcd(6, 4) = 2 → 2 cycles

    Cycle 0: index 0 → 4 → 2 → 0
    Cycle 1: index 1 → 5 → 3 → 1

  ⚠️ Đặc biệt: n = 5, d = 2, gcd(5, 2) = 1 → 1 cycle duy nhất!
    Cycle 0: 0 → 2 → 4 → 1 → 3 → 0  (tất cả 5 phần tử!)
```

```mermaid
graph LR
    subgraph "n=6, d=2: 2 cycles"
        C0["Cycle 0: 0→2→4→0"]
        C1["Cycle 1: 1→3→5→1"]
    end

    subgraph "n=5, d=2: 1 cycle"
        C2["Cycle 0: 0→2→4→1→3→0"]
    end

    style C0 fill:#4CAF50,color:white
    style C1 fill:#FF9800,color:white
    style C2 fill:#2196F3,color:white
```

```
  Trace Juggling: arr = [1, 2, 3, 4, 5, 6], d = 2 (LEFT rotate)

  gcd(6, 2) = 2 → 2 cycles

  ┌─── Cycle 0 (start = 0) ──────────────────────────────┐
  │  currIdx = 0, currEle = arr[0] = 1                    │
  │                                                        │
  │  → nextIdx = (0+2)%6 = 2                              │
  │    arr[2] = 1, currEle = 3, currIdx = 2               │
  │    arr: [1, 2, 1, 4, 5, 6]                            │
  │                                                        │
  │  → nextIdx = (2+2)%6 = 4                              │
  │    arr[4] = 3, currEle = 5, currIdx = 4               │
  │    arr: [1, 2, 1, 4, 3, 6]                            │
  │                                                        │
  │  → nextIdx = (4+2)%6 = 0 ← QUAY VỀ start!           │
  │    arr[0] = 5, currEle = 1, currIdx = 0               │
  │    arr: [5, 2, 1, 4, 3, 6]                            │
  │                                                        │
  │  currIdx == 0 == start → DỪNG cycle 0!                │
  │  Đã di chuyển: 0→2→4→0 (3 phần tử)                   │
  └────────────────────────────────────────────────────────┘

  ┌─── Cycle 1 (start = 1) ──────────────────────────────┐
  │  currIdx = 1, currEle = arr[1] = 2                    │
  │                                                        │
  │  → nextIdx = (1+2)%6 = 3                              │
  │    arr[3] = 2, currEle = 4, currIdx = 3               │
  │                                                        │
  │  → nextIdx = (3+2)%6 = 5                              │
  │    arr[5] = 4, currEle = 6, currIdx = 5               │
  │                                                        │
  │  → nextIdx = (5+2)%6 = 1 ← QUAY VỀ start!           │
  │    arr[1] = 6, currIdx = 1                            │
  │                                                        │
  │  DỪNG cycle 1!                                        │
  │  Đã di chuyển: 1→3→5→1 (3 phần tử)                   │
  └────────────────────────────────────────────────────────┘

  Kết quả: [5, 6, 1, 4, 3, 6] → SAI?
  ⚠️ LƯU Ý: Trace ở trên là LEFT rotate!
  Nếu muốn LEFT rotate: arr[nextIdx] = currEle → đẩy TIẾN d bước
  Kết quả: [3, 4, 5, 6, 1, 2] ✅

  📌 Juggling ĐÚNG nhưng KHÓ implement và dễ bug!
     → Ưu tiên Reversal Algorithm trong phỏng vấn!
```

### Approach 4: Reversal Algorithm — O(n) time, O(1) space ✅

```
  💡 REVERSE 3 LẦN! Đơn giản + hiệu quả!

  RIGHT ROTATE by d:
    Step 1: Reverse TOÀN BỘ mảng       [0..n-1]
    Step 2: Reverse d phần tử ĐẦU      [0..d-1]
    Step 3: Reverse n-d phần tử CUỐI   [d..n-1]

  LEFT ROTATE by d:
    Step 1: Reverse d phần tử ĐẦU      [0..d-1]
    Step 2: Reverse n-d phần tử CUỐI   [d..n-1]
    Step 3: Reverse TOÀN BỘ mảng       [0..n-1]
    (hoặc: right rotate by n-d!)

  ┌──────────────────────────────────────────────────────┐
  │  Time: O(n)   → 3 × O(n/2) swaps = O(n)            │
  │  Space: O(1)  → chỉ dùng biến tạm cho swap         │
  │  Code: ~15 dòng → ĐƠN GIẢN NHẤT!                   │
  │  Correct: chứng minh bằng reverse(reverse(X)) = X    │
  └──────────────────────────────────────────────────────┘

  📌 Đếm CHÍNH XÁC số swap:
    Step 1: ⌊n/2⌋ swaps
    Step 2: ⌊d/2⌋ swaps
    Step 3: ⌊(n-d)/2⌋ swaps
    Tổng = ⌊n/2⌋ + ⌊d/2⌋ + ⌊(n-d)/2⌋ ≈ n swaps total
```

---

## C — Code

### Solution 1: Rotate One by One — O(n × d)

```javascript
function rotateOneByOne(arr, d) {
  const n = arr.length;
  d %= n;

  for (let i = 0; i < d; i++) {
    const last = arr[n - 1]; // Lưu phần tử cuối
    for (let j = n - 1; j > 0; j--) {
      arr[j] = arr[j - 1]; // Dồn phải 1 ô
    }
    arr[0] = last; // Đặt cuối lên đầu
  }
}
```

```
  📝 Line-by-line:

  Line 3: d %= n
    → Normalize d, xử lý d > n
    → d = 14, n = 6 → d = 14 % 6 = 2

  Line 5: for (let i = 0; i < d; i++)
    → Lặp d lần, mỗi lần rotate 1 bước

  Line 6: const last = arr[n - 1]
    → Lưu phần tử CUỐI trước khi bị ghi đè

  Line 7-9: for (j = n-1; j > 0; j--) arr[j] = arr[j-1]
    → Shift TẤT CẢ sang PHẢI 1 ô
    → Duyệt NGƯỢC từ cuối → đầu (tránh ghi đè)
    ⚠️ Nếu duyệt XUÔI: arr[1] = arr[0] → mất arr[1] → SAI!

  Line 10: arr[0] = last
    → Đặt phần tử cuối (đã lưu) vào ĐẦU
```

### Solution 2: Temporary Array — O(n) space

```javascript
function rotateTemp(arr, d) {
  const n = arr.length;
  d %= n;

  const temp = new Array(n);

  // Copy d phần tử CUỐI → đầu temp
  for (let i = 0; i < d; i++) {
    temp[i] = arr[n - d + i];
  }

  // Copy n-d phần tử ĐẦU → cuối temp
  for (let i = 0; i < n - d; i++) {
    temp[i + d] = arr[i];
  }

  // Copy temp → arr
  for (let i = 0; i < n; i++) {
    arr[i] = temp[i];
  }
}
```

```
  📝 Line-by-line:

  Line 8-10: temp[i] = arr[n - d + i]
    → Copy d phần tử CUỐI của arr vào ĐẦU temp
    → d = 2, n = 6:
      i=0: temp[0] = arr[4] = 5
      i=1: temp[1] = arr[5] = 6

    🧠 Tại sao n - d + i?
      Phần tử cuối bắt đầu từ index (n - d) = 4
      i chạy từ 0 → d-1: lần lượt lấy arr[4], arr[5]

  Line 13-15: temp[i + d] = arr[i]
    → Copy n-d phần tử ĐẦU của arr vào CUỐI temp
    → Bắt đầu ghi từ temp[d] = temp[2]
      i=0: temp[2] = arr[0] = 1
      i=1: temp[3] = arr[1] = 2
      i=2: temp[4] = arr[2] = 3
      i=3: temp[5] = arr[3] = 4
```

### Solution 3: Reversal Algorithm — O(n), O(1) ✅

```javascript
function rotateRight(arr, d) {
  const n = arr.length;
  if (n === 0) return;
  d %= n;
  if (d === 0) return;

  // 3 lần reverse!
  reverse(arr, 0, n - 1); // Reverse toàn bộ
  reverse(arr, 0, d - 1); // Reverse d phần tử đầu
  reverse(arr, d, n - 1); // Reverse n-d phần tử cuối
}

function rotateLeft(arr, d) {
  const n = arr.length;
  if (n === 0) return;
  d %= n;
  if (d === 0) return;

  reverse(arr, 0, d - 1); // Reverse d phần tử đầu
  reverse(arr, d, n - 1); // Reverse n-d phần tử cuối
  reverse(arr, 0, n - 1); // Reverse toàn bộ
}

function reverse(arr, start, end) {
  while (start < end) {
    [arr[start], arr[end]] = [arr[end], arr[start]];
    start++;
    end--;
  }
}
```

```
  📝 Line-by-line:

  Line 3-5: Guard clauses
    → n === 0: mảng rỗng → return
    → d === 0: không rotate → return
    → d %= n: normalize (d > n → d nhỏ hơn)

    ⚠️ PHẢI normalize TRƯỚC khi check d === 0!
       Vì d = n → d %= n = 0 → skip! (full cycle = no-op)

  Line 8-10: 3 lần reverse (RIGHT rotate)
    → reverse(0, n-1): đảo TOÀN BỘ
    → reverse(0, d-1): fix d phần tử ĐẦU
    → reverse(d, n-1): fix n-d phần tử CUỐI

    🧠 Boundary analysis:
      d = 2, n = 6:
        reverse(0, 5)  → đảo index 0↔5, 1↔4, 2↔3
        reverse(0, 1)  → đảo index 0↔1
        reverse(2, 5)  → đảo index 2↔5, 3↔4

  Line 25-29: reverse helper
    → Two-pointer: start từ đầu, end từ cuối
    → Swap rồi thu hẹp: start++, end--
    → Dừng khi start >= end (gặp nhau hoặc vượt qua)

    ⚠️ Điều kiện: start < end (KHÔNG PHẢI start <= end!)
       Khi start == end: 1 phần tử → đã ở vị trí đúng → không swap
```

### Solution 4: Juggling Algorithm — O(n), O(1)

```javascript
function rotateJuggling(arr, d) {
  const n = arr.length;
  d %= n;

  const cycles = gcd(n, d);

  for (let i = 0; i < cycles; i++) {
    let currIdx = i;
    let currEle = arr[currIdx];

    do {
      const nextIdx = (currIdx + d) % n;
      const nextEle = arr[nextIdx];
      arr[nextIdx] = currEle;
      currEle = nextEle;
      currIdx = nextIdx;
    } while (currIdx !== i);
  }
}

function gcd(a, b) {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}
```

```
  📝 Line-by-line:

  Line 5: const cycles = gcd(n, d)
    → Số chu trình = GCD(n, d)
    → GCD(6, 2) = 2 → 2 chu trình
    → GCD(5, 2) = 1 → 1 chu trình (tất cả phần tử trong 1 vòng!)

    🧠 Tại sao GCD?
      Từ index i, nhảy d bước: i → (i+d)%n → (i+2d)%n → ...
      Số bước để QUAY LẠI i = n / gcd(n, d)
      Mỗi cycle xử lý n/gcd(n,d) phần tử
      Tổng phần tử = gcd(n,d) × n/gcd(n,d) = n ✅ (mọi phần tử!)

  Line 10-16: do...while loop
    → Duyệt 1 cycle: bắt đầu từ i, nhảy d bước mỗi lần
    → Lưu phần tử hiện tại (currEle), đặt vào vị trí tiếp
    → "Domino effect": mỗi phần tử đẩy phần tử tiếp theo

    ⚠️ Dùng do...while (KHÔNG phải while):
       → Phải chạy ít nhất 1 lần trước khi kiểm tra!
       → while(currIdx !== i) sẽ skip ngay vì ban đầu currIdx = i!

  Line 21-24: Euclidean GCD
    → gcd(6, 2): [6,2] → [2,0] → return 2
    → gcd(5, 2): [5,2] → [2,1] → [1,0] → return 1
```

### Trace RIGHT Rotate: [1, 2, 3, 4, 5, 6], d = 2

```
  d = 2 % 6 = 2

  Step 1: reverse(0, 5) — reverse toàn bộ
    [1, 2, 3, 4, 5, 6] → [6, 5, 4, 3, 2, 1]
     ↕              ↕      swap(1,6)
        ↕        ↕          swap(2,5)
           ↕  ↕              swap(3,4)

  Step 2: reverse(0, 1) — reverse 2 phần tử đầu
    [6, 5, 4, 3, 2, 1] → [5, 6, 4, 3, 2, 1]
     ↕  ↕                  swap(6,5)

  Step 3: reverse(2, 5) — reverse 4 phần tử cuối
    [5, 6, 4, 3, 2, 1] → [5, 6, 1, 2, 3, 4]
           ↕        ↕      swap(4,1)
              ↕  ↕          swap(3,2)

  Kết quả: [5, 6, 1, 2, 3, 4] ✅
```

### Trace LEFT Rotate: [1, 2, 3, 4, 5, 6], d = 2

```
  d = 2 % 6 = 2

  Step 1: reverse(0, 1) — reverse 2 phần tử đầu
    [1, 2, 3, 4, 5, 6] → [2, 1, 3, 4, 5, 6]
     ↕  ↕

  Step 2: reverse(2, 5) — reverse 4 phần tử cuối
    [2, 1, 3, 4, 5, 6] → [2, 1, 6, 5, 4, 3]
           ↕        ↕
              ↕  ↕

  Step 3: reverse(0, 5) — reverse toàn bộ
    [2, 1, 6, 5, 4, 3] → [3, 4, 5, 6, 1, 2]
     ↕              ↕
        ↕        ↕
           ↕  ↕

  Kết quả: [3, 4, 5, 6, 1, 2] ✅

  🧠 Verify: Left rotate 2 = Right rotate (6 - 2) = Right rotate 4
  Right rotate 4 of [1,2,3,4,5,6]:
    4 phần tử cuối [3,4,5,6] lên đầu → [3,4,5,6,1,2] ✅ MATCH!
```

> 🎙️ _"The Reversal Algorithm is the most elegant: three in-place reverses achieve the rotation in O(n) time and O(1) space. First reverse all, then reverse the first d elements, then the rest."_

---

## ❌ Common Mistakes — Lỗi thường gặp

### Mistake 1: Quên normalize d = d % n

```javascript
// ❌ SAI: d = 8, n = 6 → reverse(0, 7) → OUT OF BOUNDS!
function rotateRightBad(arr, d) {
  reverse(arr, 0, arr.length - 1);
  reverse(arr, 0, d - 1); // ← d = 8 → reverse(0, 7) → CRASH!
  reverse(arr, d, arr.length - 1);
}

// ✅ ĐÚNG: normalize d TRƯỚC!
d %= n;
if (d === 0) return; // full cycle → no-op
```

### Mistake 2: Nhầm thứ tự reverse giữa Left và Right

```javascript
// ❌ SAI: dùng thứ tự RIGHT cho LEFT rotate!
function rotateLeftBad(arr, d) {
  d %= arr.length;
  reverse(arr, 0, arr.length - 1); // ← SAI! Đây là RIGHT!
  reverse(arr, 0, d - 1);
  reverse(arr, d, arr.length - 1);
}

// ✅ ĐÚNG cho LEFT:
// Đảo từng phần TRƯỚC, đảo tất cả SAU
reverse(arr, 0, d - 1);
reverse(arr, d, n - 1);
reverse(arr, 0, n - 1);
```

```
  🧠 Cách nhớ:
  ┌──────────────────────────────────────────────────────┐
  │  RIGHT: "đảo TẤT CẢ trước" → ALL, đầu, cuối        │
  │  LEFT:  "đảo TẤT CẢ sau"   → đầu, cuối, ALL        │
  │                                                      │
  │  Hoặc: LEFT d = RIGHT (n - d)                        │
  │  → Chỉ cần NHỚ 1 cái, suy ra cái kia!              │
  └──────────────────────────────────────────────────────┘
```

### Mistake 3: Reverse helper dùng <= thay vì <

```javascript
// ❌ SAI: start <= end → swap phần tử giữa 2 lần!
function reverseBad(arr, start, end) {
  while (start <= end) {
    // ← Khi start == end: swap chính nó → vô hại NHƯNG thừa!
    [arr[start], arr[end]] = [arr[end], arr[start]];
    start++;
    end--;
  }
  // → Khi n chẵn: start vượt end → end < start → vòng for không chạy thêm
  // → Khi n lẻ: start == end → swap chính nó → 1 swap thừa
  // → Kết quả VẪN ĐÚNG, nhưng thừa 1 iteration
}

// ✅ CHUẨN: start < end
function reverse(arr, start, end) {
  while (start < end) {
    [arr[start], arr[end]] = [arr[end], arr[start]];
    start++;
    end--;
  }
}
```

### Mistake 4: Shift sai hướng trong One-by-One

```javascript
// ❌ SAI: duyệt XUÔI → ghi đè giá trị chưa đọc!
for (let j = 0; j < n - 1; j++) {
  arr[j] = arr[j + 1]; // ← arr[1] bị ghi đè TRƯỚC khi arr[2] đọc nó!
}
// → Đây thực ra là LEFT shift, KHÔNG phải RIGHT!

// ✅ ĐÚNG cho RIGHT shift: duyệt NGƯỢC!
for (let j = n - 1; j > 0; j--) {
  arr[j] = arr[j - 1]; // ← đọc j-1 TRƯỚC khi nó bị ghi đè ở bước sau
}
```

```
  🧠 Quy tắc shift:
  ┌──────────────────────────────────────────────────┐
  │  Shift RIGHT → duyệt NGƯỢC (phải → trái)        │
  │    arr[n-1] = arr[n-2]  (đọc n-2 TRƯỚC)         │
  │    arr[n-2] = arr[n-3]  (n-2 đã saved ở bước trên)│
  │    ...                                            │
  │                                                   │
  │  Shift LEFT → duyệt XUÔI (trái → phải)          │
  │    arr[0] = arr[1]  (đọc 1 TRƯỚC)               │
  │    arr[1] = arr[2]  (1 đã saved ở bước trên)    │
  │    ...                                            │
  └──────────────────────────────────────────────────┘
```

### Mistake 5: Nhầm Left và Right rotation

```
  ⚠️ Rất dễ nhầm! Hãy LUÔN verify bằng ví dụ nhỏ!

  arr = [1, 2, 3, 4, 5]

  RIGHT rotate 1: phần tử CUỐI lên ĐẦU → [5, 1, 2, 3, 4]
  LEFT  rotate 1: phần tử ĐẦU xuống CUỐI→ [2, 3, 4, 5, 1]

  📌 Mnemonics:
    RIGHT: phần tử di chuyển sang PHẢI → cuối "tràn" lên đầu
    LEFT:  phần tử di chuyển sang TRÁI → đầu "tràn" xuống cuối

    Hoặc: nghĩ về CONVEYOR BELT (băng chuyền):
    RIGHT: băng chuyền chạy sang PHẢI → hàng cuối rơi xuống đầu
    LEFT:  băng chuyền chạy sang TRÁI → hàng đầu rơi xuống cuối
```

---

## O — Optimize

```
                     Time       Space     Ghi chú
  ─────────────────────────────────────────────────
  One by One         O(n × d)   O(1)      Chậm! O(n²) worst case
  Temp Array         O(n)       O(n)      Tốn memory
  Juggling           O(n)       O(1)      Phức tạp, dễ bug
  Reversal ✅        O(n)       O(1)      BEST! Đơn giản + nhanh

  ⚠️ Edge cases:
    d = 0 hoặc d = n → không cần rotate!
    d > n → d = d % n
    n = 0 hoặc n = 1 → return ngay
```

### So sánh chi tiết trong phỏng vấn

```
  ┌──────────────────────────────────────────────────────────────┐
  │ Approach        │ Khi nào dùng?                              │
  ├──────────────────────────────────────────────────────────────┤
  │ One by One      │ KHÔNG BAO GIỜ! Chỉ để explain brute force│
  │ Temp Array      │ Khi space KHÔNG là constraint              │
  │ Juggling        │ Khi hỏi "explain cycle decomposition"     │
  │ Reversal ⭐     │ MẶC ĐỊNH! Simple + optimal                │
  ├──────────────────────────────────────────────────────────────┤
  │ Modular Index   │ Khi MULTIPLE queries + read-only           │
  │ (Multiple Rot)  │ → Xem bài Multiple Left Rotations!        │
  └──────────────────────────────────────────────────────────────┘

  📌 Phỏng vấn: Bắt đầu bằng brute force → explain tại sao chậm
     → Đề xuất Reversal → code → explain tại sao đúng!
```

### Reversal vs Juggling — Trade-offs thực tế

```
  ┌──────────────────────────────────────────────────────────────┐
  │  REVERSAL                    │  JUGGLING                     │
  ├──────────────────────────────┼───────────────────────────────┤
  │  3 passes qua data          │  1 pass qua data              │
  │  Cache: 3 sequential scans  │  Cache: jumping by d bước     │
  │  Code: 15 dòng              │  Code: 25+ dòng               │
  │  Bug: rất ít                │  Bug: dễ sai do-while/gcd     │
  │  Swaps: ~n tổng             │  Swaps: chính xác n           │
  └──────────────────────────────┴───────────────────────────────┘

  📌 Reversal THẮNG vì:
    → Cache-friendly (sequential access 3 lần)
    → Code đơn giản → ít bug
    → Dễ explain trong phỏng vấn
    → Juggling chỉ HƠN về số pass (1 vs 3), nhưng thua cache!
```

---

## T — Test

```
Test Cases:
  [1,2,3,4,5,6] d=2  → [5,6,1,2,3,4]       ✅ Right rotate
  [1,2,3,4,5,6] d=2  → [3,4,5,6,1,2]       ✅ Left rotate
  [1,2,3] d=4        → [3,1,2] (d%3=1)      ✅ d > n
  [1,2,3,4,5,6] d=0  → [1,2,3,4,5,6]        ✅ No rotation
  [1,2,3,4,5,6] d=6  → [1,2,3,4,5,6]        ✅ Full rotation
  [1] d=5             → [1]                   ✅ Single element
  [] d=3              → []                    ✅ Empty
  [1,2] d=1           → [2,1]                 ✅ Two elements
```

### Edge Cases giải thích

```
  ┌──────────────────────────────────────────────────────────────┐
  │  d = 0:     d %= n → 0 → return ngay (guard clause)        │
  │             → Không cần reverse gì cả ✅                    │
  │                                                              │
  │  d = n:     d %= n → 0 → return ngay!                       │
  │             → Full cycle = no-op → giống d = 0 ✅            │
  │                                                              │
  │  d > n:     d %= n normalize → d nhỏ hơn n                  │
  │             → d = 14, n = 6 → d = 2 ✅                      │
  │                                                              │
  │  n = 1:     d %= 1 → 0 → return ngay!                       │
  │             → 1 phần tử rotate → chính nó ✅                 │
  │                                                              │
  │  n = 2:     reverse helper có 1 swap max → đúng ✅           │
  │             d = 1: [1,2] → reverse all [2,1] →              │
  │                    reverse [0,0] [2,1] → reverse [1,1] [2,1]│
  │                    = [2,1] ✅                                │
  └──────────────────────────────────────────────────────────────┘
```

---

## 🗣️ Interview Script

### 🎙️ Think Out Loud — Mô phỏng phỏng vấn thực

```
  👤 Interviewer: "Rotate an array to the right by d positions, in-place."

  🧑 You: "Let me clarify — right rotate by d means the last d elements
   move to the front, and the rest shift right. And I need O(1) space.
   Let me also handle d > n by taking d mod n."

  👤 Interviewer: "Correct."

  🧑 You: "The brute force would be to shift all elements right by one,
   d times. That's O(n × d) which is O(n²) in the worst case.

   I can do better with the Reversal Algorithm. The key insight is that
   rotation is essentially swapping two blocks: [A, B] becomes [B, A].

   If I reverse the entire array, A and B swap positions but their
   internal order gets reversed. Then I reverse each block independently
   to restore their internal order.

   Concretely for right rotate by d:
   1. Reverse entire array
   2. Reverse first d elements
   3. Reverse remaining n-d elements

   This is O(n) time — about n total swaps across three reverse calls —
   and O(1) space since reverse is in-place."

  👤 Interviewer: "Can you prove why it works?"

  🧑 You: "Sure. Let our array be [A, B] where B is the last d elements.
   Reversing gives [rev(B), rev(A)]. Now B is in front but reversed.
   Reversing rev(B) gives B — correct order. Reversing rev(A) gives A.
   Result: [B, A], which is exactly right rotation by d."

  👤 Interviewer: "How about left rotation?"

  🧑 You: "Left rotate d equals right rotate n-d. Or I can swap the
   order: reverse A first, then B, then the whole array. Same three
   reverses, just different order."
```

### Pattern & Liên kết

```
  REVERSAL ALGORITHM pattern:

  Dùng REVERSE làm building block cho:
    Right Rotate by d → reverse(all) + reverse(0..d-1) + reverse(d..n-1)
    Left Rotate by d  → reverse(0..d-1) + reverse(d..n-1) + reverse(all)
    Right Rotate by d = Left Rotate by (n - d)!

  Liên kết:
    Array Reverse (#344)    → foundation
    Rotate Array (#189)     → classic application
    Rotate String (#796)    → string version (s + s contains rotated)
    Rotate Image (#48)      → 2D matrix version (transpose + reverse rows)
```

### Skeleton code — Reversal Pattern template

```javascript
// TEMPLATE: Block Swap via Reversal
// Đổi chỗ 2 khối [A, B] thành [B, A] in-place

function blockSwap(arr, splitIndex) {
  const n = arr.length;
  // [A = arr[0..split-1], B = arr[split..n-1]]
  // → [B, A]

  reverse(arr, 0, n - 1); // [B', A']
  reverse(arr, 0, n - splitIndex - 1); // [B, A']
  reverse(arr, n - splitIndex, n - 1); // [B, A]
}

// Right rotate d: blockSwap(arr, n - d)
// Left rotate d:  blockSwap(arr, d)
// Swap halves:    blockSwap(arr, n/2)
```

```
  🧠 Reversal Algorithm là BUILDING BLOCK!

  Ứng dụng đổi chỗ 2 block bất kỳ:
  ┌──────────────────────────────────────────────────┐
  │  Right rotate d    → split at (n - d)            │
  │  Left rotate d     → split at d                  │
  │  Swap first/second → split at n/2                │
  │  Move prefix to end → split at prefix_len        │
  └──────────────────────────────────────────────────┘
```
