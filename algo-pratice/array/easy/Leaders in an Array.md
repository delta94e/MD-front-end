# 👑 Leaders in an Array — GfG (Easy)

> 📖 Code: [Leaders in an Array.js](./Leaders%20in%20an%20Array.js)

```mermaid
graph TD
    A["👑 Leaders in Array"] --> B["Scan PHẢI → TRÁI"]
    B --> C["maxRight = arr[n-1]"]
    C --> D["i = n-2 → 0"]
    D --> E{"arr[i] >= maxRight?"}
    E -->|Yes| F["✅ LEADER! push + cập nhật maxRight"]
    E -->|No| G["❌ Skip"]
    F --> H{"i >= 0?"}
    G --> H
    H -->|Yes| D
    H -->|No| I["reverse result → ✅ Done"]

    style F fill:#4CAF50,color:white
    style I fill:#FF5722,color:white
```

```mermaid
graph LR
    subgraph "Suffix Maximum Pattern"
        P1["Leaders → Suffix Max"]
        P2["Stock Buy/Sell → Prefix Min"]
        P3["Trapping Rain Water → Prefix + Suffix"]
        P4["Next Greater Element → Monotonic Stack"]
    end

    subgraph "Scan Direction Rule"
        R1["Phụ thuộc bên PHẢI → scan PHẢI→TRÁI"]
        R2["Phụ thuộc bên TRÁI → scan TRÁI→PHẢI"]
    end
```

---

## R — Repeat & Clarify

🧠 *"Leader = lớn hơn hoặc bằng TẤT CẢ phần tử bên PHẢI. Scan từ phải → trái, track max!"*

> 🎙️ *"An element is a Leader if it is greater than or equal to ALL elements to its right. The rightmost element is always a leader since there's nothing to its right."*

### Clarification Questions

```
Q: "Greater than hoặc equal to"?
A: CẢ HAI! >= tất cả bên phải!
   arr = [5, 5, 5] → TẤT CẢ là leader (vì 5 >= 5)

Q: Phần tử cuối cùng luôn là leader?
A: Đúng! Không có phần tử nào bên phải → tự động leader!

Q: Trả về theo thứ tự nào?
A: Giữ thứ tự GỐC (trái → phải)

Q: Có phần tử trùng?
A: Có thể! Và = vẫn tính là leader

Q: Mảng rỗng hoặc 1 phần tử?
A: Rỗng → []. 1 phần tử → [chính nó] (luôn là leader)
```

### Tại sao bài này quan trọng?

```
  Bài này dạy PATTERN cực kỳ phổ biến:
  
  "So sánh 1 phần tử với TẤT CẢ phần tử bên phải"
  
  Brute force: O(n²) — duyệt từng phần tử bên phải
  Optimal:     O(n)  — CHỈ CẦN TRACK MAX!

  💡 KEY INSIGHT:
    KHÔNG CẦN biết TẤT CẢ phần tử bên phải!
    CHỈ CẦN biết phần tử LỚN NHẤT bên phải!
    → Nếu arr[i] >= max_right → arr[i] >= TẤT CẢ bên phải!

  Pattern này dùng lại trong:
    - Trapping Rain Water
    - Stock Buy/Sell
    - Next Greater Element
```

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

### Leader = "Vua" của đoạn bên phải

```
  Tưởng tượng TỪNG PHẦN TỬ trong mảng là 1 người,
  NHÌN VỀ BÊN PHẢI (→) để xem mình có "CAO HƠN" tất cả không:

  arr = [16, 17, 4, 3, 5, 2]

    16 nhìn phải: thấy 17 CAO HƠN → ❌ thua!
    17 nhìn phải: không ai CAO HƠN → ✅ LEADER! (vua!)
     4 nhìn phải: thấy 5 CAO HƠN  → ❌ thua!
     3 nhìn phải: thấy 5 CAO HƠN  → ❌ thua!
     5 nhìn phải: chỉ có 2         → ✅ LEADER!
     2 không có ai bên phải         → ✅ LEADER! (cuối = luôn thắng)

  💡 Leader = người KHÔNG CÓ AI "cao hơn" bên phải!
     = MAX của suffix (đoạn từ vị trí đó → cuối)
```

### Tại sao CHỈ CẦN TRACK MAX?

```
  Brute force suy nghĩ:
    "Tôi cần so sánh arr[i] với TẤT CẢ phần tử bên phải"
    → Duyệt từng cái → O(n) cho mỗi phần tử → O(n²)!

  Thông minh hơn:
    "Tôi KHÔNG CẦN biết TẤT CẢ! CHỈ CẦN biết THẰNG LỚN NHẤT!"
    → Nếu arr[i] >= thằng lớn NHẤT → arr[i] >= TẤT CẢ!

  Ví dụ đời thực:
    Q: "Bạn có cao hơn TẤT CẢ mọi người trong phòng không?"
    ❌ Sai: đo chiều cao từng người, so sánh từng cái
    ✅ Đúng: chỉ cần biết NGƯỜI CAO NHẤT trong phòng!
       → Nếu bạn >= người CAO NHẤT → chắc chắn >= TẤT CẢ!

  → ĐÂY LÀ BẢN CHẤT: Thu gọn "so sánh với tập" → "so sánh với max"!
```

### Tại sao scan từ PHẢI → TRÁI?

```
  Leader phụ thuộc vào phần tử BÊN PHẢI:
    → Phải BIẾT bên phải TRƯỚC, rồi mới check!

  Nếu scan TRÁI → PHẢI:
    Check arr[0]: cần max của [arr[1], arr[2], ..., arr[n-1]]
    → Chưa biết! Phải duyệt hết bên phải → O(n) mỗi lần → O(n²)!

  Nếu scan PHẢI → TRÁI:
    Check arr[n-1]: là leader (luôn luôn)
    Check arr[n-2]: cần max bên phải = arr[n-1] → ĐÃ BIẾT!
    Check arr[n-3]: cần max bên phải = max(arr[n-2], old_max) → ĐÃ BIẾT!

  → Scan NGƯỢC CHIỀU phụ thuộc = luôn có thông tin SẴN!

  📐 QUY TẮC TỔNG QUÁT:
    │ Phụ thuộc bên PHẢI → scan từ PHẢI → TRÁI │
    │ Phụ thuộc bên TRÁI → scan từ TRÁI → PHẢI │
    └────────────────────────────────────────────┘

    Stock Buy/Sell: giá MUA trước (trái), giá BÁN sau (phải)
      → Scan trái→phải, track min_left (prefix min)

    Leaders: so sánh với bên PHẢI
      → Scan phải→trái, track max_right (suffix max)

    Trapping Rain Water: cần CẢ HAI (left max + right max)
      → 2 pass HOẶC 2 pointers!
```

---

## E — Examples

```
VÍ DỤ 1: arr = [16, 17, 4, 3, 5, 2]

  Kiểm tra TỪNG PHẦN TỬ:

  Index:  0    1    2    3    4    5
  Value: 16   17    4    3    5    2

  16: bên phải = [17, 4, 3, 5, 2]
      max bên phải = 17
      16 >= 17? → ❌ KHÔNG phải leader (17 lớn hơn!)

  17: bên phải = [4, 3, 5, 2]
      max bên phải = 5
      17 >= 5? → ✅ LEADER! (17 lớn hơn tất cả bên phải)

   4: bên phải = [3, 5, 2]
      max bên phải = 5
      4 >= 5? → ❌ KHÔNG (5 lớn hơn!)

   3: bên phải = [5, 2]
      max bên phải = 5
      3 >= 5? → ❌ KHÔNG (5 lớn hơn!)

   5: bên phải = [2]
      max bên phải = 2
      5 >= 2? → ✅ LEADER!

   2: bên phải = [] (không có)
      → ✅ LEADER! (luôn luôn)

  Output: [17, 5, 2]
```

### Minh họa trực quan

```
  arr = [16, 17, 4, 3, 5, 2]

  Nhìn từ PHẢI sang TRÁI:
                                    2  → LEADER (cuối cùng, luôn luôn)
                               5 > 2  → LEADER (5 > tất cả bên phải)
                          3 < 5        → ❌ (5 bên phải lớn hơn)
                     4 < 5             → ❌ (5 bên phải lớn hơn)
               17 > 5                  → LEADER (17 > tất cả bên phải)
          16 < 17                      → ❌ (17 bên phải lớn hơn)

  Leaders:     17         5    2
  Position:    ↑          ↑    ↑
              [16, 17, 4, 3, 5, 2]
```

### Edge Cases — PHẢI nhớ!

```
VÍ DỤ 2: Sorted tăng dần
  [1, 2, 3, 4, 5] → [5]
  → Chỉ phần tử CUỐI là leader!
  → Mọi phần tử khác đều có phần tử lớn hơn bên phải

VÍ DỤ 3: Sorted giảm dần
  [5, 4, 3, 2, 1] → [5, 4, 3, 2, 1]
  → TẤT CẢ là leader!
  → Mỗi phần tử >= tất cả bên phải (vì giảm dần)

VÍ DỤ 4: Tất cả bằng nhau
  [5, 5, 5] → [5, 5, 5]
  → TẤT CẢ là leader! (vì >= bao gồm =)

VÍ DỤ 5: 1 phần tử
  [7] → [7]
  → Luôn là leader (không có bên phải)

  📐 Số leaders:
    Best case:  1 (sorted tăng dần)
    Worst case: n (sorted giảm dần hoặc tất cả bằng nhau)
```

---

## A — Approach

### Approach 1: Brute Force — O(n²)

```
  Ý tưởng: Với mỗi phần tử, so sánh với TẤT CẢ bên phải

  for i = 0 → n-1:                     ← xét từng phần tử
    for j = i+1 → n-1:                 ← so sánh với tất cả bên phải
      if arr[j] > arr[i] → KHÔNG leader → break
    Nếu không break → leader!

  Tại sao O(n²)?
    Worst case: sorted giảm [5,4,3,2,1]
    → Mỗi phần tử phải duyệt TẤT CẢ bên phải mới biết là leader
    → n + (n-1) + (n-2) + ... + 1 = n(n+1)/2 ≈ O(n²)

  ⚠️ Nhược điểm: Lặp lại CÔNG VIỆC!
    Khi check arr[0], ta đã biết max bên phải
    Khi check arr[1], ta lại tính lại max bên phải TỪ ĐẦU!
    → LÃNG PHÍ!
```

### Approach 2: Suffix Maximum — O(n) ✅

```
💡 KEY INSIGHT: Scan từ PHẢI → TRÁI, track max hiện tại!

  Tại sao scan từ PHẢI?
    Vì leader phụ thuộc vào phần tử BÊN PHẢI!
    → Scan từ phải = đã biết max bên phải khi check từng phần tử!

  maxRight = giá trị LỚN NHẤT đã thấy (từ phải sang)

  Nếu arr[i] >= maxRight:
    → arr[i] >= TẤT CẢ bên phải (vì maxRight = max của chúng!)
    → arr[i] là LEADER!
    → Cập nhật maxRight = arr[i] (max mới!)

  Nếu arr[i] < maxRight:
    → Có ít nhất 1 phần tử bên phải lớn hơn arr[i]
    → KHÔNG phải leader!

  ⚠️ Vì scan từ phải → trái, result thu được sẽ NGƯỢC!
     → Cần reverse() cuối để giữ thứ tự gốc!

  CHỨNG MINH tính đúng:
    maxRight tại vị trí i = max(arr[i+1], arr[i+2], ..., arr[n-1])
    Nếu arr[i] >= maxRight → arr[i] >= max(tất cả bên phải)
    → arr[i] >= MỌI phần tử bên phải (vì max >= mọi phần tử)
    → arr[i] là leader ✅
```

---

## C — Code

### Solution 1: Brute Force — O(n²)

```javascript
function leadersBrute(arr) {
  const result = [];
  const n = arr.length;

  for (let i = 0; i < n; i++) {
    let isLeader = true;

    // So sánh với TẤT CẢ phần tử bên phải
    for (let j = i + 1; j < n; j++) {
      if (arr[j] > arr[i]) {
        isLeader = false;
        break; // Có phần tử lớn hơn → KHÔNG phải leader
      }
    }

    if (isLeader) result.push(arr[i]);
  }
  return result;
}
```

### Giải thích Brute Force

```
  for (let i = 0; i < n; i++)
    → Xét TỪNG phần tử arr[i]

  let isLeader = true
    → GIẢ SỬ arr[i] là leader, rồi TÌM PHẢN CHỨNG

  for (let j = i + 1; j < n; j++)
    → j = i+1: bắt đầu từ phần tử NGAY SAU i
    → j < n: duyệt đến cuối mảng

  if (arr[j] > arr[i])
    → Tìm thấy phần tử LỚN HƠN bên phải!
    → PHẢN CHỨNG! arr[i] KHÔNG phải leader!
    → ⚠️ Chú ý: > chứ không phải >=
      (vì leader cần >= tất cả, nên chỉ > mới loại)

  break
    → Tìm được 1 phần tử lớn hơn ĐỦ KẾT LUẬN!
    → Không cần check tiếp → THOÁT vòng for j

  if (isLeader) result.push(arr[i])
    → Nếu không bị break (không ai lớn hơn) → LÀ leader!
```

### Solution 2: Suffix Maximum — O(n) ✅

```javascript
function leaders(arr) {
  const result = [];
  const n = arr.length;

  // Bắt đầu từ phần tử cuối = luôn là leader
  let maxRight = arr[n - 1];
  result.push(maxRight);

  // Scan từ PHẢI → TRÁI
  for (let i = n - 2; i >= 0; i--) {
    if (arr[i] >= maxRight) {
      maxRight = arr[i];      // Cập nhật max mới!
      result.push(maxRight);
    }
  }

  // Đảo ngược để giữ thứ tự gốc
  result.reverse();
  return result;
}
```

### Giải thích từng dòng

```
  let maxRight = arr[n - 1]
    → Khởi tạo max = phần tử CUỐI
    → Phần tử cuối LUÔN là leader!
    → ⚠️ n-1 vì 0-indexed!

  result.push(maxRight)
    → Thêm phần tử cuối vào result TRƯỚC!

  for (let i = n - 2; i >= 0; i--)
    → i bắt đầu từ n-2 (phần tử ÁP CUỐI)
    → ⚠️ Tại sao n-2? Vì phần tử cuối (n-1) đã xử lý rồi!
    → i >= 0: duyệt đến đầu mảng
    → i--: đi từ PHẢI → TRÁI

  if (arr[i] >= maxRight)
    → ⚠️ Dấu >= (KHÔNG PHẢI >)
    → Vì leader = "greater than OR EQUAL TO"
    → Nếu dùng > thì bỏ sót trường hợp bằng!

  maxRight = arr[i]
    → Cập nhật max MỚI!
    → Vì arr[i] >= maxRight → arr[i] là max mới
    → Từ i trở về trái, maxRight = arr[i]

  result.reverse()
    → Vì ta thêm từ PHẢI → TRÁI (ngược)
    → Cần đảo để giữ thứ tự GỐC (trái → phải)
```

### Trace CHI TIẾT: [16, 17, 4, 3, 5, 2]

```
  n = 6, maxRight = arr[5] = 2, result = [2]

  ┌─ i=4 ─────────────────────────────────────────┐
  │  arr[4] = 5                                     │
  │  5 >= maxRight(2)? → YES ✅                     │
  │  maxRight = 5 (cập nhật!)                       │
  │  result.push(5) → result = [2, 5]              │
  │                                                 │
  │  [16, 17, 4, 3, [5], 2]                        │
  │                   ↑ LEADER! (5 > 2)            │
  └─────────────────────────────────────────────────┘

  ┌─ i=3 ─────────────────────────────────────────┐
  │  arr[3] = 3                                     │
  │  3 >= maxRight(5)? → NO ❌                      │
  │  skip! (5 bên phải lớn hơn 3)                  │
  │                                                 │
  │  [16, 17, 4, [3], 5, 2]                        │
  │               ↑ NOT leader (3 < 5)             │
  └─────────────────────────────────────────────────┘

  ┌─ i=2 ─────────────────────────────────────────┐
  │  arr[2] = 4                                     │
  │  4 >= maxRight(5)? → NO ❌                      │
  │  skip! (5 bên phải lớn hơn 4)                  │
  └─────────────────────────────────────────────────┘

  ┌─ i=1 ─────────────────────────────────────────┐
  │  arr[1] = 17                                    │
  │  17 >= maxRight(5)? → YES ✅                    │
  │  maxRight = 17 (cập nhật!)                      │
  │  result.push(17) → result = [2, 5, 17]         │
  │                                                 │
  │  [16, [17], 4, 3, 5, 2]                        │
  │        ↑ LEADER! (17 > everything right)        │
  └─────────────────────────────────────────────────┘

  ┌─ i=0 ─────────────────────────────────────────┐
  │  arr[0] = 16                                    │
  │  16 >= maxRight(17)? → NO ❌                    │
  │  skip! (17 bên phải lớn hơn 16)                │
  └─────────────────────────────────────────────────┘

  result = [2, 5, 17]
  result.reverse() → [17, 5, 2] ✅

  Tổng: chỉ 5 comparison + 1 reverse = O(n)!
```

### Trace Edge Case: [5, 4, 3, 2, 1] (giảm dần)

```
  maxRight = 1, result = [1]

  i=3: 2 >= 1 → ✅ maxRight=2, result=[1, 2]
  i=2: 3 >= 2 → ✅ maxRight=3, result=[1, 2, 3]
  i=1: 4 >= 3 → ✅ maxRight=4, result=[1, 2, 3, 4]
  i=0: 5 >= 4 → ✅ maxRight=5, result=[1, 2, 3, 4, 5]

  reverse → [5, 4, 3, 2, 1]

  TẤT CẢ là leader! Vì giảm dần → mỗi phần tử >= mọi phần tử sau ✅
```

> 🎙️ *"I scan right to left, maintaining the running maximum. Any element >= current max is a leader. I collect results in reverse, then flip at the end. O(n) time, O(1) space not counting output."*

---

## O — Optimize

```
                  Time      Space     Number of passes
  ─────────────────────────────────────────────────────
  Brute Force     O(n²)     O(1)*     Check mỗi phần tử vs tất cả bên phải
  Suffix Max      O(n)      O(1)*     1 pass phải→trái + 1 reverse ✅

  * không tính output array

  Tại sao Suffix Max nhanh hơn?
    Brute force: mỗi phần tử duyệt TẤT CẢ bên phải → lặp lại!
    Suffix max:  TRACK max → check 1 LẦN là đủ!

  📊 Cải thiện:
    n=10:    Brute=55 ops      Suffix=10 ops     → 5.5x nhanh hơn
    n=100:   Brute=5,050 ops   Suffix=100 ops    → 50x nhanh hơn
    n=10000: Brute=50M ops     Suffix=10K ops    → 5000x nhanh hơn!

  ⚠️ Tại sao reverse() không ảnh hưởng complexity?
    reverse() = O(k) với k = số leaders
    k <= n → tổng vẫn O(n) + O(k) = O(n)!

  ⚠️ Có thể KHÔNG reverse?
    CÓ! Dùng unshift() thay push():
      result.unshift(arr[i])  ← thêm vào ĐẦU
    Nhưng unshift() = O(k) mỗi lần → tổng O(k²) → CHẬM HƠN!
    → push + reverse cuối tốt hơn!
```

---

## T — Test

```
Test Cases:
  [16, 17, 4, 3, 5, 2]  → [17, 5, 2]           ✅ Normal
  [1, 2, 3, 4, 5, 2]    → [5, 2]                ✅ Tăng dần + cuối nhỏ
  [5, 4, 3, 2, 1]       → [5, 4, 3, 2, 1]       ✅ Giảm dần = tất cả leader
  [1, 2, 3, 4, 5]       → [5]                    ✅ Tăng dần = chỉ cuối
  [7]                    → [7]                    ✅ 1 phần tử
  [5, 5, 5]             → [5, 5, 5]              ✅ Tất cả bằng nhau (>=)
  [1]                    → [1]                    ✅ Single element

  ⚠️ Common mistakes:
  1. Quên phần tử cuối luôn là leader
  2. Dùng > thay vì >= → bỏ sót trường hợp bằng
  3. Quên reverse() cuối → output ngược thứ tự!
  4. Bắt đầu loop từ n-1 thay vì n-2 (xử lý cuối 2 lần)
```

---

## 🗣️ Interview Script

> 🎙️ *"The brute force checks each element against all elements to its right — O(n²). The key insight is that we only need the MAXIMUM of the right side. By scanning right to left and tracking this running max, any element >= max is a leader. This gives us O(n) time with O(1) extra space."*

### Pattern Recognition

```
  SUFFIX MAXIMUM PATTERN:
  "So sánh với TẤT CẢ phần tử bên phải/trái"
  → Track running max, scan ngược chiều!

  Cấu trúc CODE:
    let maxRight = arr[n - 1];  // khởi tạo cuối
    for (i = n - 2; i >= 0; i--) {
      if (arr[i] >= maxRight) {
        maxRight = arr[i];      // cập nhật max
        // xử lý arr[i]
      }
    }

  Bài tương tự dùng CÙNG pattern:
  ┌─────────────────────────────────────────────────────────┐
  │  Leaders in Array     → Suffix Max                     │
  │  Stock Buy/Sell       → Prefix Min (track min trái→phải)│
  │  Trapping Rain Water  → Prefix Max + Suffix Max        │
  │  Next Greater Element → Monotonic Stack (advanced)     │
  │  Count Smaller After  → BIT/Merge Sort (hard)          │
  │  Product Except Self  → Prefix Product + Suffix Product│
  └─────────────────────────────────────────────────────────┘

  PREFIX vs SUFFIX:
    PREFIX = track từ TRÁI → phải (tích lũy bên trái)
    SUFFIX = track từ PHẢI → trái (tích lũy bên phải)
    → Nhiều bài cần CẢ HAI! (Trapping Rain Water, Product Except Self)
```
