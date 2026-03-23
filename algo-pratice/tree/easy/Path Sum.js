// LeetCode #112 — Path Sum
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function hasPathSum(root, targetSum) {
  if (!root) return false;
  if (!root.left && !root.right) return root.val === targetSum;
  const remaining = targetSum - root.val;
  return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
}

// Tests
console.log("=== #112 Path Sum ===\n");
const t1 = new TreeNode(5,
  new TreeNode(4, new TreeNode(11, new TreeNode(7), new TreeNode(2))),
  new TreeNode(8, new TreeNode(13), new TreeNode(4, null, new TreeNode(1)))
);
console.log(`5→4→11→2=22: ${hasPathSum(t1,22)} (exp true) ${hasPathSum(t1,22)?"✅":"❌"}`);
console.log(`target=26: ${hasPathSum(t1,26)} (exp true) ${hasPathSum(t1,26)?"✅":"❌"}`);
console.log(`target=100: ${hasPathSum(t1,100)} (exp false) ${!hasPathSum(t1,100)?"✅":"❌"}`);
console.log(`null,0: ${hasPathSum(null,0)} (exp false) ${!hasPathSum(null,0)?"✅":"❌"}`);
console.log(`[1],1: ${hasPathSum(new TreeNode(1),1)} (exp true) ${hasPathSum(new TreeNode(1),1)?"✅":"❌"}`);
