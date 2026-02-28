# Mediator / Middleware Pattern — Deep Dive

> 📅 2026-02-15 · ⏱ 22 phút đọc
>
> Mediator Concept & Central Point,
> ChatRoom Example, Air Traffic Controller,
> Express.js Middleware Pipeline,
> Custom Middleware Engine,
> Event Bus vs Mediator,
> Redux Middleware (Thunk, Saga),
> Koa Middleware (Onion Model),
> Real-World Applications & Tradeoffs
> Độ khó: ⭐️⭐️⭐️⭐️ | Design Pattern

---

## Mục Lục

| #   | Phần                                    |
| --- | --------------------------------------- |
| 1   | Mediator Pattern là gì?                 |
| 2   | ChatRoom — Ví dụ kinh điển              |
| 3   | Mediator nâng cao — Broadcast & Private |
| 4   | Middleware Pattern là gì?               |
| 5   | Express.js Middleware                   |
| 6   | Custom Middleware Engine                |
| 7   | Koa Middleware — Onion Model            |
| 8   | Redux Middleware                        |
| 9   | Mediator vs Observer vs Pub/Sub         |
| 10  | Event Bus — Lightweight Mediator        |
| 11  | Real-World Applications                 |
| 12  | Tradeoffs — Ưu & Nhược điểm             |
| 13  | Tóm tắt                                 |

---

## §1. Mediator Pattern là gì?

```
MEDIATOR PATTERN — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Mediator = ĐIỂM TRUNG TÂM xử lý giao tiếp!
  → Components KHÔNG NÓI trực tiếp với nhau!
  → Tất cả giao tiếp ĐI QUA Mediator!
  → Mediator NHẬN request → CHUYỂN TIẾP đến nơi cần!
  → → Giảm many-to-many → thành many-to-ONE-to-many!

  VÍ DỤ THỰC TẾ: KIỂM SOÁT VIÊN KHÔNG LƯU!
  → Phi công (Pilot) = Component!
  → Đài kiểm soát (ATC) = MEDIATOR!
  → Phi công KHÔNG NÓI trực tiếp với nhau!
  → → Sẽ rất HỖN LOẠN!
  → Phi công nói với ATC → ATC chuyển thông tin → phi công khác!
  → ATC biết TẤT CẢ vị trí → điều phối AN TOÀN!
```

```
KHÔNG CÓ MEDIATOR vs CÓ MEDIATOR:
═══════════════════════════════════════════════════════════════

  ❌ KHÔNG CÓ MEDIATOR (many-to-many!):

    A ←──→ B
    ↕ ╲  ╱ ↕
    ↕  ╳   ↕
    ↕ ╱  ╲ ↕
    C ←──→ D

  → MỌI component nói với MỌI component!
  → 4 components = 6 connections!
  → N components = N*(N-1)/2 connections!
  → THÊM 1 component = sửa TẤT CẢ!
  → → HỖN LOẠN! TIGHT COUPLING!

  ✅ CÓ MEDIATOR (many-to-one-to-many!):

    A ──→ ┌─────────┐ ──→ B
           │ MEDIATOR│
    C ──→ │         │ ──→ D
           └─────────┘

  → MỌI component chỉ biết MEDIATOR!
  → 4 components = 4 connections!
  → N components = N connections!
  → THÊM 1 component = chỉ đăng ký với Mediator!
  → → SẠCH! LOOSE COUPLING!
```

---

## §2. ChatRoom — Ví dụ kinh điển

```javascript
// ═══ CHATROOM MEDIATOR — CƠ BẢN ═══

class ChatRoom {
  logMessage(user, message) {
    const time = new Date().toLocaleString();
    const sender = user.getName();
    console.log(`${time} [${sender}]: ${message}`);
  }
}

class User {
  constructor(name, chatroom) {
    this.name = name;
    this.chatroom = chatroom; // Reference tới MEDIATOR!
  }

  getName() {
    return this.name;
  }

  send(message) {
    // GỬI qua MEDIATOR, không gửi trực tiếp!
    this.chatroom.logMessage(this, message);
  }
}

// SỬ DỤNG:
const chatroom = new ChatRoom();

const user1 = new User("John Doe", chatroom);
const user2 = new User("Jane Doe", chatroom);

user1.send("Hi there!");
// → "2/15/2026, 12:00:00 AM [John Doe]: Hi there!"

user2.send("Hey!");
// → "2/15/2026, 12:00:01 AM [Jane Doe]: Hey!"

// user1 KHÔNG BIẾT user2!
// user2 KHÔNG BIẾT user1!
// Cả hai CHỈ BIẾT chatroom (MEDIATOR!)
```

```
CHATROOM — LUỒNG HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  user1.send("Hi there!")
      │
      ▼
  this.chatroom.logMessage(this, "Hi there!")
      │
      ▼ MEDIATOR xử lý:
  ┌──────────────────────────────────────────┐
  │  ChatRoom (MEDIATOR!)                    │
  │  → Nhận: user = user1, msg = "Hi there!"│
  │  → Format: timestamp + sender + message  │
  │  → Output: log, broadcast, lưu DB...    │
  └──────────────────────────────────────────┘
      │
      ▼
  Console: "2/15/2026 [John Doe]: Hi there!"

  → User CHỈ gọi chatroom.logMessage()!
  → User KHÔNG BIẾT message đi đâu!
  → Mediator QUYẾT ĐỊNH xử lý thế nào!
```

---

## §3. Mediator nâng cao — Broadcast & Private

```javascript
// ═══ CHATROOM MEDIATOR — ĐẦY ĐỦ ═══

class ChatRoom {
  constructor(name) {
    this.name = name;
    this.users = new Map(); // username → User!
    this.history = [];
  }

  // ĐĂNG KÝ user:
  join(user) {
    this.users.set(user.name, user);
    user.chatroom = this;
    this.broadcast("System", `${user.name} đã tham gia phòng!`);
  }

  // RỜI phòng:
  leave(user) {
    this.users.delete(user.name);
    user.chatroom = null;
    this.broadcast("System", `${user.name} đã rời phòng!`);
  }

  // GỬI cho TẤT CẢ (trừ sender):
  broadcast(senderName, message) {
    const entry = {
      time: new Date(),
      sender: senderName,
      message,
      type: "broadcast",
    };
    this.history.push(entry);

    for (const [name, user] of this.users) {
      if (name !== senderName) {
        user.receive(senderName, message);
      }
    }
  }

  // GỬI RIÊNG cho 1 user:
  privateMessage(sender, receiverName, message) {
    const receiver = this.users.get(receiverName);
    if (!receiver) {
      sender.receive("System", `User "${receiverName}" không tồn tại!`);
      return;
    }

    const entry = {
      time: new Date(),
      sender: sender.name,
      receiver: receiverName,
      message,
      type: "private",
    };
    this.history.push(entry);

    receiver.receive(sender.name, `[Riêng] ${message}`);
  }

  // Lấy lịch sử:
  getHistory(limit = 50) {
    return this.history.slice(-limit);
  }

  // Danh sách online:
  getOnlineUsers() {
    return [...this.users.keys()];
  }
}

class User {
  constructor(name) {
    this.name = name;
    this.chatroom = null;
    this.inbox = [];
  }

  getName() {
    return this.name;
  }

  // GỬI broadcast QUA mediator:
  send(message) {
    if (!this.chatroom) throw new Error("Chưa join phòng!");
    this.chatroom.broadcast(this.name, message);
  }

  // GỬI riêng QUA mediator:
  sendTo(receiverName, message) {
    if (!this.chatroom) throw new Error("Chưa join phòng!");
    this.chatroom.privateMessage(this, receiverName, message);
  }

  // NHẬN message (mediator gọi!):
  receive(senderName, message) {
    const entry = `${senderName}: ${message}`;
    this.inbox.push(entry);
    console.log(`[${this.name}] ← ${entry}`);
  }
}

// ═══ SỬ DỤNG ═══

const room = new ChatRoom("General");

const john = new User("John");
const jane = new User("Jane");
const bob = new User("Bob");

room.join(john);
// → [Jane] ← System: John đã tham gia phòng! (nếu Jane đã join)

room.join(jane);
// → [John] ← System: Jane đã tham gia phòng!

room.join(bob);
// → [John] ← System: Bob đã tham gia phòng!
// → [Jane] ← System: Bob đã tham gia phòng!

john.send("Hello everyone!");
// → [Jane] ← John: Hello everyone!
// → [Bob] ← John: Hello everyone!

jane.sendTo("John", "Psst, secret!");
// → [John] ← Jane: [Riêng] Psst, secret!
// → Bob KHÔNG thấy!

room.getOnlineUsers(); // ["John", "Jane", "Bob"]
```

---

## §4. Middleware Pattern là gì?

```
MIDDLEWARE PATTERN — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Middleware = CHUỖI functions xử lý TUẦN TỰ!
  → Request đi qua TỪNG middleware!
  → Mỗi middleware CÓ THỂ:
    → Đọc/sửa request!
    → Đọc/sửa response!
    → Gọi next() → middleware TIẾP THEO!
    → Dừng chain → KHÔNG gọi next()!

  VÍ DỤ THỰC TẾ: DÂY CHUYỀN SẢN XUẤT!
  → Nguyên liệu (Request!) đi vào!
  → Trạm 1: Kiểm tra chất lượng (validation!)
  → Trạm 2: Đóng gói (formatting!)
  → Trạm 3: Dán nhãn (headers!)
  → Trạm 4: Xuất kho (response!)
  → Mỗi trạm = 1 MIDDLEWARE!
```

```
MIDDLEWARE PIPELINE:
═══════════════════════════════════════════════════════════════

  Request
    │
    ▼
  ┌──────────────────┐
  │ Middleware 1      │  → Logger: log request!
  │ next() ──────────│──┐
  └──────────────────┘  │
                         ▼
  ┌──────────────────┐
  │ Middleware 2      │  → Auth: kiểm tra token!
  │ next() ──────────│──┐
  └──────────────────┘  │
                         ▼
  ┌──────────────────┐
  │ Middleware 3      │  → Validator: validate body!
  │ next() ──────────│──┐
  └──────────────────┘  │
                         ▼
  ┌──────────────────┐
  │ Route Handler    │  → Xử lý business logic!
  │ res.send()       │  → Trả response!
  └──────────────────┘
    │
    ▼
  Response

  → Mỗi middleware GỌI next() để chuyển tiếp!
  → KHÔNG gọi next() → chain DỪNG!
  → Auth middleware thất bại → res.status(401) → DỪNG!
```

---

## §5. Express.js Middleware

```javascript
// ═══ EXPRESS.JS MIDDLEWARE — THỰC TẾ ═══

const express = require("express");
const app = express();

// ① LOGGER Middleware:
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`→ ${req.method} ${req.url}`);

  // Hook vào response finish:
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`← ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
  });

  next(); // → Middleware tiếp theo!
});

// ② ADD HEADER Middleware:
app.use("/", (req, res, next) => {
  req.headers["test-header"] = 1234;
  next(); // → Middleware tiếp theo!
});

// ③ CHECK HEADER Middleware:
app.use("/", (req, res, next) => {
  console.log(`Has test header: ${!!req.headers["test-header"]}`);
  // → true! Vì middleware ② đã thêm!
  next();
});

// ④ AUTH Middleware:
function authMiddleware(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).json({ error: "No token provided!" });
    // ← KHÔNG gọi next() → chain DỪNG!
  }
  try {
    req.user = verifyToken(token);
    next(); // Token valid → tiếp tục!
  } catch (err) {
    res.status(403).json({ error: "Invalid token!" });
    // ← DỪNG!
  }
}

// ⑤ ROUTE HANDLER:
app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});

// Protected route:
app.get("/profile", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.listen(3000);
```

```javascript
// ═══ EXPRESS MIDDLEWARE TYPES ═══

// ① APPLICATION-LEVEL: app.use()
app.use(cors()); // Mọi route!
app.use(express.json()); // Parse JSON body!
app.use(express.urlencoded()); // Parse form data!

// ② ROUTER-LEVEL: router.use()
const router = express.Router();
router.use(authMiddleware); // Chỉ cho router này!
router.get("/users", getUsers);

// ③ ERROR-HANDLING: 4 parameters!
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// ④ BUILT-IN:
app.use(express.static("public")); // Serve static files!

// ⑤ THIRD-PARTY:
const helmet = require("helmet");
const morgan = require("morgan");
app.use(helmet()); // Security headers!
app.use(morgan("dev")); // Request logging!
```

```
EXPRESS MIDDLEWARE — KEY POINTS:
═══════════════════════════════════════════════════════════════

  ① next() = GỌI middleware tiếp theo!
  ② Không next() = chain DỪNG!
  ③ next(err) = NHẢY tới error handler!
  ④ THỨ TỰ app.use() = thứ tự CHẠY!
  ⑤ req, res = SHARED object → middleware SỬA → middleware sau THẤY!
  ⑥ Middleware CÓ THỂ async:
     app.use(async (req, res, next) => {
         try {
             await someAsyncWork();
             next();
         } catch (err) {
             next(err); // → Error handler!
         }
     });
```

---

## §6. Custom Middleware Engine

```javascript
// ═══ TỰ BUILD MIDDLEWARE ENGINE ═══

class MiddlewareEngine {
  constructor() {
    this.middlewares = [];
  }

  // ĐĂNG KÝ middleware:
  use(fn) {
    this.middlewares.push(fn);
    return this; // Chaining!
  }

  // CHẠY pipeline:
  execute(context) {
    return this._compose(this.middlewares)(context);
  }

  // COMPOSE middlewares thành 1 function:
  _compose(middlewares) {
    return function (context) {
      let index = -1;

      function dispatch(i) {
        // Đã gọi next() 2 lần? → Error!
        if (i <= index) {
          return Promise.reject(new Error("next() called multiple times!"));
        }
        index = i;

        const fn = middlewares[i];
        if (!fn) return Promise.resolve(); // Hết middleware!

        try {
          // Gọi middleware, truyền next = dispatch(i+1):
          return Promise.resolve(fn(context, () => dispatch(i + 1)));
        } catch (err) {
          return Promise.reject(err);
        }
      }

      return dispatch(0); // Bắt đầu từ middleware đầu tiên!
    };
  }
}

// ═══ SỬ DỤNG ═══

const engine = new MiddlewareEngine();

// Logger:
engine.use(async (ctx, next) => {
  const start = Date.now();
  console.log(`→ Request: ${ctx.method} ${ctx.path}`);
  await next();
  console.log(`← Response: ${ctx.status} (${Date.now() - start}ms)`);
});

// Auth:
engine.use(async (ctx, next) => {
  if (!ctx.token) {
    ctx.status = 401;
    ctx.body = { error: "Unauthorized!" };
    return; // DỪNG chain!
  }
  ctx.user = { id: 1, name: "John" };
  await next();
});

// Handler:
engine.use(async (ctx, next) => {
  ctx.status = 200;
  ctx.body = { message: `Hello, ${ctx.user.name}!` };
  await next();
});

// Execute:
const ctx = { method: "GET", path: "/api/users", token: "abc123" };
engine.execute(ctx).then(() => {
  console.log("Result:", ctx.body);
});
// → Request: GET /api/users
// → Response: 200 (2ms)
// → Result: { message: "Hello, John!" }
```

```javascript
// ═══ VALIDATION MIDDLEWARE — PIPELINE ═══

function createValidationPipeline(...validators) {
  return function validate(data) {
    const errors = [];

    for (const validator of validators) {
      const result = validator(data);
      if (result) errors.push(result);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };
}

// Validators (mỗi cái = 1 middleware!):
const requireEmail = (data) => (!data.email ? "Email is required!" : null);

const validateEmailFormat = (data) =>
  data.email && !data.email.includes("@") ? "Invalid email format!" : null;

const requirePassword = (data) =>
  !data.password ? "Password is required!" : null;

const validatePasswordLength = (data) =>
  data.password && data.password.length < 8
    ? "Password must be at least 8 characters!"
    : null;

// COMPOSE pipeline:
const validateRegistration = createValidationPipeline(
  requireEmail,
  validateEmailFormat,
  requirePassword,
  validatePasswordLength,
);

// SỬ DỤNG:
validateRegistration({ email: "john", password: "123" });
// → { isValid: false, errors: ['Invalid email format!', 'Password must be...'] }

validateRegistration({ email: "john@example.com", password: "secure123" });
// → { isValid: true, errors: [] }
```

---

## §7. Koa Middleware — Onion Model

```javascript
// ═══ KOA — ONION MIDDLEWARE MODEL ═══

const Koa = require("koa");
const app = new Koa();

// Middleware 1: Logger (OUTER)
app.use(async (ctx, next) => {
  const start = Date.now();
  console.log(`→ ${ctx.method} ${ctx.url}`);

  await next(); // ← Đi VÀO onion!

  // SAU KHI next() resolve → chạy phần CÒN LẠI:
  const duration = Date.now() - start;
  console.log(`← ${ctx.method} ${ctx.url} ${ctx.status} (${duration}ms)`);
});

// Middleware 2: Error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
  }
});

// Middleware 3: Handler (INNER)
app.use(async (ctx) => {
  ctx.status = 200;
  ctx.body = { message: "Hello World!" };
});

app.listen(3000);
```

```
KOA ONION MODEL:
═══════════════════════════════════════════════════════════════

  Request vào → đi qua từng LAYER → đến CENTER → quay ngược ra!

  Request ──────────────────────────────────────→
  ┌─────────────────────────────────────────────┐
  │ Middleware 1 (Logger)                       │
  │  console.log("→ Request")                  │
  │  ┌─────────────────────────────────────┐   │
  │  │ Middleware 2 (Error Handler)         │   │
  │  │  try {                               │   │
  │  │  ┌─────────────────────────────┐    │   │
  │  │  │ Middleware 3 (Handler)      │    │   │
  │  │  │  ctx.body = "Hello!"       │    │   │
  │  │  └─────────────────────────────┘    │   │
  │  │  } catch(err) { ... }                │   │
  │  └─────────────────────────────────────┘   │
  │  console.log("← Response")                 │
  └─────────────────────────────────────────────┘
  ←────────────────────────────────────── Response

  THỨ TỰ CHẠY:
  1. Logger: log "→ Request"
  2. Error Handler: try {
  3. Handler: ctx.body = "Hello!"
  4. Error Handler: } (no error!)
  5. Logger: log "← Response (5ms)"

  → ĐI VÀO: TRƯỚC await next()!
  → ĐI RA: SAU await next()!
  → ONION = 2 chiều: vào + ra!
  → Express = 1 chiều: chỉ vào!
```

```
EXPRESS vs KOA MIDDLEWARE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬─────────────────┬─────────────────┐
  │                  │  Express        │  Koa             │
  ├──────────────────┼─────────────────┼─────────────────┤
  │ Model            │ LINEAR (1 chiều)│ ONION (2 chiều!) │
  │ Sau next()       │ KHÔNG chạy code │ CÓ chạy code!   │
  │ Async support    │ Cần wrapper     │ NATIVE async!    │
  │ Error handling   │ next(err)       │ try/catch!       │
  │ Response timing  │ Cần thêm hook   │ TỰ NHIÊN!       │
  │ req/res          │ req, res objects│ ctx object!      │
  └──────────────────┴─────────────────┴─────────────────┘

  Koa Onion = MẠNH HƠN:
  → Đo response time CHÍNH XÁC!
  → Error handling CLEAN hơn!
  → Async/await NATIVE!
```

---

## §8. Redux Middleware

```javascript
// ═══ REDUX MIDDLEWARE — GIỮA dispatch VÀ reducer ═══

// Redux middleware SIT giữa action dispatch và reducer:
// dispatch(action) → [middleware1] → [middleware2] → reducer!

// CẤU TRÚC: store => next => action => { ... }

// ① LOGGER Middleware:
const loggerMiddleware = (store) => (next) => (action) => {
  console.log("Dispatching:", action.type);
  console.log("Prev state:", store.getState());

  const result = next(action); // → Middleware tiếp hoặc reducer!

  console.log("Next state:", store.getState());
  return result;
};

// ② THUNK Middleware (async actions!):
const thunkMiddleware = (store) => (next) => (action) => {
  // Nếu action là FUNCTION → gọi nó (async support!)
  if (typeof action === "function") {
    return action(store.dispatch, store.getState);
  }
  // Nếu action là OBJECT → chuyển tiếp bình thường!
  return next(action);
};

// ③ CRASH REPORTER:
const crashReporter = (store) => (next) => (action) => {
  try {
    return next(action);
  } catch (err) {
    console.error("Caught exception!", err);
    // Gửi lên error tracking service:
    reportError(err, { action, state: store.getState() });
    throw err;
  }
};
```

```javascript
// ═══ REDUX MIDDLEWARE — ÁP DỤNG ═══

import { createStore, applyMiddleware } from "redux";

function rootReducer(state = { count: 0 }, action) {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + 1 };
    case "DECREMENT":
      return { ...state, count: state.count - 1 };
    default:
      return state;
  }
}

// APPLY middlewares (thứ tự QUAN TRỌNG!):
const store = createStore(
  rootReducer,
  applyMiddleware(
    loggerMiddleware, // ① Log trước!
    thunkMiddleware, // ② Xử lý async!
    crashReporter, // ③ Catch errors!
  ),
);

// Sync action:
store.dispatch({ type: "INCREMENT" });
// → loggerMiddleware logs!
// → thunkMiddleware: là object → next()!
// → crashReporter: try → next() → reducer!

// Async action (thunk!):
store.dispatch(async (dispatch, getState) => {
  const data = await fetch("/api/data");
  dispatch({ type: "SET_DATA", payload: data });
});
// → loggerMiddleware logs!
// → thunkMiddleware: là function → CALL nó!
// → fetch → dispatch lại → đi qua TOÀN BỘ chain lần nữa!
```

```
REDUX MIDDLEWARE PIPELINE:
═══════════════════════════════════════════════════════════════

  dispatch(action)
      │
      ▼
  ┌──────────────────┐
  │ loggerMiddleware  │  → Log action + state!
  │ next(action) ────│──┐
  └──────────────────┘  │
                         ▼
  ┌──────────────────┐
  │ thunkMiddleware   │  → Nếu function → call!
  │ next(action) ────│──┐   Nếu object → next!
  └──────────────────┘  │
                         ▼
  ┌──────────────────┐
  │ crashReporter     │  → try/catch errors!
  │ next(action) ────│──┐
  └──────────────────┘  │
                         ▼
  ┌──────────────────┐
  │ REDUCER           │  → Tính state MỚI!
  │ return newState   │
  └──────────────────┘

  → Mỗi middleware QUYẾT ĐỊNH:
    → Gọi next() → chuyển tiếp!
    → KHÔNG next() → swallow action!
    → Biến đổi action → next(modifiedAction)!
    → Dispatch action MỚI → store.dispatch()!
```

---

## §9. Mediator vs Observer vs Pub/Sub

```
SO SÁNH 3 PATTERNS:
═══════════════════════════════════════════════════════════════

  ┌────────────────┬────────────────┬────────────────┬────────────────┐
  │                │ Mediator       │ Observer       │ Pub/Sub        │
  ├────────────────┼────────────────┼────────────────┼────────────────┤
  │ Mục đích       │ Điều phối      │ Thông báo      │ Phân phối      │
  │                │ giao tiếp!     │ thay đổi!      │ message!       │
  │ Trung tâm      │ ✅ Mediator   │ ❌ Subject      │ ✅ Broker     │
  │                │ biết TẤT CẢ!  │ biết observers! │ trung gian!    │
  │ Coupling       │ Components     │ Subject → Obs  │ LOOSEST!       │
  │                │ → Mediator     │ (biết nhau!)   │ (không biết!)  │
  │ Communication  │ Bidirectional  │ Unidirectional │ Unidirectional │
  │ Logic          │ TRONG Mediator │ Trong Observer │ Trong Sub      │
  │ Ví dụ          │ ChatRoom,     │ addEventListener│ Redis Pub/Sub  │
  │                │ ATC, Express!  │ RxJS, MobX!    │ Kafka, SNS!    │
  └────────────────┴────────────────┴────────────────┴────────────────┘
```

```
KHI NÀO DÙNG CÁI NÀO:
═══════════════════════════════════════════════════════════════

  MEDIATOR:
  → Khi components cần TƯƠNG TÁC HAI CHIỀU!
  → Khi logic phức tạp (routing, orchestration!)
  → VD: ChatRoom, Express middleware, Redux!

  OBSERVER:
  → Khi 1 source THÔNG BÁO nhiều listeners!
  → Khi listeners KHÔNG CẦN reply!
  → VD: DOM events, state changes, RxJS!

  PUB/SUB:
  → Khi publisher & subscriber HOÀN TOÀN ĐỘC LẬP!
  → Khi cần cross-service communication!
  → VD: Microservices, message queues, Redis!
```

---

## §10. Event Bus — Lightweight Mediator

```javascript
// ═══ EVENT BUS = MEDIATOR ĐƠN GIẢN ═══

class EventBus {
  constructor() {
    this.channels = {};
  }

  // Register component:
  on(channel, callback) {
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }
    this.channels[channel].push(callback);

    // Return unsubscribe:
    return () => {
      this.channels[channel] = this.channels[channel].filter(
        (cb) => cb !== callback,
      );
    };
  }

  // Send message QUA bus (mediator!):
  emit(channel, data) {
    if (!this.channels[channel]) return;
    this.channels[channel].forEach((cb) => cb(data));
  }

  // Request-Response qua bus:
  async request(channel, data) {
    return new Promise((resolve, reject) => {
      const responseChannel = `${channel}:response:${Date.now()}`;

      // Lắng nghe response:
      const unsub = this.on(responseChannel, (response) => {
        unsub();
        resolve(response);
      });

      // Timeout:
      setTimeout(() => {
        unsub();
        reject(new Error(`Request timeout: ${channel}`));
      }, 5000);

      // Gửi request:
      this.emit(channel, { data, responseChannel });
    });
  }
}

// ═══ SỬ DỤNG TRONG APP ═══

const bus = new EventBus();

// Component A: User Profile
const unsubA = bus.on("user:updated", (user) => {
  console.log("[Profile] User updated:", user.name);
});

// Component B: Sidebar
bus.on("user:updated", (user) => {
  console.log("[Sidebar] Avatar updated:", user.avatar);
});

// Component C: Analytics
bus.on("user:updated", (user) => {
  console.log("[Analytics] Track update:", user.id);
});

// Component D: Form — EMIT qua bus!
function handleFormSubmit(userData) {
  // updateUser API call...
  bus.emit("user:updated", userData);
  // → Profile, Sidebar, Analytics TẤT CẢ nhận!
}

handleFormSubmit({ id: 1, name: "John", avatar: "new.jpg" });
// → [Profile] User updated: John
// → [Sidebar] Avatar updated: new.jpg
// → [Analytics] Track update: 1
```

---

## §11. Real-World Applications

```javascript
// ═══ FORM WIZARD — MEDIATOR ═══

class FormWizard {
  constructor() {
    this.steps = [];
    this.currentStep = 0;
    this.data = {};
    this.validators = {};
  }

  // Đăng ký step:
  addStep(name, component, validator) {
    this.steps.push({ name, component });
    if (validator) {
      this.validators[name] = validator;
    }
  }

  // Mediator điều phối NAVIGATION:
  next() {
    const current = this.steps[this.currentStep];
    const validator = this.validators[current.name];

    // Validate TRƯỚC KHI chuyển:
    if (validator) {
      const { isValid, errors } = validator(this.data);
      if (!isValid) {
        this.notifyStep(current, "validation:error", errors);
        return false;
      }
    }

    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.notifyStep(this.steps[this.currentStep], "step:enter", this.data);
      return true;
    }
    return false;
  }

  back() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.notifyStep(this.steps[this.currentStep], "step:enter", this.data);
      return true;
    }
    return false;
  }

  // Steps GỬI data qua mediator:
  updateData(key, value) {
    this.data[key] = value;
    // Thông báo tất cả steps về data change:
    this.steps.forEach((step) => {
      this.notifyStep(step, "data:updated", this.data);
    });
  }

  notifyStep(step, event, data) {
    if (step.component.onEvent) {
      step.component.onEvent(event, data);
    }
  }

  submit() {
    console.log("Form submitted with data:", this.data);
    return this.data;
  }
}
```

```javascript
// ═══ API MIDDLEWARE PIPELINE ═══

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.requestMiddlewares = [];
    this.responseMiddlewares = [];
  }

  // Đăng ký middleware:
  useRequest(fn) {
    this.requestMiddlewares.push(fn);
    return this;
  }

  useResponse(fn) {
    this.responseMiddlewares.push(fn);
    return this;
  }

  async request(config) {
    // ① Chạy REQUEST middlewares:
    let finalConfig = { ...config, baseURL: this.baseURL };
    for (const middleware of this.requestMiddlewares) {
      finalConfig = await middleware(finalConfig);
      if (!finalConfig) throw new Error("Middleware blocked request!");
    }

    // ② Thực hiện fetch:
    const url = `${finalConfig.baseURL}${finalConfig.url}`;
    const response = await fetch(url, {
      method: finalConfig.method || "GET",
      headers: finalConfig.headers || {},
      body: finalConfig.body ? JSON.stringify(finalConfig.body) : undefined,
    });

    // ③ Chạy RESPONSE middlewares:
    let result = { data: await response.json(), status: response.status };
    for (const middleware of this.responseMiddlewares) {
      result = await middleware(result);
    }

    return result;
  }

  // Shortcuts:
  get(url, config = {}) {
    return this.request({ ...config, url, method: "GET" });
  }
  post(url, body, config = {}) {
    return this.request({ ...config, url, method: "POST", body });
  }
}

// ═══ ÁP DỤNG MIDDLEWARES ═══

const api = new ApiClient("https://api.example.com");

// Request middleware: Thêm auth token!
api.useRequest(async (config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Request middleware: Thêm timestamp!
api.useRequest(async (config) => {
  config.headers = {
    ...config.headers,
    "X-Request-Time": Date.now().toString(),
  };
  return config;
});

// Response middleware: Kiểm tra lỗi!
api.useResponse(async (response) => {
  if (response.status === 401) {
    // Token expired → redirect login!
    window.location.href = "/login";
  }
  return response;
});

// Response middleware: Log!
api.useResponse(async (response) => {
  console.log(`API Response: ${response.status}`, response.data);
  return response;
});

// SỬ DỤNG:
const users = await api.get("/users");
// → Auth token THÊM tự động!
// → Timestamp THÊM tự động!
// → Error check TỰ ĐỘNG!
// → Log TỰ ĐỘNG!
```

```javascript
// ═══ GAME STATE MEDIATOR ═══

class GameMediator {
  constructor() {
    this.players = new Map();
    this.state = {
      phase: "waiting", // waiting, playing, paused, ended
      round: 0,
      scores: {},
    };
    this.listeners = [];
  }

  // ĐĂNG KÝ player:
  addPlayer(player) {
    this.players.set(player.id, player);
    this.state.scores[player.id] = 0;
    player.mediator = this;
    this.broadcast("player:joined", { player: player.name });
  }

  // Player GỬI action QUA mediator:
  handleAction(playerId, action) {
    const player = this.players.get(playerId);
    if (!player) return;

    switch (action.type) {
      case "ATTACK":
        this._handleAttack(player, action);
        break;
      case "DEFEND":
        this._handleDefend(player, action);
        break;
      case "HEAL":
        this._handleHeal(player, action);
        break;
    }
  }

  _handleAttack(attacker, action) {
    const target = this.players.get(action.targetId);
    if (!target) return;

    const damage = Math.floor(Math.random() * 20) + 5;
    target.receiveDamage(damage);
    this.state.scores[attacker.id] += damage;

    this.broadcast("action", {
      type: "ATTACK",
      attacker: attacker.name,
      target: target.name,
      damage,
    });

    // Kiểm tra game over:
    if (target.hp <= 0) {
      this.broadcast("game:over", { winner: attacker.name });
      this.state.phase = "ended";
    }
  }

  broadcast(event, data) {
    for (const [id, player] of this.players) {
      player.onEvent(event, data);
    }
    this.listeners.forEach((fn) => fn(event, data));
  }

  onStateChange(fn) {
    this.listeners.push(fn);
  }
}

// Players KHÔNG biết nhau, chỉ biết mediator:
class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.hp = 100;
    this.mediator = null;
  }

  attack(targetId) {
    // GỬI QUA MEDIATOR, không gọi target trực tiếp!
    this.mediator.handleAction(this.id, {
      type: "ATTACK",
      targetId,
    });
  }

  receiveDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  onEvent(event, data) {
    console.log(`[${this.name}] ${event}:`, data);
  }
}
```

---

## §12. Tradeoffs — Ưu & Nhược điểm

```
ƯU ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ LOOSE COUPLING:
  → Components KHÔNG biết nhau!
  → Chỉ biết Mediator!
  → Thay đổi 1 component → KHÔNG ảnh hưởng component khác!

  ✅ SINGLE RESPONSIBILITY:
  → Mediator lo GIAO TIẾP!
  → Components lo BUSINESS LOGIC!
  → Tách biệt rõ ràng!

  ✅ DỄ THÊM/XÓA COMPONENTS:
  → Thêm component = đăng ký với Mediator!
  → Xóa component = hủy đăng ký!
  → KHÔNG cần sửa components khác!

  ✅ CENTRALIZED CONTROL:
  → Logic giao tiếp TẬP TRUNG 1 chỗ!
  → Dễ debug flow!
  → Dễ thêm logging, validation!

  ✅ MIDDLEWARE (Variant):
  → Composable: chain nhiều middlewares!
  → Reusable: dùng cho nhiều routes/actions!
  → Pluggable: thêm/xóa middleware dễ dàng!
```

```
NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ❌ GOD OBJECT:
  → Mediator biết TẤT CẢ → trở thành GOD OBJECT!
  → Quá nhiều logic → complex, khó maintain!
  → Mediator phình to → single point of failure!

  ❌ PERFORMANCE:
  → TẤT CẢ giao tiếp đi qua 1 điểm!
  → Bottleneck nếu traffic cao!
  → Thêm 1 layer abstraction → overhead!

  ❌ SINGLE POINT OF FAILURE:
  → Mediator chết → TẤT CẢ chết!
  → Phải ensure mediator STABLE!

  ❌ INDIRECT COMMUNICATION:
  → A → Mediator → B (thay vì A → B trực tiếp!)
  → Khó trace: "message đi qua đâu?"
  → Stack traces DÀI hơn!

  ❌ MIDDLEWARE ORDERING:
  → Thứ tự middleware QUAN TRỌNG!
  → Auth PHẢI trước route handler!
  → Đặt sai thứ tự → bugs subtile!
```

```
KHI NÀO DÙNG:
═══════════════════════════════════════════════════════════════

  ✅ NÊN DÙNG:
  → NHIỀU components cần giao tiếp → many-to-many!
  → Chat rooms, game lobbies!
  → Request/Response pipelines (Express, Koa!)
  → State management (Redux middleware!)
  → Form wizard, multi-step workflows!
  → ATC, dispatch systems!

  ❌ KHÔNG NÊN DÙNG:
  → 2 objects giao tiếp đơn giản → OVERKILL!
  → Khi TRỰC TIẾP đủ tốt → thêm layer không cần thiết!
  → Read-heavy, ít interactions → Observer đủ!
```

---

## §13. Tóm tắt

```
MEDIATOR/MIDDLEWARE — TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Mediator Pattern là gì?"
  A: Components giao tiếp QUA 1 điểm trung tâm (mediator)!
  Không nói TRỰC TIẾP với nhau! Giảm many-to-many
  thành many-to-ONE-to-many! VD: ChatRoom, ATC!

  Q: "Middleware Pattern là gì?"
  A: CHUỖI functions xử lý TUẦN TỰ!
  Mỗi middleware: đọc/sửa request → gọi next()!
  Express: app.use(fn); Redux: store => next => action!

  Q: "Express vs Koa middleware?"
  A: Express = LINEAR (1 chiều), code chạy TRƯỚC next()!
  Koa = ONION (2 chiều), code chạy CẢ TRƯỚC VÀ SAU next()!
  Koa: response timing, error handling TỐTM HƠN!

  Q: "Redux Middleware?"
  A: SIT giữa dispatch và reducer!
  store => next => action => { ... }!
  VD: Thunk (async), Logger, Crash Reporter!
  next(action) → middleware tiếp theo → reducer!

  Q: "Mediator vs Observer?"
  A: Mediator: BIDIRECTIONAL, central logic, ATC style!
  Observer: UNIDIRECTIONAL, 1-to-many broadcast!
  Mediator = controller; Observer = notifier!

  Q: "Nhược điểm?"
  A: God Object (mediator quá lớn!), Single Point of Failure,
  performance bottleneck, khó trace indirect communication!
  Middleware: ordering QUAN TRỌNG, sai thứ tự = subtle bugs!
```

---

### Checklist

- [ ] **Mediator concept**: central point điều phối giao tiếp; components KHÔNG biết nhau!
- [ ] **ChatRoom**: User gửi qua chatroom (mediator); broadcast + private message!
- [ ] **Air Traffic Controller**: phi công → ATC → phi công; KHÔNG nói trực tiếp!
- [ ] **Middleware Pipeline**: chuỗi functions; req → [mw1] → [mw2] → handler → res!
- [ ] **next()**: gọi = chuyển tiếp; KHÔNG gọi = chain DỪNG; next(err) = error handler!
- [ ] **Express Middleware**: app.use(fn); types: application, router, error-handling, built-in, third-party!
- [ ] **Koa Onion Model**: code chạy TRƯỚC + SAU await next(); 2 chiều; async native!
- [ ] **Redux Middleware**: store => next => action; Thunk (async), Logger, Crash Reporter!
- [ ] **Custom Engine**: compose(middlewares) → dispatch(0) → fn(ctx, next); Promise-based!
- [ ] **Mediator vs Observer**: Mediator = bidirectional controller; Observer = unidirectional notifier!
- [ ] **Event Bus**: lightweight mediator; on/emit; cross-component communication!
- [ ] **Tradeoffs**: Ưu (loose coupling, SRP, extensible) vs Nhược (god object, bottleneck, ordering!)

---

_Nguồn: patterns.dev — Mediator/Middleware Pattern, Express.js Docs, Koa Docs, Redux Middleware Docs_
_Cập nhật lần cuối: Tháng 2, 2026_
