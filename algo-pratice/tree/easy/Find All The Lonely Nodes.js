// LeetCode #1469 — Find All The Lonely Nodes
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function getLonelyNodes(root) {
  const result = [];
  function dfs(node) {
    if (!node) return;
    if (node.left && !node.right) result.push(node.left.val);
    if (node.right && !node.left) result.push(node.right.val);
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  return result;
}
// Tests
console.log("=== #1469 Lonely Nodes ===");
const t = new TreeNode(1, new TreeNode(2, null, new TreeNode(4)), new TreeNode(3, null, new TreeNode(6)));
console.log(`[${getLonelyNodes(t)}] (exp [4,6]) ${getLonelyNodes(t).length===2?"✅":"❌"}`);
