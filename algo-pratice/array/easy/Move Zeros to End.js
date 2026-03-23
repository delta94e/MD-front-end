// 0️⃣ Move all Zeros to End — GfG (Easy) / LeetCode #283
// 📖 Explanation: Move Zeros to End.md

// =============================================
// Solution 1: Temp Array — O(n) space
// =============================================
function moveZerosTemp(arr) {
  const n = arr.length;
  const temp = new Array(n).fill(0);
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (arr[i] !== 0) temp[j++] = arr[i];
  }
  for (let i = 0; i < n; i++) arr[i] = temp[i];
}

// =============================================
// Solution 2: Two Traversals — O(1) space
// =============================================
function moveZerosTwoPass(arr) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== 0) arr[count++] = arr[i];
  }
  while (count < arr.length) arr[count++] = 0;
}

// =============================================
// Solution 3: One Traversal SWAP — O(1) space ✅
// =============================================
function moveZeros(arr) {
  let count = 0;

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== 0) {
      [arr[i], arr[count]] = [arr[count], arr[i]];
      count++;
    }
  }
}

// =============================================
// Test Cases
// =============================================
let a1 = [1, 2, 0, 4, 3, 0, 5, 0];
moveZeros(a1);
console.log(a1); // [1, 2, 4, 3, 5, 0, 0, 0]

let a2 = [10, 20, 30];
moveZeros(a2);
console.log(a2); // [10, 20, 30]

let a3 = [0, 0];
moveZeros(a3);
console.log(a3); // [0, 0]

let a4 = [0, 1, 0, 3, 12];
moveZeros(a4);
console.log(a4); // [1, 3, 12, 0, 0]
