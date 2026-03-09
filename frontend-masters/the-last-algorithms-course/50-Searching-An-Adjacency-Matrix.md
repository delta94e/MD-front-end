# The Last Algorithms Course You'll Need — Phần 50: Searching an Adjacency Matrix — "Adj List vs Matrix, BFS/DFS on Graphs, Previous Array!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Searching an Adjacency Matrix — "Two representations (adjacency list, adjacency matrix), O(V²) memory for matrix, BFS/DFS same as trees but with seen + previous arrays for path building!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — graph representations, BFS with path tracking, seen + previous arrays!

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | Adjacency List — "List of Edges Per Node!"           |
| 2   | Adjacency Matrix — "2D Grid, O(V²) Memory!"          |
| 3   | BFS/DFS Work on Graphs — "Same as Trees!"            |
| 4   | Path Building — "seen[] + previous[]!"               |
| 5   | BFS on Graph Walkthrough — "Queue + Previous Array!" |

---

## §1. Adjacency List — "List of Edges Per Node!"

```
ADJACENCY LIST:
═══════════════════════════════════════════════════════════════

  Graph:
  (0)──→(1)     (0)──→(3)──→(1)
          ↑              ↓
         (2)←────────────┘

  List representation:
  0: [{ to: 1, weight: 10 }, { to: 3, weight: 5 }]
  1: []                    ← terminal node!
  2: [{ to: 0, weight: 3 }]
  3: [{ to: 1, weight: 7 }, { to: 2, weight: 4 }]

  "The index maps to the node.
   Each node has a list of edges." — Prime
```

---

## §2. Adjacency Matrix — "2D Grid, O(V²) Memory!"

> Prime: _"If you had 100 nodes, you need a 100×100 matrix. Sparsely connected = ton of wasted memory."_

```
ADJACENCY MATRIX:
═══════════════════════════════════════════════════════════════

  Same graph as above:

       0    1    2    3
  0  [ 0,  10,   0,   5 ]
  1  [ 0,   0,   0,   0 ]
  2  [ 3,   0,   0,   0 ]
  3  [ 0,   7,   4,   0 ]

  Row = source node!
  Column = destination node!
  Value = weight (0 = no connection!)

  Setup: O(V²) memory!
  "You'd never use this for maps — too many nodes!" — Prime
```

|                | Adjacency List | Adjacency Matrix  |
| -------------- | -------------- | ----------------- |
| Memory         | O(V + E)       | O(V²)             |
| Check edge     | O(degree)      | O(1)!             |
| List neighbors | O(degree)      | O(V)              |
| Sparse graphs  | ✅ Better!     | ❌ Wasteful!      |
| Dense graphs   | OK             | ✅ Direct access! |

---

## §3. BFS/DFS Work on Graphs — "Same as Trees!"

> Prime: _"If all trees are graphs, and we can BFS a tree, why can't we do it on a graph? Of course we can!"_

```
DFS ON GRAPH (using stack/recursion):
═══════════════════════════════════════════════════════════════

  Start at 0:
  Push 0 on stack → visit 1 (push) → 1 has no connections → pop
  → visit 3 (push) → 3 has 1 (seen!) and 2 → visit 2 (push)
  → 2 has 0 (seen!) → pop 2 → pop 3 → pop 0 → DONE!

BFS ON GRAPH (using queue):
═══════════════════════════════════════════════════════════════

  Start at 0:
  Queue: [0] → pop 0, push 1, 3
  Queue: [1, 3] → pop 1, nothing to add
  Queue: [3] → pop 3, push 2 (1 already seen!)
  Queue: [2] → pop 2, 0 already seen → DONE!
```

---

## §4. Path Building — "seen[] + previous[]!"

> Prime: _"In a graph, when doing a search, we often want the PATH. BFS doesn't have recursion, so we maintain it ourselves with a previous array."_

```
SEEN + PREVIOUS ARRAYS:
═══════════════════════════════════════════════════════════════

  seen[]:     [false, false, false, false, false]
  previous[]: [-1,    -1,    -1,    -1,    -1   ]

  After BFS from node 0:
  seen[]:     [true,  true,  true,  true,  true ]
  previous[]: [-1,    0,     3,     0,     3    ]
              ↑source  ↑came   ↑came  ↑came  ↑came
                       from 0  from 3 from 0 from 3

  Walk backwards to build path:
  needle=4 → prev[4]=3 → prev[3]=0 → prev[0]=-1 STOP!
  Reverse: [0, 3, 4] ← path from 0 to 4!
```

---

## §5. BFS on Graph Walkthrough — "Queue + Previous Array!"

```
BFS WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  Graph:          Weights:
  (0)──→(2)      0→2: 4
  (0)──→(3)      0→3: 2
  (3)──→(1)      3→1: 5
  (3)──→(4)      3→4: 1
  (1)──→(4)      1→4: 1
  (2)──→(4)      2→4: 5

  BFS from 0, looking for 4:

  Step 1: Queue=[0], seen[0]=true
  Step 2: Pop 0, push 2 (seen, prev[2]=0), push 3 (seen, prev[3]=0)
  Step 3: Queue=[2,3], Pop 2, push 4 (seen, prev[4]=2)
  Step 4: Queue=[3,4], Pop 3, 1 not seen → push 1 (prev[1]=3)
          4 already seen → skip!
  Step 5: Queue=[4,1], Pop 4 → FOUND needle! Break!

  Build path backwards:
  4 → prev[4]=2 → prev[2]=0 → prev[0]=-1 STOP!
  Reverse: [0, 2, 4]! ✅

  "That's kinda the hardest part — rederiving how to walk
   backwards through a breadth first search." — Prime
```

### Pseudocode!

```
BFS with path:
  seen[] = all false
  prev[] = all -1
  seen[source] = true
  Q = [source]

  while Q.length:
    curr = Q.dequeue()
    if curr === needle → BREAK!

    for each neighbor i of curr:
      if seen[i] → continue!
      seen[i] = true
      prev[i] = curr
      Q.push(i)

  // Build path backwards!
  path = []
  curr = needle
  while prev[curr] !== -1:
    path.push(curr)
    curr = prev[curr]

  return [source, ...path.reverse()]
```

---

## Checklist

```
[ ] Two representations: adjacency list + adjacency matrix!
[ ] Adjacency list: O(V+E) memory, list of edges per node!
[ ] Adjacency matrix: O(V²) memory, 2D grid!
[ ] BFS/DFS work identical on graphs as on trees!
[ ] Need seen[] to avoid revisiting nodes (graphs have cycles!)
[ ] Need previous[] to track path (BFS has no recursion!)
[ ] Walk previous[] backwards from needle to source!
[ ] Don't forget to add source to path (prev[source]=-1!)
TIẾP THEO → Phần 51: Implementing BFS on Adjacency Matrix!
```
