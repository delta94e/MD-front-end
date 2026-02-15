# Redux — Deep Dive

> 📅 2026-02-12 · ⏱ 25 phút đọc
>
> 11 chủ đề: Redux giải quyết gì, nguyên lý/workflow,
> async middleware (thunk vs saga), property passing,
> middleware internals, concurrency, so sánh Redux vs MobX vs Vuex,
> connect function.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: State Management

---

## Mục Lục

0. [Redux là gì? Giải quyết vấn đề gì?](#0-redux-là-gì)
1. [Nguyên lý & Workflow](#1-nguyên-lý--workflow)
2. [Async Middleware (thunk vs saga)](#2-async-middleware)
3. [Property Passing & Data Flow](#3-property-passing--data-flow)
4. [Middleware Internals](#4-middleware-internals)
5. [Concurrency (takeEvery vs takeLatest)](#5-concurrency)
6. [Redux vs window / MobX / Vuex](#6-so-sánh)
7. [connect Function](#7-connect-function)
8. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#8-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Redux là gì?

### Vấn đề

React = **view layer** framework, data flow **một chiều** (parent → child qua props). Khi project lớn:

- State thay đổi liên tục, khó kiểm soát
- Model thay đổi → model khác thay đổi → view thay đổi → model khác…
- Debug cực khó: **khi nào, tại sao, thế nào** state đổi → mất kiểm soát

### Giải pháp Redux

```
REDUX DATA FLOW:
═══════════════════════════════════════════════════════════════

  ┌──────────┐  dispatch(action)  ┌───────┐  (state,action)  ┌─────────┐
  │Component │ ─────────────────→ │ Store │ ────────────────→ │ Reducer │
  │  (View)  │                    │       │ ←──────────────── │         │
  └──────────┘ ←───────────────── └───────┘    new state      └─────────┘
    subscribe      getState()

  ① Component dispatch ACTION → Store
  ② Store gọi REDUCER (currentState, action)
  ③ Reducer return NEW STATE
  ④ Store notify components (subscribe)
  ⑤ Components re-render với state mới
```

### Vai trò của react-redux

> Redux = **state machine thuần** (không có UI).
> **react-redux** = bind Redux state machine với React UI.
> → dispatch action → state thay đổi → page **tự động update**.

---

## 1. Nguyên lý & Workflow

### Source Code Modules

| File                    | Chức năng                                         |
| ----------------------- | ------------------------------------------------- |
| `compose.js`            | Functional programming: right-to-left composition |
| `createStore.js`        | Tạo **unique store**                              |
| `combineReducers.js`    | Gộp nhiều reducers → đảm bảo store duy nhất       |
| `bindActionCreators.js` | Modify state không cần trực tiếp dùng dispatch    |
| `applyMiddleware.js`    | Enhance dispatch qua middleware                   |

### Handwritten createStore

```javascript
export default function createStore(reducer, initialState, middleFunc) {
  // Nếu initialState là function → nó là middleware
  if (initialState && typeof initialState === "function") {
    middleFunc = initialState;
    initialState = undefined;
  }

  let currentState = initialState;
  const listeners = [];

  // Middleware enhancement
  if (middleFunc && typeof middleFunc === "function") {
    return middleFunc(createStore)(reducer, initialState);
  }

  // ── getState: trả về state hiện tại ──
  const getState = () => currentState;

  // ── dispatch: gửi action → reducer → notify ──
  const dispatch = (action) => {
    currentState = reducer(currentState, action);
    listeners.forEach((listener) => listener());
  };

  // ── subscribe: đăng ký listener ──
  const subscribe = (listener) => {
    listeners.push(listener);
  };

  return { getState, dispatch, subscribe };
}
```

### Reducer Example

```javascript
const actionTypes = {
  ADD: "ADD",
  CHANGEINFO: "CHANGEINFO",
};

const initState = { info: "初始化" };

export default function initReducer(state = initState, action) {
  switch (action.type) {
    case actionTypes.CHANGEINFO:
      return {
        ...state,
        info: action.payload.info || "",
      };
    default:
      return { ...state };
  }
}
```

### Workflow tóm gọn

```
  ① User (View) → dispatch(action)
  ② Store tự gọi Reducer(currentState, action)
  ③ Reducer return NEW state (immutable!)
  ④ Store update → subscribe listeners chạy
  ⑤ View re-render
```

---

## 2. Async Middleware

> Request có thể gọi trực tiếp trong `componentDidMount`, nhưng project lớn → khó quản lý async flow.
> → Dùng **Redux async middleware**: `redux-thunk` hoặc `redux-saga`.

### (1) redux-thunk

#### Setup

```javascript
import { createStore, applyMiddleware, compose } from "redux";
import reducer from "./reducer";
import thunk from "redux-thunk";

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
  : compose;

const enhancer = composeEnhancers(applyMiddleware(thunk));
const store = createStore(reducer, enhancer);
```

#### ActionCreator trả về FUNCTION

```javascript
// dispatch tự động inject vào function
export const getHttpAction = (url, func) => (dispatch) => {
    axios.get(url).then(function(res) {
        const action = func(res.data);
        dispatch(action);
    });
}

// Component gọi:
componentDidMount() {
    var action = getHttpAction('/getData', getInitTodoItemAction);
    store.dispatch(action);  // action là function → thunk xử lý
}
```

#### Ưu / Nhược

|             | Ưu điểm          | Nhược điểm                    |
| ----------- | ---------------- | ----------------------------- |
| Size        | ~20 dòng code    |                               |
| Learning    | Đơn giản, dễ học |                               |
| Boilerplate |                  | Nhiều code lặp                |
| Coupling    |                  | Async logic + action coupling |
| Features    |                  | Cần tự wrap thêm utilities    |

### (2) redux-saga

#### Setup

```javascript
import createSagaMiddleware from "redux-saga";
import TodoListSaga from "./sagas";

const sagaMiddleware = createSagaMiddleware();
const enhancer = composeEnhancers(applyMiddleware(sagaMiddleware));
const store = createStore(reducer, enhancer);
sagaMiddleware.run(TodoListSaga);
```

#### Saga file (sagas.js)

```javascript
import { takeEvery, put } from "redux-saga/effects";
import { initTodoList } from "./actionCreator";
import { GET_INIT_ITEM } from "./actionTypes";
import axios from "axios";

function* func() {
  try {
    const res = yield axios.get("/getData");
    const action = initTodoList(res.data);
    yield put(action); // dispatch action → reducer
  } catch (e) {
    console.log("Network request failed");
  }
}

function* mySaga() {
  yield takeEvery(GET_INIT_ITEM, func);
  // Tự bắt action type GET_INIT_ITEM → chạy func
}

export default mySaga;
```

#### Ưu / Nhược

|                | Ưu điểm                        | Nhược điểm                 |
| -------------- | ------------------------------ | -------------------------- |
| Decoupling     | Async riêng file saga.js       |                            |
| Action         | Vẫn là plain object (FSA)      |                            |
| Error handling | try/catch trực tiếp            |                            |
| Features       | Nhiều helper (takeEvery, put…) | Over-featured              |
| Flexibility    | Combine serial/parallel        |                            |
| Testing        | Dễ mock + test                 |                            |
| Learning       |                                | Khó: generator + ~50 APIs  |
| Size           |                                | ~25KB, ~2000 dòng          |
| TypeScript     |                                | yield không return TS type |

### So sánh thunk vs saga

```
THUNK vs SAGA:
═══════════════════════════════════════════════════════════════
  ┌───────────────┬────────────────┬────────────────────────┐
  │               │ redux-thunk    │ redux-saga             │
  ├───────────────┼────────────────┼────────────────────────┤
  │ Size          │ ~20 lines      │ ~2000 lines (~25KB)    │
  │ Learning      │ Dễ             │ Khó (generator + APIs) │
  │ Action        │ Function       │ Plain object (FSA)     │
  │ Async location│ ActionCreator  │ Separate saga.js       │
  │ Error handling│ .catch()       │ try/catch (generator)  │
  │ Concurrency   │ Manual         │ takeEvery/takeLatest   │
  │ Testing       │ Khó mock       │ Dễ test                │
  │ Use case      │ Small projects │ Large/complex projects │
  └───────────────┴────────────────┴────────────────────────┘
```

---

## 3. Property Passing & Data Flow

### Complete Flow

```
VIEW → ACTION → REDUCER → STORE → VIEW
═══════════════════════════════════════════════════════════════

  ┌──────────┐  mapDispatchToProps  ┌────────┐  dispatch  ┌─────────┐
  │ Component│ ───────────────────→ │ Action │ ─────────→ │ Store   │
  │ (View)   │                     │ {type} │            │         │
  └──────────┘ ←─────────────────── └────────┘            │         │
    mapStateToProps                                        │         │
                                                          │         │
                                    ┌────────┐            │         │
                                    │Reducer │ ←───────── │         │
                                    │(state, │ ─────────→ │         │
                                    │action) │ new state  └─────────┘
                                    └────────┘
```

### Code Example

```javascript
import React from "react";
import { createStore } from "redux";
import { Provider, connect } from "react-redux";

// ── Component ──
class App extends React.Component {
  render() {
    let { text, click, clickR } = this.props;
    return (
      <div>
        <div>Số người: {text}</div>
        <div onClick={click}>Thêm</div>
        <div onClick={clickR}>Bớt</div>
      </div>
    );
  }
}

// ── Reducer ──
const initialState = { text: 5 };
const reducer = function (state, action) {
  switch (action.type) {
    case "ADD":
      return { text: state.text + 1 };
    case "REMOVE":
      return { text: state.text - 1 };
    default:
      return initialState;
  }
};

// ── Actions ──
let ADD = { type: "ADD" };
let Remove = { type: "REMOVE" };

// ── Store ──
const store = createStore(reducer);

// ── Connect: Map state & dispatch → props ──
let mapStateToProps = (state) => ({ text: state.text });
let mapDispatchToProps = (dispatch) => ({
  click: () => dispatch(ADD),
  clickR: () => dispatch(Remove),
});

const App1 = connect(mapStateToProps, mapDispatchToProps)(App);

// ── Provider: cung cấp store cho toàn app ──
ReactDOM.render(
  <Provider store={store}>
    <App1 />
  </Provider>,
  document.getElementById("root"),
);
```

---

## 4. Middleware Internals

### Middleware là gì?

> Extension point **giữa action dispatch và reducer**.
> Flow: `view → action → **middleware** → reducer → store`
> Dùng cho: async requests, logging, error handling…

### applyMiddleware Source

```javascript
export default function applyMiddleware(...middlewares) {
  return (createStore) =>
    (...args) => {
      // ① Tạo store bình thường
      const store = createStore(...args);
      let dispatch = () => {
        throw new Error();
      };

      // ② Truyền getState + dispatch cho mỗi middleware
      const middlewareAPI = {
        getState: store.getState,
        dispatch: (...args) => dispatch(...args),
      };

      // ③ Mỗi middleware nhận middlewareAPI → return function
      const chain = middlewares.map((middleware) => middleware(middlewareAPI));

      // ④ compose chain → tạo enhanced dispatch
      dispatch = compose(...chain)(store.dispatch);

      return { ...store, dispatch };
    };
}
```

### Middleware Signature

```javascript
// Currying: 3 layers
const myMiddleware =
  ({ getState, dispatch }) =>
  (next) =>
  (action) => {
    console.log("Before:", getState());
    next(action); // Gọi middleware tiếp theo (hoặc reducer)
    console.log("After:", getState());
  };

// Layer 1: nhận { getState, dispatch } từ Store
// Layer 2: nhận next (dispatch của middleware tiếp theo)
// Layer 3: nhận action → quyết định xử lý
```

```
MIDDLEWARE CHAIN:
  dispatch(action)
  → middleware1(action) → middleware2(action) → ... → reducer
                         ↑ next                ↑ next
```

---

## 5. Concurrency

### takeEvery — Parallel

```javascript
import { fork, take } from "redux-saga/effects";

const takeEvery = (pattern, saga, ...args) =>
  fork(function* () {
    while (true) {
      const action = yield take(pattern);
      yield fork(saga, ...args.concat(action)); // Fork mới, KHÔNG cancel cũ
    }
  });

// Mỗi action → fork saga MỚI → chạy SONG SONG
// Use case: independent operations, logging
```

### takeLatest — Cancel Previous

```javascript
import { cancel, fork, take } from "redux-saga/effects";

const takeLatest = (pattern, saga, ...args) =>
  fork(function* () {
    let lastTask;
    while (true) {
      const action = yield take(pattern);
      if (lastTask) {
        yield cancel(lastTask); // CANCEL task trước!
      }
      lastTask = yield fork(saga, ...args.concat(action));
    }
  });

// Action mới → CANCEL task cũ → chỉ giữ LATEST
// Use case: AJAX search → chỉ lấy response CUỐI CÙNG
```

```
takeEvery vs takeLatest:
  takeEvery:  action1 → saga1 ✅
              action2 → saga2 ✅   (cả 2 chạy song song)

  takeLatest: action1 → saga1 ❌ (cancelled!)
              action2 → saga2 ✅   (chỉ latest)
```

---

## 6. So sánh

### Redux vs window variable

|                | Redux                                      | window.xxx              |
| -------------- | ------------------------------------------ | ----------------------- |
| State tracking | **Time travel** — theo dõi mọi thay đổi    | Không track được        |
| Predictability | Thay đổi **controlled** (action + reducer) | Thay đổi bất kỳ lúc nào |
| Debugging      | DevTools — khi nào/tại sao/thế nào         | Log thủ công            |
| Complexity     | Xử lý tốt app phức tạp                     | Loạn khi app lớn        |

### Redux vs MobX

```
REDUX vs MOBX:
═══════════════════════════════════════════════════════════════
  ┌──────────────┬────────────────────┬──────────────────────┐
  │              │ Redux              │ MobX                 │
  ├──────────────┼────────────────────┼──────────────────────┤
  │ Store        │ Single store       │ Multiple stores      │
  │ Data         │ Plain objects      │ Observables          │
  │ State        │ IMMUTABLE          │ MUTABLE              │
  │              │ (return new state) │ (modify directly)    │
  │ Paradigm     │ Functional prog.   │ OOP                  │
  │ Complexity   │ Phức tạp hơn       │ Đơn giản hơn         │
  │ Debugging    │ DevTools, time     │ Khó hơn (many        │
  │              │ travel ✅          │ abstractions)        │
  │ Boilerplate  │ Nhiều              │ Ít                   │
  │ Learning     │ FP concepts        │ Dễ tiếp cận          │
  └──────────────┴────────────────────┴──────────────────────┘
```

### Redux vs Vuex

|           | Redux                      | Vuex                                     |
| --------- | -------------------------- | ---------------------------------------- |
| Mutation  | Reducer (switch/case)      | **mutation** function (trực tiếp modify) |
| Re-render | Cần subscribe              | Vue **tự động** re-render                |
| Flow      | dispatch → reducer → store | commit → mutation → store                |
| Action    | Required                   | Optional (chỉ cho async)                 |

**Điểm chung:** Single data source, changes predictable, MVVM pattern.

> Vuex **đơn giản hóa**: bỏ dispatch (dùng commit), bỏ action concept,
> bỏ reducer (mutation trực tiếp transform data).

---

## 7. connect Function

### 3 chức năng của connect

```javascript
const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App);
```

#### ① Lấy state (getState)

```
connect dùng CONTEXT lấy store từ Provider
→ store.getState() lấy toàn bộ state tree
```

#### ② Wrap component (wrapWithConnect)

```
Tạo ReactComponent "Connect":
→ Merge: mapStateToProps + mapDispatchToProps + ownProps
→ Pass merged props → WrappedComponent
→ Re-render WrappedComponent khi state thay đổi
```

#### ③ Monitor store changes

```
Connect CACHE state từ store tree
→ So sánh current state vs previous state
→ Đã thay đổi? → this.setState() → re-render Connect + children
→ Không đổi? → skip render (performance optimization)
```

```
CONNECT FLOW:
═══════════════════════════════════════════════════════════════

  <Provider store={store}>        ← Inject store via Context
      ↓
  connect(                        ← HOC pattern
    mapStateToProps,              ← state → props
    mapDispatchToProps            ← dispatch → props
  )(App)
      ↓
  <Connect>                       ← Wrapper component
    <App                          ← Original component
      text={state.text}           ← từ mapStateToProps
      click={dispatch(ADD)}       ← từ mapDispatchToProps
    />
  </Connect>
```

---

## 8. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
REDUX — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  CORE:
    Store      → Nơi LƯU TRỮ state duy nhất
    Action     → Plain object { type, payload }
    Reducer    → Pure function (state, action) → NEW state
    dispatch   → Gửi action → Store → Reducer
    subscribe  → Đăng ký listener → re-render

  MIDDLEWARE:
    Signature  → ({getState,dispatch}) => next => action
    thunk      → action = FUNCTION → dispatch bên trong
    saga       → Separate generator file, takeEvery/takeLatest

  REACT-REDUX:
    Provider   → Inject store via Context
    connect    → HOC: mapState + mapDispatch → props
    mapStateToProps    → state → component props
    mapDispatchToProps → dispatch → component event handlers

  PRINCIPLES:
    ① Single source of truth (1 store)
    ② State is READ-ONLY (chỉ đổi qua action)
    ③ Changes via PURE FUNCTIONS (reducers)
```

### Câu Hỏi Phỏng Vấn

**1. Redux giải quyết vấn đề gì?**

> React data flow **một chiều** → component xa nhau khó truyền data. Redux cung cấp **single store** → mọi component dispatch/subscribe trực tiếp → centralized state management. react-redux **bind** state machine với UI tự động re-render.

**2. Redux data flow?**

> `View → dispatch(action) → Store → Reducer(state, action) → new state → Store update → subscribe → View re-render`. Reducer phải là **pure function**, return **new state** (immutable).

**3. Middleware ở đâu trong flow?**

> Giữa **action dispatch** và **reducer**. Signature: `({getState, dispatch}) => next => action`. Dùng cho: async requests, logging, error handling. `compose` chain nhiều middleware thành enhanced dispatch.

**4. redux-thunk vs redux-saga?**

> **thunk**: ~20 lines, action = function, async trong actionCreator, dễ học. **saga**: separate file, generator-based, takeEvery/takeLatest, try/catch, dễ test. Thunk cho **small project**, saga cho **large/complex project**.

**5. takeEvery vs takeLatest?**

> **takeEvery**: fork task mới cho **MỖI action** → chạy song song. **takeLatest**: **cancel** task cũ, chỉ giữ latest → tốt cho AJAX search (chỉ lấy response cuối).

**6. Redux vs Vuex?**

> Redux: dispatch → reducer (switch/case) → new state, cần subscribe. Vuex: commit → mutation (trực tiếp modify), Vue **tự re-render**. Vuex đơn giản hơn: bỏ dispatch/action/reducer concepts.

**7. connect function làm gì?**

> ① Lấy store từ Provider (Context). ② Wrap component: merge `mapStateToProps` + `mapDispatchToProps` → props. ③ Monitor: cache state, so sánh thay đổi → setState → re-render.

---

## Checklist Học Tập

- [ ] Redux giải quyết vấn đề gì (centralized state)
- [ ] Core concepts: Store, Action, Reducer, dispatch, subscribe
- [ ] Handwritten createStore (getState, dispatch, subscribe)
- [ ] Redux workflow (View→Action→Reducer→Store→View)
- [ ] Middleware concept + signature (3 layers currying)
- [ ] applyMiddleware source code internals
- [ ] redux-thunk: setup + actionCreator function
- [ ] redux-saga: setup + sagas.js + takeEvery/put
- [ ] thunk vs saga comparison
- [ ] takeEvery vs takeLatest (concurrency)
- [ ] connect: mapStateToProps + mapDispatchToProps
- [ ] Provider + Context pattern
- [ ] Redux vs MobX (immutable vs mutable, FP vs OOP)
- [ ] Redux vs Vuex (reducer vs mutation, subscribe vs auto)
- [ ] 3 principles: single source, read-only, pure functions

---

_Cập nhật lần cuối: Tháng 2, 2026_
