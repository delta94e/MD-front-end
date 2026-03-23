// 📦 Generating All Subarrays — GfG (Easy)
// 📖 Explanation: Generating All Subarrays.md

// =============================================
// Solution 1: 3 vòng for — O(n³)
// =============================================
function allSubarrays3Loops(arr) {
  const n = arr.length;
  const result = [];

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const sub = [];
      for (let k = i; k <= j; k++) {
        sub.push(arr[k]);
      }
      result.push(sub);
    }
  }
  return result;
}

// =============================================
// Solution 2: 2 vòng + slice — O(n²) ✅
// =============================================
function allSubarrays(arr) {
  const result = [];

  for (let i = 0; i < arr.length; i++) {
    for (let j = i; j < arr.length; j++) {
      result.push(arr.slice(i, j + 1));
    }
  }
  return result;
}

// =============================================
// Solution 3: Recursive
// =============================================
function allSubarraysRecursive(arr) {
  const result = [];

  function recurse(start, end) {
    if (end === arr.length) return;

    if (start > end) {
      recurse(0, end + 1);
      return;
    }

    result.push(arr.slice(start, end + 1));
    recurse(start + 1, end);
  }

  recurse(0, 0);
  return result;
}

// =============================================
// Test Cases
// =============================================
console.log("--- 2 loops + slice ---");
console.log(allSubarrays([1, 2, 3]));
// [[1],[1,2],[1,2,3],[2],[2,3],[3]]

console.log(allSubarrays([1, 2]));
// [[1],[1,2],[2]]

console.log(allSubarrays([5]));
// [[5]]

console.log(`Count for n=4: ${allSubarrays([1,2,3,4]).length}`);
// 10 = 4×5/2

console.log("--- Recursive ---");
console.log(allSubarraysRecursive([1, 2, 3]));
