# 🔄 Binary Tree Postorder Traversal — LeetCode #145 (Easy)

> 📖 Code: [Binary Tree Postorder Traversal.js](./Binary%20Tree%20Postorder%20Traversal.js)

---

## R — Repeat & Clarify

🧠 *"Postorder = Left → Right → Root. Con trước, cha sau. Dùng khi cần info CON trước tính CHA."*

> 🎙️ *"Postorder traversal visits left subtree first, then right subtree, then the root. The root is processed LAST — hence 'post' order."*

> 🎙️ *"Key use cases: deleting a tree (delete children before parent), evaluating expression trees (compute operands before operator), computing heights/sizes (need subtree info first)."*

---

## E — Examples

```
VÍ DỤ 1:
       1
      / \
     2   3       Postorder: [4, 5, 2, 6, 3, 1]
    / \   \
   4   5   6

  Visit deepest left: 4, then 5, then parent 2
  Then right side: 6, then parent 3
  Finally ROOT: 1

VÍ DỤ 2: [1, null, 2, 3]
     1
      \         Postorder: [3, 2, 1]
       2
      /
     3
```

---

## A — Approach

> 🎙️ *"Recursive is trivial — swap the order of push to AFTER both recursive calls."*

> 🎙️ *"Iterative is the tricky one! The clever trick: postorder is L→R→Root. If I do a MODIFIED preorder Root→R→L (push left before right), then REVERSE the result, I get L→R→Root which IS postorder!"*

```
ITERATIVE TRICK:
  Preorder:          Root → Left → Right
  Modified preorder: Root → Right → Left  (push L before R)
  Reverse:           Left → Right → Root = POSTORDER! ✅
```

---

## C — Code

### Approach 1: Recursive

```javascript
function postorderTraversal(root) {
  const result = [];
  function dfs(node) {
    if (!node) return;
    dfs(node.left);           // 1. Left first!
    dfs(node.right);          // 2. Right second!
    result.push(node.val);    // 3. ROOT LAST!
  }
  dfs(root);
  return result;
}
```

### Approach 2: Iterative (Reverse Trick)

```javascript
function postorderTraversal(root) {
  if (!root) return [];
  const stack = [root], result = [];
  while (stack.length > 0) {
    const node = stack.pop();
    result.push(node.val);
    if (node.left) stack.push(node.left);     // Push LEFT first!
    if (node.right) stack.push(node.right);   // Push RIGHT second!
  }
  return result.reverse();  // REVERSE = postorder!
}
```

> 🎙️ *"Compare with preorder iterative: preorder pushes RIGHT before LEFT. Here I push LEFT before RIGHT (modified preorder: Root→R→L), then reverse to get L→R→Root."*

### Trace:

```
Tree: 1(2(4,5), 3(,6))

Modified preorder (Root→R→L):
  pop 1 → [1], push left(2), push right(3) → stack=[2,3]
  pop 3 → [1,3], push right(6) → stack=[2,6]
  pop 6 → [1,3,6] → stack=[2]
  pop 2 → [1,3,6,2], push left(4), push right(5) → stack=[4,5]
  pop 5 → [1,3,6,2,5] → stack=[4]
  pop 4 → [1,3,6,2,5,4] → stack=[]

Reverse: [4,5,2,6,3,1] ✅ = Postorder!
```

---

## O — Optimize

```
┌────────────────┬──────────────┬──────────────┐
│                │ Recursive    │ Iterative    │
├────────────────┼──────────────┼──────────────┤
│ Time           │ O(n)         │ O(n)         │
│ Space          │ O(h) stack   │ O(n) result  │
│ Tricky?        │ No           │ Reverse trick│
└────────────────┴──────────────┴──────────────┘
```

---

## 🗣️ Interview Script

### Follow-up: "Can you do postorder iteratively WITHOUT reversing?"

> 🎙️ *"Yes! But it's more complex. I need to track whether I've already visited a node's right child. I use a `lastVisited` variable:*
> ```javascript
> const stack = [], result = [];
> let node = root, lastVisited = null;
> while (node || stack.length > 0) {
>   while (node) { stack.push(node); node = node.left; }
>   const top = stack[stack.length - 1];
>   if (top.right && top.right !== lastVisited) {
>     node = top.right;
>   } else {
>     result.push(top.val);
>     lastVisited = stack.pop();
>   }
> }
> ```
> *This avoids the reverse but is harder to remember. The reverse trick is preferred in interviews."*

### Pattern Recognition

```
3 TRAVERSALS — ITERATIVE TRICKS:
═══════════════════════════════════════════════════════════════

  Preorder:   stack, push R before L  → direct!
  Inorder:    stack, go left first, then pop & visit
  Postorder:  stack, push L before R, then REVERSE!
              OR: use lastVisited tracking

  Tất cả: O(n) time, O(h) space
  Recursive: 3 dòng, đổi vị trí result.push()
```
