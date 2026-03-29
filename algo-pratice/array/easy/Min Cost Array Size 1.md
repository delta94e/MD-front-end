# 💰 Minimum Cost to Make Array Size 1 — GfG (Easy)

> 📖 Code: [Min Cost Array Size 1.js](./Min%20Cost%20Array%20Size%201.js)

```mermaid
graph TD
    A["💰 Min Cost Array Size 1"] --> B["Tìm MIN trong array"]
    B --> C["MIN = vũ khí dùng MỌI lần"]
    C --> D["n-1 operations"]
    D --> E["Total = n-1 × MIN"]
    E --> F["✅ O(n) time, O(1) space"]

    style E fill:#4CAF50,color:white
    style F fill:#FF5722,color:white
```

```mermaid
graph LR
    subgraph "Greedy — MIN survives"
        G1["MIN luôn nhỏ hơn"] --> G2["MIN không bao giờ bị xóa"]
        G2 --> G3["Cost mỗi lần = MIN"]
        G3 --> G4["Total = n-1 × MIN"]
    end

    subgraph "Pattern liên quan"
        P1["Huffman Coding — greedy principle"]
        P2["Pairwise elimination"]
        P3["Mathematical insight > Simulation"]
    end
```

---

## R — Repeat & Clarify

🧠 *"Luôn pair min với phần tử khác → xóa phần tử lớn hơn. Chi phí = min. Lặp n-1 lần!"*

> 🎙️ *"Given an array, repeatedly pick a pair and remove the larger one. Cost of each operation = the smaller value. Find minimum total cost to reduce array to size 1."*

```mermaid
graph TD
    subgraph RULES["📋 Quy tắc bài toán"]
        R1["Chọn 2 phần tử\nbất kỳ trong mảng"] --> R2["So sánh 2 phần tử"]
        R2 --> R3["XÓA phần tử LỚN HƠN"]
        R2 --> R4["COST = phần tử NHỎ HƠN"]
        R3 --> R5["Mảng giảm 1 phần tử"]
        R5 --> R6{"Size = 1?"}
        R6 -->|"Chưa"| R1
        R6 -->|"Rồi"| R7["✅ Trả về tổng cost"]
    end

    style R3 fill:#F44336,color:white
    style R4 fill:#FF9800,color:white
    style R7 fill:#4CAF50,color:white
```

### Clarification Questions

```
Q: Xóa phần tử nào?
A: Xóa phần tử LỚN HƠN trong pair.
   Nếu 2 phần tử bằng nhau → xóa 1 cái bất kỳ.

Q: Cost = gì?
A: Cost = phần tử NHỎ HƠN trong pair (phần tử SỐNG SÓT).

Q: Chọn pair NHƯ THẾ NÀO?
A: Bất kỳ pair nào! Tùy ta chọn → tìm chiến thuật TỐI ƯU.

Q: Bao nhiêu operations?
A: ĐÚNG n-1 operations (mỗi lần xóa 1, từ n xuống 1).

Q: Input constraints?
A: n ≥ 1, arr[i] ≥ 1 (positive integers)

Q: Tại sao greedy?
A: Luôn dùng MIN toàn cục làm "vũ khí" → cost mỗi lần bé nhất!
   Greedy proof: cost mỗi lần ≥ min → lower bound = (n-1) × min.
```

### Phân tích Input/Output

```
  ┌──────────────────────────────────────────────────────────────┐
  │  INPUT                                                       │
  │  • arr: mảng các số nguyên dương, n ≥ 1                     │
  │  • Không cần sorted                                          │
  │  • Có thể có phần tử trùng lặp                              │
  │                                                              │
  │  OUTPUT                                                      │
  │  • Một số nguyên: tổng chi phí TỐI THIỂU                   │
  │  • Luôn ≥ 0 (không có case impossible)                      │
  │  • Khi n = 1 → output = 0                                   │
  │                                                              │
  │  CONSTRAINTS QUAN TRỌNG                                      │
  │  • Mỗi op: chọn 2 phần tử BẤT KỲ (tự do chọn)             │
  │  • Xóa LARGER, cost = SMALLER                               │
  │  • Phần tử bị xóa KHÔNG dùng lại được                      │
  │  • Phần tử sống sót VẪN ở trong mảng                       │
  └──────────────────────────────────────────────────────────────┘
```

---

## E — Examples

### VÍ DỤ 1: arr = [4, 3, 2] — Cơ bản

```mermaid
flowchart LR
    subgraph GREEDY["✅ Chiến thuật ĐÚNG: luôn dùng min=2"]
        direction LR
        G0["[4, 3, 2]\nmin=2"] -->|"(2,4)→xóa 4\ncost=2"| G1["[3, 2]"]
        G1 -->|"(2,3)→xóa 3\ncost=2"| G2["[2]\ntotal=4 ✅"]
    end

    subgraph WRONG["❌ Chiến thuật SAI: dùng 3 trước"]
        direction LR
        W0["[4, 3, 2]"] -->|"(3,4)→xóa 4\ncost=3"| W1["[3, 2]"]
        W1 -->|"(2,3)→xóa 3\ncost=2"| W2["[2]\ntotal=5 ❌"]
    end

    style G2 fill:#4CAF50,color:white
    style W2 fill:#F44336,color:white
```

```
VÍ DỤ 1: arr = [4, 3, 2]

  ✅ Chiến thuật ĐÚNG — Luôn dùng min = 2:
    Trận 1: Pair (2, 4) → xóa 4, cost = 2 → arr = [3, 2]
    Trận 2: Pair (2, 3) → xóa 3, cost = 2 → arr = [2]
    Total = 2 + 2 = 4 ✅
    → Công thức: (3-1) × 2 = 4 ✅ KHỚP!

  ❌ Chiến thuật SAI — Dùng 3 trước:
    Trận 1: Pair (3, 4) → xóa 4, cost = 3 → arr = [3, 2]
    Trận 2: Pair (2, 3) → xóa 3, cost = 2 → arr = [2]
    Total = 3 + 2 = 5 > 4 ❌ ĐẮT HƠN 1!

  💡 Vì sao SAI đắt hơn?
    Trận 1 dùng cost=3 thay vì cost=2 → lãng phí thêm 1!
```

### VÍ DỤ 2: arr = [3, 4] — Mảng 2 phần tử

```
  min = 3, n = 2
  Chỉ có 1 cách: Pair (3, 4) → xóa 4, cost = 3
  Total = 3
  → Công thức: (2-1) × 3 = 3 ✅

  📌 Với n=2, không có lựa chọn chiến thuật!
     Chỉ có 1 pair → cost = min(pair) = min(arr)
```

### VÍ DỤ 3: arr = [1, 5, 7, 3] — Mảng 4 phần tử

```mermaid
flowchart LR
    subgraph SIM["✅ Simulation: luôn dùng min=1"]
        direction LR
        S0["[1,5,7,3]\nn=4"] -->|"(1,7)→xóa 7\ncost=1"| S1["[1,5,3]"]
        S1 -->|"(1,5)→xóa 5\ncost=1"| S2["[1,3]"]
        S2 -->|"(1,3)→xóa 3\ncost=1"| S3["[1]\ntotal=3"]
    end

    style S0 fill:#E3F2FD,stroke:#1976D2
    style S3 fill:#4CAF50,color:white
```

```
  min = 1, n = 4
  Trận 1: (1,7) → xóa 7, cost=1 → [1,5,3]
  Trận 2: (1,5) → xóa 5, cost=1 → [1,3]
  Trận 3: (1,3) → xóa 3, cost=1 → [1]
  Total = 1+1+1 = 3
  → Công thức: (4-1) × 1 = 3 ✅

  🧠 Khi min=1, total cost = n-1! (đẹp nhất có thể)
```

### VÍ DỤ 4: arr = [5, 5, 5, 5] — Tất cả bằng nhau

```
  min = 5, n = 4
  Trận 1: (5,5) → xóa 1 cái, cost=5 → [5,5,5]
  Trận 2: (5,5) → xóa 1 cái, cost=5 → [5,5]
  Trận 3: (5,5) → xóa 1 cái, cost=5 → [5]
  Total = 5+5+5 = 15
  → Công thức: (4-1) × 5 = 15 ✅

  📌 Khi tất cả bằng nhau: không có cách nào rẻ hơn!
     Mọi chiến thuật đều cho cùng kết quả.
```

### VÍ DỤ 5: arr = [10] — Edge case: mảng 1 phần tử

```
  min = 10, n = 1
  Đã là size 1! Không cần operation nào.
  → Công thức: (1-1) × 10 = 0 ✅
```

### So sánh TẤT CẢ chiến thuật cho arr = [4, 3, 2]

```
  ┌────────────────────────────────────────────────────────────────────┐
  │  Chiến thuật          │ Trận 1        │ Trận 2        │ Total    │
  ├────────────────────────────────────────────────────────────────────┤
  │  ✅ min trước (2→4,   │ (2,4) cost=2  │ (2,3) cost=2  │ 4 ✅    │
  │     2→3)              │ xóa 4         │ xóa 3         │ TỐI ƯU! │
  ├────────────────────────────────────────────────────────────────────┤
  │  ❌ 3 trước (3→4,     │ (3,4) cost=3  │ (2,3) cost=2  │ 5       │
  │     2→3)              │ xóa 4         │ xóa 3         │         │
  ├────────────────────────────────────────────────────────────────────┤
  │  ❌ 2→3 trước (2→3,   │ (2,3) cost=2  │ (2,4) cost=2  │ 4       │
  │     2→4)              │ xóa 3         │ xóa 4         │ = ✅    │
  ├────────────────────────────────────────────────────────────────────┤
  │                                                                    │
  │  📌 Bất kỳ thứ tự nào mà LUÔN dùng min đều cho kết quả TỐI ƯU! │
  │     Thứ tự loại KHÔNG quan trọng, miễn min luôn là 1 trong pair! │
  └────────────────────────────────────────────────────────────────────┘
```

---

## A — Approach

```mermaid
graph TD
    subgraph INSIGHT["💡 3 Key Insights"]
        direction TB
        I1["🥇 Insight 1\nMIN sống sót cuối cùng"] --> I1a["Vì min ≤ mọi phần tử\n→ min KHÔNG BAO GIỜ bị loại"]
        I2["🎯 Insight 2\nMIN = cost mọi operation"] --> I2a["Luôn pair min với ai đó\n→ cost = min mỗi lần"]
        I3["🔢 Insight 3\nCần đúng n-1 operations"] --> I3a["n phần tử → 1 phần tử\n= loại n-1 phần tử"]
    end

    I1a --> FORMULA["✅ Total = (n-1) × min"]
    I2a --> FORMULA
    I3a --> FORMULA

    style I1 fill:#E3F2FD,stroke:#1976D2
    style I2 fill:#E8F5E9,stroke:#388E3C
    style I3 fill:#FFF3E0,stroke:#F57C00
    style FORMULA fill:#4CAF50,color:white,stroke:#2E7D32,stroke-width:3px
```

```
💡 KEY INSIGHT:

  1. Phần tử MIN sẽ sống sót cuối cùng!
     (vì nó luôn NHỎ hơn → không bao giờ bị xóa)

     Ví dụ: arr = [8, 3, 5, 1, 9]
       1 ≤ 3? ✅ → 1 sống khi pair với 3
       1 ≤ 5? ✅ → 1 sống khi pair với 5
       1 ≤ 8? ✅ → 1 sống khi pair với 8
       1 ≤ 9? ✅ → 1 sống khi pair với 9
       → 1 LUÔN sống! Không ai "giết" được 1!

  2. MIN được dùng trong MỌI operation!
     → n-1 operations, mỗi lần cost = min
     → Total = (n - 1) × min

  3. CHỨNG MINH TỐI ƯU (Exchange Argument):
     Giả sử có chiến thuật S* tốt hơn:
       → S* phải có ít nhất 1 trận KHÔNG dùng min
       → Trận đó cost = x > min (vì x ≥ min luôn đúng, = chỉ khi x = min)
       → Nếu thay x bằng min: cost giảm (hoặc bằng)
       → S* KHÔNG thể tốt hơn chiến thuật luôn dùng min!
       → Mâu thuẫn! → Greedy là TỐI ƯU!

  📌 Công thức cuối: Total = (n - 1) × min
     Chỉ cần tìm min và nhân — XONG!
```

### Tại sao bài này là "trick question"?

```
  Bề ngoài: Bài hỏi about pairwise elimination → tưởng cần DP hoặc simulation
  Thực tế:  Chỉ cần 1 PHÉP TÍNH → (n-1) × min

  ┌───────────────────────────────────────────────────────┐
  │  Cách TƯỞNG phải làm    │  Cách THỰC SỰ cần làm     │
  ├───────────────────────────────────────────────────────┤
  │  Simulate từng bước     │  Tìm min → nhân (n-1)     │
  │  DP tối ưu thứ tự       │  KHÔNG cần DP!             │
  │  Heap / Priority Queue  │  KHÔNG cần sorted!         │
  │  Thử mọi permutation    │  1 dòng code!              │
  └───────────────────────────────────────────────────────┘

  🧠 Interviewer muốn test: Bạn có NHÌN THẤY insight không?
     Hay bạn nhảy vào code ngay mà không phân tích?
```

---

## C — Code

### Version 1: Ngắn gọn nhất (phỏng vấn)

```javascript
function minCost(arr) {
  const min = Math.min(...arr);
  return (arr.length - 1) * min;
}
```

### Version 2: An toàn cho mảng lớn (production)

```javascript
function minCost(arr) {
  // Dùng for loop thay Math.min(...arr) để tránh stack overflow
  let min = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
  }
  return (arr.length - 1) * min;
}
```

### Version 3: Edge-case aware (defensive)

```javascript
function minCost(arr) {
  if (!arr || arr.length <= 1) return 0;

  let min = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
  }
  return (arr.length - 1) * min;
}
```

```
  📌 Khi nào dùng version nào?

  Version 1: Phỏng vấn (ngắn nhất, rõ ý nhất)
  Version 2: Production (an toàn với n > 100k)
  Version 3: Defensive (handle null, undefined, empty array)

  ⚠️ Mention cả 3 trong phỏng vấn để impress:
  "I'll write the concise version first, but in production
   I'd use a for loop to avoid stack overflow with large arrays."
```

### Trace nhiều test cases

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  Input              │ min   │ n    │ (n-1)×min     │ Output     │
  ├──────────────────────────────────────────────────────────────────┤
  │  [4, 3, 2]          │ 2     │ 3    │ (3-1)×2 = 4   │ 4 ✅       │
  │  [3, 4]             │ 3     │ 2    │ (2-1)×3 = 3   │ 3 ✅       │
  │  [1, 5, 7, 3]       │ 1     │ 4    │ (4-1)×1 = 3   │ 3 ✅       │
  │  [10]               │ 10    │ 1    │ (1-1)×10 = 0  │ 0 ✅       │
  │  [5, 5, 5, 5]       │ 5     │ 4    │ (4-1)×5 = 15  │ 15 ✅      │
  │  [1, 1, 1]          │ 1     │ 3    │ (3-1)×1 = 2   │ 2 ✅       │
  │  [100, 1, 100, 100] │ 1     │ 4    │ (4-1)×1 = 3   │ 3 ✅       │
  └──────────────────────────────────────────────────────────────────┘
```

> 🎙️ *"The minimum element always survives since it's never the larger one. It's used in every removal, so total cost is simply (n-1) × min. O(n) to find min, O(1) space."*

---

## O — Optimize

```mermaid
graph LR
    subgraph COMPLEXITY["📊 Complexity Analysis"]
        direction TB
        T["⏱️ Time: O(n)"] --> T1["Tìm min: O(n)"]
        T --> T2["Tính (n-1)×min: O(1)"]
        T --> T3["Total: O(n) + O(1) = O(n)"]

        S["💾 Space: O(1)"] --> S1["Chỉ lưu 1 biến min"]
        S --> S2["Không dùng mảng phụ"]
    end

    subgraph OPTIMAL["🏆 Đã tối ưu?"]
        O1["Lower bound: Ω(n)"] --> O2["Phải đọc MỌI phần tử\nđể tìm min"]
        O2 --> O3["Không thuật toán nào\n< O(n) cho bài này"]
        O3 --> O4["✅ O(n) = OPTIMAL!"]
    end

    style T3 fill:#2196F3,color:white
    style S1 fill:#4CAF50,color:white
    style O4 fill:#4CAF50,color:white
```

```
  Time:  O(n) — chỉ cần tìm min (1 pass)
  Space: O(1) — chỉ lưu biến min và kết quả

  ĐÃ TỐI ƯU NHẤT vì:
    → Phải đọc MỌI phần tử ít nhất 1 lần (để biết min)
    → Ω(n) là lower bound → O(n) đã đạt!
    → Không có thuật toán nào < O(n) cho bài này!

  ⚠️ Đây là bài "trick" — nhìn phức tạp nhưng chỉ 1-2 dòng!
  Interview: giải thích CHỨNG MINH greedy quan trọng hơn code!

  ┌──────────────────────────────────────────────────────────┐
  │  Comparison với các cách khác:                           │
  ├──────────────────────────────────────────────────────────┤
  │  Simulate while loop:  O(n²)  → thừa!                  │
  │  Sort + formula:       O(n log n)  → sort thừa!         │
  │  Formula trực tiếp:    O(n)   → TỐI ƯU! ✅              │
  │  Brute force all:      O(n!)  → cực chậm!               │
  └──────────────────────────────────────────────────────────┘
```

---

## T — Test

```
  [4, 3, 2]    → (3-1)×2 = 4     ✅  Basic
  [3, 4]       → (2-1)×3 = 3     ✅  Two elements
  [1, 5, 7, 3] → (4-1)×1 = 3     ✅  Min = 1
  [10]         → (1-1)×10 = 0    ✅  Already size 1
  [1, 1, 1]    → (3-1)×1 = 2     ✅  All same
  [5, 5, 5, 5] → (4-1)×5 = 15    ✅  All same (large)
  [2, 2, 7, 2] → (4-1)×2 = 6     ✅  Duplicate mins
  [9, 8, 7, 1] → (4-1)×1 = 3     ✅  Min ở cuối
  [1, 100000]  → (2-1)×1 = 1     ✅  Extreme diff
```

### Edge Cases Chi Tiết

```mermaid
graph TD
    subgraph EDGE["🧪 Edge Cases"]
        E1["n = 1"] -->|"0 operations"| R1["return 0"]
        E2["n = 2"] -->|"1 operation"| R2["return min"]
        E3["All equal"] -->|"min = any"| R3["return (n-1) × val"]
        E4["Min duplicates"] -->|"nhiều min"| R4["Vẫn = (n-1) × min"]
        E5["Sorted asc"] -->|"min = arr[0]"| R5["(n-1) × arr[0]"]
        E6["Sorted desc"] -->|"min = arr[n-1]"| R6["(n-1) × arr[n-1]"]
    end

    style R1 fill:#4CAF50,color:white
    style R2 fill:#4CAF50,color:white
    style R3 fill:#2196F3,color:white
    style R4 fill:#2196F3,color:white
```

```
  ┌───────────────────────────────────────────────────────────────────────┐
  │  Edge Case            │ Input           │ Output │ Tại sao?          │
  ├───────────────────────────────────────────────────────────────────────┤
  │  Mảng 1 phần tử       │ [10]            │ 0      │ 0 operations!     │
  │  Mảng 2 phần tử       │ [3, 7]          │ 3      │ 1 op, cost=min    │
  │  Tất cả bằng nhau     │ [5, 5, 5, 5]    │ 15     │ min=5, (4-1)×5    │
  │  Min trùng lặp        │ [2, 2, 7, 2]    │ 6      │ min=2, (4-1)×2    │
  │  Min ở cuối           │ [9, 8, 7, 1]    │ 3      │ Vị trí ko ảnh     │
  │                       │                 │        │ hưởng!            │
  │  Chênh lệch cực lớn   │ [1, 10⁶]       │ 1      │ (2-1)×1           │
  │  Mảng rất lớn         │ n=10⁶, min=1    │ 999999 │ O(n) vẫn ok       │
  └───────────────────────────────────────────────────────────────────────┘

  ⚠️ CHÚ Ý QUAN TRỌNG:
     • Bài này KHÔNG có case return -1 (impossible)
     • Luôn có lời giải miễn n ≥ 1
     • Kết quả = 0 khi và chỉ khi n = 1
     • Thứ tự phần tử KHÔNG ảnh hưởng kết quả
     • Vị trí của min KHÔNG ảnh hưởng kết quả
```

---

## 🗣️ Interview Script

> 🎙️ *"The key insight is that the minimum element never gets removed — it's always the smaller in any pair. So it's used as the cost in every single operation. We need n-1 operations to reduce to size 1, giving total cost = (n-1) × min. The proof is: any other strategy uses a larger value as cost at least once, which is strictly worse."*

### Script chi tiết cho từng câu hỏi

```
  Q: "Walk me through your approach."
  A: "Đầu tiên, tôi nhận ra rằng mỗi operation xóa phần tử lớn hơn,
      nên phần tử nhỏ nhất sẽ KHÔNG BAO GIỜ bị xóa — nó luôn sống sót.
      Vì min sống sót, ta có thể dùng nó trong MỌI operation.
      Cost mỗi lần = min. Cần n-1 operations.
      → Total = (n-1) × min."

  Q: "Prove this is optimal."
  A: "Mỗi operation cost = min(pair) ≥ min(arr).
      Cần n-1 ops → Total ≥ (n-1) × min.
      Chiến thuật luôn dùng min đạt ĐÚNG (n-1) × min.
      Lower bound = upper bound → OPTIMAL."

  Q: "What if both elements are equal?"
  A: "Xóa cái nào cũng được, cost vẫn = giá trị đó.
      Công thức vẫn đúng vì min = giá trị chung."

  Q: "Time/space complexity?"
  A: "O(n) time: 1 pass tìm min. O(1) space.
      Đã optimal vì phải đọc mọi phần tử."

  Q: "What about Math.min(...arr) risks?"
  A: "Stack overflow với n > ~100k do spread operator.
      Production code nên dùng for loop."

  Q: "If we remove the SMALLER instead?"
  A: "Bài khác hẳn! MAX sống sót, nhưng min bị loại dần
      → cost thay đổi mỗi lần → cần greedy/DP phức tạp hơn."
```

### Pattern

```
  GREEDY — "MIN survives" pattern!

  Khi chỉ xóa phần tử LỚN HƠN:
    → Min LUÔN sống sót
    → Min LUÔN là cost
    → Total = (n-1) × min

  Liên kết: tương tự Huffman Coding greedy principle
```

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

### Hình dung bằng TRẬN ĐẤU

```mermaid
flowchart LR
    subgraph ARENA["🏟️ Đấu trường — arr = [4, 3, 2]"]
        direction LR
        T0["⚔️ 3 Võ sĩ\n🟥 Tướng 4\n🟨 Tướng 3\n🟩 Tướng 2"] -->|"Trận 1\n🟩 vs 🟥"| T1["🟩 Tướng 2 THẮNG!\n🟥 Tướng 4 bị loại\ncost = 2"]
        T1 -->|"Trận 2\n🟩 vs 🟨"| T2["🟩 Tướng 2 THẮNG!\n🟨 Tướng 3 bị loại\ncost = 2"]
        T2 --> T3["🏆 Nhà vô địch:\nTướng 2 (MIN)\nTotal cost = 4"]
    end

    style T0 fill:#E3F2FD,stroke:#1976D2
    style T1 fill:#FFF3E0,stroke:#F57C00
    style T2 fill:#FFF3E0,stroke:#F57C00
    style T3 fill:#4CAF50,color:white
```

```
  Tưởng tượng mỗi phần tử là 1 VÕ SĨ trên đấu trường.
  Mỗi trận đấu: 2 võ sĩ đấu nhau → NHỎ HƠN thắng, LỚN HƠN bị loại.
  Chi phí tổ chức trận = giá trị võ sĩ THẮNG (nhỏ hơn).
  Mục tiêu: chỉ còn 1 võ sĩ, chi phí tổ chức TỐI THIỂU.

  arr = [4, 3, 2]  →  3 võ sĩ: "Tướng 4", "Tướng 3", "Tướng 2"

  CHIẾN THUẬT TỐI ƯU: Cho "Tướng 2" (MIN) đánh MỌI trận!
    Trận 1: Tướng 2 vs Tướng 4 → Tướng 4 thua, cost = 2
    Trận 2: Tướng 2 vs Tướng 3 → Tướng 3 thua, cost = 2
    Total cost = 2 + 2 = 4

  TẠI SAO "Tướng 2" LUÔN THẮNG?
    → Vì 2 là giá trị NHỎ NHẤT!
    → Trong MỌI trận đấu, 2 < đối thủ → 2 luôn sống sót!
    → 2 không bao giờ bị loại → dùng 2 cho MỌI trận!
```

### Tại sao LUÔN dùng MIN? — Chứng minh bằng PHẢN CHỨNG

```mermaid
graph TD
    subgraph PROOF["📐 Chứng minh bằng Phản Chứng"]
        A["Giả sử: Tồn tại\nchiến thuật S' TỐT HƠN"] --> B["S' có ít nhất 1 trận\nKHÔNG dùng min"]
        B --> C["Trận đó: cost = x > min"]
        C --> D["Thay x bằng min:\ncost GIẢM!"]
        D --> E["S' sau khi thay\n≤ S' ban đầu"]
        E --> F{"S' vẫn tốt hơn\nGreedy?"}
        F -->|"KHÔNG!"| G["❌ MÂU THUẪN!"]
        G --> H["✅ Greedy là TỐI ƯU!"]
    end

    style A fill:#FFCDD2,stroke:#F44336
    style G fill:#F44336,color:white
    style H fill:#4CAF50,color:white
```

```
  📐 CHỨNG MINH GREEDY là TỐI ƯU:

  Giả sử có chiến thuật S' khác KHÔNG luôn dùng min:
    → Tồn tại ít nhất 1 trận mà S' dùng phần tử x > min làm cost
    → Cost trận đó = x > min

  So sánh với chiến thuật S (luôn dùng min):
    → Cost trận đó = min < x

  → S' có ít nhất 1 trận đắt hơn S
  → Tổng cost S' ≥ Tổng cost S
  → S (luôn dùng min) là TỐI ƯU NHẤT! ✅

  ⚠️ QUAN TRỌNG: min KHÔNG BAO GIỜ bị loại vì:
    → Khi pair min với bất kỳ phần tử x:
      - min ≤ x (luôn đúng, vì min là nhỏ nhất)
      - x bị loại, min sống
    → min có thể tham gia TẤT CẢ n-1 trận!
```

### Tại sao cần đúng n-1 operations?

```mermaid
flowchart LR
    subgraph TOURNAMENT["🏆 Single Elimination Tournament"]
        direction LR
        N5["n=5\n5 đội"] -->|"Trận 1\nloại 1"| N4["n=4"]
        N4 -->|"Trận 2\nloại 1"| N3["n=3"]
        N3 -->|"Trận 3\nloại 1"| N2["n=2"]
        N2 -->|"Trận 4\nloại 1"| N1["n=1\n🏆 VÔ ĐỊCH!"]
    end

    N5 -.- F["n-1 = 4 trận\n= 4 operations"]

    style N5 fill:#E3F2FD,stroke:#1976D2
    style N1 fill:#4CAF50,color:white
    style F fill:#FFF3E0,stroke:#F57C00
```

```
  Ban đầu: n phần tử
  Mỗi operation: xóa 1 phần tử → giảm 1
  Mục tiêu: còn 1 phần tử

  Số operations = n - 1

  Giống GIẢI ĐẤU LOẠI TRỰC TIẾP (Single Elimination Tournament):
    n đội → cần n-1 trận → còn 1 nhà vô địch
    (mỗi trận loại 1 đội)

  📌 Kỹ năng chuyển giao:
    Khi bài nói "reduce to 1 by removing 1 at a time"
    → Luôn cần n-1 operations!
    → Đây là fact cơ bản, dùng được cho NHIỀU bài!
```

### Mối liên hệ với các bài khác

```mermaid
graph TD
    subgraph VARIANTS["🔄 Pairwise Elimination Variants"]
        CENTER["Pairwise\nElimination"] --> V1["Cost = smaller\nXóa larger"]
        CENTER --> V2["Cost = larger\nXóa smaller"]
        CENTER --> V3["Cost = |diff|\nXóa 1 bất kỳ"]
        CENTER --> V4["Cost = sum\nMerge 2→1"]

        V1 --> R1["(n-1)×min\n⭐ BÀI NÀY"]
        V2 --> R2["(n-1)×max"]
        V3 --> R3["Sort + Greedy"]
        V4 --> R4["Huffman\nMin-Heap"]
    end

    style R1 fill:#4CAF50,color:white,stroke:#2E7D32,stroke-width:3px
    style R2 fill:#2196F3,color:white
    style R3 fill:#FF9800,color:white
    style R4 fill:#9C27B0,color:white
    style CENTER fill:#E3F2FD,stroke:#1976D2
```

```
  ┌───────────────────────────────────────────────────────────────┐
  │  "Pairwise elimination" problems — Cùng PATTERN              │
  ├───────────────────────────────────────────────────────────────┤
  │  Cost = smaller, xóa larger     → Bài NÀY: (n-1)×min        │
  │  Cost = larger, xóa smaller     → (n-1)×max                 │
  │  Cost = |diff|, xóa 1 bất kỳ   → Cần sort/greedy phức tạp  │
  │  Cost = sum, merge 2 thành 1    → Huffman coding (heap)     │
  │  Cost = product, xóa 1          → Logarithm trick           │
  └───────────────────────────────────────────────────────────────┘

  → Bài này là VERSION ĐƠN GIẢN NHẤT vì:
     1. Cost = min (cố định sau khi tìm min)
     2. Chiến thuật rõ ràng: luôn dùng min
     3. Không cần simulation, chỉ cần 1 phép tính!
```

---

## 🧭 Luồng Suy Nghĩ — Từ đọc đề đến solution

> 💡 Phần này dạy bạn **CÁCH TƯ DUY** để tự giải bài, không chỉ biết đáp án.

### Bước 1: Đọc đề → Gạch chân KEYWORDS

```mermaid
graph TD
    subgraph KEYWORDS["🔍 Keyword Parsing"]
        READ["Đọc đề bài"] --> KW1["pick a pair"]
        READ --> KW2["remove the larger"]
        READ --> KW3["cost = smaller"]
        READ --> KW4["minimum total cost"]
        READ --> KW5["size 1"]

        KW1 --> D1["🔄 Pairwise operation"]
        KW2 --> D2["🎯 MIN sống sót!"]
        KW3 --> D3["💰 Cost = min mỗi lần"]
        KW4 --> D4["🧠 Greedy approach"]
        KW5 --> D5["🔢 n-1 operations"]
    end

    D2 --> FORMULA["✅ Total = (n-1) × min"]
    D3 --> FORMULA
    D5 --> FORMULA

    style READ fill:#9C27B0,color:white
    style D2 fill:#4CAF50,color:white
    style D3 fill:#FF9800,color:white
    style FORMULA fill:#4CAF50,color:white,stroke:#2E7D32,stroke-width:3px
```

```
  Đề bài: "Pick a pair, remove the larger. Cost = the smaller.
           Find minimum total cost to reduce to size 1."

  Gạch chân:
    "pick a pair"        → PAIRWISE operation
    "remove the larger"  → PHẦN TỬ LỚN bị loại
    "cost = smaller"     → CHI PHÍ = phần tử nhỏ
    "minimum total cost" → TỐI ƯU HÓA (Greedy?)
    "size 1"             → CẦN n-1 operations

  🧠 Tự hỏi ngay:
    1. "Phần tử nào sống sót cuối?" → MIN! (không bao giờ bị loại)
    2. "Cost mỗi lần là gì?"       → Luôn dùng MIN → cost = MIN
    3. "Bao nhiêu lần?"            → n-1 lần (loại n-1 phần tử)

  📌 Kỹ năng chuyển giao:
    Khi đề nói "remove the larger" → NGHĨ NGAY: min sống sót!
    Khi đề nói "minimum cost"      → NGHĨ NGAY: Greedy!
    Khi đề nói "reduce to 1"       → NGHĨ NGAY: n-1 operations!
```

### Bước 2: Vẽ ví dụ NHỎ bằng tay → Tìm PATTERN

```
  Lấy ví dụ: arr = [5, 1, 3], n = 3

  🧠 "Thử TẤT CẢ chiến thuật và so sánh:"

  Chiến thuật A: Luôn dùng min=1
    Trận 1: (1,5) → xóa 5, cost=1 → arr=[1,3]
    Trận 2: (1,3) → xóa 3, cost=1 → arr=[1]
    Total = 1+1 = 2 ✅

  Chiến thuật B: Dùng 3 trước
    Trận 1: (3,5) → xóa 5, cost=3 → arr=[1,3]
    Trận 2: (1,3) → xóa 3, cost=1 → arr=[1]
    Total = 3+1 = 4 ❌ Đắt hơn!

  Chiến thuật C: Dùng 5 trước (SAI! 5 sẽ bị loại)
    Trận 1: (1,5) → xóa 5, cost=1 → arr=[1,3]
    (5 đã chết, không dùng lại được!)

  💡 PATTERN: Luôn dùng MIN cho cost THẤP NHẤT mỗi trận!
     Total = (n-1) × min = 2 × 1 = 2
```

### Bước 3: Cây quyết định

```mermaid
graph TD
    A["Đề: Pairwise elimination"] --> B["Xóa phần tử LỚN hơn"]
    B --> C["Min KHÔNG BAO GIỜ bị loại"]
    C --> D["Min tham gia MỌI trận"]
    D --> E["Cost mỗi trận = min"]
    E --> F["n-1 trận cần thiết"]
    F --> G["✅ Total = n-1 × min"]

    A --> H{{"Nếu đề khác?"}}
    H -->|"Xóa nhỏ hơn"| I["MAX sống sót → n-1 × max"]
    H -->|"Cost = diff"| J["Phức tạp hơn — sort needed"]
    H -->|"Merge 2 thành 1"| K["Huffman Coding — heap"]

    style G fill:#4CAF50,color:white
    style I fill:#2196F3,color:white
    style J fill:#FF9800,color:white
    style K fill:#9C27B0,color:white
```

---

## 🔬 Deep Dive — Giải thích CHI TIẾT từng dòng code

> 💡 Phần này phân tích **từng dòng code** để bạn hiểu **TẠI SAO** viết như vậy.

```mermaid
flowchart TD
    subgraph INIT["🔧 Toàn bộ thuật toán"]
        A["const min = Math.min(...arr)"] --> B["return (arr.length - 1) * min"]
    end

    A -.- A1["Tìm phần tử nhỏ nhất\n= 'vũ khí' dùng mọi trận"]
    B -.- B1["n-1 trận × cost mỗi trận\n= tổng chi phí tối thiểu"]

    style INIT fill:#E3F2FD,stroke:#1976D2
    style A1 fill:#FFF3E0,stroke:#F57C00
    style B1 fill:#E8F5E9,stroke:#388E3C
```

```mermaid
flowchart LR
    subgraph "📊 Simulation: arr = [4, 3, 2]"
        direction LR
        S0["🏁 Start\nmin=2, n=3"] --> S1["Trận 1\n2 vs 4\nxóa 4\ncost=2"]
        S1 --> S2["Trận 2\n2 vs 3\nxóa 3\ncost=2"]
        S2 --> S3["🏆 Done!\narr=[2]\ntotal=4"]
    end

    style S0 fill:#E3F2FD,stroke:#1976D2
    style S3 fill:#4CAF50,color:white
```

### Code đầy đủ với annotation

```javascript
function minCost(arr) {
  // ═══════════════════════════════════════════════════════════════
  // DÒNG 1: Tìm MIN — Xác định "vũ khí"
  // ═══════════════════════════════════════════════════════════════
  //
  // TẠI SAO Math.min(...arr)?
  //   → Spread operator (...) "xoè" mảng thành danh sách tham số
  //   → Math.min(4, 3, 2) → 2
  //
  // TẠI SAO tìm MIN?
  //   → MIN là phần tử sống sót cuối cùng (không bao giờ bị loại)
  //   → MIN được dùng làm cost cho MỌI operation
  //   → Dùng MIN = chi phí THẤP NHẤT có thể mỗi lần
  //
  // TRADE-OFF:
  //   ✅ Ngắn gọn, dễ đọc
  //   ❌ Với mảng > 100,000 phần tử → Stack Overflow
  //      → Giải pháp: dùng vòng for tìm min thủ công
  //
  const min = Math.min(...arr);

  // ═══════════════════════════════════════════════════════════════
  // DÒNG 2: Tính kết quả — Công thức 1 dòng!
  // ═══════════════════════════════════════════════════════════════
  //
  // TẠI SAO arr.length - 1?
  //   → Bắt đầu: n phần tử
  //   → Mỗi operation: xóa 1 phần tử
  //   → Kết thúc: 1 phần tử
  //   → Số operations = n - 1
  //
  // TẠI SAO × min?
  //   → Mỗi operation cost = min (chiến thuật greedy)
  //   → n-1 operations × min mỗi lần = (n-1) × min
  //
  // INSIGHT TOÁN HỌC:
  //   Total cost = Σ(cost mỗi trận) = Σ min (n-1 lần) = (n-1) × min
  //   → Đây là TỔNG CỦA HẰNG SỐ — đơn giản nhất!
  //
  // EDGE CASE:
  //   n = 1 → arr.length - 1 = 0 → return 0 (không cần xóa gì!)
  //   n = 0 → Tùy đề (có thể return 0 hoặc handle riêng)
  //
  return (arr.length - 1) * min;
}
```

### Trace CHI TIẾT — Nhiều ví dụ

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  VÍ DỤ 1: arr = [4, 3, 2]                                              │
  │                                                                         │
  │  min = Math.min(4, 3, 2) = 2                                            │
  │  n = 3                                                                  │
  │  cost = (3 - 1) × 2 = 2 × 2 = 4                                        │
  │                                                                         │
  │  Simulation xác nhận:                                                   │
  │  ┌─────────┬─────────────────┬────────┬──────────┬──────────────────────┐│
  │  │ Trận    │ Pair            │ Xóa    │ Cost     │ Remaining            ││
  │  ├─────────┼─────────────────┼────────┼──────────┼──────────────────────┤│
  │  │  1      │ (2, 4)          │ 4      │ 2        │ [3, 2]               ││
  │  │  2      │ (2, 3)          │ 3      │ 2        │ [2]                  ││
  │  └─────────┴─────────────────┴────────┴──────────┴──────────────────────┘│
  │  Total = 2 + 2 = 4 ✅ Matches formula!                                  │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  VÍ DỤ 2: arr = [1, 5, 7, 3]                                           │
  │                                                                         │
  │  min = 1, n = 4                                                         │
  │  cost = (4 - 1) × 1 = 3 × 1 = 3                                        │
  │                                                                         │
  │  Simulation:                                                            │
  │  ┌─────────┬─────────────────┬────────┬──────────┬──────────────────────┐│
  │  │ Trận    │ Pair            │ Xóa    │ Cost     │ Remaining            ││
  │  ├─────────┼─────────────────┼────────┼──────────┼──────────────────────┤│
  │  │  1      │ (1, 7)          │ 7      │ 1        │ [1, 5, 3]            ││
  │  │  2      │ (1, 5)          │ 5      │ 1        │ [1, 3]               ││
  │  │  3      │ (1, 3)          │ 3      │ 1        │ [1]                  ││
  │  └─────────┴─────────────────┴────────┴──────────┴──────────────────────┘│
  │  Total = 1 + 1 + 1 = 3 ✅ Matches formula!                              │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  VÍ DỤ 3 — SAI nếu KHÔNG dùng min: arr = [1, 5, 7, 3]                  │
  │                                                                         │
  │  Chiến thuật SAI: dùng 3 trước                                          │
  │  ┌─────────┬─────────────────┬────────┬──────────┬──────────────────────┐│
  │  │ Trận    │ Pair            │ Xóa    │ Cost     │ Remaining            ││
  │  ├─────────┼─────────────────┼────────┼──────────┼──────────────────────┤│
  │  │  1      │ (3, 7)          │ 7      │ 3        │ [1, 5, 3]            ││
  │  │  2      │ (3, 5)          │ 5      │ 3        │ [1, 3]               ││
  │  │  3      │ (1, 3)          │ 3      │ 1        │ [1]                  ││
  │  └─────────┴─────────────────┴────────┴──────────┴──────────────────────┘│
  │  Total = 3 + 3 + 1 = 7 > 3 ❌ Đắt hơn!                                 │
  │                                                                         │
  │  📌 Bất kỳ chiến thuật nào KHÔNG luôn dùng min đều ĐẮT HƠN!           │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## 🧮 Chứng minh Toán học — Greedy Optimality

> 💡 Chứng minh CHẶT CHẼ rằng (n-1) × min là đáp án tối ưu nhất.

```mermaid
graph TD
    subgraph PROOF["📐 Chứng minh Greedy Optimal"]
        direction TB
        A["Bất kỳ chiến thuật nào"] --> B["Cần đúng n-1 operations"]
        B --> C["Mỗi operation cost ≥ ???"]
        C --> D{{"Cost mỗi operation\ncó thể < min?"}}
        D -->|"KHÔNG!"| E["Cost = phần tử nhỏ hơn\ntrong pair ≥ min"]
        E --> F["Tổng cost ≥ n-1 × min"]
        F --> G["Chiến thuật dùng min\n= đạt ĐÚNG n-1 × min"]
        G --> H["✅ Greedy = OPTIMAL!"]
    end

    style H fill:#4CAF50,color:white
    style D fill:#FF9800,color:white
    style E fill:#2196F3,color:white
```

### Chứng minh chặt chẽ

```
  📐 CHỨNG MINH:

  ── Lower Bound ──

  Cho arr = [a₁, a₂, ..., aₙ], min = min(arr)

  Bất kỳ chiến thuật nào cũng cần đúng n-1 operations.
  Mỗi operation chọn pair (aᵢ, aⱼ):
    - Cost = min(aᵢ, aⱼ) ≥ min(arr) = min

  → Tổng cost = Σ cost_per_op ≥ Σ min (n-1 lần) = (n-1) × min

  ── Upper Bound (Greedy đạt được) ──

  Chiến thuật: Luôn pair min với 1 phần tử khác:
    - min ≤ mọi phần tử → min luôn là nhỏ hơn → min sống
    - Cost mỗi lần = min
    - Sau n-1 lần: chỉ còn min

  → Tổng cost = (n-1) × min = Lower Bound

  ═══════════════════════════════════════════════
   KẾT LUẬN:
   Lower Bound = Upper Bound = (n-1) × min
   → Greedy là TỐI ƯU! Không có chiến thuật nào tốt hơn!
  ═══════════════════════════════════════════════
```

### Khi nào min BẰNG phần tử kia trong pair?

```mermaid
flowchart LR
    subgraph EQUAL["🤝 Trường hợp: arr = [2, 2, 5, 2]"]
        direction LR
        E0["[2,2,5,2]\nmin=2"] -->|"(2,5)→xóa 5\ncost=2"| E1["[2,2,2]"]
        E1 -->|"(2,2)→xóa 1 cái\ncost=2"| E2["[2,2]"]
        E2 -->|"(2,2)→xóa 1 cái\ncost=2"| E3["[2]\ntotal=6"]
    end

    E3 -.- F["(4-1)×2 = 6 ✅\nCông thức VẪN đúng!"]

    style E0 fill:#E3F2FD,stroke:#1976D2
    style E3 fill:#4CAF50,color:white
    style F fill:#C8E6C9,stroke:#4CAF50
```

```
  Trường hợp đặc biệt: mảng có NHIỀU min!
    arr = [2, 2, 5, 2]  →  min = 2

  Pair (2, 2): cả hai bằng nhau! Xóa ai?
    → Xóa phần tử nào cũng được (đề nói "remove the larger"
      nhưng khi bằng nhau → xóa 1 cái bất kỳ)
    → Cost vẫn = 2

  Kết quả: (4-1) × 2 = 6 ✅

  📌 Không ảnh hưởng gì! Công thức vẫn đúng!
     Đây là edge case interviewer có thể hỏi.
```

---

## ⚠️ Common Mistakes — Lỗi hay gặp khi giải

```mermaid
graph TD
    START["🚨 Common Mistakes"] --> M1["Mistake #1\nSimulate toàn bộ"]
    START --> M2["Mistake #2\nKhông nhận ra min"]
    START --> M3["Mistake #3\nSort mảng"]
    START --> M4["Mistake #4\nQuên edge case"]
    START --> M5["Mistake #5\nNhầm cost = max"]

    M1 --> M1a["❌ While loop mô phỏng\n→ O(n²) thừa!"]
    M1 --> M1b["✅ Công thức trực tiếp\n→ O(n) only!"]

    M2 --> M2a["❌ Không nhận ra\nmin sống sót"]
    M2 --> M2b["✅ min không bao giờ\nbị loại!"]

    M3 --> M3a["❌ Sort O(n log n)\nrồi lấy arr[0]"]
    M3 --> M3b["✅ Math.min O(n)\nnhanh hơn!"]

    M4 --> M4a["❌ Quên n=1\nhoặc n=0"]
    M4 --> M4b["✅ n=1 → return 0\nn=0 → handle riêng"]

    M5 --> M5a["❌ cost = max\ntrong mỗi pair"]
    M5 --> M5b["✅ cost = SMALLER\ntrong pair!"]

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
    style M1 fill:#FF5722,color:white
```

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │  ❌ SAI                          │  ✅ ĐÚNG             │ TẠI SAO?   │
  ├────────────────────────────────────────────────────────────────────────┤
  │                                                                        │
  │  Mistake #1: Simulate từng bước                                        │
  │  while (arr.length > 1) {       │ return (n-1) * min   │ Simulation │
  │    // pick pair, remove...      │                       │ = O(n²)    │
  │  }                              │                       │ Thừa!      │
  │                                                                        │
  │  Mistake #2: Không nhận ra "min sống sót"                              │
  │  Thử mọi combination           │ Greedy: luôn dùng min│ Bài trick! │
  │  → O(2^n) exponential!         │ → O(n)               │ Chỉ 1 dòng │
  │                                                                        │
  │  Mistake #3: Sort mảng                                                 │
  │  arr.sort(); min = arr[0]      │ min = Math.min(...)   │ Sort O(n   │
  │                                 │ hoặc loop             │ log n)     │
  │                                 │                       │ thừa!      │
  │                                                                        │
  │  Mistake #4: Quên edge case n=1                                        │
  │  Không check arr.length         │ n=1 → return 0       │ Đã là      │
  │                                 │ (0 operations)        │ size 1!    │
  │                                                                        │
  │  Mistake #5: Nhầm cost                                                 │
  │  cost = max(pair) mỗi lần      │ cost = min(pair)      │ Đọc đề     │
  │  → (n-1) × max ← SAI!         │ → (n-1) × min ✅     │ cho kỹ!    │
  └────────────────────────────────────────────────────────────────────────┘

  ⚠️ Mistake #1 là PHỨC TẠP NHẤT:
    Nhiều người bắt đầu SIMULATE từng bước:
      while (arr.length > 1) {
        let minIdx = findMinIndex(arr);
        let otherIdx = findOther(arr);
        cost += arr[minIdx];
        arr.splice(otherIdx, 1);
      }
    → Đúng nhưng O(n²)! splice = O(n) × n lần!
    → Đáp án 1 dòng: (n-1) × min → O(n)!
```

---

## 🔄 Alternative Approaches — So sánh các cách tiếp cận

```mermaid
graph TD
    subgraph COMPARE["🔄 So sánh 4 Approaches"]
        direction TB
        A1["Approach 1\nBrute Force\nRecursive tất cả pair"] --> T1["⏱️ O(n! × n)\n💾 O(n)"]
        A2["Approach 2\nSimulation\nLoop + splice"] --> T2["⏱️ O(n²)\n💾 O(n)"]
        A3["Approach 3\nOptimal - formula\n⭐ KHUYẾN KHÍCH"] --> T3["⏱️ O(n)\n💾 O(1)"]
        A4["Approach 4\nFunctional\nreduce"] --> T4["⏱️ O(n)\n💾 O(1)"]
    end

    T1 --> R1["❌ Quá chậm!"]
    T2 --> R2["⚠️ Đúng nhưng thừa"]
    T3 --> R3["✅ Tối ưu nhất!"]
    T4 --> R4["✅ Gọn nhưng khó đọc"]

    style A3 fill:#4CAF50,color:white,stroke:#2E7D32,stroke-width:3px
    style R3 fill:#C8E6C9,stroke:#4CAF50
    style R1 fill:#FFCDD2,stroke:#F44336
    style R2 fill:#FFF9C4,stroke:#FBC02D
    style R4 fill:#E3F2FD,stroke:#1976D2
    style T3 fill:#E8F5E9,stroke:#4CAF50
```

### Approach 1: Brute Force — Thử TẤT CẢ combinations

```mermaid
graph TD
    subgraph BRUTE["❌ Brute Force: arr = [4, 3, 2]"]
        START["[4, 3, 2]"] --> P1["Pair (4,3)\ncost=3, xóa 4"]
        START --> P2["Pair (4,2)\ncost=2, xóa 4"]
        START --> P3["Pair (3,2)\ncost=2, xóa 3"]

        P1 --> P1a["[3,2]\n→ (2,3) cost=2\nTotal=5"]
        P2 --> P2a["[3,2]\n→ (2,3) cost=2\nTotal=4"]
        P3 --> P3a["[4,2]\n→ (2,4) cost=2\nTotal=4"]

        P1a --> RESULT["min(5,4,4) = 4 ✅"]
        P2a --> RESULT
        P3a --> RESULT
    end

    subgraph OPTIMAL["✅ Optimal"]
        O1["min=2, n=3"] --> O2["(3-1)×2 = 4 ✅"]
    end

    BRUTE -->|"Cùng kết quả\nnhưng O(n!) vs O(n)!"| OPTIMAL

    style RESULT fill:#FF9800,color:white
    style O2 fill:#4CAF50,color:white
    style START fill:#FFCDD2,stroke:#F44336
```

```javascript
// ❌ RẤT CHẬM — O(n! × n) — chỉ để hiểu bài
function minCost_brute(arr) {
  if (arr.length <= 1) return 0;
  let minCost = Infinity;

  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const cost = Math.min(arr[i], arr[j]);
      // Xóa phần tử lớn hơn
      const remaining = arr.filter((_, idx) =>
        idx !== (arr[i] >= arr[j] ? i : j)
      );
      minCost = Math.min(minCost, cost + minCost_brute(remaining));
    }
  }
  return minCost;
}
```

```
  Phân tích:
    Time:  O(n! × n) — THỬ MỌI cách chọn pair!
    Space: O(n) — recursion depth

  ⚠️ CHỈ DÙNG ĐỂ: verify đáp án cho mảng NHỎ (n ≤ 8)
```

### Approach 2: Simulation — Mô phỏng greedy

```javascript
// ⚠️ ĐÚNG nhưng THỪA — O(n²)
function minCost_simulate(arr) {
  arr = [...arr]; // copy để không mutate
  let totalCost = 0;

  while (arr.length > 1) {
    const minVal = Math.min(...arr);
    const minIdx = arr.indexOf(minVal);

    // Tìm phần tử bất kỳ KHÁC min để pair
    const otherIdx = minIdx === 0 ? 1 : 0;

    totalCost += minVal;
    // Xóa phần tử lớn hơn
    arr.splice(otherIdx, 1);
  }
  return totalCost;
}
```

```
  Phân tích:
    Time:  O(n²) — n iterations × splice O(n) mỗi lần
    Space: O(n) — copy mảng

  ⚠️ Đúng nhưng HOÀN TOÀN thừa!
    → Kết quả luôn = (n-1) × min
    → Tại sao simulate khi biết công thức?
```

### Approach 3: Optimal — Công thức trực tiếp (CODE CHÍNH)

```javascript
// ✅ TỐI ƯU — O(n) time, O(1) space — CHỈ 2 DÒNG!
function minCost(arr) {
  const min = Math.min(...arr);
  return (arr.length - 1) * min;
}
```

### Approach 4: Functional — reduce tìm min

```javascript
// ✅ An toàn cho mảng lớn (không dùng spread)
function minCost_safe(arr) {
  const min = arr.reduce((m, val) => Math.min(m, val), Infinity);
  return (arr.length - 1) * min;
}
```

```
  So sánh:

  ┌─────────────┬──────────────────────┬──────────────────────┐
  │  Tiêu chí    │ Approach 3 (spread)  │ Approach 4 (reduce)  │
  ├─────────────┼──────────────────────┼──────────────────────┤
  │  Readability │ ✅ Siêu rõ ràng      │ ⚠️ Hơi dài            │
  │  Safety      │ ❌ Stack overflow     │ ✅ An toàn với n lớn  │
  │              │ nếu n > 100k         │                      │
  │  Interview   │ ✅ Dùng trước        │ ✅ Mention như bonus  │
  └─────────────┴──────────────────────┴──────────────────────┘

  📌 Strategy phỏng vấn:
    1. Viết Approach 3 trước (ngắn nhất, rõ nhất)
    2. Mention: "Với mảng rất lớn, Math.min(...arr) có thể
       stack overflow, nên dùng reduce thay thế"
    → Thể hiện bạn hiểu sâu hơn đáp án cơ bản!
```

---

## 🧠 Think Out Loud — Quá trình tư duy từ ZERO đến SOLUTION

> 🎙️ Phần này mô phỏng ĐÚNG cách suy nghĩ khi phỏng vấn.

```mermaid
flowchart LR
    P1["📖 Phase 1\nĐọc đề\n~15s"] --> P2["✏️ Phase 2\nVẽ ví dụ\n~1m"]
    P2 --> P3["💡 Phase 3\nInsight!\n~30s"]
    P3 --> P4["💻 Phase 4\nCode\n~30s"]
    P4 --> P5["🎤 Phase 5\nProof\n~1m"]

    P1 -.- I1["🔑 pair → remove larger\ncost = smaller"]
    P2 -.- I2["🔑 min luôn thắng\nmin = cost mỗi lần"]
    P3 -.- I3["🔑 Total = n-1 × min"]
    P4 -.- I4["🔑 Chỉ 2 dòng code!"]
    P5 -.- I5["🔑 Greedy proof\nlower bound = upper bound"]

    style P1 fill:#E3F2FD,stroke:#1976D2
    style P2 fill:#E8F5E9,stroke:#388E3C
    style P3 fill:#FFF3E0,stroke:#F57C00
    style P4 fill:#F3E5F5,stroke:#7B1FA2
    style P5 fill:#FCE4EC,stroke:#C2185B
    style I1 fill:#BBDEFB,stroke:#1976D2
    style I2 fill:#C8E6C9,stroke:#388E3C
    style I3 fill:#FFE0B2,stroke:#F57C00
    style I4 fill:#E1BEE7,stroke:#7B1FA2
    style I5 fill:#F8BBD0,stroke:#C2185B
```

### Phase 1: Đọc đề — 15 giây

```
  🧠 "Hmm... pick a pair, remove larger, cost = smaller..."

  Ghi ra giấy ngay:
    ✏️ Each op: pair(a, b) → remove max(a,b), cost = min(a,b)
    ✏️ Goal: arr size → 1
    ✏️ Find: minimum total cost

  🧠 "Thú vị... cost = phần tử NHỎ hơn."
  🧠 "Nếu luôn dùng phần tử nhỏ nhất → cost NHỎ nhất mỗi lần?"
  🧠 "→ Greedy sense! Kiểm tra giả thuyết..."
```

### Phase 2: Vẽ ví dụ — 1 phút

```mermaid
flowchart LR
    subgraph COMPARE["✏️ So sánh 2 chiến thuật — arr = [5, 1, 3]"]
        direction TB
        subgraph A["✅ Chiến thuật A: dùng min=1"]
            A1["(1,5)→xóa 5\ncost=1"] --> A2["(1,3)→xóa 3\ncost=1"]
            A2 --> AT["Total = 2"]
        end
        subgraph B["❌ Chiến thuật B: dùng 3 trước"]
            B1["(3,5)→xóa 5\ncost=3"] --> B2["(1,3)→xóa 3\ncost=1"]
            B2 --> BT["Total = 4"]
        end
    end

    AT -.- WIN["✅ A thắng!\n2 < 4"]

    style AT fill:#4CAF50,color:white
    style BT fill:#F44336,color:white
    style WIN fill:#C8E6C9,stroke:#4CAF50
```

```
  Tự tạo ví dụ: arr = [5, 1, 3]

  🧠 "min = 1. Thử dùng 1 cho tất cả trận:"

  Trận 1: (1, 5) → xóa 5, cost=1 → [1, 3]
  Trận 2: (1, 3) → xóa 3, cost=1 → [1]
  Total = 2

  🧠 "Thử KHÔNG dùng min trước:"
  Trận 1: (3, 5) → xóa 5, cost=3 → [1, 3]
  Trận 2: (1, 3) → xóa 3, cost=1 → [1]
  Total = 4 > 2 ← ĐẮT HƠN!

  🧠 "Confirmed! Luôn dùng min = tối ưu!"
  🧠 "Công thức: (n-1) × min = (3-1) × 1 = 2 ✅"
```

### Phase 3: Insight — 30 giây

```
  🧠 "Tại sao min luôn tối ưu?"

  1. min KHÔNG BAO GIỜ bị loại (luôn là nhỏ hơn trong pair)
  2. min có thể tham gia MỌI n-1 trận
  3. Cost mỗi trận = min = THẤP NHẤT có thể
  4. Tổng = (n-1) × min = LOWER BOUND!

  🧠 "Vậy chỉ cần tìm min và nhân (n-1). Done!"
```

### Phase 4: Code — 30 giây

```
  🧠 "Code 2 dòng:"
    const min = Math.min(...arr);
    return (arr.length - 1) * min;

  🧠 "O(n) time, O(1) space. Optimal."
  🧠 "Edge case: n=1 → return 0 ✅ (auto-handled!)"
```

### Phase 5: Nếu interviewer hỏi tiếp

```
  Q: "Chứng minh greedy là optimal?"
  A: "Mỗi operation cost ≥ min (vì cost = smaller ≥ min).
      Cần n-1 operations → total ≥ (n-1) × min.
      Chiến thuật dùng min đạt đúng (n-1) × min.
      Lower bound = upper bound → optimal."

  Q: "Nếu cost = max(pair) thì sao?"
  A: "MAX sẽ bị loại mỗi lần (nó là larger).
      Hmm... không, MAX sẽ sống vì cost = max(pair) chỉ
      là chi phí, không phải quyết định xóa ai.
      Cần suy nghĩ lại..."
      
  Q: "Nếu remove SMALLER thay vì larger?"
  A: "Thì MAX sống sót! Cost mỗi lần = min(pair).
      Nhưng min bị loại dần → cost tăng dần.
      Trở thành bài khó hơn, cần greedy/DP."

  Q: "Math.min(...arr) có vấn đề gì?"
  A: "Stack overflow với mảng lớn! Dùng reduce hoặc for loop."
```

---

## 📊 Tổng kết — Approach Selection Guide

```mermaid
flowchart TD
    Q["❓ Chọn approach nào?"] --> Q1{{"Bạn đang ở đâu?"}}

    Q1 -->|"Phỏng vấn"| A3["⭐ Approach 3\nFormula: n-1 × min\n2 dòng code!"]
    Q1 -->|"Verify đáp án"| A1["Approach 1\nBrute Force recursive"]
    Q1 -->|"Code production\nmảng rất lớn"| A4["Approach 4\nreduce (an toàn)"]
    Q1 -->|"Hiểu bài"| A2["Approach 2\nSimulation"]

    A3 --> BEST["✅ BEST CHOICE\nO(n) time, O(1) space\nChỉ 2 dòng!"]

    style A3 fill:#4CAF50,color:white,stroke:#2E7D32,stroke-width:3px
    style BEST fill:#C8E6C9,stroke:#4CAF50,stroke-width:2px
    style Q fill:#9C27B0,color:white
    style A1 fill:#FFCDD2,stroke:#F44336
    style A2 fill:#FFF9C4,stroke:#FBC02D
    style A4 fill:#E3F2FD,stroke:#1976D2
```

```mermaid
graph LR
    subgraph SUMMARY["📌 Tổng kết bài toán"]
        direction TB
        S1["1. Tìm MIN"] --> S2["2. n-1 operations"]
        S2 --> S3["3. Cost mỗi lần = MIN"]
        S3 --> S4["4. Total = n-1 × MIN"]
    end

    subgraph KEY["🔑 Key Insights"]
        K1["Greedy:\nMIN sống sót"]
        K2["Tournament:\nn-1 trận loại"]
        K3["Lower bound:\ncost ≥ min mỗi lần"]
        K4["2 dòng code =\nO(n) optimal"]
    end

    S1 -.- K1
    S2 -.- K2
    S3 -.- K3
    S4 -.- K4

    style S1 fill:#E3F2FD,stroke:#1976D2
    style S2 fill:#FFF3E0,stroke:#F57C00
    style S3 fill:#E8F5E9,stroke:#388E3C
    style S4 fill:#F3E5F5,stroke:#7B1FA2
    style K1 fill:#BBDEFB,stroke:#1976D2
    style K2 fill:#FFE0B2,stroke:#F57C00
    style K3 fill:#C8E6C9,stroke:#388E3C
    style K4 fill:#E1BEE7,stroke:#7B1FA2
```

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  Approach         │ Time        │ Space │ Pros           │ Cons          │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  Brute Force      │ O(n! × n)  │ O(n)  │ Verify đáp án  │ Cực chậm      │
  │  (all combos)     │            │       │                │               │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  Simulation       │ O(n²)      │ O(n)  │ Trực quan      │ Thừa!         │
  │  (while loop)     │            │       │ Dễ hiểu        │               │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  Formula          │ O(n)       │ O(1)  │ 2 dòng code!   │ Stack overflow│
  │  ⭐ KHUYẾN KHÍCH  │            │       │ Tối ưu nhất    │ nếu n > 100k  │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  reduce           │ O(n)       │ O(1)  │ An toàn        │ Dài hơn       │
  │  (safe)           │            │       │ Không overflow │               │
  └──────────────────────────────────────────────────────────────────────────┘

  📌 Kết luận: Formula approach là BEST CHOICE cho phỏng vấn!
     → Bài "trick" — nhìn phức tạp nhưng code 2 dòng!
     → Key: CHỨNG MINH greedy quan trọng hơn code!
     → Interviewer muốn nghe WHY, không chỉ HOW!
```

---

## Edge Cases Chi Tiết

```
  ┌───────────────────────────────────────────────────────────────────┐
  │  Case                │ Input           │ Output │ Tại sao?        │
  ├───────────────────────────────────────────────────────────────────┤
  │  Mảng 1 phần tử      │ [10]            │ 0      │ Đã size 1!      │
  │                      │                 │        │ 0 operations     │
  ├───────────────────────────────────────────────────────────────────┤
  │  Mảng 2 phần tử      │ [3, 7]          │ 3      │ 1 op, cost=3    │
  ├───────────────────────────────────────────────────────────────────┤
  │  Tất cả bằng nhau    │ [5, 5, 5, 5]    │ 15     │ (4-1)×5=15      │
  │                      │                 │        │ min=5           │
  ├───────────────────────────────────────────────────────────────────┤
  │  Có min trùng lặp    │ [2, 2, 7, 2]    │ 6      │ (4-1)×2=6       │
  │                      │                 │        │ min=2 vẫn đúng  │
  ├───────────────────────────────────────────────────────────────────┤
  │  Min ở cuối mảng     │ [9, 8, 7, 1]    │ 3      │ (4-1)×1=3       │
  │                      │                 │        │ Vị trí min      │
  │                      │                 │        │ không ảnh hưởng │
  ├───────────────────────────────────────────────────────────────────┤
  │  Mảng rất lớn        │ n=10⁶, min=1    │ 999999 │ (10⁶-1)×1       │
  │                      │                 │        │ O(n) vẫn nhanh  │
  └───────────────────────────────────────────────────────────────────┘

  ⚠️ CHÚ Ý: Bài này KHÔNG có case impossible!
     → Luôn có lời giải (miễn n ≥ 1)
     → Khác với Minimum Increment by K (có return -1)
```

---

## 📚 Bài tập liên quan

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  Bài                              │ Difficulty │ Pattern tương tự │
  ├──────────────────────────────────────────────────────────────────┤
  │  GfG: Min Cost Array Size 1      │ Easy       │ Greedy, (n-1)×min│
  │  LC 1000: Min Cost Merge Stones  │ Hard       │ Merge cost, DP   │
  │  LC 1167: Min Cost Connect Sticks│ Medium     │ Huffman, Heap    │
  │  LC 2208: Min Ops Halve Sum     │ Medium     │ Greedy, MaxHeap  │
  │  GfG: Huffman Coding             │ Medium     │ Greedy, Priority │
  └──────────────────────────────────────────────────────────────────┘

  📌 Thứ tự học khuyến nghị:
     1. GfG: Min Cost Array Size 1   ← BÀI NÀY (easiest, trick)
     2. LC 1167: Connect Sticks      ← Merge cost = sum → Heap
     3. LC 2208: Halve Sum           ← Greedy + MaxHeap
     4. LC 1000: Merge Stones        ← Interval DP (hard)
```
