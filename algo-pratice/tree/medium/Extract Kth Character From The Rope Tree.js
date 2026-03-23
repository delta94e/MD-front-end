// LeetCode #2689 — Extract Kth Character From The Rope Tree
class RopeTreeNode {
  constructor(len, val = "", left = null, right = null) {
    this.len = len; this.val = val; this.left = left; this.right = right;
  }
}
function getKthCharacter(root, k) {
  let result = "";
  function dfs(node) {
    if (!node) return;
    if (node.val) { result += node.val; return; }
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  return result[k - 1];
}
// Tests
console.log("=== #2689 Rope Tree ===");
const leaf1 = new RopeTreeNode(2, "ab");
const leaf2 = new RopeTreeNode(1, "c");
const leaf3 = new RopeTreeNode(3, "def");
const mid = new RopeTreeNode(3, "", leaf1, leaf2);
const root = new RopeTreeNode(6, "", mid, leaf3);
console.log(`k=4: "${getKthCharacter(root,4)}" (exp "d") ${getKthCharacter(root,4)==="d"?"✅":"❌"}`);
