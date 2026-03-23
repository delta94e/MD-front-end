// LeetCode #543 — Diameter of Binary Tree
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function diameterOfBinaryTree(root) {
  let diameter = 0;
  function height(node) {
    if (!node) return 0;
    const left = height(node.left);
    const right = height(node.right);
    diameter = Math.max(diameter, left + right);
    return 1 + Math.max(left, right);
  }
  height(root);
  return diameter;
}
// Tests
console.log("=== #543 Diameter of Binary Tree ===");
const t = new TreeNode(1, new TreeNode(2, new TreeNode(4), new TreeNode(5)), new TreeNode(3));
console.log(`${diameterOfBinaryTree(t)} (exp 3) ${diameterOfBinaryTree(t)===3?"✅":"❌"}`);
console.log(`Single: ${diameterOfBinaryTree(new TreeNode(1))} (exp 0) ${diameterOfBinaryTree(new TreeNode(1))===0?"✅":"❌"}`);
const notThruRoot = new TreeNode(1, new TreeNode(2, new TreeNode(3, new TreeNode(5), new TreeNode(6)), new TreeNode(4)));
console.log(`Not thru root: ${diameterOfBinaryTree(notThruRoot)} (exp 3) ${diameterOfBinaryTree(notThruRoot)===3?"✅":"❌"}`);
