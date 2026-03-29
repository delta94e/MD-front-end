# 🔄 Rearrange Array — arr[i] = i — GfG (Easy)

> 📖 Code: [Rearrange Array.js](./Rearrange%20Array.js)

```mermaid
graph TD
    A["🔄 Rearrange arr[i] = i"] --> B{"Approach?"}

    B --> C["🐢 Brute Force O(n²)"]
    C --> C1["Với mỗi i: tìm i trong mảng"]
    C1 --> C2["Tìm thấy → swap, không → arr[i]=-1"]

    B --> D["⚡ Hash Set O(n)"]
    D --> D1["Bước 1: lưu tất cả giá trị vào Set"]
    D1 --> D2["Bước 2: duyệt i=0→n-1"]
    D2 --> D3["set.has(i) → arr[i]=i, else -1"]

    B --> E["🎯 In-place Swap O(n) ⭐"]
    E --> E1["while arr[i] !== i AND arr[i] !== -1"]
    E1 --> E2["swap arr[i] về đúng chỗ"]
    E2 --> E3["Mỗi phần tử swap TỐI ĐA 1 lần → O(n)!"]

    style C fill:#FF9800,color:white
    style D fill:#2196F3,color:white
    style E fill:#4CAF50,color:white
```

```mermaid
graph LR
    subgraph "Bản chất bài toán"
        P1["Value = Index mong muốn"]
        P2["arr[i] = i ↔ phần tử i ở vị trí i"]
        P3["-1 = placeholder cho 'không có'"]
    end

    subgraph "Kỹ thuật liên quan"
        K1["Cyclic Sort → sắp xếp n phần tử 0..n-1"]
        K2["In-place Swap → O(1) space"]
        K3["Hash Set → quick lookup O(1)"]
    end
```

---

## R — Repeat & Clarify

🧠 *"Cho mảng n phần tử, giá trị 0 đến n-1. Nếu giá trị i tồn tại → đặt vào arr[i]. Nếu không → arr[i] = -1."*

> 🎙️ *"Given an array of n elements with values 0 to n-1 (some missing, replaced by -1), rearrange so that arr[i] = i. If i is not in the array, place -1 at index i."*

### Clarification Questions

```
Q: Giá trị nằm trong range nào?
A: Từ 0 đến n-1 (hoặc -1 nếu thiếu)

Q: Có giá trị trùng lặp không?
A: KHÔNG — mỗi giá trị xuất hiện TỐI ĐA 1 lần (hoặc -1)

Q: -1 có ý nghĩa gì?
A: -1 = placeholder, nghĩa là vị trí đó CHƯA CÓ phần tử phù hợp

Q: Có cần giữ thứ tự gốc không?
A: KHÔNG — bài yêu cầu rearrange hoàn toàn

Q: Output format?
A: arr[i] = i nếu i tồn tại, arr[i] = -1 nếu i không tồn tại
```

### Tại sao bài này quan trọng?

```
  Bài này là NỀN TẢNG cho pattern "Cyclic Sort"!

  BẠN SẼ GẶP LẠI pattern này ở:
  ┌───────────────────────────────────────────────────────┐
  │  Find Missing Number          → Cyclic Sort           │
  │  Find Duplicate Number        → Cyclic Sort           │
  │  Find All Missing Numbers     → Cyclic Sort           │
  │  Find First Missing Positive  → Cyclic Sort (biến thể)│
  │  Set Mismatch                 → Cyclic Sort           │
  └───────────────────────────────────────────────────────┘

  TƯ TƯỞNG CHUNG:
    Khi giá trị nằm trong range [0, n-1] hoặc [1, n]
    → Giá trị CHÍNH LÀ index mong muốn!
    → Swap phần tử VỀ ĐÚNG CHỖ!
```

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

### Value = Index — Mỗi số "biết" vị trí của mình!

```
  Tưởng tượng: Một LỚP HỌC có 10 ghế (0-9)
  Mỗi học sinh có SỐ THỨ TỰ = SỐ GHẾ phải ngồi

  Học sinh số 3 → phải ngồi ghế 3
  Học sinh số 7 → phải ngồi ghế 7
  -1 = ghế TRỐNG (không có học sinh số đó)

  Ban đầu (lộn xộn):
    Ghế:     0   1   2   3   4   5   6   7   8   9
    Ngồi:  [-1, -1,  6,  1,  9,  3,  2, -1,  4, -1]

  Sau khi sắp xếp (ai về ghế nấy):
    Ghế:     0   1   2   3   4   5   6   7   8   9
    Ngồi:  [-1,  1,  2,  3,  4, -1,  6, -1, -1,  9]

  Học sinh 0, 5, 7, 8 VẮNG MẶT → ghế trống = -1
```

### Tại sao bài này ĐƠN GIẢN hơn tưởng?

```
  KEY INSIGHT: Giá trị arr[i] CHO BIẾT vị trí đúng!

  Nếu arr[2] = 6:
    → Giá trị 6 đang ngồi NHẦM ở ghế 2
    → Phải chuyển 6 về ghế 6: arr[6] = 6!
    → Swap arr[2] và arr[6]!

  Nếu arr[i] = -1:
    → Ghế i hiện TRỐNG, skip!

  Nếu arr[i] = i:
    → Đã đúng chỗ rồi, skip!

  → BÀI TOÁN = swap mỗi phần tử VỀ ĐÚNG VỊ TRÍ!
```

---

## 🧭 Luồng Suy Nghĩ — Từ đọc đề đến solution

> 💡 Phần này dạy bạn **CÁCH TƯ DUY** để tự giải bài, không chỉ biết đáp án.

### Bước 1: Đọc đề → Gạch chân KEYWORDS

```
  Đề bài: "Rearrange the array such that arr[i] = i"

  Gạch chân:
    "rearrange"    → SẮP XẾP LẠI, in-place operation
    "arr[i] = i"   → giá trị i phải ở VỊ TRÍ i
    "0 to n-1"     → range = [0, n-1] → value = index!
    "-1"           → placeholder cho phần tử THIẾU

  🧠 Trigger: "Giá trị 0 đến n-1" + "arr[i] = i"
    → Pattern: Cyclic Sort / In-place rearrange!
    → Mỗi giá trị BIẾT vị trí đúng của nó!

  📌 Kỹ năng chuyển giao:
    Bất cứ khi nào giá trị thuộc range [0, n-1] hoặc [1, n]
    → Nghĩ ngay: Cyclic Sort! Swap về đúng vị trí!
```

### Bước 2: Vẽ ví dụ NHỎ bằng tay → Tìm PATTERN

```
  arr = [-1, -1, 6, 1, 9, 3, 2, -1, 4, -1]

  Duyệt từng phần tử:
    i=0: arr[0]=-1  → không có ai → -1 ✅
    i=1: arr[1]=-1  → chưa đúng, nhưng -1 thì skip
    i=2: arr[2]=6   → 6 không phải 2 → cần swap!
         6 phải ở vị trí 6 → swap arr[2] ↔ arr[6]
    ...

  💡 Pattern: Duyệt mảng, nếu arr[i] ≠ i VÀ arr[i] ≠ -1
    → swap arr[i] về đúng vị trí arr[arr[i]]!
```

### Bước 3: Từ pattern → Nghĩ các approaches

```
  Approach 1 (Naive): Với mỗi i, tìm i trong mảng → O(n²)
  Approach 2 (Hash):  Lưu tất cả giá trị vào Set → O(n) time, O(n) space
  Approach 3 (Swap):  Swap về đúng chỗ in-place → O(n) time, O(1) space ⭐

  📌 Kỹ năng chuyển giao:
    Luôn nghĩ BẢ approach stừ brute force → optimize:
    O(n²) → O(n) time + O(n) space → O(n) time + O(1) space
```

---

## E — Examples

```
VÍ DỤ 1: arr = [-1, -1, 6, 1, 9, 3, 2, -1, 4, -1]

  Values present: {1, 2, 3, 4, 6, 9}
  Values missing: {0, 5, 7, 8}

  Output: [-1, 1, 2, 3, 4, -1, 6, -1, -1, 9]

  Kiểm tra:
    arr[0] = -1  ← 0 không tồn tại ✅
    arr[1] = 1   ← 1 ở vị trí 1 ✅
    arr[2] = 2   ← 2 ở vị trí 2 ✅
    arr[3] = 3   ← 3 ở vị trí 3 ✅
    arr[4] = 4   ← 4 ở vị trí 4 ✅
    arr[5] = -1  ← 5 không tồn tại ✅
    arr[6] = 6   ← 6 ở vị trí 6 ✅
    arr[7] = -1  ← 7 không tồn tại ✅
    arr[8] = -1  ← 8 không tồn tại ✅
    arr[9] = 9   ← 9 ở vị trí 9 ✅
```

```
VÍ DỤ 2: arr = [0, 1, 2, 3, 4, 5]

  Mọi phần tử ĐÃ ĐÚNG CHỖ!
  Output: [0, 1, 2, 3, 4, 5] ← không thay đổi gì

VÍ DỤ 3 (Edge): arr = [-1, -1, -1]

  Không có giá trị nào trong range!
  Output: [-1, -1, -1]

VÍ DỤ 4 (Edge): arr = [2, 0, 1]

  Tất cả đều SAI VỊ TRÍ nhưng đều tồn tại!
  Output: [0, 1, 2]
```

---

## A — Approach

### Approach 1: Brute Force — O(n²) Time, O(1) Space

```
Ý tưởng: Với mỗi vị trí i (0 → n-1),
  TÌM xem giá trị i CÓ TRONG mảng không.
  Có → đặt arr[i] = i
  Không → đặt arr[i] = -1

  ⚠️ Mỗi lần tìm = duyệt TOÀN BỘ mảng → O(n) per search
  → Tổng: O(n²)
```

```javascript
function rearrangeBrute(arr) {
  const n = arr.length;

  for (let i = 0; i < n; i++) {
    // Tìm giá trị i trong mảng
    let found = false;
    for (let j = 0; j < n; j++) {
      if (arr[j] === i) {
        found = true;
        // Swap arr[i] và arr[j]
        [arr[i], arr[j]] = [arr[j], arr[i]];
        break;
      }
    }
    if (!found) {
      arr[i] = -1;
    }
  }
  return arr;
}
// Time: O(n²), Space: O(1)
```

### Trace Brute Force: arr = [-1, -1, 6, 1, 9, 3, 2, -1, 4, -1]

```
  i=0: tìm 0 trong mảng → KHÔNG CÓ → arr[0]=-1
  i=1: tìm 1 → ở j=3 → swap arr[1]↔arr[3] → [-1, 1, 6, -1, 9, 3, 2, -1, 4, -1]
  i=2: tìm 2 → ở j=6 → swap arr[2]↔arr[6] → [-1, 1, 2, -1, 9, 3, 6, -1, 4, -1]
  i=3: tìm 3 → ở j=5 → swap arr[3]↔arr[5] → [-1, 1, 2, 3, 9, -1, 6, -1, 4, -1]
  i=4: tìm 4 → ở j=8 → swap arr[4]↔arr[8] → [-1, 1, 2, 3, 4, -1, 6, -1, 9, -1]
  i=5: tìm 5 → KHÔNG CÓ → arr[5]=-1
  i=6: arr[6]=6 → tìm 6 → ở j=6 → ĐÃ ĐÚNG ✅
  i=7: tìm 7 → KHÔNG CÓ → arr[7]=-1
  i=8: tìm 8 → KHÔNG CÓ → arr[8] bị ghi -1? ⚠️
       → SAI! 9 đang ở vị trí 8, bị mất!

  ⚠️ VẤN ĐỀ: Ghi đè -1 khi phần tử đó có thể cần ở chỗ khác!
  → Cần cẩn thận: dùng mảng mới hoặc swap pattern!
```

```
⚠️ BẪY KINH ĐIỂN:
  Brute Force viết sai rất DỄ vì:
  1. Ghi đè arr[i] = -1 có thể XÓA giá trị còn cần swap
  2. Sau khi swap, giá trị cũ ở arr[i] có thể cần xét lại

  → Cách an toàn: dùng mảng mới (Approach 2)
  → Cách tốt hơn: swap chain in-place (Approach 3)
```

---

### Approach 2: Hash Set — O(n) Time, O(n) Space

```
Ý tưởng ĐƠNG GIẢN NHẤT:
  Bước 1: Bỏ tất cả giá trị (≠ -1) vào Set → O(n)
  Bước 2: Với mỗi i, check set.has(i) → O(1) mỗi lần
  Bước 3: Có → arr[i] = i, Không → arr[i] = -1

  → An toàn, dễ hiểu, KHÔNG có bug ghi đè!
  → Nhưng tốn O(n) extra space
```

```javascript
function rearrangeHash(arr) {
  const n = arr.length;

  // Bước 1: Thu thập tất cả giá trị vào Set
  const present = new Set();
  for (const val of arr) {
    if (val !== -1) {
      present.add(val);
    }
  }

  // Bước 2: Build kết quả
  for (let i = 0; i < n; i++) {
    arr[i] = present.has(i) ? i : -1;
  }

  return arr;
}
// Time: O(n), Space: O(n) — Set chứa tối đa n phần tử
```

### Trace Hash Set: arr = [-1, -1, 6, 1, 9, 3, 2, -1, 4, -1]

```
  Bước 1: Build Set
    Duyệt: -1(skip), -1(skip), 6, 1, 9, 3, 2, -1(skip), 4, -1(skip)
    Set = {6, 1, 9, 3, 2, 4}

  Bước 2: Build kết quả
    i=0: set.has(0)? NO  → arr[0] = -1
    i=1: set.has(1)? YES → arr[1] = 1
    i=2: set.has(2)? YES → arr[2] = 2
    i=3: set.has(3)? YES → arr[3] = 3
    i=4: set.has(4)? YES → arr[4] = 4
    i=5: set.has(5)? NO  → arr[5] = -1
    i=6: set.has(6)? YES → arr[6] = 6
    i=7: set.has(7)? NO  → arr[7] = -1
    i=8: set.has(8)? NO  → arr[8] = -1
    i=9: set.has(9)? YES → arr[9] = 9

  Output: [-1, 1, 2, 3, 4, -1, 6, -1, -1, 9] ✅

  Ưu: code CỰC KỲ đơn giản, KHÔNG SỢ bug!
  Nhược: tốn O(n) space cho Set
```

---

### Approach 3: In-place Swap — O(n) Time, O(1) Space ⭐

```mermaid
graph TD
    A["Duyệt i = 0 → n-1"] --> B{"arr[i] = ?"}
    B -->|"arr[i] = i"| C["✅ Đúng chỗ → skip, i++"]
    B -->|"arr[i] = -1"| D["❌ Trống → skip, i++"]
    B -->|"arr[i] ≠ i VÀ ≠ -1"| E{"arr[arr[i]] đã đúng?"}
    E -->|"arr[arr[i]] ≠ arr[i]"| F["🔄 Swap arr[i] ↔ arr[arr[i]]"]
    F -->|"KHÔNG i++! Xét lại arr[i] mới"| B
    E -->|"arr[arr[i]] = arr[i]"| G["Duplicate? arr[i] = -1, i++"]

    style C fill:#4CAF50,color:white
    style D fill:#FF9800,color:white
    style F fill:#2196F3,color:white
```

```
TƯ TƯỞNG CHUỖI SWAP:

  Mỗi phần tử "BIẾT" vị trí đúng của nó!
  arr[i] = v → v phải ở vị trí v → swap arr[i] ↔ arr[v]!

  Dùng WHILE thay for ở bước swap vì:
    Sau 1 swap, phần tử MỚI ở arr[i] CÓ THỂ cũng sai chỗ!
    → Phải tiếp tục swap cho đến khi:
       arr[i] = i (đúng chỗ) HOẶC arr[i] = -1 (trống)

  Mỗi phần tử swap về đúng vị trí TỐI ĐA 1 LẦN → O(n) tổng!
```

```javascript
function rearrangeInPlace(arr) {
  const n = arr.length;

  for (let i = 0; i < n; i++) {
    // Tiếp tục swap cho đến khi arr[i] đúng chỗ hoặc trống
    while (arr[i] !== -1 && arr[i] !== i) {
      const correctPos = arr[i];  // vị trí đúng của giá trị arr[i]

      // Swap arr[i] về đúng vị trí
      [arr[i], arr[correctPos]] = [arr[correctPos], arr[i]];
    }
  }

  return arr;
}
// Time: O(n) — mỗi phần tử swap tối đa 1 lần!
// Space: O(1) — in-place!
```

### Trace In-place Swap: arr = [-1, -1, 6, 1, 9, 3, 2, -1, 4, -1]

```
  i=0: arr[0]=-1 → skip (trống)
       arr = [-1, -1, 6, 1, 9, 3, 2, -1, 4, -1]

  i=1: arr[1]=-1 → skip (trống)
       arr = [-1, -1, 6, 1, 9, 3, 2, -1, 4, -1]

  i=2: arr[2]=6, 6≠2, 6≠-1 → SWAP!
       correctPos = 6
       swap arr[2] ↔ arr[6]: arr[2]=2, arr[6]=6
       arr = [-1, -1, 2, 1, 9, 3, 6, -1, 4, -1]

       arr[2]=2 = i=2 → ĐÚNG CHỖ! while dừng ✅

  i=3: arr[3]=1, 1≠3, 1≠-1 → SWAP!
       correctPos = 1
       swap arr[3] ↔ arr[1]: arr[3]=-1, arr[1]=1
       arr = [-1, 1, 2, -1, 9, 3, 6, -1, 4, -1]

       arr[3]=-1 → while dừng (trống) ✅

  i=4: arr[4]=9, 9≠4, 9≠-1 → SWAP!
       correctPos = 9
       swap arr[4] ↔ arr[9]: arr[4]=-1, arr[9]=9
       arr = [-1, 1, 2, -1, -1, 3, 6, -1, 4, 9]

       arr[4]=-1 → while dừng ✅

  i=5: arr[5]=3, 3≠5, 3≠-1 → SWAP!
       correctPos = 3
       swap arr[5] ↔ arr[3]: arr[5]=-1, arr[3]=3
       arr = [-1, 1, 2, 3, -1, -1, 6, -1, 4, 9]

       arr[5]=-1 → while dừng ✅

  i=6: arr[6]=6 = i=6 → ĐÚNG CHỖ! skip ✅

  i=7: arr[7]=-1 → skip ✅

  i=8: arr[8]=4, 4≠8, 4≠-1 → SWAP!
       correctPos = 4
       swap arr[8] ↔ arr[4]: arr[8]=-1, arr[4]=4
       arr = [-1, 1, 2, 3, 4, -1, 6, -1, -1, 9]

       arr[8]=-1 → while dừng ✅

  i=9: arr[9]=9 = i=9 → ĐÚNG CHỖ! skip ✅

  KẾT QUẢ: [-1, 1, 2, 3, 4, -1, 6, -1, -1, 9] ✅
```

### Tại sao O(n) mà có while loop?

```
⚠️ CÂU HỎI HAY GẶP TRONG PHỎNG VẤN:
  "for + while bên trong → O(n²) chứ?"

  KHÔNG! Vì:
    Mỗi phần tử swap VỀ ĐÚNG VỊ TRÍ chỉ 1 LẦN!
    Sau khi swap xong → KHÔNG BAO GIỜ bị swap lại!

    Tổng số swap = tổng phần tử sai chỗ ≤ n
    → Amortized O(n)!

  CHỨNG MINH:
    Biến đếm "số phần tử đúng chỗ" CHỈ TĂNG, không giảm
    → Mỗi swap: +1 phần tử đúng chỗ (ít nhất)
    → Tối đa n swap → O(n) tổng!

  📌 Tương tự: Monotonic Stack cũng O(n) dù có while
    → "Mỗi phần tử vào/ra 1 lần" = amortized O(n)
```

---

## Trace thêm: arr = [2, 0, 1]

```
  i=0: arr[0]=2, 2≠0 → SWAP arr[0] ↔ arr[2]
       arr = [1, 0, 2]
       arr[0]=1, 1≠0 → SWAP arr[0] ↔ arr[1]
       arr = [0, 1, 2]
       arr[0]=0 = i → ĐÚNG! while dừng ✅

  i=1: arr[1]=1 = i → skip ✅
  i=2: arr[2]=2 = i → skip ✅

  KẾT QUẢ: [0, 1, 2] ✅

  CHUỖI SWAP chỉ ở i=0: 2 swaps
  Sau đó mọi thứ đã đúng → O(n) tổng!
```

---

## 🔬 Deep Dive — Giải thích CHI TIẾT In-place Swap

> 💡 Phân tích **từng dòng** để hiểu **TẠI SAO**.

```javascript
function rearrangeInPlace(arr) {
  const n = arr.length;

  // ═══════════════════════════════════════════════════════════
  // WHILE, không phải IF!
  // ═══════════════════════════════════════════════════════════
  //
  // TẠI SAO while?
  //   Sau 1 swap, phần tử MỚI ở arr[i] CŨNG có thể sai chỗ!
  //   → Phải tiếp tục swap cho đến khi:
  //     arr[i] = i (OK!) HOẶC arr[i] = -1 (trống!)
  //
  // TẠI SAO không infinite loop?
  //   Mỗi swap đưa 1 phần tử về ĐÚNG VỊ TRÍ!
  //   → Số phần tử "đúng chỗ" CHỈ TĂNG, không giảm!
  //   → Tối đa n swap → terminate!
  //
  for (let i = 0; i < n; i++) {

    while (arr[i] !== -1 && arr[i] !== i) {
      // ─── Lưu correctPos TRƯỚC khi swap! ───
      //
      // ⚠️ Bẫy JS: destructuring swap có thể sai!
      //   [arr[i], arr[arr[i]]] = [arr[arr[i]], arr[i]]
      //   → arr[i] thay đổi TRƯỚC → arr[arr[i]] sai index!
      //   → PHẢI lưu const correctPos = arr[i] trước!
      //
      const correctPos = arr[i];

      // ─── Swap: đưa arr[i] về đúng vị trí correctPos ───
      //
      // Sau swap:
      //   arr[correctPos] = correctPos (đúng chỗ!)
      //   arr[i] = giá trị cũ của arr[correctPos]
      //   → Xét tiếp arr[i] mới (while lặp lại!)
      //
      [arr[i], arr[correctPos]] = [arr[correctPos], arr[i]];
    }
  }

  return arr;
}
```

```mermaid
flowchart TD
    subgraph SWAP["⭐ In-place Swap Logic"]
        A["i = 0"] --> B{"arr[i] = -1\nHOẶC arr[i] = i?"}
        B -->|"YES"| C["Skip → i++"]
        B -->|"NO"| D["correctPos = arr[i]"]
        D --> E["swap arr[i] ↔ arr[correctPos]"]
        E --> F["arr[correctPos] = correctPos ✅"]
        E --> G["arr[i] = giá trị mới"]
        G --> B
        C --> H{"i < n?"}
        H -->|"YES"| B
        H -->|"NO"| I["✅ Done!"]
    end

    style E fill:#2196F3,color:white
    style F fill:#4CAF50,color:white
    style I fill:#4CAF50,color:white
```

---

## 📐 Invariant — Chứng minh tính đúng đắn

```
  📐 INVARIANT:

  Sau khi xử lý vị trí i:
    ∀ j ≤ i: arr[j] = j (nếu j có trong mảng gốc)
                 HOẶC arr[j] = -1 (nếu j KHÔNG có)

  Chứng minh:
  ┌──────────────────────────────────────────────────────────────┐
  │  Base: i=0, chưa xử lý → invariant trivially true ✅      │
  │                                                              │
  │  Inductive: xử lý vị trí i:                                 │
  │    Case 1: arr[i] = i → đã đúng, skip ✅                    │
  │    Case 2: arr[i] = -1 → giá trị i không tồn tại, skip ✅   │
  │    Case 3: arr[i] = v, v ≠ i, v ≠ -1:                       │
  │      → Swap arr[i] ↔ arr[v]                                 │
  │      → arr[v] = v (đúng chỗ!) ✅                              │
  │      → arr[i] = giá trị cũ của arr[v] → lặp lại!            │
  │      → While dừng khi arr[i] = i hoặc -1 ✅                │
  │                                                              │
  │  Termination:                                                │
  │    Mỗi swap tăng số phần tử "đúng chỗ" ít nhất 1           │
  │    Tối đa n phần tử → tối đa n swaps → terminate! ∎       │
  └──────────────────────────────────────────────────────────────┘

  📐 AMORTIZED O(n) PROOF:
    Định nghĩa: Φ = số phần tử ở SAI vị trí
    Ban đầu: Φ ≤ n
    Mỗi swap: Φ giảm ít nhất 1 (1 phần tử về đúng chỗ)
    While dừng: Φ = 0 cho tất cả vị trí đã xét
    Tổng swaps: ≤ n → O(n)! ∎

  📐 TẠI SAO SWAP KHÔNG PHÁ HỦY phần tử đã đúng?
    Khi swap arr[i] ↔ arr[v]:
      arr[v] = v → đúng chỗ! KHÔNG BAO GIỜ bị swap lại!
    Vì while check: arr[i] !== i → nếu arr[i] = i, skip!
    → Phần tử đã đúng chỗ ĐƯỢC BẢO VỆ! ∎
```

---

## So sánh các Approach

```
                    Brute Force       Hash Set          In-place Swap
  ────────────────────────────────────────────────────────────────────
  Time              O(n²)             O(n) ✅            O(n) ✅
  Space             O(1) ✅            O(n)              O(1) ✅
  Độ khó code       Dễ nhưng DỄ BUG   Dễ nhất ⭐        Trung bình
  In-place?         ✅                ❌                ✅
  Phỏng vấn         ❌ Quá chậm       ✅ Acceptable     ⭐ Best answer!

  💡 Strategy phỏng vấn:
    1. NÓI Brute Force trước (30 giây) → show you think systematically
    2. VIẾT Hash Set (nếu cần code nhanh) → clear & correct
    3. OPTIMIZE sang In-place Swap → impress interviewer!
```

### Complexity chính xác — Đếm operations

```
  In-place Swap:
    Outer loop: n iterations
    Tổng swaps (inner while): ≤ n (mỗi phần tử swap đúng chỗ 1 lần)
    Mỗi swap: 1 so sánh + 1 gán + 1 swap (3 ops)
    TỔNG: 3n + n = 4n operations

  Hash Set:
    Pass 1: n hash inserts
    Pass 2: n hash lookups + n gán
    TỔNG: 3n operations (nhưng +O(n) RAM!)

  📊 So sánh THỰC TẾ (n = 10⁶):
    In-place: 4×10⁶ ops, 0 extra RAM ⭐
    Hash Set: 3×10⁶ ops, ~8MB RAM 😰
    Brute:    10¹² ops 💀
```

---

## ❌ Common Mistakes — Lỗi thường gặp

```mermaid
graph TD
    START["🚨 Common Mistakes"] --> M1["Mistake #1\nDùng if thay while"]
    START --> M2["Mistake #2\nSwap không lưu\ncorrectPos"]
    START --> M3["Mistake #3\nQuên -1 trong\nwhile condition"]
    START --> M4["Mistake #4\nBrute force\nghi đè -1"]

    M1 --> M1a["❌ if: chỉ swap 1 lần"]
    M1 --> M1b["✅ while: swap chain!"]

    M2 --> M2a["❌ arr[arr[i]] sai\nsau khi gán arr[i]"]
    M2 --> M2b["✅ const pos = arr[i]\ntrước khi swap"]

    M3 --> M3a["❌ while(arr[i]!==i)\ninfinite loop!"]
    M3 --> M3b["✅ while(arr[i]!==-1\n&& arr[i]!==i)"]

    M4 --> M4a["❌ arr[i]=-1 xóa\ngiá trị cần thiết"]
    M4 --> M4b["✅ Dùng swap hoặc\nmảng mới"]

    style M1a fill:#FFCDD2,stroke:#F44336
    style M2a fill:#FFCDD2,stroke:#F44336
    style M3a fill:#FFCDD2,stroke:#F44336
    style M4a fill:#FFCDD2,stroke:#F44336
    style M1b fill:#C8E6C9,stroke:#4CAF50
    style M2b fill:#C8E6C9,stroke:#4CAF50
    style M3b fill:#C8E6C9,stroke:#4CAF50
    style M4b fill:#C8E6C9,stroke:#4CAF50
    style START fill:#FF9800,color:white
```

### Mistake 1: Dùng if thay vì while!

```javascript
// ❌ SAI: chỉ swap 1 lần!
if (arr[i] !== -1 && arr[i] !== i) {
  const pos = arr[i];
  [arr[i], arr[pos]] = [arr[pos], arr[i]];
}
// arr = [2, 0, 1] → sau i=0: [1, 0, 2] → arr[0]=1 vẫn SAI!

// ✅ ĐÚNG: while loop!
while (arr[i] !== -1 && arr[i] !== i) {
  const pos = arr[i];
  [arr[i], arr[pos]] = [arr[pos], arr[i]];
}
// arr = [2, 0, 1] → swap 2→2 → [1,0,2] → swap 1→1 → [0,1,2] ✅
```

### Mistake 2: Swap JS destructuring trap!

```javascript
// ❌ SAI: arr[i] thay đổi TRƯỚC khi đọc arr[arr[i]]!
[arr[i], arr[arr[i]]] = [arr[arr[i]], arr[i]];
// JS evaluate left-to-right: arr[i] gán trước
// → arr[arr[i]] dùng arr[i] MỚI (sai index!)

// ✅ ĐÚNG: Lưu index TRƯỚC!
const correctPos = arr[i];
[arr[i], arr[correctPos]] = [arr[correctPos], arr[i]];
```

### Mistake 3: Quên check -1 → infinite loop!

```javascript
// ❌ SAI: không check -1!
while (arr[i] !== i) { /* swap */ }
// arr[i] = -1 → -1 !== i LUÔN true → INFINITE LOOP!

// ✅ ĐÚNG: check CẢ HAI!
while (arr[i] !== -1 && arr[i] !== i) { /* swap */ }
```

### Mistake 4: Brute force ghi đè giá trị cần thiết!

```
  arr = [-1, -1, 6, 1, ...]
  i=0: tìm 0 → không có → arr[0] = -1   (OK, vốn là -1)
  i=8: tìm 8 → không có → arr[8] = -1   ← nhưng arr[8]=9!
       → GHI ĐÈ giá trị 9! 9 bị MẤT!

  ✅ FIX: Dùng Hash Set hoặc In-place Swap (không ghi đè!)
```

---

## O — Optimize

```
                Time     Space    Ghi chú
  ──────────────────────────────────────────────────────
  Brute Force   O(n²)    O(1)     Dễ bug, quá chậm
  Hash Set      O(n)     O(n)     Dễ nhất, safe
  In-place ⭐   O(n)     O(1)     Tối ưu!
```

---

## T — Test

```
Test Cases:
  [-1,-1,6,1,9,3,2,-1,4,-1] → [-1,1,2,3,4,-1,6,-1,-1,9] ✅
  [0,1,2,3,4,5]              → [0,1,2,3,4,5]              ✅ đã đúng
  [-1,-1,-1]                  → [-1,-1,-1]                  ✅ tất cả thiếu
  [2,0,1]                     → [0,1,2]                     ✅ tất cả sai chỗ
  [0]                         → [0]                         ✅ n=1
  [1,0]                       → [0,1]                       ✅ swap 1 lần
```

---

## 🗣️ Interview Script

### 🎙️ Think Out Loud — Mô phỏng phỏng vấn thực

```
  ──────────────── PHASE 1: Clarify ────────────────

  👤 Interviewer: "Rearrange array so arr[i] = i.
                   Values 0 to n-1, missing ones become -1."

  🧑 You: "Let me clarify:
   1. Values are in [0, n-1], each appears at most once.
   2. Some values are missing — those positions get -1.
   3. I need to place each value at its matching index.
   4. Can I modify the array in-place?"

  ──────────────── PHASE 2: Examples ────────────────

  🧑 You: "Take [-1, -1, 6, 1, 9, 3, 2, -1, 4, -1].
   Value 1 should go to index 1, value 6 to index 6, etc.
   Values 0, 5, 7, 8 don't exist → those indices get -1.
   Result: [-1, 1, 2, 3, 4, -1, 6, -1, -1, 9]."

  ──────────────── PHASE 3: Approach ────────────────

  🧑 You: "Three approaches:

   1. Brute force O(n²): for each i, search for i in array.
   2. HashSet O(n)/O(n): collect values, then build result.
   3. In-place swap O(n)/O(1): since each value IS its
      target index, I can swap it directly to arr[value].

   I'll implement the swap approach. Key insight:
   value v at index i means v should be at index v.
   I swap arr[i] and arr[v] using a while loop until
   arr[i] is either correct (= i) or empty (= -1).

   Each element swaps to its correct position at most once,
   so total swaps ≤ n → amortized O(n)."

  ──────────────── PHASE 4: Code + Verify ────────────────

  🧑 You: [writes code, traces [2, 0, 1] example]

  "Important: I save correctPos = arr[i] before swapping
   to avoid the JS destructuring left-to-right eval bug."

  ──────────────── PHASE 5: Follow-ups ────────────────

  👤 "How does this relate to cyclic sort?"
  🧑 "This IS cyclic sort! Same pattern: values in [0,n-1]
      mean value = target index. Swap to correct position.
      Used in Find Missing Number, Find Duplicates, etc."

  👤 "Why while, not if?"
  🧑 "After one swap, the NEW value at arr[i] might also
      be misplaced. The while continues until it's settled.
      But total swaps still ≤ n — amortized O(n)."

  👤 "What if the range is [1, n] instead of [0, n-1]?"
  🧑 "Same idea, just offset by 1: target position for
      value v is arr[v-1] = v. Change correctPos = arr[i] - 1."
```

---

## 📚 Bài tập liên quan — Practice Problems

### Progression Path

```mermaid
graph LR
    A["⭐ Rearrange arr[i]=i\n(BÀI NÀY)"] -->|"tìm missing"| B["#268 Missing\nNumber"]
    A -->|"tìm dup"| C["#287 Find\nDuplicate"]
    A -->|"tìm all"| D["#448 Find All\nMissing"]
    A -->|"hard"| E["#41 First Missing\nPositive"]

    style A fill:#4CAF50,color:white
    style E fill:#F44336,color:white
    style D fill:#2196F3,color:white
```

### 1. First Missing Positive (#41) — Hard

```
  Đề: Tìm số dương NHỎ NHẤT không có trong mảng.

  function firstMissingPositive(nums) {
    const n = nums.length;

    // Cyclic sort: đặt nums[i] vào vị trí nums[i]-1
    for (let i = 0; i < n; i++) {
      while (nums[i] > 0 && nums[i] <= n
              && nums[nums[i]-1] !== nums[i]) {
        const pos = nums[i] - 1;  // 1-indexed!
        [nums[i], nums[pos]] = [nums[pos], nums[i]];
      }
    }

    // Tìm vị trí đầu tiên sai
    for (let i = 0; i < n; i++) {
      if (nums[i] !== i + 1) return i + 1;
    }
    return n + 1;
  }

  📌 CÙNG PATTERN: swap về đúng chỗ!
     Bài này: 0-indexed, target = i
     #41: 1-indexed, target = i+1, filter > 0 && <= n
```

### 2. Find All Disappeared Numbers (#448) — Easy

```
  Đề: Tìm TẤT CẢ số thiếu trong [1,n].

  function findDisappearedNumbers(nums) {
    // Cyclic sort
    for (let i = 0; i < nums.length; i++) {
      while (nums[i] !== nums[nums[i]-1]) {
        const pos = nums[i] - 1;
        [nums[i], nums[pos]] = [nums[pos], nums[i]];
      }
    }
    // Thu thập missing
    const result = [];
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] !== i + 1) result.push(i + 1);
    }
    return result;
  }

  📌 Sau cyclic sort: nums[i] ≠ i+1 → (i+1) thiếu!
```

### 3. Set Mismatch (#645) — Easy

```
  Đề: Trong [1,n], 1 số lặp 2 lần, 1 số bị thiếu.

  function findErrorNums(nums) {
    // Cyclic sort
    for (let i = 0; i < nums.length; i++) {
      while (nums[i] !== nums[nums[i]-1]) {
        const pos = nums[i] - 1;
        [nums[i], nums[pos]] = [nums[pos], nums[i]];
      }
    }
    // Tìm vị trí sai: nums[i] ≠ i+1
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] !== i + 1) return [nums[i], i + 1];
      //                              dup       missing
    }
  }

  📌 Cyclic sort → tìm "ai ngồi nhầm" → ra cả 2!
```

### Tổng kết — Cyclic Sort Family

```
  ┌──────────────────────────────────────────────────────────────┐
  │  BÀI                     │  Sau Cyclic Sort                 │
  ├──────────────────────────────────────────────────────────────┤
  │  Rearrange arr[i]=i ⭐  │  Xong! arr[i]=i hoặc -1         │
  │  #268 Missing Number     │  arr[i]≠i+1 → (i+1) thiếu      │
  │  #448 Find All Missing   │  collect tất cả arr[i]≠i+1     │
  │  #287 Find Duplicate     │  arr[i]≠i+1 → nums[i] là dup   │
  │  #645 Set Mismatch       │  arr[i]≠i+1 → dup + missing    │
  │  #41 First Missing Pos   │  arr[i]≠i+1 → return i+1       │
  └──────────────────────────────────────────────────────────────┘

  📌 CÙNG 1 PATTERN! Chỉ khác ở bước DÒ SAU cyclic sort!
```

### Skeleton code — Reusable Cyclic Sort template

```javascript
// TEMPLATE: Cyclic Sort cho range [0..n-1] hoặc [1..n]
function cyclicSort(arr, offset = 0) {
  // offset = 0: values 0..n-1, target arr[i] = i
  // offset = 1: values 1..n, target arr[i] = i+1

  for (let i = 0; i < arr.length; i++) {
    while (
      arr[i] !== i + offset &&     // chưa đúng chỗ
      arr[i] >= offset &&           // trong range
      arr[i] < arr.length + offset &&
      arr[i] !== arr[arr[i] - offset]  // tránh dup/infinite
    ) {
      const pos = arr[i] - offset;
      [arr[i], arr[pos]] = [arr[pos], arr[i]];
    }
  }
  return arr;
}

// Bài này: cyclicSort(arr, 0) + replace mismatches with -1
// #41:    cyclicSort(nums, 1) + find first mismatch
// #448:   cyclicSort(nums, 1) + collect all mismatches
// #645:   cyclicSort(nums, 1) + find [dup, missing]
```

---

## 📌 Kỹ năng chuyển giao — Pattern "Cyclic Sort"

```mermaid
graph TD
    A["Đề nói 'giá trị 0..n-1' hoặc '1..n'?"] -->|Yes| B{"Hỏi gì?"}
    B -->|"Rearrange arr[i]=i"| C["Swap về đúng chỗ ⭐"]
    B -->|"Find missing number"| D["Cyclic Sort → check arr[i]≠i"]
    B -->|"Find duplicate"| E["Cyclic Sort → arr[i]=arr[arr[i]]"]
    B -->|"Find all missing"| F["Cyclic Sort → collect i where arr[i]≠i"]

    style C fill:#4CAF50,color:white
    style D fill:#2196F3,color:white
    style E fill:#FF9800,color:white
    style F fill:#9C27B0,color:white
```

---

## 📊 Tổng kết — Key Insights

```mermaid
graph LR
    subgraph SUMMARY["📌 Tổng kết"]
        direction TB
        S1["1. Value = Index mục tiêu"] --> S2["2. Swap về đúng chỗ"]
        S2 --> S3["3. while (!=i && !=-1)"]
        S3 --> S4["4. Amortized O(n)"]
    end

    subgraph KEY["🔑 Key Insights"]
        K1["Tín hiệu:\nvalues 0..n-1"]
        K2["Cyclic Sort:\nswap chain"]
        K3["while not if:\nphần tử mới cũng sai!"]
        K4["Mỗi phần tử\nswap 1 lần max"]
    end

    S1 -.- K1
    S2 -.- K2
    S3 -.- K3
    S4 -.- K4

    style S2 fill:#4CAF50,color:white
    style S3 fill:#FF9800,color:white
    style K4 fill:#C8E6C9,stroke:#4CAF50
```

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  📌 3 ĐIỀU PHẢI NHỚ                                                    │
  │                                                                          │
  │  1. CYCLIC SORT PATTERN: "Value 0..n-1 = Index mục tiêu"               │
  │     → arr[i] = v → swap arr[i] ↔ arr[v]!                             │
  │     → Dùng WHILE (không if!) vì swap chain!                           │
  │     → Dừng khi arr[i] = i (đúng) hoặc -1 (trống)                     │
  │                                                                          │
  │  2. AMORTIZED O(n): for + while = VẪN O(n)!                            │
  │     → Mỗi phần tử swap đúng chỗ TỐI ĐA 1 lần                         │
  │     → Tổng swaps ≤ n → O(n)!                                          │
  │     → Tương tự Monotonic Stack: mỗi item vào/ra 1 lần!              │
  │                                                                          │
  │  3. JS TRAP: Lưu correctPos TRƯỚC khi swap!                             │
  │     → const pos = arr[i]; // rồi mới swap!                            │
  │     → Destructuring [arr[i], arr[arr[i]]] evaluate LEFT-TO-RIGHT!     │
  │     → Quên = SAI INDEX!                                                 │
  └──────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Flashcard — Tự kiểm tra

| ❓ Câu hỏi | ✅ Đáp án |
|---|---|
| Bài này yêu cầu gì? | **arr[i] = i** nếu i tồn tại, **-1** nếu không |
| Pattern? | **Cyclic Sort** — swap về đúng chỗ |
| Tại sao while không if? | Phần tử **mới** swap vào cũng có thể sai chỗ! |
| While dừng khi nào? | **arr[i] = i** (ok) hoặc **arr[i] = -1** (trống) |
| Tại sao O(n)? | Mỗi phần tử swap đúng chỗ **tối đa 1 lần** → amortized! |
| JS trap? | Lưu **const pos = arr[i]** TRƯỚC khi swap! |
| Approach tối ưu? | **In-place Swap** O(n)/O(1) |
| Bài liên quan? | **#41, #268, #287, #448, #645** — Cyclic Sort family |
| Tín hiệu? | **"Values 0..n-1"** hoặc **"1..n"** |
| TẠI SAO không HashMap? | HashMap tốn **O(n) space** — swap O(1)! |
