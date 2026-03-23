// 📖 Giải thích chi tiết: Palindromic Path Queries in a Tree.md

// ===== Approach: Euler Tour + Fenwick Tree + LCA =====

// ──────────────────────────────────────────────
// HELPER: Fenwick Tree (Binary Indexed Tree)
// Hỗ trợ: point update, prefix XOR query
// ──────────────────────────────────────────────
class FenwickTree {
  constructor(n) {
    this.n = n;
    this.tree = new Array(n + 1).fill(0);
  }

  // Cập nhật: XOR vị trí i với val
  update(i, val) {
    for (i += 1; i <= this.n; i += i & (-i))
      this.tree[i] ^= val;
  }

  // Query: XOR prefix [0...i]
  query(i) {
    let result = 0;
    for (i += 1; i > 0; i -= i & (-i))
      result ^= this.tree[i];
    return result;
  }
}

// ──────────────────────────────────────────────
// MAIN SOLUTION
// ──────────────────────────────────────────────
function palindromicPathQueries(n, edges, s, queries) {
  // ===== BƯỚC 1: Build adjacency list =====
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  // ===== BƯỚC 2: DFS — tính Euler Tour + depth + parent (Binary Lifting) =====
  const LOG = Math.ceil(Math.log2(n)) + 1;
  const tin = new Array(n).fill(0);      // thời gian VÀO node (Euler Tour)
  const tout = new Array(n).fill(0);     // thời gian RA node
  const depth = new Array(n).fill(0);
  const up = Array.from({ length: n }, () => new Array(LOG).fill(0)); // binary lifting

  let timer = 0;

  // DFS iterative (tránh stack overflow cho n lớn)
  function dfs(root) {
    const stack = [[root, -1, false]];
    while (stack.length > 0) {
      const [node, parent, processed] = stack.pop();

      if (processed) {
        tout[node] = timer++;
        continue;
      }

      tin[node] = timer++;
      up[node][0] = parent === -1 ? root : parent;
      depth[node] = parent === -1 ? 0 : depth[parent] + 1;

      for (let k = 1; k < LOG; k++)
        up[node][k] = up[up[node][k - 1]][k - 1];

      // Push "processed" marker
      stack.push([node, parent, true]);

      // Push children (reversed for correct DFS order)
      for (let i = adj[node].length - 1; i >= 0; i--) {
        const child = adj[node][i];
        if (child !== parent) stack.push([child, node, false]);
      }
    }
  }

  dfs(0);

  // ===== BƯỚC 3: LCA bằng Binary Lifting =====
  function lca(u, v) {
    if (depth[u] < depth[v]) [u, v] = [v, u];

    let diff = depth[u] - depth[v];
    for (let k = 0; k < LOG; k++)
      if ((diff >> k) & 1) u = up[u][k];

    if (u === v) return u;

    for (let k = LOG - 1; k >= 0; k--)
      if (up[u][k] !== up[v][k]) {
        u = up[u][k];
        v = up[v][k];
      }

    return up[u][0];
  }

  // ===== BƯỚC 4: Fenwick Tree + Euler Tour =====
  // Mỗi node có 1 ký tự → biểu diễn bằng bitmask: 1 << (char - 'a')
  // XOR prefix từ root đến node = parity (chẵn/lẻ) của từng ký tự

  const bit = new FenwickTree(2 * n);
  const charCode = (c) => c.charCodeAt(0) - 'a'.charCodeAt(0);
  const nodeMask = new Array(n);           // bitmask hiện tại của mỗi node

  // Khởi tạo: đặt bitmask cho mỗi node vào Euler Tour
  const sArr = s.split('');
  for (let i = 0; i < n; i++) {
    nodeMask[i] = 1 << charCode(sArr[i]);
    bit.update(tin[i], nodeMask[i]);      // vào: XOR bitmask
    bit.update(tout[i], nodeMask[i]);     // ra: XOR lại (undo)
  }

  // pathXOR(u, v): XOR tất cả ký tự trên path u→v
  // = prefixXOR(u) ^ prefixXOR(v) ^ mask(lca)
  // Vì LCA bị XOR trừ 2 lần (1 lần ở mỗi prefix), cần XOR lại 1 lần
  function pathXOR(u, v) {
    const l = lca(u, v);
    const xorU = bit.query(tin[u]);
    const xorV = bit.query(tin[v]);
    const xorL = nodeMask[l]; // mask tại LCA sẽ bị XOR ra 2 lần → thêm lại
    // prefixXOR(u) ^ prefixXOR(v) sẽ XOR LCA 2 lần = 0
    // Cần thêm LCA lại 1 lần
    return xorU ^ xorV ^ xorL;
  }

  // Palindrome check: tối đa 1 bit được set (tối đa 1 ký tự lẻ)
  function canPalindrome(mask) {
    return (mask & (mask - 1)) === 0;  // 0 hoặc power of 2
  }

  // ===== BƯỚC 5: Xử lý queries =====
  const answer = [];

  for (const q of queries) {
    const parts = q.split(' ');

    if (parts[0] === 'update') {
      const node = parseInt(parts[1]);
      const newChar = parts[2];
      const newMask = 1 << charCode(newChar);

      // XOR bỏ mask cũ, XOR thêm mask mới
      bit.update(tin[node], nodeMask[node] ^ newMask);
      bit.update(tout[node], nodeMask[node] ^ newMask);
      nodeMask[node] = newMask;
      sArr[node] = newChar;

    } else { // query
      const u = parseInt(parts[1]);
      const v = parseInt(parts[2]);
      const mask = pathXOR(u, v);
      answer.push(canPalindrome(mask));
    }
  }

  return answer;
}

// ═══════════════════════════════════════════════════
// TEST CASES
// ═══════════════════════════════════════════════════
function arrEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

const tests = [
  {
    n: 3,
    edges: [[0, 1], [1, 2]],
    s: 'aac',
    queries: ['query 0 2', 'update 1 b', 'query 0 2'],
    expected: [true, false],
    desc: 'Example 1: aac → aca palindrome, abc not',
  },
  {
    n: 4,
    edges: [[0, 1], [0, 2], [0, 3]],
    s: 'abca',
    queries: ['query 1 2', 'update 0 b', 'query 2 3', 'update 3 a', 'query 1 3'],
    expected: [false, false, true],
    desc: 'Example 2: multiple updates and queries',
  },
  {
    n: 1,
    edges: [],
    s: 'a',
    queries: ['query 0 0'],
    expected: [true],
    desc: 'Single node — always palindrome',
  },
  {
    n: 2,
    edges: [[0, 1]],
    s: 'aa',
    queries: ['query 0 1', 'update 1 b', 'query 0 1'],
    expected: [true, false],
    desc: 'Two nodes: aa→palindrome, ab→not',
  },
];

console.log('=== palindromicPathQueries ===');
tests.forEach(({ n, edges, s, queries, expected, desc }) => {
  const result = palindromicPathQueries(n, edges, s, queries);
  const status = arrEqual(result, expected) ? '✅' : '❌';
  console.log(`${status} ${desc}`);
  if (!arrEqual(result, expected)) {
    console.log(`   got:      [${result}]`);
    console.log(`   expected: [${expected}]`);
  }
});
