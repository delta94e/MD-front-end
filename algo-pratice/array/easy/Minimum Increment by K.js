// ➕ Minimum Increment by K Operations — GfG (Easy)
// 📖 Explanation: Minimum Increment by K.md

function minOps(arr, k) {
  const max = Math.max(...arr);
  let ops = 0;

  for (let i = 0; i < arr.length; i++) {
    const diff = max - arr[i];
    if (diff % k !== 0) return -1;
    ops += diff / k;
  }
  return ops;
}

// Test Cases
console.log(minOps([4, 7, 19, 16], 3));      // 10
console.log(minOps([4, 4, 4, 4], 3));         // 0
console.log(minOps([4, 2, 6, 8], 3));         // -1
console.log(minOps([21, 33, 9, 45, 63], 6));  // 24
console.log(minOps([5], 2));                   // 0
