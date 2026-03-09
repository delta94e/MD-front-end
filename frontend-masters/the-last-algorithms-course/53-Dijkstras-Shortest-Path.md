# The Last Algorithms Course You'll Need — Phần 53: Dijkstra's Shortest Path — "Greedy Algorithm, dist[], prev[], Get Lowest Unseen!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — ThePrimeagen
> Bài: Dijkstra's Shortest Path — "Shortest path from one node to ALL other nodes, greedy algorithm, dist[]=∞ except source=0, get lowest unseen, update distances, non-negative weights only!"
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Core — Dijkstra's algorithm, greedy approach, distance array, path reconstruction!

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | What Is Dijkstra's? — "Shortest Path, One to All!"   |
| 2   | The Greedy Idea — "Next Shortest is Always Correct!" |
| 3   | Three Arrays — "seen[], dist[], prev[]!"             |
| 4   | The Algorithm — "Get Lowest, Update Neighbors!"      |
| 5   | Walkthrough — "0→2→4 = 6, Not 0→1→3→4 = 9!"          |
| 6   | Non-Negative Weights Only!                           |

---

## §1. What Is Dijkstra's? — "Shortest Path, One to All!"

> Prime: _"It calculates the shortest path from one node to ALL other nodes. Once you have the full graph marked out, finding the path from A to B is easy — just use the previous array."_

---

## §2. The Greedy Idea — "Next Shortest is Always Correct!"

> Prime: _"Each time you find the shortest path, that literally IS the shortest possible path at that individual moment. That's how Dijkstra's works — one at a time, updating distances."_

```
GREEDY APPROACH:
═══════════════════════════════════════════════════════════════

  Start: only know distance to source (0)!
  Step 1: source is closest (distance 0)!
  Step 2: update all neighbors' distances!
  Step 3: pick NEXT closest unseen node!
  Step 4: update all ITS neighbors' distances!
  Step 5: repeat until done!

  "The shortest distance from source to the next node
   will ALWAYS be the shortest. You can never make it
   shorter." — Prime
```

---

## §3. Three Arrays — "seen[], dist[], prev[]!"

```
SETUP:
═══════════════════════════════════════════════════════════════

  seen[]: [false, false, false, false, false]
  dist[]: [  ∞,     ∞,     ∞,     ∞,     ∞  ]
  prev[]: [ -1,    -1,    -1,    -1,    -1   ]

  Set source (0):
  dist[0] = 0     ← distance to yourself = 0!
  seen[0] = true  ← we start here!
```

---

## §4. The Algorithm — "Get Lowest, Update Neighbors!"

```
PSEUDOCODE:
═══════════════════════════════════════════════════════════════

  while (hasUnvisited(seen, dist)):
    curr = getLowestUnseen(seen, dist)
    seen[curr] = true

    for each edge of curr:
      if seen[edge.to] → continue!

      newDist = dist[curr] + edge.weight
      if newDist < dist[edge.to]:
        dist[edge.to] = newDist    ← shorter path found!
        prev[edge.to] = curr       ← who got us here!
```

---

## §5. Walkthrough — "0→2→4 = 6, Not 0→1→3→4 = 9!"

```
GRAPH:
═══════════════════════════════════════════════════════════════

        1         7
  (0)──────(1)──────(3)
   |                 |
   | 5           1   | 6
   |                 |
  (2)──────────────(4)
        1

  Iteration 1: curr=0 (dist=0)
  dist[]=[ 0, 1, 5, ∞, ∞]  ← updated 1(0+1=1), 2(0+5=5)
  prev[]=[-1, 0, 0,-1,-1]

  Iteration 2: curr=1 (dist=1, lowest unseen!)
  dist[]=[ 0, 1, 5, 8, ∞]  ← updated 3(1+7=8)
  prev[]=[-1, 0, 0, 1,-1]

  Iteration 3: curr=2 (dist=5)
  dist[]=[ 0, 1, 5, 8, 6]  ← updated 4(5+1=6)
  prev[]=[-1, 0, 0, 1, 2]

  Iteration 4: curr=4 (dist=6)
  Check 3: 6+6=12 > 8 → no update!

  Iteration 5: curr=3 (dist=8)
  Nothing to update!

  Path 0→4: prev[4]=2, prev[2]=0, done!
  Path: [0, 2, 4] with distance 6! ✅

  "5 + 1 = 6, that's our shortest path!" — Prime
```

---

## §6. Non-Negative Weights Only!

> Prime: _"Dijkstra's — NON-NEGATIVE weights. If there's a negative weight, you're gonna screw up the whole thing."_

---

## Checklist

```
[ ] Dijkstra = shortest path from ONE node to ALL others!
[ ] Greedy: next shortest is always correct!
[ ] Three arrays: seen[], dist[]=∞, prev[]=-1!
[ ] dist[source] = 0 (start point!)
[ ] While unseen: get lowest, mark seen, update neighbors!
[ ] newDist = dist[curr] + edge.weight!
[ ] If newDist < dist[edge] → update dist AND prev!
[ ] Non-negative weights only!
[ ] Walk prev[] backwards for path!
TIẾP THEO → Phần 54: Implement Dijkstra's Shortest Path!
```
