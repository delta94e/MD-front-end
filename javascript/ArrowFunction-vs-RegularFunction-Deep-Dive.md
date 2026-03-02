# Arrow Function vs Regular Function — Deep Dive!

> **Từ cú pháp đến engine: this, prototype, arguments!**
> Dynamic vs Lexical binding, constructor, best practices!

---

## §1. Cú Pháp — So Sánh Trực Quan!

```javascript
// ═══════════════════════════════════════════════════════════
// REGULAR FUNCTION — 2 cách khai báo!
// ═══════════════════════════════════════════════════════════

// ① Function Declaration (hoisting!) ★
function add(a, b) {
  return a + b;
}

// ② Function Expression (không hoisting!)
var sub = function (a, b) {
  return a - b;
};

// ═══════════════════════════════════════════════════════════
// ARROW FUNCTION — ES6! ★
// ═══════════════════════════════════════════════════════════

// ① Đầy đủ!
const mul = (a, b) => {
  return a * b;
};

// ② 1 tham số → bỏ ()!
const square = (x) => {
  return x * x;
};

// ③ 1 dòng → bỏ {} và return!
const double = (x) => x * 2;

// ═══════════════════════════════════════════════════════════
// BẪY: Return object literal! ★
// ═══════════════════════════════════════════════════════════

// ❌ SAI: {} bị hiểu là code block!
// const getUser = (id) => { id: id, name: 'User' };
// → SyntaxError! (id: là label, nhưng `name: 'User'` sau dấu phẩy không hợp lệ!)
// Nếu chỉ 1 field: const getId = (id) => { id: id };
// → return undefined! (id: là label, id là expression, KHÔNG return!) ❌

// ✅ ĐÚNG: Wrap trong ()! ★
const getUser = (id) => ({ id: id, name: "User" });
```

---

## §2. Đặc Tính Nội Tại!

```
  REGULAR vs ARROW — ĐẶC TÍNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬──────────────────┬──────────────────┐  │
  │  │ Đặc tính        │ Regular ★        │ Arrow ★          │  │
  │  ├──────────────────┼──────────────────┼──────────────────┤  │
  │  │ this binding      │ DYNAMIC! ★       │ LEXICAL! ★       │  │
  │  │                  │ (lúc GỌI!)       │ (lúc ĐỊNH NGHĨA!)│  │
  │  │ prototype         │ ✅ CÓ!           │ ❌ KHÔNG!        │  │
  │  │ constructor       │ ✅ new được!     │ ❌ KHÔNG new!    │  │
  │  │ arguments         │ ✅ CÓ!           │ ❌ KHÔNG! ★      │  │
  │  │ [[Construct]]     │ ✅ CÓ!           │ ❌ KHÔNG!        │  │
  │  │ [[Call]]           │ ✅ CÓ!           │ ✅ CÓ!           │  │
  │  │ call/apply/bind   │ ✅ ĐỔI this!    │ ❌ KHÔNG đổi! ★ │  │
  │  │ Hoisting          │ ✅ (declaration!) │ ❌ KHÔNG!        │  │
  │  │ Generator (*)     │ ✅ CÓ!           │ ❌ KHÔNG!        │  │
  │  └──────────────────┴──────────────────┴──────────────────┘  │
  │                                                              │
  │  TÓM LẠI:                                                       │
  │  → Regular: ĐẦY ĐỦ tính năng! (constructor, this, args!)  │
  │  → Arrow: NHẸ + GỌN! Chỉ có [[Call]]! ★                    │
  │  → Arrow thiết kế cho CALLBACK + logic, KHÔNG phải OOP!     │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. this — Khác Biệt Cốt Lõi!

```
  this BINDING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  REGULAR FUNCTION — DYNAMIC BINDING! ★                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ this phụ thuộc vào CÁCH GỌI! ★                       │    │
  │  │                                                      │    │
  │  │ ① Default: fn()                                       │    │
  │  │    → this = window (hoặc undefined strict mode!)     │    │
  │  │                                                      │    │
  │  │ ② Implicit: obj.fn()                                  │    │
  │  │    → this = obj! ★                                    │    │
  │  │                                                      │    │
  │  │ ③ Explicit: fn.call(obj) / fn.apply(obj)              │    │
  │  │    → this = obj! ★ (ép buộc!)                        │    │
  │  │                                                      │    │
  │  │ ④ new: new Fn()                                        │    │
  │  │    → this = instance mới! ★                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ARROW FUNCTION — LEXICAL BINDING! ★                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ this = this của SCOPE CHA lúc ĐỊNH NGHĨA! ★          │    │
  │  │ → KHÔNG CÓ this riêng! ★                              │    │
  │  │ → "Bắt" this từ context bao quanh!                   │    │
  │  │ → Một khi bound → KHÔNG THỂ đổi! ★                  │    │
  │  │ → call/apply/bind KHÔNG ảnh hưởng! ★                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// VÍ DỤ 1: setTimeout — BẪY KINH ĐIỂN! ★
// ═══════════════════════════════════════════════════════════

var obj = {
  name: "JavaScript",

  // ❌ Regular function trong setTimeout!
  sayRegular: function () {
    setTimeout(function () {
      console.log("Regular:", this.name);
      // ★ this = window! ❌ (setTimeout gọi callback ĐỘC LẬP!)
      // → Output: Regular: undefined ❌
    }, 100);
  },

  // ✅ Arrow function trong setTimeout! ★
  sayArrow: function () {
    setTimeout(() => {
      console.log("Arrow:", this.name);
      // ★ this = obj! ✅ (arrow bắt this từ sayArrow!)
      // → Output: Arrow: JavaScript ✅
    }, 100);
  },
};

// ═══════════════════════════════════════════════════════════
// Giải pháp trước ES6 (không có arrow!):
// ═══════════════════════════════════════════════════════════

var objOld = {
  name: "ES5",

  // CÁCH 1: var self = this! ★
  say1: function () {
    var self = this; // ★ Lưu this vào biến!
    setTimeout(function () {
      console.log(self.name); // ★ Dùng self thay this!
    }, 100);
  },

  // CÁCH 2: .bind(this)! ★
  say2: function () {
    setTimeout(
      function () {
        console.log(this.name);
      }.bind(this), // ★ Ép this = obj!
      100,
    );
  },
};

// ═══════════════════════════════════════════════════════════
// VÍ DỤ 2: call/apply KHÔNG đổi this của arrow! ★
// ═══════════════════════════════════════════════════════════

const arrowFn = () => console.log(this);

var target = { id: 1 };
arrowFn.call(target); // ★ VẪN là window! KHÔNG đổi! ★
arrowFn.apply(target); // ★ VẪN là window! KHÔNG đổi! ★
arrowFn.bind(target)(); // ★ VẪN là window! KHÔNG đổi! ★

// Regular function → call ĐỔI this! ✅
function regularFn() {
  console.log(this);
}
regularFn.call(target); // ★ this = { id: 1 }! ✅
```

---

## §4. Constructor & Prototype!

```javascript
// ═══════════════════════════════════════════════════════════
// Regular: CÓ prototype + constructor! ✅
// Arrow: KHÔNG CÓ! ❌
// ═══════════════════════════════════════════════════════════

function Person(name) {
  this.name = name;
}
Person.prototype.greet = function () {
  return "Xin chào, tôi là " + this.name;
};

console.log(Person.prototype); // { constructor: Person, greet: fn }
var p = new Person("Minh"); // ✅ OK!
console.log(p.greet()); // "Xin chào, tôi là Minh"

// Arrow function!
const ArrowPerson = (name) => {
  this.name = name;
};
console.log(ArrowPerson.prototype); // ★ undefined! ❌
// new ArrowPerson('Minh'); // ★ TypeError: not a constructor! ❌

// ═══════════════════════════════════════════════════════════
// TẠI SAO?
// ═══════════════════════════════════════════════════════════
// new Fn() cần:
// ① Tạo object mới! → cần prototype!
// ② Gọi Fn với this = object mới! → cần [[Construct]]!
// ③ Return object!
//
// Arrow function:
// → KHÔNG có [[Construct]] → step ② fail! ❌ (TypeError!)
// → KHÔNG có prototype → new object sẽ kế thừa Object.prototype
// → Chỉ có [[Call]] → chỉ GỌI được, KHÔNG new! ★
//
// Lưu ý: Lỗi thực tế là do [[Construct]] KHÔNG tồn tại,
// KHÔNG phải do thiếu prototype.
```

---

## §5. arguments!

```javascript
// ═══════════════════════════════════════════════════════════
// Regular: CÓ arguments! ✅
// Arrow: KHÔNG CÓ! ❌ (dùng rest params!)
// ═══════════════════════════════════════════════════════════

// ① Regular function — arguments object!
function sumRegular() {
  // ★ arguments = array-LIKE object (không phải array thật!)
  var total = 0;
  for (var i = 0; i < arguments.length; i++) {
    total += arguments[i];
  }
  return total;
}
console.log(sumRegular(1, 2, 3)); // 6 ✅

// ② Arrow function — KHÔNG CÓ arguments RIÊNG! ❌
// Arrow kế thừa arguments từ scope cha (nếu có)!
function outer() {
  const arrowInside = () => {
    console.log(arguments); // ★ arguments của outer()! KHÔNG phải của arrow!
  };
  arrowInside();
}
outer(1, 2, 3); // Arguments [1, 2, 3] ★ (kế thừa từ outer!)

// Nếu arrow ở TOP-LEVEL (không có function cha):
// const topArrow = () => console.log(arguments);
// topArrow(); // ★ ReferenceError: arguments is not defined! ❌

// ③ GIẢI PHÁP: Rest parameters! ★
const sumModern = (...args) => {
  let total = 0;
  for (let i = 0; i < args.length; i++) {
    total += args[i];
  }
  return total;
};
console.log(sumModern(1, 2, 3)); // 6 ✅

// ★ arguments là ARRAY-LIKE, KHÔNG phải Array!
// → arguments.map() → ERROR! ❌
// → Cần convert: Array.from(arguments)
//   hoặc: [].slice.call(arguments)
//   hoặc: dùng rest params (...args) ★
```

---

## §6. Bẫy Khi Định Nghĩa Method!

```
  BẪY OBJECT METHOD:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❌ Arrow function làm method:                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ var person = {                                         │    │
  │  │   name: 'Dev',                                         │    │
  │  │   sayHi: () => {           ← ARROW! ❌                │    │
  │  │     console.log(this.name); // this = window! ❌      │    │
  │  │   }                                                    │    │
  │  │ };                                                     │    │
  │  │ person.sayHi(); // undefined! ❌                       │    │
  │  │                                                      │    │
  │  │ TẠI SAO?                                                │    │
  │  │ → Object literal KHÔNG tạo scope mới! ★               │    │
  │  │ → Arrow bắt this từ scope NGOÀI = window! ★          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ✅ Regular function làm method:                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ var person = {                                         │    │
  │  │   name: 'Dev',                                         │    │
  │  │   sayHi: function() {      ← REGULAR! ✅              │    │
  │  │     console.log(this.name); // this = person! ✅      │    │
  │  │   }                                                    │    │
  │  │ };                                                     │    │
  │  │ person.sayHi(); // "Dev" ✅                            │    │
  │  │                                                      │    │
  │  │ TẠI SAO?                                                │    │
  │  │ → person.sayHi() → implicit binding!                  │    │
  │  │ → this = object TRƯỚC dấu chấm = person! ★           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHI NÀO DÙNG GÌ?                                              │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Tình huống      │ Dùng                            │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ Object method     │ Regular! ★ (this = object!)      │    │
  │  │ Prototype method  │ Regular! ★ (this = instance!)    │    │
  │  │ Event handler     │ Regular nếu cần this = element!     │    │
  │  │                         │ Arrow OK nếu dùng e.target! ★     │    │
  │  │ Callback (map...) │ Arrow! ★ (giữ this ngoài!)     │    │
  │  │ setTimeout         │ Arrow! ★ (giữ this ngoài!)     │    │
  │  │ Promise .then()   │ Arrow! ★ (giữ this ngoài!)     │    │
  │  │ React method      │ Arrow! ★ (auto-bind this!)       │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI + CÁCH TRẢ LỜI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ "Arrow function khác regular function thế nào?"              │
  │                                                              │
  │  BƯỚC 1 — Tổng quan:                                            │
  │  → Arrow = ES6, cú pháp gọn hơn!                             │
  │  → Khác biệt CỐT LÕI = cơ chế binding this! ★              │
  │  → Regular: DYNAMIC (lúc gọi!) ★                              │
  │  → Arrow: LEXICAL (lúc định nghĩa!) ★                        │
  │                                                              │
  │  BƯỚC 2 — Chi tiết:                                              │
  │  ① this: Regular → phụ thuộc cách gọi (4 rules!)            │
  │     Arrow → bắt this scope cha, KHÔNG đổi được! ★           │
  │  ② Constructor: Regular → new được! ★                         │
  │     Arrow → KHÔNG new! Không prototype! ❌                   │
  │  ③ arguments: Regular → CÓ! ★                                │
  │     Arrow → KHÔNG! Dùng rest params (...args)! ★             │
  │                                                              │
  │  BƯỚC 3 — Best practices:                                       │
  │  → Callback, setTimeout, .then() → Arrow! ★ (lock this!)    │
  │  → Object method, prototype → Regular! ★ (dynamic this!)    │
  │  → React: Arrow để auto-bind this trong class! ★             │
  │                                                              │
  │  BƯỚC 4 — Bonus (ghi điểm!):                                    │
  │  → Arrow KHÔNG có [[Construct]], chỉ có [[Call]]!             │
  │  → Arrow KHÔNG thể là Generator function! ★                  │
  │  → call/apply/bind KHÔNG đổi this của arrow! ★              │
  │  → Object literal {} KHÔNG tạo scope → arrow method fail! ★│
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
