# React Virtual DOM & Diff Algorithm — Deep Dive

> 📅 2026-02-13 · ⏱ 22 phút đọc
>
> Virtual DOM từ ý tưởng đến triển khai nội bộ, Diff Algorithm 3 chiến lược,
> Fiber Architecture, Reconciliation, và Key Optimization
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Must-know React Core Interview

---

## Mục Lục

| #   | Phần                                    |
| --- | --------------------------------------- |
| 1   | Tại sao cần Virtual DOM?                |
| 2   | Virtual DOM — Cấu trúc dữ liệu          |
| 3   | createElement & render — Từ JSX đến DOM |
| 4   | Diff Algorithm — 3 Chiến lược cốt lõi   |
| 5   | Tree Diff (Cấp độ cây)                  |
| 6   | Component Diff (Cấp độ component)       |
| 7   | Element Diff (Cấp độ element — Key!)    |
| 8   | Fiber Architecture — Diff thế hệ mới    |
| 9   | Reconciliation — Toàn bộ quy trình      |
| 10  | Tự triển khai Mini Virtual DOM          |
| 11  | Tổng kết & Checklist phỏng vấn          |

---

## §1. Tại sao cần Virtual DOM?

```
VẤN ĐỀ — Thao tác DOM thật RẤT CHẬM:
═══════════════════════════════════════════════════════════════

  JavaScript:
  → Thao tác JS object: vài nanoseconds (cực nhanh!)

  Real DOM:
  → createElement: tạo object khổng lồ (~200+ properties!)
  → appendChild: trigger layout, paint, composite
  → innerHTML: parse HTML → build DOM → rebuild CSSOM → re-layout!

  VẤN ĐỀ THỰC TẾ:
  → Thay đổi 1 chữ trong <span> → browser có thể reflow TOÀN BỘ!
  → 100 lần thay đổi DOM = 100 lần reflow? (KHÔNG, browser batch)
  → Nhưng đọc layout giữa chừng → FORCE REFLOW! 💀

  // ❌ Force reflow mỗi lần:
  for (let i = 0; i < 100; i++) {
      el.style.left = el.offsetLeft + 1 + 'px'; // offsetLeft → force reflow!
  }
```

```
VIRTUAL DOM — GIẢI PHÁP:
═══════════════════════════════════════════════════════════════

  Ý TƯỞNG:
  ① Tạo BẢN SAO DOM bằng JS objects (nhanh!)
  ② Khi state thay đổi → tạo Virtual DOM MỚI
  ③ DIFF: So sánh cũ vs mới → tìm KHÁC BIỆT NHỎ NHẤT
  ④ PATCH: Chỉ cập nhật PHẦN KHÁC BIỆT lên Real DOM
  → Giảm thiểu thao tác DOM thật!

  ┌──────────┐  State   ┌──────────┐
  │ Old VDOM │ ──────→  │ New VDOM │
  └─────┬────┘  change  └────┬─────┘
        │                     │
        └────────┬────────────┘
                 │ DIFF
                 ▼
          ┌─────────────┐
          │ Patches List│  (chỉ phần khác biệt!)
          └──────┬──────┘
                 │ PATCH
                 ▼
          ┌─────────────┐
          │  Real DOM   │  (cập nhật tối thiểu!)
          └─────────────┘

  ⚠️ Virtual DOM KHÔNG phải lúc nào cũng nhanh hơn!
  → Overhead: tạo VDOM + diff + patch
  → Với ứng dụng đơn giản: DOM trực tiếp có thể nhanh hơn!
  → Giá trị thực: DỄ LẬP TRÌNH (declarative) + ĐÚNG (predictable)
  → "Virtual DOM is about enabling a declarative API" — Dan Abramov
```

---

## §2. Virtual DOM — Cấu trúc dữ liệu

```javascript
// VIRTUAL DOM NODE = Plain JavaScript Object!

// Real DOM:
// <div class="container" id="app">
//     <h1 style="color: red">Hello</h1>
//     <p>World</p>
// </div>

// ↕ Tương ứng

// Virtual DOM:
const vdom = {
  type: "div",
  props: {
    className: "container",
    id: "app",
    children: [
      {
        type: "h1",
        props: {
          style: { color: "red" },
          children: ["Hello"], // Text node = string
        },
      },
      {
        type: "p",
        props: {
          children: ["World"],
        },
      },
    ],
  },
};
```

```
VIRTUAL DOM NODE CẤU TRÚC:
═══════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────┐
  │ VNode (Virtual Node)                                   │
  ├────────────────────────────────────────────────────────┤
  │ type:     string | Function | Class                    │
  │           'div', 'span'   = HTML element               │
  │           MyComponent     = React Component            │
  │           React.Fragment  = Fragment                   │
  ├────────────────────────────────────────────────────────┤
  │ props:    object                                       │
  │           className, style, onClick, children...       │
  ├────────────────────────────────────────────────────────┤
  │ key:      string | number | null                       │
  │           Dùng cho Diff algorithm (§7)                 │
  ├────────────────────────────────────────────────────────┤
  │ ref:      React.createRef() | function | null          │
  │           Tham chiếu đến DOM/component thật            │
  ├────────────────────────────────────────────────────────┤
  │ $$typeof: Symbol(react.element)                        │
  │           Security: ngăn XSS injection!                │
  └────────────────────────────────────────────────────────┘

  REACT ELEMENT THẬT (output của createElement):
  {
    $$typeof: Symbol(react.element),  // Security marker!
    type: 'div',
    key: null,
    ref: null,
    props: { className: 'box', children: [...] },
    _owner: FiberNode,  // Fiber reference
  }
```

---

## §3. createElement & render — Từ JSX đến DOM

```
JSX → createElement → VDOM → Real DOM:
═══════════════════════════════════════════════════════════════

  BƯỚC 1: Babel biên dịch JSX → createElement calls

  // JSX:
  <div className="box">
      <h1>Hello</h1>
      <Button onClick={handleClick}>Click</Button>
  </div>

  // Sau Babel:
  React.createElement('div', { className: 'box' },
      React.createElement('h1', null, 'Hello'),
      React.createElement(Button, { onClick: handleClick }, 'Click')
  );

  // React 17+ (JSX Transform mới — không cần import React!)
  import { jsx as _jsx } from 'react/jsx-runtime';
  _jsx('div', {
      className: 'box',
      children: [
          _jsx('h1', { children: 'Hello' }),
          _jsx(Button, { onClick: handleClick, children: 'Click' })
      ]
  });
```

```javascript
// CREATEELEMENT — Đơn giản hóa:
function createElement(type, props, ...children) {
  return {
    $$typeof: Symbol.for("react.element"),
    type,
    key: props?.key ?? null,
    ref: props?.ref ?? null,
    props: {
      ...props,
      children:
        children.length === 1
          ? children[0] // Một child
          : children, // Nhiều children → array
    },
  };
}

// RENDER — VDOM → Real DOM (đơn giản hóa):
function render(vnode, container) {
  // ① Text node:
  if (typeof vnode === "string" || typeof vnode === "number") {
    container.appendChild(document.createTextNode(String(vnode)));
    return;
  }

  // ② Element node:
  const { type, props } = vnode;

  // Component?
  if (typeof type === "function") {
    // Function component:
    const childVNode = type(props);
    render(childVNode, container);
    return;
  }

  // HTML element:
  const el = document.createElement(type);

  // Gán props:
  Object.entries(props || {}).forEach(([key, value]) => {
    if (key === "children") return;
    if (key === "className") el.className = value;
    else if (key === "style") Object.assign(el.style, value);
    else if (key.startsWith("on")) {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  });

  // ③ Render children đệ quy:
  const children = Array.isArray(props.children)
    ? props.children
    : props.children
      ? [props.children]
      : [];
  children.forEach((child) => render(child, el));

  container.appendChild(el);
}
```

---

## §4. Diff Algorithm — 3 Chiến lược cốt lõi

```
DIFF ALGORITHM — TẠI SAO CẦN:
═══════════════════════════════════════════════════════════════

  Khi state thay đổi:
  → React tạo VDOM tree MỚI (re-render)
  → So sánh OLD VDOM vs NEW VDOM → tìm khác biệt
  → Chỉ cập nhật phần khác biệt lên Real DOM

  ĐỘ PHỨC TẠP:
  → Diff thuần túy 2 cây (tree edit distance): O(n³) 💀
  → 1000 nodes → 10⁹ phép so sánh → QUÁ CHẬM!

  REACT GIẢM XUỐNG O(n) bằng 3 GIẢ ĐỊNH:
  ① TREE DIFF: Nodes ở KHÁC CẤP (level) → KHÔNG so sánh!
  ② COMPONENT DIFF: Khác TYPE → THAY THẾ HOÀN TOÀN!
  ③ ELEMENT DIFF: Cùng cấp, cùng type → dùng KEY phân biệt!

  O(n³) → O(n) — Từ 1 tỷ → 1000 phép so sánh! 🚀
```

```
3 CHIẾN LƯỢC:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │ ① TREE DIFF                                            │
  │ → Chỉ so sánh nodes CÙNG CẤP (same level)             │
  │ → Cross-level move? → XÓA + TẠO MỚI (không move!)     │
  │ → Breadth-first, level-by-level                        │
  ├─────────────────────────────────────────────────────────┤
  │ ② COMPONENT DIFF                                       │
  │ → Cùng type → KEEP component, update props             │
  │ → Khác type → DESTROY cũ, CREATE mới (kể cả con!)     │
  │ → shouldComponentUpdate / React.memo → skip diff!      │
  ├─────────────────────────────────────────────────────────┤
  │ ③ ELEMENT DIFF                                         │
  │ → Cùng type, cùng level → so sánh props + KEY          │
  │ → Key giúp React biết element NÀO di chuyển/thêm/xóa  │
  │ → KHÔNG có key → React dùng INDEX (chậm hơn!)          │
  └─────────────────────────────────────────────────────────┘
```

---

## §5. Tree Diff (Cấp độ cây)

```
TREE DIFF — CHỈ SO SÁNH CÙNG CẤP:
═══════════════════════════════════════════════════════════════

  GIẢI THUYẾT: Trong thực tế, DOM node RẤT HIẾM KHI
  di chuyển qua các cấp khác nhau. → Chỉ cần so cùng cấp!

  OLD TREE:          NEW TREE:

  Level 0:  A              A
           / \            / \
  Level 1: B   C          B   C
          /               |
  Level 2: D              D   ← D chuyển từ B sang C?

  DIFF CÙNG CẤP:
  Level 0: A === A → OK
  Level 1: B vs B → OK, C vs C → OK
  Level 2: B có D → C KHÔNG có D

  REACT KHÔNG di chuyển D từ B → C!
  → XÓA D (và subtree) khỏi B
  → TẠO MỚI D dưới C
  → Tốn hơn? CÓ. Nhưng trường hợp này HIẾM!
  → Trade-off: O(n) cho 99% cases vs O(n³) cho 100% cases

  ⚠️ KHUYẾN CÁO: Tránh di chuyển component giữa các cấp!
  → React sẽ destroy + recreate → MẤT state! 💀
```

```javascript
// VÍ DỤ TREE DIFF:

// OLD:
// <div>
//     <Header />      → Level 1
//     <Content />     → Level 1
// </div>

// NEW:
// <div>
//     <Header />      → Level 1 — SAME → keep, update props
//     <Sidebar />     → Level 1 — KHÁC type! Replace!
// </div>

// → React so level 1:
// [0]: Header === Header → keep, reconcile children
// [1]: Content !== Sidebar → DESTROY Content, CREATE Sidebar
```

---

## §6. Component Diff (Cấp độ component)

```
COMPONENT DIFF — SO SÁNH THEO LOẠI:
═══════════════════════════════════════════════════════════════

  QUY TẮC: Khác TYPE → KHÁC HOÀN TOÀN!

  ① CÙNG TYPE → Giữ instance, update props:
  <MyButton color="red" />  →  <MyButton color="blue" />
  → Cùng type MyButton → KEEP instance
  → Gọi componentWillReceiveProps / useEffect
  → Re-render với props mới
  → Diff subtree (children)

  ② KHÁC TYPE → Hủy hoàn toàn, tạo mới:
  <MyButton />  →  <YourButton />
  → Khác type → DESTROY MyButton (componentWillUnmount!)
  → CREATE YourButton (constructor → render → componentDidMount)
  → TOÀN BỘ subtree bên dưới cũng bị hủy + tạo lại!
  → Kể cả children GIỐNG NHAU cũng bị tạo lại! 💀

  ③ shouldComponentUpdate / React.memo → TỐI ƯU:
  → Return false → SKIP DIFF TOÀN BỘ subtree!
  → React.memo: shallow compare props → skip nếu giống
  → PureComponent: shallow compare state + props
  → Rất hiệu quả khi subtree lớn!
```

```javascript
// COMPONENT DIFF VÍ DỤ:

// ① Cùng type — KEEP + update:
// OLD: <UserProfile name="Jun" />
// NEW: <UserProfile name="Lee" />
// → Cùng UserProfile → gọi render() lại với name="Lee"
// → componentDidUpdate / useEffect chạy

// ② Khác type — DESTROY + CREATE:
// OLD: <ClassComponent />
// NEW: <FunctionComponent />
// → DESTROY ClassComponent: componentWillUnmount()
// → CREATE FunctionComponent: render → mount
// → Kể cả nội dung GIỐNG NHAU!

// ③ React.memo — SKIP diff:
const MemoizedList = React.memo(function List({ items }) {
  return items.map((item) => <li key={item.id}>{item.name}</li>);
});
// → Nếu items không thay đổi (shallow compare) → SKIP re-render!
// → KHÔNG diff subtree → TIẾT KIỆM rất nhiều!

// ④ shouldComponentUpdate — Manual control:
class HeavyComponent extends React.Component {
  shouldComponentUpdate(nextProps) {
    // Chỉ re-render khi data thay đổi:
    return nextProps.data !== this.props.data;
  }
  render() {
    return <ExpensiveTree data={this.props.data} />;
  }
}
```

---

## §7. Element Diff (Cấp độ element — Key!)

```
ELEMENT DIFF — VAI TRÒ CỦA KEY:
═══════════════════════════════════════════════════════════════

  Khi children là LIST → React cần biết:
  → Element nào THÊM MỚI?
  → Element nào BỊ XÓA?
  → Element nào DI CHUYỂN?

  KHÔNG CÓ KEY — React dùng INDEX:
  OLD: [A, B, C]     index: [0, 1, 2]
  NEW: [B, A, C]     index: [0, 1, 2]

  → React so sánh theo index:
  [0]: A → B → KHÁC! Replace A bằng B
  [1]: B → A → KHÁC! Replace B bằng A
  [2]: C → C → Giống! Keep

  → 2 thao tác REPLACE! (thực tế chỉ cần SWAP!) 💀

  CÓ KEY — React biết chính xác:
  OLD: [A(key=a), B(key=b), C(key=c)]
  NEW: [B(key=b), A(key=a), C(key=c)]

  → React match theo key:
  key=a: A → vẫn còn → DI CHUYỂN
  key=b: B → vẫn còn → DI CHUYỂN
  key=c: C → vẫn còn → KEEP

  → 2 thao tác MOVE! (tối ưu hơn replace!) ✅
```

### Thuật toán Element Diff chi tiết

```
REACT ELEMENT DIFF ALGORITHM:
═══════════════════════════════════════════════════════════════

  3 THAO TÁC: INSERT, MOVE, DELETE

  Sử dụng lastIndex tracking để tối ưu MOVE:

  OLD: [A, B, C, D]   (index: 0, 1, 2, 3)
  NEW: [B, A, D, C]

  lastIndex = 0 (vị trí cuối cùng đã xử lý)

  BƯỚC 1: Duyệt NEW list:
  ┌────────────────────────────────────────────────────────┐
  │ new[0] = B                                             │
  │ → Tìm B trong OLD → found ở index 1                   │
  │ → oldIndex(1) >= lastIndex(0)? → CÓ → KHÔNG move!     │
  │ → lastIndex = max(1, 0) = 1                           │
  ├────────────────────────────────────────────────────────┤
  │ new[1] = A                                             │
  │ → Tìm A trong OLD → found ở index 0                   │
  │ → oldIndex(0) >= lastIndex(1)? → KHÔNG → MOVE A! ⬆️   │
  │ → lastIndex = max(0, 1) = 1 (giữ 1)                   │
  ├────────────────────────────────────────────────────────┤
  │ new[2] = D                                             │
  │ → Tìm D trong OLD → found ở index 3                   │
  │ → oldIndex(3) >= lastIndex(1)? → CÓ → KHÔNG move!     │
  │ → lastIndex = max(3, 1) = 3                           │
  ├────────────────────────────────────────────────────────┤
  │ new[3] = C                                             │
  │ → Tìm C trong OLD → found ở index 2                   │
  │ → oldIndex(2) >= lastIndex(3)? → KHÔNG → MOVE C! ⬆️   │
  │ → lastIndex = max(2, 3) = 3 (giữ 3)                   │
  └────────────────────────────────────────────────────────┘

  KẾT QUẢ: Move A, Move C → 2 thao tác!
  (Thay vì 4 replace nếu không có key!)

  BƯỚC 2: Xóa elements trong OLD không có trong NEW
```

```
⚠️ WORST CASE — DI CHUYỂN PHẦN TỬ ĐẦU VỀ CUỐI:
═══════════════════════════════════════════════════════════════

  OLD: [A, B, C, D]
  NEW: [D, A, B, C]   ← D từ cuối lên đầu

  lastIndex = 0

  D: oldIndex=3 >= lastIndex=0 → KHÔNG move → lastIndex=3
  A: oldIndex=0 <  lastIndex=3 → MOVE! 💀
  B: oldIndex=1 <  lastIndex=3 → MOVE! 💀
  C: oldIndex=2 <  lastIndex=3 → MOVE! 💀

  → 3 MOVES! (A, B, C đều phải move!)
  → Lý tưởng chỉ cần MOVE D 1 lần!
  → Đây là WORST CASE của React diff!

  KHUYẾN CÁO: TRÁNH di chuyển phần tử cuối lên đầu list!
```

```javascript
// KEY — QUY TẮC VÀNG:

// ❌ KHÔNG dùng index làm key (trừ static list!):
{
  items.map((item, index) => <Item key={index} data={item} />);
}
// Khi list thay đổi (insert/delete/sort):
// → index thay đổi → key thay đổi → React nghĩ KHÁC element!
// → MẤT state! Re-create thay vì move! 💀

// ✅ Dùng ID ổn định:
{
  items.map((item) => <Item key={item.id} data={item} />);
}
// → ID không đổi khi sort/filter → React biết chính xác element nào!

// ❌ KHÔNG dùng random key:
{
  items.map(
    (item) => <Item key={Math.random()} data={item} />, // 💀 Mỗi render = key mới!
  );
}
// → React nghĩ TẤT CẢ elements đều MỚI → destroy + create TẤT CẢ!

// ✅ KHI NÀO dùng index OK:
// → List STATIC (không thay đổi thứ tự)
// → List KHÔNG có state riêng trong items
// → List KHÔNG bị filter/sort
```

---

## §8. Fiber Architecture — Diff thế hệ mới

```
TẠI SAO CẦN FIBER (React 16+):
═══════════════════════════════════════════════════════════════

  REACT 15 (Stack Reconciler):
  → Diff chạy ĐỒNG BỘ, không thể dừng!
  → Tree lớn → diff lâu → block main thread → UI ĐỨNG! 💀
  → 60fps = 16.67ms/frame → diff > 16ms → DROP FRAME!

  REACT 16+ (Fiber Reconciler):
  → Diff chia thành UNITS OF WORK nhỏ
  → Có thể DỪNG giữa chừng → xử lý user input → TIẾP TỤC!
  → Priority-based: animation > data fetch > off-screen
  → KHÔNG block main thread! ✅
```

```
FIBER NODE — Cấu trúc:
═══════════════════════════════════════════════════════════════

  Mỗi React element → 1 Fiber node:

  ┌────────────────────────────────────────────────────────┐
  │ Fiber Node                                             │
  ├────────────────────────────────────────────────────────┤
  │ type:         'div' | MyComponent                      │
  │ key:          string | null                            │
  │ stateNode:    DOM node | Component instance            │
  ├────────────────────────────────────────────────────────┤
  │ TREE POINTERS (linked list, không phải tree!):         │
  │ child:        → first child Fiber                      │
  │ sibling:      → next sibling Fiber                     │
  │ return:       → parent Fiber                           │
  ├────────────────────────────────────────────────────────┤
  │ pendingProps: props mới từ render                      │
  │ memoizedProps: props đã render lần trước               │
  │ memoizedState: state đã render lần trước               │
  ├────────────────────────────────────────────────────────┤
  │ effectTag:    PLACEMENT | UPDATE | DELETION            │
  │ alternate:    → Fiber cũ (để so sánh — double buffer!) │
  └────────────────────────────────────────────────────────┘

  FIBER TREE = LINKED LIST (không phải tree thật!):

       App
       │ child
       ▼
      div ──sibling──→ null
       │ child
       ▼
      h1 ──sibling──→ p ──sibling──→ Button
                                      │ child
                                      ▼
                                    "Click"

  → Duyệt bằng child → sibling → return
  → Có thể DỪNG ở BẤT KỲ node nào!
  → Nhớ vị trí → TIẾP TỤC sau! (interruptible!)
```

```
2 PHASES CỦA FIBER:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │ PHASE 1: RENDER (Reconciliation) — CÓ THỂ DỪNG!       │
  │                                                         │
  │ → Duyệt Fiber tree → diff → tạo effect list           │
  │ → KHÔNG thay đổi DOM!                                   │
  │ → Có thể bị INTERRUPT bởi high-priority work           │
  │ → resumable: nhớ vị trí, tiếp tục sau                  │
  │                                                         │
  │ Lifecycle chạy trong phase này:                         │
  │ → getDerivedStateFromProps                              │
  │ → shouldComponentUpdate                                 │
  │ → render                                                │
  │ ⚠️ Có thể bị gọi NHIỀU LẦN! (vì interruptible)       │
  ├─────────────────────────────────────────────────────────┤
  │ PHASE 2: COMMIT — KHÔNG THỂ DỪNG!                     │
  │                                                         │
  │ → Áp dụng changes lên Real DOM (synchronous!)          │
  │ → KHÔNG thể interrupt (phải hoàn thành!)               │
  │ → Chạy nhanh vì chỉ apply patches                      │
  │                                                         │
  │ Lifecycle chạy trong phase này:                         │
  │ → componentDidMount                                     │
  │ → componentDidUpdate                                    │
  │ → componentWillUnmount                                  │
  │ → useLayoutEffect                                       │
  │ → useEffect (async, sau paint)                          │
  └─────────────────────────────────────────────────────────┘

  TẠI SAO 2 PHASES:
  → Phase 1 (render): tính toán, có thể restart
  → Phase 2 (commit): DOM update, phải atomic!
  → User thấy: DOM cập nhật 1 lần duy nhất, không flicker!
```

```
DOUBLE BUFFERING — ALTERNATE:
═══════════════════════════════════════════════════════════════

  React giữ 2 Fiber trees:

  CURRENT TREE ←──alternate──→ WORK-IN-PROGRESS TREE
  (đang hiển thị)               (đang build)

  ① Render phase: Build WIP tree, diff với current
  ② Commit phase: Swap! WIP → trở thành current
  ③ Lần render sau: Current cũ → trở thành WIP mới (reuse!)

  → Giống kỹ thuật double buffering trong game graphics!
  → Không tạo object mới → reuse → giảm GC pressure!
```

---

## §9. Reconciliation — Toàn bộ quy trình

```
RECONCILIATION FLOW (SƠ ĐỒ ĐẦY ĐỦ):
═══════════════════════════════════════════════════════════════

  setState() / useState() / props change
       │
       ▼
  Schedule Update (Scheduler - priority based)
       │
       ▼
  ┌─── RENDER PHASE (interruptible) ───────────────────────┐
  │                                                         │
  │  Begin Work: DFS duyệt Fiber tree                      │
  │       │                                                 │
  │       ▼                                                 │
  │  Fiber node:                                            │
  │  ├─ type khác? → REPLACE (effectTag = PLACEMENT)       │
  │  ├─ type giống?                                         │
  │  │   ├─ shouldUpdate = false? → SKIP subtree! ⚡       │
  │  │   └─ shouldUpdate = true?  → diff props, diff children│
  │  └─ children diff:                                      │
  │      ├─ Single child? → reconcileSingleElement          │
  │      └─ Array? → reconcileChildrenArray (key-based!)    │
  │       │                                                 │
  │       ▼                                                 │
  │  Complete Work: bubble up effects                       │
  │  → Tạo effect list (linked list of changes)            │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
       │
       ▼
  ┌─── COMMIT PHASE (synchronous, non-interruptible) ──────┐
  │                                                         │
  │  ① Before Mutation:                                     │
  │     getSnapshotBeforeUpdate                             │
  │                                                         │
  │  ② Mutation: Apply changes to DOM                       │
  │     PLACEMENT → appendChild / insertBefore              │
  │     UPDATE    → updateProperties                        │
  │     DELETION  → removeChild + cleanup                   │
  │                                                         │
  │  ③ Layout:                                              │
  │     componentDidMount / componentDidUpdate              │
  │     useLayoutEffect callbacks                           │
  │                                                         │
  │  ④ Swap: WIP tree → current tree                        │
  │                                                         │
  │  ⑤ Passive Effects (async, after paint):                │
  │     useEffect callbacks                                 │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

```javascript
// RECONCILE CHILDREN ARRAY — Simplified:
function reconcileChildrenArray(currentFirstChild, newChildren) {
  const existingChildren = new Map(); // key → Fiber
  let child = currentFirstChild;

  // ① Build map: key → old Fiber
  while (child !== null) {
    existingChildren.set(child.key !== null ? child.key : child.index, child);
    child = child.sibling;
  }

  let lastPlacedIndex = 0;
  const result = [];

  // ② Duyệt new children:
  newChildren.forEach((newChild, newIndex) => {
    const key = newChild.key !== null ? newChild.key : newIndex;
    const existing = existingChildren.get(key);

    if (existing) {
      // Found match!
      existingChildren.delete(key); // Đã dùng
      if (existing.index < lastPlacedIndex) {
        // Cần MOVE (vị trí cũ < lastPlacedIndex)
        result.push({ type: "MOVE", fiber: existing, index: newIndex });
      } else {
        // KHÔNG cần move (giữ nguyên vị trí tương đối)
        lastPlacedIndex = existing.index;
      }
      // Update props:
      result.push({ type: "UPDATE", fiber: existing, props: newChild.props });
    } else {
      // Không tìm thấy → INSERT mới!
      result.push({ type: "INSERT", element: newChild, index: newIndex });
    }
  });

  // ③ Xóa phần tử còn lại trong map (không có trong new):
  existingChildren.forEach((fiber) => {
    result.push({ type: "DELETE", fiber });
  });

  return result;
}
```

---

## §10. Tự triển khai Mini Virtual DOM

```javascript
// MINI VDOM — ĐỦ ĐỂ HIỂU CƠ CHẾ:

// ① createElement:
function h(type, props = {}, ...children) {
  return {
    type,
    props: { ...props, children: children.flat() },
  };
}

// ② render VDOM → Real DOM:
function createElement(vnode) {
  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  }
  const el = document.createElement(vnode.type);
  // Set props:
  Object.entries(vnode.props).forEach(([k, v]) => {
    if (k === "children") return;
    if (k.startsWith("on")) {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else {
      el.setAttribute(k, v);
    }
  });
  // Render children:
  (vnode.props.children || []).forEach((child) => {
    el.appendChild(createElement(child));
  });
  return el;
}

// ③ DIFF — So sánh 2 VDOM trees:
function diff(oldNode, newNode) {
  // Case 1: Node bị xóa
  if (newNode === undefined) {
    return { type: "REMOVE" };
  }
  // Case 2: Text node thay đổi
  if (typeof oldNode === "string" || typeof newNode === "string") {
    if (oldNode !== newNode) {
      return { type: "REPLACE", newNode };
    }
    return null; // Giống → không thay đổi
  }
  // Case 3: Khác element type → replace hoàn toàn
  if (oldNode.type !== newNode.type) {
    return { type: "REPLACE", newNode };
  }
  // Case 4: Cùng type → diff props + children
  return {
    type: "UPDATE",
    propPatches: diffProps(oldNode.props, newNode.props),
    childPatches: diffChildren(oldNode.props.children, newNode.props.children),
  };
}

function diffProps(oldProps, newProps) {
  const patches = [];
  // Props thay đổi hoặc thêm mới:
  Object.entries(newProps).forEach(([k, v]) => {
    if (k !== "children" && oldProps[k] !== v) {
      patches.push({ type: "SET", key: k, value: v });
    }
  });
  // Props bị xóa:
  Object.keys(oldProps).forEach((k) => {
    if (k !== "children" && !(k in newProps)) {
      patches.push({ type: "REMOVE", key: k });
    }
  });
  return patches;
}

function diffChildren(oldChildren = [], newChildren = []) {
  const patches = [];
  const maxLen = Math.max(oldChildren.length, newChildren.length);
  for (let i = 0; i < maxLen; i++) {
    patches.push(diff(oldChildren[i], newChildren[i]));
  }
  return patches;
}

// ④ PATCH — Áp dụng diff lên Real DOM:
function patch(parent, patchObj, index = 0) {
  if (!patchObj) return;
  const el = parent.childNodes[index];

  switch (patchObj.type) {
    case "REMOVE":
      parent.removeChild(el);
      break;
    case "REPLACE":
      parent.replaceChild(createElement(patchObj.newNode), el);
      break;
    case "UPDATE":
      // Apply prop patches:
      patchObj.propPatches.forEach((p) => {
        if (p.type === "SET") {
          if (p.key.startsWith("on")) {
            // Event listener update (simplified)
          } else {
            el.setAttribute(p.key, p.value);
          }
        } else {
          el.removeAttribute(p.key);
        }
      });
      // Apply child patches:
      patchObj.childPatches.forEach((childPatch, i) => {
        patch(el, childPatch, i);
      });
      break;
  }
}

// ⑤ SỬ DỤNG:
const oldTree = h(
  "div",
  { class: "app" },
  h("h1", {}, "Hello"),
  h("p", {}, "World"),
);

const newTree = h(
  "div",
  { class: "app" },
  h("h1", {}, "Hi"), // Text thay đổi!
  h("p", { style: "color:red" }, "World"), // Thêm prop!
  h("span", {}, "New!"), // Thêm element!
);

const rootEl = createElement(oldTree);
document.body.appendChild(rootEl);

const patches = diff(oldTree, newTree);
patch(document.body, {
  type: "UPDATE",
  propPatches: [],
  childPatches: [patches],
});
// → Chỉ cập nhật phần khác biệt! ✅
```

---

## §11. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  Virtual DOM & Diff
  ├── Virtual DOM: JS object tree, nhẹ hơn Real DOM
  ├── JSX → createElement → VDOM → render → Real DOM
  ├── Diff 3 chiến lược: O(n³) → O(n)
  │   ├── Tree Diff: chỉ so cùng level, cross-level = delete + create
  │   ├── Component Diff: khác type = destroy + create, cùng type = update
  │   └── Element Diff: key-based matching, lastIndex tracking
  ├── Key: stable ID > index, tránh random, worst case = move last to first
  ├── Fiber: linked list (child/sibling/return), interruptible, double buffer
  ├── 2 Phases: Render (interruptible) → Commit (synchronous)
  └── Reconciliation: schedule → beginWork → completeWork → commit (mutation, layout, passive)
```

### Checklist

- [ ] **Virtual DOM**: JS object tree mô phỏng Real DOM, so sánh (diff) rồi chỉ patch phần khác biệt
- [ ] **Tại sao VDOM**: không phải "nhanh hơn DOM" mà là **declarative API + predictable + tối thiểu DOM ops**
- [ ] **VNode structure**: `{ type, key, ref, props: { children }, $$typeof: Symbol }`
- [ ] **JSX flow**: JSX → Babel → `createElement()` → VNode → `render()` → Real DOM
- [ ] **$$typeof**: `Symbol(react.element)` → ngăn XSS injection qua JSON (Symbol không serialize)
- [ ] **Diff O(n)**: 3 giả định — cùng level, cùng type, key-based matching → O(n³) → O(n)
- [ ] **Tree Diff**: chỉ so cùng cấp, cross-level move = delete old + create new (MẤT state!)
- [ ] **Component Diff**: khác type = destroy + create (kể cả children giống), cùng type = update props
- [ ] **shouldComponentUpdate / React.memo**: return false → skip TOÀN BỘ subtree diff!
- [ ] **Element Diff 3 ops**: INSERT, MOVE, DELETE, dùng key + lastIndex tracking
- [ ] **lastIndex algorithm**: oldIndex >= lastIndex → no move, < → move, update lastIndex = max
- [ ] **Key worst case**: di chuyển phần tử cuối lên đầu → TẤT CẢ còn lại phải move!
- [ ] **Key rules**: dùng stable ID ✅, KHÔNG dùng index (trừ static list), KHÔNG dùng random ❌
- [ ] **Fiber node**: child / sibling / return (linked list), alternate (double buffer), effectTag
- [ ] **2 phases**: Render (async, interruptible, diff) → Commit (sync, DOM mutation, lifecycle)
- [ ] **Double buffering**: current tree ↔ WIP tree, swap khi commit, reuse fibers (giảm GC)
- [ ] **Render phase lifecycles**: getDerivedStateFromProps, shouldComponentUpdate, render — có thể gọi NHIỀU LẦN!
- [ ] **Commit phase lifecycles**: componentDidMount/DidUpdate/WillUnmount, useLayoutEffect → useEffect
- [ ] **reconcileChildrenArray**: Map(key → Fiber) → duyệt new → match/move/insert → delete remaining

---

_Nguồn: React Virtual DOM & Diff Algorithm Deep Dive_
_Cập nhật lần cuối: Tháng 2, 2026_
