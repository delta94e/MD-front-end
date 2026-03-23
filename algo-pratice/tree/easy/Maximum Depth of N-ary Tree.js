// LeetCode #559 — Maximum Depth of N-ary Tree
class Node {
  constructor(val, children = []) { this.val = val; this.children = children; }
}
function maxDepth(root) {
  if (!root) return 0;
  if (root.children.length === 0) return 1;
  let maxChild = 0;
  for (const child of root.children) maxChild = Math.max(maxChild, maxDepth(child));
  return 1 + maxChild;
}
// Tests
console.log("=== #559 Max Depth N-ary Tree ===");
const t = new Node(1, [new Node(3, [new Node(5), new Node(6)]), new Node(2), new Node(4)]);
console.log(`${maxDepth(t)} (exp 3) ${maxDepth(t)===3?"✅":"❌"}`);
console.log(`Single: ${maxDepth(new Node(1))} (exp 1) ${maxDepth(new Node(1))===1?"✅":"❌"}`);
console.log(`Null: ${maxDepth(null)} (exp 0) ${maxDepth(null)===0?"✅":"❌"}`);
