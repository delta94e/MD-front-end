# React Element vs Component — Deep Dive!

> **Chủ đề**: Element vs Component — Khác Biệt Cốt Lõi + Custom Content Patterns
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!
> **Nguồn**: "The difference between elements and components in React" — Juejin

---

## Mục Lục

1. [§1. Bài Toán Mở Đầu — useTitle!](#1)
2. [§2. Element — React.createElement!](#2)
3. [§3. Component — Function + Class!](#3)
4. [§4. Element vs Component — Bảng So Sánh!](#4)
5. [§5. Giải Bài Toán — 2 Cách!](#5)
6. [§6. Custom Content — Truyền Element!](#6)
7. [§7. Custom Content — Truyền Component!](#7)
8. [§8. Custom Content — Render Props!](#8)
9. [§9. Children as Function!](#9)
10. [§10. Sơ Đồ Tự Vẽ](#10)
11. [§11. Tự Viết — ElementComponentEngine](#11)
12. [§12. Câu Hỏi Luyện Tập](#12)

---

## §1. Bài Toán Mở Đầu — useTitle!

```
  BÀI TOÁN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  YÊU CẦU: Implement useTitle hook!                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function Header() {                                  │    │
  │  │   const [Title, changeTitle] = useTitle();           │    │
  │  │   return (                                           │    │
  │  │     <div onClick={() => changeTitle('new title')}>   │    │
  │  │       <Title />                                      │    │
  │  │     </div>                                           │    │
  │  │   );                                                 │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CODE BỊ LỖI:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function TitleComponent({ title }) {                 │    │
  │  │   return <div>{title}</div>;                         │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ function useTitle() {                                │    │
  │  │   const [title, changeTitle] = useState('default');  │    │
  │  │                                                      │    │
  │  │   const Element = React.createElement(               │    │
  │  │     TitleComponent, { title }                        │    │
  │  │   );                                                 │    │
  │  │   // ❌ LỖI! Element.type = TitleComponent!        │    │
  │  │   // Trả về component MÀ dùng NHƯ element!         │    │
  │  │   return [Element.type, changeTitle];                 │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TẠI SAO LỖI?                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → createElement → trả về ELEMENT (object!)        │    │
  │  │ → Element.type = TitleComponent (function!)         │    │
  │  │ → Trả về Element.type = function KHÔNG CÓ props!  │    │
  │  │ → <Title /> → gọi TitleComponent() VỚI {}!        │    │
  │  │ → title = undefined → LỖI! ❌                     │    │
  │  │                                                      │    │
  │  │ ★ Nhầm lẫn ELEMENT và COMPONENT!                  │    │
  │  │ ★ Cần hiểu rõ SỰ KHÁC BIỆT!                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Element — React.createElement!

```
  REACT ELEMENT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ React Element = OBJECT mô tả UI!                   │    │
  │  │ → Mô tả WHAT bạn muốn thấy trên màn hình!        │    │
  │  │ → Bản chất = JS OBJECT thuần!                      │    │
  │  │ → KHÔNG phải DOM thật!                              │    │
  │  │ → Là MÔ TẢ (description) của DOM!                 │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  JSX → Babel → createElement → OBJECT:                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // JSX:                                              │    │
  │  │ const element = <h1 className="greeting">           │    │
  │  │   Hello, world!                                      │    │
  │  │ </h1>;                                               │    │
  │  │                                                      │    │
  │  │ // Babel transform:                                  │    │
  │  │ const element = React.createElement(                 │    │
  │  │   'h1',                       // type!              │    │
  │  │   { className: 'greeting' },  // props!             │    │
  │  │   'Hello, world!'             // children!          │    │
  │  │ );                                                   │    │
  │  │                                                      │    │
  │  │ // Kết quả = OBJECT:                                │    │
  │  │ const element = {                                    │    │
  │  │   $$typeof: Symbol(react.element),                   │    │
  │  │   type: 'h1',                  // ★ string = DOM! │    │
  │  │   props: {                                           │    │
  │  │     className: 'greeting',                           │    │
  │  │     children: 'Hello, world!'                        │    │
  │  │   },                                                 │    │
  │  │   key: null,                                         │    │
  │  │   ref: null                                          │    │
  │  │ };                                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ELEMENT VỚI COMPONENT TYPE:                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ const element = <Welcome name="Sara" />;             │    │
  │  │                                                      │    │
  │  │ // =                                                 │    │
  │  │ const element = {                                    │    │
  │  │   $$typeof: Symbol(react.element),                   │    │
  │  │   type: Welcome,      // ★ function/class = comp! │    │
  │  │   props: { name: 'Sara' },                           │    │
  │  │   key: null,                                         │    │
  │  │   ref: null                                          │    │
  │  │ };                                                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH DÙNG ELEMENT:                                            │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Element = JS expression → dùng {} để nhúng!    │    │
  │  │ const name = <span>Josh Perez</span>; // element!   │    │
  │  │ const greeting = <h1>Hello, {name}</h1>; // nhúng! │    │
  │  │                                                      │    │
  │  │ // ★ Element dùng {element} KHÔNG PHẢI <Element /> │   │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §3. Component — Function + Class!

```
  REACT COMPONENT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ĐỊNH NGHĨA:                                                  │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ React Component = FUNCTION hoặc CLASS!              │    │
  │  │ → Nhận PROPS → trả về ELEMENT!                    │    │
  │  │ → Là "nhà máy" SẢN XUẤT elements!                │    │
  │  │ → Bản chất = function hoặc class!                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  2 LOẠI:                                                      │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // ① Function Component:                            │    │
  │  │ function Welcome(props) {                            │    │
  │  │   return <h1>Hello, {props.name}</h1>;              │    │
  │  │ }                                                    │    │
  │  │ // → typeof Welcome = 'function'                    │    │
  │  │ // → Welcome(props) → trả về ELEMENT!             │    │
  │  │                                                      │    │
  │  │ // ② Class Component:                               │    │
  │  │ class Welcome extends React.Component {              │    │
  │  │   render() {                                         │    │
  │  │     return <h1>Hello, {this.props.name}</h1>;       │    │
  │  │   }                                                  │    │
  │  │ }                                                    │    │
  │  │ // → typeof Welcome = 'function' (class cũng là fn!)│  │
  │  │ // → new Welcome(props).render() → trả về ELEMENT!│   │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH DÙNG COMPONENT:                                          │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ // Component → dùng NHƯ HTML tag!                  │    │
  │  │ const element = <Welcome name="Sara" />;             │    │
  │  │                                                      │    │
  │  │ // Babel transform:                                  │    │
  │  │ const element = React.createElement(Welcome, {       │    │
  │  │   name: 'Sara'                                       │    │
  │  │ });                                                  │    │
  │  │                                                      │    │
  │  │ // ★ Component dùng <Component /> KHÔNG PHẢI {Comp}│   │
  │  │ // ★ <Component /> → GỌI function/class!          │    │
  │  │ // ★ Kết quả = ELEMENT!                            │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  COMPONENT → ELEMENT:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Component:  Welcome (function)                       │    │
  │  │     ↓ <Welcome name="Sara" />                       │    │
  │  │ Element:    { type: Welcome, props: {name:'Sara'} } │    │
  │  │     ↓ React gọi Welcome({name:'Sara'})              │    │
  │  │ Result:     <h1>Hello, Sara</h1>                     │    │
  │  │     ↓ createElement                                  │    │
  │  │ Element:    { type: 'h1', props: {...} }             │    │
  │  │                                                      │    │
  │  │ ★ Component → Element → Component → Element → DOM│   │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Element vs Component — Bảng So Sánh!

```
  SO SÁNH:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬────────────────┬────────────────┐     │
  │  │                  │ ELEMENT        │ COMPONENT      │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Bản chất         │ JS OBJECT      │ FUNCTION/CLASS │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Tạo bởi          │ createElement  │ Developer viết │     │
  │  │                  │ hoặc JSX       │                │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Mô tả            │ WHAT hiển thị  │ HOW tạo element│     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ typeof           │ 'object'       │ 'function'     │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Có $$typeof?     │ ✅ Có!        │ ❌ Không!     │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Có props?        │ ✅ element    │ ❌ nhận props │     │
  │  │                  │ .props         │ qua tham số    │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Immutable?       │ ✅ Bất biến!  │ ❌ Mutable    │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Cách dùng JSX    │ {element}      │ <Component />  │     │
  │  ├──────────────────┼────────────────┼────────────────┤     │
  │  │ Ví dụ            │ <div>Hi</div>  │ function App() │     │
  │  │                  │ = { type:      │ { return ...}  │     │
  │  │                  │   'div', ...}  │                │     │
  │  └──────────────────┴────────────────┴────────────────┘     │
  │                                                              │
  │  QUY TẮC VÀNG:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Element (object)  → dùng {element}!                 │    │
  │  │ Component (func)  → dùng <Component />!             │    │
  │  │                                                      │    │
  │  │ NHẦM LẪN:                                           │    │
  │  │ Element dùng <Element /> → LỖI! (object ≠ comp!)  │    │
  │  │ Component dùng {Component} → render "[object]"! ❌ │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Giải Bài Toán — 2 Cách!

```
  GIẢI PHÁP:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CÁCH 1: Trả về ELEMENT → dùng {Title}!                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function useTitle() {                                │    │
  │  │   const [title, changeTitle] = useState('default');  │    │
  │  │                                                      │    │
  │  │   // ★ createElement → trả về ELEMENT!             │    │
  │  │   const Element = React.createElement(               │    │
  │  │     TitleComponent, { title }                        │    │
  │  │   );                                                 │    │
  │  │   return [Element, changeTitle]; // ★ trả ELEMENT! │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ function Header() {                                  │    │
  │  │   const [Title, changeTitle] = useTitle();           │    │
  │  │   return (                                           │    │
  │  │     <div onClick={() => changeTitle('new title')}>   │    │
  │  │       {Title}  {/* ★ Element → dùng {}! */}       │    │
  │  │     </div>                                           │    │
  │  │   );                                                 │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  CÁCH 2: Trả về COMPONENT → dùng <Title />!                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function useTitle() {                                │    │
  │  │   const [title, changeTitle] = useState('default');  │    │
  │  │                                                      │    │
  │  │   // ★ Tạo FUNCTION component!                    │    │
  │  │   const returnComponent = () => {                    │    │
  │  │     return <TitleComponent title={title} />;         │    │
  │  │   };                                                 │    │
  │  │   return [returnComponent, changeTitle]; // ★ comp!│    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ function Header() {                                  │    │
  │  │   const [Title, changeTitle] = useTitle();           │    │
  │  │   return (                                           │    │
  │  │     <div onClick={() => changeTitle('new title')}>   │    │
  │  │       <Title /> {/* ★ Component → dùng </>! */}   │    │
  │  │     </div>                                           │    │
  │  │   );                                                 │    │
  │  │ }                                                    │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  BÀI TOÁN GỐC SAI Ở ĐÂU?                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ return [Element.type, changeTitle];                  │    │
  │  │           ↑                                          │    │
  │  │ Element.type = TitleComponent (function!)           │    │
  │  │ → Trả về COMPONENT nhưng KHÔNG có title prop!     │    │
  │  │ → <Title /> → TitleComponent({}) → title=undefined│   │
  │  │ → NHẦM element với component! ❌                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. Custom Content — Truyền Element!

```
  TRUYỀN ELEMENT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  USE CASE: Modal với nội dung TÙY CHỈNH!                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function Modal({ content }) {                        │    │
  │  │   return (                                           │    │
  │  │     <div>                                            │    │
  │  │       {content}  {/* ★ Element → dùng {}! */}     │    │
  │  │       <button>OK</button>                            │    │
  │  │       <button>Cancel</button>                        │    │
  │  │     </div>                                           │    │
  │  │   );                                                 │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ function CustomContent({ text }) {                   │    │
  │  │   return <div>{text}</div>;                          │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ // Sử dụng: truyền ELEMENT vào prop!               │    │
  │  │ <Modal content={<CustomContent text="hello" />} />   │    │
  │  │              ↑                                       │    │
  │  │         JSX = Element!                               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ĐẶC ĐIỂM:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → content = React Element (object!)                 │    │
  │  │ → Modal dùng {content} để render!                   │    │
  │  │ → Props ĐÓNG GÓI sẵn trong element!               │    │
  │  │ → Modal KHÔNG thể truyền thêm props vào content!  │    │
  │  │ → Simple! Nhưng KHÔNG linh hoạt!                   │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §7. Custom Content — Truyền Component!

```
  TRUYỀN COMPONENT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  USE CASE: Timer truyền TIME cho content TÙY CHỈNH!        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function Timer({ content: Content }) {               │    │
  │  │   const [time, changeTime] = useState('0');          │    │
  │  │                                                      │    │
  │  │   useEffect(() => {                                  │    │
  │  │     setTimeout(() => {                               │    │
  │  │       changeTime(new Date().toLocaleTimeString());   │    │
  │  │     }, 1000);                                        │    │
  │  │   }, [time]);                                        │    │
  │  │                                                      │    │
  │  │   // ★ Content = Component → dùng <Content />!    │    │
  │  │   // ★ Truyền time NỘI BỘ vào component!         │    │
  │  │   return <Content time={time} />;                    │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ function CustomContent({ time }) {                   │    │
  │  │   return <div style={{                               │    │
  │  │     border: '1px solid #ccc'                         │    │
  │  │   }}>{time}</div>;                                   │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ // Sử dụng: truyền COMPONENT vào prop!             │    │
  │  │ <Timer content={CustomContent} />                    │    │
  │  │              ↑                                       │    │
  │  │         Function = Component!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  ĐẶC ĐIỂM:                                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ → content = React Component (function!)             │    │
  │  │ → Timer dùng <Content time={time} /> → truyền prop!│   │
  │  │ → Timer CÓ THỂ truyền DATA NỘI BỘ vào component!│    │
  │  │ → User TÙY CHỈNH cách hiển thị!                  │    │
  │  │ → LINH HOẠT hơn truyền element! ✅               │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  KHI NÀO DÙNG:                                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Truyền Element: content KHÔNG cần data nội bộ!    │    │
  │  │ Truyền Component: content CẦN data nội bộ! ★     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §8. Custom Content — Render Props!

```
  RENDER PROPS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PATTERN: Truyền FUNCTION trả về Element!                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function Timer({ renderContent }) {                  │    │
  │  │   const [time, changeTime] = useState('0');          │    │
  │  │                                                      │    │
  │  │   useEffect(() => {                                  │    │
  │  │     setTimeout(() => {                               │    │
  │  │       changeTime(new Date().toLocaleTimeString());   │    │
  │  │     }, 1000);                                        │    │
  │  │   }, [time]);                                        │    │
  │  │                                                      │    │
  │  │   // ★ GỌI function → trả về Element!             │    │
  │  │   return <div>{renderContent(time)}</div>;           │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ // Sử dụng: truyền FUNCTION vào prop!              │    │
  │  │ <Timer renderContent={(time) => {                    │    │
  │  │   return <CustomContent time={time} />;              │    │
  │  │ }} />                                                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO VỚI TRUYỀN COMPONENT:                                    │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Truyền Component:                                    │    │
  │  │ → <Content time={time} />                           │    │
  │  │ → Timer quyết định PROPS NAME!                     │    │
  │  │ → User phải tuân theo convention!                   │    │
  │  │                                                      │    │
  │  │ Render Props:                                        │    │
  │  │ → renderContent(time) → function!                  │    │
  │  │ → User quyết định CÁCH dùng time!                  │    │
  │  │ → Linh hoạt hơn: có thể dùng nhiều components!   │    │
  │  │ → Phổ biến hơn trong thực tế! ★                  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §9. Children as Function!

```
  CHILDREN AS FUNCTION:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PATTERN: props.children là FUNCTION!                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ function Timer({ children }) {                       │    │
  │  │   const [time, changeTime] = useState('0');          │    │
  │  │                                                      │    │
  │  │   useEffect(() => {                                  │    │
  │  │     setTimeout(() => {                               │    │
  │  │       changeTime(new Date().toLocaleTimeString());   │    │
  │  │     }, 1000);                                        │    │
  │  │   }, [time]);                                        │    │
  │  │                                                      │    │
  │  │   // ★ children là function → gọi nó!             │    │
  │  │   return <div>{children(time)}</div>;                │    │
  │  │ }                                                    │    │
  │  │                                                      │    │
  │  │ // Sử dụng: children = function!                    │    │
  │  │ <Timer>                                              │    │
  │  │   {(time) => {                                       │    │
  │  │     return <CustomContent time={time} />;            │    │
  │  │   }}                                                 │    │
  │  │ </Timer>                                             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  SO VỚI RENDER PROPS:                                         │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ Render Props:                                        │    │
  │  │ <Timer renderContent={(time) => <Comp time={time}/>}│    │
  │  │ />                                                   │    │
  │  │ → Dùng prop attribute! Có thể nhiều render props!  │    │
  │  │                                                      │    │
  │  │ Children as Function:                                │    │
  │  │ <Timer>                                              │    │
  │  │   {(time) => <Comp time={time} />}                  │    │
  │  │ </Timer>                                             │    │
  │  │ → Dùng children! Cleaner syntax!                   │    │
  │  │ → Chỉ 1 render function!                           │    │
  │  │                                                      │    │
  │  │ → CẢ 2 đều là render props pattern!               │    │
  │  │ → Chọn NÀO tùy tình huống!                        │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  TỔNG KẾT 3 CÁCH CUSTOM CONTENT:                             │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ ① Element: content={<Comp text="hi" />}            │    │
  │  │   → Simple! Nhưng KHÔNG nhận data nội bộ!         │    │
  │  │                                                      │    │
  │  │ ② Component: content={Comp}                         │    │
  │  │   → Nhận data nội bộ! <Content time={time} />     │    │
  │  │                                                      │    │
  │  │ ③ Render Props: renderContent={(time) => <Comp/>}  │    │
  │  │   → Linh hoạt nhất! User quyết định cách dùng!  │    │
  │  │   → Children as Function cũng thuộc pattern này!  │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §10. Sơ Đồ Tự Vẽ!

### Sơ Đồ 1: Element vs Component

```
  ELEMENT vs COMPONENT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  COMPONENT (function/class):     ELEMENT (object):           │
  │  ┌──────────────────────┐       ┌──────────────────────┐    │
  │  │ function Welcome() { │       │ {                    │    │
  │  │   return <h1>Hi</h1>;│       │   $$typeof: ELEMENT, │    │
  │  │ }                    │       │   type: 'h1',        │    │
  │  │                      │       │   props: {           │    │
  │  │ typeof = 'function'  │       │     children: 'Hi'   │    │
  │  │                      │       │   }                  │    │
  │  │ "NHÀ MÁY"           │       │ }                    │    │
  │  │ sản xuất elements!  │       │                      │    │
  │  └──────────┬───────────┘       │ typeof = 'object'    │    │
  │             │                   │ "MÔ TẢ" UI!         │    │
  │             │ <Welcome />       └──────────────────────┘    │
  │             │ createElement                                  │
  │             ↓                                                │
  │  ┌──────────────────────┐                                    │
  │  │ { type: Welcome,     │ → ELEMENT chứa component!        │
  │  │   props: {} }        │                                    │
  │  └──────────┬───────────┘                                    │
  │             │ React gọi Welcome()                            │
  │             ↓                                                │
  │  ┌──────────────────────┐                                    │
  │  │ { type: 'h1',        │ → ELEMENT chứa DOM type!         │
  │  │   props: {children:  │                                    │
  │  │   'Hi'} }            │ → Render thành DOM thật!         │
  │  └──────────────────────┘                                    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 2: JSX → createElement → Object

```
  JSX TRANSFORM:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  JSX:              Babel:              Object:               │
  │  ┌────────────┐   ┌──────────────┐   ┌──────────────┐      │
  │  │<h1 class=  │   │createElement(│   │{             │      │
  │  │ "greet">   │ → │ 'h1',        │ → │ type: 'h1',  │      │
  │  │ Hello!     │   │ {className:  │   │ props: {     │      │
  │  │</h1>       │   │  'greet'},   │   │  className:  │      │
  │  └────────────┘   │ 'Hello!')    │   │  'greet',    │      │
  │                    └──────────────┘   │  children:   │      │
  │                                       │  'Hello!'    │      │
  │                                       │ }            │      │
  │  ┌────────────┐   ┌──────────────┐   │}             │      │
  │  │<Welcome    │   │createElement(│   └──────────────┘      │
  │  │ name=      │ → │ Welcome,     │   ┌──────────────┐      │
  │  │ "Sara" />  │   │ {name:       │ → │{ type:       │      │
  │  └────────────┘   │  'Sara'})    │   │  Welcome,    │      │
  │                    └──────────────┘   │  props: {    │      │
  │                                       │   name:      │      │
  │  type = string                        │   'Sara' }}  │      │
  │  → DOM element!                      └──────────────┘      │
  │  type = function                                             │
  │  → Component!                        type = function       │
  │                                       → React gọi nó!      │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 3: useTitle Problem

```
  useTitle BÀI TOÁN:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CODE GỐC (LỖI!):                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ createElement(TitleComponent, {title})               │    │
  │  │ ↓                                                    │    │
  │  │ Element = { type: TitleComponent, props: {title} }  │    │
  │  │ ↓                                                    │    │
  │  │ return [Element.type, changeTitle]                   │    │
  │  │           ↑                                          │    │
  │  │     = TitleComponent (function! KHÔNG có props!)    │    │
  │  │ ↓                                                    │    │
  │  │ <Title /> → TitleComponent({}) → title=undefined ❌│    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  │  FIX 1 — Trả ELEMENT:        FIX 2 — Trả COMPONENT:       │
  │  ┌────────────────────┐      ┌────────────────────┐         │
  │  │ return [Element,   │      │ const Comp = () => │         │
  │  │  changeTitle]      │      │  <TitleComp        │         │
  │  │                    │      │   title={title} /> │         │
  │  │ {Title} ← element │      │                    │         │
  │  │ dùng {}! ✅       │      │ return [Comp,      │         │
  │  └────────────────────┘      │  changeTitle]      │         │
  │                              │                    │         │
  │                              │ <Title/> ← comp   │         │
  │                              │ dùng </>! ✅      │         │
  │                              └────────────────────┘         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### Sơ Đồ 4: 3 Custom Content Patterns

```
  3 CUSTOM CONTENT PATTERNS:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① ELEMENT:                                                  │
  │  ┌────────────────────────────────────────────┐              │
  │  │ <Modal content={<Custom text="hi"/>} />    │              │
  │  │                                            │              │
  │  │ Modal:  {content}  ← render element!      │              │
  │  │                                            │              │
  │  │ ✅ Simple!                                 │              │
  │  │ ❌ Modal KHÔNG thể inject thêm data!      │              │
  │  └────────────────────────────────────────────┘              │
  │                                                              │
  │  ② COMPONENT:                                                │
  │  ┌────────────────────────────────────────────┐              │
  │  │ <Timer content={CustomContent} />           │              │
  │  │                                            │              │
  │  │ Timer:  <Content time={time}/>             │              │
  │  │         ↑ inject data NỘI BỘ!            │              │
  │  │                                            │              │
  │  │ ✅ Inject internal data!                   │              │
  │  │ ❌ Convention phải match props name!       │              │
  │  └────────────────────────────────────────────┘              │
  │                                                              │
  │  ③ RENDER PROPS:                                             │
  │  ┌────────────────────────────────────────────┐              │
  │  │ <Timer renderContent={(time) =>            │              │
  │  │   <Custom time={time}/>                    │              │
  │  │ }/>                                        │              │
  │  │                                            │              │
  │  │ Timer:  {renderContent(time)}              │              │
  │  │         ↑ gọi function!                   │              │
  │  │                                            │              │
  │  │ ✅ LINH HOẠT NHẤT!                       │              │
  │  │ ✅ User quyết định cách dùng data!       │              │
  │  └────────────────────────────────────────────┘              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §11. Tự Viết — ElementComponentEngine!

```javascript
/**
 * ElementComponentEngine — Mô phỏng Element vs Component!
 * Tự viết bằng tay, KHÔNG dùng thư viện!
 */
var ElementComponentEngine = (function () {

  var log = [];
  function reset() { log = []; }

  // ═══════════════════════════════════
  // 1. createElement — Tạo Element!
  // ═══════════════════════════════════
  var REACT_ELEMENT_TYPE = 'Symbol(react.element)';

  function createElement(type, props) {
    var children = [];
    for (var i = 2; i < arguments.length; i++) {
      children.push(arguments[i]);
    }

    var element = {
      '$$typeof': REACT_ELEMENT_TYPE,
      type: type,
      props: Object.assign({}, props || {}, {
        children: children.length === 1 ? children[0] :
          children.length > 0 ? children : undefined
      }),
      key: null,
      ref: null
    };

    log.push('[createElement] type=' +
      (typeof type === 'function' ? type.name : type) +
      ' → Element!');
    return element;
  }

  // ═══════════════════════════════════
  // 2. ELEMENT vs COMPONENT
  // ═══════════════════════════════════
  function simulateElementVsComponent() {
    log.push('=== Element vs Component ===');

    // Component = function!
    function Welcome(props) {
      return createElement('h1', null, 'Hello, ' + props.name);
    }

    log.push('typeof Welcome = ' + typeof Welcome +
      ' → COMPONENT!');

    // Element = createElement kết quả!
    var element = createElement('h1', { className: 'greet' },
      'Hello!');
    log.push('typeof element = ' + typeof element +
      ' → ELEMENT!');
    log.push('element.$$typeof = ' + element['$$typeof']);
    log.push('element.type = ' + element.type);
    log.push('element.props = ' + JSON.stringify(element.props));

    // Component tạo ra Element!
    var compElement = createElement(Welcome, { name: 'Sara' });
    log.push('');
    log.push('createElement(Welcome, {name:"Sara"}) →');
    log.push('  type = ' + compElement.type.name + ' (function!)');
    log.push('  props = ' + JSON.stringify(compElement.props));

    // React gọi component → element!
    log.push('');
    log.push('React gọi Welcome({name:"Sara"}) →');
    var result = Welcome({ name: 'Sara' });
    log.push('  result.type = ' + result.type);
    log.push('  result.props = ' + JSON.stringify(result.props));
    log.push('  → DOM element! type = string!');

    return { component: Welcome, element: element };
  }

  // ═══════════════════════════════════
  // 3. useTitle PROBLEM
  // ═══════════════════════════════════
  function simulateUseTitleProblem() {
    log.push('=== useTitle Problem ===');

    function TitleComponent(props) {
      return createElement('div', null, props.title || 'UNDEFINED!');
    }

    // Bug version
    var title = 'default title';
    var Element = createElement(TitleComponent, { title: title });

    log.push('Element = ' + JSON.stringify({
      type: Element.type.name,
      props: Element.props
    }));
    log.push('Element.type = ' + Element.type.name +
      ' (function!)');

    // return [Element.type, changeTitle] → BUG!
    var Title = Element.type; // = TitleComponent (NO props!)
    log.push('');
    log.push('BUG: return [Element.type] →');
    log.push('Title = ' + Title.name + ' (function, NO props!)');

    // <Title /> → TitleComponent({}) → undefined!
    var bugResult = Title({});
    log.push('<Title /> → title=' +
      (bugResult.props.children || 'undefined') + ' ❌');

    // Fix 1: return Element!
    log.push('');
    log.push('FIX 1: return [Element] →');
    log.push('  {Title} → render element directly! ✅');
    log.push('  Element.props.title = ' + Element.props.title);

    // Fix 2: return Component!
    log.push('');
    log.push('FIX 2: return [() => <TitleComp title={title}/>] →');
    var FixedComponent = function () {
      return createElement(TitleComponent, { title: title });
    };
    var fixResult = FixedComponent({});
    log.push('  <Title /> → component với title! ✅');

    return { bugTitle: Title, fixedComponent: FixedComponent };
  }

  // ═══════════════════════════════════
  // 4. CUSTOM CONTENT PATTERNS
  // ═══════════════════════════════════
  function simulateCustomContent() {
    log.push('=== Custom Content Patterns ===');

    function CustomContent(props) {
      return createElement('div', null, props.text || props.time);
    }

    // Pattern 1: Pass Element!
    log.push('--- Pattern 1: Element ---');
    var contentElement = createElement(CustomContent, {text:'hello'});
    log.push('content = Element (object!)');
    log.push('Modal: {content} → render trực tiếp!');
    log.push('Modal KHÔNG inject được data! ❌');

    // Pattern 2: Pass Component!
    log.push('');
    log.push('--- Pattern 2: Component ---');
    log.push('content = CustomContent (function!)');
    var time = '10:30:00';
    var rendered = CustomContent({ time: time });
    log.push('Timer: <Content time={time}/> →');
    log.push('  rendered = ' + rendered.props.children + ' ✅');
    log.push('Timer CÓ THỂ inject data nội bộ! ✅');

    // Pattern 3: Render Props!
    log.push('');
    log.push('--- Pattern 3: Render Props ---');
    var renderContent = function (time) {
      return createElement(CustomContent, { time: time });
    };
    log.push('renderContent = function(time) → Element!');
    var rpResult = renderContent('11:45:00');
    log.push('Timer: {renderContent(time)} →');
    log.push('  User quyết định cách dùng time! ✅');
    log.push('  LINH HOẠT NHẤT! ✅');

    return { contentElement: contentElement };
  }

  // ═══════════════════════════════════
  // DEMO
  // ═══════════════════════════════════
  function demo() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║  ELEMENT vs COMPONENT ENGINE — DEMO         ║');
    console.log('╚═══════════════════════════════════════════╝');

    // 1. Element vs Component
    console.log('\n--- 1. ELEMENT vs COMPONENT ---');
    reset(); simulateElementVsComponent();
    log.forEach(function (l) { console.log('  ' + l); });

    // 2. useTitle Problem
    console.log('\n--- 2. useTitle PROBLEM ---');
    reset(); simulateUseTitleProblem();
    log.forEach(function (l) { console.log('  ' + l); });

    // 3. Custom Content
    console.log('\n--- 3. CUSTOM CONTENT ---');
    reset(); simulateCustomContent();
    log.forEach(function (l) { console.log('  ' + l); });

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  ✅ Demo Complete!                           ║');
    console.log('╚═══════════════════════════════════════════╝');
  }

  return {
    createElement: createElement,
    simulateElementVsComponent: simulateElementVsComponent,
    simulateUseTitleProblem: simulateUseTitleProblem,
    simulateCustomContent: simulateCustomContent,
    demo: demo, reset: reset
  };
})();

// Chạy: ElementComponentEngine.demo();
```

---

## §12. Câu Hỏi Luyện Tập!

### ❓ Câu 1: React Element là gì?

**Trả lời:**

- React Element = **JS OBJECT** mô tả UI!
- Tạo bởi **JSX** → Babel transform → **React.createElement()**!
- Kết quả: `{ $$typeof, type, props, key, ref }`
- `type = string` ('div', 'h1'...) → **DOM element**!
- `type = function/class` → **Component**!
- Element là **IMMUTABLE** — tạo xong không thay đổi!
- Dùng trong JSX: `{element}` (embedded expression!)

### ❓ Câu 2: React Component là gì?

**Trả lời:**

- React Component = **FUNCTION** hoặc **CLASS**!
- Nhận **props** → trả về **Element**!
- Là "nhà máy" SẢN XUẤT elements!
- `typeof Component = 'function'`
- Dùng trong JSX: `<Component />` (HTML tag syntax!)
- Babel transform: `<Comp />` → `createElement(Comp, {})`

### ❓ Câu 3: Element và Component khác nhau thế nào?

**Trả lời:**

| | Element | Component |
|---|---|---|
| **Bản chất** | JS Object | Function/Class |
| **typeof** | 'object' | 'function' |
| **Có $$typeof?** | ✅ Có | ❌ Không |
| **Mô tả** | WHAT hiển thị | HOW tạo element |
| **Immutable?** | ✅ Bất biến | ❌ Có state |
| **JSX syntax** | `{element}` | `<Component />` |
| **Tạo bởi** | createElement | Developer viết |

**Quy tắc vàng**: Element → `{}`, Component → `</>` !

### ❓ Câu 4: Bài toán useTitle sai ở đâu?

**Trả lời:**

```
createElement(TitleComponent, {title}) → Element
Element = { type: TitleComponent, props: {title} }
return [Element.type, changeTitle]
         ↑
Element.type = TitleComponent (function! KHÔNG CÓ title prop!)
<Title /> → TitleComponent({}) → title = undefined ❌
```

**Fix 1**: return `[Element, changeTitle]` → dùng `{Title}` (element!)
**Fix 2**: return `[() => <TitleComp title={title}/>]` → dùng `<Title />` (component!)

### ❓ Câu 5: 3 cách custom content — so sánh?

**Trả lời:**

| Cách | Truyền gì? | Inject data nội bộ? | Linh hoạt? |
|---|---|---|---|
| **Element** | `content={<Comp text="hi"/>}` | ❌ Không! | Thấp |
| **Component** | `content={Comp}` | ✅ `<Content time={time}/>` | Trung bình |
| **Render Props** | `renderContent={(time) => ...}` | ✅ `{renderContent(time)}` | **Cao nhất!** |

- **Element**: Simple, props đóng gói sẵn, container không inject được!
- **Component**: Container inject data, nhưng phải tuân theo convention!
- **Render Props**: User quyết định cách dùng data! Phổ biến nhất!

### ❓ Câu 6: Render Props và Children as Function khác gì?

**Trả lời:**

```jsx
// Render Props (attribute):
<Timer renderContent={(time) => <Custom time={time}/>} />

// Children as Function:
<Timer>
  {(time) => <Custom time={time}/>}
</Timer>
```

- **Render Props**: dùng prop attribute, có thể **NHIỀU** render functions!
- **Children as Function**: dùng children, syntax **cleaner**, chỉ **1** function!
- Cả 2 đều thuộc **Render Props pattern**!
- Children as Function chỉ là BIẾN THỂ của Render Props!

### ❓ Câu 7: createElement trả về cấu trúc gì?

**Trả lời:**

```javascript
React.createElement('h1', {className: 'greet'}, 'Hello!')
→ {
    $$typeof: Symbol(react.element),  // marker!
    type: 'h1',                        // string = DOM!
    props: {
      className: 'greet',
      children: 'Hello!'
    },
    key: null,
    ref: null
  }

React.createElement(Welcome, {name: 'Sara'})
→ {
    $$typeof: Symbol(react.element),
    type: Welcome,                     // function = component!
    props: { name: 'Sara' },
    key: null,
    ref: null
  }
```

- `type = string` → React tạo **DOM element**!
- `type = function` → React **GỌI function** → nhận element → tiếp tục!
- `type = class` → React **new Class() → render()** → nhận element!

---

> 🎯 **Tổng kết React Element vs Component:**
> - **Element**: JS Object, `{ $$typeof, type, props }`, IMMUTABLE, dùng `{element}`!
> - **Component**: Function/Class, nhận props → trả element, dùng `<Component />`!
> - **Quy tắc**: Element → `{}`, Component → `</>` — NHẦM = LỖI!
> - **useTitle bug**: `Element.type` = function không props → undefined!
> - **Fix 1**: trả Element → `{Title}` | **Fix 2**: trả Component → `<Title />`!
> - **Custom content 3 cách**: Element (simple), Component (inject data), Render Props (linh hoạt nhất!)
> - **Children as Function**: biến thể của Render Props, syntax cleaner!
> - **ElementComponentEngine** tự viết: createElement, element vs component, useTitle problem, custom content!
> - **7 câu hỏi** luyện tập với đáp án chi tiết!
