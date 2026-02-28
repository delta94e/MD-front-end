# JavaScript Data Types & ES6 — Deep Dive

> 📅 2026-02-04 · ⏱ 25 phút đọc
>
> Tổng hợp kiến thức nền tảng JS: 8 kiểu dữ liệu, type detection, type conversion,
> IEEE 754, và các tính năng ES6 quan trọng (let/const, arrow functions, spread, destructuring).
> Độ khó: ⭐️⭐️⭐️ | Chuyên mục: JavaScript Fundamentals

---

## Mục Lục

**Phần I — Data Types**

1. [8 Kiểu Dữ Liệu JavaScript](#1-8-kiểu-dữ-liệu-javascript)
2. [Các Phương Pháp Kiểm Tra Kiểu](#2-các-phương-pháp-kiểm-tra-kiểu)
3. [Cách Kiểm Tra Array](#3-cách-kiểm-tra-array)
4. [null vs undefined](#4-null-vs-undefined)
5. [typeof null — Tại Sao Là "object"?](#5-typeof-null--tại-sao-là-object)
6. [instanceof — Nguyên Lý & Implement](#6-instanceof--nguyên-lý--implement)
7. [0.1 + 0.2 !== 0.3 — IEEE 754](#7-01--02--03--ieee-754)
8. [Quy Tắc Chuyển Đổi Kiểu (Type Conversion)](#8-quy-tắc-chuyển-đổi-kiểu)
9. [Implicit Type Coercion & ToPrimitive](#9-implicit-type-coercion--toprimitive)
10. [Các Kiến Thức Bổ Sung](#10-các-kiến-thức-bổ-sung)

**Phần II — ES6** 11. [let, const, var — So Sánh](#11-let-const-var--so-sánh) 12. [Arrow Functions vs Regular Functions](#12-arrow-functions-vs-regular-functions) 13. [Spread Operator — Object & Array](#13-spread-operator--object--array) 14. [Destructuring — Array & Object](#14-destructuring--array--object) 15. [Rest Parameters & Template Literals](#15-rest-parameters--template-literals) 16. [Câu Hỏi Phỏng Vấn Tổng Hợp](#16-câu-hỏi-phỏng-vấn-tổng-hợp)

---

# PHẦN I — DATA TYPES

## 1. 8 Kiểu Dữ Liệu JavaScript

```
8 DATA TYPES:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │  PRIMITIVE (Stack) — giá trị đơn giản, kích thước cố định│
  │                                                         │
  │  ① Undefined    ⑤ String                               │
  │  ② Null         ⑥ Symbol   (ES6 — unique & immutable)  │
  │  ③ Boolean      ⑦ BigInt   (ES2020 — arbitrary precision)│
  │  ④ Number                                               │
  ├─────────────────────────────────────────────────────────┤
  │  REFERENCE (Heap) — kích thước động, lưu con trỏ       │
  │                                                         │
  │  ⑧ Object  (bao gồm Array, Function, Date, RegExp...) │
  └─────────────────────────────────────────────────────────┘

  SỰ KHÁC BIỆT VỀ LƯU TRỮ:

  STACK (Primitive):          HEAP (Reference):
  ┌──────────┐               ┌──────────┐
  │ a = 42   │               │ ptr ──────┼──→ { name: 'JS' }
  │ b = 'hi' │               │ ptr ──────┼──→ [1, 2, 3]
  │ c = true │               │           │
  └──────────┘               └──────────┘

  → Primitive: lưu TRỰC TIẾP giá trị trên Stack
  → Reference: Stack chỉ lưu CON TRỎ → trỏ đến Heap

  Symbol: tạo giá trị unique, dùng tránh conflict global vars
  BigInt: lưu integer VƯỢT Number.MAX_SAFE_INTEGER (2^53 - 1)

═══════════════════════════════════════════════════════════════
```

---

## 2. Các Phương Pháp Kiểm Tra Kiểu

```
4 CÁCH KIỂM TRA KIỂU DỮ LIỆU:
═══════════════════════════════════════════════════════════════

  ① typeof — nhanh nhưng KHÔNG chính xác 100%:

  typeof 2               // "number"
  typeof true            // "boolean"
  typeof 'str'           // "string"
  typeof undefined       // "undefined"
  typeof Symbol()        // "symbol"
  typeof function(){}    // "function"
  typeof []              // "object"  ← ⚠️ Array = object!
  typeof {}              // "object"
  typeof null            // "object"  ← ⚠️ BUG lịch sử!

  → Không phân biệt được: Array, Object, null

  ② instanceof — chỉ đúng cho REFERENCE types:

  2 instanceof Number              // false ← primitive!
  'str' instanceof String          // false ← primitive!
  [] instanceof Array              // true  ✅
  function(){} instanceof Function // true  ✅
  {} instanceof Object             // true  ✅

  → Kiểm tra prototype chain
  → KHÔNG dùng được cho primitive types

  ③ constructor — dùng cho CẢ HAI loại:

  (2).constructor === Number        // true
  ('str').constructor === String    // true
  ([]).constructor === Array        // true

  → ⚠️ Nếu thay đổi prototype → constructor SAI!

  function Fn(){}
  Fn.prototype = new Array()
  var f = new Fn()
  f.constructor === Fn    // false! (mất Fn constructor)
  f.constructor === Array // true

  ④ Object.prototype.toString.call() — CHÍNH XÁC NHẤT:

  var a = Object.prototype.toString
  a.call(2)           // "[object Number]"
  a.call(true)        // "[object Boolean]"
  a.call('str')       // "[object String]"
  a.call([])          // "[object Array]"      ← phân biệt!
  a.call(function(){})// "[object Function]"
  a.call({})          // "[object Object]"
  a.call(undefined)   // "[object Undefined]"
  a.call(null)        // "[object Null]"       ← phân biệt!

  TẠI SAO obj.toString() khác Object.prototype.toString.call(obj)?
  → Array, Function ĐÃ OVERRIDE toString()
  → Array.toString() → trả string elements ("1,2,3")
  → Object.prototype.toString → trả [[Class]] tag

═══════════════════════════════════════════════════════════════
```

---

## 3. Cách Kiểm Tra Array

```
5 CÁCH KIỂM TRA ARRAY:
═══════════════════════════════════════════════════════════════

  ① Object.prototype.toString.call(obj).slice(8,-1) === 'Array'
  ② obj.__proto__ === Array.prototype
  ③ Array.isArray(obj)                    ← ĐƠN GIẢN NHẤT!
  ④ obj instanceof Array
  ⑤ Array.prototype.isPrototypeOf(obj)

  → Khuyến nghị: Array.isArray() (ES5+)
  → Cross-frame: Object.prototype.toString.call()

═══════════════════════════════════════════════════════════════
```

---

## 4. null vs undefined

```
NULL vs UNDEFINED:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬───────────────────┬─────────────────────┐
  │              │ undefined         │ null                │
  ├──────────────┼───────────────────┼─────────────────────┤
  │ Ý nghĩa     │ "chưa được định   │ "đối tượng rỗng"   │
  │              │  nghĩa"           │ (empty object)      │
  │ Khi nào      │ Biến khai báo     │ Gán cho biến có thể│
  │              │ chưa gán giá trị  │ nhận object         │
  │ typeof       │ "undefined"       │ "object" ← BUG!    │
  │ == so sánh   │ null == undefined │ → true              │
  │ === so sánh  │ null === undefined│ → false             │
  │ Reserved?    │ KHÔNG (dùng       │ CÓ (reserved word)  │
  │              │  được làm var!)   │                     │
  └──────────────┴───────────────────┴─────────────────────┘

  ⚠️ undefined KHÔNG phải reserved word!
  → Có thể: var undefined = 'hack' (NGUY HIỂM!)
  → Dùng void 0 để lấy undefined an toàn

═══════════════════════════════════════════════════════════════
```

---

## 5. typeof null — Tại Sao Là "object"?

```
BUG LỊCH SỬ TỪ JS V1:
═══════════════════════════════════════════════════════════════

  JS v1 lưu mọi giá trị trong 32-bit units:
  → 1-3 bits cuối = TYPE TAG

  000: object     010: double
    1: int (31b)  100: string
                  110: boolean

  null = NULL POINTER = TẤT CẢ BITS = 0
  → Type tag = 000 → typeof trả "object"!

  undefined = (-2)^30 (ngoài range int)

  → Đây là BUG, KHÔNG phải design decision
  → TC39 từng muốn fix nhưng sẽ BREAK quá nhiều code

═══════════════════════════════════════════════════════════════
```

---

## 6. instanceof — Nguyên Lý & Implement

```javascript
// IMPLEMENT THỦ CÔNG:

function myInstanceof(left, right) {
  let proto = Object.getPrototypeOf(left);
  let prototype = right.prototype;

  while (true) {
    if (!proto) return false; // Hết prototype chain
    if (proto === prototype) return true; // TÌM THẤY!
    proto = Object.getPrototypeOf(proto); // Leo lên 1 bậc
  }
}

// NGUYÊN LÝ:
// Duyệt prototype chain của left
// Kiểm tra right.prototype có XUẤT HIỆN ở đâu đó không
```

---

## 7. 0.1 + 0.2 !== 0.3 — IEEE 754

```
TẠI SAO 0.1 + 0.2 = 0.30000000000000004?
═══════════════════════════════════════════════════════════════

  JS dùng IEEE 754 double precision (64-bit):

  ┌───┬─────────────┬──────────────────────────────────────┐
  │ S │  Exponent   │           Fraction (52 bits)         │
  │1b │   11 bits   │                                      │
  └───┴─────────────┴──────────────────────────────────────┘

  0.1 binary = 0.0001100110011001100... (REPEATING!)
  0.2 binary = 0.0011001100110011001... (REPEATING!)

  → 52 bits chỉ giữ 53 significant digits
  → Phần còn lại bị CẮT → sai số tích lũy!

  CÁCH FIX:

  ① toFixed():
  (0.1 + 0.2).toFixed(2)  // "0.30" (string!)

  ② Number.EPSILON (ES6):
  function isEqual(a, b) {
    return Math.abs(a - b) < Number.EPSILON
  }
  isEqual(0.1 + 0.2, 0.3)  // true ✅

  EXPONENT NEGATIVE — offset 1023:
  → Exponent -4 → stored as -4 + 1023 = 1019
  → 0.1 stored: 0 01111111011 1001100110011001100...

═══════════════════════════════════════════════════════════════
```

---

## 8. Quy Tắc Chuyển Đổi Kiểu

```
CHUYỂN ĐỔI → STRING:
═══════════════════════════════════════════════════════════════
  null       → "null"
  undefined  → "undefined"
  true       → "true"
  42         → "42"
  Symbol()   → "Symbol()" (chỉ EXPLICIT, implicit = ERROR!)
  {}         → "[object Object]" (hoặc custom toString())

CHUYỂN ĐỔI → NUMBER:
═══════════════════════════════════════════════════════════════
  undefined  → NaN
  null       → 0
  true       → 1,  false → 0
  "123"      → 123, "" → 0, "abc" → NaN
  Symbol()   → ERROR!
  Object     → ToPrimitive → valueOf() → toString() → Number()

CHUYỂN ĐỔI → BOOLEAN (falsy values):
═══════════════════════════════════════════════════════════════
  Falsy: undefined, null, false, +0, -0, NaN, ""
  → TẤT CẢ còn lại = truthy (kể cả [], {}, "0", "false"!)

  ⚠️ new Boolean(false) → truthy! (vì nó là OBJECT)
  var a = new Boolean(false)
  if (!a) { console.log("Oops") }  // KHÔNG BAO GIỜ chạy!
═══════════════════════════════════════════════════════════════
```

---

## 9. Implicit Type Coercion & ToPrimitive

```
ToPrimitive(obj, type) — ALGORITHM NỘI BỘ:
═══════════════════════════════════════════════════════════════

  type = "number" (default cho mọi thứ trừ Date):
  ① obj.valueOf()  → primitive? → DÙNG!
  ② obj.toString() → primitive? → DÙNG!
  ③ throw TypeError

  type = "string" (default cho Date):
  ① obj.toString() → primitive? → DÙNG!
  ② obj.valueOf()  → primitive? → DÙNG!
  ③ throw TypeError

  TÓM TẮT: objToNumber = value => Number(value.valueOf().toString())
  objToNumber([]) === 0      // [].valueOf()={} → [].toString()="" → 0
  objToNumber({}) === NaN    // {}.toString()="[object Object]" → NaN

IMPLICIT COERCION RULES BY OPERATOR:
═══════════════════════════════════════════════════════════════

  ① OPERATOR + (đặc biệt!):
  → 1 bên là string → CONCAT!
  1 + '23'      // '123'
  '1' + false   // '1false'
  1 + false     // 1 (cả 2 → number)
  false + true  // 1

  ② OPERATORS -, *, / → luôn chuyển về NUMBER:
  1 * '23'      // 23
  1 / 'aa'      // NaN

  ③ OPERATOR == → cố chuyển về NUMBER:
  3 == true     // false (3 vs 1)
  '0' == false  // true  (0 vs 0)

  ④ OPERATORS < > → string thì so alphabet, khác thì → number:
  'ca' < 'bd'   // false
  '12' < 13     // true (12 < 13)

  VÍ DỤ PHỨC TẠP:
  var a = {}
  a > 2
  // a.valueOf() → {} (object) → tiếp
  // a.toString() → "[object Object]" → Number() → NaN
  // NaN > 2 → false

  var a = {name:'Jack'}, b = {age:18}
  a + b // "[object Object][object Object]"
═══════════════════════════════════════════════════════════════
```

---

## 10. Các Kiến Thức Bổ Sung

```
KIẾN THỨC NHỎ NHƯNG HAY HỎI:
═══════════════════════════════════════════════════════════════

  ① typeof NaN → "number" (NaN LÀ number type!)
  → NaN !== NaN (giá trị DUY NHẤT không bằng chính nó!)

  ② isNaN vs Number.isNaN:
  isNaN('hello')        // true  ← SAI! (convert → NaN → true)
  Number.isNaN('hello') // false ← ĐÚNG! (check number first)
  Number.isNaN(NaN)     // true  ✅

  ③ void 0 → undefined an toàn
  → void không thay đổi kết quả expression
  → Chỉ ngăn return value → trả undefined

  ④ || và && trả VALUE, không trả boolean:
  || → condition true → trả operand 1; false → trả operand 2
  && → condition true → trả operand 2; false → trả operand 1
  1 || 'hello'   // 1
  0 || 'hello'   // 'hello'
  1 && 'hello'   // 'hello'
  0 && 'hello'   // 0

  ⑤ Object.is() vs ===:
  → Giống === NHƯNG:
  Object.is(+0, -0)   // false (=== trả true)
  Object.is(NaN, NaN) // true  (=== trả false)

  ⑥ Wrapper Types:
  'abc'.length          // 3 — JS tự wrap String('abc')
  var a = new Boolean(false)
  !a                    // false! (a là OBJECT → truthy!)

  ⑦ BigInt — tại sao cần?
  Number.MAX_SAFE_INTEGER = 9007199254740991 (2^53 - 1)
  → Vượt quá → MẤT PRECISION!
  → BigInt: 9007199254740992n + 1n = 9007199254740993n ✅

  ⑧ Object.assign & spread — SHALLOW COPY:
  let obj = { inner: { a: 1 } }
  let copy = { ...obj }
  copy.inner.a = 99
  obj.inner.a  // 99 ← CÙNG REFERENCE!
  → Object.assign() cũng tương tự

═══════════════════════════════════════════════════════════════
```

---

# PHẦN II — ES6

## 11. let, const, var — So Sánh

```
BẢNG SO SÁNH CHI TIẾT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────┬─────┬─────┬───────┐
  │ Đặc điểm            │ var │ let │ const │
  ├──────────────────────┼─────┼─────┼───────┤
  │ Block scope          │  ×  │  ✅ │  ✅  │
  │ Variable hoisting    │  ✅ │  ×  │  ×   │
  │ Add to global object │  ✅ │  ×  │  ×   │
  │ Redeclare            │  ✅ │  ×  │  ×   │
  │ Temporal Dead Zone   │  ×  │  ✅ │  ✅  │
  │ Initial value needed │  ×  │  ×  │  ✅  │
  │ Reassign (pointer)   │  ✅ │  ✅ │  ×   │
  └──────────────────────┴─────┴─────┴───────┘

  BLOCK SCOPE giải quyết 2 vấn đề ES5:
  ① Biến trong block ghi đè biến ngoài
  ② Biến loop leak ra global

  const OBJECT CÓ THỂ THAY ĐỔI PROPERTY:
  const obj = { a: 1 }
  obj.a = 2      // ✅ OK! (property thay đổi)
  obj = {}       // ❌ ERROR! (pointer thay đổi)
  → const chỉ khóa POINTER, không khóa VALUE

═══════════════════════════════════════════════════════════════
```

---

## 12. Arrow Functions vs Regular Functions

```
8 KHÁC BIỆT CHÍNH:
═══════════════════════════════════════════════════════════════

  ① SYNTAX GỌN HƠN:
  () => void doesNotReturn()   // no params, no return
  x => x * 2                   // 1 param, implicit return
  (a, b) => a + b              // multi params

  ② KHÔNG CÓ this RIÊNG:
  → Kế thừa this từ PARENT SCOPE
  → this được XÁC ĐỊNH LÚC ĐỊNH NGHĨA, không đổi!

  var obj = {
    id: 'OBJ',
    a: function() { console.log(this.id) },  // 'OBJ'
    b: () => { console.log(this.id) }         // 'GLOBAL'!
  }
  // b dùng this của scope BÊN NGOÀI (window/global)
  // {} KHÔNG tạo execution context riêng!

  ③ call/apply/bind KHÔNG thay đổi this:
  let fn = () => console.log(this.id)
  fn.call({id: 'new'})   // vẫn là this ban đầu!

  ④ KHÔNG dùng được làm constructor:
  new (() => {})  // TypeError!
  // Vì new cần gán this, mà arrow fn không có this riêng

  ⑤ KHÔNG có arguments object:
  const fn = () => console.log(arguments) // ReferenceError!
  // Dùng rest: (...args) => args

  ⑥ KHÔNG có prototype property
  ⑦ KHÔNG dùng được làm Generator (không dùng yield)
  ⑧ this KHÔNG BAO GIỜ thay đổi (dù gọi bằng cách nào)

  BABEL CONVERT:
  // ES6:
  const obj = {
    getArrow() {
      return () => console.log(this === obj)
    }
  }
  // ES5:
  var obj = {
    getArrow: function() {
      var _this = this          // ← Capture this!
      return function() {
        console.log(_this === obj)
      }
    }
  }

═══════════════════════════════════════════════════════════════
```

---

## 13. Spread Operator — Object & Array

```
SPREAD OPERATOR (...):
═══════════════════════════════════════════════════════════════

  OBJECT SPREAD:
  let bar = { a: 1, b: 2 }
  let baz = { ...bar }           // { a: 1, b: 2 } — shallow copy
  // Tương đương: Object.assign({}, bar)

  // Override cùng tên property:
  let baz = { ...bar, a: 99 }    // { a: 99, b: 2 }

  // Redux reducer pattern:
  return { ...state, loading: false, data: action.payload }

  ARRAY SPREAD:
  console.log(...[1, 2, 3])       // 1 2 3

  ① Chuyển array → arguments:
  add(...[1, 2])                   // add(1, 2)

  ② Copy array (shallow):
  const arr2 = [...arr1]

  ③ Merge arrays:
  const merged = ['a', ...arr1, 'z']

  ④ Kết hợp destructuring:
  const [first, ...rest] = [1, 2, 3, 4]
  // first = 1, rest = [2, 3, 4]
  // ⚠️ ...rest PHẢI ở cuối!

  ⑤ String → Array:
  [...'hello']  // ['h', 'e', 'l', 'l', 'o']

  ⑥ Iterator → Array (thay Array.from):
  function foo() { const args = [...arguments] }

  ⑦ Math min/max:
  Math.max(...[9, 4, 7, 1])  // 9

  ⚠️ Chỉ expand 1 LEVEL!
  [...[1, [2, 3]]]  // [1, [2, 3]] — nested array giữ nguyên

═══════════════════════════════════════════════════════════════
```

---

## 14. Destructuring — Array & Object

```
DESTRUCTURING:
═══════════════════════════════════════════════════════════════

  ARRAY — theo VỊ TRÍ:
  const [a, b, c] = [1, 2, 3]     // a=1, b=2, c=3
  const [a, , c] = [1, 2, 3]      // a=1, c=3 (skip index 1)

  OBJECT — theo TÊN PROPERTY:
  const { name, age } = { name: 'Bob', age: 24 }
  // Thứ tự KHÔNG quan trọng: { age, name } cũng OK

  NESTED DESTRUCTURING:
  const school = {
    classes: {
      stu: { name: 'Bob', age: 24 }
    }
  }

  // Clumsy:
  const { classes } = school
  const { stu } = classes
  const { name } = stu

  // Elegant — 1 dòng:
  const { classes: { stu: { name } } } = school
  console.log(name)  // 'Bob'

═══════════════════════════════════════════════════════════════
```

---

## 15. Rest Parameters & Template Literals

```
REST PARAMETERS (...args):
═══════════════════════════════════════════════════════════════

  function mutiple(...args) {
    console.log(args)  // [1, 2, 3, 4] — ARRAY!
    return args.reduce((acc, val) => acc * val, 1)
  }
  mutiple(1, 2, 3, 4)  // 24

  → Gom arguments thành ARRAY
  → Thay thế arguments object (không dùng được trong arrow fn)

TEMPLATE LITERALS:
═══════════════════════════════════════════════════════════════

  // Trước ES6:
  var s = 'name is ' + name + ', age ' + age

  // ES6:
  var s = `name is ${name}, age ${age}`

  ① Variables: ${name}
  ② Expressions: ${a + b}, ${condition ? 'yes' : 'no'}
  ③ Giữ nguyên whitespace, newlines:

  let html = `
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  `

  STRING METHODS MỚI (ES6):
  'hello world'.includes('world')     // true
  'hello world'.startsWith('hello')   // true
  'hello world'.endsWith('world')     // true
  'abc'.repeat(3)                     // 'abcabcabc'

═══════════════════════════════════════════════════════════════
```

---

## 16. Câu Hỏi Phỏng Vấn Tổng Hợp

### Q1: JS có mấy kiểu dữ liệu? Stack vs Heap?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│  8 kiểu: Undefined, Null, Boolean, Number, String,          │
│  Symbol (ES6), BigInt (ES2020), Object                       │
│                                                              │
│  Primitive (7 kiểu đầu): lưu trên STACK                     │
│  → Kích thước cố định, truy cập nhanh                       │
│                                                              │
│  Reference (Object): lưu trên HEAP                           │
│  → Stack chỉ lưu POINTER → trỏ đến data trên Heap          │
│  → Copy biến = copy POINTER (cùng reference!)               │
└──────────────────────────────────────────────────────────────┘
```

### Q2: Cách chính xác nhất để kiểm tra kiểu dữ liệu?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│  Object.prototype.toString.call(value)                       │
│                                                              │
│  → Trả "[object Type]" cho MỌI kiểu (kể cả null, array)   │
│  → typeof: sai cho null ("object"), array ("object")        │
│  → instanceof: sai cho primitives                            │
│  → constructor: hỏng khi thay prototype                     │
│                                                              │
│  Riêng ARRAY: dùng Array.isArray() là đủ                    │
└──────────────────────────────────────────────────────────────┘
```

### Q3: Tại sao 0.1 + 0.2 !== 0.3? Fix thế nào?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│  JS dùng IEEE 754 double-precision (64-bit float)            │
│  → 0.1 và 0.2 binary là SỐ LẶP VÔ HẠN                     │
│  → Chỉ giữ 52 bits fraction → CẮT BỎ → sai số             │
│                                                              │
│  Fix: Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON            │
│  Hoặc: (0.1 + 0.2).toFixed(2) === '0.30'                    │
│  Hoặc: tính bằng integer → chia lại (0.1*10 + 0.2*10) / 10 │
└──────────────────────────────────────────────────────────────┘
```

### Q4: let/const/var khác nhau thế nào?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│  var: function scope, hoisting, add to window, redeclare OK │
│  let: block scope, TDZ, không hoisting, không redeclare     │
│  const: giống let + BẮT BUỘC gán giá trị + không reassign  │
│                                                              │
│  const obj = {a:1}                                           │
│  obj.a = 2     // ✅ (thay đổi property OK)                 │
│  obj = {}      // ❌ (thay đổi pointer KHÔNG OK)             │
│  → const chỉ khóa POINTER, không khóa nội dung             │
└──────────────────────────────────────────────────────────────┘
```

### Q5: Arrow function khác regular function thế nào?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│  ① Không có this riêng → kế thừa từ parent scope           │
│  ② this xác định lúc ĐỊNH NGHĨA, không thay đổi            │
│  ③ call/apply/bind KHÔNG thay đổi this                      │
│  ④ Không dùng được new (không có [[Construct]])             │
│  ⑤ Không có arguments (dùng ...rest thay thế)              │
│  ⑥ Không có prototype property                              │
│  ⑦ Không dùng được yield (không là Generator)               │
│  ⑧ Syntax gọn hơn (implicit return nếu 1 expression)       │
└──────────────────────────────────────────────────────────────┘
```

### Q6: ToPrimitive hoạt động thế nào?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│  Khi cần convert object → primitive:                         │
│                                                              │
│  type = "number" (default):                                  │
│    valueOf() → toString() → TypeError                        │
│  type = "string" (Date default):                             │
│    toString() → valueOf() → TypeError                        │
│                                                              │
│  Ví dụ: {} + 2                                               │
│  → {}.valueOf() = {} (vẫn object) → tiếp                    │
│  → {}.toString() = "[object Object]" (string!) → dùng       │
│  → "[object Object]" + 2 → "[object Object]2"              │
│                                                              │
│  [] + [] → "": [].toString() = "" → "" + "" = ""           │
│  [] + {} → "[object Object]"                                │
│  {} + [] → 0 (vì {} bị parse thành empty block!)           │
└──────────────────────────────────────────────────────────────┘
```

### Q7: Implement instanceof thủ công?

```javascript
// TRẢ LỜI:
function myInstanceof(left, right) {
  let proto = Object.getPrototypeOf(left);
  let prototype = right.prototype;

  while (true) {
    if (!proto) return false;
    if (proto === prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
}

// Duyệt prototype chain:
// left.__proto__ → __proto__.__proto__ → ... → null
// So sánh mỗi bậc với right.prototype
```

### Q8: Operator + khi nào concat, khi nào add?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│  1 bên là STRING (hoặc ToPrimitive → string) → CONCAT      │
│  Cả 2 bên KHÔNG string → chuyển NUMBER → ADD                │
│                                                              │
│  1 + '2'        → '12'  (concat)                            │
│  1 + 2          → 3     (add)                                │
│  true + false   → 1     (1 + 0)                             │
│  '1' + false    → '1false' (concat vì có string)            │
│  1 + Symbol()   → TypeError!                                │
│                                                              │
│  Operators -, *, / → LUÔN convert → number                  │
│  1 * '3' → 3,  1 / 'a' → NaN                               │
└──────────────────────────────────────────────────────────────┘
```
