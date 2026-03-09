# The Last Algorithms Course You'll Need — Phần 52: Implement DFS on Adjacency List — "walk(), Pre=Push, Post=Pop, Same as Maze Solver!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implement DFS on Adjacency List — "walk() recursive, pre=push path, post=pop path, same as maze solver, return true/false, running time O(V+E)!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Implementation — DFS with path, pre/post for push/pop, identical to maze solver!

---

## Mục Lục

| #   | Phần                                          |
| --- | --------------------------------------------- |
| 1   | "Same as Maze Solver!" — Identical Structure! |
| 2   | walk() — "Base Cases + Pre/Recurse/Post!"     |
| 3   | Base Cases — "Found Needle or Already Seen!"  |
| 4   | Pre = Push, Post = Pop — "Maintain Path!"     |
| 5   | Recursive Step — "Walk Each Edge!"            |
| 6   | Running Time — "O(V + E)!"                    |
| 7   | Tự Implement: DFS on Adjacency List           |

---

## §1. "Same as Maze Solver!" — Identical Structure!

> Prime: _"The maze solver and this problem are ALMOST IDENTICAL. You'll notice this really is starting to look exactly the same."_

```
MAZE SOLVER:                   DFS ON GRAPH:
walk(maze, curr, wall,         walk(graph, curr,
     needle, seen, path)            needle, seen, path)

Same signature! Same logic!
```

---

## §2. walk() — "Base Cases + Pre/Recurse/Post!"

```typescript
function walk(
  graph: WeightedAdjacencyList,
  curr: number,
  needle: number,
  seen: boolean[],
  path: number[],
): boolean {
  // BASE CASES
  // PRE (push)
  // RECURSE (walk edges)
  // POST (pop)
}
```

---

## §3. Base Cases — "Found Needle or Already Seen!"

```typescript
// Found it!
if (curr === needle) {
  path.push(curr); // don't forget to add needle!
  return true;
}

// Already visited!
if (seen[curr]) return false;
```

---

## §4. Pre = Push, Post = Pop — "Maintain Path!"

> Prime: _"Pre: we push into our path. Post: we pop from our path. As long as we push and pop, it will always maintain the order."_

```typescript
// PRE: visiting this node!
seen[curr] = true;
path.push(curr);

// ... recurse ...

// POST: this path didn't work, remove node!
path.pop();
return false;
```

```
PRE/POST PATH MANAGEMENT:
═══════════════════════════════════════════════════════════════

  Visit node 0: path = [0]         ← PRE push!
  Visit node 3: path = [0, 3]     ← PRE push!
  Visit node 1: path = [0, 3, 1]  ← PRE push!
  Dead end!:    path = [0, 3]      ← POST pop!
  Visit node 2: path = [0, 3, 2]  ← PRE push!
  Found needle! Return true!
  Path preserved: [0, 3, 2] ✅
```

---

## §5. Recursive Step — "Walk Each Edge!"

```typescript
const list = graph[curr]; // list of edges!

for (let i = 0; i < list.length; i++) {
  const edge = list[i];

  if (walk(graph, edge.to, needle, seen, path)) {
    return true; // found it down this path!
  }
}

// POST: none of the edges found needle
path.pop();
return false;
```

### Complete function!

```typescript
function walk(
  graph: WeightedAdjacencyList,
  curr: number,
  needle: number,
  seen: boolean[],
  path: number[],
): boolean {
  if (curr === needle) {
    path.push(curr);
    return true;
  }

  if (seen[curr]) return false;

  // PRE
  seen[curr] = true;
  path.push(curr);

  // RECURSE
  const list = graph[curr];
  for (let i = 0; i < list.length; i++) {
    const edge = list[i];
    if (walk(graph, edge.to, needle, seen, path)) {
      return true;
    }
  }

  // POST
  path.pop();
  return false;
}
```

---

## §6. Running Time — "O(V + E)!"

> Prime: _"We check every vertex once and every edge once. So it's O(V + E)."_

```
RUNNING TIME:
═══════════════════════════════════════════════════════════════

  V = vertices (nodes)
  E = edges (connections)

  Every node visited at most ONCE (seen array!)
  Every edge checked at most ONCE!
  Total: O(V + E)!
```

---

## §7. Tự Implement: DFS on Adjacency List

```javascript
// ═══ DFS on Weighted Adjacency List ═══

function walk(graph, curr, needle, seen, path) {
  // Base: found!
  if (curr === needle) {
    path.push(curr);
    return true;
  }

  // Base: already seen!
  if (seen[curr]) return false;

  // PRE: push to path!
  seen[curr] = true;
  path.push(curr);

  // RECURSE: walk each edge!
  const list = graph[curr];
  for (let i = 0; i < list.length; i++) {
    const edge = list[i];
    if (walk(graph, edge.to, needle, seen, path)) {
      return true; // found down this branch!
    }
  }

  // POST: dead end, pop!
  path.pop();
  return false;
}

function dfs(graph, source, needle) {
  const seen = new Array(graph.length).fill(false);
  const path = [];

  walk(graph, source, needle, seen, path);

  if (path.length === 0) return null;
  return path;
}

// Adjacency list (weighted)
const graph = [
  // Node 0
  [
    { to: 2, weight: 4 },
    { to: 3, weight: 2 },
  ],
  // Node 1
  [{ to: 4, weight: 1 }],
  // Node 2
  [{ to: 4, weight: 5 }],
  // Node 3
  [
    { to: 1, weight: 5 },
    { to: 4, weight: 1 },
  ],
  // Node 4
  [],
];

console.log("═══ DFS ON ADJACENCY LIST ═══\n");
console.log("Graph:");
console.log("  0 → 2(4), 3(2)");
console.log("  1 → 4(1)");
console.log("  2 → 4(5)");
console.log("  3 → 1(5), 4(1)");
console.log("  4 → (terminal)");

console.log("\nDFS 0→4:", dfs(graph, 0, 4)); // [0, 2, 4] or [0, 3, 1, 4]
console.log("DFS 0→1:", dfs(graph, 0, 1)); // [0, 3, 1]
console.log("DFS 0→0:", dfs(graph, 0, 0)); // [0]

console.log("\n═══ PRE/POST ═══");
console.log("PRE:  seen[curr]=true, path.push(curr)");
console.log("POST: path.pop(), return false");
console.log("Found: path.push(needle), return true");

console.log("\n✅ Same as maze solver!");
console.log("✅ Running time: O(V + E)");
```

---

## Checklist

```
[ ] walk(): same structure as maze solver!
[ ] Base case 1: curr === needle → push + return true!
[ ] Base case 2: seen[curr] → return false!
[ ] PRE: seen=true, path.push(curr)!
[ ] RECURSE: for each edge, walk(edge.to)!
[ ] POST: path.pop(), return false!
[ ] Return true up the stack when found!
[ ] Running time: O(V + E)!
[ ] DFS on list vs BFS on matrix: same concepts, different details!
TIẾP THEO → Phần 53: Dijkstra's Shortest Path!
```
