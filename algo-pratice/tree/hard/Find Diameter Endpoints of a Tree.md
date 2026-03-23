# 🔭 Find Diameter Endpoints of a Tree — LeetCode #3787 (Hard)

> 📖 Code: [Find Diameter Endpoints of a Tree.js](./Find%20Diameter%20Endpoints%20of%20a%20Tree.js)

---

## R — Repeat & Clarify

🧠 *"2 BFS! BFS1 từ bất kỳ → tìm endpoint A. BFS2 từ A → tìm endpoint B. A,B = diameter."*

> 🎙️ *"Find the two endpoints of the longest path (diameter) in an unweighted tree."*

---

## E — Examples

```
  0 — 1 — 2 — 3 — 4
              |
              5

  BFS from 0: farthest = 4 (dist=4) → endpoint A = 4
  BFS from 4: farthest = 0 (dist=4) → endpoint B = 0
  Diameter = 4, endpoints = [4, 0] ✅
```

---

## A — Approach

> 🎙️ *"Two BFS passes:*
> *1. BFS from ANY node → the farthest node MUST be a diameter endpoint (provable!).*
> *2. BFS from that endpoint → the farthest node is the OTHER endpoint.*
>
> *Why is the farthest from ANY node always a diameter endpoint? Proof by contradiction: if it weren't, there would exist a longer path, contradicting maximality."*

```
PROOF SKETCH:

  Assume: farthest node from arbitrary start S is NOT a diameter endpoint.
  Let D be the diameter with endpoints A, B.
  
  Case 1: path S→farthest intersects path A→B
  → We can construct a path longer than A→B. Contradiction!
  
  Case 2: paths don't intersect
  → The farthest distance from S must be ≥ half the diameter.
  Combined with the non-endpoint assumption, we again get contradiction.
  
  Therefore: farthest from any node IS a diameter endpoint! QED
```

---

## C — Code

```javascript
function findDiameterEndpoints(n, edges) {
  const adj = Array.from({length: n}, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  
  function bfs(start) {
    const dist = new Array(n).fill(-1);
    dist[start] = 0;
    const queue = [start];
    let farthest = start;
    
    while (queue.length > 0) {
      const node = queue.shift();
      for (const nb of adj[node]) {
        if (dist[nb] === -1) {
          dist[nb] = dist[node] + 1;
          queue.push(nb);
          if (dist[nb] > dist[farthest]) farthest = nb;
        }
      }
    }
    return [farthest, dist[farthest]];
  }
  
  const [endA] = bfs(0);           // any start → find endpoint A
  const [endB, diameter] = bfs(endA); // from A → find endpoint B
  return [endA, endB, diameter];
}
```

---

## O — Optimize

```
Time:  O(n) — 2 BFS = 2n
Space: O(n) — dist array + queue

Can also find diameter path by tracking parents during BFS2!
```

---

## 🗣️ Interview Script

> 🎙️ *"Two BFS. First from any node finds one endpoint (farthest is always a diameter endpoint — provable!). Second BFS from that endpoint finds the other. O(n). To reconstruct the actual path, track parent pointers during the second BFS."*

### Pattern

```
TREE DIAMETER VARIATIONS:
  Binary tree: DFS, return height, track leftH+rightH → #543
  General tree: 2 BFS → this problem (#3787)
  With endpoints: 2 BFS + parent tracking
  Weighted:      2 DFS/BFS with weighted distances
```
