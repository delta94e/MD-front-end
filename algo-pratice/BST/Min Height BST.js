// ============================================================
// Min Height BST — AlgoExpert
// 2 Approaches: insert() O(n log n) vs manual O(n)
// ============================================================

class BST {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }

  // O(log n) insert — dùng cho approach 1
  insert(value) {
    if (value < this.value) {
      if (!this.left) this.left = new BST(value);
      else this.left.insert(value);
    } else {
      if (!this.right) this.right = new BST(value);
      else this.right.insert(value);
    }
  }
}

// ============================================================
// Approach 1: Dùng insert() — O(n log n) time, O(n) space
// ============================================================
function minHeightBstSlow(array) {
  return buildSlow(array, null, 0, array.length - 1);
}

function buildSlow(array, bst, start, end) {
  if (start > end) return bst;
  const mid = Math.floor((start + end) / 2);
  if (!bst) {
    bst = new BST(array[mid]);
  } else {
    bst.insert(array[mid]); // O(log n) mỗi lần!
  }
  buildSlow(array, bst, start, mid - 1);
  buildSlow(array, bst, mid + 1, end);
  return bst;
}

// ============================================================
// Approach 2: Manual — O(n) time, O(n) space ⭐
// node.left = recurse(left), node.right = recurse(right)
// ============================================================
function minHeightBst(array) {
  return build(array, 0, array.length - 1);
}

function build(array, start, end) {
  if (start > end) return null; // base case!
  const mid = Math.floor((start + end) / 2);
  const node = new BST(array[mid]); // O(1)!
  node.left = build(array, start, mid - 1);
  node.right = build(array, mid + 1, end);
  return node;
}

// ============================================================
// HELPERS
// ============================================================
function getHeight(node) {
  if (!node) return -1;
  return 1 + Math.max(getHeight(node.left), getHeight(node.right));
}

function isBST(node, min = -Infinity, max = Infinity) {
  if (!node) return true;
  if (node.value < min || node.value >= max) return false;
  return isBST(node.left, min, node.value) && isBST(node.right, node.value, max);
}

function countNodes(node) {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

// ============================================================
// TESTS
// ============================================================
console.log("=== Min Height BST ===\n");

function test(name, array) {
  const r1 = minHeightBstSlow([...array]);
  const r2 = minHeightBst([...array]);

  const h1 = getHeight(r1);
  const h2 = getHeight(r2);
  const minH = Math.floor(Math.log2(array.length));

  console.log(`${name}: [${array}]`);
  console.log(`  insert():  height=${h1}, nodes=${countNodes(r1)}, valid BST=${isBST(r1)}`);
  console.log(`  manual():  height=${h2}, nodes=${countNodes(r2)}, valid BST=${isBST(r2)}`);
  console.log(`  Min possible height = ${minH}`);
  console.log(`  ${h2 === minH && isBST(r2) ? "✅" : "❌"}`);
  console.log();
}

test("Test 1 — AlgoExpert example", [1, 2, 5, 7, 10, 13, 14, 15, 22]);
test("Test 2 — 3 elements", [1, 2, 3]);
test("Test 3 — 1 element", [1]);
test("Test 4 — 2 elements", [1, 2]);
test("Test 5 — 7 elements (perfect)", [1, 2, 3, 4, 5, 6, 7]);
test("Test 6 — 15 elements", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
test("Test 7 — negative", [-10, -5, 0, 5, 10]);
