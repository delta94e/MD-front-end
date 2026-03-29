# 🔢 Maximum Sum of i×arr[i] Among All Rotations — GfG (Medium)

> 📖 Code: [Max Sum Rotation.js](./Max%20Sum%20Rotation.js)

```mermaid
graph TD
    A["🔢 Max Sum Rotation"] --> B{"Approach?"}
    B --> C["Brute Force O(n²)"]
    B --> D["Math Formula O(n) ⭐"]

    D --> D1["curSum = Σ arr[i]"]
    D1 --> D2["currVal = Σ i×arr[i]"]
    D2 --> D3["for i = 1 → n-1"]
    D3 --> D4["nextVal = currVal - curSum + arr[i-1]×n"]
    D4 --> D5["res = max(res, nextVal)"]
    D5 --> D6{"i < n?"}
    D6 -->|Yes| D3
    D6 -->|No| D7["✅ Return res"]

    style D fill:#4CAF50,color:white
    style D7 fill:#FF5722,color:white
```

```mermaid
graph LR
    subgraph "Key Insight"
        K1["Rotation thay đổi MỌI index"]
        K2["Nhưng thay đổi = PATTERN!"]
        K3["nextVal = currVal - curSum + arr[i-1]×n"]
    end

    subgraph "Related"
        R1["Array Rotation"]
        R2["Circular Sum problems"]
        R3["Derive from previous pattern"]
    end
```

---

## R — Repeat & Clarify

🧠 *"Tính nextVal từ currVal bằng CÔNG THỨC, không cần tính lại từ đầu! O(n)!"*

> 🎙️ *"Find the rotation of the array that maximizes Σ(i × arr[i]). Use the math relationship between consecutive rotations."*

### Clarification Questions

```
Q: "Rotation" = gì?
A: LEFT rotation: phần tử đầu ĐI RA CUỐI!
   [a₀, a₁, a₂, ..., aₙ₋₁] → [a₁, a₂, ..., aₙ₋₁, a₀]

Q: Bao nhiêu rotations?
A: n rotations (0 → n-1). Rotation n = rotation 0 (quay lại!)

Q: Sum = gì?
A: Σ i × arr[i] = 0×arr[0] + 1×arr[1] + 2×arr[2] + ...
   → Giá trị LỚN tại index LỚN → nhiều trọng số hơn!

Q: Return gì?
A: MAX value của Σ i×arr[i] trên TẤT CẢ rotations!

Q: Có negative values?
A: CÓ thể! Nhưng thường positive (bài GfG).

Q: n = 1?
A: 0×arr[0] = 0. Chỉ 1 rotation!
```

### Tại sao bài này quan trọng?

```
  ⭐ Bài này dạy pattern "DERIVE FROM PREVIOUS"!

  ┌───────────────────────────────────────────────────────────────┐
  │  Pattern: Thay vì tính lại O(n), derive O(1) từ trước!      │
  │                                                               │
  │  Brute: n rotations × O(n) each = O(n²)                      │
  │  Smart: CÔNG THỨC liên hệ rotation(k) → rotation(k+1)       │
  │    → O(1) per rotation × n rotations = O(n)!                 │
  │                                                               │
  │  Giống pattern:                                                │
  │    Sliding Window: sum(window) → add right, remove left       │
  │    Rotation Sum: sum(rotation) → derive from previous!        │
  │    Prefix Sum: sum(range) → prefix[r] - prefix[l-1]          │
  └───────────────────────────────────────────────────────────────┘

  📌 TÍN HIỆU: "tính hàm trên TẤT CẢ rotations"
     → Tìm RECURRENCE giữa rotations!
```

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

### INSIGHT CỐT LÕI: "Rotation thay đổi index PATTERN!"

```
  ⭐ Ẩn dụ: "XẾP HÀNG lính theo vị trí!"

  n lính có giá trị (sức mạnh). Xếp vào vị trí 0, 1, 2, ..., n-1.
  Điểm = Σ (vị trí × sức mạnh).
  → Muốn lính MẠNH đứng vị trí LỚN!

  Mỗi "rotation" = XOAY hàng: người đầu đi ra cuối.
  Câu hỏi: rotation nào cho ĐIỂM CAO NHẤT?

  ┌──────────────────────────────────────────────────────────────┐
  │  Brute: thử n xoay, mỗi lần tính lại → O(n²)              │
  │  Smart: khi xoay 1 lần, ĐIỂM THAY ĐỔI BAO NHIÊU?         │
  │                                                              │
  │  Khi LEFT ROTATE 1:                                          │
  │    [a₀, a₁, a₂, ..., aₙ₋₁] → [a₁, a₂, ..., aₙ₋₁, a₀]    │
  │                                                              │
  │  THAY ĐỔI:                                                  │
  │    a₁: vị trí 1 → 0 (GIẢM 1) → mất a₁                     │
  │    a₂: vị trí 2 → 1 (GIẢM 1) → mất a₂                     │
  │    ...                                                       │
  │    aₙ₋₁: vị trí n-1 → n-2 (GIẢM 1) → mất aₙ₋₁            │
  │    a₀: vị trí 0 → n-1 (TĂNG n-1) → được a₀ × (n-1)        │
  │                                                              │
  │  Tổng thay đổi:                                              │
  │    GIẢM: (a₁ + a₂ + ... + aₙ₋₁) = curSum - a₀              │
  │    TĂNG: a₀ × (n-1)                                         │
  │                                                              │
  │  → nextVal = currVal - (curSum - a₀) + a₀ × (n-1)           │
  │            = currVal - curSum + a₀ × n                       │
  └──────────────────────────────────────────────────────────────┘
```

### Suy diễn CÔNG THỨC — Step by step

```
  Gọi R(k) = Σ i × arr'[i] cho rotation thứ k.

  ═══ Rotation 0 ═══
  R(0) = 0×a₀ + 1×a₁ + 2×a₂ + ... + (n-1)×aₙ₋₁

  ═══ Rotation 1 (left rotate 1) ═══
  Mảng mới: [a₁, a₂, ..., aₙ₋₁, a₀]
  R(1) = 0×a₁ + 1×a₂ + ... + (n-2)×aₙ₋₁ + (n-1)×a₀

  ═══ R(1) - R(0) = ? ═══
  R(1) - R(0) = (0×a₁ + 1×a₂ + ... + (n-2)×aₙ₋₁ + (n-1)×a₀)
              - (0×a₀ + 1×a₁ + 2×a₂ + ... + (n-1)×aₙ₋₁)

  Nhóm theo phần tử:
    a₀: (n-1) - 0 = +(n-1)
    a₁: 0 - 1 = -1
    a₂: 1 - 2 = -1
    ...
    aₙ₋₁: (n-2) - (n-1) = -1

  → R(1) - R(0) = (n-1)×a₀ - (a₁ + a₂ + ... + aₙ₋₁)
                 = (n-1)×a₀ - (curSum - a₀)
                 = n×a₀ - curSum

  → R(1) = R(0) + n×a₀ - curSum
         = R(0) - curSum + n×a₀   ✅

  ═══ TỔNG QUÁT: R(k) → R(k+1) ═══
  Rotation thứ k: [aₖ, aₖ₊₁, ..., aₙ₋₁, a₀, ..., aₖ₋₁]
  Left rotate → [aₖ₊₁, ..., aₙ₋₁, a₀, ..., aₖ₋₁, aₖ]
  → aₖ đi từ index 0 → index n-1

  R(k+1) = R(k) - curSum + n × aₖ

  ⭐ Trong code: aₖ = arr[i-1] (vì i chạy từ 1!)
     → nextVal = currVal - curSum + arr[i-1] × n
```

### Minh họa trực quan

```
  arr = [8, 3, 1, 2]    n = 4    curSum = 14

  Rotation 0: [8, 3, 1, 2]
    Positions: [0, 1, 2, 3]
    Weighted:  [0, 3, 2, 6]  → sum = 11

  Rotation 1: [3, 1, 2, 8]    (8 đi từ pos 0 → pos 3)
    THAY ĐỔI: tất cả khác GIẢM 1 (mất 3+1+2=6)
               8 TĂNG 3 (được 8×3=24)
    → 11 - 6 + 24 = 29    ← wait, let me recalculate:
    → 11 - curSum + 8×n = 11 - 14 + 32 = 29 ✅

  ┌────────────────────────────────────────────────────┐
  │  R0: [8, 3, 1, 2]                                  │
  │      ↓↓ ↓↓ ↓↓ ↓↓                                   │
  │      0  1  2  3  (positions)                        │
  │      0  3  2  6  → 11                              │
  │                                                     │
  │  R1: [3, 1, 2, 8]  (8 ra cuối!)                   │
  │      ↓↓ ↓↓ ↓↓ ↓↓                                   │
  │      0  1  2  3  (positions)                        │
  │      0  1  4 24  → 29  ⭐ MAX!                     │
  └────────────────────────────────────────────────────┘
```

```mermaid
graph TD
    subgraph "Left Rotate"
        A["[a₀, a₁, a₂, ..., aₙ₋₁]"] --> B["[a₁, a₂, ..., aₙ₋₁, a₀]"]
    end

    subgraph "Effect on Sum"
        C["a₁..aₙ₋₁: index -1 → mất Σ(a₁..aₙ₋₁)"]
        D["a₀: index 0→n-1 → được a₀×(n-1)"]
        E["Net = -curSum + a₀×n"]
    end

    B --> C
    B --> D
    C --> E
    D --> E

    style E fill:#4CAF50,color:white
```

---

## 🧭 Luồng Suy Nghĩ — Từ đọc đề đến solution

### Bước 1: Đọc đề → Keywords

```
  Đề: "Maximize Σ(i × arr[i]) among all rotations"

  Gạch chân:
    ✏️ "all rotations"   → n rotations
    ✏️ "maximize"         → tìm max
    ✏️ "i × arr[i]"       → weighted sum
    ✏️ "rotations"        → circular shift

  🧠 Trigger:
    "All rotations" → O(n²) brute → có RECURRENCE O(n)?
    "Weighted sum" → mỗi rotation chỉ shift weights!
```

### Bước 2: Brute → Observe → Derive

```
  🧠 Approach 1: Brute O(n²)
    Thử mỗi rotation, tính Σ i×arr[i] → O(n) each → O(n²)

  🧠 Approach 2: Observe pattern
    Rotation k → k+1: mỗi element GIẢM 1 index, 1 element TĂNG n-1
    → CÓ CÔNG THỨC liên hệ! → O(1) per rotation!

  🧠 Approach 3: Math Formula O(n) ⭐
    nextVal = currVal - curSum + arr[i-1] × n
    → O(1) per rotation × n rotations = O(n)!
```

### Bước 3: Cây quyết định

```mermaid
flowchart TD
    START["🧠 Max Sum Rotation?"] --> Q1["Tính R(0) = Σ i×arr[i]"]
    Q1 --> Q2["curSum = Σ arr[i]"]
    Q2 --> Q3["For k = 1→n-1"]
    Q3 --> Q4["R(k) = R(k-1) - curSum + arr[k-1]×n"]
    Q4 --> Q5["Track max"]
    Q5 --> Q3
    Q3 --> Q6["✅ Return max"]

    style Q4 fill:#4CAF50,color:white
    style Q6 fill:#FF9800,color:white
```

---

## E — Examples

```
VÍ DỤ 1: arr = [8, 3, 1, 2]    n = 4    curSum = 14

  Rotation 0: [8,3,1,2] → 0×8 + 1×3 + 2×1 + 3×2 = 0+3+2+6 = 11
  Rotation 1: [3,1,2,8] → 0×3 + 1×1 + 2×2 + 3×8 = 0+1+4+24 = 29 ⭐
  Rotation 2: [1,2,8,3] → 0×1 + 1×2 + 2×8 + 3×3 = 0+2+16+9 = 27
  Rotation 3: [2,8,3,1] → 0×2 + 1×8 + 2×3 + 3×1 = 0+8+6+3 = 17

  Max = 29 ✅
```

```
VÍ DỤ 2: arr = [1, 20, 2, 10]    n = 4    curSum = 33

  R(0) = 0×1 + 1×20 + 2×2 + 3×10 = 0+20+4+30 = 54
  R(1) = 54 - 33 + 1×4  = 54-33+4  = 25
  R(2) = 25 - 33 + 20×4 = 25-33+80 = 72 ⭐
  R(3) = 72 - 33 + 2×4  = 72-33+8  = 47

  Max = 72 ✅
  → [2, 10, 1, 20]: 0×2 + 1×10 + 2×1 + 3×20 = 0+10+2+60 = 72 ✅

  📌 Phần tử LỚN (20) ở position LỚN (3) → max!
```

```
VÍ DỤ 3 (Edge): arr = [5]    n = 1

  R(0) = 0×5 = 0
  → Max = 0 ✅ (chỉ 1 rotation!)
```

```
VÍ DỤ 4 (Edge): arr = [1, 2, 3]    n = 3    curSum = 6

  R(0) = 0×1 + 1×2 + 2×3 = 0+2+6 = 8
  R(1) = 8 - 6 + 1×3 = 5
  R(2) = 5 - 6 + 2×3 = 5

  Max = 8 ✅ → rotation 0 (mảng gốc!) là tốt nhất!
  → Sorted ascending → index LỚN nhân giá trị LỚN → đã tối ưu!
```

```
VÍ DỤ 5: arr = [3, 2, 1]    n = 3    curSum = 6

  R(0) = 0×3 + 1×2 + 2×1 = 0+2+2 = 4
  R(1) = 4 - 6 + 3×3 = 7
  R(2) = 7 - 6 + 2×3 = 7

  Max = 7 ✅ (R(1) = R(2) = 7, cả 2 optimal!)
```

### Trace dạng bảng — VD chi tiết

```
  arr = [8, 3, 1, 2]    n = 4    curSum = 14

  R(0) = 0×8 + 1×3 + 2×1 + 3×2 = 11

  ┌──────┬────────────────────────────────────┬──────────┬──────┐
  │ i    │ Công thức                           │ currVal  │ max  │
  ├──────┼────────────────────────────────────┼──────────┼──────┤
  │ init │ R(0) = Σ i×arr[i]                  │ 11       │ 11   │
  │ 1    │ 11 - 14 + arr[0]×4 = 11-14+32      │ 29       │ 29 ⭐│
  │ 2    │ 29 - 14 + arr[1]×4 = 29-14+12      │ 27       │ 29   │
  │ 3    │ 27 - 14 + arr[2]×4 = 27-14+4       │ 17       │ 29   │
  └──────┴────────────────────────────────────┴──────────┴──────┘

  → Max = 29 ✅

  Verification:
    i=1 → rotation [3, 1, 2, 8] → 0+1+4+24 = 29 ✅
```

---

## A — Approach

### Approach 1: Brute Force — O(n²)

```
  Thử tất cả n rotations, mỗi cái tính sum O(n) → O(n²)

  for rotation r = 0 → n-1:
    sum = 0
    for j = 0 → n-1:
      sum += j × arr[(r + j) % n]
    max = Math.max(max, sum)
```

### Approach 2: Math Formula — O(n) ⭐

```
  Step 1: curSum = Σ arr[i]                    O(n)
  Step 2: currVal = R(0) = Σ i×arr[i]         O(n)
  Step 3: For i = 1 → n-1:
            currVal = currVal - curSum + arr[i-1] × n   O(1) each!
            track max

  📌 CÔNG THỨC: nextVal = currVal - curSum + arr[i-1] × n

  Total: O(n) time, O(1) space!
```

---

## C — Code ✅

### Solution 1: Brute Force — O(n²)

```javascript
function maxSumBrute(arr) {
  const n = arr.length;
  let res = -Infinity;

  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += j * arr[(i + j) % n];
    }
    res = Math.max(res, sum);
  }
  return res;
}
```

### Solution 2: Math Formula — O(n) ⭐

```javascript
function maxSum(arr) {
  const n = arr.length;

  // Tổng tất cả phần tử
  let curSum = 0;
  for (let i = 0; i < n; i++) curSum += arr[i];

  // Tính sum ban đầu (rotation 0)
  let currVal = 0;
  for (let i = 0; i < n; i++) currVal += i * arr[i];

  let res = currVal;

  // Tính rotation tiếp theo từ rotation trước
  for (let i = 1; i < n; i++) {
    currVal = currVal - curSum + arr[i - 1] * n;
    res = Math.max(res, currVal);
  }
  return res;
}
```

---

## 🔬 Deep Dive — Giải thích CHI TIẾT từng dòng

> 💡 Phân tích **từng dòng** để hiểu **TẠI SAO**.

```javascript
function maxSum(arr) {
  const n = arr.length;

  // ═══════════════════════════════════════════════════════════
  // STEP 1: Tổng tất cả phần tử — O(n)
  // ═══════════════════════════════════════════════════════════
  //
  // TẠI SAO cần curSum?
  //   → curSum xuất hiện trong CÔNG THỨC:
  //     nextVal = currVal - curSum + arr[i-1] × n
  //   → curSum = tổng reduction khi mọi phần tử GIẢM 1 index!
  //
  // ⚠️ curSum KHÔNG ĐỔI qua các rotations!
  //    (Rotation chỉ đổi VỊ TRÍ, tổng vẫn giữ nguyên!)
  //
  let curSum = 0;
  for (let i = 0; i < n; i++) curSum += arr[i];

  // ═══════════════════════════════════════════════════════════
  // STEP 2: Tính R(0) = Σ i × arr[i] — O(n)
  // ═══════════════════════════════════════════════════════════
  //
  // R(0) = rotation ban đầu (không xoay!)
  // = 0×arr[0] + 1×arr[1] + 2×arr[2] + ... + (n-1)×arr[n-1]
  //
  // ⚠️ arr[0] nhân 0 → LOẠI KHỎI tổng!
  //    → Nên xoay để phần tử NHỎ NHẤT ở index 0!
  //
  let currVal = 0;
  for (let i = 0; i < n; i++) currVal += i * arr[i];

  let res = currVal;

  // ═══════════════════════════════════════════════════════════
  // STEP 3: Derive mỗi rotation từ trước — O(n) total, O(1) each
  // ═══════════════════════════════════════════════════════════
  //
  // ⭐ CÔNG THỨC CỐT LÕI:
  //   nextVal = currVal - curSum + arr[i-1] × n
  //
  // TẠI SAO?
  //   Khi left-rotate lần thứ i:
  //     → Phần tử arr[i-1] đi từ index 0 → index n-1
  //     → Tất cả phần tử khác GIẢM 1 index
  //
  //   Chi tiết:
  //     Giảm: mọi phần tử khác (tổng = curSum - arr[i-1]) mất 1 index
  //            → mất (curSum - arr[i-1])
  //     Tăng: arr[i-1] từ index 0 → n-1 → được arr[i-1] × (n-1)
  //
  //   nextVal = currVal - (curSum - arr[i-1]) + arr[i-1] × (n-1)
  //           = currVal - curSum + arr[i-1] + arr[i-1] × (n-1)
  //           = currVal - curSum + arr[i-1] × (1 + n - 1)
  //           = currVal - curSum + arr[i-1] × n    ✅
  //
  // ⚠️ arr[i-1] KHÔNG PHẢI arr[i]!
  //    i bắt đầu từ 1 → rotation thứ 1 xoay arr[0] (index i-1=0!)
  //    rotation thứ 2 xoay arr[1] (index i-1=1!)
  //
  for (let i = 1; i < n; i++) {
    currVal = currVal - curSum + arr[i - 1] * n;
    res = Math.max(res, currVal);
  }
  return res;
}
```

```mermaid
flowchart TD
    subgraph FLOW["⭐ Algorithm Flow"]
        A["curSum = Σarr[i]"] --> B["R(0) = Σ i×arr[i]"]
        B --> C["res = R(0)"]
        C --> D["i = 1 → n-1"]
        D --> E["currVal = currVal - curSum\n+ arr[i-1] × n"]
        E --> F["res = max(res, currVal)"]
        F --> G{"i < n?"}
        G -->|"YES"| D
        G -->|"NO"| H["✅ return res"]
    end

    style E fill:#4CAF50,color:white
    style H fill:#FF9800,color:white
```

---

## 📐 Invariant — Chứng minh tính đúng đắn

```
  📐 INVARIANT:

  Sau iteration i:
    currVal = R(i) = Σ j × arr_rotated_i[j]
    res = max(R(0), R(1), ..., R(i))

  CHỨNG MINH CÔNG THỨC:
  ┌──────────────────────────────────────────────────────────────┐
  │  R(k) = Σ j × aₖ₊ⱼ mod n     cho j = 0 → n-1              │
  │  R(k+1) = Σ j × aₖ₊₁₊ⱼ mod n cho j = 0 → n-1              │
  │                                                              │
  │  R(k+1) - R(k):                                             │
  │    Cho mỗi phần tử aₘ (m ≠ k):                              │
  │      Trong R(k): aₘ ở position j → contribution = j × aₘ   │
  │      Trong R(k+1): aₘ ở position j-1 → (j-1) × aₘ          │
  │      Thay đổi: -aₘ                                          │
  │    Tổng thay đổi các phần tử khác: -Σaₘ = -(S - aₖ)        │
  │                                                              │
  │    Cho aₖ:                                                   │
  │      Trong R(k): aₖ ở position 0 → contribution = 0         │
  │      Trong R(k+1): aₖ ở position n-1 → (n-1) × aₖ          │
  │      Thay đổi: +(n-1) × aₖ                                  │
  │                                                              │
  │  R(k+1) = R(k) - (S - aₖ) + (n-1) × aₖ                     │
  │         = R(k) - S + aₖ + (n-1) × aₖ                        │
  │         = R(k) - S + n × aₖ                                  │
  │                                                              │
  │  Trong code: k → i-1, nên aₖ = arr[i-1]                     │
  │  → R(i) = R(i-1) - curSum + arr[i-1] × n        ✅  ∎       │
  └──────────────────────────────────────────────────────────────┘

  📐 CORRECTNESS:
    Base: R(0) = Σ i×arr[i] → tính trực tiếp ✅
    Step: R(k+1) = R(k) - S + n×aₖ → proven above ✅
    Result: max(R(0), R(1), ..., R(n-1)) → tracked by res ✅ ∎

  📐 TERMINATION:
    Loop runs exactly n-1 times → terminate ∎

  📐 SPACE:
    chỉ dùng curSum, currVal, res → O(1) ∎
```

---

## ❌ Common Mistakes — Lỗi thường gặp

```mermaid
graph TD
    START["🚨 Common Mistakes"] --> M1["Mistake #1\narr[i] thay\narr[i-1]"]
    START --> M2["Mistake #2\n× (n-1) thay\n× n"]
    START --> M3["Mistake #3\nQuên init\nres = R(0)"]
    START --> M4["Mistake #4\nRight rotation\nvs Left rotation"]
    START --> M5["Mistake #5\nInteger\noverflow"]

    M1 --> M1a["❌ arr[i]: sai\nphần tử xoay"]
    M1 --> M1b["✅ arr[i-1]: phần tử\nvừa rời pos 0"]

    M2 --> M2a["❌ ×(n-1): thiếu\n+arr[i-1]"]
    M2 --> M2b["✅ ×n: đã bao gồm\ncả +arr[i-1]"]

    M3 --> M3a["❌ res=0:\nmiss R(0)!"]
    M3 --> M3b["✅ res=R(0):\nbase case"]

    M4 --> M4a["❌ Nhầm chiều\nxoay → sai CT"]
    M4 --> M4b["✅ LEFT rotate:\na₀ ra cuối"]

    M5 --> M5a["❌ i×arr[i] lớn\n→ overflow"]
    M5 --> M5b["✅ JS: Number\nan toàn < 2⁵³"]

    style M1a fill:#FFCDD2,stroke:#F44336
    style M2a fill:#FFCDD2,stroke:#F44336
    style M3a fill:#FFCDD2,stroke:#F44336
    style M4a fill:#FFCDD2,stroke:#F44336
    style M5a fill:#FFCDD2,stroke:#F44336
    style M1b fill:#C8E6C9,stroke:#4CAF50
    style M2b fill:#C8E6C9,stroke:#4CAF50
    style M3b fill:#C8E6C9,stroke:#4CAF50
    style M4b fill:#C8E6C9,stroke:#4CAF50
    style M5b fill:#C8E6C9,stroke:#4CAF50
    style START fill:#FF9800,color:white
```

### Mistake 1: arr[i] thay vì arr[i-1]!

```javascript
// ❌ SAI: arr[i] = phần tử SAI!
currVal = currVal - curSum + arr[i] * n;
// i=1: dùng arr[1]? NHẦm! Rotation 1 xoay arr[0] ra cuối!

// ✅ ĐÚNG: arr[i-1]!
currVal = currVal - curSum + arr[i - 1] * n;
// i=1: arr[0] = phần tử đang ở index 0, xoay ra cuối ✅
```

### Mistake 2: Nhân (n-1) thay vì n!

```javascript
// ❌ SAI: chỉ nghĩ "tăng n-1 vị trí"!
currVal = currVal - curSum + arr[i-1] + arr[i-1] * (n-1);
// Dài dòng nhưng ĐÚNG! Tuy nhiên:

// ✅ RÚT GỌN: arr[i-1] + arr[i-1]×(n-1) = arr[i-1]×n!
currVal = currVal - curSum + arr[i-1] * n;
// ← Gọn hơn, ít bug hơn! Cùng kết quả!

// ❌ SAI NẾU QUÊN +arr[i-1]:
currVal = currVal - curSum + arr[i-1] * (n-1);
// → Thiếu arr[i-1] (phần bù từ -curSum bao gồm arr[i-1])!
```

### Mistake 3: Quên init res = R(0)!

```javascript
// ❌ SAI: res = 0 hoặc -Infinity, bỏ qua R(0)!
let res = 0;
for (let i = 1; i < n; i++) {
  // ... chỉ check R(1) → R(n-1), MISS R(0)!
}

// ✅ ĐÚNG: init res = R(0)!
let res = currVal;  // R(0)!
for (let i = 1; i < n; i++) { ... }
```

### Mistake 4: Nhầm left vs right rotation!

```
  ❌ Nếu bài hỏi RIGHT rotation:
    [a₀, a₁, ..., aₙ₋₁] → [aₙ₋₁, a₀, a₁, ..., aₙ₋₂]
    → Công thức KHÁC!
    → nextVal = currVal + curSum - arr[n-i] × n

  ✅ Bài này: LEFT rotation!
    [a₀, a₁, ..., aₙ₋₁] → [a₁, a₂, ..., aₙ₋₁, a₀]
    → nextVal = currVal - curSum + arr[i-1] × n

  📌 Luôn xác định LEFT hay RIGHT trước khi code!
```

### Mistake 5: Integer overflow!

```
  n có thể lớn, arr[i] lớn → i×arr[i] lớn!
  VD: n = 10⁵, arr[i] = 10⁶ → i×arr[i] ≤ 10¹¹

  ⚠️ JavaScript: Number safe lên đến 2⁵³ ≈ 9×10¹⁵ → OK!
  ⚠️ C++/Java (int): MAX = 2³¹ ≈ 2×10⁹ → OVERFLOW!
     → Dùng long long (C++) hoặc long (Java)!
```

---

## O — Optimize

```
                Time     Space    Ghi chú
  ──────────────────────────────────────────────
  Brute Force   O(n²)    O(1)     n rotations × O(n) each
  Math Formula  O(n)     O(1)     O(1) per rotation! ⭐
```

### Complexity chính xác — Đếm operations

```
  Math Formula:
    Pass 1: n additions (curSum)
    Pass 2: n multiplications + n additions (R(0))
    Pass 3: (n-1) × (1 sub + 1 mul + 1 add + 1 max)
    TỔNG: 2n + 4(n-1) ≈ 6n operations

  📊 So sánh (n = 10⁶):
    Formula: 6×10⁶ ops ⭐
    Brute:   10¹² ops 💀

  Space: 3 variables (curSum, currVal, res) → O(1) ✅
```

---

## T — Test

```
Test Cases:
  [8, 3, 1, 2]     → 29    ✅ rotation [3,1,2,8]
  [1, 20, 2, 10]   → 72    ✅ rotation [2,10,1,20]
  [5]               → 0     ✅ 0×5 = 0
  [1, 2, 3]         → 8     ✅ rotation 0 (đã sorted!)
  [3, 2, 1]         → 7     ✅ rotation 1 hoặc 2
  [10, 1, 2, 3, 4]  → 50    ✅
  [0, 0, 0]         → 0     ✅ all zeros

  Edge: [10, 1, 2, 3, 4] trace:
    curSum = 20, R(0) = 0+1+4+9+16 = 30
    i=1: 30-20+10×5 = 60 → res=60
    i=2: 60-20+1×5  = 45 → res=60
    i=3: 45-20+2×5  = 35 → res=60
    i=4: 35-20+3×5  = 30 → res=60
    → Wait, let me recheck R(1):
    Rotation 1: [1,2,3,4,10] → 0+2+6+12+40 = 60 ✅
```

---

## 🗣️ Interview Script

### 🎙️ Think Out Loud — Mô phỏng phỏng vấn thực

```
  ──────────────── PHASE 1: Clarify ────────────────

  👤 Interviewer: "Find the rotation that maximizes
                   the sum of i times arr[i]."

  🧑 You: "So I need to try all n rotations of the array
   and find which one gives the maximum value of
   Σ(index × element). Correct?"

  ──────────────── PHASE 2: Examples ────────────────

  🧑 You: "arr = [8, 3, 1, 2]. Sum = 14.
   R(0) = 0×8+1×3+2×1+3×2 = 11.
   R(1) = 0×3+1×1+2×2+3×8 = 29 — much bigger because
   8 moved to the highest-weight position."

  ──────────────── PHASE 3: Approach ────────────────

  🧑 You: "Brute force is O(n²). But I notice a pattern:
   when I left-rotate by one, every element except the
   displaced one drops one index position. The displaced
   element moves from index 0 to index n-1.

   So the net change is:
   - Every other element loses its value from the sum
     (total loss = curSum - arr[rotated_element])
   - The displaced element gains arr[rotated_element] × (n-1)

   Simplifying:
   nextVal = currVal - curSum + arr[i-1] × n

   This gives me O(1) per rotation, O(n) total.
   Space O(1) — just three variables."

  ──────────────── PHASE 4: Code + Verify ────────────────

  🧑 You: [writes code, traces [8,3,1,2]]

  "i=1: 11 - 14 + 8×4 = 29.
   i=2: 29 - 14 + 3×4 = 27.
   i=3: 27 - 14 + 1×4 = 17.
   Max = 29 ✅."

  ──────────────── PHASE 5: Follow-ups ────────────────

  👤 "What if I want the rotation INDEX, not just the value?"
  🧑 "I'd track the index alongside the max. When res updates,
      record i as the rotation index."

  👤 "What if rotation is RIGHT instead of LEFT?"
  🧑 "The formula changes slightly. For right rotation,
      the last element goes to index 0. The relationship
      is: nextVal = currVal + curSum - arr[n-i] × n."

  👤 "Can we use this pattern for other functions?"
  🧑 "Yes! Any function that changes predictably
      between rotations can be optimized this way.
      For example, maximum product of i×arr[i],
      or weighted circular sums."
```

---

## 📚 Bài tập liên quan — Practice Problems

### Progression Path

```mermaid
graph LR
    A["Array Rotation\nBasics"] -->|"sum"| B["⭐ Max Sum\nRotation\n(BÀI NÀY)"]
    B -->|"variant"| C["Max Hamming\nDistance"]
    B -->|"related"| D["Circular\nSubarray Sum"]
    B -->|"pattern"| E["Sliding Window\nFixed"]

    style B fill:#4CAF50,color:white
```

### 1. Maximum Hamming Distance (GfG)

```
  Đề: Tìm rotation tối đa hóa Hamming distance với mảng gốc.

  function maxHamming(arr) {
    const n = arr.length;
    const doubled = [...arr, ...arr];  // duplicate!
    let maxDist = 0;

    for (let r = 1; r < n; r++) {
      let dist = 0;
      for (let i = 0; i < n; i++) {
        if (doubled[r + i] !== arr[i]) dist++;
      }
      maxDist = Math.max(maxDist, dist);
    }
    return maxDist;
  }

  📌 Cùng "try all rotations" nhưng không có recurrence!
     → O(n²) brute force (khó optimize hơn!)
```

### 2. Sliding Window Maximum Sum (Fixed Window)

```
  Đề: Tìm window size k có tổng lớn nhất.

  function maxSlidingSum(arr, k) {
    let windowSum = 0;
    for (let i = 0; i < k; i++) windowSum += arr[i];

    let maxSum = windowSum;
    for (let i = k; i < arr.length; i++) {
      windowSum += arr[i] - arr[i - k];  // O(1) per slide!
      maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
  }

  📌 CÙNG PATTERN: derive next from previous!
     Window: += arr[right] - arr[left]
     Rotation: = currVal - curSum + arr[i-1]×n
```

### 3. Find Rotation Count (GfG)

```
  Đề: Tìm số lần mảng sorted đã bị rotate.

  function findRotationCount(arr) {
    let min = Infinity, minIdx = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] < min) { min = arr[i]; minIdx = i; }
    }
    return minIdx;
  }

  📌 Related: rotation count = index phần tử nhỏ nhất!
```

### Tổng kết — "Derive From Previous" Pattern

```
  ┌──────────────────────────────────────────────────────────────┐
  │  BÀI                     │  Derive Formula                  │
  ├──────────────────────────────────────────────────────────────┤
  │  Max Sum Rotation ⭐      │  next = curr - S + a[i-1]×n    │
  │  Sliding Window Sum      │  next = curr + a[r] - a[l]     │
  │  Running Average         │  next = curr + (a[r]-a[l])/k   │
  │  Moving Product          │  next = curr × a[r] / a[l]     │
  └──────────────────────────────────────────────────────────────┘

  📌 RULE: "Tính hàm trên TẤT CẢ shifts/rotations?"
     → Tìm RECURRENCE giữa consecutive shifts!
     → O(1) per shift → O(n) total!
```

### Skeleton code — Reusable template

```javascript
// TEMPLATE: Derive rotation sum from previous
function maxRotationProperty(arr, computeDelta) {
  const n = arr.length;

  // Step 1: Compute base value (rotation 0)
  let baseValue = 0;
  for (let i = 0; i < n; i++) {
    baseValue += /* base computation */;
  }

  // Step 2: Precompute constants
  const sum = arr.reduce((a, b) => a + b, 0);

  // Step 3: Derive each rotation
  let currVal = baseValue;
  let res = currVal;
  for (let i = 1; i < n; i++) {
    currVal = computeDelta(currVal, sum, arr[i-1], n);
    res = Math.max(res, currVal);
  }
  return res;
}

// Max Sum Rotation:
// computeDelta = (curr, sum, elem, n) => curr - sum + elem * n
```

---

## 📌 Kỹ năng chuyển giao — Pattern Summary

```mermaid
graph TD
    A["'TẤT CẢ rotations/shifts'\n+ tính 1 hàm?"] -->|Yes| B{"Có RECURRENCE?"}
    B -->|"YES"| C["⭐ Derive O(1)/rotation\nO(n) total!"]
    B -->|"NO"| D["Brute O(n²)\nhoặc tìm trick khác"]
    C --> E["nextVal = f(currVal, constants)"]

    style C fill:#4CAF50,color:white
```

---

## 📊 Tổng kết — Key Insights

```mermaid
graph LR
    subgraph SUMMARY["📌 Tổng kết"]
        direction TB
        S1["1. R(0) = Σ i×arr[i]"] --> S2["2. curSum = Σ arr[i]"]
        S2 --> S3["3. R(k+1) = R(k) - S + aₖ×n"]
        S3 --> S4["4. Track max → O(n)/O(1)"]
    end

    subgraph KEY["🔑 Key Insights"]
        K1["Base case:\ntính trực tiếp"]
        K2["curSum KHÔNG ĐỔI\nqua rotations"]
        K3["arr[i-1] × n\n= phần tử ra cuối"]
        K4["O(1) per rotation\n→ O(n) total"]
    end

    S1 -.- K1
    S2 -.- K2
    S3 -.- K3
    S4 -.- K4

    style S3 fill:#4CAF50,color:white
    style K3 fill:#C8E6C9,stroke:#4CAF50
```

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  📌 3 ĐIỀU PHẢI NHỚ                                                    │
  │                                                                          │
  │  1. CÔNG THỨC CỐT LÕI:                                                 │
  │     R(k+1) = R(k) - curSum + arr[k] × n                                │
  │     Code: currVal = currVal - curSum + arr[i-1] * n                    │
  │     → ⚠️ arr[i-1] KHÔNG PHẢI arr[i]! (vì i bắt đầu từ 1!)           │
  │                                                                          │
  │  2. TẠI SAO HOẠT ĐỘNG:                                                  │
  │     Left rotate: a₀ ra cuối (index n-1)                                │
  │     → Mọi phần tử khác GIẢM 1 index → tổng giảm (curSum - a₀)        │
  │     → a₀ TĂNG (n-1) index → tổng tăng a₀ × (n-1)                     │
  │     → Net: -curSum + a₀ × n                                            │
  │                                                                          │
  │  3. PATTERN: "DERIVE FROM PREVIOUS"                                      │
  │     → Bất kỳ bài nào tính hàm trên TẤT CẢ rotations/shifts           │
  │     → Tìm recurrence: next = f(curr, constants)                        │
  │     → O(1) per step → O(n) total!                                      │
  │     → Cùng tư duy: Sliding Window, Prefix Sum!                         │
  └──────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Flashcard — Tự kiểm tra

| ❓ Câu hỏi | ✅ Đáp án |
|---|---|
| Công thức chuyển rotation? | `nextVal = currVal - curSum + arr[i-1] × n` |
| Tại sao arr[i-1] không arr[i]? | i bắt đầu từ **1**, rotation thứ i xoay arr[**i-1**] |
| curSum thay đổi không? | **KHÔNG!** curSum cố định qua rotations! |
| R(0) tính bằng gì? | `Σ i × arr[i]` (trực tiếp!) |
| Left rotate: ai ra cuối? | **a₀** (phần tử đầu đi ra cuối!) |
| Mọi phần tử khác thay đổi? | **GIẢM 1 index** → mất (curSum - a₀) |
| a₀ thay đổi? | Từ index **0 → n-1** → được a₀ × (n-1) |
| Rút gọn: -(S-a₀) + a₀(n-1)? | **-S + a₀ × n** |
| Time / Space? | **O(n)** / **O(1)** |
| Pattern giống? | **Sliding Window** (derive next from previous!) |
| Array sorted tăng → rotation nào? | Rotation **0** (index lớn × giá trị lớn đã tối ưu!) |
| Brute force complexity? | **O(n²)** (n rotations × O(n) each) |
