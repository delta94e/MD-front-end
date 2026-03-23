// 👑 Leaders in an Array — GfG (Easy)
// 📖 Explanation: Leaders in an Array.md

// =============================================
// Solution 1: Brute Force — O(n²)
// =============================================
function leadersBrute(arr) {
  const result = [];
  const n = arr.length;

  for (let i = 0; i < n; i++) {
    let isLeader = true;

    for (let j = i + 1; j < n; j++) {
      if (arr[j] > arr[i]) {
        isLeader = false;
        break;
      }
    }

    if (isLeader) result.push(arr[i]);
  }
  return result;
}

// =============================================
// Solution 2: Suffix Maximum — O(n) ✅
// =============================================
function leaders(arr) {
  const result = [];
  const n = arr.length;

  // Bắt đầu từ phần tử cuối = luôn là leader
  let maxRight = arr[n - 1];
  result.push(maxRight);

  // Scan từ PHẢI → TRÁI
  for (let i = n - 2; i >= 0; i--) {
    if (arr[i] >= maxRight) {
      maxRight = arr[i];
      result.push(maxRight);
    }
  }

  result.reverse();
  return result;
}

// =============================================
// Test Cases
// =============================================
console.log(leaders([16, 17, 4, 3, 5, 2])); // [17, 5, 2]
console.log(leaders([1, 2, 3, 4, 5, 2]));   // [5, 2]
console.log(leaders([5, 4, 3, 2, 1]));       // [5, 4, 3, 2, 1]
console.log(leaders([1, 2, 3, 4, 5]));       // [5]
console.log(leaders([7]));                    // [7]
console.log(leaders([5, 5, 5]));             // [5, 5, 5]

console.log("--- Brute Force ---");
console.log(leadersBrute([16, 17, 4, 3, 5, 2])); // [17, 5, 2]
