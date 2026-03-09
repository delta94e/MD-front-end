# The Last Algorithms Course You'll Need — Phần 54: Implement Dijkstra's Shortest Path — "hasUnvisited, getLowest, 63 Lines!"

> 📅 2026-03-09 · ⏱ 20 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Implement Dijkstra's — "hasUnvisited (seen.some), getLowestUnvisited (scan dist[]), while loop, update dist+prev, walk prev backwards, intentionally slow version!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Implementation — full Dijkstra's, helper functions, path reconstruction!

---

## Mục Lục

| #   | Phần                                                  |
| --- | ----------------------------------------------------- |
| 1   | Helper: hasUnvisited — "seen.some + dist < ∞!"        |
| 2   | Helper: getLowestUnvisited — "Scan for Min Distance!" |
| 3   | Main Algorithm — "While Unvisited, Update Edges!"     |
| 4   | Walk Backwards — "prev[needle] → source!"             |
| 5   | Tự Implement: Dijkstra's Shortest Path                |

---

## §1. Helper: hasUnvisited — "seen.some + dist < ∞!"

```javascript
function hasUnvisited(seen, dists) {
  return seen.some((s, i) => !s && dists[i] < Infinity);
}
```

> Prime: _"If it's not seen AND its distance is less than infinity, we have something to visit."_

---

## §2. Helper: getLowestUnvisited — "Scan for Min Distance!"

```javascript
function getLowestUnvisited(seen, dists) {
  let idx = -1;
  let lowestDist = Infinity;

  for (let i = 0; i < seen.length; i++) {
    if (seen[i]) continue;

    if (dists[i] < lowestDist) {
      lowestDist = dists[i];
      idx = i;
    }
  }

  return idx;
}
```

---

## §3. Main Algorithm — "While Unvisited, Update Edges!"

```javascript
// For each unvisited node:
while (hasUnvisited(seen, dists)) {
  const curr = getLowestUnvisited(seen, dists);
  seen[curr] = true;

  const adjs = graph[curr]; // adjacency list!
  for (let i = 0; i < adjs.length; i++) {
    const edge = adjs[i];
    if (seen[edge.to]) continue;

    const dist = dists[curr] + edge.weight;
    if (dist < dists[edge.to]) {
      dists[edge.to] = dist;
      prev[edge.to] = curr;
    }
  }
}
```

---

## §4. Walk Backwards — "prev[needle] → source!"

```javascript
const out = [];
let curr = needle;

while (prev[curr] !== -1) {
  out.push(curr);
  curr = prev[curr];
}

out.push(source);
return out.reverse();
```

---

## §5. Tự Implement: Dijkstra's Shortest Path

```javascript
// ═══ Dijkstra's Shortest Path ═══

function hasUnvisited(seen, dists) {
  return seen.some((s, i) => !s && dists[i] < Infinity);
}

function getLowestUnvisited(seen, dists) {
  let idx = -1;
  let lowestDist = Infinity;

  for (let i = 0; i < seen.length; i++) {
    if (seen[i]) continue;
    if (dists[i] < lowestDist) {
      lowestDist = dists[i];
      idx = i;
    }
  }
  return idx;
}

function dijkstra(graph, source, needle) {
  const seen = new Array(graph.length).fill(false);
  const dists = new Array(graph.length).fill(Infinity);
  const prev = new Array(graph.length).fill(-1);

  dists[source] = 0;

  while (hasUnvisited(seen, dists)) {
    const curr = getLowestUnvisited(seen, dists);
    seen[curr] = true;

    const adjs = graph[curr];
    for (let i = 0; i < adjs.length; i++) {
      const edge = adjs[i];
      if (seen[edge.to]) continue;

      const dist = dists[curr] + edge.weight;
      if (dist < dists[edge.to]) {
        dists[edge.to] = dist;
        prev[edge.to] = curr;
      }
    }
  }

  // Build path backwards!
  const out = [];
  let curr = needle;

  while (prev[curr] !== -1) {
    out.push(curr);
    curr = prev[curr];
  }

  out.push(source);
  return out.reverse();
}

// Graph (adjacency list)
const graph = [
  [
    { to: 1, weight: 1 },
    { to: 2, weight: 5 },
  ], // 0
  [{ to: 3, weight: 7 }], // 1
  [{ to: 4, weight: 1 }], // 2
  [{ to: 4, weight: 6 }], // 3
  [], // 4
];

console.log("═══ DIJKSTRA'S SHORTEST PATH ═══\n");
console.log("Path 0→4:", dijkstra(graph, 0, 4)); // [0, 2, 4] dist=6
console.log("Path 0→3:", dijkstra(graph, 0, 3)); // [0, 1, 3] dist=8

console.log("\n✅ 63 lines of code including whitespace!");
console.log("✅ Intentionally slow — V² version!");
```

---

## Checklist

```
[ ] hasUnvisited: !seen AND dist < Infinity!
[ ] getLowestUnvisited: scan all, find min dist unseen!
[ ] Setup: seen[]=false, dists[]=∞, prev[]=-1!
[ ] dists[source] = 0!
[ ] While unvisited: get lowest, mark seen!
[ ] For each edge: skip seen, calc dist, update if shorter!
[ ] Walk prev[] backwards, push source, reverse!
[ ] "Intentionally slow version" — for learning! — Prime
TIẾP THEO → Phần 55: Dijkstra's Shortest Path Run Time!
```
