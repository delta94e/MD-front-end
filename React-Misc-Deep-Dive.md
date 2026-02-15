# React Miscellaneous — Deep Dive

> 📅 2026-02-12 · ⏱ 30 phút đọc
>
> 22 chủ đề: Component naming, React versions, global dialog,
> data persistence, React vs Vue, TypeScript, design philosophy,
> props.children vs React.Children, state lifting, constructor vs
> getInitialState, StrictMode, iteration, data reload, libraries,
> JSX, HOC decorator pattern, SSR, async/await.
> Độ khó: ⭐️⭐️⭐️ | Chủ đề: React Tổng Hợp

---

## Mục Lục

0. [Component Naming](#0-component-naming)
1. [React Versions & New Features](#1-react-versions)
2. [Global Dialog Implementation](#2-global-dialog)
3. [Data Persistence](#3-data-persistence)
4. [React vs Vue](#4-react-vs-vue)
5. [TypeScript + React](#5-typescript--react)
6. [React Design Philosophy](#6-react-design-philosophy)
7. [props.children vs React.Children](#7-propschildren-vs-reactchildren)
8. [State Lifting (Trạng thái nâng lên)](#8-state-lifting)
9. [constructor vs getInitialState](#9-constructor-vs-getinitialstate)
10. [StrictMode](#10-strictmode)
11. [Iteration in React](#11-iteration-in-react)
12. [Data Preservation on Reload](#12-data-preservation-on-reload)
13. [react.js, react-dom.js, babel.js](#13-core-libraries)
14. [JSX — Bắt buộc không?](#14-jsx)
15. [Tại sao import React khi dùng JSX?](#15-import-react)
16. [Async/Await trong React](#16-asyncawait)
17. [React.Children.map vs Array.map](#17-reactchildrenmap)
18. [SSR — Server-Side Rendering](#18-ssr)
19. [HOC & Decorator Pattern](#19-hoc--decorator-pattern)
20. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#20-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Component Naming

### Cách đặt tên

```javascript
// ❌ Dùng displayName (cách cũ, createClass)
export default React.createClass({
    displayName: 'TodoApp',
    // ...
});

// ✅ Dùng class name trực tiếp (React recommend)
export default class TodoApp extends React.Component {
    // ...
}

// ✅ Function component (hiện đại nhất)
export default function TodoApp() {
    // ...
}
```

```
NAMING CONVENTIONS:
  ✅ PascalCase cho components: TodoApp, UserProfile
  ✅ camelCase cho instances: const todoApp = <TodoApp />
  ✅ File name = Component name: TodoApp.tsx
  ❌ Không dùng displayName trừ HOC/forwardRef debug
```

---

## 1. React Versions

### React 16.x — 3 Big Features

```
REACT 16.x — NEW FEATURES:
═══════════════════════════════════════════════════════════════

  ① TIME SLICING (CPU optimization)
     → Chia rendering thành chunks
     → Pause/resume giữa chừng
     → UI responsive ngay cả trên máy chậm
     → Dựa trên Fiber architecture

  ② SUSPENSE (Network IO)
     → Kết hợp React.lazy() → async load component
     → Pause render → chờ data/code → resume
     → Async nhưng viết code SYNC style

  ③ ERROR BOUNDARIES (componentDidCatch)
     → Bắt errors từ child tree
     → Hiển thị fallback UI thay vì crash
     → Reusable error component
```

### React 16.8 — Hooks

```
HOOKS (16.8):
  useState        → Stateful function components
  useEffect       → Side effects (lifecycle replacement)
  useContext      → Context access
  useReducer      → Complex state (action/reducer)
  useCallback     → Memoize functions
  useMemo         → Memoize values
  useRef          → Mutable ref across renders
  useLayoutEffect → Sync DOM mutations
  useImperativeHandle → Customize ref instance
```

### React 16.9

```
REACT 16.9:
  ① Rename UNSAFE_ lifecycle (UNSAFE_componentWillMount...)
  ② Deprecate javascript: URLs (security)
  ③ Deprecate Factory components
  ④ act() supports async
  ⑤ <React.Profiler> for performance measurement
```

### React 16.13.0

```
REACT 16.13.0:
  ① setState during render (same component only)
  ② Detect conflicting style rules + warnings
  ③ Deprecate unstable_createPortal → createPortal
  ④ Component stack in dev warnings
```

---

## 2. Global Dialog

### Implementation Pattern

```javascript
// ── Dialog Component (singleton, mount to body) ──
import React, { Component } from "react";
import ReactDOM from "react-dom";

let defaultState = {
  visible: false,
  title: "Thông báo",
  content: null,
  onClose: () => {},
};

class Dialog extends Component {
  state = { ...defaultState };

  open = (options = {}) => {
    this.setState({ ...defaultState, ...options, visible: true });
  };

  close = () => {
    this.state.onClose();
    this.setState({ ...defaultState });
  };

  render() {
    if (!this.state.visible) return null;
    return (
      <div className="dialog-overlay">
        <div className="dialog-content">
          <h3>{this.state.title}</h3>
          {this.state.content}
          <button onClick={this.close}>Đóng</button>
        </div>
      </div>
    );
  }
}

// Mount singleton vào body
const div = document.createElement("div");
document.body.appendChild(div);
const dialogInstance = ReactDOM.render(<Dialog />, div);

// Export API
export default dialogInstance;
// Dùng: dialog.open({ title: '...', content: <Child /> })
```

```css
/* dialog.css */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

```
MODERN APPROACH (Hooks + Portal):
  ① React.createPortal → render vào DOM node khác
  ② useContext → global dialog state
  ③ Zustand/Jotai → dialog state management
  → Không cần ReactDOM.render singleton
```

---

## 3. Data Persistence

### localStorage Wrapper

```javascript
const storage = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get(key) {
    return JSON.parse(localStorage.getItem(key));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};
export default storage;
```

### redux-persist (Redux + localStorage)

```javascript
// ── store.js ──
import { createStore } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // localStorage
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import reducers from "../reducers";

const persistConfig = {
  key: "root",
  storage,
  stateReconciler: autoMergeLevel2,
  // whitelist: ['auth', 'settings'],  // chỉ persist những reducer cần
  // blacklist: ['ui'],                // bỏ qua những reducer không cần
};

const persistedReducer = persistReducer(persistConfig, reducers);
const store = createStore(persistedReducer);
export const persistor = persistStore(store);
export default store;
```

```javascript
// ── index.js ──
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/lib/integration/react";
import store, { persistor } from "./store";

ReactDOM.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>,
  document.getElementById("root"),
);
// PersistGate: chờ rehydrate xong → render App
```

---

## 4. React vs Vue

### Điểm giống

```
GIỐNG NHAU:
  ✅ Core library focus (routing, state → separate libs)
  ✅ Build tools riêng (CRA / vue-cli)
  ✅ Virtual DOM
  ✅ Props truyền data giữa components
  ✅ Component-based architecture
```

### Điểm khác

```
REACT vs VUE — DIFFERENCES:
═══════════════════════════════════════════════════════════════
  ┌───────────────────┬──────────────────┬──────────────────┐
  │                   │ React            │ Vue              │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Data flow         │ One-way only     │ Two-way binding  │
  │                   │                  │ (v-model)        │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Re-render         │ TOÀN BỘ subtree  │ Chỉ component    │
  │                   │ (cần PureComp/   │ phụ thuộc data   │
  │                   │ memo optimize)   │ (auto tracking)  │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Template          │ JSX (JS logic    │ HTML template    │
  │                   │ trong render)    │ (gần standard)   │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Component import  │ import → dùng    │ import → khai    │
  │                   │ trực tiếp render │ báo components{} │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Data tracking     │ Immutable        │ Mutable          │
  │                   │ (reference comp) │ (getter/setter)  │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Extend component  │ HOC (functions)  │ Mixins/Composables│
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Build tool        │ Create React App │ vue-cli / Vite   │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Mobile            │ React Native     │ Weex / Capacitor │
  └───────────────────┴──────────────────┴──────────────────┘
```

---

## 5. TypeScript + React

### Setup

```bash
# ── Tạo project mới ──
npx create-react-app demo --template typescript

# ── Thêm vào project có sẵn ──
npm install --save typescript @types/node @types/react @types/react-dom @types/jest
# Đổi .js → .tsx, .ts
```

### Ví dụ

```typescript
// ── Props typing ──
interface UserCardProps {
    name: string;
    age: number;
    onClick?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ name, age, onClick }) => (
    <div onClick={onClick}>
        {name} - {age}
    </div>
);

// ── useState typing ──
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);
```

---

## 6. React Design Philosophy

```
REACT — 5 DESIGN PRINCIPLES:
═══════════════════════════════════════════════════════════════

  ① DECLARATIVE UI
     → Mô tả state → React tự update DOM
     → Code dễ đọc, dễ debug, dễ predict

  ② COMPONENT-BASED
     → Composable: nhỏ → lớn
     → Reusable: dùng lại nhiều nơi
     → Maintainable: logic + UI encapsulated
     → Testable: test từng component độc lập

  ③ VIRTUAL DOM
     → JS object tree → diff → minimal DOM update
     → shouldComponentUpdate → skip unnecessary diff
     → Batch updates

  ④ FUNCTIONAL PROGRAMMING
     → Component = pure function (data → UI)
     → Reduce boilerplate
     → Easy to test

  ⑤ LEARN ONCE, WRITE ANYWHERE
     → Web (ReactDOM)
     → Mobile (React Native)
     → Server (SSR: renderToString)
     → Desktop (Electron)
```

---

## 7. props.children vs React.Children

### props.children

```javascript
// Hiển thị TẤT CẢ children
function ParentComponent(props) {
  return <div>{props.children}</div>;
}
// Dùng:
<ParentComponent>
  <Child1 />
  <Child2 />
</ParentComponent>;
```

### React.Children — Manipulate children

```javascript
// ── React.Children.map: clone + inject props ──
function RadioGroup(props) {
  return (
    <div>
      {React.Children.map(props.children, (child) => {
        if (child.type === RadioOption) {
          return React.cloneElement(child, {
            name: props.name, // inject name prop!
          });
        }
        return child;
      })}
    </div>
  );
}

// Dùng:
<RadioGroup name="color">
  <RadioOption label="Đỏ" value="red" />
  <RadioOption label="Xanh" value="blue" />
</RadioGroup>;
// → Mỗi RadioOption tự nhận name="color"
```

```
props.children vs React.Children:
  ┌──────────────┬─────────────────────────────────────┐
  │ props.children│ Render trực tiếp, không modify     │
  │ React.Children│ Map, forEach, count, clone, inject │
  │              │ props, filter by type               │
  │              │ Xử lý null/undefined safely         │
  └──────────────┴─────────────────────────────────────┘
```

---

## 8. State Lifting

> **State Lifting** = move shared state lên **closest common ancestor**.

```javascript
class Father extends React.Component {
  state = { inputValue: "" };

  handleChange = (value) => {
    this.setState({ inputValue: value });
  };

  render() {
    return (
      <div>
        <Child1 value={this.state.inputValue} onChange={this.handleChange} />
        <Child2 value={this.state.inputValue} />
      </div>
    );
  }
}

// Child1 THAY ĐỔI → gọi onChange → Father setState
// → Child2 NHẬN giá trị mới qua props
// = SINGLE SOURCE OF TRUTH
```

```
STATE LIFTING FLOW:
  Child1 onChange → Father setState → Child1 + Child2 re-render
  ┌────────────────────────────────────┐
  │ Father (state owner)               │
  │   state = { inputValue }           │
  │   ├── Child1 (controlled input)   │
  │   │    props: value, onChange      │
  │   └── Child2 (display)            │
  │        props: value               │
  └────────────────────────────────────┘
```

---

## 9. constructor vs getInitialState

```javascript
// ── ES5: getInitialState (DEPRECATED) ──
var App = React.createClass({
  getInitialState() {
    return { userName: "hi", userId: 0 };
  },
});

// ── ES6: constructor (HIỆN TẠI) ──
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { userName: "hi", userId: 0 };
  }
}

// ── ES6 class fields (RECOMMENDED) ──
class App extends React.Component {
  state = { userName: "hi", userId: 0 };
}

// ── Hooks (MODERN) ──
function App() {
  const [userName, setUserName] = useState("hi");
  const [userId, setUserId] = useState(0);
}
```

---

## 10. StrictMode

```javascript
import React from "react";

function App() {
  return (
    <div>
      <Header />
      <React.StrictMode>
        <ComponentOne />
        <ComponentTwo />
      </React.StrictMode>
      <Footer />
    </div>
  );
}
// StrictMode CHỈ affect ComponentOne, ComponentTwo + descendants
// Header, Footer KHÔNG bị check
```

```
STRICTMODE CHECKS:
  ✅ Identify unsafe lifecycles (UNSAFE_componentWillMount...)
  ✅ Warn deprecated string ref API
  ✅ Warn deprecated findDOMNode
  ✅ Detect unexpected side effects (double-invoke render)
  ✅ Detect legacy context API

  ⚠️ Chỉ chạy ở DEV mode, KHÔNG ảnh hưởng production
  ⚠️ React 18: double-invoke effects in dev (test cleanup)
```

---

## 11. Iteration in React

### Array

```javascript
// ✅ map → return JSX (RECOMMENDED)
{
  arr.map((item, index) => <li key={item.id}>{item.name}</li>);
}

// ❌ forEach → return undefined → KHÔNG render
{
  arr.forEach((item) => (
    <li key={item.id}>{item.name}</li> // Sẽ KHÔNG hiển thị!
  ));
}
```

### Object

```javascript
// ── Object.entries() → map ──
{
  Object.entries(obj).map(([key, value]) => (
    <li key={key}>
      {key}: {value}
    </li>
  ));
}

// ── Object.keys() → map ──
{
  Object.keys(obj).map((key) => (
    <li key={key}>
      {key}: {obj[key]}
    </li>
  ));
}

// ── for...in (IIFE pattern) ──
{
  (() => {
    const items = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        items.push(<li key={key}>{obj[key]}</li>);
      }
    }
    return items;
  })();
}
```

---

## 12. Data Preservation on Reload

```
4 CÁCH GIỮ DATA KHI RELOAD:
═══════════════════════════════════════════════════════════════

  ① REDUX + redux-persist
     → Auto sync Redux store ↔ localStorage
     → PersistGate chờ rehydrate

  ② sessionStorage
     → componentWillUnmount: save
     → componentDidMount: check + restore
     → Clear khi rời page

  ③ History API (pushState)
     → router push với state data
     → Quay lại → history.state còn data
     → react-router hỗ trợ sẵn
     → Phù hợp temporary data

  ④ data.js module (webpack)
     → Global module export data
     → Import ở bất kỳ component
     → Data persist trong JS memory
     → ⚠️ Mất khi refresh (chỉ cho SPA navigation)
```

---

## 13. Core Libraries

```
3 CORE LIBRARIES:
  ┌──────────────┬─────────────────────────────────────┐
  │ react.js     │ Core React: components, hooks,      │
  │              │ VDOM, reconciliation logic           │
  ├──────────────┼─────────────────────────────────────┤
  │ react-dom.js │ DOM-specific rendering methods      │
  │              │ render(), hydrate(), createPortal()  │
  │              │ (tách riêng vì React Native không   │
  │              │  cần DOM)                           │
  ├──────────────┼─────────────────────────────────────┤
  │ babel.js     │ JSX compiler: <div> → createElement │
  │              │ ES6+ transpiler (arrow, class...)   │
  └──────────────┴─────────────────────────────────────┘
```

---

## 14. JSX

### Bắt buộc không?

> **KHÔNG bắt buộc.** JSX = syntax sugar cho `React.createElement`.

```javascript
// ── Với JSX ──
class Hello extends React.Component {
  render() {
    return <div>Hello {this.props.toWhat}</div>;
  }
}
<Hello toWhat="World" />;

// ── Không JSX (React.createElement) ──
class Hello extends React.Component {
  render() {
    return React.createElement("div", null, `Hello ${this.props.toWhat}`);
  }
}
React.createElement(Hello, { toWhat: "World" }, null);
```

```
TẠI SAO DÙNG JSX?
  ① Readable: XML-like → dễ nhìn tree structure
  ② Familiar: gần HTML → frontend dev quen thuộc
  ③ Compiled: Babel → React.createElement (runtime vẫn JS)
  ④ Type-safe: TypeScript + JSX = TSX → type checking
  ⑤ Tooling: syntax highlighting, autocomplete, linting

  React team: "Không muốn tạo hệ sinh thái riêng,
  chỉ extend JavaScript một cách hợp lý"
```

---

## 15. Import React khi dùng JSX

```javascript
// TRƯỚC React 17:
import React from "react"; // BẮT BUỘC!
// Vì Babel compile JSX → React.createElement(...)
// → Cần React trong scope

// SAU React 17:
// KHÔNG CẦN import React nữa!
// Babel tự inject: import { jsx as _jsx } from 'react/jsx-runtime'
// → Tự động, dev không cần import
```

---

## 16. Async/Await trong React

```javascript
// ── Dùng trong useEffect ──
useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await fetch("/api/data");
      const data = await res.json();
      setData(data);
    } catch (err) {
      setError(err);
    }
  };
  fetchData();
}, []);
// ⚠️ useEffect callback KHÔNG thể async trực tiếp
// → Phải wrap trong inner async function

// ── Event handler ──
const handleClick = async () => {
  const result = await someAsyncOperation();
  setResult(result);
};

// ── Webpack: nếu lỗi regeneratorRuntime ──
// npm install @babel/plugin-transform-runtime
// .babelrc: { "plugins": ["@babel/plugin-transform-runtime"] }
```

---

## 17. React.Children.map vs Array.map

```
SO SÁNH:
  ┌────────────────────┬───────────────────────────────┐
  │ Array.prototype.map│ ❌ Crash nếu children = null  │
  │                    │ ❌ Crash nếu children = undef  │
  │                    │ ❌ Không handle single child   │
  ├────────────────────┼───────────────────────────────┤
  │ React.Children.map │ ✅ Handle null/undefined       │
  │                    │ ✅ Handle single child         │
  │                    │ ✅ Flatten nested arrays       │
  │                    │ ✅ Assign correct keys          │
  └────────────────────┴───────────────────────────────┘
  → Luôn dùng React.Children.map khi iterate props.children
```

---

## 18. SSR — Server-Side Rendering

### SSR vs CSR Flow

```
CSR (Client-Side Rendering):
  Browser → Server: request URL
  Server → Browser: empty HTML + JS bundle
  Browser: download JS → parse → fetch data → render
  ⚠️ User thấy WHITE SCREEN cho đến khi JS xong!

SSR (Server-Side Rendering):
  Browser → Node server: request URL
  Node server → Backend: fetch data
  Node server: render HTML + data → send to browser
  Browser: hiển thị HTML NGAY LẬP TỨC!
  Browser: download JS → hydrate (attach events)
  ✅ User thấy content NGAY
```

```
SSR FLOW:
  ┌─────────┐  1.URL    ┌──────────┐  2.Data   ┌─────────┐
  │ Browser │ ────────→ │ Node     │ ────────→ │ Backend │
  │         │ ←──────── │ Server   │ ←──────── │ Server  │
  └─────────┘  4.HTML   └──────────┘  3.Data   └─────────┘
      │
      │ 5. Hydrate (attach JS events)
      ↓
  ┌──────────────────────┐
  │ Interactive App ✅    │
  └──────────────────────┘
```

### Ưu / Nhược

```
SSR:
  ┌──────────┬─────────────────────────────────────────┐
  │ ✅ Pros  │ SEO friendly (full HTML for crawlers)   │
  │          │ Faster first paint (no JS wait)         │
  │          │ Better UX (no white screen)             │
  │          │ Social media preview (meta tags)        │
  ├──────────┼─────────────────────────────────────────┤
  │ ❌ Cons  │ Server pressure (CPU cho mỗi request)   │
  │          │ Limited lifecycle (chỉ đến didMount)    │
  │          │ Higher learning curve (Node + Koa/Next) │
  │          │ Complex deploy (server infrastructure)  │
  └──────────┴─────────────────────────────────────────┘
```

---

## 19. HOC & Decorator Pattern

### Higher-Order Component

```javascript
// HOC = function nhận Component → return Enhanced Component
function withWindowWidth(BaseComponent) {
  return class extends React.Component {
    state = { windowWidth: window.innerWidth };

    onResize = () => {
      this.setState({ windowWidth: window.innerWidth });
    };

    componentDidMount() {
      window.addEventListener("resize", this.onResize);
    }
    componentWillUnmount() {
      window.removeEventListener("resize", this.onResize);
    }

    render() {
      return <BaseComponent {...this.props} {...this.state} />;
    }
  };
}

const MyComponent = (props) => <div>Window width: {props.windowWidth}</div>;
export default withWindowWidth(MyComponent);
```

### Decorator Pattern

```javascript
// HOC dùng DECORATOR PATTERN:
// → Không thay đổi BaseComponent
// → Chỉ "bọc" thêm functionality bên ngoài
// → JavaScript decorator proposal (Stage 3):

@withWindowWidth
class MyComponent extends React.Component {
  render() {
    return <div>Width: {this.props.windowWidth}</div>;
  }
}
// Equivalent: withWindowWidth(MyComponent)
```

```
HOC vs HOOKS (modern):
  ┌──────────────────┬──────────────────┐
  │ HOC              │ Custom Hook      │
  ├──────────────────┼──────────────────┤
  │ Wrapper hell     │ ✅ No nesting    │
  │ Props collision  │ ✅ Clear scope   │
  │ Static methods   │ ✅ Just functions│
  │ ❌ Class-based   │ ✅ Function-based│
  └──────────────────┴──────────────────┘
  → Modern React: prefer custom hooks over HOC
```

---

## 20. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
REACT MISCELLANEOUS — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  NAMING:     PascalCase, dùng class/function name (không displayName)
  VERSIONS:   16.x: Fiber+Suspense+Hooks | 17: auto JSX transform
  DIALOG:     Portal/Context pattern (modern) hoặc singleton mount
  PERSIST:    redux-persist (auto), sessionStorage, history state
  REACT/VUE:  React: JSX+immutable+HOC | Vue: template+mutable+mixins
  TYPESCRIPT: CRA --template typescript hoặc install @types/*
  PHILOSOPHY: Declarative, component-based, VDOM, FP, cross-platform
  CHILDREN:   props.children (render) | React.Children (manipulate)
  LIFTING:    Shared state → closest common ancestor
  STRICTMODE: Dev-only checks (unsafe lifecycle, side effects)
  ITERATION:  map (✅ returns JSX) | forEach (❌ returns undefined)
  RELOAD:     redux-persist > sessionStorage > history API
  JSX:        Syntax sugar → React.createElement (not required)
  SSR:        SEO + fast first paint | cost: server CPU + complexity
  HOC:        Decorator pattern → modern: custom hooks preferred
```

### Câu Hỏi Phỏng Vấn

**1. React vs Vue khác gì?**

> **Data flow**: React one-way, Vue two-way (v-model). **Template**: React dùng JSX, Vue dùng HTML template. **Re-render**: React re-render toàn subtree (cần memo/PureComponent), Vue auto-track dependencies chỉ re-render component liên quan. **Data**: React immutable (reference compare), Vue mutable (getter/setter). **Extend**: React dùng HOC, Vue dùng mixins/composables.

**2. SSR là gì? Ưu nhược?**

> SSR = server render HTML với data → gửi cho browser. **Ưu**: SEO (crawler đọc full HTML), fast first paint (không chờ JS), social preview. **Nhược**: server CPU pressure, lifecycle hạn chế (chỉ đến componentDidMount), deploy phức tạp (Node server). Next.js = framework SSR phổ biến nhất cho React.

**3. props.children vs React.Children?**

> `props.children` = render trực tiếp. `React.Children.map` = iterate + modify children (inject props qua cloneElement, filter by type). `React.Children` handle null/undefined/single child an toàn, `Array.map` thì crash.

**4. State lifting là gì?**

> Move shared state lên **closest common ancestor**. Child component KHÔNG giữ state, nhận qua props + gọi callback để thay đổi. Father component là **single source of truth**. Ví dụ: 2 inputs cần sync → state ở parent.

**5. Tại sao React 17 không cần import React?**

> Trước 17: JSX → `React.createElement()` → cần React trong scope. Từ 17: Babel inject `import { jsx } from 'react/jsx-runtime'` tự động → dev không cần import React nữa.

**6. HOC dùng design pattern gì?**

> **Decorator pattern**: không thay đổi component gốc, chỉ "bọc" thêm functionality. HOC = higher-order function nhận Component → return Enhanced Component. Modern React: prefer **custom hooks** (no wrapper hell, clear scope, function-based).

---

## Checklist Học Tập

- [ ] Component naming: PascalCase, avoid displayName
- [ ] React 16.x: Time Slicing, Suspense, Hooks, Error Boundaries
- [ ] Global dialog: Portal + Context (modern) hoặc singleton
- [ ] redux-persist: setup + PersistGate
- [ ] React vs Vue: 7 điểm khác biệt chính
- [ ] TypeScript + React: CRA template, props interface, useState generic
- [ ] React philosophy: 5 principles (declarative, component, VDOM, FP, cross-platform)
- [ ] props.children vs React.Children.map (cloneElement, inject props)
- [ ] State lifting: shared state → common ancestor
- [ ] StrictMode: dev-only checks, double-invoke
- [ ] Iteration: map (returns JSX) vs forEach (returns undefined)
- [ ] Data on reload: redux-persist, sessionStorage, history API
- [ ] JSX = React.createElement sugar (not required)
- [ ] React 17: auto JSX transform (no import React)
- [ ] SSR: ưu nhược, flow diagram, CSR vs SSR
- [ ] HOC: decorator pattern → prefer custom hooks
- [ ] React.Children.map: handle null/undefined/single child

---

_Cập nhật lần cuối: Tháng 2, 2026_
