# 🌳 Maximum Depth of Binary Tree (LeetCode #104)

> 📖 Code: [Maximum Depth of Binary Tree.js](./Maximum%20Depth%20of%20Binary%20Tree.js)

---

## R — Repeat & Clarify

🧠 *"Maximum depth = longest path from root to leaf, đếm SỐ NODES. Bài classic, nhưng phải show process."*

> 🎙️ *"The problem asks me to find the maximum depth of a binary tree — which is the number of nodes along the longest path from the root down to the farthest leaf node."*

> 🎙️ *"Let me clarify a few things:*
>
> *1. **Empty tree (null)?** — I assume depth is 0.*
>
> *2. **Single node?** — That's depth 1, since the root itself counts.*
>
> *3. **Depth = counting NODES, not edges?** — Some problems define depth as edges. Here, root = depth 1."*
>
> *(Interviewer confirms: "Yes, node count.")*

> 🎙️ *"4. **Unbalanced tree?** — I need the LONGEST path. If left subtree has depth 5 and right has depth 2, the answer is 5."*

🧠 *"Node count vs edge count — CỰC KỲ QUAN TRỌNG. Nếu đề nói edges thì empty = 0, single node = 0, root+child = 1. Nếu nodes: empty = 0, single = 1, root+child = 2."*

💡 **Phân tích:**
- Hỏi "nodes vs edges" = phân biệt 2 định nghĩa khác nhau của "depth". Rất nhiều người code SAI vì không hỏi.
- Đề bài nói "number of nodes along the longest path" → đếm NODES.

```
VÍ DỤ TỪ ĐỀ:
      1          depth = 3 (đường 1→3→4)
     / \
    2   3
       /
      4

Single node: [1] → depth = 1
Empty: [] → depth = 0
```

---

## E — Examples

> 🎙️ *"Let me trace a few examples:"*

```
VÍ DỤ 1: [1,2,3,null,null,4]
      1              Paths:
     / \             1→2         (length 2)
    2   3            1→3→4       (length 3) ← LONGEST!
       /
      4              Answer: 3

VÍ DỤ 2: Empty tree
    null             Answer: 0

VÍ DỤ 3: Single node
    [42]             Answer: 1

VÍ DỤ 4: Left-skewed
    1                Paths:
   /                 1→2→3→4     (length 4)
  2
 /                   Answer: 4
3
 \
  4

VÍ DỤ 5: Perfect binary tree
      1              Paths:
     / \             1→2→4       (length 3)
    2   3            1→2→5       (length 3)
   / \ / \           1→3→6       (length 3)
  4  5 6  7          1→3→7       (length 3)
                     Answer: 3 (all same!)
```

> 🎙️ *"From these examples, I notice: depth = 1 + max(left depth, right depth). This is the classic recursive formula."*

🧠 *"Nói 'I notice the pattern' khi vẽ ví dụ = show cho interviewer thấy mình DERIVE solution từ examples, không chỉ nhớ lời giải."*

---

## A — Approach

🧠 *"3 approaches: recursive DFS, BFS level-count, iterative DFS stack. Recursive đơn giản nhất — 1 dòng!"*

> 🎙️ *"I can see three approaches here. Let me walk through my thinking..."*

> 🎙️ *"**Approach 1: Recursive DFS (Post-order)** — This is the most natural fit. The depth of a tree is 1 (for the current node) plus the maximum of the depths of its left and right subtrees. Base case: null tree has depth 0. This is a post-order traversal because I need the results from the subtrees BEFORE I can compute the current node's answer."*

> 🎙️ *"**Approach 2: BFS Level-order** — I traverse the tree level by level using a queue. Each time I finish processing an entire level, I increment a depth counter. When the queue is empty, the counter holds the maximum depth. This is intuitive because depth literally means 'number of levels'."*

> 🎙️ *"**Approach 3: Iterative DFS with Stack** — Similar to recursive DFS but with an explicit stack. Each entry on the stack pairs a node with its current depth. I track the maximum depth seen."*

> 🎙️ *"I'll start with Approach 1 — it's the cleanest, literally a one-liner for the logic."*

```
COMPARISON:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│              │ Recursive    │ BFS          │ DFS Stack    │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Code         │ 1 line! ✅    │ ~10 lines    │ ~10 lines    │
│ Time         │ O(n)         │ O(n)         │ O(n)         │
│ Space        │ O(h) stack   │ O(w) queue   │ O(h) stack   │
│ Intuition    │ depth=1+max  │ count levels │ track depths │
│ Risk         │ stack overflow│ -            │ -            │
└──────────────┴──────────────┴──────────────┴──────────────┘
w = max width of tree (BFS queue holds 1 level)
```

---

## C — Code

> 📖 Full code: [Maximum Depth of Binary Tree.js](./Maximum%20Depth%20of%20Binary%20Tree.js)

### Approach 1: Recursive DFS

> 🎙️ *"Let me code the recursive approach. It's beautifully concise."*

```javascript
function maxDepth(root) {
  if (root === null) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

> 🎙️ *"That's it — just two lines of logic. Let me break it down:*
>
> *— Base case: if the tree is empty (null), depth is 0.*
>
> *— Recursive case: the depth is 1 (counting current node) plus the maximum depth between the left and right subtrees. I use Math.max because I want the LONGEST path, not the shortest.*
>
> *— This is post-order because I need left and right results BEFORE I can compute the current node's answer."*

🧠 *"Giải thích WHY Math.max — 'because I want the longest path'. Đừng chỉ nói CÁI GÌ."*

### Trace:

> 🎙️ *"Let me trace with example 1:"*

```
maxDepth(1):
  maxDepth(2):
    maxDepth(null) = 0    ← left of 2
    maxDepth(null) = 0    ← right of 2
    return 1 + max(0, 0) = 1
  maxDepth(3):
    maxDepth(4):
      maxDepth(null) = 0
      maxDepth(null) = 0
      return 1 + max(0, 0) = 1
    maxDepth(null) = 0     ← right of 3
    return 1 + max(1, 0) = 2
  return 1 + max(1, 2) = 3 ✅
```

> 🎙️ *"The answer is 3, which matches. The recursion 'bubbles up' the depth from the leaves back to the root."*

### Approach 2: BFS Level-order

> 🎙️ *"For the iterative version, I'll use BFS which directly counts levels."*

```javascript
function maxDepthBFS(root) {
  if (root === null) return 0;

  const queue = [root];
  let depth = 0;

  while (queue.length > 0) {
    const levelSize = queue.length;  // nodes in THIS level!
    depth++;

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  return depth;
}
```

> 🎙️ *"The key insight: I snapshot `queue.length` BEFORE the inner loop as `levelSize`. This tells me exactly how many nodes are in the current level. The for loop processes exactly that many nodes, and any children it enqueues belong to the NEXT level. After the loop, the queue contains only next-level nodes. So each iteration of the while loop = one level."*

🧠 *"levelSize trick — đây là KEY INSIGHT cho BFS level-by-level. Rất nhiều bài BFS dùng pattern này."*

### Trace BFS:

```
Queue: [1], depth = 0
── Level 1 ──
  levelSize = 1, depth = 1
  Dequeue 1 → enqueue 2, 3
Queue: [2, 3]
── Level 2 ──
  levelSize = 2, depth = 2
  Dequeue 2 → no children
  Dequeue 3 → enqueue 4
Queue: [4]
── Level 3 ──
  levelSize = 1, depth = 3
  Dequeue 4 → no children
Queue: [] → DONE!
depth = 3 ✅
```

### Approach 3: Iterative DFS (Stack)

```javascript
function maxDepthDFS(root) {
  if (root === null) return 0;

  const stack = [{ node: root, depth: 1 }];
  let maxD = 0;

  while (stack.length > 0) {
    const { node, depth } = stack.pop();
    maxD = Math.max(maxD, depth);  // track maximum!

    if (node.left) stack.push({ node: node.left, depth: depth + 1 });
    if (node.right) stack.push({ node: node.right, depth: depth + 1 });
  }

  return maxD;
}
```

> 🎙️ *"Each stack entry carries the node AND its depth. When I process a node, I update the global max. Children get depth + 1. When the stack empties, maxD holds the answer."*

---

## T — Test

| Test | Input | Expected | Kiểm tra |
|---|---|---|---|
| Normal | `[1,2,3,null,null,4]` | 3 | Longest path! |
| Empty | `null` | 0 | Base case! |
| Single | `[42]` | 1 | Root only! |
| Left-skewed | `[1,2,3,4]` | 4 | All left! |
| Perfect | `[1,2,3,4,5,6,7]` | 3 | All paths equal! |
| BFS check | `[1,2,3,null,null,4]` | 3 | Same result! |

---

## O — Optimize

> 🎙️ *"Let me analyze complexity."*

```
┌────────────────┬──────────────┬──────────────┬──────────────┐
│                │ Recursive    │ BFS          │ DFS Stack    │
├────────────────┼──────────────┼──────────────┼──────────────┤
│ Time           │ O(n)         │ O(n)         │ O(n)         │
│ Space          │ O(h)         │ O(w)         │ O(h)         │
│                │ call stack   │ queue width  │ explicit stk │
├────────────────┼──────────────┼──────────────┼──────────────┤
│ Balanced       │ O(log n) ✅  │ O(n/2)=O(n)  │ O(log n) ✅  │
│ Skewed         │ O(n)         │ O(1) ✅       │ O(n)         │
└────────────────┴──────────────┴──────────────┴──────────────┘
```

> 🎙️ *"Time O(n) is optimal — we must visit every node to know the deepest one. Space depends on tree shape: recursive and DFS stack scale with height, BFS scales with width."*

> 🎙️ *"Interesting: for a balanced tree, width = n/2 (leaf level), so BFS uses O(n) space. Recursive only uses O(log n). For a skewed tree, it's reversed — BFS uses O(1) since each level has 1 node, but recursive uses O(n). So the best approach depends on the tree shape."*

---

## 🎤 Interview Cheat Sheet

```
⏱ TIMELINE (10 phút — bài này ngắn!):
├── 0-1 phút:  Clarify (nodes vs edges!)
├── 1-3 phút:  Vẽ ví dụ + nhận ra pattern!
├── 3-4 phút:  Nói approach
├── 4-5 phút:  Code recursive (2 dòng!)
├── 5-7 phút:  Trace + edge cases
├── 7-8 phút:  Complexity analysis
└── 8-10 phút: Code BFS + so sánh

💡 KEY TALKING POINTS:
→ "depth = 1 + max(left, right) — post-order!"
→ "BFS: levelSize trick để đếm levels!"
→ "Nodes vs edges — SỰ KHÁC BIỆT!"
→ "Space: recursive O(h) vs BFS O(w)!"

⚠ SAI LẦM PHỔ BIẾN:
→ Nhầm nodes vs edges (depth 0 hay 1 cho single node?)
→ Quên base case null → return 0!
→ BFS: quên levelSize → không biết khi nào hết 1 level!
→ Dùng min thay max (muốn LONGEST, không shortest!)
```

---

## 🗣️ Think Out Loud — Kịch Bản Interview Chi Tiết

> Đây là **KỊCH BẢN MẪU** cho interview, nói to từng suy nghĩ.
> Interviewer đánh giá **quá trình tư duy** chứ không chỉ kết quả!
>
> Format: 🎙️ = **NÓI TO** (interviewer nghe) | 🧠 = **SUY NGHĨ THẦM** (trong đầu)

---

### 📌 Phút 0–1: Nhận đề + Clarify

🧠 *"Max depth — bài kinh điển. Nhưng ĐỪNG vội! Phải hỏi 'nodes vs edges' — đây là pitfall SỐ 1. Nhiều người code SAI vì không hỏi câu này."*

> 🎙️ *"OK, so the problem asks me to find the maximum depth of a binary tree. Before I start, I want to make sure I understand the definition precisely."*

> 🎙️ *"When we say 'depth', are we counting the number of NODES along the longest path from root to leaf — or the number of EDGES? This matters because for a tree with just a root, the answer would be 1 if counting nodes, but 0 if counting edges."*
>
> *(Interviewer: "Nodes.")*

🧠 *"Tốt. Câu hỏi này = major signal. Interviewer vừa đánh giá 'người này careful'. Giờ hỏi thêm 1-2 câu nữa."*

> 🎙️ *"Great, so root = depth 1, empty tree = depth 0. A couple more things:*
>
> *— Am I looking for the longest path to ANY leaf node? Not a specific one?"*
>
> *(Interviewer: "Any leaf.")*

> 🎙️ *"— And I assume this is a standard binary tree — not a BST or any special type? Just an arbitrary binary tree where each node has at most two children."*
>
> *(Interviewer: "Correct, just a regular binary tree.")*

🧠 *"BST question = show mình phân biệt data structures. Dù answer 'no', interviewer thấy awareness."*

💡 **Tại sao hỏi — PHÂN TÍCH TÂM LÝ INTERVIEWER:**

```
CÂU HỎI BẠN HỎI:                   INTERVIEWER NGHĨ:
═══════════════════════════════════════════════════════════════

  "Nodes or edges?"               → "Careful. Knows the pitfall."
  "Any leaf, not specific?"       → "Understands the problem fully."
  "BST or regular tree?"          → "Thinks about constraints."
  (Không hỏi gì, code ngay)      → "Rushing. Might make mistakes."

  → Hỏi 2-3 câu = SWEET SPOT!
  → Hỏi 0 câu = careless 🚩
  → Hỏi 10 câu = stalling 🚩
```

```
NODES vs EDGES — CHI TIẾT:
═══════════════════════════════════════════════════════════════

                1
               / \
              2   3

  Đếm NODES:  depth = 2 (path 1→2 = 2 nodes)
  Đếm EDGES:  depth = 1 (path 1→2 = 1 edge)

  Base case khác nhau!
  → NODES: null → 0, leaf → 1
  → EDGES: null → -1 (hoặc 0), leaf → 0

  Trên LeetCode:
  → #104 (Max Depth) = đếm NODES!
  → #111 (Min Depth) = đếm NODES!
  → Nhiều textbook CS = đếm EDGES!
  → CÂU HỎI NÀY CỨU BẠN 10 phút debug!
```

---

### 📌 Phút 1–3: Vẽ ví dụ + DERIVE Pattern

🧠 *"Phải DERIVE công thức từ ví dụ, ĐỪNG chỉ nói 'tôi biết công thức'. Interviewer muốn thấy REASONING process."*

> 🎙️ *"Let me draw the example and see if I can identify a pattern."*

> *(Vẽ tree CHẬM, RÕ RÀNG lên whiteboard)*

> 🎙️ *"Given this tree..."*
> ```
>       1
>      / \
>     2   3
>        /
>       4
> ```

> 🎙️ *"The maximum depth is 3 — the path 1→3→4 has 3 nodes."*

🧠 *"Giờ DERIVE công thức. Đừng nói 'công thức là 1+max(L,R)'. Phải show CÁCH mình PHÁT HIỆN RA nó."*

> 🎙️ *"Let me think about this from the root's perspective. If I'm standing at node 1, what do I need to know? I need the depth of my left subtree and the depth of my right subtree."*

> 🎙️ *"My left subtree is just node 2 — no children. Its depth is 1."*
>
> *"My right subtree is rooted at node 3, which has child 4. Its depth is 2."*
>
> *"So the whole tree's depth is: I count MYSELF as 1, plus the DEEPER of my two subtrees. That's 1 + max(1, 2) = 3."*

> 🎙️ *"I see the recursive formula here: depth(node) = 1 + max(depth(left), depth(right)). And depth(null) = 0 — an empty subtree contributes zero depth."*

🧠 *"'I see the recursive formula HERE' — từ 'here' = mình vừa phát hiện. Không phải nhớ từ sách."*

> 🎙️ *"Let me quickly verify this formula with edge cases before I go further:*
>
> *— **Empty tree**: depth(null) = 0. ✅ Makes sense — no tree, no depth.*
>
> *— **Single node**: 1 + max(depth(null), depth(null)) = 1 + max(0, 0) = 1. ✅*
>
> *— **Left-skewed tree 1→2→3**: depth(1) = 1 + max(depth(2→3), 0).*
> *depth(2→3) = 1 + max(depth(3), 0) = 1 + max(1, 0) = 2.*
> *So depth(1) = 1 + max(2, 0) = 3. ✅*
>
> *— **Perfect binary tree (all levels full)**: every path has the same length, so max just picks any one of them. ✅"*

💡 **Tại sao DERIVE thay vì nhớ:**
- Interviewer biết bài này phổ biến. Nếu bạn nói "the formula is..." → họ nghĩ bạn CHỈ NHỚ.
- Nếu bạn nói "looking at this tree, I notice..." → họ thấy **PROBLEM-SOLVING SKILL**.
- Cùng 1 answer, cách trình bày khác = **khác 1 level trong đánh giá**.

---

### 📌 Phút 3–4: Nói Approach + Giải thích WHY

🧠 *"3 approaches. Recursive = best cho bài này. Nhưng phải GIẢI THÍCH tại sao, so sánh alternatives, mention trade-offs."*

> 🎙️ *"Based on the recursive formula I derived, I see three approaches. Let me think through each:*
>
> *The first is **recursive DFS** — which directly implements the formula: depth = 1 + max(left, right). This is a post-order traversal, meaning I need results from BOTH subtrees before I can compute the current node's depth. The answer bubbles UP from the leaves to the root."*

🧠 *"Nói 'post-order' = show traversal knowledge. Nói 'bubbles up' = visual metaphor interviewer dễ hiểu."*

> 🎙️ *"The second is **BFS level-order** — since depth literally means 'how many levels', I can traverse level by level and count. Each time I finish processing all nodes on one level, I increment a counter. When the queue is empty, the counter IS the depth."*

> 🎙️ *"The third is **iterative DFS with a stack** — I pair each node with its current depth on the stack, and track the maximum depth seen across all nodes."*

> 🎙️ *"For this problem, I'll start with the recursive approach because:*
> *1. The code is literally two lines — it directly mirrors the mathematical formula.*
> *2. It's clearly correct — the formula is provably right by induction.*
> *3. Time is O(n) — I visit every node once.*
> *4. Space is O(h) for the call stack — O(log n) balanced, O(n) skewed."*

> 🎙️ *"I'll note that the BFS approach is also O(n) time but uses O(w) space where w is the max width — for balanced trees that's O(n) since the bottom level has n/2 nodes. So recursive is actually more space-efficient for balanced trees. I'll code BFS as well after if we have time."*

💡 **Tại sao nói approach TRƯỚC code — PHÂN TÍCH SÂU:**
- Cho interviewer cơ hội nói "actually, try BFS first" → bạn **tiết kiệm thời gian**.
- Show bạn biết **NHIỀU cách** → breadth of knowledge.
- So sánh space O(h) vs O(w) **tự nguyện** → analysis depth = senior.
- Nói "provably correct by induction" → CS theory awareness (bonus!).

---

### 📌 Phút 4–5: Code + Narrate MỖI quyết định

🧠 *"2 dòng code thôi, nhưng vẫn narrate. Interviewer cần nghe REASONING cho từng dòng."*

> 🎙️ *"Alright, let me code it. The function takes the root of the tree."*

```javascript
function maxDepth(root) {
```

> 🎙️ *"First, the base case. If root is null — meaning we've gone past a leaf, or the tree is completely empty — there are no nodes here, so depth is 0. This is the foundation our recursion builds upon."*

🧠 *"'Foundation our recursion builds upon' — show mình hiểu BASE CASE vai trò gì trong recursion."*

```javascript
  if (root === null) return 0;
```

> 🎙️ *"For the recursive case: the depth at this node is 1 — counting this node itself — plus the maximum of the depths of my two subtrees. I use Math.max because I want the LONGEST path, not the shortest. If my left subtree goes 5 levels deep and my right subtree goes 3, my depth is 1 + 5 = 6."*

```javascript
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

> 🎙️ *"The complete function is 2 lines of logic. I love how the code is essentially the English definition restated in JavaScript: 'the depth of a tree is 1 plus the max depth of its subtrees.'"*

🧠 *"'English definition restated in JavaScript' — elegant句. Interviewer thấy bạn appreciate clean code."*

> 🎙️ *"One thing worth noting about the execution: JavaScript evaluates Math.max(maxDepth(root.left), maxDepth(root.right)) by first fully resolving maxDepth(root.left) — going all the way down the left subtree to the leaves — before even starting maxDepth(root.right). So this is actually a DFS that goes left-first, then right."*

🧠 *"Giải thích execution order = show bạn hiểu RUNTIME BEHAVIOR, không chỉ nhìn code bề mặt."*

💡 **Tại sao narrate 2 dòng code — PHÂN TÍCH SÂU:**
- Bài "dễ" = bẫy! Interviewer đánh giá DEPTH OF UNDERSTANDING, không chỉ "solve được".
- Giải thích **execution order** = show bạn hiểu call stack, không chỉ syntax.
- Nói **"1 counting this node itself"** = show bạn biết cái gì đóng góp vào kết quả.
- Nói **"longest not shortest"** = cho thấy mỗi keyword trong code là INTENTIONAL.

---

### 📌 Phút 5–7: Trace + Verify CHÍNH XÁC

🧠 *"Trace code với ví dụ. Dùng CALL STACK format — cho thấy hiểu execution."*

> 🎙️ *"Let me trace through my code with the example to verify it's correct. I'll track the call stack."*

> 🎙️ *"**Call 1: maxDepth(1)***
> *Root is 1, not null. I need max(maxDepth(1.left), maxDepth(1.right)).*
> *Going left first...*
>
> ***Call 2: maxDepth(2)***
> *Root is 2, not null. Need max(maxDepth(null), maxDepth(null)).*
>
> ***Call 3: maxDepth(null)** → return 0 (left of 2)*
> ***Call 4: maxDepth(null)** → return 0 (right of 2)*
>
> *Back in Call 2: 1 + max(0, 0) = **1**. Return 1.*
>
> *Now Call 1 goes right...*
>
> ***Call 5: maxDepth(3)***
> *Root is 3, not null. Need max(maxDepth(4), maxDepth(null)).*
>
> ***Call 6: maxDepth(4)***
> *Root is 4, not null. Need max(maxDepth(null), maxDepth(null)).*
> *Both return 0. So 1 + max(0, 0) = **1**. Return 1.*
>
> ***Call 7: maxDepth(null)** → return 0 (right of 3)*
>
> *Back in Call 5: 1 + max(1, 0) = **2**. Return 2.*
>
> *Back in Call 1: 1 + max(1, 2) = **3**. Return 3. ✅"*

> 🎙️ *"3 matches the expected output. Let me also verify edge cases:*
> - ***null**: hits base case, returns 0. ✅*
> - ***Single node [42]**: 1 + max(0, 0) = 1. ✅*
> - ***Two nodes [1, 2]**: 1 + max(1, 0) = 2. ✅"*

💡 **Tại sao trace TỪNG call — PHÂN TÍCH SÂU:**
- Numbering calls (Call 1, 2, 3...) = show bạn hiểu **call stack execution**.
- Nói "Going left first" = show bạn hiểu **DFS evaluation order**.
- **So sánh kết quả với expected** = disciplined verification.
- Check **edge cases tự nguyện** = proactive, interviewer không cần nhắc.

---

### 📌 Phút 7–8: Complexity — Rigorous Analysis

> 🎙️ *"Let me analyze the complexity rigorously."*

> 🎙️ *"**Time: O(n)** where n is the total number of nodes. My function is called exactly once per node — each call does O(1) work (a comparison and an addition). The total work is proportional to n."*

> 🎙️ *"Is O(n) optimal? Yes. To find the maximum depth, I need to examine every node — the deepest leaf could be anywhere in the tree. There's no way to skip nodes and still guarantee correctness. So O(n) is a tight lower bound."*

🧠 *"Nói 'tight lower bound' = CS theory. Most candidates chỉ nói 'O(n)' mà không giải thích TẠI SAO không thể tốt hơn."*

> 🎙️ *"**Space: O(h)** where h is the height of the tree, for the recursion call stack.*
>
> ***Best case** — a balanced binary tree: h = log₂(n). My stack never goes deeper than ~20 frames for a million-node tree. That's perfectly fine.*
>
> ***Worst case** — a completely skewed tree where every node has only one child: h = n. The recursion goes n levels deep. For a million nodes, that's a million stack frames — likely a stack overflow in most JavaScript engines (default stack ~10,000-15,000 frames)."*
>
> *"**Average case** for a random binary tree: h ≈ O(√n). Not as good as balanced, but much better than skewed."*

> 🎙️ *"If stack overflow is a concern, I'd switch to the iterative BFS approach, which uses O(w) space where w is the max width — at most n/2 for a complete binary tree. But for a skewed tree, BFS uses only O(1) since each level has just 1 node."*

> 🎙️ *"So interestingly:*
>
> | Tree Shape | Recursive | BFS |
> |---|---|---|
> | Balanced | O(log n) ✅ | O(n) |
> | Skewed | O(n) | O(1) ✅ |
>
> *Neither approach dominates the other in all cases. The choice depends on the expected tree shape."*

💡 **Tại sao nói average case √n:**
- Most candidates: "O(log n) balanced, O(n) worst". DONE.
- Strong candidates: "Average O(√n) for random trees" = **advanced knowledge**.
- Con số CỤ THỂ (20 frames, million nodes) = make abstract **CONCRETE**.
- So sánh bằng TABLE = instant clarity, visual thinker.

---

### 📌 Phút 8–10: BFS Alternative + Deep Narration

> 🎙️ *"Let me implement the BFS approach as well to show I can solve this iteratively."*

> 🎙️ *"The key insight for BFS: depth equals the number of levels in the tree. So I traverse level by level, and each time I complete a level, I increment my depth counter."*

```javascript
function maxDepthBFS(root) {
  if (root === null) return 0;
```

> 🎙️ *"I start with the root in the queue and depth at 0."*

```javascript
  const queue = [root];
  let depth = 0;
```

> 🎙️ *"The outer while loop runs once per LEVEL. The critical technique is capturing `queue.length` BEFORE the inner loop as `levelSize`. This tells me exactly how many nodes belong to the current level."*

```javascript
  while (queue.length > 0) {
    const levelSize = queue.length;
    depth++;
```

> 🎙️ *"The inner for loop processes exactly `levelSize` nodes. Any children enqueued during this loop belong to the NEXT level — they won't be touched in this iteration because I fixed the count at `levelSize`."*

🧠 *"'Fixed the count at levelSize' — đây là the KEY INSIGHT. Giải thích TẠI SAO trick này work."*

```javascript
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  return depth;
}
```

> 🎙️ *"After the outer while loop, `depth` contains the number of levels we processed, which is exactly the maximum depth."*

> 🎙️ *"This `levelSize` pattern is foundational for BFS problems. Once you know this trick, you can solve: level-order traversal, right-side view, zigzag traversal, average of levels — they all use the same technique with different aggregation logic per level."*

🧠 *"Naming 4 problems that use same pattern = GENERALIZATION skill. Interviewer sees 'this person can TRANSFER knowledge'."*

---

### 📌 Khi bạn BÍ — Emergency Phrases

```
KHI ĐANG NGHĨ (chưa có idea):
═══════════════════════════════════════════════════════════════

  🎙️ "Let me think about what information I need
      at each node to compute the final answer..."
  🎙️ "If I were standing at the root, what would I
      need to know about my subtrees?"
  🎙️ "Let me work with the smallest example —
      a tree with just 3 nodes — and see what happens..."

KHI CÓ IDEA NHƯNG CHƯA CHẮC:
═══════════════════════════════════════════════════════════════

  🎙️ "I have a feeling this can be solved recursively
      because each subtree is itself a valid tree...
      let me think about what the base case would be..."
  🎙️ "I think the depth at any node is related to the
      depths of its children. Let me verify with
      the example..."

KHI CODE BỊ KẸT (vd: quên base case):
═══════════════════════════════════════════════════════════════

  🎙️ "Wait, what happens when root is null?
      Let me make sure I handle that..."
  🎙️ "Let me trace through my code with a null
      input to check my base case..."
  🎙️ "Hmm, I'm getting confused about whether to
      return 0 or -1 for null. Let me go back
      to the definition — counting nodes, so
      null = 0 nodes = return 0."

KHI HOÀN TOÀN BLANK:
═══════════════════════════════════════════════════════════════

  🎙️ "Let me start from first principles. I need
      the longest root-to-leaf path. I could do
      a traversal and track the depth as I go..."
  🎙️ "What if I just count levels? That's what
      BFS does — one level at a time..."
```

---

### 📌 Nếu interviewer hỏi thêm — Full Script

**Q1: "What's the difference between depth, height, and level?"**

> 🎙️ *"These are commonly confused. Let me be precise:*
>
> - ***Depth of a NODE** = number of edges from root DOWN to that node. Root has depth 0.*
> - ***Height of a NODE** = number of edges from that node DOWN to the farthest leaf. Leaves have height 0.*
> - ***Height of a TREE** = height of the root = depth of the deepest leaf (in edges).*
> - ***Level of a NODE** = depth + 1 (in some conventions). Root is level 1.*
>
> *The relationship: tree's height (edges) = tree's depth (nodes) - 1.*
> *This problem asks for depth counting NODES, so it's the tree's height + 1."*
>
> *(Vẽ diagram)*
> ```
>       1    depth=0, height=2, level=1
>      / \
>     2   3  depth=1, height=0/1, level=2
>        /
>       4    depth=2, height=0, level=3
>
> Tree height (edges) = 2
> Tree depth (nodes) = 3 = height + 1
> ```

🧠 *"Vẽ diagram cho mỗi node = crystal clear. Interviewer thấy bạn 100% hiểu."*

**Q2: "Can you solve this with O(1) extra space?"**

> 🎙️ *"True O(1) is tricky. The recursive approach has O(h) implicit stack. For explicit O(1), I'd need Morris Traversal — it temporarily threads the tree so we can traverse without a stack by using unused right pointers."*
>
> *"However, Morris traversal is complex, modifies the tree temporarily, and is over-engineering for this problem. I'd only bring it up to show I know it exists. In practice, the recursive O(h) is perfectly acceptable."*

🧠 *"'I'd only bring it up to show I know it exists' = honest, practical. Interviewer respects this."*

**Q3: "How would you find the MINIMUM depth instead?"**

🧠 *"BẪY! Không thể chỉ đổi max→min. Phải giải thích WHY."*

> 🎙️ *"This is a great follow-up because it's NOT as simple as changing max to min. Let me explain the trap:*
>
> *With max depth, if a node has only a left child (right is null), we correctly take max(depth(left), 0) = depth(left). No problem.*
>
> *But with min depth, min(depth(left), 0) = 0, which says 'the shortest path from this node to a leaf is 0'. But that's wrong — the null side is NOT a leaf! A leaf is a node with NO children. The null side is just... nothing.*
>
> *So I need guard clauses:"*
>
> ```javascript
> function minDepth(root) {
>   if (root === null) return 0;
>   // If left child is missing, MUST go right!
>   if (root.left === null) return 1 + minDepth(root.right);
>   // If right child is missing, MUST go left!
>   if (root.right === null) return 1 + minDepth(root.left);
>   // Both children exist: now I can safely take min!
>   return 1 + Math.min(minDepth(root.left), minDepth(root.right));
> }
> ```
>
> *"The key insight: I only take min when BOTH children exist. If only one exists, I'm forced to go down that path because the other side isn't a valid leaf."*

> 🎙️ *"Actually, for min depth, BFS is even better — I can stop at the FIRST level that contains a leaf node. That's an early termination that DFS can't do easily."*

**Q4: "What if this were an N-ary tree instead?"**

> 🎙️ *"Same concept! Instead of max(left, right), I'd take max over ALL children:*
> ```javascript
> function maxDepthNary(root) {
>   if (root === null) return 0;
>   let maxChild = 0;
>   for (const child of root.children) {
>     maxChild = Math.max(maxChild, maxDepthNary(child));
>   }
>   return 1 + maxChild;
> }
> ```
> *"Or more concisely with reduce:*
> ```javascript
> return 1 + Math.max(0,
>   ...root.children.map(c => maxDepthNary(c))
> );
> ```
> *"The `0` in Math.max handles the case where children array is empty — a leaf node."*

**Q5: "Can you find the depth WITHOUT knowing it's a tree? What if it's a graph?"**

🧠 *"Curveball! Tree = graph without cycles. Nếu có cycles, cần visited set."*

> 🎙️ *"If it's a general graph, I'd need to handle cycles. I'd add a `visited` set to avoid infinite loops:*
> ```javascript
> function maxDepthGraph(node, visited = new Set()) {
>   if (node === null || visited.has(node)) return 0;
>   visited.add(node);
>   let maxChild = 0;
>   for (const neighbor of node.neighbors) {
>     maxChild = Math.max(maxChild, maxDepthGraph(neighbor, visited));
>   }
>   return 1 + maxChild;
> }
> ```
> *"The visited set prevents revisiting nodes. Space becomes O(n) always because we store all visited nodes."*

**Q6: "Your code calls Math.max(). What if the tree has millions of levels? Could that overflow?"**

> 🎙️ *"Math.max() itself won't overflow — it just compares two numbers. The real overflow risk is the recursion call stack. JavaScript has a default stack limit of roughly 10,000-15,000 frames. A skewed tree with a million nodes would crash."*
>
> *"For very deep trees, I'd use the iterative BFS approach. Or, if I needed DFS behavior, I'd use an explicit stack with depth tracking."*

---

### 📌 Pattern Recognition — Nhận diện bài tương tự

```
"1 + max(left, right)" PATTERN — FAMILY:
═══════════════════════════════════════════════════════════════

  Thuộc nhóm: "AGGREGATE info from subtrees"
  = POST-ORDER traversal (children trước parent!)

  ┌──────────────────────────────┬──────────────────────────┐
  │ Problem                      │ Recipe                   │
  ├──────────────────────────────┼──────────────────────────┤
  │ #104 Max Depth               │ 1 + max(L, R)            │
  │ #111 Min Depth               │ 1 + min(L, R) + guards!  │
  │ #110 Balanced Binary Tree    │ |depth(L)-depth(R)| ≤ 1  │
  │ #543 Diameter                │ L + R (update global!)   │
  │ #124 Max Path Sum            │ val + max(L, R, 0)       │
  │ #226 Invert Tree             │ swap(L, R) + recurse     │
  │ #100 Same Tree               │ compare(L1,L2)&&(R1,R2)  │
  │ #101 Symmetric Tree          │ compare(L1,R2)&&(R1,L2)  │
  └──────────────────────────────┴──────────────────────────┘

  TEMPLATE (memorize this!):
  function solve(root) {
    if (root === null) return BASE_CASE;
    const left = solve(root.left);
    const right = solve(root.right);
    // Optional: UPDATE global answer (diameter, max sum)
    // globalMax = Math.max(globalMax, f(left, right));
    return COMBINE(root.val, left, right);
  }

  Chỉ cần thay đổi:
  → BASE_CASE: 0 (depth), true (same), -Infinity (sum)
  → COMBINE: max, min, +, &&, ||
  → Optional GLOBAL update (diameter, path sum)
```

---

### 🧠 Nguyên tắc Think Out Loud — Áp dụng cho bài này

```
6 NGUYÊN TẮC VÀNG:
═══════════════════════════════════════════════════════════════

  1. DERIVE, đừng RECALL!

     ❌ "The formula is 1 + max(left, right)."
        → Interviewer: "They memorized this."

     ✅ "Looking at the root, its depth depends on
         its subtrees. I need 1 for the root itself,
         plus whichever subtree goes deeper..."
        → Interviewer: "They can THINK."

  ─────────────────────────────────────────────────────

  2. Mỗi keyword trong code = 1 câu giải thích!

     return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));

     → "1" = "counting this node"
     → "Math.max" = "want the LONGEST path"
     → "maxDepth(root.left)" = "depth of left subtree"
     → 4 keywords = 4 explanations!

  ─────────────────────────────────────────────────────

  3. NÓI execution order!

     ❌ (chỉ viết code, không explain)
     ✅ "JavaScript evaluates left FIRST, goes all the
         way to the bottom, THEN evaluates right.
         So this is DFS left-to-right."

  ─────────────────────────────────────────────────────

  4. Mention BIẾN THỂ tự nguyện!

     ✅ "For min depth, I CAN'T just swap max→min
         because null isn't a leaf!"
     → Show bạn biết PITFALLS beyond the question!

  ─────────────────────────────────────────────────────

  5. Generalize PATTERN!

     ✅ "The BFS levelSize technique works for
         level averages, right-side view, zigzag..."
     → Show TRANSFER of knowledge!

  ─────────────────────────────────────────────────────

  6. Bài "DỄ" ≠ trả lời "DỄ DÀNG"!

     ❌ "This is trivial, just recursion."
        → Interviewer: "Arrogant. No depth."

     ✅ (Vẫn show full process: clarify, draw, derive,
         code, trace, analyze, alternative)
        → Interviewer: "Even on easy problems,
            this person is thorough."
```

```
NGÔN NGỮ CƠ THỂ (interview trực tiếp):
═══════════════════════════════════════════════════════════════

  ✅ Eye contact khi GIẢI THÍCH (70% thời gian)
  ✅ Nhìn board/code khi VIẾT (100% thời gian viết)
  ✅ POINT vào node cụ thể khi trace
  ✅ Viết TO, RÕ trên whiteboard
  ✅ Để khoảng trống cho sửa code
  ✅ Gật đầu khi interviewer nói

  ❌ Cúi đầu vào code suốt — không interactive
  ❌ Nói nhỏ, lí nhí — interviewer trầm trồ
  ❌ Xóa code viết lại liên tục — messy
  ❌ Viết code BÉ XÍU — không đọc được
  ❌ "This is easy" — thiếu tôn trọng
```
