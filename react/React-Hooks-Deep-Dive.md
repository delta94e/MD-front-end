# React Hooks — Deep Dive

> 📅 2026-02-12 · ⏱ 25 phút đọc
>
> 7 chủ đề: Hook là gì & nguyên lý, useState array vs object,
> 3 vấn đề Hooks giải quyết, giới hạn sử dụng,
> useEffect vs useLayoutEffect, pitfalls thực tế,
> lifecycle class ↔ Hooks mapping.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: React Hooks

---

## Mục Lục

0. [React Hooks là gì? Nguyên lý](#0-react-hooks-là-gì)
1. [useState: Array vs Object](#1-usestate-array-vs-object)
2. [3 vấn đề Hooks giải quyết](#2-3-vấn-đề-hooks-giải-quyết)
3. [Giới hạn sử dụng Hooks](#3-giới-hạn-sử-dụng)
4. [useEffect vs useLayoutEffect](#4-useeffect-vs-uselayouteffect)
5. [Pitfalls thực tế](#5-pitfalls-thực-tế)
6. [Hooks ↔ Lifecycle Mapping](#6-hooks--lifecycle-mapping)
7. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#7-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. React Hooks là gì?

### Class Component vs Function Component

```javascript
// ── Class Component ──
class DemoClass extends React.Component {
  state = { text: "" };

  componentDidMount() {
    /* ... */
  }

  changeText = (newText) => {
    this.setState({ text: newText });
  };

  render() {
    return (
      <div>
        <p>{this.state.text}</p>
        <button onClick={this.changeText}>Sửa</button>
      </div>
    );
  }
}

// ── Function Component ──
function DemoFunction(props) {
  const { text } = props;
  return (
    <div>
      <p>{`Nội dung: [${text}]`}</p>
    </div>
  );
}
```

### So sánh

```
CLASS vs FUNCTION COMPONENT:
═══════════════════════════════════════════════════════════════
  ┌──────────────────┬──────────────────┬──────────────────┐
  │                  │ Class Component  │ Function Component│
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Kế thừa          │ extends Component│ Không cần         │
  │ Lifecycle        │ ✅ Đầy đủ        │ ❌ (trước Hooks) │
  │ this             │ ✅ Có            │ ❌ Không          │
  │ State            │ ✅ this.state    │ ❌ (trước Hooks) │
  │ Paradigm         │ OOP             │ Functional        │
  │ Logic reuse      │ ❌ Khó tách      │ ✅ Custom hooks   │
  │ Complexity       │ Cao              │ Thấp              │
  │ Phù hợp React    │ Trung bình       │ ✅ Data→UI func   │
  └──────────────────┴──────────────────┴──────────────────┘
```

### Tại sao cần Hooks?

> React component = **function**: input data → output UI.
> Class component: data và render **tách rời** (this thay đổi theo thời gian).
> Function component: data và render **gắn chặt** (closure capture giá trị tại thời điểm render).

```
TRƯỚC HOOKS:
  Function component = "stateless component" → rất hạn chế

SAU HOOKS:
  Function component + Hooks = FULL-FEATURED component
  ┌──────────────────────────────────────────────┐
  │  Hooks = "hộp linh kiện" cho function comp   │
  │                                              │
  │  useState    → state management              │
  │  useEffect   → side effects (lifecycle)      │
  │  useContext   → context access               │
  │  useReducer   → complex state logic          │
  │  useMemo      → memoize values               │
  │  useCallback  → memoize functions             │
  │  useRef       → mutable ref                  │
  │  useLayoutEffect → sync DOM mutations        │
  │  Custom hooks → logic reuse                  │
  └──────────────────────────────────────────────┘
```

### Nguyên lý hoạt động

> Hooks hoạt động dựa trên **linked list** (không phải array).
> Mỗi lần render, React duyệt linked list **theo thứ tự** để match hook với state.

```
HOOKS LINKED LIST (mỗi component):
  hook1 → hook2 → hook3 → hook4 → null
  (useState) (useEffect) (useState) (useMemo)

  Render lần 1: tạo list [hook1, hook2, hook3, hook4]
  Render lần 2: duyệt lại CÙNG THỨ TỰ → match state đúng

  ⚠️ Nếu đặt hook trong if/loop → THỨ TỰ thay đổi → SAI STATE!
```

---

## 1. useState: Array vs Object

### Tại sao return array chứ không phải object?

```javascript
// ── Array destructuring (HIỆN TẠI) ──
const [count, setCount] = useState(0);
const [name, setName] = useState("");
const [visible, setVisible] = useState(false);
// ✅ Tự đặt tên bất kỳ, simple & clean

// ── Object destructuring (GIẢ SỬ) ──
const { state, setState } = useState(false);
const { state: counter, setState: setCounter } = useState(0);
const { state: userName, setState: setUserName } = useState("");
// ❌ Phải đặt ALIAS mỗi lần dùng!
```

### Lý do

```
ARRAY DESTRUCTURING:
  const [a, b] = [1, 2]
  → Theo POSITION → đặt tên tùy ý

OBJECT DESTRUCTURING:
  const { id, name } = { id: 1, name: 'x' }
  → Theo PROPERTY NAME → phải trùng tên
  → Dùng nhiều lần → phải alias

KẾT LUẬN: Array giảm complexity, tên biến linh hoạt!
```

---

## 2. 3 Vấn Đề Hooks Giải Quyết

### Vấn đề 1: Khó chia sẻ state logic giữa components

```
TRƯỚC HOOKS:
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ HOC      │ →  │ render   │ →  │ Provider │ → NESTING HELL!
  │ wrap     │    │ props    │    │ Consumer │
  └──────────┘    └──────────┘    └──────────┘

SAU HOOKS:
  function useWindowSize() {         // Custom hook
    const [size, setSize] = useState(window.innerWidth);
    useEffect(() => {
      const handle = () => setSize(window.innerWidth);
      window.addEventListener('resize', handle);
      return () => window.removeEventListener('resize', handle);
    }, []);
    return size;
  }

  // Dùng ở BẤT KỲ component nào:
  function ComponentA() { const size = useWindowSize(); }
  function ComponentB() { const size = useWindowSize(); }
  // ✅ Không cần HOC, không nesting!
```

### Vấn đề 2: Component phức tạp khó hiểu

```javascript
// TRƯỚC: Logic TÁCH RỜI theo lifecycle
class MyComponent extends React.Component {
  componentDidMount() {
    fetchData(); // ← Data fetching
    subscribe(listener); // ← Event listener (KHÔNG LIÊN QUAN!)
  }
  componentDidUpdate() {
    fetchData(); // ← Lặp lại!
  }
  componentWillUnmount() {
    unsubscribe(listener); // ← Cleanup ở file khác
  }
}

// SAU: Logic NHÓM theo concern
function MyComponent() {
  // ── Data fetching (nhóm riêng) ──
  useEffect(() => {
    fetchData();
  }, [deps]);

  // ── Event listener (nhóm riêng) ──
  useEffect(() => {
    subscribe(listener);
    return () => unsubscribe(listener); // Cleanup ngay bên cạnh!
  }, []);
}
```

### Vấn đề 3: Class khó hiểu

```
CLASS PROBLEMS:
  ① this binding → bind(this) hoặc arrow function
  ② this thay đổi theo thời gian → bug tinh vi
  ③ Class khó optimize (minify, hot reload, tree shaking)
  ④ Học JavaScript class phức tạp

HOOKS SOLUTION:
  ① Không có this
  ② Closure capture giá trị tại render time
  ③ Functions dễ optimize
  ④ Just functions → dễ học
```

---

## 3. Giới Hạn Sử Dụng

### 2 Rules of Hooks

```
RULE 1: Chỉ gọi Hooks ở TOP LEVEL
  ✅ function MyComponent() { useState(...) }
  ❌ if (condition) { useState(...) }       ← SAI!
  ❌ for (let i...) { useState(...) }       ← SAI!
  ❌ function nested() { useState(...) }    ← SAI!

RULE 2: Chỉ gọi Hooks trong REACT FUNCTIONS
  ✅ Function components
  ✅ Custom hooks (useXxx)
  ❌ Class components
  ❌ Regular JavaScript functions
```

### Tại sao Rule 1?

```javascript
// ⚠️ VÍ DỤ LỖI:
function MyComponent({ condition }) {
  const [a, setA] = useState(1); // Hook 1

  if (condition) {
    const [b, setB] = useState(2); // Hook 2 (CHỈ KHI condition=true)
  }

  const [c, setC] = useState(3); // Hook 3
}

// Render 1 (condition=true):
//   Linked list: useState(1) → useState(2) → useState(3)
//                hook1          hook2          hook3

// Render 2 (condition=false):
//   Linked list: useState(1) → useState(3)  ← THIẾU hook2!
//                hook1          hook2 ← GÁN SAI! (c nhận giá trị của b)

// → ESLint plugin: eslint-plugin-react-hooks → phát hiện lỗi này
```

---

## 4. useEffect vs useLayoutEffect

### Giống nhau

- Cả hai xử lý **side effects** (DOM mutation, subscription, timer)
- Function signature **giống hệt** (cùng gọi `mountEffectImpl`)
- Có thể thay thế trực tiếp cho nhau

### Khác nhau

```
RENDER TIMELINE:
═══════════════════════════════════════════════════════════════

  ┌────────┐  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐
  │ Render │→ │ DOM mutation  │→ │ Paint screen   │→ │ useEffect    │
  │ phase  │  │ (commit)     │  │ (browser)     │  │ (ASYNC)      │
  └────────┘  └──────────────┘  └───────────────┘  └──────────────┘
                    │
                    ↓
              ┌───────────────────┐
              │ useLayoutEffect   │ ← TRƯỚC paint! (SYNC)
              │ (đồng bộ)         │
              └───────────────────┘
```

```
SO SÁNH:
  ┌─────────────────┬───────────────────┬───────────────────────┐
  │                 │ useEffect         │ useLayoutEffect       │
  ├─────────────────┼───────────────────┼───────────────────────┤
  │ Timing          │ SAU paint (async) │ TRƯỚC paint (sync)    │
  │ Blocking        │ ❌ Không block    │ ⚠️ Block rendering    │
  │ Flicker         │ Có thể nhấp nháy │ ❌ Không nhấp nháy    │
  │ Use case        │ 95% trường hợp   │ DOM measurement,      │
  │                 │ (data fetch,      │ style adjustment,     │
  │                 │ subscription)     │ prevent flicker       │
  │ Performance     │ ✅ Tốt hơn        │ ⚠️ Avoid heavy tasks  │
  │ Execution order │ Sau               │ Trước useEffect       │
  └─────────────────┴───────────────────┴───────────────────────┘

  RULE: Dùng useEffect trước. Nếu NHẤP NHÁY → đổi sang useLayoutEffect.
```

### Ví dụ nhấp nháy

```javascript
// ❌ useEffect → DOM flicker (nhấp nháy)
function FlickerExample() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (value === 0) setValue(10 + Math.random() * 200);
    // Render 0 trước → paint → rồi mới đổi → NHẤP!
  }, [value]);
  return <span>{value}</span>;
}

// ✅ useLayoutEffect → no flicker
function NoFlickerExample() {
  const [value, setValue] = useState(0);
  useLayoutEffect(() => {
    if (value === 0) setValue(10 + Math.random() * 200);
    // Đổi TRƯỚC paint → user không thấy 0
  }, [value]);
  return <span>{value}</span>;
}
```

---

## 5. Pitfalls Thực Tế

### Pitfall 1: push/pop/splice trực tiếp

```javascript
// ❌ SAI: Mutate trực tiếp → React không detect thay đổi
function BadExample() {
  let [nums, setNums] = useState([0, 1, 2, 3]);
  const test = () => {
    nums.push(1); // Mutate cùng reference!
    setNums(nums); // React so sánh reference → GIỐNG → skip render!
  };
}

// ✅ ĐÚNG: Tạo array MỚI (new reference)
function GoodExample() {
  let [nums, setNums] = useState([0, 1, 2, 3]);
  const test = () => {
    setNums([...nums, 1]); // Spread → new array → React detect!
  };
}
```

```
TẠI SAO CLASS KHÔNG BỊ?
  this.state.nums.push(1);
  this.setState({ nums: this.state.nums });
  → Class dùng setState → LUÔN trigger re-render (không so sánh reference)

  useState dùng Object.is() so sánh:
  → Cùng reference → skip render!
  → Khác reference → re-render ✅
```

### Pitfall 2: useState chỉ init lần đầu

```javascript
// ❌ SAI: columns thay đổi → tabColumn KHÔNG update
const TableDetail = ({ columns }) => {
  const [tabColumn, setTabColumn] = useState(columns);
  // useState(columns) chỉ dùng columns LẦN ĐẦU render!
};

// ✅ ĐÚNG: Sync với useEffect
const TableDetail = ({ columns }) => {
  const [tabColumn, setTabColumn] = useState(columns);
  useEffect(() => {
    setTabColumn(columns); // Sync khi columns thay đổi
  }, [columns]);
};

// ✅ TỐT HƠN: Không cần state thừa (derived state)
const TableDetail = ({ columns }) => {
  // Dùng columns trực tiếp hoặc useMemo
  const tabColumn = useMemo(() => processColumns(columns), [columns]);
};
```

### Pitfall 3: Không dùng useCallback cho event handlers

```javascript
// ❌ SAI: Mỗi render → TẠO MỚI function → child re-render
function Parent() {
  const handleClick = () => {
    /* ... */
  }; // Mới mỗi render!
  return <Child onClick={handleClick} />; // Child re-render mỗi lần!
}

// ✅ ĐÚNG: useCallback → stable reference
function Parent() {
  const handleClick = useCallback(() => {
    /* ... */
  }, []);
  return <Child onClick={handleClick} />; // Child skip re-render ✅
}
// Kết hợp React.memo cho Child:
const Child = React.memo(({ onClick }) => {
  /* ... */
});
```

### Pitfall 4: useContext lạm dụng

```
⚠️ useContext thay đổi → TẤT CẢ consumers re-render!

TRÁNH:
  ① Đừng đặt TOÀN BỘ state vào 1 context
  ② Tách context theo concern (ThemeContext, AuthContext...)
  ③ Dùng state management (Zustand, Jotai) cho complex state
  ④ useMemo/useCallback trong Provider value
```

---

## 6. Hooks ↔ Lifecycle Mapping

### Complete Mapping Table

```
CLASS → HOOKS MAPPING:
═══════════════════════════════════════════════════════════════
  ┌──────────────────────────┬────────────────────────────────┐
  │ Class Component          │ Hooks                          │
  ├──────────────────────────┼────────────────────────────────┤
  │ constructor              │ useState(initialValue)         │
  │ getDerivedStateFromProps │ useState + if trong render     │
  │ shouldComponentUpdate    │ React.memo / useMemo           │
  │ render                   │ Function body (return JSX)     │
  │ componentDidMount        │ useEffect(() => {}, [])        │
  │ componentDidUpdate       │ useEffect(() => {}, [deps])    │
  │ componentWillUnmount     │ useEffect(() => cleanup, [])   │
  │ componentDidCatch        │ ❌ Chưa có                     │
  │ getDerivedStateFromError │ ❌ Chưa có                     │
  └──────────────────────────┴────────────────────────────────┘
```

### Code Examples

```javascript
// ── constructor → useState ──
const [count, setCount] = useState(0);
// Lazy init (expensive computation):
const [data, setData] = useState(() => expensiveComputation());

// ── getDerivedStateFromProps → useState + condition ──
function ScrollView({ row }) {
  let [isScrollingDown, setIsScrollingDown] = useState(false);
  let [prevRow, setPrevRow] = useState(null);

  if (row !== prevRow) {
    setIsScrollingDown(prevRow !== null && row > prevRow);
    setPrevRow(row);
  }
  return `Scrolling down: ${isScrollingDown}`;
}
// React sẽ EXIT render đầu → re-run với state mới (không tốn performance)

// ── shouldComponentUpdate → React.memo ──
const Button = React.memo((props) => {
  return <button>{props.label}</button>;
});
// Shallow compare props → skip re-render nếu giống

// ── componentDidMount → useEffect([], []) ──
useEffect(() => {
  fetchData();
  // Chạy SAU first render
}, []); // [] = chỉ chạy 1 lần

// ── componentDidUpdate → useEffect([deps]) ──
useEffect(() => {
  document.title = `Clicked ${count} times`;
  // Chạy mỗi khi count thay đổi
}, [count]);

// ── componentWillUnmount → useEffect cleanup ──
useEffect(() => {
  const subscription = subscribe(listener);
  return () => {
    subscription.unsubscribe(); // Cleanup!
  };
}, []);

// ── Combined: Mount + Update + Unmount ──
useEffect(() => {
  // componentDidMount + componentDidUpdate(count)
  document.title = `Clicked ${count} times`;

  return () => {
    // Cleanup: chạy TRƯỚC update mới + componentWillUnmount
    // Quy tắc: CLEAN trước → UPDATE sau
  };
}, [count]);
```

```
useEffect LIFECYCLE FLOW:
  Render 1 (mount):
    → effect chạy (componentDidMount)

  Render 2 (count thay đổi):
    → cleanup từ Render 1 chạy TRƯỚC
    → effect mới chạy (componentDidUpdate)

  Unmount:
    → cleanup từ render cuối chạy (componentWillUnmount)
```

---

## 7. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
REACT HOOKS — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  WHY HOOKS:
    ① Logic reuse (custom hooks vs HOC/render props)
    ② Concern-based grouping (vs lifecycle-based splitting)
    ③ No class complexity (no this, no binding)

  RULES:
    ① Top-level only (no if/for/nested)
    ② React functions only (component/custom hook)
    → Hooks dùng LINKED LIST → thứ tự PHẢI cố định

  HOOKS:
    useState      → state + setter (array return for flexible naming)
    useEffect     → side effects ASYNC (sau paint)
    useLayoutEffect → side effects SYNC (trước paint, no flicker)
    useContext    → context value (⚠️ re-render toàn bộ consumers)
    useReducer    → complex state (action + reducer pattern)
    useMemo       → memoize VALUE (shouldComponentUpdate)
    useCallback   → memoize FUNCTION (stable reference cho children)
    useRef        → mutable ref (persist across renders, no re-render)

  PITFALLS:
    ① Mutate array/object trực tiếp → React skip render
    ② useState(props) chỉ init lần đầu → cần useEffect sync
    ③ Không useCallback → child re-render mỗi lần
    ④ useContext lạm dụng → toàn bộ consumers re-render
```

### Câu Hỏi Phỏng Vấn

**1. React Hooks là gì? Tại sao cần?**

> Hooks = set of functions cho phép function components có **state, lifecycle, context**. Cần vì: (1) logic reuse khó với class (HOC/render props → nesting hell), (2) lifecycle chia logic không liên quan vào cùng method, (3) class có this phức tạp. Hooks cho phép nhóm logic **theo concern**, dễ tách/test/reuse qua custom hooks.

**2. Tại sao useState return array?**

> **Array destructuring** theo position → đặt tên tùy ý. Object destructuring theo property name → phải alias khi dùng nhiều lần. Array **giảm complexity** khi sử dụng nhiều useState.

**3. Tại sao không được gọi Hooks trong if/for?**

> Hooks dùng **linked list** (internally). Mỗi render duyệt list **theo thứ tự**. if/for thay đổi thứ tự → hook match **sai state** → bug. ESLint plugin `react-hooks/rules-of-hooks` phát hiện lỗi này.

**4. useEffect vs useLayoutEffect?**

> **useEffect**: chạy **ASYNC sau paint** → không block render → có thể nhấp nháy. **useLayoutEffect**: chạy **SYNC trước paint** → block render → không nhấp nháy. Mặc định dùng useEffect, chuyển sang useLayoutEffect khi cần **DOM measurement** hoặc **prevent flicker**.

**5. useState(props) tại sao chỉ work lần đầu?**

> `useState(initialValue)` dùng `initialValue` chỉ ở **first render**. Các render sau giữ state cũ. Cần `useEffect(() => setState(props), [props])` để sync. Tốt hơn: dùng props **trực tiếp** hoặc `useMemo` (avoid derived state).

**6. push array vào useState tại sao không update?**

> `push` mutate **cùng reference**. React dùng `Object.is()` so sánh → cùng ref → **skip render**. Phải tạo **new array** (`[...arr, item]`). Class component không gặp vì `setState` **luôn trigger** re-render.

**7. Hooks tương ứng lifecycle nào?**

> `constructor` → `useState`. `componentDidMount` → `useEffect(fn, [])`. `componentDidUpdate` → `useEffect(fn, [deps])`. `componentWillUnmount` → `useEffect return cleanup`. `shouldComponentUpdate` → `React.memo`. `getDerivedStateFromProps` → useState + if trong render body. `componentDidCatch` → chưa có Hook tương ứng.

---

## Checklist Học Tập

- [ ] Class vs Function component: paradigm, lifecycle, this, state
- [ ] Hooks nguyên lý: linked list, thứ tự gọi cố định
- [ ] useState return array (flexible naming vs alias)
- [ ] 3 vấn đề: logic reuse, concern grouping, class complexity
- [ ] 2 Rules: top-level only, React functions only
- [ ] useEffect: async, sau paint, deps array, cleanup
- [ ] useLayoutEffect: sync, trước paint, no flicker
- [ ] Pitfall: mutate array → spread operator
- [ ] Pitfall: useState(props) chỉ init lần đầu
- [ ] Pitfall: useCallback cho event handlers → children
- [ ] Pitfall: useContext re-render toàn bộ consumers
- [ ] Lifecycle mapping: mount/update/unmount → useEffect
- [ ] React.memo = shouldComponentUpdate (shallow compare)
- [ ] getDerivedStateFromProps → useState + if in render
- [ ] Custom hooks: extract + reuse logic

---

_Cập nhật lần cuối: Tháng 2, 2026_
