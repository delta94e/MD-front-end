# The Last Algorithms Course You'll Need — Phần 39: Search Practice — "Compare Two Trees, BFS Fails, DFS Preserves Shape!"

> 📅 2026-03-09 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Search Practice — "Compare two binary trees for shape + value equality. BFS fails on structure! DFS preserves shape!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Interview — classic problem, why BFS fails, DFS preserves structure, asked 40 times!

---

## Mục Lục

| #   | Phần                                                    |
| --- | ------------------------------------------------------- |
| 1   | The Problem — "Are Two Trees Equal in Shape AND Value?" |
| 2   | BFS Attempt — "Values Match, But Structure Doesn't!"    |
| 3   | DFS Solution — "Depth First Preserves Shape!"           |
| 4   | DFS Walkthrough — "Null ≠ 0x45, BOOM!"                  |
| 5   | Key Insight — "DFS Preserves Shape, BFS Does Not!"      |
| 6   | Tự Implement: Compare Two Trees                         |

---

## §1. The Problem — "Are Two Trees Equal in Shape AND Value?"

> Prime: _"I got this in an interview and I've asked this question probably 40 times. It shows if someone is familiar with data structures."_

```
ARE THESE TWO TREES EQUAL?
═══════════════════════════════════════════════════════════════

  Tree A:        Tree B:
    (5)            (5)
   /   \          /   \
  (3)  (45)     (3)  (45)

  Same values: ✅
  Same shape:  ✅
  EQUAL! ✅
```

---

## §2. BFS Attempt — "Values Match, But Structure Doesn't!"

```
BFS FAILS ON STRUCTURE:
═══════════════════════════════════════════════════════════════

  Tree A:           Tree B:
    (5)                (5)
   /   \              /   \
  (3)  (45)         (3)  (45)
                    /
                  (45) has child!

  BFS Tree A: 5, 3, 45     ← level by level!
  BFS Tree B: 5, 3, 45, 45 ← different length!

  But what about this?

  Tree A:           Tree B:
      (5)               (5)
     /                     \
   (3)                    (3)
      \                  /
     (45)             (45)

  BFS Tree A: 5, 3, 45
  BFS Tree B: 5, 3, 45     ← SAME values!

  But structurally DIFFERENT! 💀
  BFS doesn't preserve SHAPE!
```

---

## §3. DFS Solution — "Depth First Preserves Shape!"

> Prime: _"Remember what I said about depth first — it PRESERVES THE SHAPE of the traversal."_

```
DFS PRESERVES SHAPE:
═══════════════════════════════════════════════════════════════

  Tree A:           Tree B:
      (5)               (5)
     /                     \
   (3)                    (3)
      \                  /
     (45)             (45)

  DFS Tree A:
  Visit 5 → go left → visit 3 → go left → NULL
  → go right → visit 45 → go left → NULL
  → go right → NULL → back up → go right → NULL

  DFS Tree B:
  Visit 5 → go left → NULL ❌ (Tree A has 3 here!)
  DIFFERENT! Shape mismatch detected! ✅
```

---

## §4. DFS Walkthrough — "Both Trees Walk Together!"

### Equal trees!

```
  Tree A: (5)        Tree B: (5)
         /   \              /   \
       (3)  (45)          (3)  (45)

  DFS both simultaneously:
  A=5, B=5 → equal! Go left together!
  A=3, B=3 → equal! Go left together!
  A=null, B=null → both null! Go right!
  A=null, B=null → both null! Back up!
  Go right from 5!
  A=45, B=45 → equal! Go left!
  A=null, B=null! Go right!
  A=null, B=null! Done!
  EQUAL! ✅
```

### Structurally different!

```
  Tree A: (5)        Tree B: (5)
         /                     \
       (3)                    (3)

  DFS both simultaneously:
  A=5, B=5 → equal! Go left together!
  A=3, B=null → MISMATCH! 💀
  NOT EQUAL! ❌
```

---

## §5. Key Insight — "DFS Preserves Shape, BFS Does Not!"

|                  | DFS                      | BFS                   |
| ---------------- | ------------------------ | --------------------- |
| Preserves shape? | ✅ YES!                  | ❌ NO!                |
| Compare trees?   | ✅ Works!                | ❌ Fails!             |
| Why?             | Follows branches exactly | Mixes levels together |

> Prime: _"DFS preserves shape whereas BFS does NOT. That is an extremely important distinction."_

---

## §6. Tự Implement: Compare Two Trees

```javascript
// ═══ Compare Two Binary Trees ═══

function compare(a, b) {
  // Both null → structurally equal here!
  if (a === null && b === null) return true;

  // One null, other not → shape mismatch!
  if (a === null || b === null) return false;

  // Values different → not equal!
  if (a.value !== b.value) return false;

  // Recurse both sides simultaneously!
  return compare(a.left, b.left) && compare(a.right, b.right);
}

// Tree A
const treeA = {
  value: 5,
  left: { value: 3, left: null, right: null },
  right: { value: 45, left: null, right: null },
};

// Tree B — same!
const treeB = {
  value: 5,
  left: { value: 3, left: null, right: null },
  right: { value: 45, left: null, right: null },
};

// Tree C — different structure!
const treeC = {
  value: 5,
  left: null,
  right: {
    value: 3,
    left: { value: 45, left: null, right: null },
    right: null,
  },
};

// Tree D — different value!
const treeD = {
  value: 5,
  left: { value: 3, left: null, right: null },
  right: { value: 99, left: null, right: null },
};

console.log("═══ COMPARE TWO TREES ═══\n");
console.log("A vs B (same):", compare(treeA, treeB)); // true
console.log("A vs C (diff structure):", compare(treeA, treeC)); // false
console.log("A vs D (diff value):", compare(treeA, treeD)); // false
console.log("A vs null:", compare(treeA, null)); // false
console.log("null vs null:", compare(null, null)); // true

console.log("\n═══ BASE CASES ═══");
console.log("1. Both null → true (same shape here!)");
console.log("2. One null → false (shape mismatch!)");
console.log("3. Values differ → false!");
console.log("4. Recurse left AND right!");

console.log("\n✅ DFS preserves shape — BFS does NOT!");
```

---

## Checklist

```
[ ] Problem: compare two trees for shape AND value!
[ ] BFS fails: doesn't preserve structure!
[ ] DFS works: follows exact branches!
[ ] Base cases: both null=true, one null=false, values differ=false!
[ ] Recurse: compare(a.left,b.left) && compare(a.right,b.right)!
[ ] "DFS preserves shape, BFS does not" — Prime
[ ] Walk both trees SIMULTANEOUSLY!
TIẾP THEO → Phần 40: Binary Search Tree (coming soon!)
```
