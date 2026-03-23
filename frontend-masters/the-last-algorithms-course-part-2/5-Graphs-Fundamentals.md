# The Last Algorithms Course You'll Want (Part 2) — Phần 5: Graphs Fundamentals — Overview, Adjacency, BFS, DFS!

> 📅 2026-03-09 · ⏱ 45 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Graphs Overview + Adjacency Lists & Matrices + Breadth-First Search + Depth-First Search
> — "Edge-lords, connected components, CSS order BFS, topological sort!"
> Độ khó: ⭐⭐⭐ | Intermediate — Foundation for all graph algorithms!

---

## Mục Lục

| #   | Phần                                                            |
| --- | --------------------------------------------------------------- |
| 1   | Graph là gì? — "Vertices and Edges, Boom We're Edge-Lords!"     |
| 2   | Directed vs Undirected — "One Way Streets!"                     |
| 3   | Weights — "Cost to Traverse That Edge!"                         |
| 4   | Connected Components — "F Yeah, Having a Great Time Over Here!" |
| 5   | Adjacency List — "A List of Lists of Adjacencies!"              |
| 6   | Adjacency Matrix — "Lots of Numbers!"                           |
| 7   | Edge List — "Don't Know Why You Would Do It!"                   |
| 8   | Trade-offs — "Lots of Edges? Matrix. Sparse? List!"             |
| 9   | BFS — "Queue, Visit, Concentric Rings!"                         |
| 10  | BFS & Shortest Path — "CSS Order: Top, Right, Bottom, Left!"    |
| 11  | DFS — "Recursive Stack, Go Deep First!"                         |
| 12  | Topological Sort — "Post-Order DFS = Module Graph!"             |
| 13  | Tự Code: Graph + BFS + DFS + Topological Sort!                  |

---

## §1. Graph là gì? — "Vertices and Edges!"

> Prime: _"Graphs are exciting, they're extremely complicated. Whenever you're doing a graph algorithm, it seems like you're not just doing one algorithm, you're doing lines of algorithms."_

```
GRAPH BASICS:
═══════════════════════════════════════════════════════════════

  V = Vertices (đỉnh, nodes!)
  E = Edges (cạnh, connections!)

  "Boom, we're about to become edge-lords today.
   Pretty good joke, I thought it was good." — Prime 😂

  Visual:
    A ---- B
    |      |
    C ---- D

  V = {A, B, C, D}
  E = {(A,B), (A,C), (B,D), (C,D)}
```

---

## §2. Directed vs Undirected — "One Way Streets!"

```
UNDIRECTED GRAPH:
═══════════════════════════════════════════════════════════════

  A ---- B         → A can go to B, B can go to A!
  |      |         → No implied direction!
  C ---- D         → "I can go B, A, C, D or
                      D, C, B, A" — Prime

DIRECTED GRAPH:
═══════════════════════════════════════════════════════════════

  A ---→ C         → "You can only go from A to C!"
  ↑      ↓         → "You cannot go from A to B, it's not
  B      D            a thing. Don't make fetch happen,
                      it's not happening." — Prime 😂

  "One way streets are directed edges in which you
   can only go one direction." — Prime

DOUBLE DIRECTED:
═══════════════════════════════════════════════════════════════

  A ←──2──→ B      → Can go both ways!
       3            → Different weights each direction!

  "When I do a direction, I'm gonna do a single side.
   The reason why is when I go the other way,
   I can specify it like this." — Prime
```

---

## §3. Weights — "Cost to Traverse!"

```
WEIGHTED GRAPH:
═══════════════════════════════════════════════════════════════

  A ──5──→ B       → Weight 5 to go A→B!
  │        │
  3        2       → "Weights are what it cost
  │        │          to traverse that edge." — Prime
  ↓        ↓
  C ──1──→ D

  USE CASES:
  → Google Maps: distance / speed = travel time!
  → Network routing: latency, bandwidth!
  → "Maybe you wanna put distance over speed.
     You'd have traffic and other things implied.
     That's how you construct a graph for
     moving cars efficiently." — Prime
```

---

## §4. Connected Components — "F Yeah Over Here!"

```
CONNECTED COMPONENTS:
═══════════════════════════════════════════════════════════════

  Component 1:        Component 2:
  A ---- B            E ---- F
  |      |
  C ---- D

  "If I had a graph with E and F just like,
   F yeah, we're having a great time over here,
   two connected components." — Prime 😂

  → Cannot go from E to B at any point!
  → Spanning tree requires ALL nodes connected!
```

---

## §5. Adjacency List — "A List of Lists!"

```
ADJACENCY LIST:
═══════════════════════════════════════════════════════════════

  Directed graph:
  A ──→ D (weight 5)
  A ──→ C
  B ──→ D
  B ──→ C
  C ──→ D
  D ──→ (nothing!)

  Representation:
  ┌───┬──────────────────────┐
  │ A │ [{to: D, w: 5}, {to: C}] │
  │ B │ [{to: D}, {to: C}]       │
  │ C │ [{to: D}]                │
  │ D │ []                       │ ← "Lonely, a roach motel!"
  └───┴──────────────────────┘

  "C only goes to D. We don't talk about
   going back to A because this is a directed graph,
   there is no connection back." — Prime
```

---

## §6. Adjacency Matrix — "Lots of Numbers!"

```
ADJACENCY MATRIX:
═══════════════════════════════════════════════════════════════

  Same directed graph:

       A   B   C   D
  A  [ 0   0   1   5 ]    → A→C = 1, A→D = 5!
  B  [ 0   0   1   1 ]    → B→C = 1, B→D = 1!
  C  [ 0   0   0   1 ]    → C→D = 1!
  D  [ 0   0   0   0 ]    → D goes nowhere!

  "If it's just directed or undirected weightless graph
   you just put a 1, there's a connection.
   If you had weights you put the weight." — Prime

  SELF-LOOPS:
  "You can be connected to yourself, that's a real thing,
   people do that." — Prime
```

---

## §7. Edge List & Trade-offs

```
EDGE LIST (rare!):
═══════════════════════════════════════════════════════════════

  [(A, D, 5), (A, C, 1), (B, D, 1), (B, C, 1), (C, D, 1)]

  "I'm not sure why you would do that, but it does exist.
   I've never seen it done." — Prime

TRADE-OFFS:
═══════════════════════════════════════════════════════════════

  Adjacency LIST:
  ✅ Space efficient for SPARSE graphs! O(V + E)!
  ✅ Easy to iterate neighbors!
  ❌ "Is A connected to C?" → O(degree) linear scan!

  Adjacency MATRIX:
  ✅ "Is A connected to C?" → O(1) lookup!
  ✅ Great for DENSE graphs (lots of edges!)
  ❌ Space: O(V²) always! Even if sparse!
  ❌ Setup time: O(V²)!

  "If there's a lot of edges, adjacency matrix makes
   way more sense. Because it's easy access in,
   right here, yes, we are connected." — Prime
```

---

## §8. BFS — "Queue, Visit, Concentric Rings!"

> Prime: _"Breadth-first search is really simple. Starting node, pick that, add all edges, mark as visited, pop the next item off the queue until there's nothing left."_

```
BFS ALGORITHM:
═══════════════════════════════════════════════════════════════

  Graph:
    A ── B ── D ── E
    |         |    F
    C ─────── D    G
                   H ── I

  Start at A:
  Queue: [A]
  Visited: {}

  Step 1: Pop A, visit A, add B, C!
  Queue: [B, C]      Visited: {A}

  Step 2: Pop B, visit B, add D!
  Queue: [C, D]      Visited: {A, B}

  Step 3: Pop C, visit C! (D already added!)
  Queue: [D]          Visited: {A, B, C}

  Step 4: Pop D, visit D, add E, F, G, H!
  Queue: [E, F, G, H] Visited: {A, B, C, D}

  Step 5-8: Pop E, F, G, H, visit each!
  Step 9: Pop H's child I, visit I!

  Visit Order: A → B → C → D → E → F → G → H → I


BFS — CONCENTRIC RINGS:
═══════════════════════════════════════════════════════════════

  Distance from A:
  → A: 0 hops
  → B, C: 1 hop
  → D: 2 hops
  → E, F, G, H: 3 hops
  → I: 4 hops

  "BFS goes out in concentric rings.
   It finds further and further away nodes." — Prime
```

---

## §9. BFS & Shortest Path — "CSS Order!"

> Prime: _"CSS order. Top, right, bottom, left. That has never been stated once in a class about graphs. I think I'm the first person ever."_ 😂

```
BFS = SHORTEST PATH (unweighted graph!):
═══════════════════════════════════════════════════════════════

  Grid with walls:

  ┌───┬───┬───┬───┬───┐
  │ S │ 1 │ 2 │ 3 │ 4 │
  ├───┼───┼───┼───┼───┤
  │   │███│███│███│ 5 │    ███ = wall!
  ├───┼───┼───┼───┼───┤
  │   │   │   │ 8 │ 6 │
  ├───┼───┼───┼───┼───┤
  │   │   │   │ 9 │ 7 │
  ├───┼───┼───┼───┼───┤
  │   │   │   │10 │ E │
  └───┴───┴───┴───┴───┘

  BFS with CSS order (top, right, bottom, left!):
  → S(0) → 1 → 2 → 3 → 4 → 5 → 6 → 7 →...→ E!

  → BFS naturally finds SHORTEST path!
  → "This is the basis of Dijkstra's." — Prime
  → "Then there's A star, even more fantastic.
     Then Jump Point Search, even more fantastic.
     Then Jump Point Search Plus..." — Prime

  Runtime: O(V + E) for both BFS and DFS!
  → "You have to visit everything, traverse every node.
     E is larger than V, so you just say E." — Prime
```

---

## §10. DFS — "Recursive Stack, Go Deep First!"

```
DFS ALGORITHM:
═══════════════════════════════════════════════════════════════

  Same graph:
    A ── B ── D ── E
    |         |    F
    C ─────── D    G
                   H ── I

  Start at A (recursive, top-to-bottom order!):

  visit(A) → mark A visited!
    visit(B) → mark B visited!
      visit(D) → mark D visited!
        visit(C) → already visited! skip!
        visit(E) → mark E visited! (no children!)
          ← back to D
        visit(F) → mark F visited!
          ← back to D
        visit(G) → mark G visited!
          ← back to D
        visit(H) → mark H visited!
          visit(I) → mark I visited!
            ← back to H
          ← back to D
        ← back to B
      ← back to A
    visit(C) → already visited! skip!
  DONE!

  Visit Order: A → B → D → E → F → G → H → I → (C skipped!)

  "DFS uses your recursive stack.
   You can technically just use a stack instead." — Prime
```

---

## §11. Topological Sort — "Post-Order DFS = Module Graph!"

> Prime: _"If I were to do depth-first search in post order traversal, I will actually come up with your module graph. This is known as topological sort."_

```
TOPOLOGICAL SORT:
═══════════════════════════════════════════════════════════════

  Module dependency graph (DIRECTED!):
  A → B, A → C
  B → D
  C → D (already visited when reached!)
  D → E, D → H, D → G, D → F
  H → I

  DFS POST-ORDER (add AFTER visiting all children!):

  visit(A)
    visit(B)
      visit(D)
        visit(E) → no children → push E!
        visit(H)
          visit(I) → no children → push I!
        → push H!
        visit(G) → no children → push G!
        visit(F) → no children → push F!
      → push D!
    → push B!
    visit(C) → D already visited! → push C!
  → push A!

  Result: [E, I, H, G, F, D, B, C, A]

  → REVERSED = build order!
  → Dependencies first, dependents last!

  "If you had to build Webpack really quickly,
   you might need to do a little topological sorting." — Prime


  IMPORTANT DISTINCTION:
  → A tree IS a directed acyclic graph (DAG!)
  → But not all DAGs are trees!

        A
       / \
      B   C     ← This is a DAG but NOT a tree!
       \ /        (because B→D and C→D!)
        D

  "Not all directed acyclic graphs are trees.
   It's the square rectangle thing." — Prime
```

---

## §12. Tự Code: Graph + BFS + DFS + Topological Sort

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 1: GRAPH REPRESENTATIONS
// ═══════════════════════════════════════════════════════════

// ═══ ADJACENCY LIST ═══
class AdjacencyList {
  constructor() {
    this.list = new Map();
  }

  addVertex(v) {
    if (!this.list.has(v)) this.list.set(v, []);
  }

  // Directed edge!
  addEdge(from, to, weight = 1) {
    this.addVertex(from);
    this.addVertex(to);
    this.list.get(from).push({ to, weight });
  }

  // Undirected edge!
  addUndirectedEdge(a, b, weight = 1) {
    this.addEdge(a, b, weight);
    this.addEdge(b, a, weight);
  }

  getNeighbors(v) {
    return this.list.get(v) || [];
  }

  getVertices() {
    return [...this.list.keys()];
  }
}

// ═══ ADJACENCY MATRIX ═══
class AdjacencyMatrix {
  constructor(size) {
    this.size = size;
    this.matrix = Array.from({ length: size }, () => new Array(size).fill(0));
    this.labels = new Map(); // vertex → index!
    this.nextIndex = 0;
  }

  addVertex(v) {
    if (!this.labels.has(v)) {
      this.labels.set(v, this.nextIndex++);
    }
  }

  addEdge(from, to, weight = 1) {
    this.addVertex(from);
    this.addVertex(to);
    const i = this.labels.get(from);
    const j = this.labels.get(to);
    this.matrix[i][j] = weight;
  }

  isConnected(from, to) {
    const i = this.labels.get(from);
    const j = this.labels.get(to);
    return this.matrix[i][j] !== 0; // O(1) lookup!
  }
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 2: BREADTH-FIRST SEARCH
// ═══════════════════════════════════════════════════════════

function bfs(graph, start) {
  const visited = new Set();
  const distances = new Map();
  const parent = new Map();
  const order = [];

  // Use array as queue (simple version!)
  const queue = [start];
  visited.add(start);
  distances.set(start, 0);
  parent.set(start, null);

  while (queue.length > 0) {
    const current = queue.shift(); // Dequeue!
    order.push(current);

    for (const { to } of graph.getNeighbors(current)) {
      if (!visited.has(to)) {
        visited.add(to);
        distances.set(to, distances.get(current) + 1);
        parent.set(to, current);
        queue.push(to); // Enqueue!
      }
    }
  }

  return { order, distances, parent };
}

// ═══ RECONSTRUCT SHORTEST PATH ═══
function shortestPath(parentMap, start, end) {
  const path = [];
  let current = end;

  while (current !== null) {
    path.unshift(current);
    current = parentMap.get(current);
  }

  // Check if path actually connects!
  if (path[0] !== start) return null; // No path!
  return path;
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 3: DEPTH-FIRST SEARCH
// ═══════════════════════════════════════════════════════════

function dfs(graph, start) {
  const visited = new Set();
  const order = [];

  function visit(node) {
    if (visited.has(node)) return;
    visited.add(node);
    order.push(node); // PRE-ORDER!

    for (const { to } of graph.getNeighbors(node)) {
      visit(to);
    }
  }

  visit(start);
  return order;
}

// ═══ DFS ITERATIVE (with explicit stack!) ═══
function dfsIterative(graph, start) {
  const visited = new Set();
  const order = [];
  const stack = [start];

  while (stack.length > 0) {
    const current = stack.pop();
    if (visited.has(current)) continue;

    visited.add(current);
    order.push(current);

    // Add neighbors in reverse for same order as recursive!
    const neighbors = graph.getNeighbors(current);
    for (let i = neighbors.length - 1; i >= 0; i--) {
      if (!visited.has(neighbors[i].to)) {
        stack.push(neighbors[i].to);
      }
    }
  }

  return order;
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 4: TOPOLOGICAL SORT (POST-ORDER DFS!)
// ═══════════════════════════════════════════════════════════

function topologicalSort(graph) {
  const visited = new Set();
  const result = [];

  function visit(node) {
    if (visited.has(node)) return;
    visited.add(node);

    for (const { to } of graph.getNeighbors(node)) {
      visit(to);
    }

    // POST-ORDER: add AFTER all children visited!
    result.push(node);
  }

  // Visit ALL vertices (handles disconnected components!)
  for (const v of graph.getVertices()) {
    visit(v);
  }

  // Reverse for dependency order!
  return result.reverse();
}

// ═══ CYCLE DETECTION (required for valid topo sort!) ═══
function hasCycle(graph) {
  const WHITE = 0; // Not visited!
  const GRAY = 1; // In current DFS path!
  const BLACK = 2; // Fully processed!
  const colors = new Map();

  for (const v of graph.getVertices()) colors.set(v, WHITE);

  function visit(node) {
    colors.set(node, GRAY);

    for (const { to } of graph.getNeighbors(node)) {
      if (colors.get(to) === GRAY) return true; // Back edge → CYCLE!
      if (colors.get(to) === WHITE && visit(to)) return true;
    }

    colors.set(node, BLACK);
    return false;
  }

  for (const v of graph.getVertices()) {
    if (colors.get(v) === WHITE && visit(v)) return true;
  }

  return false;
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 5: GRID BFS — SHORTEST PATH IN MAZE!
// ═══════════════════════════════════════════════════════════

function gridBFS(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({ length: rows }, () =>
    new Array(cols).fill(false),
  );
  const parent = Array.from({ length: rows }, () => new Array(cols).fill(null));

  // CSS ORDER! Top, Right, Bottom, Left! — Prime 😂
  const dirs = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  const queue = [start];
  visited[start[0]][start[1]] = true;

  while (queue.length > 0) {
    const [r, c] = queue.shift();

    // Found end!
    if (r === end[0] && c === end[1]) {
      // Reconstruct path!
      const path = [];
      let curr = end;
      while (curr) {
        path.unshift(curr);
        curr = parent[curr[0]][curr[1]];
      }
      return path;
    }

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;

      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        !visited[nr][nc] &&
        grid[nr][nc] !== 1
      ) {
        visited[nr][nc] = true;
        parent[nr][nc] = [r, c];
        queue.push([nr, nc]);
      }
    }
  }

  return null; // No path!
}

// Demo:
const maze = [
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0], // 1 = wall!
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];

const path = gridBFS(maze, [0, 0], [4, 4]);
console.log("Shortest path:", path);
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 6: DEMO
// ═══════════════════════════════════════════════════════════

// Build graph!
const g = new AdjacencyList();
g.addUndirectedEdge("A", "B");
g.addUndirectedEdge("A", "C");
g.addUndirectedEdge("B", "D");
g.addUndirectedEdge("C", "D");
g.addEdge("D", "E");
g.addEdge("D", "F");
g.addEdge("D", "G");
g.addEdge("D", "H");
g.addEdge("H", "I");

// BFS!
const bfsResult = bfs(g, "A");
console.log("BFS order:", bfsResult.order);
// A, B, C, D, E, F, G, H, I
console.log("Distance A→D:", bfsResult.distances.get("D")); // 2!
console.log("Shortest A→I:", shortestPath(bfsResult.parent, "A", "I"));

// DFS!
console.log("DFS order:", dfs(g, "A"));
// A, B, D, E, F, G, H, I, C (varies by neighbor order!)

// Topological sort (directed graph!)
const modules = new AdjacencyList();
modules.addEdge("A", "B");
modules.addEdge("A", "C");
modules.addEdge("B", "D");
modules.addEdge("C", "D");
modules.addEdge("D", "E");
modules.addEdge("D", "H");
modules.addEdge("D", "G");
modules.addEdge("D", "F");
modules.addEdge("H", "I");

console.log("Has cycle:", hasCycle(modules)); // false!
console.log("Topo sort:", topologicalSort(modules));
// [A, C, B, D, F, G, H, I, E] (one valid ordering!)

// Complexity:
// BFS: O(V + E) — visit every vertex, traverse every edge!
// DFS: O(V + E) — same!
// Topological Sort: O(V + E) — just DFS with post-order!
// Grid BFS: O(rows × cols)!
```

---

## Checklist

```
[ ] Graph = Vertices + Edges!
[ ] Directed = one-way! Undirected = both ways!
[ ] Weighted = cost per edge! Unweighted = all equal!
[ ] Connected component = can visit every node!
[ ] Adjacency List: O(V+E) space, O(degree) lookup!
[ ] Adjacency Matrix: O(V²) space, O(1) lookup!
[ ] BFS: Queue! → concentric rings → shortest path (unweighted!)
[ ] "CSS order: top, right, bottom, left!" — Prime
[ ] DFS: Stack (recursive)! → go deep first!
[ ] Topological Sort = POST-ORDER DFS on DAG!
[ ] "If you had to build Webpack, topological sorting!" — Prime
[ ] Cycle detection: GRAY node in current path = cycle!
[ ] Runtime: O(V + E) for both BFS and DFS!
TIẾP THEO → Phần 6: Spanning Trees & MST!
```
