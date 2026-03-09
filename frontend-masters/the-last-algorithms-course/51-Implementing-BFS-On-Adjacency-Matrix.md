# The Last Algorithms Course You'll Need — Phần 51: Implementing BFS on Adjacency Matrix — "seen[], prev[], Walk Backwards, Return null!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implementing BFS on Adjacency Matrix — "Setup seen+prev, while queue, check adjacencies, skip 0 and seen, build path backwards, concat source, return null if no path!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Implementation — BFS on weighted adjacency matrix, path reconstruction!

---

## Mục Lục

| #   | Phần                                              |
| --- | ------------------------------------------------- |
| 1   | Setup — "seen[], prev[], Q = [source]!"           |
| 2   | The Loop — "While Queue, Pop, Check Adjacencies!" |
| 3   | Adjacency Check — "0 = No Edge, Skip Seen!"       |
| 4   | Build Path Backwards — "prev[curr] Until -1!"     |
| 5   | "Return null If No Path!" — Interface Gotcha!     |
| 6   | Tự Implement: BFS on Adjacency Matrix             |

---

## §1. Setup — "seen[], prev[], Q = [source]!"

```typescript
const seen = new Array(graph.length).fill(false);
const prev = new Array(graph.length).fill(-1);

seen[source] = true; // already in queue!
const q: number[] = [source];
```

---

## §2. The Loop — "While Queue, Pop, Check Adjacencies!"

```typescript
while (q.length) {
  const curr = q.shift() as number;

  if (curr === needle) break; // found it!

  const adjacencies = graph[curr]; // row = our connections!

  for (let i = 0; i < adjacencies.length; i++) {
    if (adjacencies[i] === 0) continue; // no edge!
    if (seen[i]) continue; // already visited!

    seen[i] = true;
    prev[i] = curr; // who added me!
    q.push(i);
  }
}
```

```
MATRIX ROW = CONNECTIONS:
═══════════════════════════════════════════════════════════════

  graph[0] = [0, 10, 0, 5]
              ↑   ↑  ↑  ↑
              0→0  0→1 0→2 0→3
              no!  10! no!  5!

  "Anything non-zero is a connection!" — Prime
```

---

## §3. Adjacency Check — "0 = No Edge, Skip Seen!"

```
FOR EACH COLUMN IN ROW:
═══════════════════════════════════════════════════════════════

  adjacencies[i] === 0  → no connection, continue!
  seen[i] === true      → already visited, continue!
  else:
    seen[i] = true       → mark visited!
    prev[i] = curr       → record parent!
    q.push(i)            → add to queue!
```

---

## §4. Build Path Backwards — "prev[curr] Until -1!"

```typescript
// If needle was never reached
if (prev[needle] === -1) return null;

// Build path backwards!
let curr = needle;
const out: number[] = [];

while (prev[curr] !== -1) {
  out.push(curr);
  curr = prev[curr];
}

return [source, ...out.reverse()];
```

> Prime: _"Did we add our source? No! Source has parent -1, we stop before adding it. So we concat source at the beginning."_

---

## §5. "Return null If No Path!" — Interface Gotcha!

> Prime: _"It wanted us to return null. Who wrote that interface to begin with?"_ 😂

---

## §6. Tự Implement: BFS on Adjacency Matrix

```javascript
// ═══ BFS on Weighted Adjacency Matrix ═══

function bfs(graph, source, needle) {
  const seen = new Array(graph.length).fill(false);
  const prev = new Array(graph.length).fill(-1);

  seen[source] = true;
  const q = [source];

  while (q.length) {
    const curr = q.shift();

    if (curr === needle) break;

    const adjacencies = graph[curr];
    for (let i = 0; i < adjacencies.length; i++) {
      if (adjacencies[i] === 0) continue; // no edge!
      if (seen[i]) continue; // already seen!

      seen[i] = true;
      prev[i] = curr;
      q.push(i);
    }
  }

  // No path found!
  if (prev[needle] === -1) return null;

  // Build path backwards!
  const out = [];
  let curr = needle;
  while (prev[curr] !== -1) {
    out.push(curr);
    curr = prev[curr];
  }

  return [source, ...out.reverse()];
}

// Adjacency matrix (weighted)
//        0    1    2    3    4
const graph = [
  [0, 0, 4, 2, 0], // 0 → 2(4), 3(2)
  [0, 0, 0, 0, 1], // 1 → 4(1)
  [0, 0, 0, 0, 5], // 2 → 4(5)
  [0, 5, 0, 0, 1], // 3 → 1(5), 4(1)
  [0, 0, 0, 0, 0], // 4 → (terminal)
];

console.log("═══ BFS ON ADJACENCY MATRIX ═══\n");
console.log("Graph:");
console.log("  (0)→(2) w=4    (0)→(3) w=2");
console.log("  (3)→(1) w=5    (3)→(4) w=1");
console.log("  (1)→(4) w=1    (2)→(4) w=5");

console.log("\nBFS 0→4:", bfs(graph, 0, 4)); // [0, 3, 4] or [0, 2, 4]
console.log("BFS 0→1:", bfs(graph, 0, 1)); // [0, 3, 1]
console.log("BFS 0→0:", bfs(graph, 0, 0)); // null (already at source)

console.log("\n✅ seen[] prevents revisiting!");
console.log("✅ prev[] tracks path backwards!");
console.log("✅ Walk prev[] from needle → source, then reverse!");
```

---

## Checklist

```
[ ] Setup: seen[]=false, prev[]=-1, Q=[source]!
[ ] seen[source]=true before loop!
[ ] While Q: shift, check needle, iterate adjacencies!
[ ] Skip: adjacency===0 (no edge) or seen (visited)!
[ ] Mark seen, set prev, push to queue!
[ ] Break when curr===needle!
[ ] Build path: walk prev[] from needle to source!
[ ] Don't forget source (prev[source]=-1)!
[ ] Return null if no path!
TIẾP THEO → Phần 52: Implement DFS on Adjacency List!
```
