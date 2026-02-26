# Deep Copy vs Shallow Copy — Deep Dive!

> **Từ Stack/Heap đến sao chép hoàn chỉnh!**
> Memory model, shallow pitfall, deep clone (circular + special types!)

---

## §1. Nền Tảng — Stack & Heap!

```
  MEMORY MODEL:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────────┐   ┌──────────────────────────┐    │
  │  │ STACK (ngăn xếp!)   │   │ HEAP (đống!)             │    │
  │  │                      │   │                          │    │
  │  │ ★ Primitive types!   │   │ ★ Reference types!       │    │
  │  │ ★ Kích thước CỐ ĐỊNH│   │ ★ Kích thước ĐỘNG! ★    │    │
  │  │ ★ Truy cập NHANH!   │   │ ★ Truy cập bằng pointer!│    │
  │  │                      │   │                          │    │
  │  │ ┌─────────────────┐  │   │  ┌──────────────────┐   │    │
  │  │ │ a = 42          │  │   │  │ { name: 'Hà Nội',│   │    │
  │  │ │ b = 'hello'     │  │   │  │   age: 1000 }    │   │    │
  │  │ │ c = true        │  │   │  │     ↑ addr: 0x01 │   │    │
  │  │ │                 │  │   │  └──────────────────┘   │    │
  │  │ │ obj = 0x01 ─────┼──┼───┼→                         │    │
  │  │ │                 │  │   │  ┌──────────────────┐   │    │
  │  │ │ arr = 0x02 ─────┼──┼───┼→ │ [1, 2, 3]        │   │    │
  │  │ │                 │  │   │  │     ↑ addr: 0x02 │   │    │
  │  │ └─────────────────┘  │   │  └──────────────────┘   │    │
  │  └──────────────────────┘   └──────────────────────────┘    │
  │                                                              │
  │  GÁN GIÁ TRỊ (=):                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Primitive: COPY GIÁ TRỊ! ★                           │    │
  │  │ var a = 42;                                            │    │
  │  │ var b = a;   // b = 42 (BẢN SAO!)                    │    │
  │  │ b = 100;     // a vẫn = 42! ✅ Độc lập!             │    │
  │  │                                                      │    │
  │  │ Reference: COPY ĐỊA CHỈ (pointer!) ★                 │    │
  │  │ var obj1 = { x: 1 };                                   │    │
  │  │ var obj2 = obj1;  // obj2 = 0x01 (CÙNG pointer!) ★   │    │
  │  │ obj2.x = 999;     // obj1.x = 999! ❌ CHUNG HEAP!   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  → ĐÂY là GỐC RỄ của vấn đề shallow vs deep copy! ★     │
  │  → Copy POINTER hay copy ENTITY? ★★★                        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Shallow Copy — Sao Chép Nông!

```
  SHALLOW COPY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ Chỉ copy LỚP ĐẦU TIÊN!                                    │
  │  ★ Primitive → copy GIÁ TRỊ! ✅                                │
  │  ★ Reference (nested) → copy POINTER! ❌ (chung heap!)       │
  │                                                              │
  │  source = { name: 'JS', info: { age: 10 } }                  │
  │  target = { ...source }  // SHALLOW COPY!                     │
  │                                                              │
  │  STACK              HEAP                                       │
  │  ┌────────────┐    ┌───────────────────┐                      │
  │  │ source     │    │                   │                      │
  │  │ .name ='JS'│    │  { age: 10 }      │                      │
  │  │ .info =0x01├────┤     ↑ 0x01        │ ← CHUNG! ★          │
  │  ├────────────┤    │     │              │                      │
  │  │ target     │    │     │              │                      │
  │  │ .name ='JS'│    │     │              │                      │
  │  │ .info =0x01├────┘     │              │                      │
  │  └────────────┘    └───────────────────┘                      │
  │                                                              │
  │  target.name = 'TS';       → source.name = 'JS' ✅ OK!      │
  │  target.info.age = 999;    → source.info.age = 999! ❌ !!!  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// SHALLOW COPY — 3 cách phổ biến!
// ═══════════════════════════════════════════════════════════

// CÁCH 1: Object.assign ★
function shallowAssign(obj) {
  return Object.assign({}, obj);
}

// CÁCH 2: Spread operator ★
function shallowSpread(obj) {
  // return { ...obj };
  var result = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key]; // ★ Copy giá trị lớp 1!
    }
  }
  return result;
}

// CÁCH 3: Array — slice / concat!
function shallowArray(arr) {
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    result.push(arr[i]); // ★ Copy reference nếu là object!
  }
  return result;
}

// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Shallow Copy hoàn chỉnh!
// ★ Xử lý cả Object và Array!
// ═══════════════════════════════════════════════════════════

function shallowClone(obj) {
  // Primitive / null → trả ngay!
  if (obj === null || typeof obj !== "object") return obj;

  // Array!
  if (Array.isArray(obj)) {
    var arr = [];
    for (var i = 0; i < obj.length; i++) {
      arr[i] = obj[i]; // ★ Chỉ copy lớp 1!
    }
    return arr;
  }

  // Object!
  var result = {};
  var keys = Object.keys(obj);
  for (var j = 0; j < keys.length; j++) {
    result[keys[j]] = obj[keys[j]]; // ★ Chỉ copy lớp 1!
  }
  return result;
}
```

---

## §3. Deep Copy — Sao Chép Sâu!

```
  DEEP COPY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ★ Copy TẤT CẢ levels! ★                                      │
  │  ★ Mỗi nested object → vùng heap RIÊNG! ★                    │
  │  ★ Old và new HOÀN TOÀN ĐỘC LẬP! ★                           │
  │                                                              │
  │  source = { name: 'JS', info: { age: 10 } }                  │
  │  target = deepClone(source)                                    │
  │                                                              │
  │  STACK              HEAP                                       │
  │  ┌────────────┐    ┌───────────────────┐                      │
  │  │ source     │    │                   │                      │
  │  │ .name ='JS'│    │  { age: 10 } 0x01 │ ← source dùng!     │
  │  │ .info =0x01├────┤                   │                      │
  │  ├────────────┤    ├───────────────────┤                      │
  │  │ target     │    │                   │                      │
  │  │ .name ='JS'│    │  { age: 10 } 0x02 │ ← target RIÊNG! ★  │
  │  │ .info =0x02├────┤                   │                      │
  │  └────────────┘    └───────────────────┘                      │
  │                                                              │
  │  target.info.age = 999;                                        │
  │  → source.info.age = 10! ✅ KHÔNG ảnh hưởng! ★             │
  │  → target.info.age = 999! ✅ Độc lập hoàn toàn! ★          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 3.1 JSON Method — Đơn Giản Nhưng Nhiều Hạn Chế!

```javascript
// ═══════════════════════════════════════════════════════════
// CÁCH 1: JSON.parse(JSON.stringify())
// ★ ĐƠN GIẢN nhưng NHIỀU HẠN CHẾ! ★
// ═══════════════════════════════════════════════════════════

function jsonClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ❌ HẠN CHẾ:
// var original = {
//   fn: function() {},     // → MẤT! ❌ (function!)
//   date: new Date(),       // → THÀNH STRING! ❌
//   regex: /abc/g,          // → THÀNH {}! ❌
//   undef: undefined,       // → MẤT! ❌
//   sym: Symbol('x'),       // → MẤT! ❌
//   nan: NaN,               // → THÀNH null! ❌
//   inf: Infinity,          // → THÀNH null! ❌
// };
// original.self = original; // → THROW ERROR! ❌ (circular!)
```

```
  JSON METHOD — HẠN CHẾ:
  ┌──────────────────────────────────────────────────────────────┐
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Kiểu            │ Kết quả JSON method             │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ function          │ ❌ MẤT hoàn toàn!               │    │
  │  │ undefined          │ ❌ MẤT hoàn toàn!               │    │
  │  │ Symbol             │ ❌ MẤT hoàn toàn!               │    │
  │  │ Date               │ ❌ Thành string! (mất method!) │    │
  │  │ RegExp             │ ❌ Thành {} (mất pattern!)     │    │
  │  │ Map / Set          │ ❌ Thành {} (mất data!)        │    │
  │  │ NaN / Infinity     │ ❌ Thành null!                  │    │
  │  │ Circular ref       │ ❌ TypeError: circular! CRASH! │    │
  │  │ Primitive/Array    │ ✅ OK!                          │    │
  │  │ Plain Object       │ ✅ OK!                          │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  │  → JSON method CHỈ dùng cho plain data! ★                   │
  │  → Object phức tạp → phải tự viết! ★★★                     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 3.2 Tự Viết Deep Clone — Hoàn Chỉnh!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: Deep Clone HOÀN CHỈNH!
// ★ Circular ref + Date + RegExp + Map + Set + Symbol key!
// ═══════════════════════════════════════════════════════════

function deepClone(obj, cache) {
  // ★ WeakMap → xử lý circular reference! ★★★
  if (!cache) cache = new WeakMap();

  // ① Primitive + null + function → trả ngay!
  // (function không clone — giữ reference!)
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // ② Circular reference! ★★★
  // → Đã clone rồi → trả bản đã clone!
  if (cache.has(obj)) {
    return cache.get(obj);
  }

  // ③ Special types! ★
  if (obj instanceof Date) {
    return new Date(obj.getTime());
    // ★ getTime() → milliseconds → Date mới!
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags);
    // ★ source = pattern, flags = "gi" etc!
  }

  if (obj instanceof Map) {
    var mapCopy = new Map();
    cache.set(obj, mapCopy); // ★ Cache TRƯỚC khi recurse!
    obj.forEach(function (val, key) {
      // ★ Clone CẢ key VÀ value! (key có thể là object!)
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

  // ★★★ Cache TRƯỚC khi recurse! (circular reference!)
  // → Nếu cache SAU → stack overflow khi A→B→A!
  cache.set(obj, clone);

  // ★ String keys!
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    // ★ hasOwnProperty → chỉ copy own property!
    clone[keys[i]] = deepClone(obj[keys[i]], cache);
  }

  // ★ Symbol keys! (Object.keys BỎ QUA Symbol!) ★
  var symKeys = Object.getOwnPropertySymbols(obj);
  for (var j = 0; j < symKeys.length; j++) {
    clone[symKeys[j]] = deepClone(obj[symKeys[j]], cache);
  }

  return clone;
}
```

```
  CIRCULAR REFERENCE — GIẢI THÍCH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ:                                                       │
  │  var a = { name: 'A' };                                       │
  │  var b = { name: 'B' };                                       │
  │  a.ref = b;  // A → B                                        │
  │  b.ref = a;  // B → A ← VÒNG TRÒN! ★                       │
  │                                                              │
  │  ┌───┐ ref ┌───┐                                              │
  │  │ A │────→│ B │                                              │
  │  │   │←────│   │                                              │
  │  └───┘ ref └───┘  ← CIRCULAR! ★                              │
  │                                                              │
  │  KHÔNG CÓ WeakMap:                                               │
  │  deepClone(a)                                                  │
  │    → clone a.ref = deepClone(b)                                │
  │      → clone b.ref = deepClone(a) ← LẶP LẠI!               │
  │        → clone a.ref = deepClone(b) ← ∞ LOOP!              │
  │          → ★ STACK OVERFLOW! ❌❌❌                           │
  │                                                              │
  │  CÓ WeakMap: ★                                                  │
  │  deepClone(a)                                                  │
  │    → cache.set(a, cloneA) ← LƯU! ★                          │
  │    → clone a.ref = deepClone(b)                                │
  │      → cache.set(b, cloneB) ← LƯU! ★                       │
  │      → clone b.ref = deepClone(a)                              │
  │        → cache.has(a) = TRUE! ★                               │
  │        → return cache.get(a) = cloneA! ★ (KHÔNG recurse!)   │
  │      → cloneB.ref = cloneA ✅                                │
  │    → cloneA.ref = cloneB ✅                                   │
  │    → XONG! ✅ Không stack overflow!                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### 3.3 structuredClone — API Hiện Đại!

```javascript
// ═══════════════════════════════════════════════════════════
// structuredClone — Web API built-in! ★
// ═══════════════════════════════════════════════════════════

// var clone = structuredClone(original);

// ✅ Hỗ trợ:
// → Circular reference! ✅
// → Date, RegExp, Map, Set! ✅
// → ArrayBuffer, Blob! ✅
// → Nested objects/arrays! ✅

// ❌ KHÔNG hỗ trợ:
// → Function! ❌ (throw error!)
// → DOM nodes! ❌
// → Symbol! ❌
// → Prototype chain! ❌

// Browser support: Chrome 98+, Firefox 94+, Safari 15.4+
```

---

## §4. So Sánh Tổng Hợp!

```
  TỔNG HỢP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────┬──────────────────┬──────────────────┐     │
  │  │ Đặc điểm    │ Shallow Copy     │ Deep Copy ★      │     │
  │  ├──────────────┼──────────────────┼──────────────────┤     │
  │  │ Memory        │ Lớp 1: mới      │ TẤT CẢ: mới! ★ │     │
  │  │              │ Nested: CHUNG! ❌│ Hoàn toàn riêng!│     │
  │  │ Tốc độ      │ NHANH! ★         │ Chậm (recursive) │     │
  │  │ Độ phức tạp │ Đơn giản        │ Phức tạp! ★      │     │
  │  │ Circular ref │ Không vấn đề   │ Cần WeakMap! ★   │     │
  │  │ Special types│ Copy pointer     │ Cần xử lý riêng!│     │
  │  └──────────────┴──────────────────┴──────────────────┘     │
  │                                                              │
  │  CHỌN GÌ?                                                       │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Trường hợp      │ Dùng                            │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ Config merge      │ Shallow! ({...a, ...b}) ★       │    │
  │  │ State update      │ Shallow! (immutable pattern!) ★ │    │
  │  │ Data backup       │ Deep! (toàn vẹn data!) ★       │    │
  │  │ Redux/Vuex state  │ Deep! (tránh side effect!) ★   │    │
  │  │ Undo/Redo system  │ Deep! (snapshot!) ★             │    │
  │  │ API response cache│ Deep! (isolate mutations!) ★    │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  │  DEEP COPY OPTIONS:                                              │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Method            │ Khi nào dùng                   │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ JSON method       │ Plain data, KHÔNG function/Date │    │
  │  │ structuredClone ★ │ Modern browser, có circular! ★  │    │
  │  │ Tự viết recursive│ Cần full control + phỏng vấn! ★│    │
  │  │ lodash.cloneDeep  │ Production, legacy browser!      │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI + CÁCH TRẢ LỜI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: Shallow vs Deep copy khác gì?                             │
  │  BƯỚC 1 — Memory model:                                         │
  │  → Primitive: stack, copy giá trị!                            │
  │  → Reference: heap, stack chỉ chứa pointer!                  │
  │                                                              │
  │  BƯỚC 2 — Core difference:                                      │
  │  → Shallow: copy lớp 1, nested CHUNG pointer! ★              │
  │  → Sửa nested ở copy → ảnh hưởng original! ❌              │
  │  → Deep: recursive copy TẤT CẢ, heap RIÊNG! ★               │
  │  → Sửa bất kỳ đâu → KHÔNG ảnh hưởng! ✅                   │
  │                                                              │
  │  BƯỚC 3 — Implementation:                                       │
  │  → Shallow: Object.assign, spread (...)                       │
  │  → Deep: JSON (hạn chế!), structuredClone, tự viết! ★      │
  │                                                              │
  │  BƯỚC 4 — Advanced (ghi điểm!):                                 │
  │  → Circular ref: WeakMap cache! cache TRƯỚC khi recurse!      │
  │  → Special types: Date(getTime), RegExp(source,flags)!       │
  │  → Symbol keys: Object.getOwnPropertySymbols! ★              │
  │                                                              │
  │  ❓ 2: Tại sao WeakMap mà không Map?                             │
  │  → WeakMap: key phải là object, key bị GC khi không ai ref! │
  │  → Map: giữ reference → object KHÔNG bị GC → memory leak! │
  │  → deepClone xong → WeakMap entries tự bị GC! ★            │
  │                                                              │
  │  ❓ 3: structuredClone vs JSON method?                           │
  │  → structuredClone: circular ✅, Date ✅, Map/Set ✅! ★     │
  │  → JSON: circular ❌, Date → string ❌, function ❌!        │
  │  → structuredClone: function ❌, Symbol ❌!                  │
  │  → Cả 2 đều KHÔNG clone function! ★                         │
  │                                                              │
  │  ❓ 4: Tại sao cache.set TRƯỚC khi recurse?                     │
  │  → A → B → A: nếu cache SAU recurse → ∞ loop! ❌           │
  │  → Cache TRƯỚC → gặp A lần 2 → return cache → DỪNG! ✅    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
