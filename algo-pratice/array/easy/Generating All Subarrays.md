# 📦 Generating All Subarrays — GfG (Easy)

> 📖 Code: [Generating All Subarrays.js](./Generating%20All%20Subarrays.js)

```mermaid
graph TD
    A["📦 Generate All Subarrays"] --> B["2 vòng for: chọn start, end"]
    B --> C["for i = 0 → n-1"]
    C --> D["for j = i → n-1"]
    D --> E["subarray = arr[i..j]"]
    E --> F["push to result"]
    F --> G{"j < n-1?"}
    G -->|Yes| D
    G -->|No| H{"i < n-1?"}
    H -->|Yes| C
    H -->|No| I["✅ Total: n×n+1÷2"]

    style I fill:#FF5722,color:white
```

```mermaid
graph LR
    subgraph "Subarray vs Subsequence vs Subset"
        SA["Subarray: LIÊN TIẾP, n×n+1÷2"]
        SQ["Subsequence: GIỮ THỨ TỰ, 2^n"]
        SS["Subset: KHÔNG THỨ TỰ, 2^n"]
    end

    subgraph "Khi KHÔNG generate hết"
        K1["Max sum → Kadane O(n)"]
        K2["Sum = k → PrefixSum O(n)"]
        K3["Shortest ≥ k → Sliding Window O(n)"]
    end
```

---

## R — Repeat & Clarify

🧠 *"Subarray = đoạn LIÊN TIẾP. 2 index (start, end) xác định 1 subarray. Tổng cộng n(n+1)/2 subarrays."*

> 🎙️ *"Generate all contiguous subarrays of a given array. A subarray is defined by a starting and ending index, where all elements between them are included."*

### Clarification Questions

```
Q: Subarray vs Subsequence vs Subset?
A: Subarray = LIÊN TIẾP! [1,2] ✅, [1,3] ❌ (bỏ qua 2)

Q: Có tính subarray rỗng không?
A: Không, chỉ non-empty subarrays

Q: Số lượng subarrays?
A: n(n+1)/2 = với n=3 → 6 subarrays

Q: Mảng 1 phần tử?
A: Có 1 subarray = chính nó
```

### Tại sao bài này quan trọng?

```
  Subarray là CONCEPT NỀN TẢNG cho hàng chục bài LeetCode!

  BẠN PHẢI hiểu:
  1. Subarray được xác định bởi CẶP (start, end) → 2 vòng for
  2. Tổng số subarrays = n(n+1)/2 → O(n²)
  3. Không bao giờ generate hết cho bài thực tế → dùng technique!

  Phân biệt rõ 3 khái niệm:
  ┌───────────────────────────────────────────────────────┐
  │  Subarray:    LIÊN TIẾP    n(n+1)/2     [1,2] [2,3]  │
  │  Subsequence: BỎ ĐƯỢC      2ⁿ          [1,3] [1]     │
  │  Subset:      KHÔNG THỨ TỰ 2ⁿ          {1,3} = {3,1} │
  └───────────────────────────────────────────────────────┘
```

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

### Subarray = CẮT 1 ĐOẠN LIÊN TIẾP từ mảng

```
  Tưởng tượng mảng như 1 THANH SÔ-CÔ-LA:

  ┌───┬───┬───┬───┬───┐
  │ 1 │ 2 │ 3 │ 4 │ 5 │    ← thanh sô-cô-la (mảng)
  └───┴───┴───┴───┴───┘

  Subarray = BẺ 1 đoạn liên tiếp:
    BẺ ở vị trí 0-2: [1, 2, 3]     ✅ liên tiếp
    BẺ ở vị trí 2-4: [3, 4, 5]     ✅ liên tiếp
    BẺ ở vị trí 1-1: [2]           ✅ 1 mảnh cũng OK

  KHÔNG THỂ bẻ "nhảy cóc":
    [1, 3, 5] → ❌ KHÔNG phải subarray! (bỏ qua 2 và 4)
    → Đây là SUBSEQUENCE (bỏ phần tử, giữ thứ tự)
```

### Tại sao n(n+1)/2? — Hiểu bằng TRỰC GIÁC!

```
  Bài toán = CHỌN 2 VỊ TRÍ CẮT trên thanh sô-cô-la!

  Đặt n+1 vị trí cắt (trước, giữa, và sau mỗi ô):

    ↓   ↓   ↓   ↓      ← 4 vị trí cắt (n+1 = 3+1)
    | 1 | 2 | 3 |
    0   1   2   3       ← đánh số vị trí cắt

  Chọn 2 vị trí cắt → 1 subarray:
    Cắt tại 0 và 1 → [1]
    Cắt tại 0 và 2 → [1, 2]
    Cắt tại 0 và 3 → [1, 2, 3]
    Cắt tại 1 và 2 → [2]
    Cắt tại 1 và 3 → [2, 3]
    Cắt tại 2 và 3 → [3]
                      = 6 cách = C(4, 2) = 4! / (2! × 2!) = 6

  TỔNG QUÁT:
    Chọn 2 từ (n+1) vị trí = C(n+1, 2) = (n+1)! / (2! × (n-1)!)
                            = (n+1) × n / 2
                            = n(n+1) / 2

  ⚠️ Cách nhớ khác: cộng dãy số!
    Start=0: n subarrays
    Start=1: n-1 subarrays
    ...
    Start=n-1: 1 subarray
    Tổng = n + (n-1) + ... + 1 = n(n+1)/2
         = TỔNG DÃY SỐ TỰ NHIÊN từ 1 đến n!
```

### 2 vòng for = CHỌN CẶP (start, end)

```
  Mỗi subarray được XÁC ĐỊNH DUY NHẤT bởi:
    start (index bắt đầu)
    end   (index kết thúc)    với start <= end

  → BÀI TOÁN = LIỆT KÊ TẤT CẢ CẶP (start, end) hợp lệ!

  for start = 0 → n-1:           ← chọn điểm TRÁI
    for end = start → n-1:       ← chọn điểm PHẢI (>= start!)
      → subarray = arr[start..end]

  ⚠️ Tại sao end bắt đầu từ start (KHÔNG PHẢI 0)?
    Vì end >= start luôn! (subarray có ít nhất 1 phần tử)
    end < start → đoạn rỗng → không tính!
```

### Khi nào KHÔNG NÊN generate tất cả?

```
  ⚠️ QUAN TRỌNG: Trong phỏng vấn THỰC, hầu như KHÔNG BAO GIỜ
     yêu cầu generate tất cả subarrays!

  Thay vào đó, bài sẽ hỏi:
    "Tìm subarray CÓ TÍNH CHẤT X" (max sum, sum=k, min length...)

  → Dùng TECHNIQUE thay vì brute force:
  ┌────────────────────────────────────────────────────────┐
  │  "Max subarray sum"     → Kadane's Algorithm O(n)     │
  │  "Subarray sum = k"     → Prefix Sum + HashMap O(n)   │
  │  "Shortest subarray ≥ k"→ Sliding Window O(n)          │
  │  "Count subarrays < k"  → Two Pointers O(n)            │
  │  "Subarray with max el" → Monotonic Stack O(n)          │
  └────────────────────────────────────────────────────────┘

  TẤT CẢ đều O(n) hoặc O(n log n), KHÔNG cần O(n²) brute force!
  → Bài "Generate All Subarrays" chỉ là BÀI HỌC NỀN TẢNG!
```

---

## 🧭 Luồng Suy Nghĩ — Từ đọc đề đến solution

> 💡 Phần này dạy bạn **CÁCH TƯ DUY** để tự giải bài, không chỉ biết đáp án.
> Mỗi bước đều có **lý do tại sao**, để bạn áp dụng cho bài khó hơn.

### Bước 1: Đọc đề → Gạch chân KEYWORDS

```
  Đề bài: "Generate all contiguous subarrays of a given array"

  Gạch chân:
    "all"        → LIỆT KÊ, không phải tìm 1 cái → Enumeration problem
    "contiguous"  → LIÊN TIẾP → subarray, KHÔNG phải subsequence
    "subarrays"   → đoạn con

  🧠 Tự hỏi: "Subarray khác gì subsequence?"
    Subarray:     [1, 2, 3] → [1,2] ✅  [1,3] ❌
    Subsequence:  [1, 2, 3] → [1,2] ✅  [1,3] ✅ (được bỏ giữa)

    → Subarray = phải LIÊN TIẾP! Đây là constraint quan trọng!

  📌 Kỹ năng chuyển giao:
    Bất cứ khi nào đề nói "contiguous" hoặc "consecutive"
    → Nghĩ ngay đến: subarray, sliding window, two pointers
```

### Bước 2: Vẽ ví dụ NHỎ bằng tay → Tìm PATTERN

```
  Lấy ví dụ NHỎ NHẤT có ý nghĩa: arr = [1, 2, 3] (n=3)

  Liệt kê TẤT CẢ subarrays bằng tay:
    Bắt đầu từ index 0: [1], [1,2], [1,2,3]    → 3 cái
    Bắt đầu từ index 1: [2], [2,3]              → 2 cái
    Bắt đầu từ index 2: [3]                     → 1 cái
                                            Tổng: 6 cái

  🧠 Quan sát pattern:
    1. Mỗi subarray = 2 con số xác định: START và END
       [1]     → start=0, end=0
       [1,2]   → start=0, end=1
       [1,2,3] → start=0, end=2
       [2]     → start=1, end=1
       [2,3]   → start=1, end=2
       [3]     → start=2, end=2

    2. end LUÔN ≥ start (không thể kết thúc trước khi bắt đầu!)

    3. Số lượng = 3 + 2 + 1 = 6 = dãy cấp số cộng!
       → Công thức: n + (n-1) + ... + 1 = n(n+1)/2

  📌 Kỹ năng chuyển giao:
    LUÔN vẽ ví dụ trước khi code! Ví dụ nhỏ (n=3 hoặc 4)
    giúp thấy pattern mà đọc đề không thấy được.
```

### Bước 3: Từ pattern → Brute Force (Solution đầu tiên)

```
  Từ quan sát: "mỗi subarray = cặp (start, end)"
  → Ý tưởng: LIỆT KÊ tất cả cặp (start, end) hợp lệ!

  🧠 Suy nghĩ: "Liệt kê tất cả cặp = 2 vòng for lồng nhau!"

    for start = 0 → n-1:
      for end = start → n-1:    ← end ≥ start!
        → Với mỗi cặp, lấy ra subarray arr[start..end]

  Nhưng CÁCH NÀO lấy ra arr[start..end]?
    → Cần vòng for THỨ 3 để duyệt từ start → end
    → Nên: 3 vòng for!

    for (i = 0 → n-1)           ← chọn start
      for (j = i → n-1)         ← chọn end
        for (k = i → j)         ← thu thập phần tử
          sub.push(arr[k])

  ✅ Đây là Solution 1: 3 vòng for — O(n³)

  📌 Kỹ năng chuyển giao:
    Brute force = ENUMERATION = liệt kê TẤT CẢ khả năng
    → Mỗi "lựa chọn" = 1 vòng for
    → 2 lựa chọn (start, end) = 2 vòng for
    → Thu thập dữ liệu = thêm vòng for nữa
    → LUÔN bắt đầu từ brute force, rồi optimize!
```

### Bước 4: Tự hỏi "Vòng for thứ 3 có cần thiết không?"

```
  🧠 Nhìn vào vòng for thứ 3:
    for (k = i; k <= j; k++)
      sub.push(arr[k])

    → Mục đích: lấy ra đoạn arr[i..j]
    → JavaScript có built-in cho việc này: arr.slice(i, j+1)!

  💡 Insight: Thay vòng for thứ 3 bằng slice()!

    for (i = 0 → n-1)
      for (j = i → n-1)
        result.push(arr.slice(i, j+1))    ← 1 dòng thay cả vòng for!

  ✅ Đây là Solution 2: 2 vòng + slice

  ⚠️ Nhận ra: slice(i, j+1) — tại sao j+1?
    Vì slice(start, end) → end EXCLUSIVE (không tính end)
    Muốn lấy đến index j → phải truyền j+1

  📌 Kỹ năng chuyển giao:
    Khi viết xong brute force, TỰ HỎI:
    "Có built-in nào làm thay 1 phần code không?"
    "Có cách nào BỎ BỚT 1 vòng for?"
    → Đây là quá trình OPTIMIZATION!
```

### Bước 5: "Có cách nào khác TƯ DUY về bài toán?"

```
  🧠 Nhìn lại: Mỗi lần j tăng 1, subarray CHỈ THÊM 1 phần tử!

    j=0: [1]
    j=1: [1, 2]      ← thêm 2 vào [1]!
    j=2: [1, 2, 3]   ← thêm 3 vào [1, 2]!

  💡 Insight: Không cần tạo mới mỗi lần!
    → Giữ subarray cũ, CHỈ push thêm 1 phần tử!

    sub = []
    j=i:   sub.push(arr[i])     → sub = [arr[i]]
    j=i+1: sub.push(arr[i+1])   → sub = [arr[i], arr[i+1]]
    j=i+2: sub.push(arr[i+2])   → sub = [arr[i], arr[i+1], arr[i+2]]

  ⚠️ TRAP: phải save COPY (không phải reference!)
    result.push([...sub])   ← spread operator tạo copy!

  ✅ Đây là Solution 4: Incremental Build

  📌 Kỹ năng chuyển giao:
    Khi thấy pattern "thêm/bớt 1 phần tử so với bước trước"
    → ĐỪNG tính lại từ đầu! Tận dụng kết quả cũ!
    → Đây là nguyên tắc INCREMENTAL COMPUTATION
    → Áp dụng cho: Sliding Window, Kadane's, Prefix Sum, ...
```

### Bước 6: "Bài toán THỰC có yêu cầu generate hết không?"

```
  🧠 Nhận ra: Trong phỏng vấn THỰC, interviewer HIẾM KHI hỏi
     "generate tất cả subarrays"

  Thay vào đó sẽ hỏi:
    "Tìm subarray có SUM LỚN NHẤT"         → Kadane's O(n)
    "Tìm subarray có SUM = k"              → Prefix Sum + HashMap O(n)
    "Tìm subarray NGẮN NHẤT có sum ≥ k"   → Sliding Window O(n)

  🧠 Suy nghĩ: "Nếu chỉ cần SUM chứ không cần lưu subarray?"

    Incremental sum (từ bước 5):
      sub = [], sum = 0
      j=i:   sum += arr[i]     → sum = arr[i]
      j=i+1: sum += arr[i+1]   → sum = arr[i] + arr[i+1]
      → O(1) cho mỗi subarray thay vì O(length)!

    Đây là BRIDGE dẫn đến Kadane's Algorithm:
      max_sum = -Infinity
      current_sum = 0
      for each element:
        current_sum = max(element, current_sum + element)
        max_sum = max(max_sum, current_sum)

  📌 Kỹ năng chuyển giao:
    Hỏi: "Có cần TOÀN BỘ dữ liệu, hay chỉ cần 1 CON SỐ?"
    Nếu chỉ cần 1 con số (max, min, count, sum)
    → Không cần generate hết → Dùng technique!
```

### Bước 7: Tổng kết — Cây quyết định khi gặp bài SUBARRAY

```mermaid
graph TD
    A["Đề bài có từ 'subarray'?"] -->|Yes| B{"Hỏi gì?"}
    B -->|"generate TẤT CẢ"| C["2 vòng for + slice"]
    B -->|"max/min SUM"| D["Kadane's O(n)"]
    B -->|"sum = K"| E["Prefix Sum + HashMap O(n)"]
    B -->|"shortest/longest"| F["Sliding Window O(n)"]
    B -->|"count subarrays"| G["Two Pointers / Math O(n)"]
    B -->|"min/max element"| H["Monotonic Stack O(n)"]

    style C fill:#FF9800,color:white
    style D fill:#4CAF50,color:white
    style E fill:#4CAF50,color:white
    style F fill:#4CAF50,color:white
    style G fill:#4CAF50,color:white
    style H fill:#4CAF50,color:white
```

```
  📌 QUY TRÌNH TƯ DUY TỔNG QUÁT (áp dụng cho MỌI bài):

  ┌──────────────────────────────────────────────────────────────┐
  │  1. ĐỌC ĐỀ → gạch chân keywords                            │
  │     → Xác định: input, output, constraints                  │
  │                                                              │
  │  2. VẼ VÍ DỤ NHỎ → tìm pattern                             │
  │     → Dùng n=3 hoặc n=4, liệt kê bằng tay                  │
  │     → TÌM quy luật: lặp lại gì? Tăng/giảm gì?             │
  │                                                              │
  │  3. BRUTE FORCE → solution đầu tiên                         │
  │     → Enumeration: mỗi lựa chọn = 1 vòng for               │
  │     → LUÔN viết brute force trước!                          │
  │                                                              │
  │  4. OPTIMIZE → hỏi "có bỏ được vòng for không?"            │
  │     → Built-in thay vòng for? (slice, filter, map)          │
  │     → Kết quả cũ dùng lại được? (incremental)              │
  │     → Có cần tất cả data? (chỉ cần max/count?)             │
  │                                                              │
  │  5. PATTERN MATCH → nhận dạng technique                     │
  │     → Sorted + in-place → Two Pointers                      │
  │     → Subarray + sum → Prefix Sum / Kadane                  │
  │     → Shortest/longest + condition → Sliding Window          │
  │     → Min/max in range → Monotonic Stack                     │
  │                                                              │
  │  6. VERIFY → chạy lại ví dụ bằng tay                       │
  │     → Kiểm tra edge cases: empty, 1 element, all same       │
  └──────────────────────────────────────────────────────────────┘

  ⭐ QUY TẮC VÀNG:
    Bạn KHÔNG CẦN nhớ tất cả solutions.
    Bạn CẦN nhớ QUY TRÌNH TƯ DUY → tự derive solution!

    "Nếu quên code → vẽ ví dụ → tìm pattern → viết code"
```

---

## E — Examples

```
VÍ DỤ 1: arr = [1, 2, 3]

  Liệt kê THEO START INDEX:

  Start=0:
    end=0: [1]         ← chỉ phần tử 1
    end=1: [1, 2]      ← từ index 0 đến 1
    end=2: [1, 2, 3]   ← từ index 0 đến 2 (toàn bộ)
    → 3 subarrays

  Start=1:
    end=1: [2]         ← chỉ phần tử 2
    end=2: [2, 3]      ← từ index 1 đến 2
    → 2 subarrays

  Start=2:
    end=2: [3]         ← chỉ phần tử 3
    → 1 subarray

  Tổng: 3 + 2 + 1 = 6 = 3×4/2 ✅
```

### Minh họa trực quan

```
  arr = [1, 2, 3]
         0  1  2    ← index

  Tất cả subarrays:
    ┌───┐
    │ 1 │ 2   3     [1]       start=0, end=0
    ├───┤───┐
    │ 1 │ 2 │ 3     [1, 2]    start=0, end=1
    ├───┤───┤───┐
    │ 1 │ 2 │ 3 │   [1, 2, 3] start=0, end=2
    └───┘───┘───┘
            ┌───┐
      1   │ 2 │ 3     [2]       start=1, end=1
            ├───┤───┐
      1   │ 2 │ 3 │   [2, 3]    start=1, end=2
            └───┘───┘
                ┌───┐
      1     2 │ 3 │   [3]       start=2, end=2
                └───┘
```

### Công thức SỐ LƯỢNG subarrays

```
  Số subarrays = n × (n + 1) / 2

  Chứng minh:
    Start=0: có n choices cho end (0, 1, ..., n-1)     → n subarrays
    Start=1: có n-1 choices cho end (1, 2, ..., n-1)   → n-1 subarrays
    Start=2: có n-2 choices cho end                     → n-2 subarrays
    ...
    Start=n-1: có 1 choice (end = n-1)                 → 1 subarray

    Tổng = n + (n-1) + (n-2) + ... + 1 = n(n+1)/2

  📐 Bảng tham khảo:
    n=1:  1     n=5:  15    n=100:  5,050
    n=2:  3     n=6:  21    n=1000: 500,500
    n=3:  6     n=10: 55    n=10000: 50,005,000
    n=4:  10    n=20: 210

  ⚠️ n=10,000 → 50 TRIỆU subarrays → KHÔNG THỂ generate hết!
```

---

## A — Approach

### Approach 1: 3 vòng for — O(n³)

```
  Vòng 1 (i): chọn START index    → n iterations
  Vòng 2 (j): chọn END index      → trung bình n/2 iterations
  Vòng 3 (k): thu thập phần tử    → trung bình n/3 iterations

  i = start index (0 → n-1)
  j = end index   (i → n-1)    ← j bắt đầu từ i, không phải 0!
  k = index duyệt (i → j)     ← cho từng phần tử vào sub[]

  Total iterations ≈ n × n/2 × n/3 ≈ n³/6 → O(n³)
```

### Approach 2: 2 vòng for + slice — O(n²) ✅

```
💡 Dùng arr.slice(i, j+1) thay vì vòng for thứ 3!

  for i = 0 → n-1:       ← start
    for j = i → n-1:     ← end
      subarray = arr.slice(i, j+1)

  ⚠️ slice(start, end) — end KHÔNG ĐƯỢC TÍNH!
     slice(0, 3) = [arr[0], arr[1], arr[2]] → KHÔNG có arr[3]!
     → Phải dùng j+1 chứ không phải j!

  Ưu: code SẠCH hơn, bỏ vòng for thứ 3
  Nhược: slice vẫn copy O(j-i+1) → time vẫn O(n³) tổng
  → Nhưng CODE chỉ 2 vòng for = dễ đọc hơn!
```

### Approach 3: Recursive

```
💡 Ý tưởng: Dùng RECURSION thay 2 vòng for!

  2 vòng for iterative:
    Vòng ngoài (i): chọn END   → tăng end từ 0 → n-1
    Vòng trong (j): chọn START → tăng start từ 0 → end

  Recursive tương đương:
    Hàm recurse(start, end) xử lý 1 subarray
    Rồi GỌI LẠI CHÍNH MÌNH với start/end tiếp theo

  3 TRƯỜNG HỢP trong mỗi lần gọi:
  ┌────────────────────────────────────────────────────────────┐
  │  ① end === n       → DỮNG! (đã duyệt hết)            │
  │  ② start > end    → Reset start=0, tăng end           │
  │  ③ Bình thường      → Lấy subarray, tăng start          │
  └────────────────────────────────────────────────────────────┘

  Hình dung như MAY VÁ: “Máy may” chạy từ trái qua phải
    với mỗi điểm kết thúc (end), rồi “tua lại” đầu và shift xuống

  Với arr = [1, 2, 3]:
    end=0: start=0              → [1]             rồi start > end → reset!
    end=1: start=0, start=1     → [1,2], [2]      rồi start > end → reset!
    end=2: start=0, 1, 2        → [1,2,3], [2,3], [3]  rồi end=3=n → STOP!

  ⚠️ Thứ tự output KHÁC iterative:
    Iterative (nhóm theo START): [1], [1,2], [1,2,3], [2], [2,3], [3]
    Recursive (nhóm theo END):   [1], [1,2], [2], [1,2,3], [2,3], [3]
```

```mermaid
graph TD
    R0["recurse(0, 0)"] -->|"push [1]"| R1["recurse(1, 0)"]
    R1 -->|"1>0 → reset!"| R2["recurse(0, 1)"]
    R2 -->|"push [1,2]"| R3["recurse(1, 1)"]
    R3 -->|"push [2]"| R4["recurse(2, 1)"]
    R4 -->|"2>1 → reset!"| R5["recurse(0, 2)"]
    R5 -->|"push [1,2,3]"| R6["recurse(1, 2)"]
    R6 -->|"push [2,3]"| R7["recurse(2, 2)"]
    R7 -->|"push [3]"| R8["recurse(3, 2)"]
    R8 -->|"3>2 → reset!"| R9["recurse(0, 3)"]
    R9 -->|"end=3=n → STOP! ✅"| STOP[" "]

    style R0 fill:#2196F3,color:white
    style R1 fill:#FF9800,color:white
    style R2 fill:#2196F3,color:white
    style R3 fill:#2196F3,color:white
    style R4 fill:#FF9800,color:white
    style R5 fill:#2196F3,color:white
    style R6 fill:#2196F3,color:white
    style R7 fill:#2196F3,color:white
    style R8 fill:#FF9800,color:white
    style R9 fill:#F44336,color:white
    style STOP fill:#4CAF50,color:white
```

```
  🟦 Xanh dương = push subarray (đang làm việc)
  🟧 Cam        = start > end → reset! (chuyển end mới)
  🟥 Đỏ         = base case → DỮNG!

  ⚠️ Output: [1], [1,2], [2], [1,2,3], [2,3], [3] — NHÓM THEO END!
     Vì end thay đổi CHẬM (chỉ tăng khi start > end)
```

### Approach 3B: Recursive nhóm theo START

```
  💡 Muốn output: [[1], [1,2], [1,2,3], [2], [2,3], [3]] (nhóm theo START)?
     → ĐẢO vai trò: start thay đổi CHẬM, end thay đổi NHANH!

  Approach 3 (nhóm END):
    end CHẬM (tăng khi reset) | start NHANH (tăng mỗi bước)
    → start chạy hết → tăng end → start chạy lại từ 0

  Approach 3B (nhóm START):
    start CHẬM (tăng khi reset) | end NHANH (tăng mỗi bước)
    → end chạy hết → tăng start → end chạy lại từ start

  3 TRƯỜNG HỢP:
  ┌────────────────────────────────────────────────────────────┐
  │  ① start === n    → DỪNG! (đã duyệt hết start)         │
  │  ② end === n      → Reset end = start+1, tăng start     │
  │  ③ Bình thường     → Lấy subarray, tăng end              │
  └────────────────────────────────────────────────────────────┘

  Với arr = [1, 2, 3]:
    start=0: end=0, 1, 2          → [1], [1,2], [1,2,3]  rồi end=3=n → reset!
    start=1: end=1, 2             → [2], [2,3]            rồi end=3=n → reset!
    start=2: end=2                → [3]                   rồi end=3=n → reset!
    start=3: start=3=n → STOP!
```

```javascript
// Recursive nhóm theo START
function recursion(start, end) {
    if (start === arr.length) return;     // start hết = DỪNG
    
    if (end === arr.length) {             // end hết = tăng start, reset end
        recursion(start + 1, start + 1);
        return;
    }
    
    res.push(arr.slice(start, end + 1));
    recursion(start, end + 1);            // tăng end (NHANH)
}
recursion(0, 0);
```

```mermaid
graph TD
    S0["recurse(0, 0)"] -->|"push [1]"| S1["recurse(0, 1)"]
    S1 -->|"push [1,2]"| S2["recurse(0, 2)"]
    S2 -->|"push [1,2,3]"| S3["recurse(0, 3)"]
    S3 -->|"end=3=n → reset!"| S4["recurse(1, 1)"]
    S4 -->|"push [2]"| S5["recurse(1, 2)"]
    S5 -->|"push [2,3]"| S6["recurse(1, 3)"]
    S6 -->|"end=3=n → reset!"| S7["recurse(2, 2)"]
    S7 -->|"push [3]"| S8["recurse(2, 3)"]
    S8 -->|"end=3=n → reset!"| S9["recurse(3, 3)"]
    S9 -->|"start=3=n → STOP! ✅"| STOP[" "]

    style S0 fill:#2196F3,color:white
    style S1 fill:#2196F3,color:white
    style S2 fill:#2196F3,color:white
    style S3 fill:#FF9800,color:white
    style S4 fill:#2196F3,color:white
    style S5 fill:#2196F3,color:white
    style S6 fill:#FF9800,color:white
    style S7 fill:#2196F3,color:white
    style S8 fill:#FF9800,color:white
    style S9 fill:#F44336,color:white
    style STOP fill:#4CAF50,color:white
```

```
  🟦 Xanh dương = push subarray
  🟧 Cam        = end=n → reset! (chuyển start mới)
  🟥 Đỏ         = start=n → DỪNG!

  Output: [1], [1,2], [1,2,3], [2], [2,3], [3] ← NHÓM THEO START ✅

  📌 QUY TẮC: Biến thay đổi CHẬM = biến NHÓM output!
     Approach 3:  end chậm   → nhóm theo end
     Approach 3B: start chậm → nhóm theo start ⭐
```

### Approach 4: Incremental Build — Nối dần từng phần tử

```
💡 Ý tưởng: Thay vì tạo mới mỗi lần, NỐI thêm phần tử vào subarray cũ!

  Với mỗi start i:
    sub = []
    j = i:   sub.push(arr[i])   → sub = [arr[i]]         → save copy
    j = i+1: sub.push(arr[i+1]) → sub = [arr[i], arr[i+1]] → save copy
    j = i+2: sub.push(arr[i+2]) → sub = [arr[i], ..., arr[i+2]] → save copy

  Ưu: KHÔNG cần slice() hoặc vòng for thứ 3
  Nhược: vẫn phải [...sub] copy mỗi lần save (để tránh reference)

  So với 3 vòng for:
    3 vòng for: tạo sub mới MỖI LẦN từ đầu
    Incremental: CHỈ push thêm 1 phần tử vào sub cũ!
```

### Approach 5: flatMap — Functional one-liner

```
💡 Ý tưởng: Dùng flatMap + map để tạo tất cả subarrays trong 1 expression

  arr.flatMap((_, i) =>
    arr.slice(i).map((_, j) => arr.slice(i, i + j + 1))
  )

  flatMap: với mỗi start i, tạo mảng các subarrays  → then FLATTEN
  map: với mỗi end j (relative), slice ra subarray

  ✅ Gọn, functional style
  ⚠️ Khó đọc hơn vòng for — chỉ dùng khi quen functional programming
```

### Trace CHI TIẾT flatMap: arr = [1, 2, 3]

```
  Bước 1: TÁCH NHỎ — hiểu từng phần

  arr.flatMap((_, i) =>            ← VÒNG NGOÀI: i = 0, 1, 2 (start)
    arr.slice(i)                   ← Tạo mảng con TỪ index i trở đi
      .map((_, j) =>               ← VÒNG TRONG: j = 0, 1, ... (relative index)
        arr.slice(i, i + j + 1)    ← Cắt subarray từ i, dài j+1 phần tử
      )
  )

  ⚠️ j ở đây KHÔNG PHẢI end index thật!
     j = index trong arr.slice(i) → "relative index" bắt đầu từ 0
     Nên subarray = arr.slice(i, i + j + 1) → lấy j+1 phần tử từ i
```

```
  Bước 2: TRACE từng giá trị i

  ┌─ i=0 ──────────────────────────────────────────────────────┐
  │                                                            │
  │  arr.slice(0) = [1, 2, 3]     ← mảng từ index 0 trở đi   │
  │                                                            │
  │  .map((_, j) => arr.slice(0, 0 + j + 1))                  │
  │                                                            │
  │  j=0: arr.slice(0, 0+0+1) = arr.slice(0, 1) = [1]        │
  │  j=1: arr.slice(0, 0+1+1) = arr.slice(0, 2) = [1, 2]     │
  │  j=2: arr.slice(0, 0+2+1) = arr.slice(0, 3) = [1, 2, 3]  │
  │                                                            │
  │  → Kết quả i=0: [[1], [1,2], [1,2,3]]                    │
  └────────────────────────────────────────────────────────────┘

  ┌─ i=1 ──────────────────────────────────────────────────────┐
  │                                                            │
  │  arr.slice(1) = [2, 3]        ← mảng từ index 1 trở đi   │
  │                                                            │
  │  .map((_, j) => arr.slice(1, 1 + j + 1))                  │
  │                                                            │
  │  j=0: arr.slice(1, 1+0+1) = arr.slice(1, 2) = [2]        │
  │  j=1: arr.slice(1, 1+1+1) = arr.slice(1, 3) = [2, 3]     │
  │                                                            │
  │  → Kết quả i=1: [[2], [2,3]]                              │
  └────────────────────────────────────────────────────────────┘

  ┌─ i=2 ──────────────────────────────────────────────────────┐
  │                                                            │
  │  arr.slice(2) = [3]           ← mảng từ index 2 trở đi   │
  │                                                            │
  │  .map((_, j) => arr.slice(2, 2 + j + 1))                  │
  │                                                            │
  │  j=0: arr.slice(2, 2+0+1) = arr.slice(2, 3) = [3]        │
  │                                                            │
  │  → Kết quả i=2: [[3]]                                     │
  └────────────────────────────────────────────────────────────┘
```

```
  Bước 3: flatMap = map + FLATTEN

  map (chưa flatten):
    [
      [[1], [1,2], [1,2,3]],     ← i=0 (mảng LỒNG!)
      [[2], [2,3]],               ← i=1
      [[3]]                       ← i=2
    ]

  flatMap (flatten 1 cấp):
    [
      [1], [1,2], [1,2,3],        ← "mở ngoặc" i=0
      [2], [2,3],                  ← "mở ngoặc" i=1
      [3]                          ← "mở ngoặc" i=2
    ]

  → Output: [[1], [1,2], [1,2,3], [2], [2,3], [3]] ← NHÓM THEO START ✅
```

```
  Bước 4: TẠI SAO i + j + 1?

  j = relative index (bắt đầu từ 0 trong arr.slice(i))
  Muốn lấy j+1 phần tử bắt đầu từ i:
    arr.slice(start, end)    ← end exclusive!
    start = i
    end = i + (j + 1) = i + j + 1

  Ví dụ: i=0, j=1
    Muốn: [1, 2] → 2 phần tử từ index 0
    arr.slice(0, 0 + 1 + 1) = arr.slice(0, 2) = [1, 2] ✅

  ⚠️ Nếu quên +1:
    arr.slice(0, 0 + 1) = arr.slice(0, 1) = [1] ← THIẾU!

  📌 Tại sao dùng arr.slice(i) rồi .map?
     → arr.slice(i) có LENGTH = n - i
     → .map chạy n - i lần → CHÍNH XÁC số subarrays bắt đầu từ i!
     → Không cần tính "end chạy đến đâu" — tự động đúng!
```

### So sánh tất cả approaches

```
  ┌──────────────────┬──────────┬──────────┬────────────────────┐
  │                  │ Time     │ Vòng for │ Ghi chú             │
  ├──────────────────┼──────────┼──────────┼────────────────────┤
  │ 3 vòng for       │ O(n³)    │ 3        │ Rõ ràng nhất        │
  │ 2 vòng + slice  │ O(n³)*   │ 2        │ Sạch nhất ⭐        │
  │ Recursive       │ O(n³)*   │ 0        │ Stack depth         │
  │ Incremental     │ O(n³)*   │ 2        │ Ít copy hơn         │
  │ flatMap         │ O(n³)*   │ 0        │ Functional 1-liner  │
  └──────────────────┴──────────┴──────────┴────────────────────┘
  * time thực sự O(n³) vì phải copy phần tử cho output
```

---

## C — Code

### Solution 1: Iterative 3 vòng for — O(n³)

```javascript
function allSubarrays3Loops(arr) {
  const n = arr.length;
  const result = [];

  // Vòng 1: start index
  for (let i = 0; i < n; i++) {
    // Vòng 2: end index
    for (let j = i; j < n; j++) {
      // Vòng 3: thu thập phần tử i → j
      const sub = [];
      for (let k = i; k <= j; k++) {
        sub.push(arr[k]);
      }
      result.push(sub);
    }
  }
  return result;
}
```

### Giải thích từng vòng for

```
  for (let i = 0; i < n; i++)
    → i = START index
    → Duyệt từ 0 đến n-1 (mọi vị trí bắt đầu)

  for (let j = i; j < n; j++)
    → j = END index
    → j bắt đầu từ i (KHÔNG phải 0!)
    → Vì end >= start luôn luôn!
    → j = i: subarray 1 phần tử [arr[i]]
    → j = n-1: subarray từ i đến cuối

  for (let k = i; k <= j; k++)
    → k duyệt từ start đến end
    → Thu thập phần tử cho sub[]
    → ⚠️ k <= j (CÓ DẤU =) vì j TÍNH VÀO!
```

### Tại sao output là `[[1], [1,2], [1,2,3], [2], [2,3], [3]]`?

```
  Output theo thứ tự này vì: VÒNG NGOÀI (i) = START index!

  Vòng ngoài CỐ ĐỊNH start, vòng trong TĂNG end:
    → TẤT CẢ subarrays bắt đầu từ 0 RA TRƯỚC,
      rồi tất cả bắt đầu từ 1, rồi 2, ...

  arr = [1, 2, 3]

  ┌─ i=0 (start FIXED = 0) ─────────────────────┐
  │   j=0 → arr[0..0] → [1]        ← end tăng ↓ │
  │   j=1 → arr[0..1] → [1, 2]                   │
  │   j=2 → arr[0..2] → [1, 2, 3]                │
  └───────────────────────────────────────────────┘
  ┌─ i=1 (start FIXED = 1) ─────────────────────┐
  │   j=1 → arr[1..1] → [2]                      │
  │   j=2 → arr[1..2] → [2, 3]                   │
  └───────────────────────────────────────────────┘
  ┌─ i=2 (start FIXED = 2) ─────────────────────┐
  │   j=2 → arr[2..2] → [3]                      │
  └───────────────────────────────────────────────┘

  → Output: [1], [1,2], [1,2,3], [2], [2,3], [3]
             ╰── nhóm i=0 ────╯  ╰─ i=1 ──╯  ╰i=2╯

  💡 NHÓM theo START vì i (start) ở VÒNG NGOÀI!

  ⚠️ Nếu ĐẢO: vòng ngoài = end, vòng trong = start
     → Output sẽ NHÓM theo END:
     [1], [1,2], [2], [1,2,3], [2,3], [3]
     ╰i=0╯╰─ end=1 ─╯ ╰──── end=2 ────╯

  QUY TẮC: Biến ở VÒNG NGOÀI = cách NHÓM output!
     Ngoài=start → nhóm theo start (cách phổ biến)
     Ngoài=end   → nhóm theo end   (recursive approach)
```

### Trace CHI TIẾT 3 vòng for: arr = [1, 2, 3]

```
  Tất cả iterations (đếm từng bước):

  ┌─ i=0 ──────────────────────────────────────────────────────────┐
  │                                                              │
  │  j=0:                                                        │
  │    k=0: sub.push(arr[0])=1    → sub=[1]                      │
  │    → result.push([1])                               #1      │
  │                                                              │
  │  j=1:                                                        │
  │    k=0: sub.push(arr[0])=1    → sub=[1]                      │
  │    k=1: sub.push(arr[1])=2    → sub=[1,2]                    │
  │    → result.push([1,2])                             #2      │
  │                                                              │
  │  j=2:                                                        │
  │    k=0: sub.push(arr[0])=1    → sub=[1]                      │
  │    k=1: sub.push(arr[1])=2    → sub=[1,2]                    │
  │    k=2: sub.push(arr[2])=3    → sub=[1,2,3]                  │
  │    → result.push([1,2,3])                           #3      │
  │                                                              │
  │  📊 i=0: 3 subarrays, k chạy tổng: 1+2+3 = 6 lần            │
  └──────────────────────────────────────────────────────────────┘

  ┌─ i=1 ──────────────────────────────────────────────────────────┐
  │                                                              │
  │  j=1:                                                        │
  │    k=1: sub.push(arr[1])=2    → sub=[2]                      │
  │    → result.push([2])                               #4      │
  │                                                              │
  │  j=2:                                                        │
  │    k=1: sub.push(arr[1])=2    → sub=[2]                      │
  │    k=2: sub.push(arr[2])=3    → sub=[2,3]                    │
  │    → result.push([2,3])                             #5      │
  │                                                              │
  │  📊 i=1: 2 subarrays, k chạy tổng: 1+2 = 3 lần              │
  └──────────────────────────────────────────────────────────────┘

  ┌─ i=2 ──────────────────────────────────────────────────────────┐
  │                                                              │
  │  j=2:                                                        │
  │    k=2: sub.push(arr[2])=3    → sub=[3]                      │
  │    → result.push([3])                               #6      │
  │                                                              │
  │  📊 i=2: 1 subarray, k chạy tổng: 1 lần                     │
  └──────────────────────────────────────────────────────────────┘

  TỔNG KẾT:
    Subarrays: 3 + 2 + 1 = 6 = n(n+1)/2 ✅
    Vòng k chạy: (1+2+3) + (1+2) + (1) = 10 lần
    Công thức vòng k: n(n+1)(n+2)/6 → với n=3: 3×4×5/6 = 10 ✅

    ⚠️ Nếu n=100:
       Subarrays = 5,050
       Vòng k chạy = 100×101×102/6 = 171,700 lần!
```

### Tại sao vòng k cần thiết? — Hiểu sâu hơn

```
  Vòng 1 (i) và vòng 2 (j) chỉ XÁC ĐỊNH cặp (start, end)
  Vòng 3 (k) làm việc THU THẬP phần tử

  Nếu KHÔNG có vòng k:
    i=0, j=2 → ta BIẾT subarray là [1, 2, 3]
    Nhưng LÀM SAO lấy ra arr[0], arr[1], arr[2]?
    → CẦN vòng k để duyệt từ i đến j!

  Thay thế vòng k:
    → arr.slice(i, j+1) — JS built-in làm thay! (Approach 2)
    → Incremental build — push thêm 1 phần tử mỗi lần (Approach 4)
```

### Solution 2: Iterative 2 vòng + slice — O(n²) ✅

```javascript
function allSubarrays(arr) {
  const result = [];

  for (let i = 0; i < arr.length; i++) {
    for (let j = i; j < arr.length; j++) {
      result.push(arr.slice(i, j + 1));
    }
  }
  return result;
}
```

### Giải thích arr.slice()

```
  arr.slice(start, end)
    → Trả về MẢNG MỚI từ index start → end-1
    → end KHÔNG ĐƯỢC TÍNH (exclusive)!
    → KHÔNG thay đổi mảng gốc!

  Ví dụ: arr = [1, 2, 3, 4, 5]
    arr.slice(0, 1) → [1]          chỉ index 0
    arr.slice(0, 3) → [1, 2, 3]    index 0, 1, 2
    arr.slice(2, 5) → [3, 4, 5]    index 2, 3, 4
    arr.slice(1, 2) → [2]          chỉ index 1

  ⚠️ Vì end exclusive → dùng j+1 chứ không phải j!
     Muốn lấy arr[i..j] → slice(i, j+1)
```

### Trace CHI TIẾT: arr = [1, 2, 3]

```
  ┌─ i=0 (start=0) ──────────────────────────────┐
  │                                                │
  │  j=0: slice(0, 1) = [1]                       │
  │        Lấy: arr[0] = 1                        │
  │                                                │
  │  j=1: slice(0, 2) = [1, 2]                    │
  │        Lấy: arr[0], arr[1] = 1, 2             │
  │                                                │
  │  j=2: slice(0, 3) = [1, 2, 3]                 │
  │        Lấy: arr[0], arr[1], arr[2] = 1, 2, 3  │
  │                                                │
  │  → 3 subarrays bắt đầu từ index 0             │
  └────────────────────────────────────────────────┘

  ┌─ i=1 (start=1) ──────────────────────────────┐
  │                                                │
  │  j=1: slice(1, 2) = [2]                       │
  │        Lấy: arr[1] = 2                        │
  │                                                │
  │  j=2: slice(1, 3) = [2, 3]                    │
  │        Lấy: arr[1], arr[2] = 2, 3             │
  │                                                │
  │  → 2 subarrays bắt đầu từ index 1             │
  └────────────────────────────────────────────────┘

  ┌─ i=2 (start=2) ──────────────────────────────┐
  │                                                │
  │  j=2: slice(2, 3) = [3]                       │
  │        Lấy: arr[2] = 3                        │
  │                                                │
  │  → 1 subarray bắt đầu từ index 2              │
  └────────────────────────────────────────────────┘

  result = [[1], [1,2], [1,2,3], [2], [2,3], [3]]
  Tổng: 3 + 2 + 1 = 6 = 3×4/2 ✅
```

### Solution 3: Recursive

```javascript
function allSubarraysRecursive(arr) {
  const result = [];

  function recurse(start, end) {
    if (end === arr.length) return;        // Base case: hết mảng

    if (start > end) {
      recurse(0, end + 1);                 // Reset start, tăng end
      return;
    }

    result.push(arr.slice(start, end + 1)); // Thu thập subarray
    recurse(start + 1, end);                // Tăng start
  }

  recurse(0, 0);
  return result;
}
```

### Giải thích Recursive logic — CHI TIẾT

```
  Hàm recurse(start, end) có 3 trường hợp:

  ① BASE CASE: end === arr.length
     → Đã duyệt HẾT tất cả end (0 → n-1)
     → return! KHÔNG làm gì thêm
     → Đây là "điểm dừng" của recursion

  ② RESET: start > end
     → Đã duyệt hết tất cả start cho end hiện tại
     → Reset start về 0, TĂNG end lên 1
     → Giống như "vòng for trong kết thúc, vòng for ngoài i++"
     → Ví dụ: recurse(2, 1) → 2>1 → gọi recurse(0, 2)

  ③ BÌNH THƯỜNG: start <= end
     → Lấy subarray arr[start..end]
     → Tăng start lên 1 (thử start tiếp theo)
     → Ví dụ: recurse(0, 2) → push [1,2,3] → gọi recurse(1, 2)
```

### Tương đương với 2 vòng for

```
  BIẾN ĐỔI tư duy: Recursive = 2 vòng for "đảo ngược"!

  Vòng for (iterative):             Recursive:
  ────────────────────             ──────────────
  for (i=0; i<n; i++)              i tăng bằng: recurse(start+1, end)
    for (j=i; j<n; j++)            j tăng bằng: recurse(0, end+1)
      slice(i, j+1)                slice(start, end+1)

  Nhưng THỨ TỰ KHÁC:
    Iterative: i là vòng ngoài (START), j là vòng trong (END)
    Recursive: end là "vòng ngoài", start là "vòng trong"

    Iterative:  [1] [1,2] [1,2,3] | [2] [2,3] | [3]
                 nhóm theo START ↑

    Recursive:  [1] | [1,2] [2] | [1,2,3] [2,3] [3]
                 nhóm theo END ↑
```

### Trace CHI TIẾT với Call Stack: arr = [1, 2, 3]

```
  Bắt đầu: recurse(0, 0)

  ═══ GIAI ĐOẠN 1: end = 0 ═════════════════════════════════════

  recurse(0, 0):
    ① end=0, n=3 → 0 !== 3 → không dừng
    ② start=0, end=0 → 0 > 0? NO
    ③ push slice(0, 1) = [1]    ← Subarray #1
       gọi recurse(1, 0)        ← tăng start

  recurse(1, 0):
    ① end=0 !== 3 → không dừng
    ② start=1 > end=0? YES! → RESET!
       gọi recurse(0, 1)        ← reset start=0, tăng end!

  ═══ GIAI ĐOẠN 2: end = 1 ═════════════════════════════════════

  recurse(0, 1):
    ③ push slice(0, 2) = [1, 2] ← Subarray #2
       gọi recurse(1, 1)

  recurse(1, 1):
    ③ push slice(1, 2) = [2]    ← Subarray #3
       gọi recurse(2, 1)

  recurse(2, 1):
    ② 2 > 1? YES! → RESET!
       gọi recurse(0, 2)        ← reset start=0, tăng end!

  ═══ GIAI ĐOẠN 3: end = 2 ═════════════════════════════════════

  recurse(0, 2):
    ③ push slice(0, 3) = [1, 2, 3] ← Subarray #4
       gọi recurse(1, 2)

  recurse(1, 2):
    ③ push slice(1, 3) = [2, 3]    ← Subarray #5
       gọi recurse(2, 2)

  recurse(2, 2):
    ③ push slice(2, 3) = [3]       ← Subarray #6
       gọi recurse(3, 2)

  recurse(3, 2):
    ② 3 > 2? YES! → RESET!
       gọi recurse(0, 3)

  ═══ GIAI ĐOẠN 4: end = 3 = n → STOP! ═════════════════════════

  recurse(0, 3):
    ① end=3 === n=3? YES! → BASE CASE! return! ✅

  KẾT QUẢ: [[1], [1,2], [2], [1,2,3], [2,3], [3]] ✅
             end=0  end=1       end=2
```

```mermaid
graph TD
    R0["recurse(0,0)"] -->|"③ push [1]"| R1["recurse(1,0)"]
    R1 -->|"② 1>0 RESET!"| R2["recurse(0,1)"]
    R2 -->|"③ push [1,2]"| R3["recurse(1,1)"]
    R3 -->|"③ push [2]"| R4["recurse(2,1)"]
    R4 -->|"② 2>1 RESET!"| R5["recurse(0,2)"]
    R5 -->|"③ push [1,2,3]"| R6["recurse(1,2)"]
    R6 -->|"③ push [2,3]"| R7["recurse(2,2)"]
    R7 -->|"③ push [3]"| R8["recurse(3,2)"]
    R8 -->|"② 3>2 RESET!"| R9["recurse(0,3)"]
    R9 -->|"① end=n STOP!"| STOP["✅ Done!"]

    style R0 fill:#2196F3,color:white
    style R1 fill:#FF9800,color:white
    style R2 fill:#2196F3,color:white
    style R3 fill:#2196F3,color:white
    style R4 fill:#FF9800,color:white
    style R5 fill:#2196F3,color:white
    style R6 fill:#2196F3,color:white
    style R7 fill:#2196F3,color:white
    style R8 fill:#FF9800,color:white
    style R9 fill:#F44336,color:white
    style STOP fill:#4CAF50,color:white
```

```
  🟦 Xanh = ③ push subarray (làm việc chính)
  🟧 Cam  = ② start > end → RESET! (chuyển end mới)
  🟥 Đỏ  = ① base case → DỪNG!
```

### Tại sao dùng Recursive? — Ưu và Nhược

```
  ✅ Ưu điểm:
    → Không dùng vòng for! (chỉ có if/else và function call)
    → Tốt cho việc LUYỆN TẬP recursion
    → Dễ chuyển sang bài khó hơn (backtracking, DFS)

  ❌ Nhược điểm:
    → KHÓ đọc hơn iterative!
    → Stack depth = số lần gọi = O(n²) → stack overflow với n lớn!
    → Thứ tự output khác iterative
    → Interview: interviewer thường CHỈ yêu cầu iterative
       Nhưng nếu hỏi "có cách khác?" → mention recursive!

  🧠 Khi nào dùng:
    → Khi bài yêu cầu backtracking (generate subsequences, subsets)
    → Khi cấu trúc dữ liệu là tree/graph (DFS)
    → Khi cần "thử mọi khả năng" rồi quay lui
```

### Solution 4: Incremental Build — Nối dần

```javascript
function allSubarraysIncremental(arr) {
  const result = [];

  for (let i = 0; i < arr.length; i++) {
    const sub = [];  // Reset mỗi start mới
    for (let j = i; j < arr.length; j++) {
      sub.push(arr[j]);       // Nối thêm 1 phần tử
      result.push([...sub]);  // Save COPY (không phải reference!)
    }
  }
  return result;
}
```

### Giải thích Incremental Build

```
  Điểm khác biệt với 3 vòng for:

  3 vòng for:                    Incremental:
    j=0: sub=[]      +arr[0]=[1]     sub=[] +arr[0]=[1]     save copy
    j=1: sub=[]      +arr[0]+arr[1]  sub=[1] +arr[1]=[1,2]  save copy
    j=2: sub=[]      +arr[0]+...     sub=[1,2]+arr[2]=[1,2,3]
         ^──────────^                    ^────────────────────^
         TẠO MỚI từ đầu!               CHỈ thêm 1 phần tử!

  Trace arr = [1, 2, 3]:
    i=0: sub=[]  → push 1 → [1] save      → push 2 → [1,2] save
                 → push 3 → [1,2,3] save
    i=1: sub=[]  → push 2 → [2] save      → push 3 → [2,3] save
    i=2: sub=[]  → push 3 → [3] save

  ⚠️ TRAP: result.push(sub) vs result.push([...sub])
    push(sub)    → push REFERENCE! Khi sub thay đổi → result cũng đổi!
    push([...sub]) → push COPY! An toàn!

    Ví dụ TRAP:
      sub = [1];     result.push(sub);   → result = [[1]]
      sub.push(2);   → sub = [1,2]       → result = [[1,2]]  💀 SAI!
                                           result[0] cũng bị đổi!
```

### Solution 5: flatMap — Functional one-liner

```javascript
const allSubarraysFlatMap = (arr) =>
  arr.flatMap((_, i) =>
    arr.slice(i).map((_, j) => arr.slice(i, i + j + 1))
  );
```

### Giải thích flatMap chi tiết

```
  Bước 1: flatMap với mỗi start index i
    i=0: arr.slice(0) = [1, 2, 3]
    i=1: arr.slice(1) = [2, 3]
    i=2: arr.slice(2) = [3]

  Bước 2: map với mỗi j (relative index trong slice)
    i=0: [1,2,3].map → j=0: slice(0,1)=[1]
                      → j=1: slice(0,2)=[1,2]
                      → j=2: slice(0,3)=[1,2,3]
    i=1: [2,3].map   → j=0: slice(1,2)=[2]
                      → j=1: slice(1,3)=[2,3]
    i=2: [3].map     → j=0: slice(2,3)=[3]

  Bước 3: flatMap flatten 1 cấp
    [[1],[1,2],[1,2,3]] + [[2],[2,3]] + [[3]]
    → [[1],[1,2],[1,2,3],[2],[2,3],[3]]

  ⚠️ Nhiều slice operations → tốn memory hơn!
  💡 Dùng khi cần code gọn trong 1-2 dòng
```

> 🎙️ *"The iterative approach with slice is cleanest. Two nested loops enumerate all (start, end) pairs, and slice extracts each subarray. Total subarrays = n(n+1)/2. For incremental build, I reuse the growing subarray and copy at each step."*

---

## O — Optimize

```
                  Time      Space          Ghi chú
  ───────────────────────────────────────────────────
  3 vòng for      O(n³)     O(1)*         Chậm nhất
  2 vòng + slice  O(n²)*    O(1)*         Sạch nhất ✅
  Recursive       O(n²)*    O(n) stack    Stack depth

  * không tính output array

  ⚠️ Tại sao Time thực sự là O(n³)?
    Tuy CODE là 2 vòng for, nhưng:
    → slice(i, j+1) tạo mảng MỚI dài (j-i+1)
    → Tổng phần tử = Σ Σ (j-i+1) ≈ n³/6
    → Vậy time bao gồm cả copy là O(n³)!

  📊 Thực tế:
    n=100:  ~5,050 subarrays, ~170,000 tổng phần tử
    n=1000: ~500,000 subarrays, ~167 TRIỆU tổng phần tử 💀
    → KHÔNG BAO GIỜ generate hết cho n lớn!

  ⚠️ Khi nào generate hết?
    → Chỉ khi n nhỏ (< 100)
    → Hoặc bài yêu cầu liệt kê cụ thể

  ⚠️ Thực tế dùng gì thay?
    → Sliding Window: O(n) — tìm subarray thỏa điều kiện
    → Kadane's Algorithm: O(n) — max subarray sum
    → Prefix Sum + Hash: O(n) — subarray sum = k
    → Monotonic Stack: O(n) — subarray min/max
```

---

## T — Test

```
Test Cases:
  [1, 2, 3]    → [[1],[1,2],[1,2,3],[2],[2,3],[3]]     ✅ 6 subarrays
  [1, 2]       → [[1],[1,2],[2]]                        ✅ 3 subarrays
  [5]          → [[5]]                                  ✅ 1 subarray
  [1,2,3,4]   → 10 subarrays                            ✅ n(n+1)/2 = 10
  []           → []                                      ✅ 0 subarrays
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

  👤 "Tell me about yourself and a time you had to enumerate
      or generate structured data systematically."

  🧑 "I'm a frontend engineer with [X] years of experience.
      A relevant example: I was building an autocomplete
      feature for a search box. The user types 'abc' and
      I needed to generate all possible prefix queries:
      'a,' 'ab,' 'abc' — essentially all contiguous prefixes.

      That's a special case of subarrays — all subarrays
      that start from index 0. But I also needed substrings
      that start from any position: 'b,' 'bc,' 'c.'

      To build the suggestion engine, I first wrote a brute-force
      generator — two nested loops picking start and end indices.
      Then I realized for the actual autocomplete, I didn't need
      ALL substrings — just the ones matching a dictionary.
      So I switched to a Trie for O of length lookup.

      That progression — 'enumerate everything' to
      'use a smarter data structure' — came directly
      from understanding the foundational enumeration pattern."

  👤 "Good. Let's see how you generate all subarrays formally."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 2: PROBLEM SOLVING (05:00 — 45:00)                   ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 05:00 — Clarify (4 phút) ────────────────

  👤 "Generate all contiguous subarrays of a given array."

  🧑 "Let me clarify the terminology first, because this is
      a common source of confusion.

      A SUBARRAY is a contiguous slice of the original array.
      It's defined by two indices — start and end — where
      start is at most end. Every element between them
      is included. No gaps.

      This is different from a SUBSEQUENCE, which can skip
      elements but must maintain relative order.
      And different from a SUBSET, which ignores order entirely.

      For example, given [1, 2, 3]:
      [1, 2] is a subarray — indices 0 to 1, contiguous.
      [1, 3] is a subsequence — skips index 1, but keeps order.
      {3, 1} is a subset — same as {1, 3}, order doesn't matter.

      For this problem, I need only non-empty subarrays.
      No empty subarrays.

      And the count: with n elements, the total number of
      subarrays is n times n plus 1 divided by 2."

  👤 "How did you get that formula?"

  🧑 "Two ways to see it.

      First, arithmetic series: for each starting index i,
      the number of valid ending indices is n minus i.
      Summing over all starts:
      n plus n minus 1 plus n minus 2 plus dot dot dot plus 1
      equal n times n plus 1 divided by 2.

      Second, combinatorics: think of n plus 1 'fence posts'
      — positions between and around each element.
      Choosing any 2 fence posts defines exactly one subarray.
      That's 'n plus 1 choose 2' equal n times n plus 1
      divided by 2."

  ──────────────── 09:00 — Brute Force: 3 loops (4 phút) ────────────────

  🧑 "The most direct approach uses three nested loops.

      Loop one — variable i: picks the START index.
      Ranges from 0 to n minus 1.

      Loop two — variable j: picks the END index.
      Ranges from i to n minus 1.
      It starts from i, not from 0, because end must be
      at least equal to start.

      Loop three — variable k: collects the elements.
      Ranges from i to j, pushing each element into
      a temporary array.

      At the end of each inner iteration, I push the
      temporary array into the result.

      Time: O of n cubed. The first two loops generate
      O of n squared pairs, and the third loop copies
      up to O of n elements per pair.

      Space: O of n times n plus 1 divided by 2 for the result,
      with average subarray length n over 3."

  ──────────────── 13:00 — Optimization: slice (3 phút) ────────────────

  🧑 "I notice that the third loop just copies elements from
      index i to j — that's exactly what arr dot slice does.

      slice of i comma j plus 1 returns a new array
      containing elements from index i up to but NOT including
      j plus 1 — so elements at indices i through j.

      The plus 1 is important because slice uses exclusive end.

      This eliminates the third loop from my CODE,
      making it cleaner — just two nested loops and a slice call.

      However, slice INTERNALLY still copies O of j minus i
      elements. So the actual TIME complexity is still O of n cubed
      when totaling across all pairs.

      But the code is significantly more readable:
      2 loops instead of 3, one line per subarray."

  ──────────────── 16:00 — Trace bằng LỜI (5 phút) ────────────────

  🧑 "Let me trace with arr equal [1, 2, 3]. n equal 3.
      Expected count: 3 times 4 divided by 2 equal 6.

      i equal 0 — fixing start at 0:
        j equal 0: slice of 0 comma 1 gives [1].
        j equal 1: slice of 0 comma 2 gives [1, 2].
        j equal 2: slice of 0 comma 3 gives [1, 2, 3].
      Three subarrays starting from index 0.

      i equal 1 — fixing start at 1:
        j equal 1: slice of 1 comma 2 gives [2].
        j equal 2: slice of 1 comma 3 gives [2, 3].
      Two subarrays starting from index 1.

      i equal 2 — fixing start at 2:
        j equal 2: slice of 2 comma 3 gives [3].
      One subarray starting from index 2.

      Total: 3 plus 2 plus 1 equal 6. Matches the formula.

      The output is GROUPED BY START index because i is the
      outer loop. If I swapped the loop nesting — outer loop
      for end, inner for start — the output would be grouped
      by end index instead."

  ──────────────── 21:00 — Incremental Build (5 phút) ────────────────

  🧑 "Now here's an important optimization.

      Looking at the subarrays starting from index 0:
      [1], then [1, 2], then [1, 2, 3].

      Each new subarray is just the PREVIOUS one with ONE
      more element appended. I don't need to re-slice
      from scratch each time!

      For each start i, I initialize an empty temporary array.
      Then as j goes from i to n minus 1, I push arr at j
      into the temporary array. After each push, I save
      a COPY of the temporary array to the result.

      The copy is critical — I use the spread operator
      dot-dot-dot sub in brackets. Without it, I'd push
      a REFERENCE, and subsequent pushes would modify
      all previous entries.

      This is the INCREMENTAL BUILD pattern. Each subarray
      is built by extending the previous one, rather than
      constructing from scratch.

      Time is still O of n cubed total because copying takes
      O of length each time. But I avoid the overhead of
      slice's internal index calculations, and conceptually
      this pattern is the BRIDGE to Kadane's algorithm."

  👤 "How does this connect to Kadane's?"

  🧑 "In Kadane's, I don't need the actual subarray — just
      the running SUM. So instead of pushing elements,
      I maintain a running accumulator:

      For each i, let sum equal 0.
      As j goes from i to n minus 1:
        sum plus-equal arr at j.
        max sum equal max of max sum and sum.

      That's the incremental sum version — O of n squared.
      Then Kadane's takes it further by noticing I can reset
      versus extend in O of n.

      The progression: generate all subarrays O of n cubed,
      to incremental build O of n cubed,
      to incremental sum O of n squared,
      to Kadane's O of n.
      Each step eliminates one level of redundancy."

  ──────────────── 26:00 — Recursive approach (4 phút) ────────────────

  🧑 "There's also a recursive solution. Instead of two nested
      loops, I use a single recursive function with start
      and end parameters.

      The function has three cases:

      Case one: start equal n. All starting positions exhausted.
      Return — base case.

      Case two: end equal n. All ending positions for this start
      exhausted. Move to the next start:
      recurse with start plus 1 and end equal start plus 1.

      Case three: valid pair. Generate the subarray via slice,
      then recurse with start and end plus 1.

      This produces the same output as the iterative version
      when I make start the 'slow' variable and end the 'fast'
      variable. Each recursive call replaces one iteration
      of the inner loop.

      The complexity is the same — O of n squared calls,
      each doing O of n work for slice. But it demonstrates
      that iterative nested loops and recursion are
      interchangeable enumeration strategies."

  ──────────────── 30:00 — flatMap functional (3 phút) ────────────────

  🧑 "For completeness, there's a one-liner functional approach:

      arr dot flatMap of underscore comma i arrow
        arr dot slice of i dot map of underscore comma j arrow
          arr dot slice of i comma i plus j plus 1.

      The outer flatMap iterates start indices.
      For each start i, arr dot slice of i creates the suffix
      starting at i. The inner map iterates over this suffix
      using a RELATIVE index j. The subarray is
      arr dot slice of i comma i plus j plus 1.

      Why i plus j plus 1? j is 0-based within the suffix.
      To get j plus 1 elements starting at i, the exclusive end
      is i plus j plus 1.

      flatMap flattens one level of nesting, so the result
      is a flat array of subarrays.

      This is elegant but harder to read. In interviews,
      I'd mention it as an alternative but write the iterative
      version for clarity."

  ──────────────── 33:00 — Viết code, NÓI từng block (3 phút) ────────────

  🧑 "Let me write the clean 2-loop solution.

      [Vừa viết vừa nói:]

      I declare the result array.

      Outer loop: i from 0 to n minus 1 — start index.

      Inner loop: j from i to n minus 1 — end index.
      j starts from i because end must be at least start.

      Inside: push arr dot slice of i comma j plus 1.
      The plus 1 compensates for slice's exclusive end.

      Return result.

      Four lines of logic. The two loops enumerate all
      n times n plus 1 divided by 2 valid start-end pairs.
      Slice extracts each corresponding subarray."

  ──────────────── 36:00 — Edge Cases (3 phút) ────────────────

  👤 "What are the edge cases?"

  🧑 "Single element: [5]. n equal 1.
      Only one pair: start equal 0, end equal 0.
      Output: [[5]]. Count: 1 equal 1 times 2 divided by 2.

      Two elements: [1, 2]. n equal 2.
      Pairs: (0,0), (0,1), (1,1).
      Output: [[1], [1,2], [2]]. Count: 3 equal 2 times 3
      divided by 2.

      All same elements: [3, 3, 3].
      Output: [[3], [3,3], [3,3,3], [3], [3,3], [3]].
      All subarrays are generated independently —
      duplicates in VALUES don't affect the enumeration.
      The problem generates by POSITION, not by value.

      Empty array: the outer loop doesn't execute.
      Return an empty result. This is correct — zero subarrays."

  ──────────────── 39:00 — Complexity analysis (3 phút) ────────────────

  🧑 "Let me be precise about complexity.

      NUMBER of subarrays: n times n plus 1 divided by 2.
      This is Theta of n squared.

      TOTAL ELEMENTS across all subarrays:
      Each element at index k appears in exactly
      (k plus 1) times (n minus k) subarrays.
      Summing over all k: the total is
      n times n plus 1 times n plus 2 divided by 6.
      This is Theta of n cubed.

      So the OUTPUT SIZE is O of n cubed.
      Any algorithm that writes all subarrays to memory
      cannot be better than O of n cubed.

      The 2-loop plus slice approach:
      Time: O of n cubed — bounded by output size.
      Space: O of n cubed — storing all subarrays.

      This is optimal for this specific problem —
      the output itself is O of n cubed, so I can't beat it.

      But for problems that COMPUTE something over subarrays
      without storing them — like max sum or count —
      I can do much better."

  ──────────────── 42:00 — Why THIS problem matters (3 phút) ────

  👤 "This seems like a simple enumeration. Why is it important?"

  🧑 "Because it's the FOUNDATION for understanding why
      techniques like Kadane's and Sliding Window exist.

      If I want the maximum subarray sum, the brute force IS
      this enumeration — generate all subarrays, compute each sum,
      take the max. O of n cubed.

      Incremental sum optimization brings it to O of n squared.
      Kadane's algorithm brings it to O of n.

      Each optimization STARTS from understanding the enumeration.
      You can't appreciate why Kadane's is clever unless you
      first understand what it's AVOIDING.

      This problem also teaches the (start, end) pair mental model.
      Sliding window is just a CONSTRAINED enumeration:
      only consider (start, end) pairs where end minus start
      equals a fixed k, or where the window satisfies some
      condition. Two pointers is a smart way to enumerate
      pairs without checking all O of n squared possibilities.

      So this is the conceptual starting point for at least
      five major algorithm families."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 3: DEEP TECHNICAL PROBING (45:00 — 60:00)            ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 45:00 — Slice internals (4 phút) ────────────────

  👤 "You replaced the third loop with slice. What does slice
      actually do under the hood?"

  🧑 "In JavaScript, Array dot prototype dot slice creates
      a SHALLOW COPY of a portion of the array.

      Internally, it allocates a new array of size
      end minus start, then copies element references
      one by one. For primitives like numbers, this is
      effectively a deep copy. For objects, it copies
      references — both arrays point to the same objects.

      For this problem, since array elements are numbers,
      slice gives independent copies. Modifying one subarray
      doesn't affect others.

      Performance-wise, slice is implemented in the engine's
      native code — V8 uses C++ — so it's faster than
      a JavaScript for loop doing the same copy.
      But the asymptotic complexity is identical: O of length.

      One subtle point: slice of i with no second argument
      copies from i to the end. This is useful in the flatMap
      approach where I need the suffix starting at i."

  ──────────────── 49:00 — Spread operator copy (3 phút) ────────────────

  👤 "In the incremental build, you used spread. Why not
      just push the array directly?"

  🧑 "Let me demonstrate the bug.

      If I write result dot push of sub — no spread —
      I push a REFERENCE to the same array object.

      Then when I push the next element into sub,
      ALL previously stored entries in result also change!
      They all point to the same array.

      For [1, 2, 3]:
      After j equal 0: sub equal [1]. result equal [[1]].
      After j equal 1: sub equal [1, 2].
      But result is now [[1, 2], [1, 2]]! WRONG.
      Both entries point to the same sub.

      Using [...sub] creates a SHALLOW COPY at each step.
      The spread operator iterates sub and creates a new array
      with the same elements. Now sub and the result entry
      are independent objects.

      Alternatives: sub dot slice with no arguments also works,
      or Array dot from of sub. All create shallow copies.
      Spread is the most idiomatic in modern JavaScript."

  ──────────────── 52:00 — Subarray vs Subsequence count (4 phút) ────────

  👤 "You said subarrays are n times n plus 1 over 2, but
      subsequences are 2 to the n. Why the difference?"

  🧑 "The difference is the CONTIGUITY constraint.

      For subarrays, I choose a starting point and an ending
      point — one contiguous block. There are only O of n squared
      such blocks because the space of valid pairs is a triangle.

      For subsequences, I make an INDEPENDENT decision for each
      element: include it or exclude it. n binary choices
      give 2 to the n possibilities.

      The contiguity constraint dramatically reduces the count.
      For n equal 20: subarrays equal 210 versus
      subsequences equal 1,048,576. That's 5000 times fewer!

      This is why subarray problems are often solvable in
      polynomial time — O of n or O of n squared —
      while subsequence problems are often NP-hard or require
      exponential enumeration.

      The notable exception: the LONGEST COMMON SUBSEQUENCE
      can be solved in O of n squared using dynamic programming
      because it exploits optimal substructure,
      not brute-force enumeration."

  ──────────────── 56:00 — Element frequency analysis (4 phút) ────────────

  👤 "How many times does each element appear across all subarrays?"

  🧑 "This is a beautiful counting argument!

      Element at index k appears in a subarray starting at i
      and ending at j whenever i is at most k and k is at most j.

      The number of valid starts: i can be 0, 1, dot dot dot, k.
      That's k plus 1 choices.

      The number of valid ends: j can be k, k plus 1,
      dot dot dot, n minus 1. That's n minus k choices.

      Total: (k plus 1) times (n minus k).

      For a 5-element array, element at index 2 appears in
      3 times 3 equal 9 out of 15 total subarrays.

      This is useful in competitive programming:
      if I want the sum of all subarray sums, I don't need
      to generate anything. I just multiply each element by
      its frequency and sum up.

      Sum of all subarray sums equal
      the sum over k of arr at k times (k plus 1) times (n minus k).
      One pass, O of n!"
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 4: VARIATIONS (60:00 — 75:00)                         ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 60:00 — Incremental sum (4 phút) ────────────────

  👤 "What if you only need the SUM of each subarray,
      not the subarray itself?"

  🧑 "Then I don't need to store subarrays at all!

      For each starting index i, I maintain a running sum.
      As j goes from i to n minus 1:
        sum plus-equal arr at j.
        Now sum holds the sum of arr from i to j.

      Each sum update is O of 1 — just one addition.
      Across all subarrays, that's n times n plus 1 over 2
      additions equal O of n squared.

      Compare this to the naive approach:
      generate the subarray, then sum it.
      That's O of n cubed — generating costs O of n cubed
      and summing costs another O of n cubed.

      The incremental sum approach is a FULL ORDER of magnitude
      faster. And it uses O of 1 extra space — just the
      running sum variable.

      This is the DIRECT bridge to Kadane's algorithm,
      which takes this O of n squared approach and reduces it
      to O of n by recognizing when to restart the sum."

  ──────────────── 64:00 — Fixed-size window (3 phút) ────────────────

  👤 "What about generating only subarrays of a fixed size k?"

  🧑 "That simplifies dramatically!

      I only need one loop: for i from 0 to n minus k.
      Each subarray is arr dot slice of i comma i plus k.

      There are exactly n minus k plus 1 such subarrays.
      Time: O of n times k — linear in n.

      This IS the sliding window pattern.
      The window of size k slides from left to right,
      one position per step. At each position,
      I process the current window.

      For practical problems, I don't even store the window.
      I maintain a running aggregate — sum, max, count —
      and update it incrementally as the window slides:
      add the new element entering from the right,
      subtract the old element leaving from the left.
      O of 1 per slide, O of n total."

  ──────────────── 67:00 — Count subarrays with property (4 phút) ────

  👤 "What if you need to COUNT subarrays satisfying a condition,
      not enumerate them?"

  🧑 "Great question! The answer depends on the condition.

      If the condition is MONOTONIC — meaning if a subarray
      i to j satisfies it, then i to j minus 1 also satisfies it
      (or the reverse) — I can use the TWO POINTERS technique.

      Example: count subarrays with sum less than k
      where all elements are positive.

      I maintain a sliding window with left and right pointers.
      For each right pointer position, I find the leftmost
      left such that the window sum is below k.
      The number of valid subarrays ending at right is
      right minus left plus 1.

      Sum across all right positions: O of n total.

      The key insight: I'm NOT enumerating
      n times n plus 1 over 2 subarrays.
      I'm using the monotonic property to COUNT them
      in O of n without examining each one."

  ──────────────── 71:00 — Subarray sum equal k (4 phút) ────────────────

  👤 "And if the condition is sum equal exactly k?"

  🧑 "That's LeetCode 560 — Subarray Sum Equals K.

      I can't use sliding window because the sum isn't monotonic
      when the array has negatives. Adding an element might
      increase or decrease the sum.

      Instead, I use the PREFIX SUM plus HASHMAP technique.

      For each index j, the sum from i to j equals
      prefix at j minus prefix at i.
      I want this to equal k, so I need
      prefix at i equal prefix at j minus k.

      I maintain a HashMap of prefix sums I've seen so far.
      At each j, I check how many times
      'prefix at j minus k' has appeared.
      That's the count of valid starting points i.

      Time: O of n. Space: O of n for the HashMap.

      This is the canonical example of how understanding
      the brute-force enumeration — generate all subarrays —
      leads to a RADICALLY better algorithm by focusing on
      what you actually NEED from the subarrays."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 5: SYSTEM DESIGN AT SCALE (75:00 — 85:00)            ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 75:00 — Windowed analytics (5 phút) ────────────────

  👤 "Where does the subarray concept appear in system design?"

  🧑 "Everywhere in time-series and streaming systems!

      First — ROLLING METRICS.
      'Average response time over the last 5 minutes'
      is a fixed-size subarray of the time-series data.
      The sliding window approach directly applies.
      I maintain a running sum and divide by window size.

      Second — ANOMALY DETECTION.
      'Is there any 10-second window where error rate
      exceeds 50 percent?' This is 'does a subarray
      of size 10 satisfy a condition?' — a sliding window search.

      Third — LOG SEARCH.
      'Find all 1-hour windows where total traffic
      exceeded 1 million requests.' This is enumerating
      fixed-size subarrays that satisfy a threshold.

      Fourth — RATE LIMITING.
      'A user may make at most 100 requests per minute.'
      I maintain a sliding window of request timestamps
      and check if the count exceeds the limit.

      In ALL these cases, the system never generates ALL
      possible windows. It maintains ONE active window
      and slides it — exactly the optimization we discussed."

  ──────────────── 80:00 — Streaming windows (5 phút) ────────────────

  👤 "How do streaming frameworks like Kafka or Flink
      handle windowed computations?"

  🧑 "They formalize the subarray concept into three
      window types.

      TUMBLING windows: non-overlapping, fixed-size chunks.
      Like dividing the array into consecutive subarrays
      of size k with no overlap. Each element belongs
      to exactly one window.

      SLIDING windows: overlapping, fixed-size, fixed slide.
      A window of size 10 seconds that slides every 2 seconds.
      Each element belongs to up to 5 windows.
      This is like generating subarrays of size 10
      at every 2nd starting position.

      SESSION windows: variable-size, gap-based.
      A window ends when there's a gap of more than t seconds
      between events. This is like finding maximal subarrays
      where consecutive elements are within t distance.

      Under the hood, these frameworks use the same
      incremental computation we discussed:
      when the window slides, add the new element,
      remove the old element, update the aggregate.
      They never recompute from scratch.

      The memory optimization is critical — for a stream
      of billions of events, they can't store the full array.
      They maintain only the current window state."
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PART 6: BEHAVIORAL + Q&A (85:00 — 90:00)                  ║
  ╚══════════════════════════════════════════════════════════════╝

  ──────────────── 85:00 — Reflection (3 phút) ────────────────

  👤 "What would you take away from this problem?"

  🧑 "Three things.

      First, the (START, END) PAIR mental model.
      Every subarray is uniquely identified by a start-end pair.
      Two nested loops enumerate all valid pairs.
      This mental model extends to sliding window — which fixes
      one constraint on the pair — and two pointers — which
      enumerate pairs smartly without checking all combinations.
      Understanding the brute force makes every optimization
      feel like a natural simplification.

      Second, the PROGRESSION from enumeration to optimization.
      Generate all subarrays O of n cubed.
      Incremental build O of n cubed but cleaner.
      Incremental sum O of n squared.
      Kadane's or Sliding Window O of n.
      Each step removes one redundancy.
      This progression is HOW I think about optimization —
      not as jumping to the answer, but as systematically
      eliminating unnecessary work.

      Third, knowing WHEN to stop generating.
      In real interviews, generating all subarrays is almost
      never the final answer. The interviewer wants me to
      recognize that I don't need ALL subarrays — I need
      a specific PROPERTY of them. Identifying that property
      unlocks techniques that avoid enumeration entirely.
      This is the difference between an n squared solution
      and an n solution."

  ──────────────── 88:00 — Questions (2 phút) ────────────────

  👤 "Any questions for me?"

  🧑 "A few!

      First — in your production systems, what's the most
      common 'windowed computation' pattern? Rolling averages,
      anomaly detection, or something else?

      Second — when candidates solve subarray problems
      in interviews, do you prefer they start with brute force
      and optimize, or jump to the optimal approach?

      Third — how does your team handle the conceptual gap
      between 'I understand the enumeration' and 'I can
      derive the Kadane's optimization'? Do you find that
      teaching the progression helps?"

  👤 "Great questions! I really liked how you connected
      the simple enumeration to Kadane's, Sliding Window,
      and even stream processing frameworks.
      We'll be in touch!"
```

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  ⭐ 8 MẸO NÓI CHUYỆN TRONG PHỎNG VẤN (Subarrays)        ║
  ╚══════════════════════════════════════════════════════════════╝

  📌 MẸO #1: Clarify the three terms immediately
     ✅ "Subarray is CONTIGUOUS — no gaps.
         Subsequence can skip but keeps order.
         Subset ignores order entirely.
         For [1,2,3]: [1,3] is a subsequence,
         NOT a subarray."

  📌 MẸO #2: State the count formula with TWO derivations
     ✅ "There are n times n plus 1 over 2 subarrays.
         I can see this as the arithmetic series sum:
         n plus n minus 1 plus dot dot dot plus 1.
         Or as 'n plus 1 choose 2' fence-post combinations."

  📌 MẸO #3: Explain why j starts from i
     ✅ "The inner loop starts at i, not 0,
         because end must be at least start.
         An end before start would be an empty range —
         we only want non-empty subarrays."

  📌 MẸO #4: Mention slice's exclusive end
     ✅ "Slice uses an exclusive end boundary:
         slice of i comma j takes elements at i through j minus 1.
         So I pass j plus 1 to include element at index j.
         This is a common off-by-one source."

  📌 MẸO #5: Warn about the reference trap
     ✅ "In the incremental build, I must push a COPY:
         dot-dot-dot sub in brackets — not sub itself.
         Without copying, all result entries point to the same
         array and get modified when I push the next element."

  📌 MẸO #6: Bridge to Kadane's naturally
     ✅ "If I only need the sum, I replace the inner array
         with a running accumulator — that's O of n squared.
         Kadane's takes it to O of n by recognizing when
         extending is worse than restarting."

  📌 MẸO #7: Name the output size bottleneck
     ✅ "The total number of elements across all subarrays
         is O of n cubed. Any algorithm that writes all subarrays
         to memory is bounded by this — O of n cubed minimum.
         That's WHY we use techniques that avoid enumeration."

  📌 MẸO #8: Connect to real systems
     ✅ "The subarray concept maps directly to windowed
         computation in streaming systems. Tumbling windows
         are non-overlapping fixed-size subarrays.
         Sliding windows are overlapping ones.
         The optimization — incremental update, not recompute —
         is exactly what Kafka and Flink do under the hood."
```

### Biến thể & Mở rộng

```
  Biến thể phổ biến:

  1. In subarrays (không lưu — tiết kiệm memory)
     for (let i = 0; i < n; i++)
       for (let j = i; j < n; j++)
         console.log(arr.slice(i, j+1))
     → KHÔNG cần result array → O(1) space!

  2. Tính SUM của mỗi subarray (⭐ RẤT QUAN TRỌNG)
     for (let i = 0; i < n; i++) {
       let sum = 0;
       for (let j = i; j < n; j++) {
         sum += arr[j];     → Incremental sum! O(1) mỗi subarray
         console.log(`sum[${i}..${j}] = ${sum}`);
       }
     }
     → KHÔNG cần vòng for thứ 3! O(n²) total
     → Đây là FOUNDATION cho Kadane's Algorithm!

  3. Tìm subarray có SUM LỚN NHẤT
     → Brute force: dùng biến thể 2, so sánh max → O(n²)
     → Optimal: Kadane's Algorithm → O(n)!

  4. Đếm số subarrays có tính chất X
     → Thay vì lưu, chỉ đếm count++ khi thỏa điều kiện
     → Tiết kiệm memory: O(1) space!

  5. Generate subarrays của SIZE cố định k
     for (let i = 0; i <= n - k; i++)
       result.push(arr.slice(i, i + k))
     → Chỉ 1 vòng for! O(n) subarrays
     → Đây là Sliding Window pattern!

  6. Tìm subarray DÀI NHẤT / NGẮN NHẤT thỏa điều kiện
     → Sliding Window (variable size) → O(n)!
```

### Kiến thức liên quan

```
  GENERATE ALL SUBARRAYS → foundation pattern!

  Các bài dùng subarrays (nhưng KHÔNG generate hết):
  ┌───────────────────────────────────────────────────────────┐
  │  Bài toán                  Technique        Time          │
  │  ──────────────────────────────────────────────────       │
  │  Maximum Subarray Sum      Kadane's          O(n)         │
  │  Subarray Sum = K          Prefix Sum + Hash O(n)         │
  │  Min Size Subarray ≥ S     Sliding Window    O(n)         │
  │  Count Subarrays with Max  Monotonic Stack   O(n)         │
  │  Longest Subarray ≤ K      Sliding Window    O(n)         │
  │  Product of Subarray       Kadane variant    O(n)         │
  └───────────────────────────────────────────────────────────┘

  KEY INSIGHT: Thay vì generate TẤT CẢ → dùng technique thông minh!
    Brute force O(n²) → Sliding Window/Kadane O(n)!

  Lộ trình học (progression):
  ┌───────────────────────────────────────────────────────────┐
  │  Generate All Subarrays (bài này!)                        │
  │         ↓                                                  │
  │  Incremental Sum (đếm sum không cần vòng 3)               │
  │         ↓                                                  │
  │  Prefix Sum (precompute tất cả sum O(1) lookup)           │
  │         ↓                                                  │
  │  Kadane / Sliding Window (không cần generate)              │
  │         ↓                                                  │
  │  Monotonic Stack / Deque (advanced patterns)               │
  └───────────────────────────────────────────────────────────┘

  Phân biệt chi tiết:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  SUBARRAY (đoạn liên tiếp):                                 │
  │    [1, 2, 3] →  [1] [1,2] [1,2,3] [2] [2,3] [3]           │
  │    Số lượng: n(n+1)/2                                       │
  │    Enumerate: 2 vòng for                                    │
  │                                                              │
  │  SUBSEQUENCE (bỏ phần tử, GIỮ THỨ TỰ):                    │
  │    [1, 2, 3] →  [] [1] [2] [3] [1,2] [1,3] [2,3] [1,2,3]  │
  │    Số lượng: 2ⁿ                                             │
  │    Generate: Backtracking / Recursion                        │
  │    ⚠️ [1,3] là subsequence nhưng KHÔNG là subarray!         │
  │                                                              │
  │  SUBSET (tập con, KHÔNG quan tâm thứ tự):                   │
  │    {1, 2, 3} → {} {1} {2} {3} {1,2} {1,3} {2,3} {1,2,3}   │
  │    Số lượng: 2ⁿ                                             │
  │    Generate: Bitmask / Backtracking                          │
  │    ⚠️ {1,3} = {3,1} (same subset!)                         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

