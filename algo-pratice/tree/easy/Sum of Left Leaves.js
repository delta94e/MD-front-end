// LeetCode #404 — Sum of Left Leaves
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function sumOfLeftLeaves(root) {
  if (!root) return 0;
  let sum = 0;
  if (root.left && !root.left.left && !root.left.right) sum += root.left.val;
  else sum += sumOfLeftLeaves(root.left);
  sum += sumOfLeftLeaves(root.right);
  return sum;
}
// Tests
console.log("=== #404 Sum of Left Leaves ===");
const t = new TreeNode(3, new TreeNode(9), new TreeNode(20, new TreeNode(15), new TreeNode(7)));
console.log(`${sumOfLeftLeaves(t)} (exp 24) ${sumOfLeftLeaves(t)===24?"✅":"❌"}`);
console.log(`Single: ${sumOfLeftLeaves(new TreeNode(1))} (exp 0) ${sumOfLeftLeaves(new TreeNode(1))===0?"✅":"❌"}`);
