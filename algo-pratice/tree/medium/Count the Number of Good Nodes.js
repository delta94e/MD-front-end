// ============================================================
// Count the Number of Good Nodes — LeetCode #3249
// General tree (NOT binary!), input = edges
// Good node = all children subtrees have SAME SIZE
// ============================================================

function countGoodNodes(edges) {
  const n = edges.length + 1;

  // Bước 1: Dựng adjacency list
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }

  let count = 0;

  // Bước 2: DFS tính subtree size
  function dfs(node, parent) {
    let size = 1; // chính node này
    let childSize = -1; // size con đầu tiên (sentinel)
    let isGood = true;

    for (const neighbor of adj[node]) {
      if (neighbor === parent) continue; // skip cha!

      const subSize = dfs(neighbor, node);
      size += subSize;

      // Bước 3: check cùng size?
      if (childSize === -1) {
        childSize = subSize; // con đầu tiên → ghi nhớ
      } else if (subSize !== childSize) {
        isGood = false; // khác size → NOT good!
      }
    }

    if (isGood) count++;
    return size;
  }

  dfs(0, -1);
  return count;
}

// ============================================================
// TESTS
// ============================================================
console.log("=== Count the Number of Good Nodes — LeetCode #3249 ===\n");

// Test 1: All good
const e1 = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [2, 6],
];
console.log("Test 1 — symmetric tree:");
console.log("  Result:", countGoodNodes(e1), "| Expected: 7");

// Test 2: Chain-like tree
const e2 = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [1, 6],
  [2, 7],
  [3, 8],
];
console.log("\nTest 2 — chain with branches:");
console.log("  Result:", countGoodNodes(e2), "| Expected: 6");

// Test 3: Minimal tree (2 nodes)
const e3 = [[0, 1]];
console.log("\nTest 3 — 2 nodes:");
console.log("  Result:", countGoodNodes(e3), "| Expected: 2");

// Test 4: Star (root with 3 leaves)
const e4 = [
  [0, 1],
  [0, 2],
  [0, 3],
];
console.log("\nTest 4 — star (3 leaves):");
console.log("  Result:", countGoodNodes(e4), "| Expected: 4");

// Test 5: Unbalanced - root NOT good
const e5 = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 4],
  [1, 5],
];
console.log("\nTest 5 — root NOT good (children sizes 3,1,1):");
console.log("  Result:", countGoodNodes(e5), "| Expected: 5");

// Test 6: Linear chain (all nodes have 1 child → all good)
const e6 = [
  [0, 1],
  [1, 2],
  [2, 3],
];
console.log("\nTest 6 — linear chain:");
console.log("  Result:", countGoodNodes(e6), "| Expected: 4");
