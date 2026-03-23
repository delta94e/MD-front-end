// LeetCode #156 — Binary Tree Upside Down
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function upsideDownBinaryTree(root) {
  if (!root || !root.left) return root;
  const newRoot = upsideDownBinaryTree(root.left);
  root.left.left = root.right;
  root.left.right = root;
  root.left = null;
  root.right = null;
  return newRoot;
}
// Tests
console.log("=== #156 Binary Tree Upside Down ===");
const t = new TreeNode(1, new TreeNode(2, new TreeNode(4), new TreeNode(5)), new TreeNode(3));
const result = upsideDownBinaryTree(t);
console.log(`New root: ${result.val} (exp 4) ${result.val===4?"✅":"❌"}`);
console.log(`Root.left: ${result.left.val} (exp 5) ${result.left.val===5?"✅":"❌"}`);
console.log(`Root.right: ${result.right.val} (exp 2) ${result.right.val===2?"✅":"❌"}`);
