// LeetCode #255 — Verify Preorder Sequence in BST
function verifyPreorder(preorder) {
  let lowerBound = -Infinity;
  const stack = [];
  for (const val of preorder) {
    if (val < lowerBound) return false;
    while (stack.length > 0 && stack[stack.length - 1] < val) {
      lowerBound = stack.pop();
    }
    stack.push(val);
  }
  return true;
}
// Tests
console.log("=== #255 Verify Preorder ===");
console.log(`[5,2,1,3,6]: ${verifyPreorder([5,2,1,3,6])} (exp true) ${verifyPreorder([5,2,1,3,6])?"✅":"❌"}`);
console.log(`[5,2,6,1,3]: ${verifyPreorder([5,2,6,1,3])} (exp false) ${!verifyPreorder([5,2,6,1,3])?"✅":"❌"}`);
console.log(`[1]: ${verifyPreorder([1])} (exp true) ${verifyPreorder([1])?"✅":"❌"}`);
