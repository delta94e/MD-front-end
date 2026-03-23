// LeetCode #222 — Count Complete Tree Nodes
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function countNodes(root) {
  if (!root) return 0;
  let leftH = 0, rightH = 0;
  let l = root, r = root;
  while (l) { leftH++; l = l.left; }
  while (r) { rightH++; r = r.right; }
  if (leftH === rightH) return Math.pow(2, leftH) - 1;
  return 1 + countNodes(root.left) + countNodes(root.right);
}

// Tests
console.log("=== #222 Count Complete Tree Nodes ===\n");
const t1 = new TreeNode(1, new TreeNode(2, new TreeNode(4), new TreeNode(5)), new TreeNode(3, new TreeNode(6)));
console.log(`Complete(6 nodes): ${countNodes(t1)} (exp 6) ${countNodes(t1)===6?"✅":"❌"}`);
const perfect = new TreeNode(1, new TreeNode(2, new TreeNode(4), new TreeNode(5)), new TreeNode(3, new TreeNode(6), new TreeNode(7)));
console.log(`Perfect(7 nodes): ${countNodes(perfect)} (exp 7) ${countNodes(perfect)===7?"✅":"❌"}`);
console.log(`Null: ${countNodes(null)} (exp 0) ${countNodes(null)===0?"✅":"❌"}`);
console.log(`Single: ${countNodes(new TreeNode(1))} (exp 1) ${countNodes(new TreeNode(1))===1?"✅":"❌"}`);
