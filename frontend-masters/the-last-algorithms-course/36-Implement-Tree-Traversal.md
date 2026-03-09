# The Last Algorithms Course You'll Need — Phần 36: Implement Tree Traversal — "walk(), Pre/In/Post = One Line Difference, DFS = Stack!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implement Tree Traversal — "walk() helper, move push() position for pre/in/post, implicit stack = recursion, DFS = depth first!"
> Độ khó: ⭐️⭐️⭐️ | Implementation — all three traversals, only difference is WHERE you push, recursion uses call stack!

---

## Mục Lục

| #   | Phần                                                |
| --- | --------------------------------------------------- |
| 1   | The walk() Helper — "Base Case + Pre/Recurse/Post!" |
| 2   | Pre-order — "Push FIRST, Then Walk!"                |
| 3   | In-order — "Walk Left, Push, Walk Right!"           |
| 4   | Post-order — "Walk Both, Push LAST!"                |
| 5   | "Triple Threat First Try!" 😂                       |
| 6   | DFS = Depth First — "Implicit Stack!"               |
| 7   | Tự Implement: All Three Traversals                  |

---

## §1. The walk() Helper — "Base Case + Pre/Recurse/Post!"

> Prime: _"In general, I always create a second function when doing recursion."_

### Base case!

> Prime: _"The base case is when we're at a node that doesn't exist. We've gone to a child that's not actually there."_

```typescript
function walk(curr: BinaryNode<number> | null, path: number[]): number[] {
  if (!curr) return path; // ← base case: node doesn't exist!

  // PRE: push here for pre-order!
  walk(curr.left, path); // recurse left!
  // IN: push here for in-order!
  walk(curr.right, path); // recurse right!
  // POST: push here for post-order!

  return path;
}
```

---

## §2. Pre-order — "Push FIRST, Then Walk!"

```typescript
function walk(curr: BinaryNode<number> | null, path: number[]): number[] {
  if (!curr) return path;

  path.push(curr.value); // ← PRE: visit first!
  walk(curr.left, path);
  walk(curr.right, path);

  return path;
}

export default function preOrder(head: BinaryNode<number>): number[] {
  return walk(head, []);
}
```

---

## §3. In-order — "Walk Left, Push, Walk Right!"

> Prime: _"We just put it IN BETWIXT the two walks. Split that walk in twain."_ 😂

```typescript
function walk(curr: BinaryNode<number> | null, path: number[]): number[] {
  if (!curr) return path;

  walk(curr.left, path);
  path.push(curr.value); // ← IN: visit middle!
  walk(curr.right, path);

  return path;
}
```

---

## §4. Post-order — "Walk Both, Push LAST!"

```typescript
function walk(curr: BinaryNode<number> | null, path: number[]): number[] {
  if (!curr) return path;

  walk(curr.left, path);
  walk(curr.right, path);
  path.push(curr.value); // ← POST: visit last!

  return path;
}
```

---

## §5. "Triple Threat First Try!" 😂

> Prime: _"Look at that — we got all three of them first try. That's a triple threat first try!"_

### The ONLY difference!

```
Pre-order:   PUSH → walk left → walk right
In-order:    walk left → PUSH → walk right
Post-order:  walk left → walk right → PUSH

ONE LINE moves position! That's it!
```

---

## §6. DFS = Depth First — "Implicit Stack!"

> Prime: _"What implicit data structure did we use during depth first search? A STACK!"_

```
IMPLICIT STACK:
═══════════════════════════════════════════════════════════════

  In-order traversal of tree:
         (7)
        /   \
     (23)    (3)
     / \    /   \
   (5) (4)(18) (21)

  Call stack:          Print:
  ────────────         ──────
  push 7
  push 23
  push 5
  pop 5 → print       5
  pop 23 → print      23
  push 4
  pop 4 → print       4
  pop 7 → print       7
  push 3
  push 18
  pop 18 → print      18
  pop 3 → print       3
  push 21
  pop 21 → print      21

  "Recursion = just pushing and popping on a stack!
   Which means we can do this WITHOUT recursion!" — Prime
```

---

## §7. Tự Implement: All Three Traversals

```javascript
// ═══ Tree Traversals — Implementation ═══

function preOrderWalk(node, path) {
  if (!node) return path;
  path.push(node.value); // PRE!
  preOrderWalk(node.left, path);
  preOrderWalk(node.right, path);
  return path;
}

function inOrderWalk(node, path) {
  if (!node) return path;
  inOrderWalk(node.left, path);
  path.push(node.value); // IN!
  inOrderWalk(node.right, path);
  return path;
}

function postOrderWalk(node, path) {
  if (!node) return path;
  postOrderWalk(node.left, path);
  postOrderWalk(node.right, path);
  path.push(node.value); // POST!
  return path;
}

// Build tree
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

console.log("═══ IMPLEMENT TREE TRAVERSALS ═══\n");
console.log("Pre-order: ", preOrderWalk(tree, [])); // [7,23,5,4,3,18,21]
console.log("In-order:  ", inOrderWalk(tree, [])); // [5,23,4,7,18,3,21]
console.log("Post-order:", postOrderWalk(tree, [])); // [5,4,23,18,21,3,7]

// Q&A: path is passed by reference!
console.log("\n═══ WHY RETURN PATH? ═══");
console.log("Path is mutated by reference (like all JS objects).");
console.log("Returning it is just a CONVENIENCE — not required!");
console.log("'It's not anything fantastic' — Prime");

console.log("\n✅ Only ONE line moves between pre/in/post!");
```

---

## Checklist

```
[ ] walk() helper: base case = node is null/undefined!
[ ] Pre-order: push BEFORE recursing!
[ ] In-order: push BETWEEN left and right!
[ ] Post-order: push AFTER recursing!
[ ] Only ONE line changes position!
[ ] Path passed by reference — mutation works!
[ ] Returning path is convenience, not necessity!
[ ] DFS uses implicit STACK (function call stack!)
[ ] Can do traversals iteratively with explicit stack!
TIẾP THEO → Phần 37: Breadth First Search!
```
