// 🔄 Multiple Left Rotations — GfG (Easy)

// Modular Index — O(1) space ✅
function leftRotate(arr, k) {
  const n = arr.length;
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(arr[(k + i) % n]);
  }
  return result;
}

// Test
const arr = [1, 3, 5, 7, 9];
console.log(leftRotate(arr, 1).join(' ')); // 3 5 7 9 1
console.log(leftRotate(arr, 3).join(' ')); // 7 9 1 3 5
console.log(leftRotate(arr, 4).join(' ')); // 9 1 3 5 7
console.log(leftRotate(arr, 6).join(' ')); // 3 5 7 9 1 (6%5=1)
console.log(leftRotate(arr, 14).join(' ')); // 9 1 3 5 7 (14%5=4)
