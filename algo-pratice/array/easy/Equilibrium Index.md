# ⚖️ Equilibrium Index — GfG (Easy)

> 📖 Code: [Equilibrium Index.js](./Equilibrium%20Index.js)

```mermaid
graph TD
    A["⚖️ Equilibrium Index"] --> B{"Approach?"}
    B --> C["Brute O(n²): tính left+right cho từng i"]
    B --> D["Prefix Sum O(n)/O(1) ✅"]

    D --> D1["total = sum(arr)"]
    D1 --> D2["leftSum tích lũy"]
    D2 --> D3["rightSum = total - leftSum - arr[i]"]
    D3 --> D4{"leftSum === rightSum?"}
    D4 -->|Yes| D5["return i ✅"]
    D4 -->|No| D6["leftSum += arr[i], i++"]
    D6 --> D3

    style D fill:#4CAF50,color:white
    style D5 fill:#FF5722,color:white
```

```mermaid
graph LR
    subgraph "Prefix Sum + Complement"
        PS["total - left - arr[i] = right"]
    end

    subgraph "Cùng pattern"
        P1["Pivot Index #724"]
        P2["Split Array 3 Equal Sum"]
        P3["Subarray Sum = K #560"]
        P4["Product Except Self #238"]
    end
```

---

## R — Repeat & Clarify

🧠 _"rightSum = total - leftSum - arr[i]. Duyệt 1 pass, tích lũy leftSum. O(n)/O(1)!"_

> 🎙️ _"Find index i where sum of left elements = sum of right elements."_

### Clarification Questions

```
Q: arr[i] có tính vào left hay right không?
A: KHÔNG! arr[i] KHÔNG thuộc left cũng KHÔNG thuộc right!

Q: Nếu có nhiều equilibrium index thì sao?
A: Trả về FIRST index (index NHỎ NHẤT)

Q: Mảng rỗng hoặc 1 phần tử?
A: 1 phần tử → return 0 (left=0, right=0)
   Rỗng → return -1

Q: Không tìm thấy?
A: return -1

Q: Có số âm không?
A: CÓ! Mảng có thể chứa số âm → KHÔNG dùng binary search!

Q: Overflow?
A: JavaScript dùng floating point 64-bit → safe cho giá trị ≤ 2^53
```

### Tại sao bài này quan trọng?

```
  ┌──────────────────────────────────────────────────────────────┐
  │  Pattern: "Prefix Sum + Complement"                          │
  │    right = total - left - arr[i]                             │
  │    → KHÔNG CẦN tính right riêng!                            │
  │                                                              │
  │  Áp dụng:                                                    │
  │    Equilibrium Index (BÀI NÀY)                               │
  │    Pivot Index (#724 LeetCode — GIỐNG HỆT!)                 │
  │    Split Array 3 Equal Sum                                    │
  │    Subarray Sum = K (#560) — Prefix Sum + HashMap            │
  │    Product Except Self (#238) — cùng tư duy left/right       │
  │                                                              │
  │  🧠 TƯ DUY NỀN TẢNG:                                       │
  │    Khi cần biết "sum bên phải" → ĐỪNG tính riêng!            │
  │    → Dùng: right = total - left - current                    │
  │    → Biến O(n²) thành O(n)!                                  │
  └──────────────────────────────────────────────────────────────┘
```

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

### Equilibrium = "Cân bằng" = Điểm tựa

```
  Tưởng tượng mảng là 1 CÂY CÂN:

       arr[i] = điểm tựa
         ▲
  ┌──────┴──────┐
  │  leftSum    │  rightSum    │
  │  (bên trái) │  (bên phải)  │

  Equilibrium Index = vị trí đặt điểm tựa để 2 bên CÂN BẰNG!

  arr = [1, 2, 0, 3]

      i=2 (arr[2]=0):
        left  = arr[0] + arr[1] = 1 + 2 = 3
        right = arr[3] = 3
                  ▲
        ┌────────┴────────┐
        │  1 + 2 = 3     │  3          │
        │  leftSum = 3   │  rightSum=3  │ ← CÂN BẰNG! ✅

  💡 KEY: arr[i] KHÔNG nằm bên nào!
     leftSum + arr[i] + rightSum = total
```

### Công thức cốt lõi — Tại sao chỉ cần 1 phép trừ?

```
  📌 IDENTITY (đẳng thức):
     leftSum + arr[i] + rightSum = total

  → rightSum = total - leftSum - arr[i]

  🧠 Tại sao đẳng thức này LUÔN ĐÚNG?
     total = tổng TẤT CẢ phần tử
     Mọi phần tử thuộc đúng 1 trong 3 nhóm:
       1. Bên TRÁI i  → nằm trong leftSum
       2. CHÍNH NÓ i  → chính là arr[i]
       3. Bên PHẢI i  → nằm trong rightSum
     → 3 nhóm bao phủ hết → tổng 3 nhóm = total ✅

  📌 Ý NGHĨA THỰC TIỄN:
     Thay vì tính rightSum (cần iterate từ i+1 → n-1),
     ta DẪN XUẤT nó từ total - leftSum - arr[i]
     → CHỈ CẦN:
       1. total (tính 1 lần ở đầu)
       2. leftSum (tích lũy từ trái → phải)
     → KHÔNG CẦN loop thứ 2 cho rightSum!
```

### Tại sao leftSum tích lũy SAU khi check?

```
  ⚠️ ĐÂY LÀ ĐIỂM HAY NHẤT VÀ DỄ SAI NHẤT!

  Thứ tự ĐÚNG:
    1. Tính rightSum = total - leftSum - arr[i]
    2. So sánh leftSum === rightSum?
    3. leftSum += arr[i]   ← SAU KHI CHECK!

  🧠 Tại sao KHÔNG THỂ cộng TRƯỚC?

  Nếu cộng TRƯỚC (SAI ❌):
    leftSum += arr[i]     ← cộng arr[i] vào left
    rightSum = total - leftSum - arr[i]
    → leftSum đã BAO GỒM arr[i]
    → rightSum = total - (leftSum bao gồm arr[i]) - arr[i]
    → arr[i] bị TRỪ 2 LẦN! → SAI!

  Nếu cộng SAU (ĐÚNG ✅):
    rightSum = total - leftSum - arr[i]
    → leftSum CHƯA BAO GỒM arr[i] → đúng!
    → rightSum = phần còn lại bên phải → đúng!
    leftSum += arr[i]     ← cộng SAU, chuẩn bị cho i tiếp theo

  ┌──────────────────────────────────────────────────────────────┐
  │  CÂU HỎI HAY:                                               │
  │  "leftSum += arr[i] ở CUỐI loop, vậy khi i = n-1            │
  │   thì cộng vào để làm gì? Không dùng nữa mà?"              │
  │                                                              │
  │  → ĐÚNG! Lần cuối cộng xong → loop kết thúc → KHÔNG DÙNG   │
  │  → Nhưng vô hại! Và code GỌNG HƠN nếu để trong loop        │
  │  → Thay vì viết if (i < n - 1) leftSum += arr[i]            │
  │    → THỪA logic, không cần thiết!                            │
  └──────────────────────────────────────────────────────────────┘
```

### Visually — Mỗi bước leftSum thay đổi như thế nào?

```mermaid
graph LR
    subgraph "arr = [1, 2, 0, 3]  total = 6"
        I0["i=0<br>left=0 | right=5<br>0≠5 ❌"]
        I1["i=1<br>left=1 | right=3<br>1≠3 ❌"]
        I2["i=2<br>left=3 | right=3<br>3=3 ✅"]
        I3["i=3 (not reached)"]
    end

    I0 -->|"left += arr[0]=1"| I1
    I1 -->|"left += arr[1]=2"| I2
    I2 -->|"FOUND! return 2"| DONE["return 2 ✅"]

    style I2 fill:#4CAF50,color:white
    style DONE fill:#FF5722,color:white
```

---

## 🧭 Luồng Suy Nghĩ — Từ đọc đề đến solution

> 💡 Phần này dạy bạn **CÁCH TƯ DUY** để tự giải bài, không chỉ biết đáp án.
> Mỗi bước đều có **lý do tại sao**, để bạn áp dụng cho bài khó hơn.

### Bước 1: Đọc đề → Gạch chân KEYWORDS

```
  Đề bài: "Find the FIRST index where sum of elements on left
           equals sum of elements on right."

  Gạch chân:
    "first index"       → Trả về FIRST! → return ngay khi tìm thấy
    "sum of left"       → Tổng tất cả phần tử TRƯỚC i
    "sum of right"      → Tổng tất cả phần tử SAU i
    "equals"            → leftSum === rightSum

  🧠 Tự hỏi: "arr[i] thuộc bên nào?"
    → KHÔNG BÊN NÀO! Nó là "điểm tựa"!
    → left = [0, i-1], right = [i+1, n-1]

  📌 Kỹ năng chuyển giao:
    Bất cứ khi nào đề nói "sum of left/right":
    → Nghĩ ngay: Prefix Sum!
    → Hỏi: "Có thể dẫn xuất 1 bên từ bên kia không?"
```

### Bước 2: Vẽ ví dụ NHỎ bằng tay → Tìm PATTERN

```
  Lấy ví dụ NHỎ: arr = [1, 2, 0, 3]  total = 6

  i=0:  left = []           → leftSum = 0
        right = [2, 0, 3]   → rightSum = 5     0 ≠ 5 ❌

  i=1:  left = [1]          → leftSum = 1
        right = [0, 3]      → rightSum = 3     1 ≠ 3 ❌

  i=2:  left = [1, 2]       → leftSum = 3
        right = [3]          → rightSum = 3     3 = 3 ✅ → return 2!

  🧠 Quan sát PATTERN:
    1. leftSum tăng DẦN (thêm arr[i-1] mỗi bước)
    2. rightSum giảm DẦN (bớt arr[i] mỗi bước)
    3. leftSum + arr[i] + rightSum = total LUÔN ĐÚNG!
    → Biết leftSum + total → suy ra rightSum!

  📌 Kỹ năng chuyển giao:
    LUÔN vẽ ví dụ trước khi code!
    → Pattern ở đây: "left tích lũy + right = complement"
```

### Bước 3: Nghĩ ra Brute Force (Solution đầu tiên)

```
  Từ quan sát: "tính leftSum và rightSum cho MỖI i"
  → Ý tưởng đầu tiên: 2 VÒNG LẶP LỒNG NHAU!

  Với mỗi i từ 0 → n-1:
    leftSum  = sum(arr[0..i-1])    ← 1 loop: O(n)
    rightSum = sum(arr[i+1..n-1])  ← 1 loop: O(n)
    if (leftSum === rightSum) return i

  💡 Đây là Brute Force — O(n²) time, O(1) space

  📌 Kỹ năng chuyển giao:
    Brute force thường là "cho mỗi i, tính XYZ" → O(n) × O(n) = O(n²)
    → Tối ưu = tìm cách tính XYZ không cần loop riêng!
```

### Bước 4: Tự hỏi "Có thể tránh tính lại từ đầu mỗi lần?"

```
  🧠 Nhìn lại brute force:
    i=0: leftSum = 0                → tính từ đầu
    i=1: leftSum = arr[0]           → tính lại từ đầu!
    i=2: leftSum = arr[0] + arr[1]  → tính lại từ đầu!

    → Mỗi lần TÍNH LẠI TỪ ĐẦU = lãng phí!
    → leftSum(i) = leftSum(i-1) + arr[i-1]
    → TÍCH LŨY! Chỉ cần CỘNG THÊM arr[i-1]!

  💡 Insight: leftSum là RUNNING SUM (tổng tích lũy)
    → Không cần tính lại, chỉ cần cộng thêm!
    → Tương tự: rightSum = total - leftSum - arr[i]
    → KHÔNG CẦN vòng lặp riêng cho rightSum!

  📌 Đây là bước QUYẾT ĐỊNH: O(n²) → O(n)!
```

### Bước 5: Tổng kết — Cây quyết định

```mermaid
graph TD
    A["Tìm index cân bằng left/right?"] -->|Yes| B{"Cần tổng 2 bên?"}
    B --> C{"Tính riêng mỗi bên?"}
    C -->|"Naive"| D["2 loops mỗi i → O(n²)"]
    C -->|"Optimize"| E{"Tích lũy left?"}
    E -->|Yes| F{"Right từ total?"}
    F -->|Yes| G["left tích lũy + right = complement ✅"]
    G --> H["O(n) time, O(1) space"]

    style G fill:#4CAF50,color:white
    style H fill:#4CAF50,color:white
```

```
  📌 QUY TRÌNH TƯ DUY TỔNG QUÁT:

  ┌──────────────────────────────────────────────────────────────┐
  │  1. ĐỌC ĐỀ → gạch chân keywords                            │
  │     → "first index", "sum left = sum right"                  │
  │                                                              │
  │  2. VẼ VÍ DỤ NHỎ → tìm pattern                             │
  │     → Thấy: "left tích lũy, right = total - left - current" │
  │                                                              │
  │  3. BRUTE FORCE → 2 vòng lặp mỗi i                         │
  │     → O(n²) — chưa tốt                                      │
  │                                                              │
  │  4. OPTIMIZE: tích lũy + complement                          │
  │     → leftSum running sum + rightSum dẫn xuất → O(n)        │
  │                                                              │
  │  5. VERIFY → chạy lại ví dụ bằng tay                        │
  │     → Kiểm tra: leftSum cộng SAU khi check                  │
  └──────────────────────────────────────────────────────────────┘
```

---

## E — Examples

```
VÍ DỤ 1: Standard
  Input:  [1, 2, 0, 3]
  Output: 2
  Giải thích: left=[1,2]=3, right=[3]=3, eq tại i=2 ✅

VÍ DỤ 2: Không có equilibrium
  Input:  [1, 1, 1, 1]
  Output: -1
  i=0: left=0, right=3  ❌
  i=1: left=1, right=2  ❌
  i=2: left=2, right=1  ❌
  i=3: left=3, right=0  ❌

VÍ DỤ 3: Số âm
  Input:  [-7, 1, 5, 2, -4, 3, 0]
  Output: 3
  left=[-7,1,5]=-1, right=[-4,3,0]=-1 ✅

VÍ DỤ 4: 1 phần tử
  Input:  [1]
  Output: 0
  left=[], right=[]. leftSum=0=rightSum=0 ✅

VÍ DỤ 5: Equilibrium ở cuối
  Input:  [1, 3, 5, 2, 2]
  Output: 2
  left=[1,3]=4, right=[2,2]=4 ✅
```

### Minh họa trực quan — Quá trình duyệt

```
  arr = [-7, 1, 5, 2, -4, 3, 0]    total = 0

  Trạng thái ban đầu:
  ┌────┬───┬───┬───┬────┬───┬───┐
  │ -7 │ 1 │ 5 │ 2 │ -4 │ 3 │ 0 │   leftSum=0
  └────┴───┴───┴───┴────┴───┴───┘
    ↑
    i=0

  i=0: rightSum = 0 - 0 - (-7) = 7      left=0, right=7  ❌
       leftSum += -7 → leftSum = -7

  ┌────┬───┬───┬───┬────┬───┬───┐
  │ -7 │ 1 │ 5 │ 2 │ -4 │ 3 │ 0 │
  └────┴───┴───┴───┴────┴───┴───┘
    ✓   ↑
       i=1

  i=1: rightSum = 0 - (-7) - 1 = 6      left=-7, right=6  ❌
       leftSum += 1 → leftSum = -6

  i=2: rightSum = 0 - (-6) - 5 = 1      left=-6, right=1  ❌
       leftSum += 5 → leftSum = -1

  i=3: rightSum = 0 - (-1) - 2 = -1     left=-1, right=-1  ✅
  ┌────┬───┬───┬───┬────┬───┬───┐
  │ -7 │ 1 │ 5 │ 2 │ -4 │ 3 │ 0 │
  └────┴───┴───┴───┴────┴───┴───┘
   ──────────  ↑  ──────────────
    left=-1    │    right=-1
          EQUILIBRIUM!

  → return 3 ✅
```

---

## A — Approach

### Approach 1: Brute Force — O(n²)

```
  Ý tưởng: Với MỖI i, tính leftSum và rightSum riêng

  ┌─────────────────────────────────────────────────────────────┐
  │  for (i = 0 → n-1):                                        │
  │    leftSum  = sum(arr[0..i-1])    ← O(n) mỗi lần!         │
  │    rightSum = sum(arr[i+1..n-1])  ← O(n) mỗi lần!         │
  │    if (leftSum === rightSum) return i                       │
  │                                                             │
  │  → n iterations × O(n) mỗi lần = O(n²)                    │
  │                                                             │
  │  Time: O(n²)    Space: O(1)                                │
  │  → Đơn giản nhưng CHẬM!                                    │
  └─────────────────────────────────────────────────────────────┘

  Trace: arr = [1, 2, 0, 3]

    i=0: leftSum = 0
         rightSum = 2+0+3 = 5        0 ≠ 5 ❌
    i=1: leftSum = 1
         rightSum = 0+3 = 3          1 ≠ 3 ❌
    i=2: leftSum = 1+2 = 3
         rightSum = 3                 3 = 3 ✅ → return 2!

  ⚠️ VẤN ĐỀ: leftSum tại i=2 TÍNH LẠI 1+2 từ đầu!
     Lặp thừa! → Cần tích lũy!
```

### Approach 2: Prefix Array — O(n) time, O(n) space

```
  💡 Tạo mảng prefix sum trước, rồi tra cứu O(1)!

  ┌─────────────────────────────────────────────────────────────┐
  │  Bước 1: prefix[i] = arr[0] + arr[1] + ... + arr[i-1]     │
  │  Bước 2: leftSum = prefix[i]                                │
  │          rightSum = total - prefix[i] - arr[i]             │
  │                                                             │
  │  Time: O(n)    Space: O(n) ← mảng prefix!                  │
  │  → Nhanh hơn nhưng tốn space!                              │
  └─────────────────────────────────────────────────────────────┘

  arr    = [1, 2, 0, 3]    total = 6
  prefix = [0, 1, 3, 3]

  i=0: left = prefix[0] = 0,  right = 6-0-1 = 5    ❌
  i=1: left = prefix[1] = 1,  right = 6-1-2 = 3    ❌
  i=2: left = prefix[2] = 3,  right = 6-3-0 = 3    ✅ → return 2!

  ⚠️ VẤN ĐỀ: Cần O(n) space cho prefix array.
     Có thể bỏ mảng prefix không?
```

### Approach 3: Running Sum (Optimal) — O(n) time, O(1) space ✅

```
  💡 KEY INSIGHT: KHÔNG CẦN mảng prefix!
     leftSum chỉ cần 1 biến → tích lũy dần!

  ┌─────────────────────────────────────────────────────────────┐
  │  total = sum(arr)                     ← O(n) 1 lần         │
  │  leftSum = 0                                                │
  │                                                             │
  │  for i = 0 → n-1:                                          │
  │    rightSum = total - leftSum - arr[i]  ← O(1)!            │
  │    if (leftSum === rightSum) return i                       │
  │    leftSum += arr[i]                   ← tích lũy!         │
  │                                                             │
  │  return -1                                                  │
  │                                                             │
  │  Time: O(n)    Space: O(1) ← chỉ 2 biến!                  │
  └─────────────────────────────────────────────────────────────┘

  🧠 Tại sao O(1) space?
     Approach 2 cần prefix[] vì tra cứu prefix[i] ngẫu nhiên.
     Nhưng ta duyệt TUẦN TỰ từ trái → phải!
     → prefix[i] = prefix[i-1] + arr[i-1]
     → Chỉ cần GIÁ TRỊ TRƯỚC ĐÓ → 1 biến đủ!

  📌 QUYẾT ĐỊNH QUAN TRỌNG: leftSum hay rightSum tích lũy?
     → leftSum tích lũy TỰ NHIÊN HƠN (duyệt trái → phải)
     → rightSum DẪN XUẤT từ total (1 phép trừ)
     → Ngược lại cũng được, nhưng kém trực quan!
```

```mermaid
graph LR
    subgraph "Vùng đã tính"
        Z1["arr[0]"] --- Z2["..."] --- Z3["arr[i-1]"]
    end
    subgraph "Điểm tựa"
        Z4["arr[i]"]
    end
    subgraph "Vùng complement"
        Z5["arr[i+1]"] --- Z6["..."] --- Z7["arr[n-1]"]
    end

    style Z1 fill:#4CAF50,color:white
    style Z2 fill:#4CAF50,color:white
    style Z3 fill:#4CAF50,color:white
    style Z4 fill:#FF5722,color:white
    style Z5 fill:#2196F3,color:white
    style Z6 fill:#2196F3,color:white
    style Z7 fill:#2196F3,color:white
```

```
  🟩 Xanh lá  = leftSum (đã tích lũy)
  🟥 Đỏ       = arr[i] (điểm tựa, KHÔNG thuộc bên nào)
  🟦 Xanh dương = rightSum (= total - leftSum - arr[i])
```

---

## C — Code ✅

### Solution 1: Brute Force — O(n²)

```javascript
function equilibriumBrute(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    let leftSum = 0;
    for (let j = 0; j < i; j++) leftSum += arr[j];     // O(n)

    let rightSum = 0;
    for (let j = i + 1; j < n; j++) rightSum += arr[j]; // O(n)

    if (leftSum === rightSum) return i;
  }
  return -1;
}
```

```
  📝 Line-by-line:

  Line 3: for (let i = 0; i < n; i++)
    → Thử TỪNG vị trí i làm "điểm tựa"

  Line 4-5: for (let j = 0; j < i; j++) leftSum += arr[j]
    → Tính tổng tất cả phần tử TRƯỚC i
    → j chạy từ 0 đến i-1 (KHÔNG BAO GỒM i!)
    → Khi i=0: loop không chạy → leftSum = 0 ✅ (không có phần tử bên trái)

  Line 7-8: for (let j = i + 1; j < n; j++) rightSum += arr[j]
    → Tính tổng tất cả phần tử SAU i
    → j chạy từ i+1 đến n-1 (KHÔNG BAO GỒM i!)
    → Khi i=n-1: loop không chạy → rightSum = 0 ✅

  ⚠️ LÃNG PHÍ: leftSum và rightSum TÍNH LẠI TỪ ĐẦU mỗi lần!
```

### Solution 2: Prefix Array — O(n) time, O(n) space

```javascript
function equilibriumPrefix(arr) {
  const n = arr.length;
  const total = arr.reduce((a, b) => a + b, 0);

  // Xây prefix sum
  const prefix = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + arr[i];
  }

  for (let i = 0; i < n; i++) {
    const leftSum = prefix[i];
    const rightSum = total - prefix[i + 1]; // prefix[i+1] = left + arr[i]
    if (leftSum === rightSum) return i;
  }
  return -1;
}
```

```
  📝 Line-by-line:

  Line 6: prefix = [0, 1, 3, 3, 6]  (cho arr=[1,2,0,3])
    → prefix[i] = sum(arr[0..i-1])
    → prefix[0] = 0 (tổng rỗng)
    → prefix[n] = total

  Line 12: leftSum = prefix[i]
    → Tổng tất cả phần tử trước i

  Line 13: rightSum = total - prefix[i + 1]
    → prefix[i+1] = leftSum + arr[i]
    → rightSum = total - leftSum - arr[i] ← cùng công thức!

  ⚠️ Tốn O(n) space cho prefix[]. Có thể bỏ!
```

### Solution 3: Running Sum — O(n)/O(1) ✅ (Optimal)

```javascript
function equilibriumIndex(arr) {
  const total = arr.reduce((a, b) => a + b, 0);
  let leftSum = 0;

  for (let i = 0; i < arr.length; i++) {
    const rightSum = total - leftSum - arr[i];
    if (leftSum === rightSum) return i;
    leftSum += arr[i]; // ⚠️ cộng SAU khi check!
  }

  return -1;
}
```

```
  📝 Line-by-line:

  Line 2: const total = arr.reduce((a, b) => a + b, 0)
    → Tính tổng toàn bộ mảng 1 LẦN DUY NHẤT
    → reduce: accumulator a bắt đầu từ 0, cộng dần b
    → O(n)

    🧠 Tại sao cần total?
       → Để DẪN XUẤT rightSum = total - leftSum - arr[i]
       → Không có total → phải tính rightSum riêng → O(n) mỗi lần!

  Line 3: let leftSum = 0
    → Ban đầu: KHÔNG có phần tử bên trái → leftSum = 0
    → Ý nghĩa: "tổng arr[0..i-1]" khi i=0 = tổng rỗng = 0

  Line 5: for (let i = 0; i < arr.length; i++)
    → Duyệt TUẦN TỰ từ trái → phải
    → Mỗi bước: kiểm tra i có phải equilibrium không

  Line 6: const rightSum = total - leftSum - arr[i]
    → ĐÂY là DÒNG QUAN TRỌNG NHẤT!
    → "Tổng bên phải = tổng tất cả - tổng bên trái - chính nó"
    → O(1) cho mỗi i! (thay vì O(n) trong brute force)

    📌 CHỨNG MINH:
       total = leftSum + arr[i] + rightSum   (đẳng thức)
       → rightSum = total - leftSum - arr[i]  (chuyển vế)

  Line 7: if (leftSum === rightSum) return i
    → Tìm thấy equilibrium? → return NGAY!
    → "First equilibrium index" → KHÔNG cần tìm tiếp

  Line 8: leftSum += arr[i]   ← ⚠️ SAU KHI CHECK!
    → Chuẩn bị leftSum cho bước tiếp theo
    → Tại i tiếp theo: leftSum sẽ BÀO GỒM arr[i] hiện tại
    → PHẢI SAU check! (lý do xem phần "bản chất" ở trên)

    🧠 Edge cases tự đúng:
       i=0:   leftSum=0 trước check → "không có gì bên trái" ✅
       i=n-1: rightSum = total - leftSum - arr[n-1]
              = tổng tất cả - tổng (n-1 phần tử đầu) - phần tử cuối
              = 0 → "không có gì bên phải" ✅

  Line 10: return -1
    → Duyệt hết mà KHÔNG TÌM THẤY → trả -1
```

### Trace CHI TIẾT: [-7, 1, 5, 2, -4, 3, 0]

```
  total = -7 + 1 + 5 + 2 + (-4) + 3 + 0 = 0
  leftSum = 0

  i=0 (arr[i]=-7):
    rightSum = 0 - 0 - (-7) = 7
    leftSum === rightSum?  0 === 7?  ❌
    leftSum += -7  →  leftSum = -7

  i=1 (arr[i]=1):
    rightSum = 0 - (-7) - 1 = 6
    leftSum === rightSum?  -7 === 6?  ❌
    leftSum += 1  →  leftSum = -6

  i=2 (arr[i]=5):
    rightSum = 0 - (-6) - 5 = 1
    leftSum === rightSum?  -6 === 1?  ❌
    leftSum += 5  →  leftSum = -1

  i=3 (arr[i]=2):
    rightSum = 0 - (-1) - 2 = -1
    leftSum === rightSum?  -1 === -1?  ✅ → return 3!

  ┌─────────────────────────────────────────────────────────┐
  │  Verification:                                           │
  │  left  = arr[0]+arr[1]+arr[2] = -7+1+5 = -1            │
  │  right = arr[4]+arr[5]+arr[6] = -4+3+0 = -1            │
  │  left === right → -1 === -1 ✅                          │
  └─────────────────────────────────────────────────────────┘
```

### Trace cho edge case: [1] (1 phần tử)

```
  total = 1
  leftSum = 0

  i=0 (arr[i]=1):
    rightSum = 1 - 0 - 1 = 0
    leftSum === rightSum?  0 === 0?  ✅ → return 0!

  🧠 Giải thích:
    → Không có phần tử bên trái → leftSum = 0
    → Không có phần tử bên phải → rightSum = 0
    → 0 = 0 → đúng! Phần tử duy nhất LUÔN là equilibrium!
```

### Trace cho edge case: [1, 1, 1, 1] (không có equilibrium)

```
  total = 4
  leftSum = 0

  i=0: rightSum = 4 - 0 - 1 = 3     0 ≠ 3  ❌  leftSum → 1
  i=1: rightSum = 4 - 1 - 1 = 2     1 ≠ 2  ❌  leftSum → 2
  i=2: rightSum = 4 - 2 - 1 = 1     2 ≠ 1  ❌  leftSum → 3
  i=3: rightSum = 4 - 3 - 1 = 0     3 ≠ 0  ❌  leftSum → 4

  → return -1

  🧠 Nhận xét:
    leftSum tăng đều: 0, 1, 2, 3
    rightSum giảm đều: 3, 2, 1, 0
    → leftSum và rightSum "đi ngược chiều" nhưng KHÔNG BAO GIỜ gặp nhau!
    → Vì tất cả giá trị bằng nhau VÀ n chẵn → không có trung điểm
```

### Trace cho edge case: [0, 0, 0] (toàn zeros)

```
  total = 0
  leftSum = 0

  i=0: rightSum = 0 - 0 - 0 = 0     0 === 0  ✅ → return 0!

  🧠 Mảng toàn zeros → MỌI index đều là equilibrium!
     Nhưng trả về FIRST → return 0
```

---

## ❌ Common Mistakes — Lỗi thường gặp

```mermaid
graph TD
    START["🚨 Common Mistakes"] --> M1["Mistake #1\nleftSum += arr[i]\nTRƯỚC check"]
    START --> M2["Mistake #2\nQuên return -1"]
    START --> M3["Mistake #3\nKhông return FIRST"]
    START --> M4["Mistake #4\nSo sánh float"]
    START --> M5["Mistake #5\nreduce không có\ninitial value"]

    M1 --> M1a["❌ arr[i] bị trừ 2 lần!"]
    M1 --> M1b["✅ Cộng SAU check"]

    M2 --> M2a["❌ return undefined"]
    M2 --> M2b["✅ return -1"]

    M3 --> M3a["❌ Tìm tất cả rồi\nreturn results[0]"]
    M3 --> M3b["✅ return i ngay\nkhi tìm thấy"]

    M4 --> M4a["❌ 0.1+0.2 ≠ 0.3"]
    M4 --> M4b["✅ Math.abs < 1e-9\n(nếu có float)"]

    M5 --> M5a["❌ TypeError\nkhi arr rỗng"]
    M5 --> M5b["✅ reduce(..., 0)"]

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

### Mistake 1: leftSum += arr[i] TRƯỚC khi check

```javascript
// ❌ SAI: leftSum bao gồm arr[i]!
for (let i = 0; i < arr.length; i++) {
  leftSum += arr[i];    // ← TRƯỚC! arr[i] vào leftSum!
  const rightSum = total - leftSum - arr[i];
  // → rightSum = total - (leftSum + arr[i]) - arr[i]
  // → arr[i] bị trừ 2 LẦN!
  if (leftSum === rightSum) return i;
}

// ✅ ĐÚNG: Cộng SAU
for (let i = 0; i < arr.length; i++) {
  const rightSum = total - leftSum - arr[i];
  if (leftSum === rightSum) return i;
  leftSum += arr[i];    // ← SAU!
}
```

```
  🧠 Ví dụ cụ thể cho sai lầm này:
    arr = [1, 2, 0, 3]  total = 6

    SAI (cộng trước):
      i=2: leftSum += arr[2] → leftSum = 1+2+0 = 3
           rightSum = 6 - 3 - 0 = 3     3 === 3? ✅
           → Đáp án ĐÚNG TÌNH CỜ! Vì arr[2] = 0!

      Nhưng thử arr = [2, 1, 1, 2]:  total = 6
      i=1: leftSum += arr[1] → leftSum = 2+1 = 3
           rightSum = 6 - 3 - 1 = 2     3 ≠ 2  ← SAI!
           → Đáng lẽ: left=2, right=3 → 2 ≠ 3

    → Cộng trước CHỈ đúng khi arr[i] = 0!
    → Với các giá trị khác → SAI HOÀN TOÀN!
```

### Mistake 2: Quên return -1

```javascript
// ❌ SAI: Không return -1 khi không tìm thấy
function equilibrium(arr) {
  const total = arr.reduce((a, b) => a + b, 0);
  let leftSum = 0;
  for (let i = 0; i < arr.length; i++) {
    const rightSum = total - leftSum - arr[i];
    if (leftSum === rightSum) return i;
    leftSum += arr[i];
  }
  // ← không return gì → return undefined!
}

// ✅ ĐÚNG: return -1 ở cuối
// ...
return -1;
```

```
  🧠 Tại sao quan trọng?
    → Khi KHÔNG CÓ equilibrium index
    → Hàm phải trả -1 (hoặc theo spec)
    → undefined gây bug ở caller!
```

### Mistake 3: Quên "return FIRST"

```javascript
// ❌ SAI: Thu thập TẤT CẢ rồi return cuối
function equilibrium(arr) {
  const results = [];
  // ... tìm tất cả equilibrium indices
  return results[0]; // ← phức tạp thừa!
}

// ✅ ĐÚNG: return NGAY khi tìm thấy
if (leftSum === rightSum) return i; // ← return FIRST!
```

```
  🧠 Đề nói "return FIRST equilibrium index"
    → return NGAY khi tìm thấy, KHÔNG tiếp tục!
    → Duyệt từ trái → phải → index đầu tiên tìm được = nhỏ nhất ✅
```

### Mistake 4: So sánh float

```javascript
// ⚠️ CẨN THẬN: Nếu arr có float
arr = [0.1, 0.2, 0.3]
// 0.1 + 0.2 = 0.30000000000000004 ≠ 0.3!

// Giải pháp (nếu có float):
if (Math.abs(leftSum - rightSum) < 1e-9) return i;
```

```
  🧠 Bài GfG: integers → KHÔNG CẦN lo!
    Nhưng nếu interviewer hỏi "Nếu có float thì sao?"
    → Biết dùng epsilon comparison = điểm cộng!
```

### Mistake 5: Dùng reduce không có initial value

```javascript
// ❌ SAI: reduce không có giá trị khởi tạo
const total = arr.reduce((a, b) => a + b);
// → Nếu arr = [] → TypeError: Reduce of empty array!

// ✅ ĐÚNG: luôn có initial value 0
const total = arr.reduce((a, b) => a + b, 0);
// → arr = [] → total = 0 → loop không chạy → return -1 ✅
```

---

## 📐 Invariant — Chứng minh tính đúng đắn

```
  📐 INVARIANT (bất biến) cho Running Sum approach:

  Tại ĐẦU mỗi iteration i:
    leftSum = Σ arr[j] cho j = 0, 1, ..., i-1
    (tổng tất cả phần tử TRƯỚC index i)

  Chứng minh bằng QUY NẠP:
  ┌──────────────────────────────────────────────────────────────────┐
  │  Base case: i = 0                                               │
  │    leftSum = 0 (khởi tạo)                                       │
  │    Σ arr[j] cho j = 0..(-1) = tổng rỗng = 0                    │
  │    → leftSum = 0 = Σ(empty) ✅                                  │
  │                                                                 │
  │  Inductive step: giả sử đúng tại i, chứng minh tại i+1         │
  │                                                                 │
  │    Tại đầu iteration i:                                         │
  │      leftSum = Σ arr[j] cho j=0..i-1        (giả thiết quy nạp) │
  │                                                                 │
  │    Cuối iteration i (sau dòng leftSum += arr[i]):               │
  │      leftSum = Σ arr[j] cho j=0..i-1 + arr[i]                  │
  │             = Σ arr[j] cho j=0..i                               │
  │                                                                 │
  │    Tại đầu iteration i+1:                                       │
  │      leftSum = Σ arr[j] cho j=0..i = Σ arr[j] cho j=0..(i+1)-1 │
  │    → Đúng tại i+1! ✅                                           │
  └──────────────────────────────────────────────────────────────────┘

  📐 Từ Invariant → CHỨNG MINH thuật toán ĐÚNG:

  Tại mỗi iteration i, khi check leftSum === rightSum:
    leftSum = Σ arr[j] cho j=0..i-1              (invariant)
    rightSum = total - leftSum - arr[i]
            = Σ arr[j] cho j=0..n-1 - Σ arr[j] cho j=0..i-1 - arr[i]
            = Σ arr[j] cho j=i+1..n-1            (đại số)

  → leftSum chính xác = tổng bên trái i
  → rightSum chính xác = tổng bên phải i
  → So sánh leftSum === rightSum là ĐÚNG ĐẮN! ∎

  📐 Completeness — Không bỏ sót:
    Thuật toán duyệt TẤT CẢ i từ 0 → n-1
    → Kiểm tra MỌI vị trí có thể
    → Nếu tồn tại equilibrium → CHẮC CHẮN tìm thấy
    → return FIRST (duyệt trái→phải) → đúng yêu cầu "first index"
```

```mermaid
graph TD
    subgraph INVARIANT["📐 Invariant Proof"]
        BC["Base: i=0\nleftSum=0=Σ(empty) ✅"] --> IS["Inductive Step"]
        IS --> IS1["Giả sử đúng tại i:\nleftSum = Σ arr[0..i-1]"]
        IS1 --> IS2["Cuối iteration i:\nleftSum += arr[i]"]
        IS2 --> IS3["Đầu iteration i+1:\nleftSum = Σ arr[0..i] ✅"]
    end

    subgraph CORRECT["✅ Correctness"]
        C1["leftSum = exact left sum"]
        C2["rightSum = total - left - arr[i]\n= exact right sum"]
        C1 --> C3["leftSum === rightSum\n⟺ equilibrium tại i"]
        C2 --> C3
    end

    IS3 --> C1

    style BC fill:#E3F2FD,stroke:#1976D2
    style IS3 fill:#4CAF50,color:white
    style C3 fill:#FF5722,color:white
```

---

## O — Optimize

```
                     Time    Space    Passes    Khi nào dùng?
  ──────────────────────────────────────────────────────────────
  Brute Force        O(n²)   O(1)     1        Chỉ để giải thích
  Prefix Array       O(n)    O(n)     2        Khi cần query nhiều i
  Running Sum ✅     O(n)    O(1)     2*       Interview / Production

  * 2 passes: 1 cho total, 1 cho duyệt. Nhưng chỉ 2 lần duyệt O(n)!
```

### Có thể tối ưu hơn nữa không?

```
  Thời gian: KHÔNG! O(n) đã là optimal
    → Bắt buộc phải đọc MỌI phần tử ít nhất 1 lần
    → Chứng minh: Nếu skip arr[k] → không biết total đúng
      → Không thể tính rightSum cho mọi i → SAI!

  Space: KHÔNG! O(1) đã là optimal
    → Chỉ dùng 2 biến: total và leftSum

  Passes: CÓ THỂ giảm từ 2 → 1?
    → KHÔNG! Cần total TRƯỚC khi duyệt
    → Không biết total → không dẫn xuất được rightSum
    → 2 passes là tối thiểu cho approach này
```

### So sánh 3 approaches

```mermaid
graph TD
    subgraph "Brute Force O(n²)"
        B1["Mỗi i: 2 loops O(n)"]
        B2["n × O(n) = O(n²)"]
    end

    subgraph "Prefix Array O(n)"
        P1["Build prefix: O(n)"]
        P2["Query mỗi i: O(1)"]
        P3["Space: O(n) cho prefix[]"]
    end

    subgraph "Running Sum O(n) ✅"
        R1["total: O(n)"]
        R2["leftSum tích lũy: O(1)/step"]
        R3["Space: O(1) — 2 biến!"]
    end

    style R1 fill:#4CAF50,color:white
    style R2 fill:#4CAF50,color:white
    style R3 fill:#4CAF50,color:white
```

### Khi nào dùng Prefix Array thay Running Sum?

```
  ┌──────────────────────────────────────────────────────────────┐
  │  Running Sum (BÀI NÀY): duyệt 1 chiều, kiểm tra từng i    │
  │    → Chỉ cần leftSum tại bước hiện tại → 1 biến đủ!       │
  │                                                              │
  │  Prefix Array: khi cần query NGẪU NHIÊN                     │
  │    → "Tổng từ index L đến R?" → O(1) nếu có prefix!        │
  │    → Ví dụ: Subarray Sum = K (#560)                         │
  │    → Cần prefix[] vì query nhiều khoảng (L, R) khác nhau   │
  │                                                              │
  │  📌 QUY TẮC:                                                 │
  │    Duyệt tuần tự + chỉ cần "tổng đến hiện tại"?            │
  │    → Running Sum (1 biến)                                    │
  │    Cần tra cứu tổng bất kỳ đoạn [L..R]?                    │
  │    → Prefix Array (mảng)                                     │
  └──────────────────────────────────────────────────────────────┘
```

### Complexity chính xác — Đếm operations

```
  Running Sum approach:
    Pass 1 (tính total):
      n phép cộng (reduce)                    → n operations

    Pass 2 (duyệt + check):
      n phép trừ (total - leftSum - arr[i])   → 2n operations
      n phép so sánh (leftSum === rightSum)   → n operations
      ≤ n phép cộng (leftSum += arr[i])       → ≤ n operations

    TỔNG: n + 2n + n + n = 5n operations
    → O(n) với constant factor ≈ 5

  Brute Force:
    Mỗi i: 2 inner loops, mỗi loop tối đa n phần tử
    WORST: Σ(i=0..n-1) [i + (n-1-i)] = n(n-1)
    → O(n²) với constant factor ≈ 1 (nhưng quadratic!)

  📊 So sánh THỰC TẾ (n = 1,000,000):
    Running Sum: 5 × 10⁶ operations ≈ 5ms
    Brute Force: 10¹² operations ≈ 17 PHÚT! 😰
    → Running Sum nhanh hơn ~200,000×!

  📊 Memory THỰC TẾ (JavaScript V8):
    Running Sum: 2 biến number (16 bytes) → ~16 bytes
    Prefix Array: n+1 numbers (8 bytes each) → ~8MB cho n=10⁶
    → Running Sum tiết kiệm 500,000× memory!
```

### ❓ "Tại sao không Sort?"

```
  🧠 "Sort rồi check adjacent?"

  ❌ KHÔNG ÁP DỤNG cho bài này! Lý do:

  ┌──────────────────────────────────────────────────────────────┐
  │  Equilibrium phụ thuộc VỊ TRÍ, không chỉ GIÁ TRỊ!         │
  │                                                              │
  │  Ví dụ: arr = [1, 2, 0, 3]                                   │
  │  Sort → [0, 1, 2, 3]                                         │
  │  → Vị trí CŨ bị MẤT! Không biết equilibrium ở đâu!         │
  │                                                              │
  │  Equilibrium = "tổng BÊN TRÁI = tổng BÊN PHẢI"             │
  │  → BÊN TRÁI/PHẢI phụ thuộc THỨ TỰ NGUYÊN THỦY!            │
  │  → Sort thay đổi thứ tự → BÀI TOÁN ĐỔI NGHĨA!            │
  │                                                              │
  │  📌 Sort CHỈ hợp lý khi:                                     │
  │  1. Bài không phụ thuộc vị trí (e.g. Two Sum with values)   │
  │  2. Cần tìm closest pair / kth smallest                      │
  │  3. Đề cho phép sắp xếp lại mảng                            │
  │                                                              │
  │  → Bài này: VỊ TRÍ là THAM SỐ CHÍNH → KHÔNG SORT!         │
  └──────────────────────────────────────────────────────────────┘
```

---

## T — Test

```
Test Cases:
  [1, 2, 0, 3]                → 2      ✅ Standard
  [1, 1, 1, 1]                → -1     ✅ No equilibrium
  [-7, 1, 5, 2, -4, 3, 0]     → 3      ✅ Negative numbers
  [1]                          → 0      ✅ Single element
  [1, 3, 5, 2, 2]             → 2      ✅ Equilibrium in middle
  [0, 0, 0]                   → 0      ✅ All zeros (first index)
  [10, -10, 10, -10, 10]      → 4      ✅ Alternating +/-
  [2, 4, 2]                   → 1      ✅ Symmetric array
  [1, 2, 3]                   → -1     ✅ No equilibrium
  [0]                          → 0      ✅ Single zero
```

### Edge Cases giải thích

```
  ┌────────────────────────────────────────────────────────────────┐
  │  Single element:  leftSum=0, rightSum=0 → 0=0 → return 0     │
  │                   → Phần tử duy nhất LUÔN là equilibrium!     │
  │                                                                │
  │  All zeros:       Mọi index đều equilibrium!                   │
  │                   → return 0 (FIRST index)                     │
  │                                                                │
  │  Negative nums:   Công thức vẫn đúng!                          │
  │                   total có thể âm, 0, hoặc dương               │
  │                   → KHÔNG ảnh hưởng logic!                     │
  │                                                                │
  │  Equilibrium ở    i=0: leftSum=0, rightSum = total - arr[0]    │
  │  đầu hoặc cuối:  i=n-1: rightSum=0, leftSum = total - arr[n-1]│
  │                   → Code xử lý TỰ ĐỘNG, không cần đặc biệt!  │
  │                                                                │
  │  No equilibrium:  Duyệt hết → return -1                       │
  │                   → Loop kết thúc tự nhiên                     │
  └────────────────────────────────────────────────────────────────┘
```

---

## 🗣️ Interview Script

### 🎙️ Think Out Loud — Mô phỏng phỏng vấn thực

```
  👤 Interviewer: "Find the first equilibrium index — where the sum
                   of elements on the left equals the sum on the right."

  🧑 You: "Let me clarify — the element at index i itself is NOT
   included in either the left or right sum, correct? And if no
   equilibrium exists, I return -1?"

  👤 Interviewer: "Correct."

  🧑 You: "My brute force would be: for each index i, compute
   leftSum by iterating [0, i-1] and rightSum by iterating [i+1, n-1].
   That's O(n) per index, O(n²) total.

   But I notice that leftSum only changes by arr[i-1] each step —
   it's a running sum! And rightSum can be DERIVED:
   rightSum = total - leftSum - arr[i].

   So my optimized approach:
   1. Compute total sum in one pass.
   2. Iterate left to right, maintaining a running leftSum.
   3. At each index, rightSum = total - leftSum - arr[i].
   4. If leftSum equals rightSum, return i.
   5. Then add arr[i] to leftSum for the next iteration.

   Key detail: I add arr[i] to leftSum AFTER the check, because
   arr[i] shouldn't be part of either sum.

   O(n) time, O(1) space."

  👤 Interviewer: "Why add arr[i] to leftSum after the check?"

  🧑 You: "At index i, leftSum should represent sum of arr[0..i-1] —
   elements strictly BEFORE i. If I added arr[i] beforehand, leftSum
   would include the pivot element, and rightSum would be computed
   incorrectly — arr[i] would effectively be subtracted twice from
   the total."

  👤 Interviewer: "What about edge cases?"

  🧑 You: "For a single element, leftSum=0 and rightSum=0, so it's
   always an equilibrium. For all zeros, every index works, but I
   return the first (index 0). Negative numbers work fine since the
   formula is algebraic — no absolute values involved."
```

### Pattern & Liên kết

```
  PREFIX SUM + COMPLEMENT pattern!

  leftSum  = tổng tích lũy từ trái
  rightSum = total - leftSum - arr[i]  (COMPLEMENT!)

  Bài tương tự dùng CÙNG pattern:
    Pivot Index (#724)     → GIỐNG HỆT bài này!
    Split Array 3 Equal    → 2 điểm chia thay vì 1
    Subarray Sum = K #560  → prefix + HashMap
    Product Except Self    → left product × right product

  → TẤT CẢ dùng "tổng/tích tích lũy + dẫn xuất phần còn lại"!
```

### Pivot Index #724 — So sánh

```
  🧠 Pivot Index #724 (LeetCode) = GIỐNG HỆT Equilibrium Index!

  Khác biệt DUY NHẤT:
  ┌──────────────────────────────────────────────────────────────┐
  │  GfG Equilibrium:  return -1 nếu không tìm thấy            │
  │  LeetCode Pivot:   return -1 nếu không tìm thấy            │
  │                                                              │
  │  → CÙNG ĐỀ, CÙNG CODE, CÙNG LOGIC!                        │
  │  → Giải 1 bài = giải được cả 2!                             │
  └──────────────────────────────────────────────────────────────┘

  📌 Interview tip:
  Nếu interviewer hỏi "Pivot Index" → viết ĐÚNG code equilibrium!
  Nói: "This is also known as the Equilibrium Index problem."
  → Chứng tỏ bạn hiểu bài ở mức khái niệm, không chỉ thuộc đề!
```

---

## 🔬 Deep Dive — Giải thích CHI TIẾT từng dòng code

> 💡 Phần này phân tích **từng dòng code** để bạn hiểu **TẠI SAO** viết như vậy,
> không chỉ **viết gì**. Mỗi dòng đều có lý do thiết kế.

```mermaid
flowchart TD
    subgraph INIT["🔧 Khởi tạo"]
        A["const total = arr.reduce((a,b) => a+b, 0)"] --> B["let leftSum = 0"]
    end

    subgraph LOOP["🔄 Vòng lặp: for i = 0 → n-1"]
        C["const rightSum = total - leftSum - arr[i]"] --> D{"leftSum === rightSum?"}
        D -->|"Yes ✅"| E["return i\nFOUND!"]
        D -->|"No ❌"| F["leftSum += arr[i]"]
        F --> G{"i < arr.length?"}
        G -->|"Yes"| C
    end

    subgraph RESULT["📤 Kết quả"]
        H["return -1\nNOT FOUND"]
    end

    B --> C
    G -->|"No — hết mảng"| H

    style E fill:#4CAF50,color:white,stroke:#388E3C
    style H fill:#F44336,color:white,stroke:#D32F2F
    style INIT fill:#E3F2FD,stroke:#1976D2
    style LOOP fill:#FFF3E0,stroke:#F57C00
    style RESULT fill:#FFEBEE,stroke:#F44336
```

```mermaid
flowchart LR
    subgraph "📊 Trạng thái biến qua từng vòng — arr=[1,2,0,3] total=6"
        direction LR
        S0["🏁 Start\ntotal=6\nleftSum=0"] --> S1["i=0: arr[0]=1\nright=6-0-1=5\n0≠5 ❌\nleft=0+1=1"]
        S1 --> S2["i=1: arr[1]=2\nright=6-1-2=3\n1≠3 ❌\nleft=1+2=3"]
        S2 --> S3["i=2: arr[2]=0\nright=6-3-0=3\n3=3 ✅"]
        S3 --> S4["🏆 return 2"]
    end

    style S0 fill:#E3F2FD,stroke:#1976D2
    style S3 fill:#4CAF50,color:white
    style S4 fill:#FF5722,color:white
```

### Code đầy đủ với annotation

```javascript
function equilibriumIndex(arr) {
  // ═══════════════════════════════════════════════════════════════
  // DÒNG 1: Tính TỔNG toàn bộ mảng — nền tảng của complement
  // ═══════════════════════════════════════════════════════════════
  //
  // TẠI SAO cần total?
  //   → Để DẪN XUẤT rightSum từ total - leftSum - arr[i]
  //   → Không có total → phải tính rightSum riêng → O(n) mỗi lần!
  //   → Với total → rightSum = O(1) mỗi lần!
  //
  // TẠI SAO dùng reduce thay vì for loop?
  //   → Ngắn gọn hơn, idiomatic JavaScript
  //   → reduce((a, b) => a + b, 0):
  //     a = accumulator (bắt đầu từ 0)
  //     b = phần tử hiện tại
  //     Mỗi bước: a = a + b → tích lũy tổng
  //
  // TẠI SAO initial value là 0?
  //   → Nếu KHÔNG có 0: arr=[] → TypeError!
  //   → Với 0: arr=[] → reduce trả 0 → total=0 → loop không chạy → -1 ✅
  //
  // TRADE-OFF:
  //   ✅ reduce: ngắn, rõ ý đồ "tính tổng"
  //   ⚠️ for loop: debug dễ hơn (nhìn được từng bước)
  //   📌 Interview: cả 2 cách đều OK, chọn cái nào thoải mái
  //
  const total = arr.reduce((a, b) => a + b, 0);

  // ═══════════════════════════════════════════════════════════════
  // DÒNG 2: Khởi tạo leftSum = 0
  // ═══════════════════════════════════════════════════════════════
  //
  // TẠI SAO let mà không phải const?
  //   → leftSum sẽ THAY ĐỔI (tích lũy) trong vòng lặp
  //   → const cho giá trị KHÔNG ĐỔI, let cho giá trị THAY ĐỔI
  //
  // TẠI SAO = 0?
  //   → Khi i=0: không có phần tử nào bên trái
  //   → "Tổng rỗng" = 0 (identity element của phép cộng)
  //   → Mathematically: Σ(empty set) = 0
  //
  // Ý NGHĨA: leftSum = sum(arr[0..i-1])
  //   → Tại mỗi bước i, leftSum chứa tổng tất cả phần tử TRƯỚC i
  //   → Cập nhật: leftSum += arr[i] SAU khi check (chuẩn bị cho i+1)
  //
  let leftSum = 0;

  // ═══════════════════════════════════════════════════════════════
  // DÒNG 3-8: Vòng lặp chính — Duyệt và kiểm tra từng vị trí
  // ═══════════════════════════════════════════════════════════════
  //
  // TẠI SAO duyệt từ TRÁI → PHẢI?
  //   → leftSum tích lũy TỰ NHIÊN theo chiều này
  //   → Nếu duyệt phải → trái: rightSum tích lũy, leftSum dẫn xuất
  //     (cũng được, nhưng kém trực quan)
  //
  // TẠI SAO duyệt TẤT CẢ phần tử?
  //   → Bất kỳ vị trí nào cũng CÓ THỂ là equilibrium
  //   → Không thể skip (không có monotonicity để binary search!)
  //   → Vì mảng có thể chứa SỐ ÂM → leftSum có thể giảm!
  //
  for (let i = 0; i < arr.length; i++) {

    // ─────────────────────────────────────────────────────────────
    // DÒNG 4: Tính rightSum bằng COMPLEMENT — DÒNG QUAN TRỌNG NHẤT
    // ─────────────────────────────────────────────────────────────
    //
    // CÔNG THỨC: rightSum = total - leftSum - arr[i]
    //
    // CHỨNG MINH:
    //   total = sum(arr[0..n-1])
    //         = sum(arr[0..i-1]) + arr[i] + sum(arr[i+1..n-1])
    //         = leftSum + arr[i] + rightSum
    //   → rightSum = total - leftSum - arr[i]   (chuyển vế)
    //
    // TẠI SAO O(1)?
    //   → Chỉ 2 phép trừ! Không cần loop!
    //   → Brute force cần O(n) cho mỗi rightSum → đây là cải tiến chính!
    //
    // TẠI SAO thứ tự: total - leftSum - arr[i]?
    //   → Toán học: thứ tự trừ không quan trọng
    //   → Nhưng đọc code: "từ total, trừ đi left, trừ đi current"
    //     → Rõ ý đồ "phần còn lại bên phải"
    //
    const rightSum = total - leftSum - arr[i];

    // ─────────────────────────────────────────────────────────────
    // DÒNG 5: So sánh và return nếu cân bằng
    // ─────────────────────────────────────────────────────────────
    //
    // TẠI SAO === thay vì ==?
    //   → === là strict equality (so sánh CÙNG kiểu + cùng giá trị)
    //   → == có type coercion → có thể gây bug khó thấy
    //   → Best practice: LUÔN dùng ===
    //
    // TẠI SAO return NGAY (early return)?
    //   → Đề yêu cầu "FIRST equilibrium index"
    //   → Duyệt trái → phải → index đầu tiên tìm được = NHỎ NHẤT ✅
    //   → Không cần tìm tiếp! Tiết kiệm thời gian!
    //
    // ĐẶC BIỆT: leftSum < 0 VÀ rightSum < 0 vẫn có thể bằng nhau!
    //   → Ví dụ: [-7, 1, 5, 2, -4, 3, 0] → left=-1, right=-1 ✅
    //   → Code KHÔNG cần xử lý đặc biệt cho số âm!
    //
    if (leftSum === rightSum) return i;

    // ─────────────────────────────────────────────────────────────
    // DÒNG 6: Update leftSum — PHẢI Ở SAU CHECK!
    // ─────────────────────────────────────────────────────────────
    //
    // CÂU HỎI QUAN TRỌNG: Tại sao KHÔNG đặt ở đầu loop?
    //
    // Nếu ĐẶT Ở ĐẦU (❌ SAI):
    //   leftSum += arr[i];    ← arr[i] nằm trong leftSum!
    //   rightSum = total - leftSum - arr[i]
    //           = total - (leftSum_cũ + arr[i]) - arr[i]
    //           = total - leftSum_cũ - 2×arr[i]  ← arr[i] bị TRỪ 2 LẦN!
    //
    // ĐẶT Ở CUỐI (✅ ĐÚNG):
    //   rightSum = total - leftSum - arr[i]  ← leftSum CHƯA có arr[i]
    //   leftSum += arr[i]                    ← SAU check, chuẩn bị cho i+1
    //
    // INSIGHT SÂU: Thứ tự thao tác trong loop:
    //   1. DÙNG leftSum hiện tại → tính rightSum
    //   2. KIỂM TRA cân bằng
    //   3. CẬP NHẬT leftSum cho bước tiếp theo
    //   → Pattern "use-then-update" (dùng trước, cập nhật sau)
    //
    // TƯƠNG TỰ: Fibonacci, Running Max, Sliding Window
    //   → Tất cả đều "dùng state hiện tại" rồi mới "cập nhật state"
    //
    leftSum += arr[i];
  }

  // ═══════════════════════════════════════════════════════════════
  // DÒNG 9: Không tìm thấy → return -1
  // ═══════════════════════════════════════════════════════════════
  //
  // TẠI SAO -1 mà không phải null/undefined/false?
  //   → -1 là convention cho "index not found" trong nhiều ngôn ngữ
  //   → Giống: indexOf, findIndex đều trả -1
  //   → -1 không phải valid index → dễ phân biệt
  //
  // Khi nào đến dòng này?
  //   → Duyệt HẾT mảng mà KHÔNG có i nào leftSum === rightSum
  //   → Ví dụ: [1, 1, 1, 1] → left và right không bao giờ gặp
  //
  return -1;
}
```

### Trace CHI TIẾT dạng bảng — [1, 3, 5, 2, 2]

```
  total = 1 + 3 + 5 + 2 + 2 = 13
  leftSum = 0

  ┌───────┬─────────┬──────────────────────┬───────────────┬────────────┬─────────────┐
  │ Vòng  │ arr[i]  │  rightSum            │ leftSum ===   │ Kết quả   │  leftSum    │
  │  i    │         │  = total-left-arr[i] │ rightSum?     │           │  (sau)      │
  ├───────┼─────────┼──────────────────────┼───────────────┼────────────┼─────────────┤
  │  0    │   1     │  13 - 0 - 1 = 12     │ 0 === 12? ❌  │ continue  │  0+1 = 1    │
  │  1    │   3     │  13 - 1 - 3 = 9      │ 1 === 9?  ❌  │ continue  │  1+3 = 4    │
  │  2    │   5     │  13 - 4 - 5 = 4      │ 4 === 4?  ✅  │ RETURN 2! │  ─          │
  │  3    │   2     │  (not reached)       │               │           │             │
  │  4    │   2     │  (not reached)       │               │           │             │
  └───────┴─────────┴──────────────────────┴───────────────┴────────────┴─────────────┘

  Verification cho i=2:
    left  = arr[0] + arr[1] = 1 + 3 = 4       ✅
    right = arr[3] + arr[4] = 2 + 2 = 4       ✅
    left === right → 4 === 4 ✅
```

### Trace dạng bảng — IMPOSSIBLE case [10, -10, 10, -10, 10]

```
  total = 10 + (-10) + 10 + (-10) + 10 = 10
  leftSum = 0

  ┌───────┬─────────┬──────────────────────┬───────────────┬────────────┬─────────────┐
  │  i    │ arr[i]  │  rightSum            │ left===right? │ Kết quả   │  leftSum    │
  ├───────┼─────────┼──────────────────────┼───────────────┼────────────┼─────────────┤
  │  0    │  10     │  10-0-10 = 0         │ 0 === 0?  ✅  │ RETURN 0! │  ─          │
  └───────┴─────────┴──────────────────────┴───────────────┴────────────┴─────────────┘

  🧠 Equilibrium ở i=0!
    left = [] = 0 (tổng rỗng)
    right = [-10, 10, -10, 10] = 0
    → 0 === 0 ✅

  📌 Edge case: equilibrium ở BIÊN (i=0 hoặc i=n-1)
     Code xử lý TỰ ĐỘNG nhờ leftSum=0 ban đầu!
```

---

## 🧮 Chứng minh Toán học — Tại sao Complement Identity đúng

> 💡 Phần này giải thích BẢN CHẤT SỐ HỌC sâu hơn, giúp bạn hiểu thay vì chỉ nhớ.

```mermaid
graph TD
    subgraph PROOF["📐 Chứng minh Complement Identity"]
        direction TB
        A["total = Σ arr[j] for j=0..n-1"] --> B["Chia thành 3 phần"]
        B --> C["total = Σ arr[j=0..i-1] + arr[i] + Σ arr[j=i+1..n-1]"]
        C --> D["total = leftSum + arr[i] + rightSum"]
        D --> E["rightSum = total - leftSum - arr[i]"]
    end

    subgraph APPLY["🎯 Ứng dụng"]
        F["Biết total (tính 1 lần)"]
        G["Biết leftSum (tích lũy)"]
        H["Biết arr[i] (đọc trực tiếp)"]
        F --> I["rightSum = O(1) per query!"]
        G --> I
        H --> I
    end

    E --> F

    style E fill:#4CAF50,color:white
    style I fill:#FF5722,color:white
```

### Chứng minh chặt chẽ

```
  📐 CHỨNG MINH:

  Cho arr = [a₀, a₁, ..., aₙ₋₁], tổng total = Σᵢ aᵢ

  ── Tại một vị trí i bất kỳ (0 ≤ i ≤ n-1) ──

  Định nghĩa:
    leftSum(i)  = Σ{j=0}^{i-1} aⱼ    (tổng các phần tử trước i)
    rightSum(i) = Σ{j=i+1}^{n-1} aⱼ   (tổng các phần tử sau i)

  Phân hoạch (Partition):
    Tập {0, 1, ..., n-1} = {0..i-1} ∪ {i} ∪ {i+1..n-1}
    Ba tập RỜI NHAU (disjoint) và PHỦI HẾT (exhaustive)

  Do đó:
    total = Σ{j=0}^{n-1} aⱼ
          = Σ{j=0}^{i-1} aⱼ + aᵢ + Σ{j=i+1}^{n-1} aⱼ
          = leftSum(i) + aᵢ + rightSum(i)

  Chuyển vế:
    rightSum(i) = total - leftSum(i) - aᵢ   ∎

  ── Tính chất tích lũy của leftSum ──

  leftSum(0)   = Σ(empty) = 0
  leftSum(i+1) = leftSum(i) + aᵢ

  → leftSum là RUNNING SUM: chỉ cần cộng thêm aᵢ mỗi bước!
  → KHÔNG cần tính lại từ đầu!

  ═══════════════════════════════════════════════════════════
   KẾT LUẬN:
   Với total đã biết + leftSum tích lũy:
     rightSum = total - leftSum - arr[i]  (O(1) per query)
   Thay vì: rightSum = Σ{j=i+1}^{n-1} arr[j]  (O(n) per query)
   → Tiết kiệm: O(n) mỗi lần → tổng: O(n²) → O(n)
  ═══════════════════════════════════════════════════════════
```

### Tại sao KHÔNG dùng Binary Search?

```
  🧠 CÂU HỎI HAY: "leftSum tăng, rightSum giảm → dùng binary search?"

  ❌ Trả lời: KHÔNG! Vì mảng có thể chứa SỐ ÂM!

  Ví dụ phản chứng:
    arr = [10, -20, 15, 5, -10]   total = 0

    i=0: left=0,   right=-10    ← right < left
    i=1: left=10,  right=10     ← left < right... rồi right > left!?
    i=2: left=-10, right=-5     ← left GIẢM! (vì arr[1]=-20)
    i=3: left=5,   right=-10
    i=4: left=10,  right=0

  leftSum: 0, 10, -10, 5, 10   ← KHÔNG monotone! (lên xuống!)
  rightSum: -10, 10, -5, -10, 0  ← KHÔNG monotone!

  → Vì leftSum KHÔNG đơn điệu → binary search KHÔNG ÁP DỤNG!
  → Phải duyệt TUẦN TỰ O(n)

  📌 Khi nào binary search cho sum?
    → Chỉ khi mảng TOÀN SỐ DƯƠNG hoặc đã sort
    → Khi đó prefix sum monotone increasing → OK!
    → Bài này: có số âm → NO!
```

---

## 🔄 Alternative Approaches — So sánh các cách tiếp cận

```mermaid
graph TD
    subgraph COMPARE["🔄 So sánh 4 Approaches"]
        direction TB
        A1["Approach 1\nBrute Force 2 loops\n❌ CHẬM"] --> T1["⏱️ O(n²)\n💾 O(1)"]
        A2["Approach 2\nPrefix Array\n⚠️ Tốn space"] --> T2["⏱️ O(n)\n💾 O(n)"]
        A3["Approach 3\nRunning Sum leftSum\n⭐ OPTIMAL"] --> T3["⏱️ O(n)\n💾 O(1)"]
        A4["Approach 4\nRunning Sum rightSum\n(duyệt phải→trái)"] --> T4["⏱️ O(n)\n💾 O(1)"]
    end

    T1 --> R1["TLE với input lớn"]
    T2 --> R2["Tốn O(n) space thừa"]
    T3 --> R3["✅ BEST CHOICE"]
    T4 --> R4["⚠️ Kém trực quan"]

    style A3 fill:#4CAF50,color:white,stroke:#2E7D32,stroke-width:3px
    style R3 fill:#C8E6C9,stroke:#4CAF50
    style R1 fill:#FFCDD2,stroke:#F44336
    style R2 fill:#FFF9C4,stroke:#FBC02D
    style R4 fill:#FFF9C4,stroke:#FBC02D
```

### Approach 4: Duyệt PHẢI → TRÁI (rightSum tích lũy)

```javascript
// ✅ TƯƠNG ĐƯƠNG Approach 3, nhưng ngược chiều
function equilibriumRightToLeft(arr) {
  const total = arr.reduce((a, b) => a + b, 0);
  let rightSum = 0;

  for (let i = arr.length - 1; i >= 0; i--) {
    const leftSum = total - rightSum - arr[i];
    if (leftSum === rightSum) return i; // ⚠️ KHÔNG phải "first"!
    rightSum += arr[i];
  }
  return -1;
}
```

```
  ⚠️ VẤN ĐỀ: Bài yêu cầu "FIRST equilibrium index" (nhỏ nhất)!
     Duyệt phải → trái tìm được LAST equilibrium index trước!
     → Cần duyệt HẾT rồi track min index → phức tạp thêm!

  Khi nào dùng chiều ngược?
    → Khi đề hỏi "LAST equilibrium index"
    → Hoặc khi cần tìm TẤT CẢ equilibrium indices

  📌 Trong phỏng vấn: LUÔN dùng trái → phải (Approach 3)
     → Tự nhiên hơn
     → Trả về FIRST index tự động!
```

### Approach 5: Dùng 2×leftSum thay rightSum — Elegant trick

```javascript
// ✅ TRICK: leftSum === rightSum ⟺ 2×leftSum + arr[i] === total
function equilibriumTrick(arr) {
  const total = arr.reduce((a, b) => a + b, 0);
  let leftSum = 0;

  for (let i = 0; i < arr.length; i++) {
    // leftSum === (total - leftSum - arr[i])
    // 2 * leftSum === total - arr[i]
    // 2 * leftSum + arr[i] === total
    if (2 * leftSum + arr[i] === total) return i;
    leftSum += arr[i];
  }
  return -1;
}
```

```
  🧠 CHỨNG MINH:
    leftSum === rightSum
    leftSum === total - leftSum - arr[i]
    2 × leftSum === total - arr[i]
    2 × leftSum + arr[i] === total        ← ĐIỀU KIỆN MỚI!

  Ưu điểm:
    ✅ Không cần biến rightSum riêng
    ✅ 1 phép nhân + 1 phép cộng + 1 so sánh (thay vì 2 phép trừ + 1 so sánh)
    ✅ Code ngắn hơn 1 dòng

  Nhược điểm:
    ❌ Kém trực quan (interviewer có thể hỏi "tại sao ×2?")
    ❌ Tiềm ẩn integer overflow NẾU giá trị lớn (2×leftSum có thể vượt 2^53)

  📌 Interview tip:
    NÊN biết trick này để MENTION khi interviewer hỏi "có cách nào khác?"
    NHƯNG dùng Approach 3 làm code chính (rõ ràng hơn)
```

### So sánh tất cả approaches

```
  ┌───────────────────────────────────────────────────────────────────────────┐
  │  Approach         │ Time   │ Space │ Passes │ Pros           │ Cons       │
  ├───────────────────────────────────────────────────────────────────────────┤
  │  Brute Force      │ O(n²)  │ O(1)  │ 1      │ Đơn giản       │ Chậm!     │
  │  (2 inner loops)  │        │       │        │                │ TLE!      │
  ├───────────────────────────────────────────────────────────────────────────┤
  │  Prefix Array     │ O(n)   │ O(n)  │ 2      │ Tra cứu O(1)   │ Tốn space │
  │                   │        │       │        │ cho mọi i      │ O(n)      │
  ├───────────────────────────────────────────────────────────────────────────┤
  │  Running Sum ✅   │ O(n)   │ O(1)  │ 2      │ Optimal!       │           │
  │  ← KHUYẾN KHÍCH  │        │       │        │ Rõ ràng        │ Không có  │
  ├───────────────────────────────────────────────────────────────────────────┤
  │  Right-to-Left    │ O(n)   │ O(1)  │ 2      │ Tìm LAST index │ Không     │
  │                   │        │       │        │                │ first!    │
  ├───────────────────────────────────────────────────────────────────────────┤
  │  2×leftSum trick  │ O(n)   │ O(1)  │ 2      │ Compact        │ Kém trực  │
  │                   │        │       │        │ Ít biến hơn    │ quan      │
  └───────────────────────────────────────────────────────────────────────────┘

  📌 Kết luận: Running Sum (Approach 3) là BEST CHOICE cho phỏng vấn!
```

---

## 🧠 Think Out Loud — Quá trình tư duy từ ZERO đến SOLUTION

> 🎙️ Phần này mô phỏng ĐÚNG cách một Senior Engineer suy nghĩ khi gặp bài này,
> bao gồm cả những "ngõ cụt" và cách quay lại đúng hướng.

```mermaid
flowchart LR
    P1["📖 Phase 1\nĐọc đề\n~30s"] --> P2["✏️ Phase 2\nVẽ ví dụ\n~1m"]
    P2 --> P3["⚙️ Phase 3\nBrute → Optimize\n~1m"]
    P3 --> P4["💻 Phase 4\nCode + Trace\n~2m"]
    P4 --> P5["🎤 Phase 5\nFollow-up Q&A"]

    P1 -.- I1["🔑 Fact #1:\narr[i] KHÔNG thuộc\nleft hay right"]
    P2 -.- I2["🔑 Fact #2:\nright = total - left\n- arr[i]"]
    P3 -.- I3["🔑 O(n²) → O(n)\nbằng running sum"]
    P4 -.- I4["🔑 leftSum += arr[i]\nPHẢI SAU check"]
    P5 -.- I5["🔑 Cùng bài với\nPivot Index #724"]

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

### Phase 1: Đọc đề — 30 giây đầu

```
  🧠 "Find first index where left sum equals right sum..."

  Ghi ra giấy ngay:
    ✏️ "sum of LEFT = sum of RIGHT"
    ✏️ "FIRST index" → return ngay khi tìm thấy
    ✏️ "arr[i] NOT included in either sum" → 3 phần!
    ✏️ "return -1 if not found"

  🧠 "Ok, n phần tử chia thành 3 nhóm: left, pivot, right."
  🧠 "Cần tìm i sao cho left = right. Classic prefix sum problem!"
  🧠 "Fact #1 locked in: arr[i] là partition point, không thuộc bên nào."
```

### Phase 2: Vẽ ví dụ — 1 phút

```
  Tự tạo ví dụ NHỎ:
    arr = [1, 2, 0, 3]

  🧠 "Thử từng i:"
    i=0: left=0,       right=2+0+3=5    → 0≠5 ❌
    i=1: left=1,       right=0+3=3      → 1≠3 ❌
    i=2: left=1+2=3,   right=3          → 3=3 ✅ FOUND at 2!
    i=3: left=1+2+0=3, right=0          → 3≠0 ❌

  🧠 "Thấy rồi! Brute force = tính left & right cho MỖI i."
  🧠 "Nhưng khoan... total = 1+2+0+3 = 6."
  🧠 "i=2: left=3, arr[2]=0, right = 6-3-0 = 3. BINGO!"
  🧠 "→ right = total - left - arr[i]. Fact #2 locked in!"
```

### Phase 3: Brute → Optimize — 1 phút

```
  🧠 "Brute force: mỗi i, 2 inner loops tính left + right → O(n²)."
  🧠 "Optimize: left tích lũy, right dẫn xuất từ total."
  🧠 "→ left chỉ cần 1 biến, right = total - left - arr[i]."
  🧠 "→ O(n) time, O(1) space. 2 passes: 1 tính total, 1 duyệt."

  🧠 "Có thể 1 pass? KHÔNG! Cần total trước khi duyệt."
  🧠 "O(n) đã optimal — phải đọc mọi phần tử để biết total."

  🧠 "⚠️ Cẩn thận: left += arr[i] PHẢI SAU khi check!"
  🧠 "Nếu trước: arr[i] vào left → right bị trừ arr[i] 2 lần!"
```

### Phase 4: Code + Trace — 2 phút

```
  🧠 "Viết code... xong. Tự trace trong đầu:"

  arr = [-7, 1, 5, 2, -4, 3, 0]  total = 0

  i=0: right = 0-0-(-7) = 7     0≠7   left→-7
  i=1: right = 0-(-7)-1 = 6    -7≠6   left→-6
  i=2: right = 0-(-6)-5 = 1    -6≠1   left→-1
  i=3: right = 0-(-1)-2 = -1   -1=-1  ✅ return 3!

  🧠 "Verify: left = -7+1+5 = -1, right = -4+3+0 = -1. Correct!"
  🧠 "Handles negative numbers naturally. No edge case bug."
  🧠 "Done. ~4 minutes total for easy problem."
```

### Phase 5: Nếu interviewer hỏi tiếp — Sẵn sàng

```
  Q: "Có thể có nhiều equilibrium index không?"
  A: "Có! Ví dụ [0,0,0] → mọi index đều là equilibrium.
      Ta return FIRST (nhỏ nhất) vì duyệt trái→phải."

  Q: "Nếu muốn tìm TẤT CẢ equilibrium indices?"
  A: "Thay return i bằng push vào result array.
      Vẫn O(n) time, O(k) space với k = số equilibrium indices."

  Q: "Bài này giống bài nào trên LeetCode?"
  A: "Pivot Index #724 — giống HỆT! Cùng đề, cùng code, cùng logic.
      Cũng liên quan tới Split Array 3 Equal Sum (dùng 2 equilibrium points)."

  Q: "Nếu mảng CỰC LỚN (streaming, không fit memory)?"
  A: "Cần 2 pass → khó streaming vì cần total trước.
      Option 1: Đọc file 2 lần (pass 1: total, pass 2: check)
      Option 2: Nếu biết total trước → 1 pass streaming OK.
      Option 3: Dùng 2×leftSum + arr[i] === total trick."

  Q: "Tại sao không binary search?"
  A: "Vì mảng có số âm → leftSum/rightSum KHÔNG monotone.
      Binary search cần monotonicity. Phải linear scan."
```

---

## 📚 Bài tập liên quan — Practice Problems

### Progression Path: Easy → Hard

```mermaid
graph LR
    A["Equilibrium Index\nPivot #724"] -->|"left×right\nthay left+right"| B["#238 Product\nExcept Self"]
    A -->|"count thay\nfind index"| C["#560 Subarray\nSum = K"]
    A -->|"2 pivot thay 1"| D["Split Array\n3 Equal Sum"]
    A -->|"query range"| E["#303 Range\nSum Query"]

    style A fill:#4CAF50,color:white
    style B fill:#FF9800,color:white
    style C fill:#FF9800,color:white
    style D fill:#FF9800,color:white
    style E fill:#4CAF50,color:white
```

### 1. Pivot Index (#724) — Easy (GIỐNG HỆT!)

```
  Đề: Find the pivot index — leftSum equals rightSum.
  → CÙNG ĐỀ, CÙNG CODE, CÙNG LOGIC!

  function pivotIndex(nums) {
    const total = nums.reduce((a, b) => a + b, 0);
    let leftSum = 0;
    for (let i = 0; i < nums.length; i++) {
      if (leftSum === total - leftSum - nums[i]) return i;
      leftSum += nums[i];
    }
    return -1;
  }

  📌 Khác biệt DUY NHẤT:
     GfG: hàm tên equilibriumIndex
     LC:  hàm tên pivotIndex
     → CÙNG 1 BÀI! Copy-paste đổi tên!
```

### 2. Product Except Self (#238) — Medium

```
  Đề: Với mỗi i, tính tích TẤT CẢ phần tử TRỪ arr[i]
  → CÙNG tư duy left/right, nhưng dùng NHÂN thay CỘNG!

  function productExceptSelf(nums) {
    const n = nums.length;
    const result = new Array(n);

    // Pass 1: leftProduct tích lũy
    let leftProduct = 1;
    for (let i = 0; i < n; i++) {
      result[i] = leftProduct;
      leftProduct *= nums[i];
    }

    // Pass 2: rightProduct tích lũy (ngược)
    let rightProduct = 1;
    for (let i = n - 1; i >= 0; i--) {
      result[i] *= rightProduct;
      rightProduct *= nums[i];
    }

    return result;
  }

  📌 So sánh với Equilibrium:
    Equilibrium: rightSum = total - leftSum - arr[i]
    Product:     KHÔNG thể "trừ" → cần 2 pass (trái + phải)
    → Equilibrium dùng complement (1 biến)
    → Product dùng 2 running values (left pass + right pass)

  📌 Tại sao không dùng total_product / arr[i]?
    → arr[i] có thể = 0! Division by zero!
    → Nếu có 2+ zeros → tất cả result = 0
    → Left×Right approach TRÁNH chia → LUÔN ĐÚNG!
```

### 3. Subarray Sum = K (#560) — Medium

```
  Đề: Đếm số subarray có tổng = k
  → Prefix Sum + HashMap (nâng cấp từ running sum!)

  function subarraySum(nums, k) {
    const map = new Map();  // prefixSum → count
    map.set(0, 1);          // tổng rỗng = 0 (base case)
    let prefix = 0;
    let count = 0;

    for (const num of nums) {
      prefix += num;
      // Nếu prefix - k đã gặp → có subarray sum = k!
      if (map.has(prefix - k)) {
        count += map.get(prefix - k);
      }
      map.set(prefix, (map.get(prefix) || 0) + 1);
    }
    return count;
  }

  📌 Evolution từ Equilibrium:
    Equilibrium: right = total - left - arr[i] (complement = total)
    SubarraySum: complement = prefix - k (tìm trong HashMap!)
    → Cùng "dẫn xuất từ complement", nhưng dùng HashMap đếm!

  📌 Tại sao cần HashMap thay running sum?
    → Equilibrium: chỉ cần biết "tồn tại hay không" → 1 biến
    → SubarraySum: cần ĐẾMSỐ LƯỢNG subarray → HashMap!
```

### 4. Split Array 3 Equal Sum — Medium

```
  Đề: Chia mảng thành 3 phần có tổng bằng nhau
  → ỨNG DỤNG equilibrium 2 LẦN!

  function canSplit3Equal(arr) {
    const total = arr.reduce((a, b) => a + b, 0);
    if (total % 3 !== 0) return false;  // phải chia hết 3!

    const target = total / 3;
    let sum = 0;
    let count = 0;  // số "cắt" tìm được

    // Duyệt đến n-2 (phần cuối phải ≥ 1 phần tử)
    for (let i = 0; i < arr.length - 1; i++) {
      sum += arr[i];
      if (sum === target * (count + 1)) {
        count++;
        if (count === 2) return true;  // 2 cắt = 3 phần!
      }
    }
    return false;
  }

  📌 Mối liên hệ:
    Equilibrium: 1 pivot → leftSum = rightSum
    Split 3:     2 pivots → part1 = part2 = part3 = total/3
    → Equilibrium là "con" của Split 3!
```

### Tổng kết — Prefix Sum lưu GÌ tùy bài?

```
  ┌──────────────────────────────────────────────────────────────┐
  │  BÀI                      │  prefix lưu GÌ?      │ Dẫn xuất? │
  ├──────────────────────────────────────────────────────────────┤
  │  Equilibrium/Pivot #724   │  leftSum (1 biến)     │ right =   │
  │                           │                       │ total-l-a │
  ├──────────────────────────────────────────────────────────────┤
  │  Product Except Self #238 │  leftProduct (1 biến) │ right     │
  │                           │  + rightProduct       │ pass ngược│
  ├──────────────────────────────────────────────────────────────┤
  │  Subarray Sum = K #560    │  prefix sum (HashMap) │ complement│
  │                           │  → count              │ = p - k   │
  ├──────────────────────────────────────────────────────────────┤
  │  Range Sum Query #303     │  prefix[] (mảng)      │ sum(L,R)  │
  │                           │                       │ = p[R+1]  │
  │                           │                       │   - p[L]  │
  ├──────────────────────────────────────────────────────────────┤
  │  Split Array 3 Equal      │  running sum (1 biến) │ target =  │
  │                           │  + counter            │ total/3   │
  └──────────────────────────────────────────────────────────────┘

  📌 Prefix Sum là "Swiss Army Knife" cho bài toán tổng!
     → Dùng 1 biến khi duyệt tuần tự
     → Dùng mảng khi cần query ngẫu nhiên
     → Dùng HashMap khi cần đếm/tra cứu phức tạp
```

### Skeleton code — Reusable template cho Prefix Sum + Complement

```javascript
// TEMPLATE: "Tìm vị trí i mà f(leftSum) = g(rightSum)"
function findBalancePoint(arr, condition) {
  const total = arr.reduce((a, b) => a + b, 0);
  let leftAcc = 0;  // left accumulator (tích lũy trái)

  for (let i = 0; i < arr.length; i++) {
    const rightAcc = total - leftAcc - arr[i];  // complement!!

    if (condition(leftAcc, rightAcc, arr[i], i)) {
      return i;  // hoặc push vào result
    }

    leftAcc += arr[i];  // ⚠️ PHẢI SAU condition!
  }

  return -1;  // hoặc result array
}

// Equilibrium:    condition = (l, r) => l === r
// Weighted Pivot: condition = (l, r) => l >= r (ví dụ)
// Find All:       thay return i bằng result.push(i)
```

```
  📌 PATTERN:
    1. Tính total (pass 1)
    2. Tích lũy leftAcc (pass 2)
    3. DẪN XUẤT rightAcc = total - leftAcc - arr[i]
    4. Check condition TRƯỚC khi update leftAcc
    5. Update leftAcc += arr[i] SAU condition

  → MỌI bài "left/right balance" đều dùng skeleton này!
  → Chỉ đổi condition function!
```

---

## 📊 Tổng kết — Bảng so sánh và Key Insights

```mermaid
flowchart TD
    Q["❓ Chọn approach nào?"] --> Q1{"Bạn đang ở đâu?"}

    Q1 -->|"Phỏng vấn"| A3["⭐ Running Sum\nleftSum + complement\nO(n), O(1)"]
    Q1 -->|"Giải thích cho\nngười khác"| A1["Brute Force\n2 inner loops\nDễ hiểu nhất"]
    Q1 -->|"Cần query\nnhiều index"| A2["Prefix Array\nBuild prefix[]\nO(1) per query"]
    Q1 -->|"Follow-up:\ntìm tất cả"| A5["Running Sum\n+ result array"]

    A3 --> BEST["✅ BEST CHOICE\nNhanh + Rõ ràng\n+ Return FIRST tự nhiên"]

    style A3 fill:#4CAF50,color:white,stroke:#2E7D32,stroke-width:3px
    style BEST fill:#C8E6C9,stroke:#4CAF50,stroke-width:2px
    style Q fill:#9C27B0,color:white
    style A1 fill:#FFCDD2,stroke:#F44336
    style A2 fill:#FFF9C4,stroke:#FBC02D
    style A5 fill:#E3F2FD,stroke:#1976D2
```

```mermaid
graph LR
    subgraph SUMMARY["📌 Tổng kết bài toán"]
        direction TB
        S1["1. total = sum(arr)"] --> S2["2. leftSum tích lũy"]
        S2 --> S3["3. rightSum = total - left - arr[i]"]
        S3 --> S4["4. leftSum === rightSum? → return i"]
    end

    subgraph KEY["🔑 Key Insights"]
        K1["Complement:\nright = total - left - current"]
        K2["Running Sum:\nleft tích lũy O(1)/step"]
        K3["Use-then-update:\ncộng SAU check!"]
        K4["Optimal:\nO(n) = lower bound"]
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
  │  📌 3 ĐIỀU PHẢI NHỚ                                                    │
  │                                                                          │
  │  1. CÔNG THỨC: rightSum = total - leftSum - arr[i]                      │
  │     → 1 phép trừ thay O(n) loop → biến O(n²) thành O(n)!              │
  │                                                                          │
  │  2. THỨ TỰ: tính rightSum → check → cộng leftSum                       │
  │     → "Use-then-update" pattern                                         │
  │     → Cộng TRƯỚC = arr[i] bị trừ 2 lần = SAI!                         │
  │                                                                          │
  │  3. PATTERN: Prefix Sum + Complement                                    │
  │     → Áp dụng cho Pivot Index, Product Except Self, Subarray Sum = K   │
  │     → HỌC 1 PATTERN → GIẢI ĐƯỢC 5+ BÀI!                              │
  └──────────────────────────────────────────────────────────────────────────┘
```
