# Factory Pattern — Deep Dive

> 📅 2026-02-15 · ⏱ 22 phút đọc
>
> Factory Function Concept,
> Object Literal & Arrow Functions,
> Destructuring & Default Parameters,
> Factory vs Constructor vs Class,
> Abstract Factory, Factory Method,
> Functional Mixins with Factory,
> Type Inference & Self-Documenting,
> Composition over Inheritance,
> Real-World Applications & Tradeoffs
> Độ khó: ⭐️⭐️⭐️⭐️ | Design Pattern

---

## Mục Lục

| #   | Phần                               |
| --- | ---------------------------------- |
| 1   | Factory Pattern là gì?             |
| 2   | Factory Function cơ bản            |
| 3   | Arrow Function & Implicit Return   |
| 4   | Destructuring & Default Parameters |
| 5   | Computed Property Keys             |
| 6   | Factory vs Constructor vs Class    |
| 7   | Factory Method Pattern             |
| 8   | Abstract Factory Pattern           |
| 9   | Factory + Functional Mixins        |
| 10  | Type Inference — Self-Documenting  |
| 11  | Configurable Factory               |
| 12  | Real-World Applications            |
| 13  | Tradeoffs — Ưu & Nhược điểm        |
| 14  | Tóm tắt                            |

---

## §1. Factory Pattern là gì?

```
FACTORY PATTERN — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Factory Function = function TRẢ VỀ object MỚI!
  → KHÔNG dùng keyword "new"!
  → KHÔNG dùng class constructor!
  → Chỉ đơn giản: gọi function → nhận object!

  VÍ DỤ THỰC TẾ: NHÀ MÁY SẢN XUẤT!
  → Nhà máy (Factory!) nhận đơn hàng (params!)
  → Sản xuất sản phẩm (object!) theo spec!
  → Trả về thành phẩm (return object!)
  → Bạn KHÔNG CẦN BIẾT bên trong làm gì!
  → Bạn chỉ cần KẾT QUẢ!

  TẠI SAO DÙNG FACTORY?
  ┌──────────────────────────────────────────────────────────┐
  │ ① Tạo NHIỀU objects tương tự → factory stamp ra!        │
  │ ② Ẩn logic phức tạp → clean API!                       │
  │ ③ Return DIFFERENT objects → dựa trên config!           │
  │ ④ Avoid "new" keyword → functional style!              │
  │ ⑤ Composition OVER inheritance!                         │
  └──────────────────────────────────────────────────────────┘
```

```
"SOMETIMES THE ELEGANT IMPLEMENTATION IS JUST A FUNCTION.
 NOT A METHOD. NOT A CLASS. NOT A FRAMEWORK.
 JUST A FUNCTION."
                                        — John Carmack
```

---

## §2. Factory Function cơ bản

```javascript
// ═══ FACTORY FUNCTION — CƠ BẢN ═══

const createUser = ({ firstName, lastName, email }) => ({
  firstName,
  lastName,
  email,
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  },
});

// TẠO users:
const user1 = createUser({
  firstName: "John",
  lastName: "Doe",
  email: "john@doe.com",
});

const user2 = createUser({
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@doe.com",
});

console.log(user1.fullName()); // "John Doe"
console.log(user2.fullName()); // "Jane Doe"

// → KHÔNG có "new"!
// → KHÔNG có "class"!
// → Chỉ gọi function → nhận object!
```

```
TẠI SAO factory function?
═══════════════════════════════════════════════════════════════

  const user = createUser({...})

  → Đọc code: "tạo user" → RÕ RÀNG!
  → Không cần biết constructor, prototype!
  → Không cần "new" → KHÔNG BỊ LỖI nếu quên!
  → Return BẰNG object literal → nhẹ, nhanh!
  → Mỗi lần gọi → object MỚI hoàn toàn!
```

```javascript
// ═══ SO SÁNH: CÓ "new" vs KHÔNG "new" ═══

// ❌ Constructor — PHẢI dùng "new":
function User(name) {
  this.name = name;
}
const u1 = new User("John"); // ✅ OK!
const u2 = User("John"); // ❌ BUG! this = global/undefined!

// ✅ Factory — KHÔNG CẦN "new":
function createUser(name) {
  return { name };
}
const u3 = createUser("John"); // ✅ Luôn OK!
// → KHÔNG THỂ sai cách gọi!
```

---

## §3. Arrow Function & Implicit Return

```javascript
// ═══ ARROW FUNCTION — IMPLICIT RETURN ═══

// Arrow function: () => expression → AUTO return!

// ✅ ĐÚNG — wrap object trong ():
const createUser = (name) => ({ name, role: 'user' });

console.log(createUser("John")); // { name: "John", role: "user" }

// ❌ SAI — braces = function body, KHÔNG PHẢI object!
const broken = (name) => { name, role: 'user' };
console.log(broken("John")); // undefined! ← BUG!

// → { } trong arrow function = FUNCTION BODY!
// → JS nghĩ "name" là LABEL, "role:" là LABEL!
// → KHÔNG có return → return undefined!

// ✅ FIX: WRAP TRONG () → implicit return object!
const fixed = (name) => ({ name, role: 'user' });
```

```
ARROW FUNCTION — KHI NÀO CẦN ():
═══════════════════════════════════════════════════════════════

  ① Return giá trị đơn giản: KHÔNG CẦN ()
     const double = n => n * 2;
     const greet = name => `Hello ${name}`;

  ② Return OBJECT literal: CẦN ()!
     const make = () => ({ foo: 'bar' });  ← () BẮT BUỘC!

  ③ Multi-line: dùng { } + explicit return:
     const make = () => {
         const now = Date.now();
         return { foo: 'bar', time: now };
     };
```

---

## §4. Destructuring & Default Parameters

```javascript
// ═══ DESTRUCTURING TRONG FACTORY ═══

// Factory nhận 1 OBJECT → destructure params!
const createUser = ({ firstName, lastName, email }) => ({
  firstName,
  lastName,
  email,
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  },
});

// → { firstName, lastName, email } = DESTRUCTURING!
// → Nhận 1 object argument → tách ra 3 variables!
// → Shorthand property: { firstName } = { firstName: firstName }!
```

```javascript
// ═══ DEFAULT PARAMETERS — SELF-DOCUMENTING! ═══

const createUser = ({
  userName = "Anonymous",
  avatar = "anon.png",
  role = "user",
  isActive = true,
} = {}) => ({
  userName,
  avatar,
  role,
  isActive,
  createdAt: new Date(),
});

// ① Truyền đầy đủ:
createUser({ userName: "echo", avatar: "echo.png" });
// → { userName: 'echo', avatar: 'echo.png', role: 'user', isActive: true }

// ② Truyền một phần → defaults cho phần còn lại:
createUser({ userName: "echo" });
// → { userName: 'echo', avatar: 'anon.png', role: 'user', isActive: true }

// ③ Không truyền gì → TẤT CẢ defaults:
createUser();
// → { userName: 'Anonymous', avatar: 'anon.png', role: 'user', isActive: true }
```

```
= {} LÀ GÌ?
═══════════════════════════════════════════════════════════════

  const createUser = ({
      userName = 'Anonymous',
      avatar = 'anon.png',
  } = {}) => ({...});
       ↑
       └── = {} ← DEFAULT cho TOÀN BỘ parameter!

  KHÔNG CÓ = {}:
  → createUser()     → ❌ TypeError: Cannot destructure undefined!
  → createUser({})   → ✅ OK!

  CÓ = {}:
  → createUser()     → ✅ OK! Dùng {} làm default!
  → createUser({})   → ✅ OK!
  → createUser(undefined) → ✅ OK!

  → = {} = SAFETY NET!
  → Đảm bảo LUÔN có object để destructure!
```

```javascript
// ═══ ARRAY DESTRUCTURING TRONG FACTORY ═══

// Factory từ array:
const createObjectFromArray = ([key, value]) => ({
  [key]: value,
});

createObjectFromArray(["name", "John"]);
// → { name: "John" }

createObjectFromArray(["age", 30]);
// → { age: 30 }

// Swap: destructure + restructure!
const swap = ([first, second]) => [second, first];
console.log(swap([1, 2])); // [2, 1]

// Rest/Spread:
const rotate = ([first, ...rest]) => [...rest, first];
console.log(rotate([1, 2, 3])); // [2, 3, 1]
```

---

## §5. Computed Property Keys

```javascript
// ═══ COMPUTED PROPERTY KEYS ═══

// Dùng [] để TÍNH TÊN property dynamically!

const key = "avatar";
const user = { [key]: "echo.png" };
console.log(user.avatar); // "echo.png"
// → [key] = tên property được TÍNH từ biến!

// ═══ FACTORY VỚI COMPUTED KEYS ═══

const arrToObj = ([key, value]) => ({ [key]: value });

arrToObj(["foo", "bar"]); // { foo: "bar" }
arrToObj(["name", "John"]); // { name: "John" }

// ═══ DYNAMIC CONFIG FACTORY ═══

const createConfig = (entries) =>
  entries.reduce(
    (config, [key, value]) => ({
      ...config,
      [key]: value,
    }),
    {},
  );

createConfig([
  ["host", "localhost"],
  ["port", 3000],
  ["debug", true],
]);
// → { host: "localhost", port: 3000, debug: true }
```

```javascript
// ═══ PREFIX FACTORY — COMPUTED KEYS ═══

const createActions = (prefix, actionNames) =>
  actionNames.reduce(
    (actions, name) => ({
      ...actions,
      [`${prefix}_${name.toUpperCase()}`]: `${prefix}/${name}`,
    }),
    {},
  );

createActions("user", ["fetch", "create", "update", "delete"]);
// → {
//     USER_FETCH: "user/fetch",
//     USER_CREATE: "user/create",
//     USER_UPDATE: "user/update",
//     USER_DELETE: "user/delete",
// }

// → Redux action types = Factory + Computed Keys!
```

---

## §6. Factory vs Constructor vs Class

```javascript
// ═══ 3 CÁCH TẠO OBJECTS ═══

// ① FACTORY FUNCTION:
const createUser = (name, email) => ({
  name,
  email,
  greet() {
    return `Hi, I'm ${this.name}`;
  },
});

// ② CONSTRUCTOR FUNCTION:
function User(name, email) {
  this.name = name;
  this.email = email;
}
User.prototype.greet = function () {
  return `Hi, I'm ${this.name}`;
};

// ③ CLASS:
class UserClass {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
  greet() {
    return `Hi, I'm ${this.name}`;
  }
}

// SỬ DỤNG:
const u1 = createUser("John", "j@x.com"); // ← Không "new"!
const u2 = new User("John", "j@x.com"); // ← Cần "new"!
const u3 = new UserClass("John", "j@x.com"); // ← Cần "new"!
```

```
SO SÁNH CHI TIẾT:
═══════════════════════════════════════════════════════════════

  ┌───────────────────┬──────────────┬───────────────┬─────────────┐
  │                   │ Factory      │ Constructor   │ Class       │
  ├───────────────────┼──────────────┼───────────────┼─────────────┤
  │ Keyword           │ function     │ function+new  │ class+new   │
  │ Return            │ Object literal│ this (auto)  │ this (auto) │
  │ "new" required?   │ ❌ KHÔNG    │ ✅ PHẢI      │ ✅ PHẢI    │
  │ Quên "new"?       │ Vẫn OK!     │ ❌ BUG!     │ ❌ Error!  │
  │ this binding      │ Object literal│ Instance    │ Instance    │
  │ prototype sharing │ ❌ Mỗi obj  │ ✅ Shared   │ ✅ Shared  │
  │ instanceof        │ ❌ Không    │ ✅ Hoạt động│ ✅ Hoạt động│
  │ Encapsulation     │ ✅ Closure  │ ⚠️ Weak     │ ⚠️ Weak    │
  │ Composition       │ ✅ Dễ      │ ⚠️ Khó      │ ⚠️ Khó     │
  │ Memory            │ ⚠️ Mỗi obj │ ✅ Prototype │ ✅ Prototype│
  │                   │ copy methods │ share methods │ share methods│
  └───────────────────┴──────────────┴───────────────┴─────────────┘
```

```javascript
// ═══ MEMORY DIFFERENCE — QUAN TRỌNG! ═══

// FACTORY: mỗi object CÓ BẢN COPY riêng!
const createDog = (name) => ({
  name,
  bark() {
    console.log("Woof!");
  }, // ← MỖI dog = 1 function!
});

const d1 = createDog("Rex");
const d2 = createDog("Buddy");
console.log(d1.bark === d2.bark); // false! ← KHÁC function!
// → 1000 dogs = 1000 bark functions! LÃNG PHÍ memory!

// CLASS: methods trên PROTOTYPE = SHARED!
class Dog {
  constructor(name) {
    this.name = name;
  }
  bark() {
    console.log("Woof!");
  } // ← TRÊN prototype!
}

const d3 = new Dog("Rex");
const d4 = new Dog("Buddy");
console.log(d3.bark === d4.bark); // true! ← CÙNG function!
// → 1000 dogs = 1 bark function! TIẾT KIỆM!
```

```
KHI NÀO DÙNG CÁI NÀO:
═══════════════════════════════════════════════════════════════

  FACTORY:
  → Objects ĐƠN GIẢN, ít methods!
  → Cần PRIVATE state (closure!)
  → Cần COMPOSITION (functional mixins!)
  → Cần return DIFFERENT types!
  → Config objects, DTOs, test fixtures!

  CLASS:
  → Objects PHỨC TẠP, nhiều methods!
  → Cần INHERITANCE hierarchy!
  → Cần instanceof check!
  → Memory-sensitive ứng dụng (shared methods!)
  → Domain models, services!

  CONSTRUCTOR:
  → Legacy code, pre-ES6!
  → Hầu hết đã được thay bằng class!
```

---

## §7. Factory Method Pattern

```javascript
// ═══ FACTORY METHOD — SUBCLASS QUYẾT ĐỊNH ═══

// Factory Method: BASE class định nghĩa interface
// SUBCLASS quyết định TẠO object NÀO!

class Dialog {
  // FACTORY METHOD — subclass override!
  createButton() {
    throw new Error("Subclass phải implement createButton()!");
  }

  render() {
    // GỌI factory method:
    const button = this.createButton();
    button.render();
    button.onClick(() => console.log("Button clicked!"));
  }
}

class WindowsDialog extends Dialog {
  createButton() {
    return new WindowsButton(); // ← Tạo Windows button!
  }
}

class WebDialog extends Dialog {
  createButton() {
    return new HTMLButton(); // ← Tạo HTML button!
  }
}

class WindowsButton {
  render() {
    console.log("[Windows Button]");
  }
  onClick(fn) {
    fn();
  }
}

class HTMLButton {
  render() {
    console.log("<button>Click me</button>");
  }
  onClick(fn) {
    fn();
  }
}

// Client code KHÔNG CẦN biết button cụ thể:
function createDialog(platform) {
  if (platform === "windows") return new WindowsDialog();
  return new WebDialog();
}

const dialog = createDialog("web");
dialog.render(); // → <button>Click me</button>
```

```javascript
// ═══ FACTORY METHOD — FUNCTIONAL STYLE ═══

// Trong JS, thường dùng FUNCTION thay vì class:

const createNotification = (type, message) => {
  const factories = {
    success: (msg) => ({
      type: "success",
      icon: "✅",
      color: "green",
      message: msg,
      render() {
        console.log(`${this.icon} [SUCCESS] ${this.message}`);
      },
    }),
    error: (msg) => ({
      type: "error",
      icon: "❌",
      color: "red",
      message: msg,
      render() {
        console.log(`${this.icon} [ERROR] ${this.message}`);
      },
    }),
    warning: (msg) => ({
      type: "warning",
      icon: "⚠️",
      color: "yellow",
      message: msg,
      render() {
        console.log(`${this.icon} [WARNING] ${this.message}`);
      },
    }),
    info: (msg) => ({
      type: "info",
      icon: "ℹ️",
      color: "blue",
      message: msg,
      render() {
        console.log(`${this.icon} [INFO] ${this.message}`);
      },
    }),
  };

  const factory = factories[type];
  if (!factory) throw new Error(`Unknown notification type: ${type}`);
  return factory(message);
};

// SỬ DỤNG:
createNotification("success", "Saved!").render();
// → ✅ [SUCCESS] Saved!

createNotification("error", "Failed!").render();
// → ❌ [ERROR] Failed!

// → Client gọi 1 function → nhận ĐÚNG loại object!
// → KHÔNG cần biết logic bên trong!
```

---

## §8. Abstract Factory Pattern

```javascript
// ═══ ABSTRACT FACTORY — FAMILY OF OBJECTS ═══

// Abstract Factory: tạo NHÓM objects LIÊN QUAN!
// Mỗi factory tạo một "family" sản phẩm!

const createLightTheme = () => ({
  createButton: (text) => ({
    text,
    bgColor: "#ffffff",
    textColor: "#333333",
    border: "1px solid #ccc",
    render() {
      console.log(`[Light Button: "${this.text}"]`);
    },
  }),

  createInput: (placeholder) => ({
    placeholder,
    bgColor: "#ffffff",
    textColor: "#333333",
    border: "1px solid #ddd",
    render() {
      console.log(`[Light Input: "${this.placeholder}"]`);
    },
  }),

  createCard: (title, content) => ({
    title,
    content,
    bgColor: "#ffffff",
    shadow: "0 2px 4px rgba(0,0,0,0.1)",
    render() {
      console.log(`[Light Card: "${this.title}"]`);
    },
  }),
});

const createDarkTheme = () => ({
  createButton: (text) => ({
    text,
    bgColor: "#1a1a2e",
    textColor: "#eaeaea",
    border: "1px solid #333",
    render() {
      console.log(`[Dark Button: "${this.text}"]`);
    },
  }),

  createInput: (placeholder) => ({
    placeholder,
    bgColor: "#16213e",
    textColor: "#eaeaea",
    border: "1px solid #444",
    render() {
      console.log(`[Dark Input: "${this.placeholder}"]`);
    },
  }),

  createCard: (title, content) => ({
    title,
    content,
    bgColor: "#0f3460",
    shadow: "0 2px 4px rgba(0,0,0,0.4)",
    render() {
      console.log(`[Dark Card: "${this.title}"]`);
    },
  }),
});

// ═══ CLIENT CODE — KHÔNG BIẾT theme cụ thể! ═══

function buildUI(themeFactory) {
  const button = themeFactory.createButton("Submit");
  const input = themeFactory.createInput("Enter name...");
  const card = themeFactory.createCard("Welcome", "Hello!");

  button.render();
  input.render();
  card.render();
}

// Switch theme = switch TOÀN BỘ family:
const theme = isDarkMode ? createDarkTheme() : createLightTheme();
buildUI(theme);
// → Tất cả components CONSISTENT cùng 1 theme!
```

```
FACTORY vs FACTORY METHOD vs ABSTRACT FACTORY:
═══════════════════════════════════════════════════════════════

  ┌───────────────────┬────────────────────────────────────┐
  │ Factory Function  │ Function trả về 1 object!          │
  │ (Simple Factory!) │ createUser(), createConfig()       │
  │                   │ → 1 sản phẩm!                     │
  ├───────────────────┼────────────────────────────────────┤
  │ Factory Method    │ Subclass/variant QUYẾT ĐỊNH         │
  │                   │ tạo SẢN PHẨM NÀO!                 │
  │                   │ createButton() → WindowsBtn/HtmlBtn│
  │                   │ → 1 sản phẩm, NHIỀU variants!     │
  ├───────────────────┼────────────────────────────────────┤
  │ Abstract Factory  │ Tạo NHÓM sản phẩm LIÊN QUAN!      │
  │                   │ DarkTheme → DarkBtn + DarkInput    │
  │                   │ LightTheme → LightBtn + LightInput │
  │                   │ → NHIỀU sản phẩm, CONSISTENT!     │
  └───────────────────┴────────────────────────────────────┘
```

---

## §9. Factory + Functional Mixins

```javascript
// ═══ FACTORY + FUNCTIONAL MIXINS = COMPOSITION! ═══

// pipe: compose functions trái → phải!
const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((y, f) => f(y), x);

// ① Mixin — thêm khả năng BAY:
const withFlying = (o) => {
  let isFlying = false;
  return {
    ...o,
    fly() {
      isFlying = true;
      return this;
    },
    land() {
      isFlying = false;
      return this;
    },
    isFlying: () => isFlying,
  };
};

// ② Mixin — thêm BATTERY:
const withBattery =
  ({ capacity }) =>
  (o) => {
    let percentCharged = 100;
    return {
      ...o,
      draw(percent) {
        const remaining = percentCharged - percent;
        percentCharged = remaining > 0 ? remaining : 0;
        return this;
      },
      getCharge: () => percentCharged,
      getCapacity: () => capacity,
    };
  };

// ③ Mixin — thêm constructor reference:
const withConstructor = (constructor) => (o) => ({
  __proto__: { constructor },
  ...o,
});

// ═══ FACTORY = PIPE MIXINS! ═══

const createDrone = ({ capacity = "3000mAh" } = {}) =>
  pipe(
    withFlying, // ← Thêm fly/land!
    withBattery({ capacity }), // ← Thêm battery!
    withConstructor(createDrone), // ← Constructor ref!
  )({});

// SỬ DỤNG:
const myDrone = createDrone({ capacity: "5500mAh" });

console.log(myDrone.fly().isFlying()); // true
console.log(myDrone.land().isFlying()); // false
console.log(myDrone.getCapacity()); // "5500mAh"
console.log(myDrone.draw(50).getCharge()); // 50
console.log(myDrone.draw(75).getCharge()); // 0 (drained!)
console.log(myDrone.constructor === createDrone); // true
```

```
COMPOSITION VỚI FACTORY:
═══════════════════════════════════════════════════════════════

  createDrone = pipe(
      withFlying,     → { fly(), land(), isFlying() }
      withBattery,    → { draw(), getCharge(), getCapacity() }
      withConstructor → { constructor }
  )({})              → BẮT ĐẦU từ empty object!

  PIPELINE:
  {} ──→ withFlying ──→ withBattery ──→ withConstructor ──→ Drone!

  MỖI bước THÊM functionality!
  → COMPOSITION, không phải inheritance!
  → Muốn thêm GPS? → pipe(withFlying, withBattery, withGPS)({}!)
  → Muốn bỏ battery? → pipe(withFlying, withConstructor)({}!)
  → LINH HOẠT hơn class hierarchy!

  withBattery là PARAMETERIZED mixin:
  → withBattery({ capacity }) → return function(o) → result!
  → = Higher-Order Function!
  → Config TRƯỚC, apply SAU!
```

---

## §10. Type Inference — Self-Documenting

```javascript
// ═══ DEFAULT PARAMS = TYPE HINTS! ═══

// KHÔNG CÓ defaults → IDE/người đọc KHÔNG BIẾT type!
const createUser = (config) => ({
  ...config,
  createdAt: new Date(),
});
// → config chứa gì? String? Number? 🤷

// CÓ defaults → IDE HIỂU type! NGƯỜI ĐỌC hiểu type!
const createUser = ({
  userName = "Anonymous", // ← String!
  avatar = "anon.png", // ← String!
  role = "user", // ← String!
  isActive = true, // ← Boolean!
  maxRetries = 3, // ← Number!
  tags = [], // ← Array!
  metadata = {}, // ← Object!
} = {}) => ({
  userName,
  avatar,
  role,
  isActive,
  maxRetries,
  tags,
  metadata,
  createdAt: new Date(),
});

// → IDE tự suy luận: userName là String!
// → IDE hiện autocomplete ĐÚNG!
// → Code TỰ DOCUMENT → ít cần JSDoc/TypeScript!
```

```
TYPE INFERENCE — LỢI ÍCH:
═══════════════════════════════════════════════════════════════

  ① SELF-DOCUMENTING:
  → Default values = EXAMPLES!
  → Người đọc HIỂU NGAY expected input!

  ② IDE SUPPORT:
  → VS Code infer types từ defaults!
  → Autocomplete, type checking!
  → KHÔNG cần TypeScript cho nhiều cases!

  ③ SAFETY:
  → Missing params → defaults thay thế!
  → KHÔNG bao giờ undefined bất ngờ!

  ④ TOOLS:
  → Tern.js: type inference cho JS!
  → VS Code: dùng TypeScript engine cho .js files!
  → Flow: static type checker!
  → → TẤT CẢ đều tận dụng default params!
```

---

## §11. Configurable Factory

```javascript
// ═══ CONFIGURABLE FACTORY — ENVIRONMENT-BASED ═══

const createLogger = ({
  level = "info",
  prefix = "",
  colorize = process.env.NODE_ENV !== "production",
  timestamp = true,
} = {}) => {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[level] || 0;

  const formatMessage = (lvl, msg) => {
    const parts = [];
    if (timestamp) parts.push(`[${new Date().toISOString()}]`);
    if (prefix) parts.push(`[${prefix}]`);
    parts.push(`[${lvl.toUpperCase()}]`);
    parts.push(msg);
    return parts.join(" ");
  };

  return {
    debug(msg) {
      if (currentLevel <= 0) console.log(formatMessage("debug", msg));
    },
    info(msg) {
      if (currentLevel <= 1) console.info(formatMessage("info", msg));
    },
    warn(msg) {
      if (currentLevel <= 2) console.warn(formatMessage("warn", msg));
    },
    error(msg) {
      if (currentLevel <= 3) console.error(formatMessage("error", msg));
    },
    child(childPrefix) {
      return createLogger({
        level,
        prefix: prefix ? `${prefix}:${childPrefix}` : childPrefix,
        colorize,
        timestamp,
      });
    },
  };
};

// SỬ DỤNG:
const logger = createLogger({ level: "info", prefix: "app" });
logger.debug("Hidden!"); // ← KHÔNG hiện (level > debug!)
logger.info("Server started"); // → [2026-...] [app] [INFO] Server started
logger.error("Crash!"); // → [2026-...] [app] [ERROR] Crash!

// Child logger:
const dbLogger = logger.child("db");
dbLogger.info("Connected"); // → [2026-...] [app:db] [INFO] Connected
```

```javascript
// ═══ HTTP CLIENT FACTORY ═══

const createHttpClient = ({
  baseURL = "",
  timeout = 5000,
  headers = {},
  interceptors = { request: [], response: [] },
} = {}) => {
  const mergedHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  const request = async (url, options = {}) => {
    let config = {
      url: `${baseURL}${url}`,
      headers: { ...mergedHeaders, ...options.headers },
      method: options.method || "GET",
      body: options.body ? JSON.stringify(options.body) : undefined,
    };

    // Request interceptors:
    for (const interceptor of interceptors.request) {
      config = await interceptor(config);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(config.url, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timer);

      let result = { data: await res.json(), status: res.status };

      // Response interceptors:
      for (const interceptor of interceptors.response) {
        result = await interceptor(result);
      }

      return result;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  return {
    get: (url, opts) => request(url, { ...opts, method: "GET" }),
    post: (url, body, opts) => request(url, { ...opts, method: "POST", body }),
    put: (url, body, opts) => request(url, { ...opts, method: "PUT", body }),
    delete: (url, opts) => request(url, { ...opts, method: "DELETE" }),
  };
};

// SỬ DỤNG:
const api = createHttpClient({
  baseURL: "https://api.example.com",
  timeout: 10000,
  headers: { Authorization: "Bearer token123" },
  interceptors: {
    request: [
      (config) => {
        console.log(`→ ${config.method} ${config.url}`);
        return config;
      },
    ],
    response: [
      (res) => {
        console.log(`← ${res.status}`);
        return res;
      },
    ],
  },
});

const users = await api.get("/users");
const newUser = await api.post("/users", { name: "John" });
```

---

## §12. Real-World Applications

```javascript
// ═══ REACT COMPONENT FACTORY ═══

// Factory tạo styled components:
const createButton = ({
  variant = "primary",
  size = "md",
  rounded = false,
} = {}) => {
  const styles = {
    primary: { bg: "#3b82f6", color: "#fff", border: "none" },
    secondary: { bg: "#6b7280", color: "#fff", border: "none" },
    outline: {
      bg: "transparent",
      color: "#3b82f6",
      border: "2px solid #3b82f6",
    },
    ghost: { bg: "transparent", color: "#333", border: "none" },
  };

  const sizes = {
    sm: { padding: "4px 8px", fontSize: "12px" },
    md: { padding: "8px 16px", fontSize: "14px" },
    lg: { padding: "12px 24px", fontSize: "16px" },
  };

  return {
    style: {
      ...styles[variant],
      ...sizes[size],
      borderRadius: rounded ? "9999px" : "4px",
      cursor: "pointer",
    },
    variant,
    size,
  };
};

// 1 factory → NHIỀU variants:
const primaryBtn = createButton({ variant: "primary", size: "lg" });
const outlineBtn = createButton({ variant: "outline", rounded: true });
const ghostBtn = createButton({ variant: "ghost", size: "sm" });
```

```javascript
// ═══ DATABASE CONNECTION FACTORY ═══

const createConnection = ({
  type = "postgres",
  host = "localhost",
  port,
  database = "mydb",
  username = "root",
  password = "",
  pool = { min: 2, max: 10 },
} = {}) => {
  const defaults = {
    postgres: { port: 5432, driver: "pg" },
    mysql: { port: 3306, driver: "mysql2" },
    sqlite: { port: null, driver: "sqlite3" },
    mongo: { port: 27017, driver: "mongodb" },
  };

  const config = defaults[type];
  if (!config) throw new Error(`Unsupported DB type: ${type}`);

  return {
    type,
    driver: config.driver,
    connectionString:
      type === "sqlite"
        ? `sqlite://${database}`
        : `${type}://${username}:${password}@${host}:${port || config.port}/${database}`,
    pool,
    async connect() {
      console.log(`Connecting to ${this.connectionString}...`);
      // ... actual connection logic
      return this;
    },
    async disconnect() {
      console.log("Disconnecting...");
    },
    async query(sql, params) {
      console.log(`Query: ${sql}`, params);
      // ... actual query logic
    },
  };
};

// SỬ DỤNG — cùng 1 API, khác DB!
const db = createConnection({ type: "postgres", database: "users" });
await db.connect();
await db.query("SELECT * FROM users WHERE id = $1", [1]);
```

```javascript
// ═══ TEST FIXTURE FACTORY — TESTING! ═══

// Factory TUYỆT VỜI cho test data!

const createUserFixture = (overrides = {}) => ({
  id: Math.random().toString(36).slice(2),
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  role: "user",
  isActive: true,
  createdAt: new Date("2024-01-01"),
  ...overrides, // ← Override BẤT KỲ field nào!
});

const createOrderFixture = (overrides = {}) => ({
  id: Math.random().toString(36).slice(2),
  userId: createUserFixture().id,
  items: [{ product: "Widget", qty: 1, price: 9.99 }],
  total: 9.99,
  status: "pending",
  createdAt: new Date(),
  ...overrides,
});

// TESTS — clear and configurable:
test("active user can place order", () => {
  const user = createUserFixture({ isActive: true });
  const order = createOrderFixture({ userId: user.id });
  expect(placeOrder(user, order)).toBeTruthy();
});

test("inactive user cannot place order", () => {
  const user = createUserFixture({ isActive: false });
  const order = createOrderFixture({ userId: user.id });
  expect(() => placeOrder(user, order)).toThrow();
});

test("admin can override price", () => {
  const admin = createUserFixture({ role: "admin" });
  const order = createOrderFixture({ total: 0 });
  expect(placeOrder(admin, order)).toBeTruthy();
});

// → Factory = BEST PRACTICE cho test fixtures!
// → Default values hợp lý + override khi cần!
// → DRY, readable, maintainable tests!
```

---

## §13. Tradeoffs — Ưu & Nhược điểm

```
ƯU ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ SIMPLE — ĐƠN GIẢN:
  → Chỉ là function return object!
  → Không new, không class, không prototype!
  → Arrow function: 1 dòng factory!

  ✅ ENCAPSULATION — ĐÓNG GÓI:
  → Closure cho PRIVATE state!
  → Không cần # (private fields!)
  → let count = 0; bên trong = PRIVATE!

  ✅ COMPOSITION — KẾT HỢP:
  → Dùng với functional mixins!
  → pipe(withFlying, withBattery)({}!)
  → LINH HOẠT hơn class extends!

  ✅ CONFIGURABLE — CẤU HÌNH:
  → Default params + destructuring!
  → Return DIFFERENT objects by config!
  → Environment-based object creation!

  ✅ NO "new" — AN TOÀN:
  → Không bao giờ quên "new" → không BUG!
  → Gọi sai cách? Vẫn trả về object!

  ✅ TESTABLE:
  → Test fixtures: createUserFixture(overrides)!
  → Clean, readable, DRY tests!
```

```
NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ❌ MEMORY — BỘ NHỚ:
  → Mỗi object có BẢN COPY methods!
  → d1.bark !== d2.bark!
  → 1000 objects = 1000 copies! LÃNG PHÍ!
  → Class/prototype: methods SHARED!

  ❌ NO instanceof:
  → Factory objects KHÔNG có prototype chain!
  → user instanceof User → KHÔNG HOẠT ĐỘNG!
  → Cần type checking? → thêm type property!

  ❌ NO INHERITANCE:
  → Không extends, không super!
  → Muốn hierarchy? → dùng class!
  → (NHƯNG composition > inheritance!)

  ❌ THIS BINDING:
  → Object literal: this PHẢI dùng regular function!
  → Arrow function trong object = this sai!
  → Cẩn thận khi destructure methods!
```

```
KHI NÀO DÙNG:
═══════════════════════════════════════════════════════════════

  ✅ NÊN DÙNG FACTORY:
  → Simple objects (configs, DTOs, options!)
  → Private state qua closure!
  → Composition (functional mixins!)
  → Test fixtures + mock data!
  → Dynamic object creation by config!
  → Ẩn complexity → clean API!

  ❌ NÊN DÙNG CLASS:
  → Nhiều methods → shared trên prototype!
  → Cần instanceof check!
  → Cần inheritance hierarchy!
  → Frameworks yêu cầu (React class components!)
  → Performance-sensitive (shared methods!)
```

---

## §14. Tóm tắt

```
FACTORY PATTERN — TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Factory Pattern là gì?"
  A: Function trả về object MỚI KHÔNG dùng "new"!
  const createUser = (name) => ({ name })!
  Simple, safe (không quên new!), composable!

  Q: "Tại sao () => ({...}) cần ()?
  A: Không có () → JS hiểu { } là function body!
  → return undefined! Có () → JS hiểu = object literal!

  Q: "= {} cuối parameter là gì?"
  A: Default = empty object khi KHÔNG truyền argument!
  → createUser() → destructure {} → dùng defaults!
  → Không có = {} → TypeError: cannot destructure undefined!

  Q: "Factory vs Class?"
  A: Factory: no new, closure private, composition, MỖI obj copy methods!
  Class: cần new, prototype shared methods, instanceof, inheritance!
  Factory cho simple objects; Class cho complex domain models!

  Q: "Factory Method vs Abstract Factory?"
  A: Factory Method: 1 sản phẩm, subclass quyết định variant!
  Abstract Factory: NHÓM sản phẩm liên quan, consistent family!

  Q: "Factory + Mixins?"
  A: pipe(withFlying, withBattery, withGPS)({}) = compose!
  Mỗi mixin THÊM functionality! Functional composition!
  LINH HOẠT hơn class extends! "Composition over inheritance!"

  Q: "Factory trong testing?"
  A: createUserFixture(overrides) = BEST PRACTICE!
  Default values hợp lý + override từng field!
  DRY, readable, maintainable test code!
```

---

### Checklist

- [ ] **Factory concept**: function trả về object MỚI; KHÔNG dùng "new"; gọi fn → nhận object!
- [ ] **Arrow implicit return**: () => ({...}) cần () bao object; không () → JS hiểu function body!
- [ ] **Destructuring**: ({ a, b } = {}) → tách params; = {} safety net cho undefined!
- [ ] **Default params**: self-documenting; type inference cho IDE; createUser() → defaults!
- [ ] **Computed keys**: [key]: value; dynamic property names; Redux action types!
- [ ] **Factory vs Class**: Factory = no new, closure, copy methods; Class = new, prototype shared!
- [ ] **Memory tradeoff**: Factory mỗi object copy methods; Class share trên prototype → tiết kiệm!
- [ ] **Factory Method**: subclass/variant quyết định tạo product NÀO; createButton() → WinBtn/HtmlBtn!
- [ ] **Abstract Factory**: tạo NHÓM sản phẩm consistent; DarkTheme → DarkBtn + DarkInput!
- [ ] **Functional Mixins**: pipe(withFlying, withBattery)({}); composition over inheritance!
- [ ] **Configurable Factory**: createLogger({ level, prefix }); environment-based object creation!
- [ ] **Test Fixtures**: createUserFixture(overrides); BEST PRACTICE cho test data!
- [ ] **Tradeoffs**: Ưu (simple, safe, composable) vs Nhược (memory, no instanceof, no inheritance)!

---

_Nguồn: patterns.dev — Factory Pattern, Eric Elliott — JavaScript Factory Functions with ES6+_
_Cập nhật lần cuối: Tháng 2, 2026_
