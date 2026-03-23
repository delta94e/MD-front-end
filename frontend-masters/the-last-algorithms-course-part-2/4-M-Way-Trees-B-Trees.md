# The Last Algorithms Course You'll Want (Part 2) — Phần 4: M-Way Trees & B-Trees — Structure, Insertions, Deletions!

> 📅 2026-03-09 · ⏱ 50 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: M-Way Tree + B-Trees + B-Tree Insertions + B-Tree Leaf Deletion + B-Tree Internal Deletion
> — "The only tree that grows UPWARDS, split & promote, 4 deletion cases, TDD for once!"
> Độ khó: ⭐⭐⭐⭐⭐ | Advanced — Database indexing, disk optimization!

---

## Mục Lục

| #   | Phần                                                  |
| --- | ----------------------------------------------------- |
| 1   | M-Way Tree — "Why Just Binary? Have More Children!"   |
| 2   | M-Way vẫn Degenerate — "Same Problem As Before!"      |
| 3   | B-Tree Rules — "Order, Key Min/Max, Child Min/Max!"   |
| 4   | B-Tree Grows Upwards — "The Only Tree That Grows UP!" |
| 5   | B-Tree Insertion — "Split & Promote!"                 |
| 6   | B-Tree Insertion Multi-Level — "It Just Keeps Going!" |
| 7   | Leaf Deletion Case 1 — "Kmin+1, Just Delete!"         |
| 8   | Leaf Deletion Case 2 — "Borrow From Left Sibling!"    |
| 9   | Leaf Deletion Case 3 — "Borrow From Right Sibling!"   |
| 10  | Leaf Deletion Case 4 — "Merge!"                       |
| 11  | Internal Node Deletion — "Same 3 Cases from BST!"     |
| 12  | Tự Code: B-Tree from Scratch (Order 5!)               |
| 13  | Deep Dive: B-Tree trong Database & File Systems       |

---

## §1. M-Way Tree — "Why Just Binary? Have More Children!"

> Prime: _"All we've been talking about are binary trees, where it's always zero, one, or two children. But why do we have to keep it that way? Can't we have more children?"_

```
M-WAY TREE — CONCEPT:
═══════════════════════════════════════════════════════════════

  Binary tree = mỗi node tối đa 2 children.
  M-way tree = MỖI NODE có thể có tới M children!

  Ví dụ 4-way tree, root có 3 keys:
  ┌─────────────────────┐
  │   10  │  20  │  30  │
  └──┬────┴──┬───┴──┬───┘
     │       │      │     \
    <10   10-20  20-30    >30

  Rule (giống BST nhưng mở rộng!):
  → Mỗi key chia không gian thành ranges!
  → Children[0] < keys[0]
  → keys[0] < Children[1] < keys[1]
  → ...
  → Children[last] > keys[last]

  "If you have x items in your m-way tree,
   you'll have x+1 children." — Prime

  KEY FORMULA:
  → M children → M-1 keys per node!
  → 4-way tree: tối đa 4 children, 3 keys!
  → 8-way tree: tối đa 8 children, 7 keys!
```

---

## §2. M-Way vẫn Degenerate — "Same Problem As Before!"

> Prime: _"So no matter how you just have simple rules to an m-way tree, you're gonna run into the exact same problem that you did with the binary tree."_

```
M-WAY CŨNG DEGENERATE!
═══════════════════════════════════════════════════════════════

  3-way tree, insert 10, 20, 30, 40, 50, 69, 70:

  Option 1 (linked list lại!):
    [10]
      \
      [20]
        \
        [30] ...

  Option 2 (full node rồi linked list!):
    [10, 20]
           \
           [30, 40]
                  \
                  [50, 69]
                        \
                        [70]

  → CÙNG VẤN ĐỀ! Height = O(n)! 💀
  → "What do you think we need for an m-way tree?
     A tree balancing algorithm!" — Prime
```

---

## §3. B-Tree Rules — "Order, Key Min/Max, Child Min/Max!"

> Prime: _"There's a couple rules to a B-tree."_

```
B-TREE RULES:
═══════════════════════════════════════════════════════════════

  ORDER = max number of CHILDREN per node!

  Ví dụ Order 5:
  ┌──────────────────────────────────────────────────┐
  │ Child Max = Order = 5                            │
  │ Key Max = Order - 1 = 4                          │
  │ Key Min = ⌈Order/2⌉ - 1 = ⌈5/2⌉ - 1 = 3-1 = 2  │
  │ Child Min = ⌈Order/2⌉ = 3                        │
  └──────────────────────────────────────────────────┘

  ⚠️ ⌈x⌉ = CEILING = làm tròn LÊN!
  "Ceiling simply means that if it's 3.1,
   the answer is 4." — Prime

  Ví dụ Order 4 (2-3-4 tree!):
  ┌──────────────────────────────────────────────────┐
  │ Child Max = 4                                    │
  │ Key Max = 3                                      │
  │ Key Min = ⌈4/2⌉ - 1 = 2-1 = 1                    │
  │ Child Min = ⌈4/2⌉ = 2                            │
  │                                                   │
  │ → Mỗi node có 2, 3, hoặc 4 children!             │
  │ → "That's a 2-3-4 tree! That's where the name    │
  │    comes from." — Prime                           │
  └──────────────────────────────────────────────────┘


  SPECIAL RULE:
  → Root CAN have just 1 key! (breaks lower bound!)
  → "If I were to insert 10 into an empty tree,
     there's just 10. The root has to be able to
     violate the minimum key rule." — Prime

  UNIQUE PROPERTY:
  → B-TREES GROW UPWARDS! ↑↑↑
  → "The only tree in computer science that grows up.
     The rest all grow downwards." — Prime
```

---

## §4. B-Tree Insertion — "Split & Promote!"

> Prime: _"We're gonna start by inserting values and create a beautiful B-tree."_

```
B-TREE INSERTION (Order 5, Key Max = 4):
═══════════════════════════════════════════════════════════════

  Insert 10:
  [10]

  Insert 20:
  [10, 20]

  Insert 30:
  [10, 20, 30]

  Insert 40:
  [10, 20, 30, 40]  ← Full! Key Max = 4! ✅

  Insert 50:
  [10, 20, 30, 40, 50]  ← VIOLATION! 5 keys > Key Max 4!

  → SPLIT & PROMOTE!

  Step 1: Take MEDIAN (30!)
  Step 2: PROMOTE 30 upwards!
  Step 3: SPLIT remaining into 2 nodes!

  BEFORE SPLIT:        AFTER SPLIT:
  [10,20,30,40,50]         [30]
                          /    \
                     [10,20]  [40,50]

  Mỗi bên có 2 keys = Key Min! ✅ Perfect!

  "30 goes upwards, it's now the root.
   We are growing upwards." — Prime

  Insert 69, 70:
         [30]
        /    \
  [10,20]  [40,50,69,70]  ← Full + 1 sẽ violation!

  Insert 71:
  [40,50,69,70,71] → SPLIT! Promote 69!

             [30, 69]
           /    |    \
     [10,20] [40,50] [70,71]

  "69 goes up, create two subtrees.
   Everything on this side was less than,
   so it maintains the property." — Prime
```

---

## §5. B-Tree Insertion Multi-Level — "It Keeps Going!"

```
ORDER 4 — GROWING MULTIPLE LEVELS:
═══════════════════════════════════════════════════════════════

  Key Max=3, Key Min=1, Child Max=4, Child Min=2

  Insert 10, 20, 30 → [10,20,30] ← FULL!

  Insert 40 → SPLIT (left bias)!
       [20]
      /    \
   [10]   [30,40]

  Insert 50, 69 → [30,50,69] ← FULL!

  Insert 70 → SPLIT! Promote 50!
        [20, 50]
       /   |    \
    [10] [30] [69,70]

  Insert 5, 3 → [3,5,10] ← FULL!

  Insert 1 → SPLIT! Promote 5!
  5 goes UP to parent!
           [5, 20, 50]
          / |    |    \
       [1,3][10][30][69,70]

  Insert 2 → [1,2,3] ← FULL!

  SPLIT! Promote 2! → 2 goes to parent!

  But parent = [2,5,20,50] → 4 keys = Key Max + 1!
  → SPLIT AGAIN at parent level!

  Promote 20!

              [20]
            /      \
        [2, 5]     [50]
       / |   \     /   \
    [1][3][10][30][69,70]

  "Don't be clever, okay? Just do the exact same thing.
   You just keep on doing this over and over again." — Prime

  → Tree GROWS UP when parent overflows! 🌳↑
```

---

## §6. Leaf Deletion — 4 Cases

> Prime: _"Deletion is a little weird. So we're gonna do it in phases because there's a lot of rules."_

```
4 CASES OF LEAF DELETION:
═══════════════════════════════════════════════════════════════

  Order 5: Key Min = 2, Key Max = 4

  CASE 1: Node has Kmin+1 hoặc hơn → JUST DELETE!
  ─────────────────────────────────────────────────
  Node: [10, 20, 30]  (3 keys > Kmin 2!)
  Delete 20: [10, 30]  (2 keys = Kmin! Still valid!)
  → "Just delete the key. Easy-peasy." — Prime

  CASE 2: Node has Kmin, LEFT sibling has Kmin+1!
  ─────────────────────────────────────────────────
  Parent: [..., 5, ...]
  Left:   [1, 2, 3]   ← Has Kmin+1! Can spare!
  Node:   [12, ...]    ← Delete 12, but only Kmin keys!

  Algorithm:
  1. Take largest from LEFT sibling (3!)
  2. Move 3 UP to parent position (replace 5!)
  3. Move 5 DOWN to FRONT of our node!
  4. Now delete 12 → reduced to Case 1!

  BEFORE:                    AFTER:
  [..., 5, ...]              [..., 3, ...]
  [1, 2, 3]  [12, X]        [1, 2]  [5, X]
                             → Now delete 12 easily!

  "We're gonna take the 3 and move it up to where
   the 5 is. Take 5 and move it to the front of
   the list. Now we can delete 12 easily!" — Prime


  CASE 3: Node has Kmin, RIGHT sibling has Kmin+1!
  ─────────────────────────────────────────────────
  Parent: [..., 15, ...]
  Node:   [10, ...]     ← Delete 10, only Kmin!
  Right:  [16, 17, 18]  ← Has Kmin+1! Can spare!

  Algorithm:
  1. Take SMALLEST from RIGHT sibling (16!)
  2. Move 16 UP to parent (replace 15!)
  3. Move 15 DOWN to END of our node!
  4. Delete 10 → reduced to Case 1!

  BEFORE:                    AFTER:
  [..., 15, ...]             [..., 16, ...]
  [10, X]  [16, 17, 18]     [X, 15]  [17, 18]
                             → Delete 10 easily!


  CASE 4: Both siblings have Kmin → MERGE!
  ─────────────────────────────────────────────────
  Neither sibling can spare keys!

  Algorithm:
  1. Bring parent key DOWN!
  2. MERGE with sibling into one node!
  3. Delete target from merged node!
  4. If parent now violates → recurse UP!

  BEFORE:                    AFTER MERGE:
  [..., 5, ...]              [...]
  [1, 2]  [12, 15]          [1, 2, 5, 15]
                             ← Merged! Kmax+1 temporarily!
                             → Delete 12 from merged!
                             [1, 2, 5, 15] → delete 12
                             → [1, 2, 5, 15] valid!

  "When you delete a leaf, you may then have to
   recursively walk back up until we find where
   a violation has happened." — Prime
```

---

## §7. Internal Node Deletion — "Same 3 Cases!"

> Prime: _"If you remember our original BST deletion rules, there's only three cases. Guess what? Exact same rule."_

```
INTERNAL NODE DELETION:
═══════════════════════════════════════════════════════════════

  CASE 1: In-Order PREDECESSOR (left subtree largest!)
  ─────────────────────────────────────────────────────
  Có Kmin+1 keys ở left subtree của key cần xoá!

  Delete 16 from internal node:
  [... 15 | 16 | ...]
           ↓
  Swap 16 với in-order predecessor (15 = largest in left!)
  → Now delete 16 from LEAF → easy!

  "We are gonna go to our smaller side, largest element,
   and swippity swap it out." — Prime 😂


  CASE 2: In-Order SUCCESSOR (right subtree smallest!)
  ─────────────────────────────────────────────────────
  Có Kmin+1 keys ở right subtree!

  Delete 15 from internal node:
  [... 15 | ...]
           ↓
  Swap 15 với in-order successor (17 = smallest in right!)
  → Now delete 15 from LEAF → easy!


  CASE 3: Both subtrees have Kmin → MERGE!
  ─────────────────────────────────────────────────────
  Merge left + right subtrees!
  Then delete target from merged node!

  "Everything else is the same thing. You just keep on
   merging, you shrink down, you grow up." — Prime

  ⚠️ DEEP INTERNAL NODES:
  "What happens if you're deep in the internal tree?
   You can't just grab your predecessor and successor
   and merge them, they could be two completely separate
   subtrees. Really, you should swap it out with one,
   then run the leaf algorithm." — Prime
```

---

## §8. Tự Code: B-Tree from Scratch

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 1: B-TREE NODE
// ═══════════════════════════════════════════════════════════

class BTreeNode {
  constructor(isLeaf = true) {
    this.keys = []; // Sorted keys!
    this.children = []; // Children nodes!
    this.isLeaf = isLeaf;
  }
}

class BTree {
  constructor(order = 5) {
    this.order = order;
    this.root = new BTreeNode(true);

    // Calculate min/max!
    this.keyMax = order - 1;
    this.keyMin = Math.ceil(order / 2) - 1;
    this.childMax = order;
    this.childMin = Math.ceil(order / 2);
  }

  // ═══ SEARCH — O(log n) ═══
  search(key, node = this.root) {
    let i = 0;
    // Find position in keys array!
    while (i < node.keys.length && key > node.keys[i]) {
      i++;
    }

    // Found it!
    if (i < node.keys.length && key === node.keys[i]) {
      return { node, index: i };
    }

    // Leaf and not found!
    if (node.isLeaf) return null;

    // Go to appropriate child!
    return this.search(key, node.children[i]);
  }

  // ═══ INSERT — O(log n) ═══
  insert(key) {
    const root = this.root;

    // Root is full → split first!
    if (root.keys.length === this.keyMax) {
      const newRoot = new BTreeNode(false);
      newRoot.children.push(root);
      this._splitChild(newRoot, 0);
      this.root = newRoot;
    }

    this._insertNonFull(this.root, key);
  }

  _insertNonFull(node, key) {
    let i = node.keys.length - 1;

    if (node.isLeaf) {
      // Insert into sorted position in leaf!
      node.keys.push(null); // Make room!
      while (i >= 0 && key < node.keys[i]) {
        node.keys[i + 1] = node.keys[i];
        i--;
      }
      node.keys[i + 1] = key;
    } else {
      // Find which child to go to!
      while (i >= 0 && key < node.keys[i]) i--;
      i++;

      // If child is full, split first!
      if (node.children[i].keys.length === this.keyMax) {
        this._splitChild(node, i);
        // After split, check which side to go!
        if (key > node.keys[i]) i++;
      }

      this._insertNonFull(node.children[i], key);
    }
  }

  // ═══ SPLIT CHILD — THE CORE OF B-TREE! ═══
  _splitChild(parent, childIndex) {
    const fullChild = parent.children[childIndex];
    const midIndex = Math.floor(this.keyMax / 2);
    const midKey = fullChild.keys[midIndex];

    // Create new right node!
    const newNode = new BTreeNode(fullChild.isLeaf);

    // Move right half of keys to new node!
    newNode.keys = fullChild.keys.splice(midIndex + 1);
    fullChild.keys.splice(midIndex); // Remove median too!

    // Move right half of children if not leaf!
    if (!fullChild.isLeaf) {
      newNode.children = fullChild.children.splice(midIndex + 1);
    }

    // PROMOTE median key to parent!
    parent.keys.splice(childIndex, 0, midKey);
    parent.children.splice(childIndex + 1, 0, newNode);
  }
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 2: B-TREE DELETION
// ═══════════════════════════════════════════════════════════

// Add to BTree class:

// delete(key) {
//   this._delete(this.root, key);
//   // If root has no keys, shrink tree!
//   if (this.root.keys.length === 0 && !this.root.isLeaf) {
//     this.root = this.root.children[0];
//   }
// }

function bTreeDelete(tree, node, key) {
  const idx = findKeyIndex(node, key);

  if (idx < node.keys.length && node.keys[idx] === key) {
    // Key found in this node!
    if (node.isLeaf) {
      // LEAF DELETE — Case 1: Just remove!
      node.keys.splice(idx, 1);
    } else {
      // INTERNAL DELETE — Cases 2/3!
      deleteInternalKey(tree, node, idx);
    }
  } else {
    // Key not in this node, go to child!
    if (node.isLeaf) return; // Not found!

    // Ensure child has enough keys before descending!
    const child = node.children[idx];
    if (child.keys.length <= tree.keyMin) {
      ensureMinKeys(tree, node, idx);
    }

    bTreeDelete(tree, node.children[idx], key);
  }
}

function findKeyIndex(node, key) {
  let i = 0;
  while (i < node.keys.length && key > node.keys[i]) i++;
  return i;
}

function deleteInternalKey(tree, node, idx) {
  const key = node.keys[idx];

  // Case: Left child has enough keys!
  if (node.children[idx].keys.length > tree.keyMin) {
    // In-order predecessor = largest in left subtree!
    const pred = getMax(node.children[idx]);
    node.keys[idx] = pred;
    bTreeDelete(tree, node.children[idx], pred);
  }
  // Case: Right child has enough keys!
  else if (node.children[idx + 1].keys.length > tree.keyMin) {
    // In-order successor = smallest in right subtree!
    const succ = getMin(node.children[idx + 1]);
    node.keys[idx] = succ;
    bTreeDelete(tree, node.children[idx + 1], succ);
  }
  // Case: Both children at minimum → Merge!
  else {
    mergeChildren(node, idx);
    bTreeDelete(tree, node.children[idx], key);
  }
}

function getMax(node) {
  while (!node.isLeaf) node = node.children[node.children.length - 1];
  return node.keys[node.keys.length - 1];
}

function getMin(node) {
  while (!node.isLeaf) node = node.children[0];
  return node.keys[0];
}

function mergeChildren(node, idx) {
  const left = node.children[idx];
  const right = node.children[idx + 1];

  // Bring parent key down!
  left.keys.push(node.keys[idx]);
  // Add all right keys!
  left.keys = left.keys.concat(right.keys);
  // Add all right children!
  left.children = left.children.concat(right.children);

  // Remove parent key and right child pointer!
  node.keys.splice(idx, 1);
  node.children.splice(idx + 1, 1);
}

function ensureMinKeys(tree, parent, childIdx) {
  // Try borrow from left sibling!
  if (childIdx > 0 && parent.children[childIdx - 1].keys.length > tree.keyMin) {
    borrowFromLeft(parent, childIdx);
  }
  // Try borrow from right sibling!
  else if (
    childIdx < parent.children.length - 1 &&
    parent.children[childIdx + 1].keys.length > tree.keyMin
  ) {
    borrowFromRight(parent, childIdx);
  }
  // Merge with a sibling!
  else {
    if (childIdx > 0) {
      mergeChildren(parent, childIdx - 1);
    } else {
      mergeChildren(parent, childIdx);
    }
  }
}

function borrowFromLeft(parent, idx) {
  const child = parent.children[idx];
  const leftSibling = parent.children[idx - 1];

  // Parent key comes down to child front!
  child.keys.unshift(parent.keys[idx - 1]);
  // Left sibling's largest key goes up to parent!
  parent.keys[idx - 1] = leftSibling.keys.pop();

  // Move child pointer if not leaf!
  if (!leftSibling.isLeaf) {
    child.children.unshift(leftSibling.children.pop());
  }
}

function borrowFromRight(parent, idx) {
  const child = parent.children[idx];
  const rightSibling = parent.children[idx + 1];

  // Parent key comes down to child end!
  child.keys.push(parent.keys[idx]);
  // Right sibling's smallest key goes up to parent!
  parent.keys[idx] = rightSibling.keys.shift();

  // Move child pointer if not leaf!
  if (!rightSibling.isLeaf) {
    child.children.push(rightSibling.children.shift());
  }
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 3: DEMO
// ═══════════════════════════════════════════════════════════

const btree = new BTree(5);
[10, 20, 30, 40, 50, 69, 70, 71, 5, 3, 1].forEach((v) => btree.insert(v));

// Search:
console.log(btree.search(69)); // { node: ..., index: ... }
console.log(btree.search(99)); // null

// Print tree structure:
function printBTree(node, indent = "") {
  if (!node) return;
  console.log(indent + "[" + node.keys.join(", ") + "]");
  node.children.forEach((child) => printBTree(child, indent + "  "));
}

printBTree(btree.root);

// B-Tree complexity:
// Search: O(log n) — height of tree!
// Insert: O(log n) — find + potential splits up!
// Delete: O(log n) — find + potential merges/borrows up!
// Space per node: O(m) — m = order!
```

---

## §9. Deep Dive: B-Tree trong Database & File Systems

```
B-TREE APPLICATIONS:
═══════════════════════════════════════════════════════════════

  1. DATABASE INDEXING:
  → MySQL InnoDB dùng B+ Tree cho index!
  → PostgreSQL dùng B-Tree cho default index!
  → Mỗi node = 1 disk page (4KB - 16KB!)
  → "Used to be for disk cuz you had to look up stuff.
     Minimal disk reading." — Prime

  2. FILE SYSTEMS:
  → NTFS (Windows), HFS+ (macOS), ext4 (Linux)!
  → Directory entries stored in B-Tree!
  → Fast lookup even with millions of files!

  3. B+ TREE (variant!):
  → All data in LEAF nodes only!
  → Internal nodes chỉ chứa keys cho navigation!
  → Leaves linked together → fast range queries!
  → "There are things with B+ trees in which there
     are duplicates." — Prime

  TẠI SAO B-TREE TỐI ƯU CHO DISK I/O:

  Binary BST (height = log₂ n):
  → n = 1,000,000 → height ≈ 20
  → 20 disk reads! 💀

  B-Tree order 1000 (height = log₁₀₀₀ n):
  → n = 1,000,000 → height ≈ 2
  → 2 disk reads! ✅ (10x fewer!)

  → Wider tree = shorter tree = fewer disk reads!


  PRIME'S TDD ADVICE:
  "This is the only time in the universe that I would
   ever suggest something like TDD because you know
   the input and you know the output. I would never
   suggest this professionally. Don't let anyone know
   I'm suggesting this." — Prime 😂

  "Also, never take advice from anyone that writes
   exclusively on a whiteboard." — Prime 😂
```

---

## Checklist

```
[ ] M-way tree: multiple keys per node, x keys → x+1 children!
[ ] M-way has SAME degenerate problem as BST!
[ ] B-tree: order = max children, keys = order-1!
[ ] Key Min = ⌈order/2⌉ - 1, Child Min = ⌈order/2⌉!
[ ] Root can break minimum rule! (1 key OK!)
[ ] "Only tree that grows UPWARDS!" — Prime
[ ] Insertion: Split when full → promote median → grow UP!
[ ] Order 4 = "2-3-4 tree" (possible 2, 3, or 4 children!)
[ ] Leaf Delete Case 1: Kmin+1 keys → just remove!
[ ] Leaf Delete Case 2: Borrow from LEFT sibling!
[ ] Leaf Delete Case 3: Borrow from RIGHT sibling!
[ ] Leaf Delete Case 4: Both siblings Kmin → MERGE!
[ ] Internal Delete: swap with predecessor/successor → leaf delete!
[ ] Merge may cause violation at parent → recurse UP!
[ ] "TDD for B-trees — the only time I'd suggest it!" — Prime
TIẾP THEO → Phần 5: Graphs Fundamentals!
```
