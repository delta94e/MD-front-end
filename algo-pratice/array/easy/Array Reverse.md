# 🔁 Array Reverse — GfG (Easy)

> 📖 Code: [Array Reverse.js](./Array%20Reverse.js)

```mermaid
graph TD
    A["🔁 Array Reverse"] --> B{"Approach?"}
    B --> C["Temp Array O(n) space"]
    B --> D["Two Pointers O(1) ⭐"]
    B --> E["For loop mirror"]

    D --> D1["L = 0, R = n-1"]
    D1 --> D2{"L < R?"}
    D2 -->|Yes| D3["swap arr[L] ↔ arr[R]"]
    D3 --> D4["L++, R--"]
    D4 --> D2
    D2 -->|No| D5["✅ Done!"]

    style D fill:#4CAF50,color:white
    style D5 fill:#FF5722,color:white
```

```mermaid
graph LR
    subgraph "Two Pointers — Opposite Direction"
        L["L →"] --- M["... swap ..."] --- R["← R"]
    end

    subgraph "Building Block cho"
        B1["Rotate Array"]
        B2["Palindrome Check"]
        B3["Reverse String"]
        B4["Container With Most Water"]
    end
```

---

## R — Repeat & Clarify

🧠 *"Reverse = đổi đầu thành cuối. Two Pointers swap từ 2 đầu vào giữa = O(n), O(1)!"*

> 🎙️ *"Reverse the array in-place so the first element becomes last, second becomes second-last, and so on."*

### Clarification Questions

```
Q: In-place hay tạo mảng mới?
A: In-place (tối ưu), nhưng cũng có thể tạo mới

Q: Mảng rỗng hoặc 1 phần tử?
A: Giữ nguyên — đã tự reverse!

Q: Mảng chẵn/lẻ phần tử?
A: Lẻ → phần tử GIỮA giữ nguyên!

Q: Array có thể chứa gì?
A: Bất kỳ — numbers, strings, objects. Logic KHÔNG phụ thuộc value!
```

### Tại sao bài này quan trọng?

```
  Reverse Array là BUILDING BLOCK cơ bản nhất!

  Dùng trong:
  1. Rotate Array      → reverse 3 lần!
  2. Palindrome Check  → reverse rồi so sánh
  3. Reverse String    → cùng logic!
  4. Reverse LinkedList → tương tự pattern

  Concept: TWO POINTERS — OPPOSITE DIRECTION
  → Một trong những pattern quan trọng nhất của Array!
```

---

## E — Examples

```
VÍ DỤ 1 (Even length):
  Input:  [1, 4, 3, 2, 6, 5]
  Output: [5, 6, 2, 3, 4, 1]

  Minh họa TỪNG BƯỚC swap:

  Ban đầu: [1, 4, 3, 2, 6, 5]
            L→              ←R

  Step 1:   swap arr[0] ↔ arr[5]
            [5, 4, 3, 2, 6, 1]
               L→        ←R

  Step 2:   swap arr[1] ↔ arr[4]
            [5, 6, 3, 2, 4, 1]
                  L→  ←R

  Step 3:   swap arr[2] ↔ arr[3]
            [5, 6, 2, 3, 4, 1]
                   L=R  ← gặp nhau → STOP!

  Tổng: 3 swaps = n/2 = 6/2 ✅

VÍ DỤ 2 (Odd length — phần tử giữa giữ nguyên):
  Input:  [1, 2, 3, 4, 5]
  Output: [5, 4, 3, 2, 1]

  Step 1: swap(1, 5)  → [5, 2, 3, 4, 1]
  Step 2: swap(2, 4)  → [5, 4, 3, 2, 1]
  Step 3: L=2, R=2 → L >= R → STOP!

         Phần tử GIỮA (3) giữ nguyên! ✅
         → Không cần xử lý đặc biệt — while tự dừng!
```

### Edge Cases

```
  [1, 2]  → [2, 1]     ← 1 swap
  [7]     → [7]         ← 0 swaps (L=0, R=0 → L >= R ngay!)
  []      → []          ← 0 swaps (L=0, R=-1 → L >= R ngay!)
```

### Mirror Index — công thức TOÁN

```
  Mỗi phần tử swap với "bạn gương" (mirror) của nó:
  
    index i → swap với index (n - 1 - i)

    n=6:
      0 ↔ 5    (0 + 5 = 5 = n-1)
      1 ↔ 4    (1 + 4 = 5 = n-1)
      2 ↔ 3    (2 + 3 = 5 = n-1)

    TỔNG QUÁT: i + mirror(i) = n - 1 (LUÔN LUÔN!)
    → mirror(i) = n - 1 - i
```

---

## A — Approach

### Approach 1: Temporary Array — O(n) Space

```
  Tạo mảng mới, copy phần tử NGƯỢC:
    temp[0] = arr[n-1]
    temp[1] = arr[n-2]
    ...
    temp[i] = arr[n - 1 - i]

  Rồi copy temp → arr

  ⚠️ Tốn O(n) THÊM bộ nhớ!
  ⚠️ Duyệt 2 lần (copy ngược + copy lại)
  → LÃNG PHÍ! Dùng Two Pointers thay!
```

### Approach 2: Two Pointers — O(1) Space ✅

```
💡 Ý tưởng: 2 con trỏ từ 2 ĐẦU, tiến vào GIỮA!

  LEFT starts at 0 (đầu mảng)
  RIGHT starts at n-1 (cuối mảng)

  L →                       ← R
  [1,  4,  3,  2,  6,  5]
   ↑                    ↑
   swap!

  Mỗi bước:
    1. swap(arr[L], arr[R])  ← đổi 2 đầu
    2. L++                    ← tiến 1 bước vào
    3. R--                    ← lùi 1 bước vào

  Dừng khi: L >= R (đã gặp nhau hoặc qua nhau)

  Tại sao đúng?
    → Mỗi cặp (L, R) swap đúng 1 lần
    → Sau n/2 swaps, TẤT CẢ đã đổi chỗ
    → Phần tử giữa (nếu odd) không cần swap (L = R → skip)
```

### Approach 3: For loop — dùng mirror index

```
💡 Giống Two Pointers nhưng viết bằng for loop:

  for i = 0 → n/2 - 1:
    swap arr[i] ↔ arr[n - 1 - i]

  Chỉ duyệt NỬA ĐẦU! (i < n/2)
  Mirror index = n - 1 - i

  ⚠️ Math.floor(n/2) — quan trọng cho odd length!
     n=5: Math.floor(5/2) = 2 → i = 0, 1 → 2 swaps
     n=6: Math.floor(6/2) = 3 → i = 0, 1, 2 → 3 swaps
```

### Approach 4: Built-in arr.reverse()

```
JS có method sẵn! arr.reverse() đảo in-place.
Nhưng phỏng vấn LUÔN bắt tự implement! 😅
→ Hiểu thuật toán quan trọng hơn biết method!
```

---

## C — Code

### Solution 1: Temporary Array — O(n) Space

```javascript
function reverseArrayCopy(arr) {
  const n = arr.length;
  const temp = new Array(n);

  // Copy ngược: temp[i] = arr[cuối - i]
  for (let i = 0; i < n; i++) {
    temp[i] = arr[n - i - 1];
  }

  // Copy temp lại arr
  for (let i = 0; i < n; i++) {
    arr[i] = temp[i];
  }
}
```

### Giải thích Temp Array

```
  temp[i] = arr[n - i - 1]    ← CÔNG THỨC MIRROR!

  Với n=6:
    temp[0] = arr[6-0-1] = arr[5] = 5
    temp[1] = arr[6-1-1] = arr[4] = 6
    temp[2] = arr[6-2-1] = arr[3] = 2
    temp[3] = arr[6-3-1] = arr[2] = 3
    temp[4] = arr[6-4-1] = arr[1] = 4
    temp[5] = arr[6-5-1] = arr[0] = 1

  temp = [5, 6, 2, 3, 4, 1] ✅

  ⚠️ Tại sao n - i - 1 mà không phải n - i?
    Vì array 0-indexed! Index cuối = n-1, không phải n!
    arr = [a, b, c] → n=3, index cuối = 2 = n-1
```

### Solution 2: Two Pointers — O(1) Space ✅

```javascript
function reverseArray(arr) {
  let left = 0, right = arr.length - 1;

  while (left < right) {
    // Destructuring swap — JS magic! ✨
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left++;
    right--;
  }
}
```

### Giải thích từng dòng

```
  let left = 0
    → Con trỏ TRÁI bắt đầu từ ĐẦU mảng

  let right = arr.length - 1
    → Con trỏ PHẢI bắt đầu từ CUỐI mảng
    → ⚠️ length - 1 vì 0-indexed!

  while (left < right)
    → Tiếp tục swap khi chưa gặp nhau
    → L = R: 1 phần tử giữa → KHÔNG cần swap!
    → L > R: tất cả đã swap xong!

  [arr[left], arr[right]] = [arr[right], arr[left]]
    → JS Destructuring Assignment!
    → Swap KHÔNG cần biến temp!
    → Tương đương:
       let temp = arr[left];
       arr[left] = arr[right];
       arr[right] = temp;

  left++; right--;
    → Cả 2 tiến VÀO GIỮA
    → L tăng 1, R giảm 1
```

### Swap — 3 cách viết

```javascript
// Cách 1: Biến temp (truyền thống)
let temp = arr[left];
arr[left] = arr[right];
arr[right] = temp;

// Cách 2: Destructuring (ES6, clean) ✅
[arr[left], arr[right]] = [arr[right], arr[left]];

// Cách 3: XOR swap (trick, KHÔNG NÊN dùng!)
arr[left] ^= arr[right];
arr[right] ^= arr[left];
arr[left] ^= arr[right];
// ⚠️ Chỉ hoạt động với integers! Không hoạt động nếu left = right!
```

### Trace CHI TIẾT: [1, 4, 3, 2, 6, 5]

```
  Ban đầu: left=0, right=5

  ┌─ Iteration 1 ────────────────────────────────────┐
  │  left=0, right=5                                   │
  │  Kiểm tra: 0 < 5? → YES ✅                        │
  │                                                    │
  │  [1, 4, 3, 2, 6, 5]                               │
  │   L→              ←R                               │
  │                                                    │
  │  swap(arr[0], arr[5]) = swap(1, 5)                 │
  │                                                    │
  │  [5, 4, 3, 2, 6, 1]                               │
  │      L→        ←R                                  │
  │                                                    │
  │  left=1, right=4                                   │
  └────────────────────────────────────────────────────┘

  ┌─ Iteration 2 ────────────────────────────────────┐
  │  left=1, right=4                                   │
  │  Kiểm tra: 1 < 4? → YES ✅                        │
  │                                                    │
  │  [5, 4, 3, 2, 6, 1]                               │
  │      L→        ←R                                  │
  │                                                    │
  │  swap(arr[1], arr[4]) = swap(4, 6)                 │
  │                                                    │
  │  [5, 6, 3, 2, 4, 1]                               │
  │         L→  ←R                                     │
  │                                                    │
  │  left=2, right=3                                   │
  └────────────────────────────────────────────────────┘

  ┌─ Iteration 3 ────────────────────────────────────┐
  │  left=2, right=3                                   │
  │  Kiểm tra: 2 < 3? → YES ✅                        │
  │                                                    │
  │  [5, 6, 3, 2, 4, 1]                               │
  │         L→  ←R                                     │
  │                                                    │
  │  swap(arr[2], arr[3]) = swap(3, 2)                 │
  │                                                    │
  │  [5, 6, 2, 3, 4, 1]                               │
  │            LR                                      │
  │                                                    │
  │  left=3, right=2                                   │
  └────────────────────────────────────────────────────┘

  ┌─ End ────────────────────────────────────────────┐
  │  left=3, right=2                                   │
  │  Kiểm tra: 3 < 2? → NO ❌ → STOP!                │
  └────────────────────────────────────────────────────┘

  Kết quả: [5, 6, 2, 3, 4, 1] ✅
  Tổng: 3 swaps = ⌊6/2⌋ = 3 ✅
```

### Solution 3: For loop — mirror index

```javascript
function reverseArrayLoop(arr) {
  const n = arr.length;

  // Chỉ duyệt NỬA ĐẦU!
  for (let i = 0; i < Math.floor(n / 2); i++) {
    // Mirror index: i ↔ (n - 1 - i)
    [arr[i], arr[n - 1 - i]] = [arr[n - 1 - i], arr[i]];
  }
}
```

### Tại sao chỉ duyệt NỬA ĐẦU? (`i < Math.floor(n/2)`)

```
  Vì mỗi lần swap = ĐỔI CHỖ 2 phần tử cùng lúc!

  arr = [1, 2, 3, 4, 5, 6]    n=6

  Nếu duyệt HẾT (i = 0 → 5):
    i=0: swap(arr[0], arr[5]) → [6, 2, 3, 4, 5, 1]  ← swap lần 1
    i=1: swap(arr[1], arr[4]) → [6, 5, 3, 4, 2, 1]
    i=2: swap(arr[2], arr[3]) → [6, 5, 4, 3, 2, 1]  ← OK đến đây!
    i=3: swap(arr[3], arr[2]) → [6, 5, 3, 4, 2, 1]  ← ĐỔI LẠI! 💀
    i=4: swap(arr[4], arr[1]) → [6, 2, 3, 4, 5, 1]  ← ĐỔI LẠI! 💀
    i=5: swap(arr[5], arr[0]) → [1, 2, 3, 4, 5, 6]  ← VỀ GỐC! 💀

  → Duyệt hết = swap 2 LẦN = mảng KHÔNG ĐỔI! Sai hoàn toàn!

  Nếu duyệt NỬA ĐẦU (i = 0 → 2):
    i=0: swap(arr[0], arr[5]) → đổi cặp (0, 5) ✅
    i=1: swap(arr[1], arr[4]) → đổi cặp (1, 4) ✅
    i=2: swap(arr[2], arr[3]) → đổi cặp (2, 3) ✅
    → DỪNG! Mỗi cặp chỉ swap 1 lần!

  📐 Hình dung:
    [1,  2,  3,  4,  5,  6]
     ╰──────────────────╯  i=0 swap cặp (0, 5)
         ╰──────────╯      i=1 swap cặp (1, 4)
             ╰──╯          i=2 swap cặp (2, 3)
     ← NỬA TRÁI →|← NỬA PHẢI →
     i=0, 1, 2    |  được swap TỰ ĐỘNG bởi arr[n-1-i]!

  → Duyệt nửa trái = nửa phải được xử lý CÙNG LÚC qua mirror!

  ⚠️ Mảng LẺ (n=5):
    Math.floor(5/2) = 2 → i = 0, 1
    [1, 2, 3, 4, 5]
     ╰──────────╯  i=0 → swap (0, 4)
         ╰──╯      i=1 → swap (1, 3)
            3       ← phần tử GIỮA → không ai swap → GIỮ NGUYÊN! ✅
```

### Tại sao `arr[n - 1 - i]`? — Suy ra từ đầu!

```
  Câu hỏi: "Phần tử ở index i sau khi reverse sẽ nằm ở đâu?"

  Reverse = phần tử ĐẦU → CUỐI, phần tử CUỐI → ĐẦU

  Quan sát:
    arr = [A, B, C, D, E]     n=5
    index: 0  1  2  3  4

  Sau reverse:
    arr = [E, D, C, B, A]
    index: 0  1  2  3  4

  Phần tử ở index 0 → đi đến index 4 (cuối)     0 → 4 = n-1
  Phần tử ở index 1 → đi đến index 3             1 → 3 = n-2
  Phần tử ở index 2 → đi đến index 2 (giữa)     2 → 2 = n-3
  Phần tử ở index i → đi đến index ???           i → ?

  Tìm PATTERN:
    0 → n-1 = n - 1 - 0
    1 → n-2 = n - 1 - 1
    2 → n-3 = n - 1 - 2
    i → ???  = n - 1 - i  ← CÔNG THỨC!

  KIỂM TRA: i + mirror(i) luôn = n - 1
    0 + 4 = 4 = n-1 ✅
    1 + 3 = 4 = n-1 ✅
    2 + 2 = 4 = n-1 ✅
    → mirror(i) = n - 1 - i ✅

  ⚠️ Tại sao n - 1 mà không phải n?
    Vì array 0-INDEXED!
    n phần tử → index từ 0 → n-1
    Index cuối = n - 1 (KHÔNG PHẢI n!)

    arr = [A, B, C]  →  n = 3
                         index cuối = 2 = n - 1

    Nếu dùng n - i (SAI!):
      i=0: n - 0 = 3 → arr[3] = UNDEFINED! 💀 (out of bounds!)

    Dùng n - 1 - i (ĐÚNG!):
      i=0: n - 1 - 0 = 2 → arr[2] = C ✅ (phần tử cuối!)
```

### So sánh Two Pointers vs For loop

```
  Two Pointers:
    while (left < right)          ← 2 biến
    swap(arr[left], arr[right])
    left++; right--;

  For loop:
    for (i = 0; i < n/2; i++)    ← 1 biến
    swap(arr[i], arr[n-1-i])

  → CÙNG LOGIC! Chỉ khác cách viết:
    left  = i
    right = n - 1 - i
    left < right ↔ i < n/2

  Chọn cái nào?
    → Two Pointers: rõ ràng hơn, dễ mở rộng
    → For loop: ngắn hơn, ít biến hơn
    → Phỏng vấn: Two Pointers (thể hiện biết pattern!)
```

### Solution 4: Built-in

```javascript
arr.reverse(); // JS built-in, in-place, O(n)
```

---

## O — Optimize

```
                  Time      Space     In-place?  Swaps
  ────────────────────────────────────────────────────────
  Temp Array      O(n)      O(n)      ❌         0
  Two Pointers    O(n)      O(1)      ✅ BEST!   n/2
  For loop        O(n)      O(1)      ✅         n/2
  arr.reverse()   O(n)      O(1)      ✅         n/2

  Two Pointers vs For loop:
    → Cùng logic! Two Pointers rõ ràng hơn
    → For loop: i < n/2, mirror = n-1-i
    → Thực chất GIỐNG NHAU, chỉ khác cách viết

  📊 Thực tế:
    n = 1,000,000 → 500,000 swaps
    → ~1ms trên JS engine hiện đại
    → Cực kỳ nhanh, không có approach nào nhanh hơn O(n)!

  ⚠️ Swap mất bao lâu?
    Destructuring swap tạo temporary array [] → JS engine optimize
    Biến temp swap = 3 assignment → slightly faster in some engines
    → Trong thực tế: không đáng kể (negligible difference)
```

---

## T — Test

```
Test Cases:
  [1, 4, 3, 2, 6, 5]  → [5, 6, 2, 3, 4, 1]    ✅ Even length
  [4, 5, 1, 2]         → [2, 1, 5, 4]           ✅ Even length
  [1, 2, 3, 4, 5]      → [5, 4, 3, 2, 1]        ✅ Odd length
  [1, 2]               → [2, 1]                  ✅ Two elements
  [7]                   → [7]                     ✅ Single element
  []                    → []                      ✅ Empty
  [1, 1, 1]            → [1, 1, 1]               ✅ All same

  ⚠️ Common mistakes:
  1. Quên trừ 1: right = arr.length (SAI!) → phải length - 1
  2. Điều kiện sai: left <= right (SAI nếu lẻ → swap phần tử giữa tự nó)
     → left < right mới ĐÚNG! (= thì dừng, không swap)
  3. XOR swap khi left = right → arr[i] ^= arr[i] = 0! 💀
```

---

## 🗣️ Interview Script

### 🎙️ Mô phỏng phỏng vấn thực... theo chuẩn Google

> ⚠️ Script này dạy cách **NÓI**, không phải cách CODE.
> Candidate nói không hoàn hảo... có do dự, tự sửa.
> Interviewer react ngắn, guide bằng câu hỏi, không lecture.

```
╔══════════════════════════════════════════════════════════════╗
║  PART 1: INTRODUCTION                                        ║
╚══════════════════════════════════════════════════════════════╝

  👤 "Hi! Tell me a bit about yourself.
      Your background, what you've been working on lately."

  🧑 "Sure. I'm a frontend engineer, been at it for a few years.
      Mostly working on data-heavy products... tables,
      dashboards, that kind of thing.
      So array manipulation comes up a lot."

  👤 "Oh yeah? Like what?"

  🧑 "Things like pagination, sorting, reordering rows in a table.
      Reversing order for descending sort is something
      I run into pretty often actually."

  👤 "Nice. Okay, let's get into it."

  🧑 "Yeah, let's go."
```

```
╔══════════════════════════════════════════════════════════════╗
║  PART 2: PROBLEM + CLARIFY                                   ║
╚══════════════════════════════════════════════════════════════╝

  👤 "Okay. Here's the problem.

      Given an array, reverse it in-place.
      So the first element becomes the last,
      the second becomes the second-to-last, and so on.

      For example, if the input is one, four, three, two, six, five,
      the output should be five, six, two, three, four, one.

      Take a moment. Let me know when you're ready."

  🧑 "[Reads. Pauses.]

      Okay. So... reverse the array in-place.
      Let me ask a couple of questions."

  👤 "Go ahead."

  🧑 "When you say in-place... does that mean I can't
      return a new array? I have to modify the original?"

  👤 "Correct. Modify the original, return nothing."

  �� "Got it. And what if the array is empty,
      or only has one element?"

  👤 "Empty stays empty. One element stays the same.
      They're already reversed."

  🧑 "Okay, that's what I expected.
      Can I assume the input is always a valid array?
      No null, no undefined?"

  👤 "Yes, always a valid array."

  🧑 "And the values... could be any type?
      Numbers, strings, objects?"

  �� "Any type."

  🧑 "Okay.
      So the logic should only care about positions,
      not the values themselves.
      Does that sound right?"

  👤 "Yes, exactly."

  🧑 "Alright. Should I walk through an approach?"

  👤 "Please."
```

```
╔══════════════════════════════════════════════════════════════╗
║  PART 3: APPROACH                                            ║
╚══════════════════════════════════════════════════════════════╝

  🧑 "[Thinks for a moment.]

      Okay. So the first thing I think of
      is creating a new array and copying elements backwards.
      You'd read from the original right-to-left
      and write into the new array left-to-right.

      That works. But it uses O of n extra space
      for the copy, and we said in-place.
      So that's probably not the way to go."

  👤 "Right. What's the in-place version?"

  🧑 "Two pointers.
      One starts at the left end, one at the right end.
      Swap those two, then move both pointers inward.
      Keep going until they meet in the middle.

      That's O of n over 2 swaps... which is O of n.
      And O of 1 space, just the two pointer variables.

      I think that's the clean solution."

  👤 "Is there another way you could express the same idea?"

  �� "Yeah. A for loop with a mirror index.
      You loop i from 0 to n over 2 minus 1,
      and at each step you swap arr bracket i
      with arr bracket n minus 1 minus i.

      It's the same logic, just written differently.
      Left is i, right is n minus 1 minus i.
      Same number of swaps."

  👤 "Which would you go with?"

  🧑 "Two pointers. It makes the intent clearer.
      You can see the two pointers moving toward each other,
      and the stopping condition reads naturally.

      The for loop version is shorter, but you have to reason
      through the mirror formula to understand what's happening.

      Um... should I trace through an example first
      before writing the code?"

  👤 "Yeah, go ahead."
```

```
╔══════════════════════════════════════════════════════════════╗
║  PART 4: TRACE + CODE                                        ║
╚══════════════════════════════════════════════════════════════╝

  🧑 "Okay, I'll use the example from the problem.
      One, four, three, two, six, five.

      Left starts at index 0, that's one.
      Right starts at index 5, that's five.

      Step one... swap one and five.
      Now the array is five, four, three, two, six, one.
      Left moves to index 1, right moves to index 4.

      Step two... left is four, right is six.
      Swap them. Five, six, three, two, four, one.
      Left moves to 2, right moves to 3.

      Step three... left is three, right is two.
      Swap. Five, six, two, three, four, one.
      Left moves to 3, right moves to 2.

      Now left is 3 and right is 2.
      Left is no longer less than right, so we stop.

      Result is five, six, two, three, four, one.
      That matches the expected output. Right?"

  👤 "Good. How many swaps was that?"

  🧑 "Three. For six elements.
      That's n over 2.
      Each pair gets swapped exactly once."

  👤 "Okay. Go ahead and write the code."

  🧑 "Okay. [Starts typing.]

      Function reverseArray, takes arr.

      Left equals 0.
      Right equals arr dot length minus 1.

      Then a while loop...
      while left is less than right.

      [Pauses.]

      Actually, let me think about that condition.
      Should it be less than, or less than or equal?"

  👤 "What do you think?"

  🧑 "Less than.
      If left equals right, we're at the middle element
      of an odd-length array.
      Swapping it with itself doesn't do anything,
      so we can just stop.
      Less than or equal would do one extra no-op swap.
      Less than is cleaner."

  👤 "Mhm."

  🧑 "Okay. Inside the loop...
      swap arr bracket left with arr bracket right.

      I'll use destructuring assignment for the swap.
      So: arr bracket left, arr bracket right
      equals arr bracket right, arr bracket left.

      Then left-plus-plus. right-minus-minus.

      And that's it. Return arr."

  👤 "Walk me through each line."

  🧑 "Sure.

      Left and right are the two pointers.
      Left starts at the beginning, right at the end.

      The while condition keeps us going
      as long as the pointers haven't crossed.
      The moment left reaches or passes right, we stop.

      The destructuring swap exchanges the two elements
      without needing a temporary variable.
      It's equivalent to using a temp, just shorter.

      Left-plus-plus and right-minus-minus move both
      pointers one step toward the center.

      When the loop finishes, every element has been
      swapped with its mirror. Array is reversed."

  👤 "Quick question... why arr.length minus 1?
      Why not just arr.length?"

  🧑 "Because arrays are zero-indexed.
      For a six-element array,
      the valid indices are 0 through 5.
      The last index is always n minus 1.
      If I wrote arr.length, that would be index 6,
      which is out of bounds.

      So right has to start at length minus 1."

  👤 "Good. Can you trace through the code
      to make sure it's correct?"

  🧑 "Yeah.
      One, four, three, two, six, five.
      Left is 0, right is 5.

      0 less than 5... true.
      Swap index 0 and index 5. One and five.
      Now: five, four, three, two, six, one.
      Left becomes 1, right becomes 4.

      1 less than 4... true.
      Swap index 1 and index 4. Four and six.
      Now: five, six, three, two, four, one.
      Left becomes 2, right becomes 3.

      2 less than 3... true.
      Swap index 2 and index 3. Three and two.
      Now: five, six, two, three, four, one.
      Left becomes 3, right becomes 2.

      3 less than 2... false. Stop.

      Result: five, six, two, three, four, one. Correct."

  👤 "What's the time complexity?"

  🧑 "O of n. We do n over 2 swaps,
      but Big-O drops constants."

  👤 "Space?"

  🧑 "O of 1. Just the two pointer variables.
      We're not allocating any extra arrays."
```

```
╔══════════════════════════════════════════════════════════════╗
║  PART 5: EDGE CASES                                          ║
╚══════════════════════════════════════════════════════════════╝

  👤 "Can you walk me through some edge cases?
      Start with empty array."

  🧑 "Empty array.
      arr.length is 0.
      Right is 0 minus 1... that's negative 1.
      Condition is 0 less than negative 1... false.
      Loop never runs. Array stays empty. Correct."

  👤 "Single element."

  🧑 "Single element, like just [7].
      Left is 0, right is 0.
      Condition is 0 less than 0... false.
      Loop never runs. Array stays as is. Correct.
      One element is already reversed."

  👤 "Two elements?"

  🧑 "Two elements, like 1 and 2.
      Left is 0, right is 1.
      0 less than 1... true. Swap.
      Now it's 2 and 1.
      Left becomes 1, right becomes 0.
      1 less than 0... false. Stop.
      One swap. Correct."

  👤 "What about an odd-length array?"

  🧑 "Like one, two, three.
      Left is 0, right is 2.
      Swap index 0 and index 2. One and three.
      Now: three, two, one.
      Left becomes 1, right becomes 1.
      1 less than 1... false. Stop.

      The middle element, two, was never touched.
      Which is correct... it stays in the center."

  👤 "What if all elements are the same?"

  🧑 "Like five, five, five.
      We'd still do the swaps.
      But swapping identical values doesn't change anything.
      Result is still five, five, five. Correct."

  👤 "Does the type of values matter?"

  🧑 "Not at all.
      The algorithm only looks at positions,
      not the values themselves.
      Strings, objects, mixed types... works the same.
      The swap just moves references around."

  👤 "Are you satisfied all the cases are handled?"

  🧑 "Yeah.
      Empty... loop never starts.
      Single element... same.
      Two elements... one swap, correct.
      Odd length... middle element untouched.
      All same... no-op swaps, still correct.
      Any value type... position-based, type doesn't matter.

      I'd be comfortable putting this in a code review."
```

```
╔══════════════════════════════════════════════════════════════╗
║  PART 6: FOLLOW-UP QUESTIONS                                 ║
╚══════════════════════════════════════════════════════════════╝

  👤 "What if you weren't allowed to modify in-place?
      Had to return a new array?"

  🧑 "Then I'd build the output differently.
      Create a new array of the same length.
      Loop from the end of the original forward,
      and push each element into the new array.

      That's O of n time and O of n space.
      Clean, but uses extra memory."

  👤 "What if you wanted to check if an array
      is a palindrome?
      Does this algorithm relate?"

  🧑 "Yeah, it's the same skeleton.
      You still use two pointers from both ends
      moving inward.
      But instead of swapping, you compare.
      If arr bracket left ever doesn't equal
      arr bracket right, it's not a palindrome.
      If the pointers meet without a mismatch, it is.

      Same structure, different operation inside the loop."

  👤 "What about rotating an array?
      Like rotate right by k positions?"

  🧑 "There's a classic trick using three reverses.

      To rotate right by k...
      first reverse the whole array.
      Then reverse just the first k elements.
      Then reverse the remaining n minus k elements.

      Each reverse is just this algorithm.
      So you'd call reverseArray three times on subarrays."

  👤 "Why does that work?"

  🧑 "Hmm. Let me think through an example.
      Say one, two, three, four, five.
      Rotate right by two.

      Reverse all... five, four, three, two, one.
      Reverse first two... four, five, three, two, one.
      Reverse last three... four, five, one, two, three.

      Which is correct. The last two moved to the front.

      The intuition is... reversing the whole array
      puts the last k elements at the front, but backwards.
      Reversing those first k fixes their order.
      Then reversing the rest fixes the remaining."

  👤 "Last thing. What if the array was very large?
      Say a billion elements. Any concerns?"

  🧑 "O of n is unavoidable here.
      To reverse n elements, you have to touch
      all of them at least once.
      There's no way to do it faster.

      The O of 1 space is what makes this good.
      You're not allocating anything proportional to n.
      For a billion elements, memory stays constant.

      For practical concerns... cache misses might matter
      at that scale, since you're accessing opposite ends
      of a huge array. But that's hardware-level,
      not something we'd optimize in the algorithm itself."

  👤 "OK. I think that's everything.
      Any questions for me?"

  🧑 "Yeah. How does your team typically handle
      in-place versus immutable patterns in production code?
      Is there a convention, or does it depend on context?"

  👤 "Depends on context mostly.
      Performance-critical paths we go in-place.
      Shared state we tend toward immutability.

      OK. Good session. You had strong instincts
      on the in-place tradeoffs and the palindrome connection.
      We'll be in touch."

  🧑 "Thank you. Enjoyed it."
```
