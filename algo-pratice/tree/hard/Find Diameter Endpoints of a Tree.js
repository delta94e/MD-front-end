// LeetCode #3787 — Find Diameter Endpoints of a Tree
function findDiameterEndpoints(n, edges) {
  const adj = Array.from({length: n}, () => []);
  for (const [a,b] of edges) { adj[a].push(b); adj[b].push(a); }
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
  const [endA] = bfs(0);
  const [endB, diameter] = bfs(endA);
  return [endA, endB, diameter];
}
// Tests
console.log("=== #3787 Find Diameter Endpoints ===");
const [a, b, d] = findDiameterEndpoints(6, [[0,1],[1,2],[2,3],[3,4],[2,5]]);
console.log(`Endpoints: [${a},${b}], diameter=${d} (exp endpoints of longest path)`);
const [a2, b2, d2] = findDiameterEndpoints(3, [[0,1],[1,2]]);
console.log(`Line: [${a2},${b2}], diameter=${d2} (exp [0,2] or [2,0], d=2) ${d2===2?"✅":"❌"}`);
