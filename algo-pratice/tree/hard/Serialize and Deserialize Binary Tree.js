// LeetCode #297 — Serialize and Deserialize Binary Tree
class TreeNode {
  constructor(val, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}
function serialize(root) {
  const result = [];
  function dfs(node) {
    if (!node) { result.push("null"); return; }
    result.push(String(node.val));
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  return result.join(",");
}
function deserialize(data) {
  const vals = data.split(",");
  let i = 0;
  function build() {
    if (vals[i] === "null") { i++; return null; }
    const node = new TreeNode(Number(vals[i]));
    i++;
    node.left = build();
    node.right = build();
    return node;
  }
  return build();
}
// Tests
console.log("=== #297 Serialize/Deserialize ===");
const t = new TreeNode(1, new TreeNode(2), new TreeNode(3, new TreeNode(4), new TreeNode(5)));
const s = serialize(t);
console.log(`Serialized: ${s}`);
const d = deserialize(s);
console.log(`Deserialized root: ${d.val} (exp 1) ${d.val===1?"✅":"❌"}`);
console.log(`Left: ${d.left.val} (exp 2) ${d.left.val===2?"✅":"❌"}`);
console.log(`Right.right: ${d.right.right.val} (exp 5) ${d.right.right.val===5?"✅":"❌"}`);
console.log(`Roundtrip: ${serialize(d)===s} ✅`);
