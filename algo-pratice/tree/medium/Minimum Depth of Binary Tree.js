// LeetCode #111 — Minimum Depth of Binary Tree
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function minDepth(root) {
  if (!root) return 0;
  if (!root.left) return 1 + minDepth(root.right);
  if (!root.right) return 1 + minDepth(root.left);
  return 1 + Math.min(minDepth(root.left), minDepth(root.right));
}

function minDepthBFS(root) {
  if (!root) return 0;
  const queue = [root];
  let depth = 0;
  while (queue.length > 0) {
    depth++;
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      if (!node.left && !node.right) return depth;
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
}

// Tests
console.log("=== #111 Minimum Depth ===\n");
const t1 = new TreeNode(3, new TreeNode(9), new TreeNode(20, new TreeNode(15), new TreeNode(7)));
const t2 = new TreeNode(2, null, new TreeNode(3, null, new TreeNode(4)));
const t3 = new TreeNode(1, new TreeNode(2, new TreeNode(4)), new TreeNode(3));
console.log(`Balanced: DFS=${minDepth(t1)}, BFS=${minDepthBFS(t1)} (exp 2) ${minDepth(t1)===2?"✅":"❌"}`);
console.log(`Right-skewed: DFS=${minDepth(t2)}, BFS=${minDepthBFS(t2)} (exp 3) ${minDepth(t2)===3?"✅":"❌"}`);
console.log(`Left-heavy: DFS=${minDepth(t3)}, BFS=${minDepthBFS(t3)} (exp 2) ${minDepth(t3)===2?"✅":"❌"}`);
console.log(`Null: DFS=${minDepth(null)} (exp 0) ${minDepth(null)===0?"✅":"❌"}`);
console.log(`Single: DFS=${minDepth(new TreeNode(1))} (exp 1) ${minDepth(new TreeNode(1))===1?"✅":"❌"}`);
