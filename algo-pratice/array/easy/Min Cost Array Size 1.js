// 💰 Minimum Cost to Make Array Size 1 — GfG (Easy)
// 📖 Explanation: Min Cost Array Size 1.md

function minCost(arr) {
  const min = Math.min(...arr);
  return (arr.length - 1) * min;
}

// Test Cases
console.log(minCost([4, 3, 2]));     // 4
console.log(minCost([3, 4]));        // 3
console.log(minCost([1, 5, 7, 3]));  // 3
console.log(minCost([10]));          // 0
console.log(minCost([1, 1, 1]));     // 2
