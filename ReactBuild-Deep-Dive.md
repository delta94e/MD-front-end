# Tự Xây Dựng React — Hiểu Nguyên Lý Qua Triển Khai — Deep Dive

> 📅 2026-02-13 · ⏱ 25 phút đọc
>
> Tự triển khai React từ đầu: createElement, render, Fiber, Concurrent Mode,
> Reconciliation, Function Components, useState, useEffect
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Ultimate React Interview — Hiểu bản chất!

---

## Mục Lục

| #   | Phần                                                  |
| --- | ----------------------------------------------------- |
| 1   | React Core — 7 đặc trưng cốt lõi                      |
| 2   | Step 1: createElement — Tạo Virtual DOM               |
| 3   | Step 2: render — VDOM → Real DOM                      |
| 4   | Step 3: Concurrent Mode — Fiber & requestIdleCallback |
| 5   | Step 4: Fiber Tree & Work Loop                        |
| 6   | Step 5: Render & Commit Phases                        |
| 7   | Step 6: Reconciliation — Diff Algorithm               |
| 8   | Step 7: Function Components                           |
| 9   | Step 8: useState Hook                                 |
| 10  | Step 9: useEffect Hook                                |
| 11  | Hoàn chỉnh — Mini React sử dụng được                  |
| 12  | Tổng kết & Checklist phỏng vấn                        |

---

## §1. React Core — 7 đặc trưng cốt lõi

```
REACT = 7 ĐẶC TRƯNG:
═══════════════════════════════════════════════════════════════

  ① JSX — Viết UI như HTML trong JavaScript
     → Babel compile → createElement() calls

  ② Virtual DOM — JS object tree mô phỏng Real DOM
     → So sánh (diff) → chỉ patch phần thay đổi

  ③ One-way Data Flow — Dữ liệu chỉ chảy từ cha → con
     → Props immutable, state local, predictable

  ④ Component-Based — UI = tổ hợp components
     → Mỗi component = function(props) → VNode

  ⑤ Declarative — Mô tả UI MUỐN GÌ, không phải LÀM SAO
     → React tự tìm cách cập nhật DOM tối ưu

  ⑥ Hooks — State + Side effects trong function components
     → useState, useEffect, useContext, useMemo...

  ⑦ Fiber Architecture — Render có thể dừng/tiếp tục
     → Không block main thread → UI mượt 60fps

  CHÚNG TA SẼ TỰ XÂY DỰNG TẤT CẢ 7 ĐẶC TRƯNG NÀY! 🚀
```

---

## §2. Step 1: createElement — Tạo Virtual DOM

```
TỪ JSX ĐẾN createElement:
═══════════════════════════════════════════════════════════════

  // JSX viết:
  const element = (
      <div id="foo">
          <a>bar</a>
          <b />
      </div>
  );

  // Babel compile thành:
  const element = createElement(
      "div",
      { id: "foo" },
      createElement("a", null, "bar"),
      createElement("b")
  );

  // Kết quả là VDOM object:
  {
      type: "div",
      props: {
          id: "foo",
          children: [
              { type: "a", props: { children: ["bar"] } },
              { type: "b", props: { children: [] } }
          ]
      }
  }
```

```javascript
// ════════════════════════════════════════════════════════════
// STEP 1: TỰ TRIỂN KHAI createElement
// ════════════════════════════════════════════════════════════

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        // Text nodes: wrap thành object thống nhất
        typeof child === "object" ? child : createTextElement(child),
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT", // Kiểu đặc biệt cho text
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

// Kiểm tra:
const element = createElement(
  "div",
  { id: "foo" },
  createElement("a", null, "bar"),
  "hello", // ← Text node
);

console.log(JSON.stringify(element, null, 2));
// {
//   type: "div",
//   props: {
//     id: "foo",
//     children: [
//       { type: "a", props: { children: [
//         { type: "TEXT_ELEMENT", props: { nodeValue: "bar", children: [] } }
//       ] } },
//       { type: "TEXT_ELEMENT", props: { nodeValue: "hello", children: [] } }
//     ]
//   }
// }
```

```
TẠI SAO createTextElement:
═══════════════════════════════════════════════════════════════

  React thật KHÔNG wrap text nodes thành object.
  Nhưng chúng ta wrap để code ĐƠN GIẢN HƠN:
  → Mọi node đều có { type, props } → xử lý thống nhất!
  → Không cần if/else kiểm tra text vs element!
```

---

## §3. Step 2: render — VDOM → Real DOM

```javascript
// ════════════════════════════════════════════════════════════
// STEP 2: TỰ TRIỂN KHAI render (version 1 — đơn giản)
// ════════════════════════════════════════════════════════════

function render(element, container) {
  // ① Tạo DOM node:
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  // ② Gán props (attributes + event listeners):
  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  // ③ Render children đệ quy:
  element.props.children.forEach((child) => render(child, dom));

  // ④ Thêm vào container:
  container.appendChild(dom);
}

// Sử dụng:
const container = document.getElementById("root");
render(element, container);
```

```
VẤN ĐỀ CỦA VERSION 1:
═══════════════════════════════════════════════════════════════

  render() gọi ĐỆ QUY → KHÔNG THỂ DỪNG GIỮA CHỪNG!

  Tree lớn (10,000 nodes):
  → render() chạy liên tục → block main thread
  → User click/type → KHÔNG PHẢN HỒI cho đến khi render xong!
  → Nếu > 16.67ms → DROP FRAME → UI GIẬT! 💀

  → CẦN: Chia nhỏ công việc + cho phép browser xen kẽ!
  → GIẢI PHÁP: Fiber Architecture + Concurrent Mode
```

---

## §4. Step 3: Concurrent Mode — Fiber & requestIdleCallback

```
requestIdleCallback — LÀM VIỆC KHI RẢNH:
═══════════════════════════════════════════════════════════════

  Browser event loop mỗi frame (~16.67ms @ 60fps):

  ┌──────────────────────────────────────────────────────┐
  │ Input events → JS → rAF → Layout → Paint → Idle     │
  └────────────────────────────────────────────┬─────────┘
                                               │
                                               ▼
                                    requestIdleCallback!
                                    (thời gian còn thừa)

  requestIdleCallback(callback):
  → Gọi callback KHI BROWSER RẢNH
  → Truyền deadline object: deadline.timeRemaining()
  → Nếu hết thời gian → DỪNG → tiếp tục frame sau!
```

```javascript
// ════════════════════════════════════════════════════════════
// STEP 3: WORK LOOP — Chia nhỏ công việc
// ════════════════════════════════════════════════════════════

let nextUnitOfWork = null; // Fiber tiếp theo cần xử lý

function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    // ① Xử lý 1 unit of work (1 Fiber node):
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    // ② Kiểm tra: còn thời gian không?
    shouldYield = deadline.timeRemaining() < 1;
    // Nếu < 1ms → DỪNG! Trả quyền cho browser!
  }

  // ③ Đăng ký callback cho frame tiếp theo:
  requestIdleCallback(workLoop);
}

// Bắt đầu work loop:
requestIdleCallback(workLoop);
```

```
CONCURRENT MODE FLOW:
═══════════════════════════════════════════════════════════════

  Frame 1: [JS] [Layout] [Paint] [Idle: process Fiber 1, 2, 3]
  Frame 2: [JS] [Layout] [Paint] [Idle: process Fiber 4, 5]
  Frame 3: [User Click!] [JS handler] [Paint] [Idle: Fiber 6, 7]
  Frame 4: [JS] [Layout] [Paint] [Idle: process Fiber 8 → DONE!]

  → Mỗi frame chỉ xử lý VÀI Fiber nodes!
  → User input xen kẽ giữa các frame → UI LUÔN MƯỢT!
  → KHÔNG bao giờ block main thread > 16ms!

  ⚠️ React thật dùng scheduler riêng, KHÔNG dùng requestIdleCallback!
  → Nhưng concept tương tự: chia nhỏ + yield + resume
```

---

## §5. Step 4: Fiber Tree & Work Loop

```
FIBER NODE — Cấu trúc cho mỗi element:
═══════════════════════════════════════════════════════════════

  Mỗi VDOM element → 1 Fiber node → 1 unit of work

  {
      type:      "div",           // Element type
      props:     { id: "foo" },   // Props
      dom:       HTMLElement,     // Real DOM node (null nếu chưa tạo)
      parent:    Fiber,           // → parent Fiber
      child:     Fiber | null,    // → first child Fiber
      sibling:   Fiber | null,    // → next sibling Fiber
      alternate: Fiber | null,    // → old Fiber (cho diff)
      effectTag: "PLACEMENT" | "UPDATE" | "DELETION",
      hooks:     [],              // useState, useEffect hooks
  }

  FIBER TREE → LINKED LIST (duyệt bằng 3 pointer):
  ┌──────┐
  │ root │
  │      │ child
  │      ▼
  │   ┌──────┐ sibling ┌──────┐ sibling ┌──────┐
  │   │  h1  │────────→│  p   │────────→│  a   │
  │   └──┬───┘         └──┬───┘         └──────┘
  │      │ child          │ child
  │      ▼                ▼
  │   ┌──────┐         ┌──────┐
  │   │"Hello"│         │"World"│
  │   └──────┘         └──────┘
  └──────┘

  Thứ tự duyệt (DFS qua linked list):
  root → h1 → "Hello" → (quay lên) → p → "World" → (quay lên) → a
```

```javascript
// ════════════════════════════════════════════════════════════
// STEP 4: performUnitOfWork — Xử lý 1 Fiber
// ════════════════════════════════════════════════════════════

function performUnitOfWork(fiber) {
  // ① TẠO DOM node cho fiber (nếu chưa có):
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // ② TẠO Fiber children từ VDOM children:
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;

  while (index < elements.length) {
    const element = elements[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
      child: null,
      sibling: null,
      alternate: null,
      effectTag: "PLACEMENT", // Mới tạo → PLACEMENT
    };

    // First child → fiber.child
    // Siblings → prevSibling.sibling
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }

  // ③ TRẢ VỀ unit of work TIẾP THEO:
  // Ưu tiên: child → sibling → uncle (parent's sibling)
  if (fiber.child) return fiber.child; // Đi xuống con
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling; // Đi ngang
    nextFiber = nextFiber.parent; // Đi lên
  }
  return null; // Hết → DONE!
}

// Helper: Tạo DOM từ Fiber:
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props); // Gán props
  return dom;
}
```

---

## §6. Step 5: Render & Commit Phases

```
VẤN ĐỀ: render() thêm DOM từng node một
═══════════════════════════════════════════════════════════════

  Nếu appendChild NGAY trong performUnitOfWork:
  → User thấy UI XÂY DỰNG TỪNG PHẦN! (incomplete UI)
  → Browser paint giữa chừng → FLICKER! 💀
  → Nếu bị interrupt → UI dở dang!

  GIẢI PHÁP: 2 PHASES!
  ① RENDER PHASE: Build Fiber tree, KHÔNG chạm DOM!
  ② COMMIT PHASE: Apply TẤT CẢ thay đổi lên DOM MỘT LẦN!
```

```javascript
// ════════════════════════════════════════════════════════════
// STEP 5: RENDER + COMMIT PHASES
// ════════════════════════════════════════════════════════════

let wipRoot = null; // Work-in-progress root Fiber
let currentRoot = null; // Root hiện tại (đã commit)
let deletions = null; // Fibers cần xóa

// render(): Khởi tạo + bắt đầu work loop
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot, // Liên kết với tree cũ (cho diff!)
  };
  deletions = [];
  nextUnitOfWork = wipRoot; // Bắt đầu work!
}

// Updated workLoop: commit khi render xong TẤT CẢ
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  // RENDER XONG → COMMIT!
  if (!nextUnitOfWork && wipRoot) {
    commitRoot(); // ← Apply tất cả changes lên DOM!
  }

  requestIdleCallback(workLoop);
}

// commitRoot: Apply changes lên DOM
function commitRoot() {
  // ① Xóa các node cần delete:
  deletions.forEach(commitWork);

  // ② Commit tree mới:
  commitWork(wipRoot.child);

  // ③ Swap: WIP → Current
  currentRoot = wipRoot;
  wipRoot = null;
}

// commitWork: Xử lý từng Fiber
function commitWork(fiber) {
  if (!fiber) return;

  // Tìm parent DOM node (skip function components — không có DOM!):
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom) {
    // THÊM MỚI:
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom) {
    // CẬP NHẬT props:
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    // XÓA:
    commitDeletion(fiber, domParent);
    return; // Không cần commit children!
  }

  // Commit children + siblings:
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    // Function component → tìm child có DOM:
    commitDeletion(fiber.child, domParent);
  }
}
```

---

## §7. Step 6: Reconciliation — Diff Algorithm

```javascript
// ════════════════════════════════════════════════════════════
// STEP 6: RECONCILIATION — So sánh OLD vs NEW
// ════════════════════════════════════════════════════════════

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    // So sánh type:
    const sameType = oldFiber && element && element.type === oldFiber.type;

    // ① CÙNG TYPE → UPDATE (giữ DOM, đổi props):
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props, // Props MỚI
        dom: oldFiber.dom, // GIỮA DOM cũ!
        parent: wipFiber,
        alternate: oldFiber, // Liên kết old Fiber
        effectTag: "UPDATE", // ← Đánh dấu UPDATE
        hooks: oldFiber.hooks, // Giữ hooks state!
      };
    }

    // ② KHÁC TYPE + CÓ element MỚI → PLACEMENT (tạo mới):
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null, // Tạo DOM mới!
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT", // ← Đánh dấu THÊM MỚI
        hooks: [],
      };
    }

    // ③ KHÁC TYPE + CÓ oldFiber → DELETION (xóa cũ):
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber); // ← Đánh dấu XÓA
    }

    // Di chuyển đến sibling tiếp theo:
    if (oldFiber) oldFiber = oldFiber.sibling;

    // Xây dựng linked list:
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}
```

```javascript
// updateDom: Cập nhật props trên Real DOM
const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);

function updateDom(dom, prevProps, nextProps) {
  // ① XÓA old event listeners:
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // ② XÓA old properties:
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // ③ SET new/changed properties:
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // ④ ADD new event listeners:
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}
```

```
RECONCILIATION SUMMARY:
═══════════════════════════════════════════════════════════════

  OLD FIBER:         NEW ELEMENT:        RESULT:
  ┌──────────┐       ┌──────────┐
  │ type: div│       │ type: div│   → CÙNG TYPE → UPDATE ✏️
  │ id: "a"  │       │ id: "b"  │     (giữ DOM, đổi id: "a"→"b")
  └──────────┘       └──────────┘

  ┌──────────┐       ┌──────────┐
  │ type: div│       │ type: p  │   → KHÁC TYPE → DELETE div 🗑️
  └──────────┘       └──────────┘                  + PLACE p 📌

  ┌──────────┐
  │ type: div│       (không có)     → DELETION 🗑️ (xóa div)
  └──────────┘

  (không có)         ┌──────────┐
                     │ type: p  │   → PLACEMENT 📌 (thêm p mới)
                     └──────────┘
```

---

## §8. Step 7: Function Components

```
FUNCTION COMPONENTS — 2 KHÁC BIỆT:
═══════════════════════════════════════════════════════════════

  ① Function component → KHÔNG có DOM node:
     → <App /> không tạo DOM element nào!
     → Chỉ là function trả về VDOM elements
     → Fiber node có dom = null

  ② Children ĐẾN TỪ VIỆC GỌI FUNCTION:
     → Không phải từ props.children
     → Mà từ kết quả gọi: type(props)
```

```javascript
// ════════════════════════════════════════════════════════════
// STEP 7: FUNCTION COMPONENTS
// ════════════════════════════════════════════════════════════

// Function Component:
function Counter({ count }) {
  return createElement("h1", null, "Count: ", count);
  // → Trả về VDOM element (không tạo DOM!)
}

// Sử dụng:
const app = createElement(Counter, { count: 5 });
// app = { type: Counter, props: { count: 5, children: [] } }

// Updated performUnitOfWork:
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // Trả về next unit of work (giữ nguyên):
  if (fiber.child) return fiber.child;
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
  return null;
}

// Function Component → gọi function để có children:
let wipFiber = null; // Fiber đang xử lý (cho hooks!)
let hookIndex = null; // Index hook hiện tại

function updateFunctionComponent(fiber) {
  wipFiber = fiber; // Track fiber cho hooks
  hookIndex = 0; // Reset hook index
  wipFiber.hooks = []; // Reset hooks array

  // ① GỌI FUNCTION → nhận VDOM elements:
  const children = [fiber.type(fiber.props)];
  // Counter({ count: 5 }) → h1 element

  // ② Reconcile children:
  reconcileChildren(fiber, children);
}

// Host Component (div, p, span...) → tạo DOM như bình thường:
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}
```

---

## §9. Step 8: useState Hook

```
useState — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  Hooks lưu trên FIBER NODE (không phải global):
  → Mỗi component instance = 1 Fiber = 1 mảng hooks[]
  → hooks[0] = useState đầu tiên
  → hooks[1] = useState thứ hai
  → hooks[2] = useEffect...

  → ĐÓ LÀ LÝ DO: Hooks phải gọi CÙNG THỨ TỰ mỗi render!
  → Không được gọi trong if/for → thay đổi index → SAI hook! 💀

  Fiber {
      hooks: [
          { state: 0, queue: [] },     // useState(0) #1
          { state: "hello", queue: [] }, // useState("hello") #2
      ]
  }
```

```javascript
// ════════════════════════════════════════════════════════════
// STEP 8: useState HOOK
// ════════════════════════════════════════════════════════════

function useState(initial) {
  // ① Lấy old hook (nếu có — re-render):
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  // ② Tạo hook mới:
  const hook = {
    // State: dùng cũ nếu có, không thì initial
    state: oldHook ? oldHook.state : initial,
    queue: [], // Queue cho setState actions
  };

  // ③ Apply PENDING ACTIONS từ lần render trước:
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state =
      typeof action === "function"
        ? action(hook.state) // Functional update: setState(prev => ...)
        : action; // Direct update: setState(value)
  });

  // ④ setState function:
  const setState = (action) => {
    hook.queue.push(action);

    // Trigger RE-RENDER:
    // (Giống lần đầu gọi render — tạo WIP root mới!)
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  // ⑤ Lưu hook vào Fiber + tăng index:
  wipFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
}
```

```
useState FLOW:
═══════════════════════════════════════════════════════════════

  // Component:
  function Counter() {
      const [count, setCount] = useState(0);
      return createElement("button", {
          onClick: () => setCount(c => c + 1)
      }, "Count: ", count);
  }

  RENDER LẦN 1 (mount):
  ① useState(0): oldHook = null → state = 0 (initial)
  ② hooks = [{ state: 0, queue: [] }]
  ③ Return: [0, setState]
  ④ Render: "Count: 0"

  USER CLICK:
  ① setCount(c => c + 1) → push action vào hook.queue
  ② Tạo WIP root mới → trigger work loop

  RENDER LẦN 2 (update):
  ① useState(0): oldHook = { state: 0, queue: [c => c+1] }
  ② Apply actions: 0 → (c => c+1)(0) → 1
  ③ hooks = [{ state: 1, queue: [] }]
  ④ Return: [1, setState]
  ⑤ Render: "Count: 1"
  ⑥ Reconciliation: so sánh "Count: 0" vs "Count: 1" → UPDATE text node!
```

---

## §10. Step 9: useEffect Hook

```javascript
// ════════════════════════════════════════════════════════════
// STEP 9: useEffect HOOK
// ════════════════════════════════════════════════════════════

function useEffect(callback, deps) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  // ① Kiểm tra deps có thay đổi không:
  const hasChanged = oldHook
    ? !deps || deps.some((dep, i) => dep !== oldHook.deps[i])
    : true; // Lần đầu → luôn chạy!

  const hook = {
    deps,
    callback,
    cleanup: oldHook ? oldHook.cleanup : undefined,
    hasChanged,
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
}

// Chạy effects SAU commit (async, sau paint):
function commitEffects(fiber) {
  if (!fiber) return;

  if (fiber.hooks) {
    fiber.hooks.forEach((hook) => {
      if (hook.hasChanged && hook.callback) {
        // ① Chạy cleanup của lần trước:
        if (hook.cleanup) hook.cleanup();
        // ② Chạy effect mới:
        hook.cleanup = hook.callback();
        // → callback return cleanup function!
      }
    });
  }

  commitEffects(fiber.child);
  commitEffects(fiber.sibling);
}

// Gọi trong commitRoot (sau khi DOM đã update):
function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  // Chạy effects SAU commit:
  commitEffects(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}
```

```
useEffect FLOW:
═══════════════════════════════════════════════════════════════

  // Component:
  function Timer() {
      const [seconds, setSeconds] = useState(0);

      useEffect(() => {
          const id = setInterval(() => {
              setSeconds(s => s + 1);
          }, 1000);
          return () => clearInterval(id);  // ← Cleanup!
      }, []);  // ← [] = chỉ chạy 1 lần (mount)

      return createElement("p", null, "Seconds: ", seconds);
  }

  MOUNT:
  ① useEffect deps = [] → lần đầu → hasChanged = true
  ② Commit xong → chạy callback → setInterval bắt đầu
  ③ Lưu cleanup = () => clearInterval(id)

  UPDATE (mỗi giây):
  ① setSeconds trigger re-render
  ② useEffect deps = [] → [] vs [] → KHÔNG đổi → hasChanged = false
  ③ Callback KHÔNG chạy lại! ← Đúng! (deps trống)

  UNMOUNT:
  ① Chạy cleanup: clearInterval(id) → dừng timer!
```

---

## §11. Hoàn chỉnh — Mini React sử dụng được

```javascript
// ════════════════════════════════════════════════════════════
// MINI REACT — CODE HOÀN CHỈNH
// ════════════════════════════════════════════════════════════

const MiniReact = {
  createElement,
  render,
  useState,
  useEffect,
};

// ═══ Sử dụng ═══

/** @jsx MiniReact.createElement */
// (Hoặc cấu hình Babel: pragma = MiniReact.createElement)

function Counter() {
  const [count, setCount] = MiniReact.useState(0);
  const [name, setName] = MiniReact.useState("World");

  MiniReact.useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  return MiniReact.createElement(
    "div",
    null,
    MiniReact.createElement("h1", null, `Hello ${name}!`),
    MiniReact.createElement("p", null, `Count: ${count}`),
    MiniReact.createElement(
      "button",
      { onClick: () => setCount((c) => c + 1) },
      "+",
    ),
    MiniReact.createElement("input", {
      value: name,
      onInput: (e) => setName(e.target.value),
    }),
  );
}

MiniReact.render(
  MiniReact.createElement(Counter),
  document.getElementById("root"),
);
```

```
KIẾN TRÚC MINI REACT — TỔNG QUAN:
═══════════════════════════════════════════════════════════════

  createElement(type, props, ...children)
       │
       ▼ VDOM Element
  render(element, container)
       │
       ▼ Tạo wipRoot Fiber + bắt đầu workLoop
  workLoop(deadline)
       │
       ▼ Xử lý từng Fiber (interruptible!)
  performUnitOfWork(fiber)
       ├── updateFunctionComponent → gọi fn(props) + hooks
       └── updateHostComponent → tạo DOM + reconcileChildren
              │
              ▼
  reconcileChildren(fiber, elements)
       │
       ▼ So sánh old vs new → effectTag: PLACEMENT/UPDATE/DELETION
  commitRoot()
       ├── commitWork(fiber) → apply DOM changes
       └── commitEffects(fiber) → chạy useEffect callbacks
              │
              ▼
  useState(initial) → [state, setState]
       └── setState(action) → trigger re-render (wipRoot = new)

  useEffect(callback, deps) → chạy sau commit nếu deps thay đổi
```

```
SO SÁNH MINI REACT vs REACT THẬT:
═══════════════════════════════════════════════════════════════

  ┌───────────────────────┬─────────────┬──────────────────┐
  │ Feature               │ Mini React  │ React Thật       │
  ├───────────────────────┼─────────────┼──────────────────┤
  │ createElement         │ ✅          │ ✅ + JSX runtime │
  │ Fiber tree            │ ✅ linked   │ ✅ + lanes/priority│
  │ Concurrent            │ ✅ rIC      │ ✅ Scheduler pkg │
  │ Reconciliation        │ ✅ basic    │ ✅ + key-based   │
  │ Render + Commit       │ ✅ 2 phases │ ✅ + 3 sub-phases│
  │ Function Components   │ ✅          │ ✅               │
  │ Class Components      │ ❌          │ ✅               │
  │ useState              │ ✅ basic    │ ✅ + batching    │
  │ useEffect             │ ✅ basic    │ ✅ + useLayout   │
  │ Context               │ ❌          │ ✅               │
  │ useMemo/useCallback   │ ❌          │ ✅               │
  │ Error Boundaries      │ ❌          │ ✅               │
  │ Key-based diff        │ ❌          │ ✅               │
  │ Synthetic Events      │ ❌          │ ✅ delegation    │
  │ Server Components     │ ❌          │ ✅ (React 19)    │
  └───────────────────────┴─────────────┴──────────────────┘
```

---

## §12. Tổng kết & Checklist phỏng vấn

```
MIND MAP — BUILD YOUR OWN REACT:
═══════════════════════════════════════════════════════════════

  Mini React
  ├── createElement → VDOM object { type, props, children }
  ├── render → tạo wipRoot Fiber → bắt đầu workLoop
  ├── workLoop → requestIdleCallback → xử lý từng Fiber
  ├── Fiber → linked list (child/sibling/parent) → interruptible
  ├── 2 Phases → Render (build Fiber tree) → Commit (apply DOM)
  ├── Reconciliation → same type=UPDATE, diff type=DELETE+PLACE
  ├── Function Comp → type(props) → reconcile result
  ├── useState → hooks[] trên Fiber, queue actions, trigger re-render
  └── useEffect → deps comparison, chạy sau commit, cleanup trước effect mới
```

### Checklist

- [ ] **createElement**: JSX → Babel → `createElement(type, props, ...children)` → VNode object
- [ ] **createTextElement**: wrap text/number thành `{ type: "TEXT_ELEMENT", props: { nodeValue } }` để xử lý thống nhất
- [ ] **render v1**: đệ quy tạo DOM → vấn đề: block main thread, không thể dừng giữa chừng
- [ ] **requestIdleCallback**: chạy code khi browser rảnh, `deadline.timeRemaining()` < 1ms → dừng!
- [ ] **workLoop**: `while (nextUnitOfWork && !shouldYield)` → xử lý 1 Fiber → kiểm tra thời gian → continue/yield
- [ ] **Fiber node**: `{ type, props, dom, parent, child, sibling, alternate, effectTag, hooks }`
- [ ] **Fiber traversal**: child → sibling → parent.sibling (DFS qua linked list, interruptible!)
- [ ] **performUnitOfWork**: tạo DOM → reconcile children → trả next work (child > sibling > uncle)
- [ ] **2 phases**: Render (build Fiber tree, KHÔNG chạm DOM!) → Commit (apply MỌI changes 1 lần)
- [ ] **Tại sao 2 phases**: tránh user thấy UI incomplete, tránh flicker khi bị interrupt
- [ ] **commitWork**: PLACEMENT → appendChild, UPDATE → updateDom, DELETION → removeChild
- [ ] **reconcileChildren**: cùng type → UPDATE (giữ DOM cũ, props mới), khác type → DELETE + PLACE
- [ ] **updateDom**: xóa old event listeners → xóa gone props → set new props → add new listeners
- [ ] **Function component**: `fiber.type(fiber.props)` → không có DOM → commitWork phải skip lên parent
- [ ] **wipFiber + hookIndex**: track Fiber đang render + vị trí hook → LÝ DO hooks phải cùng thứ tự!
- [ ] **useState**: oldHook.state + apply queue actions + return [state, setState]
- [ ] **setState**: push action vào queue → tạo wipRoot mới → trigger workLoop (re-render!)
- [ ] **Functional update**: `setState(prev => prev + 1)` → apply bằng `action(hook.state)` — xử lý batch!
- [ ] **useEffect**: so sánh deps (some !== check) → hasChanged → chạy cleanup trước → chạy callback sau commit
- [ ] **Rules of Hooks**: phải cùng thứ tự vì hooks lưu theo INDEX trên `fiber.hooks[]`, if/for thay đổi index → sai hook!

---

_Nguồn: Tự Xây Dựng React — Build Your Own React Framework_
_Tham khảo: Rodrigo Pombo "Build Your Own React" (pomb.us)_
_Cập nhật lần cuối: Tháng 2, 2026_
