# The Last Algorithms Course You'll Need — Phần 34: Trees Overview — "File System, DOM, Binary, Root, Height, Leaf, Balanced!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Trees Overview — "Everything leads to trees! File system, DOM, AST = trees. Root, height, binary, leaf, balanced, branching factor!"
> Độ khó: ⭐️⭐️⭐️ | Theory — tree terminology, general vs binary trees, where trees appear in real life!

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | "All Things Lead to Trees!" — "File System, DOM, AST!"    |
| 2   | Node — "Value + Children (Not Next/Prev!)"                |
| 3   | Terminology — "Root, Height, Leaf, Balanced!"             |
| 4   | General Tree vs Binary Tree — "Multiple vs Two Children!" |
| 5   | Binary Search Tree — "Strong Ordering!"                   |
| 6   | Trees = "Just Linked Lists with More Branches!"           |

---

## §1. "All Things Lead to Trees!" — "File System, DOM, AST!"

> Prime: _"Eventually all things lead to trees. All data structures eventually become graphs. But I always end up using trees on projects — they're EVERYWHERE."_

### Where are trees?

```
TREES IN THE REAL WORLD:
═══════════════════════════════════════════════════════════════

  📁 FILE SYSTEM:
  /
  ├── home/
  │   ├── user/
  │   │   ├── documents/
  │   │   └── pictures/
  │   └── shared/
  └── etc/
      └── config/

  🌐 THE DOM:
  <html>
  ├── <head>
  │   └── <title>
  └── <body>
      ├── <div>
      │   ├── <div>
      │   └── <div>
      └── <div>
          └── <div>

  🌳 ABSTRACT SYNTAX TREE (AST):
  Babel transforms JS → different JS using AST!
  Check out astexplorer.net!
```

---

## §2. Node — "Value + Children (Not Next/Prev!)"

> Prime: _"A node in a tree is a lot like a linked list node. Instead of next or previous, you have an array of possible connections."_

```typescript
// General tree node: 0 to many children!
type TreeNode<T> = {
  value: T;
  children: TreeNode<T>[];
};

// Binary tree node: at most 2 children!
type BinaryNode<T> = {
  value: T;
  left?: BinaryNode<T>;
  right?: BinaryNode<T>;
};
```

---

## §3. Terminology — "Root, Height, Leaf, Balanced!"

```
TREE TERMINOLOGY:
═══════════════════════════════════════════════════════════════

           (7)   ← ROOT: top-most node!
          /   \
       (23)    (3)
       / \    /   \
     (5) (4)(18) (21)  ← LEAVES: no children!

  ROOT:    top-most node (/ or C:\ in file system)
  HEIGHT:  longest path from root to most-child node
           → this tree's height = 2!
  LEAF:    node with NO children (terminus!)
  BALANCED: all leaves on same level!
  BRANCHING FACTOR: max children per node!
```

### Height!

> Prime: _"If 99% of your tree exists within 3 levels and only ONE branch goes down 100 — the height is 100."_

### Balanced!

> Prime: _"A balanced tree is where all leaves are on the same level. A whole BRANCH of trees is just keeping them balanced — I just realized what a great pun that was."_ 😂

---

## §4. General Tree vs Binary Tree — "Multiple vs Two Children!"

| Feature   | General Tree       | Binary Tree   |
| --------- | ------------------ | ------------- |
| Children  | 0 to ∞             | 0 to 2        |
| Node      | `children: Node[]` | `left, right` |
| Branching | Unlimited          | Factor = 2    |
| Examples  | File system, DOM   | BST, Heap     |

```
GENERAL TREE:                    BINARY TREE:
═══════════════                  ═══════════════

      (A)                             (7)
    / | | \                          /   \
  (B)(C)(D)(E)                    (23)   (3)
  /\    |                         / \   / \
(F)(G) (H)                     (5)(4)(18)(21)
```

---

## §5. Binary Search Tree — "Strong Ordering!"

> Prime: _"A binary search tree has a SPECIFIC ordering. Usually a STRONG ordering — not like a weak ordering."_

- **Weak ordering**: heap — parent smaller, children bigger (but children unordered among themselves)
- **Strong ordering**: BST — left < parent < right, strictly!

---

## §6. Trees = "Just Linked Lists with More Branches!"

> Prime: _"If you really think about it, binary trees are just a linked list where the next and previous is a little different. We have left and right. Each one has two branches instead of one."_

```
LINKED LIST vs BINARY TREE:
═══════════════════════════════════════════════════════════════

  Linked List (branching = 1):
  (A) → (B) → (C) → (D) → null

  Binary Tree (branching = 2):
       (A)
      /   \
    (B)   (C)
    / \     \
  (D) (E)   (F)

  Same concept: nodes with pointers!
  Just slightly more complicated!
```

---

## Checklist

```
[ ] Trees: file system, DOM, AST — everywhere!
[ ] Node: value + children (general) or left/right (binary)!
[ ] Root: top-most node!
[ ] Height: longest path from root to leaf!
[ ] Leaf: node with no children!
[ ] Balanced: all leaves on same level!
[ ] Branching factor: max children per node!
[ ] General tree: 0 to ∞ children!
[ ] Binary tree: 0 to 2 children (left, right)!
[ ] Binary trees = linked lists with 2 branches!
TIẾP THEO → Phần 35: Tree Traversals!
```
