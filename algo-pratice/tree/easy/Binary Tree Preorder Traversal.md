# 🔄 Binary Tree Preorder Traversal — LeetCode #144 (Easy)

> 📖 Code: [Binary Tree Preorder Traversal.js](./Binary%20Tree%20Preorder%20Traversal.js)

---

## R — Repeat & Clarify

🧠 *"Preorder = Root → Left → Right. Bài đầu tiên về traversal. Phải biết cả 3: pre/in/post."*

> 🎙️ *"The problem asks me to return the preorder traversal of a binary tree — that's visiting in the order: root first, then left subtree, then right subtree."*

> 🎙️ *"Let me clarify:*
>
> *1. **Return format?** — An array of values in preorder sequence.*
>
> *2. **Empty tree?** — Return empty array.*
>
> *3. **Both recursive and iterative?** — I'll show both."*

💡 **Ba loại traversal — SO SÁNH:**
```
       1
      / \
     2   3

  Pre-order:   [1, 2, 3]    Root → Left → Right  (NLR)
  In-order:    [2, 1, 3]    Left → Root → Right  (LNR)  ← BST sorted!
  Post-order:  [2, 3, 1]    Left → Right → Root  (LRN)

  Nhớ: Pre/In/Post = vị trí của ROOT!
    Pre  = Root ĐẦU TIÊN
    In   = Root Ở GIỮA
    Post = Root CUỐI CÙNG
```

---

## E — Examples

```
VÍ DỤ 1:
       1
      / \
     2   3       Preorder: [1, 2, 4, 5, 3, 6]
    / \   \
   4   5   6

  Visit 1 (root!) → go left → visit 2 → go left → visit 4
  → backtrack → visit 5 → backtrack → backtrack
  → go right → visit 3 → go right → visit 6

VÍ DỤ 2: [1, null, 2, 3]
     1
      \            Preorder: [1, 2, 3]
       2
      /
     3

VÍ DỤ 3: [] → []
VÍ DỤ 4: [42] → [42]
```

---

## A — Approach

> 🎙️ *"Two approaches: recursive and iterative."*

> 🎙️ *"**Recursive** is straightforward — literally 3 lines. Visit root, recurse left, recurse right. This mirrors the definition of preorder."*

> 🎙️ *"**Iterative** uses a stack. The key insight: I push the RIGHT child BEFORE the LEFT child onto the stack. Why? Because a stack is LIFO — Last In, First Out. So the LEFT child gets popped first, which is exactly what I want: process left before right."*

🧠 *"Giải thích WHY push right before left = show mình hiểu stack mechanics, không chỉ memorize code!"*

```
TẠI SAO PUSH RIGHT TRƯỚC LEFT?

  Stack = LIFO (Last In, First Out)
  
  Muốn: Root → Left → Right
  
  Stack: push(RIGHT), push(LEFT)
  Pop:   LEFT first ✅, then RIGHT ✅
  
  Nếu push LEFT trước, RIGHT sau:
  Pop:   RIGHT first ❌ ← SAI THỨ TỰ!
```

---

## C — Code

> 📖 Full code: [Binary Tree Preorder Traversal.js](./Binary%20Tree%20Preorder%20Traversal.js)

### Approach 1: Recursive

```javascript
function preorderTraversal(root) {
  const result = [];
  function dfs(node) {
    if (!node) return;
    result.push(node.val);   // 1. Visit ROOT first!
    dfs(node.left);           // 2. Then LEFT subtree
    dfs(node.right);          // 3. Then RIGHT subtree
  }
  dfs(root);
  return result;
}
```

> 🎙️ *"The recursive version directly mirrors the definition: visit root, go left, go right. The call stack handles the backtracking automatically."*

### Approach 2: Iterative (Stack)

```javascript
function preorderTraversal(root) {
  if (!root) return [];
  const stack = [root], result = [];
  while (stack.length > 0) {
    const node = stack.pop();
    result.push(node.val);                    // Visit!
    if (node.right) stack.push(node.right);   // Push RIGHT first! (LIFO)
    if (node.left) stack.push(node.left);     // Push LEFT second! (popped first)
  }
  return result;
}
```

> 🎙️ *"The iterative version simulates the call stack. I pop a node, visit it, then push its children (right before left). The stack ensures left subtree is processed before right."*

### Trace Iterative:

```
Tree:    1
        / \
       2   3
      / \
     4   5

  start:  stack=[1]
  pop 1→ result=[1], push right(3), push left(2) → stack=[3, 2]
  pop 2→ result=[1,2], push right(5), push left(4) → stack=[3, 5, 4]
  pop 4→ result=[1,2,4], no children → stack=[3, 5]
  pop 5→ result=[1,2,4,5], no children → stack=[3]
  pop 3→ result=[1,2,4,5,3], no children → stack=[]
  DONE! → [1, 2, 4, 5, 3] ✅
```

---

## T — Test

| Test | Input | Expected | Why |
|---|---|---|---|
| Normal | `[1,2,3,4,5,null,6]` | `[1,2,4,5,3,6]` | Full tree |
| Right-only | `[1,null,2,3]` | `[1,2,3]` | No left |
| Empty | `null` | `[]` | Edge case |
| Single | `[42]` | `[42]` | One node |
| Left-skewed | `[1,2,3,4]` | `[1,2,3,4]` | All left |

---

## O — Optimize

```
┌────────────────┬──────────────┬──────────────┐
│                │ Recursive    │ Iterative    │
├────────────────┼──────────────┼──────────────┤
│ Time           │ O(n)         │ O(n)         │
│ Space          │ O(h) stack   │ O(h) stack   │
│ Code lines     │ ~6           │ ~9           │
│ Stack overflow │ Possible     │ No           │
└────────────────┴──────────────┴──────────────┘
h = height. O(log n) balanced, O(n) skewed.
```

> 🎙️ *"Both are O(n) time — we visit each node exactly once. Space is O(h) for the stack — O(log n) for balanced, O(n) for skewed. The iterative version avoids call stack overflow for very deep trees."*

---

## 🗣️ Think Out Loud — Kịch Bản Interview

### 📌 Phút 0–1: Clarify

> 🎙️ *"Preorder means root first, then left, then right. I'll implement both recursive and iterative versions. The recursive is trivial — 3 lines. The iterative uses a stack with a specific push order."*

### 📌 Phút 1–3: Code + Explain

> 🎙️ *"For the iterative version, the key insight is pushing RIGHT before LEFT. Since a stack is LIFO, pushing right first means left gets popped first — maintaining the correct preorder sequence."*

### 📌 Phút 3–4: Trace + Test

> 🎙️ *(trace as shown above)*

### 📌 Follow-up Questions

**Q: "How would you do inorder iteratively?"**

> 🎙️ *"Inorder iterative is trickier — I can't just change push order. I need to go left as far as possible, pushing nodes onto the stack, then pop and visit, then go right:*
> ```javascript
> while (stack.length > 0 || node) {
>   while (node) { stack.push(node); node = node.left; }
>   node = stack.pop();
>   result.push(node.val);
>   node = node.right;
> }
> ```
> *This is harder because I need to delay visiting the root until I've gone all the way left."*

**Q: "What about Morris traversal?"**

> 🎙️ *"Morris traversal uses O(1) space by temporarily threading the tree — setting right pointers to predecessor nodes. For preorder, I visit before threading. O(n) time, O(1) space. But it temporarily modifies the tree."*

---

### 📌 Pattern Recognition

```
TRAVERSAL FAMILY:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬───────────────────┬──────────────────────┐
  │ Traversal    │ Order             │ Use Case             │
  ├──────────────┼───────────────────┼──────────────────────┤
  │ Preorder     │ Root→L→R          │ Copy/serialize tree  │
  │ Inorder      │ L→Root→R          │ BST → sorted order!  │
  │ Postorder    │ L→R→Root          │ Delete tree, eval    │
  │ Level-order  │ BFS by level      │ Level-by-level ops   │
  └──────────────┴───────────────────┴──────────────────────┘

  Iterative tricks:
  → Preorder:  stack, push R before L
  → Inorder:   stack, go left first
  → Postorder: reverse of modified preorder!
  → Level:     queue with levelSize
```
