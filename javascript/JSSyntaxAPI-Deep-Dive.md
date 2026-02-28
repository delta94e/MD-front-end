# JavaScript Syntax & API — Deep Dive

> 📅 2026-02-13 · ⏱ 25 phút đọc
>
> ECMAScript vs JavaScript, ES5/ES6 syntax đầy đủ, Global Objects,
> Higher-Order Functions, Timers, RegExp, Exception Handling
> Độ khó: ⭐️⭐️⭐️⭐️ | Must-know JavaScript Interview

---

## Mục Lục

| #   | Phần                                                  |
| --- | ----------------------------------------------------- |
| 1   | ECMAScript và JavaScript — Mối quan hệ                |
| 2   | ES5 → ES6+ — Tổng hợp cú pháp quan trọng              |
| 3   | Global Objects, Functions & Properties                |
| 4   | Higher-Order Functions — map, reduce, filter & beyond |
| 5   | Timers — setInterval, setTimeout chi tiết & cạm bẫy   |
| 6   | Regular Expressions — API & Bài toán thực tế          |
| 7   | Exception Handling — Xử lý lỗi thống nhất             |
| 8   | Tổng kết & Checklist phỏng vấn                        |

---

## §1. ECMAScript và JavaScript — Mối quan hệ

```
ECMAScript vs JavaScript:
═══════════════════════════════════════════════════════════════

  ECMAScript (ES) = ĐẶC TẢ (Specification)
  → Do TC39 Committee (thuộc ECMA International) quản lý
  → Định nghĩa: cú pháp, types, statements, keywords, operators...
  → KHÔNG định nghĩa: DOM, BOM, AJAX, Canvas...

  JavaScript = HIỆN THỰC (Implementation) của ECMAScript
  → JavaScript = ECMAScript + Web APIs (DOM, BOM, fetch...)

  ┌────────────────────────────────────────────────┐
  │                 JavaScript                      │
  │  ┌────────────────────────────────────────────┐│
  │  │        ECMAScript (Core Language)          ││
  │  │ variables, types, functions, closures,     ││
  │  │ prototypes, classes, iterators, async...   ││
  │  └────────────────────────────────────────────┘│
  │  ┌──────────────┐  ┌─────────────────────────┐│
  │  │    DOM API    │  │       BOM API           ││
  │  │ document,    │  │ window, navigator,      ││
  │  │ querySelector│  │ location, history,      ││
  │  │ events...    │  │ fetch, setTimeout...    ││
  │  └──────────────┘  └─────────────────────────┘│
  └────────────────────────────────────────────────┘

  KHÔNG CHỈ BROWSER:
  → Node.js = ECMAScript + Node APIs (fs, http, process...)
  → Deno = ECMAScript + Web APIs + Deno APIs
  → React Native = ECMAScript + RN Bridge
```

```
LỊCH SỬ PHIÊN BẢN ECMAScript:
═══════════════════════════════════════════════════════════════

  ┌──────┬──────┬────────────────────────────────────────────┐
  │ Năm  │ ES   │ Tính năng nổi bật                          │
  ├──────┼──────┼────────────────────────────────────────────┤
  │ 2009 │ ES5  │ strict mode, JSON, Array methods           │
  │ 2015 │ ES6  │ let/const, arrow fn, class, Promise,       │
  │      │      │ template literals, destructuring, modules  │
  │ 2016 │ ES7  │ Array.includes, ** (exponent)              │
  │ 2017 │ ES8  │ async/await, Object.entries/values         │
  │ 2018 │ ES9  │ rest/spread objects, for-await-of          │
  │ 2019 │ ES10 │ flat/flatMap, Object.fromEntries           │
  │ 2020 │ ES11 │ ?. (optional chaining), ?? (nullish coal.) │
  │      │      │ BigInt, globalThis, Promise.allSettled      │
  │ 2021 │ ES12 │ ??=, ||=, &&=, String.replaceAll           │
  │ 2022 │ ES13 │ Top-level await, #private fields, .at()    │
  │ 2023 │ ES14 │ Array.findLast/findLastIndex, toSorted     │
  │ 2024 │ ES15 │ Object.groupBy, Promise.withResolvers      │
  └──────┴──────┴────────────────────────────────────────────┘

  TC39 PROCESS (4 stages):
  Stage 0: Strawperson (ý tưởng)
  Stage 1: Proposal (đề xuất chính thức)
  Stage 2: Draft (spec ngôn ngữ đầu tiên)
  Stage 3: Candidate (hoàn chỉnh, đợi feedback)
  Stage 4: Finished (VÀO SPEC! Các browser phải implement!)
```

---

## §2. ES5 → ES6+ — Tổng hợp cú pháp quan trọng

### 2.1 let, const & Block Scope

```javascript
// ═══ var vs let vs const ═══

// var: function-scoped, hoisted, có thể redeclare
var x = 1;
var x = 2; // ✅ Không lỗi!
console.log(x); // 2

// let: block-scoped, TDZ, KHÔNG redeclare
let y = 1;
// let y = 2; // ❌ SyntaxError: Already declared!
{
  let y = 3; // ✅ Block scope khác!
  console.log(y); // 3
}
console.log(y); // 1

// const: block-scoped, phải khởi tạo, KHÔNG reassign
const z = { a: 1 };
// z = {}; // ❌ TypeError: Assignment to constant!
z.a = 2; // ✅ Object bên trong CÓ THỂ thay đổi! (reference const, không phải value!)

// TDZ (Temporal Dead Zone):
console.log(a); // undefined (var hoisted!)
// console.log(b); // ❌ ReferenceError! (TDZ!)
var a = 1;
let b = 2;
```

### 2.2 Arrow Functions

```javascript
// ═══ Arrow Functions ═══

// Cú pháp ngắn gọn:
const add = (a, b) => a + b;
const square = (x) => x * x; // 1 param → không cần ()
const getObj = () => ({ key: "value" }); // Return object → wrap ()!
const multiLine = (x) => {
  const result = x * 2;
  return result; // {} → phải return!
};

// ⚠️ 5 KHÁC BIỆT với function thường:
// ① KHÔNG có this riêng → lexical this (từ scope bao ngoài):
const obj = {
  name: "Alice",
  greet: () => console.log(this.name), // ❌ this = window!
  greetOk: function () {
    console.log(this.name);
  }, // ✅ this = obj
};

// ② KHÔNG có arguments object:
const fn = () => {
  // console.log(arguments); // ❌ ReferenceError!
};
const fnOk = (...args) => console.log(args); // ✅ rest params!

// ③ KHÔNG thể dùng làm constructor (new):
// const Foo = () => {}; new Foo(); // ❌ TypeError!

// ④ KHÔNG có prototype property:
const Bar = () => {};
console.log(Bar.prototype); // undefined

// ⑤ KHÔNG thể dùng làm generator (yield):
// const gen = *() => {}; // ❌ SyntaxError!
```

### 2.3 Destructuring & Spread

```javascript
// ═══ Destructuring ═══

// Array:
const [a, b, ...rest] = [1, 2, 3, 4, 5];
// a=1, b=2, rest=[3,4,5]
const [x = 10, y = 20] = [1]; // Default: x=1, y=20

// Object:
const { name, age, job = "dev" } = { name: "Alice", age: 25 };
// Rename: const { name: userName } = user;

// Nested:
const {
  address: { city },
} = { address: { city: "HCM" } };

// Function params:
function greet({ name, greeting = "Hello" }) {
  return `${greeting}, ${name}!`;
}
greet({ name: "Alice" }); // "Hello, Alice!"

// ═══ Spread / Rest ═══

// Spread (mở rộng):
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1,2,3,4,5] — clone + extend!
const obj1 = { a: 1 };
const obj2 = { ...obj1, b: 2 }; // { a:1, b:2 } — shallow clone!

// Rest (gom lại):
function sum(...nums) {
  return nums.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3); // 6
```

### 2.4 Template Literals & Tagged Templates

```javascript
// ═══ Template Literals ═══
const name = "World";
const greeting = `Hello ${name}!`; // String interpolation
const multiline = `Line 1
Line 2
Line 3`; // Multi-line!
const expr = `Result: ${2 + 3 * 4}`; // Expression: "Result: 14"

// ═══ Tagged Templates (nâng cao!) ═══
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const val = values[i] ? `<mark>${values[i]}</mark>` : "";
    return result + str + val;
  }, "");
}
const user = "Alice";
const action = "login";
highlight`User ${user} just ${action}`;
// "User <mark>Alice</mark> just <mark>login</mark>"

// Ứng dụng thực tế: css-in-js (styled-components!):
// const Button = styled.button`
//     color: ${props => props.primary ? 'blue' : 'gray'};
// `;
```

### 2.5 Promise & Async/Await

```javascript
// ═══ Promise ═══

// Tạo Promise:
const fetchUser = (id) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) resolve({ id, name: "Alice" });
      else reject(new Error("Invalid ID"));
    }, 1000);
  });

// Chain:
fetchUser(1)
  .then((user) => fetchPosts(user.id)) // ← Trả về Promise mới!
  .then((posts) => console.log(posts))
  .catch((err) => console.error(err)) // Bắt LỖI bất kỳ đâu!
  .finally(() => hideSpinner()); // Luôn chạy!

// Promise static methods:
Promise.all([p1, p2, p3]); // TẤT CẢ resolve → [r1,r2,r3], 1 reject → reject!
Promise.allSettled([p1, p2]); // CHỜ TẤT CẢ (kể cả reject) → [{status, value/reason}]
Promise.race([p1, p2]); // AI XONG TRƯỚC → resolve/reject theo đó!
Promise.any([p1, p2]); // AI RESOLVE TRƯỚC → resolve, TẤT CẢ reject → AggregateError

// ═══ Async/Await (ES2017) ═══
async function getUserPosts(id) {
  try {
    const user = await fetchUser(id); // Đợi Promise resolve!
    const posts = await fetchPosts(user.id);
    return posts;
  } catch (error) {
    console.error("Failed:", error);
    throw error; // Re-throw nếu cần!
  }
}

// Parallel execution:
const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]); // SONG SONG! Nhanh hơn await tuần tự!

// Top-level await (ES2022):
const config = await fetch("/api/config").then((r) => r.json());
```

### 2.6 Class & Symbol & Iterator

```javascript
// ═══ Class (ES6) ═══
class Animal {
  #name; // Private field (ES2022)
  static count = 0; // Static field

  constructor(name) {
    this.#name = name;
    Animal.count++;
  }

  get name() {
    return this.#name;
  } // Getter
  set name(val) {
    this.#name = val;
  } // Setter

  speak() {
    return `${this.#name} makes a sound`;
  }
  static getCount() {
    return Animal.count;
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // BẮT BUỘC trước this!
    this.breed = breed;
  }
  speak() {
    return `${this.name} barks`;
  } // Override!
}

// ═══ Symbol (ES6) — giá trị unique ═══
const sym1 = Symbol("description");
const sym2 = Symbol("description");
sym1 === sym2; // false! Mỗi Symbol là UNIQUE!

// Dùng làm property key (tránh xung đột):
const ID = Symbol("id");
const user = { [ID]: 123, name: "Alice" };
user[ID]; // 123 — KHÔNG bị ghi đè bởi key khác!

// Well-known Symbols:
Symbol.iterator; // Định nghĩa iteration behavior
Symbol.toPrimitive; // Định nghĩa type conversion
Symbol.hasInstance; // Tùy chỉnh instanceof

// ═══ Iterator & for...of ═══
const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    let current = this.from;
    return {
      next: () =>
        current <= this.to ? { value: current++, done: false } : { done: true },
    };
  },
};
for (const num of range) console.log(num); // 1, 2, 3, 4, 5
[...range]; // [1, 2, 3, 4, 5] — Spread cũng dùng iterator!
```

---

## §3. Global Objects, Functions & Properties

```
JAVASCRIPT GLOBAL — 3 LOẠI:
═══════════════════════════════════════════════════════════════

  ① Global Objects (Constructor + Static methods):
     Math, Date, JSON, RegExp, Map, Set, WeakMap, WeakSet,
     Promise, Proxy, Reflect, ArrayBuffer, Int32Array...

  ② Global Functions (gọi trực tiếp):
     parseInt, parseFloat, isNaN, isFinite,
     encodeURI, decodeURI, encodeURIComponent, decodeURIComponent,
     eval, setTimeout, setInterval...

  ③ Global Properties (giá trị đặc biệt):
     undefined, null, NaN, Infinity, -Infinity, globalThis
```

### Math Object

```javascript
// ═══ Math — KHÔNG phải constructor (không new!) ═══

// Hằng số:
Math.PI; // 3.141592653589793
Math.E; // 2.718281828459045
Math.LN2; // 0.6931471805599453

// Làm tròn (⚠️ HAY HỎI PHỎNG VẤN!):
Math.ceil(4.1); // 5   (làm tròn LÊN)
Math.floor(4.9); // 4   (làm tròn XUỐNG)
Math.round(4.5); // 5   (làm tròn GIAO)
Math.trunc(4.9); // 4   (cắt phần thập phân — ES6)

// ⚠️ Số ÂM:
Math.ceil(-4.1); // -4  (lên = gần 0 hơn!)
Math.floor(-4.9); // -5  (xuống = xa 0 hơn!)
Math.round(-4.5); // -4  (⚠️ round TỚI POSITIVE INFINITY!)
Math.trunc(-4.9); // -4  (cắt phần thập phân)

// Min, Max:
Math.max(1, 3, 2); // 3
Math.min(1, 3, 2); // 1
Math.max(...[1, 3, 2]); // 3 (dùng spread cho arrays!)

// Random:
Math.random(); // [0, 1)
Math.floor(Math.random() * 10); // [0, 9]
Math.floor(Math.random() * (max - min + 1)) + min; // [min, max]

// Khác:
Math.abs(-5); // 5
Math.pow(2, 10); // 1024 (hoặc 2 ** 10)
Math.sqrt(144); // 12
Math.cbrt(27); // 3  (cube root — ES6)
Math.sign(-5); // -1 (0 → 0, dương → 1, âm → -1)
Math.log2(8); // 3
```

### Date Object

```javascript
// ═══ Date ═══

// Tạo:
new Date(); // Now
new Date(2026, 1, 13); // 2026-02-13 (month 0-indexed!)
new Date("2026-02-13T10:30:00"); // ISO string
new Date(1739439000000); // Timestamp (ms from 1970)
Date.now(); // Timestamp hiện tại (tĩnh!)

// Lấy thông tin:
const d = new Date("2026-02-13T10:30:45");
d.getFullYear(); // 2026
d.getMonth(); // 1 (0-indexed! 0=Jan, 11=Dec)
d.getDate(); // 13
d.getDay(); // 5 (0=Sun, 6=Sat) — ngày trong TUẦN!
d.getHours(); // 10
d.getMinutes(); // 30
d.getSeconds(); // 45
d.getTime(); // timestamp ms
d.getTimezoneOffset(); // phút chênh lệch UTC (VN: -420 = UTC+7)

// Format:
d.toISOString(); // "2026-02-13T03:30:45.000Z" (UTC!)
d.toLocaleDateString("vi-VN"); // "13/2/2026"
d.toLocaleTimeString("vi-VN"); // "10:30:45"
d.toLocaleString("vi-VN"); // "10:30:45, 13/2/2026"

// ═══ Tính khoảng cách (phỏng vấn!) ═══
function daysBetween(date1, date2) {
  const ms = Math.abs(date2 - date1); // Tự chuyển thành timestamp!
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
daysBetween(new Date("2026-01-01"), new Date("2026-02-13")); // 43
```

### JSON Object

```javascript
// ═══ JSON ═══

// Stringify:
JSON.stringify({ a: 1, b: undefined, c: function () {} });
// '{"a":1}' → undefined + function → BỊ LOẠI BỎ!

// Stringify với replacer + space:
JSON.stringify({ a: 1, b: 2 }, ["a"], 2);
// '{\n  "a": 1\n}' → Chỉ giữ key 'a', indent 2!

JSON.stringify({ a: 1, b: 2 }, (key, value) => {
  if (key === "b") return undefined; // Loại bỏ key 'b'!
  return value;
});
// '{"a":1}'

// toJSON: tùy chỉnh stringify:
const user = {
  name: "Alice",
  password: "123",
  toJSON() {
    return { name: this.name };
  }, // Ẩn password!
};
JSON.stringify(user); // '{"name":"Alice"}'

// Parse:
JSON.parse('{"a":1}'); // { a: 1 }
JSON.parse('{"date":"2026-02-13"}', (key, value) => {
  if (key === "date") return new Date(value);
  return value;
}); // { date: Date object } — Reviver!

// ═══ Deep Clone bằng JSON (cạm bẫy!) ═══
const clone = JSON.parse(JSON.stringify(original));
// ⚠️ MẤT: undefined, function, Symbol, RegExp, Date (→ string), Map, Set
// ⚠️ Circular reference → TypeError!
// ✅ Dùng structuredClone(obj) (ES2022) thay thế!
```

### Global Functions

```javascript
// ═══ parseInt & parseFloat ═══
parseInt("42"); // 42
parseInt("42px"); // 42 (parse đến ký tự invalid!)
parseInt("px42"); // NaN (bắt đầu bằng invalid!)
parseInt("0xff", 16); // 255 (hex!)
parseInt("111", 2); // 7 (binary!)

// ⚠️ PHỎNG VẤN: parseInt + map!
["1", "2", "3"].map(parseInt);
// → [1, NaN, NaN] — KHÔNG PHẢI [1, 2, 3]!
// Vì: parseInt('1', 0)=1, parseInt('2', 1)=NaN, parseInt('3', 2)=NaN
// map truyền (value, INDEX) → parseInt nhận (string, RADIX)!
// FIX: ['1','2','3'].map(Number) → [1, 2, 3] ✅
// FIX: ['1','2','3'].map(s => parseInt(s, 10)) → [1, 2, 3] ✅

parseFloat("3.14"); // 3.14
parseFloat("3.14.15"); // 3.14 (chỉ parse đến . thứ 2!)
parseFloat("0.1e2"); // 10

// ═══ isNaN vs Number.isNaN ═══
isNaN("hello"); // true (⚠️ convert rồi kiểm tra: Number('hello')=NaN!)
Number.isNaN("hello"); // false (✅ KHÔNG convert! Chỉ true cho NaN thật!)
Number.isNaN(NaN); // true ✅

// ═══ isFinite vs Number.isFinite ═══
isFinite("42"); // true (⚠️ convert!)
Number.isFinite("42"); // false (✅ không convert!)
Number.isFinite(Infinity); // false
Number.isFinite(42); // true

// ═══ URI Encoding ═══
encodeURI("https://example.com/path name");
// "https://example.com/path%20name" — KHÔNG encode :/?#@
encodeURIComponent("https://example.com/path name");
// "https%3A%2F%2Fexample.com%2Fpath%20name" — encode MỌI THỨ!

// Khi nào dùng gì:
// encodeURI → cho TOÀN BỘ URL (giữ cấu trúc URL)
// encodeURIComponent → cho TỪNG PHẦN (query param values)
const url = `https://api.com/search?q=${encodeURIComponent(userInput)}`;
```

---

## §4. Higher-Order Functions — map, reduce, filter & beyond

```
HIGHER-ORDER FUNCTION (HÀM BẬC CAO):
═══════════════════════════════════════════════════════════════

  Hàm nhận FUNCTION làm tham số, hoặc TRẢ VỀ function!
  → map, filter, reduce, forEach, find, some, every, sort...
  → Functional Programming paradigm!
  → Biến đổi dữ liệu KHÔNG thay đổi array gốc (immutable)!
```

```javascript
// ═══ Array.prototype.map(callback(value, index, array)) ═══
// Tạo array MỚI bằng cách transform mỗi phần tử:
const nums = [1, 2, 3, 4, 5];
const doubled = nums.map((n) => n * 2); // [2, 4, 6, 8, 10]
// ⚠️ Luôn return! Arrow fn không {} → tự return!

// Thực tế:
const users = [
  { name: "A", age: 20 },
  { name: "B", age: 30 },
];
const names = users.map((u) => u.name); // ['A', 'B']

// ═══ TỰ TRIỂN KHAI map (phỏng vấn!) ═══
Array.prototype.myMap = function (callback, thisArg) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) {
      // Skip holes! (sparse array)
      result.push(callback.call(thisArg, this[i], i, this));
    }
  }
  return result;
};

// ═══ Array.prototype.filter(callback) ═══
// Giữ lại phần tử thỏa điều kiện:
const evens = nums.filter((n) => n % 2 === 0); // [2, 4]
const adults = users.filter((u) => u.age >= 18);

// TỰ TRIỂN KHAI filter:
Array.prototype.myFilter = function (callback, thisArg) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this && callback.call(thisArg, this[i], i, this)) {
      result.push(this[i]);
    }
  }
  return result;
};

// ═══ Array.prototype.reduce(callback(acc, value, index, array), initialValue) ═══
// Gộp array thành 1 giá trị:
const sum = nums.reduce((acc, n) => acc + n, 0); // 15
const max = nums.reduce((a, b) => Math.max(a, b)); // 5

// Ứng dụng: đếm frequency:
const words = ["a", "b", "a", "c", "b", "a"];
const freq = words.reduce((acc, word) => {
  acc[word] = (acc[word] || 0) + 1;
  return acc;
}, {});
// { a: 3, b: 2, c: 1 }

// Ứng dụng: flatten array:
const nested = [[1, 2], [3, 4], [5]];
const flat = nested.reduce((acc, arr) => [...acc, ...arr], []);
// [1, 2, 3, 4, 5] — hoặc dùng Array.flat()!

// Ứng dụng: pipe / compose:
const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, fn) => fn(v), x);
const transform = pipe(
  (x) => x + 1,
  (x) => x * 2,
  (x) => x.toString(),
);
transform(5); // "12" = ((5 + 1) * 2).toString()

// TỰ TRIỂN KHAI reduce:
Array.prototype.myReduce = function (callback, initialValue) {
  let acc = initialValue;
  let startIndex = 0;
  if (acc === undefined) {
    if (this.length === 0)
      throw new TypeError("Reduce of empty array with no initial value");
    acc = this[0];
    startIndex = 1;
  }
  for (let i = startIndex; i < this.length; i++) {
    if (i in this) {
      acc = callback(acc, this[i], i, this);
    }
  }
  return acc;
};
```

```javascript
// ═══ CÁC HIGHER-ORDER FUNCTIONS KHÁC ═══

// forEach — Side effects only (KHÔNG return!):
nums.forEach((n, i) => console.log(`${i}: ${n}`));
// ⚠️ KHÔNG thể break/return sớm! Dùng for...of nếu cần break!

// find & findIndex — Tìm phần tử ĐẦU TIÊN:
const user = users.find((u) => u.name === "A"); // { name:'A', age:20 }
const idx = users.findIndex((u) => u.name === "B"); // 1
// findLast / findLastIndex (ES2023) — tìm từ CUỐI!

// some & every — Kiểm tra điều kiện:
nums.some((n) => n > 4); // true (có ÍT NHẤT 1 phần tử > 4)
nums.every((n) => n > 0); // true (TẤT CẢ > 0)
// ⚡ Short-circuit: some dừng khi true, every dừng khi false!

// sort — Sắp xếp (⚠️ MUTATES! + so sánh STRING mặc định!):
[10, 1, 21, 2].sort(); // [1, 10, 2, 21] ← SAI! (string compare!)
[10, 1, 21, 2].sort((a, b) => a - b); // [1, 2, 10, 21] ✅ (number compare!)
// toSorted() (ES2023) — KHÔNG mutate!

// flat & flatMap (ES2019):
[1, [2, [3, [4]]]].flat(); // [1, 2, [3, [4]]] — 1 level
[1, [2, [3, [4]]]].flat(Infinity); // [1, 2, 3, 4] — tất cả!
["hi bye", "ok"].flatMap((s) => s.split(" ")); // ['hi', 'bye', 'ok']

// Array.from — Tạo array từ iterable/array-like:
Array.from("hello"); // ['h','e','l','l','o']
Array.from({ length: 5 }, (_, i) => i); // [0,1,2,3,4]
Array.from(document.querySelectorAll("div")); // NodeList → Array!
```

```
CHUỖI METHOD — PHỎNG VẤN PATTERN:
═══════════════════════════════════════════════════════════════

  // Bài toán: "Tìm tổng tuổi của users nam trên 18 tuổi"
  const result = users
      .filter(u => u.gender === 'male')  // ① Lọc
      .filter(u => u.age > 18)            // ② Lọc tiếp
      .map(u => u.age)                    // ③ Lấy tuổi
      .reduce((sum, age) => sum + age, 0); // ④ Tổng

  // Tối ưu hơn (1 lần duyệt):
  const result = users.reduce((sum, u) => {
      if (u.gender === 'male' && u.age > 18) sum += u.age;
      return sum;
  }, 0);
```

---

## §5. Timers — setInterval, setTimeout chi tiết & cạm bẫy

```javascript
// ═══ setTimeout — Chạy SAU delay ═══
const timerId = setTimeout(callback, delay, arg1, arg2);
// → Trả về timer ID
// → callback chạy SAU ÍT NHẤT delay ms (có thể lâu hơn!)
// → arg1, arg2 truyền vào callback

clearTimeout(timerId); // Hủy timer!

// ═══ setInterval — Chạy LẶP LẠI ═══
const intervalId = setInterval(() => {
  console.log("Tick!");
}, 1000);

clearInterval(intervalId); // Dừng!
```

```
⚠️ CẠM BẪY setTimeout / setInterval:
═══════════════════════════════════════════════════════════════

  ① DELAY KHÔNG CHÍNH XÁC:
  → setTimeout(fn, 100) KHÔNG đảm bảo chạy sau ĐÚNG 100ms!
  → Nếu main thread bận → callback xếp hàng trong task queue!
  → Delay thực tế = delay + thời gian chờ main thread rảnh!

  setTimeout(() => console.log('100ms'), 100);
  heavyComputation(); // Chạy 500ms
  // → callback chạy sau ~500ms, KHÔNG PHẢI 100ms! 💀

  ② setInterval DRIFT (trôi thời gian):
  → setInterval(fn, 1000): Nếu fn mất 300ms:
  → Khoảng cách thực: 1000ms (từ BẮT ĐẦU gọi, không phải KẾT THÚC)
  → Nếu fn > interval → CHỒNG CHÉO hoặc BỎ QUA!

  setInterval(fn, 1000):
  ┌─fn (300ms)─┐          ┌─fn (300ms)─┐
  ├─────────────┼──────────┼─────────────┼──
  0           300        1000         1300  (ms)
  │←── 1000ms ──→│         (cách ĐÚNG 1000ms từ start)

  Nhưng nếu fn mất 1200ms:
  ┌─fn (1200ms)──────────────┐┌─fn (1200ms)──────────────┐
  ├───────────────────────────┼┼───────────────────────────┤
  0                        1200                          2400
  → Callback thứ 2 BỎ QUA lần ở 1000ms! Chạy NGAY sau lần 1!

  ③ this CONTEXT:
  const obj = {
      name: 'timer',
      start() {
          setTimeout(function() {
              console.log(this.name); // ❌ undefined! (this = window)
          }, 100);
          setTimeout(() => {
              console.log(this.name); // ✅ 'timer' (arrow = lexical this)
          }, 100);
      }
  };
```

```javascript
// ═══ GIẢI PHÁP: setTimeout đệ quy THAY THẾ setInterval ═══

// ❌ setInterval: khoảng cách KHÔNG đều nếu fn chậm
setInterval(expensiveFn, 1000);

// ✅ setTimeout đệ quy: khoảng cách CHÍNH XÁC sau mỗi fn:
function betterInterval() {
  expensiveFn(); // Chạy xong RỒI MỚI...
  setTimeout(betterInterval, 1000); // ...hẹn lần sau!
}
betterInterval();

// So sánh:
// setInterval(fn, 1000):
// |--fn(300ms)--|-----700ms-----|--fn(300ms)--|----
// ├─────────────────1000ms───────────────────────┤
// → 1000ms từ START gọi, fn chạy giữa!

// setTimeout đệ quy:
// |--fn(300ms)--|-----1000ms------|--fn(300ms)--|---
//                ├─────1000ms─────┤
// → 1000ms từ END gọi → KẾT QUẢ: khoảng cách đều hơn!

// ═══ Implement setInterval bằng setTimeout (phỏng vấn!) ═══
function mySetInterval(callback, interval) {
  const timer = { id: null, cancelled: false };

  function loop() {
    if (timer.cancelled) return;
    callback();
    timer.id = setTimeout(loop, interval);
  }

  timer.id = setTimeout(loop, interval);
  return timer;
}

function myClearInterval(timer) {
  timer.cancelled = true;
  clearTimeout(timer.id);
}

// ═══ Implement setTimeout bằng setInterval ═══
function mySetTimeout(callback, delay) {
  const id = setInterval(() => {
    clearInterval(id);
    callback();
  }, delay);
  return id;
}
```

```
TIMER & EVENT LOOP:
═══════════════════════════════════════════════════════════════

  setTimeout/setInterval callback = MACRO TASK:

  Call Stack     Micro Tasks     Macro Tasks
  ┌────────┐    ┌───────────┐   ┌────────────┐
  │ main() │    │ Promise   │   │ setTimeout │
  │        │    │ .then()   │   │ setInterval│
  │        │    │ queueMicro│   │ I/O        │
  └────────┘    └───────────┘   └────────────┘

  Thứ tự: Call Stack → ALL Micro Tasks → 1 Macro Task → lặp lại

  console.log('1');
  setTimeout(() => console.log('2'), 0);    // Macro queue
  Promise.resolve().then(() => console.log('3')); // Micro queue
  console.log('4');
  // Output: 1, 4, 3, 2
  // → Micro (Promise) TRƯỚC Macro (setTimeout)!
```

---

## §6. Regular Expressions — API & Bài toán thực tế

```javascript
// ═══ TẠO RegExp ═══
const re1 = /pattern/flags;         // Literal (compile-time)
const re2 = new RegExp('pattern', 'flags'); // Constructor (runtime)

// FLAGS:
// g — global (tìm TẤT CẢ, không dừng ở match đầu)
// i — case insensitive
// m — multiline (^ $ match từng dòng)
// s — dotAll (. match cả \n)
// u — unicode
// y — sticky (match tại lastIndex)

// ═══ METHODS ═══
// RegExp methods:
re.test('string');      // true/false — có match không?
re.exec('string');      // Match object hoặc null

// String methods dùng regex:
'str'.match(/pattern/g);    // Array matches hoặc null
'str'.matchAll(/pat/g);     // Iterator of match objects
'str'.search(/pattern/);    // Index hoặc -1
'str'.replace(/pat/, 'rep'); // String mới
'str'.replaceAll(/pat/g, 'rep'); // Thay TẤT CẢ (ES2021)
'str'.split(/separator/);   // Array
```

```javascript
// ═══ PATTERNS THƯỜNG GẶP ═══

// ① Email validation:
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
emailRegex.test("user@example.com"); // true
emailRegex.test("invalid@.com"); // false

// ② URL parsing:
const urlRegex = /^(https?):\/\/([^/:]+)(:\d+)?(\/[^?#]*)(\?[^#]*)?(#.*)?$/;
const match = "https://example.com:8080/path?q=1#hash".match(urlRegex);
// match[1] = 'https'   (protocol)
// match[2] = 'example.com' (host)
// match[3] = ':8080'   (port)
// match[4] = '/path'   (pathname)
// match[5] = '?q=1'    (search)
// match[6] = '#hash'   (hash)

// ③ Số điện thoại VN:
const phoneVN = /^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/;
phoneVN.test("0912345678"); // true
phoneVN.test("+84912345678"); // true

// ④ Password strength:
const strongPwd =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
// (?=...) = Lookahead: kiểm tra KHÔNG consume!
// Yêu cầu: ≥8 ký tự, có lowercase, uppercase, number, special char

// ⑤ HTML tag matching:
const htmlTag = /<([a-z][a-z0-9]*)\b[^>]*>(.*?)<\/\1>/gi;
// \1 = backreference: match TAG MỞ phải = TAG ĐÓNG!
"<div>hello</div>".match(htmlTag); // ['<div>hello</div>']

// ⑥ Tách số có dấu phẩy (1000 → 1,000):
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
formatNumber(1234567); // "1,234,567"
// \B = non-word boundary (không đầu chuỗi)
// (?=(\d{3})+(?!\d)) = lookahead: theo sau bởi nhóm 3 chữ số

// ⑦ Loại bỏ khoảng trắng thừa:
"  hello   world  ".replace(/^\s+|\s+$/g, ""); // "hello   world" (trim)
"  hello   world  ".replace(/\s+/g, " ").trim(); // "hello world"

// ⑧ Camel case → kebab case:
"backgroundColor".replace(/([A-Z])/g, "-$1").toLowerCase();
// "background-color"

// ⑨ Template string parsing (giống {{}]):
function render(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}
render("Hello {{name}}, age {{age}}", { name: "Alice", age: 25 });
// "Hello Alice, age 25"

// ⑩ Array dedup bằng filter + indexOf:
function dedup(arr) {
  return arr.filter((v, i) => arr.indexOf(v) === i);
}
// Hoặc: [...new Set(arr)]
```

```
REGEX CHÚ Ý:
═══════════════════════════════════════════════════════════════

  ⚠️ Greedy vs Lazy:
  /.+/   = Greedy   → match NHIỀU NHẤT có thể
  /.+?/  = Lazy     → match ÍT NHẤT có thể

  '<b>hello</b><b>world</b>'.match(/<b>.+<\/b>/);
  // ["<b>hello</b><b>world</b>"] — Greedy: match HẾT! 💀
  '<b>hello</b><b>world</b>'.match(/<b>.+?<\/b>/);
  // ["<b>hello</b>"] — Lazy: match VỪA ĐỦ! ✅

  ⚠️ RegExp.lastIndex (global flag):
  const re = /a/g;
  re.test('abcabc'); // true, lastIndex = 1
  re.test('abcabc'); // true, lastIndex = 4
  re.test('abcabc'); // false, lastIndex = 0 (reset!)
  // → Global regex có STATE! Cẩn thận khi reuse!

  ⚠️ Catastrophic Backtracking (ReDoS):
  /(a+)+b/.test('aaaaaaaaaaaaaaaaac');
  // → Cực chậm! Nested quantifiers → exponential backtracking!
  // → Tránh: /(a+)+/, /([a-z]+)*/, /(a|a)+/
```

---

## §7. Exception Handling — Xử lý lỗi thống nhất

```javascript
// ═══ try / catch / finally ═══

try {
  // Code có thể throw error:
  const data = JSON.parse(invalidJson);
} catch (error) {
  // Xử lý lỗi:
  console.error("Parse failed:", error.message);
  // error.name     → "SyntaxError"
  // error.message  → "Unexpected token..."
  // error.stack    → Stack trace!
} finally {
  // LUÔN CHẠY (dù try thành công hay catch!):
  cleanup();
}

// ═══ Error Types (Built-in) ═══
// Error         → Base class
// SyntaxError   → JSON.parse('invalid'), eval('if(')
// TypeError     → null.property, undefined(), notAFunction()
// ReferenceError → undeclaredVariable
// RangeError    → new Array(-1), num.toFixed(200)
// URIError      → decodeURI('%')
// EvalError     → (hiếm, legacy)

// ═══ Custom Error ═══
class AppError extends Error {
  constructor(message, code, data = null) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.data = data;
    // Fix prototype chain:
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

class ValidationError extends AppError {
  constructor(field, message) {
    super(message, "VALIDATION_ERROR", { field });
    this.name = "ValidationError";
  }
}

class NetworkError extends AppError {
  constructor(status, message) {
    super(message, "NETWORK_ERROR", { status });
    this.name = "NetworkError";
  }
}

// Sử dụng:
throw new ValidationError("email", "Email is required");
// catch: error instanceof ValidationError → xử lý riêng!
```

```javascript
// ═══ ASYNC ERROR HANDLING ═══

// ① Promise .catch():
fetchData()
  .then((data) => process(data))
  .catch((error) => {
    if (error instanceof NetworkError) {
      showRetryButton();
    } else {
      showGenericError();
    }
  });

// ② async/await + try/catch:
async function loadData() {
  try {
    const res = await fetch("/api/data");
    if (!res.ok) throw new NetworkError(res.status, "API failed");
    return await res.json();
  } catch (error) {
    handleError(error);
  }
}

// ③ Unhandled Promise Rejection (global!):
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled:", event.reason);
  event.preventDefault(); // Ngăn browser log lỗi
  reportToServer(event.reason);
});
```

```javascript
// ═══ UNIFIED ERROR HANDLING SCHEME ═══

// ① Error Handler trung tâm:
class ErrorHandler {
  static handlers = new Map();

  static register(ErrorClass, handler) {
    this.handlers.set(ErrorClass, handler);
  }

  static handle(error) {
    // Tìm handler phù hợp nhất:
    for (const [ErrorClass, handler] of this.handlers) {
      if (error instanceof ErrorClass) {
        return handler(error);
      }
    }
    // Fallback:
    console.error("Unhandled error:", error);
    this.reportToServer(error);
  }

  static reportToServer(error) {
    // Gửi đến Sentry / server:
    fetch("/api/errors", {
      method: "POST",
      body: JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
        timestamp: Date.now(),
        url: location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {}); // Fail silently!
  }
}

// ② Đăng ký handlers:
ErrorHandler.register(ValidationError, (error) => {
  showFieldError(error.data.field, error.message);
});
ErrorHandler.register(NetworkError, (error) => {
  if (error.data.status === 401) redirectToLogin();
  else if (error.data.status === 403) showForbidden();
  else if (error.data.status >= 500) showRetry();
  else showGenericError(error.message);
});

// ③ Global error listeners:
// JS errors:
window.addEventListener("error", (event) => {
  ErrorHandler.handle(event.error);
});
// Promise rejections:
window.addEventListener("unhandledrejection", (event) => {
  ErrorHandler.handle(event.reason);
});
// Resource loading errors (img, script, css):
window.addEventListener(
  "error",
  (event) => {
    if (event.target !== window) {
      // Resource error (img, script...):
      console.error("Resource failed:", event.target.src || event.target.href);
    }
  },
  true,
); // ← Capture phase! (error events không bubble!)

// ④ React Error Boundary:
class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    ErrorHandler.handle(error);
  }
  render() {
    return this.state.hasError ? <Fallback /> : this.props.children;
  }
}

// ⑤ Axios interceptor:
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, data } = error.response || {};
    throw new NetworkError(status, data?.message || error.message);
  },
);
```

```
ERROR HANDLING BEST PRACTICES:
═══════════════════════════════════════════════════════════════

  ✅ LUÔN catch Promises (tránh unhandled rejection!)
  ✅ Dùng Custom Error classes (phân loại rõ ràng!)
  ✅ Error Handler trung tâm (1 nơi xử lý tất cả!)
  ✅ Global listeners (error, unhandledrejection!)
  ✅ Report to server (Sentry, Bugsnag, custom!)
  ✅ Graceful fallback (hiện UI thay vì crash!)
  ✅ Stack trace (giữ nguyên bằng Error.captureStackTrace!)

  ❌ ĐỪNG nuốt lỗi: catch(e) { } (empty catch!)
  ❌ ĐỪNG chỉ log: catch(e) { console.log(e) } (user không biết!)
  ❌ ĐỪNG throw string: throw 'error' → throw new Error('error')!
  ❌ ĐỪNG catch rồi không re-throw khi cần!
```

---

## §8. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  JavaScript Syntax & API
  ├── ECMAScript: specification (TC39) vs JS: implementation
  │   └── ES6+ yearly releases, 4-stage process
  ├── ES6+: let/const, arrow fn, destructuring, spread, class,
  │         Promise, async/await, Symbol, Iterator, modules
  ├── Global: Math (rounding!), Date (0-indexed month!), JSON,
  │           parseInt (radix!), isNaN vs Number.isNaN
  ├── HOF: map, filter, reduce, find, some, every, sort
  │   └── Tự triển khai! Chain pattern! pipe/compose!
  ├── Timers: setTimeout/setInterval, delay bất chính xác,
  │           interval drift, setTimeout đệ quy thay interval
  ├── RegExp: email, URL, phone, password, template, format number
  │   └── Greedy vs lazy, lastIndex, ReDoS warning
  └── Errors: try/catch/finally, Custom Error, unified handler,
      global listeners, Axios interceptor, Error Boundary
```

### Checklist

- [ ] **ECMAScript vs JavaScript**: ES = spec (TC39), JS = ES + DOM/BOM, TC39 4-stage process
- [ ] **let/const vs var**: block scope, TDZ, no redeclare; const = reference immutable, object bên trong có thể đổi
- [ ] **Arrow function 5 khác biệt**: no own this (lexical), no arguments, no new, no prototype, no yield
- [ ] **Destructuring**: array `[a, ...rest]`, object `{ name: alias = default }`, nested, function params
- [ ] **Template literals**: `` `${expr}` ``, multiline, tagged templates (styled-components!)
- [ ] **Promise**: `.then/.catch/.finally`, `all/allSettled/race/any`, async/await + try/catch
- [ ] **Class**: constructor, get/set, static, #private, extends + super, instanceof
- [ ] **Symbol**: unique, object key, well-known (iterator, toPrimitive, hasInstance)
- [ ] **Math rounding**: ceil (lên), floor (xuống), round (giao), trunc (cắt); ⚠️ số âm!
- [ ] **Date**: month 0-indexed!, getDay()=0 Sunday, getDate()=ngày trong tháng, timestamp = getTime()
- [ ] **JSON.stringify**: loại bỏ undefined/function/Symbol, toJSON, replacer; ⚠️ deep clone mất kiểu!
- [ ] **parseInt trap**: `['1','2','3'].map(parseInt)` = [1,NaN,NaN] vì map truyền (value, INDEX) = (string, RADIX)
- [ ] **isNaN vs Number.isNaN**: isNaN convert rồi check, Number.isNaN chỉ true cho NaN thật
- [ ] **map/filter/reduce tự triển khai**: chú ý `i in this` (sparse array), `callback.call(thisArg,...)`
- [ ] **reduce ứng dụng**: sum, max, frequency count, flatten, pipe/compose
- [ ] **setTimeout delay bất chính xác**: delay = minimum, thực tế phụ thuộc main thread, event loop
- [ ] **setInterval drift**: fn > interval → bỏ lần hoặc chạy liền; FIX: setTimeout đệ quy
- [ ] **Timer & Event Loop**: macro task, micro (Promise) trước macro (setTimeout)
- [ ] **RegExp**: greedy `.+` vs lazy `.+?`, global `lastIndex` state, ReDoS nested quantifiers!
- [ ] **Custom Error class**: extends Error, name/code/data, Object.setPrototypeOf fix
- [ ] **Unified error handling**: ErrorHandler trung tâm, global listeners (error + unhandledrejection), report to server

---

_Nguồn: ConardLi — "JavaScript Syntax & API" · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
