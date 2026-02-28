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

---

---

# PHẦN 2 — Redux Gốc: Triết Lý, Cấu Trúc & So Sánh Với Flux

> Phần bổ sung đi sâu vào nền tảng triết lý gốc của Redux:
> Tại sao MVC thất bại, Redux giải quyết bằng cách nào,
> cấu trúc chi tiết từng thành phần, 3 nguyên tắc,
> react-redux internals, và so sánh Redux vs Flux.

---

## §1. Chức Năng — Redux Làm Gì?

```
═══════════════════════════════════════════════════════════════
  REDUX = LỚP QUẢN LÝ STATE + RÀNG BUỘC MẠNH MỘT CHIỀU!
═══════════════════════════════════════════════════════════════


  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  → Redux là LỚP QUẢN LÝ STATE (state management)     │
  │  → Áp đặt RÀNG BUỘC MẠNH lên luồng dữ liệu         │
  │    một chiều (unidirectional data flow)                │
  │                                                        │
  │  KHÁC VỚI FLUX:                                       │
  │  → Flux là PATTERN (mẫu kiến trúc)                   │
  │  → Redux là MỘT IMPLEMENTATION CỤ THỂ                │
  │    (cài đặt cụ thể của pattern đó)                    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Điểm Xuất Phát — Tại Sao Cần Redux?

```
═══════════════════════════════════════════════════════════════
  VẤN ĐỀ CỦA MVC = LUỒNG DỮ LIỆU HAI CHIỀU!
═══════════════════════════════════════════════════════════════


  VẤN ĐỀ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Trong MVC, ranh giới giữa Model, View, Controller   │
  │  RÕ RÀNG, NHƯNG luồng dữ liệu là HAI CHIỀU!        │
  │  Đặc biệt rõ ràng trong ứng dụng LỚN!               │
  │                                                        │
  │  Model ◀═══════▶ View                                 │
  │    ↕                ↕                                  │
  │  Model ◀═══════▶ View                                 │
  │                                                        │
  │  → Nếu 1 model cập nhật model khác,                  │
  │    rồi model đó cập nhật view,                        │
  │    view lại cập nhật model khác...                    │
  │                                                        │
  │  → KHÔNG THỂ BIẾT chính xác điều gì đang             │
  │    xảy ra trong ứng dụng!                             │
  │  → KHÔNG BIẾT khi nào, tại sao, bằng cách nào       │
  │    state thay đổi!                                     │
  │  → Hệ thống THIẾU MINH BẠCH!                         │
  │  → Khó tái hiện bugs + thêm tính năng mới!            │
  │                                                        │
  │  VÍ DỤ:                                                │
  │  → Two-way data binding → bảo trì + debug KHÓ!       │
  │  → Một thay đổi (user input hoặc API call)            │
  │    → ảnh hưởng NHIỀU states của ứng dụng!             │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  MỤC TIÊU CỦA REDUX:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  → GIẢM ĐỘ PHỨC TẠP                                  │
  │  → TĂNG KHẢ NĂNG BẢO TRÌ                             │
  │  → TĂNG TÍNH DỰ ĐOÁN của code                        │
  │                                                        │
  │  BẰNG CÁCH: ÉP BUỘC luồng dữ liệu MỘT CHIỀU!       │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Khái Niệm Cốt Lõi — Core Concepts

```
═══════════════════════════════════════════════════════════════
  CORE = STATE TREE BẤT BIẾN + ACTION + REDUCER!
═══════════════════════════════════════════════════════════════


  REDUX DUY TRÌ STATE NHƯ THẾ NÀO?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  → Toàn bộ state = MỘT state tree BẤT BIẾN!          │
  │  → KHÔNG THỂ thay đổi trực tiếp!                     │
  │                                                        │
  │  3 QUY TẮC:                                            │
  │  ┌──────────────────────────────────────────┐          │
  │  │  ① State object KHÔNG có setter!         │          │
  │  │  ② Dispatch ACTION để yêu cầu thay đổi! │          │
  │  │  ③ REDUCER liên kết action → state mới!  │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  Reducers tổ chức theo CÂY:                           │
  │  ┌──────────────────────────────────────────┐          │
  │  │  Root Reducer                             │          │
  │  │    ├── User Reducer                       │          │
  │  │    ├── Message Reducer                    │          │
  │  │    └── Settings Reducer                   │          │
  │  │                                          │          │
  │  │  → Tầng trên tổ chức tầng dưới!         │          │
  │  │  → Tính toán TỪNG LỚP để ra state!      │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  CHÌA KHÓA = REDUCER LÀ HÀM THUẦN TÚY:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① NHỎ (Single Responsibility)                        │
  │  ② THUẦN TÚY (No Side Effects)                       │
  │  ③ ĐỘC LẬP (Fixed Input → Fixed Output)             │
  │     → DỄ TEST! Chỉ kiểm tra input → output!          │
  │                                                        │
  │  → HÀM THUẦN TÚY cho phép TÍNH NĂNG DEBUG MẠNH:     │
  │  ┌──────────────────────────────────────────┐          │
  │  │  Nếu không thuần túy → state rollback    │          │
  │  │  GẦN NHƯ KHÔNG THỂ!                     │          │
  │  │                                          │          │
  │  │  Nhờ thuần túy → DevTools có thể:        │          │
  │  │  ① Hiển thị state, lịch sử action       │          │
  │  │  ② Bỏ qua action → lắp ráp kịch bản    │          │
  │  │    bug KHÔNG CẦN chuẩn bị thủ công!     │          │
  │  │  ③ Reset state, Commit, Revert!          │          │
  │  │  ④ Hot reloading: sửa reducer →          │          │
  │  │    có hiệu lực NGAY LẬP TỨC!            │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §4. Cấu Trúc — Kiến Trúc Redux (Góc Nhìn Triết Lý)

```
═══════════════════════════════════════════════════════════════
  CẤU TRÚC = ACTION → STORE → REDUCERS → VIEW!
═══════════════════════════════════════════════════════════════


  LUỒNG DỮ LIỆU MỘT CHIỀU NGHIÊM NGẶT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │               gọi              state mới               │
  │  action → store ────→ reducers ──────────→ view       │
  │                                                        │
  │  → Action mang data đến reducer tầng cao nhất         │
  │  → Rồi chảy xuống cây con tương ứng!                 │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### §4.1. Action — Mô Tả Điều Gì Đã Xảy Ra

```
  ACTION = SỰ KIỆN VỚI TYPE VÀ DATA (PAYLOAD)!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  GIỐNG FLUX: sự kiện mang type + data (payload)       │
  │  → Dispatch thủ công: store.dispatch(action)          │
  │                                                        │
  │  ACTION CREATORS:                                      │
  │  ┌──────────────────────────────────────────┐          │
  │  │  action = event description              │          │
  │  │  action creator = createEvent()          │          │
  │  │                                          │          │
  │  │  Tại sao cần?                             │          │
  │  │  → Tăng TÍNH DI ĐỘNG (portability)!     │          │
  │  │  → Tăng KHẢ NĂNG TEST (testability)!    │          │
  │  │                                          │          │
  │  │  Server-Side Rendering:                   │          │
  │  │  → Tách action creator và store          │          │
  │  │  → Mỗi request có binding ĐỘC LẬP!     │          │
  │  │  → Binding xử lý BÊN NGOÀI store!       │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  bindActionCreators:                                   │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Tạo action và dispatch nên TÁCH RIÊNG │          │
  │  │  → bindActionCreators GỘP LẠI khi cần   │          │
  │  │  → VD: truyền xuống con, ẨN dispatch đi!│          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  XỬ LÝ BẤT ĐỒNG BỘ (ASYNC):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Mỗi async CẦN 3 actions (hoặc 3 giai đoạn):      │
  │     (a) BẮT ĐẦU  → hiện loading                      │
  │     (b) THÀNH CÔNG → ẩn loading, hiện data            │
  │     (c) THẤT BẠI  → ẩn loading, hiện lỗi             │
  │                                                        │
  │  ② Dispatch action SAU KHI async hoàn thành!          │
  │     → KHÔNG CẦN lo thứ tự nhiều async!               │
  │     → Lịch sử action là CỐ ĐỊNH!                     │
  │                                                        │
  │  ③ Middleware (redux-thunk, redux-promise,...):        │
  │     → Chỉ làm async ĐẸP HƠN VỀ HÌNH THỨC!          │
  │     → Về kỹ thuật dispatch: KHÔNG KHÁC BIỆT!         │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### §4.2. Reducer — Cập Nhật State Cụ Thể

```
  REDUCER = BIẾN MÔ TẢ THÀNH SỰ THẬT!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  → Dựa trên action → cập nhật state!                  │
  │                                                        │
  │  GIỐNG arr.reduce():                                   │
  │  ┌──────────────────────────────────────────┐          │
  │  │  reducer ≈ callback                       │          │
  │  │  Input:  state hiện tại + action          │          │
  │  │  Output: state MỚI!                       │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  GIỐNG MIDDLEWARE / GULP PLUGINS:                      │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Mỗi reducer lo MỘT PHẦN NHỎ          │          │
  │  │  → Xâu chuỗi: output trước = input sau  │          │
  │  │  → Kết quả cuối = state hoàn chỉnh!     │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  TẠO STATE MỚI, KHÔNG MODIFY:                         │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Mỗi lần sửa → TẠO object mới!        │          │
  │  │  → Giá trị cũ → giữ reference gốc!      │          │
  │  │  → Giá trị mới → tạo mới!               │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  SO VỚI FLUX — DÙNG PURE FUNCTIONS THAY EVENT EMITTER:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① PHÂN TÁCH VÀ TỔ HỢP:                              │
  │  → Phân tách state bằng cách chia nhỏ reducers!       │
  │  → Tổ hợp lại bằng combineReducers()!                │
  │  → Reducer Composition = KỸ THUẬT CƠ BẢN NHẤT!       │
  │  → 1 reducer → tách thành nhóm reducers tương tự     │
  │    (hoặc reducer factory)!                             │
  │                                                        │
  │  ② ĐƠN TRÁCH NHIỆM:                                  │
  │  → Mỗi reducer CHỈ lo một phần global state!          │
  │                                                        │
  │  ③ RÀNG BUỘC PURE FUNCTION:                           │
  │  → KHÔNG modify tham số!                               │
  │  → Tính toán ĐƠN GIẢN, không side effects!           │
  │  → TRÁNH: Math.random(), new Date(),...               │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  KỸ THUẬT THIẾT KẾ STATE:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Vì kết quả reducers GẮN CHẶT với state,             │
  │  cần THIẾT KẾ cấu trúc state TRƯỚC!                  │
  │                                                        │
  │  ① CHIA STATE = Data State + UI State:                │
  │  → UI state: giữ trong component hoặc state tree     │
  │  → PHẢI PHÂN BIỆT rõ data vs UI state!               │
  │  → Kịch bản đơn giản: giữ UI state ở component!      │
  │                                                        │
  │  ② COI STATE NHƯ DATABASE:                            │
  │  → App phức tạp: coi state như DB!                     │
  │  → Tạo INDEX khi lưu dữ liệu!                        │
  │  → Dữ liệu liên quan → tham chiếu bằng ID!          │
  │  → GIẢM nested state (tránh cây con phình to)!       │
  │  → Bảng dữ liệu + Bảng quan hệ → giải quyết!       │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### §4.3. Store — Keo Kết Nối

```
  STORE = KEO TỔ CHỨC ACTION + REDUCER + LISTENER!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Toàn cục CHỈ CÓ 1 store (khác Flux: nhiều stores!)  │
  │  → Là CÂY STATE BẤT BIẾN (immutable state tree)!     │
  │                                                        │
  │  3 TRÁCH NHIỆM:                                       │
  │  ┌──────────────────────────────────────────┐          │
  │  │  ① getState() ĐỌC, dispatch(action) GHI │          │
  │  │  ② Nhận action → gọi reducers → state   │          │
  │  │    mới → thông báo view (setState())!    │          │
  │  │  ③ Đăng ký / hủy listener               │          │
  │  │    (kích hoạt mỗi khi state thay đổi!)  │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  QUÁ TRÌNH ĐIỀU PHỐI:                                 │
  │  ┌──────────────────────────────────────────┐          │
  │  │  Store nhận action                        │          │
  │  │    → truyền action + state hiện tại      │          │
  │  │      cho reducer tree                     │          │
  │  │    → nhận lại state MỚI                   │          │
  │  │    → cập nhật state hiện tại             │          │
  │  │    → thông báo view!                      │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. Ba Nguyên Tắc Cơ Bản — Three Principles (Chi Tiết)

```
═══════════════════════════════════════════════════════════════
  3 NGUYÊN TẮC = NỀN TẢNG CỦA REDUX!
═══════════════════════════════════════════════════════════════


  ① SINGLE SOURCE OF TRUTH:
  ┌────────────────────────────────────────────────────────┐
  │  Toàn bộ ứng dụng = MỘT state tree DUY NHẤT!         │
  │  → Dễ tạo BẢN SAO state (lưu version lịch sử)!      │
  │  → Dễ implement REDO / UNDO!                          │
  └────────────────────────────────────────────────────────┘


  ② STATE IS READ-ONLY:
  ┌────────────────────────────────────────────────────────┐
  │  CHỈ cập nhật state bằng ACTION!                      │
  │  → Thay đổi TẬP TRUNG, THỨ TỰ NGHIÊM NGẶT!         │
  │  → Không race conditions!                             │
  │  → Actions = pure objects → LOG, SERIALIZE,           │
  │    LƯU TRỮ, PHÁT LẠI để debug/test!                  │
  └────────────────────────────────────────────────────────┘


  ③ CHANGES WITH PURE FUNCTIONS:
  ┌────────────────────────────────────────────────────────┐
  │  Reducers = HÀM THUẦN TÚY!                            │
  │  → Input: state + action → Output: state MỚI!         │
  │  → LUÔN trả giá trị mới, KHÔNG modify input!          │
  │  → Điều chỉnh thứ tự reducer TÙY Ý!                  │
  │  → Debug như XEM PHIM: tua lại, tua tới!              │
  └────────────────────────────────────────────────────────┘
```

---

## §6. React-Redux — Kết Nối Với React (Góc Nhìn Nền Tảng)

```
═══════════════════════════════════════════════════════════════
  REACT-REDUX = CẦU NỐI GIỮA REDUX VÀ REACT!
═══════════════════════════════════════════════════════════════


  REDUX KHÔNG LIÊN QUAN ĐẾN REACT!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  → Redux có thể dùng với BẤT KỲ UI nào:              │
  │    Backbone, Angular, React,...                        │
  │  → react-redux xử lý phần:                            │
  │    new state → ĐỒNG BỘ → view                        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### §6.1. Container vs View

```
  CONTAINER VÀ VIEW (GIỐNG FLUX):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CONTAINER:                                            │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Component ĐẶC BIỆT, gắn chặt store! │          │
  │  │  → KHÔNG chứa view logic!                │          │
  │  │  → store.subscribe() đọc state tree      │          │
  │  │  → Truyền xuống views bằng props!        │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  VIEW:                                                 │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Component bình thường                  │          │
  │  │  → Nhận data + callbacks qua props       │          │
  │  │  → Chỉ lo UI + rendering!                │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### §6.2. connect() API

```
  connect() = API QUAN TRỌNG NHẤT CỦA REACT-REDUX!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Làm 3 việc chính:                                     │
  │                                                        │
  │  ① INJECT dispatch + state vào component              │
  │     → Truyền xuống dưới dạng props!                   │
  │                                                        │
  │  ② TỰ ĐỘNG chèn container vào virtual DOM tree       │
  │                                                        │
  │  ③ TỐI ƯU HIỆU NĂNG: tránh re-render không cần     │
  │     → Built-in shouldComponentUpdate!                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### §6.3. Provider — Cơ Chế Bên Trong

```
  PROVIDER = CÁCH STORE "XUYÊN THẤU" TOÀN BỘ CÂY!
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Sử dụng:                                              │
  │  ┌──────────────────────────────────────────┐          │
  │  │  render(                                  │          │
  │  │    <Provider store={store}>               │          │
  │  │      <App />                              │          │
  │  │    </Provider>,                           │          │
  │  │    document.getElementById('root')        │          │
  │  │  )                                        │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │                                                        │
  │  BÊN TRONG HOẠT ĐỘNG THẾ NÀO?                        │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → React cung cấp CONTEXT API            │          │
  │  │  → Giống props nhưng XUYÊN THẤU          │          │
  │  │    toàn bộ cây component!                 │          │
  │  │  → KHÔNG CẦN truyền thủ công từng tầng!  │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
// ================================================
// PROVIDER — CƠ CHẾ THỰC TẾ
// ================================================

// Provider đặt store vào context
class Provider extends React.Component {
  // Lấy store từ props, đặt làm thuộc tính context
  getChildContext() {
    return { store: this.props.store };
  }
  render() {
    return this.props.children;
  }
}

// Container lấy store từ context
class Container extends React.Component {
  // Lấy store từ context → dùng như props
  // container truy cập qua this.props.store
  getDefaultProps() {
    return {
      store: this.context.store,
    };
  }
}

// → Store "xuyên thấu" từ top xuống MỌI component!
// → Về kỹ thuật, view thường CŨNG CÓ THỂ truy cập
//   this.context.store (vì context lan truyền
//   xuống KHÔNG KIỂM SOÁT)
// → NHƯNG làm vậy là VI PHẠM QUY ƯỚC!
// → Chỉ container mới nên truy cập store!
```

> **Insight:** `hostContainerInfo` trong ReactDOM chỉ chứa thông tin DOM node
> (nodeType, namespaceURI,...), KHÔNG phải cơ chế truyền store.
> React cung cấp `context` — phiên bản nâng cao của `hostContainerInfo` —
> cho các kịch bản cần truyền data sâu mà không cần props thủ công từng tầng.
> `__reactInternalInstance` là private property (key ngẫu nhiên),
> nên component KHÔNG THỂ truy cập `hostContainerInfo` trực tiếp!

---

## §7. Redux vs Flux — So Sánh Chi Tiết

```
═══════════════════════════════════════════════════════════════
  REDUX VS FLUX = GIỐNG VÀ KHÁC!
═══════════════════════════════════════════════════════════════


  GIỐNG NHAU:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Tách model update logic thành lớp riêng            │
  │     (Redux: reducer, Flux: store)                      │
  │                                                        │
  │  ② KHÔNG cho phép cập nhật model trực tiếp            │
  │     → Cần mô tả mỗi thay đổi bằng action!           │
  │                                                        │
  │  ③ Ý tưởng cơ bản NHẤT QUÁN:                         │
  │     (state, action) => state                           │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  KHÁC NHAU:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① ĐỊNH NGHĨA:                                        │
  │  ┌──────────────────────────────────────────┐          │
  │  │  Flux  = PATTERN (>10 implementations!)  │          │
  │  │  Redux = MỘT implementation cụ thể!      │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  ② STATE TREE:                                         │
  │  ┌──────────────────────────────────────────┐          │
  │  │  Flux  = NHIỀU stores! Broadcast events  │          │
  │  │          → components subscribe events    │          │
  │  │          → đồng bộ state!                 │          │
  │  │                                          │          │
  │  │  Redux = MỘT store DUY NHẤT! State là   │          │
  │  │          cây bất biến!                    │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  ③ DISPATCHER:                                         │
  │  ┌──────────────────────────────────────────┐          │
  │  │  Flux  = CÓ dispatcher riêng!            │          │
  │  │          → Chuyển action đến mọi store!  │          │
  │  │                                          │          │
  │  │  Redux = KHÔNG CÓ dispatcher!            │          │
  │  │          → Dựa vào PURE FUNCTIONS!       │          │
  │  │          → Pure functions tổ hợp TỰ DO   │          │
  │  │            KHÔNG CẦN quản lý thứ tự!     │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  ④ IMMUTABILITY:                                       │
  │  ┌──────────────────────────────────────────┐          │
  │  │  Redux GIẢ ĐỊNH không modify state       │          │
  │  │  thủ công!                                │          │
  │  │                                          │          │
  │  │  → Ràng buộc ĐẠO ĐỨC, không bắt buộc   │          │
  │  │    về kỹ thuật!                           │          │
  │  │  → KHÔNG bắt buộc immutable data         │          │
  │  │    structures (vì lý do hiệu năng +      │          │
  │  │    linh hoạt)!                            │          │
  │  │  → Có thể dùng kèm: const, Immutable.js │          │
  │  │                                          │          │
  │  │  NẾU vi phạm (impure reducer):            │          │
  │  │  → Tính năng debug MẠNH MẼ sẽ BỊ PHÁ!  │          │
  │  │  → KHUYẾN CÁO MẠNH: KHÔNG LÀM VẬY!     │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §8. Câu Hỏi & Suy Ngẫm Nâng Cao

```
═══════════════════════════════════════════════════════════════
  Q&A = HIỂU SÂU HƠN VỀ REDUX!
═══════════════════════════════════════════════════════════════


  Q1: Cơ chế subscribe quản lý ĐỘ MỊN thế nào?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  subscribe(listener) → chỉ nhận TOÀN BỘ state!       │
  │                                                        │
  │  → BẤT KỲ thay đổi nào trên state tree →            │
  │    THÔNG BÁO TẤT CẢ listeners!                       │
  │  → Listener phải TỰ KIỂM TRA xem phần state         │
  │    mình quan tâm có thay đổi không!                    │
  │  → Cơ chế subscribe KHÔNG quản lý phân phối!          │
  │  → Phân phối cần xử lý THỦ CÔNG!                     │
  │                                                        │
  │  → Trong React: setState() là cách kích hoạt          │
  │    re-render, và connect() đã tối ưu bằng cách       │
  │    so sánh state trước/sau!                            │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  Q2: Provider trong react-redux hoạt động thế nào?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  → Dùng React CONTEXT API!                             │
  │  → Provider đặt store vào context                      │
  │    (qua getChildContext())                             │
  │  → MỌI component con đều truy cập được               │
  │    this.context.store!                                 │
  │                                                        │
  │  Đoán ban đầu: dùng hostContainerInfo → SAI!          │
  │  (hostContainerInfo chỉ chứa DOM info, và             │
  │  __reactInternalInstance là private property            │
  │  nên component không truy cập được!)                   │
  │                                                        │
  │  → Context = phiên bản nâng cao của                    │
  │    hostContainerInfo cho deep data passing!            │
  │  → Về kỹ thuật: view CŨNG truy cập được              │
  │    (context lan truyền không kiểm soát)                │
  │  → NHƯNG chỉ container mới NÊN truy cập!             │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  Q3: Bài toán CÂY VÔ HẠN CẤP xử lý thế nào?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  VÍ DỤ: cây thư mục có vô hạn cấp mở rộng           │
  │                                                        │
  │  GIẢI PHÁP — FLATTEN (LÀM PHẲNG):                     │
  │  ┌──────────────────────────────────────────┐          │
  │  │  Theo triết lý Redux, flatten cây thành  │          │
  │  │  2 phần:                                  │          │
  │  │                                          │          │
  │  │  ① Bảng thô (coarse-grained):            │          │
  │  │     nodeId → children (danh sách         │          │
  │  │     childrenIdList)                       │          │
  │  │                                          │          │
  │  │  ② Bảng chi tiết (fine-grained):          │          │
  │  │     nodeId → node data                    │          │
  │  │                                          │          │
  │  │  → Giống CHUẨN HÓA 3NF trong Database!  │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  │  TẠI SAO?                                              │
  │  ┌──────────────────────────────────────────┐          │
  │  │  → Flatten dễ BẢO TRÌ hơn nested state!  │          │
  │  │  → Nếu 1 tree component = 1 object lớn  │          │
  │  │    (node lồng trong tree) → CẬP NHẬT    │          │
  │  │    TỪNG PHẦN cây lớn RẤT KHÓ!           │          │
  │  │                                          │          │
  │  │  → Chuẩn hóa 3NF dùng được cả FE!       │          │
  │  │    (Không ngờ 3NF lại có thể áp dụng    │          │
  │  │    cho front-end!)                        │          │
  │  └──────────────────────────────────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

> **KẾT LUẬN PHẦN 2:**
> Redux là implementation cụ thể của Flux pattern, với những cải tiến quan trọng:
>
> - **Single Store** — Chỉ MỘT state tree duy nhất, dễ quản lý!
> - **Pure Reducers** — Thay thế event emitter bằng hàm thuần túy
> - **Không Dispatcher** — Pure functions tổ hợp tự do, không cần quản lý thứ tự
> - **DevTools mạnh mẽ** — Time-travel debugging nhờ immutability
> - **React-Redux** — Context API "xuyên thấu" store qua Provider
> - **State như Database** — Chuẩn hóa 3NF cho FE, flatten nested state!
