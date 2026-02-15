# xAI React Assessment (CodeSignal) — Deep Dive

> 📅 2026-02-14 · ⏱ 20 phút đọc
>
> 4 Medium React Questions trên CodeSignal (1h30min),
> Sorting Stability & Edge Cases, State Management Patterns,
> Todo/List CRUD Components, Dynamic Forms,
> Custom Hooks, Data Fetching, CodeSignal Strategy
> Độ khó: ⭐️⭐️⭐️⭐️ | xAI Frontend Assessment

---

## Mục Lục

| #   | Phần                                          |
| --- | --------------------------------------------- |
| 1   | Tổng quan xAI Assessment                      |
| 2   | Bài học từ ứng viên — Sorting Ambiguity       |
| 3   | React Pattern: Sorted List CRUD               |
| 4   | React Pattern: Dynamic Form với Validation    |
| 5   | React Pattern: Data Fetching & Error Handling |
| 6   | React Pattern: Custom Hooks                   |
| 7   | Sorting Stability — Deep Dive                 |
| 8   | CodeSignal React — Tips & Strategy            |
| 9   | Các bài React medium thường gặp               |
| 10  | Tóm tắt                                       |

---

## §1. Tổng quan xAI Assessment

```
xAI REACT ASSESSMENT — FORMAT:
═══════════════════════════════════════════════════════════════

  Platform: CODESIGNAL!
  Thời gian: 1 GIỜ 30 PHÚT!
  Số câu: 4 câu React MEDIUM!
  Ngôn ngữ: React (JSX!)

  RULES:
  → PHẢI pass TẤT CẢ test cases câu hiện tại
     MỚI ĐƯỢC qua câu tiếp theo!
  → KHÔNG thể skip → quay lại!
  → Mắc kẹt 1 câu = MẤT toàn bộ thời gian còn lại!

  THỜI GIAN PHÂN BỔ LÝ TƯỞNG:
  ┌────────────────────────────────────────────────────────┐
  │ Câu 1: 15 phút (warmup, rõ ràng nhất!)                │
  │ Câu 2: 20 phút                                        │
  │ Câu 3: 25 phút                                        │
  │ Câu 4: 25 phút (khó nhất!)                            │
  │ Buffer: 5 phút (review + edge cases!)                  │
  └────────────────────────────────────────────────────────┘

  ⚠️ CRITICAL:
  → Nếu 1 câu mất > 30 phút → khả năng FAIL cao!
  → Đọc KỸ đề! Tìm edge cases TRƯỚC khi code!
  → Test thử NHIỀU trường hợp, đặc biệt boundary!
```

---

## §2. Bài học từ ứng viên — Sorting Ambiguity

```
VẤN ĐỀ GẶP PHẢI:
═══════════════════════════════════════════════════════════════

  Đề bài: Sort list theo 1 property!
  Ứng viên code ĐÚNG theo đề!
  Nhưng 1 test case FAIL!

  VẤN ĐỀ: 2 elements có CÙNG GIÁ TRỊ sort property!
  → Đề KHÔNG NÓI: element mới thêm VÀO ĐẦU hay CUỐI?
  → Ứng viên: thêm vào CUỐI (hợp lý!)
  → Test case expect: thêm vào ĐẦU! ❌
  → Mất 30-40 phút tìm bug → không kịp hoàn thành!

  BÀI HỌC:
  ┌────────────────────────────────────────────────────────┐
  │ ① KHI SORT: luôn nghĩ về TIE-BREAKING!                │
  │ → Cùng giá trị → sắp xếp theo GÌ tiếp?              │
  │ → Options: insert đầu, insert cuối, theo ID, theo time│
  │                                                        │
  │ ② HIDDEN TEST CASES:                                   │
  │ → CodeSignal KHÔNG show input data!                    │
  │ → Phải ĐOÁN từ console output!                         │
  │ → → Thêm console.log THẬT NHIỀU!                      │
  │                                                        │
  │ ③ KHI BỊ STUCK:                                        │
  │ → Thử TẤT CẢ edge cases: empty, duplicate, boundary! │
  │ → Đảo ngược assumptions!                               │
  │ → Thử: stable sort, reverse order, insert position!    │
  └────────────────────────────────────────────────────────┘
```

---

## §3. React Pattern: Sorted List CRUD

```
BÀI TOÁN THƯỜNG GẶP:
═══════════════════════════════════════════════════════════════

  Implement 1 component:
  → Hiển thị list SORTED theo property!
  → Thêm item mới → tự động đúng vị trí!
  → Xóa item!
  → Edit item → re-sort nếu property thay đổi!
```

```jsx
// ═══ SORTED LIST — IMPLEMENTATION ═══

import { useState, useCallback, useMemo } from "react";

function SortedTodoList() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [sortBy, setSortBy] = useState("priority"); // priority | name | date

  // SORT: dùng useMemo để tránh re-sort mỗi render!
  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      if (a[sortBy] === b[sortBy]) {
        // ⚠️ TIE-BREAKING! Cùng giá trị → sort theo ID GIẢM DẦN!
        // → Element MỚI (ID lớn) sẽ ở TRƯỚC!
        // → Đây chính là cái bẫy trong bài xAI!
        return b.id - a.id;
      }
      // Sort chính:
      if (typeof a[sortBy] === "string") {
        return a[sortBy].localeCompare(b[sortBy]);
      }
      return a[sortBy] - b[sortBy];
    });
  }, [todos, sortBy]);

  // ADD:
  const addTodo = useCallback(() => {
    if (!input.trim()) return;
    const newTodo = {
      id: Date.now(),
      text: input.trim(),
      priority: 3, // default medium
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [...prev, newTodo]);
    setInput("");
  }, [input]);

  // DELETE:
  const deleteTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // TOGGLE:
  const toggleTodo = useCallback((id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  }, []);

  // UPDATE PRIORITY:
  const updatePriority = useCallback((id, priority) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)));
  }, []);

  return (
    <div>
      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="New todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <div>
        Sort by:
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="priority">Priority</option>
          <option value="text">Name</option>
          <option value="createdAt">Date</option>
        </select>
      </div>

      <ul>
        {sortedTodos.map((todo) => (
          <li
            key={todo.id}
            style={{
              textDecoration: todo.completed ? "line-through" : "none",
            }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            {todo.text}
            <select
              value={todo.priority}
              onChange={(e) => updatePriority(todo.id, +e.target.value)}
            >
              <option value={1}>High</option>
              <option value={2}>Medium</option>
              <option value={3}>Low</option>
            </select>
            <button onClick={() => deleteTodo(todo.id)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

```
⚠️ SORTING EDGE CASES CHECKLIST:
═══════════════════════════════════════════════════════════════

  □ Empty list → render "No items"!
  □ 1 item → không cần sort!
  □ 2 items CÙNG sort value → tie-breaking!
  □ Add item CÙNG sort value với existing → vị trí?
  □ Edit item → sort property thay đổi → re-sort!
  □ Delete item → list vẫn sorted!
  □ Sort property = undefined/null → handle!
  □ Case sensitivity: "Apple" vs "apple"!
  □ Numeric sort: 9 vs 10 (string: "10" < "9"!)
```

---

## §4. React Pattern: Dynamic Form với Validation

```jsx
// ═══ DYNAMIC FORM — COMMON ASSESSMENT PATTERN ═══

import { useState, useCallback } from "react";

function DynamicForm({ fields, onSubmit }) {
  const [values, setValues] = useState(() =>
    fields.reduce((acc, f) => ({ ...acc, [f.name]: f.defaultValue || "" }), {}),
  );
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // UPDATE field:
  const handleChange = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error on change:
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  // BLUR → validate!
  const handleBlur = useCallback(
    (name) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      validateField(name);
    },
    [values, fields],
  );

  // VALIDATE single field:
  const validateField = (name) => {
    const field = fields.find((f) => f.name === name);
    const value = values[name];
    let error = "";

    if (field.required && !value.trim()) {
      error = `${field.label} is required`;
    } else if (field.minLength && value.length < field.minLength) {
      error = `Minimum ${field.minLength} characters`;
    } else if (field.pattern && !field.pattern.test(value)) {
      error = field.patternMessage || "Invalid format";
    } else if (field.validate) {
      error = field.validate(value, values) || "";
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  // VALIDATE all:
  const validateAll = () => {
    let isValid = true;
    fields.forEach((f) => {
      if (!validateField(f.name)) isValid = false;
      setTouched((prev) => ({ ...prev, [f.name]: true }));
    });
    return isValid;
  };

  // SUBMIT:
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateAll()) {
      onSubmit(values);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.name} className="field">
          <label htmlFor={field.name}>{field.label}</label>
          {field.type === "select" ? (
            <select
              id={field.name}
              value={values[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              id={field.name}
              value={values[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
            />
          ) : (
            <input
              id={field.name}
              type={field.type || "text"}
              value={values[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
            />
          )}
          {touched[field.name] && errors[field.name] && (
            <span className="error">{errors[field.name]}</span>
          )}
        </div>
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}

// ═══ SỬ DỤNG ═══
const formFields = [
  {
    name: "email",
    label: "Email",
    type: "email",
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: "Invalid email",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    required: true,
    minLength: 8,
  },
  {
    name: "confirmPassword",
    label: "Confirm",
    type: "password",
    required: true,
    validate: (val, all) =>
      val !== all.password ? "Passwords do not match" : "",
  },
];
```

---

## §5. React Pattern: Data Fetching & Error Handling

```jsx
// ═══ DATA FETCHING — COMMON PATTERN ═══

import { useState, useEffect, useCallback } from "react";

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/users?page=${pageNum}&limit=10`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [page, fetchUsers]);

  // ═══ CONDITIONAL RENDERING ═══
  if (loading) return <div className="loading">Loading...</div>;
  if (error)
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={() => fetchUsers(page)}>Retry</button>
      </div>
    );
  if (users.length === 0) return <div>No users found</div>;

  return (
    <div>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} — {user.email}
          </li>
        ))}
      </ul>
      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
```

```
⚠️ DATA FETCHING EDGE CASES:
═══════════════════════════════════════════════════════════════

  □ RACE CONDITION: đổi page nhanh → response cũ ghi đè!
  → Fix: AbortController hoặc ignore stale response!
  □ UNMOUNT: component unmount trước khi response → memory leak!
  → Fix: cleanup trong useEffect hoặc AbortController!
  □ EMPTY DATA: API trả [] → render "No results"!
  □ ERROR: network fail → retry button!
  □ LOADING: skeleton/spinner → tránh layout shift!
  □ PAGINATION: page 1 of 1 → disable both buttons!
```

```jsx
// ═══ useEffect + AbortController (ANTI-RACE CONDITION!) ═══

useEffect(() => {
  const controller = new AbortController();

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/users?page=${page}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    }
  };

  fetchData();

  // CLEANUP: abort khi page thay đổi hoặc unmount!
  return () => controller.abort();
}, [page]);
```

---

## §6. React Pattern: Custom Hooks

```jsx
// ═══ useDebounce — COMMONLY TESTED HOOK ═══

function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer); // CLEANUP!
  }, [value, delay]);

  return debouncedValue;
}

// ═══ useLocalStorage — PERSISTENT STATE ═══

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error("localStorage write failed:", err);
    }
  }, [key, value]);

  return [value, setValue];
}

// ═══ usePrevious — TRACK PREVIOUS VALUE ═══

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current; // Trả giá trị TRƯỚC khi update!
}

// ═══ useToggle — BOOLEAN TOGGLE ═══

function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  return { value, toggle, setTrue, setFalse };
}

// ═══ useCounter — INC/DEC/RESET ═══

function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback(() => setCount((c) => c - 1), []);
  const reset = useCallback(() => setCount(initial), [initial]);
  return { count, increment, decrement, reset };
}
```

---

## §7. Sorting Stability — Deep Dive

```
SORTING STABILITY — BẪY TRONG ASSESSMENT:
═══════════════════════════════════════════════════════════════

  STABLE SORT:
  → Khi 2 elements có CÙNG sort key:
  → Giữ nguyên THỨ TỰ BAN ĐẦU!

  UNSTABLE SORT:
  → Khi 2 elements CÙNG sort key:
  → Thứ tự KHÔNG ĐẢM BẢO!

  JAVASCRIPT Array.sort():
  → Chrome V8: TimSort (STABLE!) ✅ (từ ES2019!)
  → Trước đó: QuickSort (UNSTABLE!)
  → Node.js: STABLE từ v12+!

  ⚠️ BẪY:
  → Dù sort STABLE → nếu bạn thêm element mới vào CUỐI mảng
     rồi sort → element mới sẽ ở SAU elements cùng giá trị!
  → Nhưng test case expect element mới ở TRƯỚC!
  → → Phải đảo chiều tie-breaking!
```

```javascript
// ═══ VÍ DỤ — BẪY CHÍNH XÁC TRONG BÀI xAI ═══

// Mảng ban đầu:
const items = [
  { id: 1, name: "A", priority: 2 },
  { id: 2, name: "B", priority: 1 },
  { id: 3, name: "C", priority: 2 },
];

// Thêm item MỚI:
const newItem = { id: 4, name: "D", priority: 2 };

// ═══ CÁCH 1: Thêm vào CUỐI rồi sort (ứng viên làm!) ═══
const sorted1 = [...items, newItem].sort((a, b) => a.priority - b.priority);
// Kết quả (stable sort!):
// B(1), A(2), C(2), D(2)  ← D ở CUỐI nhóm priority=2
// ↑ Ứng viên nghĩ đúng! Nhưng test case FAIL!

// ═══ CÁCH 2: Thêm vào ĐẦU rồi sort ═══
const sorted2 = [newItem, ...items].sort((a, b) => a.priority - b.priority);
// Kết quả (stable sort!):
// B(1), D(2), A(2), C(2)  ← D ở ĐẦU nhóm priority=2
// ↑ Test case PASS! ✅

// ═══ CÁCH 3: Explicit tie-breaking (AN TOÀN NHẤT!) ═══
const sorted3 = [...items, newItem].sort((a, b) => {
  if (a.priority !== b.priority) return a.priority - b.priority;
  return b.id - a.id; // ID lớn (mới) → ở TRƯỚC!
});
// B(1), D(2), A(2), C(2) ← ĐÚNG! ✅
// → KHÔNG phụ thuộc vào thứ tự insert!

// 💡 BÀI HỌC: LUÔN explicit tie-breaking!
// → ĐỪNG rely on stable sort behavior!
// → Viết comparator RÕ RÀNG cho mọi trường hợp!
```

```
SO SÁNH SORTING STRATEGIES:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────┬────────────────┬──────────────────┐
  │ Strategy            │ Pros           │ Cons              │
  ├─────────────────────┼────────────────┼──────────────────┤
  │ Append + sort       │ Đơn giản!      │ Rely on insert   │
  │                     │                │ position!         │
  ├─────────────────────┼────────────────┼──────────────────┤
  │ Prepend + sort      │ New items trước│ Ngược trực giác!  │
  ├─────────────────────┼────────────────┼──────────────────┤
  │ Explicit comparator │ CHÍNH XÁC!     │ Code dài hơn!    │
  │ (tie-breaking!)     │ Không ambiguity│ Nhưng AN TOÀN!   │
  ├─────────────────────┼────────────────┼──────────────────┤
  │ Binary insert       │ O(log N) tìm   │ O(N) shift!      │
  │ (sorted insert!)    │ đúng vị trí!  │ Phức tạp hơn!    │
  └─────────────────────┴────────────────┴──────────────────┘

  → KHUYẾN NGHỊ: LUÔN dùng explicit comparator!
```

---

## §8. CodeSignal React — Tips & Strategy

```
CODESIGNAL REACT ASSESSMENT — CHIẾN LƯỢC:
═══════════════════════════════════════════════════════════════

  ① TRƯỚC KHI BẮT ĐẦU:
  → Làm PRACTICE SESSION trên CodeSignal!
  → Quen giao diện, cách chạy tests, cách debug!
  → Biết limitations: KHÔNG thấy input data test cases!

  ② ĐỌC ĐỀ KỸ:
  → Highlight TẤT CẢ yêu cầu!
  → Tìm AMBIGUITY: "sorted by X" → tie-breaking?
  → Tìm EDGE CASES: empty, null, duplicate!
  → Hỏi: "Khi X giống nhau thì sao?" (trong đầu!)

  ③ CODE STRATEGY:
  → Viết solution CƠ BẢN trước → chạy tests!
  → Nếu FAIL: console.log KHẮP NƠI!
  → Log: input, output, expected (nếu có!)
  → Thử ĐẢO NGƯỢC assumptions khi stuck!

  ④ KHI BỊ STUCK (> 15 phút!):
  → DỪNG LẠI! Đọc lại đề!
  → Thử ngược: prepend thay append? ASC thay DESC?
  → Thử edge: empty string, 0, negative, null!
  → Thử stable sort assumption!

  ⑤ QUẢN LÝ THỜI GIAN:
  → Set timer CHO TỪNG CÂU!
  → Câu 1: MAX 20 phút!
  → Nếu > 25 phút: chấp nhận và thử heuristic!
  → Tốt hơn: giải 3/4 câu ĐÚNG > 2/4 câu!
```

```
DEBUG TRÊN CODESIGNAL:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: Không thấy input data cho test cases!
  → Console output từ failing test KHÔNG RÕ!

  CHIẾN LƯỢC:
  ┌────────────────────────────────────────────────────────┐
  │ ① LOG MỌI THỨ:                                        │
  │ → console.log('=== STATE ===', JSON.stringify(state))  │
  │ → console.log('=== SORTED ===', JSON.stringify(list))  │
  │ → console.log('=== PROPS ===', props)                  │
  │                                                        │
  │ ② LOG TRONG COMPARATOR:                                │
  │ → sort((a, b) => {                                     │
  │     console.log('CMP:', a, b, a.val - b.val);          │
  │     return a.val - b.val;                               │
  │ })                                                     │
  │                                                        │
  │ ③ LOG TRONG EVENT HANDLERS:                             │
  │ → onClick: log click event + args!                     │
  │ → onChange: log new value!                              │
  │                                                        │
  │ ④ SO SÁNH OUTPUT:                                       │
  │ → Log ACTUAL vs EXPECTED (nếu error message có!)       │
  │ → Tìm CHÍNH XÁC đâu là khác biệt!                    │
  └────────────────────────────────────────────────────────┘
```

---

## §9. Các bài React medium thường gặp

```
TOP REACT ASSESSMENT PATTERNS:
═══════════════════════════════════════════════════════════════

  ① TODO LIST CRUD:
  → Add / Delete / Toggle / Edit!
  → Filter: All / Active / Completed!
  → Counter: "3 items left"!
  → Clear completed button!

  ② SORTED/FILTERABLE TABLE:
  → Sort by column (ascending / descending!)
  → Search filter!
  → Pagination!
  → ⚠️ Edge: sort + filter CÙNG LÚC!

  ③ DYNAMIC FORM:
  → Render fields từ config!
  → Validation: required, min/max, regex!
  → Show errors on blur (touched!)
  → Disable submit khi invalid!

  ④ DATA FETCHING + DISPLAY:
  → Loading / Error / Empty states!
  → Pagination!
  → Race condition handling!
  → Retry on error!

  ⑤ SHOPPING CART:
  → Add to cart / Remove!
  → Update quantity!
  → Total price calculation!
  → ⚠️ Edge: floating-point (0.1 + 0.2!)

  ⑥ ACCORDION / TABS:
  → One panel open at a time!
  → HOẶC multiple panels!
  → Controlled vs Uncontrolled!

  ⑦ STAR RATING:
  → Click to rate!
  → Hover preview!
  → Half stars (bonus!)

  ⑧ AUTOCOMPLETE / TYPEAHEAD:
  → Debounce input!
  → Highlight matched text!
  → Keyboard navigation!
  → → Xem SearchBox-BinarySearch-Deep-Dive.md!
```

```jsx
// ═══ QUICK TEMPLATE — REACT ASSESSMENT ═══
// Dùng template này để bắt đầu nhanh!

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

function AssessmentComponent() {
  // ① STATE:
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortKey, setSortKey] = useState("name");

  // ② DERIVED STATE (useMemo!):
  const filtered = useMemo(() => {
    let result = [...items];
    if (filter !== "all") {
      result = result.filter(/* ... */);
    }
    result.sort((a, b) => {
      if (a[sortKey] === b[sortKey]) return b.id - a.id; // TIE-BREAK!
      return a[sortKey] < b[sortKey] ? -1 : 1;
    });
    return result;
  }, [items, filter, sortKey]);

  // ③ HANDLERS (useCallback!):
  const addItem = useCallback(() => {
    if (!input.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: input.trim(),
        /* fields */
      },
    ]);
    setInput("");
  }, [input]);

  const deleteItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateItem = useCallback((id, updates) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    );
  }, []);

  // ④ RENDER:
  return (
    <div>
      {/* Input */}
      {/* Filters */}
      {/* Sort controls */}
      {/* List */}
      {filtered.map((item) => (
        <div key={item.id}>{/* Item UI */}</div>
      ))}
      {filtered.length === 0 && <p>No items</p>}
    </div>
  );
}
```

---

## §10. Tóm tắt

```
TÓM TẮT — xAI ASSESSMENT:
═══════════════════════════════════════════════════════════════

  Q: "CodeSignal React format?"
  A: 4 câu medium, 1h30min, PHẢI pass ALL tests trước khi next!
  → Phân bổ: 15-20-25-25 phút + 5min buffer!

  Q: "Sorting ambiguity?"
  A: LUÔN explicit tie-breaking! Đừng rely stable sort!
  → Cùng sort value → sort tiếp theo ID/time/position!
  → Thử cả prepend và append khi stuck!

  Q: "Debug trên CodeSignal?"
  A: console.log KHẮP NƠI! Log state, comparator,
  event handlers! So sánh actual vs expected!

  Q: "Khi bị stuck?"
  A: 15 phút rule → dừng lại → đọc lại đề →
  đảo ngược assumptions → thử edge cases!

  Q: "Common patterns?"
  A: Todo CRUD, Sorted Table, Dynamic Form,
  Data Fetching, Shopping Cart, Accordion/Tabs!
```

---

### Checklist

- [ ] **Format**: 4 câu medium, 1h30min, PHẢI pass ALL tests câu hiện tại mới next; phân bổ 15-20-25-25!
- [ ] **Sorting trap**: Cùng sort value → element mới ở ĐẦU hay CUỐI? LUÔN explicit tie-breaking comparator!
- [ ] **Stable sort**: JS Array.sort() STABLE từ ES2019; nhưng ĐỪNG rely → viết comparator rõ ràng!
- [ ] **State patterns**: useState + useMemo (derived) + useCallback (handlers); immutable updates!
- [ ] **CRUD**: add (spread + new), delete (filter), update (map + spread), toggle (map + negate)!
- [ ] **Dynamic Form**: render từ config, validate on blur (touched), disable submit khi invalid!
- [ ] **Data Fetching**: loading/error/empty states, useEffect + AbortController, cleanup on unmount!
- [ ] **Custom Hooks**: useDebounce, useLocalStorage, usePrevious, useToggle — tách logic ra reusable!
- [ ] **Debug CodeSignal**: console.log state/comparator/handlers; đảo assumptions khi stuck!
- [ ] **Edge cases**: empty list, null/undefined, duplicates, case sensitivity, numeric vs string sort!
- [ ] **15-min rule**: stuck > 15 phút → dừng → đọc lại đề → thử ngược → thử edge cases!

---

_Nguồn: Reddit — xAI CodeSignal React assessment experience_
_Cập nhật lần cuối: Tháng 2, 2026_
