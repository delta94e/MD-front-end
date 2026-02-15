# Module Pattern — Deep Dive

> 📅 2026-02-14 · ⏱ 22 phút đọc
>
> Module Pattern Concept & Encapsulation,
> IIFE Module (ES5), CommonJS, AMD,
> ES2015 Modules: Named & Default Exports,
> Dynamic import(), Tree Shaking,
> Revealing Module Pattern, Namespace Pattern,
> React Component Modules, Barrel Exports,
> Real-World Applications & Tradeoffs
> Độ khó: ⭐️⭐️⭐️⭐️ | Design Pattern / JS Core

---

## Mục Lục

| #   | Phần                            |
| --- | ------------------------------- |
| 1   | Module Pattern là gì?           |
| 2   | IIFE Module Pattern (ES5)       |
| 3   | Revealing Module Pattern        |
| 4   | CommonJS (Node.js)              |
| 5   | ES2015 Modules — Named Exports  |
| 6   | ES2015 Modules — Default Export |
| 7   | Import tất cả — Namespace       |
| 8   | Rename — as Keyword             |
| 9   | Re-export & Barrel Pattern      |
| 10  | Dynamic import()                |
| 11  | Tree Shaking                    |
| 12  | Module trong React              |
| 13  | Module Systems — So sánh        |
| 14  | Circular Dependencies           |
| 15  | Real-World Applications         |
| 16  | Tradeoffs — Ưu & Nhược điểm     |
| 17  | Tóm tắt                         |

---

## §1. Module Pattern là gì?

```
MODULE PATTERN — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Module = PHẦN CODE ĐỘC LẬP, có thể TÁI SỬ DỤNG!
  → ĐÓNG GÓI (encapsulate!) logic riêng!
  → EXPORT chỉ những gì cần CÔNG KHAI!
  → PRIVATE những gì KHÔNG cần lộ ra!
  → TRÁNH ô nhiễm global scope!

  VÍ DỤ THỰC TẾ:
  → Module = PHÒNG trong nhà!
  → Mỗi phòng có ĐỒ RIÊNG (private!)
  → Cửa ra vào = EXPORT (public interface!)
  → Bạn chỉ thấy những gì chủ phòng CHO PHÉP!
  → Không ai NHÌ được đồ HẾT trong phòng!

  TẠI SAO CẦN?
  ┌──────────────────────────────────────────────────────────┐
  │ ① ENCAPSULATION → Private data, public API!            │
  │ ② REUSABILITY   → Tái sử dụng code dễ dàng!           │
  │ ③ NAMESPACE     → Tránh xung đột tên biến!            │
  │ ④ DEPENDENCY    → Quản lý dependencies rõ ràng!        │
  │ ⑤ MAINTENANCE   → Code nhỏ, dễ bảo trì!              │
  │ ⑥ TESTABILITY   → Test từng module độc lập!           │
  └──────────────────────────────────────────────────────────┘
```

```
LỊCH SỬ MODULE TRONG JAVASCRIPT:
═══════════════════════════════════════════════════════════════

  1995-2009: KHÔNG CÓ module system!
  → Tất cả code = GLOBAL! 😱
  → Xung đột tên biến khắp nơi!
  → <script src="a.js"> overwrite <script src="b.js">!

  2009: CommonJS (Node.js!)
  → require() / module.exports!
  → SYNCHRONOUS loading!
  → Chỉ cho SERVER (Node.js!)

  2011: AMD (RequireJS!)
  → define() / require()!
  → ASYNCHRONOUS loading!
  → Cho BROWSER!

  2012: UMD (Universal!)
  → Kết hợp CommonJS + AMD!
  → Chạy EVERYWHERE!

  2015: ES2015 Modules (ESM!) ← CHUẨN CHÍNH THỨC!
  → import / export!
  → STATIC analysis → Tree Shaking!
  → Hỗ trợ cả Browser + Node.js!
  → ĐÂY LÀ TƯƠNG LAI!
```

---

## §2. IIFE Module Pattern (ES5)

```javascript
// ═══ TRƯỚC KHI CÓ MODULE — GLOBAL POLLUTION! ═══

// file1.js
var name = "John";
function greet() {
  return "Hello " + name;
}

// file2.js
var name = "Jane"; // ❌ OVERWRITE name ở file1!
function greet() {
  return "Hi " + name;
} // ❌ OVERWRITE greet!

// → TẤT CẢ trên GLOBAL scope!
// → file2.js phá hỏng file1.js!
```

```javascript
// ═══ IIFE MODULE PATTERN — GIẢI PHÁP ES5! ═══

// IIFE = Immediately Invoked Function Expression!
// → Tạo SCOPE riêng → biến KHÔNG LỘ ra global!

var MathModule = (function () {
  // ═══ PRIVATE — không ai thấy! ═══
  var PI = 3.14159265359;
  var cache = {};

  function validateNumber(n) {
    if (typeof n !== "number") {
      throw new TypeError("Expected a number!");
    }
  }

  // ═══ PUBLIC — chỉ những gì return! ═══
  return {
    add: function (x, y) {
      validateNumber(x);
      validateNumber(y);
      return x + y;
    },

    multiply: function (x, y) {
      validateNumber(x);
      validateNumber(y);
      return x * y;
    },

    circleArea: function (r) {
      validateNumber(r);
      if (cache[r]) return cache[r];
      var area = PI * r * r;
      cache[r] = area;
      return area;
    },

    getPI: function () {
      return PI;
    },
  };
})();

// SỬ DỤNG:
MathModule.add(2, 3); // 5
MathModule.multiply(4, 5); // 20
MathModule.circleArea(10); // 314.159...
MathModule.getPI(); // 3.14159...

// PRIVATE — không access được:
console.log(MathModule.PI); // undefined!
console.log(MathModule.cache); // undefined!
console.log(MathModule.validateNumber); // undefined!
```

```
IIFE MODULE — GIẢI THÍCH:
═══════════════════════════════════════════════════════════════

  (function() {
      // ← FUNCTION SCOPE!
      // Mọi var, function ở đây = PRIVATE!

      return {
          // ← OBJECT được return = PUBLIC API!
          // Chỉ những gì ở đây mới ACCESSIBLE từ ngoài!
      };
  })();
  // ↑ () = IMMEDIATELY INVOKED! Chạy ngay!

  CLOSURE:
  → Functions trong return object!
  → ĐÓNG KÍN (close over) biến private!
  → Biến private SỐNG trong closure!
  → Không bị GC vì vẫn được reference!
  → Nhưng KHÔNG thể access TRỰC TIẾP từ ngoài!

  ĐÂY CHÍNH LÀ MODULE PATTERN!
  → Encapsulation qua CLOSURE + IIFE!
```

```javascript
// ═══ IIFE VỚI DEPENDENCY INJECTION ═══

var MyApp = (function ($, _) {
  // $ = jQuery, _ = Lodash!
  // Inject dependencies QUA PARAMETERS!

  function init() {
    var $container = $("#app");
    var data = _.map([1, 2, 3], function (n) {
      return n * 2;
    });
    $container.html(data.join(", "));
  }

  return {
    init: init,
  };
})(jQuery, _);

MyApp.init();

// ƯU ĐIỂM:
// → Dependencies RÕ RÀNG! (đọc parameters!)
// → Có thể MOCK khi test!
// → $ = jQuery rõ ràng, không nhầm!
```

---

## §3. Revealing Module Pattern

```javascript
// ═══ REVEALING MODULE PATTERN ═══

// Khác IIFE thường: DEFINE TẤT CẢ functions bên trong!
// Chỉ REVEAL (lộ) qua return object!

var UserModule = (function () {
  // ═══ TẤT CẢ functions private trước! ═══
  var users = [];
  var nextId = 1;

  function addUser(name, email) {
    var user = {
      id: nextId++,
      name: name,
      email: email,
      createdAt: new Date(),
    };
    users.push(user);
    return user;
  }

  function removeUser(id) {
    users = users.filter(function (u) {
      return u.id !== id;
    });
  }

  function getUser(id) {
    return users.find(function (u) {
      return u.id === id;
    });
  }

  function getAllUsers() {
    // Return COPY, không phải reference!
    return users.slice();
  }

  function getUserCount() {
    return users.length;
  }

  function reset() {
    users = [];
    nextId = 1;
  }

  // ═══ CHỈ REVEAL methods public! ═══
  return {
    add: addUser, // Public name → private function!
    remove: removeUser,
    get: getUser,
    getAll: getAllUsers,
    count: getUserCount,
    // reset KHÔNG reveal → PRIVATE!
  };
})();

// SỬ DỤNG:
UserModule.add("John", "john@example.com"); // { id: 1, name: "John"... }
UserModule.add("Jane", "jane@example.com"); // { id: 2, name: "Jane"... }
UserModule.count(); // 2
UserModule.getAll(); // [{ id: 1 }, { id: 2 }]
UserModule.remove(1); // Xóa John!
UserModule.count(); // 1
UserModule.reset; // undefined! PRIVATE!
```

```
REVEALING MODULE — ƯU ĐIỂM:
═══════════════════════════════════════════════════════════════

  ① READABLE:
  → Nhìn return object = BIẾT NGAY public API!
  → Tất cả logic ở TRÊN, API ở DƯỚI!

  ② CONSISTENT NAMING:
  → Private: addUser → Public: add
  → Rename public API MÀ KHÔNG đổi implementation!

  ③ CLEAR SEPARATION:
  → Private functions = implementation details!
  → Return object = public contract!

  ④ EASY TO MAINTAIN:
  → Muốn ẩn function? Xóa khỏi return!
  → Muốn expose? Thêm vào return!
```

---

## §4. CommonJS (Node.js)

```javascript
// ═══ CommonJS — require / module.exports ═══

// math.js
const PI = 3.14159; // PRIVATE! (module-scoped!)

function add(x, y) {
  return x + y;
}

function multiply(x, y) {
  return x * y;
}

function _validate(n) {
  // PRIVATE by convention (_prefix!)
  // Nhưng TECHNICALLY vẫn export được!
  return typeof n === "number";
}

// EXPORT:
module.exports = {
  add,
  multiply,
};

// Hoặc export từng cái:
// module.exports.add = add;
// module.exports.multiply = multiply;

// Hoặc exports shorthand:
// exports.add = add;
// exports.multiply = multiply;
```

```javascript
// ═══ IMPORT (require) ═══

// index.js
const math = require("./math");

console.log(math.add(2, 3)); // 5
console.log(math.multiply(4, 5)); // 20
console.log(math.PI); // undefined! PRIVATE!

// DESTRUCTURING:
const { add, multiply } = require("./math");
add(2, 3); // 5
multiply(4, 5); // 20
```

```
CommonJS — ĐẶC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ ① SYNCHRONOUS loading (blocking!)                      │
  │   → Phù hợp Server (Node.js!)                         │
  │   → KHÔNG phù hợp Browser!                            │
  │                                                          │
  │ ② DYNAMIC: require() có thể trong if/else!            │
  │   if (condition) {                                       │
  │       const mod = require('./moduleA');                  │
  │   } else {                                               │
  │       const mod = require('./moduleB');                  │
  │   }                                                      │
  │                                                          │
  │ ③ CACHED: require() lần 2+ trả về CACHED value!       │
  │   → Module chỉ chạy 1 LẦN!                            │
  │   → Lần sau: return cache!                              │
  │                                                          │
  │ ④ module.exports vs exports:                           │
  │   → exports = SHORTHAND cho module.exports              │
  │   → exports.x = y ← OK!                               │
  │   → exports = { x: y } ← ❌ BREAK! Phải dùng          │
  │     module.exports = { x: y }!                          │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. ES2015 Modules — Named Exports

```javascript
// ═══ NAMED EXPORTS ═══

// math.js
const privateValue = "This is private to the module!";

export function add(x, y) {
  return x + y;
}

export function multiply(x) {
  return x * 2;
}

export function subtract(x, y) {
  return x - y;
}

export function square(x) {
  return x * x;
}

// privateValue KHÔNG có export → PRIVATE!
// Chỉ accessible TRONG math.js!
```

```javascript
// ═══ IMPORT NAMED EXPORTS ═══

// index.js
import { add, multiply, subtract, square } from "./math.js";

console.log(add(7, 8)); // 15
console.log(multiply(8)); // 16
console.log(subtract(10, 3)); // 7
console.log(square(3)); // 9

// PRIVATE value KHÔNG accessible:
console.log(privateValue); // ❌ ReferenceError: privateValue is not defined
```

```javascript
// ═══ EXPORT Ở CUỐI FILE ═══

// utils.js
const API_URL = "https://api.example.com";
const TIMEOUT = 5000;

function fetchData(endpoint) {
  return fetch(`${API_URL}/${endpoint}`, { timeout: TIMEOUT });
}

function formatDate(date) {
  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// EXPORT tất cả ở CUỐI:
export { fetchData, formatDate, debounce };

// Hoặc export VỚI RENAME:
export { fetchData as fetch, formatDate as format };
```

```
NAMED EXPORTS — RULES:
═══════════════════════════════════════════════════════════════

  ✅ CÓ THỂ export NHIỀU values từ 1 module!
  ✅ PHẢI import đúng TÊN (hoặc dùng 'as' để rename!)
  ✅ PHẢI dùng {} khi import!
  ✅ Có thể export: function, class, const, let, var!

  // Export:
  export const name = "John";
  export function greet() { ... }
  export class User { ... }
  export { a, b, c };

  // Import:
  import { name, greet, User } from './module';
  import { name as userName } from './module';
```

---

## §6. ES2015 Modules — Default Export

```javascript
// ═══ DEFAULT EXPORT ═══

// math.js
export default function add(x, y) {
  return x + y;
}

export function multiply(x) {
  return x * 2;
}

export function subtract(x, y) {
  return x - y;
}
```

```javascript
// ═══ IMPORT DEFAULT + NAMED ═══

// index.js

// Default = KHÔNG cần {}!
// Named = CẦN {}!
import add, { multiply, subtract } from "./math.js";

add(7, 8); // 15
multiply(8); // 16
subtract(10, 3); // 7
```

```javascript
// ═══ DEFAULT EXPORT — TÊN TÙY Ý! ═══

// Vì là DEFAULT, bạn đặt TÊN GÌ CŨNG ĐƯỢC:
import addValues from "./math.js"; // ✅ OK!
import sum from "./math.js"; // ✅ OK!
import calculateSum from "./math.js"; // ✅ OK!

// TẤT CẢ đều import CÙNG 1 thứ: default export!
```

```
DEFAULT vs NAMED EXPORTS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬────────────────────┬─────────────────┐
  │                  │ Named Export       │ Default Export   │
  ├──────────────────┼────────────────────┼─────────────────┤
  │ Số lượng         │ NHIỀU per module!  │ CHỈ 1 per module│
  │ Import syntax    │ import { x }       │ import x        │
  │ {} cần?          │ ✅ BẮT BUỘC       │ ❌ KHÔNG cần    │
  │ Tên khi import   │ PHẢI đúng tên!    │ ĐẶT TÊN TÙY Ý! │
  │ Rename?          │ import { x as y } │ import y (tự do!)│
  │ Tree Shaking?    │ ✅ TỐT!           │ ⚠️ Kém hơn!     │
  │ IDE support      │ ✅ Auto-complete!  │ ⚠️ Phải nhớ tên │
  │ Refactoring      │ ✅ Find references │ ⚠️ Tên khác nhau│
  └──────────────────┴────────────────────┴─────────────────┘

  KHUYẾN NGHỊ:
  → Prefer NAMED exports!
  → IDE auto-import → named!
  → Tree shaking → named!
  → Refactoring → named (nhất quán!)
  → Default chỉ khi: 1 component/class chính per file!
  → (React convention: 1 component = 1 default export!)
```

---

## §7. Import tất cả — Namespace

```javascript
// ═══ NAMESPACE IMPORT — import * as ═══

// math.js
export function add(x, y) {
  return x + y;
}
export function multiply(x, y) {
  return x * y;
}
export function subtract(x, y) {
  return x - y;
}
export function square(x) {
  return x * x;
}
export default function sum(...args) {
  return args.reduce((a, b) => a + b, 0);
}
```

```javascript
// ═══ IMPORT TẤT CẢ ═══

import * as math from "./math.js";

// Named exports → thuộc tính:
math.add(1, 2); // 3
math.multiply(3, 4); // 12
math.subtract(5, 2); // 3
math.square(4); // 16

// Default export → math.default:
math.default(1, 2, 3, 4); // 10

// CẢNH BÁO:
// → import * IMPORT TẤT CẢ exports!
// → Có thể import thứ KHÔNG CẦN!
// → Tree Shaking KHÔNG hoạt động tốt!
// → Chỉ dùng khi CẦN TẤT CẢ functions!
```

---

## §8. Rename — as Keyword

```javascript
// ═══ RENAME ĐỂ TRÁNH XUNG ĐỘT TÊN ═══

// Khi local code CÓ CÙNG TÊN với imported:

import {
  add as addValues,
  multiply as multiplyValues,
  subtract,
  square,
} from "./math.js";

// Local functions CÙNG TÊN:
function add(...args) {
  return args.reduce((acc, cur) => cur + acc, 0);
}

function multiply(...args) {
  return args.reduce((acc, cur) => cur * acc, 1);
}

// Dùng imported (renamed):
addValues(7, 8); // 15 ← từ math.js!
multiplyValues(8, 9); // 72 ← từ math.js!

// Dùng local:
add(8, 9, 2, 10); // 29 ← local function!
multiply(8, 9, 2, 10); // 1440 ← local function!
```

```javascript
// ═══ RENAME KHI EXPORT ═══

// helpers.js
function internalAdd(x, y) {
  return x + y;
}
function internalCalculate(x) {
  return x * 2;
}

// Export VỚI TÊN KHÁC:
export { internalAdd as add, internalCalculate as calculate };

// Ngoài module: import { add, calculate }
// Bên trong: vẫn dùng internalAdd, internalCalculate
```

---

## §9. Re-export & Barrel Pattern

```javascript
// ═══ BARREL PATTERN — INDEX.JS ═══

// Thay vì import từ TỪNG file:
// import { Button } from './components/Button';
// import { Input } from './components/Input';
// import { Modal } from './components/Modal';

// Tạo index.js (barrel file!):
// components/index.js
export { Button } from "./Button";
export { Input } from "./Input";
export { Modal } from "./Modal";
export { TodoList } from "./TodoList";
export { Header } from "./Header";

// BÂY GIỜ import TỪ 1 CHỖ:
// import { Button, Input, Modal } from './components';
```

```javascript
// ═══ RE-EXPORT PATTERNS ═══

// ① Re-export named:
export { add, multiply } from "./math";

// ② Re-export ALL:
export * from "./math";

// ③ Re-export default AS named:
export { default as MathUtils } from "./math";

// ④ Re-export named AS default:
export { add as default } from "./math";

// ⑤ Re-export VỚI rename:
export { add as sum, multiply as times } from "./math";
```

```
BARREL PATTERN — THỰC TẾ:
═══════════════════════════════════════════════════════════════

  CẤU TRÚC FOLDER:
  src/
  ├── components/
  │   ├── Button.jsx
  │   ├── Input.jsx
  │   ├── Modal.jsx
  │   └── index.js       ← BARREL FILE!
  ├── hooks/
  │   ├── useAuth.js
  │   ├── useFetch.js
  │   └── index.js       ← BARREL FILE!
  ├── utils/
  │   ├── format.js
  │   ├── validate.js
  │   └── index.js       ← BARREL FILE!
  └── App.jsx

  IMPORT SẠCH:
  import { Button, Input, Modal } from './components';
  import { useAuth, useFetch } from './hooks';
  import { formatDate, validateEmail } from './utils';

  ⚠️ CẢNH BÁO:
  → export * có thể BREAK tree shaking!
  → Import từ barrel → bundler load TẤT CẢ files!
  → Với libraries LỚN: import trực tiếp file tốt hơn!
  → VD: import { debounce } from 'lodash/debounce';
  → THAY VÌ: import { debounce } from 'lodash';
```

---

## §10. Dynamic import()

```javascript
// ═══ DYNAMIC IMPORT — LAZY LOADING ═══

// STATIC import (top-level, luôn load!):
import { add } from "./math.js";

// DYNAMIC import (load KHI CẦN!):
const button = document.getElementById("btn");

button.addEventListener("click", () => {
  // Module CHỈ load khi user CLICK!
  import("./math.js").then((module) => {
    console.log("Add: ", module.add(1, 2));
    console.log("Multiply: ", module.multiply(3, 2));
  });
});
```

```javascript
// ═══ ASYNC/AWAIT VỚI DYNAMIC IMPORT ═══

button.addEventListener("click", async () => {
  const module = await import("./math.js");
  console.log("Add: ", module.add(1, 2));
  console.log("Multiply: ", module.multiply(3, 2));

  // Default export:
  console.log("Default: ", module.default(1, 2));
});
```

```javascript
// ═══ CONDITIONAL IMPORT ═══

async function loadLocale(lang) {
  // Load ngôn ngữ DỰA TRÊN user choice:
  const locale = await import(`./locales/${lang}.js`);
  return locale.translations;
}

// Chỉ load tiếng Việt khi user CHỌN:
const translations = await loadLocale("vi");
```

```javascript
// ═══ REACT LAZY — DYNAMIC IMPORT! ═══

import React, { Suspense, lazy } from "react";

// LAZY load component:
const HeavyChart = lazy(() => import("./components/HeavyChart"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));

function App() {
  const [showChart, setShowChart] = React.useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>

      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}

// HeavyChart.jsx CHỈ download khi user click "Show Chart"!
// → GIẢM initial bundle size!
// → User KHÔNG cần download code CHƯA CẦN!
```

```
DYNAMIC IMPORT — KHI NÀO DÙNG:
═══════════════════════════════════════════════════════════════

  ✅ ROUTE-BASED SPLITTING:
  → Mỗi page = 1 chunk riêng!
  → User vào /dashboard → load dashboard chunk!
  → User vào /settings → load settings chunk!

  ✅ FEATURE-BASED:
  → Heavy chart library → load khi user mở chart!
  → PDF generator → load khi user export PDF!
  → Admin panel → load chỉ cho admin users!

  ✅ CONDITIONAL LOADING:
  → Locale files: load ngôn ngữ user chọn!
  → A/B testing: load variant dựa trên flag!
  → Platform: mobile vs desktop components!

  ⚠️ CHÚ Ý:
  → import() return PROMISE!
  → Cần error handling (try/catch!)
  → Network latency → user thấy loading!
  → Prefetch/preload cho UX tốt hơn!
```

---

## §11. Tree Shaking

```
TREE SHAKING — LOẠI BỎ CODE THỪA:
═══════════════════════════════════════════════════════════════

  Tree Shaking = Bundler LOẠI BỎ code KHÔNG DÙNG!
  → Chỉ hoạt động với ES Modules (import/export!)
  → KHÔNG hoạt động với CommonJS (require!)

  VÍ DỤ:
  // utils.js
  export function add(x, y) { return x + y; }      ← GIỮA!
  export function subtract(x, y) { return x - y; }  ← BỎ!
  export function multiply(x, y) { return x * y; }  ← BỎ!

  // app.js
  import { add } from './utils';  // Chỉ import add!

  BUNDLER (Webpack/Rollup/Vite):
  → Phân tích STATIC imports!
  → subtract, multiply KHÔNG được import ở đâu cả!
  → → LOẠI BỎ khỏi bundle!
  → → Bundle NHẸ hơn!
```

```
TẠI SAO CommonJS KHÔNG TREE SHAKE ĐƯỢC:
═══════════════════════════════════════════════════════════════

  // CommonJS: DYNAMIC!
  const utils = require('./utils');
  // → Bundler KHÔNG BIẾT bạn dùng gì từ utils!
  // → Phải include TẤT CẢ!

  if (condition) {
      const mod = require('./moduleA'); // ← RUNTIME!
  }
  // → Bundler không biết condition → phải include moduleA!

  // ES Modules: STATIC!
  import { add } from './utils';
  // → Bundler BIẾT CHÍNH XÁC: chỉ dùng add!
  // → Loại bỏ phần còn lại!

  → ESM imports phải ở TOP LEVEL!
  → KHÔNG thể trong if/else!
  → → Bundler phân tích được TRƯỚC KHI chạy!
  → → Tree Shaking hoạt động!
```

```javascript
// ═══ TIPS TREE SHAKING TỐT ═══

// ✅ GOOD: Named imports!
import { debounce } from 'lodash-es';
// → Chỉ include debounce!

// ❌ BAD: Import all!
import _ from 'lodash';
// → Include TOÀN BỘ lodash (~70KB!)

// ✅ GOOD: Direct file import!
import debounce from 'lodash/debounce';
// → Chỉ include 1 file!

// ❌ BAD: Barrel re-export *!
export * from './heavy-module';
// → Bundler khó phân tích → include hết!

// ✅ GOOD: Explicit barrel exports!
export { specificThing } from './heavy-module';
// → Bundler biết chính xác!

// PACKAGE.JSON — sideEffects:
{
    "sideEffects": false
}
// → Nói bundler: module này KHÔNG có side effects!
// → An toàn để tree shake!
// → Nếu có CSS imports: "sideEffects": ["*.css"]
```

---

## §12. Module trong React

```javascript
// ═══ REACT COMPONENT MODULES ═══

// components/Button.jsx
import React from "react";

// PRIVATE: chỉ dùng trong file này!
const styles = {
  button: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  primary: {
    backgroundColor: "#3b82f6",
    color: "white",
  },
  secondary: {
    backgroundColor: "#6b7280",
    color: "white",
  },
};

// PUBLIC: export cho các file khác dùng!
export function Button({ children, variant = "primary", onClick }) {
  return (
    <button style={{ ...styles.button, ...styles[variant] }} onClick={onClick}>
      {children}
    </button>
  );
}
```

```javascript
// ═══ CUSTOM HOOK MODULE ═══

// hooks/useFetch.js

// PRIVATE helper:
function buildUrl(base, params) {
  const url = new URL(base);
  Object.entries(params).forEach(([key, val]) => {
    url.searchParams.set(key, val);
  });
  return url.toString();
}

// PUBLIC hook:
export function useFetch(url, options = {}) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const controller = new AbortController();
    const finalUrl = options.params ? buildUrl(url, options.params) : url;

    fetch(finalUrl, { signal: controller.signal })
      .then((res) => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}

// buildUrl = PRIVATE! Không export!
// useFetch = PUBLIC! Export cho components dùng!
```

```javascript
// ═══ CONSTANTS MODULE ═══

// constants/api.js
export const API_BASE = "https://api.example.com/v2";
export const ENDPOINTS = {
  USERS: "/users",
  PRODUCTS: "/products",
  ORDERS: "/orders",
};
export const TIMEOUT = 10000;
export const HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// PRIVATE — không export:
const INTERNAL_KEY = "abc123"; // Secret!
```

```
REACT MODULE ORGANIZATION:
═══════════════════════════════════════════════════════════════

  CONVENTION:
  → 1 component = 1 file = 1 module!
  → Default export = main component!
  → Named exports = helpers, types, constants!

  // Button/index.jsx
  export { Button } from './Button';       // Re-export!
  export { IconButton } from './IconButton';

  // Button/Button.jsx
  export function Button() { ... }          // Named export!

  // HOẶC:
  // Button.jsx
  export default function Button() { ... }  // Default export!

  FOLDER STRUCTURE:
  src/
  ├── components/          ← UI components!
  │   ├── Button/
  │   │   ├── Button.jsx
  │   │   ├── Button.test.js
  │   │   ├── Button.module.css
  │   │   └── index.js    ← Barrel!
  │   └── index.js         ← Components barrel!
  ├── hooks/               ← Custom hooks!
  ├── utils/               ← Utility functions!
  ├── constants/           ← Constants & config!
  ├── services/            ← API calls!
  └── types/               ← TypeScript types!
```

---

## §13. Module Systems — So sánh

```
SO SÁNH MODULE SYSTEMS:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬──────────┬──────────┬──────────┬──────────┐
  │              │ IIFE     │ CommonJS │ AMD      │ ESM      │
  ├──────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Năm          │ ~2003    │ 2009     │ 2011     │ 2015     │
  │ Syntax       │ (fn)()   │ require  │ define   │ import   │
  │              │          │ exports  │ require  │ export   │
  │ Loading      │ Inline   │ Sync     │ Async    │ Static+  │
  │              │          │          │          │ Dynamic  │
  │ Browser?     │ ✅       │ ❌ (*)   │ ✅       │ ✅       │
  │ Node.js?     │ ✅       │ ✅       │ ⚠️ Plugin│ ✅       │
  │ Tree Shake?  │ ❌       │ ❌       │ ❌       │ ✅       │
  │ Static       │ ❌       │ ❌       │ ❌       │ ✅       │
  │ analysis?    │          │          │          │          │
  │ Cyclic deps? │ N/A      │ ⚠️ Partial│ ⚠️      │ ✅ Live  │
  │              │          │          │          │ bindings!│
  │ Standard?    │ ❌       │ ❌ de facto│ ❌      │ ✅ ECMA  │
  │ Status       │ Legacy   │ Legacy   │ Dead     │ CURRENT! │
  └──────────────┴──────────┴──────────┴──────────┴──────────┘

  (*) CommonJS cần bundler (Webpack) cho browser!

  WINNER: ESM (ES Modules!)
  → Chuẩn CHÍNH THỨC của JavaScript!
  → Static analysis → Tree Shaking!
  → Browser + Node.js!
  → Dynamic import()!
```

---

## §14. Circular Dependencies

```javascript
// ═══ CIRCULAR DEPENDENCY — VẤN ĐỀ! ═══

// a.js
import { b } from "./b.js";
export const a = "A says: " + b;

// b.js
import { a } from "./a.js";
export const b = "B says: " + a;

// ❌ CIRCULAR!
// a imports b → b imports a → a imports b → ...
// ESM: b sẽ là undefined khi a đọc nó!
// CommonJS: b sẽ là {} (partial export!)
```

```javascript
// ═══ FIX: RESTRUCTURE! ═══

// CÁCH 1: Extract common dependency:
// shared.js
export const shared = "Shared value";

// a.js
import { shared } from "./shared.js";
export const a = "A: " + shared;

// b.js
import { shared } from "./shared.js";
export const b = "B: " + shared;

// CÁCH 2: Lazy evaluation:
// a.js
export function getA() {
  const { b } = require("./b"); // Lazy!
  return "A says: " + b;
}

// CÁCH 3: Dependency Injection:
// a.js
export function createA(b) {
  return "A says: " + b;
}
```

```
PHÁT HIỆN CIRCULAR DEPS:
═══════════════════════════════════════════════════════════════

  TOOLS:
  → madge: npx madge --circular src/
  → eslint-plugin-import: import/no-cycle rule!

  DẤU HIỆU:
  → undefined values khi import!
  → "Cannot access X before initialization"!
  → Module không load đúng thứ tự!

  NGUYÊN TẮC:
  → Tổ chức modules theo LAYERS!
  → Layer trên CHỈNH import layer dưới!
  → KHÔNG import ngược lên!
```

---

## §15. Real-World Applications

```javascript
// ═══ API SERVICE MODULE ═══

// services/api.js
const BASE_URL = process.env.REACT_APP_API_URL;
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

// PRIVATE:
let authToken = null;

function buildHeaders() {
  const headers = { ...DEFAULT_HEADERS };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || response.statusText);
  }
  return response.json();
}

// PUBLIC API:
export function setToken(token) {
  authToken = token;
}

export async function get(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: buildHeaders(),
  });
  return handleResponse(res);
}

export async function post(endpoint, data) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function put(endpoint, data) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function del(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
  return handleResponse(res);
}

// PRIVATE: BASE_URL, authToken, buildHeaders, handleResponse
// PUBLIC: setToken, get, post, put, del
```

```javascript
// ═══ LOGGER MODULE — ENCAPSULATION ═══

// utils/logger.js
const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

// PRIVATE:
let currentLevel = LOG_LEVELS.INFO;
const logs = [];

function formatMessage(level, ...args) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  return {
    timestamp,
    level,
    message: args,
    formatted: `${prefix} ${args.join(" ")}`,
  };
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= currentLevel;
}

// PUBLIC:
export function setLevel(level) {
  if (level in LOG_LEVELS) {
    currentLevel = LOG_LEVELS[level];
  }
}

export function debug(...args) {
  if (shouldLog("DEBUG")) {
    const entry = formatMessage("DEBUG", ...args);
    logs.push(entry);
    console.log(entry.formatted);
  }
}

export function info(...args) {
  if (shouldLog("INFO")) {
    const entry = formatMessage("INFO", ...args);
    logs.push(entry);
    console.info(entry.formatted);
  }
}

export function warn(...args) {
  if (shouldLog("WARN")) {
    const entry = formatMessage("WARN", ...args);
    logs.push(entry);
    console.warn(entry.formatted);
  }
}

export function error(...args) {
  if (shouldLog("ERROR")) {
    const entry = formatMessage("ERROR", ...args);
    logs.push(entry);
    console.error(entry.formatted);
  }
}

export function getLogs() {
  return [...logs]; // Return COPY!
}
```

```javascript
// ═══ FEATURE FLAG MODULE ═══

// config/features.js

// PRIVATE:
const flags = new Map();
const overrides = new Map();

function loadFromServer() {
  // Simulate API call:
  return {
    DARK_MODE: true,
    NEW_DASHBOARD: false,
    BETA_FEATURES: false,
  };
}

const serverFlags = loadFromServer();
Object.entries(serverFlags).forEach(([key, val]) => {
  flags.set(key, val);
});

// PUBLIC:
export function isEnabled(flag) {
  // Override > Server value:
  if (overrides.has(flag)) return overrides.get(flag);
  return flags.get(flag) || false;
}

export function override(flag, value) {
  overrides.set(flag, value);
}

export function clearOverrides() {
  overrides.clear();
}

export function getAllFlags() {
  const result = {};
  flags.forEach((val, key) => {
    result[key] = overrides.has(key) ? overrides.get(key) : val;
  });
  return result;
}

// SỬ DỤNG:
// import { isEnabled } from './config/features';
// if (isEnabled('DARK_MODE')) { ... }
```

---

## §16. Tradeoffs — Ưu & Nhược điểm

```
ƯU ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ ENCAPSULATION:
  → Private data + public API!
  → Giảm complexity bằng cách ẨN implementation!

  ✅ NAMESPACE:
  → TRÁNH global scope pollution!
  → TRÁNH naming collisions!
  → Mỗi module = scope riêng!

  ✅ REUSABILITY:
  → Import module ở BẤT KỲ đâu!
  → DRY — Don't Repeat Yourself!

  ✅ DEPENDENCY MANAGEMENT:
  → import statements = danh sách dependencies!
  → Rõ ràng: file này DÙNG GÌ!

  ✅ TREE SHAKING (ESM!):
  → Bundler loại bỏ code KHÔNG DÙNG!
  → Bundle nhẹ hơn → load nhanh hơn!

  ✅ CODE SPLITTING:
  → Dynamic import() → lazy loading!
  → Load modules KHI CẦN!

  ✅ TESTABILITY:
  → Mock/stub modules dễ dàng!
  → Test từng module ĐỘC LẬP!
```

```
NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ❌ CIRCULAR DEPENDENCIES:
  → Module A import B, B import A → LỖI!
  → Cần thiết kế LAYERS cẩn thận!

  ❌ BARREL FILE OVERHEAD:
  → export * có thể BREAK tree shaking!
  → Load nhiều hơn cần thiết!

  ❌ OVER-MODULARIZATION:
  → Quá nhiều files NHỎ → khó navigate!
  → File 3 dòng → overkill!
  → Cân bằng giữa modular vs toàn vẹn!

  ❌ BROWSER SUPPORT (ESM):
  → Cần bundler cho production!
  → Older browsers cần transpile!
  → <script type="module"> → waterfall loading!

  ❌ DEBUGGING:
  → Source maps cần thiết!
  → Stack traces qua modules → khó đọc!
```

---

## §17. Tóm tắt

```
MODULE PATTERN — TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Module Pattern là gì?"
  A: Chia code thành phần ĐỘC LẬP, TÁI SỬ DỤNG!
  Encapsulate: private data + public API!
  Tránh global scope pollution!

  Q: "IIFE Module?"
  A: (function() { return { publicAPI }; })();
  Closure giữ private state! ES5 cách duy nhất!
  Revealing Module: define all → reveal ở return!

  Q: "Named vs Default export?"
  A: Named: nhiều per module, {} required, đúng tên, tree shake tốt!
  Default: 1 per module, không {}, tên tùy ý, tree shake kém hơn!
  Recommend: Named exports cho consistency + IDE support!

  Q: "Dynamic import?"
  A: import() return Promise! Load module KHI CẦN!
  React.lazy() + Suspense! Route-based code splitting!
  Giảm initial bundle size!

  Q: "Tree Shaking?"
  A: Bundler loại bỏ code KHÔNG DÙNG!
  Chỉ ESM (static analysis!) Không hoạt động CommonJS!
  sideEffects: false trong package.json!

  Q: "CommonJS vs ESM?"
  A: CommonJS: sync, dynamic require(), Node.js legacy!
  ESM: static, tree shake, standard, import/export!
  ESM = TƯƠNG LAI! CommonJS = LEGACY!

  Q: "Circular deps?"
  A: A imports B, B imports A → undefined values!
  Fix: extract shared + lazy eval + dependency injection!
  Tool: madge --circular, eslint import/no-cycle!
```

---

### Checklist

- [ ] **Module concept**: encapsulation, reuse, namespace, dependency management!
- [ ] **IIFE Module (ES5)**: (function() { return {} })(); closure = private; return = public!
- [ ] **Revealing Module**: define TẤT CẢ private → reveal qua return object!
- [ ] **CommonJS**: require/module.exports; sync; cached; Node.js; KHÔNG tree shake!
- [ ] **Named exports**: export function/const; import { x }; NHIỀU per module; tree shake tốt!
- [ ] **Default export**: export default; import x; CHỈ 1 per module; tên tùy ý!
- [ ] **Named vs Default**: Named = IDE auto-complete + refactoring + tree shake; Default = convention React!
- [ ] **import \* as**: namespace import; math.add(); cẩn thận tree shake!
- [ ] **as keyword**: rename để TRÁNH naming collision; import { add as sum }!
- [ ] **Barrel pattern**: index.js re-exports; clean imports; CẢNH BÁO: export \* ảnh hưởng tree shake!
- [ ] **Dynamic import()**: return Promise; lazy load; React.lazy + Suspense; route splitting!
- [ ] **Tree Shaking**: ESM only; static analysis; loại bỏ unused code; sideEffects: false!
- [ ] **Circular deps**: A↔B → undefined; fix: extract shared, lazy eval, DI; madge --circular!
- [ ] **Module systems**: IIFE → CommonJS → AMD → ESM; ESM = chuẩn chính thức!
- [ ] **React modules**: 1 component = 1 file; private styles; public component export!

---

_Nguồn: patterns.dev — Module Pattern, MDN Web Docs (ES Modules, import, export), Node.js Docs_
_Cập nhật lần cuối: Tháng 2, 2026_
