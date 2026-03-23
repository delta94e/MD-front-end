// LeetCode #530 — Minimum Absolute Difference in BST
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}
function getMinimumDifference(root) {
  let prev = null,
    minDiff = Infinity;
  function inorder(node) {
    if (!node) return;
    inorder(node.left);
    if (prev !== null) minDiff = Math.min(minDiff, node.val - prev);
    prev = node.val;
    inorder(node.right);
  }
  inorder(root);
  return minDiff;
}
// Tests
console.log("=== #530 Min Absolute Difference in BST ===");
const t = new TreeNode(
  4,
  new TreeNode(2, new TreeNode(1), new TreeNode(3)),
  new TreeNode(6),
);
console.log(
  `${getMinimumDifference(t)} (exp 1) ${getMinimumDifference(t) === 1 ? "✅" : "❌"}`,
);
