// 🔄 Alternate Elements of an Array — GfG (Easy)
// 📖 Explanation: Alternate Elements of an Array.md

// =============================================
// Solution 1: Iterative — Step 2 ⚡
// Time: O(n/2), Space: O(1)
// =============================================
function getAlternates(arr) {
  const res = [];

  // Bước nhảy 2: lấy index 0, 2, 4, 6, ...
  for (let i = 0; i < arr.length; i += 2) {
    res.push(arr[i]);
  }
  return res;
}

// =============================================
// Solution 2: Recursive
// Time: O(n/2), Space: O(n/2) stack
// =============================================
function getAlternatesRecursive(arr) {
  const res = [];

  function recurse(idx) {
    if (idx >= arr.length) return;
    res.push(arr[idx]);
    recurse(idx + 2);
  }

  recurse(0);
  return res;
}

// =============================================
// Solution 3: Functional (One-liner)
// Time: O(n), Space: O(1)
// =============================================
const getAlternatesFn = (arr) => arr.filter((_, i) => i % 2 === 0);

// =============================================
// Test Cases
// =============================================
console.log(getAlternates([10, 20, 30, 40, 50])); // [10, 30, 50]
console.log(getAlternates([-5, 1, 4, 2, 12]));    // [-5, 4, 12]
console.log(getAlternates([1]));                    // [1]
console.log(getAlternates([1, 2]));                 // [1]
console.log(getAlternates([]));                     // []

console.log("--- Recursive ---");
console.log(getAlternatesRecursive([10, 20, 30, 40, 50])); // [10, 30, 50]

console.log("--- Functional ---");
console.log(getAlternatesFn([10, 20, 30, 40, 50]));        // [10, 30, 50]
