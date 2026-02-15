# Tesla Frontend Interview — Deep Dive

> 📅 2026-02-14 · ⏱ 18 phút đọc
>
> Phone Screen: Fetch API + Render Cards,
> JavaScript Caching & Data Handling,
> React TODO List (2 rounds),
> System Design (Engineering Background),
> Behavioral Questions
> Độ khó: ⭐️⭐️⭐️ | Tesla Frontend (5 rounds)

---

## Mục Lục

| #   | Phần                                   |
| --- | -------------------------------------- |
| 1   | Tổng quan quy trình phỏng vấn          |
| 2   | Phone Screen: Fetch API + Render Cards |
| 3   | JavaScript Caching — Concepts          |
| 4   | Caching Strategies — Implementation    |
| 5   | React TODO List — Full Implementation  |
| 6   | React TODO — Advanced Patterns         |
| 7   | System Design — Engineering Thinking   |
| 8   | Behavioral Questions                   |
| 9   | Bài học rút ra từ Tesla                |
| 10  | Tóm tắt phỏng vấn                      |

---

## §1. Tổng quan quy trình phỏng vấn

```
TESLA — 5 ROUNDS:
═══════════════════════════════════════════════════════════════

  Độ khó: EASIER SIDE so với Big Tech!
  Focus: Practical fundamentals + real-world understanding!
  KHÔNG tập trung tricky algorithms!
  Bottleneck: Final manager round!

  ① PHONE SCREEN:
  → "Extremely light"!
  → Fetch API + render list of cards!

  ② ONSITE — JAVASCRIPT / CACHING:
  → Practical JS knowledge!
  → Caching behavior + data handling!
  → Reasoning through trade-offs!

  ③ ONSITE — REACT (ROUND 1):
  → Build TODO list!
  → "Fair amount of code"!
  → Conceptually straightforward!

  ④ ONSITE — REACT (ROUND 2):
  → Tiếp tục TODO list hoặc extend!
  → Thêm features!

  ⑤ ONSITE — SYSTEM DESIGN + BEHAVIORAL:
  → Engineering background!
  → Prior experience!
  → How you think!
  → Standard behavioral questions!

  💡 INSIGHT:
  → "Tesla's process was one of the SIMPLEST"!
  → Nhưng ĐỪNG chủ quan — fundamentals phải VỮNG!
  → "Less tricky algorithms, more practical"!
```

---

## §2. Phone Screen: Fetch API + Render Cards

```jsx
// ═══ PHONE SCREEN — FETCH + RENDER CARDS ═══

import { useState, useEffect } from "react";

function CardList() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCards = async () => {
      try {
        const res = await fetch("/api/cards", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCards(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
    return () => controller.abort();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (cards.length === 0) return <div>No cards found.</div>;

  return (
    <div className="card-grid">
      {cards.map((card) => (
        <Card key={card.id} data={card} />
      ))}
    </div>
  );
}

function Card({ data }) {
  return (
    <article className="card">
      {data.image && <img src={data.image} alt={data.title} loading="lazy" />}
      <div className="card-body">
        <h3>{data.title}</h3>
        <p>{data.description}</p>
      </div>
    </article>
  );
}
```

```css
/* ═══ CARD CSS ═══ */

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.card-body {
  padding: 16px;
}

.card h3 {
  margin: 0 0 8px;
  font-size: 18px;
}

.card p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}
```

```
PHONE SCREEN — ĐÁNH GIÁ ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ PHẢI CÓ:
  → useEffect + fetch đúng cách!
  → AbortController cleanup!
  → Loading / Error / Empty states!
  → Unique key cho mỗi card!
  → response.ok check!

  ĐIỂM CỘNG:
  → Responsive grid layout!
  → loading="lazy" cho images!
  → Semantic HTML (<article>!)
  → Error boundary!
```

---

## §3. JavaScript Caching — Concepts

```
CACHING CONCEPTS:
═══════════════════════════════════════════════════════════════

  Q: "Caching là gì?"
  A: Lưu trữ KẾT QUẢ đã tính/fetch → dùng lại!
  → Tránh computation/network LẶNG PHÍ!
  → Tradeoff: MEMORY vs SPEED!

  CÁC LOẠI CACHE:
  ┌──────────────────┬──────────────────────────────────────┐
  │ Loại             │ Mô tả                                │
  ├──────────────────┼──────────────────────────────────────┤
  │ Browser Cache    │ HTTP Cache-Control, ETag, 304!       │
  │ Memory Cache     │ JS variable/Map (runtime!)           │
  │ LocalStorage     │ Persistent, 5-10MB, string only!     │
  │ SessionStorage   │ Per-tab, cleared on close!           │
  │ IndexedDB        │ Large data, structured, async!       │
  │ Service Worker   │ Offline cache, Cache API!            │
  │ CDN Cache        │ Edge server, gần user!               │
  │ API Cache        │ React Query / SWR staleTime!         │
  └──────────────────┴──────────────────────────────────────┘
```

```
MEMOIZATION — FUNCTION CACHING:
═══════════════════════════════════════════════════════════════

  Lưu KẾT QUẢ function theo INPUT!
  → Cùng input → trả về kết quả ĐÃ LƯU!
  → Tránh tính lại!
```

```javascript
// ═══ MEMOIZE FUNCTION — TỪ ĐẦU ═══

function memoize(fn) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log("Cache HIT:", key);
      return cache.get(key);
    }

    console.log("Cache MISS:", key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// Sử dụng:
const expensiveAdd = memoize((a, b) => {
  console.log("Computing...");
  return a + b;
});

expensiveAdd(1, 2); // Computing... → 3
expensiveAdd(1, 2); // Cache HIT → 3 (không tính lại!)
expensiveAdd(3, 4); // Computing... → 7
```

```javascript
// ═══ MEMOIZE VỚI TTL (Time-To-Live!) ═══

function memoizeWithTTL(fn, ttlMs = 60000) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.value; // Chưa hết hạn!
    }

    const result = fn.apply(this, args);
    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  };
}

// Cache 30 giây:
const cachedFetch = memoizeWithTTL(fetchUser, 30000);
```

```javascript
// ═══ LRU CACHE (Least Recently Used!) ═══

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map giữ INSERTION ORDER!
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;

    // Move to END (most recently used!):
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    // Xóa nếu đã tồn tại (để re-insert ở cuối!):
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Nếu đầy → xóa item CŨ NHẤT (đầu Map!):
    if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, value);
  }

  get size() {
    return this.cache.size;
  }
}

// Sử dụng:
const cache = new LRUCache(3);
cache.set("a", 1);
cache.set("b", 2);
cache.set("c", 3);
cache.set("d", 4); // 'a' bị XÓA (oldest!)
cache.get("b"); // 'b' move to end!
cache.set("e", 5); // 'c' bị XÓA (oldest after 'b' moved!)
```

---

## §4. Caching Strategies — Implementation

```
CACHING STRATEGIES:
═══════════════════════════════════════════════════════════════

  ① CACHE-FIRST (Stale-while-revalidate!):
  → Trả về CACHE ngay → fetch mới → update!
  → UX tốt: user thấy data NGAY LẬP TỨC!
  → SWR / React Query staleTime!

  ② NETWORK-FIRST:
  → Fetch TRƯỚC → nếu fail → dùng cache!
  → Data luôn FRESH nhất!
  → Tốn network!

  ③ CACHE-ONLY:
  → Chỉ dùng cache! Không fetch!
  → Offline mode!

  ④ NETWORK-ONLY:
  → Luôn fetch! Không cache!
  → Real-time data (stock prices!)
```

```javascript
// ═══ CACHE-FIRST PATTERN ═══

class APICache {
  constructor(ttlMs = 60000) {
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  async fetch(url, options = {}) {
    const key = url;
    const cached = this.cache.get(key);

    // Cache HIT + chưa hết hạn:
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      // Revalidate in background:
      this._revalidate(key, url, options);
      return cached.data;
    }

    // Cache MISS hoặc hết hạn:
    return this._fetchAndCache(key, url, options);
  }

  async _fetchAndCache(key, url, options) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  async _revalidate(key, url, options) {
    try {
      await this._fetchAndCache(key, url, options);
    } catch {
      // Giữ cache cũ nếu revalidate fail!
    }
  }

  invalidate(url) {
    this.cache.delete(url);
  }

  clear() {
    this.cache.clear();
  }
}

// Sử dụng:
const apiCache = new APICache(30000); // 30s TTL
const users = await apiCache.fetch("/api/users");
```

```
CACHING TRADE-OFFS (hay được hỏi!):
═══════════════════════════════════════════════════════════════

  ┌─────────────┬────────────────────────────────────────────┐
  │ Pro         │ Con                                        │
  ├─────────────┼────────────────────────────────────────────┤
  │ ✅ Nhanh!   │ ❌ Stale data (data cũ!)                  │
  │ ✅ Giảm     │ ❌ Memory consumption!                     │
  │ network!    │ ❌ Cache invalidation phức tạp!            │
  │ ✅ Offline! │ ❌ Inconsistency giữa tabs/users!         │
  │ ✅ UX tốt!  │ ❌ "2 hard problems: cache invalidation   │
  │             │    and naming things" — Phil Karlton       │
  └─────────────┴────────────────────────────────────────────┘

  KHI NÀO CACHE:
  → Data KHÔNG thay đổi thường xuyên!
  → Expensive operations (computation/network!)
  → User experience: instant feedback!
  → API rate limiting!

  KHI NÀO KHÔNG CACHE:
  → Real-time data (stock prices, live scores!)
  → Security-sensitive (auth tokens expiry!)
  → Data thay đổi LIÊN TỤC!
  → Write-heavy (CRUD operations!)
```

---

## §5. React TODO List — Full Implementation

```jsx
// ═══ REACT TODO LIST — PRODUCTION QUALITY ═══

import { useState, useCallback, useMemo } from "react";

// UNIQUE ID generator:
let nextId = 0;
const generateId = () => `todo-${Date.now()}-${nextId++}`;

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'active' | 'completed'

  // ── ADD TODO ──
  const handleAdd = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;

    setTodos((prev) => [
      ...prev,
      {
        id: generateId(),
        text,
        completed: false,
        createdAt: Date.now(),
      },
    ]);
    setInputValue("");
  }, [inputValue]);

  // ── TOGGLE TODO ──
  const handleToggle = useCallback((id) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }, []);

  // ── DELETE TODO ──
  const handleDelete = useCallback((id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  // ── EDIT TODO ──
  const handleEdit = useCallback((id, newText) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, text: newText } : todo)),
    );
  }, []);

  // ── CLEAR COMPLETED ──
  const handleClearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((todo) => !todo.completed));
  }, []);

  // ── TOGGLE ALL ──
  const handleToggleAll = useCallback(() => {
    setTodos((prev) => {
      const allCompleted = prev.every((t) => t.completed);
      return prev.map((t) => ({ ...t, completed: !allCompleted }));
    });
  }, []);

  // ── FILTERED TODOS ──
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case "active":
        return todos.filter((t) => !t.completed);
      case "completed":
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  // ── STATS ──
  const activeCount = useMemo(
    () => todos.filter((t) => !t.completed).length,
    [todos],
  );

  return (
    <div className="todo-app">
      <h1>Todo List</h1>

      {/* INPUT */}
      <div className="todo-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="What needs to be done?"
          autoFocus
        />
        <button onClick={handleAdd} disabled={!inputValue.trim()}>
          Add
        </button>
      </div>

      {/* TOGGLE ALL */}
      {todos.length > 0 && (
        <label className="toggle-all">
          <input
            type="checkbox"
            checked={todos.length > 0 && activeCount === 0}
            onChange={handleToggleAll}
          />
          Mark all as complete
        </label>
      )}

      {/* TODO LIST */}
      <ul className="todo-list">
        {filteredTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </ul>

      {/* FOOTER */}
      {todos.length > 0 && (
        <div className="todo-footer">
          <span>{activeCount} items left</span>

          <div className="filters">
            {["all", "active", "completed"].map((f) => (
              <button
                key={f}
                className={filter === f ? "active" : ""}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {todos.some((t) => t.completed) && (
            <button onClick={handleClearCompleted}>Clear completed</button>
          )}
        </div>
      )}
    </div>
  );
}
```

```jsx
// ═══ TODO ITEM — WITH INLINE EDIT ═══

import { useState, useRef, useEffect, memo } from "react";

const TodoItem = memo(function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const editRef = useRef(null);

  // Focus input khi bật edit mode:
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [isEditing]);

  const handleSubmitEdit = () => {
    const trimmed = editText.trim();
    if (trimmed) {
      onEdit(todo.id, trimmed);
      setIsEditing(false);
    } else {
      // Empty text → delete!
      onDelete(todo.id);
    }
  };

  const handleCancelEdit = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  return (
    <li className={`todo-item ${todo.completed ? "completed" : ""}`}>
      {isEditing ? (
        <input
          ref={editRef}
          className="edit-input"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmitEdit();
            if (e.key === "Escape") handleCancelEdit();
          }}
          onBlur={handleSubmitEdit}
        />
      ) : (
        <>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            aria-label={`Mark "${todo.text}" as ${todo.completed ? "incomplete" : "complete"}`}
          />
          <span className="todo-text" onDoubleClick={() => setIsEditing(true)}>
            {todo.text}
          </span>
          <button
            className="delete-btn"
            onClick={() => onDelete(todo.id)}
            aria-label={`Delete "${todo.text}"`}
          >
            ✕
          </button>
        </>
      )}
    </li>
  );
});
```

```css
/* ═══ TODO CSS ═══ */

.todo-app {
  max-width: 520px;
  margin: 40px auto;
  font-family: system-ui, sans-serif;
}

.todo-app h1 {
  text-align: center;
  font-size: 48px;
  font-weight: 200;
  color: #b83f45;
  margin-bottom: 24px;
}

.todo-input {
  display: flex;
  gap: 8px;
}

.todo-input input {
  flex: 1;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
}

.todo-input input:focus {
  border-color: #b83f45;
}

.todo-input button {
  padding: 12px 20px;
  background: #b83f45;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 16px 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  transition: background 0.15s;
}

.todo-item:hover {
  background: #f9f9f9;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #aaa;
}

.todo-text {
  flex: 1;
  font-size: 16px;
  cursor: pointer;
}

.delete-btn {
  background: none;
  border: none;
  color: #cc9a9a;
  font-size: 18px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

.todo-item:hover .delete-btn {
  opacity: 1;
}

.todo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: 14px;
  color: #777;
}

.filters button {
  background: none;
  border: 1px solid transparent;
  padding: 4px 8px;
  margin: 0 2px;
  border-radius: 4px;
  cursor: pointer;
  color: #777;
}

.filters button.active {
  border-color: #b83f45;
  color: #b83f45;
}
```

---

## §6. React TODO — Advanced Patterns

```jsx
// ═══ PERSISTENCE — localStorage ═══

function usePersistentTodos(key = "todos") {
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(todos));
  }, [todos, key]);

  return [todos, setTodos];
}

// Sử dụng:
// const [todos, setTodos] = usePersistentTodos('my-todos');
```

```jsx
// ═══ useReducer — COMPLEX STATE ═══

function todosReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [
        ...state,
        {
          id: generateId(),
          text: action.text,
          completed: false,
          createdAt: Date.now(),
        },
      ];
    case "TOGGLE":
      return state.map((t) =>
        t.id === action.id ? { ...t, completed: !t.completed } : t,
      );
    case "DELETE":
      return state.filter((t) => t.id !== action.id);
    case "EDIT":
      return state.map((t) =>
        t.id === action.id ? { ...t, text: action.text } : t,
      );
    case "CLEAR_COMPLETED":
      return state.filter((t) => !t.completed);
    case "TOGGLE_ALL": {
      const allDone = state.every((t) => t.completed);
      return state.map((t) => ({ ...t, completed: !allDone }));
    }
    case "REORDER":
      return action.todos;
    default:
      return state;
  }
}

// Sử dụng:
// const [todos, dispatch] = useReducer(todosReducer, []);
// dispatch({ type: 'ADD', text: 'Learn React' });
// dispatch({ type: 'TOGGLE', id: 'todo-1' });
```

```jsx
// ═══ DRAG & DROP REORDER ═══

function TodoListDraggable({ todos, onReorder }) {
  const [dragIndex, setDragIndex] = useState(null);

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newTodos = [...todos];
    const [removed] = newTodos.splice(dragIndex, 1);
    newTodos.splice(index, 0, removed);
    onReorder(newTodos);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  return (
    <ul>
      {todos.map((todo, index) => (
        <li
          key={todo.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={dragIndex === index ? "dragging" : ""}
        >
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

```
TODO LIST — FOLLOW-UP QUESTIONS:
═══════════════════════════════════════════════════════════════

  Q: "Tại sao dùng unique ID thay vì index?"
  A: Index thay đổi khi delete/reorder!
  → React dùng key để track elements!
  → Sai key = MẤT STATE (input value, animation!)

  Q: "Tại sao memo TodoItem?"
  A: Khi 1 todo thay đổi → TẤT CẢ items re-render!
  → memo: chỉ re-render item CÓ THAY ĐỔI!
  → useCallback cho handlers → stable references!

  Q: "useState vs useReducer?"
  A: useState: 1-2 updates, đơn giản!
  useReducer: nhiều action types, complex logic!
  → TODO: useReducer tốt hơn (ADD/TOGGLE/DELETE/EDIT!)

  Q: "Làm sao PERSIST data?"
  A: localStorage + useEffect! Hoặc custom hook!
  → Lazy initialization: useState(() => localStorage...)!

  Q: "Handle 10K todos?"
  A: Virtual scrolling! react-window!
  → Chỉ render ~20 visible items!
```

---

## §7. System Design — Engineering Thinking

```
SYSTEM DESIGN — TESLA APPROACH:
═══════════════════════════════════════════════════════════════

  Tesla SD round: "More about evaluating your engineering
  background, prior experience, and how you think"

  → KHÔNG deep-dive technical details!
  → Muốn biết: architect mindset, tradeoff reasoning!

  FRAMEWORK TRẢ LỜI:
  ┌────────────────────────────────────────────────────────┐
  │ ① CLARIFY requirements (functional + non-functional!) │
  │ ② HIGH-LEVEL architecture (boxes + arrows!)           │
  │ ③ KEY DECISIONS + WHY (tradeoffs!)                    │
  │ ④ DATA MODEL (schema, API!)                           │
  │ ⑤ REAL-WORLD experience (dự án đã làm!)              │
  │ ⑥ SCALE considerations (nếu traffic tăng?)            │
  └────────────────────────────────────────────────────────┘
```

```
TOPICS CÓ THỂ ĐƯỢC HỎI:
═══════════════════════════════════════════════════════════════

  ① "Design a dashboard (monitoring/analytics!)":
  → Real-time data: WebSocket vs SSE vs polling!
  → Chart rendering: Canvas vs SVG!
  → Data aggregation: server-side vs client-side!
  → Caching: stale data OK? TTL?

  ② "Design a component library":
  → Theming: CSS variables vs styled-components!
  → API design: props, composition, slots!
  → Documentation: Storybook!
  → Versioning: semver, breaking changes!
  → Bundle: tree-shaking, ESM vs CJS!

  ③ "Design a real-time notification system":
  → Delivery: push vs pull!
  → Priority: urgent vs normal!
  → Persistence: read/unread state!
  → UI: toast vs badge vs drawer!

  HOW YOU THINK — TRADEOFF REASONING:
  ┌────────────────────────────────────────────────────────┐
  │ "I'd choose X BECAUSE..."                             │
  │ → State tradeoffs EXPLICITLY!                          │
  │ → "X is faster BUT less flexible"                     │
  │ → "Y supports offline BUT adds complexity"            │
  │ → "Given our scale, X is sufficient"                  │
  │ → "If we need to scale to Z, we'd switch to Y"       │
  └────────────────────────────────────────────────────────┘
```

---

## §8. Behavioral Questions

```
BEHAVIORAL — STANDARD QUESTIONS:
═══════════════════════════════════════════════════════════════

  STAR METHOD:
  S — Situation (bối cảnh!)
  T — Task (nhiệm vụ!)
  A — Action (hành động!)
  R — Result (kết quả + metrics!)

  CÂU HỎI PHỔ BIẾN:
  ┌────────────────────────────────────────────────────────┐
  │ ① "Tell me about a time you dealt with a tight        │
  │    deadline"                                           │
  │ → Prioritize MVP! Cut scope, not quality!             │
  │ → Communicate early with stakeholders!                 │
  │                                                        │
  │ ② "A disagreement with a teammate"                    │
  │ → Listen first! Understand perspective!                │
  │ → Data-driven decision! Document tradeoffs!           │
  │ → Commit once agreed!                                  │
  │                                                        │
  │ ③ "A project you're most proud of"                    │
  │ → Technical challenge + impact!                        │
  │ → Your SPECIFIC contribution!                          │
  │ → Lessons learned!                                     │
  │                                                        │
  │ ④ "How do you handle technical debt?"                  │
  │ → Identify + document debt!                            │
  │ → Prioritize based on impact!                          │
  │ → Incremental improvement (boy scout rule!)            │
  │ → Balance: new features vs maintenance!                │
  │                                                        │
  │ ⑤ "Why Tesla?"                                        │
  │ → Mission: accelerate sustainable energy!             │
  │ → Scale: massive real-world impact!                   │
  │ → Tech challenges: real-time, IoT, data!             │
  │ → Innovation culture!                                  │
  └────────────────────────────────────────────────────────┘
```

```
TESLA-SPECIFIC BEHAVIORAL:
═══════════════════════════════════════════════════════════════

  TESLA VALUES:
  → Move FAST! "Move fast, break things" mentality!
  → First principles thinking!
  → Owner mentality — take responsibility!
  → Bias for ACTION!
  → Lean operations!

  Q: "How do you handle ambiguity?"
  A: → Break down into smaller KNOWN problems!
  → Make assumptions, DOCUMENT them!
  → Prototype quickly → validate → iterate!
  → Ask for CLARIFICATION when stuck!

  Q: "Tell me about a time you shipped fast"
  A: → Prioritize: what's the MINIMUM viable solution?
  → Hack → Ship → Iterate!
  → Testing: focus on CRITICAL paths, not 100% coverage!
  → Monitoring after ship: track errors + performance!
```

---

## §9. Bài học rút ra từ Tesla

```
KEY LESSONS:
═══════════════════════════════════════════════════════════════

  ① PRACTICAL > TRICKY ALGORITHMS:
  → Tesla không hỏi LeetCode hard!
  → Tập trung: "Can you BUILD things?"
  → Fetch data, render UI, handle state!

  ② FUNDAMENTALS VỮNG:
  → JS: async/await, Promise, closures, caching!
  → React: hooks, state, lifecycle, memo!
  → CSS: layout, responsive!
  → Browser: events, DOM, performance!

  ③ SIMPLICITY:
  → Quy trình phỏng vấn ĐƠẢN GIẢN!
  → Nhưng mỗi round phải làm TỐT!
  → Clean code = PASS, messy code = FAIL!

  ④ MANAGER ROUND = BOTTLENECK:
  → Final manager round quyết định!
  → Behavioral chuẩn bị KỸ!
  → Why Tesla? → mission-driven!
  → Prior experience matters!

  ⑤ SO SÁNH VỚI CÁC CÔNG TY KHÁC:
  ┌──────────────┬─────────────────────────────────────────┐
  │ Tesla        │ Practical fundamentals! Simple process!│
  │ OpenAI       │ System design + streaming! Harder!     │
  │ Snowflake    │ React + algorithms! Tricky undo!       │
  │ BlackRock    │ Code review + autocomplete! Medium!    │
  │ Stripe       │ System design heavy! Hardest!          │
  │ xAI          │ React assessment, time pressure!       │
  │ Yahoo        │ Infinite scroll + SD! Medium!          │
  └──────────────┴─────────────────────────────────────────┘
```

---

## §10. Tóm tắt phỏng vấn

```
PHỎNG VẤN — TRẢ LỜI:
═══════════════════════════════════════════════════════════════

  Q: "Fetch + render cards?"
  A: useEffect + fetch + AbortController + loading/error states.
  Grid layout với auto-fill. Semantic HTML. Keys!

  Q: "Caching?"
  A: Memoize = cache function results. Map/object.
  LRU Cache: capacity limit, evict oldest.
  Strategies: cache-first (SWR), network-first, TTL!
  Tradeoff: speed vs staleness vs memory!

  Q: "TODO list?"
  A: useState/useReducer. CRUD: add/toggle/delete/edit.
  Filter: all/active/completed (useMemo!).
  Inline edit: double-click → input → Enter/Escape.
  memo + useCallback cho performance!

  Q: "System design?"
  A: Clarify → Architecture → Key decisions + WHY.
  Tesla cares about TRADEOFF REASONING!
  Real-world experience quan trọng hơn theory!

  Q: "Behavioral?"
  A: STAR method! Tesla values: fast, first-principles,
  owner mentality, bias for action!
```

---

### Checklist

- [ ] **Fetch + Cards**: useEffect + AbortController + loading/error/empty + responsive grid + semantic HTML!
- [ ] **Memoize function**: Map cache, key = JSON.stringify(args), cache.has → return cached!
- [ ] **LRU Cache**: Map (ordered!), get = delete+re-set, set = check capacity → delete oldest!
- [ ] **Cache strategies**: cache-first (instant UX), network-first (fresh data), TTL (auto-expire)!
- [ ] **Cache tradeoffs**: speed vs staleness vs memory; "cache invalidation = hardest problem"!
- [ ] **TODO CRUD**: add (Enter key!), toggle checkbox, delete button, inline edit (double-click!)!
- [ ] **TODO filter**: all/active/completed + useMemo + activeCount + clear completed!
- [ ] **TODO memo**: React.memo(TodoItem) + useCallback cho handlers → skip re-render!
- [ ] **TODO persistence**: localStorage + lazy init useState(() => JSON.parse(...)!)
- [ ] **TODO useReducer**: nhiều action types → cleaner than multiple useState!
- [ ] **System Design**: clarify → architecture → key decisions + tradeoff reasoning!
- [ ] **Behavioral**: STAR method; Tesla values = fast + first-principles + owner mentality!

---

_Nguồn: Reddit — Tesla frontend interview experience (5 rounds)_
_Cập nhật lần cuối: Tháng 2, 2026_
