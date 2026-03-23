// 📖 Giải thích chi tiết: Binary Tree Maximum Path Sum.md

// ===== CTDL =====
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// ===== HELPER: Tạo tree từ array =====
function buildTree(arr) {
  if (!arr || arr.length === 0) return null;
  const nodes = arr.map(val => val !== null ? new TreeNode(val) : null);
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i] === null) continue;
    const leftIdx = 2 * i + 1;
    const rightIdx = 2 * i + 2;
    if (leftIdx < nodes.length) nodes[i].left = nodes[leftIdx];
    if (rightIdx < nodes.length) nodes[i].right = nodes[rightIdx];
  }
  return nodes[0];
}

// ═══════════════════════════════════════════════════
// APPROACH 1: Recursive Post-Order + Global Max
// Time: O(n) | Space: O(h)
// ═══════════════════════════════════════════════════
function maxPathSum(root) {
  let globalMax = -Infinity;

  function dfs(node) {
    if (node === null) return 0;

    // Lấy đóng góp từ con, nếu ÂM → bỏ (lấy 0)
    const left = Math.max(dfs(node.left), 0);
    const right = Math.max(dfs(node.right), 0);

    // Path tốt nhất ĐI QUA node này (hình chữ V, lấy cả 2 nhánh)
    const pathThruNode = left + node.val + right;
    globalMax = Math.max(globalMax, pathThruNode);

    // Đóng góp cho parent: chỉ 1 nhánh (path phải THẲNG lên)
    return node.val + Math.max(left, right);
  }

  dfs(root);
  return globalMax;
}

// ═══════════════════════════════════════════════════
// APPROACH 2: Trả về tuple [globalMax, contribution]
// (không dùng biến global — functional style)
// Time: O(n) | Space: O(h)
// ═══════════════════════════════════════════════════
function maxPathSumFunctional(root) {
  function dfs(node) {
    if (node === null) return [-Infinity, 0];

    const [leftMax, leftContrib] = dfs(node.left);
    const [rightMax, rightContrib] = dfs(node.right);

    const left = Math.max(leftContrib, 0);
    const right = Math.max(rightContrib, 0);

    const pathThruNode = left + node.val + right;
    const bestSoFar = Math.max(leftMax, rightMax, pathThruNode);
    const contribution = node.val + Math.max(left, right);

    return [bestSoFar, contribution];
  }

  return dfs(root)[0];
}

// ═══════════════════════════════════════════════════
// TEST CASES
// ═══════════════════════════════════════════════════
const tests = [
  { input: [1, 2, 3], expected: 6, desc: 'Simple: 2→1→3' },
  { input: [-15, 10, 20, null, null, 15, 5, null, null, null, null, -5], expected: 40, desc: '15→20→5' },
  { input: [1], expected: 1, desc: 'Single node' },
  { input: [-3], expected: -3, desc: 'Single negative node' },
  { input: [2, -1], expected: 2, desc: 'Negative child — skip it' },
  { input: [-1, -2, -3], expected: -1, desc: 'All negative — pick least negative' },
  { input: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1], expected: 49, desc: 'Complex tree' },
];

console.log('=== maxPathSum (global variable) ===');
tests.forEach(({ input, expected, desc }) => {
  const result = maxPathSum(buildTree(input));
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} ${desc}: got ${result}, expected ${expected}`);
});

console.log('\n=== maxPathSumFunctional (tuple) ===');
tests.forEach(({ input, expected, desc }) => {
  const result = maxPathSumFunctional(buildTree(input));
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} ${desc}: got ${result}, expected ${expected}`);
});
