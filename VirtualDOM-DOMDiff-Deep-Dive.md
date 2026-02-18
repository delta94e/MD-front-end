# Virtual DOM & DOM-Diff — Deep Dive 🔥

> **Tự viết lại từ số 0** — Không dùng thư viện, hiểu tận gốc cách React hoạt động bên dưới.

---

## §1. Virtual DOM Là Gì?

```
═══════════════════════════════════════════════════════════════
  VIRTUAL DOM = MÔ PHỎNG DOM BẰNG JAVASCRIPT OBJECT!
═══════════════════════════════════════════════════════════════


  REAL DOM (trình duyệt):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  <ul class="list">                                     │
  │    <li class="item">Phong</li>                         │
  │    <li class="item">Hùng</li>                         │
  │    <li class="item">Minh</li>                          │
  │  </ul>                                                 │
  │                                                        │
  │  → Đây là cấu trúc DOM THẬT trong trình duyệt       │
  │  → Mỗi node là 1 object NẶNG NỀ (~100+ properties)  │
  │  → Thao tác DOM thật = CHẬM, TỐN TÀI NGUYÊN!       │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  VIRTUAL DOM (JavaScript):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  {                                                     │
  │    type: 'ul',                                         │
  │    props: { class: 'list' },                           │
  │    children: [                                         │
  │      { type: 'li', props: {class:'item'},              │
  │        children: ['Phong'] },                          │
  │      { type: 'li', props: {class:'item'},              │
  │        children: ['Hùng'] },                          │
  │      { type: 'li', props: {class:'item'},              │
  │        children: ['Minh'] }                            │
  │    ]                                                   │
  │  }                                                     │
  │                                                        │
  │  → Chỉ là 1 PLAIN OBJECT JavaScript!                 │
  │  → NHẸ hơn DOM thật hàng TRĂM LẦN!                  │
  │  → Thao tác object = CỰC NHANH!                      │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  TẠI SAO CẦN VIRTUAL DOM?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Thao tác DOM thật rất CHẬM!                       │
  │     → Mỗi lần sửa DOM → trình duyệt phải:           │
  │       Recalculate Style → Layout → Paint → Composite  │
  │     → Gọi là Reflow/Repaint — RẤT TỐN KÉM!         │
  │                                                        │
  │  ② Virtual DOM là GIẢI PHÁP:                           │
  │     → Thay đổi trên object JS (nhanh!)               │
  │     → So sánh old vs new virtual DOM (diff)            │
  │     → Chỉ cập nhật PHẦN KHÁC lên DOM thật (patch)    │
  │     → Giảm thiểu thao tác DOM → NHANH HƠN!          │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  State thay đổi                                  │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  Tạo Virtual DOM mới                             │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  DIFF(old VDOM, new VDOM) → patches              │  │
  │  │      │                                           │  │
  │  │      ▼                                           │  │
  │  │  PATCH(real DOM, patches) → cập nhật tối thiểu  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Cấu Trúc Dự Án

```
  THƯ MỤC DỰ ÁN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  dom-diff/                                             │
  │  ├── src/                                              │
  │  │   ├── index.js      ← Entry: tạo, render, diff   │
  │  │   ├── element.js    ← Virtual DOM: tạo + render   │
  │  │   ├── diff.js       ← So sánh 2 virtual DOM       │
  │  │   └── patch.js      ← Áp dụng thay đổi lên DOM   │
  │  └── package.json                                     │
  │                                                        │
  │  LUỒNG HOẠT ĐỘNG:                                     │
  │                                                        │
  │  element.js          diff.js          patch.js         │
  │  ┌──────────┐    ┌──────────┐    ┌──────────┐         │
  │  │createElement│→│ diff()   │→│ patch()  │         │
  │  │ render()  │    │ walk()   │    │ doPatch()│         │
  │  │ setAttr() │    │diffAttr()│    │          │         │
  │  │ renderDom()│   │diffChild│    │          │         │
  │  └──────────┘    └──────────┘    └──────────┘         │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Tạo Virtual DOM — `createElement`

```
═══════════════════════════════════════════════════════════════
  CREATEELEMENT = TẠO 1 OBJECT MÔ TẢ DOM NODE!
═══════════════════════════════════════════════════════════════


  createElement('ul', {class: 'list'}, [
      createElement('li', {class: 'item'}, ['Phong']),
      createElement('li', {class: 'item'}, ['Hùng']),
      createElement('li', {class: 'item'}, ['Minh'])
  ])

        ║ tạo ra object:
        ▼

  {
    type: 'ul',
    props: { class: 'list' },
    children: [
      Element { type:'li', props:{class:'item'}, children:['Phong'] },
      Element { type:'li', props:{class:'item'}, children:['Hùng'] },
      Element { type:'li', props:{class:'item'}, children:['Minh'] }
    ]
  }
```

### Phân tích 3 tham số

```
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  createElement(type, props, children)                  │
  │                                                        │
  │  ① type: Loại thẻ HTML                                │
  │     → 'div', 'ul', 'li', 'span', 'a', 'input'...    │
  │                                                        │
  │  ② props: Thuộc tính của element (object)              │
  │     → { class: 'item', style: 'color:red', id: 'x' } │
  │                                                        │
  │  ③ children: Mảng chứa các node con                   │
  │     → Có thể là string (text) hoặc Element (node con) │
  │     → ['Xin chào'] hoặc [createElement('span',...)]   │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Code: element.js — Phần 1

```javascript
// element.js

// ═══════════════════════════════════════════════════════════
// Class Element — mô tả 1 node trong Virtual DOM
// ═══════════════════════════════════════════════════════════

class Element {
  constructor(type, props, children) {
    this.type = type; // 'ul', 'li', 'div'...
    this.props = props; // { class: 'list' }
    this.children = children; // ['text'] hoặc [Element]
  }
}

// ═══════════════════════════════════════════════════════════
// createElement — tạo virtual DOM node (trả về object)
// ═══════════════════════════════════════════════════════════
//
// KHÔNG tạo DOM thật! Chỉ tạo 1 object JavaScript!
// React.createElement() cũng hoạt động GIỐNG HỆT NHƯ VẬY!

function createElement(type, props, children) {
  return new Element(type, props, children);
}
```

```
  GIẢI THÍCH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  class Element:                                        │
  │  → Chỉ là 1 class đơn giản với 3 properties          │
  │  → Dùng để TẠO INSTANCE mô tả DOM node                │
  │  → KHÔNG liên quan đến DOM thật!                      │
  │                                                        │
  │  createElement():                                      │
  │  → Gọi new Element() → trả về 1 object               │
  │  → Object này MÔ TẢ DOM node bạn muốn tạo           │
  │  → React dùng CHÍNH XÁC tên hàm này!                 │
  │  → Vue cũng dùng tên hàm này! (h() là alias)        │
  │                                                        │
  │  VÍ DỤ:                                                │
  │  createElement('li', {class:'item'}, ['Phong'])       │
  │      ↓                                                │
  │  Element {                                             │
  │    type: 'li',                                         │
  │    props: { class: 'item' },                           │
  │    children: ['Phong']                                 │
  │  }                                                     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §4. Render Virtual DOM → Real DOM

```
═══════════════════════════════════════════════════════════════
  RENDER = BIẾN OBJECT THÀNH DOM THẬT!
═══════════════════════════════════════════════════════════════


  LUỒNG RENDER:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Virtual DOM Object                                    │
  │  { type:'ul', props:{class:'list'}, children:[...] }  │
  │      │                                                │
  │      ▼ ① document.createElement('ul')                 │
  │      │                                                │
  │      ▼ ② setAttr(el, 'class', 'list')                │
  │      │                                                │
  │      ▼ ③ Duyệt children:                             │
  │      │   ├── child là Element? → GỌI LẠI render()    │
  │      │   └── child là string?  → createTextNode()     │
  │      │                                                │
  │      ▼ ④ el.appendChild(child)                        │
  │      │                                                │
  │      ▼ Return <ul class="list">...</ul>  (DOM thật!) │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Code: element.js — Phần 2

```javascript
// ═══════════════════════════════════════════════════════════
// render — biến virtual DOM thành real DOM
// ═══════════════════════════════════════════════════════════
//
// Đây là hàm ĐỆ QUY (recursive)!
// Nếu child là Element → gọi lại render(child)
// Nếu child là string → tạo text node

function render(domObj) {
  // ① Tạo element thật theo type
  let el = document.createElement(domObj.type);

  // ② Duyệt props, set từng attribute
  for (let key in domObj.props) {
    setAttr(el, key, domObj.props[key]);
  }

  // ③ Duyệt children
  domObj.children.forEach((child) => {
    // Nếu child là Element → ĐỆ QUY render
    // Nếu child là string → tạo text node
    child =
      child instanceof Element ? render(child) : document.createTextNode(child);

    // ④ Gắn child vào element cha
    el.appendChild(child);
  });

  return el; // Trả về DOM thật!
}

// ═══════════════════════════════════════════════════════════
// setAttr — set attribute cho DOM element
// ═══════════════════════════════════════════════════════════
//
// Xử lý 3 trường hợp đặc biệt:
// 1. value → input/textarea set trực tiếp .value
// 2. style → set qua .style.cssText
// 3. default → dùng setAttribute()

function setAttr(node, key, value) {
  switch (key) {
    case "value":
      // input/textarea → set .value trực tiếp
      if (
        node.tagName.toLowerCase() === "input" ||
        node.tagName.toLowerCase() === "textarea"
      ) {
        node.value = value;
      } else {
        node.setAttribute(key, value);
      }
      break;
    case "style":
      // style → gán cssText (inline style)
      node.style.cssText = value;
      break;
    default:
      // Các attribute khác: class, id, href...
      node.setAttribute(key, value);
      break;
  }
}

// ═══════════════════════════════════════════════════════════
// renderDom — chèn element vào trang
// ═══════════════════════════════════════════════════════════

function renderDom(el, target) {
  target.appendChild(el);
}

// ═══════════════════════════════ EXPORT ═══════════════════
export { Element, createElement, render, setAttr, renderDom };
```

```
  VÍ DỤ RENDER ĐỆ QUY:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  render({ type:'ul', props:{class:'list'}, children:[ │
  │    { type:'li', props:{class:'item'}, children:['A']},│
  │    { type:'li', props:{class:'item'}, children:['B']} │
  │  ]})                                                   │
  │                                                        │
  │  Bước 1: el = <ul>                                    │
  │  Bước 2: setAttr(el, 'class', 'list') → <ul class>   │
  │  Bước 3: Duyệt children[0]:                          │
  │    │  child[0] là Element → GỌI render(child[0])     │
  │    │    ├─ el2 = <li>                                 │
  │    │    ├─ setAttr(el2, 'class', 'item')              │
  │    │    ├─ children: ['A'] → string → TextNode('A')  │
  │    │    ├─ el2.appendChild(TextNode('A'))              │
  │    │    └─ return <li class="item">A</li>             │
  │    └─ el.appendChild(<li class="item">A</li>)        │
  │  Bước 4: Duyệt children[1]: (tương tự)              │
  │  Bước 5: return <ul class="list">                     │
  │            <li class="item">A</li>                    │
  │            <li class="item">B</li>                    │
  │          </ul>                                         │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §5. DOM-Diff — So Sánh 2 Virtual DOM

```
═══════════════════════════════════════════════════════════════
  DOM-DIFF = TÌM SỰ KHÁC BIỆT GIỮA 2 CÂY VIRTUAL DOM!
═══════════════════════════════════════════════════════════════


  THUẬT TOÁN: Duyệt tiền thứ tự theo chiều sâu (Pre-order DFS)
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Old Tree:            New Tree:                        │
  │       ul (0)               ul (0)                      │
  │      / | \                / | \                        │
  │    li  li  li           li  li  li                     │
  │   (1) (2) (3)         (1) (2) (3)                     │
  │    |   |   |            |   |   |                      │
  │   "A" "B" "C"         "X" "B" "Y"                     │
  │   (4) (5) (6)         (4) (5) (6)                     │
  │                                                        │
  │  So sánh theo thứ tự: 0→1→4→2→5→3→6                │
  │  (Preorder: node trước, children sau, trái→phải)     │
  │                                                        │
  │  Kết quả patches:                                      │
  │  patches[4] = [{type:'TEXT', text:'X'}]               │
  │  patches[6] = [{type:'TEXT', text:'Y'}]               │
  │  → Chỉ node 4 và 6 thay đổi!                        │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  4 QUY TẮC SO SÁNH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① REMOVE — Node mới KHÔNG tồn tại                    │
  │     → { type: 'REMOVE', index }                        │
  │                                                        │
  │  ② TEXT — Cả 2 là text, nhưng NỘI DUNG khác          │
  │     → { type: 'TEXT', text: 'nội dung mới' }          │
  │                                                        │
  │  ③ ATTR — Cùng type, nhưng THUỘC TÍNH khác           │
  │     → { type: 'ATTR', attr: {class:'new-class'} }     │
  │     → Đồng thời so sánh children (đệ quy)            │
  │                                                        │
  │  ④ REPLACE — Type HOÀN TOÀN KHÁC                      │
  │     → { type: 'REPLACE', newNode }                     │
  │     → Thay thế toàn bộ node                           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Code: diff.js

```javascript
// diff.js

// ═══════════════════════════════════════════════════════════
// diff — entry point: so sánh 2 virtual DOM trees
// ═══════════════════════════════════════════════════════════
//
// Trả về object patches chứa TẤT CẢ thay đổi
// Key = index của node, Value = mảng các patch

function diff(oldTree, newTree) {
  // Object chứa toàn bộ patches
  let patches = {};
  // Bắt đầu so sánh từ node gốc (index 0)
  let index = 0;
  // Đệ quy duyệt cây, kết quả vào patches
  walk(oldTree, newTree, index, patches);
  return patches;
}

// ═══════════════════════════════════════════════════════════
// walk — so sánh 2 node tại cùng vị trí
// ═══════════════════════════════════════════════════════════
//
// Đây là HÀM CHÍNH của diff algorithm!
// Kiểm tra 4 trường hợp theo thứ tự ưu tiên

function walk(oldNode, newNode, index, patches) {
  // Mảng chứa patches cho node HIỆN TẠI
  let current = [];

  if (!newNode) {
    // ① REMOVE: node mới không tồn tại → xóa!
    current.push({ type: "REMOVE", index });
  } else if (isString(oldNode) && isString(newNode)) {
    // ② TEXT: cả 2 là text → so sánh nội dung
    if (oldNode !== newNode) {
      current.push({ type: "TEXT", text: newNode });
    }
  } else if (oldNode.type === newNode.type) {
    // ③ CÙNG TYPE: so sánh thuộc tính
    let attr = diffAttr(oldNode.props, newNode.props);
    if (Object.keys(attr).length > 0) {
      current.push({ type: "ATTR", attr });
    }
    // Có children → tiếp tục so sánh đệ quy!
    diffChildren(oldNode.children, newNode.children, patches);
  } else {
    // ④ KHÁC TYPE: thay thế toàn bộ node
    current.push({ type: "REPLACE", newNode });
  }

  // Nếu node này CÓ thay đổi → lưu vào patches
  if (current.length) {
    patches[index] = current;
  }
}

// ═══════════════════════════════════════════════════════════
// Hàm helper
// ═══════════════════════════════════════════════════════════

function isString(obj) {
  return typeof obj === "string";
}

// ═══════════════════════════════════════════════════════════
// diffAttr — so sánh thuộc tính cũ vs mới
// ═══════════════════════════════════════════════════════════

function diffAttr(oldAttrs, newAttrs) {
  let patch = {};

  // Kiểm tra attr CŨ có thay đổi không
  for (let key in oldAttrs) {
    if (oldAttrs[key] !== newAttrs[key]) {
      patch[key] = newAttrs[key]; // có thể là undefined (bị xóa)
    }
  }

  // Kiểm tra attr MỚI được thêm vào
  for (let key in newAttrs) {
    if (!oldAttrs.hasOwnProperty(key)) {
      patch[key] = newAttrs[key];
    }
  }

  return patch;
}

// ═══════════════════════════════════════════════════════════
// diffChildren — so sánh danh sách children
// ═══════════════════════════════════════════════════════════
//
// Dùng biến num toàn cục để đánh index cho mỗi node
// Đảm bảo mỗi node có 1 index DUY NHẤT

let num = 0;

function diffChildren(oldChildren, newChildren, patches) {
  oldChildren.forEach((child, index) => {
    // Đệ quy walk cho từng cặp child cũ/mới
    walk(child, newChildren[index], ++num, patches);
  });
}

export default diff;
```

```
  GIẢI THÍCH LUỒNG DIFF CHI TIẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Old VDOM:                    New VDOM:                │
  │  ul {class:'list'}           ul {class:'list-group'}  │
  │  ├─ li {class:'item'} 'A'   ├─ li {class:'active'}'X'│
  │  ├─ li {class:'item'} 'B'   ├─ li {class:'item'} 'B' │
  │  └─ li {class:'item'} 'C'   └─ li {class:'item'} 'Y' │
  │                                                        │
  │  BƯỚC 1: walk(ul, ul, 0, patches)                     │
  │    → Cùng type 'ul'                                   │
  │    → diffAttr: class 'list'→'list-group' → ATTR!     │
  │    → patches[0] = [{type:'ATTR',                      │
  │         attr:{class:'list-group'}}]                    │
  │    → diffChildren: duyệt 3 children                  │
  │                                                        │
  │  BƯỚC 2: walk(li, li, 1, patches)     (num=1)        │
  │    → Cùng type 'li'                                   │
  │    → diffAttr: class 'item'→'active' → ATTR!         │
  │    → patches[1] = [{type:'ATTR',                      │
  │         attr:{class:'active'}}]                        │
  │    → diffChildren: duyệt text child                  │
  │                                                        │
  │  BƯỚC 3: walk('A', 'X', 2, patches)   (num=2)        │
  │    → Cả 2 là string, khác nhau                        │
  │    → patches[2] = [{type:'TEXT', text:'X'}]           │
  │                                                        │
  │  BƯỚC 4: walk(li, li, 3, patches)     (num=3)        │
  │    → Cùng type, cùng attr → không patch               │
  │    → diffChildren → walk('B','B',4)                  │
  │    → Giống nhau → không patch                         │
  │                                                        │
  │  BƯỚC 5: walk(li, li, 5, patches)     (num=5)        │
  │    → Cùng type, cùng attr                             │
  │    → walk('C','Y',6) → TEXT khác!                     │
  │    → patches[6] = [{type:'TEXT', text:'Y'}]           │
  │                                                        │
  │  KẾT QUẢ patches:                                      │
  │  {                                                     │
  │    0: [{type:'ATTR', attr:{class:'list-group'}}],     │
  │    1: [{type:'ATTR', attr:{class:'active'}}],         │
  │    2: [{type:'TEXT', text:'X'}],                       │
  │    6: [{type:'TEXT', text:'Y'}]                        │
  │  }                                                     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  VẤN ĐỀ VỀ BIẾN num TOÀN CỤC:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ⚠ Biến num = 0 ở TOP LEVEL → chia sẻ giữa các lần │
  │  gọi diffChildren!                                    │
  │                                                        │
  │  Thứ tự đánh index (preorder DFS):                    │
  │                                                        │
  │       ul (index=0)                                     │
  │      /    |    \                                       │
  │    li     li     li                                    │
  │  (idx=1)(idx=3)(idx=5)                                │
  │    |      |      |                                     │
  │  "A"    "B"    "C"                                     │
  │  (idx=2)(idx=4)(idx=6)                                │
  │                                                        │
  │  walk(ul,ul,0) → num=0                                │
  │    diffChildren:                                       │
  │      walk(li,li, ++num=1) → diffChildren:             │
  │        walk("A","X", ++num=2)                         │
  │      walk(li,li, ++num=3) → diffChildren:             │
  │        walk("B","B", ++num=4)                         │
  │      walk(li,li, ++num=5) → diffChildren:             │
  │        walk("C","Y", ++num=6)                         │
  │                                                        │
  │  → Mỗi node có index DUY NHẤT!                       │
  │  → patches dùng index để biết patch cho node nào!    │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §6. Patch — Áp Dụng Thay Đổi Lên Real DOM

```
═══════════════════════════════════════════════════════════════
  PATCH = DÙNG PATCHES ĐỂ CẬP NHẬT DOM THẬT!
═══════════════════════════════════════════════════════════════


  LUỒNG PATCH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  patch(realDOM, patches)                               │
  │      │                                                │
  │      ▼                                                │
  │  walk(realDOM) — duyệt DFS preorder                   │
  │      │                                                │
  │      ├── Lấy childNodes của DOM thật                  │
  │      ├── Duyệt từng child → gọi đệ quy walk(child)  │
  │      └── Nếu có patch tại index → gọi doPatch()      │
  │                                                        │
  │  doPatch(node, patches)                                │
  │      │                                                │
  │      ├── ATTR  → setAttr() hoặc removeAttribute()    │
  │      ├── TEXT  → node.textContent = text              │
  │      ├── REPLACE → replaceChild(newNode, oldNode)     │
  │      └── REMOVE  → removeChild(node)                  │
  │                                                        │
  │  ⭐ QUAN TRỌNG: walk CHILDREN TRƯỚC, rồi mới patch!   │
  │  → Vì removeChild/replaceChild sẽ thay đổi index!   │
  │  → Nếu patch trước → index con sẽ bị lệch!         │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### Code: patch.js

```javascript
// patch.js

import { Element, render, setAttr } from "./element";

let allPatches; // Lưu toàn bộ patches
let index = 0; // Index hiện tại đang xử lý

// ═══════════════════════════════════════════════════════════
// patch — entry point: áp dụng patches lên DOM thật
// ═══════════════════════════════════════════════════════════

function patch(node, patches) {
  allPatches = patches;
  walk(node); // Bắt đầu duyệt DOM thật
}

// ═══════════════════════════════════════════════════════════
// walk — duyệt qua DOM thật (preorder DFS)
// ═══════════════════════════════════════════════════════════
//
// ⚠ THỨ TỰ QUAN TRỌNG:
// 1. Lấy patch cho node HIỆN TẠI
// 2. Duyệt TẤT CẢ children TRƯỚC (DFS)
// 3. Rồi MỚI áp dụng patch cho node hiện tại
//
// TẠI SAO? Vì nếu patch (xóa/thay thế) node trước khi
// duyệt children → children sẽ bị mất/lệch index!

function walk(node) {
  let current = allPatches[index++];
  let childNodes = node.childNodes;

  // Duyệt children TRƯỚC (preorder depth-first)
  childNodes.forEach((child) => walk(child));

  // Rồi mới patch node hiện tại
  if (current) {
    doPatch(node, current);
  }
}

// ═══════════════════════════════════════════════════════════
// doPatch — thực hiện patch cho 1 node
// ═══════════════════════════════════════════════════════════

function doPatch(node, patches) {
  patches.forEach((patch) => {
    switch (patch.type) {
      case "ATTR":
        for (let key in patch.attr) {
          let value = patch.attr[key];
          if (value) {
            setAttr(node, key, value);
          } else {
            // value = undefined → attr bị XÓA
            node.removeAttribute(key);
          }
        }
        break;

      case "TEXT":
        node.textContent = patch.text;
        break;

      case "REPLACE":
        let newNode = patch.newNode;
        newNode =
          newNode instanceof Element
            ? render(newNode)
            : document.createTextNode(newNode);
        node.parentNode.replaceChild(newNode, node);
        break;

      case "REMOVE":
        node.parentNode.removeChild(node);
        break;

      default:
        break;
    }
  });
}

export default patch;
```

```
  GIẢI THÍCH doPatch CHI TIẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CASE 'ATTR':                                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │ patch.attr = { class: 'active', id: undefined } │  │
  │  │                                                  │  │
  │  │ class: 'active' → setAttr(node,'class','active')│  │
  │  │ id: undefined   → node.removeAttribute('id')    │  │
  │  │                                                  │  │
  │  │ ⭐ value = undefined nghĩa là attr bị XÓA!      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CASE 'TEXT':                                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │ node.textContent = 'nội dung mới'               │  │
  │  │ → Đơn giản nhất! Thay text trực tiếp!         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CASE 'REPLACE':                                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │ newNode là Element?                              │  │
  │  │   → CÓ: render(newNode) → tạo DOM thật        │  │
  │  │   → KHÔNG: createTextNode(newNode)              │  │
  │  │                                                  │  │
  │  │ node.parentNode.replaceChild(newNode, node)     │  │
  │  │ → Thay thế qua parentNode vì node không thể   │  │
  │  │   tự thay thế chính mình!                       │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CASE 'REMOVE':                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │ node.parentNode.removeChild(node)               │  │
  │  │ → Tương tự, xóa qua parentNode!                │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §7. Demo Hoàn Chỉnh — index.js

```javascript
// index.js — TOÀN BỘ LUỒNG: Tạo → Render → Diff → Patch

import { createElement, render, renderDom } from "./element";
import diff from "./diff";
import patch from "./patch";

// ── BƯỚC 1: Tạo Virtual DOM cũ ──────────────────────────

let virtualDom = createElement("ul", { class: "list" }, [
  createElement("li", { class: "item" }, ["Phong"]),
  createElement("li", { class: "item" }, ["Hùng"]),
  createElement("li", { class: "item" }, ["Minh"]),
]);

// ── BƯỚC 2: Render → Real DOM → chèn vào trang ─────────

let el = render(virtualDom);
renderDom(el, document.getElementById("root"));

// ── BƯỚC 3: Tạo Virtual DOM MỚI (state thay đổi) ──────

let virtualDom2 = createElement("ul", { class: "list-group" }, [
  createElement("li", { class: "item active" }, ["Bảo"]),
  createElement("li", { class: "item" }, ["Hùng"]),
  createElement("li", { class: "item" }, ["Tuấn"]),
]);

// ── BƯỚC 4: Diff — tìm sự khác biệt ───────────────────

let patches = diff(virtualDom, virtualDom2);
console.log("Patches:", patches);

// ── BƯỚC 5: Patch — áp dụng thay đổi lên DOM thật ─────

patch(el, patches);
// DOM tự động cập nhật! Chỉ PHẦN KHÁC thay đổi!
```

```
  DEMO CHẠY NHƯ SAU:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  TRƯỚC patch:              SAU patch:                  │
  │  ┌──────────────────┐     ┌──────────────────────┐    │
  │  │ <ul class="list"> │     │ <ul class="list-group">│   │
  │  │   <li>Phong</li>  │     │   <li class="active">│   │
  │  │   <li>Hùng</li>  │     │     Bảo</li>         │   │
  │  │   <li>Minh</li>   │     │   <li>Hùng</li>     │   │
  │  │ </ul>              │     │   <li>Tuấn</li>     │   │
  │  └──────────────────┘     │ </ul>                 │   │
  │                            └──────────────────────┘    │
  │                                                        │
  │  Chỉ cập nhật:                                        │
  │  ✓ ul: class "list" → "list-group"                   │
  │  ✓ li[0]: class += "active", text "Phong"→"Bảo"     │
  │  ✓ li[2]: text "Minh" → "Tuấn"                      │
  │  ✗ li[1]: KHÔNG thay đổi → KHÔNG đụng vào!          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §8. Tổng Kết — 4 Bước Vàng

```
═══════════════════════════════════════════════════════════════
  TOÀN BỘ VIRTUAL DOM + DOM-DIFF TRONG 4 CÂU!
═══════════════════════════════════════════════════════════════


  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Dùng JavaScript Object mô phỏng DOM (Virtual DOM) │
  │     createElement('div', {id:'app'}, [...])           │
  │     → Tạo cây object NHẸ mô tả cấu trúc DOM        │
  │                                                        │
  │  ② Convert Virtual DOM → Real DOM → chèn vào trang   │
  │     render(vdom) → document.createElement(...)         │
  │     renderDom(el, root)                                │
  │                                                        │
  │  ③ Khi state thay đổi → Diff 2 Virtual DOM trees     │
  │     diff(oldVDOM, newVDOM) → patches object            │
  │     → Tìm ra CHÍNH XÁC cái gì thay đổi              │
  │                                                        │
  │  ④ Áp dụng patches lên Real DOM (cập nhật tối thiểu) │
  │     patch(realDOM, patches)                            │
  │     → Chỉ sửa ĐÚNG phần cần sửa, không render lại  │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  TOÀN BỘ LUỒNG HOẠT ĐỘNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  State V1                           State V2           │
  │     │                                  │               │
  │     ▼                                  ▼               │
  │  createElement()                  createElement()      │
  │     │                                  │               │
  │     ▼                                  ▼               │
  │  VDOM v1 ──────── diff() ──────── VDOM v2             │
  │     │                │                                 │
  │     ▼                ▼                                 │
  │  render()         patches                              │
  │     │                │                                 │
  │     ▼                ▼                                 │
  │  Real DOM ──── patch() ────→ Real DOM (updated!)      │
  │     │                              │                   │
  │     ▼                              ▼                   │
  │  Hiển thị lần đầu          Cập nhật TỐI THIỂU        │
  │                                                        │
  └────────────────────────────────────────────────────────┘


  ⭐ CÂU HỎI PHỎNG VẤN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  1. Virtual DOM là gì?                                 │
  │     → Object JS mô phỏng cấu trúc DOM thật          │
  │     → Nhẹ hơn DOM thật rất nhiều lần                 │
  │                                                        │
  │  2. Tại sao cần Virtual DOM?                           │
  │     → Thao tác DOM thật tốn kém (reflow/repaint)     │
  │     → VDOM cho phép batch changes, update tối thiểu  │
  │                                                        │
  │  3. DOM-diff dùng thuật toán gì?                      │
  │     → Pre-order Depth-First Search (DFS)              │
  │     → Duyệt node trước, rồi children trái→phải     │
  │                                                        │
  │  4. Diff có mấy loại patch?                           │
  │     → 4 loại: REMOVE, TEXT, ATTR, REPLACE             │
  │                                                        │
  │  5. Tại sao patch duyệt children trước rồi mới       │
  │     áp dụng patch?                                     │
  │     → Vì remove/replace sẽ thay đổi childNodes       │
  │     → Nếu patch trước → index children bị lệch!     │
  │                                                        │
  │  6. React diff khác gì so với bản đơn giản này?      │
  │     → React dùng key để tối ưu list rendering        │
  │     → React có Fiber architecture (có thể pause)      │
  │     → React diff theo component, không chỉ DOM node  │
  │     → O(n) thay vì O(n³) nhờ 2 giả định:           │
  │       a) Khác type → khác cây (không đệ quy sâu)    │
  │       b) Key giúp xác định element nào di chuyển      │
  │                                                        │
  │  7. Virtual DOM có THẬT SỰ nhanh hơn DOM thật?       │
  │     → KHÔNG phải lúc nào cũng đúng!                  │
  │     → Có overhead: tạo VDOM + diff + patch            │
  │     → Nhưng với ứng dụng LỚN, PHỨC TẠP:             │
  │       → Batch updates + minimal DOM ops = NHANH HƠN  │
  │     → Vanilla JS manipulation vẫn nhanh nhất cho      │
  │       các thao tác ĐƠN GIẢN, ÍT thay đổi            │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

> **Xong!** Bạn đã tự tay viết lại toàn bộ Virtual DOM + DOM-Diff từ số 0. Hiểu rõ `createElement` → `render` → `diff` → `patch` chính là hiểu cách React hoạt động bên dưới!
