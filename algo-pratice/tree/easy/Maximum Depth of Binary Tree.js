// ═══════════════════════════════════════════════════════════════
// 🌳 MAXIMUM DEPTH OF BINARY TREE (LeetCode #104)
// ═══════════════════════════════════════════════════════════════
// 📖 Giải thích chi tiết: ./Maximum Depth of Binary Tree.md

class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// ─── APPROACH 1: RECURSIVE DFS (Post-order) ─────────────────

function maxDepth(root) {
  if (root === null) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}

// ─── APPROACH 2: ITERATIVE BFS (Level-order) ────────────────

function maxDepthBFS(root) {
  if (root === null) return 0;

  const queue = [root];
  let depth = 0;

  while (queue.length > 0) {
    const levelSize = queue.length;
    depth++;

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  return depth;
}

// ─── APPROACH 3: ITERATIVE DFS (Stack + depth tracking) ─────

function maxDepthDFS(root) {
  if (root === null) return 0;

  const stack = [{ node: root, depth: 1 }];
  let maxD = 0;

  while (stack.length > 0) {
    const { node, depth } = stack.pop();
    maxD = Math.max(maxD, depth);

    if (node.left) stack.push({ node: node.left, depth: depth + 1 });
    if (node.right) stack.push({ node: node.right, depth: depth + 1 });
  }

  return maxD;
}

// ─── TESTS ──────────────────────────────────────────────────

// Test 1: [1,2,3,null,null,4] → depth 3
const tree1 = new TreeNode(
  1,
  new TreeNode(2),
  new TreeNode(3, new TreeNode(4))
);
console.log('Test 1:', maxDepth(tree1)); // 3

// Test 2: Empty tree
console.log('Test 2:', maxDepth(null)); // 0

// Test 3: Single node
console.log('Test 3:', maxDepth(new TreeNode(42))); // 1

// Test 4: Left-skewed
const tree4 = new TreeNode(1, new TreeNode(2, new TreeNode(3)));
console.log('Test 4:', maxDepth(tree4)); // 3

// Test 5: BFS approach
console.log('Test 5 BFS:', maxDepthBFS(tree1)); // 3

// Test 6: DFS stack approach
console.log('Test 6 DFS:', maxDepthDFS(tree1)); // 3
