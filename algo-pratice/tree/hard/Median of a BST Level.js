// LeetCode #3831 — Median of a BST Level
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function medianOfLevels(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];
  while (queue.length > 0) {
    const size = queue.length;
    const level = [];
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    level.sort((a, b) => a - b);
    const mid = Math.floor(level.length / 2);
    result.push(level.length % 2 === 1 ? level[mid] : (level[mid - 1] + level[mid]) / 2);
  }
  return result;
}
// Tests
console.log("=== #3831 Median BST Level ===");
const t = new TreeNode(5, new TreeNode(3, new TreeNode(2), new TreeNode(4)), new TreeNode(8, null, new TreeNode(10)));
console.log(medianOfLevels(t), "(exp [5, 5.5, median of [2,4,10]])");
