# The Last Algorithms Course You'll Need — Phần 37: Breadth First Search — "Queue Not Stack, Level-Order, O(N) vs O(N²)!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Breadth First Search — "Opposite of DFS, use Queue not Stack, visit level by level, ArrayList shift = O(N²) disaster!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — BFS vs DFS, Queue-based traversal, running time with wrong data structure!

---

## Mục Lục

| #   | Phần                                               |
| --- | -------------------------------------------------- |
| 1   | BFS — "Opposite of DFS, Use a Queue!"              |
| 2   | How It Works — "Visit Level by Level!"             |
| 3   | Queue Walkthrough — "Add Children, Visit Front!"   |
| 4   | Running Time — "O(N)... Unless You Use ArrayList!" |
| 5   | Why ArrayList = O(N²) — "Half the Tree in Queue!"  |
| 6   | Interview Story — "I Corrected My Interviewer!" 😂 |

---

## §1. BFS — "Opposite of DFS, Use a Queue!"

> Prime: _"Can anyone guess the data structure if it's the OPPOSITE of a depth first search?"_
> Student: _"Queue!"_
> Prime: _"BOOM, Queue, that's exactly right!"_

|                | DFS               | BFS                |
| -------------- | ----------------- | ------------------ |
| Data structure | Stack (implicit!) | Queue!             |
| Direction      | Goes DEEP first   | Goes WIDE first    |
| Pattern        | Follow one branch | Visit entire level |
| Recursion?     | Natural!          | Not needed!        |

---

## §2. How It Works — "Visit Level by Level!"

```
BFS — LEVEL ORDER:
═══════════════════════════════════════════════════════════════

         (7)          Level 0: visit 7!
        /   \
     (23)    (8)      Level 1: visit 23, 8!
     / \    /   \
   (5) (4)(21) (15)   Level 2: visit 5, 4, 21, 15!

  Output: 7, 23, 8, 5, 4, 21, 15

  "It's a tree LEVEL kind of visiting.
   You visit one level at a time." — Prime
```

---

## §3. Queue Walkthrough — "Add Children, Visit Front!"

```
QUEUE WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  Start: enqueue head
  Queue: [7]

  Dequeue 7 → print 7!
  Enqueue children: 23, 8
  Queue: [23, 8]

  Dequeue 23 → print 23!
  Enqueue children: 5, 4
  Queue: [8, 5, 4]

  Dequeue 8 → print 8!
  Enqueue children: 21, 15
  Queue: [5, 4, 21, 15]

  Dequeue 5 → print 5! (no children)
  Queue: [4, 21, 15]

  Dequeue 4 → print 4! (no children)
  Queue: [21, 15]

  Dequeue 21 → print 21! (no children)
  Queue: [15]

  Dequeue 15 → print 15! (no children)
  Queue: []  ← DONE!

  Output: 7, 23, 8, 5, 4, 21, 15 ✅
```

---

## §4. Running Time — "O(N)... Unless You Use ArrayList!"

> Prime: _"The running time of BFS is O(N). But if we use a JavaScript array, it's O(N²)!"_

| Data Structure             | Dequeue | Running Time |
| -------------------------- | ------- | ------------ |
| Proper Queue (linked list) | O(1)    | **O(N)** ✅  |
| JavaScript Array (shift)   | O(N)    | **O(N²)** ❌ |

---

## §5. Why ArrayList = O(N²) — "Half the Tree in Queue!"

> Prime: _"Each level of a complete binary tree, if complete, is approximately HALF the size of the entire tree above it."_

```
WHY O(N²) WITH ARRAYLIST:
═══════════════════════════════════════════════════════════════

  Level 0:  1 node
  Level 1:  2 nodes
  Level 2:  4 nodes    ← half the tree!
  Level 3:  8 nodes    ← half the tree!

  At level 3: queue has ~N/2 items!
  Array.shift() = O(N) on N/2 items!
  Total: O(N) shifts × O(N) per shift = O(N²)! 💀

  "Don't just use something because it's convenient.
   You REALLY should use a Queue." — Prime
```

---

## §6. Interview Story — "I Corrected My Interviewer!" 😂

> Prime: _"The interviewer said 'can you print in tree level ordering?' I said 'First off, that's not a real term — it's called BFS. Second, you shouldn't say that because it's incorrect.'"_

_"And I got the job! Argue with your interviewer if they're incorrect — that may or may not be a pro tip."_ 😂

---

## Checklist

```
[ ] BFS: opposite of DFS — uses Queue not Stack!
[ ] Visit level by level (tree level ordering!)
[ ] Algorithm: dequeue front, enqueue children, repeat!
[ ] O(N) with proper Queue!
[ ] O(N²) with ArrayList (shift is O(N))!
[ ] Half the tree can be in the queue at once!
[ ] No recursion needed — just a while loop!
TIẾP THEO → Phần 38: Implement Breadth First Search!
```
