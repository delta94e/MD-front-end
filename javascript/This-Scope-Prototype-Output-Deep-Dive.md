# this, Scope & Prototype — Code Output Deep Dive (Part 2)

> 📅 2026-02-11 · ⏱ 25 phút đọc
>
> 32 bài output questions về this binding, Scope/Hoisting/Closure,
> và Prototype/Inheritance. Phân tích chi tiết execution context,
> scope chain, và prototype chain.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: JavaScript Core Concepts

---

## Mục Lục

0. [this Binding (Q1–Q15)](#0-this-binding-q1q15)
1. [Scope, Hoisting & Closure (Q16–Q23)](#1-scope-hoisting--closure-q16q23)
2. [Prototype & Inheritance (Q24–Q32)](#2-prototype--inheritance-q24q32)

---

## 0. this Binding (Q1–Q15)

```
THIS BINDING — 4 QUY TẮC (ưu tiên giảm dần):
═══════════════════════════════════════════════════════════════

  ① new binding       → this = object mới tạo
  ② explicit binding  → call/apply/bind chỉ định this
  ③ implicit binding  → obj.method() → this = obj
  ④ default binding   → this = window (strict: undefined)

  ⚠️ Arrow function: KHÔNG có this riêng → lấy từ PARENT SCOPE
```

### Q1: Implicit binding bị mất

```javascript
function foo() {
  console.log(this.a);
}
function doFoo() {
  foo();
}
var obj = { a: 1, doFoo: doFoo };
var a = 2;
obj.doFoo();
```

> **Output: `2`**
>
> → `obj.doFoo()` gọi `doFoo`, nhưng bên trong `foo()` được gọi **không qua object** → default binding → `this = window` → `a = 2`.

### Q2: Arrow function — this từ parent

```javascript
var a = 10;
var obj = {
  a: 20,
  say: () => {
    console.log(this.a);
  },
};
obj.say();
var anotherObj = { a: 30 };
obj.say.apply(anotherObj);
```

> **Output: `10 10`**
>
> → Arrow function **KHÔNG bind this** → lấy từ **parent scope** (global) → `a = 10`.
> → `apply` cũng **KHÔNG thay đổi** this của arrow function.
> → Nếu dùng **regular function** → output: `20 30`.

### Q3: call(null) → window

```javascript
function a() {
  console.log(this);
}
a.call(null);
```

> **Output: `window`**
>
> → `call(null)` hoặc `call(undefined)` → **this = window** (non-strict).
> → Strict mode: `null` là `null`, `undefined` là `undefined`.

### Q4: new constructor — this = new object

```javascript
var obj = {
  name: "cuggz",
  fun: function () {
    console.log(this.name);
  },
};
obj.fun(); // cuggz (implicit binding)
new obj.fun(); // undefined (new binding → this = empty object)
```

> **Output: `cuggz` → `undefined`**

### Q5: Arrow trong method vs arrow trong object

```javascript
var obj = {
  say: function () {
    var f1 = () => {
      console.log("1111", this);
    };
    f1();
  },
  pro: {
    getPro: () => {
      console.log(this);
    },
  },
};
var o = obj.say;
o(); // 1111 window   (say gọi global → arrow lấy global)
obj.say(); // 1111 obj      (say gọi bởi obj → arrow lấy obj)
obj.pro.getPro(); // window    (arrow trong object → parent = global)
```

> → Arrow trong **method function** → lấy this của method.
> → Arrow **trực tiếp trong object** → object KHÔNG tạo scope → lấy **global**.

### Q6: self = this pattern

```javascript
var myObject = {
  foo: "bar",
  func: function () {
    var self = this;
    console.log(this.foo); // bar (implicit)
    console.log(self.foo); // bar (closure)
    (function () {
      console.log(this.foo); // undefined (IIFE → window)
      console.log(self.foo); // bar (closure → self = myObject)
    })();
  },
};
myObject.func();
```

> **Output: `bar bar undefined bar`**
>
> → IIFE: `this = window`, nhưng `self` tìm qua **scope chain** → `myObject`.

### Q7: IIFE + return function + this

```javascript
window.number = 2;
var obj = {
  number: 3,
  db1: (function () {
    this.number *= 4; // IIFE → this=window → window.number=8
    return function () {
      this.number *= 5;
    };
  })(),
};
var db1 = obj.db1;
db1(); // this=window → window.number = 8*5 = 40
obj.db1(); // this=obj → obj.number = 3*5 = 15
console.log(obj.number); // 15
console.log(window.number); // 40
```

### Q8: arguments[0]() — this = arguments

```javascript
var length = 10;
function fn() {
  console.log(this.length);
}
var obj = {
  length: 5,
  method: function (fn) {
    fn(); // this=window → length=10
    arguments[0](); // this=arguments → arguments.length=2
  },
};
obj.method(fn, 1);
```

> **Output: `10 2`**
>
> → `arguments[0]()` = gọi method trên arguments object → `this = arguments` → `length = 2` (2 params).

### Q9: Method reference mất implicit binding

```javascript
var a = 1;
function printA() {
  console.log(this.a);
}
var obj = {
  a: 2,
  foo: printA,
  bar: function () {
    printA();
  },
};
obj.foo(); // 2 (implicit → obj)
obj.bar(); // 1 (printA() gọi trực tiếp → window)
var foo = obj.foo;
foo(); // 1 (reference mất binding → window)
```

> **Output: `2 1 1`**

### Q10: IIFE trong method → this = window

```javascript
var x = 3;
var y = 4;
var obj = {
  x: 1,
  y: 6,
  getX: function () {
    var x = 5;
    return (function () {
      return this.x;
    })(); // IIFE → window
  },
  getY: function () {
    var y = 7;
    return this.y; // implicit → obj
  },
};
console.log(obj.getX()); // 3 (window.x)
console.log(obj.getY()); // 6 (obj.y)
```

### Q11: call() empty = window

```javascript
var a = 10;
var obj = {
  a: 20,
  fn: function () {
    console.log(this.a);
  },
};
obj.fn(); // 20 (implicit)
obj.fn.call(); // 10 (call() empty → window)
obj.fn(); // 20 (parentheses no effect)
```

### Q12: a(5) overwrite global x

```javascript
function a(xx) {
  this.x = xx;
  return this;
}
var x = a(5); // window.x = 5, return window → x = window
var y = a(6); // window.x = 6, return window → y = window
console.log(x.x); // undefined (x=window bị overwrite bởi a(6))
console.log(y.x); // 6
```

> **Output: `undefined 6`**
>
> → `a(5)`: window.x=5, x=window. `a(6)`: window.x=6 → overwrite. `x.x` = window.x nhưng x đã bị reassign.

### Q13: this binding priority

```javascript
function foo(something) {
  this.a = something;
}
var obj1 = { foo: foo };
var obj2 = {};
obj1.foo(2);
console.log(obj1.a); // 2 (implicit)
obj1.foo.call(obj2, 3);
console.log(obj2.a); // 3 (explicit > implicit)
var bar = new obj1.foo(4);
console.log(obj1.a); // 2 (không thay đổi)
console.log(bar.a); // 4 (new > implicit)
```

> **Output: `2 3 2 4`** → Priority: new > explicit > implicit > default.

### Q14: new > bind

```javascript
function foo(something) {
  this.a = something;
}
var obj1 = {};
var bar = foo.bind(obj1);
bar(2);
console.log(obj1.a); // 2
var baz = new bar(3);
console.log(obj1.a); // 2 (không đổi!)
console.log(baz.a); // 3 (new > bind)
```

> **Output: `2 2 3`** → `new` override `bind`.

---

## 1. Scope, Hoisting & Closure (Q16–Q23)

```
SCOPE RULES:
═══════════════════════════════════════════════════════════════

  ① var x = y = 1 → y là GLOBAL (không có var)
  ② var hoisting: khai báo lên đầu, giá trị = undefined
  ③ function hoisting: TOÀN BỘ function lên đầu
  ④ function expression: CHỈ hoisting biến, không hoisting body
  ⑤ Scope chain: xác định lúc DEFINE, không phải lúc EXECUTE
```

### Q16: var x = y = 1

```javascript
(function () {
  var x = (y = 1);
})();
var z;
console.log(y); // 1 (y là global!)
console.log(z); // undefined
console.log(x); // ReferenceError (x là local)
```

> → `y = 1` không có `var` → **global**. `var x = y` → x là **local**.

### Q17: b = 3 global trong IIFE

```javascript
var a, b;
(function () {
  console.log(a); // undefined (hoisted)
  console.log(b); // undefined (hoisted)
  var a = (b = 3); // b=3 global, a=3 local
  console.log(a); // 3
  console.log(b); // 3
})();
console.log(a); // undefined (outer a)
console.log(b); // 3 (global b)
```

### Q18: Variable hoisting trong IIFE

```javascript
var friendName = "World";
(function () {
  if (typeof friendName === "undefined") {
    var friendName = "Jack"; // hoisted → friendName = undefined
    console.log("Goodbye " + friendName);
  } else {
    console.log("Hello " + friendName);
  }
})();
```

> **Output: `Goodbye Jack`**
>
> → `var friendName` hoisted trong IIFE → `undefined` → typeof = 'undefined' → vào if.

### Q19: Function declaration vs expression hoisting

```javascript
function fn1() {
  console.log("fn1");
}
var fn2;
fn1(); // fn1 ✅ (function declaration hoisted)
fn2(); // TypeError: fn2 is not a function ❌
fn2 = function () {
  console.log("fn2");
};
fn2(); // fn2 ✅
```

### Q20: Closure — scope chain lúc define

```javascript
function a() {
  var temp = 10;
  function b() {
    console.log(temp);
  } // closure → 10
  b();
}
a(); // 10

function a() {
  var temp = 10;
  b();
}
function b() {
  console.log(temp);
} // ReferenceError!
a();
```

> → Closure: b **define trong a** → access temp.
> → b **define ngoài a** → scope chain **không có** temp → Error.

### Q21: Scope chain ≠ execution context

```javascript
var a = 3;
function c() {
  alert(a);
}
(function () {
  var a = 4;
  c();
})();
```

> **Output: `3`** (KHÔNG phải 4!)
>
> → Scope chain xác định lúc **DEFINE** (c define ở global → a=3).
> → Execution context chỉ thay đổi **this**, không thay scope chain.

### Q22: Complex closure — fun chain

```javascript
function fun(n, o) {
  console.log(o);
  return {
    fun: function (m) {
      return fun(m, n);
    },
  };
}
var a = fun(0);
a.fun(1);
a.fun(2);
a.fun(3);
var b = fun(0).fun(1).fun(2).fun(3);
var c = fun(0).fun(1);
c.fun(2);
c.fun(3);
```

> **Output:**
>
> ```
> undefined  0  0  0      // a: n luôn = 0 (closure giữ n=0)
> undefined  0  1  2      // b: chain → n thay đổi mỗi lần
> undefined  0  1  1      // c: n=1 từ fun(1), giữ nguyên
> ```

### Q23: g() hoisting + [] == ![]

```javascript
f = function () {
  return true;
};
g = function () {
  return false;
};
(function () {
  if (g() && [] == ![]) {
    f = function f() {
      return false;
    };
    function g() {
      return true;
    } // hoisted trong IIFE
  }
})();
console.log(f());
```

> **Output: `false`**
>
> → `g()` hoisted trong IIFE → return true.
> → `[] == ![]`: `![] = false`, `[] == false` → `"" == 0` → `0 == 0` → true.
> → Cả 2 true → `f` reassigned global → return false.

---

## 2. Prototype & Inheritance (Q24–Q32)

```
PROTOTYPE CHAIN:
═══════════════════════════════════════════════════════════════

  instance.__proto__ === Constructor.prototype
  Constructor.prototype.__proto__ === Object.prototype
  Object.prototype.__proto__ === null

  PROPERTY LOOKUP: instance → own → __proto__ → ... → null
```

### Q24: Prototype chain navigation

```javascript
function Person(name) {
  this.name = name;
}
var p2 = new Person("king");
p2.__proto__; // Person.prototype
p2.__proto__.__proto__; // Object.prototype
p2.__proto__.__proto__.__proto__; // null
p2.constructor; // Person
p2.prototype; // undefined (instance!)
Person.prototype.constructor; // Person
Person.__proto__; // Function.prototype
Function.prototype.__proto__; // Object.prototype
Object.__proto__; // Function.prototype
Object.prototype.__proto__; // null
```

### Q25: Classic — Foo.getName() puzzle

```javascript
function Foo() {
  getName = function () {
    console.log(1);
  };
  return this;
}
Foo.getName = function () {
  console.log(2);
};
Foo.prototype.getName = function () {
  console.log(3);
};
var getName = function () {
  console.log(4);
};
function getName() {
  console.log(5);
}

Foo.getName(); // 2 (static method)
getName(); // 4 (expression > declaration)
Foo().getName(); // 1 (Foo() reassign global getName)
getName(); // 1 (global đã bị reassign)
new Foo.getName(); // 2 → new (Foo.getName)()
new Foo().getName(); // 3 → (new Foo()).getName() → prototype
new new Foo().getName(); // 3 → new ((new Foo()).getName)()
```

### Q26: F instance vs F constructor

```javascript
var F = function () {};
Object.prototype.a = function () {
  console.log("a");
};
Function.prototype.b = function () {
  console.log("b");
};
var f = new F();
f.a(); // a ✅ (f → F.prototype → Object.prototype)
f.b(); // TypeError ❌ (f KHÔNG trên Function.prototype chain)
F.a(); // a ✅ (F → Function.prototype → Object.prototype)
F.b(); // b ✅ (F → Function.prototype)
```

> → Instance `f`: chỉ access **Object.prototype**.
> → Constructor `F`: access cả **Function.prototype** + **Object.prototype**.

### Q27: Static vs instance vs prototype method

```javascript
function Foo() {
  Foo.a = function () {
    console.log(1);
  };
  this.a = function () {
    console.log(2);
  };
}
Foo.prototype.a = function () {
  console.log(3);
};
Foo.a = function () {
  console.log(4);
};

Foo.a(); // 4 (static, chưa gọi Foo())
let obj = new Foo(); // initialize → Foo.a=log(1), obj.a=log(2)
obj.a(); // 2 (own property > prototype)
Foo.a(); // 1 (static bị overwrite bởi constructor)
```

> **Output: `4 2 1`**

### Q28: Prototype assignment + A.n++

```javascript
var A = { n: 4399 };
var B = function () {
  this.n = 9999;
};
var C = function () {
  var n = 8888;
};
B.prototype = A;
C.prototype = A;
var b = new B();
var c = new C();
A.n++;
console.log(b.n); // 9999 (own property)
console.log(c.n); // 4400 (prototype → A.n = 4399+1)
```

### Q29: Constructor with conditional

```javascript
function A() {}
function B(a) {
  this.a = a;
}
function C(a) {
  if (a) {
    this.a = a;
  }
}
A.prototype.a = 1;
B.prototype.a = 1;
C.prototype.a = 1;

console.log(new A().a); // 1 (no own → prototype)
console.log(new B().a); // undefined (own a=undefined)
console.log(new C(2).a); // 2 (own a=2)
```

### Q30: Complex inheritance — Child.change()

```javascript
function Parent() {
  this.a = 1;
  this.b = [1, 2, this.a];
  this.c = { demo: 5 };
  this.show = function () {
    console.log(this.a, this.b, this.c.demo);
  };
}
function Child() {
  this.a = 2;
  this.change = function () {
    this.b.push(this.a);
    this.a = this.b.length;
    this.c.demo = this.a++;
  };
}
Child.prototype = new Parent();
var parent = new Parent();
var child1 = new Child();
var child2 = new Child();
child1.a = 11;
child2.a = 12;

parent.show(); // 1  [1,2,1]  5
child1.show(); // 11 [1,2,1]  5
child2.show(); // 12 [1,2,1]  5

child1.change(); // b→[1,2,1,11], a→4, c.demo→4, a→5
child2.change(); // b→[1,2,1,11,12], a→5, c.demo→5, a→6

parent.show(); // 1 [1,2,1] 5    (riêng biệt!)
child1.show(); // 5 [1,2,1,11,12] 5
child2.show(); // 6 [1,2,1,11,12] 5
```

> → **Key**: child1 và child2 **share cùng prototype** (b, c là reference types!).
> → `this.b` không có own → lấy **prototype.b** → cả 2 child modify **cùng array**.

### Q31: constructor vs instanceof

```javascript
function Dog() {
  this.name = "puppy";
}
Dog.prototype.bark = () => {
  console.log("woof!woof!");
};
const dog = new Dog();
console.log(
  Dog.prototype.constructor === Dog &&
    dog.constructor === Dog &&
    dog instanceof Dog,
);
```

> **Output: `true`**
>
> → `constructor` là property của **prototype**, instance access qua chain.
> → `instanceof` check prototype **chain** (rộng hơn constructor).

### Q32: Prototype chain inheritance

```javascript
function SuperType() {
  this.property = true;
}
SuperType.prototype.getSuperValue = function () {
  return this.property;
};
function SubType() {
  this.subproperty = false;
}
SubType.prototype = new SuperType();
SubType.prototype.getSubValue = function () {
  return this.subproperty;
};
var instance = new SubType();
console.log(instance.getSuperValue());
```

> **Output: `true`**
>
> → `instance.__proto__` = SubType.prototype = SuperType instance.
> → `getSuperValue` tìm trên chain → `this.property = true`.

---

## Quick Reference — this/Scope/Prototype Rules

```
GHI NHỚ:
═══════════════════════════════════════════════════════════════

  THIS:
  ① new > explicit (call/apply/bind) > implicit (obj.) > default
  ② Arrow function: KHÔNG có this → lấy từ PARENT scope
  ③ IIFE: this = window (non-strict)
  ④ call(null/undefined): this = window (non-strict)
  ⑤ arguments[i](): this = arguments object

  SCOPE:
  ⑥ var x = y = 1 → y GLOBAL, x LOCAL
  ⑦ var hoisting: khai báo lên đầu, value = undefined
  ⑧ function declaration: TOÀN BỘ hoisted
  ⑨ function expression: CHỈ biến hoisted
  ⑩ Scope chain: xác định lúc DEFINE, không phải EXECUTE

  PROTOTYPE:
  ⑪ instance.__proto__ === Constructor.prototype
  ⑫ Own property > prototype chain
  ⑬ Instance: chỉ Object.prototype chain
  ⑭ Constructor: Object + Function prototype chain
  ⑮ Reference types trên prototype → SHARED giữa instances
```

---

_Cập nhật lần cuối: Tháng 2, 2026_
