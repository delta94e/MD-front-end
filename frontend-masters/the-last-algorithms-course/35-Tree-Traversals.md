# The Last Algorithms Course You'll Need — Phần 35: Tree Traversals — "Pre, In, Post Order — Visit vs Recurse, O(N)!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Tree Traversals — "Three orderings: pre (visit first), in (visit middle), post (visit last). All O(N) — must visit every node!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — depth-first traversals, pre/in/post order, running time O(N), freeing memory!

---

## Mục Lục

| #   | Phần                                                     |
| --- | -------------------------------------------------------- |
| 1   | Traversal — "Visit a Node, Then Recurse!"                |
| 2   | Pre-order — "Visit FIRST, Then Recurse!"                 |
| 3   | In-order — "Recurse Left, VISIT, Recurse Right!"         |
| 4   | Post-order — "Recurse Both, VISIT Last!"                 |
| 5   | Side-by-side — "Same Tree, Three Orderings!"             |
| 6   | Why Different Orderings? — "Printing, Sorting, Freeing!" |
| 7   | Running Time — "O(N) — Must Visit Every Node!"           |
| 8   | Q: "Weak vs Strong Ordering?" — "Heap vs BST!"           |
| 9   | Tự Implement: All Three Traversals                       |

---

## §1. Traversal — "Visit a Node, Then Recurse!"

> Prime: _"A traversal is visiting every single node. You VISIT the node (do something with the value), then RECURSE."_

### The tree!

```
       (7)
      /   \
   (23)    (3)
   / \    /   \
 (5) (4)(18) (21)
```

---

## §2. Pre-order — "Visit FIRST, Then Recurse!"

> Prime: _"I first visited the node, THEN I did the recursion. Pre-order."_

```
PRE-ORDER: Visit → Recurse Left → Recurse Right
═══════════════════════════════════════════════════════════════

         (7)①         ① Visit 7!
        /    \         ② Go left → visit 23!
     (23)②   (3)⑤     ③ Go left → visit 5!
     / \     /   \     ④ Back up, go right → visit 4!
   (5)③(4)④(18)⑥(21)⑦ ⑤ Back to 7, go right → visit 3!
                       ⑥ Go left → visit 18!
                       ⑦ Go right → visit 21!

  Output: 7, 23, 5, 4, 3, 18, 21

  "Root is at the BEGINNING!" — Prime
```

### Code pattern!

```
function preOrder(node):
  if (!node) return        ← base case!
  VISIT(node)              ← PRE: do something!
  preOrder(node.left)      ← recurse left!
  preOrder(node.right)     ← recurse right!
```

---

## §3. In-order — "Recurse Left, VISIT, Recurse Right!"

> Prime: _"In-order traversal on a binary search tree will print out the array IN ORDER."_

```
IN-ORDER: Recurse Left → Visit → Recurse Right
═══════════════════════════════════════════════════════════════

         (7)④         ① Go all the way left → visit 5!
        /    \         ② Back up → visit 23!
     (23)②   (3)⑥     ③ Go right → visit 4!
     / \     /   \     ④ Back to root → visit 7!
   (5)①(4)③(18)⑤(21)⑦ ⑤ Go right, go left → visit 18!
                       ⑥ Back up → visit 3!
                       ⑦ Go right → visit 21!

  Output: 5, 23, 4, 7, 18, 3, 21

  "Root is in the MIDDLE!" — Prime
```

### Code pattern!

```
function inOrder(node):
  if (!node) return        ← base case!
  inOrder(node.left)       ← recurse left!
  VISIT(node)              ← IN: do something!
  inOrder(node.right)      ← recurse right!
```

---

## §4. Post-order — "Recurse Both, VISIT Last!"

> Prime: _"If you need to clean up memory, do a post-order traversal. You first get to all the children, then on your way OUT you delete back up."_

```
POST-ORDER: Recurse Left → Recurse Right → Visit
═══════════════════════════════════════════════════════════════

         (7)⑦         ① Go all the way left → visit 5!
        /    \         ② Go right → visit 4!
     (23)③   (3)⑥     ③ Back up → visit 23!
     / \     /   \     ④ Go right side, go left → visit 18!
   (5)①(4)②(18)④(21)⑤ ⑤ Go right → visit 21!
                       ⑥ Back up → visit 3!
                       ⑦ Back to root → visit 7!

  Output: 5, 4, 23, 18, 21, 3, 7

  "Root is at the END!" — Prime
```

### Code pattern!

```
function postOrder(node):
  if (!node) return        ← base case!
  postOrder(node.left)     ← recurse left!
  postOrder(node.right)    ← recurse right!
  VISIT(node)              ← POST: do something!
```

---

## §5. Side-by-side — "Same Tree, Three Orderings!"

```
SAME TREE, THREE ORDERINGS:
═══════════════════════════════════════════════════════════════

         (7)
        /   \
     (23)    (3)
     / \    /   \
   (5) (4)(18) (21)

  Pre-order:   7, 23, 5, 4, 3, 18, 21   ← root FIRST!
  In-order:    5, 23, 4, 7, 18, 3, 21   ← root MIDDLE!
  Post-order:  5, 4, 23, 18, 21, 3, 7   ← root LAST!

  The ONLY difference: WHERE you visit the node!
```

---

## §6. Why Different Orderings? — "Printing, Sorting, Freeing!"

| Ordering       | Use Case                                          |
| -------------- | ------------------------------------------------- |
| **Pre-order**  | Copy/serialize a tree, print hierarchy!           |
| **In-order**   | BST → prints sorted array!                        |
| **Post-order** | Free memory (delete children first, then parent!) |

> Prime: _"In a language where you need to clean up memory, doing a post-order traversal where you FREE the memory is how you have to do it."_

---

## §7. Running Time — "O(N) — Must Visit Every Node!"

> Prime: _"What's the input? The whole tree. If the tree doubles, how many more operations? DOUBLE. So O(N) — linear!"_

_"If you double the input and it quadruples the work → O(N²). If it doubles the work → O(N). If it eight-folds → O(N³)."_

---

## §8. Q: "Weak vs Strong Ordering?"

> Student: _"What's the difference between strong and weak ordering?"_

- **Weak ordering (Heap)**: parent is smaller, children are bigger — but children are NOT ordered among themselves!
- **Strong ordering (BST)**: left < parent < right, strictly ordered!

---

## §9. Tự Implement: All Three Traversals

```javascript
// ═══ Tree Traversals — Pre, In, Post ═══

// Build the tree from the lecture
const tree = {
  value: 7,
  left: {
    value: 23,
    left: { value: 5, left: null, right: null },
    right: { value: 4, left: null, right: null },
  },
  right: {
    value: 3,
    left: { value: 18, left: null, right: null },
    right: { value: 21, left: null, right: null },
  },
};

// Pre-order: VISIT → left → right!
function preOrder(node, result = []) {
  if (!node) return result;
  result.push(node.value); // ← VISIT first!
  preOrder(node.left, result);
  preOrder(node.right, result);
  return result;
}

// In-order: left → VISIT → right!
function inOrder(node, result = []) {
  if (!node) return result;
  inOrder(node.left, result);
  result.push(node.value); // ← VISIT middle!
  inOrder(node.right, result);
  return result;
}

// Post-order: left → right → VISIT!
function postOrder(node, result = []) {
  if (!node) return result;
  postOrder(node.left, result);
  postOrder(node.right, result);
  result.push(node.value); // ← VISIT last!
  return result;
}

console.log("═══ TREE TRAVERSALS ═══\n");
console.log("Tree:");
console.log("       (7)");
console.log("      /   \\");
console.log("   (23)    (3)");
console.log("   / \\    /   \\");
console.log(" (5) (4)(18) (21)");

console.log("\nPre-order: ", preOrder(tree)); // [7,23,5,4,3,18,21]
console.log("In-order:  ", inOrder(tree)); // [5,23,4,7,18,3,21]
console.log("Post-order:", postOrder(tree)); // [5,4,23,18,21,3,7]

console.log("\n═══ WHERE IS ROOT? ═══");
console.log("Pre-order:  root is FIRST!");
console.log("In-order:   root is MIDDLE!");
console.log("Post-order: root is LAST!");

console.log("\n═══ COMPLEXITY ═══");
console.log("All traversals: O(N) — visit every node!");
console.log("\n✅ Only difference: WHERE you visit!");
```

---

## Checklist

```
[ ] Traversal = visit every node!
[ ] Pre-order: VISIT → left → right (root first!)
[ ] In-order: left → VISIT → right (root middle!)
[ ] Post-order: left → right → VISIT (root last!)
[ ] In-order on BST → sorted output!
[ ] Post-order → safe to free memory!
[ ] All traversals: O(N) — linear!
[ ] "If input doubles, work doubles → O(N)" — Prime
[ ] General tree: pre + post work, in-order = confusing!
TIẾP THEO → Phần 36: Implementing Tree Traversals!
```
