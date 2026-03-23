// ═══════════════════════════════════════════════════════════════
// 🌳 INVERT BINARY TREE (LeetCode #226)
// ═══════════════════════════════════════════════════════════════
// 📖 Giải thích chi tiết: ./Invert Binary Tree.md

class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// ─── APPROACH 1: RECURSIVE DFS (Pre-order) ──────────────────

function invertTree(root) {
  if (root === null) return null;

  [root.left, root.right] = [root.right, root.left];

  invertTree(root.left);
  invertTree(root.right);

  return root;
}

// ─── APPROACH 1B: RECURSIVE DFS (Post-order) ────────────────

function invertTreePostOrder(root) {
  if (root === null) return null;

  const left = invertTreePostOrder(root.left);
  const right = invertTreePostOrder(root.right);

  root.left = right;
  root.right = left;

  return root;
}

// ─── APPROACH 2: ITERATIVE BFS (Queue) ──────────────────────

function invertTreeBFS(root) {
  if (root === null) return null;

  const queue = [root];

  while (queue.length > 0) {
    const node = queue.shift();

    [node.left, node.right] = [node.right, node.left];

    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }

  return root;
}

// ─── APPROACH 3: ITERATIVE DFS (Stack) ──────────────────────

function invertTreeDFS(root) {
  if (root === null) return null;

  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();

    [node.left, node.right] = [node.right, node.left];

    if (node.left) stack.push(node.left);
    if (node.right) stack.push(node.right);
  }

  return root;
}

// ─── TESTS ──────────────────────────────────────────────────

function buildTree() {
  return new TreeNode(
    4,
    new TreeNode(2, new TreeNode(1), new TreeNode(3)),
    new TreeNode(7, new TreeNode(6), new TreeNode(9))
  );
}

function printTree(root) {
  if (!root) return '[]';
  const result = [];
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (node) {
      result.push(node.val);
      queue.push(node.left);
      queue.push(node.right);
    } else {
      result.push(null);
    }
  }
  while (result[result.length - 1] === null) result.pop();
  return `[${result.join(', ')}]`;
}

// Test 1: Normal tree
console.log('=== Test 1: Normal tree ===');
let tree1 = buildTree();
console.log('Before:', printTree(tree1)); // [4, 2, 7, 1, 3, 6, 9]
invertTree(tree1);
console.log('After: ', printTree(tree1)); // [4, 7, 2, 9, 6, 3, 1]

// Test 2: Empty tree
console.log('\n=== Test 2: Empty tree ===');
console.log('Result:', invertTree(null)); // null

// Test 3: Single node
console.log('\n=== Test 3: Single node ===');
let tree3 = new TreeNode(42);
invertTree(tree3);
console.log('Result:', printTree(tree3)); // [42]

// Test 4: Unbalanced
console.log('\n=== Test 4: Unbalanced ===');
let tree4 = new TreeNode(1, new TreeNode(2, new TreeNode(3)));
console.log('Before:', printTree(tree4)); // [1, 2, null, 3]
invertTree(tree4);
console.log('After: ', printTree(tree4)); // [1, null, 2, null, 3]

// Test 5: BFS approach
console.log('\n=== Test 5: BFS approach ===');
let tree5 = buildTree();
invertTreeBFS(tree5);
console.log('BFS:   ', printTree(tree5)); // [4, 7, 2, 9, 6, 3, 1]
