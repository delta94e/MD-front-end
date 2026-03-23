// LeetCode #333 — Largest BST Subtree
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function largestBSTSubtree(root) {
  let maxSize = 0;
  function dfs(node) {
    if (!node) return [true, Infinity, -Infinity, 0];
    const [lb, lMin, lMax, lSize] = dfs(node.left);
    const [rb, rMin, rMax, rSize] = dfs(node.right);
    if (lb && rb && lMax < node.val && node.val < rMin) {
      const size = lSize + rSize + 1;
      maxSize = Math.max(maxSize, size);
      return [true, Math.min(lMin, node.val), Math.max(rMax, node.val), size];
    }
    return [false, 0, 0, 0];
  }
  dfs(root);
  return maxSize;
}
// Tests
console.log("=== #333 Largest BST Subtree ===");
const t = new TreeNode(10, new TreeNode(5, new TreeNode(1), new TreeNode(8)), new TreeNode(15, null, new TreeNode(7)));
console.log(`${largestBSTSubtree(t)} (exp 3) ${largestBSTSubtree(t)===3?"✅":"❌"}`);
