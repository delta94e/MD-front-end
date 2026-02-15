# React DataTable Interview Deep Dive

> Hướng dẫn xây dựng DataTable Component với Filter, Sort, Pagination
> Giải thích theo cách Senior Engineer trình bày trong buổi phỏng vấn Big Tech

---

## PHẦN A: HƯỚNG DẪN IMPLEMENTATION CHI TIẾT

> 💡 **Mindset**: Hãy tưởng tượng bạn đang giải thích cho interviewer tại Google/Meta. Mỗi quyết định đều có lý do, mỗi dòng code đều có trade-off.

### Tổng Quan Bài Toán

**Yêu cầu:**

- DataTable component tái sử dụng, không phụ thuộc data structure
- Filter per-column (text search + range filter)
- Sort ascending/descending
- Pagination

**💬 Cách mở đầu với interviewer:**

> "Trước khi code, tôi muốn clarify requirements và discuss high-level approach. Bài này yêu cầu một generalized DataTable - nghĩa là component không biết gì về data structure cụ thể. Tất cả business logic sẽ được inject qua column configuration. Đây là Inversion of Control pattern."

**🤔 Câu hỏi interviewer có thể hỏi ngay từ đầu:**

| Câu hỏi                       | Cách trả lời                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| "Data size expected?"         | "Clarify: <1000 rows → client-side OK. >10k → cần server-side filtering, virtualization."     |
| "Real-time updates?"          | "Nếu có, cần WebSocket/polling. DataTable stateless, parent manage data fetching."            |
| "Filter logic: AND or OR?"    | "Mặc định AND (all filters must match). Có thể extend cho OR với thêm config."                |
| "Mobile responsive?"          | "Có, dùng horizontal scroll hoặc stack columns. CSS media queries."                           |
| "Accessibility requirements?" | "Keyboard navigation, aria-labels, screen reader support. Quan trọng nhưng có thể MVP trước." |

**🏗️ Kiến trúc tổng quan:**

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT ARCHITECTURE                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  App.tsx                                                        │
│  ├── Defines: data[], columns[]                                 │
│  └── Uses: <DataTable data={} columns={} />                     │
│                                                                 │
│  DataTable.tsx (Orchestrator)                                   │
│  ├── State: page, pageSize, sortField, sortDirection, filters  │
│  ├── Pipeline: filterData → sortData → paginateData            │
│  └── Renders: <table>, <HeaderFilterInput />, pagination       │
│                                                                 │
│  HeaderFilterInput.tsx (Leaf Component)                         │
│  ├── Controlled by parent (filters, onFilterChange)            │
│  └── Renders: <input type="search" /> or min/max inputs        │
│                                                                 │
│  dataUtils.ts (Pure Functions)                                  │
│  ├── filterData<T>(data, filters) → T[]                         │
│  ├── sortData<T>(data, columns, field, direction) → T[]         │
│  └── paginateData<T>(data, page, size) → { pageData, maxPages } │
│                                                                 │
│  types.ts (Type Definitions)                                    │
│  ├── SortDirection, FilterPayloads, Filters                     │
│  └── ColumnDef<T>, Columns<T>                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**📊 Data Flow Diagram:**

```
┌─────────────────────────────────────────────────────────────────┐
│  DATA FLOW (Unidirectional)                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Action              State Update         Re-render        │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Click sort header  ──→  setSortField()   ──→  sortData()      │
│                          setSortDirection()    re-calculate    │
│                                                                 │
│  Type in filter     ──→  setFilters()     ──→  filterData()    │
│                          setPage(1)            reset to page 1 │
│                                                                 │
│  Click page button  ──→  setPage()        ──→  paginateData()  │
│                                                slice new page  │
│                                                                 │
│  KEY INSIGHT: Every state change triggers full pipeline         │
│  Filter → Sort → Paginate (in this exact order)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**📚 React Fundamentals cần nắm vững:**

| Concept                   | Áp dụng trong DataTable                                  |
| ------------------------- | -------------------------------------------------------- |
| **Controlled Components** | HeaderFilterInput nhận value từ parent, báo onChange lên |
| **Lifting State Up**      | State filters ở DataTable, không phải HeaderFilterInput  |
| **Composition**           | DataTable compose từ HeaderFilterInput, pagination UI    |
| **Pure Functions**        | filterData, sortData không có side effects               |
| **Immutability**          | Luôn create new array/object khi update state            |
| **Key Prop**              | `key={item.id}` cho stable identity trong lists          |

**📁 Cấu trúc files:**

```
src/
├── types.ts              # Type definitions
├── dataUtils.ts          # Pure functions (filter, sort, paginate)
├── HeaderFilterInput.tsx # Filter input component
├── DataTable.tsx         # Main component
├── App.tsx               # Usage example
├── App.css               # Styling
└── data/
    └── users.json        # Sample data
```

---

### Bước 0: Project Setup

> 🎯 **Mục tiêu**: Tạo project và sample data.

**💬 Cách trình bày:**

> "Tôi sẽ dùng Vite với React + TypeScript vì setup nhanh và có HMR tốt cho development."

```bash
# Tạo project
npm create vite@latest datatable-demo -- --template react-ts
cd datatable-demo
npm install
npm run dev
```

**Tạo file `src/data/users.json`:**

```json
[
  {
    "id": 1,
    "name": "Emily Chen",
    "age": 28,
    "occupation": "Software Engineer"
  },
  {
    "id": 2,
    "name": "Ryan Thompson",
    "age": 32,
    "occupation": "Marketing Manager"
  },
  { "id": 3, "name": "Sophia Patel", "age": 25, "occupation": "Data Analyst" },
  { "id": 4, "name": "Michael Lee", "age": 41, "occupation": "CEO" },
  { "id": 5, "name": "Jessica Brown", "age": 29, "occupation": "UX Designer" },
  { "id": 6, "name": "David Kim", "age": 35, "occupation": "Product Manager" },
  {
    "id": 7,
    "name": "Amanda Wilson",
    "age": 27,
    "occupation": "Frontend Developer"
  },
  {
    "id": 8,
    "name": "James Garcia",
    "age": 38,
    "occupation": "Backend Developer"
  },
  {
    "id": 9,
    "name": "Sarah Martinez",
    "age": 31,
    "occupation": "DevOps Engineer"
  },
  { "id": 10, "name": "Kevin Anderson", "age": 45, "occupation": "CTO" }
]
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                      | Cách trả lời                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| "Tại sao dùng JSON file thay vì API?"        | "Để demo đơn giản. Thực tế sẽ fetch từ API. Component không care data từ đâu, chỉ cần nhận array."                                   |
| "Data có id, tại sao quan trọng?"            | "React cần unique key cho list rendering. id là natural key, tốt hơn array index."                                                   |
| "Vite vs Create React App?"                  | "Vite dùng ES modules + esbuild → dev server khởi động <1s. CRA dùng Webpack → chậm hơn 10-20x. Production build cũng nhanh hơn."    |
| "Tại sao TypeScript, không phải JavaScript?" | "Type safety catch bugs at compile time. IDE autocomplete tốt hơn. Types là documentation sống. Industry standard cho projects lớn." |
| "Project structure này có scalable không?"   | "Cho demo thì OK. Thực tế sẽ tách: /components, /hooks, /utils, /types. Có thể dùng feature-based structure."                        |
| "JSON import có vấn đề gì không?"            | "Phải enable `resolveJsonModule` trong tsconfig. Bundler sẽ inline JSON vào bundle. Large JSON nên lazy load."                       |

**📚 Kiến thức nâng cao - Project Structure:**

```
// PATTERN 1: Feature-based (recommended for large apps)
src/
├── features/
│   ├── datatable/
│   │   ├── components/
│   │   │   ├── DataTable.tsx
│   │   │   └── HeaderFilterInput.tsx
│   │   ├── hooks/
│   │   │   └── useTableState.ts
│   │   ├── utils/
│   │   │   └── dataUtils.ts
│   │   ├── types.ts
│   │   └── index.ts
│   └── users/
│       ├── api.ts
│       └── types.ts
└── shared/
    ├── components/
    └── utils/

// PATTERN 2: Layer-based (simpler, good for small-medium apps)
src/
├── components/
├── hooks/
├── utils/
├── types/
└── pages/

// tsconfig.json essentials
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "resolveJsonModule": true,  // Enable JSON imports
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]  // Path aliases
    }
  }
}
```

### Bước 1: Thiết Kế Type System

> 🎯 **Mục tiêu**: Định nghĩa "hợp đồng" giữa DataTable và code sử dụng nó.

**💬 Cách trình bày:**

> "Tôi sẽ bắt đầu với Type System vì đây là foundation. Trong TypeScript, types không chỉ để type-check mà còn là documentation sống. Người đọc code sẽ hiểu ngay API của component qua types."

```typescript
// types.ts

// 1. Sort Direction - đơn giản, chỉ 2 giá trị
export type SortDirection = "asc" | "desc";

// 2. Filter Payloads - dùng Discriminated Union
// Tại sao? Vì TypeScript có thể narrow type dựa trên property 'type'
export type FilterPayloadString = {
  type: "string"; // Discriminant
  value: string | null;
};

export type FilterPayloadRange = {
  type: "range"; // Discriminant
  min?: number | null;
  max?: number | null;
};

// 3. Filters State - dùng Record thay vì Array
// Key = column key, Value = filter payload
export type Filters = Record<string, FilterPayloadString | FilterPayloadRange>;

// 4. Column Definition - Generic type T = row data type
export type ColumnDef<T> = {
  label: string;
  key: string;
  renderCell: (row: T) => React.ReactNode;
  comparator: (a: T, b: T, direction: SortDirection) => number;
  filterType: "string" | "range" | null;
};

export type Columns<T> = ReadonlyArray<ColumnDef<T>>;
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                               | Cách trả lời                                                                                                                                                               |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| "Tại sao dùng Discriminated Union cho FilterPayload?" | "Để TypeScript tự động narrow type. Khi check `if (payload.type === 'string')`, TS biết payload là FilterPayloadString, có access vào `.value`. Không cần type assertion." |
| "Tại sao Filters là Record, không phải Array?"        | "3 lý do: (1) O(1) lookup theo key, (2) Dễ update một filter cụ thể với spread operator, (3) Tự động đảm bảo mỗi column chỉ có 1 filter."                                  |
| "Tại sao Columns là ReadonlyArray?"                   | "Để prevent mutation. Column config không nên thay đổi sau khi define. Nếu cần dynamic columns, parent component nên tạo array mới."                                       |
| "type vs interface - khi nào dùng cái nào?"           | "interface cho objects có thể extend, type cho unions, tuples, và mapped types. Ở đây dùng type vì có union types và không cần inheritance."                               |
| "`                                                    | null`vs`?:` (optional) khác gì?"                                                                                                                                           | "`min?: number` nghĩa là property có thể không tồn tại. `min: number | null` nghĩa là property phải tồn tại nhưng value có thể null. Semantic khác nhau." |
| "Generic `<T>` dùng ở đây để làm gì?"                 | "Để ColumnDef type-safe với bất kỳ data type. `ColumnDef<User>` sẽ force renderCell nhận User, không phải any. Compiler bắt lỗi nếu access wrong property."                |

**📚 Kiến thức nâng cao - Type Patterns:**

```typescript
// 1. DISCRIMINATED UNION - Pattern hay dùng
type Result<T> = { success: true; data: T } | { success: false; error: string };

function handleResult(result: Result<User>) {
  if (result.success) {
    console.log(result.data); // TS knows: data exists
  } else {
    console.log(result.error); // TS knows: error exists
  }
}

// 2. BRANDED TYPES - Prevent mixing up similar types
type UserId = string & { readonly brand: unique symbol };
type OrderId = string & { readonly brand: unique symbol };

// 3. TEMPLATE LITERAL TYPES
type EventName = `on${Capitalize<string>}`;
// 'onClick', 'onHover', 'onChange' etc.

// 4. CONDITIONAL TYPES
type FilterValue<T> = T extends "string"
  ? FilterPayloadString
  : FilterPayloadRange;
```

**⚖️ Trade-off Analysis:**

```
┌─────────────────────────────────────────────────────────────────┐
│  DESIGN DECISION: filterType trong ColumnDef                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Option A: filterType: 'string' | 'range' | null                │
│  ✅ Simple, declarative                                         │
│  ✅ DataTable tự render filter input                            │
│  ❌ Không flexible - chỉ hỗ trợ 2 loại filter                   │
│                                                                 │
│  Option B: filterFn: (value, filter) => boolean                 │
│  ✅ Fully flexible - any filter logic                           │
│  ❌ Consumer phải tự render filter input                        │
│  ❌ Phức tạp hơn cho common cases                                │
│                                                                 │
│  Option C: Hybrid (như TanStack Table)                          │
│  filterFn?: | 'string' | 'range' | CustomFilterFn               │
│  ✅ Best of both worlds                                          │
│  ❌ More complex type definitions                                │
│                                                                 │
│  → Chọn Option A cho bài interview vì scope phù hợp             │
│  → Thực tế có thể upgrade lên Option C khi cần                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Bước 2: Filter Input Component

> 🎯 **Mục tiêu**: Component render filter UI dựa trên filterType.

**💬 Cách trình bày:**

> "Tôi sẽ tách filter input thành component riêng vì Single Responsibility. Component này chỉ lo việc render input và báo lên parent khi filter thay đổi."

```tsx
// HeaderFilterInput.tsx
import { Filters, FilterPayloadString, FilterPayloadRange } from "./types";

type Props = {
  field: string;
  filterType: "string" | "range";
  filters: Filters;
  onFilterChange: (newFilters: Filters) => void;
};

export default function HeaderFilterInput({
  field,
  filterType,
  filters,
  onFilterChange,
}: Props) {
  // STRING FILTER
  if (filterType === "string") {
    const filterData = filters[field] as FilterPayloadString | undefined;
    const currentValue = filterData?.value || "";

    return (
      <input
        type="search"
        placeholder="Search..."
        value={currentValue}
        onChange={(e) => {
          // Immutable update - tạo object mới
          onFilterChange({
            ...filters,
            [field]: { type: "string", value: e.target.value },
          });
        }}
      />
    );
  }

  // RANGE FILTER
  if (filterType === "range") {
    const filterData = filters[field] as FilterPayloadRange | undefined;
    const currentMin = filterData?.min ?? "";
    const currentMax = filterData?.max ?? "";

    return (
      <div className="filter-range">
        <input
          type="number"
          placeholder="Min"
          value={currentMin}
          onChange={(e) => {
            const newMin =
              e.target.value !== "" ? Number(e.target.value) : null;
            onFilterChange({
              ...filters,
              [field]: {
                ...filterData, // ⚠️ QUAN TRỌNG: Giữ lại max!
                type: "range",
                min: newMin,
              },
            });
          }}
        />
        <input
          type="number"
          placeholder="Max"
          value={currentMax}
          onChange={(e) => {
            const newMax =
              e.target.value !== "" ? Number(e.target.value) : null;
            onFilterChange({
              ...filters,
              [field]: {
                ...filterData, // ⚠️ QUAN TRỌNG: Giữ lại min!
                type: "range",
                max: newMax,
              },
            });
          }}
        />
      </div>
    );
  }

  return null;
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                                | Cách trả lời                                                                                                                       |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| "Tại sao dùng `??` thay vì `\|\|` cho currentMin/Max?" | "`\|\|` coi 0 là falsy. `0 \|\| ''` = `''`. Nhưng 0 là valid min/max. `??` chỉ check null/undefined, nên `0 ?? ''` = `0`."         |
| "Tại sao cần `...filterData` khi update range?"        | "Để giữ lại giá trị khác. Nếu user đã nhập min=25, giờ nhập max=40, mà không có `...filterData` thì min sẽ mất."                   |
| "Component này controlled hay uncontrolled?"           | "Controlled. Value và onChange đều từ parent. Điều này giúp parent có single source of truth cho filter state."                    |
| "Có cách nào optimize re-renders không?"               | "Có: (1) React.memo cho component, (2) useCallback cho onChange handlers, (3) Debounce input để giảm số lần gọi onFilterChange."   |
| "Tại sao không dùng useRef cho input value?"           | "useRef không trigger re-render. Filter value cần sync với parent state. Nếu dùng ref, parent không biết khi nào filter thay đổi." |
| "Event handler inline có vấn đề gì không?"             | "Mỗi render tạo function mới. Nếu pass xuống child component sẽ gây unnecessary re-renders. Có thể fix bằng useCallback."          |

**📚 Kiến thức nâng cao - Controlled Components:**

```tsx
// PATTERN 1: Controlled với parent state
function ControlledInput({ value, onChange }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} />;
}
// ✅ Parent có full control
// ✅ Easy to validate/transform value
// ❌ More boilerplate

// PATTERN 2: Uncontrolled với ref
function UncontrolledInput({ defaultValue }) {
  const ref = useRef();
  return <input ref={ref} defaultValue={defaultValue} />;
}
// ✅ Less code
// ✅ Good for one-time reads (form submit)
// ❌ Hard to sync với external state

// PATTERN 3: Hybrid - local state + sync
function HybridInput({ value, onChange, debounceMs = 300 }) {
  const [localValue, setLocalValue] = useState(value);

  // Sync khi parent value đổi
  useEffect(() => setLocalValue(value), [value]);

  // Debounce before calling parent
  useEffect(() => {
    const timer = setTimeout(() => onChange(localValue), debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, onChange, debounceMs]);

  return (
    <input value={localValue} onChange={(e) => setLocalValue(e.target.value)} />
  );
}
// ✅ Best UX - instant feedback + debounced updates
// ❌ More complex, potential sync issues
```

**⚖️ Trade-off Analysis:**

```
┌─────────────────────────────────────────────────────────────────┐
│  PATTERN: Lifting State Up                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HeaderFilterInput KHÔNG tự quản lý state.                      │
│  Nó nhận filters từ parent và gọi onFilterChange.               │
│                                                                 │
│  Tại sao?                                                       │
│  1. DataTable cần filters để filter data                        │
│  2. Nếu filter state ở HeaderFilterInput, DataTable phải        │
│     lift state up anyway → duplicate logic                      │
│  3. Single source of truth = dễ debug                           │
│                                                                 │
│  Trade-off:                                                     │
│  - Props drilling qua nhiều layers                              │
│  - Có thể giải quyết bằng Context nếu tree sâu                  │
│                                                                 │
│  Alternatives:                                                  │
│  - Context API: Khi nhiều consumers cần filter state            │
│  - useReducer: Khi có complex state transitions                │
│  - Zustand/Jotai: Khi cần global state management               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Bước 3: Data Processing Functions

> 🎯 **Mục tiêu**: Pure functions xử lý filter, sort, paginate.

**💬 Cách trình bày:**

> "Tôi tách data processing thành pure functions vì: (1) Dễ test, (2) Dễ reuse, (3) Separation of concerns. DataTable component chỉ lo orchestration, không lo logic."

```typescript
// dataUtils.ts

// ═══════════════════════════════════════════════════════════════
// FILTER FUNCTION
// ═══════════════════════════════════════════════════════════════
export function filterData<T>(data: T[], filters: Filters): T[] {
  return data.filter((row) => {
    // Lấy tất cả filter entries
    const filterEntries = Object.entries(filters);

    // Không có filter → pass all
    if (filterEntries.length === 0) return true;

    // Check từng filter, collect results
    const results = filterEntries.map(([key, payload]) => {
      const value = (row as any)[key];

      // STRING FILTER
      if (payload.type === "string") {
        // Empty filter → không filter → pass
        if (!payload.value) return true;

        // Case-insensitive substring match
        return String(value)
          .toLowerCase()
          .includes(payload.value.toLowerCase());
      }

      // RANGE FILTER
      if (payload.type === "range") {
        if (payload.min != null && value < payload.min) return false;
        if (payload.max != null && value > payload.max) return false;
        return true;
      }

      return true;
    });

    // AND logic: phải pass TẤT CẢ filters
    return results.every(Boolean);
  });
}

// ═══════════════════════════════════════════════════════════════
// SORT FUNCTION
// ═══════════════════════════════════════════════════════════════
export function sortData<T>(
  data: T[],
  columns: Columns<T>,
  sortField: string | null,
  sortDirection: SortDirection,
): T[] {
  if (!sortField) return data.slice(); // No sort → return copy

  const column = columns.find((c) => c.key === sortField);
  if (!column) return data.slice();

  // QUAN TRỌNG: .slice() trước .sort() để không mutate original
  return data.slice().sort((a, b) => column.comparator(a, b, sortDirection));
}

// ═══════════════════════════════════════════════════════════════
// PAGINATE FUNCTION
// ═══════════════════════════════════════════════════════════════
export function paginateData<T>(data: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageData = data.slice(start, end);
  const maxPages = Math.ceil(data.length / pageSize);

  return { pageData, maxPages };
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                                  | Cách trả lời                                                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| "Tại sao dùng `every(Boolean)` thay vì `every(x => x)`?" | "Cùng kết quả, nhưng `every(Boolean)` ngắn gọn hơn. Boolean là constructor, hoạt động như function convert value thành boolean."      |
| "Time complexity của filterData là gì?"                  | "O(n \* m) với n = số rows, m = số filters. Mỗi row phải check qua tất cả filters."                                                   |
| "Tại sao `.slice()` trước `.sort()`?"                    | "Array.sort() mutates original array. Trong React, mutating data có thể gây bugs vì reference không đổi → component không re-render." |
| "Array.sort() stable không?"                             | "Từ ES2019, spec yêu cầu stable sort. Nhưng trước đó là implementation-dependent. V8 dùng TimSort, stable từ 2018."                   |
| "Làm sao optimize nếu data lớn?"                         | "3 approaches: (1) useMemo để cache, (2) Web Worker cho filter/sort, (3) Server-side filtering + pagination."                         |
| "Tại sao tách thành pure functions?"                     | "5 lý do: (1) Easy to test, (2) No side effects, (3) Reusable, (4) Easy to reason about, (5) Có thể chạy trong Web Worker."           |
| "localeCompare vs simple comparison?"                    | "localeCompare xử lý đúng Unicode, accents, và locale-specific ordering. 'ä' vs 'z' khác nhau tùy locale."                            |
| "Có thể short-circuit filter không?"                     | "Có, dùng `some()` cho OR logic hoặc `find()` nếu chỉ cần first match. `every()` sẽ short-circuit khi gặp false đầu tiên."            |

**📚 Kiến thức nâng cao - Array Methods & Algorithms:**

```typescript
// 1. SORT STABILITY - Quan trọng khi sort multiple fields
const users = [
  { name: "Alice", age: 30 },
  { name: "Bob", age: 30 },
  { name: "Charlie", age: 25 },
];

// Stable sort: Bob và Alice giữ nguyên thứ tự tương đối
// Unstable sort: Bob có thể lên trước Alice

// 2. MULTI-FIELD SORT
function multiSort<T>(data: T[], comparators: ((a: T, b: T) => number)[]) {
  return [...data].sort((a, b) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) return result;
    }
    return 0;
  });
}

// 3. CASE-INSENSITIVE SORT với localeCompare
const sorted = names.sort((a, b) =>
  a.localeCompare(b, "vi", { sensitivity: "base" }),
);
// sensitivity: 'base' = ignore case và accents
// sensitivity: 'case' = compare case, ignore accents

// 4. SEARCH OPTIMIZATION
// Binary search cho sorted data: O(log n) vs O(n)
function binarySearch<T>(
  arr: T[],
  target: T,
  compareFn: (a: T, b: T) => number,
) {
  let left = 0,
    right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const cmp = compareFn(arr[mid], target);
    if (cmp === 0) return mid;
    if (cmp < 0) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

// 5. FILTER COMPOSITION
const pipe =
  <T>(...fns: ((x: T[]) => T[])[]) =>
  (initial: T[]) =>
    fns.reduce((acc, fn) => fn(acc), initial);

const processData = pipe(
  (data) => filterData(data, filters),
  (data) => sortData(data, columns, sortField, sortDirection),
  (data) => paginateData(data, page, pageSize).pageData,
);
```

**⚖️ Trade-off Analysis:**

```
┌─────────────────────────────────────────────────────────────────┐
│  CRITICAL: DATA PIPELINE ORDER                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ ĐÚNG: Filter → Sort → Paginate                              │
│                                                                 │
│     Raw Data (100 items)                                        │
│          ↓                                                      │
│     Filter (→ 15 items match)                                   │
│          ↓                                                      │
│     Sort (→ 15 items, ordered)                                  │
│          ↓                                                      │
│     Paginate (→ 5 items for page 1)                             │
│                                                                 │
│  ❌ SAI: Sort → Paginate → Filter                               │
│                                                                 │
│     Raw Data (100 items)                                        │
│          ↓                                                      │
│     Sort (→ 100 items, ordered)                                 │
│          ↓                                                      │
│     Paginate (→ 5 items for page 1)                             │
│          ↓                                                      │
│     Filter (→ chỉ filter 5 items! Bỏ sót 95 items!)             │
│                                                                 │
│  OPTIMIZATION PIPELINE:                                         │
│                                                                 │
│     useMemo(filterData) ← only recompute when filters change    │
│          ↓                                                      │
│     useMemo(sortData) ← only recompute when sort changes        │
│          ↓                                                      │
│     useMemo(paginate) ← only recompute when page changes       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Bước 4: DataTable Component

> 🎯 **Mục tiêu**: Orchestrate tất cả lại với nhau.

**💬 Cách trình bày:**

> "DataTable là orchestration layer. Nó quản lý state và coordinate các phần. Tôi sẽ giữ component này lean, delegate logic cho utility functions."

```tsx
// DataTable.tsx
import { useState } from "react";
import { Columns, SortDirection, Filters } from "./types";
import { filterData, sortData, paginateData } from "./dataUtils";
import HeaderFilterInput from "./HeaderFilterInput";

type Props<T extends { id: number }> = {
  data: T[];
  columns: Columns<T>;
};

export default function DataTable<T extends { id: number }>({
  data,
  columns,
}: Props<T>) {
  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filters, setFilters] = useState<Filters>({});

  // ═══════════════════════════════════════════════════════════
  // DATA PIPELINE: Filter → Sort → Paginate
  // ═══════════════════════════════════════════════════════════
  const filteredData = filterData(data, filters);
  const sortedData = sortData(filteredData, columns, sortField, sortDirection);
  const { pageData, maxPages } = paginateData(sortedData, page, pageSize);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleSort = (key: string) => {
    if (sortField !== key) {
      setSortField(key);
      setSortDirection("asc");
    } else {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    }
    setPage(1); // Reset page khi sort thay đổi
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1); // ⚠️ CRITICAL: Reset page khi filter thay đổi
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div>
      <table>
        <thead>
          <tr>
            {columns.map(({ label, key, filterType }) => (
              <th key={key}>
                <button onClick={() => handleSort(key)}>
                  {label}
                  {sortField === key && (sortDirection === "asc" ? " ↑" : " ↓")}
                </button>

                {filterType && (
                  <HeaderFilterInput
                    field={key}
                    filterType={filterType}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {pageData.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>No data found</td>
            </tr>
          ) : (
            pageData.map((item) => (
              <tr key={item.id}>
                {columns.map(({ key, renderCell }) => (
                  <td key={key}>{renderCell(item)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="pagination">
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={5}>Show 5</option>
          <option value={10}>Show 10</option>
        </select>

        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {maxPages || 1}
        </span>
        <button
          disabled={page >= maxPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                                    | Cách trả lời                                                                                                                                    |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| "Tại sao `setPage(1)` trong handleFilterChange?"           | "Vì sau filter, số lượng results thay đổi. Nếu đang ở page 5 mà filter chỉ còn 2 pages, page 5 sẽ empty. Reset về 1 để user luôn thấy results." |
| "Có optimization nào cho performance không?"               | "Có thể useMemo cho filteredData/sortedData nếu data lớn. Hoặc debounce filter input để không filter mỗi keystroke."                            |
| "Generic constraint `T extends { id: number }` để làm gì?" | "Để đảm bảo data có `id` field cho React key. Nếu không có constraint, TypeScript sẽ error ở `key={item.id}`."                                  |
| "Tại sao dùng nhiều useState thay vì 1 object?"            | "Để tối ưu re-renders. Nếu dùng 1 object, mỗi lần thay đổi 1 field phải spread toàn bộ. Tách ra thì chỉ re-render khi field cụ thể đổi."        |
| "Khi nào nên dùng useReducer thay useState?"               | "Khi có >3 related states, hoặc state transitions phức tạp (sort + filter reset page). useReducer giúp centralize logic."                       |
| "Tại sao không dùng Context cho state?"                    | "Context gây re-render tất cả consumers khi value đổi. Ở đây chỉ có 1 consumer (DataTable), không cần Context."                                 |
| "Làm sao persist state khi refresh?"                       | "3 cách: (1) URL params, (2) localStorage, (3) sessionStorage. URL params là best vì shareable và SEO-friendly."                                |
| "Component re-render mấy lần khi filter?"                  | "1 lần. React batches multiple setState calls trong cùng event handler thành 1 re-render (React 18+)."                                          |

**📚 Kiến thức nâng cao - State Management:**

```tsx
// PATTERN 1: Multiple useState (current implementation)
const [page, setPage] = useState(1);
const [filters, setFilters] = useState({});
// ✅ Simple, independent state
// ❌ Multiple setters khi có coordinated updates

// PATTERN 2: useReducer for complex state
type State = { page: number; filters: Filters; sortField: string | null };
type Action =
  | { type: "SET_FILTER"; payload: Filters }
  | { type: "SET_SORT"; field: string }
  | { type: "SET_PAGE"; page: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FILTER":
      return { ...state, filters: action.payload, page: 1 }; // Auto reset page
    case "SET_SORT":
      return {
        ...state,
        sortField: action.field,
        sortDirection:
          state.sortField === action.field
            ? state.sortDirection === "asc"
              ? "desc"
              : "asc"
            : "asc",
        page: 1,
      };
    default:
      return state;
  }
}

// PATTERN 3: URL State Sync
import { useSearchParams } from "react-router-dom";

function useTableState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const filters = JSON.parse(searchParams.get("filters") || "{}");

  const setPage = (p: number) => {
    searchParams.set("page", String(p));
    setSearchParams(searchParams);
  };

  return { page, filters, setPage };
}
// ✅ Shareable URLs, browser back/forward works
// ❌ More complex, URL size limits
```

**⚖️ Trade-off Analysis:**

```
┌─────────────────────────────────────────────────────────────────┐
│  STATE MANAGEMENT OPTIONS                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Option A: Multiple useState (chosen)                           │
│  ✅ Simple, familiar API                                         │
│  ✅ Fine-grained updates                                         │
│  ❌ Coordinated updates require multiple setters                 │
│                                                                 │
│  Option B: Single useState with object                          │
│  ✅ One setter for all updates                                   │
│  ❌ Must spread entire object for each update                    │
│  ❌ Easy to accidentally drop properties                         │
│                                                                 │
│  Option C: useReducer                                           │
│  ✅ Centralized state logic                                      │
│  ✅ Easy to add complex state transitions                        │
│  ❌ More boilerplate                                             │
│                                                                 │
│  Option D: External state library (Zustand/Jotai)               │
│  ✅ Computed values, selectors                                   │
│  ✅ Easy persist middleware                                      │
│  ❌ Additional dependency                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**💬 Cách trình bày:**

> "Giờ tôi sẽ demo cách sử dụng DataTable component. Điểm hay là consumer chỉ cần define columns config, không cần biết implementation details."

```tsx
// App.tsx
import DataTable from "./DataTable";
import { Columns } from "./types";
import users from "./data/users.json";

type User = (typeof users)[number];

const userColumns: Columns<User> = [
  {
    label: "ID",
    key: "id",
    renderCell: (user) => user.id,
    comparator: (a, b, dir) => (dir === "asc" ? a.id - b.id : b.id - a.id),
    filterType: null, // Không filter ID
  },
  {
    label: "Name",
    key: "name",
    renderCell: (user) => user.name,
    comparator: (a, b, dir) =>
      dir === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    filterType: "string",
  },
  {
    label: "Age",
    key: "age",
    renderCell: (user) => user.age,
    comparator: (a, b, dir) => (dir === "asc" ? a.age - b.age : b.age - a.age),
    filterType: "range",
  },
  {
    label: "Occupation",
    key: "occupation",
    renderCell: (user) => user.occupation,
    comparator: (a, b, dir) =>
      dir === "asc"
        ? a.occupation.localeCompare(b.occupation)
        : b.occupation.localeCompare(a.occupation),
    filterType: "string",
  },
];

export default function App() {
  return <DataTable data={users} columns={userColumns} />;
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                     | Cách trả lời                                                                                                                |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| "`typeof users)[number]` là gì?"            | "TypeScript inference từ array. `typeof users` = array type, `[number]` = element type. Tự động infer User type từ JSON."   |
| "Tại sao columns là const ngoài component?" | "Vì columns không đổi. Nếu define trong component, mỗi render tạo array mới → có thể gây issues nếu dùng trong deps array." |
| "Làm sao test DataTable?"                   | "3 levels: (1) Unit test pure functions, (2) Component test với Testing Library, (3) E2E test với Playwright/Cypress."      |
| "Columns có thể dynamic không?"             | "Có, chỉ cần pass columns như props. Nhưng cẩn thận với memoization nếu columns thay đổi liên tục."                         |
| "Làm sao add custom rendering cho cell?"    | "renderCell đã support. Có thể return JSX: `renderCell: (user) => <Badge>{user.status}</Badge>`."                           |
| "Server-side data thì sao?"                 | "Thay JSON import bằng useQuery/useSWR. DataTable nhận data prop, không care nguồn data."                                   |

**📚 Kiến thức nâng cao - Column Configuration Patterns:**

```tsx
// PATTERN 1: Factory functions for common columns
function createTextColumn<T>(key: keyof T, label: string): ColumnDef<T> {
  return {
    key: String(key),
    label,
    renderCell: (row) => String(row[key]),
    comparator: (a, b, dir) => {
      const aVal = String(a[key]);
      const bVal = String(b[key]);
      return dir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    },
    filterType: "string",
  };
}

// Usage:
const columns = [
  createTextColumn<User>("name", "Name"),
  createTextColumn<User>("email", "Email"),
];

// PATTERN 2: Column builder (fluent API)
class ColumnBuilder<T> {
  private column: Partial<ColumnDef<T>> = {};

  key(k: keyof T) {
    this.column.key = String(k);
    return this;
  }
  label(l: string) {
    this.column.label = l;
    return this;
  }
  filterable(type: "string" | "range") {
    this.column.filterType = type;
    return this;
  }

  build(): ColumnDef<T> {
    return this.column as ColumnDef<T>;
  }
}

// PATTERN 3: Custom renderers
const statusColumn: ColumnDef<Order> = {
  key: "status",
  label: "Status",
  renderCell: (order) => (
    <span className={`badge badge-${order.status}`}>{order.status}</span>
  ),
  comparator: (a, b, dir) =>
    a.status.localeCompare(b.status) * (dir === "asc" ? 1 : -1),
  filterType: null, // Custom filter needed for select dropdown
};
```

**💬 Cách kết thúc với interviewer:**

> "Đây là complete implementation. Component hoàn toàn generalized - chỉ cần define columns khác là có thể render bất kỳ data nào. Nếu có thêm thời gian, tôi sẽ add: (1) useMemo cho performance, (2) debounce cho filter input, (3) URL state sync để shareable links, (4) column resizing, (5) row selection."

---

### Bước 6: CSS Styling

> 🎯 **Mục tiêu**: Style cho DataTable trông professional.

**💬 Cách trình bày:**

> "Styling không phải focus chính, nhưng tôi sẽ add basic CSS để table readable và có good UX."

```css
/* App.css */

/* Reset */
* {
  box-sizing: border-box;
}

/* Table Container */
.datatable-container {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

/* Table */
table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

/* Header */
thead {
  background: #f8f9fa;
}

th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

/* Sort Button */
th button {
  background: none;
  border: none;
  font: inherit;
  font-weight: 600;
  color: inherit;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

th button:hover {
  background: #e5e7eb;
}

/* Filter Inputs */
th input {
  width: 100%;
  margin-top: 8px;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
}

th input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.filter-range {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.filter-range input {
  margin-top: 0;
  width: 50%;
}

/* Body */
td {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
}

tbody tr:hover {
  background: #f9fafb;
}

tbody tr:last-child td {
  border-bottom: none;
}

/* Empty State */
.empty-state {
  text-align: center;
  color: #9ca3af;
  padding: 40px;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 0;
}

.pagination select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
}

.pagination button {
  padding: 6px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination button:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination span {
  color: #6b7280;
  font-size: 14px;
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                             | Cách trả lời                                                                                                                                             |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Tại sao dùng border-collapse: collapse?"           | "Để loại bỏ khoảng cách giữa các cells. Mặc định browsers có spacing giữa cells. collapse giúp borders merge lại."                                       |
| "Tại sao dùng box-shadow thay vì border cho table?" | "box-shadow nhẹ hơn visually và không affect layout. Border thêm vào width của element nếu không có box-sizing."                                         |
| "Có vấn đề accessibility nào không?"                | "Nên thêm: (1) scope='col' cho th, (2) aria-sort cho sortable headers, (3) min-width cho touch targets, (4) focus-visible cho keyboard navigation."      |
| "Mobile responsive thế nào?"                        | "Với narrow screens, có thể: (1) horizontal scroll, (2) stack columns vertically, (3) hide less important columns, (4) card-based layout thay vì table." |

**⚖️ Trade-off Analysis:**

```
┌─────────────────────────────────────────────────────────────────┐
│  CSS APPROACH OPTIONS                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Option A: Plain CSS (chosen)                                   │
│  ✅ No dependencies                                              │
│  ✅ Full control                                                 │
│  ✅ Fast load time                                               │
│  ❌ More code to write                                           │
│                                                                 │
│  Option B: Tailwind CSS                                         │
│  ✅ Rapid development                                            │
│  ✅ Consistent design system                                     │
│  ❌ Build step required                                          │
│  ❌ Larger learning curve                                        │
│                                                                 │
│  Option C: CSS-in-JS (styled-components)                        │
│  ✅ Scoped styles                                                │
│  ✅ Dynamic styling                                              │
│  ❌ Runtime overhead                                             │
│  ❌ Additional dependency                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Bước 7: Performance Optimization (Bonus)

> 🎯 **Mục tiêu**: Optimize cho large datasets.

**💬 Cách trình bày:**

> "Với data nhỏ (<1000 rows), implementation hiện tại đủ tốt. Nhưng nếu cần optimize, đây là các options."

**🔧 Optimization 1: useMemo cho computed data**

```tsx
import { useState, useMemo } from "react";

// Trong DataTable component:
const filteredData = useMemo(
  () => filterData(data, filters),
  [data, filters], // Chỉ re-compute khi data hoặc filters thay đổi
);

const sortedData = useMemo(
  () => sortData(filteredData, columns, sortField, sortDirection),
  [filteredData, columns, sortField, sortDirection],
);

const { pageData, maxPages } = useMemo(
  () => paginateData(sortedData, page, pageSize),
  [sortedData, page, pageSize],
);
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                          | Cách trả lời                                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| "Khi nào nên dùng useMemo?"      | "Khi computation expensive và inputs không đổi thường xuyên. Với small data, overhead của useMemo có thể > savings." |
| "useMemo có guarantee gì không?" | "Không. React có thể clear memoized value. Nhưng với stable inputs, nó sẽ return cached value."                      |

---

**🔧 Optimization 2: Debounce filter input**

```tsx
// Cách 1: useDeferredValue (React 18+)
import { useDeferredValue } from "react";

const [filterInput, setFilterInput] = useState("");
const deferredFilter = useDeferredValue(filterInput);

// Filter sẽ dùng deferredFilter thay vì filterInput
// React sẽ delay update để không block typing

// Cách 2: Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Sử dụng:
const debouncedFilters = useDebounce(filters, 300);
const filteredData = filterData(data, debouncedFilters);
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                              | Cách trả lời                                                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| "useDeferredValue vs useTransition?" | "useDeferredValue cho state từ bên ngoài (props). useTransition cho state mình control. Cả hai đều mark update là low-priority." |
| "Debounce vs Throttle?"              | "Debounce: chờ user stop typing rồi mới execute. Throttle: execute định kỳ (vd: mỗi 300ms max 1 lần). Filter nên dùng debounce." |
| "Delay bao lâu là hợp lý?"           | "150-300ms cho filter. Dưới 100ms user không notice, trên 500ms user cảm thấy laggy. 300ms là sweet spot."                       |

---

**🔧 Optimization 3: Virtualization cho large lists**

**💬 Cách trình bày:**

> "Với 10,000+ rows, DOM nodes quá nhiều sẽ làm browser chậm. Virtualization chỉ render visible rows, giảm DOM nodes từ 10,000 xuống còn ~20."

```tsx
// Với 10,000+ rows, chỉ render visible rows
import { useVirtualizer } from "@tanstack/react-virtual";

// Thay vì render tất cả:
{
  pageData.map((item) => <tr>...</tr>);
}

// Chỉ render visible rows:
const rowVirtualizer = useVirtualizer({
  count: pageData.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 48, // row height
});

{
  rowVirtualizer.getVirtualItems().map((virtualRow) => (
    <tr key={virtualRow.key} style={{ height: virtualRow.size }}>
      {/* render row */}
    </tr>
  ));
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                             | Cách trả lời                                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| "Virtualization hoạt động thế nào?" | "Chỉ render rows trong viewport + buffer. Khi scroll, recycle DOM nodes. 10k rows → ~30 DOM nodes."                     |
| "Có downsides gì không?"            | "Có: (1) Fixed row height hoặc cần estimate, (2) Ctrl+F browser không search được, (3) Screen readers có thể struggle." |
| "Khi nào KHÔNG nên dùng?"           | "Khi data < 1000 rows, overhead không đáng. Hoặc khi cần print/export toàn bộ table."                                   |
| "Libraries nào recommend?"          | "@tanstack/react-virtual lightweight. react-window cho simple cases. ag-grid cho enterprise features."                  |

---

**📊 Performance Comparison:**

```
┌─────────────────────────────────────────────────────────────────┐
│ PERFORMANCE BY DATA SIZE                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ < 100 rows: Basic implementation OK                             │
│ 100-1000 rows: Add useMemo                                      │
│ 1000-10000: Add debounce + useMemo                              │
│ > 10000 rows: Virtualization + server-side filtering            │
│                                                                 │
│ Server-side filtering recommended when:                         │
│ - Data > 10,000 rows                                            │
│ - Initial load time matters                                     │
│ - Data changes frequently                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## PHẦN B: TẠI SAO LÀM NHƯ VẬY? (Deep Dive)

> 💡 Phần này giải thích **lý do đằng sau** mỗi quyết định thiết kế - đây là những gì interviewer thực sự muốn nghe.

### 1. Tại Sao Filter TRƯỚC Sort và Paginate?

**💬 Cách giải thích cho interviewer:**

> "Thứ tự xử lý data là Filter → Sort → Paginate. Đây là thứ tự duy nhất đúng vì mỗi bước cần input từ bước trước."

**Phân tích chi tiết:**

```

┌─────────────────────────────────────────────────────────────────┐
│ ❌ SAI: Sort → Paginate → Filter │
├─────────────────────────────────────────────────────────────────┤
│ │
│ Dữ liệu gốc: 100 users │
│ ↓ │
│ Sort: [A, B, C, D, E, F, G, H, ... 100 users] (sorted) │
│ ↓ │
│ Paginate (page 1, size 5): [A, B, C, D, E] │
│ ↓ │
│ Filter (name contains "X"): [D] │
│ │
│ ⚠️ VẤN ĐỀ: │
│ - User X có thể nằm ở page 5, 6, 7... │
│ - Chỉ filter 5 items của page 1, bỏ sót 95 items! │
│ - Kết quả SAI - không tìm được tất cả matches │
│ │
├─────────────────────────────────────────────────────────────────┤
│ ✅ ĐÚNG: Filter → Sort → Paginate │
├─────────────────────────────────────────────────────────────────┤
│ │
│ Dữ liệu gốc: 100 users │
│ ↓ │
│ Filter (name contains "X"): [user_X1, user_X2, ..., user_X15] │
│ ↓ │
│ Sort: [user_X1, user_X2, ..., user_X15] (sorted by criteria) │
│ ↓ │
│ Paginate (page 1, size 5): [user_X1, user_X2, ..., user_X5] │
│ │
│ ✅ CORRECT: │
│ - Tất cả 100 users đều được filter │
│ - Chỉ matched users được sort và paginate │
│ - Page count chính xác (15 users / 5 = 3 pages) │
│ │
└─────────────────────────────────────────────────────────────────┘

```

**🤔 Follow-up questions:**

| Câu hỏi                                                        | Trả lời                                                                                                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Nếu data rất lớn (1M rows), filter client-side có vấn đề gì?" | "Với 1M rows, nên filter server-side. Client gửi filter params, server trả về filtered data. Như vậy giảm data transfer và tận dụng DB indexing." |
| "Tại sao không cache filtered/sorted data?"                    | "Có thể dùng useMemo. Nhưng trade-off là memory usage. Với small-medium data, re-compute mỗi render là acceptable."                               |

---

### 2. Tại Sao Reset Page Khi Filter Thay Đổi?

**💬 Cách giải thích:**

> "Khi filter thay đổi, tổng số results thay đổi, nên page count cũng thay đổi. Current page có thể không còn tồn tại."

**Ví dụ cụ thể:**

```

┌─────────────────────────────────────────────────────────────────┐
│ SCENARIO: User đang browse data │
├─────────────────────────────────────────────────────────────────┤
│ │
│ Bước 1: Initial state │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Total: 50 users, pageSize: 5 │ │
│ │ Total pages: 10 │ │
│ │ User navigated to: Page 7 │ │
│ └──────────────────────────────────────────────────────┘ │
│ │
│ Bước 2: User applies filter (name = "John") │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Filtered: 8 users match │ │
│ │ Total pages: 2 (ceil(8/5) = 2) │ │
│ └──────────────────────────────────────────────────────┘ │
│ │
│ Bước 3: Kết quả │
│ │
│ ❌ KHÔNG reset page: │
│ - Current page = 7 │
│ - Nhưng chỉ có 2 pages! │
│ - paginateData(data, page=7, size=5) │
│ - start = (7-1)\*5 = 30, end = 35 │
│ - Nhưng chỉ có 8 items → data.slice(30, 35) = [] │
│ - User thấy: EMPTY TABLE! 🔴 │
│ │
│ ✅ CÓ reset page = 1: │
│ - Current page = 1 │
│ - paginateData(data, page=1, size=5) │
│ - start = 0, end = 5 │
│ - data.slice(0, 5) = 5 first users │
│ - User thấy: 5 filtered users! ✅ │
│ │
└─────────────────────────────────────────────────────────────────┘

```

**Code pattern:**

```typescript
const handleFilterChange = (newFilters: Filters) => {
  setFilters(newFilters);
  setPage(1); // ⚠️ CRITICAL: Luôn reset về page 1
};

const handleSortChange = (field: string) => {
  setSortField(field);
  setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  setPage(1); // ⚠️ Cũng reset khi sort thay đổi
};

const handlePageSizeChange = (newSize: number) => {
  setPageSize(newSize);
  setPage(1); // ⚠️ Reset khi page size thay đổi
};
```

---

### 3. Tại Sao Dùng Object Thay Vì Array Cho Filters State?

**💬 Cách giải thích:**

> "Có 2 cách lưu filters: Array và Object. Object được chọn vì 3 lý do: O(1) lookup, dễ update, và tự động dedupe."

```
┌─────────────────────────────────────────────────────────────────┐
│  OPTION A: Array of Filters                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  const filters = [                                              │
│    { field: "name", type: "string", value: "John" },            │
│    { field: "age", type: "range", min: 25, max: 40 }            │
│  ];                                                             │
│                                                                 │
│  ❌ Problems:                                                   │
│  1. Lookup: O(n) - phải find() để tìm filter của column         │
│  2. Update phức tạp:                                            │
│     const idx = filters.findIndex(f => f.field === "name");     │
│     if (idx === -1) {                                           │
│       setFilters([...filters, newFilter]);                      │
│     } else {                                                    │
│       const copy = [...filters];                                │
│       copy[idx] = newFilter;                                    │
│       setFilters(copy);                                         │
│     }                                                           │
│  3. Có thể duplicate: 2 filters cho cùng 1 field                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  OPTION B: Object/Record (CHOSEN)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  const filters = {                                              │
│    "name": { type: "string", value: "John" },                   │
│    "age": { type: "range", min: 25, max: 40 }                   │
│  };                                                             │
│                                                                 │
│  ✅ Benefits:                                                   │
│  1. Lookup: O(1) - filters["name"]                              │
│  2. Update đơn giản:                                            │
│     setFilters({                                                │
│       ...filters,                                               │
│       [field]: newFilterValue                                   │
│     });                                                         │
│  3. Tự động đảm bảo 1 filter per column (key unique)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Tại Sao Dùng Discriminated Union Cho Filter Payload?

**💬 Cách giải thích:**

> "Discriminated Union là TypeScript pattern cho phép type narrowing an toàn. Property 'type' là discriminant."

```typescript
// ❌ KHÔNG dùng Discriminated Union
type FilterPayload = {
  value?: string | null;
  min?: number | null;
  max?: number | null;
};

// Vấn đề: Không biết filter này là string hay range
function processFilter(payload: FilterPayload) {
  if (payload.value) {
    // OK, nhưng payload.min có thể vẫn tồn tại?
    // TypeScript không giúp được
  }
}

// ✅ Discriminated Union
type FilterPayloadString = { type: "string"; value: string | null };
type FilterPayloadRange = {
  type: "range";
  min?: number | null;
  max?: number | null;
};
type FilterPayload = FilterPayloadString | FilterPayloadRange;

function processFilter(payload: FilterPayload) {
  if (payload.type === "string") {
    // TypeScript BIẾT payload là FilterPayloadString
    // payload.value ✅ (có)
    // payload.min ❌ (không tồn tại, TypeScript error)
  }

  if (payload.type === "range") {
    // TypeScript BIẾT payload là FilterPayloadRange
    // payload.min ✅ (có)
    // payload.value ❌ (không tồn tại, TypeScript error)
  }
}
```

**Lợi ích:**

1. **Type safety**: Không thể access property sai
2. **IDE autocomplete**: Chỉ suggest properties đúng
3. **Exhaustive checking**: TypeScript warning nếu không handle hết cases

---

### 5. Tại Sao Comparator Function Nằm Trong Column Definition?

**💬 Cách giải thích:**

> "Đây là Inversion of Control. DataTable không biết data structure, nên không thể tự sort. Consumer inject sort logic qua comparator."

```
┌─────────────────────────────────────────────────────────────────┐
│  PATTERN: Inversion of Control (IoC)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ Tight Coupling:                                             │
│  DataTable tự sort:                                             │
│  if (column === 'name') {                                       │
│    data.sort((a, b) => a.name.localeCompare(b.name))            │
│  } else if (column === 'age') {                                 │
│    data.sort((a, b) => a.age - b.age)                           │
│  }                                                              │
│  → DataTable phải biết về User, House, Product...               │
│  → Không reusable                                               │
│                                                                 │
│  ✅ Inversion of Control:                                       │
│  Consumer provides comparator:                                  │
│  const columns = [{                                             │
│    key: 'name',                                                 │
│    comparator: (a, b, dir) =>                                   │
│      dir === 'asc'                                              │
│        ? a.name.localeCompare(b.name)                           │
│        : b.name.localeCompare(a.name)                           │
│  }];                                                            │
│  DataTable just calls: column.comparator(a, b, sortDirection)   │
│  → DataTable không biết gì về data structure                    │
│  → Fully reusable cho bất kỳ data type                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## PHẦN C: COMMON MISTAKES & HOW TO FIX

> ⚠️ Những lỗi phổ biến khi implement DataTable, và cách interviewer muốn bạn nhận ra và fix chúng.

### Mistake 1: Mutate State Directly

```typescript
// ❌ WRONG: Mutate state directly
const handleFilterChange = (field: string, value: string) => {
  filters[field] = { type: "string", value }; // MUTATION!
  setFilters(filters); // Same reference → React không re-render
};

// ✅ CORRECT: Create new object
const handleFilterChange = (field: string, value: string) => {
  setFilters({
    ...filters, // Spread existing
    [field]: { type: "string", value }, // Override/add
  });
};
```

**Tại sao React không re-render khi mutate?**

- React dùng reference equality để check state change
- `Object.is(oldState, newState)` → true nếu cùng reference
- Phải tạo object mới để trigger re-render

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                   | Cách trả lời                                                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| "Shallow vs Deep copy?"   | "Spread operator là shallow copy. Nested objects vẫn share reference. Với nested, cần spread từng level."              |
| "Immer.js giúp gì?"       | "Immer cho phép write mutable code nhưng produce immutable result. Draft state looks mutable, actual state immutable." |
| "Performance của spread?" | "O(n) cho object keys. Với very large objects, có thể dùng Map hoặc restructure data."                                 |

---

### Mistake 2: Quên Reset Page

```typescript
// ❌ WRONG: Không reset page
const handleFilterChange = (newFilters: Filters) => {
  setFilters(newFilters);
  // Quên setPage(1)!
};

// ✅ CORRECT: Luôn reset
const handleFilterChange = (newFilters: Filters) => {
  setFilters(newFilters);
  setPage(1); // Reset về page 1
};
```

**Khi nào cần reset page?**

- Filter thay đổi
- Sort thay đổi
- Page size thay đổi

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                     | Cách trả lời                                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| "Có cách nào không cần reset manually?"     | "Có, dùng useEffect watch filteredData.length và tự adjust page nếu current page > maxPages." |
| "Reset page có gây flicker không?"          | "Không, React batches cả hai setState calls trong cùng event handler thành 1 re-render."      |
| "Nếu muốn giữ page khi filter narrow down?" | "Có thể: `setPage(Math.min(page, newMaxPages))` để giữ page nếu vẫn valid."                   |

### Mistake 3: Filter/Sort SAU Paginate

```typescript
// ❌ WRONG: Order sai
const { pageData } = paginateData(data, page, pageSize); // Paginate trước
const filtered = filterData(pageData, filters); // Filter sau → sai!
const sorted = sortData(filtered, columns, sortField, sortDirection);

// ✅ CORRECT: Filter → Sort → Paginate
const filtered = filterData(data, filters);
const sorted = sortData(filtered, columns, sortField, sortDirection);
const { pageData } = paginateData(sorted, page, pageSize);
```

---

### Mistake 4: Case-Sensitive String Matching

```typescript
// ❌ WRONG: Case-sensitive
const match = value.includes(filterValue);
// "John" vs "john" → false

// ✅ CORRECT: Case-insensitive
const match = String(value).toLowerCase().includes(filterValue.toLowerCase());
// "John".toLowerCase() includes "john" → true
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                    | Cách trả lời                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| "Khi nào cần case-sensitive?"              | "User IDs, codes, technical identifiers. User-facing text như name, description nên case-insensitive." |
| "toLowerCase có handle Unicode tốt không?" | "Basic Latin OK. Với Turkish 'ı' vs 'I', cần toLocaleLowerCase('tr') để correct."                      |

---

### Mistake 5: Mất Min Khi Update Max (và ngược lại)

```typescript
// ❌ WRONG: Không giữ lại giá trị khác
onFilterChange({
  ...filters,
  [field]: {
    type: "range",
    max: newMax, // min bị mất!
  },
});

// ✅ CORRECT: Spread filterData để giữ lại
onFilterChange({
  ...filters,
  [field]: {
    ...filterData, // Giữ lại min (hoặc max)
    type: "range",
    max: newMax,
  },
});
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                             | Cách trả lời                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| "Làm sao track cả min và max?"      | "Single state object với cả hai fields. Update partial với spread."                 |
| "Có thể validate min <= max không?" | "Có, trong handleChange: `if (newMax < currentMin) setError('Max must be >= min')`" |

---

### Mistake 6: Dùng `||` Thay Vì `??` Cho Numeric Values

```typescript
// ❌ WRONG: 0 bị coi là falsy
const currentMin = filterData?.min || "";
// Nếu min = 0 → 0 || '' = '' → mất giá trị 0!

// ✅ CORRECT: Chỉ check null/undefined
const currentMin = filterData?.min ?? "";
// Nếu min = 0 → 0 ?? '' = 0 → giữ được giá trị 0
```

**Sự khác biệt:**

- `||` (OR): falsy values (false, 0, '', null, undefined, NaN)
- `??` (Nullish Coalescing): chỉ null và undefined

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                   | Cách trả lời                                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- | --- | ------------------------------------- | --- | ------------------------------------ |
| "Có thể combine ?? và                     |                                                                                                     | ?"  | "Có, nhưng cần parentheses: `(a ?? b) |     | c`. Không được mix không có parens." |
| "Optional chaining ?. với ?? khác gì ?.?" | "?. return undefined nếu null/undefined. ?? provide default value. Chain: `obj?.prop ?? 'default'`" |

---

### Mistake 7: Array.sort() Mutates Original

```typescript
// ❌ WRONG: Mutate original data
function sortData<T>(data: T[], comparator: Function): T[] {
  return data.sort((a, b) => comparator(a, b));
  // data array bị mutate!
}

// ✅ CORRECT: Create copy first
function sortData<T>(data: T[], comparator: Function): T[] {
  return data.slice().sort((a, b) => comparator(a, b));
  // hoặc: [...data].sort(...)
  // hoặc: data.toSorted(...) (ES2023)
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                | Cách trả lời                                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| "slice() vs spread [...] performance?" | "Nearly identical. slice() slightly faster với very large arrays. Cả hai O(n)."                      |
| "toSorted() browser support?"          | "Chrome 110+, Firefox 115+, Safari 16+. Cần polyfill cho older browsers."                            |
| "Array methods nào mutate?"            | "push, pop, shift, unshift, splice, sort, reverse. Immutable: map, filter, slice, concat, toSorted." |

---

## PHẦN D: INTERVIEW TIPS & TALKING POINTS

> 🎯 Những điểm quan trọng cần nhấn mạnh khi trình bày solution trong interview.

### 1. Cách Mở Đầu (First 2 Minutes)

**Làm:**

```

"Trước khi code, tôi muốn clarify một vài điểm:

1. Data size - khoảng bao nhiêu rows? Vì nếu > 10k rows,
   nên filter server-side
2. Filter logic - AND hay OR giữa các columns?
3. Có cần URL state sync không? Để user có thể share filtered view?"

```

**Đừng:**

```

"OK, để tôi bắt đầu code ngay..."
→ Interviewer muốn thấy bạn think before code

```

---

### 2. Khi Thiết Kế Types

**Talking points:**

- "Types là API contract - người dùng component hiểu ngay cách dùng"
- "Discriminated Union cho type safety khi xử lý filter types"
- "Generic T để component fully reusable"
- "ReadonlyArray prevent accidental mutation"

---

### 3. Khi Viết Filter Logic

**Talking points:**

- "Filter trước Sort trước Paginate - thứ tự quan trọng"
- "AND logic - row phải pass tất cả filters"
- "Case-insensitive để UX tốt hơn"
- "Empty filter = không filter (không return 0 results)"

---

### 4. Khi Viết Component

**Talking points:**

- "Controlled components - parent là single source of truth"
- "Reset page khi filter/sort thay đổi để tránh empty page"
- "Separation of concerns - utility functions cho logic, component cho UI"

---

### 5. Khi Hoàn Thành

**Nói về extensions:**

```

"Nếu có thêm thời gian, tôi sẽ add:

1. useMemo cho filteredData/sortedData - avoid re-computation
2. Debounce cho filter input - avoid filtering every keystroke
3. URL state sync - shareable links với current filters
4. Virtualization nếu data lớn - chỉ render visible rows
5. Server-side filtering nếu data rất lớn"

```

---

### 6. Handle Follow-up Questions

| Question                               | Good Answer                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| "Performance với 10k rows?"            | "Client-side OK. Với 100k+, cần virtualization (react-virtual) hoặc server-side filtering."                                 |
| "Làm sao add thêm filter type mới?"    | "Add type mới vào FilterPayload union, update HeaderFilterInput để render UI mới, update filterData để handle logic mới."   |
| "Testing strategy?"                    | "Unit test cho filterData, sortData (pure functions, easy to test). Integration test cho DataTable với mock data."          |
| "Accessibility?"                       | "aria-label cho inputs, keyboard navigation, screen reader cho sort direction."                                             |
| "Làm sao handle async data?"           | "Wrap DataTable với loading state. Dùng React Query/SWR cho data fetching. DataTable chỉ nhận data prop, không care nguồn." |
| "Race condition khi filter + fetch?"   | "Dùng AbortController hoặc React Query. Cancel previous request khi user type tiếp."                                        |
| "Làm sao implement multi-column sort?" | "Thay sortField bằng sortFields array. Comparator chain: first column → second column nếu first equal."                     |
| "Column reordering?"                   | "Drag-and-drop với react-beautiful-dnd. Store column order trong state, reorder array on drop."                             |

---

### 7. Red Flags - Những Điều KHÔNG Nên Làm

| ❌ Don't                         | ✅ Do Instead                        |
| -------------------------------- | ------------------------------------ |
| Code ngay không hỏi requirements | Clarify requirements trước 2-3 phút  |
| Mutate state/props trực tiếp     | Always create new objects với spread |
| Hardcode values                  | Dùng constants hoặc props            |
| Ignore edge cases                | Mention edge cases và handle chúng   |
| Over-engineer solution           | Start simple, mention improvements   |
| Silent coding                    | Think aloud, explain decisions       |

---

### 8. Time Management (45 min interview)

```

┌─────────────────────────────────────────────────────────────────┐
│ INTERVIEW TIMELINE │
├─────────────────────────────────────────────────────────────────┤
│ │
│ 0-5 min: Clarify requirements │
│ ├── Data size? Filter types? Sort requirements? │
│ └── "Before coding, I'd like to understand..." │
│ │
│ 5-10 min: High-level design │
│ ├── Component structure │
│ ├── Data flow: Filter → Sort → Paginate │
│ └── Type definitions (just signatures) │
│ │
│ 10-35 min: Implementation (focus) │
│ ├── Types first (5 min) │
│ ├── Pure functions (10 min) │
│ └── React component (10 min) │
│ │
│ 35-40 min: Testing & edge cases │
│ ├── Walk through code │
│ └── Mention edge cases │
│ │
│ 40-45 min: Improvements & Q&A │
│ ├── Performance optimizations │
│ ├── Accessibility │
│ └── Answer follow-up questions │
│ │
└─────────────────────────────────────────────────────────────────┘

```

---

### 9. Scoring Criteria (What Interviewers Look For)

| Criteria                | Weight | What They Look For                                          |
| ----------------------- | :----: | ----------------------------------------------------------- |
| **Problem Solving**     |  25%   | Clarify requirements, break down problem, handle edge cases |
| **Code Quality**        |  25%   | Clean code, proper naming, separation of concerns           |
| **Technical Knowledge** |  20%   | React patterns, TypeScript, performance awareness           |
| **Communication**       |  20%   | Think aloud, explain decisions, respond to feedback         |
| **Speed**               |  10%   | Complete working solution in time                           |

**Notes:**

- Interviewers prefer "incomplete but excellent" over "complete but messy"
- Asking good questions shows senior thinking
- Mentioning trade-offs shows experience

## PHẦN E: QUICK REFERENCE & CHEAT SHEET

### Type Definitions

```typescript
export type SortDirection = "asc" | "desc";

export type FilterPayloadString = {
  type: "string";
  value: string | null;
};

export type FilterPayloadRange = {
  type: "range";
  min?: number | null;
  max?: number | null;
};

export type Filters = Record<string, FilterPayloadString | FilterPayloadRange>;

export type ColumnDef<T> = {
  label: string;
  key: string;
  renderCell: (row: T) => React.ReactNode;
  comparator: (a: T, b: T, direction: SortDirection) => number;
  filterType: "string" | "range" | null;
};

export type Columns<T> = ReadonlyArray<ColumnDef<T>>;
```

### Data Pipeline

```typescript
// Always in this order: Filter → Sort → Paginate
const filteredData = filterData(data, filters);
const sortedData = sortData(filteredData, columns, sortField, sortDirection);
const { pageData, maxPages } = paginateData(sortedData, page, pageSize);
```

### Filter Function

```typescript
function filterData<T>(data: T[], filters: Filters): T[] {
  return data.filter((row) => {
    return Object.entries(filters)
      .map(([key, payload]) => {
        const value = (row as any)[key];

        if (payload.type === "string") {
          if (!payload.value) return true;
          return String(value)
            .toLowerCase()
            .includes(payload.value.toLowerCase());
        }

        if (payload.type === "range") {
          if (payload.min != null && value < payload.min) return false;
          if (payload.max != null && value > payload.max) return false;
          return true;
        }

        return true;
      })
      .every(Boolean);
  });
}
```

### State Management Pattern

```typescript
// State
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(5);
const [sortField, setSortField] = useState<string | null>(null);
const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
const [filters, setFilters] = useState<Filters>({});

// Handlers - always reset page!
const handleFilterChange = (newFilters: Filters) => {
  setFilters(newFilters);
  setPage(1); // CRITICAL!
};

const handleSort = (key: string) => {
  if (sortField !== key) {
    setSortField(key);
    setSortDirection("asc");
  } else {
    setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
  }
  setPage(1); // CRITICAL!
};
```

### Immutable Update Patterns

```typescript
// Update string filter
setFilters({
  ...filters,
  [field]: { type: "string", value: newValue },
});

// Update range filter (keep other value)
setFilters({
  ...filters,
  [field]: {
    ...filters[field], // Keep existing min/max
    type: "range",
    min: newMin, // or max: newMax
  },
});
```

---

## PHẦN F: PRACTICE EXERCISES (với Solutions)

### Exercise 1: Add "exact match" Filter Type

**Đề bài:** Extend the implementation để support exact string matching (không phải substring).

**💡 Solution:**

```typescript
// 1. Add new filter type
type FilterPayloadExact = {
  type: "exact";
  value: string | null;
};

type FilterPayload =
  | FilterPayloadString
  | FilterPayloadRange
  | FilterPayloadExact;

// 2. Update filterData
function filterData<T>(data: T[], filters: Filters): T[] {
  return data.filter((row) => {
    return Object.entries(filters)
      .map(([key, payload]) => {
        const value = (row as any)[key];

        if (payload.type === "string") {
          if (!payload.value) return true;
          return String(value)
            .toLowerCase()
            .includes(payload.value.toLowerCase());
        }

        // NEW: Exact match
        if (payload.type === "exact") {
          if (!payload.value) return true;
          return String(value).toLowerCase() === payload.value.toLowerCase();
        }

        if (payload.type === "range") {
          if (payload.min != null && value < payload.min) return false;
          if (payload.max != null && value > payload.max) return false;
          return true;
        }

        return true;
      })
      .every(Boolean);
  });
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                    | Cách trả lời                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| "Khi nào dùng exact vs substring?"         | "Exact cho dropdown/select values, IDs, status. Substring cho free-text search như name, description." |
| "Có cần case-sensitive exact match không?" | "Tùy use case. User IDs thường case-sensitive. Status values có thể case-insensitive."                 |

---

### Exercise 2: Add "OR" Logic Between Filters

**Đề bài:** Currently filters are AND (all must match). Add option for OR (any can match).

**💡 Solution:**

```typescript
type FilterLogic = "AND" | "OR";

function filterData<T>(
  data: T[],
  filters: Filters,
  logic: FilterLogic = "AND",
): T[] {
  return data.filter((row) => {
    const results = Object.entries(filters).map(([key, payload]) => {
      // ... same filter logic as before
      return matchResult;
    });

    // KEY DIFFERENCE
    return logic === "AND"
      ? results.every(Boolean) // All must be true
      : results.some(Boolean); // At least one true
  });
}

// Usage
const filteredData = filterData(data, filters, "OR");
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                      | Cách trả lời                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| "every vs some performance?" | "Cả hai short-circuit. every stops at first false, some stops at first true. Same O(n) worst case."                       |
| "Làm sao combine AND và OR?" | "Cần nested structure: groups of filters với OR between groups, AND within groups. Như SQL WHERE (a AND b) OR (c AND d)." |

---

### Exercise 3: Add Clear All Filters Button

**Đề bài:** Add a button that clears all active filters at once.

**💡 Solution:**

```tsx
// In DataTable component
const hasActiveFilters = Object.keys(filters).length > 0;

const handleClearFilters = () => {
  setFilters({});
  setPage(1); // Reset page khi clear filters
};

// In render
{
  hasActiveFilters && (
    <button onClick={handleClearFilters} className="clear-filters-btn">
      Clear All Filters ({Object.keys(filters).length})
    </button>
  );
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                             | Cách trả lời                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------ | --- | ----- | --- | --------------- |
| "Tại sao check hasActiveFilters?"   | "UX tốt hơn - không show button khi không có gì để clear. Tránh confuse user." |
| "Làm sao count chỉ active filters?" | "Filter entries có value: `Object.entries(filters).filter(([_, v]) => v.value  |     | v.min |     | v.max).length`" |

---

### Exercise 4: Persist Filters to URL

**Đề bài:** Use `useSearchParams` to sync filters with URL query params.

**💡 Solution:**

```tsx
import { useSearchParams } from "react-router-dom";

function useFilterUrl() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL
  const filters = useMemo(() => {
    const filtersParam = searchParams.get("filters");
    if (!filtersParam) return {};
    try {
      return JSON.parse(decodeURIComponent(filtersParam));
    } catch {
      return {};
    }
  }, [searchParams]);

  // Update URL when filters change
  const setFilters = useCallback(
    (newFilters: Filters) => {
      const params = new URLSearchParams(searchParams);
      if (Object.keys(newFilters).length > 0) {
        params.set("filters", encodeURIComponent(JSON.stringify(newFilters)));
      } else {
        params.delete("filters");
      }
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  return { filters, setFilters };
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                               | Cách trả lời                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| "URL có limit length không?"          | "Có, ~2000 chars cho safe cross-browser. Với complex filters, cần compress hoặc chỉ store essential params." |
| "Browser back/forward có work không?" | "Có, đó là benefit chính của URL state. User có thể navigate history của filter changes."                    |
| "SEO implications?"                   | "Có thể tốt cho SEO nếu filtered views là valuable content. Cần canonical URL strategy."                     |

---

### Exercise 5: Add Debounce to Filter Input

**Đề bài:** Use `useDeferredValue` or custom debounce to delay filtering.

**💡 Solution:**

```tsx
// Option 1: useDeferredValue (React 18+)
function DataTable({ data, columns }) {
  const [filters, setFilters] = useState({});
  const deferredFilters = useDeferredValue(filters);

  // Use deferredFilters cho expensive operations
  const filteredData = useMemo(
    () => filterData(data, deferredFilters),
    [data, deferredFilters],
  );

  // Show loading indicator khi có pending update
  const isStale = filters !== deferredFilters;

  return (
    <div style={{ opacity: isStale ? 0.7 : 1 }}>{/* table content */}</div>
  );
}

// Option 2: Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const debouncedFilters = useDebounce(filters, 300);
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                            | Cách trả lời                                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| "useDeferredValue vs debounce?"    | "useDeferredValue là React-managed, integrates với Concurrent Mode. Debounce là timer-based, more predictable delay." |
| "Delay bao nhiêu là tối ưu?"       | "200-300ms cho typing. Fast enough user không notice, slow enough giảm computation."                                  |
| "Memory leak với useEffect timer?" | "Cleanup function clearTimeout prevents leak. Quan trọng khi component unmounts hoặc deps change."                    |

---

### Exercise 6: Multi-Select Filter (Bonus)

**Đề bài:** Implement filter cho multiple selected values (like checkboxes).

**💡 Solution:**

```typescript
type FilterPayloadMultiSelect = {
  type: "multiselect";
  values: string[];
};

// In filterData
if (payload.type === "multiselect") {
  if (payload.values.length === 0) return true;
  return payload.values.includes(String(value));
}

// UI Component
function MultiSelectFilter({ options, selected, onChange }) {
  return (
    <div className="multi-select">
      {options.map(opt => (
        <label key={opt}>
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...selected, opt]);
              } else {
                onChange(selected.filter(s => s !== opt));
              }
            }}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                             | Cách trả lời                                                            |
| ----------------------------------- | ----------------------------------------------------------------------- |
| "Performance với nhiều checkboxes?" | "React.memo cho individual checkboxes. Virtualize nếu >100 options."    |
| "Làm sao get distinct options?"     | "`[...new Set(data.map(d => d.status))]` để get unique values từ data." |

---

## BONUS: Interview Cheat Sheet

### Khi Bị Stuck

```
"Tôi cần một chút thời gian để think through this..."
→ Interviewer sẽ cho bạn thời gian hoặc hint

"Approach của tôi là X, nhưng tôi đang consider Y vì..."
→ Shows you're thinking about trade-offs

"Tôi sẽ simplify bằng cách assume Z trước..."
→ Shows you can scope problems
```

### Key Phrases to Use

| Situation    | Say This                                                    |
| ------------ | ----------------------------------------------------------- |
| Starting     | "Before coding, let me clarify requirements..."             |
| Design       | "I'm thinking of a structure like this... does that align?" |
| Trade-off    | "The trade-off here is X vs Y, I'll go with X because..."   |
| Edge case    | "Edge case to consider: what if..."                         |
| Optimization | "This works, but for scale we could..."                     |
| Wrapping up  | "Given more time, I would add..."                           |

---

## BONUS 2: Advanced Q&A - React & Performance

### React Core Concepts

| Câu hỏi                                   | Cách trả lời                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| "React reconciliation hoạt động thế nào?" | "Virtual DOM diffing. React compare old và new trees, calculate minimal DOM operations. Keys giúp identify elements across renders." |
| "Fiber architecture là gì?"               | "React 16+ internal rewrite. Allows interruptible rendering, priority-based work scheduling. Enables Suspense, Concurrent Mode."     |
| "useCallback vs useMemo?"                 | "useCallback memoize function reference. useMemo memoize computed value. useCallback(fn, deps) = useMemo(() => fn, deps)."           |
| "Tại sao không nên dùng index làm key?"   | "Khi list thay đổi (add/remove/reorder), index-based key gây incorrect element reuse. State bị lẫn giữa items."                      |
| "Strict Mode render 2 lần để làm gì?"     | "Detect side effects trong render phase. Development only. Giúp find bugs với non-idempotent effects."                               |

### React Performance

| Câu hỏi                        | Cách trả lời                                                                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| "React.memo khi nào nên dùng?" | "Khi component render expensive và props thường unchanged. Không dùng cho primitives hoặc components render nhanh."                            |
| "Props drilling vs Context?"   | "Drilling: explicit, easy to track. Context: cleaner for deep trees nhưng re-renders all consumers. Có thể combine: context cho rare changes." |
| "Lazy loading components?"     | "`React.lazy(() => import('./Heavy'))` với Suspense fallback. Splits bundle, loads on demand."                                                 |
| "State colocation là gì?"      | "Đặt state gần nhất với component cần nó. Tránh lifting too high gây unnecessary re-renders."                                                  |
| "Profiler tab cho thấy gì?"    | "Render duration, why component rendered (props/state/context change), flame graph của component tree."                                        |

### TypeScript Patterns

| Câu hỏi                   | Cách trả lời                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| "unknown vs any?"         | "unknown là type-safe any. Phải narrow type trước khi dùng. any bypasses all type checking."             |
| "Utility types hay dùng?" | "Partial<T>, Required<T>, Pick<T,K>, Omit<T,K>, Record<K,V>, ReturnType<F>, Parameters<F>."              |
| "as const để làm gì?"     | "Const assertion. ['a', 'b'] as const → readonly tuple với literal types, không phải string[]."          |
| "satisfies operator?"     | "TypeScript 4.9+. `obj satisfies Type` validates type nhưng giữ narrower inferred type."                 |
| "Generic constraints?"    | "`function fn<T extends Base>(x: T)` đảm bảo T có properties của Base. Có thể chain: `T extends A & B`." |

### JavaScript Fundamentals

| Câu hỏi                         | Cách trả lời                                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| "Event loop hoạt động thế nào?" | "Single-threaded. Microtasks (Promise) → render → macrotasks (setTimeout). Call stack → task queue → microtask queue." |
| "Closure là gì?"                | "Function + its lexical scope. Inner function access outer function's variables even after outer returns."             |
| "Prototype chain?"              | "Object inheritance. obj.**proto** → Constructor.prototype → Object.prototype → null. Method lookup traverses chain."  |
| "WeakMap vs Map?"               | "WeakMap keys phải là objects, không prevent GC. Dùng cho private data, caching without memory leaks."                 |
| "Promise.all vs allSettled?"    | "all: fail-fast, rejects on first error. allSettled: waits for all, returns {status, value/reason} for each."          |

### Data Structures for DataTable

| Câu hỏi                                | Cách trả lời                                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| "Tại sao filter trước sort?"           | "Filter reduces dataset size. Sorting smaller dataset = faster. O(n log n) on smaller n."                              |
| "Binary search có áp dụng được không?" | "Chỉ nếu data sorted và search exact value. Với substring search, phải linear O(n)."                                   |
| "Indexing strategies?"                 | "Pre-compute indexes: `{name: {john: [id1, id2], jane: [id3]}}`. O(1) lookup, O(n) memory trade-off."                  |
| "Có thể cache filtered results không?" | "Có, dùng memoization với filter params làm key. LRU cache nếu memory limited."                                        |
| "Pagination: offset vs cursor?"        | "Offset: simple, allows jump. Cursor: faster for deep pages, stable với data changes. Cursor tốt cho infinite scroll." |

---

## BONUS 3: System Design Q&A

### Scaling DataTable

| Câu hỏi                          | Cách trả lời                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| "Design cho 1M rows?"            | "Server-side: filter/sort/paginate ở backend với DB indexes. Client chỉ render current page. Caching layer optional." |
| "Real-time updates?"             | "WebSocket cho live data. Optimistic updates cho user actions. Reconcile với server state."                           |
| "Multiple DataTables cùng page?" | "Shared context cho common config. Separate state per table. Lazy render off-screen tables."                          |
| "Export to CSV với large data?"  | "Streaming export: server generates CSV, streams to download. Client-side chỉ cho small datasets."                    |
| "Undo/Redo cho edits?"           | "Command pattern: stack of actions. Each action has do/undo. Limit stack size for memory."                            |

### Error Handling

| Câu hỏi                         | Cách trả lời                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| "Error boundary cho DataTable?" | "Wrap table trong ErrorBoundary. Graceful fallback UI. Log error cho debugging."           |
| "Handle API errors?"            | "Loading → Error → Success states. Retry button. Toast notification cho transient errors." |
| "Validate filter input?"        | "Debounce + validation. Range: min <= max. String: max length. Show inline errors."        |
| "Data inconsistency?"           | "Version/ETag checking. Conflict resolution UI nếu data changed by others."                |

---

## BONUS 4: Behavioral Questions

### Communication

| Câu hỏi                            | Cách trả lời                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| "Làm sao estimate task này?"       | "Break down: types (30min), filter logic (45min), component (1h), testing (30min). Buffer 20% cho unknowns." |
| "Nếu deadline tight?"              | "Prioritize MVP features. Cut nice-to-haves. Communicate trade-offs early. Propose phased delivery."         |
| "Colleague disagree với approach?" | "Understand their concern. Find common ground. Prototype both if time permits. Data-driven decision."        |
| "How do you stay updated?"         | "Tech blogs, Twitter/X, conferences. Side projects để try new things. Code review để learn từ team."         |

---

_Cập nhật: Tháng 2, 2026_
