# JavaScript Biến & Kiểu Dữ Liệu — Deep Dive

> 📅 2026-02-13 · ⏱ 25 phút đọc
>
> Nguồn: ConardLi — "JS Biến và Kiểu Dữ Liệu" · Juejin
> 10 chủ đề core: Kiểu ngôn ngữ → Object nội bộ → Symbol → Memory → Boxing
> → Value vs Reference → null vs undefined → Type Detection → Implicit Conversion → Precision
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Must-know JS Fundamentals

---

## Mục Lục

| #   | Chủ đề                                    |
| --- | ----------------------------------------- |
| 1   | Các kiểu dữ liệu trong JavaScript         |
| 2   | Cấu trúc dữ liệu bên dưới của Object      |
| 3   | Symbol — Ứng dụng thực tế & Tự triển khai |
| 4   | Biến lưu trữ trong bộ nhớ như thế nào     |
| 5   | Built-in Objects & Boxing / Unboxing      |
| 6   | Value Types vs Reference Types            |
| 7   | null vs undefined                         |
| 8   | 3+ cách kiểm tra kiểu dữ liệu             |
| 9   | Implicit Type Conversion (Ép kiểu ngầm)   |
| 10  | Precision Loss & Large Numbers            |
| 11  | Tổng kết & Checklist phỏng vấn            |

---

## §1. Các kiểu dữ liệu trong JavaScript

```
8 KIỂU DỮ LIỆU (ES2020+):
═══════════════════════════════════════════════════════════════

  7 KIỂU NGUYÊN THỦY (Primitive Types):
  ┌──────────┬────────────────────────────────────────────────┐
  │ Kiểu     │ Mô tả                                         │
  ├──────────┼────────────────────────────────────────────────┤
  │ Number   │ Số nguyên + số thực (IEEE 754 double 64-bit)  │
  │ String   │ Chuỗi ký tự (immutable!)                      │
  │ Boolean  │ true / false                                   │
  │ null     │ Giá trị rỗng có chủ đích                      │
  │ undefined│ Biến đã khai báo nhưng chưa gán giá trị       │
  │ Symbol   │ Giá trị duy nhất, không trùng lặp (ES6)       │
  │ BigInt   │ Số nguyên lớn tùy ý (ES2020)                  │
  └──────────┴────────────────────────────────────────────────┘

  1 KIỂU THAM CHIẾU (Reference Type):
  ┌──────────┬────────────────────────────────────────────────┐
  │ Object   │ Bao gồm: Object, Array, Function, Date,      │
  │          │ RegExp, Map, Set, WeakMap, WeakSet...          │
  └──────────┴────────────────────────────────────────────────┘

  PHÂN LOẠI THEO SPEC:
  → Language Types: 7 primitive + Object = 8 kiểu
  → Specification Types: Reference, List, Completion,
    Property Descriptor, Environment Record...
    (chỉ dùng trong spec, KHÔNG dùng trong code!)
```

```javascript
// Kiểm tra nhanh mỗi kiểu:
typeof 42; // "number"
typeof "hello"; // "string"
typeof true; // "boolean"
typeof undefined; // "undefined"
typeof Symbol("id"); // "symbol"
typeof 42n; // "bigint"
typeof null; // "object"   ← BUG lịch sử! (§7 giải thích)
typeof {}; // "object"
typeof []; // "object"   ← Array cũng là object!
typeof function () {}; // "function" ← Trường hợp đặc biệt
```

---

## §2. Cấu trúc dữ liệu bên dưới của Object

```
OBJECT INTERNALS — V8 ENGINE:
═══════════════════════════════════════════════════════════════

  Trong V8, Object được lưu dưới dạng HeapObject.
  Mỗi object có:

  ┌─────────────────────────────────────────────────────────┐
  │ Hidden Class (Map)                                      │
  │ → Mô tả HÌNH DẠNG (shape) của object                  │
  │ → Chứa: property names, offsets, attributes            │
  │ → Objects cùng shape → CHIA SẺ Hidden Class!           │
  │ → Giúp V8 tối ưu truy xuất property (inline caching)  │
  ├─────────────────────────────────────────────────────────┤
  │ Properties Storage                                      │
  │ → Named properties: lưu theo key (string/symbol)       │
  │ → In-object properties: nhanh nhất (trực tiếp trên obj)│
  │ → Fast properties: mảng riêng, truy cập bằng offset   │
  │ → Slow/Dictionary properties: hash table (khi quá nhiều)│
  ├─────────────────────────────────────────────────────────┤
  │ Elements Storage                                        │
  │ → Indexed properties: key là số (0, 1, 2...)           │
  │ → Lưu riêng trong mảng liên tục                        │
  │ → Packed vs Holey arrays (có lỗ hổng hay không)        │
  └─────────────────────────────────────────────────────────┘

  MINH HỌA:
  var obj = { name: 'Jun', age: 25 };

  Memory Layout:
  ┌──────────────┐
  │ Hidden Class  │ ← shape: { name: offset 0, age: offset 1 }
  ├──────────────┤
  │ name: 'Jun'  │ ← in-object property (nhanh!)
  │ age: 25      │ ← in-object property (nhanh!)
  └──────────────┘

  KHI NÀO CHUYỂN SANG SLOW MODE (Dictionary)?
  → Xóa property (delete obj.prop)
  → Thêm quá nhiều properties động
  → Object.defineProperty() với non-default attributes
  → Prototype chain phức tạp

  ⚠️ PRO TIP cho phỏng vấn:
  → Object trong JS thực chất là Hash Table
  → V8 tối ưu bằng Hidden Class + Inline Caching
  → Cùng shape → cùng Hidden Class → truy xuất nhanh!
```

---

## §3. Symbol — Ứng dụng thực tế & Tự triển khai

```
SYMBOL — KIỂU DỮ LIỆU "DUY NHẤT":
═══════════════════════════════════════════════════════════════

  Symbol() tạo ra giá trị HOÀN TOÀN DUY NHẤT!
  → Không bao giờ trùng lặp
  → Không thể tạo bằng new (không phải constructor)
  → Có thể có description (mô tả) nhưng KHÔNG ảnh hưởng tính duy nhất

  Symbol('foo') === Symbol('foo')  // false! ← Luôn khác nhau!
```

### 3a. Ứng dụng thực tế

```javascript
// ① PROPERTY KEY DUY NHẤT — Tránh xung đột tên
const s1 = Symbol("id");
const s2 = Symbol("id");
const obj = {
  [s1]: "value1",
  [s2]: "value2", // Khác s1! Không ghi đè!
};

// ② HẰNG SỐ ENUM — Giá trị không trùng lặp
const COLOR = {
  RED: Symbol("red"),
  GREEN: Symbol("green"),
  BLUE: Symbol("blue"),
};
// Không ai có thể vô tình tạo ra giá trị trùng!
// if (color === COLOR.RED) → chỉ match chính xác

// ③ THAY THẾ MAGIC STRINGS
// ❌ Trước: if (type === 'triangle') { ... }
// ✅ Sau:
const SHAPE = { TRIANGLE: Symbol("triangle") };
// if (type === SHAPE.TRIANGLE) { ... }

// ④ PRIVATE-LIKE PROPERTIES
const _private = Symbol("private");
class MyClass {
  constructor() {
    this[_private] = "secret"; // "Ẩn" khỏi for...in, Object.keys()
  }
  getSecret() {
    return this[_private];
  }
}
// Object.keys(instance) → [] ← Không thấy _private!
// Nhưng Object.getOwnPropertySymbols(instance) → [Symbol(private)]
// → Không thực sự private, chỉ "ẩn" khỏi enumeration

// ⑤ WELL-KNOWN SYMBOLS — Tùy chỉnh hành vi built-in
class MyArray {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance); // Tùy chỉnh instanceof!
  }
}
[] instanceof MyArray; // true!

// Symbol.iterator — Cho phép for...of
const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    return {
      next() {
        return current <= last
          ? { value: current++, done: false }
          : { done: true };
      },
    };
  },
};
for (const num of range) console.log(num); // 1, 2, 3, 4, 5

// ⑥ Symbol.toPrimitive — Tùy chỉnh ép kiểu
const money = {
  value: 100,
  currency: "VND",
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.value;
    if (hint === "string") return `${this.value} ${this.currency}`;
    return this.value; // default
  },
};
+money; // 100 (number hint)
`${money}`; // "100 VND" (string hint)
money + 50; // 150 (default hint)

// ⑦ Symbol.for() — Global Symbol Registry
Symbol.for("app.id") === Symbol.for("app.id"); // true! ← CHIA SẺ!
// → Khác với Symbol('app.id') thông thường
// → Symbol.keyFor(sym) trả về key đã đăng ký
```

### 3b. Tự triển khai Symbol đơn giản

```javascript
(function () {
  var root = this; // window hoặc global
  var SymbolPolyfill = function Symbol(description) {
    // ① Không cho dùng new
    if (this instanceof SymbolPolyfill) {
      throw new TypeError("Symbol is not a constructor");
    }
    // ② Tạo key DUY NHẤT
    var descStr = description === undefined ? "" : String(description);
    var symbol = Object.create({
      // ③ toString trả về description
      toString: function () {
        return "Symbol(" + descStr + ")";
      },
      // ④ valueOf throw error (như spec)
      valueOf: function () {
        throw new Error("Cannot convert a Symbol to a number");
      },
    });
    return symbol;
  };

  // ⑤ Symbol.for — global registry
  var globalSymbols = {};
  SymbolPolyfill.for = function (key) {
    if (globalSymbols[key]) return globalSymbols[key];
    var sym = SymbolPolyfill(key);
    globalSymbols[key] = sym;
    return sym;
  };

  root.SymbolPolyfill = SymbolPolyfill;
})();
```

```
WELL-KNOWN SYMBOLS QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────┬─────────────────────────────────────┐
  │ Symbol               │ Tác dụng                            │
  ├──────────────────────┼─────────────────────────────────────┤
  │ Symbol.iterator      │ Cho phép for...of                   │
  │ Symbol.hasInstance    │ Tùy chỉnh instanceof                │
  │ Symbol.toPrimitive   │ Tùy chỉnh ép kiểu                  │
  │ Symbol.toStringTag   │ Tùy chỉnh Object.prototype.toString│
  │ Symbol.species       │ Tùy chỉnh constructor của derived   │
  │ Symbol.isConcatSpread│ Tùy chỉnh Array.concat flatten     │
  └──────────────────────┴─────────────────────────────────────┘
```

---

## §4. Biến lưu trữ trong bộ nhớ như thế nào

```
STACK vs HEAP — 2 VÙNG NHỚ:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │ STACK (Ngăn xếp)           │ HEAP (Bộ nhớ Heap)        │
  │                            │                            │
  │ Primitive values:          │ Objects/Arrays/Functions:  │
  │ ┌──────────┐              │ ┌─────────────────────┐    │
  │ │ num = 42 │              │ │ { name: 'Jun',      │    │
  │ ├──────────┤              │ │   age: 25 }         │    │
  │ │ str='hi' │              │ └─────────────────────┘    │
  │ ├──────────┤              │         ↑                   │
  │ │ bool=true│              │         │ Tham chiếu        │
  │ ├──────────┤              │ ┌───────────────────────┐   │
  │ │ obj=0xAF │──────────────│→│ [1, 2, 3]             │   │
  │ ├──────────┤              │ └───────────────────────┘   │
  │ │ arr=0xBF │──────────────│→│ function() { ... }    │   │
  │ └──────────┘              │ └───────────────────────┘   │
  └────────────────────────────┴────────────────────────────┘

  STACK:
  → Kích thước CỐ ĐỊNH, truy cập NHANH
  → Lưu: primitive values, biến local, function call frames
  → LIFO (Last In, First Out)
  → Tự động dọn dẹp khi function return

  HEAP:
  → Kích thước ĐỘNG, truy cập CHẬM hơn
  → Lưu: objects, arrays, functions
  → Garbage Collector dọn dẹp (Mark & Sweep)
  → Biến trên stack chỉ lưu POINTER (địa chỉ) → object trên heap

  TẠI SAO PRIMITIVE TRÊN STACK?
  → Kích thước nhỏ, cố định (number = 8 bytes)
  → Truy cập nhanh, stack operations = O(1)

  TẠI SAO OBJECT TRÊN HEAP?
  → Kích thước KHÔNG xác định trước (có thể thêm/xóa props)
  → Cần quản lý bộ nhớ động
```

```
NUMBER LƯU NHƯ THẾ NÀO — IEEE 754 DOUBLE:
═══════════════════════════════════════════════════════════════

  64-bit double precision floating point:

  ┌──┬────────────┬──────────────────────────────────────────┐
  │S │ Exponent   │ Mantissa (Fraction)                      │
  │1 │ 11 bits    │ 52 bits                                  │
  └──┴────────────┴──────────────────────────────────────────┘

  S = Sign bit (0 = dương, 1 = âm)
  Exponent = Số mũ (quyết định phạm vi)
  Mantissa = Phần định trị (quyết định độ chính xác)

  → Max value: ±1.7976931348623157 × 10³⁰⁸
  → Max safe integer: 2⁵³ - 1 = 9,007,199,254,740,991
  → Min precision: 5 × 10⁻³²⁴
```

---

## §5. Built-in Objects & Boxing / Unboxing

```
BUILT-IN WRAPPER OBJECTS:
═══════════════════════════════════════════════════════════════

  Primitive          │ Wrapper Object
  ─────────────────  │ ──────────────
  number             │ Number
  string             │ String
  boolean            │ Boolean
  symbol             │ Symbol
  bigint             │ BigInt
  null               │ ❌ KHÔNG CÓ
  undefined          │ ❌ KHÔNG CÓ

  BOXING (Đóng hộp) — Primitive → Object:
  → Khi gọi method trên primitive, JS tự động "boxing"
  → Tạo wrapper object TẠM THỜI → gọi method → HỦY ngay!
```

```javascript
// BOXING TỰ ĐỘNG (AutoBoxing):
var str = "hello";
str.length; // 5 — Nhưng khoan, str là primitive mà?!

// Thực tế JS làm:
// ① Tạo wrapper: var temp = new String('hello')
// ② Truy cập: temp.length → 5
// ③ Hủy: temp = null (garbage collected!)
// → Str vẫn là primitive, KHÔNG bị thay đổi!

// CHỨNG MINH boxing là tạm thời:
var s = "test";
s.myProp = 42; // boxing → gán vào wrapper → wrapper bị hủy!
console.log(s.myProp); // undefined! ← Wrapper cũ đã bị hủy!

// BOXING THỦ CÔNG:
var numObj = new Number(42);
typeof numObj; // "object" — KHÔNG phải "number"!
typeof 42; // "number"
numObj == 42; // true (loose equality, unbox!)
numObj === 42; // false! (strict: object !== number)

// BOXING VỚI Object():
Object(42); // Number {42}
Object("hi"); // String {'hi'}
Object(true); // Boolean {true}
Object(Symbol()); // Symbol {Symbol()}

// UNBOXING (Mở hộp) — Object → Primitive:
// Gọi valueOf() hoặc toString()
var numObj = new Number(42);
numObj.valueOf(); // 42 (primitive number!)
numObj.toString(); // "42" (primitive string!)

// Unboxing tự động xảy ra khi:
numObj + 8; // 50 — tự gọi valueOf()!
`${numObj}`; // "42" — tự gọi toString()!
```

```
TỐ PHẨM BIẾN ĐỔI — ToPrimitive Algorithm:
═══════════════════════════════════════════════════════════════

  Khi JS cần chuyển Object → Primitive, nó gọi:

  ① Kiểm tra Symbol.toPrimitive (nếu có) → gọi trực tiếp!
  ② Nếu hint = "number":
     → valueOf() trước → nếu primitive → DÙNG!
     → toString() sau → nếu primitive → DÙNG!
     → Cả 2 không primitive → TypeError!
  ③ Nếu hint = "string":
     → toString() trước → nếu primitive → DÙNG!
     → valueOf() sau → nếu primitive → DÙNG!
     → Cả 2 không primitive → TypeError!
  ④ Nếu hint = "default":
     → Giống "number" (trừ Date: giống "string")

  ⚠️ QUAN TRỌNG: KHÔNG BAO GIỜ dùng new Boolean/Number/String!
  → new Boolean(false) là TRUTHY! (vì nó là object!)
  → if (new Boolean(false)) { ... } ← SẼ CHẠY! 💀
```

---

## §6. Value Types vs Reference Types

```
VALUE TYPE (Kiểu giá trị) vs REFERENCE TYPE (Kiểu tham chiếu):
═══════════════════════════════════════════════════════════════

  VALUE TYPE (Primitives):
  → Lưu TRỰC TIẾP giá trị trên stack
  → Copy = tạo BẢN SAO MỚI hoàn toàn
  → So sánh bằng GIÁ TRỊ

  REFERENCE TYPE (Objects):
  → Stack lưu POINTER → Heap lưu giá trị thực
  → Copy = copy POINTER (cùng trỏ 1 object!)
  → So sánh bằng THAM CHIẾU (cùng pointer không?)
```

```javascript
// VALUE TYPE — Copy là bản sao độc lập:
var a = 10;
var b = a; // b = 10 (copy giá trị)
b = 20;
console.log(a); // 10 ← Không ảnh hưởng!

// REFERENCE TYPE — Copy là chia sẻ:
var obj1 = { name: "Jun" };
var obj2 = obj1; // obj2 trỏ CÙNG object!
obj2.name = "Lee";
console.log(obj1.name); // 'Lee' ← BỊ ẢNH HƯỞNG! 💀

// MINH HỌA TRÊN MEMORY:
// Value type:
// Stack: [a=10] [b=10] → 2 ô nhớ khác nhau

// Reference type:
// Stack: [obj1=0xAF] [obj2=0xAF] → CÙNG 1 ĐỊA CHỈ!
// Heap:  0xAF → { name: 'Lee' } ← Cùng 1 object!

// SO SÁNH:
var arr1 = [1, 2, 3];
var arr2 = [1, 2, 3];
arr1 === arr2; // false! ← Khác pointer, dù cùng nội dung!

var arr3 = arr1;
arr1 === arr3; // true! ← Cùng pointer!

// ĐẶC BIỆT — string là immutable!
var s = "hello";
s[0] = "H"; // KHÔNG có tác dụng!
console.log(s); // 'hello' ← Không thay đổi!
// → String primitive KHÔNG THỂ thay đổi nội dung!
```

```
FUNCTION PARAMETER PASSING:
═══════════════════════════════════════════════════════════════

  JS luôn truyền THEO GIÁ TRỊ (pass by value)!
  Nhưng giá trị đó có thể là POINTER!

  // Primitive: copy giá trị
  function change(x) { x = 100; }
  var a = 1;
  change(a);
  console.log(a); // 1 ← Không đổi!

  // Object: copy pointer
  function change(obj) { obj.name = 'Lee'; }
  var person = { name: 'Jun' };
  change(person);
  console.log(person.name); // 'Lee' ← ĐỔI! (cùng pointer)

  // NHƯNG nếu reassign parameter:
  function change(obj) {
      obj = { name: 'Lee' }; // ← Tạo OBJECT MỚI, gán cho copy pointer
  }
  var person = { name: 'Jun' };
  change(person);
  console.log(person.name); // 'Jun' ← Không đổi! (pointer gốc không đổi)
```

---

## §7. null vs undefined

```
null vs undefined — KHÁC NHAU NHƯ THẾ NÀO:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬───────────────────┬────────────────────────┐
  │                │ null              │ undefined              │
  ├────────────────┼───────────────────┼────────────────────────┤
  │ Ý nghĩa        │ "Không có gì"    │ "Chưa được định nghĩa" │
  │                │ CÓ CHỦ ĐÍCH      │ CHƯA GÁN GIÁ TRỊ      │
  ├────────────────┼───────────────────┼────────────────────────┤
  │ typeof         │ "object" ← BUG!  │ "undefined"            │
  ├────────────────┼───────────────────┼────────────────────────┤
  │ Number()       │ 0                │ NaN                    │
  ├────────────────┼───────────────────┼────────────────────────┤
  │ Boolean()      │ false            │ false                  │
  ├────────────────┼───────────────────┼────────────────────────┤
  │ == so sánh     │ null == undefined│ → true!                │
  │ === so sánh    │ null === undefined│ → false!              │
  ├────────────────┼───────────────────┼────────────────────────┤
  │ Khi nào xuất   │ Lập trình viên   │ JS engine tự gán:     │
  │ hiện?          │ chủ động gán     │ • biến chưa gán        │
  │                │                   │ • tham số không truyền │
  │                │                   │ • object prop không có │
  │                │                   │ • function không return│
  └────────────────┴───────────────────┴────────────────────────┘

  TẠI SAO typeof null === "object"?
  → BUG TỪ PHIÊN BẢN ĐẦU TIÊN CỦA JS (1995)!
  → Trong C implementation ban đầu:
    - Giá trị lưu dưới dạng tag + value
    - Tag 000 = object
    - null = NULL pointer = 0x00 (tất cả bit = 0)
    - Tag của null = 000 → bị nhận nhầm là object!
  → Không thể sửa được nữa (breaking change quá lớn!)

  CÁCH KIỂM TRA null CHÍNH XÁC:
  → value === null (strict equality)
  → KHÔNG dùng typeof!
```

```javascript
// KHI NÀO DÙNG null:
var element = document.getElementById("notExist"); // null
var data = null; // Khởi tạo biến sẽ gán object sau
JSON.stringify({ a: undefined, b: null }); // '{"b":null}' ← undefined bị bỏ!

// KHI NÀO GẶP undefined:
var x;
console.log(x); // undefined (chưa gán)
function f(a) {
  console.log(a);
}
f(); // undefined (thiếu tham số)
var o = {};
console.log(o.name); // undefined (property không có)
function g() {}
console.log(g()); // undefined (không return)

// VOID operator — luôn trả về undefined:
void 0; // undefined
void "hello"; // undefined
// → Đảm bảo nhận được undefined thật (tránh bị ghi đè trong ES3!)
```

---

## §8. 3+ cách kiểm tra kiểu dữ liệu

### 8a. typeof

```javascript
// TYPEOF — Nhanh nhưng HẠN CHẾ:
typeof 42; // "number"
typeof "str"; // "string"
typeof true; // "boolean"
typeof undefined; // "undefined"
typeof Symbol(); // "symbol"
typeof 42n; // "bigint"
typeof function () {}; // "function"   ← Đặc biệt!
typeof {}; // "object"
typeof []; // "object"     ← Không phân biệt array!
typeof null; // "object"     ← BUG! 💀
typeof new Date(); // "object"     ← Không phân biệt!
typeof /regex/; // "object"     ← Không phân biệt!
```

```
TYPEOF — ƯU NHƯỢC:
  ✅ Ưu: Nhanh, đơn giản, phân biệt function
  ❌ Nhược: null → "object" (bug), không phân biệt
           Array, Date, RegExp, Map, Set...
  → Chỉ tốt cho: primitive + function
```

### 8b. instanceof

```javascript
// INSTANCEOF — Kiểm tra PROTOTYPE CHAIN:
[] instanceof Array;       // true
{} instanceof Object;      // true
new Date() instanceof Date; // true
/regex/ instanceof RegExp;  // true

// NHƯNG:
42 instanceof Number;     // false! ← Primitive, không phải object!
'str' instanceof String;  // false!
true instanceof Boolean;  // false!

// TỰ TRIỂN KHAI instanceof:
function myInstanceof(left, right) {
    let proto = Object.getPrototypeOf(left);
    const prototype = right.prototype;
    while (proto !== null) {
        if (proto === prototype) return true;
        proto = Object.getPrototypeOf(proto);
    }
    return false;
}
```

```
INSTANCEOF — ƯU NHƯỢC:
  ✅ Ưu: Phân biệt Array, Date, RegExp, custom class
  ❌ Nhược: Không hoạt động với primitives!
           Có thể bị đánh lừa bởi Symbol.hasInstance
           Lỗi với cross-iframe (khác prototype chain!)
```

### 8c. Object.prototype.toString.call() — CHÍNH XÁC NHẤT!

```javascript
// TOSTRING — CHÍNH XÁC NHẤT!
Object.prototype.toString.call(42); // "[object Number]"
Object.prototype.toString.call("str"); // "[object String]"
Object.prototype.toString.call(true); // "[object Boolean]"
Object.prototype.toString.call(undefined); // "[object Undefined]"
Object.prototype.toString.call(null); // "[object Null]"       ← ĐÚNG!
Object.prototype.toString.call(Symbol()); // "[object Symbol]"
Object.prototype.toString.call(42n); // "[object BigInt]"
Object.prototype.toString.call({}); // "[object Object]"
Object.prototype.toString.call([]); // "[object Array]"     ← ĐÚNG!
Object.prototype.toString.call(function () {}); // "[object Function]"
Object.prototype.toString.call(new Date()); // "[object Date]"      ← ĐÚNG!
Object.prototype.toString.call(/regex/); // "[object RegExp]"    ← ĐÚNG!
Object.prototype.toString.call(new Map()); // "[object Map]"
Object.prototype.toString.call(new Set()); // "[object Set]"

// HÀM TIỆN ÍCH:
function getType(value) {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}
getType([]); // "array"
getType(null); // "null"
getType(42); // "number"
```

```
TOSTRING — ƯU NHƯỢC:
  ✅ Ưu: CHÍNH XÁC NHẤT! Phân biệt TẤT CẢ kiểu!
           Hoạt động với cả primitive + object
           Hoạt động cross-iframe
  ❌ Nhược: Cú pháp dài, có thể bị override bởi Symbol.toStringTag
```

### 8d. Kiểm tra Array chính xác

```javascript
// 4 CÁCH KIỂM TRA ARRAY:
// ① Array.isArray() — TỐT NHẤT! ⭐
Array.isArray([]); // true
Array.isArray({}); // false
Array.isArray("string"); // false
// → Hoạt động cross-iframe!

// ② instanceof
[] instanceof Array; // true
// ⚠️ Lỗi với cross-iframe!

// ③ Object.prototype.toString
Object.prototype.toString.call([]) === "[object Array]"; // true

// ④ Constructor
[].constructor === Array; // true
// ⚠️ Có thể bị ghi đè!

// THỨ TỰ ƯU TIÊN: Array.isArray > toString > instanceof > constructor
```

```
BẢNG SO SÁNH 4 PHƯƠNG PHÁP:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────┬────────┬─────────┬───────┬───────────┐
  │                      │ typeof │instance │ toString │ Array.is │
  ├──────────────────────┼────────┼─────────┼───────┼───────────┤
  │ Primitives           │ ✅     │ ❌      │ ✅    │ n/a       │
  │ null                 │ ❌ bug │ ❌      │ ✅    │ n/a       │
  │ Array                │ ❌     │ ✅      │ ✅    │ ✅ ⭐     │
  │ Date/RegExp          │ ❌     │ ✅      │ ✅    │ n/a       │
  │ Cross-iframe         │ ✅     │ ❌      │ ✅    │ ✅        │
  │ Performance          │ ⭐ tốt │ tốt     │ chậm  │ tốt       │
  └──────────────────────┴────────┴─────────┴───────┴───────────┘
```

---

## §9. Implicit Type Conversion (Ép kiểu ngầm)

```
KHI NÀO XẢY RA ÉP KIỂU NGẦM:
═══════════════════════════════════════════════════════════════

  ① Toán tử + (cộng)
  ② Toán tử == (so sánh lỏng)
  ③ if / while / ternary (boolean context)
  ④ Toán tử logic: !, &&, ||
  ⑤ Toán tử toán học: -, *, /, %
  ⑥ Template literals: `${value}`
```

### 9a. Toán tử + (phức tạp nhất!)

```javascript
// QUY TẮC + : Nếu 1 vế là string → STRING CONCATENATION!
//             Nếu không → NUMBER ADDITION!

1 + '2'       // "12"    ← 1 → "1", "1" + "2"
'3' + 4       // "34"    ← 4 → "4"
1 + 2         // 3       ← Cả 2 là number → cộng
true + 1      // 2       ← true → 1
false + 'hi'  // "falsehi" ← false → "false"
null + 1      // 1       ← null → 0
undefined + 1 // NaN     ← undefined → NaN
[] + []       // ""      ← [] → "" (toString), "" + ""
[] + {}       // "[object Object]"
{} + []       // 0       ← {} bị hiểu là block! +[] → 0
[1] + [2]     // "12"    ← [1]→"1", [2]→"2"

// OBJECT + PRIMITIVE:
// Object gọi ToPrimitive (hint "default"):
// ① valueOf() → nếu primitive → dùng
// ② toString() → nếu primitive → dùng
var obj = {
    valueOf() { return 42; }
};
obj + 8;      // 50 ← valueOf() trả về 42 (primitive!)

var obj2 = {
    toString() { return 'hello'; }
};
obj2 + '!';   // "hello!" ← toString() trả về string
```

### 9b. Toán tử == (so sánh lỏng)

```javascript
// QUY TẮC == (Abstract Equality):
// ① Cùng kiểu → so sánh bình thường
// ② null == undefined → true (ĐẶC BIỆT!)
// ③ Number vs String → String → Number
// ④ Boolean vs anything → Boolean → Number trước
// ⑤ Object vs Primitive → Object → ToPrimitive

false == 0     // true  ← false → 0, 0 == 0
false == ''    // true  ← false → 0, '' → 0
'' == 0        // true  ← '' → 0
null == 0      // false ← ĐẶC BIỆT! null chỉ == undefined
null == false  // false ← ĐẶC BIỆT!
null == undefined // true ← QUY TẮC ĐẶC BIỆT!
null == null   // true
NaN == NaN     // false ← NaN KHÔNG bằng chính nó!

// CÁC CÂU ĐỐ KINH ĐIỂN:
[] == false    // true  ← [] → "" → 0, false → 0, 0==0
[] == ![]      // true! ← ![] = false, [] → 0, false → 0 💀
'' == false    // true
' ' == false   // true  ← ' ' → 0
[null] == ''   // true  ← [null].toString() = ""
{} == '[object Object]' // true ← {}.toString()
```

```
== CONVERSION CHAIN CHI TIẾT:
═══════════════════════════════════════════════════════════════

  [] == ![]
  ① ![] = false          ([] là truthy → ![] = false)
  ② [] == false
  ③ false → 0            (Boolean → Number)
  ④ [] == 0
  ⑤ [] → ToPrimitive → [].valueOf() = [] (không primitive)
     → [].toString() = "" (primitive!)
  ⑥ "" == 0
  ⑦ "" → 0              (String → Number)
  ⑧ 0 == 0              → TRUE! 💀
```

### 9c. Boolean Context (Truthy/Falsy)

```javascript
// 8 GIÁ TRỊ FALSY (chuyển thành false):
Boolean(false); // false
Boolean(0); // false
Boolean(-0); // false
Boolean(0n); // false (BigInt zero)
Boolean(""); // false
Boolean(null); // false
Boolean(undefined); // false
Boolean(NaN); // false

// TẤT CẢ KHÁC = TRUTHY! Kể cả:
Boolean([]); // true! ← Mảng rỗng = truthy! ⚠️
Boolean({}); // true! ← Object rỗng = truthy!
Boolean("false"); // true! ← String 'false' = truthy!
Boolean("0"); // true! ← String '0' = truthy!
Boolean(new Boolean(false)); // true! ← Object = truthy! 💀
```

### 9d. Cách tránh & ứng dụng

```javascript
// ✅ LUÔN DÙNG === (strict equality)
0 === false; // false ← An toàn!
"" === false; // false ← An toàn!
null === undefined; // false ← An toàn!

// ✅ Chuyển đổi rõ ràng (explicit conversion):
Number("42"); // 42
String(42); // "42"
Boolean(42); // true
parseInt("42px"); // 42

// ✅ ỨNG DỤNG HAY:
// Double NOT (!!) — chuyển thành boolean
!!0; // false
!!""; // false
!!null; // false
!!42; // true
!!"hello" + // true
  // Unary plus (+) — chuyển thành number
  "42" + // 42
  true + // 1
  null + // 0
  undefined; // NaN

// String concatenation — chuyển thành string
42 + ""; // "42"
true + ""; // "true"
```

---

## §10. Precision Loss & Large Numbers

```
TẠI SAO 0.1 + 0.2 !== 0.3?
═══════════════════════════════════════════════════════════════

  0.1 + 0.2 = 0.30000000000000004  ← SAI! 💀

  NGUYÊN NHÂN: IEEE 754 Double — số thực lưu dưới dạng NHỊP PHÂN 2
  → 0.1 trong nhị phân = 0.0001100110011... (LẶP VÔ HẠN!)
  → 0.2 trong nhị phân = 0.0011001100110... (LẶP VÔ HẠN!)
  → Mantissa chỉ có 52 bit → BỊ CẮT, MẤT ĐỘ CHÍNH XÁC!
  → Cộng 2 số đã bị cắt → kết quả sai!

  QUY TRÌNH CHI TIẾT:
  ① 0.1 → Binary: 0.00011001100110011... (lặp 0011)
  ② Cắt ở 52 bit mantissa → MẤT precision
  ③ 0.2 → Binary: 0.0011001100110011... (lặp 0011)
  ④ Cắt ở 52 bit mantissa → MẤT precision
  ⑤ Cộng 2 số đã cắt → tích lũy sai số!
  ⑥ Chuyển lại decimal → 0.30000000000000004

  KHÔNG CHỈ JS! Tất cả ngôn ngữ dùng IEEE 754 đều bị:
  Python, Java, C++, Ruby...
```

```javascript
// CÁCH TRÁNH MẤT ĐỘ CHÍNH XÁC:

// ① Number.EPSILON (sai số cho phép)
function isEqual(a, b) {
  return Math.abs(a - b) < Number.EPSILON; // 2.220446049250313e-16
}
isEqual(0.1 + 0.2, 0.3); // true! ✅

// ② Nhân lên thành số nguyên rồi chia:
(0.1 * 10 + 0.2 * 10) / 10; // 0.3 ✅
// ⚠️ Cẩn thận: 0.1 * 10 = 1 (đúng), nhưng
// 35.41 * 100 = 3540.9999... (vẫn sai!) → Dùng Math.round()

// ③ Thư viện chuyên dụng:
// → decimal.js
// → big.js
// → bignumber.js
// Tính toán bằng STRING, không bị IEEE 754!
```

```
GIỚI HẠN SỐ TRONG JAVASCRIPT:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────┬──────────────────────────────────┐
  │ Hằng số                 │ Giá trị                          │
  ├─────────────────────────┼──────────────────────────────────┤
  │ Number.MAX_VALUE        │ 1.7976931348623157 × 10³⁰⁸       │
  │ Number.MIN_VALUE        │ 5 × 10⁻³²⁴ (nhỏ nhất > 0)      │
  │ Number.MAX_SAFE_INTEGER │ 2⁵³ - 1 = 9,007,199,254,740,991│
  │ Number.MIN_SAFE_INTEGER │ -(2⁵³ - 1)                      │
  │ Number.POSITIVE_INFINITY│ Infinity                         │
  │ Number.NEGATIVE_INFINITY│ -Infinity                        │
  │ Number.EPSILON          │ 2⁻⁵² ≈ 2.22 × 10⁻¹⁶            │
  └─────────────────────────┴──────────────────────────────────┘

  MAX_SAFE_INTEGER (2⁵³ - 1):
  → Vượt quá số này → SỐ BỊ SAI!
  9007199254740992 === 9007199254740993  // true! 💀
  → Mantissa 52 bit + 1 hidden bit = 53 bit
  → Số nguyên > 2⁵³ không thể biểu diễn chính xác!

  Number.isSafeInteger(9007199254740991);  // true
  Number.isSafeInteger(9007199254740992);  // false!
```

```javascript
// XỬ LÝ SỐ LỚN:

// ① BigInt (ES2020) — CÁCH TỐT NHẤT! ⭐
const a = 9007199254740991n; // Thêm "n"
const b = BigInt("9007199254740991");
a + 1n; // 9007199254740992n ← CHÍNH XÁC!

// ⚠️ BigInt KHÔNG trộn với Number:
// 1n + 2   // TypeError! Phải cùng kiểu!
1n + BigInt(2); // 3n ✅

// ⚠️ BigInt KHÔNG hỗ trợ: Math.*, JSON.stringify (cần custom)
// ⚠️ Không dùng trong ===: 1n === 1 // false! (khác kiểu)
//    Nhưng: 1n == 1 // true (loose equality)

// ② Cộng số lớn bằng string (phỏng vấn thường hỏi!):
function addLargeNumbers(a, b) {
  const arrA = a.split("").reverse();
  const arrB = b.split("").reverse();
  const result = [];
  let carry = 0;
  const maxLen = Math.max(arrA.length, arrB.length);

  for (let i = 0; i < maxLen || carry; i++) {
    const sum = parseInt(arrA[i] || 0) + parseInt(arrB[i] || 0) + carry;
    result.push(sum % 10);
    carry = Math.floor(sum / 10);
  }
  return result.reverse().join("");
}
addLargeNumbers("9007199254740991", "1234567890123456789");
// "1234576897322711780" ← CHÍNH XÁC! ✅

// ③ JSON chứa số lớn:
// Backend trả về: {"id": 9007199254740993}
// JSON.parse → id = 9007199254740992 ← SAI!
// GIẢI PHÁP: Backend trả string: {"id": "9007199254740993"}
```

---

## §11. Tổng kết & Checklist phỏng vấn

```
MIND MAP TỔNG QUAN:
═══════════════════════════════════════════════════════════════

  JS Variables & Types
  ├── 8 kiểu: 7 primitive + Object
  ├── Object internals: Hidden Class + Properties + Elements
  ├── Symbol: duy nhất, 7 ứng dụng, well-known symbols
  ├── Memory: Stack (primitive) vs Heap (object → pointer)
  ├── Boxing: Primitive ←→ Wrapper Object (auto/manual)
  ├── Value vs Reference: copy giá trị vs copy pointer
  ├── null vs undefined: chủ đích vs chưa gán
  ├── Type detection: typeof < instanceof < toString < Array.isArray
  ├── Implicit conversion: +, ==, if, ToPrimitive algorithm
  └── Precision: IEEE 754, 0.1+0.2, MAX_SAFE_INTEGER, BigInt
```

### Checklist

- [ ] **8 kiểu dữ liệu**: Number, String, Boolean, null, undefined, Symbol, BigInt + Object
- [ ] **Object nội bộ (V8)**: Hidden Class (shape), in-object properties, fast/slow (dictionary) mode
- [ ] **Symbol 7 ứng dụng**: unique key, enum, magic string, private-like, hasInstance, iterator, toPrimitive
- [ ] **Symbol.for() vs Symbol()**: global registry (shared) vs luôn tạo mới (unique)
- [ ] **Stack vs Heap**: primitives trên stack (cố định, nhanh), objects trên heap (động, pointer trên stack)
- [ ] **IEEE 754**: 64-bit double, 1 sign + 11 exponent + 52 mantissa
- [ ] **Boxing**: `'str'.length` → tạo `new String('str')` tạm → truy cập → hủy
- [ ] **Unboxing**: `valueOf()` / `toString()` → ToPrimitive algorithm (hint: number/string/default)
- [ ] **⚠️ new Boolean(false)** là TRUTHY! (object) → KHÔNG BAO GIỜ dùng new với wrapper!
- [ ] **Value vs Reference**: copy primitive = bản sao mới; copy object = chia sẻ pointer
- [ ] **Function params**: pass by value (nhưng value có thể là pointer!)
- [ ] **null**: chủ đích gán, typeof = "object" (bug lịch sử, C tag 000), Number(null) = 0
- [ ] **undefined**: chưa gán/thiếu param/prop không có/không return, Number(undefined) = NaN
- [ ] **typeof**: nhanh nhưng null = "object", array = "object", date = "object"
- [ ] **instanceof**: kiểm tra prototype chain, KHÔNG hoạt động với primitives, lỗi cross-iframe
- [ ] **Object.prototype.toString.call()**: CHÍNH XÁC NHẤT! "[object Type]", hoạt động mọi kiểu
- [ ] **Array.isArray()**: tốt nhất cho array, cross-iframe safe
- [ ] **8 falsy values**: false, 0, -0, 0n, '', null, undefined, NaN. Còn lại = truthy (kể cả [], {}, '0')
- [ ] **`[] == ![]` = true**: ![] → false → 0, [] → "" → 0, 0 == 0 → true!
- [ ] **0.1 + 0.2 !== 0.3**: IEEE 754, nhị phân lặp vô hạn bị cắt ở 52 bit, fix bằng EPSILON/nhân lên/thư viện
- [ ] **MAX_SAFE_INTEGER**: 2⁵³ - 1 = 9,007,199,254,740,991, vượt quá → số bị sai
- [ ] **BigInt**: thêm `n`, KHÔNG trộn với Number, fix large number, JSON trả string
- [ ] **Cộng số lớn bằng string**: reverse → digit-by-digit + carry → reverse kết quả

---

_Nguồn: ConardLi — "JavaScript Biến và Kiểu Dữ Liệu" · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
