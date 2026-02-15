# Handwritten Frontend Implementations — Deep Dive

> 📅 2026-02-13 · ⏱ 30 phút đọc
>
> call/apply/bind, Promise/A+, EventEmitter, Two-Way Binding,
> JSON.stringify/parse, Template Engine, Lazy Load & Pull-to-Refresh
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Classic Frontend Interview Coding!

---

## Mục Lục

| #   | Phần                                     |
| --- | ---------------------------------------- |
| 1   | Handwritten call / apply / bind          |
| 2   | Handwritten Promise/A+ & async/await     |
| 3   | EventEmitter — Pub/Sub Pattern           |
| 4   | Two-Way Data Binding — 2 phương pháp     |
| 5   | Handwritten JSON.stringify / JSON.parse  |
| 6   | Template Engine — Nguyên lý & Triển khai |
| 7   | Lazy Load, Pull-to-Refresh, Preload      |
| 8   | Tổng kết & Checklist phỏng vấn           |

---

## §1. Handwritten call / apply / bind

```
TẠI SAO CẦN HIỂU INTERNALS:
═══════════════════════════════════════════════════════════════

  call, apply, bind → THAY ĐỔI this context!
  → Phỏng vấn: "Tự triển khai call/apply/bind"
  → Hiểu: this binding rules, Symbol, arguments

  call(thisArg, arg1, arg2, ...)   → gọi NGAY, args RIÊNG LẺ
  apply(thisArg, [arg1, arg2])     → gọi NGAY, args MẢNG
  bind(thisArg, arg1, arg2, ...)   → TRẢ function MỚI (không gọi ngay!)
```

```javascript
// ═══ HANDWRITTEN call ═══
// Ý tưởng: gán fn làm method của thisArg → gọi → xóa method!

Function.prototype.myCall = function (thisArg, ...args) {
  // ① Xử lý thisArg = null/undefined → globalThis (window/global)
  thisArg = thisArg ?? globalThis;

  // ② Chuyển primitive thành Object (boxing)
  // VD: fn.call(5) → this = Number(5) object!
  thisArg = Object(thisArg);

  // ③ Tạo unique key (tránh đè property có sẵn!)
  const key = Symbol("temporary");

  // ④ Gán function hiện tại (this) làm method của thisArg
  thisArg[key] = this;
  // Lúc này: thisArg = { ...existing, [key]: fn }
  // Khi gọi thisArg[key]() → this bên trong fn = thisArg! ✅

  // ⑤ Gọi function với args
  const result = thisArg[key](...args);

  // ⑥ Dọn dẹp (xóa method tạm!)
  delete thisArg[key];

  return result;
};

// Test:
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}
const user = { name: "Alice" };
greet.myCall(user, "Hello", "!"); // "Hello, Alice!"

// Edge cases:
greet.myCall(null, "Hi", "."); // globalThis.name
greet.myCall(42, "Hey", "?"); // Number{42} → this.name = undefined

// ═══ HANDWRITTEN apply ═══
// Giống call nhưng args là MẢNG!

Function.prototype.myApply = function (thisArg, argsArray = []) {
  thisArg = thisArg ?? globalThis;
  thisArg = Object(thisArg);

  const key = Symbol("temporary");
  thisArg[key] = this;

  const result = thisArg[key](...argsArray); // Spread mảng!

  delete thisArg[key];
  return result;
};

// Test:
greet.myApply(user, ["Hello", "!"]); // "Hello, Alice!"
Math.max.myApply(null, [1, 5, 3]); // 5

// ═══ HANDWRITTEN bind ═══
// bind TRẢ function MỚI, KHÔNG gọi ngay!
// Phải xử lý: partial application (currying) + new operator!

Function.prototype.myBind = function (thisArg, ...outerArgs) {
  const originalFn = this;

  // Trả về function MỚI:
  const boundFn = function (...innerArgs) {
    // ⚠️ Nếu dùng new → this phải là instance MỚI, KHÔNG phải thisArg!
    const isNew = this instanceof boundFn;

    return originalFn.apply(
      isNew ? this : thisArg, // new → dùng this mới!
      [...outerArgs, ...innerArgs], // Concat partial + remaining args!
    );
  };

  // ⚠️ Kế thừa prototype cho new operator!
  if (originalFn.prototype) {
    boundFn.prototype = Object.create(originalFn.prototype);
  }

  return boundFn;
};

// Test:
const greetAlice = greet.myBind(user, "Hello");
greetAlice("!"); // "Hello, Alice!" (partial application!)
greetAlice("?"); // "Hello, Alice?"

// Với new:
function Person(name, age) {
  this.name = name;
  this.age = age;
}
const BoundPerson = Person.myBind(null, "Bob");
const bob = new BoundPerson(25);
bob.name; // "Bob" (partial arg!)
bob.age; // 25
bob instanceof Person; // true ← prototype chain đúng!
```

---

## §2. Handwritten Promise/A+ & async/await

```
PROMISE/A+ SPEC — QUY TẮC CHÍNH:
═══════════════════════════════════════════════════════════════

  ① 3 states: PENDING → FULFILLED hoặc PENDING → REJECTED
     → Chuyển 1 lần! Không quay lại!

  ② then(onFulfilled, onRejected):
     → Trả về Promise MỚI (chaining!)
     → onFulfilled/onRejected chạy ASYNC (microtask!)
     → Nếu callback trả Promise → resolve/reject theo Promise đó!

  ③ Resolution Procedure:
     → Nếu resolve(promise) → adopt promise đó!
     → Nếu resolve(thenable) → call thenable.then!
     → Nếu resolve(value) → fulfill với value!
```

```javascript
// ═══ HANDWRITTEN PROMISE (A+ compliant) ═══

const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

class MyPromise {
  constructor(executor) {
    this.state = PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledCallbacks = []; // Lưu .then callbacks!
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      // ⚠️ Nếu value là Promise → adopt nó!
      if (value instanceof MyPromise) {
        value.then(resolve, reject);
        return;
      }
      if (this.state !== PENDING) return; // Chỉ 1 lần!
      this.state = FULFILLED;
      this.value = value;
      // Chạy TẤT CẢ callbacks đã đăng ký:
      this.onFulfilledCallbacks.forEach((fn) => fn());
    };

    const reject = (reason) => {
      if (this.state !== PENDING) return;
      this.state = REJECTED;
      this.reason = reason;
      this.onRejectedCallbacks.forEach((fn) => fn());
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error); // Executor throw → reject!
    }
  }

  then(onFulfilled, onRejected) {
    // ① Default handlers (pass-through):
    onFulfilled =
      typeof onFulfilled === "function" ? onFulfilled : (value) => value; // Passthrough!
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (reason) => {
            throw reason;
          }; // Re-throw!

    // ② Trả về Promise MỚI (chaining!):
    const promise2 = new MyPromise((resolve, reject) => {
      const handleFulfilled = () => {
        // Async! (microtask bằng queueMicrotask)
        queueMicrotask(() => {
          try {
            const x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      };

      const handleRejected = () => {
        queueMicrotask(() => {
          try {
            const x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      };

      if (this.state === FULFILLED) {
        handleFulfilled();
      } else if (this.state === REJECTED) {
        handleRejected();
      } else {
        // PENDING → lưu callbacks!
        this.onFulfilledCallbacks.push(handleFulfilled);
        this.onRejectedCallbacks.push(handleRejected);
      }
    });

    return promise2;
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(callback) {
    return this.then(
      (value) => MyPromise.resolve(callback()).then(() => value),
      (reason) =>
        MyPromise.resolve(callback()).then(() => {
          throw reason;
        }),
    );
  }

  // ═══ STATIC METHODS ═══
  static resolve(value) {
    if (value instanceof MyPromise) return value;
    return new MyPromise((resolve) => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];
      let count = 0;
      const len = promises.length;
      if (len === 0) {
        resolve([]);
        return;
      }

      promises.forEach((p, i) => {
        MyPromise.resolve(p).then(
          (value) => {
            results[i] = value; // Giữ thứ tự!
            if (++count === len) resolve(results);
          },
          reject, // 1 reject → TẤT CẢ reject!
        );
      });
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach((p) => {
        MyPromise.resolve(p).then(resolve, reject);
        // Ai xong TRƯỚC → resolve/reject luôn!
      });
    });
  }

  static allSettled(promises) {
    return new MyPromise((resolve) => {
      const results = [];
      let count = 0;
      const len = promises.length;
      if (len === 0) {
        resolve([]);
        return;
      }

      promises.forEach((p, i) => {
        MyPromise.resolve(p).then(
          (value) => {
            results[i] = { status: "fulfilled", value };
            if (++count === len) resolve(results);
          },
          (reason) => {
            results[i] = { status: "rejected", reason };
            if (++count === len) resolve(results);
          },
        );
      });
    });
  }
}

// Resolution Procedure (A+ spec 2.3):
function resolvePromise(promise2, x, resolve, reject) {
  // ① Circular reference!
  if (x === promise2) {
    reject(new TypeError("Chaining cycle detected!"));
    return;
  }

  // ② x là Promise → adopt nó:
  if (x instanceof MyPromise) {
    x.then(resolve, reject);
    return;
  }

  // ③ x là thenable (has .then method):
  if (x !== null && (typeof x === "object" || typeof x === "function")) {
    let called = false;
    try {
      const then = x.then;
      if (typeof then === "function") {
        then.call(
          x,
          (y) => {
            if (called) return;
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          },
          (r) => {
            if (called) return;
            called = true;
            reject(r);
          },
        );
      } else {
        resolve(x); // Có .then nhưng không phải function!
      }
    } catch (e) {
      if (!called) reject(e);
    }
    return;
  }

  // ④ x là giá trị bình thường:
  resolve(x);
}

// Test:
new MyPromise((resolve) => {
  setTimeout(() => resolve("done!"), 100);
})
  .then((v) => {
    console.log(v);
    return v + " chained";
  })
  .then((v) => console.log(v))
  .catch((e) => console.error(e));
// "done!" → "done! chained"
```

```javascript
// ═══ HANDWRITTEN async/await (Generator-based) ═══
// async/await = syntactic sugar cho Generator + Promise!

// async function = generator function + auto-runner:
function asyncToGenerator(generatorFn) {
  return function (...args) {
    const gen = generatorFn.apply(this, args);

    return new Promise((resolve, reject) => {
      function step(key, value) {
        try {
          const { value: result, done } = gen[key](value);

          if (done) {
            resolve(result); // return → resolve!
          } else {
            // yield → chờ Promise rồi next!
            Promise.resolve(result).then(
              (val) => step("next", val),
              (err) => step("throw", err),
            );
          }
        } catch (error) {
          reject(error); // throw → reject!
        }
      }

      step("next", undefined); // Bắt đầu!
    });
  };
}

// SỬ DỤNG:
// Thay vì:
// async function fetchData() {
//     const user = await fetch('/user');
//     const posts = await fetch(`/posts?userId=${user.id}`);
//     return posts;
// }

// Tương đương:
const fetchData = asyncToGenerator(function* () {
  const user = yield fetch("/user").then((r) => r.json());
  const posts = yield fetch(`/posts?userId=${user.id}`).then((r) => r.json());
  return posts;
});

fetchData().then((posts) => console.log(posts));
```

---

## §3. EventEmitter — Pub/Sub Pattern

```
EVENT EMITTER = OBSERVER PATTERN:
═══════════════════════════════════════════════════════════════

  → Publisher/Subscriber (Pub/Sub)
  → Lõi của: DOM events, Node.js events, Vue/React event systems
  → API: on, off, emit, once
```

```javascript
// ═══ HANDWRITTEN EventEmitter ═══

class EventEmitter {
  constructor() {
    this.events = new Map(); // eventName → Set<listeners>
  }

  // ① on — Đăng ký listener:
  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(listener);
    return this; // Chainable!
  }

  // ② off — Hủy đăng ký:
  off(event, listener) {
    if (!this.events.has(event)) return this;

    const listeners = this.events.get(event);
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }

    // Cleanup empty arrays:
    if (listeners.length === 0) {
      this.events.delete(event);
    }
    return this;
  }

  // ③ emit — Phát sự kiện:
  emit(event, ...args) {
    if (!this.events.has(event)) return false;

    // COPY array trước khi iterate! (tránh issues khi listener gọi off)
    const listeners = [...this.events.get(event)];
    listeners.forEach((listener) => {
      listener.apply(this, args);
    });
    return true;
  }

  // ④ once — Chỉ lắng nghe 1 LẦN:
  once(event, listener) {
    const wrapper = (...args) => {
      listener.apply(this, args);
      this.off(event, wrapper); // Tự hủy sau khi gọi!
    };
    wrapper.originalListener = listener; // Để off tìm được!
    this.on(event, wrapper);
    return this;
  }

  // ⑤ removeAllListeners:
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  // ⑥ listenerCount:
  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }

  // ⑦ eventNames:
  eventNames() {
    return [...this.events.keys()];
  }
}

// ═══ SỬ DỤNG ═══
const emitter = new EventEmitter();

// Đăng ký:
function onUserLogin(user) {
  console.log(`${user.name} logged in!`);
}
emitter.on("login", onUserLogin);
emitter.on("login", (user) => {
  console.log(`Send welcome email to ${user.email}`);
});

// Once — chỉ 1 lần:
emitter.once("firstVisit", () => {
  console.log("Welcome! Đây là lần đầu!");
});

// Emit:
emitter.emit("login", { name: "Alice", email: "alice@mail.com" });
// "Alice logged in!"
// "Send welcome email to alice@mail.com"

emitter.emit("firstVisit"); // "Welcome! Đây là lần đầu!"
emitter.emit("firstVisit"); // Không có gì! (đã off!)

// Hủy:
emitter.off("login", onUserLogin);
emitter.emit("login", { name: "Bob", email: "bob@mail.com" });
// Chỉ: "Send welcome email to bob@mail.com" (đã off onUserLogin!)
```

---

## §4. Two-Way Data Binding — 2 phường pháp

```
TWO-WAY BINDING = DATA ↔ VIEW TỰ ĐỘNG ĐỒNG BỘ:
═══════════════════════════════════════════════════════════════

  1. Object.defineProperty (Vue 2) — ES5
  2. Proxy (Vue 3) — ES6
```

```javascript
// ═══ PHƯƠNG PHÁP 1: Object.defineProperty (Vue 2 style) ═══

function defineReactive(obj, key, val) {
  const dep = []; // Dependency list (subscribers!)

  Object.defineProperty(obj, key, {
    get() {
      // Thu thập dependency!
      if (Dep.target) {
        dep.push(Dep.target);
      }
      return val;
    },
    set(newVal) {
      if (newVal === val) return;
      val = newVal;
      // Thông báo TẤT CẢ subscribers!
      dep.forEach((fn) => fn());
    },
  });
}

// Dep.target = watcher hiện tại:
const Dep = { target: null };

function observe(obj) {
  Object.keys(obj).forEach((key) => {
    defineReactive(obj, key, obj[key]);
  });
}

// WATCHER — Theo dõi thay đổi:
function watcher(fn) {
  Dep.target = fn;
  fn(); // Trigger get → thu thập dependency!
  Dep.target = null;
}

// ═══ TRIỂN KHAI TWO-WAY BINDING ═══
const data = { name: "Alice", age: 25 };
observe(data);

// View binding (Data → View):
watcher(() => {
  document.getElementById("name").textContent = data.name;
});

// Input binding (View → Data):
document.getElementById("input").addEventListener("input", (e) => {
  data.name = e.target.value; // Trigger setter → cập nhật view!
});

// ⚠️ NHƯỢC ĐIỂM Object.defineProperty:
// ❌ Không detect THÊM/XÓA property mới!
// ❌ Không detect thay đổi index mảng! (arr[0] = 'new')
// ❌ Phải duyệt TẤT CẢ properties khi observe!
// → Vue 2 dùng Vue.set() / this.$set() để workaround!

// ═══ PHƯƠNG PHÁP 2: Proxy (Vue 3 style) ═══

function reactive(obj) {
  const deps = new Map(); // key → Set<callbacks>

  return new Proxy(obj, {
    get(target, key, receiver) {
      // Thu thập dependency:
      if (ActiveEffect.current) {
        if (!deps.has(key)) deps.set(key, new Set());
        deps.get(key).add(ActiveEffect.current);
      }
      const value = Reflect.get(target, key, receiver);
      // Deep reactive: nếu value là object → proxy luôn!
      if (typeof value === "object" && value !== null) {
        return reactive(value);
      }
      return value;
    },

    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) {
        // Notify TẤT CẢ watchers!
        if (deps.has(key)) {
          deps.get(key).forEach((fn) => fn());
        }
      }
      return result;
    },

    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key);
      if (deps.has(key)) {
        deps.get(key).forEach((fn) => fn());
      }
      return result;
    },
  });
}

const ActiveEffect = { current: null };

function effect(fn) {
  ActiveEffect.current = fn;
  fn(); // Trigger get → collect deps!
  ActiveEffect.current = null;
}

// SỬ DỤNG:
const state = reactive({ name: "Bob", items: [1, 2, 3] });

effect(() => {
  console.log("Name changed:", state.name);
});

state.name = "Charlie"; // Tự động: "Name changed: Charlie" ✅
state.items.push(4); // ✅ Proxy detect mảng thay đổi!
state.newProp = "hello"; // ✅ Proxy detect property mới!
delete state.name; // ✅ Proxy detect xóa property!

// ✅ ƯU ĐIỂM Proxy so với Object.defineProperty:
// ✅ Detect thêm/xóa property!
// ✅ Detect thay đổi mảng (index, length, push, pop...)!
// ✅ Lazy observe (get mới proxy, không duyệt trước!)
// ✅ Hỗ trợ Map, Set, WeakMap, WeakSet!
```

```
SO SÁNH 2 PHƯƠNG PHÁP:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────┬─────────────────────┬─────────────────┐
  │ Feature              │ defineProperty (v2)  │ Proxy (v3)      │
  ├──────────────────────┼─────────────────────┼─────────────────┤
  │ Add property         │ ❌ Vue.set()!       │ ✅ Auto detect  │
  │ Delete property      │ ❌ Vue.delete()!    │ ✅ Auto detect  │
  │ Array index          │ ❌ Không detect     │ ✅ Detect!      │
  │ Array methods        │ Hack (override!)    │ ✅ Auto detect  │
  │ Deep observe         │ Recursive upfront   │ Lazy (get mới!) │
  │ Map/Set              │ ❌                  │ ✅              │
  │ Performance          │ Chậm init (all keys)│ Nhanh (lazy!)   │
  │ Browser support      │ IE9+                │ ❌ No IE!       │
  └──────────────────────┴─────────────────────┴─────────────────┘
```

---

## §5. Handwritten JSON.stringify / JSON.parse

```javascript
// ═══ HANDWRITTEN JSON.stringify ═══

function myStringify(value) {
  // ① null, undefined, function, Symbol:
  if (value === null) return "null";
  if (value === undefined) return undefined; // Top-level → undefined!
  if (typeof value === "function") return undefined;
  if (typeof value === "symbol") return undefined;

  // ② Boolean:
  if (typeof value === "boolean") return value.toString();

  // ③ Number:
  if (typeof value === "number") {
    if (isNaN(value) || !isFinite(value)) return "null"; // NaN, Infinity → "null"!
    return value.toString();
  }

  // ④ BigInt → Error!
  if (typeof value === "bigint") {
    throw new TypeError("BigInt value can't be serialized in JSON");
  }

  // ⑤ String:
  if (typeof value === "string") {
    return (
      '"' +
      value
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t") +
      '"'
    );
  }

  // ⑥ Date → toISOString():
  if (value instanceof Date) {
    return '"' + value.toISOString() + '"';
  }

  // ⑦ Array:
  if (Array.isArray(value)) {
    const items = value.map((item) => {
      const result = myStringify(item);
      return result === undefined ? "null" : result;
      // undefined trong array → null!
    });
    return "[" + items.join(",") + "]";
  }

  // ⑧ Object:
  if (typeof value === "object") {
    // toJSON() method? (Date, custom objects)
    if (typeof value.toJSON === "function") {
      return myStringify(value.toJSON());
    }

    const pairs = [];
    for (const key of Object.keys(value)) {
      const val = myStringify(value[key]);
      if (val !== undefined) {
        // Skip undefined, function, symbol!
        pairs.push(myStringify(key) + ":" + val);
      }
    }
    return "{" + pairs.join(",") + "}";
  }
}

// Test:
myStringify({ a: 1, b: "hello", c: null });
// '{"a":1,"b":"hello","c":null}'

myStringify({ fn: () => {}, sym: Symbol(), undef: undefined });
// '{}' (tất cả bị skip!)

myStringify([1, undefined, null, "hi"]);
// '[1,null,null,"hi"]' (undefined trong array → null!)

myStringify(NaN); // 'null'
myStringify(Infinity); // 'null'
```

```javascript
// ═══ HANDWRITTEN JSON.parse ═══
// 2 CÁCH: ① eval (đơn giản!) ② Recursive Descent Parser (an toàn!)

// ═══ CÁCH 1: eval (NGUY HIỂM — chỉ học!) ═══
function myParseEval(json) {
  // ⚠️ eval() chạy BẤT KỲ code nào! XSS risk!
  // Nhưng nếu input đáng tin → nhanh nhất!
  return eval("(" + json + ")");
}

// ═══ CÁCH 2: new Function (an toàn hơn eval) ═══
function myParseFunction(json) {
  return new Function("return " + json)();
}

// ═══ CÁCH 3: Recursive Descent Parser (AN TOÀN!) ═══
function myParse(json) {
  let index = 0;

  function parseValue() {
    skipWhitespace();
    const char = json[index];

    if (char === '"') return parseString();
    if (char === "{") return parseObject();
    if (char === "[") return parseArray();
    if (char === "t") return parseLiteral("true", true);
    if (char === "f") return parseLiteral("false", false);
    if (char === "n") return parseLiteral("null", null);
    if (char === "-" || (char >= "0" && char <= "9")) return parseNumber();

    throw new SyntaxError(`Unexpected character: ${char} at ${index}`);
  }

  function parseString() {
    index++; // Skip opening "
    let result = "";
    while (json[index] !== '"') {
      if (json[index] === "\\") {
        index++;
        const escapes = {
          '"': '"',
          "\\": "\\",
          "/": "/",
          n: "\n",
          r: "\r",
          t: "\t",
          b: "\b",
          f: "\f",
        };
        if (json[index] in escapes) {
          result += escapes[json[index]];
        } else if (json[index] === "u") {
          result += String.fromCharCode(
            parseInt(json.substr(index + 1, 4), 16),
          );
          index += 4;
        }
      } else {
        result += json[index];
      }
      index++;
    }
    index++; // Skip closing "
    return result;
  }

  function parseNumber() {
    let start = index;
    if (json[index] === "-") index++;
    while (json[index] >= "0" && json[index] <= "9") index++;
    if (json[index] === ".") {
      index++;
      while (json[index] >= "0" && json[index] <= "9") index++;
    }
    if (json[index] === "e" || json[index] === "E") {
      index++;
      if (json[index] === "+" || json[index] === "-") index++;
      while (json[index] >= "0" && json[index] <= "9") index++;
    }
    return Number(json.slice(start, index));
  }

  function parseObject() {
    index++; // Skip {
    skipWhitespace();
    const obj = {};
    if (json[index] === "}") {
      index++;
      return obj;
    }

    while (true) {
      skipWhitespace();
      const key = parseString();
      skipWhitespace();
      index++; // Skip :
      const value = parseValue();
      obj[key] = value;
      skipWhitespace();
      if (json[index] === "}") {
        index++;
        return obj;
      }
      index++; // Skip ,
    }
  }

  function parseArray() {
    index++; // Skip [
    skipWhitespace();
    const arr = [];
    if (json[index] === "]") {
      index++;
      return arr;
    }

    while (true) {
      arr.push(parseValue());
      skipWhitespace();
      if (json[index] === "]") {
        index++;
        return arr;
      }
      index++; // Skip ,
    }
  }

  function parseLiteral(literal, value) {
    if (json.slice(index, index + literal.length) === literal) {
      index += literal.length;
      return value;
    }
    throw new SyntaxError(`Expected ${literal}`);
  }

  function skipWhitespace() {
    while (" \t\n\r".includes(json[index])) index++;
  }

  const result = parseValue();
  return result;
}

// Test:
myParse('{"name":"Alice","age":25,"hobbies":["code","music"],"active":true}');
// { name: "Alice", age: 25, hobbies: ["code", "music"], active: true }
```

---

## §6. Template Engine — Nguyên lý & Triển khai

```
TEMPLATE ENGINE NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  Input:
  → Template string: "Hello, {{ name }}! You have {{ count }} items."
  → Data object: { name: "Alice", count: 5 }

  Output:
  → "Hello, Alice! You have 5 items."

  NGUYÊN LÝ BÊN TRONG:
  ① Parse template → tìm {{ expression }}
  ② Thay thế bằng giá trị từ data
  ③ Nâng cao: compile template → JavaScript function! (NHANH!)

  CÁCH COMPILE (giống EJS, Handlebars bên trong):
  Template: "Hello, <%= name %>! <% if (vip) { %>VIP!<% } %>"
  → Compile thành:
  function(data) {
      let output = '';
      output += 'Hello, ';
      output += data.name;
      output += '! ';
      if (data.vip) {
          output += 'VIP!';
      }
      return output;
  }
  → Gọi function với data → KẾT QUẢ!
```

```javascript
// ═══ HANDWRITTEN TEMPLATE ENGINE ═══

// ═══ Cách 1: Simple Replace ({{ variable }}) ═══
function simpleTemplate(template, data) {
  return template.replace(/\{\{\s*(\w+(?:\.\w+)*)\s*\}\}/g, (match, path) => {
    // Hỗ trợ nested path: {{ user.name }}
    const value = path.split(".").reduce((obj, key) => {
      return obj != null ? obj[key] : undefined;
    }, data);
    return value !== undefined ? value : match; // Không tìm thấy → giữ nguyên
  });
}

// Test:
simpleTemplate("Hello {{ name }}! Age: {{ age }}", { name: "Alice", age: 25 });
// "Hello Alice! Age: 25"
simpleTemplate("{{ user.address.city }}", {
  user: { address: { city: "HCM" } },
});
// "HCM"

// ═══ Cách 2: Compilable Template Engine (giống EJS) ═══
// Syntax: <%= expr %> output, <% code %> logic

function compileTemplate(template) {
  // ① Parse template → build function body:
  let code = 'let __output = "";\n';
  let cursor = 0;

  // Tìm tất cả <% ... %> và <%= ... %>:
  const regex = /<%([=-]?)([\s\S]*?)%>/g;
  let match;

  while ((match = regex.exec(template)) !== null) {
    // Text trước tag:
    const text = template.slice(cursor, match.index);
    if (text) {
      code += `__output += ${JSON.stringify(text)};\n`;
    }

    const type = match[1]; // '=' hoặc '' hoặc '-'
    const expr = match[2].trim();

    if (type === "=") {
      // <%= expr %> → output expression:
      code += `__output += (${expr});\n`;
    } else if (type === "-") {
      // <%- expr %> → output unescaped HTML:
      code += `__output += (${expr});\n`;
    } else {
      // <% code %> → raw JS code (if, for, etc.):
      code += expr + "\n";
    }

    cursor = match.index + match[0].length;
  }

  // Remaining text sau tag cuối:
  const remaining = template.slice(cursor);
  if (remaining) {
    code += `__output += ${JSON.stringify(remaining)};\n`;
  }

  code += "return __output;";

  // ② Compile thành function:
  // with(data) { ... } → truy cập name thay vì data.name!
  const fn = new Function("data", `with(data) { ${code} }`);
  return fn;
}

// SỬ DỤNG:
const template = `
<h1><%= title %></h1>
<ul>
<% for (let i = 0; i < items.length; i++) { %>
    <li><%= items[i] %></li>
<% } %>
</ul>
<% if (showFooter) { %>
    <footer>Total: <%= items.length %></footer>
<% } %>
`;

const render = compileTemplate(template);
const html = render({
  title: "Shopping List",
  items: ["Apple", "Banana", "Cherry"],
  showFooter: true,
});

console.log(html);
// <h1>Shopping List</h1>
// <ul>
//     <li>Apple</li>
//     <li>Banana</li>
//     <li>Cherry</li>
// </ul>
//     <footer>Total: 3</footer>

// ═══ COMPILED FUNCTION LOOKS LIKE: ═══
// function(data) {
//     with(data) {
//         let __output = "";
//         __output += "\n<h1>";
//         __output += (title);
//         __output += "</h1>\n<ul>\n";
//         for (let i = 0; i < items.length; i++) {
//             __output += "\n    <li>";
//             __output += (items[i]);
//             __output += "</li>\n";
//         }
//         __output += "\n</ul>\n";
//         if (showFooter) {
//             __output += "\n    <footer>Total: ";
//             __output += (items.length);
//             __output += "</footer>\n";
//         }
//         return __output;
//     }
// }

// → Compile 1 lần → gọi nhiều lần với data khác nhau = NHANH!
```

---

## §7. Lazy Load, Pull-to-Refresh, Preload

```javascript
// ═══ LAZY LOADING (懒加载) — Tải khi cần! ═══
// → Chỉ tải images/components KHI vào VIEWPORT!
// → Giảm initial load, tiết kiệm bandwidth!

// ═══ Cách 1: IntersectionObserver (HIỆN ĐẠI!) ═══
function lazyLoadImages() {
  const images = document.querySelectorAll("img[data-src]");

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src; // Đặt src thật!
          img.removeAttribute("data-src");
          observer.unobserve(img); // Ngừng theo dõi!
        }
      });
    },
    {
      rootMargin: "200px", // Load TRƯỚC 200px (buffer!)
      threshold: 0,
    },
  );

  images.forEach((img) => observer.observe(img));
}

// HTML:
// <img data-src="real-image.jpg" src="placeholder.jpg" alt="..." />

// ═══ Cách 2: Scroll Event (CŨ — fallback!) ═══
function lazyLoadScroll() {
  const images = document.querySelectorAll("img[data-src]");

  function checkImages() {
    images.forEach((img) => {
      const rect = img.getBoundingClientRect();
      // Trong viewport?
      if (rect.top < window.innerHeight + 200 && rect.bottom > 0) {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      }
    });
  }

  // ⚠️ Phải THROTTLE scroll event!
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        checkImages();
        ticking = false;
      });
      ticking = true;
    }
  });

  checkImages(); // Check lần đầu!
}

// ═══ Cách 3: Native Lazy Loading (HTML attribute!) ═══
// <img src="image.jpg" loading="lazy" alt="..." />
// → Browser tự lazy load! Đơn giản nhất! ⚡
// → Support: Chrome, Firefox, Edge, Safari 16+
```

```javascript
// ═══ PULL-TO-REFRESH (下拉刷新) — Kéo xuống để refresh! ═══

class PullToRefresh {
  constructor(container, onRefresh) {
    this.container = container;
    this.onRefresh = onRefresh;
    this.startY = 0;
    this.pullDistance = 0;
    this.threshold = 80; // px cần kéo để trigger!
    this.isRefreshing = false;

    this.indicator = document.createElement("div");
    this.indicator.className = "pull-indicator";
    this.indicator.textContent = "Kéo xuống để refresh";
    this.indicator.style.cssText =
      "text-align:center; padding:10px; transition:transform 0.3s; " +
      "transform:translateY(-100%); position:absolute; top:0; width:100%;";
    container.style.position = "relative";
    container.style.overflow = "hidden";
    container.prepend(this.indicator);

    this.bindEvents();
  }

  bindEvents() {
    this.container.addEventListener(
      "touchstart",
      (e) => {
        if (this.container.scrollTop === 0 && !this.isRefreshing) {
          this.startY = e.touches[0].clientY;
        }
      },
      { passive: true },
    );

    this.container.addEventListener(
      "touchmove",
      (e) => {
        if (!this.startY || this.isRefreshing) return;

        this.pullDistance = e.touches[0].clientY - this.startY;
        if (this.pullDistance < 0) return; // Kéo lên → bỏ!

        // Damping effect (giảm tốc khi kéo xa):
        const dampedDistance = Math.min(this.pullDistance * 0.4, 150);

        this.indicator.style.transform = `translateY(${dampedDistance - this.indicator.offsetHeight}px)`;

        if (this.pullDistance > this.threshold) {
          this.indicator.textContent = "Thả để refresh! ↻";
        } else {
          this.indicator.textContent = "Kéo xuống để refresh ↓";
        }
      },
      { passive: true },
    );

    this.container.addEventListener("touchend", async () => {
      if (this.pullDistance > this.threshold && !this.isRefreshing) {
        this.isRefreshing = true;
        this.indicator.textContent = "Đang refresh... ⏳";

        try {
          await this.onRefresh(); // Gọi callback!
        } finally {
          this.indicator.textContent = "Refresh xong! ✅";
          setTimeout(() => {
            this.indicator.style.transform = "translateY(-100%)";
            this.isRefreshing = false;
          }, 500);
        }
      } else {
        this.indicator.style.transform = "translateY(-100%)";
      }

      this.startY = 0;
      this.pullDistance = 0;
    });
  }
}

// SỬ DỤNG:
new PullToRefresh(document.getElementById("list"), async () => {
  const data = await fetch("/api/latest").then((r) => r.json());
  renderList(data);
});
```

```javascript
// ═══ SCROLL-TO-LOAD-MORE (上拉加载) — Cuộn lên tải thêm! ═══

class InfiniteScroll {
  constructor(container, loadMore) {
    this.container = container;
    this.loadMore = loadMore;
    this.loading = false;
    this.hasMore = true;
    this.page = 1;
    this.threshold = 100; // px trước đáy

    this.bindEvents();
  }

  bindEvents() {
    this.container.addEventListener("scroll", () => {
      if (this.loading || !this.hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = this.container;
      // Gần đáy?
      if (scrollHeight - scrollTop - clientHeight < this.threshold) {
        this.load();
      }
    });
  }

  async load() {
    this.loading = true;
    this.showLoader();

    try {
      const result = await this.loadMore(this.page++);
      if (!result || result.length === 0) {
        this.hasMore = false;
        this.showEnd();
      }
    } catch (error) {
      this.page--; // Retry lần sau!
      console.error("Load more failed:", error);
    } finally {
      this.loading = false;
      this.hideLoader();
    }
  }

  showLoader() {
    /* Show spinner */
  }
  hideLoader() {
    /* Hide spinner */
  }
  showEnd() {
    /* Show "Hết rồi!" */
  }
}

// SỬ DỤNG:
new InfiniteScroll(document.getElementById("feed"), async (page) => {
  const data = await fetch(`/api/posts?page=${page}`).then((r) => r.json());
  renderPosts(data);
  return data;
});
```

```javascript
// ═══ PRELOADING (预加载) — Tải trước tài nguyên! ═══

// ① Link preload (Browser hint):
// <link rel="preload" href="font.woff2" as="font" crossorigin>
// <link rel="preload" href="hero.jpg" as="image">
// <link rel="preload" href="critical.css" as="style">
// <link rel="preload" href="app.js" as="script">

// ② Link prefetch (tải TRANG tiếp theo — idle time!):
// <link rel="prefetch" href="/next-page.html">

// ③ Image preload bằng JS:
function preloadImages(urls) {
  return Promise.all(
    urls.map((url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
    }),
  );
}

// Preload trước khi cần:
preloadImages(["/images/slide2.jpg", "/images/slide3.jpg"]).then(() =>
  console.log("Images preloaded!"),
);

// ④ Dynamic import preload (JS modules):
// Khi user hover link → preload:
document.getElementById("settings-link").addEventListener("mouseenter", () => {
  import("./SettingsPage.js"); // Bắt đầu tải ngay khi hover!
});

// ⑤ Preload vs Prefetch vs Preconnect:
// ┌─────────────┬──────────────────────────────────────────┐
// │ preload     │ Tải NGAY! Cần cho trang HIỆN TẠI!       │
// │ prefetch    │ Tải lúc RẢNH, cho trang TIẾP THEO       │
// │ preconnect  │ Thiết lập KẾT NỐI trước (DNS+TCP+TLS)  │
// │ dns-prefetch│ Chỉ DNS lookup trước                    │
// └─────────────┴──────────────────────────────────────────┘
```

---

## §8. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  Handwritten Frontend
  ├── call/apply/bind
  │   ├── call: Symbol key → gán fn → gọi → xóa
  │   ├── apply: giống call, args là mảng
  │   └── bind: trả fn mới, partial args, xử lý new!
  ├── Promise/A+
  │   ├── 3 states, then chain, resolvePromise procedure
  │   ├── Static: all, race, allSettled, resolve, reject
  │   └── async/await = Generator + auto runner
  ├── EventEmitter: on/off/emit/once, Map<event, listeners>
  ├── Two-Way Binding
  │   ├── defineProperty (Vue 2): get/set trap, ❌ add/delete
  │   └── Proxy (Vue 3): get/set/deleteProperty, ✅ everything!
  ├── JSON
  │   ├── stringify: type check → recursive → escape strings
  │   └── parse: Recursive Descent Parser (parseValue/String/Object/Array)
  ├── Template Engine
  │   ├── Simple: regex replace {{ var }}
  │   └── Compiled: parse → build JS code → new Function → call!
  └── Lazy / Refresh / Preload
      ├── Lazy: IntersectionObserver / scroll+throttle / loading="lazy"
      ├── Pull-to-Refresh: touchstart/move/end + threshold
      ├── Infinite Scroll: scroll bottom detection + pagination
      └── Preload: <link rel="preload/prefetch"> / Image() / dynamic import
```

### Checklist

- [ ] **myCall**: gán fn vào thisArg (Symbol key!) → gọi → xóa; xử lý null→globalThis, primitive→Object()
- [ ] **myApply**: giống myCall, nhưng args là mảng → spread!
- [ ] **myBind**: trả function MỚI, partial args (...outerArgs + ...innerArgs), xử lý `new` (instanceof check!), copy prototype
- [ ] **Promise 3 states**: PENDING → FULFILLED / REJECTED (1 lần duy nhất!), lưu callbacks khi PENDING
- [ ] **Promise then**: trả Promise MỚI, callback chạy ASYNC (queueMicrotask), resolvePromise xử lý thenable/cycle
- [ ] **Promise static**: all (tất cả, 1 fail→fail), race (ai trước), allSettled (tất cả kết quả), resolve/reject
- [ ] **async/await**: Generator + auto runner — yield → Promise.resolve().then(next), throw → gen.throw()
- [ ] **EventEmitter**: Map<event, listener[]>, on/off/emit/once, once = wrapper tự off, emit copy array trước iterate!
- [ ] **defineProperty** (Vue 2): get thu thập dep, set notify → ❌ add/delete/array index
- [ ] **Proxy** (Vue 3): get/set/deleteProperty traps → ✅ add/delete/array/Map/Set, lazy deep observe
- [ ] **JSON.stringify**: null→"null", NaN/Infinity→"null", BigInt→Error, Date→toISOString, undefined/fn/symbol→skip object hoặc null array
- [ ] **JSON.parse**: Recursive Descent Parser: parseValue switch char → parseString/Number/Object/Array/Literal
- [ ] **Template simple**: regex `/\{\{\s*(\w+)\s*\}\}/g` → replace data[key]
- [ ] **Template compiled**: parse `<%= %>` và `<% %>` → build JS code string → `new Function('data', code)` → cache & reuse!
- [ ] **Lazy Load**: IntersectionObserver (rootMargin buffer!), scroll+rAF throttle (fallback), `loading="lazy"` (native!)
- [ ] **Pull-to-Refresh**: touchstart (startY), touchmove (distance + damping), touchend (threshold→callback)
- [ ] **Infinite Scroll**: `scrollHeight - scrollTop - clientHeight < threshold` → loadMore(page++)
- [ ] **Preload**: `<link rel="preload">` (ngay!), `prefetch` (rảnh), `preconnect` (DNS+TCP+TLS), `new Image().src` (JS)

---

_Nguồn: ConardLi — "Manually Implement Front-end Wheels" · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
