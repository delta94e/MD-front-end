# The Last Algorithms Course You'll Want (Part 2) — Phần 3: AVL Trees & Red-Black Trees — Balance Factor, 4 Rotations, Self-Balancing!

> 📅 2026-03-09 · ⏱ 45 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Balance Factor + AVL Complexity + Red-Black Trees — "My favorite data structure, 40 hours without recursion, RR LL LR RL rotations, Red-Black 75 rules!"
> Độ khó: ⭐⭐⭐⭐ | Advanced — Self-balancing trees!

---

## Mục Lục

| #   | Phần                                                                |
| --- | ------------------------------------------------------------------- |
| 1   | Tại Sao Cần Self-Balancing? — "Our Tree Sucks!"                     |
| 2   | AVL vs Red-Black — "Two Primary Ways to Fix This!"                  |
| 3   | Balance Factor — "Right Height Minus Left Height, Always!"          |
| 4   | RR Rotation (Left Rotation) — "Drop Down, Break Link, Create Link!" |
| 5   | LL Rotation (Right Rotation) — "Exact Same Thing, Other Direction!" |
| 6   | LR Rotation (Double) — "Small Then Big!"                            |
| 7   | RL Rotation (Double) — "Small Then Big, Other Side!"                |
| 8   | Rotations With Children — "Focus On the Rule!"                      |
| 9   | AVL Complexity — "Log n Everything!"                                |
| 10  | Red-Black Tree Overview — "75 Rules, 5 Actual Rules!"               |
| 11  | AVL vs Red-Black — "Search-Heavy vs Insert-Heavy!"                  |
| 12  | Tự Code: AVL Tree from Scratch (Insert, Delete, All 4 Rotations!)   |
| 13  | Deep Dive: Practice Mindset — "Know They Exist!"                    |

---

## §1. Tại Sao Cần Self-Balancing? — "Our Tree Sucks!"

Từ bài trước, ta đã thấy vấn đề nghiêm trọng của BST:

```
VẤN ĐỀ DEGENERATE TREE:
═══════════════════════════════════════════════════════════════

  Insert sorted data: 10, 20, 30, 40

    10              → Search = O(n)! 💀
      \             → Insert = O(n)!
      20            → Delete = O(n)!
        \           → "We just built a linked list!" — Prime
        30
          \
          40

  GIẢI PHÁP: Self-balancing tree!
  → Tự động giữ height = O(log n)!
  → Search, Insert, Delete = O(log n)! ✅
```

---

## §2. AVL vs Red-Black — "Two Primary Ways to Fix This!"

> Prime: _"Number one is an AVL tree. It is actually the oldest tree or tree balancing algorithm out there."_

```
2 GIẢI PHÁP CHÍNH:
═══════════════════════════════════════════════════════════════

  1. AVL TREE (1962):
  ┌──────────────────────────────────────────────────────────┐
  │ Tên: Adelson-Velsky and Landis                          │
  │ "I don't know what A, V, or L stands for.               │
  │  Let's pretend it's three people's names." — Prime 😂    │
  │                                                          │
  │ Oldest self-balancing BST!                               │
  │ "My favorite data structure to ever implement." — Prime  │
  │ "Spent 40 HOURS trying to do it without recursion.       │
  │  With recursion it's very simple." — Prime               │
  └──────────────────────────────────────────────────────────┘

  2. RED-BLACK TREE (1978):
  ┌──────────────────────────────────────────────────────────┐
  │ Origin story 1: Xerox printer only printed well          │
  │   in RED and BLACK → hence the name!                     │
  │ Origin story 2: They only had RED and BLACK markers!     │
  │                                                          │
  │ "I love the fact that there are two competing stories.   │
  │  Either the printer company had a printer that only      │
  │  printed red and black well, or they only had red and    │
  │  black markers." — Prime 😂                              │
  └──────────────────────────────────────────────────────────┘
```

---

## §3. Balance Factor — "Right Height Minus Left Height, Always!"

> Prime: _"AVL works in such a way that it rotates the tree every time there's a violation of the ordering. It keeps something called a balance factor. And a balance factor must be between -1, 0, or 1."_

```
BALANCE FACTOR:
═══════════════════════════════════════════════════════════════

  Balance Factor = Right Height - Left Height

  "It's totally right minus left. Never go left minus right,
   I'll show you why." — Prime

  TẠI SAO right - left?
  → Số ÂM = nghiêng TRÁI (lesser side!)
  → Số DƯƠNG = nghiêng PHẢI (greater side!)
  → "It matches the feel of the binary tree!" — Prime

  Allowed values: -1, 0, or +1
  → -1 = left leaning (1 extra level trái!)
  → 0 = perfectly balanced!
  → +1 = right leaning (1 extra level phải!)
  → |BF| > 1 = VIOLATION! → Need rotation!


VÍ DỤ TÍNH BALANCE FACTOR:
═══════════════════════════════════════════════════════════════

  Tree:
       A (BF=-1)
      /
     B (BF=-1)
    /
   C (BF=0)

  C: rightH=0, leftH=0 → BF = 0-0 = 0 ✅
  B: rightH=0, leftH=1 → BF = 0-1 = -1 ✅ (left-leaning!)
  A: rightH=0, leftH=2 → BF = 0-2 = -2 ❌ VIOLATION!

  → |BF| = 2 > 1 → Cần ROTATION!


THÊM NODES VÀ TÍNH LẠI:
═══════════════════════════════════════════════════════════════

  Insert thêm vào RIGHT side:

       A (BF=0)
      / \
     B   D           ← Thêm D → A balanced!
    /     (BF=0)
   C (BF=0)
   (BF=0)

  B: rightH=0, leftH=1 → BF = -1 ✅
  A: rightH=1, leftH=2 → BF = -1 ✅ (still within [-1, +1]!)

  → Thêm D không gây violation cho A!
```

---

## §4. RR Rotation (Left Rotation) — "Drop Down, Break Link, Create Link!"

> Prime: _"People call it an RR rotation. I don't really like this term because even though it is right leaning, right leaning, you do a left rotation."_

```
RR ROTATION — RIGHT-RIGHT LEAN → LEFT ROTATE:
═══════════════════════════════════════════════════════════════

  Insert 42, then 69, then 420:

  TRƯỚC:                    SAU ROTATION:
    42 (BF=+2) ❌              69 (BF=0) ✅
      \                      /    \
      69 (BF=+1)           42     420
        \                (BF=0)  (BF=0)
        420 (BF=0)

  Steps:
  1. 42 violates! → Right-right lean!
  2. "Drop down the 42" — Prime
  3. "Break link, create link" — Prime
  4. 69 becomes new root of subtree!

  BF after: 0, 0, 0 → "We've created a balanced tree!" — Prime

  Algorithm:
  → newRoot = node.right (69!)
  → node.right = newRoot.left (null!)
  → newRoot.left = node (42!)
  → return newRoot!
```

---

## §5. LL Rotation (Right Rotation) — "Exact Same Thing, Other Direction!"

```
LL ROTATION — LEFT-LEFT LEAN → RIGHT ROTATE:
═══════════════════════════════════════════════════════════════

  Insert 420, then 69, then 42:

  TRƯỚC:                    SAU ROTATION:
      420 (BF=-2) ❌          69 (BF=0) ✅
      /                     /    \
    69 (BF=-1)             42    420
    /                   (BF=0)  (BF=0)
   42 (BF=0)

  "Exact same thing but we need to do it
   to the right." — Prime

  Algorithm:
  → newRoot = node.left (69!)
  → node.left = newRoot.right (null!)
  → newRoot.right = node (420!)
  → return newRoot!
```

---

## §6. LR Rotation (Double) — "Small Then Big!"

> Prime: _"These are called double rotation cases, the double entendre of AVL trees."_

```
LR ROTATION — LEFT-RIGHT LEAN → DOUBLE ROTATE:
═══════════════════════════════════════════════════════════════

  Insert 420, then 42, then 69:

  TRƯỚC:
      420 (BF=-2) ❌
      /
    42 (BF=+1)     ← Left-lean root, Right-lean child!
      \
      69 (BF=0)

  Step 1: SMALL rotation (Left rotate on 42!):

      420 (BF=-2)
      /
    69 (BF=-1)      ← Now it's LL pattern!
    /
   42 (BF=0)

  Step 2: BIG rotation (Right rotate on 420!):

        69 (BF=0) ✅
       /    \
      42    420
   (BF=0)  (BF=0)

  "Start down here and do a rotation this way.
   Then finish it off with the classic double L rotation.
   We already know the double L rotation." — Prime
```

---

## §7. RL Rotation (Double) — "Small Then Big, Other Side!"

```
RL ROTATION — RIGHT-LEFT LEAN → DOUBLE ROTATE:
═══════════════════════════════════════════════════════════════

  Insert 42, then 420, then 69:

  TRƯỚC:
    42 (BF=+2) ❌
      \
     420 (BF=-1)    ← Right-lean root, Left-lean child!
      /
    69 (BF=0)

  Step 1: SMALL rotation (Right rotate on 420!):

    42 (BF=+2)
      \
      69 (BF=+1)    ← Now it's RR pattern!
        \
        420 (BF=0)

  Step 2: BIG rotation (Left rotate on 42!):

        69 (BF=0) ✅
       /    \
      42    420
   (BF=0)  (BF=0)
```

### Tóm Tắt 4 Rotations:

```
4 ROTATIONS — TÓM TẮT:
═══════════════════════════════════════════════════════════════

  BF    │ Child BF │ Pattern │ Action
  ──────┼──────────┼─────────┼──────────────────────
  +2    │ +1       │ RR      │ Left rotate!
  -2    │ -1       │ LL      │ Right rotate!
  -2    │ +1       │ LR      │ Left child → Right child rotate!
  +2    │ -1       │ RL      │ Right child → Left child rotate!

  Double rotations:
  1. Small rotation → tạo RR hoặc LL pattern!
  2. Big rotation → fix giống RR hoặc LL!
```

---

## §8. Rotations With Children — "Focus On the Rule!"

> Prime: _"Wouldn't that make the rotations really hard? Wrong, it's actually not all that hard. Just always think of the rule."_

```
LL ROTATION WITH CHILDREN:
═══════════════════════════════════════════════════════════════

  TRƯỚC:
          A
        /
       B
      / \
     C   BR     ← BR = "Brazil mentioned!" — Prime 😂
    / \
  CL   CR

  SAU LL (right rotate on A):

          B
        /   \
       C     A
      / \   / \
    CL  CR BR  AR

  TẠI SAO ĐÚNG?

  "What can we say about BR in relation to A?
   It's less than." — Prime

  → BR < B (nó ở bên phải B, nhưng trong subtree trái A!)
  → BR < A (nó ở subtree trái của A!)
  → Khi A xuống bên phải B, BR trở thành left child của A!
  → BR < A → valid left child! ✅
  → AR > A → valid right child! ✅
  → C < B → valid left child! ✅

  "It's really not that hard as long as you focus
   on the rule. This is the most important part.
   If it's not in your head, everything feels hard." — Prime


LR ROTATION WITH CHILDREN:
═══════════════════════════════════════════════════════════════

  TRƯỚC:
       A
      /
     B
      \
       C
      / \
    CL   CR

  Step 1: Left rotate on B:
  → B drops down, C comes up!
  → CR: "strictly greater than C, strictly less than B"
  → CR moves to B's left! (vì CR < B!)
  → CL stays with C! (CL < C < A → valid!)

       A
      /
     C
    / \
   CL  B
      / \
    CR   BR

  Step 2: Right rotate on A (standard LL!):
  → A drops down, CL goes to A's left!
  → CL < C but > A? No, CL < C < A → CL < A
  → CL moves to A's left! ✅

       C
      / \
    CL    A
         / \
        CR   (rest)
```

---

## §9. AVL Complexity — "Log n Everything!"

> Prime: _"Our height will be log(n) +1, potentially. And since this is computer science, we don't deal with constants. Get the constants out of there!"_

```
AVL TREE COMPLEXITY:
═══════════════════════════════════════════════════════════════

  Height: log(n) + 1 → drop constant → O(log n)!

  SEARCH: O(log n)
  → Go down tree = O(log n)! ← Always balanced!

  INSERT: O(log n)
  → Go down tree to find spot = O(log n)
  → Walk back UP checking rotations = O(log n)
  → Total: 2 × log n → drop constant → O(log n)!

  DELETE: O(log n)
  → Find item = O(log n)
  → Do deletion (3 cases!) = O(1)
  → Walk back UP doing rotations = O(log n)
  → Total: 2 × log n → O(log n)!

  ROTATION: O(1)
  → Each rotation = constant time!
  → "Rotations are done in constant time,
     but you still have to do a bunch of stuff." — Prime

  "2log n — if we're fun with math, we can say log n²,
   but don't do that, that's just ignorant.
   It's a constant. You drop it." — Prime 😂
```

### AVL Use Cases:

```
WHEN TO USE AVL:
═══════════════════════════════════════════════════════════════

  ✅ USE AVL when:
  → SEARCH-HEAVY workload!
  → "If you're search-heavy, you're getting the best
     possible time always." — Prime
  → Need STRICT balance (height diff ≤ 1!)
  → Need predictable worst-case!

  ❌ Consider Red-Black when:
  → INSERT-HEAVY workload!
  → "You may want to use a red black tree, which does
     not organize the tree nearly as tight as an AVL.
     But it will allow still log n search, insertion,
     and deletion." — Prime
```

---

## §10. Red-Black Tree Overview — "75 Rules, 5 Actual Rules!"

> Prime: _"I'm not gonna cover this one in detail, just because there's 75 rules to it."_ (nói đùa! Thực tế 5 rules!)

```
RED-BLACK TREE — 5 RULES:
═══════════════════════════════════════════════════════════════

  Rule 1: Root and NIL nodes are BLACK!
  → "Nil is important, they count the empty spot
     as a node itself." — Prime

  Rule 2: All nodes are either RED or BLACK!
  → "Kind of silly if you could have something else." — Prime

  Rule 3: No RED parent + RED child!
  → "You can't have that situation, but you can have
     black-black. You just cannot have red-red." — Prime

  Rule 4: Maintain BST property!
  → Still left < node < right!

  Rule 5: All paths have SAME number of BLACK children!
  → "Black height" must be equal on all paths!

  "When I was thinking about it, this seems like an
   incredibly difficult problem. But when you go through
   and actually do it, you calculate the black height
   at every level, it gets a little bit easier." — Prime


VÍ DỤ RED-BLACK TREE:
═══════════════════════════════════════════════════════════════

        [B:20]
       /      \
    [B:10]   [R:30]
    /    \    /    \
  [R:5] [∅] [B:25] [B:40]
  / \       /  \    /  \
[∅] [∅]   [∅] [∅] [R:35][R:45]

  B = Black, R = Red, ∅ = NIL (black!)

  Check rules:
  1. Root (20) = Black ✅
  2. All nodes red or black ✅
  3. No red-red parent-child ✅
     → R:30 has B:25 and B:40 children ✅
     → R:5 has NIL children (black) ✅
  4. BST order maintained ✅
  5. All paths same black height ✅
     → 20→10→5→∅: 3 black (20,10,∅)
     → 20→30→25→∅: 3 black (20,25,∅) Hmm...

  ⚠️ Counting can be tricky — practice required!
```

### Worst Case — Twice as High!

```
RED-BLACK WORST CASE:
═══════════════════════════════════════════════════════════════

  "You can get into a situation where the worst case
   is one side is TWICE as high as the other side.
   You have all black on one side and red-black,
   red-black, red-black on the other." — Prime

  Left path: B → B → B           (height 3, 3 black!)
  Right path: B → R → B → R → B  (height 5, 3 black!)

  → Same BLACK height = valid!
  → But actual height DOUBLED on one side!
  → Still O(log n) because 2h = 2 log n → drop constant!

  Search: O(2 log n) → O(log n)!
  Insert: O(log n)!
  Delete: O(log n)!
```

---

## §11. AVL vs Red-Black — So Sánh Chi Tiết

```
AVL vs RED-BLACK TREE:
═══════════════════════════════════════════════════════════════

  Feature         │ AVL Tree          │ Red-Black Tree
  ────────────────┼───────────────────┼──────────────────
  Balance         │ Strict! |BF|≤1   │ Looser! 2x height OK
  Search          │ O(log n) FASTER   │ O(log n) slower
  Insert          │ O(log n) SLOWER   │ O(log n) faster
  Delete          │ O(log n) SLOWER   │ O(log n) faster
  Rotations       │ More frequent     │ Less frequent
  Height          │ ~1.44 log n       │ ~2 log n
  Implementation  │ Simpler (Prime!)  │ Complex (75 rules!)
  Memory          │ +1 int/node (BF)  │ +1 bit/node (color)
  Real-world use  │ DB read-heavy     │ Java TreeMap, C++ map

  "AVL trees are fantastic and simple.
   People say red-black trees are easier to implement.
   I have yet to believe that." — Prime

  "If you're search-heavy, use AVL.
   If you're insertion-heavy, use red-black." — Prime
```

---

## §12. Tự Code: AVL Tree from Scratch

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 1: AVL NODE + HEIGHT MANAGEMENT
// ═══════════════════════════════════════════════════════════

class AVLNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.height = 1; // Leaf = height 1!
  }
}

function getHeight(node) {
  return node ? node.height : 0;
}

function updateHeight(node) {
  node.height = 1 + Math.max(getHeight(node.left), getHeight(node.right));
}

function getBalanceFactor(node) {
  // Right - Left! "Never go left minus right!" — Prime
  return getHeight(node.right) - getHeight(node.left);
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 2: 4 ROTATIONS
// ═══════════════════════════════════════════════════════════

// ═══ LEFT ROTATE (fix RR lean!) ═══
//
//     A              B
//      \           /   \
//       B    →    A     C
//        \
//         C
//
function leftRotate(node) {
  const newRoot = node.right; // B becomes root!
  const orphan = newRoot.left; // B's left child needs new home!

  newRoot.left = node; // A goes to B's left!
  node.right = orphan; // B's old left → A's right!

  updateHeight(node); // Update A first (lower!)
  updateHeight(newRoot); // Then B (higher!)

  return newRoot;
}

// ═══ RIGHT ROTATE (fix LL lean!) ═══
//
//         A          B
//        /         /   \
//       B    →    C     A
//      /
//     C
//
function rightRotate(node) {
  const newRoot = node.left; // B becomes root!
  const orphan = newRoot.right; // B's right child needs new home!

  newRoot.right = node; // A goes to B's right!
  node.left = orphan; // B's old right → A's left!

  updateHeight(node);
  updateHeight(newRoot);

  return newRoot;
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 3: REBALANCE — DETECT + FIX VIOLATIONS
// ═══════════════════════════════════════════════════════════

function rebalance(node) {
  updateHeight(node);
  const bf = getBalanceFactor(node);

  // RR: Right-heavy, right child right-heavy or balanced
  if (bf > 1 && getBalanceFactor(node.right) >= 0) {
    return leftRotate(node);
  }

  // LL: Left-heavy, left child left-heavy or balanced
  if (bf < -1 && getBalanceFactor(node.left) <= 0) {
    return rightRotate(node);
  }

  // RL: Right-heavy, BUT right child is LEFT-heavy!
  // → First right-rotate the right child, then left-rotate!
  if (bf > 1 && getBalanceFactor(node.right) < 0) {
    node.right = rightRotate(node.right); // Small rotation!
    return leftRotate(node); // Big rotation!
  }

  // LR: Left-heavy, BUT left child is RIGHT-heavy!
  // → First left-rotate the left child, then right-rotate!
  if (bf < -1 && getBalanceFactor(node.left) > 0) {
    node.left = leftRotate(node.left); // Small rotation!
    return rightRotate(node); // Big rotation!
  }

  return node; // No violation!
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 4: INSERT + DELETE + SEARCH
// ═══════════════════════════════════════════════════════════

class AVLTree {
  constructor() {
    this.root = null;
  }

  // ═══ INSERT — O(log n) ═══
  insert(value) {
    this.root = this._insert(this.root, value);
  }

  _insert(node, value) {
    if (!node) return new AVLNode(value);

    if (value < node.value) {
      node.left = this._insert(node.left, value);
    } else if (value > node.value) {
      node.right = this._insert(node.right, value);
    } else {
      return node; // Duplicate! Skip!
    }

    // Walk back UP → rebalance at every level!
    return rebalance(node);
  }

  // ═══ DELETE — O(log n) ═══
  delete(value) {
    this.root = this._delete(this.root, value);
  }

  _delete(node, value) {
    if (!node) return null;

    if (value < node.value) {
      node.left = this._delete(node.left, value);
    } else if (value > node.value) {
      node.right = this._delete(node.right, value);
    } else {
      // Found node to delete!

      // Case 1 & 2: 0 or 1 child
      if (!node.left) return node.right;
      if (!node.right) return node.left;

      // Case 3: 2 children → in-order predecessor!
      let predecessor = node.left;
      while (predecessor.right) {
        predecessor = predecessor.right;
      }
      node.value = predecessor.value;
      node.left = this._delete(node.left, predecessor.value);
    }

    // Walk back UP → rebalance!
    // "Deletion follows the same 3 cases.
    //  Wherever deletion happens, walk up looking
    //  for violations and perform rotations." — Prime
    return rebalance(node);
  }

  // ═══ SEARCH — O(log n) ═══
  search(value) {
    let current = this.root;
    let steps = 0;
    while (current) {
      steps++;
      if (value === current.value) return { found: true, steps };
      if (value < current.value) current = current.left;
      else current = current.right;
    }
    return { found: false, steps };
  }

  // ═══ IN-ORDER TRAVERSAL ═══
  inOrder(node = this.root, result = []) {
    if (!node) return result;
    this.inOrder(node.left, result);
    result.push(node.value);
    this.inOrder(node.right, result);
    return result;
  }

  // ═══ VERIFY BALANCE ═══
  isBalanced(node = this.root) {
    if (!node) return true;
    const bf = Math.abs(getBalanceFactor(node));
    return bf <= 1 && this.isBalanced(node.left) && this.isBalanced(node.right);
  }

  // ═══ PRINT TREE ═══
  print(node = this.root, prefix = "", isLeft = true) {
    if (!node) return;
    this.print(node.right, prefix + (isLeft ? "│   " : "    "), false);
    const bf = getBalanceFactor(node);
    const label = `${node.value} (BF=${bf > 0 ? "+" : ""}${bf})`;
    console.log(prefix + (isLeft ? "└── " : "┌── ") + label);
    this.print(node.left, prefix + (isLeft ? "    " : "│   "), true);
  }
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 5: DEMO — INSERT SORTED DATA
// ═══════════════════════════════════════════════════════════

const avl = new AVLTree();

// Insert sorted data (would destroy normal BST!)
[10, 20, 30, 40, 50, 60, 70].forEach((v) => avl.insert(v));

console.log("In-order:", avl.inOrder());
// [10, 20, 30, 40, 50, 60, 70] ← Sorted! ✅

console.log("Balanced:", avl.isBalanced());
// true! ← Even with sorted insert! ✅

avl.print();
// Balanced tree! No degenerate linked list!

console.log("Search 70:", avl.search(70));
// { found: true, steps: 3 } ← O(log 7) ≈ 3! ✅
// (Normal BST with sorted insert would be 7 steps!)

// Delete nodes
avl.delete(40);
console.log("After delete 40:", avl.inOrder());
console.log("Still balanced:", avl.isBalanced()); // true!
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 6: RED-BLACK TREE (Simplified — Color Rules Only!)
// ═══════════════════════════════════════════════════════════

// Red-Black tree implementation overview (simplified!)
// Full implementation requires 75+ lines of case handling!

const RED = "RED";
const BLACK = "BLACK";

class RBNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.parent = null; // RB needs parent pointer!
    this.color = RED; // "Always insert as RED!" — Prime
  }
}

// Validate Red-Black properties:
function validateRBTree(root) {
  // Rule 1: Root must be black!
  if (root && root.color !== BLACK) return false;

  // Rule 3: No red-red parent-child!
  function noRedRed(node) {
    if (!node) return true;
    if (node.color === RED) {
      if (node.left && node.left.color === RED) return false;
      if (node.right && node.right.color === RED) return false;
    }
    return noRedRed(node.left) && noRedRed(node.right);
  }

  // Rule 5: All paths same black height!
  function blackHeight(node) {
    if (!node) return 1; // NIL counts as black!
    const leftBH = blackHeight(node.left);
    const rightBH = blackHeight(node.right);
    if (leftBH === -1 || rightBH === -1) return -1;
    if (leftBH !== rightBH) return -1; // VIOLATION!
    return leftBH + (node.color === BLACK ? 1 : 0);
  }

  return noRedRed(root) && blackHeight(root) !== -1;
}
```

---

## §13. Deep Dive: Practice Mindset — "Know They Exist!"

> Prime: _"I always made this joke that I will hire somebody as long as they say the word priority queue, cuz I just want you to know that they exist."_

```
PRACTICE MINDSET:
═══════════════════════════════════════════════════════════════

  "Anytime you can make a concept go from something
   abstract in your head to practical in an editor,
   you're just plus one in your ability to solve
   larger and larger problems." — Prime

  HOW PRIME PRACTICES:
  → Few times a year: watch YouTube algorithm videos!
  → "They're just really fun to think about."
  → Read CLRS book (bought 3 times, lost 3 times!)
  → At work: "I deal a lot with trees and things.
     I constantly have to think about algorithms."

  FILE SYSTEMS:
  "A file system is a forest. It's a tree, but also
   more than a tree because of symlinks." — Prime

  "The more complete picture you have of what is
   available, the easier it is to solve problems.
   Even if you rarely use them, you know how to
   move everything around in your head." — Prime

  "Solve them, do them, enjoy them, experience them."
  — Prime 🎯
```

---

## Checklist

```
[ ] Balance Factor = Right Height - Left Height!
[ ] BF must be -1, 0, or +1. Otherwise → ROTATION!
[ ] RR lean (BF=+2, child BF≥0) → Left Rotate!
[ ] LL lean (BF=-2, child BF≤0) → Right Rotate!
[ ] LR lean (BF=-2, child BF>0) → Left child rotate, then right!
[ ] RL lean (BF=+2, child BF<0) → Right child rotate, then left!
[ ] Rotations with children: "Focus on the rule!" — Prime
[ ] AVL: insert/delete = O(log n), rotation = O(1)!
[ ] Red-Black: 5 rules (root=black, no red-red, same black height!)
[ ] Red-Black worst case: 2x height one side → still O(log n)!
[ ] AVL = search-heavy! Red-Black = insert-heavy!
[ ] "Know they exist" → priority queue, union-find, etc.!
TIẾP THEO → Phần 4: M-Way Trees & B-Trees!
```
