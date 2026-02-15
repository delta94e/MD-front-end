# React API, Lifecycle & Advanced Patterns — Deep Dive

> 📅 2026-02-13 · ⏱ 25 phút đọc
>
> Lifecycle Methods đầy đủ, HOC Pattern, Render Props, Hooks nâng cao,
> Context API, Refs, Error Boundaries, và kỹ thuật giải quyết vấn đề thực tế
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Must-know React Senior Interview

---

## Mục Lục

| #   | Phần                                                 |
| --- | ---------------------------------------------------- |
| 1   | React Lifecycle — Toàn bộ vòng đời Component         |
| 2   | Lifecycle Methods Chi Tiết — Mỗi method dùng khi nào |
| 3   | HOC (Higher-Order Components) — Pattern & Thực hành  |
| 4   | Render Props — Pattern & So sánh                     |
| 5   | Hooks — API đầy đủ & Nguyên lý                       |
| 6   | Custom Hooks — Tái sử dụng logic                     |
| 7   | Context API — Truyền dữ liệu xuyên cây               |
| 8   | Refs & DOM — Truy cập trực tiếp                      |
| 9   | Error Boundaries — Xử lý lỗi                         |
| 10  | So sánh HOC vs Render Props vs Hooks                 |
| 11  | Tổng kết & Checklist phỏng vấn                       |

---

## §1. React Lifecycle — Toàn bộ vòng đời Component

```
LIFECYCLE 3 GIAI ĐOẠN (React 16.3+):
═══════════════════════════════════════════════════════════════

  ┌─── MOUNTING (Gắn kết) ──────────────────────────────────┐
  │                                                          │
  │ constructor(props)              ← Khởi tạo state         │
  │      │                                                   │
  │      ▼                                                   │
  │ static getDerivedStateFromProps(props, state) ← sync     │
  │      │                            state với props        │
  │      ▼                                                   │
  │ render()                        ← Trả về JSX (PURE!)     │
  │      │                                                   │
  │      ▼                                                   │
  │ ─── React cập nhật DOM + refs ───                        │
  │      │                                                   │
  │      ▼                                                   │
  │ componentDidMount()             ← API calls, subscriptions│
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ┌─── UPDATING (Cập nhật) ─────────────────────────────────┐
  │ (Khi props/state thay đổi hoặc forceUpdate)              │
  │                                                          │
  │ static getDerivedStateFromProps(props, state)             │
  │      │                                                   │
  │      ▼                                                   │
  │ shouldComponentUpdate(nextProps, nextState)               │
  │      │  return false → DỪNG! (không re-render)           │
  │      ▼                                                   │
  │ render()                                                 │
  │      │                                                   │
  │      ▼                                                   │
  │ getSnapshotBeforeUpdate(prevProps, prevState)             │
  │      │  ← đọc DOM TRƯỚC khi cập nhật (vd: scroll pos)   │
  │      ▼                                                   │
  │ ─── React cập nhật DOM + refs ───                        │
  │      │                                                   │
  │      ▼                                                   │
  │ componentDidUpdate(prevProps, prevState, snapshot)        │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ┌─── UNMOUNTING (Gỡ bỏ) ──────────────────────────────────┐
  │                                                          │
  │ componentWillUnmount()          ← Dọn dẹp! (cleanup)     │
  │   → clearInterval, removeEventListener, cancel requests  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

```
⚠️ DEPRECATED METHODS (ĐÃ BỎ — React 17+):
═══════════════════════════════════════════════════════════════

  ❌ componentWillMount       → dùng constructor hoặc useEffect
  ❌ componentWillReceiveProps → dùng getDerivedStateFromProps
  ❌ componentWillUpdate      → dùng getSnapshotBeforeUpdate

  TẠI SAO BỎ:
  → Fiber async rendering → các methods này có thể gọi NHIỀU LẦN!
  → Side effects trong componentWillXxx → BUGS khó debug! 💀
  → getDerivedStateFromProps là STATIC → không cho side effects!
```

---

## §2. Lifecycle Methods Chi Tiết

### constructor(props)

```javascript
class MyComponent extends React.Component {
  constructor(props) {
    super(props); // ← BẮT BUỘC! Gọi trước khi dùng this!
    // ✅ Khởi tạo state:
    this.state = { count: 0, data: null };
    // ✅ Bind methods:
    this.handleClick = this.handleClick.bind(this);
    // ❌ KHÔNG gọi setState() ở đây!
    // ❌ KHÔNG side effects (fetch, subscribe)!
  }
}
```

### static getDerivedStateFromProps(props, state)

```javascript
// Hiếm dùng! Đồng bộ state với props khi CẦN THIẾT:
class ControlledInput extends React.Component {
  static getDerivedStateFromProps(props, state) {
    // Nếu prop thay đổi → update state
    if (props.value !== state.prevValue) {
      return {
        internalValue: props.value,
        prevValue: props.value, // Lưu để so sánh lần sau
      };
    }
    return null; // Không thay đổi state
  }
}
// ĐẶC ĐIỂM:
// → STATIC → không có this → không side effects!
// → Gọi MỖI LẦN render (mount + update!)
// → Return object → merge vào state, null → không đổi
// → Thay thế componentWillReceiveProps
```

### shouldComponentUpdate(nextProps, nextState)

```javascript
class OptimizedList extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // ✅ Chỉ re-render khi data thay đổi:
    return nextProps.items !== this.props.items;
    // false → SKIP render + diff toàn bộ subtree! ⚡
  }
}

// THAY THẾ: React.PureComponent (shallow compare tự động!):
class PureList extends React.PureComponent {
  // Tự động shallow compare ALL props + state
  render() {
    /* ... */
  }
}

// FUNCTION COMPONENT: React.memo
const MemoList = React.memo(function List({ items }) {
  return items.map((item) => <li key={item.id}>{item.name}</li>);
});
// → Shallow compare props → skip re-render nếu giống!

// Custom compare:
const DeepMemoList = React.memo(List, (prevProps, nextProps) => {
  // return true = SKIP (ngược với shouldComponentUpdate!)
  return prevProps.items.length === nextProps.items.length;
});
```

### getSnapshotBeforeUpdate(prevProps, prevState)

```javascript
class ChatWindow extends React.Component {
  getSnapshotBeforeUpdate(prevProps, prevState) {
    // ĐỌC DOM TRƯỚC KHI UPDATE! (vd: scroll position)
    if (prevProps.messages.length < this.props.messages.length) {
      const list = this.listRef.current;
      return list.scrollHeight - list.scrollTop; // Snapshot!
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // Dùng snapshot SAU UPDATE:
    if (snapshot !== null) {
      const list = this.listRef.current;
      list.scrollTop = list.scrollHeight - snapshot;
      // → Giữ nguyên vị trí scroll khi thêm message mới! ✅
    }
  }
}
```

### componentDidMount & componentDidUpdate & componentWillUnmount

```javascript
class DataFetcher extends React.Component {
  state = { data: null, loading: true };

  componentDidMount() {
    // ✅ Gọi API:
    this.fetchData(this.props.id);
    // ✅ Subscribe:
    this.subscription = eventBus.subscribe("update", this.onUpdate);
    // ✅ Timer:
    this.timer = setInterval(() => this.tick(), 1000);
  }

  componentDidUpdate(prevProps) {
    // ✅ Fetch lại khi prop thay đổi:
    if (prevProps.id !== this.props.id) {
      this.fetchData(this.props.id);
    }
  }

  componentWillUnmount() {
    // ✅ DỌN DẸP TẤT CẢ:
    this.subscription.unsubscribe();
    clearInterval(this.timer);
    // Cancel pending API calls nếu cần!
  }

  fetchData(id) {
    /* ... */
  }
}
```

```
HOOKS TƯƠNG ĐƯƠNG:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────┬──────────────────────────────┐
  │ Class Lifecycle         │ Hook tương đương             │
  ├─────────────────────────┼──────────────────────────────┤
  │ constructor             │ useState(initialState)       │
  │ getDerivedStateFromProps│ useState + update trong render│
  │ shouldComponentUpdate   │ React.memo                   │
  │ render                  │ Function body (return JSX)   │
  │ componentDidMount       │ useEffect(() => {}, [])      │
  │ componentDidUpdate      │ useEffect(() => {}, [deps])  │
  │ componentWillUnmount    │ useEffect cleanup: return fn │
  │ getSnapshotBeforeUpdate │ useLayoutEffect (trước paint)│
  │ componentDidCatch       │ ❌ (chưa có hook tương đương)│
  └─────────────────────────┴──────────────────────────────┘
```

---

## §3. HOC (Higher-Order Components) — Pattern & Thực hành

```
HOC LÀ GÌ:
═══════════════════════════════════════════════════════════════

  HOC = Function nhận Component → trả về Component MỚI (enhanced)

  const EnhancedComponent = higherOrderComponent(WrappedComponent);

  NGUYÊN LÝ:
  → Component → [HOC Function] → Enhanced Component
  → HOC KHÔNG thay đổi component gốc!
  → HOC TẠO component MỚI bọc bên ngoài!
  → Tái sử dụng LOGIC, không phải UI!
```

```javascript
// ═══ HOC CƠ BẢN — Thêm functionality ═══

// ① withLoading — Thêm loading state:
function withLoading(WrappedComponent) {
  return function WithLoading({ isLoading, ...props }) {
    if (isLoading) return <div className="spinner">Loading...</div>;
    return <WrappedComponent {...props} />;
  };
}
// Sử dụng:
const UserListWithLoading = withLoading(UserList);
// <UserListWithLoading isLoading={true} users={users} />

// ② withAuth — Kiểm tra đăng nhập:
function withAuth(WrappedComponent) {
  return function WithAuth(props) {
    const isLoggedIn = useAuth(); // Giả sử hook auth
    if (!isLoggedIn) return <Redirect to="/login" />;
    return <WrappedComponent {...props} />;
  };
}
const ProtectedDashboard = withAuth(Dashboard);

// ③ withLogger — Log lifecycle:
function withLogger(WrappedComponent) {
  return class WithLogger extends React.Component {
    componentDidMount() {
      console.log(`[LOG] ${WrappedComponent.name} mounted`);
    }
    componentDidUpdate(prevProps) {
      console.log(`[LOG] ${WrappedComponent.name} updated`, {
        prevProps,
        nextProps: this.props,
      });
    }
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}

// ④ withDataFetching — Tách logic fetch:
function withDataFetching(WrappedComponent, url) {
  return function WithData(props) {
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          setData(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    return <WrappedComponent data={data} {...props} />;
  };
}
const UserListWithData = withDataFetching(UserList, "/api/users");
```

```javascript
// ═══ HOC NÂNG CAO ═══

// ⑤ compose — Kết hợp nhiều HOC:
function compose(...fns) {
  return fns.reduce(
    (a, b) =>
      (...args) =>
        a(b(...args)),
  );
}

const EnhancedComponent = compose(
  withAuth,
  withLogger,
  withLoading,
)(BaseComponent);
// = withAuth(withLogger(withLoading(BaseComponent)))

// ⑥ connect — Giống Redux connect (đơn giản hóa):
function connect(mapStateToProps, mapDispatchToProps) {
  return function (WrappedComponent) {
    return function ConnectedComponent(props) {
      const state = useStore(); // Giả sử store hook
      const dispatch = useDispatch();

      const stateProps = mapStateToProps(state, props);
      const dispatchProps = mapDispatchToProps(dispatch, props);

      return <WrappedComponent {...props} {...stateProps} {...dispatchProps} />;
    };
  };
}
// Sử dụng:
const ConnectedUserList = connect(
  (state) => ({ users: state.users }),
  (dispatch) => ({ fetchUsers: () => dispatch(fetchUsers()) }),
)(UserList);
```

```
⚠️ HOC — 5 CHÚ Ý QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  ① KHÔNG dùng HOC trong render() → re-create mỗi render!
     // ❌ render() { return <HOC(Comp) />; } // Mới mỗi render!
     // ✅ const Enhanced = HOC(Comp); // Ngoài render!

  ② CẦN forward refs (React.forwardRef):
     → HOC bọc ngoài → ref chỉ đến wrapper, không phải inner!

  ③ CẦN copy static methods:
     → Enhanced component KHÔNG có static methods của original!
     → Dùng hoist-non-react-statics library!

  ④ PHẢI truyền props qua (pass-through):
     → {...this.props} để component bên trong nhận đủ props!

  ⑤ Wrapper hell — Quá nhiều HOC → khó debug:
     → DevTools: <WithAuth><WithLogger><WithLoading><Comp>>>
     → Dùng displayName để đặt tên dễ đọc!
```

---

## §4. Render Props — Pattern & So sánh

```
RENDER PROPS LÀ GÌ:
═══════════════════════════════════════════════════════════════

  Component nhận 1 FUNCTION PROP → gọi function đó để render!
  → Logic nằm trong component, UI do CALLER quyết định!

  <DataProvider render={data => <h1>{data.name}</h1>} />
  // HOẶC dùng children:
  <DataProvider>
      {data => <h1>{data.name}</h1>}
  </DataProvider>
```

```javascript
// ═══ RENDER PROPS CƠ BẢN ═══

// ① Mouse Tracker — Chia sẻ logic mouse position:
class MouseTracker extends React.Component {
    state = { x: 0, y: 0 };

    handleMouseMove = (e) => {
        this.setState({ x: e.clientX, y: e.clientY });
    };

    render() {
        return (
            <div onMouseMove={this.handleMouseMove}>
                {/* GỌI FUNCTION PROP với state! */}
                {this.props.render(this.state)}
            </div>
        );
    }
}

// Sử dụng — CALLER quyết định UI:
<MouseTracker render={({ x, y }) => (
    <p>Mouse: {x}, {y}</p>
)} />

// Dùng cho hiệu ứng khác:
<MouseTracker render={({ x, y }) => (
    <img src="/cat.png" style={{ left: x, top: y, position: 'absolute' }} />
)} />
// → CÙNG logic (track mouse), KHÁC UI! ✅

// ② Children as function (phổ biến hơn):
class Toggle extends React.Component {
    state = { on: false };
    toggle = () => this.setState(prev => ({ on: !prev.on }));

    render() {
        return this.props.children({
            on: this.state.on,
            toggle: this.toggle,
        });
    }
}

// Sử dụng:
<Toggle>
    {({ on, toggle }) => (
        <div>
            <button onClick={toggle}>{on ? 'ON' : 'OFF'}</button>
            {on && <p>Content hiển thị khi ON!</p>}
        </div>
    )}
</Toggle>
```

```javascript
// ③ DataFetcher với Render Props:
class Fetch extends React.Component {
    state = { data: null, loading: true, error: null };

    componentDidMount() {
        fetch(this.props.url)
            .then(res => res.json())
            .then(data => this.setState({ data, loading: false }))
            .catch(error => this.setState({ error, loading: false }));
    }

    render() {
        return this.props.children(this.state);
    }
}

// Sử dụng — UI linh hoạt:
<Fetch url="/api/users">
    {({ data, loading, error }) => {
        if (loading) return <Spinner />;
        if (error) return <Error message={error.message} />;
        return <UserList users={data} />;
    }}
</Fetch>

// ④ Kết hợp nhiều Render Props (compose pattern):
<MouseTracker render={({ x, y }) => (
    <Fetch url={`/api/data?x=${x}`}>
        {({ data, loading }) => (
            <Toggle>
                {({ on, toggle }) => (
                    <div>
                        <p>Mouse: {x}, {y}</p>
                        {!loading && <p>Data: {data}</p>}
                        <button onClick={toggle}>{on ? 'Hide' : 'Show'}</button>
                    </div>
                )}
            </Toggle>
        )}
    </Fetch>
)} />
// ⚠️ CALLBACK HELL! Lồng quá sâu! 💀 → Hooks giải quyết!
```

---

## §5. Hooks — API đầy đủ & Nguyên lý

### useState

```javascript
// useState — State trong function component:
function Counter() {
  const [count, setCount] = useState(0);
  // Lazy initialization (tính toán nặng chỉ chạy 1 lần):
  const [data, setData] = useState(() => expensiveComputation());

  return (
    <div>
      <p>{count}</p>
      {/* ✅ Functional update — luôn dùng khi phụ thuộc prev state! */}
      <button onClick={() => setCount((prev) => prev + 1)}>+</button>

      {/* ❌ Batch gotcha (React 17): */}
      <button
        onClick={() => {
          setCount(count + 1); // count = 0
          setCount(count + 1); // count VẪN = 0! Chỉ +1!
          // FIX: setCount(c => c + 1); setCount(c => c + 1); // +2! ✅
        }}
      >
        Bad +2
      </button>
    </div>
  );
}
```

### useEffect

```javascript
// useEffect — Side effects, thay thế 3 lifecycle methods:
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  // ① componentDidMount + componentDidUpdate (deps):
  useEffect(() => {
    let cancelled = false; // Cleanup flag!
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUser(data); // Tránh set state sau unmount!
      });

    // ② componentWillUnmount (cleanup):
    return () => {
      cancelled = true; // Cancel khi userId thay đổi hoặc unmount!
    };
  }, [userId]); // ③ Chỉ chạy lại khi userId thay đổi!

  // Deps rules:
  // useEffect(fn)         → mỗi render (không deps)
  // useEffect(fn, [])     → chỉ mount (1 lần)
  // useEffect(fn, [a, b]) → khi a HOẶC b thay đổi
}
```

### useLayoutEffect

```javascript
// useLayoutEffect — Chạy TRƯỚC paint (đồng bộ!):
function Tooltip({ text, targetRef }) {
  const tooltipRef = useRef(null);

  useLayoutEffect(() => {
    // ĐỌC DOM + CẬP NHẬT VỊ TRÍ trước khi user thấy!
    const rect = targetRef.current.getBoundingClientRect();
    tooltipRef.current.style.left = `${rect.left}px`;
    tooltipRef.current.style.top = `${rect.bottom + 5}px`;
  }, [text]);

  return (
    <div ref={tooltipRef} className="tooltip">
      {text}
    </div>
  );
}

// useEffect vs useLayoutEffect:
// useEffect:       Render → Paint → Effect (user thấy rồi mới chạy!)
// useLayoutEffect: Render → Effect → Paint (chạy TRƯỚC paint!)
// → useLayoutEffect cho DOM measurements, scroll, animation prep
// → useEffect cho API calls, subscriptions (default choice!)
```

### useRef

```javascript
// useRef — 2 MỤC ĐÍCH:

// ① Truy cập DOM:
function FocusInput() {
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current.focus(); // Focus khi mount!
  }, []);
  return <input ref={inputRef} />;
}

// ② Lưu giá trị KHÔNG trigger re-render (mutable container):
function Timer() {
  const intervalRef = useRef(null);
  const renderCountRef = useRef(0);

  renderCountRef.current++; // Đếm render mà KHÔNG gây re-render!
  console.log(`Rendered ${renderCountRef.current} times`);

  useEffect(() => {
    intervalRef.current = setInterval(() => console.log("tick"), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <button onClick={() => clearInterval(intervalRef.current)}>Stop</button>
  );
}
// useRef.current thay đổi → KHÔNG re-render! (khác useState!)
```

### useMemo & useCallback

```javascript
// useMemo — Cache KẾT QUẢ tính toán:
function ExpensiveList({ items, filter }) {
  const filteredItems = useMemo(() => {
    console.log("Filtering..."); // Chỉ chạy khi items/filter ĐỔI!
    return items.filter((item) => item.name.includes(filter));
  }, [items, filter]);

  return filteredItems.map((item) => <Item key={item.id} {...item} />);
}

// useCallback — Cache FUNCTION REFERENCE:
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ Mỗi render → handleClick = function MỚI → con re-render!
  // const handleClick = () => console.log('click');

  // ✅ Cache function reference → con KHÔNG re-render!
  const handleClick = useCallback(() => {
    console.log("click");
  }, []); // [] = function không bao giờ đổi

  return <MemoChild onClick={handleClick} />;
}
const MemoChild = React.memo(({ onClick }) => {
  console.log("Child render"); // Chỉ render khi onClick ref thay đổi!
  return <button onClick={onClick}>Click</button>;
});

// useMemo vs useCallback:
// useMemo(() => value, deps)     → cache VALUE
// useCallback(fn, deps)          → cache FUNCTION
// useCallback(fn, deps) === useMemo(() => fn, deps)
```

### useReducer

```javascript
// useReducer — State phức tạp (thay thế Redux cho local state!):
function reducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    case "reset":
      return { count: action.payload };
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  // Lazy init: useReducer(reducer, initialArg, initFn)

  return (
    <div>
      Count: {state.count}
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch({ type: "reset", payload: 0 })}>
        Reset
      </button>
    </div>
  );
}

// KHI NÀO DÙNG useReducer thay useState:
// → State phức tạp (nhiều field liên quan)
// → State update phụ thuộc state trước đó
// → Logic cần centralize (nhiều actions)
// → Truyền dispatch thay vì nhiều callbacks
```

---

## §6. Custom Hooks — Tái sử dụng logic

```javascript
// ═══ CUSTOM HOOKS — Tách logic tái sử dụng ═══

// ① useToggle — Toggle boolean:
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle];
}
// Sử dụng:
const [isOpen, toggleOpen] = useToggle();

// ② useFetch — Fetch data:
function useFetch(url) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true }));

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ data: null, loading: false, error });
        }
      });

    return () => controller.abort(); // Cancel on cleanup!
  }, [url]);

  return state;
}
// Sử dụng:
const { data, loading, error } = useFetch("/api/users");

// ③ useLocalStorage — Persist state:
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
// const [theme, setTheme] = useLocalStorage('theme', 'dark');

// ④ useDebounce — Debounce value:
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
// const debouncedSearch = useDebounce(searchTerm, 500);
// useEffect(() => { fetch(`/search?q=${debouncedSearch}`) }, [debouncedSearch]);

// ⑤ usePrevious — Lưu giá trị trước đó:
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value; // Cập nhật SAU render!
  });
  return ref.current; // Trả về giá trị TRƯỚC render!
}
// const prevCount = usePrevious(count);

// ⑥ useWindowSize — Track window size:
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handler = () =>
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return size;
}
```

---

## §7. Context API — Truyền dữ liệu xuyên cây

```javascript
// ═══ CONTEXT — Tránh prop drilling ═══

// ① Tạo Context:
const ThemeContext = React.createContext("light"); // Default value

// ② Provider — Cung cấp giá trị:
function App() {
  const [theme, setTheme] = useState("dark");
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Header /> {/* KHÔNG cần truyền theme prop! */}
      <Main />
      <Footer />
    </ThemeContext.Provider>
  );
}

// ③ Consumer — Đọc giá trị (bất kỳ depth nào!):
// Cách 1: useContext (recommended!):
function ThemedButton() {
  const { theme, setTheme } = useContext(ThemeContext);
  return (
    <button
      className={theme}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      Toggle Theme ({theme})
    </button>
  );
}

// Cách 2: Context.Consumer (class components):
function ThemedButtonClass() {
  return (
    <ThemeContext.Consumer>
      {({ theme }) => <button className={theme}>Button</button>}
    </ThemeContext.Consumer>
  );
}
```

```
CONTEXT — CHÚ Ý PERFORMANCE:
═══════════════════════════════════════════════════════════════

  ⚠️ KHI Provider RE-RENDER → TẤT CẢ consumers re-render!

  // ❌ Value mới mỗi render:
  <MyContext.Provider value={{ user, theme }}>
  // → Object mới mỗi render → TẤT CẢ consumers re-render! 💀

  // ✅ Memoize value:
  const value = useMemo(() => ({ user, theme }), [user, theme]);
  <MyContext.Provider value={value}>
  // → Object chỉ thay đổi khi user/theme thay đổi! ✅

  // ✅ Tách Context (split contexts):
  <UserContext.Provider value={user}>
      <ThemeContext.Provider value={theme}>
          {children}
      </ThemeContext.Provider>
  </UserContext.Provider>
  // → Component chỉ subscribe context CẦN! ✅
```

---

## §8. Refs & DOM — Truy cập trực tiếp

```javascript
// ═══ REFS — 4 CÁCH DÙNG ═══

// ① createRef (Class component):
class MyComponent extends React.Component {
  myRef = React.createRef();
  componentDidMount() {
    this.myRef.current.focus();
  }
  render() {
    return <input ref={this.myRef} />;
  }
}

// ② useRef (Function component):
function MyFuncComponent() {
  const inputRef = useRef(null);
  return <input ref={inputRef} />;
}

// ③ Callback Ref — Kiểm soát tối đa:
function MeasuredComponent() {
  const [height, setHeight] = useState(0);
  const measuredRef = useCallback((node) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height);
    }
  }, []);
  return <div ref={measuredRef}>Content to measure</div>;
}

// ④ forwardRef — Truyền ref qua HOC/wrapper:
const FancyInput = React.forwardRef((props, ref) => {
  return <input ref={ref} className="fancy" {...props} />;
});

function Parent() {
  const inputRef = useRef(null);
  return <FancyInput ref={inputRef} />;
  // inputRef.current = <input> thật bên trong FancyInput! ✅
}

// ⑤ useImperativeHandle — Tùy chỉnh API của ref:
const CustomInput = React.forwardRef((props, ref) => {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    // CHỈ LỘ methods CẦN THIẾT (không lộ toàn bộ DOM!):
    focus: () => inputRef.current.focus(),
    clear: () => {
      inputRef.current.value = "";
    },
    getValue: () => inputRef.current.value,
  }));

  return <input ref={inputRef} {...props} />;
});
// Sử dụng:
// parentRef.current.focus();    ✅
// parentRef.current.style = ''; ❌ Không lộ ra!
```

---

## §9. Error Boundaries — Xử lý lỗi

```javascript
// ═══ ERROR BOUNDARY — Bắt lỗi render ═══
// ⚠️ CHỈ CÓ Class Component mới làm Error Boundary được!

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null };

  // ① Cập nhật state khi lỗi:
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // ② Log lỗi (side effect):
  componentDidCatch(error, errorInfo) {
    console.error("Error caught:", error);
    console.error("Component stack:", errorInfo.componentStack);
    // Gửi đến error tracking service:
    reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Oops! Có lỗi xảy ra 😞</h2>
          <details>
            <summary>Chi tiết lỗi</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false })}>
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Sử dụng — bọc quanh vùng có thể lỗi:
function App() {
  return (
    <ErrorBoundary>
      <Header />
      <ErrorBoundary>
        {" "}
        {/* Nested — chỉ crash phần này! */}
        <RiskyWidget />
      </ErrorBoundary>
      <Footer />
    </ErrorBoundary>
  );
}
```

```
ERROR BOUNDARY KHÔNG BẮT ĐƯỢC:
═══════════════════════════════════════════════════════════════

  ❌ Event handlers → dùng try/catch thường!
  ❌ Async code (setTimeout, API calls) → try/catch hoặc .catch()
  ❌ Server-side rendering
  ❌ Lỗi trong CHÍNH Error Boundary

  ✅ CHỈ BẮT: Lỗi trong render, lifecycle, constructor của CON!
```

---

## §10. So sánh HOC vs Render Props vs Hooks

```
SO SÁNH 3 PATTERN TÁI SỬ DỤNG LOGIC:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬────────────────┬────────────────┬──────────────┐
  │              │ HOC            │ Render Props   │ Hooks ⭐      │
  ├──────────────┼────────────────┼────────────────┼──────────────┤
  │ Cú pháp      │ withX(Comp)    │ <X render=...> │ useX()       │
  │ Tái sử dụng  │ ✅ Cao         │ ✅ Cao         │ ✅ Cao nhất  │
  │ Composition   │ compose()      │ Nesting JSX    │ Gọi liên tiếp│
  │ Props conflict│ ⚠️ Có thể ghi │ ✅ Không       │ ✅ Không     │
  │              │   đè lên nhau  │                │              │
  │ Wrapper hell │ ⚠️ DevTools    │ ⚠️ Callback    │ ✅ Không     │
  │              │   nhiều layer  │   hell lồng sâu│              │
  │ Type-safe    │ ⚠️ Khó type    │ ⚠️ Trung bình  │ ✅ Tốt nhất  │
  │ Static method│ ⚠️ Phải copy   │ ✅ Không vấn đề│ ✅ Không VĐ  │
  │ Ref          │ ⚠️ ForwardRef  │ ✅ Truyền thẳng│ ✅ useRef     │
  │ Debug        │ ⚠️ Tên wrapper │ ⚠️ Nesting     │ ✅ Dễ nhất   │
  │ Flexibility  │ ✅ Cao         │ ✅✅ Rất cao   │ ✅✅ Rất cao │
  │ Learning     │ Trung bình     │ Trung bình     │ Đơn giản     │
  └──────────────┴────────────────┴────────────────┴──────────────┘
```

```javascript
// CÙNG VẤN ĐỀ — 3 CÁCH GIẢI QUYẾT:

// ═══ Vấn đề: Chia sẻ logic "window width" ═══

// ① HOC:
function withWindowWidth(WrappedComponent) {
  return function (props) {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
      const handler = () => setWidth(window.innerWidth);
      window.addEventListener("resize", handler);
      return () => window.removeEventListener("resize", handler);
    }, []);
    return <WrappedComponent windowWidth={width} {...props} />;
  };
}
const ResponsiveNav = withWindowWidth(Nav);
// <ResponsiveNav /> → Nav nhận prop windowWidth

// ② Render Props:
function WindowWidth({ children }) {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return children(width);
}
// <WindowWidth>{width => <Nav windowWidth={width} />}</WindowWidth>

// ③ Custom Hook: ⭐ KHUYÊN DÙNG!
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}
function ResponsiveNav() {
  const width = useWindowWidth(); // Clean! Không wrapper!
  return <nav className={width > 768 ? "desktop" : "mobile"} />;
}
```

```
KHI NÀO DÙNG GÌ:
═══════════════════════════════════════════════════════════════

  HOOKS ⭐ (mặc định — dùng cho hầu hết trường hợp):
  → Tái sử dụng logic giữa function components
  → Custom hooks: useFetch, useAuth, useForm...
  → Clean, dễ đọc, dễ type, không wrapper

  HOC (khi cần):
  → Cần wrap TOÀN BỘ component (auth guard, logging)
  → Tích hợp library (Redux connect cũ, React Router withRouter)
  → Cần modify rendering behavior (conditional render)

  RENDER PROPS (khi cần):
  → UI flexibility cực cao (caller quyết định render)
  → Headless components (chỉ logic, không UI)
  → Library API (React Spring, Downshift, Formik)
```

---

## §11. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  React API & Advanced Patterns
  ├── Lifecycle: Mount → Update → Unmount
  │   ├── Mount: constructor → getDerivedState → render → didMount
  │   ├── Update: getDerivedState → shouldUpdate → render → snapshot → didUpdate
  │   └── Unmount: willUnmount (cleanup!)
  ├── HOC: function(Comp) → EnhancedComp
  │   └── withAuth, withLoading, compose, connect
  ├── Render Props: <Comp render={data => UI} />
  │   └── Children as function, headless components
  ├── Hooks: useState, useEffect, useRef, useMemo, useCallback, useReducer
  │   └── Custom: useFetch, useToggle, useDebounce, usePrevious
  ├── Context: createContext → Provider → useContext (skip prop drilling)
  ├── Refs: useRef, forwardRef, useImperativeHandle, callback ref
  └── Error Boundaries: getDerivedStateFromError + componentDidCatch
```

### Checklist

- [ ] **3 lifecycle phases**: Mounting (constructor → render → didMount), Updating (shouldUpdate → render → didUpdate), Unmounting (willUnmount)
- [ ] **Deprecated**: componentWillMount, componentWillReceiveProps, componentWillUpdate → Fiber async có thể gọi nhiều lần!
- [ ] **getDerivedStateFromProps**: STATIC (no this), sync state với props, return object hoặc null, gọi MỖI render
- [ ] **shouldComponentUpdate**: return false → skip render + diff toàn subtree, thay bằng React.memo/PureComponent
- [ ] **getSnapshotBeforeUpdate**: đọc DOM trước update (scroll pos), trả về snapshot → componentDidUpdate nhận
- [ ] **componentDidMount**: API calls, subscriptions, DOM manipulation, chỉ gọi 1 lần sau mount
- [ ] **HOC**: function nhận Component, trả Component mới, tái sử dụng logic, KHÔNG tạo trong render!
- [ ] **HOC 5 cẩn thận**: không trong render, forwardRef, copy statics, pass-through props, wrapper hell
- [ ] **Render Props**: component nhận function prop, gọi function với data để render, children as function
- [ ] **Render Props vs HOC**: Render Props linh hoạt UI hơn, HOC clean API hơn, cả hai có wrapper issues
- [ ] **useState**: lazy init, functional update (`prev => prev + 1`), batch updates (React 18 automatic)
- [ ] **useEffect deps**: không deps = mỗi render, [] = mount, [a,b] = khi a/b đổi, cleanup = return function
- [ ] **useLayoutEffect vs useEffect**: useLayoutEffect trước paint (đồng bộ), useEffect sau paint (bất đồng bộ)
- [ ] **useRef**: `.current` mutable, thay đổi KHÔNG re-render, dùng cho DOM ref + lưu giá trị xuyên render
- [ ] **useMemo**: cache value, useCallback: cache function, `useCallback(fn, deps) === useMemo(() => fn, deps)`
- [ ] **useReducer**: state phức tạp, centralize logic, `[state, dispatch] = useReducer(reducer, init)`
- [ ] **Custom Hooks**: tách logic tái sử dụng, bắt đầu bằng "use", gọi hooks bên trong
- [ ] **Context**: createContext → Provider (value) → useContext, ⚠️ memoize value tránh re-render consumers!
- [ ] **forwardRef + useImperativeHandle**: truyền ref qua wrapper, tùy chỉnh API lộ ra (không lộ toàn bộ DOM)
- [ ] **Error Boundary**: CHỈ class component, getDerivedStateFromError + componentDidCatch, KHÔNG bắt: events/async/SSR
- [ ] **Hooks > Render Props > HOC**: Hooks clean nhất, không wrapper, dễ type-safe, dễ debug

---

_Nguồn: ConardLi — "React API & Advanced Patterns" · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
