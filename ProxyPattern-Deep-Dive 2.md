# Proxy Pattern — Deep Dive

> 📅 2026-02-14 · ⏱ 22 phút đọc
>
> Proxy Concept & Terminology,
> Handler Traps: get, set, has, apply, construct, deleteProperty,
> Reflect API, Validation, Formatting, Debugging,
> DOM Manipulation, Private Fields & Internal Slots,
> Reactive Systems (Vue.js-style), Performance Benchmark,
> Real-World Applications & Tradeoffs
> Độ khó: ⭐️⭐️⭐️⭐️ | Design Pattern

---

## Mục Lục

| #   | Phần                                          |
| --- | --------------------------------------------- |
| 1   | Proxy là gì?                                  |
| 2   | Cú pháp & Handler Traps                       |
| 3   | get Trap — Chi tiết                           |
| 4   | set Trap — Validation & Formatting            |
| 5   | Reflect API                                   |
| 6   | Tất cả Traps — Bảng tổng hợp                  |
| 7   | Use Case: Validation                          |
| 8   | Use Case: Default Values & Virtual Properties |
| 9   | Use Case: Logging & Debugging                 |
| 10  | Use Case: DOM Manipulation                    |
| 11  | Use Case: Reactive System (Vue.js-style)      |
| 12  | Private Fields & Internal Slots               |
| 13  | Proxy.revocable()                             |
| 14  | Performance — Benchmark                       |
| 15  | Tradeoffs — Ưu & Nhược điểm                   |
| 16  | Proxy vs Object.defineProperty                |
| 17  | Real-World Applications                       |
| 18  | Tóm tắt                                       |

---

## §1. Proxy là gì?

```
PROXY PATTERN:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Proxy = NGƯỜI ĐẠI DIỆN!
  → Thay vì tương tác TRỰC TIẾP với object!
  → Ta tương tác QUA proxy!
  → Proxy CAN THIỆP vào mọi thao tác: get, set, delete,...!

  VÍ DỤ THỰC TẾ:
  → Thư ký (proxy) → Giám đốc (target object)!
  → Bạn không gặp giám đốc TRỰC TIẾP!
  → Thư ký LỌC cuộc gọi, SẮP XẾP lịch, TỪ CHỐI spam!
  → Thư ký CÓ THỂ thay đổi/validate thông tin!

  TRONG JAVASCRIPT:
  ┌────────────────────────────────────────────────────────┐
  │ Code → Proxy → Target Object                          │
  │                                                        │
  │ proxy.name → get trap → return obj.name               │
  │ proxy.age = 42 → set trap → validate → obj.age = 42  │
  │ delete proxy.x → deleteProperty trap → ...            │
  │ 'x' in proxy → has trap → ...                        │
  │ proxy() → apply trap → ...                            │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Cú pháp & Handler Traps

```javascript
// ═══ CÚ PHÁP CƠ BẢN ═══

const proxy = new Proxy(target, handler);

// target: object GỐC bạn muốn proxy!
// handler: object chứa TRAPS (các hàm can thiệp!)
```

```javascript
// ═══ VÍ DỤ ĐẦU TIÊN — EMPTY HANDLER ═══

const person = {
  name: "John Doe",
  age: 42,
  nationality: "American",
};

// Handler rỗng = NO-OP proxy (forward tất cả!):
const personProxy = new Proxy(person, {});

console.log(personProxy.name); // "John Doe"
personProxy.age = 43;
console.log(person.age); // 43 ← GỐC cũng thay đổi!

// Handler rỗng → Proxy hoạt động GIỐNG HỆT target!
// Mọi thao tác được forward thẳng!
```

```javascript
// ═══ THÊM get VÀ set TRAPS ═══

const person = {
  name: "John Doe",
  age: 42,
  nationality: "American",
};

const personProxy = new Proxy(person, {
  // TRAP: đọc property!
  get: (obj, prop) => {
    console.log(`The value of ${prop} is ${obj[prop]}`);
    return obj[prop];
  },

  // TRAP: ghi property!
  set: (obj, prop, value) => {
    console.log(`Changed ${prop} from ${obj[prop]} to ${value}`);
    obj[prop] = value;
    return true; // ← PHẢI return true! (strict mode!)
  },
});

personProxy.name; // Log: "The value of name is John Doe"
personProxy.age = 43; // Log: "Changed age from 42 to 43"
```

```
THUẬT NGỮ:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬────────────────────────────────────────────┐
  │ Thuật ngữ    │ Giải thích                                 │
  ├──────────────┼────────────────────────────────────────────┤
  │ TARGET       │ Object gốc bị proxy!                      │
  │ HANDLER      │ Object chứa các traps!                    │
  │ TRAP         │ Function can thiệp 1 thao tác cụ thể!    │
  │              │ (get, set, has, delete,...)                │
  │ RECEIVER     │ Object mà property được access trên!      │
  │              │ (thường là proxy hoặc object kế thừa!)     │
  │ INVARIANTS   │ Quy tắc BẤT BIẾN phải tuân thủ!          │
  │              │ Vi phạm → TypeError!                       │
  └──────────────┴────────────────────────────────────────────┘
```

---

## §3. get Trap — Chi tiết

```javascript
// ═══ get TRAP — DEFAULT VALUES ═══

const handler = {
  get(obj, prop) {
    return prop in obj ? obj[prop] : `Property "${prop}" doesn't exist!`;
  },
};

const p = new Proxy({}, handler);
p.a = 1;
p.b = undefined;

console.log(p.a); // 1
console.log(p.b); // undefined ← TỒN TẠI nhưng giá trị undefined!
console.log(p.c); // 'Property "c" doesn\'t exist!'
```

```javascript
// ═══ get TRAP — NEGATIVE ARRAY INDEX ═══

function createNegativeArray(arr) {
  return new Proxy(arr, {
    get(target, prop, receiver) {
      const index = Number(prop);

      // Negative index → đếm từ CUỐI!
      if (Number.isInteger(index) && index < 0) {
        const realIndex = target.length + index;
        return target[realIndex];
      }

      return Reflect.get(target, prop, receiver);
    },
  });
}

const arr = createNegativeArray([1, 2, 3, 4, 5]);
console.log(arr[-1]); // 5 ← phần tử CUỐI!
console.log(arr[-2]); // 4
console.log(arr[0]); // 1 ← vẫn hoạt động bình thường!
```

```javascript
// ═══ get TRAP — CHAINED API (FLUENT!) ═══

function createChainable(obj) {
  return new Proxy(obj, {
    get(target, prop) {
      if (prop in target) {
        const val = target[prop];
        // Nếu method → return wrapper tự trả về proxy!
        if (typeof val === "function") {
          return (...args) => {
            val.apply(target, args);
            return proxy; // Cho phép CHAIN!
          };
        }
        return val;
      }
      return undefined;
    },
  });
  var proxy = new Proxy(obj, {
    get(target, prop) {
      if (prop in target && typeof target[prop] === "function") {
        return (...args) => {
          target[prop](...args);
          return proxy;
        };
      }
      return target[prop];
    },
  });
  return proxy;
}
```

---

## §4. set Trap — Validation & Formatting

```javascript
// ═══ set TRAP — VALIDATION ═══

const personProxy = new Proxy(
  {},
  {
    set: (obj, prop, value) => {
      // VALIDATE age:
      if (prop === "age") {
        if (typeof value !== "number") {
          throw new TypeError("Age must be a number!");
        }
        if (value < 0 || value > 200) {
          throw new RangeError("Age must be between 0 and 200!");
        }
      }

      // VALIDATE name:
      if (prop === "name") {
        if (typeof value !== "string") {
          throw new TypeError("Name must be a string!");
        }
        if (value.length < 2) {
          throw new Error("Name must be at least 2 characters!");
        }
      }

      // OK → set value!
      obj[prop] = value;
      return true;
    },
  },
);

personProxy.name = "John"; // ✅ OK
personProxy.age = 42; // ✅ OK
personProxy.age = "old"; // ❌ TypeError: Age must be a number!
personProxy.name = ""; // ❌ Error: Name must be at least 2 characters!
personProxy.age = 300; // ❌ RangeError: Age must be between 0 and 200!
```

```javascript
// ═══ set TRAP — FORMATTING ═══

const proxy = new Proxy(
  {},
  {
    set: (obj, prop, value) => {
      // Auto-format age thành Number:
      if (prop === "age") {
        obj[prop] = Number(value);
        return true;
      }

      // Auto-trim strings:
      if (typeof value === "string") {
        obj[prop] = value.trim();
        return true;
      }

      // Auto-convert arrays:
      if (prop === "tags" && typeof value === "string") {
        obj[prop] = [value];
        return true;
      }

      obj[prop] = value;
      return true;
    },
  },
);

proxy.age = "42"; // → 42 (Number!)
proxy.name = "  John  "; // → "John" (trimmed!)
```

```
⚠️ QUAN TRỌNG: set TRAP PHẢI return true!
═══════════════════════════════════════════════════════════════

  Trong STRICT MODE:
  → set trap PHẢI return true (hoặc truthy!)
  → Nếu return false/undefined → TypeError!
  → "TypeError: 'set' on proxy: trap returned falsish"

  → Reflect.set() tự return true/false!
  → Nên dùng return Reflect.set(obj, prop, value)!
```

---

## §5. Reflect API

```
REFLECT — BẠN ĐỒNG HÀNH CỦA PROXY:
═══════════════════════════════════════════════════════════════

  Reflect = BUILT-IN OBJECT!
  → Cung cấp methods CÙNG TÊN với Proxy traps!
  → Dùng thay thế trực tiếp access (obj[prop]!)
  → TẠI SAO? Vì Reflect:
    → Return giá trị HỢP LÝ (true/false thay vì void!)
    → Xử lý RECEIVER đúng cách (prototype chain!)
    → Code SẠCH HƠN, DỄ ĐỌC hơn!
```

```javascript
// ═══ KHÔNG Reflect (cách cũ!) ═══

const proxy = new Proxy(person, {
  get: (obj, prop) => {
    console.log(`Get: ${prop}`);
    return obj[prop]; // ← Trực tiếp!
  },
  set: (obj, prop, value) => {
    console.log(`Set: ${prop} = ${value}`);
    obj[prop] = value; // ← Trực tiếp!
    return true; // ← Phải nhớ return!
  },
});
```

```javascript
// ═══ CÓ Reflect (RECOMMENDED!) ═══

const proxy = new Proxy(person, {
  get: (obj, prop, receiver) => {
    console.log(`Get: ${prop}`);
    return Reflect.get(obj, prop, receiver); // ✅ Sạch hơn!
  },
  set: (obj, prop, value, receiver) => {
    console.log(`Set: ${prop} = ${value}`);
    return Reflect.set(obj, prop, value, receiver); // ✅ Auto return!
  },
});
```

```
TẠI SAO NÊN DÙNG Reflect:
═══════════════════════════════════════════════════════════════

  ① RETURN VALUE:
  → obj[prop] = value → return undefined!
  → Reflect.set() → return true/false!
  → → Không cần nhớ "return true"!

  ② RECEIVER:
  → obj[prop] → KHÔNG truyền receiver!
  → Reflect.get(obj, prop, receiver) → ĐÚNG receiver!
  → Quan trọng khi có PROTOTYPE CHAIN!

  ③ CONSISTENCY:
  → Mỗi Reflect method = 1 Proxy trap!
  → Reflect.get ↔ get trap!
  → Reflect.set ↔ set trap!
  → Reflect.has ↔ has trap!
  → → API NHẤT QUÁN!

  ④ ERROR HANDLING:
  → Object.defineProperty() → throw khi fail!
  → Reflect.defineProperty() → return false khi fail!
  → → DỄ XỬ LÝ lỗi hơn!
```

---

## §6. Tất cả Traps — Bảng tổng hợp

```
PROXY TRAPS — FULL LIST:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────┬──────────────────────────┐
  │ Internal Method             │ Trap                     │
  ├─────────────────────────────┼──────────────────────────┤
  │ [[Get]]                     │ get(target, prop,        │
  │                             │   receiver)              │
  │ [[Set]]                     │ set(target, prop, value, │
  │                             │   receiver)              │
  │ [[HasProperty]]             │ has(target, prop)        │
  │ [[Delete]]                  │ deleteProperty(target,   │
  │                             │   prop)                  │
  │ [[OwnPropertyKeys]]        │ ownKeys(target)          │
  │ [[GetOwnProperty]]         │ getOwnPropertyDescriptor │
  │                             │   (target, prop)        │
  │ [[DefineOwnProperty]]      │ defineProperty(target,   │
  │                             │   prop, descriptor)      │
  │ [[GetPrototypeOf]]         │ getPrototypeOf(target)   │
  │ [[SetPrototypeOf]]         │ setPrototypeOf(target,   │
  │                             │   proto)                 │
  │ [[IsExtensible]]           │ isExtensible(target)     │
  │ [[PreventExtensions]]      │ preventExtensions(target)│
  │ [[Call]]     (functions!)   │ apply(target, thisArg,   │
  │                             │   args)                  │
  │ [[Construct]] (functions!)  │ construct(target, args,  │
  │                             │   newTarget)             │
  └─────────────────────────────┴──────────────────────────┘
```

```javascript
// ═══ has TRAP — 'in' OPERATOR ═══

const restrictedProps = ["password", "ssn", "secret"];

const user = { name: "John", password: "12345", age: 42 };

const safeUser = new Proxy(user, {
  has(target, prop) {
    if (restrictedProps.includes(prop)) {
      return false; // "password" in safeUser → false!
    }
    return Reflect.has(target, prop);
  },
  get(target, prop) {
    if (restrictedProps.includes(prop)) {
      return undefined; // safeUser.password → undefined!
    }
    return Reflect.get(target, prop);
  },
});

console.log("name" in safeUser); // true
console.log("password" in safeUser); // false ← ẨN!
console.log(safeUser.password); // undefined ← ẨN!
```

```javascript
// ═══ apply TRAP — FUNCTION PROXY ═══

function sum(a, b) {
  return a + b;
}

const loggedSum = new Proxy(sum, {
  apply(target, thisArg, args) {
    console.log(`Calling sum(${args.join(", ")})`);
    const result = Reflect.apply(target, thisArg, args);
    console.log(`Result: ${result}`);
    return result;
  },
});

loggedSum(1, 2);
// Log: "Calling sum(1, 2)"
// Log: "Result: 3"
// Return: 3
```

```javascript
// ═══ construct TRAP — new OPERATOR ═══

class User {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
}

const TrackedUser = new Proxy(User, {
  construct(target, args, newTarget) {
    console.log(`Creating User: ${args[0]}, age ${args[1]}`);
    const instance = Reflect.construct(target, args, newTarget);
    // Thêm metadata:
    instance.createdAt = Date.now();
    return instance;
  },
});

const user = new TrackedUser("John", 42);
// Log: "Creating User: John, age 42"
console.log(user.createdAt); // 1707900000000
```

```javascript
// ═══ deleteProperty TRAP ═══

const protectedObj = new Proxy(
  { id: 1, name: "John", role: "admin" },
  {
    deleteProperty(target, prop) {
      if (prop === "id") {
        throw new Error("Cannot delete 'id' property!");
      }
      return Reflect.deleteProperty(target, prop);
    },
  },
);

delete protectedObj.name; // ✅ OK
delete protectedObj.id; // ❌ Error: Cannot delete 'id' property!
```

---

## §7. Use Case: Validation

```javascript
// ═══ SCHEMA VALIDATION VỚI PROXY ═══

function createValidated(schema) {
  return new Proxy(
    {},
    {
      set(target, prop, value) {
        // Kiểm tra prop có trong schema?
        if (!(prop in schema)) {
          throw new Error(`Unknown property: ${prop}`);
        }

        const rule = schema[prop];

        // Kiểm tra TYPE:
        if (rule.type && typeof value !== rule.type) {
          throw new TypeError(
            `${prop} must be ${rule.type}, got ${typeof value}`,
          );
        }

        // Kiểm tra REQUIRED:
        if (
          rule.required &&
          (value === null || value === undefined || value === "")
        ) {
          throw new Error(`${prop} is required!`);
        }

        // Kiểm tra MIN/MAX:
        if (rule.min !== undefined && value < rule.min) {
          throw new RangeError(`${prop} must be >= ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          throw new RangeError(`${prop} must be <= ${rule.max}`);
        }

        // Kiểm tra PATTERN:
        if (rule.pattern && !rule.pattern.test(value)) {
          throw new Error(`${prop} format invalid!`);
        }

        // Custom VALIDATOR:
        if (rule.validate && !rule.validate(value)) {
          throw new Error(`${prop} failed custom validation!`);
        }

        return Reflect.set(target, prop, value);
      },
    },
  );
}

// SCHEMA DEFINITION:
const userSchema = {
  name: { type: "string", required: true },
  email: { type: "string", pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  age: { type: "number", min: 0, max: 150 },
  role: {
    type: "string",
    validate: (v) => ["admin", "user", "mod"].includes(v),
  },
};

// SỬ DỤNG:
const user = createValidated(userSchema);
user.name = "John"; // ✅
user.email = "john@example.com"; // ✅
user.age = 42; // ✅
user.role = "admin"; // ✅
user.age = -5; // ❌ RangeError!
user.email = "invalid"; // ❌ Pattern invalid!
user.role = "hacker"; // ❌ Custom validation failed!
user.unknown = "x"; // ❌ Unknown property!
```

---

## §8. Use Case: Default Values & Virtual Properties

```javascript
// ═══ DEFAULT VALUES ═══

function withDefaults(target, defaults) {
  return new Proxy(target, {
    get(obj, prop) {
      return prop in obj ? obj[prop] : defaults[prop];
    },
  });
}

const config = withDefaults(
  { apiUrl: "https://api.prod.com" },
  {
    apiUrl: "http://localhost:3000",
    timeout: 5000,
    retries: 3,
    debug: false,
  },
);

console.log(config.apiUrl); // 'https://api.prod.com' ← có trong target!
console.log(config.timeout); // 5000 ← từ DEFAULTS!
console.log(config.debug); // false ← từ DEFAULTS!
```

```javascript
// ═══ VIRTUAL PROPERTIES (computed!) ═══

const products = new Proxy(
  { browsers: ["Firefox", "Chrome"] },
  {
    get(obj, prop) {
      // Virtual property: latestBrowser!
      if (prop === "latestBrowser") {
        return obj.browsers[obj.browsers.length - 1];
      }
      return Reflect.get(obj, prop);
    },
    set(obj, prop, value) {
      // Virtual setter: latestBrowser → push!
      if (prop === "latestBrowser") {
        obj.browsers.push(value);
        return true;
      }
      // Auto-convert string → array:
      if (typeof value === "string" && prop === "browsers") {
        obj[prop] = [value];
        return true;
      }
      return Reflect.set(obj, prop, value);
    },
  },
);

console.log(products.browsers); // ["Firefox", "Chrome"]
products.latestBrowser = "Edge"; // Push "Edge"!
console.log(products.browsers); // ["Firefox", "Chrome", "Edge"]
console.log(products.latestBrowser); // "Edge"!

products.browsers = "Safari"; // Auto-convert to array!
console.log(products.browsers); // ["Safari"]
```

---

## §9. Use Case: Logging & Debugging

```javascript
// ═══ CHANGE TRACKER — LOG MỌI THAY ĐỔI ═══

function createTracker(target, name = "Object") {
  const history = [];

  const proxy = new Proxy(target, {
    set(obj, prop, value) {
      const entry = {
        timestamp: new Date().toISOString(),
        property: prop,
        oldValue: obj[prop],
        newValue: value,
        stack: new Error().stack,
      };
      history.push(entry);
      console.log(`[${name}] ${prop}: ${obj[prop]} → ${value}`);
      return Reflect.set(obj, prop, value);
    },
    deleteProperty(obj, prop) {
      console.log(`[${name}] DELETE ${prop} (was: ${obj[prop]})`);
      history.push({
        timestamp: new Date().toISOString(),
        property: prop,
        action: "delete",
        oldValue: obj[prop],
      });
      return Reflect.deleteProperty(obj, prop);
    },
  });

  proxy._getHistory = () => [...history];
  return proxy;
}

// SỬ DỤNG:
const state = createTracker({ count: 0, name: "App" }, "AppState");
state.count = 1; // [AppState] count: 0 → 1
state.count = 2; // [AppState] count: 1 → 2
state.name = "Demo"; // [AppState] name: App → Demo
delete state.name; // [AppState] DELETE name (was: Demo)

console.log(state._getHistory());
// → [{ prop: 'count', old: 0, new: 1 }, ...]
```

---

## §10. Use Case: DOM Manipulation

```javascript
// ═══ DOM TOGGLE — PROXY SET ═══

const view = new Proxy(
  { selected: null },
  {
    set(obj, prop, newVal) {
      const oldVal = obj[prop];

      if (prop === "selected") {
        // Bỏ select CŨ:
        if (oldVal) {
          oldVal.setAttribute("aria-selected", "false");
          oldVal.classList.remove("active");
        }
        // Set select MỚI:
        if (newVal) {
          newVal.setAttribute("aria-selected", "true");
          newVal.classList.add("active");
        }
      }

      return Reflect.set(obj, prop, newVal);
    },
  },
);

const item1 = document.getElementById("item-1");
const item2 = document.getElementById("item-2");

view.selected = item1;
// item1: aria-selected="true", class="active"!

view.selected = item2;
// item1: aria-selected="false" ← AUTO bỏ!
// item2: aria-selected="true"  ← AUTO thêm!
```

---

## §11. Use Case: Reactive System (Vue.js-style)

```javascript
// ═══ REACTIVE SYSTEM — PROXY + OBSERVER ═══
// Vue 3 dùng Proxy để tạo REACTIVITY!

function reactive(target) {
  const subscribers = new Map();

  function notify(prop) {
    const subs = subscribers.get(prop);
    if (subs) subs.forEach((fn) => fn());
  }

  function subscribe(prop, fn) {
    if (!subscribers.has(prop)) {
      subscribers.set(prop, new Set());
    }
    subscribers.get(prop).add(fn);

    // Return unsubscribe:
    return () => subscribers.get(prop).delete(fn);
  }

  const proxy = new Proxy(target, {
    get(obj, prop) {
      // Auto-track dependencies (simplified!):
      if (activeEffect && prop !== "_subscribe") {
        subscribe(prop, activeEffect);
      }
      return Reflect.get(obj, prop);
    },
    set(obj, prop, value) {
      const oldValue = obj[prop];
      const result = Reflect.set(obj, prop, value);
      if (oldValue !== value) {
        notify(prop);
      }
      return result;
    },
  });

  proxy._subscribe = subscribe;
  return proxy;
}

// EFFECT system:
let activeEffect = null;

function watchEffect(fn) {
  activeEffect = fn;
  fn(); // Chạy lần đầu → trigger get → auto-subscribe!
  activeEffect = null;
}

// ═══ SỬ DỤNG: ═══
const state = reactive({ count: 0, name: "Vue" });

// Tự động SUBSCRIBE khi đọc state.count:
watchEffect(() => {
  console.log(`Count is: ${state.count}`);
});
// → "Count is: 0" (lần đầu!)

state.count = 1; // → "Count is: 1" ← TỰ ĐỘNG chạy lại!
state.count = 2; // → "Count is: 2" ← TỰ ĐỘNG chạy lại!
state.name = "React"; // KHÔNG trigger count effect!
```

```
VUE 3 REACTIVITY:
═══════════════════════════════════════════════════════════════

  Vue 2: Object.defineProperty() → phải BIẾT TRƯỚC property!
  Vue 3: Proxy → DYNAMIC! Bắt TẤT CẢ properties!

  Vue 2 VẤN ĐỀ:
  → this.obj.newProp = 'x' → KHÔNG reactive! ❌
  → Phải dùng Vue.set(this.obj, 'newProp', 'x')!
  → Array index: this.arr[0] = 'x' → KHÔNG reactive! ❌

  Vue 3 GIẢI QUYẾT:
  → Proxy bắt TẤT CẢ thao tác!
  → obj.newProp = 'x' → reactive! ✅
  → arr[0] = 'x' → reactive! ✅
  → delete obj.prop → reactive! ✅
  → 'prop' in obj → tracked! ✅
```

---

## §12. Private Fields & Internal Slots

```javascript
// ═══ VẤN ĐỀ: PROXY + PRIVATE FIELDS ═══

class Secret {
  #secret;
  constructor(secret) {
    this.#secret = secret;
  }
  get secret() {
    return this.#secret.replace(/\d+/, "[REDACTED]");
  }
}

const secret = new Secret("123456");
console.log(secret.secret); // "[REDACTED]"

// ❌ Proxy KHÔNG access được private fields!
const proxy = new Proxy(secret, {});
console.log(proxy.secret); // ❌ TypeError: Cannot read private member!

// TẠI SAO?
// → Proxy = OBJECT KHÁC (different identity!)
// → #secret thuộc về Secret instance, KHÔNG thuộc Proxy!
// → Khi get trap chạy, this = proxy, KHÔNG PHẢI secret!
```

```javascript
// ═══ FIX: REDIRECT this ═══

const proxy = new Proxy(secret, {
  get(target, prop, receiver) {
    const value = target[prop];

    // Nếu là function → bind this về TARGET!
    if (typeof value === "function") {
      return function (...args) {
        return value.apply(this === receiver ? target : this, args);
      };
    }
    return value;
  },
});

console.log(proxy.secret); // ✅ "[REDACTED]"
```

```javascript
// ═══ TƯƠNG TỰ: MAP, SET có internal slots! ═══

const map = new Map();

// ❌ Proxy không work với Map:
const mapProxy = new Proxy(map, {});
mapProxy.set("key", "value");
// TypeError: Method Map.prototype.set called on incompatible receiver!

// ✅ FIX: bind methods!
const mapProxy2 = new Proxy(map, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof value === "function") {
      return value.bind(target); // Bind this!
    }
    return value;
  },
});

mapProxy2.set("key", "value"); // ✅ OK!
mapProxy2.get("key"); // ✅ 'value'
```

```
INTERNAL SLOTS — DANH SÁCH:
═══════════════════════════════════════════════════════════════

  Objects có internal slots KHÔNG tương thích với Proxy:
  ┌──────────────┬─────────────────────────────────────────┐
  │ Object       │ Internal Slot                           │
  ├──────────────┼─────────────────────────────────────────┤
  │ Map          │ [[MapData]]                             │
  │ Set          │ [[SetData]]                             │
  │ Date         │ [[DateValue]]                           │
  │ Promise      │ [[PromiseState]]                        │
  │ RegExp       │ [[RegExpMatcher]]                       │
  │ ArrayBuffer  │ [[ArrayBufferData]]                     │
  │ Class (ES6)  │ #privateField                           │
  └──────────────┴─────────────────────────────────────────┘

  FIX CHUNG: bind methods về TARGET!
```

---

## §13. Proxy.revocable()

```javascript
// ═══ REVOCABLE PROXY — CÓ THỂ HỦY! ═══

const target = { name: "John", age: 42 };

const { proxy, revoke } = Proxy.revocable(target, {
  get(obj, prop) {
    console.log(`Get: ${prop}`);
    return Reflect.get(obj, prop);
  },
});

// SỬ DỤNG bình thường:
console.log(proxy.name); // "Get: name" → "John"
console.log(proxy.age); // "Get: age" → 42

// HỦY proxy:
revoke();

// SAU KHI HỦY:
console.log(proxy.name);
// ❌ TypeError: Cannot perform 'get' on a proxy that has been revoked
proxy.age = 50;
// ❌ TypeError: Cannot perform 'set' on a proxy that has been revoked
```

```
KHI NÀO DÙNG Proxy.revocable():
═══════════════════════════════════════════════════════════════

  ① SECURITY:
  → Cấp quyền TẠM THỜI → revoke khi hết phiên!
  → VD: API key proxy → revoke sau 1 giờ!

  ② MEMORY MANAGEMENT:
  → Revoke để GC có thể thu hồi target!
  → Tránh memory leak!

  ③ ACCESS CONTROL:
  → Cho phép plugin truy cập → revoke khi uninstall!
```

---

## §14. Performance — Benchmark

```
PERFORMANCE — PROXY CHẬM HƠN!
═══════════════════════════════════════════════════════════════

  BENCHMARK (Node.js):
  ┌──────────────────────┬─────────────────────────────┐
  │ Method               │ ops/sec                     │
  ├──────────────────────┼─────────────────────────────┤
  │ Vanilla (obj.prop=)  │ ~74,000,000  ← NHANH NHẤT! │
  │ Object.defineProperty│ ~74,000,000  ← TƯƠNG ĐƯƠNG! │
  │ Proxy set trap       │  ~3,600,000  ← CHẬM 20x!   │
  └──────────────────────┴─────────────────────────────┘

  → Proxy CHẬM HƠN ~20 lần so với vanilla!
  → Tương tự Promise chậm hơn callbacks!

  NHƯNG:
  → 3.6 TRIỆU ops/giây VẪN RẤT NHANH!
  → Chỉ ảnh hưởng nếu:
    → Loop chặt (tight loop!) với millions ops!
    → Performance-critical code (game engine!)
    → Real-time rendering!

  → PHẦN LỚN applications: KHÔNG ẢNH HƯỞNG!
  → Vue 3 dùng Proxy → PRODUCTION ổn!
  → Giống: Promise chậm hơn callback, NHƯNG ai cũng dùng!
```

```
FUNCTION PROXY CŨNG CHẬM:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────┬──────────────────────────────┐
  │ Method               │ ops/sec                      │
  ├──────────────────────┼──────────────────────────────┤
  │ Vanilla (fn())       │ ~78,000,000                  │
  │ Wrapper (() => fn()) │ ~75,000,000                  │
  │ Proxy (apply trap)   │  ~5,200,000  ← CHẬM ~15x!  │
  └──────────────────────┴──────────────────────────────┘

  → Nếu cần wrap function → dùng WRAPPER FUNCTION!
  → Proxy apply trap CHỈ KHI cần dynamic interception!
```

---

## §15. Tradeoffs — Ưu & Nhược điểm

```
ƯU ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ VALIDATION:
  → Validate input trước khi set!
  → Data LUÔN ĐÚNG format!

  ✅ FORMATTING:
  → Auto-format, auto-trim, auto-convert!

  ✅ LOGGING & DEBUGGING:
  → Track MỌI thay đổi!
  → Change history!

  ✅ REACTIVE:
  → Vue 3 reactivity system!
  → Auto-update khi data thay đổi!

  ✅ SECURITY:
  → Ẩn properties (has trap!)
  → Read-only (set trap throw!)
  → Revocable access!

  ✅ DYNAMIC:
  → Không cần biết TRƯỚC properties!
  → Bắt TẤT CẢ thao tác!
  → Khác defineProperty: phải declare per-property!

  ✅ NOTIFICATIONS:
  → Hook vào EVERY change!
  → Sync state across components!
```

```
NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ❌ PERFORMANCE:
  → Chậm ~20x so với vanilla property access!
  → KHÔNG dùng trong tight loops / performance-critical!

  ❌ DEBUGGING COMPLEXITY:
  → Stack traces qua proxy = KHÓ ĐỌC!
  → "Where did this change come from?"

  ❌ PRIVATE FIELDS / INTERNAL SLOTS:
  → KHÔNG work với #private, Map, Set, Date!
  → Cần workaround: bind this!

  ❌ IDENTITY:
  → proxy !== target!
  → Strict equality checks có thể BREAK!
  → target === proxy → FALSE!

  ❌ OVERUSE:
  → "Proxy ALL the things" → app CHẬM + PHỨC TẠP!
  → Chỉ dùng khi CÓ LÝ DO cụ thể!
```

---

## §16. Proxy vs Object.defineProperty

```
SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬─────────────────┬──────────────────┐
  │                    │ Proxy           │ defineProperty   │
  ├────────────────────┼─────────────────┼──────────────────┤
  │ Scope              │ TOÀN BỘ object! │ Per PROPERTY!    │
  │ Dynamic props?     │ ✅ Bắt TẤT CẢ │ ❌ Chỉ declared! │
  │ Array index?       │ ✅ arr[0] = x   │ ❌ Không bắt!    │
  │ New props?         │ ✅ obj.new = x  │ ❌ Không bắt!    │
  │ delete?            │ ✅ deleteProperty│ ❌ Không có!     │
  │ 'in' operator?     │ ✅ has trap      │ ❌ Không có!     │
  │ Enumerate?         │ ✅ ownKeys trap │ ❌ Không có!      │
  │ Performance        │ ❌ Chậm ~20x    │ ✅ Ngang vanilla!│
  │ Browser support    │ ✅ Modern       │ ✅ IE9+          │
  │ Polyfill?          │ ❌ KHÔNG THỂ!   │ ✅ Có            │
  │ Revocable?         │ ✅ revocable()  │ ❌ Không có!      │
  └────────────────────┴─────────────────┴──────────────────┘

  VUE 2 → defineProperty (phải khai báo TRƯỚC!)
  VUE 3 → Proxy (bắt DYNAMIC tất cả!)

  ⚠️ QUAN TRỌNG:
  → Proxy KHÔNG THỂ polyfill!
  → Vì cần JavaScript ENGINE hỗ trợ!
  → IE11 KHÔNG support Proxy!
  → Nếu cần IE11 → phải dùng defineProperty!
```

---

## §17. Real-World Applications

```javascript
// ═══ IMMUTABLE OBJECT ═══

function immutable(target) {
  return new Proxy(target, {
    set() {
      throw new Error("This object is immutable!");
    },
    deleteProperty() {
      throw new Error("Cannot delete from immutable object!");
    },
    defineProperty() {
      throw new Error("Cannot define property on immutable object!");
    },
  });
}

const config = immutable({
  apiUrl: "https://api.example.com",
  timeout: 5000,
});

console.log(config.apiUrl); // ✅ OK
config.apiUrl = "hack"; // ❌ Error: This object is immutable!
delete config.timeout; // ❌ Error!
```

```javascript
// ═══ API CLIENT — AUTO ENDPOINT GENERATION ═══

function createAPI(baseUrl) {
  return new Proxy(
    {},
    {
      get(target, prop) {
        // GET /users, POST /users, etc.
        return new Proxy(() => {}, {
          get(_, method) {
            return async (data) => {
              const url = `${baseUrl}/${prop}`;
              const options = {
                method: method.toUpperCase(),
                headers: { "Content-Type": "application/json" },
              };
              if (data && method !== "get") {
                options.body = JSON.stringify(data);
              }
              const res = await fetch(
                method === "get" && data
                  ? `${url}?${new URLSearchParams(data)}`
                  : url,
                options,
              );
              return res.json();
            };
          },
          apply(target, thisArg, args) {
            // Direct call = GET!
            return fetch(`${baseUrl}/${prop}`).then((r) => r.json());
          },
        });
      },
    },
  );
}

// SỬ DỤNG:
const api = createAPI("https://api.example.com");

// Tự động tạo endpoints:
await api.users(); // GET /users
await api.users.get({ page: 1 }); // GET /users?page=1
await api.users.post({ name: "John" }); // POST /users
await api.products.get({ category: "A" }); // GET /products?category=A
```

```javascript
// ═══ OBSERVABLE STATE — ĐƠN GIẢN ═══

function observable(target, onChange) {
  return new Proxy(target, {
    set(obj, prop, value) {
      const oldValue = obj[prop];
      const result = Reflect.set(obj, prop, value);

      if (oldValue !== value) {
        onChange(prop, value, oldValue);
      }

      return result;
    },
  });
}

// SỬ DỤNG:
const state = observable({ count: 0, name: "App" }, (prop, newVal, oldVal) => {
  console.log(`${prop} changed: ${oldVal} → ${newVal}`);
  // Re-render UI ở đây!
});

state.count = 1; // "count changed: 0 → 1"
state.count = 1; // KHÔNG trigger (same value!)
state.name = "X"; // "name changed: App → X"
```

---

## §18. Tóm tắt

```
PROXY PATTERN — TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Proxy là gì?"
  A: Object can thiệp vào mọi thao tác trên target!
  new Proxy(target, handler) với traps: get, set, has,...

  Q: "Reflect?"
  A: Built-in object cùng tên methods với Proxy traps!
  Return booleans, handle receiver đúng, code sạch hơn!

  Q: "get trap?"
  A: Intercept property access. Dùng cho: default values,
  validation, logging, negative array index, virtual props!

  Q: "set trap?"
  A: Intercept property write. PHẢI return true!
  Dùng cho: validation, formatting, reactive notif!

  Q: "Performance?"
  A: Chậm ~20x so với vanilla, NHƯNG 3.6M ops/s
  vẫn đủ cho hầu hết apps. Vue 3 dùng production OK!

  Q: "Private fields?"
  A: Proxy KHÔNG access được #private hoặc internal slots!
  Fix: bind methods về target object!

  Q: "Proxy vs defineProperty?"
  A: Proxy: dynamic, bắt tất cả props, array index!
  defineProperty: per-property, nhanh hơn, IE11 support!
  Vue 2 → defineProperty. Vue 3 → Proxy!

  Q: "Proxy.revocable?"
  A: Tạo proxy có thể HỦY. Sau revoke() → TypeError!
  Dùng cho: temp access, security, memory cleanup!
```

---

### Checklist

- [ ] **Proxy concept**: new Proxy(target, handler) với traps can thiệp mọi thao tác!
- [ ] **get trap**: intercept đọc; default values, negative index, virtual props, logging!
- [ ] **set trap**: intercept ghi; validation, formatting; PHẢI return true (strict mode!)
- [ ] **has trap**: intercept `in` operator; ẩn sensitive properties!
- [ ] **apply trap**: intercept function call; logging, profiling!
- [ ] **construct trap**: intercept `new`; thêm metadata, tracking!
- [ ] **deleteProperty trap**: intercept `delete`; protect critical properties!
- [ ] **Reflect**: built-in companion; Reflect.get/set/has; auto return booleans; handle receiver!
- [ ] **Validation**: schema-based validation qua set trap; type, min/max, pattern, custom!
- [ ] **Reactive system**: Vue 3 style; Proxy get → track deps, set → notify subscribers!
- [ ] **Vue 2 vs 3**: defineProperty (per-prop, no dynamic) → Proxy (catch-all, dynamic, array!)
- [ ] **Private fields**: Proxy ≠ target identity; #private, Map, Set cần bind this workaround!
- [ ] **Proxy.revocable()**: tạo proxy HỦY được; security, temp access, memory!
- [ ] **Performance**: ~20x chậm hơn vanilla NHƯNG 3.6M ops/s; KHÔNG dùng cho tight loops!
- [ ] **Tradeoffs**: powerful (validation/reactive/security) vs cost (perf/complexity/identity!)

---

_Nguồn: patterns.dev — Proxy Pattern, MDN Web Docs, David Walsh, Valeri Karpov_
_Cập nhật lần cuối: Tháng 2, 2026_
