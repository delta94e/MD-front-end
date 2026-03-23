// LeetCode #298 — Binary Tree Longest Consecutive Sequence
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function longestConsecutive(root) {
  let maxLen = 0;
  function dfs(node, parent, length) {
    if (!node) return;
    length = (parent && node.val === parent.val + 1) ? length + 1 : 1;
    maxLen = Math.max(maxLen, length);
    dfs(node.left, node, length);
    dfs(node.right, node, length);
  }
  dfs(root, null, 0);
  return maxLen;
}
// Tests
console.log("=== #298 Longest Consecutive ===");
const t = new TreeNode(1, null, new TreeNode(3, new TreeNode(2), new TreeNode(4, null, new TreeNode(5))));
console.log(`3→4→5: ${longestConsecutive(t)} (exp 3) ${longestConsecutive(t)===3?"✅":"❌"}`);
const t2 = new TreeNode(2, null, new TreeNode(3, new TreeNode(2, new TreeNode(1))));
console.log(`2→3: ${longestConsecutive(t2)} (exp 2) ${longestConsecutive(t2)===2?"✅":"❌"}`);
