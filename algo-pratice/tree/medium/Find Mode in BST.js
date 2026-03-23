// LeetCode #501 — Find Mode in BST
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function findMode(root) {
  let prev = null, count = 0, maxCount = 0, modes = [];
  function inorder(node) {
    if (!node) return;
    inorder(node.left);
    count = (prev !== null && node.val === prev) ? count + 1 : 1;
    prev = node.val;
    if (count > maxCount) { maxCount = count; modes = [node.val]; }
    else if (count === maxCount) modes.push(node.val);
    inorder(node.right);
  }
  inorder(root);
  return modes;
}
// Tests
console.log("=== #501 Find Mode in BST ===");
const t = new TreeNode(1, null, new TreeNode(2, new TreeNode(2)));
console.log(`[${findMode(t)}] (exp [2]) ${JSON.stringify(findMode(t))===JSON.stringify([2])?"✅":"❌"}`);
const t2 = new TreeNode(1, new TreeNode(1), new TreeNode(2, new TreeNode(2)));
console.log(`[${findMode(t2)}] (exp [1,2]) ${findMode(t2).length===2?"✅":"❌"}`);
