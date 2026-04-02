# 🔄 Maximum Circular Subarray Sum — GfG (Medium)

> 📖 Code: [Maximum Circular Subarray Sum.js](./Maximum%20Circular%20Subarray%20Sum.js)

```mermaid
graph TD
    A["🔄 Maximum Circular Subarray Sum"] --> B["Kadane's cho maxSum THƯỜNG"]
    A --> C["Kadane's cho minSum"]
    B --> D["maxNormal = maxSum thường"]
    C --> E["maxWrap = totalSum - minSum"]
    D --> F{"maxNormal vs maxWrap?"}
    E --> F
    F -->|"maxNormal ≥ maxWrap"| G["✅ Return maxNormal"]
    F -->|"maxWrap > maxNormal"| H{"totalSum === minSum?"}
    H -->|"Yes: toàn âm!"| I["✅ Return maxNormal"]
    H -->|"No"| J["✅ Return maxWrap"]

    style G fill:#4CAF50,color:white
    style I fill:#FF9800,color:white
    style J fill:#2196F3,color:white
```

```mermaid
graph LR
    subgraph "Họ bài Kadane's"
        K1["Kadane's Classic: max subarray sum"]
        K2["Circular Subarray: max + wrap around"]
        K3["Max Product Subarray: track min lẫn max"]
        K4["Min Subarray Sum: đảo dấu Kadane"]
    end

    subgraph "Key Insight"
        KI["maxWrap = totalSum - minSubarraySum"]
    end
```

---

## R — Repeat & Clarify

🧠 *"Circular array = mảng VÒNG TRÒN: phần tử cuối nối với phần tử đầu. Tìm subarray (có thể WRAP AROUND) có tổng lớn nhất."*

> 🎙️ *"Given a circular array, find the maximum sum of any non-empty subarray. The subarray may wrap around the end and continue from the beginning."*

### Clarification Questions

```
Q: Circular array nghĩa là gì?
A: Phần tử cuối LIÊN TIẾP với phần tử đầu!
   arr = [1, 2, 3] → ... → 3 → 1 → 2 → 3 → 1 → ...
   Subarray [3, 1] ✅ (wrap around!)

Q: Subarray phải non-empty?
A: CÓ! Ít nhất 1 phần tử.

Q: Mảng toàn âm thì sao?
A: Trả về số âm LỚN NHẤT (ít âm nhất).
   [-3, -2, -1] → -1

Q: Wrap around subarray có thể dài hơn n không?
A: KHÔNG! Tối đa n phần tử (toàn bộ mảng).

Q: Khác gì Kadane's thường?
A: Kadane's thường: subarray KHÔNG wrap.
   Bài này: subarray CÓ THỂ wrap qua đuôi → đầu!

Q: Subarray wrap = phần đầu + phần cuối?
A: ĐÚNG! Wrap subarray = [...cuối mảng] + [...đầu mảng]
   = totalSum - phần GIỮA bỏ đi!
```

### Tại sao bài này quan trọng?

```
  Bài này là NÂNG CẤP của Kadane's Algorithm!!!

  BẠN PHẢI hiểu:
  1. Kadane's thường chỉ xét subarray LIÊN TIẾP trong mảng
  2. Circular cho phép WRAP AROUND → thêm 1 trường hợp!
  3. Trick: maxWrap = totalSum - minSubarraySum
     → KHÔNG cần thực sự nối mảng thành vòng tròn!

  Prerequisite:
  ┌─────────────────────────────────────────────────┐
  │  ⚠️ PHẢI hiểu Kadane's Algorithm TRƯỚC!          │
  │  → maxEndingHere = max(num, maxEndingHere + num) │
  │  → "Tiếp tục hay bắt đầu lại?"                  │
  │  → Xem: Kadane's Algorithm.md                    │
  └─────────────────────────────────────────────────┘
```

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

### INSIGHT CỐT LÕI: "Bỏ min ở GIỮA = Giữ max ở 2 ĐẦU!"

```
  ⭐ Ẩn dụ: CHUỖI HẠT VÒNG TRÒN!

  Tưởng tượng mảng là 1 chuỗi hạt nối thành vòng tròn.
  Mỗi hạt có giá trị (dương hoặc âm).
  Bạn muốn CẮT 1 đoạn liên tiếp có TỔNG LỚN NHẤT.

  2 CÁCH cắt:
  1. Cắt 1 đoạn ở GIỮA → Kadane's thường!
  2. Cắt 1 đoạn QUẤN QUA mối nối → Wrap!
     = BỎ phần còn lại ở giữa
     = totalSum - phần bị bỏ
     → Muốn max phần giữ = min phần bỏ!
```

### 2 TRƯỜNG HỢP — CHỈ CÓ 2 THÔI!

```
  Subarray tổng max chỉ nằm ở 1 trong 2 vị trí:

  CASE 1: KHÔNG WRAP — subarray nằm giữa mảng
  ┌────────────────────────────────────┐
  │  ...  [█████████████]  ...         │
  │        ↑ start   end ↑            │
  │  → Kadane's THƯỜNG!               │
  └────────────────────────────────────┘

  CASE 2: CÓ WRAP — subarray quấn qua đuôi-đầu
  ┌────────────────────────────────────┐
  │  [████]  ...........  [████████]   │
  │  ↑ end   (phần BỎ)    start ↑     │
  │  → Phần BỎ ở GIỮA = MIN subarray! │
  └────────────────────────────────────┘

  ĐÁP ÁN = max(case1, case2)
```

### Tại sao totalSum - minSubarraySum?

```
  CHỨNG MINH:

  Mảng:    [a₁, a₂, a₃, ..., aₙ]
  totalSum = a₁ + a₂ + ... + aₙ

  Nếu wrap subarray = [aₖ, ..., aₙ, a₁, ..., aⱼ]
  thì phần BỎ ĐI  = [aⱼ₊₁, ..., aₖ₋₁]  ← subarray ở GIỮA!

  wrapSum = totalSum - bỏSum
  Muốn wrapSum LỚN NHẤT ↑
  → Cần bỏSum NHỎ NHẤT ↓
  → bỏSum = MIN subarray sum!

  ⭐ maxWrap = totalSum - minSubarraySum

  ┌──────────────────────────────────────────────────────────────┐
  │  Tổng mảng:    [████████████████████████████████]  = totalSum│
  │                      ↑               ↑                      │
  │                 Phần BỎ = minSubarray (Kadane's min!)        │
  │                                                              │
  │  Sau khi BỎ:                                                 │
  │  [████]                         [████████]                   │
  │     ↑                              ↑                         │
  │  wrap TRÁI                    wrap PHẢI                      │
  │  = totalSum - minSubarraySum!                                │
  │                                                              │
  │  📌 KHÔNG cần nối mảng! Chỉ cần totalSum - minSubarraySum! │
  └──────────────────────────────────────────────────────────────┘
```

```mermaid
graph TD
    A["Mảng arr[]"] --> B["Case 1: Max subarray THƯỜNG"]
    A --> C["Case 2: Max subarray WRAP"]
    B --> D["Kadane's max → maxNormal"]
    C --> E["totalSum - Kadane's min → maxWrap"]
    D --> F{"max(maxNormal, maxWrap)"}
    E --> F
    F --> G["⚠️ Nếu toàn âm: maxWrap = 0 → return maxNormal"]
    F --> H["✅ Đáp án!"]

    style D fill:#4CAF50,color:white
    style E fill:#2196F3,color:white
    style G fill:#FF9800,color:white
```

### Edge Case: Mảng toàn âm!

```
  ⚠️ CRITICAL EDGE CASE!

  arr = [-3, -2, -1]
  totalSum = -6
  minSubarraySum = toàn bộ mảng = -6

  maxWrap = totalSum - minSubarraySum = -6 - (-6) = 0

  Nhưng subarray phải NON-EMPTY! → 0 KHÔNG HỢP LỆ!
  (0 nghĩa là bỏ HẾT mảng → subarray rỗng!)

  → Khi totalSum === minSubarraySum → TOÀN ÂM → return maxNormal!
  → maxNormal = -1 (Kadane's thường tìm đúng số ít âm nhất)

  CÁCH PHÁT HIỆN:
    totalSum === minSubarraySum
    → mảng toàn âm (hoặc tổng = 0 nhưng minSub = totalSum)
    → Wrap case vô nghĩa → chỉ dùng Kadane's thường!
```

---

## 🧭 Luồng Suy Nghĩ — Từ đọc đề đến solution

### Bước 1: Đọc đề → Keywords

```
  Đề: "Maximum sum of non-empty subarray in a circular array"

  Gạch chân:
    ✏️ "circular"    → wrap around!
    ✏️ "subarray"    → LIÊN TIẾP → Kadane's family!
    ✏️ "maximum sum" → optimization
    ✏️ "non-empty"   → ít nhất 1 phần tử!

  🧠 Trigger:
    "circular array" → totalSum - opposite!
    "max subarray" → Kadane's Algorithm!
    → Combine: Kadane's max + Kadane's min!
```

### Bước 2: Vẽ ví dụ → Tìm pattern

```
  arr = [4, -1, -2, 3]

  Linear: max = [4] = 4
  Wrap:   max = [3, 4] = 7 (bỏ [-1, -2] ở giữa!)
  totalSum = 4, minSubarray = -3
  maxWrap = 4 - (-3) = 7 ✅

  📌 PATTERN: maxWrap = totalSum - minSubarraySum
```

### Bước 3: Cây quyết định

```mermaid
flowchart TD
    START["🧠 Max Circular Subarray Sum?"] --> Q1["Tính totalSum"]
    Q1 --> Q2["Kadane's MAX → maxNormal"]
    Q1 --> Q3["Kadane's MIN → minSub"]
    Q2 --> Q4["maxWrap = totalSum - minSub"]
    Q3 --> Q4
    Q4 --> Q5{"totalSum === minSub?"}
    Q5 -->|"YES: toàn âm!"| Q6["return maxNormal"]
    Q5 -->|"NO"| Q7["return max(maxNormal, maxWrap)"]

    style Q6 fill:#FF9800,color:white
    style Q7 fill:#4CAF50,color:white
```

---

## E — Examples

```
VÍ DỤ 1: arr = [8, -8, 9, -9, 10, -11, 12]

  totalSum = 11
  Kadane's max: [12] = 12 → maxNormal = 12
  Kadane's min: [-11] → minSubarray = -11
  maxWrap = 11 - (-11) = 22

  Đáp án = max(12, 22) = 22 ✅
  Wrap subarray: [12, 8, -8, 9, -9, 10] (bỏ [-11])
```

```
VÍ DỤ 2: arr = [4, -1, -2, 3]

  totalSum = 4
  Kadane's max: [4] = 4 → maxNormal = 4
  Kadane's min: [-1, -2] = -3 → minSubarray = -3
  maxWrap = 4 - (-3) = 7

  Đáp án = max(4, 7) = 7 ✅
  Wrap subarray: [3, 4] (bỏ [-1, -2])
```

```
VÍ DỤ 3: arr = [5, -2, 3, 4]

  totalSum = 10
  Kadane's max: [5, -2, 3, 4] = 10 → maxNormal = 10
  Kadane's min: [-2] → minSubarray = -2
  maxWrap = 10 - (-2) = 12

  Đáp án = max(10, 12) = 12 ✅
  Wrap subarray: [3, 4, 5] (bỏ [-2])
```

```
VÍ DỤ 4 (EDGE): arr = [-3, -2, -1]    (toàn âm!)

  totalSum = -6
  Kadane's max: [-1] → maxNormal = -1
  Kadane's min: [-3, -2, -1] = -6
  maxWrap = -6 - (-6) = 0

  ⚠️ totalSum === minSubarray → TOÀN ÂM!
  → Return maxNormal = -1 ✅
```

```
VÍ DỤ 5 (Edge): arr = [1, 2, 3]    (toàn dương)

  totalSum = 6
  Kadane's max: [1, 2, 3] = 6 → maxNormal = 6
  Kadane's min: [1] = 1 → minSubarray = 1
  maxWrap = 6 - 1 = 5

  Đáp án = max(6, 5) = 6 ✅ → Không wrap! Lấy hết mảng!
```

### Trace dạng bảng — VD chi tiết

```
  arr = [8, -8, 9, -9, 10, -11, 12]    n=7

  ═══ Kadane's MAX + MIN đồng thời ═══════════════════

  ┌───────┬──────┬────────────┬────────┬────────────┬─────────┐
  │ i     │ a[i] │ maxEndHere │ maxNorm│ minEndHere │ minSub  │
  ├───────┼──────┼────────────┼────────┼────────────┼─────────┤
  │ init  │  8   │ 8          │ 8      │ 8          │ 8       │
  │ 1     │ -8   │ max(-8,0)=0│ 8      │ min(-8,0)=-8│ -8     │
  │ 2     │  9   │ max(9,9)=9 │ 9      │ min(9,1)=1 │ -8      │
  │ 3     │ -9   │ max(-9,0)=0│ 9      │ min(-9,-8)=-9│ -9    │
  │ 4     │ 10   │ max(10,10)=10│ 10   │ min(10,1)=1│ -9      │
  │ 5     │ -11  │ max(-11,-1)=-1│ 10  │ min(-11,-10)=-11│-11  │
  │ 6     │ 12   │ max(12,11)=12│ 12   │ min(12,1)=1│ -11     │
  └───────┴──────┴────────────┴────────┴────────────┴─────────┘

  totalSum = 11
  maxNormal = 12, minSubarray = -11
  maxWrap = 11 - (-11) = 22
  Đáp án = max(12, 22) = 22 ✅
```

---

## A — Approach

### Approach 1: Brute Force — O(n²)

```
  Thử MỌI subarray (bao gồm wrap around):

  for start = 0 → n-1:
    sum = 0
    for len = 1 → n:
      index = (start + len - 1) % n    ← wrap bằng modulo!
      sum += arr[index]
      maxSum = max(maxSum, sum)

  ✅ Đúng, dễ hiểu
  ❌ O(n²)
```

### Approach 2: Kadane's max + min — O(n) ⭐

```
  Case 1: Max subarray KHÔNG wrap → Kadane's max
  Case 2: Max subarray CÓ wrap → totalSum - Kadane's min
  Đáp án = max(case1, case2)
  ⚠️ Edge: toàn âm → chỉ dùng case 1!

  Time: O(n)    Space: O(1)
```

---

## C — Code ✅

### Solution 1: Brute Force — O(n²)

```javascript
function maxCircularSubarraySumBrute(arr) {
  const n = arr.length;
  let maxSum = -Infinity;

  for (let i = 0; i < n; i++) {
    let currentSum = 0;
    for (let j = 0; j < n; j++) {
      currentSum += arr[(i + j) % n]; // % n để wrap around!
      maxSum = Math.max(maxSum, currentSum);
    }
  }
  return maxSum;
}
```

### Solution 2: Kadane's max + min — O(n) ⭐

```javascript
function maxCircularSubarraySum(arr) {
  let totalSum = 0;
  let maxEndHere = arr[0], maxNormal = arr[0];
  let minEndHere = arr[0], minSub = arr[0];

  totalSum = arr[0];

  for (let i = 1; i < arr.length; i++) {
    totalSum += arr[i];

    // Kadane's max
    maxEndHere = Math.max(arr[i], maxEndHere + arr[i]);
    maxNormal = Math.max(maxNormal, maxEndHere);

    // Kadane's min
    minEndHere = Math.min(arr[i], minEndHere + arr[i]);
    minSub = Math.min(minSub, minEndHere);
  }

  // Edge case: toàn âm
  if (totalSum === minSub) return maxNormal;

  return Math.max(maxNormal, totalSum - minSub);
}
```

---

## 🔬 Deep Dive — Giải thích CHI TIẾT từng dòng

> 💡 Phân tích **từng dòng** để hiểu **TẠI SAO**.

```javascript
function maxCircularSubarraySum(arr) {
  // ═══════════════════════════════════════════════════════════
  // Khởi tạo 5 biến — TẤT CẢ = arr[0]!
  // ═══════════════════════════════════════════════════════════
  //
  // TẠI SAO arr[0] không phải 0?
  //   → Nếu init = 0: max(0, -3) = 0 → SAI cho mảng toàn âm!
  //   → arr[0] = base case (subarray 1 phần tử đầu tiên)
  //
  let totalSum = 0;
  let maxEndHere = arr[0], maxNormal = arr[0];
  let minEndHere = arr[0], minSub = arr[0];

  totalSum = arr[0];

  for (let i = 1; i < arr.length; i++) {
    // ═══════════════════════════════════════════════════════
    // totalSum: cộng dồn TOÀN BỘ mảng
    // ═══════════════════════════════════════════════════════
    //
    // Cần cho công thức: maxWrap = totalSum - minSub
    //
    totalSum += arr[i];

    // ═══════════════════════════════════════════════════════
    // Kadane's MAX — Case 1 (không wrap)
    // ═══════════════════════════════════════════════════════
    //
    // maxEndHere = max(arr[i], maxEndHere + arr[i])
    //   → "BẮT ĐẦU LẠI từ arr[i]" hay "TIẾP TỤC cộng dồn?"
    //   → Nếu cộng dồn < bắt đầu lại → bắt đầu lại!
    //
    // maxNormal = max(maxNormal, maxEndHere)
    //   → Track MAX toàn cục!
    //
    maxEndHere = Math.max(arr[i], maxEndHere + arr[i]);
    maxNormal = Math.max(maxNormal, maxEndHere);

    // ═══════════════════════════════════════════════════════
    // Kadane's MIN — cho Case 2 (wrap)
    // ═══════════════════════════════════════════════════════
    //
    // GIỐNG Kadane's MAX nhưng ĐẢO max → min!
    //
    // minEndHere = min(arr[i], minEndHere + arr[i])
    //   → Tìm subarray có TỔNG NHỎ NHẤT!
    //   → "BẮT ĐẦU LẠI" hay "TIẾP TỤC trừ dồn?"
    //
    // minSub = min(minSub, minEndHere)
    //   → Track MIN toàn cục!
    //
    // TẠI SAO cần min?
    //   maxWrap = totalSum - minSub
    //   → Bỏ phần NHỎ nhất ở giữa = Giữ phần LỚN nhất ở 2 đầu!
    //
    minEndHere = Math.min(arr[i], minEndHere + arr[i]);
    minSub = Math.min(minSub, minEndHere);
  }

  // ═══════════════════════════════════════════════════════════
  // Edge case: TOÀN ÂM!
  // ═══════════════════════════════════════════════════════════
  //
  // totalSum === minSub có nghĩa:
  //   → minSubarray = toàn bộ mảng!
  //   → maxWrap = totalSum - totalSum = 0
  //   → 0 = subarray RỖNG → KHÔNG HỢP LỆ!
  //
  // TẠI SAO toàn âm → minSub = totalSum?
  //   → Kadane's min sẽ lấy TOÀN BỘ mảng (vì tất cả đều âm!)
  //   → minSub = Σarr[i] = totalSum
  //
  // → Phải return maxNormal (số ÍT ÂM NHẤT!)
  //
  if (totalSum === minSub) return maxNormal;

  // ═══════════════════════════════════════════════════════════
  // Kết quả: max(Case1, Case2)
  // ═══════════════════════════════════════════════════════════
  //
  // maxNormal = Kadane's max (Case 1: không wrap)
  // totalSum - minSub = maxWrap (Case 2: wrap!)
  //
  return Math.max(maxNormal, totalSum - minSub);
}
```

```mermaid
flowchart TD
    subgraph FLOW["⭐ Algorithm Flow"]
        A["Init: totalSum, max, min = arr[0]"] --> B["for i = 1 → n-1"]
        B --> C["totalSum += arr[i]"]
        C --> D["Kadane MAX:\nmaxEndHere, maxNormal"]
        C --> E["Kadane MIN:\nminEndHere, minSub"]
        D --> F{"i < n?"}
        E --> F
        F -->|"YES"| B
        F -->|"NO"| G{"totalSum = minSub?"}
        G -->|"YES: toàn âm"| H["return maxNormal"]
        G -->|"NO"| I["return max(maxNormal,\ntotalSum - minSub)"]
    end

    style D fill:#4CAF50,color:white
    style E fill:#2196F3,color:white
    style H fill:#FF9800,color:white
    style I fill:#4CAF50,color:white
```

---

## 📐 Invariant — Chứng minh tính đúng đắn

```
  📐 INVARIANT:

  Sau khi duyệt đến index i:
    maxNormal = max subarray sum trong arr[0..i] (không wrap)
    minSub = min subarray sum trong arr[0..i]
    totalSum = Σ arr[0..i]

  CHỨNG MINH Case 1 (correctness of Kadane's max):
  ┌──────────────────────────────────────────────────────────────┐
  │  maxEndHere = max sum subarray KẾT THÚC tại index i         │
  │  maxNormal = max trên tất cả maxEndHere → global max!       │
  │  → Đúng bởi Kadane's Algorithm (đã chứng minh!)  ∎          │
  └──────────────────────────────────────────────────────────────┘

  CHỨNG MINH Case 2 (wrap = totalSum - minSubarray):
  ┌──────────────────────────────────────────────────────────────┐
  │  Wrap subarray = arr[k..n-1] ∪ arr[0..j] (k > j)            │
  │                                                              │
  │  wrapSum = Σarr[k..n-1] + Σarr[0..j]                        │
  │         = totalSum - Σarr[j+1..k-1]                          │
  │                                                              │
  │  Phần bỏ: arr[j+1..k-1] = 1 subarray liên tiếp ở GIỮA     │
  │                                                              │
  │  max(wrapSum) = max(totalSum - Σarr[j+1..k-1])              │
  │               = totalSum - min(Σarr[j+1..k-1])              │
  │               = totalSum - minSubarraySum                     │
  │                                                              │
  │  → minSubarraySum = Kadane's min → ĐÚNG!  ∎                  │
  └──────────────────────────────────────────────────────────────┘

  CHỨNG MINH Edge Case (toàn âm):
  ┌──────────────────────────────────────────────────────────────┐
  │  Nếu tất cả arr[i] < 0:                                     │
  │    Kadane's min lấy TOÀN BỘ mảng → minSub = totalSum       │
  │    maxWrap = totalSum - totalSum = 0                          │
  │    → 0 = subarray rỗng → INVALID (non-empty required!)      │
  │                                                              │
  │  Detect: totalSum === minSub                                  │
  │  Fix: return maxNormal (Kadane's max tìm đúng element lớn nhất) │
  │  → maxNormal = max(arr[i]) = số ÍT ÂM nhất!  ∎              │
  └──────────────────────────────────────────────────────────────┘

  📐 COMPLETENESS:
    Mọi subarray (wrap hoặc không):
    - Không wrap: covered by Case 1 (Kadane's max)
    - Wrap: covered by Case 2 (totalSum - Kadane's min)
    → Đáp án = max(Case1, Case2) → ĐÚNG!  ∎
```

---

## ❌ Common Mistakes — Lỗi thường gặp

```mermaid
graph TD
    START["🚨 Common Mistakes"] --> M1["Mistake #1\nQuên edge\ntoàn âm"]
    START --> M2["Mistake #2\nNối mảng\n2 lần"]
    START --> M3["Mistake #3\nInit = 0\nthay arr[0]"]
    START --> M4["Mistake #4\nNegate array\ncho min"]
    START --> M5["Mistake #5\nQuên non-empty\nconstraint"]

    M1 --> M1a["❌ max(-1,0)=0\nsubarray rỗng!"]
    M1 --> M1b["✅ totalSum=minSub\n→ return maxNormal"]

    M2 --> M2a["❌ arr+arr:\nsubarray > n!"]
    M2 --> M2b["✅ totalSum-minSub:\nno duplication!"]

    M3 --> M3a["❌ init=0:\ntoàn âm → max=0"]
    M3 --> M3b["✅ init=arr[0]:\nbase case!"]

    M4 --> M4a["❌ negate+max:\nO(n) extra space"]
    M4 --> M4b["✅ Kadane min:\nO(1) space"]

    M5 --> M5a["❌ Bỏ hết mảng\n→ wrap sum=0"]
    M5 --> M5b["✅ Check\ntotalSum=minSub"]

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

### Mistake 1: Quên edge case TOÀN ÂM!

```javascript
// ❌ SAI: return max(maxNormal, maxWrap)!
return Math.max(maxNormal, totalSum - minSub);
// arr = [-3,-2,-1]: max(-1, 0) = 0 → SAI! (subarray rỗng!)

// ✅ ĐÚNG: check trước!
if (totalSum === minSub) return maxNormal;
return Math.max(maxNormal, totalSum - minSub);
// arr = [-3,-2,-1]: return -1 ✅
```

### Mistake 2: Nối mảng 2 lần!

```javascript
// ❌ SAI: nối arr+arr rồi Kadane's!
const doubled = [...arr, ...arr];
let maxEndHere = doubled[0], maxSum = doubled[0];
for (let i = 1; i < 2 * n; i++) {
  maxEndHere = Math.max(doubled[i], maxEndHere + doubled[i]);
  maxSum = Math.max(maxSum, maxEndHere);
}
// VẤN ĐỀ: subarray có thể dài > n → lấy TRÙNG phần tử!
// Phải thêm constraint max length = n → PHỨC TẠP!

// ✅ ĐÚNG: totalSum - minSubarray → ĐƠN GIẢN!
```

### Mistake 3: Khởi tạo = 0!

```javascript
// ❌ SAI: init = 0!
let maxEndHere = 0, maxNormal = 0;
// arr = [-3,-2,-1]: max(0, -3) = 0 → maxNormal = 0 → SAI!

// ✅ ĐÚNG: init = arr[0], duyệt từ i=1!
let maxEndHere = arr[0], maxNormal = arr[0];
// arr = [-3,-2,-1]: maxNormal = -1 ✅
```

### Mistake 4: Negate array cho min!

```javascript
// ❌ KHÔNG SAI nhưng tốn space:
const negated = arr.map(x => -x);  // O(n) space!
// Kadane's max trên negated → negate result = Kadane's min

// ✅ ĐÚNG: Kadane's min trực tiếp → O(1) space!
minEndHere = Math.min(arr[i], minEndHere + arr[i]);
minSub = Math.min(minSub, minEndHere);
```

### Mistake 5: Quên non-empty constraint!

```
  maxWrap = totalSum - minSubarray

  Nếu minSubarray = totalSum → bỏ HẾT mảng!
  → Wrap subarray = RỖNG → vi phạm non-empty!

  📌 LUÔN check: totalSum === minSub → return maxNormal!
```

---

## O — Optimize

```
                    Time      Space          Ghi chú
  ───────────────────────────────────────────────────
  Brute Force       O(n²)     O(1)           Modulo wrap
  Kadane max+min ⭐  O(n)      O(1)           Tối ưu!
```

### Complexity chính xác — Đếm operations

```
  Kadane max + min (1 pass):
    n additions (totalSum)
    n max operations (Kadane's max: maxEndHere)
    n max operations (maxNormal)
    n min operations (Kadane's min: minEndHere)
    n min operations (minSub)
    1 comparison (totalSum vs minSub)
    1 max operation (final answer)
    TỔNG: 5n + 2 operations, 5 variables

  📊 So sánh (n = 10⁶):
    Kadane: 5×10⁶ ops, 40 bytes ⭐
    Brute:  10¹² ops 💀

  📌 O(n) là TỐI ƯU: Ω(n) lower bound (phải đọc mọi element!)
```

---

## T — Test

```
Test Cases:
  [8, -8, 9, -9, 10, -11, 12] → 22  ✅ wrap [12, 8, -8, 9, -9, 10]
  [4, -1, -2, 3]               → 7   ✅ wrap [3, 4]
  [5, -2, 3, 4]                → 12  ✅ wrap [3, 4, 5]
  [-3, -2, -1]                 → -1  ✅ toàn âm
  [1, 2, 3]                    → 6   ✅ toàn dương, lấy hết
  [5]                          → 5   ✅ 1 phần tử
  [-1]                         → -1  ✅ 1 phần tử âm
  [3, -1, 2, -1]              → 4   ✅ wrap [2,-1,3] or no-wrap [3,-1,2]
  [10, -3, -4, 7, 6, 5, -4, -1] → 23 ✅ wrap
```

---

## 🗣️ Interview Script

### 🎙️ Think Out Loud — Mô phỏng phỏng vấn thực

> ⚠️ Script này dạy cách **NÓI**, không phải cách CODE.
> Mỗi đoạn = cách bạn **PHÁT BIỂU** trong phỏng vấn thực!

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  🕐 FULL INTERVIEW SIMULATION — 1h30 (90 phút)             ║
  ║                                                              ║
  ║  00:00-05:00  Introduction + Icebreaker         (5 min)     ║
  ║  05:00-45:00  Problem Solving                   (40 min)    ║
  ║  45:00-60:00  Deep Technical Probing            (15 min)    ║
  ║  60:00-75:00  Variations + Extensions           (15 min)    ║
  ║  75:00-85:00  System Design at Scale            (10 min)    ║
  ║  85:00-90:00  Behavioral + Q&A                  (5 min)     ║
  ╚══════════════════════════════════════════════════════════════╝
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 1: INTRODUCTION (00:00 — 05:00)                       ║
  ╚══════════════════════════════════════════════════════════════╝

  👤 "Tell me about yourself and a time you combined
      two algorithms to solve something neither could
      handle alone."

  🧑 "I'm a frontend engineer with [X] years of experience.
      A concrete example: I built a trend detection module
      for a circular time-series dashboard — think hourly
      stats wrapping midnight. I needed the max-gain window,
      which could span across midnight.

      Kadane's alone only finds contiguous windows inside
      a linear array. To handle wrap-around, I realized:
      a wrap window = total minus the worst contiguous window.
      So I ran Kadane's max and Kadane's min simultaneously
      in one pass. O(n) time, O(1) space.

      That is exactly Maximum Circular Subarray Sum."

  👤 "Great instinct. Let's formalize."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 2: PROBLEM SOLVING (05:00 — 45:00)                   ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 05:00 — Clarify (3 phút) ────────────────

  👤 "Find the maximum subarray sum in a circular array."

  🧑 "Let me clarify.

      Circular: the last element connects to the first.
      The subarray can span this boundary — it wraps.

      Must be non-empty: we can't take zero elements.

      Array can have both positive and negative numbers.

      The answer is the maximum sum across ALL possible
      contiguous subarrays, including wrap-around ones."

  ──────────────── 08:00 — Donut Analogy (2 phút) ──────────

  🧑 "I visualize this as a DONUT.

      A linear array is a stick of dough.
      A circular array bends that stick into a donut.

      A subarray is a contiguous slice.
      Non-wrapping: a slice that stays on one arc.
      Wrapping: a slice that includes both ends —
      it's like cutting a piece that goes across the
      point where the dough was joined.

      Question: what is the max-sum slice of the donut?
      Two cases: one arc (no wrap), or cross-join (wrap)."

  ──────────────── 10:00 — Brute Force (3 phút) ────────────

  🧑 "Brute force: try every possible subarray.

      For each start index i from 0 to n minus 1,
      extend the subarray using index (i+j) mod n
      for j from 1 to n. Track maximum sum seen.

      Time: O of n squared. Space: O of 1.
      For n equals 10 to the 5: 10 to the 10 operations.
      Need a better approach."

  ──────────────── 13:00 — Decompose into 2 Cases (4 phút) ─

  🧑 "Key insight: EVERY valid subarray is one of two types.

      Case 1: Does NOT wrap. Standard Kadane's max.

      Case 2: DOES wrap. This subarray crosses the boundary.
      It includes elements from the end AND the beginning.
      The part we EXCLUDE is a contiguous subarray in the
      middle. To maximize what we keep, we minimize what
      we exclude.

      maxWrap = totalSum minus minSubarraySum.

      And minSubarraySum = Kadane's min,
      just like Kadane's max but swap every max for min.

      Answer = max of Case 1 and Case 2."

  ──────────────── 17:00 — Derive minSub = Kadane's min (2 phút) ─

  🧑 "Why is the excluded middle = Kadane's min?

      The wrap subarray includes arr[k..n-1] and arr[0..j].
      Its sum = totalSum minus arr[j+1..k-1].
      The part arr[j+1..k-1] is a CONTIGUOUS subarray.

      To maximize the wrap sum, I minimize arr[j+1..k-1].
      That minimum contiguous subarray sum is Kadane's min.

      So: maxWrap = totalSum - Kadane's min. Exact!"

  ──────────────── 19:00 — Edge Case ALL NEGATIVE (3 phút) ─

  🧑 "Critical edge case: all elements negative.

      Kadane's min will pick the ENTIRE array — because
      every element is negative, the minimum sum is the
      sum of all elements.

      So maxWrap = totalSum - totalSum = 0.
      But 0 means an empty subarray — invalid!

      Detection: if totalSum equals minSub,
      the 'exclude nothing' scenario is triggered,
      meaning all elements are negative.
      In that case, return maxNormal only.

      Verify: arr = [-3, -2, -1].
      Kadane's max = -1. totalSum = -6. minSub = -6.
      totalSum === minSub → return -1. Correct!"

  ──────────────── 22:00 — Write Code (5 phút) ──────────────

  🧑 "The code — single pass, 5 variables.

      Initialize ALL to arr[0], totalSum to arr[0].

      For i from 1 to n minus 1:
        totalSum plus-equals arr[i].

        Kadane's max:
        maxEndHere = max of arr[i] and maxEndHere plus arr[i].
        maxNormal = max of maxNormal and maxEndHere.

        Kadane's min:
        minEndHere = min of arr[i] and minEndHere plus arr[i].
        minSub = min of minSub and minEndHere.

      If totalSum equals minSub: return maxNormal.
      Return max of maxNormal and totalSum minus minSub."

  ──────────────── 27:00 — Trace example (4 phút) ───────────

  🧑 "Trace with [4, -1, -2, 3].

      totalSum = 4. All init = 4.

      i=1, arr[i]=-1: totalSum=3.
        maxEndHere = max(-1, 4-1) = 3. maxNormal = 4.
        minEndHere = min(-1, 4-1) = -1. minSub = -1.

      i=2, arr[i]=-2: totalSum=1.
        maxEndHere = max(-2, 3-2) = 1. maxNormal = 4.
        minEndHere = min(-2, -1-2) = -3. minSub = -3.

      i=3, arr[i]=3: totalSum=4.
        maxEndHere = max(3, 1+3) = 4. maxNormal = 4.
        minEndHere = min(3, -3+3) = 0. minSub = -3.

      totalSum=4, minSub=-3. 4 ≠ -3.
      maxWrap = 4 - (-3) = 7.
      Answer = max(4, 7) = 7.

      Verify: wrap [3, 4] = 7. Correct!"

  ──────────────── 31:00 — Complexity + Edge Cases (4 phút) ─

  🧑 "Time: O of n. One single pass.
      Space: O of 1. Five variables total.

      Why O(n) is optimal: must read every element.
      Omega of n lower bound holds.

      Edge cases:
      Single element [5]: only one rotation, return 5.
      All positive [1,2,3]: no wrap needed, return 6.
      All negative [-3,-2,-1]: totalSum=minSub, return -1.
      Mixed with 0: works correctly, 0 is valid in sums."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 3: DEEP TECHNICAL PROBING (45:00 — 60:00)            ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 45:00 — Why not double the array? (4 phút) ─

  👤 "What about concatenating arr+arr, then Kadane's?"

  🧑 "It works but has problems.

      One: the maximum subarray from Kadane's on arr+arr
      might be longer than n elements.
      That means repeating elements — invalid.
      I'd need an extra constraint: window length at most n.
      That makes the code significantly more complex.

      Two: O of n space for the doubled array.

      The totalSum minus minSub approach:
      no extra space, automatically non-empty,
      handles the circular property cleanly.
      Strictly superior."

  ──────────────── 49:00 — Prove completeness (4 phút) ───────

  👤 "How do you know Case 1 + Case 2 covers every subarray?"

  🧑 "Any non-empty contiguous subarray of a circular array
      is either:

      Case 1: a subarray arr[i..j] where i ≤ j.
      This is a standard linear subarray. Covered by Kadane's max.

      Case 2: a subarray that wraps — it includes
      indices from some suffix arr[k..n-1] AND some
      prefix arr[0..j] where k > j.
      Its complement is arr[j+1..k-1], a linear subarray.
      Maximizing case 2 = minimizing the complement.
      Covered by totalSum - Kadane's min.

      The only subarray NOT in Case 2 is the full array.
      But the full array is also in Case 1 when Kadane's max
      equals totalSum.

      No subarray escapes these two cases. Complete!"

  ──────────────── 53:00 — Why init = arr[0], not 0? (3 phút) ─

  👤 "Why initialize maxEndHere to arr[0] and not 0?"

  🧑 "The subarray must be non-empty.
      Initializing to 0 means 'the empty subarray has sum 0.'

      Consider arr = [-3, -2, -1].
      If I init to 0: Kadane's gives max(0, -3, ...) = 0.
      But 0 is the empty subarray — invalid.
      The correct answer is -1.

      Initializing to arr[0] sets the base case as
      'the single-element subarray containing arr[0].'
      Then the loop extends or resets from there.
      Handles all-negative correctly."

  ──────────────── 56:00 — What if minSub < totalSum edge (2 phút) ─

  👤 "Is it possible that totalSum < minSub?"

  🧑 "No. By definition, minSub is the minimum sum
      of any contiguous non-empty subarray.
      The full array is a valid subarray with sum totalSum.
      So minSub ≤ totalSum always.

      equality: minSub = totalSum means the minimum subarray
      is the full array — only happens when all elements
      are non-positive (all negative or zero)."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 4: VARIATIONS (60:00 — 75:00)                         ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 60:00 — Min Circular Subarray Sum (3 phút) ─

  👤 "What about the MIN circular subarray sum?"

  🧑 "Flip the cases.

      Case 1: min NOT wrapping = Kadane's min.
      Case 2: min wrapping = totalSum - Kadane's max.

      Edge case: all positive elements.
      Kadane's max = totalSum → wrap = 0 (empty).
      Detect: if totalSum equals maxNormal, return minNormal.

      totalSum minus maxNormal = min wrap.
      Answer = min of case 1 and case 2.

      Symmetric to the max version!"

  ──────────────── 63:00 — Max circular PRODUCT (4 phút) ─────

  👤 "What about max PRODUCT circular subarray?"

  🧑 "Much harder. Two key differences.

      First: product is not a linear combination.
      The 'exclude minimum' trick doesn't apply because
      you can't separate product the way you separate sums.
      totalProduct divided by minProduct is not the answer
      when minProduct is negative.

      Second: negative times negative is positive.
      So tracking only max product misses opportunities.
      Kadane's for max product must track BOTH max and min
      at each step, and swap them when encountering a negative.

      For circular max product: we'd need to track four values
      (max and min product for both subarrays ending at each
      position) plus handle the circular wrap separately.
      O(n) but significantly more complex to prove correct."

  ──────────────── 67:00 — Return actual subarray indices (4 phút) ─

  👤 "What if you need to return the actual subarray?"

  🧑 "For Case 1 (no wrap), track start index of the
      current Kadane's window and the best window.

      Standard extension: when maxEndHere resets to arr[i],
      note that as the new window start.

      For Case 2 (wrap), the kept subarray is
      the complement of the minimum-sum subarray.
      If the min subarray is arr[minStart..minEnd],
      the wrap subarray is arr[minEnd+1..n-1] ∪ arr[0..minStart-1].

      So I also track the start and end of the min subarray
      in the Kadane's min pass."

  ──────────────── 71:00 — Streaming variant (3 phút) ────────

  👤 "What if elements arrive in a stream?"

  🧑 "For true streaming on a circular structure,
      we need to know n upfront to define the circular wrap.

      One approach: buffer the last n elements.
      When a new element arrives, apply one step of both
      Kadane's passes. Recompute totalSum incrementally.
      But rechecking the wrap case requires knowing the
      current total of the window — complex.

      Practically: this problem is better suited for
      batch processing when n is fixed."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 5: SYSTEM DESIGN AT SCALE (75:00 — 85:00)            ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 75:00 — Real-world applications (5 phút) ────

  👤 "Where does this problem appear in real systems?"

  🧑 "Many domains.

      First — CIRCULAR TIME SERIES.
      Hourly metrics wrapping midnight. Find the
      max-gain hour window, which might cross midnight.
      Circular subarray sum directly models this.

      Second — TRADING ALGORITHMS.
      Stock price deltas in a rolling 24-hour window.
      The 'best trading window' within the circular day
      corresponds to max circular subarray sum.

      Third — NETWORK BANDWIDTH.
      Packet arrival rates in a circular buffer.
      Find the time window with highest throughput.

      Fourth — CIRCULAR SHIFT SCHEDULING.
      Worker shifts in a circular schedule.
      Find the shift block with maximum productivity score."

  ──────────────── 80:00 — Scaling (5 phút) ────────────────

  👤 "How would you handle n = 10⁸ elements?"

  🧑 "Single-pass O(n), O(1) space — scales naturally.
      For n = 10⁸: roughly 5 × 10⁸ operations, ~2 seconds.

      If the array is distributed across machines:
      This is harder. The circular subarray CAN span
      the boundary between shards.

      Approach: solve locally per shard first.
      Then handle the cross-boundary wrap explicitly:
      each shard stores its prefix max/min, suffix max/min,
      and totalSum. The coordinator merges these to find
      the optimal wrap window that crosses shard boundaries.

      This is a segment tree reduce in structure —
      O(log k) merge steps where k = number of shards."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 6: BEHAVIORAL + Q&A (85:00 — 90:00)                  ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 85:00 — Reflection (3 phút) ────────────────

  👤 "What's the most important insight here?"

  🧑 "Three things.

      First, DECOMPOSE INTO CASES.
      'Circular' seems to break Kadane's.
      But splitting into 'wrap' and 'no wrap' reduces
      each case to a well-known problem.
      Case 2 is just Kadane's min in disguise.

      Second, 'BỎ MIN Ở GIỮA = GIỮ MAX Ở 2 ĐẦU'.
      The wrap sum = totalSum minus the excluded middle.
      To maximize what you keep, minimize what you throw away.
      This reframe converts Case 2 into Kadane's min.

      Third, INIT = arr[0], NOT 0.
      The non-empty subarray constraint means 0
      is never a valid 'empty' base case.
      Always init Kadane's variables to the first element."

  ──────────────── 88:00 — Questions (2 phút) ────────────────

  👤 "Any questions for me?"

  🧑 "A few!

      First — the circular array pattern appears in
      scheduling and time-series systems.
      Does your product deal with wrap-around data?
      Have you encountered this exact problem in production?

      Second — the all-negative edge case requires
      a special-case check. These 'gotcha' edge cases
      are hard to spot under pressure.
      How does your team validate edge-case coverage
      during interviews or code reviews?

      Third — this solution runs Kadane's max and min
      simultaneously in one pass. Do you value this
      kind of constant-factor optimization, or do you
      prioritize code clarity over merged passes?"

  👤 "Excellent session! The donut analogy made the
      circular property immediately visual. The proof
      that totalSum minus minSub covers all wrap cases
      was mathematically rigorous. The all-negative edge
      case handling showed careful correctness thinking.
      We'll be in touch!"
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  ⭐ 8 MẸO NÓI CHUYỆN (Maximum Circular Subarray Sum)      ║
  ╚══════════════════════════════════════════════════════════════╝

  📌 MẸO #1: Donut analogy immediately
     ✅ "Wrap subarray = slice crossing the join point.
         Excludes a contiguous middle piece."

  📌 MẸO #2: State the 2-case decomposition
     ✅ "Case 1: no wrap → Kadane's max.
         Case 2: wrap → totalSum - Kadane's min."

  📌 MẸO #3: Explain WHY totalSum - minSub
     ✅ "Keeping max at both ends = removing min in middle.
         'Bỏ min ở giữa = giữ max ở 2 đầu!'"

  📌 MẸO #4: State the all-negative edge case
     ✅ "If totalSum = minSub, all elements are negative.
         Wrap case gives 0 (empty). Return maxNormal only."

  📌 MẸO #5: Init = arr[0], not 0
     ✅ "Subarray must be non-empty.
         Init to 0 breaks all-negative arrays."

  📌 MẸO #6: Why not double the array?
     ✅ "arr+arr requires window length ≤ n constraint.
         totalSum - minSub is cleaner: O(1) space, no padding."

  📌 MẸO #7: Both Kadane's run simultaneously
     ✅ "One pass: 5 variables, O(n) time, O(1) space.
         Max and min tracked in the same for-loop."

  📌 MẸO #8: Connect to #918
     ✅ "LeetCode #918 = this problem exactly.
         Same code, same edge case."
```

---

## 📚 Bài tập liên quan — Practice Problems

### Progression Path

```mermaid
graph LR
    A["Kadane's\nAlgorithm"] -->|"circular"| B["⭐ Max Circular\nSubarray Sum\n(BÀI NÀY)"]
    B -->|"product"| C["#152 Max Product\nSubarray"]
    B -->|"rotation"| D["Max Sum\nRotation"]
    A -->|"min"| E["Min Subarray\nSum"]

    style B fill:#4CAF50,color:white
```

### 1. Maximum Subarray (#53) — Kadane's Classic

```
  Đề: Max subarray sum KHÔNG circular.

  function maxSubArray(nums) {
    let maxEndHere = nums[0], maxSoFar = nums[0];
    for (let i = 1; i < nums.length; i++) {
      maxEndHere = Math.max(nums[i], maxEndHere + nums[i]);
      maxSoFar = Math.max(maxSoFar, maxEndHere);
    }
    return maxSoFar;
  }

  📌 CƠ SỞ cho bài này! Phải hiểu trước!
```

### 2. Maximum Sum Circular Subarray (#918) — LeetCode version

```
  Đề: CÙNG BÀI! LeetCode version.

  function maxSubarraySumCircular(nums) {
    let totalSum = 0;
    let maxEnd = nums[0], maxSum = nums[0];
    let minEnd = nums[0], minSum = nums[0];

    totalSum = nums[0];

    for (let i = 1; i < nums.length; i++) {
      totalSum += nums[i];
      maxEnd = Math.max(nums[i], maxEnd + nums[i]);
      maxSum = Math.max(maxSum, maxEnd);
      minEnd = Math.min(nums[i], minEnd + nums[i]);
      minSum = Math.min(minSum, minEnd);
    }

    if (totalSum === minSum) return maxSum;
    return Math.max(maxSum, totalSum - minSum);
  }

  📌 LeetCode #918 = bài này!
```

### 3. Maximum Product Subarray (#152) — Medium

```
  Đề: Max PRODUCT (không phải sum!) subarray.

  function maxProduct(nums) {
    let maxP = nums[0], minP = nums[0], result = nums[0];
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] < 0) [maxP, minP] = [minP, maxP];  // swap!
      maxP = Math.max(nums[i], maxP * nums[i]);
      minP = Math.min(nums[i], minP * nums[i]);
      result = Math.max(result, maxP);
    }
    return result;
  }

  📌 Khác: track MIN product vì âm×âm=dương!
```

### 4. Min Subarray Sum

```
  Đề: Min subarray sum (Kadane's đảo).

  function minSubArray(nums) {
    let minEndHere = nums[0], minSoFar = nums[0];
    for (let i = 1; i < nums.length; i++) {
      minEndHere = Math.min(nums[i], minEndHere + nums[i]);
      minSoFar = Math.min(minSoFar, minEndHere);
    }
    return minSoFar;
  }

  📌 GIỐNG Kadane's max, đổi max→min! Dùng trong bài này!
```

### Tổng kết — Kadane's Family

```
  ┌──────────────────────────────────────────────────────────────┐
  │  BÀI                     │  Trick                           │
  ├──────────────────────────────────────────────────────────────┤
  │  #53 Max Subarray        │  Kadane's max                    │
  │  #918 Max Circular ⭐     │  max(Kadane max, S-Kadane min)  │
  │  #152 Max Product        │  track max AND min product       │
  │  Min Subarray            │  Kadane's min (swap max→min)    │
  │  Max Sum Rotation        │  Derive formula O(1)/rotation   │
  └──────────────────────────────────────────────────────────────┘

  📌 RULE:
    "Max subarray" → Kadane's!
    "Circular" → totalSum - opposite!
    "Product" → track BOTH max and min!
```

### Skeleton code — Reusable Circular pattern

```javascript
// TEMPLATE: Circular max/min subarray
function circularSubarray(arr, mode = 'max') {
  let totalSum = arr[0];
  let maxEnd = arr[0], maxSum = arr[0];
  let minEnd = arr[0], minSum = arr[0];

  for (let i = 1; i < arr.length; i++) {
    totalSum += arr[i];
    maxEnd = Math.max(arr[i], maxEnd + arr[i]);
    maxSum = Math.max(maxSum, maxEnd);
    minEnd = Math.min(arr[i], minEnd + arr[i]);
    minSum = Math.min(minSum, minEnd);
  }

  if (mode === 'max') {
    // Max circular subarray sum
    if (totalSum === minSum) return maxSum;
    return Math.max(maxSum, totalSum - minSum);
  } else {
    // Min circular subarray sum
    if (totalSum === maxSum) return minSum;
    return Math.min(minSum, totalSum - maxSum);
  }
}
```

---

## 📌 Kỹ năng chuyển giao — Pattern Summary

```mermaid
graph TD
    A["'Max subarray' → Kadane's"] --> B{"Circular?"}
    B -->|"NO"| C["Kadane's max\n(classic)"]
    B -->|"YES"| D["max(Kadane max,\ntotalSum - Kadane min)"]
    D --> E{"Toàn âm?"}
    E -->|"YES: S=minSub"| F["return Kadane max"]
    E -->|"NO"| G["return max(case1, case2)"]

    style D fill:#4CAF50,color:white
    style F fill:#FF9800,color:white
```

---

## 📊 Tổng kết — Key Insights

```mermaid
graph LR
    subgraph SUMMARY["📌 Tổng kết"]
        direction TB
        S1["1. Case1: Kadane max (no wrap)"] --> S2["2. Case2: totalSum - Kadane min (wrap)"]
        S2 --> S3["3. Toàn âm: chỉ dùng Case1"]
        S3 --> S4["4. max(Case1, Case2) → O(n)/O(1)"]
    end

    subgraph KEY["🔑 Key Insights"]
        K1["Kadane's cho\nmax subarray"]
        K2["Bỏ min ở giữa\n= giữ max ở 2 đầu"]
        K3["totalSum=minSub\n→ wrap = rỗng!"]
        K4["Init arr[0]\nKHÔNG PHẢI 0"]
    end

    S1 -.- K1
    S2 -.- K2
    S3 -.- K3
    S4 -.- K4

    style S2 fill:#2196F3,color:white
    style K2 fill:#E3F2FD,stroke:#2196F3
```

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  📌 3 ĐIỀU PHẢI NHỚ                                                    │
  │                                                                          │
  │  1. 2 CASES:                                                             │
  │     Case 1: Subarray KHÔNG wrap → Kadane's max thường!                 │
  │     Case 2: Subarray CÓ wrap → totalSum - Kadane's min!               │
  │     → Bỏ phần NHỎ NHẤT ở giữa = Giữ phần LỚN NHẤT ở 2 đầu!        │
  │     → KHÔNG cần nối mảng!                                              │
  │                                                                          │
  │  2. EDGE CASE — TOÀN ÂM:                                                │
  │     totalSum === minSubarray → wrap case = 0 (rỗng!)                   │
  │     → Phải return maxNormal!                                            │
  │     → Detect bằng: if (totalSum === minSub) return maxNormal           │
  │                                                                          │
  │  3. PATTERN: "CIRCULAR → totalSum - opposite!"                         │
  │     → Max circular = totalSum - min subarray                           │
  │     → Min circular = totalSum - max subarray                           │
  │     → Init = arr[0], KHÔNG PHẢI 0! (cho mảng toàn âm!)               │
  │     → Kadane's max + min chạy ĐỒNG THỜI trong 1 pass → O(n)/O(1)!    │
  └──────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Flashcard — Tự kiểm tra

| ❓ Câu hỏi | ✅ Đáp án |
|---|---|
| Circular subarray khác gì linear? | Có thể **WRAP** qua đuôi về đầu |
| 2 cases chính? | Case 1: không wrap (Kadane max), Case 2: wrap (**totalSum - Kadane min**) |
| Tại sao totalSum - minSubarray? | Bỏ phần **NHỎ** nhất ở giữa = Giữ phần **LỚN** nhất ở 2 đầu |
| Edge case quan trọng nhất? | **Toàn âm**: maxWrap = 0 (rỗng!) → return maxNormal |
| Cách detect toàn âm? | **totalSum === minSubarray** |
| Kadane's min khác max? | Đổi **max → min** trong công thức! |
| Init maxEndHere? | **arr[0]**, KHÔNG PHẢI 0! |
| Có cần nối mảng 2 lần? | **KHÔNG!** totalSum - minSubarray = đủ! |
| Time / Space? | **O(n)** / **O(1)** (5 biến) |
| LeetCode equivalent? | **#918** Maximum Sum Circular Subarray |
| Pattern khi gặp "circular"? | **totalSum - opposite!** |
| Max product subarray khác gì? | Track **BOTH** max AND min product (âm×âm=dương!) |
