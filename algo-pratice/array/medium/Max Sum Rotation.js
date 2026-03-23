// 🔢 Maximum Sum of i×arr[i] Among All Rotations — GfG (Medium)

function maxSum(arr) {
  const n = arr.length;
  let curSum = 0;
  for (let i = 0; i < n; i++) curSum += arr[i];

  let currVal = 0;
  for (let i = 0; i < n; i++) currVal += i * arr[i];

  let res = currVal;
  for (let i = 1; i < n; i++) {
    currVal = currVal - curSum + arr[i - 1] * n;
    res = Math.max(res, currVal);
  }
  return res;
}

console.log(maxSum([8, 3, 1, 2])); // 29
console.log(maxSum([1, 2, 3]));    // 8
console.log(maxSum([1, 20, 2, 10])); // 72
