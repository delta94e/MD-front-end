# The Last Algorithms Course You'll Want (Part 2) — Phần 6: Spanning Trees — Prim's, Priority Queues, Kruskal's & Union-Find!

> 📅 2026-03-09 · ⏱ 50 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Spanning Trees & Prim's Algorithm + Priority Queues + Kruskal Algorithm
> — "Greedy MST, heap optimization E→ElogE→ElogV, Union-Find path compression!"
> Độ khó: ⭐⭐⭐⭐ | Advanced — Graph optimization, amortized analysis!

---

## Mục Lục

| #   | Phần                                                         |
| --- | ------------------------------------------------------------ |
| 1   | Spanning Tree là gì? — "Minimal Edges to Visit Every Node!"  |
| 2   | Minimum Spanning Tree — "Sum of All Edge Weights!"           |
| 3   | Prim's Algorithm — "Pick a Node, Add Smallest Edge, Repeat!" |
| 4   | Prim's Runtime Analysis — "V×E, Not Great!"                  |
| 5   | Priority Queue (Heap) — "Array Based Binary Tree!"           |
| 6   | Prim's + Heap → E log E — "Much Better!"                     |
| 7   | Priority Indexed Queue → E log V — "Even Better!"            |
| 8   | Kruskal's Algorithm — "Sort Edges, No Cycles!"               |
| 9   | Union-Find — "Groups, Bijections, Parent Pointers!"          |
| 10  | Path Compression — "Amortized O(1) Lookup!"                  |
| 11  | Prim's vs Kruskal's — "Dense vs Sparse Graphs!"              |
| 12  | Tự Code: Prim's + Kruskal's + Union-Find from Scratch!       |

---

## §1. Spanning Tree là gì?

> Prime: _"A spanning tree would be the minimal amount of edges required to have a connection to every single node."_

```
SPANNING TREE:
═══════════════════════════════════════════════════════════════

  Original graph:        Possible spanning trees:
    A ── B                 A ── B        A    B
    |  / |                 |    |        |  /
    C ── D                 C    D        C ── D

  Rules:
  → Connect ALL vertices!
  → Use MINIMUM edges (V-1 edges for V vertices!)
  → NO CYCLES!
  → Multiple valid spanning trees possible!

  "If you had a floating node, you can't make
   a spanning tree because we can't visit every node.
   That's a requirement." — Prime
```

---

## §2. Minimum Spanning Tree (MST)

```
MINIMUM SPANNING TREE:
═══════════════════════════════════════════════════════════════

  Weighted graph:
    A ──8── B
    |  \    |
    4   3   2
    |    \  |
    C ──5── D

  MST = spanning tree with LOWEST total weight!

  MST: A→C(4) + A→D(3) + D→B(2) = weight 9! ✅
  NOT: A→B(8) + ... = larger weight! ❌

  "We could just look at it and go, I already
   know which ones. You can be greedy with
   these algorithms." — Prime

  "You may have multiple minimum spanning trees
   if there's multiple same weight edges." — Prime
```

---

## §3. Prim's Algorithm — "Greedy, Pick a Node!"

> Prime: _"Prim's is a greedy algorithm. You start by picking a node. Add edges to a collection. Get smallest edge to unvisited node. Repeat V-1 times."_

```
PRIM'S ALGORITHM STEP-BY-STEP:
═══════════════════════════════════════════════════════════════

  Graph (Prime's whiteboard example):
    A ──9── B ──1── C
            |     / |
            8   3   3
            |  /    |
            D       e ──1── F
             \      |       |
              4     3       2
               \    |       |
                ── G ────── (via F)

  Step 1: Pick node E!  (audience chose 'e'!)
  Edges: (e,F,1), (e,G,3), (e,C,3)

  Step 2: Smallest = e→F (1!) → ADD TO MST!
  Add F's edges: (F,G,2), (F,D,4)

  Step 3: Smallest = F→G (2!) → ADD TO MST!
  G has no new unvisited edges!

  Step 4: Smallest = e→C (3!) → ADD TO MST!
  Add C's edges: (C,B,1), (C,D,8)

  Step 5: Smallest = C→B (1!) → ADD TO MST!
  Add B's edges: (B,A,9), (B,D,8)

  Step 6: Smallest = F→D (4!) → ADD TO MST!
  D has no new unvisited neighbors!

  Step 7: Smallest = B→A (9!) → ADD TO MST!

  MST: e-F(1), F-G(2), e-C(3), C-B(1), F-D(4), B-A(9)
  Total weight = 1+2+3+1+4+9 = 20!
```

---

## §4. Prim's Runtime Analysis — "V×E, Not Great!"

> Prime: _"This is one of those deceptive things that every single time I forget and have to relearn."_

```
RUNTIME ANALYSIS (naive!):
═══════════════════════════════════════════════════════════════

  1. Pick starting node: O(1)!
  2. Setup visited list: O(V)!

  3. "Add edges to collection": O(2E) total!
     → "We look at this edge once when we add A,
        one more time when we add B.
        We will NEVER look at that edge ever again.
        It is permanently 2E." — Prime 🤯

     → This is DECEPTIVE because it's inside a loop!
     → But total across ALL iterations = 2E!

  4. "Get smallest edge": O(E) per iteration!
     → Linear scan through all edges! 💀
     → Done V times!
     → V × E total!

  NAIVE RUNTIME: O(V × E)
  "Not great. We're not winning." — Prime
```

---

## §5. Priority Queue (Heap) — "Array Based Binary Tree!"

> Prime: _"A priority queue is effectively a binary tree. It's really not a tree, but it is totally a tree."_

```
MIN-HEAP:
═══════════════════════════════════════════════════════════════

  Heap condition (MIN heap):
  → Parent is ALWAYS ≤ both children!
  → But left child CAN BE > right child!
  → "Ordering only matters going up or down,
     not across the level." — Prime

          1
        /   \
       3     2      ← 3 > 2 is OK!
      / \   / \
     7   4  5   6   ← 7 > 4, no problem!

  ARRAY STORAGE:
  Index:  [1]  [2]  [3]  [4]  [5]  [6]  [7]
  Value:  [ 1,   3,   2,   7,   4,   5,   6]

  Navigation (1-indexed):
  → Left child = 2 × i
  → Right child = 2 × i + 1
  → Parent = floor(i / 2)

  "It's only 2's, 2's and pluses of 1's.
   You never have to add more than one,
   multiply more than two." — Prime

  INSERT: Add to end → HEAPIFY UP! O(log n)!
  → "Am I less than my parent? Swap up.
     Am I less than my parent? Swap up.
     If not, you're done, heapified, you're dead." — Prime

  EXTRACT MIN: Remove root → Move last to root → HEAPIFY DOWN!
  → O(log n)!
```

---

## §6. Prim's + Heap → E log E

```
PRIM'S WITH HEAP:
═══════════════════════════════════════════════════════════════

  BEFORE (naive): Get smallest edge = O(E)!
  AFTER (heap):   Get smallest edge = O(log E)!

  BEFORE: Add to collection = O(1) per edge!
  AFTER:  Add to collection = O(log E) per edge! (heapify!)

  Total edge operations: O(E) edges × O(log E) per operation!

  RUNTIME: O(E log E)! ← Much better than V×E!

  "We've dynamically changed our runtime from
   V.E to E log E." — Prime
```

---

## §7. Priority Indexed Queue → E log V — "Even Better!"

> Prime: _"I didn't know about this trick until not too long ago. It blew my mind."_

```
INDEXED PRIORITY QUEUE (PIQ):
═══════════════════════════════════════════════════════════════

  Key insight: Instead of edges in heap, use VERTICES!

  Initialize PIQ with all vertices:
  A=∞, B=∞, C=∞, D=∞, E=0, F=∞, G=∞

  → E=0 (start node!) → all others ∞!

  When processing E:
  → Look up C: O(1)! Is 3 < ∞? Yes! Update C=3!
  → Heapify C: O(log V)! (only V items in heap!)
  → Look up F: O(1)! Is 1 < ∞? Yes! Update F=1!
  → Heapify F: O(log V)!

  V items in heap (not E items!)
  → log V < log E! (V always ≤ E!)

  RUNTIME: O(E log V)! ← Best Prim's!

  "V is always smaller than E. So log V is
   always smaller than log E. Super cool." — Prime

  WHY E log V (formally):
  → Visit each vertex: V times!
  → Process each edge: E times total!
  → Each heap operation: O(log V)!
  → Total: (E + V) × log V → E log V!
  → "V becomes irrelevant since E ≥ V." — Prime
```

---

## §8. Kruskal's Algorithm — "Sort Edges, No Cycles!"

> Prime: _"Step one of Kruskal, sort edges. Like that one is way simpler than whatever happened over there."_

```
KRUSKAL'S ALGORITHM:
═══════════════════════════════════════════════════════════════

  Step 1: SORT all edges by weight!

  Sorted: (e,F,1), (C,B,1), (F,G,2), (e,C,3),
          (e,G,3), (F,D,4), (D,B,8), (C,D,8), (B,A,9)

  Step 2: Process edges smallest first!
  → IF two vertices in DIFFERENT groups → ADD edge!
  → IF same group → SKIP! (would create cycle!)

  Processing:
  (e,F,1): e=group1, F=none → ADD! [e,F = red group]
  (C,B,1): C=none, B=none → ADD! [C,B = green group]
  (F,G,2): F=red, G=none → ADD! [G joins red!]
  (e,C,3): e=red, C=green → ADD! [merge red+green!]
  (e,G,3): e=red, G=red → SKIP! (same group = cycle!)
  (F,D,4): F=red, D=none → ADD!
  (D,B,8): D=red, B=red → SKIP!
  (C,D,8): C=red, D=red → SKIP!
  (B,A,9): B=red, A=none → ADD!

  DONE! Same MST as Prim's! ✅

  "Kruskal's is really simple.
   But then you start thinking about how in the heavens
   did we do this group coloring." — Prime
```

---

## §9. Union-Find — "Groups, Bijections, Parent Pointers!"

> Prime: _"Union find. This is a pretty fantastic algorithm."_

```
UNION-FIND DATA STRUCTURE:
═══════════════════════════════════════════════════════════════

  Bijection (mapping):
  A=7, B=4, C=2, D=1, E=3, F=5, G=6

  Parent array (initially, everyone is their own parent!):
  Index:  [1,  2,  3,  4,  5,  6,  7]
  Parent: [1,  2,  3,  4,  5,  6,  7]
           D   C   E   B   F   G   A

  "When your index IS the value, you are the ROOT.
   You are your own color." — Prime

  UNION(E, G):
  → E maps to 3, parent[3]=3 (root!)
  → G maps to 6, parent[6]=6 (root!)
  → Make G point to E: parent[6] = 3!
  → Now G's parent = E!

  UNION(B, C):
  → C points to B: parent[2] = 4!

  UNION(D, A):
  → A points to D: parent[7] = 1!

  FIND(B): B→4, parent[4]=4 → root is B!
  FIND(G): G→6, parent[6]=3 → E→3, parent[3]=3 → root is E!


UNION LARGER GROUPS:
═══════════════════════════════════════════════════════════════

  After more unions:

  FIND(B):
  B → C → D → D (root!)  ← Path: B→C→D!

  FIND(E):
  E → E (root!)

  Different roots! → Can UNION!
  → Make E point to D: parent[3] = 1!

  Now FIND(G):
  G → E → D → D (root!)  ← Longer path! 😱

  "You can imagine it becomes a really long path.
   That is where we apply path compression." — Prime
```

---

## §10. Path Compression — "Amortized O(1)!"

> Prime: _"As you walk this array, you're eventually gonna find the root. So if you unwalk the array, you'll be able to update every single node along the path to point to the root."_

```
PATH COMPRESSION:
═══════════════════════════════════════════════════════════════

  BEFORE path compression:
  F → D → G → A (root!)    ← 3 hops!

  findParent(F):
    F is not root → recurse!
    D is not root → recurse!
    G is not root → recurse!
    A IS root → return A!

    Unwind: G.parent = A  (was pointing to next!)
    Unwind: D.parent = A  (compress!)
    Unwind: F.parent = A  (compress!)

  AFTER path compression:
  F → A (root!)    ← 1 hop! ✅
  D → A (root!)    ← 1 hop! ✅
  G → A (root!)    ← 1 hop! ✅

  function findParent(index) {
    if (parent[index] === index) return index;  // Root!
    const root = findParent(parent[index]);      // Find root!
    parent[index] = root;                         // COMPRESS!
    return root;
  }

  "Along the way back, we update every single index.
   The path gets more and more compressed.
   Every time you look it up, you may hop a couple times,
   but the NEXT TIME you'll never hop again.
   AMORTIZED CONSTANT TIME lookup!" — Prime 🤯
```

---

## §11. Prim's vs Kruskal's

```
PRIM'S vs KRUSKAL'S:
═══════════════════════════════════════════════════════════════

  Feature          │ Prim's            │ Kruskal's
  ─────────────────┼───────────────────┼──────────────────
  Approach         │ Grow from 1 node  │ Sort all edges
  Start            │ Pick ANY node     │ No start node
  Runtime (naive)  │ O(V × E)          │ O(E log E)
  Runtime (heap)   │ O(E log V)        │ O(E log E)
  Data structure   │ Priority Queue    │ Union-Find
  Best for         │ DENSE graphs      │ SPARSE graphs
  Edge processing  │ Greedy per node   │ Globally sorted

  "If graph is sparse, sorting's not expensive,
   algorithm's simple → Kruskal's!
   Prim's is kinda expensive with the heap stuff." — Prime

  MATH NOTE:
  → E ≤ V × (V-1) / 2 ≈ V² (worst case!)
  → E log E = E log V² = 2E log V → still E log V!
  → "You COULD put V² in there, move the square out,
     delete the 2... but I feel cheated." — Prime 😂

  "Not all trees are graphs, not all graphs are trees.
   A tree is a directed acyclic graph, but not all
   DAGs are trees." — Prime
```

---

## §12. Tự Code: Prim's + Kruskal's + Union-Find

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 1: MIN-HEAP (Priority Queue!)
// ═══════════════════════════════════════════════════════════

class MinHeap {
  constructor() {
    this.heap = [null]; // 1-indexed!
  }

  get size() {
    return this.heap.length - 1;
  }

  insert(item) {
    this.heap.push(item);
    this._heapifyUp(this.size);
  }

  extractMin() {
    if (this.size === 0) return null;
    const min = this.heap[1];
    this.heap[1] = this.heap[this.size];
    this.heap.pop();
    if (this.size > 0) this._heapifyDown(1);
    return min;
  }

  _heapifyUp(i) {
    while (i > 1) {
      const parent = Math.floor(i / 2);
      if (this.heap[parent].weight <= this.heap[i].weight) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _heapifyDown(i) {
    while (2 * i <= this.size) {
      let smallest = 2 * i;
      if (
        smallest + 1 <= this.size &&
        this.heap[smallest + 1].weight < this.heap[smallest].weight
      ) {
        smallest++;
      }
      if (this.heap[i].weight <= this.heap[smallest].weight) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 2: PRIM'S ALGORITHM
// ═══════════════════════════════════════════════════════════

function prims(graph, startNode) {
  const visited = new Set();
  const mst = []; // MST edges!
  let totalWeight = 0;
  const heap = new MinHeap();

  // Start!
  visited.add(startNode);

  // Add starting node's edges to heap!
  for (const { to, weight } of graph.getNeighbors(startNode)) {
    heap.insert({ from: startNode, to, weight });
  }

  while (heap.size > 0 && mst.length < graph.getVertices().length - 1) {
    const edge = heap.extractMin(); // Smallest edge!

    if (visited.has(edge.to)) continue; // Already visited!

    // Add to MST!
    visited.add(edge.to);
    mst.push(edge);
    totalWeight += edge.weight;

    // Add new edges from this vertex!
    for (const { to, weight } of graph.getNeighbors(edge.to)) {
      if (!visited.has(to)) {
        heap.insert({ from: edge.to, to, weight });
      }
    }
  }

  return { mst, totalWeight };
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 3: UNION-FIND WITH PATH COMPRESSION!
// ═══════════════════════════════════════════════════════════

class UnionFind {
  constructor(size) {
    // Everyone is their own parent initially!
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0); // Union by rank!
  }

  // FIND with PATH COMPRESSION!
  find(x) {
    if (this.parent[x] !== x) {
      // Recursively find root AND compress path!
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  // UNION by rank!
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false; // Same group!

    // Attach smaller tree under larger!
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }

    return true; // Successfully unioned!
  }

  connected(x, y) {
    return this.find(x) === this.find(y);
  }
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 4: KRUSKAL'S ALGORITHM
// ═══════════════════════════════════════════════════════════

function kruskals(vertices, edges) {
  // Step 1: SORT edges by weight!
  const sorted = [...edges].sort((a, b) => a.weight - b.weight);

  // Create bijection: vertex → index!
  const indexMap = new Map();
  vertices.forEach((v, i) => indexMap.set(v, i));

  const uf = new UnionFind(vertices.length);
  const mst = [];
  let totalWeight = 0;

  // Step 2: Process edges smallest first!
  for (const edge of sorted) {
    const idxFrom = indexMap.get(edge.from);
    const idxTo = indexMap.get(edge.to);

    // Only add if different groups (no cycle!)
    if (uf.union(idxFrom, idxTo)) {
      mst.push(edge);
      totalWeight += edge.weight;

      // V-1 edges = spanning tree complete!
      if (mst.length === vertices.length - 1) break;
    }
  }

  return { mst, totalWeight };
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 5: DEMO
// ═══════════════════════════════════════════════════════════

// Build graph (undirected weighted!)
const g = new AdjacencyList();
g.addUndirectedEdge("A", "B", 9);
g.addUndirectedEdge("B", "C", 1);
g.addUndirectedEdge("B", "D", 8);
g.addUndirectedEdge("C", "D", 8);
g.addUndirectedEdge("C", "e", 3);
g.addUndirectedEdge("D", "F", 4);
g.addUndirectedEdge("e", "F", 1);
g.addUndirectedEdge("e", "G", 3);
g.addUndirectedEdge("F", "G", 2);

// Prim's!
const primResult = prims(g, "e");
console.log("Prim's MST:", primResult.mst);
console.log("Prim's weight:", primResult.totalWeight);

// Kruskal's!
const vertices = ["A", "B", "C", "D", "e", "F", "G"];
const edges = [
  { from: "A", to: "B", weight: 9 },
  { from: "B", to: "C", weight: 1 },
  { from: "B", to: "D", weight: 8 },
  { from: "C", to: "D", weight: 8 },
  { from: "C", to: "e", weight: 3 },
  { from: "D", to: "F", weight: 4 },
  { from: "e", to: "F", weight: 1 },
  { from: "e", to: "G", weight: 3 },
  { from: "F", to: "G", weight: 2 },
];

const kruskalResult = kruskals(vertices, edges);
console.log("Kruskal's MST:", kruskalResult.mst);
console.log("Kruskal's weight:", kruskalResult.totalWeight);

// Both produce same MST weight!
// Prim's runtime: O(E log V) with indexed PQ!
// Kruskal's runtime: O(E log E) with sort + union-find!
```

---

## Checklist

```
[ ] Spanning tree = V-1 edges, no cycles, connect all nodes!
[ ] MST = spanning tree with MINIMUM total weight!
[ ] Prim's: pick node → greedy add smallest edge → repeat!
[ ] Prim's naive: O(V×E)! With heap: O(E log E)! With PIQ: O(E log V)!
[ ] "Add edges = 2E total, deceptive inside loop!" — Prime
[ ] Heap: array-based binary tree, insert/extract O(log n)!
[ ] "Left child = 2i, right child = 2i+1" — Prime
[ ] Kruskal's: sort ALL edges → add if no cycle → Union-Find!
[ ] Union-Find: parent array, find root, union groups!
[ ] Path compression: AMORTIZED O(1) find!
[ ] Kruskal's: O(E log E)! (dominated by sort!)
[ ] Dense graph → Prim's! Sparse graph → Kruskal's!
TIẾP THEO → Phần 7: Ford-Fulkerson Max Flow Min Cut!
```
