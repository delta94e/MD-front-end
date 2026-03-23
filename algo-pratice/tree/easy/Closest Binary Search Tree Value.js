// LeetCode #270 — Closest Binary Search Tree Value
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function closestValue(root, target) {
  let closest = root.val;
  let node = root;
  while (node) {
    if (Math.abs(node.val - target) < Math.abs(closest - target)) closest = node.val;
    node = target < node.val ? node.left : node.right;
  }
  return closest;
}
// Tests
console.log("=== #270 Closest BST Value ===");
const t = new TreeNode(4, new TreeNode(2, new TreeNode(1), new TreeNode(3)), new TreeNode(5));
console.log(`target=3.7: ${closestValue(t,3.7)} (exp 4) ${closestValue(t,3.7)===4?"✅":"❌"}`);
console.log(`target=3.1: ${closestValue(t,3.1)} (exp 3) ${closestValue(t,3.1)===3?"✅":"❌"}`);
