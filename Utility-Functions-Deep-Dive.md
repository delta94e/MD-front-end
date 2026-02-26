# Utility Functions: Deep Clone, Unique, Flatten — Deep Dive!

> **Tự viết tay hàm tiện ích cốt lõi!**
> Deep Clone (circular ref!), Unique (NaN!), Flatten (depth!)!

---

## §1. Tại Sao Phải Tự Viết?

```
  TẠI SAO KHÔNG DÙNG LODASH?
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① PHỎNG VẤN: "Viết deepClone xử lý circular reference!"  │
  │  → Không thể nói "em dùng lodash!" ❌                       │
  │                                                              │
  │  ② HIỂU SOURCE CODE:                                            │
  │  → Viết tay → hiểu lodash ĐANG LÀM GÌ bên trong! ★        │
  │                                                              │
  │  ③ BIẾT EDGE CASES:                                              │
  │  → NaN !== NaN! (tại sao?) ★                                 │
  │  → Circular reference → stack overflow! ★                     │
  │  → Date, RegExp, Map, Set → cần xử lý riêng!              │
  │  → Symbol as key → Object.keys BỎ QUA! ★                    │
  │                                                              │
  │  CHỌN GÌ?                                                       │
  │  ┌──────────────────┬──────────────────┬──────────────────┐  │
  │  │ Hàm             │ Production       │ Phỏng vấn       │  │
  │  ├──────────────────┼──────────────────┼──────────────────┤  │
  │  │ Deep Clone       │ structuredClone  │ Tự viết! ★       │  │
  │  │                  │ hoặc lodash      │ Circular + types!│  │
  │  │ Unique           │ [...new Set()]   │ Giải thích NaN! │  │
  │  │ Flatten          │ arr.flat(Inf)    │ Recursive/reduce!│  │
  │  └──────────────────┴──────────────────┴──────────────────┘  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Deep Clone — Sao Chép Sâu!

```
  SHALLOW vs DEEP COPY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  SHALLOW COPY:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  original = { a: 1, b: { c: 2 } }                    │    │
  │  │  copy = { ...original }                                │    │
  │  │                                                      │    │
  │  │  original.b ──→ { c: 2 } ←── copy.b                  │    │
  │  │                 ↑ CÙNG REF! ★                         │    │
  │  │                                                      │    │
  │  │  copy.b.c = 999;                                      │    │
  │  │  → original.b.c === 999! ❌ Bị ảnh hưởng!           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  DEEP COPY:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  original = { a: 1, b: { c: 2 } }                    │    │
  │  │  clone = deepClone(original)                           │    │
  │  │                                                      │    │
  │  │  original.b ──→ { c: 2 }                              │    │
  │  │  clone.b    ──→ { c: 2 }  ← BẢN SAO RIÊNG! ★        │    │
  │  │                                                      │    │
  │  │  clone.b.c = 999;                                      │    │
  │  │  → original.b.c === 2! ✅ Không ảnh hưởng! ★        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHI NÀO DÙNG GÌ?                                              │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Trường hợp      │ Dùng                            │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ Chỉ sửa lớp ngoài│ Shallow! ({...obj})             │    │
  │  │ Sửa nested object│ Deep! (deepClone!) ★             │    │
  │  │ Có Date/RegExp   │ Deep + xử lý riêng! ★           │    │
  │  │ Có circular ref  │ Deep + WeakMap! ★★★               │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  │  CÁC BẪY (PITFALLS!):                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ❌ Circular ref: obj.self = obj → stack overflow!   │    │
  │  │ ❌ Date: copy → mất method! (chỉ còn string!)      │    │
  │  │ ❌ RegExp: copy → mất flags!                         │    │
  │  │ ❌ Map/Set: for...in KHÔNG iterate được!            │    │
  │  │ ❌ Symbol key: Object.keys BỎ QUA! ★                │    │
  │  │ ❌ JSON method: KHÔNG copy function, Date, RegExp!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Deep Clone HOÀN CHỈNH!
// ★ Xử lý: circular ref, Date, RegExp, Map, Set, Symbol key!
// ═══════════════════════════════════════════════════════════

function deepClone(obj, cache) {
  // ★ WeakMap cache → xử lý circular reference!
  if (!cache) cache = new WeakMap();

  // ① Primitive + null + function → trả ngay!
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // ② Circular reference check! ★★★
  if (cache.has(obj)) {
    return cache.get(obj); // ★ Đã clone rồi → trả reference!
  }

  // ③ Special types! ★
  if (obj instanceof Date) {
    return new Date(obj.getTime()); // ★ Clone Date!
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags); // ★ Clone RegExp!
  }

  if (obj instanceof Map) {
    var mapCopy = new Map();
    cache.set(obj, mapCopy); // ★ Cache TRƯỚC khi recurse!
    obj.forEach(function (val, key) {
      mapCopy.set(deepClone(key, cache), deepClone(val, cache));
    });
    return mapCopy;
  }

  if (obj instanceof Set) {
    var setCopy = new Set();
    cache.set(obj, setCopy);
    obj.forEach(function (val) {
      setCopy.add(deepClone(val, cache));
    });
    return setCopy;
  }

  // ④ Object / Array!
  var clone = Array.isArray(obj) ? [] : {};
  cache.set(obj, clone); // ★ Cache TRƯỚC khi recurse! (circular!)

  // ★ Lấy CẢ string keys VÀ Symbol keys! ★
  var keys = Object.keys(obj);
  var symbolKeys = Object.getOwnPropertySymbols(obj);

  // Clone string keys!
  for (var i = 0; i < keys.length; i++) {
    clone[keys[i]] = deepClone(obj[keys[i]], cache);
  }

  // Clone Symbol keys! ★
  for (var j = 0; j < symbolKeys.length; j++) {
    clone[symbolKeys[j]] = deepClone(obj[symbolKeys[j]], cache);
  }

  return clone;
}

// ═══════════════════════════════════════════════════════════
// TEST:
// ═══════════════════════════════════════════════════════════
// var sym = Symbol('test');
// var original = {
//   a: 1,
//   b: { c: 2 },
//   d: [3, 4],
//   e: new Date(),
//   f: /abc/gi,
//   g: new Map([['x', 1]]),
//   h: new Set([1, 2, 3]),
//   [sym]: 'symbol value!',
// };
// original.self = original; // ★ Circular reference!
//
// var cloned = deepClone(original);
// cloned.b.c = 999;
// console.log(original.b.c); // 2! ✅ Không ảnh hưởng!
// console.log(cloned.self === cloned); // true! ✅ Circular OK!
// console.log(cloned.e instanceof Date); // true! ✅
// console.log(cloned.f instanceof RegExp); // true! ✅
// console.log(cloned[sym]); // 'symbol value!' ✅
```

```
  GIẢI THÍCH WeakMap:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TẠI SAO WeakMap MÀ KHÔNG PHẢI Map?                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ WeakMap:                                               │    │
  │  │ → Key PHẢI là object!                                 │    │
  │  │ → Key bị GC khi KHÔNG ai reference! ★                │    │
  │  │ → KHÔNG bị memory leak! ★                             │    │
  │  │                                                      │    │
  │  │ Map:                                                    │    │
  │  │ → Key là bất kỳ (string, number, object!)            │    │
  │  │ → GIỮA reference → object KHÔNG bị GC! ❌            │    │
  │  │ → Có thể memory leak!                                │    │
  │  │                                                      │    │
  │  │ Trong deepClone:                                        │    │
  │  │ → Cache object đã clone → dùng WeakMap! ★             │    │
  │  │ → Sau khi clone xong → WeakMap tự GC! ★              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CIRCULAR REFERENCE FLOW:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  deepClone(obj) ← obj.self = obj!                     │    │
  │  │  │                                                    │    │
  │  │  ├─ cache.set(obj, clone) ← cache obj trước! ★       │    │
  │  │  ├─ clone.a = deepClone(obj.a) → 1 (primitive!)      │    │
  │  │  ├─ clone.self = deepClone(obj.self)                  │    │
  │  │  │   │ obj.self === obj → cache.has(obj) = TRUE! ★   │    │
  │  │  │   └─ return cache.get(obj) = clone! ★             │    │
  │  │  │      → clone.self = clone! ✅ (circular OK!)      │    │
  │  │  └─ return clone!                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Unique — Loại Bỏ Trùng Lặp!

```
  UNIQUE — CÁC CÁCH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬──────────────────┬──────────────────┐  │
  │  │ Cách            │ Ưu điểm        │ Nhược điểm      │  │
  │  ├──────────────────┼──────────────────┼──────────────────┤  │
  │  │ Set (ES6!) ★     │ Đơn giản nhất! │ Chỉ primitive!   │  │
  │  │                  │ Xử lý NaN! ✅ │                  │  │
  │  │ filter+indexOf   │ ES5 compatible  │ NaN fail! ❌    │  │
  │  │                  │                  │ O(n²)! ❌       │  │
  │  │ Map (by key!) ★  │ Object unique!  │ Cần chỉ định key│  │
  │  │                  │ O(n)! ★         │                  │  │
  │  └──────────────────┴──────────────────┴──────────────────┘  │
  │                                                              │
  │  VẤN ĐỀ NaN:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ NaN !== NaN → TRUE! ★ (IEEE 754 spec!)               │    │
  │  │ → indexOf(NaN) = -1 LUÔN! ❌ (tìm không thấy!)      │    │
  │  │ → filter+indexOf: KHÔNG loại được NaN trùng! ❌      │    │
  │  │ → Set: tự xử lý NaN! ✅ (coi NaN === NaN!) ★        │    │
  │  │ → Number.isNaN(): check NaN chính xác! ★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// CÁCH 1: Set — đơn giản nhất! ★
// ═══════════════════════════════════════════════════════════

function uniqueBySet(arr) {
  // ★ Set tự loại trùng! (bao gồm NaN!)
  var set = new Set();
  for (var i = 0; i < arr.length; i++) {
    set.add(arr[i]);
  }
  // Set → Array!
  var result = [];
  set.forEach(function (val) {
    result.push(val);
  });
  return result;
}
// Viết gọn: return [...new Set(arr)];

// ═══════════════════════════════════════════════════════════
// CÁCH 2: filter + indexOf (ES5, NHƯNG NaN fail!)
// ═══════════════════════════════════════════════════════════

function uniqueByFilter(arr) {
  return arr.filter(function (item, index) {
    // ★ indexOf trả vị trí ĐẦU TIÊN!
    // → Nếu index === indexOf → lần xuất hiện đầu → GIỮ!
    // → Nếu index !== indexOf → trùng → BỎ!
    return arr.indexOf(item) === index;
    // ⚠️ NaN: indexOf(NaN) = -1 LUÔN! → Lọc mất NaN! ❌
  });
}

// ═══════════════════════════════════════════════════════════
// CÁCH 3: Tự viết — xử lý NaN chính xác! ★
// ═══════════════════════════════════════════════════════════

function uniqueWithNaN(arr) {
  var result = [];
  var hasNaN = false;

  for (var i = 0; i < arr.length; i++) {
    var item = arr[i];

    // ★ Check NaN riêng! (vì NaN !== NaN!)
    if (item !== item) {
      // ★ Chỉ NaN mới !== chính nó!
      if (!hasNaN) {
        result.push(item);
        hasNaN = true; // ★ Đã thêm 1 NaN rồi!
      }
    } else {
      // ★ indexOf hoạt động bình thường với non-NaN!
      var found = false;
      for (var j = 0; j < result.length; j++) {
        if (result[j] === item) {
          found = true;
          break;
        }
      }
      if (!found) result.push(item);
    }
  }

  return result;
}

// TEST:
// uniqueWithNaN([1, 2, 2, NaN, NaN, 'a', 'a'])
// → [1, 2, NaN, 'a'] ✅

// ═══════════════════════════════════════════════════════════
// CÁCH 4: Unique object array BY KEY! ★
// ═══════════════════════════════════════════════════════════

function uniqueByKey(arr, key) {
  var seen = {}; // ★ Track đã thấy key nào!
  var result = [];

  for (var i = 0; i < arr.length; i++) {
    var k = arr[i][key];
    if (!seen[k]) {
      seen[k] = true;
      result.push(arr[i]); // ★ Lần đầu thấy → GIỮ!
    }
    // Đã thấy → BỎ!
  }

  return result;
}

// TEST:
// var users = [
//   { id: 1, name: 'A' },
//   { id: 2, name: 'B' },
//   { id: 1, name: 'A_dup' },
// ];
// uniqueByKey(users, 'id');
// → [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] ✅
```

---

## §4. Flatten — Làm Phẳng Mảng!

```
  FLATTEN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  INPUT:  [1, [2, [3, [4, 5]]]]                                │
  │                                                              │
  │  flat(1): [1, 2, [3, [4, 5]]]     ← 1 lớp!                 │
  │  flat(2): [1, 2, 3, [4, 5]]       ← 2 lớp!                 │
  │  flat(∞): [1, 2, 3, 4, 5]         ← Hoàn toàn phẳng! ★    │
  │                                                              │
  │  FLOW (recursive!):                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │  flatten([1, [2, [3, 4]]])                             │    │
  │  │  │                                                    │    │
  │  │  ├─ 1 → not array → push! ✅                          │    │
  │  │  ├─ [2, [3, 4]] → IS array → recurse! ★              │    │
  │  │  │   ├─ 2 → not array → push! ✅                      │    │
  │  │  │   ├─ [3, 4] → IS array → recurse! ★               │    │
  │  │  │   │   ├─ 3 → push! ✅                              │    │
  │  │  │   │   └─ 4 → push! ✅                              │    │
  │  │  │   │   → return [3, 4]                               │    │
  │  │  │   → return [2, 3, 4]                                │    │
  │  │  → return [1, 2, 3, 4] ★                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// CÁCH 1: Recursive — đệ quy đơn giản! ★
// ═══════════════════════════════════════════════════════════

function flatten(arr) {
  var result = [];

  for (var i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      // ★ Là array → đệ quy → nối kết quả!
      var sub = flatten(arr[i]);
      for (var j = 0; j < sub.length; j++) {
        result.push(sub[j]);
      }
    } else {
      // ★ Không phải array → push trực tiếp!
      result.push(arr[i]);
    }
  }

  return result;
}

// TEST:
// flatten([1, [2, [3, [4, 5]]]])
// → [1, 2, 3, 4, 5] ✅

// ═══════════════════════════════════════════════════════════
// CÁCH 2: Flatten với DEPTH! (như Array.prototype.flat!)
// ═══════════════════════════════════════════════════════════

function flattenDepth(arr, depth) {
  if (depth === undefined) depth = 1;

  // ★ depth <= 0 → không flatten nữa!
  if (depth <= 0) return arr.slice(); // Copy!

  var result = [];

  for (var i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i]) && depth > 0) {
      // ★ Recurse với depth - 1! ★
      var sub = flattenDepth(arr[i], depth - 1);
      for (var j = 0; j < sub.length; j++) {
        result.push(sub[j]);
      }
    } else {
      result.push(arr[i]);
    }
  }

  return result;
}

// TEST:
// flattenDepth([1, [2, [3, [4]]]], 1) → [1, 2, [3, [4]]]   ✅
// flattenDepth([1, [2, [3, [4]]]], 2) → [1, 2, 3, [4]]     ✅
// flattenDepth([1, [2, [3, [4]]]], Infinity) → [1, 2, 3, 4] ✅

// ═══════════════════════════════════════════════════════════
// CÁCH 3: Reduce — cách viết khác! (hay gặp phỏng vấn!)
// ═══════════════════════════════════════════════════════════

function flattenByReduce(arr) {
  var result = [];

  for (var i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      var sub = flattenByReduce(arr[i]);
      result = result.concat(sub);
    } else {
      result.push(arr[i]);
    }
  }

  return result;
}

// Viết ES6: arr.reduce((acc, cur) =>
//   acc.concat(Array.isArray(cur) ? flattenByReduce(cur) : cur), []);

// ═══════════════════════════════════════════════════════════
// CÁCH 4: Iterative (không đệ quy!) — dùng stack!
// ═══════════════════════════════════════════════════════════

function flattenIterative(arr) {
  var stack = arr.slice(); // ★ Copy mảng gốc làm stack!
  var result = [];

  while (stack.length > 0) {
    var item = stack.pop(); // ★ Lấy từ cuối!

    if (Array.isArray(item)) {
      // ★ Là array → đẩy từng phần tử vào stack!
      for (var i = 0; i < item.length; i++) {
        stack.push(item[i]);
      }
    } else {
      result.push(item);
    }
  }

  result.reverse(); // ★ pop() lấy ngược → reverse lại!
  return result;
}

// TEST:
// flattenIterative([1, [2, [3, 4]], 5])
// → [1, 2, 3, 4, 5] ✅
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Shallow copy vs Deep copy khác gì?                       │
  │  → Shallow: copy lớp ngoài, nested CHUNG reference! ★       │
  │  → Deep: copy TẤT CẢ levels, hoàn toàn RIÊNG BIỆT! ★     │
  │  → Sửa nested trong deep copy KHÔNG ảnh hưởng original!    │
  │                                                              │
  │  ❓ 2: Deep clone xử lý circular reference thế nào?             │
  │  → Dùng WeakMap cache object ĐÃ CLONE! ★                   │
  │  → Cache TRƯỚC khi recurse (important!)                       │
  │  → Gặp lại → trả cache, KHÔNG recurse nữa! ★              │
  │  → WeakMap → tự GC khi không dùng nữa!                     │
  │                                                              │
  │  ❓ 3: Tại sao NaN !== NaN?                                      │
  │  → IEEE 754 spec quy định! ★                                 │
  │  → NaN đại diện "Not a Number" = giá trị KHÔNG XÁC ĐỊNH!  │
  │  → 2 giá trị KXĐ không thể so sánh bằng nhau!             │
  │  → Check NaN: Number.isNaN() hoặc x !== x! ★               │
  │                                                              │
  │  ❓ 4: indexOf vs Set với NaN?                                   │
  │  → indexOf dùng === → NaN === NaN = false → TÌM KHÔNG RA! │
  │  → Set coi NaN === NaN (SameValueZero algorithm!) → XỬ LÝ! │
  │                                                              │
  │  ❓ 5: Flatten có mấy cách viết?                                │
  │  → Recursive (đệ quy!) → đơn giản, hay gặp nhất! ★        │
  │  → Reduce (concat!) → cách viết functional!                  │
  │  → Iterative (stack!) → không đệ quy, tránh stack overflow! │
  │  → Depth control! → flattenDepth(arr, n) giống flat(n)!    │
  │                                                              │
  │  ❓ 6: JSON.parse(JSON.stringify()) clone được không?            │
  │  → ĐƯỢC cho simple objects! Nhưng ❌:                        │
  │  → function → MẤT! ❌                                       │
  │  → Date → thành string! ❌                                  │
  │  → RegExp → thành {}! ❌                                    │
  │  → undefined → MẤT! ❌                                      │
  │  → Circular ref → THROW ERROR! ❌                            │
  │  → Symbol key → MẤT! ❌                                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
