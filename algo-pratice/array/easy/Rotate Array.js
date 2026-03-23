// 🔄 Rotate an Array — GfG (Easy-Medium)
// 📖 Explanation: Rotate Array.md

// =============================================
// Solution 1: One by One — O(n × d)
// =============================================
function rotateOneByOne(arr, d) {
  const n = arr.length;
  d %= n;

  for (let i = 0; i < d; i++) {
    const last = arr[n - 1];
    for (let j = n - 1; j > 0; j--) {
      arr[j] = arr[j - 1];
    }
    arr[0] = last;
  }
}

// =============================================
// Solution 2: Temporary Array — O(n) space
// =============================================
function rotateTemp(arr, d) {
  const n = arr.length;
  d %= n;
  const temp = new Array(n);

  for (let i = 0; i < d; i++) temp[i] = arr[n - d + i];
  for (let i = 0; i < n - d; i++) temp[i + d] = arr[i];
  for (let i = 0; i < n; i++) arr[i] = temp[i];
}

// =============================================
// Solution 3: Reversal Algorithm — O(n), O(1) ✅
// =============================================
function rotateRight(arr, d) {
  const n = arr.length;
  if (n === 0) return;
  d %= n;
  if (d === 0) return;

  reverse(arr, 0, n - 1);   // Reverse toàn bộ
  reverse(arr, 0, d - 1);   // Reverse d phần tử đầu
  reverse(arr, d, n - 1);   // Reverse n-d phần tử cuối
}

function rotateLeft(arr, d) {
  const n = arr.length;
  if (n === 0) return;
  d %= n;
  if (d === 0) return;

  reverse(arr, 0, d - 1);   // Reverse d phần tử đầu
  reverse(arr, d, n - 1);   // Reverse n-d phần tử cuối
  reverse(arr, 0, n - 1);   // Reverse toàn bộ
}

function reverse(arr, start, end) {
  while (start < end) {
    [arr[start], arr[end]] = [arr[end], arr[start]];
    start++;
    end--;
  }
}

// =============================================
// Solution 4: Juggling Algorithm — O(n), O(1)
// =============================================
function rotateJuggling(arr, d) {
  const n = arr.length;
  d %= n;

  const cycles = gcd(n, d);
  for (let i = 0; i < cycles; i++) {
    let currIdx = i;
    let currEle = arr[currIdx];

    do {
      const nextIdx = (currIdx + d) % n;
      const nextEle = arr[nextIdx];
      arr[nextIdx] = currEle;
      currEle = nextEle;
      currIdx = nextIdx;
    } while (currIdx !== i);
  }
}

function gcd(a, b) {
  while (b !== 0) { [a, b] = [b, a % b]; }
  return a;
}

// =============================================
// Test Cases
// =============================================
console.log("--- Right Rotate (Reversal) ---");
let a1 = [1, 2, 3, 4, 5, 6];
rotateRight(a1, 2);
console.log(a1); // [5, 6, 1, 2, 3, 4]

let a2 = [1, 2, 3];
rotateRight(a2, 4);
console.log(a2); // [3, 1, 2]

console.log("--- Left Rotate (Reversal) ---");
let a3 = [1, 2, 3, 4, 5, 6];
rotateLeft(a3, 2);
console.log(a3); // [3, 4, 5, 6, 1, 2]

console.log("--- Edge Cases ---");
let a4 = [1, 2, 3, 4, 5, 6];
rotateRight(a4, 0);
console.log(a4); // [1, 2, 3, 4, 5, 6]

let a5 = [1, 2, 3, 4, 5, 6];
rotateRight(a5, 6);
console.log(a5); // [1, 2, 3, 4, 5, 6]

let a6 = [7];
rotateRight(a6, 5);
console.log(a6); // [7]
