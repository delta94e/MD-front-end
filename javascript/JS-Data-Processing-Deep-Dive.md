# JavaScript Data Processing — Deep Dive

> 📅 2026-02-11 · ⏱ 25 phút đọc
>
> 18 bài handwritten: Date format, array shuffle/flatten/dedup,
> reduce sum, string repeat/reverse, number format, big number add,
> add(1)(2)(3) currying, array-like, URL parse, JSON→Tree.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: JavaScript Data Processing

---

## Mục Lục

0. [Date & Number Formatting](#0-date--number-formatting)
1. [Array Operations (shuffle, sum, flatten, dedup)](#1-array-operations)
2. [Array Method Implementations (flat, push, filter, map)](#2-array-method-implementations)
3. [String Operations (repeat, reverse)](#3-string-operations)
4. [Advanced (big number, currying, array-like, reduce, tree, URL)](#4-advanced)
5. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#5-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Date & Number Formatting

### ① Date Format

```javascript
const dateFormat = (dateInput, format) => {
  var day = dateInput.getDate();
  var month = dateInput.getMonth() + 1; // 0-indexed → +1
  var year = dateInput.getFullYear();

  format = format.replace(/yyyy/, year);
  format = format.replace(/MM/, month.toString().padStart(2, "0"));
  format = format.replace(/dd/, day.toString().padStart(2, "0"));
  return format;
};

// dateFormat(new Date('2020-12-01'), 'yyyy/MM/dd')    → '2020/12/01'
// dateFormat(new Date('2020-04-01'), 'yyyy年MM月dd日')  → '2020年04月01日'
```

### ② Số phân cách hàng nghìn (Thousand Separator)

```javascript
// ── Có hỗ trợ THẬP PHÂN ──
let format = (n) => {
  let num = n.toString();
  let decimals = "";

  // Tách phần thập phân
  num.indexOf(".") > -1 ? (decimals = num.split(".")[1]) : decimals;
  let len = num.length;

  if (len <= 3) return num;

  let temp = "";
  let remainder = len % 3;
  decimals ? (temp = "." + decimals) : temp;

  if (remainder > 0) {
    // Không chia hết cho 3: lấy phần dư + nhóm 3
    return (
      num.slice(0, remainder) +
      "," +
      num.slice(remainder, len).match(/\d{3}/g).join(",") +
      temp
    );
  } else {
    // Chia hết cho 3: nhóm 3 luôn
    return num.slice(0, len).match(/\d{3}/g).join(",") + temp;
  }
};

// format(12323.33)   → '12,323.33'
// format(1232323)    → '1,232,323'
```

```
KEY POINTS:
  ① Tách decimal trước (split('.'))
  ② len % 3 → xác định nhóm đầu
  ③ match(/\d{3}/g) → nhóm 3 chữ số
  ④ join(',') → nối bằng dấu phẩy
```

---

## 1. Array Operations

### ③ Swap không dùng biến tạm

```javascript
// Cách 1: Toán học
a = a + b;
b = a - b; // b = (a+b) - b = a
a = a - b; // a = (a+b) - a = b

// Cách 2: ES6 Destructuring
[a, b] = [b, a];

// Cách 3: XOR (bitwise)
a = a ^ b;
b = a ^ b; // b = (a^b) ^ b = a
a = a ^ b; // a = (a^b) ^ a = b
```

### ④ Array Shuffle (Fisher-Yates)

```javascript
// ── Forward version ──
var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
for (var i = 0; i < arr.length; i++) {
  // Random index từ i → cuối
  const randomIndex = Math.round(Math.random() * (arr.length - 1 - i)) + i;
  [arr[i], arr[randomIndex]] = [arr[randomIndex], arr[i]];
}

// ── Backward version (Fisher-Yates classic) ──
var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
let length = arr.length,
  randomIndex,
  temp;
while (length) {
  randomIndex = Math.floor(Math.random() * length--);
  temp = arr[length];
  arr[length] = arr[randomIndex];
  arr[randomIndex] = temp;
}
```

```
FISHER-YATES — FLOW:
  [1, 2, 3, 4, 5]  length=5
  ▶ i=4: random(0-4)=2 → swap(arr[4], arr[2]) → [1, 2, 5, 4, 3]
  ▶ i=3: random(0-3)=0 → swap(arr[3], arr[0]) → [4, 2, 5, 1, 3]
  ▶ i=2: random(0-2)=1 → swap(arr[2], arr[1]) → [4, 5, 2, 1, 3]
  ▶ i=1: random(0-1)=0 → swap(arr[1], arr[0]) → [5, 4, 2, 1, 3]
  → Mỗi phần tử có XÁC SUẤT BẰNG NHAU ở mọi vị trí
```

### ⑤ Array Sum (nhiều cách)

```javascript
// ── reduce (phẳng) ──
let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
let sum = arr.reduce((total, i) => (total += i), 0); // 55

// ── reduce (nested array) ──
let arr2 = [1, 2, 3, [[4, 5], 6], 7, 8, 9];
let sum2 = arr2
  .toString()
  .split(",")
  .reduce((total, i) => (total += Number(i)), 0); // 45

// ── Recursive ──
function add(arr) {
  if (arr.length == 1) return arr[0];
  return arr[0] + add(arr.slice(1));
}
add([1, 2, 3, 4, 5, 6]); // 21
```

### ⑥ Array Flatten — 6 CÁCH

```javascript
// ── (1) Recursive ──
function flatten(arr) {
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      result = result.concat(flatten(arr[i]));
    } else {
      result.push(arr[i]);
    }
  }
  return result;
}

// ── (2) reduce ──
function flatten(arr) {
  return arr.reduce((prev, next) => {
    return prev.concat(Array.isArray(next) ? flatten(next) : next);
  }, []);
}

// ── (3) Spread + some (iterative) ──
function flatten(arr) {
  while (arr.some((item) => Array.isArray(item))) {
    arr = [].concat(...arr); // Mỗi lần flatten 1 level
  }
  return arr;
}

// ── (4) toString + split ──
function flatten(arr) {
  return arr.toString().split(",");
  // ⚠️ Tất cả thành STRING, mất type!
}

// ── (5) ES6 flat(Infinity) ──
function flatten(arr) {
  return arr.flat(Infinity);
  // ✅ Đơn giản nhất, giữ type
}

// ── (6) JSON + Regex ──
function flatten(arr) {
  let str = JSON.stringify(arr);
  str = str.replace(/(\[|\])/g, ""); // Bỏ [ ]
  str = "[" + str + "]";
  return JSON.parse(str);
}

// Test: flatten([1, [2, [3, 4, 5]]]) → [1, 2, 3, 4, 5]
```

```
SO SÁNH 6 CÁCH FLATTEN:
═════════════════════════════════════════════════
  ┌──────────────┬────────┬───────────┬────────┐
  │ Method       │ Type ✅│ Đơn giản  │ ES ver │
  ├──────────────┼────────┼───────────┼────────┤
  │ Recursive    │ ✅     │ ★★★      │ ES5    │
  │ reduce       │ ✅     │ ★★★★    │ ES5    │
  │ spread+some  │ ✅     │ ★★★★    │ ES6    │
  │ toString     │ ❌ str │ ★★★★★  │ ES5    │
  │ flat()       │ ✅     │ ★★★★★  │ ES2019 │
  │ JSON+regex   │ ✅     │ ★★★      │ ES5    │
  └──────────────┴────────┴───────────┴────────┘
```

### ⑦ Array Dedup — 2 cách

```javascript
// ── ES6: Set ──
const array = [1, 2, 3, 5, 1, 5, 9, 1, 2, 8];
Array.from(new Set(array)); // [1, 2, 3, 5, 9, 8]
// Hoặc: [...new Set(array)]

// ── ES5: Map object ──
function uniqueArray(array) {
  let map = {};
  let res = [];
  for (var i = 0; i < array.length; i++) {
    if (!map.hasOwnProperty([array[i]])) {
      map[array[i]] = 1;
      res.push(array[i]);
    }
  }
  return res;
}
uniqueArray(array); // [1, 2, 3, 5, 9, 8]
```

---

## 2. Array Method Implementations

### ⑧ Implement flat (có depth)

```javascript
function _flat(arr, depth) {
  if (!Array.isArray(arr) || depth <= 0) {
    return arr;
  }
  return arr.reduce((prev, cur) => {
    if (Array.isArray(cur)) {
      return prev.concat(_flat(cur, depth - 1));
    } else {
      return prev.concat(cur);
    }
  }, []);
}

// _flat([1,[2,[3]]], 1) → [1, 2, [3]]
// _flat([1,[2,[3]]], 2) → [1, 2, 3]
```

### ⑨ Implement push

```javascript
Array.prototype.push = function () {
  for (let i = 0; i < arguments.length; i++) {
    this[this.length] = arguments[i];
    // this.length tự tăng khi gán index mới
  }
  return this.length;
};
```

### ⑩ Implement filter

```javascript
Array.prototype._filter = function (fn) {
  if (typeof fn !== "function") {
    throw Error("参数必须是一个函数");
  }
  const res = [];
  for (let i = 0, len = this.length; i < len; i++) {
    fn(this[i]) && res.push(this[i]);
    // fn return truthy → push vào result
  }
  return res;
};

// [1,2,3,4,5]._filter(x => x > 3) → [4, 5]
```

### ⑪ Implement map

```javascript
Array.prototype._map = function (fn) {
  if (typeof fn !== "function") {
    throw Error("参数必须是一个函数");
  }
  const res = [];
  for (let i = 0, len = this.length; i < len; i++) {
    res.push(fn(this[i]));
    // Transform mỗi phần tử qua fn
  }
  return res;
};

// [1,2,3]._map(x => x * 2) → [2, 4, 6]
```

---

## 3. String Operations

### ⑫ String repeat

```javascript
// ── Array join ──
function repeat(s, n) {
  return new Array(n + 1).join(s);
  // new Array(3+1) = [,,,] → join('abc') = 'abcabcabc'
}

// ── Recursive ──
function repeat(s, n) {
  return n > 0 ? s.concat(repeat(s, --n)) : "";
}

// repeat('abc', 3) → 'abcabcabc'
```

### ⑬ String reverse

```javascript
String.prototype._reverse = function (a) {
  return a.split("").reverse().join("");
  // 'hello' → ['h','e','l','l','o'] → ['o','l','l','e','h'] → 'olleh'
};

var obj = new String();
obj._reverse("hello"); // 'olleh'

// Hoặc ES6:
const reverse = (s) => [...s].reverse().join("");
```

---

## 4. Advanced

### ⑭ Big Number Addition

> **Vượt `Number.MAX_SAFE_INTEGER` (9007199254740991) → dùng string.**

```javascript
function sumBigNumber(a, b) {
  let res = "";
  let temp = 0; // carry (nhớ)

  a = a.split("");
  b = b.split("");

  while (a.length || b.length || temp) {
    // ~~undefined = 0 (xử lý khi 1 số hết digits)
    temp += ~~a.pop() + ~~b.pop();
    res = (temp % 10) + res; // Lấy hàng đơn vị
    temp = temp > 9; // Carry: true=1, false=0
  }
  return res.replace(/^0+/, ""); // Bỏ leading zeros
}

// sumBigNumber('9007199254740991', '1234567890123456789')
// → '1243575089378197780'
```

```
FLOW: sumBigNumber('99', '123')
  ┌───────┬──────┬──────┬──────┬─────────────┐
  │ Round │ a.pop│ b.pop│ temp │ res         │
  ├───────┼──────┼──────┼──────┼─────────────┤
  │ 1     │ 9    │ 3    │ 12   │ '2'         │
  │ 2     │ 9    │ 2    │ 12   │ '22'        │
  │ 3     │ ~~'' │ 1    │ 2    │ '222'       │
  └───────┴──────┴──────┴──────┴─────────────┘
  → '222' ✅
```

### ⑮ add(1)(2)(3) — Currying

```javascript
// ── Cách 1: Hardcode (cố định số params) ──
function add(a) {
  return function (b) {
    return function (c) {
      return a + b + c;
    };
  };
}
add(1)(2)(3); // 6

// ── Cách 2: toString override (số params bất kỳ) ──
var add = function (m) {
  var temp = function (n) {
    return add(m + n); // Tích lũy tổng
  };
  temp.toString = function () {
    return m; // Khi convert → trả tổng
  };
  return temp;
};

add(3)(4)(5); // 12
add(3)(6)(9)(25); // 43

// ── Cách 3: Generic currying (gọi () để kết thúc) ──
function add(...args) {
  return args.reduce((a, b) => a + b);
}
function currying(fn) {
  let args = [];
  return function temp(...newArgs) {
    if (newArgs.length) {
      args = [...args, ...newArgs];
      return temp; // Tiếp tục thu thập
    } else {
      let val = fn.apply(this, args);
      args = []; // Reset cho lần gọi sau
      return val;
    }
  };
}
let addCurry = currying(add);
addCurry(1)(2)(3)(4, 5)(); // 15
addCurry(1)(2, 3, 4, 5)(); // 15
```

```
add(3)(4)(5) FLOW:
  ① add(3)    → m=3, return temp
  ② temp(4)   → add(3+4) = add(7), m=7, return temp
  ③ temp(5)   → add(7+5) = add(12), m=12, return temp
  ④ toString  → return m = 12 ✅
```

### ⑯ Array-like → Array (4 cách)

```javascript
// arguments, NodeList, HTMLCollection = array-like objects
// Có .length, có index, KHÔNG có array methods

// ① slice
Array.prototype.slice.call(arrayLike);

// ② splice
Array.prototype.splice.call(arrayLike, 0);

// ③ concat
Array.prototype.concat.apply([], arrayLike);

// ④ Array.from (ES6) ← KHUYÊN DÙNG
Array.from(arrayLike);

// ⑤ Spread (ES6)
[...arrayLike]; // Chỉ works nếu có Symbol.iterator
```

### ⑰ reduce — Sum multiple scenarios

```javascript
// ── Flat array ──
let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
arr.reduce((prev, cur) => prev + cur, 0); // 55

// ── Nested array (flat trước) ──
let arr2 = [1, 2, 3, [[4, 5], 6], 7, 8, 9];
arr2.flat(Infinity).reduce((prev, cur) => prev + cur, 0); // 45

// ── Array of objects (sum property) ──
let arr3 = [{ a: 9, b: 3, c: 4 }, { a: 1, b: 3 }, { a: 3 }];
arr3.reduce((prev, cur) => prev + cur["a"], 0); // 13
```

### ⑱ JSON → Tree Structure

```javascript
// Input: flat array with id, pid (parent id)
let source = [
  { id: 1, pid: 0, name: "body" },
  { id: 2, pid: 1, name: "title" },
  { id: 3, pid: 2, name: "div" },
];

function jsonToTree(data) {
  let result = [];
  if (!Array.isArray(data)) return result;

  // Bước 1: Tạo map { id → item }
  let map = {};
  data.forEach((item) => {
    map[item.id] = item;
  });

  // Bước 2: Gắn children
  data.forEach((item) => {
    let parent = map[item.pid];
    if (parent) {
      // Có parent → push vào children
      (parent.children || (parent.children = [])).push(item);
    } else {
      // Không parent (pid=0) → root node
      result.push(item);
    }
  });

  return result;
}

// Output: [{id:1, pid:0, name:'body', children: [{id:2, ...}]}]
```

```
FLOW: jsonToTree
  ① Map: { 1: {body}, 2: {title}, 3: {div} }
  ② item(id:1, pid:0) → NO parent → push to result (ROOT)
  ③ item(id:2, pid:1) → parent = map[1] = body → body.children = [title]
  ④ item(id:3, pid:2) → parent = map[2] = title → title.children = [div]
  → Tree built in O(n) ✅
```

### ⑲ ES5/ES6 Sum Function Arguments

```javascript
// ── ES5: arguments (array-like) ──
function sum() {
  let sum = 0;
  Array.prototype.forEach.call(arguments, function (item) {
    sum += item * 1;
  });
  return sum;
}

// ── ES6: rest params ──
function sum(...nums) {
  let sum = 0;
  nums.forEach((item) => {
    sum += item * 1;
  });
  return sum;
}

// sum(1, 2, 3, 4) → 10
```

### ⑳ Parse URL Params

```javascript
// url = 'http://www.domain.com/?user=anonymous&id=123&id=456&city=%E5%8C%97%E4%BA%AC&enabled'
// → { user: 'anonymous', id: [123,456], city: '北京', enabled: true }

function parseParam(url) {
  const paramsStr = /.+\?(.+)$/.exec(url)[1]; // Lấy sau "?"
  const paramsArr = paramsStr.split("&"); // Tách bằng "&"
  let paramsObj = {};

  paramsArr.forEach((param) => {
    if (/=/.test(param)) {
      let [key, val] = param.split("=");
      val = decodeURIComponent(val); // Decode URL
      val = /^\d+$/.test(val) ? parseFloat(val) : val; // Chuyển số

      if (paramsObj.hasOwnProperty(key)) {
        paramsObj[key] = [].concat(paramsObj[key], val); // Duplicate key → array
      } else {
        paramsObj[key] = val;
      }
    } else {
      paramsObj[param] = true; // No value → true
    }
  });
  return paramsObj;
}
```

```
FLOW: parseParam('?user=anonymous&id=123&id=456&city=%E5%8C%97%E4%BA%AC&enabled')
  ① Split '&' → ['user=anonymous', 'id=123', 'id=456', 'city=%E5...', 'enabled']
  ② user=anonymous → { user: 'anonymous' }
  ③ id=123         → { id: 123 }
  ④ id=456         → { id: [123, 456] }  (duplicate → array!)
  ⑤ city=%E5..     → { city: '北京' }     (decodeURIComponent)
  ⑥ enabled        → { enabled: true }    (no value → true)
```

---

## 5. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
18 DATA PROCESSING — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  FORMAT:
    dateFormat      → getDate/Month/Year + replace pattern
    千分位           → match(/\d{3}/g) + join(',')

  ARRAY OPS:
    swap            → a=a+b; b=a-b; a=a-b | [a,b]=[b,a]
    shuffle         → Fisher-Yates (swap random từ i→end)
    sum             → reduce((total,i) => total+i, 0)
    flatten (6 cách)→ recursive, reduce, spread, toString, flat(), JSON
    dedup           → Set | map {}

  ARRAY METHODS:
    flat(depth)     → reduce + recursive (depth-1)
    push            → this[this.length] = value
    filter          → fn(item) && res.push(item)
    map             → res.push(fn(item))

  STRING:
    repeat          → new Array(n+1).join(s)
    reverse         → split('').reverse().join('')

  ADVANCED:
    bigNumber add   → split → pop → carry → build string
    add(1)(2)(3)    → toString override | generic currying
    array-like      → slice.call | Array.from | spread
    reduce sum      → flat + reduce | object property sum
    JSON→Tree       → map{id→item} + gắn children O(n)
    parseURL        → split('&') + decode + number convert
```

### Câu Hỏi Phỏng Vấn

**1. Flatten array có mấy cách? Ưu nhược?**

> 6 cách: (1) Recursive — rõ ràng nhưng call stack. (2) reduce — functional style. (3) spread+some — iterative, no recursion. (4) toString — mất type. (5) `flat(Infinity)` — đơn giản nhất, ES2019+. (6) JSON+regex — hack. **Khuyên dùng**: `flat()` hoặc reduce recursive.

**2. Fisher-Yates shuffle tại sao fair?**

> Mỗi phần tử có **xác suất bằng nhau** ở mọi vị trí. Swap từng vị trí với random index trong phần **chưa xử lý** → đảm bảo n! permutations đều có probability 1/n!.

**3. Big number addition hoạt động thế nào?**

> Convert sang **string**, split thành array, **pop từ cuối** (hàng đơn vị). Cộng từng digit + carry. `temp > 9` → carry = true (=1 trong addition). Build result string từ phải sang trái.

**4. add(1)(2)(3) implement thế nào?**

> **Cách 1**: Override `toString`/`valueOf` — mỗi lần gọi return function mới tích lũy tổng, khi convert type → trả giá trị. **Cách 2**: Generic curry — thu thập args, gọi `()` không param → execute + return result.

**5. JSON → Tree complexity bao nhiêu?**

> O(n): duyệt **2 lần** — lần 1 build map {id→item}, lần 2 gắn children. Không cần nested loop tìm parent.

**6. parseParam xử lý gì đặc biệt?**

> 3 edge cases: (1) Duplicate key → **array**. (2) Encoded chars → **decodeURIComponent**. (3) Key không có value → **true**.

---

## Checklist Học Tập

- [ ] Viết được dateFormat (replace pattern)
- [ ] Viết được thousand separator (match + join)
- [ ] Swap không dùng biến tạm (3 cách)
- [ ] Fisher-Yates shuffle (forward + backward)
- [ ] Array sum: reduce, nested, recursive
- [ ] Array flatten: 6 cách + so sánh
- [ ] Array dedup: Set vs map
- [ ] Implement flat(depth) với reduce recursive
- [ ] Implement push, filter, map
- [ ] String repeat và reverse
- [ ] Big number addition (string-based)
- [ ] add(1)(2)(3) currying (toString + generic)
- [ ] Array-like → Array (4+ cách)
- [ ] reduce sum (flat, nested, objects)
- [ ] JSON → Tree (map + children, O(n))
- [ ] Parse URL params (decode + duplicate + no-value)

---

_Cập nhật lần cuối: Tháng 2, 2026_
