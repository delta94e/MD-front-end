# 🌳 Count Good Nodes in Binary Tree (LeetCode #1448)

> 📖 Code: [Count Good Nodes in Binary Tree.js](./Count%20Good%20Nodes%20in%20Binary%20Tree.js)

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

> ⚡ **Đọc phần này TRƯỚC. Nếu bạn chỉ nhớ 1 thứ, nhớ phần này.**

### 1️⃣ Analogy — Ví dụ đời thường

```
🏔️ LEO NÚI — đây là TẤT CẢ bạn cần nhớ!

  Bạn leo núi từ CHÂN NÚI (root) lên các ĐỈNH (nodes).
  Đi đến mỗi điểm, bạn nhìn lại:
    "Đây có phải là ĐIỂM CAO NHẤT mình từng qua không?"

  → NẾU CÓ (hoặc bằng) → "Good node!" ✅ → ghi vào sổ!
  → NẾU KHÔNG (đã qua điểm cao hơn) → "Không good" ❌

  Root LUÔN LUÔN là good node (chưa đi qua đâu!)

  ĐÓ LÀ TẤT CẢ. Đếm bao nhiêu "good nodes".
```

### 2️⃣ Recipe — 3 bước, ghi nhớ MÃI MÃI

```
📝 RECIPE (3 bước — viết đi viết lại cho đến khi thuộc):

  Bước 1: Nếu node === null → return 0 (không có node, không đếm)
  Bước 2: node.val >= maxSoFar? → ĐẾM 1! Cập nhật max mới!
  Bước 3: Đi tiếp vào left VÀ right, mang theo maxSoFar

  Trick: truyền maxSoFar TỪ TRÊN XUỐNG (pre-order!)
```

```javascript
// Đây là BẢN CHẤT — hàm DFS truyền max xuống:
function goodNodes(root) {
  function dfs(node, maxSoFar) {
    if (!node) return 0; // Bước 1: DỪNG
    let count = 0;
    if (node.val >= maxSoFar) count = 1; // Bước 2: GOOD!
    maxSoFar = Math.max(maxSoFar, node.val); // cập nhật max
    count += dfs(node.left, maxSoFar); // Bước 3: đi tiếp
    count += dfs(node.right, maxSoFar);
    return count;
  }
  return dfs(root, root.val);
}
```

### 3️⃣ Visual — Hình ảnh ghi vào đầu

```
         3
        / \
       1   4
      /   / \
     3   1   5

Path đến mỗi node → max trên path → good?

  3:        path=[3],       max=3  → 3>=3  ✅ GOOD!
  1:        path=[3,1],     max=3  → 1>=3  ❌
  3(lá):    path=[3,1,3],   max=3  → 3>=3  ✅ GOOD!
  4:        path=[3,4],     max=3  → 4>=3  ✅ GOOD!
  1(phải):  path=[3,4,1],   max=4  → 1>=4  ❌
  5:        path=[3,4,5],   max=4  → 5>=4  ✅ GOOD!

  Tổng: 4 good nodes ✅
```

### 4️⃣ Tại sao dùng DFS pre-order?

```
❓ "Tại sao pre-order chứ không phải post-order?"

Vì thông tin đi TỪ TRÊN XUỐNG — ngược với Balanced Tree!

  Balanced Tree: cần height TỪ CON → post-order (bottom-up)
  Good Nodes:    cần maxSoFar TỪ CHA → pre-order (top-down!)

  Cha truyền maxSoFar cho con → con so sánh → truyền tiếp!
  Con KHÔNG CẦN trả gì cho cha (ngoài count)
```

### 5️⃣ Flashcard — Tự kiểm tra

> Che cột bên phải, trả lời rồi mở ra check!

| ❓ Câu hỏi | ✅ Đáp án |
|---|---|
| Good node nghĩa là gì? | node.val >= MỌI tổ tiên trên path từ root |
| Root có phải good node? | **LUÔN LUÔN!** (không ai ở trên root) |
| Base case? | `if (!node) return 0` |
| Truyền gì xuống con? | `maxSoFar` = max value trên path hiện tại |
| Pre-order hay Post-order? | **Pre-order!** (top-down, truyền max xuống) |
| Time complexity? | **O(n)** — mỗi node visit 1 lần |
| Space complexity? | **O(h)** — call stack, h = height |
| Node value âm thì sao? | Vẫn OK! So sánh >= vẫn đúng với số âm |
| Cây chỉ 1 node? | return 1 (root luôn good) |

### 6️⃣ Sai lầm phổ biến — ĐỪNG mắc!

```
❌ SAI LẦM #1: Chỉ so sánh với CHA trực tiếp!

   Node 5 path = [3, 4, 5]
   So sánh 5 >= 4 (cha)? ✅
   NHƯNG phải so sánh 5 >= MAX(3,4) = 4! → vẫn ✅

   Nếu path = [10, 4, 5]:
   So sánh 5 >= 4 (cha)? ✅ ← SAI! Phải check cả ông!
   So sánh 5 >= MAX(10,4) = 10? ❌ → KHÔNG good!

   → Phải truyền MAX trên TOÀN BỘ path, không chỉ cha!

─────────────────────────────────────────────────────

❌ SAI LẦM #2: Quên cập nhật maxSoFar!

   dfs(node.left, maxSoFar);   ← THIẾU cập nhật!
   
   Phải:
   maxSoFar = Math.max(maxSoFar, node.val);
   dfs(node.left, maxSoFar);   ← ĐÚNG!

─────────────────────────────────────────────────────

❌ SAI LẦM #3: Dùng > thay vì >=!

   node.val > maxSoFar?  ← SAI! Bằng cũng là good!
   node.val >= maxSoFar? ← ĐÚNG!

   Path [3, 1, 3]: node 3 cuối cùng = 3 >= 3 = GOOD!

─────────────────────────────────────────────────────

❌ SAI LẦM #4: Dùng biến global cho maxSoFar!

   Mỗi PATH có max RIÊNG! Nhánh trái khác nhánh phải!
   → maxSoFar phải là THAM SỐ, không phải global!
```

### 7️⃣ Luyện tập — Spaced Repetition

```
📅 LỊCH LUYỆN TẬP (viết code trên giấy, KHÔNG nhìn!):

  Ngày 1: Đọc hiểu → viết code nhìn tài liệu
  Ngày 2: Viết code KHÔNG NHÌN → check → sửa
  Ngày 4: Viết lại + giải thích bằng lời (như interview)
  Ngày 7: Viết + trace ví dụ + nói complexity
  Ngày 14: Full mock: clarify → draw → approach → code → trace
  Ngày 30: Viết lại lần cuối → nếu đúng = ĐÃ THUỘC!

  💡 Mỗi lần viết, tự hỏi:
  → "Truyền gì xuống?" (maxSoFar)
  → "Good khi nào?" (val >= maxSoFar)
  → "Top-down hay Bottom-up?" (Top-down! Pre-order!)
  → "Complexity?" (O(n) time, O(h) space)
```

---

### 8️⃣ Cách TƯ DUY để tự giải — Gặp lại vẫn làm được!

> 🎯 **Mục tiêu:** Không phải nhớ code, mà nhớ **CÁCH NGHĨ**.

**Bước 1: Đọc đề → Hỏi "Good node cần biết gì?"**

```
🧠 "Mỗi node cần biết: CÓ NODE NÀO trên path LỚN HƠN tôi không?"
   → Cần biết MAX trên path từ root đến đây!
   → Thông tin đi TỪ TRÊN XUỐNG → pre-order!
   → Truyền maxSoFar làm tham số!
```

**Bước 2: Hỏi "Mỗi node làm gì?"**

```
🧠 So sánh: val >= maxSoFar?
   → CÓ: đếm 1 + cập nhật max
   → KHÔNG: không đếm, vẫn đi tiếp (max không đổi)
```

**Bước 3: Ghép lại → thành code**

```
🧠 "Nếu null → 0.
   So sánh val vs maxSoFar → đếm.
   Cập nhật max → đi tiếp left, right."

   → KHÔNG CẦN NHỚ CODE! Chỉ cần trả lời:
   "Truyền gì xuống? So sánh gì? Đếm khi nào?"
```

**💡 So sánh pattern TOP-DOWN vs BOTTOM-UP:**

```
┌────────────────────────────────────────────────────┐
│  TOP-DOWN (truyền info XUỐNG):                     │
│    → Good Nodes: truyền maxSoFar xuống             │
│    → Path Sum: truyền currentSum xuống             │
│    → Depth: truyền depth xuống                     │
│                                                    │
│  BOTTOM-UP (nhận info TỪ CON lên):                 │
│    → Balanced Tree: con trả height lên             │
│    → Max Depth: con trả depth lên                  │
│    → Diameter: con trả depth, gộp ở node           │
│                                                    │
│  "Cần info TỪ CHA?" → top-down (parameter!)       │
│  "Cần info TỪ CON?" → bottom-up (return value!)    │
└────────────────────────────────────────────────────┘
```

---

> 📚 **Phần dưới đây là GIẢI THÍCH CHI TIẾT.** Đọc khi muốn hiểu SÂU hơn.

---

## R — Repeat & Clarify (Nhắc lại + Hỏi rõ)

💬 *"Bài yêu cầu đếm số 'good nodes' — node X là good nếu trên đường từ root đến X, KHÔNG có node nào có giá trị LỚN HƠN X."*

### Câu hỏi cần hỏi interviewer:

1. **"Root luôn good?"** → CÓ! Không ai ở trên root.
2. **"Giá trị có thể âm?"** → CÓ! Constraints: -10⁴ ≤ val ≤ 10⁴.
3. **"Giá trị BẰNG thì sao?"** → Vẫn GOOD! >= chứ không phải >
4. **"Tree có thể rỗng?"** → KHÔNG! Constraints: ≥ 1 node.

```
          3
         / \
        1   4
       /   / \
      3   1   5

Good nodes (đánh dấu ✅):
  3✅ → root, luôn good!
  1❌ → path [3,1], 1 < 3
  3✅ → path [3,1,3], 3 >= max(3,1) = 3
  4✅ → path [3,4], 4 >= 3
  1❌ → path [3,4,1], 1 < 4
  5✅ → path [3,4,5], 5 >= max(3,4) = 4

Output: 4
```

---

## E — Examples (Ví dụ)

```
VÍ DỤ 1:
          3              
         / \             
        1   4            4 good nodes
       /   / \
      3   1   5          Good: 3(root), 3(lá), 4, 5

VÍ DỤ 2:
      3
     / \
    3   null             3 good nodes
   / \
  4   2                  Good: 3(root), 3, 4
                         Bad: 2 (path [3,3,2], 2 < 3)

VÍ DỤ 3: [1] → 1       (root luôn good)

VÍ DỤ 4: Tất cả giảm dần
    5
   / \
  3   2                  1 good node (chỉ root!)
 /
1

VÍ DỤ 5: Tất cả tăng dần
    1
   / \
  2   3                  5 good nodes (TẤT CẢ đều good!)
 / \
4   5
```

---

## A — Approach (Cách tiếp cận)

```
┌──────────────────────────────────────────────────────────┐
│ APPROACH: DFS Pre-order + truyền maxSoFar               │
│ → Mỗi node: so sánh val vs maxSoFar → đếm!             │
│ → Truyền max(maxSoFar, val) xuống con                   │
│ → Time: O(n) | Space: O(h) call stack                   │
└──────────────────────────────────────────────────────────┘
```

💬 *"Dùng DFS vì cần theo dõi PATH từ root → mỗi nhánh có maxSoFar RIÊNG."*

---

## C — Code

> 📖 Full code: [Count Good Nodes in Binary Tree.js](./Count%20Good%20Nodes%20in%20Binary%20Tree.js)

### DFS Pre-order — O(n)

```javascript
function goodNodes(root) {
  function dfs(node, maxSoFar) {
    if (!node) return 0;

    let count = node.val >= maxSoFar ? 1 : 0; // good?
    maxSoFar = Math.max(maxSoFar, node.val); // cập nhật max

    count += dfs(node.left, maxSoFar); // đi trái
    count += dfs(node.right, maxSoFar); // đi phải
    return count;
  }
  return dfs(root, root.val);
}
```

### Trace ví dụ:

```
Tree:      3
          / \
         1   4
        /   / \
       3   1   5

dfs(3, max=3):
  3 >= 3? ✅ count = 1
  max = max(3,3) = 3

  dfs(1, max=3):
    1 >= 3? ❌ count = 0
    max = max(3,1) = 3

    dfs(3, max=3):
      3 >= 3? ✅ count = 1
      dfs(null) → 0, dfs(null) → 0
      return 1
    dfs(null) → 0
    return 0 + 1 + 0 = 1

  dfs(4, max=3):
    4 >= 3? ✅ count = 1
    max = max(3,4) = 4        ← max TĂNG!

    dfs(1, max=4):                ← max=4 chứ không phải 3!
      1 >= 4? ❌ count = 0
      return 0
    dfs(5, max=4):
      5 >= 4? ✅ count = 1
      return 1
    return 1 + 0 + 1 = 2

  return 1 + 1 + 2 = 4 ✅
```

---

## T — Test (Kiểm thử)

```
TEST CASES:

  ✅ [3,1,4,3,null,1,5]    → 4
  ✅ [3,3,null,4,2]         → 3
  ✅ [1]                    → 1 (root only)
  ✅ [5,3,2,1]              → 1 (chỉ root, tất cả giảm)
  ✅ [1,2,3,4,5]            → 5 (tất cả tăng)
  ✅ [3,3,3,3,3]            → 5 (tất cả bằng nhau = good!)
  ✅ [-1,-2,-3]             → 1 (chỉ root, số âm giảm)
  ✅ [-3,-2,-1]             → 3 (số âm tăng = tất cả good!)
```

---

## O — Optimize (Tối ưu)

```
┌─────────────────┬──────────────┬──────────────┐
│ Approach         │ Time         │ Space        │
├─────────────────┼──────────────┼──────────────┤
│ DFS Pre-order   │ O(n)         │ O(h)         │
│ BFS + Queue     │ O(n)         │ O(n)         │
└─────────────────┴──────────────┴──────────────┘

  Không thể nhanh hơn O(n) — phải xem mọi node!
  DFS tốt hơn BFS về space (O(h) vs O(n)) cho cây balanced.
```

---

## 🧩 Pattern Recognition — Bài tương tự

```
Pattern: "TOP-DOWN DFS + truyền info xuống"

  Good Nodes (#1448)         → truyền maxSoFar xuống
  Path Sum (#112)            → truyền remainingSum xuống
  Max Depth (#104)           → truyền depth xuống (hoặc bottom-up)
  Smallest String (#988)     → truyền path string xuống

  CHUNG: cha truyền thông tin → con dùng → truyền tiếp!

  TEMPLATE:
  function dfs(node, infoFromParent) {
    if (!node) return BASE;
    // dùng infoFromParent tại node hiện tại
    const newInfo = update(infoFromParent, node);
    dfs(node.left, newInfo);
    dfs(node.right, newInfo);
  }
```

---

## 🔗 Liên hệ với bài đã học

```
Good Nodes vs Balanced Tree:
  Good Nodes:    top-down  (truyền max XUỐNG con)
  Balanced Tree: bottom-up (con trả height LÊN cha)

Good Nodes vs Invert Tree:
  Cả 2 đều pre-order! (xử lý node TRƯỚC, rồi đi xuống)
  Invert: không truyền info    → dễ
  Good Nodes: truyền maxSoFar  → thêm 1 tham số

Good Nodes vs Path Sum:
  Giống nhau! Cả 2 truyền 1 giá trị XUỐNG
  Path Sum: truyền remainingSum
  Good Nodes: truyền maxSoFar
  Cùng PATTERN!
```

---

## 🗣️ Think Out Loud — Kịch Bản Interview Chi Tiết

> Format: 🎙️ = **NÓI TO** | 🧠 = **SUY NGHĨ THẦM**

---

### 📌 Phút 0–2: Nhận đề + Clarify

🧠 *"Good nodes — cần track max trên path. DFS + truyền max xuống."*

> 🎙️ *"The problem asks me to count nodes that are 'good' — a node is good if its value is greater than or equal to the maximum value of all its ancestors on the path from the root."*

> 🎙️ *"A few clarifications:*
> *— The root is always good since it has no ancestors, correct?"*
> *(Interviewer: "Yes.")*
>
> *"— Values can be negative? And 'greater than or equal' — so duplicate values count as good?"*
> *(Interviewer: "Yes to both.")*

---

### 📌 Phút 2–4: Vẽ ví dụ + Trace tay

> 🎙️ *"Let me draw an example."*
> ```
>       3
>      / \
>     1   4
>    /   / \
>   3   1   5
> ```

> 🎙️ *"I'll trace each path:*
> *— Node 3 (root): no ancestors, good ✅*
> *— Node 1: path max = 3, 1 < 3, not good ❌*
> *— Node 3 (leaf): path max = 3, 3 >= 3, good ✅*
> *— Node 4: path max = 3, 4 >= 3, good ✅*
> *— Node 1 (right): path max = 4, 1 < 4, not good ❌*
> *— Node 5: path max = 4, 5 >= 4, good ✅*
> *Total: 4"*

---

### 📌 Phút 4–6: Nói Approach

> 🎙️ *"I notice that each node needs to know the maximum value on the path from the root to itself. This is TOP-DOWN information — each parent passes its path max to its children."*

> 🎙️ *"I'll use DFS with a parameter maxSoFar. At each node:*
> *1. Check if node.val >= maxSoFar → count 1*
> *2. Update maxSoFar = max(maxSoFar, node.val)*
> *3. Recurse into both children with updated maxSoFar"*

> 🎙️ *"Time: O(n) — visit each node once. Space: O(h) — recursion stack."*

---

### 📌 Phút 6–9: Code + Narrate

> 🎙️ *"Base case: null node returns 0 — no node to count."*

> 🎙️ *"At each node, I check if it's good: val >= maxSoFar gives me 1 or 0. Then I update maxSoFar and recurse into both children, summing up their counts."*

```javascript
function goodNodes(root) {
  function dfs(node, maxSoFar) {
    if (!node) return 0;
    let count = node.val >= maxSoFar ? 1 : 0;
    maxSoFar = Math.max(maxSoFar, node.val);
    count += dfs(node.left, maxSoFar);
    count += dfs(node.right, maxSoFar);
    return count;
  }
  return dfs(root, root.val);
}
```

> 🎙️ *"The key insight: maxSoFar is a PARAMETER, not global. Each path has its OWN max because when we recurse left vs right, each branch gets its own copy of maxSoFar."*

---

### 📌 Phút 9–11: Trace + Complexity

> 🎙️ *"Let me trace with my example... root dfs(3, max=3): count=1, left returns 1, right returns 2, total 4. Matches expected output. ✅"*

> 🎙️ *"Time O(n) — each node visited once, constant work per node. Space O(h) — balanced tree gives O(log n), skewed gives O(n). This is optimal since we must check every node."*

---

### 📌 Khi bạn BÍ — Emergency Phrases

```
  🎙️ "I need to track something ALONG THE PATH from root.
      That suggests passing a parameter down through DFS..."
  🎙️ "What does each node need to know from its ancestors?
      The MAXIMUM value seen so far on the path!"
  🎙️ "This is a top-down pattern — parent passes info to child,
      unlike bottom-up where child returns info to parent..."
```

---

### 📌 Follow-up Q&A

**Q1: "Can you solve this iteratively?"**

> 🎙️ *"Yes — using a stack with tuples (node, maxSoFar). Push root, then while stack is not empty: pop, check good, push children with updated max."*

**Q2: "What if we want the LIST of good nodes, not just count?"**

> 🎙️ *"Instead of count += 1, push node.val to a result array. Same DFS, different collection method."*

**Q3: "How is this different from Path Sum (#112)?"**

> 🎙️ *"Same pattern! Path Sum passes remainingSum down, Good Nodes passes maxSoFar down. Both are top-down DFS with a parameter. The only difference is what we track and what we check."*

---

### 🧠 Nguyên tắc Think Out Loud — Good Nodes

```
TÓM TẮT:

  📌 Phút 0-2:  Clarify: root luôn good, >= không phải >
  📌 Phút 2-4:  Vẽ ví dụ, trace từng path
  📌 Phút 4-6:  "Top-down info → DFS + parameter maxSoFar"
  📌 Phút 6-9:  Code: dfs(node, maxSoFar) → count
  📌 Phút 9-11: Trace + complexity O(n), O(h)

  KEY POINTS:
  ✅ maxSoFar là PARAMETER (mỗi path riêng!)
  ✅ >= chứ không phải >
  ✅ Top-down pattern (truyền info xuống)
  ✅ Root luôn good
  ✅ Cập nhật max TRƯỚC khi recurse
```
