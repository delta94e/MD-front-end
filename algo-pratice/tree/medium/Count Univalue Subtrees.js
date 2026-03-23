// LeetCode #250 — Count Univalue Subtrees
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function countUnivalSubtrees(root) {
  let count = 0;
  function isUnival(node) {
    if (!node) return true;
    const left = isUnival(node.left);
    const right = isUnival(node.right);
    if (!left || !right) return false;
    if (node.left && node.left.val !== node.val) return false;
    if (node.right && node.right.val !== node.val) return false;
    count++;
    return true;
  }
  isUnival(root);
  return count;
}
// Tests
console.log("=== #250 Count Univalue Subtrees ===");
const t = new TreeNode(5,
  new TreeNode(1, new TreeNode(5), new TreeNode(5)),
  new TreeNode(5, null, new TreeNode(5))
);
console.log(`${countUnivalSubtrees(t)} (exp 4) ${countUnivalSubtrees(t)===4?"✅":"❌"}`);
console.log(`Single: ${countUnivalSubtrees(new TreeNode(1))} (exp 1) ${countUnivalSubtrees(new TreeNode(1))===1?"✅":"❌"}`);
