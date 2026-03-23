# 🌳 Count the Number of Good Nodes (LeetCode #3249)

> 📖 Code: [Count the Number of Good Nodes.js](./Count%20the%20Number%20of%20Good%20Nodes.js)

---

## 🧠 Bản chất bài toán — Hiểu để NHỚ, không chỉ để GIẢI

> ⚡ **Đọc phần này TRƯỚC. Nếu bạn chỉ nhớ 1 thứ, nhớ phần này.**

### 1️⃣ Analogy — Ví dụ đời thường

```
👨‍👩‍👧‍👦 CHIA PIZZA — đây là TẤT CẢ bạn cần nhớ!

  Bạn là SẾP (root), chia pizza cho các nhóm (subtrees).
  Mỗi nhóm trưởng cũng chia cho nhóm nhỏ dưới mình.

  SẾP là "GOOD" nếu: chia BẰNG NHAU cho TẤT CẢ nhóm!
    → Nhóm A có 3 người, nhóm B có 3 người → ĐỀU! ✅ GOOD!
    → Nhóm A có 3 người, nhóm B có 5 người → KHÔNG ĐỀU! ❌

  Leaf (nhân viên không quản lý ai) → LUÔN GOOD! (không chia cho ai!)

  ĐÓ LÀ TẤT CẢ. Đếm bao nhiêu "good nodes".
```

```
LƯU Ý: Bài này KHÁC bài #1448!

  #1448: Binary tree, good = val >= max trên path (top-down)
  #3249: General tree (graph), good = mọi subtree CÙNG SIZE (bottom-up!)
```

### 2️⃣ Recipe — 3 bước, ghi nhớ MÃI MÃI

```
📝 RECIPE (3 bước):

  Bước 1: Dựng adjacency list từ edges
  Bước 2: DFS from root=0, tính SIZE subtree mỗi node
  Bước 3: Tại mỗi node, check: mọi con có subtree SIZE = nhau?

  → CÓ = GOOD! Đếm 1.
  → Leaf = GOOD luôn! (0 con → trivially equal!)
```

```javascript
// BẢN CHẤT:
function countGoodNodes(edges) {
  const n = edges.length + 1;
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }

  let count = 0;

  function dfs(node, parent) {
    let size = 1; // chính node này
    let childSize = -1; // size con đầu tiên (chưa biết)
    let isGood = true;

    for (const neighbor of adj[node]) {
      if (neighbor === parent) continue; // đừng quay lại cha!
      const subSize = dfs(neighbor, node); // hỏi con: "nhóm mày bao nhiêu người?"
      size += subSize;

      if (childSize === -1) childSize = subSize; // con đầu tiên
      else if (subSize !== childSize) isGood = false; // khác size → NOT good!
    }

    if (isGood) count++; // leaf hoặc mọi con cùng size!
    return size;
  }

  dfs(0, -1);
  return count;
}
```

### 3️⃣ Visual — Hình ảnh ghi vào đầu

```
VÍ DỤ 1: edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]]

        0
       / \
      1   2
     / \ / \
    3  4 5  6

  Node 3,4,5,6: LEAF → GOOD ✅ (không con)
  Node 1: con = {3,4} → size 1 và 1 → BẰNG! ✅ GOOD!
  Node 2: con = {5,6} → size 1 và 1 → BẰNG! ✅ GOOD!
  Node 0: con = {1,2} → size 3 và 3 → BẰNG! ✅ GOOD!

  Tổng: 7 good nodes ✅ (TẤT CẢ!)
```

```
VÍ DỤ 2: edges = [[0,1],[1,2],[2,3],[3,4],[0,5],[1,6],[2,7],[3,8]]

        0
       / \
      1   5
     / \
    2   6
   / \
  3   7
 / \
4   8

  Node 4,8,5,6,7: LEAF → GOOD ✅
  Node 3: con = {4,8} → size 1,1 → BẰNG! ✅
  Node 2: con = {3,7} → size 3,1 → KHÔNG BẰNG! ❌
  Node 1: con = {2,6} → size 5,1 → KHÔNG BẰNG! ❌
  Node 0: con = {1,5} → size 7,1 → KHÔNG BẰNG! ❌

  Tổng: 6 good nodes (5 leaf + node 3)
```

### 4️⃣ Tại sao dùng Post-order (bottom-up)?

```
❓ "Tại sao bottom-up?"

  Vì muốn biết SUBTREE SIZE → phải hỏi CON trước!

  Node 1 muốn biết "con mình có cùng size không?"
  → Phải biết size(3) và size(4) TRƯỚC!
  → Con trả size LÊN cho cha → POST-ORDER!

  Giống Balanced Tree: cần info TỪ CON → bottom-up!
  KHÁC Good Nodes #1448: truyền max XUỐNG → top-down!
```

### 5️⃣ Flashcard — Tự kiểm tra

> Che cột bên phải, trả lời rồi mở ra check!

| ❓ Câu hỏi | ✅ Đáp án |
|---|---|
| Good node nghĩa là gì? | Mọi subtree con có CÙNG SIZE |
| Leaf có phải good? | **LUÔN LUÔN!** (0 con → trivially equal) |
| Root có thể NOT good? | **CÓ!** Nếu subtrees con khác size |
| Input là gì? | **Edges** (không phải TreeNode!) → phải dựng adjacency list |
| Đây là binary tree? | **KHÔNG!** General tree (có thể > 2 con!) |
| Post-order hay Pre-order? | **Post-order!** (cần size con trước) |
| Time? | **O(n)** — mỗi node visit 1 lần |
| Space? | **O(n)** — adjacency list + call stack |
| So với #1448? | #1448 = val vs max path (top-down), #3249 = subtree size (bottom-up) |

### 6️⃣ Sai lầm phổ biến — ĐỪNG mắc!

```
❌ SAI LẦM #1: Nhầm với bài #1448!

   #1448: Binary tree + "good = val >= max trên path" → TOP-DOWN
   #3249: General tree + "good = subtrees cùng size" → BOTTOM-UP
   
   Hoàn toàn KHÁC NHAU!

─────────────────────────────────────────────────────

❌ SAI LẦM #2: Quên skip parent!

   for (const neighbor of adj[node])
     dfs(neighbor, node);   ← nếu không check neighbor !== parent
                               → đi NGƯỢC lên cha → vô hạn! 💥

─────────────────────────────────────────────────────

❌ SAI LẦM #3: Quên leaf cũng là good!

   Node không có con → isGood vẫn = true → đếm!
   childSize = -1 (chưa set) → không bao giờ fail check!

─────────────────────────────────────────────────────

❌ SAI LẦM #4: So sánh tổng thay vì từng con!

   Node 0 có 3 con: sizes = [2, 3, 1]
   Tổng = 6, nhưng KHÔNG BẰNG NHAU → NOT good!
   Phải check TỪNG CẶP, không phải tổng!

─────────────────────────────────────────────────────

❌ SAI LẦM #5: Dùng binary tree structure!

   Bài cho EDGES, không cho TreeNode!
   → Phải dựng adjacency list trước!
   → Mỗi node có thể có 0, 1, 2, 3... con!
```

### 7️⃣ Luyện tập — Spaced Repetition

```
📅 LỊCH LUYỆN TẬP:

  Ngày 1: Đọc hiểu → viết code nhìn tài liệu
  Ngày 2: Viết code KHÔNG NHÌN → debug
  Ngày 4: Viết + giải thích: adjacency list, DFS, size check
  Ngày 7: Viết + trace ví dụ + complexity
  Ngày 14: Full mock interview

  💡 Mỗi lần viết, tự hỏi:
  → "Input là gì?" (edges → adjacency list!)
  → "Mỗi node trả gì?" (subtree size)
  → "Good khi nào?" (mọi con cùng size)
  → "Leaf sao?" (good luôn!)
```

---

### 8️⃣ Cách TƯ DUY — Gặp lại vẫn làm được!

**Bước 1: "Mỗi node cần biết gì?"**

```
🧠 → Cần biết SIZE của mỗi subtree con
   → Xem tất cả có BẰNG NHAU không
   → Info từ CON → bottom-up → POST-ORDER!
```

**Bước 2: "DFS trả về gì?"**

```
🧠 → Trả về SUBTREE SIZE (count nodes)
   → Cha dùng size để so sánh các con
```

**Bước 3: "Check good thế nào?"**

```
🧠 → Con đầu tiên: ghi nhớ size
   → Con tiếp theo: so sánh với con đầu
   → Nếu khác → NOT good
   → Nếu hết con mà vẫn OK → GOOD!
```

**💡 Pattern: POST-ORDER + return info + check tại node:**

```
┌────────────────────────────────────────────────────┐
│  Balanced Tree (#110):  return height, check diff  │
│  Good Nodes (#3249):    return size, check equal   │
│  Diameter (#543):       return depth, update global│
│                                                    │
│  CHUNG: con trả kết quả → cha check/gộp → trả lên│
└────────────────────────────────────────────────────┘
```

---

> 📚 **Phần dưới đây là GIẢI THÍCH CHI TIẾT.**

---

## R — Repeat & Clarify

💬 *"Cho undirected tree n nodes (edges list), đếm good nodes — node mà TẤT CẢ subtrees con có CÙNG SIZE."*

### Câu hỏi:

1. **"Leaf là good?"** → CÓ! 0 con → trivially equal.
2. **"Cây rooted tại đâu?"** → Node 0.
3. **"Đây là binary tree?"** → KHÔNG! General tree, có thể nhiều con.
4. **"Size tính thế nào?"** → Số nodes trong subtree (bao gồm root của subtree).

---

## E — Examples

```
VÍ DỤ 1: edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]]

      0           Node 0: con sizes = [3,3] → GOOD ✅
     / \          Node 1: con sizes = [1,1] → GOOD ✅
    1   2         Node 2: con sizes = [1,1] → GOOD ✅
   / \ / \        Leaves 3,4,5,6: GOOD ✅
  3  4 5  6       Answer: 7

VÍ DỤ 2: edges = [[0,1],[1,2],[1,3]]

      0           Node 0: con sizes = [3] → GOOD ✅ (1 con → trivially equal!)
      |           Node 1: con sizes = [1,1] → GOOD ✅
      1           Leaves 2,3: GOOD ✅
     / \          Answer: 4
    2   3

VÍ DỤ 3: edges = [[0,1],[0,2],[0,3],[1,4],[1,5]]

        0         Node 0: con sizes = [3,1,1] → 3≠1 → NOT GOOD ❌
      / | \       Node 1: con sizes = [1,1] → GOOD ✅
     1  2  3      Leaves 2,3,4,5: GOOD ✅
    / \           Answer: 6
   4   5
```

---

## A — Approach

```
┌──────────────────────────────────────────────────────────┐
│ BƯỚC 1: Dựng adjacency list từ edges                     │
│ BƯỚC 2: DFS(0, -1) — tính subtree size mỗi node         │
│ BƯỚC 3: Tại mỗi node, check mọi con cùng size?          │
│ → Time: O(n) | Space: O(n)                               │
└──────────────────────────────────────────────────────────┘
```

---

## C — Code

> 📖 Full code: [Count the Number of Good Nodes.js](./Count%20the%20Number%20of%20Good%20Nodes.js)

### DFS Post-order — O(n)

```javascript
function countGoodNodes(edges) {
  const n = edges.length + 1;

  // Bước 1: Dựng adjacency list
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }

  let count = 0;

  // Bước 2: DFS tính subtree size
  function dfs(node, parent) {
    let size = 1; // chính node này
    let childSize = -1; // size con đầu tiên (chưa biết)
    let isGood = true;

    for (const neighbor of adj[node]) {
      if (neighbor === parent) continue; // skip cha!

      const subSize = dfs(neighbor, node); // hỏi con
      size += subSize;

      // Bước 3: check cùng size?
      if (childSize === -1) {
        childSize = subSize; // con đầu tiên → ghi nhớ
      } else if (subSize !== childSize) {
        isGood = false; // khác size → NOT good!
      }
    }

    if (isGood) count++; // leaf hoặc mọi con cùng size!
    return size; // trả subtree size cho cha
  }

  dfs(0, -1);
  return count;
}
```

### Trace ví dụ:

```
edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]]

adj: 0→[1,2], 1→[0,3,4], 2→[0,5,6], 3→[1], 4→[1], 5→[2], 6→[2]

dfs(0, -1):
  neighbor 1 (skip? 1≠-1 → NO):
    dfs(1, 0):
      neighbor 0 → skip (0 === parent!)
      neighbor 3:
        dfs(3, 1): no children → isGood=true ✅, return 1
      childSize = 1 (con đầu)
      neighbor 4:
        dfs(4, 1): no children → isGood=true ✅, return 1
      1 === childSize(1) ✅
      isGood=true ✅ → count=3 (3,4,1 so far)
      return 1+1+1 = 3

  childSize = 3 (con đầu của 0)

  neighbor 2:
    dfs(2, 0):
      neighbor 0 → skip
      neighbor 5:
        dfs(5, 2): leaf ✅, return 1
      childSize = 1
      neighbor 6:
        dfs(6, 2): leaf ✅, return 1
      1 === 1 ✅
      isGood=true ✅ → count=6
      return 3

  3 === childSize(3) ✅
  isGood=true ✅ → count=7

return 7 → count = 7 ✅
```

---

## T — Test

```
  ✅ [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]]           → 7 (all good)
  ✅ [[0,1],[1,2],[2,3],[3,4],[0,5],[1,6],[2,7],[3,8]]→ 6
  ✅ [[0,1]]                                          → 2 (2 nodes)
  ✅ [[0,1],[0,2],[0,3]]                              → 4 (3 leaves same)
  ✅ [[0,1],[0,2],[0,3],[1,4],[1,5]]                  → ? (root NOT good)
```

---

## O — Optimize

```
┌─────────────────┬──────────────┬──────────────┐
│ Approach         │ Time         │ Space        │
├─────────────────┼──────────────┼──────────────┤
│ DFS Post-order  │ O(n)         │ O(n)         │
└─────────────────┴──────────────┴──────────────┘

  O(n) tối ưu — phải xem mọi node!
  Space O(n): adjacency list + call stack
```

---

## 🧩 Pattern Recognition

```
Pattern: "POST-ORDER + return value + check tại node"

  #3249 Good Nodes:   return subtree SIZE, check children equal
  #110 Balanced Tree: return HEIGHT, check |L-R| ≤ 1
  #543 Diameter:      return depth, update global diameter
  #124 Max Path Sum:  return max single path, update global

  KHÁC BÀI #1448:
  #1448: BINARY tree, val vs max path → TOP-DOWN
  #3249: GENERAL tree, subtree sizes equal → BOTTOM-UP
```

---

## 🔗 Liên hệ với bài đã học

```
#3249 vs #110 (Balanced Tree):
  Balanced: |height_L - height_R| ≤ 1 → check 2 con
  Good Nodes: ALL children same size → check N con!
  Cả 2 bottom-up, cả 2 return 1 giá trị!

#3249 vs #1448 (Good Nodes Binary):
  #1448: binary tree, top-down (truyền max xuống)
  #3249: general tree, bottom-up (trả size lên)
  TÊN GIỐNG nhưng LOGIC KHÁC HẲN!

#3249: Input = EDGES (graph) → phải dựng adj list!
  Khác binary tree (TreeNode) → cần biết cách xử lý graph!
```

---

## 🗣️ Think Out Loud — Kịch Bản Interview Chi Tiết

> Format: 🎙️ = **NÓI TO** | 🧠 = **SUY NGHĨ THẦM**

---

### 📌 Phút 0–2: Nhận đề + Clarify

> 🎙️ *"The problem gives me an undirected tree as an edge list, rooted at node 0. A node is 'good' if all its children's subtrees have the same number of nodes. I need to count how many good nodes there are."*

> 🎙️ *"Clarifications:*
> *— Leaf nodes have no children, so they're trivially good, correct?"*
> *(Interviewer: "Yes.")*
>
> *"— This is a general tree, not binary — a node can have any number of children?"*
> *(Interviewer: "Correct.")*
>
> *"— If a node has only one child, that's also good since there's only one subtree size to compare?"*
> *(Interviewer: "Yes.")*

---

### 📌 Phút 2–4: Approach

> 🎙️ *"To determine if a node is good, I need to know the SIZE of each of its children's subtrees. This is bottom-up information — I need to process children first before their parent."*

> 🎙️ *"My plan:*
> *1. Build adjacency list from edges — O(n)*
> *2. DFS post-order from root 0, returning subtree size at each node*
> *3. At each node, check if all children's subtree sizes are equal*
> *Time: O(n), Space: O(n)"*

---

### 📌 Phút 4–8: Code + Narrate

> 🎙️ *"I build the adjacency list first. Then my DFS function takes (node, parent) to avoid going back up to the parent — since this is an undirected graph."*

> 🎙️ *"At each node, I track the first child's subtree size. For subsequent children, I compare — if any differ, the node isn't good. Finally, I return the total subtree size for the parent to use."*

---

### 📌 Phút 8–10: Trace + Complexity

> 🎙️ *"Tracing with example 1: all subtrees at each level are equal, so all 7 nodes are good. For example 2: the chain creates unequal subtrees at nodes 0, 1, 2 — only 6 out of 9 are good."*

> 🎙️ *"Time O(n): each node and edge visited once. Space O(n): adjacency list uses O(n), recursion stack O(h) worst case O(n)."*

---

### 📌 Follow-up Q&A

**Q1: "Can you do this iteratively?"**

> 🎙️ *"Yes — topological sort (BFS from leaves inward). Process leaves first, compute sizes, then process parents after all children are done. Uses in-degree tracking."*

**Q2: "What if the tree is not rooted at 0?"**

> 🎙️ *"Any node can be root — the algorithm works the same. Just change dfs(0, -1) to dfs(root, -1)."*

**Q3: "How does this compare to #1448?"**

> 🎙️ *"Completely different! #1448 checks node VALUE against max on path (top-down). #3249 checks SUBTREE SIZE equality among siblings (bottom-up). Same name, different concepts."*

---

### 🧠 Tóm tắt

```
  📌 Phút 0-2:  Clarify: general tree, leaf=good, 1 child=good
  📌 Phút 2-4:  Approach: adj list + DFS post-order + check sizes
  📌 Phút 4-8:  Code: dfs(node, parent), childSize sentinel -1
  📌 Phút 8-10: Trace + O(n) time, O(n) space

  KEY POINTS:
  ✅ Input = EDGES → dựng adjacency list!
  ✅ General tree (không phải binary!)
  ✅ skip parent bằng if (neighbor === parent) continue
  ✅ Leaf = always good
  ✅ Compare childSize: dùng sentinel -1 cho con đầu tiên
```
