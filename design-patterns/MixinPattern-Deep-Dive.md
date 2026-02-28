# Mixin Pattern — Deep Dive

> 📅 2026-02-14 · ⏱ 20 phút đọc
>
> Mixin Concept & Object.assign,
> Functional Mixins, Class Mixins,
> Mixin Composition & Chaining,
> Mixin Inheritance (\_\_proto\_\_),
> Window Mixins (Browser API),
> React Mixins → HOC → Hooks,
> Diamond Problem, Prototype Pollution,
> Real-World Applications & Tradeoffs
> Độ khó: ⭐️⭐️⭐️⭐️ | Design Pattern

---

## Mục Lục

| #   | Phần                                      |
| --- | ----------------------------------------- |
| 1   | Mixin Pattern là gì?                      |
| 2   | Object.assign — Cơ chế cốt lõi            |
| 3   | Mixin Inheritance — \_\_proto\_\_ & super |
| 4   | Functional Mixins                         |
| 5   | Class Mixin Factory — Subclass Pattern    |
| 6   | Mixin Composition — Nhiều Mixins          |
| 7   | Window Mixins — Browser API               |
| 8   | React Mixins → HOC → Hooks                |
| 9   | Diamond Problem & Collision               |
| 10  | Prototype Pollution                       |
| 11  | Real-World Applications                   |
| 12  | Tradeoffs — Ưu & Nhược điểm               |
| 13  | Tóm tắt                                   |

---

## §1. Mixin Pattern là gì?

```
MIXIN PATTERN — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Mixin = object CHỨA functionality để TRỘN VÀO!
  → THÊM chức năng cho object/class!
  → KHÔNG dùng inheritance (kế thừa!)
  → KHÔNG tạo instance từ mixin!
  → Mixin CHỈ CÓ 1 mục đích: CHIA SẺ functionality!

  VÍ DỤ THỰC TẾ:
  → Mixin = GÓI GIA VỊ ở quán trà sữa!
  → Trân châu, thạch, pudding = MIXINS!
  → Trà sữa = CLASS gốc!
  → Trộn thêm trân châu → trà sữa + trân châu!
  → Trộn thêm pudding → trà sữa + pudding!
  → GÓI GIA VỊ tự nó KHÔNG phải đồ uống!
  → Nó chỉ THÊM vào đồ uống!

  TẠI SAO KHÔNG DÙNG INHERITANCE?
  ┌──────────────────────────────────────────────────────────┐
  │ JavaScript chỉ có SINGLE inheritance!                   │
  │ → 1 class chỉ extends ĐƯỢC 1 class!                    │
  │ → Muốn thêm chức năng từ NHIỀU nguồn?                 │
  │ → Inheritance KHÔNG ĐỦ!                                │
  │ → MIXIN = giải pháp "multiple inheritance"!            │
  └──────────────────────────────────────────────────────────┘
```

```
MIXIN vs INHERITANCE:
═══════════════════════════════════════════════════════════════

  INHERITANCE (KẾ THỪA):
  ┌──────────┐
  │  Animal   │
  └─────┬─────┘
        │ extends
  ┌─────┴─────┐
  │    Dog     │
  └───────────┘
  → Dog IS-A Animal!
  → Quan hệ: "là một" (is-a!)
  → CHỈ thừa kế ĐƯỢC 1 class!

  MIXIN (TRỘN):
  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐
  │  Swimmable   │  │  Flyable    │  │  Walkable    │
  └──────┬───────┘  └──────┬──────┘  └──────┬───────┘
         │ assign          │ assign          │ assign
         ▼                 ▼                 ▼
  ┌────────────────────────────────────────────────────┐
  │                      Duck                          │
  │  → CAN swim + CAN fly + CAN walk!                │
  └────────────────────────────────────────────────────┘
  → Duck HAS swim/fly/walk abilities!
  → Quan hệ: "có khả năng" (has-a / can-do!)
  → TRỘN từ NHIỀU nguồn!
```

---

## §2. Object.assign — Cơ chế cốt lõi

```javascript
// ═══ VÍ DỤ CƠ BẢN — DOG + MIXIN ═══

class Dog {
  constructor(name) {
    this.name = name;
  }
}

// MIXIN: object chứa functionality!
const dogFunctionality = {
  bark: () => console.log("Woof!"),
  wagTail: () => console.log("Wagging my tail!"),
  play: () => console.log("Playing!"),
};

// TRỘN mixin vào Dog.prototype:
Object.assign(Dog.prototype, dogFunctionality);

// BÂY GIỜ mọi Dog instance CÓ bark, wagTail, play!
const pet1 = new Dog("Daisy");

pet1.name; // "Daisy"
pet1.bark(); // "Woof!"
pet1.wagTail(); // "Wagging my tail!"
pet1.play(); // "Playing!"
```

```
Object.assign — GIẢI THÍCH:
═══════════════════════════════════════════════════════════════

  Object.assign(target, ...sources)
  → COPY tất cả enumerable OWN properties!
  → Từ sources → vào target!
  → MODIFY target, return target!

  Object.assign(Dog.prototype, dogFunctionality)
  → TRƯỚC: Dog.prototype = { constructor: Dog }
  → SAU:   Dog.prototype = {
              constructor: Dog,
              bark: [Function],     ← TỪ MIXIN!
              wagTail: [Function],  ← TỪ MIXIN!
              play: [Function],     ← TỪ MIXIN!
            }

  → TẤT CẢ instances tạo bằng new Dog()
  → → SẼ CÓ bark, wagTail, play QUA prototype chain!
  → → KHÔNG copy vào từng instance!
  → → CHIA SẺ trên prototype! (memory efficient!)
```

```javascript
// ═══ Object.assign — CHI TIẾT ═══

// SHALLOW COPY — chỉ copy level 1!
const mixin = {
  greet() {
    console.log("Hello!");
  },
  config: { theme: "dark" }, // ← Object reference!
};

const target = {};
Object.assign(target, mixin);

target.greet(); // "Hello!"
target.config.theme = "light"; // ← SỬA ĐỔI!
console.log(mixin.config.theme); // "light" ← ❌ CŨNG BỊ ĐỔI!

// → Object.assign = SHALLOW!
// → Nested objects vẫn SHARED reference!
// → Cẩn thận với mutable nested data!
```

---

## §3. Mixin Inheritance — \_\_proto\_\_ & super

```javascript
// ═══ MIXIN CÓ THỂ KẾ THỪA MIXIN KHÁC! ═══

const animalFunctionality = {
  walk: () => console.log("Walking!"),
  sleep: () => console.log("Sleeping!"),
};

const dogFunctionality = {
  // Thiết lập prototype chain CHO mixin!
  __proto__: animalFunctionality,

  bark: () => console.log("Woof!"),
  wagTail: () => console.log("Wagging my tail!"),
  play: () => console.log("Playing!"),

  // GỌI method từ parent mixin QUA super:
  walk() {
    super.walk(); // → animalFunctionality.walk()!
  },
  sleep() {
    super.sleep(); // → animalFunctionality.sleep()!
  },
};

class Dog {
  constructor(name) {
    this.name = name;
  }
}

// TRỘN dogFunctionality (có kèm animalFunctionality!):
Object.assign(Dog.prototype, dogFunctionality);

const pet1 = new Dog("Daisy");

pet1.name; // "Daisy"
pet1.bark(); // "Woof!"
pet1.play(); // "Playing!"
pet1.walk(); // "Walking!" ← Từ animalFunctionality qua super!
pet1.sleep(); // "Sleeping!" ← Từ animalFunctionality qua super!
```

```
MIXIN CHAIN:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────┐
  │  animalFunctionality    │
  │  → walk()              │
  │  → sleep()             │
  └───────────┬─────────────┘
              │ __proto__
  ┌───────────┴─────────────┐
  │  dogFunctionality       │
  │  → bark()              │
  │  → wagTail()           │
  │  → play()              │
  │  → walk() { super }    │ ← Gọi animal.walk()!
  │  → sleep() { super }   │ ← Gọi animal.sleep()!
  └───────────┬─────────────┘
              │ Object.assign
  ┌───────────┴─────────────┐
  │  Dog.prototype          │
  │  → bark()              │
  │  → wagTail()           │
  │  → play()              │
  │  → walk()              │
  │  → sleep()             │
  └───────────┬─────────────┘
              │ new Dog()
  ┌───────────┴─────────────┐
  │  pet1 { name: "Daisy" }│
  └─────────────────────────┘

  ⚠️ CHÚ Ý:
  → Object.assign CHỈ copy OWN properties!
  → walk/sleep từ dogFunctionality (own, gọi super!)
  → KHÔNG copy animalFunctionality trực tiếp!
  → super hoạt động NHỜ __proto__ chain!
```

---

## §4. Functional Mixins

```javascript
// ═══ FUNCTIONAL MIXIN — FACTORY FUNCTION! ═══

// Thay vì object literal → dùng FUNCTION!
// Function nhận target → THÊM functionality → return target!

const withLogging = (obj) => {
  obj.log = function (message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  };
  obj.warn = function (message) {
    console.warn(`[WARN] ${message}`);
  };
  obj.error = function (message) {
    console.error(`[ERROR] ${message}`);
  };
  return obj;
};

const withValidation = (obj) => {
  obj.validate = function (data, rules) {
    const errors = {};
    for (const [field, rule] of Object.entries(rules)) {
      if (rule.required && !data[field]) {
        errors[field] = `${field} is required!`;
      }
      if (rule.minLength && data[field]?.length < rule.minLength) {
        errors[field] = `${field} must be at least ${rule.minLength} chars!`;
      }
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  };
  return obj;
};

const withEvents = (obj) => {
  const listeners = {};
  obj.on = function (event, fn) {
    (listeners[event] = listeners[event] || []).push(fn);
  };
  obj.emit = function (event, ...args) {
    (listeners[event] || []).forEach((fn) => fn(...args));
  };
  obj.off = function (event, fn) {
    listeners[event] = (listeners[event] || []).filter((f) => f !== fn);
  };
  return obj;
};

// COMPOSE nhiều mixins:
function createService() {
  const service = { name: "MyService" };
  // Pipe qua nhiều functional mixins:
  return withEvents(withValidation(withLogging(service)));
}

const myService = createService();
myService.log("Service started!"); // ← từ withLogging!
myService.validate(
  { email: "" },
  {
    // ← từ withValidation!
    email: { required: true },
  },
);
myService.on("data", (d) => console.log(d)); // ← từ withEvents!
myService.emit("data", { id: 1 });
```

```javascript
// ═══ FUNCTIONAL MIXIN — CLOSURE CHO PRIVATE STATE! ═══

const withCounter = (obj) => {
  // PRIVATE! Chỉ closure access được!
  let count = 0;

  obj.increment = () => ++count;
  obj.decrement = () => --count;
  obj.getCount = () => count;
  obj.reset = () => {
    count = 0;
  };

  return obj;
};

const counter = withCounter({});
counter.increment(); // 1
counter.increment(); // 2
counter.getCount(); // 2
counter.count; // undefined! PRIVATE!
```

```
FUNCTIONAL MIXIN vs OBJECT MIXIN:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬─────────────────┬──────────────────┐
  │                    │ Object Mixin    │ Functional Mixin │
  ├────────────────────┼─────────────────┼──────────────────┤
  │ Dạng               │ Object literal  │ Function         │
  │ Private state?     │ ❌ Không        │ ✅ Closure!      │
  │ Parameterized?     │ ❌ Cố định      │ ✅ Nhận params!  │
  │ Initialization?    │ ❌ Không        │ ✅ Setup logic!  │
  │ Apply              │ Object.assign   │ fn(target)       │
  │ Composition        │ Nhiều assign    │ Pipe/compose     │
  └────────────────────┴─────────────────┴──────────────────┘
```

---

## §5. Class Mixin Factory — Subclass Pattern

```javascript
// ═══ CLASS MIXIN = FACTORY FUNCTION TRẢ VỀ CLASS! ═══

// Mixin nhận Base class → return EXTENDED class!

const Serializable = (Base) =>
  class extends Base {
    serialize() {
      return JSON.stringify(this);
    }

    static deserialize(json) {
      return Object.assign(new this(), JSON.parse(json));
    }
  };

const Timestamped = (Base) =>
  class extends Base {
    constructor(...args) {
      super(...args);
      this.createdAt = new Date();
      this.updatedAt = new Date();
    }

    touch() {
      this.updatedAt = new Date();
    }
  };

const Validatable = (Base) =>
  class extends Base {
    validate() {
      const errors = [];
      if (this.constructor.validationRules) {
        for (const [field, rules] of Object.entries(
          this.constructor.validationRules,
        )) {
          if (rules.required && !this[field]) {
            errors.push(`${field} is required!`);
          }
        }
      }
      return { isValid: errors.length === 0, errors };
    }
  };

// ═══ COMPOSE MIXINS = CHAINING! ═══

class User extends Serializable(Timestamped(Validatable(class {}))) {
  static validationRules = {
    name: { required: true },
    email: { required: true },
  };

  constructor(name, email) {
    super();
    this.name = name;
    this.email = email;
  }
}

const user = new User("John", "john@example.com");

// Từ Timestamped:
console.log(user.createdAt); // Date object!
user.touch(); // Update updatedAt!

// Từ Serializable:
const json = user.serialize(); // '{"name":"John","email":"john@example.com",...}'

// Từ Validatable:
user.validate(); // { isValid: true, errors: [] }

// Từ User:
console.log(user.name); // "John"
```

```
CLASS MIXIN CHAIN:
═══════════════════════════════════════════════════════════════

  User extends Serializable(Timestamped(Validatable(class {})))

  PROTOTYPE CHAIN:
  ┌───────────────┐
  │ class {}       │ ← Base (empty class!)
  └───────┬───────┘
          │ extends (Validatable wrap!)
  ┌───────┴───────┐
  │ Validatable   │ → validate()
  └───────┬───────┘
          │ extends (Timestamped wrap!)
  ┌───────┴───────┐
  │ Timestamped   │ → createdAt, touch()
  └───────┬───────┘
          │ extends (Serializable wrap!)
  ┌───────┴───────┐
  │ Serializable  │ → serialize(), deserialize()
  └───────┬───────┘
          │ extends
  ┌───────┴───────┐
  │ User          │ → name, email
  └───────────────┘

  → REAL inheritance chain!
  → Mỗi mixin = 1 LAYER!
  → super() chạy qua TẤT CẢ layers!
  → instanceof HOẠT ĐỘNG!
```

```javascript
// ═══ HELPER — COMPOSE MIXINS ═══

// Thay vì: A(B(C(Base))) → khó đọc!
// Dùng compose helper:

function applyMixins(Base, ...mixins) {
  return mixins.reduce((acc, mixin) => mixin(acc), Base);
}

// SẠCH HƠN:
class User extends applyMixins(
  class {}, // Base!
  Validatable, // Layer 1!
  Timestamped, // Layer 2!
  Serializable, // Layer 3!
) {
  constructor(name) {
    super();
    this.name = name;
  }
}

// Hoặc dùng pipe:
const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((acc, fn) => fn(acc), x);

const EnhancedBase = pipe(Validatable, Timestamped, Serializable)(class {});

class User extends EnhancedBase {
  constructor(name) {
    super();
    this.name = name;
  }
}
```

---

## §6. Mixin Composition — Nhiều Mixins

```javascript
// ═══ NHIỀU OBJECT MIXINS = Object.assign ═══

const Swimmable = {
  swim() {
    console.log(`${this.name} is swimming!`);
  },
  dive() {
    console.log(`${this.name} is diving!`);
  },
};

const Flyable = {
  fly() {
    console.log(`${this.name} is flying!`);
  },
  land() {
    console.log(`${this.name} is landing!`);
  },
};

const Walkable = {
  walk() {
    console.log(`${this.name} is walking!`);
  },
  run() {
    console.log(`${this.name} is running!`);
  },
};

const Singable = {
  sing() {
    console.log(`${this.name} is singing!`);
  },
};

// ═══ COMPOSE theo nhu cầu! ═══

class Duck {
  constructor(name) {
    this.name = name;
  }
}
// Duck: swim + fly + walk!
Object.assign(Duck.prototype, Swimmable, Flyable, Walkable);

class Penguin {
  constructor(name) {
    this.name = name;
  }
}
// Penguin: swim + walk (KHÔNG FLY!)
Object.assign(Penguin.prototype, Swimmable, Walkable);

class Eagle {
  constructor(name) {
    this.name = name;
  }
}
// Eagle: fly + walk!
Object.assign(Eagle.prototype, Flyable, Walkable);

class Nightingale {
  constructor(name) {
    this.name = name;
  }
}
// Nightingale: fly + walk + sing!
Object.assign(Nightingale.prototype, Flyable, Walkable, Singable);

// SỬ DỤNG:
const donald = new Duck("Donald");
donald.swim(); // "Donald is swimming!"
donald.fly(); // "Donald is flying!"
donald.walk(); // "Donald is walking!"

const tux = new Penguin("Tux");
tux.swim(); // "Tux is swimming!"
tux.walk(); // "Tux is walking!"
tux.fly(); // ❌ TypeError: tux.fly is not a function!

// → MỖI class chọn ĐÚNG mixins mình cần!
// → FLEXIBLE hơn single inheritance!
```

```
TẠI SAO MIXIN TỐT HƠN INHERITANCE Ở ĐÂY:
═══════════════════════════════════════════════════════════════

  ❌ INHERITANCE — KHÓ KHĂN:
  Animal → FlyingAnimal → Duck?
  Animal → SwimmingAnimal → Duck?
  → Duck VỪA bay VỪA bơi → extends AI? 💥
  → JavaScript CHỈ có single inheritance!

  ✅ MIXIN — LINH HOẠT:
  Duck = class + Swimmable + Flyable + Walkable!
  Penguin = class + Swimmable + Walkable!
  → Chọn ĐÚNG cái mình CẦN!
  → KHÔNG bị ràng buộc bởi hierarchy!
  → "Composition over Inheritance!"
```

---

## §7. Window Mixins — Browser API

```javascript
// ═══ BROWSER WINDOW — MIXIN THỰC TẾ! ═══

// Window object KHÔNG tự có TẤT CẢ methods!
// Nó TRỘN từ nhiều MIXINS:

// ① WindowOrWorkerGlobalScope mixin:
window.setTimeout(() => {}, 1000); // ← Từ mixin!
window.setInterval(() => {}, 1000); // ← Từ mixin!
window.fetch("https://api.example.com"); // ← Từ mixin!
window.indexedDB.open("myDB"); // ← Từ mixin!
console.log(window.isSecureContext); // ← Từ mixin!
window.atob("base64string"); // ← Từ mixin!
window.btoa("string"); // ← Từ mixin!

// ② WindowEventHandlers mixin:
window.onbeforeunload = () => {}; // ← Từ mixin!
window.onhashchange = () => {}; // ← Từ mixin!
window.onmessage = () => {}; // ← Từ mixin!

// MIXINS KHÔNG TỒN TẠI NHƯ OBJECTS!
console.log(window.WindowOrWorkerGlobalScope); // undefined!
console.log(window.WindowEventHandlers); // undefined!
// → Mixins chỉ THÊM functionality!
// → KHÔNG tạo được instance từ mixin!
```

```
WINDOW MIXIN ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌───────────────────────────────┐
  │ WindowOrWorkerGlobalScope     │
  │ (Mixin!)                      │
  │ → setTimeout, setInterval     │
  │ → fetch, indexedDB           │
  │ → isSecureContext             │
  │ → atob, btoa                  │
  └──────────────┬────────────────┘
                 │ mixin into
  ┌──────────────┴────────────────┐
  │ WindowEventHandlers (Mixin!) │
  │ → onbeforeunload             │
  │ → onhashchange               │
  │ → onmessage                  │
  └──────────────┬────────────────┘
                 │ mixin into
  ┌──────────────┴────────────────┐
  │ Window                       │
  │ → document, location, history│
  │ → innerWidth, innerHeight    │
  │ → open, close, alert         │
  │ + TẤT CẢ methods từ mixins!  │
  └───────────────────────────────┘

  CÙNG MIXINS cũng được trộn vào:
  → Worker (Web Workers!)
  → ServiceWorkerGlobalScope!
  → → CHIA SẺ setTimeout, fetch... giữa contexts!
```

---

## §8. React Mixins → HOC → Hooks

```javascript
// ═══ REACT MIXINS (PRE-ES6!) — DEPRECATED! ═══

// createClass cho phép mixins:
var LoggerMixin = {
  componentDidMount: function () {
    console.log("Component mounted:", this.constructor.displayName);
  },
  componentWillUnmount: function () {
    console.log("Component unmounting:", this.constructor.displayName);
  },
  log: function (msg) {
    console.log("[" + this.constructor.displayName + "]", msg);
  },
};

var MyComponent = React.createClass({
  mixins: [LoggerMixin], // ← MIXIN!

  render: function () {
    this.log("Rendering!");
    return React.createElement("div", null, "Hello");
  },
});

// ❌ PROBLEMS:
// → Implicit dependencies!
// → Name clashing giữa mixins!
// → Snowballing complexity!
// → React team KHUYẾN CÁO KHÔNG DÙNG!
```

```javascript
// ═══ EVOLUTION: MIXINS → HOC → HOOKS ═══

// ② HOC (Higher-Order Components):
function withLogger(WrappedComponent) {
  return class extends React.Component {
    componentDidMount() {
      console.log(`${WrappedComponent.name} mounted!`);
    }

    log(msg) {
      console.log(`[${WrappedComponent.name}]`, msg);
    }

    render() {
      return <WrappedComponent {...this.props} log={this.log} />;
    }
  };
}

function withAuth(WrappedComponent) {
  return class extends React.Component {
    state = { user: null, loading: true };

    componentDidMount() {
      // Check auth:
      this.setState({ user: getUser(), loading: false });
    }

    render() {
      if (this.state.loading) return <Loading />;
      if (!this.state.user) return <Redirect to="/login" />;
      return <WrappedComponent {...this.props} user={this.state.user} />;
    }
  };
}

// Compose HOCs:
const EnhancedDashboard = withAuth(withLogger(Dashboard));
// → withAuth(withLogger(Dashboard)) = wrapper hell!
```

```javascript
// ═══ ③ HOOKS — GIẢI PHÁP HIỆN TẠI! ═══

// Hooks = "functional mixins" cho React components!
// KHÔNG có problems của Mixins và HOCs!

function useLogger(componentName) {
  useEffect(() => {
    console.log(`${componentName} mounted!`);
    return () => console.log(`${componentName} unmounting!`);
  }, []);

  const log = useCallback(
    (msg) => {
      console.log(`[${componentName}]`, msg);
    },
    [componentName],
  );

  return { log };
}

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, isAuthenticated: !!user };
}

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  const setValue = (value) => {
    setStoredValue(value);
    localStorage.setItem(key, JSON.stringify(value));
  };

  return [storedValue, setValue];
}

// SỬ DỤNG — SẠCH VÀ RÕ RÀNG:
function Dashboard() {
  const { log } = useLogger("Dashboard");
  const { user, loading } = useAuth();
  const [theme, setTheme] = useLocalStorage("theme", "dark");

  if (loading) return <Loading />;

  log("Rendering dashboard!");

  return <div>Welcome, {user.name}!</div>;
}
```

```
REACT: MIXINS → HOC → HOOKS:
═══════════════════════════════════════════════════════════════

  ┌──────────┬──────────────────────────────────────────┐
  │ Mixins   │ ❌ Implicit deps, name clashing, complex │
  │ (2013)   │ ❌ DEPRECATED! Chỉ createClass!         │
  ├──────────┼──────────────────────────────────────────┤
  │ HOC      │ ⚠️ Wrapper hell, prop drilling, messy    │
  │ (2015)   │ ⚠️ Vẫn dùng nhưng ít phổ biến hơn      │
  ├──────────┼──────────────────────────────────────────┤
  │ Hooks    │ ✅ Clear dependencies, composable!       │
  │ (2019)   │ ✅ No wrapper, no name clashing!        │
  │          │ ✅ RECOMMENDED! Cách hiện tại!          │
  └──────────┴──────────────────────────────────────────┘

  Hook = FUNCTIONAL MIXIN cho React!
  → useLogger, useAuth, useLocalStorage!
  → MỖI hook = 1 tính năng THÊM vào component!
  → Compose bằng cách GỌI nhiều hooks!
  → KHÔNG implicit, KHÔNG name clash!
```

---

## §9. Diamond Problem & Collision

```javascript
// ═══ NAME COLLISION — MIXIN OVERWRITE NHAU! ═══

const MixinA = {
  greet() {
    console.log("Hello from A!");
  },
  shared() {
    console.log("Shared from A!");
  },
};

const MixinB = {
  greet() {
    console.log("Hello from B!");
  }, // ← TRÙNG TÊN!
  shared() {
    console.log("Shared from B!");
  }, // ← TRÙNG TÊN!
};

class MyClass {
  constructor() {}
}

Object.assign(MyClass.prototype, MixinA, MixinB);

const obj = new MyClass();
obj.greet(); // "Hello from B!" ← MixinB OVERWRITE MixinA!
obj.shared(); // "Shared from B!" ← MixinB THẮNG!

// → Object.assign → source SAU OVERWRITE source TRƯỚC!
// → KHÔNG CÓ WARNING!
// → SILENT OVERWRITE → BUG KHÓ TÌM!
```

```
DIAMOND PROBLEM:
═══════════════════════════════════════════════════════════════

  "Diamond Problem" trong multiple inheritance:

       ┌────────┐
       │  Base   │
       │ greet() │
       └───┬────┘
      ┌────┴───┐
  ┌───┴──┐ ┌──┴───┐
  │MixinA│ │MixinB│
  │greet()│ │greet()│
  └───┬──┘ └──┬───┘
      └────┬───┘
       ┌───┴──┐
       │ Child │
       │greet()?│ ← GỌI CÁI NÀO?
       └──────┘

  JavaScript Object.assign:
  → LUÔN lấy cái CUỐI CÙNG! (last wins!)
  → KHÔNG CÓ diamond problem thực sự!
  → NHƯNG có vấn đề SILENT OVERWRITE!
```

```javascript
// ═══ FIX: SAFE MIXIN — KIỂM TRA COLLISION! ═══

function safeMixin(target, ...sources) {
  for (const source of sources) {
    for (const key of Object.keys(source)) {
      if (key in target) {
        console.warn(`⚠️ Mixin collision: "${key}" already exists on target!`);
      }
    }
    Object.assign(target, source);
  }
  return target;
}

// Hoặc: KHÔNG overwrite nếu đã có!
function softMixin(target, ...sources) {
  for (const source of sources) {
    for (const key of Object.keys(source)) {
      if (!(key in target)) {
        target[key] = source[key];
      }
    }
  }
  return target;
}

// Hoặc: NAMESPACE mixins!
function namespacedMixin(target, namespace, source) {
  target[namespace] = {};
  for (const key of Object.keys(source)) {
    target[namespace][key] = source[key];
  }
  return target;
}

// SỬ DỤNG:
namespacedMixin(MyClass.prototype, "logger", LoggerMixin);
namespacedMixin(MyClass.prototype, "validator", ValidatorMixin);
// obj.logger.log("Hello!");
// obj.validator.validate(data);
```

---

## §10. Prototype Pollution

```javascript
// ═══ PROTOTYPE POLLUTION — NGUY HIỂM! ═══

// Modify prototype = ẢNH HƯỞNG TẤT CẢ instances!

// ❌ NGUY HIỂM:
Object.prototype.hack = function () {
  console.log("I'm everywhere!");
};

const obj = {};
obj.hack(); // "I'm everywhere!" ← MỌI object bị ảnh hưởng!

const arr = [];
arr.hack(); // "I'm everywhere!" ← Cả array!

// → Sửa Object.prototype = SỬA MỌI THỨ!
// → NEVER modify built-in prototypes!
```

```javascript
// ═══ MIXIN POLLUTION — PHÒNG TRÁNH ═══

// ❌ BAD: Modify prototype TRỰC TIẾP (global!):
Array.prototype.last = function () {
  return this[this.length - 1];
};
// → MỌI array đều có .last()!
// → Conflict với library khác!

// ✅ GOOD: Chỉ mixin vào CLASS CỤ THỂ:
Object.assign(Dog.prototype, dogFunctionality);
// → Chỉ Dog có bark, wagTail!
// → Không ảnh hưởng class khác!

// ✅ GOOD: Dùng Symbol để tránh collision:
const bark = Symbol("bark");
const wagTail = Symbol("wagTail");

const dogFunctionality = {
  [bark]() {
    console.log("Woof!");
  },
  [wagTail]() {
    console.log("Wagging!");
  },
};

Object.assign(Dog.prototype, dogFunctionality);

const pet = new Dog("Daisy");
pet[bark](); // "Woof!" ← Symbol = UNIQUE, không collision!
pet[wagTail](); // "Wagging!"
```

```
PHÒNG TRÁNH PROTOTYPE POLLUTION:
═══════════════════════════════════════════════════════════════

  ① KHÔNG modify built-in prototypes!
     → Object, Array, String, Function prototypes!
     → LEAVE THEM ALONE!

  ② Object.freeze() sau khi mixin:
     Object.assign(Dog.prototype, mixin);
     Object.freeze(Dog.prototype); // KHÔNG thêm được nữa!

  ③ Dùng Symbol cho method names:
     → const myMethod = Symbol('myMethod');
     → UNIQUE, không collision!

  ④ Dùng WeakMap cho private data:
     → KHÔNG modify prototype!
     → Data gắn với instance!

  ⑤ Prefer composition OVER prototype modification:
     → Class Mixin Factory (extends chain!)
     → Functional Mixin (inject vào instance!)
```

---

## §11. Real-World Applications

```javascript
// ═══ SERIALIZABLE MIXIN ═══

const Serializable = {
  serialize() {
    return JSON.stringify(this, (key, value) => {
      // Skip functions:
      if (typeof value === "function") return undefined;
      return value;
    });
  },

  toJSON() {
    // Custom JSON representation:
    const obj = {};
    for (const key of Object.keys(this)) {
      if (typeof this[key] !== "function") {
        obj[key] = this[key];
      }
    }
    return obj;
  },
};

class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
    this.password = "secret"; // ← SẼ BỊ serialize!
  }
}

Object.assign(User.prototype, Serializable);

const user = new User("John", "john@example.com");
console.log(user.serialize());
// '{"name":"John","email":"john@example.com","password":"secret"}'
```

```javascript
// ═══ EVENT EMITTER MIXIN ═══

const EventEmitterMixin = {
  _initEvents() {
    if (!this._events) this._events = {};
  },

  on(event, fn) {
    this._initEvents();
    (this._events[event] = this._events[event] || []).push(fn);
    return this;
  },

  off(event, fn) {
    this._initEvents();
    if (fn) {
      this._events[event] = (this._events[event] || []).filter((f) => f !== fn);
    } else {
      delete this._events[event];
    }
    return this;
  },

  emit(event, ...args) {
    this._initEvents();
    (this._events[event] || []).forEach((fn) => fn.apply(this, args));
    return this;
  },

  once(event, fn) {
    const wrapper = (...args) => {
      fn.apply(this, args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  },
};

// SỬ DỤNG:
class UserStore {
  constructor() {
    this.users = [];
  }

  addUser(user) {
    this.users.push(user);
    this.emit("user:added", user); // ← Từ mixin!
  }

  removeUser(id) {
    const user = this.users.find((u) => u.id === id);
    this.users = this.users.filter((u) => u.id !== id);
    this.emit("user:removed", user); // ← Từ mixin!
  }
}

Object.assign(UserStore.prototype, EventEmitterMixin);

const store = new UserStore();
store.on("user:added", (user) => console.log("Added:", user.name));
store.on("user:removed", (user) => console.log("Removed:", user.name));

store.addUser({ id: 1, name: "John" }); // → "Added: John"
store.removeUser(1); // → "Removed: John"
```

```javascript
// ═══ COMPARABLE + PRINTABLE MIXINS ═══

const Comparable = {
  compareTo(other) {
    if (this.valueOf() < other.valueOf()) return -1;
    if (this.valueOf() > other.valueOf()) return 1;
    return 0;
  },

  greaterThan(other) {
    return this.compareTo(other) > 0;
  },

  lessThan(other) {
    return this.compareTo(other) < 0;
  },

  equals(other) {
    return this.compareTo(other) === 0;
  },
};

const Printable = {
  toString() {
    const entries = Object.entries(this)
      .filter(([_, v]) => typeof v !== "function")
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    return `${this.constructor.name}(${entries})`;
  },

  inspect() {
    console.log(this.toString());
  },
};

class Product {
  constructor(name, price) {
    this.name = name;
    this.price = price;
  }

  valueOf() {
    return this.price;
  }
}

Object.assign(Product.prototype, Comparable, Printable);

const p1 = new Product("Phone", 999);
const p2 = new Product("Laptop", 1499);

p1.greaterThan(p2); // false
p1.lessThan(p2); // true
p1.inspect(); // "Product(name: Phone, price: 999)"

// Sort hoạt động nhờ Comparable:
const products = [p2, p1];
products.sort((a, b) => a.compareTo(b));
// → [Phone(999), Laptop(1499)]
```

---

## §12. Tradeoffs — Ưu & Nhược điểm

```
ƯU ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ "MULTIPLE INHERITANCE" trong JS:
  → JavaScript chỉ single inheritance!
  → Mixin = workaround cho multi-inherit!
  → Thêm chức năng từ NHIỀU nguồn!

  ✅ REUSABLE:
  → 1 mixin dùng cho NHIỀU classes!
  → Swimmable → Duck, Penguin, Fish, Whale!
  → DRY — Don't Repeat Yourself!

  ✅ FLEXIBLE:
  → Chọn ĐÚNG mixins cần thiết!
  → Không bị ràng buộc hierarchy!
  → Composition over Inheritance!

  ✅ SIMPLE (Object Mixin):
  → Object.assign() = 1 dòng code!
  → Không cần class hierarchy phức tạp!
```

```
NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ❌ PROTOTYPE POLLUTION:
  → Modify prototype = ảnh hưởng TẤT CẢ instances!
  → Built-in prototype modification = NGUY HIỂM!

  ❌ NAME COLLISION:
  → 2 mixins có CÙNG TÊN method!
  → Last wins, SILENT overwrite!
  → BUG khó tìm!

  ❌ IMPLICIT DEPENDENCIES:
  → Mixin method dùng this.something!
  → Nhưng something ĐẾN TỪ ĐÂU? 🤔
  → Khó trace nguồn gốc methods!

  ❌ COMPLEXITY:
  → Nhiều mixins → "đến từ đâu?" confusion!
  → Debugging khó khăn!
  → Tương tự React Mixins problem!

  ❌ FRAGILE:
  → Thay đổi mixin → ẢNH HƯỞNG tất cả classes dùng nó!
  → Không có TypeScript type safety tốt!
```

```
KHI NÀO DÙNG:
═══════════════════════════════════════════════════════════════

  ✅ NÊN DÙNG:
  → Shared behavior giữa UNRELATED classes!
  → Utility methods: Serializable, Comparable, EventEmitter!
  → Cross-cutting concerns: logging, caching, validation!
  → Browser API style (WindowOrWorkerGlobalScope!)

  ❌ KHÔNG NÊN DÙNG:
  → Khi INHERITANCE đủ tốt → extends!
  → Khi COMPOSITION đủ tốt → inject dependencies!
  → Khi logic PHỨC TẠP → dùng Strategy/Decorator pattern!
  → React → dùng HOOKS thay vì mixins!

  ALTERNATIVES:
  → Composition: inject objects thay vì modify prototype!
  → Decorator Pattern: wrap behavior!
  → Strategy Pattern: swappable algorithms!
  → React Hooks: functional mixins cho components!
```

---

## §13. Tóm tắt

```
MIXIN PATTERN — TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Mixin Pattern là gì?"
  A: Object chứa functionality để TRỘN vào class/object
  KHÔNG qua inheritance! Object.assign(Target.prototype, mixin)!
  Giải quyết single inheritance limitation của JS!

  Q: "Object.assign nhược điểm?"
  A: Shallow copy! Name collision (last wins, silent overwrite!)
  Modify prototype = ảnh hưởng tất cả instances!

  Q: "Class Mixin vs Object Mixin?"
  A: Object Mixin: Object.assign, simple, no instanceof!
  Class Mixin: factory fn(Base) → class extends Base,
  real inheritance chain, instanceof HOẠT ĐỘNG!

  Q: "Functional Mixin?"
  A: Function nhận target → thêm methods → return target!
  Có PRIVATE STATE qua closure! Parameterized!
  withLogging(withAuth(obj)) = composable!

  Q: "React Mixins → Hooks?"
  A: Mixins (createClass) → implicit deps + name clash → DEPRECATED!
  HOC → wrapper hell → ít phổ biến!
  Hooks → functional mixins cho React → RECOMMENDED!

  Q: "Prototype Pollution?"
  A: Modify prototype = ảnh hưởng TẤT CẢ!
  KHÔNG sửa built-in prototypes!
  Dùng Symbol, Object.freeze, composition thay thế!

  Q: "Window Mixins?"
  A: Window trộn từ WindowOrWorkerGlobalScope +
  WindowEventHandlers! setTimeout, fetch, indexedDB = từ mixin!
  Mixin KHÔNG tạo instance được!
```

---

### Checklist

- [ ] **Mixin concept**: object THÊM functionality; KHÔNG inheritance; Object.assign vào prototype!
- [ ] **Object.assign**: copy OWN enumerable props; shallow; last wins collision!
- [ ] **Mixin inheritance**: \_\_proto\_\_ chain giữa mixins; super.method() gọi parent mixin!
- [ ] **Functional Mixin**: fn(target) → add methods → return; PRIVATE state qua closure!
- [ ] **Class Mixin Factory**: fn(Base) → class extends Base; real prototype chain; instanceof works!
- [ ] **applyMixins helper**: mixins.reduce((acc, m) => m(acc), Base); pipe composition!
- [ ] **Composition**: Duck = Swimmable + Flyable + Walkable; chọn ĐÚNG cái CẦN!
- [ ] **Window Mixins**: WindowOrWorkerGlobalScope, WindowEventHandlers; setTimeout/fetch = mixin!
- [ ] **React evolution**: Mixins → HOC → Hooks; Hooks = functional mixins cho React!
- [ ] **Diamond Problem**: name collision → last wins; fix: safeMixin warning, namespace, Symbol!
- [ ] **Prototype Pollution**: KHÔNG modify built-in prototypes; Object.freeze; Symbol keys!
- [ ] **Tradeoffs**: Ưu (multi-inherit workaround, reusable, flexible) vs Nhược (pollution, collision, implicit deps)!

---

_Nguồn: patterns.dev — Mixin Pattern, MDN Web Docs (Object.assign, Mixins), Eric Elliott — Functional Mixins_
_Cập nhật lần cuối: Tháng 2, 2026_
