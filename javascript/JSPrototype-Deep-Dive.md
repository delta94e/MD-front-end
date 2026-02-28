# JavaScript Prototype & Prototype Chain — Deep Dive

> 📅 2026-02-13 · ⏱ 22 phút đọc
>
> Nguồn: ConardLi — "JS Prototype & Kế thừa" · Juejin
> Prototype Pattern → instanceof → 6 cách kế thừa → new operator → ES6 class
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Must-know JS Core Interview

---

## Mục Lục

| #   | Phần                                         |
| --- | -------------------------------------------- |
| 1   | Prototype Design Pattern — Nguyên mẫu là gì? |
| 2   | Prototype Rules — 5 quy tắc cốt lõi          |
| 3   | Prototype Chain — Chuỗi nguyên mẫu           |
| 4   | instanceof — Nguyên lý & Tự triển khai       |
| 5   | 6 Cách kế thừa — Ưu & nhược điểm             |
| 6   | Prototype trong Open Source (Node.js)        |
| 7   | new Operator — Quy trình & Tự triển khai     |
| 8   | ES6 class — Bản chất bên dưới                |
| 9   | Tổng kết & Checklist phỏng vấn               |

---

## §1. Prototype Design Pattern — Nguyên mẫu là gì?

```
PROTOTYPE PATTERN (Mẫu Nguyên mẫu):
═══════════════════════════════════════════════════════════════

  Ý tưởng: TẠO OBJECT MỚI bằng cách CLONE object hiện có
  → Không cần biết chi tiết bên trong (constructor phức tạp)
  → Object mới kế thừa thuộc tính/method từ object gốc

  CLASS-BASED (Java, C++):
  ┌──────────┐     new      ┌──────────┐
  │  Class   │ ───────────→ │ Instance │
  │ (bản vẽ) │              │ (sản phẩm)│
  └──────────┘              └──────────┘

  PROTOTYPE-BASED (JavaScript):
  ┌──────────┐    clone     ┌──────────┐
  │ Prototype│ ───────────→ │ Object   │
  │ (mẫu gốc)│             │ (bản sao) │
  └──────────┘              └──────────┘

  JS KHÔNG CÓ CLASS THẬT!
  → ES6 class chỉ là SYNTACTIC SUGAR trên prototype!
  → Kế thừa trong JS = PROTOTYPE CHAIN (chuỗi nguyên mẫu)
  → Mỗi object có link ẩn (__proto__) → prototype cha
```

```javascript
// Object.create() — Tạo object từ prototype:
const animal = {
  type: "Animal",
  speak() {
    console.log(`${this.type} speaks`);
  },
};

const dog = Object.create(animal); // dog.__proto__ = animal
dog.type = "Dog";
dog.speak(); // "Dog speaks" ← Kế thừa method speak() từ animal!

// dog KHÔNG CÓ speak() của riêng nó
// → Tìm trên prototype chain → tìm thấy ở animal → gọi!
dog.hasOwnProperty("speak"); // false ← speak ở prototype!
dog.hasOwnProperty("type"); // true  ← type ghi đè ở chính dog
```

---

## §2. Prototype Rules — 5 Quy tắc cốt lõi

```
5 QUY TẮC PROTOTYPE:
═══════════════════════════════════════════════════════════════

  ① MỌI FUNCTION đều có thuộc tính .prototype
     → prototype là MỘT OBJECT
     → Chứa các method/properties sẽ được kế thừa

  ② MỌI OBJECT đều có thuộc tính ẩn __proto__
     → (chính thức: [[Prototype]], truy cập qua Object.getPrototypeOf)
     → __proto__ TRỎ ĐẾN .prototype của constructor

  ③ .prototype có thuộc tính .constructor
     → Trỏ NGƯỢC VỀ function đã tạo ra nó

  ④ Truy cập property → tìm trên CHÍNH object
     → Không có → tìm trên __proto__
     → Không có → tìm trên __proto__.__proto__
     → ... cho đến null → undefined

  ⑤ Object.prototype.__proto__ === null
     → ĐỈNH của chuỗi prototype!
```

```javascript
// MINH HỌA 5 QUY TẮC:

function Person(name) {
  this.name = name;
}
Person.prototype.sayHi = function () {
  console.log(`Hi, I'm ${this.name}`);
};

const jun = new Person("Jun");

// ① Function có .prototype
console.log(Person.prototype); // { sayHi: f, constructor: f }

// ② Object có __proto__ trỏ đến constructor.prototype
console.log(jun.__proto__ === Person.prototype); // true! ✅

// ③ .prototype.constructor trỏ ngược về function
console.log(Person.prototype.constructor === Person); // true! ✅

// ④ Prototype chain lookup
jun.sayHi(); // "Hi, I'm Jun" ← tìm trên Person.prototype
jun.toString(); // "[object Object]" ← tìm trên Object.prototype

// ⑤ Đỉnh chain
console.log(Object.prototype.__proto__); // null ← KẾT THÚC!
```

```
TAM GIÁC QUAN HỆ:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┐
  │ Person (Function)│
  │                  │
  │ .prototype ──────│──→ ┌──────────────────────┐
  └──────────────────┘    │ Person.prototype     │
                          │                      │
         ┌────────────────│← .constructor        │
         │                │ .sayHi = function    │
         │                │ .__proto__ ──────────│──→ Object.prototype
         ▼                └──────────────────────┘         │
  ┌──────────────────┐          ↑                          │
  │ Person           │          │                   .__proto__ → null
  └──────────────────┘          │
                                │
  ┌──────────────────┐          │
  │ jun (instance)   │          │
  │                  │          │
  │ .name = 'Jun'    │          │
  │ .__proto__ ──────│──────────┘
  └──────────────────┘

  jun.__proto__ === Person.prototype           ✅
  Person.prototype.constructor === Person      ✅
  Person.prototype.__proto__ === Object.prototype ✅
  Object.prototype.__proto__ === null          ✅
```

---

## §3. Prototype Chain — Chuỗi nguyên mẫu

```
PROTOTYPE CHAIN TOÀN BỘ:
═══════════════════════════════════════════════════════════════

  jun (instance)
    │ __proto__
    ▼
  Person.prototype
    │ __proto__
    ▼
  Object.prototype ← TẤT CẢ object đều kết thúc ở đây!
    │ __proto__
    ▼
  null ← KẾT THÚC CHAIN!


  TÌM KIẾM PROPERTY — LÀM VIỆC NHƯ THẾ NÀO:
  ┌──────────────────────────────────────────────────────────┐
  │ jun.toString()                                           │
  │                                                          │
  │ ① Kiểm tra jun có toString()? → KHÔNG                  │
  │ ② jun.__proto__ (Person.prototype) có? → KHÔNG          │
  │ ③ Person.prototype.__proto__ (Object.prototype) có? → CÓ!│
  │ ④ Gọi Object.prototype.toString()                       │
  │                                                          │
  │ Nếu đến null mà vẫn không có → undefined                │
  └──────────────────────────────────────────────────────────┘
```

```javascript
// PROTOTYPE CHAIN CỦA CÁC BUILT-IN TYPES:

// Array:
var arr = [1, 2, 3];
// arr → Array.prototype → Object.prototype → null
arr.__proto__ === Array.prototype; // true
Array.prototype.__proto__ === Object.prototype; // true

// Function:
function foo() {}
// foo → Function.prototype → Object.prototype → null
foo.__proto__ === Function.prototype; // true
Function.prototype.__proto__ === Object.prototype; // true

// CÂU ĐỐ KINH ĐIỂN:
Function.prototype === Function.__proto__; // true! 🤯
// → Function tự tạo chính nó? Trứng gà → gà → trứng!

Object.__proto__ === Function.prototype; // true!
// → Object cũng là function → __proto__ = Function.prototype

Function instanceof Object; // true ← Function.proto chain → Object.prototype
Object instanceof Function; // true ← Object.__proto__ = Function.prototype

// ⚠️ PROPERTY SHADOWING:
function Animal() {}
Animal.prototype.legs = 4;

function Dog() {}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.legs = 4; // Ghi đè ← property shadowing!

var dog = new Dog();
dog.legs = 3; // Ghi đè cả prototype! Chỉ trên instance!
console.log(dog.legs); // 3 (chính nó)
console.log(dog.__proto__.legs); // 4 (Dog.prototype)
console.log(dog.__proto__.__proto__.legs); // 4 (Animal.prototype)
```

---

## §4. instanceof — Nguyên lý & Tự triển khai

```
instanceof — CÁCH HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  a instanceof B

  Kiểm tra: B.prototype có NẰM TRONG prototype chain của a không?

  Quy trình:
  ① Lấy proto = a.__proto__
  ② proto === B.prototype? → TRUE!
  ③ proto = proto.__proto__ (đi lên 1 bậc)
  ④ Lặp lại bước ② đến khi proto === null → FALSE!

  MINH HỌA:
  jun instanceof Person
  ① jun.__proto__ = Person.prototype
  ② Person.prototype === Person.prototype? → TRUE! ✅

  jun instanceof Object
  ① jun.__proto__ = Person.prototype
  ② Person.prototype === Object.prototype? → KHÔNG
  ③ Person.prototype.__proto__ = Object.prototype
  ④ Object.prototype === Object.prototype? → TRUE! ✅

  [] instanceof Array   // true
  [] instanceof Object  // true ← Array.proto → Object.proto
  null instanceof Object // false ← null không có __proto__!
```

```javascript
// TỰ TRIỂN KHAI instanceof:
function myInstanceof(left, right) {
  // ① left phải là object (primitive → false)
  if (
    left === null ||
    (typeof left !== "object" && typeof left !== "function")
  ) {
    return false;
  }
  // ② Lấy prototype cần kiểm tra
  let proto = Object.getPrototypeOf(left);
  const rightProto = right.prototype;

  // ③ Duyệt prototype chain
  while (proto !== null) {
    if (proto === rightProto) {
      return true; // Tìm thấy!
    }
    proto = Object.getPrototypeOf(proto); // Đi lên 1 bậc
  }
  return false; // Đến null mà không thấy → false
}

// Kiểm tra:
myInstanceof([], Array); // true ✅
myInstanceof([], Object); // true ✅
myInstanceof({}, Array); // false ✅
myInstanceof(null, Object); // false ✅
myInstanceof("str", String); // false ✅ (primitive!)
```

```
instanceof vs typeof — KHI NÀO DÙNG GÌ:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬─────────────┬──────────────────────┐
  │                    │ typeof      │ instanceof           │
  ├────────────────────┼─────────────┼──────────────────────┤
  │ Primitive          │ ✅ Tốt      │ ❌ Luôn false        │
  │ null               │ ❌ "object" │ ❌ false             │
  │ Array              │ ❌ "object" │ ✅ true              │
  │ Custom class       │ ❌ "object" │ ✅ true              │
  │ Cross-iframe       │ ✅ OK       │ ❌ Khác prototype!   │
  │ Kiểm tra kế thừa  │ ❌ Không    │ ✅ Duyệt chain       │
  └────────────────────┴─────────────┴──────────────────────┘

  ⚠️ instanceof CÓ THỂ BỊ LỪA:
  → Ghi đè Symbol.hasInstance
  → Thay đổi prototype sau khi tạo instance
  → Cross-iframe: Array của iframe A ≠ Array của iframe B!
```

---

## §5. 6 Cách kế thừa — Ưu & nhược điểm

### 5a. Prototype Chain Inheritance (Kế thừa chuỗi nguyên mẫu)

```javascript
function Parent() {
  this.name = "parent";
  this.colors = ["red", "blue"]; // REFERENCE TYPE!
}
Parent.prototype.getName = function () {
  return this.name;
};

function Child() {
  this.type = "child";
}
Child.prototype = new Parent(); // ← Gán instance Parent làm prototype!

var c1 = new Child();
var c2 = new Child();
c1.colors.push("green");
console.log(c2.colors); // ['red', 'blue', 'green'] ← BỊ ẢNH HƯỞNG! 💀
```

```
① PROTOTYPE CHAIN INHERITANCE:
  ✅ Ưu: Đơn giản, kế thừa method từ prototype
  ❌ Nhược:
    → Reference properties CHIA SẺ giữa tất cả instances! 💀
    → Không thể truyền tham số cho Parent constructor
    → Thay đổi ở 1 instance → ảnh hưởng TẤT CẢ! 💀
```

### 5b. Constructor Stealing (Kế thừa constructor)

```javascript
function Parent(name) {
  this.name = name;
  this.colors = ["red", "blue"];
}
Parent.prototype.getName = function () {
  return this.name;
};

function Child(name) {
  Parent.call(this, name); // ← GỌI Parent constructor trong context Child!
}

var c1 = new Child("c1");
var c2 = new Child("c2");
c1.colors.push("green");
console.log(c2.colors); // ['red', 'blue'] ← Không ảnh hưởng! ✅
console.log(c1.getName()); // ❌ TypeError! getName không được kế thừa! 💀
```

```
② CONSTRUCTOR STEALING:
  ✅ Ưu: Mỗi instance có BẢN SAO RIÊNG (không chia sẻ reference)
         Truyền tham số cho Parent constructor được
  ❌ Nhược:
    → KHÔNG kế thừa methods trên Parent.prototype! 💀
    → Mỗi instance tạo bản sao method → lãng phí bộ nhớ
    → instanceof Parent → false (không liên kết prototype)
```

### 5c. Combination Inheritance (Kết hợp — phổ biến nhất!)

```javascript
function Parent(name) {
  this.name = name;
  this.colors = ["red", "blue"];
}
Parent.prototype.getName = function () {
  return this.name;
};

function Child(name, age) {
  Parent.call(this, name); // ② Constructor stealing (properties)
  this.age = age;
}
Child.prototype = new Parent(); // ① Prototype chain (methods)
Child.prototype.constructor = Child; // Fix constructor pointer!

var c1 = new Child("Jun", 25);
c1.colors.push("green");
var c2 = new Child("Lee", 30);
console.log(c2.colors); // ['red', 'blue'] ← Không chia sẻ! ✅
console.log(c1.getName()); // 'Jun' ← Kế thừa method! ✅
c1 instanceof Parent; // true ✅
c1 instanceof Child; // true ✅
```

```
③ COMBINATION INHERITANCE:
  ✅ Ưu: Kế thừa CẢ properties (riêng biệt) VÀ methods
         instanceof hoạt động đúng
         Truyền tham số được
  ❌ Nhược:
    → Parent constructor BỊ GỌI 2 LẦN! 💀
      Lần 1: new Parent() khi gán prototype
      Lần 2: Parent.call(this) trong Child constructor
    → Properties trên prototype THỪA (bị shadow bởi instance)
```

### 5d. Prototypal Inheritance (Object.create)

```javascript
// Kế thừa trực tiếp từ object (không cần constructor)
var parent = {
  name: "parent",
  colors: ["red", "blue"],
  getName() {
    return this.name;
  },
};

var child = Object.create(parent); // child.__proto__ = parent
child.name = "child";
child.colors.push("green"); // ⚠️ Vẫn CHIA SẺ reference!

// Tự triển khai Object.create:
function objectCreate(proto) {
  function F() {}
  F.prototype = proto;
  return new F();
}
```

```
④ PROTOTYPAL INHERITANCE (Object.create):
  ✅ Ưu: Đơn giản, không cần constructor
         Linh hoạt, kế thừa từ bất kỳ object
  ❌ Nhược:
    → Reference properties vẫn CHIA SẺ! 💀 (giống cách 1)
    → Không có cơ chế khởi tạo (không constructor)
```

### 5e. Parasitic Inheritance (Kế thừa ký sinh)

```javascript
function createChild(parent) {
  var child = Object.create(parent); // Clone parent
  child.sayHi = function () {
    // "Ký sinh" thêm method
    console.log("Hi!");
  };
  return child;
}

var parent = { name: "parent", colors: ["red"] };
var child = createChild(parent);
child.sayHi(); // "Hi!" ✅
```

```
⑤ PARASITIC INHERITANCE:
  ✅ Ưu: Linh hoạt, tăng cường object mà không cần constructor
  ❌ Nhược:
    → Method KHÔNG REUSE (tạo mới mỗi lần → lãng phí bộ nhớ)
    → Reference properties vẫn chia sẻ
    → Giống factory pattern hơn kế thừa
```

### 5f. Parasitic Combination Inheritance — HOÀN HẢO! ⭐

```javascript
function Parent(name) {
  this.name = name;
  this.colors = ["red", "blue"];
}
Parent.prototype.getName = function () {
  return this.name;
};

function Child(name, age) {
  Parent.call(this, name); // Chỉ gọi Parent 1 LẦN! ✅
  this.age = age;
}

// KEY: Dùng Object.create THAY VÌ new Parent()!
Child.prototype = Object.create(Parent.prototype); // ← KHÔNG gọi Parent()!
Child.prototype.constructor = Child;

// Hoặc viết hàm helper:
function inheritPrototype(child, parent) {
  var prototype = Object.create(parent.prototype); // Tạo bản sao prototype
  prototype.constructor = child; // Fix constructor
  child.prototype = prototype; // Gán prototype
}
inheritPrototype(Child, Parent);

var c1 = new Child("Jun", 25);
c1.colors.push("green");
var c2 = new Child("Lee", 30);
console.log(c2.colors); // ['red', 'blue'] ✅
console.log(c1.getName()); // 'Jun' ✅
c1 instanceof Parent; // true ✅
c1 instanceof Child; // true ✅
// Parent constructor chỉ gọi 1 LẦN! ✅
```

```
⑥ PARASITIC COMBINATION — HOÀN HẢO:
  ✅ Ưu: Parent constructor chỉ gọi 1 LẦN! (fix lỗi Combination)
         Properties riêng biệt (không chia sẻ reference)
         Methods kế thừa qua prototype (reuse!)
         instanceof hoạt động đúng
         Prototype không có properties thừa
  ❌ Nhược: Cú pháp phức tạp hơn (nhưng ES6 class giải quyết!)
  ⭐ ĐÂY LÀ CÁCH TỐT NHẤT! ES6 class dùng cách này bên dưới!
```

```
BẢNG SO SÁNH 6 CÁCH:
═══════════════════════════════════════════════════════════════

  ┌────────────────────────┬──────┬──────┬──────┬──────┬─────┐
  │ Tiêu chí               │  ①   │  ②   │  ③   │ ④⑤  │ ⑥⭐ │
  ├────────────────────────┼──────┼──────┼──────┼──────┼─────┤
  │ Kế thừa method         │ ✅   │ ❌   │ ✅   │ ✅   │ ✅  │
  │ Properties riêng biệt  │ ❌   │ ✅   │ ✅   │ ❌   │ ✅  │
  │ Truyền tham số         │ ❌   │ ✅   │ ✅   │ ❌   │ ✅  │
  │ Parent gọi 1 lần      │ ✅   │ ✅   │ ❌   │ ✅   │ ✅  │
  │ instanceof đúng        │ ✅   │ ❌   │ ✅   │ ✅   │ ✅  │
  │ Không props thừa       │ ❌   │ ✅   │ ❌   │ ✅   │ ✅  │
  ├────────────────────────┼──────┼──────┼──────┼──────┼─────┤
  │ ① Proto Chain          │      │      │      │      │     │
  │ ② Constructor Steal    │      │      │      │      │     │
  │ ③ Combination          │      │      │      │      │     │
  │ ④⑤ Prototypal/Parasit  │      │      │      │      │     │
  │ ⑥ Parasitic Combo ⭐   │      │      │      │      │     │
  └────────────────────────┴──────┴──────┴──────┴──────┴─────┘
```

---

## §6. Prototype trong Open Source (Node.js)

### Node.js Events — util.inherits

```javascript
// Node.js sử dụng prototype inheritance RỘNG RÃI!

// ① util.inherits — Hàm kế thừa gốc của Node.js
const util = require("util");
const EventEmitter = require("events");

function MyStream() {
  EventEmitter.call(this); // Constructor stealing
}
util.inherits(MyStream, EventEmitter); // ← Prototype chain!

// util.inherits nội bộ:
// exports.inherits = function(ctor, superCtor) {
//     ctor.prototype = Object.create(superCtor.prototype, {
//         constructor: { value: ctor, writable: true, configurable: true }
//     });
// };
// → CHÍNH LÀ Parasitic Combination Inheritance! ⭐

MyStream.prototype.write = function (data) {
  this.emit("data", data); // Kế thừa emit() từ EventEmitter!
};

var stream = new MyStream();
stream instanceof EventEmitter; // true ✅
stream instanceof MyStream; // true ✅
stream.on("data", (chunk) => console.log(chunk)); // Kế thừa on()!
stream.write("Hello!"); // → triggers 'data' event
```

### Node.js Stream Architecture

```javascript
// ② Node.js Streams — 4 loại đều kế thừa từ Stream:
//
// Stream (kế thừa EventEmitter)
//   ├── Readable  (fs.createReadStream, http.IncomingMessage)
//   ├── Writable  (fs.createWriteStream, http.ServerResponse)
//   ├── Duplex    (net.Socket, TCP connection)
//   └── Transform (zlib.createGzip, crypto.Cipher)

// Readable._read, Writable._write... đều là "abstract methods"
// → Subclass override để cung cấp implementation cụ thể
// → PATTERN: Template Method qua Prototype Chain!

// ③ Express.js — app kế thừa EventEmitter:
// var app = express();
// app là object với __proto__ = mixin của EventEmitter
// app.listen(), app.get() → tất cả qua prototype chain!

// ④ Koa.js — context prototype:
// ctx.__proto__ = app.context
// app.context.__proto__ = { cookies, ip, url..., prototype methods }
// → Mỗi request tạo ctx mới, kế thừa shared methods!
```

```
TẠI SAO OPEN SOURCE DÙNG PROTOTYPE:
═══════════════════════════════════════════════════════════════

  ① BỘ NHỚ: Methods trên prototype CHIA SẺ giữa instances
     → 1000 streams chỉ có 1 bản sao write() trên prototype
     → Nếu đặt trong constructor → 1000 bản sao write() 💀

  ② EXTENSIBILITY: User có thể override methods:
     → MyStream.prototype.write = customWrite;
     → Không ảnh hưởng các instance khác!

  ③ DUCK TYPING: Kiểm tra khả năng, không kiểm tra kiểu:
     → if (typeof stream.pipe === 'function') → readable!
     → Linh hoạt hơn instanceof
```

---

## §7. new Operator — Quy trình & Tự triển khai

```
new OPERATOR — 4 BƯỚC:
═══════════════════════════════════════════════════════════════

  var obj = new Constructor(arg1, arg2);

  ① TẠO object rỗng mới
     → obj = {}

  ② LIÊN KẾT prototype
     → obj.__proto__ = Constructor.prototype

  ③ GỌI constructor với context = obj mới
     → Constructor.call(obj, arg1, arg2)
     → this bên trong constructor = obj mới!

  ④ KIỂM TRA return value:
     → Constructor return OBJECT? → dùng object đó!
     → Constructor return PRIMITIVE hoặc không return?
       → dùng obj đã tạo ở bước ①!

  MINH HỌA:
  function Person(name) { this.name = name; }
  var jun = new Person('Jun');

  ① {} (object rỗng)
  ② {}.__proto__ = Person.prototype
  ③ this.name = 'Jun' → { name: 'Jun' }
  ④ Không return → dùng { name: 'Jun' }

  Kết quả: jun = { name: 'Jun', __proto__: Person.prototype }
```

```javascript
// TỰ TRIỂN KHAI new OPERATOR:
function myNew(Constructor, ...args) {
  // ① Tạo object rỗng
  // ② Liên kết prototype
  const obj = Object.create(Constructor.prototype);

  // ③ Gọi constructor với context = obj
  const result = Constructor.apply(obj, args);

  // ④ Return: nếu constructor trả về object → dùng nó
  //           nếu không → dùng obj đã tạo
  return result !== null && typeof result === "object" ? result : obj;
}

// Kiểm tra:
function Person(name, age) {
  this.name = name;
  this.age = age;
}
Person.prototype.sayHi = function () {
  console.log(`Hi, I'm ${this.name}`);
};

var p1 = myNew(Person, "Jun", 25);
p1.sayHi(); // "Hi, I'm Jun" ✅
p1 instanceof Person; // true ✅
p1.__proto__ === Person.prototype; // true ✅

// CÁI BẪY — Constructor return object:
function Trick() {
  this.name = "ignored";
  return { name: "returned" }; // ← Trả về object KHÁC!
}
var t = new Trick();
console.log(t.name); // 'returned' ← KHÔNG phải 'ignored'!
t instanceof Trick; // false! ← Vì t không phải obj đã tạo!

// Constructor return primitive → BỊ BỎ QUA:
function Normal() {
  this.name = "kept";
  return 42; // ← Primitive → bị bỏ qua!
}
var n = new Normal();
console.log(n.name); // 'kept' ✅ ← Dùng obj đã tạo!
```

```
new vs Object.create vs {} — KHÁC NHAU:
═══════════════════════════════════════════════════════════════

  ┌───────────────────┬──────────────────────────────────────┐
  │ Cách tạo          │ Kết quả                              │
  ├───────────────────┼──────────────────────────────────────┤
  │ new Constructor() │ obj.__proto__ = Constructor.prototype│
  │                   │ + GỌI constructor (khởi tạo props)   │
  ├───────────────────┼──────────────────────────────────────┤
  │ Object.create(p)  │ obj.__proto__ = p                    │
  │                   │ KHÔNG gọi constructor                │
  ├───────────────────┼──────────────────────────────────────┤
  │ {}                │ obj.__proto__ = Object.prototype     │
  │                   │ Tương đương new Object()             │
  ├───────────────────┼──────────────────────────────────────┤
  │ Object.create(null)│ obj.__proto__ = null                │
  │                   │ KHÔNG có prototype chain! Pure dict! │
  └───────────────────┴──────────────────────────────────────┘
```

---

## §8. ES6 class — Bản chất bên dưới

```
ES6 class = SYNTACTIC SUGAR trên prototype!
═══════════════════════════════════════════════════════════════

  class KHÔNG phải class thật (như Java)!
  → Chỉ là CÚ PHÁP ĐẸP hơn cho constructor function + prototype
  → typeof MyClass === "function"! ← Vẫn là function!
  → Bên dưới vẫn là PROTOTYPE CHAIN!
```

```javascript
// ES6 CLASS:
class Person {
  constructor(name) {
    this.name = name; // Instance property
  }
  sayHi() {
    // Trên prototype!
    console.log(`Hi, I'm ${this.name}`);
  }
  static create(name) {
    // Static method — trên class, KHÔNG trên prototype!
    return new Person(name);
  }
}

// TƯƠNG ĐƯƠNG ES5:
function Person(name) {
  this.name = name;
}
Person.prototype.sayHi = function () {
  console.log(`Hi, I'm ${this.name}`);
};
Person.create = function (name) {
  // Static
  return new Person(name);
};

// CHỨNG MINH:
typeof Person; // "function" ← VẪN LÀ FUNCTION!
Person.prototype.sayHi; // function ← Method trên prototype!
Person.prototype.constructor === Person; // true
```

### ES6 extends — Kế thừa

```javascript
// ES6:
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    console.log(`${this.name} makes a noise.`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // ← GỌI Parent constructor! (BẮT BUỘC trước this!)
    this.breed = breed;
  }
  speak() {
    // Override
    console.log(`${this.name} barks.`);
  }
}

// BAN CHẤT extends LÀM GÌ:
// ① Dog.prototype = Object.create(Animal.prototype)
// ② Dog.prototype.constructor = Dog
// ③ Object.setPrototypeOf(Dog, Animal) ← STATIC kế thừa!
//    → Dog.__proto__ = Animal
//    → Dog có thể truy cập Animal.staticMethod()!
```

```javascript
// BABEL TRANSPILE class → ES5:
// (Đơn giản hóa — bản chất)

"use strict";

function _inherits(subClass, superClass) {
  // ① Gán prototype (Parasitic Combination!)
  subClass.prototype = Object.create(superClass.prototype, {
    constructor: { value: subClass, writable: true, configurable: true },
  });
  // ② Kế thừa static methods!
  Object.setPrototypeOf(subClass, superClass);
}

function _classCallCheck(instance, Constructor) {
  // Ngăn gọi class như function thường!
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  // Gán methods vào prototype (enumerable: false!)
  if (protoProps) {
    protoProps.forEach(function (desc) {
      Object.defineProperty(Constructor.prototype, desc.key, {
        value: desc.value,
        writable: true,
        configurable: true,
        enumerable: false, // ← class methods KHÔNG enumerable!
      });
    });
  }
  if (staticProps) {
    staticProps.forEach(function (desc) {
      Object.defineProperty(Constructor, desc.key, desc);
    });
  }
}
```

```
ES6 class vs ES5 constructor — KHÁC BIỆT QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  ┌───────────────────────────┬─────────────┬──────────────────┐
  │ Tính chất                 │ ES5 function│ ES6 class        │
  ├───────────────────────────┼─────────────┼──────────────────┤
  │ Gọi không new             │ ✅ Được     │ ❌ TypeError!    │
  │ Hoisting                  │ ✅ Có       │ ❌ KHÔNG! (TDZ!) │
  │ Methods enumerable        │ ✅ Có       │ ❌ KHÔNG!        │
  │ Built-in strict mode      │ ❌          │ ✅ Tự động!      │
  │ super keyword             │ ❌          │ ✅ Có            │
  │ Static kế thừa            │ ❌ Thủ công │ ✅ Tự động!      │
  │ new.target                │ ❌          │ ✅ Có            │
  │ Private fields (#)        │ ❌          │ ✅ ES2022        │
  └───────────────────────────┴─────────────┴──────────────────┘

  ⚠️ SUPER PHẢI GỌI TRƯỚC this TRONG SUBCLASS CONSTRUCTOR!
  class Child extends Parent {
      constructor() {
          // this.name = 'Jun'; ← ❌ ReferenceError!
          super();              // ← Phải gọi trước!
          this.name = 'Jun';   // ✅ OK sau super()
      }
  }

  TẠI SAO SUPER TRƯỚC this?
  → Trong ES6, subclass KHÔNG TẠO this của riêng nó!
  → super() gọi Parent constructor → TẠO this
  → Sau đó Child mới modify this
  → Khác ES5: Child tạo this trước rồi mới gọi Parent.call(this)
```

### ES2022 Private Fields

```javascript
// Private fields — THẬT SỰ PRIVATE!
class BankAccount {
  #balance = 0; // Private field (ES2022)
  #pin;

  constructor(pin) {
    this.#pin = pin;
  }
  deposit(amount) {
    this.#balance += amount;
  }
  #validate(pin) {
    // Private method
    return this.#pin === pin;
  }
  getBalance(pin) {
    if (this.#validate(pin)) return this.#balance;
    throw new Error("Wrong PIN!");
  }
}

const acc = new BankAccount("1234");
acc.deposit(1000);
acc.getBalance("1234"); // 1000
// acc.#balance;        // ❌ SyntaxError! Private!
// acc.#validate('1234'); // ❌ SyntaxError!

// ⚠️ # fields HOÀN TOÀN PRIVATE — không như Symbol hay _convention!
// → Không truy cập được từ bên ngoài, kể cả subclass!
// → Không xuất hiện trong Object.keys, Reflect, Proxy
```

---

## §9. Tổng kết & Checklist phỏng vấn

```
PROTOTYPE MIND MAP:
═══════════════════════════════════════════════════════════════

  Prototype & Inheritance
  ├── Prototype Pattern: clone object, không cần class thật
  ├── 5 Rules: .prototype, __proto__, .constructor, chain lookup, null
  ├── Prototype Chain: obj → Constructor.prototype → Object.prototype → null
  ├── instanceof: duyệt chain tìm .prototype, tự triển khai
  ├── 6 Kế thừa: Proto Chain → Steal → Combo → Create → Parasitic → ⭐ Parasitic Combo
  ├── Open Source: Node util.inherits, EventEmitter, Streams, Express
  ├── new: 4 bước (create → link → call → check return)
  └── ES6 class: syntactic sugar, extends = Parasitic Combo + static inherit
```

### Checklist

- [ ] **Prototype pattern**: tạo object bằng clone, JS là prototype-based (không class-based)
- [ ] **5 quy tắc**: function.prototype (object), obj.**proto** → constructor.prototype, .constructor trỏ ngược, chain lookup, Object.prototype.**proto** = null
- [ ] **Tam giác**: `obj.__proto__` = `Constructor.prototype`, `.constructor` = `Constructor`
- [ ] **Prototype chain**: obj → Constructor.prototype → Object.prototype → null
- [ ] **Property shadowing**: property trên instance che property cùng tên trên prototype
- [ ] **instanceof**: duyệt `__proto__` chain tìm `Right.prototype`, tự triển khai bằng while loop + `Object.getPrototypeOf()`
- [ ] **6 cách kế thừa**: (1) Proto chain (ref shared!) → (2) Constructor steal (no methods!) → (3) Combination (parent gọi 2 lần!) → (4) Prototypal (Object.create) → (5) Parasitic → (6) **Parasitic Combination ⭐** (tốt nhất!)
- [ ] **Parasitic Combo key**: `Child.prototype = Object.create(Parent.prototype)` thay vì `new Parent()`
- [ ] **Node.js**: `util.inherits` = Parasitic Combination, EventEmitter → kế thừa bằng prototype
- [ ] **new 4 bước**: tạo obj rỗng → link **proto** → call constructor → check return (object → dùng nó, primitive → dùng obj)
- [ ] **Tự triển khai new**: `Object.create(Ctor.prototype)` → `Ctor.apply(obj, args)` → check result type
- [ ] **new return trap**: constructor return object → instance LÀ object đó (instanceof = false!)
- [ ] **Object.create(null)**: tạo pure dictionary, không có prototype chain
- [ ] **ES6 class**: syntactic sugar, `typeof Class = "function"`, methods trên prototype (non-enumerable!)
- [ ] **extends transpile**: `Object.create(Parent.prototype)` + `Object.setPrototypeOf(Child, Parent)` (static inherit)
- [ ] **class vs function**: no hoisting (TDZ), no call without new, strict mode auto, methods non-enumerable
- [ ] **super()**: BẮT BUỘC trước this trong subclass constructor — subclass KHÔNG tạo this, super() tạo!
- [ ] **ES2022 #private**: hoàn toàn private, không truy cập từ ngoài, không kế thừa, không Reflect

---

_Nguồn: ConardLi — "Prototype & Prototype Chain" · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
