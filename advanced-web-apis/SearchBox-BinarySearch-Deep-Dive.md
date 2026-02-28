# Real-time Search Box & Binary Search — Deep Dive

> 📅 2026-02-14 · ⏱ 16 phút đọc
>
> React Real-time SearchBox, Race Condition Handling,
> Debounce, AbortController, Custom Hook,
> Binary Search — Find Last Occurrence,
> O(N) vs O(log N) Analysis
> Độ khó: ⭐️⭐️⭐️⭐️ | Frontend Coding Interview

---

## Mục Lục

| #   | Phần                                            |
| --- | ----------------------------------------------- |
| 1   | Real-time Search Box — Yêu cầu & Phân tích      |
| 2   | Race Condition — Xử lý điều kiện cạnh tranh     |
| 3   | Implement cơ bản (Lock Counter)                 |
| 4   | Implement nâng cao (Debounce + AbortController) |
| 5   | Custom Hook: useSearch                          |
| 6   | Production-Ready SearchBox                      |
| 7   | Find Last Occurrence — O(N) Linear              |
| 8   | Find Last Occurrence — O(log N) Binary Search   |
| 9   | Binary Search Deep Dive                         |
| 10  | Tóm tắt phỏng vấn                               |

---

## §1. Real-time Search Box — Yêu cầu & Phân tích

```
REAL-TIME SEARCH BOX — YÊU CẦU:
═══════════════════════════════════════════════════════════════

  User gõ → GỌI API tìm kiếm → HIỂN THỊ kết quả ngay!
  (AutoComplete / Typeahead / Suggestion Box)

  CÁC VẤN ĐỀ CẦN XỬ LÝ:
  ┌────────────────────────────────────────────────────────┐
  │ ① RACE CONDITION (điều kiện cạnh tranh!):              │
  │ → User gõ "a" → request 1 (chậm 500ms!)               │
  │ → User gõ "ab" → request 2 (nhanh 100ms!)             │
  │ → Request 2 trả VỀ TRƯỚC → hiển thị "ab" results!    │
  │ → Request 1 trả về SAU → GHI ĐÈ! Hiển thị "a" results│
  │ → ❌ WRONG! Phải hiển thị KẾT QUẢ CỦA "ab"!         │
  ├────────────────────────────────────────────────────────┤
  │ ② DEBOUNCE (chống gọi API quá nhiều!):                 │
  │ → User gõ "hello" = 5 keystrokes → 5 API calls!       │
  │ → Lãng phí! Chỉ cần gọi SAU KHI user NGỪNG gõ!       │
  ├────────────────────────────────────────────────────────┤
  │ ③ LOADING STATE:                                       │
  │ → Hiển thị loading indicator!                          │
  ├────────────────────────────────────────────────────────┤
  │ ④ ERROR HANDLING:                                      │
  │ → API fail → hiển thị thông báo lỗi!                   │
  ├────────────────────────────────────────────────────────┤
  │ ⑤ EMPTY STATE:                                         │
  │ → Không có kết quả → "Không tìm thấy"!                │
  ├────────────────────────────────────────────────────────┤
  │ ⑥ KEYBOARD NAVIGATION:                                 │
  │ → Arrow keys để chọn, Enter để confirm!                │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Race Condition — Xử lý điều kiện cạnh tranh

```
RACE CONDITION — 3 CÁCH XỬ LÝ:
═══════════════════════════════════════════════════════════════

  ① LOCK COUNTER (bài phỏng vấn dùng cách này!):
  → Tăng counter mỗi lần gọi API!
  → Khi response trả về: so sánh counter!
  → Nếu counter ĐÃ THAY ĐỔI → IGNORE response!

  ② AbortController (HỦY request cũ!):
  → Trước khi gọi API mới → ABORT request cũ!
  → Request cũ bị HỦY hoàn toàn!
  → Tiết kiệm tài nguyên network!

  ③ DEBOUNCE + AbortController (TỐT NHẤT!):
  → Debounce: CHỜ user ngừng gõ → rồi mới gọi!
  → AbortController: hủy request cũ nếu còn pending!
  → → Kết hợp = GIẢM requests + KHÔNG race condition!
```

```
TIMELINE — RACE CONDITION VÍ DỤ:
═══════════════════════════════════════════════════════════════

  Thời gian →

  User gõ "a"  ────→ Request 1 sent ──── ... ─── Response 1 (500ms)
  User gõ "ab" ────→ Request 2 sent ─── Response 2 (100ms)

  KHÔNG CÓ xử lý:
  t=0ms:   gõ "a"  → req1 sent (lock=1)
  t=50ms:  gõ "ab" → req2 sent (lock=2)
  t=150ms: req2 trả về → setList("ab" results) ✅
  t=500ms: req1 trả về → setList("a" results)  ❌ GHI ĐÈ!

  CÓ LOCK COUNTER:
  t=0ms:   gõ "a"  → req1 sent, temp=1, lock=1
  t=50ms:  gõ "ab" → req2 sent, temp=2, lock=2
  t=150ms: req2: lock(2) === temp(2) → setList ✅
  t=500ms: req1: lock(2) !== temp(1) → IGNORE! ✅
```

---

## §3. Implement cơ bản (Lock Counter)

```jsx
// ═══ PHIÊN BẢN TỪ BÀI PHỎNG VẤN (có sửa bug!) ═══

const SearchBox = ({ onChange }) => {
  const lockRef = useRef(0);
  const [searchList, setSearchList] = useState([]);

  const onInput = async (e) => {
    // Tăng lock counter:
    lockRef.current += 1;
    const temp = lockRef.current; // Lưu giá trị TẠI THỜI ĐIỂM NÀY!

    try {
      const res = await fetch(`/api/search?q=${e.target.value}`);
      // ↑ Sửa: fetch cần URL string, không phải 2 arguments!

      // XỬ LÝ RACE CONDITION:
      // Nếu lock ĐÃ TĂNG (user gõ thêm!) → IGNORE!
      if (lockRef.current !== temp) return;

      const data = await res.json();
      // ↑ Sửa: res.json() là async, cần await!
      setSearchList(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="search-wrapper">
      <input type="text" onInput={onInput} />
      <ul className="complete-list">
        {searchList.map((item) => (
          <li key={item.value} onClick={() => onChange(item)}>
            {/* ↑ Sửa: onClick cần ARROW FUNCTION! */}
            {/* onClick={onChange(item)} sẽ GỌI NGAY! */}
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

```
⚠️ BUGS TRONG CODE GỐC (3 LỖI!):
═══════════════════════════════════════════════════════════════

  ① fetch("/api/search", e.target.value)
  → WRONG! fetch nhận (url, options), không phải (url, body)!
  → FIX: fetch(`/api/search?q=${e.target.value}`)

  ② setSearchList(res.json())
  → WRONG! res.json() trả về PROMISE, không phải data!
  → FIX: const data = await res.json(); setSearchList(data);

  ③ onClick={onChange(item)}
  → WRONG! Gọi onChange NGAY khi render! (invocation!)
  → FIX: onClick={() => onChange(item)} (arrow function!)
```

---

## §4. Implement nâng cao (Debounce + AbortController)

```jsx
// ═══ PHIÊN BẢN NÂNG CAO — DEBOUNCE + ABORT ═══

import { useState, useRef, useCallback } from "react";

const SearchBox = ({ onChange }) => {
  const [searchList, setSearchList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null); // AbortController!
  const timerRef = useRef(null); // Debounce timer!

  const handleInput = useCallback((e) => {
    const query = e.target.value.trim();

    // Clear debounce timer cũ:
    if (timerRef.current) clearTimeout(timerRef.current);

    // Empty query → clear results:
    if (!query) {
      setSearchList([]);
      return;
    }

    // DEBOUNCE: chờ 300ms sau khi user NGỪNG gõ!
    timerRef.current = setTimeout(async () => {
      // HỦY request cũ (nếu còn pending!):
      if (abortRef.current) {
        abortRef.current.abort();
      }

      // Tạo AbortController MỚI:
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }, // Gắn signal!
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setSearchList(data);
      } catch (err) {
        // AbortError = bị hủy chủ ý → IGNORE!
        if (err.name === "AbortError") return;
        setError(err.message);
        setSearchList([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce!
  }, []);

  return (
    <div className="search-wrapper">
      <input type="text" placeholder="Tìm kiếm..." onInput={handleInput} />

      {loading && <div className="loading">Đang tìm...</div>}
      {error && <div className="error">{error}</div>}

      {searchList.length > 0 && (
        <ul className="complete-list">
          {searchList.map((item) => (
            <li key={item.value} onClick={() => onChange(item)}>
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && searchList.length === 0 && (
        <div className="empty">Không có kết quả</div>
      )}
    </div>
  );
};
```

```
SO SÁNH 3 PHIÊN BẢN:
═══════════════════════════════════════════════════════════════

  ┌───────────────┬──────────────┬──────────────┬────────────┐
  │               │ Lock Counter │ AbortCtrl    │ Debounce + │
  │               │              │ only         │ AbortCtrl  │
  ├───────────────┼──────────────┼──────────────┼────────────┤
  │ Race condition│ ✅ Xử lý    │ ✅ Xử lý    │ ✅ Xử lý  │
  ├───────────────┼──────────────┼──────────────┼────────────┤
  │ Giảm requests │ ❌ Vẫn gọi  │ ❌ Vẫn gọi  │ ✅ Debounce│
  │               │ MỌI keystroke│ MỌI keystroke│ chờ ngừng! │
  ├───────────────┼──────────────┼──────────────┼────────────┤
  │ Hủy request   │ ❌ Vẫn chạy │ ✅ Abort!    │ ✅ Abort!  │
  │ cũ            │ trên network │ Tiết kiệm!  │ Tiết kiệm! │
  ├───────────────┼──────────────┼──────────────┼────────────┤
  │ Độ phức tạp   │ Thấp!       │ Trung bình   │ Cao!       │
  └───────────────┴──────────────┴──────────────┴────────────┘
```

---

## §5. Custom Hook: useSearch

```jsx
// ═══ CUSTOM HOOK — TÁCH LOGIC RA KHỎI UI ═══

function useSearch(searchFn, delay = 300) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Debounce:
    const timer = setTimeout(async () => {
      // Abort previous:
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const data = await searchFn(query, controller.signal);
        if (!controller.signal.aborted) {
          setResults(data);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, delay);

    // CLEANUP: hủy timer khi query thay đổi!
    return () => clearTimeout(timer);
  }, [query, searchFn, delay]);

  // Cleanup on unmount:
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { query, setQuery, results, loading, error };
}

// ═══ SỬ DỤNG ═══

const searchAPI = async (q, signal) => {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal });
  return res.json();
};

const SearchBox = ({ onChange }) => {
  const { query, setQuery, results, loading, error } = useSearch(searchAPI);

  return (
    <div className="search-wrapper">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm kiếm..."
      />
      {loading && <p>Đang tìm...</p>}
      {error && <p className="error">{error}</p>}
      <ul>
        {results.map((item) => (
          <li key={item.value} onClick={() => onChange(item)}>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

// → Logic TÁCH BIỆT → dễ test, reuse!
// → UI component SẠCH SẼ, chỉ lo render!
```

---

## §6. Production-Ready SearchBox

```jsx
// ═══ PRODUCTION — KEYBOARD NAVIGATION + HIGHLIGHT ═══

const SearchBox = ({ onChange, placeholder = "Tìm kiếm..." }) => {
  const { query, setQuery, results, loading } = useSearch(searchAPI);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef(null);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        if (activeIndex >= 0 && results[activeIndex]) {
          onChange(results[activeIndex]);
          setQuery("");
        }
        break;
      case "Escape":
        setQuery("");
        setActiveIndex(-1);
        break;
    }
  };

  // Highlight matched text:
  const highlight = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part,
    );
  };

  return (
    <div className="search-wrapper">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-activedescendant={
          activeIndex >= 0 ? `option-${activeIndex}` : undefined
        }
      />
      {loading && <div className="spinner" />}
      {results.length > 0 && (
        <ul ref={listRef} role="listbox">
          {results.map((item, index) => (
            <li
              key={item.value}
              id={`option-${index}`}
              role="option"
              className={index === activeIndex ? "active" : ""}
              onClick={() => onChange(item)}
              aria-selected={index === activeIndex}
            >
              {highlight(item.label, query)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// PRODUCTION FEATURES:
// ✅ Debounce (300ms)
// ✅ Race condition (AbortController)
// ✅ Keyboard navigation (↑↓ Enter Esc)
// ✅ Text highlight (mark matched text)
// ✅ Accessibility (ARIA: combobox, listbox, option)
// ✅ Loading state
// ✅ Error handling
// ✅ Custom hook (separation of concerns)
```

---

## §7. Find Last Occurrence — O(N) Linear

```
BÀI TOÁN:
═══════════════════════════════════════════════════════════════

  Mảng ĐÃ SẮP XẾP! Tìm vị trí CUỐI CÙNG của target!

  INPUT:  nums = [5, 7, 7, 8, 8, 10], target = 8
  OUTPUT: 4

  [5, 7, 7, 8, 8, 10]
   0  1  2  3  4  5
               ↑  ↑
              (8)(8)
                  ↑ Last = index 4! ✅
```

```javascript
// ═══ CÁCH 1: LINEAR SCAN — O(N) ═══

const findLast = (nums, target) => {
  for (let i = 0; i < nums.length; i++) {
    // Tìm vị trí: giá trị = target VÀ giá trị tiếp theo ≠ target!
    if (nums[i] === target && nums[i + 1] !== target) {
      return i;
    }
  }
  return -1;
};

// TRACE:
// i=0: nums[0]=5, 5 !== 8 → skip!
// i=1: nums[1]=7, 7 !== 8 → skip!
// i=2: nums[2]=7, 7 !== 8 → skip!
// i=3: nums[3]=8 === 8, BUT nums[4]=8 === 8 → skip! (not last!)
// i=4: nums[4]=8 === 8, AND nums[5]=10 !== 8 → RETURN 4! ✅

// ĐỘ PHỨC TẠP:
// Time:  O(N) — duyệt toàn bộ!
// Space: O(1) — không dùng bộ nhớ thêm!
// Worst case: target ở cuối mảng → duyệt hết!
```

```
INTERVIEWER: "Có cách nào TỐT HƠN không?"
═══════════════════════════════════════════════════════════════

  → Mảng ĐÃ SẮP XẾP! → GỢI Ý: BINARY SEARCH!
  → Binary Search = O(log N) ← NHANH HƠN NHIỀU!
  → VD: 1 triệu phần tử:
    Linear: 1,000,000 bước!
    Binary: ~20 bước! (log₂ 1,000,000 ≈ 20!)
```

---

## §8. Find Last Occurrence — O(log N) Binary Search

```javascript
// ═══ CÁCH 2: BINARY SEARCH — O(log N) ═══

const findLast2 = (nums, target) => {
  let left = 0;
  let right = nums.length - 1;

  // Thu hẹp cho đến khi CHỈ CÒN 2 phần tử:
  while (right > left + 1) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] > target) {
      // Target nằm bên TRÁI mid:
      right = mid - 1;
    } else {
      // nums[mid] <= target:
      // Target CÓ THỂ ở mid HOẶC bên PHẢI!
      // → Giữ left = mid (không loại bỏ mid!)
      left = mid;
    }
  }

  // Còn 2 phần tử: kiểm tra RIGHT trước (vì tìm CUỐI CÙNG!)
  if (nums[right] === target) return right;
  if (nums[left] === target) return left;
  return -1;
};
```

```
TRACE — BINARY SEARCH:
═══════════════════════════════════════════════════════════════

  nums = [5, 7, 7, 8, 8, 10], target = 8

  Bước 1: left=0, right=5, mid=2
  → nums[2]=7, 7 <= 8 → left=2
  [5, 7, ⟨7, 8, 8, 10⟩]
         L           R

  Bước 2: left=2, right=5, mid=3
  → nums[3]=8, 8 <= 8 → left=3
  [5, 7, 7, ⟨8, 8, 10⟩]
             L      R

  Bước 3: right(5) > left(3)+1 → mid=4
  → nums[4]=8, 8 <= 8 → left=4
  [5, 7, 7, 8, ⟨8, 10⟩]
               L   R

  Bước 4: right(5) === left(4)+1 → DỪNG! Còn 2 phần tử!
  → Kiểm tra right: nums[5]=10 ≠ 8!
  → Kiểm tra left: nums[4]=8 === 8 → RETURN 4! ✅

  ĐỘ PHỨC TẠP:
  Time:  O(log N) — chia đôi mỗi bước!
  Space: O(1)
  Worst case: ~log₂(N) bước!
```

---

## §9. Binary Search Deep Dive

```
BINARY SEARCH — CÁC BIẾN THỂ:
═══════════════════════════════════════════════════════════════

  ① Tìm GIÁ TRỊ (basic):
  → nums[mid] === target → return mid!

  ② Tìm vị trí ĐẦU TIÊN (leftmost):
  → nums[mid] >= target → right = mid (giữ mid!)
  → nums[mid] < target → left = mid + 1

  ③ Tìm vị trí CUỐI CÙNG (rightmost — bài này!):
  → nums[mid] <= target → left = mid (giữ mid!)
  → nums[mid] > target → right = mid - 1

  ④ Tìm vị trí CHÈN (insertion point):
  → Giống leftmost, nhưng return left khi không tìm thấy!
```

```javascript
// ═══ PHIÊN BẢN CLEAN — TÌM VỊ TRÍ CUỐI CÙNG ═══

function findLastOccurrence(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    // ↑ Tránh integer overflow! (lo + hi) có thể tràn!

    if (nums[mid] === target) {
      result = mid; // GHI NHỚ vị trí!
      lo = mid + 1; // Tiếp tục tìm bên PHẢI (vì tìm CUỐI!)
    } else if (nums[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return result;
}

// TRACE: nums = [5,7,7,8,8,10], target = 8
// lo=0, hi=5, mid=2: nums[2]=7 < 8 → lo=3
// lo=3, hi=5, mid=4: nums[4]=8 === 8 → result=4, lo=5
// lo=5, hi=5, mid=5: nums[5]=10 > 8 → hi=4
// lo=5 > hi=4 → DỪNG! return result=4 ✅

// ═══ TÌM VỊ TRÍ ĐẦU TIÊN (bonus!) ═══

function findFirstOccurrence(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);

    if (nums[mid] === target) {
      result = mid;
      hi = mid - 1; // Tiếp tục tìm bên TRÁI (vì tìm ĐẦU!)
    } else if (nums[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return result;
}

// ═══ TÌM CẢ RANGE [first, last] ═══

function searchRange(nums, target) {
  return [findFirstOccurrence(nums, target), findLastOccurrence(nums, target)];
}
// searchRange([5,7,7,8,8,10], 8) → [3, 4]
// → LeetCode 34: Find First and Last Position!
```

```
BINARY SEARCH — COMMON MISTAKES:
═══════════════════════════════════════════════════════════════

  ① INFINITE LOOP:
  → while (lo < hi): nếu lo = hi = answer → BỎ QUA!
  → while (lo <= hi): correct! Kiểm tra khi lo === hi!

  ② INTEGER OVERFLOW:
  → mid = (lo + hi) / 2: lo + hi có thể > MAX_INT!
  → mid = lo + (hi - lo) / 2: SAFE!

  ③ OFF-BY-ONE:
  → lo = mid vs lo = mid + 1!
  → Nếu lo = mid và không thay đổi → INFINITE LOOP!
  → Rule: khi tìm rightmost, dùng lo = mid + 1 sau khi ghi result!

  ④ QUÊN UPDATE result:
  → Phải GHI NHỚ result khi nums[mid] === target!
  → Không return ngay (vì cần tìm tiếp!)
```

---

## §10. Tóm tắt phỏng vấn

```
PHỎNG VẤN — TRẢ LỜI:
═══════════════════════════════════════════════════════════════

  Q: "Implement real-time search box?"
  A: 3 vấn đề chính:
  → Race condition: Lock counter HOẶC AbortController!
  → Debounce: chờ 300ms sau khi user ngừng gõ!
  → Production: keyboard nav, text highlight, ARIA accessibility!
  → Tách logic: custom hook useSearch → reusable!

  Q: "Bugs trong code gốc?"
  A: 3 bugs:
  → fetch(url, value) → fetch(`url?q=${value}`)!
  → res.json() → await res.json()! (Promise!)
  → onClick={fn(item)} → onClick={() => fn(item)}! (invocation!)

  Q: "Find last occurrence — O(N)?"
  A: Duyệt: nums[i] === target && nums[i+1] !== target → return i!
  → O(N) time, worst case = cuối mảng!

  Q: "Có cách tốt hơn?"
  A: Binary Search O(log N)! Mảng đã sắp xếp!
  → Khi nums[mid] === target: ghi result, lo = mid + 1 (tìm tiếp phải!)
  → Khi nums[mid] < target: lo = mid + 1!
  → Khi nums[mid] > target: hi = mid - 1!
  → 1 triệu phần tử: 20 bước vs 1 triệu bước!
```

---

### Checklist

- [ ] **SearchBox Race Condition**: Lock counter (ref tăng mỗi lần, so sánh khi response) HOẶC AbortController (hủy request cũ)!
- [ ] **Debounce**: setTimeout 300ms, clearTimeout khi gõ tiếp; GIẢM API calls đáng kể!
- [ ] **AbortController**: `new AbortController()` → `fetch(url, { signal })` → `controller.abort()`; ignore AbortError!
- [ ] **3 bugs code gốc**: fetch args, await res.json(), onClick arrow function!
- [ ] **Custom hook useSearch**: tách logic (debounce + abort + state) ra khỏi UI; useEffect cleanup!
- [ ] **Production features**: keyboard (↑↓ Enter Esc), text highlight (regex split + mark), ARIA (combobox/listbox/option)!
- [ ] **Find Last O(N)**: `nums[i] === target && nums[i+1] !== target`; worst = cuối mảng!
- [ ] **Find Last O(log N)**: Binary search; `nums[mid] === target` → ghi result + `lo = mid + 1` (tìm tiếp phải!)!
- [ ] **Binary Search variants**: basic / leftmost / rightmost / insertion point; `mid = lo + (hi-lo)/2` tránh overflow!
- [ ] **LeetCode 34**: searchRange = [findFirst, findLast]; cả hai dùng binary search biến thể!

---

_Nguồn: Helianthuswhite — juejin.cn/post/7303413519906717705_
_Cập nhật lần cuối: Tháng 2, 2026_
