// 🧹 Remove Duplicates from Sorted Array — LeetCode #26 (Easy)
// 📖 Explanation: Remove Duplicates from Sorted Array.md

// =============================================
// Solution 1: Two Pointers — In-place ⚡
// Time: O(n), Space: O(1)
// =============================================
function removeDuplicates(nums) {
  if (nums.length === 0) return 0;

  let slow = 0; // Con trỏ ghi (write pointer)

  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast]; // Ghi giá trị mới vào vị trí tiếp theo
    }
  }
  return slow + 1; // Số phần tử unique
}

// =============================================
// Solution 1b: Two Pointers — idx/i (GfG style) ⚡
// Time: O(n), Space: O(1)
// =============================================
function removeDuplicatesGfG(arr) {
  const n = arr.length;
  if (n <= 1) return n;

  let idx = 1; // Vị trí ghi tiếp theo

  for (let i = 1; i < n; i++) {
    if (arr[i] !== arr[i - 1]) {  // So sánh liền kề!
      arr[idx++] = arr[i];        // Ghi + tăng idx
    }
  }
  return idx;
}

// =============================================
// Solution 2: Splice — Remove in-place (Chậm)
// Time: O(n²), Space: O(1)
// =============================================
function removeDuplicatesSplice(nums) {
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] === nums[i + 1]) {
      nums.splice(i + 1, 1);
      i--; // Kiểm tra lại vị trí hiện tại
    }
  }
  return nums.length;
}

// =============================================
// Solution 3: Set (Không in-place — chỉ tham khảo)
// Time: O(n), Space: O(n)
// =============================================
function removeDuplicatesSet(nums) {
  const unique = [...new Set(nums)];
  for (let i = 0; i < unique.length; i++) {
    nums[i] = unique[i];
  }
  nums.length = unique.length;
  return unique.length;
}

// =============================================
// 🆕 NON-IN-PLACE Solutions (Return mảng mới)
// =============================================

// Solution 4: Set One-liner ⭐
const removeDupsSet = (arr) => [...new Set(arr)];

// Solution 5: Filter — So sánh liền kề
const removeDupsFilter = (arr) =>
  arr.filter((val, i) => i === 0 || val !== arr[i - 1]);

// Solution 6: Reduce — Tích lũy unique
const removeDupsReduce = (arr) =>
  arr.reduce((acc, val) => {
    if (acc[acc.length - 1] !== val) acc.push(val);
    return acc;
  }, []);

// Solution 7: forEach — Xây dựng mảng mới
function removeDupsForEach(arr) {
  const result = [];
  arr.forEach((val, i) => {
    if (i === 0 || val !== arr[i - 1]) {
      result.push(val);
    }
  });
  return result;
}

// Solution 8: For loop — Cơ bản nhất
function removeDupsForLoop(arr) {
  if (arr.length === 0) return [];
  const result = [arr[0]];

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== arr[i - 1]) {
      result.push(arr[i]);
    }
  }
  return result;
}

// Solution 9: HashMap (Map) — Đánh dấu đã gặp
function removeDupsMap(arr) {
  const seen = new Map();
  const result = [];
  for (const val of arr) {
    if (!seen.has(val)) {
      seen.set(val, true);
      result.push(val);
    }
  }
  return result;
}

// Solution 10: Set has() — Check tường minh
function removeDupsSetCheck(arr) {
  const seen = new Set();
  const result = [];
  for (const val of arr) {
    if (!seen.has(val)) {
      seen.add(val);
      result.push(val);
    }
  }
  return result;
}

// Solution 11: indexOf — Tìm vị trí đầu tiên
const removeDupsIndexOf = (arr) =>
  arr.filter((val, i) => arr.indexOf(val) === i);

// Solution 12: Object keys — Dùng Object làm HashMap
function removeDupsObject(arr) {
  const seen = {};
  const result = [];
  for (const val of arr) {
    if (!seen[val]) {
      seen[val] = true;
      result.push(val);
    }
  }
  return result;
}

// =============================================
// Test Cases — In-place (return k)
// =============================================
function testInPlace(fn, name) {
  console.log(`--- ${name} ---`);

  let nums1 = [1, 1, 2];
  let k1 = fn(nums1);
  console.log(`k=${k1}, nums=[${nums1.slice(0, k1)}]`); // k=2, nums=[1,2]

  let nums2 = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
  let k2 = fn(nums2);
  console.log(`k=${k2}, nums=[${nums2.slice(0, k2)}]`); // k=5, nums=[0,1,2,3,4]

  let nums3 = [1];
  let k3 = fn(nums3);
  console.log(`k=${k3}, nums=[${nums3.slice(0, k3)}]`); // k=1, nums=[1]

  let nums4 = [];
  let k4 = fn(nums4);
  console.log(`k=${k4}, nums=[${nums4.slice(0, k4)}]`); // k=0, nums=[]

  let nums5 = [1, 2, 3, 4, 5];
  let k5 = fn(nums5);
  console.log(`k=${k5}, nums=[${nums5.slice(0, k5)}]`); // k=5, nums=[1,2,3,4,5]
}

// Test Cases — Non-in-place (return Array)
function testNonInPlace(fn, name) {
  console.log(`--- ${name} ---`);
  console.log(fn([1, 1, 2]));                         // [1, 2]
  console.log(fn([0, 0, 1, 1, 1, 2, 2, 3, 3, 4]));   // [0, 1, 2, 3, 4]
  console.log(fn([1]));                                // [1]
  console.log(fn([]));                                 // []
  console.log(fn([1, 2, 3, 4, 5]));                   // [1, 2, 3, 4, 5]
  console.log(fn([2, 2, 2, 2, 2]));                   // [2]
}

console.log("========== IN-PLACE ==========\n");
testInPlace(removeDuplicates, "Two Pointers (slow/fast)");
testInPlace(removeDuplicatesGfG, "Two Pointers (idx/i GfG)");
testInPlace(removeDuplicatesSplice, "Splice");
testInPlace(removeDuplicatesSet, "Set → ghi lại");

console.log("\n========== NON-IN-PLACE ==========\n");
testNonInPlace(removeDupsSet, "Set One-liner");
testNonInPlace(removeDupsFilter, "Filter");
testNonInPlace(removeDupsReduce, "Reduce");
testNonInPlace(removeDupsForEach, "forEach");
testNonInPlace(removeDupsForLoop, "For loop");
testNonInPlace(removeDupsMap, "HashMap (Map)");
testNonInPlace(removeDupsSetCheck, "Set has()");
testNonInPlace(removeDupsIndexOf, "indexOf");
testNonInPlace(removeDupsObject, "Object keys");
