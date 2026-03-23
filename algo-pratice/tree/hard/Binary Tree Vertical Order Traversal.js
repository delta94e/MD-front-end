// LeetCode #314 — Binary Tree Vertical Order Traversal
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function verticalOrder(root) {
  if (!root) return [];
  const map = new Map();
  const queue = [[root, 0]];
  let minCol = 0, maxCol = 0;
  while (queue.length > 0) {
    const [node, col] = queue.shift();
    if (!map.has(col)) map.set(col, []);
    map.get(col).push(node.val);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
    if (node.left) queue.push([node.left, col - 1]);
    if (node.right) queue.push([node.right, col + 1]);
  }
  const result = [];
  for (let c = minCol; c <= maxCol; c++) result.push(map.get(c));
  return result;
}
// Tests
console.log("=== #314 Vertical Order ===");
const t = new TreeNode(3, new TreeNode(9), new TreeNode(20, new TreeNode(15), new TreeNode(7)));
console.log(JSON.stringify(verticalOrder(t)), '(exp [[9],[3,15],[20],[7]])');
