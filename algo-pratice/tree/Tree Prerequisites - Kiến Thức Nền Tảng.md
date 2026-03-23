# 🧱 Tree Prerequisites — Kiến Thức Nền Tảng

> Học từng phần THEO THỨ TỰ. Phần sau dùng kiến thức phần trước!

---

## 📚 Mục lục

1. [Recursion + Backtracking](#1)
2. [XOR Properties](#2)
3. [Bitmask](#3)
4. [Prefix Sum / Prefix XOR](#4)
5. [LCA — Brute Force](#5)
6. [Binary Lifting](#6)
7. [Euler Tour](#7)
8. [Fenwick Tree (BIT)](#8)
9. [Serialize & Deserialize Binary Tree](#9)
10. [Binary Tree Level Order Traversal](#10)
11. [RMQ & Sparse Table](#11)
12. [Binary Lifting mở rộng — Min/Max trên đường đi](#12)
13. [Heavy-Light Decomposition (HLD)](#13)
14. [Tổng hợp các phương pháp giải LCA](#14)
15. [Centroid Decomposition — Chia để trị trên cây](#15)

---

<a id="1"></a>

## 1️⃣ Recursion + Backtracking

### Recursion là gì?

```
HÀM GỌI CHÍNH NÓ = Recursion!

  Ví dụ đời thường:
  Bạn muốn biết bạn đứng ở VỊ TRÍ THỨ MẤY trong hàng:

    → Hỏi người trước: "Bạn thứ mấy?"
    → Người đó hỏi người trước nữa: "Bạn thứ mấy?"
    → ... cứ hỏi đến NGƯỜI ĐẦU TIÊN
    → Người đầu tiên: "Tôi thứ 1!"
    → Trả ngược lại: 2, 3, 4, ... đến bạn!

  ĐÓ LÀ RECURSION: hỏi → hỏi → hỏi → đến khi TRẢ LỜI ĐƯỢC → quay lại!
```

### 3 phần của mọi hàm đệ quy:

```javascript
function recursion(input) {
  // 1️⃣ BASE CASE — Khi nào DỪNG?
  if (input là trường hợp đơn giản nhất) return đáp án;

  // 2️⃣ RECURSIVE CALL — Gọi bài NHỎ HƠN
  const result = recursion(input nhỏ hơn);

  // 3️⃣ COMBINE — Gộp kết quả
  return gộp(result, input hiện tại);
}
```

### Ví dụ 1: Tính giai thừa `5! = 5 × 4 × 3 × 2 × 1`

```javascript
function factorial(n) {
  if (n <= 1) return 1; // BASE: 1! = 1
  return n * factorial(n - 1); // RECURSIVE: n × (n-1)!
}
```

### Call Stack = Xếp sách lên bàn

```
Tưởng tượng bạn XẾP SÁCH lên bàn:
  - Mỗi lần gọi hàm = ĐẶT 1 cuốn sách lên TRÊN
  - Mỗi lần return   = LẤY cuốn TRÊN CÙNG ra

  Quy tắc: chỉ được lấy cuốn TRÊN CÙNG!
  (Không rút cuốn ở giữa hoặc dưới đáy!)
```

### Trace factorial(3) — từng bước:

```
BƯỚC 1: Gọi factorial(3)
  "3 chưa phải base case, gọi factorial(2)"

  Sách trên bàn:
    📘 factorial(3) — đang chờ kết quả factorial(2)

───────────────────────────────────────────────────

BƯỚC 2: Gọi factorial(2)
  "2 chưa phải base case, gọi factorial(1)"

  Sách trên bàn:
    📗 factorial(2) — đang chờ      ← TRÊN CÙNG
    📘 factorial(3) — đang chờ

───────────────────────────────────────────────────

BƯỚC 3: Gọi factorial(1)
  "1 là base case! return 1!"

  Sách trên bàn:
    📕 factorial(1) = 1              ← TRÊN CÙNG → XONG!
    📗 factorial(2) — đang chờ
    📘 factorial(3) — đang chờ

───────────────────────────────────────────────────

BƯỚC 4: LẤY 📕 ra (factorial(1) return 1)
  → Đưa kết quả 1 cho factorial(2)
  → factorial(2): return 2 * 1 = 2

  Sách trên bàn:
    📗 factorial(2) = 2              ← TRÊN CÙNG → XONG!
    📘 factorial(3) — đang chờ

───────────────────────────────────────────────────

BƯỚC 5: LẤY 📗 ra (factorial(2) return 2)
  → Đưa kết quả 2 cho factorial(3)
  → factorial(3): return 3 * 2 = 6

  Sách trên bàn:
    📘 factorial(3) = 6 ✅            ← CUỐI CÙNG → ĐÁP ÁN!
```

```
TÓM LẠI:

  ĐI XUỐNG (xếp sách):         ĐI LÊN (lấy sách):
  factorial(3) → chờ            factorial(3) = 3*2 = 6 ✅
    factorial(2) → chờ            factorial(2) = 2*1 = 2
      factorial(1) → return 1!    factorial(1) = 1 (base!)
          ↑ ĐẾN ĐÁY!             ↑ BẮT ĐẦU QUAY LÊN!
```

### Ví dụ 2: Đếm nodes trong tree — WITH TRACE

```javascript
function count(node) {
  if (node === null) return 0; // BASE
  return 1 + count(node.left) + count(node.right); // RECURSIVE + COMBINE
}
```

```
Tree:    1
        / \
       2   3

count(1):
  count(2):                              ← đi trái
    count(null) → return 0               ← trái của 2 = null
    count(null) → return 0               ← phải của 2 = null
    return 1 + 0 + 0 = 1                 ← "node 2: tôi + trái + phải"
  count(3):                              ← đi phải
    count(null) → return 0
    count(null) → return 0
    return 1 + 0 + 0 = 1
  return 1 + 1 + 1 = 3 ✅               ← "node 1: tôi + trái(1) + phải(1)"

Call Stack tại thời điểm sâu nhất:
  ┌────────────────┐
  │ count(null)    │ ← return 0
  ├────────────────┤
  │ count(2)       │ ← đang chờ count(left)
  ├────────────────┤
  │ count(1)       │ ← đang chờ count(left) = count(2)
  └────────────────┘
```

### Backtracking — Thử đồ trong tiệm!

```
Bạn vào tiệm quần áo. Có 3 cái áo: ĐỎ, XANH, VÀNG.
Bạn muốn THỬ HẾT tất cả CÁCH MẶC (thứ tự khác nhau).

  Bước 1: MẶC áo Đỏ
  Bước 2: MẶC thêm áo Xanh
  Bước 3: MẶC thêm áo Vàng → XONG! Ghi lại: [Đỏ, Xanh, Vàng]

  Bước 4: CỞI áo Vàng (undo!)
  Bước 5: CỞI áo Xanh (undo!)
  Bước 6: MẶC áo Vàng (thử cách khác!)
  Bước 7: MẶC áo Xanh → XONG! Ghi lại: [Đỏ, Vàng, Xanh]
  ...tiếp tục cho đến hết...

  BACKTRACKING = MẶC (chọn) → ghi nhận → CỞI (undo!) → thử cái khác!
```

### Ví dụ nhỏ nhất: Hoán vị [1, 2] — chỉ 2 số cho dễ hiểu

```
"Xếp 2 số [1, 2] theo mọi thứ tự"

path = [] (chưa chọn gì), còn lại = [1, 2]

───────── THỬ SỐ 1 TRƯỚC ─────────

  CHỌN 1 → path = [1], còn lại = [2]
    CHỌN 2 → path = [1, 2], còn lại = []
      Hết số → LƯU [1, 2]! ✅
    BỎ 2 ← cởi ra! → path = [1], còn lại = [2]
    (Hết lựa chọn cho vị trí 2)
  BỎ 1 ← cởi ra! → path = [], còn lại = [1, 2]

───────── THỬ SỐ 2 TRƯỚC ─────────

  CHỌN 2 → path = [2], còn lại = [1]
    CHỌN 1 → path = [2, 1], còn lại = []
      Hết số → LƯU [2, 1]! ✅
    BỎ 1 ← cởi ra! → path = [2], còn lại = [1]
  BỎ 2 ← cởi ra! → path = [], còn lại = [1, 2]

───────── KẾT QUẢ ─────────

  [1, 2] và [2, 1] → 2 hoán vị! (2! = 2) ✅
```

### Code cho ví dụ trên:

```javascript
function permute(nums) {
  const result = [];
  function backtrack(path, remaining) {
    // Hết số → LƯU!
    if (remaining.length === 0) {
      result.push([...path]);
      return;
    }
    // THỬ từng số còn lại
    for (let i = 0; i < remaining.length; i++) {
      path.push(remaining[i]); // MẶC (chọn)
      const rest = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
      backtrack(path, rest); // đi tiếp
      path.pop(); // CỞI (undo!)
    }
  }
  backtrack([], nums);
  return result;
}

// permute([1,2])   → [[1,2], [2,1]]
// permute([1,2,3]) → 6 hoán vị!
```

### Trace [1,2,3] — đầy đủ:

```
backtrack([], [1,2,3])
│
├─ CHỌN 1 → path=[1], còn=[2,3]
│   ├─ CHỌN 2 → path=[1,2], còn=[3]
│   │   └─ CHỌN 3 → path=[1,2,3] → LƯU ✅
│   │      BỎ 3 → path=[1,2]
│   │   BỎ 2 → path=[1]
│   ├─ CHỌN 3 → path=[1,3], còn=[2]
│   │   └─ CHỌN 2 → path=[1,3,2] → LƯU ✅
│   │      BỎ 2 → path=[1,3]
│   │   BỎ 3 → path=[1]
│   BỎ 1 → path=[]
│
├─ CHỌN 2 → path=[2], còn=[1,3]
│   ├─ CHỌN 1 → [2,1,3] → LƯU ✅
│   ├─ CHỌN 3 → [2,3,1] → LƯU ✅
│   BỎ 2 → path=[]
│
├─ CHỌN 3 → path=[3], còn=[1,2]
│   ├─ CHỌN 1 → [3,1,2] → LƯU ✅
│   ├─ CHỌN 2 → [3,2,1] → LƯU ✅
│   BỎ 3 → path=[]

Kết quả: 6 hoán vị! (3! = 6)
```

```
💡 TÓM TẮT:
  Recursion = hàm gọi chính nó + base case + combine
  Call Stack = xếp sách: gọi = đặt lên, return = lấy ra
  Backtracking = CHỌN → đi tiếp → BỎ CHỌN(cởi ra!) → thử cái khác

  Nhớ 3 BƯỚC trong vòng for:
    1. path.push(x)     ← MẶC áo
    2. backtrack(...)    ← đi tiếp
    3. path.pop()       ← CỞI áo (undo!)
```

---

<a id="2"></a>

## 2️⃣ XOR Properties

### XOR là gì?

```
XOR (⊕) = "khác thì 1, giống thì 0"

  0 ^ 0 = 0    (giống → 0)
  1 ^ 1 = 0    (giống → 0)
  0 ^ 1 = 1    (khác → 1)
  1 ^ 0 = 1    (khác → 1)

  Ví dụ với số:
  5 ^ 3 = ?
    5 = 101
    3 = 011
    ─────────
        110 = 6

  5 ^ 3 = 6
```

### 4 tính chất QUAN TRỌNG:

```
1️⃣  a ^ 0 = a         XOR với 0 → không đổi!
    5 ^ 0 = 5

2️⃣  a ^ a = 0         XOR với CHÍNH NÓ → = 0!
    5 ^ 5 = 0
    "abc" xuất hiện 2 lần → tự HỦY!

3️⃣  a ^ b = b ^ a     Thứ tự KHÔNG QUAN TRỌNG!
    5 ^ 3 = 3 ^ 5 = 6

4️⃣  (a ^ b) ^ c = a ^ (b ^ c)   Nhóm tùy ý!

💡 TÍNH CHẤT 2 LÀ QUAN TRỌNG NHẤT:
   a ^ a = 0 nghĩa là: ký tự xuất hiện CHẴN lần → TỰ HỦY!
   Chỉ ký tự xuất hiện LẺ lần mới CÒN LẠI!
```

### Trace XOR với binary step-by-step:

```
Ví dụ: "abca" → mỗi ký tự = 1 bit:
  a = 001, b = 010, c = 100

  XOR từng ký tự:
    Start:   000
    ^ 'a':   000 ^ 001 = 001   ← a bật (lẻ)
    ^ 'b':   001 ^ 010 = 011   ← a,b đều lẻ
    ^ 'c':   011 ^ 100 = 111   ← a,b,c đều lẻ
    ^ 'a':   111 ^ 001 = 110   ← a tắt! (a xuất hiện 2 lần = chẵn = tự hủy!)

  Kết quả: 110 → b,c lẻ → 2 ký tự lẻ → KHÔNG palindrome ❌

  Nếu "abba":
    000 → 001 → 011 → 010 → 000
    Kết quả: 000 → 0 ký tự lẻ → palindrome ✅

  Nếu "aab":
    000 → 001 → 000 → 010
    Kết quả: 010 → 1 ký tự lẻ → palindrome ✅ ("aba")
```

### Ứng dụng: Tìm số xuất hiện 1 lần

```javascript
// Mảng: [2, 3, 2, 4, 3] — tìm số chỉ xuất hiện 1 lần
function singleNumber(nums) {
  let result = 0;
  for (const num of nums) result ^= num;
  return result;
}

// Trace: 0 ^ 2 ^ 3 ^ 2 ^ 4 ^ 3
//      = (2^2) ^ (3^3) ^ 4    ← cặp tự hủy!
//      = 0 ^ 0 ^ 4
//      = 4 ✅
```

```
💡 TÓM TẮT:
  XOR = "khác thì 1"
  a ^ a = 0 (tự hủy!)
  a ^ 0 = a (không đổi)
  → Ký tự CHẴN lần → tự hủy!
  → Chỉ ký tự LẺ lần → còn lại trong bitmask!
```

---

<a id="3"></a>

## 3️⃣ Bitmask

### Bitmask là gì?

```
Dùng MỖI BIT trong 1 số để lưu trữ thông tin YES/NO!

  Ví dụ: Bạn có 4 món ăn. Bạn đã ăn món nào?

  Bit 3  Bit 2  Bit 1  Bit 0
  Pizza  Phở    Cơm    Bún

  mask = 0101 = 5
  → Đã ăn: Bún (bit 0) + Phở (bit 2) = 0101!

  1 số DUY NHẤT lưu được NHIỀU thông tin!
```

### Các phép toán quan trọng:

```javascript
// 1️⃣ Tạo mask cho vị trí thứ n (bật bit n)
1 << n

  1 << 0 = 0001 = 1    (bit 0)
  1 << 1 = 0010 = 2    (bit 1)
  1 << 2 = 0100 = 4    (bit 2)
  1 << 3 = 1000 = 8    (bit 3)

// 2️⃣ Bật bit n trong mask
mask | (1 << n)

  0000 | (1 << 2) = 0100   "ăn thêm phở"

// 3️⃣ Tắt bit n
mask & ~(1 << n)

  0101 & ~(1 << 0) = 0100  "bỏ bún"

// 4️⃣ Toggle (đảo) bit n
mask ^ (1 << n)

  0100 ^ (1 << 2) = 0000   "phở: bật→tắt"
  0000 ^ (1 << 2) = 0100   "phở: tắt→bật"

// 5️⃣ Check bit n đang bật?
(mask >> n) & 1

  0101: bit 0 = (0101 >> 0) & 1 = 1 ✅
  0101: bit 1 = (0101 >> 1) & 1 = 0 ❌
```

### Trick quan trọng: `mask & (mask - 1)`

```
mask & (mask - 1) = TẮT bit thấp nhất đang bật!

  mask   = 01100
  mask-1 = 01011   (borrow: bit thấp nhất bật → tắt, các bit dưới → bật)
  AND    = 01000   ← bit thấp nhất (bit 2) đã tắt!

ỨNG DỤNG: Check "chỉ có 1 bit bật" (power of 2)?
  mask !== 0 && (mask & (mask - 1)) === 0

  00100 & 00011 = 0 → chỉ 1 bit → TRUE ✅
  01010 & 01001 = 01000 → ≠ 0 → 2 bits → FALSE ❌

PALINDROME:
  mask & (mask - 1) === 0  (kể cả mask = 0!)
  → "Tối đa 1 ký tự lẻ" → XẾP PALINDROME ĐƯỢC!
```

```
💡 TÓM TẮT:
  1 << n     = bật bit n
  mask ^ bit = toggle (XOR)
  mask & (mask-1) = tắt bit thấp nhất
  === 0? → tối đa 1 bit bật → palindrome!
```

---

<a id="4"></a>

## 4️⃣ Prefix Sum / Prefix XOR

### Prefix Sum — Tổng tích lũy

```
Mảng:        [3, 1, 4, 1, 5]
Prefix sum:  [0, 3, 4, 8, 9, 14]
              ↑
            thêm 0 ở đầu!

  prefix[0] = 0 (chưa có phần tử nào)
  prefix[1] = 3
  prefix[2] = 3+1 = 4
  prefix[3] = 3+1+4 = 8
  prefix[4] = 3+1+4+1 = 9
  prefix[5] = 3+1+4+1+5 = 14
```

```
ỨNG DỤNG: Tính tổng ĐOẠN [L, R] trong O(1)!

  Muốn tổng arr[2..4] = 4 + 1 + 5 = 10?

  Cách thường: cộng từng phần tử → O(n)
  Prefix sum:  prefix[5] - prefix[2] = 14 - 4 = 10 → O(1)!

         arr:  [3,  1, |4,  1,  5|]
                        ↑──────↑
                      L=2     R=4

  prefix[R+1] - prefix[L] = prefix[5] - prefix[2] = 14 - 4 = 10 ✅
```

```javascript
// Build prefix sum:
const prefix = [0]; // bắt đầu bằng 0
for (let i = 0; i < arr.length; i++) prefix.push(prefix[i] + arr[i]);

// Query sum [L, R] trong O(1):
function rangeSum(L, R) {
  return prefix[R + 1] - prefix[L];
}
```

### Prefix XOR — Y hệt, dùng XOR!

```
CHỈ thay + bằng ^ !

Mảng chars:   [a, b, c, a]   (bitmask: 001, 010, 100, 001)
Prefix XOR:   [000, 001, 011, 111, 110]

  pXOR[0] = 000
  pXOR[1] = 001             ← a
  pXOR[2] = 001 ^ 010 = 011 ← a^b
  pXOR[3] = 011 ^ 100 = 111 ← a^b^c
  pXOR[4] = 111 ^ 001 = 110 ← a^b^c^a (a tự hủy!)

Query XOR đoạn [1, 3] = chars b,c,a:
  pXOR[4] ^ pXOR[1] = 110 ^ 001 = 111  (b,c,a — 3 ký tự lẻ)
  Hoặc: vì 010 ^ 100 ^ 001 = 111 ✅
```

### Prefix XOR trên TREE — Quan trọng!

```
Trên mảng:  pXOR[R] ^ pXOR[L-1] = XOR đoạn [L, R]

Trên tree:  P[u] = XOR từ root đến u (theo path unique)

        0(a)                P[0] = 001 (a)
       / \                  P[1] = 001^010 = 011 (a^b)
     1(b)  2(c)             P[2] = 001^100 = 101 (a^c)
     /                      P[3] = 011^001 = 010 (a^b^a)
   3(a)

Path 3→2 = [a, b, a, c]?

  Path: 3 → 1 → 0 → 2
  LCA(3, 2) = 0

  P[3] ^ P[2] = 010 ^ 101 = 111
  Nhưng LCA node 0 (char a) bị XOR hủy 2 lần!
  Phải thêm lại: 111 ^ 001 = 110

  Kiểm tra: path chars = a,b,a,c
  XOR = 001^010^001^100 = 110 ✅ (b và c lẻ)

  CÔNG THỨC: pathXOR(u,v) = P[u] ^ P[v] ^ mask(LCA)
```

```
💡 TÓM TẮT:
  Prefix sum: tổng tích lũy, query đoạn O(1) bằng trừ
  Prefix XOR: XOR tích lũy, query đoạn O(1) bằng XOR
  Trên tree: pathXOR(u,v) = P[u] ^ P[v] ^ mask(LCA)
```

---

<a id="5"></a>

## 5️⃣ LCA — Lowest Common Ancestor (Brute Force)

### LCA là gì?

```
LCA = Tổ tiên chung GẦN NHẤT của 2 nodes

         0
        / \
       1   2
      / \   \
     3   4   5

  LCA(3, 4) = 1  ← cha chung gần nhất!
  LCA(3, 5) = 0  ← phải lên tận root!
  LCA(1, 4) = 1  ← node 1 LÀ tổ tiên của 4!
  LCA(3, 2) = 0
```

### Brute force: nhảy lên từng bước

```
THUẬT TOÁN:
  1. Nâng node SÂU HƠN lên CÙNG DEPTH
  2. Cùng nhảy lên 1 bậc cho đến khi GẶP NHAU

Ví dụ: LCA(3, 5)?

         0 (depth 0)
        / \
       1   2 (depth 1)
      / \   \
     3   4   5 (depth 2)

  depth(3) = 2, depth(5) = 2 → cùng depth!

  Nhảy lên: 3→1, 5→2
  Khác nhau! Nhảy tiếp: 1→0, 2→0
  GIỐNG NHAU! LCA = 0 ✅
```

```javascript
function lcaBrute(root, u, v) {
  // Tìm path root→u và root→v
  function findPath(node, target, path) {
    if (!node) return false;
    path.push(node.val);
    if (node.val === target) return true;
    if (findPath(node.left, target, path)) return true;
    if (findPath(node.right, target, path)) return true;
    path.pop(); // backtrack!
    return false;
  }

  const pathU = [],
    pathV = [];
  findPath(root, u, pathU);
  findPath(root, v, pathV);

  // So sánh 2 path, tìm node chung CUỐI CÙNG
  let lca = root.val;
  for (let i = 0; i < Math.min(pathU.length, pathV.length); i++) {
    if (pathU[i] === pathV[i]) lca = pathU[i];
    else break;
  }
  return lca;
}

// Time: O(n) mỗi query — CHẬM!
```

```
💡 TÓM TẮT:
  LCA = tổ tiên chung gần nhất
  Brute force: tìm 2 paths, so sánh → O(n)
  Cần nhanh hơn? → Recursive (Optimal) hoặc Binary Lifting!
```

### Cách 2: Recursive LCA — Optimal O(n) (Post-order DFS)

```
TƯ DƯỞNG KHÁC HOÀN TOÀN so với Brute Force!

  Brute Force:  Tìm path → so sánh → 2-3 lần duyệt cây
  Recursive:    Duyệt 1 LẦN DUY NHẤT, "bắn tín hiệu" từ dưới lên!

  TẠI SAO CHỌN DFS (Post-order)?
    Vì cần tìm cả 2 target nodes trong cây, post-order cho phép
    thu thập kết quả từ subtrees TRƯỚC rồi mới quyết định tại node hiện tại.

  NGUYÊN LÝ:
    Khi DFS post-order (xử lý SAU khi đi hết con):
    - Nếu gặp p hoặc q → "bắn tín hiệu" lên cho cha
    - Mỗi node hỏi: nhánh trái có tín hiệu? nhánh phải có tín hiệu?
    - Nếu CẢ HAI nhánh đều có → TÔI LÀ LCA! 🎯
    - Nếu chỉ 1 nhánh có → chuyển tiếp tín hiệu lên trên

  3 TRƯỜNG HỢP tại mỗi node:
    1. left && right  → CẢ HAI target ở 2 nhánh   → return root (LCA!)
    2. left || right  → Chỉ 1 target tìm thấy     → "chuyển tiếp" lên cha
    3. !left && !right → Không tìm thấy gì         → return null
```

```javascript
var lowestCommonAncestor = function(root, p, q) {
    // BASE CASE: null hoặc tìm thấy p/q → trả về chính nó
    if (!root || root === p || root === q) {
        return root;
    }

    // POST-ORDER: đi xuống trước, xử lý sau
    const left = lowestCommonAncestor(root.left, p, q);   // hỏi nhánh trái
    const right = lowestCommonAncestor(root.right, p, q);  // hỏi nhánh phải

    // CẢ HAI nhánh đều tìm thấy → root chính là LCA!
    if (left && right) {
        return root;
    }

    // Chỉ 1 nhánh tìm thấy → chuyển tiếp tín hiệu lên
    return left || right;
};

// Time: O(n)  — duyệt mỗi node 1 lần DUY NHẤT
// Space: O(h) — call stack (h = chiều cao cây)
```

### Trace chi tiết: LCA(4, 5)?

```
Cây:
         0
        / \
       1   2
      / \   \
     3   4   5

Gọi: LCA(0, p=4, q=5)

  1. root=0, không phải p/q → đi xuống

  2. LEFT: LCA(1, p=4, q=5)
     │  root=1, không phải p/q → đi xuống
     │
     │  LEFT: LCA(3, p=4, q=5)
     │  │  root=3, không phải p/q → đi xuống
     │  │  LEFT: LCA(null) → return null ❌
     │  │  RIGHT: LCA(null) → return null ❌
     │  │  left=null, right=null → return null ❌
     │  └─ KẾT QUẢ: null (nhánh 3 không có p/q)
     │
     │  RIGHT: LCA(4, p=4, q=5)
     │  │  root=4 === p → return 4 ✅ TÍN HIỆU!
     │  └─ KẾT QUẢ: 4
     │
     │  left=null, right=4
     │  Chỉ 1 nhánh có → return right = 4  (chuyển tiếp!)
     └─ KẾT QUẢ: 4

  3. RIGHT: LCA(2, p=4, q=5)
     │  root=2, không phải p/q → đi xuống
     │
     │  LEFT: LCA(null) → return null ❌
     │
     │  RIGHT: LCA(5, p=4, q=5)
     │  │  root=5 === q → return 5 ✅ TÍN HIỆU!
     │  └─ KẾT QUẢ: 5
     │
     │  left=null, right=5
     │  Chỉ 1 nhánh có → return right = 5  (chuyển tiếp!)
     └─ KẾT QUẢ: 5

  4. VỀ LẠI root=0:
     left=4 ✅ (tín hiệu từ nhánh trái)
     right=5 ✅ (tín hiệu từ nhánh phải)

     CẢ HAI đều có! → return root = 0
     LCA(4, 5) = 0 ✅ 🎯
```

### Trace: LCA(3, 4)? (cả 2 cùng nhánh)

```
Cây:
         0
        / \
       1   2
      / \   \
     3   4   5

Gọi: LCA(0, p=3, q=4)

  LEFT: LCA(1, p=3, q=4)
  │  LEFT: LCA(3) → root=3 === p → return 3 ✅
  │  RIGHT: LCA(4) → root=4 === q → return 4 ✅
  │
  │  left=3, right=4 → CẢ HAI! → return 1 🎯
  └─ KẾT QUẢ: 1

  RIGHT: LCA(2, p=3, q=4)
  │  ... tìm không thấy → return null ❌
  └─ KẾT QUẢ: null

  VỀ root=0: left=1, right=null
  Chỉ 1 nhánh → return left = 1

  LCA(3, 4) = 1 ✅ 🎯
```

### Trace: LCA(6, 4)? (LeetCode 236 — cây thực tế)

```
Cây:
           3
          / \
         5   1
        / \ / \
       6  2 0  8
         / \
        7   4

p = 6, q = 4

Gọi: LCA(3, p=6, q=4)

  1. root=3, không phải p/q → đi xuống

  2. LEFT: LCA(5, p=6, q=4)
     │  root=5, không phải p/q → đi xuống
     │
     │  LEFT: LCA(6, p=6, q=4)
     │  │  root=6 === p → return 6 ✅ TÍN HIỆU!
     │  └─ KẾT QUẢ: 6
     │
     │  RIGHT: LCA(2, p=6, q=4)
     │  │  root=2, không phải p/q → đi xuống
     │  │
     │  │  LEFT: LCA(7, p=6, q=4)
     │  │  │  root=7, không phải p/q → đi xuống
     │  │  │  LEFT: null, RIGHT: null → return null ❌
     │  │  └─ KẾT QUẢ: null
     │  │
     │  │  RIGHT: LCA(4, p=6, q=4)
     │  │  │  root=4 === q → return 4 ✅ TÍN HIỆU!
     │  │  └─ KẾT QUẢ: 4
     │  │
     │  │  left=null, right=4
     │  │  Chỉ 1 nhánh có → return right = 4  (chuyển tiếp!)
     │  │
     │  │  ⚠️ TẠI SAO NODE 2 KHÔNG PHẢI LCA?
     │  │  Vì left=null → chưa tìm thấy CẢ HAI target!
     │  │  Node 2 chỉ chứa q(=4), không chứa p(=6)
     │  │  → Chuyển tiếp node 4 lên cho cha (node 5)
     │  └─ KẾT QUẢ: 4
     │
     │  left=6 ✅, right=4 ✅
     │  CẢ HAI nhánh đều có! → return root = 5 🎯
     └─ KẾT QUẢ: 5

  3. RIGHT: LCA(1, p=6, q=4)
     │  ⚠️ QUAN TRỌNG: Algorithm vẫn phải duyệt nhánh này!
     │  root=1, không phải p/q → đi xuống
     │  LEFT: LCA(0) → null, RIGHT: LCA(8) → null
     │  left=null, right=null → return null ❌
     └─ KẾT QUẢ: null

  4. VỀ LẠI root=3:
     left=5 ✅ (LCA đã tìm được ở nhánh trái)
     right=null ❌ (nhánh phải không có target nào)

     Chỉ 1 nhánh có → return left = 5
     LCA(6, 4) = 5 ✅ 🎯

     💡 Node 3 nhận được 5 (là LCA) và chuyển tiếp lên.
        Algorithm duyệt TOÀN BỘ cây, không dừng sớm!
```

### Tại sao `if (left && right) return root` đúng?

```
CHỨNG MINH bằng logic:

  Khi left && right đều KHÁC NULL tại node X:
  → left ≠ null nghĩa là: nhánh trái của X CHỨA p hoặc q
  → right ≠ null nghĩa là: nhánh phải của X CHỨA cái còn lại
  → p và q NẰM Ở 2 NHÁNH KHÁC NHAU của X
  → X chính là điểm "RẼ NHÁNH" → X = LCA! ✅

  Khi chỉ 1 nhánh có (VD: left ≠ null, right = null):
  → Cả p và q đều nằm bên trái
  → LCA nằm SÂU HƠN bên trái
  → Chuyển tiếp tín hiệu lên: return left

  EDGE CASE: root === p (hoặc q):
  → p là tổ tiên của q!
  → return p luôn, KHÔNG cần tìm thêm
  → Vì theo định nghĩa, một node CÓ THỂ là tổ tiên của chính nó
```

### So sánh Brute Force vs Recursive Optimal

```
                    Brute Force (Path)     Recursive (Optimal)
  ───────────────────────────────────────────────────────────────
  Số lần duyệt cây   2-3 lần               1 lần DUY NHẤT ✅
  Time               O(n)                   O(n)
  Space              O(n) — lưu 2 paths     O(h) — chỉ call stack ✅
  Tư duy             Top-down (tìm path)    Bottom-up (post-order)
  Code               ~20 dòng               ~10 dòng ✅
  Phỏng vấn          ❌ Không impress        ✅ Đây là đáp án chuẩn!

  ⚠️ LƯU Ý: Cả 2 đều O(n) per query!
     Nếu cần xử lý NHIỀU queries → dùng Binary Lifting O(log n)!
```

```
💡 TÓM TẮT:
  Recursive LCA = Post-order DFS + "bắn tín hiệu" từ dưới lên
  Gặp p/q → bắn tín hiệu
  Cả 2 nhánh có tín hiệu → node hiện tại = LCA! 🎯
  Chỉ 1 nhánh → chuyển tiếp lên cho cha
  → Duyệt 1 lần, O(n) time, O(h) space
  → ĐÂY LÀ ĐÁP ÁN CHUẨN cho phỏng vấn!

  COMPLEXITY giải thích:
  Time: O(n)  — Worst case duyệt TẤT CẢ n nodes
                (VD: p, q ở 2 lá cuối cùng)
  Space: O(h) — Call stack tối đa = chiều cao cây
    - Balanced tree: h = O(log n)
    - Skewed tree (cây lệch 1 bên): h = O(n)
```

---

<a id="6"></a>

## 6️⃣ Binary Lifting — LCA trong O(log n)

### Bài toán con: Tìm tổ tiên thứ k

```
TRƯỚC KHI hiểu Binary Lifting cho LCA,
hãy giải bài toán ĐƠN GIẢN HƠN trước:

  Cho cây N đỉnh, gốc tại đỉnh 0.
  Truy vấn (u, k): tìm tổ tiên thứ k của u
  (tức là nhảy lên k bậc từ u)

  Ví dụ trên cây:
            0
           / \
          1   2
         / \   \
        3   4   5
       /
      6
     /
    7

  Tổ tiên thứ 1 của 7 = 6 (cha)
  Tổ tiên thứ 2 của 7 = 3 (ông)
  Tổ tiên thứ 3 của 7 = 1 (cụ)
  Tổ tiên thứ 4 của 7 = 0 (root)
```

### Thuật toán ngây thơ: nhảy 1 bậc

```javascript
// Nhảy lên cha k lần
function ancestorK(u, k) {
    while (k >= 1) {
        u = parent[u];
        k--;
    }
    return u;
}

// Time: O(k) = O(n) worst case — CHẬM!
```

```
VẤN ĐỀ: Nếu cây có 200.000 đỉnh và 200.000 truy vấn
  → 200.000 × 200.000 = 4 × 10^10 thao tác → QUÁ CHẬM! ❌
```

### Tối ưu lần 1: nhảy 2 bậc

```
Ý TƯỞNG: Thay vì nhảy 1 bậc, nhảy 2 bậc mỗi lần!

  Lưu thêm: up2[u] = ông của u = parent[parent[u]]

  Khi truy vấn: nhảy 2 bậc trước, rồi xử lý phần dư
```

```javascript
// Tiền xử lý
const up2 = new Array(n);
for (let u = 0; u < n; u++) {
    up2[u] = parent[parent[u]];  // ông = cha của cha
}

// Truy vấn
function ancestorK(u, k) {
    while (k >= 2) { u = up2[u]; k -= 2; }
    if (k >= 1) { u = parent[u]; k--; }
    return u;
}

// Time: O(k/2) — nhanh gấp 2 lần! Nhưng vẫn O(n)...
```

### Tối ưu lần 2: nhảy 4 bậc

```
Tiếp tục! Thêm up4[u] = tổ tiên thứ 4 của u
  up4[u] = up2[up2[u]]  (nhảy 2 + 2 = 4!)
```

```javascript
const up2 = new Array(n);
const up4 = new Array(n);
for (let u = 0; u < n; u++) up2[u] = parent[parent[u]];
for (let u = 0; u < n; u++) up4[u] = up2[up2[u]];

function ancestorK(u, k) {
    while (k >= 4) { u = up4[u]; k -= 4; }
    if (k >= 2) { u = up2[u]; k -= 2; }
    if (k >= 1) { u = parent[u]; k--; }
    return u;
}

// Time: O(k/4 + 2) — nhanh hơn nữa!
```

### Tối ưu lần 3: nhảy 8 bậc

```
Thêm up8[u] = up4[up4[u]]  (nhảy 4 + 4 = 8!)
```

```javascript
for (let u = 0; u < n; u++) up2[u] = parent[parent[u]];
for (let u = 0; u < n; u++) up4[u] = up2[up2[u]];
for (let u = 0; u < n; u++) up8[u] = up4[up4[u]];

function ancestorK(u, k) {
    while (k >= 8) { u = up8[u]; k -= 8; }
    if (k >= 4) { u = up4[u]; k -= 4; }
    if (k >= 2) { u = up2[u]; k -= 2; }
    if (k >= 1) { u = parent[u]; k--; }
    return u;
}

// Time: O(k/8 + 3) — ngày càng nhanh!
```

### 🎯 Nhận ra PATTERN → Binary Lifting!

```
PATTERN rõ ràng:
  parent = tổ tiên 2^0 = 1 bậc
  up2    = tổ tiên 2^1 = 2 bậc
  up4    = tổ tiên 2^2 = 4 bậc
  up8    = tổ tiên 2^3 = 8 bậc
  ...
  up2^j  = tổ tiên 2^j bậc

THAY VÌ tạo nhiều mảng riêng lẻ (up2, up4, up8, ...)
→ GỘP vào BẢNG 2D: up[u][j] = tổ tiên thứ 2^j của u

  up[u][0] = parent[u]           (2^0 = 1 bậc = cha)
  up[u][1] = up2[u]              (2^1 = 2 bậc = ông)
  up[u][2] = up4[u]              (2^2 = 4 bậc = cụ)
  up[u][3] = up8[u]              (2^3 = 8 bậc)
  ...

CÔNG THỨC TRUY HỒI:
  up[u][0] = parent[u]
  up[u][j] = up[  up[u][j-1]  ][j-1]
             ↑       ↑           ↑
             tổ tiên  nhảy 2^(j-1)  rồi nhảy thêm 2^(j-1)
             2^j      = trung gian    → cộng = 2^j bậc!

                        2^j bậc
       ┌──────────────────────────────────────┐
       u ────2^(j-1)────→ mid ────2^(j-1)────→ ancestor
       └────────────────┘   └────────────────┘
         up[u][j-1]           up[mid][j-1]

  → Nhảy 2^j = nhảy 2^(j-1) HAI LẦN!

SỐ MẢNG CẦN: log₂(N)
  N = 200.000 → log₂ = 18 → chỉ cần 18 "tầng"!
  Bộ nhớ: O(N × log N) ≈ 200.000 × 18 ≈ 3.6 triệu — ĐỦ!
```

### Tiền xử lý — JavaScript

```javascript
const LOG = Math.ceil(Math.log2(n)) + 1;  // số tầng cần thiết
// up[u][j] = tổ tiên thứ 2^j của u
const up = Array.from({ length: n }, () => new Array(LOG).fill(0));
const depth = new Array(n).fill(0);

function dfs(node, par, d) {
    up[node][0] = par;         // cha = tổ tiên 2^0
    depth[node] = d;

    // Tính tổ tiên 2^1, 2^2, ... của node
    for (let j = 1; j < LOG; j++) {
        up[node][j] = up[up[node][j - 1]][j - 1];  // công thức!
    }

    for (const child of adj[node]) {
        if (child !== par) dfs(child, node, d + 1);
    }
}
dfs(0, 0, 0); // root = 0

// Time: O(N × log N) — tiền xử lý 1 LẦN
// Space: O(N × log N) — bảng up[][]
```

### Tìm tổ tiên thứ k — Dùng hệ nhị phân

```
NHẬN XÉT QUAN TRỌNG:
  Mọi số nguyên đều viết được dạng NHỊ PHÂN (tổng lũy thừa 2)!

  Ví dụ: k = 13 = 1101₂ = 2³ + 2² + 2⁰ = 8 + 4 + 1

  Vậy: nhảy 13 bậc = nhảy 8 + 4 + 1
     = up[u][3]  →  up[u][2]  →  up[u][0]
       (8 bậc)      (4 bậc)      (1 bậc)

  CHỈ 3 lần nhảy thay vì 13 lần! 🚀
```

```javascript
function ancestorK(u, k) {
    for (let j = 0; (1 << j) <= k; j++) {
        if ((k >> j) & 1) {     // bit thứ j của k bật?
            u = up[u][j];       // nhảy 2^j bậc!
        }
    }
    return u;
}

// Time: O(log k) = O(log n) — NHANH!
```

```
Trace: ancestorK(7, 5)?  (tìm tổ tiên thứ 5 của node 7)

  Cây:
            0
           / \
          1   2
         / \
        3   4
       /
      6
     /
    7

  k = 5 = 101₂ (bit 0 bật, bit 2 bật)

  j=0: bit 0 bật (5 & 1 = 1) → nhảy 2^0 = 1 bậc
       u = up[7][0] = 6

  j=1: bit 1 tắt (5 >> 1 & 1 = 0) → SKIP

  j=2: bit 2 bật (5 >> 2 & 1 = 1) → nhảy 2^2 = 4 bậc
       u = up[6][2] = ?
       up[6][0]=3, up[6][1]=up[3][0]=1, up[6][2]=up[1][1]=up[0][0]=0
       u = 0

  Kết quả: tổ tiên thứ 5 của 7 = 0 (root) ✅
  CHỈ 2 BƯỚC thay vì 5 bước! 🚀
```

---

### Ứng dụng: Tìm LCA bằng Binary Lifting

```
GIỐNG HỆT thuật toán ngây thơ, nhưng NHẢY NHANH HƠN!

Ngây thơ:
  Bước 1: nâng node sâu hơn lên cùng depth → nhảy 1 bậc → O(n)
  Bước 2: cùng nhảy lên cho đến khi gặp     → nhảy 1 bậc → O(n)

Binary Lifting:
  Bước 1: nâng node sâu hơn lên cùng depth → nhảy 2^j bậc → O(log n)
  Bước 2: cùng nhảy lên cho đến khi gặp     → nhảy 2^j bậc → O(log n)
```

### Bước 1: Nâng lên cùng depth

```
Cần nhảy diff = depth[u] - depth[v] bậc
→ Dùng ancestorK(u, diff) — y hệt bài tổ tiên thứ k!

  Ví dụ: depth(7)=4, depth(5)=2
  diff = 2 = 10₂ → nhảy 2^1 = 2 bậc
  u = up[7][1] = 3  (depth 2) → CÙNG DEPTH!
```

### Bước 2: Cùng nhảy lên tìm LCA

```
SAU KHI cùng depth, có 2 trường hợp:

  TH1: u === v → LCA chính là u (v đã nằm trên đường đi!)

  TH2: u ≠ v → Cần tìm LCA
    TRICK: Duyệt j từ LỚN → NHỎ
    Nếu up[u][j] ≠ up[v][j] → NHẢY! (chưa đến LCA, đi tiếp!)
    Nếu up[u][j] === up[v][j] → KHÔNG nhảy! (đã vượt qua LCA)

  ⚠️ TẠI SAO kiểm tra KHÁC nhau mới nhảy?
    Vì ta muốn dừng lại NGAY DƯỚI LCA!
    Khi u và v dừng → cha chung của chúng = LCA!
    → return up[u][0] (= cha của u = LCA!)

  ⚠️ TẠI SAO duyệt từ LỚN → NHỎ?
    Vì muốn nhảy bước LỚN trước (giống chặt nhị phân!)
    Nhảy lớn trước → tinh chỉnh nhỏ sau → chính xác!

  Ví dụ: u (depth 10) và v (depth 10), LCA ở depth 3
    → Cần nhảy 7 bậc = 4 + 2 + 1

    j=3 (8): up[u][3] === up[v][3] → vượt qua LCA → KHÔNG nhảy
    j=2 (4): up[u][2] ≠ up[v][2]  → chưa đến LCA → NHẢY! (còn 3 bậc)
    j=1 (2): up[u][1] ≠ up[v][1]  → chưa đến LCA → NHẢY! (còn 1 bậc)
    j=0 (1): up[u][0] ≠ up[v][0]  → chưa đến LCA → NHẢY! (còn 0 bậc)
    → u và v giờ ở depth 4 (ngay dưới LCA!)
    → return up[u][0] = LCA (depth 3) ✅
```

### Code hoàn chỉnh — JavaScript

```javascript
const LOG = Math.ceil(Math.log2(n)) + 1;
const up = Array.from({ length: n }, () => new Array(LOG).fill(0));
const depth = new Array(n).fill(0);

// ═══ TIỀN XỬ LÝ: O(N log N) ═══
function dfs(node, par, d) {
    up[node][0] = par;
    depth[node] = d;

    for (let j = 1; j < LOG; j++) {
        up[node][j] = up[up[node][j - 1]][j - 1];
    }

    for (const child of adj[node]) {
        if (child !== par) dfs(child, node, d + 1);
    }
}
dfs(0, 0, 0);

// ═══ TRUY VẤN LCA: O(log N) ═══
function lca(u, v) {
    // BƯỚC 1: Nâng node sâu hơn lên CÙNG DEPTH
    if (depth[u] < depth[v]) [u, v] = [v, u];
    let diff = depth[u] - depth[v];

    for (let j = 0; (1 << j) <= diff; j++) {
        if ((diff >> j) & 1) {   // bit j của diff bật?
            u = up[u][j];         // nhảy 2^j bậc!
        }
    }

    // BƯỚC 2: Nếu đã gặp nhau (u là tổ tiên của v)
    if (u === v) return u;

    // BƯỚC 3: Cùng nhảy lên, dừng NGAY DƯỚI LCA
    for (let j = LOG - 1; j >= 0; j--) {
        if (up[u][j] !== up[v][j]) {  // tổ tiên KHÁC → chưa đến LCA!
            u = up[u][j];
            v = up[v][j];
        }
    }

    // BƯỚC 4: Cha chung = LCA!
    return up[u][0];
}
```

### Trace đầy đủ: LCA(7, 5)?

```
Cây:
            0 (depth 0)
           / \
          1   2 (depth 1)
         / \   \
        3   4   5 (depth 2)
       /
      6 (depth 3)
     /
    7 (depth 4)

BẢNG up[][] (tổ tiên 2^j bậc):

  node  depth  up[.][0]  up[.][1]  up[.][2]
               cha       ông       cụ
               (2^0=1)   (2^1=2)   (2^2=4)
  ──────────────────────────────────────────
  0     0      0         0         0
  1     1      0         0         0
  2     1      0         0         0
  3     2      1         0         0
  4     2      1         0         0
  5     2      2         0         0
  6     3      3         1         0
  7     4      6         3         0

═══ BƯỚC 1: Nâng lên cùng depth ═══
  depth(7) = 4, depth(5) = 2
  diff = 4 - 2 = 2 = 10₂

  j=0: bit 0 tắt → SKIP
  j=1: bit 1 bật → nhảy 2^1 = 2 bậc
       u = up[7][1] = 3
  Giờ: u=3 (depth 2), v=5 (depth 2) → CÙNG DEPTH! ✅

═══ BƯỚC 2: u=3 ≠ v=5 → chưa gặp ═══

═══ BƯỚC 3: Cùng nhảy, dừng ngay dưới LCA ═══
  j=2: up[3][2]=0, up[5][2]=0 → GIỐNG! → KHÔNG nhảy ❌
       (nếu nhảy → vượt qua LCA!)
  j=1: up[3][1]=0, up[5][1]=0 → GIỐNG! → KHÔNG nhảy ❌
  j=0: up[3][0]=1, up[5][0]=2 → KHÁC! → NHẢY! ✅
       u = up[3][0] = 1
       v = up[5][0] = 2
  Giờ: u=1, v=2 (ngay DƯỚI LCA!)

═══ BƯỚC 4: return up[u][0] = up[1][0] = 0 ═══
  LCA(7, 5) = 0 ✅ 🎯
```

### Trace: LCA(6, 4)?

```
  depth(6) = 3, depth(4) = 2
  diff = 1 = 1₂

  BƯỚC 1: j=0, bit 0 bật → u = up[6][0] = 3
  Giờ: u=3 (depth 2), v=4 (depth 2)

  BƯỚC 2: u=3 ≠ v=4

  BƯỚC 3:
    j=2: up[3][2]=0, up[4][2]=0 → GIỐNG → skip
    j=1: up[3][1]=0, up[4][1]=0 → GIỐNG → skip
    j=0: up[3][0]=1, up[4][0]=1 → GIỐNG → skip!
    (KHÔNG nhảy vì cha đã GIỐNG = đó là LCA!)

  BƯỚC 4: return up[3][0] = 1
  LCA(6, 4) = 1 ✅ 🎯

  ⚠️ Ở bước 3 KHÔNG nhảy lần nào → u, v đã ở ngay dưới LCA!
```

### Ứng dụng: Tính khoảng cách 2 đỉnh trên cây

```
Nếu biết dist[u] = khoảng cách từ root đến u:

  dist(u, v) = dist[u] + dist[v] - 2 × dist[LCA(u, v)]

           root
          /    \
         /      \
      LCA ← dist[LCA]
       / \
      /   \
     u     v

  Đường u → v = (u → LCA) + (LCA → v)
               = (dist[u] - dist[LCA]) + (dist[v] - dist[LCA])
               = dist[u] + dist[v] - 2 × dist[LCA]
```

```javascript
// Nếu cây KHÔNG có trọng số: dùng depth
function distBetween(u, v) {
    const p = lca(u, v);
    return depth[u] + depth[v] - 2 * depth[p];
}

// Nếu cây CÓ trọng số: dùng mảng dist[] (khoảng cách đến root)
function distWeighted(u, v) {
    const p = lca(u, v);
    return dist[u] + dist[v] - 2 * dist[p];
}
```

### So sánh 3 cách tìm LCA:

```
                    Ngây thơ       Recursive (DFS)   Binary Lifting
  ────────────────────────────────────────────────────────────────────
  Tiền xử lý       O(N)           Không cần          O(N log N)
  Mỗi truy vấn     O(N)           O(N)               O(log N) ✅
  Q truy vấn        O(Q × N)       O(Q × N)           O(Q × log N) ✅
  Bộ nhớ           O(N)           O(h) stack          O(N log N)
  Dùng khi nào?    Hiểu concept   1 truy vấn          NHIỀU truy vấn ✅

  Ví dụ: N = 200.000, Q = 200.000
    Ngây thơ:       200.000 × 200.000 = 4 × 10^10 → TLE ❌
    Binary Lifting: 200.000 × 18      = 3.6 × 10^6 → AC ✅
```

```
💡 TÓM TẮT:
  Binary Lifting = tiền xử lý bảng "NHẢY NHANH"

  BẢNG up[u][j] = tổ tiên thứ 2^j của u
  CÔNG THỨC: up[u][j] = up[up[u][j-1]][j-1]  (nhảy 2 lần!)
  TIỀN XỬ LÝ: O(N log N) — chạy 1 lần duy nhất

  TÌM TỔ TIÊN THỨ K: phân tích k thành nhị phân
    13 = 8 + 4 + 1 → nhảy up[.][3], up[.][2], up[.][0]
    Chỉ log(k) bước!

  TÌM LCA:
    1. Nâng node sâu → cùng depth (dùng ancestorK)
    2. Nếu u === v → LCA = u
    3. Cùng nhảy, dừng NGAY DƯỚI LCA (tổ tiên KHÁC → nhảy!)
    4. return up[u][0] = cha chung = LCA!
    Mỗi truy vấn O(log N)!

  BONUS: dist(u, v) = dist[u] + dist[v] - 2 × dist[LCA(u,v)]
```

---

<a id="7"></a>

## 7️⃣ Euler Tour — Dẹp cây thành mảng

### Vấn đề

```
Tree KHÔNG PHẢI mảng → không dùng Fenwick/Segment Tree được!
→ Cần BIẾN tree thành mảng → Euler Tour!

BÀI TOÁN GỐC:
  Có cây N đỉnh, gốc tại 1. Mỗi đỉnh có giá trị ban đầu = 0.
  Truy vấn loại 1: thay đổi giá trị đỉnh u thành x
  Truy vấn loại 2: tính tổng giá trị các đỉnh trong CÂY CON gốc u

  Ngây thơ: loại 1 → O(1), loại 2 → O(n) (duyệt hết cây con)
  → N, Q ≤ 10^5 → O(n × q) = 10^10 → QUÁ CHẬM! ❌

  CẦN: cách biến "cây con" thành "đoạn liên tục trong mảng"
  → Dùng Fenwick/Segment Tree query đoạn → O(log n)! ✅
```

### Euler Tour là gì?

```
ĐỊNH NGHĨA: DFS trên cây, ghi lại THỨ TỰ thăm mỗi đỉnh.

  Với mỗi đỉnh u, ghi 2 mốc:
    tin[u]  = thời điểm THĂM lần đầu (vào)
    tout[u] = thời điểm THĂM lần cuối (ra)

  Ví dụ:
         1
        / \
       2   5
      / \
     3   4

  DFS traversal:
    VÀO 1 (time=1)
      VÀO 2 (time=2)
        VÀO 3 (time=3)
        RA 3  (time=3)    ← lá: tin = tout
        VÀO 4 (time=4)
        RA 4  (time=4)
      RA 2  (time=4)      ← tout = vị trí cuối cùng trong cây con
      VÀO 5 (time=5)
      RA 5  (time=5)
    RA 1  (time=5)

  Bảng kết quả:
    node    tin     tout
    1       1       5
    2       2       4
    3       3       3
    4       4       4
    5       5       5
```

### Biến thể 1: Subtree Tour (mỗi đỉnh xuất hiện 1 lần)

```
MỤC ĐÍCH: Update đỉnh + Query cây con

CÁCH LÀM: Mỗi đỉnh xuất hiện ĐÚNG 1 LẦN trong mảng tour
  tin[u] = vị trí của u trong mảng
  tout[u] = vị trí cuối cùng của đỉnh thuộc cây con u

  Mảng tour: [1, 2, 3, 4, 5]  (thứ tự DFS)
  Vị trí:     1  2  3  4  5

  Cây con gốc 2 = đoạn [tin[2], tout[2]] = [2, 4]
  → Chứa: 2, 3, 4 → ĐÚNG! ✅

  Cây con gốc 1 = đoạn [tin[1], tout[1]] = [1, 5]
  → Chứa: 1, 2, 3, 4, 5 → toàn bộ cây! ✅
```

```javascript
// ═══ XÂY DỰNG EULER TOUR (Subtree version) ═══
let timer = 0;
const tin = new Array(n + 1);     // thời điểm vào
const tout = new Array(n + 1);    // vị trí cuối cây con
const tour = new Array(n + 1);    // tour[pos] = node

function dfs(u, parent) {
    timer++;
    tin[u] = timer;
    tour[timer] = u;     // ghi đỉnh u vào mảng

    for (const v of adj[u]) {
        if (v !== parent) dfs(v, u);
    }

    tout[u] = timer;     // vị trí cuối = timer hiện tại
}
dfs(1, 0);  // gốc = 1
```

```
Trace trên cây ví dụ:

         1
        / \
       2   5
      / \
     3   4

  dfs(1, 0):  timer=1, tin[1]=1, tour[1]=1
    dfs(2, 1):  timer=2, tin[2]=2, tour[2]=2
      dfs(3, 2):  timer=3, tin[3]=3, tour[3]=3
                   tout[3]=3  (lá, không con)
      dfs(4, 2):  timer=4, tin[4]=4, tour[4]=4
                   tout[4]=4  (lá)
    tout[2]=4  ← vị trí cuối cùng trong cây con 2
    dfs(5, 1):  timer=5, tin[5]=5, tour[5]=5
                 tout[5]=5
  tout[1]=5

  Mảng tour: [_, 1, 2, 3, 4, 5]  (1-indexed)
  Cây con gốc 2 = tour[2..4] = [2, 3, 4] ✅
```

### TÍNH CHẤT QUAN TRỌNG NHẤT:

```
⭐ CÂY CON gốc u = ĐOẠN LIÊN TỤC [tin[u], tout[u]] trong mảng!

  → Update đỉnh u = update vị trí tin[u] trong Fenwick
  → Query cây con u = query đoạn [tin[u], tout[u]] trong Fenwick

  VÍ DỤ: Tổng cây con gốc 2?
    = Fenwick.rangeQuery(tin[2], tout[2])
    = Fenwick.rangeQuery(2, 4)
    → Tổng 3 đỉnh: 2, 3, 4 ✅

THÊM CÁC TÍNH CHẤT:
  1. v thuộc cây con gốc u ⟺ tin[u] ≤ tin[v] ≤ tout[u]
  2. u là tổ tiên của v ⟺ tin[u] ≤ tin[v] ≤ tout[u]
  3. u và v KHÔNG có quan hệ tổ tiên ⟺ đoạn [tin[u], tout[u]]
     và [tin[v], tout[v]] KHÔNG giao nhau
```

### Giải bài toán gốc — Dùng Fenwick Tree:

```javascript
class FenwickTree {
    constructor(n) {
        this.n = n;
        this.tree = new Array(n + 1).fill(0);
    }
    update(i, val) {
        for (; i <= this.n; i += i & -i) this.tree[i] += val;
    }
    query(i) {
        let s = 0;
        for (; i > 0; i -= i & -i) s += this.tree[i];
        return s;
    }
    rangeQuery(l, r) {
        return this.query(r) - this.query(l - 1);
    }
}

const fenwick = new FenwickTree(n);

// Truy vấn loại 1: thay đổi giá trị đỉnh u thành x
function change(u, x) {
    const oldVal = val[u];
    val[u] = x;
    fenwick.update(tin[u], x - oldVal);  // update VỊ TRÍ tin[u]
}

// Truy vấn loại 2: tổng cây con gốc u
function sumSubtree(u) {
    return fenwick.rangeQuery(tin[u], tout[u]);  // query ĐOẠN!
}

// Time: O(log n) mỗi truy vấn! ✅ (thay vì O(n))
```

---

### Biến thể 2: Path Tour (mỗi đỉnh xuất hiện 2 lần)

```
MỤC ĐÍCH: Update đỉnh + Query ĐƯỜNG ĐI giữa 2 đỉnh

CÁCH LÀM: Ghi đỉnh u KHI VÀO và KHI RA
  → Mỗi đỉnh xuất hiện ĐÚNG 2 LẦN

  Cây:
         1
        / \
       2   5
      / \
     3   4

  DFS ghi vào/ra:
    VÀO 1, VÀO 2, VÀO 3, RA 3, VÀO 4, RA 4, RA 2, VÀO 5, RA 5, RA 1
    tour: [1, 2, 3, 3, 4, 4, 2, 5, 5, 1]
    Pos:   1  2  3  4  5  6  7  8  9  10

  Bảng:
    node    tin(=st)    tout(=en)
    1       1           10
    2       2           7
    3       3           4
    4       5           6
    5       8           9
```

```javascript
// ═══ XÂY DỰNG PATH TOUR ═══
let timer = 0;
const st = new Array(n + 1);   // vị trí VÀO
const en = new Array(n + 1);   // vị trí RA
const tour = new Array(2 * n + 1);

function dfs(u, parent) {
    timer++;
    st[u] = timer;
    tour[timer] = u;    // lần 1: VÀO

    for (const v of adj[u]) {
        if (v !== parent) dfs(v, u);
    }

    timer++;
    en[u] = timer;
    tour[timer] = u;    // lần 2: RA
}
dfs(1, 0);
```

### TRICK: Query đường đi bằng ±

```
TUYỆT CHIÊU:
  Tại vị trí st[u] (lần vào): ghi +val[u]
  Tại vị trí en[u] (lần ra):  ghi -val[u]

  → Khi tính tổng đoạn [st[u], st[v]] (u là tổ tiên của v):
    - Đỉnh thuộc đường đi u→v: xuất hiện 1 lần (+val) → CÒN!
    - Đỉnh KHÔNG thuộc đường đi: xuất hiện 2 lần (+val rồi -val) → TỰ TRIỆT TIÊU!

  Ví dụ: Tổng đường đi 1→4?
    Đoạn [st[1], st[4]] = [1, 5]
    tour: [+1, +2, +3, -3, +4]
                   ↑    ↑
                   3 vào, 3 ra → +3 + (-3) = 0 (triệt tiêu!)
    Tổng = +1 +2 +3 -3 +4 = 1 + 2 + 4 = 7
    → Đường đi 1→2→4, tổng = val[1]+val[2]+val[4] ✅

  Đỉnh 3 TỰ TRIỆT TIÊU vì nó KHÔNG nằm trên đường 1→4!
```

```javascript
// Update đỉnh u: thay đổi giá trị thành x
function changeVertex(u, x) {
    const diff = x - val[u];
    val[u] = x;
    fenwick.update(st[u], diff);    // +diff tại VÀO
    fenwick.update(en[u], -diff);   // -diff tại RA
}

// Query đường đi u→v (u là tổ tiên của v)
function sumPath(u, v) {
    return fenwick.rangeQuery(st[u], st[v]);
}

// Trường hợp tổng quát u, v bất kì:
// Chia thành 2 đoạn: LCA→u và LCA→v
function sumPathGeneral(u, v) {
    const p = lca(u, v);
    const parP = parent[p];  // cha của LCA

    // Tổng(LCA→u) + Tổng(LCA→v) - val[LCA] (bị tính 2 lần)
    return sumPath(p, u) + sumPath(p, v) - val[p];
}
```

---

### Ứng dụng: Tìm LCA bằng Euler Tour + RMQ

```
MỘT CÁCH KHÁC tìm LCA (không cần Binary Lifting):

  Dùng Euler Tour GỐC (đường đi Euler đầy đủ):
    Ghi đỉnh mỗi lần duyệt qua (cả khi backtrack)

  Cây:
         1
        / \
       2   5
      / \
     3   4

  Euler Tour gốc: [1, 2, 3, 2, 4, 2, 1, 5, 1]
  Depth:          [0, 1, 2, 1, 2, 1, 0, 1, 0]
  Pos:             1  2  3  4  5  6  7  8  9

  st[1]=1, st[2]=2, st[3]=3, st[4]=5, st[5]=8

TÍNH CHẤT:
  LCA(u, v) = đỉnh có DEPTH NHỎ NHẤT
              trong đoạn [st[u], st[v]] của Euler Tour!

  Ví dụ: LCA(3, 4)?
    Đoạn [st[3], st[4]] = [3, 5]
    tour:  [3, 2, 4]
    depth: [2, 1, 2]
    Min depth = 1 → đỉnh 2 → LCA(3, 4) = 2 ✅

  Ví dụ: LCA(3, 5)?
    Đoạn [st[3], st[5]] = [3, 8]
    tour:  [3, 2, 4, 2, 1, 5]
    depth: [2, 1, 2, 1, 0, 1]
    Min depth = 0 → đỉnh 1 → LCA(3, 5) = 1 ✅
```

### Cài đặt LCA bằng Sparse Table (RMQ)

```javascript
// ═══ EULER TOUR cho LCA ═══
let timer = 0;
const st = new Array(n + 1);    // vị trí đầu tiên của u
const h = new Array(n + 1);      // depth
const tour = [];                  // euler tour

function dfs(u, parent) {
    h[u] = h[parent] + 1;
    timer++;
    st[u] = timer;
    tour[timer] = u;

    for (const v of adj[u]) {
        if (v !== parent) {
            dfs(v, u);
            timer++;
            tour[timer] = u;   // ghi lại u khi quay về
        }
    }
}
h[0] = -1;  // để h[root] = 0
dfs(1, 0);

const M = timer;  // M = 2*(n-1)+1 = độ dài Euler Tour

// ═══ SPARSE TABLE (RMQ trên Euler Tour) ═══
const K = Math.ceil(Math.log2(M)) + 1;
// R[i][j] = đỉnh có depth nhỏ nhất trong tour[i..i+2^j-1]
const R = Array.from({ length: M + 1 }, () => new Array(K).fill(0));

// Khởi tạo: R[i][0] = tour[i]
for (let i = 1; i <= M; i++) R[i][0] = tour[i];

// Xây bảng
for (let j = 0; (1 << (j + 1)) <= M; j++) {
    for (let i = 1; i + (1 << (j + 1)) - 1 <= M; i++) {
        const left = R[i][j];
        const right = R[i + (1 << j)][j];
        R[i][j + 1] = h[left] < h[right] ? left : right;
    }
}

// ═══ TRUY VẤN LCA: O(1)! ═══
function lca(u, v) {
    let l = st[u], r = st[v];
    if (l > r) [l, r] = [r, l];

    const k = Math.floor(Math.log2(r - l + 1));
    const left = R[l][k];
    const right = R[r - (1 << k) + 1][k];
    return h[left] < h[right] ? left : right;
}

// Tiền xử lý: O(M log M) = O(N log N)
// Mỗi truy vấn: O(1)! NHANH HƠN Binary Lifting!
```

### So sánh các cách tìm LCA:

```
                    Binary Lifting     Euler Tour + RMQ
  ─────────────────────────────────────────────────────────
  Tiền xử lý       O(N log N)         O(N log N)
  Mỗi truy vấn     O(log N)           O(1) ✅
  Bộ nhớ           O(N log N)         O(N log N)
  Cài đặt          Dễ hơn ✅          Phức tạp hơn
  Dùng khi nào?    DEFAULT             Cần O(1) per query
```

### Tổng hợp 3 dạng Euler Tour:

```
  DẠNG                   MỖI ĐỈNH    DÙNG CHO
  ──────────────────────────────────────────────────────────
  1. Subtree Tour         1 lần       Update đỉnh, Query cây con
     tin[u], tout[u]                  → Fenwick trên [tin, tout]

  2. Path Tour            2 lần       Update đỉnh, Query đường đi
     st[u], en[u]                     → Fenwick ± trick

  3. Euler Tour gốc       2(n-1)+1    Tìm LCA bằng RMQ
     ghi cả backtrack                 → Sparse Table → O(1)
```

```
💡 TÓM TẮT:
  Euler Tour = DFS + ghi thứ tự thăm → TRẢI PHẲNG CÂY!

  KEY INSIGHT: Cây con = Đoạn liên tục trong mảng!
  → Mọi thao tác CÂY CON → thao tác ĐOẠN → Fenwick/SegTree!

  3 biến thể cho 3 mục đích:
    Subtree query → ghi 1 lần, [tin, tout]
    Path query    → ghi 2 lần, ± trick triệt tiêu
    LCA           → ghi đầy đủ, RMQ tìm min depth → O(1)

  Tiền xử lý: O(N log N)
  Mỗi query: O(log N) với Fenwick, O(1) với RMQ!
```

---

<a id="8"></a>

## 8️⃣ Fenwick Tree (BIT — Binary Indexed Tree)

### Vấn đề

```
Cần 2 thao tác NHANH:
  1. UPDATE: thay đổi 1 phần tử
  2. QUERY: tính tổng (hoặc XOR) prefix [0...i]

  Mảng thường: update O(1), query O(n) — CHẬM!
  Prefix array: update O(n), query O(1) — CHẬM!
  Fenwick Tree: update O(log n), query O(log n) — CÂN BẰNG! ✅
```

### Ý tưởng cốt lõi: `i & (-i)`

```
i & (-i) = bit thấp nhất đang bật!

  i=6  = 110 → 6 & (-6) = 010 = 2
  i=12 = 1100 → 12 & (-12) = 0100 = 4
  i=8  = 1000 → 8 & (-8) = 1000 = 8

Fenwick Tree lưu TỔNG TỪNG ĐOẠN theo bit:
  tree[i] = tổng đoạn dài (i & (-i)) kết thúc tại i

  KHÔNG CẦN HIỂU SÂU! Chỉ cần biết CÁCH DÙNG:
```

### Cách dùng — Chỉ 2 hàm:

```javascript
class FenwickTree {
  constructor(n) {
    this.n = n;
    this.tree = new Array(n + 1).fill(0);
  }

  // UPDATE: cộng val vào vị trí i (hoặc XOR)
  update(i, val) {
    for (i += 1; i <= this.n; i += i & -i) this.tree[i] += val; // hoặc ^= val cho XOR
  }

  // QUERY: tổng prefix [0...i] (hoặc XOR)
  query(i) {
    let result = 0;
    for (i += 1; i > 0; i -= i & -i) result += this.tree[i]; // hoặc ^= cho XOR
    return result;
  }

  // BONUS: tổng đoạn [left, right]
  rangeQuery(left, right) {
    return this.query(right) - this.query(left - 1);
  }
}
```

### Trace query(5) — Cách Fenwick tính prefix:

```
query(5):  i = 5+1 = 6 (1-indexed)

  i=6 (binary 110):
    result += tree[6]       ← tree[6] chứa tổng đoạn [5,6]
    i -= 6 & (-6) = 6-2 = 4

  i=4 (binary 100):
    result += tree[4]       ← tree[4] chứa tổng đoạn [1,4]
    i -= 4 & (-4) = 4-4 = 0

  i=0: DỪNG!

  result = tree[6] + tree[4] = sum[5,6] + sum[1,4] = sum[1,6] ✅

  CHỈ 2 BƯỚC thay vì 6 bước! (log₂6 ≈ 2.6)
```

### Trace update(3, 5) — Cách Fenwick cập nhật:

```
update(3, 5):  i = 3+1 = 4 (1-indexed)

  i=4 (binary 100):
    tree[4] += 5            ← cập nhật đoạn chứa vị trí 3
    i += 4 & (-4) = 4+4 = 8

  i=8 (binary 1000):
    tree[8] += 5            ← cập nhật đoạn LỚN HƠN chứa vị trí 3
    i += 8 & (-8) = 8+8 = 16

  i=16 > n: DỪNG!

  CHỈ cập nhật 2 vị trí! O(log n)!
```

### So sánh 3 cách:

```
                  Update     Query prefix
  ─────────────────────────────────────────
  Mảng thường     O(1)       O(n)     ← query chậm!
  Prefix array    O(n)       O(1)     ← update chậm!
  Fenwick Tree    O(log n)   O(log n) ← CÂN BẰNG! ✅
```

### Fenwick XOR (dùng cho bài Palindromic Path):

```javascript
class FenwickXOR {
  constructor(n) {
    this.n = n;
    this.tree = new Array(n + 1).fill(0);
  }

  update(i, val) {
    for (i += 1; i <= this.n; i += i & -i) this.tree[i] ^= val; // XOR thay vì cộng!
  }

  query(i) {
    let result = 0;
    for (i += 1; i > 0; i -= i & -i) result ^= this.tree[i]; // XOR thay vì cộng!
    return result;
  }
}
```

### Dùng cho Palindromic Path Queries:

```
1. INIT: mỗi node → đặt bitmask vào Euler Tour
   fenwick.update(tin[node], 1 << charCode(s[node]))
   fenwick.update(tout[node], 1 << charCode(s[node]))

2. QUERY path u→v:
   P[u] = fenwick.query(tin[u])    ← prefix XOR root→u
   P[v] = fenwick.query(tin[v])    ← prefix XOR root→v
   mask = P[u] ^ P[v] ^ nodeMask[LCA(u,v)]
   palindrome? = (mask & (mask-1)) === 0

3. UPDATE node u: char 'a' → 'c'
   oldMask = 001, newMask = 100
   fenwick.update(tin[u], 001 ^ 100)   ← XOR bỏ cũ + thêm mới
   fenwick.update(tout[u], 001 ^ 100)
```

```
💡 TÓM TẮT:
  Fenwick Tree = update + prefix query O(log n)
  Chỉ cần nhớ 2 hàm: update() và query()
  i & (-i) = bit thấp nhất → dùng để nhảy giữa đoạn
  Thay + bằng ^ → Fenwick XOR cho palindrome!
  Kết hợp Euler Tour → biến tree thành mảng → Fenwick xử lý!
```

---

<a id="9"></a>

## 9️⃣ Serialize & Deserialize Binary Tree

### Bài toán là gì?

```
SERIALIZE = Biến CÂY → CHUỖI (string)
  → Để lưu vào file, gửi qua mạng, lưu database...

DESERIALIZE = Biến CHUỖI → CÂY (khôi phục lại chính xác!)
  → Phải tạo lại ĐÚNG cây ban đầu, không được sai cấu trúc!

  Ví dụ:
       1
      / \
     2   3
        / \
       4   5

  Serialize:   Tree → "1,2,null,null,3,4,null,null,5,null,null"
  Deserialize: "1,2,null,null,3,4,null,null,5,null,null" → Tree

  ⚠️ QUAN TRỌNG: Serialize + Deserialize phải TƯƠNG THÍCH!
     Chuỗi tạo ra bởi serialize PHẢI khôi phục đúng cây khi deserialize!
```

### Tại sao cần lưu NULL?

```
Nếu KHÔNG lưu null, cây sẽ BỊ NHẦM!

  Cây A:        Cây B:
     1             1
    /               \
   2                 2

  Không có null:
    Cây A → "1,2"    Cây B → "1,2"
    GIỐNG NHAU! → Không phân biệt được! ❌

  Có null:
    Cây A → "1,2,null,null,null"   (2 là con TRÁI)
    Cây B → "1,null,2,null,null"   (2 là con PHẢI)
    KHÁC NHAU! → Phân biệt được! ✅

  → null đánh dấu "KHÔNG CÓ con" → giữ nguyên CẤU TRÚC cây!
```

---

### Cách 1: DFS Pre-order (Phổ biến nhất, hay dùng trong phỏng vấn)

```
TẠI SAO PRE-ORDER?

  Pre-order: ROOT → Left → Right
  → Ghi ROOT TRƯỚC → khi deserialize biết NGAY node nào tạo trước!
  → Giống như đọc sách: "chương → mục → chi tiết"

  In-order (Left → ROOT → Right) → KHÔNG ĐƯỢC!
  → Vì không biết root ở đâu trong chuỗi → không khôi phục được!

  Post-order (Left → Right → ROOT) → có thể, nhưng phức tạp hơn
```

#### Serialize (Tree → String)

```javascript
var serialize = function(root) {
    const result = [];

    function dfs(node) {
        // Gặp null → ghi "null" và DỪNG (không đi tiếp)
        if (!node) {
            result.push("null");
            return;
        }

        // PRE-ORDER: ghi ROOT trước
        result.push(String(node.val));

        // Rồi đi trái, đi phải
        dfs(node.left);
        dfs(node.right);
    }

    dfs(root);
    return result.join(",");  // nối bằng dấu phẩy
};
```

#### Trace Serialize:

```
Cây:
     1
    / \
   2   3
      / \
     4   5

DFS Pre-order trace:

  dfs(1): ghi "1" → đi trái
    dfs(2): ghi "2" → đi trái
      dfs(null): ghi "null" ← con trái của 2
    ← quay lại → đi phải
      dfs(null): ghi "null" ← con phải của 2
    ← quay lại node 1 → đi phải
    dfs(3): ghi "3" → đi trái
      dfs(4): ghi "4" → đi trái
        dfs(null): ghi "null"
      ← đi phải
        dfs(null): ghi "null"
      ← quay lại node 3 → đi phải
      dfs(5): ghi "5" → đi trái
        dfs(null): ghi "null"
      ← đi phải
        dfs(null): ghi "null"

  result = ["1","2","null","null","3","4","null","null","5","null","null"]
  output = "1,2,null,null,3,4,null,null,5,null,null"

  Đọc lại: 1 → 2(trái) → ×(hết trái) → ×(hết phải) → 3(phải) → 4 → × → × → 5 → × → ×
```

#### Deserialize (String → Tree)

```javascript
var deserialize = function(data) {
    const values = data.split(",");  // tách thành mảng
    let index = 0;                   // con trỏ đọc từ trái → phải

    function dfs() {
        // Đọc giá trị hiện tại
        const val = values[index];
        index++;  // LUÔN tăng index, dù null hay số!

        // Gặp "null" → return null (không tạo node)
        if (val === "null") {
            return null;
        }

        // Tạo node mới
        const node = new TreeNode(Number(val));

        // PRE-ORDER: tạo root xong → tạo trái → tạo phải
        node.left = dfs();   // đệ quy tạo subtree trái
        node.right = dfs();  // đệ quy tạo subtree phải

        return node;
    }

    return dfs();
};
```

#### Trace Deserialize:

```
Input: "1,2,null,null,3,4,null,null,5,null,null"
values = ["1","2","null","null","3","4","null","null","5","null","null"]

                 index
                   ↓
  dfs():  val="1"  [0] → tạo node(1)
  │  node(1).left = dfs()
  │  │  val="2"    [1] → tạo node(2)
  │  │  node(2).left = dfs()
  │  │  │  val="null" [2] → return null ❌
  │  │  node(2).left = null ✅
  │  │  node(2).right = dfs()
  │  │  │  val="null" [3] → return null ❌
  │  │  node(2).right = null ✅
  │  │  return node(2)     ← node 2 hoàn thành! (lá, không con)
  │  node(1).left = node(2) ✅
  │
  │  node(1).right = dfs()
  │  │  val="3"    [4] → tạo node(3)
  │  │  node(3).left = dfs()
  │  │  │  val="4"  [5] → tạo node(4)
  │  │  │  node(4).left = dfs()
  │  │  │  │  val="null" [6] → return null
  │  │  │  node(4).right = dfs()
  │  │  │  │  val="null" [7] → return null
  │  │  │  return node(4)     ← node 4 hoàn thành!
  │  │  node(3).left = node(4) ✅
  │  │
  │  │  node(3).right = dfs()
  │  │  │  val="5"  [8] → tạo node(5)
  │  │  │  node(5).left = dfs()
  │  │  │  │  val="null" [9] → return null
  │  │  │  node(5).right = dfs()
  │  │  │  │  val="null" [10] → return null
  │  │  │  return node(5)     ← node 5 hoàn thành!
  │  │  node(3).right = node(5) ✅
  │  │  return node(3)         ← node 3 hoàn thành!
  │  node(1).right = node(3) ✅
  │  return node(1)             ← ROOT hoàn thành!

  Kết quả:
       1
      / \
     2   3
        / \
       4   5
  ĐÚ NG cây ban đầu! ✅ 🎯
```

#### Tại sao dùng index (con trỏ) mà không dùng shift()?

```
❌ values.shift()  — lấy phần tử đầu mảng rồi XÓA
   → Mỗi lần shift() phải DỊCH toàn bộ mảng → O(n) mỗi lần!
   → Tổng: O(n²) chậm!

✅ index++         — chỉ tăng con trỏ
   → O(1) mỗi lần! Không dịch mảng!
   → Tổng: O(n) nhanh!

   ⚠️ LƯU Ý: index phải là BIẾN BÊN NGOÀI hàm dfs()
   Vì nó cần CHIA SẺ giữa các lần gọi đệ quy!
   Nếu index là biến local → mỗi lần gọi dfs() bắt đầu lại từ 0 → SAI!
```

#### Complexity (DFS):

```
Serialize:
  Time:  O(n)  — thăm mỗi node 1 lần
  Space: O(n)  — mảng result + call stack O(h)

Deserialize:
  Time:  O(n)  — đọc mỗi giá trị 1 lần
  Space: O(n)  — tạo n nodes + call stack O(h)
```

---

### Cách 2: BFS Level-order (Dùng Queue)

```
Ý TƯỞNG: Ghi theo TỪNG TẦNG, trái → phải

       1
      / \
     2   3
        / \
       4   5

  Tầng 0: [1]
  Tầng 1: [2, 3]
  Tầng 2: [null, null, 4, 5]
  Tầng 3: [null, null, null, null]

  Output: "1,2,3,null,null,4,5,null,null,null,null"

  Khác với DFS ở THỨ TỰ:
    DFS:  1,2,null,null,3,4,null,null,5,null,null  (đi sâu trước)
    BFS:  1,2,3,null,null,4,5,null,null,null,null  (đi rộng trước)
```

#### Serialize BFS:

```javascript
var serialize = function(root) {
    if (!root) return "null";

    const result = [];
    const queue = [root];

    while (queue.length > 0) {
        const node = queue.shift();

        if (!node) {
            result.push("null");
            continue;  // null → không có con → không thêm vào queue
        }

        result.push(String(node.val));
        queue.push(node.left);    // có thể push null!
        queue.push(node.right);   // có thể push null!
    }

    return result.join(",");
};
```

#### Deserialize BFS:

```javascript
var deserialize = function(data) {
    if (data === "null") return null;

    const values = data.split(",");
    const root = new TreeNode(Number(values[0]));
    const queue = [root];
    let index = 1;  // bắt đầu từ 1 (vì values[0] đã dùng cho root)

    while (queue.length > 0) {
        const node = queue.shift();

        // Đọc con TRÁI
        if (values[index] !== "null") {
            node.left = new TreeNode(Number(values[index]));
            queue.push(node.left);
        }
        index++;

        // Đọc con PHẢI
        if (values[index] !== "null") {
            node.right = new TreeNode(Number(values[index]));
            queue.push(node.right);
        }
        index++;
    }

    return root;
};
```

#### Trace Deserialize BFS:

```
Input: "1,2,3,null,null,4,5,null,null,null,null"
values = ["1","2","3","null","null","4","5","null","null","null","null"]

  root = node(1), queue = [node(1)], index = 1

  Vòng 1: node = node(1)
    left:  values[1]="2" → tạo node(2) → queue = [node(2)]
    right: values[2]="3" → tạo node(3) → queue = [node(2), node(3)]
    index = 3
           1
          / \
         2   3

  Vòng 2: node = node(2)
    left:  values[3]="null" → skip
    right: values[4]="null" → skip
    queue = [node(3)], index = 5
           1
          / \
         2   3
        (lá - không con)

  Vòng 3: node = node(3)
    left:  values[5]="4" → tạo node(4) → queue = [node(4)]
    right: values[6]="5" → tạo node(5) → queue = [node(4), node(5)]
    index = 7
           1
          / \
         2   3
            / \
           4   5

  Vòng 4: node = node(4)
    left:  values[7]="null" → skip
    right: values[8]="null" → skip
    queue = [node(5)], index = 9

  Vòng 5: node = node(5)
    left:  values[9]="null" → skip
    right: values[10]="null" → skip
    queue = [], index = 11 → DỪNG!

  Kết quả: ĐÚNG cây ban đầu! ✅ 🎯
```

#### Complexity (BFS):

```
Serialize:
  Time:  O(n)  — thăm mỗi node 1 lần
  Space: O(n)  — queue + result array

Deserialize:
  Time:  O(n)  — đọc mỗi giá trị 1 lần
  Space: O(n)  — queue + tạo n nodes
```

---

### So sánh DFS vs BFS cho Serialize/Deserialize:

```
                      DFS (Pre-order)        BFS (Level-order)
  ────────────────────────────────────────────────────────────────
  Thứ tự ghi        Đi sâu trước            Đi rộng (từng tầng)
  Time              O(n)                     O(n)
  Space             O(h) call stack          O(w) queue width
  Cây lệch (skew)   Stack nhỏ O(n)          Queue nhỏ O(1) ✅
  Cây rộng (wide)   Stack nhỏ O(log n) ✅   Queue lớn O(n)
  Code              Ngắn hơn ✅              Dài hơn
  Phỏng vấn         ✅ Được ưa chuộng       ✅ Cũng chấp nhận
  Dùng khi nào?     DEFAULT CHOICE           Khi cần level-order

  ⚠️ CẢ HAI đều O(n) time! Chọn cái nào cũng ĐÚNG!
     DFS thường được prefer vì code ngắn gọn hơn.
```

### Edge Cases cần xử lý:

```
1. Cây rỗng (root = null):
   serialize(null) → "null"
   deserialize("null") → null

2. Chỉ có root:
   serialize(TreeNode(1)) → "1,null,null"
   deserialize("1,null,null") → TreeNode(1)

3. Giá trị ÂM:
   Node(-1) → ghi "-1" → Number("-1") = -1 ✅

4. Cây lệch 1 bên (skewed):
       1
        \
         2
          \
           3
   serialize → "1,null,2,null,3,null,null"
   → Nhiều "null" nhưng vẫn đúng!
```

### Tại sao chỉ Pre-order + null là đủ?

```
BÌNH THƯỜNG cần 2 traversals để rebuild tree:
  inorder + preorder  → OK
  inorder + postorder → OK
  preorder + postorder → KHÔNG đủ!

NHƯNG nếu có NULL markers → CHỈ CẦN 1 traversal!

  Vì null markers GIỮ NGUYÊN CẤU TRÚC:

  Pre-order + null:
    "1,2,null,null,3" → đọc tuần tự:
    1 là root → 2 là left → null (hết trái) → null (hết phải)
    → node 2 xong → 3 là right of 1
    → CẤU TRÚC hoàn toàn xác định! ✅

  Pre-order KHÔNG có null:
    "1,2,3" → 2 là left hay right? 3 ở đâu?
    → KHÔNG XÁC ĐỊNH! ❌
```

```
💡 TÓM TẮT:
  Serialize = Tree → String (lưu trữ/truyền tải)
  Deserialize = String → Tree (khôi phục)

  DFS Pre-order (ĐÁP ÁN CHUẨN phỏng vấn):
    Serialize: ghi root → trái → phải, null = "null"
    Deserialize: đọc tuần tự + đệ quy, dùng index++ (KHÔNG shift!)

  BFS Level-order:
    Serialize: queue, ghi theo từng tầng
    Deserialize: queue, đọc 2 con (trái/phải) cho mỗi node

  KEY INSIGHT: null markers giữ nguyên cấu trúc cây!
  → Chỉ cần 1 traversal (thay vì 2) để rebuild!

  Time: O(n), Space: O(n) cho cả 2 cách
```

---

<a id="10"></a>

## 🔟 Binary Tree Level Order Traversal

### Bài toán là gì?

```
Duyệt cây theo TỬNG TẦNG (từ trên xuống), trái → phải
Trả về mảng 2D: mỗi phần tử = 1 tầng của cây

Ví dụ:
       3
      / \
     9  20
       / \
      15   7

Output: [[3], [9, 20], [15, 7]]
  Tầng 0: [3]
  Tầng 1: [9, 20]
  Tầng 2: [15, 7]

KHÁC với DFS (Pre/In/Post-order) đi SÂU trước!
  DFS: 3 → 9 → 20 → 15 → 7 (pre-order)
  BFS: 3 → 9 → 20 → 15 → 7 (thực ra giống, nhưng NHÓM theo tầng!)
```

### Tại sao dùng BFS + Queue?

```
BFS (Breadth-First Search) = Đi RỘNG trước

  Queue (FIFO) = Vào trước, Ra trước
  → Vào: push() (cuối hàng)
  → Ra:  shift() (đầu hàng)

  Tại sao Queue mà không Stack?
    Stack (LIFO) = DFS → đi sâu trước
    Queue (FIFO) = BFS → đi rộng trước ✅

    Vì Queue xử lý nodes THEO ĐÚNGTHỨ TỰ được thêm vào
    → Thêm tầng 1 trước → xử lý tầng 1 trước → rồi mới tầng 2!
```

### Cách giải — BFS với Queue

```javascript
var levelOrder = function(root) {
    if (!root) return [];

    const result = [];
    const queue = [root];  // bắt đầu với root

    while (queue.length > 0) {
        const levelSize = queue.length;  // ⭐ SỐ NODE TRONG TẦNG HIỆN TẠI
        const currentLevel = [];

        // Duyệt TẤT CẢ nodes trong tầng này
        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift();       // lấy ra từ đầu queue
            currentLevel.push(node.val);       // ghi giá trị

            // Thêm con của node vào queue (tầng TIẾP THEO)
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        result.push(currentLevel);  // xong 1 tầng!
    }

    return result;
};
```

### Tại sao cần `levelSize`? (ĐÂY LÀ KEY INSIGHT!)

```
KHÔNG có levelSize:
  Queue: [3] → lấy 3, thêm 9, 20 → [9, 20]
  Lấy 9 → thêm con của 9 → Queue: [20, ...]
  Lấy 20 → thêm 15, 7 → Queue: [..., 15, 7]
  → KHÔNG BIẾT tầng nào kết thúc ở đâu! ❌

CÓ levelSize:
  Vòng 1: levelSize = 1 (chỉ có root)
    → Lấy đúng 1 node → tầng 0 xong!
  Vòng 2: levelSize = 2 (9 và 20)
    → Lấy đúng 2 nodes → tầng 1 xong!
  Vòng 3: levelSize = 2 (15 và 7)
    → Lấy đúng 2 nodes → tầng 2 xong!

  levelSize = queue.length TẠI THỜI ĐIỂM ĐẦU vòng lặp
  → Chụp lại số node của tầng TRƯỚC khi thêm con của chúng!
  → Biết chính xác bao nhiêu node thuộc tầng hiện tại! ✅
```

### Trace chi tiết:

```
Cây:
       3
      / \
     9  20
       / \
      15   7

═══ VÒNG 1: TẦNG 0 ═══
  queue = [3]       levelSize = 1
  currentLevel = []

  i=0: node = 3
    currentLevel = [3]
    push con: left=9 ✅, right=20 ✅
    queue = [9, 20]

  result = [[3]]

═══ VÒNG 2: TẦNG 1 ═══
  queue = [9, 20]   levelSize = 2
  currentLevel = []

  i=0: node = 9
    currentLevel = [9]
    push con: left=null ❌, right=null ❌
    queue = [20]

  i=1: node = 20
    currentLevel = [9, 20]
    push con: left=15 ✅, right=7 ✅
    queue = [15, 7]

  result = [[3], [9, 20]]

═══ VÒNG 3: TẦNG 2 ═══
  queue = [15, 7]   levelSize = 2
  currentLevel = []

  i=0: node = 15
    currentLevel = [15]
    push con: null ❌, null ❌
    queue = [7]

  i=1: node = 7
    currentLevel = [15, 7]
    push con: null ❌, null ❌
    queue = []  ← RỖNG!

  result = [[3], [9, 20], [15, 7]]

═══ queue.length = 0 → DỪNG! ═══

Final: [[3], [9, 20], [15, 7]] ✅ 🎯
```

### Biến thể quan trọng (hay gặp trong phỏng vấn):

#### 1. Level Order Bottom-Up (đảo ngược)

```javascript
// Chỉ thêm 1 dòng: đảo kết quả!
return result.reverse();
// [[15, 7], [9, 20], [3]]

// Hoặc dùng unshift thay push:
result.unshift(currentLevel); // thêm vào ĐẦU thay vì cuối
```

#### 2. Zigzag Level Order (trái → phải, phải → trái, ...)

```javascript
var zigzagLevelOrder = function(root) {
    if (!root) return [];

    const result = [];
    const queue = [root];
    let leftToRight = true;  // đổi hướng mỗi tầng

    while (queue.length > 0) {
        const levelSize = queue.length;
        const currentLevel = [];

        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift();

            // Thêm giá trị theo hướng
            if (leftToRight) {
                currentLevel.push(node.val);     // thêm cuối
            } else {
                currentLevel.unshift(node.val);  // thêm đầu (= đảo)
            }

            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        result.push(currentLevel);
        leftToRight = !leftToRight;  // đổi hướng!
    }

    return result;
};

// Input:        3
//              / \
//             9  20
//               / \
//              15   7
//
// Output: [[3], [20, 9], [15, 7]]
//          L→R    R→L     L→R
```

#### 3. Right Side View (nhìn từ bên phải)

```javascript
var rightSideView = function(root) {
    if (!root) return [];

    const result = [];
    const queue = [root];

    while (queue.length > 0) {
        const levelSize = queue.length;

        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift();

            // Chỉ lấy node CUỐI CÙNG của mỗi tầng!
            if (i === levelSize - 1) {
                result.push(node.val);
            }

            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }
    }

    return result;
};

// Input:        3                 Nhìn từ bên phải:
//              / \                Tầng 0: 3  ←
//             9  20               Tầng 1: 20 ←
//               / \               Tầng 2: 7  ←
//              15   7
//
// Output: [3, 20, 7]
```

#### 4. Average of Levels (trung bình mỗi tầng)

```javascript
var averageOfLevels = function(root) {
    if (!root) return [];

    const result = [];
    const queue = [root];

    while (queue.length > 0) {
        const levelSize = queue.length;
        let sum = 0;

        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift();
            sum += node.val;

            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        result.push(sum / levelSize);  // trung bình!
    }

    return result;
};

// Output: [3, 14.5, 11]
```

### Có thể dùng DFS thay BFS không?

```javascript
// CÓ! Dùng depth làm index cho kết quả
var levelOrder = function(root) {
    const result = [];

    function dfs(node, depth) {
        if (!node) return;

        // Nếu tầng này chưa có mảng → tạo mới
        if (depth === result.length) {
            result.push([]);
        }

        result[depth].push(node.val);  // thêm vào đúng tầng

        dfs(node.left, depth + 1);     // đi xuống tầng tiếp
        dfs(node.right, depth + 1);
    }

    dfs(root, 0);
    return result;
};
```

```
So sánh BFS vs DFS cho Level Order:

                    BFS (Queue)           DFS (Recursion)
  ──────────────────────────────────────────────────────
  Tư duy            Tự nhiên (rộng)        Hơi hack (sâu + depth)
  Time              O(n)                   O(n)
  Space             O(w) queue width       O(h) call stack
  Cây rộng          Queue lớn O(n)         Stack nhỏ O(log n) ✅
  Cây lệch          Queue nhỏ O(1) ✅      Stack lớn O(n)
  Phỏng vấn        ✅ DEFAULT CHỌN         ✅ Bonus point
  Biến thể         Dễ adapt (zigzag...)   Khó hơn

  ⚠️ BFS là ĐÁP ÁN CHUẨN cho level order!
     DFS là cách thay thế hay, cho thấy hiểu sâu.
```

### Edge Cases:

```
1. Cây rỗng (null):
   return []  (đã handle ở đầu hàm)

2. Chỉ có root:
   return [[root.val]]

3. Cây lệch 1 bên:
       1
        \
         2
          \
           3
   return [[1], [2], [3]]  (mỗi tầng 1 node)

4. Cây đầy đủ (perfect):
         1
        / \
       2   3
      / \ / \
     4  5 6  7
   return [[1], [2,3], [4,5,6,7]]  (mỗi tầng gấp đôi)
```

### Complexity:

```
Time:  O(n)  — thăm mỗi node đúng 1 lần
Space: O(n)  — queue chứa tối đa 1 tầng
  - Worst case: cây đầy đủ tầng cuối có n/2 nodes
  - Best case: cây lệch, queue chỉ có 1 node
```

```
💡 TÓM TẮT:
  Level Order = BFS + Queue + levelSize trick

  PATTERN cố định (HỌC THUỘC LÒNG!):
    1. queue = [root]
    2. while (queue.length > 0)
    3.   levelSize = queue.length   ⭐ CHỤP lại số node tầng hiện tại
    4.   for (i = 0; i < levelSize; i++)
    5.     node = queue.shift()     → xử lý
    6.     push con trái/phải vào queue

  Biến thể: thay đổi BƯỚC 5 (xử lý gì với node):
    - Level order: push val
    - Zigzag: push hoặc unshift theo hướng
    - Right view: chỉ lấy node cuối tầng
    - Average: tính sum / levelSize

  Tất cả đều O(n) time, O(n) space!
```

---

<a id="11"></a>

## 1️⃣1️⃣ RMQ & Sparse Table

### Bài toán RMQ là gì?

```
RMQ = Range Minimum Query

  Cho mảng A[0..N-1]. Trả lời Q truy vấn:
  Mỗi truy vấn (i, j): tìm VỊ TRÍ phần tử NHỎ NHẤT trong A[i..j]

  Ví dụ: A = [2, 4, 3, 1, 6, 7, 8, 9, 1, 7]

  RMQ(0, 3) = 3   (vị trí của giá trị 1)
  RMQ(1, 5) = 3   (vị trí của giá trị 1)
  RMQ(4, 8) = 8   (vị trí của giá trị 1)

  ỨNG DỤNG:
    - Tìm LCA qua Euler Tour (đã học ở section 7!)
    - Tìm min/max trên đoạn bất kì
    - Nhiều bài toán competitive programming
```

### Cách 1: Ngây thơ — <O(1), O(N)>

```javascript
// Không tiền xử lý, duyệt từng phần tử
function rmq(A, i, j) {
    let minIdx = i;
    for (let k = i + 1; k <= j; k++) {
        if (A[k] < A[minIdx]) minIdx = k;
    }
    return minIdx;
}
// Tiền xử lý: O(1), Mỗi query: O(N) — CHẬM!
```

### Cách 2: Sparse Table — <O(N log N), O(1)> ✅

```
Ý TƯỞNG:
  Tiền xử lý tất cả đoạn có độ dài là LŨY THỪA 2:
  Đoạn dài 1, 2, 4, 8, 16, ...

  M[i][j] = vị trí min trong đoạn dài 2^j bắt đầu từ i

  Ví dụ: A = [2, 4, 3, 1, 6, 7, 8, 9, 1, 7]

  M[i][0]: đoạn dài 1 (chính nó)
    M[0][0]=0, M[1][0]=1, M[2][0]=2, M[3][0]=3, ...

  M[i][1]: đoạn dài 2
    M[0][1] = min(A[0], A[1]) → vị trí 0 (A[0]=2 < A[1]=4)
    M[1][1] = min(A[1], A[2]) → vị trí 2 (A[2]=3 < A[1]=4)
    M[2][1] = min(A[2], A[3]) → vị trí 3 (A[3]=1 < A[2]=3)

  M[i][2]: đoạn dài 4
    M[0][2] = min(đoạn A[0..3]) → vị trí 3 (A[3]=1)

  CÔNG THỨC:
    M[i][0] = i  (đoạn dài 1 = chính nó)
    M[i][j] = so sánh 2 NỬA:
              nửa trái:  M[i][j-1]         (dài 2^(j-1))
              nửa phải:  M[i + 2^(j-1)][j-1] (dài 2^(j-1))

              2^j phần tử
    ┌──────────────────────────────────┐
    i ────2^(j-1)────→ mid ────2^(j-1)────→ end
    └────────────────┘   └────────────────┘
      M[i][j-1]           M[i+2^(j-1)][j-1]

    → Giống hệt Binary Lifting!
```

```javascript
// ═══ TIỀN XỬ LÝ: O(N log N) ═══
const LOG = Math.floor(Math.log2(n)) + 1;
const M = Array.from({ length: n }, () => new Array(LOG).fill(0));

// Đoạn dài 1: chính nó
for (let i = 0; i < n; i++) M[i][0] = i;

// Đoạn dài 2^j: so sánh 2 nửa
for (let j = 1; (1 << j) <= n; j++) {
    for (let i = 0; i + (1 << j) - 1 < n; i++) {
        const left = M[i][j - 1];
        const right = M[i + (1 << (j - 1))][j - 1];
        M[i][j] = A[left] <= A[right] ? left : right;
    }
}

// ═══ TRUY VẤN: O(1)! ═══
function rmq(i, j) {
    const k = Math.floor(Math.log2(j - i + 1));
    const left = M[i][k];
    const right = M[j - (1 << k) + 1][k];
    return A[left] <= A[right] ? left : right;
}
```

### Tại sao query O(1)?

```
TRICK: Dùng 2 đoạn CHỒNG LẤP phủ hết [i, j]!

  Query RMQ(2, 8):
  k = floor(log₂(8-2+1)) = floor(log₂(7)) = 2
  → Dùng 2 đoạn dài 2^2 = 4:

  Đoạn 1: M[2][2] = min(A[2..5])     ← bắt đầu từ i=2
  Đoạn 2: M[5][2] = min(A[5..8])     ← kết thúc tại j=8

  A: [2, 4, |3, 1, 6, 7, 8, 9, 1|, 7]
              ↑─── đoạn 1 ───↑
                    ↑─── đoạn 2 ───↑
              CHỒNG LẤP nhưng KHÔNG SAO!
              Vì ta tìm MIN → min(min, min) = min ✅

  ⚠️ CHỈ ĐÚNG với MIN/MAX (idempotent)!
     KHÔNG đúng với SUM (sẽ cộng trùng phần chồng!).
```

### Trace Sparse Table:

```
A = [2, 4, 3, 1, 6, 7]

j=0 (dài 1): M[i][0] = i
  M[0][0]=0  M[1][0]=1  M[2][0]=2  M[3][0]=3  M[4][0]=4  M[5][0]=5

j=1 (dài 2): so sánh cặp
  M[0][1]: A[M[0][0]]=A[0]=2 vs A[M[1][0]]=A[1]=4 → 0 (2<4)
  M[1][1]: A[1]=4 vs A[2]=3 → 2
  M[2][1]: A[2]=3 vs A[3]=1 → 3
  M[3][1]: A[3]=1 vs A[4]=6 → 3
  M[4][1]: A[4]=6 vs A[5]=7 → 4

j=2 (dài 4): so sánh 2 nửa dài 2
  M[0][2]: A[M[0][1]]=A[0]=2 vs A[M[2][1]]=A[3]=1 → 3 (1<2)
  M[1][2]: A[M[1][1]]=A[2]=3 vs A[M[3][1]]=A[3]=1 → 3
  M[2][2]: A[M[2][1]]=A[3]=1 vs A[M[4][1]]=A[4]=6 → 3

Query RMQ(1, 5):
  k = floor(log₂(5)) = 2
  left  = M[1][2] = 3
  right = M[5-4+1][2] = M[2][2] = 3
  A[3]=1 ≤ A[3]=1 → vị trí 3 ✅
```

### Mối liên hệ LCA ↔ RMQ:

```
LCA → RMQ (đã học ở section 7!):
  1. Tạo Euler Tour → mảng tour[] và depth[]
  2. LCA(u,v) = đỉnh có depth NHỎ NHẤT trong tour[st[u]..st[v]]
  3. → Chính là bài RMQ trên mảng depth!
  4. Dùng Sparse Table → O(1) per LCA query!

RMQ → LCA (thú vị!):
  1. Từ mảng A, tạo Cartesian Tree C(A)
  2. RMQ(i,j) = LCA trong C(A) của node i và node j
  → Mọi thuật toán LCA đều giải được RMQ!

  VÒNG TRÒN: LCA ↔ RMQ (tương đương nhau!)
```

```
💡 TÓM TẮT:
  RMQ = tìm min/max trên đoạn [i, j]

  Sparse Table:
    Tiền xử lý: O(N log N) — tính min cho mọi đoạn dài 2^j
    Truy vấn: O(1) — dùng 2 đoạn chồng lấp phủ hết [i,j]
    Chỉ đúng cho MIN/MAX (idempotent), KHÔNG cho SUM!

  Công thức: M[i][j] = better(M[i][j-1], M[i+2^(j-1)][j-1])
  → Giống Binary Lifting: chia đoạn 2^j = 2 đoạn 2^(j-1)!

  LCA ↔ RMQ: 2 bài toán TƯƠNG ĐƯƠNG nhau!
```

---

<a id="12"></a>

## 1️⃣2️⃣ Binary Lifting mở rộng — Min/Max trên đường đi

### Bài toán

```
Cho cây N đỉnh CÓ TRỌNG SỐ trên cạnh.
Q truy vấn: cho 2 đỉnh u, v, tìm:
  - Trọng số NHỎ NHẤT trên đường đi u → v
  - Trọng số LỚN NHẤT trên đường đi u → v

  Ví dụ:
          1
        / | \
     3/  5|   2\
      /   |     \
     2    3      4
    9|   7|     4|
     5    6      7

  Query(5, 7): đường 5→2→1→4→7
    Các cạnh: 9, 3, 2, 4
    Min = 2, Max = 9

Ý TƯỞNG: Mở rộng Binary Lifting!
  Thay vì chỉ lưu up[u][j] = tổ tiên thứ 2^j
  → Lưu THÊM min/max trọng số trên đoạn nhảy đó!
```

### Cấu trúc dữ liệu mở rộng

```
Thay vì:
  up[u][j] = tổ tiên thứ 2^j của u  (chỉ 1 số)

Lưu:
  up[u][j] = {
    par: tổ tiên thứ 2^j của u
    minC: trọng số NHỎ NHẤT trên 2^j cạnh từ u lên tổ tiên
    maxC: trọng số LỚN NHẤT trên 2^j cạnh từ u lên tổ tiên
  }

CÔNG THỨC QHĐ (giống Binary Lifting, thêm min/max):
  Đặt mid = up[u][j-1].par  (điểm giữa)

  up[u][j].par  = up[mid][j-1].par
  up[u][j].minC = min(up[u][j-1].minC, up[mid][j-1].minC)
  up[u][j].maxC = max(up[u][j-1].maxC, up[mid][j-1].maxC)

       u ─── 2^(j-1) cạnh ──→ mid ─── 2^(j-1) cạnh ──→ ancestor
       └── up[u][j-1].min/max ──┘└── up[mid][j-1].min/max ──┘
       └─────────── up[u][j].min/max = kết hợp 2 nửa ──────────┘
```

### Tiền xử lý — JavaScript

```javascript
const INF = 1e9;
const LOG = 21;

// up[u][j] = { par, minC, maxC }
const up = Array.from({ length: n + 1 }, () =>
    Array.from({ length: LOG }, () => ({ par: 0, minC: INF, maxC: -INF }))
);
const depth = new Array(n + 1).fill(0);

// DFS: tính up[v][0] = { cha, trọng số cạnh }
function dfs(u, parent) {
    for (const [v, cost] of adj[u]) {
        if (v === parent) continue;
        depth[v] = depth[u] + 1;
        up[v][0].par = u;
        up[v][0].minC = cost;  // cạnh u→v
        up[v][0].maxC = cost;
        dfs(v, u);
    }
}
dfs(1, 0);  // gốc = 1

// Xây bảng Binary Lifting mở rộng
for (let j = 1; j < LOG; j++) {
    for (let u = 1; u <= n; u++) {
        const mid = up[u][j - 1].par;  // điểm giữa
        up[u][j].par = up[mid][j - 1].par;
        up[u][j].minC = Math.min(up[u][j - 1].minC, up[mid][j - 1].minC);
        up[u][j].maxC = Math.max(up[u][j - 1].maxC, up[mid][j - 1].maxC);
    }
}
```

### Truy vấn — Tìm min/max trên đường đi u→v

```javascript
function queryPath(u, v) {
    let resMin = INF, resMax = -INF;

    // BƯỚC 1: Nâng node sâu hơn lên cùng depth
    if (depth[u] < depth[v]) [u, v] = [v, u];
    let diff = depth[u] - depth[v];

    for (let j = LOG - 1; j >= 0; j--) {
        if ((diff >> j) & 1) {
            // CẬP NHẬT min/max khi nhảy!
            resMin = Math.min(resMin, up[u][j].minC);
            resMax = Math.max(resMax, up[u][j].maxC);
            u = up[u][j].par;
        }
    }

    // BƯỚC 2: Nếu đã gặp
    if (u === v) return { min: resMin, max: resMax };

    // BƯỚC 3: Cùng nhảy, dừng ngay dưới LCA
    for (let j = LOG - 1; j >= 0; j--) {
        if (up[u][j].par !== up[v][j].par) {
            resMin = Math.min(resMin, up[u][j].minC, up[v][j].minC);
            resMax = Math.max(resMax, up[u][j].maxC, up[v][j].maxC);
            u = up[u][j].par;
            v = up[v][j].par;
        }
    }

    // BƯỚC 4: Nhảy thêm 1 bậc đến LCA
    resMin = Math.min(resMin, up[u][0].minC, up[v][0].minC);
    resMax = Math.max(resMax, up[u][0].maxC, up[v][0].maxC);

    return { min: resMin, max: resMax };
}
```

### Trace: queryPath(5, 7)?

```
Cây (gốc = 1):
          1 (depth 0)
        / | \
     3/  5|   2\
      /   |     \
     2    3      4 (depth 1)
    9|   7|     4|
     5    6      7 (depth 2)

up[][0] (cha trực tiếp + trọng số cạnh):
  node  par  minC  maxC
  2     1    3     3
  3     1    5     5
  4     1    2     2
  5     2    9     9
  6     3    7     7
  7     4    4     4

up[][1] (ông + min/max 2 cạnh):
  node  par      minC         maxC
  5     1    min(9,3)=3   max(9,3)=9
  6     1    min(7,5)=5   max(7,5)=7
  7     1    min(4,2)=2   max(4,2)=4

═══ queryPath(5, 7) ═══
  depth(5)=2, depth(7)=2 → cùng depth!
  BƯỚC 1: diff=0, không nhảy

  BƯỚC 2: u=5 ≠ v=7 → cùng nhảy

  BƯỚC 3:
    j=1: up[5][1].par=1, up[7][1].par=1 → GIỐNG → skip
    j=0: up[5][0].par=2, up[7][0].par=4 → KHÁC → NHẢY!
      resMin = min(INF, 9, 4) = 4
      resMax = max(-INF, 9, 4) = 9
      u = 2, v = 4

  BƯỚC 4: Nhảy đến LCA (node 1)
    resMin = min(4, up[2][0].minC=3, up[4][0].minC=2) = 2
    resMax = max(9, up[2][0].maxC=3, up[4][0].maxC=2) = 9

  KẾT QUẢ: min=2, max=9 ✅

  Đường 5→2→1→4→7, các cạnh: [9, 3, 2, 4]
  min=2 ✅, max=9 ✅ 🎯
```

### Mở rộng thêm: Lưu bất kì giá trị gì!

```
Binary Lifting có thể lưu BẤT KÌ thông tin nào trên đoạn:

  up[u][j] = {
    par,         // tổ tiên 2^j
    minC, maxC,  // min/max trọng số
    sumC,        // tổng trọng số
    xorC,        // XOR trọng số
    ...          // bất kì gì kết hợp được (associative)!
  }

  ĐIỀU KIỆN: phép toán phải KẾT HỢP ĐƯỢC
    min(min(a,b), c) = min(a, min(b,c)) ✅
    max(a,b) ✅, sum(a,b) ✅, xor(a,b) ✅
    → Chia đoạn 2^j = 2 đoạn 2^(j-1) rồi kết hợp!
```

### Complexity:

```
Tiền xử lý: O(N log N) — xây bảng up
Mỗi truy vấn: O(log N) — nhảy + cập nhật min/max
Bộ nhớ:      O(N log N) — bảng up (mỗi ô 3 giá trị)

  Ví dụ: N = 200.000
  Bảng: 200.000 × 18 × 3 ≈ 10.8 triệu số — ĐỦ!
```

```
💡 TÓM TẮT:
  Binary Lifting mở rộng = lưu THÊM thông tin trên mỗi đoạn nhảy

  up[u][j] = { par, minC, maxC }
  → min/max trên đường đi u→v chỉ cần O(log N)!

  CÔNG THỨC:
    up[u][j].minC = min(up[u][j-1].minC, up[mid][j-1].minC)
    (chia đoạn 2^j thành 2 đoạn 2^(j-1) rồi kết hợp!)

  TRUY VẤN: giống LCA bình thường, thêm cập nhật min/max
    Bước 1: nâng cùng depth → cập nhật
    Bước 2: cùng nhảy → cập nhật
    Bước 3: nhảy cuối đến LCA → cập nhật

  CÓ THỂ MỞ RỘNG: sum, xor, gcd, ... bất kì phép kết hợp được!
```

---

<a id="13"></a>

## 1️⃣3️⃣ Heavy-Light Decomposition (HLD)

### Bài toán

```
Cho cây N đỉnh, mỗi đỉnh có giá trị. Xử lý Q truy vấn:
  1. Cập nhật: giá trị đỉnh i → x
  2. Truy vấn: tổng XOR trên ĐƯỜNG ĐI từ u đến v

Binary Lifting: chỉ lưu min/max → KHÔNG update được!
Euler Tour + Fenwick: chỉ query CÂY CON, KHÔNG đường đi tổng quát!

→ Cần kỹ thuật MẠNH HƠN: HLD!
  Update + Query trên ĐƯỜNG ĐI bất kì → O(log² n)!
```

### Ý tưởng cốt lõi

```
BƯỚC 1: Chia cây thành CHUỖI (chains)

  Với mỗi đỉnh không phải lá:
    Con có cây con LỚN NHẤT → cạnh NẶNG (heavy edge)
    Các con còn lại          → cạnh NHẸ (light edge)

  Cạnh nặng nối liền → tạo thành CHUỖI (chain)!

  Ví dụ:
              1
            / | \
           2  3  4
          /|  |  
         5  6 7  
        /|
       8  9

  Kích thước cây con: sz[1]=9, sz[2]=5, sz[3]=2, sz[4]=1
                      sz[5]=3, sz[6]=1, sz[7]=1
                      sz[8]=1, sz[9]=1

  Heavy edges (con lớn nhất):
    1→2 (sz[2]=5 > sz[3]=2 > sz[4]=1)  ← NẶNG
    2→5 (sz[5]=3 > sz[6]=1)             ← NẶNG
    5→8 (sz[8]=1 = sz[9]=1, chọn 1)     ← NẶNG
    3→7                                  ← NẶNG

  CHUỖI hình thành:
    Chain 0: 1 → 2 → 5 → 8  (chuỗi chính, dài nhất)
    Chain 1: 6               (lá)
    Chain 2: 9               (lá)
    Chain 3: 3 → 7           (chuỗi phụ)
    Chain 4: 4               (lá)

BƯỚC 2: DFS ưu tiên heavy edge → mỗi chain = đoạn liên tục!

  DFS order: [1, 2, 5, 8, 9, 6, 3, 7, 4]
  Pos:        1  2  3  4  5  6  7  8  9

  Chain 0: pos 1-4 (1,2,5,8)  ← liên tục! ✅
  Chain 1: pos 6   (6)        ← liên tục! ✅
  Chain 2: pos 5   (9)        ← liên tục! ✅
  Chain 3: pos 7-8 (3,7)      ← liên tục! ✅
  Chain 4: pos 9   (4)        ← liên tục! ✅

  → Mỗi chain = đoạn liên tục → dùng Segment Tree!

BƯỚC 3: Query đường đi = nhảy qua các chain!

  KEY INSIGHT: Đường đi u→v đi qua tối đa O(log n) chain!

  CHỨNG MINH:
    Khi đi qua cạnh nhẹ: sz(con) ≤ sz(cha)/2
    → Mỗi lần qua cạnh nhẹ, kích thước CÂY CON ít nhất GẤP ĐÔI!
    → Tối đa log₂(n) cạnh nhẹ = log₂(n) chain!

  Mỗi chain: query Segment Tree → O(log n)
  Tổng: O(log n) chains × O(log n) Seg Tree = O(log² n)!
```

### Code hoàn chỉnh — JavaScript

```javascript
// ═══ DFS 1: Tính size cây con + depth + parent ═══
const sz = new Array(n + 1).fill(1);
const depth = new Array(n + 1).fill(0);
const par = new Array(n + 1).fill(0);

function dfs1(u, p) {
    par[u] = p;
    for (const v of adj[u]) {
        if (v === p) continue;
        depth[v] = depth[u] + 1;
        dfs1(v, u);
        sz[u] += sz[v];
    }
}
dfs1(1, 0);

// ═══ DFS 2 (HLD): Tạo chains + gán vị trí ═══
const chainHead = new Array(n + 1).fill(0);  // đầu chuỗi
const chainId = new Array(n + 1).fill(0);    // chuỗi nào
const pos = new Array(n + 1).fill(0);        // vị trí trong mảng
const arr = new Array(n + 1).fill(0);        // mảng phẳng
let curChain = 0, curPos = 1;

function hld(u, p) {
    // Gán đỉnh u vào chain hiện tại
    if (!chainHead[curChain]) chainHead[curChain] = u;
    chainId[u] = curChain;
    pos[u] = curPos;
    arr[curPos] = u;
    curPos++;

    // Tìm con NẶNG NHẤT (cây con lớn nhất)
    let heavyChild = 0;
    for (const v of adj[u]) {
        if (v !== p) {
            if (!heavyChild || sz[v] > sz[heavyChild]) {
                heavyChild = v;
            }
        }
    }

    // Đi heavy child TRƯỚC → cùng chain!
    if (heavyChild) hld(heavyChild, u);

    // Các con nhẹ → tạo chain MỚI!
    for (const v of adj[u]) {
        if (v !== p && v !== heavyChild) {
            curChain++;          // chain mới!
            hld(v, u);
        }
    }
}
curChain = 0; curPos = 1;
hld(1, 0);
```

### Segment Tree

```javascript
// Segment Tree cho XOR
const ST = new Array(4 * (n + 1)).fill(0);

function build(id, l, r) {
    if (l === r) { ST[id] = val[arr[l]]; return; }
    const mid = (l + r) >> 1;
    build(2 * id, l, mid);
    build(2 * id + 1, mid + 1, r);
    ST[id] = ST[2 * id] ^ ST[2 * id + 1];
}

function update(id, l, r, p, v) {
    if (l > p || r < p) return;
    if (l === r) { ST[id] = v; return; }
    const mid = (l + r) >> 1;
    update(2 * id, l, mid, p, v);
    update(2 * id + 1, mid + 1, r, p, v);
    ST[id] = ST[2 * id] ^ ST[2 * id + 1];
}

function query(id, tl, tr, l, r) {
    if (tl > r || tr < l) return 0;
    if (l <= tl && tr <= r) return ST[id];
    const mid = (tl + tr) >> 1;
    return query(2 * id, tl, mid, l, r) ^
           query(2 * id + 1, mid + 1, tr, l, r);
}

build(1, 1, n);
```

### Tìm LCA + Query đường đi

```javascript
// LCA bằng HLD: nhảy chain có ID lớn hơn!
function lcaHLD(u, v) {
    while (chainId[u] !== chainId[v]) {
        if (chainId[u] > chainId[v]) {
            u = par[chainHead[chainId[u]]]; // nhảy qua cạnh nhẹ
        } else {
            v = par[chainHead[chainId[v]]];
        }
    }
    return depth[u] < depth[v] ? u : v;
}

// Update đỉnh x → val mới
function updateVertex(x, newVal) {
    update(1, 1, n, pos[x], newVal);
}

// Query XOR đường đi u → v
function queryPath(u, v) {
    const lca = lcaHLD(u, v);
    let ans = 0;

    // Nhảy từ u lên LCA
    let cur = u;
    while (chainId[cur] !== chainId[lca]) {
        const head = chainHead[chainId[cur]];
        ans ^= query(1, 1, n, pos[head], pos[cur]);
        cur = par[head];  // nhảy qua cạnh nhẹ
    }

    // Nhảy từ v lên LCA
    cur = v;
    while (chainId[cur] !== chainId[lca]) {
        const head = chainHead[chainId[cur]];
        ans ^= query(1, 1, n, pos[head], pos[cur]);
        cur = par[head];
    }

    // Query đoạn còn lại trên chain chứa LCA
    const [lo, hi] = depth[u] < depth[v]
        ? [pos[u], pos[cur]]
        : [pos[cur], pos[u]];
    // Sửa: dùng pos[lca] cho chính xác
    if (depth[u] < depth[v]) {
        ans ^= query(1, 1, n, pos[lca], pos[cur]);
    } else {
        ans ^= query(1, 1, n, pos[lca], pos[cur]);
    }

    return ans;
}
```

```
⚠️ Code đơn giản hơn: gộp LCA + Query
  (Tìm LCA giống Query, chỉ khác không tính XOR)
```

```javascript
// Version GỌN HƠN: gộp LCA + Query
function queryPathSimple(u, v) {
    let ans = 0;
    while (chainId[u] !== chainId[v]) {
        // Luôn nhảy chain có ID LỚN HƠN (sâu hơn)
        if (chainId[u] < chainId[v]) [u, v] = [v, u];
        const head = chainHead[chainId[u]];
        ans ^= query(1, 1, n, pos[head], pos[u]);
        u = par[head];  // nhảy qua cạnh nhẹ → chain khác
    }
    // Giờ u, v cùng chain → query đoạn!
    if (depth[u] > depth[v]) [u, v] = [v, u];
    ans ^= query(1, 1, n, pos[u], pos[v]);
    return ans;
}
```

### Trace: queryPath(8, 7)?

```
Cây:
          1
        / | \
       2  3  4
      /|  |  
     5  6 7  
    /|
   8  9

Chains:
  Chain 0: 1→2→5→8  (pos: 1,2,3,4)
  Chain 3: 3→7       (pos: 7,8)
  Node 8: chain 0, pos 4
  Node 7: chain 3, pos 8

═══ queryPath(8, 7) ═══
  u=8, v=7

  Vòng 1: chainId[8]=0, chainId[7]=3 → KHÁC!
    chainId[7]=3 > chainId[8]=0 → nhảy v!
    head = chainHead[3] = 3
    ans ^= query(pos[3], pos[7]) = query trên chain 3
    v = par[3] = 1

  Vòng 2: chainId[8]=0, chainId[1]=0 → GIỐNG! → thoát

  Cùng chain: depth[1]=0 < depth[8]=3
    ans ^= query(pos[1], pos[8]) = query(1, 4)
    = XOR(val[1], val[2], val[5], val[8])

  Tổng: ans = XOR(val[3], val[7]) ^ XOR(val[1], val[2], val[5], val[8])
  = XOR toàn bộ đường đi 8→5→2→1→3→7 ✅ 🎯
```

### Complexity:

```
Tiền xử lý: O(N) — 2 lần DFS + build SegTree O(N)
Update:     O(log N) — 1 update SegTree
Query:      O(log² N) — O(log N) chains × O(log N) SegTree

  So sánh:
                    Binary Lifting    HLD
  ─────────────────────────────────────────────────
  Update đỉnh       ❌ Không hỗ trợ    O(log N) ✅
  Query min/max     O(log N)            O(log² N)
  Query SUM/XOR     ❌ Không support    O(log² N) ✅
  Linh hoạt         Chỉ min/max/gcd     BẤT KÌ ✅

  HLD = "vũ khí tối thượng" cho bài toán trên cây!
```

```
💡 TÓM TẮT:
  HLD = Chia cây thành CHUỖI nặng + Segment Tree

  3 BƯỚC:
    1. Tính sz[] → tìm con nặng nhất
    2. DFS ưu tiên heavy → mỗi chain liên tục trên mảng
    3. Query đường đi → nhảy qua O(log n) chain

  MỖI CHAIN = đoạn liên tục → Segment Tree xử lý!
  Update: O(log N), Query: O(log² N)

  DÙNG KHI: cần UPDATE + QUERY trên ĐƯỜNG ĐI!
  (Binary Lifting chỉ query, không update được!)
```

---

<a id="14"></a>

## 1️⃣4️⃣ Tổng hợp các phương pháp giải LCA

```
5 cách giải LCA phổ biến nhất:

  ┌────────────────────────────────────────────────────────────────────┐
  │ CÁCH          │ TIỀN XỬ LÝ   │ MỖI QUERY │ BỘ NHỚ    │ ĐẶC ĐIỂM │
  ├────────────────────────────────────────────────────────────────────┤
  │ 1. Brute Force│ O(N)          │ O(N)      │ O(N)      │ Đơn giản │
  │ 2. Binary     │ O(N log N)    │ O(log N)  │ O(N log N)│ Phổ biến │
  │    Lifting    │               │           │           │ nhất ✅   │
  │ 3. Euler Tour │ O(N log N)    │ O(1)      │ O(N log N)│ Nhanh    │
  │    + RMQ      │               │           │           │ nhất ✅   │
  │ 4. HLD        │ O(N)          │ O(log N)  │ O(N)      │ Linh hoạt│
  │               │               │           │           │ nhất ✅   │
  │ 5. Tarjan     │ O(N+Q)        │ OFFLINE   │ O(N+Q)    │ Offline  │
  │    Offline    │               │           │           │ nhanh ✅  │
  └────────────────────────────────────────────────────────────────────┘
```

### Cách 1: Brute Force (đã học ở section 5)

```
Nhảy 1 bậc mỗi lần: nâng cùng depth → cùng nhảy lên
Time: O(N) per query — chỉ dùng để hiểu concept!
```

### Cách 2: Binary Lifting / Sparse Table (đã học ở section 6)

```
Bảng up[u][j] = tổ tiên 2^j, nhảy theo lũy thừa 2
Tiền xử lý O(N log N), Query O(log N)
PHỔ BIẾN NHẤT trong competitive programming!
```

### Cách 3: Euler Tour + RMQ (đã học ở section 7)

```
Euler Tour → mảng depth → Sparse Table → RMQ → O(1)!
NHANH NHẤT cho mỗi query nhưng code phức tạp hơn.
```

### Cách 4: HLD (đã học ở section 13)

```
Chia cây thành chains, nhảy chain tìm LCA.
Ưu điểm: tiền xử lý O(N), query O(log N), bộ nhớ O(N).
LINH HOẠT NHẤT vì kết hợp được với Segment Tree!
```

### Cách 5: Tarjan's Offline LCA

```
IDEA: Biết TRƯỚC tất cả Q queries → xử lý CÙNG LÚC khi DFS!

Dùng Disjoint Set (Union-Find):
  1. DFS cây, mỗi đỉnh bắt đầu 1 tập riêng
  2. Khi THOÁT khỏi DFS(u):
     a. Với mọi query (u, v) mà v ĐÃ THĂM:
        → LCA(u, v) = đại diện tập chứa v!
     b. UNION tập chứa u vào tập chứa cha(u)
        → đại diện = cha(u)

  TẠI SAO ĐÚNG?
    Khi DFS xong v rồi quay về LCA rồi xuống u:
    v được union với cha(v), rồi ông(v), ..., rồi LCA
    → Đại diện tập chứa v = LCA(u,v) ✅
```

```javascript
// ═══ TARJAN'S OFFLINE LCA ═══
const parent = new Array(n + 1);   // Union-Find
const rank = new Array(n + 1).fill(0);
const visited = new Array(n + 1).fill(false);
const answer = new Array(Q);       // kết quả cho từng query

// Mỗi đỉnh: danh sách queries liên quan
const queries = Array.from({ length: n + 1 }, () => []);
for (let i = 0; i < Q; i++) {
    const [u, v] = inputQueries[i];
    queries[u].push({ other: v, idx: i });
    queries[v].push({ other: u, idx: i });
}

// Union-Find
function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
}
function union(x, y) {
    const px = find(x), py = find(y);
    if (px === py) return;
    if (rank[px] < rank[py]) parent[px] = py;
    else if (rank[px] > rank[py]) parent[py] = px;
    else { parent[py] = px; rank[px]++; }
}

// Khởi tạo
for (let i = 1; i <= n; i++) parent[i] = i;

// Tarjan DFS
function tarjan(u, par) {
    for (const v of adj[u]) {
        if (v === par) continue;
        tarjan(v, u);
        union(v, u);         // hợp v vào cha(u)
        parent[find(v)] = find(u);  // đại diện = u
    }

    visited[u] = true;

    // Trả lời mọi query liên quan đến u
    for (const { other, idx } of queries[u]) {
        if (visited[other]) {
            answer[idx] = find(other);  // LCA = đại diện!
        }
    }
}
tarjan(1, 0);

// Time: O((N + Q) × α(N)) ≈ O(N + Q) — GẦN TUYẾN TÍNH!
// Nhưng chỉ dùng được khi biết TRƯỚC tất cả queries!
```

### Trace Tarjan: LCA(8, 7)?

```
Cây:
          1
        / | \
       2  3  4
      /|  |
     5  6 7
    /|
   8  9

Queries: [(8, 7)]
  queries[8] = [{other:7, idx:0}]
  queries[7] = [{other:8, idx:0}]

DFS:
  tarjan(1):
    tarjan(2):
      tarjan(5):
        tarjan(8): lá, visited[8]=true
                   query (8,7): visited[7]=false → skip
        union(8, 5) → parent[8]=5
        tarjan(9): lá, visited[9]=true
        union(9, 5) → parent[9]=5
      visited[5]=true
      union(5, 2) → parent[5]=2 → find(8)=2

      tarjan(6): lá, visited[6]=true
      union(6, 2) → parent[6]=2
    visited[2]=true
    union(2, 1) → parent[2]=1 → find(8)=1

    tarjan(3):
      tarjan(7): lá, visited[7]=true
                 query (7,8): visited[8]=true!
                 → answer[0] = find(8) = find(8)→find(5)→find(2)→find(1) = 1
                 → LCA(8, 7) = 1 ✅ 🎯
```

### Khi nào dùng cách nào?

```
📋 HƯỚNG DẪN CHỌN:

  "Chỉ cần tìm LCA, không update":
    → Binary Lifting (dễ code, đủ nhanh) ✅
    → Euler + RMQ nếu cần O(1) per query

  "Cần update + query trên ĐƯỜNG ĐI":
    → HLD + Segment Tree ✅ (vũ khí tối thượng!)

  "Chỉ cần min/max trên đường đi, không update":
    → Binary Lifting mở rộng (section 12) ✅

  "Biết trước TẤT CẢ queries (offline)":
    → Tarjan (nhanh nhất, ít bộ nhớ) ✅

  "Phỏng vấn LeetCode cho binary tree":
    → Recursive DFS (section 5) — đơn giản, O(n) ✅
```

```
💡 TÓM TẮT:
  LCA có 5+ cách giải, MỖI CÁCH có ưu/nhược riêng!

  INTERVIEW:  Recursive DFS — 10 dòng, O(n), dễ hiểu
  CP BASIC:   Binary Lifting — O(log N), phổ biến nhất
  CP FAST:    Euler + RMQ — O(1), nhanh nhất mỗi query
  CP POWER:   HLD — O(log² N), linh hoạt nhất
  CP OFFLINE: Tarjan — O(N+Q), nhanh khi biết trước query

  KEY: Hiểu ƯU NHƯỢC mỗi cách → chọn đúng cho bài toán!
```

---

<a id="15"></a>

## 1️⃣5️⃣ Centroid Decomposition — Chia để trị trên cây

### Trọng tâm của cây là gì?

```
TRỌNG TÂM (Centroid) của cây = đỉnh mà khi XÓA nó:
  Mọi thành phần liên thông còn lại có ≤ n/2 đỉnh!

  Ví dụ:
        1
       / \
      2   3
     /|   |
    4  5  6
   /|
  7  8

  N = 8. Nếu xóa đỉnh 2:
    Thành phần 1: {1, 3, 6}     → 3 đỉnh ≤ 4 ✅
    Thành phần 2: {4, 7, 8}     → 3 đỉnh ≤ 4 ✅
    Thành phần 3: {5}           → 1 đỉnh ≤ 4 ✅
    → Đỉnh 2 là CENTROID! 🎯

  TÍNH CHẤT: Mọi cây đều có ít nhất 1 centroid!
```

### Tìm Centroid

```javascript
const child = new Array(n + 1).fill(0);

// Đếm kích thước cây con
function countChild(u, par) {
    child[u] = 1;
    for (const v of adj[u]) {
        if (v !== par && !deleted[v]) {
            countChild(v, u);
            child[u] += child[v];
        }
    }
}

// Tìm centroid: đi vào con có sz > n/2
function findCentroid(u, par, treeSize) {
    for (const v of adj[u]) {
        if (v !== par && !deleted[v]) {
            if (child[v] > treeSize / 2) {
                return findCentroid(v, u, treeSize);
            }
        }
    }
    return u;  // không con nào > n/2 → u là centroid!
}

// Sử dụng:
countChild(root, 0);
const centroid = findCentroid(root, 0, child[root]);
```

```
Trace tìm centroid trên cây 8 đỉnh:

        1 (sz=8)
       / \
      2   3 (sz=2)
     /|   |
    4  5  6
   /|
  7  8

  n=8, n/2=4
  findCentroid(1): child[2]=6 > 4 → đi xuống 2
  findCentroid(2): child[4]=3 ≤ 4, child[5]=1 ≤ 4
    Không con nào > 4 → return 2
  Centroid = 2 ✅
```

### Thuật toán Centroid Decomposition

```
Ý TƯỞNG: "Chia để trị" trên cây!

  1. Tìm CENTROID của cây
  2. Xử lý tất cả đường đi ĐI QUA centroid
  3. XÓA centroid → tạo nhiều cây con nhỏ hơn
  4. LẶP LẠI bước 1-3 cho mỗi cây con

  TẠI SAO NHANH?
    Khi xóa centroid: mỗi cây con có ≤ n/2 đỉnh!
    → Tối đa log₂(n) tầng đệ quy!
    → Tổng đỉnh xử lý: O(n × log n)!

  Ví dụ với cây 8 đỉnh:

  Tầng 0: [1,2,3,4,5,6,7,8] → centroid=2, xử lý, xóa 2
  Tầng 1: [1,3,6] centroid=1    [4,7,8] centroid=4    [5] centroid=5
  Tầng 2: [3,6] centroid=3       [7] c=7  [8] c=8
  Tầng 3: [6] centroid=6

  Tổng: 8 + (3+3+1) + (2+1+1) + 1 = 20 ≤ 8 × 4 = 32 ✅
  (mỗi tầng tổng ≤ n, có ≤ log n tầng)
```

### Bài toán: Đếm đường đi dài k

```
Cho cây N đỉnh, đếm số đường đi có độ dài đúng bằng k.

IDEA:
  Mọi đường đi trên cây chia 2 loại:
    1. Đi QUA centroid → xử lý ở bước 2
    2. KHÔNG đi qua centroid → xử lý ở cây con (bước 4)

  Bước 2: Đếm đường đi dài k đi qua centroid:
    DFS từ centroid, với mỗi đỉnh v có khoảng cách d:
    Cần tìm đỉnh ở cây con KHÁC có khoảng cách k-d!
    Dùng mảng cnt[]: cnt[d] = số đỉnh có khoảng cách d đến centroid
```

```javascript
const deleted = new Array(n + 1).fill(false);

function solve(u) {
    countChild(u, 0);
    const treeSize = child[u];
    const root = findCentroid(u, 0, treeSize);

    // Bước 2: đếm đường đi qua root
    let result = countPaths(root, treeSize);

    // Bước 3: xóa centroid
    deleted[root] = true;

    // Bước 4: đệ quy cây con
    for (const v of adj[root]) {
        if (!deleted[v]) {
            result += solve(v);
        }
    }

    return result;
}

// Đếm đường đi dài k đi qua root
function countPaths(root, treeSize) {
    const cnt = new Array(treeSize + 1).fill(0);
    cnt[0] = 1;  // centroid có khoảng cách 0
    let result = 0;
    let maxDepth = 0;

    for (const v of adj[root]) {
        if (deleted[v]) continue;

        // DFS tìm khoảng cách mỗi đỉnh đến root
        const distances = [];
        dfsDistances(v, root, 1, distances);

        // Ghép: dỉnh khoảng cách d + đỉnh khoảng cách (k-d) = k!
        for (const d of distances) {
            if (k - d >= 0 && k - d <= maxDepth) {
                result += cnt[k - d];
            }
        }

        // Cập nhật cnt SAU (tránh ghép 2 đỉnh cùng cây con!)
        for (const d of distances) {
            if (d <= treeSize) {
                cnt[d]++;
                maxDepth = Math.max(maxDepth, d);
            }
        }
    }

    return result;
}

function dfsDistances(u, par, dist, distances) {
    distances.push(dist);
    for (const v of adj[u]) {
        if (v !== par && !deleted[v]) {
            dfsDistances(v, u, dist + 1, distances);
        }
    }
}

const answer = solve(1);
```

### Cây trọng tâm (Centroid Tree)

```
Khi phân tách, các centroid tạo thành CÂY MỚI gọi là CÂY TRỌNG TÂM:

  Cha của centroid cây con = centroid cây cha

  Ví dụ:
  Cây gốc:              Cây trọng tâm:
        1                      2
       / \                 /  |  \
      2   3               1   4   5
     /|   |               |  / \
    4  5  6               3  7  8
   /|                     |
  7  8                    6

  TÍNH CHẤT QUAN TRỌNG:
    1. Cùng số đỉnh với cây gốc
    2. ĐỘ CAO ≤ log₂(n)!
    3. LCA(u,v) trên cây trọng tâm NẰM TRÊN đường đi u→v cây gốc!

  TÍNH CHẤT 3 CỰC KỲ MẠNH:
    dist(u,v) = dist(u, LCA_ct) + dist(LCA_ct, v)
    → Tính trước dist(u, tổ tiên) cho MỌc đỉnh
    → Chỉ có n × log(n) cặp!
```

```javascript
// Xây cây trọng tâm
const centroidParent = new Array(n + 1).fill(0);

function buildCentroidTree(u) {
    countChild(u, 0);
    const root = findCentroid(u, 0, child[u]);

    deleted[root] = true;

    for (const v of adj[root]) {
        if (!deleted[v]) {
            const childCentroid = buildCentroidTree(v);
            centroidParent[childCentroid] = root; // cha trên cây trọng tâm
        }
    }

    return root;
}

const centroidRoot = buildCentroidTree(1);
// centroidRoot là gốc của cây trọng tâm
```

### Ứng dụng: Tìm đỉnh trắng gần nhất (QTREE5)

```
Bài toán: Cây N đỉnh, ban đầu tất cả đen.
  Update: đổi màu đỉnh u
  Query:  khoảng cách từ u đến đỉnh TRẮNG gần nhất

IDEA dùng CÂY TRỌNG TÂM:
  Với mỗi đỉnh p trên cây trọng tâm:
    Lưu multiset chứa khoảng cách từ p đến các đỉnh TRẮNG
    là con của p trên cây trọng tâm

  Update(đổi màu u):
    Duyệt từ u lên gốc cây trọng tâm (chỉ log n tầng!)
    Thêm/xóa dist(u, p) trong multiset của p

  Query(u):
    Duyệt từ u lên gốc cây trọng tâm
    Ở mỗi đỉnh p: ans = min(ans, dist(u,p) + min_trong_multiset(p))
    Chỉ log n tầng → O(log² n) mỗi query!
```

### Complexity:

```
Tiền xử lý: O(N log N) — xây cây trọng tâm
Mỗi query:   O(log² N) — duyệt log N tầng, mỗi tầng O(log N)

  So sánh với HLD:
                    HLD              Centroid Decomp
  ────────────────────────────────────────────────────
  Path query       O(log² N)         O(log² N)
  Update + query   Segment Tree      Multiset/Fenwick
  Dùng cho          Đoạn trên path    Đường đi qua centroid
  Kết hợp           SegTree           Divide & Conquer

  HLD: query/update ĐOẠN trên đường đi (sum, xor, ...)
  Centroid: đếm/tìm đường đi thỏa điều kiện (dài k, palindrome, ...)
```

```
💡 TÓM TẮT:
  Centroid Decomposition = CHIA ĐỂ TRỊ trên cây!

  3 BƯỚC:
    1. Tìm centroid (xóa → mỗi phần ≤ n/2)
    2. Xử lý đường đi đi QUA centroid
    3. Xóa centroid, đệ quy cây con

  CÂY TRỌNG TÂM: độ cao ≤ log(n)
    → Chỉ n × log(n) cặp (đỉnh, tổ tiên)
    → Tính trước mọi khoảng cách đến tổ tiên!

  DÙNG KHI:
    - Đếm đường đi dài k
    - Tìm đường đi palindrome
    - Update/query theo khoảng cách
    - Mọi bài "chia để trị trên cây"!
```

---

## 🎯 Tổng kết — Mọi thứ ghép lại

```
BÀI PALINDROMIC PATH QUERIES dùng TẤT CẢ 8 concept:

  Recursion        → DFS duyệt cây
  XOR              → đếm chẵn/lẻ ký tự
  Bitmask          → mỗi ký tự = 1 bit, check palindrome
  Prefix XOR       → XOR từ root đến node
  LCA              → tìm tổ tiên chung, chia path u→v
  Binary Lifting   → tìm LCA nhanh O(log n)
  Euler Tour       → dẹp cây thành mảng
  Fenwick Tree     → update + query prefix XOR O(log n)

  FLOW:
  ┌──────────┐    ┌───────────┐    ┌──────────────┐
  │ Euler    │───→│ Fenwick   │───→│ Prefix XOR   │
  │ Tour     │    │ Tree      │    │ per node     │
  └──────────┘    └───────────┘    └──────┬───────┘
                                          │
  ┌──────────┐    ┌───────────┐    ┌──────▼───────┐
  │ Binary   │───→│ LCA       │───→│ Path XOR     │
  │ Lifting  │    │           │    │ u→v          │
  └──────────┘    └───────────┘    └──────┬───────┘
                                          │
  ┌──────────┐    ┌───────────┐    ┌──────▼───────┐
  │ XOR      │───→│ Bitmask   │───→│ Palindrome   │
  │          │    │           │    │ Check        │
  └──────────┘    └───────────┘    └──────────────┘
```
