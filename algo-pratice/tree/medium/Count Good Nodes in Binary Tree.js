class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// ============================================================
// DFS Pre-order — O(n) time, O(h) space
// Truyền maxSoFar TỪ TRÊN XUỐNG (top-down!)
// ============================================================
function goodNodes(root) {
  function dfs(node, maxSoFar) {
    if (!node) return 0;

    let count = node.val >= maxSoFar ? 1 : 0; // good?
    maxSoFar = Math.max(maxSoFar, node.val); // cập nhật max

    count += dfs(node.left, maxSoFar); // đi trái
    count += dfs(node.right, maxSoFar); // đi phải
    return count;
  }
  return dfs(root, root.val);
}

// ============================================================
// Helper: Build tree từ array (LeetCode format)
// ============================================================
function buildTree(arr) {
  if (!arr || arr.length === 0) return null;
  const nodes = arr.map((val) => (val !== null ? new TreeNode(val) : null));
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i] === null) continue;
    const leftIndex = 2 * i + 1;
    const rightIndex = 2 * i + 2;
    if (leftIndex < nodes.length) nodes[i].left = nodes[leftIndex];
    if (rightIndex < nodes.length) nodes[i].right = nodes[rightIndex];
  }
  return nodes[0];
}

// ============================================================
// TESTS
// ============================================================
console.log("=== Count Good Nodes in Binary Tree — LeetCode #1448 ===\n");

// Test 1: [3,1,4,3,null,1,5] → 4
const tree1 = buildTree([3, 1, 4, 3, null, 1, 5]);
console.log("Test 1 — [3,1,4,3,null,1,5]:");
console.log("  Result:", goodNodes(tree1), "| Expected: 4");

// Test 2: [3,3,null,4,2] → 3
const tree2 = buildTree([3, 3, null, 4, 2]);
console.log("\nTest 2 — [3,3,null,4,2]:");
console.log("  Result:", goodNodes(tree2), "| Expected: 3");

// Test 3: [1] → 1
const tree3 = buildTree([1]);
console.log("\nTest 3 — [1]:");
console.log("  Result:", goodNodes(tree3), "| Expected: 1");

// Test 4: All decreasing [5,3,2] → 1 (only root)
const tree4 = new TreeNode(5, new TreeNode(3), new TreeNode(2));
console.log("\nTest 4 — [5,3,2] (decreasing):");
console.log("  Result:", goodNodes(tree4), "| Expected: 1");

// Test 5: All increasing
const tree5 = new TreeNode(
  1,
  new TreeNode(2, new TreeNode(4), new TreeNode(5)),
  new TreeNode(3)
);
console.log("\nTest 5 — [1,2,3,4,5] (increasing):");
console.log("  Result:", goodNodes(tree5), "| Expected: 5");

// Test 6: All same values → all good!
const tree6 = new TreeNode(
  3,
  new TreeNode(3, new TreeNode(3), new TreeNode(3)),
  new TreeNode(3)
);
console.log("\nTest 6 — [3,3,3,3,3] (all same):");
console.log("  Result:", goodNodes(tree6), "| Expected: 5");

// Test 7: Negative values, decreasing → 1
const tree7 = new TreeNode(-1, new TreeNode(-2), new TreeNode(-3));
console.log("\nTest 7 — [-1,-2,-3] (negative decreasing):");
console.log("  Result:", goodNodes(tree7), "| Expected: 1");

// Test 8: Negative values, increasing → all good
const tree8 = new TreeNode(-3, new TreeNode(-2), new TreeNode(-1));
console.log("\nTest 8 — [-3,-2,-1] (negative increasing):");
console.log("  Result:", goodNodes(tree8), "| Expected: 3");
