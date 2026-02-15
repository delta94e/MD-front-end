# JavaScript Handwritten Implementations — Deep Dive

> 📅 2026-02-11 · ⏱ 25 phút đọc
>
> 18 bài handwritten: Object.create, instanceof, new, Promise,
> Promise.then/all/race, debounce, throttle, type detection,
> call/apply/bind, curry, AJAX, shallow/deep copy.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: JavaScript Core Implementations

---

## Mục Lục

0. [Prototype Methods (create, instanceof, new)](#0-prototype-methods)
1. [Promise (Promise, then, all, race)](#1-promise)
2. [Function Utils (debounce, throttle, curry)](#2-function-utils)
3. [this Binding (call, apply, bind)](#3-this-binding)
4. [Utility (type detection, AJAX, copy)](#4-utility)
5. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#5-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Prototype Methods

### ① Object.create

> **Tạo object mới với prototype = object truyền vào.**

```javascript
function create(obj) {
  function F() {} // Tạo constructor rỗng
  F.prototype = obj; // Set prototype = obj truyền vào
  return new F(); // Return instance mới → prototype chain
}

// Tương đương:
// Object.create(obj) → object mới có __proto__ = obj
```

```
FLOW:
  create({ name: 'foo' })
  → F.prototype = { name: 'foo' }
  → new F() → instance.__proto__ = { name: 'foo' }
  → instance.name → tìm trên prototype → 'foo' ✅
```

### ② instanceof

> **Kiểm tra prototype của constructor có nằm trên prototype chain của object không.**

```javascript
function myInstanceof(left, right) {
  let proto = Object.getPrototypeOf(left); // Object prototype
  let prototype = right.prototype; // Constructor prototype

  while (true) {
    if (!proto) return false; // Hết chain → null → false
    if (proto === prototype) return true; // Tìm thấy! ✅
    proto = Object.getPrototypeOf(proto); // Leo lên chain
  }
}

// Test:
// myInstanceof([], Array)   → true
// myInstanceof([], Object)  → true (Array.proto.proto = Object.proto)
// myInstanceof({}, Array)   → false
```

```
FLOW: myInstanceof([], Array)
  proto = [].__proto__           = Array.prototype
  prototype = Array.prototype
  → proto === prototype → TRUE ✅
```

### ③ new Operator

> **4 bước: tạo object → set prototype → bind this → check return.**

```javascript
function objectFactory() {
  let newObject = null;
  let constructor = Array.prototype.shift.call(arguments);
  let result = null;

  // ① Kiểm tra constructor là function
  if (typeof constructor !== "function") {
    console.error("type error");
    return;
  }

  // ② Tạo object mới, prototype = constructor.prototype
  newObject = Object.create(constructor.prototype);

  // ③ Bind this = newObject, chạy constructor
  result = constructor.apply(newObject, arguments);

  // ④ Nếu constructor return object → dùng object đó
  //    Nếu return primitive → bỏ qua, dùng newObject
  let flag =
    result && (typeof result === "object" || typeof result === "function");
  return flag ? result : newObject;
}

// Sử dụng:
// objectFactory(Person, 'John', 25)
// ≡ new Person('John', 25)
```

```
4 BƯỚC CỦA new:
  ① Tạo object RỖNG
  ② Set __proto__ = Constructor.prototype
  ③ Gọi Constructor với this = object mới
  ④ Return: object type → return result | primitive → return newObject
```

---

## 1. Promise

### ④ Handwritten Promise

```javascript
const PENDING = "pending";
const RESOLVED = "resolved";
const REJECTED = "rejected";

function MyPromise(fn) {
  var self = this;
  this.state = PENDING;
  this.value = null;
  this.resolvedCallbacks = []; // Lưu resolve callbacks
  this.rejectedCallbacks = []; // Lưu reject callbacks

  // ── resolve: pending → resolved ──
  function resolve(value) {
    if (value instanceof MyPromise) {
      return value.then(resolve, reject);
    }
    setTimeout(() => {
      if (self.state === PENDING) {
        self.state = RESOLVED;
        self.value = value;
        self.resolvedCallbacks.forEach((cb) => cb(value));
      }
    }, 0);
  }

  // ── reject: pending → rejected ──
  function reject(value) {
    setTimeout(() => {
      if (self.state === PENDING) {
        self.state = REJECTED;
        self.value = value;
        self.rejectedCallbacks.forEach((cb) => cb(value));
      }
    }, 0);
  }

  // ── Execute fn, catch errors ──
  try {
    fn(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

// ── .then method ──
MyPromise.prototype.then = function (onResolved, onRejected) {
  // Default handlers (value pass-through)
  onResolved =
    typeof onResolved === "function"
      ? onResolved
      : function (value) {
          return value;
        };
  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : function (error) {
          throw error;
        };

  if (this.state === PENDING) {
    this.resolvedCallbacks.push(onResolved);
    this.rejectedCallbacks.push(onRejected);
  }
  if (this.state === RESOLVED) {
    onResolved(this.value);
  }
  if (this.state === REJECTED) {
    onRejected(this.value);
  }
};
```

```
KEY POINTS:
  ① State chỉ đổi 1 lần: pending → resolved HOẶC rejected
  ② Callbacks được LƯU vào array khi state = pending
  ③ Khi state đổi → gọi TẤT CẢ callbacks trong array
  ④ setTimeout đảm bảo chạy CUỐI event loop (async)
  ⑤ .then: non-function → value pass-through
```

### ⑤ Promise.then (Chaining)

> **Trả về Promise MỚI → cho phép chaining.**

```javascript
then(onFulfilled, onRejected) {
    const self = this;
    return new MyPromise((resolve, reject) => {

        // Wrap fulfilled handler
        let fulfilled = () => {
            try {
                const result = onFulfilled(self.value);    // 承前
                // Nếu result là Promise → chờ resolve
                // Nếu result là value → resolve ngay
                return result instanceof MyPromise
                    ? result.then(resolve, reject)          // 启后
                    : resolve(result);
            } catch(err) { reject(err); }
        }

        // Wrap rejected handler
        let rejected = () => {
            try {
                const result = onRejected(self.reason);
                return result instanceof MyPromise
                    ? result.then(resolve, reject)
                    : reject(result);
            } catch(err) { reject(err); }
        }

        switch(self.status) {
            case PENDING:
                self.onFulfilledCallbacks.push(fulfilled);
                self.onRejectedCallbacks.push(rejected);
                break;
            case FULFILLED: fulfilled(); break;
            case REJECTED:  rejected();  break;
        }
    })
}
```

```
CHAINING FLOW:
  promise1.then(handler1).then(handler2)
  │
  ├─ then(handler1) → return NEW Promise (promise2)
  │   └─ handler1 result → resolve promise2
  │
  └─ then(handler2) → return NEW Promise (promise3)
      └─ handler2 nhận result từ promise2
```

### ⑥ Promise.all

> **Chờ TẤT CẢ resolve. 1 reject → fail ngay.**

```javascript
function promiseAll(promises) {
  return new Promise(function (resolve, reject) {
    if (!Array.isArray(promises)) {
      throw new TypeError("argument must be an array");
    }
    var resolvedCounter = 0;
    var promiseNum = promises.length;
    var resolvedResult = [];

    for (let i = 0; i < promiseNum; i++) {
      Promise.resolve(promises[i]).then(
        (value) => {
          resolvedCounter++;
          resolvedResult[i] = value; // GIỮ THỨ TỰ ✅
          if (resolvedCounter === promiseNum) {
            return resolve(resolvedResult);
          }
        },
        (error) => {
          return reject(error); // FIRST reject → fail
        },
      );
    }
  });
}
```

```
KEY POINTS:
  ① Promise.resolve() wrap mỗi item → handle non-Promise values
  ② resolvedResult[i] = value → giữ ĐÚNG THỨ TỰ input
  ③ Counter track hoàn thành → resolve KHI counter = length
  ④ BẤT KỲ reject → reject NGAY toàn bộ
```

### ⑦ Promise.race

> **Kết quả ĐẦU TIÊN (resolve hoặc reject) thắng.**

```javascript
Promise.race = function (args) {
  return new Promise((resolve, reject) => {
    for (let i = 0, len = args.length; i < len; i++) {
      args[i].then(resolve, reject);
      // Promise state chỉ đổi 1 lần
      // → resolve/reject ĐẦU TIÊN thắng, còn lại bị ignore
    }
  });
};
```

---

## 2. Function Utils

### ⑧ Debounce (Chống rung)

> **Chờ n giây SAU sự kiện cuối → chạy. Trigger lại → reset timer.**

```javascript
function debounce(fn, wait) {
  let timer = null;

  return function () {
    let context = this,
      args = arguments;

    if (timer) {
      clearTimeout(timer); // Reset timer
      timer = null;
    }

    timer = setTimeout(() => {
      fn.apply(context, args);
    }, wait);
  };
}

// Sử dụng:
// input.addEventListener('input', debounce(search, 300))
// → Chỉ search SAU 300ms ngừng gõ
```

### ⑨ Throttle (Tiết lưu)

> **Mỗi khoảng delay → chạy TỐI ĐA 1 lần.**

```javascript
function throttle(fn, delay) {
  let curTime = Date.now();

  return function () {
    let context = this,
      args = arguments,
      nowTime = Date.now();

    if (nowTime - curTime >= delay) {
      curTime = Date.now();
      return fn.apply(context, args);
    }
  };
}

// Sử dụng:
// window.addEventListener('scroll', throttle(handleScroll, 200))
// → handleScroll chạy tối đa mỗi 200ms
```

### ⑩ Type Detection

```javascript
function getType(value) {
  if (value === null) {
    return "null";
  }
  if (typeof value === "object") {
    // Object.prototype.toString → "[object Type]"
    let valueClass = Object.prototype.toString.call(value);
    let type = valueClass.split(" ")[1].split("");
    type.pop(); // Bỏ "]"
    return type.join("").toLowerCase();
    // → "array", "date", "regexp", "map", "set", etc.
  } else {
    return typeof value;
    // → "number", "string", "boolean", "undefined",
    //   "symbol", "bigint", "function"
  }
}

// getType(null)      → "null"
// getType([])        → "array"
// getType({})        → "object"
// getType(new Date)  → "date"
// getType(42)        → "number"
```

### ⑭ Function Currying

> **Transform f(a, b, c) → f(a)(b)(c). Thu thập đủ args → chạy.**

```javascript
function curry(fn, args) {
  let length = fn.length; // Số params cần
  args = args || [];

  return function () {
    let subArgs = args.slice(0);

    // Gộp args hiện tại
    for (let i = 0; i < arguments.length; i++) {
      subArgs.push(arguments[i]);
    }

    if (subArgs.length >= length) {
      return fn.apply(this, subArgs); // Đủ args → chạy
    } else {
      return curry.call(this, fn, subArgs); // Chưa đủ → đợi
    }
  };
}

// ES6 version (1 line):
const curry6 = (fn, ...args) =>
  fn.length <= args.length ? fn(...args) : curry6.bind(null, fn, ...args);

// Sử dụng:
// const add = (a, b, c) => a + b + c
// curry(add)(1)(2)(3)    → 6
// curry(add)(1, 2)(3)    → 6
// curry(add)(1)(2, 3)    → 6
```

---

## 3. this Binding

### ⑪ call

> **Gọi function với this chỉ định + args riêng lẻ.**

```javascript
Function.prototype.myCall = function (context) {
  if (typeof this !== "function") {
    console.error("type error");
  }

  let args = [...arguments].slice(1);
  let result = null;

  context = context || window; // null/undefined → window
  context.fn = this; // Gắn function vào context
  result = context.fn(...args); // Gọi → this = context
  delete context.fn; // Cleanup
  return result;
};

// fn.myCall(obj, 1, 2, 3)
// → obj.fn = fn → obj.fn(1,2,3) → this = obj
```

### ⑫ apply

> **Giống call nhưng args là ARRAY.**

```javascript
Function.prototype.myApply = function (context) {
  if (typeof this !== "function") {
    throw new TypeError("Error");
  }

  let result = null;
  context = context || window;
  context.fn = this;

  // Khác call: args là array (arguments[1])
  if (arguments[1]) {
    result = context.fn(...arguments[1]);
  } else {
    result = context.fn();
  }

  delete context.fn;
  return result;
};

// fn.myApply(obj, [1, 2, 3])
```

### ⑬ bind

> **Trả về function MỚI với this đã bind. Hỗ trợ partial args.**

```javascript
Function.prototype.myBind = function (context) {
  if (typeof this !== "function") {
    throw new TypeError("Error");
  }

  var args = [...arguments].slice(1); // Pre-set args
  var fn = this;

  return function Fn() {
    return fn.apply(
      // new binding > bind binding
      this instanceof Fn ? this : context,
      args.concat(...arguments), // Merge pre-set + new args
    );
  };
};

// const bound = fn.myBind(obj, 1, 2)
// bound(3) → fn.apply(obj, [1, 2, 3])
// new bound(3) → fn.apply(newObj, [1, 2, 3])  (new > bind)
```

```
CALL vs APPLY vs BIND:
═════════════════════════════════════════════════
  call(ctx, a, b, c)  → gọi NGAY, args riêng lẻ
  apply(ctx, [a,b,c]) → gọi NGAY, args là ARRAY
  bind(ctx, a, b)     → return FUNCTION MỚI, partial args
```

---

## 4. Utility

### ⑮ AJAX Request

```javascript
const SERVER_URL = "/server";
let xhr = new XMLHttpRequest();

xhr.open("GET", SERVER_URL, true); // ① Tạo HTTP request

xhr.onreadystatechange = function () {
  // ② Listener
  if (this.readyState !== 4) return;
  if (this.status === 200) {
    handle(this.response); // Success
  } else {
    console.error(this.statusText); // Error
  }
};

xhr.onerror = function () {
  // ③ Error handler
  console.error(this.statusText);
};

xhr.responseType = "json"; // ④ Set headers
xhr.setRequestHeader("Accept", "application/json");

xhr.send(null); // ⑤ Send request
```

### ⑯ AJAX + Promise

```javascript
function getJSON(url) {
  let promise = new Promise(function (resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.onreadystatechange = function () {
      if (this.readyState !== 4) return;
      if (this.status === 200) {
        resolve(this.response); // → .then()
      } else {
        reject(new Error(this.statusText)); // → .catch()
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

// Sử dụng:
// getJSON('/api/data').then(data => ...).catch(err => ...)
```

### ⑰ Shallow Copy

```
SHALLOW COPY: copy value (primitive) / copy REFERENCE (object)
→ Nested objects vẫn SHARE cùng reference!
```

```javascript
// Built-in methods:
Object.assign(target, source); // Objects
let clone = { ...obj }; // Spread operator
let arrClone = arr.slice(); // Array
let arrClone2 = arr.concat(); // Array

// Handwritten:
function shallowCopy(object) {
  if (!object || typeof object !== "object") return;

  let newObject = Array.isArray(object) ? [] : {};

  for (let key in object) {
    if (object.hasOwnProperty(key)) {
      newObject[key] = object[key]; // Copy value/reference
    }
  }
  return newObject;
}
```

### ⑱ Deep Copy

```
DEEP COPY: tạo REFERENCE MỚI cho nested objects
→ Hoàn toàn INDEPENDENT, không share reference!
```

```javascript
// ── Method 1: JSON (đơn giản, có hạn chế) ──
let deepClone = JSON.parse(JSON.stringify(obj));
// ❌ Mất: function, undefined, Symbol, Date → string, RegExp → {}
// ❌ Circular reference → Error

// ── Method 2: lodash ──
const _ = require("lodash");
let deepClone2 = _.cloneDeep(obj); // ✅ Toàn diện

// ── Method 3: Handwritten (recursive) ──
function deepCopy(object) {
  if (!object || typeof object !== "object") return object;

  let newObject = Array.isArray(object) ? [] : {};

  for (let key in object) {
    if (object.hasOwnProperty(key)) {
      newObject[key] =
        typeof object[key] === "object"
          ? deepCopy(object[key]) // RECURSIVE cho nested
          : object[key]; // Primitive → copy value
    }
  }
  return newObject;
}
```

```
SHALLOW vs DEEP COPY:
═════════════════════════════════════════════════
  ┌──────────┬────────────────┬────────────────┐
  │          │ Shallow Copy   │ Deep Copy      │
  ├──────────┼────────────────┼────────────────┤
  │Primitive │ Copy VALUE ✅  │ Copy VALUE ✅  │
  │Object    │ Copy REF ❌    │ NEW object ✅  │
  │Nested    │ SHARED ❌      │ INDEPENDENT ✅ │
  │Methods   │ assign/spread  │ JSON/lodash/   │
  │          │ slice/concat   │ recursive      │
  └──────────┴────────────────┴────────────────┘
```

---

## 5. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
18 HANDWRITTEN — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  PROTOTYPE:
    Object.create → F.prototype = obj → new F()
    instanceof    → loop __proto__ chain, check === prototype
    new           → create → set proto → apply → check return

  PROMISE:
    Promise       → state machine (pending→resolved/rejected)
    .then         → return NEW Promise, chaining
    .all          → counter + array[i], first reject
    .race         → first resolve/reject wins

  FUNCTION:
    debounce      → clearTimeout + setTimeout (chờ ngừng)
    throttle      → Date.now() gap check (mỗi khoảng 1 lần)
    curry         → thu thập args, đủ → chạy, thiếu → return fn

  THIS BINDING:
    call          → context.fn = this → context.fn(...args)
    apply         → same, args as ARRAY
    bind          → return new fn, this instanceof → new > bind

  UTILITY:
    getType       → null check + Object.prototype.toString
    AJAX          → XMLHttpRequest (open→headers→send)
    AJAX+Promise  → wrap XHR trong new Promise
    shallowCopy   → for..in + hasOwnProperty, copy value/ref
    deepCopy      → recursive: typeof object → deepCopy(child)
```

### Câu Hỏi Phỏng Vấn

**1. Object.create làm gì?**

> Tạo object mới với **prototype = object truyền vào**. Dùng **constructor rỗng F**, set `F.prototype = obj`, return `new F()`. Object mới kế thừa properties từ obj qua prototype chain.

**2. instanceof hoạt động thế nào?**

> Duyệt **prototype chain** của object (qua `__proto__`), so sánh với `Constructor.prototype`. Nếu tìm thấy match → true. Nếu chain hết (null) → false.

**3. new operator thực hiện mấy bước?**

> 4 bước: ① Tạo object **rỗng**. ② Set `__proto__` = `Constructor.prototype`. ③ Gọi constructor với `this = object mới` (apply). ④ Nếu constructor return **object** → dùng nó; return **primitive** → dùng object đã tạo.

**4. Phân biệt call, apply, bind?**

> **call**(ctx, a, b): gọi **ngay**, args **riêng lẻ**. **apply**(ctx, [a,b]): gọi **ngay**, args là **array**. **bind**(ctx, a): return **function mới**, có thể partial args. Priority: new > bind > call/apply.

**5. Shallow vs Deep copy?**

> **Shallow**: copy primitive value, copy **reference** cho objects → nested objects **shared**. Methods: `Object.assign`, spread, `slice`. **Deep**: tạo **reference mới** cho TẤT CẢ levels → **independent**. Methods: `JSON.parse(JSON.stringify())` (hạn chế: mất function/undefined/Symbol), lodash `_.cloneDeep`, hoặc **recursive** function.

**6. Curry function dùng khi nào?**

> Transform `f(a,b,c)` → `f(a)(b)(c)`. Thu thập args dần, **đủ params** (fn.length) → gọi. Use cases: tạo **reusable specialized functions**, partial application, function composition.

---

## Checklist Học Tập

- [ ] Viết được Object.create (F.prototype = obj)
- [ ] Viết được instanceof (loop **proto** chain)
- [ ] Viết được new (4 bước: create → proto → apply → return)
- [ ] Viết được MyPromise (state machine + callbacks array)
- [ ] Hiểu Promise.then chaining (return new Promise)
- [ ] Viết được Promise.all (counter + array order + first reject)
- [ ] Viết được Promise.race (first wins)
- [ ] Viết được debounce (clearTimeout + setTimeout)
- [ ] Viết được throttle (Date.now gap)
- [ ] Viết được curry (collect args → fn.length)
- [ ] Viết được call/apply/bind (context.fn pattern)
- [ ] Viết được getType (toString.call)
- [ ] Viết được AJAX + Promise wrapper
- [ ] Viết được shallow copy + deep copy (recursive)

---

_Cập nhật lần cuối: Tháng 2, 2026_
