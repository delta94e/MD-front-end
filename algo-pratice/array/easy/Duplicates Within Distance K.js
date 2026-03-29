// 🔍 Duplicates Within Distance K — GfG (Easy) / LeetCode #219
// 📖 Explanation: Duplicates Within Distance K.md

// =============================================
// Solution 1: Brute Force — O(n × min(n, k))
// =============================================
function hasDuplicateBrute(arr, k) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j <= Math.min(i + k, n - 1); j++) {
      if (arr[i] === arr[j]) return "Yes";
    }
  }
  return "No";
}

// =============================================
// Solution 2: HashMap (Last Index) — O(n), O(n) ✅
// =============================================
function hasDuplicateMap(arr, k) {
  const map = new Map();

  for (let i = 0; i < arr.length; i++) {
    if (map.has(arr[i]) && i - map.get(arr[i]) <= k) {
      return "Yes";
    }
    map.set(arr[i], i);
  }

  return "No";
}

// =============================================
// Solution 3: Sliding Window + Set — O(n), O(k)
// =============================================
function hasDuplicateWindow(arr, k) {
  const window = new Set();

  for (let i = 0; i < arr.length; i++) {
    if (window.has(arr[i])) return "Yes";

    window.add(arr[i]);

    // Giữ window size <= k
    if (window.size > k) {
      window.delete(arr[i - k]);
    }
  }

  return "No";
}

// =============================================
// Test Cases
// =============================================
console.log(hasDuplicateMap([1, 2, 3, 4, 1, 2, 3, 4], 3)); // No
console.log(hasDuplicateMap([1, 2, 3, 1, 4, 5], 3)); // Yes
console.log(hasDuplicateMap([1, 2, 3, 4, 5], 3)); // No
console.log(hasDuplicateMap([1, 1], 1)); // Yes
console.log(hasDuplicateMap([1], 1)); // No
console.log(hasDuplicateMap([1, 0, 1, 1], 1)); // Yes
console.log(hasDuplicateMap([1, 2, 3, 1, 2, 3], 2)); // No
