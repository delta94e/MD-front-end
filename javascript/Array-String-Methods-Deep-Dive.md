# Array & String Methods — Deep Dive!

> **Tổng hợp methods phổ biến nhất!**
> CRUD, traverse, transform, search, sort + tự viết lại!

---

## §1. Array — CRUD (Thay Đổi Mảng Gốc!)

```
  CRUD METHODS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ TẤT CẢ methods này THAY ĐỔI mảng gốc! ★                  │
  │                                                              │
  │  push / pop — CUỐI mảng:                                       │
  │  ┌───┬───┬───┐                 ┌───┬───┬───┬───┐            │
  │  │ 1 │ 2 │ 3 │  .push(4) →    │ 1 │ 2 │ 3 │ 4 │ ★          │
  │  └───┴───┴───┘                 └───┴───┴───┴───┘            │
  │  ┌───┬───┬───┐                 ┌───┬───┐                    │
  │  │ 1 │ 2 │ 3 │  .pop() →      │ 1 │ 2 │  return 3 ★        │
  │  └───┴───┴───┘                 └───┴───┘                    │
  │                                                              │
  │  unshift / shift — ĐẦU mảng:                                   │
  │  ┌───┬───┬───┐                 ┌───┬───┬───┬───┐            │
  │  │ 1 │ 2 │ 3 │  .unshift(0) → │ 0 │ 1 │ 2 │ 3 │ ★          │
  │  └───┴───┴───┘                 └───┴───┴───┴───┘            │
  │  ┌───┬───┬───┐                 ┌───┬───┐                    │
  │  │ 1 │ 2 │ 3 │  .shift() →    │ 2 │ 3 │  return 1 ★        │
  │  └───┴───┴───┘                 └───┴───┘                    │
  │                                                              │
  │  splice — BẤT KỲ vị trí:                                       │
  │  ┌───┬───┬───┬───┐                                           │
  │  │ 1 │ 2 │ 3 │ 4 │  .splice(1, 2, 8, 9) ★                   │
  │  └───┴───┴───┴───┘  ↑start ↑del  ↑add                       │
  │                                                              │
  │  ┌───┬───┬───┬───┐  return [2, 3] (đã xóa!)                │
  │  │ 1 │ 8 │ 9 │ 4 │  ★                                       │
  │  └───┴───┴───┴───┘                                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: push, pop, unshift, shift, splice!
// ═══════════════════════════════════════════════════════════

// ★ push — thêm cuối, return length mới!
function myPush(arr, item) {
  arr[arr.length] = item;
  return arr.length;
}

// ★ pop — xóa cuối, return phần tử xóa!
function myPop(arr) {
  if (arr.length === 0) return undefined;
  var last = arr[arr.length - 1];
  arr.length = arr.length - 1;
  return last;
}

// ★ unshift — thêm đầu, return length mới!
function myUnshift(arr, item) {
  for (var i = arr.length; i > 0; i--) {
    arr[i] = arr[i - 1]; // ★ Dịch phải tất cả!
  }
  arr[0] = item;
  return arr.length;
}

// ★ shift — xóa đầu, return phần tử xóa!
function myShift(arr) {
  if (arr.length === 0) return undefined;
  var first = arr[0];
  for (var i = 0; i < arr.length - 1; i++) {
    arr[i] = arr[i + 1]; // ★ Dịch trái tất cả!
  }
  arr.length = arr.length - 1;
  return first;
}

// ★ splice — xóa/thêm tại vị trí bất kỳ!
function mySplice(arr, start, deleteCount) {
  var removed = [];
  var newItems = [];
  for (var a = 3; a < arguments.length; a++) {
    newItems.push(arguments[a]);
  }

  // Lưu phần tử bị xóa!
  for (var i = 0; i < deleteCount; i++) {
    removed.push(arr[start + i]);
  }

  // Tạo mảng mới: trước + newItems + sau!
  var before = [];
  for (var j = 0; j < start; j++) before.push(arr[j]);
  var after = [];
  for (var k = start + deleteCount; k < arr.length; k++) after.push(arr[k]);

  // Ghi lại vào arr!
  arr.length = 0;
  var all = before.concat(newItems).concat(after);
  for (var m = 0; m < all.length; m++) arr[m] = all[m];

  return removed; // ★ Return phần tử đã xóa!
}
```

---

## §2. Array — Duyệt (Không Đổi Gốc!)

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: forEach, map, filter, find, findIndex!
// ═══════════════════════════════════════════════════════════

// ★ forEach — duyệt, KHÔNG return!
function myForEach(arr, fn) {
  for (var i = 0; i < arr.length; i++) {
    fn(arr[i], i, arr);
  }
  // ★ return undefined! Không tạo mảng mới!
  // ★ KHÔNG thể break! (khác for loop!)
}

// ★ map — duyệt + return MẢNG MỚI! ★
function myMap(arr, fn) {
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    result.push(fn(arr[i], i, arr)); // ★ Push kết quả callback!
  }
  return result; // ★ Mảng mới, KHÔNG đổi gốc!
}

// ★ filter — lọc theo điều kiện! ★
function myFilter(arr, fn) {
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    if (fn(arr[i], i, arr)) {
      result.push(arr[i]); // ★ Chỉ giữ phần tử thỏa mãn!
    }
  }
  return result;
}

// ★ find — tìm phần tử ĐẦU TIÊN thỏa mãn!
function myFind(arr, fn) {
  for (var i = 0; i < arr.length; i++) {
    if (fn(arr[i], i, arr)) {
      return arr[i]; // ★ Trả ngay khi tìm thấy!
    }
  }
  return undefined; // ★ Không tìm thấy!
}

// ★ findIndex — tìm INDEX đầu tiên thỏa mãn!
function myFindIndex(arr, fn) {
  for (var i = 0; i < arr.length; i++) {
    if (fn(arr[i], i, arr)) {
      return i; // ★ Trả index!
    }
  }
  return -1; // ★ Không tìm thấy!
}

// ★ every — TẤT CẢ thỏa mãn?
function myEvery(arr, fn) {
  for (var i = 0; i < arr.length; i++) {
    if (!fn(arr[i], i, arr)) return false; // ★ 1 cái false → false!
  }
  return true;
}

// ★ some — ÍT NHẤT 1 thỏa mãn?
function mySome(arr, fn) {
  for (var i = 0; i < arr.length; i++) {
    if (fn(arr[i], i, arr)) return true; // ★ 1 cái true → true!
  }
  return false;
}

// ★ reduce — tích lũy! ★★★
function myReduce(arr, fn, initial) {
  var acc = initial;
  var startIdx = 0;

  // Không có initial → dùng phần tử đầu!
  if (acc === undefined) {
    acc = arr[0];
    startIdx = 1;
  }

  for (var i = startIdx; i < arr.length; i++) {
    acc = fn(acc, arr[i], i, arr); // ★ acc = kết quả tích lũy!
  }
  return acc;
}

// VÍ DỤ reduce:
// myReduce([1,2,3], function(sum, x) { return sum + x; }, 0) → 6
// myReduce([1,2,3], function(max, x) { return x > max ? x : max; }) → 3
```

---

## §3. Array — Transform/Sort/Search!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: join, concat, slice, includes, indexOf!
// ═══════════════════════════════════════════════════════════

// ★ join — mảng → string! ★
function myJoin(arr, sep) {
  if (sep === undefined) sep = ",";
  var result = "";
  for (var i = 0; i < arr.length; i++) {
    if (i > 0) result += sep;
    result += arr[i] === null || arr[i] === undefined ? "" : String(arr[i]);
  }
  return result;
}

// ★ concat — nối mảng, return mảng MỚI!
function myConcat(arr1, arr2) {
  var result = [];
  for (var i = 0; i < arr1.length; i++) result.push(arr1[i]);
  for (var j = 0; j < arr2.length; j++) result.push(arr2[j]);
  return result; // ★ Mảng mới!
}

// ★ slice — cắt mảng [start, end)! KHÔNG đổi gốc!
function mySlice(arr, start, end) {
  if (start === undefined) start = 0;
  if (end === undefined) end = arr.length;
  if (start < 0) start = Math.max(arr.length + start, 0);
  if (end < 0) end = Math.max(arr.length + end, 0);

  var result = [];
  for (var i = start; i < end && i < arr.length; i++) {
    result.push(arr[i]);
  }
  return result;
}

// ★ includes — có chứa? ★
function myIncludes(arr, val) {
  for (var i = 0; i < arr.length; i++) {
    // ★ SameValueZero: NaN === NaN! (khác ===!)
    if (arr[i] === val || (arr[i] !== arr[i] && val !== val)) {
      return true;
    }
  }
  return false;
}

// ★ indexOf — vị trí đầu tiên!
function myIndexOf(arr, val) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === val) return i; // ★ Strict equality!
    // ⚠️ indexOf KHÔNG tìm được NaN! (NaN === NaN = false!)
  }
  return -1;
}

// ★ reverse — đảo ngược (THAY ĐỔI gốc!)
function myReverse(arr) {
  var left = 0;
  var right = arr.length - 1;
  while (left < right) {
    var temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;
    left++;
    right--;
  }
  return arr;
}

// ★ sort — sắp xếp (THAY ĐỔI gốc!)
// Mặc định sort theo STRING! → [10,2,1].sort() → [1,10,2]! ❌
// → Cần comparator: sort(function(a,b) { return a - b; }) ★
function mySort(arr, compare) {
  // Insertion sort đơn giản!
  for (var i = 1; i < arr.length; i++) {
    var key = arr[i];
    var j = i - 1;
    while (
      j >= 0 &&
      (compare ? compare(arr[j], key) > 0 : String(arr[j]) > String(key))
    ) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}
```

---

## §4. String Methods (Không Đổi Gốc!)

```
  ★ STRING = IMMUTABLE! Mọi method trả string MỚI! ★
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: charAt, indexOf, slice, includes!
// ═══════════════════════════════════════════════════════════

// ★ charAt — ký tự tại vị trí!
function myCharAt(str, index) {
  if (index < 0 || index >= str.length) return ""; // ★ Ngoài phạm vi → ''!
  return str[index];
}

// ★ indexOf — vị trí đầu tiên của substring!
function myStrIndexOf(str, search) {
  if (search === "") return 0;
  for (var i = 0; i <= str.length - search.length; i++) {
    var found = true;
    for (var j = 0; j < search.length; j++) {
      if (str[i + j] !== search[j]) {
        found = false;
        break;
      }
    }
    if (found) return i; // ★ Tìm thấy!
  }
  return -1; // ★ Không tìm thấy!
}

// ★ includes — có chứa substring?
function myStrIncludes(str, search) {
  return myStrIndexOf(str, search) !== -1;
}

// ★ slice — cắt substring [start, end)!
function myStrSlice(str, start, end) {
  if (start === undefined) start = 0;
  if (end === undefined) end = str.length;
  if (start < 0) start = Math.max(str.length + start, 0);
  if (end < 0) end = Math.max(str.length + end, 0);

  var result = "";
  for (var i = start; i < end && i < str.length; i++) {
    result += str[i];
  }
  return result;
}

// ★ trim — xóa khoảng trắng đầu/cuối!
function myTrim(str) {
  var start = 0;
  var end = str.length - 1;

  while (start <= end && str[start] === " ") start++;
  while (end >= start && str[end] === " ") end--;

  var result = "";
  for (var i = start; i <= end; i++) result += str[i];
  return result;
}

// ★ split — string → mảng! ★
function mySplit(str, sep) {
  if (sep === undefined) return [str];
  if (sep === "") {
    var chars = [];
    for (var i = 0; i < str.length; i++) chars.push(str[i]);
    return chars; // ★ Tách từng ký tự!
  }

  var result = [];
  var current = "";
  var i = 0;

  while (i < str.length) {
    // Check nếu tại i bắt đầu sep!
    var match = true;
    for (var j = 0; j < sep.length; j++) {
      if (str[i + j] !== sep[j]) {
        match = false;
        break;
      }
    }

    if (match) {
      result.push(current);
      current = "";
      i += sep.length; // ★ Nhảy qua separator!
    } else {
      current += str[i];
      i++;
    }
  }
  result.push(current); // ★ Phần cuối!
  return result;
}

// ★ replace — thay thế LẦN ĐẦU! ★
function myReplace(str, search, replacement) {
  var idx = myStrIndexOf(str, search);
  if (idx === -1) return str;

  var before = myStrSlice(str, 0, idx);
  var after = myStrSlice(str, idx + search.length);
  return before + replacement + after; // ★ Chỉ lần đầu!
}

// ★ replaceAll — thay thế TẤT CẢ!
function myReplaceAll(str, search, replacement) {
  var result = "";
  var i = 0;

  while (i < str.length) {
    var match = true;
    for (var j = 0; j < search.length; j++) {
      if (str[i + j] !== search[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      result += replacement;
      i += search.length;
    } else {
      result += str[i];
      i++;
    }
  }
  return result;
}

// ★ toLowerCase / toUpperCase!
function myToLowerCase(str) {
  var result = "";
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    // A-Z: 65-90 → a-z: 97-122 (cộng 32!)
    if (code >= 65 && code <= 90) {
      result += String.fromCharCode(code + 32);
    } else {
      result += str[i];
    }
  }
  return result;
}

// ★ repeat — lặp n lần!
function myRepeat(str, count) {
  if (count <= 0) return "";
  var result = "";
  for (var i = 0; i < count; i++) result += str;
  return result;
}

// ★ padStart — đệm đầu!
function myPadStart(str, targetLen, padStr) {
  padStr = padStr || " ";
  if (str.length >= targetLen) return str;

  var padLen = targetLen - str.length;
  var pad = "";
  while (pad.length < padLen) pad += padStr;
  return myStrSlice(pad, 0, padLen) + str; // ★ Cắt pad thừa!
}
```

---

## §5. Chuyển Đổi Qua Lại!

```
  ARRAY ↔ STRING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Array → String:                                               │
  │  [1, 2, 3].join('-')  →  "1-2-3" ★                          │
  │  [1, 2, 3].join('')   →  "123" ★                             │
  │  [1, 2, 3].join()     →  "1,2,3" (mặc định ',')            │
  │                                                              │
  │  String → Array:                                               │
  │  "a-b-c".split('-')   →  ["a", "b", "c"] ★                  │
  │  "abc".split('')       →  ["a", "b", "c"] ★                  │
  │  "abc".split()         →  ["abc"] (1 phần tử!)              │
  │                                                              │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Thay đổi gốc?   │ Methods                         │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ CÓ thay đổi! ❌ │ push,pop,shift,unshift,splice,  │    │
  │  │                  │ sort,reverse,fill ★               │    │
  │  │ KHÔNG đổi! ✅   │ map,filter,find,slice,concat,    │    │
  │  │                  │ join,every,some,reduce ★          │    │
  │  │ STRING: LUÔN     │                                   │    │
  │  │ KHÔNG đổi! ✅ ★ │ Immutable! Trả string mới! ★    │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Methods nào THAY ĐỔI mảng gốc?                          │
  │  → push, pop, shift, unshift, splice! ★ (CRUD!)             │
  │  → sort, reverse, fill! ★                                    │
  │  → map, filter, slice, concat → KHÔNG đổi!                  │
  │                                                              │
  │  ❓ 2: sort() mặc định sắp xếp thế nào?                        │
  │  → Theo STRING! ★ [10,2,1].sort() → [1,10,2]! ❌           │
  │  → Cần comparator: sort((a,b) => a-b) cho số! ★             │
  │                                                              │
  │  ❓ 3: forEach vs map?                                           │
  │  → forEach: duyệt, return undefined! ★                       │
  │  → map: duyệt + return MẢNG MỚI! ★                          │
  │  → forEach: side-effect! map: transform! ★                   │
  │                                                              │
  │  ❓ 4: find vs filter?                                           │
  │  → find: trả PHẦN TỬ ĐẦU TIÊN thỏa mãn! (1 item!) ★      │
  │  → filter: trả MẢNG tất cả phần tử thỏa mãn! ★            │
  │                                                              │
  │  ❓ 5: includes vs indexOf?                                      │
  │  → includes: return boolean! Xử lý NaN! ✅ ★                │
  │  → indexOf: return index! NaN fail! ❌ ★                     │
  │  → includes dùng SameValueZero (NaN === NaN)! ★              │
  │                                                              │
  │  ❓ 6: slice vs splice?                                          │
  │  → slice: KHÔNG đổi gốc! Cắt [start, end)! ★               │
  │  → splice: THAY ĐỔI gốc! Xóa/thêm tại vị trí! ★          │
  │  → slice(1,3) → lấy index 1,2! splice(1,2) → xóa từ 1!   │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
