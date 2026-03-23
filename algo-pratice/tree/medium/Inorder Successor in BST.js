// LeetCode #285 — Inorder Successor in BST
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function inorderSuccessor(root, p) {
  let successor = null;
  let node = root;
  while (node) {
    if (p.val < node.val) { successor = node; node = node.left; }
    else { node = node.right; }
  }
  return successor;
}
// Tests
console.log("=== #285 Inorder Successor ===");
const n2 = new TreeNode(2), n4 = new TreeNode(4);
const n3 = new TreeNode(3, n2, n4);
const n7 = new TreeNode(7);
const root = new TreeNode(5, n3, n7);
console.log(`Succ(3): ${inorderSuccessor(root,n3)?.val} (exp 4) ${inorderSuccessor(root,n3)?.val===4?"✅":"❌"}`);
console.log(`Succ(4): ${inorderSuccessor(root,n4)?.val} (exp 5) ${inorderSuccessor(root,n4)?.val===5?"✅":"❌"}`);
console.log(`Succ(7): ${inorderSuccessor(root,n7)} (exp null) ${inorderSuccessor(root,n7)===null?"✅":"❌"}`);
