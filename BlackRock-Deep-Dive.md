# BlackRock Frontend Interview — Deep Dive

> 📅 2026-02-14 · ⏱ 18 phút đọc
>
> Async forEach + Fetch Anti-patterns,
> Proper Lifecycle & Error/Loading States,
> Autocomplete Component, React Q&A,
> Hooks, State Management, Performance (memo/useCallback/virtualization),
> Behavioral & Resume Deep Dive
> Độ khó: ⭐️⭐️⭐️ | BlackRock Frontend (3 rounds, ~1 tháng)

---

## Mục Lục

| #   | Phần                                       |
| --- | ------------------------------------------ |
| 1   | Tổng quan quy trình phỏng vấn              |
| 2   | Round 1: Messy forEach + Fetch — Phân tích |
| 3   | Round 1: Async Patterns — Fix & Improve    |
| 4   | Round 1: Error/Loading State & Lifecycle   |
| 5   | Round 2: Autocomplete Component            |
| 6   | Round 2: React Q&A — Hooks Deep Dive       |
| 7   | Round 2: Performance Optimizations         |
| 8   | Round 3: Behavioral & Resume Deep Dive     |
| 9   | Bài học rút ra từ BlackRock                |
| 10  | Tóm tắt phỏng vấn                          |

---

## §1. Tổng quan quy trình phỏng vấn

```
BLACKROCK — PROCESS OVERVIEW:
═══════════════════════════════════════════════════════════════

  Thời gian: ~1 THÁNG (3 rounds!)
  Độ khó: EASIER side — tập trung FUNDAMENTALS!
  Team: Frontend!

  ① ROUND 1 — CODE REVIEW / DEBUGGING:
  → "Here's a messy forEach + fetch snippet"
  → "What's the problem? How do you improve it?"
  → Topics: async patterns, lifecycle, error/loading states!

  ② ROUND 2 — REACT COMPONENT + Q&A:
  → Build AUTOCOMPLETE component!
  → React Q&A: hooks, state management, perf!
  → memo, useCallback, virtualization!

  ③ ROUND 3 — BEHAVIORAL + RESUME:
  → Manager round!
  → Resume deep dive!
  → Java framework experience!

  💡 BIGGEST TAKEAWAYS:
  ┌────────────────────────────────────────────────────────┐
  │ ① Fundamentals > Fancy extras!                        │
  │ ② Clean implementation > Bells & whistles!            │
  │ ③ Làm CORE đúng trước, optimize SAU!                 │
  │ ④ Đừng cố thêm debounce/caching nếu core chưa xong! │
  │ ⑤ Kết quả: top 2 ứng viên, thua vì ít kinh nghiệm! │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Round 1: Messy forEach + Fetch — Phân tích

```
BÀI TOÁN:
═══════════════════════════════════════════════════════════════

  Cho đoạn code "messy" dùng forEach + fetch!
  → Tìm VẤN ĐỀ!
  → FIX + IMPROVE!
```

```javascript
// ═══ MESSY CODE — CÁC LỖI PHỔ BIẾN ═══

// ❌ VẤN ĐỀ 1: forEach KHÔNG đợi async!
const ids = [1, 2, 3, 4, 5];

ids.forEach(async (id) => {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  console.log(data);
});
console.log("Done!"); // ← Chạy TRƯỚC tất cả fetch! ❌

// VẤN ĐỀ:
// → forEach KHÔNG return Promise!
// → forEach KHÔNG đợi async callback!
// → "Done!" in ra TRƯỚC khi data trả về!
// → Không thể await forEach!
// → Fire-and-forget — MẤT KIỂM SOÁT!
```

```javascript
// ❌ VẤN ĐỀ 2: Không handle errors!
ids.forEach(async (id) => {
  const response = await fetch(`/api/users/${id}`);
  // → Nếu 404? 500? Network error?
  // → response.ok KHÔNG được check!
  const data = await response.json();
  // → Nếu response KHÔNG PHẢI JSON?
  // → data.json() throw!
  updateUI(data);
  // → Nếu API fail giữa chừng?
  // → UI hiển thị DATA KHÔNG ĐẦY ĐỦ!
});
```

```javascript
// ❌ VẤN ĐỀ 3: Race conditions!
ids.forEach(async (id) => {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  // Thứ tự response KHÔNG ĐẢM BẢO!
  // id=5 có thể trả về TRƯỚC id=1!
  results.push(data); // ← Thứ tự sai!
});
```

```javascript
// ❌ VẤN ĐỀ 4: Trong React component — memory leak!
function UserList({ ids }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    ids.forEach(async (id) => {
      const res = await fetch(`/api/users/${id}`);
      const data = await res.json();
      setUsers((prev) => [...prev, data]);
      // ← Nếu component unmount TRƯỚC khi fetch xong?
      // ← setState trên unmounted component!
      // ← MEMORY LEAK + React warning!
    });
  }, [ids]);
}
```

```
TÓM TẮT VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  ┌────┬──────────────────────────────────────────────────┐
  │ #  │ Vấn đề                                          │
  ├────┼──────────────────────────────────────────────────┤
  │ 1  │ forEach KHÔNG đợi async! Fire-and-forget!       │
  │ 2  │ Không check response.ok!                         │
  │ 3  │ Không try/catch errors!                          │
  │ 4  │ Race condition — thứ tự không đảm bảo!          │
  │ 5  │ Memory leak — setState sau unmount!              │
  │ 6  │ Không có loading/error states!                   │
  │ 7  │ Không có cleanup (AbortController!)              │
  └────┴──────────────────────────────────────────────────┘
```

---

## §3. Round 1: Async Patterns — Fix & Improve

```javascript
// ═══ FIX 1: Promise.all (PARALLEL — nhanh nhất!) ═══

async function fetchAllUsers(ids) {
  try {
    const promises = ids.map(async (id) => {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for user ${id}`);
      }
      return response.json();
    });

    const users = await Promise.all(promises);
    // ✅ Tất cả fetch SONG SONG!
    // ✅ Thứ tự KẾT QUẢ = thứ tự INPUT!
    // ✅ Nếu 1 fail → TẤT CẢ fail!
    return users;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
}
```

```javascript
// ═══ FIX 2: Promise.allSettled (TOLERANT — partial success!) ═══

async function fetchAllUsersSafe(ids) {
  const promises = ids.map(async (id) => {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });

  const results = await Promise.allSettled(promises);
  // ✅ KHÔNG throw nếu 1 fail!
  // ✅ Mỗi result: { status: 'fulfilled', value } hoặc { status: 'rejected', reason }!

  const users = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  const errors = results
    .filter((r) => r.status === "rejected")
    .map((r, i) => ({ id: ids[i], error: r.reason }));

  if (errors.length > 0) {
    console.warn("Some users failed to load:", errors);
  }

  return users;
}
```

```javascript
// ═══ FIX 3: for...of (SEQUENTIAL — từng cái một!) ═══

async function fetchUsersSequential(ids) {
  const users = [];

  for (const id of ids) {
    try {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      users.push(data);
    } catch (error) {
      console.error(`Failed for user ${id}:`, error);
      // Tiếp tục fetch user tiếp theo!
    }
  }

  return users;
}

// ✅ Thứ tự CHÍNH XÁC!
// ❌ CHẬM: fetch lần lượt, không song song!
// → Dùng khi: rate limiting, API không chịu được nhiều requests!
```

```
SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬────────────┬───────────┬────────────┐
  │ Method           │ Parallel?  │ Thứ tự?   │ Partial?   │
  ├──────────────────┼────────────┼───────────┼────────────┤
  │ forEach + async  │ ✅ (nhưng  │ ❌ Không  │ ❌ Không   │
  │                  │ mất control)│ đảm bảo! │ handle!    │
  │ Promise.all      │ ✅ Song    │ ✅ Đúng!  │ ❌ All or  │
  │                  │ song!      │           │ nothing!   │
  │ Promise.allSettled│ ✅ Song   │ ✅ Đúng!  │ ✅ Partial │
  │                  │ song!      │           │ success!   │
  │ for...of         │ ❌ Tuần   │ ✅ Đúng!  │ ✅ Continue│
  │                  │ tự!        │           │ on error!  │
  │ for await...of   │ ❌ Tuần   │ ✅ Đúng!  │ ✅ Stream! │
  │                  │ tự!        │           │            │
  └──────────────────┴────────────┴───────────┴────────────┘
```

---

## §4. Round 1: Error/Loading State & Lifecycle

```jsx
// ═══ REACT — PROPER LIFECYCLE + ERROR/LOADING ═══

import { useState, useEffect } from "react";

function UserList({ ids }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ① AbortController cho cleanup!
    const controller = new AbortController();
    let isMounted = true; // Double safety!

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const promises = ids.map(async (id) => {
          const res = await fetch(`/api/users/${id}`, {
            signal: controller.signal, // ← ABORT support!
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        });

        const data = await Promise.all(promises);

        // ② Check mounted TRƯỚC setState!
        if (isMounted) {
          setUsers(data);
        }
      } catch (err) {
        if (err.name !== "AbortError" && isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    // ③ CLEANUP!
    return () => {
      isMounted = false;
      controller.abort(); // Cancel pending requests!
    };
  }, [ids]); // ← Re-fetch khi ids thay đổi!

  // ④ CONDITIONAL RENDERING:
  if (loading) return <div role="status">Loading users...</div>;
  if (error) return <div role="alert">Error: {error}</div>;
  if (users.length === 0) return <div>No users found.</div>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

```
CHECKLIST — PROPER DATA FETCHING:
═══════════════════════════════════════════════════════════════

  ✅ AbortController → cancel fetch khi unmount!
  ✅ isMounted check → tránh setState sau unmount!
  ✅ response.ok check → handle HTTP errors!
  ✅ try/catch → handle network errors!
  ✅ Loading state → UI feedback!
  ✅ Error state → error message!
  ✅ Empty state → "no data" message!
  ✅ Dependency array [ids] → re-fetch khi input thay đổi!
  ✅ Cleanup trong return → prevent memory leak!
```

---

## §5. Round 2: Autocomplete Component

```
AUTOCOMPLETE — YÊU CẦU:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────┐
  │ 🔍 [Type to search...        ]      │
  │ ┌────────────────────────────────┐   │
  │ │ ✦ Apple                       │   │
  │ │ ✦ Apricot                     │   │
  │ │ ✦ Application                 │   │
  │ └────────────────────────────────┘   │
  └──────────────────────────────────────┘

  CORE REQUIREMENTS:
  → Input field!
  → Dropdown suggestions!
  → Filter on keystroke!
  → Select suggestion → fill input!
  → Close dropdown khi click outside!

  💡 BLACKROCK MUỐN:
  → CORE đúng trước!
  → KHÔNG CẦN debounce/caching ban đầu!
  → Clean, readable, functional!
```

```jsx
// ═══ AUTOCOMPLETE — CLEAN CORE IMPLEMENTATION ═══

import { useState, useRef, useEffect, useMemo } from "react";

function Autocomplete({ suggestions, placeholder = "Type to search..." }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // FILTER suggestions:
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(q));
  }, [query, suggestions]);

  // CLOSE on click outside:
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // INPUT CHANGE:
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.trim().length > 0);
    setActiveIndex(-1);
  };

  // SELECT suggestion:
  const handleSelect = (suggestion) => {
    setQuery(suggestion);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // KEYBOARD navigation:
  const handleKeyDown = (e) => {
    if (!isOpen || filtered.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0) {
          handleSelect(filtered[activeIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="autocomplete">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query.trim() && setIsOpen(true)}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `option-${activeIndex}` : undefined
        }
      />

      {isOpen && filtered.length > 0 && (
        <ul className="suggestions" role="listbox">
          {filtered.map((suggestion, index) => (
            <li
              key={suggestion}
              id={`option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? "active" : ""}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {highlightMatch(suggestion, query)}
            </li>
          ))}
        </ul>
      )}

      {isOpen && filtered.length === 0 && query.trim() && (
        <div className="no-results">No results found</div>
      )}
    </div>
  );
}

// HIGHLIGHT matching text:
function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;

  return (
    <>
      {text.slice(0, idx)}
      <strong>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}
```

```css
/* ═══ AUTOCOMPLETE CSS ═══ */

.autocomplete {
  position: relative;
  width: 320px;
}

.autocomplete input {
  width: 100%;
  padding: 10px 14px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}

.autocomplete input:focus {
  border-color: #4285f4;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
}

.suggestions li {
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.1s;
}

.suggestions li:hover,
.suggestions li.active {
  background: #e8f0fe;
}

.suggestions li strong {
  color: #4285f4;
  font-weight: 700;
}

.no-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 10px 14px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #888;
  margin-top: 4px;
}
```

```
AUTOCOMPLETE — EXTRAS (CHỈ NÊU NẾU ĐƯỢC HỎI!):
═══════════════════════════════════════════════════════════════

  BlackRock muốn CORE trước! ĐỪNG tự thêm!
  Chỉ nêu nếu interviewer HỎI follow-up!

  ① DEBOUNCE:
  → Delay filter 300ms sau khi user ngừng gõ!
  → Giảm số lần filter/API call!

  ② CACHING:
  → Cache kết quả filter/API → Map<query, results>!
  → Tránh fetch lại cùng query!

  ③ API-BASED (thay vì static list):
  → fetch(`/api/search?q=${query}`)!
  → Cần debounce + AbortController!

  ④ VIRTUALIZATION:
  → 10,000 suggestions → react-window!
  → Chỉ render VISIBLE items!

  💡 BÀI HỌC:
  → "I tried to add bells & whistles like debounce/caching
     but they really just wanted the core done well."
  → → LÀM CORE TRƯỚC, optimize SAU khi được HỎI!
```

---

## §6. Round 2: React Q&A — Hooks Deep Dive

```
REACT Q&A — CÂU HỎI THƯỜNG GẶP:
═══════════════════════════════════════════════════════════════

  Q1: "useState vs useRef?"
  ┌────────────────────┬──────────────────────────────────┐
  │ useState           │ useRef                           │
  ├────────────────────┼──────────────────────────────────┤
  │ Trigger re-render! │ KHÔNG re-render!                 │
  │ Async update!      │ Sync update!                     │
  │ Immutable!         │ Mutable (.current!)              │
  │ UI-related data!   │ DOM refs, timers, prev values!   │
  └────────────────────┴──────────────────────────────────┘

  Q2: "useEffect dependency array?"
  → []: chạy 1 lần (mount!)
  → [a, b]: chạy khi a HOẶC b thay đổi!
  → Không có []: chạy MỖI render!
  → Cleanup function: chạy trước effect tiếp theo + unmount!

  Q3: "useEffect vs useLayoutEffect?"
  → useEffect: chạy SAU paint (async!)
  → useLayoutEffect: chạy TRƯỚC paint (sync, blocking!)
  → Dùng useLayoutEffect khi: đo DOM, prevent flash!

  Q4: "Custom hooks?"
  → Extract logic REUSABLE ra khỏi component!
  → Phải bắt đầu bằng "use"!
  → Có thể gọi hooks khác bên trong!
  → VD: useDebounce, useFetch, useLocalStorage!
```

```
  Q5: "Controlled vs Uncontrolled components?"
  ┌────────────────────┬──────────────────────────────────┐
  │ Controlled         │ Uncontrolled                     │
  ├────────────────────┼──────────────────────────────────┤
  │ React quản lý      │ DOM tự quản lý value!            │
  │ value + onChange!   │ ref.current.value!               │
  │ ✅ Predictable!    │ ✅ Đơn giản!                     │
  │ ✅ Validate dễ!    │ ❌ Khó validate real-time!       │
  │ Re-render mỗi key! │ Không re-render!                 │
  └────────────────────┴──────────────────────────────────┘

  Q6: "State management options?"
  → useState/useReducer: component-level!
  → Context API: share state qua tree (nhỏ!)
  → Redux/Zustand: global state (lớn!)
  → React Query/SWR: server state (fetch/cache!)
  → Jotai/Recoil: atomic state!

  Q7: "Lifting state up vs Context?"
  → Lift up: gần nhau, ít component!
  → Context: xa nhau, prop drilling > 2-3 levels!
  → Redux: complex state logic, many consumers!

  Q8: "Why keys are important?"
  → React dùng keys để IDENTIFY elements trong list!
  → Stable key → preserve state + minimize DOM changes!
  → Index as key: ❌ nếu list có reorder/insert/delete!
  → Unique ID as key: ✅ LUÔN LUÔN!
```

---

## §7. Round 2: Performance Optimizations

```
PERFORMANCE — CÂU HỎI THƯỜNG GẶP:
═══════════════════════════════════════════════════════════════

  Q: "React.memo là gì?"
  A: HOC bọc component → skip re-render nếu props KHÔNG ĐỔI!
  → Shallow comparison by default!
  → Custom comparator: React.memo(Comp, (prev, next) => ...)!
```

```jsx
// ═══ React.memo ═══

// ❌ KHÔNG memo: re-render MỖI LẦN parent render!
function UserCard({ name, email }) {
  console.log("UserCard render!"); // Gọi mỗi lần!
  return (
    <div>
      {name} — {email}
    </div>
  );
}

// ✅ CÓ memo: skip nếu name + email KHÔNG ĐỔI!
const UserCard = React.memo(function UserCard({ name, email }) {
  console.log("UserCard render!"); // Chỉ khi props đổi!
  return (
    <div>
      {name} — {email}
    </div>
  );
});

// ⚠️ KHI NÀO DÙNG:
// → Component render TĨNH (same props → same output!)
// → Parent re-render THƯỜNG XUYÊN!
// → Component render TỐN (complex calculations!)

// ⚠️ KHI NÀO KHÔNG DÙNG:
// → Props thay đổi THƯỜNG XUYÊN → memo vô ích!
// → Component render NHANH → overhead không đáng!
```

```jsx
// ═══ useCallback ═══

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ Tạo function MỚI mỗi render → Child re-render!
  const handleClick = () => console.log("clicked");

  // ✅ Giữ NGUYÊN reference → Child KHÔNG re-render!
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []); // Dependency array!

  return <Child onClick={handleClick} />;
}

const Child = React.memo(({ onClick }) => {
  console.log("Child render!");
  return <button onClick={onClick}>Click</button>;
});

// ⚠️ useCallback CHỈ CÓ ÍCH khi:
// → Child dùng React.memo!
// → Hoặc function là dependency của useEffect!
// → Nếu Child KHÔNG memo → useCallback VÔ ÍCH!
```

```jsx
// ═══ useMemo ═══

function FilteredList({ items, query }) {
  // ❌ Filter LẠI mỗi render!
  const filtered = items.filter((i) => i.name.includes(query));

  // ✅ Cache kết quả → chỉ tính khi items/query ĐỔI!
  const filtered = useMemo(() => {
    return items.filter((i) => i.name.includes(query));
  }, [items, query]);

  return filtered.map((i) => <div key={i.id}>{i.name}</div>);
}

// ⚠️ useMemo CHỈ CÓ ÍCH khi:
// → Calculation TỐN (sort, filter 10K items!)
// → Tạo object/array dùng trong dependency!
// → Tránh child re-render (object props!)
```

```
VIRTUALIZATION:
═══════════════════════════════════════════════════════════════

  Q: "10,000 items trong list — tối ưu thế nào?"
  A: VIRTUALIZATION (windowing!)

  → CHỈ RENDER items ĐANG HIỂN THỊ!
  → 10,000 items → chỉ ~20 DOM nodes!
  → Libraries: react-window, react-virtuoso, @tanstack/virtual!

  CÁCH HOẠT ĐỘNG:
  ┌──────────────────────────────────┐
  │ Spacer top (height: N × itemH)   │
  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
  │ Item 50  ← VISIBLE              │
  │ Item 51                          │
  │ Item 52                          │
  │ Item 53                          │
  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
  │ Spacer bottom                    │
  └──────────────────────────────────┘

  → scrollTop / itemHeight = startIndex!
  → startIndex + visibleCount = endIndex!
  → Render items[startIndex..endIndex]!
```

---

## §8. Round 3: Behavioral & Resume Deep Dive

```
BEHAVIORAL — FRAMEWORK:
═══════════════════════════════════════════════════════════════

  STAR METHOD:
  S — SITUATION: bối cảnh, vấn đề!
  T — TASK: nhiệm vụ CỤ THỂ của bạn!
  A — ACTION: bạn ĐÃ LÀM gì?
  R — RESULT: kết quả, metric, impact!

  CÂU HỎI PHỔ BIẾN:
  ┌────────────────────────────────────────────────────────┐
  │ ① "Tell me about yourself"                            │
  │ → 2 phút! Education → Experience → Why this role!    │
  │                                                        │
  │ ② "Tell me about a challenging project"               │
  │ → STAR: complex feature, technical decisions,         │
  │   obstacles, results!                                  │
  │                                                        │
  │ ③ "How do you handle disagreements?"                  │
  │ → Listen first → Document tradeoffs →                 │
  │   Data-driven decision → Commit once decided!         │
  │                                                        │
  │ ④ "Why BlackRock?"                                    │
  │ → Mission: technology + finance intersection!         │
  │ → Scale: Aladdin platform, global impact!             │
  │ → Growth: learn financial domain!                     │
  │                                                        │
  │ ⑤ "Java framework experience?"                       │
  │ → BlackRock dùng Java backend (Aladdin!)              │
  │ → Spring Boot, microservices!                         │
  │ → HONEST: nếu không có, nói học nhanh!               │
  └────────────────────────────────────────────────────────┘
```

```
RESUME DEEP DIVE — CHUẨN BỊ:
═══════════════════════════════════════════════════════════════

  CHO MỖI DỰ ÁN TRÊN RESUME:
  → Bạn làm gì? Vai trò cụ thể?
  → Tech stack? Tại sao chọn?
  → Thử thách lớn nhất? Giải quyết thế nào?
  → Kết quả? Metrics?
  → Bạn sẽ làm GÌ KHÁC nếu làm lại?

  KHI TRẢ LỜI:
  → Tập trung vào CONTRIBUTION CÁ NHÂN!
  → Nêu TRADEOFFS trong decisions!
  → Metrics: "giảm 40% load time", "serve 1M users"!
  → KHÔNG nói chung chung: "tôi làm frontend"!
  → NÊN cụ thể: "tôi refactor state management
    từ Redux sang Zustand, giảm boilerplate 60%"!

  ⚠️ BLACKROCK SPECIFIC:
  → Finance industry: compliance, security, data accuracy!
  → Aladdin platform: massive scale!
  → Team-oriented: collaboration, cross-functional!
  → Java backend: nếu có experience thì NÊU!
```

---

## §9. Bài học rút ra từ BlackRock

```
KEY LESSONS:
═══════════════════════════════════════════════════════════════

  ① FUNDAMENTALS > FANCY:
  → BlackRock coi trọng KIẾN THỨC NỀN TẢNG!
  → Hiểu SÂU async/await, Promise, lifecycle!
  → Đừng cố thêm extras nếu core chưa HOÀN HẢO!

  ② CLEAN CODE > COMPLEX CODE:
  → Readable, maintainable!
  → Proper error handling!
  → Đúng patterns (không anti-patterns!)

  ③ LÀM CORE TRƯỚC, EXTRAS SAU:
  → Autocomplete core: input + filter + select + close!
  → KHÔNG tự thêm debounce/caching/virtualization!
  → CHỈ khi interviewer HỎI mới implement!

  ④ BIẾT GIỚI HẠN:
  → Kết quả: top 2 nhưng thua vì ít kinh nghiệm!
  → Kinh nghiệm TRỰC TIẾP rất quan trọng!
  → Nhưng vào top 2 với clean fundamentals = TỐT!

  ⑤ JAVA BACKEND:
  → BlackRock cần frontend + backend awareness!
  → Biết Spring Boot, microservices = ĐIỂM CỘNG!
  → Ứng viên full-stack có lợi thế!

  ANTI-PATTERNS KHI PHỎNG VẤN:
  ┌────────────────────────────────────────────────────────┐
  │ ❌ Thêm tính năng chưa được yêu cầu!                 │
  │ ❌ Code nhanh nhưng bỏ qua error handling!            │
  │ ❌ forEach + async (fire-and-forget!)                  │
  │ ❌ Không check response.ok!                           │
  │ ❌ Không cleanup trong useEffect!                     │
  │ ❌ Index as key trong dynamic list!                   │
  └────────────────────────────────────────────────────────┘
```

---

## §10. Tóm tắt phỏng vấn

```
PHỎNG VẤN — TRẢ LỜI:
═══════════════════════════════════════════════════════════════

  Q: "forEach + async?"
  A: forEach KHÔNG đợi async! Fire-and-forget!
  Fix: Promise.all (parallel!), for...of (sequential!),
  Promise.allSettled (partial success!).
  + response.ok check + try/catch + AbortController!

  Q: "Autocomplete?"
  A: Input + useMemo filter + dropdown + keyboard nav.
  Click outside close. Highlight matching text.
  CORE TRƯỚC! debounce/cache/virtual CHỈ KHI HỎI!

  Q: "React.memo?"
  A: Skip re-render khi props KHÔNG ĐỔI (shallow compare!).
  Dùng khi: parent re-render thường xuyên + child render tốn!

  Q: "useCallback?"
  A: Cache function reference → stable prop cho memo'd child.
  CHỈ CÓ ÍCH khi child dùng React.memo hoặc trong deps!

  Q: "Virtualization?"
  A: Chỉ render VISIBLE items. react-window / react-virtuoso.
  10K items → ~20 DOM nodes. scrollTop / itemHeight = startIndex!
```

---

### Checklist

- [ ] **forEach + async**: fire-and-forget! Dùng Promise.all / allSettled / for...of thay thế!
- [ ] **Error handling**: response.ok check + try/catch + AbortController cleanup!
- [ ] **Loading/Error states**: loading → spinner, error → message, empty → "no data"!
- [ ] **Lifecycle**: useEffect + cleanup return + isMounted check + AbortController!
- [ ] **Autocomplete core**: input + useMemo filter + dropdown + keyboard nav + click outside close!
- [ ] **BlackRock lesson**: CORE trước! Đừng tự thêm debounce/caching nếu chưa được hỏi!
- [ ] **React.memo**: skip re-render khi props không đổi; CHỈ dùng khi parent render thường xuyên!
- [ ] **useCallback**: cache function ref; CHỈ có ích khi child dùng React.memo!
- [ ] **useMemo**: cache computed value; CHỈ dùng khi calculation tốn hoặc tạo reference!
- [ ] **Virtualization**: chỉ render visible items; react-window; 10K → ~20 DOM nodes!
- [ ] **Behavioral**: STAR method; chuẩn bị MỖI project trên resume; metrics cụ thể!
- [ ] **BlackRock specific**: finance domain, Aladdin platform, Java backend awareness!

---

_Nguồn: Reddit — BlackRock frontend interview experience_
_Cập nhật lần cuối: Tháng 2, 2026_
