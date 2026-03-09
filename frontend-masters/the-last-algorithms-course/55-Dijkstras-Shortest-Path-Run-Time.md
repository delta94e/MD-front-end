# The Last Algorithms Course You'll Need — Phần 55: Dijkstra's Shortest Path Run Time — "V² → log V × (V+E) with MinHeap!"

> 📅 2026-03-09 · ⏱ 15 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Dijkstra's Run Time — "V² naive (scan all nodes), edges = 2E not V×E (mind blown!), MinHeap optimization: V²→log V × (V+E), heap.update is the key, island counting interview question!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Analysis — non-trivial runtime, edge counting trick, MinHeap optimization!

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | Naive Analysis — "O(V²) + E!"                  |
| 2   | Mind Blown — "Edges = 2E, NOT V × E!"          |
| 3   | MinHeap Optimization — "V² → log V × (V + E)!" |
| 4   | Interview: Island Counting — "DFS on 2D Grid!" |

---

## §1. Naive Analysis — "O(V²) + E!"

> Prime: _"This is a runtime that's NON-TRIVIAL to understand. The first time I walked through it, I was like 'got it.' Looked it up — 'don't got it.'"_

```
NAIVE RUNTIME BREAKDOWN:
═══════════════════════════════════════════════════════════════

  Setup: seen[], dist[], prev[]          → O(V)

  while loop: runs V times               → O(V)
    × hasUnvisited: scans seen[]         → O(V)
    = O(V²) for the while check!

    × getLowestUnvisited: scans dist[]   → O(V)
    = O(V²) for getting lowest!

    × edge loop: ???                      → ???

  Total so far: O(V²) + edges
```

---

## §2. Mind Blown — "Edges = 2E, NOT V × E!"

> Prime: _"This is where 'just count loops' is a COMPLETE LIE. You'd probably say the edge loop is O(E), so total is O(V×E). INCORRECT!"_

```
WHY IT'S 2E, NOT V × E:
═══════════════════════════════════════════════════════════════

  Undirected graph (worst case):
  (A)──(B)──(C)──(D)

  Visit A: check edges A→B              = 1 edge!
  Visit B: check edges B→A, B→C         = 2 edges!
  Visit C: check edges C→B, C→D         = 2 edges!
  Visit D: check edges D→C              = 1 edge!

  Total edges checked = 6 = 2E (each edge checked TWICE!)

  "The for loop doesn't go over EVERY edge in the graph.
   It only goes over edges connected to CURRENT node.
   Total across ALL iterations = 2E!" — Prime

  ═══════════════════════════════════════════════════════════
  NAIVE TOTAL: O(V² + E)
  ═══════════════════════════════════════════════════════════
```

---

## §3. MinHeap Optimization — "V² → log V × (V + E)!"

> Prime: _"How can we improve? The answer is a MINIMUM HEAP! If we had a min heap, we remove the node (seen!) and it's always the smallest. We don't even need a seen array!"_

```
WITH MINHEAP:
═══════════════════════════════════════════════════════════════

  hasUnvisited → heap.length > 0        → O(1)!
  getLowest    → heap.delete()          → O(log V)!
  update dist  → heap.update(node,dist) → O(log V)!

  ═══════════════════════════════════════════════════════════
  While loop: V times × O(log V) for delete    = O(V log V)
  Edge updates: E times × O(log V) for update  = O(E log V)
  Total: O((V + E) × log V)!
  ═══════════════════════════════════════════════════════════

  V²  →  (V + E) × log V

  "Simply changing the data structure made it faster!" — Prime
```

|              | Naive (Array) | Optimized (MinHeap)     |
| ------------ | ------------- | ----------------------- |
| hasUnvisited | O(V)          | O(1) — heap.length!     |
| getLowest    | O(V)          | O(log V) — heap.delete! |
| update dist  | O(1)          | O(log V) — heap.update! |
| **Total**    | **O(V² + E)** | **O((V+E) log V)**      |

> Prime: _"heap.update needs a map to O(1) get the node, then heapify up or down. That's the update function we didn't write earlier!"_

---

## §4. Interview: Island Counting — "DFS on 2D Grid!"

> Prime: _"Here's a graph interview question I've received and asked ~40 times."_

```
ISLAND COUNTING:
═══════════════════════════════════════════════════════════════

  Grid:
  [0, 1, 0, 0]
  [1, 1, 1, 0]
  [1, 0, 0, 1]

  Answer: 2 islands!

  Island 1:     Island 2:
  [_, 1, _, _]  [_, _, _, _]
  [1, 1, 1, _]  [_, _, _, _]
  [1, _, _, _]  [_, _, _, 1]

  Algorithm:
  1. Scan grid left-to-right, top-to-bottom!
  2. Hit a 1? → DFS/BFS in 4 directions!
  3. Mark all connected 1s as 0 (visited!)
  4. Increment island count!
  5. Keep scanning!

  "When I heard this, I thought 'I can't do this.'
   Turns out it was really simple — just DFS." — Prime
```

---

## Checklist

```
[ ] Naive: O(V²+E) — scanning seen/dist arrays each time!
[ ] Edge loop total = 2E (NOT V×E!) — each edge checked twice!
[ ] "Just count loops" = a lie for Dijkstra's!
[ ] MinHeap: hasUnvisited=O(1), getLowest=O(logV)!
[ ] heap.update needs value→index map!
[ ] Optimized: O((V+E) × log V)!
[ ] "Simply changing the data structure" = faster! — Prime
[ ] Island counting = DFS on 2D grid interview question!
TIẾP THEO → Phần 56: Maps!
```
