# React Virtual DOM — Rendering Internals Deep Dive

> 📅 2026-02-13 · ⏱ 25 phút đọc
>
> Phân tích chuyên sâu từ source code: JSX → createElement → ReactElement
> → instantiateReactComponent → mountComponent → Real DOM
> Batch Processing, Transaction, DOMLazyTree, $$typeof XSS Prevention, Event Delegation
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | React Source Code Level Interview

---

## Mục Lục

| #   | Phần                                      |
| --- | ----------------------------------------- |
| 1   | Virtual DOM là gì? Tại sao dùng?          |
| 2   | JSX & createElement — Source Code         |
| 3   | ReactElement — Cấu trúc & $$typeof XSS    |
| 4   | Quy trình Rendering — 4 Process           |
| 5   | Process 1: Xử lý tham số ban đầu          |
| 6   | Process 2: Batch Processing & Transaction |
| 7   | Process 3: Sinh HTML — mountComponent     |
| 8   | Process 4: Render HTML — DOMLazyTree      |
| 9   | Event Delegation — Cơ chế sự kiện ảo      |
| 10  | Viết React component hiệu năng cao        |
| 11  | Tổng kết & Checklist phỏng vấn            |

---

## §1. Virtual DOM là gì? Tại sao dùng?

```
VIRTUAL DOM — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  Trong ứng dụng native:
  → JS trực tiếp tạo/sửa DOM elements
  → DOM elements giao tiếp qua events

  Trong React:
  → React KHÔNG thao tác DOM trực tiếp!
  → Code → JavaScript Object (Virtual DOM!) → Real DOM

  VÍ DỤ:
  ┌─── HTML ────────────────────────────────────┐
  │ <div class="title">                         │
  │     <span>Hello ConardLi</span>             │
  │     <ul>                                    │
  │         <li>苹果</li>                        │
  │         <li>橘子</li>                        │
  │     </ul>                                   │
  │ </div>                                      │
  └─────────────────────────────────────────────┘
            ↕ React biểu diễn dưới dạng:
  ┌─── Virtual DOM Object ─────────────────────┐
  │ {                                           │
  │   type: 'div',                              │
  │   props: { class: 'title' },                │
  │   children: [                               │
  │     { type: 'span',                         │
  │       children: 'Hello ConardLi' },         │
  │     { type: 'ul',                           │
  │       children: [                           │
  │         { type: 'li', children: '苹果' },    │
  │         { type: 'li', children: '橘子' }     │
  │       ] }                                   │
  │   ]                                         │
  │ }                                           │
  └─────────────────────────────────────────────┘

  → Tạo/sửa element = tạo/sửa JS Object!
  → Sau đó Object → Real DOM!
  → Event listening qua Virtual DOM proxy!
```

```
TẠI SAO DÙNG VIRTUAL DOM — 4 LÝ DO:
═══════════════════════════════════════════════════════════════

  ① NÂNG CAO HIỆU SUẤT PHÁT TRIỂN:
  → Chỉ cần khai báo VIEW muốn ở STATE nào
  → React tự cập nhật DOM cho bạn!
  → Không cần thao tác DOM thủ công!
  → Tập trung vào business logic!

  ② "CẢI THIỆN" HIỆU NĂNG:
  ⚠️ VIRTUAL DOM KHÔNG phải lúc nào cũng nhanh hơn DOM!
  → Lần render đầu tiên: VDOM CHẬM hơn (thêm computation + memory!)
  → Ưu thế ở RE-RENDER: Diff algorithm tính toán TRƯỚC
     → Chỉ cập nhật PHẦN THAY ĐỔI → ít DOM operations!
  → Thực chất: VDOM giúp "tính toán cách update TỐI ƯU hơn"
  → Không phải "nhanh hơn DOM" — mà "nhanh hơn NAIVE DOM update!"

  ③ TƯƠNG THÍCH CROSS-BROWSER:
  → React tự implement event mechanism!
  → Mô phỏng event bubbling + capturing
  → Event delegation + batch updates
  → → Xóa bỏ vấn đề event compatibility giữa browsers!
  → SyntheticEvent: cross-browser wrapper cho native events!

  ④ TƯƠNG THÍCH CROSS-PLATFORM:
  → Virtual DOM = abstraction layer!
  → React DOM → Web (div, span, p...)
  → React Native → iOS/Android (UIView, TextView...)
  → React VR → VR apps
  → CÙNG Virtual DOM → KHÁC platform render!
```

---

## §2. JSX & createElement — Source Code

```
JSX → createElement — QUÁI TRÌNH BIÊN DỊCH:
═══════════════════════════════════════════════════════════════

  JSX KHÔNG PHẢI JavaScript hợp lệ!
  → Cần BABEL biên dịch JSX → React.createElement()

  CÓ 2 CÁCH VIẾT TƯƠNG ĐƯƠNG:

  ① JSX (Syntactic Sugar):
  class Hello extends Component {
      render() {
          return <div>Hello ConardLi</div>;
      }
  }

  ② React.createElement (Trực tiếp):
  class Hello extends Component {
      render() {
          return React.createElement('div', null, 'Hello ConardLi');
      }
  }

  → JSX chỉ là "đường cú pháp" cho createElement()!
  → Babel plugin: babel-plugin-transform-react-jsx
  → Config: { "pragma": "React.createElement" }
```

```javascript
// ═══ BABEL TRANSFORM VÍ DỤ ═══

// JSX Input:
<div>
    <img src="avatar.png" className="profile" />
    <Hello />
</div>

// Babel Output:
React.createElement("div", null,
    React.createElement("img", {      // ← chữ thường = string "img"!
        src: "avatar.png",
        className: "profile"
    }),
    React.createElement(Hello, null)   // ← CHỮ HOA = object/function Hello!
);

// ⚠️ QUY TẮC VIẾT HOA:
// → Chữ thường (div, span) → Babel biên dịch thành STRING → native DOM!
// → Chữ HOA (Hello, MyComponent) → Babel biên dịch thành OBJECT → custom component!
// → VÌ VẬY custom component PHẢI viết hoa chữ đầu! Nếu không → "div" thay vì Hello!

// ⚠️ KHÔNG THỂ dùng dynamic type trong JSX trực tiếp:
// ❌ Sai:
function Story(props) {
    return <components[props.storyType] story={props.story} />;
    //      ^ JSX type KHÔNG được là expression!
}

// ✅ Đúng — gán vào biến viết HOA trước:
function Story(props) {
    const SpecificStory = components[props.storyType];
    return <SpecificStory story={props.story} />;
}
```

```javascript
// ═══ createElement SOURCE CODE (đã đơn giản hóa) ═══

ReactElement.createElement = function (type, config, children) {
  var propName;
  var props = {};
  var key = null;
  var ref = null;
  var self = null;
  var source = null;

  // ═══ BƯỚC 1: XỬ LÝ PROPS ═══
  if (config != null) {
    // 1.1: Trích xuất ref (special prop!)
    if (hasValidRef(config)) {
      ref = config.ref;
    }
    // 1.2: Trích xuất key (special prop!)
    if (hasValidKey(config)) {
      key = "" + config.key; // Ép thành string!
    }

    // 1.3: Trích xuất self & source (debug only!)
    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;

    // 1.4: Copy props — BỎ QUA ref, key, __self, __source!
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName];
      }
    }
  }

  // ═══ BƯỚC 2: XỬ LÝ CHILDREN ═══
  var childrenLength = arguments.length - 2; // Tất cả args sau config!
  if (childrenLength === 1) {
    props.children = children; // 1 child → trực tiếp!
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray; // Nhiều children → array!
  }

  // ═══ BƯỚC 3: XỬ LÝ DEFAULT PROPS ═══
  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  // ═══ BƯỚC 4: TẠO REACT ELEMENT ═══
  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props,
  );
};
```

---

## §3. ReactElement — Cấu trúc & $$typeof XSS

```
REACT ELEMENT — CẤU TRÚC ĐẦY ĐỦ:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ ReactElement Object                                      │
  ├──────────────────────────────────────────────────────────┤
  │ $$typeof:  Symbol(react.element)  ← NGĂN XSS! 🛡️       │
  │           hoặc 0xeac7 (nếu không hỗ trợ Symbol)        │
  ├──────────────────────────────────────────────────────────┤
  │ type:     'div' | 'span'          ← Native HTML (string)│
  │           MyComponent             ← Custom (function)    │
  │           class App               ← Custom (class)       │
  ├──────────────────────────────────────────────────────────┤
  │ key:      string | null           ← Unique ID cho Diff!  │
  ├──────────────────────────────────────────────────────────┤
  │ ref:      React.createRef() | function | null            │
  │           ← Truy cập native DOM node!                    │
  ├──────────────────────────────────────────────────────────┤
  │ props:    { className, style, onClick, children... }     │
  │           ← children: array (nhiều) hoặc object (1 con) │
  ├──────────────────────────────────────────────────────────┤
  │ _owner:   Component đang được construct                  │
  ├──────────────────────────────────────────────────────────┤
  │ _self:    (Non-production) component instance hiện tại   │
  │ _source:  (Non-production) fileName + lineNumber debug   │
  └──────────────────────────────────────────────────────────┘
```

```javascript
// ═══ $$typeof & XSS PREVENTION ═══

var REACT_ELEMENT_TYPE =
  (typeof Symbol === "function" && Symbol.for && Symbol.for("react.element")) ||
  0xeac7; // ← "0xeac7" trông giống "React" 😄

// TẠI SAO CẦN $$typeof?
// Attack scenario — Server vulnerability:

// ❌ Server trả về JSON chứa mã độc:
let expectedTextButGotJSON = {
  type: "div",
  props: {
    dangerouslySetInnerHTML: {
      __html: "/* YOUR EXPLOIT HERE — XSS! */",
    },
  },
};

// Client render:
let message = { text: expectedTextButGotJSON };
<p>{message.text}</p>;
// → Nếu không có $$typeof → React render div với innerHTML → XSS! 💀

// ✅ NHƯNG — JSON KHÔNG THỂ chứa Symbol!
// → JSON.stringify(Symbol.for('react.element')) → undefined!
// → Server KHÔNG THỂ inject $$typeof: Symbol(react.element) vào JSON!
// → React KIỂM TRA $$typeof trước khi render:

ReactElement.isValidElement = function (object) {
  return (
    typeof object === "object" &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE // ← Symbol check!
  );
};

// → Object từ JSON KHÔNG CÓ $$typeof hợp lệ → React BỎ QUA!
// → XSS bị CHẶN! 🛡️

// ⚠️ Khi browser không hỗ trợ Symbol:
// → $$typeof = 0xeac7 (number)
// → Vẫn an toàn VÌ server-side không tự thêm field này!
// → Nhưng KHÔNG an toàn bằng Symbol version!
```

---

## §4. Quy trình Rendering — 4 Process

```
VIRTUAL DOM → REAL DOM — TỔNG QUAN 4 BƯỚC:
═══════════════════════════════════════════════════════════════

  ReactDOM.render(element, container)
       │
       ▼
  ┌──────────────────────────────────────────────────────────┐
  │ PROCESS 1: XỬ LÝ THAM SỐ BAN ĐẦU                      │
  │ → render() → _renderSubtreeIntoContainer()              │
  │ → Wrap component trong TopLevelWrapper                   │
  │ → Kiểm tra: update hay mount mới?                       │
  └──────────────────┬───────────────────────────────────────┘
                     ▼
  ┌──────────────────────────────────────────────────────────┐
  │ PROCESS 2: BATCH PROCESSING & TRANSACTION               │
  │ → _renderNewRootComponent()                              │
  │ → ReactUpdates.batchedUpdates()                          │
  │ → transaction.perform()                                  │
  │ → Gộp multiple updates thành 1 batch!                    │
  └──────────────────┬───────────────────────────────────────┘
                     ▼
  ┌──────────────────────────────────────────────────────────┐
  │ PROCESS 3: SINH HTML (mountComponent)                    │
  │ → instantiateReactComponent() → 4 loại component:       │
  │   ├── ReactDOMEmptyComponent (empty)                     │
  │   ├── ReactDOMTextComponent (text)                       │
  │   ├── ReactDOMComponent (native DOM)                     │
  │   └── ReactCompositeComponent (custom React component)   │
  │ → mountComponent() → sinh markup / DOMLazyTree           │
  └──────────────────┬───────────────────────────────────────┘
                     ▼
  ┌──────────────────────────────────────────────────────────┐
  │ PROCESS 4: RENDER HTML VÀO CONTAINER                     │
  │ → _mountImageIntoNode()                                  │
  │ → DOMLazyTree.insertTreeBefore()                         │
  │ → IE/Edge: chèn từng node riêng! (performance!)         │
  │ → Browsers khác: chèn 1 lần cả tree!                    │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Process 1: Xử lý tham số ban đầu

```javascript
// ═══ PROCESS 1: INITIAL PARAMETER HANDLING ═══

// ReactDOM.render() gọi nội bộ:
render: function(nextElement, container, callback) {
    return ReactMount._renderSubtreeIntoContainer(
        null, nextElement, container, callback
    );
},

// _renderSubtreeIntoContainer thực hiện:

// BƯỚC 1.1: Wrap component trong TopLevelWrapper
// → Tại sao? Để thống nhất xử lý native DOM và React component!
TopLevelWrapper.prototype.render = function() {
    return this.props.child;  // ← trả về component gốc!
};
// → ReactDOM.render(<App />, container)
// → Thực tế render: <TopLevelWrapper><App /></TopLevelWrapper>
// → TopLevelWrapper cung cấp rootID + render()
// → FE/BE/Native component đều xử lý giống nhau!

// BƯỚC 1.2: Kiểm tra root node đã có component render chưa?
// → Nếu CÓ: quyết định UPDATE hay UNMOUNT
// → Nếu CHƯA: mount mới (initial render!)

// BƯỚC 1.3: Xử lý shouldReuseMarkup
// → Biến xác định có cần re-tag element không
// → Server-side rendering: tái sử dụng markup có sẵn!

// BƯỚC 1.4: Gọi _renderNewRootComponent()
// → Truyền tham số đã xử lý
// → Render xong → gọi callback!
```

---

## §6. Process 2: Batch Processing & Transaction

```
BATCH PROCESSING:
═══════════════════════════════════════════════════════════════

  TẢI SAO CẦN BATCH?
  → Nhiều setState() liên tiếp → NHIỀU re-renders → CHẬM!
  → Batch: gộp all updates → 1 lần render duy nhất!

  _renderNewRootComponent() gọi:
  ReactUpdates.batchedUpdates(
      batchedMountComponentIntoNode,
      componentInstance,
      container,
      shouldReuseMarkup,
      context
  );

  → batchedUpdates: đánh dấu "đang trong batch"
  → Tất cả setState() trong batch → QUEUE lại
  → Kết thúc batch → flush TẤT CẢ updates 1 lần!
```

```
TRANSACTION MECHANISM:
═══════════════════════════════════════════════════════════════

  Transaction = wrapper thực thi code với TRƯỚC + SAU hooks!

  ┌──────────────────────────────────────────────────┐
  │ Transaction.perform(method)                       │
  │                                                   │
  │  initialize() → method() → close()               │
  │  (setup!)       (work!)    (cleanup!)             │
  │                                                   │
  │  Wrappers (có thể nhiều!):                        │
  │  ┌─ wrapper1.init ─┐                              │
  │  │ ┌─ wrapper2.init ─┐                            │
  │  │ │   method()       │                            │
  │  │ └─ wrapper2.close ─┘                            │
  │  └─ wrapper1.close ─┘                              │
  └──────────────────────────────────────────────────┘

  → Trong _renderNewRootComponent:
  transaction.perform(
      mountComponentIntoNode,
      null,
      componentInstance, container, transaction,
      shouldReuseMarkup, context
  );

  → Transaction đảm bảo:
  → ① initialize: lock batch (không flush giữa chừng!)
  → ② perform: mount component (sinh DOM!)
  → ③ close: unlock + flush all pending updates!

  ⚠️ setState() trong transaction:
  → Không re-render NGAY → queue → flush khi close!
  → VÌ VẬY setState "bất đồng bộ" trong event handlers!
```

---

## §7. Process 3: Sinh HTML — mountComponent

```
instantiateReactComponent — PHÂN LOẠI COMPONENT:
═══════════════════════════════════════════════════════════════

  React nhận element → phân loại thành 4 LOẠI:

  ┌───────────────────────────────────────────────────────────┐
  │ Input                  │ Component Type                   │
  ├───────────────────────────────────────────────────────────┤
  │ null / false           │ ReactDOMEmptyComponent            │
  │                        │ → Comment node: <!-- -->          │
  ├───────────────────────────────────────────────────────────┤
  │ string / number        │ ReactDOMTextComponent             │
  │                        │ → Text node: document.createText..│
  ├───────────────────────────────────────────────────────────┤
  │ type = string          │ ReactDOMComponent                 │
  │ ('div', 'span'...)     │ → Native DOM: document.create..   │
  ├───────────────────────────────────────────────────────────┤
  │ type = function/class  │ ReactCompositeComponent            │
  │ (MyApp, Button...)     │ → Custom component: gọi render()!│
  └───────────────────────────────────────────────────────────┘

  MỖI LOẠI đều có 3 methods:
  → construct():        nhận ReactElement, khởi tạo data
  → mountComponent():   sinh DOM thật hoặc DOMLazyTree
  → unmountComponent():  gỡ DOM, unbind events, cleanup
```

```javascript
// ═══ ReactDOMComponent.mountComponent ═══
// (Đã đơn giản hóa từ source code)

mountComponent: function(transaction, hostParent, hostContainerInfo, context) {
    // BƯỚC 3.1: Xử lý props đặc biệt của DOM tag
    // → style, dangerouslySetInnerHTML, autoFocus, etc.

    // BƯỚC 3.2: Tạo DOM node theo tag type
    var el = document.createElement(this._currentElement.type);
    // → <div>, <span>, <input>...

    // BƯỚC 3.3: Gán props vào DOM node
    this._updateDOMProperties(null, props, transaction);
    // → Param 1 = lastProps (null = lần đầu!)
    // → Param 2 = nextProps (props hiện tại!)
    // → Set attributes, event listeners, styles!

    // BƯỚC 3.4: Tạo DOMLazyTree + render children
    var lazyTree = DOMLazyTree(el);
    this._createInitialChildren(transaction, props, context, lazyTree);
    // → Render children → gán vào DOMLazyTree!

    return lazyTree;
},

// ═══ ReactCompositeComponent.mountComponent ═══

mountComponent: function(transaction, hostParent, hostContainerInfo, context) {
    // BƯỚC 1: Xử lý props, context, tạo instance
    var inst = new Component(props, context);
    // → Class component: new MyComponent(props)
    // → Function component: gọi trực tiếp!

    // BƯỚC 2: Xử lý stateless component
    // → Function component trả về ReactElement trực tiếp

    // BƯỚC 3: performInitialMount — GỌI LIFECYCLE!
    // → componentWillMount() ← (UNSAFE! Deprecated!)
    // → render() → lấy child elements
    // → mountComponent() cho children → ĐỆ QUY!
    //   → Children có thể là ReactDOMComponent HOẶC
    //     ReactCompositeComponent → lặp lại toàn bộ!

    // BƯỚC 4: componentDidMount()
    // → DOM đã mount → an toàn để truy cập refs!

    return markup;
},

// ═══ ĐỆ QUY ═══
// <App>                     → ReactCompositeComponent
//   → render() trả về:
//   <div>                   → ReactDOMComponent
//     <Header />            → ReactCompositeComponent (đệ quy!)
//       → render() trả về:
//       <nav>               → ReactDOMComponent
//         <a>Home</a>       → ReactDOMComponent + ReactDOMTextComponent
//     <Content />           → ReactCompositeComponent (đệ quy!)
//       → ...
// → Khi TẤT CẢ leaf nodes đã mount → bubble up markup!
```

---

## §8. Process 4: Render HTML — DOMLazyTree

```
DOMLazyTree — TỐI ƯU CHO IE/EDGE:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: Trong IE(8-11) và Edge cũ:
  → Chèn node TỪNG CÁI → NHANH HƠN chèn cả tree! 😱
  → Ngược với Chrome/Firefox: chèn cả tree 1 lần = nhanh!

  GIẢI PHÁP — DOMLazyTree:
  → Wrapper object quanh DOM node!
  → Cached children, HTML, text → chèn SAU!

  ┌─── DOMLazyTree Object ─────────────────────┐
  │ node:     DOM element thật                  │
  │ children: [] ← child nodes cached!          │
  │ html:     '' ← innerHTML cached!            │
  │ text:     '' ← text content cached!         │
  └─────────────────────────────────────────────┘

  3 methods: queueChild, queueHTML, queueText
  → Mỗi method kiểm tra enableLazy flag!
```

```javascript
// ═══ DOMLazyTree — LAZY INSERT LOGIC ═══

var enableLazy =
  (typeof document !== "undefined" &&
    typeof document.documentMode === "number") || // ← IE!
  (typeof navigator !== "undefined" &&
    typeof navigator.userAgent === "string" &&
    /\bEdge\/\d/.test(navigator.userAgent)); // ← Edge cũ!

// enableLazy = true: IE/Edge → cache nodes → chèn SAU từng cái!
// enableLazy = false: Chrome/Firefox → chèn NGAY vào node!

function queueChild(parentTree, childTree) {
  if (enableLazy) {
    parentTree.children.push(childTree); // Cache lại!
  } else {
    parentTree.node.appendChild(childTree.node); // Chèn ngay!
  }
}

function queueText(tree, text) {
  if (enableLazy) {
    tree.text = text; // Cache text!
  } else {
    tree.node.textContent = text; // Set ngay!
  }
}

// ═══ insertTreeBefore — CHÈN VÀO CONTAINER ═══
function insertTreeBefore(parentNode, tree, referenceNode) {
  // Trường hợp đặc biệt: fragment hoặc <object>:
  if (
    tree.node.nodeType === DOCUMENT_FRAGMENT_NODE ||
    tree.node.nodeName === "OBJECT"
  ) {
    // → Render children TRƯỚC → rồi chèn parent!
    insertTreeChildren(tree);
    parentNode.insertBefore(tree.node, referenceNode);
  } else {
    // → Chèn parent TRƯỚC → rồi render children!
    parentNode.insertBefore(tree.node, referenceNode);
    insertTreeChildren(tree);
  }
}

function insertTreeChildren(tree) {
  if (!enableLazy) return; // Chrome/FF: children đã chèn rồi!

  // IE/Edge: chèn cached children TỪNG CÁI:
  var children = tree.children;
  for (var i = 0; i < children.length; i++) {
    insertTreeBefore(tree.node, children[i], null); // Đệ quy!
  }

  // Render cached HTML:
  if (tree.html != null) {
    tree.node.innerHTML = tree.html;
  }

  // Render cached text:
  if (tree.text != null) {
    tree.node.textContent = tree.text;
  }
}

// ═══ KẾT QUẢ ═══
// IE/Edge: node1.insert → node2.insert → node3.insert (TỪNG CÁI!)
// Chrome/FF: buildTree → container.insert(tree) (1 LẦN!)
// → Cùng output nhưng KHÁC chiến lược → tối ưu cho từng browser!
```

---

## §9. Event Delegation — Cơ chế sự kiện ảo

```
REACT EVENT SYSTEM — DELEGATION:
═══════════════════════════════════════════════════════════════

  React KHÔNG bind event vào từng DOM node!
  → Tất cả events → DELEGATE lên document (React 16)
                   → hoặc root container (React 17+)!

  ┌──────────────────────────────────────────────────────┐
  │ <div onClick={...}>                                   │
  │   <button onClick={handleClick}>                      │
  │     Click me                                          │
  │   </button>                                           │
  │ </div>                                                │
  │                                                       │
  │ THỰC TẾ:                                              │
  │ → button: KHÔNG CÓ onclick attribute!                 │
  │ → document (hoặc root): addEventListener('click')!    │
  │ → Khi click → event bubble lên document               │
  │ → React dispatch: tìm component → gọi handler!       │
  └──────────────────────────────────────────────────────┘

  TẠI SAO DELEGATION?
  ① HIỆU NĂNG: 1000 buttons = 1 listener (không phải 1000!)
  ② DYNAMIC: element thêm/xóa linh hoạt, không cần add/remove listeners!
  ③ CROSS-BROWSER: React tự normalize events!
```

```javascript
// ═══ SYNTHETIC EVENT ═══

// React tạo SyntheticEvent — wrapper cross-browser:
function handleClick(event) {
  // event = SyntheticEvent (KHÔNG phải native event!)
  console.log(event.type); // 'click'
  console.log(event.target); // DOM element clicked
  console.log(event.nativeEvent); // Native browser event!

  event.stopPropagation(); // Hoạt động như native!
  event.preventDefault(); // Hoạt động như native!
}

// SyntheticEvent features:
// ① Cross-browser compatible interface!
// ② Event pooling (React <17): reuse event objects → performance!
// ③ Mô phỏng bubbling + capturing qua Virtual DOM tree!
// ④ Batch updates: setState trong event → batched!

// ⚠️ React 17+: event delegate vào root container (không phải document!)
// → Cho phép nhiều React apps trên cùng 1 trang!
// → Event pooling bị BỎ (không cần event.persist() nữa!)

// ⚠️ CAPTURE PHASE:
<div onClickCapture={handleCapture}>
  {" "}
  // ← thêm "Capture"!
  <button onClick={handleClick}>Click</button>
</div>;
// → handleCapture chạy TRƯỚC handleClick!
```

---

## §10. Viết React component hiệu năng cao

```
PERFORMANCE OPTIMIZATION PRINCIPLES:
═══════════════════════════════════════════════════════════════

  Dựa trên hiểu biết Virtual DOM + Rendering:

  ① GIẢM RE-RENDER KHÔNG CẦN THIẾT:
  → React.memo() cho function components
  → PureComponent cho class components
  → shouldComponentUpdate() cho manual control
  → useMemo/useCallback cho expensive computations/callbacks

  ② TỐI ƯU KEY TRONG LISTS:
  → LUÔN dùng stable ID (KHÔNG dùng index!)
  → TRÁNH di chuyển phần tử cuối lên đầu (worst case!)
  → Key giúp React MOVE thay vì REPLACE!

  ③ GIẢM COMPONENT DEPTH:
  → Ít level = ít diff traversal!
  → Flatten component tree khi có thể!
  → React.Fragment thay vì <div> wrapper!

  ④ TỐI ƯU STATE:
  → State CÀNG GẦN nơi dùng CÀNG TỐT (co-location!)
  → Tránh lifting state quá cao → re-render cả subtree!
  → Context: split providers → tránh unnecessary re-renders!

  ⑤ CODE SPLITTING:
  → React.lazy() + Suspense → lazy load components!
  → Dynamic import() → chia bundle nhỏ!
  → Route-based splitting → load khi navigate!
```

```javascript
// ═══ VÍ DỤ TỐI ƯU ═══

// ❌ Mỗi render tạo object MỚI → child LUÔN re-render:
function Parent() {
  return <Child style={{ color: "red" }} />;
  //              ^^ Object mới mỗi render! React.memo vô dụng!
}

// ✅ Stable reference:
const style = { color: "red" };
function Parent() {
  return <Child style={style} />;
  //              ^^ Cùng reference → React.memo skip!
}

// ✅ useMemo cho derived data:
function FilteredList({ items, query }) {
  const filtered = useMemo(
    () => items.filter((item) => item.name.includes(query)),
    [items, query], // Chỉ tính lại khi items/query thay đổi!
  );
  return filtered.map((item) => <Item key={item.id} {...item} />);
}

// ✅ useCallback cho event handlers:
function Parent() {
  const handleClick = useCallback((id) => {
    // handle...
  }, []); // Stable reference!

  return items.map((item) => (
    <MemoizedChild key={item.id} onClick={handleClick} />
  ));
}
```

---

## §11. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  React Virtual DOM Rendering
  ├── Virtual DOM = JS Object đại diện cho DOM thật
  │   ├── Lý do: dev efficiency, "tối ưu" re-render, cross-browser, cross-platform
  │   └── KHÔNG phải luôn nhanh hơn! Value = declarative + batch DOMoptimization
  ├── JSX → Babel → createElement() → ReactElement
  │   ├── Chữ thường = string (native DOM)
  │   └── Chữ HOA = object/function (custom component) → VÌ VẬY PHẢI viết hoa!
  ├── ReactElement: { $$typeof, type, key, ref, props, _owner }
  │   └── $$typeof = Symbol(react.element) → NGĂN XSS! (JSON không chứa Symbol!)
  ├── Rendering 4 Processes:
  │   ├── P1: Wrap TopLevelWrapper → check update/mount → process params
  │   ├── P2: batchedUpdates + Transaction → gộp updates!
  │   ├── P3: instantiateReactComponent → 4 loại (Empty/Text/DOM/Composite)
  │   │   └── mountComponent() đệ quy → sinh markup/DOMLazyTree
  │   └── P4: DOMLazyTree.insertTreeBefore()
  │       ├── IE/Edge: enableLazy=true → chèn TỪNG node!
  │       └── Chrome/FF: enableLazy=false → chèn CẢ tree 1 lần!
  ├── Event Delegation: TẤT CẢ events → root (không phải từng element!)
  │   └── SyntheticEvent: cross-browser wrapper, batch updates, pooling (pre-17)
  └── Performance: React.memo, stable keys, co-locate state, code splitting
```

### Checklist

- [ ] **Virtual DOM**: JS Object đại diện DOM; tạo/sửa Object → diff → patch Real DOM; KHÔNG luôn nhanh hơn nhưng dễ phát triển hơn!
- [ ] **Tại sao VDOM**: ① dev efficiency (declarative) ② "tối ưu" re-render (diff+batch) ③ cross-browser (SyntheticEvent) ④ cross-platform (React Native)
- [ ] **JSX**: syntactic sugar cho createElement(); Babel transform; chữ thường=string, chữ HOA=object → custom component PHẢI viết hoa!
- [ ] **createElement source**: xử lý props (tách ref, key, **self, **source) → xử lý children (1 child vs array) → defaultProps → return ReactElement
- [ ] **ReactElement**: { $$typeof, type, key, ref, props, \_owner }; children nằm trong props; \_self/\_source chỉ non-production
- [ ] **$$typeof XSS**: Symbol(react.element) hoặc 0xeac7; JSON KHÔNG chứa Symbol → server không inject được → ngăn XSS qua dangerouslySetInnerHTML!
- [ ] **isValidElement**: check typeof=object + not null + $$typeof===REACT_ELEMENT_TYPE → lọc component không hợp lệ!
- [ ] **Rendering Process 1**: render→_renderSubtreeIntoContainer→TopLevelWrapper wrap→check existing root→_renderNewRootComponent
- [ ] **Rendering Process 2**: batchedUpdates (gộp updates!) + Transaction (init→perform→close) → setState "async" trong events vì đang trong transaction!
- [ ] **Rendering Process 3**: instantiateReactComponent → 4 loại (Empty/Text/DOM/Composite); mỗi loại có construct/mountComponent/unmountComponent
- [ ] **ReactDOMComponent**: xử lý special props → createElement(type) → \_updateDOMProperties(null, props) → \_createInitialChildren → DOMLazyTree
- [ ] **ReactCompositeComponent**: tạo instance → componentWillMount → render() → mountComponent ĐỆ QUY children → componentDidMount
- [ ] **Rendering Process 4**: DOMLazyTree.insertTreeBefore(); enableLazy=true (IE/Edge) → chèn node TỪNG CÁI; false (Chrome/FF) → chèn cả tree 1 lần
- [ ] **Event Delegation**: tất cả events delegate lên root; SyntheticEvent cross-browser; event pooling (pre-17); React 17+ delegate vào root container
- [ ] **Performance**: React.memo/PureComponent, stable key (NO index!), co-locate state, useMemo/useCallback, React.lazy code splitting

---

_Nguồn: ConardLi — "In-depth analysis of the rendering principles of Virtual DOM" · TikTok Frontend Security Team · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
