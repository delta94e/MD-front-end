// LeetCode #563 — Binary Tree Tilt
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function findTilt(root) {
  let totalTilt = 0;
  function sumTree(node) {
    if (!node) return 0;
    const left = sumTree(node.left);
    const right = sumTree(node.right);
    totalTilt += Math.abs(left - right);
    return node.val + left + right;
  }
  sumTree(root);
  return totalTilt;
}
// Tests
console.log("=== #563 Binary Tree Tilt ===");
const t = new TreeNode(1, new TreeNode(2), new TreeNode(3));
console.log(`${findTilt(t)} (exp 1) ${findTilt(t)===1?"✅":"❌"}`);
const t2 = new TreeNode(4, new TreeNode(2, new TreeNode(3), new TreeNode(5)), new TreeNode(9, null, new TreeNode(7)));
console.log(`${findTilt(t2)} (exp 15) ${findTilt(t2)===15?"✅":"❌"}`);
