// ============================================================
// LeetCode #3812 — Minimum Edge Toggles on a Tree
// DFS + Parity — O(n) time, O(n) space
// ============================================================

function minEdgeToggles(n, edges, start, target) {
  // 1. Tính diff: node nào cần đổi?
  const diff = new Array(n);
  for (let i = 0; i < n; i++) {
    diff[i] = start[i] !== target[i] ? 1 : 0;
  }

  // 2. Check: tổng lẻ → impossible
  const totalDiff = diff.reduce((a, b) => a + b, 0);
  if (totalDiff % 2 !== 0) return [-1];
  if (totalDiff === 0) return []; // đã giống rồi!

  // 3. Build adjacency list (lưu edge index!)
  const adj = Array.from({ length: n }, () => []);
  for (let i = 0; i < edges.length; i++) {
    const [a, b] = edges[i];
    adj[a].push({ node: b, edgeIdx: i });
    adj[b].push({ node: a, edgeIdx: i });
  }

  // 4. DFS post-order: đếm subtree diff
  const result = [];
  const visited = new Array(n).fill(false);

  function dfs(node) {
    visited[node] = true;
    let subtreeDiff = diff[node];

    for (const { node: neighbor, edgeIdx } of adj[node]) {
      if (visited[neighbor]) continue;
      const childDiff = dfs(neighbor);
      subtreeDiff += childDiff;

      // Subtree con có SỐ LẺ diff → toggle cạnh!
      if (childDiff % 2 !== 0) {
        result.push(edgeIdx);
      }
    }

    return subtreeDiff;
  }

  dfs(0);
  result.sort((a, b) => a - b);
  return result;
}

// ============================================================
// TESTS
// ============================================================
console.log("=== Minimum Edge Toggles on a Tree ===\n");

function test(name, n, edges, start, target, expected) {
  const r = minEdgeToggles(n, edges, start, target);
  const pass = JSON.stringify(r) === JSON.stringify(expected) ? "✅" : "❌";
  console.log(`${name}:`);
  console.log(`  Result:   [${r}]`);
  console.log(`  Expected: [${expected}]`);
  console.log(`  ${pass}\n`);
}

test("Test 1 — basic toggle",
  3, [[0,1],[1,2]], "010", "100",
  [0]
);

test("Test 2 — multiple toggles",
  7, [[0,1],[1,2],[2,3],[3,4],[3,5],[1,6]], "0011000", "0010001",
  [1,2,5]
);

test("Test 3 — impossible (odd diff)",
  2, [[0,1]], "00", "01",
  [-1]
);

test("Test 4 — already same",
  3, [[0,1],[1,2]], "000", "000",
  []
);

test("Test 5 — flip all (line)",
  4, [[0,1],[1,2],[2,3]], "0000", "1111",
  [0,2]
);

test("Test 6 — 2 nodes swap",
  2, [[0,1]], "01", "10",
  [0]
);

test("Test 7 — star graph",
  5, [[0,1],[0,2],[0,3],[0,4]], "00000", "01010",
  [0,2]
);
