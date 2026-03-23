// 🔁 Array Reverse — GfG (Easy)
// 📖 Explanation: Array Reverse.md

// =============================================
// Solution 1: Temporary Array — O(n) space
// =============================================
function reverseArrayCopy(arr) {
  const n = arr.length;
  const temp = new Array(n);

  for (let i = 0; i < n; i++) {
    temp[i] = arr[n - i - 1];
  }
  for (let i = 0; i < n; i++) {
    arr[i] = temp[i];
  }
}

// =============================================
// Solution 2: Two Pointers — O(1) space ✅
// =============================================
function reverseArray(arr) {
  let left = 0, right = arr.length - 1;

  while (left < right) {
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left++;
    right--;
  }
}

// =============================================
// Solution 3: For loop — mirror index
// =============================================
function reverseArrayLoop(arr) {
  const n = arr.length;
  for (let i = 0; i < Math.floor(n / 2); i++) {
    [arr[i], arr[n - 1 - i]] = [arr[n - 1 - i], arr[i]];
  }
}

// =============================================
// Test Cases
// =============================================
let arr1 = [1, 4, 3, 2, 6, 5];
reverseArray(arr1);
console.log(arr1); // [5, 6, 2, 3, 4, 1]

let arr2 = [4, 5, 1, 2];
reverseArray(arr2);
console.log(arr2); // [2, 1, 5, 4]

let arr3 = [1, 2, 3, 4, 5];
reverseArray(arr3);
console.log(arr3); // [5, 4, 3, 2, 1]

let arr4 = [7];
reverseArray(arr4);
console.log(arr4); // [7]

let arr5 = [];
reverseArray(arr5);
console.log(arr5); // []
