// LeetCode #108 — Convert Sorted Array to BST
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function sortedArrayToBST(nums) {
  return build(nums, 0, nums.length - 1);
}

function build(nums, start, end) {
  if (start > end) return null;
  const mid = Math.floor((start + end) / 2);
  const node = new TreeNode(nums[mid]);
  node.left = build(nums, start, mid - 1);
  node.right = build(nums, mid + 1, end);
  return node;
}

// Helpers
function getHeight(node) {
  if (!node) return 0;
  return 1 + Math.max(getHeight(node.left), getHeight(node.right));
}
function isBST(node, min = -Infinity, max = Infinity) {
  if (!node) return true;
  if (node.val <= min || node.val >= max) return false;
  return isBST(node.left, min, node.val) && isBST(node.right, node.val, max);
}
function countNodes(node) {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

// Tests
console.log("=== #108 Convert Sorted Array to BST ===\n");
const tests = [[-10,-3,0,5,9], [1,3], [1], [1,2,3,4,5,6,7]];
for (const t of tests) {
  const root = sortedArrayToBST(t);
  const h = getHeight(root);
  const minH = Math.ceil(Math.log2(t.length + 1));
  console.log(`[${t}] → height=${h}, nodes=${countNodes(root)}, BST=${isBST(root)}, minH=${minH} ${h <= minH ? "✅" : "❌"}`);
}
