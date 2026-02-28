# React Refs & forwardRef — Deep Dive!

> **Chủ đề**: 3 cách dùng Ref → 2 mục đích → forwardRef → Ref Forwarding → Source Code
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: "The use of Refs in React and a source code analysis of forwardRef" — Juejin

---

## Mục Lục

1. [§1. Tổng Quan — Refs Là Gì?](#1)
2. [§2. String Refs — Cách 1 (Deprecated!)](#2)
3. [§3. Callback Refs — Cách 2](#3)
4. [§4. createRef — Cách 3 (Recommended!)](#4)
5. [§5. 2 Mục Đích — DOM Node + Component Instance](#5)
6. [§6. Function Component + Ref = LỖI!](#6)
7. [§7. forwardRef — Ref Forwarding!](#7)
8. [§8. HOC + forwardRef](#8)
9. [§9. Source Code — createRef](#9)
10. [§10. Source Code — forwardRef](#10)
11. [§11. React Element Structure — $$typeof](#11)
12. [§12. Sơ Đồ Tự Vẽ](#12)
13. [§13. Tự Viết — RefsEngine](#13)
14. [§14. Câu Hỏi Luyện Tập](#14)

---

## §1. Tổng Quan — Refs Là Gì?

```
  REACT REFS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Refs = REFERENCES (tham chiếu!)                      │    │
  │  │ → Truy cập DOM nodes THẬT!                         │    │
  │  │ → Truy cập React component INSTANCES!              │    │
  │  │ → Được tạo trong render method!                    │    │
  │  │                                                      │    │
  │  │ React = declarative (khai báo, không thao tác DOM!) │    │
  │  │ Refs = "cửa thoát" để IMPERATIVE (thao tác trực   │    │
  │  │ tiếp) khi cần!                                      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  3 CÁCH TẠO REF:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① String Refs ── ref="myInput"                     │    │
  │  │   → this.refs.myInput                               │    │
  │  │   → ⚠️ DEPRECATED! Không nên dùng!                │    │
  │  │                                                      │    │
  │  │ ② Callback Refs ── ref={(el) => this.myInput = el} │    │
  │  │   → this.myInput                                    │    │
  │  │   → Linh hoạt, kiểm soát khi nào gán/hủy!       │    │
  │  │                                                      │    │
  │  │ ③ createRef ── this.myRef = React.createRef()      │    │
  │  │   → this.myRef.current                              │    │
  │  │   → ✅ RECOMMENDED! API rõ ràng nhất!             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  2 MỤC ĐÍCH:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Truy cập DOM NODE thật!                          │    │
  │  │   → focus(), blur(), scroll(), measure size...     │    │
  │  │   → Animation, video play/pause...                  │    │
  │  │                                                      │    │
  │  │ ② Truy cập CLASS COMPONENT INSTANCE!               │    │
  │  │   → Gọi instance method! (handleFocus...)          │    │
  │  │   → Force animation, trigger action...              │    │
  │  │   → ⚠️ CHỈ class component! KHÔNG function!      │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. String Refs — Cách 1 (Deprecated!)

```
  STRING REFS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CODE:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ class App extends React.Component {                  │    │
  │  │   componentDidMount() {                              │    │
  │  │     setTimeout(() => {                               │    │
  │  │       // ② Truy cập qua this.refs.xxx!             │    │
  │  │       this.refs.textInput.value = 'new value';      │    │
  │  │     }, 2000);                                        │    │
  │  │   }                                                  │    │
  │  │                                                      │    │
  │  │   render() {                                         │    │
  │  │     // ① ref = "string"!                           │    │
  │  │     return <input ref="textInput" value="value" />;  │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CƠ CHẾ:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → ref="textInput" → React gán DOM vào             │    │
  │  │   this.refs.textInput!                               │    │
  │  │ → this.refs = { textInput: <input DOM> }            │    │
  │  │ → Truy cập: this.refs.textInput                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO DEPRECATED? ⚠️                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Performance issues — React KHÔNG thể tối ưu!   │    │
  │  │ ② String refs KHÔNG composable!                    │    │
  │  │ ③ KHÔNG hoạt động với render callbacks!            │    │
  │  │ ④ this.refs là string-keyed → khó type-check!    │    │
  │  │ ⑤ React team khuyến cáo dùng createRef thay thế! │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Callback Refs — Cách 2!

```
  CALLBACK REFS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CODE:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ class App extends React.Component {                  │    │
  │  │   componentDidMount() {                              │    │
  │  │     setTimeout(() => {                               │    │
  │  │       // ② Truy cập qua instance property!         │    │
  │  │       this.textInput.value = 'new value';            │    │
  │  │     }, 2000);                                        │    │
  │  │   }                                                  │    │
  │  │                                                      │    │
  │  │   render() {                                         │    │
  │  │     // ① ref = callback function!                   │    │
  │  │     // Tham số element = DOM node hoặc              │    │
  │  │     // component instance                            │    │
  │  │     return (                                         │    │
  │  │       <input                                         │    │
  │  │         ref={(element) => {                          │    │
  │  │           this.textInput = element;                  │    │
  │  │         }}                                           │    │
  │  │         value="value"                                │    │
  │  │       />                                             │    │
  │  │     );                                               │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CƠ CHẾ:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → ref={(el) => this.textInput = el}                 │    │
  │  │ → React GỌI callback VỚI DOM element!             │    │
  │  │ → Mount: callback(element) → gán!                  │    │
  │  │ → Unmount: callback(null) → hủy!                   │    │
  │  │ → Truy cập: this.textInput (instance property!)    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ƯU ĐIỂM:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Kiểm soát KHI NÀO gán và hủy ref!              │    │
  │  │ → Linh hoạt: có thể gán vào bất kỳ đâu!         │    │
  │  │ → Có thể dùng với function component (qua props!) │    │
  │  │ → Thực thi logic khi ref được gán!                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. createRef — Cách 3 (Recommended!)

```
  createRef:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CODE:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ class App extends React.Component {                  │    │
  │  │   constructor(props) {                               │    │
  │  │     super(props);                                    │    │
  │  │     // ① Tạo ref bằng createRef!                  │    │
  │  │     this.textInputRef = React.createRef();           │    │
  │  │   }                                                  │    │
  │  │                                                      │    │
  │  │   componentDidMount() {                              │    │
  │  │     setTimeout(() => {                               │    │
  │  │       // ③ Truy cập qua .current!                  │    │
  │  │       this.textInputRef.current.value = 'new value'; │    │
  │  │     }, 2000);                                        │    │
  │  │   }                                                  │    │
  │  │                                                      │    │
  │  │   render() {                                         │    │
  │  │     // ② Gán ref vào element!                      │    │
  │  │     return <input ref={this.textInputRef}            │    │
  │  │                   value="value" />;                  │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CƠ CHẾ:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → createRef() → { current: null }                  │    │
  │  │ → ref={this.textInputRef} →                         │    │
  │  │   React gán DOM vào textInputRef.current!           │    │
  │  │ → Mount: ref.current = element                      │    │
  │  │ → Unmount: ref.current = null                       │    │
  │  │ → Truy cập: this.textInputRef.current               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO RECOMMENDED?                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → API CLEAR: { current: value }                    │    │
  │  │ → Dễ type-check (TypeScript!)                      │    │
  │  │ → Không có side effects như string refs!            │    │
  │  │ → Consistent pattern!                               │    │
  │  │ → Hooks: useRef() tương tự createRef()!            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. 2 Mục Đích — DOM Node + Component Instance!

```
  2 MỤC ĐÍCH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  MỤC ĐÍCH 1: Truy cập DOM NODE!                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ <input ref={this.inputRef} />                        │    │
  │  │                                                      │    │
  │  │ this.inputRef.current = <input> DOM element!        │    │
  │  │ → .focus(), .blur(), .value, .scrollIntoView()     │    │
  │  │ → Truy cập DOM API trực tiếp!                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  MỤC ĐÍCH 2: Truy cập CLASS COMPONENT INSTANCE!              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ class Input extends React.Component {                │    │
  │  │   constructor(props) {                               │    │
  │  │     super(props);                                    │    │
  │  │     this.textInputRef = React.createRef();           │    │
  │  │   }                                                  │    │
  │  │   handleFocus() {                                    │    │
  │  │     this.textInputRef.current.focus(); // DOM!      │    │
  │  │   }                                                  │    │
  │  │   render() {                                         │    │
  │  │     return <input ref={this.textInputRef} />;        │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ class App extends React.Component {                  │    │
  │  │   constructor(props) {                               │    │
  │  │     super(props);                                    │    │
  │  │     this.inputRef = React.createRef();               │    │
  │  │   }                                                  │    │
  │  │   componentDidMount() {                              │    │
  │  │     // ★ inputRef.current = Input INSTANCE!        │    │
  │  │     // Gọi instance method!                         │    │
  │  │     this.inputRef.current.handleFocus();             │    │
  │  │   }                                                  │    │
  │  │   render() {                                         │    │
  │  │     return <Input ref={this.inputRef} />;            │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ App tạo inputRef = createRef()                      │    │
  │  │   ↓ ref={this.inputRef}                             │    │
  │  │ <Input ref={inputRef} />                             │    │
  │  │   ↓ React gán ref                                   │    │
  │  │ inputRef.current = Input CLASS INSTANCE! ★         │    │
  │  │   ↓ gọi method                                     │    │
  │  │ inputRef.current.handleFocus()                       │    │
  │  │   ↓                                                  │    │
  │  │ Input.handleFocus() → this.textInputRef.current     │    │
  │  │   ↓                                                  │    │
  │  │ <input> DOM .focus() → INPUT ĐƯỢC FOCUS! ✅       │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Function Component + Ref = LỖI!

```
  FUNCTION COMPONENT + REF:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ:                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function Input() {                                   │    │
  │  │   return <input value="value" />;                    │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ class App extends React.Component {                  │    │
  │  │   constructor(props) {                               │    │
  │  │     super(props);                                    │    │
  │  │     this.inputRef = React.createRef();               │    │
  │  │   }                                                  │    │
  │  │   render() {                                         │    │
  │  │     // ❌ LỖI! Không dùng ref trên function comp!  │    │
  │  │     return <Input ref={this.inputRef} />;            │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO?                                                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Function component KHÔNG CÓ INSTANCE!            │    │
  │  │ → Class component: new MyClass() → instance!       │    │
  │  │ → Function component: MyFunc() → JSX! Không new!  │    │
  │  │ → ref cần gán vào INSTANCE hoặc DOM!              │    │
  │  │ → Function = KHÔNG instance → ref KHÔNG BIẾT      │    │
  │  │   gán vào ĐÂU! → LỖI!                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  REACT ERROR:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ⚠️ Warning: Function components cannot be given    │    │
  │  │ refs. Attempts to access this ref will fail.        │    │
  │  │ Did you mean to use React.forwardRef()?             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP: forwardRef!                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → forwardRef cho phép function component            │    │
  │  │   NHẬN ref từ parent!                               │    │
  │  │ → Rồi CHUYỂN TIẾP (forward) ref đến DOM bên trong!│   │
  │  │ → Function comp VẪN không có instance!             │    │
  │  │ → Nhưng ref GÁN VÀO DOM element bên trong! ✅    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. forwardRef — Ref Forwarding!

```
  forwardRef:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CÁCH CŨ — TRUYỀN REF QUA PROPS (không dùng forwardRef):    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // ⚠️ Dùng prop tên KHÁC (inputRef, không phải ref!)│   │
  │  │ function Child(props) {                              │    │
  │  │   const { inputRef, ...rest } = props;              │    │
  │  │   // ③ Gán inputRef prop vào DOM ref!              │    │
  │  │   return <input ref={inputRef} {...rest} />;         │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ class Parent extends React.Component {               │    │
  │  │   constructor(props) {                               │    │
  │  │     super(props);                                    │    │
  │  │     this.inputRef = React.createRef(); // ①        │    │
  │  │   }                                                  │    │
  │  │   render() {                                         │    │
  │  │     // ② Truyền qua prop KHÁC (inputRef!)         │    │
  │  │     // Vì "ref" bị React BẮT, không qua props!    │    │
  │  │     return <Child inputRef={this.inputRef} />;       │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ → Hoạt động nhưng: prop name không chuẩn!        │    │
  │  │ → Mỗi component dùng tên khác nhau! Inconsistent! │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH MỚI — forwardRef:                                       │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // ③ forwardRef: nhận (props, ref) → forward ref! │    │
  │  │ const Child = forwardRef((props, ref) => (           │    │
  │  │   <input ref={ref} placeholder="value" />            │    │
  │  │ ));                                                  │    │
  │  │                                                      │    │
  │  │ class Parent extends React.Component {               │    │
  │  │   constructor(props) {                               │    │
  │  │     super(props);                                    │    │
  │  │     this.inputRef = React.createRef(); // ①        │    │
  │  │   }                                                  │    │
  │  │   componentDidMount() {                              │    │
  │  │     // ④ Truy cập DOM BÊN TRONG Child!            │    │
  │  │     this.inputRef.current.value = 'new value';       │    │
  │  │   }                                                  │    │
  │  │   render() {                                         │    │
  │  │     // ② Dùng ref CHUẨN! (không phải inputRef!)  │    │
  │  │     return <Child ref={this.inputRef} />;            │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FLOW:                                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Parent tạo ref = createRef()                    │    │
  │  │ ② <Child ref={ref} /> → React thấy forwardRef!   │    │
  │  │ ③ React GỌI render(props, ref) → ref là tham số 2!│   │
  │  │ ④ <input ref={ref} /> → ref GÁN VÀO <input> DOM!│    │
  │  │ ⑤ Parent.inputRef.current = <input> DOM! ✅      │    │
  │  │                                                      │    │
  │  │ → ref XUYÊN QUA function component!                │    │
  │  │ → Đến ĐÚNG DOM element bên trong!                 │    │
  │  │ → "Forwarding" = CHUYỂN TIẾP ref!                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. HOC + forwardRef!

```
  HOC + forwardRef:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  VẤN ĐỀ VỚI HOC:                                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function withLogger(WrappedComponent) {              │    │
  │  │   class LoggerComponent extends React.Component {    │    │
  │  │     componentDidMount() {                            │    │
  │  │       console.log('mounted!');                       │    │
  │  │     }                                                │    │
  │  │     render() {                                       │    │
  │  │       return <WrappedComponent {...this.props} />;   │    │
  │  │     }                                                │    │
  │  │   }                                                  │    │
  │  │   return LoggerComponent;                            │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ const EnhancedInput = withLogger(Input);             │    │
  │  │                                                      │    │
  │  │ // Khi dùng ref:                                     │    │
  │  │ <EnhancedInput ref={myRef} />                        │    │
  │  │                                                      │    │
  │  │ // myRef.current = LoggerComponent INSTANCE! ❌     │    │
  │  │ // KHÔNG phải Input instance!                       │    │
  │  │ // Vì HOC wrap lại → ref gán vào WRAPPER!         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  GIẢI PHÁP — forwardRef TRONG HOC:                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function withLogger(WrappedComponent) {              │    │
  │  │   class LoggerComponent extends React.Component {    │    │
  │  │     componentDidMount() {                            │    │
  │  │       console.log('mounted!');                       │    │
  │  │     }                                                │    │
  │  │     render() {                                       │    │
  │  │       const { forwardedRef, ...rest } = this.props;  │    │
  │  │       // ② Forward ref đến WrappedComponent!      │    │
  │  │       return <WrappedComponent                       │    │
  │  │         ref={forwardedRef} {...rest} />;              │    │
  │  │     }                                                │    │
  │  │   }                                                  │    │
  │  │                                                      │    │
  │  │   // ① forwardRef wrap HOC!                        │    │
  │  │   return forwardRef((props, ref) => (                │    │
  │  │     <LoggerComponent {...props} forwardedRef={ref} />│    │
  │  │   ));                                                │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ // Bây giờ ref XUYÊN QUA HOC!                      │    │
  │  │ // myRef.current = Input INSTANCE! ✅              │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Source Code — createRef!

```
  createRef SOURCE CODE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  /packages/react/src/ReactCreateRef.js:                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ export function createRef() {                        │    │
  │  │   const refObject = {                                │    │
  │  │     current: null,                                   │    │
  │  │   };                                                 │    │
  │  │   return refObject;                                  │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CHỈ CÓ VẬY! CỰC KỲ ĐƠN GIẢN!                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Trả về object { current: null }                  │    │
  │  │ → Đó là TẤT CẢ source code!                       │    │
  │  │ → Không magic, không class, không closure!          │    │
  │  │ → Chỉ là PLAIN OBJECT!                             │    │
  │  │                                                      │    │
  │  │ ★ ref.current = null ban đầu!                      │    │
  │  │ ★ Trong quá trình RENDER, React gán:               │    │
  │  │   ref.current = DOM element hoặc instance!          │    │
  │  │ ★ Unmount: React reset ref.current = null!          │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. Source Code — forwardRef!

```
  forwardRef SOURCE CODE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  /packages/react/src/ReactForwardRef.js:                     │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const REACT_FORWARD_REF_TYPE =                       │    │
  │  │   Symbol.for('react.forward_ref');                   │    │
  │  │                                                      │    │
  │  │ export function forwardRef(render) {                  │    │
  │  │   const elementType = {                              │    │
  │  │     $$typeof: REACT_FORWARD_REF_TYPE,                │    │
  │  │     render, // ★ Lưu render function!              │    │
  │  │   };                                                 │    │
  │  │   return elementType;                                │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CŨNG RẤT ĐƠN GIẢN!                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → Trả về object { $$typeof, render }               │    │
  │  │ → $$typeof = REACT_FORWARD_REF_TYPE (Symbol!)      │    │
  │  │ → render = function(props, ref) { ... }             │    │
  │  │ → Chỉ là DATA OBJECT + MARKER!                    │    │
  │  │ → Logic xử lý nằm trong RECONCILER!               │    │
  │  │                                                      │    │
  │  │ ★ Giống Suspense, createContext... = chỉ data!    │    │
  │  │ ★ React reconciler kiểm tra $$typeof → xử lý!    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. React Element Structure — $$typeof!

```
  ELEMENT STRUCTURE:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  KHI DÙNG forwardRef:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const InputComponent = forwardRef((props, ref) => (  │    │
  │  │   <input ref={ref} value={props.value} />            │    │
  │  │ ));                                                  │    │
  │  │                                                      │    │
  │  │ // forwardRef trả về:                               │    │
  │  │ InputComponent = {                                   │    │
  │  │   $$typeof: REACT_FORWARD_REF_TYPE,                  │    │
  │  │   render: (props, ref) => { ... }                   │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHI RENDER JSX:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const result = <InputComponent value="hi" />;        │    │
  │  │                                                      │    │
  │  │ // Babel transform:                                  │    │
  │  │ const result = React.createElement(                  │    │
  │  │   InputComponent, // = { $$typeof: FORWARD_REF }   │    │
  │  │   { value: "hi" }                                    │    │
  │  │ );                                                   │    │
  │  │                                                      │    │
  │  │ // createElement trả về:                            │    │
  │  │ result = {                                           │    │
  │  │   $$typeof: REACT_ELEMENT_TYPE, // ★ element!      │    │
  │  │   type: {                                            │    │
  │  │     $$typeof: REACT_FORWARD_REF_TYPE, // ★ type!  │    │
  │  │     render: (props, ref) => { ... }                 │    │
  │  │   },                                                 │    │
  │  │   key: null,                                         │    │
  │  │   ref: { current: ... },                            │    │
  │  │   props: { value: "hi" }                             │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  2 TẦNG $$typeof:                                              │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Tầng 1: element.$$typeof = REACT_ELEMENT_TYPE       │    │
  │  │   → Đây là React element! (createElement tạo!)    │    │
  │  │                                                      │    │
  │  │ Tầng 2: element.type.$$typeof = REACT_FORWARD_REF  │    │
  │  │   → Type này là forwardRef! Reconciler biết!       │    │
  │  │   → Gọi type.render(props, ref)!                   │    │
  │  │                                                      │    │
  │  │ ★ $$typeof NGOÀI = element marker!                 │    │
  │  │ ★ type.$$typeof = COMPONENT TYPE marker!           │    │
  │  │ → Reconciler dùng type.$$typeof để quyết định     │    │
  │  │   CÁCH render: function, class, forwardRef,         │    │
  │  │   context, suspense, memo...                         │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §12. Sơ Đồ Tự Vẽ!

### Sơ Đồ 1: 3 Cách Tạo Ref

```
  3 CÁCH TẠO REF:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① STRING REF (Deprecated!):                                │
  │  ┌──────────────────┐    ┌───────────────────┐              │
  │  │ ref="textInput"  │───→│ this.refs         │              │
  │  │                  │    │ .textInput = DOM  │              │
  │  └──────────────────┘    └───────────────────┘              │
  │  ⚠️ DEPRECATED!                                             │
  │                                                              │
  │  ② CALLBACK REF:                                            │
  │  ┌──────────────────────┐  ┌───────────────────┐            │
  │  │ ref={(el) =>         │─→│ this.textInput    │            │
  │  │  this.textInput = el}│  │ = DOM element!   │            │
  │  └──────────────────────┘  └───────────────────┘            │
  │  Linh hoạt, kiểm soát gán/hủy!                            │
  │                                                              │
  │  ③ createRef (Recommended!):                                │
  │  ┌──────────────────────┐  ┌───────────────────┐            │
  │  │ this.myRef =         │─→│ this.myRef        │            │
  │  │  React.createRef()  │  │ .current = DOM!  │            │
  │  │ ref={this.myRef}    │  │ { current: DOM } │            │
  │  └──────────────────────┘  └───────────────────┘            │
  │  ✅ Clear API!                                               │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: ref Trên DOM vs Class vs Function

```
  REF TRÊN CÁC LOẠI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① DOM element:                                              │
  │  <input ref={myRef} />                                       │
  │  → myRef.current = <input> DOM ✅                           │
  │                                                              │
  │  ② Class component:                                         │
  │  <MyClass ref={myRef} />                                     │
  │  → myRef.current = MyClass INSTANCE ✅                      │
  │  → Có thể gọi myRef.current.method()!                      │
  │                                                              │
  │  ③ Function component:                                      │
  │  <MyFunc ref={myRef} />                                      │
  │  → ❌ LỖI! Function KHÔNG CÓ instance!                    │
  │  → Cần forwardRef!                                          │
  │                                                              │
  │  ④ forwardRef function component:                           │
  │  const MyFunc = forwardRef((props, ref) => ...)              │
  │  <MyFunc ref={myRef} />                                      │
  │  → myRef.current = DOM bên trong MyFunc ✅                  │
  │  → ref được FORWARD đến element cụ thể!                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 3: forwardRef Flow

```
  forwardRef FLOW:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Parent                                                      │
  │  ┌──────────────────────┐                                    │
  │  │ ref = createRef()   │                                    │
  │  │ { current: null }   │                                    │
  │  │                      │                                    │
  │  │ <Child ref={ref} /> │                                    │
  │  └──────────┬───────────┘                                    │
  │             │ ref                                            │
  │             ↓                                                │
  │  Child = forwardRef((props, ref) => ...)                     │
  │  ┌──────────────────────┐                                    │
  │  │ React nhận ref!     │                                    │
  │  │ Gọi render(props,   │                                    │
  │  │           ref)      │                                    │
  │  │                      │                                    │
  │  │ <input ref={ref} /> │ ← ref FORWARD đến DOM!           │
  │  └──────────┬───────────┘                                    │
  │             │                                                │
  │             ↓                                                │
  │  ┌──────────────────────┐                                    │
  │  │ ref.current =       │                                    │
  │  │ <input> DOM! ✅     │                                    │
  │  └──────────────────────┘                                    │
  │                                                              │
  │  Parent.ref.current = <input> DOM bên trong Child!          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 4: HOC + forwardRef

```
  HOC + forwardRef:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  KHÔNG có forwardRef:                                        │
  │  ┌────────────┐   ref   ┌────────────┐   ┌────────────┐    │
  │  │ Parent     │────────→│ HOC Wrapper│   │ Input      │    │
  │  │            │         │ ref = HERE!│   │ (bị bỏ qua)│    │
  │  └────────────┘         │ ❌        │   └────────────┘    │
  │                         └────────────┘                       │
  │  ref.current = HOC instance! KHÔNG phải Input! ❌           │
  │                                                              │
  │  CÓ forwardRef:                                              │
  │  ┌────────────┐   ref   ┌────────────┐   ref ┌──────────┐  │
  │  │ Parent     │────────→│ forwardRef │──────→│ Input    │  │
  │  │            │         │ (forward!) │       │ ref=HERE!│  │
  │  └────────────┘         └────────────┘       │ ✅      │  │
  │                                              └──────────┘  │
  │  ref.current = Input instance! XUYÊN QUA HOC! ✅           │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 5: 2 Tầng $$typeof

```
  2 TẦNG $$typeof:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  <InputComponent value="hi" />                               │
  │         ↓ createElement                                      │
  │  ┌──────────────────────────────────────────┐                │
  │  │ {                                        │                │
  │  │   $$typeof: REACT_ELEMENT_TYPE  ← Tầng 1│                │
  │  │   type: {                                │                │
  │  │     $$typeof: REACT_FORWARD_REF ← Tầng 2│                │
  │  │     render: (props, ref) => ...          │                │
  │  │   },                                     │                │
  │  │   key: null,                             │                │
  │  │   ref: { current: ... },                │                │
  │  │   props: { value: "hi" }                 │                │
  │  │ }                                        │                │
  │  └──────────────────────────────────────────┘                │
  │                                                              │
  │  Tầng 1: $$typeof = "Đây là React Element!"                │
  │  Tầng 2: type.$$typeof = "Loại: forwardRef!"               │
  │                                                              │
  │  Reconciler check type.$$typeof:                             │
  │  → REACT_FORWARD_REF → gọi type.render(props, ref)!       │
  │  → function/class → gọi bình thường!                       │
  │  → REACT_CONTEXT → xử lý context!                         │
  │  → REACT_SUSPENSE → xử lý suspense!                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §13. Tự Viết — RefsEngine!

```javascript
/**
 * RefsEngine — Mô phỏng React Refs + forwardRef!
 * Tự viết bằng tay, KHÔNG dùng thư viện!
 */
var RefsEngine = (function () {

  var log = [];
  function reset() { log = []; }

  // ═══════════════════════════════════
  // 1. createRef — Source Code!
  // ═══════════════════════════════════
  function createRef() {
    var refObject = {
      current: null
    };
    log.push('[createRef] Created: { current: null }');
    return refObject;
  }

  // ═══════════════════════════════════
  // 2. STRING REF SIMULATION
  // ═══════════════════════════════════
  function simulateStringRef() {
    log.push('=== String Ref ===');

    var component = {
      refs: {}
    };

    // Simulate: ref="textInput"
    var domElement = { tagName: 'INPUT', value: 'original' };
    component.refs['textInput'] = domElement;
    log.push('ref="textInput" → this.refs.textInput = ' +
      domElement.tagName);

    // Access
    component.refs.textInput.value = 'new value';
    log.push('this.refs.textInput.value = "' +
      component.refs.textInput.value + '" ✅');

    return component;
  }

  // ═══════════════════════════════════
  // 3. CALLBACK REF SIMULATION
  // ═══════════════════════════════════
  function simulateCallbackRef() {
    log.push('=== Callback Ref ===');

    var component = { textInput: null };
    var domElement = { tagName: 'INPUT', value: 'original' };

    // Simulate: ref={(el) => this.textInput = el}
    var refCallback = function (element) {
      component.textInput = element;
      log.push('Callback ref called! element=' +
        (element ? element.tagName : 'null'));
    };

    // Mount: React calls callback with element
    refCallback(domElement);
    log.push('this.textInput.value = "' +
      component.textInput.value + '" ✅');

    // Unmount: React calls callback with null
    refCallback(null);
    log.push('After unmount: this.textInput = ' +
      component.textInput + ' ✅');

    return component;
  }

  // ═══════════════════════════════════
  // 4. createRef SIMULATION
  // ═══════════════════════════════════
  function simulateCreateRef() {
    log.push('=== createRef ===');

    var ref = createRef();
    var domElement = { tagName: 'INPUT', value: 'original' };

    // Mount: React assigns element to ref.current
    ref.current = domElement;
    log.push('Mount: ref.current = ' + ref.current.tagName + ' ✅');

    // Access
    ref.current.value = 'new value';
    log.push('ref.current.value = "' + ref.current.value + '" ✅');

    // Unmount: React resets
    ref.current = null;
    log.push('Unmount: ref.current = ' + ref.current + ' ✅');

    return ref;
  }

  // ═══════════════════════════════════
  // 5. forwardRef — Source Code!
  // ═══════════════════════════════════
  var REACT_FORWARD_REF_TYPE = 'Symbol(react.forward_ref)';
  var REACT_ELEMENT_TYPE = 'Symbol(react.element)';

  function forwardRef(renderFn) {
    var elementType = {
      '$$typeof': REACT_FORWARD_REF_TYPE,
      render: renderFn
    };
    log.push('[forwardRef] Created: { $$typeof: ' +
      REACT_FORWARD_REF_TYPE + ', render: fn }');
    return elementType;
  }

  // ═══════════════════════════════════
  // 6. forwardRef SIMULATION
  // ═══════════════════════════════════
  function simulateForwardRef() {
    log.push('=== forwardRef ===');

    // Child = forwardRef((props, ref) => ...)
    var Child = forwardRef(function (props, ref) {
      // Simulate: <input ref={ref} />
      var domElement = { tagName: 'INPUT', value: props.value || '' };
      ref.current = domElement; // React assigns!
      log.push('[Child render] ref forwarded to <input>!');
      return domElement;
    });

    // Parent
    var parentRef = createRef();

    // Simulate: <Child ref={parentRef} value="hello" />
    log.push('[Parent] <Child ref={parentRef} value="hello" />');

    // React sees forwardRef → calls render(props, ref)
    if (Child['$$typeof'] === REACT_FORWARD_REF_TYPE) {
      log.push('[React] type.$$typeof = FORWARD_REF → call render(props, ref)!');
      Child.render({ value: 'hello' }, parentRef);
    }

    // Parent can access DOM inside Child!
    log.push('[Parent] parentRef.current = ' +
      parentRef.current.tagName + ' ✅');
    log.push('[Parent] parentRef.current.value = "' +
      parentRef.current.value + '" ✅');

    return parentRef;
  }

  // ═══════════════════════════════════
  // 7. ELEMENT STRUCTURE
  // ═══════════════════════════════════
  function simulateElementStructure() {
    log.push('=== Element Structure ===');

    var InputComponent = forwardRef(function (props, ref) {
      return { type: 'input', ref: ref, props: props };
    });

    // createElement simulation
    var element = {
      '$$typeof': REACT_ELEMENT_TYPE,
      type: InputComponent, // { $$typeof: FORWARD_REF, render }
      key: null,
      ref: createRef(),
      props: { value: 'hi' }
    };

    log.push('element.$$typeof = ' + element['$$typeof']);
    log.push('element.type.$$typeof = ' + element.type['$$typeof']);
    log.push('→ 2 tầng $$typeof!');
    log.push('→ Tầng 1: REACT_ELEMENT = "Đây là element!"');
    log.push('→ Tầng 2: FORWARD_REF = "Loại: forwardRef!"');

    return element;
  }

  // ═══════════════════════════════════
  // 8. FUNCTION COMPONENT + REF = ERROR!
  // ═══════════════════════════════════
  function simulateFunctionRefError() {
    log.push('=== Function Component + Ref ===');

    function MyFuncComponent(props) {
      return { type: 'input', props: props };
    }

    var ref = createRef();

    // Simulate: <MyFuncComponent ref={ref} />
    log.push('[React] <MyFuncComponent ref={ref} />');
    log.push('[React] MyFuncComponent is FUNCTION!');
    log.push('[React] Function has NO INSTANCE!');
    log.push('[React] ⚠️ Warning: Function components cannot be given refs!');
    log.push('[React] Did you mean to use React.forwardRef()? ❌');

    return null;
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  REFS ENGINE — DEMO                         ║');
    console.log('╚═══════════════════════════════════════════╝');

    // 1. String Ref
    console.log('\n--- 1. STRING REF ---');
    reset(); simulateStringRef();
    log.forEach(function (l) { console.log('  ' + l); });

    // 2. Callback Ref
    console.log('\n--- 2. CALLBACK REF ---');
    reset(); simulateCallbackRef();
    log.forEach(function (l) { console.log('  ' + l); });

    // 3. createRef
    console.log('\n--- 3. createRef ---');
    reset(); simulateCreateRef();
    log.forEach(function (l) { console.log('  ' + l); });

    // 4. Function + Ref = Error!
    console.log('\n--- 4. FUNCTION + REF = ERROR ---');
    reset(); simulateFunctionRefError();
    log.forEach(function (l) { console.log('  ' + l); });

    // 5. forwardRef
    console.log('\n--- 5. forwardRef ---');
    reset(); simulateForwardRef();
    log.forEach(function (l) { console.log('  ' + l); });

    // 6. Element Structure
    console.log('\n--- 6. ELEMENT STRUCTURE ---');
    reset(); simulateElementStructure();
    log.forEach(function (l) { console.log('  ' + l); });

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                           ║');
    console.log('╚═══════════════════════════════════════════╝');
  }

  return {
    createRef: createRef,
    forwardRef: forwardRef,
    simulateStringRef: simulateStringRef,
    simulateCallbackRef: simulateCallbackRef,
    simulateCreateRef: simulateCreateRef,
    simulateForwardRef: simulateForwardRef,
    simulateElementStructure: simulateElementStructure,
    demo: demo, reset: reset
  };
})();

// Chạy: RefsEngine.demo();
```

---

## §14. Câu Hỏi Luyện Tập!

### ❓ Câu 1: React có mấy cách tạo Ref?

**Trả lời:**

| Cách | Syntax | Truy cập | Status |
|---|---|---|---|
| **String Refs** | `ref="myInput"` | `this.refs.myInput` | ⚠️ Deprecated! |
| **Callback Refs** | `ref={(el) => this.x = el}` | `this.x` | ✅ Linh hoạt |
| **createRef** | `this.myRef = createRef()` | `this.myRef.current` | ✅ **Recommended!** |
| **useRef** (hook) | `const ref = useRef()` | `ref.current` | ✅ Function comp |

### ❓ Câu 2: Ref có 2 mục đích gì?

**Trả lời:**

1. **Truy cập DOM NODE**: focus, blur, scroll, measure, animation!
2. **Truy cập CLASS component INSTANCE**: gọi instance method!

⚠️ Function component **KHÔNG CÓ instance** → **KHÔNG thể** dùng ref để lấy instance!

### ❓ Câu 3: Tại sao không thể dùng ref trên function component?

**Trả lời:**

- Class component: `new MyClass()` → tạo **INSTANCE** → ref gán vào instance!
- Function component: `MyFunc()` → trả về **JSX** → **KHÔNG CÓ** instance!
- ref cần gán vào **INSTANCE hoặc DOM** → function = không instance → **LỖI!**
- Giải pháp: **forwardRef** → cho phép function component nhận ref và forward đến DOM bên trong!

### ❓ Câu 4: forwardRef hoạt động thế nào?

**Trả lời:**

```
① Parent: ref = createRef()
② Parent: <Child ref={ref} />
③ React: thấy Child = forwardRef → gọi render(props, REF)!
④ Child: render(props, ref) → <input ref={ref} />
⑤ React: gán ref.current = <input> DOM!
⑥ Parent: ref.current = <input> DOM bên trong Child! ✅
```

- forwardRef = nhận ref làm **tham số thứ 2**!
- **Forward** (chuyển tiếp) ref đến element CỤ THỂ bên trong!
- Function component VẪN không có instance, nhưng ref gán vào DOM!

### ❓ Câu 5: createRef source code như thế nào?

**Trả lời:**

```javascript
export function createRef() {
  const refObject = { current: null };
  return refObject;
}
```

- **CỰC KỲ ĐƠN GIẢN!** Chỉ trả về `{ current: null }`!
- Không magic, không class, không closure!
- React **rendering process** sẽ gán `ref.current = element`!

### ❓ Câu 6: forwardRef source code như thế nào?

**Trả lời:**

```javascript
export function forwardRef(render) {
  return {
    $$typeof: Symbol.for('react.forward_ref'),
    render
  };
}
```

- Cũng RẤT ĐƠN GIẢN! Trả về `{ $$typeof, render }`!
- `$$typeof` = **MARKER** cho reconciler!
- Logic xử lý nằm trong **React Reconciler**, KHÔNG ở đây!
- Giống Suspense, createContext... = chỉ **DATA OBJECT**!

### ❓ Câu 7: Element có 2 tầng $$typeof — giải thích?

**Trả lời:**

```javascript
{
  $$typeof: REACT_ELEMENT_TYPE,      // Tầng 1: "Đây là Element!"
  type: {
    $$typeof: REACT_FORWARD_REF_TYPE, // Tầng 2: "Loại: forwardRef!"
    render: (props, ref) => ...
  },
  key: null,
  ref: { current: ... },
  props: { ... }
}
```

- **Tầng 1** (`element.$$typeof`): `REACT_ELEMENT_TYPE` — đánh dấu đây là React element (do `createElement` tạo)!
- **Tầng 2** (`element.type.$$typeof`): loại component — `FORWARD_REF`, `CONTEXT`, `SUSPENSE`, `MEMO`...
- Reconciler dùng **Tầng 2** để quyết định CÁCH render component!

---

> 🎯 **Tổng kết React Refs & forwardRef:**
> - **Refs**: tham chiếu DOM nodes hoặc class component instances!
> - **3 cách**: String (deprecated!), Callback (linh hoạt), createRef (recommended!)
> - **2 mục đích**: DOM node + Class instance!
> - **Function component + ref = LỖI** — không có instance!
> - **forwardRef**: nhận ref tham số 2 → forward đến DOM bên trong!
> - **HOC + forwardRef**: ref xuyên qua HOC wrapper!
> - **createRef source**: `{ current: null }` — cực kỳ đơn giản!
> - **forwardRef source**: `{ $$typeof: FORWARD_REF, render }` — data object!
> - **2 tầng $$typeof**: element.$$typeof + type.$$typeof!
> - **RefsEngine** tự viết: 6 simulators — string, callback, createRef, function error, forwardRef, element structure!
> - **7 câu hỏi** luyện tập với đáp án chi tiết!
