# Prototype Pattern — Deep Dive

> 📅 2026-02-14 · ⏱ 20 phút đọc
>
> Prototype là gì? Prototype Chain,
> ES6 Class & Prototype, Object.create(),
> Constructor Function (ES5), Kế thừa,
> Prototype Pollution, Performance,
> So sánh với Class Pattern, Real-World Applications
> Độ khó: ⭐️⭐️⭐️⭐️ | Design Pattern / JS Core

---

## Mục Lục

| #   | Phần                                          |
| --- | --------------------------------------------- |
| 1   | Prototype là gì?                              |
| 2   | Prototype Chain — Chuỗi nguyên mẫu            |
| 3   | ES6 Class & Prototype                         |
| 4   | Kế thừa — extends & super                     |
| 5   | Object.create()                               |
| 6   | Constructor Function (ES5)                    |
| 7   | ES5 Inheritance — Cách cũ                     |
| 8   | Property Lookup — \_\_proto\_\_ vs prototype  |
| 9   | Thêm method SAU KHI tạo instance              |
| 10  | hasOwnProperty vs in                          |
| 11  | Object.getPrototypeOf & Object.setPrototypeOf |
| 12  | Prototype Pollution — Nguy hiểm!              |
| 13  | Performance                                   |
| 14  | Prototype Pattern vs Class Pattern            |
| 15  | Real-World Applications                       |
| 16  | Tóm tắt                                       |

---

## §1. Prototype là gì?

```
PROTOTYPE — KHÁI NIỆM CỐT LÕI:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Prototype = KHUÔN MẪU (nguyên mẫu!)
  → Mọi object trong JS đều có 1 PROTOTYPE!
  → Prototype là 1 OBJECT KHÁC chứa properties DÙNG CHUNG!
  → Khi access property KHÔNG CÓ trên object!
  → → JS tìm NGƯỢC LÊN prototype!
  → → Đó gọi là PROTOTYPE CHAIN!

  VÍ DỤ THỰC TẾ:
  → Bản thiết kế (blueprint) = PROTOTYPE!
  → Từng căn nhà = INSTANCE!
  → Mỗi nhà có màu SƠN RIÊNG (own property!)
  → Nhưng chia sẻ CÙNG bản thiết kế (prototype!)

  TẠI SAO CẦN?
  → TIẾT KIỆM BỘ NHỚ!
  → Thay vì mỗi instance CÓ BẢN SAO riêng!
  → Tất cả instance CHIA SẺ 1 prototype!
  → 1000 dogs → chỉ CẦN 1 bản bark()!
```

```
PROTOTYPE CHAIN — HÌNH MINH HỌA:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────┐
  │ null (ĐỈNH! Không có prototype!)   │
  └────────────────┬────────────────────┘
                   │ __proto__
  ┌────────────────▼────────────────────┐
  │ Object.prototype                    │
  │ → toString(), valueOf()             │
  │ → hasOwnProperty()                 │
  │ → constructor: Object              │
  └────────────────┬────────────────────┘
                   │ __proto__
  ┌────────────────▼────────────────────┐
  │ Dog.prototype                       │
  │ → bark(), play()                    │
  │ → constructor: Dog                 │
  └────────────────┬────────────────────┘
                   │ __proto__
  ┌────────────────▼────────────────────┐
  │ dog1 (Instance)                     │
  │ → name: "Daisy"   ← OWN property!  │
  │ → bark()? KHÔNG → tìm prototype! ↑ │
  └─────────────────────────────────────┘

  dog1.bark()
  → 1. dog1 có bark()? ❌ KHÔNG!
  → 2. dog1.__proto__ (Dog.prototype) có bark()? ✅ CÓ!
  → 3. GỌI bark() từ Dog.prototype!

  dog1.toString()
  → 1. dog1 có? ❌
  → 2. Dog.prototype có? ❌
  → 3. Object.prototype có? ✅ GỌI!

  dog1.xyz
  → 1. dog1 có? ❌
  → 2. Dog.prototype có? ❌
  → 3. Object.prototype có? ❌
  → 4. null → DỪNG! return undefined!
```

---

## §2. Prototype Chain — Chuỗi nguyên mẫu

```javascript
// ═══ MINH HỌA PROTOTYPE CHAIN ═══

class Dog {
  constructor(name) {
    this.name = name;
  }
  bark() {
    return "Woof!";
  }
}

const dog1 = new Dog("Daisy");

// ── KIỂM TRA prototype chain: ──

// Instance → Constructor.prototype:
console.log(dog1.__proto__ === Dog.prototype); // true!

// Dog.prototype → Object.prototype:
console.log(Dog.prototype.__proto__ === Object.prototype); // true!

// Object.prototype → null (ĐỈNH!):
console.log(Object.prototype.__proto__ === null); // true!

// ── KIỂM TRA method: ──

// bark() NẰM trên Dog.prototype, KHÔNG trên dog1:
console.log(dog1.hasOwnProperty("bark")); // false!
console.log(dog1.hasOwnProperty("name")); // true! ← OWN property!

// bark() trên prototype:
console.log("bark" in dog1); // true! (tìm qua chain!)
```

```javascript
// ═══ MỌI INSTANCE CHIA SẺ CÙNG PROTOTYPE ═══

const dog1 = new Dog("Daisy");
const dog2 = new Dog("Max");
const dog3 = new Dog("Spot");

// Cùng 1 prototype object:
console.log(dog1.__proto__ === dog2.__proto__); // true!
console.log(dog2.__proto__ === dog3.__proto__); // true!

// Cùng 1 bark function:
console.log(dog1.bark === dog2.bark); // true! ← CÙNG reference!
// → TIẾT KIỆM bộ nhớ! Không duplicate!
```

```
⚠️ __proto__ vs prototype:
═══════════════════════════════════════════════════════════════

  __proto__  → PROPERTY trên MỖI OBJECT!
              → Trỏ đến prototype của nó!
              → dog1.__proto__ → Dog.prototype!
              → DEPRECATED! Dùng Object.getPrototypeOf()!

  prototype  → PROPERTY trên MỖI FUNCTION/CLASS!
              → Chứa methods CHIA SẺ cho instances!
              → Dog.prototype → { bark, constructor }

  ┌──────────────┬──────────────────────────────────────────┐
  │              │ __proto__        │ prototype             │
  ├──────────────┼──────────────────┼───────────────────────┤
  │ Có ở đâu?   │ MỌI object      │ Chỉ function/class    │
  │ Dùng để?     │ Tìm prototype   │ Định nghĩa prototype  │
  │ Ai set?      │ JS Engine auto! │ Developer declare!     │
  │ Deprecated?  │ ✅ Dùng         │ ❌ Không deprecated!   │
  │              │ getPrototypeOf! │                        │
  └──────────────┴──────────────────┴───────────────────────┘
```

---

## §3. ES6 Class & Prototype

```javascript
// ═══ CLASS = SYNTAX SUGAR CỦA PROTOTYPE! ═══

class Dog {
  constructor(name) {
    this.name = name; // ← OWN property (trên instance!)
  }

  // Methods tự động vào Dog.prototype:
  bark() {
    return "Woof!";
  }

  sit() {
    return `${this.name} is sitting!`;
  }
}

// ── CHỨNG MINH: ──
console.log(Dog.prototype);
// {
//   constructor: ƒ Dog(name),
//   bark: ƒ bark(),
//   sit: ƒ sit()
// }

const daisy = new Dog("Daisy");

// name = OWN property:
console.log(Object.keys(daisy)); // ["name"]

// bark, sit = PROTOTYPE property:
console.log(Object.keys(Dog.prototype)); // ["bark", "sit"]
```

```javascript
// ═══ CLASS DƯỚI HOOD = FUNCTION + PROTOTYPE ═══

// ES6 Class:
class Dog {
  constructor(name) {
    this.name = name;
  }
  bark() {
    return "Woof!";
  }
}

// TƯƠNG ĐƯƠNG ES5:
function Dog(name) {
  this.name = name;
}
Dog.prototype.bark = function () {
  return "Woof!";
};

// → CLASS chỉ là SYNTAX SUGAR!
// → Bên trong VẪN dùng prototype!
// → typeof Dog === 'function' (cả 2 cách!)
```

```
CONSTRUCTOR vs PROTOTYPE methods:
═══════════════════════════════════════════════════════════════

  class Animal {
      constructor(name) {
          this.name = name;           // ← OWN property!
          this.legs = 4;              // ← OWN property!

          // ❌ ĐỪNG LÀM: method trong constructor!
          this.run = function() {     // ← OWN! Mỗi instance = 1 BẢN SAO!
              return "Running!";       // → 1000 instances = 1000 hàm run!
          };                           // → LÃNG PHÍ bộ nhớ!
      }

      // ✅ ĐÚNG: method trên prototype!
      eat() {                          // ← PROTOTYPE method!
          return "Eating!";            // → 1000 instances CHIA SẺ 1 hàm!
      }                                // → TIẾT KIỆM bộ nhớ!
  }

  BỘ NHỚ:
  ┌───────────┬────────────────────────────────────────────┐
  │           │ 1000 instances                             │
  ├───────────┼────────────────────────────────────────────┤
  │ OWN method│ 1000 × hàm run → 1000 hàm trong bộ nhớ! │
  │ PROTOTYPE │ 1 × hàm eat → DUY NHẤT 1 hàm!            │
  └───────────┴────────────────────────────────────────────┘
```

---

## §4. Kế thừa — extends & super

```javascript
// ═══ PROTOTYPE CHAIN VỚI KẾ THỪA ═══

class Dog {
  constructor(name) {
    this.name = name;
  }
  bark() {
    console.log("Woof!");
  }
}

class SuperDog extends Dog {
  constructor(name) {
    super(name); // ← GỌI Dog.constructor(name)!
  }
  fly() {
    console.log("Flying!");
  }
}

const daisy = new SuperDog("Daisy");
daisy.bark(); // "Woof!"  ← từ Dog.prototype!
daisy.fly(); // "Flying!" ← từ SuperDog.prototype!
```

```
PROTOTYPE CHAIN KHI KẾ THỪA:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────┐
  │ null                                │
  └────────────────┬────────────────────┘
                   ↑ __proto__
  ┌────────────────┴────────────────────┐
  │ Object.prototype                    │
  │ → toString(), valueOf()             │
  └────────────────┬────────────────────┘
                   ↑ __proto__
  ┌────────────────┴────────────────────┐
  │ Dog.prototype                       │
  │ → bark()                            │
  │ → constructor: Dog                 │
  └────────────────┬────────────────────┘
                   ↑ __proto__
  ┌────────────────┴────────────────────┐
  │ SuperDog.prototype                  │
  │ → fly()                             │
  │ → constructor: SuperDog            │
  └────────────────┬────────────────────┘
                   ↑ __proto__
  ┌────────────────┴────────────────────┐
  │ daisy (Instance)                    │
  │ → name: "Daisy"                     │
  └─────────────────────────────────────┘

  daisy.bark():
  → daisy có? ❌ → SuperDog.prototype có? ❌
  → Dog.prototype có? ✅ GỌI!

  daisy.fly():
  → daisy có? ❌ → SuperDog.prototype có? ✅ GỌI!

  daisy.toString():
  → daisy? ❌ → SuperDog? ❌ → Dog? ❌
  → Object.prototype? ✅ GỌI!
```

```javascript
// ═══ instanceof — KIỂM TRA PROTOTYPE CHAIN ═══

console.log(daisy instanceof SuperDog); // true
console.log(daisy instanceof Dog); // true
console.log(daisy instanceof Object); // true

// instanceof ĐI DỌC prototype chain!
// daisy.__proto__ === SuperDog.prototype? ✅ → true!
// daisy.__proto__.__proto__ === Dog.prototype? ✅ → true!
// daisy.__proto__.__proto__.__proto__ === Object.prototype? ✅ → true!
```

```javascript
// ═══ METHOD OVERRIDING ═══

class Animal {
  speak() {
    return "...";
  }
}

class Cat extends Animal {
  speak() {
    return "Meow!"; // OVERRIDE parent method!
  }
}

class CuriousCat extends Cat {
  speak() {
    // Gọi parent method VỚI super:
    const parentSound = super.speak();
    return `${parentSound} ${parentSound}!`;
  }
}

const cat = new CuriousCat();
console.log(cat.speak()); // "Meow! Meow!!"

// LOOKUP:
// cat.speak() → CuriousCat.prototype.speak() ← TÌM THẤY!
// super.speak() → Cat.prototype.speak() ← Parent!
```

---

## §5. Object.create()

```javascript
// ═══ Object.create() — TẠO OBJECT VỚI PROTOTYPE CHỈ ĐỊNH ═══

const dog = {
  bark() {
    console.log("Woof!");
  },
  wagTail() {
    console.log("Wagging tail!");
  },
};

// Tạo pet1 VỚI prototype = dog:
const pet1 = Object.create(dog);

pet1.name = "Buddy";

pet1.bark(); // "Woof!" ← từ prototype!
pet1.wagTail(); // "Wagging tail!" ← từ prototype!

// KIỂM TRA:
console.log(Object.keys(pet1)); // ["name"] ← chỉ OWN props!
console.log(pet1.__proto__ === dog); // true!
console.log(pet1.hasOwnProperty("bark")); // false! Trên prototype!
```

```javascript
// ═══ Object.create() VỚI PROPERTY DESCRIPTORS ═══

const animal = {
  type: "Animal",
  describe() {
    return `${this.type}: ${this.name}`;
  },
};

const cat = Object.create(animal, {
  // Property descriptors:
  name: {
    value: "Kitty",
    writable: true,
    enumerable: true,
    configurable: true,
  },
  // Read-only property:
  species: {
    value: "Felis catus",
    writable: false, // KHÔNG THỂ thay đổi!
    enumerable: true,
    configurable: false,
  },
});

console.log(cat.describe()); // "Animal: Kitty"
console.log(cat.species); // "Felis catus"

cat.name = "Meowy"; // ✅ OK (writable: true!)
cat.species = "Dog"; // ❌ Silently fails (strict → TypeError!)
```

```javascript
// ═══ Object.create(null) — PURE DICTIONARY ═══

// Object thường kế thừa Object.prototype:
const normal = {};
console.log(normal.toString); // ƒ toString()
console.log(normal.hasOwnProperty); // ƒ hasOwnProperty()
console.log("toString" in normal); // true!

// Object.create(null) — KHÔNG CÓ prototype!
const pure = Object.create(null);
console.log(pure.toString); // undefined!
console.log("toString" in pure); // false!

// USE CASE: Safe dictionary / map!
// → Không bị xung đột với built-in methods!
// → VD: pure['toString'] = 'my value' → SAFE!
// → Với normal: normal['toString'] overwrites built-in!
```

```
Object.create() vs new:
═══════════════════════════════════════════════════════════════

  // new:
  const dog1 = new Dog("Daisy");
  // Tạo instance → chạy constructor → set prototype

  // Object.create():
  const dog2 = Object.create(Dog.prototype);
  // Tạo object → set prototype → KHÔNG chạy constructor!

  // Gần tương đương:
  function Constructor() {}
  const a = new Constructor();
  const b = Object.create(Constructor.prototype);
  // a và b có CÙNG prototype chain!
  // NHƯNG b KHÔNG chạy constructor code!

  ┌──────────────┬───────────────────┬──────────────────────┐
  │              │ new               │ Object.create()      │
  ├──────────────┼───────────────────┼──────────────────────┤
  │ Constructor? │ ✅ Chạy!         │ ❌ Không chạy!       │
  │ Prototype?   │ ✅ Auto set!     │ ✅ Explicitly set!   │
  │ Linh hoạt?   │ ❌ Cần function  │ ✅ Bất kỳ object!    │
  │ Descriptors? │ ❌ Không         │ ✅ Có param thứ 2!   │
  │ null proto?  │ ❌ Không thể     │ ✅ Object.create(null)│
  └──────────────┴───────────────────┴──────────────────────┘
```

---

## §6. Constructor Function (ES5)

```javascript
// ═══ ES5: CONSTRUCTOR FUNCTION + PROTOTYPE ═══

function Dog(name, breed) {
  // OWN properties (mỗi instance 1 bản):
  this.name = name;
  this.breed = breed;
}

// SHARED methods (trên prototype):
Dog.prototype.bark = function () {
  return "Woof!";
};

Dog.prototype.describe = function () {
  return `${this.name} is a ${this.breed}`;
};

// Tạo instances:
const dog1 = new Dog("Daisy", "Labrador");
const dog2 = new Dog("Max", "Husky");

console.log(dog1.bark()); // "Woof!"
console.log(dog2.describe()); // "Max is a Husky"

// CHIA SẺ cùng 1 hàm:
console.log(dog1.bark === dog2.bark); // true!
```

```
new KEYWORD — CHUYỆN GÌ XẢY RA?
═══════════════════════════════════════════════════════════════

  const dog1 = new Dog("Daisy", "Lab");

  JavaScript thực hiện 4 bước:
  ① Tạo EMPTY object: {}
  ② Set __proto__ = Dog.prototype
  ③ Gọi Dog() với this = object mới
  ④ Return object (nếu constructor không return object khác)

  // Tương đương:
  function fakeNew(Constructor, ...args) {
      // ① + ② Tạo object + set prototype:
      const obj = Object.create(Constructor.prototype);
      // ③ Gọi constructor:
      const result = Constructor.apply(obj, args);
      // ④ Return:
      return result instanceof Object ? result : obj;
  }

  const dog1 = fakeNew(Dog, "Daisy", "Lab");
  // GIỐNG HỆT: new Dog("Daisy", "Lab")!
```

---

## §7. ES5 Inheritance — Cách cũ

```javascript
// ═══ CLASSICAL INHERITANCE (ES5) ═══

// Parent:
function Shape(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

Shape.prototype.move = function (dx, dy) {
  this.x += dx;
  this.y += dy;
  console.log(`Moved to (${this.x}, ${this.y})`);
};

// Child:
function Rectangle(x, y, width, height) {
  // ① GỌI parent constructor:
  Shape.call(this, x, y); // ← super(x, y) equivalent!
  this.width = width;
  this.height = height;
}

// ② SET prototype chain:
Rectangle.prototype = Object.create(Shape.prototype);

// ③ SỬA LẠI constructor reference:
Rectangle.prototype.constructor = Rectangle;
// Nếu không sửa: Rectangle.prototype.constructor === Shape ← SAI!

// ④ THÊM child methods:
Rectangle.prototype.area = function () {
  return this.width * this.height;
};

// SỬ DỤNG:
const rect = new Rectangle(0, 0, 10, 5);

rect.move(3, 4); // "Moved to (3, 4)" ← từ Shape!
console.log(rect.area()); // 50 ← từ Rectangle!
console.log(rect instanceof Rectangle); // true
console.log(rect instanceof Shape); // true
```

```
⚠️ ES5 INHERITANCE — SAI LẦM THƯỜNG GẶP:
═══════════════════════════════════════════════════════════════

  ❌ SAI: Gán trực tiếp prototype!
  Rectangle.prototype = Shape.prototype;
  // → Cùng 1 object! Thay đổi Rectangle.prototype
  //   sẽ ẢNH HƯỞNG Shape.prototype!

  ❌ SAI: Dùng new để tạo prototype!
  Rectangle.prototype = new Shape();
  // → Chạy constructor Shape() → có thể có side effects!
  // → Shape() cần arguments → sẽ undefined!

  ✅ ĐÚNG: Object.create()!
  Rectangle.prototype = Object.create(Shape.prototype);
  // → Tạo object MỚI → prototype = Shape.prototype
  // → KHÔNG chạy constructor!
  // → KHÔNG share cùng object!

  ❌ SAI: Quên fix constructor!
  // Sau Object.create, constructor trỏ về Shape!
  Rectangle.prototype.constructor === Shape; // ← SAI!
  // PHẢI sửa:
  Rectangle.prototype.constructor = Rectangle; // ← fix!
```

---

## §8. Property Lookup — \_\_proto\_\_ vs prototype

```javascript
// ═══ PROPERTY LOOKUP ALGORITHM ═══

function lookupProperty(obj, prop) {
  // Bước 1: Tìm OWN property:
  if (obj.hasOwnProperty(prop)) {
    return obj[prop];
  }

  // Bước 2: Đi NGƯỢC prototype chain:
  let proto = Object.getPrototypeOf(obj);
  while (proto !== null) {
    if (proto.hasOwnProperty(prop)) {
      return proto[prop];
    }
    proto = Object.getPrototypeOf(proto);
  }

  // Bước 3: Không tìm thấy:
  return undefined;
}
```

```javascript
// ═══ PROPERTY SHADOWING ═══

class Animal {
  constructor() {
    this.type = "Animal";
  }
  describe() {
    return `I am a ${this.type}`;
  }
}

class Cat extends Animal {
  constructor() {
    super();
    this.type = "Cat"; // SHADOW parent's type!
  }
  // describe() KẾ THỪA từ Animal!
}

const cat = new Cat();
console.log(cat.type); // "Cat" (OWN property!)
console.log(cat.describe()); // "I am a Cat"

// PROPERTY SHADOWING:
// → cat.type = "Cat" (OWN!) che phủ Animal's type!
// → describe() dùng this.type → lấy OWN "Cat"!
```

```javascript
// ═══ SHADOWING VỚI PROTOTYPE METHOD ═══

class Base {
  greet() {
    return "Hello from Base!";
  }
}

class Child extends Base {
  // SHADOW parent method:
  greet() {
    return "Hello from Child!";
  }
}

const child = new Child();
console.log(child.greet()); // "Hello from Child!"

// Tìm: child → Child.prototype.greet ← TÌM THẤY! Dừng!
// KHÔNG đi tiếp đến Base.prototype.greet!
// → Child.prototype.greet "che phủ" Base.prototype.greet!

// Muốn gọi parent? Dùng super:
class Child2 extends Base {
  greet() {
    return super.greet() + " And from Child2!";
  }
}
```

---

## §9. Thêm method SAU KHI tạo instance

```javascript
// ═══ DYNAMIC PROTOTYPE — THÊM METHOD SAU! ═══

class Dog {
  constructor(name) {
    this.name = name;
  }
  bark() {
    return "Woof!";
  }
}

const dog1 = new Dog("Daisy");
const dog2 = new Dog("Max");
const dog3 = new Dog("Spot");

// dog1.play() → ❌ TypeError: not a function!

// THÊM method vào prototype SAU KHI tạo instances:
Dog.prototype.play = function () {
  console.log(`${this.name} is playing!`);
};

// TẤT CẢ instances CÓ NGAY:
dog1.play(); // "Daisy is playing!" ✅
dog2.play(); // "Max is playing!"   ✅
dog3.play(); // "Spot is playing!"  ✅

// TẠI SAO?
// → dog1.play → tìm dog1 OWN? ❌
// → tìm Dog.prototype? ✅ CÓ! (vừa thêm!)
// → DYNAMIC! Vì __proto__ là REFERENCE, không phải COPY!
```

```
⚠️ QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  ✅ CÓ THỂ thêm METHOD vào prototype bất cứ lúc nào!
  → Tất cả instances sẽ CÓ NGAY!
  → Vì __proto__ là REFERENCE (pointer!)

  ❌ KHÔNG NÊN thêm vào built-in prototypes!
  // ĐỪNG!
  Array.prototype.first = function() {
      return this[0];
  };
  // → Pollute! Ảnh hưởng TẤT CẢ arrays!
  // → Xung đột nếu future JS thêm Array.first!
  // → Libraries khác có thể BREAK!

  ❌ ĐỪNG modify Object.prototype:
  Object.prototype.log = function() {
      console.log(this);
  };
  // → MỌI object đều có .log()!
  // → for...in loops sẽ thấy "log" → BREAK code!
```

---

## §10. hasOwnProperty vs in

```javascript
// ═══ PHÂN BIỆT OWN vs PROTOTYPE PROPERTIES ═══

class Car {
  constructor(brand) {
    this.brand = brand;
  }
  drive() {
    return "Driving!";
  }
}

const car = new Car("Toyota");

// ── hasOwnProperty: CHỈ OWN! ──
console.log(car.hasOwnProperty("brand")); // true  ← OWN!
console.log(car.hasOwnProperty("drive")); // false ← PROTOTYPE!
console.log(car.hasOwnProperty("toString")); // false ← Object.prototype!

// ── in: OWN + PROTOTYPE CHAIN! ──
console.log("brand" in car); // true  ← OWN!
console.log("drive" in car); // true  ← PROTOTYPE! (tìm qua chain!)
console.log("toString" in car); // true  ← Object.prototype!
console.log("xyz" in car); // false ← KHÔNG CÓ ở đâu cả!
```

```javascript
// ═══ LIỆT KÊ PROPERTIES ═══

class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  greet() {
    return `Hi, I'm ${this.name}`;
  }
}

const john = new Person("John", 30);
john.hobby = "coding";

// Object.keys() → CHỈ OWN + ENUMERABLE:
console.log(Object.keys(john));
// ["name", "age", "hobby"]

// Object.getOwnPropertyNames() → CHỈ OWN (kể cả non-enumerable):
console.log(Object.getOwnPropertyNames(john));
// ["name", "age", "hobby"]

// for...in → OWN + PROTOTYPE + ENUMERABLE:
for (const key in john) {
  console.log(key);
}
// "name", "age", "hobby", "greet" ← PROTOTYPE method cũng xuất hiện!

// ⚠️ Vì vậy for...in luôn dùng với hasOwnProperty:
for (const key in john) {
  if (john.hasOwnProperty(key)) {
    console.log(key); // Chỉ: "name", "age", "hobby"
  }
}
```

---

## §11. Object.getPrototypeOf & Object.setPrototypeOf

```javascript
// ═══ CÁCH HIỆN ĐẠI ĐỌC/GHI PROTOTYPE ═══

class Dog {
  bark() {
    return "Woof!";
  }
}

const dog = new Dog();

// ── ĐỌC prototype (thay vì __proto__): ──
const proto = Object.getPrototypeOf(dog);
console.log(proto === Dog.prototype); // true!

// ── GHI prototype (TRÁNH!): ──
const catProto = {
  meow() {
    return "Meow!";
  },
};

Object.setPrototypeOf(dog, catProto);
console.log(dog.meow()); // "Meow!"
// console.log(dog.bark()); // ❌ TypeError! Không còn Dog.prototype!
```

```
⚠️ Object.setPrototypeOf — CẢNH BÁO PERFORMANCE:
═══════════════════════════════════════════════════════════════

  Object.setPrototypeOf() = CHẬM!
  → V8 (Chrome/Node) TỐI ƯU dựa trên prototype shape!
  → Thay đổi prototype SAU KHI tạo object!
  → → V8 phải DE-OPTIMIZE → CHẬM!
  → → Ảnh hưởng MỌI code truy cập object đó!

  MDN WARNING:
  "Changing the [[Prototype]] of an object is, by the nature
  of how modern JavaScript engines optimize property accesses,
  currently a very slow operation."

  → THAY THẾ: dùng Object.create() từ đầu!
  → Hoặc dùng class extends!
```

---

## §12. Prototype Pollution — Nguy hiểm!

```javascript
// ═══ PROTOTYPE POLLUTION — TẤN CÔNG! ═══

// Kịch bản: Server nhận JSON từ client!
function merge(target, source) {
  for (const key in source) {
    if (typeof source[key] === "object" && source[key] !== null) {
      if (!target[key]) target[key] = {};
      merge(target[key], source[key]); // Recursive!
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Attacker gửi:
const malicious = JSON.parse('{"__proto__": {"isAdmin": true}}');

const userConfig = {};
merge(userConfig, malicious);

// BÂY GIỜ MỌI object đều có isAdmin!
const newUser = {};
console.log(newUser.isAdmin); // true ← 💀 NGUY HIỂM!
```

```javascript
// ═══ PHÒNG TRÁNH PROTOTYPE POLLUTION ═══

// ✅ FIX 1: Object.create(null) — không có __proto__:
function safeMerge(target, source) {
  for (const key of Object.keys(source)) {
    // Object.keys, KHÔNG for...in!
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue; // BỎ QUA keys nguy hiểm!
    }
    if (typeof source[key] === "object" && source[key] !== null) {
      if (!target[key]) target[key] = Object.create(null);
      safeMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// ✅ FIX 2: Object.freeze(Object.prototype) — lock prototype:
Object.freeze(Object.prototype);
// → Không ai có thể modify Object.prototype!
// → ⚠️ Nhưng có thể BREAK libraries!

// ✅ FIX 3: hasOwnProperty check:
if (Object.prototype.hasOwnProperty.call(source, key)) {
  // xử lý...
}

// ✅ FIX 4: Map thay vì plain object:
const safeMap = new Map();
// Map KHÔNG bị prototype pollution!
```

```
PROTOTYPE POLLUTION — TÓM TẮT:
═══════════════════════════════════════════════════════════════

  NGUYÊN NHÂN:
  → Deep merge/clone KHÔNG check __proto__!
  → Attacker inject __proto__ property!
  → → Thay đổi Object.prototype!
  → → ẢNH HƯỞNG mọi object!

  HẬU QUẢ:
  → isAdmin = true → Authorization bypass!
  → RCE (Remote Code Execution!)
  → DoS (Denial of Service!)

  PHÒNG TRÁNH:
  → Dùng Object.keys() thay for...in!
  → Filter __proto__, constructor, prototype!
  → Dùng Object.create(null) hoặc Map!
  → Dùng Object.freeze(Object.prototype)!
  → Validate input (Zod, Joi, etc.!)
```

---

## §13. Performance

```
PROTOTYPE LOOKUP — PERFORMANCE:
═══════════════════════════════════════════════════════════════

  ✅ NHANH:
  → V8 dùng HIDDEN CLASSES (Shapes!) để optimize!
  → Prototype lookup được CACHE!
  → Inline Caching: sau lần đầu, không cần tìm lại!
  → Gần như NGANG TỐC ĐỘ own property!

  ⚠️ CHẬM NẾU:
  → Prototype chain QUÁ DÀI!
  → 10+ levels → lookup chậm!
  → Object.setPrototypeOf() → de-optimize!
  → Mega-morphic (nhiều shapes khác nhau!) → de-optimize!

  BỘ NHỚ:
  → 1000 instances chia sẻ prototype methods!
  → CHỈ 1 bản copy method trên prototype!
  → Own property methods: 1000 bản copy → LÃNG PHÍ!

  ┌──────────────────────┬──────────────────────────────┐
  │ Pattern              │ Memory (1000 instances)      │
  ├──────────────────────┼──────────────────────────────┤
  │ Prototype method     │ 1 function × 1 = 1 function │
  │ Own method           │ 1 function × 1000 = 1000!   │
  │ Closure per instance │ 1 closure × 1000 = 1000!    │
  └──────────────────────┴──────────────────────────────┘
```

---

## §14. Prototype Pattern vs Class Pattern

```
SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬──────────────────┬──────────────────┐
  │                    │ Prototype Pattern│ Class Pattern    │
  ├────────────────────┼──────────────────┼──────────────────┤
  │ Syntax             │ Object.create()  │ class / extends  │
  │ Flexibility        │ ✅ Rất linh hoạt │ ⚠️ Cứng nhắc hơn│
  │ Constructor?       │ Không bắt buộc   │ Bắt buộc         │
  │ Readability        │ ✅ Rõ ràng đơn giản│ ✅ Familiar!   │
  │ Dynamic?           │ ✅ Thêm/bỏ      │ ⚠️ Cần modify    │
  │                    │   runtime!        │   prototype.     │
  │ private fields?    │ ❌ Closure!       │ ✅ #private!     │
  │ static methods?    │ Trên constructor! │ ✅ static!       │
  │ Multi-inheritance? │ ✅ Mixin!        │ ❌ Single only!  │
  └────────────────────┴──────────────────┴──────────────────┘
```

```javascript
// ═══ PROTOTYPAL STYLE (Object.create!) ═══

const Animal = {
  init(name) {
    this.name = name;
    return this; // Cho phép chain!
  },
  speak() {
    return `${this.name} makes a sound.`;
  },
};

const Dog = Object.create(Animal);
Dog.bark = function () {
  return `${this.name} barks: Woof!`;
};

// Tạo instance:
const rex = Object.create(Dog).init("Rex");
console.log(rex.speak()); // "Rex makes a sound." ← từ Animal!
console.log(rex.bark()); // "Rex barks: Woof!" ← từ Dog!
```

```javascript
// ═══ CLASS STYLE (ES6!) ═══

class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return `${this.name} makes a sound.`;
  }
}

class Dog extends Animal {
  bark() {
    return `${this.name} barks: Woof!`;
  }
}

const rex = new Dog("Rex");
console.log(rex.speak()); // "Rex makes a sound."
console.log(rex.bark()); // "Rex barks: Woof!"
```

```javascript
// ═══ MIXIN PATTERN — MULTI-INHERITANCE! ═══

// Class chỉ extends 1 parent!
// Mixin = COPY methods từ nhiều sources!

const Serializable = {
  serialize() {
    return JSON.stringify(this);
  },
  deserialize(json) {
    return Object.assign(this, JSON.parse(json));
  },
};

const EventEmitter = {
  _listeners: null,
  on(event, fn) {
    if (!this._listeners) this._listeners = {};
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },
  emit(event, ...args) {
    if (this._listeners && this._listeners[event]) {
      this._listeners[event].forEach((fn) => fn(...args));
    }
  },
};

// APPLY MIXINS:
class User {
  constructor(name) {
    this.name = name;
  }
}

Object.assign(User.prototype, Serializable, EventEmitter);

const user = new User("John");
user.on("save", () => console.log("Saved!"));
console.log(user.serialize()); // '{"name":"John"}'
user.emit("save"); // "Saved!"
```

---

## §15. Real-World Applications

```javascript
// ═══ COMPONENT SYSTEM — PROTOTYPE PATTERN ═══

const Component = {
  init(props = {}) {
    this.props = props;
    this.state = {};
    this._mounted = false;
    return this;
  },

  setState(newState) {
    this.state = { ...this.state, ...newState };
    if (this._mounted) {
      this.render();
    }
  },

  mount(container) {
    this._mounted = true;
    this._container = container;
    this.render();
  },

  render() {
    throw new Error("Subclass must implement render()!");
  },
};

// Kế thừa:
const Counter = Object.create(Component);

Counter.render = function () {
  const count = this.state.count || 0;
  this._container.innerHTML = `
        <div>
            <p>Count: ${count}</p>
            <button onclick="counter.increment()">+</button>
        </div>
    `;
};

Counter.increment = function () {
  this.setState({ count: (this.state.count || 0) + 1 });
};

// SỬ DỤNG:
const counter = Object.create(Counter).init({ title: "My Counter" });
// counter.mount(document.getElementById('app'));
```

```javascript
// ═══ OBJECT POOL — PROTOTYPE REUSE ═══

class ObjectPool {
  constructor(factory, resetFn, initialSize = 10) {
    this.factory = factory;
    this.resetFn = resetFn;
    this.pool = [];

    // Pre-allocate:
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire() {
    return this.pool.length > 0 ? this.pool.pop() : this.factory();
  }

  release(obj) {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

// PROTOTYPE cho particles:
const ParticleProto = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  life: 100,

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  },

  isAlive() {
    return this.life > 0;
  },
};

const particlePool = new ObjectPool(
  () => Object.create(ParticleProto),
  (p) => {
    p.x = p.y = p.vx = p.vy = 0;
    p.life = 100;
  },
  100,
);

// SỬ DỤNG:
const particle = particlePool.acquire();
particle.x = 100;
particle.y = 200;
particle.vx = 2;
particle.life = 50;

// Khi xong:
particlePool.release(particle);
// → particle được RESET + trả về pool!
// → KHÔNG tạo garbage → GC không phải dọn!
```

```javascript
// ═══ DELEGATION PATTERN — FORWARDING QUA PROTOTYPE ═══

const Logger = {
  log(...args) {
    console.log(`[${new Date().toISOString()}]`, ...args);
  },
  warn(...args) {
    console.warn(`[WARN]`, ...args);
  },
  error(...args) {
    console.error(`[ERROR]`, ...args);
  },
};

const AppLogger = Object.create(Logger);
AppLogger.info = function (...args) {
  this.log("[INFO]", ...args);
};
AppLogger.debug = function (...args) {
  if (this.debugMode) {
    this.log("[DEBUG]", ...args);
  }
};
AppLogger.debugMode = false;

// Module-specific logger:
const AuthLogger = Object.create(AppLogger);
AuthLogger.loginAttempt = function (user) {
  this.info(`Login attempt: ${user}`);
};
AuthLogger.loginFailed = function (user, reason) {
  this.warn(`Login failed: ${user} - ${reason}`);
};

// SỬ DỤNG:
AuthLogger.loginAttempt("john@example.com");
// → [2026-02-14T...] [INFO] Login attempt: john@example.com

AuthLogger.loginFailed("john@example.com", "wrong password");
// → [WARN] Login failed: john@example.com - wrong password

// CHAIN:
// AuthLogger → AppLogger → Logger → Object.prototype → null
// loginAttempt → AppLogger.info → Logger.log → console.log
```

---

## §16. Tóm tắt

```
PROTOTYPE PATTERN — TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Prototype là gì?"
  A: Object native trong JS, mọi object đều có prototype!
  Khi access property không có → JS tìm NGƯỢC LÊN prototype chain!
  Tiết kiệm memory vì instances CHIA SẺ cùng prototype methods!

  Q: "__proto__ vs prototype?"
  A: __proto__ → trên MỌI object, trỏ đến prototype (deprecated!)
  prototype → trên function/class, chứa methods CHIA SẺ!
  Dog.prototype === dog1.__proto__!

  Q: "Class & Prototype?"
  A: ES6 class = SYNTAX SUGAR! Bên dưới VẪN là prototype!
  Methods trong class → tự động vào Constructor.prototype!
  typeof class === 'function'!

  Q: "Object.create()?"
  A: Tạo object MỚI với prototype CHỈ ĐỊNH!
  KHÔNG chạy constructor! Linh hoạt hơn new!
  Object.create(null) → pure dictionary, không có __proto__!

  Q: "Prototype Pollution?"
  A: Attacker inject __proto__ qua deep merge!
  → Object.prototype bị thay đổi → MỌI object bị ảnh hưởng!
  Fix: filter key, Object.create(null), Map, Object.freeze!

  Q: "Prototype vs Class?"
  A: Prototype: linh hoạt, dynamic, mixin, delegation!
  Class: familiar syntax, private fields, static methods!
  Cả hai đều dựa trên prototype engine!

  Q: "Performance?"
  A: V8 cache prototype lookup (inline caching!)
  1000 instances chia sẻ 1 method = TIẾT KIỆM bộ nhớ!
  TRÁNH Object.setPrototypeOf() → de-optimize!
```

---

### Checklist

- [ ] **Prototype concept**: mọi object có prototype; tìm property ngược lên chain; dùng chung methods!
- [ ] **Prototype Chain**: instance → Constructor.prototype → Object.prototype → null!
- [ ] **\_\_proto\_\_ vs prototype**: \_\_proto\_\_ trên instance (deprecated); prototype trên function/class!
- [ ] **ES6 Class**: syntax sugar của prototype; methods tự vào prototype; typeof = 'function'!
- [ ] **Kế thừa**: extends, super(); prototype chain dài thêm 1 level; instanceof check chain!
- [ ] **Method overriding**: child method "shadow" parent; super.method() gọi parent!
- [ ] **Object.create()**: tạo với prototype chỉ định; KHÔNG chạy constructor; property descriptors!
- [ ] **Object.create(null)**: pure dictionary; không toString/hasOwnProperty; safe từ pollution!
- [ ] **Constructor function (ES5)**: function + prototype + new; 4 bước của new keyword!
- [ ] **ES5 inheritance**: Shape.call(this), Object.create(Shape.prototype), fix constructor!
- [ ] **Dynamic prototype**: thêm method SAU tạo instance → TẤT CẢ instances có ngay!
- [ ] **hasOwnProperty vs in**: hasOwnProperty = chỉ own; in = own + prototype chain!
- [ ] **for...in**: liệt kê own + prototype enumerable; luôn check hasOwnProperty!
- [ ] **Prototype Pollution**: \_\_proto\_\_ injection; filter keys, Object.create(null), Map, Object.freeze!
- [ ] **Performance**: V8 inline caching; 1 method chia sẻ 1000 instances; TRÁNH setPrototypeOf!
- [ ] **Mixin**: Object.assign(Class.prototype, mixin1, mixin2) = multi-inheritance workaround!

---

_Nguồn: patterns.dev — Prototype Pattern, MDN Web Docs (Object.create, Prototype Chain)_
_Cập nhật lần cuối: Tháng 2, 2026_
