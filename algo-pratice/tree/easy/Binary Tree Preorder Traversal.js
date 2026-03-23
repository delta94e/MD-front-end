// LeetCode #144 — Binary Tree Preorder Traversal
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function preorderRecursive(root) {
  const result = [];
  function dfs(node) {
    if (!node) return;
    result.push(node.val);
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  return result;
}

function preorderIterative(root) {
  if (!root) return [];
  const stack = [root], result = [];
  while (stack.length > 0) {
    const node = stack.pop();
    result.push(node.val);
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  return result;
}

// Tests
console.log("=== #144 Preorder Traversal ===\n");
const t = new TreeNode(1, new TreeNode(2, new TreeNode(4), new TreeNode(5)), new TreeNode(3, null, new TreeNode(6)));
console.log(`Recursive: [${preorderRecursive(t)}] (exp [1,2,4,5,3,6]) ${JSON.stringify(preorderRecursive(t))===JSON.stringify([1,2,4,5,3,6])?"✅":"❌"}`);
console.log(`Iterative: [${preorderIterative(t)}] ${JSON.stringify(preorderIterative(t))===JSON.stringify([1,2,4,5,3,6])?"✅":"❌"}`);
console.log(`Null: [${preorderRecursive(null)}] (exp []) ✅`);
