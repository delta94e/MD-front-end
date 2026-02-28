# JavaScript Basics & Prototype Chain — Deep Dive

> 📅 2026-02-11 · ⏱ 40 phút đọc
>
> Tổng hợp kiến thức JS cốt lõi: new operator, Map/WeakMap, Built-in Objects,
> AJAX/Fetch/Axios, DOM/BOM, Variable Hoisting, Unicode, Bitwise, Prototype Chain.

---

## Mục Lục

**Phần III — JavaScript Basics**

1. [new Operator](#1-new-operator)
2. [Map vs Object](#2-map-vs-object)
3. [Map vs WeakMap](#3-map-vs-weakmap)
4. [Built-in Objects](#4-built-in-objects)
5. [Regular Expressions](#5-regular-expressions)
6. [JSON](#6-json)
7. [Lazy Loading JS](#7-lazy-loading-js)
8. [Array-like Objects](#8-array-like-objects)
9. [Native Array Methods](#9-native-array-methods)
10. [Unicode, UTF-8, UTF-16, UTF-32](#10-unicode-utf-8-utf-16-utf-32)
11. [Bitwise Operators](#11-bitwise-operators)
12. [arguments Object](#12-arguments-object)
13. [DOM và BOM](#13-dom-và-bom)
14. [Array-like → Array](#14-array-like--array)
15. [escape / encodeURI / encodeURIComponent](#15-escape--encodeuri--encodeuricomponent)
16. [AJAX & Promise Wrapper](#16-ajax--promise-wrapper)
17. [Variable Hoisting](#17-variable-hoisting)
18. [Tail Call Optimization](#18-tail-call-optimization)
19. [ES6 Modules vs CommonJS](#19-es6-modules-vs-commonjs)
20. [DOM Operations — CRUD](#20-dom-operations--crud)
21. [use strict](#21-use-strict)
22. [Kiểm tra Object thuộc Class](#22-kiểm-tra-object-thuộc-class)
23. [Strong vs Weak Typing](#23-strong-vs-weak-typing)
24. [Compiled vs Interpreted](#24-compiled-vs-interpreted)
25. [for...in vs for...of](#25-forin-vs-forof)
26. [for...of duyệt Object](#26-forof-duyệt-object)
27. [AJAX vs Fetch vs Axios](#27-ajax-vs-fetch-vs-axios)
28. [Array Iteration Methods](#28-array-iteration-methods)
29. [forEach vs map](#29-foreach-vs-map)

**Phần IV — Prototype & Prototype Chain**

30. [Prototype & Prototype Chain](#30-prototype--prototype-chain)
31. [Prototype Modification vs Rewriting](#31-prototype-modification-vs-rewriting)
32. [Prototype Chain — Các Pointer References](#32-prototype-chain--các-pointer-references)
33. [Endpoint — Prototype Chain kết thúc ở đâu?](#33-endpoint--prototype-chain-kết-thúc-ở-đâu)
34. [Truy cập Own Properties — hasOwnProperty](#34-truy-cập-own-properties--hasownproperty)
35. [Câu Hỏi Phỏng Vấn](#35-câu-hỏi-phỏng-vấn)

---

# PHẦN III — JAVASCRIPT BASICS

---

## 1. new Operator

**Nguyên lý thực thi (Implementation Principle):**

Khi gọi `new Constructor()`, JS engine thực hiện **4 bước** tuần tự:

1. **Tạo object rỗng** — First, a new empty object is created.
2. **Set prototype** — Gán `__proto__` của object = `prototype` của constructor function. Thiết lập prototype chain cho object mới.
3. **Bind `this` & execute** — Gán `this` = object mới, chạy constructor code → thêm properties/methods vào object. Make the function's `this` refer to this object, and execute the constructor's code.
4. **Kiểm tra return type** — Determine the return type:
   - Nếu constructor return **value type** (primitive) → **bỏ qua**, trả object đã tạo ở bước 1.
   - Nếu constructor return **reference type** (object/function) → trả reference đó **thay thế** object mới.

**Cụ thể implement thủ công (Manual Implementation):**

```javascript
function objectFactory() {
  let newObject = null;
  let constructor = Array.prototype.shift.call(arguments);
  let result = null;
  // Kiểm tra argument có phải function không
  if (typeof constructor !== "function") {
    console.error("type error");
    return;
  }
  // Bước 1+2: tạo object rỗng, prototype = constructor.prototype
  newObject = Object.create(constructor.prototype);
  // Bước 3: gán this = newObject, chạy constructor
  result = constructor.apply(newObject, arguments);
  // Bước 4: kiểm tra return type
  let flag =
    result && (typeof result === "object" || typeof result === "function");
  return flag ? result : newObject;
}

// Sử dụng:
objectFactory(Person, "Jun", 25);
```

---

## 2. Map vs Object

**Chi tiết từng tiêu chí so sánh:**

- **Unexpected key:** Map mặc định **không chứa key nào** — chỉ có key được insert. Object có prototype → key trên **prototype chain** có thể **conflict** với key do user set.
- **Key type:** Map key có thể là **bất kỳ value nào** (function, object, primitive). Object key **chỉ là String hoặc Symbol**.
- **Key order:** Keys trong Map được **sắp xếp theo thứ tự insert**. Khi iterate, Map trả key theo **đúng thứ tự** chèn vào. Keys của Object **không đảm bảo** thứ tự.
- **Size:** Map có `map.size` để lấy trực tiếp số lượng key-value pairs. Object phải **tính thủ công** bằng `Object.keys(obj).length`.
- **Iteration:** Map là **iterable** → duyệt trực tiếp bằng `for...of`. Object cần **lấy keys trước** (ví dụ `Object.keys()`) rồi mới iterate.
- **Performance:** Map **tối ưu** cho scenarios **thêm/xoá key-value thường xuyên**. Object **không có** tối ưu nào cho add/delete thường xuyên.

| Tiêu chí          | Map                                         | Object                                                      |
| ----------------- | ------------------------------------------- | ----------------------------------------------------------- |
| **Keys mặc định** | Không có key nào — chỉ chứa key được insert | Có prototype → key trên prototype chain có thể **conflict** |
| **Key type**      | **Bất kỳ** (function, object, primitive)    | Chỉ **String** hoặc **Symbol**                              |
| **Key order**     | **Đúng thứ tự insert**                      | Không đảm bảo thứ tự                                        |
| **Size**          | `map.size` — lấy trực tiếp                  | Phải tính `Object.keys(obj).length`                         |
| **Iterable**      | ✅ Trực tiếp (`for...of`)                   | ❌ Cần `Object.keys()` trước                                |
| **Performance**   | Tối ưu cho **add/delete thường xuyên**      | Không tối ưu cho add/delete                                 |

---

## 3. Map vs WeakMap

### (1) Map

Map là collection key-value, key có thể là **bất kỳ type** nào (khác Object chỉ nhận String/Symbol). Nếu key là primitive, hai key được coi giống nhau khi **strictly identical**.

Internally, Map là array of arrays:

```javascript
const map = [
  ["name", "张三"],
  ["age", 18],
];
```

**Methods chi tiết:**

- **`map.size`:** Trả về tổng số members trong Map.
- **`set(key, value)`:** Set giá trị tương ứng với key. Nếu key đã tồn tại → **update**; chưa có → **tạo key mới**. Vì return chính Map object → **chainable** (`map.set('a', 1).set('b', 2)`).
- **`get(key)`:** Đọc key-value pair tương ứng. Nếu key không tìm thấy → trả `undefined`.
- **`has(key)`:** Trả `boolean` cho biết key có tồn tại trong Map hiện tại hay không.
- **`delete(key)`:** Xóa key chỉ định → trả `true`. Xóa thất bại → trả `false`.
- **`clear()`:** Xóa tất cả members, không có return value.

| Method            | Mô tả                                              |
| ----------------- | -------------------------------------------------- |
| `map.size`        | Tổng số members                                    |
| `set(key, value)` | Set key-value. Key tồn tại → update. **Chainable** |
| `get(key)`        | Lấy value, không có → `undefined`                  |
| `has(key)`        | Kiểm tra key tồn tại → `boolean`                   |
| `delete(key)`     | Xóa key → `true/false`                             |
| `clear()`         | Xóa tất cả, không return                           |

**Map có 3 iterator generation functions và 1 iteration method:**

- **`keys()`:** Trả về iterator của **key names**.
- **`values()`:** Trả về iterator của **key values**.
- **`entries()`:** Trả về iterator của **tất cả members** (`[key, value]` pairs).
- **`forEach()`:** Duyệt qua **tất cả members** của Map.

**Iterators:**

```javascript
const map = new Map([
  ["foo", 1],
  ["bar", 2],
]);
for (let key of map.keys()) console.log(key); // foo bar
for (let value of map.values()) console.log(value); // 1 2
for (let items of map.entries()) console.log(items); // ["foo",1] ["bar",2]
map.forEach((value, key, map) => {
  console.log(key, value); // foo 1, bar 2
});
```

### (2) WeakMap

WeakMap cũng là collection key-value, nhưng key **CHỈ là objects** (không nhận primitive), value bất kỳ.

**Methods:** `set(key, value)` · `get(key)` · `has(key)` · `delete(key)`
→ **KHÔNG có:** `size`, `clear()` (deprecated), `keys()`, `values()`, `entries()`, `forEach()`

> Muốn clear toàn bộ WeakMap? Tạo một **empty WeakMap** mới và **replace** object cũ.

**Weak Reference và Garbage Collection:**

Mục đích của WeakMap: giải quyết tình huống muốn **lưu data gắn với object**, nhưng việc lưu tạo ra **reference đến object** đó. Khi không cần object nữa, bạn phải **manually delete reference** — nếu không, GC sẽ **không** giải phóng bộ nhớ của object.

Trong WeakMap, keys là **weak references** → GC **không tính** các references này. Khi tất cả **strong references** khác đến object bị xóa → GC tự động giải phóng bộ nhớ của object. Nói cách khác: khi không cần nữa, key objects và key-value pairs tương ứng trong WeakMap sẽ **tự động biến mất** mà **không cần manual cleanup** → tránh memory leak.

**Use cases:** Lưu metadata cho DOM nodes (node remove → data auto clean), private data cho classes, cache object data mà không ngăn GC.

### Tổng hợp

|          | Map                      | WeakMap                 |
| -------- | ------------------------ | ----------------------- |
| Key type | Bất kỳ                   | CHỈ objects (trừ null)  |
| GC       | Strong ref → không bị GC | Weak ref → CÓ THỂ bị GC |
| Iterable | ✅                       | ❌                      |
| size     | ✅                       | ❌                      |

---

## 4. Built-in Objects

> **Lưu ý:** "Global objects" (built-in objects) ≠ "global object" (window/global). Built-in objects tồn tại trong global scope **trước khi** program chạy. Các objects khác trong global scope có thể được tạo bởi user scripts hoặc cung cấp bởi host program.

**Phân loại chi tiết:**

| #   | Phân loại            | Ví dụ                                              | Mô tả                                                              |
| --- | -------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | Value properties     | `Infinity`, `NaN`, `undefined`, `null`             | Trả về **simple value**, không có properties hay methods riêng     |
| 2   | Global functions     | `eval()`, `parseFloat()`, `parseInt()`             | Gọi trực tiếp **không cần specify object**, trả kết quả cho caller |
| 3   | Fundamental objects  | `Object`, `Function`, `Boolean`, `Symbol`, `Error` | Nền tảng để **define hoặc sử dụng** các objects khác               |
| 4   | Numbers & Dates      | `Number`, `Math`, `Date`                           | Biểu diễn **số, ngày tháng** và phép tính toán                     |
| 5   | Strings              | `String`, `RegExp`                                 | Biểu diễn và **thao tác** strings                                  |
| 6   | Indexed collections  | `Array`, `TypedArray`                              | Collections sắp xếp theo **index value**                           |
| 7   | Keyed collections    | `Map`, `Set`, `WeakMap`, `WeakSet`                 | Dùng **keys** lưu data, hỗ trợ iteration theo thứ tự insert        |
| 8   | SIMD vectors         | `SIMD` (deprecated)                                | Data tổ chức thành **data sequence**                               |
| 9   | Structured data      | `JSON`, `ArrayBuffer`                              | Biểu diễn và thao tác **structured buffered data** hoặc JSON       |
| 10  | Control abstractions | `Promise`, `Generator`                             | Điều khiển **async flow** và **iterators**                         |
| 11  | Reflection           | `Reflect`, `Proxy`                                 | **Intercept** và **customize** operations trên objects             |
| 12  | Internationalization | `Intl`, `Intl.Collator`...                         | Hỗ trợ **multilingual processing**                                 |
| 13  | WebAssembly          |                                                    | Thực thi **low-level bytecode** trên browser                       |
| 14  | Others               | `arguments`                                        | Các objects đặc biệt khác                                          |

**Tóm lại:** Built-in objects chủ yếu là **global value properties** (NaN, undefined), **global functions** (parseInt, parseFloat), **constructors** (Date, Object, Array) và **singleton objects** cho mathematical calculations (Math). Chúng tồn tại trong global scope **trước khi** program bắt đầu execute.

---

## 5. Regular Expressions

Các biểu thức chính quy (regular expressions) thường được sử dụng trong phát triển để validate data, tìm kiếm và thay thế text. Dưới đây là một số regex thường gặp:

```javascript
// (1) Hex color
var regex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g;
// (2) Date yyyy-mm-dd
var regex = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
// (3) QQ number
var regex = /^[1-9][0-9]{4,10}$/g;
// (4) Phone number
var regex = /^1[34578]\d{9}$/g;
// (5) Username (5-16 chars, start with letter or $)
var regex = /^[a-zA-Z\$][a-zA-Z0-9_\$]{4,16}$/;
```

---

## 6. JSON

JSON là text-based, lightweight data-interchange format — mọi ngôn ngữ đều đọc được. Ngoài ra, JSON có thể được **đọc và truyền** như là một data format bởi **bất kỳ** ngôn ngữ lập trình nào.

Trong dự án thực tế, JSON là **cầu nối dữ liệu** giữa front-end và back-end:

- **FE → BE:** Front-end serialize data structure thành JSON string rồi gửi đi.
- **BE → FE:** Back-end parse JSON string thành data structure tương ứng.

**JSON ≠ JS Object!** JSON nghiêm ngặt hơn rất nhiều:

- Property name **PHẢI** là string (có dấu `""`)
- Value **KHÔNG** được là: `function`, `NaN`, `Infinity`, `undefined`
- Không có comment, trailing comma
- Vì vậy, **đa số JS objects KHÔNG conform** JSON format.

**2 Methods:**

- **`JSON.stringify(obj)`** — Convert JS data structure thành JSON string. Nếu input data structure **không conform** JSON format, các values không hợp lệ sẽ được **xử lý đặc biệt** trong quá trình serialization để đảm bảo conform. Gọi function này khi **gửi data lên BE**.
- **`JSON.parse(str)`** — Convert JSON string thành JS data structure. Nếu input **không phải** standard JSON string → **throw Error**. Gọi function này khi **nhận data từ BE**.

| Method                | Chức năng                            | Lỗi?                                    |
| --------------------- | ------------------------------------ | --------------------------------------- |
| `JSON.stringify(obj)` | JS object → JSON string (gửi BE)     | Xử lý đặc biệt values không hợp lệ      |
| `JSON.parse(str)`     | JSON string → JS object (nhận từ BE) | **Throw Error** nếu string không hợp lệ |

---

## 7. Lazy Loading JS

Lazy loading = chỉ tải JavaScript files **sau khi** trang đã load xong. Mục đích: **cải thiện tốc độ tải trang** (page load speed). Lazy loading giúp trang web hiển thị nội dung nhanh hơn bằng cách **trì hoãn** việc tải các script không cần thiết.

**Các phương pháp:**

- **`defer` attribute:** Thêm `defer` vào `<script>` → script được **tải và parse song song** với document, nhưng chỉ **execute sau khi** document parse xong → **không block** page rendering. Theo quy ước, nhiều scripts với `defer` được execute **tuần tự**, nhưng một số browsers có thể không đảm bảo điều này.
- **`async` attribute:** Thêm `async` vào `<script>` → script **tải asynchronous**, không block parsing. Tuy nhiên, script **execute ngay khi load xong** → có thể block nếu document chưa parse xong. Thứ tự của nhiều `async` scripts là **không dự đoán được** và thường không tuân theo thứ tự code.
- **Dynamic DOM creation:** Listen document loading events, sau đó **tạo script tags động** bằng JS khi document đã load xong.
- **`setTimeout` delay:** Set timer để **trì hoãn** việc tải JavaScript files.
- **Script cuối `<body>`:** Đặt JS script ở **cuối document** để nó được load và execute cuối cùng.

| Cách                 | Load                 | Execute                     | Thứ tự                 | Ghi chú                                          |
| -------------------- | -------------------- | --------------------------- | ---------------------- | ------------------------------------------------ |
| `defer`              | Song song HTML       | **Sau khi** HTML parse xong | Giữ thứ tự (lý thuyết) | Không block rendering                            |
| `async`              | Song song HTML       | **Ngay khi** load xong      | Không đảm bảo          | Có thể block nếu HTML chưa parse xong            |
| Dynamic DOM          | Sau DOMContentLoaded | Tạo `<script>` bằng JS      | Tuỳ                    | Listen `DOMContentLoaded` rồi tạo `<script>` tag |
| `setTimeout`         | Delay N ms           | Sau timeout                 | Tuỳ                    | Set timer delay loading                          |
| Script cuối `<body>` | Cuối cùng            | Cuối cùng                   | Theo code              | Đơn giản nhất, đặt JS ở cuối body                |

---

## 8. Array-like Objects

Object có `length` property + numeric index properties (0, 1, 2...) = **array-like**.
→ **Không có** array methods: `forEach`, `map`, `filter`, `reduce`, `push`, `pop`...
→ Ví dụ phổ biến: `arguments`, `NodeList` (DOM), `HTMLCollection`.
→ Function cũng là array-like (vì có `length` property = số params nhận được).
→ Array-like **giống** array nhưng **KHÔNG phải** array — không thể gọi array methods trực tiếp.

> **Lưu ý:** Function parameters cũng được coi là array-like object vì chúng chứa `length` property, biểu diễn **số lượng parameters** mà function có thể nhận.

**5 cách convert → Array:**

```javascript
Array.prototype.slice.call(arrayLike); // ①
Array.prototype.splice.call(arrayLike, 0); // ②
Array.prototype.concat.apply([], arrayLike); // ③
Array.from(arrayLike); // ④ ← RECOMMENDED
[...arrayLike]; // ⑤ (cần Symbol.iterator)
```

---

## 9. Native Array Methods

**Phân nhóm các methods:**

- **Convert (array → string):** `toString()`, `toLocaleString()`, `join(sep)`. `join()` cho phép chỉ định **delimiter** khi convert.
- **End operations:** `push(...items)` thêm cuối (nhận nhiều arguments), `pop()` xóa cuối.
- **Start operations:** `unshift(...items)` thêm đầu, `shift()` xóa đầu.
- **Reorder:** `reverse()` đảo ngược, `sort(compareFn)` sắp xếp. `sort()` nhận function làm argument — nếu trả **positive** → swap 2 args.
- **Merge:** `concat(...arrays)` trả array mới, **không đổi original**.
- **Extract:** `slice(start, end)` trích xuất một phần, **không đổi original**.
- **Mutate:** `splice(start, deleteCount, ...items)` chèn/xóa/thay thế, **đổi original**.
- **Search:** `indexOf()`, `lastIndexOf()`, `includes()` tìm index/check tồn tại.
- **Iterate:** `forEach`, `map`, `filter`, `every`, `some`, `find`, `findIndex` — không đổi original.
- **Reduce:** `reduce(fn, init)` accumulate ascending, `reduceRight(fn, init)` accumulate descending.

| Nhóm    | Methods                                                          | Đổi gốc? |
| ------- | ---------------------------------------------------------------- | -------- |
| Convert | `toString()`, `toLocaleString()`, `join(sep)`                    | Không    |
| End     | `push(...items)`, `pop()`                                        | **Có**   |
| Start   | `unshift(...items)`, `shift()`                                   | **Có**   |
| Order   | `reverse()`, `sort(compareFn)`                                   | **Có**   |
| Merge   | `concat(...arrays)`                                              | Không    |
| Extract | `slice(start, end)`                                              | Không    |
| Mutate  | `splice(start, deleteCount, ...items)`                           | **Có**   |
| Search  | `indexOf()`, `lastIndexOf()`, `includes()`                       | Không    |
| Iterate | `forEach`, `map`, `filter`, `every`, `some`, `find`, `findIndex` | Không    |
| Reduce  | `reduce(fn, init)`, `reduceRight(fn, init)`                      | Không    |

> `sort()` nhận compareFn: return positive → swap 2 args.

---

## 10. Unicode, UTF-8, UTF-16, UTF-32

### (1) ASCII & Unicode

**ASCII** (American Standard Code for Information Interchange): 128 ký tự, chỉ tiếng Anh, Latin alphabet, 0-9, symbols.

**Unicode** = superset của ASCII. Gán mã duy nhất cho **MỌI ký tự** mọi ngôn ngữ. Unicode là **character set**, UTF-8/16/32 là **encoding rules** (cách lưu trữ).

### (2) UTF-8 — phổ biến nhất

Variable-length: 1-4 bytes. Compatible ASCII 100%.

**Rules:**

- Single-byte: bit đầu = 0, 7 bits còn lại = Unicode encoding
- n-byte: n bits đầu byte 1 = `1`, bit thứ n+1 = `0`, các byte sau bắt đầu bằng `10`

| Range                       | Binary format                         | Bytes |
| --------------------------- | ------------------------------------- | ----- |
| `0x00–0x7F` (0-127)         | `0xxxxxxx`                            | 1     |
| `0x80–0x7FF` (128-2047)     | `110xxxxx 10xxxxxx`                   | 2     |
| `0x800–0xFFFF` (2048-65535) | `1110xxxx 10xxxxxx 10xxxxxx`          | 3     |
| `0x10000–0x10FFFF` (65536+) | `11110xxx 10xxxxxx 10xxxxxx 10xxxxxx` | 4     |

**Ví dụ: "马" = U+9A6C (39532)**

1. Range 2048-65535 → 3 bytes → format: `1110xxxx 10xxxxxx 10xxxxxx`
2. 39532 → binary: `1001 1010 0110 1100`
3. Fill X từ phải sang: `11101001 10101001 10101100`

### (3) UTF-16

**Planes:** Unicode chia 17 planes, mỗi plane 65536 (2^16) ký tự.

- **BMP (Basic Multilingual Plane):** U+0000–U+FFFF → **2 bytes**
- **Supplementary Planes:** U+10000–U+10FFFF → **4 bytes** (surrogate pair)

**Surrogate Pair mechanism:**

- U+D800–U+DFFF là empty segment trong BMP (không map ký tự nào) → dùng segment này để map ký tự supplementary.
- Supplementary planes có 2^20 character positions → biểu diễn cần ít nhất **20 binary bits**.
- UTF-16 chia 20 bits thành **2 nửa**:
  - **High surrogate (H):** 10 bits đầu → map vào U+D800–U+DBFF
  - **Low surrogate (L):** 10 bits sau → map vào U+DC00–U+DFFF
- Tương đương: **tách 1 ký tự** supplementary thành **2 ký tự** basic plane để biểu diễn.

**Encoding Recognition (Nhận biết):**

Vấn đề: khi gặp 2 bytes, làm sao biết nó là **1 ký tự riêng** hay là **phần đầu** của 1 ký tự 4 bytes?

→ Khi gặp 2 bytes có code point nằm trong **U+D800–U+DBFF** → biết ngay đó là **high surrogate**, 2 bytes tiếp theo chắc chắn phải có code point trong **U+DC00–U+DFFF** (low surrogate) → **đọc 4 bytes cùng nhau** và interpret chúng là 1 ký tự.

**Ví dụ: "𡠀" = U+21800**

1. Excess: `0x21800 - 0x10000 = 0x11800`
2. 20-bit binary: `0001000110 0000000000`
3. High: `0xD800 + 0001000110 = 0xD846`
4. Low: `0xDC00 + 0000000000 = 0xDC00`
   → **UTF-16: `0xD846 0xDC00`**

### (4) UTF-32

Mỗi ký tự = **4 bytes cố định**. Đơn giản (convert trực tiếp) nhưng **tốn bộ nhớ**.
Ví dụ: "马" = U+9A6C → binary: `00000000 00000000 10011010 01101100`

### (5) So sánh

- Unicode = character set; UTF-8/16/32 = encoding rules
- **Complexity:** UTF-16 (surrogate pairs) > UTF-8 > UTF-32
- **Fault tolerance:** UTF-8 lỗi 1 byte → ảnh hưởng nhiều bytes. UTF-16 lỗi → chỉ 1 char → **fault tolerance cao hơn**
- **Space:** English nhiều → **UTF-8** tiết kiệm. CJK nhiều → **UTF-16** tiết kiệm

---

## 11. Bitwise Operators

Trong máy tính hiện đại, dữ liệu được lưu trữ dưới dạng **binary** (nhị phân) — gồm 2 trạng thái: **0** và **1**. Các phép toán mà máy tính thực hiện trên dữ liệu nhị phân (cộng, trừ, nhân, chia) được gọi là **bitwise operations** (toán tử theo bit), liên quan đến **sign bit** (bit dấu) trong quá trình tính toán.

| Operator | Tên         | Rule                                                                            |
| -------- | ----------- | ------------------------------------------------------------------------------- |
| `&`      | AND         | Cả 2 = 1 → 1                                                                    |
| `\|`     | OR          | Một trong 2 = 1 → 1                                                             |
| `^`      | XOR         | Khác nhau → 1                                                                   |
| `~`      | NOT         | Đảo 0↔1                                                                         |
| `<<`     | Left shift  | Dịch trái, bỏ bits cao nhất, thêm 0 bên phải. Mỗi shift = ×2                    |
| `>>`     | Right shift | Dịch phải, số dương thêm 0, số âm thêm 1 bên trái, bỏ bits phải. Mỗi shift = ÷2 |

### 1. Bitwise AND (`&`)

**Định nghĩa:** Thực hiện phép AND trên **từng bit** của hai toán hạng.

**Operation rules:**

```javascript
0 & 0 = 0
0 & 1 = 0
1 & 0 = 0
1 & 1 = 1
```

**Tóm tắt:** Kết quả là **1** chỉ khi **cả hai bit đều là 1**; ngược lại kết quả là 0.

**Ví dụ: 3 & 5 = 1**

```
  0000 0011  // 3
& 0000 0101  // 5
= 0000 0001  // 1
```

> **Lưu ý:** Số âm tham gia phép AND dưới dạng **bù 2** (two's complement).

**Ứng dụng thực tế:**

- **(1) Kiểm chẵn/lẻ:** Dựa vào **bit cuối** — 0 = chẵn, 1 = lẻ. Do đó dùng `(i & 1) === 0` thay thế `i % 2 === 0` để kiểm tra số chẵn.
- **(2) Clear (xóa về 0):** Muốn clear bất kỳ cell nào về 0, chỉ cần AND với giá trị mà **tất cả bits là 0** → kết quả luôn là 0.

### 2. Bitwise OR (`|`)

**Định nghĩa:** Thực hiện phép OR trên **từng bit** của hai toán hạng.

**Operation rules:**

```javascript
0 | 0 = 0
0 | 1 = 1
1 | 0 = 1
1 | 1 = 1
```

**Tóm tắt:** Nếu **bất kỳ** một trong hai toán hạng là 1 → giá trị là 1.

**Ví dụ: 3 | 5 = 7**

```
  0000 0011  // 3
| 0000 0101  // 5
= 0000 0111  // 7
```

> **Lưu ý:** Số âm tham gia phép OR dưới dạng **bù 2** (two's complement).

**Ứng dụng thực tế:**

- **(1) Set flags (bật bit):** Dùng OR để **bật** một bit cụ thể mà không ảnh hưởng các bits khác. VD: `permissions |= WRITE_FLAG` → bật quyền write.
- **(2) Floor number (làm tròn xuống):** `x | 0` truncate phần thập phân → tương đương `Math.floor()` cho số dương. VD: `3.7 | 0 === 3`.

### 3. Bitwise XOR (`^`)

**Định nghĩa:** Thực hiện phép XOR (exclusive OR) trên **từng bit** của hai toán hạng.

**Operation rules:**

```javascript
0 ^ 0 = 0
0 ^ 1 = 1
1 ^ 0 = 1
1 ^ 1 = 0
```

**Tóm tắt:** Hai bit **giống nhau** → 0; hai bit **khác nhau** → 1.

**Ví dụ: 3 ^ 5 = 6**

```
  0000 0011  // 3
^ 0000 0101  // 5
= 0000 0110  // 6
```

**Các tính chất quan trọng của XOR:**

- **Giao hoán (Commutative):** `(a ^ b) ^ c === a ^ (b ^ c)`
- **Kết hợp (Associative):** `(a + b) ^ c === a ^ b + b ^ c`
- **Với bất kỳ số x:** `x ^ x = 0`, `x ^ 0 = x`
- **Phản xạ (Reflexivity):** `a ^ b ^ b = a ^ 0 = a`

**Ứng dụng thực tế:**

- **(1) Swap 2 biến không cần temp:** Dùng tính chất phản xạ:

```javascript
let a = 5,
  b = 3;
a = a ^ b; // a = 5 ^ 3 = 6
b = a ^ b; // b = 6 ^ 3 = 5 (b trở thành giá trị cũ của a)
a = a ^ b; // a = 6 ^ 5 = 3 (a trở thành giá trị cũ của b)
// Kết quả: a = 3, b = 5 — đã swap!
```

- **(2) Toggle bit:** XOR với 1 để **đảo** một bit cụ thể. VD: `flags ^= MASK` toggle bit đó.
- **(3) Tìm số unique:** Trong array mà mọi số xuất hiện 2 lần trừ 1 số → XOR tất cả → kết quả = số unique (vì `x ^ x = 0`):

```javascript
function findUnique(arr) {
  return arr.reduce((acc, val) => acc ^ val, 0);
}
findUnique([2, 3, 2, 4, 3]); // 4
```

### 4. Bitwise NOT (`~`)

**Định nghĩa:** Thực hiện phép **đảo bit** (inversion) trên từng bit của toán hạng.

**Operation rules:**

```javascript
~ 1 = 0
~ 0 = 1
```

**Tóm tắt:** Đảo các bits: 0 → 1, 1 → 0. Công thức: `~x = -(x + 1)`.

**Ví dụ: ~6 = -7**

```
  0000 0110   // 6
= 1111 1001   // đảo bit
```

Trong máy tính, số **dương** biểu diễn bằng **mã gốc** (sign-magnitude), số **âm** lưu trữ bằng **bù 2** (two's complement). Đầu tiên xem **bit cao nhất**: `1` = số âm, `0` = số dương. Khi kết quả NOT là số âm → trực tiếp lấy **bù 2** và convert sang decimal:

```
  0000 0110          // 6
= 1111 1001          // đảo bit
  nghịch đảo: 1000 0110
  bù 2:      1000 0111  // = -7
```

**Ứng dụng thực tế:**

- **(1) Floor shortcut `~~x`:** Double NOT = truncate decimal. `~~3.7 === 3`, `~~(-3.7) === -3`. Nhanh hơn `Math.floor()` nhưng **chỉ chính xác với 32-bit integers**.
- **(2) `indexOf` check:** `if (~str.indexOf('x'))` — vì `~(-1) === 0` (falsy), nên `~indexOf` trả falsy khi **không tìm thấy**. Tuy nhiên, ES6+ nên dùng `includes()`.

### 5. Left Shift (`<<`)

**Định nghĩa:** Dịch **tất cả bits** của toán hạng sang **trái** một số vị trí xác định. **Bỏ** các bits cao nhất bên trái, **thêm 0** vào bên phải.

**Ví dụ:** `a = 1010 1110`, `a = a << 2` → dịch trái 2 bits:

```
a = 1010 1110
a << 2 = 1011 1000
```

> Nếu các bits bị bỏ ở phía cao nhất **không chứa 1** → mỗi lần left shift tương đương **nhân** số đó với **2**.

**Ứng dụng thực tế:**

- **Nhân nhanh với lũy thừa của 2:** `x << n` = `x * 2^n`. VD: `5 << 3 === 40` (= 5 × 8). Nhanh hơn phép nhân thông thường ở hardware level.

### 6. Right Shift (`>>`)

**Định nghĩa:** Dịch **tất cả bits** của số sang **phải** một số vị trí xác định. Số **dương** thêm **0** bên trái, số **âm** thêm **1** bên trái. Các bits bên phải bị **bỏ**.

**Ví dụ:** `a = a >> 2` → dịch phải 2 bits, thêm 0 hoặc 1 bên trái tuỳ thuộc số dương hay âm.

> Mỗi lần right shift của toán hạng tương đương **chia** số đó cho **2**.

**Ứng dụng thực tế:**

- **Chia nhanh cho lũy thừa của 2:** `x >> n` = `Math.floor(x / 2^n)`. VD: `100 >> 3 === 12` (= floor(100/8)).
- **Trích xuất color channels:** Trong hex color `0xRRGGBB`, dùng right shift + AND để tách từng channel:

```javascript
const color = 0xff5733; // RGB color
const r = (color >> 16) & 0xff; // 255 (red)
const g = (color >> 8) & 0xff; // 87  (green)
const b = color & 0xff; // 51  (blue)
```

### 7. Unsigned Right Shift (`>>>`)

**Định nghĩa:** Giống Right Shift nhưng **luôn thêm 0** bên trái, bất kể số dương hay âm. Kết quả luôn là **số không âm** (unsigned).

**Khác biệt với `>>`:**

| Operator | Số dương | Số âm            | Sign bit |
| -------- | -------- | ---------------- | -------- |
| `>>`     | Thêm 0   | Thêm 1 (giữ dấu) | Giữ      |
| `>>>`    | Thêm 0   | Thêm 0 (bỏ dấu)  | Không    |

```javascript
(-1 >>
  (1 - // -1  (giữ sign bit = 1)
    1)) >>>
  1; // 2147483647  (tất cả bits = 1, shift phải 1, thêm 0)

// Ứng dụng: convert sang unsigned 32-bit integer
n >>> 0; // đảm bảo n luôn là unsigned 32-bit integer
```

### JS-specific: 32-bit Integer

> **Quan trọng:** JavaScript lưu numbers dưới dạng **64-bit floating point** (IEEE 754). Nhưng khi thực hiện **bitwise operations**, JS tạm convert thành **32-bit signed integer** (two's complement), thực hiện phép tính, rồi convert lại 64-bit. Điều này có nghĩa:

- Bitwise operations chỉ chính xác với integers trong range **-2³¹ đến 2³¹ - 1** (tức ±2,147,483,647)
- Số lớn hơn 32-bit sẽ bị **truncate** → kết quả sai
- `>>>` là ngoại lệ — convert thành **32-bit unsigned integer** (0 đến 2³² - 1)

```javascript
// JS number = 64-bit float, bitwise = 32-bit int
2147483647 | 0; //  2147483647 ✅ (trong range)
2147483648 |
  0(
    // -2147483648 ❌ (overflow 32-bit!)

    // >>> convert sang unsigned
    -1 >>> 0,
  ); //  4294967295 (= 2³² - 1)
```

### Practical Patterns (Ứng dụng thực tế)

**① Bitmask / Flags Pattern:**

Dùng bits riêng lẻ làm **boolean flags** → tiết kiệm memory, xử lý nhanh:

```javascript
// Định nghĩa flags (mỗi flag = 1 bit)
const READ = 0b0001; // 1
const WRITE = 0b0010; // 2
const EXECUTE = 0b0100; // 4
const ADMIN = 0b1000; // 8

let permissions = READ | WRITE; // 0b0011 = 3 (bật READ + WRITE)

// Kiểm tra quyền (AND)
if (permissions & EXECUTE) {
  /* có quyền execute */
}

// Thêm quyền (OR)
permissions |= EXECUTE; // 0b0111 = 7

// Xóa quyền (AND + NOT)
permissions &= ~WRITE; // 0b0101 = 5 (xóa WRITE)

// Toggle quyền (XOR)
permissions ^= ADMIN; // 0b1101 = 13 (bật ADMIN)
permissions ^= ADMIN; // 0b0101 = 5  (tắt ADMIN)
```

> **Use case thực tế:** React dùng bitmask cho **fiber flags** (`Placement | Update | Deletion`), Linux file permissions (`chmod 755`), game engines dùng cho **collision layers**.

**② Round to power of 2:**

```javascript
// Kiểm tra n có phải power of 2 không
function isPowerOf2(n) {
  return n > 0 && (n & (n - 1)) === 0;
}
// Giải thích: power of 2 chỉ có 1 bit = 1
// VD: 8 = 1000, 8-1 = 0111 → 1000 & 0111 = 0000 → true
```

**③ Tính absolute value (giá trị tuyệt đối):**

```javascript
function abs(n) {
  const mask = n >> 31; // 0 nếu dương, -1 (all 1s) nếu âm
  return (n ^ mask) - mask; // đảo bits nếu âm, giữ nguyên nếu dương
}
```

### Tổng hợp ví dụ

```javascript
// AND (&): 3 & 5 = 1
  0000 0011  // 3
& 0000 0101  // 5
= 0000 0001  // 1
// Use: kiểm chẵn/lẻ → (n & 1) === 0 → chẵn
// Use: clear → AND với 0 → kết quả = 0

// OR (|): 3 | 5 = 7
  0000 0011
| 0000 0101
= 0000 0111  // 7

// XOR (^): 3 ^ 5 = 6
  0000 0011
^ 0000 0101
= 0000 0110  // 6
// Properties: a^a=0, a^0=a, a^b^b=a (reflexivity)
// Commutative: (a^b)^c == a^(b^c)

// NOT (~): ~6 = -7
  0000 0110  → đảo → 1111 1001
// Highest bit = 1 → số âm → lấy bù 2:
// Nghịch đảo: 1000 0110 → Bù 2: 1000 0111 = -7

// Left shift (<<): a = 1010 1110, a << 2
// Dịch trái 2 bits, bỏ bits cao nhất, thêm 0 bên phải:
// a = 1011 1000
// Nếu bits bị bỏ không chứa 1 → mỗi left shift = nhân 2

// Right shift (>>): a >> 2
// Dịch phải 2 bits, số dương thêm 0, số âm thêm 1 bên trái
// Mỗi right shift = chia 2
```

### Mã gốc / Nghịch đảo / Bù 2

Ba cách biểu diễn **số có dấu** trong máy tính. Gồm: sign bit + value bits. Sign: 0 = dương, 1 = âm.

**(1) Mã gốc (Sign-magnitude):** Binary trực tiếp. VD: +10 = `0000 1010`

**(2) Nghịch đảo (One's complement):**

- Số dương = giống mã gốc
- Số âm = đảo tất cả bits **TRỪ sign bit**

```
-10: mã gốc  1000 1010
     nghịch đảo 1111 0101
```

**(3) Bù 2 (Two's complement):**

- Số dương = giống mã gốc
- Số âm = nghịch đảo + 1

```
-10: mã gốc  1000 1010
     nghịch đảo 1111 0101
     bù 2    1111 0110  (nghịch đảo + 1)
```

**Tại sao lại dùng Bù 2 (Two's complement)?**

Máy tính chọn bù 2 vì **3 lý do chính**:

1. **Loại bỏ vấn đề +0 và -0:** Mã gốc có 2 cách biểu diễn số 0 (`0000 0000` = +0 và `1000 0000` = -0). Bù 2 chỉ có **1 zero** duy nhất.
2. **Phép cộng/trừ thống nhất:** Với bù 2, CPU chỉ cần **1 mạch cộng** duy nhất cho cả số dương và âm. Máy tính không cần mạch riêng cho phép trừ → `a - b = a + (-b)` hoạt động trực tiếp.
3. **Overflow tự nhiên:** Khi kết quả vượt range → bits tràn ra ngoài tự động bị bỏ → kết quả vẫn đúng trong most cases.

> **Máy tính lưu số âm bằng BÙ 2!** Đây là lý do tại sao hiểu bù 2 là **nền tảng** để hiểu bitwise operations.

---

## 12. arguments Object

`arguments` là **object** có: numeric keys (0, 1, 2...) bắt đầu từ 0 và tăng dần, cùng với các properties như `callee` và `length`.
→ Tương tự array nhưng **KHÔNG có** các methods phổ biến của array như: `forEach`, `map`, `reduce`, `filter`... → gọi là **array-like object**.

**3 cách iterate:**

```javascript
// ① call/apply array methods
function foo() {
  Array.prototype.forEach.call(arguments, (a) => console.log(a));
}

// ② Array.from
function foo() {
  const arrArgs = Array.from(arguments);
  arrArgs.forEach((a) => console.log(a));
}

// ③ Spread operator
function foo() {
  const arrArgs = [...arguments];
  arrArgs.forEach((a) => console.log(a));
}
```

---

## 13. DOM và BOM

- **DOM** (Document Object Model): Coi **document** là một object. Định nghĩa methods và interfaces để **thao tác nội dung** trang web (thêm, xóa, sửa elements, text, attributes...).
- **BOM** (Browser Object Model): Coi **trình duyệt** là một object. Định nghĩa methods và interfaces để **tương tác với browser**. Core = `window` object.

**`window` có vai trò kép (Dual Role):**

1. Là **interface** để JS truy cập browser window.
2. Là **Global Object** (ECMAScript) → mọi object, variable, function định nghĩa trong webpage đều là **property/method** của `window`.

> **Lưu ý:** `document` (DOM root) cũng là **sub-object của BOM's `window`** → DOM nằm trong BOM.

```
window (BOM core — Global Object)
  ├── document  ← DOM root (document là sub-object của BOM!)
  ├── location  ← URL info (hostname, pathname, search...)
  ├── navigator ← browser info (userAgent, platform, language...)
  ├── screen    ← screen info (width, height, colorDepth...)
  └── history   ← navigation history (back, forward, go...)
```

---

## 14. Array-like → Array

(Mở rộng §8) Object có `length` + index properties = array-like. Ví dụ: `arguments`, DOM methods return values. Function params cũng array-like (length = số params nhận được).

Các phương pháp chuyển đổi từ array-like sang array:

**(1)** Gọi `slice` của array bằng `call` để chuyển đổi:

```javascript
Array.prototype.slice.call(arrayLike);
```

**(2)** Gọi `splice` của array để chuyển đổi:

```javascript
Array.prototype.splice.call(arrayLike, 0);
```

**(3)** Gọi `concat` của array bằng `apply` để chuyển đổi:

```javascript
Array.prototype.concat.apply([], arrayLike);
```

**(4)** Dùng `Array.from` để chuyển đổi:

```javascript
Array.from(arrayLike);
```

---

## 15. escape / encodeURI / encodeURIComponent

**Chi tiết từng function:**

- **`encodeURI`** — Escape **toàn bộ URI**. Vì nó encode toàn bộ URI, nên **GIỮ nguyên** các ký tự có **ý nghĩa đặc biệt** trong URI (`:`, `/`, `?`, `#`, `&`...) → chỉ encode các ký tự **không hợp lệ**.
- **`encodeURIComponent`** — Escape **component** (phần) của URI. Vì component có thể chứa các ký tự đặc biệt as data → **encode CẢ** special chars (kể cả `:`, `/`, `?`, `#`, `&`).
- **`escape`** — Chức năng giống `encodeURI`, nhưng khác ở cách xử lý Unicode ≠ 0xff: `escape` đơn giản thêm `%u` trước **Unicode encoding** của ký tự, còn `encodeURI` thì convert sang **UTF-8** trước rồi thêm `%` trước **mỗi byte**.

| Function             | Scope                          | Special chars                                                                                                  |
| -------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `encodeURI`          | Encode **toàn bộ URI**         | **GIỮ** `:`, `/`, `?`, `#`, `&` — vì chúng có **ý nghĩa đặc biệt** trong URI                                   |
| `encodeURIComponent` | Encode **component** của URI   | **Encode CẢ** special chars — vì component có thể chứa data                                                    |
| `escape`             | Giống `encodeURI` về chức năng | Unicode ≠ 0xff: thêm `%u` trước Unicode. `encodeURI` thì convert sang **UTF-8** trước, thêm `%` trước mỗi byte |

---

## 16. AJAX & Promise Wrapper

AJAX = **Asynchronous JavaScript and XML**. Lấy data từ XML document trên server bằng asynchronous JS communication, rồi update tương ứng **không reload** toàn bộ trang.

**4 bước tạo AJAX request:**

1. **Tạo** `XMLHttpRequest` object.
2. **Gọi `open()`** tạo HTTP request. Parameters: request method, request address, whether async, và user authentication info.
3. **Set headers & listeners:** Trước khi send, thêm header info (`setRequestHeader`) và listener functions. Set `onreadystatechange` — XHR có **5 states**. Khi `readyState === 4` → server đã trả data. Kiểm `status` 2xx/304 → success → update page với response data.
4. **Gọi `send(body)`** gửi request. Có thể truyền parameters làm data body.

```javascript
const SERVER_URL = "/server";
let xhr = new XMLHttpRequest();
xhr.open("GET", SERVER_URL, true);

xhr.onreadystatechange = function () {
  if (this.readyState !== 4) return;
  if (this.status === 200) {
    handle(this.response);
  } else {
    console.error(this.statusText);
  }
};
xhr.onerror = function () {
  console.error(this.statusText);
};
xhr.responseType = "json";
xhr.setRequestHeader("Accept", "application/json");
xhr.send(null);
```

**Promise wrapper:**

```javascript
function getJSON(url) {
  let promise = new Promise(function (resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (this.readyState !== 4) return;
      if (this.status === 200) {
        resolve(this.response);
      } else {
        reject(new Error(this.statusText));
      }
    };
    xhr.onerror = function () {
      reject(new Error(this.statusText));
    };
    xhr.responseType = "json";
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send(null);
  });
  return promise;
}
```

---

## 17. Variable Hoisting

Variable hoisting nghĩa là biến dù khai báo ở **đâu** trong function, đều được "nâng" lên đầu function → có thể truy cập **trước khi khai báo** mà không lỗi.

**Nguyên nhân gốc:** JS engine **parse** code trước khi execute → tạo execution context → khởi tạo objects cần thiết. Khi truy cập biến, JS tìm trong scope chain → đầu scope chain trỏ đến **Variable Object** (VO) của execution context hiện tại. VO chứa: function params, tất cả function/variable declarations. VO được tạo **lúc parse**.

**2 giai đoạn khi JS nhận code:**

**① Parsing (pre-compilation):** Kiểm syntax, pre-compile. Tạo Global Execution Context → lấy tất cả variable declarations + function declarations.

- Variables → gán `undefined`
- Functions → declared & usable
- Trước khi function chạy → tạo Function Execution Context (giống Global nhưng thêm `this`, `arguments`, params)

```
Global context:  variable definitions, function declarations
Function context: variable definitions, function declarations, this, arguments
```

**② Execution:** Chạy code tuần tự theo thứ tự.

**Tại sao cần hoisting? 2 lý do:**

**(1) Improve performance:** Syntax check + pre-compilation chỉ thực hiện **1 lần**.

- Không có pre-compilation → mỗi lần execute phải **parse lại** để xác định biến/functions — **không cần thiết** vì code không thay đổi.
- Pre-compilation: xác định biến/functions + **compress code** (xóa comments, whitespace) → generated pre-compiled code cho mỗi function.
- Lợi ích: Mỗi lần function execute → **allocate stack space trực tiếp** (không cần parse lại) + code đã compress nên **chạy nhanh hơn**.

**(2) Better fault tolerance:**

Variable hoisting giúp **tăng khả năng chịu lỗi** của JavaScript:

```javascript
a = 1;
var a;
console.log(a); // 1 — chạy đúng nhờ hoisting!
```

Nếu không có hoisting, hai dòng code trên sẽ **báo lỗi**. Nhưng nhờ hoisting, code vẫn execute đúng. Trong thực tế, khi code rất **phức tạp**, developer có thể vô tình sử dụng biến **trước khi định nghĩa** — nhờ hoisting mà code vẫn chạy bình thường, **không ảnh hưởng** tới normal usage.

**Tóm tắt:**

- Declaration hoisting khi parse → pre-allocate stack space → **tăng performance** (function chỉ cần allocate space khi execute, không cần parse lại)
- Cho phép non-standard code chạy đúng → **tăng fault tolerance** (dù code phức tạp, vô tình dùng trước khi định nghĩa vẫn chạy bình thường)

**Vấn đề của hoisting — Lý do ES6 thêm `let`/`const`:**

```javascript
// Vấn đề 1: Variable shadowing
var tmp = new Date();
function fn() {
  console.log(tmp);
  if (false) {
    var tmp = "hello world"; // hoisted → shadow outer tmp
  }
}
fn(); // undefined (không phải Date!)

// Vấn đề 2: Scope leakage
var tmp = "hello world";
for (var i = 0; i < tmp.length; i++) {
  console.log(tmp[i]);
}
console.log(i); // 11 — i bị hoist thành global, không bị destroy!
```

---

## 18. Tail Call Optimization

**Tail call** = function gọi function khác là **bước cuối cùng** của nó.

Code chạy dựa trên execution stack. Khi function A gọi function B → giữ context A (bảo tồn execution context hiện tại), tạo context B push vào stack. Với tail call, vì đã là bước cuối → **không cần giữ** context A (không cần bảo tồn execution context hiện tại) → tiết kiệm memory = **tail call optimization**.

> ⚠️ ES6 tail call optimization chỉ hoạt động trong **strict mode**. Normal mode không có hiệu lực.

---

## 19. ES6 Modules vs CommonJS

**Khác biệt:**

| Tiêu chí       | CommonJS                      | ES6 Module                          |
| -------------- | ----------------------------- | ----------------------------------- |
| Copy type      | **Shallow copy** (value copy) | **Reference** (binding)             |
| Mutability     | Reassign được (đổi pointer)   | **Read-only** (đổi = compile error) |
| Internal props | Đổi internal props ✅         | Đổi internal props ✅               |
| Load timing    | **Runtime** (synchronous)     | **Compile time** (static)           |
| `this`         | `this` = current module       | `this` = `undefined`                |
| Circular deps  | Trả về **đã execute** phần    | Live bindings                       |

**Giống nhau:**

- Cả hai đều cho phép gán giá trị cho internal properties của imported objects (modify nội bộ).

**Giải thích `import` read-only:**

> `import` interface là **read-only** → không thể đổi **pointer** (giống như `const`). Nghĩa là không thể thay đổi **con trỏ** của biến. Nhưng **có thể** đổi internal pointer — tức là modify properties bên trong object. Bạn có thể **gán giá trị** cho các properties của imported objects trong CommonJS, và việc gán giá trị cho các properties của imported ES6 Module objects cũng hoạt động tương tự.
>
> CommonJS cho phép **reassign** (thay đổi pointer chỉ đến value khác), nhưng ES6 Module **sẽ báo lỗi compile** khi reassign.

---

## 20. DOM Operations — CRUD

Các API để lấy, tạo, xóa và sửa DOM nodes:

### 1) GET — Lấy DOM nodes

APIs lấy DOM nodes và cách sử dụng:

```javascript
getElementById; // theo id
getElementsByTagName; // theo tag name
getElementsByClassName; // theo class name
querySelectorAll; // theo CSS selector

// Ví dụ:
var imooc = document.getElementById("imooc");
var pList = document.getElementsByTagName("p");
var moocList = document.getElementsByClassName("mooc");
var pList = document.querySelectorAll(".mooc");
```

### 2) CREATE — Tạo DOM nodes

```html
<div id="container">
  <h1 id="title">我是标题</h1>
</div>
```

```javascript
// Thêm <span> sau #title
var container = document.getElementById("container");
var targetSpan = document.createElement("span");
targetSpan.innerHTML = "hello world";
container.appendChild(targetSpan);
```

### 3) DELETE — Xóa DOM nodes

```javascript
// Cách 1: getElementById
var container = document.getElementById("container");
var targetNode = document.getElementById("title");
container.removeChild(targetNode);

// Cách 2: childNodes
var container = document.getElementById("container");
var targetNode = container.childNodes[1];
container.removeChild(targetNode);
```

### 4) MODIFY — Sửa DOM elements

Sửa đổi DOM elements có nhiều chiều (dimensions): **di chuyển vị trí** elements, **sửa attributes** của DOM elements, **thay đổi style**, **thay đổi content**... Ví dụ dưới swap vị trí 2 elements bằng `insertBefore` hoặc `appendChild`:

```html
<div id="container">
  <h1 id="title">我是标题</h1>
  <p id="content">我是内容</p>
</div>
```

```javascript
var container = document.getElementById("container");
var title = document.getElementById("title");
var content = document.getElementById("content");
// Đổi chỗ: đặt content trước title
container.insertBefore(content, title);
```

---

## 21. use strict

`"use strict"` — strict mode (được gọi là **extension mode**) được thêm trong ECMAScript 5, buộc JS chạy dưới điều kiện nghiêm ngặt hơn.

**4 Mục đích (đặt nền tảng cho future JS):**

1. Loại bỏ **illogical & imprecise** syntax — giảm các hành vi kỳ lạ của JS
2. Loại bỏ **unsafe** code execution — đảm bảo code security
3. Tăng **compiler efficiency** — tăng tốc thực thi vì compiler có thể optimize tốt hơn
4. Đặt nền tảng cho **future versions** của JavaScript

**Khác biệt khi dùng strict mode (so với normal mode):**

- ❌ Cấm `with` statement (làm code khó predict)
- ❌ `this` **KHÔNG** refer đến global object (thành `undefined`) — tránh vô tình modify global
- ❌ Object không được có **duplicate property names** — bắt lỗi sớm
- ❌ Biến phải khai báo trước khi dùng (không có implicit global) — tránh typo tạo global var
- ❌ `eval` không được tạo biến trong surrounding scope
- ❌ `delete` không được xóa variables, functions hoặc function arguments
- ❌ `arguments` và `eval` không thể được reassign

---

## 22. Kiểm tra Object thuộc Class

**3 cách xác định:**

- **Cách 1 — `instanceof`:** Kiểm tra xem `constructor.prototype` có xuất hiện **bất kỳ đâu** trong prototype chain của object không.
- **Cách 2 — `obj.constructor`:** Trỏ đến constructor function của object. Tuy nhiên, **không an toàn** vì constructor property có thể bị **overridden** (ghi đè).
- **Cách 3 — `Object.prototype.toString.call(obj)`:** In ra `[[Class]]` property của object. Đây là cách **chính xác nhất** cho built-in reference types.

| Cách | Method                                | Lưu ý                                                                              |
| ---- | ------------------------------------- | ---------------------------------------------------------------------------------- |
| ①    | `instanceof`                          | Kiểm constructor.prototype có trong prototype chain không                          |
| ②    | `obj.constructor`                     | Trỏ đến constructor function. **Không an toàn** — constructor có thể bị overridden |
| ③    | `Object.prototype.toString.call(obj)` | In `[[Class]]` property. **Chính xác nhất** cho built-in types                     |

```javascript
[] instanceof Array                        // true
[].constructor === Array                   // true
Object.prototype.toString.call([])         // "[object Array]"
```

---

## 23. Strong vs Weak Typing

**Strongly typed language** (ngôn ngữ kiểu mạnh):

- Luôn **enforce type definitions** — biến phải khai báo đúng type trước khi dùng.
- Khi đã gán type cho biến → biến **mãi mãi** giữ type đó, trừ khi **explicit cast**.
- Ví dụ: nếu có integer, muốn dùng như string phải **cast rõ ràng**.
- Ngôn ngữ: **Java, C++, C#**.

**Weakly typed language** (ngôn ngữ kiểu yếu):

- Variable type có thể bị **ignore** hoặc **tự động convert**.
- **Implicit type coercion** xảy ra khi cần — `'12' + 3 = '123'`.
- Ngôn ngữ: **JavaScript, Python, PHP**.

| Tiêu chí   | Strongly Typed                                                      | Weakly Typed                           |
| ---------- | ------------------------------------------------------------------- | -------------------------------------- |
| Định nghĩa | Bắt buộc tuân thủ type definitions. Biến phải define trước khi dùng | Type có thể bị **ignore**              |
| Ví dụ      | Java, C++                                                           | JavaScript, Python                     |
| Type cast  | Phải **explicit cast** (int → string)                               | **Implicit cast** (`'12' + 3 = '123'`) |
| Ưu điểm    | Rigorous → **ít lỗi** hơn                                           | Linh hoạt, nhanh hơn                   |
| Nhược điểm | Chậm hơn một chút                                                   | Dễ gặp type errors                     |

> **So sánh:** Strongly typed chạy chậm hơn một chút so với weakly typed, nhưng sự chặt chẽ (**rigor**) của strongly typed giúp **tránh nhiều lỗi hơn** một cách hiệu quả trong production.

---

## 24. Compiled vs Interpreted Languages

|                 | Interpreted                                                  | Compiled                                                         |
| --------------- | ------------------------------------------------------------ | ---------------------------------------------------------------- |
| Cách hoạt động  | Interpreter dịch **từng dòng** → machine code → execute ngay | Compiler dịch **toàn bộ** → machine code file (.exe) → chạy file |
| Pre-compilation | ❌ Không cần                                                 | ✅ Cần compile trước                                             |
| Performance     | Chậm hơn (dịch mỗi lần chạy)                                 | Nhanh hơn (compile 1 lần)                                        |
| Portability     | ✅ Cross-platform (cần interpreter)                          | ❌ Platform-specific                                             |
| Ví dụ           | **JavaScript**, Python                                       | C, C++                                                           |

**Đặc điểm Interpreted Language:**

- ❌ Cần interpret mỗi lần chạy → **hiệu suất thấp hơn**
- ✅ Chỉ cần interpreter trên platform → **dễ port** source code
- Ví dụ: JavaScript, Python

**Đặc điểm Compiled Language:**

- ✅ Compile **1 lần** thành machine code → chạy trực tiếp → **hiệu suất cao**
- ❌ Compile cho platform cụ thể → **không dễ port** sang platform khác
- Ví dụ: C, C++

> **Tóm lại:** Compiled chạy nhanh hơn, Interpreted dễ port hơn. Sự khác biệt chính: interpreted có thể chạy trên platform ngay sau khi source code được compile, còn compiled được compile **trong quá trình runtime**. Do đó, compiled chạy **nhanh hơn**, còn interpreted có **khả năng cross-platform tốt hơn**. JS là interpreted language — source code được interpreted tại runtime bởi JS engine.

---

## 25. for...in vs for...of

`for...of` — ES6 mới, iterate qua data structures có **iterator interface** (arrays, objects, strings, Sets, Maps...) và trả về **values** của từng item.

**Khác biệt chi tiết:**

- `for...of` duyệt objects và lấy **key values**, còn `for...in` lấy **key names**.
- `for...in` duyệt **toàn bộ prototype chain** của object → **chậm, không khuyến khích**. `for...of` chỉ duyệt **current object**, không duyệt prototype chain.
- Với arrays: `for...in` trả **tất cả enumerable properties** (kể cả trên prototype chain), `for...of` chỉ trả **array index values**.

| Tiêu chí        | `for...in` (ES3)                              | `for...of` (ES6)                            |
| --------------- | --------------------------------------------- | ------------------------------------------- |
| Trả về          | **Key names**                                 | **Key values**                              |
| Prototype chain | Duyệt **CẢ** prototype chain (chậm!)          | Chỉ duyệt **current object**                |
| Array           | Trả tất cả enumerable props (kể cả prototype) | Chỉ trả **array index values**              |
| Thiết kế cho    | **Objects**                                   | **Arrays**, strings, Sets, Maps, Generators |

> **Tóm lại:** `for...in` chủ yếu thiết kế cho iterating **objects**, không phù hợp cho arrays. `for...of` có thể dùng cho **arrays, array-like objects, strings, Sets, Maps, Generator objects**.

---

## 26. for...of duyệt Object

`for...of` là phương pháp duyệt mới trong ES6, cho phép iterate qua data structures có **iterator interface** và return values của từng item. Tuy nhiên, dùng `for...of` với **ordinary object** sẽ gây **TypeError** vì object thường không có `Symbol.iterator` property.

**3 cách giải quyết:**

**(1) Nếu object là array-like → dùng `Array.from` convert:**

```javascript
var obj = { 0: "one", 1: "two", length: 2 };
obj = Array.from(obj);
for (var k of obj) {
  console.log(k); // 'one', 'two'
}
```

**(2) Thêm `Symbol.iterator` thủ công vào object:**

Nếu object không phải array-like, có thể thêm một `[Symbol.iterator]` property và point nó đến một iterator:

```javascript
var obj = { a: 1, b: 2, c: 3 };

obj[Symbol.iterator] = function () {
  var keys = Object.keys(this);
  var count = 0;
  return {
    next() {
      if (count < keys.length) {
        return { value: obj[keys[count++]], done: false };
      } else {
        return { value: undefined, done: true };
      }
    },
  };
};

for (var k of obj) {
  console.log(k); // 1, 2, 3
}
```

**(3) Generator function:**

```javascript
var obj = { a: 1, b: 2, c: 3 };
obj[Symbol.iterator] = function* () {
  var keys = Object.keys(obj);
  for (var k of keys) {
    yield [k, obj[k]];
  }
};

for (var [k, v] of obj) {
  console.log(k, v); // a 1, b 2, c 3
}
```

---

## 27. AJAX vs Fetch vs Axios

### (1) AJAX (XMLHttpRequest)

AJAX = **Asynchronous JavaScript and XML** — web dev technique cho interactive web apps. Là technology cho phép **update một phần** webpage mà **không reload** toàn bộ trang. Bằng cách exchange **lượng data nhỏ** với server **ở background**, AJAX cho phép **asynchronous updates**. Điều này nghĩa là có thể update **một phần** webpage mà không cần reload toàn bộ. **Traditional webpages** (không có AJAX) phải **reload toàn bộ trang** để update content.

**Nhược điểm:**

- Thiết kế cho **MVC**, không phù hợp **MVVM** hiện tại (front-end trend)
- XHR architecture bản thân **không rõ ràng**
- Không tuân thủ **separation of concerns** (SoC)
- Config & invoke **rất rối**, event-based async model **khó dùng và khó đọc**

### (2) Fetch

Fetch được quảng bá là **thay thế AJAX**. Xuất hiện trong ES6, dựa trên **Promise**. **Không dùng** XMLHttpRequest — là native JavaScript hoàn toàn.

**Ưu điểm:**

- ✅ Syntax **gọn gàng, semantic** hơn XHR rất nhiều
- ✅ Dựa trên **Promise** chuẩn → hỗ trợ `async/await`
- ✅ Cung cấp **rich API** (Request, Response, Headers objects)
- ✅ Tách khỏi XHR — là implementation mới trong **ES specification**

**Nhược điểm:**

- ❌ **400/500 → vẫn coi là success!** Chỉ reject khi **network error** hoặc request bị prevent hoàn toàn
- ❌ Không tự kèm **cookies** → cần set `credentials: 'include'` thủ công
- ❌ Không hỗ trợ **abort/timeout** natively. `setTimeout` + `Promise.reject` chỉ cancel Promise, **request vẫn chạy** ở background → **lãng phí bandwidth**
- ❌ Không natively **monitor request progress** (XHR có `onprogress`)

### (3) Axios

HTTP client dựa trên Promise. Hoạt động cả **browser** (tạo XMLHttpRequest) và **Node.js** (tạo http request).

**Features đầy đủ:**

- ✅ **Promise API** chuẩn
- ✅ **Intercept** request/response (middleware pattern)
- ✅ **Transform** request/response data
- ✅ **Cancel request** (`CancelToken`)
- ✅ **Auto JSON conversion** — tự parse response
- ✅ **XSRF protection** (client-side)
- ✅ **Monitor progress** — tracking upload/download
- ✅ Chạy trên cả **browser + Node.js**

### So sánh tổng hợp

| Tiêu chí      | AJAX (XHR)            | Fetch             | Axios          |
| ------------- | --------------------- | ----------------- | -------------- |
| Paradigm      | MVC, event-based      | Promise-based     | Promise-based  |
| Error 4xx/5xx | Handle trong callback | **Không reject**  | Auto reject    |
| Cookies       | Tự kèm                | Cần config        | Tự kèm         |
| Abort         | `xhr.abort()`         | `AbortController` | `CancelToken`  |
| Progress      | ✅ `onprogress`       | ❌                | ✅             |
| Interceptors  | ❌                    | ❌                | ✅             |
| Platform      | Browser only          | Browser only      | Browser + Node |
| JSON parse    | Manual                | Manual            | ✅ Auto        |

---

## 28. Array Iteration Methods

**Chi tiết từng method:**

- **`forEach()`** — Không trả về giá trị, chỉ execute function trên mỗi element. Có thể modify original array.
- **`map()`** — Trả về **new array** với các values đã được transform. Hỗ trợ **chaining**.
- **`filter()`** — Trả về array chứa các elements **thoả điều kiện**. Chainable.
- **`for...of`** — Duyệt objects có **Iterator** interface và trả **values**. Không duyệt ordinary `obj`. Convert async loop thành sync loop.
- **`every()`** — Return `false` ngay khi gặp **bất kỳ element nào** là false.
- **`some()`** — Return `true` ngay khi gặp **bất kỳ element nào** là true.
- **`find()`** — Return **giá trị đầu tiên** match điều kiện.
- **`findIndex()`** — Return **index đầu tiên** match điều kiện.
- **`reduce()`** — Accumulate array theo thứ tự **ascending** (trái → phải).
- **`reduceRight()`** — Accumulate array theo thứ tự **descending** (phải → trái).

| Method          | Đổi gốc? | Đặc điểm                                                      |
| --------------- | -------- | ------------------------------------------------------------- |
| `forEach()`     | Không    | Không return value. Duyệt từng phần tử                        |
| `map()`         | Không    | **Có return** new array. Chainable                            |
| `filter()`      | Không    | Return array các phần tử thoả điều kiện. Chainable            |
| `for...of`      | Không    | Duyệt Iterator properties, trả values. Không duyệt obj thường |
| `every()`       | Không    | Return `false` nếu **bất kỳ** phần tử false                   |
| `some()`        | Không    | Return `true` nếu **bất kỳ** phần tử true                     |
| `find()`        | Không    | Return **first value** match                                  |
| `findIndex()`   | Không    | Return **first index** match                                  |
| `reduce()`      | Không    | Accumulate ascending order                                    |
| `reduceRight()` | Không    | Accumulate descending order                                   |

---

## 29. forEach vs map

Hai methods đều dùng để duyệt arrays, nhưng khác biệt rất rõ:

- **`forEach()`:** Execute function trên mỗi element. Thao tác trực tiếp lên data sẽ **modify original array**. **Không có return value** (`undefined`).
- **`map()`:** **Không** thay đổi values của original array. Return **new array** với các values đã được gọi lại qua function.

|                 | `forEach()`                    | `map()`                     |
| --------------- | ------------------------------ | --------------------------- |
| Return value    | **Không có** (`undefined`)     | **New array**               |
| Modify original | Có thể modify trực tiếp        | **Không** thay đổi original |
| Chainable       | ❌                             | ✅                          |
| Use case        | Side effects (log, DOM update) | Transform data              |

```javascript
// forEach: no return, can modify original
[1, 2, 3].forEach((val, i, arr) => {
  arr[i] = val * 2;
});

// map: returns new array, original unchanged
const doubled = [1, 2, 3].map((val) => val * 2); // [2,4,6]
```

---

# PHẦN IV — PROTOTYPE & PROTOTYPE CHAIN

---

## 30. Prototype & Prototype Chain

Trong JavaScript, **constructor functions** tạo objects. Mỗi constructor có `prototype` property → value là object chứa properties/methods **shared** giữa tất cả instances của constructor đó.

Khi tạo object bằng constructor → object chứa **pointer** trỏ đến constructor's `prototype`. Trong ES5, con trỏ này = **prototype của object**. Thông thường, giá trị này **không nên truy cập trực tiếp**, nhưng các browsers hiện nay implement `__proto__` property để truy cập nó.

- Browsers implement `__proto__` để truy cập (nhưng **không nên dùng** — không được định nghĩa rõ ràng trong spec và **best practice** là tránh sử dụng property này)
- ES5 thêm `Object.getPrototypeOf()` để lấy prototype chính thức — đây là cách được **khuyến khích**

**Prototype Chain (Chuỗi Prototype):**

Khi truy cập property của object:

1. Tìm trong **chính object** đó
2. Không có → tìm trong **prototype object** của nó
3. Prototype cũng có prototype riêng → tiếp tục tìm lên
4. … Cuối prototype chain = **`Object.prototype`**
5. `Object.prototype.__proto__ === null` → **END of chain**

Đó là lý do objects mới tạo dùng được `toString()`, `valueOf()` — chúng được thừa kế từ `Object.prototype` qua prototype chain.

**Đặc điểm quan trọng:**

- JS objects truyền **by reference** → object mới **KHÔNG có bản sao riêng** của prototype.
- Khi prototype bị modify → **TẤT CẢ related objects** tự động inherit sự thay đổi.
- Đây là cơ chế **inheritance cơ bản** của JavaScript (khác với Classical inheritance của Java/C++).

```
instance.__proto__ === Constructor.prototype
Constructor.prototype.__proto__ === Object.prototype
Object.prototype.__proto__ === null   ← END of chain

// Lookup flow:
instance.prop → Constructor.prototype.prop → Object.prototype.prop → undefined
```

---

## 31. Prototype Modification vs Rewriting

### Modification (thêm method vào prototype):

```javascript
function Person(name) {
  this.name = name;
}
// Sửa prototype — THÊM method
Person.prototype.getName = function () {};
var p = new Person("hello");
console.log(p.__proto__ === Person.prototype); // true
console.log(p.__proto__ === p.constructor.prototype); // true ✅
```

### Rewriting (gán lại toàn bộ prototype):

```javascript
// GHI ĐÈ prototype — gán object mới
Person.prototype = {
  getName: function () {},
};
var p = new Person("hello");
console.log(p.__proto__ === Person.prototype); // true
console.log(p.__proto__ === p.constructor.prototype); // false ❌
```

**Tại sao false?** Khi gán object literal cho `Person.prototype` → constructor của object literal này mặc định trỏ đến root constructor `Object`. Vì vậy `p.constructor === Object` chứ không phải `Person`. Nghĩa là khi **rewrite prototype**, constructor link bị **đứt gãy** — cần phải **manually fix** bằng cách trỏ lại.

**Fix — trỏ lại constructor:**

```javascript
Person.prototype = {
  getName: function () {},
};
var p = new Person("hello");
p.constructor = Person; // ← fix constructor link
console.log(p.__proto__ === Person.prototype); // true
console.log(p.__proto__ === p.constructor.prototype); // true ✅
```

---

## 32. Prototype Chain — Các Pointer References

Hiểu rõ **chuỗi pointer** giúp trace prototype chain chính xác trong debugging và interview:

```javascript
function Person(name) {
  this.name = name;
}
Person.prototype.sayHello = function () {
  return `Hi, I'm ${this.name}`;
};

var p = new Person("Alice");
```

**Bảng tra cứu pointer — từ instance đến null:**

```javascript
// ① Instance → Constructor.prototype
p.__proto__; // Person.prototype
p.__proto__ === Person.prototype; // true ✅

// ② Constructor.prototype → Object.prototype
Person.prototype.__proto__; // Object.prototype
Person.prototype.__proto__ === Object.prototype; // true ✅

// ③ Instance 2 bước lên → Object.prototype
p.__proto__.__proto__; // Object.prototype
p.__proto__.__proto__ === Object.prototype; // true ✅

// ④ Qua constructor.prototype rồi lên tiếp
p.__proto__.constructor.prototype.__proto__; // Object.prototype
Person.prototype.constructor.prototype.__proto__; // Object.prototype

// ⑤ Constructor pointers
p.__proto__.constructor; // Person (function)
Person.prototype.constructor; // Person (function)
Person.prototype.constructor === Person; // true ✅
```

**Sơ đồ lookup hoàn chỉnh:**

```
p (instance)
 └── __proto__ ──→ Person.prototype
                      ├── sayHello: ƒ
                      ├── constructor ──→ Person (function)
                      └── __proto__ ──→ Object.prototype
                                           ├── toString: ƒ
                                           ├── valueOf: ƒ
                                           ├── hasOwnProperty: ƒ
                                           ├── constructor ──→ Object (function)
                                           └── __proto__ ──→ null  ← END
```

> **Key insight:** `__proto__` là **link thực tế** giữa instance và prototype, còn `constructor` là **link ngược** từ prototype về function tạo ra nó. Khi ghi đè prototype (rewriting), `constructor` link bị mất — nhưng `__proto__` link vẫn đúng.

---

## 33. Endpoint — Prototype Chain kết thúc ở đâu?

**Trả lời:** Prototype chain kết thúc tại `null`. Cụ thể:

```javascript
Object.prototype.__proto__ === null; // true ← ENDPOINT
```

**Lý giải chi tiết:**

1. `Object` là **constructor function** → tất cả objects đều được construct bởi `Object` (trực tiếp hoặc gián tiếp)
2. Tất cả prototypes trên chain đều là **objects** → chúng đều kết nối đến `Object.prototype`
3. `Object.prototype` là **prototype cuối cùng** — nó **không có** prototype level cao hơn
4. `Object.prototype.__proto__` trả về `null` → đánh dấu **END of chain**

**Verify bằng code:**

```javascript
// In ra endpoint
console.log(Object.prototype.__proto__); // null

// Chứng minh chain kết thúc
function Foo() {}
var f = new Foo();

console.log(f.__proto__); // Foo.prototype
console.log(f.__proto__.__proto__); // Object.prototype
console.log(f.__proto__.__proto__.__proto__); // null ← END!

// Tất cả objects đều kết thúc ở null
console.log([].__proto__.__proto__.__proto__); // null (Array → Object → null)
console.log("".__proto__.__proto__.__proto__); // null (String → Object → null)
```

**Tại sao lại là `null` chứ không phải `undefined`?**

`null` biểu diễn **"intentional absence of value"** — tức là **cố tình** không có gì. Chain kết thúc tại `null` vì prototype tiếp theo **không tồn tại by design**, khác với `undefined` (chưa gán giá trị). Đây là quyết định thiết kế ban đầu của JavaScript.

**Toàn bộ chain với Built-in Types:**

```
// Function → Object → null
Function.prototype.__proto__ === Object.prototype  // true
Object.prototype.__proto__ === null                // true

// Array → Object → null
Array.prototype.__proto__ === Object.prototype     // true

// Quan hệ đặc biệt: Object bản thân nó cũng là Function!
Object.__proto__ === Function.prototype            // true
Function.__proto__ === Function.prototype          // true (Function tạo ra chính mình!)
Function.prototype.__proto__ === Object.prototype  // true
```

---

## 34. Truy cập Own Properties — hasOwnProperty

Khi duyệt object bằng `for...in`, nó sẽ duyệt **CẢ prototype chain** — bao gồm cả properties được thừa kế. Để chỉ lấy properties **trực tiếp thuộc object** (không phải từ prototype chain), ta dùng `hasOwnProperty()`.

### Tại sao cần hasOwnProperty?

```javascript
function Person(name, age) {
  this.name = name;
  this.age = age;
}
Person.prototype.greet = function () {
  return `Hi, I'm ${this.name}`;
};

var p = new Person("Alice", 25);

// ❌ for...in duyệt cả prototype chain
for (var key in p) {
  console.log(key);
  // "name"  ← own property ✅
  // "age"   ← own property ✅
  // "greet" ← prototype property ⚠️ (thường không mong muốn!)
}

// ✅ Dùng hasOwnProperty để filter
for (var key in p) {
  if (p.hasOwnProperty(key)) {
    console.log(key);
    // "name"  ← own property ✅
    // "age"   ← own property ✅
    // (greet bị loại bỏ vì nó trên prototype, không phải own property)
  }
}
```

### Utility function — Iterate chỉ own properties:

```javascript
function iterate(obj) {
  var res = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      res.push(key + ": " + obj[key]);
    }
  }
  return res;
}

// Usage
var person = new Person("Bob", 30);
console.log(iterate(person));
// ["name: Bob", "age: 30"] — chỉ own properties!
```

### Các cách khác để lấy own properties:

```javascript
var p = new Person("Alice", 25);

// ① Object.keys() — chỉ own ENUMERABLE properties
Object.keys(p); // ["name", "age"]

// ② Object.getOwnPropertyNames() — own properties KỂ CẢ non-enumerable
Object.getOwnPropertyNames(p); // ["name", "age"]

// ③ Object.entries() (ES2017) — own enumerable key-value pairs
Object.entries(p); // [["name", "Alice"], ["age", 25]]

// ④ Object.hasOwn() (ES2022) — thay thế hasOwnProperty, an toàn hơn
Object.hasOwn(p, "name"); // true
Object.hasOwn(p, "greet"); // false
```

**Tại sao `Object.hasOwn()` an toàn hơn `hasOwnProperty()`?**

```javascript
// ⚠️ Object.create(null) không có prototype → không có hasOwnProperty
var obj = Object.create(null);
obj.name = "test";
// obj.hasOwnProperty("name"); // ❌ TypeError: obj.hasOwnProperty is not a function

// ✅ Object.hasOwn() hoạt động với mọi object
Object.hasOwn(obj, "name"); // true ← an toàn!
```

| Method                         | Own only? | Enumerable only? | ES version |
| ------------------------------ | --------- | ---------------- | ---------- |
| `for...in`                     | ❌        | ✅               | ES1        |
| `hasOwnProperty()`             | ✅        | N/A (check only) | ES3        |
| `Object.keys()`                | ✅        | ✅               | ES5        |
| `Object.getOwnPropertyNames()` | ✅        | ❌ (bao gồm cả)  | ES5        |
| `Object.entries()`             | ✅        | ✅               | ES2017     |
| `Object.hasOwn()`              | ✅        | N/A (check only) | ES2022     |

---

## 35. Câu Hỏi Phỏng Vấn

### Q1: `new` operator làm gì bên trong?

**A:** 4 bước: (1) Tạo object rỗng (2) Gán prototype = constructor.prototype (3) Gán this = object mới, chạy constructor (4) Nếu return value type → trả object tạo ra; nếu return reference type → trả reference đó.

---

### Q2: Map vs WeakMap — khi nào dùng WeakMap?

**A:** Dùng WeakMap khi cần lưu metadata gắn với object mà **KHÔNG muốn ngăn GC**. Ví dụ: DOM node metadata (node remove → entry tự clean), private data cho class instances, caching mà auto-cleanup.

---

### Q3: Variable hoisting gây vấn đề gì? Cách khắc phục?

**A:** 2 vấn đề chính: (1) **Variable shadowing** — biến bên trong function shadow biến ngoài do hoisting. (2) **Scope leakage** — `var` trong for loop bị hoist thành global. **Khắc phục:** dùng `let`/`const` (block-scoped, có TDZ).

---

### Q4: Tail call optimization là gì?

**A:** Khi function call function khác là **bước cuối** → không cần giữ execution context hiện tại → tiết kiệm memory. Chỉ hoạt động trong **strict mode** (ES6).

---

### Q5: ES6 Module vs CommonJS — khác biệt cốt lõi?

**A:** CommonJS = **shallow copy** (runtime, sync). ES6 Module = **reference/binding** (compile time, read-only). CommonJS cho phép reassign, ES6 Module thì compile error khi reassign.

---

### Q6: `for...in` vs `for...of` — khi nào dùng cái nào?

**A:** `for...in` → duyệt **key names** + cả prototype chain → dùng cho **objects**. `for...of` → duyệt **key values** + chỉ current object → dùng cho **arrays, strings, Maps, Sets, Generators**.

---

### Q7: Fetch có nhược điểm gì so với Axios?

**A:** (1) 400/500 không reject — coi là success. (2) Không tự kèm cookies. (3) Không hỗ trợ abort/timeout natively. (4) Không monitor request progress. Axios xử lý tất cả điểm này tốt hơn + có interceptors.

---

### Q8: Prototype chain kết thúc ở đâu? Giải thích cơ chế lookup.

**A:** Kết thúc ở `Object.prototype.__proto__ === null`. Lookup: truy cập property → tìm trong object → không có → tìm trong `__proto__` (prototype) → tiếp tục lên chain → đến `Object.prototype` → không có → return `undefined`.

---

### Q9: Prototype modification vs rewriting — khác biệt cốt lõi?

**A:** **Modification** = thêm/sửa properties trên prototype hiện tại → `constructor` link **vẫn đúng**. **Rewriting** = gán object mới cho `.prototype` → `constructor` link bị **đứt** (trỏ về `Object`). Fix bằng cách thêm `constructor: Person` vào object mới, hoặc dùng `Object.defineProperty` để set constructor non-enumerable.

---

### Q10: `__proto__` vs `prototype` — khác nhau thế nào?

**A:** `prototype` là property của **function** — chỉ functions mới có (dùng khi `new`). `__proto__` là property của **mọi object** — trỏ đến prototype mà object được tạo từ. Quan hệ: `instance.__proto__ === Constructor.prototype`. Nên dùng `Object.getPrototypeOf()` thay vì `__proto__`.

---

### Q11: Tại sao `Object.hasOwn()` an toàn hơn `hasOwnProperty()`?

**A:** `hasOwnProperty()` gọi trên instance → object được tạo bằng `Object.create(null)` không có method này (TypeError). `Object.hasOwn()` (ES2022) là **static method** → hoạt động với mọi object, kể cả object không có prototype.

---

### Q12: `Function.prototype.__proto__` trỏ về đâu? Tại sao?

**A:** `Function.prototype.__proto__ === Object.prototype // true`. Tất cả prototypes đều là objects → chúng kế thừa từ `Object.prototype`. Điều thú vị: `Object.__proto__ === Function.prototype` — Object bản thân cũng là function, tạo ra quan hệ **circular dependency** giữa Function và Object.

---

### Q13: Khi nào property lookup trả về `undefined`?

**A:** Khi property **không tồn tại** ở bất kỳ đâu trên prototype chain — tìm từ instance → lên prototype → lên `Object.prototype` → chain kết thúc ở `null` → return `undefined`. Hoặc khi property tồn tại nhưng **giá trị là `undefined`** — dùng `in` operator hoặc `hasOwnProperty()` để phân biệt.

---

### Q14: Có bao nhiêu cách lấy own properties của object? So sánh.

**A:** 4 cách chính: (1) `hasOwnProperty()` — check từng key, cần dùng trong `for...in`. (2) `Object.keys()` — chỉ enumerable. (3) `Object.getOwnPropertyNames()` — bao gồm cả non-enumerable. (4) `Object.hasOwn()` (ES2022) — an toàn hơn `hasOwnProperty()`, hoạt động với `Object.create(null)`.

---

> 📖 Nguồn tham khảo: [CUGGZ — JavaScript 基础知识总结](https://juejin.cn/post/6940945178899251230)
