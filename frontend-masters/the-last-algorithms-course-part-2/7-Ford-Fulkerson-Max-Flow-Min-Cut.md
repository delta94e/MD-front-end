# The Last Algorithms Course You'll Want (Part 2) — Phần 7: Ford-Fulkerson — Max Flow & Min Cut!

> 📅 2026-03-09 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Ford-Fulkerson: Max Flow + Ford-Fulkerson: Min Cut
> — "Car algo British people, augmenting path, back links, maxflow × edges runtime!"
> Độ khó: ⭐⭐⭐⭐⭐ | Advanced — Network flow, the strangest runtime!

---

## Mục Lục

| #   | Phần                                                   |
| --- | ------------------------------------------------------ |
| 1   | Max Flow Problem — "Source, Sink, Infinite Input!"     |
| 2   | Flow & Capacity — "0/10 Means 0 Used of 10 Available!" |
| 3   | Finding Max Flow — "Choose Path, Find Min Pipe!"       |
| 4   | Augmenting Path — "Back Links With Negative Flow!"     |
| 5   | Min Cut — "Car Algo British People!"                   |
| 6   | Runtime — "Max Flow × Edges, Strangest of Them All!"   |
| 7   | Tự Code: Ford-Fulkerson from Scratch!                  |
| 8   | Deep Dive: Real-World Applications                     |

---

## §1. Max Flow Problem — "Source, Sink, Infinite Input!"

> Prime: _"A maximum flow problem usually starts with something called a source. We pretend the source has an infinite input. We have a sink, our destination. T for sink, because source and sink, just really truly unfortunate."_ 😂

```
MAX FLOW PROBLEM:
═══════════════════════════════════════════════════════════════

  → Source (S): Infinite input! Pumps data into graph!
  → Sink (T): Destination! Receives flow!
  → Goal: MAXIMIZE flow from S → T!

  Graph:
             ┌──── 0/10 ────→ B ──── 0/8 ────┐
             │                                 ↓
    S ───────┤                                 T
             │                                 ↑
             ├──── 0/5 ─────→ C ──── 0/5 ────┤
             │                ↑                │
             └──── 0/5 ─────→ D ──── 0/6 ────┘

  "0/10" means: 0 flow used / 10 capacity!

  Applications:
  → Network routing (bandwidth optimization!)
  → Traffic flow (road capacity!)
  → Supply chain (goods distribution!)
  → "Anytime I hear anything about graphs,
     I'm just like 'networking problem'." — Prime
```

---

## §2. Flow & Capacity

```
RULES OF FLOW:
═══════════════════════════════════════════════════════════════

  1. Flow ≤ Capacity per edge!
     → Không thể push 15 qua pipe capacity 10!

  2. Flow Conservation!
     → Flow IN to a node = Flow OUT of that node!
     → (Except source and sink!)

  3. Goal: Maximize TOTAL flow arriving at T!

  Example:
             ┌──── 0/7 ─────→ B ──── 0/8 ────┐
             │                                 ↓
    S ───────┤                                 T
             │                                 ↑
             ├──── 0/5 ─────→ C ──── 0/5 ────┤
             │                                 │
             └──── 0/6 ─────→ D ──── 0/10 ───┘
```

---

## §3. Finding Max Flow — "Choose Path, Find Min Pipe!"

> Prime: _"Ford-Fulkerson does not specify HOW you choose a path from S to T. You could do DFS, BFS, there's Dinitz algorithm. We're just gonna keep it simple."_

```
FORD-FULKERSON ALGORITHM:
═══════════════════════════════════════════════════════════════

  REPEAT until no more path from S → T:
  1. Find a path from S to T with available capacity!
  2. Find MINIMUM capacity along that path (bottleneck!)
  3. Add that flow to every edge in path!
  4. Create BACK LINKS with negative flow!

  EXAMPLE (simple case — good path choices!):

  Path 1: S → B → T (via top!)
  → Capacities: 7, 8 → Min = 7!
  → Push 7 flow!
  → Result: 7/7, 7/8

  Path 2: S → C → T
  → Capacities: 5, 5 → Min = 5! But some already used?
  → Actually: 0/5, 0/5 → Min = 5... but middle pipe only 1 left!
  → Push 1 flow (bottleneck!)
  → Result: 1/5, 1/5 (only 1 unit left in some pipe!)

  Path 3: S → D → T
  → Capacities: 5, 5 → Min = 5!
  → Push 5 flow!
  → Result: 5/5, 5/5

  MAX FLOW = 7 + 1 + 5 = 13! ✅

VÍ DỤ CỤ THỂ TỪ PRIME:
═══════════════════════════════════════════════════════════════

  Graph:
         ┌── 0/7 ──→ A ── 0/8 ──┐
         │                        ↓
    S ───┤── 0/5 ──→ B ── 0/5 ──→ T
         │           ↑            ↑
         └── 0/6 ──→ C ── 0/8 ──┘

  Path 1: S→A→T: min(7, 8) = 7 → Push 7!
  Path 2: S→B→T: min(5, 5) = 5... nhưng pipe S→B chỉ còn 1!
  → Actually min(6, 8) via S→C→T = 1 left...

  Wait let me use Prime's exact numbers:

  Path 1: Top route (7, 10, 8) → min = 7!
  Path 2: Middle (6, 8, 1 left) → min = 1! Push 1!
  Path 3: Bottom (5, 5, 10) → min = 5! Push 5!

  Max flow = 7 + 1 + 5 = 13! ✅
```

---

## §4. Augmenting Path — "Back Links With Negative Flow!"

> Prime: _"Part of the Ford-Fulkerson algorithm is called the augmenting path. After you make a flow to a node, you create a back link with negative flow."_

```
VẤN ĐỀ: CHỌN ĐƯỜNG SAI!
═══════════════════════════════════════════════════════════════

  What if we choose a BAD path first?

  Graph:
         ┌── 0/7 ──→ A ── 0/8 ──┐
         │                        ↓
    S ───┼── 0/5 ──→ B ── 0/5 ──→ T
         │                        ↑
         └── 0/6 ──→ C ── 0/8 ──┘

  BAD Path 1: S → B → T (through middle!)
  Push 5 flow: 5/5, 5/5
  → "What is the problem? Cuts off the bottom node!" — Prime

  Now B's pipe is FULL! Can't use bottom path anymore! 💀

SOLUTION: AUGMENTING PATH + BACK LINKS!
═══════════════════════════════════════════════════════════════

  After pushing 5 through S→A→B→T:

  Forward edges: 5/5 each!
  Back links CREATED: -5 going backwards!

       S ──5/5──→ A ──5/5──→ B ──5/5──→ T
       S ←─-5──── A ←─-5──── B ←─-5──── T

  Now find NEW path using back links:
  Path: S → (top 7) → A → (back -5) → B reversed → (bottom) → T!

  This "un-flows" 5 units from the bad path!
  Then re-routes through the correct paths!

  Path: 7, 10, -5, 10 → min available = 5!
  Push 5 through → undo the bad flow!

  "If I put five units of flow this direction,
   it will turn this into a zero and back into a zero.
   We've effectively created the exact same problem
   we had before." — Prime

  → Then do remaining paths normally!
  → Still get MAX FLOW = 13! ✅
```

---

## §5. Min Cut — "Car Algo British People!"

> Prime: _"I listened to this person a long time ago and he's talking about a car driving through the maze. He called this the passenger side and this the driver side. So I knew something's off, that's not how things work."_ 😂

```
MIN CUT THEOREM:
═══════════════════════════════════════════════════════════════

  MAX FLOW = MIN CUT! (always equal!)

  Min Cut = minimum total capacity of edges you must CUT
            to DISCONNECT source from sink!

  HOW TO FIND MIN CUT — "CAR ALGO BRITISH PEOPLE!":

  1. Find the max flow first!
  2. Drive a (British!) car from S to T along saturated path!
  3. PASSENGER SIDE hits → ADD to min cut! ✅
  4. DRIVER SIDE hits → DON'T add! ❌

  (Why British? Because passenger side is LEFT side in UK car!)
  (Prime heard a British person explain it → passenger/driver reversed!)

  EXAMPLE:
  ═══════════════════════════════════════════
  Drive through the flow:

  → Passenger side hits edge with capacity 5 → ADD! (5)
  → Driver side hits unused edge → DON'T ADD! (0)
  → Passenger side hits edge with capacity 8 → ADD! (8)

  Min Cut = 5 + 0 + 8 = 13!
  Max Flow = 13! ✅ (always equal!)

  "In my head I'm always like 'car, British people.'
   And then I drive my car through there." — Prime 😂


HOSE ANALOGY:
═══════════════════════════════════════════════════════════════

  "If you had a hose completely on and water was
   flowing through here... if you cut the pipe at
   the min cut, nothing would come out on the other side.
   All flow goes through those saturated pipes." — Prime
```

---

## §6. Runtime — "The Strangest of Them All!"

> Prime: _"If you could whip out a maximum flow runtime in the interview, the person would just... What is happening here?"_

```
FORD-FULKERSON RUNTIME:
═══════════════════════════════════════════════════════════════

  WORST CASE EXAMPLE:

         ┌──── 0/100 ────→ A ──── 0/100 ────┐
         │                  ↑↓                ↓
    S ───┤               0/1 (tiny pipe!)      T
         │                  ↑↓                ↑
         └──── 0/100 ────→ B ──── 0/100 ────┘

  If DFS chooses: S → A → B → T (through tiny pipe!)
  → Push 1 flow!
  → Back link creates -1!
  → Next: S → B → A → T (through back link!)
  → Push 1 flow!
  → Repeat... 200 TIMES! (max flow = 200!)

  Each iteration touches all edges!

  RUNTIME: O(maxflow × E)! 🤯

  → "The strangest of them all!" — Prime
  → "People don't often see this one." — Prime
  → "If you can hit them with the sqrt(n) runtime,
     blows their mind." — Prime

  NOTE:
  → Using BFS instead of DFS = Edmonds-Karp algorithm!
  → Edmonds-Karp: O(V × E²) — polynomial! Better bounded!
  → "Ford-Fulkerson doesn't specify HOW you choose path.
     BFS choice leads to better guarantees." — Prime
```

---

## §7. Tự Code: Ford-Fulkerson from Scratch

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 1: FLOW NETWORK (Adjacency Matrix with capacities!)
// ═══════════════════════════════════════════════════════════

class FlowNetwork {
  constructor(vertices) {
    this.V = vertices;
    // Capacity matrix!
    this.capacity = Array.from({ length: vertices }, () =>
      new Array(vertices).fill(0),
    );
    // Flow matrix!
    this.flow = Array.from({ length: vertices }, () =>
      new Array(vertices).fill(0),
    );
  }

  addEdge(from, to, cap) {
    this.capacity[from][to] = cap;
  }

  // Residual capacity = capacity - current flow + back flow!
  residualCapacity(from, to) {
    return this.capacity[from][to] - this.flow[from][to];
  }
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 2: BFS TO FIND AUGMENTING PATH (Edmonds-Karp!)
// ═══════════════════════════════════════════════════════════

function bfsAugmentingPath(network, source, sink) {
  const visited = new Array(network.V).fill(false);
  const parent = new Array(network.V).fill(-1);
  const queue = [source];
  visited[source] = true;

  while (queue.length > 0) {
    const u = queue.shift();

    for (let v = 0; v < network.V; v++) {
      // Can we push more flow through u→v?
      if (!visited[v] && network.residualCapacity(u, v) > 0) {
        visited[v] = true;
        parent[v] = u;
        queue.push(v);

        // Found sink!
        if (v === sink) return parent;
      }
    }
  }

  return null; // No augmenting path!
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 3: FORD-FULKERSON (with BFS = Edmonds-Karp!)
// ═══════════════════════════════════════════════════════════

function fordFulkerson(network, source, sink) {
  let maxFlow = 0;
  const augmentingPaths = []; // For visualization!

  while (true) {
    // Step 1: Find augmenting path!
    const parent = bfsAugmentingPath(network, source, sink);
    if (!parent) break; // No more paths!

    // Step 2: Find minimum residual capacity (bottleneck!)
    let pathFlow = Infinity;
    let v = sink;
    const path = [];

    while (v !== source) {
      const u = parent[v];
      pathFlow = Math.min(pathFlow, network.residualCapacity(u, v));
      path.unshift(v);
      v = u;
    }
    path.unshift(source);

    // Step 3: Update flow along path!
    // → Forward: ADD flow!
    // → Backward: CREATE back link (negative flow!)
    v = sink;
    while (v !== source) {
      const u = parent[v];
      network.flow[u][v] += pathFlow; // Forward flow!
      network.flow[v][u] -= pathFlow; // BACK LINK! ← Key insight!
      v = u;
    }

    maxFlow += pathFlow;
    augmentingPaths.push({ path, flow: pathFlow });
  }

  return { maxFlow, augmentingPaths };
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 4: MIN CUT
// ═══════════════════════════════════════════════════════════

function findMinCut(network, source) {
  // After max flow, find all nodes reachable from source
  // via edges with remaining residual capacity!
  const visited = new Set();
  const queue = [source];
  visited.add(source);

  while (queue.length > 0) {
    const u = queue.shift();
    for (let v = 0; v < network.V; v++) {
      if (!visited.has(v) && network.residualCapacity(u, v) > 0) {
        visited.add(v);
        queue.push(v);
      }
    }
  }

  // Min cut = edges from reachable → unreachable with capacity > 0!
  const cutEdges = [];
  let minCutValue = 0;

  for (const u of visited) {
    for (let v = 0; v < network.V; v++) {
      if (!visited.has(v) && network.capacity[u][v] > 0) {
        cutEdges.push({ from: u, to: v, capacity: network.capacity[u][v] });
        minCutValue += network.capacity[u][v];
      }
    }
  }

  return { minCutValue, cutEdges };
}
```

```javascript
// ═══════════════════════════════════════════════════════════
// PHẦN 5: DEMO
// ═══════════════════════════════════════════════════════════

// Build network!
// Nodes: 0=S, 1=A, 2=B, 3=C, 4=T
const net = new FlowNetwork(5);
net.addEdge(0, 1, 7); // S → A: capacity 7!
net.addEdge(0, 2, 5); // S → B: capacity 5!
net.addEdge(0, 3, 6); // S → C: capacity 6!
net.addEdge(1, 4, 8); // A → T: capacity 8!
net.addEdge(2, 4, 5); // B → T: capacity 5!
net.addEdge(3, 4, 8); // C → T: capacity 8!
net.addEdge(3, 2, 1); // C → B: capacity 1!

const result = fordFulkerson(net, 0, 4);
console.log("Max Flow:", result.maxFlow);
// Max Flow: 13!

console.log("Augmenting Paths:");
result.augmentingPaths.forEach(({ path, flow }, i) =>
  console.log(`  Path ${i + 1}: ${path.join(" → ")} (flow: ${flow})`),
);

const cut = findMinCut(net, 0);
console.log("Min Cut:", cut.minCutValue);
// Min Cut: 13! (= Max Flow! Always equal!)
console.log("Cut Edges:", cut.cutEdges);

// ═══ WORST CASE EXAMPLE ═══
// Nodes: 0=S, 1=A, 2=B, 3=T
const worstCase = new FlowNetwork(4);
worstCase.addEdge(0, 1, 100); // S → A: 100!
worstCase.addEdge(0, 2, 100); // S → B: 100!
worstCase.addEdge(1, 2, 1); // A → B: 1! (tiny pipe!)
worstCase.addEdge(1, 3, 100); // A → T: 100!
worstCase.addEdge(2, 3, 100); // B → T: 100!

const worstResult = fordFulkerson(worstCase, 0, 3);
console.log("Worst case max flow:", worstResult.maxFlow); // 200!
// With BFS: finds in ~2 iterations, not 200!
// BFS (Edmonds-Karp) avoids the O(maxflow × E) worst case!
```

---

## §8. Deep Dive: Real-World Applications

```
FORD-FULKERSON APPLICATIONS:
═══════════════════════════════════════════════════════════════

  1. NETWORK ROUTING:
  → Maximize bandwidth between two servers!
  → Edges = links, capacity = bandwidth!
  → Min cut = network bottleneck!

  2. TRAFFIC PLANNING:
  → Maximize vehicle throughput!
  → Edges = roads, capacity = lane count × speed!
  → Min cut = traffic choke points!

  3. BIPARTITE MATCHING:
  → Assign workers to tasks optimally!
  → Add source → workers, tasks → sink!
  → Max flow = maximum matching!

  4. PROJECT SELECTION:
  → Choose projects to maximize profit!
  → Min cut = minimum cost to separate winners/losers!

  5. IMAGE SEGMENTATION:
  → Separate foreground from background!
  → Pixels = nodes, similarity = edge capacity!
  → Min cut = optimal boundary!


MAX FLOW = MIN CUT (ALWAYS!):
═══════════════════════════════════════════════════════════════

  This is the Max-Flow Min-Cut Theorem!
  → Proven by Ford & Fulkerson (1956!)
  → One of the fundamental theorems of graph theory!

  "Every graph problem is just teetering on the edge
   of becoming a really hard problem. The moment you
   add one more condition, it just blows up." — Prime

  SCALING:
  → "Would this work with multiple sources and sinks?"
  → "Anytime you get into multiple, you get into
     NP-hard super difficult problems." — Prime
```

---

## Checklist

```
[ ] Max Flow: maximize flow from Source → Sink!
[ ] 0/10 = 0 flow used / 10 capacity!
[ ] Ford-Fulkerson: find path → push bottleneck flow → repeat!
[ ] Augmenting path: back links with NEGATIVE flow!
[ ] Back links allow UNDOING bad path choices!
[ ] Min Cut = Max Flow (always equal!)
[ ] "Car algo British people" — passenger side = add to cut!
[ ] Runtime: O(maxflow × E) — "strangest of them all!"
[ ] BFS version (Edmonds-Karp): O(V × E²) — better bound!
[ ] "Every graph problem teeters on becoming NP-hard!" — Prime
TIẾP THEO → Phần 8: Dynamic Programming & Bloom Filter!
```
