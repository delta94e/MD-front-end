# Singleton Pattern — Deep Dive

> 📅 2026-02-14 · ⏱ 22 phút đọc
>
> Singleton Concept & Motivation,
> ES5 (IIFE/Closure) vs ES6 (Class/Module/Object.freeze),
> Counter Example & UserStore Example,
> Tradeoffs: Anti-pattern hay Useful?,
> Testing Challenges & Dependency Hiding,
> Global State: Redux vs React Hooks vs Singleton,
> Real-World Applications & Alternatives
> Độ khó: ⭐️⭐️⭐️⭐️ | Design Pattern

---

## Mục Lục

| #   | Phần                                      |
| --- | ----------------------------------------- |
| 1   | Singleton là gì?                          |
| 2   | Tại sao cần Singleton?                    |
| 3   | ES5 — Cách cũ (IIFE + Closure)            |
| 4   | ES6 — Class + Object.freeze               |
| 5   | ES6 — Object Literal (đơn giản nhất!)     |
| 6   | Counter Example — Step by Step            |
| 7   | UserStore Example — Real-World            |
| 8   | Tradeoffs — Ưu & Nhược điểm               |
| 9   | Testing Challenges                        |
| 10  | Dependency Hiding                         |
| 11  | Global State: Redux vs Hooks vs Singleton |
| 12  | Khi nào dùng Redux? Khi nào dùng Hooks?   |
| 13  | Real-World Applications                   |
| 14  | Alternatives — Module & Factory Pattern   |
| 15  | Tóm tắt                                   |

---

## §1. Singleton là gì?

```
SINGLETON PATTERN:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Class chỉ có THỂ tạo DUY NHẤT 1 INSTANCE!
  → Instance đó được SHARE TOÀN BỘ application!
  → Mọi nơi truy cập đều nhận CÙNG 1 object!

  VÍ DỤ THỰC TẾ:
  → Chính phủ: 1 quốc gia chỉ có 1 chính phủ!
  → "Chính phủ Việt Nam" = global access point!
  → Dù ai làm thủ tướng, title vẫn là 1!

  2 ĐẶC ĐIỂM CHÍNH:
  ┌────────────────────────────────────────────────────────┐
  │ ① Chỉ CÓ 1 instance duy nhất!                       │
  │   → new Counter() 100 lần → vẫn CÙNG 1 object!      │
  │                                                        │
  │ ② Global access point!                                │
  │   → Truy cập từ BẤT KỲ ĐÂU trong app!               │
  │   → Nhưng ĐƯỢC BẢO VỆ (không như global variable!)    │
  └────────────────────────────────────────────────────────┘

  ⚠️ VI PHẠM Single Responsibility Principle:
  → Giải quyết 2 vấn đề CÙNG LÚC:
    1. Kiểm soát số lượng instance!
    2. Cung cấp global access!
```

---

## §2. Tại sao cần Singleton?

```
USE CASES:
═══════════════════════════════════════════════════════════════

  ① CONFIG SETTINGS:
  → App cần 1 config object duy nhất!
  → Nhiều module đọc cùng config!
  → Không muốn tạo nhiều bản copy!

  ② DATABASE CONNECTION:
  → Connection pool chỉ cần 1!
  → Nhiều query dùng chung connection!
  → Tránh mở quá nhiều connections!

  ③ LOGGER:
  → 1 logger cho toàn app!
  → Tất cả module ghi log vào CÙNG chỗ!
  → Đảm bảo CONSISTENCY!

  ④ ANALYTICS / TRACKING:
  → 1 tracker instance!
  → Tránh gửi duplicate tracking calls!
  → VD: Google Analytics, Mixpanel!

  ⑤ APP STATE (Flux/Redux stores):
  → 1 store = single source of truth!
  → Tất cả components đọc CÙNG state!

  ⑥ CACHING:
  → 1 cache instance shared toàn app!
  → Tránh duplicate data trong memory!
```

---

## §3. ES5 — Cách cũ (IIFE + Closure)

```javascript
// ═══ ES5 SINGLETON — IIFE + CLOSURE ═══

var UserStore = (function () {
  // ── PRIVATE data (encapsulated bởi closure!) ──
  var _data = [];

  function add(item) {
    _data.push(item);
  }

  function get(id) {
    return _data.find(function (d) {
      return d.id === id;
    });
  }

  // ── PUBLIC interface ──
  return {
    add: add,
    get: get,
  };
})();

// Sử dụng:
UserStore.add({ id: 1, name: "Alice" });
UserStore.get(1); // { id: 1, name: 'Alice' }

// UserStore đã là singleton rồi!
// Vì IIFE chỉ chạy 1 LẦN!
// Kết quả = 1 object duy nhất!
```

```
VẤN ĐỀ VỚI CÁCH CŨ:
═══════════════════════════════════════════════════════════════

  ❌ VERBOSE: nhiều code, khó đọc!
  ❌ KHÔNG IMMUTABLE:
     → UserStore.add = function() { /* hack! */ };
     → Ai đó có thể GHI ĐÈ method!
  ❌ KHÔNG MODULE SYSTEM:
     → Dùng global variable!
     → UserStore = null; → PHÁ HỦY toàn bộ!
  ❌ KHÓ TEST:
     → Không reset được state!
     → Test phụ thuộc lẫn nhau!
```

---

## §4. ES6 — Class + Object.freeze

```javascript
// ═══ ES6 SINGLETON — CLASS (Cách 1: throw Error!) ═══

let instance;
let counter = 0;

class Counter {
  constructor() {
    if (instance) {
      throw new Error("You can only create one instance!");
    }
    instance = this;
  }

  getInstance() {
    return this;
  }

  getCount() {
    return counter;
  }

  increment() {
    return ++counter;
  }

  decrement() {
    return --counter;
  }
}

const singletonCounter = Object.freeze(new Counter());
export default singletonCounter;

// ✅ new Counter() lần 2 → THROW ERROR!
// ✅ Object.freeze → KHÔNG thể modify methods!
// ✅ export default → chỉ export INSTANCE, không export class!
```

```javascript
// ═══ ES6 SINGLETON — CLASS (Cách 2: static instance!) ═══

class Counter {
  constructor() {
    // Nếu đã có instance → trả về instance CŨ!
    if (Counter.instance) {
      return Counter.instance;
    }

    this.count = 0;
    Counter.instance = this;
  }

  getCount() {
    return this.count;
  }

  increment() {
    return ++this.count;
  }

  decrement() {
    return --this.count;
  }
}

const instance = new Counter();
Object.freeze(instance);
export default instance;

// KHÁC BIỆT với Cách 1:
// → Cách 1: THROW ERROR khi tạo lần 2!
// → Cách 2: TRẢ VỀ instance cũ (silent!)
// → Cách 2 thường được PREFER hơn!
```

```javascript
// ═══ ES6 SINGLETON — CLASS (Cách 3: static method!) ═══

class Database {
  // Private constructor (convention: không gọi new trực tiếp!)
  constructor(connectionString) {
    if (Database._instance) {
      throw new Error("Use Database.getInstance()!");
    }
    this.connectionString = connectionString;
    this.connected = false;
    Database._instance = this;
  }

  static getInstance(connectionString) {
    if (!Database._instance) {
      Database._instance = new Database(connectionString);
    }
    return Database._instance;
  }

  connect() {
    this.connected = true;
    console.log(`Connected to ${this.connectionString}`);
  }

  query(sql) {
    if (!this.connected) throw new Error("Not connected!");
    console.log(`Executing: ${sql}`);
  }
}

// Sử dụng:
const db1 = Database.getInstance("mongodb://localhost");
const db2 = Database.getInstance("mongodb://other-server");
console.log(db1 === db2); // true! Cùng 1 instance!
// connectionString vẫn là "mongodb://localhost"!
```

```
SO SÁNH 3 CÁCH:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬─────────────┬────────────┬────────────┐
  │ Cách             │ Throw Error │ Silent     │ Static     │
  │                  │             │ Return     │ Method     │
  ├──────────────────┼─────────────┼────────────┼────────────┤
  │ new lần 2?       │ ❌ Error!   │ ✅ Cùng   │ ❌ Error!  │
  │                  │             │ instance!  │            │
  │ API              │ new Class() │ new Class()│ Class      │
  │                  │             │            │.getInstance│
  │ OOP similarity?  │ ❌ Không   │ ⚠️ Gần    │ ✅ Giống   │
  │                  │             │            │ Java/C#!   │
  │ Readability      │ ✅ Rõ ràng │ ⚠️ Ẩn     │ ✅ Rõ      │
  │                  │             │ behavior!  │ intent!    │
  │ Recommend?       │ ⚠️ OK     │ ⚠️ OK     │ ✅ Best!   │
  └──────────────────┴─────────────┴────────────┴────────────┘
```

---

## §5. ES6 — Object Literal (đơn giản nhất!)

```javascript
// ═══ ES6 SINGLETON — OBJECT LITERAL (RECOMMENDED!) ═══

let count = 0;

const counter = {
  increment() {
    return ++count;
  },
  decrement() {
    return --count;
  },
  getCount() {
    return count;
  },
};

Object.freeze(counter);
export { counter };

// ✅ NGẮN GỌN nhất!
// ✅ Object.freeze → immutable!
// ✅ const → không thể reassign!
// ✅ ES6 module → biết CHÍNH XÁC ai import!
// ✅ Passed by reference → tất cả import cùng object!
```

```javascript
// ═══ USERSTORE — OBJECT LITERAL ═══

const _data = [];

const UserStore = {
  add: (item) => _data.push(item),
  get: (id) => _data.find((d) => d.id === id),
  getAll: () => [..._data], // Return copy, không expose internal!
  remove: (id) => {
    const index = _data.findIndex((d) => d.id === id);
    if (index > -1) _data.splice(index, 1);
  },
  clear: () => {
    _data.length = 0;
  },
};

Object.freeze(UserStore);
export default UserStore;
```

```
TẠI SAO OBJECT LITERAL TỐT HƠN CLASS:
═══════════════════════════════════════════════════════════════

  TRONG JAVASCRIPT:
  → Không CẦN class để tạo object!
  → Khác Java/C++: PHẢI có class → mới có object!
  → JS: const obj = {} → đã là singleton rồi!

  CLASS = OVERKILL nếu:
  → Không cần inheritance!
  → Không cần constructor logic!
  → Chỉ cần 1 object với methods!

  CLASS CÓ ÍCH khi:
  → Cần inheritance (extends!)
  → Team dùng OOP (Java/C# background!)
  → Flux stores: base class chung!
  → Complex initialization logic!
```

---

## §6. Counter Example — Step by Step

```javascript
// ═══ STEP 1: CLASS KHÔNG singleton — VẤN ĐỀ! ═══

let counter = 0;

class Counter {
  getInstance() {
    return this;
  }
  getCount() {
    return counter;
  }
  increment() {
    return ++counter;
  }
  decrement() {
    return --counter;
  }
}

const counter1 = new Counter();
const counter2 = new Counter();

console.log(counter1.getInstance() === counter2.getInstance());
// → FALSE! ← 2 instance KHÁC NHAU!

// VẤN ĐỀ: tạo bao nhiêu instance cũng được!
// → KHÔNG PHẢI singleton!
```

```javascript
// ═══ STEP 2: THÊM singleton check — FIX! ═══

let instance;
let counter = 0;

class Counter {
  constructor() {
    if (instance) {
      throw new Error("You can only create one instance!");
    }
    instance = this;
  }

  getInstance() {
    return this;
  }
  getCount() {
    return counter;
  }
  increment() {
    return ++counter;
  }
  decrement() {
    return --counter;
  }
}

const counter1 = new Counter(); // ✅ OK
const counter2 = new Counter(); // ❌ Error: You can only create one instance!
```

```javascript
// ═══ STEP 3: EXPORT frozen instance! ═══

// counter.js
let instance;
let counter = 0;

class Counter {
  constructor() {
    if (instance) throw new Error("You can only create one instance!");
    instance = this;
  }
  getInstance() {
    return this;
  }
  getCount() {
    return counter;
  }
  increment() {
    return ++counter;
  }
  decrement() {
    return --counter;
  }
}

const singletonCounter = Object.freeze(new Counter());
export default singletonCounter;

// ─── redButton.js ───
import Counter from "./counter.js";
const redBtn = document.getElementById("red");
redBtn.addEventListener("click", () => {
  Counter.increment();
  console.log("Red:", Counter.getCount());
});

// ─── blueButton.js ───
import Counter from "./counter.js";
const blueBtn = document.getElementById("blue");
blueBtn.addEventListener("click", () => {
  Counter.increment();
  console.log("Blue:", Counter.getCount());
});

// Click red → "Red: 1"
// Click blue → "Blue: 2"  ← CÙNG counter! Shared state!
// Click red → "Red: 3"
// → Cả 2 files import CÙNG 1 instance!
```

---

## §7. UserStore Example — Real-World

```javascript
// ═══ FLUX-STYLE STORE — SINGLETON ═══

// userStore.js
class UserStore {
  constructor() {
    if (UserStore._instance) {
      return UserStore._instance;
    }

    this._users = [];
    this._listeners = [];
    UserStore._instance = this;
  }

  // ── CRUD ──
  addUser(user) {
    this._users.push({ ...user, id: Date.now() });
    this._notify();
  }

  removeUser(id) {
    this._users = this._users.filter((u) => u.id !== id);
    this._notify();
  }

  updateUser(id, updates) {
    this._users = this._users.map((u) =>
      u.id === id ? { ...u, ...updates } : u,
    );
    this._notify();
  }

  getUser(id) {
    return this._users.find((u) => u.id === id);
  }

  getAllUsers() {
    return [...this._users]; // Return COPY!
  }

  // ── OBSERVER PATTERN ──
  subscribe(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }

  _notify() {
    this._listeners.forEach((l) => l(this._users));
  }

  // ── RESET (for testing!) ──
  _reset() {
    this._users = [];
    this._listeners = [];
  }
}

const instance = new UserStore();
Object.freeze(instance);
export default instance;
```

```javascript
// ═══ SỬ DỤNG TRONG REACT ═══

// UserList.jsx
import { useState, useEffect } from "react";
import userStore from "./userStore";

function UserList() {
  const [users, setUsers] = useState(userStore.getAllUsers());

  useEffect(() => {
    // Subscribe to store changes:
    const unsubscribe = userStore.subscribe((newUsers) => {
      setUsers([...newUsers]);
    });
    return unsubscribe;
  }, []);

  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>
          {u.name}
          <button onClick={() => userStore.removeUser(u.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}

// AddUser.jsx
import userStore from "./userStore";

function AddUser() {
  const [name, setName] = useState("");

  const handleAdd = () => {
    userStore.addUser({ name });
    setName("");
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleAdd}>Add User</button>
    </div>
  );
}

// CẢ HAI components dùng CÙNG userStore instance!
// AddUser thêm user → UserList TỰ ĐỘNG cập nhật!
```

---

## §8. Tradeoffs — Ưu & Nhược điểm

```
ƯU ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ TIẾT KIỆM MEMORY:
  → 1 instance thay vì N instances!
  → Đặc biệt quan trọng với heavy objects (DB connection!)

  ✅ GLOBAL ACCESS:
  → Truy cập từ bất kỳ đâu!
  → Không cần truyền qua props/params!

  ✅ LAZY INITIALIZATION:
  → Chỉ tạo KHI CẦN (getInstance lần đầu!)
  → Không tốn memory nếu không dùng!

  ✅ CONSISTENT STATE:
  → 1 source of truth!
  → Tất cả modules thấy CÙNG data!

  ✅ CONTROLLED ACCESS:
  → Khác global variable: ĐƯỢC BẢO VỆ!
  → Object.freeze → không thể modify!
```

```
NHƯỢC ĐIỂM (SINGLETON = ANTI-PATTERN?):
═══════════════════════════════════════════════════════════════

  ❌ GLOBAL MUTABLE STATE:
  → "Global variables are bad" → Singleton = global!
  → Nhiều nơi modify CÙNG state → KHÓ DEBUG!
  → Thứ tự thực thi QUAN TRỌNG → bugs ẩn!

  ❌ TIGHT COUPLING:
  → Modules phụ thuộc vào Singleton!
  → Khó thay thế implementation!
  → Khó refactor!

  ❌ KHÓ TEST (xem §9!)

  ❌ DEPENDENCY HIDING (xem §10!)

  ❌ VI PHẠM SINGLE RESPONSIBILITY:
  → Singleton giải quyết 2 vấn đề:
    1. Kiểm soát số instance!
    2. Cung cấp global access!
  → Theo SOLID: mỗi class CHỈ NÊN có 1 trách nhiệm!

  ❌ TRONG JS — OVERKILL:
  → JS có thể tạo object TRỰC TIẾP!
  → Không CẦN class!
  → ES6 modules ĐÃ LÀ singleton by default!
  → import { counter } → luôn cùng reference!
```

```
ES6 MODULES = TỰ NHIÊN SINGLETON:
═══════════════════════════════════════════════════════════════

  FACT: ES6 module chỉ chạy 1 LẦN!
  → Lần import đầu tiên: module EXECUTE!
  → Các lần sau: dùng CACHED result!
  → → EXPORT = SINGLETON by default!

  // config.js
  export const config = {
      apiUrl: 'https://api.example.com',
      timeout: 5000,
  };
  // config LUÔN LUÔN là CÙNG 1 object!
  // Bất kể import bao nhiêu lần!
  // → ĐÃ LÀ SINGLETON rồi!
  // → KHÔNG CẦN class Singleton pattern!
```

---

## §9. Testing Challenges

```javascript
// ═══ TESTING VẤN ĐỀ — SHARED STATE! ═══

// counter.test.js
import Counter from "../src/counter";

test("incrementing 1 time should be 1", () => {
  Counter.increment();
  expect(Counter.getCount()).toBe(1); // ✅ PASS!
});

test("incrementing 3 extra times should be 4", () => {
  Counter.increment();
  Counter.increment();
  Counter.increment();
  expect(Counter.getCount()).toBe(4); // ✅ PASS!
  // → Nhưng test này PHỤ THUỘC test trước!
  // → counter = 1 (từ test trước) + 3 = 4!
});

test("decrementing 1 time should be 3", () => {
  Counter.decrement();
  expect(Counter.getCount()).toBe(3); // ✅ PASS!
  // → counter = 4 (từ test trước) - 1 = 3!
});

// ⚠️ VẤN ĐỀ:
// → Test 2 PHỤ THUỘC kết quả test 1!
// → Test 3 PHỤ THUỘC kết quả test 2!
// → ĐỔI THỨ TỰ test → FAIL!
// → 1 test fail → CẢ SUITE fail!
// → KHÔNG isolated!
```

```javascript
// ═══ FIX: RESET trước mỗi test! ═══

import Counter from "../src/counter";

// Reset TRƯỚC mỗi test:
beforeEach(() => {
  Counter._reset(); // Cần thêm _reset method!
});

test("incrementing 1 time should be 1", () => {
  Counter.increment();
  expect(Counter.getCount()).toBe(1); // ✅
});

test("incrementing 3 times should be 3", () => {
  Counter.increment();
  Counter.increment();
  Counter.increment();
  expect(Counter.getCount()).toBe(3); // ✅ ISOLATED!
});

test("decrementing 1 time should be -1", () => {
  Counter.decrement();
  expect(Counter.getCount()).toBe(-1); // ✅ ISOLATED!
});

// ✅ Mỗi test INDEPENDENT!
// ✅ Đổi thứ tự → vẫn PASS!
// ❌ Nhưng cần THÊM _reset method vào Singleton!
// ❌ _reset = testing backdoor, không nên có trong production!
```

---

## §10. Dependency Hiding

```javascript
// ═══ DEPENDENCY HIDING — VẤN ĐỀ NGẦM ═══

// superCounter.js
import Counter from "./counter"; // ← Import Singleton!

export default class SuperCounter {
  constructor() {
    this.count = 0;
  }

  increment() {
    Counter.increment(); // ← MODIFY Singleton! ẨN!
    return (this.count += 100);
  }

  decrement() {
    Counter.decrement(); // ← MODIFY Singleton! ẨN!
    return (this.count -= 100);
  }
}

// ─── index.js ───
import Counter from "./counter";
import SuperCounter from "./superCounter";

const super1 = new SuperCounter();
super1.increment(); // super1.count = 100

// BẤT NGỜ:
console.log(Counter.getCount()); // → 1 ← BỊ MODIFY!
// Ai modify Counter? Làm sao biết?
// → SuperCounter SECRETLY modify Counter!
// → DEPENDENCY HIDING!
```

```
VẤN ĐỀ DEPENDENCY HIDING:
═══════════════════════════════════════════════════════════════

  KHI IMPORT superCounter.js:
  → KHÔNG BIẾT nó modify Singleton khác!
  → Side effect ẨN!
  → Debug CỰC KHÓ trong app lớn!

  VD: Bạn đọc index.js:
  → "Tôi chỉ import Counter và SuperCounter"
  → "Tôi không gọi Counter.increment()"
  → "Tại sao Counter.getCount() = 1???"
  → → Phải đào sâu vào SuperCounter mới biết!

  GIẢI PHÁP:
  → EXPLICIT dependencies (Dependency Injection!)
  → Truyền dependencies qua CONSTRUCTOR/PARAMS!
  → Không import TRỰC TIẾP Singleton bên trong class!
```

---

## §11. Global State: Redux vs Hooks vs Singleton

```
SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬──────────────────────────────────────────┐
  │ Singleton      │ ❌ MUTABLE state!                       │
  │                │ → Ai cũng có thể modify TRỰC TIẾP!      │
  │                │ → KHÔNG kiểm soát được ai thay đổi gì!  │
  │                │ → Thứ tự mutation = bugs!                │
  ├────────────────┼──────────────────────────────────────────┤
  │ Redux          │ ✅ READ-ONLY state!                     │
  │                │ → Chỉ PURE REDUCERS mới update state!   │
  │                │ → Component dispatch ACTION!             │
  │                │ → STATE → VIEW (one-way!)               │
  │                │ → PREDICTABLE, TRACEABLE!                │
  ├────────────────┼──────────────────────────────────────────┤
  │ React Context  │ ⚠️ READ-ONLY (qua Provider!)           │
  │                │ → Re-render TẤT CẢ consumers!           │
  │                │ → Tốt cho: theme, auth, locale!         │
  │                │ → KHÔNG tốt cho: frequent updates!       │
  ├────────────────┼──────────────────────────────────────────┤
  │ React Hooks    │ ✅ Component-level state!               │
  │                │ → useState, useReducer!                  │
  │                │ → Local, ephemeral!                      │
  │                │ → KHÔNG share giữa components!           │
  └────────────────┴──────────────────────────────────────────┘
```

```
REDUX = SINGLETON NHƯNG TỐT HƠN:
═══════════════════════════════════════════════════════════════

  Q: "Redux dùng 1 store → cũng là singleton → cũng anti-pattern?"
  A: KHÔNG! Vì:

  SINGLETON (thường):
  → Shared MUTABLE state!
  → BẤT KỲ AI cũng modify TRỰC TIẾP!
  → → ĐÂY là anti-pattern!

  REDUX:
  → Shared state NHƯNG:
  → ① ENCAPSULATED: không modify trực tiếp!
  → ② MESSAGE PASSING: chỉ dispatch actions!
  → ③ PURE REDUCERS: state update PREDICTABLE!
  → ④ TIME TRAVEL: debug bằng action history!
  → ⑤ DETERMINISTIC: cùng actions → cùng state!

  → → REDUX giải quyết VẤN ĐỀ THỰC SỰ
       của singleton (mutable state!)
  → → Giữ LẠI lợi ích (single source of truth!)
```

---

## §12. Khi nào dùng Redux? Khi nào dùng Hooks?

```
HOOKS THAY THẾ GÌ?
═══════════════════════════════════════════════════════════════

  ✅ HOOKS THAY THẾ:
  → Class components → functional + hooks!
  → Render prop pattern → custom hooks!
  → Local component state → useState!
  → Complex local state → useReducer!

  ❌ HOOKS KHÔNG THAY THẾ:
  → Redux (application state!)
  → Higher-Order Components (cross-cutting concerns!)
  → Container/Presentation pattern (separation of concerns!)

  QUY TẮC ĐƠN GIẢN:
  ┌────────────────────────────────────────────────────────┐
  │ "Component state for component state,                  │
  │  Redux for application state."                         │
  └────────────────────────────────────────────────────────┘
```

```
KHI NÀO DÙNG HOOKS (useState/useReducer):
═══════════════════════════════════════════════════════════════

  ✅ Dùng hooks KHI component:
  → KHÔNG dùng network/API!
  → KHÔNG save/load state (persist!)
  → KHÔNG share state với non-child components!
  → CẦN ephemeral local state (form inputs!)

  VD: Form input states!
  → Name, email fields → useState!
  → Chỉ component ĐÓ cần → KHÔNG cần Redux!
```

```javascript
// ═══ VÍ DỤ: LOCAL STATE → HOOKS ═══

import { useState } from "react";

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // name + email = EPHEMERAL!
  // Chỉ component này cần!
  // → useState là ĐỦ!

  return (
    <form>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
    </form>
  );
}
```

```
KHI NÀO DÙNG REDUX:
═══════════════════════════════════════════════════════════════

  ✅ Dùng Redux KHI component:
  → Dùng I/O (network, device APIs!)
  → Saves/loads state (persistence!)
  → Share state với NON-CHILD components!
  → Business logic/data processing SHARED!

  REDUX PRIMARY SELLING POINTS:
  ① Deterministic state resolution!
  ② Transactional state!
  ③ Isolate state management from I/O!
  ④ Single source of truth!
  ⑤ Easy sharing between components!
  ⑥ Transaction telemetry (auto-logging!)
  ⑦ Time travel debugging!
```

```javascript
// ═══ VÍ DỤ: APPLICATION STATE → REDUX ═══

import { useDispatch, useSelector } from "react-redux";
import { addHolder, removeHolder, getHolders } from "./purchase-reducer";

function PurchasePage() {
  const dispatch = useDispatch();
  const holders = useSelector(getHolders);

  // holders = APPLICATION STATE!
  // Shared giữa nhiều components!
  // Cần persist + sync!
  // → Redux là ĐÚNG choice!

  return (
    <Purchase
      addHolder={(data) => dispatch(addHolder(data))}
      removeHolder={(id) => dispatch(removeHolder(id))}
      holders={holders}
    />
  );
}
```

```
MIX & MATCH — HOÀN TOÀN OK:
═══════════════════════════════════════════════════════════════

  CÙNG 1 component có thể dùng CẢ HAI:
  → useState cho LOCAL form state!
  → Redux cho SHARED application state!
  → KHÔNG phải chọn 1 trong 2!

  "Should I put EVERYTHING in Redux?"
  → KHÔNG! Chỉ đưa vào Redux khi CÓ LÝ DO!
  → Ephemeral state (form inputs) → hooks!
  → Shared/persisted state → Redux!

  "Single source of truth = all in Redux?"
  → KHÔNG! Single source of truth ≠ single source!
  → MỖI piece of state có 1 source of truth!
  → Form input → source = component state!
  → User cart → source = Redux!
  → URL → source = browser location!
```

```
connect vs hooks API (react-redux):
═══════════════════════════════════════════════════════════════

  ┌────────────────┬──────────────────────────────────────────┐
  │ connect()      │ useSelector + useDispatch                │
  ├────────────────┼──────────────────────────────────────────┤
  │ HOC pattern    │ Hook pattern                             │
  │ Reusable!      │ Single component!                        │
  │ mapStateToProps│ useSelector(selector)                     │
  │ + mapDispatch  │ useDispatch()                             │
  │ Verbose        │ ✅ MORE READABLE!                        │
  │ Curried API    │ Direct usage!                             │
  └────────────────┴──────────────────────────────────────────┘

  → Cần reuse connection? → connect()!
  → Single component? → hooks API!
  → Prefer hooks cho READABILITY!
```

---

## §13. Real-World Applications

```javascript
// ═══ CONFIG MANAGER — SINGLETON ═══

class ConfigManager {
  constructor() {
    if (ConfigManager._instance) {
      return ConfigManager._instance;
    }

    this._config = {
      apiUrl: process.env.API_URL || "http://localhost:3000",
      timeout: 5000,
      retries: 3,
      debug: process.env.NODE_ENV !== "production",
    };

    ConfigManager._instance = this;
    Object.freeze(this._config);
  }

  get(key) {
    return this._config[key];
  }

  getAll() {
    return { ...this._config };
  }
}

export default new ConfigManager();
```

```javascript
// ═══ LOGGER — SINGLETON ═══

class Logger {
  constructor() {
    if (Logger._instance) return Logger._instance;

    this._logs = [];
    this._level = "info"; // 'debug' | 'info' | 'warn' | 'error'
    Logger._instance = this;
  }

  static getInstance() {
    if (!Logger._instance) new Logger();
    return Logger._instance;
  }

  _shouldLog(level) {
    const levels = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this._level);
  }

  _log(level, message, data) {
    if (!this._shouldLog(level)) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
    this._logs.push(entry);
    console[level](
      `[${entry.timestamp}] [${level.toUpperCase()}]`,
      message,
      data || "",
    );
  }

  debug(msg, data) {
    this._log("debug", msg, data);
  }
  info(msg, data) {
    this._log("info", msg, data);
  }
  warn(msg, data) {
    this._log("warn", msg, data);
  }
  error(msg, data) {
    this._log("error", msg, data);
  }

  getLogs() {
    return [...this._logs];
  }
  setLevel(level) {
    this._level = level;
  }
}

export default Logger.getInstance();

// Sử dụng:
// import logger from './logger';
// logger.info('User logged in', { userId: 123 });
// logger.error('Payment failed', { orderId: 456 });
```

```javascript
// ═══ EVENT BUS — SINGLETON ═══

class EventBus {
  constructor() {
    if (EventBus._instance) return EventBus._instance;
    this._listeners = new Map();
    EventBus._instance = this;
  }

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);

    // Return unsubscribe function:
    return () => {
      const cbs = this._listeners.get(event);
      const idx = cbs.indexOf(callback);
      if (idx > -1) cbs.splice(idx, 1);
    };
  }

  emit(event, data) {
    const callbacks = this._listeners.get(event) || [];
    callbacks.forEach((cb) => cb(data));
  }

  off(event) {
    this._listeners.delete(event);
  }
}

export default new EventBus();

// Sử dụng:
// import eventBus from './eventBus';
// const unsub = eventBus.on('user:login', (user) => { ... });
// eventBus.emit('user:login', { id: 1, name: 'Alice' });
// unsub(); // Cleanup!
```

---

## §14. Alternatives — Module & Factory Pattern

```javascript
// ═══ ALTERNATIVE 1: MODULE PATTERN ═══
// (ES6 module = TỰ NHIÊN là singleton!)

// api.js
const BASE_URL = "https://api.example.com";
let token = null;

export function setToken(t) {
  token = t;
}

export async function fetchData(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// → Mỗi file import api.js → cùng token, cùng BASE_URL!
// → KHÔNG CẦN class Singleton!
// → Module đã là singleton rồi!
```

```javascript
// ═══ ALTERNATIVE 2: FACTORY PATTERN ═══

function createLogger(config = {}) {
  const level = config.level || "info";
  const logs = [];

  return {
    log(msg) {
      logs.push({ msg, time: Date.now() });
      console.log(msg);
    },
    getLogs() {
      return [...logs];
    },
    getLevel() {
      return level;
    },
  };
}

// TẠO NHIỀU logger KHÁC NHAU:
const appLogger = createLogger({ level: "info" });
const debugLogger = createLogger({ level: "debug" });

// ĐỬÔ ĐIỂM:
// → Linh hoạt!
// → Mỗi context có logger riêng!
// → DỄ TEST (tạo instance mới cho mỗi test!)
// → KHÔNG global mutable state!
```

```
SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬─────────────┬─────────────┬────────────┐
  │                │ Singleton   │ Module      │ Factory    │
  ├────────────────┼─────────────┼─────────────┼────────────┤
  │ Instances      │ 1           │ 1 (cached!) │ Unlimited  │
  │ Global?        │ ✅          │ ✅ (export) │ ❌ Local   │
  │ Mutable?       │ ⚠️ Tùy    │ ⚠️ Tùy     │ ✅ Per-    │
  │                │             │             │ instance!  │
  │ Testable?      │ ❌ Khó     │ ⚠️ Medium  │ ✅ Dễ!    │
  │ OOP?           │ ✅ Class   │ ❌ No class │ ❌ No class│
  │ Complexity     │ Medium      │ ✅ Thấp    │ ✅ Thấp   │
  │ Use case       │ DB, Config  │ Utils, API  │ Per-context│
  │                │ Logger!     │ Helpers!    │ instances! │
  └────────────────┴─────────────┴─────────────┴────────────┘

  💡 TRONG JS:
  → PHẦN LỚN cases → ES6 MODULE là đủ!
  → Singleton class CHỈ CẦN khi:
    → Backend/OOP team (Java/C# mindset!)
    → Cần lazy initialization!
    → Cần complex constructor logic!
    → Cần getInstance() pattern cho consistency!
```

---

## §15. Tóm tắt

```
SINGLETON PATTERN — TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Singleton là gì?"
  A: Class chỉ tạo được 1 instance, global access!
  VD: Database connection, Logger, Config!

  Q: "Implement trong JS?"
  A: 3 cách:
  ① ES5: IIFE + closure (cũ, verbose!)
  ② ES6 class: constructor check + Object.freeze!
  ③ ES6 object literal: export frozen object (BEST!)

  Q: "Tại sao là anti-pattern?"
  A: Global mutable state! Tight coupling!
  Khó test! Dependency hiding!
  Vi phạm Single Responsibility!

  Q: "Redux có phải singleton?"
  A: CÓ 1 store, nhưng KHÔNG phải anti-pattern vì:
  READ-ONLY state + pure reducers + message passing!
  → Giải quyết vấn đề mutable state!

  Q: "Singleton vs Module?"
  A: ES6 modules TỰ NHIÊN là singleton!
  Module chạy 1 lần, export cached!
  → Class singleton = OVERKILL trong JS!

  Q: "Redux vs Hooks?"
  A: KHÔNG thay thế! MIX & MATCH!
  Hooks = component state (local, ephemeral!)
  Redux = application state (shared, persisted!)
```

---

### Checklist

- [ ] **Singleton concept**: 1 instance duy nhất + global access point!
- [ ] **ES5 IIFE**: closure encapsulate private data, return public API; verbose + không immutable!
- [ ] **ES6 Class**: constructor check `if (instance)` → throw/return; Object.freeze; export instance!
- [ ] **ES6 Object Literal**: `const obj = {}` + Object.freeze + export → đơn giản nhất, RECOMMENDED!
- [ ] **Static getInstance()**: giống Java/C# pattern; lazy initialization; tốt cho OOP teams!
- [ ] **Object.freeze**: ngăn modify methods/properties; const ngăn reassign; cả 2 cần DÙNG!
- [ ] **ES6 modules = natural singleton**: module chạy 1 lần, export cached, KHÔNG cần class pattern!
- [ ] **Anti-pattern reasons**: global mutable state, tight coupling, testing khó, dependency hiding!
- [ ] **Testing**: shared state giữa tests → phụ thuộc thứ tự; cần `_reset()`; dùng beforeEach!
- [ ] **Dependency hiding**: module A import singleton → modify ẩn → module B bất ngờ; explicit deps!
- [ ] **Redux vs Singleton**: Redux = controlled singleton (read-only + pure reducers + actions)!
- [ ] **Hooks vs Redux**: hooks = component state (ephemeral); Redux = app state (shared/persisted); MIX & MATCH!
- [ ] **Real-world**: ConfigManager, Logger, EventBus, Analytics tracker, DB connection pool!
- [ ] **Alternatives**: Module pattern (simple!), Factory pattern (testable, per-context instances!)

---

_Nguồn: patterns.dev — Singleton Pattern, refactoring.guru, Eric Elliott — "Do React Hooks Replace Redux?"_
_Cập nhật lần cuối: Tháng 2, 2026_
