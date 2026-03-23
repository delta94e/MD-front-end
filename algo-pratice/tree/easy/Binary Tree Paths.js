// LeetCode #257 — Binary Tree Paths
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function binaryTreePaths(root) {
  const result = [];
  function dfs(node, path) {
    if (!node) return;
    path += node.val;
    if (!node.left && !node.right) { result.push(path); return; }
    path += "->";
    dfs(node.left, path);
    dfs(node.right, path);
  }
  dfs(root, "");
  return result;
}
// Tests
console.log("=== #257 Binary Tree Paths ===");
const t = new TreeNode(1, new TreeNode(2, null, new TreeNode(5)), new TreeNode(3));
console.log(binaryTreePaths(t), '(exp ["1->2->5","1->3"]) ✅');
