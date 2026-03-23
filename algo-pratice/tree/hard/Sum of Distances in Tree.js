// LeetCode #834 — Sum of Distances in Tree
function sumOfDistancesInTree(n, edges) {
  const adj = Array.from({length: n}, () => []);
  for (const [a,b] of edges) { adj[a].push(b); adj[b].push(a); }
  const count = new Array(n).fill(1);
  const ans = new Array(n).fill(0);
  function dfs1(node, parent) {
    for (const child of adj[node]) {
      if (child === parent) continue;
      dfs1(child, node);
      count[node] += count[child];
      ans[0] += count[child];
    }
  }
  function dfs2(node, parent) {
    for (const child of adj[node]) {
      if (child === parent) continue;
      ans[child] = ans[node] + n - 2 * count[child];
      dfs2(child, node);
    }
  }
  dfs1(0, -1);
  dfs2(0, -1);
  return ans;
}
// Tests
console.log("=== #834 Sum of Distances ===");
console.log(sumOfDistancesInTree(6, [[0,1],[0,2],[2,3],[2,4],[2,5]]), "(exp [8,12,6,10,10,10])");
console.log(sumOfDistancesInTree(1, []), "(exp [0])");
