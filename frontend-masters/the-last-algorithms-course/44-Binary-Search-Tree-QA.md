# The Last Algorithms Course You'll Need — Phần 44: Binary Search Tree Q&A — "Insertion Unbalances, AVL vs Red-Black, In-Order = Sorted!"

> 📅 2026-03-09 · ⏱ 10 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: BST Q&A — "Insertion unbalances tree, AVL vs Red-Black rotations, deletion strategy = different tree shapes, in-order traversal = sorted array!"
> Độ khó: ⭐️⭐️⭐️ | Q&A — balancing, rotation algorithms, strong vs weak ordering, in-order property!

---

## Mục Lục

| #   | Phần                                                  |
| --- | ----------------------------------------------------- |
| 1   | Q: "After Insertion, Still Balanced?" — "No!"         |
| 2   | AVL vs Red-Black — "Rotations!"                       |
| 3   | Q: "Different Delete Strategy = Different Tree?"      |
| 4   | Q: "Only Way to Make a Tree?" — "Weak Ordering Next!" |
| 5   | In-Order Traversal = Sorted Array!                    |

---

## §1. Q: "After Insertion, Still Balanced?" — "No!"

> Student: _"After insertion, will it still be balanced?"_
> Prime: _"No! There's no guarantee things will be balanced after insertion. Insertion INHERENTLY unbalances a tree. That's where rotation algorithms come into play."_

---

## §2. AVL vs Red-Black — "Rotations!"

> Prime: _"Red-Black: you can't have two reds touching each other. AVL: defines four rotation cases and does it recursively back up the tree."_

|           | AVL                        | Red-Black               |
| --------- | -------------------------- | ----------------------- |
| Balance   | Almost perfectly balanced! | Less strict!            |
| Rotations | More rotations on insert!  | Fewer rotations!        |
| Find      | Faster (shorter tree!)     | Slightly slower!        |
| Insert    | Slower (more rotations!)   | Faster!                 |
| Best for  | Find-heavy workloads!      | Insert-heavy workloads! |

> Prime: _"If you find a lot and insert rarely → AVL. If you insert a lot and find rarely → Red-Black. As always, it depends."_

### AVL rotations!

```
AVL — 4 ROTATION CASES:
═══════════════════════════════════════════════════════════════

  Case: Left-Left        →  Right rotation!
  Case: Right-Right      →  Left rotation!
  Case: Left-Right       →  Left then Right rotation!
  Case: Right-Left       →  Right then Left rotation!

  "Insert → walk back up the tree → if parent and child
   both on left → rotate right! Very impressive algorithm,
   almost always perfectly balanced." — Prime
```

---

## §3. Q: "Different Delete Strategy = Different Tree?"

> Student: _"So choosing a different strategy can end up with a different tree?"_
> Prime: _"Yeah, exactly!"_

```
SAME DELETION, TWO STRATEGIES:
═══════════════════════════════════════════════════════════════

  Delete 51 from:
          (51)
         /    \
       (25)   (100)
       / \
     (7) (37)

  Strategy A (largest on small):    Strategy B (smallest on large):
          (37)                              (100)
         /    \                             /
       (25)   (100)                       (25)
       /                                  / \
     (7)                                (7) (37)

  "Both preserve BST property!
   Just lead to different shapes!" — Prime
```

---

## §4. Q: "Only Way to Make a Tree?" — "Weak Ordering Next!"

> Student: _"Is larger-than / less-than the only way to make a tree?"_
> Prime: _"No! We're doing a WEAKLY ordered tree next — slightly different. But for BST, there's only one configuration — strong ordering."_

- **Strong ordering** (BST): left < parent ≤ right, in-order = sorted!
- **Weak ordering** (Heap): parent ≤ all children, NOT sorted left-to-right!

---

## §5. In-Order Traversal = Sorted Array!

> Prime: _"Check this out — let's print the BST in order."_

```
IN-ORDER = SORTED:
═══════════════════════════════════════════════════════════════

  BST:
          (51)
         /    \
       (15)   (100)
       / \
     (4) (25)
         / \
       (7) (37)

  In-order: go left → print → go right
  Result: 4, 7, 15, 25, 37, 51, 100

  "It prints it out IN ORDER!
   There's a very STRICT ordering to this tree." — Prime
```

---

## Checklist

```
[ ] Insertion inherently unbalances tree!
[ ] AVL: 4 rotation cases, almost perfect balance!
[ ] Red-Black: fewer rotations, named after 1970s printer colors!
[ ] Find-heavy → AVL. Insert-heavy → Red-Black!
[ ] Different delete strategies → different tree shapes!
[ ] Both strategies preserve BST property!
[ ] In-order traversal of BST = sorted array!
[ ] Strong ordering (BST) vs weak ordering (Heap)!
TIẾP THEO → Phần 45: Heap — Weak Ordering!
```
