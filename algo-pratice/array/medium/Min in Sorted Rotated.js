// 🔍 Minimum in Sorted and Rotated Array — GfG (Medium)

function findMin(arr) {
  let lo = 0, hi = arr.length - 1;

  while (lo < hi) {
    if (arr[lo] < arr[hi]) return arr[lo];
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] > arr[hi]) lo = mid + 1;
    else hi = mid;
  }
  return arr[lo];
}

console.log(findMin([5, 6, 1, 2, 3, 4])); // 1
console.log(findMin([3, 1, 2]));           // 1
console.log(findMin([4, 2, 3]));           // 2
console.log(findMin([1, 2, 3, 4, 5]));     // 1 (not rotated)
console.log(findMin([2, 1]));              // 1
