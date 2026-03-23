// LeetCode #968 — Binary Tree Cameras
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function minCameraCover(root) {
  let cameras = 0;
  // 0=not covered, 1=covered, 2=has camera
  function dfs(node) {
    if (!node) return 1;
    const left = dfs(node.left);
    const right = dfs(node.right);
    if (left === 0 || right === 0) { cameras++; return 2; }
    if (left === 2 || right === 2) return 1;
    return 0;
  }
  if (dfs(root) === 0) cameras++;
  return cameras;
}
// Tests
console.log("=== #968 Binary Tree Cameras ===");
const t1 = new TreeNode(0, new TreeNode(0, new TreeNode(0), new TreeNode(0)));
console.log(`${minCameraCover(t1)} (exp 1) ${minCameraCover(t1)===1?"✅":"❌"}`);
const t2 = new TreeNode(0, new TreeNode(0, new TreeNode(0, new TreeNode(0, null, new TreeNode(0)))));
console.log(`${minCameraCover(t2)} (exp 2) ${minCameraCover(t2)===2?"✅":"❌"}`);
