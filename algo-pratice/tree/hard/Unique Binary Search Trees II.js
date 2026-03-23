// 📖 Giải thích chi tiết: Unique Binary Search Trees II.md

// ===== CTDL =====
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// ===== HELPER: In tree dạng array (LeetCode format) =====
function treeToArray(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];
  while (queue.length > 0) {
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
  return result;
}

// ═══════════════════════════════════════════════════
// APPROACH 1: Recursive — Chọn root, chia trái/phải
// Time: O(n × Catalan(n)) | Space: O(n × Catalan(n))
// ═══════════════════════════════════════════════════
function generateTrees(n) {
  if (n === 0) return [];

  function build(start, end) {
    // Base case: không còn số nào → [null] (1 cây rỗng)
    if (start > end) return [null];

    const allTrees = [];

    // Thử MỖI số làm root
    for (let rootVal = start; rootVal <= end; rootVal++) {
      // Tất cả cây con TRÁI (từ start đến rootVal-1)
      const leftTrees = build(start, rootVal - 1);
      // Tất cả cây con PHẢI (từ rootVal+1 đến end)
      const rightTrees = build(rootVal + 1, end);

      // Ghép MỖI left với MỖI right
      for (const left of leftTrees) {
        for (const right of rightTrees) {
          const root = new TreeNode(rootVal, left, right);
          allTrees.push(root);
        }
      }
    }

    return allTrees;
  }

  return build(1, n);
}

// ═══════════════════════════════════════════════════
// APPROACH 2: Recursive + Memoization
// ═══════════════════════════════════════════════════
function generateTreesMemo(n) {
  if (n === 0) return [];
  const memo = new Map();

  function build(start, end) {
    const key = `${start}-${end}`;
    if (memo.has(key)) return memo.get(key);
    if (start > end) return [null];

    const allTrees = [];
    for (let rootVal = start; rootVal <= end; rootVal++) {
      const leftTrees = build(start, rootVal - 1);
      const rightTrees = build(rootVal + 1, end);
      for (const left of leftTrees) {
        for (const right of rightTrees) {
          allTrees.push(new TreeNode(rootVal, left, right));
        }
      }
    }

    memo.set(key, allTrees);
    return allTrees;
  }

  return build(1, n);
}

// ═══════════════════════════════════════════════════
// TEST CASES
// ═══════════════════════════════════════════════════
const tests = [
  { input: 1, expectedCount: 1, desc: 'n=1: chỉ [1]' },
  { input: 2, expectedCount: 2, desc: 'n=2: [1,null,2] và [2,1]' },
  { input: 3, expectedCount: 5, desc: 'n=3: 5 cây (Catalan #3)' },
  { input: 4, expectedCount: 14, desc: 'n=4: 14 cây (Catalan #4)' },
  { input: 5, expectedCount: 42, desc: 'n=5: 42 cây (Catalan #5)' },
];

console.log('=== generateTrees (recursive) ===');
tests.forEach(({ input, expectedCount, desc }) => {
  const result = generateTrees(input);
  const status = result.length === expectedCount ? '✅' : '❌';
  console.log(`${status} ${desc}: got ${result.length} trees`);
});

console.log('\n=== generateTreesMemo (memoized) ===');
tests.forEach(({ input, expectedCount, desc }) => {
  const result = generateTreesMemo(input);
  const status = result.length === expectedCount ? '✅' : '❌';
  console.log(`${status} ${desc}: got ${result.length} trees`);
});

// In chi tiết cho n=3
console.log('\n=== Chi tiết n=3 (5 cây): ===');
generateTrees(3).forEach((tree, i) => {
  console.log(`  Cây ${i + 1}: [${treeToArray(tree)}]`);
});
