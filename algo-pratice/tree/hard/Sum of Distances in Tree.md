# 📐 Sum of Distances in Tree — LeetCode #834 (Hard)

> 📖 Code: [Sum of Distances in Tree.js](./Sum%20of%20Distances%20in%20Tree.js)

---

## R — Repeat & Clarify

🧠 *"RE-ROOTING! 2 DFS. DFS1 tính count+ans[0]. DFS2 lan truyền: ans[child] = ans[parent] + n - 2*count[child]."*

> 🎙️ *"Given a tree with n nodes, for each node return the sum of distances to ALL other nodes."*

> 🎙️ *"Brute force: BFS from each node → O(n²). Need O(n). This calls for the RE-ROOTING technique."*

---

## E — Examples

```
  0 — 1 — 2
  |
  3 — 4
  |
  5

  n = 6
  ans[0] = dist(0→1) + dist(0→2) + dist(0→3) + dist(0→4) + dist(0→5)
         = 1 + 2 + 1 + 2 + 1 = 7? 
  Let me recount with edges: 0-1, 1-2, 0-3, 3-4, 3-5
  0→1=1, 0→2=2, 0→3=1, 0→4=2, 0→5=2 → ans[0] = 8
```

---

## A — Approach

> 🎙️ *"The key insight: if I know ans[parent], I can compute ans[child] in O(1)!*
>
> *When moving from parent to child:*
> *- count[child] nodes get 1 closer (they're in child's subtree)*
> *- (n - count[child]) nodes get 1 farther (they're outside)*
> *- **ans[child] = ans[parent] - count[child] + (n - count[child]) = ans[parent] + n - 2·count[child]***
>
> *This formula is the heart of RE-ROOTING!"*

```
WHY THE FORMULA WORKS:

  When I move from root to child:
  
  BEFORE (root's perspective):
    child's subtree (count[child] nodes): at distance d₁, d₂, ..., dₖ
    other nodes (n-count[child]): at distance e₁, e₂, ..., eₘ
  
  AFTER (child's perspective):
    child's subtree: distances decrease by 1 each! → (d₁-1), (d₂-1), ...
    other nodes: distances increase by 1 each! → (e₁+1), (e₂+1), ...
  
  Sum change = -count[child] + (n - count[child]) = n - 2·count[child]
  ans[child] = ans[root] + (n - 2·count[child])
```

---

## C — Code

```javascript
function sumOfDistancesInTree(n, edges) {
  const adj = Array.from({length: n}, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  
  const count = new Array(n).fill(1);  // subtree size (include self)
  const ans = new Array(n).fill(0);
  
  // DFS 1: Compute subtree sizes and ans[0]
  function dfs1(node, parent) {
    for (const child of adj[node]) {
      if (child === parent) continue;
      dfs1(child, node);
      count[node] += count[child];
      ans[0] += count[child];  // each node in subtree contributes 1 edge
    }
  }
  
  // DFS 2: Propagate from root to all nodes
  function dfs2(node, parent) {
    for (const child of adj[node]) {
      if (child === parent) continue;
      ans[child] = ans[node] + n - 2 * count[child];  // THE FORMULA!
      dfs2(child, node);
    }
  }
  
  dfs1(0, -1);
  dfs2(0, -1);
  return ans;
}
```

> 🎙️ *"DFS1 (post-order): compute subtree sizes and ans[0] — for root, each node in subtree at depth d adds d to ans[0], which equals sum of all subtree counts.*
>
> *DFS2 (pre-order): propagate using the formula. Parent→child, adjust by ±count.*
>
> *Two passes, O(n) total!"*

---

## O — Optimize

```
❌ Brute force: BFS from each node → O(n²)
✅ Re-rooting: 2 DFS → O(n)

Key: ans[child] = ans[parent] + n - 2·count[child]
```

---

## 🗣️ Interview Script

> 🎙️ *"Re-rooting technique. DFS1 computes subtree sizes and total distance from root. DFS2 propagates: moving from parent to child, count[child] nodes get closer, n-count[child] get farther. Formula: ans[child] = ans[parent] + n - 2·count[child]. O(n) — each node visited twice."*

### Pattern

```
RE-ROOTING TECHNIQUE:
  When asked: "compute something for EVERY node as root"
  → Don't BFS/DFS from each node O(n²)!
  → Compute for ONE root, then PROPAGATE O(1) per edge!
  
  Template:
  1. DFS1: compute subtree info + answer for root 0
  2. DFS2: propagate answer to children using delta formula
```
