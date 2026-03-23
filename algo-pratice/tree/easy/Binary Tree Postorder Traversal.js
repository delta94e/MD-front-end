// LeetCode #145 — Binary Tree Postorder Traversal
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function postorderRecursive(root) {
  const result = [];
  function dfs(node) {
    if (!node) return;
    dfs(node.left);
    dfs(node.right);
    result.push(node.val);
  }
  dfs(root);
  return result;
}

function postorderIterative(root) {
  if (!root) return [];
  const stack = [root], result = [];
  while (stack.length > 0) {
    const node = stack.pop();
    result.push(node.val);
    if (node.left) stack.push(node.left);
    if (node.right) stack.push(node.right);
  }
  return result.reverse();
}

// Tests
console.log("=== #145 Postorder Traversal ===\n");
const t = new TreeNode(1, new TreeNode(2, new TreeNode(4), new TreeNode(5)), new TreeNode(3, null, new TreeNode(6)));
const exp = [4,5,2,6,3,1];
console.log(`Recursive: [${postorderRecursive(t)}] (exp [${exp}]) ${JSON.stringify(postorderRecursive(t))===JSON.stringify(exp)?"✅":"❌"}`);
console.log(`Iterative: [${postorderIterative(t)}] ${JSON.stringify(postorderIterative(t))===JSON.stringify(exp)?"✅":"❌"}`);
