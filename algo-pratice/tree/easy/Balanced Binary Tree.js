class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// ============================================================
// Approach 1: Brute Force — O(n²)
// Mỗi node gọi getHeight riêng → tính lại subtree → chậm!
// ============================================================
function isBalancedBrute(root) {
  if (root === null) return true;

  function getHeight(node) {
    if (node === null) return 0;
    return 1 + Math.max(getHeight(node.left), getHeight(node.right));
  }

  return (
    Math.abs(getHeight(root.left) - getHeight(root.right)) <= 1 &&
    isBalancedBrute(root.left) &&
    isBalancedBrute(root.right)
  );
}

// ============================================================
// Approach 2: Optimal — O(n) dùng trick -1
// Gộp tính height + check balanced vào 1 hàm!
// Return -1 nếu unbalanced → truyền lên ngay!
// ============================================================
function isBalanced(root) {
  function height(node) {
    if (node === null) return 0; // cây rỗng, height = 0

    const left = height(node.left); // hỏi con trái
    if (left === -1) return -1; // con trái lỗi → truyền lên!

    const right = height(node.right); // hỏi con phải
    if (right === -1) return -1; // con phải lỗi → truyền lên!

    if (Math.abs(left - right) > 1) return -1; // chênh > 1 → lỗi!

    return 1 + Math.max(left, right); // OK → trả height thật
  }

  return height(root) !== -1;
}

// ============================================================
// Helper: Build tree từ array (LeetCode format)
// ============================================================
function buildTree(arr) {
  if (!arr || arr.length === 0) return null;
  const nodes = arr.map((val) => (val !== null ? new TreeNode(val) : null));
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i] === null) continue;
    const leftIndex = 2 * i + 1;
    const rightIndex = 2 * i + 2;
    if (leftIndex < nodes.length) nodes[i].left = nodes[leftIndex];
    if (rightIndex < nodes.length) nodes[i].right = nodes[rightIndex];
  }
  return nodes[0];
}

// ============================================================
// TESTS
// ============================================================
console.log("=== Balanced Binary Tree — LeetCode #110 ===\n");

// Test 1: Balanced tree
const tree1 = buildTree([3, 9, 20, null, null, 15, 7]);
console.log("Test 1 — [3,9,20,null,null,15,7]:");
console.log("  Brute:", isBalancedBrute(tree1)); // true
console.log("  Optimal:", isBalanced(tree1)); // true

// Test 2: Unbalanced tree
const tree2 = buildTree([1, 2, 2, 3, 3, null, null, 4, 4]);
console.log("\nTest 2 — [1,2,2,3,3,null,null,4,4]:");
console.log("  Brute:", isBalancedBrute(tree2)); // false
console.log("  Optimal:", isBalanced(tree2)); // false

// Test 3: Empty tree
console.log("\nTest 3 — null:");
console.log("  Brute:", isBalancedBrute(null)); // true
console.log("  Optimal:", isBalanced(null)); // true

// Test 4: Single node
const tree4 = buildTree([1]);
console.log("\nTest 4 — [1]:");
console.log("  Brute:", isBalancedBrute(tree4)); // true
console.log("  Optimal:", isBalanced(tree4)); // true

// Test 5: Skewed left → unbalanced
const tree5 = buildTree([1, 2, null, 3]);
console.log("\nTest 5 — [1,2,null,3] (skewed left):");
console.log("  Brute:", isBalancedBrute(tree5)); // false
console.log("  Optimal:", isBalanced(tree5)); // false

// Test 6: Perfect tree → balanced
const tree6 = buildTree([1, 2, 3, 4, 5, 6, 7]);
console.log("\nTest 6 — [1,2,3,4,5,6,7] (perfect):");
console.log("  Brute:", isBalancedBrute(tree6)); // true
console.log("  Optimal:", isBalanced(tree6)); // true

// Test 7: One child → balanced (chênh = 1)
const tree7 = buildTree([1, 2]);
console.log("\nTest 7 — [1,2] (one child):");
console.log("  Brute:", isBalancedBrute(tree7)); // true
console.log("  Optimal:", isBalanced(tree7)); // true
