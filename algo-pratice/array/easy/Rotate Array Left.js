// 🔄 Rotate Array Left (Counterclockwise) — GfG (Easy)
// 📖 Explanation: Rotate Array Left.md

// =============================================
// Solution 1: One by One — O(n × d)
// =============================================
function rotateLeftOneByOne(arr, d) {
  const n = arr.length;
  d %= n;
  for (let i = 0; i < d; i++) {
    const first = arr[0];
    for (let j = 0; j < n - 1; j++) arr[j] = arr[j + 1];
    arr[n - 1] = first;
  }
}

// =============================================
// Solution 2: Temp Array — O(n) space
// =============================================
function rotateLeftTemp(arr, d) {
  const n = arr.length;
  d %= n;
  const temp = new Array(n);
  for (let i = 0; i < n - d; i++) temp[i] = arr[d + i];
  for (let i = 0; i < d; i++) temp[n - d + i] = arr[i];
  for (let i = 0; i < n; i++) arr[i] = temp[i];
}

// =============================================
// Solution 3: Reversal Algorithm — O(n), O(1) ✅
// =============================================
function rotateLeft(arr, d) {
  const n = arr.length;
  if (n === 0) return;
  d %= n;
  if (d === 0) return;

  reverse(arr, 0, d - 1);   // Reverse đầu
  reverse(arr, d, n - 1);   // Reverse cuối
  reverse(arr, 0, n - 1);   // Reverse all
}

function reverse(arr, start, end) {
  while (start < end) {
    [arr[start], arr[end]] = [arr[end], arr[start]];
    start++;
    end--;
  }
}

// =============================================
// Test Cases
// =============================================
let a1 = [1, 2, 3, 4, 5, 6];
rotateLeft(a1, 2);
console.log(a1); // [3, 4, 5, 6, 1, 2]

let a2 = [1, 2, 3];
rotateLeft(a2, 4);
console.log(a2); // [2, 3, 1]

let a3 = [1, 2, 3, 4, 5, 6];
rotateLeft(a3, 0);
console.log(a3); // [1, 2, 3, 4, 5, 6]

let a4 = [1, 2, 3, 4, 5, 6];
rotateLeft(a4, 6);
console.log(a4); // [1, 2, 3, 4, 5, 6]
