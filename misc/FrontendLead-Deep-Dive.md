# Frontend Lead Interview — Deep Dive

> 📅 2026-02-14 · ⏱ 20 phút đọc
>
> Implement React useState, D2C Sketch Plugin, Monitoring & Alarm,
> Frontend Infrastructure (Scaffold, Framework, Components),
> Rich Text Editor (Slate.js, Jodit), Quality Assurance,
> Hoisting Puzzle, Version Sort Algorithm
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Senior/Lead Frontend Interview

---

## Mục Lục

| #   | Phần                                       |
| --- | ------------------------------------------ |
| 1   | Implement React useState Hook              |
| 2   | useState Deep Dive — Fiber & Queue         |
| 3   | D2C Sketch Plugin — Design to Code         |
| 4   | Mini-Program Log & Monitoring              |
| 5   | Frontend Infrastructure — Scaffold         |
| 6   | Frontend Infrastructure — Framework        |
| 7   | Frontend Infrastructure — Components       |
| 8   | Rich Text Editor — Slate.js & Jodit        |
| 9   | Quality & Stability — Testing & Monitoring |
| 10  | Code Puzzle: Hoisting trong function       |
| 11  | Algorithm: Version Number Sort             |
| 12  | Tóm tắt phỏng vấn                          |

---

## §1. Implement React useState Hook

```
REACT useState — CÁCH HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  useState(initialValue) trả về [state, setState]
  → state: GIÁ TRỊ hiện tại!
  → setState: HÀM CẬP NHẬT giá trị!

  2 CÁCH GỌI setState:
  → setState(newValue)           — truyền giá trị MỚI!
  → setState(prev => prev + 1)  — truyền FUNCTION (dùng giá trị cũ!)

  BEHIND THE SCENES:
  → React KHÔNG dùng biến bình thường!
  → Dùng CLOSURE + MẢNG (hoặc Linked List trong Fiber!)
  → Mỗi component có 1 mảng hooks riêng!
  → Mỗi lần render: đọc hooks theo THỨ TỰ!
  → → Vì vậy: KHÔNG ĐƯỢC gọi hooks trong if/for!
```

```javascript
// ═══ IMPLEMENT useState — PHIÊN BẢN ĐƠN GIẢN ═══

// React dùng MẢNG + INDEX để lưu state của mỗi component!
let hooks = []; // Mảng lưu TẤT CẢ hooks!
let hookIndex = 0; // Con trỏ hiện tại!

function useState(initialValue) {
  // Lấy state hiện tại (hoặc khởi tạo lần đầu!):
  const currentIndex = hookIndex;

  if (hooks[currentIndex] === undefined) {
    hooks[currentIndex] = initialValue; // Lần đầu!
  }

  // setState function (closure giữ currentIndex!):
  const setState = (newValue) => {
    if (typeof newValue === "function") {
      // Functional update: setState(prev => prev + 1)
      hooks[currentIndex] = newValue(hooks[currentIndex]);
    } else {
      // Direct update: setState(5)
      hooks[currentIndex] = newValue;
    }

    // TRIGGER RE-RENDER!
    render(); // Gọi lại component!
  };

  hookIndex++; // Di chuyển con trỏ cho hook tiếp theo!

  return [hooks[currentIndex], setState];
}

// RESET index trước mỗi lần render:
function render() {
  hookIndex = 0; // RESET! Đọc hooks từ đầu!
  // Re-execute component function...
  ReactDOM.render(<App />, root);
}
```

```javascript
// ═══ TẠI SAO CẦN RESET hookIndex? ═══

function Counter() {
  // Render lần 1: hookIndex=0 → hooks[0] = 0
  const [count, setCount] = useState(0);
  // hookIndex=1 → hooks[1] = "hello"
  const [text, setText] = useState("hello");

  // Render lần 2 (sau setState): hookIndex RESET về 0!
  // hookIndex=0 → hooks[0] đã là 1 (updated!)
  // hookIndex=1 → hooks[1] vẫn "hello"

  // → Nếu KHÔNG reset → hookIndex tiếp tục tăng → SAI!
}

// ═══ TẠI SAO KHÔNG ĐƯỢC dùng hooks trong if? ═══

function Bad() {
  const [a, setA] = useState(1); // hooks[0]

  if (someCondition) {
    const [b, setB] = useState(2); // hooks[1] HOẶC BỎ QUA!
  }

  const [c, setC] = useState(3); // hooks[1] HOẶC hooks[2]!
  // → THỨ TỰ THAY ĐỔI giữa các render → BUG!
}
```

```javascript
// ═══ IMPLEMENT useState — DÙNG useRef (từ bài phỏng vấn!) ═══

// Phiên bản dùng useRef (giả sử useRef đã tồn tại):
const useState = (defaultValue) => {
  const value = useRef(defaultValue);

  const setValue = (newValue) => {
    if (typeof newValue === "function") {
      // Functional update:
      value.current = newValue(value.current);
    } else {
      // Direct update (⚠️ BÀI GỐC CÓ BUG!):
      value.current = newValue; // Sửa: newValue, KHÔNG phải value!
    }

    // Trigger re-render:
    dispatchAction(); // Internal React API!
  };

  return [value.current, setValue];
  // ↑ Trả value.current (giá trị!), KHÔNG phải ref object!
};

// ⚠️ BUG TRONG CODE GỐC:
// value.current = value;  ← WRONG! Gán ref object cho chính nó!
// value.current = newValue; ← CORRECT! Gán giá trị mới!
```

---

## §2. useState Deep Dive — Fiber & Queue

```
REACT FIBER — useState THẬT SỰ HOẠT ĐỘNG THẾ NÀO?
═══════════════════════════════════════════════════════════════

  Trong React THẬT:
  → Mỗi component = 1 FIBER NODE!
  → Fiber node có: memoizedState → LINKED LIST of hooks!
  → Mỗi hook = 1 node trong linked list!

  FIBER NODE:
  ┌─────────────────────────────────────────────────────────┐
  │ Fiber {                                                │
  │   type: Counter,          // Component function!        │
  │   memoizedState: Hook1,   // ĐẦU linked list hooks!    │
  │   ...                                                  │
  │ }                                                      │
  │                                                        │
  │ Hook1 (useState #1):                                   │
  │ ┌─────────────────────┐                                │
  │ │ memoizedState: 0    │  → Giá trị state!              │
  │ │ queue: UpdateQueue  │  → Hàng đợi updates!           │
  │ │ next: Hook2 ────────┼──→                             │
  │ └─────────────────────┘                                │
  │                                                        │
  │ Hook2 (useState #2):                                   │
  │ ┌─────────────────────┐                                │
  │ │ memoizedState: "hi" │                                │
  │ │ queue: UpdateQueue  │                                │
  │ │ next: null          │  → Hết hooks!                  │
  │ └─────────────────────┘                                │
  └─────────────────────────────────────────────────────────┘
```

```javascript
// ═══ REACT SOURCE — mountState (lần đầu render!) ═══

function mountState(initialState) {
  // Tạo hook object mới trong linked list:
  const hook = mountWorkInProgressHook();

  // Nếu initialState là function → gọi nó:
  if (typeof initialState === "function") {
    initialState = initialState(); // Lazy initialization!
  }

  hook.memoizedState = initialState;

  // Tạo update queue:
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
  };
  hook.queue = queue;

  // Tạo dispatch function (setState!):
  const dispatch = (queue.dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber, // Fiber node hiện tại!
    queue,
  ));

  return [hook.memoizedState, dispatch];
}

// ═══ updateState (re-render!) ═══

function updateState(initialState) {
  // KHÔNG dùng initialState! Lấy hook TỪ linked list!
  return updateReducer(basicStateReducer, initialState);
}

// basicStateReducer: giống useState nhưng dùng reducer pattern!
function basicStateReducer(state, action) {
  return typeof action === "function" ? action(state) : action;
}

// → useState THỰC CHẤT là useReducer với basicStateReducer!
```

```javascript
// ═══ BATCHING & ASYNC UPDATES ═══

function Example() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // React 18: TẤT CẢ updates được BATCH!
    setCount(1); // KHÔNG re-render ngay!
    setCount(2); // KHÔNG re-render ngay!
    setCount(3); // KHÔNG re-render ngay!
    // → CHỈ RE-RENDER 1 LẦN với count = 3!
  };

  const handleClick2 = () => {
    // Functional updates: dùng giá trị TRƯỚC ĐÓ!
    setCount((prev) => prev + 1); // 0 → 1
    setCount((prev) => prev + 1); // 1 → 2
    setCount((prev) => prev + 1); // 2 → 3
    // → RE-RENDER 1 LẦN với count = 3!
    // → Tất cả functional updates được CHAIN đúng!
  };
}

// ⚠️ REACT 17 vs 18:
// React 17: chỉ batch trong event handlers!
//   setTimeout(() => { setState(1); setState(2); })
//   → 2 lần re-render!
// React 18: batch EVERYWHERE! (setTimeout, Promise, native events!)
//   → 1 lần re-render!
```

---

## §3. D2C Sketch Plugin — Design to Code

```
D2C (Design to Code) — SKETCH PLUGIN:
═══════════════════════════════════════════════════════════════

  MỤC TIÊU: Designer thiết kế trên Sketch → TỰ ĐỘNG
  sinh ra code frontend!

  KIẾN TRÚC:
  ┌──────────────────────────────────────────────────────────┐
  │                    SKETCH PLUGIN                        │
  │                                                        │
  │  ┌──────────────┐    message    ┌──────────────────┐   │
  │  │   WebView     │ ←──────────→ │   CocoaScript    │   │
  │  │  (Frontend!)  │              │  (Native Plugin!) │   │
  │  │              │              │                   │   │
  │  │ • Panel UI   │              │ • Artboard API    │   │
  │  │ • Icon list  │              │ • Layer handling  │   │
  │  │ • Component  │              │ • File management │   │
  │  │   browser    │              │ • Template lookup │   │
  │  └──────────────┘              └──────────────────┘   │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │ COMPONENT TEMPLATES (cài kèm plugin!)            │  │
  │  │ → Mỗi component = unique ID!                     │  │
  │  │ → 1-1 mapping: Sketch component ↔ Code component!│  │
  │  └──────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────┘

  FLOW:
  ① Plugin panel (WebView) hiển thị danh sách icons/components
  ② User KÉO component từ panel vào artboard
  ③ WebView GỬI MESSAGE cho CocoaScript:
     { componentId: "btn-primary", position: {x, y} }
  ④ CocoaScript TÌM vị trí trong artboard → ĐẶT component
  ⑤ KHI EXPORT: duyệt artboard → tìm component IDs
     → map sang CODE tương ứng → GHÉP thành trang!

  GIẢM CHI PHÍ:
  → Panel UI = frontend (HTML/CSS/JS) trong WebView!
  → CHỈ native code cho Sketch API interaction!
  → Component templates = business-specific, đã chuẩn hóa!
```

---

## §4. Mini-Program Log & Monitoring

```
MINI-PROGRAM MONITORING — 2 PHẦN:
═══════════════════════════════════════════════════════════════

  PHẦN 1: LOG TRACKING & UPLOAD
  ┌────────────────────────────────────────────────────────┐
  │ ① Code Logs (technical):                               │
  │ → Custom WebSocket log service!                        │
  │ → Client load → start WebSocket!                       │
  │ → sdk.log('error', 'Payment failed', { orderId })     │
  │ → Server → forward → Data Warehouse!                   │
  │ → Query qua Data Warehouse API!                        │
  │                                                        │
  │ ② Business Logs (nghiệp vụ):                          │
  │ → Track user actions (click, purchase, search...)      │
  │ → Report KHI action xảy ra!                            │
  └────────────────────────────────────────────────────────┘

  PHẦN 2: ALARM
  ┌────────────────────────────────────────────────────────┐
  │ → Tracking data → TREND CHARTS!                        │
  │ → Set ALARM THRESHOLDS dựa trên trends!                │
  │ → Monitor real-time → vượt threshold → ALARM!          │
  │ → Gửi: Slack / Email / SMS!                            │
  │                                                        │
  │ CHIẾN LƯỢC:                                            │
  │ → Ban đầu: set thresholds MANUAL!                      │
  │ → Sau đó: điều chỉnh dựa trên THỰC TẾ!               │
  │ → Mục tiêu: alarm CHÍNH XÁC (ít false positive!)      │
  └────────────────────────────────────────────────────────┘

  BUSINESS METRICS:
  → Tỷ lệ đặt hàng = payment_ok / checkout_click!
  → Config trend charts → threshold → alarm!
```

---

## §5. Frontend Infrastructure — Scaffold

```
SCAFFOLDING — TẠO DỰ ÁN TỰ ĐỘNG:
═══════════════════════════════════════════════════════════════

  TÍNH NĂNG:
  ① MỘT DÒNG LỆNH → tạo project hoàn chỉnh!
     npx @company/cli create my-app

  ② TẠO REMOTE REPO tự động (GitLab API!)
     → Gọi GitLab API → tạo repo → push code!

  ③ TẠO CI/CD SCRIPTS tự động!
     → .gitlab-ci.yml được generate sẵn!
     → Deploy automation từ ngày đầu!

  ④ CONFIG TÍCH HỢP SẴN:
     → ESLint, Prettier, TSConfig, Vite configs!
     → TẤT CẢ nằm TRONG scaffold!
     → CHỈ expose 1 số config items ra ngoài!
     → Developer KHÔNG CẦN config phức tạp!

  ⑤ AUTOMATED COMMANDS:
     → npm run format → code formatting!
     → npm run lint → quality inspection!
     → npm run dev → local development!
     → npm run build → production packaging!
```

```javascript
// ═══ SCAFFOLD CLI — IMPLEMENTATION ═══

#!/usr/bin/env node
const { program } = require('commander');
const inquirer = require('inquirer');
const { Gitlab } = require('@gitbeaker/node');
const fs = require('fs-extra');
const { execSync } = require('child_process');

program
    .command('create <name>')
    .description('Tạo project mới')
    .action(async (name) => {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'template',
                message: 'Chọn template:',
                choices: ['react-vite', 'vue-vite', 'mini-program'],
            },
        ]);

        // ① Copy template:
        const templateDir = path.join(__dirname, '../templates', answers.template);
        await fs.copy(templateDir, `./${name}`);

        // ② Tạo GitLab repo:
        const gitlab = new Gitlab({ token: process.env.GITLAB_TOKEN });
        const project = await gitlab.Projects.create({ name });
        console.log(`✅ GitLab repo: ${project.web_url}`);

        // ③ Generate CI/CD:
        const ciConfig = generateCIConfig(answers.template);
        await fs.writeFile(`./${name}/.gitlab-ci.yml`, ciConfig);

        // ④ Init + push:
        execSync(`cd ${name} && git init && git remote add origin ${project.ssh_url_to_repo}`);
        execSync(`cd ${name} && npm install`);

        console.log(`🚀 Project ${name} created! cd ${name} && npm run dev`);
    });

function generateCIConfig(template) {
    return `
stages:
  - lint
  - test
  - build
  - deploy

lint:
  stage: lint
  script:
    - npm ci
    - npm run lint
    - npm run type-check

test:
  stage: test
  script:
    - npm run test -- --coverage

build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths: [dist/]

deploy:
  stage: deploy
  only: [main]
  script:
    - rsync -avz dist/ user@server:/var/www/${template}/
`;
}
```

---

## §6. Frontend Infrastructure — Framework

```
FRONTEND FRAMEWORK — ĐÓNG GÓI MODULE CHUNG:
═══════════════════════════════════════════════════════════════

  Framework nội bộ EXPORT tất cả cho developer GỌI TRỰC TIẾP:

  ┌────────────────────────────────────────────────────────┐
  │ ① REQUEST MODULE:                                     │
  │ → Axios wrapper với interceptors!                      │
  │ → Auto refresh token!                                  │
  │ → Error handling chuẩn hóa!                            │
  │ → Request/Response logging!                             │
  │                                                        │
  │ import { request } from '@company/framework';          │
  │ const data = await request.get('/api/users');          │
  ├────────────────────────────────────────────────────────┤
  │ ② STATE MANAGEMENT:                                    │
  │ → Zustand/Redux wrapper!                                │
  │ → Chuẩn hóa store structure!                           │
  │ → Persist middleware built-in!                          │
  │                                                        │
  │ import { createStore } from '@company/framework';      │
  ├────────────────────────────────────────────────────────┤
  │ ③ ROUTING:                                             │
  │ → React Router wrapper!                                 │
  │ → Auth guard, permission guard!                        │
  │ → Route-based code splitting!                           │
  ├────────────────────────────────────────────────────────┤
  │ ④ BUSINESS CAPABILITIES:                               │
  │ → PDF Preview component!                                │
  │ → Unified Chart display (ECharts wrapper!)              │
  │ → Rich Text Editor!                                     │
  └────────────────────────────────────────────────────────┘
```

---

## §7. Frontend Infrastructure — Components

```
COMPONENT LIBRARY:
═══════════════════════════════════════════════════════════════

  ① ANTD CUSTOMIZATION:
  → Theme override (Design Token!)
  → Style modification (CSS Variables!)
  → Higher-level component encapsulation!

  ② JSON2PAGE — SCHEMA-DRIVEN:
  → CRUD pages = BẢN CHẤT giống nhau!
  → Tạo/Đọc/Cập nhật/Xóa → TABLE + FORM!
  → Đóng gói thành TEMPLATE!
  → Developer CHỈ CẦN viết JSON config → sinh trang!
```

```typescript
// ═══ JSON2PAGE — VÍ DỤ ═══

import { createCRUDPage } from "@company/components";

// TOÀN BỘ trang CRUD chỉ cần JSON config:
const UserManagement = createCRUDPage({
  title: "Quản lý người dùng",
  api: {
    list: "/api/users",
    create: "/api/users",
    update: "/api/users/:id",
    delete: "/api/users/:id",
  },
  table: {
    columns: [
      { key: "name", title: "Họ tên", sortable: true },
      { key: "email", title: "Email", searchable: true },
      { key: "role", title: "Vai trò", filters: ["admin", "user"] },
      { key: "createdAt", title: "Ngày tạo", type: "date" },
    ],
    pagination: { pageSize: 20 },
  },
  form: {
    fields: [
      { key: "name", label: "Họ tên", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      {
        key: "role",
        label: "Vai trò",
        type: "select",
        options: [
          { label: "Admin", value: "admin" },
          { label: "User", value: "user" },
        ],
      },
    ],
  },
});

// → XONG! Không cần viết component nào!
// → Table + Search + Create Modal + Edit Modal + Delete Confirm!
// → Developer tiết kiệm 70-80% code cho CRUD pages!
```

---

## §8. Rich Text Editor — Slate.js & Jodit

```
RICH TEXT EDITOR — LỊCH SỬ CHUYỂN ĐỔI:
═══════════════════════════════════════════════════════════════

  BAN ĐẦU: SLATE.JS
  ┌────────────────────────────────────────────────────────┐
  │ → Slate.js = FRAMEWORK cho rich text editor!           │
  │ → KHÔNG phải editor hoàn chỉnh → cung cấp CORE!       │
  │                                                        │
  │ ƯU ĐIỂM:                                               │
  │ → Cực kỳ LInh hoạt! Customize được mọi thứ!          │
  │ → Plugin-based architecture!                            │
  │ → Schema-less: dữ liệu tùy biến!                      │
  │                                                        │
  │ NHƯỢC ĐIỂM:                                             │
  │ → Phải TỰ XÂY dựng features (bold, italic, table...)! │
  │ → Nghiệp vụ TĂNG → cần thêm nhiều features!           │
  │ → Team NHỎ → không đủ nhân lực phát triển!            │
  └────────────────────────────────────────────────────────┘

  SAU ĐÓ: JODIT
  ┌────────────────────────────────────────────────────────┐
  │ → Jodit = editor ĐẦY ĐỦ TÍNH NĂNG!                   │
  │ → Viết bằng TypeScript → code dễ đọc!                  │
  │ → Hỗ trợ: bold, italic, table, image, link, embed...  │
  │ → DỄ secondary development (mở rộng theo nghiệp vụ!) │
  │                                                        │
  │ QUYẾT ĐỊNH CHUYỂN: code sẵn có + dễ phát triển thêm!  │
  └────────────────────────────────────────────────────────┘
```

```
SO SÁNH CÁC RICH TEXT EDITORS:
═══════════════════════════════════════════════════════════════

  ┌───────────────┬─────────────┬─────────────┬────────────┐
  │               │ Slate.js    │ Jodit       │ TipTap     │
  ├───────────────┼─────────────┼─────────────┼────────────┤
  │ Approach      │ Framework!  │ Full editor!│ Framework! │
  │               │ (build own) │ (ready-made)│ (ProseMirr)│
  ├───────────────┼─────────────┼─────────────┼────────────┤
  │ Features      │ TỰ XÂY!    │ SẴN CÓ!    │ Plugin-ext │
  ├───────────────┼─────────────┼─────────────┼────────────┤
  │ TypeScript    │ ✅          │ ✅          │ ✅         │
  ├───────────────┼─────────────┼─────────────┼────────────┤
  │ Flexibility   │ ⭐⭐⭐⭐⭐  │ ⭐⭐⭐      │ ⭐⭐⭐⭐   │
  ├───────────────┼─────────────┼─────────────┼────────────┤
  │ Dev effort    │ CAO!        │ THẤP!       │ TRUNG BÌNH │
  ├───────────────┼─────────────┼─────────────┼────────────┤
  │ Best for      │ Custom need │ Quick start │ Balanced   │
  └───────────────┴─────────────┴─────────────┴────────────┘
```

---

## §9. Quality & Stability — Testing & Monitoring

```
QUALITY & STABILITY — 2 PHẦN:
═══════════════════════════════════════════════════════════════

  PHẦN 1: QUALITY TRONG DEVELOPMENT
  ┌────────────────────────────────────────────────────────┐
  │ ① Unit Testing (Jest):                                 │
  │ → Test functions, hooks, utilities!                    │
  │ → Coverage target: > 80%!                              │
  │ → CI pipeline: block merge nếu tests fail!            │
  │                                                        │
  │ ② UI Automated Testing (Cypress):                      │
  │ → E2E test user flows!                                 │
  │ → Test critical paths: login → dashboard → actions!    │
  │ → Visual regression testing!                           │
  └────────────────────────────────────────────────────────┘

  PHẦN 2: ONLINE STABILITY MONITORING
  (Dựa trên open-source, secondary development!)
  ┌────────────────────────────────────────────────────────┐
  │ ① EXCEPTION HANDLING — Phân loại + Xử lý riêng:       │
  │                                                        │
  │ addEventListener('error'):                             │
  │ → JS runtime errors (TypeError, ReferenceError...)!    │
  │                                                        │
  │ window.onerror:                                        │
  │ → Resource loading errors (img, script, css!)          │
  │                                                        │
  │ xhr.addEventListener('error'):                         │
  │ → API request errors!                                  │
  │                                                        │
  │ window.addEventListener('unhandledrejection'):          │
  │ → Unhandled Promise rejections!                         │
  ├────────────────────────────────────────────────────────┤
  │ ② ERROR REPORTING:                                     │
  │ → WebSocket hoặc HTTP request!                         │
  │ → Weak network: CACHE locally, gửi sau!                │
  │ → High concurrency: DATA MERGING (gộp errors!)        │
  ├────────────────────────────────────────────────────────┤
  │ ③ DATA RECEPTION:                                      │
  │ → Node.js service nhận data!                           │
  │ → Lưu vào database!                                    │
  ├────────────────────────────────────────────────────────┤
  │ ④ DATA USAGE:                                          │
  │ → Phân loại + query anomalies!                         │
  │ → Monitoring dashboard + trend charts!                  │
  │ → ALARM: data vượt threshold → gửi email!             │
  └────────────────────────────────────────────────────────┘
```

---

## §10. Code Puzzle: Hoisting trong function

```javascript
// ═══ BÀI TOÁN — OUTPUT LÀ GÌ? ═══

var foo = 1;
function fn() {
  foo = 3;
  return;
  function foo() {
    // todo
  }
}
fn();
console.log(foo); // → KẾT QUẢ: ???
```

```
PHÂN TÍCH TỪNG BƯỚC:
═══════════════════════════════════════════════════════════════

  BƯỚC 1: Global scope
  → var foo = 1;  ← foo GLOBAL = 1!

  BƯỚC 2: Gọi fn()
  → Function declarations được HOIST lên ĐẦU fn()!
  → NHƯNG chỉ lên đầu fn(), KHÔNG ra ngoài global!

  BƯỚC 3: fn() sau khi hoist trở thành:

  function fn() {
      // ↓↓↓ function foo() được HOIST lên đây! ↓↓↓
      function foo() { /* todo */ }  // ← LOCAL foo!

      foo = 3;   // ← Ghi đè LOCAL foo = 3!
                 //    KHÔNG ảnh hưởng GLOBAL foo!
      return;
  }

  BƯỚC 4: console.log(foo)
  → foo GLOBAL vẫn = 1! KHÔNG BỊ thay đổi!

  ĐÁP ÁN: 1 ✅

  GIẢI THÍCH:
  → function foo() {} TRONG fn() được hoist lên ĐẦU fn()!
  → Tạo ra biến LOCAL foo trong fn() scope!
  → foo = 3 ghi đè LOCAL foo, KHÔNG phải GLOBAL foo!
  → GLOBAL foo vẫn giữ nguyên = 1!
```

```javascript
// ═══ CHỨNG MINH — THÊM console.log ĐỂ HIỂU RÕ ═══

var foo = 1;
function fn() {
  console.log(foo); // → function foo() {} (hoisted!)
  foo = 3;
  console.log(foo); // → 3 (local foo đã bị ghi đè!)
  return;
  function foo() {}
}
fn();
console.log(foo); // → 1 (global foo KHÔNG đổi!)

// ═══ SO SÁNH: NẾU KHÔNG CÓ function foo() ═══

var bar = 1;
function fn2() {
  bar = 3; // ← KHÔNG có local bar → GHI ĐÈ GLOBAL!
  return;
}
fn2();
console.log(bar); // → 3! GLOBAL bar BỊ thay đổi!

// ═══ RULES ═══
// → Function declarations HOIST trong scope CHỨA NÓ!
// → Tạo LOCAL variable cùng tên → "SHADOW" biến bên ngoài!
// → Gán giá trị cho local variable → KHÔNG ảnh hưởng outer scope!
```

---

## §11. Algorithm: Version Number Sort

```
BÀI TOÁN:
═══════════════════════════════════════════════════════════════

  Sắp xếp version numbers theo thứ tự TĂNG DẦN!

  INPUT:  ['0.1.1', '2.3.3', '0.302.1', '4.2', '4.3.5', '4.3.4.5']
  OUTPUT: ['0.1.1', '0.302.1', '2.3.3', '4.2', '4.3.4.5', '4.3.5']

  THUẬT TOÁN:
  → Split theo '.' → so sánh từng PHẦN!
  → Phần nào NGẮN hơn → pad bằng 0!
  → So sánh SỐ (không phải string!)
```

```javascript
// ═══ VERSION SORT — IMPLEMENTATION ═══

function compareVersions(versions) {
  return versions.sort((a, b) => {
    const partsA = a.split(".");
    const partsB = b.split(".");
    const maxLen = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < maxLen; i++) {
      // Pad bằng 0 nếu thiếu phần:
      const numA = parseInt(partsA[i] || "0", 10);
      const numB = parseInt(partsB[i] || "0", 10);

      if (numA !== numB) {
        return numA - numB; // Tăng dần!
      }
    }
    return 0; // Bằng nhau!
  });
}

// TEST:
const versions = ["0.1.1", "2.3.3", "0.302.1", "4.2", "4.3.5", "4.3.4.5"];
console.log(compareVersions(versions));
// ['0.1.1', '0.302.1', '2.3.3', '4.2', '4.3.4.5', '4.3.5']
```

```
TRACE TỪNG BƯỚC:
═══════════════════════════════════════════════════════════════

  So sánh '4.3.5' vs '4.3.4.5':
  i=0: 4 === 4 → tiếp!
  i=1: 3 === 3 → tiếp!
  i=2: 5 vs 4 → 5 > 4 → '4.3.5' SAU '4.3.4.5'!

  So sánh '4.2' vs '4.3.5':
  i=0: 4 === 4 → tiếp!
  i=1: 2 vs 3 → 2 < 3 → '4.2' TRƯỚC '4.3.5'!

  So sánh '0.1.1' vs '0.302.1':
  i=0: 0 === 0 → tiếp!
  i=1: 1 vs 302 → 1 < 302 → '0.1.1' TRƯỚC '0.302.1'!

  ĐỘ PHỨC TẠP:
  Time:  O(n log n × k) — n versions, k parts mỗi version!
  Space: O(k) — split arrays!
```

```javascript
// ═══ PHIÊN BẢN NÂNG CAO — localeCompare ═══

function sortVersions(versions) {
  return versions.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
  );
}
// ⚠️ localeCompare với numeric: true xử lý "302" > "1" đúng!
// Nhưng KHÔNG hoàn toàn chính xác cho mọi edge case!

// ═══ PHIÊN BẢN SẠCH — so sánh 2 versions ═══

function compareTwo(v1, v2) {
  const a = v1.split(".").map(Number);
  const b = v2.split(".").map(Number);
  const len = Math.max(a.length, b.length);

  for (let i = 0; i < len; i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0; // Bằng!
}

// compareTwo('1.2.3', '1.2.4')  → -1 (nhỏ hơn!)
// compareTwo('1.3', '1.2.4')    → 1  (lớn hơn!)
// compareTwo('1.0', '1')        → 0  (bằng!)
```

---

## §12. Tóm tắt phỏng vấn

```
PHỎNG VẤN — TRẢ LỜI:
═══════════════════════════════════════════════════════════════

  Q: "Implement React useState?"
  A: Hooks dùng MẢNG + INDEX (simplified) hoặc LINKED LIST (Fiber).
  → Mỗi render: reset index, đọc hooks theo THỨ TỰ!
  → setState: direct value HOẶC function (prev => new)!
  → useState THỰC CHẤT = useReducer + basicStateReducer!
  → ⚠️ Vì vậy KHÔNG ĐƯỢC hooks trong if/for!

  Q: "Frontend Lead Infrastructure?"
  A: 3 trụ cột:
  → Scaffold: CLI tạo project + GitLab repo + CI/CD tự động!
  → Framework: request, state, routing, business modules!
  → Components: Antd customization + JSON2Page cho CRUD!

  Q: "Rich Text Editor?"
  A: Ban đầu Slate.js (framework, flexible nhưng TỰ XÂY!).
  → Sau chuyển Jodit (full features, TypeScript, dễ mở rộng!).
  → Team nhỏ → chọn sẵn có > tự xây!

  Q: "Quality & Stability?"
  A: 2 phần:
  → Dev: Jest (unit) + Cypress (E2E)!
  → Online: error/onerror/xhr.error/unhandledrejection!
  → Reporting: WebSocket/HTTP + cache weak network + data merge!
  → Dashboard: trend charts + threshold → alarm email!

  Q: "Code output: var foo=1; fn(); console.log(foo)?"
  A: Kết quả = 1!
  → function foo() {} bên trong fn() được HOIST lên đầu fn()!
  → Tạo LOCAL foo → foo=3 ghi đè LOCAL, không ảnh hưởng GLOBAL!

  Q: "Version sort?"
  A: Split('.') → so sánh từng phần dạng SỐ → pad 0 nếu thiếu!
  → O(n log n × k)!
```

---

### Checklist

- [ ] **useState**: Mảng + index (simple) hoặc Linked List trong Fiber; closure giữ currentIndex; reset index mỗi render!
- [ ] **setState 2 cách**: direct `setState(5)` hoặc functional `setState(prev => prev + 1)`; batch trong React 18!
- [ ] **useState = useReducer**: basicStateReducer: `typeof action === 'function' ? action(state) : action`!
- [ ] **Hooks rules**: KHÔNG gọi trong if/for vì thứ tự phải NHẤT QUÁN giữa các render!
- [ ] **D2C Plugin**: WebView (frontend panel) + CocoaScript (native Sketch API); component templates với unique IDs!
- [ ] **Monitoring**: WebSocket log service → Data Warehouse → trend charts → thresholds → alarm email!
- [ ] **Scaffold**: CLI tạo project + GitLab repo (API) + CI/CD (.gitlab-ci.yml) + embedded configs!
- [ ] **Framework**: Request module, State management, Routing, Business capabilities (PDF, Charts, Editor)!
- [ ] **JSON2Page**: JSON config → toàn bộ CRUD page (table + form + search + modals); tiết kiệm 70-80% code!
- [ ] **Rich Text**: Slate.js (framework, tự xây) → Jodit (full features, TypeScript, dễ mở rộng); team nhỏ → sẵn có!
- [ ] **Quality**: Jest (unit) + Cypress (E2E); Online: 4 loại error listeners + reporting + cache + alarm!
- [ ] **Hoisting puzzle**: `function foo(){}` trong fn() hoist lên đầu fn() → tạo LOCAL foo → foo=3 ghi đè local → global foo=1!
- [ ] **Version sort**: `split('.')` → so sánh từng phần parseInt → pad 0 nếu ngắn hơn → O(n log n × k)!

---

_Nguồn: Helianthuswhite — juejin.cn/post/7298218459795734582_
_Cập nhật lần cuối: Tháng 2, 2026_
