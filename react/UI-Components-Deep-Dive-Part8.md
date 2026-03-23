# UI Components Deep Dive — Phần 8: Todo List, Job Board, Contact Form, Holy Grail

> 📅 2026-03-11 · ⏱ 60 phút đọc
>
> Chủ đề: Tự viết lại từ đầu — Todo List, Job Board, Contact Form, Holy Grail Layout
> Version: Vanilla JavaScript + React + HTML/CSS only
> Không thư viện! Viết tay 100%!

---

## Mục Lục

| #   | Component    | Vanilla JS | React | Giải thích    | RADIO   |
| --- | ------------ | ---------- | ----- | ------------- | ------- |
| 1   | Todo List    | §1.1       | §1.2  | §1.3          | §1.4    |
| 2   | Job Board    | §2.1       | §2.2  | §2.3          | §2.4    |
| 3   | Contact Form | §3.1       | —     | §3.2          | §3.3    |
| 4   | Holy Grail   | §4.1       | —     | §4.2          | §4.3    |

---

# ✅ Component 1: Todo List

## Kiến Trúc Todo List

```
TODO LIST:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────┐
  │  ┌──────────────────────┐  ┌────────┐  │
  │  │ Add new task...      │  │ Submit │  │  ← input + button
  │  └──────────────────────┘  └────────┘  │
  ├─────────────────────────────────────────┤
  │  ☐ Buy groceries              [Delete] │  ← todo item
  │  ☐ Walk the dog               [Delete] │
  │  ☐ Read a book                [Delete] │
  └─────────────────────────────────────────┘

  Behavior:
  • Type task → click Submit → thêm vào list!
  • Input CLEAR sau khi thêm thành công!
  • Click Delete → xoá task khỏi list!
  • UX bonus: Enter key submit, empty validation!
```

### 📋 Phân tích yêu cầu — Trước khi code!

Trước khi viết bất kỳ dòng code nào, ta cần **phân tích yêu cầu** kỹ lưỡng. Đây là kỹ năng QUAN TRỌNG NHẤT trong phỏng vấn — không phải code nhanh, mà là **hiểu đúng bài toán**.

Yêu cầu bài gồm 3 chức năng chính:
1. **Add** — click "Submit" → thêm task mới vào list
2. **Clear** — sau khi thêm thành công → input field tự xoá
3. **Delete** — click "Delete" trên task → xoá task khỏi list

Nghe đơn giản, nhưng có nhiều **câu hỏi ẩn** mà developer giỏi sẽ HỎI trước khi code:

```
CÂU HỎI CẦN LÀM RÕ:
═══════════════════════════════════════════════════════════════

  1. Empty string handling?
     → User nhấn Submit mà chưa gõ gì → thêm todo rỗng?
     → KHÔNG! Phải validate: trim + check empty!

  2. Duplicate tasks?
     → "Buy milk" đã tồn tại → thêm "Buy milk" lần 2?
     → CÓ! Bài không nói cấm duplicate → cho phép!

  3. Order of tasks?
     → Task mới ở ĐẦU hay CUỐI list?
     → CUỐI! (append — natural flow!)

  4. Task limit?
     → Tối đa bao nhiêu tasks?
     → Không giới hạn (trong phỏng vấn!)
     → Production: cần pagination hoặc virtualization!

  5. Persistence?
     → Refresh page → tasks mất?
     → CÓ mất! (in-memory only)
     → Bonus: localStorage để persist!
```

### 🔄 Cách tiếp cận — Vanilla JS vs React

Có 2 paradigm hoàn toàn khác nhau để giải bài này. Hiểu SỰ KHÁC BIỆT giữa chúng là điều mà interviewer muốn thấy:

```
IMPERATIVE vs DECLARATIVE:
═══════════════════════════════════════════════════════════════

  VANILLA JS (Imperative — Ra lệnh từng bước!):
  ──────────────────────────────────────────────
  1. Tạo <li> element!
  2. Set innerHTML cho nó!
  3. Gắn event listener vào button!
  4. Append <li> vào <ul>!
  5. Khi xoá: tìm <li> trong DOM, gọi .remove()!
  → Developer ĐIỀU KHIỂN DOM trực tiếp!
  → Phải sync DATA và DOM thủ công!

  REACT (Declarative — Mô tả kết quả mong muốn!):
  ──────────────────────────────────────────────
  1. Thay đổi state: setTodos([...prev, newTodo])
  2. React TỰ ĐỘNG render lại UI!
  3. Developer CHỈ quan tâm STATE!
  → React lo phần DOM sync!
  → Ít bug hơn vì chỉ có 1 source of truth!

  ┌──────────────────┬──────────────────────────┐
  │   Vanilla JS     │   React                  │
  ├──────────────────┼──────────────────────────┤
  │ Manual DOM ops   │ Virtual DOM diffing       │
  │ querySelector    │ JSX declarative           │
  │ addEventListener │ onClick prop              │
  │ this.todos=[]    │ useState([])              │
  │ 2 nguồn (data    │ 1 nguồn (state)           │
  │   + DOM riêng!)  │   → React sync DOM!       │
  │ Phải sync thủ    │ React auto sync!          │
  │   công DATA↔DOM! │                           │
  └──────────────────┴──────────────────────────┘
```

### 🏗 HTML Structure — Tại sao thiết kế vậy?

```
HTML STRUCTURE — PHÂN TÍCH:
═══════════════════════════════════════════════════════════════

  <div class="todo-app" id="todoApp">
    ↑ Wrapper container:
    → id="todoApp" — scope cho querySelector!
    → class — cho styling!
    → Tại sao cần wrapper? Để TodoList class có scope!
      Không dùng document.querySelector('#todoInput')
      mà dùng this.container.querySelector('#todoInput')
      → Cho phép NHIỀU Todo Lists trên 1 page!

  <input type="text" placeholder="Add new task..." />
    ↑ type="text" — single line input!
    → placeholder — hint cho user biết gõ gì!
    → Không dùng <textarea> vì task ngắn, 1 dòng!

  <button type="button">Submit</button>
    ↑ type="button" — KHÔNG phải type="submit"!
    → Tại sao? Vì KHÔNG nằm trong <form>!
    → Nếu nằm trong <form> + type="submit":
      → Browser gửi form → page RELOAD! 💀
    → type="button" = an toàn, tự handle bằng JS!

  <ul id="todoList"></ul>
    ↑ <ul> — unordered list!
    → Semantic đúng: danh sách items, không đánh số!
    → <ol> nếu cần đánh số thứ tự!
    → Rỗng ban đầu — JS thêm <li> vào!
```

### 🎯 Event handling — Cách tiếp cận

```
EVENT HANDLING APPROACHES:
═══════════════════════════════════════════════════════════════

  CÁCH 1: Individual listeners (code hiện tại!)
  ─────────────────────────────────────────────
  Mỗi Delete button có listener RIÊNG:
  li.querySelector('.delete-btn').addEventListener('click', () => {
    this._deleteTodo(todo.id);
  });
  ✅ Đơn giản, dễ hiểu!
  ❌ 100 todos = 100 listeners → tốn memory!

  CÁCH 2: Event delegation (tối ưu!)
  ─────────────────────────────────────────────
  1 listener trên <ul>, check e.target:
  this.list.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const id = +e.target.closest('li').dataset.id;
      this._deleteTodo(id);
    }
  });
  ✅ Chỉ 1 listener cho TẤT CẢ buttons!
  ✅ Works cho items thêm SAU (dynamic!)
  ❌ Code phức tạp hơn!

  EVENT DELEGATION — CÁCH HOẠT ĐỘNG:
  ┌───── <ul> (listener ở đây!) ─────┐
  │  <li data-id="1">                │
  │    <span>Buy milk</span>         │
  │    <button>Delete</button> ←click│  ← event bubbles UP!
  │  </li>                           │
  │  <li data-id="2">                │
  │    <span>Walk dog</span>         │
  │    <button>Delete</button>       │
  │  </li>                           │
  └──────────────────────────────────┘

  Click "Delete" → event BUBBLES từ button → li → ul!
  → ul listener bắt event!
  → Check: e.target là .delete-btn? → xoá!
  → 1 listener thay vì N listeners!

  📝 Trong phỏng vấn: code cách 1 trước, mention cách 2
  như optimization! Interviewer sẽ ấn tượng!
```

---

## §1.1 Todo List — Vanilla JavaScript

```html
<div class="todo-app" id="todoApp">
  <div class="todo-input">
    <input type="text" id="todoInput" placeholder="Add new task..." />
    <button id="submitBtn" type="button">Submit</button>
  </div>
  <ul id="todoList"></ul>
</div>
```

```javascript
// ═══ Vanilla JS Todo List ═══

class TodoList {
  constructor(container) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;

    this.input = this.container.querySelector('#todoInput');
    this.submitBtn = this.container.querySelector('#submitBtn');
    this.list = this.container.querySelector('#todoList');
    this.todos = [];
    this.nextId = 1;

    this._bindEvents();
  }

  _bindEvents() {
    this.submitBtn.addEventListener('click', () => this._addTodo());

    // Enter key submit! (UX improvement!)
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._addTodo();
    });
  }

  _addTodo() {
    const text = this.input.value.trim();
    if (!text) return; // empty → ignore!

    const todo = { id: this.nextId++, text, completed: false };
    this.todos.push(todo);
    this._renderTodo(todo);

    this.input.value = ''; // clear input!
    this.input.focus();    // focus lại input!
  }

  _renderTodo(todo) {
    const li = document.createElement('li');
    li.dataset.id = todo.id;
    li.innerHTML = `
      <span>${this._escapeHtml(todo.text)}</span>
      <button class="delete-btn" type="button">Delete</button>
    `;

    li.querySelector('.delete-btn').addEventListener('click', () => {
      this._deleteTodo(todo.id);
    });

    this.list.appendChild(li);
  }

  _deleteTodo(id) {
    this.todos = this.todos.filter((t) => t.id !== id);
    const li = this.list.querySelector(`[data-id="${id}"]`);
    if (li) li.remove();
  }

  // XSS protection!
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

const todoList = new TodoList('#todoApp');
```

### Giải thích Vanilla JS — Line by line

Hãy đi qua từng dòng code, giải thích **TẠI SAO** viết như vậy:

**Constructor — Nền tảng của class:**

Khi `new TodoList('#todoApp')` được gọi, JavaScript tạo một object mới và chạy `constructor`. Dòng đầu tiên check `typeof container === 'string'` — đây là **defensive programming**. Thay vì assume input luôn là string, ta cho phép cả DOM element trực tiếp. Pattern này gọi là **polymorphic parameter** — rất phổ biến trong jQuery, D3.js, và hầu hết library UI.

Tiếp theo, ta query từng DOM element CẦN THIẾT và lưu vào `this`:

```
CONSTRUCTOR — TẠI SAO LƯU DOM REFS:
═══════════════════════════════════════════════════════════════

  this.input = this.container.querySelector('#todoInput');
  this.submitBtn = this.container.querySelector('#submitBtn');
  this.list = this.container.querySelector('#todoList');

  Tại sao lưu refs thay vì query mỗi lần?
  → querySelector LÀ EXPENSIVE! Duyệt DOM tree!
  → Gọi 1 lần trong constructor → lưu reference!
  → Từ đó dùng this.input thay vì querySelector!

  Tại sao container.querySelector thay vì document.querySelector?
  → SCOPE! Chỉ tìm trong container!
  → Nếu có 2 TodoList trên page:
    document.querySelector('#todoInput') → LẤY CÁI ĐẦU TIÊN! 💀
    this.container.querySelector('#todoInput') → ĐÚNG CÁI CỦA MÌNH! ✅
```

**`_bindEvents()` — Arrow functions và `this`:**

Đây là phần nhiều junior developer bị confused nhất. Event listener cần `this` trỏ đến TodoList instance, nhưng callback function bình thường sẽ mất `this` context:

```
THIS CONTEXT — VẤN ĐỀ LỚN NHẤT:
═══════════════════════════════════════════════════════════════

  ❌ Regular function — mất this!
  this.submitBtn.addEventListener('click', function() {
    this._addTodo();  // 💀 this = button element, KHÔNG PHẢI TodoList!
  });

  ✅ Arrow function — giữ this!
  this.submitBtn.addEventListener('click', () => this._addTodo());
  // ↑ Arrow function KHÔNG có this riêng!
  // → Kế thừa this từ scope ngoài = TodoList instance! ✅

  ✅ Cách khác — bind!
  this.submitBtn.addEventListener('click', this._addTodo.bind(this));
  // ↑ .bind(this) tạo function MỚI với this cố định!

  Arrow function ngắn gọn hơn → dùng trong code hiện tại!
  Nhưng HIỂU bind() là quan trọng cho phỏng vấn!
```

**`_addTodo()` — Guard clause pattern:**

Hàm này dùng pattern "**early return**" (guard clause). Thay vì wrap tất cả logic trong `if (text) { ... }`, ta `return` sớm khi invalid. Code phẳng hơn (flat), ít nesting, dễ đọc:

```
GUARD CLAUSE — FLAT CODE:
═══════════════════════════════════════════════════════════════

  ❌ Nested (pyramid of doom):
  _addTodo() {
    const text = this.input.value.trim();
    if (text) {
      if (text.length < 500) {
        if (!this.isDuplicate(text)) {
          // actual logic deep inside!
        }
      }
    }
  }

  ✅ Guard clauses (flat):
  _addTodo() {
    const text = this.input.value.trim();
    if (!text) return;             // guard 1: empty!
    if (text.length >= 500) return; // guard 2: too long!
    if (this.isDuplicate(text)) return; // guard 3: duplicate!
    
    // actual logic at TOP LEVEL! Easy to read!
  }

  → Mỗi guard xử lý 1 invalid case!
  → Return sớm → code phẳng, rõ ràng!
  → Phỏng vấn: interviewer thích flat code!
```

**`_renderTodo()` — DOM lifecycle:**

Khi tạo một todo item mới, xảy ra **chuỗi thao tác DOM** có thứ tự:

```
DOM LIFECYCLE — SEQUENCE:
═══════════════════════════════════════════════════════════════

  1. createElement('li')
     → Tạo element TRONG MEMORY, chưa gắn vào page!
     → Chưa visible! User chưa thấy gì!

  2. li.dataset.id = todo.id
     → Gắn data attribute! <li data-id="1">
     → Vẫn trong memory!

  3. li.innerHTML = `<span>...</span><button>...</button>`
     → Browser PARSE HTML string → tạo child elements!
     → Vẫn trong memory!

  4. li.querySelector('.delete-btn').addEventListener(...)
     → Gắn event listener vào delete button!
     → Button đã tồn tại (từ innerHTML ở bước 3!)
     → Vẫn trong memory!

  5. this.list.appendChild(li)
     → GẮN vào DOM tree! Page CẬP NHẬT!
     → Browser PAINT! User THẤY todo mới! 🎉

  TẠI SAO THỨ TỰ NÀY QUAN TRỌNG?
  → Thao tác DOM trong memory = NHANH!
  → Chỉ 1 lần appendChild = 1 lần reflow/repaint!
  → Nếu appendChild trước rồi set innerHTML:
    → 2 lần reflow! CHẬM HƠN!
```

**Closure trong addEventListener:**

```
CLOSURE TRONG DELETE BUTTON:
═══════════════════════════════════════════════════════════════

  _renderTodo(todo) {
    // ...
    li.querySelector('.delete-btn').addEventListener('click', () => {
      this._deleteTodo(todo.id);
      //                ↑ CLOSURE!
    });
  }

  todo.id ở đâu ra?
  → todo là THAM SỐ của _renderTodo!
  → Arrow function "capture" todo từ scope ngoài!
  → Đây là CLOSURE — function nhớ biến từ scope tạo ra nó!

  Ví dụ với 3 todos:
  _renderTodo({ id: 1 }) → listener nhớ id=1!
  _renderTodo({ id: 2 }) → listener nhớ id=2!
  _renderTodo({ id: 3 }) → listener nhớ id=3!
  → Mỗi listener là CLOSURE riêng biệt!
  → Click Delete todo 2 → chỉ xoá id=2! Đúng!

  Nếu dùng var (sai lầm cổ điển):
  for (var i = 0; i < 3; i++) {
    btn.addEventListener('click', () => delete(i));
  }
  → TẤT CẢ listeners nhớ i=3 (giá trị cuối!) 💀
  → let hoặc const FIX vấn đề này (block scope!)
```

**`_deleteTodo()` — Dual sync problem:**

```
DUAL SYNC — VẤN ĐỀ CHÍNH CỦA VANILLA JS:
═══════════════════════════════════════════════════════════════

  _deleteTodo(id) {
    // BƯỚC 1: Update DATA
    this.todos = this.todos.filter(t => t.id !== id);
    
    // BƯỚC 2: Update DOM
    const li = this.list.querySelector(`[data-id="${id}"]`);
    if (li) li.remove();
  }

  PHẢI làm CẢ HAI bước!
  
  ❌ Chỉ update DATA:
  → DOM vẫn hiện todo đã xoá!
  → User thấy: còn đó! Nhưng this.todos không có!
  → Click delete lần 2 → filter không tìm thấy → silent fail!

  ❌ Chỉ update DOM:
  → li.remove() → todo biến mất trên UI!
  → Nhưng this.todos VẪN CÒN todo đó!
  → Nếu có tính năng Save → save data SAI!
  → Nếu re-render → todo hiện lại! 👻

  ✅ Update CẢ HAI:
  → Data đúng + UI đúng = CONSISTENT!
  → ĐÂY là lý do React TỐT HƠN cho app phức tạp:
    React chỉ cần update state → UI tự sync!
```

**Gotchas khi code Vanilla JS Todo List:**

```
VANILLA JS GOTCHAS — CẨN THẬN:
═══════════════════════════════════════════════════════════════

  1. INNERHTML XSS:
     li.innerHTML = `<span>${todo.text}</span>`
     → Nếu todo.text = "<img onerror=hack>"
     → innerHTML PARSE HTML → code chạy! 💀
     → LUÔN escape trước khi dùng innerHTML!

  2. MEMORY LEAK POTENTIAL:
     Mỗi _renderTodo gắn 1 addEventListener!
     → li.remove() có giải phóng listener không?
     → CÓ! Modern browsers garbage collect!
     → Nhưng nếu listener reference external objects:
       → Có thể giữ reference → leak!
     → Best practice: removeEventListener trước remove!

  3. QUERY SELECTOR PERFORMANCE:
     this.list.querySelector(`[data-id="${id}"]`)
     → Attribute selector CHẬM hơn #id selector!
     → Nhưng data-id cần thiết cho unique identification!
     → Alternative: Map<id, element> cache! O(1) lookup!

  4. parseInt CHO DATASET:
     li.dataset.id → STRING, không phải number!
     → "1" !== 1 (strict equality!)
     → Code dùng todo.id (number) so với data-id (string)!
     → Cần chú ý khi compare!
     → Filter dùng !== với number → ok vì todo.id là number!
```

---

## §1.2 Todo List — React

```javascript
import { useState, useCallback, useRef } from 'react';

function useTodos() {
  const [todos, setTodos] = useState([]);
  const nextId = useRef(1);

  const addTodo = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    setTodos((prev) => [
      ...prev,
      { id: nextId.current++, text: trimmed, completed: false },
    ]);
    return true;
  }, []);

  const deleteTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { todos, addTodo, deleteTodo };
}

function TodoItem({ todo, onDelete }) {
  return (
    <li>
      <span>{todo.text}</span>
      <button type="button" onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  );
}

function TodoList() {
  const { todos, addTodo, deleteTodo } = useTodos();
  const inputRef = useRef(null);

  const handleSubmit = () => {
    if (addTodo(inputRef.current.value)) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  return (
    <div>
      <div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Add new task..."
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button type="button" onClick={handleSubmit}>Submit</button>
      </div>
      <ul>
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onDelete={deleteTodo} />
        ))}
      </ul>
    </div>
  );
}
```

### Giải thích React — Line by line

**Import — Chỉ import cái CẦN:**

```javascript
import { useState, useCallback, useRef } from 'react';
```

Tại sao chỉ 3 hooks? Mỗi hook có vai trò rõ ràng:
- **useState** — quản lý todos array (reactivity!)
- **useCallback** — tạo stable function references (memoization!)
- **useRef** — giữ giá trị MÀ KHÔNG trigger re-render (input + nextId!)

Không import `useEffect` vì Todo List **không có side effects** (không fetch API, không subscribe, không timer). Nếu interviewer hỏi "tại sao không useEffect?" → trả lời: "Vì state changes là synchronous, không cần effect!"

**`useTodos()` — Custom hook flow:**

```
HOOK EXECUTION ORDER — MỖI RENDER:
═══════════════════════════════════════════════════════════════

  Render lần 1 (mount):
  1. useState([])     → todos = [], setTodos = function
  2. useRef(1)         → nextId = { current: 1 }
  3. useCallback(...)  → addTodo = memoized function
  4. useCallback(...)  → deleteTodo = memoized function
  5. return { todos, addTodo, deleteTodo }

  Render lần 2 (sau addTodo):
  1. useState([])     → todos = [{ id:1, text:"Buy milk" }]
     ↑ React NHỚSTATE từ render trước! Không tạo mới!
  2. useRef(1)         → nextId = { current: 2 }
     ↑ useRef GIỮNGUYÊN value! Không reset!
  3. useCallback(...)  → addTodo = CÙNGfunction (deps [] không đổi!)
  4. useCallback(...)  → deleteTodo = CÙNGfunction!
  5. return { ... }

  QUY TẮC HOOKS:
  → Luôn gọi CÙNG THỨ TỰ mỗi render!
  → Không gọi trong if/for/while!
  → React dùng THỨ TỰ GỌI để match hook với state!
```

**`useRef` cho input — Uncontrolled input giải thích sâu:**

```
UNCONTROLLED INPUT — REACT LIFECYCLE:
═══════════════════════════════════════════════════════════════

  const inputRef = useRef(null);
  // Render 1: inputRef = { current: null }
  // 
  // <input ref={inputRef} />
  // → React gắn DOM element vào inputRef.current!
  // → Sau render 1: inputRef = { current: <input> }

  User gõ "B-u-y m-i-l-k":
  → DOM input value: "Buy milk"
  → React: KHÔNG biết! Không re-render!
  → inputRef.current.value = "Buy milk" (đọc trực tiếp DOM!)

  Khi handleSubmit:
  → inputRef.current.value → "Buy milk"
  → addTodo("Buy milk") → thêm vào state!
  → inputRef.current.value = '' → clear DOM trực tiếp!
  → inputRef.current.focus() → focus DOM trực tiếp!

  So sánh CONTROLLED:
  const [text, setText] = useState('');
  <input value={text} onChange={e => setText(e.target.value)} />
  → Gõ "B" → setText("B") → re-render → input hiện "B"!
  → Gõ "u" → setText("Bu") → re-render → input hiện "Bu"!
  → 8 chữ cái = 8 re-renders! 😬
  → Todo chỉ cần value lúc submit → uncontrolled HIỆU QUẢ hơn!
```

**`handleSubmit` — Boolean return pattern:**

```
BOOLEAN RETURN — ELEGANT CONTROL FLOW:
═══════════════════════════════════════════════════════════════

  const handleSubmit = () => {
    if (addTodo(inputRef.current.value)) {
      //  ↑ addTodo trả TRUE khi thành công!
      inputRef.current.value = '';
      inputRef.current.focus();
    }
    // addTodo trả FALSE → KHÔNG clear input!
    // → User vẫn thấy text → biết cần sửa!
  };

  Tại sao addTodo RETURN boolean thay vì tự clear?
  → SEPARATION OF CONCERNS!
  → useTodos hook KHÔNG biết về DOM (không có inputRef!)
  → Component (TodoList) BIẾT về DOM!
  → Hook xử lý DATA, component xử lý DOM!

  Alternative: throw error?
  const addTodo = (text) => {
    if (!trimmed) throw new Error('Empty!');
    // ...
  };
  try { addTodo(text); clear(); } catch { /* don't clear */ }
  → QUÁL MỨC! Boolean đơn giản hơn! ✅
```

**`onKeyDown` — Inline handler:**

```
INLINE HANDLER — KHI NÀO CHẤP NHẬN ĐƯỢC:
═══════════════════════════════════════════════════════════════

  <input onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />

  Mỗi render tạo FUNCTION MỚI?
  → CÓ! (e) => ... tạo mới mỗi render!
  → Nhưng: input là HTML element, KHÔNG phải React component!
  → Không có React.memo overhead!
  → Performance impact: GẦN NHƯ ZERO!

  Khi nào PHẢI extract:
  → Khi pass props cho child component có React.memo!
    <TodoItem onKeyDown={inlineFunction} /> 
    → memo bị vô hiệu! Function MỚI mỗi render!
  → PHẢI dùng useCallback!

  Input element → inline OK! ✅
  Child component → useCallback! ✅
```

**JSX `todos.map()` + key — Deep explanation:**

```
MAP + KEY — REACT SI VÀ:
═══════════════════════════════════════════════════════════════

  {todos.map((todo) => (
    <TodoItem key={todo.id} todo={todo} onDelete={deleteTodo} />
  ))}

  .map() trả về ARRAY of JSX:
  → [<TodoItem />, <TodoItem />, <TodoItem />]
  → React render từng element trong array!

  key={todo.id} — React dùng để IDENTIFY:
  → THÊM todo mới: React thấy key MỚI → tạo DOM mới!
  → XOÁ todo: React thấy key BIẾN MẤT → xoá DOM!
  → MOVE todo: React thấy key ĐỔI VỊ TRÍ → move DOM!
  → Không key: React phải GUESS → sai → bug! 💀

  onDelete={deleteTodo}
  → deleteTodo được useCallback wrap!
  → CÙNGfunction reference mỗi render!
  → TodoItem React.memo so sánh props:
    → todo cùng reference? → SKIP render!
    → onDelete cùng reference? → SKIP render!
    → CẢ HAI cùng → SKIP! Performance! 🚀
```

### So sánh Vanilla JS ↔ React — Side by Side

```
VANILLA JS vs REACT — TỪNG THAO TÁC:
═══════════════════════════════════════════════════════════════

  ┌───────────────┬─────────────────────┬────────────────────┐
  │ Thao tác      │ Vanilla JS          │ React              │
  ├───────────────┼─────────────────────┼────────────────────┤
  │ Lưu state     │ this.todos = []     │ useState([])       │
  │               │ manual property     │ reactive state     │
  ├───────────────┼─────────────────────┼────────────────────┤
  │ Thêm todo     │ push + appendChild  │ setTodos(prev =>   │
  │               │ (2 thao tác!)       │   [...prev, new])  │
  │               │                     │ (1 thao tác!)      │
  ├───────────────┼─────────────────────┼────────────────────┤
  │ Xoá todo      │ filter + li.remove  │ setTodos(prev =>   │
  │               │ (2 thao tác!)       │   prev.filter())   │
  │               │                     │ (1 thao tác!)      │
  ├───────────────┼─────────────────────┼────────────────────┤
  │ XSS protect   │ _escapeHtml() thủ   │ JSX tự escape!     │
  │               │ công!               │ Miễn phí!          │
  ├───────────────┼─────────────────────┼────────────────────┤
  │ Event         │ addEventListener    │ onClick prop       │
  │               │ + closure           │ Declarative!       │
  ├───────────────┼─────────────────────┼────────────────────┤
  │ Cleanup       │ removeEventListener │ React auto cleanup │
  │               │ (thủ công!)         │ (unmount!)         │
  ├───────────────┼─────────────────────┼────────────────────┤
  │ Re-render     │ Không có! Manual!   │ Automatic!         │
  │               │                     │ State change →     │
  │               │                     │ re-render!         │
  └───────────────┴─────────────────────┴────────────────────┘

  KẾT LUẬN:
  → Vanilla JS: NHIỀU code hơn, PHẢI sync thủ công!
  → React: ÍT code hơn, automatic sync!
  → Nhưng: Vanilla JS giúp HIỂU DOM thật sự hoạt động!
  → Phỏng vấn: biết CẢ HAI = strong candidate! ✅
```

### ♿ Accessibility — ARIA cho Todo List

```
ACCESSIBILITY — NÂNG CAO UX:
═══════════════════════════════════════════════════════════════

  1. ARIA LABELS:
  <input
    type="text"
    aria-label="New todo item"          ← screen reader biết!
    placeholder="Add new task..."
  />
  <button aria-label="Add todo">Submit</button>
  <button aria-label="Delete Buy milk">Delete</button>
  → Mỗi button có label CỤ THỂ!
  → Screen reader: "Delete Buy milk, button" ✅

  2. ARIA LIVE REGION (thông báo thay đổi!):
  <div aria-live="polite" aria-atomic="true">
    {todos.length} items remaining
  </div>
  → Thêm/xoá todo → screen reader TỰ ĐỘNG đọc!
  → "3 items remaining" → user biết!
  → polite: đọc SAU khi user dừng interaction!

  3. ROLE + STRUCTURE:
  <ul role="list" aria-label="Todo items">
    <li role="listitem">
      <span>Buy milk</span>
      <button>Delete</button>
    </li>
  </ul>
  → Screen reader hiểu: "Todo items, list, 3 items"!

  4. KEYBOARD NAVIGATION:
  → Tab: di chuyển giữa input → Submit → Delete buttons!
  → Enter: submit form (đã implement!)
  → Escape: clear input? (bonus!)
  → Delete key: xoá focused todo? (bonus!)

  5. FOCUS MANAGEMENT:
  → Sau khi xoá todo: focus vào TODO TIẾP THEO!
     (không để focus biến mất → user "lạc"!)
  → Sau khi thêm: focus về input (đã implement!)
```

### 🧪 Testing Strategy — Cách test Todo List

```
TESTING — CÁC TEST CASE:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────┬────────────────────────────┐
  │ Test Case                │ Expected Result            │
  ├──────────────────────────┼────────────────────────────┤
  │ Add "Buy milk"           │ List hiện "Buy milk"       │
  │ Add "" (empty)           │ Không thêm, input giữ ""  │
  │ Add "   " (spaces)       │ Không thêm (trim!)        │
  │ Add rồi check input     │ Input TRỐNG sau add        │
  │ Add rồi check focus     │ Input có focus             │
  │ Delete "Buy milk"        │ "Buy milk" biến mất       │
  │ Delete rồi check array  │ todos[] không có item      │
  │ Add 3, delete giữa      │ 2 items còn lại, đúng id  │
  │ Enter key submit         │ Todo được thêm            │
  │ XSS: <script>alert(1)   │ Hiện text, không execute   │
  │ Rapid add 5 items        │ 5 todos, ids unique        │
  └──────────────────────────┴────────────────────────────┘

  REACT TESTING (RTL):
  test('adds todo on submit', () => {
    render(<TodoList />);
    const input = screen.getByPlaceholderText('Add new task...');
    const submit = screen.getByText('Submit');
    
    fireEvent.change(input, { target: { value: 'Buy milk' } });
    fireEvent.click(submit);
    
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  test('does not add empty todo', () => {
    render(<TodoList />);
    fireEvent.click(screen.getByText('Submit'));
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
```

---

## §1.3 Giải thích Todo List — Từng phần

### Code Vanilla JS — Phân tích từng method

#### `constructor()` — Khởi tạo

```javascript
constructor(container) {
  this.container =
    typeof container === 'string'
      ? document.querySelector(container)
      : container;
  // ...
}
```

```
CONSTRUCTOR — FLEXIBLE INPUT:
═══════════════════════════════════════════════════════════════

  Tại sao check typeof?
  → Cho phép 2 cách sử dụng:

  new TodoList('#todoApp');           // string → querySelector!
  new TodoList(document.getElementById('todoApp')); // element trực tiếp!

  Pattern này rất phổ biến trong thư viện UI:
  → jQuery: $('selector') hoặc $(element)
  → React: document.getElementById('root')
  → Swiper, Chart.js... đều support cả 2!

  Lợi ích: API linh hoạt, developer chọn cách nào cũng được!
```

#### `_bindEvents()` — Tại sao underscore?

```
UNDERSCORE PREFIX — CONVENTION:
═══════════════════════════════════════════════════════════════

  _bindEvents()
  _addTodo()
  _renderTodo()
  _deleteTodo()
  _escapeHtml()

  Underscore _ = "PRIVATE method"!
  → Đây là CONVENTION, không phải enforcement!
  → JavaScript KHÔNG enforce private (trừ ES2022 #field)!
  → Nhưng developer BIẾT: "không gọi từ bên ngoài!"

  Nếu dùng ES2022:
  #addTodo() { ... }  // THỰC SỰ private! SyntaxError nếu gọi ngoài!
  Nhưng _ convention vẫn phổ biến hơn vì compatibility!
```

#### `_addTodo()` — Từng bước chi tiết

```javascript
_addTodo() {
  // BƯỚC 1: Đọc input và trim!
  const text = this.input.value.trim();
  if (!text) return; // guard clause!

  // BƯỚC 2: Tạo data object!
  const todo = { id: this.nextId++, text, completed: false };
  //                    ↑ postfix ++: dùng giá trị HIỆN TẠI rồi tăng!
  //                    nextId=1 → todo.id=1, nextId trở thành 2!
  
  // BƯỚC 3: Lưu vào array!
  this.todos.push(todo);

  // BƯỚC 4: Render ra DOM!
  this._renderTodo(todo);

  // BƯỚC 5: UX - clear và focus!
  this.input.value = '';
  this.input.focus();
}
```

```
_ADDTODO — FLOW MÔ PHỎNG:
═══════════════════════════════════════════════════════════════

  User gõ "Buy milk" rồi click Submit:

  Bước 1: text = "Buy milk".trim() = "Buy milk"
          !text = !"Buy milk" = false → KHÔNG return!

  Bước 2: nextId = 1 (hiện tại)
          todo = { id: 1, text: "Buy milk", completed: false }
          nextId = 2 (sau ++)

  Bước 3: this.todos = [{ id: 1, text: "Buy milk", ... }]

  Bước 4: _renderTodo → DOM:
          <ul>
            <li data-id="1">
              <span>Buy milk</span>
              <button class="delete-btn">Delete</button>
            </li>
          </ul>

  Bước 5: input.value = "" → ô input trống!
          input.focus() → cursor nhấp nháy trong input!

  User gõ "Walk dog" rồi Enter:
  → todo = { id: 2, text: "Walk dog", ... }
  → nextId = 3
  → DOM thêm <li data-id="2">Walk dog</li>

  DATA vs DOM — CẢ HAI PHẢI SYNC:
  this.todos = [todo1, todo2]  ← DATA (JavaScript memory!)
  <ul><li>todo1</li><li>todo2</li></ul>  ← DOM (browser render!)
  → Thêm: push vào array + appendChild vào <ul>!
  → Xoá: filter array + remove <li>!
  → NẾU KHÔNG SYNC → data và UI khác nhau! BUG! 💀
```

#### `_renderTodo()` — createElement vs innerHTML

```
CREATEELEMENT vs INNERHTML:
═══════════════════════════════════════════════════════════════

  CÁCH 1: innerHTML (code hiện tại dùng!)
  li.innerHTML = `<span>${text}</span><button>Delete</button>`;
  ✅ Code ngắn, dễ đọc!
  ❌ Phải escape thủ công (XSS!)
  ❌ Chậm hơn (browser parse HTML string!)

  CÁCH 2: createElement (thuần DOM)
  const span = document.createElement('span');
  span.textContent = text;  // tự escape!
  const btn = document.createElement('button');
  btn.textContent = 'Delete';
  li.append(span, btn);
  ✅ An toàn (không cần escape!)
  ✅ Nhanh hơn (không parse HTML!)
  ❌ Code dài hơn!

  Code hiện tại dùng innerHTML + _escapeHtml():
  → Ngắn gọn + an toàn!
  → Trade-off: ngắn gọn vs performance!
  → Todo list nhỏ → performance không quan trọng!
```

#### `_deleteTodo()` — Synced xoá data + DOM

```javascript
_deleteTodo(id) {
  // BƯỚC 1: Xoá khỏi DATA array!
  this.todos = this.todos.filter((t) => t.id !== id);
  //          ↑ tạo array MỚI, bỏ todo có id matching!
  //          ↑ IMMUTABLE: không thay đổi array cũ!

  // BƯỚC 2: Xoá khỏi DOM!
  const li = this.list.querySelector(`[data-id="${id}"]`);
  if (li) li.remove();
  //  ↑ check null: phòng trường hợp DOM đã bị xoá!
}
```

```
FILTER — CÁCH HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  this.todos = [
    { id: 1, text: "Buy milk" },
    { id: 2, text: "Walk dog" },
    { id: 3, text: "Read book" },
  ];

  Xoá id=2:
  this.todos.filter(t => t.id !== 2)
  → t.id !== 2:
    { id: 1 } → 1 !== 2 → true → GIỮ!
    { id: 2 } → 2 !== 2 → false → BỎ!
    { id: 3 } → 3 !== 2 → true → GIỮ!
  → Kết quả: [{ id: 1 }, { id: 3 }]

  Tại sao filter thay vì splice?
  → splice THAY ĐỔI array gốc (mutate!)
  → filter TẠO array mới (immutable!)
  → Immutable = dễ debug, dễ undo, ít bug!
```

#### `_escapeHtml()` — Cơ chế chi tiết

```
ESCAPE HTML — TỪNG BƯỚC:
═══════════════════════════════════════════════════════════════

  Input: "<img src=x onerror=alert(1)>"

  Bước 1: div = document.createElement('div')
  → Tạo div MỚI (chưa gắn vào page!)
  → div trống!

  Bước 2: div.textContent = "<img src=x onerror=alert(1)>"
  → textContent KHÔNG parse HTML!
  → Browser coi toàn bộ là TEXT thuần!
  → KHÔNG tạo <img> element!

  Bước 3: div.innerHTML
  → Browser đọc text content → trả HTML escaped string!
  → "<" → "&lt;"
  → ">" → "&gt;"
  → '"' → "&quot;"
  → Kết quả: "&lt;img src=x onerror=alert(1)&gt;"
  → Hiển thị TEXT, không chạy code! ✅

  CÁC PHƯƠNG PHÁP ESCAPE KHÁC:
  1. textContent trick (code hiện tại!) — đơn giản!
  2. Regex replace: str.replace(/</g, '&lt;') — thủ công!
  3. DOMPurify library — chuyên nghiệp, handle edge cases!
  4. Template literals + sanitize — server-side thường dùng!
```

---

### Code React — Phân tích từng phần

#### `useTodos` hook — Tại sao tách ra?

```
CUSTOM HOOK — SEPARATION OF CONCERNS:
═══════════════════════════════════════════════════════════════

  KHÔNG tách hook (tất cả trong component):
  function TodoList() {
    const [todos, setTodos] = useState([]);
    const nextId = useRef(1);
    const addTodo = ...;
    const deleteTodo = ...;
    // + UI logic + event handlers!
    return <div>...</div>;
  }
  → Component LỘN XỘN! 50+ dòng!
  → Không reuse được logic!

  CÓ tách hook:
  function useTodos() {
    // CHỈ state logic!
    return { todos, addTodo, deleteTodo };
  }
  function TodoList() {
    const { todos, addTodo, deleteTodo } = useTodos();
    // CHỈ UI logic!
    return <div>...</div>;
  }

  Lợi ích:
  1. REUSABLE: dùng useTodos() trong component KHÁC!
  2. TESTABLE: test hook RIÊNG, không cần render!
  3. READABLE: mỗi phần ngắn, dễ hiểu!
  4. COMPOSABLE: kết hợp nhiều hooks!
```

#### Updater function `setTodos(prev => ...)`

```javascript
const addTodo = useCallback((text) => {
  setTodos((prev) => [         // ← updater function!
    ...prev,                    // ← spread array cũ!
    { id: nextId.current++, text: trimmed, completed: false },
  ]);
}, []);
```

```
UPDATER FUNCTION — TẠI SAO DÙNG:
═══════════════════════════════════════════════════════════════

  ❌ Trực tiếp (stale state!):
  setTodos([...todos, newTodo]);
  → "todos" có thể STALE nếu state chưa update!
  → Click nhanh 2 lần → cả 2 thấy CÙNG todos → mất 1 todo!

  ✅ Updater function:
  setTodos((prev) => [...prev, newTodo]);
  → "prev" luôn là state MỚI NHẤT!
  → Click nhanh 2 lần → đúng! Không mất data!

  Ví dụ stale state:
  todos = [A]
  Click 1: setTodos([...todos, B]) → todos=[A] → set [A,B]
  Click 2: setTodos([...todos, C]) → todos=[A] (STALE!) → set [A,C]
  → Kết quả: [A,C] → MẤT B! 💀

  Với updater:
  Click 1: setTodos(prev => [...prev, B]) → prev=[A] → set [A,B]
  Click 2: setTodos(prev => [...prev, C]) → prev=[A,B] → set [A,B,C]
  → Kết quả: [A,B,C] → ĐÚNG! ✅
```

#### `useCallback` dependency array `[]`

```
USECALLBACK — DEPENDENCY ARRAY:
═══════════════════════════════════════════════════════════════

  const addTodo = useCallback((text) => {
    setTodos((prev) => [...prev, newTodo]);
    //         ↑ updater function → không phụ thuộc "todos"!
  }, []); // ← EMPTY dependency array!

  Tại sao [] rỗng?
  → addTodo KHÔNG đọc bất kỳ state/prop nào trực tiếp!
  → setTodos dùng updater (prev =>) → không cần "todos"!
  → nextId.current — ref, không trigger re-render!
  → → KHÔNG CÓ dependency = [] rỗng!

  Nếu có dependency:
  const addTodo = useCallback((text) => {
    setTodos([...todos, newTodo]); // ← đọc "todos" trực tiếp!
  }, [todos]); // ← PHẢI thêm "todos"!
  → Mỗi lần todos thay đổi → addTodo TẠO LẠI! Lãng phí!

  → Updater function + [] = TỐI ƯU NHẤT! ✅
```

#### `key={todo.id}` — Tại sao QUAN TRỌNG?

```
KEY PROP — REACT RECONCILIATION:
═══════════════════════════════════════════════════════════════

  ❌ KHÔNG có key (hoặc key={index}):
  todos = [A, B, C]
  DOM:  <li>A</li> <li>B</li> <li>C</li>

  Xoá B: todos = [A, C]
  React so sánh:
  Index 0: A → A (giữ!)
  Index 1: B → C (thay đổi text! Re-render!)
  Index 2: C → (xoá!)
  → React update LI thứ 2, xoá LI thứ 3!
  → KHÔNG hiệu quả! Phải update content thay vì move!

  ✅ CÓ key={todo.id}:
  todos = [A(id:1), B(id:2), C(id:3)]
  DOM:  <li key=1>A</li> <li key=2>B</li> <li key=3>C</li>

  Xoá B(id:2): todos = [A(id:1), C(id:3)]
  React so sánh:
  key=1: A → A (giữ!)
  key=2: B → (xoá!)
  key=3: C → C (giữ!)
  → React CHỈ xoá LI có key=2! Hiệu quả! ✅

  QUY TẮC:
  → LUÔN dùng unique, stable ID làm key!
  → KHÔNG dùng index (thay đổi khi xoá/thêm giữa!)
  → KHÔNG dùng Math.random() (mỗi render key mới! Disaster!)
```

#### `TodoItem` component riêng — Tại sao?

```
COMPONENT SEPARATION — NHỎ = TỐT:
═══════════════════════════════════════════════════════════════

  KHÔNG tách (render inline):
  {todos.map(todo => (
    <li key={todo.id}>
      <span>{todo.text}</span>
      <button onClick={() => deleteTodo(todo.id)}>Delete</button>
    </li>
  ))}

  CÓ tách TodoItem:
  function TodoItem({ todo, onDelete }) {
    return (
      <li>
        <span>{todo.text}</span>
        <button onClick={() => onDelete(todo.id)}>Delete</button>
      </li>
    );
  }

  Lợi ích:
  1. React.memo() — wrap TodoItem để SKIP re-render!
     const TodoItem = React.memo(({ todo, onDelete }) => ...);
     → Thêm todo MỚI → chỉ render 1 TodoItem!
     → Không re-render todos KHÁC! Performance! 🚀

  2. Readable — component nhỏ, dễ đọc!
  3. Reusable — dùng TodoItem ở nơi khác!
  4. Testable — test TodoItem riêng!
```

---

### Advanced Patterns — Giải thích sâu

#### Lazy initializer `useState(() => ...)`

```
LAZY INITIALIZER:
═══════════════════════════════════════════════════════════════

  ❌ Chạy MỖI RENDER:
  const [todos, setTodos] = useState(
    JSON.parse(localStorage.getItem('todos')) || []
  );
  → localStorage.getItem + JSON.parse chạy MỖI RENDER!
  → Chỉ cần kết quả LẦN ĐẦU → lãng phí!

  ✅ Lazy — chỉ chạy LẦN ĐẦU:
  const [todos, setTodos] = useState(() => {
    return JSON.parse(localStorage.getItem('todos')) || [];
  });
  → Function () => ... chỉ được GỌI lần đầu tiên!
  → Từ lần render thứ 2: React SKIP, dùng state hiện tại!
  → Performance tốt hơn với expensive operations!

  Khi nào dùng lazy initializer?
  → Đọc localStorage, sessionStorage!
  → Complex computation (sort, filter lớn!)
  → KHÔNG cần cho giá trị đơn giản: useState(0), useState('')!
```

#### Immutable update với `map` — Toggle complete

```
MAP — IMMUTABLE UPDATE:
═══════════════════════════════════════════════════════════════

  prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)

  Step by step:
  prev = [
    { id: 1, text: "A", completed: false },
    { id: 2, text: "B", completed: false },
    { id: 3, text: "C", completed: true },
  ]

  toggleComplete(2):
  map xử lý từng item:
  → id:1 → 1 === 2? NO → trả lại GỐC (không copy!)
  → id:2 → 2 === 2? YES → { ...t, completed: !false } = { id:2, completed: true }
  → id:3 → 3 === 2? NO → trả lại GỐC!

  Kết quả: [
    gốc id:1,              ← cùng reference!
    MỚI { id:2, completed: true },  ← object MỚI!
    gốc id:3,              ← cùng reference!
  ]
  → Array MỚI (immutable!)
  → Chỉ item thay đổi là object mới!
  → React so sánh reference → chỉ re-render TodoItem id:2! ✅
```

#### `useMemo` cho filtered todos — Derived state

```
USEMEMO — DERIVED STATE:
═══════════════════════════════════════════════════════════════

  const filteredTodos = useMemo(() => {
    switch (filter) { ... }
  }, [todos, filter]);

  Tại sao useMemo?
  → filteredTodos là DERIVED từ todos + filter!
  → Chỉ cần tính lại khi todos HOẶC filter thay đổi!

  KHÔNG có useMemo:
  → Mỗi render → filter chạy lại → O(N) mỗi lần!
  → Nếu parent re-render → filter chạy lại (dù data không đổi!)

  CÓ useMemo:
  → React cache kết quả!
  → todos không đổi + filter không đổi → trả cache! O(1)!
  → CHỈ tính lại khi dependency thay đổi!

  LƯU Ý: KHÔNG useMemo mọi thứ!
  → Chi phí useMemo (so sánh deps) > chi phí filter nhỏ!
  → Chỉ dùng khi: array LỚN, computation NẶNG!
  → 10 todos? Không cần. 10,000 todos? CẦN! ✅
```

---

# 🎤 RADIO Interview Walkthrough — Todo List

### R — Requirements (Yêu cầu)

Khi nghe "Build a Todo List", **ĐỪNG code ngay!** Hãy hỏi interviewer để clarify scope. Việc hỏi câu hỏi đúng cho thấy bạn **suy nghĩ trước khi code** — dấu hiệu của senior engineer.

```
REQUIREMENTS — CÂU HỎI CẦN HỎI:
═══════════════════════════════════════════════════════════════

  Interviewer: "Build a Todo List."
  Bạn HỎI:

  1. "Todo có thể EDIT sau khi thêm không?"
     → Nếu CÓ: cần inline editing UI (click text → input)!
       → Save/Cancel buttons, or Enter/Escape!
       → Phức tạp hơn đáng kể!
     → Nếu KHÔNG: chỉ add + delete — đơn giản!
     ⭐ HỎI ĐẦU TIÊN vì ảnh hưởng architecture!

  2. "Cần PERSIST data không? (refresh page giữ data)"
     → Nếu CÓ: localStorage, IndexedDB hoặc backend API!
       → Cần serialize/deserialize logic!
     → Nếu KHÔNG: in-memory array — đơn giản!
     ⭐ Thường interviewer nói "không cần" cho 30 phút!

  3. "Có TOGGLE complete? FILTER? PRIORITY?"
     → Basic: add + delete only!
     → Medium: + toggle complete (checkbox/strikethrough)!
     → Advanced: + filter (All/Active/Completed)!
     → TodoMVC: + edit, counter, "Clear completed"!
     ⭐ Negotiate scope: "Tôi sẽ làm basic trước,
        rồi thêm toggle + filter nếu đủ thời gian!"

  4. "Có giới hạn SỐ LƯỢNG todos không?"
     → Ảnh hưởng performance considerations!
     → < 100: không cần optimize!
     → > 10,000: cần virtualization!

  5. "KEYBOARD shortcuts? Accessibility?"
     → Enter key submit = MUST HAVE!
     → ARIA attributes = bonus points!
     → Tab navigation = extra credit!

  6. "Có DnD (drag and drop) để REORDER không?"
     → Nếu có: cần DnD library hoặc HTML5 DnD API!
     → Rất phức tạp — thường out of scope!

  7. "Vanilla JS hay React?"
     → Biết cả 2 = impressive!
     → "Tôi sẽ code Vanilla trước, rồi convert React!"

  8. "Unit tests?"
     → Thường không yêu cầu trong 30 phút!
     → Nhưng MENTION testing strategy = bonus!
```

```
SCOPE NEGOTIATION — CHIẾN LƯỢC:
═══════════════════════════════════════════════════════════════

  30 phút interview:
  ┌──────────────────────────────────────────┐
  │ MUST HAVE (15 phút):                     │
  │ ✅ Add todo                              │
  │ ✅ Delete todo                            │
  │ ✅ Clear input after add                  │
  │ ✅ Empty validation (trim!)               │
  │ ✅ Enter key submit                       │
  ├──────────────────────────────────────────┤
  │ SHOULD HAVE (10 phút):                   │
  │ 🟡 Toggle complete                       │
  │ 🟡 XSS protection                        │
  │ 🟡 Auto-focus after add                  │
  ├──────────────────────────────────────────┤
  │ NICE TO HAVE (5 phút):                   │
  │ 🔵 Filter (All/Active/Completed)         │
  │ 🔵 localStorage persistence              │
  │ 🔵 "Clear all completed" button          │
  │ 🔵 Counter "X items left"               │
  └──────────────────────────────────────────┘

  → Nói scope NAY với interviewer!
  → "Tôi sẽ implement MUST trước, rồi thêm features!"
  → Interviewer thấy: structured thinking! ✅
```

### A — Architecture (Kiến trúc)

```
ARCHITECTURE — COMPONENT TREE:
═══════════════════════════════════════════════════════════════

  VANILLA JS:
  ┌──────────────────────────────────────────┐
  │  TodoList (class)                        │
  │  ┌────────────────────────────────────┐  │
  │  │  State: this.todos = []            │  │
  │  │  State: this.nextId = 1            │  │
  │  ├────────────────────────────────────┤  │
  │  │  DOM refs:                         │  │
  │  │  → this.input (#todoInput)         │  │
  │  │  → this.submitBtn (#submitBtn)     │  │
  │  │  → this.list (#todoList)           │  │
  │  ├────────────────────────────────────┤  │
  │  │  Methods:                          │  │
  │  │  → _addTodo()    (validate+create) │  │
  │  │  → _renderTodo() (DOM creation)    │  │
  │  │  → _deleteTodo() (data+DOM sync)   │  │
  │  │  → _escapeHtml() (XSS protection)  │  │
  │  └────────────────────────────────────┘  │
  └──────────────────────────────────────────┘

  REACT:
  ┌──────────────────────────────────────────┐
  │  TodoList (component)                    │
  │  ├── useTodos() hook                     │
  │  │   ├── todos state                     │
  │  │   ├── addTodo()                       │
  │  │   └── deleteTodo()                    │
  │  ├── inputRef                            │
  │  ├── handleSubmit()                      │
  │  └── UI:                                 │
  │      ├── <input ref={inputRef} />        │
  │      ├── <button onClick={handleSubmit}> │
  │      └── todos.map → <TodoItem />        │
  │          ├── todo.text                   │
  │          └── <button onDelete>           │
  └──────────────────────────────────────────┘
```

```
DATA FLOW — SO SÁNH CHI TIẾT:
═══════════════════════════════════════════════════════════════

  VANILLA JS — TWO-WAY MANUAL SYNC:
  ┌─────────┐     ┌───────────┐     ┌────────┐
  │  User   │────→│ _addTodo  │────→│ DATA   │
  │  action │     │ validate  │     │ todos[]│
  └─────────┘     │ create    │     └────┬───┘
                  └─────┬─────┘          │
                        │                │
                  ┌─────▼─────┐     ┌────▼───┐
                  │ _render   │────→│  DOM   │
                  │ Todo()    │     │ <ul>   │
                  └───────────┘     └────────┘
  → Developer UPDATE cả DATA lẫn DOM!
  → 2 operations mỗi action (push + appendChild)!

  REACT — ONE-WAY DATA FLOW:
  ┌─────────┐     ┌───────────┐
  │  User   │────→│ addTodo   │
  │  action │     │ setState  │
  └─────────┘     └─────┬─────┘
                        │
                  ┌─────▼─────┐
                  │  React    │ ← React TỰ ĐỘNG!
                  │  re-render│
                  │  diffing  │
                  │  DOM patch│
                  └───────────┘
  → Developer CHỈ update STATE!
  → React lo TOÀN BỘ DOM update!
```

### D — Design (Thiết kế)

```
DESIGN DECISIONS — GIẢI THÍCH TẠI SAO:
═══════════════════════════════════════════════════════════════

  1. ID strategy: auto-increment vs UUID?
     ┌─────────────────┬───────────────────────┐
     │ Auto-increment   │ UUID                  │
     ├─────────────────┼───────────────────────┤
     │ id: 1, 2, 3...  │ "a1b2c3d4-..."        │
     │ Nhỏ (number!)   │ Lớn (36 chars!)       │
     │ O(1) generation │ O(1) nhưng nặng hơn   │
     │ ❌ Multi-client  │ ✅ Unique globally     │
     │   collision!    │                        │
     └─────────────────┴───────────────────────┘
     → Phỏng vấn: auto-increment đủ! Single client!
     → Production: UUID nếu có multi-user/sync!

  2. Input: controlled vs uncontrolled?
     ┌────────────────────┬────────────────────┐
     │ Controlled         │ Uncontrolled       │
     │ (useState)         │ (useRef)           │
     ├────────────────────┼────────────────────┤
     │ Mỗi key → render! │ Không render!      │
     │ Real-time validate │ Validate khi submit│
     │ Character counter! │ Không có!          │
     │ Debounced search!  │ Không phù hợp!    │
     └────────────────────┴────────────────────┘
     → Todo: chỉ cần value khi Submit → UNCONTROLLED!
     → Search bar: cần real-time → CONTROLLED!

  3. Delete: soft vs hard?
     → Soft: { ...todo, deleted: true } → filter UI!
       → Undo possible! History tracking!
     → Hard: array.filter(t => t.id !== id) → GONE!
       → Simple! Ít memory!
     → Chọn: hard delete (requirement đơn giản!)

  4. Data structure: Array vs Map vs Object?
     → Array: ordered, O(N) find, O(1) push!
     → Map: unordered, O(1) find, preserves insert order!
     → Object: unordered (trước ES6), O(1) find!
     → Chọn: Array!
       → Cần ORDER hiển thị!
       → N nhỏ → O(N) find chấp nhận!
       → React .map() works natively với arrays!

  5. Class vs Module/Function (Vanilla JS)?
     → Class: encapsulate state + methods!
     → Module: closures, IIFE pattern!
     → Chọn: Class — clear structure, easy to explain!

  6. Tại sao TÁCH TodoItem riêng (React)?
     → Memoization (React.memo)!
     → Component nhỏ = dễ test, dễ đọc!
     → Props rõ ràng: { todo, onDelete }!
```

### I — Implementation (Triển khai)

Đây là phần QUAN TRỌNG NHẤT trong phỏng vấn. Hãy **nói TO** logic trong đầu khi code:

```
VANILLA JS — IMPLEMENTATION WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (2 phút): HTML structure!
  → "Tôi bắt đầu với HTML: input, submit button, empty ul."
  → <div id="todoApp">
      <input id="todoInput" />
      <button id="submitBtn">Submit</button>
      <ul id="todoList"></ul>
    </div>

  BƯỚC 2 (3 phút): Class skeleton!
  → "Tôi dùng class để encapsulate state và logic."
  → constructor: query DOM elements, init state!
  → _bindEvents: attach click + keydown listeners!

  BƯỚC 3 (5 phút): _addTodo logic!
  → "Quan trọng nhất. Tôi trim input, validate empty,
     tạo todo object với unique id, push vào array,
     render ra DOM, rồi clear input và focus lại."
  → Nói TẠI SAO mỗi bước:
    → trim: "prevent whitespace-only todos"
    → guard clause: "early return for invalid input"
    → nextId++: "unique stable identifier"
    → clear+focus: "UX optimization for rapid entry"

  BƯỚC 4 (5 phút): _renderTodo + _deleteTodo!
  → "Render tạo li element, escape HTML cho safety,
     thêm delete button với listener."
  → "Delete syncs cả data array VÀ DOM."

  BƯỚC 5 (2 phút): _escapeHtml + testing!
  → "Security: escape user input to prevent XSS."
  → Manual testing: add, delete, empty submit, XSS input!
```

```
REACT — IMPLEMENTATION WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (3 phút): Custom hook — useTodos!
  → "Tôi tách state logic thành custom hook.
     Separation of concerns."
  → useState cho todos array!
  → useRef cho nextId (không cần re-render!)
  → useCallback cho addTodo, deleteTodo (stable refs!)
  → addTodo return boolean (control input clearing!)

  BƯỚC 2 (3 phút): TodoItem component!
  → "Component riêng, receive props.
     Memoizable nếu cần optimize."
  → Destructure { todo, onDelete }!
  → Simple render: span + delete button!

  BƯỚC 3 (5 phút): TodoList component!
  → "Main component, compose useTodos + TodoItem."
  → useRef cho input (uncontrolled!)
  → handleSubmit: call addTodo, clear if success!
  → onKeyDown: Enter key shortcut!
  → map todos → TodoItem with key={todo.id}!

  BƯỚC 4 (2 phút): Testing + edge cases!
  → Test: add, delete, empty, rapid adds!
```

### Edge Cases — Đề phòng!

```
EDGE CASES — PHẢI MENTION TRONG PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  1. EMPTY INPUT:
     → "  " (spaces only) → trim → "" → CHẶN!
     → "" (nothing) → CHẶN!
     → Đã handle: if (!text) return!

  2. XSS ATTACK:
     → User nhập: <script>alert('hacked')</script>
     → Vanilla: _escapeHtml() chống!
     → React: JSX auto-escape!
     → ⚠ GiẢI THÍCH cho interviewer: "Tôi escape
        user input vì security concern!"

  3. RAPID CLICKS:
     → User click Submit 10 lần nhanh!
     → Mỗi click thêm 1 todo → 10 todos!
     → Vanilla: direct mutation → OK!
     → React: updater function → OK (no stale state!)
     → Nếu có API: cần debounce/throttle!

  4. VERY LONG TEXT:
     → User paste 10,000 characters!
     → UI: text overflow? Cần CSS ellipsis!
     → Performance: không ảnh hưởng logic!
     → Mention: "Tôi sẽ add maxLength nếu cần!"

  5. SPECIAL CHARACTERS:
     → User nhập: <b>bold</b> & "quotes"
     → Escape handles: &lt;b&gt;bold&lt;/b&gt;
     → Hiển thị literal text, không render HTML!

  6. DELETE LAST ITEM:
     → List trống → hiện message "No todos yet"?
     → Bonus UX nhưng thường không yêu cầu!

  7. MEMORY LEAK (Vanilla JS):
     → addEventListener trên mỗi delete button!
     → li.remove() → listener GARBAGE COLLECTED!
     → Modern browsers handle this! Nhưng MENTION!
```

### O — Optimization (Tối ưu)

```
OPTIMIZATION — TỪ CƠ BẢN ĐẾN NÂNG CAO:
═══════════════════════════════════════════════════════════════

  L1 — CƠ BẢN (phỏng vấn mention!)
  ─────────────────────────────────────────────
  1. React.memo cho TodoItem:
     const TodoItem = React.memo(({ todo, onDelete }) => ...);
     → Chỉ re-render khi todo hoặc onDelete THAY ĐỔI!
     → 100 todos, thêm 1 → chỉ render 1 mới!
     → Kết hợp useCallback cho onDelete = stable ref!

  2. Event delegation (Vanilla JS):
     → 1 listener trên <ul> thay vì N listeners!
     → Đã giải thích chi tiết ở §1.3!

  3. Uncontrolled input (useRef):
     → 0 re-renders khi user gõ!
     → Chỉ đọc value khi submit!

  L2 — TRUNG BÌNH (mention nếu đủ thời gian!)
  ─────────────────────────────────────────────
  4. Debounce localStorage save:
     useEffect(() => {
       const timer = setTimeout(() => {
         localStorage.setItem('todos', JSON.stringify(todos));
       }, 300);
       return () => clearTimeout(timer);
     }, [todos]);
     → Không save MỖI thay đổi → save 300ms sau!

  5. Batch operations:
     → "Delete all completed" = 1 setState call!
     const deleteCompleted = useCallback(() => {
       setTodos(prev => prev.filter(t => !t.completed));
     }, []);
     → KHÔNG loop qua từng completed todo!

  L3 — NÂNG CAO (chỉ mention, không cần code!)
  ─────────────────────────────────────────────
  6. Virtualization (react-window / react-virtuoso):
     → 50,000 todos → chỉ render ~20 visible items!
     → DOM count = constant bất kể data size!
     → Scroll → recycle DOM elements!

  7. Optimistic updates (nếu có API):
     → UI update NGAY khi user click!
     → Gửi API request background!
     → API fail → ROLLBACK state!
     → User thấy instant response! Perceived performance!
```

```
INTERVIEW TIPS — LÀM THẾ NÀO ĐỂ IMPRESS:
═══════════════════════════════════════════════════════════════

  ⏱ TIMELINE (30 phút):
  ├── 0-3 phút:   Hỏi Requirements!
  ├── 3-5 phút:   Explain Architecture!
  ├── 5-8 phút:   HTML structure + CSS (nếu cần!)
  ├── 8-22 phút:  Implementation (code chính!)
  ├── 22-25 phút: Testing + edge cases!
  └── 25-30 phút: Discuss optimizations!

  💡 NÓI TO KHI CODE:
  → "Tôi trim input vì user có thể gõ toàn spaces..."
  → "Tôi dùng escapeHtml để chống XSS..."
  → "Tôi dùng data-id thay vì index vì index
     thay đổi khi xoá giữa array..."

  🎯 ĐIỂM CỘNG:
  → Hỏi requirements trước!
  → Mention XSS protection!
  → Mention event delegation!
  → Mention React.memo optimization!
  → Handle edge cases (empty, rapid clicks!)
  → Accessibility (Enter key, focus management!)

  ⚠ SAI LẦM PHỔ BIẾN:
  → Code NGAY mà không hỏi yêu cầu!
  → Quên trim() → whitespace todos!
  → Dùng index làm key trong React!
  → Quên XSS protection trong Vanilla JS!
  → Không handle empty input!
  → Code xong mà không test!
```

---

# 📋 Component 2: Job Board

## Kiến Trúc Job Board

```
JOB BOARD:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────┐
  │  Hacker News Job Board                  │
  ├─────────────────────────────────────────┤
  │  ┌───────────────────────────────────┐  │
  │  │ Firezone is hiring Elixir/Rust    │  │  ← job card
  │  │ By: jamilbk · 2023-05-12         │  │
  │  └───────────────────────────────────┘  │
  │  ┌───────────────────────────────────┐  │
  │  │ Supabase is hiring Engineers      │  │
  │  │ By: kiwi · 2023-05-11            │  │
  │  └───────────────────────────────────┘  │
  │  ... (6 jobs per page)                  │
  │                                         │
  │         [  Load more  ]                 │  ← pagination
  └─────────────────────────────────────────┘

  API Flow:
  1. GET /jobstories.json → [id1, id2, id3, ...]
  2. GET /item/{id}.json → { title, by, time, url }
  3. Hiển thị 6 jobs, click "Load more" → 6 tiếp!
```

---

## §2.1 Job Board — Vanilla JavaScript

```javascript
// ═══ Vanilla JS Job Board ═══

class JobBoard {
  constructor(container) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;

    this.API_BASE = 'https://hacker-news.firebaseio.com/v0';
    this.PAGE_SIZE = 6;
    this.jobIds = [];
    this.currentPage = 0;
    this.isLoading = false;

    this._init();
  }

  async _init() {
    this.container.innerHTML = `
      <h1>Hacker News Job Board</h1>
      <div id="jobList"></div>
      <button id="loadMoreBtn" style="display:none">Load more</button>
      <div id="loading">Loading...</div>
    `;

    this.jobList = this.container.querySelector('#jobList');
    this.loadMoreBtn = this.container.querySelector('#loadMoreBtn');
    this.loadingEl = this.container.querySelector('#loading');

    this.loadMoreBtn.addEventListener('click', () => this._loadMore());

    try {
      // Bước 1: Fetch TẤT CẢ job IDs!
      const res = await fetch(`${this.API_BASE}/jobstories.json`);
      this.jobIds = await res.json();

      // Bước 2: Load page đầu tiên!
      await this._loadMore();
    } catch (err) {
      this.loadingEl.textContent = 'Failed to load jobs.';
    }
  }

  async _loadMore() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.loadMoreBtn.disabled = true;
    this.loadingEl.style.display = 'block';

    const start = this.currentPage * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;
    const pageIds = this.jobIds.slice(start, end);

    try {
      // Fetch 6 jobs SONG SONG! Không 1-1 tuần tự!
      const jobs = await Promise.all(
        pageIds.map((id) =>
          fetch(`${this.API_BASE}/item/${id}.json`).then((r) => r.json())
        )
      );

      jobs.forEach((job) => this._renderJob(job));
      this.currentPage++;

      // Còn jobs không? Ẩn/hiện nút!
      const hasMore = end < this.jobIds.length;
      this.loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    } catch (err) {
      this.loadingEl.textContent = 'Error loading jobs.';
    } finally {
      this.isLoading = false;
      this.loadMoreBtn.disabled = false;
      this.loadingEl.style.display = 'none';
    }
  }

  _renderJob(job) {
    const card = document.createElement('div');
    card.className = 'job-card';

    const date = new Date(job.time * 1000);
    const dateStr = date.toLocaleDateString('vi-VN');

    const titleHtml = job.url
      ? `<a href="${job.url}" target="_blank" rel="noopener">${job.title}</a>`
      : `<span>${job.title}</span>`;

    card.innerHTML = `
      <h2>${titleHtml}</h2>
      <p>By: ${job.by} · ${dateStr}</p>
    `;

    this.jobList.appendChild(card);
  }
}

new JobBoard('#app');
```

---

### 📋 Phân tích yêu cầu — Job Board

Bài này phức tạp hơn Todo List đáng kể vì liên quan đến **async data fetching** và **pagination**. Trước khi code, phải hiểu API:

```
HN API — KIẾN TRÚC:
═══════════════════════════════════════════════════════════════

  Hacker News API là REST API CÔNG KHAI, KHÔNG cần auth!
  Base URL: https://hacker-news.firebaseio.com/v0

  Endpoints dùng trong bài:
  1. GET /jobstories.json
     → Response: [35908337, 35904973, 35900922, ...]
     → Array chứa TẤT CẢ job IDs (200-500 items!)
     → Chỉ IDs — KHÔNG có chi tiết!

  2. GET /item/{id}.json
     → Response: {
         "id": 35908337,
         "title": "Firezone (YC W22) is hiring...",
         "by": "jamilbk",
         "time": 1683838872,
         "url": "https://firezone.dev/careers",
         "type": "job"
       }
     → Chi tiết đầy đủ cho 1 job!

  TẠI SAO API THIẾT KẾ NHƯ VẬY?
  → Scalability! Endpoint /jobstories rất nhẹ (chỉ numbers!)
  → Client quyết định fetch BAO NHIÊU details
  → Giống cursor-based pagination!
  → Firebase Realtime Database → optimized cho queries nhỏ!
```

```
CÂU HỎI CẦN HỎI INTERVIEWER:
═══════════════════════════════════════════════════════════════

  1. "API cho sẵn hay tự mock?"
     → HN API public — dùng thật!

  2. "Pagination: Load more button hay infinite scroll?"
     → Load more: đơn giản hơn cho 30 phút!
     → Infinite scroll: IntersectionObserver — phức tạp hơn!

  3. "Mỗi page bao nhiêu items?"
     → 6 items (convention cho job board!)

  4. "Job card hiển thị gì?"
     → Title (link nếu có URL), author, date!
     → KHÔNG hiển thị: description, salary (API không có!)

  5. "Error handling? Retry logic?"
     → Hiện error message, retry bằng click "Load more" lại!
     → Không cần auto-retry!

  6. "Caching? Offline support?"
     → Scope: không cần cho phỏng vấn!
```

---

## §2.1 Job Board — Vanilla JavaScript

```javascript
// ═══ Vanilla JS Job Board ═══

class JobBoard {
  constructor(container) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;

    this.API_BASE = 'https://hacker-news.firebaseio.com/v0';
    this.PAGE_SIZE = 6;
    this.jobIds = [];
    this.currentPage = 0;
    this.isLoading = false;

    this._init();
  }

  async _init() {
    this.container.innerHTML = `
      <h1>Hacker News Job Board</h1>
      <div id="jobList"></div>
      <button id="loadMoreBtn" style="display:none">Load more</button>
      <div id="loading">Loading...</div>
    `;

    this.jobList = this.container.querySelector('#jobList');
    this.loadMoreBtn = this.container.querySelector('#loadMoreBtn');
    this.loadingEl = this.container.querySelector('#loading');

    this.loadMoreBtn.addEventListener('click', () => this._loadMore());

    try {
      // Bước 1: Fetch TẤT CẢ job IDs!
      const res = await fetch(`${this.API_BASE}/jobstories.json`);
      this.jobIds = await res.json();

      // Bước 2: Load page đầu tiên!
      await this._loadMore();
    } catch (err) {
      this.loadingEl.textContent = 'Failed to load jobs.';
    }
  }

  async _loadMore() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.loadMoreBtn.disabled = true;
    this.loadingEl.style.display = 'block';

    const start = this.currentPage * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;
    const pageIds = this.jobIds.slice(start, end);

    try {
      // Fetch 6 jobs SONG SONG! Không 1-1 tuần tự!
      const jobs = await Promise.all(
        pageIds.map((id) =>
          fetch(`${this.API_BASE}/item/${id}.json`).then((r) => r.json())
        )
      );

      jobs.forEach((job) => this._renderJob(job));
      this.currentPage++;

      // Còn jobs không? Ẩn/hiện nút!
      const hasMore = end < this.jobIds.length;
      this.loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    } catch (err) {
      this.loadingEl.textContent = 'Error loading jobs.';
    } finally {
      this.isLoading = false;
      this.loadMoreBtn.disabled = false;
      this.loadingEl.style.display = 'none';
    }
  }

  _renderJob(job) {
    const card = document.createElement('div');
    card.className = 'job-card';

    const date = new Date(job.time * 1000);
    const dateStr = date.toLocaleDateString('vi-VN');

    const titleHtml = job.url
      ? `<a href="${job.url}" target="_blank" rel="noopener">${job.title}</a>`
      : `<span>${job.title}</span>`;

    card.innerHTML = `
      <h2>${titleHtml}</h2>
      <p>By: ${job.by} · ${dateStr}</p>
    `;

    this.jobList.appendChild(card);
  }
}

new JobBoard('#app');
```

### Giải thích Vanilla JS — Line by line

**`_init()` — Tại sao set innerHTML TRƯỚC rồi mới query:**

```
_INIT() LIFECYCLE:
═══════════════════════════════════════════════════════════════

  BƯỚC 1: Set container innerHTML!
  this.container.innerHTML = `
    <h1>...</h1>
    <div id="jobList"></div>
    <button id="loadMoreBtn">...</button>
    <div id="loading">Loading...</div>
  `;
  → Tạo TOÀN BỘ UI skeleton trong 1 thao tác!
  → Browser parse HTML string → tạo DOM elements!
  → 1 innerHTML = 1 reflow! Hiệu quả!

  BƯỚC 2: Query DOM elements!
  this.jobList = this.container.querySelector('#jobList');
  this.loadMoreBtn = this.container.querySelector('#loadMoreBtn');
  → Query SAU khi innerHTML → elements ĐÃ TỒN TẠI!
  → Nếu query TRƯỚC innerHTML → null! 💀

  BƯỚC 3: Bind events!
  this.loadMoreBtn.addEventListener('click', ...);
  → Bind SAU khi elements tồn tại!

  BƯỚC 4: Fetch data!
  const res = await fetch(...)
  → Async! Chờ network!
  → UI skeleton ĐÃ HIỆN → user thấy "Loading..."

  THỨ TỰ QUAN TRỌNG:
  innerHTML → query → bind → fetch
  → User thấy UI NGAY (loading state!)
  → Không phải nhìn blank page!
```

**`_loadMore()` — Concurrency guard:**

```
ISLOADING FLAG — RACE CONDITION PROTECTION:
═══════════════════════════════════════════════════════════════

  async _loadMore() {
    if (this.isLoading) return;  // ← GUARD!
    this.isLoading = true;       // ← LOCK!
    // ... fetch logic ...
    this.isLoading = false;      // ← UNLOCK!
  }

  Tại sao cần isLoading guard?
  → User click "Load more" 3 lần nhanh!
  → Không guard: 3 _loadMore() chạy SONG SONG!
  → Cả 3 đều đọc this.currentPage = 0!
  → Cả 3 fetch CÙNG page → DUPLICATE jobs hiện 3 lần! 💀

  Với guard:
  Click 1: isLoading=false → PASS → set true → fetch page 0
  Click 2: isLoading=true → CHẶN! Return ngay!
  Click 3: isLoading=true → CHẶN!
  Fetch xong: isLoading=false → unlock cho click tiếp!

  THÊM: disabled button!
  this.loadMoreBtn.disabled = true;
  → User KHÔNG Click được khi disabled!
  → Double protection: logic guard + UI guard!
```

**`try/catch/finally` — Error handling pattern:**

```
TRY/CATCH/FINALLY — 3 GIAI ĐOẠN:
═══════════════════════════════════════════════════════════════

  try {
    // Happy path! Fetch dữ liệu!
    const jobs = await Promise.all(...);
    jobs.forEach(job => this._renderJob(job));
    this.currentPage++;
  }
  catch (err) {
    // Error path! Một trong các fetch FAIL!
    this.loadingEl.textContent = 'Error loading jobs.';
  }
  finally {
    // LUÔN CHẠY! Dù success hay error!
    this.isLoading = false;        // unlock!
    this.loadMoreBtn.disabled = false;  // enable button!
    this.loadingEl.style.display = 'none';  // ẩn loading!
  }

  Tại sao finally QUAN TRỌNG?
  → Nếu không có finally:
    try { ... } catch { ... }
    this.isLoading = false;  // ← Chạy SAU catch!
    → Tương tự! Nhưng...

  → Nếu catch THROW lỗi tiếp:
    catch (err) {
      throw new Error('Critical!');
      // Code sau KHÔNG CHẠY! isLoading mãi = true! 💀
    }

  → finally LUÔN chạy dù catch có throw!
  → Guaranteed cleanup! Best practice! ✅
```

**`_renderJob()` — Conditional title:**

```
CONDITIONAL TITLE RENDERING:
═══════════════════════════════════════════════════════════════

  const titleHtml = job.url
    ? `<a href="${job.url}" target="_blank" rel="noopener">${job.title}</a>`
    : `<span>${job.title}</span>`;

  Tại sao check job.url?
  → Một số jobs KHÔNG CÓ URL!
    → Company đăng trên HN trực tiếp, không link ngoài!
  → Có URL: tạo <a> link để click mở trang!
  → Không URL: tạo <span> text thuần!

  ⚠ XSS risk!
  → job.title và job.url đến từ API (user-generated!)
  → API data thường đã sanitized!
  → Nhưng best practice: escape nếu không tin API!
  → Code hiện tại KHÔNG escape → acceptable cho HN API!
    (vì HN API sanitizes data server-side!)
```

**`toLocaleDateString('vi-VN')` — Localization:**

```
DATE LOCALIZATION:
═══════════════════════════════════════════════════════════════

  new Date(1683838872 * 1000).toLocaleDateString('vi-VN')
  → "12/05/2023" (DD/MM/YYYY — format Việt Nam!)

  Các locale khác:
  'en-US' → "5/12/2023" (MM/DD/YYYY!)
  'en-GB' → "12/05/2023" (DD/MM/YYYY!)
  'ja-JP' → "2023/05/12" (YYYY/MM/DD!)
  'de-DE' → "12.5.2023" (DD.MM.YYYY!)

  Tại sao dùng toLocaleDateString?
  → Tự động format theo locale!
  → Không cần manual padding (01 vs 1!)
  → Hỗ trợ timezone!
  → Native API, không cần moment.js hay date-fns!

  Relative time (bonus):
  "5 minutes ago", "2 hours ago", "3 days ago"
  → Dùng Intl.RelativeTimeFormat (native!)
  → Hoặc: new Date() - job.time → calculate delta!
```

---

## §2.2 Job Board — React

```javascript
import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'https://hacker-news.firebaseio.com/v0';
const PAGE_SIZE = 6;

function useJobBoard() {
  const [jobIds, setJobIds] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch job IDs (chỉ 1 lần!)
  useEffect(() => {
    fetch(`${API_BASE}/jobstories.json`)
      .then((r) => r.json())
      .then(setJobIds)
      .catch(() => setError('Failed to load job IDs'));
  }, []);

  // Fetch job details khi page thay đổi!
  const loadMore = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    const start = page * PAGE_SIZE;
    const pageIds = jobIds.slice(start, start + PAGE_SIZE);

    try {
      const newJobs = await Promise.all(
        pageIds.map((id) =>
          fetch(`${API_BASE}/item/${id}.json`).then((r) => r.json())
        )
      );
      setJobs((prev) => [...prev, ...newJobs]);
      setPage((prev) => prev + 1);
    } catch {
      setError('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  }, [jobIds, page, isLoading]);

  // Auto-load page đầu tiên khi có jobIds!
  useEffect(() => {
    if (jobIds.length > 0 && jobs.length === 0) {
      loadMore();
    }
  }, [jobIds]); // eslint-disable-line

  const hasMore = page * PAGE_SIZE < jobIds.length;

  return { jobs, isLoading, error, hasMore, loadMore };
}

function JobCard({ job }) {
  const date = new Date(job.time * 1000).toLocaleDateString('vi-VN');

  return (
    <div className="job-card">
      <h2>
        {job.url ? (
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            {job.title}
          </a>
        ) : (
          job.title
        )}
      </h2>
      <p>By: {job.by} · {date}</p>
    </div>
  );
}

function JobBoard() {
  const { jobs, isLoading, error, hasMore, loadMore } = useJobBoard();

  return (
    <div>
      <h1>Hacker News Job Board</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
      {isLoading && <p>Loading...</p>}
      {hasMore && !isLoading && (
        <button onClick={loadMore}>Load more</button>
      )}
    </div>
  );
}
```

### Giải thích React — Line by line

**5 state variables — Tại sao nhiều vậy?**

```
STATE MANAGEMENT — 5 VARIABLES:
═══════════════════════════════════════════════════════════════

  const [jobIds, setJobIds] = useState([]);   // ALL IDs
  const [jobs, setJobs] = useState([]);       // Loaded details
  const [page, setPage] = useState(0);        // Current page
  const [isLoading, setIsLoading] = useState(false);  // Loading flag
  const [error, setError] = useState(null);   // Error message

  Mỗi variable có VAI TRÒ riêng:
  → jobIds: nguồn dữ liệu GỐC (fetch 1 lần!)
  → jobs: dữ liệu TÍCH LŨY (append mỗi page!)
  → page: counter để TÍNH slice position!
  → isLoading: UI indicator + double-click guard!
  → error: error message cho user!

  useReducer ALTERNATIVE (cho production!):
  const [state, dispatch] = useReducer(reducer, {
    jobIds: [], jobs: [], page: 0,
    isLoading: false, error: null
  });
  dispatch({ type: 'LOAD_MORE_START' });
  dispatch({ type: 'LOAD_MORE_SUCCESS', payload: newJobs });
  → Tập trung state logic! Dễ debug!
  → Nhưng useState đủ cho phỏng vấn 30 phút!
```

**`useEffect` fetch IDs — Lifecycle:**

```
USEEFFECT LIFECYCLE — FETCH IDS:
═══════════════════════════════════════════════════════════════

  useEffect(() => {
    fetch(`${API_BASE}/jobstories.json`)
      .then((r) => r.json())
      .then(setJobIds)             // ← shorthand!
      .catch(() => setError(...));
  }, []);  // ← EMPTY DEPS = chỉ chạy 1 lần khi MOUNT!

  .then(setJobIds) là shorthand cho:
  .then((data) => setJobIds(data))
  → Pass function trực tiếp vào .then!
  → .then gọi setJobIds(data) với kết quả!

  Tại sao .then chain thay vì async/await?
  → useEffect callback KHÔNG THỂ async!
    useEffect(async () => { ... })  // ❌ Return Promise!
  → useEffect cần return CLEANUP function hoặc undefined!
  → .then chain = OK trong non-async function!

  Alternative (async IIFE):
  useEffect(() => {
    (async () => {
      const res = await fetch(...);
      const data = await res.json();
      setJobIds(data);
    })();
  }, []);
  → IIFE = Immediately Invoked Function Expression!
  → Tạo async function và gọi ngay!
```

**`loadMore` useCallback — Dependency analysis:**

```
LOADMORE DEPENDENCIES:
═══════════════════════════════════════════════════════════════

  const loadMore = useCallback(async () => {
    if (isLoading) return;     // ← đọc isLoading!
    // ...
    const pageIds = jobIds.slice(start, ...);  // ← đọc jobIds!
    const start = page * PAGE_SIZE;  // ← đọc page!
    // ...
  }, [jobIds, page, isLoading]);  // ← TẤT CẢ dependencies!

  Tại sao CẦN dependencies?
  → loadMore ĐỌC 3 state: jobIds, page, isLoading!
  → Nếu [] rỗng: loadMore LUÔNthấy giá trị LẦN ĐẦU!
    → jobIds = [] (empty!), page = 0 (mãi!)
    → STALE CLOSURE! 💀

  Hậu quả stale closure:
  → Load page 0 xong → page = 1!
  → Nhưng loadMore nhớ page = 0 (closure cũ!)
  → Click "Load more" → fetch page 0 LẦN NỮA! 💀

  Với dependencies [jobIds, page, isLoading]:
  → page thay đổi → loadMore TẠO MỚI!
  → loadMore mới → đọc page ĐÚNG!
```

**`hasMore` — Derived state:**

```
DERIVED STATE — KHÔNG CẦN useState:
═══════════════════════════════════════════════════════════════

  const hasMore = page * PAGE_SIZE < jobIds.length;

  Tại sao KHÔNG dùng useState cho hasMore?
  → hasMore = f(page, jobIds.length)!
  → Computed TỪ state khác!
  → useState thêm → phải sync THÊM 1 state!
  → Race condition: page update nhưng hasMore chưa update!

  Derived state = TÍNH trực tiếp mỗi render!
  → Luôn ĐÚNG vì tính từ source of truth!
  → Không có sync problem!
  → Giống useMemo nhưng KHÔNG cần memo (rẻ quá!)!
```

**JobCard — Component separation:**

```
JOBCARD — TẠI SAO TÁCH RIÊNG:
═══════════════════════════════════════════════════════════════

  function JobCard({ job }) {
    return (
      <div className="job-card">
        <h2>
          {job.url ? (
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              {job.title}
            </a>
          ) : (
            job.title
          )}
        </h2>
        <p>By: {job.by} · {date}</p>
      </div>
    );
  }

  Lợi ích:
  1. React.memo wrappable!
     const JobCard = React.memo(({ job }) => ...);
     → Load more → chỉ render 6 cards MỚI!
     → 30 cards cũ SKIP re-render!

  2. Single Responsibility!
     → JobCard CHỈ lo hiển thị 1 job!
     → JobBoard lo data fetching + pagination!

  3. Testable!
     → test(<JobCard job={mockJob} />)
     → Không cần mock API!
```

### So sánh Vanilla JS ↔ React — Job Board

```
ASYNC HANDLING — SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬───────────────────┬──────────────────┐
  │ Pattern          │ Vanilla JS        │ React            │
  ├─────────────────┼───────────────────┼──────────────────┤
  │ Init fetch      │ _init() async     │ useEffect([])    │
  │                 │ fire-and-forget   │ declarative      │
  ├─────────────────┼───────────────────┼──────────────────┤
  │ Loading state   │ this.isLoading    │ useState(false)  │
  │                 │ manual DOM update │ auto re-render   │
  ├─────────────────┼───────────────────┼──────────────────┤
  │ Error display   │ element.textCont  │ {error && <p>}   │
  │                 │ manual!           │ declarative!     │
  ├─────────────────┼───────────────────┼──────────────────┤
  │ Accumulate data │ forEach+append    │ setJobs(prev =>  │
  │                 │ (DOM + array!)    │   [...prev, new])│
  ├─────────────────┼───────────────────┼──────────────────┤
  │ Toggle button   │ style.display     │ {hasMore && btn} │
  │                 │ manual!           │ conditional!     │
  └─────────────────┴───────────────────┴──────────────────┘
```

---

## §2.3 Giải thích Job Board — Từng phần

### Two-step API — Tại sao 2 requests?

```
TWO-STEP API:
═══════════════════════════════════════════════════════════════

  HN API KHÔNG CÓ endpoint "/jobs?page=1&limit=6"!

  Step 1: GET /jobstories.json
  → [35908337, 35904973, 35900922, ...]
  → Chỉ trả IDs! Không có title, by, url!

  Step 2: GET /item/{id}.json (cho mỗi id!)
  → { title, by, time, url, ... }
  → PHẢI gọi TỪNG item riêng!

  Vấn đề: 6 jobs = 1 + 6 = 7 API calls!
  → Giải pháp: Promise.all() — gọi 6 SONG SONG! 🚀
```

### `Promise.all()` — Song song, không tuần tự!

```javascript
// ❌ TUẦN TỰ — CHẬM:
const job1 = await fetch(`/item/${ids[0]}.json`).then(r => r.json());
const job2 = await fetch(`/item/${ids[1]}.json`).then(r => r.json());
// Mỗi cái đợi cái trước xong → 6 × 200ms = 1200ms!

// ✅ SONG SONG — NHANH:
const jobs = await Promise.all(
  ids.map(id => fetch(`/item/${id}.json`).then(r => r.json()))
);
// Tất cả chạy cùng lúc → max(200ms) = 200ms! 🚀
```

```
PROMISE.ALL — HÌNH DUNG:
═══════════════════════════════════════════════════════════════

  TUẦN TỰ (await từng cái):
  ──── fetch 1 ────── fetch 2 ────── fetch 3 ──→ 600ms

  SONG SONG (Promise.all):
  ──── fetch 1 ────┐
  ──── fetch 2 ────┼──→ tất cả xong! 200ms!
  ──── fetch 3 ────┘

  Promise.all([p1, p2, p3]):
  → Chạy TẤT CẢ promises cùng lúc!
  → Chờ CHẬM NHẤT xong → trả array kết quả!
  → Nếu 1 fail → TOÀN BỘ fail! (dùng allSettled nếu cần)
```

### Pagination logic — `slice(start, end)`

```
PAGINATION:
═══════════════════════════════════════════════════════════════

  jobIds = [id0, id1, id2, id3, id4, id5, id6, id7, ...]
  PAGE_SIZE = 6

  Page 0: start=0, end=6 → slice(0, 6) → [id0..id5]
  Page 1: start=6, end=12 → slice(6, 12) → [id6..id11]
  Page 2: start=12, end=18 → slice(12, 18) → [id12..id17]

  hasMore = end < jobIds.length
  → Nếu end >= length → ẩn nút "Load more"!

  start = page * PAGE_SIZE
  end = start + PAGE_SIZE
```

### Timestamp — `job.time * 1000`

```
UNIX TIMESTAMP:
═══════════════════════════════════════════════════════════════

  API trả: job.time = 1683838872 (giây từ 1970!)
  JS Date: cần MILLISECONDS!
  → new Date(1683838872 * 1000)
  → "2023-05-12T..."

  Tại sao * 1000?
  → Unix timestamp = GIÂY (seconds)
  → JavaScript Date = MILI GIÂY (milliseconds)
  → 1 giây = 1000 milliseconds → nhân 1000!
```

### `target="_blank" rel="noopener"` — Bảo mật!

```
TARGET="_BLANK" SECURITY:
═══════════════════════════════════════════════════════════════

  <a href="..." target="_blank">
  → Mở link trong tab MỚI!

  NHƯNG: tab mới có thể access window.opener!
  → window.opener.location = "http://phishing.com"
  → Tab GỐC bị redirect sang trang lừa đảo! 💀

  Giải pháp: rel="noopener noreferrer"
  → noopener: tab mới KHÔNG access window.opener!
  → noreferrer: không gửi Referer header!
  → AN TOÀN! ✅

  Modern browsers tự thêm noopener cho target="_blank"
  nhưng thêm thủ công = CHẮC CHẮN an toàn cho mọi browser!
```

### Loading + Error states

```
LOADING/ERROR — UX QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  3 STATES luôn cần handle:
  1. LOADING: hiện spinner/text "Loading..."
     → User biết app đang LÀM VIỆC!
  2. ERROR: hiện thông báo lỗi!
     → User biết CÓ VẤN ĐỀ!
  3. SUCCESS: hiện data!
     → User thấy kết quả!

  Không có loading state:
  → User click "Load more" → không có gì xảy ra!
  → User: "App bị broken?" → click lại → duplicate requests! 😬

  Thêm: disable nút khi đang loading!
  → Chặn double-click → tránh duplicate fetches!
```

### Vanilla JS — `async _init()` trong constructor

```
ASYNC TRONG CONSTRUCTOR — PATTERN:
═══════════════════════════════════════════════════════════════

  ❌ KHÔNG THỂ: constructor async!
  class JobBoard {
    async constructor() { ... }  // SyntaxError!
  }
  → Constructor KHÔNG thể async!
  → Constructor phải return "this" (implicit!)
  → async return Promise — XUNG ĐỘT!

  ✅ GIẢI PHÁP: gọi async method từ constructor!
  constructor(container) {
    // Setup đồng bộ trước!
    this.container = ...;
    this.jobIds = [];

    // Gọi async method!
    this._init();  // fire and forget!
    // KHÔNG await! Constructor không async!
  }

  async _init() {
    // Async logic ở đây!
    const res = await fetch(...);
    this.jobIds = await res.json();
  }

  Pattern: "fire and forget" — start async nhưng
  constructor không đợi! _init chạy background!
```

### `fetch().then(r => r.json())` — Chain giải thích

```
FETCH CHAIN — 2 BƯỚC:
═══════════════════════════════════════════════════════════════

  fetch(url)              // Bước 1: gửi HTTP request!
    .then(r => r.json())  // Bước 2: parse response body!

  Tại sao 2 bước?
  → fetch() return Response object (headers, status...)
  → Response CHƯA CÓ body data!
  → r.json() đọc body stream → parse JSON → return data!
  → r.json() cũng async → return Promise!

  Tương đương async/await:
  const response = await fetch(url);  // Response object!
  const data = await response.json(); // Parsed JSON data!

  Các methods khác ngoài .json():
  r.text()       → plain text!
  r.blob()       → binary data (images!)
  r.arrayBuffer() → raw bytes!
  r.formData()   → form data!
```

### Overfetching prevention — Chỉ fetch khi cần

```
OVERFETCHING:
═══════════════════════════════════════════════════════════════

  ❌ Fetch TẤT CẢ job details khi load:
  → 300 jobs × 1 request = 300 requests lúc khởi đầu! 💀
  → User chỉ thấy 6 → 294 requests LÃNG PHÍ!

  ✅ Fetch theo page (code hiện tại):
  → Page 0: fetch 6 jobs!
  → User click "Load more": fetch 6 tiếp!
  → User NEVER click: chỉ 6 requests!

  Chiến lược:
  1. Fetch ALL IDs (1 request — nhẹ, chỉ numbers!)
  2. Fetch DETAILS chỉ khi cần hiển thị (6 per page!)
  → Tổng: 1 + 6 = 7 requests ban đầu!
  → Tiết kiệm 293 requests! 🚀
```

### React — `useEffect` auto-load pattern

```javascript
// Auto-load page đầu tiên khi có jobIds!
useEffect(() => {
  if (jobIds.length > 0 && jobs.length === 0) {
    loadMore();
  }
}, [jobIds]); // eslint-disable-line
```

```
AUTO-LOAD PATTERN:
═══════════════════════════════════════════════════════════════

  Tại sao CẦN auto-load?
  → jobIds fetch xong → tự động load page đầu!
  → User KHÔNG cần click "Load more" lần đầu!

  Guards (if conditions):
  → jobIds.length > 0: chỉ khi đã có IDs!
  → jobs.length === 0: chỉ khi CHƯA load jobs!
    (tránh gọi lại khi re-render!)

  eslint-disable-line:
  → ESLint warning: "loadMore missing from deps!"
  → Nhưng thêm loadMore vào deps → infinite loop!
    loadMore thay đổi → useEffect chạy lại →
    loadMore thay đổi → ... 💀
  → eslint-disable = "tôi biết, cố ý!"
  → Hoặc: dùng useRef cho loadMore!
```

### Conditional rendering — hasMore

```jsx
{hasMore && !isLoading && (
  <button onClick={loadMore}>Load more</button>
)}
```

```
CONDITIONAL RENDERING — 3 TRƯỜNG HỢP:
═══════════════════════════════════════════════════════════════

  1. hasMore=true, isLoading=false:
     → true && true && <button>
     → HIỆN nút "Load more"! ✅

  2. hasMore=true, isLoading=true:
     → true && false && <button>
     → ẨN nút! (đang loading, chờ xong!)

  3. hasMore=false (hết jobs!):
     → false && ...
     → ẨN nút! (không có gì để load!)

  Pattern: && (logical AND) cho conditional render!
  → Thay vì: {hasMore ? <button>...</button> : null}
  → Ngắn hơn: {hasMore && <button>...</button>}
```

### `Promise.race()` — Timeout pattern

```
PROMISE.RACE — TIMEOUT CHO FETCH:
═══════════════════════════════════════════════════════════════

  Vấn đề: fetch() KHÔNG CÓ default timeout!
  → Server không trả lời → u wait MÃI MÃI! 💀

  Giải pháp: Promise.race()!
  const fetchWithTimeout = (url, ms = 5000) => {
    return Promise.race([
      fetch(url),                    // fetch thực tế!
      new Promise((_, reject) =>     // timeout!
        setTimeout(() => reject(new Error('Timeout')), ms)
      )
    ]);
  };

  Promise.race lấy KẾT QUẢ ĐẦU TIÊN:
  → fetch xong trước 5s → TRẢ data! ✅
  → 5s trước khi fetch xong → THROW Timeout! ❌

  So với AbortController:
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);
  fetch(url, { signal: controller.signal });
  → AbortController CANCEL request thực sự!
  → Promise.race chỉ IGNORE kết quả!
  → AbortController TỐT HƠN cho production! ✅
```

### HTTP status code — Response.ok check

```
RESPONSE.OK — KIỂM TRA STATUS:
═══════════════════════════════════════════════════════════════

  ⚠ fetch() KHÔNG throw khi status 404 hay 500!
  const res = await fetch('/item/999999.json');
  // res.status = 404, nhưng KHÔNG throw!
  // Code tiếp tục chạy bình thường! 😱

  Chỉ throw khi NETWORK ERROR (DNS fail, offline!).

  ✔ Best practice: check response.ok!
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();

  response.ok = true khi status 200-299!
  response.ok = false khi status 400-599!

  Code hiện tại KHÔNG check .ok — chấp nhận cho phỏng vấn!
  MENTION: "production cần check response.ok!" = điểm cộng!
```

### `DocumentFragment` — Batch rendering

```
DOCUMENTFRAGMENT — BATCH RENDERING:
═══════════════════════════════════════════════════════════════

  Code hiện tại:
  jobs.forEach(job => this._renderJob(job));
  // Mỗi _renderJob gọi appendChild 1 lần!
  // 6 jobs = 6 lần appendChild = 6 reflows! 😐

  Tối ưu với DocumentFragment:
  const fragment = document.createDocumentFragment();
  jobs.forEach(job => {
    const card = this._createJobCard(job);
    fragment.appendChild(card);  // Append vào fragment (memory!)
  });
  this.jobList.appendChild(fragment);  // 1 lần duy nhất!

  DocumentFragment là gì?
  → "DOM nhẹ" — tồn tại trong memory!
  → Không gắn vào page → không reflow!
  → appendChild(fragment) → MOVE tất cả children!
  → 1 reflow thay vì 6! 🚀

  Khi nào cần?
  → 6 items: không cần (chênh lệch rất nhỏ!)
  → 100+ items: DEFINITELY cần!
  → Mention: "tôi dùng DocumentFragment nếu batch lớn!"
```

### Retry với Exponential Backoff

```
RETRY PATTERN — EXPONENTIAL BACKOFF:
═══════════════════════════════════════════════════════════════

  async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url);
        if (res.ok) return res.json();
        throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        if (i === retries - 1) throw err; // Lần cuối → throw!

        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s!
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  Exponential Backoff:
  Lần 1 fail: chờ 1 giây (2^0 * 1000)
  Lần 2 fail: chờ 2 giây (2^1 * 1000)
  Lần 3 fail: chờ 4 giây (2^2 * 1000)
  Lần 4 fail: THROW! (hết retries!)

  Tại sao EXPONENTIAL thay vì constant?
  → Server overloaded → retry ngay → ĐÈ THÊM! 💀
  → Chờ lâu hơn mỗi lần → server có thời gian hồi phục!
  → Dùng trong: AWS, Google Cloud, Stripe API!

  Code hiện tại KHÔNG có retry!
  → User click "Load more" lại = manual retry!
  → Mention: "production cần auto-retry với backoff!"
```

### Event Delegation — Job Board cards

```
EVENT DELEGATION — JOB CARDS:
═══════════════════════════════════════════════════════════════

  Code hiện tại: mỗi card là static text!
  → Không có onClick trên cards!
  → Không cần event delegation!

  NHƯNG nếu mở rộng (click card → modal details?):

  ❌ Liệt kê listener:
  cards.forEach(card => {
    card.addEventListener('click', handleClick);
  });
  → 100 cards = 100 listeners! Memory!

  ✅ Event delegation:
  this.jobList.addEventListener('click', (e) => {
    const card = e.target.closest('.job-card');
    if (!card) return;
    const jobId = card.dataset.id;
    this._showJobDetail(jobId);
  });
  → 1 listener cho TẤT CẢ cards!
  → Cards thêm/xóa động → không cần re-attach!

  e.target.closest('.job-card'):
  → closest() trèo LÊN DOM tree!
  → Tìm ancestor gần nhất match selector!
  → Click vào <h2> bên trong card → vẫn tìm được card! ✅
```

### useReducer Alternative — Complex state

```javascript
// ✅ useReducer cho Job Board (production-ready!):

const initialState = {
  jobIds: [],
  jobs: [],
  page: 0,
  isLoading: false,
  error: null
};

function jobBoardReducer(state, action) {
  switch (action.type) {
    case 'FETCH_IDS_SUCCESS':
      return { ...state, jobIds: action.payload };
    case 'LOAD_MORE_START':
      return { ...state, isLoading: true, error: null };
    case 'LOAD_MORE_SUCCESS':
      return {
        ...state,
        jobs: [...state.jobs, ...action.payload],
        page: state.page + 1,
        isLoading: false
      };
    case 'LOAD_MORE_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
}
```

```
USEREDUCER — TẠI SAO TỐT HƠN:
═══════════════════════════════════════════════════════════════

  useState vấn đề:
  setIsLoading(true);
  setError(null);
  // ... fetch ...
  setJobs(prev => [...prev, ...newJobs]);
  setPage(prev => prev + 1);
  setIsLoading(false);
  → 5 setState calls! Mỗi cái có thể re-render!
  → React batch trong event handler nhưng KHÔNG trong async!
    (React 18 auto batch, nhưng phải biết!)

  useReducer lợi ích:
  1. ATOMIC updates: dispatch('LOAD_MORE_SUCCESS')
     → Update jobs + page + isLoading CÙNG LÚC!
     → 1 re-render thay vì 3!

  2. PREDICTABLE: reducer là pure function!
     → Input: (state, action) → Output: newState!
     → Dễ test: expect(reducer(state, action)).toEqual(...)!

  3. DEBUGGABLE: log mỗi action!
     → Console: FETCH_IDS_SUCCESS → LOAD_MORE_START → ...
     → Giống Redux DevTools!

  Phỏng vấn: dùng useState, MENTION useReducer là improvement! ✅
```

---

# 🎤 RADIO Interview Walkthrough — Job Board

### R — Requirements

Khi nghe "Build a Job Board", đây là bài **async data fetching** — phức tạp hơn Todo List. Interviewer muốn thấy bạn handle **API, loading states, error handling, và pagination**.

```
REQUIREMENTS — CÂU HỎI CẦN HỎI:
═══════════════════════════════════════════════════════════════

  1. "API cho sẵn hay tự thiết kế?"
     → HN API public! Không cần auth!
     → 2-step: IDs endpoint + details endpoint!
     ⭐ HỎI API FORMAT trước khi code!

  2. "Bao nhiêu jobs mỗi page?"
     → 6 per page (yêu cầu bài!)
     → Nhưng HỎI để show initiative!

  3. "Job card hiển thị GÌ?"
     → Title (link nếu có URL!)
     → Author (by field!)
     → Date (time field → convert!)
     → HN API KHÔNG có: salary, description, location!

  4. "Loading state? Error state?"
     → Loading: text, spinner, hay skeleton?
     → Error: retry button? Error boundary?
     ⭐ Hỏi này cho thấy bạn nghĩ về UX!

  5. "Pagination: Load more hay infinite scroll?"
     → Load more: đơn giản cho 30 phút!
     → Infinite scroll: nếu đủ thời gian → BONUS!

  6. "Cần search, filter, sort không?"
     → Negotiate: "Tôi làm display + pagination trước!"
     → Filter/search = scope creep nếu chỉ 30 phút!

  7. "Caching? Offline?"
     → Scope: không cần!
     → Nhưng MENTION React Query = điểm cộng!

  8. "Real-time updates?"
     → HN API không có WebSocket!
     → Polling? Không cần cho phỏng vấn!
```

```
SCOPE — JOB BOARD:
═══════════════════════════════════════════════════════════════

  30 phút:
  ┌──────────────────────────────────────────┐
  │ MUST HAVE (20 phút):                     │
  │ ✅ Fetch job IDs from API                │
  │ ✅ Fetch job details (Promise.all!)       │
  │ ✅ Display job cards (title, by, date)    │
  │ ✅ "Load more" pagination                │
  │ ✅ Loading state                          │
  │ ✅ Error handling                         │
  ├──────────────────────────────────────────┤
  │ SHOULD HAVE (7 phút):                    │
  │ 🟡 Disable button during loading         │
  │ 🟡 Conditional link (url check!)         │
  │ 🟡 rel="noopener" security               │
  ├──────────────────────────────────────────┤
  │ NICE TO HAVE (3 phút):                   │
  │ 🔵 Skeleton loading                      │
  │ 🔵 Infinite scroll                       │
  │ 🔵 React.memo for JobCard                │
  └──────────────────────────────────────────┘
```

### A — Architecture

```
ARCHITECTURE — FULL DATA FLOW:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────┐
  │ Hacker News Firebase API                 │
  │ GET /jobstories.json                     │
  │ → [id1, id2, id3, ..., id300]            │
  │                                          │
  │ GET /item/{id}.json                      │
  │ → { id, title, by, time, url, type }     │
  └──────────────┬───────────────────────────┘
                 │ fetch (async!)
  ┌──────────────▼───────────────────────────┐
  │ State Layer                               │
  │ ┌─────────────┐ ┌──────────────────────┐ │
  │ │ jobIds: []  │ │ jobs: []             │ │
  │ │ (ALL ids!)  │ │ (accumulated page    │ │
  │ │ fetch ONCE  │ │  by page!)           │ │
  │ └─────────────┘ └──────────────────────┘ │
  │ ┌──────┐ ┌──────────┐ ┌───────┐          │
  │ │page:0│ │isLoading │ │ error │          │
  │ └──────┘ └──────────┘ └───────┘          │
  └──────────────┬───────────────────────────┘
                 │ render
  ┌──────────────▼───────────────────────────┐
  │ UI Layer                                  │
  │ ┌──────────────────────────────────────┐ │
  │ │ <h1>Hacker News Job Board</h1>       │ │
  │ ├──────────────────────────────────────┤ │
  │ │ {error && <p>Error message</p>}      │ │
  │ │ <JobCard key=1 /> ← map jobs!        │ │
  │ │ <JobCard key=2 />                    │ │
  │ │ ... (6 per page, accumulated!)       │ │
  │ ├──────────────────────────────────────┤ │
  │ │ {isLoading && <p>Loading...</p>}     │ │
  │ │ {hasMore && <button>Load more</btn>} │ │
  │ └──────────────────────────────────────┘ │
  └──────────────────────────────────────────┘

  Computed values (derived, không lưu state!):
  → hasMore = page * PAGE_SIZE < jobIds.length
  → Luôn TÍNH từ state, không thêm useState!
```

### D — Design

```
DESIGN DECISIONS — GIẢI THÍCH TẠI SAO:
═══════════════════════════════════════════════════════════════

  1. Pagination: cursor vs offset?
     ┌────────────────┬─────────────────────────┐
     │ Offset         │ Cursor                  │
     ├────────────────┼─────────────────────────┤
     │ page * size    │ "after: lastId"         │
     │ slice(start,   │ Server tracks position  │
     │   end)         │ Real-time safe!         │
     │ Static data OK │ Dynamic data needed     │
     └────────────────┴─────────────────────────┘
     → HN API cho all IDs upfront → offset-like phù hợp!

  2. Promise.all vs Promise.allSettled?
     ┌─────────────────┬───────────────────────┐
     │ Promise.all     │ Promise.allSettled     │
     ├─────────────────┼───────────────────────┤
     │ 1 fail = ALL    │ Mỗi item có status    │
     │ fail! FAST fail │ {status, value/reason} │
     │ Đơn giản!       │ Partial success OK!    │
     └─────────────────┴───────────────────────┘
     → all: user retry cả page nếu fail!
     → allSettled: hiện 5/6 thành công, 1 error card!
     → Phỏng vấn: dùng all, MENTION allSettled! ✅

  3. Append vs Replace khi load more?
     → Append: jobs = [...prev, ...newJobs] — tích lũy!
     → Replace: jobs = newJobs — chỉ page hiện tại!
     → "Load more" implies APPEND! User thấy tất cả!

  4. useState vs useReducer?
     → 5 related states → useReducer tốt hơn production!
     → useState đủ cho phỏng vấn! Mention useReducer!

  5. Constants: PAGE_SIZE ở đâu?
     → NGOÀI component! const PAGE_SIZE = 6;
     → Tại sao? Không tạo lại mỗi render!
     → Dễ thay đổi (1 nơi!)!

  6. API_BASE: hardcode vs env?
     → Phỏng vấn: hardcode OK!
     → Production: process.env.REACT_APP_API_BASE!
```

### I — Implementation (Triển khai)

```
VANILLA JS — IMPLEMENTATION WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (2 phút): Class skeleton!
  → "Tôi tạo class JobBoard với constructor nhận container."
  → API_BASE, PAGE_SIZE, jobIds, currentPage, isLoading!

  BƯỚC 2 (3 phút): _init() — setup UI!
  → innerHTML tạo skeleton (h1, jobList div, button, loading!)
  → Query DOM elements sau innerHTML!
  → Bind click listener cho Load more!

  BƯỚC 3 (5 phút): Fetch jobIds!
  → "_init là async method, gọi từ constructor (fire-and-forget)."
  → fetch jobstories.json → lưu this.jobIds!
  → try/catch cho error handling!

  BƯỚC 4 (7 phút): _loadMore() — CORE LOGIC!
  → "Đây là phần quan trọng nhất."
  → isLoading guard (chống double-click!)
  → slice(start, end) cho ĐÚNG page!
  → Promise.all cho parallel fetching!
  → forEach renderJob!
  → Update currentPage + hasMore!
  → TRY/CATCH/FINALLY pattern!

  BƯỚC 5 (3 phút): _renderJob!
  → createElement div!
  → Date conversion (time * 1000!)
  → Conditional title (url check!)
  → security: rel="noopener"!

  BƯỚC 6 (2 phút): Test!
  → Mở console, verify network requests!
  → Click Load more, check pagination!
  → Test error: disconnect network!
```

```
REACT — IMPLEMENTATION WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (3 phút): Constants + custom hook skeleton!
  → API_BASE, PAGE_SIZE bên ngoài component!
  → useJobBoard hook: 5 useState!

  BƯỚC 2 (5 phút): Fetch IDs + loadMore!
  → useEffect([], ) cho initial fetch IDs!
  → loadMore = useCallback + async!
  → Promise.all cho parallel!
  → setJobs(prev => [...prev, ...newJobs]) — APPEND!

  BƯỚC 3 (3 phút): Auto-load pattern!
  → useEffect watchs jobIds → auto load page 1!
  → hasMore = derived state (không useState!)

  BƯỚC 4 (3 phút): JobCard component!
  → Conditional link rendering!
  → Date formatting!
  → rel="noopener noreferrer" security!

  BƯỚC 5 (3 phút): JobBoard UI!
  → Error display → job list → loading → load more button!
  → Conditional rendering cho mỗi section!
```

### Edge Cases — Đề phòng!

```
EDGE CASES — JOB BOARD:
═══════════════════════════════════════════════════════════════

  1. API DOWN:
     → fetch throw → catch → hiện error message!
     → User biết "có lỗi" thay vì nhìn blank page!

  2. EMPTY RESULTS:
     → jobstories.json trả [] (không có jobs!)
     → Hiện "No jobs available" message!
     → ẨN Load more button!

  3. PARTIAL FAILURE:
     → 5/6 fetches thành công, 1 fail!
     → Promise.all: TOÀN BỘ fail! User thấy error!
     → allSettled: hiện 5 cards + 1 error card!
     → Mention trade-off cho interviewer!

  4. DELETED/NULL JOBS:
     → /item/{id}.json trả null (job bị xoá!)
     → Code hiện tại: null.title → CRASH! 💀
     → Fix: filter(Boolean) sau Promise.all!
     → jobs.filter(job => job !== null)!

  5. RAPID CLICKS:
     → isLoading guard chặn double fetch!
     → Nhưng: nếu isLoading flag stale trong React?
     → useCallback deps [isLoading] resolve!

  6. NETWORK TIMEOUT:
     → Fetch không có default timeout!
     → AbortController + setTimeout cho timeout!
     → Mention: "Production cần timeout handling!"

  7. VERY LARGE LIST:
     → 500+ jobs loaded → DOM nặng!
     → Virtualization: react-window!
     → Chỉ render visible cards!
```

### O — Optimization

```
OPTIMIZATION — PHÂN TẦNG:
═══════════════════════════════════════════════════════════════

  L1 — CƠ BẢN (code trong bài!):
  ──────────────────────────────
  1. Promise.all — parallel fetching!
     → 6 requests cùng lúc thay vì tuần tự!
     → ~200ms thay vì ~1200ms!

  2. Disable button khi loading!
     → Chặn double-click!
     → UX: user biết đang process!

  3. Conditional link rendering!
     → Có URL → <a>, không URL → text!

  L2 — TRUNG BÌNH (mention!):
  ──────────────────────────────
  4. AbortController — cancel requests!
     useEffect(() => {
       const controller = new AbortController();
       fetch(url, { signal: controller.signal });
       return () => controller.abort();  // cleanup!
     }, []);
     → Unmount → cancel! Không state update after unmount!

  5. React.memo cho JobCard!
     → Load 6 more → chỉ render 6 MỚI!
     → 30 cards cũ SKIP!

  6. Skeleton loading!
     → 6 skeleton cards hiện TRƯỚC data!
     → User thấy layout → perceived faster!

  L3 — NÂNG CAO (chỉ mention!):
  ──────────────────────────────
  7. Infinite scroll!
     const observer = new IntersectionObserver(
       ([entry]) => {
         if (entry.isIntersecting && hasMore) loadMore();
       }
     );
     → Scroll đến cuối → auto-load!
     → Thay "Load more" button!

  8. SWR / React Query:
     → Cache, dedup, refetch on focus!
     → Mention library = production mindset!

  9. Prefetch next page!
     → Khi user scroll GẦN cuối → fetch trước!
     → Data ready khi user ĐẾN cuối!
```

```
INTERVIEW TIPS — JOB BOARD:
═══════════════════════════════════════════════════════════════

  ⏱ TIMELINE (30 phút):
  ├── 0-3 phút:   Hỏi API format + requirements!
  ├── 3-5 phút:   Explain architecture + data flow!
  ├── 5-10 phút:  Fetch IDs + loadMore logic!
  ├── 10-18 phút: Promise.all + render cards!
  ├── 18-22 phút: Pagination + loading/error states!
  ├── 22-25 phút: Polish (conditional link, date, security!)
  └── 25-30 phút: Edge cases + optimization discussion!

  💡 KEY TALKING POINTS:
  → "Promise.all cho parallel fetching — performance!"
  → "isLoading guard chống race condition!"
  → "try/catch/finally cho guaranteed cleanup!"
  → "rel=noopener cho security!"
  → "Derived state (hasMore) thay vì thêm useState!"

  🎯 ĐIỂM CỘNG:
  → Mention AbortController!
  → Mention Promise.allSettled alternative!
  → Mention infinite scroll as enhancement!
  → Handle null jobs (deleted posts!)
  → Explain WHY 2-step API (scalability!)

  ⚠ SAI LẦM PHỔ BIẾN:
  → Fetch tuần tự thay vì Promise.all!
  → Quên loading/error states!
  → Không guard double-click!
  → useEffect async callback (return Promise!)!
  → Quên cleanup (AbortController!)!
  → Không escape user data trong Vanilla JS!
```

### ♿ Accessibility — Job Board

```
ACCESSIBILITY — JOB BOARD:
═══════════════════════════════════════════════════════════════

  1. SEMANTIC HTML:
  <article class="job-card"> thay vì <div>!
  → Screen reader hiểu: "đây là 1 article"!
  → <section>, <article>, <nav> có nghĩa!
  → <div> KHÔNG có nghĩa semantic!

  2. LINK ACCESSIBILITY:
  <a href={url}
     target="_blank"
     rel="noopener noreferrer"
     aria-label="Open Firezone job posting in new tab"
  >
    {job.title}
  </a>
  → Screen reader: "Open Firezone job posting in new tab, link" ✅
  → Không có aria-label: chỉ đọc title text!

  3. LOADING ANNOUNCEMENT:
  <div role="status" aria-live="polite">
    {isLoading ? 'Loading jobs...' : `${jobs.length} jobs loaded`}
  </div>
  → Screen reader TỰ ĐỘNG đọc khi nội dung thay đổi!
  → polite: đọc SAU khi user dừng tương tác!

  4. BUTTON STATE:
  <button
    onClick={loadMore}
    disabled={isLoading}
    aria-label={isLoading ? 'Loading more jobs' : 'Load 6 more jobs'}
  >
    {isLoading ? 'Loading...' : 'Load more'}
  </button>
  → disabled: screen reader biết "button dimmed"!
  → aria-label: context cụ thể hơn text!

  5. LANDMARK REGIONS:
  <main>
    <h1>Hacker News Job Board</h1>
    <section aria-label="Job listings">
      {/* cards */}
    </section>
    <nav aria-label="Pagination">
      <button>Load more</button>
    </nav>
  </main>
  → Screen reader: "main landmark", "Job listings region"!
  → User navigate nhanh bằng landmarks!
```

### 🧪 Testing Strategy — Job Board

```
TESTING — JOB BOARD:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────┬────────────────────────────┐
  │ Test Case                │ Expected                     │
  ├──────────────────────────┼────────────────────────────┤
  │ Initial load             │ 6 job cards rendered          │
  │ "Load more" click        │ 12 total cards (6+6!)        │
  │ Loading state            │ "Loading..." visible         │
  │ Button disabled          │ KHÔNG click được khi loading │
  │ All jobs loaded          │ Button BIẾN MẤT               │
  │ API error                │ Error message hiện           │
  │ Job với URL             │ Title là <a> link            │
  │ Job không URL            │ Title là text thuần          │
  │ Date format              │ DD/MM/YYYY (vi-VN)           │
  │ Empty job IDs            │ "No jobs" message            │
  │ Null job details         │ Skip null, render vàlid      │
  └──────────────────────────┴────────────────────────────┘

  REACT TESTING (RTL + MSW):
  // Mock API với MSW (Mock Service Worker)!
  const server = setupServer(
    rest.get('*/jobstories.json', (req, res, ctx) => {
      return res(ctx.json([1, 2, 3, 4, 5, 6, 7]));
    }),
    rest.get('*/item/:id.json', (req, res, ctx) => {
      return res(ctx.json({
        id: req.params.id,
        title: `Job ${req.params.id}`,
        by: 'testuser',
        time: 1683838872,
        url: 'https://example.com'
      }));
    })
  );

  test('loads and displays initial jobs', async () => {
    render(<JobBoard />);
    // Chờ loading xong
    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(6);
    });
    expect(screen.getByText('Load more')).toBeInTheDocument();
  });

  test('loads more jobs on button click', async () => {
    render(<JobBoard />);
    await waitFor(() => screen.getAllByRole('article'));
    fireEvent.click(screen.getByText('Load more'));
    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(7);
    });
  });

  test('hides button when all loaded', async () => {
    // ... verify button disappears!
  });
```

---

# 📬 Component 3: Contact Form

## Kiến Trúc Contact Form

```
CONTACT FORM:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────┐
  │  Contact Us                             │
  ├─────────────────────────────────────────┤
  │  Name:                                  │
  │  ┌───────────────────────────────────┐  │
  │  │                                   │  │
  │  └───────────────────────────────────┘  │
  │  Email:                                 │
  │  ┌───────────────────────────────────┐  │
  │  │                                   │  │
  │  └───────────────────────────────────┘  │
  │  Message:                               │
  │  ┌───────────────────────────────────┐  │
  │  │                                   │  │
  │  │                                   │  │
  │  └───────────────────────────────────┘  │
  │                          [    Send    ] │
  └─────────────────────────────────────────┘

  ĐẶC BIỆT: KHÔNG dùng JavaScript!
  → HTML form submission thuần!
  → POST data đến API endpoint!
```

---

### 📋 Phân tích yêu cầu — Contact Form

Đây là bài **đơn giản nhất** nhưng lại **sâu nhất** về HTML fundamentals. Interviewer muốn thấy bạn hiểu **browser native capabilities** mà KHÔNG cần JavaScript.

```
CÂU HỎI CẦN HỎI INTERVIEWER:
═══════════════════════════════════════════════════════════════

  1. "Form submit đến đâu? URL nào?"
     → action URL cho sẵn!
     → Nếu không cho: hỏi! Không giả định!

  2. "Có cần JavaScript không?"
     → KHÔNG! HTML-only! Đây là KEY INSIGHT!
     → Interviewer test: bạn biết form NATIVE không?
     ⭐ HỎI này cho thấy bạn hiểu vấn đề!

  3. "Client-side validation level nào?"
     → HTML attributes: required, type=email!
     → Custom JS validation? Regex? Real-time?
     → Scope: HTML attributes đủ!

  4. "Submit xong page reload hay stay?"
     → HTML form: reload (redirect to response page!)
     → SPA: stay on page, show message!
     → Scope: HTML form = reload OK!

  5. "Có file upload không?"
     → Nếu CÓ: cần enctype="multipart/form-data"!
     → Nếu KHÔNG: default encoding OK!

  6. "Success/error UI?"
     → HTML only: server trả HTML response page!
     → JS: inline message, toast notification!
```

```
APPROACH — 3 CẤP ĐỘ:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬───────────────────┬──────────────┐
  │ HTML Only        │ JS Enhanced       │ React SPA    │
  ├──────────────────┼───────────────────┼──────────────┤
  │ 0 dòng JS!       │ addEventListener  │ useState     │
  │ Browser submit   │ preventDefault    │ controlled   │
  │ Full page reload │ fetch() / XHR     │ onSubmit     │
  │ Server renders   │ Inline feedback   │ No reload    │
  │ response page    │ Loading states    │ Toast/modal  │
  ├──────────────────┼───────────────────┼──────────────┤
  │ ✅ Simple        │ 🟡 Moderate       │ 🔴 Complex   │
  │ ✅ Accessible    │ ✅ Good UX        │ ✅ Best UX   │
  │ ✅ No-JS works   │ ❌ Needs JS       │ ❌ Needs JS  │
  │ ❌ Page reload   │ ✅ No reload      │ ✅ No reload │
  └──────────────────┴───────────────────┴──────────────┘

  Bài này yêu cầu CẤP ĐỘ 1: HTML Only!
  → Nhưng MENTION cấp độ 2 và 3 = điểm cộng!
```

---

## §3.1 Contact Form — HTML Only!

```html
<!-- ═══ Contact Form — KHÔNG CẦN JavaScript! ═══ -->
<form
  action="https://questions.greatfrontend.com/api/questions/contact-form"
  method="POST"
>
  <div>
    <label for="name-input">Name</label>
    <input
      type="text"
      id="name-input"
      name="name"
      required
    />
  </div>

  <div>
    <label for="email-input">Email</label>
    <input
      type="email"
      id="email-input"
      name="email"
      required
    />
  </div>

  <div>
    <label for="message-input">Message</label>
    <textarea
      id="message-input"
      name="message"
      required
      rows="5"
    ></textarea>
  </div>

  <button type="submit">Send</button>
</form>
```

**Vậy là XONG!** Không cần JavaScript. Browser tự handle submit!

### Giải thích HTML — Line by line

**`<form>` — Container chịu trách nhiệm TOÀN BỘ:**

```
FORM ELEMENT — VAI TRÒ:
═══════════════════════════════════════════════════════════════

  <form action="..." method="POST">
  → action: ĐỊA CHỈ gửi data đến!
  → method: CÁCH gửi (GET/POST)!

  <form> KHÔNG CHỈ là container thông thường!
  → Nó là AGENT: thu thập, mã hoá, gửi data!
  → Giống như postman nhưng CÓ SẴN trong browser!

  Nếu THIẾU action:
  <form method="POST">  ← không có action!
  → Browser gửi đến CURRENT URL!
  → Page reload tại chỗ!

  Nếu THIẾU method:
  <form action="/api">  ← không có method!
  → MẶC ĐỊNH là GET!
  → Data hiện trong URL → 💀 cho sensitive data!
```

**`<label for>` + `<input id>` — Liên kết vô hình:**

```
FOR-ID LINKING — CƠ CHẾ:
═══════════════════════════════════════════════════════════════

  <label for="name-input">Name</label>
  <input id="name-input" name="name" />
         ↑ for matches id! ↑

  Browser TẠO liên kết NGẦM:
  → Click "Name" text → input ĐƯỢC FOCUS!
  → Screen reader: "Name, text input, required"

  3 CÁCH liên kết (interview question!):

  1. for + id (explicit — code hiện tại!):
     <label for="x">Name</label>
     <input id="x" />
     → Rõ ràng! Input ở BẤT CỨ ĐÂU trên page!

  2. Wrapper (implicit):
     <label>Name <input /></label>
     → Input NẰM TRONG label!
     → Không cần for/id! Ngắn hơn!
     → Nhưng style KHÓ hơn (label chứa input!)

  3. aria-labelledby:
     <span id="name-label">Name</span>
     <input aria-labelledby="name-label" />
     → Linh hoạt nhất! Nhưng phức tạp!

  Best practice: CÁCH 1 (explicit for+id)!
  → Rõ ràng, dễ đọc, dễ style! ✅
```

**`name` attribute — Tại sao input KHÔNG GỬI nếu thiếu name:**

```
NAME — BROWSER SERIALIZATION:
═══════════════════════════════════════════════════════════════

  Browser serialize form dựa trên NAME attribute:

  <input name="user" value="John" />  → user=John
  <input name="age" value="25" />     → age=25
  <input value="ignored" />           → KHÔNG GỬI! Thiếu name!

  Kết quả POST body: user=John&age=25

  name phải UNIQUE trong form (thường):
  → 2 inputs cùng name="email":
    email=john@a.com&email=jane@b.com
    → Server nhận ARRAY! Có thể gây bug!

  EXCEPTION — checkbox/radio CHIA SẺ name:
  <input type="radio" name="gender" value="male" />
  <input type="radio" name="gender" value="female" />
  → gender=male HOẶC gender=female (1 trong 2!)
  → Đây là cách radio GROUP hoạt động!
```

**`required` + `type="email"` — Validation stack:**

```
VALIDATION STACK — 3 TẦNG:
═══════════════════════════════════════════════════════════════

  TẦNG 1: required
  → Field trống → CHẶN submit!
  → Tooltip: "Please fill out this field"

  TẦNG 2: type="email"
  → Kiểm tra format: phải có @, domain!
  → "abc" → ❌ "Please include '@'"
  → "a@b.c" → ✅ Hợp lệ!

  TẦNG 3: pattern (nếu thêm!)
  <input pattern="[a-zA-Z ]+" />
  → Regex validation! Chỉ chữ cái + space!
  → "John123" → ❌ "Please match format"

  TẦNG 4: minlength / maxlength
  <textarea minlength="10" maxlength="500" />
  → Ít hơn 10: ❌ chặn submit!
  → Nhiều hơn 500: không gõ thêm được!

  TẤT CẢ validation trên = 0 dòng JavaScript!
  Browser làm HẾT! Chỉ cần HTML attributes! 🎯
```

---

## §3.2 Giải thích Contact Form — Từng phần

### `action` + `method` — Form submission!

```
FORM SUBMISSION — BROWSER TỰ LÀM:
═══════════════════════════════════════════════════════════════

  <form action="https://api.example.com/submit" method="POST">
  → action: URL mà browser GỬI data đến!
  → method: HTTP method (GET hoặc POST)!

  Khi user click "Send":
  1. Browser THU THẬP tất cả input có attribute "name"!
  2. Browser TẠO request body: name=John&email=john@...
  3. Browser GỬI POST request đến action URL!
  4. Browser REDIRECT đến response page!

  KHÔNG CẦN JavaScript:
  → fetch()? KHÔNG CẦN!
  → addEventListener? KHÔNG CẦN!
  → Browser đã handle TẤT CẢ!
```

### `name` attribute — QUAN TRỌNG NHẤT!

```
NAME ATTRIBUTE:
═══════════════════════════════════════════════════════════════

  <input name="email" value="john@example.com" />
  → Browser gửi: email=john@example.com

  KHÔNG CÓ name:
  <input value="john@example.com" />
  → Browser KHÔNG GỬI! Data bị MẤT! 💀

  name phải MATCH với server expectations:
  Server yêu cầu: name, email, message
  → <input name="name" />      ✅ KHỚP!
  → <input name="email" />     ✅ KHỚP!
  → <textarea name="message" /> ✅ KHỚP!
  → <input name="fullName" />  ❌ Server không hiểu!
```

### `<label>` + `for` — Accessibility!

```
LABEL + FOR:
═══════════════════════════════════════════════════════════════

  <label for="email-input">Email</label>
  <input id="email-input" name="email" />

  for="email-input" → id="email-input"
  → LIÊN KẾT label với input!

  Tại sao quan trọng?
  1. Click label → focus vào input! (click target LỚN hơn!)
  2. Screen reader: "Email, text input" (biết label!)
  3. Touch: dễ tap trên mobile! (vùng chạm lớn hơn!)

  KHÔNG CÓ label hoặc for:
  → Screen reader: "text input" — không biết nhập gì!
  → Click text → không có gì xảy ra!
```

### `type="email"` — Browser validation!

```
INPUT TYPES — VALIDATION MIỄN PHÍ:
═══════════════════════════════════════════════════════════════

  type="text"  → nhận mọi thứ, không validate!
  type="email" → browser TỰ validate format email!
    → "abc" → ❌ "Please include an '@'"
    → "a@b" → ❌ "Please enter a valid email"
    → "a@b.com" → ✅ Hợp lệ!
  type="url"   → validate URL format!
  type="tel"   → mobile: hiện bàn phím SỐ!
  type="number" → chỉ nhận số!

  → KHÔNG CẦN regex validation thủ công!
  → Browser lo TẤT CẢ!
```

### `required` — Chặn submit rỗng!

```
REQUIRED:
═══════════════════════════════════════════════════════════════

  <input required />
  → User nhấn Submit mà field TRỐNG:
  → Browser CHẶN submit!
  → Hiện tooltip: "Please fill out this field"!
  → KHÔNG CẦN if (!value) validation!

  Kết hợp:
  <input type="email" required />
  → PHẢI có email!
  → Email PHẢI đúng format!
  → 2 tầng validation, 0 dòng JavaScript! 🎯
```

### `<textarea>` vs `<input>` — Message dài!

```
TEXTAREA vs INPUT:
═══════════════════════════════════════════════════════════════

  <input type="text" />
  → 1 dòng! Không xuống dòng được!
  → Phù hợp: name, email, short text!

  <textarea rows="5"></textarea>
  → NHIỀU dòng! Có thể resize!
  → rows="5": hiện 5 dòng mặc định!
  → Phù hợp: message, comment, description!

  Chú ý: textarea KHÔNG CÓ value attribute!
  <textarea>Default text here</textarea>  ← content NẰM GIỮA tags!
  (khác input: <input value="default" />)
```

### `type="submit"` — Button submit!

```
BUTTON TYPES:
═══════════════════════════════════════════════════════════════

  <button type="submit">Send</button>
  → Click → SUBMIT form! (default behavior trong <form>!)

  <button type="button">Cancel</button>
  → Click → KHÔNG làm gì! Phải tự handle!

  <button>Send</button>  (không có type)
  → Trong <form>: MẶC ĐỊNH là type="submit"!
  → NGOÀI <form>: mặc định là type="submit" (nhưng không có form!)

  Sai lầm phổ biến:
  <button type="button">Send</button>
  → Button type button → KHÔNG submit form! 💀
```

### Form encoding — `application/x-www-form-urlencoded`

```
FORM ENCODING:
═══════════════════════════════════════════════════════════════

  Khi submit form, browser mã hoá data thành format nào?

  1. application/x-www-form-urlencoded (MẶC ĐỊNH!):
     → name=John+Doe&email=john%40example.com&message=Hello!
     → Spaces → "+", @ → "%40"!
     → Phù hợp: text data đơn giản!

  2. multipart/form-data:
     <form enctype="multipart/form-data">
     → Dùng khi CÓ file upload! (<input type="file">)
     → Chia data thành parts riêng biệt!
     → Nặng hơn x-www-form-urlencoded!

  3. text/plain:
     → Hiếm dùng, không encode!
     → name=John Doe (giữ nguyên spaces!)

  Contact form KHÔNG có file → mặc định là đủ! ✅
```

### `method="GET"` vs `method="POST"` — Khác biệt

```
GET vs POST:
═══════════════════════════════════════════════════════════════

  GET:
  → Data nằm trong URL: /api?name=John&email=john@...
  → Hiện trong ADDRESS BAR! 💀 Mật khẩu lộ!
  → Bị giới hạn LENGTH (URL max ~2000 chars!)
  → Browser CACHE được!
  → Dùng cho: search, filter, bookmark-able!

  POST:
  → Data nằm trong REQUEST BODY!
  → KHÔNG hiện trong URL!
  → KHÔNG giới hạn length!
  → Browser KHÔNG cache!
  → Dùng cho: submit form, gửi data nhạy cảm!

  Contact form → POST!
  → Email, message = data nhạy cảm!
  → Có thể dài (message field!) → POST an toàn!
```

### Accessibility — Form patterns

```
FORM ACCESSIBILITY:
═══════════════════════════════════════════════════════════════

  1. <label for="id"> + <input id="id">:
     → Screen reader: "Name, text input" ✅
     → Click label → focus input ✅

  2. fieldset + legend (cho group!):
     <fieldset>
       <legend>Personal Info</legend>
       <input name="name" />
       <input name="email" />
     </fieldset>
     → Screen reader nhóm các field liên quan!

  3. aria-required vs required:
     → required: browser validate + screen reader!
     → aria-required: CHỈ screen reader (no validation!)
     → Dùng required → được cả 2! ✅

  4. Error messages:
     <input aria-describedby="email-error" />
     <span id="email-error">Email không hợp lệ</span>
     → Screen reader đọc error khi focus input!
```

### FormData API — Đọc form data bằng JavaScript

```
FORMDATA API — KHI CẦN JS:
═══════════════════════════════════════════════════════════════

  Nếu muốn đọc form data trong JS (enhancement!):

  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    // FormData TỰ ĐỘNG thu thập tất cả inputs!

    // Đọc từng field:
    const name = formData.get('name');     // "John"
    const email = formData.get('email');   // "john@a.com"
    const message = formData.get('message'); // "Hello!"

    // Convert sang object:
    const data = Object.fromEntries(formData);
    // { name: "John", email: "john@a.com", message: "Hello!" }

    // Gửi bằng fetch:
    fetch('/api/contact', {
      method: 'POST',
      body: formData,  // hoặc JSON.stringify(data)!
    });
  });

  FormData vs Manual query:
  → Manual: document.querySelector('#name').value
  → FormData: new FormData(form).get('name')
  → FormData TỐT HƠN: tự động, đầy đủ, kể cả files!
```

### `novalidate` — Tắt browser validation

```
NOVALIDATE — KHI NÀO CẦN:
═══════════════════════════════════════════════════════════════

  <form novalidate>
  → BROWSER KHÔNG validate!
  → required, type=email → BỊ IGNORE!
  → Submit luôn, bất kể data!

  Tại sao dùng?
  → Custom validation UI! (đẹp hơn browser tooltip!)
  → Real-time validation (blur/change events!)
  → Multi-step forms (validate từng bước!)

  Pattern: novalidate + custom JS:
  <form novalidate>
    <input type="email" required />
    <span class="error"></span>
  </form>

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('[type=email]');
    if (!email.validity.valid) {
      // Hiện custom error UI!
      showError(email, 'Email không hợp lệ!');
    }
  });

  input.validity object:
  → valueMissing: true (required trống!)
  → typeMismatch: true (email sai format!)
  → tooShort: true (minlength!)
  → patternMismatch: true (pattern regex!)
  → valid: false (BẤT KỲ lỗi nào!)
```

### Constraint Validation CSS — `:valid` / `:invalid`

```
CSS VALIDATION STATES:
═══════════════════════════════════════════════════════════════

  input:valid {
    border-color: green;
  }
  input:invalid {
    border-color: red;
  }

  VẤN ĐỀ: :invalid apply MỚI load page!
  → Input trống + required → NGAY LẬP TỨC border đỏ!
  → User chưa gõ gì → đã thấy lỗi → BAD UX! 😬

  GIẢI PHÁP: :user-invalid (CSS mới!):
  input:user-invalid {
    border-color: red;
  }
  → Chỉ apply SAU KHI user tương tác!
  → Gõ xong, blur → MỚI hiện lỗi!

  FALLBACK (cũ hơn): class-based:
  input.touched:invalid { border-color: red; }
  → JS thêm class "touched" khi blur/submit!
  → Chỉ style SAU interaction!
```

### JS-Enhanced Submit — AJAX Pattern

```javascript
// ═══ Progressive Enhancement — AJAX Submit ═══

// HTML form VẪN HOẠT ĐỘNG nếu JS disabled!
// JS CHỈ NÂNG CẤP trải nghiệm!

const form = document.querySelector('form');
const submitBtn = form.querySelector('[type=submit]');

form.addEventListener('submit', async (e) => {
  e.preventDefault();  // Chặn browser reload!

  // Disable button + show loading
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const formData = new FormData(form);
    const res = await fetch(form.action, {
      method: form.method,  // Đọc từ HTML!
      body: formData,
    });

    if (!res.ok) throw new Error('Server error');

    // Success!
    form.reset();  // Clear tất cả fields!
    showMessage('Thank you! Message sent.', 'success');
  } catch (err) {
    showMessage('Failed to send. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send';
  }
});
```

```
PROGRESSIVE ENHANCEMENT — GIẢI THÍCH:
═══════════════════════════════════════════════════════════════

  Strategy: HTML HOẠT ĐỘNG TRƯỚC, JS NÂNG CẤP SAU!

  Không có JS:
  → Form submit bình thường → page reload → server response!
  → User VẪN GỬI ĐƯỢC message! ✅

  Có JS:
  → preventDefault chặn reload!
  → fetch gửi background!
  → Inline success/error message!
  → KHÔNG reload page = better UX! ✅

  form.action + form.method:
  → Đọc từ HTML attributes!
  → KHÔNG hardcode URL trong JS!
  → Thay đổi URL → chỉ sửa HTML! Single source of truth!

  form.reset():
  → Clear TẤT CẢ inputs về default!
  → Không cần clear từng field thủ công!

  Đây gọi là "Progressive Enhancement":
  → Base: HTML works without JS!
  → Enhanced: JS adds better UX!
  → Phỏng vấn: mention pattern này = STRONG signal! ✅
```

---

# 🎤 RADIO Interview Walkthrough — Contact Form

### R — Requirements

Khi nghe "Build a Contact Form", đây là bài test **HTML fundamentals**. Interviewer muốn thấy bạn biết browser **native form submission** mà KHÔNG cần JavaScript.

```
REQUIREMENTS — CÂU HỎI CẦN HỎI:
═══════════════════════════════════════════════════════════════

  1. "Form fields nào cần có?"
     → Name, Email, Message (yêu cầu bài!)
     → Hỏi: "Có cần phone, subject, file upload?"
     ⭐ Clarify scope!

  2. "CẦN JavaScript không?"
     → KHÔNG! HTML-only!
     → Đây là KEY INSIGHT!
     → Nhiều candidate nhảy vào React ngay → SAI!
     ⭐ HỎI trước khi code!

  3. "API endpoint cho sẵn chưa?"
     → action URL cho sẵn!
     → Cần biết request format (form-urlencoded!)

  4. "Client-side validation level?"
     → HTML attributes: required, type=email!
     → Custom JS? Regex? Real-time?
     → Scope: HTML attributes ĐỦ!

  5. "Submit xong UX?"
     → HTML: page reload (server response page!)
     → JS: inline message (no reload!)
     → Scope: HTML form = reload OK!

  6. "Accessibility requirements?"
     → Label-input pairing!
     → Keyboard navigation (Tab!)!
     → Screen reader support!
```

```
SCOPE — CONTACT FORM:
═══════════════════════════════════════════════════════════════

  30 phút (nhưng bài này chỉ cần ~10 phút!):
  ┌──────────────────────────────────────────┐
  │ MUST HAVE (5 phút):                      │
  │ ✅ <form> với action + method             │
  │ ✅ 3 fields: name, email, message         │
  │ ✅ name attribute cho MỌI field           │
  │ ✅ <button type="submit">                 │
  │ ✅ required validation                    │
  ├──────────────────────────────────────────┤
  │ SHOULD HAVE (3 phút):                    │
  │ 🟡 type="email" validation               │
  │ 🟡 <label for> accessibility             │
  │ 🟡 Proper id attributes                  │
  ├──────────────────────────────────────────┤
  │ NICE TO HAVE (2 phút):                   │
  │ 🔵 autocomplete hints                    │
  │ 🔵 placeholder text                      │
  │ 🔵 fieldset + legend                     │
  │ 🔵 Mention progressive enhancement       │
  └──────────────────────────────────────────┘

  → Bài ngắn! Dùng thời gian dư để EXPLAIN sâu!
  → Interviewer đánh giá KIẾN THỨC, không chỉ code!
```

### A — Architecture

```
ARCHITECTURE — HTML FORM vs SPA:
═══════════════════════════════════════════════════════════════

  HTML FORM (bài này!):
  ┌─────────────┐     ┌──────────────┐     ┌──────────┐
  │  <form>     │────→│  Browser     │────→│  Server  │
  │  name,email │     │  collect     │     │  /api/   │
  │  message    │     │  encode      │     │  process │
  │  [Submit]   │     │  POST        │     │  respond │
  └─────────────┘     └──────────────┘     └──┬───────┘
                                              │
                      ┌──────────────┐        │
                      │  New Page    │◀───────┘
                      │  (redirect!) │ Server HTML response!
                      └──────────────┘

  SPA APPROACH (mention!):
  ┌─────────────┐     ┌──────────────┐     ┌──────────┐
  │  <form>     │────→│  JavaScript  │────→│  Server  │
  │  name,email │     │  preventDefault│    │  /api/   │
  │  message    │     │  FormData     │     │  JSON    │
  │  [Submit]   │     │  fetch()      │     │  respond │
  └─────────────┘     └──────┬───────┘     └──┬───────┘
                             │                │
                      ┌──────▼───────┐        │
                      │  SAME Page   │◀───────┘
                      │  Show toast! │ No reload!
                      └──────────────┘

  HTML: browser = middleware (tự động!)
  SPA: JavaScript = middleware (custom!)
```

### D — Design

```
DESIGN DECISIONS — GIẢI THÍCH TẠI SAO:
═══════════════════════════════════════════════════════════════

  1. HTML-only vs JavaScript-enhanced?
     ┌──────────────────┬────────────────────┐
     │ HTML Only        │ JS Enhanced        │
     ├──────────────────┼────────────────────┤
     │ 0 dòng JS!       │ addEventListener   │
     │ Works without JS │ Better UX          │
     │ Page reload      │ No reload          │
     │ Browser tooltip  │ Custom error UI    │
     │ Simple!          │ More control!      │
     └──────────────────┴────────────────────┘
     → Yêu cầu: HTML-only! Mention JS = bonus!

  2. Validation strategy:
     → HTML: required + type=email (0 JS!)
     → Pattern: regex cho format cụ thể!
     → Custom: JS cho complex rules!
     → Chọn: HTML attributes (đủ!)!

  3. Label strategy: for+id vs wrapper?
     → for+id: flexible, standard! ✅
     → Wrapper: compact, less code!
     → Chọn: for+id (clear, maintainable!)

  4. <textarea> rows:
     → rows="5" = vừa đủ cho message!
     → Thêm CSS resize: vertical cho user control!

  5. Encoding type:
     → Default (urlencoded): text data! ✅
     → multipart: nếu có file upload!
     → Chọn: default (không có file!)

  6. POST vs GET:
     → POST: data trong body, an toàn, không size limit!
     → GET: data trong URL, lộ, có size limit!
     → Contact form = POST! Data nhạy cảm!
```

### I — Implementation (Triển khai)

```
IMPLEMENTATION WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (1 phút): <form> skeleton!
  → "Tôi bắt đầu với form tag, action URL, method POST."
  → <form action="..." method="POST">

  BƯỚC 2 (2 phút): 3 field groups!
  → "Mỗi field: label + input trong div wrapper."
  → Name: type="text", required!
  → Email: type="email", required!
  → Message: <textarea>, required, rows="5"!
  → NÓI TO: "type=email cho browser validation miễn phí!"

  BƯỚC 3 (1 phút): Submit button!
  → <button type="submit">Send</button>
  → NÓI: "type=submit trong form = trigger submit!"

  BƯỚC 4 (1 phút): Accessibility check!
  → Verify: label for → input id matching!
  → Verify: required trên mỗi field!
  → Verify: name attribute cho mỗi input!

  BƯỚC 5 (5 phút): GIẢI THÍCH KIẾN THỨC!
  → "Bài này KHÔNG CẦN JavaScript vì..."
  → Giải thích form submission flow!
  → Giải thích encoding types!
  → Mention progressive enhancement!
  → Mention accessibility patterns!

  → Bài code NGẮN nhưng kiến thức SÂU!
  → Interviewer đánh giá GIẢI THÍCH, không chỉ code!
```

### Edge Cases — Đề phòng!

```
EDGE CASES — CONTACT FORM:
═══════════════════════════════════════════════════════════════

  1. EMPTY SUBMIT:
     → required attribute CHẶN!
     → Browser tooltip: "Please fill out this field"
     → 0 dòng JS needed!

  2. INVALID EMAIL:
     → "abc" → type=email CHẶN!
     → "a@" → CHẶN!
     → "a@b.c" → PASS (browser cho phù hợp!)
     → Nhưng server PHẢI validate lại (stricter!)

  3. XSS IN FORM:
     → User nhập: <script>alert(1)</script>
     → Form encode: %3Cscript%3E...
     → URL-encoded → server nhận text thuần!
     → NHƯNG: server phải sanitize trước khi lưu/hiện!

  4. DOUBLE SUBMIT:
     → User click Send 2 lần nhanh!
     → HTML form: 2 requests gửi đi!
     → Fix: disable button (cần JS!)!
     → Hoặc: server deduplicate!

  5. LONG MESSAGE:
     → <textarea> không có maxlength mặc định!
     → Thêm maxlength="2000" nếu cần!
     → Server cần validate length!

  6. NETWORK ERROR:
     → Browser hiện lỗi kết nối!
     → User không thấy form nữa (page đã navigate!)!
     → SPA approach tốt hơn cho error recovery!

  7. CSRF ATTACK:
     → Trang khác tạo form giả, submit đến API!
     → Fix: CSRF token trong hidden input!
     <input type="hidden" name="_csrf" value="token..." />
     → Server verify token mỗi request!
```

### O — Optimization

```
OPTIMIZATION — PHÂN TẦNG:
═══════════════════════════════════════════════════════════════

  L1 — CƠ BẢN (code trong bài!):
  ──────────────────────────────
  1. type="email" → free validation!
  2. required → free empty check!
  3. <label for> → accessibility + UX!

  L2 — TRUNG BÌNH (mention!):
  ──────────────────────────────
  4. autocomplete hints:
     <input autocomplete="name" name="name" />
     <input autocomplete="email" name="email" />
     → Browser TỰ ĐIỀN! Faster submit!

  5. inputmode cho mobile:
     <input type="email" inputmode="email" />
     → Bàn phím có @ key trên mobile!
     <input type="tel" inputmode="tel" />
     → Bàn phím số trên mobile!

  6. Progressive enhancement:
     → HTML works → JS adds AJAX submit!
     → No-JS users vẫn dùng được!

  L3 — NÂNG CAO (chỉ mention!):
  ──────────────────────────────
  7. CSRF protection:
     → Hidden input với server-generated token!
     → Chống form submission từ trang khác!

  8. Honeypot spam protection:
     <input name="website" style="display:none" />
     → Bots fill ALL fields → "website" có value!
     → Real users: không thấy field → để trống!
     → Server: nếu website có value → SPAM! Reject!
     → Không cần CAPTCHA! Invisible! ✅

  9. Rate limiting (server-side):
     → Max 5 submissions per IP per hour!
     → Chống spam flooding!
```

```
INTERVIEW TIPS — CONTACT FORM:
═══════════════════════════════════════════════════════════════

  ⏱ TIMELINE (30 phút — bài này rất nhanh!):
  ├── 0-2 phút:   Hỏi requirements!
  ├── 2-4 phút:   Code HTML form! (XONG!)
  ├── 4-15 phút:  GIẢI THÍCH sâu!
  │   ├── Form submission flow!
  │   ├── Encoding types!
  │   ├── GET vs POST!
  │   ├── Accessibility!
  │   └── Validation stack!
  ├── 15-20 phút: Discuss progressive enhancement!
  ├── 20-25 phút: Edge cases + security!
  └── 25-30 phút: Optimization + bonus features!

  💡 KEY TALKING POINTS:
  → "KHÔNG CẦN JavaScript — form native!"
  → "name attribute là QUAN TRỌNG NHẤT!"
  → "required + type=email = free validation!"
  → "for-id linking cho accessibility!"
  → "POST cho data nhạy cảm, GET cho bookmark!"

  🎯 ĐIỂM CỘNG:
  → Biết form encoding types!
  → Biết textarea value vs input value!
  → Mention progressive enhancement!
  → Mention CSRF protection!
  → Mention honeypot anti-spam!
  → Biết :valid/:invalid CSS pseudo-classes!
  → Mention FormData API!

  ⚠ SAI LẦM PHỔ BIẾN:
  → Dùng React/JS cho bài HTML-only!
  → Quên name attribute → data KHÔNG GỬI!
  → Quên label → accessibility violation!
  → type="button" thay vì type="submit"!
  → Quên method="POST" → default GET → lộ data!
  → Viết regex validation → KHÓ thay vì dùng type=email!
```

### ♿ Accessibility — Contact Form Deep Dive

```
ACCESSIBILITY — FORM PATTERNS:
═══════════════════════════════════════════════════════════════

  1. LABEL + INPUT PAIRING (WCAG 1.3.1):
  <label for="email-input">Email</label>
  <input id="email-input" type="email" />
  → Screen reader: "Email, edit text, required"
  → Click label → focus input!
  → PHẢI CÓ cho mọi input!

  2. FIELDSET + LEGEND (nhóm fields!):
  <fieldset>
    <legend>Contact Information</legend>
    <label for="name">Name</label>
    <input id="name" />
    <label for="email">Email</label>
    <input id="email" />
  </fieldset>
  → Screen reader: "Contact Information, group"
  → User biết các fields LIÊN QUAN!

  3. ERROR MESSAGES (WCAG 3.3.1):
  <input
    id="email-input"
    type="email"
    required
    aria-describedby="email-error"
    aria-invalid="true"
  />
  <span id="email-error" role="alert">
    Please enter a valid email address
  </span>
  → aria-describedby: screen reader đọc error!
  → aria-invalid: input đánh dấu LỖI!
  → role="alert": announce ngay khi xuất hiện!

  4. FOCUS MANAGEMENT:
  → Tab order: Name → Email → Message → Send!
  → Focus ring visible (outline!)!
  → KHÔNG remove outline → accessibility violation!
  → Custom: outline: 2px solid blue;

  5. KEYBOARD SUPPORT:
  → Tab: navigate giữa fields!
  → Enter (trong input): submit form!
  → Enter (trong textarea): new line (KHÔNG submit!)!
  → Escape: cancel/clear?
```

### 🧪 Testing Strategy — Contact Form

```
TESTING — CONTACT FORM:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────┬────────────────────────────┐
  │ Test Case                │ Expected                   │
  ├──────────────────────────┼────────────────────────────┤
  │ Fill all + submit        │ POST request sent!         │
  │ Empty name + submit      │ Browser tooltip "Required" │
  │ Empty email + submit     │ Browser tooltip "Required" │
  │ Invalid email + submit   │ Email format error!        │
  │ Empty message + submit   │ Browser tooltip "Required" │
  │ Click label "Name"       │ Input gets focused!        │
  │ Tab key navigation       │ Focus moves correctly!     │
  │ Enter in input field     │ Form submits!              │
  │ Enter in textarea        │ New line (no submit!)      │
  │ Screen reader test       │ Fields announced properly! │
  └──────────────────────────┴────────────────────────────┘

  MANUAL TESTING:
  1. Mở DevTools → Network tab!
  2. Fill form → click Send!
  3. Verify: POST request gửi đi!
  4. Verify: body chứa name=...&email=...&message=...!
  5. Verify: Content-Type: application/x-www-form-urlencoded!

  CYPRESS E2E (bonus!):
  cy.get('#name-input').type('John Doe');
  cy.get('#email-input').type('john@example.com');
  cy.get('#message-input').type('Hello!');
  cy.get('button[type=submit]').click();
  cy.url().should('include', '/success');
```

---

# 🏛️ Component 4: Holy Grail Layout

## Kiến Trúc Holy Grail

```
HOLY GRAIL LAYOUT:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────┐
  │                HEADER (60px)            │
  ├────────┬───────────────────┬────────────┤
  │        │                   │            │
  │  NAV   │     CONTENT       │  SIDEBAR   │
  │ 100px  │    (fluid!)       │   100px    │
  │  fixed │                   │   fixed    │
  │        │                   │            │
  │        │                   │            │
  ├────────┴───────────────────┴────────────┤
  │               FOOTER (100px)            │
  └─────────────────────────────────────────┘

  Requirements:
  • Header: full width, 60px tall!
  • Footer: full width, 100px tall, LUÔN Ở ĐÁY!
  • Nav (trái): 100px fixed width!
  • Sidebar (phải): 100px fixed width!
  • Content (giữa): FLUID width (co giãn!)
  • 3 columns CÙNG HEIGHT!
  • Footer ở đáy page dù content ít!
```

### 📋 Phân tích yêu cầu — Holy Grail Layout

Đây là bài **CSS-only** — test kiến thức **Flexbox/Grid layout**. Interviewer muốn thấy bạn hiểu **flex container nesting**, **sticky footer**, và **fluid vs fixed columns**.

```
CÂU HỎI CẦN HỎI INTERVIEWER:
═══════════════════════════════════════════════════════════════

  1. "Kích thước cụ thể header, footer, sidebar?"
     → Header 60px, Footer 100px, Nav/Sidebar 100px!
     → Content: FLUID (co giãn!)
     ⭐ HỎI con số cụ thể trước khi code!

  2. "Footer luôn ở đáy khi content ít?"
     → CÓ! Sticky footer pattern!
     → KEY requirement mà nhiều người bỏ qua!

  3. "Columns cùng height?"
     → CÓ! Equal height columns!
     → Flexbox default = stretch → free!

  4. "Responsive mobile layout?"
     → Phỏng vấn: hỏi scope!
     → Desktop-only: đơn giản hơn!
     → Responsive: thêm breakpoints!

  5. "Dùng Flexbox hay Grid?"
     → Cả hai đều đúng!
     → Flexbox: phổ biến hơn cho phỏng vấn!
     → Grid: ngắn gọn hơn!
     → Biết CẢ HAI = điểm cộng lớn!

  6. "Có scroll behavior đặc biệt?"
     → Fixed header khi scroll?
     → Sidebar scroll độc lập?
     → Scope: basic layout trước!
```

---

## §4.1 Holy Grail — CSS

```html
<!-- ═══ HTML Structure ═══ -->
<div class="holy-grail">
  <header class="holy-header">Header</header>
  <div class="holy-body">
    <nav class="holy-nav">Navigation</nav>
    <main class="holy-content">Content</main>
    <aside class="holy-sidebar">Sidebar</aside>
  </div>
  <footer class="holy-footer">Footer</footer>
</div>
```

```css
/* ═══ Holy Grail — Flexbox ═══ */

/* Full viewport height! */
.holy-grail {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header: 60px, co cụm! */
.holy-header {
  height: 60px;
  background: #2d3748;
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 20px;
  flex-shrink: 0; /* KHÔNG co lại! */
}

/* Body: 3 columns, chiếm HẾT không gian còn lại! */
.holy-body {
  display: flex;
  flex: 1; /* flex-grow: 1 → chiếm hết space! */
}

/* Nav trái: 100px fixed! */
.holy-nav {
  width: 100px;
  flex-shrink: 0; /* KHÔNG co lại! */
  background: #edf2f7;
  padding: 20px;
}

/* Content giữa: fluid! */
.holy-content {
  flex: 1; /* flex-grow: 1 → chiếm HẾT space còn lại! */
  padding: 20px;
}

/* Sidebar phải: 100px fixed! */
.holy-sidebar {
  width: 100px;
  flex-shrink: 0; /* KHÔNG co lại! */
  background: #edf2f7;
  padding: 20px;
}

/* Footer: 100px, co cụm! */
.holy-footer {
  height: 100px;
  background: #2d3748;
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 20px;
  flex-shrink: 0; /* KHÔNG co lại! */
}
```

### Giải thích CSS — Line by line

**Nested Flex strategy — 2 tầng container:**

```
NESTED FLEX — TẠI SAO 2 TẦNG:
═══════════════════════════════════════════════════════════════

  TẦNG 1: .holy-grail (flex-direction: column!)
  → Chia THEO DỌC: header ↕ body ↕ footer!
  → min-height: 100vh → ít nhất FULL viewport!

  TẦNG 2: .holy-body (flex-direction: row — default!)
  → Chia THEO NGANG: nav ↔ content ↔ sidebar!
  → flex: 1 → chiếm HẾT space giữa header/footer!

  Tại sao KHÔNG 1 tầng?
  → display: flex CHỈ ảnh hưởng CHILDREN trực tiếp!
  → .holy-grail flex column → header, body, footer!
  → Nếu nav, content, sidebar cũng là children trực tiếp:
    → KHÔNG thể vừa column (header/footer) vừa row (3 cột)!
  → PHẢI có container trung gian (.holy-body)!

  CSS Grid GIẢI QUYẾT bằng 1 tầng:
  → grid-template cho CẢ rows VÀ columns!
  → Nhưng Flexbox = phổ biến hơn cho interview!
```

**`flex: 1` shorthand — Thực sự là gì:**

```
FLEX SHORTHAND — 3 GIÁ TRỊ:
═══════════════════════════════════════════════════════════════

  flex: 1 = flex: 1 1 0
  → flex-grow: 1    ← CHIẾM thêm space!
  → flex-shrink: 1  ← CO LẠI được!
  → flex-basis: 0   ← Kích thước ban đầu = 0!

  Tại sao flex-basis: 0 QUAN TRỌNG?
  → flex-basis: 0 → BỎ QUA width/height!
  → Tất cả space phân chia HOÀN TOÀN theo grow!

  So sánh: flex: 1 vs flex-grow: 1:
  → flex-grow: 1 (không set basis) → basis = auto!
  → flex-basis: auto → dùng width/height nếu có!
  → Có thể gây KẾT QUẢ KHÁC khi item có content!

  flex: 1 trên .holy-body:
  → Vertical space = 100vh - 60px (header) - 100px (footer)
  → Body chiếm TẤT CẢ vertical space còn lại!

  flex: 1 trên .holy-content:
  → Horizontal space = viewport - 100px (nav) - 100px (sidebar)
  → Content chiếm TẤT CẢ horizontal space còn lại!
```

**`flex-shrink: 0` + `width` — Tại sao CẦN cả hai:**

```
FLEX-SHRINK + WIDTH — COMBO:
═══════════════════════════════════════════════════════════════

  .holy-nav {
    width: 100px;         ← Kích thước MỤC TIÊU!
    flex-shrink: 0;       ← CHẶN co lại!
  }

  Chỉ width, KHÔNG flex-shrink:
  → Viewport nhỏ → total > viewport → Flex CO elements!
  → flex-shrink MẶC ĐỊNH = 1 → Nav co < 100px! 💀

  Chỉ flex-shrink: 0, KHÔNG width:
  → Nav không co, nhưng KO CÓ kích thước mục tiêu!
  → Shrink vào content bên trong!

  CẢ HAI → Nav LUÔN ĐÚNG 100px, KHÔNG BAO GIỜ co!

  Thay thế: flex: 0 0 100px (shorthand!)
  → grow: 0 (không mở rộng!)
  → shrink: 0 (không co lại!)
  → basis: 100px (kích thước cố định!)
  → Ngắn hơn nhưng KHÓ ĐỌC hơn width + flex-shrink!
```

**`padding` + `box-sizing` — Tương tác:**

```
PADDING + BOX-SIZING:
═══════════════════════════════════════════════════════════════

  .holy-nav {
    width: 100px;
    padding: 20px;
  }

  Không có box-sizing: border-box:
  → Thực tế width = 100px + 20px + 20px = 140px! 💀
  → Layout VỠ!

  Với * { box-sizing: border-box; }:
  → width 100px ĐÃ BAO GỒM padding!
  → Content space = 100 - 20 - 20 = 60px!
  → Layout ĐÚNG!

  ⚠ Code hiện tại THIẾU box-sizing reset!
  → Phải thêm ở global CSS:
  *, *::before, *::after {
    box-sizing: border-box;
  }
  → ALWAYS cần cho mọi project!
  → Mention trong phỏng vấn = hiểu CSS fundamentals!
```

---

## §4.2 Giải thích Holy Grail — Từng phần

### `min-height: 100vh` — Footer luôn ở đáy!

```
MIN-HEIGHT: 100VH — STICKY FOOTER:
═══════════════════════════════════════════════════════════════

  KHÔNG CÓ min-height:
  Content ít → footer ở GIỮA trang!
  ┌──────────────┐
  │ Header       │
  │ Nav│Cnt│Side │
  │ Footer       │  ← footer giữa trang! 😬
  │              │
  │   (trống!)   │
  └──────────────┘

  CÓ min-height: 100vh:
  ┌──────────────┐
  │ Header       │
  │              │
  │ Nav│Cnt│Side │  ← body flex:1 → kéo dãn!
  │              │
  │ Footer       │  ← footer LUÔN ở đáy! ✅
  └──────────────┘

  Content nhiều → page dài hơn 100vh → vẫn ok!
  min-height = TỐI THIỂU, không phải tối đa!
```

### `flex: 1` — Chiếm hết space!

```
FLEX: 1 — GIẢI THÍCH:
═══════════════════════════════════════════════════════════════

  flex: 1 = flex-grow: 1 + flex-shrink: 1 + flex-basis: 0

  Trên .holy-body:
  → Header 60px + Footer 100px = 160px cố định!
  → Body flex:1 → chiếm 100vh - 160px! ✅

  Trên .holy-content:
  → Nav 100px + Sidebar 100px = 200px cố định!
  → Content flex:1 → chiếm phần CÒN LẠI! ✅
  → Viewport 1200px → Content = 1200 - 200 = 1000px!
  → Viewport 800px → Content = 800 - 200 = 600px!
  → FLUID! Co giãn theo viewport! 🎯
```

### `flex-shrink: 0` — Không co lại!

```
FLEX-SHRINK: 0:
═══════════════════════════════════════════════════════════════

  KHÔNG CÓ flex-shrink: 0:
  → Viewport nhỏ → Nav co lại < 100px!
  → Text bị wrap, layout vỡ! 😬

  CÓ flex-shrink: 0:
  → Nav LUÔN 100px! Không bao giờ co!
  → Content co lại thay thế (flex: 1 có shrink!)
  → Layout giữ nguyên structure! ✅
```

### Cùng height — Flexbox tự lo!

```
EQUAL HEIGHT COLUMNS:
═══════════════════════════════════════════════════════════════

  Trước Flexbox (float layout):
  .nav { float: left; }
  .content { float: left; }
  .sidebar { float: left; }
  → Columns có height KHÁC NHAU!
  → Nav 200px, Content 500px, Sidebar 300px!
  → Phải dùng hack: faux columns, table-cell... 😩

  Flexbox:
  .holy-body { display: flex; }
  → Children stretch THEO CHIỀU CROSS AXIS!
  → Default: align-items: stretch!
  → Tất cả columns CÙNG HEIGHT = height của tallest! ✅
  → KHÔNG CẦN hack gì! Flexbox tự xử lý!
```

### Tại sao gọi là "Holy Grail"?

```
LỊCH SỬ "HOLY GRAIL":
═══════════════════════════════════════════════════════════════

  Thập niên 2000: layout 3 cột là BÀI TOÁN KHÓ!
  → float, table, absolute position... đều có vấn đề!
  → Equal height columns = "Holy Grail" — tưởng tượng
    nhưng không ai đạt được HOÀN HẢO!

  Vấn đề với float:
  → Columns height khác nhau!
  → Footer không clear float đúng!
  → Content markup phải ĐẶT TRƯỚC nav trong HTML!

  Vấn đề với table:
  → Semantic sai! Layout không phải tabular data!
  → Khó responsive!

  Flexbox (2012+):
  → GIẢI QUYẾT TẤT CẢ! 🎯
  → Equal height: mặc định!
  → Footer sticky: min-height + flex!
  → Markup order = visual order!
  → 20 dòng CSS! Done!

  CSS Grid (thay thế):
  .holy-grail {
    display: grid;
    grid-template-rows: 60px 1fr 100px;
    grid-template-columns: 100px 1fr 100px;
    min-height: 100vh;
  }
  .holy-header { grid-column: 1 / -1; }
  .holy-footer { grid-column: 1 / -1; }
  → CÒN ĐƠN GIẢN HƠN! Nhưng Flexbox phổ biến hơn!
```

### Flexbox vs Grid — So sánh chi tiết

```
FLEXBOX vs GRID CHO HOLY GRAIL:
═══════════════════════════════════════════════════════════════

  FLEXBOX (code hiện tại):
  → 2 flex containers (outer column + inner row!)
  → .holy-grail: flex column (header, body, footer!)
  → .holy-body: flex row (nav, content, sidebar!)
  → Tổng: ~30 dòng CSS!

  GRID:
  .holy-grail {
    display: grid;
    grid-template-rows: 60px 1fr 100px;
    grid-template-columns: 100px 1fr 100px;
    grid-template-areas:
      "header header  header"
      "nav    content sidebar"
      "footer footer  footer";
    min-height: 100vh;
  }
  .holy-header  { grid-area: header; }
  .holy-nav     { grid-area: nav; }
  .holy-content { grid-area: content; }
  .holy-sidebar { grid-area: sidebar; }
  .holy-footer  { grid-area: footer; }
  → Tổng: ~20 dòng! ĐƠN GIẢN HƠN!
  → grid-template-areas VISUAL — nhìn như layout thật!

  Khi nào dùng gì?
  → Flexbox: 1 chiều (row OR column)!
  → Grid: 2 chiều (row AND column cùng lúc)!
  → Holy Grail: 2 chiều → Grid tự nhiên hơn!
  → Phỏng vấn: biết CẢ HAI = điểm cộng! ✅
```

### Responsive Holy Grail — Mobile

```
RESPONSIVE:
═══════════════════════════════════════════════════════════════

  Desktop: 3 columns (nav | content | sidebar)
  Mobile: 1 column (stacked!)

  @media (max-width: 768px) {
    .holy-body {
      flex-direction: column;  /* row → column! */
    }
    .holy-nav,
    .holy-sidebar {
      width: 100%;       /* full width! */
      flex-shrink: 1;    /* cho phép co! */
    }
  }

  Mobile layout:
  ┌──────────────┐
  │ Header       │
  │ Navigation   │  ← full width!
  │ Content      │  ← full width!
  │ Sidebar      │  ← full width!
  │ Footer       │
  └──────────────┘

  Grid responsive (đơn giản hơn!):
  @media (max-width: 768px) {
    .holy-grail {
      grid-template-columns: 1fr;  /* 1 column! */
      grid-template-areas:
        "header"
        "nav"
        "content"
        "sidebar"
        "footer";
    }
  }
  → Thay đổi areas = thay đổi layout! Không cần sửa children!
```

### Semantic HTML — Tại sao dùng `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`?

```
SEMANTIC HTML:
═══════════════════════════════════════════════════════════════

  ❌ Tất cả <div>:
  <div class="header">...</div>
  <div class="nav">...</div>
  <div class="content">...</div>
  → Screen reader: "group, group, group" — vô nghĩa!

  ✅ Semantic tags:
  <header>    → Screen reader: "banner"!
  <nav>       → Screen reader: "navigation"!
  <main>      → Screen reader: "main content"!
  <aside>     → Screen reader: "complementary"!
  <footer>    → Screen reader: "contentinfo"!

  Lợi ích:
  1. Accessibility: screen reader hiểu cấu trúc!
  2. SEO: Google hiểu nội dung page!
  3. Readability: developer đọc HTML biết ngay cấu trúc!
  4. Styling: có thể dùng tag selector (nav {})!

  Chú ý:
  → <main> chỉ có 1 trên page!
  → <header>/<footer> có thể nhiều (trong <article>!)
  → <aside> = nội dung LIÊN QUAN nhưng phụ (sidebar, ads!)
```

---

# 🎤 RADIO Interview Walkthrough — Holy Grail Layout

### R — Requirements

Khi nghe "Build a Holy Grail Layout", đây là bài **CSS layout** — interviewer muốn thấy bạn hiểu **Flexbox/Grid**, **sticky footer**, và **fluid columns**.

```
REQUIREMENTS — CÂU HỎI CẦN HỎI:
═══════════════════════════════════════════════════════════════

  1. "Kích thước header, footer, sidebar cụ thể?"
     → Header 60px, Footer 100px, Nav/Sidebar 100px!
     → Content: fluid (co giãn theo viewport!)
     ⭐ Hỏi con số TRƯỚC khi code!

  2. "Footer luôn ở đáy khi content ít?"
     → CÓ! Sticky footer!
     → min-height: 100vh + flex: 1!

  3. "Columns cùng height?"
     → CÓ! Flexbox default stretch!

  4. "Responsive mobile layout?"
     → Hỏi scope! 30 phút: desktop-first!
     → Responsive: mention breakpoints!

  5. "Dùng Flexbox hay Grid?"
     → Cả hai đều đúng!
     → Biết CẢ HAI = điểm cộng lớn!

  6. "Có scroll behavior đặc biệt?"
     → Fixed header? Scrollable sidebar?
     → Scope: basic layout trước!
```

```
SCOPE — HOLY GRAIL:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────┐
  │ MUST HAVE (10 phút):                     │
  │ ✅ 5 vùng: header, nav, content, aside,  │
  │    footer với kích thước yêu cầu         │
  │ ✅ Content fluid (co giãn!)              │
  │ ✅ Footer ở đáy (sticky footer!)         │
  │ ✅ Equal height columns                  │
  ├──────────────────────────────────────────┤
  │ SHOULD HAVE (5 phút):                    │
  │ 🟡 Semantic HTML tags                    │
  │ 🟡 flex-shrink: 0 cho fixed elements    │
  │ 🟡 Giải thích flex: 1 shorthand         │
  ├──────────────────────────────────────────┤
  │ NICE TO HAVE (5 phút):                   │
  │ 🔵 CSS Grid alternative                  │
  │ 🔵 Responsive breakpoints                │
  │ 🔵 Fixed header (position: sticky)       │
  │ 🔵 Print styles                          │
  └──────────────────────────────────────────┘
```

### A — Architecture

```
ARCHITECTURE — 2 APPROACHES:
═══════════════════════════════════════════════════════════════

  FLEXBOX (Nested — code hiện tại!):
  .holy-grail (flex: column)           ← OUTER!
  ├── <header>       60px fixed
  ├── .holy-body (flex: row)           ← INNER!
  │   ├── <nav>       100px fixed
  │   ├── <main>      flex: 1 (fluid!)
  │   └── <aside>     100px fixed
  └── <footer>        100px fixed

  → 2 flex containers lồng nhau!
  → Outer: chia dọc (header/body/footer!)
  → Inner: chia ngang (nav/content/sidebar!)

  CSS GRID (Flat — alternative!):
  .holy-grail (grid)                   ← 1 CONTAINER!
  ├── <header>       grid-area: header
  ├── <nav>          grid-area: nav
  ├── <main>         grid-area: content
  ├── <aside>        grid-area: sidebar
  └── <footer>       grid-area: footer

  → 1 container! KHÔNG cần .holy-body!
  → grid-template-areas: visual mapping!
  → Responsive: đổi areas = đổi layout!
```

### D — Design

```
DESIGN DECISIONS — SO SÁNH:
═══════════════════════════════════════════════════════════════

  1. Flexbox vs Grid:
     ┌──────────────────┬────────────────────┐
     │ Flexbox           │ CSS Grid           │
     ├──────────────────┼────────────────────┤
     │ 2 containers     │ 1 container        │
     │ ~30 dòng CSS     │ ~20 dòng CSS       │
     │ 1 chiều          │ 2 chiều            │
     │ Phổ biến hơn     │ Mạnh hơn           │
     │ Hỗ trợ rộng hơn  │ Modern browsers    │
     └──────────────────┴────────────────────┘
     → Interview: dùng Flexbox, mention Grid!

  2. min-height vs height:
     → height: 100vh → content bị CẮT!
     → min-height: 100vh → content dài hơn OK!
     → LUÔN dùng min-height!

  3. Fixed px vs % cho sidebar:
     → px: nhất quán, predictable!
     → %: responsive nhưng có thể quá nhỏ/lớn!
     → Chọn: px (yêu cầu bài!)

  4. Semantic HTML:
     → <header>, <nav>, <main>, <aside>, <footer>!
     → KHÔNG dùng <div> cho everything!
     → SEO + Accessibility + Readability!

  5. box-sizing:
     → border-box: padding NẰM TRONG width!
     → content-box: padding NGOÀI width!
     → LUÔN dùng border-box (global reset!)
```

### I — Implementation (Triển khai)

```
IMPLEMENTATION WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (2 phút): HTML structure!
  → "5 semantic tags trong wrapper."
  → <header>, <nav>, <main>, <aside>, <footer>!
  → Wrapper .holy-body cho 3 columns!
  → NÓI: "Semantic tags cho accessibility!"

  BƯỚC 2 (3 phút): Outer flex (column!)
  → .holy-grail: display: flex; flex-direction: column;
  → min-height: 100vh!
  → NÓI: "min-height, KHÔNG height — content có thể dài!"

  BƯỚC 3 (3 phút): Fixed elements!
  → Header: height: 60px; flex-shrink: 0;
  → Footer: height: 100px; flex-shrink: 0;
  → Nav/Sidebar: width: 100px; flex-shrink: 0;
  → NÓI: "flex-shrink: 0 chặn co lại!"

  BƯỚC 4 (2 phút): Fluid elements!
  → .holy-body: flex: 1 (chiếm hết vertical space!)
  → .holy-content: flex: 1 (chiếm hết horizontal space!)
  → NÓI: "flex: 1 = grow: 1, shrink: 1, basis: 0!"

  BƯỚC 5 (5+ phút): GIẢI THÍCH + Enhancement!
  → Demo Grid alternative!
  → Responsive breakpoints!
  → Discuss sticky header, scroll behavior!
  → Thời gian dư → DEPTH, không thêm features!
```

### Edge Cases — Đề phòng!

```
EDGE CASES — HOLY GRAIL:
═══════════════════════════════════════════════════════════════

  1. CONTENT RẤT DÀI:
     → min-height: 100vh → page scroll bình thường! ✅
     → height: 100vh → content BỊ CẮT! 💀
     → LUÔN dùng min-height!

  2. CONTENT RẤT NGẮN:
     → min-height: 100vh → body flex:1 GIÃN ra!
     → Footer LUÔN ở đáy viewport! ✅
     → Không có min-height → footer ở GIỮA page!

  3. VIEWPORT QUÁ HẸP:
     → Nav 100px + Sidebar 100px = 200px cố định!
     → Viewport 300px → Content chỉ 100px!
     → Viewport < 200px → overflow horizontal!
     → Fix: responsive breakpoint collapse columns!

  4. TEXT OVERFLOW:
     → Nav 100px + padding 40px = 60px content space!
     → Long words tràn ra ngoài!
     → Fix: overflow-wrap: break-word;
     → Hoặc: overflow: hidden; text-overflow: ellipsis;

  5. ZOOM:
     → User zoom 200% → viewport nhỏ hơn!
     → Fixed px → tràn! → cần responsive!

  6. PRINT:
     → Print page → nav/sidebar không cần!
     → @media print { .holy-nav { display: none; } }

  7. RTL LANGUAGES:
     → Arabic/Hebrew: phải → trái!
     → Flexbox: flex-direction: row tự REVERSE!
     → NẾU dùng direction: rtl trên html!
     → Grid: cũng tự handle RTL!
```

### O — Optimization

```
OPTIMIZATION — PHÂN TẦNG:
═══════════════════════════════════════════════════════════════

  L1 — CƠ BẢN (code trong bài!):
  ──────────────────────────────
  1. flex-shrink: 0 → fixed elements không co!
  2. min-height: 100vh → sticky footer!
  3. Semantic HTML → accessibility + SEO!

  L2 — TRUNG BÌNH (mention!):
  ──────────────────────────────
  4. CSS Grid alternative:
     → grid-template-areas: visual layout mapping!
     → Responsive: đổi areas = đổi layout!

  5. Responsive breakpoints:
     → 768px: collapse sidebar (1 column!)
     → Progressive collapse!

  6. Sticky header:
     .holy-header {
       position: sticky;
       top: 0;
       z-index: 100;
     }
     → Header DÍNH ở trên khi scroll!

  L3 — NÂNG CAO (chỉ mention!):
  ──────────────────────────────
  7. CSS Containment:
     .holy-nav { contain: layout; }
     → Browser biết: thay đổi trong nav
       KHÔNG ảnh hưởng ngoài → skip repaint!

  8. Scrollable sidebar:
     .holy-sidebar { overflow-y: auto; }
     → Sidebar scroll ĐỘC LẬP với content!

  9. CSS Grid subgrid:
     → Content alignment giữa columns!
     → Advanced Grid feature!
```

```
INTERVIEW TIPS — HOLY GRAIL:
═══════════════════════════════════════════════════════════════

  ⏱ TIMELINE (30 phút):
  ├── 0-2 phút:   Hỏi requirements!
  ├── 2-4 phút:   HTML semantic structure!
  ├── 4-8 phút:   Outer flex (column!)
  ├── 8-12 phút:  Inner flex (row!) + fixed/fluid!
  ├── 12-18 phút: Giải thích flex properties!
  ├── 18-22 phút: CSS Grid alternative!
  ├── 22-25 phút: Responsive breakpoints!
  └── 25-30 phút: Edge cases + optimization!

  💡 KEY TALKING POINTS:
  → "flex: 1 = grow: 1, shrink: 1, basis: 0"
  → "flex-shrink: 0 giữ fixed width/height!"
  → "min-height, KHÔNG height cho sticky footer!"
  → "Semantic HTML cho accessibility!"
  → "Nested flex: outer column, inner row!"

  🎯 ĐIỂM CỘNG:
  → Biết Grid alternative (grid-template-areas!)
  → Mention box-sizing: border-box!
  → Responsive breakpoints!
  → Sticky header (position: sticky!)
  → CSS Containment (contain: layout!)
  → Print styles!
  → RTL language support!

  ⚠ SAI LẦM PHỔ BIẾN:
  → height thay vì min-height → content bị cắt!
  → Quên flex-shrink: 0 → nav co lại!
  → Dùng <div> thay vì semantic tags!
  → Quên box-sizing → padding vỡ layout!
  → Fixed height cho body → không flexible!
  → Chỉ biết Flexbox, không biết Grid!
```

### ♿ Accessibility — Holy Grail Layout

```
ACCESSIBILITY — LAYOUT PATTERNS:
═══════════════════════════════════════════════════════════════

  1. LANDMARK REGIONS:
  <header>  → role="banner"   → "banner landmark"
  <nav>     → role="navigation" → "navigation landmark"
  <main>    → role="main"     → "main landmark"
  <aside>   → role="complementary" → "complementary"
  <footer>  → role="contentinfo" → "content info"
  → Screen reader: navigate bằng landmarks! ✅

  2. SKIP NAVIGATION:
  <a href="#main-content" class="skip-link">
    Skip to main content
  </a>
  <main id="main-content">...</main>
  → Keyboard user: Tab → skip nav đến content!
  → CSS: ẩn bình thường, hiện khi focus!
  .skip-link {
    position: absolute; top: -9999px;
  }
  .skip-link:focus {
    top: 0; z-index: 1000;
  }

  3. FOCUS ORDER:
  → Tab order = DOM order = visual order!
  → Flexbox order property có thể PHẠM WCAG!
  → Nếu visual ≠ DOM → confusion!

  4. ARIA LABELS:
  <nav aria-label="Primary navigation">
  <aside aria-label="Related articles">
  → Phân biệt nếu nhiều <nav> hoặc <aside>!
```

### 🧪 Testing Strategy — Holy Grail

```
TESTING — HOLY GRAIL:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────┬────────────────────────────┐
  │ Test Case                │ Expected                   │
  ├──────────────────────────┼────────────────────────────┤
  │ Full viewport            │ Footer ở ĐÁY viewport!    │
  │ Content ngắn             │ Footer VẪN ở đáy!         │
  │ Content dài              │ Page scrollable!           │
  │ Header height            │ Đúng 60px!                │
  │ Footer height            │ Đúng 100px!               │
  │ Nav width                │ Đúng 100px, KHÔNG co!     │
  │ Sidebar width            │ Đúng 100px, KHÔNG co!     │
  │ Content width             │ Fluid, co giãn!           │
  │ Resize viewport          │ Content thay đổi, nav giữ │
  │ Equal height columns     │ 3 columns cùng height!    │
  └──────────────────────────┴────────────────────────────┘

  DEVTOOLS TESTING:
  1. Inspect → computed tab → verify heights/widths!
  2. Responsive mode → resize viewport!
  3. Flexbox inspector → visualize flex items!
  4. Accessibility tab → verify landmarks!
```
