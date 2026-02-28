# React createElement Source Code — Deep Dive!

> **Chủ đề**: Babel Transform → createElement 5 đoạn code → ReactElement → $$typeof Security
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: "React's createElement source code analysis" — Juejin

---

## Mục Lục

1. [§1. Babel Transform — JSX → createElement](#1)
2. [§2. Component + Multi Children Transform](#2)
3. [§3. createElement — Tổng Quan Source Code](#3)
4. [§4. Đoạn 1 — RESERVED_PROPS (key, ref, __self, __source)](#4)
5. [§5. Đoạn 2 — Props Object (loại bỏ reserved!)](#5)
6. [§6. Đoạn 3 — Children (1 vs nhiều!)](#6)
7. [§7. Đoạn 4 — defaultProps](#7)
8. [§8. Đoạn 5 — ReactCurrentOwner](#8)
9. [§9. ReactElement — Trả Về Object!](#9)
10. [§10. $$typeof — REACT_ELEMENT_TYPE + Security!](#10)
11. [§11. ReactSymbols — Tất Cả Types!](#11)
12. [§12. Sơ Đồ Tự Vẽ](#12)
13. [§13. Tự Viết — CreateElementEngine](#13)
14. [§14. Câu Hỏi Luyện Tập](#14)

---

## §1. Babel Transform — JSX → createElement!

```
  BABEL TRANSFORM:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  JSX KHÔNG PHẢI JavaScript hợp lệ!                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Browser KHÔNG hiểu JSX!                          │    │
  │  │ → Cần BABEL transform JSX → JS thuần!              │    │
  │  │ → JSX → React.createElement() calls!               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ — ELEMENT TAG:                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // JSX:                                              │    │
  │  │ <div id="foo">bar</div>                              │    │
  │  │                                                      │    │
  │  │ // Babel transform:                                  │    │
  │  │ React.createElement("div", {id: "foo"}, "bar");     │    │
  │  │                       ↑        ↑           ↑        │    │
  │  │                    type!    config!    children!     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  3 THAM SỐ:                                                   │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① type: loại element!                               │    │
  │  │   → string ("div", "h1"...) = DOM element!         │    │
  │  │   → function/class (Foo, App...) = Component!       │    │
  │  │                                                      │    │
  │  │ ② config: thuộc tính (attributes/props)!           │    │
  │  │   → {id: "foo", className: "bar", onClick: fn}     │    │
  │  │                                                      │    │
  │  │ ③ children: phần tử con (rest parameters)!         │    │
  │  │   → string, number, hoặc React element khác!       │    │
  │  │   → Có thể NHIỀU children!                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Component + Multi Children Transform!

```
  COMPONENT TRANSFORM:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  COMPONENT:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // JSX:                                              │    │
  │  │ function Foo({id}) {                                 │    │
  │  │   return <div id={id}>foo</div>;                     │    │
  │  │ }                                                    │    │
  │  │ <Foo id="foo">                                       │    │
  │  │   <div id="bar">bar</div>                            │    │
  │  │ </Foo>                                               │    │
  │  │                                                      │    │
  │  │ // Babel transform:                                  │    │
  │  │ function Foo({id}) {                                 │    │
  │  │   return React.createElement("div", {id}, "foo");   │    │
  │  │ }                                                    │    │
  │  │ React.createElement(Foo, {id: "foo"},               │    │
  │  │   React.createElement("div", {id: "bar"}, "bar")   │    │
  │  │ );                                                   │    │
  │  │   ↑                                                  │    │
  │  │ type = Foo (BIẾN SỐ! function!)                    │    │
  │  │ → KHÔNG phải string! Là COMPONENT!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  MULTI CHILDREN:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // JSX:                                              │    │
  │  │ <div id="foo">                                       │    │
  │  │   <div id="bar">bar</div>                            │    │
  │  │   <div id="baz">baz</div>                            │    │
  │  │   <div id="qux">qux</div>                            │    │
  │  │ </div>                                               │    │
  │  │                                                      │    │
  │  │ // Babel transform:                                  │    │
  │  │ React.createElement("div", {id: "foo"},             │    │
  │  │   React.createElement("div", {id: "bar"}, "bar"),  │    │
  │  │   React.createElement("div", {id: "baz"}, "baz"),  │    │
  │  │   React.createElement("div", {id: "qux"}, "qux")   │    │
  │  │ );                                                   │    │
  │  │ ↑                                                    │    │
  │  │ Nhiều children → tiếp tục THÊM tham số!           │    │
  │  │ createElement(type, config, child1, child2, child3) │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. createElement — Tổng Quan Source Code!

```
  createElement SOURCE CODE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  FILE LOCATION:                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ packages/react/index.js                              │    │
  │  │   → export {createElement} from './src/React'       │    │
  │  │                                                      │    │
  │  │ packages/react/src/React.js                          │    │
  │  │   → import {createElement} from './ReactElement'    │    │
  │  │   → DEV ? createElementWithValidation              │    │
  │  │         : createElementProd                          │    │
  │  │                                                      │    │
  │  │ packages/react/src/ReactElement.js ★ FINAL!        │    │
  │  │   → export function createElement(type, config,    │    │
  │  │       ...children) { ... }                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SOURCE CODE (SIMPLIFIED):                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const RESERVED_PROPS = {                             │    │
  │  │   key: true, ref: true,                              │    │
  │  │   __self: true, __source: true                       │    │
  │  │ };                                                   │    │
  │  │                                                      │    │
  │  │ function createElement(type, config, ...children) {  │    │
  │  │   const props = {};                                  │    │
  │  │                                                      │    │
  │  │   // Đoạn 1: Tách reserved props!                  │    │
  │  │   let key = '' + config.key;                         │    │
  │  │   let ref = config.ref;                              │    │
  │  │   let self = config.__self;                          │    │
  │  │   let source = config.__source;                      │    │
  │  │                                                      │    │
  │  │   // Đoạn 2: Copy props (loại reserved!)           │    │
  │  │   for (propName in config) {                         │    │
  │  │     if (config.hasOwnProperty(propName)             │    │
  │  │       && !RESERVED_PROPS[propName]) {                │    │
  │  │       props[propName] = config[propName];            │    │
  │  │     }                                                │    │
  │  │   }                                                  │    │
  │  │                                                      │    │
  │  │   // Đoạn 3: Children!                              │    │
  │  │   props.children = children;                         │    │
  │  │                                                      │    │
  │  │   // Đoạn 4: defaultProps!                          │    │
  │  │   if (type && type.defaultProps) { ... }             │    │
  │  │                                                      │    │
  │  │   // Đoạn 5: Return ReactElement!                   │    │
  │  │   return ReactElement(type, key, ref, self,          │    │
  │  │     source, ReactCurrentOwner.current, props);       │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  createElement = PREPROCESSING!                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → KHÔNG tạo DOM!                                    │    │
  │  │ → Chỉ XỬ LÝ và CHUẨN BỊ data!                   │    │
  │  │ → Rồi truyền vào ReactElement → tạo object!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Đoạn 1 — RESERVED_PROPS!

```
  ĐOẠN 1 — RESERVED:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CODE:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ let key = '' + config.key;                           │    │
  │  │ let ref = config.ref;                                │    │
  │  │ let self = config.__self;                            │    │
  │  │ let source = config.__source;                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  4 THUỘC TÍNH ĐẶC BIỆT:                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① key: dùng cho RECONCILIATION!                    │    │
  │  │   → React so sánh key để tối ưu re-render!       │    │
  │  │   → '' + config.key → chuyển thành STRING!        │    │
  │  │                                                      │    │
  │  │ ② ref: dùng để THAM CHIẾU DOM/instance!           │    │
  │  │   → { current: element } hoặc callback!             │    │
  │  │                                                      │    │
  │  │ ③ __self: debug information!                        │    │
  │  │   → = this (context hiện tại!)                     │    │
  │  │   → CHỈ trong DEV mode!                            │    │
  │  │                                                      │    │
  │  │ ④ __source: debug information!                      │    │
  │  │   → { fileName, lineNumber, columnNumber }          │    │
  │  │   → CHỈ trong DEV mode!                            │    │
  │  │   → Giúp hiển thị LỖI chính xác hơn!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  __self VÀ __source TỪ ĐÂU?                                 │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → babel-preset-react INJECT vào!                    │    │
  │  │ → Khi development = true!                           │    │
  │  │                                                      │    │
  │  │ // DEV mode Babel output:                            │    │
  │  │ React.createElement("div", {                         │    │
  │  │   id: "foo",                                         │    │
  │  │   __self: this,           // ★ Babel inject!       │    │
  │  │   __source: {             // ★ Babel inject!       │    │
  │  │     fileName: "/src/index.js",                       │    │
  │  │     lineNumber: 5,                                   │    │
  │  │     columnNumber: 13                                 │    │
  │  │   }                                                  │    │
  │  │ }, "bar");                                           │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Đoạn 2 — Props Object!

```
  ĐOẠN 2 — PROPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CODE:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ for (propName in config) {                           │    │
  │  │   if (config.hasOwnProperty(propName)               │    │
  │  │     && !RESERVED_PROPS.hasOwnProperty(propName)) {  │    │
  │  │     props[propName] = config[propName];              │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LOGIC:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Duyệt TẤT CẢ props trong config!               │    │
  │  │ ② hasOwnProperty: chỉ lấy OWN properties!        │    │
  │  │    → Bỏ qua prototype chain!                       │    │
  │  │ ③ !RESERVED_PROPS: BỎ key, ref, __self, __source! │    │
  │  │ ④ Copy vào props object MỚI!                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ config = {                                           │    │
  │  │   id: "foo",        → ✅ COPY vào props!          │    │
  │  │   className: "bar", → ✅ COPY vào props!          │    │
  │  │   key: "k1",        → ❌ RESERVED! Bỏ qua!       │    │
  │  │   ref: myRef,       → ❌ RESERVED! Bỏ qua!       │    │
  │  │   __self: this,     → ❌ RESERVED! Bỏ qua!       │    │
  │  │   __source: {...}   → ❌ RESERVED! Bỏ qua!       │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ props = { id: "foo", className: "bar" }             │    │
  │  │ → key, ref TÁCH RIÊNG! Không nằm trong props!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  HỆ QUẢ:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → this.props.key = UNDEFINED! ❌                   │    │
  │  │ → this.props.ref = UNDEFINED! ❌                   │    │
  │  │ → key và ref bị LOẠI ra khỏi props!              │    │
  │  │ → React xử lý RIÊNG (internal use!)                │    │
  │  │ → Nếu cần dùng giá trị key: truyền prop khác     │    │
  │  │   cùng value! VD: <Item key={id} itemId={id}/>     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Đoạn 3 — Children!

```
  ĐOẠN 3 — CHILDREN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CODE SIMPLIFIED:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ props.children = children; // ES6 rest params!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SOURCE CODE THẬT (chi tiết hơn):                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const childrenLength = arguments.length - 2;         │    │
  │  │                                                      │    │
  │  │ if (childrenLength === 1) {                          │    │
  │  │   // ★ 1 child → GÁN TRỰC TIẾP (object!)        │    │
  │  │   props.children = children;                         │    │
  │  │ } else if (childrenLength > 1) {                     │    │
  │  │   // ★ Nhiều children → ARRAY!                    │    │
  │  │   const childArray = Array(childrenLength);          │    │
  │  │   for (let i = 0; i < childrenLength; i++) {         │    │
  │  │     childArray[i] = arguments[i + 2];                │    │
  │  │   }                                                  │    │
  │  │   props.children = childArray;                       │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KEY INSIGHT:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ 1 child:     props.children = element (OBJECT!)     │    │
  │  │ Nhiều child: props.children = [el1, el2] (ARRAY!)  │    │
  │  │                                                      │    │
  │  │ VÍ DỤ 1 child:                                      │    │
  │  │ <div>bar</div>                                       │    │
  │  │ → props.children = "bar" (string!)                  │    │
  │  │                                                      │    │
  │  │ VÍ DỤ nhiều children:                               │    │
  │  │ <div>                                                │    │
  │  │   <span>a</span>                                     │    │
  │  │   <span>b</span>                                     │    │
  │  │ </div>                                               │    │
  │  │ → props.children = [spanA, spanB] (array!)          │    │
  │  │                                                      │    │
  │  │ ★ Đây là lý do typeof children có thể object      │    │
  │  │   HOẶC array!                                        │    │
  │  │ ★ React.Children.map() xử lý cả 2 trường hợp!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Đoạn 4 — defaultProps!

```
  ĐOẠN 4 — defaultProps:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CODE:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ if (type && type.defaultProps) {                      │    │
  │  │   const defaultProps = type.defaultProps;             │    │
  │  │   for (propName in defaultProps) {                    │    │
  │  │     if (props[propName] === undefined) {              │    │
  │  │       props[propName] = defaultProps[propName];       │    │
  │  │     }                                                │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  LOGIC:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① type có defaultProps? (chỉ component có!)        │    │
  │  │ ② Duyệt từng default prop!                         │    │
  │  │ ③ Nếu prop === undefined → dùng DEFAULT!          │    │
  │  │ ④ Nếu prop có giá trị → GIỮ NGUYÊN (user wins!)  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  VÍ DỤ:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Function component:                               │    │
  │  │ function Foo({id}) {                                 │    │
  │  │   return <div id={id}>foo</div>;                     │    │
  │  │ }                                                    │    │
  │  │ Foo.defaultProps = { id: 'default-id' };             │    │
  │  │                                                      │    │
  │  │ // Class component:                                  │    │
  │  │ class Bar extends Component {                        │    │
  │  │   static defaultProps = { id: 'default-id' };       │    │
  │  │   render() { return <div>{this.props.id}</div>; }   │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ <Foo />          → id = 'default-id' (default!)     │    │
  │  │ <Foo id="custom"/> → id = 'custom' (user wins!)    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CHÚ Ý:                                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → CHỈ check === undefined!                          │    │
  │  │ → null ≠ undefined! null SẼ KHÔNG dùng default!   │    │
  │  │ → <Foo id={null}/> → id = null (KHÔNG default!)   │    │
  │  │ → type = "div" → KHÔNG có defaultProps → skip!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Đoạn 5 — ReactCurrentOwner!

```
  ĐOẠN 5 — OWNER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CODE:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ return ReactElement(                                 │    │
  │  │   type,                                              │    │
  │  │   key,                                               │    │
  │  │   ref,                                               │    │
  │  │   self,                                              │    │
  │  │   source,                                            │    │
  │  │   ReactCurrentOwner.current, // ★ OWNER!          │    │
  │  │   props                                              │    │
  │  │ );                                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ReactCurrentOwner:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // packages/react/src/ReactCurrentOwner.js          │    │
  │  │ const ReactCurrentOwner = {                          │    │
  │  │   current: null  // ★ ban đầu = null!             │    │
  │  │ };                                                   │    │
  │  │                                                      │    │
  │  │ GIẢI THÍCH:                                          │    │
  │  │ → "Owner" = component ĐANG ĐƯỢC XÂY DỰNG!        │    │
  │  │ → Khi React render component A:                     │    │
  │  │   ReactCurrentOwner.current = A (fiber!)            │    │
  │  │ → Các element được tạo TRONG A:                    │    │
  │  │   element._owner = A                                │    │
  │  │ → Sau khi render xong:                              │    │
  │  │   ReactCurrentOwner.current = null                   │    │
  │  │                                                      │    │
  │  │ → Dùng để TRACK ai tạo element nào!               │    │
  │  │ → Debug: "This element was created by component X" │    │
  │  │ → = BIẾN TẠM ghi nhận context hiện tại!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. ReactElement — Trả Về Object!

```
  ReactElement:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  SOURCE CODE:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const ReactElement = function(                       │    │
  │  │   type, key, ref, self, source, owner, props         │    │
  │  │ ) {                                                  │    │
  │  │   const element = {                                  │    │
  │  │     // ★ Marker: đây là React Element!             │    │
  │  │     $$typeof: REACT_ELEMENT_TYPE,                    │    │
  │  │                                                      │    │
  │  │     // Built-in properties:                          │    │
  │  │     type: type,                                      │    │
  │  │     key: key,                                        │    │
  │  │     ref: ref,                                        │    │
  │  │     props: props,                                    │    │
  │  │                                                      │    │
  │  │     // Component tạo element này:                   │    │
  │  │     _owner: owner                                    │    │
  │  │   };                                                 │    │
  │  │                                                      │    │
  │  │   return element;                                    │    │
  │  │ };                                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KẾT QUẢ CUỐI CÙNG:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ <div id="foo">bar</div>                              │    │
  │  │                                                      │    │
  │  │ = {                                                  │    │
  │  │     $$typeof: Symbol(react.element),                 │    │
  │  │     type: "div",                                     │    │
  │  │     key: null,                                       │    │
  │  │     ref: null,                                       │    │
  │  │     props: {                                         │    │
  │  │       id: "foo",                                     │    │
  │  │       children: "bar"                                │    │
  │  │     },                                               │    │
  │  │     _owner: null                                     │    │
  │  │   }                                                  │    │
  │  │                                                      │    │
  │  │ ★ CHỈ LÀ PLAIN OBJECT!                             │    │
  │  │ ★ Mô tả UI, KHÔNG PHẢI DOM thật!                  │    │
  │  │ ★ React dùng object này để build + update DOM!     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. $$typeof — Security!

```
  $$typeof SECURITY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  $$typeof LÀ GÌ?                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ $$typeof = Symbol.for('react.element')               │    │
  │  │                                                      │    │
  │  │ → UNIQUE constant!                                  │    │
  │  │ → Xác định: "Đây là React Element!"               │    │
  │  │ → Symbol KHÔNG thể fake từ JSON!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO CẦN?                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ XSS ATTACK SCENARIO:                                 │    │
  │  │                                                      │    │
  │  │ // Server cho phép user lưu JSON:                   │    │
  │  │ let serverData = {                                   │    │
  │  │   type: 'div',                                       │    │
  │  │   props: {                                           │    │
  │  │     dangerouslySetInnerHTML: {                       │    │
  │  │       __html: '/* MALICIOUS CODE! */'               │    │
  │  │     }                                                │    │
  │  │   }                                                  │    │
  │  │ };                                                   │    │
  │  │                                                      │    │
  │  │ // Nếu React render object này:                     │    │
  │  │ <p>{serverData}</p>                                  │    │
  │  │ → XSS! Malicious code executed! ❌                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH $$typeof BẢO VỆ:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → JSON KHÔNG hỗ trợ Symbol!                       │    │
  │  │ → Server data: { type:'div', props:{...} }          │    │
  │  │ → THIẾU $$typeof! (JSON không có Symbol!)          │    │
  │  │ → React check: element.$$typeof === REACT_ELEMENT?  │    │
  │  │ → KHÔNG CÓ! → REFUSE to render! ✅               │    │
  │  │                                                      │    │
  │  │ → Attacker KHÔNG THỂ inject Symbol qua JSON!      │    │
  │  │ → Symbol.for('react.element') là JS-ONLY!          │    │
  │  │ → Server response KHÔNG THỂ chứa Symbol!          │    │
  │  │ → → SAFE! Ngăn chặn XSS! ✅                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. ReactSymbols — Tất Cả Types!

```
  REACT SYMBOLS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  packages/shared/ReactSymbols.js:                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ REACT_ELEMENT_TYPE   = Symbol.for('react.element')  │    │
  │  │ REACT_PORTAL_TYPE    = Symbol.for('react.portal')   │    │
  │  │ REACT_FRAGMENT_TYPE  = Symbol.for('react.fragment') │    │
  │  │ REACT_STRICT_MODE    = Symbol.for('react.strict_m') │    │
  │  │ REACT_PROFILER_TYPE  = Symbol.for('react.profiler') │    │
  │  │ REACT_PROVIDER_TYPE  = Symbol.for('react.provider') │    │
  │  │ REACT_CONTEXT_TYPE   = Symbol.for('react.context')  │    │
  │  │ REACT_FORWARD_REF    = Symbol.for('react.fwd_ref')  │    │
  │  │ REACT_SUSPENSE_TYPE  = Symbol.for('react.suspense') │    │
  │  │ REACT_MEMO_TYPE      = Symbol.for('react.memo')     │    │
  │  │ REACT_LAZY_TYPE      = Symbol.for('react.lazy')     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  $$typeof VỚI CÁC LOẠI:                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Portal:                                              │    │
  │  │ → createPortal() → $$typeof = REACT_PORTAL_TYPE!  │    │
  │  │ → KHÔNG qua createElement!                          │    │
  │  │ → Có API riêng!                                     │    │
  │  │                                                      │    │
  │  │ Fragment:                                            │    │
  │  │ → <React.Fragment> → createElement(Fragment, ...)  │    │
  │  │ → $$typeof = REACT_ELEMENT_TYPE! (vẫn element!)   │    │
  │  │ → type = REACT_FRAGMENT_TYPE!                       │    │
  │  │ → Fragment ĐI QUA createElement → element!         │    │
  │  │                                                      │    │
  │  │ ★ Portal: $$typeof = PORTAL (API riêng!)           │    │
  │  │ ★ Fragment: $$typeof = ELEMENT, type = FRAGMENT!   │    │
  │  │ → Khác nhau vì CÁC CÓ API TẠO KHÁC NHAU!       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §12. Sơ Đồ Tự Vẽ!

### Sơ Đồ 1: JSX → Babel → createElement → Object

```
  JSX TRANSFORM PIPELINE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① JSX                                                       │
  │  ┌────────────────────┐                                      │
  │  │ <div id="foo">     │                                      │
  │  │   bar              │                                      │
  │  │ </div>             │                                      │
  │  └────────┬───────────┘                                      │
  │           │ Babel                                             │
  │           ↓                                                   │
  │  ② createElement                                              │
  │  ┌────────────────────────────────────────┐                  │
  │  │ React.createElement("div",{id:"foo"}, │                  │
  │  │   "bar")                               │                  │
  │  └────────┬───────────────────────────────┘                  │
  │           │ execute                                           │
  │           ↓                                                   │
  │  ③ PREPROCESSING (5 đoạn code!)                              │
  │  ┌────────────────────────────────────────┐                  │
  │  │ Đoạn 1: Tách key, ref, __self, __src │                  │
  │  │ Đoạn 2: Copy props (loại reserved!)  │                  │
  │  │ Đoạn 3: Xử lý children              │                  │
  │  │ Đoạn 4: Apply defaultProps           │                  │
  │  │ Đoạn 5: Gọi ReactElement()          │                  │
  │  └────────┬───────────────────────────────┘                  │
  │           │                                                   │
  │           ↓                                                   │
  │  ④ ReactElement OBJECT                                        │
  │  ┌────────────────────────────────────────┐                  │
  │  │ {                                      │                  │
  │  │   $$typeof: Symbol(react.element),     │                  │
  │  │   type: "div",                         │                  │
  │  │   key: null,                           │                  │
  │  │   ref: null,                           │                  │
  │  │   props: { id: "foo", children: "bar" }│                  │
  │  │   _owner: null                         │                  │
  │  │ }                                      │                  │
  │  └────────────────────────────────────────┘                  │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: createElement 5 Đoạn Code

```
  createElement INTERNALS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  INPUT: (type, config, ...children)                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ type = "div" | Foo | MyClass                        │    │
  │  │ config = {id:"foo", key:"k1", ref:myRef, ...}      │    │
  │  │ children = ["bar"] | [el1, el2, el3]                │    │
  │  └──────────┬─────────────────────────────────────────┘    │
  │             │                                                │
  │             ↓                                                │
  │  ┌──── ĐOẠN 1 ────────────────────┐                        │
  │  │ key = config.key     (tách!)   │                        │
  │  │ ref = config.ref     (tách!)   │                        │
  │  │ __self = config.__self (debug!)│                        │
  │  │ __source = config.__source     │                        │
  │  └──────────┬─────────────────────┘                        │
  │             ↓                                                │
  │  ┌──── ĐOẠN 2 ────────────────────┐                        │
  │  │ props = {}                      │                        │
  │  │ for (prop in config):          │                        │
  │  │   if !RESERVED → copy!        │                        │
  │  │ → props = {id:"foo"} ✅       │                        │
  │  │ → key, ref BỊ LOẠI!  ❌       │                        │
  │  └──────────┬─────────────────────┘                        │
  │             ↓                                                │
  │  ┌──── ĐOẠN 3 ────────────────────┐                        │
  │  │ 1 child → props.children = el │                        │
  │  │ N child → props.children = [] │                        │
  │  └──────────┬─────────────────────┘                        │
  │             ↓                                                │
  │  ┌──── ĐOẠN 4 ────────────────────┐                        │
  │  │ type.defaultProps?             │                        │
  │  │ → undefined props = default!  │                        │
  │  └──────────┬─────────────────────┘                        │
  │             ↓                                                │
  │  ┌──── ĐOẠN 5 ────────────────────┐                        │
  │  │ return ReactElement(           │                        │
  │  │   type, key, ref, self,        │                        │
  │  │   source, owner, props)        │                        │
  │  └────────────────────────────────┘                        │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 3: RESERVED_PROPS Filter

```
  RESERVED PROPS FILTER:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  config = {                                                  │
  │    id: "foo",        ─────→ props.id = "foo"     ✅         │
  │    className: "bar", ─────→ props.className = "bar" ✅      │
  │    onClick: fn,      ─────→ props.onClick = fn   ✅         │
  │    key: "k1",        ─────→ key = "k1"      (TÁCH RIÊNG!)  │
  │    ref: myRef,       ─────→ ref = myRef      (TÁCH RIÊNG!) │
  │    __self: this,     ─────→ self = this      (DEBUG!)       │
  │    __source: {...},  ─────→ source = {...}   (DEBUG!)       │
  │  }                                                           │
  │                                                              │
  │  KẾT QUẢ:                                                    │
  │  ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
  │  │ props =      │ │ key =    │ │ ref =    │ │ debug =  │  │
  │  │ { id, class, │ │ "k1"     │ │ myRef    │ │ self,    │  │
  │  │   onClick }  │ │          │ │          │ │ source   │  │
  │  └──────────────┘ └──────────┘ └──────────┘ └──────────┘  │
  │  → User KHÔNG thể this.props.key! ❌                       │
  │  → User KHÔNG thể this.props.ref! ❌                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 4: Children — 1 vs Nhiều

```
  CHILDREN HANDLING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  1 CHILD:                                                     │
  │  ┌──────────────────────┐    ┌──────────────────────┐        │
  │  │ <div>bar</div>       │ →  │ props.children =     │        │
  │  │                      │    │   "bar"              │        │
  │  │ <div>               │    │   (OBJECT/STRING!)   │        │
  │  │   <span>hi</span>  │ →  │ props.children =     │        │
  │  │ </div>              │    │   {type:'span',...}   │        │
  │  └──────────────────────┘    │   (OBJECT!)          │        │
  │                              └──────────────────────┘        │
  │                                                              │
  │  NHIỀU CHILDREN:                                              │
  │  ┌──────────────────────┐    ┌──────────────────────┐        │
  │  │ <div>               │    │ props.children = [    │        │
  │  │   <span>a</span>   │ →  │   {type:'span',...},  │        │
  │  │   <span>b</span>   │    │   {type:'span',...},  │        │
  │  │   <span>c</span>   │    │   {type:'span',...}   │        │
  │  │ </div>              │    │ ]                     │        │
  │  └──────────────────────┘    │ (ARRAY!)             │        │
  │                              └──────────────────────┘        │
  │                                                              │
  │  → 1 child: children = object/string                        │
  │  → N children: children = array!                            │
  │  → React.Children API xử lý CẢ 2!                         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 5: $$typeof Security

```
  $$typeof SECURITY:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ATTACKER:                                                    │
  │  ┌─────────────────────────────────────────────┐             │
  │  │ Server trả về JSON:                         │             │
  │  │ {                                           │             │
  │  │   type: 'div',                              │             │
  │  │   props: {                                  │             │
  │  │     dangerouslySetInnerHTML: {               │             │
  │  │       __html: '<script>alert("XSS")</script>'│            │
  │  │     }                                       │             │
  │  │   }                                         │             │
  │  │ }                                           │             │
  │  │ ❌ KHÔNG CÓ $$typeof! (JSON ≠ Symbol!)    │             │
  │  └─────────────────────────────────────────────┘             │
  │         ↓                                                    │
  │  ┌─────────────────────────────────────────────┐             │
  │  │ React check:                                │             │
  │  │ element.$$typeof === Symbol(react.element)? │             │
  │  │                                             │             │
  │  │ undefined !== Symbol(react.element)         │             │
  │  │ → REFUSE TO RENDER! ✅ SAFE!              │             │
  │  └─────────────────────────────────────────────┘             │
  │                                                              │
  │  REACT ELEMENT (hợp lệ):                                    │
  │  ┌─────────────────────────────────────────────┐             │
  │  │ {                                           │             │
  │  │   $$typeof: Symbol(react.element), ✅       │             │
  │  │   type: 'div',                             │             │
  │  │   props: { children: 'safe' }               │             │
  │  │ }                                           │             │
  │  │ → $$typeof MATCH! → RENDER! ✅            │             │
  │  └─────────────────────────────────────────────┘             │
  │                                                              │
  │  ★ Symbol KHÔNG serialize được!                             │
  │  ★ JSON.stringify(Symbol) = undefined!                       │
  │  ★ JSON.parse KHÔNG tạo được Symbol!                       │
  │  ★ → Attacker KHÔNG THỂ fake $$typeof! ✅                 │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 6: Portal vs Fragment $$typeof

```
  PORTAL vs FRAGMENT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Portal:                                                      │
  │  ┌────────────────────────────────────────────┐              │
  │  │ createPortal(<div/>, container)            │              │
  │  │   ↓ API RIÊNG (KHÔNG qua createElement!)  │              │
  │  │ {                                          │              │
  │  │   $$typeof: Symbol(react.portal), ★       │              │
  │  │   children: ...,                            │              │
  │  │   containerInfo: container                  │              │
  │  │ }                                          │              │
  │  └────────────────────────────────────────────┘              │
  │                                                              │
  │  Fragment:                                                    │
  │  ┌────────────────────────────────────────────┐              │
  │  │ <React.Fragment><div/></React.Fragment>     │              │
  │  │   ↓ createElement(Fragment, null, ...)     │              │
  │  │ {                                          │              │
  │  │   $$typeof: Symbol(react.element), ★       │              │
  │  │   type: Symbol(react.fragment),    ★       │              │
  │  │   props: { children: ... }                  │              │
  │  │ }                                          │              │
  │  └────────────────────────────────────────────┘              │
  │                                                              │
  │  ★ Portal: $$typeof = PORTAL! (API riêng!)                  │
  │  ★ Fragment: $$typeof = ELEMENT! type = FRAGMENT!            │
  │  → Fragment ĐI QUA createElement → ELEMENT!                │
  │  → Portal CÓ API RIÊNG → PORTAL!                           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §13. Tự Viết — CreateElementEngine!

```javascript
/**
 * CreateElementEngine — Mô phỏng React.createElement!
 * Tự viết bằng tay, KHÔNG dùng thư viện!
 */
var CreateElementEngine = (function () {

  var log = [];
  function reset() { log = []; }

  // ═══════════════════════════════════
  // 1. SYMBOL TYPES
  // ═══════════════════════════════════
  var REACT_ELEMENT_TYPE = 'Symbol(react.element)';
  var REACT_PORTAL_TYPE = 'Symbol(react.portal)';
  var REACT_FRAGMENT_TYPE = 'Symbol(react.fragment)';

  var RESERVED_PROPS = {
    key: true,
    ref: true,
    __self: true,
    __source: true
  };

  // ═══════════════════════════════════
  // 2. ReactCurrentOwner
  // ═══════════════════════════════════
  var ReactCurrentOwner = {
    current: null
  };

  // ═══════════════════════════════════
  // 3. ReactElement — Tạo Object!
  // ═══════════════════════════════════
  function ReactElement(type, key, ref, self, source, owner, props) {
    var element = {
      '$$typeof': REACT_ELEMENT_TYPE,
      type: type,
      key: key,
      ref: ref,
      props: props,
      _owner: owner
    };
    log.push('[ReactElement] Created: type=' +
      (typeof type === 'function' ? type.name : type));
    return element;
  }

  // ═══════════════════════════════════
  // 4. createElement — 5 Đoạn Code!
  // ═══════════════════════════════════
  function createElement(type, config) {
    var propName;
    var props = {};
    var key = null;
    var ref = null;
    var self = null;
    var source = null;

    // ── ĐOẠN 1: Tách RESERVED ──
    if (config != null) {
      if (config.key !== undefined) {
        key = '' + config.key;
        log.push('[Đoạn 1] key = "' + key + '" (tách!)');
      }
      if (config.ref !== undefined) {
        ref = config.ref;
        log.push('[Đoạn 1] ref = ' + ref + ' (tách!)');
      }
      if (config.__self !== undefined) {
        self = config.__self;
        log.push('[Đoạn 1] __self = ' + self + ' (debug!)');
      }
      if (config.__source !== undefined) {
        source = config.__source;
        log.push('[Đoạn 1] __source = ' +
          JSON.stringify(source) + ' (debug!)');
      }

      // ── ĐOẠN 2: Copy props (loại reserved!) ──
      for (propName in config) {
        if (config.hasOwnProperty(propName) &&
          !RESERVED_PROPS.hasOwnProperty(propName)) {
          props[propName] = config[propName];
          log.push('[Đoạn 2] props.' + propName +
            ' = ' + config[propName] + ' ✅');
        }
      }
    }

    // ── ĐOẠN 3: Children! ──
    var childrenLength = arguments.length - 2;
    if (childrenLength === 1) {
      props.children = arguments[2];
      log.push('[Đoạn 3] 1 child → props.children = ' +
        (typeof props.children === 'object' ?
          'Element' : '"' + props.children + '"'));
    } else if (childrenLength > 1) {
      var childArray = [];
      for (var i = 0; i < childrenLength; i++) {
        childArray.push(arguments[i + 2]);
      }
      props.children = childArray;
      log.push('[Đoạn 3] ' + childrenLength +
        ' children → props.children = Array(' +
        childrenLength + ')!');
    }

    // ── ĐOẠN 4: defaultProps! ──
    if (type && type.defaultProps) {
      var defaultProps = type.defaultProps;
      for (propName in defaultProps) {
        if (props[propName] === undefined) {
          props[propName] = defaultProps[propName];
          log.push('[Đoạn 4] defaultProps.' + propName +
            ' = ' + defaultProps[propName] + ' (applied!)');
        }
      }
    }

    // ── ĐOẠN 5: Return ReactElement! ──
    log.push('[Đoạn 5] → ReactElement()!');
    return ReactElement(
      type, key, ref, self, source,
      ReactCurrentOwner.current, props
    );
  }

  // ═══════════════════════════════════
  // 5. createPortal (API Riêng!)
  // ═══════════════════════════════════
  function createPortal(children, container) {
    var portal = {
      '$$typeof': REACT_PORTAL_TYPE,
      children: children,
      containerInfo: container
    };
    log.push('[createPortal] $$typeof = ' + REACT_PORTAL_TYPE);
    return portal;
  }

  // ═══════════════════════════════════
  // 6. SECURITY CHECK
  // ═══════════════════════════════════
  function isValidElement(object) {
    return (
      typeof object === 'object' &&
      object !== null &&
      object['$$typeof'] === REACT_ELEMENT_TYPE
    );
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  createElement ENGINE — DEMO                ║');
    console.log('╚═══════════════════════════════════════════╝');

    // 1. Simple element
    console.log('\n--- 1. SIMPLE ELEMENT ---');
    reset();
    var el1 = createElement('div', {id: 'foo'}, 'bar');
    log.forEach(function (l) { console.log('  ' + l); });
    console.log('  Result:', JSON.stringify(el1, null, 2));

    // 2. Reserved props
    console.log('\n--- 2. RESERVED PROPS ---');
    reset();
    var el2 = createElement('div', {
      id: 'foo', key: 'k1', ref: 'myRef',
      __self: 'this', __source: {file:'index.js', line:5}
    }, 'bar');
    log.forEach(function (l) { console.log('  ' + l); });
    console.log('  props.key =', el2.props.key); // undefined!
    console.log('  props.ref =', el2.props.ref); // undefined!
    console.log('  element.key =', el2.key); // "k1"!

    // 3. Multiple children
    console.log('\n--- 3. MULTIPLE CHILDREN ---');
    reset();
    var el3 = createElement('div', {id: 'parent'},
      createElement('span', null, 'a'),
      createElement('span', null, 'b'),
      createElement('span', null, 'c')
    );
    log.forEach(function (l) { console.log('  ' + l); });

    // 4. Component with defaultProps
    console.log('\n--- 4. COMPONENT + defaultProps ---');
    reset();
    function Foo(props) {
      return createElement('div', {id: props.id}, 'foo');
    }
    Foo.defaultProps = { id: 'default-id', color: 'blue' };
    var el4 = createElement(Foo, {id: 'custom-id'});
    log.forEach(function (l) { console.log('  ' + l); });

    // 5. Security
    console.log('\n--- 5. $$typeof SECURITY ---');
    reset();
    var safeElement = createElement('div', null, 'safe');
    var fakeElement = {type: 'div', props: {children: 'fake'}};
    log.push('isValidElement(safeElement) = ' +
      isValidElement(safeElement) + ' ✅');
    log.push('isValidElement(fakeElement) = ' +
      isValidElement(fakeElement) + ' ❌ NO $$typeof!');
    log.forEach(function (l) { console.log('  ' + l); });

    // 6. Portal vs Fragment
    console.log('\n--- 6. PORTAL vs FRAGMENT ---');
    reset();
    var portal = createPortal(
      createElement('div', null, 'portal-content'),
      'root2-container'
    );
    log.push('Portal.$$typeof = ' + portal['$$typeof']);

    var fragment = createElement(REACT_FRAGMENT_TYPE, null,
      createElement('div', null, 'fragment-child'));
    log.push('Fragment.$$typeof = ' + fragment['$$typeof']);
    log.push('Fragment.type = ' + fragment.type);
    log.push('→ Portal: $$typeof = PORTAL (API riêng!)');
    log.push('→ Fragment: $$typeof = ELEMENT, type = FRAGMENT!');
    log.forEach(function (l) { console.log('  ' + l); });

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                           ║');
    console.log('╚═══════════════════════════════════════════╝');
  }

  return {
    createElement: createElement,
    createPortal: createPortal,
    isValidElement: isValidElement,
    demo: demo, reset: reset
  };
})();

// Chạy: CreateElementEngine.demo();
```

---

## §14. Câu Hỏi Luyện Tập!

### ❓ Câu 1: Babel transform JSX thành gì?

**Trả lời:**

```
JSX:       <div id="foo">bar</div>
Babel →:   React.createElement("div", {id:"foo"}, "bar")
           ↑                    ↑        ↑          ↑
      function call         type!    config!   children!
```

- 3 tham số: **type** (string/function), **config** (attributes), **children** (rest params)!
- Component: `<Foo id="x"/>` → `createElement(Foo, {id:"x"})` — type là **BIẾN SỐ**!
- Nhiều children: tiếp tục **thêm tham số** sau config!

### ❓ Câu 2: RESERVED_PROPS gồm những gì? Tại sao?

**Trả lời:**

4 reserved props: **key**, **ref**, **__self**, **__source**

- **key**: dùng cho reconciliation → React xử lý RIÊNG!
- **ref**: dùng truy cập DOM/instance → React xử lý RIÊNG!
- **__self**: debug info (this context) → Babel inject DEV!
- **__source**: debug info (fileName, line, column) → Babel inject DEV!

**Hệ quả**: `this.props.key` = undefined! `this.props.ref` = undefined!
Bị LOẠI khỏi props → React dùng INTERNAL, user KHÔNG truy cập được qua props!

### ❓ Câu 3: children xử lý như thế nào?

**Trả lời:**

- **1 child**: `props.children = element` (OBJECT hoặc STRING!)
- **Nhiều children**: `props.children = [el1, el2, ...]` (ARRAY!)
- Source code dùng `arguments.length - 2` để tính số children!
- `React.Children.map()` xử lý **CẢ 2** trường hợp (object và array)!

### ❓ Câu 4: defaultProps hoạt động thế nào?

**Trả lời:**

```javascript
if (type && type.defaultProps) {
  for (propName in type.defaultProps) {
    if (props[propName] === undefined) {  // ★ check undefined!
      props[propName] = type.defaultProps[propName];
    }
  }
}
```

- Chỉ **component** (function/class) có defaultProps!
- CHỈ apply khi prop === `undefined` (KHÔNG phải null!)
- `<Foo />` → id = default! | `<Foo id="x"/>` → id = "x" (user wins!)
- `<Foo id={null}/>` → id = null (KHÔNG dùng default! null ≠ undefined!)

### ❓ Câu 5: ReactElement trả về cấu trúc gì?

**Trả lời:**

```javascript
{
  $$typeof: Symbol(react.element), // marker!
  type: "div" | Foo,               // DOM hoặc component!
  key: null | "k1",                // reconciliation!
  ref: null | {current: ...},      // tham chiếu!
  props: { id: "foo", children: "bar" }, // properties!
  _owner: null | Fiber              // component tạo element!
}
```

- **PLAIN OBJECT** — chỉ là MÔ TẢ, KHÔNG phải DOM!
- React dùng object này để **BUILD + UPDATE DOM** thật!

### ❓ Câu 6: $$typeof giải quyết vấn đề security gì?

**Trả lời:**

**XSS Attack**: Server trả về JSON giả dạng React element:
```javascript
{ type: 'div', props: { dangerouslySetInnerHTML: { __html: '...' } } }
```
→ Nếu React render → **XSS!** Malicious code executed!

**$$typeof BẢO VỆ**:
- `$$typeof = Symbol.for('react.element')`
- **Symbol KHÔNG serialize được** → JSON response **KHÔNG CÓ** Symbol!
- React check `element.$$typeof === Symbol(react.element)`
- Server data **THIẾU $$typeof** → React **REFUSE to render!** ✅

### ❓ Câu 7: Portal vs Fragment — $$typeof khác nhau thế nào?

**Trả lời:**

| | Portal | Fragment |
|---|---|---|
| **API** | `createPortal()` | `createElement(Fragment)` |
| **$$typeof** | `Symbol(react.portal)` | `Symbol(react.element)` |
| **type** | N/A | `Symbol(react.fragment)` |

- **Portal**: API RIÊNG → `$$typeof` = PORTAL_TYPE!
- **Fragment**: đi QUA `createElement` → `$$typeof` = ELEMENT_TYPE, nhưng `type` = FRAGMENT_TYPE!
- **Lý do**: createElement **KHÔNG xử lý đặc biệt** $$typeof → luôn = ELEMENT_TYPE!
- Portal có API riêng (`createPortal`) nên tạo $$typeof **khác**!

---

> 🎯 **Tổng kết React createElement Source Code:**
> - **JSX → Babel → createElement()** → 3 tham số: type, config, ...children!
> - **createElement = PREPROCESSING** — 5 đoạn code xử lý data!
> - **Đoạn 1**: Tách RESERVED: key, ref, __self, __source!
> - **Đoạn 2**: Copy props, LOẠI reserved! (this.props.key = undefined!)
> - **Đoạn 3**: Children: 1 = object, nhiều = array!
> - **Đoạn 4**: defaultProps: undefined → dùng default, null → giữ null!
> - **Đoạn 5**: ReactElement() → `{ $$typeof, type, key, ref, props, _owner }`!
> - **$$typeof = Symbol(react.element)** — SECURITY: JSON không có Symbol → chặn XSS!
> - **Portal**: $$typeof = PORTAL (API riêng!) vs **Fragment**: $$typeof = ELEMENT, type = FRAGMENT!
> - **CreateElementEngine** tự viết: 5 đoạn code, security check, portal vs fragment!
> - **7 câu hỏi** luyện tập với đáp án chi tiết!
