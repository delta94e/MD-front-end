# 📐 Count Possible Triangles — GfG (Medium)

> 📖 Code: [Count Possible Triangles.js](./Count%20Possible%20Triangles.js)

```mermaid
graph TD
    A["📐 Count Possible Triangles"] --> B["Sort mảng!"]
    B --> C["Fix cạnh LỚN NHẤT = arr[i]"]
    C --> D["Two Pointers: left=0, right=i-1"]
    D --> E{"arr[left] + arr[right] > arr[i]?"}
    E -->|"Yes"| F["Count += right - left"]
    F --> G["right--"]
    E -->|"No"| H["left++"]
    G --> D
    H --> D
    D --> I["✅ O(n²) — tối ưu!"]

    style B fill:#FF9800,color:white
    style I fill:#4CAF50,color:white
```

```mermaid
graph LR
    subgraph "Pattern: Sort + Two Pointers"
        P1["Two Sum: sort + 2 ptrs"]
        P2["Three Sum: fix 1 + 2 ptrs"]
        P3["Count Triangles: fix lớn nhất + 2 ptrs ← BÀI NÀY"]
    end

    subgraph "Triangle Inequality"
        T1["a + b > c"]
        T2["a + c > b"]
        T3["b + c > a"]
        T4["Nếu sorted a ≤ b ≤ c: chỉ cần a + b > c!"]
    end
```

---

## R — Repeat & Clarify

🧠 *"Đếm số BỘ BA phần tử có thể tạo thành tam giác. Điều kiện: tổng 2 cạnh BẤT KỲ phải lớn hơn cạnh thứ 3."*

> 🎙️ *"Given an array of positive integers, count the number of triplets that can form valid triangles. The sum of any two sides must be strictly greater than the third side."*

### Clarification Questions

```
Q: Triangle Inequality là gì?
A: Cho 3 cạnh a, b, c:
   a + b > c  VÀ  a + c > b  VÀ  b + c > a
   → TẤT CẢ 3 điều kiện phải thỏa mãn!

Q: Nếu mảng ĐÃ SORT (a ≤ b ≤ c)?
A: CHỈ CẦN KIỂM TRA: a + b > c!
   Vì a ≤ b ≤ c nên:
   → a + c > b? LUÔN ĐÚNG! (c ≥ b, nên a + c ≥ a + b > b)
   → b + c > a? LUÔN ĐÚNG! (b + c ≥ 2a > a)
   → CHỈ CÒN: a + b > c!

Q: Phần tử trùng có tính không?
A: Tính theo VỊ TRÍ khác nhau (index khác nhau)!
   [3, 3, 3] → 1 tam giác (3 vị trí khác nhau)

Q: Return COUNT, không phải danh sách?
A: ĐÚNG! Chỉ cần đếm số lượng.

Q: Giá trị 0 có xuất hiện không?
A: Bài nói positive integers → KHÔNG CÓ 0!
   (Quan trọng vì chứng minh 2 điều kiện tự động thỏa cần a > 0!)

Q: Strict hay non-strict inequality?
A: STRICT! a + b > c, KHÔNG PHẢI a + b ≥ c!
   [1, 2, 3]: 1+2=3 → NOT strictly > → NOT valid!
```

### Tại sao bài này quan trọng?

```
  ⭐ Bài này kết hợp 3 concepts:

  1. SORT → biến 3 điều kiện thành 1 điều kiện!
  2. FIX 1 CẠNH → cố định cạnh lớn nhất
  3. TWO POINTERS → đếm cặp thỏa mãn!

  Pattern giống Three Sum:
  ┌───────────────────────────────────────────────────┐
  │  Three Sum = 0:   fix 1 + 2 ptrs tìm tổng = 0    │
  │  Count Triangles: fix lớn nhất + 2 ptrs tìm > c  │
  │  Three Sum Close: fix 1 + 2 ptrs tìm gần target  │
  └───────────────────────────────────────────────────┘

  ⚠️ TRICK quan trọng:
    Sort → a + b > c = điều kiện DUY NHẤT!
    Fix c (cạnh lớn nhất) → Two Pointers tìm a + b > c!
    count += right - left = BATCH COUNTING (không +1!)
```

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

### INSIGHT CỐT LÕI: "Sort → 3 điều kiện thành 1!"

```
  ⭐ Ẩn dụ: "3 que gỗ ghép TAM GIÁC!"

  Cho 3 que dài a, b, c. Khi nào ghép được?
  → 2 que NGẮN cộng lại phải DÀI HƠN que dài nhất!
  → Nếu 2 que ngắn = que dài → nằm PHẲNG, không tạo tam giác!

  ┌─────────────────────────────────────────────────────┐
  │  a + b > c   (2 que ngắn ghép lại phải DÀI HƠN     │
  │               que dài nhất!)                         │
  │                                                      │
  │  VÍ DỤ: a=3, b=4, c=7                               │
  │    3 + 4 = 7 > 7? → NO! Không thành tam giác!       │
  │    (2 que ngắn nằm PHẲNG trên que dài!)             │
  │                                                      │
  │  VÍ DỤ: a=3, b=4, c=6                               │
  │    3 + 4 = 7 > 6? → YES! Thành tam giác! ✅         │
  └─────────────────────────────────────────────────────┘
```

### Tại sao Sort biến 3 điều kiện thành 1?

```
  Sorted: a ≤ b ≤ c

  Điều kiện 1: a + b > c   ← CẦN CHECK! (có thể sai)
  Điều kiện 2: a + c > b   ← LUÔN ĐÚNG!
  Điều kiện 3: b + c > a   ← LUÔN ĐÚNG!

  ═══ CHỨNG MINH chi tiết ═══════════════════════════

  Điều kiện 2: a + c > b
    c ≥ b (vì sorted) → a + c ≥ a + b > b (vì a > 0)
    → LUÔN ĐÚNG! ✅

  Điều kiện 3: b + c > a
    b ≥ a VÀ c ≥ a (vì sorted, a nhỏ nhất)
    → b + c ≥ a + a = 2a > a (vì a > 0)
    → LUÔN ĐÚNG! ✅

  ⚠️ Chỉ điều kiện 1 có thể FAIL!
     c lớn nhất → 2 cạnh NHỎ cộng lại có thể KHÔNG > c!

  → SORT = TRICK CỰC MẠNH cho bài này!
```

### Fix cạnh lớn nhất + Two Pointers

```
  ⭐ Strategy:
  1. SORT mảng tăng dần
  2. FIX c = arr[i] (cạnh lớn nhất, duyệt từ cuối)
  3. TWO POINTERS trong [0..i-1]: tìm bao nhiêu cặp (a, b) mà a+b > c

  Tại sao fix C chứ không fix A?
    → Fix cạnh LỚN NHẤT → biết ngưỡng cần vượt!
    → 2 pointers tìm cặp (a, b) sao cho a+b > c
    → left=0 (nhỏ nhất), right=i-1 (lớn tiếp theo)

  ┌─────────────────────────────────────────────────────┐
  │  arr[left] + arr[right] > arr[i]?                    │
  │                                                      │
  │  YES → TẤT CẢ left' từ left đến right-1 cũng thỏa! │
  │         (vì arr[left'] ≥ arr[left])                  │
  │         → count += right - left                      │
  │         → right-- (thử cạnh nhỏ hơn)                │
  │                                                      │
  │  NO  → left++ (cần cạnh lớn hơn!)                   │
  └─────────────────────────────────────────────────────┘
```

### Tại sao count += right - left? (KHÔNG PHẢI +1!)

```
  ⭐ INSIGHT QUAN TRỌNG — Hiểu sai = sai toàn bộ bài!

  Sorted: [..., left, left+1, ..., right-1, right, ..., i]

  Nếu arr[left] + arr[right] > arr[i]:
    → arr[left] = nhỏ nhất trong range [left, right]
    → Nếu arr[left] + arr[right] > arr[i]
    → THÌ arr[left+1] + arr[right] > arr[i] CHẮC CHẮN! (vì lớn hơn!)
    → VÀ arr[left+2] + arr[right] > arr[i] CHẮC CHẮN!
    → ...
    → VÀ arr[right-1] + arr[right] > arr[i] CHẮC CHẮN!

    → TẤT CẢ cặp (arr[k], arr[right]) với k ∈ [left, right-1] đều thỏa!
    → Số cặp = right - 1 - left + 1 = right - left!

  VÍ DỤ: arr = [3, 4, 6, 7], fix c = arr[3] = 7
    left=0 (3), right=2 (6): 3+6=9 > 7 ✅
    → Cặp thỏa: (3,6), (4,6) → count += 2-0 = 2!
    → KHÔNG cần duyệt từng cặp!

  📌 Đây là BATCH COUNTING — lý do biến O(n³) thành O(n²)!
```

```mermaid
graph TD
    A["Sort arr"] --> B["i = n-1 → 2: fix c = arr[i]"]
    B --> C["left=0, right=i-1"]
    C --> D{"left < right?"}
    D -->|"No"| B
    D -->|"Yes"| E{"arr[left]+arr[right] > arr[i]?"}
    E -->|"Yes"| F["count += right-left, right--"]
    E -->|"No"| G["left++"]
    F --> D
    G --> D
    B --> H["✅ Return count"]

    style A fill:#FF9800,color:white
    style H fill:#4CAF50,color:white
    style F fill:#4CAF50,color:white
```

---

## 🧭 Luồng Suy Nghĩ — Từ đọc đề đến solution

### Bước 1: Đọc đề → Keywords

```
  Đề: "Count triplets that form valid triangles"

  Gạch chân:
    ✏️ "count"        → đếm, không liệt kê
    ✏️ "triplets"      → bộ 3
    ✏️ "valid triangle" → triangle inequality
    ✏️ "positive"      → > 0 (quan trọng cho chứng minh!)

  🧠 Trigger:
    "Bộ 3" + "inequality" → Sort + fix 1 + 2 pointers!
    "Count" → batch counting (right - left)!
```

### Bước 2: Approaches từ brute → optimal

```
  🧠 Approach 1: Brute Force O(n³)
    3 vòng for → check 3 điều kiện → quá chậm!

  🧠 Approach 2: Sort + Brute O(n³) → still slow!
    Sort → 1 điều kiện nhưng vẫn 3 vòng for!

  🧠 Approach 3: Sort + Fix + 2 Pointers O(n²) ⭐
    Sort → fix c → 2 pointers → batch counting!

  📌 Progression:
    O(n³) → Sort (rút gọn) → 2 pointers (batch) → O(n²)!
```

### Bước 3: Cây quyết định

```mermaid
flowchart TD
    START["🧠 Count Triangles?"] --> Q1["Sort: 3 ĐK → 1 ĐK"]
    Q1 --> Q2["Fix c = lớn nhất"]
    Q2 --> Q3["2 pointers: a+b > c?"]
    Q3 --> Y["YES: count += right-left"]
    Q3 --> N["NO: left++"]
    Y --> R["right--"]

    style Q1 fill:#FF9800,color:white
    style Y fill:#4CAF50,color:white
```

---

## E — Examples

```
VÍ DỤ 1: arr = [4, 6, 3, 7]

  Sort: [3, 4, 6, 7]

  Fix c = 7 (i=3): left=0, right=2
    3+6=9 > 7 ✅ → count += 2-0 = 2    (cặp: [3,6], [4,6])
    right=1: 3+4=7 > 7? NO → left++
    left=1: left ≥ right → stop

  Fix c = 6 (i=2): left=0, right=1
    3+4=7 > 6 ✅ → count += 1-0 = 1    (cặp: [3,4])
    right=0: left ≥ right → stop

  → Total = 2 + 1 = 3 ✅
  Triangles: [3,4,6], [3,6,7], [4,6,7]
```

```
VÍ DỤ 2: arr = [1, 2, 3]

  Sort: [1, 2, 3]

  Fix c = 3 (i=2): left=0, right=1
    1+2=3 > 3? NO → left++
    left=1: left ≥ right → stop

  → Total = 0 ✅ (1+2 KHÔNG > 3, chỉ = 3!)
```

```
VÍ DỤ 3 (Edge): arr = [3, 3, 3]

  Sort: [3, 3, 3]

  Fix c = 3 (i=2): left=0, right=1
    3+3=6 > 3 ✅ → count += 1-0 = 1
    right=0: left ≥ right → stop

  → Total = 1 ✅ (tam giác đều!)
```

```
VÍ DỤ 4 (Edge): arr = [1, 1, 1, 1]

  Sort: [1, 1, 1, 1]

  Fix c = 1 (i=3): left=0, right=2
    1+1=2 > 1 ✅ → count += 2-0 = 2  (cặp: [0,2], [1,2])
    right=1: 1+1=2 > 1 ✅ → count += 1-0 = 1  (cặp: [0,1])
    right=0: stop

  Fix c = 1 (i=2): left=0, right=1
    1+1=2 > 1 ✅ → count += 1-0 = 1  (cặp: [0,1])
    right=0: stop

  → Total = 2 + 1 + 1 = 4 ✅ (C(4,3) = 4!)
```

### Trace dạng bảng — VD chi tiết

```
  arr = [4, 6, 3, 7]    Sort: [3, 4, 6, 7]

  ═══ i=3: c = 7 ═══════════════════════════════════════

  ┌──────┬──────┬───────┬─────────┬───────┬─────────────────────┐
  │ Step │ left │ right │ a+b     │ > c?  │ Action              │
  ├──────┼──────┼───────┼─────────┼───────┼─────────────────────┤
  │ 1    │ 0(3) │ 2(6)  │ 3+6=9   │ > 7 ✅│ count+=2, right=1  │
  │ 2    │ 0(3) │ 1(4)  │ 3+4=7   │ = 7 ❌│ left=1             │
  │ 3    │ 1≥1  │       │         │       │ STOP               │
  └──────┴──────┴───────┴─────────┴───────┴─────────────────────┘
  count = 2

  ═══ i=2: c = 6 ═══════════════════════════════════════

  ┌──────┬──────┬───────┬─────────┬───────┬─────────────────────┐
  │ Step │ left │ right │ a+b     │ > c?  │ Action              │
  ├──────┼──────┼───────┼─────────┼───────┼─────────────────────┤
  │ 1    │ 0(3) │ 1(4)  │ 3+4=7   │ > 6 ✅│ count+=1, right=0  │
  │ 2    │ 0≥0  │       │         │       │ STOP               │
  └──────┴──────┴───────┴─────────┴───────┴─────────────────────┘
  count = 2 + 1 = 3 ✅
```

### Minh họa Two Pointers

```
  Sorted arr = [3, 4, 6, 7]

  Fix c = arr[3] = 7:

  ┌───┬───┬───┐
  │ 3 │ 4 │ 6 │  7    ← c (fixed!)
  └───┴───┴───┘
    ↑       ↑
   left   right

  Step 1: 3+6=9 > 7 ✅
    → Cặp: (3,6), (4,6) → count += 2
    → right--

  ┌───┬───┐
  │ 3 │ 4 │  6   7
  └───┴───┘
    ↑   ↑
   left right

  Step 2: 3+4=7 > 7? NO
    → left++

  ┌───┐
  │ 4 │  6   7
  └───┘
    ↑
  left=right → STOP!

  count = 2 cho c=7
```

---

## A — Approach

### Approach 1: Brute Force — O(n³)

```
  3 vòng for lồng nhau:
    for i: for j > i: for k > j:
      check arr[i]+arr[j]>arr[k] && arr[i]+arr[k]>arr[j] && arr[j]+arr[k]>arr[i]

  → O(n³) — chỉ NÓI trong phỏng vấn!
```

### Approach 2: Sort + Two Pointers — O(n²) ⭐

```
  1. Sort mảng tăng dần
  2. Fix c = arr[i] (lớn nhất), duyệt i = n-1 → 2
  3. Two Pointers: left=0, right=i-1
     - a+b > c → count += right-left, right--
     - a+b ≤ c → left++
  4. Return count

  Time: O(n log n + n²) = O(n²)
  Space: O(1) (sort in-place)
```

---

## C — Code ✅

### Solution 1: Brute Force — O(n³)

```javascript
function countTrianglesBrute(arr) {
  const n = arr.length;
  let count = 0;

  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        if (
          arr[i] + arr[j] > arr[k] &&
          arr[i] + arr[k] > arr[j] &&
          arr[j] + arr[k] > arr[i]
        ) {
          count++;
        }
      }
    }
  }

  return count;
}
```

### Solution 2: Sort + Two Pointers — O(n²) ⭐

```javascript
function countTriangles(arr) {
  const n = arr.length;
  arr.sort((a, b) => a - b); // ⭐ SORT trước!
  let count = 0;

  // Fix cạnh LỚN NHẤT = arr[i], duyệt từ cuối
  for (let i = n - 1; i >= 2; i--) {
    let left = 0;
    let right = i - 1;

    while (left < right) {
      if (arr[left] + arr[right] > arr[i]) {
        // ⭐ TẤT CẢ left' từ left đến right-1 đều thỏa!
        count += right - left;
        right--;
      } else {
        // Cần cặp lớn hơn → tăng left
        left++;
      }
    }
  }

  return count;
}
```

---

## 🔬 Deep Dive — Giải thích CHI TIẾT từng dòng

> 💡 Phân tích **từng dòng** để hiểu **TẠI SAO**.

```javascript
function countTriangles(arr) {
  const n = arr.length;

  // ═══════════════════════════════════════════════════════════
  // SORT: biến 3 điều kiện → 1 điều kiện!
  // ═══════════════════════════════════════════════════════════
  //
  // TẠI SAO sort?
  //   Unsorted: check a+b>c AND a+c>b AND b+c>a (3 checks!)
  //   Sorted a ≤ b ≤ c: chỉ check a+b > c! (1 check!)
  //
  // ⚠️ sort((a,b) => a-b) QUAN TRỌNG!
  //   Nếu quên comparator → sort lexicographic:
  //   [3, 10, 7] → ["10", "3", "7"] → SAI!
  //
  arr.sort((a, b) => a - b);
  let count = 0;

  // ═══════════════════════════════════════════════════════════
  // FIX c = arr[i]: cạnh LỚN NHẤT
  // ═══════════════════════════════════════════════════════════
  //
  // TẠI SAO fix c (lớn nhất)?
  //   Fix a (nhỏ nhất): b+c > a LUÔN TRUE → vô ích!
  //   Fix c (lớn nhất): a+b > c có thể FALSE → filter!
  //
  // TẠI SAO i >= 2?
  //   Cần ít nhất 3 phần tử: index 0, 1, 2
  //   i = 2 → left=0, right=1 → minimum case!
  //
  // TẠI SAO duyệt từ CUỐI (n-1)?
  //   c phải là LỚN NHẤT trong sorted array
  //   → fixed ở cuối, 2 pointers tìm trong phần nhỏ hơn!
  //
  for (let i = n - 1; i >= 2; i--) {
    let left = 0;
    let right = i - 1;

    // ═══════════════════════════════════════════════════════
    // TWO POINTERS: đếm cặp (a, b) mà a+b > c
    // ═══════════════════════════════════════════════════════
    //
    // left = index nhỏ nhất (a nhỏ nhất)
    // right = index lớn nhất < i (b lớn nhất)
    //
    while (left < right) {
      if (arr[left] + arr[right] > arr[i]) {
        // ─── BATCH COUNTING! ───
        //
        // arr[left] + arr[right] > c
        // → arr[left+1] + arr[right] > c (lớn hơn!)
        // → arr[left+2] + arr[right] > c
        // → ...
        // → arr[right-1] + arr[right] > c
        //
        // → TẤT CẢ k ∈ [left, right-1] ghép arr[right] đều thỏa!
        // → Số cặp = right - left
        //
        // ⚠️ right - left, KHÔNG PHẢI right - left + 1!
        //    Vì cặp (right, right) = chính nó → không tính!
        //    Cặp: (left, right), (left+1, right), ..., (right-1, right)
        //    = right - 1 - left + 1 = right - left!
        //
        count += right - left;

        // right-- để thử cạnh b NHỎ hơn
        // (đã đếm hết cặp với arr[right] rồi!)
        right--;
      } else {
        // ─── Tổng CHƯA ĐỦ! ───
        //
        // arr[left] + arr[right] ≤ c
        // → Cần a LỚN HƠN → left++!
        //
        // TẠI SAO không right++?
        //   right đang ở i-1 (lớn nhất rồi!)
        //   Chỉ có thể tăng left để tăng tổng!
        //
        left++;
      }
    }
  }

  return count;
}
```

```mermaid
flowchart TD
    subgraph LOGIC["⭐ Core Logic"]
        A["Sort tăng dần"] --> B["for i = n-1 → 2"]
        B --> C["c = arr[i] = lớn nhất"]
        C --> D["left=0, right=i-1"]
        D --> E{"a+b > c?"}
        E -->|"YES"| F["ALL (left..right-1, right)\nare valid triangles!"]
        F --> G["count += right-left\nright--"]
        E -->|"NO"| H["Tổng chưa đủ\nleft++"]
        G --> D
        H --> D
    end

    style F fill:#4CAF50,color:white
    style A fill:#FF9800,color:white
```

---

## 📐 Invariant — Chứng minh tính đúng đắn

```
  📐 INVARIANT cho Two Pointers (fixed c = arr[i]):

  Tại mỗi iteration:
    1. Tất cả cặp (a, b) với a ∈ [left, right] VÀ b > right
       → ĐÃ ĐƯỢC ĐẾM! (từ các bước right-- trước)

    2. Tất cả cặp (a, b) với a < left VÀ b ∈ [left, right]
       → ĐÃ ĐƯỢC LOẠI! (vì a+b ≤ c → tất cả a' < a cũng ≤ c)

  CHỨNG MINH correctness:
  ┌──────────────────────────────────────────────────────────────┐
  │  Khi arr[left] + arr[right] > c:                            │
  │    ∀ k ∈ [left, right-1]:                                   │
  │      arr[k] ≥ arr[left] (sorted!)                           │
  │      → arr[k] + arr[right] ≥ arr[left] + arr[right] > c!   │
  │    → (right - left) cặp hợp lệ! ✅                          │
  │                                                              │
  │  Khi arr[left] + arr[right] ≤ c:                            │
  │    arr[left] + arr[right] ≤ c                                │
  │    → arr[left] + arr[right-1] ≤ c (arr[right-1] ≤ arr[right])│
  │    → arr[left] + arr[right-2] ≤ c                           │
  │    → TẤT CẢ cặp (left, k) với k ≤ right đều ≤ c!         │
  │    → left++ để thử a lớn hơn! ✅                             │
  └──────────────────────────────────────────────────────────────┘

  📐 COMPLETENESS:
    Mọi cặp (a, b) với 0 ≤ a < b ≤ i-1 đều được xét:
    - Nếu hợp lệ: đếm qua count += right-left khi b = right
    - Nếu không: bị loại khi left vượt qua a
    → KHÔNG BỎ SÓT, KHÔNG ĐẾM TRÙNG! ∎

  📐 TERMINATION:
    Mỗi step: left++ hoặc right--
    → gap = right - left giảm ít nhất 1 mỗi step
    → Tối đa i-1 steps → terminate! ∎

  📐 TẠI SAO O(n²)?
    Outer loop: n-2 iterations (i = n-1 → 2)
    Inner loop: ≤ i-1 iterations (left + right cross)
    Tổng inner = (n-2) + (n-3) + ... + 1 = O(n²/2) = O(n²) ∎
```

---

## ❌ Common Mistakes — Lỗi thường gặp

```mermaid
graph TD
    START["🚨 Common Mistakes"] --> M1["Mistake #1\nQuên SORT"]
    START --> M2["Mistake #2\nFix cạnh NHỎ\nthay vì LỚN"]
    START --> M3["Mistake #3\ncount++\nthay count+=r-l"]
    START --> M4["Mistake #4\nDùng ≥\nthay vì >"]
    START --> M5["Mistake #5\nSort comparator\nsai"]

    M1 --> M1a["❌ 3 conditions\nO(n³)!"]
    M1 --> M1b["✅ Sort\n→ 1 condition O(n²)"]

    M2 --> M2a["❌ Fix a:\nb+c>a always true!"]
    M2 --> M2b["✅ Fix c:\na+b>c can fail!"]

    M3 --> M3a["❌ count++:\nmiss batch!"]
    M3 --> M3b["✅ count+=r-l:\nbatch counting!"]

    M4 --> M4a["❌ a+b≥c:\n[1,2,3] = YES → SAI"]
    M4 --> M4b["✅ a+b>c:\n[1,2,3] = NO → ĐÚNG"]

    M5 --> M5a["❌ default sort:\nlexicographic!"]
    M5 --> M5b["✅ (a,b)=>a-b:\nnumeric!"]

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

### Mistake 1: Quên SORT!

```javascript
// ❌ SAI: không sort → phải check 3 điều kiện!
for (let i = 0; i < n - 2; i++)
  for (let j = i + 1; j < n - 1; j++)
    for (let k = j + 1; k < n; k++)
      if (arr[i]+arr[j]>arr[k] && arr[i]+arr[k]>arr[j] && arr[j]+arr[k]>arr[i])
        count++;
// O(n³)!

// ✅ ĐÚNG: sort → 1 condition → 2 pointers → O(n²)!
arr.sort((a, b) => a - b);
// Chỉ cần check: a + b > c!
```

### Mistake 2: Fix cạnh NHỎ NHẤT!

```javascript
// ❌ SAI: fix a (nhỏ nhất)!
for (let i = 0; i < n - 2; i++) {
  // arr[j] + arr[k] > arr[i] → LUÔN TRUE (vì j,k > i, sorted!)
  // → Không filter được gì → vô ích!
}

// ✅ ĐÚNG: fix c (LỚN NHẤT)!
for (let i = n - 1; i >= 2; i--) {
  // arr[left] + arr[right] > arr[i] → CÓ THỂ FALSE → filter!
}
```

### Mistake 3: count++ thay vì count += right - left!

```javascript
// ❌ SAI: chỉ đếm 1 cặp!
if (arr[left] + arr[right] > arr[i]) {
  count++;     // chỉ đếm (left, right) → MISS tất cả left' khác!
  right--;
}

// ✅ ĐÚNG: đếm TẤT CẢ cặp hợp lệ!
if (arr[left] + arr[right] > arr[i]) {
  count += right - left;  // ĐẾM BATCH!
  right--;
}

// VD: [3, 4, 6, 7], c=7, left=0, right=2
// ❌ count++ → đếm 1 (chỉ [3,6])
// ✅ count+=2 → đếm 2 ([3,6] VÀ [4,6])
```

### Mistake 4: Dùng >= thay vì >!

```javascript
// ❌ SAI: dùng >= !
if (arr[left] + arr[right] >= arr[i]) { ... }
// [1, 2, 3]: 1+2=3 >= 3? YES → count = 1 → SAI!
// (1+2=3, KHÔNG PHẢI strictly greater!)

// ✅ ĐÚNG: dùng > !
if (arr[left] + arr[right] > arr[i]) { ... }
// [1, 2, 3]: 1+2=3 > 3? NO → count = 0 → ĐÚNG!
```

### Mistake 5: Sort comparator sai!

```javascript
// ❌ SAI: default sort = lexicographic!
arr.sort();
// [10, 3, 7] → ["10", "3", "7"] → [10, 3, 7] → SAI!
// "10" < "3" (ký tự '1' < '3')

// ✅ ĐÚNG: numeric comparator!
arr.sort((a, b) => a - b);
// [10, 3, 7] → [3, 7, 10] → ĐÚNG!
```

---

## O — Optimize

```
                       Time          Space     Ghi chú
  ──────────────────────────────────────────────────────
  Brute Force          O(n³)         O(1)      3 vòng for
  Sort + 2 Pointers ⭐ O(n²)         O(1)*     Tối ưu!

  * O(1) nếu sort in-place, O(n) nếu sort cần space

  ⚠️ Tại sao O(n²)?
    Vòng ngoài: n-2 iterations (fix c)
    Vòng trong: Two Pointers ≤ i-1 iterations
    Tổng: Σ(i-1) for i=2→n-1 = n(n-1)/2 = O(n²)

  ⚠️ Có O(n log n) không?
    KHÔNG CÓ cách O(n log n) đã biết cho bài này!
    Vì output có thể O(n²) triangles → phải COUNT O(n²)!
    O(n²) là TỐI ƯU cho bài counting!
```

### Complexity chính xác — Đếm operations

```
  Sort: O(n log n) comparisons

  Main loop:
    Outer: n-2 iterations
    Tổng inner: Σ(i-1) for i=2 to n-1
              = 1 + 2 + ... + (n-2)
              = (n-2)(n-1)/2

  Mỗi inner step: 1 addition + 1 comparison + 1 add/increment
  TỔNG: 3 × n(n-1)/2 ≈ 1.5n² operations

  📊 So sánh (n = 10³):
    Sort+2ptr: 1.5×10⁶ ops ⭐
    Brute:     10⁹ ops 💀

  📊 So sánh (n = 10⁴):
    Sort+2ptr: 1.5×10⁸ ops ⭐ (~0.5s)
    Brute:     10¹² ops 💀 (~hours)
```

---

## T — Test

```
Test Cases:
  [4, 6, 3, 7]                    → 3     ✅ [3,4,6],[3,6,7],[4,6,7]
  [10, 21, 22, 100, 101, 200, 300]→ 6     ✅
  [1, 2, 3]                       → 0     ✅ 1+2 = 3, không >
  [3, 3, 3]                       → 1     ✅ 1 tam giác đều
  [1, 1, 1, 1]                    → 4     ✅ C(4,3) = 4
  [5]                             → 0     ✅ < 3 phần tử
  [1, 2]                          → 0     ✅ < 3 phần tử
  [2, 3, 4, 5]                    → 3     ✅ [2,3,4],[2,4,5],[3,4,5]
  [1, 2, 3, 4, 5]                 → 3     ✅

  Edge: [1, 2, 3, 4, 5] trace:
    Sort: [1,2,3,4,5]
    i=4(5): l=0,r=3 → 1+4=5=5 NO, l=1 → 2+4=6>5 YES cnt+=2
            r=2 → 2+3=5=5 NO, l=2, stop → count=2
    i=3(4): l=0,r=2 → 1+3=4=4 NO, l=1 → 2+3=5>4 YES cnt+=1
            r=1, stop → count=3
    i=2(3): l=0,r=1 → 1+2=3=3 NO, l=1, stop → count=3
    Total = 3 ✅
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

  👤 "Tell me about yourself and a time you used
      constraint reduction to simplify a problem."

  🧑 "I'm a frontend engineer with [X] years of experience.
      A relevant example: I built a component validation
      system where each UI card had three configurable
      dimension constraints — width, height, and diagonal.

      Initially we validated all three independently —
      cubic complexity over the constraint space.
      Then I realized: if we SORT the dimensions
      smallest to largest, only one constraint can fail.
      The two larger dimensions always satisfy
      the other two checks.

      That reduced the validation from three checks
      to one. Same idea as triangle inequality:
      sort, then only check if the two smaller sides
      sum to more than the largest.

      That's exactly Count Possible Triangles."

  👤 "Nice constraint reduction. Let's formalize."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 2: PROBLEM SOLVING (05:00 — 45:00)                   ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 05:00 — Clarify (3 phút) ────────────────

  👤 "Count the number of triplets from an array
      that can form valid triangles."

  🧑 "Let me clarify.

      Triangle inequality: the sum of ANY two sides
      must be STRICTLY greater than the third.
      Three conditions: a+b greater than c,
      a+c greater than b, b+c greater than a.

      STRICTLY greater — not equal. So [1, 2, 3]
      fails because 1+2 equals 3, not greater.

      All values are positive integers (greater than 0).
      This is important for the proof later.

      I return the COUNT, not the actual triplets.
      Triplets at different indices are distinct
      even if values are the same."

  ──────────────── 08:00 — Wooden Sticks Analogy (3 phút) ────────

  🧑 "I think of this as the WOODEN STICKS analogy.

      I have a pile of sticks of different lengths.
      Can I pick three sticks and form a triangle?

      The key physical constraint: the two SHORTER
      sticks, laid end to end, must be LONGER than
      the longest stick. Otherwise they can't 'reach'
      to close the triangle.

      If I sort the sticks by length: a is at most b
      is at most c. Then c is the longest.
      Can a and b together reach past c? That's a+b greater than c.

      The other two conditions are automatically satisfied:
      a+c is at least a+b (since c is at least b),
      which is greater than b.
      b+c is at least 2a (since b and c are at least a),
      which is greater than a.

      SORT REDUCES THREE CHECKS TO ONE."

  ──────────────── 11:00 — Brute Force (2 phút) ────────────────

  🧑 "The brute force: three nested loops.

      For each triplet (i, j, k) where i less than j
      less than k: check all three triangle conditions.

      Time: O of n cubed.
      For n equals 10 to the 3: 10 to the 9 operations.
      Way too slow."

  ──────────────── 13:00 — Sort insight (3 phút) ────────────────

  🧑 "First key insight: SORT the array.

      After sorting a is at most b is at most c,
      I only need to check a + b greater than c.

      Proof:
      Condition 2: a + c greater than b.
      Since c is at least b: a + c is at least a + b.
      Since a is greater than 0: a + b is greater than b.
      So a + c is greater than b. Always true.

      Condition 3: b + c greater than a.
      Since b is at least a and c is at least a:
      b + c is at least 2a, which is greater than a.
      Always true.

      Only condition 1 can fail. ONE check instead of three."

  ──────────────── 16:00 — Fix + Two Pointers (6 phút) ────────

  🧑 "Second key insight: FIX the largest side
      and use two pointers.

      I iterate i from n-1 down to 2.
      arr at i is the LARGEST side (since sorted).
      I use two pointers in [0, i-1]:
      left equals 0, right equals i-1.

      If arr at left plus arr at right is greater
      than arr at i:
      Then arr at left is the SMALLEST in the range.
      If the smallest works, every value between
      left and right-1 also works (since they're all
      at least arr at left, and sorted).
      So ALL pairs from left to right-1, paired with
      arr at right, form valid triangles.
      That's right minus left pairs. BATCH COUNTING.
      Then right--.

      If arr at left plus arr at right is at most
      arr at i:
      The sum is too small. I need a bigger left value.
      left++.

      Let me trace [4, 6, 3, 7]. After sort: [3, 4, 6, 7].

      Fix c equals 7 (i=3). left=0, right=2.
      3 + 6 equals 9 greater than 7. YES.
      count plus-equals 2 minus 0 equals 2. right becomes 1.
      3 + 4 equals 7 greater than 7? NO (equal, not greater).
      left becomes 1. left equals right. Stop.

      Fix c equals 6 (i=2). left=0, right=1.
      3 + 4 equals 7 greater than 6. YES.
      count plus-equals 1 minus 0 equals 1. right becomes 0.
      left equals right. Stop.

      Total: 2 + 1 equals 3. Correct!"

  ──────────────── 22:00 — Why right-left not right-left+1 (3 phút)

  👤 "Why right minus left, not right minus left plus 1?"

  🧑 "Because I'm counting pairs WITH arr at right.

      The valid pairs are:
      (arr at left, arr at right),
      (arr at left+1, arr at right),
      ...
      (arr at right-1, arr at right).

      From left to right-1: that's right-1 minus left plus 1
      equals right minus left values.

      I'm NOT counting (arr at right, arr at right)
      because I can't pair an element with itself.

      If I used right minus left plus 1, I'd
      over-count by 1 — including the element paired
      with itself."

  ──────────────── 25:00 — Why fix largest, not smallest (2 phút) ──

  👤 "Why fix the largest side instead of the smallest?"

  🧑 "If I fix the smallest side a:
      The condition b + c greater than a is ALWAYS TRUE
      (since b and c are both at least a, so b + c
      is at least 2a, greater than a).
      No filtering power.

      If I fix the largest side c:
      The condition a + b greater than c CAN FAIL.
      Two smaller values might not sum to enough.
      This gives the two pointers actual work to do —
      they separate valid from invalid pairs."

  ──────────────── 27:00 — Write Code (3 phút) ────────────────

  🧑 "The code.

      [Vừa viết vừa nói:]

      function countTriangles of arr.
      const n equals arr dot length.
      arr dot sort of (a, b) arrow a minus b.
      let count equals 0.

      for let i equals n minus 1; i greater-or-equal 2; i--:
        let left equals 0.
        let right equals i minus 1.

        while left less than right:
          if arr at left plus arr at right greater than arr at i:
            count plus-equals right minus left.
            right--.
          else:
            left++.

      return count.

      Key details:
      Numeric comparator in sort. Not default lexicographic.
      Strictly greater, not greater-or-equal.
      Count plus-equals right minus left, not count++."

  ──────────────── 30:00 — Verify with examples (3 phút) ────────

  🧑 "Verify with [1, 2, 3]. Sort: [1, 2, 3].

      Fix c equals 3 (i=2). left=0, right=1.
      1 + 2 equals 3. Greater than 3? NO.
      left becomes 1. left equals right. Stop.

      Count equals 0. Correct — 1+2 equals 3,
      not strictly greater.

      Verify with [3, 3, 3]. Sort: [3, 3, 3].

      Fix c equals 3 (i=2). left=0, right=1.
      3 + 3 equals 6 greater than 3. YES.
      count plus-equals 1 minus 0 equals 1. right becomes 0.
      Stop. Count equals 1. Correct — equilateral triangle."

  ──────────────── 33:00 — Edge Cases (2 phút) ────────────────

  🧑 "Edge cases.

      Less than 3 elements: return 0 immediately.
      The loop condition i greater-or-equal 2 handles this.

      All equal elements [1,1,1,1]:
      Every triplet is valid (1+1 equals 2 greater than 1).
      Count should be C of 4 choose 3 equals 4.

      Let me verify: i=3, then i=2.
      i=3: left=0, right=2. 1+1=2 greater than 1.
      count+=2. right=1. 1+1=2 greater than 1.
      count+=1. right=0. Stop. count=3.
      i=2: left=0, right=1. 1+1=2 greater than 1.
      count+=1. right=0. Stop. count=4. Correct!"

  ──────────────── 35:00 — Complexity (3 phút) ────────────────

  🧑 "Time: O of n squared.
      Sort: O of n log n.
      Main loop: outer runs n-2 times.
      Inner two pointers: at most i-1 steps per outer.
      Total inner: sum from 1 to n-2 equals n(n-1)/2.
      So O of n squared dominates.

      Space: O of 1. Sort in-place.
      Only a few variables: count, left, right.

      Can we do better? NO.
      The answer itself can be O of n squared.
      For n equal elements: C(n,3) is roughly n cubed
      over 6. We need at least O of n squared
      to compute the count.
      O of n squared is optimal."

  ──────────────── 38:00 — Connection to Three Sum (4 phút) ────────

  👤 "How does this relate to Three Sum?"

  🧑 "Same pattern! Sort plus fix one plus two pointers.

      Three Sum (#15): fix arr at i, find two pointers
      where a + b equals negative arr at i.
      Both pointers move: if sum too small, left++.
      If too large, right--. If equal, record and move both.

      Count Triangles: fix arr at i (largest side),
      find two pointers where a + b greater than arr at i.
      BATCH counting: if the sum exceeds, count right-left
      pairs at once instead of one at a time.

      Three Sum Closest (#16): fix one, minimize distance
      to target. Same two-pointer motion.

      The 'fix one element, two-pointer the rest'
      is a universal technique for triplet problems
      on sorted arrays."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 3: DEEP TECHNICAL PROBING (45:00 — 60:00)            ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 45:00 — Formal invariant proof (5 phút) ────────

  👤 "Prove the two-pointer approach is correct."

  🧑 "For a fixed c equals arr at i, define the search
      space as all pairs (a, b) with indices in [0, i-1]
      where a less than b.

      INVARIANT: at each step, ALL valid pairs (a, b)
      where b is greater than right have ALREADY been counted.
      ALL invalid pairs where a is less than left have been
      correctly excluded.

      Case 1: arr at left plus arr at right greater than c.
      Since arr is sorted, for any k in [left, right-1]:
      arr at k is at least arr at left.
      So arr at k plus arr at right is at least
      arr at left plus arr at right, which exceeds c.
      All pairs (k, right) for k in [left, right-1] are valid.
      Count right minus left. Advance right.

      Case 2: arr at left plus arr at right at most c.
      Since arr is sorted, for any k in [left, right]:
      arr at k is at most arr at right.
      So arr at left plus arr at k is at most
      arr at left plus arr at right, which doesn't exceed c.
      All pairs (left, k) for k in [left+1, right] are invalid.
      Advance left.

      COMPLETENESS: every pair is either counted in Case 1
      or excluded in Case 2. No pair is missed.
      TERMINATION: each step advances left or right.
      Gap decreases by 1. At most i-1 steps. QED."

  ──────────────── 50:00 — Why not binary search? (3 phút) ────────

  👤 "Could you use binary search instead of two pointers?"

  🧑 "Yes! After sorting, for each pair (i, j),
      binary search for the largest k where
      arr at i plus arr at j greater than arr at k.
      All elements from j+1 to k form valid triangles
      with arr at i and arr at j.

      Time: O of n squared log n.
      Outer two loops: O of n squared.
      Binary search: O of log n each.

      This is WORSE than two pointers (O of n squared).
      Two pointers avoid the log n factor by amortizing
      the search across all pairs sharing the same
      fixed element.

      Binary search is simpler to reason about
      but less efficient here."

  ──────────────── 53:00 — Count vs enumerate (3 phút) ────────────

  👤 "What if you needed to LIST all valid triangles?"

  🧑 "If I need to enumerate, the inner loop changes.
      When arr at left plus arr at right exceeds c:
      I loop through left to right-1 and output each
      triplet (arr at k, arr at right, c).

      This adds O of K work where K is the number of valid
      triangles. Total: O of n squared plus K.

      K can be up to C(n, 3) which is O of n cubed.
      So enumeration is inherently O of n cubed worst case.

      Counting is faster because batch counting
      skips the enumeration: right minus left
      instead of right minus left individual outputs."

  ──────────────── 56:00 — Degenerate triangles (4 phút) ────────────

  👤 "What if we change to non-strict inequality (a + b >= c)?"

  🧑 "This includes DEGENERATE triangles — triangles
      that collapse to a straight line.

      [1, 2, 3]: 1 + 2 equals 3, which is at least 3.
      With non-strict: this counts as valid.
      With strict: this doesn't count.

      In the code, I change the comparison from
      strictly-greater to greater-or-equal.
      Everything else stays the same.

      The batch counting logic is identical:
      if arr at left plus arr at right is at least arr at i,
      then all values between left and right-1 also satisfy
      (since they're at least arr at left).

      The difference is tiny in code but meaningful
      in geometry. The interviewer's intent matters."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 4: VARIATIONS (60:00 — 75:00)                         ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 60:00 — Largest Perimeter Triangle (#976) (3 phút)

  👤 "What about finding the triangle with the
      largest perimeter?"

  🧑 "LeetCode 976. Sort DESCENDING.
      Check consecutive triplets: arr at i, arr at i+1,
      arr at i+2. The first valid one has the largest
      perimeter.

      Why consecutive? After descending sort,
      arr at i is the largest. If arr at i+1 plus
      arr at i+2 exceeds arr at i, that's a valid
      triangle with the maximum possible perimeter.

      If not, skip arr at i — no pair of smaller elements
      can exceed it. Move to i+1.

      O of n log n for sort, O of n for scan.
      Much simpler than counting because I only need
      ONE valid triangle, not all of them."

  ──────────────── 63:00 — Valid Triangle Number (#611) (2 phút) ──

  👤 "What about LeetCode 611?"

  🧑 "LeetCode 611 — Valid Triangle Number.
      IDENTICAL to this problem. Same approach:
      sort, fix largest, two pointers, batch counting.

      The only difference: the function signature.
      The algorithm is line-for-line the same."

  ──────────────── 65:00 — Four sides: quadrilateral? (4 phút) ────

  👤 "What about counting valid quadrilaterals?"

  🧑 "A quadrilateral requires that no single side
      is at least the sum of the other three.
      After sorting a is at most b is at most c is at most d:
      only need to check a + b + c greater than d.

      I'd fix d (the largest), then for the remaining
      three elements I need to count triplets (a, b, c)
      where a + b + c exceeds d.

      This reduces to a Three Sum variant:
      for each fixed c (the third largest), use two pointers
      to count pairs (a, b) where a + b exceeds d minus c.

      Time: O of n cubed. Outer loop for d is O of n.
      Inner: O of n squared for the triplet counting.
      Total: O of n cubed.

      Same pattern, one more nesting level."

  ──────────────── 69:00 — Count with constraint on type (3 phút) ──

  👤 "What if you need to count RIGHT triangles
      or OBTUSE triangles?"

  🧑 "For right triangles: a squared plus b squared
      equals c squared. After sorting, fix c,
      use two pointers to find pairs where
      a squared plus b squared equals c squared.
      Same as Three Sum with target c squared.

      For obtuse triangles: a squared plus b squared
      less than c squared AND a + b greater than c.
      Two conditions. I'd count all valid triangles
      minus right and acute triangles.

      For acute triangles: a squared plus b squared
      greater than c squared AND a + b greater than c.
      Same two-pointer framework with two conditions.

      Each variant modifies the comparison but keeps
      the sort-plus-fix-plus-two-pointers structure."

  ──────────────── 72:00 — Probabilistic variant (3 phút) ────────

  👤 "If sides are drawn randomly from [1, n],
      what fraction form valid triangles?"

  🧑 "For large n, the probability that three random
      values form a valid triangle converges to 1/2.

      Intuitively: after sorting, a + b greater than c.
      For uniformly random values, half the time
      the two smaller values sum to more than the largest.

      The exact probability for integers from 1 to n
      involves counting the lattice points satisfying
      the inequality. For continuous uniform [0, 1]:
      it's exactly 1/2 by symmetry.

      This is a classic probability result that connects
      geometry to combinatorics."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 5: SYSTEM DESIGN AT SCALE (75:00 — 85:00)            ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 75:00 — Real-world applications (5 phút) ────────

  👤 "Where does this pattern appear in real systems?"

  🧑 "Several domains!

      First — STRUCTURAL ENGINEERING.
      When designing trusses or frames, engineers
      verify that member lengths can form valid triangles.
      The triangle inequality is a fundamental constraint
      in finite element analysis and structural stability.

      Second — NETWORK TOPOLOGY.
      In mesh networks, three nodes can form a triangle
      route if the latencies satisfy a triangle-like inequality.
      Counting valid triangles in a network graph helps
      analyze network redundancy and routing efficiency.

      Third — GPS TRIANGULATION.
      Position estimation requires three satellite signals.
      The distances must satisfy triangle-like constraints
      for a solution to exist. Invalid triangles indicate
      measurement errors or insufficient signal coverage.

      Fourth — GAME DEVELOPMENT.
      Triangle mesh validation in 3D rendering.
      Degenerate triangles (where a+b equals c exactly)
      cause rendering artifacts. Counting and filtering
      invalid triangles is part of mesh cleanup."

  ──────────────── 80:00 — Scaling the counting (5 phút) ────────

  👤 "How would you handle very large arrays?"

  🧑 "For huge arrays where n is millions:

      The O of n squared approach requires n squared
      over 2 operations. For n equals 10 to the 6:
      that's 5 times 10 to the 11 — too slow.

      Optimization strategies:

      1. SAMPLING: pick a random subset, count triangles,
      extrapolate statistically. Gives an approximate count.

      2. BUCKETING: group values into buckets.
      For values in the same bucket, count combinatorially.
      For cross-bucket pairs, use the two-pointer approach
      on bucket boundaries.

      3. PARALLEL PROCESSING: partition the outer loop
      across processors. Each processor handles a range
      of i values. The two-pointer work is independent
      per i, so it parallelizes well.

      4. If values are bounded (say max value M),
      I can use a FREQUENCY ARRAY and iterate over
      unique values instead of all n elements.
      This reduces n to the number of distinct values."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 6: BEHAVIORAL + Q&A (85:00 — 90:00)                  ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 85:00 — Reflection (3 phút) ────────────────

  👤 "What would you take away from this problem?"

  🧑 "Three things.

      First, CONSTRAINT REDUCTION.
      Sorting reduced three inequality checks to one.
      This is a general principle: preprocessing
      can dramatically simplify the core logic.
      Always ask 'what does sorting buy me?'

      Second, BATCH COUNTING.
      Instead of counting pairs one by one,
      count right minus left at once.
      This is what reduces O of n cubed to O of n squared.
      The insight: if the SMALLEST value in a range
      satisfies a condition, all larger values do too.
      Monotonicity enables batch counting.

      Third, the FIX-ONE-PLUS-TWO-POINTERS pattern.
      It applies to Three Sum, Count Triangles,
      Three Sum Closest, and many more.
      Fix one variable, reduce to a two-pointer
      subproblem. The same skeleton, different conditions."

  ──────────────── 88:00 — Questions (2 phút) ────────────────

  👤 "Any questions for me?"

  🧑 "A few!

      First — the triangle inequality is a metric space
      requirement. Does your system deal with metric
      validation in search or recommendation ranking?

      Second — batch counting (right minus left)
      is a form of 'monotonicity exploitation.'
      Do your analytics pipelines use similar
      sorted-array tricks to avoid inner loops?

      Third — the quadrilateral extension requires
      O of n cubed. Does your team encounter
      higher-order constraint counting problems
      where you've found practical shortcuts?"

  👤 "Excellent! The constraint reduction from three
      conditions to one via sorting was clearly explained.
      The batch counting insight — 'if the smallest works,
      all larger work too' — was the highlight.
      We'll be in touch!"
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  ⭐ 8 MẸO NÓI CHUYỆN TRONG PHỎNG VẤN (Count Triangles)  ║
  ╚══════════════════════════════════════════════════════════════╝

  📌 MẸO #1: State the constraint reduction immediately
     ✅ "After sorting a ≤ b ≤ c, the three triangle
         conditions reduce to ONE: a + b > c.
         The other two are automatically satisfied."

  📌 MẸO #2: Explain why fix the largest side
     ✅ "Fix the smallest → b+c > a is always true, useless.
         Fix the largest → a+b > c can fail. Real filtering."

  📌 MẹO #3: Articulate batch counting clearly
     ✅ "If arr[left] + arr[right] > c, then
         every element from left to right-1 paired with
         arr[right] also satisfies. Count all at once:
         right minus left pairs."

  📌 MẸO #4: Explain right-left not right-left+1
     ✅ "Pairs: (left, right), (left+1, right), ...,
         (right-1, right). That's right-1 minus left plus 1
         equals right minus left. Not including (right, right)."

  📌 MẸO #5: Strict vs non-strict
     ✅ "[1, 2, 3]: 1+2 = 3, NOT strictly greater.
         Zero valid triangles. The > is critical, not >=."

  📌 MẸO #6: Map to Three Sum family
     ✅ "Three Sum: fix one, two pointers for sum = target.
         Count Triangles: fix largest, two pointers for sum > target.
         Same skeleton, different condition."

  📌 MẸO #7: Prove O(n²) is optimal
     ✅ "For n equal elements, the answer is C(n,3) ≈ n³/6.
         We need at least O(n²) to compute this count.
         Cannot beat O(n²) for a counting problem."

  📌 MẸO #8: Don't forget the sort comparator
     ✅ "JavaScript default sort is lexicographic.
         [10, 3, 7].sort() gives ['10', '3', '7'].
         MUST use (a, b) => a - b for numeric sort."
```


---

## 📚 Bài tập liên quan — Practice Problems

### Progression Path

```mermaid
graph LR
    A["#1 Two Sum"] -->|"thêm 1"| B["#15 Three\nSum"]
    B -->|"inequality"| C["⭐ Count\nTriangles\n(BÀI NÀY)"]
    B -->|"closest"| D["#16 Three Sum\nClosest"]
    C -->|"variant"| E["#611 Valid\nTriangle"]

    style C fill:#4CAF50,color:white
    style E fill:#2196F3,color:white
```

### 1. Three Sum (#15) — Medium

```
  Đề: Tìm tất cả bộ 3 có tổng = 0.

  function threeSum(nums) {
    nums.sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < nums.length - 2; i++) {
      if (i > 0 && nums[i] === nums[i-1]) continue;  // skip dup
      let left = i + 1, right = nums.length - 1;
      while (left < right) {
        const sum = nums[i] + nums[left] + nums[right];
        if (sum === 0) {
          result.push([nums[i], nums[left], nums[right]]);
          while (left < right && nums[left] === nums[left+1]) left++;
          while (left < right && nums[right] === nums[right-1]) right--;
          left++; right--;
        } else if (sum < 0) left++;
        else right--;
      }
    }
    return result;
  }

  📌 CÙNG PATTERN:
    Count Triangles: fix c → a+b > c → count += r-l
    Three Sum:       fix a → a+b+c = 0 → find exact!
```

### 2. Valid Triangle Number (#611) — Medium

```
  Đề: CÙNG BÀI! LeetCode version.

  function triangleNumber(nums) {
    nums.sort((a, b) => a - b);
    let count = 0;
    for (let i = nums.length - 1; i >= 2; i--) {
      let left = 0, right = i - 1;
      while (left < right) {
        if (nums[left] + nums[right] > nums[i]) {
          count += right - left;
          right--;
        } else {
          left++;
        }
      }
    }
    return count;
  }

  📌 100% GIỐNG! LeetCode #611 = bài này!
```

### 3. Largest Perimeter Triangle (#976) — Easy

```
  Đề: Tìm tam giác có chu vi LỚN NHẤT.

  function largestPerimeter(nums) {
    nums.sort((a, b) => b - a);  // sort GIẢM dần!
    for (let i = 0; i < nums.length - 2; i++) {
      // Check 3 phần tử liên tiếp (lớn nhất trước!)
      if (nums[i+1] + nums[i+2] > nums[i]) {
        return nums[i] + nums[i+1] + nums[i+2];
      }
    }
    return 0;
  }

  📌 KHÁC: chỉ cần TÌM 1, không đếm!
     Sort giảm → check 3 liên tiếp → O(n log n)!
```

### Tổng kết — Sort + Two Pointers Family

```
  ┌──────────────────────────────────────────────────────────────┐
  │  BÀI                     │  Fix gì?  │  2ptr tìm gì?       │
  ├──────────────────────────────────────────────────────────────┤
  │  Two Sum                 │  —        │  a+b = target        │
  │  Three Sum               │  a (1st)  │  b+c = -a            │
  │  Three Sum Closest       │  a (1st)  │  b+c ≈ target-a      │
  │  Count Triangles ⭐      │  c (last) │  a+b > c             │
  │  #611 Valid Triangle     │  c (last) │  a+b > c (SAME!)     │
  │  #976 Largest Perimeter  │  Sort ↓   │  3 liên tiếp         │
  └──────────────────────────────────────────────────────────────┘

  📌 RULE: "Bộ 3" + "condition" → Sort + fix 1 + 2 pointers!
     "= target" → move both pointers
     "> target" → count += right-left (batch!)
```

### Skeleton code — Reusable template

```javascript
// TEMPLATE: Fix 1 + Two Pointers cho bộ 3
function tripletPattern(arr, condition) {
  arr.sort((a, b) => a - b);
  let count = 0;

  // Fix phần tử cuối (lớn nhất) hoặc đầu (nhỏ nhất)
  for (let i = arr.length - 1; i >= 2; i--) {
    let left = 0, right = i - 1;

    while (left < right) {
      const val = arr[left] + arr[right];

      if (val > arr[i]) {
        // BATCH counting: tất cả left..right-1 ghép right thỏa!
        count += right - left;
        right--;
      } else {
        // Cần tổng lớn hơn → tăng left
        left++;
      }
    }
  }
  return count;
}

// Triangle: condition = a+b > c
// Three Sum > k: condition = a+b+c > k → a+b > k-c
```

---

## 📌 Kỹ năng chuyển giao — Pattern Summary

```mermaid
graph TD
    A["'Bộ 3' + 'inequality/equality'?"] -->|Yes| B["SORT mảng"]
    B --> C{"Tìm gì?"}
    C -->|"a+b = target"| D["Three Sum\nfix 1 + 2ptrs"]
    C -->|"a+b > c"| E["⭐ Count Triangles\nfix c + batch"]
    C -->|"max perimeter"| F["Sort ↓ + 3 liên tiếp"]

    style E fill:#4CAF50,color:white
```

---

## 📊 Tổng kết — Key Insights

```mermaid
graph LR
    subgraph SUMMARY["📌 Tổng kết"]
        direction TB
        S1["1. Sort: 3 ĐK → 1 ĐK"] --> S2["2. Fix c (lớn nhất)"]
        S2 --> S3["3. 2ptrs: a+b > c?"]
        S3 --> S4["4. count += r-l"]
    end

    subgraph KEY["🔑 Key Insights"]
        K1["a≤b≤c:\nchỉ check a+b>c"]
        K2["Fix c, không a:\na filter được!"]
        K3["YES → batch!\nNO → left++"]
        K4["right-left\nKHÔNG PHẢI +1"]
    end

    S1 -.- K1
    S2 -.- K2
    S3 -.- K3
    S4 -.- K4

    style S1 fill:#FF9800,color:white
    style S4 fill:#4CAF50,color:white
    style K4 fill:#C8E6C9,stroke:#4CAF50
```

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  📌 3 ĐIỀU PHẢI NHỚ                                                    │
  │                                                                          │
  │  1. SORT → 3 ĐIỀU KIỆN THÀNH 1:                                        │
  │     a ≤ b ≤ c → chỉ check a + b > c!                                  │
  │     2 ĐK còn lại TỰ ĐỘNG thỏa (vì a > 0)!                            │
  │     ⚠️ sort((a,b) => a-b) — numeric, KHÔNG lexicographic!             │
  │                                                                          │
  │  2. FIX c (LỚN NHẤT), không fix a:                                     │
  │     Fix a → b+c > a LUÔN TRUE → vô ích!                                │
  │     Fix c → a+b > c CÓ THỂ FALSE → filter hiệu quả!                  │
  │     Two Pointers tìm trong [0..i-1]!                                    │
  │                                                                          │
  │  3. BATCH COUNTING: count += right - left                               │
  │     KHÔNG PHẢI count++ hay count += right - left + 1!                   │
  │     Nếu arr[left]+arr[right] > c → TẤT CẢ left' ∈ [left, right-1]    │
  │     ghép arr[right] đều thỏa → right - left cặp!                      │
  │     > STRICT, không >=! ([1,2,3]: 1+2=3 NOT > 3!)                     │
  └──────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Flashcard — Tự kiểm tra

| ❓ Câu hỏi | ✅ Đáp án |
|---|---|
| Triangle inequality (3 điều kiện)? | a+b>c, a+c>b, b+c>a |
| Sau khi sort (a≤b≤c), cần check gì? | CHỈ **a+b > c**! |
| Fix cạnh nào? | Cạnh **LỚN NHẤT** (c)! |
| Tại sao fix c, không fix a? | Fix a → b+c>a **luôn true** → vô ích! |
| arr[left]+arr[right] > c → count? | count += **right - left** (batch!) |
| Tại sao right-left không phải +1? | Cặp: (left,right), ..., (right-1,right) = **r-l** cặp |
| [1,2,3] → bao nhiêu? | **0** (1+2=3, NOT strictly >) |
| Time complexity? | **O(n²)** (sau sort O(n log n)) |
| Space? | **O(1)** (sort in-place) |
| Có tối ưu hơn O(n²)? | **KHÔNG** (output có thể O(n²) triangles) |
| Pattern giống bài nào? | **Three Sum** (sort + fix 1 + 2 pointers) |
| LeetCode equivalent? | **#611** Valid Triangle Number |
