# The Last Algorithms Course You'll Need — Phần 14: Linked List Complexity — "Head/Tail O(1), Middle O(N), Every LL Is a Graph!"

> 📅 2026-03-08 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Linked List Complexity — "get/delete head/tail = O(1), middle = traversal + O(1), LL is a graph, is a tree!"
> Độ khó: ⭐️⭐️⭐️ | Analysis — operation costs, traversal vs operation, foundational for trees/graphs!

---

## Mục Lục

| #   | Phần                                                  |
| --- | ----------------------------------------------------- |
| 1   | Get by Index — "Walk the List, O(N)!"                 |
| 2   | Head & Tail — "Constant Time Gets!"                   |
| 3   | Deletion — "Ends = O(1), Middle = Traversal!"         |
| 4   | Prepend & Append — "O(1)!"                            |
| 5   | The Pattern — "Traversal Is the Cost!"                |
| 6   | Interface — "Constrain for Performance!"              |
| 7   | Why Start with Linked Lists? — "Every LL Is a Graph!" |
| 8   | 🔬 Deep Analysis — Complete Complexity Table          |

---

## §1. Get by Index — "Walk the List, O(N)!"

> Prime: _"If I asked for the fifth value, I literally have to write a loop — for 0 to 5, current = current.next. I have to WALK it until we get to the correct value."_

### No random access!

Prime: _"Then I can return current's VALUE — not the containing node. We don't return the node because then someone can mess with next and previous, and boom our whole list sucks."_

_"The container is our abstraction for OURSELVES, not for the outside world."_

---

## §2. Head & Tail — "Constant Time Gets!"

> Prime: _"Getting head can become a CONSTANT operation. Getting tail can ALSO be constant — because we already have a defined pointer."_

### Direct reference = O(1)!

```
HEAD & TAIL:
═══════════════════════════════════════════════════════════════

  head ──→ (A) ⇄ (B) ⇄ (C) ⇄ (D) ←── tail

  Get head: this.head.value → O(1)! 🚀
  Get tail: this.tail.value → O(1)! 🚀
  Get middle: walk from head → O(N)! 🐢
```

---

## §3. Deletion — "Ends = O(1), Middle = Traversal!"

> Prime: _"Deletion at head or tail — constant. But if you delete in the MIDDLE, you have to TRAVERSE to that point. So you have a two-operation cost: traversal PLUS deletion."_

### Two costs!

```
DELETION COSTS:
═══════════════════════════════════════════════════════════════

  Delete head: O(1) — have direct reference!
  Delete tail: O(1) — have direct reference!
  Delete middle: O(N) traversal + O(1) deletion = O(N)!

  "The deletion ITSELF is not costly.
   It's the TRAVERSAL that can get you." — Prime
```

---

## §4. Prepend & Append — "O(1)!"

> Prime: _"Prepending and appending — constant time, because you just break the links from head or tail."_

---

## §5. The Pattern — "Traversal Is the Cost!"

> Prime: _"So long as you can traverse FAST, your insertion is fast."_

### Strength & weakness!

Prime: _"The list can be whatever SIZE you want. Deletion from front or back is extremely fast. That's very important — a lot of structures want to delete the OLDEST item. The oldest would be at the tail — constant operation."_

---

## §6. Interface — "Constrain for Performance!"

> Prime: _"From here on out, you'll notice that most things are CONSTRAINED intentionally, such that we get very good performance."_

### Linked list interface!

```typescript
interface LinkedList<T> {
  get length(): number;
  insertAt(item: T, index: number): void;
  remove(item: T): T | undefined;
  removeAt(index: number): T | undefined;
  append(item: T): void;
  prepend(item: T): void;
  get(index: number): T | undefined;
}
```

---

## §7. Why Start with Linked Lists? — "Every LL Is a Graph!"

> Prime: _"Every single linked list IS a graph. Every linked list is technically a TREE. They are the most fundamental unit."_

_"As long as you understand how to traverse and move around in a linked list, you're going to understand ALL these other data structures."_

```
LINKED LIST → EVERYTHING:
═══════════════════════════════════════════════════════════════

  Linked List:  (A) → (B) → (C) → (D)
       ↓
  Tree:         (A)
               / \
             (B)  (C)     ← nodes with multiple "next"!
             /
           (D)
       ↓
  Graph:    (A) → (B) → (C)
             ↑           ↓
             └─── (D) ←──┘   ← nodes with cycles!

  "Linked lists are the most FUNDAMENTAL unit." — Prime
```

---

## §8. 🔬 Deep Analysis — Complete Complexity Table

```
LINKED LIST COMPLEXITY:
═══════════════════════════════════════════════════════════════

  Operation          | Singly  | Doubly  | Notes
  ────────────────── |─────────|─────────|──────────────
  Get head           | O(1)    | O(1)    | direct ref!
  Get tail           | O(1)*   | O(1)*   | *if tail ptr!
  Get by index       | O(N)    | O(N)    | must traverse!
  Prepend            | O(1)    | O(1)    | update head!
  Append             | O(1)*   | O(1)*   | *if tail ptr!
  Insert at node     | O(1)    | O(1)    | if HAVE ref!
  Insert at index    | O(N)    | O(N)    | traverse first!
  Delete head        | O(1)    | O(1)    | update head!
  Delete tail        | O(N)    | O(1)    | singly: no prev!
  Delete at node     | O(N)^   | O(1)    | ^singly: no prev!
  Delete at index    | O(N)    | O(N)    | traverse first!

  KEY INSIGHT:
  ┌──────────────────────────────────────────────────────────┐
  │ The OPERATION is always O(1)!                          │
  │ The TRAVERSAL is what costs O(N)!                      │
  │ If you HAVE the node → O(1)!                          │
  │ If you NEED TO FIND the node → O(N)!                  │
  └──────────────────────────────────────────────────────────┘
```

---

## Checklist

```
[ ] Get by index: walk the list = O(N)!
[ ] Head/tail with direct pointers = O(1)!
[ ] Delete ends = O(1), delete middle = O(N) traversal!
[ ] Prepend/append = O(1) with head/tail pointers!
[ ] Traversal is the cost, not the operation!
[ ] "Don't return the node — leak abstraction!"
[ ] Interface: constrain for performance!
[ ] Every linked list is a graph/tree — foundational!
TIẾP THEO → Phần 15: Queue!
```
